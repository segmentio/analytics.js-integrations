'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var SnapEngage = require('../lib/');

describe('SnapEngage', function() {
  var analytics;
  var snapengage;
  var options = {
    apiKey: '782b737e-487f-4117-8a2b-2beb32b600e5'
  };

  beforeEach(function() {
    analytics = new Analytics();
    snapengage = new SnapEngage(options);
    analytics.use(SnapEngage);
    analytics.use(tester);
    analytics.add(snapengage);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    snapengage.reset();
    sandbox();
  });

  it('should store the right settings', function() {
    analytics.compare(SnapEngage, integration('SnapEngage')
      .assumesPageview()
      .global('SnapABug')
      .option('apiKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(snapengage, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(snapengage.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(snapengage, done);
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
        analytics.stub(window.SnapABug, 'setUserEmail');
      });

      it('should not send just an id', function() {
        analytics.identify('id');
        analytics.didNotCall(window.SnapABug.setUserEmail);
      });

      it('should send an email', function() {
        analytics.identify('id', { email: 'name@example.com' });
        analytics.called(window.SnapABug.setUserEmail, 'name@example.com');
      });
    });

    /**
     * FIXME: SnapEngage does not have an API for triggering events :/
     *

    describe('#listen', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
        analytics.stub(analytics, 'track');
      });

      it('should send a chat started event', function(done) {
        setTimeout(function() {
          window.SnapEngage.startChat('bananas');
        }, 3000);
        setTimeout(function() {
          analytics.called(analytics.track, 'Live Chat Conversation Started', {}, { context: { integration: { name: 'snapengage', version: '1.0.0' }}});
          done();
        }, 5000);
      });

      it('should send a chat sent event', function(done) {
        setTimeout(function() {
          window.SnapEngage.startChat('bananas');
        }, 3000);
        setTimeout(function() {
          window.SnapEngage.sendTextToChat('lalalalalalla');
        }, 4000);
        setTimeout(function() {
          analytics.called(analytics.track, 'Live Chat Message Sent',
            {},
            { context: { integration: { name: 'snapengage', version: '1.0.0' }}
          });
          done();
        }, 8000);
      });

      it('should send a chat received event', function(done) {
        setTimeout(function() {
          window.SnapEngage.startChat('bananas');
        }, 3000);
        setTimeout(function() {
          window.SnapEngage.sendTextToChat('lalalalalalla', 'visitor');
        }, 5000);
        setTimeout(function() {
          analytics.called(analytics.track, 'Live Chat Message Received',
            {},
            { context: { integration: { name: 'snapengage', version: '1.0.0' }}
          });
          done();
        }, 8000);
      });

      it('should send a chat closed event', function(done) {
        setTimeout(function() {
          window.SnapEngage.startChat('bananas');
        }, 3000);
        setTimeout(function() {
          window.SnapEngage.closeForm('bananas');
        }, 5000);
        setTimeout(function() {
          analytics.called(analytics.track, 'Live Chat Conversation Ended', {}, { context: { integration: { name: 'snapengage', version: '1.0.0' }}});
          done();
        }, 8000);
      });
    });*/
  });
});
