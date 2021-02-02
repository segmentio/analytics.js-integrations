'use strict'

var integration = require('@segment/analytics.js-integration')

var Asayer = module.exports = integration('asayer')
  .global('asayer')
  .option('projectId', null)
  .option('siteId', null) // Retain siteId for backwards compatibility.
  .option('obscureTextNumbers', false)
  .option('obscureTextEmails', false)
  .tag('<script src="https://static.asayer.io/tracker.js"></script>')

function positiveNumber (number) {
  number = Number(number)
  if (number === null || isNaN(number) || number === Infinity || number <= 0) {
    return
  }
  return number
}

Asayer.prototype.initialize = function () {
  var projectId = positiveNumber(this.options.projectId)
  if (!projectId) {
    // Fall back to siteId.
    projectId = positiveNumber(this.options.siteId)
  }
  if (!projectId) {
    console.warn('Asayer: wrong projectId option, not loading.')
    return
  }

  var r = window.asayer = [projectId, undefined, 28 | (+this.options.obscureTextEmails) | (+this.options.obscureTextNumbers << 1), [0]]
  r.start = function (v) { r.push([0]) }
  r.stop = function (v) { r.push([1]) }
  r.userID = function (id) { r.push([2, id]) }
  r.userAnonymousID = function (id) { r.push([3, id]) }
  r.metadata = function (k, v) { r.push([4, k, v]) }
  r.event = function (k, p) { r.push([5, k, p]) }
  r.active = function () { return false }
  r.sessionID = function () { }

  this.load(this.ready)
}

Asayer.prototype.identify = function (identify) {
  window.asayer.userAnonymousID(String(identify.anonymousId()))
  if (identify.userId()) {
    window.asayer.userID(String(identify.userId()))
  }
  var traits = identify.traits()
  for (var key in traits) {
    if (traits.hasOwnProperty(key)) {
      var value = traits[key]
      if (typeof value !== 'object' && value !== undefined) {
        window.asayer.metadata(key, value.toString())
      }
    }
  }
}

Asayer.prototype.track = function (track) {
  window.asayer.event(track.event(), track.properties())
}
