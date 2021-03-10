var appboyUtil = {
  /**
   * @param {string} userId
   * @param {object} options - integration options.
   * @returns {boolean} true if and only if should call window.appboy.openSession
   */
  shouldOpenSession: function(userId, options) {
    return !!(userId || !options.onlyTrackKnownUsersOnWeb);
  },

  getCustomEndpoint: function(options) {
    var customEndpoint;
    // Setup custom endpoints
    if (options.customEndpoint) {
      var endpoint = options.customEndpoint;
      var regex = new RegExp('^(http|https)://', 'i');
      customEndpoint =
        (regex.test(endpoint) ? endpoint : 'https://' + endpoint) + '/api/v3';
    } else if (options.datacenter === 'eu') {
      customEndpoint = 'https://sdk.fra-01.braze.eu/api/v3';
    }
    return customEndpoint;
  },

  getMajorVersion: function(options) {
    return Math.floor(Number(options.version));
  },
  isMajorVersionTwo: function(options) {
    return appboyUtil.getMajorVersion(options) === 2;
  },
  isMajorVersionThree: function(options) {
    return appboyUtil.getMajorVersion(options) === 3;
  },
  getConfig: function(options) {
    var config = {};
    if (
      appboyUtil.isMajorVersionTwo(options) ||
      appboyUtil.isMajorVersionThree(options)
    ) {
      // https://js.appboycdn.com/web-sdk/3.1/doc/module-appboy.html#.initialize
      config = {
        safariWebsitePushId: options.safariWebsitePushId,
        enableHtmlInAppMessages: options.enableHtmlInAppMessages,
        allowCrawlerActivity: options.allowCrawlerActivity,
        doNotLoadFontAwesome: options.doNotLoadFontAwesome,
        enableLogging: options.enableLogging,
        localization: options.localization,
        minimumIntervalBetweenTriggerActionsInSeconds:
          Number(options.minimumIntervalBetweenTriggerActionsInSeconds) || 30,
        openInAppMessagesInNewTab: options.openInAppMessagesInNewTab,
        openNewsFeedCardsInNewTab: options.openNewsFeedCardsInNewTab,
        requireExplicitInAppMessageDismissal:
          options.requireExplicitInAppMessageDismissal,
        serviceWorkerLocation: options.serviceWorkerLocation,
        sessionTimeoutInSeconds: Number(options.sessionTimeoutInSeconds) || 30
      };
    } else {
      var datacenterMappings = {
        us: 'https://sdk.iad-01.braze.com',
        us02: 'https://sdk.iad-02.braze.com',
        us03: 'https://sdk.iad-03.braze.com',
        eu: 'https://sdk.fra-01.braze.eu'
      };
      if (options.safariWebsitePushId)
        config.safariWebsitePushId = options.safariWebsitePushId;
      if (options.enableHtmlInAppMessages)
        config.enableHtmlInAppMessages = true;

      // Setup custom endpoints
      if (options.customEndpoint) {
        var endpoint = options.customEndpoint;
        var regex = new RegExp('^(http|https)://', 'i');
        config.baseUrl =
          (regex.test(endpoint) ? endpoint : 'https://' + endpoint) + '/api/v3';
      } else {
        config.baseUrl =
          (datacenterMappings[options.datacenter] ||
            'https://sdk.iad-01.braze.com') + '/api/v3';
      }
    }
    var customEndpoint = appboyUtil.getCustomEndpoint(options);
    if (customEndpoint) config.baseUrl = customEndpoint;
    return config;
  }
};

module.exports = appboyUtil;
