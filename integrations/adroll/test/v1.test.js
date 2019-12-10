'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var AdRoll = require('../lib/');

describe('AdRoll - v1', function() {
  var adroll;
  var analytics;
  var options = {
    advId: 'FSQJWMMZ2NEAZH6XWKVCNO',
    pixId: 'N6HGWT4ALRDRXCAO5PLTB6',
    _version: 1,
    events: {
      'Order Canceled': 'ordCancel',
      'Order Created': 'conversion'
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

      it('should track a named page', function() {
        analytics.page('Home', {
          path: window.location.pathname,
          referrer: window.document.referrer,
          search: window.location.search,
          title: window.document.title,
          url: window.location.href
        });
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'viewed_home_page',
          name: 'Home',
          path: window.location.pathname,
          referrer: window.document.referrer,
          search: window.location.search,
          title: window.document.title,
          url: window.location.href
        });
        analytics.calledOnce(window.__adroll.record_user);
      });

      it('should track a named and categorized page page', function() {
        analytics.page('Home', 'Index', {
          path: window.location.pathname,
          referrer: window.document.referrer,
          search: window.location.search,
          title: window.document.title,
          url: window.location.href
        });
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'viewed_home_index_page',
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

      it('should track an unnamed page', function() {
        analytics.page({
          path: window.location.pathname,
          referrer: window.document.referrer,
          search: window.location.search,
          title: window.document.title,
          url: window.location.href
        });
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'loaded_a_page',
          path: window.location.pathname,
          referrer: window.document.referrer,
          search: window.location.search,
          title: window.document.title,
          url: window.location.href
        });
        analytics.calledOnce(window.__adroll.record_user);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.__adroll, 'record_user');
      });

      it('should track a mapped event', function() {
        analytics.track('Order Created', {});
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'conversion'
        });
        analytics.calledOnce(window.__adroll.record_user);
      });

      it('should convert mapped segment names to snake case', function() {
        analytics.track('Order Canceled', {});
        analytics.assert(options.events['Order Canceled'] !== 'order_canceled');
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'ord_cancel'
        });
        analytics.calledOnce(window.__adroll.record_user);
      });

      it('should send an event when no mapping is found, using the snakized event name as the segment', function() {
        analytics.track('Promotion Clicked', {});
        analytics.assert(options.events['Promotion Clicked'] === undefined);
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'promotion_clicked'
        });
        analytics.calledOnce(window.__adroll.record_user);
      });

      it('should not send a fallback event when a mapping is found', function() {
        analytics.track('Order Canceled', {});
        analytics.assert(options.events['Order Canceled'] !== undefined);
        analytics.called(window.__adroll.record_user, {
          adroll_segments: 'ord_cancel'
        });
        analytics.didNotCall(window.__adroll.record_user, {
          adroll_segments: 'order_canceled'
        });
        analytics.calledOnce(window.__adroll.record_user);
      });
    });
  });
});
