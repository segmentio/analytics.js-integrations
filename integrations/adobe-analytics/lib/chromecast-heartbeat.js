
var chromecastHeartbeat = {

  /**
  * Returns a mediaMetadata Object 
  * @param {Track} track
  * @returns {mediaMetadata} Maps the contextValue prop if it exists in the track.properties
  */
  extractMediaMetadata: function (track) {
       var mediaMetadata = {};
       var props = track.properties();
       debugger;
    if (window.settingsContextValues) {
      for (var customProp in window.settingsContextValues) {
        if (props[customProp]) {
          mediaMetadata[window.settingsContextValues[customProp]] = props[customProp];
        }
      }
    }
    return mediaMetadata;
  },
  
  chromecastInit: function (track) {    
    var props = track.properties();
    var mediaMetadata = window.extractMediaMetadata(track);   
    window.ADBMobile.config.setDebugLogging(true);
    var qosInfoSettings = {
      bitrate: props.bitrate || 1,
      startupTime: props.startupTime || 1,
      fps: props.framerate || 24,
      droppedFrames: props.droppedFrames || 1,
    };
    var qosInfo = window.ADBMobile.media.createQoSObject(qosInfoSettings.bitrate, qosInfoSettings.droppedFrames, qosInfoSettings.fps, qosInfoSettings.startupTime);
    window.getQoSObject = getQoSObject;
    window.qosInfo = qosInfo;
    var delegate = {
      getQoSObject:   window.getCurrentPlaybackTime,
      getCurrentPlaybackTime: window.getCurrentPlaybackTime
    }
    window.ADBMobile.media.setDelegate(delegate);
    var streamType = 'VOD'
    if (props.livestream) {
      streamType = 'LIVE';
    }
    props.video_media_type = props.video_media_type || 'video';
    props.name = props.title || 'no title';
    props.asset_id = props.asset_id || 'unknown video id';
    props.length = props.total_length || 0;
    
    var mediaInfo = ADBMobile.media.createMediaObject(props.name, props.asset_id, props.length, streamType, props.video_media_type);
    var videoAnalytics, metaKeys, standardMediaMetadata;

    videoAnalytics = window.ADBMobile.media;
    metaKeys = window.ADBMobile.media.VideoMetadataKeys;
    standardMediaMetadata = window.ADBMobile.media.MediaObjectKey.StandardMediaMetadata;

    var props = track.properties();
    var stdVidMeta = {};
    var segAdbMap = {
      program: metaKeys.SHOW,
      season: metaKeys.SEASON,
      episode: metaKeys.EPISODE,
      assetId: metaKeys.ASSET_ID,
      contentAssetId: metaKeys.ASSET_ID,
      genre: metaKeys.GENRE,
      airdate: metaKeys.FIRST_AIR_DATE,
      publisher: metaKeys.ORIGINATOR,
      channel: metaKeys.NETWORK,
      rating: metaKeys.RATING
    };
    // eslint-disable-next-line
    for (var prop in segAdbMap) {
      stdVidMeta[segAdbMap[prop]] = props[prop] || 'no ' + segAdbMap[prop];
    }
    mediaInfo[standardMediaMetadata] = stdVidMeta;

    window.ADBMobile.media.trackSessionStart(mediaInfo, mediaMetadata);
  },

  chromecastContentStart: function (track) {
    var props = track.properties();
    var mediaMetadata = window.extractMediaMetadata(track);   
    props.startTime = props.startTime || 1;
    props.name = props.chapter_name || 'no chapter name';
    props.position = props.position|| 1;
    props.length = props.total_length || 1;
    var chapterInfo = window.ADBMobile.media.createChapterObject(props.name, props.position, props.length, props.startTime);

    window.ADBMobile.media.trackEvent(ADBMobile.media.Event.ChapterStart, chapterInfo, mediaMetadata);
    window.ADBMobile.media.trackPlay();
  },

  chromecastPlaybackExited: function (track) {
    window.ADBMobile.media.trackPause();
    window.ADBMobile.media.trackSessionEnd();
  },

  chromecastVideoPaused: function (track) {
    window.ADBMobile.media.trackPause();
  },

  chromecastVideoStart: function (track) {
    window.ADBMobile.media.trackPlay();
  },

  chromecastVideoComplete: function (track) { 
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.ChapterComplete);  
  },

  chromecastSessionEnd: function (track) {
    window.ADBMobile.media.trackComplete();
    window.ADBMobile.media.trackSessionEnd();
  },

  chromecastAdStarted: function (track) {
    var props = track.properties();

    var info = {
      name: props.title || 'no title',
      id: props.asset_id.toString() || 'default ad',
      position: props.position || 1,
      length: props.total_length || 0,
      startTime: props.start_time || 1
    }
    var adInfo = window.ADBMobile.media.createAdObject(info.name, info.id, info.position, info.length);
    var adBreakInfo = ADBMobile.media.createAdBreakObject(info.name, info.position, info.startTime);
    var standardAdMetadata = {};
    standardAdMetadata[ADBMobile.media.AdMetadataKeys.ADVERTISER] = props.publisher || props.video_ad_advertiser || "no advertiser";
    standardAdMetadata[ADBMobile.media.AdMetadataKeys.CAMPAIGN_ID] = props.video_ad_campaign_id || "no campaign id";

    if (adInfo) {
      adInfo[ADBMobile.media.MediaObjectKey.StandardAdMetadata] = standardAdMetadata;
    }

    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.AdBreakStart, adBreakInfo);
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.AdStart, adInfo);
  },

  chromecastAdCompleted: function (track) {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.AdComplete);
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.AdBreakComplete,);
  },

  chromecastAdSkipped: function (track) {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.AdSkip);
  },
  
  chromecastSeekStarted: function (track) {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.SeekStart);
  },

  chromecastSeekCompleted: function (track) {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.SeekComplete);
  },

  chromecastBufferStarted: function (track) {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.BufferStart);
  },

  chromecastBufferCompleted: function (track) {
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.BufferComplete);
  },
  
  chromecastQualityUpdated: function (track) {
    var props = track.properties();
    var qosInfo = {
      bitrate: props.bitrate,
      startupTime: props.startupTime,
      fps: props.framerate,
      droppedFrames: props.droppedFrames,
    };

    window.qosInfo = qosInfo;
    window.ADBMobile.media.createQoSObject(qosInfo.bitrate, qosInfo.droppedFrames, qosInfo.fps, qosInfo.startupTime);
    window.ADBMobile.media.trackEvent(window.ADBMobile.media.Event.BitrateChange);
  },

  chromecastUpdatePlayhead: function (track) {
    var props = track.properties();
    window.playhead = props.position;
    window.ADBMobile.media.trackPlay();
  },
};

module.exports = chromecastHeartbeat;
