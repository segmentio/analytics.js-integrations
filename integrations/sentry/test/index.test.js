'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Sentry = require('../lib/');

/**
 * Segment settings slugs do not always match the configuration option name
 * in Senty. Here are the relevant mappings that may cause confusion:
 * https://docs.sentry.io/error-reporting/configuration/?platform=browser
 *
 * Segment setting - Sentry config option
 * config - dsn
 * customVersionProperty || release - release
 * ignoreUrls - blacklistUrls
 * logger - logger (type `tag`, NOT actual config option)
 * customVersionProperty - release
 */

describe('Sentry', function() {
  var sentry;
  var analytics;
  var options = {
    config: 'https://ee3da278a59448c9866f7099b81249ac@sentry.io/1883422', // Sentry: dsn
    environment: 'development',
    serverName: 'B5372DB0-C21E-11E4-8DFC-AA07A5B093DB',
    release: '721e41770371db95eee98ca2707686226b993eda',
    ignoreErrors: ['fb_xd_fragment'],
    ignoreUrls: ['/graph.facebook.com/', 'http://example.com/script2.js'], // Sentry: blacklistUrls
    whitelistUrls: ['/getsentry.com/', 'segment.com'],
    logger: 'javascript', // Sentry: type `tag`, key "logger"
    customVersionProperty: null, // Sentry: release
    debug: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    sentry = new Sentry(options);
    analytics.use(Sentry);
    analytics.use(tester);
    analytics.add(sentry);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    sentry.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Sentry,
      integration('Sentry')
        .global('Sentry')
        .option('config', '')
        .option('environment', null)
        .option('serverName', null)
        .option('release', null)
        .option('ignoreErrors', [])
        .option('ignoreUrls', [])
        .option('whitelistUrls', [])
        .option('includePaths', [])
        .option('maxMessageLength', null)
        .option('logger', null)
        .option('customVersionProperty', null)
        .option('debug', false)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(sentry, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(sentry.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(sentry, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should capture error event', function() {
      analytics.stub(window.Sentry, 'captureException');

      try {
        // eslint-disable-next-line no-undef
        myUndefinedFunction();
      } catch (err) {
        window.Sentry.captureException(err);
      }
      analytics.called(window.Sentry.captureException);
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.Sentry, 'setUser');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.Sentry.setUser, { id: 'id' });
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.Sentry.setUser, { trait: true });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.Sentry.setUser, {
          id: 'id',
          trait: true
        });
      });
    });
  });
});
