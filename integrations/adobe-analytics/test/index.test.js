'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var AdobeAnalytics = require('../lib/');
var iso = require('@segment/to-iso-string');

describe('Adobe Analytics', function() {
  var analytics;
  var adobeAnalytics;
  var user;
  var options = {
    version: 2,
    reportSuiteId: 'sgmtest',
    trackingServerUrl: 'exchangepartnersegment.sc.omtrdc.net',
    trackingServerSecureUrl: '',
    heartbeatTrackingServerUrl: 'https://exchangepartnersegment.hb.omtrdc.net',
    marketingCloudOrgId: '1234567ABC@AdobeOrg',
    events: [
      { segmentEvent: 'Played a Song', adobeEvents: ['event1'] },
      { segmentEvent: 'Drank Some Milk', adobeEvents: ['event6'] },
      { segmentEvent: 'Overlord exploded', adobeEvents: ['event7'] }
    ],
    eVars: {
      Car: 'eVar1',
      Dog: 'eVar47',
      'Overlord exploded': 'eVar65',
      'Car.Info': 'eVar101',
      'My.Dog': 'eVar401'
    },
    props: {
      Airplane: 'prop20',
      Dog: 'prop40',
      Good: 'prop10',
      Type: 'prop13',
      Brand: 'prop23'
    },
    hVars: {
      hier_group1: 'hier1',
      hier_group2: 'hier2'
    },
    lVars: {
      names: 'list1'
    },
    contextValues: {},
    customDataPrefix: '',
    timestampOption: 'enabled',
    enableTrackPageName: true,
    disableVisitorId: false,
    preferVisitorId: false,
    enableHeartbeat: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    adobeAnalytics = new AdobeAnalytics(options);
    analytics.use(AdobeAnalytics);
    analytics.use(tester);
    analytics.add(adobeAnalytics);
    user = analytics.user();
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    adobeAnalytics.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      AdobeAnalytics,
      integration('Adobe Analytics')
        .global('s')
        .global('s_gi')
        .option('events', {})
        .option('eVars', {})
        .option('props', {})
        .option('hVars', {})
        .option('lVars', {})
        .option('contextValues', {})
        .option('timestampOption', 'enabled')
        .option('disableVisitorId', false)
        .option('productIdentifier', 'name')
        .option('marketingCloudOrgId', null)
        .option('heartbeatTrackingServerUrl', '')
        .option('ssl', false)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(adobeAnalytics, 'load');
    });

    describe('#initialize', function() {
      it('should set `window.s_account`', function() {
        analytics.initialize();
        analytics.equal(window.s_account, options.reportSuiteId);
      });

      it('should preserve an existing `window.s_account`', function() {
        window.s_account = 'existing';
        analytics.initialize();
        analytics.equal(window.s_account, 'existing');
      });

      it('should set new fields on this.options based on sOptions', function() {
        analytics.initialize();
        analytics.equal(adobeAnalytics.options.currencyCode, 'USD');
        analytics.equal(adobeAnalytics.options.charSet, 'ISO-8859-1');
        analytics.equal(adobeAnalytics.options.trackDownloadLinks, true);
        analytics.equal(adobeAnalytics.options.trackExternalLinks, true);
        analytics.equal(adobeAnalytics.options.trackInlineStats, true);
        analytics.equal(
          adobeAnalytics.options.linkDownloadFileTypes,
          'exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx'
        );
        analytics.equal(adobeAnalytics.options.linkLeaveQueryString, false);
        analytics.equal(adobeAnalytics.options.linkTrackVars, 'None');
        analytics.equal(adobeAnalytics.options.linkTrackEvents, 'None');
        analytics.equal(adobeAnalytics.options.usePlugins, true);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(adobeAnalytics, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#initialize', function() {
      it('should set window.s.trackingServer', function() {
        analytics.equal(window.s.trackingServer, options.trackingServerUrl);
      });

      it('should set window.s.trackingServerSecure', function() {
        analytics.equal(
          window.s.trackingServerSecure,
          options.trackingServerSecureUrl
        );
      });

      it('should set s.visitor if marketingCloudOrgId is provided', function() {
        // window.Visitor.getInstance() returns an object that has bunch of properties on it
        // not sure how robust this test is but should suffice for now
        analytics.equal(
          window.s.visitor.marketingCloudOrgID,
          options.marketingCloudOrgId
        );
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.s, 'tl');
      });

      it('tracks mapped events', function() {
        analytics.track('Drank Some Milk');
        analytics.equal(window.s.events, 'event6');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(
          contains(window.s.linkTrackVars, 'events', 'timestamp')
        );
        analytics.called(window.s.tl, true, 'o', 'Drank Some Milk');
      });

      it('tracks new mapped events', function() {
        adobeAnalytics.options.events = [
          { segmentEvent: 'Drank Some Milk', adobeEvents: ['event6'] },
          { segmentEvent: 'Played a Song', adobeEvents: ['event1'] }
        ];

        analytics.track('Drank Some Milk');
        analytics.equal(window.s.events, 'event6');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(
          contains(window.s.linkTrackVars, 'events', 'timestamp')
        );
        analytics.called(window.s.tl, true, 'o', 'Drank Some Milk');
      });

      it('tracks new mapped events (with multiple declarations)', function() {
        adobeAnalytics.options.events = [
          { segmentEvent: 'Drank Some Milk', adobeEvents: ['event1'] },
          { segmentEvent: 'Drank some milk', adobeEvents: ['event2'] }
        ];

        analytics.track('Drank Some Milk');
        analytics.equal(window.s.events, 'event1,event2');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(
          contains(window.s.linkTrackVars, 'events', 'timestamp')
        );
        analytics.called(window.s.tl, true, 'o', 'Drank Some Milk');
      });

      it('should not track unmapped track events', function() {
        analytics.track('dark templars psystorming your mineral line');
        analytics.didNotCall(window.s.tl);
        analytics.assert(!window.s.events);
      });

      it('should track set event names set as eVars properly', function() {
        analytics.track('Overlord exploded');
        analytics.equal(window.s.events, 'event7');
        analytics.equal(window.s.eVar65, 'Overlord exploded');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(
          contains(window.s.linkTrackVars, 'events', 'timestamp', 'eVar65')
        );
        analytics.called(window.s.tl, true, 'o', 'Overlord exploded');
      });

      it('tracks aliased properties', function() {
        analytics.track('Drank Some Milk', {
          type: '2%',
          brand: 'Lucerne',
          good: true
        });
        analytics.equal(window.s.prop13, '2%');
        analytics.equal(window.s.prop23, 'Lucerne');
        analytics.equal(window.s.prop10, 'true');
        analytics.assert(
          contains(
            window.s.linkTrackVars,
            'contextData.type',
            'contextData.brand',
            'contextData.good',
            'events',
            'prop13',
            'prop23',
            'prop10',
            'timestamp'
          )
        );
        analytics.called(window.s.tl, true, 'o', 'Drank Some Milk');
      });

      it('should send context properties', function() {
        adobeAnalytics.options.contextValues = {
          'page.referrer': 'page.referrer',
          'page.url': 'page.title'
        };
        analytics.track('Drank Some Milk', { foo: 'bar' });
        analytics.equal(
          window.s.contextData['page.referrer'],
          window.document.referrer
        );
        analytics.equal(
          window.s.contextData['page.title'],
          window.location.href
        );
        analytics.equal(window.s.contextData.foo, 'bar');
        analytics.called(window.s.tl);
      });

      it('should format namespaced contextData', function() {
        adobeAnalytics.options.customDataPrefix = 'sg';
        analytics.track('Drank Some Milk', { foo: 'bar' });
        analytics.equal(
          window.s.contextData[
            adobeAnalytics.options.customDataPrefix + '.foo'
          ],
          'bar'
        );
      });

      it('tracks eVar mapping without case sensitivity', function() {
        analytics.track('Played a Song', {
          car: 'Two Chainz'
        });
        analytics.equal(window.s.eVar1, 'Two Chainz');
        analytics.track('Played a Song', {
          Car: 'Two Chainz'
        });
        analytics.equal(window.s.eVar1, 'Two Chainz');
        analytics.track('Played a Song', {
          cAr: 'Two Chainz'
        });
        analytics.equal(window.s.eVar1, 'Two Chainz');
        analytics.track('Played a Song', {
          CAR: 'Two Chainz'
        });
        analytics.equal(window.s.eVar1, 'Two Chainz');
      });

      it('tracks hVar mapping without case sensitivity', function() {
        analytics.track('Played a Song', {
          hier_group1: 'Two Chainz'
        });
        analytics.equal(window.s.hier1, 'Two Chainz');
        analytics.track('Played a Song', {
          Hier_group1: 'Two Chainz'
        });
        analytics.equal(window.s.hier1, 'Two Chainz');
        analytics.track('Played a Song', {
          hiEr_grOUp1: 'Two Chainz'
        });
        analytics.equal(window.s.hier1, 'Two Chainz');
        analytics.track('Played a Song', {
          HIER_GROUP1: 'Two Chainz'
        });
        analytics.equal(window.s.hier1, 'Two Chainz');
      });

      it('tracks prop mapping without case sensitivity', function() {
        analytics.track('Played a Song', {
          brand: 'Lucerne'
        });
        analytics.equal(window.s.prop23, 'Lucerne');
        analytics.track('Played a Song', {
          Brand: 'Lucerne'
        });
        analytics.equal(window.s.prop23, 'Lucerne');
        analytics.track('Played a Song', {
          BrANd: 'Lucerne'
        });
        analytics.equal(window.s.prop23, 'Lucerne');
        analytics.track('Played a Song', {
          BRAND: 'Lucerne'
        });
        analytics.equal(window.s.prop23, 'Lucerne');
      });

      it('tracks lVar mapping without case sensitivity', function() {
        analytics.track('Played a Song', {
          names: 'brady,edelman,blount'
        });
        analytics.equal(window.s.list1, 'brady,edelman,blount');
        analytics.track('Played a Song', {
          Names: 'brady,edelman,blount'
        });
        analytics.equal(window.s.list1, 'brady,edelman,blount');
        analytics.track('Played a Song', {
          NaMEs: 'brady,edelman,blount'
        });
        analytics.equal(window.s.list1, 'brady,edelman,blount');
        analytics.track('Played a Song', {
          NAMES: 'brady,edelman,blount'
        });
        analytics.equal(window.s.list1, 'brady,edelman,blount');
      });

      it('should join arrays for list variables', function() {
        analytics.track('Played a Song', {
          names: ['brady', 'edelman', 'blount']
        });
        analytics.equal(window.s.list1, 'brady,edelman,blount');
      });

      it('tracks aliased eVars with nested properties (case insensitive)', function() {
        analytics.track('Drank Some Milk', {
          car: { info: '2003 Accord (only one previous owner)' },
          'my.dog': 'Dog',
          good: false
        });
        analytics.equal(
          window.s.eVar101,
          '2003 Accord (only one previous owner)'
        );
        analytics.equal(window.s.eVar401, 'Dog');
        analytics.assert(
          contains(
            window.s.linkTrackVars,
            'contextData.car.info',
            'contextData.my.dog',
            'contextData.good',
            'events',
            'eVar101',
            'eVar401',
            'prop10',
            'timestamp'
          )
        );
      });

      it('should send timestamp by default', function() {
        var date = new Date();
        analytics.track('Played a Song', {}, { timestamp: date });
        analytics.equal(window.s.timestamp, iso(date));
      });

      it('should respect properties.timestamp', function() {
        var date = new Date();
        analytics.track('Played a Song', { timestamp: date });
        analytics.equal(window.s.timestamp, iso(date));
      });

      it('should fallback to track.timestamp()', function() {
        var date = new Date();
        analytics.track('Played a Song', {}, { timestamp: date });
        analytics.equal(window.s.timestamp, iso(date));
      });

      it('should send timestamp for hybrid reporting suites', function() {
        delete window.s.timestamp;
        adobeAnalytics.options.timestampOption = 'hybrid';
        var date = new Date();
        analytics.track('Played a Song', {}, { timestamp: date });
        analytics.equal(window.s.timestamp, iso(date));
      });

      it('should not send the timestamp if the setting is disabled', function() {
        delete window.s.timestamp;
        adobeAnalytics.options.timestampOption = 'disabled';
        analytics.track('Played a Song');
        analytics.equal(window.s.timestamp, null);
      });

      it('should update common variables', function() {
        analytics.track('Drank Some Milk', {
          channel: 'my voice',
          campaign: 'feel the bern',
          state: 'zootopia',
          zip: '1738'
        });
        analytics.equal(window.s.events, 'event6');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(
          contains(
            window.s.linkTrackVars,
            'contextData.channel',
            'contextData.campaign',
            'contextData.state',
            'contextData.zip',
            'events',
            'timestamp',
            'channel',
            'campaign',
            'state',
            'zip'
          )
        );
        analytics.called(window.s.tl, true, 'o', 'Drank Some Milk');
      });

      it('should respect context.campaign.name over properties.campaign', function() {
        analytics.track(
          'Drank Some Milk',
          {},
          {
            campaign: {
              name: 'TPS Innovation Newsletter'
            }
          }
        );
        analytics.equal(window.s.campaign, 'TPS Innovation Newsletter');
      });

      it('should update pageName if exists', function() {
        analytics.track('Drank Some Milk', {
          pageName: 'yolo moves made'
        });
        analytics.equal(window.s.pageName, 'yolo moves made');
        analytics.track(
          'Drank Some Milk',
          {},
          {
            context: {
              page: { title: 'yolo moves most definitely made' }
            }
          }
        );
        analytics.equal(window.s.pageName, 'yolo moves most definitely made');
      });

      it('should not update pageName if disabled', function() {
        adobeAnalytics.options.enableTrackPageName = false;
        analytics.track('Drank Some Milk', {
          pageName: 'yolo moves made'
        });
        analytics.assert(!window.s.pageName);
      });

      it('should clear window.s[variables] between calls', function() {
        analytics.track('Drank some milk', { Airplane: '123' });
        analytics.equal(window.s.prop20, '123');
        analytics.track('Drank some milk', { Good: 'heyo' });
        analytics.assert(!window.s.prop20);
        analytics.equal(window.s.prop10, 'heyo');
      });

      describe('#ecommerce', function() {
        it('tracks product viewed', function() {
          analytics.track('Product Viewed', {
            id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            name: 'Monopoly: 3rd Edition',
            price: 18.99,
            category: 'Games'
          });
          analytics.equal(
            window.s.products,
            'Games;Monopoly: 3rd Edition;1;18.99'
          );
          analytics.assert(window.s.events === 'prodView');
          analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
          analytics.assert(
            contains(
              window.s.linkTrackVars,
              'contextData.id',
              'contextData.sku',
              'contextData.name',
              'contextData.price',
              'contextData.category',
              'events',
              'products',
              'timestamp'
            )
          );
          analytics.called(window.s.tl, true, 'o', 'Product Viewed');
        });

        it('tracks product list viewed', function() {
          analytics.track('Product List Viewed', {
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
          analytics.equal(
            window.s.products,
            'Games;Monopoly: 3rd Edition;1;19.00,' +
              'Games;Uno Card Game;2;6.00'
          );
          analytics.assert(window.s.events === 'prodView');
          analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
          analytics.called(window.s.tl, true, 'o', 'Product List Viewed');
        });

        it('can send SKU as product identifier', function() {
          adobeAnalytics.options.productIdentifier = 'sku';
          analytics.track('Product Viewed', {
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            name: 'Monopoly: 3rd Edition',
            price: 18.99,
            category: 'Games'
          });
          analytics.equal(window.s.products, 'Games;G-32;1;18.99');
          analytics.assert(window.s.events === 'prodView');
          analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
          analytics.assert(
            contains(
              window.s.linkTrackVars,
              'contextData.product_id',
              'contextData.sku',
              'contextData.name',
              'contextData.price',
              'contextData.category',
              'events',
              'products',
              'timestamp'
            )
          );
          analytics.called(window.s.tl, true, 'o', 'Product Viewed');
        });

        it('can send id as product identifier', function() {
          adobeAnalytics.options.productIdentifier = 'id';
          analytics.track('Product Viewed', {
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            name: 'Monopoly: 3rd Edition',
            price: 18.99,
            category: 'Games'
          });
          analytics.equal(
            window.s.products,
            'Games;507f1f77bcf86cd799439011;1;18.99'
          );
          analytics.assert(window.s.events === 'prodView');
          analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
          analytics.assert(
            contains(
              window.s.linkTrackVars,
              'contextData.product_id',
              'contextData.sku',
              'contextData.name',
              'contextData.price',
              'contextData.category',
              'events',
              'products',
              'timestamp'
            )
          );
          analytics.called(window.s.tl, true, 'o', 'Product Viewed');
        });

        it('tracks product added', function() {
          analytics.track('Product Added', {
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            name: 'Monopoly: 3rd Edition',
            price: 18.99,
            quantity: 2,
            category: 'Games'
          });
          analytics.equal(
            window.s.products,
            'Games;Monopoly: 3rd Edition;2;37.98'
          );
          analytics.assert(window.s.events === 'scAdd');
          analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
          analytics.assert(
            contains(
              window.s.linkTrackVars,
              'contextData.product_id',
              'contextData.sku',
              'contextData.name',
              'contextData.price',
              'contextData.quantity',
              'contextData.category',
              'events',
              'products',
              'timestamp'
            )
          );
          analytics.called(window.s.tl, true, 'o', 'Product Added');
        });

        it('tracks product removed', function() {
          analytics.track('Product Removed', {
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            name: 'Monopoly: 3rd Edition',
            price: 18.99,
            quantity: 2,
            category: 'Games'
          });
          analytics.equal(
            window.s.products,
            'Games;Monopoly: 3rd Edition;2;37.98'
          );
          analytics.assert(window.s.events === 'scRemove');
          analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
          analytics.assert(
            contains(
              window.s.linkTrackVars,
              'contextData.product_id',
              'contextData.sku',
              'contextData.name',
              'contextData.price',
              'contextData.quantity',
              'contextData.category',
              'events',
              'products',
              'timestamp'
            )
          );
          analytics.called(window.s.tl, true, 'o', 'Product Removed');
        });

        it('tracks order completed', function() {
          analytics.track('Order Completed', {
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
          analytics.equal(
            window.s.products,
            'Games;Monopoly: 3rd Edition;1;19.00,' +
              'Games;Uno Card Game;2;6.00'
          );
          analytics.assert(window.s.events === 'purchase');
          analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
          analytics.called(window.s.tl, true, 'o', 'Order Completed');

          // There are too many contextData properties here to do the ordinary test.
          var expectedLinkTrackVars = [
            'events',
            'products',
            'purchaseID',
            'transactionID',
            'timestamp'
          ];
          for (var index = 0; index < expectedLinkTrackVars.length; index++) {
            analytics.assert(
              window.s.linkTrackVars
                .split(',')
                .indexOf(expectedLinkTrackVars[index]) >= 0
            );
          }
        });

        it('tracks cart viewed', function() {
          analytics.track('Cart Viewed', {
            cart_id: 'd92jd29jd92jd29j92d92jd',
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
          analytics.equal(
            window.s.products,
            'Games;Monopoly: 3rd Edition;1;19.00,' +
              'Games;Uno Card Game;2;6.00'
          );
          analytics.assert(window.s.events === 'scView');
          analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
          analytics.called(window.s.tl, true, 'o', 'Cart Viewed');

          // There are too many contextData properties here to do the ordinary test.
          var expectedLinkTrackVars = ['events', 'products', 'timestamp'];
          for (var index = 0; index < expectedLinkTrackVars.length; index++) {
            analytics.assert(
              window.s.linkTrackVars
                .split(',')
                .indexOf(expectedLinkTrackVars[index]) >= 0
            );
          }
        });

        it('tracks checkout started', function() {
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
          analytics.assert(window.s.events === 'scCheckout');
          analytics.equal(
            window.s.products,
            'Games;Monopoly: 3rd Edition;1;19.00,' +
              'Games;Uno Card Game;2;6.00'
          );
          analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
          analytics.called(window.s.tl, true, 'o', 'Checkout Started');

          // There are too many contextData properties here to do the ordinary test.
          var expectedLinkTrackVars = [
            'events',
            'products',
            'purchaseID',
            'transactionID',
            'timestamp'
          ];
          for (var index = 0; index < expectedLinkTrackVars.length; index++) {
            analytics.assert(
              window.s.linkTrackVars
                .split(',')
                .indexOf(expectedLinkTrackVars[index]) >= 0
            );
          }
        });

        it('should let you override default currencyCode', function() {
          analytics.track('Order Completed', { currency: 'AUD' });
          analytics.equal(window.s.currencyCode, 'AUD');
        });

        it('includes mapped events', function() {
          adobeAnalytics.options.events.push({
            segmentEvent: 'product viewed',
            adobeEvents: ['event1', 'event38']
          });
          analytics.track('Product Viewed', {
            id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            name: 'Monopoly: 3rd Edition',
            price: 18.99,
            category: 'Games'
          });
          analytics.equal(window.s.events, 'prodView,event1,event38');
        });

        it('includes new mapped events', function() {
          adobeAnalytics.options.events = [
            {
              segmentEvent: 'product viewed',
              adobeEvents: ['event1', 'event38']
            }
          ];

          analytics.track('Product Viewed', {
            id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            name: 'Monopoly: 3rd Edition',
            price: 18.99,
            category: 'Games'
          });
          analytics.equal(window.s.events, 'prodView,event1,event38');
        });

        it('includes new mapped events (with multiple declarations)', function() {
          adobeAnalytics.options.events = [
            { segmentEvent: 'product viewed', adobeEvents: ['event1'] },
            { segmentEvent: 'product viewed', adobeEvents: ['event38'] }
          ];

          analytics.track('Product Viewed', {
            id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            name: 'Monopoly: 3rd Edition',
            price: 18.99,
            category: 'Games'
          });
          analytics.equal(window.s.events, 'prodView,event1,event38');
        });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        delete window.s.visitorID; // since this is not wiped by clearKeys();
        analytics.stub(window.s, 't');
      });

      it('tracks nameless pages', function() {
        analytics.page();
        analytics.equal(window.s.pageName, undefined);
        analytics.deepEqual(window.s.events, window.s.pageName);
        analytics.called(window.s.t);
      });

      it('tracks normal pages', function() {
        analytics.page('Page1');
        analytics.equal(window.s.pageName, 'Page1');
        analytics.deepEqual(window.s.events, window.s.pageName);
        analytics.called(window.s.t);
      });

      it('tracks mapped properties', function() {
        analytics.page('Drank Some Milk', {
          type: '2%',
          hier_group2: 'Lucerne',
          dog: true
        });
        analytics.equal(window.s.pageName, 'Drank Some Milk');
        analytics.equal(window.s.prop13, '2%');
        analytics.equal(window.s.hier2, 'Lucerne');
        analytics.equal(window.s.eVar47, 'true');
        analytics.called(window.s.t);
      });

      it('should send context properties', function() {
        adobeAnalytics.options.contextValues = {
          'page.referrer': 'page.referrer',
          'page.url': 'page.title'
        };
        analytics.page('Page1', {});
        analytics.equal(
          window.s.contextData['page.referrer'],
          window.document.referrer
        );
        analytics.equal(
          window.s.contextData['page.title'],
          window.location.href
        );
        analytics.equal(
          window.s.contextData.referrer,
          window.document.referrer
        );
        analytics.equal(window.s.contextData.url, window.location.href);
        analytics.called(window.s.t);
      });

      it('should format namespaced contextData', function() {
        adobeAnalytics.options.customDataPrefix = 'sg';
        analytics.page('Page1', {});
        analytics.equal(
          window.s.contextData[
            adobeAnalytics.options.customDataPrefix + '.referrer'
          ],
          window.document.referrer
        );
        analytics.equal(
          window.s.contextData[
            adobeAnalytics.options.customDataPrefix + '.url'
          ],
          window.location.href
        );
      });

      it('should send user.id as visitorID if timestamps are disabled and userId exists', function() {
        adobeAnalytics.options.timestampOption = 'disabled';
        user.id('user-id');
        analytics.page('name');
        analytics.equal(window.s.pageName, 'name');
        analytics.equal(window.s.visitorID, 'user-id');
        analytics.called(window.s.t);
      });

      it('should not send user.id as visitorID if timestamps are enabled', function() {
        adobeAnalytics.options.timestampOption = 'enabled';
        user.id('user-id');
        analytics.page('name');
        analytics.equal(window.s.pageName, 'name');
        analytics.assert(!window.s.visitorID);
        analytics.called(window.s.t);
      });

      it('should not send user.id as visitorID if timestamps are optional', function() {
        adobeAnalytics.options.timestampOption = 'hybrid';
        user.id('user-id');
        analytics.page('name');
        analytics.equal(window.s.pageName, 'name');
        analytics.assert(!window.s.visitorID);
        analytics.called(window.s.t);
      });

      it('should send visitorId instead of timestamp for hybrid reporting suites if preferred', function() {
        adobeAnalytics.options.timestampOption = 'hybrid';
        adobeAnalytics.options.preferVisitorId = true;
        user.id('123');
        analytics.page('climb to platinum');
        analytics.equal(window.s.visitorID, '123');
        analytics.assert(!window.s.timestamp);
        analytics.called(window.s.t);
      });

      it('should not send empty user.id as visitorID', function() {
        analytics.page('name');
        analytics.equal(window.s.pageName, 'name');
        analytics.assert(!window.s.visitorID);
        analytics.called(window.s.t);
      });

      it('should not send visitorId if disabled', function() {
        adobeAnalytics.options.disableVisitorId = true;
        adobeAnalytics.options.timestampOption = 'disabled';
        user.id('hamsolo');
        analytics.page('yo');
        analytics.assert(!window.s.visitorID);
      });

      it('tracks aliased eVars with nested properties', function() {
        analytics.page('Drank Some Milk', {
          car: { info: '2003 Accord (only one previous owner)' },
          'my.dog': 'Dog',
          good: false
        });
        analytics.equal(window.s.pageName, 'Drank Some Milk');
        analytics.equal(
          window.s.eVar101,
          '2003 Accord (only one previous owner)'
        );
        analytics.equal(window.s.eVar401, 'Dog');
        analytics.called(window.s.t);
      });

      it('should respect properties.timestamp', function() {
        var date = iso(new Date());
        analytics.page({ timestamp: date });
        analytics.equal(window.s.timestamp, date);
        analytics.called(window.s.t);
      });

      it('should fallback to page.timestamp()', function() {
        var date = new Date();
        analytics.page({}, { timestamp: date });
        analytics.equal(window.s.timestamp, iso(date));
        analytics.called(window.s.t);
      });

      it('should not send the timestamp if the setting is disabled', function() {
        adobeAnalytics.options.timestampOption = 'disabled';
        analytics.page();
        analytics.assert(!window.s.timestamp);
        analytics.called(window.s.t);
      });

      it('should set referrer', function() {
        analytics.page('warriors', { Airplane: '123' });
        analytics.equal(window.s.referrer, window.document.referrer);
      });

      it('should clear window.s[variables] between calls', function() {
        analytics.page('warriors', { Airplane: '123' });
        analytics.equal(window.s.prop20, '123');
        analytics.page('warriors', { Good: 'heyo' });
        analytics.assert(!window.s.prop20);
        analytics.equal(window.s.prop10, 'heyo');
      });
    });

    describe('Heartbeat Video', function() {
      var sessionId = 'session-' + Math.ceil(Math.random() * 1000);

      it('should initialize Heartbeat when a video session begins', function() {
        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.assert(adobeAnalytics.mediaHeartbeats[sessionId]);
        analytics.assert(!adobeAnalytics.mediaHeartbeats['does-not-exist']);
      });

      it('should initialize Heartbeat even if a user does not explicitly start the session first', function() {
        analytics.track('Video Content Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.assert(adobeAnalytics.mediaHeartbeats[sessionId]);
      });

      it('should initialize to "default" if a session_id is not provided', function() {
        analytics.track('Video Playback Started', {
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.assert(adobeAnalytics.mediaHeartbeats.default);
      });

      it('should keep sessions with different ids separate', function() {
        var newSessionId = 'session-new';

        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.track('Video Playback Started', {
          session_id: newSessionId,
          channel: 'Aperture Enrichment Center',
          video_player: 'GLaDOS',
          playhead: 0,
          asset_id: 'Companion Cube',
          title: 'Portal',
          total_length: 317,
          livestream: false
        });

        // Ensure that both exist, and are not references to the same object.
        analytics.assert(
          adobeAnalytics.mediaHeartbeats[sessionId] &&
            adobeAnalytics.mediaHeartbeats[newSessionId]
        );
        analytics.assert(
          adobeAnalytics.mediaHeartbeats[sessionId] !==
            adobeAnalytics.mediaHeartbeats[newSessionId]
        );
      });

      it('should call trackPlay when a video starts', function() {
        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.stub(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat,
          'trackPlay'
        );

        analytics.track('Video Content Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackPlay
        );
      });

      it('should call trackPlay when a video resumes', function() {
        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.stub(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat,
          'trackPlay'
        );

        analytics.track('Video Playback Resumed', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackPlay
        );
      });

      it('should call trackComplete when a video completes', function() {
        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.stub(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat,
          'trackComplete'
        );

        analytics.track('Video Content Completed', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackComplete
        );
      });

      it('should call trackPause when a video is paused', function() {
        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.stub(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat,
          'trackPause'
        );

        analytics.track('Video Playback Paused', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackPause
        );
      });

      it('should delete the instance when the session is over', function() {
        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.assert(adobeAnalytics.mediaHeartbeats[sessionId]);

        // We need to save this reference for the upcoming check, since we delete the higher property after the next call.
        var heartbeatRef = adobeAnalytics.mediaHeartbeats[sessionId].heartbeat;
        analytics.stub(heartbeatRef, 'trackSessionEnd');

        analytics.track('Video Playback Completed', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.assert(!adobeAnalytics.mediaHeartbeats[sessionId]);
        analytics.called(heartbeatRef.trackSessionEnd);
      });

      it('should start an Ad Break and Ad Tracking when an ad starts', function() {
        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.stub(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat,
          'trackEvent'
        );

        analytics.track('Video Ad Started', {
          session_id: sessionId,
          asset_id: 12345,
          title: 'Shut up and take my money!',
          type: 'mid-roll',
          position: 0,
          total_length: 31
        });

        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackEvent,
          window.ADB.va.MediaHeartbeat.Event.AdBreakStart
        );
        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackEvent,
          window.ADB.va.MediaHeartbeat.Event.AdStart
        );
      });

      it('should end Ad Tracking and the Ad Break when an ad completes', function() {
        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.track('Video Ad Started', {
          session_id: sessionId,
          asset_id: '12345',
          title: 'Shut up and take my money!',
          type: 'mid-roll',
          position: 0,
          total_length: 31
        });

        analytics.stub(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat,
          'trackEvent'
        );

        analytics.track('Video Ad Completed', {
          session_id: sessionId,
          asset_id: '12345',
          title: 'Shut up and take my money!',
          type: 'mid-roll',
          position: 0,
          total_length: 31
        });

        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackEvent,
          window.ADB.va.MediaHeartbeat.Event.AdComplete
        );
        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackEvent,
          window.ADB.va.MediaHeartbeat.Event.AdBreakComplete
        );
      });

      it('should track an entire ad, even if the ad init is not called', function() {
        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.stub(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat,
          'trackEvent'
        );

        analytics.track('Video Ad Completed', {
          session_id: sessionId,
          asset_id: '12345',
          title: 'Shut up and take my money!',
          type: 'mid-roll',
          position: 20,
          total_length: 31
        });

        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackEvent,
          window.ADB.va.MediaHeartbeat.Event.AdBreakStart
        );
        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackEvent,
          window.ADB.va.MediaHeartbeat.Event.AdStart
        );
        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackEvent,
          window.ADB.va.MediaHeartbeat.Event.AdComplete
        );
        analytics.called(
          adobeAnalytics.mediaHeartbeats[sessionId].heartbeat.trackEvent,
          window.ADB.va.MediaHeartbeat.Event.AdBreakComplete
        );
      });
    });
  });
});

/**
 * Returns true if the string contains all of the substrings passed
 * in the argument. Also fails if you do not pass enough arguments aka
 * missing to check parameters
 *
 * @param {string} str
 * @param {...string} substrings
 */

function contains(str) {
  var requiredNumberOfArgs = str.split(',').length;
  var args = Array.prototype.slice.call(arguments);
  args.shift();
  if (args.length !== requiredNumberOfArgs) return false;
  for (var i = 0; i < args.length; i++) {
    if (str.indexOf(args[i]) === -1) return false;
  }
  return true;
}
