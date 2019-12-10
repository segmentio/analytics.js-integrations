'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Nanigans = require('../lib/');

describe('Nanigans', function() {
  var nanigans;
  var analytics;
  var options = {
    appId: 123,
    events: [
      {
        key: 'testEvent1',
        value: {
          type: 'user',
          name: 'invite'
        }
      },
      {
        key: 'testEvent1',
        value: {
          type: 'user',
          name: 'register'
        }
      },
      {
        key: 'Order Completed',
        value: {
          type: 'purchase',
          name: 'main'
        }
      },
      {
        key: 'Watched Game',
        value: {
          type: 'visit',
          name: 'Watched {{ properties.league }} {{ properties.sport }} Game'
        }
      }
    ]
  };

  beforeEach(function() {
    analytics = new Analytics();
    nanigans = new Nanigans(options);
    analytics.use(Nanigans);
    analytics.use(tester);
    analytics.add(nanigans);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    nanigans.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(Nanigans, integration('Nanigans')
      .option('appId', ''));
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.spy(nanigans, 'load');
      });

      it('should send page views', function() {
        analytics.page('My Event');
        analytics.loaded('<img src="http://api.nanigans.com/event.php?app_id=123&type=visit&name=landing">');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(nanigans, 'load');
        analytics.assert(analytics.user().id() == null);
      });

      it('should not track if user id is missing', function() {
        nanigans.options.events = { event: 'mappedEvent' };
        analytics.track('event');
        analytics.didNotCall(nanigans.load);
      });

      it('should not track unnamed event', function() {
        analytics.user().id('id');
        analytics.track('event');
        analytics.didNotCall(nanigans.load);
      });

      it('should track named event', function() {
        analytics.user().id('id');
        analytics.user().traits({ email: 'email@example.com' });
        analytics.track('testEvent1');
        analytics.loaded('<img src="http://api.nanigans.com/event.php?app_id=123&type=user&name=invite&user_id=id&ut1=2a539d6520266b56c3b0c525b9e6128858baeccb5ee9b694a2906e123c8d6dd3">');
      });

      it('should track named event even without a userId', function() {
        analytics.user().id(null);
        analytics.user().traits({ email: 'email@example.com' });
        analytics.track('testEvent1');
        analytics.loaded('<img src="http://api.nanigans.com/event.php?app_id=123&type=user&name=invite&ut1=2a539d6520266b56c3b0c525b9e6128858baeccb5ee9b694a2906e123c8d6dd3">');
      });

      it('should interpolate mapped event name template strings', function() {
        analytics.user().id('id');
        analytics.user().traits({ email: 'email@example.com' });
        analytics.track('Watched Game', { league: 'NFL', sport: 'Football' });
        analytics.loaded('<img src="http://api.nanigans.com/event.php?app_id=123&type=visit&name=Watched%20NFL%20Football%20Game&user_id=id&ut1=2a539d6520266b56c3b0c525b9e6128858baeccb5ee9b694a2906e123c8d6dd3">');
      });

      it('should track multiple events', function() {
        analytics.user().id('id');
        analytics.user().traits({ email: 'email@example.com' });
        analytics.track('testEvent1');
        analytics.loaded('<img src="http://api.nanigans.com/event.php?app_id=123&type=user&name=invite&user_id=id&ut1=2a539d6520266b56c3b0c525b9e6128858baeccb5ee9b694a2906e123c8d6dd3">');
        analytics.loaded('<img src="http://api.nanigans.com/event.php?app_id=123&type=user&name=register&user_id=id&ut1=2a539d6520266b56c3b0c525b9e6128858baeccb5ee9b694a2906e123c8d6dd3">');
      });

      it('should send Order Completed if the user has an id', function() {
        analytics.user().id('id');
        analytics.user().traits({ email: 'email@example.com' });

        analytics.track('Order Completed', {
          orderId: '2f2bfd58',
          total: 19.98,
          tax: 0,
          shipping: 0,
          products: [{
            name: 'sony pulse',
            sku: 'f9bf17a9',
            quantity: 1,
            price: 9.99
          }, {
            name: 'ps4',
            sku: 'de96f84c',
            quantity: 1,
            price: 9.99
          }]
        });

        analytics.loaded('<img src="' + encodeURI('http://api.nanigans.com/event.php'
          + '?app_id=123'
          + '&type=purchase'
          + '&name=main'
          + '&user_id=id'
          + '&ut1=2a539d6520266b56c3b0c525b9e6128858baeccb5ee9b694a2906e123c8d6dd3'
          + '&unique=2f2bfd58'
          + '&qty[0]=1'
          + '&qty[1]=1'
          + '&value[0]=9.99'
          + '&value[1]=9.99'
          + '&sku[0]=f9bf17a9'
          + '&sku[1]=de96f84c') + '">');
      });

      it('should send Order Completed if the user does not have an id', function() {
        analytics.user().traits({ email: 'email@example.com' });

        analytics.track('Order Completed', {
          orderId: '2f2bfd58',
          total: 19.98,
          tax: 0,
          shipping: 0,
          products: [{
            name: 'sony pulse',
            sku: 'f9bf17a9',
            quantity: 1,
            price: 9.99
          }, {
            name: 'ps4',
            sku: 'de96f84c',
            quantity: 1,
            price: 9.99
          }]
        });

        analytics.loaded('<img src="' + encodeURI('http://api.nanigans.com/event.php'
          + '?app_id=123'
          + '&type=purchase'
          + '&name=main'
          + '&ut1=2a539d6520266b56c3b0c525b9e6128858baeccb5ee9b694a2906e123c8d6dd3'
          + '&unique=2f2bfd58'
          + '&qty[0]=1'
          + '&qty[1]=1'
          + '&value[0]=9.99'
          + '&value[1]=9.99'
          + '&sku[0]=f9bf17a9'
          + '&sku[1]=de96f84c') + '">');
      });
    });
  });
});
