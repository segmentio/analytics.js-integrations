'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var each = require('@ndhoule/each');

/**
 * Expose `Perimeterx` integration.
 */

var Perimeterx = module.exports = integration('Perimeterx')
  .global('PX')
  .global('_pxAppId')
  .option('appId', '')
  .option('customTraits', {})
  .tag('<script src="//client.perimeterx.net/{{ appId }}/main.min.js">');

/**
 * Initialize.
 *
 * @api public
 */

Perimeterx.prototype.initialize = function() {
  var options = this.options;
  var self = this;
  window._pxAppId = options.appId || '';
  this.globals.push(options.appId + '_asyncInit', options.appId);
  window[options.appId + '_asyncInit'] = function(px) {
    px.Events.on('score', function(result) {
      var traits = {};
      traits.pxResult = result;
      self.analytics.identify(traits, { integrations: { Perimeterx: false } });
    });
  };

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

Perimeterx.prototype.loaded = function() {
  return !!window.PX;
};

/**
 * Identify.
 *
 * Users have the ability to send custom traits to perimeterx. At some point perimeterx checks the
 * window object for these traits so no outbound call is made to perimeterx here.
 *
 * @api public
 * @param {Object} identify
 */

Perimeterx.prototype.identify = function(identify) {
  // iterate over customTraits and set is as pxParam
  // window._pxParam1 = "<param1>";
  var customTraits = this.options.customTraits;
  var traits = identify.traits();

  each(function(trait, key) {
    if (traits[key]) {
      window[trait] = traits[key];
    }
  }, customTraits);
};
