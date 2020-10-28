'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var Track = require('segmentio-facade').Track;
var each = require('@ndhoule/each');
var del = require('obj-case').del;
var clone = require('@ndhoule/clone');
var appboyUtil = require('./appboyUtil');

/**
 * Expose `Appboy` integration.
 */

var Appboy = (module.exports = integration('Appboy')
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
  .option('logPurchaseWhenRevenuePresent', false)
  .option('onlyTrackKnownUsersOnWeb', false)
  .tag(
    'v1',
    '<script src="https://js.appboycdn.com/web-sdk/1.6/appboy.min.js">'
  )
  .tag(
    'v2',
    '<script src="https://js.appboycdn.com/web-sdk/2.4/appboy.min.js">'
  )
  .tag(
    'v2.7',
    '<script src="https://js.appboycdn.com/web-sdk/2.7/appboy.min.js">'
  ));

Appboy.prototype.appboyInitialize = function(userId, options, config) {
  window.appboy.initialize(options.apiKey, config);

  if (options.automaticallyDisplayMessages)
    window.appboy.display.automaticallyShowNewInAppMessages();
  if (userId) window.appboy.changeUser(userId);

  window.appboy.openSession();
};

Appboy.prototype.initialize = function() {
  if (appboyUtil.isMajorVersionTwo(this.options)) {
    this.initializeV2();
  } else {
    this.initializeV1();
  }
};

Appboy.prototype.initializeV1 = function() {
  var options = this.options;
  var self = this;
  var userId = this.analytics.user().id();

  // stub out function
  /* eslint-disable */
  +(function(a, p, P, b, y) {
    window.appboy = {};
    for (
      var s = 'destroy toggleAppboyLogging setLogger openSession changeUser requestImmediateDataFlush requestFeedRefresh subscribeToFeedUpdates logCardImpressions logCardClick logFeedDisplayed requestInAppMessageRefresh logInAppMessageImpression logInAppMessageClick logInAppMessageButtonClick subscribeToNewInAppMessages removeSubscription removeAllSubscriptions logCustomEvent logPurchase isPushSupported isPushBlocked isPushGranted isPushPermissionGranted registerAppboyPushMessages unregisterAppboyPushMessages submitFeedback ab ab.User ab.User.Genders ab.User.NotificationSubscriptionTypes ab.User.prototype.getUserId ab.User.prototype.setFirstName ab.User.prototype.setLastName ab.User.prototype.setEmail ab.User.prototype.setGender ab.User.prototype.setDateOfBirth ab.User.prototype.setCountry ab.User.prototype.setHomeCity ab.User.prototype.setEmailNotificationSubscriptionType ab.User.prototype.setPushNotificationSubscriptionType ab.User.prototype.setPhoneNumber ab.User.prototype.setAvatarImageUrl ab.User.prototype.setLastKnownLocation ab.User.prototype.setUserAttribute ab.User.prototype.setCustomUserAttribute ab.User.prototype.addToCustomAttributeArray ab.User.prototype.removeFromCustomAttributeArray ab.User.prototype.incrementCustomUserAttribute ab.InAppMessage ab.InAppMessage.SlideFrom ab.InAppMessage.ClickAction ab.InAppMessage.DismissType ab.InAppMessage.OpenTarget ab.InAppMessage.ImageStyle ab.InAppMessage.Orientation ab.InAppMessage.CropType ab.InAppMessage.prototype.subscribeToClickedEvent ab.InAppMessage.prototype.subscribeToDismissedEvent ab.InAppMessage.prototype.removeSubscription ab.InAppMessage.prototype.removeAllSubscriptions ab.InAppMessage.Button ab.InAppMessage.Button.prototype.subscribeToClickedEvent ab.InAppMessage.Button.prototype.removeSubscription ab.InAppMessage.Button.prototype.removeAllSubscriptions ab.SlideUpMessage ab.ModalMessage ab.FullScreenMessage ab.ControlMessage ab.Feed ab.Feed.prototype.getUnreadCardCount ab.Card ab.ClassicCard ab.CaptionedImage ab.Banner ab.WindowUtils display display.automaticallyShowNewInAppMessages display.showInAppMessage display.showFeed display.destroyFeed display.toggleFeed sharedLib'.split(
        ' '
        ),
        i = 0;
      i < s.length;
      i++
    ) {
      for (var k = appboy, l = s[i].split('.'), j = 0; j < l.length - 1; j++)
        k = k[l[j]];
      k[l[j]] = function() {
        console && console.error('The Appboy SDK has not yet been loaded.');
      };
    }
    appboy.initialize = function() {
      console &&
      console.error(
        'Appboy cannot be loaded - this is usually due to strict corporate firewalls or ad blockers.'
      );
    };
    appboy.getUser = function() {
      return new appboy.ab.User();
    };
    appboy.getCachedFeed = function() {
      return new appboy.ab.Feed();
    };
  })(document, 'script', 'link');
  /* eslint-enable */

  // this is used to test this.loaded
  this._shim = window.appboy.initialize;

  this.load('v1', function() {
    if (appboyUtil.shouldOpenSession(userId, options)) {
      self.hasBeenInitialized = true;
      var config = appboyUtil.getConfig(options);
      self.initializeTester(options.apiKey, config);
      self.appboyInitialize(userId, options, config);
    }

    self.ready();
  });
};

