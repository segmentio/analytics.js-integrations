
const integrations = require('./integrations');
const path = require('path');
const preprocessor = 'browserify';

/**
 * Returns the source files and preprocessors for the listed integrations
 * 
 * @param {[String]} integrationNames Integration names. If it is empty or undefined, it will return all. 
 */
function getSourceFiles(integrationNames) {

  let ints = {};
  if (integrationNames.length > 0) {
    ints = integrations.getIntegrations(integrationNames);
  } else {
    ints = integrations.getAllIntegrations();
  }

  const files = {};

  Object.keys(ints).forEach(name => {
    const src = path.join(ints[name].testsPath, "**", "*.test.js");
    files[src] = preprocessor;
  });

  return files;
}

module.exports = getSourceFiles;
