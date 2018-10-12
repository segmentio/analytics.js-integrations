const coverageDestinations = ['hubspot', 'amplitude', 'facebook-pixel']
const { getAllIntegrations } = require('./integrations')

module.exports = () => {
  const integrations = getAllIntegrations()
  const coverageReporter = {
    check: {
      global: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 100
      }
    },
    reporters: [
      { type: 'text' },
      { type: 'html' },
      { type: 'lcovonly' },
      { type: 'json' }
    ]
  }
  const exclude = []
  for (let integration in integrations) {
    const { name } = integrations[integration]
    if (!coverageDestinations.includes(name)) {
      exclude.push('integrations/' + name + '/**/*')
    }
  }
  coverageReporter.check.global.excludes = exclude
  return coverageReporter
}
