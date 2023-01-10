'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var each = require('@ndhoule/each');
var is = require('is');

/**
 * Expose `CleverTap` integration.
 */

var CleverTap = (module.exports = integration('CleverTap')
  .global('clevertap')
  .option('clevertap_account_id', '')
  .option('region', '')
  .tag('https', '<script src="https://static.clevertap.com/js/clevertap.min.js">')
  );

/**
 * Initialize.
 *
 * https://support.clevertap.com/docs/website/getting-started.html
 *
 * @api public
 */

CleverTap.prototype.initialize = function() {
  window.clevertap = {
    event: [],
    profile: [],
    account: [],
    onUserLogin: [],
    notifications: []
  };
  window.clevertap.enablePersonalization = true;
  window.clevertap.account.push({ id: this.options.clevertap_account_id });
  var region = this.options.region;
  if (region && is.string(region)) {
    // the hardcoded value actually returns 'in.' intentionally w the period because it is used for the direct integration
    // and since dealing with mongo is much more painful, we will strip here
    window.clevertap.region = region.replace('.', '');
  }
  this.load('https', this.ready);
};

CleverTap.prototype.loaded = function() {
  return !!window.clevertap && window.clevertap.logout !== 'undefined';
};

/**
 * Identify.
 *
 * @api public
 * @param {Facade} identify
 *
 * this snippet should be invoked when a user logs out from your website:
    analytics.ready(function() {
      window.clevertap.logout();
    });
 */

CleverTap.prototype.identify = function(identify) {
  var traitAliases = {
    id: 'Identity',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    gender: 'Gender',
    birthday: 'DOB',
    avatar: 'Photo'
  };
  var traits = identify.traits(traitAliases);
  // sdk does not accept objects
  var supportedTraits = {};
  each(function(value, key) {
    if (!is.object(value)) supportedTraits[key] = value;
  }, traits);
  window.clevertap.onUserLogin.push({
    Site: supportedTraits
  });
};

/**
 * Alias.
 *
 * @api public
 * @param {Facade} alias
 */

CleverTap.prototype.alias = function(alias) {
  window.clevertap.profile.push({
    Site: { Identity: alias.to() }
  });
};

/**
 * Track.
 *
 * @api public
 * @param {Track} event
 */

CleverTap.prototype.track = function(track) {
  var props = track.properties();
  // sdk does not accept any objects or arrays
  var supportedProps = {};
  each(function(value, key) {
    if (!is.object(value) && !is.array(value)) supportedProps[key] = value;
  }, props);
  window.clevertap.event.push(track.event(), supportedProps);
};

/**
 * Order Completed.
 *
 * Breaking this out because it requires certain properties that all other events don't.
 *
 * https://support.clevertap.com/docs/working-with-events.html#recording-customer-purchases
 *
 * @api public
 * @param {Track} track
 */

CleverTap.prototype.orderCompleted = function(track) {
  var transaction = track.properties({
    order_id: 'Charged ID',
    products: 'Items'
  });
  transaction.Amount = track.total() || track.properties().revenue;
  window.clevertap.event.push('Charged', transaction);
};
