'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Drip = require('../lib/');

describe('Drip', function() {
  var analytics;
  var drip;
  var options = {
    account: '3826504',
    campaignId: ''
  };

  beforeEach(function() {
    analytics = new Analytics();
    drip = new Drip(options);
    analytics.use(Drip);
    analytics.use(tester);
    analytics.add(drip);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    drip.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Drip, integration('Drip')
      .global('_dc')
      .global('_dcq')
      .global('_dcqi')
      .global('_dcs')
      .option('account', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(drip, 'load');
    });

    describe('#initialize', function() {
      it('should create window._dcq', function() {
        analytics.assert(!window._dcq);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._dcq instanceof Array);
      });

      it('should create window._dcs', function() {
        analytics.assert(!window._dcs);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._dcs);
        analytics.assert(window._dcs.account === options.account);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(drip.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(drip, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._dcq, 'push');
      });

      it('should send event as the action', function() {
        analytics.track('event');
        analytics.called(window._dcq.push, ['track', 'event', {}]);
      });

      it('should convert and alias revenue', function() {
        analytics.track('event', { revenue: '9.99' });
        analytics.called(window._dcq.push, ['track', 'event', { value: 999 }]);
      });

      it('should replace spaces with underscores in for property keys', function() {
        analytics.track('event', { 'ahoy mate there': 'howdy' });
        analytics.called(window._dcq.push, ['track', 'event', { ahoy_mate_there: 'howdy' }]);
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._dcq, 'push');
      });

      it('should send identify with traits', function() {
        var traits = { email: 'philz@philz.com', heyyou: 'know yourself' };
        analytics.identify('id', traits);
        analytics.called(window._dcq.push, ['identify', { id: 'id', heyyou: 'know yourself', email: 'philz@philz.com' }]);
      });

      it('should not send if email is not there', function() {
        analytics.identify('id', { trait: true });
        analytics.didNotCall(window._dcq.push);
      });

      it('should subscribe to campaignId if provided in the settings', function() {
        drip.options.campaignId = '83702741';
        var traits = { email: 'philz@philz.com', heyyou: 'know yourself', id: 'id' };
        analytics.identify('id', traits);
        analytics.deepEqual(window._dcq.push.args[1], [['subscribe', { campaign_id: drip.options.campaignId, fields: traits }]]);
      });

      it('should let you override subscribing to campaignId if provided in integration specific settings', function() {
        drip.options.campaignId = '83702741';
        var traits = { email: 'philz@philz.com', heyyou: 'know yourself', id: 'id' };
        var intOptions = { Drip: { campaignId: '12345678' } };
        analytics.identify('id', traits, intOptions);
        analytics.deepEqual(window._dcq.push.args[1], [['subscribe', { campaign_id: '12345678', fields: traits }]]);
      });
    });
  });
});
