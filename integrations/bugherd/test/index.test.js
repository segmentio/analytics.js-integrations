'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var BugHerd = require('../lib/');
var sandbox = require('@segment/clear-env');

describe('BugHerd', function() {
  var analytics;
  var bugherd;
  var options = {
    apiKey: 'vp3z4lyri7mdjf7wjrufpa'
  };

  beforeEach(function() {
    analytics = new Analytics();
    bugherd = new BugHerd(options);
    analytics.use(BugHerd);
    analytics.use(tester);
    analytics.add(bugherd);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    bugherd.reset();
    sandbox();
    var iframe = document.getElementById('_BH_frame');
    if (iframe) iframe.parentNode.removeChild(iframe);
  });

  it('should have the right settings', function() {
    analytics.compare(BugHerd, integration('BugHerd')
      .assumesPageview()
      .global('BugHerdConfig')
      .global('_bugHerd')
      .option('apiKey', '')
      .option('showFeedbackTab', true));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(bugherd, 'load');
    });

    describe('#initialize', function() {
      it('should create window.BugHerdConfig', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window.BugHerdConfig, {
          feedback: { hide: false }
        });
      });

      it('should be able to hide the tab', function() {
        bugherd.options.showFeedbackTab = false;
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window.BugHerdConfig, {
          feedback: { hide: true }
        });
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(bugherd, done);
    });
  });
});
