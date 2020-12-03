'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var is = require('is');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Lou = require('../lib/');

var noop = function() {};

describe('Lou', function() {
  var analytics;
  var lou;
  var options = {
    apiKey: 'AvyQ4N2p-FOb5ceEb3w0RT-segment-integration'
  };

  beforeEach(function() {
    analytics = new Analytics();
    lou = new Lou(options);
    analytics.use(Lou);
    analytics.use(tester);
    analytics.add(lou);

    analytics.user().anonymousId('anon-id');
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    lou.reset();
    analytics.user().reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Lou,
      integration('Lou')
        .readyOnInitialize()
        .readyOnLoad()
        .global('LOU')
        .option('organizationId', null)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(lou, 'load');
    });

    describe('#initialize', function() {
      beforeEach(function() {
        analytics.initialize();
        analytics.page();
      });

      it('should add the account token', function() {
        analytics.assert.equal(window.chmln.accountToken, options.apiKey);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(lou.load);
      });

      it('should be ready', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(lou.ready);
      });

      it('should create window.LOU', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(is.object(window.LOU));
      });

      it('should create window.LOU.identify', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(is.fn(window.LOU.identify));
      });

      it('should create window.LOU.track', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(is.fn(window.LOU.track));
      });
    });

    describe('when lou is already on the page', function() {
      beforeEach(function() {
        window.LOU = {};

        analytics.initialize();
        analytics.page();
      });

      it('should continue as normal', function() {
        analytics.called(lou.load);
        analytics.called(lou.ready);
      });
    });
  });

  describe('before loaded', function() {
    beforeEach(function() {
      lou.load = noop;
      analytics.initialize();
      analytics.page();
    });

    describe('on identify', function() {
      beforeEach(function() {
        analytics.identify('id');
      });

      it('should store the identify', function() {
        analytics.assert.equal(
          Array.prototype.slice.call(window.chmln.identify_a).length,
          1
        );
        analytics.assert.equal('id', window.chmln.identify_a[0][0]);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(lou, done);
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
        analytics.spy(window.LOU, 'identify');
      });

      it('should identify with no id', function() {
        analytics.identify();
        analytics.called(window.LOU.identify, null, {});
      });

      it('should identify with the given id', function() {
        analytics.identify('id');
        analytics.called(window.LOU.identify, 'id');
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.LOU.identify, null, { trait: true });
      });

      it('should send the given id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.LOU.identify, 'id', { trait: true });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.LOU, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.LOU.track, 'event');
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.LOU.track, 'event', { property: true });
      });
    });
  });
});
