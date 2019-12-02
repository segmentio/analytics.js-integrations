/*
 * Module dependencies.
 */

var Integrations = require('./integrations');
var analytics = require('./analytics')(Integrations);

// Get a handle on the global analytics queue, as initialized by the
// analytics.js snippet. The snippet stubs out the analytics.js API and queues
// up calls for execution when the full analytics.js library (this file) loads.
var analyticsq = global.analytics || [];

// Parse the version from the analytics.js snippet.
var snippetVersion = analyticsq && analyticsq.SNIPPET_VERSION ? parseFloat(analyticsq.SNIPPET_VERSION, 10) : 0;

// Include as much version information as possible so we know exactly what we're running.
// Looks like: {
//   "core": "3.0.0",
//   "cdn": "1.15.3",
//   "integrations": {
//     "Segment.io": "3.1.1",
//     ...
//   }
// }
analytics._VERSIONS = '<%- versions %>';

// Initialize analytics.js. CDN will render configuration objects into
// `'<%- integrations %>'` and `'<%- plan %>'` using project settings.
analytics.initialize('<%- integrations %>', {
  initialPageview: snippetVersion === 0,
  plan: '<%- plan %>'
});

// Make any queued calls up before the full analytics.js library
// loaded
while (analyticsq && analyticsq.length > 0) {
  var args = analyticsq.shift();
  var method = args.shift();

  if (typeof analytics[method] === 'function') {
    analytics[method].apply(analytics, args);
  }
}

// Free the reference to analyticsq
analyticsq = null;

/*
 * Exports.
 */

// Set `global.analytics` explicitly rather than using Browserify's
// `--standalone` flag in order to avoid hooking into an already-declared
// `global.require`
global.analytics = analytics;
