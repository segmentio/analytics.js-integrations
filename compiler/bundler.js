var browserify = require('browserify');
var fs = require('fs');
var path = require('path');
var through = require('through2');

var browserifyOpts = {
  insertGlobalVars: {
    global: () => {
      return (
        'typeof window !== "undefined" && window.document && window.document.implementation ? window : ' +
        'typeof global !== "undefined" ? global : ' +
        'typeof self !== "undefined" ? self : {}'
      );
    }
  }
};

/**
 * Wraps the integration code in a template that allows to render a no-op integration
 * if it's disabled.
 *
 * @param {String} name Integration name (ex. Adobe Analytics)
 * @param {String} source Javascript source code that implements the integration
 *
 * @returns {String} The EJS template for the provided integration.
 */
function wrapIntegrationInTemplate(name, source) {
  return `
'<% if (enabled["${name}"]) { %>'
${source}
'<% } else { %>'
var integration = require('@segment/analytics.js-integration');
module.exports = function() {};
module.exports.Integration = integration('empty');
'<% } %>'
`;
}

/**
 * Holy shit.
 *
 * Extracts the name of the integration from the source code.
 * @param {String} source Integration source code
 *
 * @throws Error when the error is not found.
 * @returns {String} The name of the destination.
 */
function extractName(source) {
  var matches = /integration\(['"]([^'"]+)['"]\)/.exec(source);
  var name = matches[1];

  if (!name) {
    throw new Error('Unable to extract integration name');
  }

  return name;
}

/**
 * Writes the source code in a temporary file for browserify.
 *
 * @async
 * @param {String} fileName File name.
 * @param {String} source Javascript source code.
 *
 * @returns {String} The name of the temporary file.
 */
async function toFile(fileName, source) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, source, err => {
      if (err) {
        reject(err);
      } else {
        resolve(fileName);
      }
    });
  });
}

/**
 * Bundles all dependencies as a single file, compatible with a browser, and returns the file name.
 *
 * @async
 * @param {String} source Rendered Javascript source code.
 * @param {Object} integrations A map with the integration name as key and the package.json object as value.
 * @param {String} buildName Optional. Build name. It will be appended to the files.
 *
 * @return {String} Name of the file containing the code compiled to work in a browser.
 */
async function bundle(source, integrations, buildName) {
  try {
    fs.mkdirSync(path.join(__dirname, 'builds'));
  } catch (e) {
    // Ignoring errors
  }

  var build = buildName || `${Math.floor(new Date() / 1000)}`;
  var fileName = path.join(__dirname, 'builds', `analytics-${build}.js`);
  var tmpFile = path.join(__dirname, `ajs-rendered-${build}.tmp`);
  var templateFile = await toFile(tmpFile, source);
  var integrationVersions = {};
  var integrationFiles = {};

  for (let integration in integrations) {
    var pkg = integrations[integration];
    var file = fs.realpathSync(require.resolve(pkg.name));
    integrationFiles[file] = pkg;
  }

  return new Promise((resolve, reject) => {
    var b = browserify(templateFile, browserifyOpts);

    // Wrap the integrations in the conditional template
    b.pipeline.get('emit-deps').push(
      through.obj(function(dependency, _, next) {
        var realPath = fs.realpathSync(dependency.file);
        var pkg = integrationFiles[realPath];
        if (pkg) {
          let name;
          try {
            name = extractName(dependency.source);
          } catch (e) {
            console.log(`Unable to find integration name for ${pkg.name}`);
            reject(e);
            return;
          }

          if (integrationVersions[name]) {
            reject(new Error(`Duplicate integrationName ${name}`));
            return;
          }

          dependency.source = wrapIntegrationInTemplate(
            name,
            dependency.source
          );
          integrationVersions[name] = pkg.version;
        }

        this.push(dependency);
        next();
      })
    );

    // Mask the non-global `define` variable from any module within the built
    // script. This prevents any modules with a built-in UMD snippet from seeing the
    // global `define` unless explicitly addressing `window.define`. This hack is
    // necessary to make e.g. JSON3 not load through RequireJS.
    b.pipeline.get('wrap').push(
      (function() {
        var prefix =
          '(function(define){if(typeof define==="function"&&define.amd){define=undefined;}';
        var suffix = '}(window.define));';
        let firstChunk = true;

        var stream = through(
          function(chunk, _, next) {
            if (firstChunk) {
              this.push(new Buffer(prefix));
              firstChunk = false;
            }

            this.push(chunk);
            next();
          },
          function(next) {
            this.push(new Buffer(suffix));
            next();
          }
        );

        stream.label = 'amd-maskify';

        return stream;
      })()
    );

    b.bundle((err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString('utf8'));
      }
    });
  })
    .then(code => {
      return toFile(fileName, code);
    })
    .then(() => {
      // If everything is ok, we don't need the tmp file.
      fs.unlinkSync(tmpFile);
      return fileName;
    });
}

module.exports = bundle;
