'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Evergage = require('../lib/');

describe('Evergage', function() {
  var analytics;
  var evergage;
  var options = {
    account: 'segmentiotest',
    dataset: 'segio_b2b_anon'
  };

  beforeEach(function() {
    analytics = new Analytics();
    evergage = new Evergage(options);
    analytics.use(Evergage);
    analytics.use(tester);
    analytics.add(evergage);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    evergage.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Evergage, integration('Evergage')
      .assumesPageview()
      .global('_aaq')
      .option('account', '')
      .option('dataset', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(evergage, 'load');
    });

    describe('#initialize', function() {
      it('should create window._aaq', function() {
        analytics.assert(!window._aaq);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._aaq);
      });

      it('should push the account', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._aaq[0], ['setEvergageAccount', options.account]);
      });

      it('should push the dataset', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._aaq[1], ['setDataset', options.dataset]);
      });

      it('should push use site config', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._aaq[2], ['setUseSiteConfig', true]);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(evergage.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(evergage, done);
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
        analytics.stub(window._aaq, 'push');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window._aaq.push, ['setUser', 'id']);
      });

      it('should not send just traits', function() {
        analytics.identify({ trait: true });
        analytics.didNotCall(window._aaq.push);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window._aaq.push, ['setUser', 'id']);
        analytics.called(window._aaq.push, ['setUserField', 'trait', true, 'page']);
      });

      it('should send an email', function() {
        analytics.identify('id', { email: 'name@example.com' });
        analytics.called(window._aaq.push, ['setUserField', 'userEmail', 'name@example.com', 'page']);
      });

      it('should send a name', function() {
        analytics.identify('id', { name: 'name' });
        analytics.called(window._aaq.push, ['setUserField', 'userName', 'name', 'page']);
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window._aaq, 'push');
      });

      it('should send an id', function() {
        analytics.group('id');
        analytics.called(window._aaq.push, ['setCompany', 'id']);
      });

      it('should not send just traits', function() {
        analytics.group({ trait: true });
        analytics.didNotCall(window._aaq.push);
      });

      it('should send an id and properties', function() {
        analytics.group('id', { trait: true });
        analytics.called(window._aaq.push, ['setCompany', 'id']);
        analytics.called(window._aaq.push, ['setAccountField', 'trait', true, 'page']);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._aaq, 'push');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._aaq.push, ['trackAction', 'event', {}]);
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window._aaq.push, ['trackAction', 'event', { property: true }]);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._aaq, 'push');
        analytics.stub(window.Evergage, 'init');
      });

      it('should send a page view', function() {
        analytics.page();
        analytics.called(window.Evergage.init, true);
      });

      it('should send page properties', function() {
        analytics.page({ property: true });
        analytics.called(window._aaq.push, ['setCustomField', 'property', true, 'page']);
      });

      it('should send a page name', function() {
        analytics.page('name');
        analytics.called(window._aaq.push, ['namePage', 'name']);
      });
    });
  });
});
