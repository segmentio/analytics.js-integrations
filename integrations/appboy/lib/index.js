'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var Track = require('segmentio-facade').Track;
var each = require('@ndhoule/each');
var del = require('obj-case').del;
var clone = require('@ndhoule/clone');

/**
 * Expose `Appboy` integration.
 */

var Appboy = module.exports = integration('Appboy')
  .global('appboy')
  .option('apiKey', '')
  .option('safariWebsitePushId', '')
  .option('allowCrawlerActivity', false)
  .option('doNotLoadFontAwesome', false)
  .option('enableLogging', false)
  .option('automaticallyDisplayMessages', true)
  .option('localization', 'en')
  .option('minimumIntervalBetweenTriggerActionsInSeconds', 30)
  .option('openInAppMessagesInNewTab', false)
  .option('openNewsFeedCardsInNewTab', false)
  .option('sessionTimeoutInSeconds', 30)
  .option('requireExplicitInAppMessageDismissal', false)
  .option('enableHtmlInAppMessages', false)
  .option('trackAllPages', false)
  .option('trackNamedPages', false)
  .option('customEndpoint', '')
  .option('version', 1)
  .tag('v1', '<script src="https://js.appboycdn.com/web-sdk/1.6/appboy.min.js">')
  .tag('v2', '<script src="https://js.appboycdn.com/web-sdk/2.1/appboy.min.js">');


Appboy.prototype.initialize = function() {
  var options = this.options;
  var customEndpoint;
  // Setup custom endpoints
  if (options.customEndpoint) {
    var endpoint = options.customEndpoint;
    var regex = new RegExp('^(http|https)://', 'i');
    customEndpoint = (regex.test(endpoint) ? endpoint : 'https://' + endpoint) + '/api/v3';
  } else if (options.datacenter === 'eu') {
    customEndpoint = 'https://sdk.fra-01.braze.eu/api/v3';
  }
  
  if (Number(options.version) === 2) {
    this.initializeV2(customEndpoint);
  } else {
    this.initializeV1(customEndpoint);
  }
};
/**
 * Initialize v1.
 *
 * @api public
 */

