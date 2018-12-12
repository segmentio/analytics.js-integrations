
const reporters = ['progress', 'junit', 'coverage']

/**
 * Sets the reporters for the tests.
 *
 * @param {Karma.Configuration} config Karma configuration.
 * @param {String} suiteName Suite name.
 * @param {String} reportsFolder Reports folder.
 */
function setReporters (config, suiteName, reportsFolder) {
  config.reporters = reporters
  config.junitReporter = {
    outputDir: reportsFolder,
    suite: suiteName
  }
  return config
}

module.exports = setReporters
