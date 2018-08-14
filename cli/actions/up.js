"use strict";

const { Builder } = require("@segment/ajs-renderer");
const spawn = require("../lib/spawn");
const { AJS_PRIVATE_LOCATION } = require("../constants");

// Mocks builder's "stats" param that we don't actually use
const fakeStats = {
  incr: () => {} // noop
};

const WRITE_KEY = "ajs-cli";

function buildArgs() {
  const integrations = {
    convertro: "v1.33.7"
  };

  const settings = {}; // TODO

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
    templates: {
      unminifiedTemplate: "",
      minifiedTemplate: "",
      unminifiedPlatformTemplate: "",
      minifiedPlatformTemplate: ""
    },
    stats: fakeStats,
    platformMetadata: {
      platformIntegrations: {}
    },
    schemaPlan: { track: { foo: "bar" } }
  };
}

function up() {
  const results = Builder.render(buildArgs());

  spawn("make");
}

module.exports = up;
