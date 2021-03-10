'use strict';

/**
 * Module dependencies.
 */

var fmt = require('@segment/fmt');
var integration = require('@segment/analytics.js-integration');
var when = require('do-when');
var reject = require('reject');

/**
 * Expose `Zopim`.
 */

var Zopim = (module.exports = integration('Zopim')
  .global('$zopim')
  .option('zopimId', '')
  .option('listen', false)
  .readyOnLoad());

/**
 * The context for this integration.
 */

var integrationContext = {
  name: 'zopim',
  version: '1.0.0'
};

/**
 * Initialize the integration.
 */

Zopim.prototype.initialize = function() {
  var self = this;
  this.load(function() {
    if (self.options.listen) self.attachListeners();
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @return {boolean}
 */

Zopim.prototype.loaded = function() {
  return !!(window.$zopim && typeof window.$zopim.livechat === 'object');
};

/**
 * Load the Zopim script
 *
 * @param {Function} done Callback to invoke when the script is loaded.
 */

Zopim.prototype.load = function(done) {
  var zopimId = this.options.zopimId;
  var scriptUrl = fmt('//v2.zopim.com/?%s', zopimId);

  /* eslint-disable */
  window.$zopim || (function(d, s) { var z = (window.$zopim = function(c) { z._.push(c); }), $ = (z.s = d.createElement(s)), e = d.getElementsByTagName(s)[0]; z.set = function(o) { z.set._.push(o); }; z._ = []; z.set._ = []; $.async = !0; $.setAttribute('charset', 'utf-8'); $.src = scriptUrl; z.t = +new Date(); $.type = 'text/javascript'; e.parentNode.insertBefore($, e); })(document, 'script');
  /* eslint-enable */

  when(this.loaded, done);
};

/**
 * Listen for chat events.
 */

// FIXME: Zopim has no support for message received/sent, add those handlers
// when they do
Zopim.prototype.attachListeners = function() {
  var self = this;

  // Zopim has not yet loaded, bail out
  if (!window.$zopim.livechat) return;
  if (!window.$zopim.livechat.setOnChatStart) return;

  window.$zopim.livechat.setOnChatStart(function() {
    self.analytics.track(
      'Live Chat Conversation Started',
      {},
      { context: { integration: integrationContext } }
    );
  });

  window.$zopim.livechat.setOnChatEnd(function() {
    self.analytics.track(
      'Live Chat Conversation Ended',
      {},
      { context: { integration: integrationContext } }
    );
  });
};

/**
 * Identify.
 *
 * @param {Identify} identify
 */

Zopim.prototype.identify = function(identify) {
  window.$zopim.livechat.set(
    reject({
      email: identify.email(),
      name: identify.name() || identify.firstName(),
      phone: identify.phone()
    })
  );
};
