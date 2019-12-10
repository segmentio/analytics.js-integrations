'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `SupportHero` integration.
 */

var SupportHero = module.exports = integration('SupportHero')
  .assumesPageview()
  .global('supportHeroWidget')
  .option('token', '')
  .option('track', false)
  .tag('<script src="https://d29l98y0pmei9d.cloudfront.net/js/widget.min.js?k={{ token }}">');

/**
 * Initialize Support Hero.
 *
 * @api public
 */

SupportHero.prototype.initialize = function() {
  window.supportHeroWidget = {};
  window.supportHeroWidget.setUserId = window.supportHeroWidget.setUserId || function() {};
  window.supportHeroWidget.setUserTraits = window.supportHeroWidget.setUserTraits || function() {};
  this.load(this.ready);
};

/**
 * Has the Support Hero library been loaded yet?
 *
 * @api private
 * @return {boolean}
 */

SupportHero.prototype.loaded = function() {
  return !!window.supportHeroWidget;
};

/**
 * Identify a user.
 *
 * @api public
 * @param {Facade} identify
 */

SupportHero.prototype.identify = function(identify) {
  var id = identify.userId();
  var traits = identify.traits();
  if (id) {
    window.supportHeroWidget.setUserId(id);
  }
  if (traits) {
    window.supportHeroWidget.setUserTraits(traits);
  }
};
