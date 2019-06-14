'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var AppNexus = require('../lib/');

describe('AppNexus', function() {
  var appnexus;
  var analytics;
  var options = {
    events: [
      {
        key: 'testEvent1',
        value: {
          event: 'testEvent1',
          segmentId: '45',
          pixelId: '44',
          parameters: {
            accountId: 'order_id',
            special: 'spcl'
          }
        }
      },
      {
        key: 'testEvent2',
        value: {
          event: 'testEvent2',
          pixelId: '44',
          segmentId: '45',
          parameters: {}
        }
      }
    ]
  };

  beforeEach(function() {
    analytics = new Analytics();
    appnexus = new AppNexus(options);
    analytics.use(AppNexus);
    analytics.use(tester);
    analytics.add(appnexus);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    appnexus.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(AppNexus, integration('AppNexus'));
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(appnexus, 'load');
      });

      describe('conversion track', function() {
        it('should load the right script', function() {
          analytics.track('testEvent2', { orderId: 123, revenue: 42 });
          analytics.loaded(
            '<script src="http://ib.adnxs.com/px?t=1&id=44&seg=45&order_id=123&value=42.00">'
          );
        });

        it('should send value formatted with 2 decimals', function() {
          analytics.track('testEvent2', { orderId: 123, revenue: 42.123 });
          analytics.loaded(
            '<script src="http://ib.adnxs.com/px?t=1&id=44&seg=45&order_id=123&value=42.12">'
          );
        });

        it('should send total if available formatted with 2 decimals', function() {
          analytics.track('testEvent2', { orderId: '307d020e', total: 599 });
          analytics.loaded(
            '<script src="http://ib.adnxs.com/px?t=1&id=44&seg=45&order_id=307d020e&value=599.00">'
          );
        });

        it('should send parameters properly overriding and added', function() {
          analytics.track('testEvent1', {
            accountId: 'asdfasdf',
            total: 599,
            special: 998
          });
          analytics.loaded(
            '<script src="http://ib.adnxs.com/px?t=1&id=44&seg=45&order_id=asdfasdf&value=599.00&spcl=998">'
          );
        });
      });
    });
  });
});
