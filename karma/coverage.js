const coverageDestinations = ['hubspot', 'amplitude', 'facebook-pixel']
const { getAllIntegrations } = require('./integrations')

module.exports = () => {
  const integrations = getAllIntegrations()
  const coverageReporter = {
    check: {
      global: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 100
      }
    },
    subdir: 'report',
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
