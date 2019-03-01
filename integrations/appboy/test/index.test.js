'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Appboy = require('../lib/');
var assert = require('assert');
var sinon = require('sinon');

describe('Appboy', function() {
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
    version: 1
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

  it('should have the right settings', function() {
    analytics.compare(Appboy, integration('Appboy')
      .global('appboy')
      .option('apiKey', '')
      .option('safariWebsitePushId', '')
      .option('allowCrawlerActivity', false)
      .option('doNotLoadFontAwesome', false)
      .option('enableLogging', false)
      .option('automaticallyDisplayMessages', true)
      .option('localization', 'en')
      .option('minimumIntervalBetweenTriggerActionsInSeconds', 30)
      .option('openInAppMessagesInNewTab', false)
      .option('openNewsFeedCardsInNewTab', false)
      .option('sessionTimeoutInSeconds', 30)
      .option('requireExplicitInAppMessageDismissal', false)
      .option('enableHtmlInAppMessages', false)
      .option('trackAllPages', false)
      .option('trackNamedPages', false)
      .option('customEndpoint', '')
      .option('version', 1)
    );
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

    it('should set the sdk endpoint to the correct datacenter', function(done) {
      var datacenterMappings = {
        us:   'https://sdk.iad-01.braze.com',
        us02: 'https://sdk.iad-02.braze.com',
        us03: 'https://sdk.iad-03.braze.com',
        eu:   'https://sdk.fra-01.braze.eu'
      };

      var spy = sinon.spy(appboy, 'initializeTester');
      for (var option in datacenterMappings) {
        if (!datacenterMappings.hasOwnProperty(option)) continue;
        appboy.options.datacenter = option;
        analytics.once('ready', function() {
          try {
            assert.equal(spy.args[0][1].baseUrl, datacenterMappings[option] + '/api/v3');
            done();
          } catch (e) {
            done(e);
          }
          spy.restore();
        });
        analytics.initialize();
      }
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

    it('should set the sdk endpoint to a custom URI if one is provided', function(done) {
      appboy.options.customEndpoint = 'https://my.custom.endpoint.com';
      var spy = sinon.spy(appboy, 'initializeTester');
      analytics.once('ready', function() {
        try {
          assert.equal(spy.args[0][1].baseUrl, 'https://my.custom.endpoint.com/api/v3');
          done();
        } catch (e) {
          done(e);
        }
      });
      analytics.initialize();
    });

    it('should prefix the customEndpoint with https:// if it was not by the user', function(done) {
      appboy.options.customEndpoint = 'my.custom.endpoint.com';
      var spy = sinon.spy(appboy, 'initializeTester');
      analytics.once('ready', function() {
        try {
          assert.equal(spy.args[0][1].baseUrl, 'https://my.custom.endpoint.com/api/v3');
          done();
        } catch (e) {
          done(e);
        }
      });
      analytics.initialize();
    });

    it('should send Safari Website Push ID if provided in the settings', function(done) {
      appboy.options.safariWebsitePushId = 'web.com.example.domain';
      var spy = sinon.spy(appboy, 'initializeTester');
      analytics.once('ready', function() {
        try {
          analytics.assert(spy.args[0][1].safariWebsitePushId, options.safariWebsitePushId);
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

      it('should initialize the appboy sdk with default options if none are provided', function(done) {
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
        analytics.initialize();
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.appboy, 'changeUser');
        analytics.stub(window.appboy.ab.User.prototype, 'setFirstName');
        analytics.stub(window.appboy.ab.User.prototype, 'setLastName');
        analytics.stub(window.appboy.ab.User.prototype, 'setPhoneNumber');
        analytics.stub(window.appboy.ab.User.prototype, 'setEmail');
        analytics.stub(window.appboy.ab.User.prototype, 'setAvatarImageUrl');
        analytics.stub(window.appboy.ab.User.prototype, 'setHomeCity');
        analytics.stub(window.appboy.ab.User.prototype, 'setCountry');
        analytics.stub(window.appboy.ab.User.prototype, 'setDateOfBirth');
        analytics.stub(window.appboy.ab.User.prototype, 'setGender');
        analytics.stub(window.appboy.ab.User.prototype, 'setCustomUserAttribute');
      });

      it('should call each Appboy method for standard traits', function() {
        analytics.identify('userId', {
          firstName: 'Alex',
          lastName: 'Noonan',
          phone: '555-555-5555',
          email: 'alex@email.com',
          avatar: 'https://s-media-cache-ak0.pinimg.com/736x/39/b9/75/39b9757ac27c6eabba292d71a63def2c.jpg',
          gender: 'woman',
          birthday: '1991-09-16T00:00:00.000Z',
          address: {
            city: 'Dublin',
            country: 'Ireland'
          }
        });
        analytics.called(window.appboy.changeUser, 'userId');
        analytics.called(window.appboy.ab.User.prototype.setAvatarImageUrl, 'https://s-media-cache-ak0.pinimg.com/736x/39/b9/75/39b9757ac27c6eabba292d71a63def2c.jpg');
        analytics.called(window.appboy.ab.User.prototype.setCountry, 'Ireland');
        analytics.called(window.appboy.ab.User.prototype.setDateOfBirth, 1991, 9, 16);
        analytics.called(window.appboy.ab.User.prototype.setEmail, 'alex@email.com');
        analytics.called(window.appboy.ab.User.prototype.setFirstName, 'Alex');
        analytics.called(window.appboy.ab.User.prototype.setHomeCity, 'Dublin');
        analytics.called(window.appboy.ab.User.prototype.setGender, window.appboy.ab.User.Genders.FEMALE);
        analytics.called(window.appboy.ab.User.prototype.setLastName, 'Noonan');
        analytics.called(window.appboy.ab.User.prototype.setPhoneNumber, '555-555-5555');
      });

      it('should set gender to male when passed male gender', function() {
        analytics.identify('userId', {
          gender: 'male'
        });
        analytics.called(window.appboy.changeUser, 'userId');
        analytics.called(window.appboy.ab.User.prototype.setGender, window.appboy.ab.User.Genders.MALE);
      });

      it('should set gender to other when passed other gender', function() {
        analytics.identify('userId', {
          gender: 'o'
        });
        analytics.called(window.appboy.changeUser, 'userId');
        analytics.called(window.appboy.ab.User.prototype.setGender, window.appboy.ab.User.Genders.OTHER);
      });

      it('should handle custom traits of all types', function() {
        analytics.identify('userId', {
          song: 'Who\'s That Chick?',
          artists: ['David Guetta', 'Rihanna'],
          number: 16,
          date: 'Tue Apr 25 2017 14:22:48 GMT-0700 (PDT)'
        });
        analytics.called(window.appboy.changeUser, 'userId');
        analytics.called(window.appboy.ab.User.prototype.setCustomUserAttribute, 'song', 'Who\'s That Chick?');
        analytics.called(window.appboy.ab.User.prototype.setCustomUserAttribute, 'artists', ['David Guetta', 'Rihanna']);
        analytics.called(window.appboy.ab.User.prototype.setCustomUserAttribute, 'number', 16);
        analytics.called(window.appboy.ab.User.prototype.setCustomUserAttribute, 'date', 'Tue Apr 25 2017 14:22:48 GMT-0700 (PDT)');
      });

      it('should not let you set reserved keys as custom attributes', function() {
        analytics.identify('rick sanchez', { avatar: 'airbender', external_id: '123' });
        analytics.didNotCall(window.appboy.ab.User.prototype.setCustomUserAttribute);
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window.appboy.ab.User.prototype, 'setCustomUserAttribute');
      });

      it('should send group calls with group ID as a custom field', function() {
        analytics.group('0e8c78ea9d97a7b8185e8632', {
          name: 'Initech'
        });
        analytics.called(window.appboy.ab.User.prototype.setCustomUserAttribute, 'ab_segment_group_0e8c78ea9d97a7b8185e8632', true);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.appboy, 'logCustomEvent');
        analytics.stub(window.appboy, 'logPurchase');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.appboy.logCustomEvent, 'event');
      });

      it('should send all properties', function() {
        analytics.track('event with properties', {
          nickname: 'noonz',
          spiritAnimal: 'rihanna',
          best_friend: 'han'
        });
        analytics.called(window.appboy.logCustomEvent, 'event with properties', {
          nickname: 'noonz',
          spiritAnimal: 'rihanna',
          best_friend: 'han'
        });
      });

      it('should remove reserved keys from custom event properties', function() {
        analytics.track('event with properties', {
          product_id: 'noonz',
          event_name: 'rihanna',
          time: 'han',
          currency: 'usd',
          quantity: '123'
        });
        analytics.called(window.appboy.logCustomEvent, 'event with properties', {});
      });

      it('should call logPurchase for each product in a Completed Order event', function() {
        analytics.track('Order Completed', {
          total: 30,
          revenue: 25,
          shipping: 3,
          currency: 'USD',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19.23,
              quantity: 1,
              category: 'Games'
            },
            {
              product_id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'Uno Card Game',
              price: 3,
              quantity: 2,
              category: 'Games'
            }
          ]
        });
        analytics.called(window.appboy.logPurchase, '507f1f77bcf86cd799439011', 19.23, 'USD', 1, {
          total: 30,
          revenue: 25,
          shipping: 3
        });
        analytics.called(window.appboy.logPurchase, '505bd76785ebb509fc183733', 3, 'USD', 2, {
          total: 30,
          revenue: 25,
          shipping: 3
        });
      });

      it('should not fail if currency, quantity, and purchaseProperties are undefined', function() {
        analytics.track('Order Completed', {
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              price: 17.38
            },
            {
              product_id: '505bd76785ebb509fc183733',
              price: 3
            }
          ]
        });
        analytics.called(window.appboy.logPurchase, '507f1f77bcf86cd799439011', 17.38);
        analytics.called(window.appboy.logPurchase, '505bd76785ebb509fc183733', 3);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.appboy, 'logCustomEvent');
      });

      it('should send a page view if trackAllPages is enabled', function() {
        appboy.options.trackAllPages = true;
        analytics.page();
        analytics.called(window.appboy.logCustomEvent, 'Loaded a Page');
      });

      it('should send a page view if trackNamedPages is enabled', function() {
        appboy.options.trackNamedPages = true;
        analytics.page('Home');
        analytics.called(window.appboy.logCustomEvent, 'Viewed Home Page');
      });

      it('should not send a page view if trackAllPages and trackNamedPages are disabled', function() {
        analytics.page('Home');
        analytics.didNotCall(window.appboy.logCustomEvent);
      });

      it('should not send a page view if trackNamedPages is enabled and name is null', function() {
        analytics.page();
        analytics.didNotCall(window.appboy.logCustomEvent);
      });

      it('should send all properties', function() {
        appboy.options.trackAllPages = true;
        analytics.page('Home', {
          title: 'noonz',
          url: 'www.google.com'
        });
        analytics.called(window.appboy.logCustomEvent, 'Viewed Home Page', {
          title: 'noonz',
          url: 'www.google.com',
          name: 'Home',
          path: window.location.pathname,
          referrer: window.document.referrer,
          search: ''
        });
      });
    });
  });
});
