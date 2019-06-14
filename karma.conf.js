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
      },
      // 'BS_CHROME': {base: 'BrowserStack', browser: 'chrome', os: 'OS X', os_version: 'Yosemite'},
      // 'BS_FIREFOX': {base: 'BrowserStack', browser: 'firefox', os: 'Windows', os_version: '10'},
      // 'BS_SAFARI7': {base: 'BrowserStack', browser: 'safari', os: 'OS X', os_version: 'Mavericks'},
      // 'BS_SAFARI8': {base: 'BrowserStack', browser: 'safari', os: 'OS X', os_version: 'Yosemite'},
      // 'BS_SAFARI9': {base: 'BrowserStack', browser: 'safari', os: 'OS X', os_version: 'El Capitan'},
      // 'BS_SAFARI10': {base: 'BrowserStack', browser: 'safari', os: 'OS X', os_version: 'Sierra'},
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
};
