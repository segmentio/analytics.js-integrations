'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var FoxMetrics = require('../lib/');

describe('FoxMetrics', function() {
  var analytics;
  var foxmetrics;
  var options = {
    appId: '5135085424023236bca9c08c'
  };

  beforeEach(function() {
    analytics = new Analytics();
    foxmetrics = new FoxMetrics(options);
    analytics.use(FoxMetrics);
    analytics.use(tester);
    analytics.add(foxmetrics);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    foxmetrics.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(FoxMetrics, integration('FoxMetrics')
      .assumesPageview()
      .global('_fxm')
      .option('appId', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(foxmetrics, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(foxmetrics.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(foxmetrics, done);
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
        analytics.stub(window._fxm, 'push');
      });

      it('should send a page view', function() {
        analytics.page();
        analytics.called(window._fxm.push, [
          '_fxm.pages.view',
          document.title,
          undefined,
          undefined,
          window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname,
          document.referrer
        ]);
      });

      it('should send page properties', function() {
        analytics.page('category', 'name', {
          referrer: 'referrer',
          title: 'title',
          url: 'url'
        });

        analytics.called(window._fxm.push, [
          '_fxm.pages.view',
          'title',
          'name',
          'category',
          'url',
          'referrer'
        ]);
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._fxm, 'push');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window._fxm.push, [
          '_fxm.visitor.profile',
          'id',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          { id: 'id' }
        ]);
      });

      it('should not only send traits', function() {
        analytics.identify({ trait: true });
        analytics.didNotCall(window._fxm.push);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', {
          address: 'address',
          email: 'email@example.com',
          firstName: 'first',
          lastName: 'last',
          trait: true
        });
        analytics.called(window._fxm.push, [
          '_fxm.visitor.profile',
          'id',
          'first',
          'last',
          'email@example.com',
          'address',
          undefined,
          undefined,
          {
            address: 'address',
            email: 'email@example.com',
            firstName: 'first',
            lastName: 'last',
            trait: true,
            id: 'id'
          }
        ]);
      });

      it('should split a name trait', function() {
        analytics.identify('id', { name: 'first last' });
        analytics.called(window._fxm.push, [
          '_fxm.visitor.profile',
          'id',
          'first',
          'last',
          undefined,
          undefined,
          undefined,
          undefined,
          {
            name: 'first last',
            id: 'id'
          }
        ]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._fxm, 'push');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._fxm.push, [
          'event',
          undefined,
          {}
        ]);
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window._fxm.push, [
          'event',
          undefined,
          { property: true }
        ]);
      });

      it('should send a category property', function() {
        analytics.track('event', { category: 'category' });
        analytics.called(window._fxm.push, [
          'event',
          'category',
          { category: 'category' }
        ]);
      });

      it('should send a stored category', function() {
        analytics.page('category');
        analytics.track('event', { category: 'category' });
        analytics.called(window._fxm.push, [
          '_fxm.pages.view',
          document.title,
          'category',
          null,
          window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname,
          document.referrer
        ]);
      });
    });

    describe('ecommerce', function() {
      beforeEach(function() {
        analytics.stub(window._fxm, 'push');
      });

      it('should track product viewed', function() {
        analytics.track('product viewed', {
          sku: 'f84d349b',
          name: 'my-product',
          category: 'category'
        });

        analytics.called(window._fxm.push, [
          '_fxm.ecommerce.productview',
          'f84d349b',
          'my-product',
          'category'
        ]);
      });

      it('should track product added', function() {
        analytics.track('product added', {
          product_id: 'c1ec1864',
          name: 'my-product',
          category: 'category'
        });

        analytics.called(window._fxm.push, [
          '_fxm.ecommerce.cartitem',
          'c1ec1864',
          'my-product',
          'category'
        ]);
      });

      it('should track product removed', function() {
        analytics.track('product removed', {
          product_id: 'yolo',
          id: 'yolo2',
          sku: 'c1ec1864',
          name: 'my-product'
        });

        analytics.called(window._fxm.push, [
          '_fxm.ecommerce.removecartitem',
          'yolo',
          'my-product',
          undefined
        ]);
      });

      it('should track order completed', function() {
        analytics.track('order completed', {
          order_id: '3723ee8a',
          total: 300,
          tax: 10,
          shipping: 20,
          products: [{
            product_id: 'charlie',
            sku: 'd370b4cd',
            name: 'sony pulse',
            category: 'tech',
            price: 270,
            quantity: 1
          }]
        });

        analytics.deepEqual(window._fxm.push.args[0][0], [
          '_fxm.ecommerce.order',
          '3723ee8a',
          270,
          20,
          10,
          null,
          null,
          undefined,
          1
        ]);

        analytics.deepEqual(window._fxm.push.args[1][0], [
          '_fxm.ecommerce.purchaseitem',
          'charlie',
          'sony pulse',
          'tech',
          1,
          270,
          '3723ee8a'
        ]);
      });
    });
  });
});
