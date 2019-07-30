'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var EmailAptitude = require('../lib/');

describe('Email Aptitude', function() {
  var ea;
  var analytics;
  var options = {};

  beforeEach(function() {
    analytics = new Analytics();
    ea = new EmailAptitude(options);
    analytics.use(EmailAptitude);
    analytics.use(tester);
    analytics.add(ea);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    ea.reset();
    sandbox();
  });

  // FIXME(ndhoule): This is to compensate for our inability to remove event
  // handlers on page unload in IE9/10; it prevents uncaught ReferenceErrors
  // from occurring on page unload
  after(function() {
    window._ea = {};
  });

  it('should have the right settings', function() {
    analytics.compare(
      EmailAptitude,
      integration('Email Aptitude')
        .assumesPageview()
        .global('_ea')
        .global('EmailAptitudeTracker')
        .option('accountId', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(ea, 'load');
    });

    describe('#initialize', function() {
      it('should create window._ea', function() {
        analytics.assert(!window._ea);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._ea);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(ea, done);
    });
    it('should create window.EmailAptitudeTracker object when loaded', function(done) {
      analytics.assert(!window.EmailAptitudeTracker);
      analytics.load(ea, function() {
        analytics.assert(window.EmailAptitudeTracker);
        done();
      });
    });
  });
});
