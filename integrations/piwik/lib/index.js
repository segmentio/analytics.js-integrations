'use strict';

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var is = require('is');
var push = require('global-queue')('_paq');

/**
 * Expose `Piwik` integration.
 */

var Piwik = module.exports = integration('Piwik')
  .global('_paq')
  .option('url', null)
  .option('siteId', '')
  .option('customVariableLimit', 5)
  .mapping('goals')
  .tag('<script src="{{ url }}/piwik.js">');

/**
 * Initialize.
 *
 * http://piwik.org/docs/javascript-tracking/#toc-asynchronous-tracking
 *
 * @api public
 */

Piwik.prototype.initialize = function() {
  window._paq = window._paq || [];
  push('setSiteId', this.options.siteId);
  push('setTrackerUrl', this.options.url + '/piwik.php');
  push('enableLinkTracking');
  this.load(this.ready);
};

/**
 * Check if Piwik is loaded.
 *
 * @api private
 */

Piwik.prototype.loaded = function() {
  return !!(window._paq && window._paq.push !== Array.prototype.push);
};

/**
 * Page
 *
 * @api public
 * @param {Page} page
 */

Piwik.prototype.page = function() {
  push('trackPageView');
};

/**
 * Identify
 *
 * @api public
 * @param {Identify} identify
 */

Piwik.prototype.identify = function(identify) {
  if (!identify.userId()) return;
  // Ref: http://developer.piwik.org/guides/tracking-javascript-guide#user-id
  push('setUserId', identify.userId().toString());
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Piwik.prototype.track = function(track) {
  var goals = this.goals(track.event());
  var revenue = track.revenue();
  var category = track.category() || 'All';
  var action = track.event();
  var name = track.proxy('properties.name') || track.proxy('properties.label');
  var value = track.value() || track.revenue();

  var options = track.options('Piwik');
  var customVariables = options.customVars || options.cvar;

  if (!is.object(customVariables)) {
    customVariables = {};
  }

  for (var i = 1; i <= this.options.customVariableLimit; i += 1) {
    if (customVariables[i]) {
      push('setCustomVariable', i.toString(), customVariables[i][0], customVariables[i][1], 'page');
    }
  }

  each(goals, function(goal) {
    push('trackGoal', goal, revenue);
  });

  push('trackEvent', category, action, name, value);
};
