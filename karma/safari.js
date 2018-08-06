
function setSafari(config) {
  config.customLaunchers = {
    sl_safari_9: {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '9.0'
    }
  };
  config.browsers = Object.keys(config.customLaunchers);
  return config;
}

module.exports = setSafari;
