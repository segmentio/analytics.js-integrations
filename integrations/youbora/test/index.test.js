'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var Youbora = require('../lib/');

describe('Youbora', function() {
  var analytics;
  var youbora;
  var options = {};

  beforeEach(function() {
    analytics = new Analytics();
    youbora = new Youbora(options);
    analytics.use(integrationTester);
    analytics.use(Youbora);
    analytics.add(youbora);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    youbora.reset();
    sandbox();
  });

  it('should have the correct options', function() {
    analytics.compare(Youbora, integration('Youbora')
    .option('accountCode', ''));
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#track', function() {
      describe('#content events', function() {
        beforeEach(function() {
          analytics.track('Video Playback Started', { session_id: 1 });
          analytics.spy(youbora.pluginMap[1].plugin, 'setOptions');
          analytics.spy(youbora.pluginMap[1].plugin.getAdapter(), 'fireJoin');
        });

        it('should send a join and start on content started and also update plugins data object', function() {
          analytics.track('Video Content Started',  { session_id: 1 , title: 'Test Title', bitrate: 32 });
          var pluginObj = youbora.pluginMap[1];
          var plugin = pluginObj.plugin;
          var adapter = plugin.getAdapter();
          var args = plugin.setOptions.args[0][0];

          analytics.deepEqual({ session_id: 1, title: 'Test Title', bitrate: 32 }, pluginObj.data);
          analytics.deepEqual({ 'content.title': 'Test Title', 'content.metadata': {} }, args);
          analytics.called(adapter.fireJoin);
        });
      });

      describe('#playback events', function() {
        beforeEach(function() {
          analytics.track('Video Playback Started', { session_id: 1 });
          analytics.spy(youbora.pluginMap[1].plugin.getAdapter(), 'fireBufferBegin');
          analytics.spy(youbora.pluginMap[1].plugin.getAdapter(), 'fireBufferEnd');
          analytics.spy(youbora.pluginMap[1].plugin.getAdapter(), 'firePause');
          analytics.spy(youbora.pluginMap[1].plugin.getAdapter(), 'fireResume');
          analytics.spy(youbora.pluginMap[1].plugin.getAdapter(), 'fireSeekBegin');
          analytics.spy(youbora.pluginMap[1].plugin.getAdapter(), 'fireSeekEnd');
          analytics.spy(youbora.pluginMap[1].plugin, 'fireError');
          analytics.spy(youbora.pluginMap[1].plugin, 'fireStop');
          analytics.spy(youbora.pluginMap[1].plugin.getAdsAdapter(), 'fireBufferBegin');
          analytics.spy(youbora.pluginMap[1].plugin.getAdsAdapter(), 'fireBufferEnd');
          analytics.spy(youbora.pluginMap[1].plugin.getAdsAdapter(), 'firePause');
          analytics.spy(youbora.pluginMap[1].plugin.getAdsAdapter(), 'fireResume');
          analytics.spy(youbora.pluginMap[1].plugin.getAdsAdapter(), 'fireSeekBegin');
          analytics.spy(youbora.pluginMap[1].plugin.getAdsAdapter(), 'fireSeekEnd');
        });

        it('should call the correct youbora methods for buffering events', function() {
          analytics.track('Video Playback Buffer Started', { session_id: 1 });
          analytics.track('Video Playback Buffer Completed', { session_id: 1 });

          var plugin = youbora.pluginMap[1].plugin;
          var adapter = plugin.getAdapter();

          analytics.called(adapter.fireBufferBegin);
          analytics.called(adapter.fireBufferEnd);
        });

        it('should send a pause for playback pause event', function() {
          analytics.track('Video Playback Paused', { session_id: 1 });

          var plugin = youbora.pluginMap[1].plugin;
          var adapter = plugin.getAdapter();

          analytics.called(adapter.firePause);
        });

        it('should send a resume for playback resume event', function() {
          analytics.track('Video Playback Resumed', { session_id: 1 });

          var plugin = youbora.pluginMap[1].plugin;
          var adapter = plugin.getAdapter();

          analytics.called(adapter.fireResume);
        });

        it('should call the correct youbora methods for seek events', function() {
          analytics.track('Video Playback Seek Started', { session_id: 1 });
          analytics.track('Video Playback Seek Completed', { session_id: 1 });

          var plugin = youbora.pluginMap[1].plugin;
          var adapter = plugin.getAdapter();

          analytics.called(adapter.fireSeekBegin);
          analytics.called(adapter.fireSeekEnd);
        });

        it('should call the correct youbora methods for error events', function() {
          analytics.track('Video Playback Interrupted', { session_id: 1 });

          var plugin = youbora.pluginMap[1].plugin;
          analytics.called(plugin.fireError);
        });

        it('should send a sendstop when video playback completed', function() {
          analytics.track('Video Playback Completed', { session_id: 1 });

          var plugin = youbora.pluginMap[1].plugin;
          analytics.called(plugin.fireStop);
        });

        describe('#ad playback events', function() {
          it('should send ad buffer events correctly', function() {
            analytics.track('Video Playback Buffer Started', { session_id: 1, ad_asset_id: 1 });
            analytics.track('Video Playback Buffer Completed', { session_id: 1, ad_asset_id: 1 });
  
            var plugin = youbora.pluginMap[1].plugin;
            var adapter = plugin.getAdsAdapter();
  
            analytics.called(adapter.fireBufferBegin);
            analytics.called(adapter.fireBufferEnd);
          });

          it('should send a pause for playback pause event', function() {
            analytics.track('Video Playback Paused', { session_id: 1, ad_asset_id: 1 });
  
            var plugin = youbora.pluginMap[1].plugin;
            var adapter = plugin.getAdsAdapter();
  
            analytics.called(adapter.firePause);
          });
  
          it('should send a resume for playback resume event', function() {
            analytics.track('Video Playback Resumed', { session_id: 1, ad_asset_id: 1 });
  
            var plugin = youbora.pluginMap[1].plugin;
            var adapter = plugin.getAdsAdapter();
  
            analytics.called(adapter.fireResume);
          });
  
          it('should call the correct youbora methods for seek events', function() {
            analytics.track('Video Playback Seek Started', { session_id: 1, ad_asset_id: 1 });
            analytics.track('Video Playback Seek Completed', { session_id: 1, ad_asset_id: 1 });
  
            var plugin = youbora.pluginMap[1].plugin;
            var adapter = plugin.getAdsAdapter();
  
            analytics.called(adapter.fireSeekBegin);
            analytics.called(adapter.fireSeekEnd);
          });
        });
      });

      describe('ad events', function() {
        beforeEach(function() {
          analytics.track('Video Playback Started', { session_id: 1 });
          analytics.spy(youbora.pluginMap[1].plugin.getAdsAdapter(), 'fireStart');
          analytics.spy(youbora.pluginMap[1].plugin.getAdsAdapter(), 'fireStop');
          analytics.spy(youbora.pluginMap[1].plugin.getAdsAdapter(), 'fireClick');
          analytics.spy(youbora.pluginMap[1].plugin, 'setOptions');
        });

        it('should send ad start correctly', function() {
          analytics.track('Video Ad Started', { session_id: 1, title: 'Test Ad Title', ad_asset_id: 1 });

          var plugin = youbora.pluginMap[1].plugin;
          var adsAdapter = plugin.getAdsAdapter();
          var args = plugin.setOptions.args[0][0];

          analytics.deepEqual({ 'ad.title': 'Test Ad Title' }, args);
          analytics.called(adsAdapter.fireStart);
        });

        it('should send video ad completed correctly', function() {
          analytics.track('Video Ad Completed', { session_id: 1, ad_asset_id: 1 });

          var plugin = youbora.pluginMap[1].plugin;
          var adsAdapter = plugin.getAdsAdapter();

          analytics.called(adsAdapter.fireStop);
        });

        it('should send video ad clicked correctly', function() {
          analytics.track('Video Ad Clicked', { session_id: 1, ad_asset_id: 1 });

          var plugin = youbora.pluginMap[1].plugin;
          var adsAdapter = plugin.getAdsAdapter();

          analytics.called(adsAdapter.fireClick);
        });
      });
    });
  });
});
