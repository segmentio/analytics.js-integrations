'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var AdRoll = require('../lib');

describe('AdRoll - v2', function() {
  var adroll;
  var analytics;
  var options = {
    advId: 'FSQJWMMZ2NEAZH6XWKVCNO',
    pixId: 'N6HGWT4ALRDRXCAO5PLTB6',
    _version: 2,
    events: {
      'Viewed Home Page': 'zi2b9e01',
      'Viewed Home Index Page': 'Jxp3fGpw',
      'Order Completed': 'f21vVsxY'
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    adroll = new AdRoll(options);
    analytics.use(AdRoll);
    analytics.use(tester);
    analytics.add(adroll);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    adroll.reset();
    sandbox();
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.__adroll, 'record_user');
      });

      it('should send a mapped named page', function() {
        analytics.page('Home', {
          path: window.location.pathname,
          referrer: window.document.referrer,
          search: window.location.search,
          title: window.document.title,
          url: window.location.href
        });
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'zi2b9e01',
          name: 'Home',
          path: window.location.pathname,
          referrer: window.document.referrer,
          search: window.location.search,
          title: window.document.title,
          url: window.location.href
        });
        analytics.calledOnce(window.__adroll.record_user);
      });

      it('should send a mapped named and categorized page', function() {
        analytics.page('Home', 'Index', {
          path: window.location.pathname,
          referrer: window.document.referrer,
          search: window.location.search,
          title: window.document.title,
          url: window.location.href
        });
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'Jxp3fGpw',
          category: 'Home',
          name: 'Index',
          path: window.location.pathname,
          referrer: window.document.referrer,
          search: window.location.search,
          title: window.document.title,
          url: window.location.href
        });
        analytics.calledOnce(window.__adroll.record_user);
      });

      it('should not send an unmapped page', function() {
        analytics.page('Nonexistent', { url: 'http://localhost:34448/test/' });
        analytics.didNotCall(window.__adroll.record_user);
      });

      it('should not send an unnamed page', function() {
        analytics.page({ url: 'http://localhost:34448/test/' });
        analytics.didNotCall(window.__adroll.record_user);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.__adroll, 'record_user');
      });

      it('should send a mapped event', function() {
        analytics.track('Order Completed', { revenue: 17.38 });
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'f21vVsxY',
          adroll_conversion_value: 17.38
        });
        analytics.calledOnce(window.__adroll.record_user);
      });

      it('should map currency', function() {
        analytics.track('Order Completed', { revenue: 17.38, currency: 'CAD' });
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'f21vVsxY',
          adroll_conversion_value: 17.38,
          adroll_currency: 'CAD'
        });
        analytics.calledOnce(window.__adroll.record_user);
      });

      it('should not send an unmapped event', function() {
        analytics.track('Nonexistent', {});
        analytics.didNotCall(window.__adroll.record_user);
      });
    });
  });
});
