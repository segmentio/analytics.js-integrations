
/**
 * Validates the credentials for Sauce Labs
 */
function assertSauceLabs() {
  if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    throw new Error('SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables are required but are missing');
  }
}

/**
 * Sets the credentials and client settings for sauce labs.
 * 
 * @param {Karma.Configuration} config Configuration.
 * @param {String} tunnelId SauceConnect tunnel id. If undefined, it will use the default one.
 */
function configureSauceLabs(config, tunnelId) {
  assertSauceLabs();

  config.sauceLabs = {
    recordScreenshots: false,
    recordVideo: false,
    startConnect: false,
    testName: require('../package.json').name
  };

  if (tunnelId) {
    config.sauceLabs.tunnelIdentifier = tunnelId;
  }

  return config;
}

module.exports = configureSauceLabs;
