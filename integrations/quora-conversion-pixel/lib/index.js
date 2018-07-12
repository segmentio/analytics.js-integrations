'use strict'

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration')

/**
 * Expose `Quora Conversion Pixel` integration.
 */

var Quora = module.exports = integration('Quora Conversion Pixel')
  .global('qp')
  .option('writeKey', '')
  .option('trackEvents', [])
  .tag('<script src="https://a.quora.com/qevents.js"></script>')

Quora.prototype.initialize = function () {
  // We require a write key to run this integration.
  if (!this.options.writeKey) return

  (function () {if(window.qp) return; var n=window.qp=function(){n.qp?n.qp.apply(n,arguments):n.queue.push(arguments);}; n.queue=[];})() // eslint-disable-line

  this.load(this.ready)
  window.qp('init', this.options.writeKey)
  window.qp('track', 'ViewContent')
}

Quora.prototype.loaded = function () {
  return window.qp
  //return !!(window.qp && window.qp.uuid)
}

Quora.prototype.track = function (track) {
  // Right now, Quora only supports a single kind of track event. If the user wants a specific event name to fire it, then do so.
  for (var i = 0; i < this.options.trackEvents.length; i++) {
    var currentPermittedEvent = this.options.trackEvents[i]
    if (currentPermittedEvent.toLowerCase() === track.event().toLowerCase()) {
      window.qp('track', 'Generic')
      return
    }
  }
}
