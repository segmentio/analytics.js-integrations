'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Inspectlet = require('../lib/');

describe('Inspectlet', function() {
  var analytics;
  var inspectlet;
  var options = {
    wid: 'x'
  };

  beforeEach(function() {
    analytics = new Analytics();
    inspectlet = new Inspectlet(options);
    analytics.use(Inspectlet);
    analytics.use(tester);
    analytics.add(inspectlet);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    inspectlet.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Inspectlet, integration('Inspectlet')
      .assumesPageview()
      .global('__insp')
      .global('__insp_')
      .option('wid', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(inspectlet, 'load');
    });

    describe('#initialize', function() {
      it('should create the inspectlet queue', function() {
        analytics.assert(!window.__insp);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.__insp);
      });

      it('should push the wid', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window.__insp, [['wid', options.wid]]);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(inspectlet.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(inspectlet, done);
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
        analytics.stub(window.__insp, 'push');
      });

      it('should identify the user', function() {
        analytics.identify('userId', { email: 'email@example.com' });
        analytics.called(window.__insp.push, ['tagSession', {
          email: 'email@example.com',
          userid: 'userId'
        }]);
        analytics.called(window.__insp.push, ['identify', 'email@example.com']);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.__insp, 'push');
      });

      it('should tag the session', function() {
        analytics.track('event', { testProperty: true });
        analytics.called(window.__insp.push, ['tagSession', 'event', { testProperty: true }]);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.__insp, 'push');
      });

      it('should call only on 2nd page', function() {
        analytics.didNotCall(window.__insp.push, ['virtualPage']);
        analytics.page();
        analytics.called(window.__insp.push, ['virtualPage']);
      });
    });
  });
});
