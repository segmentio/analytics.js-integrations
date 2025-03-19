'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var GA4 = require('../lib/');

describe('Google Analytics 4', function() {
  var analytics;
  var ga4;
  var options = {
    containerId: 'GTM-XXXX',
    environment: '',
    domain: 'www.googletagmanager.com',
    trackNamedPages: true,
    trackCategorizedPages: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    ga4 = new GA4(options);
    analytics.use(GA4);
    analytics.use(tester);
    analytics.add(ga4);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    ga4.reset();
    sandbox();
  });
});