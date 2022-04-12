'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var NielsenDCR = require('../lib/');

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
  });

  it('should have the correct options', function() {
    analytics.compare(
      NielsenDCR,
      integration('Nielsen DCR')
        .option('appId', '')
        .option('instanceName', '')
        .option('nolDevDebug', false)
        .option('assetIdPropertyName', '') // deprecated
        .option('contentAssetIdPropertyName', '')
        .option('adAssetIdPropertyName', '')
        .option('subbrandPropertyName', '')
        .option('clientIdPropertyName', '')
        .option('customSectionProperty', '')
        .option('contentLengthPropertyName', 'total_length')
        .option('optout', false)
        .option('sendCurrentTimeLivestream', false)
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
      nielsenDCR.isDCRStream = true;
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(nielsenDCR._client, 'ggPM');
      });

      it('should send static metadata', function() {
        analytics.page();
        var staticMetadata = {
          type: 'static',
          assetid: 'ff4c0efe94509b3d21872f0c0bfec92faaed5ae46d707b6ea832a74f9f1fe38d',
          section: 'Loaded a Page'
        };
        analytics.called(
          nielsenDCR._client.ggPM,
          'staticstart',
          staticMetadata
        );
      });

      it('should send static metadata with custom section name', function() {
        var props;
        props = {
          custom_section_name_prop: 'Custom Page Name'
        }

        nielsenDCR.options.customSectionProperty =
        'custom_section_name_prop';

        analytics.page('Homepage', props);

        var staticMetadata = {
          type: 'static',
          assetid: 'ff4c0efe94509b3d21872f0c0bfec92faaed5ae46d707b6ea832a74f9f1fe38d',
          section: 'Custom Page Name'
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

        it('video playback seek started', function() {
          analytics.track('Video Playback Seek Started', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });

        it('video playback seek completed', function() {
          analytics.track('Video Playback Seek Completed', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR.heartbeat,
            props.content_asset_id,
            props.position,
            props.livestream
          );
        });

        it('video playback buffer started', function() {
          analytics.track('Video Playback Buffer Started', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });

        it('video playback buffer completed', function() {
          analytics.track('Video Playback Buffer Completed', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR.heartbeat,
            props.content_asset_id,
            props.position,
            props.livestream
          );
        });

        it('video playback paused', function() {
          analytics.track('Video Playback Paused', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });

        it('video playback resumed', function() {
          analytics.track('Video Playback Resumed', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR.heartbeat,
            props.content_asset_id,
            props.position,
            props.livestream
          );
        });

        it('video playback interrupted during content', function() {
          analytics.track('Video Playback Interrupted', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });

        it('video playback interrupted during ad', function() {
          analytics.track('Video Playback Interrupted', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });

        it('video playback exited', function() {
          analytics.track('Video Playback Exited', props);
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
          analytics.called(nielsenDCR._client.ggPM, 'end', props.position);
        });

        it('video playback completed w livestream', function() {
          var timestamp;
          props = {
            session_id: '12345',
            content_asset_id: null,
            content_pod_id: null,
            ad_asset_id: 'ad907',
            ad_pod_id: 'adSegB',
            ad_type: null,
            position: -100,
            total_length: 392,
            sound: 88,
            bitrate: 100,
            full_screen: false,
            video_player: 'youtube',
            ad_enabled: false,
            quality: 'hd1080',
            livestream: true
          };
          timestamp = Math.floor(Date.now() / 1000) + props.position;
          analytics.track('video playback completed', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR._client.ggPM,
            'setPlayheadPosition',
            timestamp
          );
          analytics.called(nielsenDCR._client.ggPM, 'end', timestamp);
        });

        it('video playback completed w livestream when `sendCurrentTimeLivestream` enabled', function() {
          nielsenDCR.options.sendCurrentTimeLivestream = true;
          var timestamp;
          var props = {
            session_id: '12345',
            content_asset_id: null,
            content_pod_id: null,
            ad_asset_id: 'ad907',
            ad_pod_id: 'adSegB',
            ad_type: null,
            position: -100,
            total_length: 392,
            sound: 88,
            bitrate: 100,
            full_screen: false,
            video_player: 'youtube',
            ad_enabled: false,
            quality: 'hd1080',
            livestream: true
          };
          timestamp = Math.floor(Date.now() / 1000);
          analytics.track('video playback completed', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR._client.ggPM,
            'setPlayheadPosition',
            timestamp
          );
          analytics.called(nielsenDCR._client.ggPM, 'end', timestamp);
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
            custom_asset_id_prop: '12345',
            genre: 'entrepreneurship',
            program: 'Tim Ferris Show',
            publisher: 'Tim Ferris',
            position: 0,
            total_length: 360,
            channel: 'espn',
            full_episode: true,
            livestream: false,
            airdate: new Date('1991-08-13'),
            load_type: 'dynamic'
          };
        });

        it('video content started', function() {
          analytics.track('Video Content Started', props, {
            page: { url: 'segment.com' },
            'Nielsen DCR': { ad_load_type: 'dynamic' }
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
            airdate: '19910813 12:00:00',
            adloadtype: '2',
            hasAds: '0'
          });
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            props.livestream
          );
        });

        it('video content started - custom asset id', function() {
          nielsenDCR.options.contentAssetIdPropertyName =
            'custom_asset_id_prop';
          analytics.track('Video Content Started', props, {
            page: { url: 'segment.com' },
            'Nielsen DCR': { ad_load_type: 'dynamic' }
          });
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'loadMetadata', {
            type: 'content',
            assetid: props.custom_asset_id_prop,
            program: props.program,
            title: props.title,
            length: props.total_length,
            isfullepisode: 'y',
            mediaURL: 'segment.com',
            airdate: '19910813 12:00:00',
            adloadtype: '2',
            hasAds: '0'
          });
          analytics.called(
            nielsenDCR.heartbeat,
            props.custom_asset_id_prop,
            props.position,
            props.livestream
          );
        });

        it('video content started - custom content length', function() {
          nielsenDCR.options.contentLengthPropertyName = 'total_content_length';
          props.total_content_length = 460;
          analytics.track('Video Content Started', props, {
            page: { url: 'segment.com' },
            'Nielsen DCR': { ad_load_type: 'dynamic' }
          });
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'loadMetadata', {
            type: 'content',
            assetid: props.asset_id,
            program: props.program,
            title: props.title,
            length: props.total_content_length,
            isfullepisode: 'y',
            mediaURL: 'segment.com',
            airdate: '19910813 12:00:00',
            adloadtype: '2',
            hasAds: '0'
          });
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            props.livestream
          );
        });

        it('video content started with cid/vcid override', function() {
          nielsenDCR.options.clientIdPropertyName = 'nielsen_client_id';
          nielsenDCR.options.subbrandPropertyName = 'nielsen_subbrand';
          props.nielsen_subbrand = 'test network name';
          props.nielsen_client_id = 'test client id';
          analytics.track('Video Content Started', props, {
            page: { url: 'segment.com' },
            'Nielsen DCR': { ad_load_type: 'dynamic' }
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
            airdate: '19910813 12:00:00',
            adloadtype: '2',
            hasAds: '0',
            clientid: props.nielsen_client_id,
            subbrand: props.nielsen_subbrand
          });
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            props.livestream
          );
        });

        it('video content started - livestream', function() {
          props.livestream = true;
          props.total_length = null;
          props.position = -30; // offset in seconds
          analytics.track('Video Content Started', props, {
            page: { url: 'segment.com' },
            'Nielsen DCR': { ad_load_type: 'dynamic' }
          });
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'loadMetadata', {
            type: 'content',
            assetid: props.asset_id,
            program: props.program,
            title: props.title,
            length: 0,
            isfullepisode: 'y',
            mediaURL: 'segment.com',
            airdate: '19910813 12:00:00',
            adloadtype: '2',
            hasAds: '0'
          });
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            props.livestream
          );
        });

        it('video content started - segB/C', function() {
          analytics.track('Video Content Started', props, {
            page: { url: 'segment.com' },
            'Nielsen DCR': {
              ad_load_type: 'dynamic',
              segB: 'bend',
              segC: 'the knee'
            }
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
            airdate: '19910813 12:00:00',
            adloadtype: '2',
            hasAds: '0',
            segB: 'bend',
            segC: 'the knee'
          });
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            props.livestream
          );
        });

        it('video content started - should NOT call ANY Nielsen methods if load_type is not dynamic', function() {
          props.load_type = 'linear';
          analytics.track('Video Content Started', props, {
            page: { url: 'segment.com' },
            'Nielsen DCR': {
              segB: 'bend',
              segC: 'the knee'
            }
          });
          analytics.called(window.clearInterval);
          analytics.didNotCall(nielsenDCR._client.ggPM, 'loadMetadata', {
            type: 'content',
            assetid: props.asset_id,
            program: props.program,
            title: props.title,
            length: props.total_length,
            isfullepisode: 'y',
            mediaURL: 'segment.com',
            airdate: '19910813 12:00:00',
            adloadtype: '1',
            hasAds: '0',
            segB: 'bend',
            segC: 'the knee'
          });
          analytics.didNotCall(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            props.livestream
          );
        });

        // heartbeats
        it('video content playing', function() {
          analytics.track('Video Content Playing', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR.heartbeat,
            props.asset_id,
            props.position,
            props.livestream
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
          analytics.called(nielsenDCR._client.ggPM, 'stop', props.position);
        });

        it('video content completed — livestream', function() {
          var timestamp = Math.floor(Date.now() / 1000) + props.position;
          props.livestream = true;
          analytics.track('Video Content Completed', props);
          analytics.called(window.clearInterval);
          analytics.called(
            nielsenDCR._client.ggPM,
            'setPlayheadPosition',
            timestamp
          );
          analytics.called(nielsenDCR._client.ggPM, 'stop', timestamp);
        });
      });

      describe('#ad events', function() {
        var props;
        beforeEach(function() {
          props = {
            session_id: '12345',
            asset_id: 'ad123',
            custom_asset_id_prop: 'abcdef12345',
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
          analytics.called(nielsenDCR.heartbeat, undefined, props.position);
        });

        it('video ad started with custom asset id', function() {
          nielsenDCR.options.adAssetIdPropertyName = 'custom_asset_id_prop';
          analytics.track('Video Ad Started', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR._client.ggPM, 'loadMetadata', {
            assetid: props.custom_asset_id_prop,
            type: 'midroll'
          });
          analytics.called(nielsenDCR.heartbeat, undefined, props.position);
        });

        it('video ad started — preroll', function() {
          props.type = 'pre-roll';
          props.content = {
            session_id: '12345',
            asset_id: '0129370',
            custom_asset_id_prop: 'abcdef12345',
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
            airdate: new Date('1991-08-13'),
            load_type: 'dynamic'
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
              airdate: '19910813 12:00:00',
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
            props.content.asset_id,
            props.position
          );
        });

        it('video ad started — preroll with custom asset id', function() {
          nielsenDCR.options.contentAssetIdPropertyName =
            'custom_asset_id_prop';
          props.type = 'pre-roll';
          props.content = {
            session_id: '12345',
            asset_id: '0129370',
            custom_asset_id_prop: 'abcdef12345',
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
            airdate: new Date('1991-08-13'),
            load_type: 'dynamic'
          };
          analytics.track('Video Ad Started', props, {
            page: { url: 'segment.com' }
          });
          analytics.called(window.clearInterval);
          analytics.assert.deepEqual(nielsenDCR._client.ggPM.args[0], [
            'loadMetadata',
            {
              type: 'content',
              assetid: props.content.custom_asset_id_prop,
              program: props.content.program,
              title: props.content.title,
              length: props.content.total_length,
              isfullepisode: 'y',
              mediaURL: 'segment.com',
              airdate: '19910813 12:00:00',
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
            props.content.custom_asset_id_prop,
            props.position
          );
        });

        it('video ad started — preroll with cid/vcid override', function() {
          nielsenDCR.options.clientIdPropertyName = 'nielsen_client_id';
          nielsenDCR.options.subbrandPropertyName = 'nielsen_subbrand';
          props.type = 'pre-roll';
          props.content = {
            session_id: '12345',
            asset_id: '0129370',
            custom_asset_id_prop: 'abcdef12345',
            nielsen_subbrand: 'test network name',
            nielsen_client_id: 'test client id',
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
            airdate: new Date('1991-08-13'),
            load_type: 'dynamic'
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
              airdate: '19910813 12:00:00',
              adloadtype: '2',
              hasAds: '0',
              clientid: props.content.nielsen_client_id,
              subbrand: props.content.nielsen_subbrand
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
            props.content.asset_id,
            props.position
          );
        });

        // heartbeats
        it('video ad playing', function() {
          analytics.track('Video Ad Playing', props);
          analytics.called(window.clearInterval);
          analytics.called(nielsenDCR.heartbeat, null, props.position);
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
