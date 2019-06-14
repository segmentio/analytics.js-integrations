'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var JSON = require('json3');
var TvSquared = require('../lib/');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var sinon = require('sinon');
var tester = require('@segment/analytics.js-integration-tester');

describe('TV Squared', function() {
  var analytics;
  var tvSquared;
  var options = {
    brandId: 'TV-81454545-1',
    hostname: 'collector-1555.tvsquared.com',
    customMetrics: [],
    trackWhitelist: []
  };

  beforeEach(function() {
    analytics = new Analytics();
    tvSquared = new TvSquared(options);
    analytics.use(TvSquared);
    analytics.use(tester);
    analytics.add(tvSquared);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    tvSquared.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      TvSquared,
      integration('TV Squared')
        .global('_tvq')
        .option('brandId', '')
        .option('hostname', '')
        .option('clientId', 0)
        .option('customMetrics', [])
        .option('trackWhitelist', [])
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(tvSquared, 'load');
    });

    describe('#initialize', function() {
      it('should initialize the TV Squared variables', function() {
        analytics.assert(!window._tvq);
        tvSquared.initialize();
        tvSquared.page();
        analytics.assert(window._tvq);
      });

      it('should call #load', function() {
        tvSquared.initialize();
        analytics.assert(tvSquared.load.called);
      });
    });

    describe('#loaded', function() {
      it('should check whether the TV Squared library has loaded', function() {
        analytics.assert(!tvSquared.loaded());
        window._tvq = [];
        analytics.assert(tvSquared.loaded());
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(tvSquared, done);
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
        analytics.spy(window._tvq, 'push');
      });

      it('should track named pages by default', function(done) {
        analytics.page('Name');
        analytics.called(window._tvq.push, ['trackPageView']);
        setTimeout(done, 300);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(window._tvq, 'push');
      });

      it('should send a track event', function() {
        // HACK(ndhoule): Should find a better way to set userId
        var userId = '12345';
        analytics.user().anonymousId(userId);

        analytics.track('viewed product', {
          name: 'some-product',
          orderId: '13333',
          revenue: 10,
          promo: 'GABCDEF',
          productType: 'some-type'
        });

        var spy = sinon.spy();
        var tvSquaredMock = {
          setCustomVariable: spy
        };

        // Invoke the functions pushed into window._tvq by #track and spy on them
        window._tvq.push.args[0][0][0].call(tvSquaredMock);
        window._tvq.push.args[1][0][0].call(tvSquaredMock);

        analytics.assert(
          spy
            .getCall(0)
            .calledWith(5, 'session', JSON.stringify({ user: userId }), 'visit')
        );

        analytics.assert(
          spy.getCall(1).calledWith(
            5,
            'viewed product',
            JSON.stringify({
              rev: 10,
              prod: 'some-type',
              id: '13333',
              promo: 'GABCDEF'
            }),
            'page'
          )
        );
      });

      it('should send custom metrics if set', function() {
        // HACK(ndhoule): Should find a better way to set userId
        var userId = '12345';
        analytics.user().anonymousId(userId);

        tvSquared.options.customMetrics = ['customOne', 'customTwo', '']; // FIXME: Intentional blank input to verify it can handle a UI bug.

        analytics.track('viewed product', {
          name: 'some-product',
          orderId: '13333',
          revenue: 10,
          promo: 'GABCDEF',
          productType: 'some-type',
          customOne: 'some-custom-data',
          customTwo: 'some-more-custom-data'
        });

        var spy = sinon.spy();
        var tvSquaredMock = {
          setCustomVariable: spy
        };

        // Invoke the functions pushed into window._tvq by #track and spy on them
        window._tvq.push.args[0][0][0].call(tvSquaredMock);
        window._tvq.push.args[1][0][0].call(tvSquaredMock);

        analytics.assert(
          spy
            .getCall(0)
            .calledWith(5, 'session', JSON.stringify({ user: userId }), 'visit')
        );

        analytics.assert(
          spy.getCall(1).calledWith(
            5,
            'viewed product',
            JSON.stringify({
              rev: 10,
              prod: 'some-type',
              id: '13333',
              promo: 'GABCDEF',
              customOne: 'some-custom-data',
              customTwo: 'some-more-custom-data'
            }),
            'page'
          )
        );
      });

      it('should send not custom metrics if not set', function() {
        // HACK(ndhoule): Should find a better way to set userId
        var userId = '12345';
        analytics.user().anonymousId(userId);

        tvSquared.options.customMetrics = [];

        analytics.track('viewed product', {
          name: 'some-product',
          orderId: '13333',
          revenue: 10,
          promo: 'GABCDEF',
          productType: 'some-type',
          customOne: 'some-custom-data', // Sending data that should be ignored.
          customTwo: 'some-more-custom-data'
        });

        var spy = sinon.spy();
        var tvSquaredMock = {
          setCustomVariable: spy
        };

        // Invoke the functions pushed into window._tvq by #track and spy on them
        window._tvq.push.args[0][0][0].call(tvSquaredMock);
        window._tvq.push.args[1][0][0].call(tvSquaredMock);

        analytics.assert(
          spy
            .getCall(0)
            .calledWith(5, 'session', JSON.stringify({ user: userId }), 'visit')
        );

        analytics.assert(
          spy.getCall(1).calledWith(
            5,
            'viewed product',
            JSON.stringify({
              rev: 10,
              prod: 'some-type',
              id: '13333',
              promo: 'GABCDEF'
            }),
            'page'
          )
        );
      });

      it('should send whitelisted events if a whitelist is defined', function() {
        // HACK(ndhoule): Should find a better way to set userId
        var userId = '12345';
        analytics.user().anonymousId(userId);

        tvSquared.options.customMetrics = [];
        tvSquared.options.trackWhitelist = ['Ate Pie', 'Viewed Product'];

        analytics.track('viewed product', {
          name: 'some-product',
          orderId: '13333',
          revenue: 10,
          promo: 'GABCDEF',
          productType: 'some-type'
        });

        var spy = sinon.spy();
        var tvSquaredMock = {
          setCustomVariable: spy
        };

        // Invoke the functions pushed into window._tvq by #track and spy on them
        window._tvq.push.args[0][0][0].call(tvSquaredMock);
        window._tvq.push.args[1][0][0].call(tvSquaredMock);

        analytics.assert(
          spy
            .getCall(0)
            .calledWith(5, 'session', JSON.stringify({ user: userId }), 'visit')
        );

        analytics.assert(
          spy.getCall(1).calledWith(
            5,
            'viewed product',
            JSON.stringify({
              rev: 10,
              prod: 'some-type',
              id: '13333',
              promo: 'GABCDEF'
            }),
            'page'
          )
        );
      });

      it('should not send non-whitelisted events if a whitelist is defined', function() {
        // HACK(ndhoule): Should find a better way to set userId
        var userId = '12345';
        analytics.user().anonymousId(userId);

        tvSquared.options.customMetrics = [];
        tvSquared.options.trackWhitelist = [
          'Completed Order',
          'Finished Video'
        ];

        analytics.track('some completely random event no one would ever use', {
          name: 'some-product',
          orderId: '13333',
          revenue: 10,
          promo: 'GABCDEF',
          productType: 'some-type'
        });

        // There should not be any functions defined, thus only 3 elements in the _tvq array.
        analytics.assert(window._tvq.length === 3);
      });

      it('should send all events if no whitelist is defined', function() {
        // HACK(ndhoule): Should find a better way to set userId
        var userId = '12345';
        analytics.user().anonymousId(userId);

        tvSquared.options.customMetrics = [];
        tvSquared.options.trackWhitelist = ['']; // Test a UI bug where an empty string is sent for an otherwise empty array.

        analytics.track('some completely random event no one would ever use', {
          name: 'some-product',
          orderId: '13333',
          revenue: 10,
          promo: 'GABCDEF',
          productType: 'some-type'
        });

        var spy = sinon.spy();
        var tvSquaredMock = {
          setCustomVariable: spy
        };

        // Invoke the functions pushed into window._tvq by #track and spy on them
        window._tvq.push.args[0][0][0].call(tvSquaredMock);
        window._tvq.push.args[1][0][0].call(tvSquaredMock);

        analytics.assert(
          spy
            .getCall(0)
            .calledWith(5, 'session', JSON.stringify({ user: userId }), 'visit')
        );

        analytics.assert(
          spy.getCall(1).calledWith(
            5,
            'some completely random event no one would ever use',
            JSON.stringify({
              rev: 10,
              prod: 'some-type',
              id: '13333',
              promo: 'GABCDEF'
            }),
            'page'
          )
        );
      });
    });
  });
});
