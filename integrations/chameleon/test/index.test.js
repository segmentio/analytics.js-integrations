'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Chameleon = require('../lib/');

var noop = function() {};

describe('Chameleon', function() {
  var analytics;
  var chameleon;
  var options = {
    apiKey: 'AvyQ4N2p-FOb5ceEb3w0RT-segment-integration'
  };

  beforeEach(function() {
    analytics = new Analytics();
    chameleon = new Chameleon(options);
    analytics.use(Chameleon);
    analytics.use(tester);
    analytics.add(chameleon);

    analytics.user().anonymousId('anon-id');
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    chameleon.reset();
    analytics.user().reset();
    sandbox();
  });

  // FIXME: Chameleon freaks out after tests run
  after(function() {
    window.chmln = function() {};
  });

  it('should have the right settings', function() {
    analytics.compare(Chameleon, integration('Chameleon')
      .readyOnInitialize()
      .readyOnLoad()
      .global('chmln')
      .option('apiKey', null));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.spy(chameleon, 'load');
      analytics.spy(chameleon, 'ready');
    });

    afterEach(function() {
      chameleon.reset();
    });

    describe('#initialize', function() {
      beforeEach(function() {
        analytics.initialize();
        analytics.page();
      });

      it('should add the account token', function() {
        analytics.assert.equal(window.chmln.accountToken, options.apiKey);
      });

      it('should add the current location', function() {
        var protocol = window.location.protocol;
        var host = window.location.host;
        var loc = new RegExp(protocol + '\/\/' + host + '\/');

        analytics.assert.equal(loc.test(window.chmln.location), true);
      });

      it('should load', function() {
        analytics.called(chameleon.load);
      });

      it('should be ready', function() {
        analytics.called(chameleon.ready);
      });
    });

    describe('when chmln is already on the page', function() {
      beforeEach(function() {
        window.chmln = { root: 'DOM' };

        analytics.initialize();
        analytics.page();
      });

      it('should not add the info', function() {
        analytics.assert.equal(window.chmln.accountToken, undefined);
        analytics.assert.equal(window.chmln.location, undefined);
      });

      it('should continue as normal', function() {
        analytics.called(chameleon.load);
        analytics.called(chameleon.ready);
      });
    });
  });

  describe('before loaded', function() {
    beforeEach(function() {
      chameleon.load = noop;
      analytics.initialize();
      analytics.page();
    });

    describe('on identify', function() {
      beforeEach(function() {
        analytics.identify('id');
      });

      it('should store the identify', function() {
        analytics.assert.equal(Array.prototype.slice.call(window.chmln.identify_a).length, 1);
        analytics.assert.equal('id', window.chmln.identify_a[0][0]);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(chameleon, done);
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
        analytics.spy(window.chmln, 'identify');
      });

      it('should identify with no id', function() {
        analytics.identify();
        analytics.called(window.chmln.identify, null, {});
      });

      it('should identify with the given id', function() {
        analytics.identify('id');
        analytics.called(window.chmln.identify, 'id');
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.chmln.identify, null, { trait: true });
      });

      it('should send the given id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.chmln.identify, 'id', { trait: true });
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window.chmln, 'set');
      });

      it('should send an id', function() {
        analytics.group('12');
        analytics.called(window.chmln.set, { company: { uid: '12' } });
      });

      it('should send traits', function() {
        analytics.group('13', { trait: true });
        analytics.called(window.chmln.set, { company: { uid: '13', trait: true } });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.chmln, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.chmln.track, 'event');
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.chmln.track, 'event', { property: true });
      });
    });

    describe('#alias', function() {
      beforeEach(function() {
        analytics.user().anonymousId('anon-id');
        analytics.stub(window.chmln, 'alias');
      });

      it('should send a new id', function() {
        analytics.alias('new');
        analytics.called(window.chmln.alias, { from: 'anon-id', to: 'new' });
      });

      it('should send a new and old id', function() {
        analytics.alias('new', 'old');
        analytics.called(window.chmln.alias, { from: 'old', to: 'new' });
      });
    });
  });
});
