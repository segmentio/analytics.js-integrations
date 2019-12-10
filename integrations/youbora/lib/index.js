'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var reject = require('reject');
var extend = require('extend');

/**
 * Expose `Youbora` integration.
 */

var Youbora = module.exports = integration('Youbora')
  .option('accountCode', '')
  .tag('youbora-dashjs', '<script src="https://smartplugin.youbora.com/v6/js/adapters/dashjs/6.1.0/sp.min.js">')
  .tag('youbora-html5', '<script src="https://smartplugin.youbora.com/v6/js/adapters/html5/6.1.3/sp.min.js">')
  .tag('youbora-jwplayer', '<script src="https://smartplugin.youbora.com/v6/js/adapters/jwplayer7/6.1.2/sp.min.js">')
  .tag('youbora-theoplayer', '<script src="https://smartplugin.youbora.com/v6/js/adapters/theoplayer2/6.1.2/sp.min.js">')
  .tag('youbora-theplatform', '<script src="https://smartplugin.youbora.com/v6/js/adapters/theplatform/6.1.0/sp.min.js">')
  .tag('youbora-videojs', '<script src="https://smartplugin.youbora.com/v6/js/adapters/videojs5/6.1.7/sp.min.js">')
  .tag('youbora-main', '<script src="https://smartplugin.youbora.com/v6/js/lib/6.1.12/youboralib.min.js">');

Youbora.prototype.loaded = function() {
  return !!window.youbora;
};

/**
 * Initialize.
 *
 * @api public
 */

Youbora.prototype.initialize = function() {
  var self = this;
  this.load('youbora-main', function() {
    self.hookPlayers();
    self.pluginMap = {};
    self.ready();
  });
};

/**
 * Video Playback/Content Events
 * http://developer.nicepeopleatwork.com/wp-content/uploads/2017/01/Ingestion_API_Product-Doc_YOUBORA-2.pdf
 * @param {Facade} Track
 */

Youbora.prototype.videoPlaybackStarted = function(track) {
  var youbora = window.youbora;
  var sessionId = track.proxy('properties.session_id');
  var plugin = new youbora.Plugin({ accountCode: this.options.accountCode, username: this.analytics.user().id() });
  // for each video player instance maintain a mapping between a distinguishing 'session id' and an object containing the corresponding 
  // youbora plugin as well as that player's playback data
  this.pluginMap[sessionId] = {
    plugin: plugin,
    data: track.properties() || {}  // updated with event properties as they come in; youbora getter functions will read from this object
  };

  var adapter = new youbora.Adapter();
  var adsAdapter = new youbora.Adapter();

  // implement youbora getter functions, which retrieve playback data throughout video playback
  var data = this.pluginMap[sessionId].data;
  adapter.getBitrate = function() { return data.bitrate; };
  adapter.getPlayhead = function() { return data.position; };
  adapter.getFramesPerSecond = function() { return data.framerate; };
  adsAdapter.getPosition = function() {
    if (data.ad_type === 'pre' || data.ad_type === 'mid' || data.ad_type === 'post') {
      return data.ad_type;
    }
  };

  plugin.setAdapter(adapter);
  plugin.setAdsAdapter(adsAdapter);

  var options = reject({  // filter out undefined values
    'content.isLive': track.proxy('properties.livestream'),
    'content.resource': track.proxy('context.page.url')
  });

  plugin.setOptions(options);
  plugin.fireInit();
  adapter.monitorPlayhead();
};

Youbora.prototype.videoContentStarted = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;
  var adapter = plugin.getAdapter();

  var metadata = reject({
    content_id: track.proxy('properties.asset_id'),
    genre: track.proxy('properties.genre'),
    owner: track.proxy('properties.publisher')
  });

  var options = reject({
    'content.title': track.proxy('properties.title'),
    'content.title2': track.proxy('properties.program'),
    'content.duration': track.proxy('properties.total_length'),
    'content.metadata': metadata
  });

  plugin.setOptions(options);
  adapter.fireStart();
  adapter.fireJoin();  
};

Youbora.prototype.videoContentPlaying = function(track) {
  var sessionId = track.proxy('properties.session_id');
  var pluginObj = this.pluginMap[sessionId];
  if (!pluginObj) return;

  Object.assign(pluginObj.data, track.properties());
};

Youbora.prototype.videoPlaybackBufferStarted = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {
    plugin.getAdsAdapter().fireBufferBegin();
  } else {
    plugin.getAdapter().fireBufferBegin();
  }
};

Youbora.prototype.videoPlaybackBufferCompleted = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {
    plugin.getAdsAdapter().fireBufferEnd();
  } else {
    plugin.getAdapter().fireBufferEnd();    
  }
};

