'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var extend = require('@ndhoule/extend');

/**
 * Expose `Chameleon` integration.
 */

var Chameleon = (module.exports = integration('Chameleon')
  .readyOnInitialize()
  .readyOnLoad()
  .global('chmln')
  .option('apiKey', null)
  .option('fastUrl', 'https://fast.trychameleon.com/')
  .tag(
    '<script src="{{fastUrl}}messo/{{apiKey}}/messo.min.js"></script>'
  ));

/**
 * Initialize Chameleon.
 *
 * @api public
 */

Chameleon.prototype.initialize = function() {
  /* eslint-disable */
  var that=this;!function(){var c=(window.chmln||(window.chmln={}));if(c.root){return;}c.location=window.location.href.toString();c.accountToken=that.options.apiKey;c.fastUrl=that.options.fastUrl;var names='setup identify alias track set show on off custom help _data'.split(' ');for(var i=0;i<names.length;i++){(function(){var t=c[names[i]+'_a']=[];c[names[i]]=function(){t.push(arguments);};})()}}();
  /* eslint-enable */

  this.ready();
  this.load();
};

/**
 * Has the Chameleon library been loaded yet?
 *
 * @api private
 * @return {boolean}
 */

Chameleon.prototype.loaded = function() {
  return !!window.chmln;
};

/**
 * Identify a user.
 *
 * @api public
 * @param {Facade} identify
 */

Chameleon.prototype.identify = function(identify) {
  var traits = identify.traits();
  var opts = identify.options(this.name);

  delete traits.id;

  window.chmln.identify(identify.userId(), extend(traits, opts));
};

/**
 * Associate the current user with a group of users.
 *
 * @api public
 * @param {Facade} group
 */

Chameleon.prototype.group = function(group) {
  window.chmln.set({ company: group.traits({ id: 'uid' }) });
};

/**
 * Track an event.
 *
 * @param {Facade} track
 */

Chameleon.prototype.track = function(track) {
  window.chmln.track(track.event(), track.properties());
};

/**
 * Change the user identifier after we know who they are.
 *
 * @param {Facade} alias
 */

Chameleon.prototype.alias = function(alias) {
  window.chmln.alias({
    from: alias.previousId() || alias.anonymousId(),
    to: alias.userId()
  });
};
