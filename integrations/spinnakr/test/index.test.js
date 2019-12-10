'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Spinnakr = require('../lib/');

describe('Spinnakr', function() {
  var analytics;
  var spinnakr;
  var options = {
    siteId: '668925604'
  };

  beforeEach(function() {
    analytics = new Analytics();
    spinnakr = new Spinnakr(options);
    analytics.use(Spinnakr);
    analytics.use(tester);
    analytics.add(spinnakr);
    // needed for spinnakr's script to set a global we can read
    window._spinnakr_development = true;
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    spinnakr.reset();
    sandbox();
    delete window._spinnakr_development;
  });

  it('should store the right settings', function() {
    analytics.compare(Spinnakr, integration('Spinnakr')
      .assumesPageview()
      .global('_spinnakr_site_id')
      .global('_spinnakr')
      .option('siteId', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(spinnakr, 'load');
    });

    describe('#initialize', function() {
      it('should set window._spinnakr_site_id', function() {
        analytics.assert(!window._spinnakr_site_id);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._spinnakr_site_id === options.siteId);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(spinnakr.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(spinnakr, done);
    });
  });
});
