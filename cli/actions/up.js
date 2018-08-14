'use strict';

const { Builder } = require('@segment/ajs-renderer');

// Mocks builder's "stats" param that we don't actually use
const fakeStats = {
  incr: () => {} // noop
};

const WRITE_KEY = 'ajs-cli';

function up() {
  const integrations = {
    convertro: 'v1.33.7'
  };

  const settings = {}; // TODO

  const enabledConfigs = [
    {
      enabled: true,
      metadataId: 'some-id',
      settings
    }
  ];

  const destinationDefinitions = [
    {
      name: 'convertro',
      creationName: 'convertro',
      id: 'some-id',
      options: settings,
      branch: 'staging',
      ajsVersion: '0.0.1-fake'
    }
  ];

  const results = Builder.render({
    project: {
      writeKeys: [WRITE_KEY]
    },
    versions: {
      integrations
    },
    destinationDefinitions,
    enabledConfigs,
    templates: {
      unminifiedTemplate: '',
      minifiedTemplate: '',
      unminifiedPlatformTemplate: '',
      minifiedPlatformTemplate: ''
    },
    stats: fakeStats,
    platformMetadata: {
      platformIntegrations: {}
    },
    schemaPlan: { track: { foo: 'bar' } }
  });

  console.log(results);
}

module.exports = up;
