'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Navilytics = require('../lib/');

describe('Navilytics', function() {
  var analytics;
  var navilytics;
  var settings;

  beforeEach(function() {
    settings = {
      memberId: '1042',
      projectId: '73'
    };
    analytics = new Analytics();
    navilytics = new Navilytics(settings);
    analytics.use(Navilytics);
    analytics.use(tester);
    analytics.add(navilytics);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    navilytics.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Navilytics, integration('Navilytics')
      .assumesPageview()
      .global('__nls')
      .option('memberId', '')
      .option('projectId', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(navilytics, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(navilytics.load);
      });

      it('should create window.__nls', function() {
        analytics.assert(window.__nls === undefined);
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window.__nls, []);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(navilytics, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.__nls, 'push');
      });

      it('should tag the recording', function() {
        analytics.track('event');
        analytics.called(window.__nls.push, ['tagRecording', 'event']);
      });
    });
  });
});
