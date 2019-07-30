'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Simplifi = require('../lib/');

describe('Simpli.fi', function() {
  var simplifi;
  var analytics;
  var options = {
    advertiserId: 'advertiser',
    optInSegment: 'optin',
    optOutSegment: 'optout',
    events: {
      'without campaign id': {
        tid: 'tidExample1',
        sifi_tuid: 'sifiExample1',
        conversionId: 1
      },
      'with campaign id': {
        tid: 'tidExample2',
        sifi_tuid: 'sifiExample2',
        conversionId: 2,
        campaignId: 100
      }
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    simplifi = new Simplifi(options);
    analytics.use(Simplifi);
    analytics.use(tester);
    analytics.add(simplifi);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    simplifi.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Simplifi, integration('Simpli.fi').mapping('events'));
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.spy(simplifi, 'load');
      });

      describe('should opt-out if a userId exists', function() {
        it('should load the right script', function() {
          analytics.identify('id');
          analytics.loaded(
            '<script src="http://i.simpli.fi/dpx.js?cid=advertiser&action=101&segment=optout&m=1"></script>'
          );
        });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.spy(simplifi, 'load');
      });

      it('should opt-in non-identified users', function() {
        analytics.page();
        analytics.loaded(
          '<script src="http://i.simpli.fi/dpx.js?cid=advertiser&action=100&segment=optin&m=1"></script>'
        );
      });

      it('should opt-out identified users', function() {
        analytics.identify('id');
        analytics.page();
        analytics.loaded(
          '<script src="http://i.simpli.fi/dpx.js?cid=advertiser&action=101&segment=optout&m=1"></script>'
        );
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(simplifi, 'load');
      });

      it('should not track unmapped events', function() {
        analytics.track('event');
        analytics.didNotCall(simplifi.load);
      });

      describe('mapped events', function() {
        it('should track without campaignId', function() {
          analytics.track('without campaign id');
          analytics.loaded(
            '<script src="http://i.simpli.fi/dpx.js?cid=advertiser&conversion=1&campaign_id=0&m=1&tid=tidExample1&sifi_tuid=sifiExample1">'
          );
        });

        it('should track with campaignId', function() {
          analytics.track('with campaign id');
          analytics.loaded(
            '<script src="http://i.simpli.fi/dpx.js?cid=advertiser&conversion=2&campaign_id=100&m=1&tid=tidExample2&sifi_tuid=sifiExample2">'
          );
        });
      });
    });
  });
});
