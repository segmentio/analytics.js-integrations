'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var AdobeAnalytics = require('../lib');
var iso = require('@segment/to-iso-string');
var assert = require('assert');
var Analytics = require('@segment/analytics.js-core').constructor;
var chromecastHeartbeat = require('../lib/chromecast-heartbeat');
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
    heartbeatTrackingServerUrl: 'https://exchangepartnersegment.hb-api.omtrdc.net',
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

  describe('after loading', function () {
    beforeEach(function (done) {


      analytics.once('ready', done);
      analytics.initialize();
    });


    describe('#page', function () {
      it('should call trackstate with pagename when page is called', function () {
        analytics.stub(window, 'ADBMobile');
        analytics.stub(window.ADBMobile, 'analytics');
        analytics.stub(window.ADBMobile.analytics, 'trackState');
        analytics.stub(window.ADBMobile, 'config');
        analytics.stub(window.ADBMobile.config, 'setUserIdentifier');
        analytics.page('page name 1');
        analytics.called(window.ADBMobile.analytics.trackState);
      });

    });
    describe('#track', function () {
      let bufferStartSub;
      beforeEach(function () {
        analytics.stub(window.ADBMobile.analytics, 'trackAction');
        analytics.stub(window.ADBMobile.analytics, 'createMediaObject');
        analytics.stub(window.ADBMobile, 'media');
        window.ADBMobile.media.createMediaObject = (() => {
          return {
            'media.granularadtracking': false,
            'media.id': "assetid",
            'media.length': 600,
            'media.name': "sdfds",
            'media.prerollwaittime': 250,
            'media.resumed': false,
            'media.streamtype': "VOD",
            'media.type': "video",
          }
        });
        analytics.stub(window.ADBMobile.media, 'MediaObjectKey');
        window.ADBMobile.media.MediaObjectKey.StandardMediaMetadata = "media.standardmetadata";
        analytics.stub(window.ADBMobile.media, 'trackSessionStart');
        analytics.stub(window.ADBMobile.media, 'trackSessionEnd');
        analytics.stub(window.ADBMobile.media, 'trackComplete');
        analytics.stub(window.ADBMobile.media, 'setDelegate');
        analytics.stub(window.ADBMobile.media, 'trackEvent');
        analytics.stub(window.ADBMobile.media, 'trackPlay');
        analytics.stub(window.ADBMobile.media, 'trackPause');
        analytics.stub(window.ADBMobile.media, 'createChapterObject');
        analytics.stub(window.ADBMobile.media, 'ChapterStart');
        analytics.stub(window.ADBMobile.media, 'Event');
        window.ADBMobile.media.Event = {
          AdBreakComplete: "adBreakComplete",
          AdBreakStart: "adBreakStart",
          AdComplete: "adComplete",
          AdSkip: "adSkip",
          AdStart: "adStart",
          BitrateChange: "bitrateChange",
          BufferComplete: "bufferComplete",
          BufferStart: "bufferStart",
          ChapterComplete: "chapterComplete",
          ChapterSkip: "chapterSkip",
          ChapterStart: "chapterStart",
          SeekComplete: "seekComplete",
          SeekStart: "seekStart",
          StateEnd: "stateEnd",
          StateStart: "stateStart",
        }
        window.ADBMobile.media.VideoMetadataKeys = {
          AD_LOAD: "a.media.adLoad",
          ASSET_ID: "a.media.asset",
          AUTHORIZED: "a.media.pass.auth",
          DAY_PART: "a.media.dayPart",
          EPISODE: "a.media.episode",
          FEED: "a.media.feed",
          FIRST_AIR_DATE: "a.media.airDate",
          FIRST_DIGITAL_DATE: "a.media.digitalDate",
          GENRE: "a.media.genre",
          MVPD: "a.media.pass.mvpd",
          NETWORK: "a.media.network",
          ORIGINATOR: "a.media.originator",
          RATING: "a.media.rating",
          SEASON: "a.media.season",
          SHOW: "a.media.show",
          SHOW_TYPE: "a.media.type",
          STREAM_FORMAT: "a.media.format"
        }

        analytics.stub(window.ADBMobile.media, 'createQoSObject');
      });

      afterEach(function () {
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

      var sessionId = 'session-' + Math.ceil(Math.random() * 1000);
      it('should initialize Heartbeat when a video session begins', function () {

        adobeAnalytics.options.contextValues = {
          video_genre: 'video_genre',
          video_asset_title: 'video_asset_title',
          video_series_name: 'video_series_name',
          'page.title': 'page_title'
        };
        analytics.track('Video Playback Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          position: 5,
          program: "test program",
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false,
          video_genre: "Docco",

        });
        analytics.calledOnce(window.ADBMobile.media.setDelegate);

      });




      it('should initialize Heartbeat even if a user does not explicitly start the session first', function () {
        analytics.track('Video Content Started', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.createChapterObject);
        analytics.calledOnce(window.ADBMobile.media.trackEvent);
        analytics.calledOnce(window.ADBMobile.media.trackPlay)
      });

      it('should call trackPlay when a video resumes', function () {

        analytics.track('Video Playback Resumed', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });

        analytics.calledOnce(window.ADBMobile.media.trackPlay)
      });

      it('should call trackPause when a video is paused', function () {
        analytics.track('Video Playback Paused', {
          session_id: sessionId,
          channel: 'Black Mesa',
          video_player: 'Transit Announcement System',
          playhead: 5,
          asset_id: 'Gordon Freeman',
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.trackPause)
      });

      it('should call bufferStart when a video playback buffer started', function () {
        analytics.track('Video Playback Buffer Started', {
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.trackEvent, window.ADBMobile.media.Event.BufferStart)
      });


      it('should call bufferComplete when a video playback buffer completed', function () {
        analytics.track('Video Playback Buffer Completed', {
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.trackEvent, window.ADBMobile.media.Event.BufferComplete)
      });



      it('should call seek start when a video playback seek started', function () {
        analytics.track('Video Playback Seek Started', {
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.trackEvent, window.ADBMobile.media.Event.SeekStart)
      });

      it('should call seek completed when a video playback seek completed', function () {
        analytics.track('Video Playback Seek Completed', {
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.trackEvent, window.ADBMobile.media.Event.SeekComplete)
      });

      it('should call track session end and track complete when video playback completed', function () {
        analytics.track('Video Playback Completed', {
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.trackSessionEnd)
        analytics.calledOnce(window.ADBMobile.media.trackComplete)
      });
      it('should call track pause when video playback interrupted', function () {
        analytics.track('Video Playback Interrupted', {
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.trackPause)
      });


      it('should call track pause when video playback interrupted', function () {
        analytics.stub(window.ADBMobile.media.Event, 'BitrateChange')
        analytics.stub(window.ADBMobile.media, 'createQoSObject')
        analytics.track('Video Quality Updated', {
          bitrate: 500,
          framerate: 23,
          startupTime: 88,
          droppedFrames: 99
        });
        analytics.calledOnce(window.ADBMobile.media.createQoSObject, 500, 99, 23, 88);
        analytics.calledOnce(window.ADBMobile.media.trackEvent, window.ADBMobile.media.Event.BitrateChange)
      });

      it('should call trackEvent, createChapterObject and trackPlay when video content started', function () {
        analytics.track('Video Content Started', {
          title: 'Half-Life',
          total_length: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.createChapterObject)
        analytics.calledOnce(window.ADBMobile.media.trackEvent, ADBMobile.media.Event.ChapterStart)
        analytics.calledOnce(window.ADBMobile.media.trackPlay)
      });

      it('should call trackPlay when video content playing', function () {
        analytics.track('Video Content Playing', {
          title: 'Half-Life',
          position: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.trackPlay)
      });


      it('should call trackSessionEnd and trackComplete when video content completed', function () {
        analytics.stub(window.ADBMobile.media, 'trackSessionEnd')
        analytics.track('Video Content Completed', {
          title: 'Half-Life',
          position: 1260,
          livestream: false
        });
        analytics.calledOnce(window.ADBMobile.media.trackEvent, window.ADBMobile.media.Event.ChapterComplete)
      });


      it('should call trackEvent twice and Video Ad Started', function () {
        analytics.stub(window.ADBMobile.media, 'createAdObject')
        analytics.stub(window.ADBMobile.media, 'createAdBreakObject')
        analytics.stub(window.ADBMobile.media, 'AdMetadataKeys')
        analytics.stub(window.ADBMobile.media.AdMetadataKeys, 'ADVERTISER')
        analytics.stub(window.ADBMobile.media.AdMetadataKeys, 'CAMPAIGN_ID')

        analytics.track('Video Ad Started', {
          title: 'Half-Life',
          asset_id: "aaaaa",
          position: 2,
          total_length: 23423
        });
        analytics.calledOnce(window.ADBMobile.media.createAdObject, 'Half-Life', 'aaaaa', 2, 23423);
        analytics.calledOnce(window.ADBMobile.media.createAdBreakObject, 'Half-Life', 2, 1);
        analytics.calledTwice(window.ADBMobile.media.trackEvent, window.ADBMobile.media.Event)
      });

      it('should not call trackEvent when Video Ad Playing', function () {
        analytics.stub(window.ADBMobile.media, 'createAdObject')
        analytics.track('Video Ad Playing', {
          title: 'Half-Life',
          asset_id: "aaaaa",
          position: 2,
          total_length: 23423
        });
        analytics.didNotCall(window.ADBMobile.media.trackEvent)


      });

      it('should not call createAdObject when Video Ad Playing', function () {
        analytics.stub(window.ADBMobile.media, 'createAdObject')
        analytics.track('Video Ad Playing', {
          title: 'Half-Life',
          asset_id: "aaaaa",
          position: 2,
          total_length: 23423
        });
        analytics.didNotCall(window.ADBMobile.media.createAdObject);
      });

      it('should call trackEvent when Video Ad Skipped', function () {
        analytics.stub(window.ADBMobile.media, 'createAdObject')
        analytics.track('Video Ad Skipped', {
          title: 'Half-Life',
          asset_id: "aaaaa",
          position: 2,
          total_length: 23423
        });
        analytics.calledOnce(window.ADBMobile.media.trackEvent, window.ADBMobile.media.Event.AdSkip)
      });



      it('should call trackEvent when video ad completed', function () {
        analytics.track('Video Ad Completed', {
          title: 'Half-Life',
          asset_id: "aaaaa",
          position: 2,
          total_length: 23423
        });
        analytics.calledTwice(window.ADBMobile.media.trackEvent)
        analytics.called(window.ADBMobile.media.trackEvent, window.ADBMobile.media.Event.AdComplete)
        analytics.called(window.ADBMobile.media.trackEvent, window.ADBMobile.media.Event.AdBreakComplete)
      });

      it('should call trackEvent when video playback exited', function () {
        analytics.track('Video Playback Exited', {
          title: 'Half-Life',
          asset_id: "aaaaa",
          position: 2,
          total_length: 23423
        });
        analytics.calledOnce(window.ADBMobile.media.trackPause)
        analytics.calledOnce(window.ADBMobile.media.trackSessionEnd)
      });
    });
  });
});

describe('Chromecast-heatbeat.js extractMediaMetadata', function () {

  function getTestTrack() {
    let track =
    {
      "anonymousId": "anon_123",
      "event": "Product Removed",
      "messageId": "ajs-gfvhgf",
      "timestamp": "2021-07-06T03:14:48.765Z",
      "type": "track",
    }

    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: true,
        Car: false
      }
    };
    track.proxy = function(propName){
      return track[propName];
    }

    track.context = function () {
      return {
        "campaign": {},
        "ip": "203.3453454353",
        "library": {
          "name": "analytics.js",
          "version": "4.1.8"
        },
        "locale": "en-GB",
        "page": {
          "path": "/cart",
          "referrer": "https://test.com",
          "search": "?ref=nav-cart&secure=true",
          "title": "Cart | sdfsdfsdfsd",
          "url": "https://test123.com"
        },
        "protocols": {
          "sourceId": "3is1nSA6JnfzfhbvxBTcGJ",
          "violations": [
            {
              "type": "Required",
              "field": "properties.work_id",
              "description": "properties.work_id is required"
            }
          ]
        },
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
      }
    }

    return track;
  }

  it('should map boolean values to string', function () {

    let track = getTestTrack();
    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: true,
        Car: false
      }
    };
    window.settingsContextValues = {
      Airplane: 'attributeName1',
      Car: 'attributeName2',

    };
    let result = chromecastHeartbeat.extractMediaMetadata(track);

    assert.deepStrictEqual(result, {
      attributeName1: 'true',
      attributeName2: 'false',
    });


  });



  it('should not map integer values to string', function () {

    let track = getTestTrack();

    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: 1234
      }
    };
    window.settingsContextValues = {
      Airplane: 'attributeName1',

    };
    let result = chromecastHeartbeat.extractMediaMetadata(track);
    assert.deepStrictEqual(result, {
      attributeName1: 1234,
    });


  });

  it('should map single context Value when exists in track props', function () {

    let track = getTestTrack();

    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: 'test123'
      }
    };
    window.settingsContextValues = {
      Airplane: 'attributeName1',
    };
    let result = chromecastHeartbeat.extractMediaMetadata(track);
    assert.deepStrictEqual(result, { attributeName1: 'test123' });

  });

  it('should return empty object when track props does not contain settings context value', function () {

    let track = getTestTrack();

    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: 'test123'
      }
    };
    window.settingsContextValues = {
      notInTrackProps: 'attributeName1',
    };
    let result = chromecastHeartbeat.extractMediaMetadata(track);
    assert.deepStrictEqual(result, {});

  });

  it('should return empty object when settings context value is empty', function () {

    let track = getTestTrack();

    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: 'test123'
      }
    };
    window.settingsContextValues = {};
    let result = chromecastHeartbeat.extractMediaMetadata(track);
    assert.deepStrictEqual(result, {});

  });



  it('should map multiple property context value when exists in track props', function () {

    let track = getTestTrack();

    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: 'test123',
        tree: 'test1'
      }
    };
    window.settingsContextValues = {
      Airplane: 'attributeName1',
      tree: 'attributeName2',
    };
    let result = chromecastHeartbeat.extractMediaMetadata(track);
    assert.deepStrictEqual(result, { attributeName1: 'test123', attributeName2: 'test1' });

  });


  it('should map anonymousId when contextValue contains anonymousId', function () {

    let track = getTestTrack();

    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: 'test123'
      }
    };
    window.settingsContextValues = {
      anonymousId: 'attributeName1',
    };
    let result = chromecastHeartbeat.extractMediaMetadata(track);
    assert.deepStrictEqual(result, { attributeName1: 'anon_123' });

  });
  it('should map messageId when contextValue contains messageId', function () {

    let track = getTestTrack();
    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: 'test123'
      }
    };
    window.settingsContextValues = {
      messageId: 'attributeName1',
    };
    let result = chromecastHeartbeat.extractMediaMetadata(track);
    assert.deepStrictEqual(result, { attributeName1: 'ajs-gfvhgf' });

  });
  it('should map event when contextValue contains event', function () {

    let track = getTestTrack();
    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: 'test123'
      }
    };
    window.settingsContextValues = {
      event: 'attributeName1',
    };
    let result = chromecastHeartbeat.extractMediaMetadata(track);

    assert.deepStrictEqual(result, { attributeName1: 'Product Removed' });

  });

  it('should map event, anonymousId and messageId when contextValue contains event, anonymousId and messageId', function () {

    let track = getTestTrack();

    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: 'test123'
      }
    };
    window.settingsContextValues = {
      event: 'attributeName1',
      anonymousId: 'attributeName2',
      messageId: 'attributeName3',
    };
    let result = chromecastHeartbeat.extractMediaMetadata(track);

    assert.deepStrictEqual(result, {
      attributeName1: 'Product Removed',
      attributeName2: 'anon_123',
      attributeName3: 'ajs-gfvhgf'

    });
  });

  it('should map values from context object when contextValue contains maps to context object properties', function () {

    let track = getTestTrack();
    track.properties = function () {
      return {
        "coupon": "",
        "currency": "USD",
        Airplane: 'test123'
      }
    };
    window.settingsContextValues = {
      locale: 'attributeName1'
    };
    let result = chromecastHeartbeat.extractMediaMetadata(track);

    assert.deepStrictEqual(result, {
      attributeName1: 'en-GB',

    });
  });


});