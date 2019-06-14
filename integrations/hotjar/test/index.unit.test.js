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
    hjid: 485778,
    hjPlaceholderPolyfill: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    hotjar = new Hotjar(options);
    analytics.use(Hotjar);
    analytics.use(Tester);
    analytics.add(hotjar);

    customOptions = {
      hjid: 485778,
      hjPlaceholderPolyfill: false
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
          .option('hjPlaceholderPolyfill', true)
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
        hjsv: 5,
        hjPlaceholderPolyfill: true
      });
      analytics.assert(typeof window.hj === 'function');
    });

    it('should reject an invalid HJID', function() {
      customOptions.hjid = NaN;
      testInvalidInitialize(customOptions);
    });

    it('should reject an invalid hjPlaceholderPolyfill boolean', function() {
      customOptions.hjPlaceholderPolyfill = 1;
      testInvalidInitialize(customOptions);
    });

    function testInvalidInitialize(invalidOptions) {
      hotjar.options = invalidOptions;
      analytics.stub(hotjar, 'ready');
      hotjar.initialize();
      analytics.didNotCall(hotjar.ready);
    }
  });
});
