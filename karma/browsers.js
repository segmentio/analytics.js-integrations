
const chrome = require('./chrome')
const edge = require('./edge')
const firefox = require('./firefox')
const ie = require('./ie')
const safari = require('./safari')
const phantomJS = require('./phantom')
const setReporters = require('./reporters')
const configureSauceLabs = require('./sauceLabs')

/**
 * Sets the configuration to run the specific browser.
 *
 * @param {String} name Browser name.
 * @param {Object} arg Run arguments.
 * @param {Karma.Configuration} config Karma configuration to update.
 */
function setBrowser (name, arg, config) {
  if (!name || name.toLowerCase() === 'phantomjs') {
    return phantomJS(config)
  }

  // SauceLabs browsers
  config = configureSauceLabs(config, arg)
  config = setReporters(config, require('../package.json').name, process.env.TEST_REPORTS_DIR)

  switch (name.toLowerCase()) {
    case 'chrome':
      return chrome(config)
    case 'firefox':
      return firefox(config)
    case 'safari':
      return safari(config)
    case 'ie':
      return ie(config)
    case 'edge':
      return edge(config)
  }

  throw new Error(`${name} not supported`)
}

module.exports = setBrowser
