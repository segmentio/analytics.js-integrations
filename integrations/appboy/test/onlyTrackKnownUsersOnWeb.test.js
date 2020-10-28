var Analytics = require('@segment/analytics.js-core').constructor;
// var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Appboy = require('../lib/');
var assert = require('assert');
var sinon = require('sinon');

describe('Appboy with onlyTrackKnownUsersOnWeb enabled', function() {
  var analytics;
  var appboy;
  var options = {
    apiKey: '7c664901-d8c0-4f82-80bf-e7e7a24478e8',
    automaticallyDisplayMessages: false,
    safariWebsitePushId: '',
    enableHtmlInAppMessages: false,
    trackAllPages: false,
    trackNamedPages: false,
    customEndpoint: '',
    version: 1,
    onlyTrackKnownUsersOnWeb: true, // Default off.
    logPurchaseWhenRevenuePresent: false
  };
  var defaultInitializeArgs = [
    [options.apiKey, { baseUrl: 'https://sdk.iad-01.braze.com/api/v3' }]
  ];

  beforeEach(function() {
    analytics = new Analytics();
    appboy = new Appboy(options);
    analytics.use(Appboy);
    analytics.use(tester);
    analytics.add(appboy);
  });

  afterEach(function(done) {
    analytics.restore();
    analytics.reset();
    appboy.reset();
    sandbox();
    done();
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(appboy, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.called(appboy.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(appboy, done);
    });

    it('should use initializeV1 if version is set to 1', function(done) {
      var V1spy = sinon.spy(appboy, 'initializeV1');
      var V2spy = sinon.spy(appboy, 'initializeV2');
      appboy.options.version = 1;
      analytics.once('ready', function() {
        try {
          assert(V1spy.called);
          assert(!V2spy.called);
          done();
        } catch (e) {
          done(e);
        }
      });
      analytics.initialize();
    });

    it('should use initializeV2 if version is set to 2', function(done) {
      var V1spy = sinon.spy(appboy, 'initializeV1');
      var V2spy = sinon.spy(appboy, 'initializeV2');
      appboy.options.version = 2;
      analytics.once('ready', function() {
        try {
          assert(V2spy.called);
          assert(!V1spy.called);
          done();
        } catch (e) {
          done(e);
        }
      });
      analytics.initialize();
    });

    it('should use initializeV2 if version is set to 2.7', function(done) {
      var V1spy = sinon.spy(appboy, 'initializeV1');
      var V2spy = sinon.spy(appboy, 'initializeV2');
      appboy.options.version = 2.7;
      analytics.once('ready', function() {
        try {
          assert(V2spy.called);
          assert(!V1spy.called);
          done();
        } catch (e) {
          done(e);
        }
      });
      analytics.initialize();
    });

    describe('initializeV1', function() {
      it('should call changeUser if userID is present', function(done) {
        analytics.user().id('user-id');
        analytics.once('ready', function() {
          assert.equal(window.appboy.getUser().getUserId(), 'user-id');
          done();
        });
        analytics.initialize();
      });
    });

    describe('initializeV2', function() {
      it('should call changeUser if userID is present', function(done) {
        appboy.options.version = 2;
        analytics.user().id('user-id');
        analytics.once('ready', function() {
          window.appboy.getUser().getUserId(function(userId) {
            assert.equal(userId, 'user-id');
            done();
          });
        });
        analytics.initialize();
      });

      it('should not initialize appboy sdk as user is not initialized', function(done) {
        appboy.options.version = 2;
        var spy = sinon.spy(appboy, 'initializeTester');
        analytics.once('ready', function() {
          try {
            assert.deepEqual(spy.args, []);
            done();
          } catch (e) {
            done(e);
          }
        });
        analytics.initialize();
      });

      it('should not initialize appboy sdk even if anonymous user is set', function(done) {
        appboy.options.version = 2;
        var spy = sinon.spy(appboy, 'initializeTester');
        analytics.once('ready', function() {
          try {
            assert.deepEqual(spy.args, []);
            done();
          } catch (e) {
            done(e);
          }
        });
        analytics.user().anonymousId('ABC-123-XYZ');
        analytics.initialize();
      });

      it('should initialize appboy sdk if user is identified with defaults', function(done) {
        appboy.options.version = 2;
        var spy = sinon.spy(appboy, 'initializeTester');
        var defaults = {
          allowCrawlerActivity: false,
          doNotLoadFontAwesome: false,
          enableLogging: false,
          safariWebsitePushId: '',
          localization: 'en',
          minimumIntervalBetweenTriggerActionsInSeconds: 30,
          openInAppMessagesInNewTab: false,
          openNewsFeedCardsInNewTab: false,
          sessionTimeoutInSeconds: 30,
          serviceWorkerLocation: undefined,
          requireExplicitInAppMessageDismissal: false,
          enableHtmlInAppMessages: false
        };
        analytics.once('ready', function() {
          try {
            assert.deepEqual(spy.args[0][1], defaults);
            done();
          } catch (e) {
            done(e);
          }
        });
        analytics.identify('fakeUserId');
        analytics.initialize();
      });
    });
  });

  describe('after loading', function() {
    var initializeTesterSpy;
    var appboyInitializeSpy;
    beforeEach(function(done) {
      initializeTesterSpy = sinon.spy(appboy, 'initializeTester');
      appboyInitializeSpy = sinon.spy(appboy, 'appboyInitialize');
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.appboy, 'changeUser');
        analytics.stub(window.appboy, 'initialize');
        analytics.stub(window.appboy, 'openSession');
      });

      it('should call each Appboy method for standard traits', function() {
        assert.deepEqual(initializeTesterSpy.args, []);
        assert.deepEqual(appboyInitializeSpy.args, []);
        analytics.identify('userId', {
          firstName: 'Mr',
          lastName: 'Sloth'
        });
        // Initialize is triggered by identify call.
        analytics.called(window.appboy.initialize);
        assert.deepEqual(initializeTesterSpy.args, defaultInitializeArgs);
        assert.deepEqual(appboyInitializeSpy.args.length, 1);
        analytics.called(window.appboy.changeUser, 'userId');
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window.appboy, 'changeUser');
      });

      it('should send group calls with group ID as a custom field after initialized', function() {
        analytics.group('0e8c78ea9d97a7b8185e8632', {
          name: 'Initech'
        });
        analytics.didNotCall(window.appboy.changeUser);

        analytics.identify('newUserId');
        analytics.group('0e8c78ea9d97a7b8185e8632', {
          name: 'Initech'
        });
        analytics.called(window.appboy.changeUser, 'newUserId');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.appboy, 'logCustomEvent');
        analytics.stub(window.appboy, 'logPurchase');
      });

      it('should send an event once initialized', function() {
        analytics.track('event');
        analytics.didNotCall(window.appboy.logCustomEvent, 'event');

        analytics.identify('newUserId');
        analytics.track('event');
        analytics.called(window.appboy.logCustomEvent, 'event');
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.appboy, 'logCustomEvent');
      });

      it('should send event once initialized', function() {
        appboy.options.trackAllPages = true;
        analytics.page();
        analytics.didNotCall(window.appboy.logCustomEvent, 'Loaded a Page');

        analytics.identify('newUserId');
        analytics.page();
        analytics.called(window.appboy.logCustomEvent, 'Loaded a Page');
      });
    });
  });
});
