'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var SupportHero = require('../lib/');

describe('SupportHero', function() {
  var analytics;
  var supportHero;
  var options = {
    token: 'Y2xpZW50SWQ9MjYmaG9zdE5hbWU9dGVzdC5zdXBwb3J0aGVyby5pbw=='
  };

  beforeEach(function() {
    analytics = new Analytics();
    supportHero = new SupportHero(options);
    analytics.use(SupportHero);
    analytics.use(tester);
    analytics.add(supportHero);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    supportHero.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(SupportHero, integration('SupportHero')
      .assumesPageview()
      .global('supportHeroWidget')
      .option('token', '')
      .option('track', false));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(supportHero, 'load');
    });

    afterEach(function() {
      supportHero.reset();
    });

    describe('#initialize', function() {
      it('should set up the window.supportHeroWidget methods', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(window.supportHeroWidget.setUserId);
        analytics.assert(window.supportHeroWidget.setUserTraits);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(supportHero.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(supportHero, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#setUserId', function() {
      beforeEach(function() {
        analytics.stub(window.supportHeroWidget, 'setUserId');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.supportHeroWidget.setUserId, 'id');
      });
    });

    describe('#setUserTraits', function() {
      beforeEach(function() {
        analytics.stub(window.supportHeroWidget, 'setUserTraits');
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.supportHeroWidget.setUserTraits, { trait: true });
      });
    });

    describe('#setUserId and #setUserTraits at once', function() {
      beforeEach(function() {
        analytics.stub(window.supportHeroWidget, 'setUserId');
        analytics.stub(window.supportHeroWidget, 'setUserTraits');
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.supportHeroWidget.setUserId, 'id');
        analytics.called(window.supportHeroWidget.setUserTraits, { trait: true, id: 'id' });
      });
    });
  });
});
