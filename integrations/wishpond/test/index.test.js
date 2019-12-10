'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
// var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Wishpond = require('../lib');

describe('Wishpond', function() {
  var analytics;
  var wishpond;
  var options = {
    siteId: '696791',
    apiKey: '591bb1914bdf'
  };

  beforeEach(function() {
    analytics = new Analytics();
    wishpond = new Wishpond(options);
    analytics.use(Wishpond);
    analytics.use(tester);
    analytics.add(wishpond);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    // FIXME(ndhoule): window.addEventListener('message', ...) handlers aren't
    // properly being cleaned up in tests and are causing uncaught exceptions.
    // We should capture these events and remove them to prevent uncaught
    // exceptions in the test suite
    // wishpond.reset();
    // sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Wishpond, integration('Wishpond')
      .global('Wishpond')
      .option('siteId', '')
      .option('apiKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(wishpond, 'load');
    });

    describe('#initialize', function() {
      it('should create the window.Wishpond object', function() {
        analytics.assert(!window.Wishpond);
        analytics.initialize();
        analytics.assert(window.Wishpond);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(wishpond.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(wishpond, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.Wishpond.Tracker, 'identify');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.Wishpond.Tracker.identify, 'id', { id: 'id' });
      });

      it('should not send only traits', function() {
        analytics.identify({ trait: true });
        analytics.didNotCall(window.Wishpond.Tracker.identify);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true, email: 'blackwidow@shield.gov' });
        analytics.called(window.Wishpond.Tracker.identify, 'id', { id: 'id', trait: true, email: 'blackwidow@shield.gov' });
      });

      it('should alias createdAt to created_at', function() {
        var date = new Date();
        analytics.identify('id', { createdAt: date });
        analytics.called(window.Wishpond.Tracker.identify, 'id', {
          id: 'id',
          created_at: date
        });
      });

      it('should alias updatedAt to updated_at', function() {
        var date = new Date();
        analytics.identify('id', { updatedAt: date });
        analytics.called(window.Wishpond.Tracker.identify, 'id', {
          id: 'id',
          updated_at: date
        });
      });

      it('should alias firstName to first_name', function() {
        var name = 'Anderson';
        analytics.identify('id', { firstName: name });
        analytics.called(window.Wishpond.Tracker.identify, 'id', {
          id: 'id',
          first_name: name
        });
      });

      it('should alias lastName to last_name', function() {
        var name = 'Saunders';
        analytics.identify('id', { lastName: name });
        analytics.called(window.Wishpond.Tracker.identify, 'id', {
          id: 'id',
          last_name: name
        });
      });

      it('should alias phoneNumber to phone_number', function() {
        var phone = '778 681 7804';
        analytics.identify('id', { phoneNumber: phone });
        analytics.called(window.Wishpond.Tracker.identify, 'id', {
          id: 'id',
          phone_number: phone
        });
      });

      it('should alias leadScore to lead_score', function() {
        var score = 5;
        analytics.identify('id', { leadScore: score });
        analytics.called(window.Wishpond.Tracker.identify, 'id', {
          id: 'id',
          lead_score: score
        });
      });

      it('should not alias notDefault to not_default', function() {
        var value = 'yes';
        analytics.identify('id', { notDefault: value });
        analytics.called(window.Wishpond.Tracker.identify, 'id', {
          id: 'id',
          notDefault: value
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.Wishpond.Tracker, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.Wishpond.Tracker.track, 'event');
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.Wishpond.Tracker.track, 'event', { property: true });
      });
    });
  });
});
