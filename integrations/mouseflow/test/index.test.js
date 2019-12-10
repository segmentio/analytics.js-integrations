'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Mouseflow = require('../lib/');

describe('Mouseflow', function() {
  var analytics;
  var mouseflow;
  var options = {
    apiKey: '093c80cf-1455-4ad6-b130-ce44cd25ca7c'
  };

  beforeEach(function() {
    analytics = new Analytics();
    mouseflow = new Mouseflow(options);
    analytics.use(Mouseflow);
    analytics.use(tester);
    analytics.add(mouseflow);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    mouseflow.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(
      Mouseflow,
      integration('Mouseflow')
        .assumesPageview()
        .global('_mfq')
        .global('mouseflow')
        .global('mouseflowHtmlDelay')
        .option('apiKey', '')
        .option('mouseflowHtmlDelay', 0)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(mouseflow, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(mouseflow.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(mouseflow, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should set window.mouseflowHtmlDelay', function() {
      analytics.assert(window.mouseflowHtmlDelay === 0);
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._mfq, 'push');
      });

      it('should pass the path', function() {
        analytics.page({ path: '/path' });
        analytics.called(window._mfq.push, ['newPageView', '/path']);
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._mfq, 'push');
      });

      it('should send id', function() {
        analytics.identify(123);
        analytics.called(window._mfq.push, ['setVariable', 'id', 123]);
      });

      it('should send traits', function() {
        analytics.identify({ a: 1 });
        analytics.called(window._mfq.push, ['setVariable', 'a', 1]);
      });

      it('should send id and traits', function() {
        analytics.identify(123, { a: 1 });
        analytics.called(window._mfq.push, ['setVariable', 'id', 123]);
        analytics.called(window._mfq.push, ['setVariable', 'a', 1]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._mfq, 'push');
      });

      it('should send event', function() {
        analytics.track('event-name');
        analytics.called(window._mfq.push, [
          'setVariable',
          'event',
          'event-name'
        ]);
      });

      it('should send props', function() {
        analytics.track('event-name', { a: 1 });
        analytics.called(window._mfq.push, [
          'setVariable',
          'event',
          'event-name'
        ]);
        analytics.called(window._mfq.push, ['setVariable', 'a', 1]);
      });
    });
  });
});
