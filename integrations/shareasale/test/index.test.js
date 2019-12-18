'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var ShareASale = require('../lib/');

describe('ShareASale', function() {
  var analytics;
  var shareasale;
  var options = {
    merchantId: 'bonobos',
    createLeads: true,
    useTotalAsAmount: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    shareasale = new ShareASale(options);
    analytics.use(ShareASale);
    analytics.use(tester);
    analytics.add(shareasale);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    shareasale.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      ShareASale,
      integration('ShareASale').option('merchantId', '')
    );
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(shareasale, 'load');
      });

      it('should track order completed', function() {
        analytics.track('order completed', {
          orderId: 123,
          subtotal: 42,
          shipping: 10,
          tax: 3.5,
          total: 55.5
        });
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=42.00&tracking=123&transtype=sale&merchantID=bonobos&skulist=&quantitylist=&pricelist=&currency=USD&couponcode=">'
        );
      });

      it('should use total as amount if enabled', function() {
        shareasale.options.useTotalAsAmount = true;
        analytics.track('order completed', {
          orderId: 123,
          subtotal: 42,
          shipping: 10,
          tax: 3.5,
          total: 55.5,
          revenue: 15
        });
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=55.50&tracking=123&transtype=sale&merchantID=bonobos&skulist=&quantitylist=&pricelist=&currency=USD&couponcode=">'
        );
      });

      it('should not track any other event', function() {
        analytics.track('event', {
          orderId: 123,
          subtotal: 42,
          shipping: 10,
          tax: 3.5,
          total: 55.5
        });
        analytics.didNotCall(shareasale.load);
      });

      it('should calculate order total', function() {
        analytics.track('order completed', {
          orderId: 123,
          shipping: 10,
          tax: 3.5,
          total: 55.5
        });
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=42.00&tracking=123&transtype=sale&merchantID=bonobos&skulist=&quantitylist=&pricelist=&currency=USD&couponcode=">'
        );
      });

      it('should update the tag if a customer is new', function() {
        analytics.track('order completed', {
          orderId: 123,
          shipping: 10,
          tax: 3.5,
          total: 55.5,
          repeat: false
        });
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=42.00&tracking=123&transtype=sale&merchantID=bonobos&newcustomer=1&skulist=&quantitylist=&pricelist=&currency=USD&couponcode=">'
        );
      });

      it('should update the tag if a customer is returning', function() {
        analytics.track('order completed', {
          orderId: 123,
          shipping: 10,
          tax: 3.5,
          total: 55.5,
          repeat: true
        });
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=42.00&tracking=123&transtype=sale&merchantID=bonobos&newcustomer=0&skulist=&quantitylist=&pricelist=&currency=USD&couponcode=">'
        );
      });

      it('should not update the tag if repeat is not a boolean', function() {
        analytics.track('order completed', {
          orderId: 123,
          shipping: 10,
          tax: 3.5,
          total: 55.5,
          repeat: 'true'
        });
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=42.00&tracking=123&transtype=sale&merchantID=bonobos&skulist=&quantitylist=&pricelist=&currency=USD&couponcode=">'
        );
      });

      it('should calculate order total from total not including discount', function() {
        analytics.track('order completed', {
          orderId: 123,
          discount: 5,
          shipping: 10,
          tax: 3.5,
          total: 55.5
        });
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=42.00&tracking=123&transtype=sale&merchantID=bonobos&skulist=&quantitylist=&pricelist=&currency=USD&couponcode=">'
        );
      });

      it('should calculate order total from subtotal including discount', function() {
        analytics.track('order completed', {
          orderId: 123,
          discount: 5,
          shipping: 10,
          tax: 3.5,
          subtotal: 55.5
        });
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=50.50&tracking=123&transtype=sale&merchantID=bonobos&skulist=&quantitylist=&pricelist=&currency=USD&couponcode=">'
        );
      });

      it('should add products', function() {
        analytics.track('order completed', {
          orderId: 123,
          shipping: 10,
          tax: 3.5,
          total: 55.5,
          products: [
            { sku: 'sku1', quantity: 4, price: 5 },
            { sku: 'sku2', quantity: 2, price: 11 }
          ]
        });
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=42.00&tracking=123&transtype=sale&merchantID=bonobos&skulist=sku1,sku2&quantitylist=4,2&pricelist=5,11&currency=USD&couponcode=">'
        );
      });

      it('should track with right amount', function() {
        analytics.track('order completed', {
          affiliation: 'Subscription, Subscription First Order',
          category: 'EnhancedEcommerce',
          checkoutId: null,
          coupon: '',
          currency: 'USD',
          discount: 0,
          orderId: 1284,
          products: [
            {
              brand: "Z's&co.",
              category: 'orangebrightyellow',
              name: 'Off The Clock 28 day subscription (Ships every 28 Days)',
              price: '59.00',
              productId: 'SUPCAP-OFFT-1M',
              quantity: 1,
              variant: 'A'
            }
          ],
          revenue: 64.01,
          sentFrom: 'Littledata app',
          shipping: 0,
          tax: 5.01,
          total: 69.02000000000001
        });
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=64.01&tracking=1284&transtype=sale&merchantID=bonobos&skulist=&quantitylist=1&pricelist=59.00&currency=USD&couponcode=">'
        );
      });

      it('should identify leads', function() {
        analytics.identify(123);
        analytics.loaded(
          '<img src="https://shareasale.com/sale.cfm?amount=0.00&tracking=123&transtype=lead&merchantID=bonobos">'
        );
      });

      it('shouldn not identify leads without a userID', function() {
        analytics.identify();
        analytics.didNotCall(shareasale.load);
      });
    });
  });
});
