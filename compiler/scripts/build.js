#!/usr/bin/env node

/*
 * Module dependencies.
 */

var browserify = require('browserify');
var fs = require('fs');
var minify = require('uglify-js').minify;
var mkdirp = require('mkdirp');
var path = require('path');
var through = require('through2');

var coreVersion = require('@segment/analytics.js-core/package').version;

var dequoteTemplateStrings = function (source) {
  return source
    .replace(/['"]<%/g, '<%')
    .replace(/%>['"]/g, '%>')
    .replace(/['"]<%-\s*(integrations|plan|versions)\s*%>['"]/g, '<%- $1 %>');
};

function bundle(entry, fn) {
  // This holds a map of integrationName -> version
  // e.g. {
  //   "Mixpanel": "2.0.0",
  //   "Segment.io": "3.0.0",
  //   ...
  // }
  var integrationMap = {};

  var integrations = Object.keys(require('../package').dependencies)
  .filter(function(name) {
    return (/^@segment\/analytics.js-integration-/).test(name);
  });

  var lookup = integrations.reduce(function (acc, name) {
    acc[fs.realpathSync(require.resolve(name))] = require(path.join(__dirname, '../node_modules/', name, '/package.json'));
    return acc;
  }, {});
  
  var b = browserify(entry, {
    insertGlobalVars: {
      global: function() {
        return 'typeof window !== "undefined" && window.document && window.document.implementation ? window : '
        + 'typeof global !== "undefined" ? global : '
        + 'typeof self !== "undefined" ? self : {}';
      }
    }
  });
  
  b.pipeline.get('emit-deps').push(through.obj(function (dep, enc, next) {
    // Wrap all integration entrypoints in a template conditional
    if (lookup[dep.file]) {
      var matches = (/integration\(['"]([^'"]+)['"]\)/).exec(dep.source);
      var name = matches[1];

      if (!name) {
        throw new Error(`Unable to extract integration name from ${dep.file}`);
      }

      if (integrationMap.hasOwnProperty(name)) {
        throw new Error(`Duplicate integrationName ${name}`);
      }

      var pkg = lookup[dep.file];
      integrationMap[name] = pkg.version;
    }

    this.push(dep);
    next();
  }));

  // Mask the non-global `define` variable from any module within the built
  // script. This prevents any modules with a built-in UMD snippet from seeing the
  // global `define` unless explicitly addressing `window.define`. This hack is
  // necessary to make e.g. JSON3 not load through RequireJS.
  b.pipeline.get('wrap').push((function() {
    var prefix = '(function(define){if(typeof define==="function"&&define.amd){define=undefined;}';
    var suffix = '}(window.define));';
    var firstChunk = true;

    var stream = through(function(chunk, encoding, next) {
      if (firstChunk) {
        this.push(new Buffer(prefix));
        firstChunk = false;
      }

      this.push(chunk);
      next();
    }, function(next) {
      this.push(new Buffer(suffix));
      next();
    });

    stream.label = 'amd-maskify';

    return stream;
  }()));

  b.bundle(function (err, buf) {
    if (err) {
      throw err;
    }
    
    var src = buf.toString('utf8');
    
    fn(dequoteTemplateStrings(src), integrationMap);
  });
}

module.exports = (fn) => {
  bundle(`${__dirname}/../lib/index.js`, function (src, integrationMap) {
    fn(src, integrationMap, coreVersion)
  })
}
