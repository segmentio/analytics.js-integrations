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
    reporters: ['mocha'],
    browsers: ["ChromeHeadless"]
  });

  if (process.env.CI) {
    config.set({
      customLaunchers: {
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
        'SL_IE_9': {
          base: 'SauceLabs',
          browserName: 'internet explorer',
          platform: 'Windows 2008',
          version: '9'
        },
        'SL_IE_10': {
          base: 'SauceLabs',
          browserName: 'internet explorer',
          platform: 'Windows 2012',
          version: '10'
        },
        'SL_IE_11': {
          base: 'SauceLabs',
          browserName: 'internet explorer',
          platform: 'Windows 8.1',
          version: '11'
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
        },
        'SL_iOS': {
          base: 'SauceLabs',
          browserName: 'iphone',
          version: 'latest'
        },
        'SL_iOS-1': {
          base: 'SauceLabs',
          browserName: 'iphone',
          version: 'latest-1'
        }
      }
    })
  }
};
