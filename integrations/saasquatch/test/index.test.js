'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var SaaSquatch = require('../lib/');

describe('SaaSquatch', function() {
  // HACK(ndhoule): Saasquatch somehow logs this error to the page after test
  // teardown and it makes the page hang in Karma(?_?)
  // Block it so that errors don't log to the console and fail tests
  /* eslint-disable no-console */
  var consoleError = console.error;
  console.error = function(text) {
    if ((/_sqh must be defined and initialized to use this widget/).test(text)) {
      return;
    }

    return consoleError.apply(console, arguments);
  };
  /* eslint-enable no-console */

  var analytics;
  var saasquatch;
  var options = {
    tenantAlias: 'baz',
    accountId: 'foo'
  };

  beforeEach(function() {
    analytics = new Analytics();
    saasquatch = new SaaSquatch(options);
    analytics.use(SaaSquatch);
    analytics.use(tester);
    analytics.add(saasquatch);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    saasquatch.reset();
    sandbox();
  });

    // FIXME(wcjohnson11): This prevents an uncaught exception on page load in Firefox 44
    // Find a better way to solve this in the long run.
  after(function() {
    window._sqh = [];
  });

  it('should have the correct settings', function() {
    analytics.compare(SaaSquatch, integration('SaaSquatch')
      .option('tenantAlias', '')
      .global('_sqh'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(saasquatch, 'load');
      analytics.initialize();
    });

    it('should create window._sqh', function() {
      analytics.assert(window._sqh instanceof Array);
    });

    it('should push init onto window._sqh upon initialization', function() {
      analytics.deepEqual(window._sqh[0], ['init', {
        tenant_alias: options.tenantAlias
      }]);
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.on('ready', done);
      analytics.initialize();
      analytics.page();
      analytics.identify('my-id');
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
        analytics.stub(window._sqh, 'push');
      });

      it('should not send if userId or email are missing', function() {
        analytics.identify();
        analytics.didNotCall(window._sqh.push);
      });

      it('should send if userId is given', function() {
        analytics.identify('id');
        analytics.called(window._sqh.push, ['init', {
          user_id: 'id',
          tenant_alias: 'baz',
          email: undefined,
          first_name: undefined,
          last_name: undefined,
          user_image: undefined
        }]);
      });

      it('should send if email is given', function() {
        analytics.identify({ email: 'self@example.com' });
        analytics.called(window._sqh.push, ['init', {
          user_id: null,
          tenant_alias: 'baz',
          email: 'self@example.com',
          first_name: undefined,
          last_name: undefined,
          user_image: undefined
        }]);
      });

      it('should pass checksum', function() {
        analytics.identify({ email: 'self@example.com' }, { SaaSquatch: { checksum: 'wee' } });
        analytics.called(window._sqh.push, ['init', {
          user_id: null,
          tenant_alias: 'baz',
          email: 'self@example.com',
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          checksum: 'wee'
        }]);
      });

      it('should pass accountId', function() {
        analytics.identify({ email: 'self@example.com' }, { SaaSquatch: { accountId: 123 } });
        analytics.called(window._sqh.push, ['init', {
          user_id: null,
          tenant_alias: 'baz',
          email: 'self@example.com',
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          account_id: 123
        }]);
      });

      it('should pass paymentProviderId', function() {
        analytics.identify({ email: 'self@example.com' }, { SaaSquatch: { paymentProviderId: 421 } });
        analytics.called(window._sqh.push, ['init', {
          user_id: null,
          tenant_alias: 'baz',
          email: 'self@example.com',
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          payment_provider_id: 421
        }]);
      });

      it('should null out paymentProviderId when passed "null"', function() {
        analytics.identify({ email: 'self@example.com' }, { SaaSquatch: { paymentProviderId: 'null' } });
        analytics.called(window._sqh.push, ['init', {
          user_id: null,
          tenant_alias: 'baz',
          email: 'self@example.com',
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          payment_provider_id: null
        }]);
      });

      it('should pass accountStatus', function() {
        analytics.identify({ email: 'self@example.com' }, { SaaSquatch: { accountStatus: 'active' } });
        analytics.called(window._sqh.push, ['init', {
          user_id: null,
          tenant_alias: 'baz',
          email: 'self@example.com',
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          account_status: 'active'
        }]);
      });

      it('should pass referralCode', function() {
        analytics.identify({ email: 'self@example.com' }, { SaaSquatch: { referralCode: 789 } });
        analytics.called(window._sqh.push, ['init', {
          user_id: null,
          tenant_alias: 'baz',
          email: 'self@example.com',
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          referral_code: 789
        }]);
      });

      it('should pass referral image', function() {
        analytics.identify(1, {}, { SaaSquatch: { referralImage: 'img' } });
        analytics.called(window._sqh.push, ['init', {
          user_id: 1,
          tenant_alias: 'baz',
          email: undefined,
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          fb_share_image: 'img'
        }]);
      });

      it('should pass userReferralCode', function() {
        analytics.identify(1, {}, { SaaSquatch: { userReferralCode: 'ABCDEFG' } });
        analytics.called(window._sqh.push, ['init', {
          user_id: 1,
          tenant_alias: 'baz',
          email: undefined,
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          user_referral_code: 'ABCDEFG'
        }]);
      });

      it('should pass locale', function() {
        analytics.identify(1, {}, { SaaSquatch: { locale: 'en_US' } });
        analytics.called(window._sqh.push, ['init', {
          user_id: 1,
          tenant_alias: 'baz',
          email: undefined,
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          locale: 'en_US'
        }]);
      });

      it('should pass mode', function() {
        analytics.identify(1, {}, { SaaSquatch: { mode: 'EMBED' } });
        analytics.called(window._sqh.push, ['init', {
          user_id: 1,
          tenant_alias: 'baz',
          email: undefined,
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          mode: 'EMBED'
        }]);
      });

      it('should pass generic user traits through', function() {
        analytics.identify(1, { title: 'Test Dummy' });
        analytics.called(window._sqh.push, ['init', {
          user_id: 1,
          tenant_alias: 'baz',
          email: undefined,
          first_name: undefined,
          last_name: undefined,
          user_image: undefined,
          title: 'Test Dummy'
        }]);
      });

      it('should send only once', function() {
        analytics.identify('id');
        analytics.identify('id');
        analytics.calledOnce(window._sqh.push);
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window, '_sqh');
        analytics.stub(window._sqh, 'push');
      });

      it('should pass groupId as accountId', function() {
        analytics.group('id');
        analytics.called(window._sqh.push, ['init', {
          tenant_alias: 'baz',
          account_id: 'id'
        }]);
      });

      it('should pass checksum', function() {
        analytics.group(1, {}, { SaaSquatch: { checksum: 'wee' } });
        analytics.called(window._sqh.push, ['init', {
          tenant_alias: 'baz',
          account_id: 1,
          checksum: 'wee'
        }]);
      });

      it('should pass referral image', function() {
        analytics.group(1, { referralImage: 'img' });
        analytics.called(window._sqh.push, ['init', {
          tenant_alias: 'baz',
          account_id: 1,
          fb_share_image: 'img'
        }]);
      });

      it('should send only once', function() {
        analytics.group('id');
        analytics.group('id');
        analytics.calledOnce(window._sqh.push);
      });
    });
  });
});