Appboy.prototype.initializeV1 = function(customEndpoint) {
  var options = this.options;
  var self = this;
  var userId = this.analytics.user().id();

  // stub out function
  /* eslint-disable */
  +function(a,p,P,b,y) {
    window.appboy={};for(var s="destroy toggleAppboyLogging setLogger openSession changeUser requestImmediateDataFlush requestFeedRefresh subscribeToFeedUpdates logCardImpressions logCardClick logFeedDisplayed requestInAppMessageRefresh logInAppMessageImpression logInAppMessageClick logInAppMessageButtonClick subscribeToNewInAppMessages removeSubscription removeAllSubscriptions logCustomEvent logPurchase isPushSupported isPushBlocked isPushGranted isPushPermissionGranted registerAppboyPushMessages unregisterAppboyPushMessages submitFeedback ab ab.User ab.User.Genders ab.User.NotificationSubscriptionTypes ab.User.prototype.getUserId ab.User.prototype.setFirstName ab.User.prototype.setLastName ab.User.prototype.setEmail ab.User.prototype.setGender ab.User.prototype.setDateOfBirth ab.User.prototype.setCountry ab.User.prototype.setHomeCity ab.User.prototype.setEmailNotificationSubscriptionType ab.User.prototype.setPushNotificationSubscriptionType ab.User.prototype.setPhoneNumber ab.User.prototype.setAvatarImageUrl ab.User.prototype.setLastKnownLocation ab.User.prototype.setUserAttribute ab.User.prototype.setCustomUserAttribute ab.User.prototype.addToCustomAttributeArray ab.User.prototype.removeFromCustomAttributeArray ab.User.prototype.incrementCustomUserAttribute ab.InAppMessage ab.InAppMessage.SlideFrom ab.InAppMessage.ClickAction ab.InAppMessage.DismissType ab.InAppMessage.OpenTarget ab.InAppMessage.ImageStyle ab.InAppMessage.Orientation ab.InAppMessage.CropType ab.InAppMessage.prototype.subscribeToClickedEvent ab.InAppMessage.prototype.subscribeToDismissedEvent ab.InAppMessage.prototype.removeSubscription ab.InAppMessage.prototype.removeAllSubscriptions ab.InAppMessage.Button ab.InAppMessage.Button.prototype.subscribeToClickedEvent ab.InAppMessage.Button.prototype.removeSubscription ab.InAppMessage.Button.prototype.removeAllSubscriptions ab.SlideUpMessage ab.ModalMessage ab.FullScreenMessage ab.ControlMessage ab.Feed ab.Feed.prototype.getUnreadCardCount ab.Card ab.ClassicCard ab.CaptionedImage ab.Banner ab.WindowUtils display display.automaticallyShowNewInAppMessages display.showInAppMessage display.showFeed display.destroyFeed display.toggleFeed sharedLib".split(" "),i=0;i<s.length;i++){for(var k=appboy,l=s[i].split("."),j=0;j<l.length-1;j++)k=k[l[j]];k[l[j]]=function(){console&&console.error("The Appboy SDK has not yet been loaded.")}}appboy.initialize=function(){console&&console.error("Appboy cannot be loaded - this is usually due to strict corporate firewalls or ad blockers.")};appboy.getUser=function(){return new appboy.ab.User};appboy.getCachedFeed=function(){return new appboy.ab.Feed};
  }(document, 'script', 'link');
  /* eslint-enable */
  
  // this is used to test this.loaded
  this._shim = window.appboy.initialize;

  this.load('v1', function() {
    var config = {};
    var datacenterMappings = {
      us:   'https://sdk.iad-01.braze.com',
      us02: 'https://sdk.iad-02.braze.com',
      us03: 'https://sdk.iad-03.braze.com',
      eu:   'https://sdk.fra-01.braze.eu'
    };
    if (options.safariWebsitePushId) config.safariWebsitePushId = options.safariWebsitePushId;
    if (options.enableHtmlInAppMessages) config.enableHtmlInAppMessages = true;

    // Setup custom endpoints
    if (options.customEndpoint) {
      var endpoint = options.customEndpoint;
      var regex = new RegExp('^(http|https)://', 'i');
      config.baseUrl = (regex.test(endpoint) ? endpoint : 'https://' + endpoint) + '/api/v3';
    } else {
      config.baseUrl = (datacenterMappings[options.datacenter] || 'https://sdk.iad-01.braze.com') + '/api/v3';
    }

    if (customEndpoint) config.baseUrl = customEndpoint;

    self.initializeTester(options.apiKey, config);
    window.appboy.initialize(options.apiKey, config);

    if (options.automaticallyDisplayMessages) window.appboy.display.automaticallyShowNewInAppMessages();
    if (userId) window.appboy.changeUser(userId);

    window.appboy.openSession();
    self.ready();
  });
};
  
/**
 * Initialize v2.
 *
 * @api public
 */

