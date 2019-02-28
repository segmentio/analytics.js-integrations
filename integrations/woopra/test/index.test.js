'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Woopra = require('../lib/');

describe('Woopra', function() {
  var analytics;
  var woopra;
  var options = {
    domain: 'x',
    outgoingTracking: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    woopra = new Woopra(options);
    analytics.use(Woopra);
    analytics.use(tester);
    analytics.add(woopra);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    woopra.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Woopra, integration('Woopra')
      .global('woopra')
      .option('domain', '')
      .option('cookieName', 'wooTracker')
      .option('cookieDomain', null)
      .option('cookiePath', '/')
      .option('ping', true)
      .option('pingInterval', 12000)
      .option('idleTimeout', 300000)
      .option('downloadTracking', true)
      .option('outgoingTracking', true)
      .option('outgoingIgnoreSubdomain', true)
      .option('downloadPause', 200)
      .option('outgoingPause', 400)
      .option('ignoreQueryUrl', true)
      .option('hideCampaign', false));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(woopra, 'load');
    });

    describe('#initialize', function() {
      it('should create a woopra object', function() {
        analytics.assert(!window.woopra);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.woopra);
      });

      it('should configure woopra', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window.woopra._e, [
          ['config', 'domain', 'x'],
          ['config', 'outgoing_tracking', false],
          ['config', 'cookie_name', 'wooTracker'],
          ['config', 'cookie_path', '/'],
          ['config', 'ping', true],
          ['config', 'ping_interval', 12000],
          ['config', 'idle_timeout', 300000],
          ['config', 'download_tracking', true],
          ['config', 'outgoing_ignore_subdomain', true],
          ['config', 'download_pause', 200],
          ['config', 'outgoing_pause', 400],
          ['config', 'ignore_query_url', true],
          ['config', 'hide_campaign', false]
        ]);
      });

      it('should not send options if they are null, or empty', function() {
        woopra.options.domain = '';
        woopra.options.cookieName = '';
        woopra.options.cookiePath = null;
        woopra.options.ping = null;
        woopra.options.pingInterval = null;
        woopra.options.idleTimeout = null;
        woopra.options.downloadTracking = null;
        woopra.options.outgoingTracking = null;
        woopra.options.outgoingIgnoreSubdomain = null;
        woopra.options.downloadPause = '';
        woopra.options.outgoingPause = '';
        woopra.options.ignoreQueryUrl = null;
        woopra.options.hideCampaign = null;
        analytics.initialize();
        analytics.page();
        analytics.deepEqual([], window.woopra._e);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(woopra.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(woopra, done);
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
        analytics.stub(window.woopra, 'track');
      });

      it('should send a page view', function() {
        analytics.page();
        analytics.called(window.woopra.track, 'pv', {
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: window.location.search,
          url: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname
        });
      });

      it('should send a title', function() {
        analytics.page({ title: 'title' });
        analytics.called(window.woopra.track, 'pv', {
          title: 'title',
          path: window.location.pathname,
          referrer: document.referrer,
          search: window.location.search,
          url: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname
        });
      });

      it('should prefer a name', function() {
        analytics.page('name', { title: 'title' });
        analytics.called(window.woopra.track, 'pv', {
          title: 'name',
          name: 'name',
          path: window.location.pathname,
          referrer: document.referrer,
          search: window.location.search,
          url: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname
        });
      });

      it('should prefer a category and name', function() {
        analytics.page('category', 'name', { title: 'title' });
        analytics.called(window.woopra.track, 'pv', {
          title: 'category name',
          category: 'category',
          name: 'name',
          path: window.location.pathname,
          referrer: document.referrer,
          search: window.location.search,
          url: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.woopra, 'identify');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.woopra.identify, { id: 'id' });
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.woopra.identify, { trait: true });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.woopra.identify, { id: 'id', trait: true });
      });

      it('should alias the name properly', function() {
        analytics.identify('id', {
          firstName: 'firstName',
          lastName: 'lastName'
        });
        analytics.called(window.woopra.identify, {
          name: 'firstName lastName',
          firstName: 'firstName',
          lastName: 'lastName',
          id: 'id'
        });
      });

      it('should should convert trait dates to unix timestamp in milliseconds', function() {
        analytics.identify('id', { testdate: '2015-11-04T09:20:22Z' });
        analytics.called(window.woopra.identify, { id: 'id', testdate: 1446628822000 });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.woopra, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.woopra.track, 'event');
      });

      it('should send properties', function() {
        analytics.track('event', { property: 'Property' });
        analytics.called(window.woopra.track, 'event', { property: 'Property' });
      });

      it('should stringify nested objects', function() {
        analytics.track('event', {
          products: [
            {
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition'
            },
            {
              sku: '46493-32',
              name: 'Uno Card Game'
            }
          ],
          orderId: 1
        });
        analytics.called(window.woopra.track, 'event', { products: '[{"sku":"45790-32","name":"Monopoly: 3rd Edition"},{"sku":"46493-32","name":"Uno Card Game"}]', orderId: 1 });
      });
    });
  });
});
