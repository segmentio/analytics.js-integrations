var ejs = require('ejs');
var fs = require('fs');
var path = require('path');
var request = require('request');
var bundle = require('./bundler');
var express = require('express');
var PORT = 3000;

var coreVersion = require('@segment/analytics.js-core/package').version;

/**
 * Reads all integrations from the `../integrations` folder.
 *
 * @returns {Object} A map containing the package of each integration NPM module.
 */
function readIntegrationsPackages() {
  var destinationsDirectory = path.join(__dirname, '..', 'integrations');
  var files = fs.readdirSync(destinationsDirectory);
  var integrations = {};

  for (var file of files) {
    var filePath = path.join(destinationsDirectory, file);

    var stats = fs.statSync(filePath);
    if (stats.isDirectory) {
      var packagePath = path.join(filePath, 'package.json');
      if (fs.existsSync(packagePath)) {
        var packageData = fs.readFileSync(packagePath);
        var packageInfo = JSON.parse(packageData);
        packageInfo.slug = packageInfo.name
          .toLowerCase()
          .replace(/^@segment\/analytics.js-integration-/g, '');
        integrations[packageInfo.slug] = packageInfo;
      }
    }
  }

  return integrations;
}

/**
 * Retrieves the settings for the provided Segment Write Key.
 *
 * @async
 * @param {String} writeKey A valid Segment Write Key (ex. dhLxf5GwJwaDHt7MBo80V7Yb0PV6FT5H)
 *
 * @throws {Error} for any network/request error.
 * @returns {Object} Source settings.
 */
async function getSourceSettings(writeKey) {
  var url = `http://cdn.segment.com/v1/projects/${writeKey}/settings`;
  return new Promise((resolve, reject) => {
    request.get({ url: url, gzip: true }, (err, _, body) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(body));
      }
    });
  });
}

/**
 * Retuns the integrations enabled for the provided source settings.
 *
 * @param {Object} settings Source settings.
 * @param {Object} availableIntegrations A map containing the package of each integration NPM module.
 *
 * @returns {Object} A map containing the package of each enabled integration.
 */
function getEnabledIntegrations(settings, availableIntegrations) {
  var integrations = settings.integrations || {};
  var enabledIntegrations = {};

  for (var name in integrations) {
    var slug = getSlug(name);
    if (availableIntegrations[slug]) {
      enabledIntegrations[slug] = availableIntegrations[slug];
    }
  }

  // This destination does not exist anymore.
  delete enabledIntegrations['tell-apart'];

  return enabledIntegrations;
}

/**
 * Renders the template, injecting the source settings.
 *
 * @param {Object} templateData Template data, including the source settings.
 *
 * @returns {String} The rendered Javascript code.
 */
async function renderTemplate(templateData) {
  var options = { async: true };
  return ejs.renderFile(
    path.join(__dirname, 'template.ejs'),
    templateData,
    options
  );
}

/**
 * Returns the slug from a destination name (ex. Amplitude).
 *
 * @param {String} name Destination name
 *
 * @returns {String} Destination slug.
 */
function getSlug(name) {
  return name
    .toLowerCase()
    .replace(/^ +| +$/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function main(writeKey) {
  // 1- Get source settings
  var settings = await getSourceSettings(writeKey);

  // 2- Read available integrations
  var availableIntegrations = readIntegrationsPackages();

  // 3- Only require the integrations enabled
  var integrations = getEnabledIntegrations(settings, availableIntegrations);

  var templateData = {
    version: 'DEV',
    writeKey: writeKey,
    versions: {
      core: 'Custom build'
    },
    settings: settings,
    integrations: integrations
  };

  // 3- Renders the template with the Source settings
  var renderedCode = await renderTemplate(templateData);

  // 4- Bundle it
  var fileName = await bundle(renderedCode, integrations);

  // 5- Starting the node server
  var app = express();
  app.set('view engine', 'pug');
  app.use('/builds', express.static(path.join(__dirname, 'builds')));
  app.get('/', (_, res) => {
    res.render('index', { url: `builds/${path.basename(fileName)}` });
  });

  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
}

var args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Required write key. Please use `node index.js <writeKey>`');
  process.exit(1);
}

main(args[0]);