Appboy.prototype.initializeV2 = function(customEndpoint) {
  var options = this.options;
  var userId = this.analytics.user().id();
  
  /* eslint-disable */
  +function (a, p, P, b, y) {
    window.appboy = {}; window.appboyQueue = [];
    for (var s = "initialize destroy getDeviceId toggleAppboyLogging setLogger openSession changeUser requestImmediateDataFlush requestFeedRefresh subscribeToFeedUpdates logCardImpressions logCardClick logFeedDisplayed requestInAppMessageRefresh logInAppMessageImpression logInAppMessageClick logInAppMessageButtonClick logInAppMessageHtmlClick subscribeToNewInAppMessages removeSubscription removeAllSubscriptions logCustomEvent logPurchase isPushSupported isPushBlocked isPushGranted isPushPermissionGranted registerAppboyPushMessages unregisterAppboyPushMessages submitFeedback trackLocation stopWebTracking resumeWebTracking wipeData ab ab.User ab.User.Genders ab.User.NotificationSubscriptionTypes ab.User.prototype.getUserId ab.User.prototype.setFirstName ab.User.prototype.setLastName ab.User.prototype.setEmail ab.User.prototype.setGender ab.User.prototype.setDateOfBirth ab.User.prototype.setCountry ab.User.prototype.setHomeCity ab.User.prototype.setLanguage ab.User.prototype.setEmailNotificationSubscriptionType ab.User.prototype.setPushNotificationSubscriptionType ab.User.prototype.setPhoneNumber ab.User.prototype.setAvatarImageUrl ab.User.prototype.setLastKnownLocation ab.User.prototype.setUserAttribute ab.User.prototype.setCustomUserAttribute ab.User.prototype.addToCustomAttributeArray ab.User.prototype.removeFromCustomAttributeArray ab.User.prototype.incrementCustomUserAttribute ab.User.prototype.addAlias ab.InAppMessage ab.InAppMessage.SlideFrom ab.InAppMessage.ClickAction ab.InAppMessage.DismissType ab.InAppMessage.OpenTarget ab.InAppMessage.ImageStyle ab.InAppMessage.TextAlignment ab.InAppMessage.Orientation ab.InAppMessage.CropType ab.InAppMessage.prototype.subscribeToClickedEvent ab.InAppMessage.prototype.subscribeToDismissedEvent ab.InAppMessage.prototype.removeSubscription ab.InAppMessage.prototype.removeAllSubscriptions ab.InAppMessage.Button ab.InAppMessage.Button.prototype.subscribeToClickedEvent ab.InAppMessage.Button.prototype.removeSubscription ab.InAppMessage.Button.prototype.removeAllSubscriptions ab.SlideUpMessage ab.ModalMessage ab.FullScreenMessage ab.HtmlMessage ab.ControlMessage ab.Feed ab.Feed.prototype.getUnreadCardCount ab.Card ab.ClassicCard ab.CaptionedImage ab.Banner ab.WindowUtils display display.automaticallyShowNewInAppMessages display.showInAppMessage display.showFeed display.destroyFeed display.toggleFeed sharedLib".split(" "), i = 0; i < s.length; i++){
      for (var m = s[i], k = appboy, l = m.split("."), j = 0; j < l.length - 1; j++)k = k[l[j]]; k[l[j]] = (new Function("return function " + m.replace(/\./g, "_") + "(){appboyQueue.push(arguments); return true}"))()
    }
    appboy.getUser = function () { return new appboy.ab.User };
    appboy.getCachedFeed = function () { return new appboy.ab.Feed };
  }(window, document, 'script');
  /* eslint-enable */

  // https://js.appboycdn.com/web-sdk/2.0/doc/module-appboy.html#.initialize
  var config = {
    safariWebsitePushId: options.safariWebsitePushId,
    enableHtmlInAppMessages: options.enableHtmlInAppMessages,
    allowCrawlerActivity: options.allowCrawlerActivity,
    doNotLoadFontAwesome: options.doNotLoadFontAwesome,
    enableLogging: options.enableLogging,
    localization: options.localization,
    minimumIntervalBetweenTriggerActionsInSeconds: Number(options.minimumIntervalBetweenTriggerActionsInSeconds) || 30,
    openInAppMessagesInNewTab: options.openInAppMessagesInNewTab,
    openNewsFeedCardsInNewTab: options.openNewsFeedCardsInNewTab,
    requireExplicitInAppMessageDismissal: options.requireExplicitInAppMessageDismissal,
    sessionTimeoutInSeconds: Number(options.sessionTimeoutInSeconds) || 30
  };

  if (customEndpoint) config.baseUrl = customEndpoint;
  
  this.initializeTester(options.apiKey, config);
  window.appboy.initialize(options.apiKey, config);
  
  if (options.automaticallyDisplayMessages) window.appboy.display.automaticallyShowNewInAppMessages();
  if (userId) window.appboy.changeUser(userId);
  
  window.appboy.openSession();

  this.load('v2', this.ready);
};

