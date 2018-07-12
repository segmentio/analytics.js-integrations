'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var plugin = require('../lib/');
var sandbox = require('@segment/clear-env');
var fmt = require('@segment/fmt');
var each = require('@ndhoule/each');

describe('Yellowhammer', function() {
  var Yellowhammer = plugin;
  var yellowhammer;
  var analytics;
  var options = {
    segmentId: '2495501',
    events: [
      {
        key: 'testEvent1',
        value: {
          event: 'testEvent1',
          omnitargetId: 'tr115346',
          pixelId: '496787'
        }
      }
    ]
  };

  beforeEach(function() {
    analytics = new Analytics();
    yellowhammer = new Yellowhammer(options);
    analytics.use(plugin);
    analytics.use(tester);
    analytics.add(yellowhammer);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    yellowhammer.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(Yellowhammer, integration('Yellowhammer')
      .option('segmentId', ''));
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.spy(yellowhammer, 'load');
      });

      it('should load the pixel on every page', function() {
        analytics.page();
        analytics.loaded(fmt('<script src="https://secure.adnxs.com/seg?add=%s&t=1"/>', options.segmentId));
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(yellowhammer, 'load');
      });

      it('should not send if event is not defined', function() {
        analytics.track('toString', {});
        analytics.didNotCall(yellowhammer.load);
      });

      it('should send event if found', function(done) {
        analytics.identify('u12345');
        analytics.track('testEvent1', { revenue: 10, orderId: '12345' });
        var event = options.events[0].value;
        var loadedFirstTag = false;
        var loadedSecondTag = false;
        var integration = analytics.integration();
        each(function(el) {
          if (el.src === 'https://jump.omnitarget.com/' + event.omnitargetId + '?customer_id=u12345&order_revenue=10.00&order_id=12345') {
            loadedFirstTag = true;
          }

          if (el.src === 'https://secure.adnxs.com/px?id=' + event.pixelId + '&value=10.00&t=1') {
            loadedSecondTag = true;
          }
          done();
        }, integration.load.returns);
        analytics.assert(loadedFirstTag);
        analytics.assert(loadedSecondTag);
      });
    });
  });
});
