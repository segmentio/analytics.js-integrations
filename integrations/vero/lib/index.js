'use strict';

/**
 * Module dependencies.
 */

var cookie = require('component-cookie');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_veroq');

/**
 * Expose `Vero` integration.
 */

var Vero = module.exports = integration('Vero')
  .global('_veroq')
  .option('apiKey', '')
  .tag('<script src="//d3qxef4rp70elm.cloudfront.net/m.js">');

/**
 * Initialize.
 *
 * https://github.com/getvero/vero-api/blob/master/sections/js.md
 *
 * @api public
 */

Vero.prototype.initialize = function() {
  // clear default cookie so vero parses correctly.
  // this is for the tests.
  // basically, they have window.addEventListener('unload')
  // which then saves their "command_store", which is an array.
  // so we just want to create that initially so we can reload the tests.
  if (!cookie('__veroc4')) cookie('__veroc4', '[]');
  push('init', { api_key: this.options.apiKey });
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Vero.prototype.loaded = function() {
  return !!(window._veroq && window._veroq.push !== Array.prototype.push);
};

/**
 * Page.
 *
 * https://www.getvero.com/knowledge-base#/questions/71768-Does-Vero-track-pageviews
 *
 * @api public
 * @param {Page} page
 */

Vero.prototype.page = function(page) {
  push('trackPageview');
  var tags = page.options('Vero').tags;
  if (tags) this.addOrRemoveTags(tags);
};

/**
 * Identify.
 *
 * https://www.getvero.com/api/http/#users
 * https://github.com/getvero/vero-api/blob/master/sections/js.md#user-identification
 *
 * @api public
 * @param {Identify} identify
 */

Vero.prototype.identify = function(identify) {
  var traits = identify.traits();
  var email = identify.email();
  var id = identify.userId();
  // userId OR email address are required by Vero's API. When userId isn't present,
  // email will be used as the userId.
  if (!id && !email) return;
  push('user', traits);
  // check for tags and either add or remove.
  var tags = identify.options('Vero').tags;
  if (tags) this.addOrRemoveTags(tags);
};

/**
 * Track.
 *
 * https://www.getvero.com/api/http/#actions
 * https://github.com/getvero/vero-api/blob/master/sections/js.md#tracking-events
 *
 * @api public
 * @param {Track} track
 */

Vero.prototype.track = function(track) {
  var regex = /[uU]nsubscribe/;

  if (track.event().match(regex)) {
    push('unsubscribe', { id: track.properties().id });
  } else {
    push('track', track.event(), track.properties(), { source: 'segment' });
  }
  // check for tags and either add or remove.
  var tags = track.options('Vero').tags;
  if (tags) this.addOrRemoveTags(tags);
};

/**
 * Alias.
 *
 * https://www.getvero.com/api/http/#users
 * https://github.com/getvero/vero-api/blob/master/sections/api/users.md
 *
 * @api public
 * @param {Alias} alias
 */

Vero.prototype.alias = function(alias) {
  var to = alias.to();

  if (alias.from()) {
    push('reidentify', to, alias.from());
  } else {
    push('reidentify', to);
  }
  var tags = alias.options('Vero').tags;
  if (tags) this.addOrRemoveTags(tags);
};

/**
 * AddOrRemoveTags.
 *
 * http://developers.getvero.com/?javascript#tags
 *
 * @api public
 * @param {Object} tags
 */

Vero.prototype.addOrRemoveTags = function(tags) {
  var payload = {};
  if (!tags.action || !tags.values) return;
  var action = tags.action;
  payload[action] = tags.values;
  if (tags.id) {
    payload.id = tags.id;
  }
  push('tags', payload);
};