'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var each = require('@ndhoule/each');

/**
 * Expose `Quora Conversion Pixel` integration.
 */

var Quora = (module.exports = integration('Quora Conversion Pixel')
  .global('qp')
  .option('writeKey', '')
  .option('trackEvents', [])
  .mapping('events')
  .tag('<script src="https://a.quora.com/qevents.js"></script>'));

Quora.prototype.initialize = function() {
  // We require a write key to run this integration.
  if (!this.options.writeKey) return;

  (function () {if(window.qp) return; var n=window.qp=function(){n.qp?n.qp.apply(n,arguments):n.queue.push(arguments);}; n.queue=[];})() // eslint-disable-line

  this.load(this.ready);
  window.qp('init', this.options.writeKey);
  window.qp('track', 'ViewContent');
};

Quora.prototype.loaded = function() {
  return window.qp;
};

Quora.prototype.track = function(track) {
  each(function(e) {
    window.qp('track', e);
  }, this.events(track.event()));

  // Historically, Quora only supported a single kind of track event (Generic)
  // We allowed the user to map any number of events to that Generic type
  // We'll remove this after migrating existing `trackEvents` into `events` setting
  each(function(e) {
    if (e.toLowerCase() === track.event().toLowerCase()) {
      window.qp('track', 'Generic');
    }
  }, this.options.trackEvents);
};
