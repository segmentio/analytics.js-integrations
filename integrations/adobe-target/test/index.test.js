'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var AdobeTarget = require('../lib/');

describe('Adobe Target', function() {
  var analytics;
  var adobeTarget;
  var options = {
    cookieDomain: 'https://www.segment.com',
    crossDomain: 'enabled',
    secureOnly: true,
    overrideMboxEdgeServer: true,
    optoutEnabled: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    adobeTarget = new AdobeTarget(options);
    analytics.use(tester);
    analytics.add(adobeTarget);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    adobeTarget.reset();
    sandbox();
  });

  /*
   * Cannot test whether the integration has loaded since customers
   * must include at.js manually. Instead, we always call `ready()` to
   * prevent blocking other integratinos, even if at.js has not been
   * included properly.
   */

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('track', function() {
      beforeEach(function() {
        analytics.stub(window.adobe.target, 'trackEvent');
      });

      it('should send track calls correctly', function() {
        analytics.track(
          'Clicked Experiment',
          {
            color: 'red',
            variation: 1
          },
          {
            'Adobe Target': {
              mboxName: 'experiment'
            }
          }
        );
        analytics.called(window.adobe.target.trackEvent, {
          mbox: 'experiment',
          params: {
            color: 'red',
            variation: 1
          }
        });
      });

      it('should send order completed order calls correctly', function() {
        analytics.track(
          'Order Completed',
          {
            orderId: '12345',
            revenue: 100,
            products: [
              {
                productId: 'abc'
              },
              {
                productId: '123'
              }
            ]
          },
          {
            'Adobe Target': {
              mboxName: 'orderCompleted'
            }
          }
        );
        analytics.called(window.adobe.target.trackEvent, {
          mbox: 'orderCompleted',
          params: {
            orderId: '12345',
            orderTotal: 100,
            productPurchaseId: 'abc,123'
          }
        });
      });

      it('should handle products arrays even if some products have no productId', function() {
        analytics.track(
          'Order Completed',
          {
            orderId: '1029384756',
            revenue: 250,
            products: [
              {
                productId: '123'
              },
              {
                color: 'red'
              },
              {
                color: 'teal'
              },
              {
                productId: '987'
              }
            ]
          },
          {
            'Adobe Target': {
              mboxName: 'submittedOrder'
            }
          }
        );
        analytics.called(window.adobe.target.trackEvent, {
          mbox: 'submittedOrder',
          params: {
            orderId: '1029384756',
            orderTotal: 250,
            productPurchaseId: '123,987'
          }
        });
      });

      it('should not send a standard track without an mbox name', function() {
        analytics.track('Clicked Experiment', {
          color: 'red',
          variation: 1
        });
        analytics.didNotCall(window.adobe.target.trackEvent);
      });

      it('should not send an order completed event without an mbox name', function() {
        analytics.track('Order Completed', {
          orderId: '1029384756',
          revenue: 250,
          products: []
        });
        analytics.didNotCall(window.adobe.target.trackEvent);
      });

      it('should stringify a non-string mbox name', function() {
        analytics.track(
          'Clicked Experiment',
          {
            color: 'red',
            variation: 1
          },
          {
            'Adobe Target': {
              mboxName: 123
            }
          }
        );
        analytics.called(window.adobe.target.trackEvent, {
          mbox: '123',
          params: {
            color: 'red',
            variation: 1
          }
        });
      });
    });
  });
});
