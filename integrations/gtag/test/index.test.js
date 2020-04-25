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
    trackCategorizedPages: true,
    includeSearch: false,
    anonymizeIp: false
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
        .option('awConversionId', '')
        .option('dcFloodLightId', '')
        .option('trackNamedPages', true)
        .option('trackCategorizedPages', true)
        .option('includeQueryString', false)
        .option('gaWebMeasurementId', '')
        .option('gaWebAppMeasurementId', '')
        .option('gaCustomDimensions', {})
        .option('gaCustomMetrics', {})
        .option('gaContentGroupings', {})
        .option('gaEnhancedEcommerce', false)
        .option('gaAnonymizeIp', false)
        .option('gaCookieDomain', 'auto')
        .option('gaEnhancedLinkAttribution', false)
        .option('gaOptimizeContainerId', '')
        .option('gaSampleRate', 100)
        .option('gaSendUserId', false)
        .option('gaUseAmpClientId', false)
        .option('gaSiteSpeedSampleRate', 1)
        .option('gaSetAllMappedProps', false)
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
        awConversionId: 'AW_CONVERSION_ID',
        gaAnonymizeIp: true,
        gaCookieDomain: 'auto',
        gaEnhancedLinkAttribution: true,
        gaOptimizeContainerId: 'GTM-XXXXX',
        gaSampleRate: 500,
        gaSiteSpeedSampleRate: 1,
        gaUseAmpClientId: true,
        gaCustomDimensions: {
          company: 'dimension1'
        },
        gaCustomMetrics: {
          age: 'metric1'
        }
      };
      analytics.once('ready', done);
      analytics.initialize();
    });

    it('should set default routing', function() {
      analytics.assert(window.gtagDataLayer[0], [
        'config',
        'GA_WEB_MEASUREMENT_ID',
        {
          anonymize_ip: true,
          cookie_domain: 'auto',
          link_attribution: true,
          optimize_id: 'GTM-XXXXX',
          sample_rate: 500,
          site_speed_sample_rate: 1,
          use_amp_client_id: true,
          custom_map: {
            dimension1: 'company',
            metric1: 'age'
          }
        }
      ]);

      analytics.assert(window.gtagDataLayer[1], ['config', 'AW_CONVERSION_ID']);
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'gtag');
      });

      it('should call track', function() {
        analytics.track();
        analytics.called(window.gtag);
      });

      it('should call track with passed event', function() {
        analytics.track('test event');
        analytics.called(window.gtag, 'event', 'test event', {
          event: 'test event',
          non_interaction: false
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window, 'gtag');
      });

      it('should set user id if GA is configured', function() {
        gtag.options.gaWebMeasurementId = 'GA_WEB_MEASUREMENT_ID';
        gtag.options.gaSendUserId = true;
        analytics.identify('userId');
        analytics.called(window.gtag, 'config', 'GA_WEB_MEASUREMENT_ID', {
          user_id: 'userId'
        });
      });

      it('should not set user id if sendUserId is false', function() {
        gtag.options.gaWebMeasurementId = 'GA_WEB_MEASUREMENT_ID';
        gtag.options.sendUserId = false;
        analytics.identify('userId');
        analytics.didNotCall(window.gtag, 'config', 'GA_WEB_MEASUREMENT_ID', {
          user_id: 'userId'
        });
      });

      it('should not set user id if GA is not configured', function() {
        gtag.options.gaWebMeasurementId = '';
        analytics.identify('userId');
        analytics.didNotCall(window.gtag);
      });

      it('should not set user id if GA is configured but empty user id', function() {
        gtag.options.gaWebMeasurementId = 'GA_WEB_MEASUREMENT_ID';
        analytics.identify('');
        analytics.didNotCall(window.gtag);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'gtag');
      });

      it('should track page', function() {
        analytics.page();
        analytics.called(window.gtag);
      });

      it('should track named page', function() {
        analytics.page('Pagename');
        analytics.called(window.gtag, 'event', 'page_view', {
          page_title: 'Pagename',
          page_location: window.location.href,
          page_path: window.location.pathname,
          non_interaction: false
        });
      });

      it('should not track named page if option turned off ', function() {
        gtag.options.trackNamedPages = false;
        analytics.page('Pagename');
        analytics.called(window.gtag, 'event', 'page_view', {
          page_title: 'Pagename',
          page_location: window.location.href,
          page_path: window.location.pathname,
          non_interaction: false
        });
        analytics.assert(window.gtag.once);
      });

      it('should track named page if option turned on', function() {
        gtag.options.trackNamedPages = true;
        analytics.page('Pagename');

        analytics.called(window.gtag, 'event', 'page_view', {
          page_title: 'Pagename',
          page_location: window.location.href,
          page_path: window.location.pathname,
          non_interaction: false
        });
        analytics.called(window.gtag, 'event', 'Viewed Pagename Page', {
          name: 'Pagename',
          path: '/context.html',
          referrer: window.document.referrer,
          search: '',
          title: '',
          url: window.location.href,
          event: 'Viewed Pagename Page',
          non_interaction: true
        });
      });

      it('should track page when and nonInteraction passed', function() {
        gtag.options.nonInteraction = true;
        analytics.page('Pagename');
        analytics.called(window.gtag, 'event', 'page_view', {
          page_title: 'Pagename',
          page_location: window.location.href,
          page_path: window.location.pathname,
          non_interaction: true
        });
      });

      it('should not track page if trackCategorizedPages set to true', function() {
        gtag.options.trackNamedPages = false;
        gtag.options.trackCategorizedPages = true;

        analytics.page('Category', 'name');

        analytics.called(window.gtag, 'event', 'page_view', {
          page_title: 'Category name',
          page_location: window.location.href,
          page_path: window.location.pathname,
          non_interaction: false
        });
        analytics.called(window.gtag, 'event', 'Viewed Category Page', {
          name: 'name',
          category: 'Category',
          path: '/context.html',
          referrer: window.document.referrer,
          search: '',
          title: '',
          url: window.location.href,
          event: 'Viewed Category Page',
          non_interaction: true
        });
      });

      it('should set custom dimensions if setAllMappedProps set to true', function() {
        gtag.options.gaWebMeasurementId = 'GA_WEB_MEASUREMENT_ID';
        gtag.options.trackNamedPages = true;
        gtag.options.gaSetAllMappedProps = true;
        gtag.options.gaCustomDimensions = {
          company: 'dimension2'
        };
        gtag.options.gaCustomMetrics = {
          age: 'metric1'
        };
        gtag.options.gaContentGroupings = {
          section: 'content_group1',
          score: 'content_group5'
        };
        analytics.page('Page1', {
          loadTime: '100',
          levelAchieved: '5',
          company: 'Google',
          score: 101
        });
        analytics.called(window.gtag, 'config', 'GA_WEB_MEASUREMENT_ID', {
          custom_map: {
            dimension2: 'Google'
          }
        });
        analytics.called(window.gtag, 'config', 'GA_WEB_MEASUREMENT_ID', {
          content_group5: 101
        });
      });

      it('should not set custom dimensions if setAllMappedProps set to false', function() {
        gtag.options.gaWebMeasurementId = 'GA_WEB_MEASUREMENT_ID';
        gtag.options.trackNamedPages = true;
        gtag.options.gaSetAllMappedProps = false;
        gtag.options.gaCustomDimensions = {
          company: 'dimension2'
        };
        gtag.options.gaCustomMetrics = {
          age: 'metric1'
        };
        analytics.page('Page1', {
          loadTime: '100',
          levelAchieved: '5',
          company: 'Google'
        });
        analytics.didNotCall(window.gtag, 'config', 'GA_WEB_MEASUREMENT_ID', {
          custom_map: GTAG.merge(
            gtag.options.gaCustomDimensions,
            gtag.options.gaCustomMetrics
          )
        });
        analytics.called(window.gtag, 'event', 'page_view');
      });

      it('should send the query if its included', function() {
        gtag.options.includeQueryString = true;
        analytics.page('category', 'name', {
          url: 'url',
          path: '/path',
          search: '?q=1'
        });
        analytics.called(window.gtag, 'event', 'page_view', {
          page_title: 'category name',
          page_location: 'url',
          page_path: '/path?q=1',
          non_interaction: false
        });
      });

      it('should set campaign data', function() {
        analytics.page(
          'Pagename',
          {},
          {
            campaign: {
              source: 'Some source',
              medium: 'Some medium'
            }
          }
        );

        analytics.called(
          window.gtag,
          'config',
          gtag.options.gaWebMeasurementId,
          {
            campaign: {
              source: 'Some source',
              medium: 'Some medium'
            }
          }
        );
      });
    });
  });
});

