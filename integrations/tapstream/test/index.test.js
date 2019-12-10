'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Tapstream = require('../lib/');

describe('Tapstream', function() {
  var tapstream;
  var analytics;
  var options = {
    accountName: 'tapstreamTestAccount'
  };

  beforeEach(function() {
    analytics = new Analytics();
    tapstream = new Tapstream(options);
    analytics.use(Tapstream);
    analytics.use(tester);
    analytics.add(tapstream);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    tapstream.reset();
    sandbox();
  });

  it('should store the right settings', function() {
    analytics.compare(Tapstream, integration('Tapstream')
      .assumesPageview()
      .global('_tsq')
      .option('accountName', '')
      .option('trackAllPages', true)
      .option('trackNamedPages', true));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(tapstream, 'load');
    });

    describe('#initialize', function() {
      it('should push setAccount name onto window._tsq', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._tsq[0], ['setAccountName', options.accountName]);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(tapstream.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(tapstream, done);
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
        analytics.stub(window._tsq, 'push');
      });

      it('should track all pages by default', function() {
        analytics.page();
        analytics.called(window._tsq.push, ['fireHit', 'loaded-a-page', [window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname]]);
      });

      it('should track named pages by default', function() {
        analytics.page('Name');
        analytics.called(window._tsq.push, ['fireHit', 'viewed-name-page', [window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname]]);
      });

      it('should track named pages with a category', function() {
        analytics.page('Category', 'Name');
        analytics.called(window._tsq.push, ['fireHit', 'viewed-category-name-page', [window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname]]);
      });

      it('should track categorized pages by default', function() {
        analytics.page('Category', 'Name');
        analytics.called(window._tsq.push, ['fireHit', 'viewed-category-page', [window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname]]);
      });

      it('should not track any pages if the options are off', function() {
        tapstream.options.trackAllPages = false;
        tapstream.options.trackNamedPages = false;
        tapstream.options.trackCategorizedPages = false;
        analytics.page('Name');
        analytics.page('Category', 'Name');
        analytics.didNotCall(window._tsq.push);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._tsq, 'push');
      });

      it('should send an event as a slug', function() {
        analytics.track('Event');
        analytics.called(window._tsq.push, ['fireHit', 'event', [undefined]]);
      });
    });
  });
});
