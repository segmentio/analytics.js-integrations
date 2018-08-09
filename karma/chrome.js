
function setChrome (config) {
  config.customLaunchers = {
    sl_chrome_latest: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'linux',
      version: 'latest'
    },
    sl_chrome_latest_1: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'linux',
      version: 'latest-1'
    }
  }
  config.browsers = Object.keys(config.customLaunchers)
  return config
}

module.exports = setChrome
