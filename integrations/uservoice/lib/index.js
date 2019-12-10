'use strict';

/**
 * Module dependencies.
 */

var alias = require('@segment/alias');
var convertDates = require('@segment/convert-dates');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('UserVoice');
var unix = require('to-unix-timestamp');

/**
 * Expose `UserVoice` integration.
 */

var UserVoice = module.exports = integration('UserVoice')
  .assumesPageview()
  .global('UserVoice')
  .global('showClassicWidget')
  .option('apiKey', '')
  .option('classic', false)
  .option('forumId', null)
  .option('showWidget', true)
  .option('mode', 'contact')
  .option('accentColor', '#448dd6')
  .option('screenshotEnabled', true)
  .option('smartvote', true)
  .option('trigger', null)
  .option('triggerPosition', 'bottom-right')
  .option('triggerColor', '#ffffff')
  .option('triggerBackgroundColor', 'rgba(46, 49, 51, 0.6)')
  // BACKWARD COMPATIBILITY: classic options
  .option('classicMode', 'full')
  .option('primaryColor', '#cc6d00')
  .option('linkColor', '#007dbf')
  .option('defaultMode', 'support')
  .option('tabLabel', 'Feedback & Support')
  .option('tabColor', '#cc6d00')
  .option('tabPosition', 'middle-right')
  .option('tabInverted', false)
  .option('customTicketFields', {})
  .tag('<script src="//widget.uservoice.com/{{ apiKey }}.js">');

/**
 * When in "classic" mode, on `construct` swap all of the method to point to
 * their classic counterparts.
 *
 * @api private
 */

UserVoice.on('construct', function(integration) {
  if (!integration.options.classic) return;
  integration.group = undefined;
  integration.identify = integration.identifyClassic;
  integration.initialize = integration.initializeClassic;
});

/**
 * Initialize.
 *
 * @api public
 */

UserVoice.prototype.initialize = function() {
  var options = this.options;
  var opts = formatOptions(options);
  push('set', opts);
  push('autoprompt', {});

  if (options.showWidget) {
    if (options.trigger) {
      push('addTrigger', options.trigger, opts);
    } else {
      push('addTrigger', opts);
    }
  }

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

UserVoice.prototype.loaded = function() {
  return !!(window.UserVoice && window.UserVoice.push !== Array.prototype.push);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

UserVoice.prototype.identify = function(identify) {
  var traits = identify.traits({ created: 'created_at' });
  traits = convertDates(traits, unix);
  push('identify', traits);
};

/**
 * Group.
 *
 * @api public
 * @param {Group} group
 */

UserVoice.prototype.group = function(group) {
  var traits = group.traits({ created: 'created_at' });
  traits = convertDates(traits, unix);
  push('identify', { account: traits });
};

/**
 * Initialize (classic).
 *
 * @api private
 */

UserVoice.prototype.initializeClassic = function() {
  var options = this.options;
  // part of public api
  window.showClassicWidget = showClassicWidget;
  if (options.showWidget) showClassicWidget('showTab', formatClassicOptions(options));
  this.load(this.ready);
};

/**
 * Identify (classic).
 *
 * @api private
 * @param {Identify} identify
 */

UserVoice.prototype.identifyClassic = function(identify) {
  push('setCustomFields', identify.traits());
};

/**
 * Format the options for UserVoice.
 *
 * @api private
 * @param {Object} options
 * @return {Object}
 */

function formatOptions(options) {
  return alias(options, {
    forumId: 'forum_id',
    accentColor: 'accent_color',
    smartvote: 'smartvote_enabled',
    triggerColor: 'trigger_color',
    triggerBackgroundColor: 'trigger_background_color',
    triggerPosition: 'trigger_position',
    screenshotEnabled: 'screenshot_enabled',
    customTicketFields: 'ticket_custom_fields'
  });
}

/**
 * Format the classic options for UserVoice.
 *
 * @api private
 * @param {Object} options
 * @return {Object}
 */

function formatClassicOptions(options) {
  return alias(options, {
    forumId: 'forum_id',
    classicMode: 'mode',
    primaryColor: 'primary_color',
    tabPosition: 'tab_position',
    tabColor: 'tab_color',
    linkColor: 'link_color',
    defaultMode: 'default_mode',
    tabLabel: 'tab_label',
    tabInverted: 'tab_inverted'
  });
}

/**
 * Show the classic version of the UserVoice widget. This method is usually part
 * of UserVoice classic's public API.
 *
 * @api private
 * @param {String} type ('showTab' or 'showLightbox')
 * @param {Object} options (optional)
 */

function showClassicWidget(type, options) {
  type = type || 'showLightbox';
  push(type, 'classic_widget', options);
}
