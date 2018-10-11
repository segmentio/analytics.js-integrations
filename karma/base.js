
/**
 * Base configuration for Karma.
 *
 * Do not touch unless you know what you are doing.
 */
module.exports = {
  exclude: [
    'integrations/**/node_modules/**'
  ],
  frameworks: ['browserify', 'mocha'],
  reporters: ['spec', 'coverage'],
  browserDisconnectTimeout: 60000,
  browserNoActivityTimeout: 60000,
  concurrency: 1,
  singleRun: true,
  client: {
    captureConsole: false,
    mocha: {
      reporter: 'html',
      timeout: 10000
    }
  },
  browserify: {
    debug: true,
    transform: [
      [
        'browserify-istanbul',
        {
          instrumenterConfig: {
            embedSource: true
          }
        }
      ]
    ]
  }
}
