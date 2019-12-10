'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Blueshift = require('../lib/');

describe('Blueshift', function() {
  var analytics;
  var bsft;
  var options = {
    apiKey: 'x',
    retarget: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    bsft = new Blueshift(options);
    analytics.use(Blueshift);
    analytics.use(tester);
    analytics.add(bsft);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    bsft.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Blueshift, integration('Blueshift')
      .global('blueshift')
      .global('_blueshiftid', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(bsft, 'load');
    });

    describe('#initialize', function() {
      it('should create the window.blueshift object', function() {
        analytics.assert(!window.blueshift);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.blueshift);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(bsft.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(bsft, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.blueshift, 'retarget');
        analytics.stub(window.blueshift, 'pageload');
      });

      it('should track all pages', function() {
        analytics.page('Category', 'Page Name');
        analytics.didNotCall(window.blueshift.retarget);
        analytics.called(window.blueshift.pageload);
      });

      it('should call retarget on page event, if enabled', function() {
        bsft.options.retarget = true;
        analytics.page('Category', 'Page Name');
        analytics.called(window.blueshift.retarget);
        analytics.called(window.blueshift.pageload);
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.blueshift, 'identify');
      });

      it('should send anonymousId', function() {
        analytics.identify();
        analytics.called(window.blueshift.identify, {
          _bsft_source: 'segment.com',
          anonymousId: analytics.user().anonymousId()
        });
      });

      it('should send id', function() {
        analytics.identify('id');
        analytics.called(window.blueshift.identify, {
          id: 'id',
          customer_id: 'id',
          _bsft_source: 'segment.com',
          anonymousId: analytics.user().anonymousId()
        });
      });

      it('should send traits', function() {
        analytics.identify({ trait: true, firstName: 'han', lastName: 'kim' });
        analytics.called(window.blueshift.identify, {
          trait: true,
          firstname: 'han',
          lastname: 'kim',
          _bsft_source: 'segment.com',
          anonymousId: analytics.user().anonymousId()
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.blueshift, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.blueshift.track, 'event', {
          _bsft_source: 'segment.com',
          anonymousId: analytics.user().anonymousId()
        });
      });
      it('should send an event with properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.blueshift.track, 'event', {
          _bsft_source: 'segment.com',
          anonymousId: analytics.user().anonymousId(),
          property: true
        });
      });
      it('should send an event with customer_id', function() {
        analytics.identify('123');
        analytics.track('event');
        analytics.called(window.blueshift.track, 'event', {
          _bsft_source: 'segment.com',
          customer_id: '123',
          anonymousId: analytics.user().anonymousId()
        });
      });
    });

    describe('#alias', function() {
      beforeEach(function() {
        analytics.stub(window.blueshift, 'track');
        analytics.stub(window.blueshift, 'alias');
      });

      it('should send new id', function() {
        analytics.alias('new');
        analytics.called(window.blueshift.track, 'alias', {
          _bsft_source: 'segment.com',
          customer_id: 'new',
          anonymousId: analytics.user().anonymousId()
        });
      });

      it('should send new & old id', function() {
        analytics.alias('new', 'old');
        analytics.called(window.blueshift.track, 'alias', {
          _bsft_source: 'segment.com',
          customer_id: 'new',
          previous_customer_id: 'old',
          anonymousId: analytics.user().anonymousId()
        });
      });
    });
  });
});
