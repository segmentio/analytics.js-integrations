
const getConfiguration = require('./configuration');
const Server = require('karma').Server;

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

module.exports = startServer;
