'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Errorception = require('../lib/');

var noop = function() {};

describe('Errorception', function() {
  var analytics;
  var errorception;
  var onError;
  var options = {
    projectId: '53502178c0906d4031000350'
  };

  beforeEach(function() {
    analytics = new Analytics();
    errorception = new Errorception(options);
    analytics.use(Errorception);
    analytics.use(tester);
    analytics.add(errorception);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    errorception.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Errorception, integration('Errorception')
      .assumesPageview()
      .global('_errs')
      .option('projectId', '')
      .option('meta', true));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(errorception, 'load');
    });

    afterEach(function() {
      errorception.reset();
    });

    describe('#initialize', function() {
      beforeEach(function() {
        onError = window.onerror;
        window.onerror = noop;
      });

      afterEach(function() {
        window.onerror = onError;
      });

      it('should initialize the errorception queue', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._errs, [options.projectId]);
      });

      it('should add the error handler', function() {
        var err = new Error('a test error');
        analytics.initialize();
        analytics.page();
        analytics.stub(window._errs, 'push');
        window.onerror(err);
        analytics.called(window._errs.push, [err]);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(errorception.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(errorception, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      afterEach(function() {
        delete window._errs.meta;
      });

      it('should add an id to metadata', function() {
        analytics.identify('id');
        analytics.deepEqual(window._errs.meta, { id: 'id' });
      });

      it('should add traits to metadata', function() {
        analytics.identify({ trait: true });
        analytics.deepEqual(window._errs.meta, { trait: true });
      });

      it('should add an id and traits to metadata', function() {
        analytics.identify('id', { trait: true });
        analytics.deepEqual(window._errs.meta, { id: 'id', trait: true });
      });

      it('should not add to metadata when meta option is false', function() {
        errorception.options.meta = false;
        analytics.identify('id');
        analytics.assert(!window._errs.meta);
      });
    });
  });
});
