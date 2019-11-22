const ejs = require('ejs');
const fs = require('fs');
const { keys, reduce, pick, get } = require('lodash')
var coreVersion = require('@segment/analytics.js-core/package').version;

function context(integrationSettings, integrationVersions, coreVersion, writeKey) {
  const settings = {
    integrations: {
      'Segment.io': {
        apiKey: writeKey,
        addBundledMetadata: true,
        unbundledIntegrations: []
      },
      ...integrationSettings
    },
    plan: {
      track: {
      }
    }
  }

  const integrations = settings.integrations;
  const plan = settings.plan || {};
  const ctx = {};

  // all integrations are enabled
  if (integrations.all) {
    ctx.integrations = {};
    ctx.plan = {};
    ctx.enabled = all();
  } else {
      ctx.plan = plan;

    ctx.enabled = reduce(integrations, function(enabled, options, name) {
      if (integrationVersions.hasOwnProperty(name)) {
        enabled[name] = true;
      }
      return enabled;
    }, {});

    ctx.integrations = pick(integrations, keys(ctx.enabled));
  }

  ctx.versions = {
    core: coreVersion,
    cdn: settings.cdnVersion || null,
    integrations: pick(integrationVersions, keys(ctx.enabled))
  };

  ctx.plan = JSON.stringify(ctx.plan);
  ctx.integrations = JSON.stringify(ctx.integrations);
  ctx.versions = JSON.stringify(ctx.versions);
  ctx.writeKey = get(integrations['Segment.io'], 'apiKey', '');
  return ctx;
}

module.exports = function ({ ajs, settings, integrationVersions, coreVersion, writeKey }) {
  const { version } = coreVersion
  return ejs.compile(ajs)(context(settings, integrationVersions, version, writeKey))
};