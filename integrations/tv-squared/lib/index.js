'use strict';

var integration = require('@segment/analytics.js-integration');
var useHttps = require('use-https');

/**
 * Expose `TvSquared` integration.
 */

var TvSquared = (module.exports = integration('TV Squared')
  // NOTE(ndhoule): `tv2track.js` introduces the JSON2 global
  .global('JSON2')
  .global('_tvq')
  .option('brandId', '')
  .option('hostname', '')
  .option('clientId', 0)
  .option('customMetrics', [])
  .option('trackWhitelist', [])
  .tag('<script src="{{ tvSquaredUrl }}/tv2track.js">'));

/**
 * Initialize TV Squared.
 *
 * @param {Facade} page
 *
 */

TvSquared.prototype.initialize = function() {
  window._tvq = window._tvq || [];
  var url = useHttps() ? 'https://' : 'http://';

  if (this.options.clientId) {
    url += 'collector-' + this.options.clientId + '.tvsquared.com';
  } else {
    url += this.options.hostname;
  }

  window._tvq.push(['setSiteId', this.options.brandId]);
  window._tvq.push(['setTrackerUrl', url + '/tv2track.php']);

  this.load({ tvSquaredUrl: url }, this.ready);
};

/**
 * Has the TV Squared library been loaded yet?
 *
 * @return {Boolean}
 */

TvSquared.prototype.loaded = function() {
  return !!window._tvq;
};

/**
 * Page
 *
 * @param {Facade} page
 */

TvSquared.prototype.page = function() {
  window._tvq.push(['trackPageView']);
};

/**
 * Track an event.
 *
 * @param {Facade} track
 */

TvSquared.prototype.track = function(track) {
  var event = track.event();

  // FIXME: Our Segment.com UI currently has a bug that will keep at least one empty string in an input array if it's activated, but then all deleted.
  // This parses empty inputs to avoid trying to send 'properties.' through track.proxy().
  var whitelist = this.options.trackWhitelist.slice();
  for (var i = 0; i < whitelist.length; i++) {
    if (whitelist[i] === '') {
      whitelist.splice(i, 1);
    }
  }

  // This should only run if there's a whitelist. If there's no whitelist, all events will be sent.
  for (i = 0; i < whitelist.length; i++) {
    // If there is a whitelist and we find the event, break out and continue.
    if (event.toUpperCase() === whitelist[i].toUpperCase()) break;
    // Otherwise, if we're at the last element, it's not in the whitelist. Return early.
    if (i === whitelist.length - 1) return;
  }

  var session = { user: track.userId() || track.anonymousId() || '' };
  var action = {
    // Without a standardized way to bubble up errors client-side, we'll fallback to empty strings for now so they end up in TVSquared.
    rev: track.revenue() || '',
    prod: track.proxy('properties.productType') || '',
    id: track.orderId() || '',
    promo: track.proxy('properties.promo') || ''
  };

  var cmArr = this.options.customMetrics.slice();
  // FIXME: Our Segment.com UI currently has a bug that will keep at least one empty string in an input array if it's activated, but then all deleted.
  // This parses empty inputs to avoid trying to send 'properties.' through track.proxy().
  for (i = 0; i < cmArr.length; i++) {
    if (cmArr[i] === '') {
      cmArr.splice(i, 1);
    }
  }
  if (cmArr.length) {
    // If the user has specified they want to use specific additional metrics, then we'll try to find them.
    for (var j = 0; j < cmArr.length; j++) {
      var key = cmArr[j];
      var value = track.proxy('properties.' + key);
      if (value) {
        action[key] = value;
      }
    }
  }

  window._tvq.push([
    function() {
      this.setCustomVariable(5, 'session', JSON.stringify(session), 'visit');
    }
  ]);
  window._tvq.push([
    function() {
      this.setCustomVariable(5, event, JSON.stringify(action), 'page');
    }
  ]);
  window._tvq.push(['trackPageView']);
};
