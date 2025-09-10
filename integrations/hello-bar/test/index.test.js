'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Hellobar = require('../lib/');

describe('Hellobar', function() {
  var analytics;
  var hellobar;
  var options = {
    apiKey: 'a18c23dec1b87e9401465165eca61459d405684d'
  };

  beforeEach(function() {
    analytics = new Analytics();
    hellobar = new Hellobar(options);
    analytics.use(Hellobar);
    analytics.use(tester);
    analytics.add(hellobar);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    hellobar.reset();
    sandbox();
  });

  afterEach(function() {
    reset();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Hellobar,
      integration('Hello Bar')
        .assumesPageview()
        .option('apiKey', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(hellobar, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(hellobar.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(hellobar, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.initialize();
      analytics.page();
      analytics.once('ready', done);
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.hellobar.trigger, 'event');
      });

      it('should send trigger an event', function() {
        analytics.track('event');
        analytics.called(window.hellobar.trigger.event, 'event', {});
      });

      it('should send a trigger event and properties', function() {
        analytics.track('event', {
          property: true
        });
        analytics.called(window.hellobar.trigger.event, 'event', {
          property: true
        });
      });
    });
  });
});

/**
 * Remove the Hellobar DOM element.
 */

function reset() {
  var el = document.getElementById('hellobar_container');
  if (el) el.parentNode.removeChild(el);
}
