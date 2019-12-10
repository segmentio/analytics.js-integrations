'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Autosend = require('../lib/');

describe('Autosend', function() {
  var analytics;
  var autosend;
  var options = {
    appKey: '7677b3b8a09744c9ba8bcef3fac82fe2'
  };

  beforeEach(function() {
    analytics = new Analytics();
    autosend = new Autosend(options);
    analytics.use(Autosend);
    analytics.use(tester);
    analytics.add(autosend);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    autosend.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Autosend, integration('Autosend')
      .global('_autosend')
      .option('appKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(autosend, 'load');
    });

    describe('#initialize', function() {
      it('should create window._autosend object', function() {
        analytics.assert(!window._autosend);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._autosend);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(autosend.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(autosend, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._autosend, 'identify');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window._autosend.identify, { id: 'id' });
      });

      it('shouldnt send without an id', function() {
        analytics.identify({ trait: true });
        analytics.didNotCall(window._autosend.identify);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window._autosend.identify, { id: 'id', trait: true });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._autosend, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._autosend.track, 'event');
      });
    });
  });
});
