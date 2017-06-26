'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var Floodlight = require('../lib');
var sinon = require('sinon');

describe('DoubleClick Floodlight', function() {
  var floodlight;
  var analytics;
  var options = {
    source: '654757884637545',
    events: [
      {
        key: 'Watched Westworld',
        value: {
          event: 'Watched Westworld',
          cat: 'activityTag',
          type: 'groupTag',
          customVariable: [
            {
              key: 'favoriteCharacter',
              value: 'u1'
            },
            {
              key: 'episode',
              value: 'u2'
            }
          ],
          isSalesTag: false,
          ordKey: null
        }
      },
      {
        key: 'Goodbye Pablo',
        value: {
          event: 'Goodbye Pablo',
          cat: 'activityTag',
          type: 'groupTag',
          customVariable: [],
          isSalesTag: false,
          ordKey: null
        }
      },
      {
        key: 'Viewed Confirmation Page',
        value: {
          event:'Viewed Confirmation Page',
          cat: 'activityTag',
          type: 'groupTag',
          customVariable: [],
          isSalesTag: false,
          ordKey: null
        }
      },
      {
        key: 'Order Completed',
        value: {
          event:'Order Completed',
          cat: 'activityTag',
          type: 'groupTag',
          customVariable: [],
          isSalesTag: true,
          ordKey: 'orderId'
        }
      }
    ]
  };


  beforeEach(function() {
    analytics = new Analytics();
    floodlight = new Floodlight(options);
    analytics.use(Floodlight);
    analytics.use(tester);
    analytics.add(floodlight);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    floodlight.reset();
  });

  it('should have the correct settings', function() {
    analytics.compare(Floodlight, integration('DoubleClick Floodlight')
      .option('source', '')
      .mapping('events'));
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('track', function() {
      beforeEach(function() {
        analytics.spy(floodlight, 'load');
      });

      var sandbox;
      beforeEach(function() {
        // stubbing cachebuster logic
        sandbox = sinon.sandbox.create();
        sandbox.stub(Math, 'random').returns(0.27005030284556764);
      });

      afterEach(function() {
        // reset Math.random stub
        sandbox.restore();
      });

      it('should fire a basic floodlight counter tag properly', function() {
        var iframe = '<iframe src="https://' + options.source + '.fls.doubleclick.net/activityi'
          + ';src=' + options.source
          + ';type=' + options.events[1].value.type
          + ';cat=' + options.events[1].value.cat
          + ';dc_lat=;dc_rdid=;tag_for_child_directed_treatment='
          + ';ord=2700503028455676400?">';

        analytics.track('Goodbye Pablo');
        analytics.called(floodlight.load);
        analytics.loaded(iframe);
      });

      it('should fire a floodlight counter tag with custom variables properly', function() {
        var iframe = '<iframe src="https://' + options.source + '.fls.doubleclick.net/activityi'
          + ';src=' + options.source
          + ';type=' + options.events[0].value.type
          + ';cat=' + options.events[0].value.cat
          + ';dc_lat=;dc_rdid=;tag_for_child_directed_treatment='
          + ';ord=2700503028455676400'
          + ';u1=Maeve'
          + ';u2=4?">';

        analytics.track('Watched Westworld', {
          favoriteCharacter: 'Maeve',
          episode: '4'
        });
        analytics.called(floodlight.load);
        analytics.loaded(iframe);
      });

      it('should fire a basic floodlight sales tag properly', function() {
        var properties = {
          checkout_id: 'fksdjfsdjfisjf9sdfjsd9f',
          order_id: '50314b8e9bcf000000000000',
          affiliation: 'Google Store',
          total: 30,
          revenue: 25,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games'
            },
            {
              product_id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'Uno Card Game',
              price: 3,
              quantity: 2,
              category: 'Games'
            }
          ]
        };
        var iframe = '<iframe src="https://' + options.source + '.fls.doubleclick.net/activityi'
          + ';src=' + options.source
          + ';type=' + options.events[1].value.type
          + ';cat=' + options.events[1].value.cat
          + ';qty=' + 3
          + ';cost=' + properties.revenue
          + ';dc_lat=;dc_rdid=;tag_for_child_directed_treatment='
          + ';ord=50314b8e9bcf000000000000?">';

        analytics.track('Order Completed', properties);
        analytics.called(floodlight.load);
        analytics.loaded(iframe);
      });

      it('should fallback to properties.quantity for sales tag if no products', function() {
        var properties = {
          checkout_id: 'fksdjfsdjfisjf9sdfjsd9f',
          order_id: '50314b8e9bcf000000000000',
          affiliation: 'Google Store',
          total: 30,
          revenue: 25,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          quantity: 3
        };
        var iframe = '<iframe src="https://' + options.source + '.fls.doubleclick.net/activityi'
          + ';src=' + options.source
          + ';type=' + options.events[1].value.type
          + ';cat=' + options.events[1].value.cat
          + ';qty=' + 3
          + ';cost=' + properties.revenue
          + ';dc_lat=;dc_rdid=;tag_for_child_directed_treatment='
          + ';ord=50314b8e9bcf000000000000?">';

        analytics.track('Order Completed', properties);
        analytics.called(floodlight.load);
        analytics.loaded(iframe);
      });

      describe('page', function() {
        beforeEach(function() {
          analytics.spy(floodlight, 'load');
        });

        var sandbox;
        beforeEach(function() {
          // stubbing cachebuster logic
          sandbox = sinon.sandbox.create();
        });

        afterEach(function() {
          sandbox.restore();
        });

        it('should fire a floodlight tag for named pages mapped as events', function() {
          var iframe = '<iframe src="https://' + options.source + '.fls.doubleclick.net/activityi'
            + ';src=' + options.source
            + ';type=' + options.events[1].value.type
            + ';cat=' + options.events[1].value.cat
            + ';dc_lat=;dc_rdid=;tag_for_child_directed_treatment='
            + ';ord=2700503028455676400?">';

          analytics.page('Confirmation');
          analytics.called(floodlight.load);
          analytics.loaded(iframe);
        });
      });


      describe('noops', function() {
        it('should noop if no mapped tags are found for an event', function() {
          analytics.track('They should announce a sequel to Groundhog Day and then just rerelease the original');
          analytics.didNotCall(floodlight.load);
        });

        it('should noop if source is missing', function() {
          delete floodlight.options.source;
          analytics.assert(floodlight.options.events[0].value.cat);
          analytics.assert(floodlight.options.events[0].value.type);
          analytics.track('Watched Westworld');
          analytics.didNotCall(floodlight.load);
        });

        it('should noop if cat is missing', function() {
          delete floodlight.options.events[0].value.cat;
          analytics.assert(floodlight.options.source);
          analytics.assert(floodlight.options.events[0].value.type);
          analytics.track('Watched Westworld');
          analytics.didNotCall(floodlight.load);
        });

        it('should noop if type is missing', function() {
          delete floodlight.options.events[0].value.type;
          analytics.assert(floodlight.options.events[0].value.cat);
          analytics.assert(floodlight.options.source);
          analytics.track('Watched Westworld');
          analytics.didNotCall(floodlight.load);
        });
      });
    });
  });
});
