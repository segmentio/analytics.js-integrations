'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var TrackJS = require('../lib/');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');

describe('Track JS', function() {
  var analytics;
  var trackjs;
  var options = {
    enabled: true,
    token: 'c15932a25c4649f9b3505ab5c62b0ea5',
    application: 'site-public',
    callbackEnabled: true,
    callbackBindStack: false,
    consoleEnabled: true,
    consoleDisplay: true,
    consoleError: true,
    networkEnabled: true,
    networkError: true,
    visitorEnabled: true,
    windowEnabled: true
  };
  var optionsConverted = {
    enabled: true,
    token: 'c15932a25c4649f9b3505ab5c62b0ea5',
    application: 'site-public',
    callback: {
      enabled: true,
      bindStack: false
    },
    console: {
      enabled: true,
      display: true,
      error: true,
      watch: ['log', 'debug', 'info', 'warn', 'error']
    },
    network: {
      enabled: true,
      error: true
    },
    visitor: {
      enabled: true
    },
    window: {
      enabled: true
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    trackjs = new TrackJS(options);
    analytics.use(TrackJS);
    analytics.use(tester);
    analytics.add(trackjs);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    trackjs.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(
      TrackJS,
      integration('Track JS')
        .global('track')
        .global('trackJs')
        .global('_trackJs')
        .option('enabled', true)
        .option('token', '')
        .option('application', '')
        .option('callbackEnabled', true)
        .option('callbackBindStack', false)
        .option('consoleEnabled', true)
        .option('consoleDisplay', true)
        .option('consoleError', true)
        .option('networkEnabled', true)
        .option('networkError', true)
        .option('visitorEnabled', true)
        .option('windowEnabled', true)
    );
  });

  describe('before loading', function() {
    describe('#initialize', function() {
      beforeEach(function() {
        analytics.stub(trackjs, 'load');
      });

      afterEach(function() {
        delete window._trackJs;
      });

      it('should configure trackjs', function() {
        analytics.assert(window._trackJs == null);
        analytics.initialize();
        optionsConverted.userId = '';
        analytics.deepEqual(optionsConverted, window._trackJs);
      });

      it('should merge pre-set configuration with options', function() {
        var error = {
          onError: function() {
            return true;
          }
        };
        window._trackJs = error;
        analytics.assert(window._trackJs != null);
        analytics.initialize();
        optionsConverted.userId = '';
        optionsConverted.onError = error.onError;
        analytics.deepEqual(optionsConverted, window._trackJs);
      });

      it('should set the .userId', function() {
        analytics.user().id('276ae7d7');
        analytics.initialize();
        analytics.equal('276ae7d7', window._trackJs.userId);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(trackjs.load);
      });
    });

    describe('#loaded', function() {
      it('should check for window.trackJs', function() {
        analytics.assert(!trackjs.loaded());
        window.trackJs = {};
        analytics.assert(trackjs.loaded());
      });
    });
  });

  describe('loading', function() {
    it('should load trackJs', function(done) {
      analytics.load(trackjs, function(err) {
        if (err) return done(err);
        window.trackJs.track('Error!');
        done();
      });
    });
  });
});
