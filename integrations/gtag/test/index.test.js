'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var GTAG = require('../lib/');

describe('Gtag', function() {
  var analytics;
  var gtag;
  var options = {
    GA_WEB_APP_MEASUREMENT_ID: 'G_12345678',
    trackNamedPages: true,
    trackAllPages: false,
    trackCategorizedPages: true,
    sendTo: [],
    gaOptions: {}
  };

  beforeEach(function() {
    analytics = new Analytics();
    gtag = new GTAG(options);
    analytics.use(GTAG);
    analytics.use(tester);
    analytics.add(gtag);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    gtag.reset();
    sandbox();
  });

  it('should store the correct settings', function() {
    analytics.compare(
      GTAG,
      integration('Gtag')
        .global('gtagDataLayer')
        .option('GA_WEB_MEASUREMENT_ID', '')
        .option('GA_WEB_APP_MEASUREMENT_ID', '')
        .option('AW_CONVERSION_ID', '')
        .option('DC_FLOODLIGHT_ID', '')
        .option('trackNamedPages', true)
        .option('trackAllPages', false)
        .option('trackCategorizedPages', true)
        .option('sendTo', [])
        .option('gaOptions', { setAllMappedProps: true })
    );
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(gtag, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      gtag.options = {
        GA_WEB_MEASUREMENT_ID: 'GA_WEB_MEASUREMENT_ID',
        AW_CONVERSION_ID: 'AW_CONVERSION_ID'
      };
      analytics.once('ready', done);
      analytics.initialize();
    });

    it('should set default routing', function() {
      analytics.assert(window.gtagDataLayer[0] === 'config');
      analytics.assert(window.gtagDataLayer[1] === 'GA_WEB_MEASUREMENT_ID');
      analytics.assert(window.gtagDataLayer[2] === 'config');
      analytics.assert(window.gtagDataLayer[3] === 'AW_CONVERSION_ID');
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.gtagDataLayer, 'push');
      });

      it('should call track', function() {
        analytics.track();
        analytics.called(window.gtagDataLayer.push);
      });

      it('should call track with passed event', function() {
        analytics.track('test event');
        analytics.called(window.gtagDataLayer.push, 'event', 'test event', {
          event: 'test event'
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.gtagDataLayer, 'push');
      });

      it('should set user id if GA is configured', function() {
        gtag.options.GA_WEB_MEASUREMENT_ID = 'GA_WEB_MEASUREMENT_ID';
        analytics.identify('userId');
        analytics.called(
          window.gtagDataLayer.push,
          'config',
          'GA_WEB_MEASUREMENT_ID',
          {
            user_id: 'userId'
          }
        );
      });

      it('should not set user id if GA is not configured', function() {
        gtag.options.GA_WEB_MEASUREMENT_ID = '';
        analytics.identify('userId');
        analytics.didNotCall(window.gtagDataLayer.push);
      });

      it('should not set user id if GA is configured but empty user id', function() {
        gtag.options.GA_WEB_MEASUREMENT_ID = 'GA_WEB_MEASUREMENT_ID';
        analytics.identify('');
        analytics.didNotCall(window.gtagDataLayer.push);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.gtagDataLayer, 'push');
      });

      it('should track page', function() {
        gtag.options.trackAllPages = true;
        analytics.page();
        analytics.called(window.gtagDataLayer.push);
      });

      it('should track named page', function() {
        gtag.options.trackAllPages = true;
        analytics.page('Pagename');
        analytics.called(window.gtagDataLayer.push, 'event', 'Loaded a Page', {
          name: 'Pagename',
          event: 'Loaded a Page',
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: window.location.search,
          url: window.location.href
        });
      });

      it('should not track named page if option turned off ', function() {
        gtag.options.trackNamedPages = false;
        analytics.page('Pagename');
        analytics.didNotCall(window.gtagDataLayer.push);
      });

      it('should not track page if set to false', function() {
        gtag.options.trackNamedPages = false;
        gtag.options.trackCategorizedPages = false;
        analytics.page('Pagename');
        analytics.page('Category', 'name');
        analytics.didNotCall(window.gtagDataLayer.push);
      });

      it('should not track page if trackCategorizedPages set to true', function() {
        gtag.options.trackNamedPages = false;
        gtag.options.trackCategorizedPages = true;
        analytics.page('Pagename');
        analytics.page('Category', 'name');
        analytics.called(window.gtagDataLayer.push);
      });

      it('should not track page if trackNamedPages & trackCategorizedPages set to true', function() {
        gtag.options.trackNamedPages = true;
        gtag.options.trackCategorizedPages = true;
        analytics.page('Pagename');
        analytics.page('Category', 'Pagename');
        analytics.calledThrice(window.gtagDataLayer.push);
      });

      it('should set custom dimensions if setAllMappedProps set to true', function() {
        gtag.options.GA_WEB_MEASUREMENT_ID = 'GA_WEB_MEASUREMENT_ID';
        gtag.options.trackNamedPages = true;
        gtag.options.gaOptions = {
          setAllMappedProps: true,
          dimensions: {
            company: 'dimension2'
          },
          metrics: {
            age: 'metric1'
          }
        };
        analytics.page('Page1', {
          loadTime: '100',
          levelAchieved: '5',
          company: 'Google'
        });
        analytics.called(
          window.gtagDataLayer.push,
          'config',
          'GA_WEB_MEASUREMENT_ID',
          {
            custom_map: GTAG.merge(
              gtag.options.gaOptions.dimensions,
              gtag.options.gaOptions.metrics
            )
          }
        );
      });

      it('should not set custom dimensions if setAllMappedProps set to false', function() {
        gtag.options.GA_WEB_MEASUREMENT_ID = 'GA_WEB_MEASUREMENT_ID';
        gtag.options.trackNamedPages = true;
        gtag.options.gaOptions = {
          setAllMappedProps: false,
          dimensions: {
            company: 'dimension2'
          },
          metrics: {
            age: 'metric1'
          }
        };
        analytics.page('Page1', {
          loadTime: '100',
          levelAchieved: '5',
          company: 'Google'
        });
        analytics.didNotCall(
          window.gtagDataLayer.push,
          'config',
          'GA_WEB_MEASUREMENT_ID',
          {
            custom_map: GTAG.merge(
              gtag.options.gaOptions.dimensions,
              gtag.options.gaOptions.metrics
            )
          }
        );
        analytics.called(
          window.gtagDataLayer.push,
          'event',
          'Viewed Page1 Page'
        );
      });

      it('should send event to specified destination only', function() {
        gtag.options.sendTo = ['GA_WEB_MEASUREMENT_ID'];
        gtag.options.trackAllPages = true;
        analytics.page('Pagename');
        analytics.called(window.gtagDataLayer.push, 'event', 'Loaded a Page', {
          name: 'Pagename',
          event: 'Loaded a Page',
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: window.location.search,
          url: window.location.href,
          send_to: gtag.options.sendTo
        });
      });

      it('should take higher precedence for sendTo for specific event over option', function() {
        var sendTo = ['GA_WEB_MEASUREMENT_ID', 'AW_CONVERSION_ID'];
        gtag.options.sendTo = ['GA_WEB_MEASUREMENT_ID'];
        gtag.options.trackAllPages = true;
        analytics.page('Pagename', {
          sendTo: sendTo
        });
        analytics.called(window.gtagDataLayer.push, 'event', 'Loaded a Page', {
          name: 'Pagename',
          event: 'Loaded a Page',
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: window.location.search,
          url: window.location.href,
          send_to: sendTo
        });
      });
    });
  });
});
