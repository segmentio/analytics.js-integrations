'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var OneSpot = require('../lib/');

describe('OneSpot', function() {
  var analytics;
  var onespot;
  var options = {
    accountId: '171'
  };

  beforeEach(function() {
    analytics = new Analytics();
    onespot = new OneSpot(options);
    analytics.use(OneSpot);
    analytics.use(tester);
    analytics.add(onespot);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    onespot.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(OneSpot, integration('OneSpot').option('accountId', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(onespot, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.called(onespot.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(onespot, done);
    });
  });

  describe('after loading', function() {
    it('should check for window.osANSegCode', function() {
      analytics.initialize();
      analytics.assert(window.hasOwnProperty('osANSegCode'));
    });
  });
});
