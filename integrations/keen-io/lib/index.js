'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var clone = require('@ndhoule/clone');

/**
 * Expose `Keen IO` integration.
 */

var Keen = module.exports = integration('Keen IO')
  .global('KeenSegment')
  .option('ipAddon', false)
  .option('projectId', '')
  .option('readKey', '')
  .option('referrerAddon', false)
  .option('trackAllPages', false)
  .option('trackCategorizedPages', true)
  .option('trackNamedPages', true)
  .option('uaAddon', false)
  .option('urlAddon', false)
  .option('writeKey', '')
  .tag('<script src="//d26b395fwzu5fz.cloudfront.net/3.4.0/{{ lib }}.min.js">');

/**
 * Initialize.
 *
 * https://keen.io/docs/
 *
 * @api public
 */

Keen.prototype.initialize = function() {
  var lib = this.options.readKey ? 'keen' : 'keen-tracker';
  var options = this.options;
  var previousKeen = window.Keen || null;
  var self = this;

  // Skip this step if keen-js@3.4.0 is already available
  if (!window.Keen || window.Keen.version !== '3.4.0') {
    // Force-undefine `Keen` (saved as `previousKeen`)
    window.Keen = undefined;
    /**
      * Shim out the Keen client library.
      *
      * To update the library, grab the most up-to-date embed code from Keen's
      * JS library readme (https://github.com/keen/keen-js) and remove any of the
      * script loading/appending business. Next, update the script tag above with
      * the new client library URL.
    */
    /* eslint-disable */
    !(function(a,b){if(void 0===b[a]){b["_"+a]={},b[a]=function(c){b["_"+a].clients=b["_"+a].clients||{},b["_"+a].clients[c.projectId]=this,this._config=c},b[a].ready=function(c){b["_"+a].ready=b["_"+a].ready||[],b["_"+a].ready.push(c)};for(var c=["addEvent","setGlobalProperties","trackExternalLink","on"],d=0;d<c.length;d++){var e=c[d],f=function(a){return function(){return this["_"+a]=this["_"+a]||[],this["_"+a].push(arguments),this}};b[a].prototype[e]=f(e)}}})("Keen",window);
    /* eslint-enable */
    // keen-js@3.4.0 will be installed once `.load()` is called
  }

  // Define a safe namespace (stub)
  window.KeenSegment = window.Keen;

  // Define client (stub)
  this.client = new window.KeenSegment({
    projectId: options.projectId,
    readKey: options.readKey,
    writeKey: options.writeKey
  });

  this.load({ lib: lib }, function() {
    // Redefine safe namespace with full library
    window.KeenSegment = window.Keen;
    // Restore original `Keen`
    if (previousKeen) {
      window.Keen = previousKeen;
      previousKeen = undefined;
    }
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Keen.prototype.loaded = function() {
  return !!(window.KeenSegment && window.KeenSegment.prototype.configure);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Keen.prototype.page = function(page) {
  var category = page.category();
  var name = page.fullName();
  var opts = this.options;

  // all pages
  if (opts.trackAllPages) {
    this.track(page.track());
  }

  // named pages
  if (name && opts.trackNamedPages) {
    this.track(page.track(name));
  }

  // categorized pages
  if (category && opts.trackCategorizedPages) {
    this.track(page.track(category));
  }
};

/**
 * Identify.
 *
 * TODO: migrate from old `userId` to simpler `id`
 * https://keen.io/docs/data-collection/data-enrichment/#add-ons
 *
 * Set up the Keen addons object. These must be specifically
 * enabled by the settings in order to include the plugins, or else
 * Keen will reject the request.
 *
 * @api public
 * @param {Identify} identify
 */

Keen.prototype.identify = function(identify) {
  var traits = identify.traits();
  var id = identify.userId();
  var user = {};
  if (id) user.userId = id;
  if (traits) user.traits = traits;
  var props = { user: user };
  this.addons(props, identify);
  this.client.setGlobalProperties(function() {
    // Clone the props so the Keen Client can't manipulate the ref
    return clone(props);
  });
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Keen.prototype.track = function(track) {
  var props = track.properties();
  this.addons(props, track);
  this.client.addEvent(track.event(), props);
};

/**
 * Attach addons to `obj` with `msg`.
 *
 * @api private
 * @param {Object} obj
 * @param {Facade} msg
 */

Keen.prototype.addons = function(obj, msg) {
  var options = this.options;
  var addons = [];

  if (options.ipAddon) {
    addons.push({
      name: 'keen:ip_to_geo',
      input: { ip: 'ip_address' },
      output: 'ip_geo_info'
    });
    obj.ip_address = '${keen.ip}';
  }

  if (options.uaAddon) {
    addons.push({
      name: 'keen:ua_parser',
      input: { ua_string: 'user_agent' },
      output: 'parsed_user_agent'
    });
    obj.user_agent = '${keen.user_agent}';
  }

  if (options.urlAddon) {
    addons.push({
      name: 'keen:url_parser',
      input: { url: 'page_url' },
      output: 'parsed_page_url'
    });
    obj.page_url = document.location.href;
  }

  if (options.referrerAddon) {
    addons.push({
      name: 'keen:referrer_parser',
      input: {
        referrer_url: 'referrer_url',
        page_url: 'page_url'
      },
      output: 'referrer_info'
    });
    obj.referrer_url = document.referrer;
    obj.page_url = document.location.href;
  }

  obj.keen = {
    timestamp: msg.timestamp(),
    addons: addons
  };
};
