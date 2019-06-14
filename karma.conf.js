// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['browserify', 'mocha'],

    preprocessors: {
      '**/*.js': 'browserify'
    },

    browserify: {
      debug: true
    },

    files: [
      'src/*.js',
      'test/*.test.js',
      'test/*.js'
    ],

    reporters: ['spec'],

    browsers: ["ChromeHeadless"]
  });

  if (process.env.CI) {
    const customLaunchers = {
      'SL_Chrome': {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: 'latest'
      },
      'SL_Chrome-1': {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: 'latest-1'
      },
      'SL_Firefox': {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: 'latest'
      },
      'SL_Firefox-1': {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: 'latest-1'
      },
      'SL_Safari-1': {
        base: 'SauceLabs',
        browserName: 'safari',
        version: '11'
      },
      'SL_Safari': {
        base: 'SauceLabs',
        browserName: 'safari',
        version: 'latest'
      },
      'SL_EDGE': {
        base: 'SauceLabs',
        browserName: 'microsoftedge',
        platform: 'Windows 10',
        version: 'latest'
      },
      'SL_EDGE-1': {
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
      concurrency: 2,
      singleRun: true,
      reporters: ['spec', 'summary'],
      browsers: Object.keys(customLaunchers),
      customLaunchers: customLaunchers,
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
};
