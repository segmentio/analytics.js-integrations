'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var CrazyEgg = require('../lib/');

describe('Crazy Egg', function() {
  var analytics;
  var crazyegg;
  var options = {
    accountNumber: '00138301'
  };

  beforeEach(function() {
    analytics = new Analytics();
    crazyegg = new CrazyEgg(options);
    analytics.use(CrazyEgg);
    analytics.use(tester);
    analytics.add(crazyegg);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    crazyegg.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(CrazyEgg, integration('Crazy Egg')
      .assumesPageview()
      .global('CE2')
      .option('accountNumber', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(crazyegg, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(crazyegg.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(crazyegg, done);
    });
  });
});
