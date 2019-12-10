
'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Outbound = require('../lib/');

describe('Outbound', function() {
  var analytics;
  var outbound;
  var options = {
    publicApiKey: 'pub-9cb1d6e54b003d5274e54a483ef741be',
    trackReferrer: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    outbound = new Outbound(options);
    analytics.use(Outbound);
    analytics.use(tester);
    analytics.add(outbound);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    outbound.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Outbound, integration('Outbound')
      .global('outbound')
      .option('publicApiKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(outbound, 'load');
    });

    describe('#initialize', function() {
      it('should create initialize outbound', function() {
        analytics.assert(!window.outbound);
        analytics.initialize();
        analytics.assert(window.outbound);
      });

      it('should extend window.outbound with methods', function() {
        analytics.initialize();
        var methods = [
          'identify',
          'track',
          'registerApnsToken',
          'registerGcmToken',
          'disableApnsToken',
          'disableGcmToken',
          'hasIdentified'
        ];
        for (var i = 0; i < methods.length; i++) {
          analytics.assert(window.outbound.hasOwnProperty(methods[i]));
        }
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(outbound.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(outbound, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.outbound, 'identify');
      });

      it('should send traits as attributes', function() {
        var testTraits = {
          email: 'testing@outbound.io',
          firstName: 'test',
          lastName: 'user',
          phone: '+14155551234',
          username: 'testUser',
          genericTrait: 'traitValue'
        };
        var attributes = {
          email: 'testing@outbound.io',
          firstName: 'test',
          lastName: 'user',
          phoneNumber: '+14155551234',
          attributes: {
            username: 'testUser',
            genericTrait: 'traitValue'
          }
        };

        analytics.identify('user123', testTraits);
        analytics.called(window.outbound.identify, 'user123', attributes);
      });

      it('should send omit top-level traits from attributes', function() {
        var testTraits = {
          Email: 'testing@outbound.io',
          FirstName: 'test',
          lastName: 'user',
          phone: '+14155551234',
          username: 'testUser',
          genericTrait: 'traitValue'
        };
        var attributes = {
          email: 'testing@outbound.io',
          firstName: 'test',
          lastName: 'user',
          phoneNumber: '+14155551234',
          attributes: {
            username: 'testUser',
            genericTrait: 'traitValue'
          }
        };

        analytics.identify('user123', testTraits);
        analytics.called(window.outbound.identify, 'user123', attributes);
      });

      it('should accept anonymousId', function() {
        var anonymousId = 'anonymousId';
        analytics.identify(anonymousId);
        analytics.called(window.outbound.identify, anonymousId);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        // adding fake cookie for user identification
        var date = new Date();
        date.setTime(date.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days
        document.cookie = '_ob_' + options.publicApiKey + '=user123; expires=' + date.toGMTString() + '; path=/;';
        analytics.stub(window.outbound, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.outbound.track, 'event');
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.outbound.track, 'event', { property: true });
      });
    });

    describe('#alias', function() {
      beforeEach(function() {
        analytics.stub(window.outbound, 'identify');
      });

      it('should alias a user', function() {
        analytics.alias('user123', 'actualUserId');
        analytics.called(window.outbound.identify, 'user123', { previousId: 'actualUserId' });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        // adding fake cookie for user identification
        var date = new Date();
        date.setTime(date.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days
        document.cookie = '_ob_' + options.publicApiKey + '=user123; expires=' + date.toGMTString() + '; path=/;';
        analytics.stub(window.outbound, 'track');
      });

      it('should send a page event', function() {
        analytics.page('event');
        analytics.called(window.outbound.track, '[Segment Page] event', {
          name: 'event',
          path: '/context.html',
          search: '',
          title: '',
          url: 'http://localhost:9876/context.html'
        });
      });

      it('should send an event and properties', function() {
        analytics.page('event', { property: true });
        analytics.called(window.outbound.track, '[Segment Page] event', {
          property: true,
          name: 'event',
          path: '/context.html',
          search: '',
          title: '',
          url: 'http://localhost:9876/context.html'
        });
      });
    });
  });
});
