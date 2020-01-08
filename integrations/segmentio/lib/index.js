'use strict';

/**
 * Module dependencies.
 */

var ads = require('@segment/ad-params');
var clone = require('component-clone');
var cookie = require('component-cookie');
var extend = require('@ndhoule/extend');
var integration = require('@segment/analytics.js-integration');
var json = require('json3');
var keys = require('@ndhoule/keys');
var localstorage = require('yields-store');
var protocol = require('@segment/protocol');
var send = require('@segment/send-json');
var topDomain = require('@segment/top-domain');
var utm = require('@segment/utm-params');
var uuid = require('uuid').v4;
var Queue = require('@segment/localstorage-retry');

/**
 * Cookie options
 */

var cookieOptions = {
  // 1 year
  maxage: 31536000000,
  secure: false,
  path: '/'
};

/**
 * Segment messages can be a maximum of 32kb.
 */
var MAX_SIZE = 32 * 1000;

/**
 * Queue options
 *
 * Attempt with exponential backoff for upto 10 times.
 * Backoff periods are: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s (~2m), 256s (~4m),
 * 512s (~8.5m) and 1024s (~17m).
 */

var queueOptions = {
  maxRetryDelay: 360000, // max interval of 1hr. Added as a guard.
  minRetryDelay: 1000, // first attempt (1s)
  backoffFactor: 2,
  maxAttempts: 10,
  maxItems: 100
};

/**
 * Expose `Segment` integration.
 */

var Segment = (exports = module.exports = integration('Segment.io')
  .option('apiKey', '')
  .option('apiHost', 'api.segment.io/v1')
  .option('crossDomainIdServers', [])
  .option('deleteCrossDomainId', false)
  .option('saveCrossDomainIdInLocalStorage', true)
  .option('retryQueue', true)
  .option('addBundledMetadata', false)
  .option('unbundledIntegrations', []));

/**
 * Get the store.
 *
 * @return {Function}
 */

exports.storage = function() {
  return protocol() === 'file:' || protocol() === 'chrome-extension:'
    ? localstorage
    : cookie;
};

/**
 * Expose global for testing.
 */

exports.global = window;

/**
 * Send the given `obj` and `headers` to `url` with the specified `timeout` and
 * `fn(err, req)`. Exported for testing.
 *
 * @param {String} url
 * @param {Object} obj
 * @param {Object} headers
 * @param {long} timeout
 * @param {Function} fn
 * @api private
 */

exports.sendJsonWithTimeout = function(url, obj, headers, timeout, fn) {
  // only proceed with our new code path when cors is supported. this is
  // unlikely to happen in production, but we're being safe to preserve backward
  // compatibility.
  if (send.type !== 'xhr') {
    send(url, obj, headers, fn);
    return;
  }

  var req = new XMLHttpRequest();
  req.onerror = fn;
  req.onreadystatechange = done;

  req.open('POST', url, true);

  req.timeout = timeout;
  req.ontimeout = fn;

  // TODO: Remove this eslint disable
  // eslint-disable-next-line guard-for-in
  for (var k in headers) {
    req.setRequestHeader(k, headers[k]);
  }
  req.send(json.stringify(obj));

  function done() {
    if (req.readyState === 4) {
      // Fail on 429 and 5xx HTTP errors
      if (req.status === 429 || (req.status >= 500 && req.status < 600)) {
        fn(new Error('HTTP Error ' + req.status + ' (' + req.statusText + ')'));
      } else {
        fn(null, req);
      }
    }
  }
};

/**
 * Initialize.
 *
 * https://github.com/segmentio/segmentio/blob/master/modules/segmentjs/segment.js/v1/segment.js
 *
 * @api public
 */

Segment.prototype.initialize = function() {
  var self = this;

  if (this.options.retryQueue) {
    this._lsqueue = new Queue('segmentio', queueOptions, function(elem, done) {
      // apply sentAt at flush time and reset on each retry
      // so the tracking-api doesn't interpret a time skew
      var item = elem;
      item.msg.sentAt = new Date();

      // send with 10s timeout
      Segment.sendJsonWithTimeout(
        item.url,
        item.msg,
        item.headers,
        10 * 1000,
        function(err, res) {
          self.debug('sent %O, received %O', item.msg, [err, res]);
          if (err) return done(err);
          done(null, res);
        }
      );
    });

    this._lsqueue.start();
  }

  this.ready();

  this.analytics.on('invoke', function(msg) {
    var action = msg.action();
    var listener = 'on' + msg.action();
    self.debug('%s %o', action, msg);
    if (self[listener]) self[listener](msg);
    self.ready();
  });

  // Delete cross domain identifiers.
  this.deleteCrossDomainIdIfNeeded();

  // At this moment we intentionally do not want events to be queued while we retrieve the `crossDomainId`
  // so `.ready` will get called right away and we'll try to figure out `crossDomainId`
  // separately
  if (this.isCrossDomainAnalyticsEnabled()) {
    this.retrieveCrossDomainId();
  }
};