// This is used to test window.appboy.initialize
Appboy.prototype.initializeTester = function() {};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Appboy.prototype.loaded = function() {
  var options = this.options;
  if (Number(options.version) === 2) return window.appboyQueue === null;
  return window.appboy && window.appboy.initialize !== this._shim;
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Appboy.prototype.identify = function(identify) {
  var userId = identify.userId();
  var address = identify.address();
  var avatar = identify.avatar();
  var birthday = identify.birthday();
  var email = identify.email();
  var firstName = identify.firstName();
  var gender = identify.gender();
  var lastName = identify.lastName();
  var phone = identify.phone();
  var traits = clone(identify.traits());

  window.appboy.changeUser(userId);
  window.appboy.getUser().setAvatarImageUrl(avatar);
  window.appboy.getUser().setEmail(email);
  window.appboy.getUser().setFirstName(firstName);
  window.appboy.getUser().setGender(getGender(gender));
  window.appboy.getUser().setLastName(lastName);
  window.appboy.getUser().setPhoneNumber(phone);
  if (address) {
    window.appboy.getUser().setCountry(address.country);
    window.appboy.getUser().setHomeCity(address.city);
  }
  if (birthday) {
    window.appboy.getUser().setDateOfBirth(birthday.getUTCFullYear(), birthday.getUTCMonth() + 1, birthday.getUTCDate());
  }

  // delete all the standard traits from traits clone so that we can use appboy's setCustomAttribute on non-standard traits
  // also remove all reserved keys so we dont set them as custom attributes, otherwise Appboy rejects the entire event
  // https://www.appboy.com/documentation/Platform_Wide/#reserved-keys
  var reserved = ['avatar', 'address', 'birthday', 'email', 'id', 'firstName', 'gender', 'lastName', 'phone', 'facebook', 'twitter', 'first_name', 'last_name', 'dob', 'external_id', 'country', 'home_city', 'bio', 'gender', 'phone', 'email_subscribe', 'push_subscribe'];
  each(function(key) {
    delete traits[key];
  }, reserved);

  each(function(value, key) {
    window.appboy.getUser().setCustomUserAttribute(key, value);
  }, traits);
};

/**
 * Group.
 *
 * Sets the group Id for users.
 *
 * @api public
 * @param {Group} group
 */

Appboy.prototype.group = function(group) {
  var userId = group.userId();
  var groupIdKey = 'ab_segment_group_' + group.groupId();

  window.appboy.changeUser(userId);
  window.appboy.getUser().setCustomUserAttribute(groupIdKey, true);
};

/**
 * Track.
 *
 * https://js.appboycdn.com/web-sdk/latest/doc/module-appboy.html#.logCustomEvent
 *
 * @api public
 * @param {Track} track
 */

Appboy.prototype.track = function(track) {
  var userId = track.userId();
  var eventName = track.event();
  var properties = track.properties();
  // remove reserved keys from custom event properties
  // https://www.appboy.com/documentation/Platform_Wide/#reserved-keys
  var reserved = ['time', 'product_id', 'quantity', 'event_name', 'price', 'currency'];
  each(function(key) {
    delete properties[key];
  }, reserved);

  window.appboy.changeUser(userId);
  window.appboy.logCustomEvent(eventName, properties);
};

/**
 * Page.
 *
 * https://js.appboycdn.com/web-sdk/latest/doc/module-appboy.html#.logCustomEvent
 *
 * @api public
 * @param {Page} page
 */

Appboy.prototype.page = function(page) {
  var settings = this.options;
  if (!settings.trackAllPages && !settings.trackNamedPages) return;
  if (settings.trackNamedPages && !page.name()) return;

  var userId = page.userId();
  var pageEvent = page.track(page.fullName());
  var eventName = pageEvent.event();
  var properties = page.properties();

  window.appboy.changeUser(userId);
  window.appboy.logCustomEvent(eventName, properties);
};

/**
 * Order Completed.
 *
 * Breaking this out because it requires certain properties that all other events don't.
 *
 * https://js.appboycdn.com/web-sdk/latest/doc/module-appboy.html#.logPurchase
 *
 * @api public
 * @param {Track} track
 */


Appboy.prototype.orderCompleted = function(track) {
  var userId = track.userId();
  var products = track.products();
  var currencyCode = track.currency();
  var purchaseProperties = track.properties();

  window.appboy.changeUser(userId);

  // remove reduntant properties
  del(purchaseProperties, 'products');
  del(purchaseProperties, 'currency');

  // we have to make a separate call to appboy for each product
  each(function(product) {
    var track = new Track({ properties: product });
    var productId = track.productId();
    var price = track.price();
    var quantity = track.quantity();
    window.appboy.logPurchase(productId, price, currencyCode, quantity, purchaseProperties);
  }, products);
};

/**
 * Get Gender.
 *
 * Returns Gender in the way that Appboy understands it.
 *
 * https://js.appboycdn.com/web-sdk/latest/doc/ab.User.html#toc4
 *
 * @api public
 * @param {string} gender
 * @return {string}
 */

function getGender(gender) {
  if (!gender) return;
  if (typeof gender !== 'string') return;

  var femaleGenders = ['woman', 'female', 'w', 'f'];
  var maleGenders = ['man', 'male', 'm'];
  var otherGenders = ['other', 'o'];

  if (femaleGenders.indexOf(gender.toLowerCase()) > -1) return window.appboy.ab.User.Genders.FEMALE;
  if (maleGenders.indexOf(gender.toLowerCase()) > -1) return window.appboy.ab.User.Genders.MALE;
  if (otherGenders.indexOf(gender.toLowerCase()) > -1) return window.appboy.ab.User.Genders.OTHER;
}
