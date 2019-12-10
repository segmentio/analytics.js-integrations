'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Facebook = require('../lib/');

describe('Facebook Conversion Tracking', function() {
  var analytics;
  var facebook;
  var options = {
    events: {
      signup: 0,
      login: 1,
      play: 2,
      'Loaded a Page': 3,
      'Viewed Name Page': 4,
      'Viewed Category Name Page': 5
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    facebook = new Facebook(options);
    analytics.use(Facebook);
    analytics.use(tester);
    analytics.add(facebook);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    facebook.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(
      Facebook,
      integration('Facebook Conversion Tracking')
        .option('currency', 'USD')
        .mapping('events')
    );
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(facebook, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._fbq, 'push');
      });

      it('should track unnamed/categorized page', function() {
        analytics.page({ url: 'http://localhost:34448/test/' });
        analytics.called(window._fbq.push, [
          'track',
          3,
          {
            currency: 'USD',
            value: '0.00'
          }
        ]);
      });

      it('should track un-categorized page', function() {
        analytics.page('Name', { url: 'http://localhost:34448/test/' });
        analytics.called(window._fbq.push, [
          'track',
          4,
          {
            currency: 'USD',
            value: '0.00'
          }
        ]);
      });

      it('should track page view with fullname', function() {
        analytics.page('Category', 'Name', {
          url: 'http://localhost:34448/test/'
        });
        analytics.called(window._fbq.push, [
          'track',
          5,
          {
            currency: 'USD',
            value: '0.00'
          }
        ]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._fbq, 'push');
      });

      it('should send event if found', function() {
        analytics.track('signup', {});
        analytics.called(window._fbq.push, [
          'track',
          0,
          {
            currency: 'USD',
            value: '0.00'
          }
        ]);
      });

      it('should support array events', function() {
        facebook.options.events = [{ key: 'event', value: 4 }];
        analytics.track('event');
        analytics.called(window._fbq.push, [
          'track',
          4,
          {
            currency: 'USD',
            value: '0.00'
          }
        ]);
      });

      it('should send revenue', function() {
        analytics.track('login', { revenue: '$50' });
        analytics.called(window._fbq.push, [
          'track',
          1,
          {
            value: '50.00',
            currency: 'USD'
          }
        ]);
      });
    });
  });
});
