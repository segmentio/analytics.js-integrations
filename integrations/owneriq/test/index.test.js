'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Oiq = require('../lib/');

describe('Oiq Conversion Tracking', function() {
  var analytics;
  var oiq;
  var options = {
    dataGroupId: '9nfdft',
    analyticTagId: 'gcb8',
    dctTagId: '6qg2'
  };


  beforeEach(function() {
    analytics = new Analytics();
    oiq = new Oiq(options);
    analytics.use(Oiq);
    analytics.use(tester);
    analytics.add(oiq);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    oiq.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(Oiq, integration('OwnerIQ Pixel')
      .assumesPageview()
      .option('dataGroupId','')
      .option('analyticTagId','')
      .option('dctTagId',''));
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(oiq, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._oiqq, 'push');
      });

      it('should track page', function() {
        analytics.page({ url: 'http://localhost:34448/test/' });
        analytics.called(window._oiqq.push, ['oiq_addPageLifecycle', 'gcb8']);
      });
    });

    describe('#OrderCompleted', function() {
      beforeEach(function() {
        analytics.stub(window._oiqq, 'push');
      });

      describe('Ecommerce', function() {
        it('should track dct data', function() {
          analytics.track('Order Completed', {
            products: [
              { product_id: '507f1f77bcf86cd799439011', brand: 'Test Brand 1' },
              { product_id: '505bd76785ebb509fc183733' }
            ],
            currency: 'USD',
            total: 0.50,
            tax: 0.10,
            orderId: 123,
            isConversion: true
          });

          analytics.called(window._oiqq.push, ['oiq_addPageLifecycle','6qg2']);
        });
      });
    });
  });
});

