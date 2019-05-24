
const path = require('path')
const preprocessor = 'browserify'

/**
 * Returns the source files and preprocessors for the listed integrations
 *
 * @param {Object} integrations Map containing integrations by name.
 */
function getSourceFiles (integrations) {
  const files = {}

  Object.keys(integrations).forEach(name => {
    const src = path.join(integrations[name].testsPath, '**', '*.test.js')
    files[src] = preprocessor
  })

  return files
}

module.exports = getSourceFiles
