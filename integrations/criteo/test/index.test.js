'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var Criteo = require('../lib/');
var md5 = require('md5');

describe('Criteo', function() {
  var analytics;
  var criteo;
  var options = {
    account: 42323,
    supportingPageData: {},
    supportingUserData: {},
    eventMappings: {}
  };

  beforeEach(function() {
    analytics = new Analytics();
    criteo = new Criteo(options);
    analytics.use(integrationTester);
    analytics.use(Criteo);
    analytics.add(criteo);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    criteo.reset();
    sandbox();
  });

  it('should have the correct options', function() {
    analytics.compare(
      Criteo,
      integration('Criteo')
        .option('account', '')
        .option('homeUrl', '')
        .option('supportingUserData', {})
        .option('supportingPageData', {})
        .tag('<script src="http://static.criteo.net/js/ld/ld.js">')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(criteo, 'load');
    });

    describe('#initialize', function() {
      // write assertions here if you do any logic to create or set things in the `.initialize()` function
      it('should create window.criteo_q', function() {
        analytics.assert(!window.criteo_q);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.criteo_q);
      });

      it('should call load', function() {
        analytics.initialize();
        analytics.called(criteo.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(criteo, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.criteo_q, 'push');
      });

      it('should track pages named `Home`', function() {
        analytics.page('Home');
        analytics.called(window.criteo_q.push, { event: 'viewHome' });
      });

      it('should track pages with locations that match the `homeUrl` setting', function() {
        criteo.options.homeUrl = 'https://example.com';
        analytics.page('Maybe Home', { url: 'https://example.com' });
        analytics.called(window.criteo_q.push, { event: 'viewHome' });
      });

      it('should not track pages with locations that are not either the homeUrl setting, have the path as / or are named Home', function() {
        criteo.options.homeUrl = '';
        analytics.page('Maybe Home', { url: 'https://example.com/some-path' });
        analytics.didNotCall(window.criteo_q.push, { event: 'viewHome' });
      });

      it('should set supportingPageData', function() {
        criteo.options.supportingPageData = { team: 'team_page' };
        analytics.page('Home', { team: 'New York Giants' });
        analytics.called(window.criteo_q.push, {
          event: 'setData',
          team_page: 'New York Giants'
        });
        analytics.called(window.criteo_q.push, { event: 'viewHome' });
      });
    });

    describe('#track', function() {
      var eventTypeMappings = {
        viewItem: 'productViewed',
        viewList: 'productListViewed',
        viewBasket: 'cartViewed',
        trackTransaction: 'orderCompleted'
      };

      beforeEach(function() {
        for (var event in eventTypeMappings) {
          if (!eventTypeMappings.hasOwnProperty(event)) {
            continue;
          }
          analytics.stub(criteo, eventTypeMappings[event]);
        }
      });

      it('should handle custom event mappings', function() {
        for (var eventType in eventTypeMappings) {
          if (!eventTypeMappings.hasOwnProperty(eventType)) {
            continue;
          }
          var customEventName = 'myCustomEvent';
          var handler = eventTypeMappings[eventType];
          criteo.options.eventMappings[customEventName] = eventType;
          analytics.track(customEventName, {});
          analytics.called(criteo[handler]);
        }
      });
    });

    describe('#productViewed', function() {
      beforeEach(function() {
        analytics.stub(window.criteo_q, 'push');
      });

      it('should track productViewed events as `viewItem`', function() {
        var id = '12345';
        analytics.track('Product Viewed', { productId: id });
        analytics.called(window.criteo_q.push, {
          event: 'viewItem',
          product: id
        });
      });
    });

    describe('#productListViewed', function() {
      beforeEach(function() {
        analytics.stub(window.criteo_q, 'push');
      });

      it('should track productListViewed events as `viewList` with array of product ids', function() {
        var products = [
          { productId: '1' },
          { productId: '2' },
          { productId: '3' },
          { productId: '4' }
        ];
        analytics.track('Product List Viewed', { products: products });
        analytics.called(window.criteo_q.push, {
          event: 'viewList',
          product: ['1', '2', '3', '4']
        });
      });
    });

    describe('#cartViewed', function() {
      beforeEach(function() {
        analytics.stub(window.criteo_q, 'push');
      });

      it('should track cartViewed events as `viewBasket`', function() {
        var products = [
          {
            productId: '1',
            price: '10',
            quantity: 5
          },
          {
            productId: '2',
            price: '20',
            quantity: 10
          },
          {
            productId: '3',
            price: '40',
            quantity: 20
          },
          {
            productId: '4',
            price: '80',
            quantity: 40
          }
        ];
        var productsPayload = products.map(function(product) {
          return {
            id: product.productId,
            price: product.price,
            quantity: product.quantity
          };
        });

        analytics.track('cartViewed', { products: products });
        analytics.called(window.criteo_q.push, {
          event: 'viewBasket',
          product: productsPayload
        });
      });
    });

    describe('#orderCompleted', function() {
      beforeEach(function() {
        analytics.stub(window.criteo_q, 'push');
      });

      it('should track orderCompleted events as `trackTransaction`', function() {
        var products = [
          {
            productId: '1',
            price: '10',
            quantity: 5
          },
          {
            productId: '2',
            price: '20',
            quantity: 10
          },
          {
            productId: '3',
            price: '40',
            quantity: 20
          },
          {
            productId: '4',
            price: '80',
            quantity: 40
          }
        ];
        var productsPayload = products.map(function(product) {
          return {
            id: product.productId,
            price: product.price,
            quantity: product.quantity
          };
        });

        analytics.track('orderCompleted', {
          orderId: '1234',
          products: products
        });
        analytics.called(window.criteo_q.push, {
          event: 'trackTransaction',
          product: productsPayload,
          id: '1234'
        });
      });
    });

    describe('#setData', function() {
      beforeEach(function() {
        analytics.stub(window.criteo_q, 'push');
      });

      it('should add supportingUserData as extra params', function() {
        var products = [
          { productId: '1' },
          { productId: '2' },
          { productId: '3' },
          { productId: '4' }
        ];
        criteo.options.supportingUserData = { subscriptionStatus: 'sub_stat' };

        analytics.user().traits({ subscriptionStatus: 'trial' });
        analytics.track('Product List Viewed', { products: products });
        analytics.called(
          window.criteo_q.push,
          { event: 'viewList', product: ['1', '2', '3', '4'] },
          { event: 'setData', sub_stat: 'trial' }
        );
      });

      it('should detect an email trait, hash it, and fire the `setEmail` tag', function() {
        var email = 'chris.nixon@segment.com';

        analytics.user().traits({ email: email });
        analytics.track('Product Viewed', { productId: '12345' });
        analytics.called(
          window.criteo_q.push,
          { event: 'viewItem', product: '12345' },
          { event: 'setEmail', email: md5(email) }
        );
      });

      it('should not send email as an unencoded extraData parameter', function() {
        var id = '12345';
        var email = 'chris.nixon@segment.com';
        criteo.options.supportingUserData = { email: 'email' };

        analytics.user().traits({ email: email });
        analytics.track('Product Viewed', { productId: id });
        analytics.didNotCall(
          window.criteo_q.push,
          { event: 'viewItem', product: id },
          { event: 'setData', email: email }
        );
      });

      it('should fire setCustomerId tag if userId is defined', function() {
        analytics.user().id('userId');
        analytics.track('Product Viewed', { productId: '12345' });
        analytics.called(
          window.criteo_q.push,
          { event: 'viewItem', product: '12345' },
          { event: 'setCustomerId', id: 'userId' }
        );
      });

      it('should not set customer_id if userId is an email', function() {
        var email = 'chris.nixon@segment.com';
        analytics.user().id('userId');
        analytics.track('Product Viewed', { productId: '12345' });
        analytics.didNotCall(window.criteo_q.push, {
          event: 'setCustomerId',
          id: email
        });
      });
    });
  });
});
