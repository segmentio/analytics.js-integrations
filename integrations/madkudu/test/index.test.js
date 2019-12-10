'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var MadKudu = require('../lib/');

describe('MadKudu', function() {
  var madkudu;
  var analytics;
  var options = {
    apiKey: 'test_api_key'
  };

  beforeEach(function() {
    analytics = new Analytics();
    madkudu = new MadKudu(options);
    analytics.use(MadKudu);
    analytics.use(tester);
    analytics.add(madkudu);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    madkudu.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(MadKudu, integration('Madkudu')
      .global('madkudu')
      .option('apiKey', '')
      .readyOnLoad());
  });

  describe('before loading', function() {
    afterEach(function() {
      madkudu.reset();
    });

    describe('#initialize', function() {
      it('should create window.madkudu', function() {
        analytics.assert(!window.madkudu);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.madkudu);
      });
    });
  });

  describe('load', function() {
    it('should load', function(done) {
      analytics.load(madkudu, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.madkudu, 'identify');
        analytics.reset();
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.madkudu.identify, 'id');
      });

      it('should send traits', function() {
        var traits = { trait: true };
        analytics.identify(traits);
        analytics.called(window.madkudu.identify, traits);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.madkudu.identify, 'id', { id: 'id', trait: true });
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });
  });
});
