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
          ]
        }
      },
      {
        key: 'Goodbye Pablo',
        value: {
          event: 'Goodbye Pablo',
          cat: 'activityTag',
          type: 'groupTag',
          customVariable: []
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

      it('should fire a basic floodlight tag properly', function() {
        var imgTag = '<img src="http://ad.doubleclick.net/activity'
          + ';src=' + options.source
          + ';type=' + options.events[1].value.type
          + ';cat=' + options.events[1].value.cat
          + ';ord=2700503028455676400?">';

        analytics.track('Goodbye Pablo');
        analytics.called(floodlight.load);
        analytics.loaded(imgTag);
      });

      it('should fire a floodlight tag with custom variables properly', function() {
        var imgTag = '<img src="http://ad.doubleclick.net/activity'
          + ';src=' + options.source
          + ';type=' + options.events[0].value.type
          + ';cat=' + options.events[0].value.cat
          + ';ord=2700503028455676400'
          + ';u1=Maeve'
          + ';u2=4?">';

        analytics.track('Watched Westworld', {
          favoriteCharacter: 'Maeve',
          episode: '4'
        });
        analytics.called(floodlight.load);
        analytics.loaded(imgTag);
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
