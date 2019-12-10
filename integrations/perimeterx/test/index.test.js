'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var Perimeterx = require('../lib/');

describe('Perimeterx', function() {
  var analytics;
  var perimeterx;
  var options = {
    appId: 'PXjnWXHw7F',
    customTraits: {
      segmentTrait: '_pxParam1'
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    perimeterx = new Perimeterx(options);
    analytics.use(integrationTester);
    analytics.use(Perimeterx);
    analytics.add(perimeterx);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    perimeterx.reset();
    sandbox();
  });

  it('should have the correct options', function() {
    analytics.compare(Perimeterx, integration('Perimeterx')
      .option('appId', '')
      .option('customTraits', {}));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(perimeterx, 'load');
    });

    describe('#initialize', function() {
      it('should call load', function() {
        analytics.initialize();
        analytics.called(perimeterx.load);
      });
    });
  });

  describe('identify call', function() {
    it('should make an identify call on initialize', function(done) {
      analytics.on('identify', function() { done(); });
      analytics.initialize();
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(perimeterx, done);
    });
  });

  describe('loaded', function() {
    it('should have window._pxAppID', function() {
      analytics.initialize();
      analytics.assert(typeof window._pxAppId === 'string');
    });
    it('should have window._pxAppID_asyncInit', function() {
      analytics.initialize();
      analytics.assert(typeof window[perimeterx.options.appId + '_asyncInit'] === 'function');
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      it('should set custom parameters', function() {
        analytics.identify('id', { segmentTrait: 'hey' });
        analytics.equal(window._pxParam1, 'hey');
      });
    });
  });
});
