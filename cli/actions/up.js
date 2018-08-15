"use strict";

const path = require("path");
const fs = require("fs-extra");
const { Builder } = require("@segment/ajs-renderer");
const spawn = require("../lib/spawn");
const { AJS_PRIVATE_LOCATION } = require("../constants");
const log = require("../lib/log");
const reportErr = require("../lib/report");
const server = require("../server");

/**
 * Generates arguments for builder.render()
 * Most of it is fluff content made to appease the type checks.
 *
 * @return JSON args
 */
function buildArgs(templates, integrations, settings) {
  // Mocks builder's "stats" param that we don't actually use
  const fakeStats = {
    incr: () => {} // noop
  };

  const WRITE_KEY = "ajs-cli";

  const enabledConfigs = [
    {
      enabled: true,
      metadataId: "some-id",
      settings
    }
  ];

  const destinationDefinitions = [
    {
      name: "convertro",
      creationName: "convertro",
      id: "some-id",
      options: settings,
      branch: "staging",
      ajsVersion: "0.0.1-fake"
    }
  ];

  return {
    project: {
      writeKeys: [WRITE_KEY]
    },
    versions: {
      integrations
    },
    destinationDefinitions,
    enabledConfigs,
    templates,
    stats: fakeStats,
    platformMetadata: {
      platformIntegrations: {}
    },
    schemaPlan: { track: { foo: "bar" } },
    metrics: {
      sampleRate: 0.1
    }
  };
}

async function makeTemplates() {
  log.title("Creating ajs templates, this might take a minute or two ⏲");
  return spawn("make", ["build"], {
    cwd: AJS_PRIVATE_LOCATION
  });
}

async function readTemplates() {
  log.title("Reading the ajs template files");

  return {
    minifiedTemplate: await fs.readFile(
      path.join(AJS_PRIVATE_LOCATION, "templates", "analytics.min.js"),
      "utf8"
    ),
    unminifiedTemplate: await fs.readFile(
      path.join(AJS_PRIVATE_LOCATION, "templates", "analytics.js"),
      "utf8"
    ),
    minifiedPlatformTemplate: await fs.readFile(
      path.join(AJS_PRIVATE_LOCATION, "templates", "platform.min.js"),
      "utf8"
    ),
    unminifiedPlatformTemplate: await fs.readFile(
      path.join(AJS_PRIVATE_LOCATION, "templates", "platform.js"),
      "utf8"
    )
  };
}

async function makeAndReadTemplates() {
  await makeTemplates();
  return readTemplates();
}

async function cacheLocalTemplates(templates) {
  log.title("Caching minified local template files for use in demo site");

  const AJS = "analytics.js/v1/ajs-cli/analytics.js";
  const PLATFORM = "analytics.js/v1/ajs-cli/platform/analytics.js";

  if (!templates[AJS]) throw `No templates for ${AJS}`;
  if (!templates[PLATFORM]) throw `No templates for ${PLATFORM}`;

  await fs.ensureDir(path.join(".", "static", ".ajs"));
  await fs.writeFile(
    path.join(".", "static", ".ajs", "analytics.js"),
    templates[AJS]
  );
  await fs.writeFile(
    path.join(".", "static", ".ajs", "platform.js"),
    templates[PLATFORM]
  );
}

function up(yargs) {
  // Run with --no-rebuild to avoid running make (which can be slow)
  // This is mostly for testing / dev of the tool
  const { rebuild = true } = yargs.boolean("rebuild").argv;
  const getTemplates = rebuild ? makeAndReadTemplates : readTemplates;

  // Note that even though Builder.render is "static", "static" in JS does
  // not work the same way here. Newing up a new instance of Builder
  // allows us to have a `this` inside Builder.render; without it
  // we'll crash.
  const builder = new Builder();

  // TODO: Hookup current integration
  const integrations = {
    convertro: "v1.33.7"
  };

  // TODO: Hookup settings
  const settings = {
    metrics: "foo"
  };

  getTemplates()
    .then(templates => buildArgs(templates, integrations, settings))
    .then(args => Builder.render(args))
    .then(async templates => {
      await cacheLocalTemplates(templates);
      log.title("Attempting to launch next.js demo site\n");
      server();
    })
    .catch(reportErr);
}

module.exports = up;
