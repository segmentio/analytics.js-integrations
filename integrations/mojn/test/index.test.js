'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Mojn = require('../lib/');

describe('Mojn', function() {
  var analytics;
  var mojn;
  var options = {
    customerCode: 'EWBCK'
  };

  beforeEach(function() {
    analytics = new Analytics();
    mojn = new Mojn(options);
    analytics.use(Mojn);
    analytics.use(tester);
    analytics.add(mojn);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    mojn.reset();
    sandbox();
  });

  it('should have the correct default settings', function() {
    analytics.compare(Mojn, integration('Mojn')
      .global('_mojnTrack')
      .option('customerCode', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(mojn, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(mojn.load);
      });

      it('should pass customerCode to tracker script', function() {
        window._mojnTrack = [];
        analytics.stub(window._mojnTrack, 'push');
        analytics.initialize();
        analytics.page();
        analytics.called(window._mojnTrack.push, { cid: options.customerCode });
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(mojn, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
      analytics.spy(mojn, 'load');
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._mojnTrack, 'push');
      });

      it('should ignore if revenue is not set', function() {
        analytics.track('some sale', {});
        analytics.didNotCall(window._mojnTrack.push);
      });

      it('should track if revenue is set (no currency)', function() {
        analytics.track('some sale', { revenue: 42 });
        analytics.called(window._mojnTrack.push, { conv: '42' });
      });

      it('should track if revenue is set (with currency)', function() {
        analytics.track('some sale', { revenue: 42, currency: 'DKK' });
        analytics.called(window._mojnTrack.push, { conv: 'DKK42' });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.spy(mojn, 'identify');
      });

      it('should not error', function() {
        analytics.identify({ email: 'foo@baz.com' });
        analytics.loaded('<img src="https://matcher.idtargeting.com/identify.gif?cid=EWBCK&_mjnctid=foo@baz.com">');
      });

      it('should ignore if missing email', function() {
        analytics.identify({ anything: 'but an email' });
        // TODO: test that identify did not load.
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.spy(mojn, 'page');
      });

      it('should not error', function() {
        var anonymousId = analytics.user().anonymousId();
        mojn.options.sync = true;
        analytics.page();
        analytics.loaded('<img src="http://ho.idtargeting.com/c/EWBCK?u=' + anonymousId + '&_chk">');
      });
    });
  });
});
