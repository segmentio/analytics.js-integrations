const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");

module.exports = {
  webpack(config, { isServer, dev }) {
    // remove friendlyerrorsplugin so we don't clear the screen everytime
    config.plugins = config.plugins.filter(
      plugin => plugin.constructor.name !== "FriendlyErrorsWebpackPlugin"
    );

    // add it back in with custom options
    if (dev && !isServer) {
      config.plugins.push(
        new FriendlyErrorsWebpackPlugin({ clearConsole: false })
      );
    }
    return config;
  }
};
