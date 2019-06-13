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
        version: 'latest-1'
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
      browserDisconnectTolerance: 1,

      browserDisconnectTimeout: 60000,

      browserNoActivityTimeout: 60000,

      singleRun: true,

      concurrency: 8,

      retryLimit: 5,

      reporters: ['spec', 'summary'],

      browsers: ['ChromeHeadless'].concat(Object.keys(customLaunchers)),

      customLaunchers: customLaunchers,

      sauceLabs: {
        testName: require('./package.json').name
      }
    })
  }
};