Appboy.prototype.initializeV2 = function() {
  var options = this.options;
  var userId = this.analytics.user().id();

  /* eslint-disable */
  +(function(a, p, P, b, y) {
    window.appboy = {};
    window.appboyQueue = [];
    for (
      var s = 'initialize destroy getDeviceId toggleAppboyLogging setLogger openSession changeUser requestImmediateDataFlush requestFeedRefresh subscribeToFeedUpdates logCardImpressions logCardClick logFeedDisplayed requestInAppMessageRefresh logInAppMessageImpression logInAppMessageClick logInAppMessageButtonClick logInAppMessageHtmlClick subscribeToNewInAppMessages removeSubscription removeAllSubscriptions logCustomEvent logPurchase isPushSupported isPushBlocked isPushGranted isPushPermissionGranted registerAppboyPushMessages unregisterAppboyPushMessages submitFeedback trackLocation stopWebTracking resumeWebTracking wipeData ab ab.User ab.User.Genders ab.User.NotificationSubscriptionTypes ab.User.prototype.getUserId ab.User.prototype.setFirstName ab.User.prototype.setLastName ab.User.prototype.setEmail ab.User.prototype.setGender ab.User.prototype.setDateOfBirth ab.User.prototype.setCountry ab.User.prototype.setHomeCity ab.User.prototype.setLanguage ab.User.prototype.setEmailNotificationSubscriptionType ab.User.prototype.setPushNotificationSubscriptionType ab.User.prototype.setPhoneNumber ab.User.prototype.setAvatarImageUrl ab.User.prototype.setLastKnownLocation ab.User.prototype.setUserAttribute ab.User.prototype.setCustomUserAttribute ab.User.prototype.addToCustomAttributeArray ab.User.prototype.removeFromCustomAttributeArray ab.User.prototype.incrementCustomUserAttribute ab.User.prototype.addAlias ab.InAppMessage ab.InAppMessage.SlideFrom ab.InAppMessage.ClickAction ab.InAppMessage.DismissType ab.InAppMessage.OpenTarget ab.InAppMessage.ImageStyle ab.InAppMessage.TextAlignment ab.InAppMessage.Orientation ab.InAppMessage.CropType ab.InAppMessage.prototype.subscribeToClickedEvent ab.InAppMessage.prototype.subscribeToDismissedEvent ab.InAppMessage.prototype.removeSubscription ab.InAppMessage.prototype.removeAllSubscriptions ab.InAppMessage.Button ab.InAppMessage.Button.prototype.subscribeToClickedEvent ab.InAppMessage.Button.prototype.removeSubscription ab.InAppMessage.Button.prototype.removeAllSubscriptions ab.SlideUpMessage ab.ModalMessage ab.FullScreenMessage ab.HtmlMessage ab.ControlMessage ab.Feed ab.Feed.prototype.getUnreadCardCount ab.Card ab.ClassicCard ab.CaptionedImage ab.Banner ab.WindowUtils display display.automaticallyShowNewInAppMessages display.showInAppMessage display.showFeed display.destroyFeed display.toggleFeed sharedLib'.split(
        ' '
        ),
        i = 0;
      i < s.length;
      i++
    ) {
      for (
        var m = s[i], k = appboy, l = m.split('.'), j = 0;
        j < l.length - 1;
        j++
      )
        k = k[l[j]];
      k[l[j]] = new Function(
        'return function ' +
        m.replace(/\./g, '_') +
        '(){appboyQueue.push(arguments); return true}'
      )();
    }
    appboy.getUser = function() {
      return new appboy.ab.User();
    };
    appboy.getCachedFeed = function() {
      return new appboy.ab.Feed();
    };
  })(window, document, 'script');
  /* eslint-enable */

  if (appboyUtil.shouldOpenSession(userId, options)) {
    this.hasBeenInitialized = true;
    var config = appboyUtil.getConfig(options);
    this.initializeTester(options.apiKey, config);
    this.appboyInitialize(userId, options, config);
  }

  var versionTag = Number(options.version) === 2.7 ? 'v2.7' : 'v2';
  this.load(versionTag, this.ready);
};

