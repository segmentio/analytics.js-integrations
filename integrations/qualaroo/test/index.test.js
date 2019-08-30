'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Qualaroo = require('../lib/');

describe('Qualaroo', function() {
  var analytics;
  var qualaroo;
  var options = {
    customerId: '48090',
    siteToken: 'eUg'
  };

  beforeEach(function() {
    analytics = new Analytics();
    qualaroo = new Qualaroo(options);
    analytics.use(Qualaroo);
    analytics.use(tester);
    analytics.add(qualaroo);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    qualaroo.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Qualaroo, integration('Qualaroo')
      .assumesPageview()
      .global('_kiq')
      .option('customerId', '')
      .option('siteToken', '')
      .option('track', false));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(qualaroo, 'load');
    });

    describe('#initialize', function() {
      it('should create window._kiq', function() {
        analytics.assert(!window._kiq);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._kiq);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(qualaroo.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(qualaroo, done);
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
        analytics.stub(window._kiq, 'push');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window._kiq.push, ['identify', 'id']);
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window._kiq.push, ['set', { trait: true }]);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window._kiq.push, ['identify', 'id']);
        analytics.called(window._kiq.push, ['set', { trait: true, id: 'id' }]);
      });

      it('should prefer an email', function() {
        analytics.identify('id', { email: 'name@example.com' });
        analytics.called(window._kiq.push, ['identify', 'name@example.com']);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._kiq, 'push');
      });

      it('should not send anything by default', function() {
        analytics.track('event');
        analytics.didNotCall(window._kiq.push);
      });

      it('should set an event trait', function() {
        qualaroo.options.track = true;
        analytics.track('event');
        analytics.called(window._kiq.push, ['set', { 'Triggered: event': true }]);
      });
    });
  });
});
