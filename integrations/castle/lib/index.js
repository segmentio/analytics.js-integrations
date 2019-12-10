'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Castle` integration.
 */

var Castle = module.exports = integration('Castle')
  .option('publishableKey', '')
  .option('autoPageview', false)
  .option('cookieDomain', false)
  .tag('<script src="//d2t77mnxyo7adj.cloudfront.net/v1/cs.js">');

/**
 * Initialize.
 *
 * @api public
 */

Castle.prototype.initialize = function() {
  window._castle = window._castle || {};
  window._castle.q = window._castle.q || [];
  window._castle.q.push(['setKey', this.options.publishableKey]);

  if (this.options.cookieDomain) {
    window._castle.q.push(['setCookieDomain', this.options.cookieDomain]);
  }

  if (this.options.autoPageview === false) {
    window._castle.q.push(['autoTrack', this.options.autoPageview]);
  }

  this._identifyFromCache();

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

Castle.prototype.loaded = function() {
  return typeof window._castle === 'function';
};

/**
 * Identify
 *
 * @api public
 */

Castle.prototype.identify = function(identify) {
  var traits = identify.traits();
  var castleOptions = identify.options(this.name);
  if (castleOptions && castleOptions.secure) {
    window._castle('secure', castleOptions.secure);
  }
  delete traits.id;
  window._castle('identify', identify.userId(), traits);
};

/**
 * Track
 *
 * @api public
 */

Castle.prototype.page = function(page) {
  if (this.options.autoPageview) return;
  window._castle('page', page.url(), page.title());
};

/**
 * Page
 *
 * @api public
 */

Castle.prototype.track = function(track) {
  window._castle('track', track.event(), track.properties());
};


/**
 * Send user information to Castle from cached user
 *
 * @api private
 */

Castle.prototype._identifyFromCache = function() {
  // See if there is a cached user, and call identify if so
  var user = this.analytics.user();
  if (user.id()) {
    window._castle.q.push(['identify', user.id(), user.traits()]);
  }
};
