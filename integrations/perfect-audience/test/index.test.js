'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var PerfectAudience = require('../lib/');

describe('Perfect Audience', function() {
  var analytics;
  var perfect;
  var options = {
    siteId: '4ff6ade4361ed500020000a5'
  };

  beforeEach(function() {
    analytics = new Analytics();
    perfect = new PerfectAudience(options);
    analytics.use(PerfectAudience);
    analytics.use(tester);
    analytics.add(perfect);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    perfect.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(PerfectAudience, integration('Perfect Audience')
      .assumesPageview()
      .global('_pq')
      .option('siteId', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(perfect, 'load');
    });

    describe('#initialize', function() {
      it('should create the window._pq object', function() {
        analytics.assert(!window._pq);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._pq instanceof Array);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(perfect.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(perfect, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._pq, 'push');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._pq.push, ['track', 'event']);
      });

      it('should send event and orderId, revenue properties when passed', function() {
        analytics.track('event', {
          orderId: '12345',
          total: 30
        });
        analytics.called(window._pq.push, ['track', 'event', { orderId: '12345', revenue: 30 }]);
      });
    });

    describe('#productViewed', function() {
      beforeEach(function() {
        analytics.stub(window._pq, 'push');
      });

      it('should send a track and a trackProduct with product ID', function() {
        analytics.track('Product Viewed', {
          product_id: '507f1f77bcf86cd799439011',
          sku: '45790-32',
          name: 'Monopoly: 3rd Edition',
          price: 18.99,
          category: 'Games'
        });
        analytics.called(window._pq.push, ['track', 'Product Viewed']);
        analytics.called(window._pq.push, ['trackProduct', '507f1f77bcf86cd799439011']);
      });

      it('should send a track and a trackProduct with product SKU, if there is not product ID', function() {
        analytics.track('Product Viewed', {
          sku: '45790-32',
          name: 'Monopoly: 3rd Edition',
          price: 18.99,
          category: 'Games'
        });
        analytics.called(window._pq.push, ['track', 'Product Viewed']);
        analytics.called(window._pq.push, ['trackProduct', '45790-32']);
      });
    });

    describe('#orderCompleted', function() {
      beforeEach(function() {
        analytics.stub(window._pq, 'push');
      });

      it('should send event and orderId, revenue properties', function() {
        analytics.track('Order Completed', {
          order_id: '12345',
          total: 30,
          revenue: 25,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          products: [
            {
              id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games'
            },
            {
              id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'Uno Card Game',
              price: 3,
              quantity: 2,
              category: 'Games'
            }
          ]
        });
        analytics.called(window._pq.push, ['track', 'Order Completed', { orderId: '12345', revenue: 30 }]);
      });
    });
  });
});
