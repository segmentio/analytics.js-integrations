'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var clone = require('component-clone');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose Userlike integration.
 */

var Userlike = module.exports = integration('Userlike')
  .assumesPageview()
  .global('userlikeConfig')
  .global('userlikeData')
  .option('secretKey', '')
  .option('listen', false)
  .tag('<script src="//userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/{{ secretKey }}.js">');

/**
 * The context for this integration.
 */

var integrationContext = {
  name: 'userlike',
  version: '1.0.0'
};

/**
 * Initialize.
 *
 * @api public
 */

Userlike.prototype.initialize = function() {
  var self = this;
  var segment_base_info = clone(this.options); 
  var user = this.analytics.user();
  var identify = new Identify({
    userId: user.id(),
    traits: user.traits()
  });

  // FIXME: Should this be a global? Waiting for answer from Userlike folks as
  // of 5/19/2015
  //
  // https://github.com/thomassittig/analytics.js-integrations/commit/e8fb4c067abe7f8549d0e0153504fd24a9aa4b53
  // segment_base_info = clone(this.options);

  segment_base_info.visitor = {
    name: identify.name(),
    email: identify.email()
  };

  if (!window.userlikeData) window.userlikeData = { custom: {} };
  window.userlikeData.custom.segmentio = segment_base_info;

  this.load(function() {
    if (self.options.listen) self.attachListeners();
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */

Userlike.prototype.loaded = function() {
  return !!(window.userlikeConfig && window.userlikeData);
};

/**
 * Listen for chat events.
 *
 * TODO: As of 4/17/2015, Userlike doesn't give access to the message body in events.
 * Revisit this/send it when they do.
 */

Userlike.prototype.attachListeners = function() {
  var self = this;
  window.userlikeTrackingEvent = function(eventName, globalCtx, sessionCtx) {
    if (eventName === 'chat_started') {
      self.analytics.track(
        'Live Chat Conversation Started',
        { agentId: sessionCtx.operator_id, agentName: sessionCtx.operator_name },
        { context: { integration: integrationContext }
      });
    }
    if (eventName === 'message_operator_terminating') {
      self.analytics.track(
        'Live Chat Message Sent',
        { agentId: sessionCtx.operator_id, agentName: sessionCtx.operator_name },
        { context: { integration: integrationContext }
      });
    }
    if (eventName === 'message_client_terminating') {
      self.analytics.track(
        'Live Chat Message Received',
        { agentId: sessionCtx.operator_id, agentName: sessionCtx.operator_name },
        { context: { integration: integrationContext }
      });
    }
    if (eventName === 'chat_quit') {
      self.analytics.track(
        'Live Chat Conversation Ended',
        { agentId: sessionCtx.operator_id, agentName: sessionCtx.operator_name },
        { context: { integration: integrationContext }
      });
    }
  };
};
