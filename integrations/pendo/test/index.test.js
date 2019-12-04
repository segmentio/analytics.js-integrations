'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var Pendo = require('../lib');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');

describe('Pendo', function() {
  var analytics;
  var pendo;
  var options = {
    apiKey: 'test-key-for-segment-integration'
  };

  beforeEach(function() {
    analytics = new Analytics();
    pendo = new Pendo(options);

    analytics.use(Pendo);
    analytics.use(tester);
    analytics.add(pendo);
    analytics.user();
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    pendo.reset();
    analytics.user().reset();
    analytics.group().reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Pendo,
      integration('Pendo')
        .global('pendo')
        .option('apiKey', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.spy(pendo, 'load');
      analytics.spy(pendo, 'ready');
    });

    afterEach(function() {
      pendo.reset();
    });

    describe('#initialize', function() {
      it('should create window.pendo_options', function() {
        analytics.assert(!window.pendo_options);
        analytics.initialize();
        analytics.assert(window.pendo_options);
        analytics.assert(window.pendo);
      });

      it('should create a pendo_options object using API', function() {
        analytics.assert.deepEqual(window.pendo_options, { apiKey: options.apiKey, usePendoAgentAPI: true });
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      // override the agent loaded message
      analytics.once('ready', function() {
        done();
      });
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.spy(window.pendo, 'identify');
        analytics.stub(window.pendo, 'tellMaster');
      });

      it('should identify with the anonymous user id', function() {
        analytics.identify();
        analytics.called(window.pendo.identify);

        analytics.assert(window.pendo.visitorId.indexOf('_PENDO_T_') !== -1);
      });

      it('should identify with the given id', function() {
        analytics.identify('id');
        analytics.called(window.pendo.identify);
        analytics.equal(window.pendo.getVisitorId(), 'id');
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.pendo.identify);
        analytics.called(window.pendo.identify);
      });

      it('should send the given id and traits', function() {
        analytics.identify('id', { trait: 'goog' });
        analytics.called(window.pendo.identify);
        analytics.assert(window.pendo_options.visitor.trait === 'goog');
        analytics.equal(window.pendo.getVisitorId(), 'id');
      });
    });

    describe('#group', function() {
      beforeEach(function(done) {
        analytics.once('ready', function() {
          done();
        });
        analytics.initialize();
        analytics.spy(window.pendo, 'identify');
      });

      it('should send an id', function() {
        analytics.group('id');
        analytics.called(window.pendo.identify);
        analytics.equal(window.pendo.getAccountId(), 'id');
      });

      it('should send traits', function() {
        analytics.group({ trait: 'goog' });
        analytics.called(window.pendo.identify);
        analytics.assert(window.pendo_options.account.trait === 'goog');
      });

      it('should send an id and traits', function() {
        analytics.group('id', { trait: 'goog' });
        analytics.called(window.pendo.identify);
        analytics.assert(window.pendo_options.account.trait === 'goog');
        analytics.equal(window.pendo.getAccountId(), 'id');
      });
    });
  });
});
