'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var GTAG = require('../lib/');

describe('Gtag', function() {
  var analytics;
  var gtag;
  var options = {
    GA_MEASUREMENT_ID: 'GA_MEASUREMENT_ID'
  };

  beforeEach(function() {
    analytics = new Analytics();
    gtag = new GTAG(options);
    analytics.use(GTAG);
    analytics.use(tester);
    analytics.add(gtag);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    gtag.reset();
    sandbox();
  });

  it('should store the correct settings', function() {
    analytics.compare(
      GTAG,
      integration('Gtag')
        .global('dataLayer')
        .option('GA_MEASUREMENT_ID', '')
        .option('AW_CONVERSION_ID', '')
        .option('DC_FLOODLIGHT_ID', '')
    );
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(gtag, done);
    });
  });
});
