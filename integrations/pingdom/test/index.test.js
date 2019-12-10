'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Pingdom = require('../lib/');
var sinon = require('sinon');

describe('Pingdom', function() {
  var analytics;
  var pingdom;
  var options = {
    id: '5168f8c6abe53db732000000'
  };

  function noop() {}

  beforeEach(function() {
    analytics = new Analytics();
    pingdom = new Pingdom(options);
    analytics.use(Pingdom);
    analytics.use(tester);
    analytics.add(pingdom);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    pingdom.reset();
    sandbox();
  });

  // XXX(ndhoule): Pingdom's library registers some onunload/etc. events that
  // don't account for the PRUM_EPISODES library being unavailable
  // (pingdom#reset removes it) and so unless we mock it out, we'll get a page
  // unload error, which Karma will interpret as test failure. I tried removing
  // the events but no dice on IE, so this hax is easiest.
  after(function() {
    window.PRUM_EPISODES = {
      onUnload: noop()
    };
  });

  it('should have the right settings', function() {
    analytics.compare(Pingdom, integration('Pingdom')
      .assumesPageview()
      .global('_prum')
      .global('PRUM_EPISODES')
      .option('id', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(pingdom, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(pingdom.load);
      });

      it('should push the id onto window._prum', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._prum[0], ['id', options.id]);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(pingdom, done);
    });
  });

  describe('after loading', function() {
    var date;
    var clock;
    beforeEach(function(done) {
      analytics.once('ready', done);
      date = new Date();
      clock = sinon.useFakeTimers(date.getTime());
      analytics.initialize();
      analytics.page();
    });

    afterEach(function() {
      clock.restore();
    });

    it('should mark the first byte', function() {
      analytics.equal(window.PRUM_EPISODES.marks.firstbyte, date.getTime());
    });
  });
});
