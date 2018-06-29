/* eslint-env node */
'use strict';

// By default, all
const integrations = process.env.INTEGRATIONS || '';

function getFiles() {
  if (integrations === "") {
    return ['integrations/**/test/**/*.test.js'];
  } else {
    return integrations.split(" ").map(function(integration) {
      return 'integrations/' + integration + '/test/**/*.test.js';  
    });
  }
}

function getPreprocessors() {
  if (integrations === "") {
    return {'integrations/**/test/**/*.js': 'browserify'};
  } else {
    let preprocessors = {};
    integrations.split(" ").forEach(function(integration) {
      preprocessors['integrations/' + integration + '/test/**/*.js'] = 'browserify';  
    });
    return preprocessors;
  }
}


module.exports = function(config) {

  if (integrations === "") {
    console.log("Testing all integrations")
  } else {
    console.log(`Integrations to test: %s`, integrations)
  }

  config.set({
    files: getFiles(),

    browsers: ['PhantomJS'],

    frameworks: ['browserify', 'mocha'],

    reporters: ['spec', 'coverage'],

    preprocessors: getPreprocessors(),

    client: {
      mocha: {
        grep: process.env.GREP,
        reporter: 'html',
        timeout: 10000
      }
    },

    browserify: {
      debug: true,
      transform: [
        [
          'browserify-istanbul',
          {
            instrumenterConfig: {
              embedSource: true
            }
          }
        ]
      ]
    },

    coverageReporter: {
      reporters: [
        { type: 'text' },
        { type: 'html' },
        { type: 'json' }
      ]
    }
  });
};
