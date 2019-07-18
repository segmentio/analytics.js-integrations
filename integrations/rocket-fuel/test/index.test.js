'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var RocketFuel = require('../lib/');

describe('Rocket Fuel', function() {
  var analytics;
  var rocketFuel;
  var options = {
    accountId: 'advertiser',
    universalActionId: '1999',
    events: {
      conversion: 1989,
      'completed order': 1979
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    RocketFuel.prototype.cacheBuster = function() {
      return 0;
    };
    rocketFuel = new RocketFuel(options);
    analytics.use(RocketFuel);
    analytics.use(tester);
    analytics.add(rocketFuel);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    rocketFuel.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      RocketFuel,
      integration('Rocket Fuel')
        .option('accountId', '')
        .option('universalActionId', '')
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
        analytics.spy(rocketFuel, 'load');
      });

      it('should trigger the universal pixel with new user', function() {
        analytics.page();
        analytics.loaded(
          '<img src="http://1999p.rfihub.com/ca.gif?rb=advertiser&ca=1999&ra=0&custtype=new"/>'
        );
      });

      it('should trigger the universal pixel if there is an existing user', function() {
        analytics.identify('userId');
        analytics.page();
        analytics.loaded(
          '<img src="http://1999p.rfihub.com/ca.gif?rb=advertiser&ca=1999&ra=0&custtype=existing"/>'
        );
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(rocketFuel, 'load');
      });

      it('should not track unmapped events', function() {
        analytics.track('event');
        analytics.didNotCall(rocketFuel.load);
      });

      describe('mapped events', function() {
        it('should track basic conversions', function() {
          analytics.track('conversion');
          analytics.loaded(
            '<img src="http://p.rfihub.com/ca.gif?rb=advertiser&ca=1989&ra=0"/>'
          );
        });

        it('should track completed order conversions with orderId, total and product ids', function() {
          analytics.track('completed order', {
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
            '<img src="http://p.rfihub.com/ca.gif?rb=advertiser&ca=1979&ra=0&transid=asdf&revenue=123.00&pid=507f1f77bcf86cd799439011,505bd76785ebb509fc183733"/>'
          );
        });
      });
    });
  });
});
