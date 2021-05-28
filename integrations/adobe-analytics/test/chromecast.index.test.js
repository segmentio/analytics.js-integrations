'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var AdobeAnalytics = require('../lib');
var iso = require('@segment/to-iso-string');

describe('Adobe Analytics - Chromecast', function () {
  var analytics;
  var adobeAnalytics;
  var user;
  var options = {
    version: 2,
    chromecastToggle: true,
    reportSuiteId: 'sgmtest',
    trackingServerUrl: 'exchangepartnersegment.sc.omtrdc.net',
    trackingServerSecureUrl: '',
    heartbeatTrackingServerUrl: 'https://exchangepartnersegment.hb.omtrdc.net',
    marketingCloudOrgId: '1234567ABC@AdobeOrg',
    events: [
      { segmentEvent: 'Played a Song', adobeEvents: ['event1'] },
      { segmentEvent: 'Drank Some Milk', adobeEvents: ['event6'] },
      { segmentEvent: 'Overlord exploded', adobeEvents: ['event7'] }
    ],
    merchEvents: [],
    eVars: {
      Car: 'eVar1',
      Dog: 'eVar47',
      'Overlord exploded': 'eVar65',
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
    },
    lVars: {
      names: 'list1'
    },
    contextValues: {
      video_genre: 'video_genre',
      video_asset_title: 'video_asset_title',
      video_series_name: 'video_series_name',
      'page.title': 'page_title'
    },
    customDataPrefix: '',
    timestampOption: 'enabled',
    enableTrackPageName: true,
    disableVisitorId: false,
    preferVisitorId: false,
    enableHeartbeat: true
  };

  beforeEach(function () {
    analytics = new Analytics();
    adobeAnalytics = new AdobeAnalytics(options);
    analytics.use(AdobeAnalytics);
    analytics.use(tester);
    analytics.add(adobeAnalytics);
    user = analytics.user();
  });

  afterEach(function () {
    analytics.restore();
    analytics.reset();
    adobeAnalytics.reset();
    sandbox();
  });


  describe('before loading', function () {
    beforeEach(function () {
      analytics.stub(adobeAnalytics, 'load');
    });
  });

  // describe('loading', function () {
  //   it('should load', function (done) {
  //     analytics.load(adobeAnalytics, done);
  //   });
  // });

  describe('after loading', function () {
    beforeEach(function (done) {
      analytics.once('ready', done);
      analytics.initialize();
    });


    describe('#track', function () {
      beforeEach(function () {

        analytics.stub(window, 'ADBMobile');
        analytics.stub(window.ADBMobile, 'analytics');
        analytics.stub(window.ADBMobile.analytics, 'trackAction');
      });


      it('tracks single mapped events', function () {

        adobeAnalytics.options.events = [
          { segmentEvent: 'Drank Some choc Milk', adobeEvents: ['event7'] },
        ];

        analytics.track('Drank Some choc Milk');
        analytics.called(window.ADBMobile.analytics.trackAction, 'event7');
      });

      it('tracks multiple adobe mapped events', function () {

        adobeAnalytics.options.events = [
          { segmentEvent: 'Drank Some choc Milk', adobeEvents: ['event7', 'event8'] },
        ];

        analytics.track('Drank Some choc Milk');
        analytics.called(window.ADBMobile.analytics.trackAction, 'event7');
        analytics.called(window.ADBMobile.analytics.trackAction, 'event8');
      });

      it('tracks events without adobe mapping', function () {

        analytics.track('this event has no adobe mapping');
        analytics.didNotCall(window.ADBMobile.analytics.trackAction);
        analytics.didNotCall(window.ADBMobile.analytics.trackAction, 'this event has no adobe mapping');

      });

    });



  });

});

/**
 * Returns true if the string contains all of the substrings passed
 * in the argument. Also fails if you do not pass enough arguments aka
 * missing to check parameters
 *
 * @param {string} str
 * @param {...string} substrings
 */

function contains(str) {
  var requiredNumberOfArgs = str.split(',').length;
  var args = Array.prototype.slice.call(arguments);
  args.shift();
  if (args.length !== requiredNumberOfArgs) return false;
  for (var i = 0; i < args.length; i++) {
    if (str.indexOf(args[i]) === -1) return false;
  }
  return true;
}