/**
 * @returns {boolean} true if integration should handle event.
 */
Appboy.prototype.shouldHandleEvent = function() {
  return !this.options.onlyTrackKnownUsersOnWeb || this.hasBeenInitialized;
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

  var options = this.options;

  if (
    this.options.onlyTrackKnownUsersOnWeb &&
    userId &&
    !this.hasBeenInitialized // To avoid calling this more than once.
  ) {
    // Rerun initial initialization.
    this.hasBeenInitialized = true;
    var config = appboyUtil.getConfig(options);
    this.initializeTester(options.apiKey, config);
    this.appboyInitialize(userId, options, config);
  }

  if (this.options.onlyTrackKnownUsersOnWeb && !this.hasBeenInitialized) {
    return;
  }

  if (userId) {
    window.appboy.changeUser(userId);
  }
  if (avatar) {
    window.appboy.getUser().setAvatarImageUrl(avatar);
  }
  if (email) {
    window.appboy.getUser().setEmail(email);
  }
  if (firstName) {
    window.appboy.getUser().setFirstName(firstName);
  }
  if (gender) {
    window.appboy.getUser().setGender(getGender(gender));
  }
  if (lastName) {
    window.appboy.getUser().setLastName(lastName);
  }
  if (phone) {
    window.appboy.getUser().setPhoneNumber(phone);
  }
  if (address) {
    window.appboy.getUser().setCountry(address.country);
    window.appboy.getUser().setHomeCity(address.city);
  }
  if (address) {
    window.appboy.getUser().setCountry(address.country);
    window.appboy.getUser().setHomeCity(address.city);
  }
  if (birthday) {
    window.appboy
      .getUser()
      .setDateOfBirth(
        birthday.getUTCFullYear(),
        birthday.getUTCMonth() + 1,
        birthday.getUTCDate()
      );
  }

  // delete all the standard traits from traits clone so that we can use appboy's setCustomAttribute on non-standard traits
  // also remove all reserved keys so we dont set them as custom attributes, otherwise Appboy rejects the entire event
  // https://www.appboy.com/documentation/Platform_Wide/#reserved-keys
  var reserved = [
    'avatar',
    'address',
    'birthday',
    'email',
    'id',
    'firstName',
    'gender',
    'lastName',
    'phone',
    'facebook',
    'twitter',
    'first_name',
    'last_name',
    'dob',
    'external_id',
    'country',
    'home_city',
    'bio',
    'gender',
    'phone',
    'email_subscribe',
    'push_subscribe'
  ];
  each(function(key) {
    delete traits[key];
  }, reserved);

  // Remove nested hash objects as Braze only supports nested array objects in identify calls
  // https://segment.com/docs/destinations/braze/#identify
  each(function(value, key) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !isDate(value)
    ) {
      delete traits[key];
    }
  }, traits);

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
  if (!this.shouldHandleEvent()) {
    return;
  }
  var userId = group.userId();
  var groupIdKey = 'ab_segment_group_' + group.groupId();

  if (userId) {
    window.appboy.changeUser(userId);
  }
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
  if (!this.shouldHandleEvent()) {
    return;
  }
  var userId = track.userId();
  var eventName = track.event();
  var properties = track.properties();
  // remove reserved keys from custom event properties
  // https://www.appboy.com/documentation/Platform_Wide/#reserved-keys

  if (userId) {
    window.appboy.changeUser(userId);
  }
  if (this.options.logPurchaseWhenRevenuePresent && properties.revenue) {
    // orderCompleted has same functionality of a track event with the property 'revenue'
    this.orderCompleted(track);
  } else {
    // Remove nested objects as Braze doesn't support objects in tracking calls
    // https://segment.com/docs/destinations/braze/#track
    each(function(value, key) {
      if (value != null && typeof value === 'object' && !isDate(value)) {
        delete properties[key];
      }
    }, properties);
    window.appboy.logCustomEvent(eventName, properties);
  }
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
  if (!this.shouldHandleEvent()) {
    return;
  }
  var settings = this.options;
  if (!settings.trackAllPages && !settings.trackNamedPages) return;
  if (settings.trackNamedPages && !page.name()) return;

  var userId = page.userId();
  var pageEvent = page.track(page.fullName());
  var eventName = pageEvent.event();
  var properties = page.properties();

  if (userId) {
    window.appboy.changeUser(userId);
  }
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
  if (!this.shouldHandleEvent()) {
    return;
  }
  var userId = track.userId();
  var products = track.products();
  var currencyCode = track.currency();
  var purchaseProperties = track.properties();

  if (userId) {
    window.appboy.changeUser(userId);
  }

  // remove reduntant properties
  del(purchaseProperties, 'products');
  del(purchaseProperties, 'currency');

  // we have to make a separate call to appboy for each product
  for (var i = 0; i < products.length; i++) {
    logProduct(products[i], currencyCode, purchaseProperties);
  }
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

  if (femaleGenders.indexOf(gender.toLowerCase()) > -1)
    return window.appboy.ab.User.Genders.FEMALE;
  if (maleGenders.indexOf(gender.toLowerCase()) > -1)
    return window.appboy.ab.User.Genders.MALE;
  if (otherGenders.indexOf(gender.toLowerCase()) > -1)
    return window.appboy.ab.User.Genders.OTHER;
}

