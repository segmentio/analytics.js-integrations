'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Awesm = require('../lib/');

describe('awe.sm', function() {
  var analytics;
  var awesm;
  var options = {
    apiKey: '5c8b1a212434c2153c2f2c2f2c765a36140add243bf6eae876345f8fd11045d9',
    events: { event: 'goal_1' }
  };

  beforeEach(function() {
    analytics = new Analytics();
    awesm = new Awesm(options);
    analytics.use(Awesm);
    analytics.use(tester);
    analytics.add(awesm);
    // Turn off Awesm's automatic data capturing to prevent JSONP requests from
    // breaking other tests
    window.AWESMEXTRA = { capture_data: false };
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    awesm.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Awesm, integration('awe.sm')
      .assumesPageview()
      .global('AWESM')
      .option('apiKey', '')
      .mapping('events'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(awesm, 'load');
    });

    describe('#initialize', function() {
      it('should pass options to awe.sm', function() {
        analytics.initialize();
        analytics.page();
        analytics.equal(window.AWESM.api_key, options.apiKey);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(awesm.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(awesm, done);
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
        analytics.stub(window.AWESM, 'convert');
      });

      it('should convert an event to a goal', function() {
        analytics.track('event');
        analytics.called(window.AWESM.convert, 'goal_1', 0);
      });

      it('should not convert an unknown event', function() {
        analytics.track('unknown');
        analytics.didNotCall(window.AWESM.convert);
      });

      it('should support array events', function() {
        awesm.options.events = [{ key: 'event', value: 'goal_2' }];
        analytics.track('event', { value: 2 });
        analytics.called(window.AWESM.convert, 'goal_2', 2);
      });

      it('should accept a value property', function() {
        analytics.track('event', { value: 1 });
        analytics.called(window.AWESM.convert, 'goal_1', 1);
      });

      it('should prefer and convert a revenue property', function() {
        analytics.track('event', { value: 1, revenue: '$42.99' });
        analytics.called(window.AWESM.convert, 'goal_1', 4299);
      });
    });
  });
});
