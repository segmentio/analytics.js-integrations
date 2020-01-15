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
 * ignoreUrls - blacklistUrls
 * logger - environment (if release is not specified)
 * customVersionProperty - release (fallback if `release` is not specified)
 */

describe('Sentry', function() {
  var sentry;
  var analytics;
  var options = {
    config: 'https://8152fdb57e8c4ec1b60d27745bda8cbd@sentry.io/52723', // Sentry: dsn
    serverName: 'B5372DB0-C21E-11E4-8DFC-AA07A5B093DB',
    release: '721e41770371db95eee98ca2707686226b993eda',
    ignoreErrors: ['fb_xd_fragment'],
    ignoreUrls: ['/graph.facebook.com/', 'http://example.com/script2.js'], // Sentry: blacklistUrls
    whitelistUrls: ['/getsentry.com/', 'segment.com'],
    logger: 'development', // Sentry: environment
    customVersionProperty: null, // Sentry: release
    level: 'warning',
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
        .option('serverName', null)
        .option('release', null)
        .option('ignoreErrors', [])
        .option('ignoreUrls', [])
        .option('whitelistUrls', [])
        .option('includePaths', [])
        .option('maxMessageLength', null)
        .option('logger', null)
        .option('customVersionProperty', null)
        .option('level')
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

      it('should respect UI settings', function() {
        var config = {
          dsn: options.config,
          environment: options.logger,
          release: options.release,
          serverName: options.serverName,
          whitelistUrls: options.whitelistUrls,
          blacklistUrls: options.ignoreUrls,
          debug: options.debug
        };
        analytics.initialize();
        analytics.assert(window.SentryConfig.dsn === options.config);
        analytics.assert.deepEqual(window.SentryConfig.config, config);
      });

      it('should allow and set custom versions', function() {
        var config = {
          logger: options.logger,
          serverName: options.serverName,
          whitelistUrls: options.whitelistUrls,
          ignoreErrors: options.ignoreErrors,
          ignoreUrls: options.ignoreUrls,
          includePaths: options.includePaths,
          maxMessageLength: options.maxMessageLength,
          release: '2.4.0'
        };

        sentry.options.customVersionProperty = 'my_custom_version_property';
        window.my_custom_version_property = '2.4.0';
        analytics.initialize();

        // Need to delete before asserts to prevent leaking effects in case of failure.
        delete window.my_custom_version_property;

        analytics.assert(window.SentryConfig.dsn === options.config);
        analytics.assert.deepEqual(window.SentryConfig.config, config);
      });

      it('should reject null settings', function() {
        sentry.options.release = null;
        analytics.initialize();
        analytics.assert(!window.SentryConfig.config.release);
      });

      it('should reject empty strings', function() {
        sentry.options.release = '';
        analytics.initialize();
        analytics.assert(!window.SentryConfig.config.release);
      });

      it('should reject empty array settings', function() {
        sentry.options.ignoreUrls = [];
        analytics.initialize();
        analytics.assert(!window.SentryConfig.config.ignoreUrls);
      });

      it('should reject arrays that have empty strings', function() {
        sentry.options.ignoreUrls = [''];
        analytics.initialize();
        analytics.assert(!window.SentryConfig.config.ignoreUrls);
      });

      it('should clean arrays', function() {
        sentry.options.ignoreUrls = ['', 'foo'];
        sentry.options.includePaths = ['', ''];
        analytics.initialize();
        analytics.assert(window.SentryConfig.config.ignoreUrls[0] === 'foo');
        analytics.assert(!window.SentryConfig.config.includePaths);
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
