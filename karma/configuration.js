
const baseConfig = require('./base')
const integrations = require('./integrations')
const files = require('./files')
const setBrowser = require('./browsers')
const coverage = require('./coverage')

/**
 * Retrieves the configuration for karma. This can be used for `karma start ...`.
 *
 * @param {Object} arg Arguments.
 * 
 * @return The configuration. "null" if there is nothing to run with the provided
 * arguments.
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

  let browser = 'chromeheadless'
  if (arg.browser) {
    browser = arg.browser.toLowerCase()
  }

  const ints = getIntegrationsToTest(arg.integrations, browser)
  if (!Object.keys(ints).length) {
    return null
  }

  const configuration = baseConfig
  configuration.integrations = ints

  const sourceFiles = files(ints)

  if (browser === 'chromeheadless') {
    configuration.coverageReporter = coverage()
  }
  configuration.files = Object.keys(sourceFiles)
  configuration.preprocessors = sourceFiles

  return setBrowser(browser, arg, configuration)
}

/**
 * Returns a list of integration names to test.
 * 
 * @param {[String]} providedIntegrations Integrations provided as `arguments.integrations`.
 * @param {String} browser Browser name.
 */
function getIntegrationsToTest(providedIntegrations, browser) {

  let ints = {}
  if (providedIntegrations.length > 0) {
    ints = integrations.getIntegrations(providedIntegrations)
  } else {
    ints = integrations.getAllIntegrations()
  }

  for (let name in ints) {
    const ignoreBrowsers = ints[name].ignoreBrowsers || []
    if (ignoreBrowsers.includes(browser)) {
      delete ints[name]
    }
  }

  return ints
}

module.exports = getConfiguration
