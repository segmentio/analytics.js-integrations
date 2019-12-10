'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var HitTail = require('../lib/');

describe('HitTail', function() {
  var analytics;
  var hitTail;
  var options = {
    siteId: 'x'
  };

  beforeEach(function() {
    analytics = new Analytics();
    hitTail = new HitTail(options);
    analytics.use(HitTail);
    analytics.use(tester);
    analytics.add(hitTail);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    hitTail.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(HitTail, integration('HitTail')
      .assumesPageview()
      .global('htk')
      .option('siteId', ''));
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(hitTail, done);
    });
  });
});
