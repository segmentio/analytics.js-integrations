'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var CastleIntegration = require('../lib/');

describe('Castle', function() {
  var analytics;
  var castle;
  var options = {
    publishableKey: 'pk_K2wUgyknB7ECRb9EsdBURpdirCxJA5Nz'
  };

  beforeEach(function() {
    analytics = new Analytics();
    castle = new CastleIntegration(options);
    analytics.use(tester);
    analytics.use(CastleIntegration);
    analytics.add(castle);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    castle.reset();
    sandbox();
    delete window.casData;
  });

  it('should have the correct settings', function() {
    analytics.compare(
      CastleIntegration,
      integration('Castle')
        .option('publishableKey', '')
        .option('cookieDomain', false)
        .tag(
          '<script src="//d355prp56x5ntt.cloudfront.net/v3/castle.segment.js">'
        )
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(castle, 'load');
    });

    describe('#initialize', function() {
      it('should create the window.casData object', function() {
        analytics.assert(!window.casData);
        analytics.initialize();
        analytics.assert(window.casData);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(castle.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(castle, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    it('window.CastleSegment should be defined', function() {
      analytics.assert(window.CastleSegment);
    });

    describe('#identify', function() {
      it('should delete window.casData', function() {
        window.casData.jwt = '123';
        analytics.identify(
          'id',
          { email: 'test@segment.com' },
          { Castle: true }
        );
        analytics.assert(!window.casData.jwt);
      });

      it('should set jwt', function() {
        analytics.identify(
          'id',
          { email: 'test@segment.com' },
          { Castle: { userJwt: 'jwtToken' } }
        );
        analytics.assert(window.casData.jwt, 'jwtToken');
      });
    });

    describe('#reset', function() {
      it('should delete window.casData', function() {
        window.casData.jwt = '123';
        analytics.reset();
        analytics.assert(window.casData.jwt, undefined);
      });
    });

    describe('page', function() {
      beforeEach(function() {
        analytics.spy(window.CastleSegment, 'page');
      });

      it('should call Castle#page', function() {
        analytics.page('Category', 'Name', {
          title: 'Test',
          url: 'http://localhost:9876/context.html',
          referrer: 'http://localhost:9876/context2.html'
        });
        analytics.called(window.CastleSegment.page, {
          user: undefined,
          url: 'http://localhost:9876/context.html',
          name: 'Name',
          referrer: 'http://localhost:9876/context2.html'
        });
      });

      it('should call Castle#page after identify', function() {
        analytics.identify('123', { email: 'test@segment.com' });
        analytics.page('Category', 'Name', {
          title: 'Title',
          url: 'http://localhost:9876/context.html',
          referrer: 'http://localhost:9876/context2.html'
        });
        analytics.called(window.CastleSegment.page, {
          user: { id: '123', email: 'test@segment.com', traits: {} },
          url: 'http://localhost:9876/context.html',
          name: 'Name',
          referrer: 'http://localhost:9876/context2.html'
        });
      });
    });

    describe('track', function() {
      beforeEach(function() {
        analytics.spy(window.CastleSegment, 'custom');
      });

      it('should call Castle#custom', function() {
        var eventName = 'Event';
        var eventProperties = { prop: true };
        analytics.track(eventName, eventProperties);
        analytics.called(window.CastleSegment.custom, {
          user: undefined,
          name: eventName,
          properties: eventProperties
        });
      });

      it('should call Castle#custom after identify', function() {
        var eventName = 'Event';
        var eventProperties = { prop: true };
        analytics.identify('123', { email: 'test@segment.com' });
        analytics.track(eventName, eventProperties);
        analytics.called(window.CastleSegment.custom, {
          user: { id: '123', email: 'test@segment.com', traits: {} },
          name: eventName,
          properties: eventProperties
        });
      });

      it('should call Castle#custom after identify with createdAt as seconds number', function() {
        var eventName = 'Event';
        analytics.identify('123', {
          email: 'test@segment.com',
          createdAt: '1648215849',
          sample_abc: 'abc'
        });
        analytics.track(eventName);
        analytics.called(window.CastleSegment.custom, {
          user: {
            id: '123',
            email: 'test@segment.com',
            registered_at: '2022-03-25T13:44:09.000Z',
            traits: { sample_abc: 'abc' }
          },
          name: eventName,
          properties: {}
        });
      });

      it('should call Castle#custom after identify with created_at as string', function() {
        var eventName = 'Event';
        analytics.identify('123', {
          email: 'test@segment.com',
          created_at: 'Fri Mar 25 2022 14:45:06 GMT+0100'
        });
        analytics.track(eventName);
        analytics.called(window.CastleSegment.custom, {
          user: {
            id: '123',
            email: 'test@segment.com',
            registered_at: '2022-03-25T13:45:06.000Z',
            traits: {}
          },
          name: eventName,
          properties: {}
        });
      });

      it('should call Castle#custom after identify with registered_at as milliseconds', function() {
        var eventName = 'Event';
        analytics.identify('123', {
          email: 'test@segment.com',
          registeredAt: '1648215962260'
        });
        analytics.track(eventName);
        analytics.called(window.CastleSegment.custom, {
          user: {
            id: '123',
            email: 'test@segment.com',
            registered_at: '2022-03-25T13:46:02.260Z',
            traits: {}
          },
          name: eventName,
          properties: {}
        });
      });

      it('should call Castle#custom after identify with registered_at as isoString and createdAt', function() {
        var eventName = 'Event';
        analytics.identify('123', {
          phone: '+1-212-456-7890',
          registeredAt: '2022-03-25T13:47:08.310Z',
          createdAt: 1641216053686
        });
        analytics.track(eventName);
        analytics.called(window.CastleSegment.custom, {
          user: {
            id: '123',
            phone: '+1-212-456-7890',
            registered_at: '2022-03-25T13:47:08.310Z',
            traits: { createdAt: 1641216053686 }
          },
          name: eventName,
          properties: {}
        });
      });

      it('should call Castle#custom after identify with registered_at is invalid', function() {
        var eventName = 'Event';
        analytics.identify('123', {
          registeredAt: false,
          createdAt: 'a'
        });
        analytics.track(eventName);
        analytics.called(window.CastleSegment.custom, {
          user: {
            id: '123',
            traits: { registeredAt: false, createdAt: 'a' }
          },
          name: eventName,
          properties: {}
        });
      });

      it('should call Castle#custom after identify with proper address', function() {
        var eventName = 'Event';
        analytics.identify('123', {
          email: 'test@segment.com',
          createdAt: '1648215849',
          address: {
            country: 'US',
            street: '100 California Street Suite',
            line2: '700',
            state: 'CA',
            postalCode: '94111',
            city: 'San Francisco'
          }
        });
        analytics.track(eventName);
        analytics.called(window.CastleSegment.custom, {
          user: {
            id: '123',
            email: 'test@segment.com',
            registered_at: '2022-03-25T13:44:09.000Z',
            address: {
              country_code: 'US',
              line1: '100 California Street Suite',
              line2: '700',
              region_code: 'CA',
              postal_code: '94111',
              city: 'San Francisco'
            },
            traits: {}
          },
          name: eventName,
          properties: {}
        });
      });

      it('should call Castle#custom after identify with address as string', function() {
        var eventName = 'Event';
        analytics.identify('123', {
          email: 'test@segment.com',
          createdAt: '1648215849',
          address: '100 California Street Suite 700, San Francisco CA 94111'
        });
        analytics.track(eventName);
        analytics.called(window.CastleSegment.custom, {
          user: {
            id: '123',
            email: 'test@segment.com',
            registered_at: '2022-03-25T13:44:09.000Z',
            traits: {
              address: '100 California Street Suite 700, San Francisco CA 94111'
            }
          },
          name: eventName,
          properties: {}
        });
      });

      it('should call Castle#custom after identify with proper address but with no country code', function() {
        var eventName = 'Event';
        analytics.identify('123', {
          email: 'test@segment.com',
          createdAt: '1648215849',
          address: {
            country: 'France',
            street: '100 California Street Suite',
            line2: '700',
            state: 'CA',
            postalCode: '94111',
            city: 'San Francisco'
          }
        });
        analytics.track(eventName);
        analytics.called(window.CastleSegment.custom, {
          user: {
            id: '123',
            email: 'test@segment.com',
            registered_at: '2022-03-25T13:44:09.000Z',
            traits: {
              address: {
                country: 'France',
                street: '100 California Street Suite',
                line2: '700',
                state: 'CA',
                postalCode: '94111',
                city: 'San Francisco'
              }
            }
          },
          name: eventName,
          properties: {}
        });
      });
    });
  });
});
