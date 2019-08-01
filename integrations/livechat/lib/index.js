'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var clone = require('component-clone');
var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var tick = require('next-tick');
var when = require('do-when');

/**
 * Expose `LiveChat` integration.
 */

var LiveChat = module.exports = integration('LiveChat')
  .assumesPageview()
  .global('LC_API')
  .global('LC_Invite')
  .global('__lc')
  .global('__lc_inited')
  .global('__lc_lang')
  .option('group', 0)
  .option('license', '')
  .option('listen', false)
  .tag('<script src="//cdn.livechatinc.com/tracking.js">');

/**
 * The context for this integration.
 */

var integrationContext = {
  name: 'livechat',
  version: '1.0.0'
};

/**
 * Initialize.
 *
 * http://www.livechatinc.com/api/javascript-api
 *
 * @api public
 */

LiveChat.prototype.initialize = function() {
  var self = this;
  var user = this.analytics.user();
  var identify = new Identify({
    userId: user.id(),
    traits: user.traits()
  });

  window.__lc = clone(this.options);
  window.__lc.visitor = {
    name: identify.name(),
    email: identify.email()
  };
  // listen is not an option we need from clone
  delete window.__lc.listen;

  this.load(function() {
    when(function() {
      return self.loaded();
    }, function() {
      if (self.options.listen) self.attachListeners();
      tick(self.ready);
    });
  });
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

LiveChat.prototype.loaded = function() {
  return !!(window.LC_API && window.LC_Invite);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

LiveChat.prototype.identify = function(identify) {
  var traits = identify.traits({ userId: 'User ID' });
  window.LC_API.set_custom_variables(convert(traits));
};

/**
 * Listen for chat events.
 *
 * @api private
 */

LiveChat.prototype.attachListeners = function() {
  var self = this;
  window.LC_API = window.LC_API || {};

  window.LC_API.on_chat_started = function(data) {
    self.analytics.track(
      'Live Chat Conversation Started',
      { agentName: data.agent_name },
      { context: { integration: integrationContext }
    });
  };

  window.LC_API.on_message = function(data) {
    if (data.user_type === 'visitor') {
      self.analytics.track(
        'Live Chat Message Sent',
        {},
        { context: { integration: integrationContext }
      });
    } else {
      self.analytics.track(
        'Live Chat Message Received',
        { agentName: data.agent_name, agentUsername: data.agent_login },
        { context: { integration: integrationContext }
      });
    }
  };

  window.LC_API.on_chat_ended = function() {
    self.analytics.track('Live Chat Conversation Ended');
  };
};

/**
 * Convert a traits object into the format LiveChat requires.
 *
 * @param {Object} traits
 * @return {Array}
 */

function convert(traits) {
  var arr = [];
  each(traits, function(key, value) {
    arr.push({ name: key, value: value });
  });
  return arr;
}
