'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var NielsenDTVR = require('../lib/');
var sinon = require('sinon');
var Track = require('segmentio-facade').Track;
var assert = require('assert');

describe('NielsenDTVR', function() {
  var analytics;
  var nielsenDTVR;
  var options = {
    appId: 'PE624774F-D1ED-4244-AA7E-62B3A9A6ED0E',
    instanceName: 'segment-test',
    id3Property: 'ID3',
    sendId3Events: [
      'Video Ad Completed',
      'Video Ad Started',
      'Video Content Completed',
      'Video Content Started',
      'Video Playback Buffer Completed',
      'Video Playback Buffer Started',
      'Video Playback Completed',
      'Video Playback Interrupted',
      'Video Playback Paused',
      'Video Playback Resumed',
      'Video Playback Seek Completed',
      'Video Playback Seek Started'
    ]
  };

  beforeEach(function() {
    analytics = new Analytics();
    nielsenDTVR = new NielsenDTVR(options);
    analytics.use(integrationTester);
    analytics.use(NielsenDTVR);
    analytics.add(nielsenDTVR);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    nielsenDTVR.reset();
    sandbox();
  });

  it('should have the correct options', function() {
    analytics.compare(
      NielsenDTVR,
      integration('Nielsen DTVR')
        .option('appId', '')
        .option('instanceName', '')
        .option('id3Property', 'ID3')
        .option('sendId3Events', [])
        .option('optout', false)
        .option('debug', false)
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
      analytics.stub(nielsenDTVR, 'load');
    });

    describe('#initialize', function() {
      it('should call load', function() {
        analytics.initialize();
        analytics.called(nielsenDTVR.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(nielsenDTVR, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('options', function() {
      beforeEach(function() {
        analytics.stub(nielsenDTVR.client, 'ggPM');
      });

      it('should not map ID3 tags for events not mapped in the sendId3Events option', function() {
        nielsenDTVR.options.sendId3Events = [];
        analytics.track('Video Content Started');
        analytics.didNotCall(nielsenDTVR.client.ggPM, 'sendID3');
      });

      it('should send ID3 tags for any mapped track event', function() {
        var props = {
          ID3: '1'
        };
        nielsenDTVR.options.sendId3Events = ['Send ID3'];
        analytics.track('Send ID3', props);
        analytics.called(nielsenDTVR.client.ggPM, 'sendID3', props.ID3);
      });

      it('should respect a custom ID3 tag property set in options', function() {
        var props = {
          asset_id: '123',
          ad_asset_id: null,
          channel: 'segment',
          load_type: 'linear',
          position: 1,
          custom: Math.floor(Math.random() * 100).toString(),
          livestream: false
        };
        nielsenDTVR.options.id3Property = 'custom';
        nielsenDTVR.options.sendId3Events = ['Video Playback Interrupted'];

        analytics.track('Video Playback Interrupted', props);
        analytics.called(nielsenDTVR.client.ggPM, 'sendID3', props.custom);
        analytics.called(nielsenDTVR.client.ggPM, 'end', props.position);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(nielsenDTVR.client, 'ggPM');
      });

      describe('#playback events', function() {
        var props;
        beforeEach(function() {
          props = {
            asset_id: '123',
            ad_asset_id: null,
            channel: 'segment',
            load_type: 'linear',
            position: 1,
            ID3: Math.floor(Math.random() * 100).toString(),
            livestream: false
          };
        });

        it('should send video playback buffer completed', function() {
          analytics.track('Video Playback Buffer Completed', props);
          analytics.called(nielsenDTVR.client.ggPM, 'loadMetadata', {
            type: 'content',
            channelName: 'segment',
            adModel: '1'
          });
          analytics.called(nielsenDTVR.client.ggPM, 'sendID3', props.ID3);
        });

        it('should send video playback buffer started', function() {
          analytics.track('Video Playback Buffer Started', props);
          analytics.called(nielsenDTVR.client.ggPM, 'sendID3', props.ID3);
          analytics.called(nielsenDTVR.client.ggPM, 'end', props.position);
        });

        it('should send video playback interrupted', function() {
          analytics.track('Video Playback Interrupted', props);
          analytics.called(nielsenDTVR.client.ggPM, 'sendID3', props.ID3);
          analytics.called(nielsenDTVR.client.ggPM, 'end', props.position);
        });

        it('should send video playback resumed', function() {
          analytics.track('Video Playback Resumed', props);
          analytics.called(nielsenDTVR.client.ggPM, 'loadMetadata', {
            type: 'content',
            channelName: 'segment',
            adModel: '1'
          });
          analytics.called(nielsenDTVR.client.ggPM, 'sendID3', props.ID3);
        });

        it('should send video playback seek started', function() {
          analytics.track('Video Playback Seek Started', props);
          analytics.called(nielsenDTVR.client.ggPM, 'sendID3', props.ID3);
          analytics.called(nielsenDTVR.client.ggPM, 'end', props.position);
        });

        it('should send video playback seek completed', function() {
          analytics.track('Video Playback Seek Completed', props);
          analytics.called(nielsenDTVR.client.ggPM, 'loadMetadata', {
            type: 'content',
            channelName: 'segment',
            adModel: '1'
          });
          analytics.called(nielsenDTVR.client.ggPM, 'sendID3', props.ID3);
        });

        it('should send video playback completed', function() {
          analytics.track('Video Playback Completed', props);
          analytics.called(nielsenDTVR.client.ggPM, 'end', props.position);
        });

        it('should send video playback completed livestream', function() {
          var timestamp = new Date();
          var currentUTC = +Date.now(timestamp);
          var newSandbox = sinon.sandbox.create();
          newSandbox.stub(Date, 'now').returns(currentUTC);

          props.livestream = true;

          analytics.track('Video Playback Completed', props, {
            timestamp: timestamp
          });
          analytics.called(nielsenDTVR.client.ggPM, 'end', currentUTC);
          newSandbox.restore();
        });
      });

      describe('#content events', function() {
        var props;
        beforeEach(function() {
          props = {
            asset_id: '123',
            ad_asset_id: null,
            channel: 'segment',
            load_type: 'dynamic',
            position: 1,
            ID3: '1',
            livestream: false
          };

          it('should send video content completed', function() {
            analytics.track('Video Content Completed', props);
            analytics.called(nielsenDTVR.client.ggPM, 'end', props.position);
          });

          it('should send video content started', function() {
            analytics.track('Video Content Started', props);
            analytics.called(nielsenDTVR.client.ggPM, 'loadMetadata', {
              type: 'content',
              channel: 'segment',
              adModel: '2'
            });
            analytics.called(nielsenDTVR.client.ggPM, 'sendID3', props.ID3);
          });
        });
      });

      describe('#ad events', function() {
        var props;
        beforeEach(function() {
          props = {
            ad_asset_id: '123',
            type: 'mid-roll',
            position: 1,
            load_type: 'dynamic',
            ID3: '1'
          };
        });

        it('should send video ad completed', function() {
          analytics.track('Video Ad Completed', props);
          analytics.called(nielsenDTVR.client.ggPM, 'end', props.position);
        });

        it('should send video ad started', function() {
          analytics.track('Video Ad Started', props);
          analytics.called(nielsenDTVR.client.ggPM, 'loadMetadata', {
            type: 'midroll',
            assetid: props.ad_asset_id
          });
          analytics.called(nielsenDTVR.client.ggPM, 'sendID3', props.ID3);
        });
      });

      describe('#persisted data', function() {
        var properties;
        beforeEach(function() {
          properties = {
            asset_id: '123',
            ad_asset_id: null,
            channel: 'segment',
            load_type: 'linear',
            position: 1,
            ID3: Math.floor(Math.random() * 100).toString(),
            livestream: false
          };
        });

        it('should persist the previous supported Segment event in memory', function() {
          var previousEvent = new Track({
            event: 'Video Content Started',
            properties: properties
          });
          analytics.track('Video Content Started', properties);
          assert.deepStrictEqual(
            nielsenDTVR.previousEvent.properties(),
            previousEvent.properties()
          );
        });

        it("should persist the previous supported event's ID3 tags in memory", function() {
          var previousEvent = new Track({
            event: 'Video Content Started',
            properties: properties
          });
          analytics.track('Video Content Started', properties);
          assert.deepStrictEqual(
            nielsenDTVR.ID3,
            previousEvent.properties().ID3
          );
        });
      });
    });
  });
});