describe('Enhanced Ecommerce', function() {
  var analyticsEnhanced;
  var gtagEnhanced;
  var settings = {
    gaEnhancedEcommerce: true,
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
        gaEnhancedEcommerce: true,
        gaWebMeasurementId: 'GA-120399404'
      };
      analyticsEnhanced.once('ready', done);
      analyticsEnhanced.initialize();
    });
    describe('enhanced ecommerce', function() {
      beforeEach(function() {
        analyticsEnhanced.stub(window, 'gtag');
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

        analyticsEnhanced.called(window.gtag, 'event', 'view_item_list', {
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
          ],
          non_interaction: true
        });
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
        analyticsEnhanced.called(window.gtag, 'event', 'select_content', {
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
          ],
          non_interaction: true
        });
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
        analyticsEnhanced.called(window.gtag, 'event', 'view_item', {
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
          ],
          non_interaction: true
        });
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
        analyticsEnhanced.called(window.gtag, 'event', 'add_to_cart', {
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
          ],
          non_interaction: true
        });
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
        analyticsEnhanced.called(window.gtag, 'event', 'remove_from_cart', {
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
          ],
          non_interaction: true
        });
      });

      it('should track promotion viewed', function() {
        analyticsEnhanced.track('promotion viewed', {
          currency: 'CAD',
          promotion_id: 'PROMO_1234',
          name: 'Summer Sale',
          creative: 'summer_banner2',
          position: 'banner_slot1'
        });
        analyticsEnhanced.called(window.gtag, 'event', 'view_promotion', {
          promotions: [
            {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              creative: 'summer_banner2',
              position: 'banner_slot1'
            }
          ],
          non_interaction: true
        });
      });

      it('should track promotion clicked', function() {
        analyticsEnhanced.track('promotion clicked', {
          currency: 'CAD',
          promotion_id: 'PROMO_1234',
          name: 'Summer Sale',
          creative: 'summer_banner2',
          position: 'banner_slot1'
        });
        analyticsEnhanced.called(window.gtag, 'event', 'select_content', {
          promotions: [
            {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              creative: 'summer_banner2',
              position: 'banner_slot1'
            }
          ],
          non_interaction: true
        });
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
        analyticsEnhanced.called(window.gtag, 'event', 'begin_checkout', {
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
          coupon: undefined,
          non_interaction: true
        });
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
        analyticsEnhanced.called(window.gtag, 'event', 'begin_checkout', {
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
          coupon: undefined,
          non_interaction: true
        });
      });

      it('should track checkout step viewed', function() {
        analyticsEnhanced.track('checkout step viewed', {
          currency: 'CAD',
          step: 2
        });
        analyticsEnhanced.called(window.gtag, 'event', 'checkout_progress', {
          currency: 'CAD',
          checkout_step: 2,
          value: 0,
          items: [],
          coupon: undefined,
          checkout_option: null,
          non_interaction: true
        });
      });

      it('should track checkout step viewed and set checkout options', function() {
        analyticsEnhanced.track('checkout step viewed', {
          currency: 'CAD',
          step: 2,
          paymentMethod: 'Visa',
          shippingMethod: 'FedEx'
        });
        analyticsEnhanced.called(window.gtag, 'event', 'checkout_progress', {
          currency: 'CAD',
          checkout_step: 2,
          value: 0,
          items: [],
          coupon: undefined,
          checkout_option: 'Visa, FedEx',
          non_interaction: true
        });
      });

      it('should send checkout step completed data', function() {
        analyticsEnhanced.track('checkout step completed', {
          currency: 'CAD',
          step: 2,
          shippingMethod: 'FedEx'
        });
        analyticsEnhanced.called(window.gtag, 'event', 'checkout_progress', {
          currency: 'CAD',
          checkout_step: 2,
          value: 0,
          items: [],
          coupon: undefined,
          checkout_option: 'FedEx',
          non_interaction: true
        });
      });

      it('should track complete order refunded', function() {
        analyticsEnhanced.track('order refunded', {
          orderId: '780bc55'
        });
        analyticsEnhanced.called(window.gtag, 'event', 'refund', {
          transaction_id: '780bc55',
          non_interaction: true
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
        analyticsEnhanced.called(window.gtag, 'event', 'refund', {
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
          ],
          non_interaction: true
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

        analyticsEnhanced.called(window.gtag, 'event', 'purchase', {
          transaction_id: '5d4c7cb5',
          affiliation: undefined,
          value: 99.9,
          currency: 'USD',
          tax: 20.99,
          shipping: 13.99,
          items: [],
          non_interaction: true
        });
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
        analyticsEnhanced.called(window.gtag, 'event', 'add_to_wishlist', {
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
          ],
          non_interaction: true
        });
      });

      it('should track lead generated', function() {
        analyticsEnhanced.track('generate_lead', {
          id: '1234',
          price: 2,
          currency: 'USD'
        });

        analyticsEnhanced.called(window.gtag, 'event', 'generate_lead', {
          transaction_id: '1234',
          value: 2,
          currency: 'USD',
          non_interaction: true
        });
      });

      it('should track login', function() {
        analyticsEnhanced.track('login', {
          method: 'google'
        });

        analyticsEnhanced.called(window.gtag, 'event', 'login', {
          method: 'google',
          non_interaction: true
        });
      });

      it('should track sign up', function() {
        analyticsEnhanced.track('sign_up', {
          method: 'google',
          non_interaction: true
        });

        analyticsEnhanced.called(window.gtag, 'event', 'sign_up', {
          method: 'google',
          non_interaction: true
        });
      });

      it('should track exception occured', function() {
        analyticsEnhanced.track('exception', {
          description: 'Some Description',
          fatal: false
        });

        analyticsEnhanced.called(window.gtag, 'event', 'exception', {
          description: 'Some Description',
          fatal: false,
          non_interaction: true
        });
      });

      it('should track timing completed', function() {
        analyticsEnhanced.track('timing_complete', {
          name: 'Name',
          value: 10
        });

        analyticsEnhanced.called(window.gtag, 'event', 'timing_complete', {
          name: 'Name',
          value: 10,
          non_interaction: true
        });
      });

      it('should track checkout options', function() {
        analyticsEnhanced.track('set_checkout_option', {
          value: 10,
          step: 2,
          paymentMethod: 'Visa',
          shippingMethod: 'FedEx'
        });

        analyticsEnhanced.called(window.gtag, 'event', 'set_checkout_option', {
          value: 10,
          checkout_step: 2,
          checkout_option: 'Visa, FedEx',
          non_interaction: true
        });
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

        analyticsEnhanced.called(window.gtag, 'event', 'share', {
          method: 'email',
          content_type: 'Games',
          content_id: '507f1f77bcf86cd799439011',
          non_interaction: true
        });
      });

      it('should track product searched', function() {
        analyticsEnhanced.track('Products Searched', {
          query: 'blue hotpants'
        });

        analyticsEnhanced.called(window.gtag, 'event', 'search', {
          search_term: 'blue hotpants',
          non_interaction: true
        });
      });

      it('should not track product searched if query not specified', function() {
        analyticsEnhanced.track('Products Searched', {
          query: ''
        });

        analyticsEnhanced.didNotCall(window.gtag);
      });
    });
  });
});
