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
    GA_MEASUREMENT_ID: 'GA_MEASUREMENT_ID'
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
        .option('GA_MEASUREMENT_ID', '')
        .option('AW_CONVERSION_ID', '')
        .option('DC_FLOODLIGHT_ID', '')
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
        GA_MEASUREMENT_ID: 'GA_MEASUREMENT_ID',
        AW_CONVERSION_ID: 'AW_CONVERSION_ID'
      };
      analytics.once('ready', done);
      analytics.initialize();
    });

    it('should set default routing', function() {
      analytics.assert(window.gtagDataLayer[0] === 'config');
      analytics.assert(window.gtagDataLayer[1] === 'GA_MEASUREMENT_ID');
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
        analytics.called(window.gtagDataLayer.push, {
          event: 'test event'
        });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.gtagDataLayer, 'push');
      });

      it('should track page', function() {
        analytics.page();
        analytics.called(window.gtagDataLayer.push);
      });

      it('should track named page', function() {
        analytics.page('Pagename');
        analytics.called(window.gtagDataLayer.push, {
          name: 'Pagename',
          event: 'Loaded a Page',
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: window.location.search,
          url: window.location.href
        });
      });
    });
  });
});