Youbora.prototype.videoPlaybackPaused = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {  
    plugin.getAdsAdapter().firePause();
  } else {
    plugin.getAdapter().firePause();
  }
};

Youbora.prototype.videoPlaybackResumed = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {  
    plugin.getAdsAdapter().fireResume();
  } else {
    plugin.getAdapter().fireResume();
  }
};

Youbora.prototype.videoPlaybackSeekStarted = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {  
    plugin.getAdsAdapter().fireSeekBegin();
  } else {
    plugin.getAdapter().fireSeekBegin();
  }
};

Youbora.prototype.videoPlaybackSeekCompleted = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {  
    plugin.getAdsAdapter().fireSeekEnd();
  } else {
    plugin.getAdapter().fireSeekEnd();
  }
};

Youbora.prototype.videoPlaybackCompleted = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  plugin.fireStop();
};

Youbora.prototype.videoPlaybackInterrupted = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  plugin.fireError();
};

// /**
//  * Video Ad Events
//  * http://developer.nicepeopleatwork.com/data-services/collection/data-collection-api-reference/?module=nqs7#/Smart_Ads
//  * @param {Facade} Track
//  */

Youbora.prototype.videoAdStarted = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  plugin.setOptions({
    'ad.title': track.proxy('properties.title')
  });
  plugin.getAdsAdapter().fireStart();
};

Youbora.prototype.videoAdCompleted = function(track) {
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  plugin.getAdsAdapter().fireStop();    
};

// use track only for video ad clicked events since it's not on our spec
Youbora.prototype.track = function(track) {
  if (track.event() !== 'Video Ad Clicked') return;
  var plugin = this.updatePlayerData(track);
  if (!plugin) return;

  plugin.getAdsAdapter().fireClick();
};

/**
 * Hook Players
 * If a customer is using a Youbora-supported video library then load the appropriate Youbora library and 
 * connect Youbora to the supported video players (passed in as options by the customer)
 */

Youbora.prototype.hookPlayers = function() {
  if (!this.options.players) return;  

  var self = this;
  var players = this.options.players;

  if (Array.isArray(players.dashjs)) {
    this.load('youbora-dashjs', function() {
      players.dashjs.forEach(function(playerObj) {
        self.hookPlayer(playerObj.options, new window.youbora.adapters.DashJS(playerObj.player));
      });
    });
  }
  if (Array.isArray(players.html5)) {
    this.load('youbora-html5', function() {
      players.html5.forEach(function(playerObj) {
        self.hookPlayer(playerObj.options, new window.youbora.adapters.Html5(playerObj.player));
      });
    });
  }
  if (Array.isArray(players.jwplayer)) {
    this.load('youbora-jwplayer', function() {
      players.jwplayer.forEach(function(playerObj) {
        self.hookPlayer(playerObj.options, new window.youbora.adapters.JWPlayer7(playerObj.player));
      });
    });
  }
  if (Array.isArray(players.theoplayer)) {
    this.load('youbora-theoplayer', function() {
      players.theoplayer.forEach(function(playerObj) {
        self.hookPlayer(playerObj.options, new window.youbora.adapters.TheoPlayer2(playerObj.player));
      });
    });
  }
  if (Array.isArray(players.theplatform)) {
    this.load('youbora-theplatform', function() {
      players.theplatform.forEach(function(playerObj) {
        self.hookPlayer(playerObj.options, new window.youbora.adapters.ThePlatform(playerObj.player));
      });
    });
  }
  if (Array.isArray(players.videojs)) {
    this.load('youbora-videojs', function() {
      players.videojs.forEach(function(playerObj) {
        self.hookPlayer(playerObj.options, new window.youbora.adapters.Videojs5(playerObj.player));
      });
    });
  }
};

/**
 * Hook Player
 * Connect Youbora to a video player
 */

Youbora.prototype.hookPlayer = function(playerOptions, adapter, adsAdapter) {
  var plugin = new window.youbora.Plugin({ accountCode: this.options.accountCode, username: this.analytics.user().id() });
  plugin.removeAdsAdapter();
  plugin.setOptions(playerOptions);
  plugin.setAdapter(adapter);
  if (adsAdapter) plugin.setAdsAdapter(adsAdapter);
};

/**
 * Hook Player
 * Retrieve the right plugin based off the given session Id and also update that plugin's playback data using the properties received
 */

Youbora.prototype.updatePlayerData = function(track) {
  var sessionId = track.proxy('properties.session_id');
  if (!sessionId) return;
  var pluginObj = this.pluginMap[sessionId];
  if (!pluginObj) return;

  extend(pluginObj.data, track.properties());  // update playback data

  return pluginObj.plugin;
};