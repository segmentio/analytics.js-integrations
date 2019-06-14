/**
 * These are the contract tests for the integration. They SHOULD check responses against
 * recorded network traffic in `contract` mode, and live network responses in `smoke` mode.
 *
 * Local development should hit third-party endpoints in `smoke` mode.
 * CircleCI should hit recorded traffic in `contract` mode.
 */

'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var Sandbox = require('@segment/clear-env');
var Tester = require('@segment/analytics.js-integration-tester');
var Hotjar = require('../lib/');
// var inCircleCI = !!process.env.CIRCLE_TOKEN // If we can access this token var, then we're in CircleCI and should run recorded traffic.

describe('Hotjar Contract', function() {
  var analytics;
  var hotjar;
  var options = {
    hjid: 485778,
    hjTriggers: {},
    hjTagRecordingEvents: [],
    hjPlaceholderPolyfill: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    hotjar = new Hotjar(options);
    analytics.use(Hotjar);
    analytics.use(Tester);
    analytics.add(hotjar);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    hotjar.reset();
    Sandbox();
  });
  // This is being held for future work on contract/smoke tests.
});
