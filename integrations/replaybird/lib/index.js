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
  !function(t,e){var o,n,p,r;e.__SV||(window.replaybird=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src="https://cdn.replaybird.com/agent/latest/replaybird.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="replaybird",u.people=u.people||[],u.toString=function(t){var e="replaybird";return"replaybird"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="identify capture alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.replaybird||[]);
  /* eslint-enable no-param-reassign */

  window.replaybird.init(this.options.siteKey, { });
  // if (this.options.debug) {
  //   window.replaybird.debug();
  // }
  this.ready();
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */
ReplayBird.prototype.loaded = function() {
  return !!window.replaybird;
};

/**
 * Identify
 *
 * @param {Identify} identify
 */
ReplayBird.prototype.identify = function(identify) {
  if (!identify.userId()) {
    return this.debug('User id is required!');
  }

  var traits = identify.traits({ name: 'displayName' });

  var newTraits = foldl(
    function(results, value, key) {
      var rs = results;
      if (key !== 'id') {
        rs[
          key === 'displayName' || key === 'email' ? key : camelCaseField(key)
        ] = value;
      }
      return rs;
    },
    {},
    traits
  );

  var id = String(identify.userId());
  window.replaybird.identify(id, newTraits);
};

/**
 * Track. Passes the events directly to ReplayBird
 *
 * @param {Track} track
 */
ReplayBird.prototype.track = function(track) {
  if (window.replaybird) {
    window.replaybird.capture(track.event(), track.properties());
  }
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
