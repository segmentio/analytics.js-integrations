
function setFirefox(config) {
  config.customLaunchers = {
    sl_firefox_latest: {
      base: 'SauceLabs',
      browserName: 'firefox',
      platform: 'linux',
      version: 'latest'
    },
    sl_firefox_latest_1: {
      base: 'SauceLabs',
      browserName: 'firefox',
      platform: 'linux',
      version: 'latest-1'
    }
  };
  config.browsers = Object.keys(config.customLaunchers);
  return config;
}

module.exports = setFirefox;
