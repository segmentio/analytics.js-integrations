'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var GTAG = require('../lib/');

describe('Gtag', function() {
  var analytics;
  var gtag;
  var options = {
    gaWebAppMeasurementId: 'G_12345678',
    trackNamedPages: true,
    trackAllPages: false,
    trackCategorizedPages: true,
    gaOptions: {}
  };

  beforeEach(function() {
    analytics = new Analytics();
    gtag = new GTAG(options);
    analytics.use(GTAG);
    analytics.use(tester);
    analytics.add(gtag);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    gtag.reset();
    sandbox();
  });

  it('should store the correct settings', function() {
    analytics.compare(
      GTAG,
      integration('Gtag')
        .global('gtagDataLayer')
        .option('gaWebMeasurementId', '')
        .option('gaWebAppMeasurementId', '')
        .option('awConversionId', '')
        .option('dcFloodLightId', '')
        .option('trackNamedPages', true)
        .option('trackAllPages', false)
        .option('trackCategorizedPages', true)
        .option('gaOptions', {
          classic: false,
          enhancedEcommerce: false,
          setAllMappedProps: true
        })
    );
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(gtag, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      gtag.options = {
        gaWebMeasurementId: 'GA_WEB_MEASUREMENT_ID',
        awConversionId: 'AW_CONVERSION_ID'
      };
      analytics.once('ready', done);
      analytics.initialize();
    });

    it('should set default routing', function() {
      analytics.assert(window.gtagDataLayer[0] === 'config');
      analytics.assert(window.gtagDataLayer[1] === 'GA_WEB_MEASUREMENT_ID');
      analytics.assert(window.gtagDataLayer[2] === 'config');
      analytics.assert(window.gtagDataLayer[3] === 'AW_CONVERSION_ID');
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.gtagDataLayer, 'push');
      });

      it('should call track', function() {
        analytics.track();
        analytics.called(window.gtagDataLayer.push);
      });

      it('should call track with passed event', function() {
        analytics.track('test event');
        analytics.called(window.gtagDataLayer.push, 'event', 'test event', {
          event: 'test event',
          non_interaction: false
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.gtagDataLayer, 'push');
      });

      it('should set user id if GA is configured', function() {
        gtag.options.gaWebMeasurementId = 'GA_WEB_MEASUREMENT_ID';
        analytics.identify('userId');
        analytics.called(
          window.gtagDataLayer.push,
          'config',
          'GA_WEB_MEASUREMENT_ID',
          {
            user_id: 'userId'
          }
        );
      });

      it('should not set user id if GA is not configured', function() {
        gtag.options.gaWebMeasurementId = '';
        analytics.identify('userId');
        analytics.didNotCall(window.gtagDataLayer.push);
      });

      it('should not set user id if GA is configured but empty user id', function() {
        gtag.options.gaWebMeasurementId = 'GA_WEB_MEASUREMENT_ID';
        analytics.identify('');
        analytics.didNotCall(window.gtagDataLayer.push);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.gtagDataLayer, 'push');
      });

      it('should track page', function() {
        gtag.options.trackAllPages = true;
        analytics.page();
        analytics.called(window.gtagDataLayer.push);
      });

      it('should track named page', function() {
        gtag.options.trackAllPages = true;
        analytics.page('Pagename');
        analytics.called(window.gtagDataLayer.push, 'event', 'page_view', {
          page_title: 'Pagename',
          page_location: window.location.href,
          page_path: window.location.pathname,
          non_interaction: false
        });
      });

      it('should not track named page if option turned off ', function() {
        gtag.options.trackNamedPages = false;
        analytics.page('Pagename');
        analytics.didNotCall(window.gtagDataLayer.push);
      });

      it('should track named page if option turned on', function() {
        gtag.options.trackNamedPages = true;
        analytics.page('Pagename');
        analytics.called(window.gtagDataLayer.push, 'event', 'page_view', {
          page_title: 'Pagename',
          page_location: window.location.href,
          page_path: window.location.pathname,
          non_interaction: true
        });
      });

      it('should track page if trackAllPages option turned on and nonInteraction passed', function() {
        gtag.options.trackAllPages = true;
        gtag.options.nonInteraction = true;
        analytics.page('Pagename');
        analytics.called(window.gtagDataLayer.push, 'event', 'page_view', {
          page_title: 'Pagename',
          page_location: window.location.href,
          page_path: window.location.pathname,
          non_interaction: true
        });
      });

      it('should not track page if set to false', function() {
        gtag.options.trackNamedPages = false;
        gtag.options.trackCategorizedPages = false;
        analytics.page('Pagename');
        analytics.page('Category', 'name');
        analytics.didNotCall(window.gtagDataLayer.push);
      });

      it('should not track page if trackCategorizedPages set to true', function() {
        gtag.options.trackNamedPages = false;
        gtag.options.trackCategorizedPages = true;
        analytics.page('Pagename');
        analytics.page('Category', 'name');
        analytics.called(window.gtagDataLayer.push, 'event', 'page_view', {
          page_title: 'Category nameCategory',
          page_location: window.location.href,
          page_path: window.location.pathname,
          non_interaction: true
        });
      });

      it('should not track page if trackNamedPages & trackCategorizedPages set to true', function() {
        gtag.options.trackNamedPages = true;
        gtag.options.trackCategorizedPages = true;
        analytics.page('Pagename');
        analytics.page('Category', 'Pagename');
        analytics.calledThrice(window.gtagDataLayer.push);
      });

      it('should set custom dimensions if setAllMappedProps set to true', function() {
        gtag.options.gaWebMeasurementId = 'GA_WEB_MEASUREMENT_ID';
        gtag.options.trackNamedPages = true;
        gtag.options.gaOptions = {
          setAllMappedProps: true,
          dimensions: {
            company: 'dimension2'
          },
          metrics: {
            age: 'metric1'
          }
        };
        analytics.page('Page1', {
          loadTime: '100',
          levelAchieved: '5',
          company: 'Google'
        });
        analytics.called(
          window.gtagDataLayer.push,
          'config',
          'GA_WEB_MEASUREMENT_ID',
          {
            custom_map: GTAG.merge(
              gtag.options.gaOptions.dimensions,
              gtag.options.gaOptions.metrics
            )
          }
        );
      });

      it('should not set custom dimensions if setAllMappedProps set to false', function() {
        gtag.options.gaWebMeasurementId = 'GA_WEB_MEASUREMENT_ID';
        gtag.options.trackNamedPages = true;
        gtag.options.gaOptions = {
          setAllMappedProps: false,
          dimensions: {
            company: 'dimension2'
          },
          metrics: {
            age: 'metric1'
          }
        };
        analytics.page('Page1', {
          loadTime: '100',
          levelAchieved: '5',
          company: 'Google'
        });
        analytics.didNotCall(
          window.gtagDataLayer.push,
          'config',
          'GA_WEB_MEASUREMENT_ID',
          {
            custom_map: GTAG.merge(
              gtag.options.gaOptions.dimensions,
              gtag.options.gaOptions.metrics
            )
          }
        );
        analytics.called(window.gtagDataLayer.push, 'event', 'page_view');
      });
    });
  });
});

