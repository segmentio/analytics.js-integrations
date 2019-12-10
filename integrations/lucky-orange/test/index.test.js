'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var is = require('is');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var LuckyOrange = require('../lib/');

describe('Lucky Orange', function() {
  var analytics;
  var luckyOrange;
  var options = {
    siteId: '17181'
  };

  beforeEach(function() {
    analytics = new Analytics();
    luckyOrange = new LuckyOrange(options);
    analytics.use(LuckyOrange);
    analytics.use(tester);
    analytics.add(luckyOrange);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    luckyOrange.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(LuckyOrange, integration('Lucky Orange')
      .assumesPageview()
      .global('_loq')
      .global('__wtw_lucky_site_id')
      .global('__wtw_lucky_is_segment_io')
      .global('__wtw_custom_user_data')
      .option('siteId', null));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(luckyOrange, 'load');
    });

    describe('#initialize', function() {
      it('should create window._loq', function() {
        analytics.assert(!window._loq);
        analytics.initialize();
        analytics.page();
        analytics.assert(is.array(window._loq));
      });

      it('should initialize the Lucky Orange variables', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(window.__wtw_lucky_site_id === options.siteId);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(luckyOrange.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(luckyOrange, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._loq, 'push');
      });

      it('should send name', function() {
        analytics.identify({ email: 'test@example.com' });
        analytics.deepEqual(window.__wtw_custom_user_data, { email: 'test@example.com' });
      });

      it('should send name', function() {
        analytics.identify({ name: 'test' });
        analytics.deepEqual(window.__wtw_custom_user_data, { name: 'test' });
      });

      it('should send traits', function() {
        analytics.identify('id', { name: 'test', email: 'test@example.com' });
        analytics.deepEqual(window.__wtw_custom_user_data, { id: 'id', name: 'test', email: 'test@example.com' });
      });
    });
  });
});
