
function setIE (config) {
  config.customLaunchers = {
    sl_ie_10: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '10'
    },
    sl_ie_11: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '11'
    }
  }
  config.browsers = Object.keys(config.customLaunchers)
  return config
}

module.exports = setIE
