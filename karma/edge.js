
function setEdge (config) {
  config.customLaunchers = {
    sl_edge_latest: {
      base: 'SauceLabs',
      browserName: 'microsoftedge'
    }
  }
  config.browsers = Object.keys(config.customLaunchers)
  return config
}

module.exports = setEdge
