'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Bronto = require('../lib/');

describe('Bronto', function() {
  var analytics;
  var bronto;
  var options = {
    siteId: 'arvdsiahdyhbxhukvignflhdknldben'
  };

  beforeEach(function() {
    analytics = new Analytics();
    bronto = new Bronto(options);
    analytics.use(Bronto);
    analytics.use(tester);
    analytics.add(bronto);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    bronto.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(Bronto, integration('Bronto')
      .option('siteId', '')
      .option('host', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(bronto, 'load');
      analytics.stub(bronto, 'debug');
    });

    afterEach(function() {
      analytics.debug(false);
    });

    describe('#initialize', function() {
      it('should warn that _bta_tid and _bta_c arent found if debugger is on', function() {
        analytics.debug();
        analytics.initialize();
        analytics.page();
        analytics.called(
          bronto.debug,
          'missing tracking URL parameters `_bta_tid` and `_bta_c`.'
        );
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(bronto, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#orderCompleted', function() {
      beforeEach(function() {
        analytics.stub(bronto.bta, 'addOrder');
      });

      it('should send ecommerce data', function() {
        analytics.identify({ email: 'lance@segment.io' });
        analytics.track('order completed', {
          products: [{ product_id: 'yolo', sku: 'c546c96', quantity: 8, name: 'my-product', price: 99.99 }],
          orderId: '55c497bf'
        });

        analytics.deepEqual(bronto.bta.addOrder.args[0][0], {
          email: 'lance@segment.io',
          items: [{ item_id: 'yolo', quantity: 8, desc: 'my-product', amount: 99.99 }],
          order_id: '55c497bf'
        });
      });

      it('should fallback on id', function() {
        analytics.identify({ email: 'lance@segment.io' });
        analytics.track('order completed', {
          products: [{ id: 'yolo', sku: 'c546c96', quantity: 8, name: 'my-product', price: 99.99 }],
          orderId: '55c497bf'
        });

        analytics.deepEqual(bronto.bta.addOrder.args[0][0], {
          email: 'lance@segment.io',
          items: [{ item_id: 'yolo', quantity: 8, desc: 'my-product', amount: 99.99 }],
          order_id: '55c497bf'
        });
      });

      it('should fallback on sku', function() {
        analytics.identify({ email: 'lance@segment.io' });
        analytics.track('order completed', {
          products: [{ sku: 'c546c96', quantity: 8, name: 'my-product', price: 99.99 }],
          orderId: '55c497bf'
        });

        analytics.deepEqual(bronto.bta.addOrder.args[0][0], {
          email: 'lance@segment.io',
          items: [{ item_id: 'c546c96', quantity: 8, desc: 'my-product', amount: 99.99 }],
          order_id: '55c497bf'
        });
      });
    });
  });
});
