
const baseConfig = require('./base');
const files = require('./files');
const setBrowser = require('./browsers');
const Server = require('karma').Server;

/**
 * Retrieves the configuration for karma. This can be used for `karma start ...`.
 * 
 * @param {Object} arg Arguments. 
 */
function getConfiguration(arg) {
  if (!arg || (typeof arg === 'object' && Object.entries(arg).length === 0)) {
    arg = {
      tunnelId: null,
      integrations: null,
      browser: null,
    };
  }

  const sourceFiles = files(arg.integrations);
  const configuration = baseConfig;
  configuration.files = Object.keys(sourceFiles);
  configuration.preprocessors = sourceFiles;

  return setBrowser(arg.browser, configuration);
}

/**
 * Starts the server in the same way than `karma start ...` but with limited options.
 * 
 * @param {Object} arg Arguments.
 */
function startServer(arg) {
  const config = getConfiguration(arg); 

  const server = new Server(config, function(exitCode) {
    console.log('Karma has exited with %s', exitCode);
    process.exit(exitCode);
  })

  return server;
}

module.exports = getConfiguration;