describe('GA Classic', function() {
  var analyticsClassic;
  var gtagClassic;
  var settings = {
    gaOptions: {
      classic: true
    },
    gaWebMeasurementId: 'GA-120399404'
  };

  beforeEach(function() {
    analyticsClassic = new Analytics();
    gtagClassic = new GTAG(settings);
    analyticsClassic.use(GTAG);
    analyticsClassic.use(tester);
    analyticsClassic.add(gtagClassic);
  });

  afterEach(function() {
    analyticsClassic.restore();
    analyticsClassic.reset();
    gtagClassic.reset();
    sandbox();
  });

  describe('loading', function() {
    it('should load', function(done) {
      analyticsClassic.load(gtagClassic, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      gtagClassic.options = {
        gaOptions: {
          classic: true,
          enhancedEcommerce: false
        },
        gaWebMeasurementId: 'GA-120399404'
      };
      analyticsClassic.once('ready', done);
      analyticsClassic.initialize();
    });

    describe('# page', function() {
      beforeEach(function() {
        analyticsClassic.stub(window.gtagDataLayer, 'push');
      });

      it('should track page', function() {
        gtagClassic.options.trackAllPages = true;
        analyticsClassic.page();
        analyticsClassic.called(window.gtagDataLayer.push);
      });

      it('should track named page', function() {
        gtagClassic.options.trackAllPages = true;
        analyticsClassic.page('Pagename');
        analyticsClassic.called(
          window.gtagDataLayer.push,
          'event',
          'page_view',
          {
            page_title: 'Pagename',
            page_location: window.location.href,
            page_path: window.location.pathname,
            non_interaction: false
          }
        );
      });
    });

    describe('ecommerce', function() {
      beforeEach(function() {
        analyticsClassic.stub(window.gtagDataLayer, 'push');
      });

      it('should call order completed', function() {
        analyticsClassic.track('Order Completed', {
          checkout_id: 'fksdjfsdjfisjf9sdfjsd9f',
          order_id: '24.031608523954162',
          affiliation: 'Whole Foods',
          total: 27.5,
          subtotal: 22.5,
          revenue: 25.0,
          shipping: 3,
          tax: 2,
          currency: 'USD',
          products: [
            {
              product_id: 'P12345',
              name: 'Birthday Cake',
              price: 19,
              quantity: 1,
              category: 'Bakery',
              position: '1'
            },
            {
              product_id: 'P67890',
              name: 'Apple',
              price: 3,
              quantity: 2,
              category: 'Fruit',
              position: '2'
            }
          ]
        });

        analyticsClassic.called(
          window.gtagDataLayer.push,
          'event',
          'purchase',
          {
            transaction_id: '24.031608523954162',
            affiliation: 'Whole Foods',
            value: 27.5,
            currency: 'USD',
            tax: 2,
            shipping: 3,
            items: [
              {
                id: 'P12345',
                name: 'Birthday Cake',
                list_name: 'products',
                category: 'Bakery',
                list_position: 1,
                brand: undefined,
                variant: undefined,
                quantity: 1,
                price: 19
              },
              {
                id: 'P67890',
                name: 'Apple',
                list_name: 'products',
                category: 'Fruit',
                list_position: 2,
                brand: undefined,
                variant: undefined,
                quantity: 2,
                price: 3
              }
            ]
          }
        );
      });

      it('should not track order completed if order id is missing', function() {
        analyticsClassic.track('Order Completed', {
          checkout_id: 'fksdjfsdjfisjf9sdfjsd9f',
          total: 27.5
        });
        analyticsClassic.didNotCall(
          window.gtagDataLayer.push,
          'event',
          'purchase'
        );
      });
    });
  });
});

describe('Enhanced Ecommerce', function() {
  var analyticsEnhanced;
  var gtagEnhanced;
  var settings = {
    gaOptions: {
      enhancedEcommerce: true
    },
    gaWebMeasurementId: 'GA-120399404'
  };

  beforeEach(function() {
    analyticsEnhanced = new Analytics();
    gtagEnhanced = new GTAG(settings);
    analyticsEnhanced.use(GTAG);
    analyticsEnhanced.use(tester);
    analyticsEnhanced.add(gtagEnhanced);
  });

  afterEach(function() {
    analyticsEnhanced.restore();
    analyticsEnhanced.reset();
    gtagEnhanced.reset();
    sandbox();
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      gtagEnhanced.options = {
        gaOptions: {
          classic: false,
          enhancedEcommerce: true
        },
        gaWebMeasurementId: 'GA-120399404'
      };
      analyticsEnhanced.once('ready', done);
      analyticsEnhanced.initialize();
    });
    describe('enhanced ecommerce', function() {
      beforeEach(function() {
        analyticsEnhanced.stub(window.gtagDataLayer, 'push');
      });

      it('should track product list viewed', function() {
        analyticsEnhanced.track('Product List Viewed', {
          category: 'cat 1',
          list_id: '1234',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              name: 'Product1',
              price: 101,
              position: 10
            },
            {
              product_id: '507f1f77bcf86cd799439012',
              name: 'Product2',
              price: 50,
              position: 12
            }
          ]
        });

        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'view_item_list',
          {
            items: [
              {
                id: '507f1f77bcf86cd799439011',
                name: 'Product1',
                list_name: '1234',
                category: 'cat 1',
                list_position: 10,
                brand: undefined,
                variant: undefined,
                quantity: 1,
                price: 101
              },
              {
                id: '507f1f77bcf86cd799439012',
                name: 'Product2',
                list_name: '1234',
                category: 'cat 1',
                list_position: 12,
                brand: undefined,
                variant: undefined,
                quantity: 1,
                price: 50
              }
            ]
          }
        );
      });

      it('should track product clicked', function() {
        analyticsEnhanced.track('product clicked', {
          currency: 'CAD',
          quantity: 1,
          price: 24.75,
          name: 'my product',
          category: 'cat 1',
          sku: 'p-298',
          list: 'search results'
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'select_content',
          {
            content_type: 'product',
            items: [
              {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }
            ]
          }
        );
      });

      it('should track product viewed', function() {
        analyticsEnhanced.track('product viewed', {
          currency: 'CAD',
          quantity: 1,
          price: 24.75,
          name: 'my product',
          category: 'cat 1',
          sku: 'p-298',
          list: 'search results'
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'view_item',
          {
            items: [
              {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }
            ]
          }
        );
      });

      it('should track product added', function() {
        analyticsEnhanced.track('product added', {
          currency: 'CAD',
          quantity: 1,
          price: 24.75,
          name: 'my product',
          category: 'cat 1',
          sku: 'p-298',
          list: 'search results'
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'add_to_cart',
          {
            items: [
              {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }
            ]
          }
        );
      });

      it('should track product removed', function() {
        analyticsEnhanced.track('product removed', {
          currency: 'CAD',
          quantity: 1,
          price: 24.75,
          name: 'my product',
          category: 'cat 1',
          sku: 'p-298',
          list: 'search results'
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'remove_from_cart',
          {
            items: [
              {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }
            ]
          }
        );
      });

      it('should track promotion viewed', function() {
        analyticsEnhanced.track('promotion viewed', {
          currency: 'CAD',
          promotion_id: 'PROMO_1234',
          name: 'Summer Sale',
          creative: 'summer_banner2',
          position: 'banner_slot1'
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'view_promotion',
          {
            promotions: [
              {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }
            ]
          }
        );
      });

      it('should track promotion clicked', function() {
        analyticsEnhanced.track('promotion clicked', {
          currency: 'CAD',
          promotion_id: 'PROMO_1234',
          name: 'Summer Sale',
          creative: 'summer_banner2',
          position: 'banner_slot1'
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'select_content',
          {
            promotions: [
              {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }
            ]
          }
        );
      });

      it('should track checkout started', function() {
        analyticsEnhanced.track('checkout started', {
          currency: 'USD',
          products: [
            {
              quantity: 1,
              price: 24.75,
              name: 'my product',
              sku: 'p-298'
            },
            {
              quantity: 3,
              price: 24.75,
              name: 'other product',
              sku: 'p-299'
            }
          ],
          step: 1,
          paymentMethod: 'Visa',
          testDimension: true,
          testMetric: true
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'begin_checkout',
          {
            value: 0,
            currency: 'USD',
            items: [
              {
                id: 'p-298',
                name: 'my product',
                category: undefined,
                list_name: 'products',
                brand: undefined,
                variant: undefined,
                quantity: 1,
                price: 24.75,
                list_position: 1
              },
              {
                id: 'p-299',
                name: 'other product',
                category: undefined,
                list_name: 'products',
                brand: undefined,
                variant: undefined,
                quantity: 3,
                price: 24.75,
                list_position: 2
              }
            ],
            coupon: undefined
          }
        );
      });

      it('should track order updated', function() {
        analyticsEnhanced.track('order updated', {
          currency: 'USD',
          products: [
            {
              quantity: 1,
              price: 24.75,
              name: 'my product',
              sku: 'p-298'
            },
            {
              quantity: 3,
              price: 24.75,
              name: 'other product',
              sku: 'p-299'
            }
          ],
          step: 1,
          paymentMethod: 'Visa',
          testDimension: true,
          testMetric: true
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'begin_checkout',
          {
            value: 0,
            currency: 'USD',
            items: [
              {
                id: 'p-298',
                name: 'my product',
                category: undefined,
                list_name: 'products',
                brand: undefined,
                variant: undefined,
                quantity: 1,
                price: 24.75,
                list_position: 1
              },
              {
                id: 'p-299',
                name: 'other product',
                category: undefined,
                list_name: 'products',
                brand: undefined,
                variant: undefined,
                quantity: 3,
                price: 24.75,
                list_position: 2
              }
            ],
            coupon: undefined
          }
        );
      });

      it('should track checkout step viewed', function() {
        analyticsEnhanced.track('checkout step viewed', {
          currency: 'CAD',
          step: 2
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'checkout_progress',
          {
            currency: 'CAD',
            checkout_step: 2,
            value: 0,
            items: [],
            coupon: undefined,
            checkout_option: null
          }
        );
      });

      it('should track checkout step viewed and set checkout options', function() {
        analyticsEnhanced.track('checkout step viewed', {
          currency: 'CAD',
          step: 2,
          paymentMethod: 'Visa',
          shippingMethod: 'FedEx'
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'checkout_progress',
          {
            currency: 'CAD',
            checkout_step: 2,
            value: 0,
            items: [],
            coupon: undefined,
            checkout_option: 'Visa, FedEx'
          }
        );
      });

      it('should send checkout step completed data', function() {
        analyticsEnhanced.track('checkout step completed', {
          currency: 'CAD',
          step: 2,
          shippingMethod: 'FedEx'
        });
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'checkout_progress',
          {
            currency: 'CAD',
            checkout_step: 2,
            value: 0,
            items: [],
            coupon: undefined,
            checkout_option: 'FedEx'
          }
        );
      });

      it('should track complete order refunded', function() {
        analyticsEnhanced.track('order refunded', {
          orderId: '780bc55'
        });
        analyticsEnhanced.called(window.gtagDataLayer.push, 'event', 'refund', {
          transaction_id: '780bc55'
        });
      });

      it('should track partial order refunded', function() {
        analyticsEnhanced.track('order refunded', {
          orderId: '780bc55',
          products: [
            {
              quantity: 1,
              sku: 'p-298'
            },
            {
              quantity: 2,
              sku: 'p-299'
            }
          ]
        });
        analyticsEnhanced.called(window.gtagDataLayer.push, 'event', 'refund', {
          transaction_id: '780bc55',
          value: 0,
          currency: 'USD',
          tax: undefined,
          shipping: undefined,
          affiliation: undefined,
          items: [
            {
              id: 'p-298',
              name: undefined,
              category: undefined,
              list_name: 'products',
              brand: undefined,
              variant: undefined,
              quantity: 1,
              price: undefined,
              list_position: 1
            },
            {
              id: 'p-299',
              name: undefined,
              category: undefined,
              list_name: 'products',
              brand: undefined,
              variant: undefined,
              quantity: 2,
              price: undefined,
              list_position: 2
            }
          ]
        });
      });

      it('should track order completed', function() {
        analyticsEnhanced.track('order completed', {
          orderId: '5d4c7cb5',
          revenue: 99.9,
          shipping: 13.99,
          tax: 20.99,
          products: []
        });

        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'purchase',
          {
            transaction_id: '5d4c7cb5',
            affiliation: undefined,
            value: 99.9,
            currency: 'USD',
            tax: 20.99,
            shipping: 13.99,
            items: []
          }
        );
      });

      it('should track product added t wishlist', function() {
        analyticsEnhanced.track('Product Added to Wishlist', {
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
        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'add_to_wishlist',
          {
            value: 18.99,
            currency: 'USD',
            items: [
              {
                id: '507f1f77bcf86cd799439011',
                name: 'Monopoly: 3rd Edition',
                category: 'Games',
                quantity: 1,
                price: 18.99,
                brand: 'Hasbro',
                variant: '200 pieces',
                currency: 'USD',
                position: 3,
                coupon: 'MAYDEALS'
              }
            ]
          }
        );
      });

      it('should track lead generated', function() {
        analyticsEnhanced.track('generate_lead', {
          id: '1234',
          price: 2,
          currency: 'USD'
        });

        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'generate_lead',
          {
            transaction_id: '1234',
            value: 2,
            currency: 'USD'
          }
        );
      });

      it('should track login', function() {
        analyticsEnhanced.track('login', {
          method: 'google'
        });

        analyticsEnhanced.called(window.gtagDataLayer.push, 'event', 'login', {
          method: 'google'
        });
      });

      it('should track sign up', function() {
        analyticsEnhanced.track('sign_up', {
          method: 'google'
        });

        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'sign_up',
          {
            method: 'google'
          }
        );
      });

      it('should track exception occured', function() {
        analyticsEnhanced.track('exception', {
          description: 'Some Description',
          fatal: false
        });

        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'exception',
          {
            description: 'Some Description',
            fatal: false
          }
        );
      });

      it('should track timing completed', function() {
        analyticsEnhanced.track('timing_complete', {
          name: 'Name',
          value: 10
        });

        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'timing_complete',
          {
            name: 'Name',
            value: 10
          }
        );
      });

      it('should track checkout options', function() {
        analyticsEnhanced.track('set_checkout_option', {
          value: 10,
          step: 2,
          paymentMethod: 'Visa',
          shippingMethod: 'FedEx'
        });

        analyticsEnhanced.called(
          window.gtagDataLayer.push,
          'event',
          'set_checkout_option',
          {
            value: 10,
            checkout_step: 2,
            checkout_option: 'Visa, FedEx'
          }
        );
      });

      it('should track product shared', function() {
        analyticsEnhanced.track('Product Shared', {
          share_via: 'email',
          share_message: 'Hey, check out this item',
          recipient: 'friend@example.com',
          product_id: '507f1f77bcf86cd799439011',
          sku: 'G-32',
          category: 'Games',
          name: 'Monopoly: 3rd Edition',
          brand: 'Hasbro',
          variant: '200 pieces',
          price: 18.99,
          url: 'https://www.example.com/product/path',
          image_url: 'https://www.example.com/product/path.jpg'
        });

        analyticsEnhanced.called(window.gtagDataLayer.push, 'event', 'share', {
          method: 'email',
          content_type: 'Games',
          content_id: '507f1f77bcf86cd799439011'
        });
      });

      it('should track product searched', function() {
        analyticsEnhanced.track('Products Searched', {
          query: 'blue hotpants'
        });

        analyticsEnhanced.called(window.gtagDataLayer.push, 'event', 'search', {
          search_term: 'blue hotpants'
        });
      });

      it('should not track product searched if query not specified', function() {
        analyticsEnhanced.track('Products Searched', {
          query: ''
        });

        analyticsEnhanced.didNotCall(window.gtagDataLayer.push);
      });
    });
  });
});
