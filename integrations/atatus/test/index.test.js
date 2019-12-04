'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Atatus = require('../lib/');

describe('Atatus', function() {
  var analytics;
  var atatus;
  var options = {
    apiKey: 'b5598f48388b4e2da7de03f0cf39ea64'
  };
  var onerror = window.onerror;

  beforeEach(function() {
    analytics = new Analytics();
    atatus = new Atatus(options);
    analytics.use(Atatus);
    analytics.use(tester);
    analytics.add(atatus);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    atatus.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Atatus, integration('Atatus')
      .global('atatus')
      .option('apiKey', '')
      .option('disableAjaxMonitoring', false)
      .option('disableSPA', false)
      .option('allowedDomains', [])
      .option('enableOffline', false));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(atatus, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(atatus.load);
      });
    });
  });

  describe('loading', function() {
    beforeEach(function() {
      analytics.spy(atatus, 'load');
    });

    it('should load spa version by default', function(done) {
      analytics.load(atatus, function() {
        analytics.assert(window.atatus.spa);
        done();
      });
    });

    it('should load non-spa version if you have set `disableSPA` to true', function(done) {
      atatus.options.disableSPA = true;
      analytics.load(atatus, function() {
        analytics.assert(!window.atatus.spa);
        done();
      });
    });

    it('should load and set an onerror handler', function(done) {
      analytics.load(atatus, function(err) {
        if (err) return done(err);
        analytics.notEqual(window.onerror, onerror);
        analytics.equal('function', typeof window.onerror);
        done();
      });
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
        analytics.stub(window.atatus, 'setCustomData');
        analytics.stub(window.atatus, 'setUser');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.atatus.setUser, 'id');
        analytics.called(window.atatus.setCustomData, { id: 'id' });
      });

      it('should send only traits', function() {
        analytics.identify({ trait: true });
        analytics.didNotCall(window.atatus.setUser);
        analytics.called(window.atatus.setCustomData, { trait: true });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { name: 'John Doe', email: 'john@acme.com' });
        analytics.called(window.atatus.setUser, 'id', 'john@acme.com', 'John Doe');
        analytics.called(window.atatus.setCustomData, { id: 'id', name: 'John Doe', email: 'john@acme.com' });
      });
    });
  });
});
