'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Linkedin = require('../lib/');

describe('Linkedin', function() {
  var analytics;
  var linkedin;
  var options = {
    partnerId: '423090' // Destinations testing account
  };

  beforeEach(function() {
    analytics = new Analytics();
    linkedin = new Linkedin(options);
    analytics.use(Linkedin);
    analytics.use(tester);
    analytics.add(linkedin);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    linkedin.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Linkedin,
      integration('LinkedIn Insight Tag').option('partnerId', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(linkedin, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(linkedin.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      // We can't use analytics.load directly
      analytics.once('ready', function() {
        try {
          analytics.assert(
            linkedin.loaded(),
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
