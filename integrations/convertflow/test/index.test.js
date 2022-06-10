'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var ConvertFlow = require('../lib/');

describe('ConvertFlow', function() {
  var analytics;
  var convertflow;
  var options = {
    websiteId: '4785'
  };

  beforeEach(function() {
    analytics = new Analytics();
    convertflow = new ConvertFlow(options);
    analytics.use(ConvertFlow);
    analytics.use(tester);
    analytics.add(convertflow);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    convertflow.reset();
    sandbox();
  });

  afterEach(function() {
    reset();
  });

  it('should have the right settings', function() {
    analytics.compare(ConvertFlow, integration('ConvertFlow')
      .global('convertflow')
      .assumesPageview()
      .option('websiteId', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(convertflow, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(convertflow.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(convertflow, done);
    });
  });

  describe('after loading', function() {

    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {

      beforeEach(function() {
        analytics.stub(window.convertflow, 'start');
      });

      it('should call convertflow start', function() {
        analytics.page();
        analytics.called(window.convertflow.start);
      });
    });

    describe('#identify', function() {

      beforeEach(function() {
        analytics.stub(window.convertflow, 'identify');
      });

      it('should send an email', function(done) {
        setTimeout(function() {
          analytics.identify({ email: 'blackwidow@shield.gov' });
          analytics.called(window.convertflow.identify, {email: 'blackwidow@shield.gov', override: true});
          done();
        }, 1000);
      });
    });
  });

});

/**
 * Remove convertflow from DOM
 */

function reset() {
  var cfGlobal = window.convertflow;
  if (cfGlobal && cfGlobal.app) {
    cfGlobal.app.ctas.resetCTAs();
    delete window.convertflow;
  }
}