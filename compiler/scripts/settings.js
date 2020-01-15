const ejs = require('ejs');
const { keys, pick, get } = require('lodash')
var request = require('request');
var path = require('path')
var fs = require('fs')

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
    request.get({ url: url, gzip: true, headers:{ 'Cache-Control':'no-cache' } }, (err, _, body) => {
      if (err) {
        reject(err);
      } else if (body && body.includes('Invalid path or write key provided.')) {
        console.error('Please make sure your Segment writeKey was entered correctly.\nMore info: https://segment.com/docs/connections/find-writekey')
        reject(body);
      } else {
        resolve(JSON.parse(body));
      }
    });
  });
}

/**
 * Reads all integrations from the `../integrations` folder.
 *
 * @returns {Object} A map containing the package of each integration NPM module.
 */
function readIntegrationsPackages() {
  var destinationsDirectory = path.join(__dirname, '../..', 'integrations');
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
      enabledIntegrations[name] = availableIntegrations[slug];
    }
  }

  // This destination does not exist anymore.
  // delete enabledIntegrations['Tell Apart'];

  return enabledIntegrations;
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

async function context(integrationVersions, coreVersion, writeKey, customSettings) {
  const settings = customSettings || await getSourceSettings(writeKey);
  const integrations = settings.integrations;

  const ctx = {};
  const availableIntegrations = readIntegrationsPackages();
  ctx.enabled = await getEnabledIntegrations(settings, availableIntegrations);
  ctx.integrations = pick(integrations, keys(ctx.enabled));

  const versions = {
    core: coreVersion,
    cdn: settings.cdnVersion || null,
    integrations: pick(integrationVersions, keys(ctx.enabled))
  };

  ctx.plan = JSON.stringify({});
  ctx.integrations = JSON.stringify(ctx.integrations);
  ctx.versions = JSON.stringify(versions);
  ctx.writeKey = get(integrations['Segment.io'], 'apiKey', '');
  return ctx;
}

module.exports = async function ({ ajs, integrationVersions, coreVersion, writeKey, customSettings }) {
  const { version } = coreVersion
  let ctx

  try {
    ctx = await context(integrationVersions, version, writeKey, customSettings)
  } catch(err) {
    console.error('Error: ', err)
    return
  }

  return ejs.compile(ajs)(ctx)
}
