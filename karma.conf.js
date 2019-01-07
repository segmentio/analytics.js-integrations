/* eslint-env node */
'use strict'

const getConfiguration = require('./karma/configuration')

/**
 * Extract the integration names and the browser from the cli arguments.
 * Usage: _karma arguments_ (<integration>,[...]|all) <browser-type>
 */
function parseArguments () {
  const arg = {}

  try {
    let names = process.argv[process.argv.length - 2]
    if (names.includes('karma') || names === 'start') {
      throw new Error('integrations and browser type are required')
    }

    if (!names || names === 'all') {
      arg.integrations = []
    } else {
      arg.integrations = names.split(',')
    }

    // Last argument is the browser
    let browser = process.argv[process.argv.length - 1]
    if (!browser || browser.includes('karma') || browser === 'start') {
      browser = 'chromeHeadless'
    }
    arg.browser = browser

    // Tunnel id
    let tunnelId = process.env.SC_TUNNEL_ID || ''
    if (tunnelId.length > 0) {
      arg.tunnelId = tunnelId
    }

    // Test name
    arg.testName = require('./package.json').name
  } catch (err) {
    console.log(`Unrecognized arguments: ${err}`)
    console.log('Usage: _karma arguments_ (<integration>,[...]|all) <browser-type>')
    process.exit(10)
  }

  return arg
}

module.exports = function (config) {
  let arg = parseArguments()

  if (arg.integrations.length > 0) {
    console.log('Integrations to test: %s in %s', arg.integrations, arg.browser)
  } else {
    console.log('Testing all integrations in %s', arg.browser)
  }

  config.set(getConfiguration(arg))
}
