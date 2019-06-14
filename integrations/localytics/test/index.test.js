'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var is = require('is');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Localytics = require('../lib/');

describe('Localytics', function() {
  var analytics;
  var localytics;
  var options = {
    appKey: '3ccfac0c5c366f11105f26b-c8ab109c-b6e1-11e2-88e8-005cf8cbabd8'
  };

  beforeEach(function() {
    analytics = new Analytics();
    localytics = new Localytics(options);
    analytics.use(Localytics);
    analytics.use(tester);
    analytics.add(localytics);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    localytics.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(
      Localytics,
      integration('Localytics')
        .global('LocalyticsGlobal')
        .option('appKey', '')
        .option('namespace', null)
        .option('polling', null)
        .option('appVersion', null)
        .option('networkCarrier', null)
        .option('uploadTimeout', null)
        .option('sessionTimeoutSeconds', null)
        .option('storage', null)
        .option('logger', null)
        .option('trackAllPages', false)
        .option('trackNamedPages', true)
        .option('trackCategorizedPages', true)
        .assumesPageview()
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(localytics, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(localytics.load);
      });

      it('should create the global object', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(window.LocalyticsGlobal === 'll');
      });

      it('should create window.ll', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(is.fn(window.ll));
      });

      it('should create window.ll.q', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(is.array(window.ll.q));
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(localytics, done);
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
        analytics.stub(window, 'll');
      });

      it('should send id', function() {
        analytics.identify('1234');
        analytics.called(window.ll, 'setCustomerId', '1234');
      });

      it('should send name', function() {
        analytics.identify(null, { name: 'name' });
        analytics.called(window.ll, 'setCustomerName', 'name');
      });

      it('should send first name', function() {
        analytics.identify(null, { firstName: 'Jordi' });
        analytics.called(window.ll, 'setCustomerFirstName', 'Jordi');
      });

      it('should send last name', function() {
        analytics.identify(null, { lastName: 'Buckets' });
        analytics.called(window.ll, 'setCustomerLastName', 'Buckets');
      });

      it('should send email', function() {
        analytics.identify(null, { email: 'email@baz.com' });
        analytics.called(window.ll, 'setCustomerEmail', 'email@baz.com');
      });

      it('should send custom dimensions', function() {
        localytics.options.dimensions = { gender: 0 };
        analytics.identify(null, { gender: 'male' });
        analytics.called(window.ll, 'setCustomDimension', 0, 'male');
      });

      it('should not send id if omitted', function() {
        analytics.identify(null, { email: 'email@baz.com', name: 'baz' });
        analytics.didNotCall(window.ll, 'setCustomerId');
      });

      it('should not send name if omitted', function() {
        analytics.identify('id', { email: 'baz@baz.com' });
        analytics.didNotCall(window.ll, 'setCustomerName');
      });

      it('should not send email if omitted', function() {
        analytics.identify('id', { name: 'baz' });
        analytics.didNotCall(window.ll, 'setCustomerEmail');
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'll');
      });

      it('should not track unamed pages by default', function() {
        analytics.page();
        analytics.didNotCall(window.ll, 'tagScreen');
      });

      it('should track unamed pages if enabled', function() {
        localytics.options.trackAllPages = true;
        analytics.page();
        analytics.called(window.ll, 'tagScreen', 'Loaded a Page');
      });

      it('should track named pages by default', function() {
        analytics.page('name');
        analytics.called(window.ll, 'tagScreen', 'name');
      });

      it('should track categorized pages by default', function() {
        analytics.page('category', 'name');
        analytics.called(window.ll, 'tagScreen', 'category name');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'll');
      });

      it('should send events', function() {
        analytics.track('event1');
        analytics.called(window.ll, 'tagEvent', 'event1', {});
      });

      it('should send events and properties', function() {
        analytics.track('event2', { prop: true });
        analytics.called(window.ll, 'tagEvent', 'event2', { prop: true });
      });

      it('should send custom dimensions', function() {
        localytics.options.dimensions = { prop1: 1 };
        analytics.track('event3', { prop1: 'test1', prop2: 'test2' });
        analytics.called(window.ll, 'setCustomDimension', 1, 'test1');
      });

      it('should send customer value', function() {
        analytics.track('event2', { prop: true, revenue: 42 });
        analytics.called(
          window.ll,
          'tagEvent',
          'event2',
          { prop: true, revenue: 42 },
          42
        );
      });
    });

    describe('works', function() {
      it('should work', function() {
        analytics.track('segmentio', { test: true });
        analytics.identify('userID', { email: 'baz' });
      });
    });
  });
});
