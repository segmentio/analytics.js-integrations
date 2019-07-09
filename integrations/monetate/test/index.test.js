'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Monetate = require('../lib/');

describe('Monetate', function() {
  var analytics;
  var monetate;
  var options = {
    domain: 'stage.segment.io',
    siteId: 'a-63d5abf3'
  };

  beforeEach(function() {
    analytics = new Analytics();
    monetate = new Monetate(options);
    analytics.use(Monetate);
    analytics.use(tester);
    analytics.add(monetate);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    monetate.reset();
    sandbox();
  });

  describe('before loading', function() {
    var queue;

    beforeEach(function() {
      queue = window.monetateQ;
      delete window.monetateQ;
    });

    afterEach(function() {
      window.monetateQ = queue;
    });

    describe('#initialize', function() {
      it('should set .monetateQ', function() {
        analytics.assert(!window.monetateQ);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.monetateQ);
      });
    });

    describe('#loaded', function() {
      it('should test window.monetateQ', function() {
        analytics.assert(!monetate.loaded());
        window.monetateQ = window.monetateQ || [];
        analytics.assert(monetate.loaded());
      });
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
        analytics.stub(window.monetateQ, 'push');
      });

      it('should setPageType with category', function() {
        analytics.page(null, 'my page');
        analytics.called(window.monetateQ.push, ['setPageType', 'my page']);
      });

      it('should setPageType with name if category is omitted', function() {
        analytics.page('my page');
        analytics.called(window.monetateQ.push, ['setPageType', 'my page']);
      });

      it('should setPageType with `unknown` if name and category omitted', function() {
        analytics.page();
        analytics.called(window.monetateQ.push, ['setPageType', 'unknown']);
      });

      it('should prefer category', function() {
        analytics.page('category', 'name');
        analytics.called(window.monetateQ.push, ['setPageType', 'category']);
      });
    });
  });

  describe('Retail', function() {
    beforeEach(function(done) {
      monetate.options.retail = true;
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('ecommerce', function() {
      beforeEach(function() {
        analytics.stub(window.monetateQ, 'push');
      });

      it('should track product viewed', function() {
        analytics.track('product viewed', {
          product_id: 'bb161be4',
          sku: 'fc0b3bb',
          name: 'sony pulse',
          price: 299,
          quantity: 8
        });
        analytics.called(window.monetateQ.push, [
          'addProductDetails',
          ['bb161be4']
        ]);
      });

      it('should track product list viewed', function() {
        analytics.track('product list viewed', {
          products: [
            {
              product_id: 'bb161be4',
              sku: 'fc0b3bb',
              name: 'sony pulse',
              price: 299,
              quantity: 8
            },
            {
              product_id: 'bb181be4',
              sku: 'fc1b3bb',
              name: 'sony play',
              price: 299,
              quantity: 1
            }
          ]
        });
        var expected = [
          'addProducts',
          [
            { itemId: 'bb161be4', sku: 'fc0b3bb' },
            { itemId: 'bb181be4', sku: 'fc1b3bb' }
          ]
        ];
        analytics.called(window.monetateQ.push, expected);
      });

      it('should track product added', function() {
        analytics.track('product added', {
          product_id: 'bb161be4',
          sku: 'fc0b3bb',
          name: 'sony pulse',
          price: 299,
          quantity: 8
        });
        analytics.called(window.monetateQ.push, [
          'addCartRows',
          [
            {
              itemId: 'bb161be4',
              sku: 'fc0b3bb',
              quantity: 8,
              unitPrice: '299.00'
            }
          ]
        ]);
      });

      it('should track order completed', function() {
        analytics.track('order completed', {
          orderId: 'e493a192',
          products: [
            {
              product_id: '64f9fa13',
              sku: 'd69bf602',
              price: 299,
              quantity: 1,
              name: 'sony pulse'
            }
          ]
        });
        analytics.called(window.monetateQ.push, [
          'addPurchaseRows',
          [
            {
              conversionId: 'e493a192',
              itemId: '64f9fa13',
              sku: 'd69bf602',
              unitPrice: '299.00',
              quantity: 1
            }
          ]
        ]);
      });
    });
  });

  describe('General', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('ecommerce', function() {
      beforeEach(function() {
        analytics.stub(window.monetateQ, 'push');
      });

      it('should track product viewed', function() {
        analytics.track('product viewed', {
          product_id: 'bb161be4',
          sku: 'fc0b3bb',
          name: 'sony pulse',
          price: 299,
          quantity: 8
        });
        analytics.called(window.monetateQ.push, ['addItems', ['bb161be4']]);
      });

      it('should track product added', function() {
        analytics.track('product added', {
          product_id: 'bb161be4',
          sku: 'fc0b3bb',
          name: 'sony pulse',
          price: 299,
          quantity: 8
        });
        analytics.called(window.monetateQ.push, [
          'addReviewRows',
          [
            {
              itemId: 'bb161be4',
              sku: 'fc0b3bb',
              quantity: 8,
              unitPrice: '299.00'
            }
          ]
        ]);
      });

      it('should track order completed', function() {
        analytics.track('order completed', {
          orderId: 'e493a192',
          products: [
            {
              product_id: '64f9fa13',
              sku: 'd69bf602',
              price: 299,
              quantity: 1,
              name: 'sony pulse'
            }
          ]
        });
        analytics.called(window.monetateQ.push, [
          'addConversionRows',
          [
            {
              conversionId: 'e493a192',
              itemId: '64f9fa13',
              sku: 'd69bf602',
              unitPrice: '299.00',
              quantity: 1
            }
          ]
        ]);
      });
    });
  });
});
