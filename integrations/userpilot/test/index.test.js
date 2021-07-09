'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Userpilot = require('../lib/').Integration;
describe('Userpilot', function() {
  var userpilot;
  var analytics;
  var options = {
    appToken: '88su62r1'
  };

  // Disable AMD for these browser tests.

  beforeEach(function() {
    analytics = new Analytics();
    userpilot = new Userpilot(options);
    analytics.use(Userpilot);
    analytics.use(tester);
    analytics.add(userpilot);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    sandbox();
  });

  after(function() {
    userpilot.reset();
  });

  it('should have the right settings', function() {
    analytics.compare(Userpilot, integration('Userpilot')
      .global('Userpilot')
      .option('appToken', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(userpilot, 'load');
    });

    afterEach(function() {
      userpilot.reset();
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.called(userpilot.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(userpilot, done);
      done();
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.userpilot, 'reload');
      });

      it('should call userpilot.reload', function() {
        analytics.page('some page', { someAttr: true });
        analytics.called(window.userpilot.reload, 'some page');
        // No way to assert an argument "match", and analytics.page includes
        // other properties automatically, so manually checking the second
        // arg to userpilot.reload includes the `someAttr` value.
        analytics.assert(window.userpilot.reload.args[0][1].someAttr === true);
      });
    });
    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.userpilot, 'track');
      });

      it('should send name and attributes', function() {
        analytics.track('some event', { someAttr: true });
        analytics.called(window.userpilot.track, 'some event', { someAttr: true });
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window.userpilot, 'group');
      });

      it('should send company id and attributes', function() {
        analytics.group('company id', { trait: true, createdAt: 9 });
        analytics.called(window.userpilot.group, 'company id', { id: 'company id', trait: true, createdAt: 9 });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.userpilot, 'identify');
      });

      it('should send and id and traits', function() {
        analytics.identify('id', { trait: true, createdAt: '9' });
        analytics.called(window.userpilot.identify, 'id', { id: 'id', trait: true, created_at: '9' });
      });
    });
  });
});
