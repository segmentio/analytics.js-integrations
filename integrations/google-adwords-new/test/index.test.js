'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var GoogleAdWordsNew = require('../lib/');

describe('Google AdWords New', function() {
  var analytics;
  var googleadwordsnew;
  var options = {
    accountId: 'AW-984542038',
    sendPageView: true,
    conversionLinker: true,
    clickConversions: [
      {
        value: {
          event: 'Order completed',
          id: 'hNDoCJ6Yt3gQ1ta71QM',
          accountId: ''
        }
      },
      {
        value: {
          event: 'Order completed',
          id: 'ljkhsdfkjlhsdfj',
          accountId: ''
        }
      },
      {
        value: {
          event: 'signup',
          id: 'eAZJCICuz3gQ1ta71QM',
          accountId: ''
        }
      },
      {
        value: {
          event: 'login',
          id: 'eAZJCICuz3gQ1talksd', // random not real
          accountId: 'AW-984293029' // random not real
        }
      }
    ],
    pageLoadConversions: [
      {
        value: {
          event: 'Landing',
          id: '80mjCKaqz3gQ1ta71QM',
          accountId: ''
        }
      },
      {
        value: {
          event: 'Landing',
          id: 'kajsd98sdf098sjf',
          accountId: ''
        }
      },
      {
        value: {
          event: 'purchase',
          id: 'hNDoCJ6Yt3gQ1ta71QM',
          accountId: 'AW-984293029' // random not real
        }
      }
    ],
    defaultPageConversion: 'qnCxCOvxq18Q1ta71QM'
  };

  beforeEach(function() {
    analytics = new Analytics();
    googleadwordsnew = new GoogleAdWordsNew(options);
    analytics.use(integrationTester);
    analytics.use(GoogleAdWordsNew);
    analytics.add(googleadwordsnew);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    googleadwordsnew.reset();
    sandbox();
  });

  it('should have the correct options', function() {
    analytics.compare(
      GoogleAdWordsNew,
      integration('Google AdWords New')
        .option('accountId', '')
        .option('sendPageView', true)
        .option('conversionLinker', true)
        .option('clickConversions', {})
        .option('pageLoadConversions', {})
        .option('defaultPageConversion', '')
        .option('disableAdPersonalization', false)
        .tag(
          '<script src="https://www.googletagmanager.com/gtag/js?id={{ accountId }}">'
        )
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(googleadwordsnew, 'load');
    });

    describe('#initialize', function() {
      it('should call load', function() {
        analytics.initialize();
        analytics.called(googleadwordsnew.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(googleadwordsnew, done);
    });

    it('should disable ad personalization before `config` statements when settings enabled', function(done) {
      googleadwordsnew.options.disableAdPersonalization = true;
      analytics.once('ready', function() {
        analytics.deepEqual(window.gtag.args[1], [
          'set',
          'allow_ad_personalization_signals',
          false
        ]);
        done();
      });
      analytics.initialize();
      analytics.spy(window, 'gtag');
    });

    it('should override default configs if desired', function(done) {
      googleadwordsnew.options.sendPageView = false;
      googleadwordsnew.options.conversionLinker = false;
      analytics.once('ready', function() {
        analytics.deepEqual(window.gtag.args[1], [
          'config',
          options.accountId,
          {
            send_page_view: false,
            conversion_linker: false
          }
        ]);
        done();
      });
      analytics.initialize();
      analytics.spy(window, 'gtag');
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.spy(window, 'gtag');
    });

    describe('#page', function() {
      it('should send default page load conversion if `.page()` call is unnamed and conversionId is provided', function() {
        analytics.page();
        // first two args pushed in .initialize()
        analytics.deepEqual(window.gtag.args[2], [
          'event',
          'conversion',
          {
            send_to: options.accountId + '/' + options.defaultPageConversion,
            path: location.pathname,
            referrer: document.referrer,
            search: location.search,
            title: document.title,
            url: location.href
          }
        ]);
      });

      it('should map page names to specific conversionId', function() {
        analytics.page('landing');
        analytics.deepEqual(window.gtag.args[2], [
          'event',
          'landing',
          {
            name: 'landing',
            send_to: options.accountId + '/80mjCKaqz3gQ1ta71QM',
            path: location.pathname,
            referrer: document.referrer,
            search: location.search,
            title: document.title,
            url: location.href
          }
        ]);
        analytics.deepEqual(window.gtag.args[3], [
          'event',
          'landing',
          {
            name: 'landing',
            send_to: options.accountId + '/kajsd98sdf098sjf',
            path: location.pathname,
            referrer: document.referrer,
            search: location.search,
            title: document.title,
            url: location.href
          }
        ]);
      });

      it('should allow overriding accountId when sending page load conversions', function() {
        analytics.page('purchase');
        analytics.deepEqual(window.gtag.args[2], [
          'event',
          'purchase',
          {
            name: 'purchase',
            send_to: 'AW-984293029/hNDoCJ6Yt3gQ1ta71QM',
            path: location.pathname,
            referrer: document.referrer,
            search: location.search,
            title: document.title,
            url: location.href
          }
        ]);
      });

      it('should send integration specific options for value, currency, and transaction_id', function() {
        analytics.page(
          {},
          {
            'Google AdWords New': {
              value: 2,
              currency: 'USD',
              orderId: 'demodog-dart'
            }
          }
        );
        analytics.deepEqual(window.gtag.args[2], [
          'event',
          'conversion',
          {
            send_to: options.accountId + '/' + options.defaultPageConversion,
            path: location.pathname,
            referrer: document.referrer,
            search: location.search,
            title: document.title,
            url: location.href,
            value: 2,
            currency: 'USD',
            transaction_id: 'demodog-dart'
          }
        ]);
      });
    });

    describe('#track', function() {
      it('should send mapped track events', function() {
        analytics.track('signup', {
          value: 10
        });
        analytics.deepEqual(window.gtag.args[2], [
          'event',
          'signup',
          {
            send_to: options.accountId + '/eAZJCICuz3gQ1ta71QM',
            value: 10
          }
        ]);
      });

      it('should send revenue for order completed events', function() {
        analytics.track('order completed', {
          order_id: 'totally-tubular',
          revenue: 25
        });
        analytics.deepEqual(window.gtag.args[2], [
          'event',
          'order completed',
          {
            send_to: options.accountId + '/hNDoCJ6Yt3gQ1ta71QM',
            value: 25,
            transaction_id: 'totally-tubular'
          }
        ]);
        analytics.deepEqual(window.gtag.args[3], [
          'event',
          'order completed',
          {
            send_to: options.accountId + '/ljkhsdfkjlhsdfj',
            value: 25,
            transaction_id: 'totally-tubular'
          }
        ]);
      });
    });
  });
});
