'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var is = require('is');
var tick = require('next-tick');

/**
 * Expose `SnapEngage` integration.
 */

var SnapEngage = module.exports = integration('SnapEngage')
  .assumesPageview()
  .global('SnapABug')
  .global('SnapEngage')
  .option('apiKey', '')
  .option('listen', false)
  .tag('<script src="//www.snapengage.com/cdn/js/{{ apiKey }}.js">');

/**
 * Integration object for root events.
 */

var integrationContext = {
  name: 'snapengage',
  version: '1.0.0'
};

/**
 * Initialize.
 *
 * http://help.snapengage.com/installation-guide-getting-started-in-a-snap/
 *
 * @api public
 */

SnapEngage.prototype.initialize = function() {
  var self = this;
  this.load(function() {
    if (self.options.listen) self.attachListeners();
    tick(self.ready);
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

SnapEngage.prototype.loaded = function() {
  return is.object(window.SnapABug) && is.object(window.SnapEngage);
};

/**
 * Identify.
 *
 * @api private
 * @param {Identify} identify
 */

SnapEngage.prototype.identify = function(identify) {
  var email = identify.email();
  if (!email) return;
  window.SnapABug.setUserEmail(email);
};

/**
 * Listen for events.
 *
 * https://developer.snapengage.com/javascript-api/setcallback/
 *
 * @api private
 */

SnapEngage.prototype.attachListeners = function() {
  var self = this;

  // Callback is passed `email, message, type`
  // TODO: Eventually this might pass information about the chat to Segment
  window.SnapEngage.setCallback('StartChat', function() {
    self.analytics.track('Live Chat Conversation Started',
      {},
      { context: { integration: integrationContext } });
  });

  // Callback is passed `agent, message`
  // TODO: Eventually this might pass information about the message to Segment
  window.SnapEngage.setCallback('ChatMessageReceived', function(agent) {
    self.analytics.track('Live Chat Message Received',
      { agentUsername: agent },
      { context: { integration: integrationContext } });
  });

  // Callback is passed `message`
  // TODO: Eventually this might pass information about the message to Segment
  window.SnapEngage.setCallback('ChatMessageSent', function() {
    self.analytics.track('Live Chat Message Sent',
      {},
      { context: { integration: integrationContext } });
  });

  // Callback is passed `type, status`
  // TODO: Eventually this might pass information about the status to Segment
  window.SnapEngage.setCallback('Close', function() {
    self.analytics.track('Live Chat Conversation Ended',
      {},
      { context: { integration: integrationContext } });
  });
};
