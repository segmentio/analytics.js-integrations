'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Quora = require('../lib/');

describe('Quora', function() {
  var analytics;
  var quora;
  var options = {
    writeKey: 'fde52bd8df46412bad5fb5ceff512dc1', // Destinations testing account
    trackEvents: ['order completed'],
    events: {
      randomEvent: 'Generate Lead',
      'booking completed': 'Purchase',
      search: 'Search'
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    quora = new Quora(options);
    analytics.use(Quora);
    analytics.use(tester);
    analytics.add(quora);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    quora.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Quora,
      integration('Quora Conversion Pixel').option('writeKey', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(quora, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(quora.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      // We can't use analytics.load directly
      analytics.assert(
        !quora.loaded(),
        'Expected `integration.loaded()` to be false before loading.'
      );
      analytics.once('ready', function() {
        try {
          analytics.assert(
            quora.loaded(),
            'Expected `integration.loaded()` to be true after loading.'
          );
          done();
        } catch (err) {
          done(err);
        }
      });
      analytics.initialize();
      analytics.page({}, { Marketo: true });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'qp');
      });

      describe('generic events', function() {
        it('should fire generic events for old setting', function() {
          analytics.track('order completed');
          analytics.called(window.qp, 'track', 'Generic');
        });
      });

      describe('event mapping', function() {
        it('should fire mapped events for new setting', function() {
          analytics.track('booking completed');
          analytics.called(window.qp, 'track', 'Purchase');
        });
      });
    });
  });
});
