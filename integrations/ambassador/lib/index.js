'use strict';

/**
 * Module dependencies.
 */
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Ambassador` integration.
 */
var Ambassador = module.exports = integration('Ambassador')
  .global('mbsy')
  .option('uid', '')
  .option('campaigns', {})
  .tag('<script src="https://cdn.getambassador.com/us.js">')
  .mapping('events');

/**
 * Initialize.
 *
 * @api public
 */
Ambassador.prototype.initialize = function() {
  /* eslint-disable */
  (function (m,b,s,y) { m[b] = m[b] || {}; m[b].uid = s; m[b].methods = ['identify', 'track']; m[b].queue = []; m[b].factory = function(t) { return function() { var l = Array.prototype.slice.call(arguments); l.unshift(t); m[b].queue.push(l); return m[b].queue; };}; for (var t = 0; t < m[b].methods.length; t++) { y = m[b].methods[t]; m[b][y] = m[b].factory(y); }}.bind(this))(window, 'mbsy', this.options.uid);
  /* eslint-enable */

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */
Ambassador.prototype.loaded = function() {
  return !!window.mbsy;
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */
Ambassador.prototype.identify = function(identify) {
  // Check if there are allowed campaigns
  var allowedCampaigns = getAllowedCampaigns(this.options.campaigns);
  var id = identify.userId();
  var email = identify.email();
  var traits = identify.traits();

  delete traits.id;

  if (!(id || email)) return this.debug('user id or email is required');

  var args = [];
  if (id) args.push(id);
  args.push(traits);


  var opts = {};
  opts.identifyType = 'segment';
  args.push(opts);

  // Loop through campaigns and run identify for each one
  if (allowedCampaigns.length > 0) {
    for (var i = 0; i < allowedCampaigns.length; i++) {
      opts.campaign = allowedCampaigns[i];
      window.mbsy.identify.apply(this, args);
    }
  } else {
    window.mbsy.identify.apply(this, args);
  }
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */
Ambassador.prototype.track = function(track) {
  // Check if there are allowed campaigns
  var allowedCampaigns = getAllowedCampaigns(this.options.campaigns);
  if (!allowedCampaigns) return;

  var props = track.properties();
  var evt = track.event();
  var events = this.events(evt);

  // Check if event is mapped to a conversion
  if (events.indexOf('conversion') === -1) return;

  // Loop through allowed campaigns and run a conversion for each
  for (var i = 0; i < allowedCampaigns.length; i++) {
    props.campaign = allowedCampaigns[i];
    window.mbsy.track(evt, props, { conversion: true });
  }
};

/**
 * Builds a list of allowed campaigns based in the provided url
 *
 * @api private
 * @param {Object} allCampaigns
 * @param {String} url
 */
function getAllowedCampaigns(allCampaigns) {
  var allowedCampaigns = [];
  for (var c in allCampaigns) {
    if (isValidUrl(c)) {
      allowedCampaigns.push(allCampaigns[c]);
    }
  }

  return allowedCampaigns.length === 0 ? false : allowedCampaigns;
}

// Private: windowContext
// Allow passing in mock window object for testing
function windowLocationContext() {
  return window.mockLocation ? parseUrl(window.mockLocation) : window.location;
}

/**
 * Returns true if a location contains a hash
 *
 * @api private
 * @param {String} url
 */
function containsHash(locationObj) {
  return locationObj.hash && locationObj.href.indexOf('#') >= 0;
}

/**
 * Checks if the current url matches provided url string
 *
 * @api private
 * @param {String} url
 */
function isValidUrl(url) {
  // If url is not present, return false
  if (!url) {
    return false;
  }

  // Replace dot-like characters with standard period
  url = url.replace(/．/g, '.');

  // Add protocol to the parsed url if not added already
  url = url.substr(0, 4) === 'http' ? url : 'http://' + url;

  // Replace * with a complex phrase (all valid url characters), otherwise safari will not parse the url properly
  var wildcardPhrase = '--' + new Date().getTime() + '--';
  url = url.replace(/\*/g, wildcardPhrase);

  // This allows mixed case paths to be considered equal. Ex: /my-path, /My-Path and /MY-PATH are considered equal
  url = url.toLowerCase();

  // Get browersUrl and force to lower case
  var rawBrowserUrl = windowLocationContext().href.toLowerCase();

  // Get integration and browser url parts
  var providedUrlParts = parseUrl(url);
  var browserUrlParts = parseUrl(rawBrowserUrl);

  // Split hostname and pathname parts
  var providedHostnameParts = decodeURIComponent(providedUrlParts.hostname).split('.').filter(function(p) { return !!p; }).reverse();
  // Explanation -->             ^ decode hostname                               ^ split on .  ^ filter removes blank parts    ^ reverse array for proper comparison
  var providedPathnameParts = decodeURIComponent(providedUrlParts.pathname).split('/').filter(function(p) { return !!p; });
  // Explanation -->             ^ decode pathname                               ^ split on /  ^ filter removes blank parts
  var providedHashParts = decodeURIComponent(providedUrlParts.hash).replace(/[#!]+/g, '').split('/').filter(function(p) { return !!p; });
  // Explanation -->         ^ decode pathname                            ^ remove #  ^ split on /  ^ filter removes blank parts

  var browserHostnameParts = browserUrlParts.hostname.split('.').filter(function(p) { return !!p; }).reverse();
  // Explanation -->         ^ decode hostname       ^ split on .  ^ filter removes blank parts    ^ reverse array for proper comparison
  var browserPathnameParts = browserUrlParts.pathname.split('/').filter(function(p) { return !!p; });
  // Explanation -->         ^ decode pathname       ^ split on /  ^ filter removes blank parts
  var browserHashParts = browserUrlParts.hash.replace(/[#!]+/g, '').split('?')[0].split('/').filter(function(p) { return !!p; });
  // Explanation -->     ^ decode pathname    ^ remove #           ^split on ?   ^ split on /  ^ filter removes blank parts


  // Compare hostname parts
  // Hostname is compared in reverse (reversed above), that allows *.domain to match any number of subdomains before .domain
  for (var i = 0; i < providedHostnameParts.length; i++) {
    // We only compare when the parsed url is not a wildcard
    // If the hostname parts do not match -> no match
    if (providedHostnameParts[i] !== wildcardPhrase && providedHostnameParts[i] !== browserHostnameParts[i]) {
      return false;
    }
  }

  // Compare pathname parts
  // Pathname is compared incrementally, that allows /test/* to match any additional paths after /test/
  for (var x = 0; x < providedPathnameParts.length; x++) {
    // We only compare when the parsed url is not a wildcard
    // If the pathname parts do not match -> no match
    if (providedPathnameParts[x] !== wildcardPhrase && providedPathnameParts[x] !== browserPathnameParts[x]) {
      return false;
    }
  }

  // Compare hash parts
  // Hash is compared incrementally, that allows #!test/ to match any additional paths after #!test/
  // Hash will not be compared if the integration's parsed_url does not contain a hash
  if (containsHash(providedUrlParts)) {
    for (var y = 0; y < providedHashParts.length; y++) {
      // We only compare when the parsed url is not a wildcard
      // If the pathname parts do not match -> no match
      if (providedHashParts[y] !== wildcardPhrase && providedHashParts[y] !== browserHashParts[y] || !browserHashParts[y] && !containsHash(browserUrlParts)) {
        return false;
      }
    }
  }

  // If we are not on the homepage and the integration has no path parts, no match
  if (providedPathnameParts.length === 0 && browserPathnameParts.length > 0) {
    return false;
  }

  // Finally we return true if all above comparisons have passed
  return true;
}

/**
 * Parses a provided url into protocol, hostname, pathname, hash and search
 *
 * @api private
 * @param {String} url
 */
function parseUrl(url) {
  // Create anchor and set url, returns an object similar to window.location
  var urlAnchor = document.createElement('a');
  urlAnchor.href = url;

  var urlParts = {
    hash: urlAnchor.hash,
    href: urlAnchor.href,
    pathname: urlAnchor.pathname,
    port: urlAnchor.port,
    search: urlAnchor.search,
    hostname: urlAnchor.hostname,
    host: urlAnchor.host,
    origin: urlAnchor.origin,
    protocol: urlAnchor.protocol
  };

  // Fix for IE parsing root pathname without a /
  if (urlParts.pathname.substr(0, 1) !== '/') {
    urlParts.pathname = '/' + urlParts.pathname;
  }

  return urlParts;
}
