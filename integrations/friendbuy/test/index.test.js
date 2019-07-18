'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var FriendBuy = require('../lib/');
var util = require('util');

describe('FriendBuy', function() {
  var analytics;
  var friendbuy;
  var options = {
    siteId: 'site-926e4408-host', // destinations-testing test account
    widgets: [],
    siteWideWidgets: []
  };

  beforeEach(function() {
    analytics = new Analytics();
    friendbuy = new FriendBuy(options);
    analytics.use(integrationTester);
    analytics.use(FriendBuy);
    analytics.add(friendbuy);
  });

  afterEach(function(done) {
    analytics.waitForScripts(function() {
      analytics.restore();
      analytics.reset();
      friendbuy.reset();
      sandbox();
      done();
    });
  });

  it('should have the correct options', function() {
    analytics.compare(
      FriendBuy,
      integration('FriendBuy')
        .global('friendbuy')
        .option('siteId', '')
        .option('widgets', [])
        .option('siteWideWidgets', [])
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(friendbuy, 'load');
    });

    describe('#initialize', function() {
      it('should create window.friendbuy', function() {
        analytics.assert(!window.friendbuy);
        analytics.initialize();
        analytics.assert(window.friendbuy);
      });

      it('should call load', function() {
        analytics.initialize();
        analytics.called(friendbuy.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      // We can't use analytics.load directly
      analytics.assert(
        !friendbuy.loaded(),
        'Expected `integration.loaded()` to be false before loading.'
      );
      analytics.once('ready', function() {
        try {
          analytics.assert(
            friendbuy.loaded(),
            'Expected `integration.loaded()` to be true after loading.'
          );
          done();
        } catch (err) {
          done(err);
        }
      });
      analytics.initialize();
      analytics.page({}, { Marketo: true });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      describe('widget management', function() {
        var expectedConfig = {
          configuration: {
            auto_delay: null
          }
        };

        beforeEach(function() {
          analytics.stub(window.friendbuy, 'push');
        });

        it('should always fire the site wide widget', function() {
          friendbuy.options.siteWideWidgets = [
            {
              value: {
                id: 'dyc-mlz',
                autoDelay: 0,
                parameters: []
              }
            }
          ];
          // should load widget regardless of page name (even unnamed)
          analytics.page();
          analytics.called(window.friendbuy.push, [
            'widget',
            friendbuy.options.siteWideWidgets[0].value.id,
            expectedConfig
          ]);
        });

        it('should load widget with default configs if widgetId defined in options', function() {
          friendbuy.options.widgets = [
            {
              value: {
                name: 'Jaythoven',
                id: 'dyc-mlz',
                autoDelay: 0,
                parameters: []
              }
            }
          ];
          analytics.page('jaythoven');
          analytics.called(window.friendbuy.push, [
            'widget',
            friendbuy.options.widgets[0].value.id,
            expectedConfig
          ]);
        });

        it('should call both site wide and explicit widgets', function() {
          friendbuy.options.siteWideWidgets = [
            {
              value: {
                id: 'dyc-mlz',
                autoDelay: 0,
                parameters: []
              }
            }
          ];
          friendbuy.options.widgets = [
            {
              value: {
                name: 'Jaythoven',
                id: 'dyc-mlz',
                autoDelay: 0,
                parameters: []
              }
            }
          ];
          analytics.page('jaythoven');
          analytics.called(window.friendbuy.push, [
            'widget',
            friendbuy.options.widgets[0].value.id,
            expectedConfig
          ]);
          analytics.called(window.friendbuy.push, [
            'widget',
            friendbuy.options.siteWideWidgets[0].value.id,
            expectedConfig
          ]);
        });

        it('should not load widget if nothing mapped', function() {
          analytics.page('jaythoven');
          analytics.didNotCall(window.friendbuy.push);
        });

        it('should load widget with custom configs', function() {
          friendbuy.options.widgets = [
            {
              value: {
                name: 'jaythoven',
                id: 'dyc-mlz',
                selector: 'div.stranger-things',
                autoDelay: '5000',
                parameters: [{ key: 'isSurvey', value: 'survey' }]
              }
            }
          ];
          expectedConfig.configuration.auto_delay = parseInt(
            friendbuy.options.widgets[0].value.autoDelay,
            10
          );
          expectedConfig.parameters = { survey: true };
          var traits = { vip: true };
          analytics.page('jaythoven', { isSurvey: true }, { traits: traits });
          analytics.called(window.friendbuy.push, [
            'widget',
            friendbuy.options.widgets[0].value.id,
            friendbuy.options.widgets[0].value.selector,
            expectedConfig
          ]);
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.spy(window.friendbuy, 'push');
      });

      var myElectrifyingTraits = {
        email: 'L-chapo-with-the-fat-body@gmail.com',
        lastName: 'ever',
        firstName: 'greatest'
      };
      var userId = 'han-solo';

      it('should track customer', function() {
        analytics.identify(userId, myElectrifyingTraits, {
          FriendBuy: {
            stripe_customer_id: 'staging-billing-is-broken',
            chargebee_customer_id: 'buzz-buzz'
          }
        });
        analytics.called(window.friendbuy.push, [
          'track',
          'customer',
          {
            id: userId,
            email: myElectrifyingTraits.email,
            first_name: myElectrifyingTraits.firstName,
            last_name: myElectrifyingTraits.lastName,
            stripe_customer_id: 'staging-billing-is-broken',
            chargebee_customer_id: 'buzz-buzz'
          }
        ]);
      });
    });

    describe('#orderCompleted', function() {
      beforeEach(function() {
        analytics.spy(window.friendbuy, 'push');
      });

      var props = {
        checkout_id: 'fksdjfsdjfisjf9sdfjsd9f',
        order_id: '50314b8e9bcf000000000000',
        affiliation: 'Google Store',
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
            url: 'https://www.company.com/product/path',
            image_url: 'https:///www.company.com/product/path.jpg'
          },
          {
            product_id: '505bd76785ebb509fc183733',
            sku: '46493-32',
            name: 'Uno Card Game',
            price: 3,
            quantity: 2,
            category: 'Games'
          }
        ]
      };

      it('should track top level order', function() {
        analytics.track('Order Completed', props, {
          traits: { email: 'han@segment.com' },
          FriendBuy: { new_customer: true }
        });
        analytics.called(window.friendbuy.push, [
          'track',
          'order',
          {
            id: props.order_id,
            email: 'han@segment.com',
            amount: props.revenue,
            coupon_code: props.coupon,
            new_customer: true
          }
        ]);
      });

      it('should track products in the order', function() {
        var products = props.products;
        analytics.track('Order Completed', props, {
          traits: { email: 'han@segment.com' }
        });
        analytics.deepEqual(window.friendbuy.push.args[1], [
          [
            'track',
            'products',
            [
              {
                sku: products[0].sku,
                price: products[0].price,
                quantity: products[0].quantity
              },
              {
                sku: products[1].sku,
                price: products[1].price,
                quantity: products[1].quantity
              }
            ]
          ]
        ]);
      });

      it('should not send order completed event without order_id', function() {
        delete props.order_id;
        analytics.track('Order Completed', props, {
          traits: { email: 'han@segment.com' }
        });
        analytics.didNotCall(window.friendbuy.push);
      });

      it('should not send product data without sku', function() {
        delete props.products[0].product_id;
        delete props.products[1].product_id;
        analytics.track('Order Completed', props, {
          traits: { email: 'han@segment.com' }
        });
        analytics.didNotCall(window.friendbuy.push);
      });
    });
  });
});
