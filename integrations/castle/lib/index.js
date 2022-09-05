'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var objCase = require('obj-case');
var newDate = require('new-date');
var isoDate = require('@segment/isodate');
var toIsoString = require('@segment/to-iso-string');

/**
 * Expose `Castle` integration.
 */

var CastleIntegration = (module.exports = integration('Castle')
  .global('CastleSegment')
  .global('casData')
  .option('publishableKey', '')
  .option('cookieDomain', '')
  .tag(
    '<script src="https://d355prp56x5ntt.cloudfront.net/v3/castle.segment.js">'
  ));

/**
 * Initialize.
 *
 * @api public
 */
CastleIntegration.prototype.initialize = function() {
  var options = this.options;
  var self = this;
  // reset casData always
  window.casData = {};

  this.load(function() {
    window.CastleSegment.configure({
      pk: options.publishableKey,
      cookieDomain: options.cookieDomain,
      verbose: false
    });
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

CastleIntegration.prototype.loaded = function() {
  return typeof window.CastleSegment !== 'undefined';
};

/**
 * Identify
 *
 * @api public
 */
/*  */
CastleIntegration.prototype.identify = function(identify) {
  var castleOptions = identify.options(this.name);

  if (castleOptions && objCase.find(castleOptions, 'userJwt')) {
    window.casData.jwt = objCase.find(castleOptions, 'userJwt');
  } else {
    objCase.del(window.casData, 'jwt');
  }
};

/**
 * reset
 *
 * @api public
 */
/*  */
CastleIntegration.prototype.reset = function() {
  if (window.casData) {
    objCase.del(window.casData, 'jwt');
  }
};

var convertDateToIso = function(date) {
  if (isoDate.is(date)) {
    return date;
  }
  var convertedDate = toIsoString(newDate(date));
  if (isoDate.is(convertedDate)) {
    return convertedDate;
  }

  return undefined;
};

var generateUserObj = function(user) {
  var userObj = {};

  if (!user || !user.id()) {
    return undefined;
  }

  var traits = user.traits();

  userObj.id = user.id();

  if (objCase.find(traits, 'email')) {
    userObj.email = objCase.find(traits, 'email');
    objCase.del(traits, 'email');
  }

  if (objCase.find(traits, 'phone')) {
    userObj.phone = objCase.find(traits, 'phone');
    objCase.del(traits, 'phone');
  }

  if (objCase.find(traits, 'registeredAt')) {
    var convertedRegisteredAt = convertDateToIso(
      objCase.find(traits, 'registeredAt')
    );
    if (convertedRegisteredAt) {
      userObj.registered_at = convertedRegisteredAt;
      objCase.del(traits, 'registeredAt');
    }
  }
  if (objCase.find(traits, 'createdAt') && !userObj.registered_at) {
    var convertedCreatedAt = convertDateToIso(
      objCase.find(traits, 'createdAt')
    );
    if (convertedCreatedAt) {
      userObj.registered_at = convertedCreatedAt;
      objCase.del(traits, 'createdAt');
    }
  }
  if (objCase.find(traits, 'name')) {
    userObj.name = objCase.find(traits, 'name');
    objCase.del(traits, 'name');
  }
  userObj.traits = traits;

  return userObj;
};

var userOrJwt = function(jwtData, userData) {
  return jwtData ? { userJwt: jwtData } : { user: generateUserObj(userData) };
};

/**
 * Page
 *
 * @api public
 * @param {Page} page
 */

CastleIntegration.prototype.page = function(page) {
  var data = userOrJwt(window.casData.jwt, this.analytics.user());
  if (page.url()) {
    data.url = page.url();
  }
  if (page.name()) {
    data.name = page.name();
  }
  if (!data.name && page.title()) {
    data.name = page.title();
  }
  if (page.referrer()) {
    data.referrer = page.referrer();
  }

  window.CastleSegment.page(data);
};
//
/**
 * Track
 *
 * @api public
 * @param {Track} track
 */

CastleIntegration.prototype.track = function(track) {
  var data = userOrJwt(window.casData.jwt, this.analytics.user());
  data.name = track.event();
  data.properties = track.properties();

  window.CastleSegment.custom(data);
};
