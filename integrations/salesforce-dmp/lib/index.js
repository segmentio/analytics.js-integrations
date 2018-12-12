'use strict'

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration')

/**
 * Expose `Salesforce DMP` integration.
 */

var SalesforceDMP = module.exports = integration('Salesforce DMP')
  .option('confId', '')
  .option('trackFireEvents', [])
  .option('eventAttributeMap', {})
  .option('namespace', '')
  .tag('init', '<script src="//cdn.krxd.net/controltag/{{ confId }}.js">')
  .tag('usermatch', '<img src="https://beacon.krxd.net/usermatch.gif?partner=segment_io&partner_uid={{ userId }}">')

SalesforceDMP.prototype.initialize = function () {
  // We require a confid to run this integration.
  if (!this.options.confId) return
  if (this.options.useV2LogicClient) {
    this.identify = this.identifyV2
    this.page = this.pageV2
    this.track = this.trackV2
  }
  var self = this

  window.Krux||((window.Krux=function(){window.Krux.q.push(arguments)}).q=[]) //eslint-disable-line

  this.load('init', function () {
    self.ready()
  })
}

SalesforceDMP.prototype.loaded = function () {
  return !!(window.Krux && window.Krux.q && window.Krux.ns)
}

SalesforceDMP.prototype.identify = function (identify) {
  // Identify should prefer the userId, if it exists.
  var userId = identify.userId() || identify.anonymousId()
  this.load('usermatch', {userId: userId})
}

SalesforceDMP.prototype.page = function (page) {
  // Page should prefer the anonId, if it exists.
  var userId = page.anonymousId() || page.userId()
  this.load('usermatch', {userId: userId})
}

SalesforceDMP.prototype.track = function (track) {
  // Track allows the user to re-fire the Krux pixel on specific events, as well
  // as modify the Krux datalayer, if they so choose.
  if (!this.options.namespace) return

  // Initialize kruxDataLayer
  // Some customers manage this directly. Delete it between sessions if it doesn't pre-exist.
  var resetDataLayer = false

  if (!window.kruxDataLayer) {
    resetDataLayer = true
    window.kruxDataLayer = {}
  }

  // Verify that this event is one we want to fire on, if a whitelist exists.
  if (this.options.trackFireEvents.length) {
    for (var i = 0; i < this.options.trackFireEvents.length; i++) {
      var event = this.options.trackFireEvents[i]
      // Continue execution if we find the event in the list. Otherwise, bail out.
      if (event.toLowerCase() === track.event().toLowerCase()) break
      if (i === this.options.trackFireEvents.length - 1) return
    }
  }

  // Modify the dataLayer with any defined adjustments. It's okay if they choose to make none.
  for (var segmentProp in this.options.eventAttributeMap) {
    // { Segment Property -> Krux Property }
    var kruxKey = this.options.eventAttributeMap[segmentProp]
    var value = track.proxy('properties.' + segmentProp)
    if (value) window.kruxDataLayer[kruxKey] = value
  }

  // This re-fires the Krux tag with the given namespace without counting it as a new page view.
  // Namespace starts with 'ns:'
  var namespace = this.options.namespace
  if (namespace.length <= 3 || namespace.toLowerCase().slice(0, 3) !== 'ns:') namespace = 'ns:' + namespace

  // This re-fires the pixel.gif. It will silently fail if `namespace` does not match the namespace on the main Krux instance!
  window.Krux(namespace, 'page:load', function (err) {
    if (err) console.error(err)
    if (resetDataLayer) delete window.kruxDataLayer
  }, {pageView: false})
}

/**
 * `Salesforce DMP` V2 Logic.
 */

SalesforceDMP.prototype.identifyV2 = SalesforceDMP.prototype.trackV2 = function (msg) {
  if (!this.options.namespace) return
  var resetDataLayer
  var type = msg.type()

  if (type === 'track') {
    // Verify that this event is one we want to fire on, if a whitelist exists.
    if (this.options.trackFireEvents.length > 0) {
      for (var i = 0; i < this.options.trackFireEvents.length; i++) {
        var event = this.options.trackFireEvents[i]
        // Continue execution if we find the event in the list. Otherwise, bail out.
        if (event.toLowerCase() === msg.event().toLowerCase()) {
          // Create window.kruxDataLayer
          resetDataLayer = createDataLayer()
          break
        }
        if (i === this.options.trackFireEvents.length - 1) return
      }
    } else {
      // if no track events are mapped in settings, return early for 
      // efficiency: none of the following logic will send data to SFDMP
      return
    }

    // Modify the dataLayer with any defined adjustments. It's okay if they choose to make none.
    for (var segmentProp in this.options.eventAttributeMap) {
      // { Segment Property -> Krux Property }
      var kruxKey = this.options.eventAttributeMap[segmentProp]
      var value = msg.proxy('properties.' + segmentProp)
      if (value) window.kruxDataLayer[kruxKey] = value
    }

    for (segmentProp in this.options.contextTraitsMap) {
      // { Segment Context Property -> Krux Property }
      kruxKey = this.options.contextTraitsMap[segmentProp]
      value = msg.proxy('context.traits.' + segmentProp)
      if (value) window.kruxDataLayer[kruxKey] = value
    }
  } else {
    resetDataLayer = createDataLayer()
  }

  if (window.kruxDataLayer) {
    if (this.options.sendEventNames && !window.kruxDataLayer['event_name']) {
      var name
      if (type === 'track') {
        name = msg.event()
      } else {
        if (this.options.sendIdentifyAsEventName) {
          name = type
        }
      }
      if (name) window.kruxDataLayer['event_name'] = name
    }
  
    if (msg.userId()) window.kruxDataLayer['segmentio_user_id'] = msg.userId()
    if (msg.anonymousId()) window.kruxDataLayer['segmentio_anonymous_id'] = msg.anonymousId()
    if (msg.proxy('context.traits.crossDomainId')) window.kruxDataLayer['segmentio_xid'] = msg.proxy('context.traits.crossDomainId')
  }

  this.firePixel(resetDataLayer)
}

SalesforceDMP.prototype.pageV2 = function (page) {
  // Noop on page events because SFDMP's control tag auto-fires a call to the pixel endpoint on page load
}

SalesforceDMP.prototype.firePixel = function (resetDataLayer) {
  // This re-fires the Krux tag with the given namespace without counting it as a new page view.
  // Namespace starts with 'ns:'
  var namespace = this.options.namespace
  if (namespace.length <= 3 || namespace.toLowerCase().slice(0, 3) !== 'ns:') namespace = 'ns:' + namespace

  // This re-fires the pixel.gif. It will silently fail if `namespace` does not match the namespace on the main Krux instance!
  window.Krux(namespace, 'page:load', function (err) {
    if (err) console.error(err)
    if (resetDataLayer) delete window.kruxDataLayer
  }, {pageView: false})
}

/**
 * Initialize kruxDataLayer
 * Some customers manage this directly. Segment deletes it between sessions if it doesn't pre-exist.
 */

function createDataLayer () {
  if (!window.kruxDataLayer) {
    window.kruxDataLayer = {}
    return true
  }
  return false
}
