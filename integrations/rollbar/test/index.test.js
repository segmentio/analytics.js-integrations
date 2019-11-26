'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Rollbar = require('../lib/');


describe('Rollbar', function() {
  var analytics;
  var rollbar;
  var options = {
    accessToken: 'FFFFFFFFFFFFFFFFFFF',
    environment: 'testenvironment',
    sourceMapEnabled: false,
    codeVersion: '1.2.3',
    guessUncaughtFrames: false,
    captureUncaught: true,
    captureUnhandledRejections: false,
    ignoredMessages: ['oh hey'],
    verbose: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    rollbar = new Rollbar(options);
    analytics.use(Rollbar);
    analytics.use(tester);
    analytics.add(rollbar);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    sandbox();
    rollbar.reset();
    delete window._rollbarDidLoad;
  });

  it('should have the right settings', function() {
    analytics.compare(Rollbar, integration('Rollbar')
      .global('Rollbar')
      .global('rollbar')
      .option('accessToken', '')
      .option('identify', true));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(rollbar, 'load');
    });

    describe('#initialize', function() {
      it('should create the window.Rollbar object', function() {
        analytics.assert(!window.Rollbar);
        analytics.initialize();
        analytics.assert(window.Rollbar);
      });

      it('should have all of the correct methods', function() {
        analytics.initialize();
        analytics.assert(window.Rollbar);
        analytics.assert(window.Rollbar.debug);
        analytics.assert(window.Rollbar.info);
        analytics.assert(window.Rollbar.warning);
        analytics.assert(window.Rollbar.error);
        analytics.assert(window.Rollbar.critical);
        analytics.assert(window.Rollbar.configure);
      });

      it('should set window.onerror', function() {
        var onerr = window.onerror;
        analytics.initialize();
        analytics.assert(window.onerror !== onerr);
        analytics.assert(typeof window.onerror === 'function');
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(rollbar.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(rollbar, done);
    });
  });

  describe('after loading', function() {
    it('should initialize with right options', function(done) {
      analytics.once('ready', function() {
        analytics.assert(window._rollbarConfig.accessToken === options.accessToken);
        analytics.assert(window._rollbarConfig.captureUncaught === options.captureUncaught);
        analytics.assert(window._rollbarConfig.captureUnhandledRejections === options.captureUnhandledRejections);
        analytics.assert(window._rollbarConfig.verbose === options.verbose);
        analytics.assert(window._rollbarConfig.payload.environment === options.environment);
        analytics.assert(window._rollbarConfig.ignoredMessages[0] === options.ignoredMessages[0]);
        analytics.assert(window._rollbarConfig.payload.client.javascript.source_map_enabled === options.sourceMapEnabled);
        analytics.assert(window._rollbarConfig.payload.client.javascript.code_version === options.codeVersion);
        analytics.assert(window._rollbarConfig.payload.client.javascript.guess_uncaught_frames === options.guessUncaughtFrames);
        done();
      });
      analytics.initialize();
    });


    describe('#identify', function() {
      var rollbarClient;
      beforeEach(function(done) {
        analytics.load(rollbar, function() {
          rollbarClient = window.Rollbar;
          analytics.stub(rollbarClient, 'configure');
          done();
        });
      });

      it('should send an id', function() {
        analytics.identify('id', {});
        analytics.called(rollbarClient.configure, {
          payload: { person: { id: 'id' } }
        });
      });

      it('should not send only traits', function() {
        analytics.identify({ trait: true });
        analytics.didNotCall(rollbarClient.configure);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(rollbarClient.configure, {
          payload: { person: { id: 'id', trait: true } }
        });
      });
    });

    describe('window.onerror', function() {
      it('should call window.Rollbar.handleUncaughtException', function(done) {
        window.onerror = undefined;
        analytics.initialize();
        analytics.stub(window.Rollbar, 'handleUncaughtException');
        
        var err = new Error('testing');
        window.onerror('test message', 'http://foo.com', 33, 21, err);
        analytics.called(window.Rollbar.handleUncaughtException,
          'test message',
          'http://foo.com',
          33,
          21,
          err
        );
        done();
      });
    });
  });
});
