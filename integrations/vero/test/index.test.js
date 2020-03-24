'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Vero = require('../lib/');

describe('Vero', function() {
  var analytics;
  var vero;
  var options = {
    apiKey: '99504fea17d9b70805e470a672af1c5b608eb88f'
  };

  beforeEach(function() {
    analytics = new Analytics();
    vero = new Vero(options);
    analytics.use(Vero);
    analytics.use(tester);
    analytics.add(vero);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    vero.reset();
    sandbox();
  });

  it('should store the proper settings', function() {
    analytics.compare(
      Vero,
      integration('Vero')
        .global('_veroq')
        .option('apiKey', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(vero, 'load');
    });

    describe('#initialize', function() {
      it('should push onto window._veroq', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._veroq[0], [
          'init',
          { api_key: options.apiKey }
        ]);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(vero.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(vero, done);
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
        analytics.stub(window._veroq, 'push');
      });

      it('should push "trackPageview"', function() {
        analytics.page();
        analytics.called(window._veroq.push, ['trackPageview']);
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._veroq, 'push');
      });

      it('shouldnt send without an id', function() {
        analytics.identify({ trait: true });
        analytics.didNotCall(window._veroq.push);
      });

      it('should send with just an id', function() {
        analytics.identify('id');
        analytics.called(window._veroq.push, [
          'user',
          {
            id: 'id'
          }
        ]);
      });

      it('should send with just an email', function() {
        analytics.identify(null, { email: 'name@example.com' });
        analytics.called(window._veroq.push, [
          'user',
          {
            email: 'name@example.com'
          }
        ]);
      });

      it('should send an id and email', function() {
        analytics.identify('id', { email: 'name@example.com' });
        analytics.called(window._veroq.push, [
          'user',
          {
            id: 'id',
            email: 'name@example.com'
          }
        ]);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', {
          email: 'name@example.com',
          trait: true
        });
        analytics.called(window._veroq.push, [
          'user',
          {
            id: 'id',
            email: 'name@example.com',
            trait: true
          }
        ]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._veroq, 'push');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._veroq.push, [
          'track',
          'event',
          {},
          { source: 'segment' }
        ]);
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window._veroq.push, [
          'track',
          'event',
          { property: true },
          { source: 'segment' }
        ]);
      });

      it('should send an unsubscribe event in the correct format', function() {
        analytics.track('unsubscribe', { id: 'id' });
        analytics.called(window._veroq.push, ['unsubscribe', { id: 'id' }]);
      });

      it('should send order completed', function() {
        analytics.track('Order Completed', {
          order_id: '50314b8e9bcf000000000000',
          total: 30,
          revenue: 25,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'foobar',
          currency: 'USD',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'foobarbaz',
              price: 19,
              quantity: 1,
              category: 'foo',
              productUrl: 'http://www.example.com/path/to/product',
              imageUrl: 'http://www.example.com/path/to/product/image.png'
            },
            {
              product_id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'barbazqux',
              price: 17.38,
              quantity: 2,
              category: 'bar'
            }
          ]
        });
        analytics.called(window._veroq.push, [
          'track',
          'Order Completed',
          {
            order_id: '50314b8e9bcf000000000000',
            total: 30,
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'foobar',
            currency: 'USD',
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'foobarbaz',
                price: 19,
                quantity: 1,
                category: 'foo',
                productUrl: 'http://www.example.com/path/to/product',
                imageUrl: 'http://www.example.com/path/to/product/image.png'
              },
              {
                product_id: '505bd76785ebb509fc183733',
                sku: '46493-32',
                name: 'barbazqux',
                price: 17.38,
                quantity: 2,
                category: 'bar'
              }
            ]
          },
          {
            source: 'segment'
          }
        ]);
      });

      it('should send ordered product', function() {
        analytics.track('Order Completed', {
          order_id: '50314b8e9bcf000000000000',
          total: 30,
          revenue: 25,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'foobar',
          currency: 'USD',
          products: [
            {
              product_id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'barbazqux',
              price: 17.38,
              quantity: 2,
              category: 'bar'
            }
          ]
        });
        analytics.calledTwice(window._veroq.push);
        analytics.called(window._veroq.push, [
          'track',
          'Order Completed',
          {
            order_id: '50314b8e9bcf000000000000',
            total: 30,
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'foobar',
            currency: 'USD',
            products: [
              {
                product_id: '505bd76785ebb509fc183733',
                sku: '46493-32',
                name: 'barbazqux',
                price: 17.38,
                quantity: 2,
                category: 'bar'
              }
            ]
          },
          {
            source: 'segment'
          }
        ]);
        analytics.called(window._veroq.push, [
          'track',
          'Ordered Product',
          {
            product_id: '505bd76785ebb509fc183733',
            sku: '46493-32',
            name: 'barbazqux',
            price: 17.38,
            quantity: 2,
            category: 'bar'
          },
          {
            source: 'segment'
          }
        ]);
      });
    });

    describe('#alias', function() {
      beforeEach(function() {
        analytics.stub(window._veroq, 'push');
      });

      it('should send a new id', function() {
        analytics.alias('new');
        analytics.called(window._veroq.push, ['reidentify', 'new']);
      });

      it('should send a new and old id', function() {
        analytics.alias('new', 'old');
        analytics.called(window._veroq.push, ['reidentify', 'new', 'old']);
      });
    });

    describe('#addOrRemoveTags', function() {
      beforeEach(function() {
        analytics.stub(window._veroq, 'push');
      });

      it('should add tags if they are present as integration options', function() {
        analytics.track(
          'event',
          {},
          {
            integrations: {
              Vero: {
                tags: {
                  action: 'add',
                  values: ['yoloer']
                }
              }
            }
          }
        );
        analytics.assert.deepEqual(window._veroq.push.args[1][0], [
          'tags',
          { add: ['yoloer'] }
        ]);
      });

      it('should remove tags if they are present as integration options', function() {
        analytics.track(
          'event',
          {},
          {
            integrations: {
              Vero: {
                tags: {
                  action: 'remove',
                  values: ['yoloer']
                }
              }
            }
          }
        );
        analytics.assert.deepEqual(window._veroq.push.args[1][0], [
          'tags',
          { remove: ['yoloer'] }
        ]);
      });

      it('should work for .identify calls', function() {
        analytics.identify(
          'user-id',
          {},
          {
            integrations: {
              Vero: {
                tags: {
                  action: 'add',
                  values: ['yoloer']
                }
              }
            }
          }
        );
        analytics.assert.deepEqual(window._veroq.push.args[1][0], [
          'tags',
          { add: ['yoloer'] }
        ]);
      });

      it('should add an id to the payload if one is present in the options object', function() {
        analytics.identify(
          'user-id',
          {},
          {
            integrations: {
              Vero: {
                tags: {
                  id: 'other-user-id',
                  action: 'add',
                  values: ['yoloer']
                }
              }
            }
          }
        );
        analytics.assert.deepEqual(window._veroq.push.args[1][0], [
          'tags',
          { id: 'other-user-id', add: ['yoloer'] }
        ]);
      });
    });
  });
});
