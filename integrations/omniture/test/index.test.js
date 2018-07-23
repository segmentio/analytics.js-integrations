'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var iso = require('@segment/to-iso-string');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Omniture = require('../lib/');

describe('Omniture', function() {
  var analytics;
  var omniture;
  var user;
  var options = {
    reportSuiteId: 'segmentio',
    trackingServerUrl: 'segment.io',
    trackingServerSecureUrl: 'secure.segment.io',
    events: {
      'Played a Song': 'event1',
      'Drank Some Milk': 'event6',
      EventEVar: 'event7'
    },
    eVars: {
      Car: 'eVar1',
      Dog: 'eVar47',
      prop20: 'eVar63',
      EventEVar: 'eVar65',
      'Car.Info': 'eVar101',
      'My.Dog': 'eVar401'
    },
    props: {
      Airplane: 'prop20',
      Dog: 'prop40',
      Good: 'prop10',
      Type: 'prop13',
      Brand: 'prop23'
    },
    hVars: {
      hier_group1: 'hier1',
      hier_group2: 'hier2'
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    omniture = new Omniture(options);
    analytics.use(Omniture);
    analytics.use(tester);
    analytics.add(omniture);
    user = analytics.user();
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    omniture.reset();
    // This conflicts with Adobe Analytics tests.
    window.s = undefined;
    window.s_account = undefined;
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Omniture, integration('Omniture')
      .option('events', {})
      .option('eVars', {})
      .option('props', {})
      .option('hVars', {})
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(omniture, 'load');
    });

    describe('#initialize', function() {
      // FIXME: looks like this test was skipped because we never found a good way to test this
      // behavior. Since .sOption() is executed before this test block, these tests fail
      // since the given window.s was not defined earlier enough
      it.skip('should store options with defaults', function() {
        analytics.initialize();
        analytics.equal(omniture.options.channel, 'channel');
        analytics.equal(omniture.options.campaign, 'campaign');
        analytics.equal(omniture.options.state, 'state');
        analytics.equal(omniture.options.zip, 'zip');
        analytics.equal(options.pageName, window.s.pageName);
      });

      it('should set `window.s_account`', function() {
        analytics.initialize();
        analytics.equal(window.s_account, options.reportSuiteId);
      });

      it('should preserve an existing `window.s_account`', function() {
        window.s_account = 'existing';
        analytics.initialize();
        analytics.equal(window.s_account, 'existing');
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(omniture, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#initialize', function() {
      it('should set window.s.trackingServer', function() {
        analytics.initialize();
        analytics.equal(window.s.trackingServer, options.trackingServerUrl);
      });

      it('should set window.s.trackingServerSecure', function() {
        analytics.initialize();
        analytics.equal(window.s.trackingServerSecure, options.trackingServerSecureUrl);
      });
    });

    describe('#track', function() {
      it('tracks normal events', function() {
        analytics.track('event1');
        analytics.equal(window.s.events, 'event1');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(contains(window.s.linkTrackVars, 'events'));
      });

      it('tracks aliased events', function() {
        analytics.track('Drank some milk');
        analytics.equal(window.s.events, 'event6');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(contains(window.s.linkTrackVars, 'events'));
      });

      it('tracks built-in events', function() {
        analytics.track('scAdd');
        analytics.equal(window.s.events, 'scAdd');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(contains(window.s.linkTrackVars, 'events'));
      });

      it('tracks aliases for built-in events', function() {
        analytics.track('Viewed Product');
        analytics.equal(window.s.events, 'prodView');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(contains(window.s.linkTrackVars, 'events'));
      });

      it('tracks product information and uses product before sku', function() {
        analytics.track('Viewed Product', {
          product: 'Wooden Teeth',
          quantity: 2,
          category: 'Dental Aids',
          price: 17.76
        });
        analytics.equal(window.s.products, 'Dental Aids; Wooden Teeth; 2; 35.52');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(contains(window.s.linkTrackVars, 'events', 'products'));
      });

      it('tracks product information and uses sku if no product property is present', function() {
        analytics.track('Viewed Product', {
          sku: 789,
          quantity: 32,
          category: 'Dental Aids',
          price: 17.76
        });
        analytics.equal(window.s.products, 'Dental Aids; 789; 32; 568.32');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(contains(window.s.linkTrackVars, 'events', 'products'));
      });

      it('tracks multiple product information', function() {
        analytics.track('Viewed Cart', {
          products: [{
            product: 'Wooden Teeth',
            quantity: 2,
            category: 'Dental Aids',
            price: 17.76
          }, {
            product: 'Mole People',
            quantity: 3,
            category: 'Subterranean',
            price: 32.32
          }]
        });
        analytics.equal(window.s.products, 'Dental Aids; Wooden Teeth; 2; 35.52, '
          + 'Subterranean; Mole People; 3; 96.96');
        analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
        analytics.assert(contains(window.s.linkTrackVars, 'events', 'products'));
      });

      it('tracks aliased properties', function() {
        analytics.track('Drank Some Milk', {
          type: '2%',
          brand: 'Lucerne',
          good: true
        });
        analytics.equal(window.s.prop13, '2%');
        analytics.equal(window.s.prop23, 'Lucerne');
        analytics.equal(window.s.prop10, 'true');
        analytics.assert(contains(window.s.linkTrackVars, 'events', 'prop13', 'prop23',
          'prop10'));
      });

      it('tracks basic properties', function() {
        analytics.track('event10', {
          prop1: 20,
          prop50: 'good',
          prop73: true
        });
        analytics.equal(window.s.prop73, 'true');
        analytics.equal(window.s.prop1, '20');
        analytics.equal(window.s.prop50, 'good');
        analytics.assert(contains(window.s.linkTrackVars, 'events', 'prop1', 'prop50',
          'prop73'));
      });

      it('tracks basic properties of all cases', function() {
        analytics.track('event10', {
          brand: 'Lucerne'
        });
        analytics.equal(window.s.prop23, 'Lucerne');
        analytics.track('event10', {
          Brand: 'Lucerne'
        });
        analytics.equal(window.s.prop23, 'Lucerne');
        analytics.track('event10', {
          BrANd: 'Lucerne'
        });
        analytics.equal(window.s.prop23, 'Lucerne');
        analytics.track('event10', {
          BRAND: 'Lucerne'
        });
        analytics.equal(window.s.prop23, 'Lucerne');
      });

      it('tracks aliased eVars with nested properties', function() {
        analytics.track('Drank Some Milk', {
          car: { info: '2003 Accord (only one previous owner)' },
          'my.dog': 'Dog',
          good: false
        });
        analytics.equal(window.s.eVar101, '2003 Accord (only one previous owner)');
        analytics.equal(window.s.eVar401, 'Dog');
        analytics.assert(contains(window.s.linkTrackVars, 'events', 'eVar101',
          'eVar401', 'prop10'));
      });

      it('tracks basic eVars', function() {
        analytics.track('event20', {
          eVar20: '123',
          eVar54: false,
          eVar: 'a'
        });
        analytics.equal(window.s.eVar, undefined);
        analytics.equal(window.s.eVar20, '123');
        analytics.equal(window.s.eVar54, 'false');
        analytics.assert(contains(window.s.linkTrackVars, 'events', 'eVar20', 'eVar54'));
      });

      it('tracks event eVars', function() {
        analytics.track('EventEVar');
        analytics.equal(window.s.eVar65, 'EventEVar');
        analytics.assert(contains(window.s.linkTrackVars, 'events', 'eVar65'));
      });

      it('mirrors eVars and properties', function() {
        analytics.track('event54', {
          prop20: 'abc',
          dog: 'malamute',
          eVar49: true
        });
        analytics.equal(window.s.eVar49, 'true');
        analytics.equal(window.s.prop20, 'abc');
        analytics.equal(window.s.eVar63, 'abc');
        analytics.equal(window.s.eVar47, 'malamute');
        analytics.equal(window.s.prop40, 'malamute');
        analytics.assert(contains(window.s.linkTrackVars, 'events', 'prop20', 'eVar63',
          'prop40', 'eVar47', 'eVar49'));
      });

      it('mirrors eVars which are not aliased', function() {
        analytics.track('event1', {
          airplane: 'boeing 747'
        });
        analytics.equal(window.s.eVar63, 'boeing 747');
        analytics.equal(window.s.prop20, 'boeing 747');
        analytics.assert(contains(window.s.linkTrackVars, 'events', 'prop20', 'eVar63'));
      });

      it('should respect properties.timestamp', function() {
        var date = new Date();
        analytics.track('event1', { timestamp: date });
        analytics.equal(window.s.timestamp, iso(date));
      });

      it('should fallback to track.timestamp()', function() {
        var date = new Date();
        analytics.track('event1', {}, { timestamp: date });
        analytics.equal(window.s.timestamp, iso(date));
      });

      it('should not send the timestamp if the setting is disabled', function() {
        delete window.s.timestamp;
        omniture.options.includeTimestamp = false;
        analytics.track('event1');
        analytics.equal(window.s.timestamp, null);
      });

      it('should call window.s.tl', function() {
        analytics.stub(window.s, 'tl');
        analytics.track('Drank some milk');
        analytics.called(window.s.tl, true, 'o', 'Drank some milk');
      });

      it('should clear window.s[variables] between calls', function() {
        analytics.track('Drank some milk', { prop20: '123' });
        analytics.equal(window.s.prop20, '123');
        analytics.track('Drank some milk', { prop25: 'heyo' });
        analytics.assert(!window.s.prop20);
        analytics.equal(window.s.prop25, 'heyo');
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        delete window.s.visitorID;
      });

      it('tracks normal pages', function() {
        analytics.page('Page1');
        analytics.equal(window.s.pageName, 'Page1');
        analytics.deepEqual(window.s.events, 'Page1');
      });

      it('tracks aliased properties', function() {
        analytics.page('Drank Some Milk', {
          type: '2%',
          brand: 'Lucerne',
          good: true
        });
        analytics.equal(window.s.pageName, 'Drank Some Milk');
        analytics.equal(window.s.prop13, '2%');
        analytics.equal(window.s.prop23, 'Lucerne');
        analytics.equal(window.s.prop10, 'true');
      });

      it('should send user.id as visitorID', function() {
        user.id('user-id');
        analytics.page('name');
        analytics.equal(window.s.pageName, 'name');
        analytics.equal(window.s.visitorID, 'user-id');
      });

      it('should not send empty user.id as visitorID', function() {
        analytics.page('name');
        analytics.equal(window.s.pageName, 'name');
        analytics.equal(window.s.visitorID, undefined);
      });

      it('tracks basic properties', function() {
        analytics.page('event10', {
          prop1: 20,
          prop50: 'good',
          prop73: true
        });
        analytics.equal(window.s.pageName, 'event10');
        analytics.equal(window.s.prop73, 'true');
        analytics.equal(window.s.prop1, '20');
        analytics.equal(window.s.prop50, 'good');
      });

      it('tracks aliased eVars', function() {
        analytics.page('Drank Some Milk', {
          car: '2003 Accord (only one previous owner)',
          dog: 'Dog',
          good: false
        });
        analytics.equal(window.s.pageName, 'Drank Some Milk');
        analytics.equal(window.s.eVar1, '2003 Accord (only one previous owner)');
        analytics.equal(window.s.eVar47, 'Dog');
      });

      it('tracks aliased eVars with nested properties', function() {
        analytics.page('Drank Some Milk', {
          car: { info: '2003 Accord (only one previous owner)' },
          'my.dog': 'Dog',
          good: false
        });
        analytics.equal(window.s.pageName, 'Drank Some Milk');
        analytics.equal(window.s.eVar101, '2003 Accord (only one previous owner)');
        analytics.equal(window.s.eVar401, 'Dog');
      });

      it('tracks basic eVars', function() {
        analytics.page('event20', {
          eVar20: '123',
          eVar54: false,
          eVar: 'a'
        });
        analytics.equal(window.s.pageName, 'event20');
        analytics.equal(window.s.eVar, undefined);
        analytics.equal(window.s.eVar20, '123');
        analytics.equal(window.s.eVar54, 'false');
      });

      it('tracks basic hVars', function() {
        analytics.page('event20', {
          hier_group1: 'animals:dogs',
          hier_group2: 'sports:baseball',
          hier3: 'a'
        });
        analytics.equal(window.s.pageName, 'event20');
        analytics.equal(window.s.hier1, 'animals:dogs');
        analytics.equal(window.s.hier2, 'sports:baseball');
      });

      it('should respect properties.timestamp', function() {
        var date = new Date();
        analytics.page('event1', { timestamp: date });
        analytics.equal(window.s.timestamp, iso(date));
      });

      it('should fallback to page.timestamp()', function() {
        var date = new Date();
        analytics.page('event1', {}, { timestamp: date });
        analytics.equal(window.s.timestamp, iso(date));
      });

      it('should not send the timestamp if the setting is disabled', function() {
        delete window.s.timestamp;
        omniture.options.includeTimestamp = false;
        analytics.page('event1');
        analytics.equal(window.s.timestamp, null);
      });

      it('should not track an initial page if .initialPage is false', function() {
        omniture.options.initialPage = false;
        analytics.page('event37');
        analytics.notEqual(window.s.pageName, 'event37');
        analytics.assert(omniture.options.page);
      });

      it('should call window.s.t', function() {
        analytics.stub(window.s, 't');
        analytics.page();
        analytics.called(window.s.t);
      });

      it('should clear window.s[variables] between calls', function() {
        analytics.page('event20', { prop20: '123' });
        analytics.equal(window.s.prop20, '123');
        analytics.page('event20', { prop25: 'heyo' });
        analytics.assert(!window.s.prop20);
        analytics.equal(window.s.prop25, 'heyo');
      });
    });
  });
});

/**
 * Returns whether the string contains all of the substrings
 *
 * @param {string} str
 * @param {...string} substrings
 */

function contains(str) {
  var args = Array.prototype.slice.call(1, arguments);
  for (var i = 0; i < args.length; i++) {
    if (str.indexOf(args[i]) === -1) return false;
  }
  return true;
}
