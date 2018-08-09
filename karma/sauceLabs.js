
/**
 * Validates the credentials for Sauce Labs
 */
function assertSauceLabs () {
  if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    throw new Error('SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables are required but are missing')
  }
}

/**
 * Sets the credentials and client settings for sauce labs.
 *
 * @param {Karma.Configuration} config Karma Configuration.
 * @param {Object} arg Run arguments.
 */
function configureSauceLabs (config, arg) {
  assertSauceLabs()

  config.sauceLabs = {
    recordScreenshots: false,
    recordVideo: true,
    startConnect: false,
    testName: arg.testName || require('../package.json').name
  }

  if (arg.tunnelId) {
    config.sauceLabs.tunnelIdentifier = arg.tunnelId
  }

  if (arg.tags && arg.tags.length > 0) {
    config.sauceLabs.tags = arg.tags
  }

  return config
}

module.exports = configureSauceLabs
