
const analytics = require('@segment/analytics.js-core');
var heartbeats = { 

   chromecastInit: function(track) {
    function getCurrentPlaybackTime()  {
      return window.playhead;
    }    
    function getQoSObject() {
      return window.qosInfo;
    }
     var props = track.properties();
     var mediaMetadata = {
       isUserLoggedIn: analytics.user().id() != null,
       tvStation: props.video_station_id,
       programmer: props.program
     };
     window.ADBMobile.config.setDebugLogging(true);
     var qosInfoSettings = {
       bitrate: props.bitrate | 1,
       startupTime: props.startupTime | 1,
       fps: props.framerate | 24,
       droppedFrames: props.droppedFrames | 1,
     };
     var qosInfo = window.ADBMobile.media.createQoSObject(qosInfoSettings.bitrate, qosInfoSettings.droppedFrames, qosInfoSettings.fps, qosInfoSettings.startupTime);
     window.qosInfo = qosInfo;
     var delegate = {
       getQoSObject: getQoSObject(),
       getCurrentPlaybackTime: getCurrentPlaybackTime()
     }   
    window.ADBMobile.media.setDelegate(delegate);
     var streamType = 'VOD'
     if (props.livestream) {
       streamType = 'LIVE';
     }
     var mediaInfo = ADBMobile.media.createMediaObject(props.name, props.asset_id, props.video_content_length, streamType, props.video_media_type);
   
     var standardVideoMetadata = {};
   
     var showKey = 'a.media.show';
     var seasonKey = 'a.media.season';
     var mediaMetadataKey = 'media.standardmetadata';    
     if (window.ADBMobile.media.VideoMetadataKeys && window.ADBMobile.media.VideoMetadataKeys.SEASON) {
       seasonKey = window.ADBMobile.media.VideoMetadataKeys.SEASON
     }
     if (window.ADBMobile.media.VideoMetadataKeys && window.ADBMobile.media.VideoMetadataKeys.SHOW) {
       showKey = window.ADBMobile.media.VideoMetadataKeys.SHOW
     }
     if (window.ADBMobile.media.MediaObjectKey && window.ADBMobile.media.MediaObjectKey.StandardMediaMetadata) {
       showKey = window.ADBMobile.media.MediaObjectKey.StandardMediaMetadata
     }
     standardVideoMetadata[showKey] = props.name;
     standardVideoMetadata[seasonKey] = props.season;
     if (!mediaInfo) {
       mediaInfo = {
       }
     } 
     mediaInfo[mediaMetadataKey] = standardVideoMetadata;
     window.ADBMobile.media.trackSessionStart(mediaInfo, mediaMetadata);   
   },

   chromecastHeartbeatVideoStart: function(track) {

    window.ADBMobile.media.trackEvent(ADBMobile.media.Event.ChapterStart);
    window.ADBMobile.media.trackPlay();
  
  },
  
   chromecastPlaybackExited:function(track) {
    window.ADBMobile.media.trackPause();
    window.ADBMobile.media.trackSessionEnd();
  },
   chromecastVideoPaused: function(track) {
    window.ADBMobile.media.trackPause();
  
  },
   chromecastVideoStart: function(track)  {
    window.ADBMobile.media.trackPlay();
  },
   chromecastVideoComplete: function(track)  {
  
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.ChapterComplete);
    window.ADBMobile.media.trackComplete();
  },
   chromecastSessionEnd: function(track)  {
    window.ADBMobile.media.trackSessionEnd();
  
  },
   chromecastAdStarted: function(track)  {
    var props = track.properties();
  
    var info = {
      name: props.title || 'no title',
      id: props.asset_id.toString() || 'default ad',
      position: props.position || 1,
      length: props.total_length || 0
    }
    var adInfo = window.ADBMobile.media.createAdObject(info.name, info.id, info.position, info.length);
  
    var standardAdMetadata = {};
    standardAdMetadata[ADBMobile.media.AdMetadataKeys.ADVERTISER] = props.video_ad_advertiser || null;
    standardAdMetadata[ADBMobile.media.AdMetadataKeys.CAMPAIGN_ID] = props.video_ad_campaign_id || null;
  
    if (adInfo) {
      adInfo[ADBMobile.media.MediaObjectKey.StandardAdMetadata] = standardAdMetadata;
    }
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.AdBreakStart);
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.AdStart, adInfo);
  
  },
   chromecastAdCompleted: function(track)  {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.AdComplete);
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.AdBreakComplete);
  
  },
   chromecastAdSkipped: function(track) {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.AdSkip);
  },
   chromecastSeekStarted: function(track)  {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.SeekStart);
  },
   chromecastSeekCompleted: function(track)  {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.SeekComplete);
  },
   chromecastBufferStarted: function(track)  {
    var eventName = window.ADBMobile.media.Event.BufferStart;
    window.ADBMobile.media.trackEvent(eventName);
  },
   chromecastQualityUpdated: function(track)  {
  
    var props = track.properties();
    let qosInfo = {
      bitrate: props.bitrate,
      startupTime: props.startupTime,
      fps: props.framerate,
      droppedFrames: props.droppedFrames,
    };
  
    window.qosInfo = qosInfo;
    window.ADBMobile.media.createQoSObject(qosInfo.bitrate, qosInfo.droppedFrames, qosInfo.fps, qosInfo.startupTime);
  
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.BitrateChange);
  },
  
   chromecastBufferCompleted: function(track)  {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.BufferComplete);
  
  },
   chromecastUpdatePlayhead: function(track)  {
    var props = track.properties();
    window.playhead = props.position;
    window.ADBMobile.media.trackPlay();
  },
  
  

};

module.exports = heartbeats;
