'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var GA4 = require('../lib/');

// gtag.js saves arrays as argument objects and assert.deepEquals fails when comparing
// argument objects against arrays.
var toArray = require('to-array');

describe('Google Analytics 4', function() {
  var analytics;
  var ga4;

  var settings = {
    measurementIds: ['GA-100', 'GA-200']
  };

  beforeEach(function() {
    analytics = new Analytics();
    ga4 = new GA4(settings);
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

  it('should have the right settings', function() {
    analytics.compare(
      GA4,
      integration('Google Analytics 4')
        .global('gtag')
        .global('ga4DataLayer')
        .option('measurementIds', [])
        .option('cookieDomainName', '')
        .option('cookiePrefix', '')
        .option('cookieExpiration', 0)
        .option('cookieUpdate', true)
        .option('cookieFlags', '')
        .option('disablePageViewMeasurement', true)
        .option('disableAllAdvertisingFeatures', false)
        .option('disableAdvertisingPersonalization', false)
        .option('disableGoogleAnalytics', false)
        .option('sendUserId', false)
        .option('userProperties', {})
        .option('customEventsAndParameters', [])
    );
  });

    describe('before loading', function() {
      var loadArgs;

      beforeEach(function() {
        analytics.stub(ga4, 'load', function(args, callback) {
            loadArgs = args;
            callback();
        });
      });

      afterEach(function() {
        loadArgs = null;
      });

      describe('#initialize', function() {
        it('should create window.ga4DataLayer', function() {
          analytics.assert(!window.ga4DataLayer);
          analytics.initialize();
          analytics.assert(typeof window.ga4DataLayer === 'object');
        });

        it('should create window.gtag', function() {
          analytics.assert(!window.gtag);
          analytics.initialize();
          analytics.assert(typeof window.gtag === 'function');
        });

        it('should not initialize when measurement IDs is empty', function() {
            ga4.options.measurementIds = [];

            analytics.initialize();
            analytics.didNotCall(ga4.load)
        });

        it('should not initialize when Disable Google Analytics is set to true', function() {
            ga4.options.disableGoogleAnalytics = true;

            analytics.initialize();
            analytics.didNotCall(ga4.load)
        });

        it('should load gtag.js with the first measurement ID', function() {
            analytics.initialize();
            analytics.called(ga4.load);

            analytics.deepEqual(loadArgs, {
                measurementId: ga4.options.measurementIds[0]
            });
        });

        it('should configure all measurement IDs', function() {
            analytics.initialize();

            analytics.deepEqual(toArray(window.ga4DataLayer[1]), [
                'config',
                'GA-100'
            ]);
            analytics.deepEqual(toArray(window.ga4DataLayer[2]), [
                'config',
                'GA-200'
            ]);
        });

        it('should disable page view measurement for all measurement IDs', function() {
            ga4.options.disablePageViewMeasurement = true;
            analytics.initialize();

            analytics.deepEqual(toArray(window.ga4DataLayer[3]), [
                'config',
                'GA-100',
                { send_page_view: false }
            ]);
            analytics.deepEqual(toArray(window.ga4DataLayer[4]), [
                'config',
                'GA-200',
                { send_page_view: false }
            ]);
        });

        it('should set cookie related setting for all measurement IDs', function() {
            ga4.options.disablePageViewMeasurement = false; // Reduces the data layer queue depth
            ga4.options.cookieUpdate = false;
            ga4.options.cookieDomainName = 'ajs.test'
            ga4.options.cookiePrefix = 'test_prefix'
            ga4.options.cookieExpiration = 21
            ga4.options.cookieFlags = 'SameSite=None;Secure'
            analytics.initialize();
            analytics.deepEqual(toArray(window.ga4DataLayer[3]), [
                'config',
                'GA-100',
                { cookie_update: false }
            ]);
            analytics.deepEqual(toArray(window.ga4DataLayer[4]), [
                'config',
                'GA-200',
                { cookie_update: false }
            ]);
            analytics.deepEqual(toArray(window.ga4DataLayer[5]), [
                'config',
                'GA-100',
                { cookie_domain: 'ajs.test' }
            ]);
            analytics.deepEqual(toArray(window.ga4DataLayer[6]), [
                'config',
                'GA-200',
                { cookie_domain: 'ajs.test' }
            ]);
            analytics.deepEqual(toArray(window.ga4DataLayer[7]), [
                'config',
                'GA-100',
                { cookie_prefix: 'test_prefix' }
            ]);
            analytics.deepEqual(toArray(window.ga4DataLayer[8]), [
                'config',
                'GA-200',
                { cookie_prefix: 'test_prefix' }
            ]);
            analytics.deepEqual(toArray(window.ga4DataLayer[9]), [
                'config',
                'GA-100',
                { cookie_expires: 21 }
            ]);
            analytics.deepEqual(toArray(window.ga4DataLayer[10]), [
                'config',
                'GA-200',
                { cookie_expires: 21 }
            ]);
            analytics.deepEqual(toArray(window.ga4DataLayer[11]), [
                'set',
                { cookie_flags: 'SameSite=None;Secure' }
            ]);
        });
 
        it('should disable all advertising features', function() {
            ga4.options.disableAllAdvertisingFeatures = true;
            analytics.initialize();
            analytics.deepEqual(toArray(window.ga4DataLayer[7]), [
                'set',
                'allow_google_signals',
                false
            ]);
        });

        it('should disable all advertising features', function() {
            ga4.options.disableAdvertisingPersonalization = true;
            analytics.initialize();
            analytics.deepEqual(toArray(window.ga4DataLayer[7]), [
                'set',
                'allow_ad_personalization_signals',
                false
            ]);
        });
      });
    });

    describe('loading', function() {
      it('should load', function(done) {
        analytics.load(ga4, done);
      });
    });
});
