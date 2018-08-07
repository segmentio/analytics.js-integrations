
const integrationsPath = 'integrations'
const fs = require('fs')
const path = require('path')

/**
 * Returns all integrations availables in the repo.
 */
function getAllIntegrations () {
  const integrations = {}

  fs.readdirSync(integrationsPath).forEach(file => {
    const filePath = path.join(integrationsPath, file)
    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      integrations[file] = createIntegration(file, filePath)
    }
  })

  return integrations
}

/**
 * Returns an object containing the integrations.
 *
 * @param {[String]} names Integration names
 */
function getIntegrations (names) {
  const integrations = {}

  names.filter(name => name.length > 0).forEach(name => {
    integrations[name] = getIntegration(name)
  })

  return integrations
}

/**
 * Returns the integration
 *
 * @param {String} name Integration name
 */
function getIntegration (name) {
  const integrationPath = path.join(integrationsPath, name)

  const stats = fs.statSync(integrationPath)
  if (stats.isDirectory()) {
    return createIntegration(name, integrationPath)
  }

  throw new Error(`${name} integration not found`)
}

function createIntegration (name, folderPath) {
  return {
    name: name,
    path: folderPath,
    testsPath: path.join(folderPath, 'test')
  }
}

module.exports = {
  integrationsPath: integrationsPath,
  getAllIntegrations: getAllIntegrations,
  getIntegrations: getIntegrations
}
