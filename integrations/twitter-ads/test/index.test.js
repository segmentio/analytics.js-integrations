'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Twitter = require('../lib/');

describe('Twitter Ads', function() {
  var analytics;
  var twitter;
  var options = {
    events: {
      signup: 'c36462a3',
      login: '6137ab24',
      play: 'e3196de1',
      'Order Completed': 'adsf7as8',
      'Product Viewed': 'asodn281',
      'Product Added': 'idbdn291',
      'Products Searched': 'bbnmz010',
      'Product Added To Wishlist': 'zasnd888',
      'Checkout Started': 'mzzns123',
      'Payment Info Entered': 'alsnx120'
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    twitter = new Twitter(options);
    analytics.use(Twitter);
    analytics.use(tester);
    analytics.add(twitter);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    twitter.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(Twitter, integration('Twitter Ads')
      .option('page', '')
      .option('universalTagPixelId', '')
      .mapping('events'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(twitter, 'load');
    });

    describe('initialize', function() {
      it('should create window.twq if universal tag pixel id is provided', function() {
        twitter.options.universalTagPixelId = 'teemo';
        analytics.assert(!window.twq);
        analytics.initialize();
        analytics.assert(typeof window.twq === 'function');
      });

      it('should not load universal tag script if universal tag pixel id is not provided', function() {
        analytics.initialize();
        analytics.didNotCall(twitter.load);
      });

      it('should load universal tag script if universal tag pixel id is provided', function() {
        twitter.options.universalTagPixelId = 'teemo';
        analytics.initialize();
        analytics.called(twitter.load, 'universalTag');
      });
    });
  });

  describe('during loading', function() {
    describe('initialize', function() {
      beforeEach(function(done) {
        twitter.options.universalTagPixelId = 'teemo';
        analytics.initialize();
        analytics.stub(window, 'twq');
        analytics.once('ready', done);
      });

      it('should initialize twq with the universal tag pixel id if provided', function() {
        analytics.called(window.twq, 'init', 'teemo');
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.spy(twitter, 'load');
        analytics.spy(window, 'twq');
      });

      describe('single tag', function() {
        it('should not send if `page` option is not defined', function() {
          analytics.page();
          analytics.didNotCall(twitter.load);
        });

        it('should send if `page` option is defined', function() {
          twitter.options.page = 'e3196de1';
          analytics.page();
          analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=e3196de1&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=0">');
        });
      });

      describe('single tag + universal', function() {
        it('should send if `page` option is defined and also track standard pageview', function() {
          twitter.options.page = 'e3196de1';
          twitter.options.universalTagPixelId = 'teemo';
          analytics.page();
          analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=e3196de1&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=0">');
          analytics.called(window.twq, 'track', 'PageView');
        });
      });

      describe('universal tag', function() {
        it('should track standard pageview', function() {
          twitter.options.universalTagPixelId = 'teemo';
          analytics.page();
          analytics.called(window.twq, 'track', 'PageView');
        });

        it('should not call default single tag for pageviews', function() {
          twitter.options.universalTagPixelId = 'teemo';
          analytics.page();
          analytics.didNotCall(twitter.load);
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(twitter, 'load');
      });

      it('should not send if event is not defined', function() {
        analytics.track('toString');
        analytics.didNotCall(twitter.load);
      });

      it('should send correctly', function() {
        analytics.track('play');
        analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=e3196de1&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=0">');
      });

      it('should support array events', function() {
        twitter.options.events = [{ key: 'event', value: 12 }];
        analytics.track('event');
        analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=12&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=0">');
      });

      it('should send revenue', function() {
        analytics.track('signup', { revenue: 10 });
        analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=c36462a3&p_id=Twitter&tw_sale_amount=10&tw_order_quantity=0">');
      });
    });
  });

  describe('#ecommerce', function() {
    beforeEach(function(done) {
      twitter.options.universalTagPixelId = 'teemo';
      twitter.options.identifier = 'productId';
      analytics.on('ready', function() {
        analytics.spy(twitter, 'load');
        analytics.spy(window, 'twq');
        done();
      });
      analytics.initialize();
    });

    describe('#orderCompleted', function() {
      describe('#legacy', function() {
        it('should send legacy conversion event for Order Completed', function() {
          analytics.track('Order Completed', {
            orderId: '50314b8e9bcf000000000000',
            total: 30,
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'USD',
            repeat: true,
            products: [
              {
                id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
              }
            ]
          });
          analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=adsf7as8&p_id=Twitter&tw_sale_amount=25&tw_order_quantity=1">');
        });

        it('should send quantity as sum of all product\'s quantities', function() {
          analytics.track('Order Completed', {
            orderId: '50314b8e9bcf000000000000',
            total: 30,
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'USD',
            repeat: true,
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
          analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=adsf7as8&p_id=Twitter&tw_sale_amount=25&tw_order_quantity=3">');
        });
      });

      describe('#UWT', function() {
        it('should send a Purchase tag', function() {
          analytics.track('Order Completed', {
            orderId: '50314b8e9bcf000000000000',
            total: 30,
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'USD',
            repeat: true,
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
              }
            ]
          });
          analytics.called(window.twq, 'track', 'Purchase', {
            value: '25.00',
            currency: 'USD',
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition',
            num_items: '1',
            order_id: '50314b8e9bcf000000000000'
          });
        });

        it('should send content_ids and content_name properly for multiple products for UWT', function() {
          analytics.track('Order Completed', {
            orderId: '50314b8e9bcf000000000000',
            total: 30,
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'USD',
            repeat: true,
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
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
          });
          analytics.called(window.twq, 'track', 'Purchase', {
            value: '25.00',
            currency: 'USD',
            content_ids: ['505bd76785ebb509fc183733', '507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition, Uno Card Game',
            num_items: '3',
            order_id: '50314b8e9bcf000000000000'
          });
        });

        it('should send a purchase event with correct product identifier', function() {
          twitter.options.identifier = 'sku';
          analytics.track('Order Completed', {
            orderId: '50314b8e9bcf000000000000',
            total: 30,
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'USD',
            repeat: true,
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
              }
            ]
          });
          analytics.called(window.twq, 'track', 'Purchase', {
            value: '25.00',
            currency: 'USD',
            content_ids: ['45790-32'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition',
            num_items: '1',
            order_id: '50314b8e9bcf000000000000'
          });
        });

        it('should send a purchase event with status if properties.status is provided', function() {
          analytics.track('Order Completed', {
            orderId: '50314b8e9bcf000000000000',
            total: 30,
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'USD',
            repeat: true,
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
              }
            ],
            status: 'tilted'
          });
          analytics.called(window.twq, 'track', 'Purchase', {
            value: '25.00',
            currency: 'USD',
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition',
            num_items: '1',
            order_id: '50314b8e9bcf000000000000',
            status: 'tilted'
          });
        });
      });
    });

    describe('#productViewed', function() {
      describe('#legacy', function() {
        it('should fire single event website tag', function() {
          analytics.track('Product Viewed', {
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            currency: 'USD',
            position: 3,
            value: 18.99
          });
          analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=asodn281&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=1">');
        });
      });

      describe('#UWT', function() {
        it('should send ViewContent tag', function() {
          analytics.track('Product Viewed', {
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            currency: 'USD',
            position: 3,
            value: 18.99
          });
          analytics.called(window.twq, 'track', 'ViewContent', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition',
            content_category: 'Games'
          });
        });

        it('should fallback on price & qty if value is not provided', function() {
          analytics.track('Product Viewed', {
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 2,
            coupon: 'MAYDEALS',
            currency: 'USD',
            position: 3
          });
          analytics.called(window.twq, 'track', 'ViewContent', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition',
            content_category: 'Games'
          });
        });

        it('should send the ViewContent tag with right identifier', function() {
          twitter.options.identifier = 'sku';
          analytics.track('Product Viewed', {
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            currency: 'USD',
            position: 3,
            value: 18.99
          });
          analytics.called(window.twq, 'track', 'ViewContent', {
            content_ids: ['G-32'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition',
            content_category: 'Games'
          });
        });

        it('should send properties.status if provided', function() {
          analytics.track('Product Viewed', {
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            currency: 'USD',
            position: 3,
            value: 18.99,
            status: 'in review'
          });
          analytics.called(window.twq, 'track', 'ViewContent', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition',
            content_category: 'Games',
            status: 'in review'
          });
        });
      });
    });

    describe('#productAdded', function() {
      describe('#legacy', function() {
        it('should fire single event website tag', function() {
          analytics.track('Product Added', {
            cart_id: 'skdjsidjsdkdj29j',
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 2,
            coupon: 'MAYDEALS',
            position: 3
          });
          analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=idbdn291&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=2">');
        });
      });

      describe('#UWT', function() {
        it('should send AddToCart tag', function() {
          analytics.track('Product Added', {
            cart_id: 'skdjsidjsdkdj29j',
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 2,
            coupon: 'MAYDEALS',
            position: 3
          });
          analytics.called(window.twq, 'track', 'AddToCart', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition'
          });
        });

        it('should send the AddToCart tag with right identifier', function() {
          twitter.options.identifier = 'sku';
          analytics.track('Product Added', {
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            currency: 'USD',
            position: 3,
            value: 18.99
          });
          analytics.called(window.twq, 'track', 'AddToCart', {
            content_ids: ['G-32'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition'
          });
        });

        it('should pass properties.status if provided', function() {
          analytics.track('Product Added', {
            cart_id: 'skdjsidjsdkdj29j',
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 2,
            coupon: 'MAYDEALS',
            position: 3,
            status: 'in cart'
          });
          analytics.called(window.twq, 'track', 'AddToCart', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'Monopoly: 3rd Edition',
            status: 'in cart'
          });
        });
      });
    });

    describe('#productsSearched', function() {
      describe('#legacy', function() {
        it('should fire single website event tag', function() {
          analytics.track('Products Searched', { query: 'Where are my pants?' });
          analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=bbnmz010&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=0">');
        });
      });

      describe('#uWT', function() {
        it('should send Search tag', function() {
          analytics.track('Products Searched', { query: 'Where are my pants?' });
          analytics.called(window.twq, 'track', 'Search', {});
        });
      });
    });

    describe('#productAddedToWishlist', function() {
      describe('#legacy', function() {
        it('should fire single event website tag', function() {
          analytics.track('Product Added to Wishlist', {
            wishlist_id: 'skdjsidjsdkdj29j',
            wishlist_name: 'Loved Games',
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            position: 3
          });
          analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=zasnd888&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=1">');
        });
      });

      describe('#UTW', function() {
        it('should send AddToWishlist tag', function() {
          analytics.track('Product Added to Wishlist', {
            wishlist_id: 'skdjsidjsdkdj29j',
            wishlist_name: 'Loved Games',
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            position: 3
          });
          analytics.called(window.twq, 'track', 'AddToWishlist', {
            content_name: 'Monopoly: 3rd Edition',
            content_category: 'Games',
            content_ids: ['507f1f77bcf86cd799439011']
          });
        });

        it('should send AddToWishlist with correct identifier', function() {
          twitter.options.identifier = 'sku';
          analytics.track('Product Added to Wishlist', {
            wishlist_id: 'skdjsidjsdkdj29j',
            wishlist_name: 'Loved Games',
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            position: 3
          });
          analytics.called(window.twq, 'track', 'AddToWishlist', {
            content_name: 'Monopoly: 3rd Edition',
            content_category: 'Games',
            content_ids: ['G-32']
          });
        });

        it('should pass properties.status if provided', function() {
          analytics.track('Product Added to Wishlist', {
            wishlist_id: 'skdjsidjsdkdj29j',
            wishlist_name: 'Loved Games',
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            position: 3,
            status: 'wishing'
          });
          analytics.called(window.twq, 'track', 'AddToWishlist', {
            content_name: 'Monopoly: 3rd Edition',
            content_category: 'Games',
            content_ids: ['507f1f77bcf86cd799439011'],
            status: 'wishing'
          });
        });
      });
    });

    describe('#checkoutStarted', function() {
      describe('#legacy', function() {
        it('should send single event website tag', function() {
          analytics.track('Checkout Started', {
            order_id: '50314b8e9bcf000000000000',
            affiliation: 'Google Store',
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'KOR',
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
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
          });
          analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=mzzns123&p_id=Twitter&tw_sale_amount=25&tw_order_quantity=3">');
        });
      });

      describe('#UWT', function() {
        it('should send InitiateCheckout tag', function() {
          analytics.track('Checkout Started', {
            order_id: '50314b8e9bcf000000000000',
            affiliation: 'Google Store',
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'KOR',
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
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
          });
          analytics.called(window.twq, 'track', 'InitiateCheckout', {
            content_ids: ['505bd76785ebb509fc183733', '507f1f77bcf86cd799439011'],
            content_name: 'Monopoly: 3rd Edition, Uno Card Game',
            content_category: 'Games, Games'
          });
        });

        it('should send InitiateCheckout tag with the correct identifier', function() {
          twitter.options.identifier = 'sku';
          analytics.track('Checkout Started', {
            order_id: '50314b8e9bcf000000000000',
            affiliation: 'Google Store',
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'KOR',
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
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
          });
          analytics.called(window.twq, 'track', 'InitiateCheckout', {
            content_ids: ['45790-32', '46493-32'],
            content_name: 'Monopoly: 3rd Edition, Uno Card Game',
            content_category: 'Games, Games'
          });
        });

        it('should pass properties.status if provided', function() {
          analytics.track('Checkout Started', {
            order_id: '50314b8e9bcf000000000000',
            affiliation: 'Google Store',
            revenue: 25,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'KOR',
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
              },
              {
                product_id: '505bd76785ebb509fc183733',
                sku: '46493-32',
                name: 'Uno Card Game',
                price: 3,
                quantity: 2,
                category: 'Games'
              }
            ],
            status: 'in progress'
          });
          analytics.called(window.twq, 'track', 'InitiateCheckout', {
            content_ids: ['505bd76785ebb509fc183733', '507f1f77bcf86cd799439011'],
            content_name: 'Monopoly: 3rd Edition, Uno Card Game',
            content_category: 'Games, Games',
            status: 'in progress'
          });
        });
      });
    });

    describe('#paymentInfoEntered', function() {
      describe('#legacy', function() {
        it('should fire single event website tag', function() {
          analytics.track('Payment Info Entered', {
            checkout_id: '39f39fj39f3jf93fj9fj39fj3f',
            order_id: 'dkfsjidfjsdifsdfksdjfkdsfjsdfkdsf',
            step: 4,
            shipping_method: 'FedEx',
            payment_method: 'Credit Card'
          });
          analytics.loaded('<img src="http://analytics.twitter.com/i/adsct?txn_id=alsnx120&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=0">');
        });
      });

      describe('#UWT', function() {
        it('should send AddPaymentInfo tag', function() {
          analytics.track('Payment Info Entered', {
            checkout_id: '39f39fj39f3jf93fj9fj39fj3f',
            order_id: 'dkfsjidfjsdifsdfksdjfkdsfjsdfkdsf',
            step: 4,
            shipping_method: 'FedEx',
            payment_method: 'Credit Card'
          });
          analytics.called(window.twq, 'track', 'AddPaymentInfo', {});
        });

        it('should send AddPaymentInfo tag with status if properties.status is provided', function() {
          analytics.track('Payment Info Entered', {
            checkout_id: '39f39fj39f3jf93fj9fj39fj3f',
            order_id: 'dkfsjidfjsdifsdfksdjfkdsfjsdfkdsf',
            step: 4,
            shipping_method: 'FedEx',
            payment_method: 'Credit Card',
            status: 'paid'
          });
          analytics.called(window.twq, 'track', 'AddPaymentInfo', { status: 'paid' });
        });
      });
    });
  });
});
