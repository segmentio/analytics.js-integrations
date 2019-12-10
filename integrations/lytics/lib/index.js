'use strict';

/**
 * Module dependencies.
 */

var alias = require('@segment/alias');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Lytics` integration.
 */

var Lytics = module.exports = integration('Lytics')
  .global('jstag')
  .option('cid', '')
  .option('stream', 'default')
  .option('cookie', 'seerid')
  .option('blockload', false)
  .option('loadid', false)
  .option('delay', 2000)
  .option('sessionTimeout', 1800)
  .option('url', '//c.lytics.io')
  .tag('<script src="https://c.lytics.io/api/tag/{{ cid }}/lio.js">');

/**
 * Options aliases.
 */

var aliases = {
  sessionTimeout: 'sessecs'
};

/**
 * Initialize.
 *
 * http://admin.lytics.io/doc#jstag
 *
 * @api public
 */

Lytics.prototype.initialize = function() {
  var options = alias(this.options, aliases);
  var self = this;
  /* eslint-disable */
  window.jstag = function(){function t(t){return function(){return t.apply(this,arguments),this}}function n(){var n=["ready"].concat(c.call(arguments));return t(function(){n.push(c.call(arguments)),this._q.push(n)})}var i={_q:[],_c:{},ts:(new Date).getTime(),ver:"2.0.0"},c=Array.prototype.slice;return i.init=function(t){return i._c=t,t.synchronous||i.loadtagmgr(t),this},i.loadtagmgr=function(t){var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=t.url+"/api/tag/"+t.cid+"/lio.js";var i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(n,i)},i.ready=n(),i.send=n("send"),i.mock=n("mock"),i.identify=n("identify"),i.pageView=n("pageView"),i.bind=t(function(t){i._q.push([t,c.call(arguments,1)])}),i.block=t(function(){i._c.blockload=!0}),i.unblock=t(function(){i._c.blockload=!1}),i}();
  /* eslint-enable */
  this.load(function() {
    window.jstag.init(options);
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Lytics.prototype.loaded = function() {
  return !!(window.jstag && window.jstag.bind);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Lytics.prototype.page = function(page) {
  window.jstag.send(this.options.stream, page.properties({
    name: '_e'
  }));
};

/**
 * Idenfity.
 *
 * @api public
 * @param {Identify} identify
 */

Lytics.prototype.identify = function(identify) {
  window.jstag.send(this.options.stream, identify.traits({
    id: 'user_id'
  }));
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Lytics.prototype.track = function(track) {
  var props = track.properties();
  props._e = track.event();
  window.jstag.send(this.options.stream, props);
};
