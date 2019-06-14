'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var KenshooInfinity = require('../lib');

describe('Kenshoo Infinity', function() {
  var analytics;
  var kenshooInfinity;
  var options = {
    subdomain: '100',
    cid: 'aaaf012d‐40e4‐4e61‐8d1d‐14e332bda917',
    events: {
      'party monster': 'the weeknd is here',
      starboy: 'stargirl'
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    kenshooInfinity = new KenshooInfinity(options);
    analytics.use(KenshooInfinity);
    analytics.use(tester);
    analytics.add(kenshooInfinity);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    kenshooInfinity.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(
      KenshooInfinity,
      integration('Kenshoo Infinity')
        .option('subdomain', '')
        .option('cid', '')
        .mapping('events')
    );
  });

  describe('loading', function() {
    beforeEach(function() {
      analytics.stub(window, 'kenshoo');
      analytics.initialize();
    });

    it('should load', function(done) {
      analytics.load(kenshooInfinity, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.kenshoo, 'trackConversion');
      });

      it('should not fire tags for unmapped events', function() {
        analytics.track('true colors');
        analytics.didNotCall(window.kenshoo.trackConversion);
      });

      it('should fire a basic tag for mapped events', function() {
        analytics.track('starboy', {
          revenue: 17.38,
          currency: 'KOR',
          orderId: 'yolo'
        });
        analytics.called(
          window.kenshoo.trackConversion,
          options.subdomain,
          options.cid,
          {
            revenue: '17.38',
            currency: 'KOR',
            conversionType: 'stargirl',
            orderId: 'yolo'
          }
        );
      });

      it('should lookup promoCode in integration options', function() {
        analytics.track(
          'starboy',
          {
            revenue: 17.38,
            currency: 'KOR',
            orderId: 'yolo'
          },
          {
            'Kenshoo Infinity': { promoCode: 'attention' }
          }
        );
        analytics.called(
          window.kenshoo.trackConversion,
          options.subdomain,
          options.cid,
          {
            revenue: '17.38',
            currency: 'KOR',
            conversionType: 'stargirl',
            orderId: 'yolo',
            promoCode: 'attention'
          }
        );
      });

      it('should let you map custom properties', function() {
        analytics.track('starboy', {
          customProp1: 'hahahaha',
          custom_prop2: 'hehehehe'
        });
        analytics.called(
          window.kenshoo.trackConversion,
          options.subdomain,
          options.cid,
          {
            revenue: '0',
            currency: 'USD',
            conversionType: 'stargirl',
            customProp1: 'hahahaha',
            custom_prop2: 'hehehehe'
          }
        );
      });

      it('should format custom properties properly', function() {
        // Sort keys alphabetically and take the first 15
        // Replace all whitespace with underscores
        // Remove all non-alphanumeric/non-underscores
        analytics.track('starboy', {
          'convert spaces': 'hi',
          'to underscores': 'hey',
          camelCaseisFine: 'yo',
          '$starboy%^&@#': 'suh dude',
          dont_remove_underscores: 'dude',
          filler1: 'foo',
          filler2: 'foo',
          filler3: 'foo',
          filler4: 'foo',
          filler5: 'foo',
          filler6: 'foo',
          filler7: 'foo',
          filler8: 'foo',
          filler9: 'foo',
          filler10: 'foo',
          'z-remove-dis': 'bye'
        });
        analytics.called(
          window.kenshoo.trackConversion,
          options.subdomain,
          options.cid,
          {
            revenue: '0',
            currency: 'USD',
            conversionType: 'stargirl',
            convert_spaces: 'hi',
            to_underscores: 'hey',
            camelCaseisFine: 'yo',
            starboy: 'suh%20dude',
            dont_remove_underscores: 'dude',
            filler1: 'foo',
            filler2: 'foo',
            filler3: 'foo',
            filler4: 'foo',
            filler5: 'foo',
            filler6: 'foo',
            filler7: 'foo',
            filler8: 'foo',
            filler9: 'foo',
            filler10: 'foo'
          }
        );
      });

      it('should flatten all nested arrays or objects for custom properties', function() {
        analytics.track('starboy', {
          i: { am: 'stargirl' },
          alarm: [1, 2, 3],
          whoa: ['dude', { stop: 'this' }]
        });
        analytics.called(
          window.kenshoo.trackConversion,
          options.subdomain,
          options.cid,
          {
            revenue: '0',
            currency: 'USD',
            conversionType: 'stargirl',
            i_am: 'stargirl',
            alarm: '1%2C2%2C3',
            whoa_0: 'dude',
            whoa_1_stop: 'this'
          }
        );
      });

      it('should encode all string values', function() {
        analytics.track('starboy', {
          encodeDis: 'all your base belongs to us'
        });
        analytics.called(
          window.kenshoo.trackConversion,
          options.subdomain,
          options.cid,
          {
            revenue: '0',
            currency: 'USD',
            conversionType: 'stargirl',
            encodeDis: 'all%20your%20base%20belongs%20to%20us'
          }
        );
      });

      describe('character limitations', function() {
        it('conversionType must not be over 100', function() {
          // (Note that an array of length 11 gets you only 10 "a"s, since Array.join puts the argument between the array elements.)
          var str = Array(102).join('x');
          kenshooInfinity.options.events.tooLong = str;
          analytics.track('tooLong');
          var expectedLength =
            window.kenshoo.trackConversion.args[0][2].conversionType.length;
          analytics.equal(expectedLength, 100);
        });

        it('orderId must not be over 64', function() {
          var str = Array(66).join('x');
          analytics.track('starboy', { orderId: str });
          var expectedLength =
            window.kenshoo.trackConversion.args[0][2].orderId.length;
          analytics.equal(expectedLength, 64);
        });

        it('promoCode must not be over 1024', function() {
          var str = Array(1026).join('x');
          analytics.track(
            'starboy',
            {},
            {
              'Kenshoo Infinity': { promoCode: str }
            }
          );
          var expectedlength =
            window.kenshoo.trackConversion.args[0][2].promoCode.length;
          analytics.equal(expectedlength, 1024);
        });

        it('keys should not be longer than 100', function() {
          var str = Array(102).join('x');
          var props = {};
          props[str] = 'toolong';
          analytics.track('starboy', props);
          var args = window.kenshoo.trackConversion.args[0][2];
          var expected = Array(101).join('x');
          analytics.assert(args[expected]);
          analytics.assert(!args[str]);
        });

        it('custom property values should not be longer than 1024', function() {
          var str = Array(1026).join('x');
          analytics.track('starboy', { custom: str });
          var expectedLength =
            window.kenshoo.trackConversion.args[0][2].custom.length;
          analytics.equal(expectedLength, 1024);
        });
      });
    });
  });
});
