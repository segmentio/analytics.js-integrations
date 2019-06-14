'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var Cxense = require('../lib/');

describe('Cxense', function() {
  var analytics;
  var cxense;
  var options = {
    customerPrefix: 'sio'
  };

  beforeEach(function() {
    analytics = new Analytics();
    cxense = new Cxense(options);
    analytics.use(integrationTester);
    analytics.use(Cxense);
    analytics.add(cxense);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    cxense.reset();
    sandbox();
  });

  it('should have the correct options', function() {
    analytics.compare(
      Cxense,
      integration('Cxense')
        .option('customerPrefix', '')
        .option('siteId', '')
        .option('persistedQueryId', '')
        .option('origin', '')
        .option('setExternalId', false)
        .tag('<script src="//cdn.cxense.com/cx.js">')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(cxense, 'load');
    });

    afterEach(function() {
      cxense.reset();
    });

    describe('#initialize', function() {
      it('should create window.cX', function() {
        analytics.assert(!window.cX);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.cX);
      });

      it('should call load', function() {
        analytics.initialize();
        analytics.called(cxense.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(cxense, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.cX.callQueue, 'push');
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.cX.callQueue, 'push');
      });

      it('should send a mapped page event', function() {
        analytics.page('Home', {
          title: 'Home Page',
          path: '/',
          customProp: 'foobar',
          url: 'http://segment.com',
          referrer: 'https://segment.com/warehouses'
        });

        analytics.called(window.cX.callQueue.push, [
          'setCustomParameters',
          {
            title: 'Home Page',
            customProp: 'foobar',
            path: '/',
            name: 'Home',
            search: ''
          }
        ]);

        analytics.called(window.cX.callQueue.push, [
          'sendPageViewEvent',
          {
            location: 'http://segment.com',
            referrer: 'https://segment.com/warehouses',
            useAutoRefreshCheck: false
          }
        ]);
      });

      // TODO: check args
      it('should not send url and referrer as custom properties', function() {
        analytics.page('Test', {
          registered: true,
          url: 'http://segment.com',
          referrer: 'https://segment.com/warehouses'
        });

        analytics.called(window.cX.callQueue.push, [
          'setCustomParameters',
          {
            name: 'Test',
            search: '',
            title: '',
            registered: true,
            path: '/context.html'
          }
        ]);
      });

      it('should parse out unaccepted data types', function() {
        analytics.page('Test', {
          search: '',
          title: 'Home',
          path: '/',
          badProp1: { foo: 'bar' },
          goodProp1: 'yolo',
          badProp2: [{ foo: 'bar' }],
          goodProp2: ['foo', 'bar']
        });

        analytics.called(window.cX.callQueue.push, [
          'setCustomParameters',
          {
            name: 'Test',
            search: '',
            title: 'Home',
            path: '/',
            goodProp1: 'yolo',
            goodProp2: ['foo', 'bar']
          }
        ]);
      });

      it('should add an external id', function() {
        cxense.options.setExternalId = true;
        analytics.user().id('userId');
        analytics.page();

        analytics.called(window.cX.callQueue.push, [
          'addExternalId',
          {
            id: 'userId',
            type: options.customerPrefix
          }
        ]);
      });

      it('should add geolocation if available', function() {
        var latitude = '1234';
        var longitude = '5678';

        analytics.page(
          {},
          {
            context: {
              location: {
                latitude: latitude,
                longitude: longitude
              }
            }
          }
        );

        analytics.called(window.cX.callQueue.push, [
          'setGeoPosition',
          latitude,
          longitude
        ]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.cX.callQueue, 'push');
      });

      it('should call sendEvent method', function() {
        analytics.track('Test Event');
        analytics.called(window.cX.callQueue.push, [
          'sendEvent',
          'Test Event',
          {}
        ]);
      });

      it('should filter out unaccepted data types', function() {
        analytics.track('Test Event', { foo: 'bar', badProperty: [] });
        analytics.called(window.cX.callQueue.push, [
          'sendEvent',
          'Test Event',
          { foo: 'bar' }
        ]);
      });

      it('should stringify booleans and dates', function() {
        var date = new Date();
        analytics.track('Test Event', { foo: true, date: date });
        analytics.called(window.cX.callQueue.push, [
          'sendEvent',
          'Test Event',
          { foo: 'true', date: date.toString() }
        ]);
      });
    });
  });
});
