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
    writeKey: 'fde52bd8df46412bad5fb5ceff512dc1' // Destinations testing account
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
});
