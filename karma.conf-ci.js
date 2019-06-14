const base = require('./karma.conf')

module.exports = function(config) {
  base(config)
  const customLaunchers = {
    'Chrome': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: 'latest'
    },
    'Chrome-1': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: 'latest-1'
    },
    'Firefox': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: 'latest'
    },
    'Firefox-1': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: 'latest-1'
    },
    'Safari-1': {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '11'
    },
    'Safari': {
      base: 'SauceLabs',
      browserName: 'safari',
      version: 'latest'
    },
    'EDGE': {
      base: 'SauceLabs',
      browserName: 'microsoftedge',
      platform: 'Windows 10',
      version: 'latest'
    },
    'EDGE-1': {
      base: 'SauceLabs',
      browserName: 'microsoftedge',
      platform: 'Windows 10',
      version: 'latest-1'
    }
  }

  config.set({
    captureTimeout: 180000,
    browserDisconnectTimeout: 180000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 300000,
    singleRun: true,
    reporters: ['dots', 'summary'],
    browsers: Object.keys(customLaunchers),
    customLaunchers: customLaunchers,
    browserstack: {
      video: false
    },
    sauceLabs: {
      connectOptions: {
        noSslBumpDomains: 'all'
      },
      testName: require('./package.json').name,
      retryLimit: 3,
      recordVideo: false,
      recordScreenshots: false,
      idleTimeout: 600,
      commandTimeout: 600,
      maxDuration: 5400,
    },
    transports: ['websocket', 'polling'],
    port: 9876,
  })
}
