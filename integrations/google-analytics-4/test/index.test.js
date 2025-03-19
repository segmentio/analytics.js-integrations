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

  describe('loading', function() {
    it('should load default domain', function() {
      analytics.spy(ga4, 'load');
      analytics.initialize();
      analytics.page();
      analytics.called(ga4.load);
      analytics.assert(ga4.options.domain === 'www.googletagmanager.com');
    });

    it('should load custom domain if specified', function() {
      ga4.options.domain = 'custom.example.com';
      analytics.spy(ga4, 'load');
      analytics.initialize();
      analytics.page();
      analytics.called(ga4.load);
      analytics.assert(ga4.options.domain === 'custom.example.com');
    });
  });
});