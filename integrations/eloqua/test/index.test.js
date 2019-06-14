'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Eloqua = require('../lib/');

describe('Eloqua', function() {
  var analytics;
  var eloqua;
  var options = {
    siteId: 'site-id'
  };

  beforeEach(function() {
    analytics = new Analytics();
    eloqua = new Eloqua(options);
    analytics.use(Eloqua);
    analytics.use(tester);
    analytics.add(eloqua);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    eloqua.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(
      Eloqua,
      integration('Eloqua')
        .assumesPageview()
        .global('_elq')
        .global('_elqQ')
        .option('siteId', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(eloqua, 'load');
    });

    describe('#initialize', function() {
      beforeEach(function() {
        window._elqQ = {};
        analytics.stub(window._elqQ, 'push');
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(eloqua.load);
      });

      it('should push siteId', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(window._elqQ.push, ['elqSetSiteId', 'site-id']);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(eloqua, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('.page()', function() {
      beforeEach(function() {
        analytics.stub(window._elqQ, 'push');
      });

      it('should track pageview', function() {
        analytics.page(null, null, { url: '/', referrer: '/about' });
        analytics.called(window._elqQ.push, [
          'elqTrackPageView',
          '/',
          '/about'
        ]);
      });
    });
  });
});
