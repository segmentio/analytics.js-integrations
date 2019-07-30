'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var plugin = require('../lib/');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');

describe('Steelhouse', function() {
  var Steelhouse = plugin;
  var steelhouse;
  var analytics;
  var options = {
    advertiserId: '1234',
    events: ['Completed Order', 'Generic Conversion']
  };

  beforeEach(function() {
    analytics = new Analytics();
    Steelhouse.prototype.cacheBuster = function() {
      return 0;
    };
    steelhouse = new Steelhouse(options);
    analytics.use(plugin);
    analytics.use(tester);
    analytics.add(steelhouse);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    steelhouse.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Steelhouse,
      integration('Steelhouse')
        .option('advertiserId', '')
        .mapping('events')
    );
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.spy(steelhouse, 'load');
      });

      it('should always trigger the retargeting pixel', function() {
        var url = encodeURIComponent(window.location.href);
        var referrer = encodeURIComponent(document.referrer);
        analytics.page();
        analytics.loaded(
          '<script src="http://dx.steelhousemedia.com/spx?dxver=4.0.0&shaid=1234&tdr=' +
            referrer +
            '&plh=' +
            url +
            '&cb=0">'
        );
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(steelhouse, 'load');
      });

      it('should not track unmapped events', function() {
        analytics.track('event');
        analytics.didNotCall(steelhouse.load);
      });

      describe('mapped events', function() {
        it('should track basic conversion with ecommerce info', function() {
          var url = encodeURIComponent(window.location.href);
          var referrer = encodeURIComponent(document.referrer);
          analytics.track('Completed Order', {
            orderId: 'asdf',
            total: 123,
            products: [
              {
                id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
              },
              {
                id: '505bd76785ebb509fc183733',
                sku: '46493-32',
                name: 'Uno Card Game',
                price: 3,
                quantity: 2,
                category: 'Games'
              }
            ]
          });
          analytics.loaded(
            '<script src="http://dx.steelhousemedia.com/spx?conv=1&shaid=1234&tdr=' +
              referrer +
              '&plh=' +
              url +
              '&cb=0&shoid=asdf&shoamt=123&shocur=USD&shopid=45790-32,46493-32&shoq=1,2&shoup=19,3&shpil=">'
          );
        });

        it('should still work without ecommerce info', function() {
          var url = encodeURIComponent(window.location.href);
          var referrer = encodeURIComponent(document.referrer);
          analytics.track('Generic Conversion', {
            property: 'test'
          });
          analytics.loaded(
            '<script src="http://dx.steelhousemedia.com/spx?conv=1&shaid=1234&tdr=' +
              referrer +
              '&plh=' +
              url +
              '&cb=0&shoid=&shoamt=&shocur=USD&shopid=&shoq=&shoup=&shpil=">'
          );
        });
      });
    });
  });
});
