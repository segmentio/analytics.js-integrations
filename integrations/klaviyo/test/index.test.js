'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Klaviyo = require('../lib/');

describe('Klaviyo', function() {
  var analytics;
  var klaviyo;
  var options = {
    apiKey: 'hfWBjc'
  };

  beforeEach(function() {
    analytics = new Analytics();
    klaviyo = new Klaviyo(options);
    analytics.use(Klaviyo);
    analytics.use(tester);
    analytics.add(klaviyo);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    klaviyo.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Klaviyo, integration('Klaviyo')
      .assumesPageview()
      .global('_learnq')
      .option('apiKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(klaviyo, 'load');
    });

    describe('#initialize', function() {
      it('should create window._learnq', function() {
        analytics.assert(!window._learnq);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._learnq instanceof Array);
      });

      it('should push an api key', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._learnq, [['account', options.apiKey]]);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(klaviyo.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(klaviyo, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._learnq, 'push');
      });

      it('should send an $id', function() {
        analytics.identify('id');
        analytics.called(window._learnq.push, ['identify', { $id: 'id' }]);
      });

      it('should not send an id if enforceEmail is enabled', function() {
        klaviyo.options.enforceEmail = true;
        analytics.identify('id', { email: 'han@segment.com' });
        analytics.called(window._learnq.push, ['identify', { $email: 'han@segment.com' }]);
      });

      it('shouldnt send just traits', function() {
        analytics.identify({ trait: true });
        analytics.didNotCall(window._learnq.push);
      });

      it('should send an id and traits', function() {
        analytics.identify('horseRadish', { email: 'horses@horses.com', foo: true });
        analytics.called(window._learnq.push, ['identify', { $id: 'horseRadish', $email: 'horses@horses.com', foo: true }]);
      });

      it('should alias traits', function() {
        analytics.identify('id', {
          email: 'name@example.com',
          firstName: 'first',
          lastName: 'last',
          phone: 'phone',
          title: 'title'
        });
        analytics.called(window._learnq.push, ['identify', {
          $id: 'id',
          $email: 'name@example.com',
          $first_name: 'first',
          $last_name: 'last',
          $phone_number: 'phone',
          $title: 'title'
        }]);
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window._learnq, 'push');
      });

      it('should send a name', function() {
        analytics.group('id', { name: 'name' });
        analytics.called(window._learnq.push, ['identify', { $organization: 'name' }]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._learnq, 'push');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._learnq.push, ['track', 'event', {}]);
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window._learnq.push, ['track', 'event', { property: true }]);
      });

      it('should alias revenue to `$value`', function() {
        analytics.track('event', { revenue: 90 });
        analytics.called(window._learnq.push, ['track', 'event', { $value: 90 }]);
      });

      it('should send completed order', function() {
        analytics.track('Completed Order', {
          order_id: '50314b8e9bcf000000000000',
          total: 30,
          revenue: 25,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              productUrl: 'http://www.example.com/path/to/product',
              imageUrl: 'http://www.example.com/path/to/product/image.png'
            },
            {
              product_id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'Suh dude',
              price: 17.38,
              quantity: 2,
              category: 'Interwebs'
            }
          ]
        });
        analytics.called(window._learnq.push, ['track', 'Completed Order', {
          $event_id: '50314b8e9bcf000000000000',
          $value: 25,
          Categories: ['Games', 'Interwebs'],
          ItemNames: ['Monopoly: 3rd Edition', 'Suh dude'],
          Items: [
            {
              id: '507f1f77bcf86cd799439011',
              SKU: '45790-32',
              Name: 'Monopoly: 3rd Edition',
              Quantity: 1,
              ItemPrice: 19,
              RowTotal: 19,
              ProductURL: 'http://www.example.com/path/to/product',
              ImageURL: 'http://www.example.com/path/to/product/image.png',
              Categories: ['Games']
            },
            {
              id: '505bd76785ebb509fc183733',
              SKU: '46493-32',
              Name: 'Suh dude',
              Quantity: 2,
              ItemPrice: 17.38,
              RowTotal: 17.38,
              Categories: ['Interwebs']
            }
          ],
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD'
        }]);
      });

      it('should send an event for each product', function() {
        analytics.track('Completed Order', {
          order_id: '50314b8e9bcf000000000000',
          total: 30,
          revenue: 25,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              productUrl: 'http://www.example.com/path/to/product',
              imageUrl: 'http://www.example.com/path/to/product/image.png'
            }
          ]
        });
        analytics.calledTwice(window._learnq.push);
        analytics.called(window._learnq.push, ['track', 'Completed Order', {
          $event_id: '50314b8e9bcf000000000000',
          $value: 25,
          Categories: ['Games'],
          ItemNames: ['Monopoly: 3rd Edition'],
          Items: [
            {
              id: '507f1f77bcf86cd799439011',
              SKU: '45790-32',
              Name: 'Monopoly: 3rd Edition',
              Quantity: 1,
              ItemPrice: 19,
              RowTotal: 19,
              ProductURL: 'http://www.example.com/path/to/product',
              ImageURL: 'http://www.example.com/path/to/product/image.png',
              Categories: ['Games']
            }
          ],
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD'
        }]);
        analytics.called(window._learnq.push, ['track', 'Ordered Product', {
          $event_id: '50314b8e9bcf000000000000_507f1f77bcf86cd799439011',
          $value: 19,
          Name: 'Monopoly: 3rd Edition',
          Quantity: 1,
          ProductCategories: ['Games'],
          ProductURL: 'http://www.example.com/path/to/product',
          ImageURL: 'http://www.example.com/path/to/product/image.png',
          SKU: '45790-32'
        }]);
      });

      it('should have the correct $event_id for Ordered Product if id passed as product_id', function() {
        analytics.track('Completed Order', {
          order_id: '50314b8e9bcf000000000000',
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
              category: 'Games',
              productUrl: 'http://www.example.com/path/to/product',
              imageUrl: 'http://www.example.com/path/to/product/image.png'
            }
          ]
        });
        analytics.calledTwice(window._learnq.push);
        analytics.called(window._learnq.push, ['track', 'Ordered Product', {
          $event_id: '50314b8e9bcf000000000000_507f1f77bcf86cd799439011',
          $value: 19,
          Name: 'Monopoly: 3rd Edition',
          Quantity: 1,
          ProductCategories: ['Games'],
          ProductURL: 'http://www.example.com/path/to/product',
          ImageURL: 'http://www.example.com/path/to/product/image.png',
          SKU: '45790-32'
        }]);
      });

      it('should have the correct $event_id for Ordered Product if sku is passed and not id or produt_id', function() {
        analytics.track('Completed Order', {
          order_id: '50314b8e9bcf000000000000',
          total: 30,
          revenue: 25,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          products: [
            {
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              productUrl: 'http://www.example.com/path/to/product',
              imageUrl: 'http://www.example.com/path/to/product/image.png'
            }
          ]
        });
        analytics.calledTwice(window._learnq.push);
        analytics.called(window._learnq.push, ['track', 'Ordered Product', {
          $event_id: '50314b8e9bcf000000000000_45790-32',
          $value: 19,
          Name: 'Monopoly: 3rd Edition',
          Quantity: 1,
          ProductCategories: ['Games'],
          ProductURL: 'http://www.example.com/path/to/product',
          ImageURL: 'http://www.example.com/path/to/product/image.png',
          SKU: '45790-32'
        }]);
      });

      it('should let custom props pass', function() {
        analytics.track('Completed Order', {
          order_id: '50314b8e9bcf000000000000',
          letMePass: 'hi',
          customProp: true,
          total: 30,
          revenue: 25,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              productUrl: 'http://www.example.com/path/to/product',
              imageUrl: 'http://www.example.com/path/to/product/image.png',
              customItemProp: 'glenncoco',
              friday: 'is here'
            },
            {
              product_id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'Suh dude',
              price: 17.38,
              quantity: 2,
              category: 'Interwebs',
              pikachu: 'pika'
            }
          ]
        });
        analytics.called(window._learnq.push, ['track', 'Completed Order', {
          $event_id: '50314b8e9bcf000000000000',
          $value: 25,
          Categories: ['Games', 'Interwebs'],
          ItemNames: ['Monopoly: 3rd Edition', 'Suh dude'],
          Items: [
            {
              id: '507f1f77bcf86cd799439011',
              SKU: '45790-32',
              Name: 'Monopoly: 3rd Edition',
              Quantity: 1,
              ItemPrice: 19,
              RowTotal: 19,
              ProductURL: 'http://www.example.com/path/to/product',
              ImageURL: 'http://www.example.com/path/to/product/image.png',
              Categories: ['Games'],
              customItemProp: 'glenncoco',
              friday: 'is here'
            },
            {
              id: '505bd76785ebb509fc183733',
              SKU: '46493-32',
              Name: 'Suh dude',
              Quantity: 2,
              ItemPrice: 17.38,
              RowTotal: 17.38,
              Categories: ['Interwebs'],
              pikachu: 'pika'
            }
          ],
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          letMePass: 'hi',
          customProp: true
        }]);
      });
    });
  });
});
