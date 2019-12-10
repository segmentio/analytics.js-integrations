'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Kenshoo = require('../lib/');

describe('Kenshoo', function() {
  var analytics;
  var kenshoo;
  var options = {
    cid: 'd590cb3f-ec81-4da7-97d6-3013ec020455',
    subdomain: '1223'
  };

  beforeEach(function() {
    analytics = new Analytics();
    kenshoo = new Kenshoo(options);
    analytics.use(Kenshoo);
    analytics.use(tester);
    analytics.add(kenshoo);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    kenshoo.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Kenshoo, integration('Kenshoo')
      .global('k_trackevent')
      .option('cid', '')
      .option('events', [])
      .option('subdomain', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(kenshoo, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(kenshoo.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(kenshoo, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'k_trackevent');
      });

      it('should track custom events', function() {
        kenshoo.options.events = ['event'];
        analytics.track('event', {
          revenue: '42',
          orderId: '84',
          coupon: 'promo',
          currency: 'EUR'
        });

        analytics.called(window.k_trackevent, [
          'id=' + options.cid,
          'type=conv',
          'val=42',
          'orderId=84',
          'promoCode=promo',
          'valueCurrency=EUR',
          'GCID=',
          'kw=',
          'product='
        ], options.subdomain);
      });

      it('should not track undefined events', function() {
        analytics.track('random', {
          revenue: '42',
          orderId: '84',
          coupon: 'promo',
          currency: 'EUR'
        });

        analytics.didNotCall(window.k_trackevent);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'k_trackevent');
      });

      it('should not make any event calls', function() {
        analytics.page();
        analytics.didNotCall(window.k_trackevent);
      });
    });
  });
});
