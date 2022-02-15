/*
 * These are the unit tests for the integration. They should NOT test the network nor any
 * remote third-party functionality - only that the local code acts and runs as expected.
 */

'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var Integration = require('@segment/analytics.js-integration');
var Sandbox = require('@segment/clear-env');
var Tester = require('@segment/analytics.js-integration-tester');
var Hotjar = require('../lib/');

describe('Hotjar Unit', function() {
  var analytics;
  var hotjar;
  var customOptions;
  var options = {
    hjid: 485778
  };

  beforeEach(function() {
    analytics = new Analytics();
    hotjar = new Hotjar(options);
    analytics.use(Hotjar);
    analytics.use(Tester);
    analytics.add(hotjar);

    customOptions = {
      hjid: 485778
    };
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    hotjar.reset();
    Sandbox();
  });

  describe('Constructing the integration', function() {
    it('should have the right settings', function() {
      analytics.compare(
        Hotjar,
        Integration('Hotjar')
          .option('hjid', null)
      );
    });

    it('should have the right settings with custom options', function() {
      hotjar = new Hotjar(customOptions); // Intentionally creating a new Hotjar integration here to not simply compare the object to itself.

      analytics.deepEqual(hotjar.options, customOptions);
    });
  });

  describe('#initialize', function() {
    it('should call this.ready() with valid options', function() {
      analytics.stub(hotjar, 'ready');
      hotjar.initialize();
      analytics.called(hotjar.ready);
    });

    it('should prepare the needed globals', function() {
      hotjar.initialize();
      analytics.deepEqual(window._hjSettings, {
        hjid: options.hjid,
        hjsv: 6
      });
      analytics.assert(typeof window.hj === 'function');
    });

    it('should reject an invalid HJID', function() {
      customOptions.hjid = NaN;
      testInvalidInitialize(customOptions);
    });

    function testInvalidInitialize(invalidOptions) {
      hotjar.options = invalidOptions;
      analytics.stub(hotjar, 'ready');
      hotjar.initialize();
      analytics.didNotCall(hotjar.ready);
    }
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(hotjar, 'debug');
        analytics.stub(window, 'hj');
      });

      afterEach(function() {
        analytics.reset();
      });

      it('should send id and traits', function() {
        analytics.stub(window, 'hj');
        var id = 'id';
        var traits = { a: 'a', b: 'b', c: [] };
        analytics.identify(id, traits);
        analytics.called(window.hj, 'identify', id, traits);
      });

      it('should not send attributes when user is anonymous', function() {
        var traits = { a: 'a', b: 'b', c: [] };
        analytics.identify(undefined, traits);

        analytics.called(hotjar.debug, 'user id is required');
        analytics.didNotCall(window.hj);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(hotjar, 'debug');
        analytics.stub(window, 'hj');
      });

      afterEach(function() {
        analytics.reset();
      });

      it('should send event and ignore properties', function() {
        analytics.stub(window, 'hj');
        var event = 'the_event';
        var properties = { a: 'a', b: 'b', c: [] };
        analytics.track(event, properties);
        analytics.called(window.hj, 'event', event);
        analytics.didNotCall(window.hj, 'event', event, properties);
      });

      it('should not send nameless event', function() {
        var properties = { a: 'a', b: 'b', c: [] };
        analytics.track(undefined, properties);

        analytics.called(hotjar.debug, 'event name is required');
        analytics.didNotCall(window.hj);
      });
    });
  });
});
