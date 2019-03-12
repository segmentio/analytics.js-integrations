'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var FacebookPixel = require('../lib');

describe('Facebook Pixel', function() {
  var analytics;
  var facebookPixel;
  var options = {
    automaticConfiguration: true,
    legacyEvents: {
      legacyEvent: 'asdFrkj'
    },
    standardEvents: {
      standardEvent: 'standard',
      'booking completed': 'Purchase',
      search: 'Search'
    },
    contentTypes: {
      Cars: 'vehicle'
    },
    pixelId: '123123123',
    agent: 'test',
    initWithExistingTraits: false,
    whitelistPiiProperties: []
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
      it('should define a buffer function', function() {
        analytics.initialize();
        analytics.assert(window._fbq);
      });

      it('should use the callMethod if it exists', function() {
        analytics.initialize();
        analytics.stub(window.fbq, 'callMethod');
        window.fbq('test');
        analytics.called(window.fbq.callMethod, 'test');
        window.fbq.callMethod.reset();
      });

      it('should queue the message if callMethod doesn not exist', function() {
        analytics.initialize();
        window.fbq.callMethod = null;
        window.fbq('test');
        analytics.deepEqual(
          window.fbq.queue[window.fbq.queue.length - 1][0],
          'test'
        );
      });

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
        options.automaticConfiguration = false;
      });

      after(function() {
        options.automaticConfiguration = true;
      });

      it('should call set autoConfig if option disableAutoConfig is enabled', function() {
        analytics.stub(window, 'fbq');
        analytics.initialize();
        analytics.called(
          window.fbq,
          'set',
          'autoConfig',
          false,
          options.pixelId
        );
      });

      before(function() {
        options.initWithExistingTraits = true;
      });

      after(function() {
        options.initWithExistingTraits = false;
      });

      it("should call init with the user's traits if option enabled", function() {
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

      describe('pii filtering', function() {
        it('should not send PII properties', function() {
          analytics.track('event', {
            // PII
            email: 'steph@warriors.com',
            firstName: 'Steph',
            lastName: 'Curry',
            gender: 'male',
            city: 'Oakland',
            country: 'USA',
            phone: '12345534534',
            state: 'CA',
            zip: '12345',
            birthday: 'i dunno?',

            // Non PII
            team: 'Warriors'
          });

          analytics.called(
            window.fbq,
            'trackSingleCustom',
            options.pixelId,
            'event',
            {
              team: 'Warriors'
            },
            { eventID: undefined }
          );
        });

        it('should send whitelisted PII properties', function() {
          facebookPixel.options.whitelistPiiProperties = ['country'];
          analytics.track('event', {
            // PII
            email: 'steph@warriors.com',
            firstName: 'Steph',
            lastName: 'Curry',
            gender: 'male',
            city: 'Oakland',
            country: 'USA',
            phone: '12345534534',
            state: 'CA',
            zip: '12345',
            birthday: 'i dunno?',

            // Non PII
            team: 'Warriors'
          });

          analytics.called(
            window.fbq,
            'trackSingleCustom',
            options.pixelId,
            'event',
            {
              team: 'Warriors',
              country: 'USA'
            },
            { eventID: undefined }
          );
        });

        it('should fallback to an empty array when whitelistPiiProperties is falsy', function() {
          facebookPixel.options.whitelistPiiProperties = null;

          analytics.track('event', {
            // PII
            email: 'steph@warriors.com',
            firstName: 'Steph',
            lastName: 'Curry',
            gender: 'male',
            city: 'Oakland',
            country: 'USA',
            phone: '12345534534',
            state: 'CA',
            zip: '12345',
            birthday: 'i dunno?',

            // Non PII
            team: 'Warriors'
          });

          analytics.called(
            window.fbq,
            'trackSingleCustom',
            options.pixelId,
            'event',
            {
              team: 'Warriors'
            },
            { eventID: undefined }
          );
        });
      });

      describe('event not mapped to legacy or standard', function() {
        it('should send a "custom" event', function() {
          analytics.track('event');
          analytics.called(
            window.fbq,
            'trackSingleCustom',
            options.pixelId,
            'event',
            {},
            { eventID: undefined }
          );
        });

        it('should send a "custom" event and properties', function() {
          analytics.track('event', { property: true });
          analytics.called(
            window.fbq,
            'trackSingleCustom',
            options.pixelId,
            'event',
            {
              property: true
            },
            { eventID: undefined }
          );
        });

        it('should send properties correctly', function() {
          analytics.track('event', {
            currency: 'XXX',
            revenue: 13,
            property: true
          });
          analytics.called(
            window.fbq,
            'trackSingleCustom',
            options.pixelId,
            'event',
            {
              currency: 'XXX',
              value: '13.00',
              property: true
            },
            { eventID: undefined }
          );
        });
      });

      describe('event mapped to legacy', function() {
        it('should send a correctly mapped event', function() {
          analytics.track('legacyEvent');
          analytics.called(
            window.fbq,
            'trackSingle',
            options.pixelId,
            'asdFrkj',
            {
              currency: 'USD',
              value: '0.00'
            },
            { eventID: undefined }
          );
        });

        it('should send an event and properties', function() {
          analytics.track('legacyEvent', { revenue: 10 });
          analytics.called(
            window.fbq,
            'trackSingle',
            options.pixelId,
            'asdFrkj',
            {
              currency: 'USD',
              value: '10.00'
            },
            { eventID: undefined }
          );
        });

        it('should send only currency and revenue', function() {
          analytics.track('legacyEvent', { revenue: 13, property: true });
          analytics.called(
            window.fbq,
            'trackSingle',
            options.pixelId,
            'asdFrkj',
            {
              currency: 'USD',
              value: '13.00'
            },
            { eventID: undefined }
          );
        });
      });

      describe('event mapped to standard', function() {
        it(
          'should send a correctly mapped event — no required properties',
          function() {
            analytics.track('standardEvent');
            analytics.called(
              window.fbq,
              'trackSingle',
              options.pixelId,
              'standard',
              {}
            );
          },
          { eventID: undefined }
        );

        it('should send properties correctly', function() {
          analytics.track('standardEvent', {
            currency: 'XXX',
            revenue: 13,
            property: true
          });
          analytics.called(
            window.fbq,
            'trackSingle',
            options.pixelId,
            'standard',
            {
              currency: 'XXX',
              value: '13.00',
              property: true
            },
            { eventID: undefined }
          );
        });

        it('should default currency to USD if mapped to "Purchase"', function() {
          analytics.track('booking completed', {
            revenue: 13,
            property: true
          });
          analytics.called(
            window.fbq,
            'trackSingle',
            options.pixelId,
            'Purchase',
            {
              currency: 'USD',
              value: '13.00',
              property: true
            },
            { eventID: undefined }
          );
        });
        describe('Dyanmic Ads for Travel date parsing', function() {
          it('should correctly pass in iso8601 formatted date objects', function() {
            analytics.track('search', {
              checkin_date: '2017-07-01T20:03:46Z'
            });

            analytics.called(
              window.fbq,
              'trackSingle',
              options.pixelId,
              'Search',
              {
                checkin_date: '2017-07-01'
              },
              { eventID: undefined }
            );
          });

          it('should pass through strings that we did not recognize as dates as-is', function() {
            analytics.track('search', {
              checkin_date: '2017-06-23T15:30:00GMT'
            });

            analytics.called(
              window.fbq,
              'trackSingle',
              options.pixelId,
              'Search',
              {
                checkin_date: '2017-06-23T15:30:00GMT'
              },
              { eventID: undefined }
            );
          });
        });
      });
    });

    describe('#productListViewed', function() {
      beforeEach(function() {
        analytics.stub(window, 'fbq');
      });
      it('Should map content_ids parameter to product_ids and content_type to "product" if possible', function() {
        analytics.track('Product List Viewed', {
          category: 'Games',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              position: 1,
              category: 'Cars',
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
            },
            {
              product_id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'Uno Card Game',
              price: 3,
              position: 2,
              category: 'Cars'
            }
          ]
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            content_type: ['product']
          },
          { eventID: undefined }
        );
      });

      it('Should fallback on mapping content_ids to the product category and content_type to "product_group"', function() {
        analytics.track('Product List Viewed', { category: 'Games' });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['Games'],
            content_type: ['product_group']
          },
          { eventID: undefined }
        );
      });

      it('should send the custom content type if mapped', function() {
        analytics.track('Product List Viewed', {
          category: 'Cars',
          products: [
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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            content_type: ['vehicle']
          },
          { eventID: undefined }
        );
      });

      it('should send a legacy event', function() {
        facebookPixel.options.legacyEvents = {
          'Product List Viewed': '123456'
        };
        analytics.track('Product List Viewed', { category: 'Games' });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['Games'],
            content_type: ['product_group']
          },
          { eventID: undefined }
        );
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          '123456',
          {
            currency: 'USD',
            value: '0.00'
          },
          { eventID: undefined }
        );
      });

      it('should default to an empty string for category', function() {
        analytics.track('Product List Viewed', { category: null });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: [''],
            content_type: ['product_group']
          },
          { eventID: undefined }
        );
      });
    });

    describe('#productViewed', function() {
      beforeEach(function() {
        analytics.stub(window, 'fbq');
      });
      it('should send a ViewContent event', function() {
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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should send a legacy event', function() {
        facebookPixel.options.legacyEvents = { 'Product Viewed': '123456' };

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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          '123456',
          {
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '44.33'
          },
          { eventID: undefined }
        );
      });

      it('should send the custom content type if mapped', function() {
        analytics.track('Product Viewed', {
          product_id: '507f1f77bcf86cd799439011',
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          category: 'Cars',
          sku: 'p-298',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['vehicle'],
            content_name: 'my product',
            content_category: 'Cars',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should fallback to id for content_id', function() {
        analytics.track('Product Viewed', {
          id: '507f1f77bcf86cd799439011',
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          category: 'Cars',
          sku: 'p-298',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['vehicle'],
            content_name: 'my product',
            content_category: 'Cars',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should fallback to sku for content_id', function() {
        analytics.track('Product Viewed', {
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          category: 'Cars',
          sku: 'p-298',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['p-298'],
            content_type: ['vehicle'],
            content_name: 'my product',
            content_category: 'Cars',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should fallback to an empty string for content_id', function() {
        analytics.track('Product Viewed', {
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          category: 'Cars',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: [''],
            content_type: ['vehicle'],
            content_name: 'my product',
            content_category: 'Cars',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should fallback to an empty string for content_name', function() {
        analytics.track('Product Viewed', {
          id: '507f1f77bcf86cd799439011',
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          category: 'Cars',
          sku: 'p-298',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['vehicle'],
            content_name: '',
            content_category: 'Cars',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should fallback to an empty string for content_category', function() {
        analytics.track('Product Viewed', {
          product_id: '507f1f77bcf86cd799439011',
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          sku: 'p-298',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: '',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should use price in the legacy event', function() {
        facebookPixel.options.valueIdentifier = 'price';
        facebookPixel.options.legacyEvents = { 'Product Viewed': '123456' };

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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '44.33'
          },
          { eventID: undefined }
        );
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          '123456',
          {
            currency: 'USD',
            value: '44.33'
          },
          { eventID: undefined }
        );
      });

      it('should not map products if its falsy', function() {
        analytics.track('Product List Viewed', {
          category: 'Games',
          products: null
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'ViewContent',
          {
            content_ids: ['Games'],
            content_type: ['product_group']
          },
          { eventID: undefined }
        );
      });
    });

    describe('#productAdded', function() {
      beforeEach(function() {
        analytics.stub(window, 'fbq');
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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'AddToCart',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should send a legacy event for product added', function() {
        facebookPixel.options.legacyEvents = { 'Product Added': '123456' };

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

        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'AddToCart',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );

        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          '123456',
          {
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'AddToCart',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '44.33'
          },
          { eventID: undefined }
        );
      });

      it('should send the custom content type if mapped', function() {
        analytics.track('Product Added', {
          product_id: '507f1f77bcf86cd799439011',
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          category: 'Cars',
          sku: 'p-298',
          value: 24.75,
          content_type: 'stuff'
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'AddToCart',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['vehicle'],
            content_name: 'my product',
            content_category: 'Cars',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should fallback to id for content_id', function() {
        analytics.track('Product Added', {
          id: '507f1f77bcf86cd799439011',
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          category: 'cat 1',
          sku: 'p-298',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'AddToCart',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should fallback to sku for content_id', function() {
        analytics.track('Product Added', {
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          category: 'cat 1',
          sku: 'p-298',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'AddToCart',
          {
            content_ids: ['p-298'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should fallback to an empty string for content_id', function() {
        analytics.track('Product Added', {
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          category: 'cat 1',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'AddToCart',
          {
            content_ids: [''],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should fallback to an empty string for content_name', function() {
        analytics.track('Product Added', {
          product_id: '507f1f77bcf86cd799439011',
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          category: 'cat 1',
          sku: 'p-298',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'AddToCart',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: '',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should fallback to an empty string for content_category', function() {
        analytics.track('Product Added', {
          product_id: '507f1f77bcf86cd799439011',
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          sku: 'p-298',
          value: 24.75
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'AddToCart',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: '',
            currency: 'USD',
            value: '24.75'
          },
          { eventID: undefined }
        );
      });

      it('should use price in the legacy event', function() {
        facebookPixel.options.valueIdentifier = 'price';
        facebookPixel.options.legacyEvents = { 'Product Added': '123456' };

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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'AddToCart',
          {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: ['product'],
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '44.33'
          },
          { eventID: undefined }
        );
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          '123456',
          {
            currency: 'USD',
            value: '44.33'
          },
          { eventID: undefined }
        );
      });
    });

    describe('#orderCompleted', function() {
      beforeEach(function() {
        analytics.stub(window, 'fbq');
      });

      it('should send a Purchase event', function() {
        analytics.track('Order Completed', {
          products: [
            { product_id: '507f1f77bcf86cd799439011' },
            { product_id: '505bd76785ebb509fc183733' }
          ],
          currency: 'USD',
          total: 0.5
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'Purchase',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            content_type: ['product'],
            currency: 'USD',
            value: '0.50'
          },
          { eventID: undefined }
        );
      });

      it('Should send both pixel and standard event if mapped', function() {
        facebookPixel.options.legacyEvents = { 'Completed Order': '123456' };
        analytics.track('Completed Order', {
          products: [
            { product_id: '507f1f77bcf86cd799439011' },
            { product_id: '505bd76785ebb509fc183733' }
          ],
          currency: 'USD',
          total: 0.5
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'Purchase',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            content_type: ['product'],
            currency: 'USD',
            value: '0.50'
          },
          { eventID: undefined }
        );
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          '123456',
          {
            currency: 'USD',
            value: '0.50'
          },
          { eventID: undefined }
        );
      });

      it('should default to id for content_id', function() {
        analytics.track('Order Completed', {
          products: [
            { product_id: '507f1f77bcf86cd799439011' },
            { id: '505bd76785ebb509fc183733' }
          ],
          currency: 'USD',
          total: 0.5
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'Purchase',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            content_type: ['product'],
            currency: 'USD',
            value: '0.50'
          },
          { eventID: undefined }
        );
      });

      it('should default to sku for content_id', function() {
        analytics.track('Order Completed', {
          products: [
            { product_id: '507f1f77bcf86cd799439011' },
            { sku: '505bd76785ebb509fc183733' }
          ],
          currency: 'USD',
          total: 0.5
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'Purchase',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            content_type: ['product'],
            currency: 'USD',
            value: '0.50'
          },
          { eventID: undefined }
        );
      });

      it('should send the custom content type if mapped', function() {
        analytics.track('Order Completed', {
          products: [
            { product_id: '507f1f77bcf86cd799439011', category: 'Cars' },
            { product_id: '505bd76785ebb509fc183733', category: 'Cars' }
          ],
          currency: 'USD',
          total: 0.5
        });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'Purchase',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            content_type: ['vehicle'],
            currency: 'USD',
            value: '0.50'
          },
          { eventID: undefined }
        );
      });
    });

    describe('#productsSearched', function() {
      beforeEach(function() {
        analytics.stub(window, 'fbq');
      });

      it('should send pixel the search string', function() {
        analytics.track('Products Searched', { query: 'yo' });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'Search',
          {
            search_string: 'yo'
          },
          { eventID: undefined }
        );
      });

      it('should send standard and legacy events', function() {
        facebookPixel.options.legacyEvents = {
          'Products Searched': '123456'
        };

        analytics.track('Products Searched', { query: 'yo' });
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'Search',
          {
            search_string: 'yo'
          },
          { eventID: undefined }
        );
        analytics.called(window.fbq, 'trackSingle', options.pixelId, '123456');
      });
    });

    describe('#checkoutStarted', function() {
      beforeEach(function() {
        analytics.stub(window, 'fbq');
      });

      it('should call InitiateCheckout with the top-level category', function() {
        analytics.track('Checkout Started', {
          category: 'NotGames',
          order_id: '50314b8e9bcf000000000000',
          affiliation: 'Google Store',
          value: 30,
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
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'InitiateCheckout',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            value: '25.00',
            contents: [
              { id: '507f1f77bcf86cd799439011', quantity: 1, item_price: 19 },
              { id: '505bd76785ebb509fc183733', quantity: 2, item_price: 3 }
            ],
            num_items: 2,
            currency: 'USD',
            content_category: 'NotGames'
          },
          { eventID: undefined }
        );
      });

      it('should call InitiateCheckout with the first product category', function() {
        analytics.track('Checkout Started', {
          order_id: '50314b8e9bcf000000000000',
          affiliation: 'Google Store',
          value: 30,
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
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'InitiateCheckout',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            value: '25.00',
            contents: [
              { id: '507f1f77bcf86cd799439011', quantity: 1, item_price: 19 },
              { id: '505bd76785ebb509fc183733', quantity: 2, item_price: 3 }
            ],
            num_items: 2,
            currency: 'USD',
            content_category: 'Games'
          },
          { eventID: undefined }
        );
      });

      it('should send a standard and legacy events', function() {
        facebookPixel.options.legacyEvents = {
          'Checkout Started': '123456'
        };
        analytics.track('Checkout Started', {
          order_id: '50314b8e9bcf000000000000',
          affiliation: 'Google Store',
          value: 30,
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
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'InitiateCheckout',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            value: '25.00',
            contents: [
              { id: '507f1f77bcf86cd799439011', quantity: 1, item_price: 19 },
              { id: '505bd76785ebb509fc183733', quantity: 2, item_price: 3 }
            ],
            num_items: 2,
            currency: 'USD',
            content_category: 'Games'
          },
          { eventID: undefined }
        );
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          '123456',
          {
            currency: 'USD',
            value: '25.00'
          },
          { eventID: undefined }
        );
      });

      it('should default to id for content_ids', function() {
        analytics.track('Checkout Started', {
          order_id: '50314b8e9bcf000000000000',
          affiliation: 'Google Store',
          value: 30,
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
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'InitiateCheckout',
          {
            content_ids: [
              '507f1f77bcf86cd799439011',
              '505bd76785ebb509fc183733'
            ],
            value: '25.00',
            contents: [
              { id: '507f1f77bcf86cd799439011', quantity: 1, item_price: 19 },
              { id: '505bd76785ebb509fc183733', quantity: 2, item_price: 3 }
            ],
            num_items: 2,
            currency: 'USD',
            content_category: 'Games'
          },
          { eventID: undefined }
        );
      });

      it('should default to sku for content_ids', function() {
        analytics.track('Checkout Started', {
          order_id: '50314b8e9bcf000000000000',
          affiliation: 'Google Store',
          value: 30,
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
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
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
        analytics.called(
          window.fbq,
          'trackSingle',
          options.pixelId,
          'InitiateCheckout',
          {
            content_ids: ['45790-32', '505bd76785ebb509fc183733'],
            value: '25.00',
            contents: [
              { id: '45790-32', quantity: 1, item_price: 19 },
              { id: '505bd76785ebb509fc183733', quantity: 2, item_price: 3 }
            ],
            num_items: 2,
            currency: 'USD',
            content_category: 'Games'
          },
          { eventID: undefined }
        );
      });
    });
  });

  describe('#formatTraits', function() {
    it('should return an empty object if traits is falsy', function() {
      var expected = {};

      analytics.reset();
      var actual = facebookPixel.formatTraits(analytics);

      analytics.deepEqual(expected, actual);
    });

    it('should user firstName and lastName', function() {
      analytics.identify('123', {
        firstName: 'Pika',
        lastName: 'chu'
      });
      var expected = {
        fn: 'Pika',
        ln: 'chu',
        ge: 'm',
        db: '19910113',
        ct: 'emerald',
        st: 'kanto',
        zp: 123456
      };
      var actual = facebookPixel.formatTraits(analytics);

      analytics.deepEqual(expected, actual);
    });

    it('should split name if firstName is falsy', function() {
      analytics.identify('123', {
        firstName: null,
        name: 'Pika chu'
      });
      var expected = {
        fn: 'pika',
        ln: 'chu',
        ge: 'm',
        db: '19910113',
        ct: 'emerald',
        st: 'kanto',
        zp: 123456
      };
      var actual = facebookPixel.formatTraits(analytics);

      analytics.deepEqual(expected, actual);
    });

    it('should use an empty array if name is falsy', function() {
      analytics.identify('123', {
        firstName: null,
        name: null
      });
      var expected = {
        ge: 'm',
        db: '19910113',
        ct: 'emerald',
        st: 'kanto',
        zp: 123456
      };
      var actual = facebookPixel.formatTraits(analytics);

      analytics.deepEqual(expected, actual);
    });

    it('should default to an empty object if address is falsy', function() {
      analytics.identify('123', {
        address: null
      });
      var expected = {
        fn: 'ash',
        ln: 'ketchum',
        ge: 'm',
        db: '19910113'
      };
      var actual = facebookPixel.formatTraits(analytics);

      analytics.deepEqual(expected, actual);
    });
  });
});
