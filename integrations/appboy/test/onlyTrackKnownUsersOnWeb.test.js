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
    automaticallyDisplayMessages: true,
    safariWebsitePushId: '',
    enableHtmlInAppMessages: false,
    trackAllPages: false,
    trackNamedPages: false,
    customEndpoint: '',
    version: 1,
    onlyTrackKnownUsersOnWeb: true, // Default off.
    logPurchaseWhenRevenuePresent: false
  };

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

  // TODO(Marcus) Complete automated tests.
  //  describe('after loading', function() {
  //    beforeEach(function(done) {
  //      analytics.once('ready', done);
  //      analytics.initialize();
  //    });
  //
  //    describe('#identify', function() {
  //      beforeEach(function() {
  //        analytics.stub(window.appboy, 'changeUser');
  //        analytics.stub(window.appboy.ab.User.prototype, 'setFirstName');
  //        analytics.stub(window.appboy.ab.User.prototype, 'setLastName');
  //        analytics.stub(window.appboy.ab.User.prototype, 'setPhoneNumber');
  //        analytics.stub(window.appboy.ab.User.prototype, 'setEmail');
  //        analytics.stub(window.appboy.ab.User.prototype, 'setAvatarImageUrl');
  //        analytics.stub(window.appboy.ab.User.prototype, 'setHomeCity');
  //        analytics.stub(window.appboy.ab.User.prototype, 'setCountry');
  //        analytics.stub(window.appboy.ab.User.prototype, 'setDateOfBirth');
  //        analytics.stub(window.appboy.ab.User.prototype, 'setGender');
  //        analytics.stub(
  //          window.appboy.ab.User.prototype,
  //          'setCustomUserAttribute'
  //        );
  //        analytics.stub(window.appboy, 'initialize');
  //      });
  //
  //      it('should call each Appboy method for standard traits', function() {
  //        analytics.identify('userId', {
  //          firstName: 'Alex',
  //          lastName: 'Noonan',
  //          phone: '555-555-5555',
  //          email: 'alex@email.com',
  //          avatar:
  //            'https://s-media-cache-ak0.pinimg.com/736x/39/b9/75/39b9757ac27c6eabba292d71a63def2c.jpg',
  //          gender: 'woman',
  //          birthday: '1991-09-16T00:00:00.000Z',
  //          address: {
  //            city: 'Dublin',
  //            country: 'Ireland'
  //          }
  //        });
  //        analytics.called(window.appboy.changeUser, 'userId');
  //        analytics.called(
  //          window.appboy.ab.User.prototype.setAvatarImageUrl,
  //          'https://s-media-cache-ak0.pinimg.com/736x/39/b9/75/39b9757ac27c6eabba292d71a63def2c.jpg'
  //        );
  //        analytics.called(window.appboy.ab.User.prototype.setCountry, 'Ireland');
  //        analytics.called(
  //          window.appboy.ab.User.prototype.setDateOfBirth,
  //          1991,
  //          9,
  //          16
  //        );
  //        analytics.called(
  //          window.appboy.ab.User.prototype.setEmail,
  //          'alex@email.com'
  //        );
  //        analytics.called(window.appboy.ab.User.prototype.setFirstName, 'Alex');
  //        analytics.called(window.appboy.ab.User.prototype.setHomeCity, 'Dublin');
  //        analytics.called(
  //          window.appboy.ab.User.prototype.setGender,
  //          window.appboy.ab.User.Genders.FEMALE
  //        );
  //        analytics.called(window.appboy.ab.User.prototype.setLastName, 'Noonan');
  //        analytics.called(
  //          window.appboy.ab.User.prototype.setPhoneNumber,
  //          '555-555-5555'
  //        );
  //        analytics.didNotCall(window.appboy.initialize);
  //      });
  //
  //    });
  //
  //    describe('#group', function() {
  //      beforeEach(function() {
  //        analytics.stub(
  //          window.appboy.ab.User.prototype,
  //          'setCustomUserAttribute'
  //        );
  //      });
  //
  //      it('should send group calls with group ID as a custom field', function() {
  //        analytics.group('0e8c78ea9d97a7b8185e8632', {
  //          name: 'Initech'
  //        });
  //        analytics.called(
  //          window.appboy.ab.User.prototype.setCustomUserAttribute,
  //          'ab_segment_group_0e8c78ea9d97a7b8185e8632',
  //          true
  //        );
  //      });
  //    });
  //
  //    describe('#track', function() {
  //      beforeEach(function() {
  //        analytics.stub(window.appboy, 'logCustomEvent');
  //        analytics.stub(window.appboy, 'logPurchase');
  //      });
  //
  //      it('should send an event', function() {
  //        analytics.track('event');
  //        analytics.called(window.appboy.logCustomEvent, 'event');
  //      });
  //
  //      it('should send all properties', function() {
  //        analytics.track('event with properties', {
  //          nickname: 'noonz',
  //          spiritAnimal: 'rihanna',
  //          best_friend: 'han',
  //          number_of_friends: 12,
  //          idols: ['beyonce', 'madonna'],
  //          favoriteThings: { whiskers: 'on-kittins' }
  //        });
  //        analytics.called(
  //          window.appboy.logCustomEvent,
  //          'event with properties',
  //          {
  //            nickname: 'noonz',
  //            spiritAnimal: 'rihanna',
  //            best_friend: 'han',
  //            number_of_friends: 12
  //          }
  //        );
  //      });
  //    })
  //
  //    describe('#page', function() {
  //      beforeEach(function() {
  //        analytics.stub(window.appboy, 'logCustomEvent');
  //      });
  //
  //      it('should send a page view if trackAllPages is enabled', function() {
  //        appboy.options.trackAllPages = true;
  //        analytics.page();
  //        analytics.called(window.appboy.logCustomEvent, 'Loaded a Page');
  //      });
  //    })
  //
  //  });
});