/**
 * Logs a Purchase containing a product as described in Braze's documentation:
 * https://js.appboycdn.com/web-sdk/latest/doc/module-appboy.html#.logPurchase
 *
 * @param {Object} product Product from the Order Completed call
 * @param {String} currencyCode Currency code
 * @param {Object} extraProperties Root properties from the track call
 */
function logProduct(product, currencyCode, extraProperties) {
  var track = new Track({ properties: product });
  var productId = track.productId();
  var price = track.price();
  var quantity = track.quantity();
  var productProperties = track.properties();
  var properties = {};

  del(productProperties, 'productId');
  del(productProperties, 'price');
  del(productProperties, 'quantity');

  for (var productProperty in productProperties) {
    if (!productProperties.hasOwnProperty(productProperty)) {
      continue;
    }

    var value = productProperties[productProperty];
    if (isValidProperty(productProperty, value)) {
      properties[productProperty] = value;
    }
  }

  for (var property in extraProperties) {
    if (!extraProperties.hasOwnProperty(property)) {
      continue;
    }

    var val = extraProperties[property];
    if (
      !productProperties.hasOwnProperty(property) &&
      isValidProperty(property, val)
    ) {
      properties[property] = val;
    }
  }

  window.appboy.logPurchase(
    productId,
    price,
    currencyCode,
    quantity,
    properties
  );
}

/**
 * Validates a name and value of a property, following Braze's restrictions:
 *
 * Names are limited to 255 characters in length, cannot begin with a $, and
 * can only contain alphanumeric characters and punctuation. Values can be
 * numeric, boolean, Date objects, or strings 255 characters or shorter.
 *
 * @param {String} name Name of the property.
 * @param {*} value Value of the property.
 *
 * @return {boolean} <code>true</code> if the name and value are valid, <code>false</code> otherwise.
 */
function isValidProperty(name, value) {
  if (name.length > 255 || name.startsWith('$')) {
    return false;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (isDate(value)) {
    return true;
  }

  if (
    (typeof value === 'string' || value instanceof String) &&
    value.length <= 255
  ) {
    return true;
  }

  return false;
}

/**
 * Validate date:
 *
 * @param {*} value Value of the property.
 *
 * @return {boolean} <code>true</code> if the value are valid, <code>false</code> otherwise.
 */
function isDate(value) {
  return typeof value === 'object' && value instanceof Date;
}