/**
 * Loaded.
 *
 * @api private
 * @return {boolean}
 */

Segment.prototype.loaded = function() {
  return true;
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Segment.prototype.onpage = function(page) {
  this.enqueue('/p', page.json());
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Segment.prototype.onidentify = function(identify) {
  this.enqueue('/i', identify.json());
};

/**
 * Group.
 *
 * @api public
 * @param {Group} group
 */

Segment.prototype.ongroup = function(group) {
  this.enqueue('/g', group.json());
};

/**
 * ontrack.
 *
 * TODO: Document this.
 *
 * @api private
 * @param {Track} track
 */

Segment.prototype.ontrack = function(track) {
  var json = track.json();
  // TODO: figure out why we need traits.
  delete json.traits;
  this.enqueue('/t', json);
};

/**
 * Alias.
 *
 * @api public
 * @param {Alias} alias
 */

Segment.prototype.onalias = function(alias) {
  var json = alias.json();
  var user = this.analytics.user();
  json.previousId =
    json.previousId || json.from || user.id() || user.anonymousId();
  json.userId = json.userId || json.to;
  delete json.from;
  delete json.to;
  this.enqueue('/a', json);
};

/**
 * Normalize the given `msg`.
 *
 * @api private
 * @param {Object} msg
 */

Segment.prototype.normalize = function(message) {
  var msg = message;
  this.debug('normalize %o', msg);
  var user = this.analytics.user();
  var global = exports.global;
  var query = global.location.search;
  var ctx = (msg.context = msg.context || msg.options || {});
  delete msg.options;
  msg.writeKey = this.options.apiKey;
  ctx.userAgent = navigator.userAgent;
  var locale = navigator.userLanguage || navigator.language;
  if (typeof ctx.locale === 'undefined' && typeof locale !== 'undefined') {
    ctx.locale = locale;
  }
  if (!ctx.library)
    ctx.library = { name: 'analytics.js', version: this.analytics.VERSION };
  if (this.isCrossDomainAnalyticsEnabled()) {
    var crossDomainId = this.getCachedCrossDomainId();
    if (crossDomainId) {
      if (!ctx.traits) {
        ctx.traits = { crossDomainId: crossDomainId };
      } else if (!ctx.traits.crossDomainId) {
        ctx.traits.crossDomainId = crossDomainId;
      }
    }
  }
  // if user provides campaign via context, do not overwrite with UTM qs param
  if (query && !ctx.campaign) {
    ctx.campaign = utm(query);
  }
  this.referrerId(query, ctx);
  msg.userId = msg.userId || user.id();
  msg.anonymousId = user.anonymousId();
  msg.sentAt = new Date();
  // Add _metadata.
  var failedInitializations = this.analytics.failedInitializations || [];
  if (failedInitializations.length > 0) {
    msg._metadata = { failedInitializations: failedInitializations };
  }
  if (this.options.addBundledMetadata) {
    var bundled = keys(this.analytics.Integrations);
    msg._metadata = msg._metadata || {};
    msg._metadata.bundled = bundled;
    msg._metadata.unbundled = this.options.unbundledIntegrations;
  }
  this.debug('normalized %o', msg);
  this.ampId(ctx);
  return msg;
};

/**
 * Add amp id if it exists.
 *
 * @param {Object} ctx
 */

Segment.prototype.ampId = function(ctx) {
  var ampId = this.cookie('segment_amp_id');
  if (ampId) ctx.amp = { id: ampId };
};

/**
 * Send `obj` to `path`.
 *
 * @api private
 * @param {string} path
 * @param {Object} obj
 * @param {Function} fn
 */

Segment.prototype.enqueue = function(path, message, fn) {
  var url = 'https://' + this.options.apiHost + path;
  var headers = { 'Content-Type': 'text/plain' };
  var msg = this.normalize(message);

  // Print a log statement when messages exceed the maximum size. In the future,
  // we may consider dropping this event on the client entirely.
  if (json.stringify(msg).length > MAX_SIZE) {
    this.debug('message must be less than 32kb %O', msg);
  }

  this.debug('enqueueing %O', msg);

  var self = this;
  if (this.options.retryQueue) {
    this._lsqueue.addItem({
      url: url,
      headers: headers,
      msg: msg
    });
  } else {
    send(url, msg, headers, function(err, res) {
      self.debug('sent %O, received %O', msg, [err, res]);
      if (fn) {
        if (err) return fn(err);
        fn(null, res);
      }
    });
  }
};

/**
 * Gets/sets cookies on the appropriate domain.
 *
 * @api private
 * @param {string} name
 * @param {*} val
 */

Segment.prototype.cookie = function(name, val) {
  var store = Segment.storage();
  if (arguments.length === 1) return store(name);
  var global = exports.global;
  var href = global.location.href;
  var domain = '.' + topDomain(href);
  if (domain === '.') domain = '';
  this.debug('store domain %s -> %s', href, domain);
  var opts = clone(cookieOptions);
  opts.domain = domain;
  this.debug('store %s, %s, %o', name, val, opts);
  store(name, val, opts);
  if (store(name)) return;
  delete opts.domain;
  this.debug('fallback store %s, %s, %o', name, val, opts);
  store(name, val, opts);
};

/**
 * Add referrerId to context.
 *
 * TODO: remove.
 *
 * @api private
 * @param {Object} query
 * @param {Object} ctx
 */

Segment.prototype.referrerId = function(query, ctx) {
  var stored = this.cookie('s:context.referrer');
  var ad;

  if (stored) stored = json.parse(stored);
  if (query) ad = ads(query);

  ad = ad || stored;

  if (!ad) return;
  ctx.referrer = extend(ctx.referrer || {}, ad);
  this.cookie('s:context.referrer', json.stringify(ad));
};

/**
 * isCrossDomainAnalyticsEnabled returns true if cross domain analytics is enabled.
 * This field is not directly supplied, so it is inferred by inspecting the
 * `crossDomainIdServers` array in settings. If this array is null or empty,
 * it is assumed that cross domain analytics is disabled.
 *
 * @api private
 */
Segment.prototype.isCrossDomainAnalyticsEnabled = function() {
  if (!this.options.crossDomainIdServers) {
    return false;
  }
  return this.options.crossDomainIdServers.length > 0;
};

/**
 * retrieveCrossDomainId.
 *
 * @api private
 * @param {function) callback => err, {crossDomainId, fromServer, timestamp}
 */
Segment.prototype.retrieveCrossDomainId = function(callback) {
  if (!this.isCrossDomainAnalyticsEnabled()) {
    // Callback is only provided in tests.
    if (callback) {
      callback('crossDomainId not enabled', null);
    }
    return;
  }

  var cachedCrossDomainId = this.getCachedCrossDomainId();
  if (cachedCrossDomainId) {
    // Callback is only provided in tests.
    if (callback) {
      callback(null, {
        crossDomainId: cachedCrossDomainId
      });
    }
    return;
  }

  var self = this;
  var writeKey = this.options.apiKey;

  // Exclude the current domain from the list of servers we're querying
  var currentTld = getTld(window.location.hostname);
  var domains = [];
  for (var i = 0; i < this.options.crossDomainIdServers.length; i++) {
    var domain = this.options.crossDomainIdServers[i];
    if (getTld(domain) !== currentTld) {
      domains.push(domain);
    }
  }

  getCrossDomainIdFromServerList(domains, writeKey, function(err, res) {
    if (err) {
      // Callback is only provided in tests.
      if (callback) {
        callback(err, null);
      }
      // We optimize for no conflicting xid as much as possible. So bail out if there is an
      // error and we cannot be sure that xid does not exist on any other domains.
      return;
    }

    var crossDomainId = null;
    var fromDomain = null;
    if (res) {
      crossDomainId = res.id;
      fromDomain = res.domain;
    } else {
      crossDomainId = uuid();
      fromDomain = window.location.hostname;
    }

    self.saveCrossDomainId(crossDomainId);
    self.analytics.identify({
      crossDomainId: crossDomainId
    });

    // Callback is only provided in tests.
    if (callback) {
      callback(null, {
        crossDomainId: crossDomainId,
        fromDomain: fromDomain
      });
    }
  });
};

/**
 * getCachedCrossDomainId returns the cross domain identifier stored on the client based on the `saveCrossDomainIdInLocalStorage` flag.
 * If `saveCrossDomainIdInLocalStorage` is false, it reads it from the `seg_xid` cookie.
 * If `saveCrossDomainIdInLocalStorage` is true, it reads it from the `seg_xid` key in localStorage.
 *
 * @return {string} crossDomainId
 */
Segment.prototype.getCachedCrossDomainId = function() {
  if (this.options.saveCrossDomainIdInLocalStorage) {
    return localstorage('seg_xid');
  }
  return this.cookie('seg_xid');
};

/**
 * saveCrossDomainId saves the cross domain identifier. The implementation differs based on the `saveCrossDomainIdInLocalStorage` flag.
 * If `saveCrossDomainIdInLocalStorage` is false, it saves it as the `seg_xid` cookie.
 * If `saveCrossDomainIdInLocalStorage` is true, it saves it to localStorage (so that it can be accessed on the current domain)
 * and as a httpOnly cookie (so that can it can be provided to other domains).
 *
 * @api private
 */
Segment.prototype.saveCrossDomainId = function(crossDomainId) {
  if (!this.options.saveCrossDomainIdInLocalStorage) {
    this.cookie('seg_xid', crossDomainId);
    return;
  }

  var self = this;

  // Save the cookie by making a request to the xid server for the current domain.
  var currentTld = getTld(window.location.hostname);
  for (var i = 0; i < this.options.crossDomainIdServers.length; i++) {
    var domain = this.options.crossDomainIdServers[i];
    if (getTld(domain) === currentTld) {
      var writeKey = this.options.apiKey;
      var url =
        'https://' +
        domain +
        '/v1/saveId?writeKey=' +
        writeKey +
        '&xid=' +
        crossDomainId;

      httpGet(url, function(err, res) {
        if (err) {
          self.debug('could not save id on %O, received %O', url, [err, res]);
          return;
        }

        localstorage('seg_xid', crossDomainId);
      });
      return;
    }
  }
};

/**
 * Deletes any state persisted by cross domain analytics.
 * * seg_xid (and metadata) from cookies
 * * seg_xid from localStorage
 * * crossDomainId from traits in localStorage
 *
 * The deletion logic is run only if deletion is enabled for this project, and only
 * deletes the data that actually exists.
 *
 * @api private
 */
Segment.prototype.deleteCrossDomainIdIfNeeded = function() {
  // Only continue if deletion is enabled for this project.
  if (!this.options.deleteCrossDomainId) {
    return;
  }

  // Delete the xid cookie if it exists. We also delete associated metadata.
  if (this.cookie('seg_xid')) {
    this.cookie('seg_xid', null);
    this.cookie('seg_xid_fd', null);
    this.cookie('seg_xid_ts', null);
  }

  // Delete the xid from localStorage if it exists.
  if (localstorage('seg_xid')) {
    localstorage('seg_xid', null);
  }

  // Delete the crossDomainId trait in localStorage if it exists.
  if (this.analytics.user().traits().crossDomainId) {
    // This intentionally uses an internal API, so that
    // we can avoid interacting with lower level localStorage APIs, and instead
    // leverage existing functionality inside analytics.js.

    var traits = this.analytics.user().traits();
    delete traits.crossDomainId;
    this.analytics.user()._setTraits(traits);
  }
};

/**
 * getCrossDomainIdFromServers
 * @param {Array} domains
 * @param {string} writeKey
 * @param {function} callback => err, {domain, id}
 */
function getCrossDomainIdFromServerList(domains, writeKey, callback) {
  // Should not happen but special case
  if (domains.length === 0) {
    callback(null, null);
  }
  var crossDomainIdFound = false;
  var finishedRequests = 0;
  var error = null;
  for (var i = 0; i < domains.length; i++) {
    var domain = domains[i];

    getCrossDomainIdFromSingleServer(domain, writeKey, function(err, res) {
      finishedRequests++;
      if (err) {
        // if request against a particular domain fails, we won't early exit
        // but rather wait and see if requests to other domains succeed
        error = err;
      } else if (res && res.id && !crossDomainIdFound) {
        // If we found an xid from any of the servers, we'll just early exit and callback
        crossDomainIdFound = true;
        callback(null, res);
      }
      if (finishedRequests === domains.length && !crossDomainIdFound) {
        // Error is non-null if we encountered an issue, otherwise error will be null
        // meaning that no domains in the list has an xid for current user
        callback(error, null);
      }
    });
  }
}

/**
 * getCrossDomainId
 * @param {Array} domain
 * @param {string} writeKey
 * @param {function} callback => err, {domain, id}
 */
function getCrossDomainIdFromSingleServer(domain, writeKey, callback) {
  var endpoint = 'https://' + domain + '/v1/id/' + writeKey;
  getJson(endpoint, function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, {
        domain: domain,
        id: (res && res.id) || null
      });
    }
  });
}

/**
 * getJson
 * @param {string} url
 * @param {function} callback => err, json
 */
function getJson(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.withCredentials = true;
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, xhr.responseText ? json.parse(xhr.responseText) : null);
      } else {
        callback(xhr.statusText || 'Unknown Error', null);
      }
    }
  };
  xhr.send();
}

/**
 * get makes a get request to the given URL.
 * @param {string} url
 * @param {function} callback => err, response
 */
function httpGet(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.withCredentials = true;
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, xhr.responseText);
      } else {
        callback(xhr.statusText || xhr.responseText || 'Unknown Error', null);
      }
    }
  };
  xhr.send();
}

/**
 * getTld
 * Get domain.com from subdomain.domain.com, etc.
 * @param {string} domain
 * @return {string} tld
 */
function getTld(domain) {
  return domain
    .split('.')
    .splice(-2)
    .join('.');
}
