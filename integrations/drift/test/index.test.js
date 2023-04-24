'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Drift = require('../lib/');

describe('Drift', function() {
  var analytics;
  var drift;
  var options = {
    embedId: 'buvw2r8z43np-dev'
  };

  beforeEach(function() {
    analytics = new Analytics();
    drift = new Drift(options);
    analytics.use(Drift);
    analytics.use(tester);
    analytics.add(drift);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    drift.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Drift, integration('Drift')
      .global('drift')
      .option('embedId', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(drift, 'load');
    });

    describe('#initialize', function() {
      it('should create the window.drift object', function() {
        analytics.assert(!window.drift);
        analytics.initialize();
        analytics.assert(window.drift);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(drift.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(drift, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.drift, 'identify');
      });

      it('should send an id without an email', function() {
        analytics.identify('id');
        analytics.called(window.drift.identify, 'id');
      });

      it('should send an id with an email', function() {
        analytics.identify('id', { email: 'blackwidow@shield.gov' });
        analytics.called(window.drift.identify, 'id', { email: 'blackwidow@shield.gov' });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { email: 'blackwidow@shield.gov' });
        analytics.called(window.drift.identify, 'id', { email: 'blackwidow@shield.gov' });
      });

      it('should send id, traits and integration options', function() {
        analytics.identify(
          'id',
          { email: 'blackwidow@shield.gov' },
          { drift: { signedIdentity: 'signedidentityjwt' } }
        );

        analytics.called(
          window.drift.identify,
          'id',
          { email: 'blackwidow@shield.gov' },
          { signedIdentity: 'signedidentityjwt' }
        );
      });

      it('should send only integration options for drift', function() {
        analytics.identify(
          'id',
          { email: 'blackwidow@shield.gov' },
          { otherintegration: { option: '123' }, drift: { option: 'test' } }
        );

        analytics.called(window.drift.identify, 'id', { email: 'blackwidow@shield.gov' }, { option: 'test' });
      });

      it('should send empty object as integration options if they are undefined', function() {
        analytics.identify(
          'id',
          { email: 'blackwidow@shield.gov' },
          { otherintegration: { option: '123' }, drift: undefined }
        );

        analytics.called(window.drift.identify, 'id', { email: 'blackwidow@shield.gov' }, {});
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.drift, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.drift.track, 'event');
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.drift.track, 'event', { property: true });
      });

      it('should convert dates to unix timestamps', function() {
        var date = new Date();
        analytics.track('event', { date: date });
        analytics.called(window.drift.track, 'event', { date: Math.floor(date / 1000) });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.drift, 'page');
        analytics.stub(window.drift, 'identify');
      });

      it('should send a page view event but not an identify event', function() {
        // track a page view
        analytics.page('page');

        analytics.called(window.drift.page, 'page');
        analytics.didNotCall(window.drift.identify);
      });

      it('should send an page view event but only one identify event', function() {
        // set the user id by calling identify
        analytics.identify('id');
        analytics.calledOnce(window.drift.identify);

        // track a page view
        analytics.page('page');

        analytics.called(window.drift.page, 'page');
        analytics.calledOnce(window.drift.identify);
      });

      it('should send a page view event and an identify event', function() {
        // set the user id explicitly
        analytics.user().id('id');

        // track a page view
        analytics.page('page');

        analytics.called(window.drift.page, 'page');
        analytics.calledOnce(window.drift.identify, 'id');
      });
    });
  });
});
