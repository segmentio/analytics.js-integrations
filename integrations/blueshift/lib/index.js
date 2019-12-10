'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var foldl = require('@ndhoule/foldl');

/**
 * Expose `Blueshift` integration.
 */

var Blueshift = module.exports = integration('Blueshift')
  .global('blueshift')
  .global('_blueshiftid')
  .option('apiKey', '')
  .option('retarget', false)
  .tag('<script src="https://cdn.getblueshift.com/blueshift.js">');

/**
 * Initialize.
 *
 * Documentation: http://getblueshift.com/documentation
 *
 * @api public
 */

Blueshift.prototype.initialize = function() {
  window.blueshift = window.blueshift || [];
  /* eslint-disable */
  window.blueshift.load=function(a){window._blueshiftid=a;var d=function(a){return function(){blueshift.push([a].concat(Array.prototype.slice.call(arguments,0)))}},e=["identify","track","click", "pageload", "capture", "retarget"];for(var f=0;f<e.length;f++)blueshift[e[f]]=d(e[f])};
  /* eslint-enable */
  window.blueshift.load(this.options.apiKey);

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Blueshift.prototype.loaded = function() {
  return !!(window.blueshift && window._blueshiftid);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Blueshift.prototype.page = function(page) {
  if (this.options.retarget) window.blueshift.retarget();

  var properties = page.properties();
  properties._bsft_source = 'segment.com';
  properties.customer_id = this.analytics.user().id();
  properties.anonymousId = this.analytics.user().anonymousId();
  properties.category = page.category();
  properties.name = page.name();

  window.blueshift.pageload(removeBlankAttributes(properties));
};

/**
 * Trait Aliases.
 */

var traitAliases = {
  created: 'created_at',
  firstName: 'firstname',
  lastName: 'lastname'
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Blueshift.prototype.identify = function(identify) {
  if (!identify.userId() && !identify.anonymousId()) {
    return this.debug('user id required');
  }
  var traits = identify.traits(traitAliases);
  traits._bsft_source = 'segment.com';
  traits.customer_id = identify.userId();
  traits.anonymousId = identify.anonymousId();

  window.blueshift.identify(removeBlankAttributes(traits));
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Blueshift.prototype.track = function(track) {
  var properties = track.properties();
  properties._bsft_source = 'segment.com';
  properties.customer_id = this.analytics.user().id();
  properties.anonymousId = this.analytics.user().anonymousId();

  window.blueshift.track(track.event(), removeBlankAttributes(properties));
};

/**
 * Alias.
 *
 * @param {Alias} alias
 */

Blueshift.prototype.alias = function(alias) {
  window.blueshift.track('alias', removeBlankAttributes({
    _bsft_source: 'segment.com',
    customer_id: alias.userId(),
    previous_customer_id: alias.previousId(),
    anonymousId: alias.anonymousId()
  }));
};

/**
 * Filters null/undefined values from an object, returning a new object.
 *
 * @api private
 * @param {Object} obj
 * @return {Object}
 */

function removeBlankAttributes(obj) {
  return foldl(function(results, val, key) {
    if (val !== null && val !== undefined) results[key] = val;
    return results;
  }, {}, obj);
}
