'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Amplitude = require('../lib/');
var sinon = require('sinon');
var assert = require('assert');

describe('Amplitude', function() {
  var amplitude;
  var analytics;
  var options = {
    apiKey: '07808866adb2510adf19ee69e8fc2201',
    trackUtmProperties: true,
    trackReferrer: false,
    batchEvents: false,
    eventUploadThreshold: 30,
    eventUploadPeriodMillis: 30000,
    forceHttps: false,
    trackGclid: false,
    saveParamsReferrerOncePerSession: true,
    deviceIdFromUrlParam: false,
    trackRevenuePerProduct: false,
    mapQueryParams: {},
    traitsToIncrement: [],
    traitsToSetOnce: [],
    preferAnonymousIdForDeviceId: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    amplitude = new Amplitude(options);
    analytics.use(Amplitude);
    analytics.use(tester);
    analytics.add(amplitude);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    amplitude.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Amplitude,
      integration('Amplitude')
        .global('amplitude')
        .option('apiKey', '')
        .option('trackAllPages', false)
        .option('trackUtmProperties', true)
        .option('trackNamedPages', true)
        .option('trackReferrer', false)
        .option('batchEvents', false)
        .option('eventUploadThreshold', 30)
        .option('eventUploadPeriodMillis', 30000)
        .option('forceHttps', false)
        .option('trackGclid', false)
        .option('saveParamsReferrerOncePerSession', true)
        .option('trackRevenuePerProduct', false)
        .option('traitsToSetOnce', [])
        .option('traitsToIncrement', [])
        .option('deviceIdFromUrlParam', false)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(amplitude, 'load');
    });

    afterEach(function() {
      amplitude.reset();
    });

    describe('#initialize', function() {
      it('should create window.amplitude', function() {
        analytics.assert(!window.amplitude);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.amplitude);
      });

      it('should call load', function() {
        amplitude.initialize();
        analytics.called(amplitude.load);
      });

      it('should set domain', function() {
        analytics.spy(amplitude, 'setDomain');
        analytics.initialize();
        analytics.called(amplitude.setDomain, window.location.href);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(amplitude, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should init with right options', function() {
      var config = window.amplitude.getInstance().options;
      analytics.assert(config.includeUtm === options.trackUtmProperties);
      analytics.assert(config.includeReferrer === options.trackReferrer);
      analytics.assert(config.batchEvents === options.batchEvents);
      analytics.assert(
        config.eventUploadThreshold === options.eventUploadThreshold
      );
      analytics.assert(
        config.eventUploadPeriodMillis === options.eventUploadPeriodMillis
      );
      analytics.assert(config.forceHttps === options.forceHttps);
      analytics.assert(config.includeGclid === options.trackGclid);
      analytics.assert(
        config.saveParamsReferrerOncePerSession ===
          options.saveParamsReferrerOncePerSession
      );
      analytics.assert(
        config.deviceIdFromUrlParam === options.deviceIdFromUrlParam
      );
      analytics.assert(config.deviceId === analytics.user().anonymousId());
    });

    it('should set api key', function() {
      analytics.assert(
        window.amplitude.getInstance().options.apiKey === options.apiKey
      );
    });

    describe('preferAnonymousIdForDeviceId disabled', function() {
      before(function() {
        options.preferAnonymousIdForDeviceId = false;
      });

      it('should init without anonymousId as the deviceId', function() {
        var config = window.amplitude.getInstance().options;
        analytics.assert(config.deviceId !== analytics.user().anonymousId());
      });

      after(function() {
        options.preferAnonymousIdForDeviceId = true;
      });
    });

    describe('#setDeviceId', function() {
      it('should call window.amplitude.setDeviceId', function() {
        analytics.spy(window.amplitude.getInstance(), 'setDeviceId');
        amplitude.setDeviceId('deviceId');
        analytics.called(
          window.amplitude.getInstance().setDeviceId,
          'deviceId'
        );
      });

      it('should not call amplitude.setDeviceId if deviceId is falsey', function() {
        analytics.spy(window.amplitude.getInstance(), 'setDeviceId');
        amplitude.setDeviceId('');
        analytics.didNotCall(window.amplitude.getInstance().setDeviceId);
      });
    });

    describe('#_initUtmData', function() {
      it('should initialize utm properties', function() {
        amplitude.options.trackUtmProperties = true;
        analytics.once('ready', function() {
          analytics.spy(window.amplitude.getInstance(), '_initUtmData');
          analytics.called(window.amplitude.getInstance()._initUtmData);
        });
      });

      it('should not track utm properties if disabled', function() {
        analytics.spy(window.amplitude.getInstance(), '_initUtmData');
        analytics.didNotCall(window.amplitude.getInstance()._initUtmData);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.amplitude.getInstance(), 'logEvent');
        analytics.stub(window.amplitude.getInstance(), 'setUserProperties');
        analytics.stub(window.amplitude.getInstance(), 'setDeviceId');
      });

      it('should not track unnamed pages by default', function() {
        analytics.page();
        analytics.didNotCall(window.amplitude.getInstance().logEvent);
      });

      it('should track unnamed pages if enabled', function() {
        amplitude.options.trackAllPages = true;
        analytics.page();
        analytics.called(
          window.amplitude.getInstance().logEvent,
          'Loaded a Page'
        );
      });

      it('should track named pages by default', function() {
        analytics.page('Name');
        analytics.called(
          window.amplitude.getInstance().logEvent,
          'Viewed Name Page'
        );
      });

      it('should track named pages with a category added', function() {
        analytics.page('Category', 'Name');
        analytics.called(
          window.amplitude.getInstance().logEvent,
          'Viewed Category Name Page'
        );
      });

      it('should track categorized pages by default', function() {
        analytics.page('Category', 'Name');
        analytics.called(
          window.amplitude.getInstance().logEvent,
          'Viewed Category Page'
        );
      });

      it('should not track name or categorized pages if disabled', function() {
        amplitude.options.trackNamedPages = false;
        amplitude.options.trackCategorizedPages = false;
        analytics.page('Category', 'Name');
        analytics.didNotCall(window.amplitude.getInstance().logEvent);
      });

      it('should map query params to custom property as user properties', function() {
        amplitude.options.trackAllPages = true;
        amplitude.options.mapQueryParams = { customProp: 'user_properties' };
        analytics.page({}, { page: { search: '?suh=dude' } });
        analytics.called(window.amplitude.getInstance().setUserProperties, {
          customProp: '?suh=dude'
        });
      });

      it('should map query params to custom property as event properties', function() {
        amplitude.options.trackAllPages = true;
        amplitude.options.mapQueryParams = { params: 'event_properties' };
        analytics.page(
          { referrer: document.referrer },
          { page: { search: '?suh=dude' } }
        );
        analytics.called(
          window.amplitude.getInstance().logEvent,
          'Loaded a Page',
          {
            params: '?suh=dude',
            path: '/context.html',
            referrer: document.referrer,
            search: '', // in practice this would also be set to the query param but limitation of test prevents this from being set
            title: '',
            url: 'http://localhost:9876/context.html'
          }
        );
      });

      it('should set deviceId if `preferAnonymousIdForDeviceId` is set', function() {
        analytics.user().anonymousId('example');
        amplitude.options.preferAnonymousIdForDeviceId = false;
        analytics.identify('id');
        analytics.didNotCall(window.amplitude.getInstance().setDeviceId);

        amplitude.options.preferAnonymousIdForDeviceId = true;
        analytics.identify('id');
        analytics.called(window.amplitude.getInstance().setDeviceId, 'example');
      });

      it('should send referrer if "trackReferrer" is set', function() {
        var spy = sinon.spy(window.amplitude.getInstance(), 'identify');

        var stub = sinon.stub(amplitude, 'getReferrer');
        stub.returns('http://examplepage.com/');

        amplitude.options.trackReferrer = true;

        analytics.page();

        sinon.assert.calledWith(
          spy,
          sinon.match({
            userPropertiesOperations: sinon.match({
              $setOnce: sinon.match({
                initial_referrer: 'http://examplepage.com/',
                initial_referring_domain: 'examplepage.com'
              }),
              $set: sinon.match({
                referrer: 'http://examplepage.com/',
                referring_domain: 'examplepage.com'
              })
            })
          })
        );
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(
          window.amplitude.getInstance().Identify.prototype,
          'set'
        );
        analytics.stub(
          window.amplitude.getInstance().Identify.prototype,
          'setOnce'
        );
        analytics.stub(
          window.amplitude.getInstance().Identify.prototype,
          'add'
        );
        analytics.stub(window.amplitude.getInstance(), 'setUserId');
        analytics.stub(window.amplitude.getInstance(), 'setUserProperties');
        analytics.stub(window.amplitude.getInstance(), 'setGroup');
        analytics.stub(window.amplitude.getInstance(), 'setDeviceId');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.amplitude.getInstance().setUserId, 'id');
      });

      it('should set traits', function() {
        analytics.identify({ trait: true });
        analytics.called(
          window.amplitude.getInstance().Identify.prototype.set,
          'trait',
          true
        );
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.amplitude.getInstance().setUserId, 'id');
        analytics.called(
          window.amplitude.getInstance().Identify.prototype.set,
          'id',
          'id'
        );
        analytics.called(
          window.amplitude.Identify.prototype.set,
          'trait',
          true
        );
      });

      it('should send query params under custom trait if set', function() {
        amplitude.options.mapQueryParams = { ham: 'user_properties' };
        analytics.identify(
          'id',
          { trait: true },
          { page: { search: '?foo=bar' } }
        );
        analytics.called(window.amplitude.getInstance().setUserId, 'id');
        analytics.called(
          window.amplitude.getInstance().Identify.prototype.set,
          'id',
          'id'
        );
        analytics.called(
          window.amplitude.getInstance().Identify.prototype.set,
          'trait',
          true
        );
        analytics.called(
          window.amplitude.getInstance().Identify.prototype.set,
          'ham',
          '?foo=bar'
        );
      });

      it('should call add for all traitsToIncrement traits', function() {
        amplitude.options.traitsToIncrement.push('hatTricks');
        analytics.identify({ trait: true, hatTricks: 1 });
        analytics.called(
          window.amplitude.getInstance().Identify.prototype.add,
          'hatTricks',
          1
        );
        analytics.didNotCall(
          window.amplitude.getInstance().Identify.prototype.set,
          'hatTricks',
          1
        );
        analytics.called(
          window.amplitude.getInstance().Identify.prototype.set,
          'trait',
          true
        );
        analytics.didNotCall(
          window.amplitude.getInstance().Identify.prototype.add,
          'trait',
          true
        );
      });

      it('should call setOnce for all traitsToSetOnce traits', function() {
        amplitude.options.traitsToSetOnce.push('yolo');
        analytics.identify({ trait: true, yolo: true });
        analytics.called(
          window.amplitude.getInstance().Identify.prototype.setOnce,
          'yolo',
          true
        );
        analytics.didNotCall(
          window.amplitude.getInstance().Identify.prototype.set,
          'yolo',
          true
        );
        analytics.called(
          window.amplitude.getInstance().Identify.prototype.set,
          'trait',
          true
        );
        analytics.didNotCall(
          window.amplitude.getInstance().Identify.prototype.setOnce,
          'trait',
          true
        );
      });

      it('should set user groups if integration option `groups` is present', function() {
        analytics.identify(
          'id',
          {},
          { integrations: { Amplitude: { groups: { foo: 'bar' } } } }
        );
        analytics.called(window.amplitude.getInstance().setGroup, 'foo', 'bar');
      });

      it('should set deviceId if `preferAnonymousIdForDeviceId` is set', function() {
        analytics.user().anonymousId('example');
        amplitude.options.preferAnonymousIdForDeviceId = false;
        analytics.identify('id');
        analytics.didNotCall(window.amplitude.getInstance().setDeviceId);

        amplitude.options.preferAnonymousIdForDeviceId = true;
        analytics.identify('id');
        analytics.called(window.amplitude.getInstance().setDeviceId, 'example');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.amplitude.getInstance(), 'logEvent');
        analytics.stub(window.amplitude.getInstance(), 'setUserProperties');
        analytics.stub(window.amplitude.getInstance(), 'logRevenue');
        analytics.stub(window.amplitude.getInstance(), 'logRevenueV2');
        analytics.stub(window.amplitude.getInstance(), 'logEventWithGroups');
        analytics.stub(window.amplitude.getInstance(), 'setDeviceId');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.amplitude.getInstance().logEvent, 'event');
        analytics.didNotCall(window.amplitude.getInstance().logRevenue);
        analytics.didNotCall(window.amplitude.getInstance().logRevenueV2);
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.amplitude.getInstance().logEvent, 'event', {
          property: true
        });
        analytics.didNotCall(window.amplitude.getInstance().logRevenue);
        analytics.didNotCall(window.amplitude.getInstance().logRevenueV2);
      });

      it('should send a revenue event', function() {
        analytics.track('event', { revenue: 19.99 });
        analytics.called(
          window.amplitude.getInstance().logRevenue,
          19.99,
          1,
          undefined
        );
        analytics.didNotCall(window.amplitude.getInstance().logRevenueV2);
      });

      it('should send a revenue event with quantity and productId', function() {
        analytics.track('event', {
          revenue: 19.99,
          quantity: 2,
          productId: 'AMP1'
        });
        analytics.called(
          window.amplitude.getInstance().logRevenue,
          19.99,
          2,
          'AMP1'
        );
        analytics.didNotCall(window.amplitude.getInstance().logRevenueV2);
      });

      it('should send a revenueV2 event', function() {
        amplitude.options.useLogRevenueV2 = true;
        analytics.track('event', { revenue: 19.99 });
        var ampRevenue = new window.amplitude.Revenue()
          .setPrice(19.99)
          .setEventProperties({ revenue: 19.99 });
        analytics.didNotCall(window.amplitude.getInstance().logRevenue);
        analytics.called(
          window.amplitude.getInstance().logRevenueV2,
          ampRevenue
        );
      });

      it('should send a revenueV2 event with quantity and productId and revenueType', function() {
        amplitude.options.useLogRevenueV2 = true;
        var props = {
          revenue: 20.0,
          quantity: 2,
          price: 10.0,
          productId: 'AMP1',
          revenueType: 'purchase'
        };
        analytics.track('event', props);
        var ampRevenue = new window.amplitude.Revenue()
          .setPrice(10.0)
          .setQuantity(2)
          .setProductId('AMP1');
        ampRevenue.setRevenueType('purchase').setEventProperties(props);
        analytics.didNotCall(window.amplitude.getInstance().logRevenue);
        analytics.called(
          window.amplitude.getInstance().logRevenueV2,
          ampRevenue
        );
      });

      it('should send a revenueV2 event with revenue if missing price', function() {
        amplitude.options.useLogRevenueV2 = true;
        analytics.track('event', {
          revenue: 20.0,
          quantity: 2,
          productId: 'AMP1'
        });
        var ampRevenue = new window.amplitude.Revenue()
          .setPrice(20.0)
          .setProductId('AMP1');
        ampRevenue.setEventProperties({
          revenue: 20.0,
          quantity: 2,
          productId: 'AMP1'
        });
        analytics.didNotCall(window.amplitude.getInstance().logRevenue);
        analytics.called(
          window.amplitude.getInstance().logRevenueV2,
          ampRevenue
        );
      });

      it('should only send a revenue event if revenue is being logged', function() {
        analytics.track('event', {
          price: 10.0,
          quantity: 2,
          productId: 'AMP1'
        });
        analytics.called(window.amplitude.getInstance().logEvent);
        analytics.didNotCall(window.amplitude.getInstance().logRevenue);
        analytics.didNotCall(window.amplitude.getInstance().logRevenueV2);
      });

      it('should only send a revenueV2 event if revenue is being logged', function() {
        amplitude.options.useLogRevenueV2 = true;
        analytics.track('event', {
          price: 10.0,
          quantity: 2,
          productId: 'AMP1'
        });
        analytics.called(window.amplitude.getInstance().logEvent);
        analytics.didNotCall(window.amplitude.getInstance().logRevenue);
        analytics.didNotCall(window.amplitude.getInstance().logRevenueV2);
      });

      it('should send a query params under custom prop as user properties', function() {
        amplitude.options.mapQueryParams = { ham: 'user_properties' };
        analytics.track(
          'event',
          { foo: 'bar' },
          { page: { search: '?foo=bar' } }
        );
        analytics.called(window.amplitude.getInstance().setUserProperties, {
          ham: '?foo=bar'
        });
      });

      it('should send a query params under custom prop as user or event properties', function() {
        amplitude.options.mapQueryParams = { ham: 'event_properties' };
        analytics.track(
          'event',
          { foo: 'bar' },
          { page: { search: '?foo=bar' } }
        );
        analytics.called(window.amplitude.getInstance().logEvent, 'event', {
          foo: 'bar',
          ham: '?foo=bar'
        });
      });

      it('should send an event with groups if `groups` is an integration specific option', function() {
        analytics.track(
          'event',
          { foo: 'bar' },
          { integrations: { Amplitude: { groups: { sports: 'basketball' } } } }
        );
        analytics.called(
          window.amplitude.getInstance().logEventWithGroups,
          'event',
          { foo: 'bar' },
          { sports: 'basketball' }
        );
      });

      it('should set deviceId if `preferAnonymousIdForDeviceId` is set', function() {
        analytics.user().anonymousId('example');
        amplitude.options.preferAnonymousIdForDeviceId = false;
        analytics.page();
        analytics.didNotCall(window.amplitude.getInstance().setDeviceId);

        amplitude.options.preferAnonymousIdForDeviceId = true;
        analytics.page();
        analytics.called(window.amplitude.getInstance().setDeviceId, 'example');
      });
    });

    describe('#orderCompleted', function() {
      beforeEach(function() {
        analytics.stub(window.amplitude.getInstance(), 'setDeviceId');
      });

      var payload;
      beforeEach(function() {
        payload = {
          checkoutId: 'fksdjfsdjfisjf9sdfjsd9f',
          orderId: '50314b8e9bcf000000000000',
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
              productId: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games'
            },
            {
              productId: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'Uno Card Game',
              price: 3,
              quantity: 2,
              category: 'Games'
            }
          ]
        };
      });

      it('should send a custom revenueType if trackRevenuePerProduct is set', function() {
        amplitude.options.useLogRevenueV2 = true;
        amplitude.options.trackRevenuePerProduct = true;
        var props = {
          revenue: 20.0,
          revenueType: 'I am custom',
          products: [
            {
              quantity: 2,
              price: 10.0,
              productId: 'AMP1'
            }
          ]
        };

        var setRevenue = sinon.spy(amplitude, 'setRevenue');

        analytics.track('Completed Order', props);

        var expected = {
          price: 10.0,
          productId: 'AMP1',
          revenueType: 'I am custom',
          quantity: 2,
          eventProps: {
            revenue: 20.0,
            revenueType: 'I am custom',
            quantity: 2,
            price: 10.0,
            productId: 'AMP1'
          },
          revenue: 20.0
        };

        analytics.assert(setRevenue.withArgs(expected).calledOnce);
      });

      it('should send a logRevenueV2 event for all items in products array if trackRevenuePerProduct is true', function() {
        var spy = sinon.spy(window.amplitude.getInstance(), 'logRevenueV2');
        amplitude.options.trackRevenuePerProduct = true;
        amplitude.options.useLogRevenueV2 = true;

        analytics.track('Order Completed', payload);
        analytics.assert(spy.calledTwice);
      });

      it('should only send a single logRevenueV2 event with the total revenue of all products if trackRevenuePerProduct is false ', function() {
        var spy = sinon.spy(window.amplitude.getInstance(), 'logEvent');
        amplitude.options.trackRevenuePerProduct = false;
        amplitude.options.useLogRevenueV2 = true;

        analytics.track('Order Completed', payload);
        analytics.assert(spy.withArgs('Product Purchased').calledTwice);
      });

      it('should set deviceId if `preferAnonymousIdForDeviceId` is set', function() {
        analytics.user().anonymousId('example');
        amplitude.options.preferAnonymousIdForDeviceId = false;
        analytics.track('Order Completed');
        analytics.didNotCall(window.amplitude.getInstance().setDeviceId);

        amplitude.options.preferAnonymousIdForDeviceId = true;
        analytics.track('Order Completed');
        analytics.called(window.amplitude.getInstance().setDeviceId, 'example');
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window.amplitude.getInstance(), 'setGroup');
        analytics.stub(window.amplitude.getInstance(), 'setDeviceId');
      });

      it('should call setGroup', function() {
        analytics.group('testGroupId');
        analytics.called(
          window.amplitude.getInstance().setGroup,
          '[Segment] Group',
          'testGroupId'
        );
      });

      it('should not call setGroup if groupId is falsey', function() {
        analytics.group('');
        analytics.didNotCall(window.amplitude.getInstance().setGroup);
      });

      it('should use `groupTypeTrait` and `groupValueTrait` when both are present', function() {
        amplitude.options.groupTypeTrait = 'foo';
        amplitude.options.groupValueTrait = 'bar';
        analytics.group('testGroupId', { foo: 'asdf', bar: 'fafa' });
        analytics.called(
          window.amplitude.getInstance().setGroup,
          'asdf',
          'fafa'
        );
      });

      it('should fall back to default behavior if either `group{Type, Value}Trait` is missing', function() {
        amplitude.options.groupTypeTrait = 'foo';
        amplitude.options.groupValueTrait = 'bar';
        analytics.group('testGroupId', { notFoo: 'asdf', bar: 'fafa' });
        analytics.called(
          window.amplitude.getInstance().setGroup,
          '[Segment] Group',
          'testGroupId'
        );
      });

      it('should set deviceId if `preferAnonymousIdForDeviceId` is set', function() {
        analytics.user().anonymousId('example');
        amplitude.options.preferAnonymousIdForDeviceId = false;
        analytics.group('group');
        analytics.didNotCall(window.amplitude.getInstance().setDeviceId);

        amplitude.options.preferAnonymousIdForDeviceId = true;
        analytics.group('group');
        analytics.called(window.amplitude.getInstance().setDeviceId, 'example');
      });
    });

    describe('getReferrer', function() {
      it('should return the value of document.referrer', function() {
        analytics.assert(document.referrer === amplitude.getReferrer());
      });
    });

    describe('sendReferrer', function() {
      it('should not set any referrer props if referrer is falsey', function() {
        amplitude.getReferrer = function() {
          return '';
        };
        var setOnceSpy = sinon.spy(
          window.amplitude.Identify.prototype,
          'setOnce'
        );
        var setSpy = sinon.spy(window.amplitude.Identify.prototype, 'set');
        amplitude.sendReferrer();
        assert(setOnceSpy.notCalled);
        assert(setSpy.notCalled);
      });

      it('should not set an initial referrer domain if it can not find a top level domain', function() {
        amplitude.getReferrer = function() {
          return 'https:/';
        };
        var setOnceSpy = sinon.spy(
          window.amplitude.Identify.prototype,
          'setOnce'
        );
        var setSpy = sinon.spy(window.amplitude.Identify.prototype, 'set');
        amplitude.sendReferrer();
        assert(!setOnceSpy.calledWith('initial_referring_domain'));
        assert(!setSpy.calledWith('referring_domain'));
      });
    });

    describe('setTraits', function() {
      it('should default traitsToIncrement and traitsToSetOnce to empty arrays if they are undefined', function() {
        delete amplitude.options.traitsToIncrement;
        delete amplitude.options.traitsToSetOnce;
        assert.doesNotThrow(function() {
          return amplitude.setTraits({ email: 'test@test.com' });
        });
      });
    });

    describe('setRevenue', function() {
      it('should default revenue to price * quantity if revenue is undefined and logRevenueV2 is not being used', function() {
        var spy = sinon.spy(window.amplitude.getInstance(), 'logRevenue');
        amplitude.options.useLogRevenueV2 = false;
        amplitude.setRevenue({ price: 3, quantity: 3, productId: 'foo' });
        assert(spy.calledWith(9, 3, 'foo'));
      });
    });
  });
});
