'use strict';

/**
 * Module dependencies.
 */

var camel = require('camelcase');
var foldl = require('@ndhoule/foldl');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `ReplayBird` integration.
 *
 * https://www.replaybird.com
 */

var ReplayBird = (module.exports = integration('ReplayBird')
  .option('siteKey', '')
  .option('debug', false));

/**
 * Initialize.
 */
ReplayBird.prototype.initialize = function() {

  /* eslint-disable no-param-reassign */
  !function(a,b,c,d,e,f,g,h){a.ReplayBirdObject=e,a[e]=a[e]||function(){
  (a[e].o=a[e].o||[]).push(arguments)},g=b.createElement(c),h=b.getElementsByTagName(c)[0],
  g.async=1,g.src=d,a.__replaybirdNoConflict=!!f,h.parentNode.insertBefore(g,h);
  }(window,document,"script","https://cdn.replaybird.com/replaybird.min.js","_rb");
  /* eslint-enable no-param-reassign */

  _rb("apikey", this.options.siteKey);
  _rb("debugMode", this.options.debug);
  this.ready();
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */
ReplayBird.prototype.loaded = function() {
  return !!window.ReplayBird;
};

/**
 * Identify
 *
 * @param {Identify} identify
 */
ReplayBird.prototype.identify = function(identify) {
  if (!identify.userId()) {
    return this.debug('user id is required');
  }

  var traits = identify.traits({ name: 'name' });

  var newTraits = foldl(
    function(results, value, key) {
      var rs = results;
      if (key !== 'id') {
        rs[
          key === 'name' || key === 'email' ? key : camelCaseField(key)
        ] = value;
      }
      return rs;
    },
    {},
    traits
  );

  if (identify.userId()) {
    window.ReplayBird.identify(String(identify.userId()), newTraits);
  }
};

/**
 * Track. Passes the events directly to ReplayBird
 *
 * @param {Track} track
 */
ReplayBird.prototype.track = function(track) {
  window.ReplayBird.event(track.event(), track.properties());
};

/**
 * Camel cases `.`, `-`, `_`, and white space within fieldNames. Leaves type suffix alone.
 *
 * NOTE: Does not fix otherwise malformed fieldNames.
 * ReplayBird will scrub characters from keys that do not conform to /^[a-zA-Z][a-zA-Z0-9_]*$/.
 *
 * @param {string} fieldName
 */
function camelCaseField(fieldName) {
  // Do not camel case across type suffixes.
  var parts = fieldName.split('_');
  if (parts.length > 1) {
    var typeSuffix = parts.pop();
    switch (typeSuffix) {
      case 'str':
      case 'int':
      case 'date':
      case 'real':
      case 'bool':
      case 'strs':
      case 'ints':
      case 'dates':
      case 'reals':
      case 'bools':
        return camel(parts.join('_')) + '_' + typeSuffix;
      default: // passthrough
    }
  }

  // No type suffix found. Camel case the whole field name.
  return camel(fieldName);
}
