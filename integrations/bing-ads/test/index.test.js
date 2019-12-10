'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Bing = require('../lib/');

describe('Bing Ads', function() {
  var analytics;
  var bing;
  var options = {
    tagId: '4002754'
  };

  beforeEach(function() {
    analytics = new Analytics();
    bing = new Bing(options);
    analytics.use(Bing);
    analytics.use(tester);
    analytics.add(bing);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    bing.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(Bing, integration('Bing Ads')
      .global('UET')
      .global('uetq')
      .option('tagId', ''));
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(bing, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.uetq, 'push');
      });

      it('should track pageviews', function() {
        analytics.page();
        analytics.called(window.uetq.push, 'pageLoad');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.uetq, 'push');
      });

      it('should send correctly', function() {
        analytics.track('play', { category: 'fun', revenue: 90 });
        analytics.called(window.uetq.push, {
          ea: 'track',
          el: 'play',
          ec: 'fun',
          gv: 90
        });
      });
    });
  });
});
