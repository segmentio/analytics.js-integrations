'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var Wootric = require('../lib/');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var is = require('is');

describe('Wootric', function() {
  var wootric;
  var analytics;
  var options = {
    accountToken: 'NPS-01fe3cbc'
  };

  beforeEach(function() {
    analytics = new Analytics();
    wootric = new Wootric(options);
    analytics.use(Wootric);
    analytics.use(tester);
    analytics.add(wootric);
    // Configure Wootric to survey immediately
    window.wootric_survey_immediately = true;
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    wootric.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Wootric,
      integration('Wootric')
        .assumesPageview()
        .option('accountToken', '')
        .global('wootricSettings')
        .global('wootric_survey_immediately')
        .global('wootric')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(wootric, 'load');
    });

    it('should not have a wootric object', function() {
      analytics.assert(!window.wootric);
    });

    describe('#initialize', function() {
      beforeEach(function() {
        analytics.initialize();
        analytics.page();
      });

      it('should have settings with account token', function() {
        analytics.assert(
          window.wootricSettings.account_token === 'NPS-01fe3cbc'
        );
      });

      it('should setup the wootricSettings object', function() {
        is.object(window.wootricSettings);
        analytics.assert(window.wootricSettings.version);
      });

      it('should call #load', function() {
        analytics.called(wootric.load);
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#track', function() {
      it('should set email on track', function() {
        analytics.track('track_event', {
          email: 'shawn@shawnmorgan.com'
        });
        analytics.equal(window.wootricSettings.email, 'shawn@shawnmorgan.com');
      });

      it('should set event_name on track', function() {
        analytics.track('track_event', {
          email: 'shawn@shawnmorgan.com'
        });
        analytics.equal(window.wootricSettings.event_name, 'track_event');
      });

      it('should set created_at to null on track', function() {
        analytics.track('track_event', {
          email: 'shawn@shawnmorgan.com',
          createdAt: '01/01/2015'
        });
        analytics.equal(window.wootricSettings.created_at, null);
      });

      it('should set properties based on other traits', function() {
        analytics.track('track_event', {
          email: 'shawn@shawnmorgan.com',
          createdAt: '01/01/2015',
          property1: 'foo',
          property2: 'bar'
        });
        analytics.assert(window.wootricSettings.properties.property1 === 'foo');
        analytics.assert(window.wootricSettings.properties.property2 === 'bar');
      });

      it('should omit email and createdAt when setting window.wootricSettings.properties', function() {
        analytics.track('track_event', {
          email: 'shawn@shawnmorgan.com',
          createdAt: '01/01/2015',
          property1: 'foo',
          property2: 'bar'
        });
        analytics.assert(!window.wootricSettings.properties.email);
        analytics.assert(!window.wootricSettings.properties.createdAt);
      });

      it('should set language if present', function() {
        analytics.track('track_event', {
          email: 'shawn@shawnmorgan.com',
          createdAt: '01/01/2015',
          property1: 'foo',
          property2: 'bar',
          language: 'es'
        });
        analytics.assert(window.wootricSettings.language === 'es');
      });
    });

    describe('#identify', function() {
      it('should set segment_user_id on identify when userId defined', function() {
        analytics.identify('abcd1234', {
          email: 'shawn@shawnmorgan.com'
        });
        analytics.equal(window.wootricSettings.segment_user_id, 'abcd1234');
      });

      it('should set segment_user_id to wite the anonymousId on identify when userId not defined', function() {
        analytics.identify({
          email: 'shawn@shawnmorgan.com'
        });
        analytics.equal(
          window.wootricSettings.segment_user_id,
          analytics.user().anonymousId()
        );
      });

      it('should set email on identify', function() {
        analytics.identify({
          email: 'shawn@shawnmorgan.com'
        });
        analytics.equal(window.wootricSettings.email, 'shawn@shawnmorgan.com');
      });

      it('should set event_name to null on identify', function() {
        analytics.identify({
          email: 'shawn@shawnmorgan.com'
        });
        analytics.equal(window.wootricSettings.event_name, null);
      });

      it('should set created_at on identify using ISO YYYY-MM-DD format', function() {
        analytics.identify({
          createdAt: '2015-01-01'
        });
        analytics.equal(window.wootricSettings.created_at, 1420070400);
      });

      it('should set created_at on identify using ISO YYYYMMDD format', function() {
        analytics.identify({
          createdAt: '20150101'
        });
        analytics.equal(window.wootricSettings.created_at, 1420070400);
      });

      it('should set created_at on traits using Unix Timestamp format', function() {
        analytics.identify({
          createdAt: '1420099200000'
        });
        analytics.equal(window.wootricSettings.created_at, 1420099200);
      });

      it('should round Unix Timstamps with a decimal to the nearest whole digit', function() {
        analytics.identify({
          createdAt: '1420099200.435'
        });
        analytics.equal(window.wootricSettings.created_at, 1420099200);
      });

      it('should set language', function() {
        analytics.identify({
          language: 'es'
        });
        analytics.equal(window.wootricSettings.language, 'es');
      });

      it('should set properties based on other traits', function() {
        analytics.identify({
          email: 'shawn@shawnmorgan.com',
          createdAt: '01/01/2015',
          property1: 'foo',
          property2: 'bar'
        });
        analytics.assert(window.wootricSettings.properties.property1 === 'foo');
        analytics.assert(window.wootricSettings.properties.property2 === 'bar');
      });

      // TODO: Revert this part when tests are fixed
      // See https://github.com/segmentio/analytics.js-integrations/pull/432
      it.skip('should set suffix _date to property key and convert date if trait is a date', function() {
        analytics.identify({
          email: 'shawn@shawnmorgan.com',
          createdAt: '01/01/2015',
          property1: 'foo',
          property2: '2015-01-01'
        });
        analytics.assert(window.wootricSettings.properties.property1 === 'foo');
        analytics.assert(
          window.wootricSettings.properties.hasOwnProperty('property2_date')
        );
        analytics.assert(
          !window.wootricSettings.properties.hasOwnProperty('property2')
        );
        analytics.equal(
          window.wootricSettings.properties.property2_date,
          1420070400
        );
      });

      it('should not convert to date if property key has suffix _date', function() {
        analytics.identify({
          email: 'shawn@shawnmorgan.com',
          createdAt: '01/01/2015',
          property1: 'foo',
          property2_date: 1420070400
        });
        analytics.assert(window.wootricSettings.properties.property1 === 'foo');
        analytics.equal(
          window.wootricSettings.properties.property2_date,
          1420070400
        );
        analytics.assert(
          !window.wootricSettings.properties.hasOwnProperty(
            'property2_date_date'
          )
        );
      });

      it('should omit email and createdAt when setting window.wootricSettings.properties', function() {
        analytics.identify({
          email: 'shawn@shawnmorgan.com',
          createdAt: '01/01/2015',
          property1: 'foo',
          property2: 'bar'
        });
        analytics.assert(!window.wootricSettings.properties.email);
        analytics.assert(!window.wootricSettings.properties.createdAt);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.page('Pricing', {
          title: 'Segment Pricing',
          url: 'https://segment.com/pricing',
          path: '/pricing',
          referrer: 'https://segment.com/warehouses'
        });
      });

      it('should track the current page', function() {
        analytics.equal(window.wootricSettings.page_info.name, 'Pricing');
        analytics.equal(
          window.wootricSettings.page_info.url,
          'https://segment.com/pricing'
        );
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.group('0e8c78ea9d97a7b8185e8632', {
          name: 'Initech',
          industry: 'Technology',
          employees: 329,
          plan: 'enterprise'
        });
      });

      it('should send group traits to Wootric', function() {
        analytics.equal(
          window.wootricSettings.group_info.id,
          '0e8c78ea9d97a7b8185e8632'
        );
        analytics.equal(window.wootricSettings.group_info.name, 'Initech');
      });
    });

    describe('survey', function() {
      it('should set email on identify', function() {
        analytics.identify({
          email: 'shawn@shawnmorgan.com'
        });
        analytics.equal(window.wootricSettings.email, 'shawn@shawnmorgan.com');
      });

      it('should set email on identify if present', function() {
        analytics.identify({
          email: null
        });
        analytics.equal(window.wootricSettings.email, undefined);
      });

      it('should set created_at on identify using ISO YYYY-MM-DD format', function() {
        analytics.identify({
          createdAt: '2015-01-01'
        });
        analytics.equal(window.wootricSettings.created_at, 1420070400);
      });

      it('should set created_at on identify using ISO YYYYMMDD format', function() {
        analytics.identify({
          createdAt: '20150101'
        });
        analytics.equal(window.wootricSettings.created_at, 1420070400);
      });

      it('should set created_at on traits using Unix Timestamp format', function() {
        analytics.identify({
          createdAt: '1420099200000'
        });
        analytics.equal(window.wootricSettings.created_at, 1420099200);
      });

      it('should round Unix Timstamps with a decimal to the nearest whole digit', function() {
        analytics.identify({
          createdAt: '1420099200.435'
        });
        analytics.equal(window.wootricSettings.created_at, 1420099200);
      });

      it('should set language', function() {
        analytics.identify({
          language: 'es'
        });
        analytics.equal(window.wootricSettings.language, 'es');
      });

      it('should set properties based on other traits', function() {
        analytics.identify({
          email: 'shawn@shawnmorgan.com',
          createdAt: '01/01/2015',
          property1: 'foo',
          property2: 'bar'
        });
        analytics.assert(window.wootricSettings.properties.property1 === 'foo');
        analytics.assert(window.wootricSettings.properties.property2 === 'bar');
      });

      it('should omit email and createdAt when setting window.wootricSettings.properties', function() {
        analytics.identify({
          email: 'shawn@shawnmorgan.com',
          createdAt: '01/01/2015',
          property1: 'foo',
          property2: 'bar'
        });
        analytics.assert(!window.wootricSettings.properties.email);
        analytics.assert(!window.wootricSettings.properties.createdAt);
      });
    });
  });
});
