'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var FacebookPixel = require('../lib');

describe('Facebook Pixel', function() {
  var analytics;
  var facebookPixel;
  var options = {
    legacyEvents: {
      legacyEvent: 'asdFrkj'
    },
    standardEvents: {
      standardEvent: 'standard',
      'booking completed': 'Purchase',
      search: 'Search'
    },
    pixelId: '123123123',
    agent: 'test',
    initWithExistingTraits: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    facebookPixel = new FacebookPixel(options);
    analytics.use(FacebookPixel);
    analytics.use(tester);
    analytics.add(facebookPixel);
    analytics.identify('123', {
      name: 'Ash Ketchum',
      gender: 'Male',
      birthday: '01/13/1991',
      address: {
        city: 'Emerald',
        state: 'Kanto',
        postalCode: 123456
      }
    });
  });

  afterEach(function(done) {
    analytics.waitForScripts(function() {
      analytics.restore();
      analytics.reset();
      facebookPixel.reset();
      sandbox();
      done();
    });
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(facebookPixel, 'load');
    });

    afterEach(function() {
      facebookPixel.reset();
    });

    describe('#initialize', function() {
      it('should call load on initialize', function() {
        analytics.initialize();
        analytics.called(facebookPixel.load);
      });

      it('should set the correct agent and version', function() {
        analytics.initialize();
        analytics.equal(window.fbq.agent, 'test');
        analytics.equal(window.fbq.version, '2.0');
      });

      it('should set disablePushState to true', function() {
        analytics.initialize();
        analytics.equal(window.fbq.disablePushState, true);
      });

      it('should set allowDuplicatePageViews to true', function() {
        analytics.initialize();
        analytics.equal(window.fbq.allowDuplicatePageViews, true);
      });

      it('should create fbq object', function() {
        analytics.initialize();
        analytics.assert(window.fbq instanceof Function);
      });

      before(function() {
        options.initWithExistingTraits = true;
      });

      after(function() {
        options.initWithExistingTraits = false;
      });

      it('should call init with the user\'s traits if option enabled', function() {
        var payload = {
          ct: 'emerald',
          db: '19910113',
          fn: 'ash',
          ge: 'm',
          ln: 'ketchum',
          st: 'kanto',
          zp: 123456
        };
        analytics.stub(window, 'fbq');
        analytics.initialize();
        analytics.called(window.fbq, 'init', options.pixelId, payload);
      });
    });
  });

  describe('loading', function() {
    beforeEach(function() {
      analytics.stub(window, 'fbq');
      analytics.initialize();
    });

    it('should load', function(done) {
      analytics.load(facebookPixel, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'fbq');
      });

      it('should track a pageview', function() {
        analytics.page();
        analytics.called(window.fbq, 'track', 'PageView');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'fbq');
      });

      describe('event not mapped to legacy or standard', function() {
        it('should send a "custom" event', function() {
          analytics.track('event');
          analytics.called(window.fbq, 'trackCustom', 'event');
        });

        it('should send a "custom" event and properties', function() {
          analytics.track('event', { property: true });
          analytics.called(window.fbq, 'trackCustom', 'event', { property: true });
        });

        it('should send properties correctly', function() {
          analytics.track('event', {
            currency: 'XXX',
            revenue: 13,
            property: true
          });
          analytics.called(window.fbq, 'trackCustom', 'event', {
            currency: 'XXX',
            value: '13.00',
            property: true
          });
        });
      });

      describe('event mapped to legacy', function() {
        it('should send a correctly mapped event', function() {
          analytics.track('legacyEvent');
          analytics.called(window.fbq, 'track', 'asdFrkj', {
            currency: 'USD',
            value: '0.00'
          });
        });

        it('should send an event and properties', function() {
          analytics.track('legacyEvent', { revenue: 10 });
          analytics.called(window.fbq, 'track', 'asdFrkj', {
            currency: 'USD',
            value: '10.00'
          });
        });

        it('should send only currency and revenue', function() {
          analytics.track('legacyEvent', { revenue: 13, property: true });
          analytics.called(window.fbq, 'track', 'asdFrkj', {
            currency: 'USD',
            value: '13.00'
          });
        });
      });

      describe('event mapped to standard', function() {
        it('should send a correctly mapped event — no required properties', function() {
          analytics.track('standardEvent');
          analytics.called(window.fbq, 'track', 'standard', {});
        });

        it('should send properties correctly', function() {
          analytics.track('standardEvent', {
            currency: 'XXX',
            revenue: 13,
            property: true
          });
          analytics.called(window.fbq, 'track', 'standard', {
            currency: 'XXX',
            value: '13.00',
            property: true
          });
        });

        it('should default currency to USD if mapped to "Purchase"', function() {
          analytics.track('booking completed', {
            revenue: 13,
            property: true
          });
          analytics.called(window.fbq, 'track', 'Purchase', {
            currency: 'USD',
            value: '13.00',
            property: true
          });
        });

        describe('Dyanmic Ads for Travel date parsing', function() {
          it('should correctly pass in iso8601 formatted date objects', function() {
            analytics.track('search', {
              checkin_date: '2017-07-01T20:03:46Z'
            });

            analytics.called(window.fbq, 'track', 'Search', {
              checkin_date: '2017-07-01'
            });
          });

          it('should pass through strings that we did not recognize as dates as-is', function() {
            analytics.track('search', {
              checkin_date: '2017-06-23T15:30:00GMT'
            });

            analytics.called(window.fbq, 'track', 'Search', {
              checkin_date: '2017-06-23T15:30:00GMT'
            });
          });
        });
      });

      describe('segment ecommerce => FB product audiences', function() {
        describe('Product List Viewed', function() {
          it('Should map content_ids parameter to product_ids and content_type to "product" if possible', function() {
            analytics.track('Product List Viewed', {
              category: 'Games', products: [
                {
                  product_id: '507f1f77bcf86cd799439011',
                  sku: '45790-32',
                  name: 'Monopoly: 3rd Edition',
                  price: 19,
                  position: 1,
                  category: 'Games',
                  url: 'https://www.example.com/product/path',
                  image_url: 'https://www.example.com/product/path.jpg'
                },
                {
                  product_id: '505bd76785ebb509fc183733',
                  sku: '46493-32',
                  name: 'Uno Card Game',
                  price: 3,
                  position: 2,
                  category: 'Games'
                }
              ]
            });
            analytics.called(window.fbq, 'track', 'ViewContent', {
              content_ids: ['507f1f77bcf86cd799439011', '505bd76785ebb509fc183733'],
              content_type: 'product'
            });
          });

          it('Should fallback on mapping content_ids to the product category and content_type to "product_group"', function() {
            analytics.track('Product List Viewed', { category: 'Games' });
            analytics.called(window.fbq, 'track', 'ViewContent', {
              content_ids: ['Games'],
              content_type: 'product_group'
            });
          });
        });

        it('Product Viewed', function() {
          analytics.track('Product Viewed', {
            product_id: '507f1f77bcf86cd799439011',
            currency: 'USD',
            quantity: 1,
            price: 44.33,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298',
            value: 24.75
          });
          analytics.called(window.fbq, 'track', 'ViewContent', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          });
        });

        it('Should map properties.price to facebooks value if price is selected', function() {
          facebookPixel.options.valueIdentifier = 'price';
          analytics.track('Product Viewed', {
            product_id: '507f1f77bcf86cd799439011',
            currency: 'USD',
            quantity: 1,
            price: 44.33,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298',
            value: 24.75
          });
          analytics.called(window.fbq, 'track', 'ViewContent', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '44.33'
          });
        });

        it('Adding to Cart', function() {
          analytics.track('Product Added', {
            product_id: '507f1f77bcf86cd799439011',
            currency: 'USD',
            quantity: 1,
            price: 44.33,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298',
            value: 24.75
          });
          analytics.called(window.fbq, 'track', 'AddToCart', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          });
        });

        it('Should map properties.price to facebooks value if price is selected', function() {
          facebookPixel.options.valueIdentifier = 'price';
          analytics.track('Product Added', {
            product_id: '507f1f77bcf86cd799439011',
            currency: 'USD',
            quantity: 1,
            price: 44.33,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298',
            value: 24.75
          });
          analytics.called(window.fbq, 'track', 'AddToCart', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '44.33'
          });
        });

        it('Completing an Order', function() {
          analytics.track('Order Completed', {
            products: [
              { product_id: '507f1f77bcf86cd799439011' },
              { product_id: '505bd76785ebb509fc183733' }
            ],
            currency: 'USD',
            total: 0.50
          });
          analytics.called(window.fbq, 'track', 'Purchase', {
            content_ids: ['507f1f77bcf86cd799439011', '505bd76785ebb509fc183733'],
            content_type: 'product',
            currency: 'USD',
            value: '0.50'
          });
        });

        it('Should send both pixel and standard event if mapped', function() {
          facebookPixel.options.legacyEvents = { 'Completed Order': '123456' };
          analytics.track('Completed Order', {
            products: [
              { product_id: '507f1f77bcf86cd799439011' },
              { product_id: '505bd76785ebb509fc183733' }
            ],
            currency: 'USD',
            total: 0.50
          });
          analytics.called(window.fbq, 'track', 'Purchase', {
            content_ids: ['507f1f77bcf86cd799439011', '505bd76785ebb509fc183733'],
            content_type: 'product',
            currency: 'USD',
            value: '0.50'
          });
          analytics.called(window.fbq, 'track', '123456', {
            currency: 'USD',
            value: '0.50'
          });
        });
      });
    });
  });
});
