'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var GTM = require('../lib/');

describe('Google Tag Manager', function() {
  var analytics;
  var gtm;
  var options = {
    containerId: 'GTM-M8M29T',
    environment: ''
  };

  beforeEach(function() {
    analytics = new Analytics();
    gtm = new GTM(options);
    analytics.use(GTM);
    analytics.use(tester);
    analytics.add(gtm);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    gtm.reset();
    sandbox();
  });

  it('should store the correct settings', function() {
    analytics.compare(GTM, integration('Google Tag Manager')
      .global('dataLayer')
      .option('containerId', '')
      .option('environment', '')
      .option('trackNamedPages', true)
      .option('trackCategorizedPages', true));
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(gtm, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      options = {
        containerId: 'GTM-M8M29T',
        environment: ''
      };
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should push initial gtm.start event', function() {
      var dl = window.dataLayer;
      analytics.assert(dl);
      analytics.assert(dl[0].event === 'gtm.js');
      analytics.assert(typeof dl[0]['gtm.start'] === 'number');
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.dataLayer, 'push');
      });

      it('should send event', function() {
        var anonId = analytics.user().anonymousId();
        analytics.track('some-event');
        analytics.called(window.dataLayer.push, { segmentAnonymousId: anonId, event: 'some-event' });
      });

      it('should send userId if it exists', function() {
        analytics.user().id('pablo');
        var anonId = analytics.user().anonymousId();
        analytics.track('some-event');
        analytics.called(window.dataLayer.push, { segmentAnonymousId: anonId, userId: 'pablo', event: 'some-event' });
      });

      it('should send anonymousId if it exists', function() {
        analytics.user().anonymousId('el');
        analytics.track('stranger things');
        analytics.called(window.dataLayer.push, { segmentAnonymousId: 'el', event: 'stranger things' });
      });

      it('should send event with properties', function() {
        var anonId = analytics.user().anonymousId();
        analytics.track('event', { prop: true });
        analytics.called(window.dataLayer.push, { segmentAnonymousId: anonId, event: 'event', prop: true });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.dataLayer, 'push');
      });

      it('should not track unamed pages by default', function() {
        analytics.page();
        analytics.didNotCall(window.dataLayer.push);
      });

      it('should track unamed pages if enabled', function() {
        gtm.options.trackAllPages = true;
        var anonId = analytics.user().anonymousId();
        analytics.page();
        analytics.called(window.dataLayer.push, {
          event: 'Loaded a Page',
          segmentAnonymousId: anonId,
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: window.location.search,
          url: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname
        });
      });

      it('should track named pages by default', function() {
        var anonId = analytics.user().anonymousId();
        analytics.page('Name');
        analytics.called(window.dataLayer.push, {
          event: 'Viewed Name Page',
          segmentAnonymousId: anonId,
          name: 'Name',
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: window.location.search,
          url: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname
        });
      });

      it('should track named pages with a category added', function() {
        var anonId = analytics.user().anonymousId();
        analytics.page('Category', 'Name');
        analytics.called(window.dataLayer.push, {
          event: 'Viewed Category Name Page',
          segmentAnonymousId: anonId,
          category: 'Category',
          name: 'Name',
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: window.location.search,
          url: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname
        });
      });

      it('should track categorized pages by default', function() {
        var anonId = analytics.user().anonymousId();
        analytics.page('Category', 'Name');
        analytics.called(window.dataLayer.push, {
          event: 'Viewed Category Name Page',
          category: 'Category',
          segmentAnonymousId: anonId,
          name: 'Name',
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: window.location.search,
          url: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname
        });
      });

      it('should not track name or categorized pages if disabled', function() {
        gtm.options.trackNamedPages = false;
        gtm.options.trackCategorizedPages = false;
        analytics.page('Name');
        analytics.page('Category', 'Name');
        analytics.didNotCall(window.dataLayer.push);
      });
    });
  });

  describe('environment options', function() {
    it('should use the right tag if the environment option is set', function() {
      gtm.options = {
        containerId: 'GTM-M8M29T',
        environment: 'test'
      };

      var tag = '<script src="http://www.googletagmanager.com/gtm.js?id=' + gtm.options.containerId + '&l=dataLayer&gtm_preview=' + gtm.options.environment + '">';
      analytics.spy(gtm, 'load');
      analytics.initialize();
      analytics.page();
      analytics.loaded(tag);
    });
  });
});
