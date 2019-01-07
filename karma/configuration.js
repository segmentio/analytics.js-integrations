
const baseConfig = require('./base')
const files = require('./files')
const setBrowser = require('./browsers')
const coverage = require('./coverage')

/**
 * Retrieves the configuration for karma. This can be used for `karma start ...`.
 *
 * @param {Object} arg Arguments.
 */
function getConfiguration (arg) {
  if (!arg || (typeof arg === 'object' && Object.entries(arg).length === 0)) {
    arg = {
      tunnelId: null,
      integrations: null,
      browser: null,
      tags: null
    }
  }

  if (!arg.tags || arg.tags.length === 0) {
    let integrations = arg.integrations || []
    arg.tags = integrations.map(name => name)
  }

  const sourceFiles = files(arg.integrations)

  const configuration = baseConfig

  if (arg.browser && arg.browser.toLowerCase() === 'chromeHeadless') {
    configuration.coverageReporter = coverage()
  }
  configuration.files = Object.keys(sourceFiles)
  configuration.preprocessors = sourceFiles

  return setBrowser(arg.browser, arg, configuration)
}

module.exports = getConfiguration
