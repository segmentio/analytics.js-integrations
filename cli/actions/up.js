"use strict";

const path = require("path");
const fs = require("fs-extra");
const { Builder } = require("@segment/ajs-renderer");
const spawn = require("../lib/spawn");
const { AJS_PRIVATE_LOCATION } = require("../constants");
const log = require("../lib/log");
const reportErr = require("../lib/report");

// Mocks builder's "stats" param that we don't actually use
const fakeStats = {
  incr: () => {} // noop
};

const WRITE_KEY = "ajs-cli";

function buildArgs(templates) {
  const integrations = {
    convertro: "v1.33.7"
  };

  const settings = {
    FakeSettings: {}
  }; // TODO

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
    schemaPlan: { track: { foo: "bar" } }
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
      path.join(AJS_PRIVATE_LOCATION, "templates", "analytics.min.js")
    ),
    unminifiedTemplate: await fs.readFile(
      path.join(AJS_PRIVATE_LOCATION, "templates", "analytics.js")
    ),
    minifiedPlatformTemplate: await fs.readFile(
      path.join(AJS_PRIVATE_LOCATION, "templates", "platform.min.js")
    ),
    unminifiedPlatformTemplate: await fs.readFile(
      path.join(AJS_PRIVATE_LOCATION, "templates", "platform.js")
    )
  };
}

async function makeAndReadTemplates() {
  await makeTemplates();
  return readTemplates();
}

function up(yargs) {
  const { rebuild } = yargs.boolean("rebuild").argv;
  const getTemplates = rebuild ? makeAndReadTemplates : readTemplates;

  getTemplates()
    .then(templates => buildArgs(templates))
    .then(Builder.render)
    .then(console.log)
    .catch(reportErr);
}

module.exports = up;
