'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var NielsenDCR = require('../lib/');
var sinon = require('sinon');

describe('NielsenDCR', function() {
  var analytics;
  var nielsenDCR;
  var options = {
    appId: 'PE624774F-D1ED-4244-AA7E-62B3A9A6ED0E',
    instanceName: 'segmentNielsen',
    nolDevDebug: false,
    optout: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    nielsenDCR = new NielsenDCR(options);
    analytics.use(integrationTester);
    analytics.use(NielsenDCR);
    analytics.add(nielsenDCR);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    nielsenDCR.reset();
    sandbox();
  });

  it('should have the correct options', function() {
    analytics.compare(
      NielsenDCR,
      integration('Nielsen DCR')
        .option('appId', '')
        .option('instanceName', '')
        .tag(
          'http',
          '<script src="http://cdn-gl.imrworldwide.com/conf/{{ appId }}.js#name={{ instanceName }}&ns=NOLBUNDLE">'
        )
        .tag(
          'https',
          '<script src="https://cdn-gl.imrworldwide.com/conf/{{ appId }}.js#name={{ instanceName }}&ns=NOLBUNDLE">'
        )
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(nielsenDCR, 'load');
    });

    describe('#initialize', function() {
      it('should call load', function() {
        analytics.initialize();
        analytics.called(nielsenDCR.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(nielsenDCR, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(nielsenDCR._client, 'ggPM');
      });

      it('should send static metadata', function() {
        analytics.page();
        var staticMetadata = {
          type: 'static',
          assetid: window.location.href,
          section: 'Loaded a Page'
        };
        analytics.called(
          nielsenDCR._client.ggPM,
          'staticstart',
          staticMetadata
        );
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'clearInterval');
        analytics.stub(nielsenDCR, 'heartbeat');
        analytics.stub(nielsenDCR._client, 'ggPM');
      });

      describe('#playback events', function() {
        var props;
        beforeEach(function() {
          props = {
            session_id: '12345',
            content_asset_id: '0129370',
            content_pod_id: 'segA',
            ad_asset_id: null,
            ad_pod_id: null,
            ad_type: null,
            position: 21,
            total_length: 392,
            sound: 88,
            bitrate: 100,
            full_screen: false,
            video_player: 'youtube',
            ad_enabled: false,
            quality: 'hd1080'
          };
        });

        it('video playback seek completed', function() {
          var timestamp = new Date();
          analytics.track('Video Playback Seek Completed', props, {
            timestamp: timestamp
          });
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR.heartbeat,
            props.content_asset_id,
            props.position,
            {
              type: 'content',
              livestream: props.livestream,
              timestamp: timestamp
            }
          );
        });

        it('video playback paused', function() {
          analytics.track('Video Playback Paused', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });

        it('video playback resumed', function() {
          analytics.track('Video Playback Resumed', props);
          analytics.called(nielsenDCR.heartbeat, props.content_asset_id, 21, {
            type: 'content'
          });
        });

        it('video playback interrupted during content', function() {
          analytics.track('Video Playback Interrupted', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'end', props.position);
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });

        it('video playback interrupted during ad', function() {
          analytics.track('Video Playback Interrupted', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });

        it('video playback completed', function() {
          analytics.track('video playback completed', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR._client.ggPM,
            'setPlayheadPosition',
            props.position
          );
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });

        it('video playback completed w livestream', function() {
          var timestamp = new Date();
          var sandbox = sinon.sandbox.create();
          var currentUTC = +Date.now(timestamp);
          sandbox.stub(Date, 'now').returns(currentUTC);
          var props = {
            session_id: '12345',
            content_asset_id: null,
            content_pod_id: null,
            ad_asset_id: 'ad907',
            ad_pod_id: 'adSegB',
            ad_type: null,
            position: 392,
            total_length: 392,
            sound: 88,
            bitrate: 100,
            full_screen: false,
            video_player: 'youtube',
            ad_enabled: false,
            quality: 'hd1080',
            livestream: true,
            timestamp: timestamp
          };
          analytics.track('video playback completed', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR._client.ggPM,
            'setPlayheadPosition',
            currentUTC
          );
          analytics.called(nielsenDCR._client.ggPM, 'stop', currentUTC);
          sandbox.restore();
        });
      });

      describe('#content events', function() {
        var props;
        beforeEach(function() {
          props = {
            session_id: '12345',
            asset_id: '0129370',
            pod_id: 'segA',
            title: 'Interview with Tony Robbins',
            description: 'short description',
            keywords: ['entrepreneurship', 'motivation'],
            season: '2',
            episode: '177',
            genre: 'entrepreneurship',
            program: 'Tim Ferris Show',
            publisher: 'Tim Ferris',
            position: 0,
            total_length: 360,
            channel: 'espn',
            full_episode: true,
            livestream: false,
            airdate: '1991-08-13'
          };
        });

        it('video content started', function() {
          var timestamp = new Date();
          analytics.track('Video Content Started', props, {
            page: { url: 'segment.com' },
            'Nielsen DCR': { ad_load_type: 'dynamic' },
            timestamp: timestamp
          });
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'loadMetadata', {
            type: 'content',
            assetid: props.asset_id,
            program: props.program,
            title: props.title,
            length: props.total_length,
            isfullepisode: 'y',
            mediaURL: 'segment.com',
            airdate: new Date(props.airdate),
            adloadtype: '2',
            hasAds: '0'
          });
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            {
              livestream: props.livestream,
              type: 'content',
              timestamp: timestamp
            }
          );
        });

        it('video content started - livestream', function() {
          var timestamp = new Date();
          props.livestream = true;
          props.total_length = null;
          props.position = -30; // offset in seconds
          analytics.track('Video Content Started', props, {
            page: { url: 'segment.com' },
            'Nielsen DCR': { ad_load_type: 'dynamic' },
            timestamp: timestamp
          });
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'loadMetadata', {
            type: 'content',
            assetid: props.asset_id,
            program: props.program,
            title: props.title,
            length: 86400,
            isfullepisode: 'y',
            mediaURL: 'segment.com',
            airdate: new Date(props.airdate),
            adloadtype: '2',
            hasAds: '0'
          });
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            {
              livestream: props.livestream,
              type: 'content',
              timestamp: timestamp
            }
          );
        });

        it('video content started - segB/C', function() {
          var timestamp = new Date();
          analytics.track('Video Content Started', props, {
            page: { url: 'segment.com' },
            'Nielsen DCR': {
              ad_load_type: 'dynamic',
              segB: 'bend',
              segC: 'the knee'
            },
            timestamp: timestamp
          });
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'loadMetadata', {
            type: 'content',
            assetid: props.asset_id,
            program: props.program,
            title: props.title,
            length: props.total_length,
            isfullepisode: 'y',
            mediaURL: 'segment.com',
            airdate: new Date(props.airdate),
            adloadtype: '2',
            hasAds: '0',
            segB: 'bend',
            segC: 'the knee'
          });
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            {
              livestream: props.livestream,
              type: 'content',
              timestamp: timestamp
            }
          );
        });

        // heartbeats
        it('video content playing', function() {
          var timestamp = new Date();
          analytics.track('Video Content Playing', props, {
            timestamp: timestamp
          });
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            {
              livestream: props.livestream,
              type: 'content',
              timestamp: timestamp
            }
          );
        });

        it('video content completed', function() {
          analytics.track('Video Content Completed', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR._client.ggPM,
            'setPlayheadPosition',
            props.position
          );
          analytics.called(nielsenDCR._client.ggPM, 'end', props.position);
        });

        it('video content completed — livestream', function() {
          var timestamp = new Date();
          var sandbox = sinon.sandbox.create();
          var currentUTC = +Date.now(timestamp);
          sandbox.stub(Date, 'now').returns(currentUTC);
          props.livestream = true;
          analytics.track('Video Content Completed', props, {
            timestamp: timestamp
          });
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR._client.ggPM,
            'setPlayheadPosition',
            currentUTC
          );
          analytics.called(nielsenDCR._client.ggPM, 'end', currentUTC);
          sandbox.restore();
        });
      });

      describe('#ad events', function() {
        var props;
        beforeEach(function() {
          props = {
            session_id: '12345',
            asset_id: 'ad123',
            pod_id: 'adSegA',
            type: 'mid-roll',
            title: 'Segment Connection Modes',
            publisher: 'Segment',
            position: 0,
            total_length: 21,
            load_type: 'dynamic'
          };
        });

        it('video ad started', function() {
          analytics.track('Video Ad Started', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'loadMetadata', {
            assetid: props.asset_id,
            type: 'midroll'
          });
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            { type: 'ad' }
          );
        });

        it('video ad started — preroll', function() {
          props.type = 'pre-roll';
          props.content = {
            session_id: '12345',
            asset_id: '0129370',
            pod_id: 'segA',
            title: 'Interview with Tony Robbins',
            description: 'short description',
            keywords: ['entrepreneurship', 'motivation'],
            season: '2',
            episode: '177',
            genre: 'entrepreneurship',
            program: 'Tim Ferris Show',
            publisher: 'Tim Ferris',
            position: 0,
            total_length: 360,
            channel: 'espn',
            full_episode: true,
            livestream: false,
            airdate: '1991-08-13'
          };
          analytics.track('Video Ad Started', props, {
            page: { url: 'segment.com' }
          });
          analytics.called(window.clearInterval);
          analytics.assert.deepEqual(nielsenDCR._client.ggPM.args[0], [
            'loadMetadata',
            {
              type: 'content',
              assetid: props.content.asset_id,
              program: props.content.program,
              title: props.content.title,
              length: props.content.total_length,
              isfullepisode: 'y',
              mediaURL: 'segment.com',
              airdate: new Date(props.content.airdate),
              adloadtype: '2',
              hasAds: '0'
            }
          ]);
          analytics.assert.deepEqual(nielsenDCR._client.ggPM.args[1], [
            'loadMetadata',
            {
              assetid: props.asset_id,
              type: 'preroll'
            }
          ]);
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            { type: 'ad' }
          );
        });

        // heartbeats
        it('video ad playing', function() {
          analytics.track('Video Ad Playing', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            { type: 'ad' }
          );
        });

        it('video ad completed', function() {
          analytics.track('Video Ad Completed', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR._client.ggPM,
            'setPlayheadPosition',
            props.position
          );
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });
      });
    });
  });
});
