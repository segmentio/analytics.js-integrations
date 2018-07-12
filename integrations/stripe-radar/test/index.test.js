'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var StripeRadar = require('../lib/');

describe('Stripe Radar', function() {
  var analytics;
  var stripeRadar;
  var options = {
    apiKey: 'pk_test_huJy59cKigLorl20G9hq82AQ'
  };

  beforeEach(function() {
    analytics = new Analytics();
    stripeRadar = new StripeRadar(options);
    analytics.use(StripeRadar);
    analytics.use(tester);
    analytics.add(stripeRadar);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    stripeRadar.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(StripeRadar, integration('Stripe Radar')
      .option('apiKey', '')
      .tag('<script src="https://js.stripe.com/v2/">'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(stripeRadar, 'load');
    });

    describe('#initialize', function() {
      it('should call load', function() {
        analytics.initialize();
        analytics.called(stripeRadar.load);
      });

      it('should not double load stripe.js if window.Stripe && and window.Stripe.setPublishableKey is available', function() {
        window.Stripe = {
          setPublishableKey: function() {}
        };
        analytics.initialize();
        analytics.didNotCall(stripeRadar.load);
      });
    });
  });

  describe('loading', function() {
    beforeEach(function() {
      // FIXME: not sure why sandbox() is not wiping the window.Stripe between these two tests.
      // Manually deleting for now since it looks like a bug with `clear-env`
      delete window.Stripe;
    });

    it('should create window.Stripe', function(done) {
      analytics.assert(!window.Stripe);
      analytics.once('ready', function() {
        analytics.assert(window.Stripe);
        done();
      });
      analytics.initialize();
    });

    it('should create window.Stripe.setPublishableKey', function(done) {
      analytics.assert(!window.Stripe);
      analytics.once('ready', function() {
        analytics.assert(window.Stripe.setPublishableKey);
        done();
      });
      analytics.initialize();
    });
  });
});
