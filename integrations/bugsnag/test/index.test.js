'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Bugsnag = require('../lib/');

describe('Bugsnag', function() {
  var analytics;
  var bugsnag;
  var options = {
    apiKey: '7563fdfc1f418e956f5e5472148759f0'
  };
  var onError = window.onerror;

  beforeEach(function() {
    analytics = new Analytics();
    bugsnag = new Bugsnag(options);
    analytics.use(Bugsnag);
    analytics.use(tester);
    analytics.add(bugsnag);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    bugsnag.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Bugsnag, integration('Bugsnag')
      .global('Bugsnag')
      .option('apiKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(bugsnag, 'load');
    });

    describe('#initialize', function() {
      it('should initialize with api key', function() {
        analytics.initialize();
        analytics.once('ready', function() {
          analytics.assert(bugsnag.apiKey === options.apiKey);
        });
      });

      it('should set releaseStage if provided', function() {
        options.releaseStage = 'production';
        analytics.initialize();
        analytics.once('ready', function() {
          analytics.assert(bugsnag.releaseStage === 'production');
        });
      });
    });
  });

  describe('loading', function() {
    it('should load and set an onerror handler', function(done) {
      analytics.load(bugsnag, function(err) {
        if (err) return done(err);
        analytics.assert(window.onerror !== onError);
        analytics.assert(typeof window.onerror === 'function');
        done();
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      it('should set user', function() {
        analytics.identify('id', { trait: true });
        analytics.deepEqual(window.Bugsnag.user, {
          id: 'id',
          trait: true
        });
      });
    });
  });
});
