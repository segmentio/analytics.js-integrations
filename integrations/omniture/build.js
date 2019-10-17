/* eslint-disable */
(function outer(modules, cache, entries) {
  /**
   * Global
   */

  var global = (function() {
    return this;
  })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @api public
   */

  function require(name) {
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require) {
    var m = (cache[id] = { exports: {} });
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];
    var threw = true;

    try {
      fn.call(
        m.exports,
        function(req) {
          var dep = modules[id][1][req];
          return require(dep || req);
        },
        m,
        m.exports,
        outer,
        modules,
        cache,
        entries
      );
      threw = false;
    } finally {
      if (threw) {
        delete cache[id];
      } else if (name) {
        // expose as 'name'.
        cache[name] = cache[id];
      }
    }

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

  return require;
})(
  {
    1: [
      function(require, module, exports) {
        'use strict';

        require('./common.test.js');
        require('./v1.test.js');
        require('./v2.test.js');
      },
      { './common.test.js': 2, './v1.test.js': 3, './v2.test.js': 4 }
    ],
    2: [
      function(require, module, exports) {
        var Analytics = require('analytics.js-core').constructor;
        var integration = require('analytics.js-integration');
        var sandbox = require('clear-env');
        var tester = require('analytics.js-integration-tester');
        var Omniture = require('../lib/');

        describe('Omniture/common', function() {
          var analytics;
          var omniture;
          var options = {
            trackingServerUrl: 'segment.io',
            trackingServerSecureUrl: 'secure.segment.io',
            version: 1
          };

          beforeEach(function() {
            analytics = new Analytics();
            omniture = new Omniture(options);
            analytics.use(Omniture);
            analytics.use(tester);
            analytics.add(omniture);
          });

          afterEach(function() {
            analytics.restore();
            analytics.reset();
            omniture.reset();
            sandbox();
          });

          it('should have the right settings', function() {
            analytics.compare(
              Omniture,
              integration('Omniture')
                .global('s')
                .global('s_gi')
                .option('initialPage', true)
                .option('events', {})
                .option('eVars', {})
                .option('props', {})
                .option('hVars', {})
            );
          });

          describe('before loading', function() {
            beforeEach(function() {
              analytics.stub(omniture, 'load');
            });

            describe('#initialize', function() {
              it('should set `window.s_account`', function() {
                analytics.initialize();
                analytics.equal(window.s_account, options.reportSuiteId);
              });

              it('should preserve an existing `window.s_account`', function() {
                window.s_account = 'existing';
                analytics.initialize();
                analytics.equal(window.s_account, 'existing');
              });

              it('should load tag for v1 by default', function() {
                analytics.initialize();
                // TODO: is this the best way to test that a script loaded?
                analytics.called(omniture.load, '1');
                analytics.once('ready', function() {
                  analytics.assert(window.s_gi);
                });
              });

              it('should load right script tag for v2', function() {
                omniture.options.version = 2;
                analytics.initialize();
                // TODO: is this the best way to test that a script loaded?
                analytics.called(omniture.load, '2');
                analytics.once('ready', function() {
                  analytics.assert(window.s_gi);
                });
              });

              it('should extend the proper methods for v1 by default', function() {
                analytics.initialize();
                analytics.assert(omniture.__version === 1);
              });

              it('should extend the proper methods for v2', function() {
                omniture.options.version = 2;
                analytics.initialize();
                analytics.assert(omniture.__version === 2);
              });

              it('should set new fields on this.options based on sOptions', function() {
                analytics.initialize();
                analytics.equal(omniture.options.currencyCode, 'USD');
                analytics.equal(omniture.options.charSet, 'ISO-8859-1');
                analytics.equal(omniture.options.trackDownloadLinks, true);
                analytics.equal(omniture.options.trackExternalLinks, true);
                analytics.equal(omniture.options.trackInlineStats, true);
                analytics.equal(
                  omniture.options.linkDownloadFileTypes,
                  'exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx'
                );
                analytics.equal(omniture.options.linkLeaveQueryString, false);
                analytics.equal(omniture.options.linkTrackVars, 'None');
                analytics.equal(omniture.options.linkTrackEvents, 'None');
                analytics.equal(omniture.options.usePlugins, true);
              });
            });
          });

          describe('loading', function() {
            it('should load', function(done) {
              analytics.load(omniture, done);
            });
          });

          describe('after loading', function() {
            beforeEach(function(done) {
              analytics.once('ready', done);
              analytics.initialize();
            });

            describe('#initialize', function() {
              it('should set window.s.trackingServer', function() {
                analytics.equal(
                  window.s.trackingServer,
                  options.trackingServerUrl
                );
              });

              it('should set window.s.trackingServerSecure', function() {
                analytics.equal(
                  window.s.trackingServerSecure,
                  options.trackingServerSecureUrl
                );
              });
            });
          });
        });
      },
      {
        'analytics.js-core': 5,
        'analytics.js-integration': 6,
        'clear-env': 7,
        'analytics.js-integration-tester': 8,
        '../lib/': 9
      }
    ],
    5: [
      function(require, module, exports) {
        /**
         * Analytics.js
         *
         * (C) 2013 Segment.io Inc.
         */

        var Analytics = require('./analytics');

        /**
         * Expose the `analytics` singleton.
         */

        var analytics = (module.exports = exports = new Analytics());

        /**
         * Expose require
         */

        analytics.require = require;

        /**
         * Expose `VERSION`.
         */

        exports.VERSION = require('../bower.json').version;
      },
      { './analytics': 10, '../bower.json': 11 }
    ],
    10: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var _analytics = window.analytics;
        var Emitter = require('emitter');
        var Facade = require('facade');
        var after = require('after');
        var bindAll = require('bind-all');
        var callback = require('callback');
        var clone = require('clone');
        var cookie = require('./cookie');
        var debug = require('debug');
        var defaults = require('defaults');
        var each = require('each');
        var foldl = require('foldl');
        var group = require('./group');
        var is = require('is');
        var isMeta = require('is-meta');
        var keys = require('object').keys;
        var memory = require('./memory');
        var normalize = require('./normalize');
        var on = require('event').bind;
        var pageDefaults = require('./pageDefaults');
        var pick = require('pick');
        var prevent = require('prevent');
        var querystring = require('querystring');
        var size = require('object').length;
        var store = require('./store');
        var user = require('./user');
        var Alias = Facade.Alias;
        var Group = Facade.Group;
        var Identify = Facade.Identify;
        var Page = Facade.Page;
        var Track = Facade.Track;

        /**
         * Expose `Analytics`.
         */

        exports = module.exports = Analytics;

        /**
         * Expose storage.
         */

        exports.cookie = cookie;
        exports.store = store;
        exports.memory = memory;

        /**
         * Initialize a new `Analytics` instance.
         */

        function Analytics() {
          this._options({});
          this.Integrations = {};
          this._integrations = {};
          this._readied = false;
          this._timeout = 300;
          // XXX: BACKWARDS COMPATIBILITY
          this._user = user;
          this.log = debug('analytics.js');
          bindAll(this);

          var self = this;
          this.on('initialize', function(settings, options) {
            if (options.initialPageview) self.page();
            self._parseQuery(window.location.search);
          });
        }

        /**
         * Event Emitter.
         */

        Emitter(Analytics.prototype);

        /**
         * Use a `plugin`.
         *
         * @param {Function} plugin
         * @return {Analytics}
         */

        Analytics.prototype.use = function(plugin) {
          plugin(this);
          return this;
        };

        /**
         * Define a new `Integration`.
         *
         * @param {Function} Integration
         * @return {Analytics}
         */

        Analytics.prototype.addIntegration = function(Integration) {
          var name = Integration.prototype.name;
          if (!name)
            throw new TypeError('attempted to add an invalid integration');
          this.Integrations[name] = Integration;
          return this;
        };

        /**
         * Initialize with the given integration `settings` and `options`.
         *
         * Aliased to `init` for convenience.
         *
         * @param {Object} [settings={}]
         * @param {Object} [options={}]
         * @return {Analytics}
         */

        Analytics.prototype.init = Analytics.prototype.initialize = function(
          settings,
          options
        ) {
          settings = settings || {};
          options = options || {};

          this._options(options);
          this._readied = false;

          // clean unknown integrations from settings
          var self = this;
          each(settings, function(name) {
            var Integration = self.Integrations[name];
            if (!Integration) delete settings[name];
          });

          // add integrations
          each(settings, function(name, opts) {
            var Integration = self.Integrations[name];
            var integration = new Integration(clone(opts));
            self.log('initialize %o - %o', name, opts);
            self.add(integration);
          });

          var integrations = this._integrations;

          // load user now that options are set
          user.load();
          group.load();

          // make ready callback
          var ready = after(size(integrations), function() {
            self._readied = true;
            self.emit('ready');
          });

          // initialize integrations, passing ready
          each(integrations, function(name, integration) {
            if (
              options.initialPageview &&
              integration.options.initialPageview === false
            ) {
              integration.page = after(2, integration.page);
            }

            integration.analytics = self;
            integration.once('ready', ready);
            integration.initialize();
          });

          // backwards compat with angular plugin.
          // TODO: remove
          this.initialized = true;

          this.emit('initialize', settings, options);
          return this;
        };

        /**
         * Set the user's `id`.
         *
         * @param {Mixed} id
         */

        Analytics.prototype.setAnonymousId = function(id) {
          this.user().anonymousId(id);
          return this;
        };

        /**
         * Add an integration.
         *
         * @param {Integration} integration
         */

        Analytics.prototype.add = function(integration) {
          this._integrations[integration.name] = integration;
          return this;
        };

        /**
         * Identify a user by optional `id` and `traits`.
         *
         * @param {string} [id=user.id()] User ID.
         * @param {Object} [traits=null] User traits.
         * @param {Object} [options=null]
         * @param {Function} [fn]
         * @return {Analytics}
         */

        Analytics.prototype.identify = function(id, traits, options, fn) {
          // Argument reshuffling.
          /* eslint-disable no-unused-expressions, no-sequences */
          if (is.fn(options)) (fn = options), (options = null);
          if (is.fn(traits)) (fn = traits), (options = null), (traits = null);
          if (is.object(id))
            (options = traits), (traits = id), (id = user.id());
          /* eslint-enable no-unused-expressions, no-sequences */

          // clone traits before we manipulate so we don't do anything uncouth, and take
          // from `user` so that we carryover anonymous traits
          user.identify(id, traits);

          var msg = this.normalize({
            options: options,
            traits: user.traits(),
            userId: user.id()
          });

          this._invoke('identify', new Identify(msg));

          // emit
          this.emit('identify', id, traits, options);
          this._callback(fn);
          return this;
        };

        /**
         * Return the current user.
         *
         * @return {Object}
         */

        Analytics.prototype.user = function() {
          return user;
        };

        /**
         * Identify a group by optional `id` and `traits`. Or, if no arguments are
         * supplied, return the current group.
         *
         * @param {string} [id=group.id()] Group ID.
         * @param {Object} [traits=null] Group traits.
         * @param {Object} [options=null]
         * @param {Function} [fn]
         * @return {Analytics|Object}
         */

        Analytics.prototype.group = function(id, traits, options, fn) {
          /* eslint-disable no-unused-expressions, no-sequences */
          if (!arguments.length) return group;
          if (is.fn(options)) (fn = options), (options = null);
          if (is.fn(traits)) (fn = traits), (options = null), (traits = null);
          if (is.object(id))
            (options = traits), (traits = id), (id = group.id());
          /* eslint-enable no-unused-expressions, no-sequences */

          // grab from group again to make sure we're taking from the source
          group.identify(id, traits);

          var msg = this.normalize({
            options: options,
            traits: group.traits(),
            groupId: group.id()
          });

          this._invoke('group', new Group(msg));

          this.emit('group', id, traits, options);
          this._callback(fn);
          return this;
        };

        /**
         * Track an `event` that a user has triggered with optional `properties`.
         *
         * @param {string} event
         * @param {Object} [properties=null]
         * @param {Object} [options=null]
         * @param {Function} [fn]
         * @return {Analytics}
         */

        Analytics.prototype.track = function(event, properties, options, fn) {
          // Argument reshuffling.
          /* eslint-disable no-unused-expressions, no-sequences */
          if (is.fn(options)) (fn = options), (options = null);
          if (is.fn(properties))
            (fn = properties), (options = null), (properties = null);
          /* eslint-enable no-unused-expressions, no-sequences */

          // figure out if the event is archived.
          var plan = this.options.plan || {};
          var events = plan.track || {};

          // normalize
          var msg = this.normalize({
            properties: properties,
            options: options,
            event: event
          });

          // plan.
          plan = events[event];
          if (plan) {
            this.log('plan %o - %o', event, plan);
            if (plan.enabled === false) return this._callback(fn);
            defaults(msg.integrations, plan.integrations || {});
          }

          this._invoke('track', new Track(msg));

          this.emit('track', event, properties, options);
          this._callback(fn);
          return this;
        };

        /**
         * Helper method to track an outbound link that would normally navigate away
         * from the page before the analytics calls were sent.
         *
         * BACKWARDS COMPATIBILITY: aliased to `trackClick`.
         *
         * @param {Element|Array} links
         * @param {string|Function} event
         * @param {Object|Function} properties (optional)
         * @return {Analytics}
         */

        Analytics.prototype.trackClick = Analytics.prototype.trackLink = function(
          links,
          event,
          properties
        ) {
          if (!links) return this;
          // always arrays, handles jquery
          if (is.element(links)) links = [links];

          var self = this;
          each(links, function(el) {
            if (!is.element(el))
              throw new TypeError(
                'Must pass HTMLElement to `analytics.trackLink`.'
              );
            on(el, 'click', function(e) {
              var ev = is.fn(event) ? event(el) : event;
              var props = is.fn(properties) ? properties(el) : properties;
              var href =
                el.getAttribute('href') ||
                el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
                el.getAttribute('xlink:href');

              self.track(ev, props);

              if (href && el.target !== '_blank' && !isMeta(e)) {
                prevent(e);
                self._callback(function() {
                  window.location.href = href;
                });
              }
            });
          });

          return this;
        };

        /**
         * Helper method to track an outbound form that would normally navigate away
         * from the page before the analytics calls were sent.
         *
         * BACKWARDS COMPATIBILITY: aliased to `trackSubmit`.
         *
         * @param {Element|Array} forms
         * @param {string|Function} event
         * @param {Object|Function} properties (optional)
         * @return {Analytics}
         */

        Analytics.prototype.trackSubmit = Analytics.prototype.trackForm = function(
          forms,
          event,
          properties
        ) {
          if (!forms) return this;
          // always arrays, handles jquery
          if (is.element(forms)) forms = [forms];

          var self = this;
          each(forms, function(el) {
            if (!is.element(el))
              throw new TypeError(
                'Must pass HTMLElement to `analytics.trackForm`.'
              );
            function handler(e) {
              prevent(e);

              var ev = is.fn(event) ? event(el) : event;
              var props = is.fn(properties) ? properties(el) : properties;
              self.track(ev, props);

              self._callback(function() {
                el.submit();
              });
            }

            // Support the events happening through jQuery or Zepto instead of through
            // the normal DOM API, because `el.submit` doesn't bubble up events...
            var $ = window.jQuery || window.Zepto;
            if ($) {
              $(el).submit(handler);
            } else {
              on(el, 'submit', handler);
            }
          });

          return this;
        };

        /**
         * Trigger a pageview, labeling the current page with an optional `category`,
         * `name` and `properties`.
         *
         * @param {string} [category]
         * @param {string} [name]
         * @param {Object|string} [properties] (or path)
         * @param {Object} [options]
         * @param {Function} [fn]
         * @return {Analytics}
         */

        Analytics.prototype.page = function(
          category,
          name,
          properties,
          options,
          fn
        ) {
          // Argument reshuffling.
          /* eslint-disable no-unused-expressions, no-sequences */
          if (is.fn(options)) (fn = options), (options = null);
          if (is.fn(properties))
            (fn = properties), (options = properties = null);
          if (is.fn(name)) (fn = name), (options = properties = name = null);
          if (is.object(category))
            (options = name), (properties = category), (name = category = null);
          if (is.object(name))
            (options = properties), (properties = name), (name = null);
          if (is.string(category) && !is.string(name))
            (name = category), (category = null);
          /* eslint-enable no-unused-expressions, no-sequences */

          properties = clone(properties) || {};
          if (name) properties.name = name;
          if (category) properties.category = category;

          // Ensure properties has baseline spec properties.
          // TODO: Eventually move these entirely to `options.context.page`
          var defs = pageDefaults();
          defaults(properties, defs);

          // Mirror user overrides to `options.context.page` (but exclude custom properties)
          // (Any page defaults get applied in `this.normalize` for consistency.)
          // Weird, yeah--moving special props to `context.page` will fix this in the long term.
          var overrides = pick(keys(defs), properties);
          if (!is.empty(overrides)) {
            options = options || {};
            options.context = options.context || {};
            options.context.page = overrides;
          }

          var msg = this.normalize({
            properties: properties,
            category: category,
            options: options,
            name: name
          });

          this._invoke('page', new Page(msg));

          this.emit('page', category, name, properties, options);
          this._callback(fn);
          return this;
        };

        /**
         * FIXME: BACKWARDS COMPATIBILITY: convert an old `pageview` to a `page` call.
         *
         * @param {string} [url]
         * @return {Analytics}
         * @api private
         */

        Analytics.prototype.pageview = function(url) {
          var properties = {};
          if (url) properties.path = url;
          this.page(properties);
          return this;
        };

        /**
         * Merge two previously unassociated user identities.
         *
         * @param {string} to
         * @param {string} from (optional)
         * @param {Object} options (optional)
         * @param {Function} fn (optional)
         * @return {Analytics}
         */

        Analytics.prototype.alias = function(to, from, options, fn) {
          // Argument reshuffling.
          /* eslint-disable no-unused-expressions, no-sequences */
          if (is.fn(options)) (fn = options), (options = null);
          if (is.fn(from)) (fn = from), (options = null), (from = null);
          if (is.object(from)) (options = from), (from = null);
          /* eslint-enable no-unused-expressions, no-sequences */

          var msg = this.normalize({
            options: options,
            previousId: from,
            userId: to
          });

          this._invoke('alias', new Alias(msg));

          this.emit('alias', to, from, options);
          this._callback(fn);
          return this;
        };

        /**
         * Register a `fn` to be fired when all the analytics services are ready.
         *
         * @param {Function} fn
         * @return {Analytics}
         */

        Analytics.prototype.ready = function(fn) {
          if (is.fn(fn)) {
            if (this._readied) {
              callback.async(fn);
            } else {
              this.once('ready', fn);
            }
          }
          return this;
        };

        /**
         * Set the `timeout` (in milliseconds) used for callbacks.
         *
         * @param {Number} timeout
         */

        Analytics.prototype.timeout = function(timeout) {
          this._timeout = timeout;
        };

        /**
         * Enable or disable debug.
         *
         * @param {string|boolean} str
         */

        Analytics.prototype.debug = function(str) {
          if (!arguments.length || str) {
            debug.enable('analytics:' + (str || '*'));
          } else {
            debug.disable();
          }
        };

        /**
         * Apply options.
         *
         * @param {Object} options
         * @return {Analytics}
         * @api private
         */

        Analytics.prototype._options = function(options) {
          options = options || {};
          this.options = options;
          cookie.options(options.cookie);
          store.options(options.localStorage);
          user.options(options.user);
          group.options(options.group);
          return this;
        };

        /**
         * Callback a `fn` after our defined timeout period.
         *
         * @param {Function} fn
         * @return {Analytics}
         * @api private
         */

        Analytics.prototype._callback = function(fn) {
          callback.async(fn, this._timeout);
          return this;
        };

        /**
         * Call `method` with `facade` on all enabled integrations.
         *
         * @param {string} method
         * @param {Facade} facade
         * @return {Analytics}
         * @api private
         */

        Analytics.prototype._invoke = function(method, facade) {
          this.emit('invoke', facade);

          each(this._integrations, function(name, integration) {
            if (!facade.enabled(name)) return;
            integration.invoke.call(integration, method, facade);
          });

          return this;
        };

        /**
         * Push `args`.
         *
         * @param {Array} args
         * @api private
         */

        Analytics.prototype.push = function(args) {
          var method = args.shift();
          if (!this[method]) return;
          this[method].apply(this, args);
        };

        /**
         * Reset group and user traits and id's.
         *
         * @api public
         */

        Analytics.prototype.reset = function() {
          this.user().logout();
          this.group().logout();
        };

        /**
         * Parse the query string for callable methods.
         *
         * @param {String} query
         * @return {Analytics}
         * @api private
         */

        Analytics.prototype._parseQuery = function(query) {
          // Parse querystring to an object
          var q = querystring.parse(query);
          // Create traits and properties objects, populate from querysting params
          var traits = pickPrefix('ajs_trait_', q);
          var props = pickPrefix('ajs_prop_', q);
          // Trigger based on callable parameters in the URL
          if (q.ajs_uid) this.identify(q.ajs_uid, traits);
          if (q.ajs_event) this.track(q.ajs_event, props);
          if (q.ajs_aid) user.anonymousId(q.ajs_aid);
          return this;

          /**
           * Create a shallow copy of an input object containing only the properties
           * whose keys are specified by a prefix, stripped of that prefix
           *
           * @param {String} prefix
           * @param {Object} object
           * @return {Object}
           * @api private
           */

          function pickPrefix(prefix, object) {
            var length = prefix.length;
            var sub;
            return foldl(
              function(acc, val, key) {
                if (key.substr(0, length) === prefix) {
                  sub = key.substr(length);
                  acc[sub] = val;
                }
                return acc;
              },
              {},
              object
            );
          }
        };

        /**
         * Normalize the given `msg`.
         *
         * @param {Object} msg
         * @return {Object}
         */

        Analytics.prototype.normalize = function(msg) {
          msg = normalize(msg, keys(this._integrations));
          if (msg.anonymousId) user.anonymousId(msg.anonymousId);
          msg.anonymousId = user.anonymousId();

          // Ensure all outgoing requests include page data in their contexts.
          msg.context.page = defaults(msg.context.page || {}, pageDefaults());

          return msg;
        };

        /**
         * No conflict support.
         */

        Analytics.prototype.noConflict = function() {
          window.analytics = _analytics;
          return this;
        };
      },
      {
        emitter: 12,
        facade: 13,
        after: 14,
        'bind-all': 15,
        callback: 16,
        clone: 17,
        './cookie': 18,
        debug: 19,
        defaults: 20,
        each: 21,
        foldl: 22,
        './group': 23,
        is: 24,
        'is-meta': 25,
        object: 26,
        './memory': 27,
        './normalize': 28,
        event: 29,
        './pageDefaults': 30,
        pick: 31,
        prevent: 32,
        querystring: 33,
        './store': 34,
        './user': 35
      }
    ],
    12: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var index = require('indexof');

        /**
         * Expose `Emitter`.
         */

        module.exports = Emitter;

        /**
         * Initialize a new `Emitter`.
         *
         * @api public
         */

        function Emitter(obj) {
          if (obj) return mixin(obj);
        }

        /**
         * Mixin the emitter properties.
         *
         * @param {Object} obj
         * @return {Object}
         * @api private
         */

        function mixin(obj) {
          for (var key in Emitter.prototype) {
            obj[key] = Emitter.prototype[key];
          }
          return obj;
        }

        /**
         * Listen on the given `event` with `fn`.
         *
         * @param {String} event
         * @param {Function} fn
         * @return {Emitter}
         * @api public
         */

        Emitter.prototype.on = Emitter.prototype.addEventListener = function(
          event,
          fn
        ) {
          this._callbacks = this._callbacks || {};
          (this._callbacks[event] = this._callbacks[event] || []).push(fn);
          return this;
        };

        /**
         * Adds an `event` listener that will be invoked a single
         * time then automatically removed.
         *
         * @param {String} event
         * @param {Function} fn
         * @return {Emitter}
         * @api public
         */

        Emitter.prototype.once = function(event, fn) {
          var self = this;
          this._callbacks = this._callbacks || {};

          function on() {
            self.off(event, on);
            fn.apply(this, arguments);
          }

          fn._off = on;
          this.on(event, on);
          return this;
        };

        /**
         * Remove the given callback for `event` or all
         * registered callbacks.
         *
         * @param {String} event
         * @param {Function} fn
         * @return {Emitter}
         * @api public
         */

        Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(
          event,
          fn
        ) {
          this._callbacks = this._callbacks || {};

          // all
          if (arguments.length == 0) {
            this._callbacks = {};
            return this;
          }

          // specific event
          var callbacks = this._callbacks[event];
          if (!callbacks) return this;

          // remove all handlers
          if (arguments.length == 1) {
            delete this._callbacks[event];
            return this;
          }

          // remove specific handler
          var i = index(callbacks, fn._off || fn);
          if (~i) callbacks.splice(i, 1);
          return this;
        };

        /**
         * Emit `event` with the given args.
         *
         * @param {String} event
         * @param {Mixed} ...
         * @return {Emitter}
         */

        Emitter.prototype.emit = function(event) {
          this._callbacks = this._callbacks || {};
          var args = [].slice.call(arguments, 1);
          var callbacks = this._callbacks[event];

          if (callbacks) {
            callbacks = callbacks.slice(0);
            for (var i = 0, len = callbacks.length; i < len; ++i) {
              callbacks[i].apply(this, args);
            }
          }

          return this;
        };

        /**
         * Return array of callbacks for `event`.
         *
         * @param {String} event
         * @return {Array}
         * @api public
         */

        Emitter.prototype.listeners = function(event) {
          this._callbacks = this._callbacks || {};
          return this._callbacks[event] || [];
        };

        /**
         * Check if this emitter has `event` handlers.
         *
         * @param {String} event
         * @return {Boolean}
         * @api public
         */

        Emitter.prototype.hasListeners = function(event) {
          return !!this.listeners(event).length;
        };
      },
      { indexof: 36 }
    ],
    36: [
      function(require, module, exports) {
        module.exports = function(arr, obj) {
          if (arr.indexOf) return arr.indexOf(obj);
          for (var i = 0; i < arr.length; ++i) {
            if (arr[i] === obj) return i;
          }
          return -1;
        };
      },
      {}
    ],
    13: [
      function(require, module, exports) {
        var Facade = require('./facade');

        /**
         * Expose `Facade` facade.
         */

        module.exports = Facade;

        /**
         * Expose specific-method facades.
         */

        Facade.Alias = require('./alias');
        Facade.Group = require('./group');
        Facade.Identify = require('./identify');
        Facade.Track = require('./track');
        Facade.Page = require('./page');
        Facade.Screen = require('./screen');
      },
      {
        './facade': 37,
        './alias': 38,
        './group': 39,
        './identify': 40,
        './track': 41,
        './page': 42,
        './screen': 43
      }
    ],
    37: [
      function(require, module, exports) {
        var traverse = require('isodate-traverse');
        var isEnabled = require('./is-enabled');
        var clone = require('./utils').clone;
        var type = require('./utils').type;
        var address = require('./address');
        var objCase = require('obj-case');
        var newDate = require('new-date');

        /**
         * Expose `Facade`.
         */

        module.exports = Facade;

        /**
         * Initialize a new `Facade` with an `obj` of arguments.
         *
         * @param {Object} obj
         * @param {Object} opts
         */

        function Facade(obj, opts) {
          opts = opts || {};
          if (!('clone' in opts)) opts.clone = true;
          if (opts.clone) obj = clone(obj);
          if (!('traverse' in opts)) opts.traverse = true;
          if (!('timestamp' in obj)) obj.timestamp = new Date();
          else obj.timestamp = newDate(obj.timestamp);
          if (opts.traverse) traverse(obj);
          this.opts = opts;
          this.obj = obj;
        }

        /**
         * Mixin address traits.
         */

        address(Facade.prototype);

        /**
         * Return a proxy function for a `field` that will attempt to first use methods,
         * and fallback to accessing the underlying object directly. You can specify
         * deeply nested fields too like:
         *
         *   this.proxy('options.Librato');
         *
         * @param {String} field
         */

        Facade.prototype.proxy = function(field) {
          var fields = field.split('.');
          field = fields.shift();

          // Call a function at the beginning to take advantage of facaded fields
          var obj = this[field] || this.field(field);
          if (!obj) return obj;
          if (typeof obj === 'function') obj = obj.call(this) || {};
          if (fields.length === 0)
            return this.opts.clone ? transform(obj) : obj;

          obj = objCase(obj, fields.join('.'));
          return this.opts.clone ? transform(obj) : obj;
        };

        /**
         * Directly access a specific `field` from the underlying object, returning a
         * clone so outsiders don't mess with stuff.
         *
         * @param {String} field
         * @return {Mixed}
         */

        Facade.prototype.field = function(field) {
          var obj = this.obj[field];
          return this.opts.clone ? transform(obj) : obj;
        };

        /**
         * Utility method to always proxy a particular `field`. You can specify deeply
         * nested fields too like:
         *
         *   Facade.proxy('options.Librato');
         *
         * @param {String} field
         * @return {Function}
         */

        Facade.proxy = function(field) {
          return function() {
            return this.proxy(field);
          };
        };

        /**
         * Utility method to directly access a `field`.
         *
         * @param {String} field
         * @return {Function}
         */

        Facade.field = function(field) {
          return function() {
            return this.field(field);
          };
        };

        /**
         * Proxy multiple `path`.
         *
         * @param {String} path
         * @return {Array}
         */

        Facade.multi = function(path) {
          return function() {
            var multi = this.proxy(path + 's');
            if (type(multi) === 'array') return multi;
            var one = this.proxy(path);
            if (one) one = [this.opts.clone ? clone(one) : one];
            return one || [];
          };
        };

        /**
         * Proxy one `path`.
         *
         * @param {String} path
         * @return {Mixed}
         */

        Facade.one = function(path) {
          return function() {
            var one = this.proxy(path);
            if (one) return one;
            var multi = this.proxy(path + 's');
            if (type(multi) === 'array') return multi[0];
          };
        };

        /**
         * Get the basic json object of this facade.
         *
         * @return {Object}
         */

        Facade.prototype.json = function() {
          var ret = this.opts.clone ? clone(this.obj) : this.obj;
          if (this.type) ret.type = this.type();
          return ret;
        };

        /**
         * Get the options of a call (formerly called "context"). If you pass an
         * integration name, it will get the options for that specific integration, or
         * undefined if the integration is not enabled.
         *
         * @param {String} integration (optional)
         * @return {Object or Null}
         */

        Facade.prototype.options = function(integration) {
          var obj = this.obj.options || this.obj.context || {};
          var options = this.opts.clone ? clone(obj) : obj;
          if (!integration) return options;
          if (!this.enabled(integration)) return;
          var integrations = this.integrations();
          var value =
            integrations[integration] || objCase(integrations, integration);
          if (typeof value !== 'object')
            value = objCase(this.options(), integration);
          return typeof value === 'object' ? value : {};
        };

        Facade.prototype.context = Facade.prototype.options;

        /**
         * Check whether an integration is enabled.
         *
         * @param {String} integration
         * @return {Boolean}
         */

        Facade.prototype.enabled = function(integration) {
          var allEnabled = this.proxy('options.providers.all');
          if (typeof allEnabled !== 'boolean')
            allEnabled = this.proxy('options.all');
          if (typeof allEnabled !== 'boolean')
            allEnabled = this.proxy('integrations.all');
          if (typeof allEnabled !== 'boolean') allEnabled = true;

          var enabled = allEnabled && isEnabled(integration);
          var options = this.integrations();

          // If the integration is explicitly enabled or disabled, use that
          // First, check options.providers for backwards compatibility
          if (
            options.providers &&
            options.providers.hasOwnProperty(integration)
          ) {
            enabled = options.providers[integration];
          }

          // Next, check for the integration's existence in 'options' to enable it.
          // If the settings are a boolean, use that, otherwise it should be enabled.
          if (options.hasOwnProperty(integration)) {
            var settings = options[integration];
            if (typeof settings === 'boolean') {
              enabled = settings;
            } else {
              enabled = true;
            }
          }

          return !!enabled;
        };

        /**
         * Get all `integration` options.
         *
         * @param {String} integration
         * @return {Object}
         * @api private
         */

        Facade.prototype.integrations = function() {
          return (
            this.obj.integrations ||
            this.proxy('options.providers') ||
            this.options()
          );
        };

        /**
         * Check whether the user is active.
         *
         * @return {Boolean}
         */

        Facade.prototype.active = function() {
          var active = this.proxy('options.active');
          if (active === null || active === undefined) active = true;
          return active;
        };

        /**
         * Get `sessionId / anonymousId`.
         *
         * @return {Mixed}
         * @api public
         */

        Facade.prototype.anonymousId = function() {
          return this.field('anonymousId') || this.field('sessionId');
        };

        Facade.prototype.sessionId = Facade.prototype.anonymousId;

        /**
         * Get `groupId` from `context.groupId`.
         *
         * @return {String}
         * @api public
         */

        Facade.prototype.groupId = Facade.proxy('options.groupId');

        /**
         * Get the call's "super properties" which are just traits that have been
         * passed in as if from an identify call.
         *
         * @param {Object} aliases
         * @return {Object}
         */

        Facade.prototype.traits = function(aliases) {
          var ret = this.proxy('options.traits') || {};
          var id = this.userId();
          aliases = aliases || {};

          if (id) ret.id = id;

          for (var alias in aliases) {
            var value =
              this[alias] == null
                ? this.proxy('options.traits.' + alias)
                : this[alias]();
            if (value == null) continue;
            ret[aliases[alias]] = value;
            delete ret[alias];
          }

          return ret;
        };

        /**
         * Add a convenient way to get the library name and version
         */

        Facade.prototype.library = function() {
          var library = this.proxy('options.library');
          if (!library) return { name: 'unknown', version: null };
          if (typeof library === 'string')
            return { name: library, version: null };
          return library;
        };

        /**
         * Return the device information or an empty object
         *
         * @return {Object}
         */

        Facade.prototype.device = function() {
          var device = this.proxy('context.device');
          if (type(device) !== 'object') device = {};
          var library = this.library().name;
          if (device.type) return device;

          if (library.indexOf('ios') > -1) device.type = 'ios';
          if (library.indexOf('android') > -1) device.type = 'android';
          return device;
        };

        /**
         * Setup some basic proxies.
         */

        Facade.prototype.userAgent = Facade.proxy('context.userAgent');
        Facade.prototype.timezone = Facade.proxy('context.timezone');
        Facade.prototype.timestamp = Facade.field('timestamp');
        Facade.prototype.channel = Facade.field('channel');
        Facade.prototype.ip = Facade.proxy('context.ip');
        Facade.prototype.userId = Facade.field('userId');

        /**
         * Return the cloned and traversed object
         *
         * @param {Mixed} obj
         * @return {Mixed}
         */

        function transform(obj) {
          var cloned = clone(obj);
          return cloned;
        }
      },
      {
        'isodate-traverse': 44,
        './is-enabled': 45,
        './utils': 46,
        './address': 47,
        'obj-case': 48,
        'new-date': 49
      }
    ],
    44: [
      function(require, module, exports) {
        var is = require('is');
        var isodate = require('isodate');
        var each;

        try {
          each = require('each');
        } catch (err) {
          each = require('each-component');
        }

        /**
         * Expose `traverse`.
         */

        module.exports = traverse;

        /**
         * Traverse an object or array, and return a clone with all ISO strings parsed
         * into Date objects.
         *
         * @param {Object} obj
         * @return {Object}
         */

        function traverse(input, strict) {
          if (strict === undefined) strict = true;

          if (is.object(input)) return object(input, strict);
          if (is.array(input)) return array(input, strict);
          return input;
        }

        /**
         * Object traverser.
         *
         * @param {Object} obj
         * @param {Boolean} strict
         * @return {Object}
         */

        function object(obj, strict) {
          each(obj, function(key, val) {
            if (isodate.is(val, strict)) {
              obj[key] = isodate.parse(val);
            } else if (is.object(val) || is.array(val)) {
              traverse(val, strict);
            }
          });
          return obj;
        }

        /**
         * Array traverser.
         *
         * @param {Array} arr
         * @param {Boolean} strict
         * @return {Array}
         */

        function array(arr, strict) {
          each(arr, function(val, x) {
            if (is.object(val)) {
              traverse(val, strict);
            } else if (isodate.is(val, strict)) {
              arr[x] = isodate.parse(val);
            }
          });
          return arr;
        }
      },
      { is: 50, isodate: 51, each: 21 }
    ],
    50: [
      function(require, module, exports) {
        var isEmpty = require('is-empty');

        try {
          var typeOf = require('type');
        } catch (e) {
          var typeOf = require('component-type');
        }

        /**
         * Types.
         */

        var types = [
          'arguments',
          'array',
          'boolean',
          'date',
          'element',
          'function',
          'null',
          'number',
          'object',
          'regexp',
          'string',
          'undefined'
        ];

        /**
         * Expose type checkers.
         *
         * @param {Mixed} value
         * @return {Boolean}
         */

        for (var i = 0, type; (type = types[i]); i++)
          exports[type] = generate(type);

        /**
         * Add alias for `function` for old browsers.
         */

        exports.fn = exports.function;

        /**
         * Expose `empty` check.
         */

        exports.empty = isEmpty;

        /**
         * Expose `nan` check.
         */

        exports.nan = function(val) {
          return exports.number(val) && val != val;
        };

        /**
         * Generate a type checker.
         *
         * @param {String} type
         * @return {Function}
         */

        function generate(type) {
          return function(value) {
            return type === typeOf(value);
          };
        }
      },
      { 'is-empty': 52, type: 53, 'component-type': 53 }
    ],
    52: [
      function(require, module, exports) {
        /**
         * Expose `isEmpty`.
         */

        module.exports = isEmpty;

        /**
         * Has.
         */

        var has = Object.prototype.hasOwnProperty;

        /**
         * Test whether a value is "empty".
         *
         * @param {Mixed} val
         * @return {Boolean}
         */

        function isEmpty(val) {
          if (val == null) return true;
          if (typeof val === 'boolean') return false;
          if (typeof val === 'number') return val === 0;
          if (undefined !== val.length) return val.length === 0;
          for (var key in val) if (has.call(val, key)) return false;
          return true;
        }
      },
      {}
    ],
    53: [
      function(require, module, exports) {
        /**
         * toString ref.
         */

        var toString = Object.prototype.toString;

        /**
         * Return the type of `val`.
         *
         * @param {Mixed} val
         * @return {String}
         * @api public
         */

        module.exports = function(val) {
          switch (toString.call(val)) {
            case '[object Date]':
              return 'date';
            case '[object RegExp]':
              return 'regexp';
            case '[object Arguments]':
              return 'arguments';
            case '[object Array]':
              return 'array';
            case '[object Error]':
              return 'error';
          }

          if (val === null) return 'null';
          if (val === undefined) return 'undefined';
          if (val !== val) return 'nan';
          if (val && val.nodeType === 1) return 'element';

          if (isBuffer(val)) return 'buffer';

          val = val.valueOf
            ? val.valueOf()
            : Object.prototype.valueOf.apply(val);

          return typeof val;
        };

        // code borrowed from https://github.com/feross/is-buffer/blob/master/index.js
        function isBuffer(obj) {
          return !!(
            obj != null &&
            (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
              (obj.constructor &&
                typeof obj.constructor.isBuffer === 'function' &&
                obj.constructor.isBuffer(obj)))
          );
        }
      },
      {}
    ],
    51: [
      function(require, module, exports) {
        /**
         * Matcher, slightly modified from:
         *
         * https://github.com/csnover/js-iso8601/blob/lax/iso8601.js
         */

        var matcher = /^(\d{4})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/;

        /**
         * Convert an ISO date string to a date. Fallback to native `Date.parse`.
         *
         * https://github.com/csnover/js-iso8601/blob/lax/iso8601.js
         *
         * @param {String} iso
         * @return {Date}
         */

        exports.parse = function(iso) {
          var numericKeys = [1, 5, 6, 7, 11, 12];
          var arr = matcher.exec(iso);
          var offset = 0;

          // fallback to native parsing
          if (!arr) return new Date(iso);

          // remove undefined values
          for (var i = 0, val; (val = numericKeys[i]); i++) {
            arr[val] = parseInt(arr[val], 10) || 0;
          }

          // allow undefined days and months
          arr[2] = parseInt(arr[2], 10) || 1;
          arr[3] = parseInt(arr[3], 10) || 1;

          // month is 0-11
          arr[2]--;

          // allow abitrary sub-second precision
          arr[8] = arr[8] ? (arr[8] + '00').substring(0, 3) : 0;

          // apply timezone if one exists
          if (arr[4] == ' ') {
            offset = new Date().getTimezoneOffset();
          } else if (arr[9] !== 'Z' && arr[10]) {
            offset = arr[11] * 60 + arr[12];
            if (arr[10] == '+') offset = 0 - offset;
          }

          var millis = Date.UTC(
            arr[1],
            arr[2],
            arr[3],
            arr[5],
            arr[6] + offset,
            arr[7],
            arr[8]
          );
          return new Date(millis);
        };

        /**
         * Checks whether a `string` is an ISO date string. `strict` mode requires that
         * the date string at least have a year, month and date.
         *
         * @param {String} string
         * @param {Boolean} strict
         * @return {Boolean}
         */

        exports.is = function(string, strict) {
          if (strict && /^\d{4}-\d{2}-\d{2}/.test(string) === false)
            return false;
          return matcher.test(string);
        };
      },
      {}
    ],
    21: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var type = require('type');

        /**
         * HOP reference.
         */

        var has = Object.prototype.hasOwnProperty;

        /**
         * Iterate the given `obj` and invoke `fn(val, i)`.
         *
         * @param {String|Array|Object} obj
         * @param {Function} fn
         * @api public
         */

        module.exports = function(obj, fn) {
          switch (type(obj)) {
            case 'array':
              return array(obj, fn);
            case 'object':
              if (typeof obj.length === 'number') return array(obj, fn);
              return object(obj, fn);
            case 'string':
              return string(obj, fn);
          }
        };

        /**
         * Iterate string chars.
         *
         * @param {String} obj
         * @param {Function} fn
         * @api private
         */

        function string(obj, fn) {
          for (var i = 0; i < obj.length; ++i) {
            fn(obj.charAt(i), i);
          }
        }

        /**
         * Iterate object keys.
         *
         * @param {Object} obj
         * @param {Function} fn
         * @api private
         */

        function object(obj, fn) {
          for (var key in obj) {
            if (has.call(obj, key)) {
              fn(key, obj[key]);
            }
          }
        }

        /**
         * Iterate array-ish.
         *
         * @param {Array|Object} obj
         * @param {Function} fn
         * @api private
         */

        function array(obj, fn) {
          for (var i = 0; i < obj.length; ++i) {
            fn(obj[i], i);
          }
        }
      },
      { type: 53 }
    ],
    45: [
      function(require, module, exports) {
        /**
         * A few integrations are disabled by default. They must be explicitly
         * enabled by setting options[Provider] = true.
         */

        var disabled = {
          Salesforce: true
        };

        /**
         * Check whether an integration should be enabled by default.
         *
         * @param {string} integration
         * @return {boolean}
         */

        module.exports = function(integration) {
          return !disabled[integration];
        };
      },
      {}
    ],
    46: [
      function(require, module, exports) {
        /**
         * TODO: use component symlink, everywhere ?
         */

        try {
          exports.inherit = require('inherit');
          exports.clone = require('clone');
          exports.type = require('type');
        } catch (e) {
          exports.inherit = require('inherit-component');
          exports.clone = require('clone-component');
          exports.type = require('type-component');
        }
      },
      { inherit: 54, clone: 55, type: 53 }
    ],
    54: [
      function(require, module, exports) {
        module.exports = function(a, b) {
          var fn = function() {};
          fn.prototype = b.prototype;
          a.prototype = new fn();
          a.prototype.constructor = a;
        };
      },
      {}
    ],
    55: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var type;
        try {
          type = require('component-type');
        } catch (_) {
          type = require('type');
        }

        /**
         * Module exports.
         */

        module.exports = clone;

        /**
         * Clones objects.
         *
         * @param {Mixed} any object
         * @api public
         */

        function clone(obj) {
          switch (type(obj)) {
            case 'object':
              var copy = {};
              for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                  copy[key] = clone(obj[key]);
                }
              }
              return copy;

            case 'array':
              var copy = new Array(obj.length);
              for (var i = 0, l = obj.length; i < l; i++) {
                copy[i] = clone(obj[i]);
              }
              return copy;

            case 'regexp':
              // from millermedeiros/amd-utils - MIT
              var flags = '';
              flags += obj.multiline ? 'm' : '';
              flags += obj.global ? 'g' : '';
              flags += obj.ignoreCase ? 'i' : '';
              return new RegExp(obj.source, flags);

            case 'date':
              return new Date(obj.getTime());

            default:
              // string, number, boolean, …
              return obj;
          }
        }
      },
      { 'component-type': 53, type: 53 }
    ],
    47: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var get = require('obj-case');

        /**
         * Add address getters to `proto`.
         *
         * @param {Function} proto
         */

        module.exports = function(proto) {
          proto.zip = trait('postalCode', 'zip');
          proto.country = trait('country');
          proto.street = trait('street');
          proto.state = trait('state');
          proto.city = trait('city');
          proto.region = trait('region');

          function trait(a, b) {
            return function() {
              var traits = this.traits();
              var props = this.properties ? this.properties() : {};

              return (
                get(traits, 'address.' + a) ||
                get(traits, a) ||
                (b ? get(traits, 'address.' + b) : null) ||
                (b ? get(traits, b) : null) ||
                get(props, 'address.' + a) ||
                get(props, a) ||
                (b ? get(props, 'address.' + b) : null) ||
                (b ? get(props, b) : null)
              );
            };
          }
        };
      },
      { 'obj-case': 48 }
    ],
    48: [
      function(require, module, exports) {
        var identity = function(_) {
          return _;
        };

        /**
         * Module exports, export
         */

        module.exports = multiple(find);
        module.exports.find = module.exports;

        /**
         * Export the replacement function, return the modified object
         */

        module.exports.replace = function(obj, key, val, options) {
          multiple(replace).call(this, obj, key, val, options);
          return obj;
        };

        /**
         * Export the delete function, return the modified object
         */

        module.exports.del = function(obj, key, options) {
          multiple(del).call(this, obj, key, null, options);
          return obj;
        };

        /**
         * Compose applying the function to a nested key
         */

        function multiple(fn) {
          return function(obj, path, val, options) {
            var normalize =
              options && isFunction(options.normalizer)
                ? options.normalizer
                : defaultNormalize;
            path = normalize(path);

            var key;
            var finished = false;

            while (!finished) loop();

            function loop() {
              for (key in obj) {
                var normalizedKey = normalize(key);
                if (path.indexOf(normalizedKey) === 0) {
                  var temp = path.substr(normalizedKey.length);
                  if (temp.charAt(0) === '.' || temp.length === 0) {
                    path = temp.substr(1);
                    var child = obj[key];

                    // we're at the end and there is nothing.
                    if (child == null) {
                      finished = true;
                      return;
                    }

                    // we're at the end and there is something.
                    if (!path.length) {
                      finished = true;
                      return;
                    }

                    // step into child
                    obj = child;

                    // but we're done here
                    return;
                  }
                }
              }

              key = undefined;
              // if we found no matching properties
              // on the current object, there's no match.
              finished = true;
            }

            if (!key) return;
            if (obj == null) return obj;

            // the `obj` and `key` is one above the leaf object and key, so
            // start object: { a: { 'b.c': 10 } }
            // end object: { 'b.c': 10 }
            // end key: 'b.c'
            // this way, you can do `obj[key]` and get `10`.
            return fn(obj, key, val);
          };
        }

        /**
         * Find an object by its key
         *
         * find({ first_name : 'Calvin' }, 'firstName')
         */

        function find(obj, key) {
          if (obj.hasOwnProperty(key)) return obj[key];
        }

        /**
         * Delete a value for a given key
         *
         * del({ a : 'b', x : 'y' }, 'X' }) -> { a : 'b' }
         */

        function del(obj, key) {
          if (obj.hasOwnProperty(key)) delete obj[key];
          return obj;
        }

        /**
         * Replace an objects existing value with a new one
         *
         * replace({ a : 'b' }, 'a', 'c') -> { a : 'c' }
         */

        function replace(obj, key, val) {
          if (obj.hasOwnProperty(key)) obj[key] = val;
          return obj;
        }

        /**
         * Normalize a `dot.separated.path`.
         *
         * A.HELL(!*&#(!)O_WOR   LD.bar => ahelloworldbar
         *
         * @param {String} path
         * @return {String}
         */

        function defaultNormalize(path) {
          return path.replace(/[^a-zA-Z0-9\.]+/g, '').toLowerCase();
        }

        /**
         * Check if a value is a function.
         *
         * @param {*} val
         * @return {boolean} Returns `true` if `val` is a function, otherwise `false`.
         */

        function isFunction(val) {
          return typeof val === 'function';
        }
      },
      {}
    ],
    49: [
      function(require, module, exports) {
        var is = require('is');
        var isodate = require('isodate');
        var milliseconds = require('./milliseconds');
        var seconds = require('./seconds');

        /**
         * Returns a new Javascript Date object, allowing a variety of extra input types
         * over the native Date constructor.
         *
         * @param {Date|String|Number} val
         */

        module.exports = function newDate(val) {
          if (is.date(val)) return val;
          if (is.number(val)) return new Date(toMs(val));

          // date strings
          if (isodate.is(val)) return isodate.parse(val);
          if (milliseconds.is(val)) return milliseconds.parse(val);
          if (seconds.is(val)) return seconds.parse(val);

          // fallback to Date.parse
          return new Date(val);
        };

        /**
         * If the number passed val is seconds from the epoch, turn it into milliseconds.
         * Milliseconds would be greater than 31557600000 (December 31, 1970).
         *
         * @param {Number} num
         */

        function toMs(num) {
          if (num < 31557600000) return num * 1000;
          return num;
        }
      },
      { is: 56, isodate: 51, './milliseconds': 57, './seconds': 58 }
    ],
    56: [
      function(require, module, exports) {
        var isEmpty = require('is-empty');
        var typeOf = require('type');

        /**
         * Types.
         */

        var types = [
          'arguments',
          'array',
          'boolean',
          'date',
          'element',
          'function',
          'null',
          'number',
          'object',
          'regexp',
          'string',
          'undefined'
        ];

        /**
         * Expose type checkers.
         *
         * @param {Mixed} value
         * @return {Boolean}
         */

        for (var i = 0, type; (type = types[i]); i++)
          exports[type] = generate(type);

        /**
         * Add alias for `function` for old browsers.
         */

        exports.fn = exports.function;

        /**
         * Expose `empty` check.
         */

        exports.empty = isEmpty;

        /**
         * Expose `nan` check.
         */

        exports.nan = function(val) {
          return exports.number(val) && val != val;
        };

        /**
         * Generate a type checker.
         *
         * @param {String} type
         * @return {Function}
         */

        function generate(type) {
          return function(value) {
            return type === typeOf(value);
          };
        }
      },
      { 'is-empty': 52, type: 53 }
    ],
    57: [
      function(require, module, exports) {
        /**
         * Matcher.
         */

        var matcher = /\d{13}/;

        /**
         * Check whether a string is a millisecond date string.
         *
         * @param {String} string
         * @return {Boolean}
         */

        exports.is = function(string) {
          return matcher.test(string);
        };

        /**
         * Convert a millisecond string to a date.
         *
         * @param {String} millis
         * @return {Date}
         */

        exports.parse = function(millis) {
          millis = parseInt(millis, 10);
          return new Date(millis);
        };
      },
      {}
    ],
    58: [
      function(require, module, exports) {
        /**
         * Matcher.
         */

        var matcher = /\d{10}/;

        /**
         * Check whether a string is a second date string.
         *
         * @param {String} string
         * @return {Boolean}
         */

        exports.is = function(string) {
          return matcher.test(string);
        };

        /**
         * Convert a second string to a date.
         *
         * @param {String} seconds
         * @return {Date}
         */

        exports.parse = function(seconds) {
          var millis = parseInt(seconds, 10) * 1000;
          return new Date(millis);
        };
      },
      {}
    ],
    38: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var inherit = require('./utils').inherit;
        var Facade = require('./facade');

        /**
         * Expose `Alias` facade.
         */

        module.exports = Alias;

        /**
         * Initialize a new `Alias` facade with a `dictionary` of arguments.
         *
         * @param {Object} dictionary
         *   @property {String} from
         *   @property {String} to
         *   @property {Object} options
         * @param {Object} opts
         *   @property {Boolean|Undefined} clone
         */

        function Alias(dictionary, opts) {
          Facade.call(this, dictionary, opts);
        }

        /**
         * Inherit from `Facade`.
         */

        inherit(Alias, Facade);

        /**
         * Return type of facade.
         *
         * @return {String}
         */

        Alias.prototype.action = function() {
          return 'alias';
        };

        Alias.prototype.type = Alias.prototype.action;

        /**
         * Get `previousId`.
         *
         * @return {Mixed}
         * @api public
         */

        Alias.prototype.previousId = function() {
          return this.field('previousId') || this.field('from');
        };

        Alias.prototype.from = Alias.prototype.previousId;

        /**
         * Get `userId`.
         *
         * @return {String}
         * @api public
         */

        Alias.prototype.userId = function() {
          return this.field('userId') || this.field('to');
        };

        Alias.prototype.to = Alias.prototype.userId;
      },
      { './utils': 46, './facade': 37 }
    ],
    39: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var inherit = require('./utils').inherit;
        var isEmail = require('is-email');
        var newDate = require('new-date');
        var Facade = require('./facade');

        /**
         * Expose `Group` facade.
         */

        module.exports = Group;

        /**
         * Initialize a new `Group` facade with a `dictionary` of arguments.
         *
         * @param {Object} dictionary
         *   @param {String} userId
         *   @param {String} groupId
         *   @param {Object} properties
         *   @param {Object} options
         * @param {Object} opts
         *   @property {Boolean|Undefined} clone
         */

        function Group(dictionary, opts) {
          Facade.call(this, dictionary, opts);
        }

        /**
         * Inherit from `Facade`
         */

        inherit(Group, Facade);

        /**
         * Get the facade's action.
         */

        Group.prototype.action = function() {
          return 'group';
        };

        Group.prototype.type = Group.prototype.action;

        /**
         * Setup some basic proxies.
         */

        Group.prototype.groupId = Facade.field('groupId');

        /**
         * Get created or createdAt.
         *
         * @return {Date}
         */

        Group.prototype.created = function() {
          var created =
            this.proxy('traits.createdAt') ||
            this.proxy('traits.created') ||
            this.proxy('properties.createdAt') ||
            this.proxy('properties.created');

          if (created) return newDate(created);
        };

        /**
         * Get the group's email, falling back to the group ID if it's a valid email.
         *
         * @return {String}
         */

        Group.prototype.email = function() {
          var email = this.proxy('traits.email');
          if (email) return email;
          var groupId = this.groupId();
          if (isEmail(groupId)) return groupId;
        };

        /**
         * Get the group's traits.
         *
         * @param {Object} aliases
         * @return {Object}
         */

        Group.prototype.traits = function(aliases) {
          var ret = this.properties();
          var id = this.groupId();
          aliases = aliases || {};

          if (id) ret.id = id;

          for (var alias in aliases) {
            var value =
              this[alias] == null
                ? this.proxy('traits.' + alias)
                : this[alias]();
            if (value == null) continue;
            ret[aliases[alias]] = value;
            delete ret[alias];
          }

          return ret;
        };

        /**
         * Special traits.
         */

        Group.prototype.name = Facade.proxy('traits.name');
        Group.prototype.industry = Facade.proxy('traits.industry');
        Group.prototype.employees = Facade.proxy('traits.employees');

        /**
         * Get traits or properties.
         *
         * TODO: remove me
         *
         * @return {Object}
         */

        Group.prototype.properties = function() {
          return this.field('traits') || this.field('properties') || {};
        };
      },
      { './utils': 46, 'is-email': 59, 'new-date': 49, './facade': 37 }
    ],
    59: [
      function(require, module, exports) {
        /**
         * Expose `isEmail`.
         */

        module.exports = isEmail;

        /**
         * Email address matcher.
         */

        var matcher = /.+\@.+\..+/;

        /**
         * Loosely validate an email address.
         *
         * @param {String} string
         * @return {Boolean}
         */

        function isEmail(string) {
          return matcher.test(string);
        }
      },
      {}
    ],
    40: [
      function(require, module, exports) {
        var Facade = require('./facade');
        var isEmail = require('is-email');
        var newDate = require('new-date');
        var utils = require('./utils');
        var get = require('obj-case');
        var trim = require('trim');
        var inherit = utils.inherit;
        var type = utils.type;

        /**
         * Expose `Idenfity` facade.
         */

        module.exports = Identify;

        /**
         * Initialize a new `Identify` facade with a `dictionary` of arguments.
         *
         * @param {Object} dictionary
         *   @param {String} userId
         *   @param {String} sessionId
         *   @param {Object} traits
         *   @param {Object} options
         * @param {Object} opts
         *   @property {Boolean|Undefined} clone
         */

        function Identify(dictionary, opts) {
          Facade.call(this, dictionary, opts);
        }

        /**
         * Inherit from `Facade`.
         */

        inherit(Identify, Facade);

        /**
         * Get the facade's action.
         */

        Identify.prototype.action = function() {
          return 'identify';
        };

        Identify.prototype.type = Identify.prototype.action;

        /**
         * Get the user's traits.
         *
         * @param {Object} aliases
         * @return {Object}
         */

        Identify.prototype.traits = function(aliases) {
          var ret = this.field('traits') || {};
          var id = this.userId();
          aliases = aliases || {};

          if (id) ret.id = id;

          for (var alias in aliases) {
            var value =
              this[alias] == null
                ? this.proxy('traits.' + alias)
                : this[alias]();
            if (value == null) continue;
            ret[aliases[alias]] = value;
            if (alias !== aliases[alias]) delete ret[alias];
          }

          return ret;
        };

        /**
         * Get the user's email, falling back to their user ID if it's a valid email.
         *
         * @return {String}
         */

        Identify.prototype.email = function() {
          var email = this.proxy('traits.email');
          if (email) return email;

          var userId = this.userId();
          if (isEmail(userId)) return userId;
        };

        /**
         * Get the user's created date, optionally looking for `createdAt` since lots of
         * people do that instead.
         *
         * @return {Date or Undefined}
         */

        Identify.prototype.created = function() {
          var created =
            this.proxy('traits.created') || this.proxy('traits.createdAt');
          if (created) return newDate(created);
        };

        /**
         * Get the company created date.
         *
         * @return {Date or undefined}
         */

        Identify.prototype.companyCreated = function() {
          var created =
            this.proxy('traits.company.created') ||
            this.proxy('traits.company.createdAt');

          if (created) return newDate(created);
        };

        /**
         * Get the user's name, optionally combining a first and last name if that's all
         * that was provided.
         *
         * @return {string|undefined}
         */

        Identify.prototype.name = function() {
          var name = this.proxy('traits.name');
          if (typeof name === 'string') return trim(name);

          var firstName = this.firstName();
          var lastName = this.lastName();
          if (firstName && lastName) return trim(firstName + ' ' + lastName);
        };

        /**
         * Get the user's first name, optionally splitting it out of a single name if
         * that's all that was provided.
         *
         * @return {string|undefined}
         */

        Identify.prototype.firstName = function() {
          var firstName = this.proxy('traits.firstName');
          if (typeof firstName === 'string') return trim(firstName);

          var name = this.proxy('traits.name');
          if (typeof name === 'string') return trim(name).split(' ')[0];
        };

        /**
         * Get the user's last name, optionally splitting it out of a single name if
         * that's all that was provided.
         *
         * @return {string|undefined}
         */

        Identify.prototype.lastName = function() {
          var lastName = this.proxy('traits.lastName');
          if (typeof lastName === 'string') return trim(lastName);

          var name = this.proxy('traits.name');
          if (typeof name !== 'string') return;

          var space = trim(name).indexOf(' ');
          if (space === -1) return;

          return trim(name.substr(space + 1));
        };

        /**
         * Get the user's unique id.
         *
         * @return {String or undefined}
         */

        Identify.prototype.uid = function() {
          return this.userId() || this.username() || this.email();
        };

        /**
         * Get description.
         *
         * @return {String}
         */

        Identify.prototype.description = function() {
          return (
            this.proxy('traits.description') || this.proxy('traits.background')
          );
        };

        /**
         * Get the age.
         *
         * If the age is not explicitly set
         * the method will compute it from `.birthday()`
         * if possible.
         *
         * @return {Number}
         */

        Identify.prototype.age = function() {
          var date = this.birthday();
          var age = get(this.traits(), 'age');
          if (age != null) return age;
          if (type(date) !== 'date') return;
          var now = new Date();
          return now.getFullYear() - date.getFullYear();
        };

        /**
         * Get the avatar.
         *
         * .photoUrl needed because help-scout
         * implementation uses `.avatar || .photoUrl`.
         *
         * .avatarUrl needed because trakio uses it.
         *
         * @return {Mixed}
         */

        Identify.prototype.avatar = function() {
          var traits = this.traits();
          return (
            get(traits, 'avatar') ||
            get(traits, 'photoUrl') ||
            get(traits, 'avatarUrl')
          );
        };

        /**
         * Get the position.
         *
         * .jobTitle needed because some integrations use it.
         *
         * @return {Mixed}
         */

        Identify.prototype.position = function() {
          var traits = this.traits();
          return get(traits, 'position') || get(traits, 'jobTitle');
        };

        /**
         * Setup sme basic "special" trait proxies.
         */

        Identify.prototype.username = Facade.proxy('traits.username');
        Identify.prototype.website = Facade.one('traits.website');
        Identify.prototype.websites = Facade.multi('traits.website');
        Identify.prototype.phone = Facade.one('traits.phone');
        Identify.prototype.phones = Facade.multi('traits.phone');
        Identify.prototype.address = Facade.proxy('traits.address');
        Identify.prototype.gender = Facade.proxy('traits.gender');
        Identify.prototype.birthday = Facade.proxy('traits.birthday');
      },
      {
        './facade': 37,
        'is-email': 59,
        'new-date': 49,
        './utils': 46,
        'obj-case': 48,
        trim: 60
      }
    ],
    60: [
      function(require, module, exports) {
        exports = module.exports = trim;

        function trim(str) {
          if (str.trim) return str.trim();
          return str.replace(/^\s*|\s*$/g, '');
        }

        exports.left = function(str) {
          if (str.trimLeft) return str.trimLeft();
          return str.replace(/^\s*/, '');
        };

        exports.right = function(str) {
          if (str.trimRight) return str.trimRight();
          return str.replace(/\s*$/, '');
        };
      },
      {}
    ],
    41: [
      function(require, module, exports) {
        var inherit = require('./utils').inherit;
        var type = require('./utils').type;
        var Facade = require('./facade');
        var Identify = require('./identify');
        var isEmail = require('is-email');
        var get = require('obj-case');

        /**
         * Expose `Track` facade.
         */

        module.exports = Track;

        /**
         * Initialize a new `Track` facade with a `dictionary` of arguments.
         *
         * @param {object} dictionary
         *   @property {string} event
         *   @property {string} userId
         *   @property {string} sessionId
         *   @property {Object} properties
         *   @property {Object} options
         * @param {Object} opts
         *   @property {boolean|undefined} clone
         */

        function Track(dictionary, opts) {
          Facade.call(this, dictionary, opts);
        }

        /**
         * Inherit from `Facade`.
         */

        inherit(Track, Facade);

        /**
         * Return the facade's action.
         *
         * @return {string}
         */

        Track.prototype.action = function() {
          return 'track';
        };

        Track.prototype.type = Track.prototype.action;

        /**
         * Setup some basic proxies.
         */

        Track.prototype.event = Facade.field('event');
        Track.prototype.value = Facade.proxy('properties.value');

        /**
         * Misc
         */

        Track.prototype.category = Facade.proxy('properties.category');

        /**
         * Ecommerce
         */

        Track.prototype.id = Facade.proxy('properties.id');
        Track.prototype.sku = Facade.proxy('properties.sku');
        Track.prototype.tax = Facade.proxy('properties.tax');
        Track.prototype.name = Facade.proxy('properties.name');
        Track.prototype.price = Facade.proxy('properties.price');
        Track.prototype.total = Facade.proxy('properties.total');
        Track.prototype.repeat = Facade.proxy('properties.repeat');
        Track.prototype.coupon = Facade.proxy('properties.coupon');
        Track.prototype.shipping = Facade.proxy('properties.shipping');
        Track.prototype.discount = Facade.proxy('properties.discount');

        /**
         * Description
         */

        Track.prototype.description = Facade.proxy('properties.description');

        /**
         * Plan
         */

        Track.prototype.plan = Facade.proxy('properties.plan');

        /**
         * Order id.
         *
         * @return {string}
         */

        Track.prototype.orderId = function() {
          return (
            this.proxy('properties.id') || this.proxy('properties.orderId')
          );
        };

        /**
         * Get subtotal.
         *
         * @return {number}
         */

        Track.prototype.subtotal = function() {
          var subtotal = get(this.properties(), 'subtotal');
          var total = this.total();

          if (subtotal) return subtotal;
          if (!total) return 0;

          var n = this.tax();
          if (n) total -= n;
          n = this.shipping();
          if (n) total -= n;
          n = this.discount();
          if (n) total += n;

          return total;
        };

        /**
         * Get products.
         *
         * @return {Array}
         */

        Track.prototype.products = function() {
          var props = this.properties();
          var products = get(props, 'products');
          return type(products) === 'array' ? products : [];
        };

        /**
         * Get quantity.
         *
         * @return {number}
         */

        Track.prototype.quantity = function() {
          var props = this.obj.properties || {};
          return props.quantity || 1;
        };

        /**
         * Get currency.
         *
         * @return {string}
         */

        Track.prototype.currency = function() {
          var props = this.obj.properties || {};
          return props.currency || 'USD';
        };

        /**
         * BACKWARDS COMPATIBILITY: should probably re-examine where these come from.
         */

        Track.prototype.referrer = function() {
          return (
            this.proxy('context.referrer.url') ||
            this.proxy('context.page.referrer') ||
            this.proxy('properties.referrer')
          );
        };

        Track.prototype.query = Facade.proxy('options.query');

        /**
         * Get the call's properties.
         *
         * @param {Object} aliases
         * @return {Object}
         */

        Track.prototype.properties = function(aliases) {
          var ret = this.field('properties') || {};
          aliases = aliases || {};

          for (var alias in aliases) {
            var value =
              this[alias] == null
                ? this.proxy('properties.' + alias)
                : this[alias]();
            if (value == null) continue;
            ret[aliases[alias]] = value;
            delete ret[alias];
          }

          return ret;
        };

        /**
         * Get the call's username.
         *
         * @return {string|undefined}
         */

        Track.prototype.username = function() {
          return (
            this.proxy('traits.username') ||
            this.proxy('properties.username') ||
            this.userId() ||
            this.sessionId()
          );
        };

        /**
         * Get the call's email, using an the user ID if it's a valid email.
         *
         * @return {string|undefined}
         */

        Track.prototype.email = function() {
          var email =
            this.proxy('traits.email') ||
            this.proxy('properties.email') ||
            this.proxy('options.traits.email');
          if (email) return email;

          var userId = this.userId();
          if (isEmail(userId)) return userId;
        };

        /**
         * Get the call's revenue, parsing it from a string with an optional leading
         * dollar sign.
         *
         * For products/services that don't have shipping and are not directly taxed,
         * they only care about tracking `revenue`. These are things like
         * SaaS companies, who sell monthly subscriptions. The subscriptions aren't
         * taxed directly, and since it's a digital product, it has no shipping.
         *
         * The only case where there's a difference between `revenue` and `total`
         * (in the context of analytics) is on ecommerce platforms, where they want
         * the `revenue` function to actually return the `total` (which includes
         * tax and shipping, total = subtotal + tax + shipping). This is probably
         * because on their backend they assume tax and shipping has been applied to
         * the value, and so can get the revenue on their own.
         *
         * @return {number}
         */

        Track.prototype.revenue = function() {
          var revenue = this.proxy('properties.revenue');
          var event = this.event();

          // it's always revenue, unless it's called during an order completion.
          if (!revenue && event && event.match(/completed ?order/i)) {
            revenue = this.proxy('properties.total');
          }

          return currency(revenue);
        };

        /**
         * Get cents.
         *
         * @return {number}
         */

        Track.prototype.cents = function() {
          var revenue = this.revenue();
          return typeof revenue !== 'number'
            ? this.value() || 0
            : revenue * 100;
        };

        /**
         * A utility to turn the pieces of a track call into an identify. Used for
         * integrations with super properties or rate limits.
         *
         * TODO: remove me.
         *
         * @return {Facade}
         */

        Track.prototype.identify = function() {
          var json = this.json();
          json.traits = this.traits();
          return new Identify(json, this.opts);
        };

        /**
         * Get float from currency value.
         *
         * @param {Mixed} val
         * @return {number}
         */

        function currency(val) {
          if (!val) return;
          if (typeof val === 'number') return val;
          if (typeof val !== 'string') return;

          val = val.replace(/\$/g, '');
          val = parseFloat(val);

          if (!isNaN(val)) return val;
        }
      },
      {
        './utils': 46,
        './facade': 37,
        './identify': 40,
        'is-email': 59,
        'obj-case': 48
      }
    ],
    42: [
      function(require, module, exports) {
        var inherit = require('./utils').inherit;
        var Facade = require('./facade');
        var Track = require('./track');
        var isEmail = require('is-email');

        /**
         * Expose `Page` facade
         */

        module.exports = Page;

        /**
         * Initialize new `Page` facade with `dictionary`.
         *
         * @param {Object} dictionary
         *   @param {String} category
         *   @param {String} name
         *   @param {Object} traits
         *   @param {Object} options
         * @param {Object} opts
         *   @property {Boolean|Undefined} clone
         */

        function Page(dictionary, opts) {
          Facade.call(this, dictionary, opts);
        }

        /**
         * Inherit from `Facade`
         */

        inherit(Page, Facade);

        /**
         * Get the facade's action.
         *
         * @return {String}
         */

        Page.prototype.action = function() {
          return 'page';
        };

        Page.prototype.type = Page.prototype.action;

        /**
         * Fields
         */

        Page.prototype.category = Facade.field('category');
        Page.prototype.name = Facade.field('name');

        /**
         * Proxies.
         */

        Page.prototype.title = Facade.proxy('properties.title');
        Page.prototype.path = Facade.proxy('properties.path');
        Page.prototype.url = Facade.proxy('properties.url');

        /**
         * Referrer.
         */

        Page.prototype.referrer = function() {
          return (
            this.proxy('context.referrer.url') ||
            this.proxy('context.page.referrer') ||
            this.proxy('properties.referrer')
          );
        };

        /**
         * Get the page properties mixing `category` and `name`.
         *
         * @param {Object} aliases
         * @return {Object}
         */

        Page.prototype.properties = function(aliases) {
          var props = this.field('properties') || {};
          var category = this.category();
          var name = this.name();
          aliases = aliases || {};

          if (category) props.category = category;
          if (name) props.name = name;

          for (var alias in aliases) {
            var value =
              this[alias] == null
                ? this.proxy('properties.' + alias)
                : this[alias]();
            if (value == null) continue;
            props[aliases[alias]] = value;
            if (alias !== aliases[alias]) delete props[alias];
          }

          return props;
        };

        /**
         * Get the user's email, falling back to their user ID if it's a valid email.
         *
         * @return {String}
         */

        Page.prototype.email = function() {
          var email =
            this.proxy('context.traits.email') ||
            this.proxy('properties.email');
          if (email) return email;

          var userId = this.userId();
          if (isEmail(userId)) return userId;
        };

        /**
         * Get the page fullName.
         *
         * @return {String}
         */

        Page.prototype.fullName = function() {
          var category = this.category();
          var name = this.name();
          return name && category ? category + ' ' + name : name;
        };

        /**
         * Get event with `name`.
         *
         * @return {String}
         */

        Page.prototype.event = function(name) {
          return name ? 'Viewed ' + name + ' Page' : 'Loaded a Page';
        };

        /**
         * Convert this Page to a Track facade with `name`.
         *
         * @param {String} name
         * @return {Track}
         */

        Page.prototype.track = function(name) {
          var json = this.json();
          json.event = this.event(name);
          json.timestamp = this.timestamp();
          json.properties = this.properties();
          return new Track(json, this.opts);
        };
      },
      { './utils': 46, './facade': 37, './track': 41, 'is-email': 59 }
    ],
    43: [
      function(require, module, exports) {
        var inherit = require('./utils').inherit;
        var Page = require('./page');
        var Track = require('./track');

        /**
         * Expose `Screen` facade
         */

        module.exports = Screen;

        /**
         * Initialize new `Screen` facade with `dictionary`.
         *
         * @param {Object} dictionary
         *   @param {string} category
         *   @param {string} name
         *   @param {Object} traits
         *   @param {Object} options
         * @param {Object} opts
         *   @property {boolean|undefined} clone
         */

        function Screen(dictionary, opts) {
          Page.call(this, dictionary, opts);
        }

        /**
         * Inherit from `Page`
         */

        inherit(Screen, Page);

        /**
         * Get the facade's action.
         *
         * @return {string}
         * @api public
         */

        Screen.prototype.action = function() {
          return 'screen';
        };

        Screen.prototype.type = Screen.prototype.action;

        /**
         * Get event with `name`.
         *
         * @param {string} name
         * @return {string}
         * @api public
         */

        Screen.prototype.event = function(name) {
          return name ? 'Viewed ' + name + ' Screen' : 'Loaded a Screen';
        };

        /**
         * Convert this Screen.
         *
         * @param {string} name
         * @return {Track}
         * @api public
         */

        Screen.prototype.track = function(name) {
          var json = this.json();
          json.event = this.event(name);
          json.timestamp = this.timestamp();
          json.properties = this.properties();
          return new Track(json, this.opts);
        };
      },
      { './utils': 46, './page': 42, './track': 41 }
    ],
    14: [
      function(require, module, exports) {
        module.exports = function after(times, func) {
          // After 0, really?
          if (times <= 0) return func();

          // That's more like it.
          return function() {
            if (--times < 1) {
              return func.apply(this, arguments);
            }
          };
        };
      },
      {}
    ],
    15: [
      function(require, module, exports) {
        try {
          var bind = require('bind');
          var type = require('type');
        } catch (e) {
          var bind = require('bind-component');
          var type = require('type-component');
        }

        module.exports = function(obj) {
          for (var key in obj) {
            var val = obj[key];
            if (type(val) === 'function') obj[key] = bind(obj, obj[key]);
          }
          return obj;
        };
      },
      { bind: 61, type: 53 }
    ],
    61: [
      function(require, module, exports) {
        /**
         * Slice reference.
         */

        var slice = [].slice;

        /**
         * Bind `obj` to `fn`.
         *
         * @param {Object} obj
         * @param {Function|String} fn or string
         * @return {Function}
         * @api public
         */

        module.exports = function(obj, fn) {
          if (typeof fn === 'string') fn = obj[fn];
          if (typeof fn !== 'function')
            throw new Error('bind() requires a function');
          var args = slice.call(arguments, 2);
          return function() {
            return fn.apply(obj, args.concat(slice.call(arguments)));
          };
        };
      },
      {}
    ],
    16: [
      function(require, module, exports) {
        var next = require('next-tick');

        /**
         * Expose `callback`.
         */

        module.exports = callback;

        /**
         * Call an `fn` back synchronously if it exists.
         *
         * @param {Function} fn
         */

        function callback(fn) {
          if (typeof fn === 'function') fn();
        }

        /**
         * Call an `fn` back asynchronously if it exists. If `wait` is ommitted, the
         * `fn` will be called on next tick.
         *
         * @param {Function} fn
         * @param {Number} wait (optional)
         */

        callback.async = function(fn, wait) {
          if (typeof fn !== 'function') return;
          if (!wait) return next(fn);
          setTimeout(fn, wait);
        };

        /**
         * Symmetry.
         */

        callback.sync = callback;
      },
      { 'next-tick': 62 }
    ],
    62: [
      function(require, module, exports) {
        'use strict';

        if (typeof setImmediate === 'function') {
          module.exports = function(f) {
            setImmediate(f);
          };
        }
        // legacy node.js
        else if (
          typeof process !== 'undefined' &&
          typeof process.nextTick === 'function'
        ) {
          module.exports = process.nextTick;
        }
        // fallback for other environments / postMessage behaves badly on IE8
        else if (
          typeof window === 'undefined' ||
          window.ActiveXObject ||
          !window.postMessage
        ) {
          module.exports = function(f) {
            setTimeout(f);
          };
        } else {
          var q = [];

          window.addEventListener(
            'message',
            function() {
              var i = 0;
              while (i < q.length) {
                try {
                  q[i++]();
                } catch (e) {
                  q = q.slice(i);
                  window.postMessage('tic!', '*');
                  throw e;
                }
              }
              q.length = 0;
            },
            true
          );

          module.exports = function(fn) {
            if (!q.length) window.postMessage('tic!', '*');
            q.push(fn);
          };
        }
      },
      {}
    ],
    17: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var type;

        try {
          type = require('type');
        } catch (e) {
          type = require('type-component');
        }

        /**
         * Module exports.
         */

        module.exports = clone;

        /**
         * Clones objects.
         *
         * @param {Mixed} any object
         * @api public
         */

        function clone(obj) {
          switch (type(obj)) {
            case 'object':
              var copy = {};
              for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                  copy[key] = clone(obj[key]);
                }
              }
              return copy;

            case 'array':
              var copy = new Array(obj.length);
              for (var i = 0, l = obj.length; i < l; i++) {
                copy[i] = clone(obj[i]);
              }
              return copy;

            case 'regexp':
              // from millermedeiros/amd-utils - MIT
              var flags = '';
              flags += obj.multiline ? 'm' : '';
              flags += obj.global ? 'g' : '';
              flags += obj.ignoreCase ? 'i' : '';
              return new RegExp(obj.source, flags);

            case 'date':
              return new Date(obj.getTime());

            default:
              // string, number, boolean, …
              return obj;
          }
        }
      },
      { type: 53 }
    ],
    18: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var bindAll = require('bind-all');
        var clone = require('clone');
        var cookie = require('cookie');
        var debug = require('debug')('analytics.js:cookie');
        var defaults = require('defaults');
        var json = require('json');
        var topDomain = require('top-domain');

        /**
         * Initialize a new `Cookie` with `options`.
         *
         * @param {Object} options
         */

        function Cookie(options) {
          this.options(options);
        }

        /**
         * Get or set the cookie options.
         *
         * @param {Object} options
         *   @field {Number} maxage (1 year)
         *   @field {String} domain
         *   @field {String} path
         *   @field {Boolean} secure
         */

        Cookie.prototype.options = function(options) {
          if (arguments.length === 0) return this._options;

          options = options || {};

          var domain = '.' + topDomain(window.location.href);
          if (domain === '.') domain = null;

          this._options = defaults(options, {
            // default to a year
            maxage: 31536000000,
            path: '/',
            domain: domain
          });

          // http://curl.haxx.se/rfc/cookie_spec.html
          // https://publicsuffix.org/list/effective_tld_names.dat
          //
          // try setting a dummy cookie with the options
          // if the cookie isn't set, it probably means
          // that the domain is on the public suffix list
          // like myapp.herokuapp.com or localhost / ip.
          this.set('ajs:test', true);
          if (!this.get('ajs:test')) {
            debug('fallback to domain=null');
            this._options.domain = null;
          }
          this.remove('ajs:test');
        };

        /**
         * Set a `key` and `value` in our cookie.
         *
         * @param {String} key
         * @param {Object} value
         * @return {Boolean} saved
         */

        Cookie.prototype.set = function(key, value) {
          try {
            value = json.stringify(value);
            cookie(key, value, clone(this._options));
            return true;
          } catch (e) {
            return false;
          }
        };

        /**
         * Get a value from our cookie by `key`.
         *
         * @param {String} key
         * @return {Object} value
         */

        Cookie.prototype.get = function(key) {
          try {
            var value = cookie(key);
            value = value ? json.parse(value) : null;
            return value;
          } catch (e) {
            return null;
          }
        };

        /**
         * Remove a value from our cookie by `key`.
         *
         * @param {String} key
         * @return {Boolean} removed
         */

        Cookie.prototype.remove = function(key) {
          try {
            cookie(key, null, clone(this._options));
            return true;
          } catch (e) {
            return false;
          }
        };

        /**
         * Expose the cookie singleton.
         */

        module.exports = bindAll(new Cookie());

        /**
         * Expose the `Cookie` constructor.
         */

        module.exports.Cookie = Cookie;
      },
      {
        'bind-all': 15,
        clone: 17,
        cookie: 63,
        debug: 19,
        defaults: 20,
        json: 64,
        'top-domain': 65
      }
    ],
    63: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var debug = require('debug')('cookie');

        /**
         * Set or get cookie `name` with `value` and `options` object.
         *
         * @param {String} name
         * @param {String} value
         * @param {Object} options
         * @return {Mixed}
         * @api public
         */

        module.exports = function(name, value, options) {
          switch (arguments.length) {
            case 3:
            case 2:
              return set(name, value, options);
            case 1:
              return get(name);
            default:
              return all();
          }
        };

        /**
         * Set cookie `name` to `value`.
         *
         * @param {String} name
         * @param {String} value
         * @param {Object} options
         * @api private
         */

        function set(name, value, options) {
          options = options || {};
          var str = encode(name) + '=' + encode(value);

          if (value == null) options.maxage = -1;

          if (options.maxage) {
            options.expires = new Date(+new Date() + options.maxage);
          }

          if (options.path) str += '; path=' + options.path;
          if (options.domain) str += '; domain=' + options.domain;
          if (options.expires)
            str += '; expires=' + options.expires.toUTCString();
          if (options.secure) str += '; secure';

          document.cookie = str;
        }

        /**
         * Return all cookies.
         *
         * @return {Object}
         * @api private
         */

        function all() {
          return parse(document.cookie);
        }

        /**
         * Get cookie `name`.
         *
         * @param {String} name
         * @return {String}
         * @api private
         */

        function get(name) {
          return all()[name];
        }

        /**
         * Parse cookie `str`.
         *
         * @param {String} str
         * @return {Object}
         * @api private
         */

        function parse(str) {
          var obj = {};
          var pairs = str.split(/ *; */);
          var pair;
          if (pairs[0] == '') return obj;
          for (var i = 0; i < pairs.length; ++i) {
            pair = pairs[i].split('=');
            obj[decode(pair[0])] = decode(pair[1]);
          }
          return obj;
        }

        /**
         * Encode.
         */

        function encode(value) {
          try {
            return encodeURIComponent(value);
          } catch (e) {
            debug('error `encode(%o)` - %o', value, e);
          }
        }

        /**
         * Decode.
         */

        function decode(value) {
          try {
            return decodeURIComponent(value);
          } catch (e) {
            debug('error `decode(%o)` - %o', value, e);
          }
        }
      },
      { debug: 19 }
    ],
    19: [
      function(require, module, exports) {
        if (typeof window === 'undefined') {
          module.exports = require('./lib/debug');
        } else {
          module.exports = require('./debug');
        }
      },
      { './lib/debug': 66, './debug': 67 }
    ],
    66: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var tty = require('tty');

        /**
         * Expose `debug()` as the module.
         */

        module.exports = debug;

        /**
         * Enabled debuggers.
         */

        var names = [];
        var skips = [];

        (process.env.DEBUG || '').split(/[\s,]+/).forEach(function(name) {
          name = name.replace('*', '.*?');
          if (name[0] === '-') {
            skips.push(new RegExp('^' + name.substr(1) + '$'));
          } else {
            names.push(new RegExp('^' + name + '$'));
          }
        });

        /**
         * Colors.
         */

        var colors = [6, 2, 3, 4, 5, 1];

        /**
         * Previous debug() call.
         */

        var prev = {};

        /**
         * Previously assigned color.
         */

        var prevColor = 0;

        /**
         * Is stdout a TTY? Colored output is disabled when `true`.
         */

        var isatty = tty.isatty(2);

        /**
         * Select a color.
         *
         * @return {Number}
         * @api private
         */

        function color() {
          return colors[prevColor++ % colors.length];
        }

        /**
         * Humanize the given `ms`.
         *
         * @param {Number} m
         * @return {String}
         * @api private
         */

        function humanize(ms) {
          var sec = 1000;
          var min = 60 * 1000;
          var hour = 60 * min;

          if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
          if (ms >= min) return (ms / min).toFixed(1) + 'm';
          if (ms >= sec) return ((ms / sec) | 0) + 's';
          return ms + 'ms';
        }

        /**
         * Create a debugger with the given `name`.
         *
         * @param {String} name
         * @return {Type}
         * @api public
         */

        function debug(name) {
          function disabled() {}
          disabled.enabled = false;

          var match = skips.some(function(re) {
            return re.test(name);
          });

          if (match) return disabled;

          match = names.some(function(re) {
            return re.test(name);
          });

          if (!match) return disabled;
          var c = color();

          function colored(fmt) {
            fmt = coerce(fmt);

            var curr = new Date();
            var ms = curr - (prev[name] || curr);
            prev[name] = curr;

            fmt =
              '  \u001b[9' +
              c +
              'm' +
              name +
              ' ' +
              '\u001b[3' +
              c +
              'm\u001b[90m' +
              fmt +
              '\u001b[3' +
              c +
              'm' +
              ' +' +
              humanize(ms) +
              '\u001b[0m';

            console.error.apply(this, arguments);
          }

          function plain(fmt) {
            fmt = coerce(fmt);

            fmt = new Date().toUTCString() + ' ' + name + ' ' + fmt;
            console.error.apply(this, arguments);
          }

          colored.enabled = plain.enabled = true;

          return isatty || process.env.DEBUG_COLORS ? colored : plain;
        }

        /**
         * Coerce `val`.
         */

        function coerce(val) {
          if (val instanceof Error) return val.stack || val.message;
          return val;
        }
      },
      {}
    ],
    67: [
      function(require, module, exports) {
        /**
         * Expose `debug()` as the module.
         */

        module.exports = debug;

        /**
         * Create a debugger with the given `name`.
         *
         * @param {String} name
         * @return {Type}
         * @api public
         */

        function debug(name) {
          if (!debug.enabled(name)) return function() {};

          return function(fmt) {
            fmt = coerce(fmt);

            var curr = new Date();
            var ms = curr - (debug[name] || curr);
            debug[name] = curr;

            fmt = name + ' ' + fmt + ' +' + debug.humanize(ms);

            // This hackery is required for IE8
            // where `console.log` doesn't have 'apply'
            window.console &&
              console.log &&
              Function.prototype.apply.call(console.log, console, arguments);
          };
        }

        /**
         * The currently active debug mode names.
         */

        debug.names = [];
        debug.skips = [];

        /**
         * Enables a debug mode by name. This can include modes
         * separated by a colon and wildcards.
         *
         * @param {String} name
         * @api public
         */

        debug.enable = function(name) {
          try {
            localStorage.debug = name;
          } catch (e) {}

          var split = (name || '').split(/[\s,]+/);
          var len = split.length;

          for (var i = 0; i < len; i++) {
            name = split[i].replace('*', '.*?');
            if (name[0] === '-') {
              debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
            } else {
              debug.names.push(new RegExp('^' + name + '$'));
            }
          }
        };

        /**
         * Disable debug output.
         *
         * @api public
         */

        debug.disable = function() {
          debug.enable('');
        };

        /**
         * Humanize the given `ms`.
         *
         * @param {Number} m
         * @return {String}
         * @api private
         */

        debug.humanize = function(ms) {
          var sec = 1000;
          var min = 60 * 1000;
          var hour = 60 * min;

          if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
          if (ms >= min) return (ms / min).toFixed(1) + 'm';
          if (ms >= sec) return ((ms / sec) | 0) + 's';
          return ms + 'ms';
        };

        /**
         * Returns true if the given mode name is enabled, false otherwise.
         *
         * @param {String} name
         * @return {Boolean}
         * @api public
         */

        debug.enabled = function(name) {
          for (var i = 0, len = debug.skips.length; i < len; i++) {
            if (debug.skips[i].test(name)) {
              return false;
            }
          }
          for (var i = 0, len = debug.names.length; i < len; i++) {
            if (debug.names[i].test(name)) {
              return true;
            }
          }
          return false;
        };

        /**
         * Coerce `val`.
         */

        function coerce(val) {
          if (val instanceof Error) return val.stack || val.message;
          return val;
        }

        // persist

        try {
          if (window.localStorage) debug.enable(localStorage.debug);
        } catch (e) {}
      },
      {}
    ],
    20: [
      function(require, module, exports) {
        'use strict';

        /**
         * Merge default values.
         *
         * @param {Object} dest
         * @param {Object} defaults
         * @return {Object}
         * @api public
         */
        var defaults = function(dest, src, recursive) {
          for (var prop in src) {
            if (
              recursive &&
              dest[prop] instanceof Object &&
              src[prop] instanceof Object
            ) {
              dest[prop] = defaults(dest[prop], src[prop], true);
            } else if (!(prop in dest)) {
              dest[prop] = src[prop];
            }
          }

          return dest;
        };

        /**
         * Expose `defaults`.
         */
        module.exports = defaults;
      },
      {}
    ],
    64: [
      function(require, module, exports) {
        var json = window.JSON || {};
        var stringify = json.stringify;
        var parse = json.parse;

        module.exports = parse && stringify ? JSON : require('json-fallback');
      },
      { 'json-fallback': 68 }
    ],
    68: [
      function(require, module, exports) {
        /*
    json2.js
    2014-02-04

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

        /* jslint evil: true, regexp: true */

        /* members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

        // Create a JSON object only if one does not already exist. We create the
        // methods in a closure to avoid creating global variables.

        (function() {
          'use strict';

          var JSON = (module.exports = {});

          function f(n) {
            // Format integers to have at least two digits.
            return n < 10 ? '0' + n : n;
          }

          if (typeof Date.prototype.toJSON !== 'function') {
            Date.prototype.toJSON = function() {
              return isFinite(this.valueOf())
                ? this.getUTCFullYear() +
                    '-' +
                    f(this.getUTCMonth() + 1) +
                    '-' +
                    f(this.getUTCDate()) +
                    'T' +
                    f(this.getUTCHours()) +
                    ':' +
                    f(this.getUTCMinutes()) +
                    ':' +
                    f(this.getUTCSeconds()) +
                    'Z'
                : null;
            };

            String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function() {
              return this.valueOf();
            };
          }

          var cx;
          var escapable;
          var gap;
          var indent;
          var meta;
          var rep;

          function quote(string) {
            // If the string contains no control characters, no quote characters, and no
            // backslash characters, then we can safely slap some quotes around it.
            // Otherwise we must also replace the offending characters with safe escape
            // sequences.

            escapable.lastIndex = 0;
            return escapable.test(string)
              ? '"' +
                  string.replace(escapable, function(a) {
                    var c = meta[a];
                    return typeof c === 'string'
                      ? c
                      : '\\u' +
                          ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                  }) +
                  '"'
              : '"' + string + '"';
          }

          function str(key, holder) {
            // Produce a string from holder[key].

            var i; // The loop counter.
            var k; // The member key.
            var v; // The member value.
            var length;
            var mind = gap;
            var partial;
            var value = holder[key];

            // If the value has a toJSON method, call it to obtain a replacement value.

            if (
              value &&
              typeof value === 'object' &&
              typeof value.toJSON === 'function'
            ) {
              value = value.toJSON(key);
            }

            // If we were called with a replacer function, then call the replacer to
            // obtain a replacement value.

            if (typeof rep === 'function') {
              value = rep.call(holder, key, value);
            }

            // What happens next depends on the value's type.

            switch (typeof value) {
              case 'string':
                return quote(value);

              case 'number':
                // JSON numbers must be finite. Encode non-finite numbers as null.

                return isFinite(value) ? String(value) : 'null';

              case 'boolean':
              case 'null':
                // If the value is a boolean or null, convert it to a string. Note:
                // typeof null does not produce 'null'. The case is included here in
                // the remote chance that this gets fixed someday.

                return String(value);

              // If the type is 'object', we might be dealing with an object or an array or
              // null.

              case 'object':
                // Due to a specification blunder in ECMAScript, typeof null is 'object',
                // so watch out for that case.

                if (!value) {
                  return 'null';
                }

                // Make an array to hold the partial results of stringifying this object value.

                gap += indent;
                partial = [];

                // Is the value an array?

                if (
                  Object.prototype.toString.apply(value) === '[object Array]'
                ) {
                  // The value is an array. Stringify every element. Use null as a placeholder
                  // for non-JSON values.

                  length = value.length;
                  for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                  }

                  // Join all of the elements together, separated with commas, and wrap them in
                  // brackets.

                  v =
                    partial.length === 0
                      ? '[]'
                      : gap
                      ? '[\n' +
                        gap +
                        partial.join(',\n' + gap) +
                        '\n' +
                        mind +
                        ']'
                      : '[' + partial.join(',') + ']';
                  gap = mind;
                  return v;
                }

                // If the replacer is an array, use it to select the members to be stringified.

                if (rep && typeof rep === 'object') {
                  length = rep.length;
                  for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                      k = rep[i];
                      v = str(k, value);
                      if (v) {
                        partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                    }
                  }
                } else {
                  // Otherwise, iterate through all of the keys in the object.

                  for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = str(k, value);
                      if (v) {
                        partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                    }
                  }
                }

                // Join all of the member texts together, separated with commas,
                // and wrap them in braces.

                v =
                  partial.length === 0
                    ? '{}'
                    : gap
                    ? '{\n' +
                      gap +
                      partial.join(',\n' + gap) +
                      '\n' +
                      mind +
                      '}'
                    : '{' + partial.join(',') + '}';
                gap = mind;
                return v;
            }
          }

          // If the JSON object does not yet have a stringify method, give it one.

          if (typeof JSON.stringify !== 'function') {
            escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
            meta = {
              // table of character substitutions
              '\b': '\\b',
              '\t': '\\t',
              '\n': '\\n',
              '\f': '\\f',
              '\r': '\\r',
              '"': '\\"',
              '\\': '\\\\'
            };
            JSON.stringify = function(value, replacer, space) {
              // The stringify method takes a value and an optional replacer, and an optional
              // space parameter, and returns a JSON text. The replacer can be a function
              // that can replace values, or an array of strings that will select the keys.
              // A default replacer method can be provided. Use of the space parameter can
              // produce text that is more easily readable.

              var i;
              gap = '';
              indent = '';

              // If the space parameter is a number, make an indent string containing that
              // many spaces.

              if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                  indent += ' ';
                }

                // If the space parameter is a string, it will be used as the indent string.
              } else if (typeof space === 'string') {
                indent = space;
              }

              // If there is a replacer, it must be a function or an array.
              // Otherwise, throw an error.

              rep = replacer;
              if (
                replacer &&
                typeof replacer !== 'function' &&
                (typeof replacer !== 'object' ||
                  typeof replacer.length !== 'number')
              ) {
                throw new Error('JSON.stringify');
              }

              // Make a fake root object containing our value under the key of ''.
              // Return the result of stringifying the value.

              return str('', { '': value });
            };
          }

          // If the JSON object does not yet have a parse method, give it one.

          if (typeof JSON.parse !== 'function') {
            cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
            JSON.parse = function(text, reviver) {
              // The parse method takes a text and an optional reviver function, and returns
              // a JavaScript value if the text is a valid JSON text.

              var j;

              function walk(holder, key) {
                // The walk method is used to recursively walk the resulting structure so
                // that modifications can be made.

                var k;
                var v;
                var value = holder[key];
                if (value && typeof value === 'object') {
                  for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                        value[k] = v;
                      } else {
                        delete value[k];
                      }
                    }
                  }
                }
                return reviver.call(holder, key, value);
              }

              // Parsing happens in four stages. In the first stage, we replace certain
              // Unicode characters with escape sequences. JavaScript handles many characters
              // incorrectly, either silently deleting them, or treating them as line endings.

              text = String(text);
              cx.lastIndex = 0;
              if (cx.test(text)) {
                text = text.replace(cx, function(a) {
                  return (
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4)
                  );
                });
              }

              // In the second stage, we run the text against regular expressions that look
              // for non-JSON patterns. We are especially concerned with '()' and 'new'
              // because they can cause invocation, and '=' because it can cause mutation.
              // But just to be safe, we want to reject all unexpected forms.

              // We split the second stage into 4 regexp operations in order to work around
              // crippling inefficiencies in IE's and Safari's regexp engines. First we
              // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
              // replace all simple value tokens with ']' characters. Third, we delete all
              // open brackets that follow a colon or comma or that begin the text. Finally,
              // we look to see that the remaining characters are only whitespace or ']' or
              // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

              if (
                /^[\],:{}\s]*$/.test(
                  text
                    .replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                    .replace(
                      /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
                      ']'
                    )
                    .replace(/(?:^|:|,)(?:\s*\[)+/g, '')
                )
              ) {
                // In the third stage we use the eval function to compile the text into a
                // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
                // in JavaScript: it can begin a block or an object literal. We wrap the text
                // in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

                // In the optional fourth stage, we recursively walk the new structure, passing
                // each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ? walk({ '': j }, '') : j;
              }

              // If the text is not JSON parseable, then a SyntaxError is thrown.

              throw new SyntaxError('JSON.parse');
            };
          }
        })();
      },
      {}
    ],
    65: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var parse = require('url').parse;
        var cookie = require('cookie');

        /**
         * Expose `domain`
         */

        exports = module.exports = domain;

        /**
         * Expose `cookie` for testing.
         */

        exports.cookie = cookie;

        /**
         * Get the top domain.
         *
         * The function constructs the levels of domain
         * and attempts to set a global cookie on each one
         * when it succeeds it returns the top level domain.
         *
         * The method returns an empty string when the hostname
         * is an ip or `localhost`.
         *
         * Example levels:
         *
         *      domain.levels('http://www.google.co.uk');
         *      // => ["co.uk", "google.co.uk", "www.google.co.uk"]
         *
         * Example:
         *
         *      domain('http://localhost:3000/baz');
         *      // => ''
         *      domain('http://dev:3000/baz');
         *      // => ''
         *      domain('http://127.0.0.1:3000/baz');
         *      // => ''
         *      domain('http://segment.io/baz');
         *      // => 'segment.io'
         *
         * @param {String} url
         * @return {String}
         * @api public
         */

        function domain(url) {
          var cookie = exports.cookie;
          var levels = exports.levels(url);

          // Lookup the real top level one.
          for (var i = 0; i < levels.length; ++i) {
            var cname = '__tld__';
            var domain = levels[i];
            var opts = { domain: '.' + domain };

            cookie(cname, 1, opts);
            if (cookie(cname)) {
              cookie(cname, null, opts);
              return domain;
            }
          }

          return '';
        }

        /**
         * Levels returns all levels of the given url.
         *
         * @param {String} url
         * @return {Array}
         * @api public
         */

        domain.levels = function(url) {
          var host = parse(url).hostname;
          var parts = host.split('.');
          var last = parts[parts.length - 1];
          var levels = [];

          // Ip address.
          if (parts.length == 4 && parseInt(last, 10) == last) {
            return levels;
          }

          // Localhost.
          if (parts.length <= 1) {
            return levels;
          }

          // Create levels.
          for (var i = parts.length - 2; i >= 0; --i) {
            levels.push(parts.slice(i).join('.'));
          }

          return levels;
        };
      },
      { url: 69, cookie: 70 }
    ],
    69: [
      function(require, module, exports) {
        /**
         * Parse the given `url`.
         *
         * @param {String} str
         * @return {Object}
         * @api public
         */

        exports.parse = function(url) {
          var a = document.createElement('a');
          a.href = url;
          return {
            href: a.href,
            host: a.host || location.host,
            port: a.port === '0' || a.port === '' ? port(a.protocol) : a.port,
            hash: a.hash,
            hostname: a.hostname || location.hostname,
            pathname:
              a.pathname.charAt(0) != '/' ? '/' + a.pathname : a.pathname,
            protocol:
              !a.protocol || a.protocol == ':' ? location.protocol : a.protocol,
            search: a.search,
            query: a.search.slice(1)
          };
        };

        /**
         * Check if `url` is absolute.
         *
         * @param {String} url
         * @return {Boolean}
         * @api public
         */

        exports.isAbsolute = function(url) {
          return url.indexOf('//') == 0 || !!~url.indexOf('://');
        };

        /**
         * Check if `url` is relative.
         *
         * @param {String} url
         * @return {Boolean}
         * @api public
         */

        exports.isRelative = function(url) {
          return !exports.isAbsolute(url);
        };

        /**
         * Check if `url` is cross domain.
         *
         * @param {String} url
         * @return {Boolean}
         * @api public
         */

        exports.isCrossDomain = function(url) {
          url = exports.parse(url);
          var location = exports.parse(window.location.href);
          return (
            url.hostname !== location.hostname ||
            url.port !== location.port ||
            url.protocol !== location.protocol
          );
        };

        /**
         * Return default port for `protocol`.
         *
         * @param  {String} protocol
         * @return {String}
         * @api private
         */
        function port(protocol) {
          switch (protocol) {
            case 'http:':
              return 80;
            case 'https:':
              return 443;
            default:
              return location.port;
          }
        }
      },
      {}
    ],
    70: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var debug = require('debug')('cookie');

        /**
         * Set or get cookie `name` with `value` and `options` object.
         *
         * @param {String} name
         * @param {String} value
         * @param {Object} options
         * @return {Mixed}
         * @api public
         */

        module.exports = function(name, value, options) {
          switch (arguments.length) {
            case 3:
            case 2:
              return set(name, value, options);
            case 1:
              return get(name);
            default:
              return all();
          }
        };

        /**
         * Set cookie `name` to `value`.
         *
         * @param {String} name
         * @param {String} value
         * @param {Object} options
         * @api private
         */

        function set(name, value, options) {
          options = options || {};
          var str = encode(name) + '=' + encode(value);

          if (value == null) options.maxage = -1;

          if (options.maxage) {
            options.expires = new Date(+new Date() + options.maxage);
          }

          if (options.path) str += '; path=' + options.path;
          if (options.domain) str += '; domain=' + options.domain;
          if (options.expires)
            str += '; expires=' + options.expires.toUTCString();
          if (options.secure) str += '; secure';

          document.cookie = str;
        }

        /**
         * Return all cookies.
         *
         * @return {Object}
         * @api private
         */

        function all() {
          var str;
          try {
            str = document.cookie;
          } catch (err) {
            if (
              typeof console !== 'undefined' &&
              typeof console.error === 'function'
            ) {
              console.error(err.stack || err);
            }
            return {};
          }
          return parse(str);
        }

        /**
         * Get cookie `name`.
         *
         * @param {String} name
         * @return {String}
         * @api private
         */

        function get(name) {
          return all()[name];
        }

        /**
         * Parse cookie `str`.
         *
         * @param {String} str
         * @return {Object}
         * @api private
         */

        function parse(str) {
          var obj = {};
          var pairs = str.split(/ *; */);
          var pair;
          if (pairs[0] == '') return obj;
          for (var i = 0; i < pairs.length; ++i) {
            pair = pairs[i].split('=');
            obj[decode(pair[0])] = decode(pair[1]);
          }
          return obj;
        }

        /**
         * Encode.
         */

        function encode(value) {
          try {
            return encodeURIComponent(value);
          } catch (e) {
            debug('error `encode(%o)` - %o', value, e);
          }
        }

        /**
         * Decode.
         */

        function decode(value) {
          try {
            return decodeURIComponent(value);
          } catch (e) {
            debug('error `decode(%o)` - %o', value, e);
          }
        }
      },
      { debug: 19 }
    ],
    22: [
      function(require, module, exports) {
        'use strict';

        /**
         * Module dependencies.
         */

        // XXX: Hacky fix for Duo not supporting scoped modules
        var each;
        try {
          each = require('@ndhoule/each');
        } catch (e) {
          each = require('each');
        }

        /**
         * Reduces all the values in a collection down into a single value. Does so by iterating through the
         * collection from left to right, repeatedly calling an `iterator` function and passing to it four
         * arguments: `(accumulator, value, index, collection)`.
         *
         * Returns the final return value of the `iterator` function.
         *
         * @name foldl
         * @api public
         * @param {Function} iterator The function to invoke per iteration.
         * @param {*} accumulator The initial accumulator value, passed to the first invocation of `iterator`.
         * @param {Array|Object} collection The collection to iterate over.
         * @return {*} The return value of the final call to `iterator`.
         * @example
         * foldl(function(total, n) {
         *   return total + n;
         * }, 0, [1, 2, 3]);
         * //=> 6
         *
         * var phonebook = { bob: '555-111-2345', tim: '655-222-6789', sheila: '655-333-1298' };
         *
         * foldl(function(results, phoneNumber) {
         *  if (phoneNumber[0] === '6') {
         *    return results.concat(phoneNumber);
         *  }
         *  return results;
         * }, [], phonebook);
         * // => ['655-222-6789', '655-333-1298']
         */

        var foldl = function foldl(iterator, accumulator, collection) {
          if (typeof iterator !== 'function') {
            throw new TypeError(
              'Expected a function but received a ' + typeof iterator
            );
          }

          each(function(val, i, collection) {
            accumulator = iterator(accumulator, val, i, collection);
          }, collection);

          return accumulator;
        };

        /**
         * Exports.
         */

        module.exports = foldl;
      },
      { each: 71 }
    ],
    71: [
      function(require, module, exports) {
        'use strict';

        /**
         * Module dependencies.
         */

        // XXX: Hacky fix for Duo not supporting scoped modules
        var keys;
        try {
          keys = require('@ndhoule/keys');
        } catch (e) {
          keys = require('keys');
        }

        /**
         * Object.prototype.toString reference.
         */

        var objToString = Object.prototype.toString;

        /**
         * Tests if a value is a number.
         *
         * @name isNumber
         * @api private
         * @param {*} val The value to test.
         * @return {boolean} Returns `true` if `val` is a number, otherwise `false`.
         */

        // TODO: Move to library
        var isNumber = function isNumber(val) {
          var type = typeof val;
          return (
            type === 'number' ||
            (type === 'object' && objToString.call(val) === '[object Number]')
          );
        };

        /**
         * Tests if a value is an array.
         *
         * @name isArray
         * @api private
         * @param {*} val The value to test.
         * @return {boolean} Returns `true` if the value is an array, otherwise `false`.
         */

        // TODO: Move to library
        var isArray =
          typeof Array.isArray === 'function'
            ? Array.isArray
            : function isArray(val) {
                return objToString.call(val) === '[object Array]';
              };

        /**
         * Tests if a value is array-like. Array-like means the value is not a function and has a numeric
         * `.length` property.
         *
         * @name isArrayLike
         * @api private
         * @param {*} val
         * @return {boolean}
         */

        // TODO: Move to library
        var isArrayLike = function isArrayLike(val) {
          return (
            val != null &&
            (isArray(val) || (val !== 'function' && isNumber(val.length)))
          );
        };

        /**
         * Internal implementation of `each`. Works on arrays and array-like data structures.
         *
         * @name arrayEach
         * @api private
         * @param {Function(value, key, collection)} iterator The function to invoke per iteration.
         * @param {Array} array The array(-like) structure to iterate over.
         * @return {undefined}
         */

        var arrayEach = function arrayEach(iterator, array) {
          for (var i = 0; i < array.length; i += 1) {
            // Break iteration early if `iterator` returns `false`
            if (iterator(array[i], i, array) === false) {
              break;
            }
          }
        };

        /**
         * Internal implementation of `each`. Works on objects.
         *
         * @name baseEach
         * @api private
         * @param {Function(value, key, collection)} iterator The function to invoke per iteration.
         * @param {Object} object The object to iterate over.
         * @return {undefined}
         */

        var baseEach = function baseEach(iterator, object) {
          var ks = keys(object);

          for (var i = 0; i < ks.length; i += 1) {
            // Break iteration early if `iterator` returns `false`
            if (iterator(object[ks[i]], ks[i], object) === false) {
              break;
            }
          }
        };

        /**
         * Iterate over an input collection, invoking an `iterator` function for each element in the
         * collection and passing to it three arguments: `(value, index, collection)`. The `iterator`
         * function can end iteration early by returning `false`.
         *
         * @name each
         * @api public
         * @param {Function(value, key, collection)} iterator The function to invoke per iteration.
         * @param {Array|Object|string} collection The collection to iterate over.
         * @return {undefined} Because `each` is run only for side effects, always returns `undefined`.
         * @example
         * var log = console.log.bind(console);
         *
         * each(log, ['a', 'b', 'c']);
         * //-> 'a', 0, ['a', 'b', 'c']
         * //-> 'b', 1, ['a', 'b', 'c']
         * //-> 'c', 2, ['a', 'b', 'c']
         * //=> undefined
         *
         * each(log, 'tim');
         * //-> 't', 2, 'tim'
         * //-> 'i', 1, 'tim'
         * //-> 'm', 0, 'tim'
         * //=> undefined
         *
         * // Note: Iteration order not guaranteed across environments
         * each(log, { name: 'tim', occupation: 'enchanter' });
         * //-> 'tim', 'name', { name: 'tim', occupation: 'enchanter' }
         * //-> 'enchanter', 'occupation', { name: 'tim', occupation: 'enchanter' }
         * //=> undefined
         */

        var each = function each(iterator, collection) {
          return (isArrayLike(collection) ? arrayEach : baseEach).call(
            this,
            iterator,
            collection
          );
        };

        /**
         * Exports.
         */

        module.exports = each;
      },
      { keys: 72 }
    ],
    72: [
      function(require, module, exports) {
        'use strict';

        /**
         * charAt reference.
         */

        var strCharAt = String.prototype.charAt;

        /**
         * Returns the character at a given index.
         *
         * @param {string} str
         * @param {number} index
         * @return {string|undefined}
         */

        // TODO: Move to a library
        var charAt = function(str, index) {
          return strCharAt.call(str, index);
        };

        /**
         * hasOwnProperty reference.
         */

        var hop = Object.prototype.hasOwnProperty;

        /**
         * Object.prototype.toString reference.
         */

        var toStr = Object.prototype.toString;

        /**
         * hasOwnProperty, wrapped as a function.
         *
         * @name has
         * @api private
         * @param {*} context
         * @param {string|number} prop
         * @return {boolean}
         */

        // TODO: Move to a library
        var has = function has(context, prop) {
          return hop.call(context, prop);
        };

        /**
         * Returns true if a value is a string, otherwise false.
         *
         * @name isString
         * @api private
         * @param {*} val
         * @return {boolean}
         */

        // TODO: Move to a library
        var isString = function isString(val) {
          return toStr.call(val) === '[object String]';
        };

        /**
         * Returns true if a value is array-like, otherwise false. Array-like means a
         * value is not null, undefined, or a function, and has a numeric `length`
         * property.
         *
         * @name isArrayLike
         * @api private
         * @param {*} val
         * @return {boolean}
         */

        // TODO: Move to a library
        var isArrayLike = function isArrayLike(val) {
          return (
            val != null &&
            (typeof val !== 'function' && typeof val.length === 'number')
          );
        };

        /**
         * indexKeys
         *
         * @name indexKeys
         * @api private
         * @param {} target
         * @param {} pred
         * @return {Array}
         */

        var indexKeys = function indexKeys(target, pred) {
          pred = pred || has;
          var results = [];

          for (var i = 0, len = target.length; i < len; i += 1) {
            if (pred(target, i)) {
              results.push(String(i));
            }
          }

          return results;
        };

        /**
         * Returns an array of all the owned
         *
         * @name objectKeys
         * @api private
         * @param {*} target
         * @param {Function} pred Predicate function used to include/exclude values from
         * the resulting array.
         * @return {Array}
         */

        var objectKeys = function objectKeys(target, pred) {
          pred = pred || has;
          var results = [];

          for (var key in target) {
            if (pred(target, key)) {
              results.push(String(key));
            }
          }

          return results;
        };

        /**
         * Creates an array composed of all keys on the input object. Ignores any non-enumerable properties.
         * More permissive than the native `Object.keys` function (non-objects will not throw errors).
         *
         * @name keys
         * @api public
         * @category Object
         * @param {Object} source The value to retrieve keys from.
         * @return {Array} An array containing all the input `source`'s keys.
         * @example
         * keys({ likes: 'avocado', hates: 'pineapple' });
         * //=> ['likes', 'pineapple'];
         *
         * // Ignores non-enumerable properties
         * var hasHiddenKey = { name: 'Tim' };
         * Object.defineProperty(hasHiddenKey, 'hidden', {
         *   value: 'i am not enumerable!',
         *   enumerable: false
         * })
         * keys(hasHiddenKey);
         * //=> ['name'];
         *
         * // Works on arrays
         * keys(['a', 'b', 'c']);
         * //=> ['0', '1', '2']
         *
         * // Skips unpopulated indices in sparse arrays
         * var arr = [1];
         * arr[4] = 4;
         * keys(arr);
         * //=> ['0', '4']
         */

        module.exports = function keys(source) {
          if (source == null) {
            return [];
          }

          // IE6-8 compatibility (string)
          if (isString(source)) {
            return indexKeys(source, charAt);
          }

          // IE6-8 compatibility (arguments)
          if (isArrayLike(source)) {
            return indexKeys(source, has);
          }

          return objectKeys(source);
        };
      },
      {}
    ],
    23: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var Entity = require('./entity');
        var bindAll = require('bind-all');
        var debug = require('debug')('analytics:group');
        var inherit = require('inherit');

        /**
         * Group defaults
         */

        Group.defaults = {
          persist: true,
          cookie: {
            key: 'ajs_group_id'
          },
          localStorage: {
            key: 'ajs_group_properties'
          }
        };

        /**
         * Initialize a new `Group` with `options`.
         *
         * @param {Object} options
         */

        function Group(options) {
          this.defaults = Group.defaults;
          this.debug = debug;
          Entity.call(this, options);
        }

        /**
         * Inherit `Entity`
         */

        inherit(Group, Entity);

        /**
         * Expose the group singleton.
         */

        module.exports = bindAll(new Group());

        /**
         * Expose the `Group` constructor.
         */

        module.exports.Group = Group;
      },
      { './entity': 73, 'bind-all': 15, debug: 19, inherit: 74 }
    ],
    73: [
      function(require, module, exports) {
        var clone = require('clone');
        var cookie = require('./cookie');
        var debug = require('debug')('analytics:entity');
        var defaults = require('defaults');
        var extend = require('extend');
        var memory = require('./memory');
        var store = require('./store');
        var isodateTraverse = require('isodate-traverse');

        /**
         * Expose `Entity`
         */

        module.exports = Entity;

        /**
         * Initialize new `Entity` with `options`.
         *
         * @param {Object} options
         */

        function Entity(options) {
          this.options(options);
          this.initialize();
        }

        /**
         * Initialize picks the storage.
         *
         * Checks to see if cookies can be set
         * otherwise fallsback to localStorage.
         */

        Entity.prototype.initialize = function() {
          cookie.set('ajs:cookies', true);

          // cookies are enabled.
          if (cookie.get('ajs:cookies')) {
            cookie.remove('ajs:cookies');
            this._storage = cookie;
            return;
          }

          // localStorage is enabled.
          if (store.enabled) {
            this._storage = store;
            return;
          }

          // fallback to memory storage.
          debug(
            'warning using memory store both cookies and localStorage are disabled'
          );
          this._storage = memory;
        };

        /**
         * Get the storage.
         */

        Entity.prototype.storage = function() {
          return this._storage;
        };

        /**
         * Get or set storage `options`.
         *
         * @param {Object} options
         *   @property {Object} cookie
         *   @property {Object} localStorage
         *   @property {Boolean} persist (default: `true`)
         */

        Entity.prototype.options = function(options) {
          if (arguments.length === 0) return this._options;
          this._options = defaults(options || {}, this.defaults || {});
        };

        /**
         * Get or set the entity's `id`.
         *
         * @param {String} id
         */

        Entity.prototype.id = function(id) {
          switch (arguments.length) {
            case 0:
              return this._getId();
            case 1:
              return this._setId(id);
            default:
            // No default case
          }
        };

        /**
         * Get the entity's id.
         *
         * @return {String}
         */

        Entity.prototype._getId = function() {
          var ret = this._options.persist
            ? this.storage().get(this._options.cookie.key)
            : this._id;
          return ret === undefined ? null : ret;
        };

        /**
         * Set the entity's `id`.
         *
         * @param {String} id
         */

        Entity.prototype._setId = function(id) {
          if (this._options.persist) {
            this.storage().set(this._options.cookie.key, id);
          } else {
            this._id = id;
          }
        };

        /**
         * Get or set the entity's `traits`.
         *
         * BACKWARDS COMPATIBILITY: aliased to `properties`
         *
         * @param {Object} traits
         */

        Entity.prototype.properties = Entity.prototype.traits = function(
          traits
        ) {
          switch (arguments.length) {
            case 0:
              return this._getTraits();
            case 1:
              return this._setTraits(traits);
            default:
            // No default case
          }
        };

        /**
         * Get the entity's traits. Always convert ISO date strings into real dates,
         * since they aren't parsed back from local storage.
         *
         * @return {Object}
         */

        Entity.prototype._getTraits = function() {
          var ret = this._options.persist
            ? store.get(this._options.localStorage.key)
            : this._traits;
          return ret ? isodateTraverse(clone(ret)) : {};
        };

        /**
         * Set the entity's `traits`.
         *
         * @param {Object} traits
         */

        Entity.prototype._setTraits = function(traits) {
          traits = traits || {};
          if (this._options.persist) {
            store.set(this._options.localStorage.key, traits);
          } else {
            this._traits = traits;
          }
        };

        /**
         * Identify the entity with an `id` and `traits`. If we it's the same entity,
         * extend the existing `traits` instead of overwriting.
         *
         * @param {String} id
         * @param {Object} traits
         */

        Entity.prototype.identify = function(id, traits) {
          traits = traits || {};
          var current = this.id();
          if (current === null || current === id)
            traits = extend(this.traits(), traits);
          if (id) this.id(id);
          this.debug('identify %o, %o', id, traits);
          this.traits(traits);
          this.save();
        };

        /**
         * Save the entity to local storage and the cookie.
         *
         * @return {Boolean}
         */

        Entity.prototype.save = function() {
          if (!this._options.persist) return false;
          cookie.set(this._options.cookie.key, this.id());
          store.set(this._options.localStorage.key, this.traits());
          return true;
        };

        /**
         * Log the entity out, reseting `id` and `traits` to defaults.
         */

        Entity.prototype.logout = function() {
          this.id(null);
          this.traits({});
          cookie.remove(this._options.cookie.key);
          store.remove(this._options.localStorage.key);
        };

        /**
         * Reset all entity state, logging out and returning options to defaults.
         */

        Entity.prototype.reset = function() {
          this.logout();
          this.options({});
        };

        /**
         * Load saved entity `id` or `traits` from storage.
         */

        Entity.prototype.load = function() {
          this.id(cookie.get(this._options.cookie.key));
          this.traits(store.get(this._options.localStorage.key));
        };
      },
      {
        clone: 17,
        './cookie': 18,
        debug: 19,
        defaults: 20,
        extend: 75,
        './memory': 27,
        './store': 34,
        'isodate-traverse': 44
      }
    ],
    75: [
      function(require, module, exports) {
        module.exports = function extend(object) {
          // Takes an unlimited number of extenders.
          var args = Array.prototype.slice.call(arguments, 1);

          // For each extender, copy their properties on our object.
          for (var i = 0, source; (source = args[i]); i++) {
            if (!source) continue;
            for (var property in source) {
              object[property] = source[property];
            }
          }

          return object;
        };
      },
      {}
    ],
    27: [
      function(require, module, exports) {
        /* eslint consistent-return:1 */

        /**
         * Module Dependencies.
         */

        var bindAll = require('bind-all');
        var clone = require('clone');

        /**
         * HOP.
         */

        var has = Object.prototype.hasOwnProperty;

        /**
         * Expose `Memory`
         */

        module.exports = bindAll(new Memory());

        /**
         * Initialize `Memory` store
         */

        function Memory() {
          this.store = {};
        }

        /**
         * Set a `key` and `value`.
         *
         * @param {String} key
         * @param {Mixed} value
         * @return {Boolean}
         */

        Memory.prototype.set = function(key, value) {
          this.store[key] = clone(value);
          return true;
        };

        /**
         * Get a `key`.
         *
         * @param {String} key
         */

        Memory.prototype.get = function(key) {
          if (!has.call(this.store, key)) return;
          return clone(this.store[key]);
        };

        /**
         * Remove a `key`.
         *
         * @param {String} key
         * @return {Boolean}
         */

        Memory.prototype.remove = function(key) {
          delete this.store[key];
          return true;
        };
      },
      { 'bind-all': 15, clone: 17 }
    ],
    34: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var bindAll = require('bind-all');
        var defaults = require('defaults');
        var store = require('store.js');

        /**
         * Initialize a new `Store` with `options`.
         *
         * @param {Object} options
         */

        function Store(options) {
          this.options(options);
        }

        /**
         * Set the `options` for the store.
         *
         * @param {Object} options
         *   @field {Boolean} enabled (true)
         */

        Store.prototype.options = function(options) {
          if (arguments.length === 0) return this._options;

          options = options || {};
          defaults(options, { enabled: true });

          this.enabled = options.enabled && store.enabled;
          this._options = options;
        };

        /**
         * Set a `key` and `value` in local storage.
         *
         * @param {string} key
         * @param {Object} value
         */

        Store.prototype.set = function(key, value) {
          if (!this.enabled) return false;
          return store.set(key, value);
        };

        /**
         * Get a value from local storage by `key`.
         *
         * @param {string} key
         * @return {Object}
         */

        Store.prototype.get = function(key) {
          if (!this.enabled) return null;
          return store.get(key);
        };

        /**
         * Remove a value from local storage by `key`.
         *
         * @param {string} key
         */

        Store.prototype.remove = function(key) {
          if (!this.enabled) return false;
          return store.remove(key);
        };

        /**
         * Expose the store singleton.
         */

        module.exports = bindAll(new Store());

        /**
         * Expose the `Store` constructor.
         */

        module.exports.Store = Store;
      },
      { 'bind-all': 15, defaults: 20, 'store.js': 76 }
    ],
    76: [
      function(require, module, exports) {
        var json = require('json');
        var store = {};
        var win = window;
        var doc = win.document;
        var localStorageName = 'localStorage';
        var namespace = '__storejs__';
        var storage;

        store.disabled = false;
        store.set = function(key, value) {};
        store.get = function(key) {};
        store.remove = function(key) {};
        store.clear = function() {};
        store.transact = function(key, defaultVal, transactionFn) {
          var val = store.get(key);
          if (transactionFn == null) {
            transactionFn = defaultVal;
            defaultVal = null;
          }
          if (typeof val === 'undefined') {
            val = defaultVal || {};
          }
          transactionFn(val);
          store.set(key, val);
        };
        store.getAll = function() {};

        store.serialize = function(value) {
          return json.stringify(value);
        };
        store.deserialize = function(value) {
          if (typeof value !== 'string') {
            return undefined;
          }
          try {
            return json.parse(value);
          } catch (e) {
            return value || undefined;
          }
        };

        // Functions to encapsulate questionable FireFox 3.6.13 behavior
        // when about.config::dom.storage.enabled === false
        // See https://github.com/marcuswestin/store.js/issues#issue/13
        function isLocalStorageNameSupported() {
          try {
            return localStorageName in win && win[localStorageName];
          } catch (err) {
            return false;
          }
        }

        if (isLocalStorageNameSupported()) {
          storage = win[localStorageName];
          store.set = function(key, val) {
            if (val === undefined) {
              return store.remove(key);
            }
            storage.setItem(key, store.serialize(val));
            return val;
          };
          store.get = function(key) {
            return store.deserialize(storage.getItem(key));
          };
          store.remove = function(key) {
            storage.removeItem(key);
          };
          store.clear = function() {
            storage.clear();
          };
          store.getAll = function() {
            var ret = {};
            for (var i = 0; i < storage.length; ++i) {
              var key = storage.key(i);
              ret[key] = store.get(key);
            }
            return ret;
          };
        } else if (doc.documentElement.addBehavior) {
          var storageOwner;
          var storageContainer;
          // Since #userData storage applies only to specific paths, we need to
          // somehow link our data to a specific path.  We choose /favicon.ico
          // as a pretty safe option, since all browsers already make a request to
          // this URL anyway and being a 404 will not hurt us here.  We wrap an
          // iframe pointing to the favicon in an ActiveXObject(htmlfile) object
          // (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
          // since the iframe access rules appear to allow direct access and
          // manipulation of the document element, even for a 404 page.  This
          // document can be used instead of the current document (which would
          // have been limited to the current path) to perform #userData storage.
          try {
            storageContainer = new ActiveXObject('htmlfile');
            storageContainer.open();
            storageContainer.write(
              '<s' +
                'cript>document.w=window</s' +
                'cript><iframe src="/favicon.ico"></iframe>'
            );
            storageContainer.close();
            storageOwner = storageContainer.w.frames[0].document;
            storage = storageOwner.createElement('div');
          } catch (e) {
            // somehow ActiveXObject instantiation failed (perhaps some special
            // security settings or otherwse), fall back to per-path storage
            storage = doc.createElement('div');
            storageOwner = doc.body;
          }
          function withIEStorage(storeFunction) {
            return function() {
              var args = Array.prototype.slice.call(arguments, 0);
              args.unshift(storage);
              // See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
              // and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
              storageOwner.appendChild(storage);
              storage.addBehavior('#default#userData');
              storage.load(localStorageName);
              var result = storeFunction.apply(store, args);
              storageOwner.removeChild(storage);
              return result;
            };
          }

          // In IE7, keys may not contain special chars. See all of https://github.com/marcuswestin/store.js/issues/40
          var forbiddenCharsRegex = new RegExp(
            '[!"#$%&\'()*+,/\\\\:;<=>?@[\\]^`{|}~]',
            'g'
          );
          function ieKeyFix(key) {
            return key.replace(forbiddenCharsRegex, '___');
          }
          store.set = withIEStorage(function(storage, key, val) {
            key = ieKeyFix(key);
            if (val === undefined) {
              return store.remove(key);
            }
            storage.setAttribute(key, store.serialize(val));
            storage.save(localStorageName);
            return val;
          });
          store.get = withIEStorage(function(storage, key) {
            key = ieKeyFix(key);
            return store.deserialize(storage.getAttribute(key));
          });
          store.remove = withIEStorage(function(storage, key) {
            key = ieKeyFix(key);
            storage.removeAttribute(key);
            storage.save(localStorageName);
          });
          store.clear = withIEStorage(function(storage) {
            var attributes = storage.XMLDocument.documentElement.attributes;
            storage.load(localStorageName);
            for (var i = 0, attr; (attr = attributes[i]); i++) {
              storage.removeAttribute(attr.name);
            }
            storage.save(localStorageName);
          });
          store.getAll = withIEStorage(function(storage) {
            var attributes = storage.XMLDocument.documentElement.attributes;
            var ret = {};
            for (var i = 0, attr; (attr = attributes[i]); ++i) {
              var key = ieKeyFix(attr.name);
              ret[attr.name] = store.deserialize(storage.getAttribute(key));
            }
            return ret;
          });
        }

        try {
          store.set(namespace, namespace);
          if (store.get(namespace) != namespace) {
            store.disabled = true;
          }
          store.remove(namespace);
        } catch (e) {
          store.disabled = true;
        }
        store.enabled = !store.disabled;

        module.exports = store;
      },
      { json: 64 }
    ],
    74: [
      function(require, module, exports) {
        module.exports = function(a, b) {
          var fn = function() {};
          fn.prototype = b.prototype;
          a.prototype = new fn();
          a.prototype.constructor = a;
        };
      },
      {}
    ],
    24: [
      function(require, module, exports) {
        var isEmpty = require('is-empty');

        try {
          var typeOf = require('type');
        } catch (e) {
          var typeOf = require('component-type');
        }

        /**
         * Types.
         */

        var types = [
          'arguments',
          'array',
          'boolean',
          'date',
          'element',
          'function',
          'null',
          'number',
          'object',
          'regexp',
          'string',
          'undefined'
        ];

        /**
         * Expose type checkers.
         *
         * @param {Mixed} value
         * @return {Boolean}
         */

        for (var i = 0, type; (type = types[i]); i++)
          exports[type] = generate(type);

        /**
         * Add alias for `function` for old browsers.
         */

        exports.fn = exports.function;

        /**
         * Expose `empty` check.
         */

        exports.empty = isEmpty;

        /**
         * Expose `nan` check.
         */

        exports.nan = function(val) {
          return exports.number(val) && val != val;
        };

        /**
         * Generate a type checker.
         *
         * @param {String} type
         * @return {Function}
         */

        function generate(type) {
          return function(value) {
            return type === typeOf(value);
          };
        }
      },
      { 'is-empty': 52, type: 53, 'component-type': 53 }
    ],
    25: [
      function(require, module, exports) {
        module.exports = function isMeta(e) {
          if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return true;

          // Logic that handles checks for the middle mouse button, based
          // on [jQuery](https://github.com/jquery/jquery/blob/master/src/event.js#L466).
          var which = e.which;
          var button = e.button;
          if (!which && button !== undefined) {
            return !button & 1 && !button & 2 && button & 4;
          }
          if (which === 2) {
            return true;
          }

          return false;
        };
      },
      {}
    ],
    26: [
      function(require, module, exports) {
        /**
         * HOP ref.
         */

        var has = Object.prototype.hasOwnProperty;

        /**
         * Return own keys in `obj`.
         *
         * @param {Object} obj
         * @return {Array}
         * @api public
         */

        exports.keys =
          Object.keys ||
          function(obj) {
            var keys = [];
            for (var key in obj) {
              if (has.call(obj, key)) {
                keys.push(key);
              }
            }
            return keys;
          };

        /**
         * Return own values in `obj`.
         *
         * @param {Object} obj
         * @return {Array}
         * @api public
         */

        exports.values = function(obj) {
          var vals = [];
          for (var key in obj) {
            if (has.call(obj, key)) {
              vals.push(obj[key]);
            }
          }
          return vals;
        };

        /**
         * Merge `b` into `a`.
         *
         * @param {Object} a
         * @param {Object} b
         * @return {Object} a
         * @api public
         */

        exports.merge = function(a, b) {
          for (var key in b) {
            if (has.call(b, key)) {
              a[key] = b[key];
            }
          }
          return a;
        };

        /**
         * Return length of `obj`.
         *
         * @param {Object} obj
         * @return {Number}
         * @api public
         */

        exports.length = function(obj) {
          return exports.keys(obj).length;
        };

        /**
         * Check if `obj` is empty.
         *
         * @param {Object} obj
         * @return {Boolean}
         * @api public
         */

        exports.isEmpty = function(obj) {
          return exports.length(obj) == 0;
        };
      },
      {}
    ],
    28: [
      function(require, module, exports) {
        /**
         * Module Dependencies.
         */

        var debug = require('debug')('analytics.js:normalize');
        var defaults = require('defaults');
        var each = require('each');
        var includes = require('includes');
        var is = require('is');
        var map = require('component/map');

        /**
         * HOP.
         */

        var has = Object.prototype.hasOwnProperty;

        /**
         * Expose `normalize`
         */

        module.exports = normalize;

        /**
         * Toplevel properties.
         */

        var toplevel = ['integrations', 'anonymousId', 'timestamp', 'context'];

        /**
         * Normalize `msg` based on integrations `list`.
         *
         * @param {Object} msg
         * @param {Array} list
         * @return {Function}
         */

        function normalize(msg, list) {
          var lower = map(list, function(s) {
            return s.toLowerCase();
          });
          var opts = msg.options || {};
          var integrations = opts.integrations || {};
          var providers = opts.providers || {};
          var context = opts.context || {};
          var ret = {};
          debug('<-', msg);

          // integrations.
          each(opts, function(key, value) {
            if (!integration(key)) return;
            if (!has.call(integrations, key)) integrations[key] = value;
            delete opts[key];
          });

          // providers.
          delete opts.providers;
          each(providers, function(key, value) {
            if (!integration(key)) return;
            if (is.object(integrations[key])) return;
            if (
              has.call(integrations, key) &&
              typeof providers[key] === 'boolean'
            )
              return;
            integrations[key] = value;
          });

          // move all toplevel options to msg
          // and the rest to context.
          each(opts, function(key) {
            if (includes(key, toplevel)) {
              ret[key] = opts[key];
            } else {
              context[key] = opts[key];
            }
          });

          // cleanup
          delete msg.options;
          ret.integrations = integrations;
          ret.context = context;
          ret = defaults(ret, msg);
          debug('->', ret);
          return ret;

          function integration(name) {
            return !!(
              includes(name, list) ||
              name.toLowerCase() === 'all' ||
              includes(name.toLowerCase(), lower)
            );
          }
        }
      },
      {
        debug: 19,
        defaults: 20,
        each: 21,
        includes: 77,
        is: 24,
        'component/map': 78
      }
    ],
    77: [
      function(require, module, exports) {
        'use strict';

        /**
         * Module dependencies.
         */

        // XXX: Hacky fix for duo not supporting scoped npm packages
        var each;
        try {
          each = require('@ndhoule/each');
        } catch (e) {
          each = require('each');
        }

        /**
         * String#indexOf reference.
         */

        var strIndexOf = String.prototype.indexOf;

        /**
         * Object.is/sameValueZero polyfill.
         *
         * @api private
         * @param {*} value1
         * @param {*} value2
         * @return {boolean}
         */

        // TODO: Move to library
        var sameValueZero = function sameValueZero(value1, value2) {
          // Normal values and check for 0 / -0
          if (value1 === value2) {
            return value1 !== 0 || 1 / value1 === 1 / value2;
          }
          // NaN
          return value1 !== value1 && value2 !== value2;
        };

        /**
         * Searches a given `collection` for a value, returning true if the collection
         * contains the value and false otherwise. Can search strings, arrays, and
         * objects.
         *
         * @name includes
         * @api public
         * @param {*} searchElement The element to search for.
         * @param {Object|Array|string} collection The collection to search.
         * @return {boolean}
         * @example
         * includes(2, [1, 2, 3]);
         * //=> true
         *
         * includes(4, [1, 2, 3]);
         * //=> false
         *
         * includes(2, { a: 1, b: 2, c: 3 });
         * //=> true
         *
         * includes('a', { a: 1, b: 2, c: 3 });
         * //=> false
         *
         * includes('abc', 'xyzabc opq');
         * //=> true
         *
         * includes('nope', 'xyzabc opq');
         * //=> false
         */
        var includes = function includes(searchElement, collection) {
          var found = false;

          // Delegate to String.prototype.indexOf when `collection` is a string
          if (typeof collection === 'string') {
            return strIndexOf.call(collection, searchElement) !== -1;
          }

          // Iterate through enumerable/own array elements and object properties.
          each(function(value) {
            if (sameValueZero(value, searchElement)) {
              found = true;
              // Exit iteration early when found
              return false;
            }
          }, collection);

          return found;
        };

        /**
         * Exports.
         */

        module.exports = includes;
      },
      { each: 71 }
    ],
    78: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var toFunction = require('to-function');

        /**
         * Map the given `arr` with callback `fn(val, i)`.
         *
         * @param {Array} arr
         * @param {Function} fn
         * @return {Array}
         * @api public
         */

        module.exports = function(arr, fn) {
          var ret = [];
          fn = toFunction(fn);
          for (var i = 0; i < arr.length; ++i) {
            ret.push(fn(arr[i], i));
          }
          return ret;
        };
      },
      { 'to-function': 79 }
    ],
    79: [
      function(require, module, exports) {
        /**
         * Module Dependencies
         */

        var expr;
        try {
          expr = require('props');
        } catch (e) {
          expr = require('component-props');
        }

        /**
         * Expose `toFunction()`.
         */

        module.exports = toFunction;

        /**
         * Convert `obj` to a `Function`.
         *
         * @param {Mixed} obj
         * @return {Function}
         * @api private
         */

        function toFunction(obj) {
          switch ({}.toString.call(obj)) {
            case '[object Object]':
              return objectToFunction(obj);
            case '[object Function]':
              return obj;
            case '[object String]':
              return stringToFunction(obj);
            case '[object RegExp]':
              return regexpToFunction(obj);
            default:
              return defaultToFunction(obj);
          }
        }

        /**
         * Default to strict equality.
         *
         * @param {Mixed} val
         * @return {Function}
         * @api private
         */

        function defaultToFunction(val) {
          return function(obj) {
            return val === obj;
          };
        }

        /**
         * Convert `re` to a function.
         *
         * @param {RegExp} re
         * @return {Function}
         * @api private
         */

        function regexpToFunction(re) {
          return function(obj) {
            return re.test(obj);
          };
        }

        /**
         * Convert property `str` to a function.
         *
         * @param {String} str
         * @return {Function}
         * @api private
         */

        function stringToFunction(str) {
          // immediate such as "> 20"
          if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);

          // properties such as "name.first" or "age > 18" or "age > 18 && age < 36"
          return new Function('_', 'return ' + get(str));
        }

        /**
         * Convert `object` to a function.
         *
         * @param {Object} object
         * @return {Function}
         * @api private
         */

        function objectToFunction(obj) {
          var match = {};
          for (var key in obj) {
            match[key] =
              typeof obj[key] === 'string'
                ? defaultToFunction(obj[key])
                : toFunction(obj[key]);
          }
          return function(val) {
            if (typeof val !== 'object') return false;
            for (var key in match) {
              if (!(key in val)) return false;
              if (!match[key](val[key])) return false;
            }
            return true;
          };
        }

        /**
         * Built the getter function. Supports getter style functions
         *
         * @param {String} str
         * @return {String}
         * @api private
         */

        function get(str) {
          var props = expr(str);
          if (!props.length) return '_.' + str;

          var val;
          var i;
          var prop;
          for (i = 0; i < props.length; i++) {
            prop = props[i];
            val = '_.' + prop;
            val =
              "('function' == typeof " +
              val +
              ' ? ' +
              val +
              '() : ' +
              val +
              ')';

            // mimic negative lookbehind to avoid problems with nested properties
            str = stripNested(prop, str, val);
          }

          return str;
        }

        /**
         * Mimic negative lookbehind to avoid problems with nested properties.
         *
         * See: http://blog.stevenlevithan.com/archives/mimic-lookbehind-javascript
         *
         * @param {String} prop
         * @param {String} str
         * @param {String} val
         * @return {String}
         * @api private
         */

        function stripNested(prop, str, val) {
          return str.replace(new RegExp('(\\.)?' + prop, 'g'), function(
            $0,
            $1
          ) {
            return $1 ? $0 : val;
          });
        }
      },
      { props: 80, 'component-props': 80 }
    ],
    80: [
      function(require, module, exports) {
        /**
         * Global Names
         */

        var globals = /\b(this|Array|Date|Object|Math|JSON)\b/g;

        /**
         * Return immediate identifiers parsed from `str`.
         *
         * @param {String} str
         * @param {String|Function} map function or prefix
         * @return {Array}
         * @api public
         */

        module.exports = function(str, fn) {
          var p = unique(props(str));
          if (fn && typeof fn === 'string') fn = prefixed(fn);
          if (fn) return map(str, p, fn);
          return p;
        };

        /**
         * Return immediate identifiers in `str`.
         *
         * @param {String} str
         * @return {Array}
         * @api private
         */

        function props(str) {
          return (
            str
              .replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
              .replace(globals, '')
              .match(/[$a-zA-Z_]\w*/g) || []
          );
        }

        /**
         * Return `str` with `props` mapped with `fn`.
         *
         * @param {String} str
         * @param {Array} props
         * @param {Function} fn
         * @return {String}
         * @api private
         */

        function map(str, props, fn) {
          var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
          return str.replace(re, function(_) {
            if (_[_.length - 1] == '(') return fn(_);
            if (!~props.indexOf(_)) return _;
            return fn(_);
          });
        }

        /**
         * Return unique array.
         *
         * @param {Array} arr
         * @return {Array}
         * @api private
         */

        function unique(arr) {
          var ret = [];

          for (var i = 0; i < arr.length; i++) {
            if (~ret.indexOf(arr[i])) continue;
            ret.push(arr[i]);
          }

          return ret;
        }

        /**
         * Map with prefix `str`.
         */

        function prefixed(str) {
          return function(_) {
            return str + _;
          };
        }
      },
      {}
    ],
    29: [
      function(require, module, exports) {
        /**
         * Bind `el` event `type` to `fn`.
         *
         * @param {Element} el
         * @param {String} type
         * @param {Function} fn
         * @param {Boolean} capture
         * @return {Function}
         * @api public
         */

        exports.bind = function(el, type, fn, capture) {
          if (el.addEventListener) {
            el.addEventListener(type, fn, capture || false);
          } else {
            el.attachEvent('on' + type, fn);
          }
          return fn;
        };

        /**
         * Unbind `el` event `type`'s callback `fn`.
         *
         * @param {Element} el
         * @param {String} type
         * @param {Function} fn
         * @param {Boolean} capture
         * @return {Function}
         * @api public
         */

        exports.unbind = function(el, type, fn, capture) {
          if (el.removeEventListener) {
            el.removeEventListener(type, fn, capture || false);
          } else {
            el.detachEvent('on' + type, fn);
          }
          return fn;
        };
      },
      {}
    ],
    30: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var canonical = require('canonical');
        var includes = require('includes');
        var url = require('url');

        /**
         * Return a default `options.context.page` object.
         *
         * https://segment.com/docs/spec/page/#properties
         *
         * @return {Object}
         */

        function pageDefaults() {
          return {
            path: canonicalPath(),
            referrer: document.referrer,
            search: location.search,
            title: document.title,
            url: canonicalUrl(location.search)
          };
        }

        /**
         * Return the canonical path for the page.
         *
         * @return {string}
         */

        function canonicalPath() {
          var canon = canonical();
          if (!canon) return window.location.pathname;
          var parsed = url.parse(canon);
          return parsed.pathname;
        }

        /**
         * Return the canonical URL for the page concat the given `search`
         * and strip the hash.
         *
         * @param {string} search
         * @return {string}
         */

        function canonicalUrl(search) {
          var canon = canonical();
          if (canon) return includes('?', canon) ? canon : canon + search;
          var url = window.location.href;
          var i = url.indexOf('#');
          return i === -1 ? url : url.slice(0, i);
        }

        /**
         * Exports.
         */

        module.exports = pageDefaults;
      },
      { canonical: 81, includes: 77, url: 82 }
    ],
    81: [
      function(require, module, exports) {
        module.exports = function canonical() {
          var tags = document.getElementsByTagName('link');
          for (var i = 0, tag; (tag = tags[i]); i++) {
            if (tag.getAttribute('rel') == 'canonical')
              return tag.getAttribute('href');
          }
        };
      },
      {}
    ],
    82: [
      function(require, module, exports) {
        /**
         * Parse the given `url`.
         *
         * @param {String} str
         * @return {Object}
         * @api public
         */

        exports.parse = function(url) {
          var a = document.createElement('a');
          a.href = url;
          return {
            href: a.href,
            host: a.host || location.host,
            port: a.port === '0' || a.port === '' ? port(a.protocol) : a.port,
            hash: a.hash,
            hostname: a.hostname || location.hostname,
            pathname:
              a.pathname.charAt(0) != '/' ? '/' + a.pathname : a.pathname,
            protocol:
              !a.protocol || a.protocol == ':' ? location.protocol : a.protocol,
            search: a.search,
            query: a.search.slice(1)
          };
        };

        /**
         * Check if `url` is absolute.
         *
         * @param {String} url
         * @return {Boolean}
         * @api public
         */

        exports.isAbsolute = function(url) {
          return url.indexOf('//') == 0 || !!~url.indexOf('://');
        };

        /**
         * Check if `url` is relative.
         *
         * @param {String} url
         * @return {Boolean}
         * @api public
         */

        exports.isRelative = function(url) {
          return !exports.isAbsolute(url);
        };

        /**
         * Check if `url` is cross domain.
         *
         * @param {String} url
         * @return {Boolean}
         * @api public
         */

        exports.isCrossDomain = function(url) {
          url = exports.parse(url);
          var location = exports.parse(window.location.href);
          return (
            url.hostname !== location.hostname ||
            url.port !== location.port ||
            url.protocol !== location.protocol
          );
        };

        /**
         * Return default port for `protocol`.
         *
         * @param  {String} protocol
         * @return {String}
         * @api private
         */
        function port(protocol) {
          switch (protocol) {
            case 'http:':
              return 80;
            case 'https:':
              return 443;
            default:
              return location.port;
          }
        }
      },
      {}
    ],
    31: [
      function(require, module, exports) {
        'use strict';

        var objToString = Object.prototype.toString;

        // TODO: Move to lib
        var existy = function(val) {
          return val != null;
        };

        // TODO: Move to lib
        var isArray = function(val) {
          return objToString.call(val) === '[object Array]';
        };

        // TODO: Move to lib
        var isString = function(val) {
          return (
            typeof val === 'string' ||
            objToString.call(val) === '[object String]'
          );
        };

        // TODO: Move to lib
        var isObject = function(val) {
          return val != null && typeof val === 'object';
        };

        /**
         * Returns a copy of the new `object` containing only the specified properties.
         *
         * @name pick
         * @api public
         * @category Object
         * @see {@link omit}
         * @param {Array.<string>|string} props The property or properties to keep.
         * @param {Object} object The object to iterate over.
         * @return {Object} A new object containing only the specified properties from `object`.
         * @example
         * var person = { name: 'Tim', occupation: 'enchanter', fears: 'rabbits' };
         *
         * pick('name', person);
         * //=> { name: 'Tim' }
         *
         * pick(['name', 'fears'], person);
         * //=> { name: 'Tim', fears: 'rabbits' }
         */

        var pick = function pick(props, object) {
          if (!existy(object) || !isObject(object)) {
            return {};
          }

          if (isString(props)) {
            props = [props];
          }

          if (!isArray(props)) {
            props = [];
          }

          var result = {};

          for (var i = 0; i < props.length; i += 1) {
            if (isString(props[i]) && props[i] in object) {
              result[props[i]] = object[props[i]];
            }
          }

          return result;
        };

        /**
         * Exports.
         */

        module.exports = pick;
      },
      {}
    ],
    32: [
      function(require, module, exports) {
        /**
         * prevent default on the given `e`.
         *
         * examples:
         *
         *      anchor.onclick = prevent;
         *      anchor.onclick = function(e){
         *        if (something) return prevent(e);
         *      };
         *
         * @param {Event} e
         */

        module.exports = function(e) {
          e = e || window.event;
          return e.preventDefault
            ? e.preventDefault()
            : (e.returnValue = false);
        };
      },
      {}
    ],
    33: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var trim = require('trim');
        var type = require('type');

        var pattern = /(\w+)\[(\d+)\]/;

        /**
         * Safely encode the given string
         *
         * @param {String} str
         * @return {String}
         * @api private
         */

        var encode = function(str) {
          try {
            return encodeURIComponent(str);
          } catch (e) {
            return str;
          }
        };

        /**
         * Safely decode the string
         *
         * @param {String} str
         * @return {String}
         * @api private
         */

        var decode = function(str) {
          try {
            return decodeURIComponent(str.replace(/\+/g, ' '));
          } catch (e) {
            return str;
          }
        };

        /**
         * Parse the given query `str`.
         *
         * @param {String} str
         * @return {Object}
         * @api public
         */

        exports.parse = function(str) {
          if (typeof str !== 'string') return {};

          str = trim(str);
          if (str == '') return {};
          if (str.charAt(0) == '?') str = str.slice(1);

          var obj = {};
          var pairs = str.split('&');
          for (var i = 0; i < pairs.length; i++) {
            var parts = pairs[i].split('=');
            var key = decode(parts[0]);
            var m;

            if ((m = pattern.exec(key))) {
              obj[m[1]] = obj[m[1]] || [];
              obj[m[1]][m[2]] = decode(parts[1]);
              continue;
            }

            obj[parts[0]] = parts[1] == null ? '' : decode(parts[1]);
          }

          return obj;
        };

        /**
         * Stringify the given `obj`.
         *
         * @param {Object} obj
         * @return {String}
         * @api public
         */

        exports.stringify = function(obj) {
          if (!obj) return '';
          var pairs = [];

          for (var key in obj) {
            var value = obj[key];

            if (type(value) == 'array') {
              for (var i = 0; i < value.length; ++i) {
                pairs.push(
                  encode(key + '[' + i + ']') + '=' + encode(value[i])
                );
              }
              continue;
            }

            pairs.push(encode(key) + '=' + encode(obj[key]));
          }

          return pairs.join('&');
        };
      },
      { trim: 60, type: 83 }
    ],
    83: [
      function(require, module, exports) {
        /**
         * toString ref.
         */

        var toString = Object.prototype.toString;

        /**
         * Return the type of `val`.
         *
         * @param {Mixed} val
         * @return {String}
         * @api public
         */

        module.exports = function(val) {
          switch (toString.call(val)) {
            case '[object Date]':
              return 'date';
            case '[object RegExp]':
              return 'regexp';
            case '[object Arguments]':
              return 'arguments';
            case '[object Array]':
              return 'array';
            case '[object Error]':
              return 'error';
          }

          if (val === null) return 'null';
          if (val === undefined) return 'undefined';
          if (val !== val) return 'nan';
          if (val && val.nodeType === 1) return 'element';

          val = val.valueOf
            ? val.valueOf()
            : Object.prototype.valueOf.apply(val);

          return typeof val;
        };
      },
      {}
    ],
    35: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var Entity = require('./entity');
        var bindAll = require('bind-all');
        var cookie = require('./cookie');
        var debug = require('debug')('analytics:user');
        var inherit = require('inherit');
        var rawCookie = require('cookie');
        var uuid = require('uuid');

        /**
         * User defaults
         */

        User.defaults = {
          persist: true,
          cookie: {
            key: 'ajs_user_id',
            oldKey: 'ajs_user'
          },
          localStorage: {
            key: 'ajs_user_traits'
          }
        };

        /**
         * Initialize a new `User` with `options`.
         *
         * @param {Object} options
         */

        function User(options) {
          this.defaults = User.defaults;
          this.debug = debug;
          Entity.call(this, options);
        }

        /**
         * Inherit `Entity`
         */

        inherit(User, Entity);

        /**
         * Set/get the user id.
         *
         * When the user id changes, the method will reset his anonymousId to a new one.
         *
         * // FIXME: What are the mixed types?
         * @param {string} id
         * @return {Mixed}
         * @example
         * // didn't change because the user didn't have previous id.
         * anonymousId = user.anonymousId();
         * user.id('foo');
         * assert.equal(anonymousId, user.anonymousId());
         *
         * // didn't change because the user id changed to null.
         * anonymousId = user.anonymousId();
         * user.id('foo');
         * user.id(null);
         * assert.equal(anonymousId, user.anonymousId());
         *
         * // change because the user had previous id.
         * anonymousId = user.anonymousId();
         * user.id('foo');
         * user.id('baz'); // triggers change
         * user.id('baz'); // no change
         * assert.notEqual(anonymousId, user.anonymousId());
         */

        User.prototype.id = function(id) {
          var prev = this._getId();
          var ret = Entity.prototype.id.apply(this, arguments);
          if (prev == null) return ret;
          // FIXME: We're relying on coercion here (1 == "1"), but our API treats these
          // two values differently. Figure out what will break if we remove this and
          // change to strict equality
          /* eslint-disable eqeqeq */
          if (prev != id && id) this.anonymousId(null);
          /* eslint-enable eqeqeq */
          return ret;
        };

        /**
         * Set / get / remove anonymousId.
         *
         * @param {String} anonymousId
         * @return {String|User}
         */

        User.prototype.anonymousId = function(anonymousId) {
          var store = this.storage();

          // set / remove
          if (arguments.length) {
            store.set('ajs_anonymous_id', anonymousId);
            return this;
          }

          // new
          anonymousId = store.get('ajs_anonymous_id');
          if (anonymousId) {
            return anonymousId;
          }

          // old - it is not stringified so we use the raw cookie.
          anonymousId = rawCookie('_sio');
          if (anonymousId) {
            anonymousId = anonymousId.split('----')[0];
            store.set('ajs_anonymous_id', anonymousId);
            store.remove('_sio');
            return anonymousId;
          }

          // empty
          anonymousId = uuid();
          store.set('ajs_anonymous_id', anonymousId);
          return store.get('ajs_anonymous_id');
        };

        /**
         * Remove anonymous id on logout too.
         */

        User.prototype.logout = function() {
          Entity.prototype.logout.call(this);
          this.anonymousId(null);
        };

        /**
         * Load saved user `id` or `traits` from storage.
         */

        User.prototype.load = function() {
          if (this._loadOldCookie()) return;
          Entity.prototype.load.call(this);
        };

        /**
         * BACKWARDS COMPATIBILITY: Load the old user from the cookie.
         *
         * @api private
         * @return {boolean}
         */

        User.prototype._loadOldCookie = function() {
          var user = cookie.get(this._options.cookie.oldKey);
          if (!user) return false;

          this.id(user.id);
          this.traits(user.traits);
          cookie.remove(this._options.cookie.oldKey);
          return true;
        };

        /**
         * Expose the user singleton.
         */

        module.exports = bindAll(new User());

        /**
         * Expose the `User` constructor.
         */

        module.exports.User = User;
      },
      {
        './entity': 73,
        'bind-all': 15,
        './cookie': 18,
        debug: 19,
        inherit: 74,
        cookie: 63,
        uuid: 84
      }
    ],
    84: [
      function(require, module, exports) {
        /**
         * Taken straight from jed's gist: https://gist.github.com/982883
         *
         * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
         * where each x is replaced with a random hexadecimal digit from 0 to f, and
         * y is replaced with a random hexadecimal digit from 8 to b.
         */

        module.exports = function uuid(a) {
          return a // if the placeholder was passed, return
            ? // a random number from 0 to 15
              (
                a ^ // unless b is 8,
                ((Math.random() * // in which case
                  16) >> // a random number from
                  (a / 4))
              ) // 8 to 11
                .toString(16) // in hexadecimal
            : // or otherwise a concatenated string:
              (
                [1e7] + // 10000000 +
                -1e3 + // -1000 +
                -4e3 + // -4000 +
                -8e3 + // -80000000 +
                -1e11
              ) // -100000000000,
                .replace(
                  // replacing
                  /[018]/g, // zeroes, ones, and eights with
                  uuid // random hex digits
                );
        };
      },
      {}
    ],
    11: [
      function(require, module, exports) {
        module.exports = {
          name: 'analytics-core',
          version: '2.11.1',
          main: 'analytics.js',
          dependencies: {},
          devDependencies: {}
        };
      },
      {}
    ],
    6: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var bind = require('bind');
        var clone = require('clone');
        var debug = require('debug');
        var defaults = require('defaults');
        var extend = require('extend');
        var slug = require('slug');
        var protos = require('./protos');
        var statics = require('./statics');

        /**
         * Create a new `Integration` constructor.
         *
         * @constructs Integration
         * @param {string} name
         * @return {Function} Integration
         */

        function createIntegration(name) {
          /**
           * Initialize a new `Integration`.
           *
           * @class
           * @param {Object} options
           */

          function Integration(options) {
            if (options && options.addIntegration) {
              // plugin
              return options.addIntegration(Integration);
            }
            this.debug = debug('analytics:integration:' + slug(name));
            this.options = defaults(clone(options) || {}, this.defaults);
            this._queue = [];
            this.once('ready', bind(this, this.flush));

            Integration.emit('construct', this);
            this.ready = bind(this, this.ready);
            this._wrapInitialize();
            this._wrapPage();
            this._wrapTrack();
          }

          Integration.prototype.defaults = {};
          Integration.prototype.globals = [];
          Integration.prototype.templates = {};
          Integration.prototype.name = name;
          extend(Integration, statics);
          extend(Integration.prototype, protos);

          return Integration;
        }

        /**
         * Exports.
         */

        module.exports = createIntegration;
      },
      {
        bind: 61,
        clone: 17,
        debug: 85,
        defaults: 20,
        extend: 86,
        slug: 87,
        './protos': 88,
        './statics': 89
      }
    ],
    85: [
      function(require, module, exports) {
        if (typeof window === 'undefined') {
          module.exports = require('./lib/debug');
        } else {
          module.exports = require('./debug');
        }
      },
      { './lib/debug': 90, './debug': 91 }
    ],
    90: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var tty = require('tty');

        /**
         * Expose `debug()` as the module.
         */

        module.exports = debug;

        /**
         * Enabled debuggers.
         */

        var names = [];
        var skips = [];

        (process.env.DEBUG || '').split(/[\s,]+/).forEach(function(name) {
          name = name.replace('*', '.*?');
          if (name[0] === '-') {
            skips.push(new RegExp('^' + name.substr(1) + '$'));
          } else {
            names.push(new RegExp('^' + name + '$'));
          }
        });

        /**
         * Colors.
         */

        var colors = [6, 2, 3, 4, 5, 1];

        /**
         * Previous debug() call.
         */

        var prev = {};

        /**
         * Previously assigned color.
         */

        var prevColor = 0;

        /**
         * Is stdout a TTY? Colored output is disabled when `true`.
         */

        var isatty = tty.isatty(2);

        /**
         * Select a color.
         *
         * @return {Number}
         * @api private
         */

        function color() {
          return colors[prevColor++ % colors.length];
        }

        /**
         * Humanize the given `ms`.
         *
         * @param {Number} m
         * @return {String}
         * @api private
         */

        function humanize(ms) {
          var sec = 1000;
          var min = 60 * 1000;
          var hour = 60 * min;

          if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
          if (ms >= min) return (ms / min).toFixed(1) + 'm';
          if (ms >= sec) return ((ms / sec) | 0) + 's';
          return ms + 'ms';
        }

        /**
         * Create a debugger with the given `name`.
         *
         * @param {String} name
         * @return {Type}
         * @api public
         */

        function debug(name) {
          function disabled() {}
          disabled.enabled = false;

          var match = skips.some(function(re) {
            return re.test(name);
          });

          if (match) return disabled;

          match = names.some(function(re) {
            return re.test(name);
          });

          if (!match) return disabled;
          var c = color();

          function colored(fmt) {
            fmt = coerce(fmt);

            var curr = new Date();
            var ms = curr - (prev[name] || curr);
            prev[name] = curr;

            fmt =
              '  \u001b[9' +
              c +
              'm' +
              name +
              ' ' +
              '\u001b[3' +
              c +
              'm\u001b[90m' +
              fmt +
              '\u001b[3' +
              c +
              'm' +
              ' +' +
              humanize(ms) +
              '\u001b[0m';

            console.error.apply(this, arguments);
          }

          function plain(fmt) {
            fmt = coerce(fmt);

            fmt = new Date().toUTCString() + ' ' + name + ' ' + fmt;
            console.error.apply(this, arguments);
          }

          colored.enabled = plain.enabled = true;

          return isatty || process.env.DEBUG_COLORS ? colored : plain;
        }

        /**
         * Coerce `val`.
         */

        function coerce(val) {
          if (val instanceof Error) return val.stack || val.message;
          return val;
        }
      },
      {}
    ],
    91: [
      function(require, module, exports) {
        /**
         * Expose `debug()` as the module.
         */

        module.exports = debug;

        /**
         * Create a debugger with the given `name`.
         *
         * @param {String} name
         * @return {Type}
         * @api public
         */

        function debug(name) {
          if (!debug.enabled(name)) return function() {};

          return function(fmt) {
            fmt = coerce(fmt);

            var curr = new Date();
            var ms = curr - (debug[name] || curr);
            debug[name] = curr;

            fmt = name + ' ' + fmt + ' +' + debug.humanize(ms);

            // This hackery is required for IE8
            // where `console.log` doesn't have 'apply'
            window.console &&
              console.log &&
              Function.prototype.apply.call(console.log, console, arguments);
          };
        }

        /**
         * The currently active debug mode names.
         */

        debug.names = [];
        debug.skips = [];

        /**
         * Enables a debug mode by name. This can include modes
         * separated by a colon and wildcards.
         *
         * @param {String} name
         * @api public
         */

        debug.enable = function(name) {
          try {
            localStorage.debug = name;
          } catch (e) {}

          var split = (name || '').split(/[\s,]+/);
          var len = split.length;

          for (var i = 0; i < len; i++) {
            name = split[i].replace('*', '.*?');
            if (name[0] === '-') {
              debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
            } else {
              debug.names.push(new RegExp('^' + name + '$'));
            }
          }
        };

        /**
         * Disable debug output.
         *
         * @api public
         */

        debug.disable = function() {
          debug.enable('');
        };

        /**
         * Humanize the given `ms`.
         *
         * @param {Number} m
         * @return {String}
         * @api private
         */

        debug.humanize = function(ms) {
          var sec = 1000;
          var min = 60 * 1000;
          var hour = 60 * min;

          if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
          if (ms >= min) return (ms / min).toFixed(1) + 'm';
          if (ms >= sec) return ((ms / sec) | 0) + 's';
          return ms + 'ms';
        };

        /**
         * Returns true if the given mode name is enabled, false otherwise.
         *
         * @param {String} name
         * @return {Boolean}
         * @api public
         */

        debug.enabled = function(name) {
          for (var i = 0, len = debug.skips.length; i < len; i++) {
            if (debug.skips[i].test(name)) {
              return false;
            }
          }
          for (var i = 0, len = debug.names.length; i < len; i++) {
            if (debug.names[i].test(name)) {
              return true;
            }
          }
          return false;
        };

        /**
         * Coerce `val`.
         */

        function coerce(val) {
          if (val instanceof Error) return val.stack || val.message;
          return val;
        }

        // persist

        try {
          if (window.localStorage) debug.enable(localStorage.debug);
        } catch (e) {}
      },
      {}
    ],
    86: [
      function(require, module, exports) {
        module.exports = function extend(object) {
          // Takes an unlimited number of extenders.
          var args = Array.prototype.slice.call(arguments, 1);

          // For each extender, copy their properties on our object.
          for (var i = 0, source; (source = args[i]); i++) {
            if (!source) continue;
            for (var property in source) {
              object[property] = source[property];
            }
          }

          return object;
        };
      },
      {}
    ],
    87: [
      function(require, module, exports) {
        /**
         * Generate a slug from the given `str`.
         *
         * example:
         *
         *        generate('foo bar');
         *        // > foo-bar
         *
         * @param {String} str
         * @param {Object} options
         * @config {String|RegExp} [replace] characters to replace, defaulted to `/[^a-z0-9]/g`
         * @config {String} [separator] separator to insert, defaulted to `-`
         * @return {String}
         */

        module.exports = function(str, options) {
          options || (options = {});
          return str
            .toLowerCase()
            .replace(options.replace || /[^a-z0-9]/g, ' ')
            .replace(/^ +| +$/g, '')
            .replace(/ +/g, options.separator || '-');
        };
      },
      {}
    ],
    88: [
      function(require, module, exports) {
        /* global setInterval:true setTimeout:true */

        /**
         * Module dependencies.
         */

        var Emitter = require('emitter');
        var after = require('after');
        var each = require('each');
        var events = require('analytics-events');
        var fmt = require('fmt');
        var foldl = require('foldl');
        var loadIframe = require('load-iframe');
        var loadScript = require('load-script');
        var normalize = require('to-no-case');
        var nextTick = require('next-tick');
        var every = require('every');
        var is = require('is');

        /**
         * Noop.
         */

        function noop() {}

        /**
         * hasOwnProperty reference.
         */

        var has = Object.prototype.hasOwnProperty;

        /**
         * Window defaults.
         */

        var onerror = window.onerror;
        var onload = null;
        var setInterval = window.setInterval;
        var setTimeout = window.setTimeout;

        /**
         * Mixin emitter.
         */

        /* eslint-disable new-cap */
        Emitter(exports);
        /* eslint-enable new-cap */

        /**
         * Initialize.
         */

        exports.initialize = function() {
          var ready = this.ready;
          nextTick(ready);
        };

        /**
         * Loaded?
         *
         * @api private
         * @return {boolean}
         */

        exports.loaded = function() {
          return false;
        };

        /**
         * Page.
         *
         * @api public
         * @param {Page} page
         */

        /* eslint-disable no-unused-vars */
        exports.page = function(page) {};
        /* eslint-enable no-unused-vars */

        /**
         * Track.
         *
         * @api public
         * @param {Track} track
         */

        /* eslint-disable no-unused-vars */
        exports.track = function(track) {};
        /* eslint-enable no-unused-vars */

        /**
         * Get values from items in `options` that are mapped to `key`.
         * `options` is an integration setting which is a collection
         * of type 'map', 'array', or 'mixed'
         *
         * Use cases include mapping events to pixelIds (map), sending generic
         * conversion pixels only for specific events (array), or configuring dynamic
         * mappings of event properties to query string parameters based on event (mixed)
         *
         * @api public
         * @param {Object|Object[]|String[]} options An object, array of objects, or
         * array of strings pulled from settings.mapping.
         * @param {string} key The name of the item in options whose metadata
         * we're looking for.
         * @return {Array} An array of settings that match the input `key` name.
         * @example
         *
         * // 'Map'
         * var events = { my_event: 'a4991b88' };
         * .map(events, 'My Event');
         * // => ["a4991b88"]
         * .map(events, 'whatever');
         * // => []
         *
         * // 'Array'
         * * var events = ['Completed Order', 'My Event'];
         * .map(events, 'My Event');
         * // => ["My Event"]
         * .map(events, 'whatever');
         * // => []
         *
         * // 'Mixed'
         * var events = [{ key: 'my event', value: '9b5eb1fa' }];
         * .map(events, 'my_event');
         * // => ["9b5eb1fa"]
         * .map(events, 'whatever');
         * // => []
         */

        exports.map = function(options, key) {
          var normalizedComparator = normalize(key);
          var mappingType = getMappingType(options);

          if (mappingType === 'unknown') {
            return [];
          }

          return foldl(
            function(matchingValues, val, key) {
              var compare;
              var result;

              if (mappingType === 'map') {
                compare = key;
                result = val;
              }

              if (mappingType === 'array') {
                compare = val;
                result = val;
              }

              if (mappingType === 'mixed') {
                compare = val.key;
                result = val.value;
              }

              if (normalize(compare) === normalizedComparator) {
                matchingValues.push(result);
              }

              return matchingValues;
            },
            [],
            options
          );
        };

        /**
         * Invoke a `method` that may or may not exist on the prototype with `args`,
         * queueing or not depending on whether the integration is "ready". Don't
         * trust the method call, since it contains integration party code.
         *
         * @api private
         * @param {string} method
         * @param {...*} args
         */

        exports.invoke = function(method) {
          if (!this[method]) return;
          var args = Array.prototype.slice.call(arguments, 1);
          if (!this._ready) return this.queue(method, args);
          var ret;

          try {
            this.debug('%s with %o', method, args);
            ret = this[method].apply(this, args);
          } catch (e) {
            this.debug('error %o calling %s with %o', e, method, args);
          }

          return ret;
        };

        /**
         * Queue a `method` with `args`. If the integration assumes an initial
         * pageview, then let the first call to `page` pass through.
         *
         * @api private
         * @param {string} method
         * @param {Array} args
         */

        exports.queue = function(method, args) {
          if (
            method === 'page' &&
            this._assumesPageview &&
            !this._initialized
          ) {
            return this.page.apply(this, args);
          }

          this._queue.push({ method: method, args: args });
        };

        /**
         * Flush the internal queue.
         *
         * @api private
         */

        exports.flush = function() {
          this._ready = true;
          var self = this;

          each(this._queue, function(call) {
            self[call.method].apply(self, call.args);
          });

          // Empty the queue.
          this._queue.length = 0;
        };

        /**
         * Reset the integration, removing its global variables.
         *
         * @api private
         */

        exports.reset = function() {
          for (var i = 0; i < this.globals.length; i++) {
            window[this.globals[i]] = undefined;
          }

          window.setTimeout = setTimeout;
          window.setInterval = setInterval;
          window.onerror = onerror;
          window.onload = onload;
        };

        /**
         * Load a tag by `name`.
         *
         * @param {string} name The name of the tag.
         * @param {Object} locals Locals used to populate the tag's template variables
         * (e.g. `userId` in '<img src="https://whatever.com/{{ userId }}">').
         * @param {Function} [callback=noop] A callback, invoked when the tag finishes
         * loading.
         */

        exports.load = function(name, locals, callback) {
          // Argument shuffling
          if (typeof name === 'function') {
            callback = name;
            locals = null;
            name = null;
          }
          if (name && typeof name === 'object') {
            callback = locals;
            locals = name;
            name = null;
          }
          if (typeof locals === 'function') {
            callback = locals;
            locals = null;
          }

          // Default arguments
          name = name || 'library';
          locals = locals || {};

          locals = this.locals(locals);
          var template = this.templates[name];
          if (!template)
            throw new Error(fmt('template "%s" not defined.', name));
          var attrs = render(template, locals);
          callback = callback || noop;
          var self = this;
          var el;

          switch (template.type) {
            case 'img':
              attrs.width = 1;
              attrs.height = 1;
              el = loadImage(attrs, callback);
              break;
            case 'script':
              el = loadScript(attrs, function(err) {
                if (!err) return callback();
                self.debug('error loading "%s" error="%s"', self.name, err);
              });
              // TODO: hack until refactoring load-script
              delete attrs.src;
              each(attrs, function(key, val) {
                el.setAttribute(key, val);
              });
              break;
            case 'iframe':
              el = loadIframe(attrs, callback);
              break;
            default:
            // No default case
          }

          return el;
        };

        /**
         * Locals for tag templates.
         *
         * By default it includes a cache buster and all of the options.
         *
         * @param {Object} [locals]
         * @return {Object}
         */

        exports.locals = function(locals) {
          locals = locals || {};
          var cache = Math.floor(new Date().getTime() / 3600000);
          if (!locals.hasOwnProperty('cache')) locals.cache = cache;
          each(this.options, function(key, val) {
            if (!locals.hasOwnProperty(key)) locals[key] = val;
          });
          return locals;
        };

        /**
         * Simple way to emit ready.
         *
         * @api public
         */

        exports.ready = function() {
          this.emit('ready');
        };

        /**
         * Wrap the initialize method in an exists check, so we don't have to do it for
         * every single integration.
         *
         * @api private
         */

        exports._wrapInitialize = function() {
          var initialize = this.initialize;
          this.initialize = function() {
            this.debug('initialize');
            this._initialized = true;
            var ret = initialize.apply(this, arguments);
            this.emit('initialize');
            return ret;
          };

          if (this._assumesPageview)
            this.initialize = after(2, this.initialize);
        };

        /**
         * Wrap the page method to call `initialize` instead if the integration assumes
         * a pageview.
         *
         * @api private
         */

        exports._wrapPage = function() {
          var page = this.page;
          this.page = function() {
            if (this._assumesPageview && !this._initialized) {
              return this.initialize.apply(this, arguments);
            }

            return page.apply(this, arguments);
          };
        };

        /**
         * Wrap the track method to call other ecommerce methods if available depending
         * on the `track.event()`.
         *
         * @api private
         */

        exports._wrapTrack = function() {
          var t = this.track;
          this.track = function(track) {
            var event = track.event();
            var called;
            var ret;

            for (var method in events) {
              if (has.call(events, method)) {
                var regexp = events[method];
                if (!this[method]) continue;
                if (!regexp.test(event)) continue;
                ret = this[method].apply(this, arguments);
                called = true;
                break;
              }
            }

            if (!called) ret = t.apply(this, arguments);
            return ret;
          };
        };

        /**
         * Determine the type of the option passed to `#map`
         *
         * @api private
         * @param {Object|Object[]} mapping
         * @return {String} mappingType
         */

        function getMappingType(mapping) {
          if (is.array(mapping)) {
            return every(isMixed, mapping) ? 'mixed' : 'array';
          }
          if (is.object(mapping)) return 'map';
          return 'unknown';
        }

        /**
         * Determine if item in mapping array is a valid "mixed" type value
         *
         * Must be an object with properties "key" (of type string)
         * and "value" (of any type)
         *
         * @api private
         * @param {*} item
         * @return {Boolean}
         */

        function isMixed(item) {
          if (!is.object(item)) return false;
          if (!is.string(item.key)) return false;
          if (!has.call(item, 'value')) return false;
          return true;
        }

        /**
         * TODO: Document me
         *
         * @api private
         * @param {Object} attrs
         * @param {Function} fn
         * @return {Image}
         */

        function loadImage(attrs, fn) {
          fn = fn || function() {};
          var img = new Image();
          img.onerror = error(fn, 'failed to load pixel', img);
          img.onload = function() {
            fn();
          };
          img.src = attrs.src;
          img.width = 1;
          img.height = 1;
          return img;
        }

        /**
         * TODO: Document me
         *
         * @api private
         * @param {Function} fn
         * @param {string} message
         * @param {Element} img
         * @return {Function}
         */

        function error(fn, message, img) {
          return function(e) {
            e = e || window.event;
            var err = new Error(message);
            err.event = e;
            err.source = img;
            fn(err);
          };
        }

        /**
         * Render template + locals into an `attrs` object.
         *
         * @api private
         * @param {Object} template
         * @param {Object} locals
         * @return {Object}
         */

        function render(template, locals) {
          return foldl(
            function(attrs, val, key) {
              attrs[key] = val.replace(/\{\{\ *(\w+)\ *\}\}/g, function(_, $1) {
                return locals[$1];
              });
              return attrs;
            },
            {},
            template.attrs
          );
        }
      },
      {
        emitter: 12,
        after: 14,
        each: 92,
        'analytics-events': 93,
        fmt: 94,
        foldl: 22,
        'load-iframe': 95,
        'load-script': 96,
        'to-no-case': 97,
        'next-tick': 62,
        every: 98,
        is: 99
      }
    ],
    92: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        try {
          var type = require('type');
        } catch (err) {
          var type = require('component-type');
        }

        var toFunction = require('to-function');

        /**
         * HOP reference.
         */

        var has = Object.prototype.hasOwnProperty;

        /**
         * Iterate the given `obj` and invoke `fn(val, i)`
         * in optional context `ctx`.
         *
         * @param {String|Array|Object} obj
         * @param {Function} fn
         * @param {Object} [ctx]
         * @api public
         */

        module.exports = function(obj, fn, ctx) {
          fn = toFunction(fn);
          ctx = ctx || this;
          switch (type(obj)) {
            case 'array':
              return array(obj, fn, ctx);
            case 'object':
              if (typeof obj.length === 'number') return array(obj, fn, ctx);
              return object(obj, fn, ctx);
            case 'string':
              return string(obj, fn, ctx);
          }
        };

        /**
         * Iterate string chars.
         *
         * @param {String} obj
         * @param {Function} fn
         * @param {Object} ctx
         * @api private
         */

        function string(obj, fn, ctx) {
          for (var i = 0; i < obj.length; ++i) {
            fn.call(ctx, obj.charAt(i), i);
          }
        }

        /**
         * Iterate object keys.
         *
         * @param {Object} obj
         * @param {Function} fn
         * @param {Object} ctx
         * @api private
         */

        function object(obj, fn, ctx) {
          for (var key in obj) {
            if (has.call(obj, key)) {
              fn.call(ctx, key, obj[key]);
            }
          }
        }

        /**
         * Iterate array-ish.
         *
         * @param {Array|Object} obj
         * @param {Function} fn
         * @param {Object} ctx
         * @api private
         */

        function array(obj, fn, ctx) {
          for (var i = 0; i < obj.length; ++i) {
            fn.call(ctx, obj[i], i);
          }
        }
      },
      { type: 100, 'component-type': 100, 'to-function': 79 }
    ],
    100: [
      function(require, module, exports) {
        /**
         * toString ref.
         */

        var toString = Object.prototype.toString;

        /**
         * Return the type of `val`.
         *
         * @param {Mixed} val
         * @return {String}
         * @api public
         */

        module.exports = function(val) {
          switch (toString.call(val)) {
            case '[object Function]':
              return 'function';
            case '[object Date]':
              return 'date';
            case '[object RegExp]':
              return 'regexp';
            case '[object Arguments]':
              return 'arguments';
            case '[object Array]':
              return 'array';
            case '[object String]':
              return 'string';
          }

          if (val === null) return 'null';
          if (val === undefined) return 'undefined';
          if (val && val.nodeType === 1) return 'element';
          if (val === Object(val)) return 'object';

          return typeof val;
        };
      },
      {}
    ],
    93: [
      function(require, module, exports) {
        module.exports = {
          removedProduct: /^[ _]?removed[ _]?product[ _]?$/i,
          viewedProduct: /^[ _]?viewed[ _]?product[ _]?$/i,
          viewedProductCategory: /^[ _]?viewed[ _]?product[ _]?category[ _]?$/i,
          addedProduct: /^[ _]?added[ _]?product[ _]?$/i,
          completedOrder: /^[ _]?completed[ _]?order[ _]?$/i,
          startedOrder: /^[ _]?started[ _]?order[ _]?$/i,
          updatedOrder: /^[ _]?updated[ _]?order[ _]?$/i,
          refundedOrder: /^[ _]?refunded?[ _]?order[ _]?$/i,
          viewedProductDetails: /^[ _]?viewed[ _]?product[ _]?details?[ _]?$/i,
          clickedProduct: /^[ _]?clicked[ _]?product[ _]?$/i,
          viewedPromotion: /^[ _]?viewed[ _]?promotion?[ _]?$/i,
          clickedPromotion: /^[ _]?clicked[ _]?promotion?[ _]?$/i,
          viewedCheckoutStep: /^[ _]?viewed[ _]?checkout[ _]?step[ _]?$/i,
          completedCheckoutStep: /^[ _]?completed[ _]?checkout[ _]?step[ _]?$/i
        };
      },
      {}
    ],
    94: [
      function(require, module, exports) {
        /**
         * toString.
         */

        var toString = window.JSON
          ? JSON.stringify
          : function(_) {
              return String(_);
            };

        /**
         * Export `fmt`
         */

        module.exports = fmt;

        /**
         * Formatters
         */

        fmt.o = toString;
        fmt.s = String;
        fmt.d = parseInt;

        /**
         * Format the given `str`.
         *
         * @param {String} str
         * @param {...} args
         * @return {String}
         * @api public
         */

        function fmt(str) {
          var args = [].slice.call(arguments, 1);
          var j = 0;

          return str.replace(/%([a-z])/gi, function(_, f) {
            return fmt[f] ? fmt[f](args[j++]) : _ + f;
          });
        }
      },
      {}
    ],
    95: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var onload = require('script-onload');
        var tick = require('next-tick');
        var type = require('type');

        /**
         * Expose `loadScript`.
         *
         * @param {Object} options
         * @param {Function} fn
         * @api public
         */

        module.exports = function loadIframe(options, fn) {
          if (!options) throw new Error('Cant load nothing...');

          // Allow for the simplest case, just passing a `src` string.
          if (type(options) == 'string') options = { src: options };

          var https =
            document.location.protocol === 'https:' ||
            document.location.protocol === 'chrome-extension:';

          // If you use protocol relative URLs, third-party scripts like Google
          // Analytics break when testing with `file:` so this fixes that.
          if (options.src && options.src.indexOf('//') === 0) {
            options.src = https
              ? 'https:' + options.src
              : 'http:' + options.src;
          }

          // Allow them to pass in different URLs depending on the protocol.
          if (https && options.https) options.src = options.https;
          else if (!https && options.http) options.src = options.http;

          // Make the `<iframe>` element and insert it before the first iframe on the
          // page, which is guaranteed to exist since this Javaiframe is running.
          var iframe = document.createElement('iframe');
          iframe.src = options.src;
          iframe.width = options.width || 1;
          iframe.height = options.height || 1;
          iframe.style.display = 'none';

          // If we have a fn, attach event handlers, even in IE. Based off of
          // the Third-Party Javascript script loading example:
          // https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html
          if (type(fn) == 'function') {
            onload(iframe, fn);
          }

          tick(function() {
            // Append after event listeners are attached for IE.
            var firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(iframe, firstScript);
          });

          // Return the iframe element in case they want to do anything special, like
          // give it an ID or attributes.
          return iframe;
        };
      },
      { 'script-onload': 101, 'next-tick': 62, type: 53 }
    ],
    101: [
      function(require, module, exports) {
        // https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html

        /**
         * Invoke `fn(err)` when the given `el` script loads.
         *
         * @param {Element} el
         * @param {Function} fn
         * @api public
         */

        module.exports = function(el, fn) {
          return el.addEventListener ? add(el, fn) : attach(el, fn);
        };

        /**
         * Add event listener to `el`, `fn()`.
         *
         * @param {Element} el
         * @param {Function} fn
         * @api private
         */

        function add(el, fn) {
          el.addEventListener(
            'load',
            function(_, e) {
              fn(null, e);
            },
            false
          );
          el.addEventListener(
            'error',
            function(e) {
              var err = new Error('script error "' + el.src + '"');
              err.event = e;
              fn(err);
            },
            false
          );
        }

        /**
         * Attach event.
         *
         * @param {Element} el
         * @param {Function} fn
         * @api private
         */

        function attach(el, fn) {
          el.attachEvent('onreadystatechange', function(e) {
            if (!/complete|loaded/.test(el.readyState)) return;
            fn(null, e);
          });
          el.attachEvent('onerror', function(e) {
            var err = new Error('failed to load the script "' + el.src + '"');
            err.event = e || window.event;
            fn(err);
          });
        }
      },
      {}
    ],
    96: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var onload = require('script-onload');
        var tick = require('next-tick');
        var type = require('type');

        /**
         * Expose `loadScript`.
         *
         * @param {Object} options
         * @param {Function} fn
         * @api public
         */

        module.exports = function loadScript(options, fn) {
          if (!options) throw new Error('Cant load nothing...');

          // Allow for the simplest case, just passing a `src` string.
          if (type(options) == 'string') options = { src: options };

          var https =
            document.location.protocol === 'https:' ||
            document.location.protocol === 'chrome-extension:' ||
            document.location.protocol === 'moz-extension:';

          // If you use protocol relative URLs, third-party scripts like Google
          // Analytics break when testing with `file:` so this fixes that.
          if (options.src && options.src.indexOf('//') === 0) {
            options.src = https
              ? 'https:' + options.src
              : 'http:' + options.src;
          }

          // Allow them to pass in different URLs depending on the protocol.
          if (https && options.https) options.src = options.https;
          else if (!https && options.http) options.src = options.http;

          // Make the `<script>` element and insert it before the first script on the
          // page, which is guaranteed to exist since this Javascript is running.
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.async = true;
          script.src = options.src;

          // If we have a fn, attach event handlers, even in IE. Based off of
          // the Third-Party Javascript script loading example:
          // https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html
          if (type(fn) == 'function') {
            onload(script, fn);
          }

          tick(function() {
            // Append after event listeners are attached for IE.
            var firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(script, firstScript);
          });

          // Return the script element in case they want to do anything special, like
          // give it an ID or attributes.
          return script;
        };
      },
      { 'script-onload': 101, 'next-tick': 62, type: 53 }
    ],
    97: [
      function(require, module, exports) {
        /**
         * Expose `toNoCase`.
         */

        module.exports = toNoCase;

        /**
         * Test whether a string is camel-case.
         */

        var hasSpace = /\s/;
        var hasSeparator = /[\W_]/;

        /**
         * Remove any starting case from a `string`, like camel or snake, but keep
         * spaces and punctuation that may be important otherwise.
         *
         * @param {String} string
         * @return {String}
         */

        function toNoCase(string) {
          if (hasSpace.test(string)) return string.toLowerCase();
          if (hasSeparator.test(string))
            return unseparate(string).toLowerCase();
          return uncamelize(string).toLowerCase();
        }

        /**
         * Separator splitter.
         */

        var separatorSplitter = /[\W_]+(.|$)/g;

        /**
         * Un-separate a `string`.
         *
         * @param {String} string
         * @return {String}
         */

        function unseparate(string) {
          return string.replace(separatorSplitter, function(m, next) {
            return next ? ' ' + next : '';
          });
        }

        /**
         * Camelcase splitter.
         */

        var camelSplitter = /(.)([A-Z]+)/g;

        /**
         * Un-camelcase a `string`.
         *
         * @param {String} string
         * @return {String}
         */

        function uncamelize(string) {
          return string.replace(camelSplitter, function(m, previous, uppers) {
            return (
              previous +
              ' ' +
              uppers
                .toLowerCase()
                .split('')
                .join(' ')
            );
          });
        }
      },
      {}
    ],
    98: [
      function(require, module, exports) {
        'use strict';

        /**
         * Module dependencies.
         */

        // FIXME: Hacky workaround for Duo
        var each;
        try {
          each = require('@ndhoule/each');
        } catch (e) {
          each = require('each');
        }

        /**
         * Check if a predicate function returns `true` for all values in a `collection`.
         * Checks owned, enumerable values and exits early when `predicate` returns
         * `false`.
         *
         * @name every
         * @param {Function} predicate The function used to test values.
         * @param {Array|Object|string} collection The collection to search.
         * @return {boolean} True if all values passes the predicate test, otherwise false.
         * @example
         * var isEven = function(num) { return num % 2 === 0; };
         *
         * every(isEven, []); // => true
         * every(isEven, [1, 2]); // => false
         * every(isEven, [2, 4, 6]); // => true
         */

        var every = function every(predicate, collection) {
          if (typeof predicate !== 'function') {
            throw new TypeError(
              '`predicate` must be a function but was a ' + typeof predicate
            );
          }

          var result = true;

          each(function(val, key, collection) {
            result = !!predicate(val, key, collection);

            // Exit early
            if (!result) {
              return false;
            }
          }, collection);

          return result;
        };

        /**
         * Exports.
         */

        module.exports = every;
      },
      { each: 71 }
    ],
    99: [
      function(require, module, exports) {
        var isEmpty = require('is-empty');

        try {
          var typeOf = require('type');
        } catch (e) {
          var typeOf = require('component-type');
        }

        /**
         * Types.
         */

        var types = [
          'arguments',
          'array',
          'boolean',
          'date',
          'element',
          'function',
          'null',
          'number',
          'object',
          'regexp',
          'string',
          'undefined'
        ];

        /**
         * Expose type checkers.
         *
         * @param {Mixed} value
         * @return {Boolean}
         */

        for (var i = 0, type; (type = types[i]); i++)
          exports[type] = generate(type);

        /**
         * Add alias for `function` for old browsers.
         */

        exports.fn = exports.function;

        /**
         * Expose `empty` check.
         */

        exports.empty = isEmpty;

        /**
         * Expose `nan` check.
         */

        exports.nan = function(val) {
          return exports.number(val) && val != val;
        };

        /**
         * Generate a type checker.
         *
         * @param {String} type
         * @return {Function}
         */

        function generate(type) {
          return function(value) {
            return type === typeOf(value);
          };
        }
      },
      { 'is-empty': 52, type: 53, 'component-type': 53 }
    ],
    89: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var Emitter = require('emitter');
        var domify = require('domify');
        var each = require('each');
        var includes = require('includes');

        /**
         * Mix in emitter.
         */

        /* eslint-disable new-cap */
        Emitter(exports);
        /* eslint-enable new-cap */

        /**
         * Add a new option to the integration by `key` with default `value`.
         *
         * @api public
         * @param {string} key
         * @param {*} value
         * @return {Integration}
         */

        exports.option = function(key, value) {
          this.prototype.defaults[key] = value;
          return this;
        };

        /**
         * Add a new mapping option.
         *
         * This will create a method `name` that will return a mapping for you to use.
         *
         * @api public
         * @param {string} name
         * @return {Integration}
         * @example
         * Integration('My Integration')
         *   .mapping('events');
         *
         * new MyIntegration().track('My Event');
         *
         * .track = function(track){
         *   var events = this.events(track.event());
         *   each(events, send);
         *  };
         */

        exports.mapping = function(name) {
          this.option(name, []);
          this.prototype[name] = function(key) {
            return this.map(this.options[name], key);
          };
          return this;
        };

        /**
         * Register a new global variable `key` owned by the integration, which will be
         * used to test whether the integration is already on the page.
         *
         * @api public
         * @param {string} key
         * @return {Integration}
         */

        exports.global = function(key) {
          this.prototype.globals.push(key);
          return this;
        };

        /**
         * Mark the integration as assuming an initial pageview, so to defer loading
         * the script until the first `page` call, noop the first `initialize`.
         *
         * @api public
         * @return {Integration}
         */

        exports.assumesPageview = function() {
          this.prototype._assumesPageview = true;
          return this;
        };

        /**
         * Mark the integration as being "ready" once `load` is called.
         *
         * @api public
         * @return {Integration}
         */

        exports.readyOnLoad = function() {
          this.prototype._readyOnLoad = true;
          return this;
        };

        /**
         * Mark the integration as being "ready" once `initialize` is called.
         *
         * @api public
         * @return {Integration}
         */

        exports.readyOnInitialize = function() {
          this.prototype._readyOnInitialize = true;
          return this;
        };

        /**
         * Define a tag to be loaded.
         *
         * @api public
         * @param {string} [name='library'] A nicename for the tag, commonly used in
         * #load. Helpful when the integration has multiple tags and you need a way to
         * specify which of the tags you want to load at a given time.
         * @param {String} str DOM tag as string or URL.
         * @return {Integration}
         */

        exports.tag = function(name, tag) {
          if (tag == null) {
            tag = name;
            name = 'library';
          }
          this.prototype.templates[name] = objectify(tag);
          return this;
        };

        /**
         * Given a string, give back DOM attributes.
         *
         * Do it in a way where the browser doesn't load images or iframes. It turns
         * out domify will load images/iframes because whenever you construct those
         * DOM elements, the browser immediately loads them.
         *
         * @api private
         * @param {string} str
         * @return {Object}
         */

        function objectify(str) {
          // replace `src` with `data-src` to prevent image loading
          str = str.replace(' src="', ' data-src="');

          var el = domify(str);
          var attrs = {};

          each(el.attributes, function(attr) {
            // then replace it back
            var name = attr.name === 'data-src' ? 'src' : attr.name;
            if (!includes(attr.name + '=', str)) return;
            attrs[name] = attr.value;
          });

          return {
            type: el.tagName.toLowerCase(),
            attrs: attrs
          };
        }
      },
      { emitter: 12, domify: 102, each: 92, includes: 77 }
    ],
    102: [
      function(require, module, exports) {
        /**
         * Expose `parse`.
         */

        module.exports = parse;

        /**
         * Tests for browser support.
         */

        var div = document.createElement('div');
        // Setup
        div.innerHTML =
          '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
        // Make sure that link elements get serialized correctly by innerHTML
        // This requires a wrapper element in IE
        var innerHTMLBug = !div.getElementsByTagName('link').length;
        div = undefined;

        /**
         * Wrap map from jquery.
         */

        var map = {
          legend: [1, '<fieldset>', '</fieldset>'],
          tr: [2, '<table><tbody>', '</tbody></table>'],
          col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
          // for script/link/style tags to work in IE6-8, you have to wrap
          // in a div with a non-whitespace character in front, ha!
          _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
        };

        map.td = map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

        map.option = map.optgroup = [
          1,
          '<select multiple="multiple">',
          '</select>'
        ];

        map.thead = map.tbody = map.colgroup = map.caption = map.tfoot = [
          1,
          '<table>',
          '</table>'
        ];

        map.polyline = map.ellipse = map.polygon = map.circle = map.text = map.line = map.path = map.rect = map.g = [
          1,
          '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">',
          '</svg>'
        ];

        /**
         * Parse `html` and return a DOM Node instance, which could be a TextNode,
         * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
         * instance, depending on the contents of the `html` string.
         *
         * @param {String} html - HTML string to "domify"
         * @param {Document} doc - The `document` instance to create the Node for
         * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
         * @api private
         */

        function parse(html, doc) {
          if (typeof html !== 'string') throw new TypeError('String expected');

          // default to the global `document` object
          if (!doc) doc = document;

          // tag name
          var m = /<([\w:]+)/.exec(html);
          if (!m) return doc.createTextNode(html);

          html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

          var tag = m[1];

          // body support
          if (tag == 'body') {
            var el = doc.createElement('html');
            el.innerHTML = html;
            return el.removeChild(el.lastChild);
          }

          // wrap map
          var wrap = map[tag] || map._default;
          var depth = wrap[0];
          var prefix = wrap[1];
          var suffix = wrap[2];
          var el = doc.createElement('div');
          el.innerHTML = prefix + html + suffix;
          while (depth--) el = el.lastChild;

          // one element
          if (el.firstChild == el.lastChild) {
            return el.removeChild(el.firstChild);
          }

          // several elements
          var fragment = doc.createDocumentFragment();
          while (el.firstChild) {
            fragment.appendChild(el.removeChild(el.firstChild));
          }

          return fragment;
        }
      },
      {}
    ],
    7: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var clearAjax = require('clear-ajax');
        var clearTimeouts = require('clear-timeouts');
        var clearIntervals = require('clear-intervals');
        var clearListeners = require('clear-listeners');
        var clearGlobals = require('clear-globals');
        var clearImages = require('clear-images');
        var clearScripts = require('clear-scripts');
        var clearCookies = require('clear-cookies');

        /**
         * Reset initial state.
         *
         * @api public
         */

        module.exports = function() {
          clearAjax();
          clearTimeouts();
          clearIntervals();
          clearListeners();
          clearGlobals();
          clearImages();
          clearScripts();
          clearCookies();
        };
      },
      {
        'clear-ajax': 103,
        'clear-timeouts': 104,
        'clear-intervals': 105,
        'clear-listeners': 106,
        'clear-globals': 107,
        'clear-images': 108,
        'clear-scripts': 109,
        'clear-cookies': 110
      }
    ],
    103: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var each = require('each');

        /**
         * Original send method.
         */

        var send = XMLHttpRequest.prototype.send;

        /**
         * Requests made.
         */

        var requests = [];

        /**
         * Clear all active AJAX requests.
         *
         * @api public
         */

        exports = module.exports = function() {
          each(requests, function(request) {
            try {
              request.onload = noop;
              request.onerror = noop;
              request.onabort = noop;
              request.abort();
            } catch (e) {}
          });
          requests.length = [];
        };

        /**
         * Capture AJAX requests.
         *
         * @api public
         */

        exports.bind = function() {
          XMLHttpRequest.prototype.send = function() {
            requests.push(this);
            return send.apply(this, arguments);
          };
        };

        /**
         * Reset `XMLHttpRequest` back to normal.
         *
         * @api public
         */

        exports.unbind = function() {
          XMLHttpRequest.prototype.send = send;
        };

        /**
         * Automatically bind.
         */

        exports.bind();

        /**
         * Noop.
         *
         * @api private
         */

        function noop() {}
      },
      { each: 92 }
    ],
    104: [
      function(require, module, exports) {
        /**
         * Previous
         */

        var prev = 0;

        /**
         * Noop
         */

        var noop = Function.prototype;

        /**
         * Clear all timeouts
         *
         * @api public
         */

        module.exports = function() {
          var tmp;
          var i;
          tmp = i = setTimeout(noop);
          while (prev < i) clearTimeout(i--);
          prev = tmp;
        };
      },
      {}
    ],
    105: [
      function(require, module, exports) {
        /**
         * Prev
         */

        var prev = 0;

        /**
         * Noop
         */

        var noop = Function.prototype;

        /**
         * Clear all intervals.
         *
         * @api public
         */

        module.exports = function() {
          var tmp;
          var i;
          tmp = i = setInterval(noop);
          while (prev < i) clearInterval(i--);
          prev = tmp;
        };
      },
      {}
    ],
    106: [
      function(require, module, exports) {
        /**
         * Window event listeners.
         */

        var listeners = [];

        /**
         * Original window functions.
         */

        var on = window.addEventListener ? 'addEventListener' : 'attachEvent';
        var off = window.removeEventListener
          ? 'removeEventListener'
          : 'detachEvent';
        var onFn = window[on];
        var offFn = window[off];

        /**
         * Clear event listeners.
         *
         * @api public
         */

        exports = module.exports = function() {
          var i = listeners.length;
          while (i--) {
            window[on].apply
              ? window[on].apply(window, listeners[i])
              : window[on](listeners[i][0], listeners[i][1]); // IE
          }
          listeners.length = 0;
        };

        /**
         * Wrap window.addEventListener and window.removeEventListener
         * to be able to cleanup all event listeners for testing.
         *
         * @api public
         */

        exports.bind = function() {
          window[on] = function() {
            listeners.push(arguments);
            return onFn.apply
              ? onFn.apply(window, arguments)
              : onFn(arguments[0], arguments[1]); // IE
          };

          window[off] = function(name, listener, useCapture) {
            for (var i = 0, n = listeners.length; i < n; i++) {
              if (name !== listeners[i][0]) continue;
              if (listener !== listeners[i][1]) continue;
              if (arguments.length > 2 && useCapture !== listeners[i][2])
                continue;
              listeners.splice(i, 1);
              break;
            }
            return offFn.apply
              ? offFn.apply(window, arguments)
              : offFn(arguments[0], arguments[1]); // IE
          };
        };

        /**
         * Reset window back to normal.
         *
         * @api public
         */

        exports.unbind = function() {
          listeners.length = 0;
          window[on] = onFn;
          window[off] = offFn;
        };

        /**
         * Automatically override.
         */

        exports.bind();
      },
      {}
    ],
    107: [
      function(require, module, exports) {
        /**
         * Objects we want to keep track of initial properties for.
         */

        var globals = {
          window: {},
          document: {},
          XMLHttpRequest: {}
        };

        /**
         * Capture initial state of `window`.
         *
         * Note, `window.addEventListener` is overritten already,
         * from `clearListeners`. But this is desired behavior.
         */

        globals.window.removeEventListener = window.removeEventListener;
        globals.window.addEventListener = window.addEventListener;
        globals.window.setTimeout = window.setTimeout;
        globals.window.setInterval = window.setInterval;
        globals.window.onerror = null;
        globals.window.onload = null;

        /**
         * Capture initial state of `document`.
         */

        globals.document.write = document.write;
        globals.document.appendChild = document.appendChild;
        globals.document.removeChild = document.removeChild;

        /**
         * Capture the initial state of `XMLHttpRequest`.
         */

        if (typeof XMLHttpRequest !== 'undefined') {
          globals.XMLHttpRequest.open = XMLHttpRequest.prototype.open;
        }

        /**
         * Reset initial state.
         *
         * @api public
         */

        module.exports = function() {
          copy(globals.window, window);
          copy(globals.XMLHttpRequest, XMLHttpRequest.prototype);
          copy(globals.document, document);
        };

        /**
         * Reset properties on object.
         *
         * @param {Object} source
         * @param {Object} target
         * @api private
         */

        function copy(source, target) {
          for (var name in source) {
            if (source.hasOwnProperty(name)) {
              target[name] = source[name];
            }
          }
        }
      },
      {}
    ],
    108: [
      function(require, module, exports) {
        /**
         * Created images.
         */

        var images = [];

        /**
         * Keep track of original `Image`.
         */

        var Original = window.Image;

        /**
         * Image override that keeps track of images.
         *
         * Careful though, `img instance Override` isn't true.
         *
         * @api private
         */

        function Override() {
          var img = new Original();
          images.push(img);
          return img;
        }

        /**
         * Clear `onload` for each image.
         *
         * @api public
         */

        exports = module.exports = function() {
          var noop = function() {};
          for (var i = 0, n = images.length; i < n; i++) {
            images[i].onload = noop;
          }
          images.length = 0;
        };

        /**
         * Override `window.Image` to keep track of images,
         * so we can clear `onload`.
         *
         * @api public
         */

        exports.bind = function() {
          window.Image = Override;
        };

        /**
         * Set `window.Image` back to normal.
         *
         * @api public
         */

        exports.unbind = function() {
          window.Image = Original;
          images.length = 0;
        };

        /**
         * Automatically override.
         */

        exports.bind();
      },
      {}
    ],
    109: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var indexOf = require('indexof');
        var query = require('query');
        var each = require('each');

        /**
         * Initial scripts.
         */

        var initialScripts = [];

        /**
         * Remove all scripts not initially present.
         *
         * @param {Function} [match] Only remove ones that return true
         * @api public
         */

        exports = module.exports = function(match) {
          match = match || saucelabs;
          var finalScripts = query.all('script');
          each(finalScripts, function(script) {
            if (indexOf(initialScripts, script) != -1) return;
            if (!script.parentNode) return;
            if (!match(script)) return;
            script.parentNode.removeChild(script);
          });
        };

        /**
         * Capture initial scripts, the ones not to remove.
         *
         * @api public
         */

        exports.bind = function(scripts) {
          initialScripts = scripts || query.all('script');
        };

        /**
         * Default matching function, ignores saucelabs jsonp scripts.
         *
         * @param {Script} script
         * @api private
         * @return {Boolean}
         */

        function saucelabs(script) {
          return !script.src.match(/localtunnel\.me\/saucelabs|\/duotest/);
        }

        /**
         * Automatically bind.
         */

        exports.bind();
      },
      { indexof: 36, query: 111, each: 92 }
    ],
    111: [
      function(require, module, exports) {
        function one(selector, el) {
          return el.querySelector(selector);
        }

        exports = module.exports = function(selector, el) {
          el = el || document;
          return one(selector, el);
        };

        exports.all = function(selector, el) {
          el = el || document;
          return el.querySelectorAll(selector);
        };

        exports.engine = function(obj) {
          if (!obj.one) throw new Error('.one callback required');
          if (!obj.all) throw new Error('.all callback required');
          one = obj.one;
          exports.all = obj.all;
          return exports;
        };
      },
      {}
    ],
    110: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var cookie = require('cookie');

        /**
         * Clear cookies.
         */

        module.exports = function() {
          var cookies = cookie();
          for (var name in cookies) {
            cookie(name, '', { path: '/' });
          }
        };
      },
      { cookie: 70 }
    ],
    8: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var indexOf = require('indexof');
        var assert = require('assert');
        var domify = require('domify');
        var stub = require('stub');
        var each = require('each');
        var keys = require('keys');
        var fmt = require('fmt');
        var spy = require('spy');
        var is = require('is');

        /**
         * Expose `plugin`.
         */

        module.exports = plugin;

        /**
         * Integration testing plugin.
         *
         * @param {Analytics} analytics
         */

        function plugin(analytics) {
          analytics.spies = [];

          /**
           * Spy on a `method` of host `object`.
           *
           * @param {Object} object
           * @param {String} method
           * @return {Analytics}
           */

          analytics.spy = function(object, method) {
            var s = spy(object, method);
            this.spies.push(s);
            return this;
          };

          /**
           * Stub a `method` of host `object`.
           *
           * @param {Object} object
           * @param {String} method
           * @param {Function} fn A function to be called in place of the stubbed method.
           * @return {Analytics}
           */

          analytics.stub = function(object, method, fn) {
            var s = stub(object, method, fn);
            this.spies.push(s);
            return this;
          };

          /**
           * Restore all spies.
           *
           * @return {Analytics}
           */

          analytics.restore = function() {
            each(this.spies, function(spy, i) {
              spy.restore();
            });
            this.spies = [];
            return this;
          };

          /**
           * Assert that a `spy` was called with `args...`
           *
           * @param {Spy} spy
           * @param {Mixed} args... (optional)
           * @return {Analytics}
           */

          analytics.called = function(spy) {
            assert(
              ~indexOf(this.spies, spy),
              'You must call `.spy(object, method)` prior to calling `.called()`.'
            );
            assert(
              spy.called,
              fmt('Expected "%s" to have been called.', spy.name)
            );

            var args = [].slice.call(arguments, 1);
            if (!args.length) return this;

            assert(
              spy.got.apply(spy, args),
              fmt(
                '' +
                  'Expected "%s" to be called with "%s", \n' +
                  'but it was called with "%s".',
                spy.name,
                JSON.stringify(args, null, 2),
                JSON.stringify(spy.args[0], null, 2)
              )
            );

            return this;
          };

          /**
           * Assert that a `spy` was not called with `args...`.
           *
           * @param {Spy} spy
           * @param {Mixed} args... (optional)
           * @return {Analytics}
           */

          analytics.didNotCall = function(spy) {
            assert(
              ~indexOf(this.spies, spy),
              'You must call `.spy(object, method)` prior to calling `.didNotCall()`.'
            );

            var args = [].slice.call(arguments, 1);
            if (!args.length) {
              assert(
                !spy.called,
                fmt('Expected "%s" not to have been called.', spy.name)
              );
            } else {
              assert(
                !spy.got.apply(spy, args),
                fmt(
                  '' +
                    'Expected "%s" not to be called with "%o", ' +
                    'but it was called with "%o".',
                  spy.name,
                  args,
                  spy.args[0]
                )
              );
            }

            return this;
          };

          /**
           * Assert that a `spy` was not called 1 time.
           *
           * @param {Spy} spy
           * @return {Analytics}
           */

          analytics.calledOnce = calledTimes(1);

          /**
           * Assert that a `spy` was called 2 times.
           *
           * @param {Spy} spy
           * @return {Analytics}
           */

          analytics.calledTwice = calledTimes(2);

          /**
           * Assert that a `spy` was called 3 times.
           *
           * @param {Spy} spy
           * @return {Analytics}
           */

          analytics.calledThrice = calledTimes(2);

          /**
           * Generate a function for asserting a spy
           * was called `n` times.
           *
           * @param {Number} n
           * @return {Function}
           */

          function calledTimes(n) {
            return function(spy) {
              var m = spy.args.length;
              assert(
                n == m,
                fmt(
                  '' +
                    'Expected "%s" to have been called %s time%s, ' +
                    'but it was only called %s time%s.',
                  spy.name,
                  n,
                  n != 1 ? 's' : '',
                  m,
                  m != 1 ? 's' : ''
                )
              );
            };
          }

          /**
           * Assert that a `spy` returned `value`.
           *
           * @param {Spy} spy
           * @param {Mixed} value
           * @return {Tester}
           */

          analytics.returned = function(spy, value) {
            assert(
              ~indexOf(this.spies, spy),
              'You must call `.spy(object, method)` prior to calling `.returned()`.'
            );
            assert(
              spy.returned(value),
              fmt('Expected "%s" to have returned "%o".', spy.name, value)
            );

            return this;
          };

          /**
           * Assert that a `spy` did not return `value`.
           *
           * @param {Spy} spy
           * @param {Mixed} value
           * @return {Tester}
           */

          analytics.didNotReturn = function(spy, value) {
            assert(
              ~indexOf(this.spies, spy),
              'You must call `.spy(object, method)` prior to calling `.didNotReturn()`.'
            );
            assert(
              !spy.returned(value),
              fmt('Expected "%s" not to have returned "%o".', spy.name, value)
            );

            return this;
          };

          /**
           * Call `reset` on the integration.
           *
           * @return {Analytics}
           */

          analytics.reset = function() {
            this.user().reset();
            this.group().reset();
            return this;
          };

          /**
           * Compare `int` against `test`.
           *
           * To double-check that they have the right defaults, globals, and config.
           *
           * @param {Function} a actual integration constructor
           * @param {Function} b test integration constructor
           */

          analytics.compare = function(a, b) {
            a = new a();
            b = new b();
            // name
            assert(
              a.name === b.name,
              fmt('Expected name to be "%s", but it was "%s".', b.name, a.name)
            );

            // options
            var x = a.defaults;
            var y = b.defaults;
            for (var key in y) {
              assert(
                x.hasOwnProperty(key),
                fmt('The integration does not have an option named "%s".', key)
              );
              assert.deepEqual(
                x[key],
                y[key],
                fmt(
                  'Expected option "%s" to default to "%s", but it defaults to "%s".',
                  key,
                  y[key],
                  x[key]
                )
              );
            }

            // globals
            var x = a.globals;
            var y = b.globals;
            each(y, function(key) {
              assert(
                indexOf(x, key) !== -1,
                fmt('Expected global "%s" to be registered.', key)
              );
            });

            // assumesPageview
            assert(
              a._assumesPageview == b._assumesPageview,
              'Expected the integration to assume a pageview.'
            );

            // readyOnInitialize
            assert(
              a._readyOnInitialize == b._readyOnInitialize,
              'Expected the integration to be ready on initialize.'
            );

            // readyOnLoad
            assert(
              a._readyOnLoad == b._readyOnLoad,
              'Expected integration to be ready on load.'
            );
          };

          /**
           * Assert the integration being tested loads.
           *
           * @param {Integration} integration
           * @param {Function} done
           */

          analytics.load = function(integration, done) {
            analytics.assert(
              !integration.loaded(),
              'Expected `integration.loaded()` to be false before loading.'
            );
            analytics.once('ready', function() {
              analytics.assert(
                integration.loaded(),
                'Expected `integration.loaded()` to be true after loading.'
              );
              done();
            });
            analytics.initialize();
            analytics.page({}, { Marketo: true });
          };

          /**
           * Assert a script, image, or iframe was loaded.
           *
           * @param {String} str DOM template
           */

          analytics.loaded = function(integration, str) {
            if (typeof integration === 'string') {
              str = integration;
              integration = this.integration();
            }

            var tags = [];

            assert(
              ~indexOf(this.spies, integration.load),
              "You must call `.spy(integration, 'load')` prior to calling `.loaded()`."
            );

            // collect all Image or HTMLElement objects
            // in an array of stringified elements, for human-readable assertions.
            each(integration.load.returns, function(el) {
              var tag = {};
              if (el instanceof HTMLImageElement) {
                tag.type = 'img';
                tag.attrs = { src: el.src };
              } else if (is.element(el)) {
                tag.type = el.tagName.toLowerCase();
                tag.attrs = attributes(el);
                switch (tag.type) {
                  case 'script':
                    // don't care about these properties.
                    delete tag.attrs.type;
                    delete tag.attrs.async;
                    delete tag.attrs.defer;
                    break;
                }
              }
              if (tag.type) tags.push(stringify(tag.type, tag.attrs));
            });

            // normalize formatting
            var tag = objectify(str);
            var expected = stringify(tag.type, tag.attrs);

            if (!tags.length) {
              assert(
                false,
                fmt('No tags were returned.\nExpected %s.', expected)
              );
            } else {
              // show the closest match
              assert(
                indexOf(tags, expected) !== -1,
                fmt('\nExpected %s.\nFound %s', expected, tags.join('\n'))
              );
            }
          };

          /**
           * Get current integration.
           *
           * @return {Integration}
           */

          analytics.integration = function() {
            for (var name in this._integrations)
              return this._integrations[name];
          };

          /**
           * Assert a `value` is truthy.
           *
           * @param {Mixed} value
           * @return {Tester}
           */

          analytics.assert = assert;

          /**
           * Expose all of the methods on `assert`.
           *
           * @param {Mixed} args...
           * @return {Tester}
           */

          each(keys(assert), function(key) {
            analytics[key] = function() {
              var args = [].slice.call(arguments);
              assert[key].apply(assert, args);
              return this;
            };
          });

          /**
           * Create a DOM node string.
           */

          function stringify(name, attrs) {
            var str = [];
            str.push('<' + name);
            each(attrs, function(key, val) {
              str.push(' ' + key + '="' + val + '"');
            });
            str.push('>');
            // block
            if (name !== 'img') str.push('</' + name + '>');
            return str.join('');
          }

          /**
           * DOM node attributes as object.
           *
           * @param {Element}
           * @return {Object}
           */

          function attributes(node) {
            var obj = {};
            each(node.attributes, function(attr) {
              obj[attr.name] = attr.value;
            });
            return obj;
          }

          /**
           * Given a string, give back DOM attributes.
           *
           * @param {String} str
           * @return {Object}
           */

          function objectify(str) {
            // replace `src` with `data-src` to prevent image loading
            str = str.replace(' src="', ' data-src="');

            var el = domify(str);
            var attrs = {};

            each(el.attributes, function(attr) {
              // then replace it back
              var name = attr.name == 'data-src' ? 'src' : attr.name;
              attrs[name] = attr.value;
            });

            return {
              type: el.tagName.toLowerCase(),
              attrs: attrs
            };
          }
        }
      },
      {
        indexof: 36,
        assert: 112,
        domify: 113,
        stub: 114,
        each: 92,
        keys: 115,
        fmt: 94,
        spy: 116,
        is: 50
      }
    ],
    112: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var equals = require('equals');
        var fmt = require('fmt');
        var stack = require('stack');

        /**
         * Assert `expr` with optional failure `msg`.
         *
         * @param {Mixed} expr
         * @param {String} [msg]
         * @api public
         */

        module.exports = exports = function(expr, msg) {
          if (expr) return;
          throw error(msg || message());
        };

        /**
         * Assert `actual` is weak equal to `expected`.
         *
         * @param {Mixed} actual
         * @param {Mixed} expected
         * @param {String} [msg]
         * @api public
         */

        exports.equal = function(actual, expected, msg) {
          if (actual == expected) return;
          throw error(
            msg || fmt('Expected %o to equal %o.', actual, expected),
            actual,
            expected
          );
        };

        /**
         * Assert `actual` is not weak equal to `expected`.
         *
         * @param {Mixed} actual
         * @param {Mixed} expected
         * @param {String} [msg]
         * @api public
         */

        exports.notEqual = function(actual, expected, msg) {
          if (actual != expected) return;
          throw error(
            msg || fmt('Expected %o not to equal %o.', actual, expected)
          );
        };

        /**
         * Assert `actual` is deep equal to `expected`.
         *
         * @param {Mixed} actual
         * @param {Mixed} expected
         * @param {String} [msg]
         * @api public
         */

        exports.deepEqual = function(actual, expected, msg) {
          if (equals(actual, expected)) return;
          throw error(
            msg || fmt('Expected %o to deeply equal %o.', actual, expected),
            actual,
            expected
          );
        };

        /**
         * Assert `actual` is not deep equal to `expected`.
         *
         * @param {Mixed} actual
         * @param {Mixed} expected
         * @param {String} [msg]
         * @api public
         */

        exports.notDeepEqual = function(actual, expected, msg) {
          if (!equals(actual, expected)) return;
          throw error(
            msg || fmt('Expected %o not to deeply equal %o.', actual, expected)
          );
        };

        /**
         * Assert `actual` is strict equal to `expected`.
         *
         * @param {Mixed} actual
         * @param {Mixed} expected
         * @param {String} [msg]
         * @api public
         */

        exports.strictEqual = function(actual, expected, msg) {
          if (actual === expected) return;
          throw error(
            msg || fmt('Expected %o to strictly equal %o.', actual, expected),
            actual,
            expected
          );
        };

        /**
         * Assert `actual` is not strict equal to `expected`.
         *
         * @param {Mixed} actual
         * @param {Mixed} expected
         * @param {String} [msg]
         * @api public
         */

        exports.notStrictEqual = function(actual, expected, msg) {
          if (actual !== expected) return;
          throw error(
            msg ||
              fmt('Expected %o not to strictly equal %o.', actual, expected)
          );
        };

        /**
         * Assert `block` throws an `error`.
         *
         * @param {Function} block
         * @param {Function} [error]
         * @param {String} [msg]
         * @api public
         */

        exports.throws = function(block, err, msg) {
          var threw;
          try {
            block();
          } catch (e) {
            threw = e;
          }

          if (!threw)
            throw error(
              msg || fmt('Expected %s to throw an error.', block.toString())
            );
          if (err && !(threw instanceof err)) {
            throw error(
              msg || fmt('Expected %s to throw an %o.', block.toString(), err)
            );
          }
        };

        /**
         * Assert `block` doesn't throw an `error`.
         *
         * @param {Function} block
         * @param {Function} [error]
         * @param {String} [msg]
         * @api public
         */

        exports.doesNotThrow = function(block, err, msg) {
          var threw;
          try {
            block();
          } catch (e) {
            threw = e;
          }

          if (threw)
            throw error(
              msg || fmt('Expected %s not to throw an error.', block.toString())
            );
          if (err && threw instanceof err) {
            throw error(
              msg ||
                fmt('Expected %s not to throw an %o.', block.toString(), err)
            );
          }
        };

        /**
         * Create a message from the call stack.
         *
         * @return {String}
         * @api private
         */

        function message() {
          if (!Error.captureStackTrace) return 'assertion failed';
          var callsite = stack()[2];
          var fn = callsite.getFunctionName();
          var file = callsite.getFileName();
          var line = callsite.getLineNumber() - 1;
          var col = callsite.getColumnNumber() - 1;
          var src = get(file);
          line = src.split('\n')[line].slice(col);
          var m = line.match(/assert\((.*)\)/);
          return m && m[1].trim();
        }

        /**
         * Load contents of `script`.
         *
         * @param {String} script
         * @return {String}
         * @api private
         */

        function get(script) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', script, false);
          xhr.send(null);
          return xhr.responseText;
        }

        /**
         * Error with `msg`, `actual` and `expected`.
         *
         * @param {String} msg
         * @param {Mixed} actual
         * @param {Mixed} expected
         * @return {Error}
         */

        function error(msg, actual, expected) {
          var err = new Error(msg);
          err.showDiff = arguments.length == 3;
          err.actual = actual;
          err.expected = expected;
          return err;
        }
      },
      { equals: 117, fmt: 94, stack: 118 }
    ],
    117: [
      function(require, module, exports) {
        var type = require('jkroso-type');

        // (any, any, [array]) -> boolean
        function equal(a, b, memos) {
          // All identical values are equivalent
          if (a === b) return true;
          var fnA = types[type(a)];
          var fnB = types[type(b)];
          return fnA && fnA === fnB ? fnA(a, b, memos) : false;
        }

        var types = {};

        // (Number) -> boolean
        types.number = function(a, b) {
          return a !== a && b !== b; /* Nan check */
        };

        // (function, function, array) -> boolean
        types.function = function(a, b, memos) {
          return (
            a.toString() === b.toString() &&
            // Functions can act as objects
            types.object(a, b, memos) &&
            equal(a.prototype, b.prototype)
          );
        };

        // (date, date) -> boolean
        types.date = function(a, b) {
          return +a === +b;
        };

        // (regexp, regexp) -> boolean
        types.regexp = function(a, b) {
          return a.toString() === b.toString();
        };

        // (DOMElement, DOMElement) -> boolean
        types.element = function(a, b) {
          return a.outerHTML === b.outerHTML;
        };

        // (textnode, textnode) -> boolean
        types.textnode = function(a, b) {
          return a.textContent === b.textContent;
        };

        // decorate `fn` to prevent it re-checking objects
        // (function) -> function
        function memoGaurd(fn) {
          return function(a, b, memos) {
            if (!memos) return fn(a, b, []);
            var i = memos.length;
            var memo;
            while ((memo = memos[--i])) {
              if (memo[0] === a && memo[1] === b) return true;
            }
            return fn(a, b, memos);
          };
        }

        types.arguments = types['bit-array'] = types.array = memoGaurd(
          arrayEqual
        );

        // (array, array, array) -> boolean
        function arrayEqual(a, b, memos) {
          var i = a.length;
          if (i !== b.length) return false;
          memos.push([a, b]);
          while (i--) {
            if (!equal(a[i], b[i], memos)) return false;
          }
          return true;
        }

        types.object = memoGaurd(objectEqual);

        // (object, object, array) -> boolean
        function objectEqual(a, b, memos) {
          if (typeof a.equal === 'function') {
            memos.push([a, b]);
            return a.equal(b, memos);
          }
          var ka = getEnumerableProperties(a);
          var kb = getEnumerableProperties(b);
          var i = ka.length;

          // same number of properties
          if (i !== kb.length) return false;

          // although not necessarily the same order
          ka.sort();
          kb.sort();

          // cheap key test
          while (i--) if (ka[i] !== kb[i]) return false;

          // remember
          memos.push([a, b]);

          // iterate again this time doing a thorough check
          i = ka.length;
          while (i--) {
            var key = ka[i];
            if (!equal(a[key], b[key], memos)) return false;
          }

          return true;
        }

        // (object) -> array
        function getEnumerableProperties(object) {
          var result = [];
          for (var k in object)
            if (k !== 'constructor') {
              result.push(k);
            }
          return result;
        }

        module.exports = equal;
      },
      { 'jkroso-type': 119 }
    ],
    119: [
      function(require, module, exports) {
        var toString = {}.toString;
        var DomNode = typeof window !== 'undefined' ? window.Node : Function;

        /**
         * Return the type of `val`.
         *
         * @param {Mixed} val
         * @return {String}
         * @api public
         */

        module.exports = exports = function(x) {
          var type = typeof x;
          if (type != 'object') return type;
          type = types[toString.call(x)];
          if (type) return type;
          if (x instanceof DomNode)
            switch (x.nodeType) {
              case 1:
                return 'element';
              case 3:
                return 'text-node';
              case 9:
                return 'document';
              case 11:
                return 'document-fragment';
              default:
                return 'dom-node';
            }
        };

        var types = (exports.types = {
          '[object Function]': 'function',
          '[object Date]': 'date',
          '[object RegExp]': 'regexp',
          '[object Arguments]': 'arguments',
          '[object Array]': 'array',
          '[object String]': 'string',
          '[object Null]': 'null',
          '[object Undefined]': 'undefined',
          '[object Number]': 'number',
          '[object Boolean]': 'boolean',
          '[object Object]': 'object',
          '[object Text]': 'text-node',
          '[object Uint8Array]': 'bit-array',
          '[object Uint16Array]': 'bit-array',
          '[object Uint32Array]': 'bit-array',
          '[object Uint8ClampedArray]': 'bit-array',
          '[object Error]': 'error',
          '[object FormData]': 'form-data',
          '[object File]': 'file',
          '[object Blob]': 'blob'
        });
      },
      {}
    ],
    118: [
      function(require, module, exports) {
        /**
         * Expose `stack()`.
         */

        module.exports = stack;

        /**
         * Return the stack.
         *
         * @return {Array}
         * @api public
         */

        function stack() {
          var orig = Error.prepareStackTrace;
          Error.prepareStackTrace = function(_, stack) {
            return stack;
          };
          var err = new Error();
          Error.captureStackTrace(err, arguments.callee);
          var stack = err.stack;
          Error.prepareStackTrace = orig;
          return stack;
        }
      },
      {}
    ],
    113: [
      function(require, module, exports) {
        /**
         * Expose `parse`.
         */

        module.exports = parse;

        /**
         * Tests for browser support.
         */

        var innerHTMLBug = false;
        var bugTestDiv;
        if (typeof document !== 'undefined') {
          bugTestDiv = document.createElement('div');
          // Setup
          bugTestDiv.innerHTML =
            '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
          // Make sure that link elements get serialized correctly by innerHTML
          // This requires a wrapper element in IE
          innerHTMLBug = !bugTestDiv.getElementsByTagName('link').length;
          bugTestDiv = undefined;
        }

        /**
         * Wrap map from jquery.
         */

        var map = {
          legend: [1, '<fieldset>', '</fieldset>'],
          tr: [2, '<table><tbody>', '</tbody></table>'],
          col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
          // for script/link/style tags to work in IE6-8, you have to wrap
          // in a div with a non-whitespace character in front, ha!
          _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
        };

        map.td = map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

        map.option = map.optgroup = [
          1,
          '<select multiple="multiple">',
          '</select>'
        ];

        map.thead = map.tbody = map.colgroup = map.caption = map.tfoot = [
          1,
          '<table>',
          '</table>'
        ];

        map.polyline = map.ellipse = map.polygon = map.circle = map.text = map.line = map.path = map.rect = map.g = [
          1,
          '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">',
          '</svg>'
        ];

        /**
         * Parse `html` and return a DOM Node instance, which could be a TextNode,
         * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
         * instance, depending on the contents of the `html` string.
         *
         * @param {String} html - HTML string to "domify"
         * @param {Document} doc - The `document` instance to create the Node for
         * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
         * @api private
         */

        function parse(html, doc) {
          if (typeof html !== 'string') throw new TypeError('String expected');

          // default to the global `document` object
          if (!doc) doc = document;

          // tag name
          var m = /<([\w:]+)/.exec(html);
          if (!m) return doc.createTextNode(html);

          html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

          var tag = m[1];

          // body support
          if (tag == 'body') {
            var el = doc.createElement('html');
            el.innerHTML = html;
            return el.removeChild(el.lastChild);
          }

          // wrap map
          var wrap = map[tag] || map._default;
          var depth = wrap[0];
          var prefix = wrap[1];
          var suffix = wrap[2];
          var el = doc.createElement('div');
          el.innerHTML = prefix + html + suffix;
          while (depth--) el = el.lastChild;

          // one element
          if (el.firstChild == el.lastChild) {
            return el.removeChild(el.firstChild);
          }

          // several elements
          var fragment = doc.createDocumentFragment();
          while (el.firstChild) {
            fragment.appendChild(el.removeChild(el.firstChild));
          }

          return fragment;
        }
      },
      {}
    ],
    114: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var merge = require('merge');
        var eql = require('eql');

        /**
         * Create a test stub with `obj`, `method`.
         *
         * Examples:
         *
         *      s = require('stub')({}, 'toString');
         *      s = require('stub')(document.write);
         *      s = require('stub')();
         *
         * @param {Object|Function} obj
         * @param {String} method
         * @return {Function}
         * @api public
         */

        module.exports = function(obj, method) {
          var fn = toFunction(arguments, stub);
          merge(stub, proto);
          stub.reset();
          stub.name = method;
          return stub;

          function stub() {
            var args = [].slice.call(arguments);
            var ret = fn(arguments);
            // stub.returns || stub.reset();
            stub.args.push(args);
            stub.returns.push(ret);
            stub.update();
            return ret;
          }
        };

        /**
         * Prototype.
         */

        var proto = {};

        /**
         * `true` if the stub was called with `args`.
         *
         * @param {Arguments} ...
         * @return {Boolean}
         * @api public
         */

        proto.got = proto.calledWith = function(n) {
          var a = [].slice.call(arguments);
          for (var i = 0, n = this.args.length; i < n; i++) {
            var b = this.args[i];
            if (eql(a, b.slice(0, a.length))) return true;
          }
        };

        /**
         * `true` if the stub returned `value`.
         *
         * @param {Mixed} value
         * @return {Boolean}
         * @api public
         */

        proto.returned = function(value) {
          var ret = this.returns[this.returns.length - 1];
          return eql(ret, value);
        };

        /**
         * `true` if the stub was called once.
         *
         * @return {Boolean}
         * @api public
         */

        proto.once = function() {
          return this.args.length == 1;
        };

        /**
         * `true` if the stub was called twice.
         *
         * @return {Boolean}
         * @api public
         */

        proto.twice = function() {
          return this.args.length == 2;
        };

        /**
         * `true` if the stub was called three times.
         *
         * @return {Boolean}
         * @api public
         */

        proto.thrice = function() {
          return this.args.length == 3;
        };

        /**
         * Reset the stub.
         *
         * @return {Function}
         * @api public
         */

        proto.reset = function() {
          this.returns = [];
          this.args = [];
          this.update();
          return this;
        };

        /**
         * Restore.
         *
         * @return {Function}
         * @api public
         */

        proto.restore = function() {
          if (!this.obj) return this;
          var m = this.method;
          var fn = this.fn;
          this.obj[m] = fn;
          return this;
        };

        /**
         * Update the stub.
         *
         * @return {Function}
         * @api private
         */

        proto.update = function() {
          this.called = !!this.args.length;
          this.calledOnce = this.once();
          this.calledTwice = this.twice();
          this.calledThrice = this.thrice();
          return this;
        };

        /**
         * To function.
         *
         * @param {...} args
         * @param {Function} stub
         * @return {Function}
         * @api private
         */

        function toFunction(args, stub) {
          var obj = args[0];
          var method = args[1];
          var fn = args[2] || function() {};

          switch (args.length) {
            case 0:
              return function noop() {};
            case 1:
              return function(args) {
                return obj.apply(null, args);
              };
            case 2:
            case 3:
              var m = obj[method];
              stub.method = method;
              stub.fn = m;
              stub.obj = obj;
              obj[method] = stub;
              return function(args) {
                return fn.apply(obj, args);
              };
          }
        }
      },
      { merge: 120, eql: 121 }
    ],
    120: [
      function(require, module, exports) {
        /**
         * merge `b`'s properties with `a`'s.
         *
         * example:
         *
         *        var user = {};
         *        merge(user, console);
         *        // > { log: fn, dir: fn ..}
         *
         * @param {Object} a
         * @param {Object} b
         * @return {Object}
         */

        module.exports = function(a, b) {
          for (var k in b) a[k] = b[k];
          return a;
        };
      },
      {}
    ],
    121: [
      function(require, module, exports) {
        /**
         * dependencies
         */

        var type = require('type');
        var k = require('keys');

        /**
         * Export `eql`
         */

        exports = module.exports = eql;

        /**
         * Compare `a` to `b`.
         *
         * @param {Mixed} a
         * @param {Mixed} b
         * @return {Boolean}
         * @api public
         */

        function eql(a, b) {
          var compare = type(a);

          // sanity check
          if (compare != type(b)) return false;
          if (a === b) return true;

          // compare
          return (compare = eql[compare]) ? compare(a, b) : a == b;
        }

        /**
         * Compare regexps `a`, `b`.
         *
         * @param {RegExp} a
         * @param {RegExp} b
         * @return {Boolean}
         * @api public
         */

        eql.regexp = function(a, b) {
          return (
            a.ignoreCase == b.ignoreCase &&
            a.multiline == b.multiline &&
            a.lastIndex == b.lastIndex &&
            a.global == b.global &&
            a.source == b.source
          );
        };

        /**
         * Compare objects `a`, `b`.
         *
         * @param {Object} a
         * @param {Object} b
         * @return {Boolean}
         * @api public
         */

        eql.object = function(a, b) {
          var keys = {};

          // proto
          if (a.prototype != b.prototype) return false;

          // keys
          keys.a = k(a).sort();
          keys.b = k(b).sort();

          // length
          if (keys.a.length != keys.b.length) return false;

          // keys
          if (keys.a.toString() != keys.b.toString()) return false;

          // walk
          for (var i = 0; i < keys.a.length; ++i) {
            var key = keys.a[i];
            if (!eql(a[key], b[key])) return false;
          }

          // eql
          return true;
        };

        /**
         * Compare arrays `a`, `b`.
         *
         * @param {Array} a
         * @param {Array} b
         * @return {Boolean}
         * @api public
         */

        eql.array = function(a, b) {
          if (a.length != b.length) return false;
          for (var i = 0; i < a.length; ++i) {
            if (!eql(a[i], b[i])) return false;
          }
          return true;
        };

        /**
         * Compare dates `a`, `b`.
         *
         * @param {Date} a
         * @param {Date} b
         * @return {Boolean}
         * @api public
         */

        eql.date = function(a, b) {
          return +a == +b;
        };
      },
      { type: 53, keys: 115 }
    ],
    115: [
      function(require, module, exports) {
        var has = Object.prototype.hasOwnProperty;

        module.exports =
          Object.keys ||
          function(obj) {
            var keys = [];

            for (var key in obj) {
              if (has.call(obj, key)) {
                keys.push(key);
              }
            }

            return keys;
          };
      },
      {}
    ],
    116: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var merge = require('merge');
        var eql = require('eql');

        /**
         * Create a test spy with `obj`, `method`.
         *
         * Examples:
         *
         *      s = require('spy')({}, 'toString');
         *      s = require('spy')(document.write);
         *      s = require('spy')();
         *
         * @param {Object|Function} obj
         * @param {String} method
         * @return {Function}
         * @api public
         */

        module.exports = function(obj, method) {
          var fn = toFunction(arguments, spy);
          merge(spy, proto);
          return spy.reset();

          function spy() {
            var args = [].slice.call(arguments);
            var ret = fn(arguments);
            spy.returns || spy.reset();
            spy.args.push(args);
            spy.returns.push(ret);
            spy.update();
            return ret;
          }
        };

        /**
         * Pseudo-prototype.
         */

        var proto = {};

        /**
         * Lazily match `args` and return `true` if the spy was called with them.
         *
         * @param {Arguments} args
         * @return {Boolean}
         * @api public
         */

        proto.got = proto.calledWith = proto.gotLazy = proto.calledWithLazy = function() {
          var a = [].slice.call(arguments);

          for (var i = 0, args; (args = this.args[i]); i++) {
            if (eql(a, args.slice(0, a.length))) return true;
          }

          return false;
        };

        /**
         * Exactly match `args` and return `true` if the spy was called with them.
         *
         * @param {Arguments} ...
         * @return {Boolean}
         * @api public
         */

        proto.gotExactly = proto.calledWithExactly = function() {
          var a = [].slice.call(arguments);

          for (var i = 0, args; (args = this.args[i]); i++) {
            if (eql(a, args)) return true;
          }

          return false;
        };

        /**
         * `true` if the spy returned `value`.
         *
         * @param {Mixed} value
         * @return {Boolean}
         * @api public
         */

        proto.returned = function(value) {
          var ret = this.returns[this.returns.length - 1];
          return eql(ret, value);
        };

        /**
         * `true` if the spy was called once.
         *
         * @return {Boolean}
         * @api public
         */

        proto.once = function() {
          return this.args.length == 1;
        };

        /**
         * `true` if the spy was called twice.
         *
         * @return {Boolean}
         * @api public
         */

        proto.twice = function() {
          return this.args.length == 2;
        };

        /**
         * `true` if the spy was called three times.
         *
         * @return {Boolean}
         * @api public
         */

        proto.thrice = function() {
          return this.args.length == 3;
        };

        /**
         * Reset the spy.
         *
         * @return {Function}
         * @api public
         */

        proto.reset = function() {
          this.returns = [];
          this.args = [];
          this.update();
          return this;
        };

        /**
         * Restore.
         *
         * @return {Function}
         * @api public
         */

        proto.restore = function() {
          if (!this.obj) return this;
          var m = this.method;
          var fn = this.fn;
          this.obj[m] = fn;
          return this;
        };

        /**
         * Update the spy.
         *
         * @return {Function}
         * @api private
         */

        proto.update = function() {
          this.called = !!this.args.length;
          this.calledOnce = this.once();
          this.calledTwice = this.twice();
          this.calledThrice = this.thrice();
          return this;
        };

        /**
         * To function.
         *
         * @param {...} args
         * @param {Function} spy
         * @return {Function}
         * @api private
         */

        function toFunction(args, spy) {
          var obj = args[0];
          var method = args[1];

          switch (args.length) {
            case 0:
              return function noop() {};
            case 1:
              return function(args) {
                return obj.apply(null, args);
              };
            case 2:
              var m = obj[method];
              merge(spy, m);
              spy.method = method;
              spy.fn = m;
              spy.obj = obj;
              obj[method] = spy;
              return function(args) {
                return m.apply(obj, args);
              };
          }
        }
      },
      { merge: 120, eql: 121 }
    ],
    9: [
      function(require, module, exports) {
        /**
         * Dependencies
         */

        var integration = require('analytics.js-integration');
        var extend = require('ndhoule/extend');
        var each = require('each');
        var v1Methods = require('./v1');
        var v2Methods = require('./v2');

        /**
         * hasOwnProperty reference.
         */

        var has = Object.prototype.hasOwnProperty;

        /**
         * Expose `Omniture`.
         */

        var Omniture = (module.exports = integration('Omniture'));

        /**
         * Uses the default `field` from the `window.s` object if it exists,
         * otherwise uses the passed in `value`. Also adds the field to
         * `this.sOptions` and `this.options`
         *
         * @api private
         * @param {string} field
         * @param {*} value
         */

        Omniture.sOption = function(field, value) {
          var s = window.s;
          // TODO: If we document that they can attach stuff to window.s outside of Segment
          // we'd also make sure they have s.trackingServer and s.trackingServerSecure defined since
          // .global(s) means that our initialize function will return early??
          var isValid = s && has.call(s, field) && !isEmptyString(field);

          value = isValid ? s[field] : value;

          // TODO: Consider removing this. Not sure why we are doing this since it has no future reference
          this.prototype.sOptions = this.prototype.sOptions || {};
          this.prototype.sOptions[field] = value;

          // Set field and value to this.options
          return this.option(field, value);
        };

        /**
         * Add our omniture
         */

        Omniture.global('s')
          .global('s_gi')
          .option('initialPage', true)
          .option('events', {})
          .option('eVars', {})
          .option('props', {})
          .option('hVars', {})
          .option('reportSuiteId', window.s_account)
          .option('includeTimestamp', true)
          .option('version', 1)
          .sOption('visitorID')
          .sOption('channel')
          .sOption('campaign')
          .sOption('state')
          .sOption('zip')
          .sOption('pageName')
          .sOption('trackingServer')
          .sOption('trackingServerSecure')
          .sOption('visitorMigrationKey')
          .sOption('visitorMigrationServer')
          .sOption('visitorNamespace')
          .sOption('dc')
          .sOption('charSet', 'ISO-8859-1')
          .sOption('currencyCode', 'USD')
          .sOption('trackDownloadLinks', true)
          .sOption('trackExternalLinks', true)
          .sOption('trackInlineStats', true)
          .sOption(
            'linkDownloadFileTypes',
            'exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx'
          )
          .sOption('linkInternalFilters')
          .sOption('linkLeaveQueryString', false)
          .sOption('linkTrackVars', 'None')
          .sOption('linkTrackEvents', 'None')
          .sOption('usePlugins', true)
          .tag(
            '1',
            '<script src="//cdn.segment.io/integrations/omniture/H.26.2/omniture.min.js">'
          )
          .tag(
            '2',
            '<script src="http://localhost:1738/appmeasurement.min.js">'
          );
        // .tag('2', '<script src="//cdn.segment.io/integrations/omniture/AppMeasurement-1.6/appmeasurement.min.js">'); // TODO: uncomment once CDN issues are resolved

        /**
         * Initialize.
         *
         * @api public
         */

        Omniture.prototype.initialize = function() {
          var options = this.options;
          var self = this;

          // Lowercase all keys of event map for easy matching later
          lowercaseKeys(options.events);

          // In case this has been defined already
          window.s_account = window.s_account || options.reportSuiteId;

          // TODO: consider removing this since it has no future reference
          this.loadedBySegmentio = true;

          // Decide which script to load
          // this.load requires a string
          var version = options.version === 2 ? '2' : '1';

          // Extend this integration with proper API methods
          if (options.version === 2) {
            extend(this, v2Methods);
          } else {
            extend(this, v1Methods);
          }

          this.load(version, function() {
            var s = window.s;
            // TODO: rename on server-side and mobile
            s.trackingServer = s.trackingServer || options.trackingServerUrl;
            s.trackingServerSecure =
              s.trackingServerSecure || options.trackingServerSecureUrl;
            self.ready();
          });
        };

        /**
         * Omniture is loaded if the `window.s_gi` function exists.
         *
         * @return {Boolean} loaded
         */

        Omniture.prototype.loaded = function() {
          // TODO: wouldn't this always pass because of the .global(s_gi) ??
          return !!window.s_gi;
        };

        /**
         * Lowercase all of an object's keys.
         *
         * @api private
         * @param {Object} obj
         * @return {Object}
         */

        function lowercaseKeys(obj) {
          obj = obj || {};
          each(obj, function(key, value) {
            delete obj[key];
            obj[key.toLowerCase()] = value;
          });
          return obj;
        }

        /**
         * Return whether `str` is an empty string.
         *
         * @api private
         * @return {boolean} empty
         */

        function isEmptyString(str) {
          return typeof str === 'string' && str.length === 0;
        }
      },
      {
        'analytics.js-integration': 6,
        'ndhoule/extend': 122,
        each: 123,
        './v1': 124,
        './v2': 125
      }
    ],
    122: [
      function(require, module, exports) {
        'use strict';

        /**
         * hasOwnProperty reference.
         */

        var has = Object.prototype.hasOwnProperty;

        /**
         * Copy the properties of one or more `objects` onto a destination object. Input objects are iterated over
         * in left-to-right order, so duplicate properties on later objects will overwrite those from
         * erevious ones. Only enumerable and own properties of the input objects are copied onto the
         * resulting object.
         *
         * @name extend
         * @api public
         * @category Object
         * @param {Object} dest The destination object.
         * @param {...Object} sources The source objects.
         * @return {Object} `dest`, extended with the properties of all `sources`.
         * @example
         * var a = { a: 'a' };
         * var b = { b: 'b' };
         * var c = { c: 'c' };
         *
         * extend(a, b, c);
         * //=> { a: 'a', b: 'b', c: 'c' };
         */

        module.exports = function(dest /* , sources */) {
          var sources = Array.prototype.slice.call(arguments, 1);

          for (var i = 0; i < sources.length; i += 1) {
            for (var key in sources[i]) {
              if (has.call(sources[i], key)) {
                dest[key] = sources[i][key];
              }
            }
          }

          return dest;
        };
      },
      {}
    ],
    123: [
      function(require, module, exports) {
        /**
         * Module dependencies.
         */

        var toFunction = require('to-function');
        var type;

        try {
          type = require('type-component');
        } catch (e) {
          type = require('type');
        }

        /**
         * HOP reference.
         */

        var has = Object.prototype.hasOwnProperty;

        /**
         * Iterate the given `obj` and invoke `fn(val, i)`.
         *
         * @param {String|Array|Object} obj
         * @param {Function} fn
         * @api public
         */

        module.exports = function(obj, fn) {
          fn = toFunction(fn);
          switch (type(obj)) {
            case 'array':
              return array(obj, fn);
            case 'object':
              if (typeof obj.length === 'number') return array(obj, fn);
              return object(obj, fn);
            case 'string':
              return string(obj, fn);
          }
        };

        /**
         * Iterate string chars.
         *
         * @param {String} obj
         * @param {Function} fn
         * @api private
         */

        function string(obj, fn) {
          for (var i = 0; i < obj.length; ++i) {
            fn(obj.charAt(i), i);
          }
        }

        /**
         * Iterate object keys.
         *
         * @param {Object} obj
         * @param {Function} fn
         * @api private
         */

        function object(obj, fn) {
          for (var key in obj) {
            if (has.call(obj, key)) {
              fn(key, obj[key]);
            }
          }
        }

        /**
         * Iterate array-ish.
         *
         * @param {Array|Object} obj
         * @param {Function} fn
         * @api private
         */

        function array(obj, fn) {
          for (var i = 0; i < obj.length; ++i) {
            fn(obj[i], i);
          }
        }
      },
      { 'to-function': 79, type: 53 }
    ],
    124: [
      function(require, module, exports) {
        // https://developer.omniture.com/en_US/content_page/sitecatalyst-tagging/c-tagging-overview
        // http://blogs.adobe.com/digitalmarketing/analytics/custom-link-tracking-capturing-user-actions/
        // https://developer.omniture.com/en_US/forum/general-topic-forum/difference-between-s-t-and-s-t1

        var dot = require('obj-case');
        var each = require('each');
        var iso = require('to-iso-string');
        var map = require('map');
        var type = require('type');

        /**
         * Keys that get applied to `window.s` object,
         * but need to be cleared out before every call.
         */

        var dynamicKeys = [];

        /**
         * Map of ecommerce event names.
         */

        var omnitureEventMap = {
          // ecommerce api
          prodView: [/viewed product/i],
          scAdd: [/added product/i],
          scRemove: [/removed product/i],
          purchase: [/completed order/i],

          // omniture specific
          scView: [/viewed cart/i],
          // whatever that means
          scOpen: [/opened cart/i],
          scCheckout: [/viewed checkout/i]
        };

        /**
         * Create V1 Method object to attach methods to.
         */

        var v1Methods = {};

        /**
         * Track.
         *
         * @api public
         * @param {Track} track
         */

        v1Methods.track = function(track) {
          if (!window.s_gi) return;

          var event = aliasEvent(track.event(), this.options.events);
          if (!event) return;

          var properties = track.properties();
          window.s.linkTrackEvents = event;

          clearKeys(dynamicKeys);

          // Update the omniture variable and explicitly mark the link vars
          function update(key, value) {
            if (!key || value === undefined || value === null) return;
            dynamicKeys.push(key);
            window.s[key] = value.toString();
          }

          update('events', event);
          update('channel', properties.channel || this.options.channel);
          update('campaign', properties.campaign || this.options.campaign);
          update('pageName', properties.pageName || this.options.pageName);
          update('state', properties.state || this.options.state);
          update('zip', properties.zip || this.options.zip);
          update('purchaseID', properties.purchaseId);
          update('transactionID', properties.transactionId);

          // Timestamp must be either unix or iso-8601
          // See docs.pdf page 98.
          if (this.options.includeTimestamp) {
            var timestamp = properties.timestamp || track.timestamp();
            if (typeof timestamp !== 'string') timestamp = iso(timestamp);
            update('timestamp', timestamp);
          }

          // Alias for omniture specific events.
          if (omnitureEventMap[event]) {
            if (properties.product) {
              update('products', formatProduct(properties));
            } else {
              var products = properties.products;
              if (products && type(products) === 'array') {
                var productStrings = map(products, formatProduct);
                update('products', productStrings.join(', '));
              }
            }
          }

          // Set props and eVars for event properties
          var props = extractProperties(properties, this.options);
          each(props, update);

          // Set eVar for event name
          var eventEVar = dot(this.options.eVars, track.event());
          update(eventEVar, track.event());

          window.s.linkTrackVars = dynamicKeys.join(',');

          // Send request off to Omniture
          window.s.tl(true, 'o', track.event());
        };

        /**
         * Page.
         *
         * @api public
         * @param {Page} page
         */

        v1Methods.page = function(page) {
          var options = this.options;
          // If we ignore the first pageview, enable for all subsequent pageviews
          if (options.page == null) options.page = options.initialPage;
          if (!options.page) {
            options.page = true;
            return;
          }

          // If omniture isn't loaded yet, try again soon.
          if (!this.loaded()) {
            var self = this;
            setTimeout(function() {
              self.page(page);
            }, 100);
            return;
          }

          // Set the page name
          var name = page.fullName();
          window.s.pageName = name;

          // Visitor ID.
          var user = this.analytics.user();
          if (user.id()) window.s.visitorID = user.id();

          // Get the properties
          var track = page.track();
          var properties = track.properties();

          clearKeys(dynamicKeys);
          // Update the omniture variable and explicitly mark the link vars
          function update(key, value) {
            if (!key || value === undefined || value === null) return;
            dynamicKeys.push(key);
            window.s[key] = value.toString();
          }

          update('events', name);
          update('channel', properties.channel || this.options.channel);
          update('campaign', properties.campaign || this.options.campaign);
          update('state', properties.state || this.options.state);
          update('zip', properties.zip || this.options.zip);
          update('purchaseID', properties.purchaseId);
          update('transactionID', properties.transactionId);

          if (this.options.includeTimestamp) {
            var timestamp = properties.timestamp || track.timestamp();
            if (typeof timestamp !== 'string') timestamp = iso(timestamp);
            update('timestamp', timestamp);
          }

          var props = extractProperties(properties, this.options);
          each(props, update);

          // actually make the "page" request, just a single "t" no "tl"
          window.s.t();
        };

        /**
         * Alias a regular event `name` to an Omniture event, using a dictionary of
         * `events`.
         *
         * @api private
         * @param {string} name
         * @param {Object} events
         * @return {string|null}
         */

        function aliasEvent(name, events) {
          var aliased = null;

          // First attempt to look through omniture events
          each(omnitureEventMap, function(key) {
            if (name === key) {
              aliased = key;
              return;
            }

            var regexes = omnitureEventMap[key];

            for (var i = 0; i < regexes.length; i++) {
              if (regexes[i].test(name)) {
                aliased = key;
                return;
              }
            }
          });

          if (aliased) return aliased;

          // Otherwise if it has an aliased name to a stored event.
          if (events[name.toLowerCase()]) return events[name.toLowerCase()];

          // Hope that they passed in a normal event
          if (/event\d+/.test(name)) return name;
        }

        /**
         * Format product descriptions from objects to Omniture description strings.
         *
         * @api private
         * @param {Object} description
         * @return {string}
         */

        function formatProduct(description) {
          return [
            description.category,
            description.product,
            description.quantity || 1,
            description.price || 0
          ].join('; ');
        }

        /**
         * Clear last keys used with omniture.
         *
         * @api private
         * @param {Array} keys
         */

        function clearKeys(keys) {
          each(keys, function(linkVar) {
            delete window.s[linkVar];
          });
          keys.length = 0;
        }

        /**
         * Extract properties for `window.s`.
         *
         * @api private
         * @param {Object} props
         * @param {Object} options
         */

        function extractProperties(props, options) {
          var result = {};

          // 1. map eVars
          each(options.eVars, function(mappedKey, mappedValue) {
            var value = dot(props, mappedKey);
            // for backwards compatibility
            if (value != null) result[mappedValue] = value;
          });

          // 2. map props
          each(options.props, function(mappedKey, mappedValue) {
            var value = dot(props, mappedKey);
            if (value != null) result[mappedValue] = value;
          });

          // 3. map hVars
          each(options.hVars, function(mappedKey, mappedValue) {
            var value = dot(props, mappedKey);
            if (value != null) result[mappedValue] = value;
          });

          // 4. map basic properties
          // they don't have a specific mapping, but
          // named it like omniture does
          each(props, function(key, value) {
            if (
              /prop\d+/i.test(key) ||
              /eVar\d+/i.test(key) ||
              /hier\d+/i.test(key)
            ) {
              result[key] = value;
              return;
            }
            var prop = dot(options.props, key);
            var eVar = dot(options.eVars, key);
            var hVar = dot(options.hVars, key);
            // Add case for mirroring a prop post check.
            if (!eVar && prop) eVar = options.eVars[prop];
            if (prop) result[prop] = value;
            if (eVar) result[eVar] = value;
            if (hVar) result[hVar] = value;
          });

          return result;
        }

        /**
         * Metadata used for testing. Please do not use anywhere else in code
         */

        v1Methods.__version = 1;

        /**
         * Expose `v1Methods`.
         */

        module.exports = v1Methods;
      },
      { 'obj-case': 126, each: 123, 'to-iso-string': 127, map: 78, type: 100 }
    ],
    126: [
      function(require, module, exports) {
        var identity = function(_) {
          return _;
        };

        /**
         * Module exports, export
         */

        module.exports = module.exports.find = multiple(find);

        /**
         * Export the replacement function, return the modified object
         */

        module.exports.replace = function(obj, key, val) {
          multiple(replace).apply(this, arguments);
          return obj;
        };

        /**
         * Export the delete function, return the modified object
         */

        module.exports.del = function(obj, key) {
          multiple(del).apply(this, arguments);
          return obj;
        };

        /**
         * Compose applying the function to a nested key
         */

        function multiple(fn) {
          return function(obj, path, val) {
            path = normalize(path);

            var key;
            var finished = false;

            while (!finished) loop();

            function loop() {
              for (key in obj) {
                var normalizedKey = normalize(key);
                if (path.indexOf(normalizedKey) === 0) {
                  var temp = path.substr(normalizedKey.length);
                  if (temp.charAt(0) === '.' || temp.length === 0) {
                    path = temp.substr(1);
                    var child = obj[key];

                    // we're at the end and there is nothing.
                    if (child == null) {
                      finished = true;
                      obj = null;
                      return;
                    }

                    // we're at the end and there is something.
                    if (!path.length) {
                      finished = true;
                      return;
                    }

                    // step into child
                    obj = child;

                    // but we're done here
                    return;
                  }
                }
              }

              key = undefined;
              // if we found no matching properties
              // on the current object, there's no match.
              finished = true;
            }

            if (!key) return;

            // the `obj` and `key` is one above the leaf object and key, so
            // start object: { a: { 'b.c': 10 } }
            // end object: { 'b.c': 10 }
            // end key: 'b.c'
            // this way, you can do `obj[key]` and get `10`.
            return fn(obj, key, val);
          };
        }

        /**
         * Find an object by its key
         *
         * find({ first_name : 'Calvin' }, 'firstName')
         */

        function find(obj, key) {
          if (obj.hasOwnProperty(key)) return obj[key];
        }

        /**
         * Delete a value for a given key
         *
         * del({ a : 'b', x : 'y' }, 'X' }) -> { a : 'b' }
         */

        function del(obj, key) {
          if (obj.hasOwnProperty(key)) delete obj[key];
          return obj;
        }

        /**
         * Replace an objects existing value with a new one
         *
         * replace({ a : 'b' }, 'a', 'c') -> { a : 'c' }
         */

        function replace(obj, key, val) {
          if (obj.hasOwnProperty(key)) obj[key] = val;
          return obj;
        }

        /**
         * Normalize a `dot.separated.path`.
         *
         * A.HELL(!*&#(!)O_WOR   LD.bar => ahelloworldbar
         *
         * @param {String} path
         * @return {String}
         */

        function normalize(path) {
          return path.replace(/[^a-zA-Z0-9\.]+/g, '').toLowerCase();
        }
      },
      {}
    ],
    127: [
      function(require, module, exports) {
        /**
         * Expose `toIsoString`.
         */

        module.exports = toIsoString;

        /**
         * Turn a `date` into an ISO string.
         *
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
         *
         * @param {Date} date
         * @return {String}
         */

        function toIsoString(date) {
          return (
            date.getUTCFullYear() +
            '-' +
            pad(date.getUTCMonth() + 1) +
            '-' +
            pad(date.getUTCDate()) +
            'T' +
            pad(date.getUTCHours()) +
            ':' +
            pad(date.getUTCMinutes()) +
            ':' +
            pad(date.getUTCSeconds()) +
            '.' +
            String((date.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5) +
            'Z'
          );
        }

        /**
         * Pad a `number` with a ten's place zero.
         *
         * @param {Number} number
         * @return {String}
         */

        function pad(number) {
          var n = number.toString();
          return n.length === 1 ? '0' + n : n;
        }
      },
      {}
    ],
    125: [
      function(require, module, exports) {
        /**
         * Various docs for reference
         *
         * https://marketing.adobe.com/resources/help/en_US/sc/implement/appmeasure_mjs_migrate.html
         * https://webanalyticsfordevelopers.com/2013/12/10/migrating-from-h-code-to-appmeasurement/
         * https://blogs.adobe.com/digitalmarketing/mobile/lighten-up-with-the-smaller-faster-analytics-javascript-for-web-mobile/
         * https://webanalyticsfordevelopers.com/2013/04/05/the-s_code-js-file-plugins/
         * https://webanalyticsfordevelopers.com/2013/04/09/variables/
         * https://webanalyticsfordevelopers.com/2013/07/02/tracking-links-actions/
         * https://docs.adobe.com/docs/en/aem/6-2/administer/integration/marketing-cloud/sitecatalyst.html
         * https://blogs.adobe.com/digitalmarketing/analytics/custom-link-tracking-capturing-user-actions/
         * https://www.cheatography.com/dmpg-tom/cheat-sheets/adobe-analytics-omniture-sitecatalyst-parameters/
         * http://www.adobe.com/marketing-cloud/web-analytics.html
         * http://www.adobe.com/marketing-cloud/web-analytics/standard.html
         * https://webanalyticsfordevelopers.com/2013/07/16/context-data-variables-processing-rules/
         * https://marketing.adobe.com/developer/documentation/data-insertion/c-visitor-id
         * https://marketing.adobe.com/developer/documentation/data-insertion/c-delayed-data
         * https://marketing.adobe.com/resources/help/en_US/sc/implement/timestamps-overview.html
         * https://marketing.adobe.com/developer/get-started/concepts-terminology/c-what-are-the-available-analytics-variables-and-events
         * https://blogs.adobe.com/digitalmarketing/analytics/products-variable-inside-omniture-sitecatalyst/
         * http://webanalyticssimplified.blogspot.com/2010/02/omniture-sitecatalyst-events.html
         */

        var dot = require('obj-case');
        var each = require('each');
        var iso = require('to-iso-string');

        /**
         * Keys that get applied to `window.s` object,
         * but need to be cleared out before every call.
         *
         * We need to keep this array to share state because otherwise,
         * we can't delete existing keys on the window.s object in between
         * `.track()` and `.page()` calls since they may set different fields.
         * This prevents properties of `.page()` call being sent along with
         * `.track()` calls.
         */

        var dynamicKeys = [];

        /**
         * Create V2 Method object to attach methods to.
         */

        var v2Methods = {};

        /**
         * Track.
         *
         * @api public
         * @param {Track} track
         */

        v2Methods.track = function(track) {
          // TODO: do we really need this here? isn't this taken care of during
          // our init process?
          if (!window.s_gi) return;

          // Find omniture event name from setting's event map
          // otherwise abort
          var event = aliasEvent(track.event(), this.options.events);
          if (!event) return;

          // Delete any existing keys on window.s from previous call
          clearKeys(dynamicKeys);

          var properties = track.properties();
          // Tell Adobe Analytics name of the event
          window.s.linkTrackEvents = event;

          // Attach some semantic variables on the `window.s` to be sent with the call
          update('events', event);
          updateCommonVariables(track, this.options);

          // If this is `true`, you must either set your Reporting Suite to be
          // timestamp or hybrid enabled. If your RS is not timestamp enabled,
          // data will be dropped by Adobe Analytics
          if (this.options.includeTimestamp) updateTimestamp(track);

          // Check if any properties match mapped eVar, prop, or hVar in options
          var props = extractProperties(properties, this.options);
          // Attach them to window.s and push to dynamicKeys
          each(props, update);

          // Set eVar for event name if mapped
          var eventEVar = dot(this.options.eVars, track.event());
          update(eventEVar, track.event());

          // Tell omniture which variables (props/eVars/hVars) to track
          // This is only required for `s.tl()` not `s.t()`
          window.s.linkTrackVars = dynamicKeys.join(',');
          // Send request off to Adobe Analytics
          // 1st param: sets 500ms delay to give browser time, also means you are tracking something other than a href link
          // 2nd param: 'o' means 'Other' as opposed to 'd' for 'Downloads' and 'e' for Exit links
          // 3rd param: link name you will see in reports
          window.s.tl(true, 'o', track.event());
        };

        /**
         * Viewed Product.
         *
         * https://segment.com/docs/spec/ecommerce/#viewed-product
         * @api public
         * @param {Track} Track
         */

        v2Methods.productViewed = function(track) {
          processEcommerceEvent(track, 'prodView', this.options);
          window.s.tl(true, 'o', track.event());
        };

        /**
         * Product Added
         *
         * https://segment.com/docs/spec/ecommerce/#added-removed-product
         * @api public
         * @param {Track} Track
         */

        v2Methods.productAdded = function(track) {
          processEcommerceEvent(track, 'scAdd', this.options);
          window.s.tl(true, 'o', track.event());
        };

        /**
         * Product Removed
         *
         * https://segment.com/docs/spec/ecommerce/#added-removed-product
         * @api public
         * @param {Track} Track
         */

        v2Methods.productRemoved = function(track) {
          processEcommerceEvent(track, 'scRemove', this.options);
          window.s.tl(true, 'o', track.event());
        };

        /**
         * Order Completed
         * https://segment.com/docs/spec/ecommerce/#completing-an-order
         * @api public
         * @param {Track} Track
         */

        v2Methods.orderCompleted = function(track) {
          var properties = track.properties();
          processEcommerceEvent(track, 'purchase', this.options);
          update('purchaseID', properties.purchaseId || track.orderId());
          update('transactionID', properties.transactionId || track.orderId());
          window.s.tl(true, 'o', track.event());
        };

        /**
         * Cart Viewed
         *
         * @api public
         * @param {Track} Track
         */

        v2Methods.cartViewed = function(track) {
          processEcommerceEvent(track, 'scView', this.options);
          window.s.tl(true, 'o', track.event());
        };

        /**
         * Cart Opened
         *
         * @api public
         * @param {Track} Track
         */

        v2Methods.cartOpened = function(track) {
          processEcommerceEvent(track, 'scOpen', this.options);
          window.s.tl(true, 'o', track.event());
        };

        /**
         * Checkout Started
         *
         * @api public
         * @param {Track} Track
         */

        v2Methods.checkoutStarted = function(track) {
          // TODO: Document this breaking change
          // It was previously `viewed checkout`
          processEcommerceEvent(track, 'scCheckout', this.options);
          window.s.tl(true, 'o', track.event());
        };

        /**
         * Page.
         *
         * @api public
         * @param {Page} page
         */

        v2Methods.page = function(page) {
          var options = this.options;
          // If we ignore the first pageview, enable for all subsequent pageviews
          // TODO: THIS IS NOT THE BEHAVIOR DESCRIBED IN THE DOCS
          // Docs: Disable this if you'd like to manually continue tracking your own pages using `s.t()`.
          // Label: Yes, I want Segment to track an automatic pageview for Omniture rather than handling it myself
          // ^ we should say "track an initial automatic pageview"
          if (options.page == null) options.page = options.initialPage;
          if (!options.page) {
            options.page = true;
            return;
          }

          // If omniture isn't loaded yet, try again soon.
          // TODO: revisit this, do we need this?
          if (!this.loaded()) {
            var self = this;
            setTimeout(function() {
              self.page(page);
            }, 100);
            return;
          }

          // Delete any existing keys on window.s from previous call
          clearKeys(dynamicKeys);

          // Set the page name
          var pageName = page.fullName();
          // TODO: for nameless analytics.page(), pageName is `undefined`
          // Should we be setting or sending something else here?
          // When window.s.pageName is not set, AA falls back on url which is bad.
          // Not sure what happens when it is sent as `undefined` (not string)
          // Either way, any change here would be breaking
          window.s.pageName = pageName;

          // Visitor ID aka AA's concept of `userId`.
          // This is not using `update()` so once it is set, it will be sent
          // with `.track()` calls as well.
          // visitorId is not supported for timestamped hits
          var userId = this.analytics.user().id();
          if (userId && !this.options.includeTimestamp)
            window.s.visitorID = userId;

          // Attach some variables on the `window.s` to be sent with the call
          update('events', pageName);
          updateCommonVariables(page, this.options);

          if (this.options.includeTimestamp) updateTimestamp(page);

          // Check if any properties match mapped eVar, prop, or hVar in options
          var props = extractProperties(page.properties(), this.options);
          // Attach them to window.s and push to dynamicKeys
          each(props, update);

          // actually make the "page" request, just a single "t" not "tl"
          // "t" will send all variables on the window.s while "tl" does not
          // "t" will increment pageviews while "tl" does not
          window.s.t();
        };

        /**
         * Process Ecommerce events
         *
         * @api private
         * @param {Facade} facade
         * @param {String} adobe event name
         * @param {Object} options
         */

        function processEcommerceEvent(track, name, options) {
          var props = track.properties();
          var productVariables = formatProduct(props);
          var adobeVariables = extractProperties(props, options);
          var eventEVar = dot(options.eVars, track.event());

          clearKeys(dynamicKeys);

          update('events', name);
          updateCommonVariables(track, options);
          update(eventEVar, track.event());
          update('products', productVariables);
          each(adobeVariables, update);

          if (options.includeTimestamp) updateTimestamp(track);

          window.s.linkTrackEvents = name;
          window.s.linkTrackVars = dynamicKeys.join(',');
        }

        /**
         * Update a number of Adobe Analytics common variables on window.s to be
         * sent with the call
         *
         * @api private
         * @param {Facade} facade
         */

        function updateCommonVariables(facade, options) {
          var properties = facade.properties();

          update('channel', properties.channel || options.channel);
          update('campaign', properties.campaign || options.campaign);
          update('state', properties.state || options.state);
          update('zip', properties.zip || options.zip);
          if (facade.type() === 'track')
            update(
              'pageName',
              properties.pageName ||
                options.pageName ||
                facade.proxy('context.page.title')
            );
        }

        /**
         * Update the omniture variable and explicitly mark the link vars
         *
         * @api private
         * @param {String, String} key, value
         * @return {string} window.s[key]
         */

        function update(key, value) {
          // Make sure we have everything we need
          if (!key || value === undefined || value === null) return;
          // Push each key to be sent later with the payload
          // Only keys listed here will be parsed from the window.s object when data is sent via s.tl() aka `.track()` calls
          dynamicKeys.push(key);
          // Set Adobe Analytics variables on the window.s to be sent
          window.s[key] = value.toString();
        }

        /**
         * Update window.s.timestamp
         *
         * @api private
         * @param {Facade} facade
         */

        function updateTimestamp(facade) {
          var properties = facade.properties();
          // TODO: revisit the fallback order here
          var timestamp = properties.timestamp || facade.timestamp();
          // Timestamp must be either unix or iso-8601
          if (typeof timestamp !== 'string') timestamp = iso(timestamp);
          update('timestamp', timestamp);
        }

        /**
         * Alias a regular event `name` to an Omniture event, using a dictionary of
         * `events`.
         *
         * @api private
         * @param {string} name
         * @param {Object} events
         * @return {string|null}
         */

        function aliasEvent(name, events) {
          if (events[name.toLowerCase()]) return events[name.toLowerCase()];
        }

        /**
         * Format semantic ecommerce product properties to Adobe Analytics variable strings.
         *
         * @api private
         * @param {Object} props
         * @return {string}
         */

        function formatProduct(props) {
          return [
            props.category,
            props.name,
            props.quantity || 1,
            props.price || 0
          ].join('; ');
        }

        /**
         * Clear last keys used with omniture.
         *
         * @api private
         * @param {Array} keys
         */

        function clearKeys(keys) {
          each(keys, function(linkVar) {
            delete window.s[linkVar];
          });
          // Clears the array passed in
          keys.length = 0;
        }

        /**
         * Extract properties for `window.s`.
         *
         * @api private
         * @param {Object} props
         * @param {Object} options
         */

        function extractProperties(props, options) {
          var result = {};
          var mappings = [options.eVars, options.props, options.hVars];

          // Iterate through each variable mappings to find matching props
          for (var x = 0; x < mappings.length; x++) {
            each(mappings[x], match);
          }

          function match(mappedKey, mappedValue) {
            var value = dot(props, mappedKey);
            // for backwards compatibility
            if (value != null) result[mappedValue] = value;
          }

          return result;
        }

        /**
         * Metadata used for testing. Please do not use anywhere else in code
         */

        v2Methods.__version = 2;

        /**
         * Expose `v2Methods`.
         */

        module.exports = v2Methods;
      },
      { 'obj-case': 126, each: 123, 'to-iso-string': 127 }
    ],
    3: [
      function(require, module, exports) {
        var Analytics = require('analytics.js-core').constructor;
        var iso = require('to-iso-string');
        var sandbox = require('clear-env');
        var tester = require('analytics.js-integration-tester');
        var Omniture = require('../lib/');

        describe('Omniture', function() {
          var analytics;
          var omniture;
          var user;
          var options = {
            version: 1,
            reportSuiteId: 'segmentio',
            trackingServerUrl: 'segment.io',
            trackingServerSecureUrl: 'secure.segment.io',
            events: {
              'Played a Song': 'event1',
              'Drank Some Milk': 'event6',
              EventEVar: 'event7'
            },
            eVars: {
              Car: 'eVar1',
              Dog: 'eVar47',
              prop20: 'eVar63',
              EventEVar: 'eVar65',
              'Car.Info': 'eVar101',
              'My.Dog': 'eVar401'
            },
            props: {
              Airplane: 'prop20',
              Dog: 'prop40',
              Good: 'prop10',
              Type: 'prop13',
              Brand: 'prop23'
            },
            hVars: {
              hier_group1: 'hier1',
              hier_group2: 'hier2'
            }
          };

          beforeEach(function() {
            analytics = new Analytics();
            omniture = new Omniture(options);
            analytics.use(Omniture);
            analytics.use(tester);
            analytics.add(omniture);
            user = analytics.user();
          });

          afterEach(function() {
            analytics.restore();
            analytics.reset();
            omniture.reset();
            sandbox();
          });

          describe('V1', function() {
            beforeEach(function(done) {
              analytics.once('ready', done);
              analytics.initialize();
            });

            describe('#track', function() {
              it('tracks normal events', function() {
                analytics.track('event1');
                analytics.equal(window.s.events, 'event1');
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(contains(window.s.linkTrackVars, 'events'));
              });

              it('tracks aliased events', function() {
                analytics.track('Drank some milk');
                analytics.equal(window.s.events, 'event6');
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(contains(window.s.linkTrackVars, 'events'));
              });

              it('tracks built-in events', function() {
                analytics.track('scAdd');
                analytics.equal(window.s.events, 'scAdd');
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(contains(window.s.linkTrackVars, 'events'));
              });

              it('tracks aliases for built-in events', function() {
                analytics.track('Viewed Product');
                analytics.equal(window.s.events, 'prodView');
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(contains(window.s.linkTrackVars, 'events'));
              });

              it('tracks product information', function() {
                analytics.track('Viewed Product', {
                  product: 'Wooden Teeth',
                  quantity: 32,
                  category: 'Dental Aids',
                  price: 17.76
                });
                analytics.equal(
                  window.s.products,
                  'Dental Aids; Wooden Teeth; 32; 17.76'
                );
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(
                  contains(window.s.linkTrackVars, 'events', 'products')
                );
              });

              it('tracks multiple product information', function() {
                analytics.track('Viewed Cart', {
                  products: [
                    {
                      product: 'Wooden Teeth',
                      quantity: 32,
                      category: 'Dental Aids',
                      price: 17.76
                    },
                    {
                      product: 'Mole People',
                      quantity: 100,
                      category: 'Subterranean',
                      price: 32.32
                    }
                  ]
                });
                analytics.equal(
                  window.s.products,
                  'Dental Aids; Wooden Teeth; 32; 17.76, ' +
                    'Subterranean; Mole People; 100; 32.32'
                );
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(
                  contains(window.s.linkTrackVars, 'events', 'products')
                );
              });

              it('tracks aliased properties', function() {
                analytics.track('Drank Some Milk', {
                  type: '2%',
                  brand: 'Lucerne',
                  good: true
                });
                analytics.equal(window.s.prop13, '2%');
                analytics.equal(window.s.prop23, 'Lucerne');
                analytics.equal(window.s.prop10, 'true');
                analytics.assert(
                  contains(
                    window.s.linkTrackVars,
                    'events',
                    'prop13',
                    'prop23',
                    'prop10'
                  )
                );
              });

              it('tracks basic properties', function() {
                analytics.track('event10', {
                  prop1: 20,
                  prop50: 'good',
                  prop73: true
                });
                analytics.equal(window.s.prop73, 'true');
                analytics.equal(window.s.prop1, '20');
                analytics.equal(window.s.prop50, 'good');
                analytics.assert(
                  contains(
                    window.s.linkTrackVars,
                    'events',
                    'prop1',
                    'prop50',
                    'prop73'
                  )
                );
              });

              it('tracks basic properties of all cases', function() {
                analytics.track('event10', {
                  brand: 'Lucerne'
                });
                analytics.equal(window.s.prop23, 'Lucerne');
                analytics.track('event10', {
                  Brand: 'Lucerne'
                });
                analytics.equal(window.s.prop23, 'Lucerne');
                analytics.track('event10', {
                  BrANd: 'Lucerne'
                });
                analytics.equal(window.s.prop23, 'Lucerne');
                analytics.track('event10', {
                  BRAND: 'Lucerne'
                });
                analytics.equal(window.s.prop23, 'Lucerne');
              });

              it('tracks aliased eVars with nested properties', function() {
                analytics.track('Drank Some Milk', {
                  car: { info: '2003 Accord (only one previous owner)' },
                  'my.dog': 'Dog',
                  good: false
                });
                analytics.equal(
                  window.s.eVar101,
                  '2003 Accord (only one previous owner)'
                );
                analytics.equal(window.s.eVar401, 'Dog');
                analytics.assert(
                  contains(
                    window.s.linkTrackVars,
                    'events',
                    'eVar101',
                    'eVar401',
                    'prop10'
                  )
                );
              });

              it('tracks basic eVars', function() {
                analytics.track('event20', {
                  eVar20: '123',
                  eVar54: false,
                  eVar: 'a'
                });
                analytics.equal(window.s.eVar, undefined);
                analytics.equal(window.s.eVar20, '123');
                analytics.equal(window.s.eVar54, 'false');
                analytics.assert(
                  contains(window.s.linkTrackVars, 'events', 'eVar20', 'eVar54')
                );
              });

              it('tracks event eVars', function() {
                analytics.track('EventEVar');
                analytics.equal(window.s.eVar65, 'EventEVar');
                analytics.assert(
                  contains(window.s.linkTrackVars, 'events', 'eVar65')
                );
              });

              it('mirrors eVars and properties', function() {
                analytics.track('event54', {
                  prop20: 'abc',
                  dog: 'malamute',
                  eVar49: true
                });
                analytics.equal(window.s.eVar49, 'true');
                analytics.equal(window.s.prop20, 'abc');
                analytics.equal(window.s.eVar63, 'abc');
                analytics.equal(window.s.eVar47, 'malamute');
                analytics.equal(window.s.prop40, 'malamute');
                analytics.assert(
                  contains(
                    window.s.linkTrackVars,
                    'events',
                    'prop20',
                    'eVar63',
                    'prop40',
                    'eVar47',
                    'eVar49'
                  )
                );
              });

              it('mirrors eVars which are not aliased', function() {
                analytics.track('event1', {
                  airplane: 'boeing 747'
                });
                analytics.equal(window.s.eVar63, 'boeing 747');
                analytics.equal(window.s.prop20, 'boeing 747');
                analytics.assert(
                  contains(window.s.linkTrackVars, 'events', 'prop20', 'eVar63')
                );
              });

              it('should respect properties.timestamp', function() {
                var date = new Date();
                analytics.track('event1', { timestamp: date });
                analytics.equal(window.s.timestamp, iso(date));
              });

              it('should fallback to track.timestamp()', function() {
                var date = new Date();
                analytics.track('event1', {}, { timestamp: date });
                analytics.equal(window.s.timestamp, iso(date));
              });

              it('should not send the timestamp if the setting is disabled', function() {
                delete window.s.timestamp;
                omniture.options.includeTimestamp = false;
                analytics.track('event1');
                analytics.equal(window.s.timestamp, null);
              });

              it('should call window.s.tl', function() {
                analytics.stub(window.s, 'tl');
                analytics.track('Drank some milk');
                analytics.called(window.s.tl, true, 'o', 'Drank some milk');
              });

              it('should clear window.s[variables] between calls', function() {
                analytics.track('Drank some milk', { prop20: '123' });
                analytics.equal(window.s.prop20, '123');
                analytics.track('Drank some milk', { prop25: 'heyo' });
                analytics.assert(!window.s.prop20);
                analytics.equal(window.s.prop25, 'heyo');
              });
            });

            describe('#page', function() {
              beforeEach(function() {
                delete window.s.visitorID;
              });

              it('tracks normal pages', function() {
                analytics.page('Page1');
                analytics.equal(window.s.pageName, 'Page1');
                analytics.deepEqual(window.s.events, 'Page1');
              });

              it('tracks aliased properties', function() {
                analytics.page('Drank Some Milk', {
                  type: '2%',
                  brand: 'Lucerne',
                  good: true
                });
                analytics.equal(window.s.pageName, 'Drank Some Milk');
                analytics.equal(window.s.prop13, '2%');
                analytics.equal(window.s.prop23, 'Lucerne');
                analytics.equal(window.s.prop10, 'true');
              });

              it('should send user.id as visitorID', function() {
                user.id('user-id');
                analytics.page('name');
                analytics.equal(window.s.pageName, 'name');
                analytics.equal(window.s.visitorID, 'user-id');
              });

              it('should not send empty user.id as visitorID', function() {
                analytics.page('name');
                analytics.equal(window.s.pageName, 'name');
                analytics.equal(window.s.visitorID, undefined);
              });

              it('tracks basic properties', function() {
                analytics.page('event10', {
                  prop1: 20,
                  prop50: 'good',
                  prop73: true
                });
                analytics.equal(window.s.pageName, 'event10');
                analytics.equal(window.s.prop73, 'true');
                analytics.equal(window.s.prop1, '20');
                analytics.equal(window.s.prop50, 'good');
              });

              it('tracks aliased eVars', function() {
                analytics.page('Drank Some Milk', {
                  car: '2003 Accord (only one previous owner)',
                  dog: 'Dog',
                  good: false
                });
                analytics.equal(window.s.pageName, 'Drank Some Milk');
                analytics.equal(
                  window.s.eVar1,
                  '2003 Accord (only one previous owner)'
                );
                analytics.equal(window.s.eVar47, 'Dog');
              });

              it('tracks aliased eVars with nested properties', function() {
                analytics.page('Drank Some Milk', {
                  car: { info: '2003 Accord (only one previous owner)' },
                  'my.dog': 'Dog',
                  good: false
                });
                analytics.equal(window.s.pageName, 'Drank Some Milk');
                analytics.equal(
                  window.s.eVar101,
                  '2003 Accord (only one previous owner)'
                );
                analytics.equal(window.s.eVar401, 'Dog');
              });

              it('tracks basic eVars', function() {
                analytics.page('event20', {
                  eVar20: '123',
                  eVar54: false,
                  eVar: 'a'
                });
                analytics.equal(window.s.pageName, 'event20');
                analytics.equal(window.s.eVar, undefined);
                analytics.equal(window.s.eVar20, '123');
                analytics.equal(window.s.eVar54, 'false');
              });

              it('tracks basic hVars', function() {
                analytics.page('event20', {
                  hier_group1: 'animals:dogs',
                  hier_group2: 'sports:baseball',
                  hier3: 'a'
                });
                analytics.equal(window.s.pageName, 'event20');
                analytics.equal(window.s.hier1, 'animals:dogs');
                analytics.equal(window.s.hier2, 'sports:baseball');
              });

              it('should respect properties.timestamp', function() {
                var date = new Date();
                analytics.page('event1', { timestamp: date });
                analytics.equal(window.s.timestamp, iso(date));
              });

              it('should fallback to page.timestamp()', function() {
                var date = new Date();
                analytics.page('event1', {}, { timestamp: date });
                analytics.equal(window.s.timestamp, iso(date));
              });

              it('should not send the timestamp if the setting is disabled', function() {
                delete window.s.timestamp;
                omniture.options.includeTimestamp = false;
                analytics.page('event1');
                analytics.equal(window.s.timestamp, null);
              });

              it('should not track an initial page if .initialPage is false', function() {
                omniture.options.initialPage = false;
                analytics.page('event37');
                analytics.notEqual(window.s.pageName, 'event37');
                analytics.assert(omniture.options.page);
              });

              it('should call window.s.t', function() {
                analytics.stub(window.s, 't');
                analytics.page();
                analytics.called(window.s.t);
              });

              it('should clear window.s[variables] between calls', function() {
                analytics.page('event20', { prop20: '123' });
                analytics.equal(window.s.prop20, '123');
                analytics.page('event20', { prop25: 'heyo' });
                analytics.assert(!window.s.prop20);
                analytics.equal(window.s.prop25, 'heyo');
              });
            });
          });
        });

        /**
         * Returns whether the string contains all of the substrings
         *
         * @param {string} str
         * @param {...string} substrings
         */

        function contains(str) {
          var args = Array.prototype.slice.call(1, arguments);
          for (var i = 0; i < args.length; i++) {
            if (str.indexOf(args[i]) === -1) return false;
          }
          return true;
        }
      },
      {
        'analytics.js-core': 5,
        'to-iso-string': 127,
        'clear-env': 7,
        'analytics.js-integration-tester': 8,
        '../lib/': 9
      }
    ],
    4: [
      function(require, module, exports) {
        var Analytics = require('analytics.js-core').constructor;
        var iso = require('to-iso-string');
        var sandbox = require('clear-env');
        var tester = require('analytics.js-integration-tester');
        var Omniture = require('../lib/');

        describe('Omniture', function() {
          var analytics;
          var omniture;
          var user;
          var options = {
            version: 2,
            reportSuiteId: 'segmentio',
            trackingServerUrl: 'segment.io',
            trackingServerSecureUrl: 'secure.segment.io',
            events: {
              'Played a Song': 'event1',
              'Drank Some Milk': 'event6',
              EventEVar: 'event7'
            },
            eVars: {
              Car: 'eVar1',
              Dog: 'eVar47',
              prop20: 'eVar63',
              EventEVar: 'eVar65',
              'Car.Info': 'eVar101',
              'My.Dog': 'eVar401'
            },
            props: {
              Airplane: 'prop20',
              Dog: 'prop40',
              Good: 'prop10',
              Type: 'prop13',
              Brand: 'prop23'
            },
            hVars: {
              hier_group1: 'hier1',
              hier_group2: 'hier2'
            }
          };

          beforeEach(function() {
            analytics = new Analytics();
            omniture = new Omniture(options);
            analytics.use(Omniture);
            analytics.use(tester);
            analytics.add(omniture);
            user = analytics.user();
          });

          afterEach(function() {
            analytics.restore();
            analytics.reset();
            omniture.reset();
            sandbox();
          });

          describe('V2', function() {
            beforeEach(function(done) {
              analytics.once('ready', done);
              analytics.initialize();
            });

            describe('#track', function() {
              it('tracks aliased events', function() {
                analytics.track('Drank some milk');
                analytics.equal(window.s.events, 'event6');
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(contains(window.s.linkTrackVars, 'events'));
              });

              it('tracks built-in events', function() {
                analytics.track('scAdd');
                analytics.equal(window.s.events, 'scAdd');
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(contains(window.s.linkTrackVars, 'events'));
              });

              it('tracks aliases for built-in events', function() {
                analytics.track('Viewed Product');
                analytics.equal(window.s.events, 'prodView');
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(contains(window.s.linkTrackVars, 'events'));
              });

              it.only('tracks product information', function() {
                // update test fixture to spec
                analytics.track('Product Viewed', {
                  id: '507f1f77bcf86cd799439011',
                  sku: 'G-32',
                  name: 'Monopoly: 3rd Edition',
                  price: 18.99,
                  category: 'Games'
                });
                analytics.equal(
                  window.s.products,
                  'Games;Monopoly: 3rd Edition;1;18.99;'
                );
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(
                  contains(window.s.linkTrackVars, 'events', 'products')
                );
              });

              it.skip('tracks multiple product information', function() {
                analytics.track('Viewed Cart', {
                  products: [
                    {
                      product: 'Wooden Teeth',
                      quantity: 32,
                      category: 'Dental Aids',
                      price: 17.76
                    },
                    {
                      product: 'Mole People',
                      quantity: 100,
                      category: 'Subterranean',
                      price: 32.32
                    }
                  ]
                });
                analytics.equal(
                  window.s.products,
                  'Dental Aids; Wooden Teeth; 32; 17.76, ' +
                    'Subterranean; Mole People; 100; 32.32'
                );
                analytics.deepEqual(window.s.events, window.s.linkTrackEvents);
                analytics.assert(
                  contains(window.s.linkTrackVars, 'events', 'products')
                );
              });

              it('tracks aliased properties', function() {
                analytics.track('Drank Some Milk', {
                  type: '2%',
                  brand: 'Lucerne',
                  good: true
                });
                analytics.equal(window.s.prop13, '2%');
                analytics.equal(window.s.prop23, 'Lucerne');
                analytics.equal(window.s.prop10, 'true');
                analytics.assert(
                  contains(
                    window.s.linkTrackVars,
                    'events',
                    'prop13',
                    'prop23',
                    'prop10'
                  )
                );
              });

              it('tracks basic properties of all cases', function() {
                analytics.track('event10', {
                  brand: 'Lucerne'
                });
                analytics.equal(window.s.prop23, 'Lucerne');
                analytics.track('event10', {
                  Brand: 'Lucerne'
                });
                analytics.equal(window.s.prop23, 'Lucerne');
                analytics.track('event10', {
                  BrANd: 'Lucerne'
                });
                analytics.equal(window.s.prop23, 'Lucerne');
                analytics.track('event10', {
                  BRAND: 'Lucerne'
                });
                analytics.equal(window.s.prop23, 'Lucerne');
              });

              it('tracks aliased eVars with nested properties', function() {
                analytics.track('Drank Some Milk', {
                  car: { info: '2003 Accord (only one previous owner)' },
                  'my.dog': 'Dog',
                  good: false
                });
                analytics.equal(
                  window.s.eVar101,
                  '2003 Accord (only one previous owner)'
                );
                analytics.equal(window.s.eVar401, 'Dog');
                analytics.assert(
                  contains(
                    window.s.linkTrackVars,
                    'events',
                    'eVar101',
                    'eVar401',
                    'prop10'
                  )
                );
              });

              it('tracks event eVars', function() {
                analytics.track('EventEVar');
                analytics.equal(window.s.eVar65, 'EventEVar');
                analytics.assert(
                  contains(window.s.linkTrackVars, 'events', 'eVar65')
                );
              });

              it('should respect properties.timestamp', function() {
                var date = new Date();
                // change the event name since we no longer support
                // basic event mapping
                analytics.track('Played a Song', { timestamp: date });
                analytics.equal(window.s.timestamp, iso(date));
              });

              it('should fallback to track.timestamp()', function() {
                var date = new Date();
                // change the event name since we no longer support
                // basic event mapping
                analytics.track('Played a Song', {}, { timestamp: date });
                analytics.equal(window.s.timestamp, iso(date));
              });

              it('should not send the timestamp if the setting is disabled', function() {
                delete window.s.timestamp;
                omniture.options.includeTimestamp = false;
                analytics.track('event1');
                analytics.equal(window.s.timestamp, null);
              });

              it('should call window.s.tl', function() {
                analytics.stub(window.s, 'tl');
                analytics.track('Drank some milk');
                analytics.called(window.s.tl, true, 'o', 'Drank some milk');
              });

              it('should clear window.s[variables] between calls', function() {
                // update properties here since we no longer support
                // basic evar/prop/hvar mapping
                analytics.track('Drank some milk', { Airplane: '123' });
                analytics.equal(window.s.prop20, '123');
                analytics.track('Drank some milk', { Good: 'heyo' });
                analytics.assert(!window.s.prop20);
                analytics.equal(window.s.prop25, 'heyo');
              });
            });

            describe('#page', function() {
              beforeEach(function() {
                delete window.s.visitorID;
              });

              it('tracks nameless pages', function() {
                analytics.page();
                analytics.equal(window.s.pageName, undefined);
                analytics.deepEqual(window.s.events, undefined);
              });

              it('tracks normal pages', function() {
                analytics.page('Page1');
                analytics.equal(window.s.pageName, 'Page1');
                analytics.deepEqual(window.s.events, 'Page1');
              });

              it('tracks aliased properties', function() {
                analytics.page('Drank Some Milk', {
                  type: '2%',
                  brand: 'Lucerne',
                  good: true
                });
                analytics.equal(window.s.pageName, 'Drank Some Milk');
                analytics.equal(window.s.prop13, '2%');
                analytics.equal(window.s.prop23, 'Lucerne');
                analytics.equal(window.s.prop10, 'true');
              });

              it('should send user.id as visitorID if timestamps are disabled', function() {
                omniture.options.includeTimestamp = false;
                user.id('user-id');
                analytics.page('name');
                analytics.equal(window.s.pageName, 'name');
                analytics.equal(window.s.visitorID, 'user-id');
              });

              it('should not send user.id as visitorID if timestamps are enabled', function() {
                omniture.options.includeTimestamp = true;
                user.id('user-id');
                analytics.page('name');
                analytics.equal(window.s.pageName, 'name');
                analytics.assert(!window.s.visitorID);
              });

              it('should not send empty user.id as visitorID', function() {
                analytics.page('name');
                analytics.equal(window.s.pageName, 'name');
                analytics.equal(window.s.visitorID, undefined);
              });

              it('tracks aliased eVars', function() {
                analytics.page('Drank Some Milk', {
                  car: '2003 Accord (only one previous owner)',
                  dog: 'Dog',
                  good: false
                });
                analytics.equal(window.s.pageName, 'Drank Some Milk');
                analytics.equal(
                  window.s.eVar1,
                  '2003 Accord (only one previous owner)'
                );
                analytics.equal(window.s.eVar47, 'Dog');
              });

              it('tracks aliased eVars with nested properties', function() {
                analytics.page('Drank Some Milk', {
                  car: { info: '2003 Accord (only one previous owner)' },
                  'my.dog': 'Dog',
                  good: false
                });
                analytics.equal(window.s.pageName, 'Drank Some Milk');
                analytics.equal(
                  window.s.eVar101,
                  '2003 Accord (only one previous owner)'
                );
                analytics.equal(window.s.eVar401, 'Dog');
              });

              it('should respect properties.timestamp', function() {
                var date = iso(new Date());
                analytics.page('event1', { timestamp: date });
                analytics.equal(window.s.timestamp, date);
              });

              it('should fallback to page.timestamp()', function() {
                var date = new Date();
                analytics.page('event1', {}, { timestamp: date });
                analytics.equal(window.s.timestamp, iso(date));
              });

              it('should not send the timestamp if the setting is disabled', function() {
                delete window.s.timestamp;
                omniture.options.includeTimestamp = false;
                analytics.page('event1');
                analytics.equal(window.s.timestamp, null);
              });

              it('should not track an initial page if .initialPage is false', function() {
                omniture.options.initialPage = false;
                analytics.page('event37');
                analytics.notEqual(window.s.pageName, 'event37');
                analytics.assert(omniture.options.page);
              });

              it('should call window.s.t', function() {
                analytics.stub(window.s, 't');
                analytics.page();
                analytics.called(window.s.t);
              });

              it('should clear window.s[variables] between calls', function() {
                analytics.page('event20', { Airplane: '123' });
                analytics.equal(window.s.prop20, '123');
                analytics.page('event20', { Good: 'heyo' });
                analytics.assert(!window.s.prop20);
                analytics.equal(window.s.prop25, 'heyo');
              });
            });
          });
        });

        /**
         * Returns whether the string contains all of the substrings
         *
         * @param {string} str
         * @param {...string} substrings
         */

        function contains(str) {
          var args = Array.prototype.slice.call(1, arguments);
          for (var i = 0; i < args.length; i++) {
            if (str.indexOf(args[i]) === -1) return false;
          }
          return true;
        }
      },
      {
        'analytics.js-core': 5,
        'to-iso-string': 127,
        'clear-env': 7,
        'analytics.js-integration-tester': 8,
        '../lib/': 9
      }
    ]
  },
  {},
  { '1': '' }
);

// # sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9yZXF1aXJlLmpzIiwiL3Rlc3QvaW5kZXgudGVzdC5qcyIsIi90ZXN0L2NvbW1vbi50ZXN0LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1jb3JlQDIuMTIuMi9saWIvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tYW5hbHl0aWNzLmpzLWNvcmVAMi4xMi4yL2xpYi9hbmFseXRpY3MuanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtZW1pdHRlckAxLjEuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1pbmRleG9mQDAuMC4zL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWZhY2FkZUAyLjIuMi9saWIvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tZmFjYWRlQDIuMi4yL2xpYi9mYWNhZGUuanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8taXNvZGF0ZS10cmF2ZXJzZUAwLjMuMy9pbmRleC5qcyIsIi9jb21wb25lbnRzL2lhbnN0b3JtdGF5bG9yLWlzQDAuMS4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvaWFuc3Rvcm10YXlsb3ItaXMtZW1wdHlAMS4wLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtdHlwZUB2MS4yLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8taXNvZGF0ZUAwLjAuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1lYWNoQDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWZhY2FkZUAyLjIuMi9saWIvaXMtZW5hYmxlZC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1mYWNhZGVAMi4yLjIvbGliL3V0aWxzLmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LWluaGVyaXRAMC4wLjMvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtY2xvbmVAMC4yLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tZmFjYWRlQDIuMi4yL2xpYi9hZGRyZXNzLmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLW9iai1jYXNlQDAuMi4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLW5ldy1kYXRlQDAuMy4xL2xpYi9pbmRleC5qcyIsIi9jb21wb25lbnRzL2lhbnN0b3JtdGF5bG9yLWlzQDAuMC41L2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLW5ldy1kYXRlQDAuMy4xL2xpYi9taWxsaXNlY29uZHMuanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tbmV3LWRhdGVAMC4zLjEvbGliL3NlY29uZHMuanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tZmFjYWRlQDIuMi4yL2xpYi9hbGlhcy5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1mYWNhZGVAMi4yLjIvbGliL2dyb3VwLmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWlzLWVtYWlsQDAuMS4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWZhY2FkZUAyLjIuMi9saWIvaWRlbnRpZnkuanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtdHJpbUAwLjAuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1mYWNhZGVAMi4yLjIvbGliL3RyYWNrLmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWZhY2FkZUAyLjIuMi9saWIvcGFnZS5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1mYWNhZGVAMi4yLjIvbGliL3NjcmVlbi5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hZnRlckAwLjAuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1iaW5kLWFsbEAwLjAuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1iaW5kQDEuMC4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvaWFuc3Rvcm10YXlsb3ItY2FsbGJhY2tAMC4wLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy90aW1veGxleS1uZXh0LXRpY2tAMC4wLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtY2xvbmVAMC4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tYW5hbHl0aWNzLmpzLWNvcmVAMi4xMi4yL2xpYi9jb29raWUuanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtY29va2llQDEuMS4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvdmlzaW9ubWVkaWEtZGVidWdAMC43LjQvaW5kZXguanMiLCIvY29tcG9uZW50cy92aXNpb25tZWRpYS1kZWJ1Z0AwLjcuNC9saWIvZGVidWcuanMiLCIvY29tcG9uZW50cy92aXNpb25tZWRpYS1kZWJ1Z0AwLjcuNC9kZWJ1Zy5qcyIsIi9jb21wb25lbnRzL2F2ZXRpc2stZGVmYXVsdHNAMC4wLjQvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tanNvbkAxLjAuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1qc29uLWZhbGxiYWNrQDEuMC4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLXRvcC1kb21haW5AMi4wLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtdXJsQHYwLjIuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1jb29raWVAMS4xLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy9uZGhvdWxlLWZvbGRsQDEuMC4zL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvbmRob3VsZS1lYWNoQDEuMC4zL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvbmRob3VsZS1rZXlzQDEuMS4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1jb3JlQDIuMTIuMi9saWIvZ3JvdXAuanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tYW5hbHl0aWNzLmpzLWNvcmVAMi4xMi4yL2xpYi9lbnRpdHkuanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tZXh0ZW5kQDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1jb3JlQDIuMTIuMi9saWIvbWVtb3J5LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1jb3JlQDIuMTIuMi9saWIvc3RvcmUuanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tc3RvcmUuanNAMi4wLjAvc3RvcmUuanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtaW5oZXJpdEAwLjAuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL2lhbnN0b3JtdGF5bG9yLWlzQDAuMS4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWlzLW1ldGFAMC4wLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtb2JqZWN0QDAuMC4zL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1jb3JlQDIuMTIuMi9saWIvbm9ybWFsaXplLmpzIiwiL2NvbXBvbmVudHMvbmRob3VsZS1pbmNsdWRlc0AxLjAuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1tYXBAMC4wLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtdG8tZnVuY3Rpb25AMi4wLjYvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtcHJvcHNAMS4xLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtZXZlbnRAMC4xLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tYW5hbHl0aWNzLmpzLWNvcmVAMi4xMi4yL2xpYi9wYWdlRGVmYXVsdHMuanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tY2Fub25pY2FsQDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXVybEAwLjIuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL25kaG91bGUtcGlja0AxLjAuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL3lpZWxkcy1wcmV2ZW50QDAuMC4yL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXF1ZXJ5c3RyaW5nQDIuMC4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXR5cGVAMS4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tYW5hbHl0aWNzLmpzLWNvcmVAMi4xMi4yL2xpYi91c2VyLmpzIiwiL2NvbXBvbmVudHMvZ2pvaG5zb24tdXVpZEAwLjAuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hbmFseXRpY3MuanMtY29yZUAyLjEyLjIvYm93ZXIuanNvbiIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hbmFseXRpY3MuanMtaW50ZWdyYXRpb25AMS4xLjEvbGliL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvdmlzaW9ubWVkaWEtZGVidWdAMC43LjMvaW5kZXguanMiLCIvY29tcG9uZW50cy92aXNpb25tZWRpYS1kZWJ1Z0AwLjcuMy9saWIvZGVidWcuanMiLCIvY29tcG9uZW50cy92aXNpb25tZWRpYS1kZWJ1Z0AwLjcuMy9kZWJ1Zy5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1leHRlbmRAMS4wLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtc2x1Z0AxLjEuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hbmFseXRpY3MuanMtaW50ZWdyYXRpb25AMS4xLjEvbGliL3Byb3Rvcy5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1lYWNoQDAuMi42L2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXR5cGVAMS4wLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tYW5hbHl0aWNzLWV2ZW50c0AxLjIuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3lpZWxkcy1mbXRAMC4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tbG9hZC1pZnJhbWVAMC4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tc2NyaXB0LW9ubG9hZEAxLjAuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1sb2FkLXNjcmlwdEAwLjEuMy9pbmRleC5qcyIsIi9jb21wb25lbnRzL2lhbnN0b3JtdGF5bG9yLXRvLW5vLWNhc2VAMC4xLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy9uZGhvdWxlLWV2ZXJ5QDEuMC4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LWlzQDAuMS4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1pbnRlZ3JhdGlvbkAxLjEuMS9saWIvc3RhdGljcy5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1kb21pZnlAMS4zLjMvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tY2xlYXItZW52QDAuMi4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWNsZWFyLWFqYXhAMC4wLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtY2xlYXItdGltZW91dHNAMC4wLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtY2xlYXItaW50ZXJ2YWxzQDAuMC4zL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWNsZWFyLWxpc3RlbmVyc0AwLjEuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1jbGVhci1nbG9iYWxzQDAuMS4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWNsZWFyLWltYWdlc0AwLjEuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1jbGVhci1zY3JpcHRzQDAuMi4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXF1ZXJ5QDAuMC4zL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWNsZWFyLWNvb2tpZXNAMC4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tYW5hbHl0aWNzLmpzLWludGVncmF0aW9uLXRlc3RlckAxLjUuNC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hc3NlcnRAMC41LjQvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tZXF1YWxzQDEuMS4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvamtyb3NvLXR5cGVAMS4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtc3RhY2tAMC4wLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtZG9taWZ5QDEuNC4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLXN0dWJAMC4xLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtbWVyZ2VAMS4wLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtZXFsQDAuMC4yL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvbWF0dGhld3Ata2V5c0AwLjAuMy9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1zcHlAMC4zLjAvaW5kZXguanMiLCIvbGliL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvbmRob3VsZS1leHRlbmRAMS4wLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtZWFjaEAwLjEuMC9pbmRleC5qcyIsIi9saWIvdjEuanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tb2JqLWNhc2VAMC4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tdG8taXNvLXN0cmluZ0AwLjAuMS9pbmRleC5qcyIsIi9saWIvdjIuanMiLCIvdGVzdC92MS50ZXN0LmpzIiwiL3Rlc3QvdjIudGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzdVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDclNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzdPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcmVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDamRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDclRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdmFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3paQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJ0ZXN0L2luZGV4LnRlc3QuanMiLCJzb3VyY2VSb290IjoiL2R1byIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBvdXRlcihtb2R1bGVzLCBjYWNoZSwgZW50cmllcyl7XG5cbiAgLyoqXG4gICAqIEdsb2JhbFxuICAgKi9cblxuICB2YXIgZ2xvYmFsID0gKGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzOyB9KSgpO1xuXG4gIC8qKlxuICAgKiBSZXF1aXJlIGBuYW1lYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gcmVxdWlyZShuYW1lKXtcbiAgICBpZiAoY2FjaGVbbmFtZV0pIHJldHVybiBjYWNoZVtuYW1lXS5leHBvcnRzO1xuICAgIGlmIChtb2R1bGVzW25hbWVdKSByZXR1cm4gY2FsbChuYW1lLCByZXF1aXJlKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBmaW5kIG1vZHVsZSBcIicgKyBuYW1lICsgJ1wiJyk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbCBtb2R1bGUgYGlkYCBhbmQgY2FjaGUgaXQuXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXF1aXJlXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gY2FsbChpZCwgcmVxdWlyZSl7XG4gICAgdmFyIG0gPSBjYWNoZVtpZF0gPSB7IGV4cG9ydHM6IHt9IH07XG4gICAgdmFyIG1vZCA9IG1vZHVsZXNbaWRdO1xuICAgIHZhciBuYW1lID0gbW9kWzJdO1xuICAgIHZhciBmbiA9IG1vZFswXTtcbiAgICB2YXIgdGhyZXcgPSB0cnVlO1xuXG4gICAgdHJ5IHtcbiAgICAgIGZuLmNhbGwobS5leHBvcnRzLCBmdW5jdGlvbihyZXEpe1xuICAgICAgICB2YXIgZGVwID0gbW9kdWxlc1tpZF1bMV1bcmVxXTtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoZGVwIHx8IHJlcSk7XG4gICAgICB9LCBtLCBtLmV4cG9ydHMsIG91dGVyLCBtb2R1bGVzLCBjYWNoZSwgZW50cmllcyk7XG4gICAgICB0aHJldyA9IGZhbHNlO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAodGhyZXcpIHtcbiAgICAgICAgZGVsZXRlIGNhY2hlW2lkXTtcbiAgICAgIH0gZWxzZSBpZiAobmFtZSkge1xuICAgICAgICAvLyBleHBvc2UgYXMgJ25hbWUnLlxuICAgICAgICBjYWNoZVtuYW1lXSA9IGNhY2hlW2lkXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY2FjaGVbaWRdLmV4cG9ydHM7XG4gIH1cblxuICAvKipcbiAgICogUmVxdWlyZSBhbGwgZW50cmllcyBleHBvc2luZyB0aGVtIG9uIGdsb2JhbCBpZiBuZWVkZWQuXG4gICAqL1xuXG4gIGZvciAodmFyIGlkIGluIGVudHJpZXMpIHtcbiAgICBpZiAoZW50cmllc1tpZF0pIHtcbiAgICAgIGdsb2JhbFtlbnRyaWVzW2lkXV0gPSByZXF1aXJlKGlkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxdWlyZShpZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIER1byBmbGFnLlxuICAgKi9cblxuICByZXF1aXJlLmR1byA9IHRydWU7XG5cbiAgLyoqXG4gICAqIEV4cG9zZSBjYWNoZS5cbiAgICovXG5cbiAgcmVxdWlyZS5jYWNoZSA9IGNhY2hlO1xuXG4gIC8qKlxuICAgKiBFeHBvc2UgbW9kdWxlc1xuICAgKi9cblxuICByZXF1aXJlLm1vZHVsZXMgPSBtb2R1bGVzO1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gbmV3ZXN0IHJlcXVpcmUuXG4gICAqL1xuXG4gICByZXR1cm4gcmVxdWlyZTtcbn0pIiwiJ3VzZSBzdHJpY3QnO1xuXG5yZXF1aXJlKCcuL2NvbW1vbi50ZXN0LmpzJyk7XG5yZXF1aXJlKCcuL3YxLnRlc3QuanMnKTtcbnJlcXVpcmUoJy4vdjIudGVzdC5qcycpO1xuIiwiXG52YXIgQW5hbHl0aWNzID0gcmVxdWlyZSgnYW5hbHl0aWNzLmpzLWNvcmUnKS5jb25zdHJ1Y3RvcjtcbnZhciBpbnRlZ3JhdGlvbiA9IHJlcXVpcmUoJ2FuYWx5dGljcy5qcy1pbnRlZ3JhdGlvbicpO1xudmFyIHNhbmRib3ggPSByZXF1aXJlKCdjbGVhci1lbnYnKTtcbnZhciB0ZXN0ZXIgPSByZXF1aXJlKCdhbmFseXRpY3MuanMtaW50ZWdyYXRpb24tdGVzdGVyJyk7XG52YXIgT21uaXR1cmUgPSByZXF1aXJlKCcuLi9saWIvJyk7XG5cbmRlc2NyaWJlKCdPbW5pdHVyZS9jb21tb24nLCBmdW5jdGlvbigpIHtcbiAgdmFyIGFuYWx5dGljcztcbiAgdmFyIG9tbml0dXJlO1xuICB2YXIgb3B0aW9ucyA9IHtcbiAgICB0cmFja2luZ1NlcnZlclVybDogJ3NlZ21lbnQuaW8nLFxuICAgIHRyYWNraW5nU2VydmVyU2VjdXJlVXJsOiAnc2VjdXJlLnNlZ21lbnQuaW8nLFxuICAgIHZlcnNpb246IDFcbiAgfTtcblxuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIGFuYWx5dGljcyA9IG5ldyBBbmFseXRpY3MoKTtcbiAgICBvbW5pdHVyZSA9IG5ldyBPbW5pdHVyZShvcHRpb25zKTtcbiAgICBhbmFseXRpY3MudXNlKE9tbml0dXJlKTtcbiAgICBhbmFseXRpY3MudXNlKHRlc3Rlcik7XG4gICAgYW5hbHl0aWNzLmFkZChvbW5pdHVyZSk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaChmdW5jdGlvbigpIHtcbiAgICBhbmFseXRpY3MucmVzdG9yZSgpO1xuICAgIGFuYWx5dGljcy5yZXNldCgpO1xuICAgIG9tbml0dXJlLnJlc2V0KCk7XG4gICAgc2FuZGJveCgpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIGhhdmUgdGhlIHJpZ2h0IHNldHRpbmdzJywgZnVuY3Rpb24oKSB7XG4gICAgYW5hbHl0aWNzLmNvbXBhcmUoT21uaXR1cmUsIGludGVncmF0aW9uKCdPbW5pdHVyZScpXG4gICAgICAuZ2xvYmFsKCdzJylcbiAgICAgIC5nbG9iYWwoJ3NfZ2knKVxuICAgICAgLm9wdGlvbignaW5pdGlhbFBhZ2UnLCB0cnVlKVxuICAgICAgLm9wdGlvbignZXZlbnRzJywge30pXG4gICAgICAub3B0aW9uKCdlVmFycycsIHt9KVxuICAgICAgLm9wdGlvbigncHJvcHMnLCB7fSlcbiAgICAgIC5vcHRpb24oJ2hWYXJzJywge30pXG4gICAgKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2JlZm9yZSBsb2FkaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAgIGFuYWx5dGljcy5zdHViKG9tbml0dXJlLCAnbG9hZCcpO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJyNpbml0aWFsaXplJywgZnVuY3Rpb24oKSB7XG4gICAgICBpdCgnc2hvdWxkIHNldCBgd2luZG93LnNfYWNjb3VudGAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zX2FjY291bnQsIG9wdGlvbnMucmVwb3J0U3VpdGVJZCk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBwcmVzZXJ2ZSBhbiBleGlzdGluZyBgd2luZG93LnNfYWNjb3VudGAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgd2luZG93LnNfYWNjb3VudCA9ICdleGlzdGluZyc7XG4gICAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cuc19hY2NvdW50LCAnZXhpc3RpbmcnKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGxvYWQgdGFnIGZvciB2MSBieSBkZWZhdWx0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgICAgIC8vIFRPRE86IGlzIHRoaXMgdGhlIGJlc3Qgd2F5IHRvIHRlc3QgdGhhdCBhIHNjcmlwdCBsb2FkZWQ/XG4gICAgICAgIGFuYWx5dGljcy5jYWxsZWQob21uaXR1cmUubG9hZCwgJzEnKTtcbiAgICAgICAgYW5hbHl0aWNzLm9uY2UoJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuc19naSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgbG9hZCByaWdodCBzY3JpcHQgdGFnIGZvciB2MicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBvbW5pdHVyZS5vcHRpb25zLnZlcnNpb24gPSAyO1xuICAgICAgICBhbmFseXRpY3MuaW5pdGlhbGl6ZSgpO1xuICAgICAgICAvLyBUT0RPOiBpcyB0aGlzIHRoZSBiZXN0IHdheSB0byB0ZXN0IHRoYXQgYSBzY3JpcHQgbG9hZGVkP1xuICAgICAgICBhbmFseXRpY3MuY2FsbGVkKG9tbml0dXJlLmxvYWQsICcyJyk7XG4gICAgICAgIGFuYWx5dGljcy5vbmNlKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LnNfZ2kpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGV4dGVuZCB0aGUgcHJvcGVyIG1ldGhvZHMgZm9yIHYxIGJ5IGRlZmF1bHQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChvbW5pdHVyZS5fX3ZlcnNpb24gPT09IDEpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgZXh0ZW5kIHRoZSBwcm9wZXIgbWV0aG9kcyBmb3IgdjInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgb21uaXR1cmUub3B0aW9ucy52ZXJzaW9uID0gMjtcbiAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChvbW5pdHVyZS5fX3ZlcnNpb24gPT09IDIpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgc2V0IG5ldyBmaWVsZHMgb24gdGhpcy5vcHRpb25zIGJhc2VkIG9uIHNPcHRpb25zJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbChvbW5pdHVyZS5vcHRpb25zLmN1cnJlbmN5Q29kZSwgJ1VTRCcpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwob21uaXR1cmUub3B0aW9ucy5jaGFyU2V0LCAnSVNPLTg4NTktMScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwob21uaXR1cmUub3B0aW9ucy50cmFja0Rvd25sb2FkTGlua3MsIHRydWUpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwob21uaXR1cmUub3B0aW9ucy50cmFja0V4dGVybmFsTGlua3MsIHRydWUpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwob21uaXR1cmUub3B0aW9ucy50cmFja0lubGluZVN0YXRzLCB0cnVlKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKG9tbml0dXJlLm9wdGlvbnMubGlua0Rvd25sb2FkRmlsZVR5cGVzLCAnZXhlLHppcCx3YXYsbXAzLG1vdixtcGcsYXZpLHdtdixwZGYsZG9jLGRvY3gseGxzLHhsc3gscHB0LHBwdHgnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKG9tbml0dXJlLm9wdGlvbnMubGlua0xlYXZlUXVlcnlTdHJpbmcsIGZhbHNlKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKG9tbml0dXJlLm9wdGlvbnMubGlua1RyYWNrVmFycywgJ05vbmUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKG9tbml0dXJlLm9wdGlvbnMubGlua1RyYWNrRXZlbnRzLCAnTm9uZScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwob21uaXR1cmUub3B0aW9ucy51c2VQbHVnaW5zLCB0cnVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnbG9hZGluZycsIGZ1bmN0aW9uKCkge1xuICAgIGl0KCdzaG91bGQgbG9hZCcsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICAgIGFuYWx5dGljcy5sb2FkKG9tbml0dXJlLCBkb25lKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2FmdGVyIGxvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uKGRvbmUpIHtcbiAgICAgIGFuYWx5dGljcy5vbmNlKCdyZWFkeScsIGRvbmUpO1xuICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCcjaW5pdGlhbGl6ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgaXQoJ3Nob3VsZCBzZXQgd2luZG93LnMudHJhY2tpbmdTZXJ2ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnRyYWNraW5nU2VydmVyLCBvcHRpb25zLnRyYWNraW5nU2VydmVyVXJsKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHNldCB3aW5kb3cucy50cmFja2luZ1NlcnZlclNlY3VyZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMudHJhY2tpbmdTZXJ2ZXJTZWN1cmUsIG9wdGlvbnMudHJhY2tpbmdTZXJ2ZXJTZWN1cmVVcmwpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG5cbiIsIlxuLyoqXG4gKiBBbmFseXRpY3MuanNcbiAqXG4gKiAoQykgMjAxMyBTZWdtZW50LmlvIEluYy5cbiAqL1xuXG52YXIgQW5hbHl0aWNzID0gcmVxdWlyZSgnLi9hbmFseXRpY3MnKTtcblxuLyoqXG4gKiBFeHBvc2UgdGhlIGBhbmFseXRpY3NgIHNpbmdsZXRvbi5cbiAqL1xuXG52YXIgYW5hbHl0aWNzID0gbW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gbmV3IEFuYWx5dGljcygpO1xuXG4vKipcbiAqIEV4cG9zZSByZXF1aXJlXG4gKi9cblxuYW5hbHl0aWNzLnJlcXVpcmUgPSByZXF1aXJlO1xuXG4vKipcbiAqIEV4cG9zZSBgVkVSU0lPTmAuXG4gKi9cblxuZXhwb3J0cy5WRVJTSU9OID0gcmVxdWlyZSgnLi4vYm93ZXIuanNvbicpLnZlcnNpb247XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgX2FuYWx5dGljcyA9IHdpbmRvdy5hbmFseXRpY3M7XG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2VtaXR0ZXInKTtcbnZhciBGYWNhZGUgPSByZXF1aXJlKCdmYWNhZGUnKTtcbnZhciBhZnRlciA9IHJlcXVpcmUoJ2FmdGVyJyk7XG52YXIgYmluZEFsbCA9IHJlcXVpcmUoJ2JpbmQtYWxsJyk7XG52YXIgY2FsbGJhY2sgPSByZXF1aXJlKCdjYWxsYmFjaycpO1xudmFyIGNsb25lID0gcmVxdWlyZSgnY2xvbmUnKTtcbnZhciBjb29raWUgPSByZXF1aXJlKCcuL2Nvb2tpZScpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2RlZmF1bHRzJyk7XG52YXIgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcbnZhciBmb2xkbCA9IHJlcXVpcmUoJ2ZvbGRsJyk7XG52YXIgZ3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XG52YXIgaXMgPSByZXF1aXJlKCdpcycpO1xudmFyIGlzTWV0YSA9IHJlcXVpcmUoJ2lzLW1ldGEnKTtcbnZhciBrZXlzID0gcmVxdWlyZSgnb2JqZWN0Jykua2V5cztcbnZhciBtZW1vcnkgPSByZXF1aXJlKCcuL21lbW9yeScpO1xudmFyIG5vcm1hbGl6ZSA9IHJlcXVpcmUoJy4vbm9ybWFsaXplJyk7XG52YXIgb24gPSByZXF1aXJlKCdldmVudCcpLmJpbmQ7XG52YXIgcGFnZURlZmF1bHRzID0gcmVxdWlyZSgnLi9wYWdlRGVmYXVsdHMnKTtcbnZhciBwaWNrID0gcmVxdWlyZSgncGljaycpO1xudmFyIHByZXZlbnQgPSByZXF1aXJlKCdwcmV2ZW50Jyk7XG52YXIgcXVlcnlzdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xudmFyIHNpemUgPSByZXF1aXJlKCdvYmplY3QnKS5sZW5ndGg7XG52YXIgc3RvcmUgPSByZXF1aXJlKCcuL3N0b3JlJyk7XG52YXIgdXNlciA9IHJlcXVpcmUoJy4vdXNlcicpO1xudmFyIEFsaWFzID0gRmFjYWRlLkFsaWFzO1xudmFyIEdyb3VwID0gRmFjYWRlLkdyb3VwO1xudmFyIElkZW50aWZ5ID0gRmFjYWRlLklkZW50aWZ5O1xudmFyIFBhZ2UgPSBGYWNhZGUuUGFnZTtcbnZhciBUcmFjayA9IEZhY2FkZS5UcmFjaztcblxuLyoqXG4gKiBFeHBvc2UgYEFuYWx5dGljc2AuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gQW5hbHl0aWNzO1xuXG4vKipcbiAqIEV4cG9zZSBzdG9yYWdlLlxuICovXG5cbmV4cG9ydHMuY29va2llID0gY29va2llO1xuZXhwb3J0cy5zdG9yZSA9IHN0b3JlO1xuZXhwb3J0cy5tZW1vcnkgPSBtZW1vcnk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgQW5hbHl0aWNzYCBpbnN0YW5jZS5cbiAqL1xuXG5mdW5jdGlvbiBBbmFseXRpY3MoKSB7XG4gIHRoaXMuX29wdGlvbnMoe30pO1xuICB0aGlzLkludGVncmF0aW9ucyA9IHt9O1xuICB0aGlzLl9pbnRlZ3JhdGlvbnMgPSB7fTtcbiAgdGhpcy5fcmVhZGllZCA9IGZhbHNlO1xuICB0aGlzLl90aW1lb3V0ID0gMzAwO1xuICAvLyBYWFg6IEJBQ0tXQVJEUyBDT01QQVRJQklMSVRZXG4gIHRoaXMuX3VzZXIgPSB1c2VyO1xuICB0aGlzLmxvZyA9IGRlYnVnKCdhbmFseXRpY3MuanMnKTtcbiAgYmluZEFsbCh0aGlzKTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMub24oJ2luaXRpYWxpemUnLCBmdW5jdGlvbihzZXR0aW5ncywgb3B0aW9ucyl7XG4gICAgaWYgKG9wdGlvbnMuaW5pdGlhbFBhZ2V2aWV3KSBzZWxmLnBhZ2UoKTtcbiAgICBzZWxmLl9wYXJzZVF1ZXJ5KHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBFdmVudCBFbWl0dGVyLlxuICovXG5cbkVtaXR0ZXIoQW5hbHl0aWNzLnByb3RvdHlwZSk7XG5cbi8qKlxuICogVXNlIGEgYHBsdWdpbmAuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcGx1Z2luXG4gKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS51c2UgPSBmdW5jdGlvbihwbHVnaW4pIHtcbiAgcGx1Z2luKHRoaXMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGVmaW5lIGEgbmV3IGBJbnRlZ3JhdGlvbmAuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gSW50ZWdyYXRpb25cbiAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLmFkZEludGVncmF0aW9uID0gZnVuY3Rpb24oSW50ZWdyYXRpb24pIHtcbiAgdmFyIG5hbWUgPSBJbnRlZ3JhdGlvbi5wcm90b3R5cGUubmFtZTtcbiAgaWYgKCFuYW1lKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdhdHRlbXB0ZWQgdG8gYWRkIGFuIGludmFsaWQgaW50ZWdyYXRpb24nKTtcbiAgdGhpcy5JbnRlZ3JhdGlvbnNbbmFtZV0gPSBJbnRlZ3JhdGlvbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEluaXRpYWxpemUgd2l0aCB0aGUgZ2l2ZW4gaW50ZWdyYXRpb24gYHNldHRpbmdzYCBhbmQgYG9wdGlvbnNgLlxuICpcbiAqIEFsaWFzZWQgdG8gYGluaXRgIGZvciBjb252ZW5pZW5jZS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gW3NldHRpbmdzPXt9XVxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XVxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUuaW5pdCA9IEFuYWx5dGljcy5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKHNldHRpbmdzLCBvcHRpb25zKSB7XG4gIHNldHRpbmdzID0gc2V0dGluZ3MgfHwge307XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHRoaXMuX29wdGlvbnMob3B0aW9ucyk7XG4gIHRoaXMuX3JlYWRpZWQgPSBmYWxzZTtcblxuICAvLyBjbGVhbiB1bmtub3duIGludGVncmF0aW9ucyBmcm9tIHNldHRpbmdzXG4gIHZhciBzZWxmID0gdGhpcztcbiAgZWFjaChzZXR0aW5ncywgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBJbnRlZ3JhdGlvbiA9IHNlbGYuSW50ZWdyYXRpb25zW25hbWVdO1xuICAgIGlmICghSW50ZWdyYXRpb24pIGRlbGV0ZSBzZXR0aW5nc1tuYW1lXTtcbiAgfSk7XG5cbiAgLy8gYWRkIGludGVncmF0aW9uc1xuICBlYWNoKHNldHRpbmdzLCBmdW5jdGlvbihuYW1lLCBvcHRzKSB7XG4gICAgdmFyIEludGVncmF0aW9uID0gc2VsZi5JbnRlZ3JhdGlvbnNbbmFtZV07XG4gICAgdmFyIGludGVncmF0aW9uID0gbmV3IEludGVncmF0aW9uKGNsb25lKG9wdHMpKTtcbiAgICBzZWxmLmxvZygnaW5pdGlhbGl6ZSAlbyAtICVvJywgbmFtZSwgb3B0cyk7XG4gICAgc2VsZi5hZGQoaW50ZWdyYXRpb24pO1xuICB9KTtcblxuICB2YXIgaW50ZWdyYXRpb25zID0gdGhpcy5faW50ZWdyYXRpb25zO1xuXG4gIC8vIGxvYWQgdXNlciBub3cgdGhhdCBvcHRpb25zIGFyZSBzZXRcbiAgdXNlci5sb2FkKCk7XG4gIGdyb3VwLmxvYWQoKTtcblxuICAvLyBtYWtlIHJlYWR5IGNhbGxiYWNrXG4gIHZhciByZWFkeSA9IGFmdGVyKHNpemUoaW50ZWdyYXRpb25zKSwgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5fcmVhZGllZCA9IHRydWU7XG4gICAgc2VsZi5lbWl0KCdyZWFkeScpO1xuICB9KTtcblxuICAvLyBpbml0aWFsaXplIGludGVncmF0aW9ucywgcGFzc2luZyByZWFkeVxuICBlYWNoKGludGVncmF0aW9ucywgZnVuY3Rpb24obmFtZSwgaW50ZWdyYXRpb24pIHtcbiAgICBpZiAob3B0aW9ucy5pbml0aWFsUGFnZXZpZXcgJiYgaW50ZWdyYXRpb24ub3B0aW9ucy5pbml0aWFsUGFnZXZpZXcgPT09IGZhbHNlKSB7XG4gICAgICBpbnRlZ3JhdGlvbi5wYWdlID0gYWZ0ZXIoMiwgaW50ZWdyYXRpb24ucGFnZSk7XG4gICAgfVxuXG4gICAgaW50ZWdyYXRpb24uYW5hbHl0aWNzID0gc2VsZjtcbiAgICBpbnRlZ3JhdGlvbi5vbmNlKCdyZWFkeScsIHJlYWR5KTtcbiAgICBpbnRlZ3JhdGlvbi5pbml0aWFsaXplKCk7XG4gIH0pO1xuXG4gIC8vIGJhY2t3YXJkcyBjb21wYXQgd2l0aCBhbmd1bGFyIHBsdWdpbi5cbiAgLy8gVE9ETzogcmVtb3ZlXG4gIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gIHRoaXMuZW1pdCgnaW5pdGlhbGl6ZScsIHNldHRpbmdzLCBvcHRpb25zKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgdXNlcidzIGBpZGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gaWRcbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLnNldEFub255bW91c0lkID0gZnVuY3Rpb24oaWQpe1xuICB0aGlzLnVzZXIoKS5hbm9ueW1vdXNJZChpZCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYW4gaW50ZWdyYXRpb24uXG4gKlxuICogQHBhcmFtIHtJbnRlZ3JhdGlvbn0gaW50ZWdyYXRpb25cbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGludGVncmF0aW9uKXtcbiAgdGhpcy5faW50ZWdyYXRpb25zW2ludGVncmF0aW9uLm5hbWVdID0gaW50ZWdyYXRpb247XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJZGVudGlmeSBhIHVzZXIgYnkgb3B0aW9uYWwgYGlkYCBhbmQgYHRyYWl0c2AuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFtpZD11c2VyLmlkKCldIFVzZXIgSUQuXG4gKiBAcGFyYW0ge09iamVjdH0gW3RyYWl0cz1udWxsXSBVc2VyIHRyYWl0cy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz1udWxsXVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZuXVxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUuaWRlbnRpZnkgPSBmdW5jdGlvbihpZCwgdHJhaXRzLCBvcHRpb25zLCBmbikge1xuICAvLyBBcmd1bWVudCByZXNodWZmbGluZy5cbiAgLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLWV4cHJlc3Npb25zLCBuby1zZXF1ZW5jZXMgKi9cbiAgaWYgKGlzLmZuKG9wdGlvbnMpKSBmbiA9IG9wdGlvbnMsIG9wdGlvbnMgPSBudWxsO1xuICBpZiAoaXMuZm4odHJhaXRzKSkgZm4gPSB0cmFpdHMsIG9wdGlvbnMgPSBudWxsLCB0cmFpdHMgPSBudWxsO1xuICBpZiAoaXMub2JqZWN0KGlkKSkgb3B0aW9ucyA9IHRyYWl0cywgdHJhaXRzID0gaWQsIGlkID0gdXNlci5pZCgpO1xuICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucywgbm8tc2VxdWVuY2VzICovXG5cbiAgLy8gY2xvbmUgdHJhaXRzIGJlZm9yZSB3ZSBtYW5pcHVsYXRlIHNvIHdlIGRvbid0IGRvIGFueXRoaW5nIHVuY291dGgsIGFuZCB0YWtlXG4gIC8vIGZyb20gYHVzZXJgIHNvIHRoYXQgd2UgY2FycnlvdmVyIGFub255bW91cyB0cmFpdHNcbiAgdXNlci5pZGVudGlmeShpZCwgdHJhaXRzKTtcblxuICB2YXIgbXNnID0gdGhpcy5ub3JtYWxpemUoe1xuICAgIG9wdGlvbnM6IG9wdGlvbnMsXG4gICAgdHJhaXRzOiB1c2VyLnRyYWl0cygpLFxuICAgIHVzZXJJZDogdXNlci5pZCgpXG4gIH0pO1xuXG4gIHRoaXMuX2ludm9rZSgnaWRlbnRpZnknLCBuZXcgSWRlbnRpZnkobXNnKSk7XG5cbiAgLy8gZW1pdFxuICB0aGlzLmVtaXQoJ2lkZW50aWZ5JywgaWQsIHRyYWl0cywgb3B0aW9ucyk7XG4gIHRoaXMuX2NhbGxiYWNrKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCB1c2VyLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLnVzZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHVzZXI7XG59O1xuXG4vKipcbiAqIElkZW50aWZ5IGEgZ3JvdXAgYnkgb3B0aW9uYWwgYGlkYCBhbmQgYHRyYWl0c2AuIE9yLCBpZiBubyBhcmd1bWVudHMgYXJlXG4gKiBzdXBwbGllZCwgcmV0dXJuIHRoZSBjdXJyZW50IGdyb3VwLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbaWQ9Z3JvdXAuaWQoKV0gR3JvdXAgSUQuXG4gKiBAcGFyYW0ge09iamVjdH0gW3RyYWl0cz1udWxsXSBHcm91cCB0cmFpdHMuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9bnVsbF1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl1cbiAqIEByZXR1cm4ge0FuYWx5dGljc3xPYmplY3R9XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5ncm91cCA9IGZ1bmN0aW9uKGlkLCB0cmFpdHMsIG9wdGlvbnMsIGZuKSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucywgbm8tc2VxdWVuY2VzICovXG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGdyb3VwO1xuICBpZiAoaXMuZm4ob3B0aW9ucykpIGZuID0gb3B0aW9ucywgb3B0aW9ucyA9IG51bGw7XG4gIGlmIChpcy5mbih0cmFpdHMpKSBmbiA9IHRyYWl0cywgb3B0aW9ucyA9IG51bGwsIHRyYWl0cyA9IG51bGw7XG4gIGlmIChpcy5vYmplY3QoaWQpKSBvcHRpb25zID0gdHJhaXRzLCB0cmFpdHMgPSBpZCwgaWQgPSBncm91cC5pZCgpO1xuICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucywgbm8tc2VxdWVuY2VzICovXG5cblxuICAvLyBncmFiIGZyb20gZ3JvdXAgYWdhaW4gdG8gbWFrZSBzdXJlIHdlJ3JlIHRha2luZyBmcm9tIHRoZSBzb3VyY2VcbiAgZ3JvdXAuaWRlbnRpZnkoaWQsIHRyYWl0cyk7XG5cbiAgdmFyIG1zZyA9IHRoaXMubm9ybWFsaXplKHtcbiAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgIHRyYWl0czogZ3JvdXAudHJhaXRzKCksXG4gICAgZ3JvdXBJZDogZ3JvdXAuaWQoKVxuICB9KTtcblxuICB0aGlzLl9pbnZva2UoJ2dyb3VwJywgbmV3IEdyb3VwKG1zZykpO1xuXG4gIHRoaXMuZW1pdCgnZ3JvdXAnLCBpZCwgdHJhaXRzLCBvcHRpb25zKTtcbiAgdGhpcy5fY2FsbGJhY2soZm4pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVHJhY2sgYW4gYGV2ZW50YCB0aGF0IGEgdXNlciBoYXMgdHJpZ2dlcmVkIHdpdGggb3B0aW9uYWwgYHByb3BlcnRpZXNgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzPW51bGxdXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9bnVsbF1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl1cbiAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLnRyYWNrID0gZnVuY3Rpb24oZXZlbnQsIHByb3BlcnRpZXMsIG9wdGlvbnMsIGZuKSB7XG4gIC8vIEFyZ3VtZW50IHJlc2h1ZmZsaW5nLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtZXhwcmVzc2lvbnMsIG5vLXNlcXVlbmNlcyAqL1xuICBpZiAoaXMuZm4ob3B0aW9ucykpIGZuID0gb3B0aW9ucywgb3B0aW9ucyA9IG51bGw7XG4gIGlmIChpcy5mbihwcm9wZXJ0aWVzKSkgZm4gPSBwcm9wZXJ0aWVzLCBvcHRpb25zID0gbnVsbCwgcHJvcGVydGllcyA9IG51bGw7XG4gIC8qIGVzbGludC1lbmFibGUgbm8tdW51c2VkLWV4cHJlc3Npb25zLCBuby1zZXF1ZW5jZXMgKi9cblxuICAvLyBmaWd1cmUgb3V0IGlmIHRoZSBldmVudCBpcyBhcmNoaXZlZC5cbiAgdmFyIHBsYW4gPSB0aGlzLm9wdGlvbnMucGxhbiB8fCB7fTtcbiAgdmFyIGV2ZW50cyA9IHBsYW4udHJhY2sgfHwge307XG5cbiAgLy8gbm9ybWFsaXplXG4gIHZhciBtc2cgPSB0aGlzLm5vcm1hbGl6ZSh7XG4gICAgcHJvcGVydGllczogcHJvcGVydGllcyxcbiAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgIGV2ZW50OiBldmVudFxuICB9KTtcblxuICAvLyBwbGFuLlxuICBwbGFuID0gZXZlbnRzW2V2ZW50XTtcbiAgaWYgKHBsYW4pIHtcbiAgICB0aGlzLmxvZygncGxhbiAlbyAtICVvJywgZXZlbnQsIHBsYW4pO1xuICAgIGlmIChwbGFuLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm4gdGhpcy5fY2FsbGJhY2soZm4pO1xuICAgIGRlZmF1bHRzKG1zZy5pbnRlZ3JhdGlvbnMsIHBsYW4uaW50ZWdyYXRpb25zIHx8IHt9KTtcbiAgfVxuXG4gIHRoaXMuX2ludm9rZSgndHJhY2snLCBuZXcgVHJhY2sobXNnKSk7XG5cbiAgdGhpcy5lbWl0KCd0cmFjaycsIGV2ZW50LCBwcm9wZXJ0aWVzLCBvcHRpb25zKTtcbiAgdGhpcy5fY2FsbGJhY2soZm4pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSGVscGVyIG1ldGhvZCB0byB0cmFjayBhbiBvdXRib3VuZCBsaW5rIHRoYXQgd291bGQgbm9ybWFsbHkgbmF2aWdhdGUgYXdheVxuICogZnJvbSB0aGUgcGFnZSBiZWZvcmUgdGhlIGFuYWx5dGljcyBjYWxscyB3ZXJlIHNlbnQuXG4gKlxuICogQkFDS1dBUkRTIENPTVBBVElCSUxJVFk6IGFsaWFzZWQgdG8gYHRyYWNrQ2xpY2tgLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudHxBcnJheX0gbGlua3NcbiAqIEBwYXJhbSB7c3RyaW5nfEZ1bmN0aW9ufSBldmVudFxuICogQHBhcmFtIHtPYmplY3R8RnVuY3Rpb259IHByb3BlcnRpZXMgKG9wdGlvbmFsKVxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUudHJhY2tDbGljayA9IEFuYWx5dGljcy5wcm90b3R5cGUudHJhY2tMaW5rID0gZnVuY3Rpb24obGlua3MsIGV2ZW50LCBwcm9wZXJ0aWVzKSB7XG4gIGlmICghbGlua3MpIHJldHVybiB0aGlzO1xuICAvLyBhbHdheXMgYXJyYXlzLCBoYW5kbGVzIGpxdWVyeVxuICBpZiAoaXMuZWxlbWVudChsaW5rcykpIGxpbmtzID0gW2xpbmtzXTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGVhY2gobGlua3MsIGZ1bmN0aW9uKGVsKSB7XG4gICAgaWYgKCFpcy5lbGVtZW50KGVsKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignTXVzdCBwYXNzIEhUTUxFbGVtZW50IHRvIGBhbmFseXRpY3MudHJhY2tMaW5rYC4nKTtcbiAgICBvbihlbCwgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGV2ID0gaXMuZm4oZXZlbnQpID8gZXZlbnQoZWwpIDogZXZlbnQ7XG4gICAgICB2YXIgcHJvcHMgPSBpcy5mbihwcm9wZXJ0aWVzKSA/IHByb3BlcnRpZXMoZWwpIDogcHJvcGVydGllcztcbiAgICAgIHZhciBocmVmID0gZWwuZ2V0QXR0cmlidXRlKCdocmVmJylcbiAgICAgICAgfHwgZWwuZ2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCAnaHJlZicpXG4gICAgICAgIHx8IGVsLmdldEF0dHJpYnV0ZSgneGxpbms6aHJlZicpO1xuXG4gICAgICBzZWxmLnRyYWNrKGV2LCBwcm9wcyk7XG5cbiAgICAgIGlmIChocmVmICYmIGVsLnRhcmdldCAhPT0gJ19ibGFuaycgJiYgIWlzTWV0YShlKSkge1xuICAgICAgICBwcmV2ZW50KGUpO1xuICAgICAgICBzZWxmLl9jYWxsYmFjayhmdW5jdGlvbigpIHtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGhyZWY7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSGVscGVyIG1ldGhvZCB0byB0cmFjayBhbiBvdXRib3VuZCBmb3JtIHRoYXQgd291bGQgbm9ybWFsbHkgbmF2aWdhdGUgYXdheVxuICogZnJvbSB0aGUgcGFnZSBiZWZvcmUgdGhlIGFuYWx5dGljcyBjYWxscyB3ZXJlIHNlbnQuXG4gKlxuICogQkFDS1dBUkRTIENPTVBBVElCSUxJVFk6IGFsaWFzZWQgdG8gYHRyYWNrU3VibWl0YC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR8QXJyYXl9IGZvcm1zXG4gKiBAcGFyYW0ge3N0cmluZ3xGdW5jdGlvbn0gZXZlbnRcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBwcm9wZXJ0aWVzIChvcHRpb25hbClcbiAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLnRyYWNrU3VibWl0ID0gQW5hbHl0aWNzLnByb3RvdHlwZS50cmFja0Zvcm0gPSBmdW5jdGlvbihmb3JtcywgZXZlbnQsIHByb3BlcnRpZXMpIHtcbiAgaWYgKCFmb3JtcykgcmV0dXJuIHRoaXM7XG4gIC8vIGFsd2F5cyBhcnJheXMsIGhhbmRsZXMganF1ZXJ5XG4gIGlmIChpcy5lbGVtZW50KGZvcm1zKSkgZm9ybXMgPSBbZm9ybXNdO1xuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgZWFjaChmb3JtcywgZnVuY3Rpb24oZWwpIHtcbiAgICBpZiAoIWlzLmVsZW1lbnQoZWwpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdNdXN0IHBhc3MgSFRNTEVsZW1lbnQgdG8gYGFuYWx5dGljcy50cmFja0Zvcm1gLicpO1xuICAgIGZ1bmN0aW9uIGhhbmRsZXIoZSkge1xuICAgICAgcHJldmVudChlKTtcblxuICAgICAgdmFyIGV2ID0gaXMuZm4oZXZlbnQpID8gZXZlbnQoZWwpIDogZXZlbnQ7XG4gICAgICB2YXIgcHJvcHMgPSBpcy5mbihwcm9wZXJ0aWVzKSA/IHByb3BlcnRpZXMoZWwpIDogcHJvcGVydGllcztcbiAgICAgIHNlbGYudHJhY2soZXYsIHByb3BzKTtcblxuICAgICAgc2VsZi5fY2FsbGJhY2soZnVuY3Rpb24oKSB7XG4gICAgICAgIGVsLnN1Ym1pdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU3VwcG9ydCB0aGUgZXZlbnRzIGhhcHBlbmluZyB0aHJvdWdoIGpRdWVyeSBvciBaZXB0byBpbnN0ZWFkIG9mIHRocm91Z2hcbiAgICAvLyB0aGUgbm9ybWFsIERPTSBBUEksIGJlY2F1c2UgYGVsLnN1Ym1pdGAgZG9lc24ndCBidWJibGUgdXAgZXZlbnRzLi4uXG4gICAgdmFyICQgPSB3aW5kb3cualF1ZXJ5IHx8IHdpbmRvdy5aZXB0bztcbiAgICBpZiAoJCkge1xuICAgICAgJChlbCkuc3VibWl0KGhhbmRsZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvbihlbCwgJ3N1Ym1pdCcsIGhhbmRsZXIpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRyaWdnZXIgYSBwYWdldmlldywgbGFiZWxpbmcgdGhlIGN1cnJlbnQgcGFnZSB3aXRoIGFuIG9wdGlvbmFsIGBjYXRlZ29yeWAsXG4gKiBgbmFtZWAgYW5kIGBwcm9wZXJ0aWVzYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NhdGVnb3J5XVxuICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lXVxuICogQHBhcmFtIHtPYmplY3R8c3RyaW5nfSBbcHJvcGVydGllc10gKG9yIHBhdGgpXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5wYWdlID0gZnVuY3Rpb24oY2F0ZWdvcnksIG5hbWUsIHByb3BlcnRpZXMsIG9wdGlvbnMsIGZuKSB7XG4gIC8vIEFyZ3VtZW50IHJlc2h1ZmZsaW5nLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtZXhwcmVzc2lvbnMsIG5vLXNlcXVlbmNlcyAqL1xuICBpZiAoaXMuZm4ob3B0aW9ucykpIGZuID0gb3B0aW9ucywgb3B0aW9ucyA9IG51bGw7XG4gIGlmIChpcy5mbihwcm9wZXJ0aWVzKSkgZm4gPSBwcm9wZXJ0aWVzLCBvcHRpb25zID0gcHJvcGVydGllcyA9IG51bGw7XG4gIGlmIChpcy5mbihuYW1lKSkgZm4gPSBuYW1lLCBvcHRpb25zID0gcHJvcGVydGllcyA9IG5hbWUgPSBudWxsO1xuICBpZiAoaXMub2JqZWN0KGNhdGVnb3J5KSkgb3B0aW9ucyA9IG5hbWUsIHByb3BlcnRpZXMgPSBjYXRlZ29yeSwgbmFtZSA9IGNhdGVnb3J5ID0gbnVsbDtcbiAgaWYgKGlzLm9iamVjdChuYW1lKSkgb3B0aW9ucyA9IHByb3BlcnRpZXMsIHByb3BlcnRpZXMgPSBuYW1lLCBuYW1lID0gbnVsbDtcbiAgaWYgKGlzLnN0cmluZyhjYXRlZ29yeSkgJiYgIWlzLnN0cmluZyhuYW1lKSkgbmFtZSA9IGNhdGVnb3J5LCBjYXRlZ29yeSA9IG51bGw7XG4gIC8qIGVzbGludC1lbmFibGUgbm8tdW51c2VkLWV4cHJlc3Npb25zLCBuby1zZXF1ZW5jZXMgKi9cblxuICBwcm9wZXJ0aWVzID0gY2xvbmUocHJvcGVydGllcykgfHwge307XG4gIGlmIChuYW1lKSBwcm9wZXJ0aWVzLm5hbWUgPSBuYW1lO1xuICBpZiAoY2F0ZWdvcnkpIHByb3BlcnRpZXMuY2F0ZWdvcnkgPSBjYXRlZ29yeTtcblxuICAvLyBFbnN1cmUgcHJvcGVydGllcyBoYXMgYmFzZWxpbmUgc3BlYyBwcm9wZXJ0aWVzLlxuICAvLyBUT0RPOiBFdmVudHVhbGx5IG1vdmUgdGhlc2UgZW50aXJlbHkgdG8gYG9wdGlvbnMuY29udGV4dC5wYWdlYFxuICB2YXIgZGVmcyA9IHBhZ2VEZWZhdWx0cygpO1xuICBkZWZhdWx0cyhwcm9wZXJ0aWVzLCBkZWZzKTtcblxuICAvLyBNaXJyb3IgdXNlciBvdmVycmlkZXMgdG8gYG9wdGlvbnMuY29udGV4dC5wYWdlYCAoYnV0IGV4Y2x1ZGUgY3VzdG9tIHByb3BlcnRpZXMpXG4gIC8vIChBbnkgcGFnZSBkZWZhdWx0cyBnZXQgYXBwbGllZCBpbiBgdGhpcy5ub3JtYWxpemVgIGZvciBjb25zaXN0ZW5jeS4pXG4gIC8vIFdlaXJkLCB5ZWFoLS1tb3Zpbmcgc3BlY2lhbCBwcm9wcyB0byBgY29udGV4dC5wYWdlYCB3aWxsIGZpeCB0aGlzIGluIHRoZSBsb25nIHRlcm0uXG4gIHZhciBvdmVycmlkZXMgPSBwaWNrKGtleXMoZGVmcyksIHByb3BlcnRpZXMpO1xuICBpZiAoIWlzLmVtcHR5KG92ZXJyaWRlcykpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLmNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwge307XG4gICAgb3B0aW9ucy5jb250ZXh0LnBhZ2UgPSBvdmVycmlkZXM7XG4gIH1cblxuICB2YXIgbXNnID0gdGhpcy5ub3JtYWxpemUoe1xuICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXMsXG4gICAgY2F0ZWdvcnk6IGNhdGVnb3J5LFxuICAgIG9wdGlvbnM6IG9wdGlvbnMsXG4gICAgbmFtZTogbmFtZVxuICB9KTtcblxuICB0aGlzLl9pbnZva2UoJ3BhZ2UnLCBuZXcgUGFnZShtc2cpKTtcblxuICB0aGlzLmVtaXQoJ3BhZ2UnLCBjYXRlZ29yeSwgbmFtZSwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gIHRoaXMuX2NhbGxiYWNrKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEZJWE1FOiBCQUNLV0FSRFMgQ09NUEFUSUJJTElUWTogY29udmVydCBhbiBvbGQgYHBhZ2V2aWV3YCB0byBhIGBwYWdlYCBjYWxsLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbdXJsXVxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5wYWdldmlldyA9IGZ1bmN0aW9uKHVybCkge1xuICB2YXIgcHJvcGVydGllcyA9IHt9O1xuICBpZiAodXJsKSBwcm9wZXJ0aWVzLnBhdGggPSB1cmw7XG4gIHRoaXMucGFnZShwcm9wZXJ0aWVzKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE1lcmdlIHR3byBwcmV2aW91c2x5IHVuYXNzb2NpYXRlZCB1c2VyIGlkZW50aXRpZXMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRvXG4gKiBAcGFyYW0ge3N0cmluZ30gZnJvbSAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAob3B0aW9uYWwpXG4gKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5hbGlhcyA9IGZ1bmN0aW9uKHRvLCBmcm9tLCBvcHRpb25zLCBmbikge1xuICAvLyBBcmd1bWVudCByZXNodWZmbGluZy5cbiAgLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLWV4cHJlc3Npb25zLCBuby1zZXF1ZW5jZXMgKi9cbiAgaWYgKGlzLmZuKG9wdGlvbnMpKSBmbiA9IG9wdGlvbnMsIG9wdGlvbnMgPSBudWxsO1xuICBpZiAoaXMuZm4oZnJvbSkpIGZuID0gZnJvbSwgb3B0aW9ucyA9IG51bGwsIGZyb20gPSBudWxsO1xuICBpZiAoaXMub2JqZWN0KGZyb20pKSBvcHRpb25zID0gZnJvbSwgZnJvbSA9IG51bGw7XG4gIC8qIGVzbGludC1lbmFibGUgbm8tdW51c2VkLWV4cHJlc3Npb25zLCBuby1zZXF1ZW5jZXMgKi9cblxuICB2YXIgbXNnID0gdGhpcy5ub3JtYWxpemUoe1xuICAgIG9wdGlvbnM6IG9wdGlvbnMsXG4gICAgcHJldmlvdXNJZDogZnJvbSxcbiAgICB1c2VySWQ6IHRvXG4gIH0pO1xuXG4gIHRoaXMuX2ludm9rZSgnYWxpYXMnLCBuZXcgQWxpYXMobXNnKSk7XG5cbiAgdGhpcy5lbWl0KCdhbGlhcycsIHRvLCBmcm9tLCBvcHRpb25zKTtcbiAgdGhpcy5fY2FsbGJhY2soZm4pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBgZm5gIHRvIGJlIGZpcmVkIHdoZW4gYWxsIHRoZSBhbmFseXRpY3Mgc2VydmljZXMgYXJlIHJlYWR5LlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5yZWFkeSA9IGZ1bmN0aW9uKGZuKSB7XG4gIGlmIChpcy5mbihmbikpIHtcbiAgICBpZiAodGhpcy5fcmVhZGllZCkge1xuICAgICAgY2FsbGJhY2suYXN5bmMoZm4pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9uY2UoJ3JlYWR5JywgZm4pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IHRoZSBgdGltZW91dGAgKGluIG1pbGxpc2Vjb25kcykgdXNlZCBmb3IgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lb3V0XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24odGltZW91dCkge1xuICB0aGlzLl90aW1lb3V0ID0gdGltZW91dDtcbn07XG5cbi8qKlxuICogRW5hYmxlIG9yIGRpc2FibGUgZGVidWcuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8Ym9vbGVhbn0gc3RyXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uKHN0cil7XG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCB8fCBzdHIpIHtcbiAgICBkZWJ1Zy5lbmFibGUoJ2FuYWx5dGljczonICsgKHN0ciB8fCAnKicpKTtcbiAgfSBlbHNlIHtcbiAgICBkZWJ1Zy5kaXNhYmxlKCk7XG4gIH1cbn07XG5cbi8qKlxuICogQXBwbHkgb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5fb3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gIGNvb2tpZS5vcHRpb25zKG9wdGlvbnMuY29va2llKTtcbiAgc3RvcmUub3B0aW9ucyhvcHRpb25zLmxvY2FsU3RvcmFnZSk7XG4gIHVzZXIub3B0aW9ucyhvcHRpb25zLnVzZXIpO1xuICBncm91cC5vcHRpb25zKG9wdGlvbnMuZ3JvdXApO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2FsbGJhY2sgYSBgZm5gIGFmdGVyIG91ciBkZWZpbmVkIHRpbWVvdXQgcGVyaW9kLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLl9jYWxsYmFjayA9IGZ1bmN0aW9uKGZuKSB7XG4gIGNhbGxiYWNrLmFzeW5jKGZuLCB0aGlzLl90aW1lb3V0KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENhbGwgYG1ldGhvZGAgd2l0aCBgZmFjYWRlYCBvbiBhbGwgZW5hYmxlZCBpbnRlZ3JhdGlvbnMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZFxuICogQHBhcmFtIHtGYWNhZGV9IGZhY2FkZVxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5faW52b2tlID0gZnVuY3Rpb24obWV0aG9kLCBmYWNhZGUpIHtcbiAgdGhpcy5lbWl0KCdpbnZva2UnLCBmYWNhZGUpO1xuXG4gIGVhY2godGhpcy5faW50ZWdyYXRpb25zLCBmdW5jdGlvbihuYW1lLCBpbnRlZ3JhdGlvbikge1xuICAgIGlmICghZmFjYWRlLmVuYWJsZWQobmFtZSkpIHJldHVybjtcbiAgICBpbnRlZ3JhdGlvbi5pbnZva2UuY2FsbChpbnRlZ3JhdGlvbiwgbWV0aG9kLCBmYWNhZGUpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUHVzaCBgYXJnc2AuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJnc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oYXJncyl7XG4gIHZhciBtZXRob2QgPSBhcmdzLnNoaWZ0KCk7XG4gIGlmICghdGhpc1ttZXRob2RdKSByZXR1cm47XG4gIHRoaXNbbWV0aG9kXS5hcHBseSh0aGlzLCBhcmdzKTtcbn07XG5cbi8qKlxuICogUmVzZXQgZ3JvdXAgYW5kIHVzZXIgdHJhaXRzIGFuZCBpZCdzLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMudXNlcigpLmxvZ291dCgpO1xuICB0aGlzLmdyb3VwKCkubG9nb3V0KCk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBxdWVyeSBzdHJpbmcgZm9yIGNhbGxhYmxlIG1ldGhvZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHF1ZXJ5XG4gKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLl9wYXJzZVF1ZXJ5ID0gZnVuY3Rpb24ocXVlcnkpIHtcbiAgLy8gUGFyc2UgcXVlcnlzdHJpbmcgdG8gYW4gb2JqZWN0XG4gIHZhciBxID0gcXVlcnlzdHJpbmcucGFyc2UocXVlcnkpO1xuICAvLyBDcmVhdGUgdHJhaXRzIGFuZCBwcm9wZXJ0aWVzIG9iamVjdHMsIHBvcHVsYXRlIGZyb20gcXVlcnlzdGluZyBwYXJhbXNcbiAgdmFyIHRyYWl0cyA9IHBpY2tQcmVmaXgoJ2Fqc190cmFpdF8nLCBxKTtcbiAgdmFyIHByb3BzID0gcGlja1ByZWZpeCgnYWpzX3Byb3BfJywgcSk7XG4gIC8vIFRyaWdnZXIgYmFzZWQgb24gY2FsbGFibGUgcGFyYW1ldGVycyBpbiB0aGUgVVJMXG4gIGlmIChxLmFqc191aWQpIHRoaXMuaWRlbnRpZnkocS5hanNfdWlkLCB0cmFpdHMpO1xuICBpZiAocS5hanNfZXZlbnQpIHRoaXMudHJhY2socS5hanNfZXZlbnQsIHByb3BzKTtcbiAgaWYgKHEuYWpzX2FpZCkgdXNlci5hbm9ueW1vdXNJZChxLmFqc19haWQpO1xuICByZXR1cm4gdGhpcztcblxuICAvKipcbiAgICogQ3JlYXRlIGEgc2hhbGxvdyBjb3B5IG9mIGFuIGlucHV0IG9iamVjdCBjb250YWluaW5nIG9ubHkgdGhlIHByb3BlcnRpZXNcbiAgICogd2hvc2Uga2V5cyBhcmUgc3BlY2lmaWVkIGJ5IGEgcHJlZml4LCBzdHJpcHBlZCBvZiB0aGF0IHByZWZpeFxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJlZml4XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gcGlja1ByZWZpeChwcmVmaXgsIG9iamVjdCkge1xuICAgIHZhciBsZW5ndGggPSBwcmVmaXgubGVuZ3RoO1xuICAgIHZhciBzdWI7XG4gICAgcmV0dXJuIGZvbGRsKGZ1bmN0aW9uKGFjYywgdmFsLCBrZXkpIHtcbiAgICAgIGlmIChrZXkuc3Vic3RyKDAsIGxlbmd0aCkgPT09IHByZWZpeCkge1xuICAgICAgICBzdWIgPSBrZXkuc3Vic3RyKGxlbmd0aCk7XG4gICAgICAgIGFjY1tzdWJdID0gdmFsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSwgb2JqZWN0KTtcbiAgfVxufTtcblxuLyoqXG4gKiBOb3JtYWxpemUgdGhlIGdpdmVuIGBtc2dgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtc2dcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKG1zZyl7XG4gIG1zZyA9IG5vcm1hbGl6ZShtc2csIGtleXModGhpcy5faW50ZWdyYXRpb25zKSk7XG4gIGlmIChtc2cuYW5vbnltb3VzSWQpIHVzZXIuYW5vbnltb3VzSWQobXNnLmFub255bW91c0lkKTtcbiAgbXNnLmFub255bW91c0lkID0gdXNlci5hbm9ueW1vdXNJZCgpO1xuXG4gIC8vIEVuc3VyZSBhbGwgb3V0Z29pbmcgcmVxdWVzdHMgaW5jbHVkZSBwYWdlIGRhdGEgaW4gdGhlaXIgY29udGV4dHMuXG4gIG1zZy5jb250ZXh0LnBhZ2UgPSBkZWZhdWx0cyhtc2cuY29udGV4dC5wYWdlIHx8IHt9LCBwYWdlRGVmYXVsdHMoKSk7XG5cbiAgcmV0dXJuIG1zZztcbn07XG5cbi8qKlxuICogTm8gY29uZmxpY3Qgc3VwcG9ydC5cbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpe1xuICB3aW5kb3cuYW5hbHl0aWNzID0gX2FuYWx5dGljcztcbiAgcmV0dXJuIHRoaXM7XG59O1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGluZGV4ID0gcmVxdWlyZSgnaW5kZXhvZicpO1xuXG4vKipcbiAqIEV4cG9zZSBgRW1pdHRlcmAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYEVtaXR0ZXJgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcbiAgaWYgKG9iaikgcmV0dXJuIG1peGluKG9iaik7XG59O1xuXG4vKipcbiAqIE1peGluIHRoZSBlbWl0dGVyIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBFbWl0dGVyLnByb3RvdHlwZSkge1xuICAgIG9ialtrZXldID0gRW1pdHRlci5wcm90b3R5cGVba2V5XTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIExpc3RlbiBvbiB0aGUgZ2l2ZW4gYGV2ZW50YCB3aXRoIGBmbmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub24gPVxuRW1pdHRlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgKHRoaXMuX2NhbGxiYWNrc1tldmVudF0gPSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdIHx8IFtdKVxuICAgIC5wdXNoKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZHMgYW4gYGV2ZW50YCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgaW52b2tlZCBhIHNpbmdsZVxuICogdGltZSB0aGVuIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG5cbiAgZnVuY3Rpb24gb24oKSB7XG4gICAgc2VsZi5vZmYoZXZlbnQsIG9uKTtcbiAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgZm4uX29mZiA9IG9uO1xuICB0aGlzLm9uKGV2ZW50LCBvbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub2ZmID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIC8vIGFsbFxuICBpZiAoMCA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fY2FsbGJhY2tzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBzcGVjaWZpYyBldmVudFxuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcbiAgaWYgKCFjYWxsYmFja3MpIHJldHVybiB0aGlzO1xuXG4gIC8vIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgaWYgKDEgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gcmVtb3ZlIHNwZWNpZmljIGhhbmRsZXJcbiAgdmFyIGkgPSBpbmRleChjYWxsYmFja3MsIGZuLl9vZmYgfHwgZm4pO1xuICBpZiAofmkpIGNhbGxiYWNrcy5zcGxpY2UoaSwgMSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBFbWl0IGBldmVudGAgd2l0aCB0aGUgZ2l2ZW4gYXJncy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7TWl4ZWR9IC4uLlxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQpe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gICAgLCBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdO1xuXG4gIGlmIChjYWxsYmFja3MpIHtcbiAgICBjYWxsYmFja3MgPSBjYWxsYmFja3Muc2xpY2UoMCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgY2FsbGJhY2tzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYXJyYXkgb2YgY2FsbGJhY2tzIGZvciBgZXZlbnRgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICByZXR1cm4gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XSB8fCBbXTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhpcyBlbWl0dGVyIGhhcyBgZXZlbnRgIGhhbmRsZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuaGFzTGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xuICByZXR1cm4gISEgdGhpcy5saXN0ZW5lcnMoZXZlbnQpLmxlbmd0aDtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgb2JqKXtcbiAgaWYgKGFyci5pbmRleE9mKSByZXR1cm4gYXJyLmluZGV4T2Yob2JqKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoYXJyW2ldID09PSBvYmopIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn07IiwiXG52YXIgRmFjYWRlID0gcmVxdWlyZSgnLi9mYWNhZGUnKTtcblxuLyoqXG4gKiBFeHBvc2UgYEZhY2FkZWAgZmFjYWRlLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gRmFjYWRlO1xuXG4vKipcbiAqIEV4cG9zZSBzcGVjaWZpYy1tZXRob2QgZmFjYWRlcy5cbiAqL1xuXG5GYWNhZGUuQWxpYXMgPSByZXF1aXJlKCcuL2FsaWFzJyk7XG5GYWNhZGUuR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XG5GYWNhZGUuSWRlbnRpZnkgPSByZXF1aXJlKCcuL2lkZW50aWZ5Jyk7XG5GYWNhZGUuVHJhY2sgPSByZXF1aXJlKCcuL3RyYWNrJyk7XG5GYWNhZGUuUGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpO1xuRmFjYWRlLlNjcmVlbiA9IHJlcXVpcmUoJy4vc2NyZWVuJyk7XG4iLCJcbnZhciB0cmF2ZXJzZSA9IHJlcXVpcmUoJ2lzb2RhdGUtdHJhdmVyc2UnKTtcbnZhciBpc0VuYWJsZWQgPSByZXF1aXJlKCcuL2lzLWVuYWJsZWQnKTtcbnZhciBjbG9uZSA9IHJlcXVpcmUoJy4vdXRpbHMnKS5jbG9uZTtcbnZhciB0eXBlID0gcmVxdWlyZSgnLi91dGlscycpLnR5cGU7XG52YXIgYWRkcmVzcyA9IHJlcXVpcmUoJy4vYWRkcmVzcycpO1xudmFyIG9iakNhc2UgPSByZXF1aXJlKCdvYmotY2FzZScpO1xudmFyIG5ld0RhdGUgPSByZXF1aXJlKCduZXctZGF0ZScpO1xuXG4vKipcbiAqIEV4cG9zZSBgRmFjYWRlYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhY2FkZTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBGYWNhZGVgIHdpdGggYW4gYG9iamAgb2YgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKi9cblxuZnVuY3Rpb24gRmFjYWRlKG9iaiwgb3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgaWYgKCEoJ2Nsb25lJyBpbiBvcHRzKSkgb3B0cy5jbG9uZSA9IHRydWU7XG4gIGlmIChvcHRzLmNsb25lKSBvYmogPSBjbG9uZShvYmopO1xuICBpZiAoISgndHJhdmVyc2UnIGluIG9wdHMpKSBvcHRzLnRyYXZlcnNlID0gdHJ1ZTtcbiAgaWYgKCEoJ3RpbWVzdGFtcCcgaW4gb2JqKSkgb2JqLnRpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGVsc2Ugb2JqLnRpbWVzdGFtcCA9IG5ld0RhdGUob2JqLnRpbWVzdGFtcCk7XG4gIGlmIChvcHRzLnRyYXZlcnNlKSB0cmF2ZXJzZShvYmopO1xuICB0aGlzLm9wdHMgPSBvcHRzO1xuICB0aGlzLm9iaiA9IG9iajtcbn1cblxuLyoqXG4gKiBNaXhpbiBhZGRyZXNzIHRyYWl0cy5cbiAqL1xuXG5hZGRyZXNzKEZhY2FkZS5wcm90b3R5cGUpO1xuXG4vKipcbiAqIFJldHVybiBhIHByb3h5IGZ1bmN0aW9uIGZvciBhIGBmaWVsZGAgdGhhdCB3aWxsIGF0dGVtcHQgdG8gZmlyc3QgdXNlIG1ldGhvZHMsXG4gKiBhbmQgZmFsbGJhY2sgdG8gYWNjZXNzaW5nIHRoZSB1bmRlcmx5aW5nIG9iamVjdCBkaXJlY3RseS4gWW91IGNhbiBzcGVjaWZ5XG4gKiBkZWVwbHkgbmVzdGVkIGZpZWxkcyB0b28gbGlrZTpcbiAqXG4gKiAgIHRoaXMucHJveHkoJ29wdGlvbnMuTGlicmF0bycpO1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICovXG5cbkZhY2FkZS5wcm90b3R5cGUucHJveHkgPSBmdW5jdGlvbihmaWVsZCkge1xuICB2YXIgZmllbGRzID0gZmllbGQuc3BsaXQoJy4nKTtcbiAgZmllbGQgPSBmaWVsZHMuc2hpZnQoKTtcblxuICAvLyBDYWxsIGEgZnVuY3Rpb24gYXQgdGhlIGJlZ2lubmluZyB0byB0YWtlIGFkdmFudGFnZSBvZiBmYWNhZGVkIGZpZWxkc1xuICB2YXIgb2JqID0gdGhpc1tmaWVsZF0gfHwgdGhpcy5maWVsZChmaWVsZCk7XG4gIGlmICghb2JqKSByZXR1cm4gb2JqO1xuICBpZiAodHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykgb2JqID0gb2JqLmNhbGwodGhpcykgfHwge307XG4gIGlmIChmaWVsZHMubGVuZ3RoID09PSAwKSByZXR1cm4gdGhpcy5vcHRzLmNsb25lID8gdHJhbnNmb3JtKG9iaikgOiBvYmo7XG5cbiAgb2JqID0gb2JqQ2FzZShvYmosIGZpZWxkcy5qb2luKCcuJykpO1xuICByZXR1cm4gdGhpcy5vcHRzLmNsb25lID8gdHJhbnNmb3JtKG9iaikgOiBvYmo7XG59O1xuXG4vKipcbiAqIERpcmVjdGx5IGFjY2VzcyBhIHNwZWNpZmljIGBmaWVsZGAgZnJvbSB0aGUgdW5kZXJseWluZyBvYmplY3QsIHJldHVybmluZyBhXG4gKiBjbG9uZSBzbyBvdXRzaWRlcnMgZG9uJ3QgbWVzcyB3aXRoIHN0dWZmLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICogQHJldHVybiB7TWl4ZWR9XG4gKi9cblxuRmFjYWRlLnByb3RvdHlwZS5maWVsZCA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIHZhciBvYmogPSB0aGlzLm9ialtmaWVsZF07XG4gIHJldHVybiB0aGlzLm9wdHMuY2xvbmUgPyB0cmFuc2Zvcm0ob2JqKSA6IG9iajtcbn07XG5cbi8qKlxuICogVXRpbGl0eSBtZXRob2QgdG8gYWx3YXlzIHByb3h5IGEgcGFydGljdWxhciBgZmllbGRgLiBZb3UgY2FuIHNwZWNpZnkgZGVlcGx5XG4gKiBuZXN0ZWQgZmllbGRzIHRvbyBsaWtlOlxuICpcbiAqICAgRmFjYWRlLnByb3h5KCdvcHRpb25zLkxpYnJhdG8nKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbkZhY2FkZS5wcm94eSA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5wcm94eShmaWVsZCk7XG4gIH07XG59O1xuXG4vKipcbiAqIFV0aWxpdHkgbWV0aG9kIHRvIGRpcmVjdGx5IGFjY2VzcyBhIGBmaWVsZGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5GYWNhZGUuZmllbGQgPSBmdW5jdGlvbihmaWVsZCkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZmllbGQoZmllbGQpO1xuICB9O1xufTtcblxuLyoqXG4gKiBQcm94eSBtdWx0aXBsZSBgcGF0aGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5cbkZhY2FkZS5tdWx0aSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBtdWx0aSA9IHRoaXMucHJveHkocGF0aCArICdzJyk7XG4gICAgaWYgKHR5cGUobXVsdGkpID09PSAnYXJyYXknKSByZXR1cm4gbXVsdGk7XG4gICAgdmFyIG9uZSA9IHRoaXMucHJveHkocGF0aCk7XG4gICAgaWYgKG9uZSkgb25lID0gW3RoaXMub3B0cy5jbG9uZSA/IGNsb25lKG9uZSkgOiBvbmVdO1xuICAgIHJldHVybiBvbmUgfHwgW107XG4gIH07XG59O1xuXG4vKipcbiAqIFByb3h5IG9uZSBgcGF0aGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAqIEByZXR1cm4ge01peGVkfVxuICovXG5cbkZhY2FkZS5vbmUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgb25lID0gdGhpcy5wcm94eShwYXRoKTtcbiAgICBpZiAob25lKSByZXR1cm4gb25lO1xuICAgIHZhciBtdWx0aSA9IHRoaXMucHJveHkocGF0aCArICdzJyk7XG4gICAgaWYgKHR5cGUobXVsdGkpID09PSAnYXJyYXknKSByZXR1cm4gbXVsdGlbMF07XG4gIH07XG59O1xuXG4vKipcbiAqIEdldCB0aGUgYmFzaWMganNvbiBvYmplY3Qgb2YgdGhpcyBmYWNhZGUuXG4gKlxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbkZhY2FkZS5wcm90b3R5cGUuanNvbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmV0ID0gdGhpcy5vcHRzLmNsb25lID8gY2xvbmUodGhpcy5vYmopIDogdGhpcy5vYmo7XG4gIGlmICh0aGlzLnR5cGUpIHJldC50eXBlID0gdGhpcy50eXBlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgb3B0aW9ucyBvZiBhIGNhbGwgKGZvcm1lcmx5IGNhbGxlZCBcImNvbnRleHRcIikuIElmIHlvdSBwYXNzIGFuXG4gKiBpbnRlZ3JhdGlvbiBuYW1lLCBpdCB3aWxsIGdldCB0aGUgb3B0aW9ucyBmb3IgdGhhdCBzcGVjaWZpYyBpbnRlZ3JhdGlvbiwgb3JcbiAqIHVuZGVmaW5lZCBpZiB0aGUgaW50ZWdyYXRpb24gaXMgbm90IGVuYWJsZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGludGVncmF0aW9uIChvcHRpb25hbClcbiAqIEByZXR1cm4ge09iamVjdCBvciBOdWxsfVxuICovXG5cbkZhY2FkZS5wcm90b3R5cGUub3B0aW9ucyA9IGZ1bmN0aW9uKGludGVncmF0aW9uKSB7XG4gIHZhciBvYmogPSB0aGlzLm9iai5vcHRpb25zIHx8IHRoaXMub2JqLmNvbnRleHQgfHwge307XG4gIHZhciBvcHRpb25zID0gdGhpcy5vcHRzLmNsb25lID8gY2xvbmUob2JqKSA6IG9iajtcbiAgaWYgKCFpbnRlZ3JhdGlvbikgcmV0dXJuIG9wdGlvbnM7XG4gIGlmICghdGhpcy5lbmFibGVkKGludGVncmF0aW9uKSkgcmV0dXJuO1xuICB2YXIgaW50ZWdyYXRpb25zID0gdGhpcy5pbnRlZ3JhdGlvbnMoKTtcbiAgdmFyIHZhbHVlID0gaW50ZWdyYXRpb25zW2ludGVncmF0aW9uXSB8fCBvYmpDYXNlKGludGVncmF0aW9ucywgaW50ZWdyYXRpb24pO1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JykgdmFsdWUgPSBvYmpDYXNlKHRoaXMub3B0aW9ucygpLCBpbnRlZ3JhdGlvbik7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID8gdmFsdWUgOiB7fTtcbn07XG5cbkZhY2FkZS5wcm90b3R5cGUuY29udGV4dCA9IEZhY2FkZS5wcm90b3R5cGUub3B0aW9ucztcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGludGVncmF0aW9uIGlzIGVuYWJsZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGludGVncmF0aW9uXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbkZhY2FkZS5wcm90b3R5cGUuZW5hYmxlZCA9IGZ1bmN0aW9uKGludGVncmF0aW9uKSB7XG4gIHZhciBhbGxFbmFibGVkID0gdGhpcy5wcm94eSgnb3B0aW9ucy5wcm92aWRlcnMuYWxsJyk7XG4gIGlmICh0eXBlb2YgYWxsRW5hYmxlZCAhPT0gJ2Jvb2xlYW4nKSBhbGxFbmFibGVkID0gdGhpcy5wcm94eSgnb3B0aW9ucy5hbGwnKTtcbiAgaWYgKHR5cGVvZiBhbGxFbmFibGVkICE9PSAnYm9vbGVhbicpIGFsbEVuYWJsZWQgPSB0aGlzLnByb3h5KCdpbnRlZ3JhdGlvbnMuYWxsJyk7XG4gIGlmICh0eXBlb2YgYWxsRW5hYmxlZCAhPT0gJ2Jvb2xlYW4nKSBhbGxFbmFibGVkID0gdHJ1ZTtcblxuICB2YXIgZW5hYmxlZCA9IGFsbEVuYWJsZWQgJiYgaXNFbmFibGVkKGludGVncmF0aW9uKTtcbiAgdmFyIG9wdGlvbnMgPSB0aGlzLmludGVncmF0aW9ucygpO1xuXG4gIC8vIElmIHRoZSBpbnRlZ3JhdGlvbiBpcyBleHBsaWNpdGx5IGVuYWJsZWQgb3IgZGlzYWJsZWQsIHVzZSB0aGF0XG4gIC8vIEZpcnN0LCBjaGVjayBvcHRpb25zLnByb3ZpZGVycyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgaWYgKG9wdGlvbnMucHJvdmlkZXJzICYmIG9wdGlvbnMucHJvdmlkZXJzLmhhc093blByb3BlcnR5KGludGVncmF0aW9uKSkge1xuICAgIGVuYWJsZWQgPSBvcHRpb25zLnByb3ZpZGVyc1tpbnRlZ3JhdGlvbl07XG4gIH1cblxuICAvLyBOZXh0LCBjaGVjayBmb3IgdGhlIGludGVncmF0aW9uJ3MgZXhpc3RlbmNlIGluICdvcHRpb25zJyB0byBlbmFibGUgaXQuXG4gIC8vIElmIHRoZSBzZXR0aW5ncyBhcmUgYSBib29sZWFuLCB1c2UgdGhhdCwgb3RoZXJ3aXNlIGl0IHNob3VsZCBiZSBlbmFibGVkLlxuICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShpbnRlZ3JhdGlvbikpIHtcbiAgICB2YXIgc2V0dGluZ3MgPSBvcHRpb25zW2ludGVncmF0aW9uXTtcbiAgICBpZiAodHlwZW9mIHNldHRpbmdzID09PSAnYm9vbGVhbicpIHtcbiAgICAgIGVuYWJsZWQgPSBzZXR0aW5ncztcbiAgICB9IGVsc2Uge1xuICAgICAgZW5hYmxlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuICEhZW5hYmxlZDtcbn07XG5cbi8qKlxuICogR2V0IGFsbCBgaW50ZWdyYXRpb25gIG9wdGlvbnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGludGVncmF0aW9uXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5GYWNhZGUucHJvdG90eXBlLmludGVncmF0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5vYmouaW50ZWdyYXRpb25zXG4gICAgfHwgdGhpcy5wcm94eSgnb3B0aW9ucy5wcm92aWRlcnMnKVxuICAgIHx8IHRoaXMub3B0aW9ucygpO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSB1c2VyIGlzIGFjdGl2ZS5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbkZhY2FkZS5wcm90b3R5cGUuYWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBhY3RpdmUgPSB0aGlzLnByb3h5KCdvcHRpb25zLmFjdGl2ZScpO1xuICBpZiAoYWN0aXZlID09PSBudWxsIHx8IGFjdGl2ZSA9PT0gdW5kZWZpbmVkKSBhY3RpdmUgPSB0cnVlO1xuICByZXR1cm4gYWN0aXZlO1xufTtcblxuLyoqXG4gKiBHZXQgYHNlc3Npb25JZCAvIGFub255bW91c0lkYC5cbiAqXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRmFjYWRlLnByb3RvdHlwZS5hbm9ueW1vdXNJZCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5maWVsZCgnYW5vbnltb3VzSWQnKVxuICAgIHx8IHRoaXMuZmllbGQoJ3Nlc3Npb25JZCcpO1xufTtcblxuRmFjYWRlLnByb3RvdHlwZS5zZXNzaW9uSWQgPSBGYWNhZGUucHJvdG90eXBlLmFub255bW91c0lkO1xuXG4vKipcbiAqIEdldCBgZ3JvdXBJZGAgZnJvbSBgY29udGV4dC5ncm91cElkYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkZhY2FkZS5wcm90b3R5cGUuZ3JvdXBJZCA9IEZhY2FkZS5wcm94eSgnb3B0aW9ucy5ncm91cElkJyk7XG5cbi8qKlxuICogR2V0IHRoZSBjYWxsJ3MgXCJzdXBlciBwcm9wZXJ0aWVzXCIgd2hpY2ggYXJlIGp1c3QgdHJhaXRzIHRoYXQgaGF2ZSBiZWVuXG4gKiBwYXNzZWQgaW4gYXMgaWYgZnJvbSBhbiBpZGVudGlmeSBjYWxsLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhbGlhc2VzXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuRmFjYWRlLnByb3RvdHlwZS50cmFpdHMgPSBmdW5jdGlvbihhbGlhc2VzKSB7XG4gIHZhciByZXQgPSB0aGlzLnByb3h5KCdvcHRpb25zLnRyYWl0cycpIHx8IHt9O1xuICB2YXIgaWQgPSB0aGlzLnVzZXJJZCgpO1xuICBhbGlhc2VzID0gYWxpYXNlcyB8fCB7fTtcblxuICBpZiAoaWQpIHJldC5pZCA9IGlkO1xuXG4gIGZvciAodmFyIGFsaWFzIGluIGFsaWFzZXMpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzW2FsaWFzXSA9PSBudWxsID8gdGhpcy5wcm94eSgnb3B0aW9ucy50cmFpdHMuJyArIGFsaWFzKSA6IHRoaXNbYWxpYXNdKCk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIGNvbnRpbnVlO1xuICAgIHJldFthbGlhc2VzW2FsaWFzXV0gPSB2YWx1ZTtcbiAgICBkZWxldGUgcmV0W2FsaWFzXTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEFkZCBhIGNvbnZlbmllbnQgd2F5IHRvIGdldCB0aGUgbGlicmFyeSBuYW1lIGFuZCB2ZXJzaW9uXG4gKi9cblxuRmFjYWRlLnByb3RvdHlwZS5saWJyYXJ5ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBsaWJyYXJ5ID0gdGhpcy5wcm94eSgnb3B0aW9ucy5saWJyYXJ5Jyk7XG4gIGlmICghbGlicmFyeSkgcmV0dXJuIHsgbmFtZTogJ3Vua25vd24nLCB2ZXJzaW9uOiBudWxsIH07XG4gIGlmICh0eXBlb2YgbGlicmFyeSA9PT0gJ3N0cmluZycpIHJldHVybiB7IG5hbWU6IGxpYnJhcnksIHZlcnNpb246IG51bGwgfTtcbiAgcmV0dXJuIGxpYnJhcnk7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgZGV2aWNlIGluZm9ybWF0aW9uIG9yIGFuIGVtcHR5IG9iamVjdFxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5GYWNhZGUucHJvdG90eXBlLmRldmljZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZGV2aWNlID0gdGhpcy5wcm94eSgnY29udGV4dC5kZXZpY2UnKTtcbiAgaWYgKHR5cGUoZGV2aWNlKSAhPT0gJ29iamVjdCcpIGRldmljZSA9IHt9O1xuICB2YXIgbGlicmFyeSA9IHRoaXMubGlicmFyeSgpLm5hbWU7XG4gIGlmIChkZXZpY2UudHlwZSkgcmV0dXJuIGRldmljZTtcblxuICBpZiAobGlicmFyeS5pbmRleE9mKCdpb3MnKSA+IC0xKSBkZXZpY2UudHlwZSA9ICdpb3MnO1xuICBpZiAobGlicmFyeS5pbmRleE9mKCdhbmRyb2lkJykgPiAtMSkgZGV2aWNlLnR5cGUgPSAnYW5kcm9pZCc7XG4gIHJldHVybiBkZXZpY2U7XG59O1xuXG4vKipcbiAqIFNldHVwIHNvbWUgYmFzaWMgcHJveGllcy5cbiAqL1xuXG5GYWNhZGUucHJvdG90eXBlLnVzZXJBZ2VudCA9IEZhY2FkZS5wcm94eSgnY29udGV4dC51c2VyQWdlbnQnKTtcbkZhY2FkZS5wcm90b3R5cGUudGltZXpvbmUgPSBGYWNhZGUucHJveHkoJ2NvbnRleHQudGltZXpvbmUnKTtcbkZhY2FkZS5wcm90b3R5cGUudGltZXN0YW1wID0gRmFjYWRlLmZpZWxkKCd0aW1lc3RhbXAnKTtcbkZhY2FkZS5wcm90b3R5cGUuY2hhbm5lbCA9IEZhY2FkZS5maWVsZCgnY2hhbm5lbCcpO1xuRmFjYWRlLnByb3RvdHlwZS5pcCA9IEZhY2FkZS5wcm94eSgnY29udGV4dC5pcCcpO1xuRmFjYWRlLnByb3RvdHlwZS51c2VySWQgPSBGYWNhZGUuZmllbGQoJ3VzZXJJZCcpO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY2xvbmVkIGFuZCB0cmF2ZXJzZWQgb2JqZWN0XG4gKlxuICogQHBhcmFtIHtNaXhlZH0gb2JqXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqL1xuXG5mdW5jdGlvbiB0cmFuc2Zvcm0ob2JqKSB7XG4gIHZhciBjbG9uZWQgPSBjbG9uZShvYmopO1xuICByZXR1cm4gY2xvbmVkO1xufVxuIiwiXG52YXIgaXMgPSByZXF1aXJlKCdpcycpO1xudmFyIGlzb2RhdGUgPSByZXF1aXJlKCdpc29kYXRlJyk7XG52YXIgZWFjaDtcblxudHJ5IHtcbiAgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcbn0gY2F0Y2ggKGVycikge1xuICBlYWNoID0gcmVxdWlyZSgnZWFjaC1jb21wb25lbnQnKTtcbn1cblxuLyoqXG4gKiBFeHBvc2UgYHRyYXZlcnNlYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRyYXZlcnNlO1xuXG4vKipcbiAqIFRyYXZlcnNlIGFuIG9iamVjdCBvciBhcnJheSwgYW5kIHJldHVybiBhIGNsb25lIHdpdGggYWxsIElTTyBzdHJpbmdzIHBhcnNlZFxuICogaW50byBEYXRlIG9iamVjdHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIHRyYXZlcnNlIChpbnB1dCwgc3RyaWN0KSB7XG4gIGlmIChzdHJpY3QgPT09IHVuZGVmaW5lZCkgc3RyaWN0ID0gdHJ1ZTtcblxuICBpZiAoaXMub2JqZWN0KGlucHV0KSkgcmV0dXJuIG9iamVjdChpbnB1dCwgc3RyaWN0KTtcbiAgaWYgKGlzLmFycmF5KGlucHV0KSkgcmV0dXJuIGFycmF5KGlucHV0LCBzdHJpY3QpO1xuICByZXR1cm4gaW5wdXQ7XG59XG5cbi8qKlxuICogT2JqZWN0IHRyYXZlcnNlci5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHN0cmljdFxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIG9iamVjdCAob2JqLCBzdHJpY3QpIHtcbiAgZWFjaChvYmosIGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICAgIGlmIChpc29kYXRlLmlzKHZhbCwgc3RyaWN0KSkge1xuICAgICAgb2JqW2tleV0gPSBpc29kYXRlLnBhcnNlKHZhbCk7XG4gICAgfSBlbHNlIGlmIChpcy5vYmplY3QodmFsKSB8fCBpcy5hcnJheSh2YWwpKSB7XG4gICAgICB0cmF2ZXJzZSh2YWwsIHN0cmljdCk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBBcnJheSB0cmF2ZXJzZXIuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHN0cmljdFxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxuZnVuY3Rpb24gYXJyYXkgKGFyciwgc3RyaWN0KSB7XG4gIGVhY2goYXJyLCBmdW5jdGlvbiAodmFsLCB4KSB7XG4gICAgaWYgKGlzLm9iamVjdCh2YWwpKSB7XG4gICAgICB0cmF2ZXJzZSh2YWwsIHN0cmljdCk7XG4gICAgfSBlbHNlIGlmIChpc29kYXRlLmlzKHZhbCwgc3RyaWN0KSkge1xuICAgICAgYXJyW3hdID0gaXNvZGF0ZS5wYXJzZSh2YWwpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBhcnI7XG59XG4iLCJcbnZhciBpc0VtcHR5ID0gcmVxdWlyZSgnaXMtZW1wdHknKTtcblxudHJ5IHtcbiAgdmFyIHR5cGVPZiA9IHJlcXVpcmUoJ3R5cGUnKTtcbn0gY2F0Y2ggKGUpIHtcbiAgdmFyIHR5cGVPZiA9IHJlcXVpcmUoJ2NvbXBvbmVudC10eXBlJyk7XG59XG5cblxuLyoqXG4gKiBUeXBlcy5cbiAqL1xuXG52YXIgdHlwZXMgPSBbXG4gICdhcmd1bWVudHMnLFxuICAnYXJyYXknLFxuICAnYm9vbGVhbicsXG4gICdkYXRlJyxcbiAgJ2VsZW1lbnQnLFxuICAnZnVuY3Rpb24nLFxuICAnbnVsbCcsXG4gICdudW1iZXInLFxuICAnb2JqZWN0JyxcbiAgJ3JlZ2V4cCcsXG4gICdzdHJpbmcnLFxuICAndW5kZWZpbmVkJ1xuXTtcblxuXG4vKipcbiAqIEV4cG9zZSB0eXBlIGNoZWNrZXJzLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZvciAodmFyIGkgPSAwLCB0eXBlOyB0eXBlID0gdHlwZXNbaV07IGkrKykgZXhwb3J0c1t0eXBlXSA9IGdlbmVyYXRlKHR5cGUpO1xuXG5cbi8qKlxuICogQWRkIGFsaWFzIGZvciBgZnVuY3Rpb25gIGZvciBvbGQgYnJvd3NlcnMuXG4gKi9cblxuZXhwb3J0cy5mbiA9IGV4cG9ydHNbJ2Z1bmN0aW9uJ107XG5cblxuLyoqXG4gKiBFeHBvc2UgYGVtcHR5YCBjaGVjay5cbiAqL1xuXG5leHBvcnRzLmVtcHR5ID0gaXNFbXB0eTtcblxuXG4vKipcbiAqIEV4cG9zZSBgbmFuYCBjaGVjay5cbiAqL1xuXG5leHBvcnRzLm5hbiA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIGV4cG9ydHMubnVtYmVyKHZhbCkgJiYgdmFsICE9IHZhbDtcbn07XG5cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHR5cGUgY2hlY2tlci5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gZ2VuZXJhdGUgKHR5cGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlID09PSB0eXBlT2YodmFsdWUpO1xuICB9O1xufSIsIlxuLyoqXG4gKiBFeHBvc2UgYGlzRW1wdHlgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNFbXB0eTtcblxuXG4vKipcbiAqIEhhcy5cbiAqL1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuXG4vKipcbiAqIFRlc3Qgd2hldGhlciBhIHZhbHVlIGlzIFwiZW1wdHlcIi5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gaXNFbXB0eSAodmFsKSB7XG4gIGlmIChudWxsID09IHZhbCkgcmV0dXJuIHRydWU7XG4gIGlmICgnYm9vbGVhbicgPT0gdHlwZW9mIHZhbCkgcmV0dXJuIGZhbHNlO1xuICBpZiAoJ251bWJlcicgPT0gdHlwZW9mIHZhbCkgcmV0dXJuIDAgPT09IHZhbDtcbiAgaWYgKHVuZGVmaW5lZCAhPT0gdmFsLmxlbmd0aCkgcmV0dXJuIDAgPT09IHZhbC5sZW5ndGg7XG4gIGZvciAodmFyIGtleSBpbiB2YWwpIGlmIChoYXMuY2FsbCh2YWwsIGtleSkpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG4iLCIvKipcbiAqIHRvU3RyaW5nIHJlZi5cbiAqL1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFJldHVybiB0aGUgdHlwZSBvZiBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwpe1xuICBzd2l0Y2ggKHRvU3RyaW5nLmNhbGwodmFsKSkge1xuICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOiByZXR1cm4gJ2RhdGUnO1xuICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6IHJldHVybiAncmVnZXhwJztcbiAgICBjYXNlICdbb2JqZWN0IEFyZ3VtZW50c10nOiByZXR1cm4gJ2FyZ3VtZW50cyc7XG4gICAgY2FzZSAnW29iamVjdCBBcnJheV0nOiByZXR1cm4gJ2FycmF5JztcbiAgICBjYXNlICdbb2JqZWN0IEVycm9yXSc6IHJldHVybiAnZXJyb3InO1xuICB9XG5cbiAgaWYgKHZhbCA9PT0gbnVsbCkgcmV0dXJuICdudWxsJztcbiAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIGlmICh2YWwgIT09IHZhbCkgcmV0dXJuICduYW4nO1xuICBpZiAodmFsICYmIHZhbC5ub2RlVHlwZSA9PT0gMSkgcmV0dXJuICdlbGVtZW50JztcblxuICBpZiAoaXNCdWZmZXIodmFsKSkgcmV0dXJuICdidWZmZXInO1xuXG4gIHZhbCA9IHZhbC52YWx1ZU9mXG4gICAgPyB2YWwudmFsdWVPZigpXG4gICAgOiBPYmplY3QucHJvdG90eXBlLnZhbHVlT2YuYXBwbHkodmFsKTtcblxuICByZXR1cm4gdHlwZW9mIHZhbDtcbn07XG5cbi8vIGNvZGUgYm9ycm93ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2lzLWJ1ZmZlci9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaXNCdWZmZXIob2JqKSB7XG4gIHJldHVybiAhIShvYmogIT0gbnVsbCAmJlxuICAgIChvYmouX2lzQnVmZmVyIHx8IC8vIEZvciBTYWZhcmkgNS03IChtaXNzaW5nIE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IpXG4gICAgICAob2JqLmNvbnN0cnVjdG9yICYmXG4gICAgICB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmXG4gICAgICBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIob2JqKSlcbiAgICApKVxufVxuIiwiXG4vKipcbiAqIE1hdGNoZXIsIHNsaWdodGx5IG1vZGlmaWVkIGZyb206XG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL2Nzbm92ZXIvanMtaXNvODYwMS9ibG9iL2xheC9pc284NjAxLmpzXG4gKi9cblxudmFyIG1hdGNoZXIgPSAvXihcXGR7NH0pKD86LT8oXFxkezJ9KSg/Oi0/KFxcZHsyfSkpPyk/KD86KFsgVF0pKFxcZHsyfSk6PyhcXGR7Mn0pKD86Oj8oXFxkezJ9KSg/OlssXFwuXShcXGR7MSx9KSk/KT8oPzooWil8KFsrXFwtXSkoXFxkezJ9KSg/Ojo/KFxcZHsyfSkpPyk/KT8kLztcblxuXG4vKipcbiAqIENvbnZlcnQgYW4gSVNPIGRhdGUgc3RyaW5nIHRvIGEgZGF0ZS4gRmFsbGJhY2sgdG8gbmF0aXZlIGBEYXRlLnBhcnNlYC5cbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vY3Nub3Zlci9qcy1pc284NjAxL2Jsb2IvbGF4L2lzbzg2MDEuanNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaXNvXG4gKiBAcmV0dXJuIHtEYXRlfVxuICovXG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoaXNvKSB7XG4gIHZhciBudW1lcmljS2V5cyA9IFsxLCA1LCA2LCA3LCAxMSwgMTJdO1xuICB2YXIgYXJyID0gbWF0Y2hlci5leGVjKGlzbyk7XG4gIHZhciBvZmZzZXQgPSAwO1xuXG4gIC8vIGZhbGxiYWNrIHRvIG5hdGl2ZSBwYXJzaW5nXG4gIGlmICghYXJyKSByZXR1cm4gbmV3IERhdGUoaXNvKTtcblxuICAvLyByZW1vdmUgdW5kZWZpbmVkIHZhbHVlc1xuICBmb3IgKHZhciBpID0gMCwgdmFsOyB2YWwgPSBudW1lcmljS2V5c1tpXTsgaSsrKSB7XG4gICAgYXJyW3ZhbF0gPSBwYXJzZUludChhcnJbdmFsXSwgMTApIHx8IDA7XG4gIH1cblxuICAvLyBhbGxvdyB1bmRlZmluZWQgZGF5cyBhbmQgbW9udGhzXG4gIGFyclsyXSA9IHBhcnNlSW50KGFyclsyXSwgMTApIHx8IDE7XG4gIGFyclszXSA9IHBhcnNlSW50KGFyclszXSwgMTApIHx8IDE7XG5cbiAgLy8gbW9udGggaXMgMC0xMVxuICBhcnJbMl0tLTtcblxuICAvLyBhbGxvdyBhYml0cmFyeSBzdWItc2Vjb25kIHByZWNpc2lvblxuICBhcnJbOF0gPSBhcnJbOF1cbiAgICA/IChhcnJbOF0gKyAnMDAnKS5zdWJzdHJpbmcoMCwgMylcbiAgICA6IDA7XG5cbiAgLy8gYXBwbHkgdGltZXpvbmUgaWYgb25lIGV4aXN0c1xuICBpZiAoYXJyWzRdID09ICcgJykge1xuICAgIG9mZnNldCA9IG5ldyBEYXRlKCkuZ2V0VGltZXpvbmVPZmZzZXQoKTtcbiAgfSBlbHNlIGlmIChhcnJbOV0gIT09ICdaJyAmJiBhcnJbMTBdKSB7XG4gICAgb2Zmc2V0ID0gYXJyWzExXSAqIDYwICsgYXJyWzEyXTtcbiAgICBpZiAoJysnID09IGFyclsxMF0pIG9mZnNldCA9IDAgLSBvZmZzZXQ7XG4gIH1cblxuICB2YXIgbWlsbGlzID0gRGF0ZS5VVEMoYXJyWzFdLCBhcnJbMl0sIGFyclszXSwgYXJyWzVdLCBhcnJbNl0gKyBvZmZzZXQsIGFycls3XSwgYXJyWzhdKTtcbiAgcmV0dXJuIG5ldyBEYXRlKG1pbGxpcyk7XG59O1xuXG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBgc3RyaW5nYCBpcyBhbiBJU08gZGF0ZSBzdHJpbmcuIGBzdHJpY3RgIG1vZGUgcmVxdWlyZXMgdGhhdFxuICogdGhlIGRhdGUgc3RyaW5nIGF0IGxlYXN0IGhhdmUgYSB5ZWFyLCBtb250aCBhbmQgZGF0ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHN0cmljdFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5leHBvcnRzLmlzID0gZnVuY3Rpb24gKHN0cmluZywgc3RyaWN0KSB7XG4gIGlmIChzdHJpY3QgJiYgZmFsc2UgPT09IC9eXFxkezR9LVxcZHsyfS1cXGR7Mn0vLnRlc3Qoc3RyaW5nKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gbWF0Y2hlci50ZXN0KHN0cmluZyk7XG59OyIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0eXBlID0gcmVxdWlyZSgndHlwZScpO1xuXG4vKipcbiAqIEhPUCByZWZlcmVuY2UuXG4gKi9cblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogSXRlcmF0ZSB0aGUgZ2l2ZW4gYG9iamAgYW5kIGludm9rZSBgZm4odmFsLCBpKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8QXJyYXl8T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCBmbil7XG4gIHN3aXRjaCAodHlwZShvYmopKSB7XG4gICAgY2FzZSAnYXJyYXknOlxuICAgICAgcmV0dXJuIGFycmF5KG9iaiwgZm4pO1xuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICBpZiAoJ251bWJlcicgPT0gdHlwZW9mIG9iai5sZW5ndGgpIHJldHVybiBhcnJheShvYmosIGZuKTtcbiAgICAgIHJldHVybiBvYmplY3Qob2JqLCBmbik7XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHJldHVybiBzdHJpbmcob2JqLCBmbik7XG4gIH1cbn07XG5cbi8qKlxuICogSXRlcmF0ZSBzdHJpbmcgY2hhcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHN0cmluZyhvYmosIGZuKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgKytpKSB7XG4gICAgZm4ob2JqLmNoYXJBdChpKSwgaSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlIG9iamVjdCBrZXlzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBvYmplY3Qob2JqLCBmbikge1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgZm4oa2V5LCBvYmpba2V5XSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZSBhcnJheS1pc2guXG4gKlxuICogQHBhcmFtIHtBcnJheXxPYmplY3R9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGFycmF5KG9iaiwgZm4pIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyArK2kpIHtcbiAgICBmbihvYmpbaV0sIGkpO1xuICB9XG59IiwiXG4vKipcbiAqIEEgZmV3IGludGVncmF0aW9ucyBhcmUgZGlzYWJsZWQgYnkgZGVmYXVsdC4gVGhleSBtdXN0IGJlIGV4cGxpY2l0bHlcbiAqIGVuYWJsZWQgYnkgc2V0dGluZyBvcHRpb25zW1Byb3ZpZGVyXSA9IHRydWUuXG4gKi9cblxudmFyIGRpc2FibGVkID0ge1xuICBTYWxlc2ZvcmNlOiB0cnVlXG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gaW50ZWdyYXRpb24gc2hvdWxkIGJlIGVuYWJsZWQgYnkgZGVmYXVsdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW50ZWdyYXRpb25cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnRlZ3JhdGlvbikge1xuICByZXR1cm4gIWRpc2FibGVkW2ludGVncmF0aW9uXTtcbn07XG4iLCJcbi8qKlxuICogVE9ETzogdXNlIGNvbXBvbmVudCBzeW1saW5rLCBldmVyeXdoZXJlID9cbiAqL1xuXG50cnkge1xuICBleHBvcnRzLmluaGVyaXQgPSByZXF1aXJlKCdpbmhlcml0Jyk7XG4gIGV4cG9ydHMuY2xvbmUgPSByZXF1aXJlKCdjbG9uZScpO1xuICBleHBvcnRzLnR5cGUgPSByZXF1aXJlKCd0eXBlJyk7XG59IGNhdGNoIChlKSB7XG4gIGV4cG9ydHMuaW5oZXJpdCA9IHJlcXVpcmUoJ2luaGVyaXQtY29tcG9uZW50Jyk7XG4gIGV4cG9ydHMuY2xvbmUgPSByZXF1aXJlKCdjbG9uZS1jb21wb25lbnQnKTtcbiAgZXhwb3J0cy50eXBlID0gcmVxdWlyZSgndHlwZS1jb21wb25lbnQnKTtcbn1cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhLCBiKXtcbiAgdmFyIGZuID0gZnVuY3Rpb24oKXt9O1xuICBmbi5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcbiAgYS5wcm90b3R5cGUgPSBuZXcgZm47XG4gIGEucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gYTtcbn07IiwiLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0eXBlO1xudHJ5IHtcbiAgdHlwZSA9IHJlcXVpcmUoJ2NvbXBvbmVudC10eXBlJyk7XG59IGNhdGNoIChfKSB7XG4gIHR5cGUgPSByZXF1aXJlKCd0eXBlJyk7XG59XG5cbi8qKlxuICogTW9kdWxlIGV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBjbG9uZTtcblxuLyoqXG4gKiBDbG9uZXMgb2JqZWN0cy5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBhbnkgb2JqZWN0XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGNsb25lKG9iail7XG4gIHN3aXRjaCAodHlwZShvYmopKSB7XG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIHZhciBjb3B5ID0ge307XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIGNvcHlba2V5XSA9IGNsb25lKG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGNvcHk7XG5cbiAgICBjYXNlICdhcnJheSc6XG4gICAgICB2YXIgY29weSA9IG5ldyBBcnJheShvYmoubGVuZ3RoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBjb3B5W2ldID0gY2xvbmUob2JqW2ldKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb3B5O1xuXG4gICAgY2FzZSAncmVnZXhwJzpcbiAgICAgIC8vIGZyb20gbWlsbGVybWVkZWlyb3MvYW1kLXV0aWxzIC0gTUlUXG4gICAgICB2YXIgZmxhZ3MgPSAnJztcbiAgICAgIGZsYWdzICs9IG9iai5tdWx0aWxpbmUgPyAnbScgOiAnJztcbiAgICAgIGZsYWdzICs9IG9iai5nbG9iYWwgPyAnZycgOiAnJztcbiAgICAgIGZsYWdzICs9IG9iai5pZ25vcmVDYXNlID8gJ2knIDogJyc7XG4gICAgICByZXR1cm4gbmV3IFJlZ0V4cChvYmouc291cmNlLCBmbGFncyk7XG5cbiAgICBjYXNlICdkYXRlJzpcbiAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouZ2V0VGltZSgpKTtcblxuICAgIGRlZmF1bHQ6IC8vIHN0cmluZywgbnVtYmVyLCBib29sZWFuLCDigKZcbiAgICAgIHJldHVybiBvYmo7XG4gIH1cbn1cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBnZXQgPSByZXF1aXJlKCdvYmotY2FzZScpO1xuXG4vKipcbiAqIEFkZCBhZGRyZXNzIGdldHRlcnMgdG8gYHByb3RvYC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcm90b1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgcHJvdG8uemlwID0gdHJhaXQoJ3Bvc3RhbENvZGUnLCAnemlwJyk7XG4gIHByb3RvLmNvdW50cnkgPSB0cmFpdCgnY291bnRyeScpO1xuICBwcm90by5zdHJlZXQgPSB0cmFpdCgnc3RyZWV0Jyk7XG4gIHByb3RvLnN0YXRlID0gdHJhaXQoJ3N0YXRlJyk7XG4gIHByb3RvLmNpdHkgPSB0cmFpdCgnY2l0eScpO1xuICBwcm90by5yZWdpb24gPSB0cmFpdCgncmVnaW9uJyk7XG5cbiAgZnVuY3Rpb24gdHJhaXQoYSwgYikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0cmFpdHMgPSB0aGlzLnRyYWl0cygpO1xuICAgICAgdmFyIHByb3BzID0gdGhpcy5wcm9wZXJ0aWVzID8gdGhpcy5wcm9wZXJ0aWVzKCkgOiB7fTtcblxuICAgICAgcmV0dXJuIGdldCh0cmFpdHMsICdhZGRyZXNzLicgKyBhKVxuICAgICAgICB8fCBnZXQodHJhaXRzLCBhKVxuICAgICAgICB8fCAoYiA/IGdldCh0cmFpdHMsICdhZGRyZXNzLicgKyBiKSA6IG51bGwpXG4gICAgICAgIHx8IChiID8gZ2V0KHRyYWl0cywgYikgOiBudWxsKVxuICAgICAgICB8fCBnZXQocHJvcHMsICdhZGRyZXNzLicgKyBhKVxuICAgICAgICB8fCBnZXQocHJvcHMsIGEpXG4gICAgICAgIHx8IChiID8gZ2V0KHByb3BzLCAnYWRkcmVzcy4nICsgYikgOiBudWxsKVxuICAgICAgICB8fCAoYiA/IGdldChwcm9wcywgYikgOiBudWxsKTtcbiAgICB9O1xuICB9XG59O1xuIiwiXG52YXIgaWRlbnRpdHkgPSBmdW5jdGlvbihfKXsgcmV0dXJuIF87IH07XG5cblxuLyoqXG4gKiBNb2R1bGUgZXhwb3J0cywgZXhwb3J0XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBtdWx0aXBsZShmaW5kKTtcbm1vZHVsZS5leHBvcnRzLmZpbmQgPSBtb2R1bGUuZXhwb3J0cztcblxuXG4vKipcbiAqIEV4cG9ydCB0aGUgcmVwbGFjZW1lbnQgZnVuY3Rpb24sIHJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG4gKi9cblxubW9kdWxlLmV4cG9ydHMucmVwbGFjZSA9IGZ1bmN0aW9uIChvYmosIGtleSwgdmFsLCBvcHRpb25zKSB7XG4gIG11bHRpcGxlKHJlcGxhY2UpLmNhbGwodGhpcywgb2JqLCBrZXksIHZhbCwgb3B0aW9ucyk7XG4gIHJldHVybiBvYmo7XG59O1xuXG5cbi8qKlxuICogRXhwb3J0IHRoZSBkZWxldGUgZnVuY3Rpb24sIHJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG4gKi9cblxubW9kdWxlLmV4cG9ydHMuZGVsID0gZnVuY3Rpb24gKG9iaiwga2V5LCBvcHRpb25zKSB7XG4gIG11bHRpcGxlKGRlbCkuY2FsbCh0aGlzLCBvYmosIGtleSwgbnVsbCwgb3B0aW9ucyk7XG4gIHJldHVybiBvYmo7XG59O1xuXG5cbi8qKlxuICogQ29tcG9zZSBhcHBseWluZyB0aGUgZnVuY3Rpb24gdG8gYSBuZXN0ZWQga2V5XG4gKi9cblxuZnVuY3Rpb24gbXVsdGlwbGUgKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAob2JqLCBwYXRoLCB2YWwsIG9wdGlvbnMpIHtcbiAgICB2YXIgbm9ybWFsaXplID0gb3B0aW9ucyAmJiBpc0Z1bmN0aW9uKG9wdGlvbnMubm9ybWFsaXplcikgPyBvcHRpb25zLm5vcm1hbGl6ZXIgOiBkZWZhdWx0Tm9ybWFsaXplO1xuICAgIHBhdGggPSBub3JtYWxpemUocGF0aCk7XG5cbiAgICB2YXIga2V5O1xuICAgIHZhciBmaW5pc2hlZCA9IGZhbHNlO1xuXG4gICAgd2hpbGUgKCFmaW5pc2hlZCkgbG9vcCgpO1xuXG4gICAgZnVuY3Rpb24gbG9vcCgpIHtcbiAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICB2YXIgbm9ybWFsaXplZEtleSA9IG5vcm1hbGl6ZShrZXkpO1xuICAgICAgICBpZiAoMCA9PT0gcGF0aC5pbmRleE9mKG5vcm1hbGl6ZWRLZXkpKSB7XG4gICAgICAgICAgdmFyIHRlbXAgPSBwYXRoLnN1YnN0cihub3JtYWxpemVkS2V5Lmxlbmd0aCk7XG4gICAgICAgICAgaWYgKHRlbXAuY2hhckF0KDApID09PSAnLicgfHwgdGVtcC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHBhdGggPSB0ZW1wLnN1YnN0cigxKTtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IG9ialtrZXldO1xuXG4gICAgICAgICAgICAvLyB3ZSdyZSBhdCB0aGUgZW5kIGFuZCB0aGVyZSBpcyBub3RoaW5nLlxuICAgICAgICAgICAgaWYgKG51bGwgPT0gY2hpbGQpIHtcbiAgICAgICAgICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHdlJ3JlIGF0IHRoZSBlbmQgYW5kIHRoZXJlIGlzIHNvbWV0aGluZy5cbiAgICAgICAgICAgIGlmICghcGF0aC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHN0ZXAgaW50byBjaGlsZFxuICAgICAgICAgICAgb2JqID0gY2hpbGQ7XG5cbiAgICAgICAgICAgIC8vIGJ1dCB3ZSdyZSBkb25lIGhlcmVcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAga2V5ID0gdW5kZWZpbmVkO1xuICAgICAgLy8gaWYgd2UgZm91bmQgbm8gbWF0Y2hpbmcgcHJvcGVydGllc1xuICAgICAgLy8gb24gdGhlIGN1cnJlbnQgb2JqZWN0LCB0aGVyZSdzIG5vIG1hdGNoLlxuICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICgha2V5KSByZXR1cm47XG4gICAgaWYgKG51bGwgPT0gb2JqKSByZXR1cm4gb2JqO1xuXG4gICAgLy8gdGhlIGBvYmpgIGFuZCBga2V5YCBpcyBvbmUgYWJvdmUgdGhlIGxlYWYgb2JqZWN0IGFuZCBrZXksIHNvXG4gICAgLy8gc3RhcnQgb2JqZWN0OiB7IGE6IHsgJ2IuYyc6IDEwIH0gfVxuICAgIC8vIGVuZCBvYmplY3Q6IHsgJ2IuYyc6IDEwIH1cbiAgICAvLyBlbmQga2V5OiAnYi5jJ1xuICAgIC8vIHRoaXMgd2F5LCB5b3UgY2FuIGRvIGBvYmpba2V5XWAgYW5kIGdldCBgMTBgLlxuICAgIHJldHVybiBmbihvYmosIGtleSwgdmFsKTtcbiAgfTtcbn1cblxuXG4vKipcbiAqIEZpbmQgYW4gb2JqZWN0IGJ5IGl0cyBrZXlcbiAqXG4gKiBmaW5kKHsgZmlyc3RfbmFtZSA6ICdDYWx2aW4nIH0sICdmaXJzdE5hbWUnKVxuICovXG5cbmZ1bmN0aW9uIGZpbmQgKG9iaiwga2V5KSB7XG4gIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkgcmV0dXJuIG9ialtrZXldO1xufVxuXG5cbi8qKlxuICogRGVsZXRlIGEgdmFsdWUgZm9yIGEgZ2l2ZW4ga2V5XG4gKlxuICogZGVsKHsgYSA6ICdiJywgeCA6ICd5JyB9LCAnWCcgfSkgLT4geyBhIDogJ2InIH1cbiAqL1xuXG5mdW5jdGlvbiBkZWwgKG9iaiwga2V5KSB7XG4gIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkgZGVsZXRlIG9ialtrZXldO1xuICByZXR1cm4gb2JqO1xufVxuXG5cbi8qKlxuICogUmVwbGFjZSBhbiBvYmplY3RzIGV4aXN0aW5nIHZhbHVlIHdpdGggYSBuZXcgb25lXG4gKlxuICogcmVwbGFjZSh7IGEgOiAnYicgfSwgJ2EnLCAnYycpIC0+IHsgYSA6ICdjJyB9XG4gKi9cblxuZnVuY3Rpb24gcmVwbGFjZSAob2JqLCBrZXksIHZhbCkge1xuICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIG9ialtrZXldID0gdmFsO1xuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIGBkb3Quc2VwYXJhdGVkLnBhdGhgLlxuICpcbiAqIEEuSEVMTCghKiYjKCEpT19XT1IgICBMRC5iYXIgPT4gYWhlbGxvd29ybGRiYXJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIGRlZmF1bHROb3JtYWxpemUocGF0aCkge1xuICByZXR1cm4gcGF0aC5yZXBsYWNlKC9bXmEtekEtWjAtOVxcLl0rL2csICcnKS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgdmFsdWUgaXMgYSBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHJldHVybiB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbGAgaXMgYSBmdW5jdGlvbiwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gKi9cblxuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWwpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbic7XG59XG4iLCJcbnZhciBpcyA9IHJlcXVpcmUoJ2lzJyk7XG52YXIgaXNvZGF0ZSA9IHJlcXVpcmUoJ2lzb2RhdGUnKTtcbnZhciBtaWxsaXNlY29uZHMgPSByZXF1aXJlKCcuL21pbGxpc2Vjb25kcycpO1xudmFyIHNlY29uZHMgPSByZXF1aXJlKCcuL3NlY29uZHMnKTtcblxuXG4vKipcbiAqIFJldHVybnMgYSBuZXcgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCwgYWxsb3dpbmcgYSB2YXJpZXR5IG9mIGV4dHJhIGlucHV0IHR5cGVzXG4gKiBvdmVyIHRoZSBuYXRpdmUgRGF0ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBAcGFyYW0ge0RhdGV8U3RyaW5nfE51bWJlcn0gdmFsXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBuZXdEYXRlICh2YWwpIHtcbiAgaWYgKGlzLmRhdGUodmFsKSkgcmV0dXJuIHZhbDtcbiAgaWYgKGlzLm51bWJlcih2YWwpKSByZXR1cm4gbmV3IERhdGUodG9Ncyh2YWwpKTtcblxuICAvLyBkYXRlIHN0cmluZ3NcbiAgaWYgKGlzb2RhdGUuaXModmFsKSkgcmV0dXJuIGlzb2RhdGUucGFyc2UodmFsKTtcbiAgaWYgKG1pbGxpc2Vjb25kcy5pcyh2YWwpKSByZXR1cm4gbWlsbGlzZWNvbmRzLnBhcnNlKHZhbCk7XG4gIGlmIChzZWNvbmRzLmlzKHZhbCkpIHJldHVybiBzZWNvbmRzLnBhcnNlKHZhbCk7XG5cbiAgLy8gZmFsbGJhY2sgdG8gRGF0ZS5wYXJzZVxuICByZXR1cm4gbmV3IERhdGUodmFsKTtcbn07XG5cblxuLyoqXG4gKiBJZiB0aGUgbnVtYmVyIHBhc3NlZCB2YWwgaXMgc2Vjb25kcyBmcm9tIHRoZSBlcG9jaCwgdHVybiBpdCBpbnRvIG1pbGxpc2Vjb25kcy5cbiAqIE1pbGxpc2Vjb25kcyB3b3VsZCBiZSBncmVhdGVyIHRoYW4gMzE1NTc2MDAwMDAgKERlY2VtYmVyIDMxLCAxOTcwKS5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbnVtXG4gKi9cblxuZnVuY3Rpb24gdG9NcyAobnVtKSB7XG4gIGlmIChudW0gPCAzMTU1NzYwMDAwMCkgcmV0dXJuIG51bSAqIDEwMDA7XG4gIHJldHVybiBudW07XG59IiwiXG52YXIgaXNFbXB0eSA9IHJlcXVpcmUoJ2lzLWVtcHR5JylcbiAgLCB0eXBlT2YgPSByZXF1aXJlKCd0eXBlJyk7XG5cblxuLyoqXG4gKiBUeXBlcy5cbiAqL1xuXG52YXIgdHlwZXMgPSBbXG4gICdhcmd1bWVudHMnLFxuICAnYXJyYXknLFxuICAnYm9vbGVhbicsXG4gICdkYXRlJyxcbiAgJ2VsZW1lbnQnLFxuICAnZnVuY3Rpb24nLFxuICAnbnVsbCcsXG4gICdudW1iZXInLFxuICAnb2JqZWN0JyxcbiAgJ3JlZ2V4cCcsXG4gICdzdHJpbmcnLFxuICAndW5kZWZpbmVkJ1xuXTtcblxuXG4vKipcbiAqIEV4cG9zZSB0eXBlIGNoZWNrZXJzLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZvciAodmFyIGkgPSAwLCB0eXBlOyB0eXBlID0gdHlwZXNbaV07IGkrKykgZXhwb3J0c1t0eXBlXSA9IGdlbmVyYXRlKHR5cGUpO1xuXG5cbi8qKlxuICogQWRkIGFsaWFzIGZvciBgZnVuY3Rpb25gIGZvciBvbGQgYnJvd3NlcnMuXG4gKi9cblxuZXhwb3J0cy5mbiA9IGV4cG9ydHNbJ2Z1bmN0aW9uJ107XG5cblxuLyoqXG4gKiBFeHBvc2UgYGVtcHR5YCBjaGVjay5cbiAqL1xuXG5leHBvcnRzLmVtcHR5ID0gaXNFbXB0eTtcblxuXG4vKipcbiAqIEV4cG9zZSBgbmFuYCBjaGVjay5cbiAqL1xuXG5leHBvcnRzLm5hbiA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIGV4cG9ydHMubnVtYmVyKHZhbCkgJiYgdmFsICE9IHZhbDtcbn07XG5cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHR5cGUgY2hlY2tlci5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gZ2VuZXJhdGUgKHR5cGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlID09PSB0eXBlT2YodmFsdWUpO1xuICB9O1xufSIsIlxuLyoqXG4gKiBNYXRjaGVyLlxuICovXG5cbnZhciBtYXRjaGVyID0gL1xcZHsxM30vO1xuXG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhIHN0cmluZyBpcyBhIG1pbGxpc2Vjb25kIGRhdGUgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZXhwb3J0cy5pcyA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgcmV0dXJuIG1hdGNoZXIudGVzdChzdHJpbmcpO1xufTtcblxuXG4vKipcbiAqIENvbnZlcnQgYSBtaWxsaXNlY29uZCBzdHJpbmcgdG8gYSBkYXRlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtaWxsaXNcbiAqIEByZXR1cm4ge0RhdGV9XG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChtaWxsaXMpIHtcbiAgbWlsbGlzID0gcGFyc2VJbnQobWlsbGlzLCAxMCk7XG4gIHJldHVybiBuZXcgRGF0ZShtaWxsaXMpO1xufTsiLCJcbi8qKlxuICogTWF0Y2hlci5cbiAqL1xuXG52YXIgbWF0Y2hlciA9IC9cXGR7MTB9LztcblxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYSBzdHJpbmcgaXMgYSBzZWNvbmQgZGF0ZSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5leHBvcnRzLmlzID0gZnVuY3Rpb24gKHN0cmluZykge1xuICByZXR1cm4gbWF0Y2hlci50ZXN0KHN0cmluZyk7XG59O1xuXG5cbi8qKlxuICogQ29udmVydCBhIHNlY29uZCBzdHJpbmcgdG8gYSBkYXRlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWNvbmRzXG4gKiBAcmV0dXJuIHtEYXRlfVxuICovXG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc2Vjb25kcykge1xuICB2YXIgbWlsbGlzID0gcGFyc2VJbnQoc2Vjb25kcywgMTApICogMTAwMDtcbiAgcmV0dXJuIG5ldyBEYXRlKG1pbGxpcyk7XG59OyIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBpbmhlcml0ID0gcmVxdWlyZSgnLi91dGlscycpLmluaGVyaXQ7XG52YXIgRmFjYWRlID0gcmVxdWlyZSgnLi9mYWNhZGUnKTtcblxuLyoqXG4gKiBFeHBvc2UgYEFsaWFzYCBmYWNhZGUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBBbGlhcztcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBBbGlhc2AgZmFjYWRlIHdpdGggYSBgZGljdGlvbmFyeWAgb2YgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkaWN0aW9uYXJ5XG4gKiAgIEBwcm9wZXJ0eSB7U3RyaW5nfSBmcm9tXG4gKiAgIEBwcm9wZXJ0eSB7U3RyaW5nfSB0b1xuICogICBAcHJvcGVydHkge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqICAgQHByb3BlcnR5IHtCb29sZWFufFVuZGVmaW5lZH0gY2xvbmVcbiAqL1xuXG5mdW5jdGlvbiBBbGlhcyhkaWN0aW9uYXJ5LCBvcHRzKSB7XG4gIEZhY2FkZS5jYWxsKHRoaXMsIGRpY3Rpb25hcnksIG9wdHMpO1xufVxuXG4vKipcbiAqIEluaGVyaXQgZnJvbSBgRmFjYWRlYC5cbiAqL1xuXG5pbmhlcml0KEFsaWFzLCBGYWNhZGUpO1xuXG4vKipcbiAqIFJldHVybiB0eXBlIG9mIGZhY2FkZS5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuQWxpYXMucHJvdG90eXBlLmFjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ2FsaWFzJztcbn07XG5cbkFsaWFzLnByb3RvdHlwZS50eXBlID0gQWxpYXMucHJvdG90eXBlLmFjdGlvbjtcblxuLyoqXG4gKiBHZXQgYHByZXZpb3VzSWRgLlxuICpcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5BbGlhcy5wcm90b3R5cGUucHJldmlvdXNJZCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5maWVsZCgncHJldmlvdXNJZCcpXG4gICAgfHwgdGhpcy5maWVsZCgnZnJvbScpO1xufTtcblxuQWxpYXMucHJvdG90eXBlLmZyb20gPSBBbGlhcy5wcm90b3R5cGUucHJldmlvdXNJZDtcblxuLyoqXG4gKiBHZXQgYHVzZXJJZGAuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5BbGlhcy5wcm90b3R5cGUudXNlcklkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmZpZWxkKCd1c2VySWQnKVxuICAgIHx8IHRoaXMuZmllbGQoJ3RvJyk7XG59O1xuXG5BbGlhcy5wcm90b3R5cGUudG8gPSBBbGlhcy5wcm90b3R5cGUudXNlcklkO1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGluaGVyaXQgPSByZXF1aXJlKCcuL3V0aWxzJykuaW5oZXJpdDtcbnZhciBpc0VtYWlsID0gcmVxdWlyZSgnaXMtZW1haWwnKTtcbnZhciBuZXdEYXRlID0gcmVxdWlyZSgnbmV3LWRhdGUnKTtcbnZhciBGYWNhZGUgPSByZXF1aXJlKCcuL2ZhY2FkZScpO1xuXG4vKipcbiAqIEV4cG9zZSBgR3JvdXBgIGZhY2FkZS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYEdyb3VwYCBmYWNhZGUgd2l0aCBhIGBkaWN0aW9uYXJ5YCBvZiBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRpY3Rpb25hcnlcbiAqICAgQHBhcmFtIHtTdHJpbmd9IHVzZXJJZFxuICogICBAcGFyYW0ge1N0cmluZ30gZ3JvdXBJZFxuICogICBAcGFyYW0ge09iamVjdH0gcHJvcGVydGllc1xuICogICBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqICAgQHByb3BlcnR5IHtCb29sZWFufFVuZGVmaW5lZH0gY2xvbmVcbiAqL1xuXG5mdW5jdGlvbiBHcm91cChkaWN0aW9uYXJ5LCBvcHRzKSB7XG4gIEZhY2FkZS5jYWxsKHRoaXMsIGRpY3Rpb25hcnksIG9wdHMpO1xufVxuXG4vKipcbiAqIEluaGVyaXQgZnJvbSBgRmFjYWRlYFxuICovXG5cbmluaGVyaXQoR3JvdXAsIEZhY2FkZSk7XG5cbi8qKlxuICogR2V0IHRoZSBmYWNhZGUncyBhY3Rpb24uXG4gKi9cblxuR3JvdXAucHJvdG90eXBlLmFjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ2dyb3VwJztcbn07XG5cbkdyb3VwLnByb3RvdHlwZS50eXBlID0gR3JvdXAucHJvdG90eXBlLmFjdGlvbjtcblxuLyoqXG4gKiBTZXR1cCBzb21lIGJhc2ljIHByb3hpZXMuXG4gKi9cblxuR3JvdXAucHJvdG90eXBlLmdyb3VwSWQgPSBGYWNhZGUuZmllbGQoJ2dyb3VwSWQnKTtcblxuLyoqXG4gKiBHZXQgY3JlYXRlZCBvciBjcmVhdGVkQXQuXG4gKlxuICogQHJldHVybiB7RGF0ZX1cbiAqL1xuXG5Hcm91cC5wcm90b3R5cGUuY3JlYXRlZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY3JlYXRlZCA9IHRoaXMucHJveHkoJ3RyYWl0cy5jcmVhdGVkQXQnKVxuICAgIHx8IHRoaXMucHJveHkoJ3RyYWl0cy5jcmVhdGVkJylcbiAgICB8fCB0aGlzLnByb3h5KCdwcm9wZXJ0aWVzLmNyZWF0ZWRBdCcpXG4gICAgfHwgdGhpcy5wcm94eSgncHJvcGVydGllcy5jcmVhdGVkJyk7XG5cbiAgaWYgKGNyZWF0ZWQpIHJldHVybiBuZXdEYXRlKGNyZWF0ZWQpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGdyb3VwJ3MgZW1haWwsIGZhbGxpbmcgYmFjayB0byB0aGUgZ3JvdXAgSUQgaWYgaXQncyBhIHZhbGlkIGVtYWlsLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5Hcm91cC5wcm90b3R5cGUuZW1haWwgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGVtYWlsID0gdGhpcy5wcm94eSgndHJhaXRzLmVtYWlsJyk7XG4gIGlmIChlbWFpbCkgcmV0dXJuIGVtYWlsO1xuICB2YXIgZ3JvdXBJZCA9IHRoaXMuZ3JvdXBJZCgpO1xuICBpZiAoaXNFbWFpbChncm91cElkKSkgcmV0dXJuIGdyb3VwSWQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgZ3JvdXAncyB0cmFpdHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFsaWFzZXNcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5Hcm91cC5wcm90b3R5cGUudHJhaXRzID0gZnVuY3Rpb24oYWxpYXNlcykge1xuICB2YXIgcmV0ID0gdGhpcy5wcm9wZXJ0aWVzKCk7XG4gIHZhciBpZCA9IHRoaXMuZ3JvdXBJZCgpO1xuICBhbGlhc2VzID0gYWxpYXNlcyB8fCB7fTtcblxuICBpZiAoaWQpIHJldC5pZCA9IGlkO1xuXG4gIGZvciAodmFyIGFsaWFzIGluIGFsaWFzZXMpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzW2FsaWFzXSA9PSBudWxsID8gdGhpcy5wcm94eSgndHJhaXRzLicgKyBhbGlhcykgOiB0aGlzW2FsaWFzXSgpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSBjb250aW51ZTtcbiAgICByZXRbYWxpYXNlc1thbGlhc11dID0gdmFsdWU7XG4gICAgZGVsZXRlIHJldFthbGlhc107XG4gIH1cblxuICByZXR1cm4gcmV0O1xufTtcblxuLyoqXG4gKiBTcGVjaWFsIHRyYWl0cy5cbiAqL1xuXG5Hcm91cC5wcm90b3R5cGUubmFtZSA9IEZhY2FkZS5wcm94eSgndHJhaXRzLm5hbWUnKTtcbkdyb3VwLnByb3RvdHlwZS5pbmR1c3RyeSA9IEZhY2FkZS5wcm94eSgndHJhaXRzLmluZHVzdHJ5Jyk7XG5Hcm91cC5wcm90b3R5cGUuZW1wbG95ZWVzID0gRmFjYWRlLnByb3h5KCd0cmFpdHMuZW1wbG95ZWVzJyk7XG5cbi8qKlxuICogR2V0IHRyYWl0cyBvciBwcm9wZXJ0aWVzLlxuICpcbiAqIFRPRE86IHJlbW92ZSBtZVxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5Hcm91cC5wcm90b3R5cGUucHJvcGVydGllcyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5maWVsZCgndHJhaXRzJykgfHwgdGhpcy5maWVsZCgncHJvcGVydGllcycpIHx8IHt9O1xufTtcbiIsIlxuLyoqXG4gKiBFeHBvc2UgYGlzRW1haWxgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNFbWFpbDtcblxuXG4vKipcbiAqIEVtYWlsIGFkZHJlc3MgbWF0Y2hlci5cbiAqL1xuXG52YXIgbWF0Y2hlciA9IC8uK1xcQC4rXFwuLisvO1xuXG5cbi8qKlxuICogTG9vc2VseSB2YWxpZGF0ZSBhbiBlbWFpbCBhZGRyZXNzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gaXNFbWFpbCAoc3RyaW5nKSB7XG4gIHJldHVybiBtYXRjaGVyLnRlc3Qoc3RyaW5nKTtcbn0iLCJcbnZhciBGYWNhZGUgPSByZXF1aXJlKCcuL2ZhY2FkZScpO1xudmFyIGlzRW1haWwgPSByZXF1aXJlKCdpcy1lbWFpbCcpO1xudmFyIG5ld0RhdGUgPSByZXF1aXJlKCduZXctZGF0ZScpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGdldCA9IHJlcXVpcmUoJ29iai1jYXNlJyk7XG52YXIgdHJpbSA9IHJlcXVpcmUoJ3RyaW0nKTtcbnZhciBpbmhlcml0ID0gdXRpbHMuaW5oZXJpdDtcbnZhciB0eXBlID0gdXRpbHMudHlwZTtcblxuLyoqXG4gKiBFeHBvc2UgYElkZW5maXR5YCBmYWNhZGUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBJZGVudGlmeTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBJZGVudGlmeWAgZmFjYWRlIHdpdGggYSBgZGljdGlvbmFyeWAgb2YgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkaWN0aW9uYXJ5XG4gKiAgIEBwYXJhbSB7U3RyaW5nfSB1c2VySWRcbiAqICAgQHBhcmFtIHtTdHJpbmd9IHNlc3Npb25JZFxuICogICBAcGFyYW0ge09iamVjdH0gdHJhaXRzXG4gKiAgIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICogICBAcHJvcGVydHkge0Jvb2xlYW58VW5kZWZpbmVkfSBjbG9uZVxuICovXG5cbmZ1bmN0aW9uIElkZW50aWZ5KGRpY3Rpb25hcnksIG9wdHMpIHtcbiAgRmFjYWRlLmNhbGwodGhpcywgZGljdGlvbmFyeSwgb3B0cyk7XG59XG5cbi8qKlxuICogSW5oZXJpdCBmcm9tIGBGYWNhZGVgLlxuICovXG5cbmluaGVyaXQoSWRlbnRpZnksIEZhY2FkZSk7XG5cbi8qKlxuICogR2V0IHRoZSBmYWNhZGUncyBhY3Rpb24uXG4gKi9cblxuSWRlbnRpZnkucHJvdG90eXBlLmFjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ2lkZW50aWZ5Jztcbn07XG5cbklkZW50aWZ5LnByb3RvdHlwZS50eXBlID0gSWRlbnRpZnkucHJvdG90eXBlLmFjdGlvbjtcblxuLyoqXG4gKiBHZXQgdGhlIHVzZXIncyB0cmFpdHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFsaWFzZXNcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5JZGVudGlmeS5wcm90b3R5cGUudHJhaXRzID0gZnVuY3Rpb24oYWxpYXNlcykge1xuICB2YXIgcmV0ID0gdGhpcy5maWVsZCgndHJhaXRzJykgfHwge307XG4gIHZhciBpZCA9IHRoaXMudXNlcklkKCk7XG4gIGFsaWFzZXMgPSBhbGlhc2VzIHx8IHt9O1xuXG4gIGlmIChpZCkgcmV0LmlkID0gaWQ7XG5cbiAgZm9yICh2YXIgYWxpYXMgaW4gYWxpYXNlcykge1xuICAgIHZhciB2YWx1ZSA9IHRoaXNbYWxpYXNdID09IG51bGwgPyB0aGlzLnByb3h5KCd0cmFpdHMuJyArIGFsaWFzKSA6IHRoaXNbYWxpYXNdKCk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIGNvbnRpbnVlO1xuICAgIHJldFthbGlhc2VzW2FsaWFzXV0gPSB2YWx1ZTtcbiAgICBpZiAoYWxpYXMgIT09IGFsaWFzZXNbYWxpYXNdKSBkZWxldGUgcmV0W2FsaWFzXTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgdXNlcidzIGVtYWlsLCBmYWxsaW5nIGJhY2sgdG8gdGhlaXIgdXNlciBJRCBpZiBpdCdzIGEgdmFsaWQgZW1haWwuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS5lbWFpbCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZW1haWwgPSB0aGlzLnByb3h5KCd0cmFpdHMuZW1haWwnKTtcbiAgaWYgKGVtYWlsKSByZXR1cm4gZW1haWw7XG5cbiAgdmFyIHVzZXJJZCA9IHRoaXMudXNlcklkKCk7XG4gIGlmIChpc0VtYWlsKHVzZXJJZCkpIHJldHVybiB1c2VySWQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgdXNlcidzIGNyZWF0ZWQgZGF0ZSwgb3B0aW9uYWxseSBsb29raW5nIGZvciBgY3JlYXRlZEF0YCBzaW5jZSBsb3RzIG9mXG4gKiBwZW9wbGUgZG8gdGhhdCBpbnN0ZWFkLlxuICpcbiAqIEByZXR1cm4ge0RhdGUgb3IgVW5kZWZpbmVkfVxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS5jcmVhdGVkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjcmVhdGVkID0gdGhpcy5wcm94eSgndHJhaXRzLmNyZWF0ZWQnKSB8fCB0aGlzLnByb3h5KCd0cmFpdHMuY3JlYXRlZEF0Jyk7XG4gIGlmIChjcmVhdGVkKSByZXR1cm4gbmV3RGF0ZShjcmVhdGVkKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBjb21wYW55IGNyZWF0ZWQgZGF0ZS5cbiAqXG4gKiBAcmV0dXJuIHtEYXRlIG9yIHVuZGVmaW5lZH1cbiAqL1xuXG5JZGVudGlmeS5wcm90b3R5cGUuY29tcGFueUNyZWF0ZWQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNyZWF0ZWQgPSB0aGlzLnByb3h5KCd0cmFpdHMuY29tcGFueS5jcmVhdGVkJylcbiAgICB8fCB0aGlzLnByb3h5KCd0cmFpdHMuY29tcGFueS5jcmVhdGVkQXQnKTtcblxuICBpZiAoY3JlYXRlZCkgcmV0dXJuIG5ld0RhdGUoY3JlYXRlZCk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgdXNlcidzIG5hbWUsIG9wdGlvbmFsbHkgY29tYmluaW5nIGEgZmlyc3QgYW5kIGxhc3QgbmFtZSBpZiB0aGF0J3MgYWxsXG4gKiB0aGF0IHdhcyBwcm92aWRlZC5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd8dW5kZWZpbmVkfVxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS5uYW1lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBuYW1lID0gdGhpcy5wcm94eSgndHJhaXRzLm5hbWUnKTtcbiAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykgcmV0dXJuIHRyaW0obmFtZSk7XG5cbiAgdmFyIGZpcnN0TmFtZSA9IHRoaXMuZmlyc3ROYW1lKCk7XG4gIHZhciBsYXN0TmFtZSA9IHRoaXMubGFzdE5hbWUoKTtcbiAgaWYgKGZpcnN0TmFtZSAmJiBsYXN0TmFtZSkgcmV0dXJuIHRyaW0oZmlyc3ROYW1lICsgJyAnICsgbGFzdE5hbWUpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHVzZXIncyBmaXJzdCBuYW1lLCBvcHRpb25hbGx5IHNwbGl0dGluZyBpdCBvdXQgb2YgYSBzaW5nbGUgbmFtZSBpZlxuICogdGhhdCdzIGFsbCB0aGF0IHdhcyBwcm92aWRlZC5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd8dW5kZWZpbmVkfVxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS5maXJzdE5hbWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZpcnN0TmFtZSA9IHRoaXMucHJveHkoJ3RyYWl0cy5maXJzdE5hbWUnKTtcbiAgaWYgKHR5cGVvZiBmaXJzdE5hbWUgPT09ICdzdHJpbmcnKSByZXR1cm4gdHJpbShmaXJzdE5hbWUpO1xuXG4gIHZhciBuYW1lID0gdGhpcy5wcm94eSgndHJhaXRzLm5hbWUnKTtcbiAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykgcmV0dXJuIHRyaW0obmFtZSkuc3BsaXQoJyAnKVswXTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSB1c2VyJ3MgbGFzdCBuYW1lLCBvcHRpb25hbGx5IHNwbGl0dGluZyBpdCBvdXQgb2YgYSBzaW5nbGUgbmFtZSBpZlxuICogdGhhdCdzIGFsbCB0aGF0IHdhcyBwcm92aWRlZC5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd8dW5kZWZpbmVkfVxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS5sYXN0TmFtZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbGFzdE5hbWUgPSB0aGlzLnByb3h5KCd0cmFpdHMubGFzdE5hbWUnKTtcbiAgaWYgKHR5cGVvZiBsYXN0TmFtZSA9PT0gJ3N0cmluZycpIHJldHVybiB0cmltKGxhc3ROYW1lKTtcblxuICB2YXIgbmFtZSA9IHRoaXMucHJveHkoJ3RyYWl0cy5uYW1lJyk7XG4gIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHJldHVybjtcblxuICB2YXIgc3BhY2UgPSB0cmltKG5hbWUpLmluZGV4T2YoJyAnKTtcbiAgaWYgKHNwYWNlID09PSAtMSkgcmV0dXJuO1xuXG4gIHJldHVybiB0cmltKG5hbWUuc3Vic3RyKHNwYWNlICsgMSkpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHVzZXIncyB1bmlxdWUgaWQuXG4gKlxuICogQHJldHVybiB7U3RyaW5nIG9yIHVuZGVmaW5lZH1cbiAqL1xuXG5JZGVudGlmeS5wcm90b3R5cGUudWlkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnVzZXJJZCgpIHx8IHRoaXMudXNlcm5hbWUoKSB8fCB0aGlzLmVtYWlsKCk7XG59O1xuXG4vKipcbiAqIEdldCBkZXNjcmlwdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuSWRlbnRpZnkucHJvdG90eXBlLmRlc2NyaXB0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnByb3h5KCd0cmFpdHMuZGVzY3JpcHRpb24nKSB8fCB0aGlzLnByb3h5KCd0cmFpdHMuYmFja2dyb3VuZCcpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGFnZS5cbiAqXG4gKiBJZiB0aGUgYWdlIGlzIG5vdCBleHBsaWNpdGx5IHNldFxuICogdGhlIG1ldGhvZCB3aWxsIGNvbXB1dGUgaXQgZnJvbSBgLmJpcnRoZGF5KClgXG4gKiBpZiBwb3NzaWJsZS5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKi9cblxuSWRlbnRpZnkucHJvdG90eXBlLmFnZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZGF0ZSA9IHRoaXMuYmlydGhkYXkoKTtcbiAgdmFyIGFnZSA9IGdldCh0aGlzLnRyYWl0cygpLCAnYWdlJyk7XG4gIGlmIChhZ2UgIT0gbnVsbCkgcmV0dXJuIGFnZTtcbiAgaWYgKHR5cGUoZGF0ZSkgIT09ICdkYXRlJykgcmV0dXJuO1xuICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgcmV0dXJuIG5vdy5nZXRGdWxsWWVhcigpIC0gZGF0ZS5nZXRGdWxsWWVhcigpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGF2YXRhci5cbiAqXG4gKiAucGhvdG9VcmwgbmVlZGVkIGJlY2F1c2UgaGVscC1zY291dFxuICogaW1wbGVtZW50YXRpb24gdXNlcyBgLmF2YXRhciB8fCAucGhvdG9VcmxgLlxuICpcbiAqIC5hdmF0YXJVcmwgbmVlZGVkIGJlY2F1c2UgdHJha2lvIHVzZXMgaXQuXG4gKlxuICogQHJldHVybiB7TWl4ZWR9XG4gKi9cblxuSWRlbnRpZnkucHJvdG90eXBlLmF2YXRhciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdHJhaXRzID0gdGhpcy50cmFpdHMoKTtcbiAgcmV0dXJuIGdldCh0cmFpdHMsICdhdmF0YXInKVxuICAgIHx8IGdldCh0cmFpdHMsICdwaG90b1VybCcpXG4gICAgfHwgZ2V0KHRyYWl0cywgJ2F2YXRhclVybCcpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHBvc2l0aW9uLlxuICpcbiAqIC5qb2JUaXRsZSBuZWVkZWQgYmVjYXVzZSBzb21lIGludGVncmF0aW9ucyB1c2UgaXQuXG4gKlxuICogQHJldHVybiB7TWl4ZWR9XG4gKi9cblxuSWRlbnRpZnkucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHZhciB0cmFpdHMgPSB0aGlzLnRyYWl0cygpO1xuICByZXR1cm4gZ2V0KHRyYWl0cywgJ3Bvc2l0aW9uJykgfHwgZ2V0KHRyYWl0cywgJ2pvYlRpdGxlJyk7XG59O1xuXG4vKipcbiAqIFNldHVwIHNtZSBiYXNpYyBcInNwZWNpYWxcIiB0cmFpdCBwcm94aWVzLlxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS51c2VybmFtZSA9IEZhY2FkZS5wcm94eSgndHJhaXRzLnVzZXJuYW1lJyk7XG5JZGVudGlmeS5wcm90b3R5cGUud2Vic2l0ZSA9IEZhY2FkZS5vbmUoJ3RyYWl0cy53ZWJzaXRlJyk7XG5JZGVudGlmeS5wcm90b3R5cGUud2Vic2l0ZXMgPSBGYWNhZGUubXVsdGkoJ3RyYWl0cy53ZWJzaXRlJyk7XG5JZGVudGlmeS5wcm90b3R5cGUucGhvbmUgPSBGYWNhZGUub25lKCd0cmFpdHMucGhvbmUnKTtcbklkZW50aWZ5LnByb3RvdHlwZS5waG9uZXMgPSBGYWNhZGUubXVsdGkoJ3RyYWl0cy5waG9uZScpO1xuSWRlbnRpZnkucHJvdG90eXBlLmFkZHJlc3MgPSBGYWNhZGUucHJveHkoJ3RyYWl0cy5hZGRyZXNzJyk7XG5JZGVudGlmeS5wcm90b3R5cGUuZ2VuZGVyID0gRmFjYWRlLnByb3h5KCd0cmFpdHMuZ2VuZGVyJyk7XG5JZGVudGlmeS5wcm90b3R5cGUuYmlydGhkYXkgPSBGYWNhZGUucHJveHkoJ3RyYWl0cy5iaXJ0aGRheScpO1xuIiwiXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB0cmltO1xuXG5mdW5jdGlvbiB0cmltKHN0cil7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKCk7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyp8XFxzKiQvZywgJycpO1xufVxuXG5leHBvcnRzLmxlZnQgPSBmdW5jdGlvbihzdHIpe1xuICBpZiAoc3RyLnRyaW1MZWZ0KSByZXR1cm4gc3RyLnRyaW1MZWZ0KCk7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyovLCAnJyk7XG59O1xuXG5leHBvcnRzLnJpZ2h0ID0gZnVuY3Rpb24oc3RyKXtcbiAgaWYgKHN0ci50cmltUmlnaHQpIHJldHVybiBzdHIudHJpbVJpZ2h0KCk7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXFxzKiQvLCAnJyk7XG59O1xuIiwiXG52YXIgaW5oZXJpdCA9IHJlcXVpcmUoJy4vdXRpbHMnKS5pbmhlcml0O1xudmFyIHR5cGUgPSByZXF1aXJlKCcuL3V0aWxzJykudHlwZTtcbnZhciBGYWNhZGUgPSByZXF1aXJlKCcuL2ZhY2FkZScpO1xudmFyIElkZW50aWZ5ID0gcmVxdWlyZSgnLi9pZGVudGlmeScpO1xudmFyIGlzRW1haWwgPSByZXF1aXJlKCdpcy1lbWFpbCcpO1xudmFyIGdldCA9IHJlcXVpcmUoJ29iai1jYXNlJyk7XG5cbi8qKlxuICogRXhwb3NlIGBUcmFja2AgZmFjYWRlLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gVHJhY2s7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgVHJhY2tgIGZhY2FkZSB3aXRoIGEgYGRpY3Rpb25hcnlgIG9mIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gZGljdGlvbmFyeVxuICogICBAcHJvcGVydHkge3N0cmluZ30gZXZlbnRcbiAqICAgQHByb3BlcnR5IHtzdHJpbmd9IHVzZXJJZFxuICogICBAcHJvcGVydHkge3N0cmluZ30gc2Vzc2lvbklkXG4gKiAgIEBwcm9wZXJ0eSB7T2JqZWN0fSBwcm9wZXJ0aWVzXG4gKiAgIEBwcm9wZXJ0eSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICogICBAcHJvcGVydHkge2Jvb2xlYW58dW5kZWZpbmVkfSBjbG9uZVxuICovXG5cbmZ1bmN0aW9uIFRyYWNrKGRpY3Rpb25hcnksIG9wdHMpIHtcbiAgRmFjYWRlLmNhbGwodGhpcywgZGljdGlvbmFyeSwgb3B0cyk7XG59XG5cbi8qKlxuICogSW5oZXJpdCBmcm9tIGBGYWNhZGVgLlxuICovXG5cbmluaGVyaXQoVHJhY2ssIEZhY2FkZSk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBmYWNhZGUncyBhY3Rpb24uXG4gKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5cblRyYWNrLnByb3RvdHlwZS5hY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICd0cmFjayc7XG59O1xuXG5UcmFjay5wcm90b3R5cGUudHlwZSA9IFRyYWNrLnByb3RvdHlwZS5hY3Rpb247XG5cbi8qKlxuICogU2V0dXAgc29tZSBiYXNpYyBwcm94aWVzLlxuICovXG5cblRyYWNrLnByb3RvdHlwZS5ldmVudCA9IEZhY2FkZS5maWVsZCgnZXZlbnQnKTtcblRyYWNrLnByb3RvdHlwZS52YWx1ZSA9IEZhY2FkZS5wcm94eSgncHJvcGVydGllcy52YWx1ZScpO1xuXG4vKipcbiAqIE1pc2NcbiAqL1xuXG5UcmFjay5wcm90b3R5cGUuY2F0ZWdvcnkgPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMuY2F0ZWdvcnknKTtcblxuLyoqXG4gKiBFY29tbWVyY2VcbiAqL1xuXG5UcmFjay5wcm90b3R5cGUuaWQgPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMuaWQnKTtcblRyYWNrLnByb3RvdHlwZS5za3UgPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMuc2t1Jyk7XG5UcmFjay5wcm90b3R5cGUudGF4ID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLnRheCcpO1xuVHJhY2sucHJvdG90eXBlLm5hbWUgPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMubmFtZScpO1xuVHJhY2sucHJvdG90eXBlLnByaWNlID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLnByaWNlJyk7XG5UcmFjay5wcm90b3R5cGUudG90YWwgPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMudG90YWwnKTtcblRyYWNrLnByb3RvdHlwZS5yZXBlYXQgPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMucmVwZWF0Jyk7XG5UcmFjay5wcm90b3R5cGUuY291cG9uID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLmNvdXBvbicpO1xuVHJhY2sucHJvdG90eXBlLnNoaXBwaW5nID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLnNoaXBwaW5nJyk7XG5UcmFjay5wcm90b3R5cGUuZGlzY291bnQgPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMuZGlzY291bnQnKTtcblxuLyoqXG4gKiBEZXNjcmlwdGlvblxuICovXG5cblRyYWNrLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IEZhY2FkZS5wcm94eSgncHJvcGVydGllcy5kZXNjcmlwdGlvbicpO1xuXG4vKipcbiAqIFBsYW5cbiAqL1xuXG5UcmFjay5wcm90b3R5cGUucGxhbiA9IEZhY2FkZS5wcm94eSgncHJvcGVydGllcy5wbGFuJyk7XG5cbi8qKlxuICogT3JkZXIgaWQuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5cblRyYWNrLnByb3RvdHlwZS5vcmRlcklkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnByb3h5KCdwcm9wZXJ0aWVzLmlkJylcbiAgICB8fCB0aGlzLnByb3h5KCdwcm9wZXJ0aWVzLm9yZGVySWQnKTtcbn07XG5cbi8qKlxuICogR2V0IHN1YnRvdGFsLlxuICpcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuXG5UcmFjay5wcm90b3R5cGUuc3VidG90YWwgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHN1YnRvdGFsID0gZ2V0KHRoaXMucHJvcGVydGllcygpLCAnc3VidG90YWwnKTtcbiAgdmFyIHRvdGFsID0gdGhpcy50b3RhbCgpO1xuXG4gIGlmIChzdWJ0b3RhbCkgcmV0dXJuIHN1YnRvdGFsO1xuICBpZiAoIXRvdGFsKSByZXR1cm4gMDtcblxuICB2YXIgbiA9IHRoaXMudGF4KCk7XG4gIGlmIChuKSB0b3RhbCAtPSBuO1xuICBuID0gdGhpcy5zaGlwcGluZygpO1xuICBpZiAobikgdG90YWwgLT0gbjtcbiAgbiA9IHRoaXMuZGlzY291bnQoKTtcbiAgaWYgKG4pIHRvdGFsICs9IG47XG5cbiAgcmV0dXJuIHRvdGFsO1xufTtcblxuLyoqXG4gKiBHZXQgcHJvZHVjdHMuXG4gKlxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLnByb2R1Y3RzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwcm9wcyA9IHRoaXMucHJvcGVydGllcygpO1xuICB2YXIgcHJvZHVjdHMgPSBnZXQocHJvcHMsICdwcm9kdWN0cycpO1xuICByZXR1cm4gdHlwZShwcm9kdWN0cykgPT09ICdhcnJheScgPyBwcm9kdWN0cyA6IFtdO1xufTtcblxuLyoqXG4gKiBHZXQgcXVhbnRpdHkuXG4gKlxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5cblRyYWNrLnByb3RvdHlwZS5xdWFudGl0eSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcHJvcHMgPSB0aGlzLm9iai5wcm9wZXJ0aWVzIHx8IHt9O1xuICByZXR1cm4gcHJvcHMucXVhbnRpdHkgfHwgMTtcbn07XG5cbi8qKlxuICogR2V0IGN1cnJlbmN5LlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuXG5UcmFjay5wcm90b3R5cGUuY3VycmVuY3kgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHByb3BzID0gdGhpcy5vYmoucHJvcGVydGllcyB8fCB7fTtcbiAgcmV0dXJuIHByb3BzLmN1cnJlbmN5IHx8ICdVU0QnO1xufTtcblxuLyoqXG4gKiBCQUNLV0FSRFMgQ09NUEFUSUJJTElUWTogc2hvdWxkIHByb2JhYmx5IHJlLWV4YW1pbmUgd2hlcmUgdGhlc2UgY29tZSBmcm9tLlxuICovXG5cblRyYWNrLnByb3RvdHlwZS5yZWZlcnJlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5wcm94eSgnY29udGV4dC5yZWZlcnJlci51cmwnKVxuICAgIHx8IHRoaXMucHJveHkoJ2NvbnRleHQucGFnZS5yZWZlcnJlcicpXG4gICAgfHwgdGhpcy5wcm94eSgncHJvcGVydGllcy5yZWZlcnJlcicpO1xufTtcblxuVHJhY2sucHJvdG90eXBlLnF1ZXJ5ID0gRmFjYWRlLnByb3h5KCdvcHRpb25zLnF1ZXJ5Jyk7XG5cbi8qKlxuICogR2V0IHRoZSBjYWxsJ3MgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYWxpYXNlc1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cblRyYWNrLnByb3RvdHlwZS5wcm9wZXJ0aWVzID0gZnVuY3Rpb24oYWxpYXNlcykge1xuICB2YXIgcmV0ID0gdGhpcy5maWVsZCgncHJvcGVydGllcycpIHx8IHt9O1xuICBhbGlhc2VzID0gYWxpYXNlcyB8fCB7fTtcblxuICBmb3IgKHZhciBhbGlhcyBpbiBhbGlhc2VzKSB7XG4gICAgdmFyIHZhbHVlID0gdGhpc1thbGlhc10gPT0gbnVsbCA/IHRoaXMucHJveHkoJ3Byb3BlcnRpZXMuJyArIGFsaWFzKSA6IHRoaXNbYWxpYXNdKCk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIGNvbnRpbnVlO1xuICAgIHJldFthbGlhc2VzW2FsaWFzXV0gPSB2YWx1ZTtcbiAgICBkZWxldGUgcmV0W2FsaWFzXTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgY2FsbCdzIHVzZXJuYW1lLlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ3x1bmRlZmluZWR9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLnVzZXJuYW1lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnByb3h5KCd0cmFpdHMudXNlcm5hbWUnKVxuICAgIHx8IHRoaXMucHJveHkoJ3Byb3BlcnRpZXMudXNlcm5hbWUnKVxuICAgIHx8IHRoaXMudXNlcklkKClcbiAgICB8fCB0aGlzLnNlc3Npb25JZCgpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGNhbGwncyBlbWFpbCwgdXNpbmcgYW4gdGhlIHVzZXIgSUQgaWYgaXQncyBhIHZhbGlkIGVtYWlsLlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ3x1bmRlZmluZWR9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLmVtYWlsID0gZnVuY3Rpb24oKSB7XG4gIHZhciBlbWFpbCA9IHRoaXMucHJveHkoJ3RyYWl0cy5lbWFpbCcpXG4gIHx8IHRoaXMucHJveHkoJ3Byb3BlcnRpZXMuZW1haWwnKVxuICB8fCB0aGlzLnByb3h5KCdvcHRpb25zLnRyYWl0cy5lbWFpbCcpO1xuICBpZiAoZW1haWwpIHJldHVybiBlbWFpbDtcblxuICB2YXIgdXNlcklkID0gdGhpcy51c2VySWQoKTtcbiAgaWYgKGlzRW1haWwodXNlcklkKSkgcmV0dXJuIHVzZXJJZDtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBjYWxsJ3MgcmV2ZW51ZSwgcGFyc2luZyBpdCBmcm9tIGEgc3RyaW5nIHdpdGggYW4gb3B0aW9uYWwgbGVhZGluZ1xuICogZG9sbGFyIHNpZ24uXG4gKlxuICogRm9yIHByb2R1Y3RzL3NlcnZpY2VzIHRoYXQgZG9uJ3QgaGF2ZSBzaGlwcGluZyBhbmQgYXJlIG5vdCBkaXJlY3RseSB0YXhlZCxcbiAqIHRoZXkgb25seSBjYXJlIGFib3V0IHRyYWNraW5nIGByZXZlbnVlYC4gVGhlc2UgYXJlIHRoaW5ncyBsaWtlXG4gKiBTYWFTIGNvbXBhbmllcywgd2hvIHNlbGwgbW9udGhseSBzdWJzY3JpcHRpb25zLiBUaGUgc3Vic2NyaXB0aW9ucyBhcmVuJ3RcbiAqIHRheGVkIGRpcmVjdGx5LCBhbmQgc2luY2UgaXQncyBhIGRpZ2l0YWwgcHJvZHVjdCwgaXQgaGFzIG5vIHNoaXBwaW5nLlxuICpcbiAqIFRoZSBvbmx5IGNhc2Ugd2hlcmUgdGhlcmUncyBhIGRpZmZlcmVuY2UgYmV0d2VlbiBgcmV2ZW51ZWAgYW5kIGB0b3RhbGBcbiAqIChpbiB0aGUgY29udGV4dCBvZiBhbmFseXRpY3MpIGlzIG9uIGVjb21tZXJjZSBwbGF0Zm9ybXMsIHdoZXJlIHRoZXkgd2FudFxuICogdGhlIGByZXZlbnVlYCBmdW5jdGlvbiB0byBhY3R1YWxseSByZXR1cm4gdGhlIGB0b3RhbGAgKHdoaWNoIGluY2x1ZGVzXG4gKiB0YXggYW5kIHNoaXBwaW5nLCB0b3RhbCA9IHN1YnRvdGFsICsgdGF4ICsgc2hpcHBpbmcpLiBUaGlzIGlzIHByb2JhYmx5XG4gKiBiZWNhdXNlIG9uIHRoZWlyIGJhY2tlbmQgdGhleSBhc3N1bWUgdGF4IGFuZCBzaGlwcGluZyBoYXMgYmVlbiBhcHBsaWVkIHRvXG4gKiB0aGUgdmFsdWUsIGFuZCBzbyBjYW4gZ2V0IHRoZSByZXZlbnVlIG9uIHRoZWlyIG93bi5cbiAqXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLnJldmVudWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJldmVudWUgPSB0aGlzLnByb3h5KCdwcm9wZXJ0aWVzLnJldmVudWUnKTtcbiAgdmFyIGV2ZW50ID0gdGhpcy5ldmVudCgpO1xuXG4gIC8vIGl0J3MgYWx3YXlzIHJldmVudWUsIHVubGVzcyBpdCdzIGNhbGxlZCBkdXJpbmcgYW4gb3JkZXIgY29tcGxldGlvbi5cbiAgaWYgKCFyZXZlbnVlICYmIGV2ZW50ICYmIGV2ZW50Lm1hdGNoKC9jb21wbGV0ZWQgP29yZGVyL2kpKSB7XG4gICAgcmV2ZW51ZSA9IHRoaXMucHJveHkoJ3Byb3BlcnRpZXMudG90YWwnKTtcbiAgfVxuXG4gIHJldHVybiBjdXJyZW5jeShyZXZlbnVlKTtcbn07XG5cbi8qKlxuICogR2V0IGNlbnRzLlxuICpcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuXG5UcmFjay5wcm90b3R5cGUuY2VudHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJldmVudWUgPSB0aGlzLnJldmVudWUoKTtcbiAgcmV0dXJuIHR5cGVvZiByZXZlbnVlICE9PSAnbnVtYmVyJyA/IHRoaXMudmFsdWUoKSB8fCAwIDogcmV2ZW51ZSAqIDEwMDtcbn07XG5cbi8qKlxuICogQSB1dGlsaXR5IHRvIHR1cm4gdGhlIHBpZWNlcyBvZiBhIHRyYWNrIGNhbGwgaW50byBhbiBpZGVudGlmeS4gVXNlZCBmb3JcbiAqIGludGVncmF0aW9ucyB3aXRoIHN1cGVyIHByb3BlcnRpZXMgb3IgcmF0ZSBsaW1pdHMuXG4gKlxuICogVE9ETzogcmVtb3ZlIG1lLlxuICpcbiAqIEByZXR1cm4ge0ZhY2FkZX1cbiAqL1xuXG5UcmFjay5wcm90b3R5cGUuaWRlbnRpZnkgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGpzb24gPSB0aGlzLmpzb24oKTtcbiAganNvbi50cmFpdHMgPSB0aGlzLnRyYWl0cygpO1xuICByZXR1cm4gbmV3IElkZW50aWZ5KGpzb24sIHRoaXMub3B0cyk7XG59O1xuXG4vKipcbiAqIEdldCBmbG9hdCBmcm9tIGN1cnJlbmN5IHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5cbmZ1bmN0aW9uIGN1cnJlbmN5KHZhbCkge1xuICBpZiAoIXZhbCkgcmV0dXJuO1xuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHJldHVybiB2YWw7XG4gIGlmICh0eXBlb2YgdmFsICE9PSAnc3RyaW5nJykgcmV0dXJuO1xuXG4gIHZhbCA9IHZhbC5yZXBsYWNlKC9cXCQvZywgJycpO1xuICB2YWwgPSBwYXJzZUZsb2F0KHZhbCk7XG5cbiAgaWYgKCFpc05hTih2YWwpKSByZXR1cm4gdmFsO1xufVxuIiwiXG52YXIgaW5oZXJpdCA9IHJlcXVpcmUoJy4vdXRpbHMnKS5pbmhlcml0O1xudmFyIEZhY2FkZSA9IHJlcXVpcmUoJy4vZmFjYWRlJyk7XG52YXIgVHJhY2sgPSByZXF1aXJlKCcuL3RyYWNrJyk7XG52YXIgaXNFbWFpbCA9IHJlcXVpcmUoJ2lzLWVtYWlsJyk7XG5cblxuLyoqXG4gKiBFeHBvc2UgYFBhZ2VgIGZhY2FkZVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZTtcblxuLyoqXG4gKiBJbml0aWFsaXplIG5ldyBgUGFnZWAgZmFjYWRlIHdpdGggYGRpY3Rpb25hcnlgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkaWN0aW9uYXJ5XG4gKiAgIEBwYXJhbSB7U3RyaW5nfSBjYXRlZ29yeVxuICogICBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogICBAcGFyYW0ge09iamVjdH0gdHJhaXRzXG4gKiAgIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICogICBAcHJvcGVydHkge0Jvb2xlYW58VW5kZWZpbmVkfSBjbG9uZVxuICovXG5cbmZ1bmN0aW9uIFBhZ2UoZGljdGlvbmFyeSwgb3B0cykge1xuICBGYWNhZGUuY2FsbCh0aGlzLCBkaWN0aW9uYXJ5LCBvcHRzKTtcbn1cblxuLyoqXG4gKiBJbmhlcml0IGZyb20gYEZhY2FkZWBcbiAqL1xuXG5pbmhlcml0KFBhZ2UsIEZhY2FkZSk7XG5cbi8qKlxuICogR2V0IHRoZSBmYWNhZGUncyBhY3Rpb24uXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cblBhZ2UucHJvdG90eXBlLmFjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ3BhZ2UnO1xufTtcblxuUGFnZS5wcm90b3R5cGUudHlwZSA9IFBhZ2UucHJvdG90eXBlLmFjdGlvbjtcblxuLyoqXG4gKiBGaWVsZHNcbiAqL1xuXG5QYWdlLnByb3RvdHlwZS5jYXRlZ29yeSA9IEZhY2FkZS5maWVsZCgnY2F0ZWdvcnknKTtcblBhZ2UucHJvdG90eXBlLm5hbWUgPSBGYWNhZGUuZmllbGQoJ25hbWUnKTtcblxuLyoqXG4gKiBQcm94aWVzLlxuICovXG5cblBhZ2UucHJvdG90eXBlLnRpdGxlID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLnRpdGxlJyk7XG5QYWdlLnByb3RvdHlwZS5wYXRoID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLnBhdGgnKTtcblBhZ2UucHJvdG90eXBlLnVybCA9IEZhY2FkZS5wcm94eSgncHJvcGVydGllcy51cmwnKTtcblxuLyoqXG4gKiBSZWZlcnJlci5cbiAqL1xuXG5QYWdlLnByb3RvdHlwZS5yZWZlcnJlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5wcm94eSgnY29udGV4dC5yZWZlcnJlci51cmwnKVxuICAgIHx8IHRoaXMucHJveHkoJ2NvbnRleHQucGFnZS5yZWZlcnJlcicpXG4gICAgfHwgdGhpcy5wcm94eSgncHJvcGVydGllcy5yZWZlcnJlcicpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHBhZ2UgcHJvcGVydGllcyBtaXhpbmcgYGNhdGVnb3J5YCBhbmQgYG5hbWVgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhbGlhc2VzXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuUGFnZS5wcm90b3R5cGUucHJvcGVydGllcyA9IGZ1bmN0aW9uKGFsaWFzZXMpIHtcbiAgdmFyIHByb3BzID0gdGhpcy5maWVsZCgncHJvcGVydGllcycpIHx8IHt9O1xuICB2YXIgY2F0ZWdvcnkgPSB0aGlzLmNhdGVnb3J5KCk7XG4gIHZhciBuYW1lID0gdGhpcy5uYW1lKCk7XG4gIGFsaWFzZXMgPSBhbGlhc2VzIHx8IHt9O1xuXG4gIGlmIChjYXRlZ29yeSkgcHJvcHMuY2F0ZWdvcnkgPSBjYXRlZ29yeTtcbiAgaWYgKG5hbWUpIHByb3BzLm5hbWUgPSBuYW1lO1xuXG4gIGZvciAodmFyIGFsaWFzIGluIGFsaWFzZXMpIHtcbiAgICB2YXIgdmFsdWUgPSBudWxsID09IHRoaXNbYWxpYXNdXG4gICAgICA/IHRoaXMucHJveHkoJ3Byb3BlcnRpZXMuJyArIGFsaWFzKVxuICAgICAgOiB0aGlzW2FsaWFzXSgpO1xuICAgIGlmIChudWxsID09IHZhbHVlKSBjb250aW51ZTtcbiAgICBwcm9wc1thbGlhc2VzW2FsaWFzXV0gPSB2YWx1ZTtcbiAgICBpZiAoYWxpYXMgIT09IGFsaWFzZXNbYWxpYXNdKSBkZWxldGUgcHJvcHNbYWxpYXNdO1xuICB9XG5cbiAgcmV0dXJuIHByb3BzO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHVzZXIncyBlbWFpbCwgZmFsbGluZyBiYWNrIHRvIHRoZWlyIHVzZXIgSUQgaWYgaXQncyBhIHZhbGlkIGVtYWlsLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5QYWdlLnByb3RvdHlwZS5lbWFpbCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZW1haWwgPSB0aGlzLnByb3h5KCdjb250ZXh0LnRyYWl0cy5lbWFpbCcpIHx8IHRoaXMucHJveHkoJ3Byb3BlcnRpZXMuZW1haWwnKTtcbiAgaWYgKGVtYWlsKSByZXR1cm4gZW1haWw7XG5cbiAgdmFyIHVzZXJJZCA9IHRoaXMudXNlcklkKCk7XG4gIGlmIChpc0VtYWlsKHVzZXJJZCkpIHJldHVybiB1c2VySWQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgcGFnZSBmdWxsTmFtZS5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuUGFnZS5wcm90b3R5cGUuZnVsbE5hbWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNhdGVnb3J5ID0gdGhpcy5jYXRlZ29yeSgpO1xuICB2YXIgbmFtZSA9IHRoaXMubmFtZSgpO1xuICByZXR1cm4gbmFtZSAmJiBjYXRlZ29yeVxuICAgID8gY2F0ZWdvcnkgKyAnICcgKyBuYW1lXG4gICAgOiBuYW1lO1xufTtcblxuLyoqXG4gKiBHZXQgZXZlbnQgd2l0aCBgbmFtZWAuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cblBhZ2UucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gbmFtZVxuICAgID8gJ1ZpZXdlZCAnICsgbmFtZSArICcgUGFnZSdcbiAgICA6ICdMb2FkZWQgYSBQYWdlJztcbn07XG5cbi8qKlxuICogQ29udmVydCB0aGlzIFBhZ2UgdG8gYSBUcmFjayBmYWNhZGUgd2l0aCBgbmFtZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge1RyYWNrfVxuICovXG5cblBhZ2UucHJvdG90eXBlLnRyYWNrID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIganNvbiA9IHRoaXMuanNvbigpO1xuICBqc29uLmV2ZW50ID0gdGhpcy5ldmVudChuYW1lKTtcbiAganNvbi50aW1lc3RhbXAgPSB0aGlzLnRpbWVzdGFtcCgpO1xuICBqc29uLnByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnRpZXMoKTtcbiAgcmV0dXJuIG5ldyBUcmFjayhqc29uLCB0aGlzLm9wdHMpO1xufTtcbiIsIlxudmFyIGluaGVyaXQgPSByZXF1aXJlKCcuL3V0aWxzJykuaW5oZXJpdDtcbnZhciBQYWdlID0gcmVxdWlyZSgnLi9wYWdlJyk7XG52YXIgVHJhY2sgPSByZXF1aXJlKCcuL3RyYWNrJyk7XG5cbi8qKlxuICogRXhwb3NlIGBTY3JlZW5gIGZhY2FkZVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gU2NyZWVuO1xuXG4vKipcbiAqIEluaXRpYWxpemUgbmV3IGBTY3JlZW5gIGZhY2FkZSB3aXRoIGBkaWN0aW9uYXJ5YC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZGljdGlvbmFyeVxuICogICBAcGFyYW0ge3N0cmluZ30gY2F0ZWdvcnlcbiAqICAgQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqICAgQHBhcmFtIHtPYmplY3R9IHRyYWl0c1xuICogICBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqICAgQHByb3BlcnR5IHtib29sZWFufHVuZGVmaW5lZH0gY2xvbmVcbiAqL1xuXG5mdW5jdGlvbiBTY3JlZW4oZGljdGlvbmFyeSwgb3B0cykge1xuICBQYWdlLmNhbGwodGhpcywgZGljdGlvbmFyeSwgb3B0cyk7XG59XG5cbi8qKlxuICogSW5oZXJpdCBmcm9tIGBQYWdlYFxuICovXG5cbmluaGVyaXQoU2NyZWVuLCBQYWdlKTtcblxuLyoqXG4gKiBHZXQgdGhlIGZhY2FkZSdzIGFjdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblNjcmVlbi5wcm90b3R5cGUuYWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnc2NyZWVuJztcbn07XG5cblNjcmVlbi5wcm90b3R5cGUudHlwZSA9IFNjcmVlbi5wcm90b3R5cGUuYWN0aW9uO1xuXG4vKipcbiAqIEdldCBldmVudCB3aXRoIGBuYW1lYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7c3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5TY3JlZW4ucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gbmFtZSA/ICdWaWV3ZWQgJyArIG5hbWUgKyAnIFNjcmVlbicgOiAnTG9hZGVkIGEgU2NyZWVuJztcbn07XG5cbi8qKlxuICogQ29udmVydCB0aGlzIFNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7VHJhY2t9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblNjcmVlbi5wcm90b3R5cGUudHJhY2sgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBqc29uID0gdGhpcy5qc29uKCk7XG4gIGpzb24uZXZlbnQgPSB0aGlzLmV2ZW50KG5hbWUpO1xuICBqc29uLnRpbWVzdGFtcCA9IHRoaXMudGltZXN0YW1wKCk7XG4gIGpzb24ucHJvcGVydGllcyA9IHRoaXMucHJvcGVydGllcygpO1xuICByZXR1cm4gbmV3IFRyYWNrKGpzb24sIHRoaXMub3B0cyk7XG59O1xuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGFmdGVyICh0aW1lcywgZnVuYykge1xuICAvLyBBZnRlciAwLCByZWFsbHk/XG4gIGlmICh0aW1lcyA8PSAwKSByZXR1cm4gZnVuYygpO1xuXG4gIC8vIFRoYXQncyBtb3JlIGxpa2UgaXQuXG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9O1xufTsiLCJcbnRyeSB7XG4gIHZhciBiaW5kID0gcmVxdWlyZSgnYmluZCcpO1xuICB2YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcbn0gY2F0Y2ggKGUpIHtcbiAgdmFyIGJpbmQgPSByZXF1aXJlKCdiaW5kLWNvbXBvbmVudCcpO1xuICB2YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUtY29tcG9uZW50Jyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgdmFyIHZhbCA9IG9ialtrZXldO1xuICAgIGlmICh0eXBlKHZhbCkgPT09ICdmdW5jdGlvbicpIG9ialtrZXldID0gYmluZChvYmosIG9ialtrZXldKTtcbiAgfVxuICByZXR1cm4gb2JqO1xufTsiLCIvKipcbiAqIFNsaWNlIHJlZmVyZW5jZS5cbiAqL1xuXG52YXIgc2xpY2UgPSBbXS5zbGljZTtcblxuLyoqXG4gKiBCaW5kIGBvYmpgIHRvIGBmbmAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbnxTdHJpbmd9IGZuIG9yIHN0cmluZ1xuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCBmbil7XG4gIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgZm4pIGZuID0gb2JqW2ZuXTtcbiAgaWYgKCdmdW5jdGlvbicgIT0gdHlwZW9mIGZuKSB0aHJvdyBuZXcgRXJyb3IoJ2JpbmQoKSByZXF1aXJlcyBhIGZ1bmN0aW9uJyk7XG4gIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gZm4uYXBwbHkob2JqLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgfVxufTtcbiIsInZhciBuZXh0ID0gcmVxdWlyZSgnbmV4dC10aWNrJyk7XG5cblxuLyoqXG4gKiBFeHBvc2UgYGNhbGxiYWNrYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNhbGxiYWNrO1xuXG5cbi8qKlxuICogQ2FsbCBhbiBgZm5gIGJhY2sgc3luY2hyb25vdXNseSBpZiBpdCBleGlzdHMuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqL1xuXG5mdW5jdGlvbiBjYWxsYmFjayAoZm4pIHtcbiAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmbikgZm4oKTtcbn1cblxuXG4vKipcbiAqIENhbGwgYW4gYGZuYCBiYWNrIGFzeW5jaHJvbm91c2x5IGlmIGl0IGV4aXN0cy4gSWYgYHdhaXRgIGlzIG9tbWl0dGVkLCB0aGVcbiAqIGBmbmAgd2lsbCBiZSBjYWxsZWQgb24gbmV4dCB0aWNrLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge051bWJlcn0gd2FpdCAob3B0aW9uYWwpXG4gKi9cblxuY2FsbGJhY2suYXN5bmMgPSBmdW5jdGlvbiAoZm4sIHdhaXQpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBmbikgcmV0dXJuO1xuICBpZiAoIXdhaXQpIHJldHVybiBuZXh0KGZuKTtcbiAgc2V0VGltZW91dChmbiwgd2FpdCk7XG59O1xuXG5cbi8qKlxuICogU3ltbWV0cnkuXG4gKi9cblxuY2FsbGJhY2suc3luYyA9IGNhbGxiYWNrO1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT0gJ2Z1bmN0aW9uJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGYpeyBzZXRJbW1lZGlhdGUoZikgfVxufVxuLy8gbGVnYWN5IG5vZGUuanNcbmVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwcm9jZXNzLm5leHRUaWNrID09ICdmdW5jdGlvbicpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBwcm9jZXNzLm5leHRUaWNrXG59XG4vLyBmYWxsYmFjayBmb3Igb3RoZXIgZW52aXJvbm1lbnRzIC8gcG9zdE1lc3NhZ2UgYmVoYXZlcyBiYWRseSBvbiBJRThcbmVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgPT0gJ3VuZGVmaW5lZCcgfHwgd2luZG93LkFjdGl2ZVhPYmplY3QgfHwgIXdpbmRvdy5wb3N0TWVzc2FnZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGYpeyBzZXRUaW1lb3V0KGYpIH07XG59IGVsc2Uge1xuICB2YXIgcSA9IFtdO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBxLmxlbmd0aCkge1xuICAgICAgdHJ5IHsgcVtpKytdKCk7IH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHEgPSBxLnNsaWNlKGkpO1xuICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3RpYyEnLCAnKicpO1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgICBxLmxlbmd0aCA9IDA7XG4gIH0sIHRydWUpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZm4pe1xuICAgIGlmICghcS5sZW5ndGgpIHdpbmRvdy5wb3N0TWVzc2FnZSgndGljIScsICcqJyk7XG4gICAgcS5wdXNoKGZuKTtcbiAgfVxufVxuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIHR5cGU7XG5cbnRyeSB7XG4gIHR5cGUgPSByZXF1aXJlKCd0eXBlJyk7XG59IGNhdGNoKGUpe1xuICB0eXBlID0gcmVxdWlyZSgndHlwZS1jb21wb25lbnQnKTtcbn1cblxuLyoqXG4gKiBNb2R1bGUgZXhwb3J0cy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsb25lO1xuXG4vKipcbiAqIENsb25lcyBvYmplY3RzLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGFueSBvYmplY3RcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gY2xvbmUob2JqKXtcbiAgc3dpdGNoICh0eXBlKG9iaikpIHtcbiAgICBjYXNlICdvYmplY3QnOlxuICAgICAgdmFyIGNvcHkgPSB7fTtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgY29weVtrZXldID0gY2xvbmUob2JqW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY29weTtcblxuICAgIGNhc2UgJ2FycmF5JzpcbiAgICAgIHZhciBjb3B5ID0gbmV3IEFycmF5KG9iai5sZW5ndGgpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGNvcHlbaV0gPSBjbG9uZShvYmpbaV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvcHk7XG5cbiAgICBjYXNlICdyZWdleHAnOlxuICAgICAgLy8gZnJvbSBtaWxsZXJtZWRlaXJvcy9hbWQtdXRpbHMgLSBNSVRcbiAgICAgIHZhciBmbGFncyA9ICcnO1xuICAgICAgZmxhZ3MgKz0gb2JqLm11bHRpbGluZSA/ICdtJyA6ICcnO1xuICAgICAgZmxhZ3MgKz0gb2JqLmdsb2JhbCA/ICdnJyA6ICcnO1xuICAgICAgZmxhZ3MgKz0gb2JqLmlnbm9yZUNhc2UgPyAnaScgOiAnJztcbiAgICAgIHJldHVybiBuZXcgUmVnRXhwKG9iai5zb3VyY2UsIGZsYWdzKTtcblxuICAgIGNhc2UgJ2RhdGUnOlxuICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai5nZXRUaW1lKCkpO1xuXG4gICAgZGVmYXVsdDogLy8gc3RyaW5nLCBudW1iZXIsIGJvb2xlYW4sIOKAplxuICAgICAgcmV0dXJuIG9iajtcbiAgfVxufVxuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGJpbmRBbGwgPSByZXF1aXJlKCdiaW5kLWFsbCcpO1xudmFyIGNsb25lID0gcmVxdWlyZSgnY2xvbmUnKTtcbnZhciBjb29raWUgPSByZXF1aXJlKCdjb29raWUnKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ2FuYWx5dGljcy5qczpjb29raWUnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2RlZmF1bHRzJyk7XG52YXIganNvbiA9IHJlcXVpcmUoJ2pzb24nKTtcbnZhciB0b3BEb21haW4gPSByZXF1aXJlKCd0b3AtZG9tYWluJyk7XG5cblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBDb29raWVgIHdpdGggYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gQ29va2llKG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zKG9wdGlvbnMpO1xufVxuXG5cbi8qKlxuICogR2V0IG9yIHNldCB0aGUgY29va2llIG9wdGlvbnMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqICAgQGZpZWxkIHtOdW1iZXJ9IG1heGFnZSAoMSB5ZWFyKVxuICogICBAZmllbGQge1N0cmluZ30gZG9tYWluXG4gKiAgIEBmaWVsZCB7U3RyaW5nfSBwYXRoXG4gKiAgIEBmaWVsZCB7Qm9vbGVhbn0gc2VjdXJlXG4gKi9cblxuQ29va2llLnByb3RvdHlwZS5vcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRoaXMuX29wdGlvbnM7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIGRvbWFpbiA9ICcuJyArIHRvcERvbWFpbih3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gIGlmIChkb21haW4gPT09ICcuJykgZG9tYWluID0gbnVsbDtcblxuICB0aGlzLl9vcHRpb25zID0gZGVmYXVsdHMob3B0aW9ucywge1xuICAgIC8vIGRlZmF1bHQgdG8gYSB5ZWFyXG4gICAgbWF4YWdlOiAzMTUzNjAwMDAwMCxcbiAgICBwYXRoOiAnLycsXG4gICAgZG9tYWluOiBkb21haW5cbiAgfSk7XG5cbiAgLy8gaHR0cDovL2N1cmwuaGF4eC5zZS9yZmMvY29va2llX3NwZWMuaHRtbFxuICAvLyBodHRwczovL3B1YmxpY3N1ZmZpeC5vcmcvbGlzdC9lZmZlY3RpdmVfdGxkX25hbWVzLmRhdFxuICAvL1xuICAvLyB0cnkgc2V0dGluZyBhIGR1bW15IGNvb2tpZSB3aXRoIHRoZSBvcHRpb25zXG4gIC8vIGlmIHRoZSBjb29raWUgaXNuJ3Qgc2V0LCBpdCBwcm9iYWJseSBtZWFuc1xuICAvLyB0aGF0IHRoZSBkb21haW4gaXMgb24gdGhlIHB1YmxpYyBzdWZmaXggbGlzdFxuICAvLyBsaWtlIG15YXBwLmhlcm9rdWFwcC5jb20gb3IgbG9jYWxob3N0IC8gaXAuXG4gIHRoaXMuc2V0KCdhanM6dGVzdCcsIHRydWUpO1xuICBpZiAoIXRoaXMuZ2V0KCdhanM6dGVzdCcpKSB7XG4gICAgZGVidWcoJ2ZhbGxiYWNrIHRvIGRvbWFpbj1udWxsJyk7XG4gICAgdGhpcy5fb3B0aW9ucy5kb21haW4gPSBudWxsO1xuICB9XG4gIHRoaXMucmVtb3ZlKCdhanM6dGVzdCcpO1xufTtcblxuXG4vKipcbiAqIFNldCBhIGBrZXlgIGFuZCBgdmFsdWVgIGluIG91ciBjb29raWUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufSBzYXZlZFxuICovXG5cbkNvb2tpZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICB0cnkge1xuICAgIHZhbHVlID0ganNvbi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIGNvb2tpZShrZXksIHZhbHVlLCBjbG9uZSh0aGlzLl9vcHRpb25zKSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBHZXQgYSB2YWx1ZSBmcm9tIG91ciBjb29raWUgYnkgYGtleWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHJldHVybiB7T2JqZWN0fSB2YWx1ZVxuICovXG5cbkNvb2tpZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gIHRyeSB7XG4gICAgdmFyIHZhbHVlID0gY29va2llKGtleSk7XG4gICAgdmFsdWUgPSB2YWx1ZSA/IGpzb24ucGFyc2UodmFsdWUpIDogbnVsbDtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcblxuXG4vKipcbiAqIFJlbW92ZSBhIHZhbHVlIGZyb20gb3VyIGNvb2tpZSBieSBga2V5YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcmV0dXJuIHtCb29sZWFufSByZW1vdmVkXG4gKi9cblxuQ29va2llLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihrZXkpIHtcbiAgdHJ5IHtcbiAgICBjb29raWUoa2V5LCBudWxsLCBjbG9uZSh0aGlzLl9vcHRpb25zKSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBFeHBvc2UgdGhlIGNvb2tpZSBzaW5nbGV0b24uXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBiaW5kQWxsKG5ldyBDb29raWUoKSk7XG5cblxuLyoqXG4gKiBFeHBvc2UgdGhlIGBDb29raWVgIGNvbnN0cnVjdG9yLlxuICovXG5cbm1vZHVsZS5leHBvcnRzLkNvb2tpZSA9IENvb2tpZTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ2Nvb2tpZScpO1xuXG4vKipcbiAqIFNldCBvciBnZXQgY29va2llIGBuYW1lYCB3aXRoIGB2YWx1ZWAgYW5kIGBvcHRpb25zYCBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBvcHRpb25zKXtcbiAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgY2FzZSAzOlxuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBzZXQobmFtZSwgdmFsdWUsIG9wdGlvbnMpO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBnZXQobmFtZSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBhbGwoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTZXQgY29va2llIGBuYW1lYCB0byBgdmFsdWVgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZXQobmFtZSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciBzdHIgPSBlbmNvZGUobmFtZSkgKyAnPScgKyBlbmNvZGUodmFsdWUpO1xuXG4gIGlmIChudWxsID09IHZhbHVlKSBvcHRpb25zLm1heGFnZSA9IC0xO1xuXG4gIGlmIChvcHRpb25zLm1heGFnZSkge1xuICAgIG9wdGlvbnMuZXhwaXJlcyA9IG5ldyBEYXRlKCtuZXcgRGF0ZSArIG9wdGlvbnMubWF4YWdlKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnBhdGgpIHN0ciArPSAnOyBwYXRoPScgKyBvcHRpb25zLnBhdGg7XG4gIGlmIChvcHRpb25zLmRvbWFpbikgc3RyICs9ICc7IGRvbWFpbj0nICsgb3B0aW9ucy5kb21haW47XG4gIGlmIChvcHRpb25zLmV4cGlyZXMpIHN0ciArPSAnOyBleHBpcmVzPScgKyBvcHRpb25zLmV4cGlyZXMudG9VVENTdHJpbmcoKTtcbiAgaWYgKG9wdGlvbnMuc2VjdXJlKSBzdHIgKz0gJzsgc2VjdXJlJztcblxuICBkb2N1bWVudC5jb29raWUgPSBzdHI7XG59XG5cbi8qKlxuICogUmV0dXJuIGFsbCBjb29raWVzLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGFsbCgpIHtcbiAgcmV0dXJuIHBhcnNlKGRvY3VtZW50LmNvb2tpZSk7XG59XG5cbi8qKlxuICogR2V0IGNvb2tpZSBgbmFtZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGdldChuYW1lKSB7XG4gIHJldHVybiBhbGwoKVtuYW1lXTtcbn1cblxuLyoqXG4gKiBQYXJzZSBjb29raWUgYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHZhciBvYmogPSB7fTtcbiAgdmFyIHBhaXJzID0gc3RyLnNwbGl0KC8gKjsgKi8pO1xuICB2YXIgcGFpcjtcbiAgaWYgKCcnID09IHBhaXJzWzBdKSByZXR1cm4gb2JqO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhaXJzLmxlbmd0aDsgKytpKSB7XG4gICAgcGFpciA9IHBhaXJzW2ldLnNwbGl0KCc9Jyk7XG4gICAgb2JqW2RlY29kZShwYWlyWzBdKV0gPSBkZWNvZGUocGFpclsxXSk7XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBFbmNvZGUuXG4gKi9cblxuZnVuY3Rpb24gZW5jb2RlKHZhbHVlKXtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGRlYnVnKCdlcnJvciBgZW5jb2RlKCVvKWAgLSAlbycsIHZhbHVlLCBlKVxuICB9XG59XG5cbi8qKlxuICogRGVjb2RlLlxuICovXG5cbmZ1bmN0aW9uIGRlY29kZSh2YWx1ZSkge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZGVidWcoJ2Vycm9yIGBkZWNvZGUoJW8pYCAtICVvJywgdmFsdWUsIGUpXG4gIH1cbn1cbiIsImlmICgndW5kZWZpbmVkJyA9PSB0eXBlb2Ygd2luZG93KSB7XG4gIG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvZGVidWcnKTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xufVxuIiwiLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0dHkgPSByZXF1aXJlKCd0dHknKTtcblxuLyoqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcblxuLyoqXG4gKiBFbmFibGVkIGRlYnVnZ2Vycy5cbiAqL1xuXG52YXIgbmFtZXMgPSBbXVxuICAsIHNraXBzID0gW107XG5cbihwcm9jZXNzLmVudi5ERUJVRyB8fCAnJylcbiAgLnNwbGl0KC9bXFxzLF0rLylcbiAgLmZvckVhY2goZnVuY3Rpb24obmFtZSl7XG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgnKicsICcuKj8nKTtcbiAgICBpZiAobmFtZVswXSA9PT0gJy0nKSB7XG4gICAgICBza2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZS5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWUgKyAnJCcpKTtcbiAgICB9XG4gIH0pO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG52YXIgY29sb3JzID0gWzYsIDIsIDMsIDQsIDUsIDFdO1xuXG4vKipcbiAqIFByZXZpb3VzIGRlYnVnKCkgY2FsbC5cbiAqL1xuXG52YXIgcHJldiA9IHt9O1xuXG4vKipcbiAqIFByZXZpb3VzbHkgYXNzaWduZWQgY29sb3IuXG4gKi9cblxudmFyIHByZXZDb2xvciA9IDA7XG5cbi8qKlxuICogSXMgc3Rkb3V0IGEgVFRZPyBDb2xvcmVkIG91dHB1dCBpcyBkaXNhYmxlZCB3aGVuIGB0cnVlYC5cbiAqL1xuXG52YXIgaXNhdHR5ID0gdHR5LmlzYXR0eSgyKTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb2xvcigpIHtcbiAgcmV0dXJuIGNvbG9yc1twcmV2Q29sb3IrKyAlIGNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIEh1bWFuaXplIHRoZSBnaXZlbiBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBodW1hbml6ZShtcykge1xuICB2YXIgc2VjID0gMTAwMFxuICAgICwgbWluID0gNjAgKiAxMDAwXG4gICAgLCBob3VyID0gNjAgKiBtaW47XG5cbiAgaWYgKG1zID49IGhvdXIpIHJldHVybiAobXMgLyBob3VyKS50b0ZpeGVkKDEpICsgJ2gnO1xuICBpZiAobXMgPj0gbWluKSByZXR1cm4gKG1zIC8gbWluKS50b0ZpeGVkKDEpICsgJ20nO1xuICBpZiAobXMgPj0gc2VjKSByZXR1cm4gKG1zIC8gc2VjIHwgMCkgKyAncyc7XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtUeXBlfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lKSB7XG4gIGZ1bmN0aW9uIGRpc2FibGVkKCl7fVxuICBkaXNhYmxlZC5lbmFibGVkID0gZmFsc2U7XG5cbiAgdmFyIG1hdGNoID0gc2tpcHMuc29tZShmdW5jdGlvbihyZSl7XG4gICAgcmV0dXJuIHJlLnRlc3QobmFtZSk7XG4gIH0pO1xuXG4gIGlmIChtYXRjaCkgcmV0dXJuIGRpc2FibGVkO1xuXG4gIG1hdGNoID0gbmFtZXMuc29tZShmdW5jdGlvbihyZSl7XG4gICAgcmV0dXJuIHJlLnRlc3QobmFtZSk7XG4gIH0pO1xuXG4gIGlmICghbWF0Y2gpIHJldHVybiBkaXNhYmxlZDtcbiAgdmFyIGMgPSBjb2xvcigpO1xuXG4gIGZ1bmN0aW9uIGNvbG9yZWQoZm10KSB7XG4gICAgZm10ID0gY29lcmNlKGZtdCk7XG5cbiAgICB2YXIgY3VyciA9IG5ldyBEYXRlO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldltuYW1lXSB8fCBjdXJyKTtcbiAgICBwcmV2W25hbWVdID0gY3VycjtcblxuICAgIGZtdCA9ICcgIFxcdTAwMWJbOScgKyBjICsgJ20nICsgbmFtZSArICcgJ1xuICAgICAgKyAnXFx1MDAxYlszJyArIGMgKyAnbVxcdTAwMWJbOTBtJ1xuICAgICAgKyBmbXQgKyAnXFx1MDAxYlszJyArIGMgKyAnbSdcbiAgICAgICsgJyArJyArIGh1bWFuaXplKG1zKSArICdcXHUwMDFiWzBtJztcblxuICAgIGNvbnNvbGUuZXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBsYWluKGZtdCkge1xuICAgIGZtdCA9IGNvZXJjZShmbXQpO1xuXG4gICAgZm10ID0gbmV3IERhdGUoKS50b1VUQ1N0cmluZygpXG4gICAgICArICcgJyArIG5hbWUgKyAnICcgKyBmbXQ7XG4gICAgY29uc29sZS5lcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgY29sb3JlZC5lbmFibGVkID0gcGxhaW4uZW5hYmxlZCA9IHRydWU7XG5cbiAgcmV0dXJuIGlzYXR0eSB8fCBwcm9jZXNzLmVudi5ERUJVR19DT0xPUlNcbiAgICA/IGNvbG9yZWRcbiAgICA6IHBsYWluO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cbiIsIlxuLyoqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge1R5cGV9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRlYnVnKG5hbWUpIHtcbiAgaWYgKCFkZWJ1Zy5lbmFibGVkKG5hbWUpKSByZXR1cm4gZnVuY3Rpb24oKXt9O1xuXG4gIHJldHVybiBmdW5jdGlvbihmbXQpe1xuICAgIGZtdCA9IGNvZXJjZShmbXQpO1xuXG4gICAgdmFyIGN1cnIgPSBuZXcgRGF0ZTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKGRlYnVnW25hbWVdIHx8IGN1cnIpO1xuICAgIGRlYnVnW25hbWVdID0gY3VycjtcblxuICAgIGZtdCA9IG5hbWVcbiAgICAgICsgJyAnXG4gICAgICArIGZtdFxuICAgICAgKyAnICsnICsgZGVidWcuaHVtYW5pemUobXMpO1xuXG4gICAgLy8gVGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRThcbiAgICAvLyB3aGVyZSBgY29uc29sZS5sb2dgIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gICAgd2luZG93LmNvbnNvbGVcbiAgICAgICYmIGNvbnNvbGUubG9nXG4gICAgICAmJiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbChjb25zb2xlLmxvZywgY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMuXG4gKi9cblxuZGVidWcubmFtZXMgPSBbXTtcbmRlYnVnLnNraXBzID0gW107XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZS4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5kZWJ1Zy5lbmFibGUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHRyeSB7XG4gICAgbG9jYWxTdG9yYWdlLmRlYnVnID0gbmFtZTtcbiAgfSBjYXRjaChlKXt9XG5cbiAgdmFyIHNwbGl0ID0gKG5hbWUgfHwgJycpLnNwbGl0KC9bXFxzLF0rLylcbiAgICAsIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgbmFtZSA9IHNwbGl0W2ldLnJlcGxhY2UoJyonLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVbMF0gPT09ICctJykge1xuICAgICAgZGVidWcuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWUuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZGVidWcubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWUgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogRGlzYWJsZSBkZWJ1ZyBvdXRwdXQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5kZWJ1Zy5kaXNhYmxlID0gZnVuY3Rpb24oKXtcbiAgZGVidWcuZW5hYmxlKCcnKTtcbn07XG5cbi8qKlxuICogSHVtYW5pemUgdGhlIGdpdmVuIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1cbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmRlYnVnLmh1bWFuaXplID0gZnVuY3Rpb24obXMpIHtcbiAgdmFyIHNlYyA9IDEwMDBcbiAgICAsIG1pbiA9IDYwICogMTAwMFxuICAgICwgaG91ciA9IDYwICogbWluO1xuXG4gIGlmIChtcyA+PSBob3VyKSByZXR1cm4gKG1zIC8gaG91cikudG9GaXhlZCgxKSArICdoJztcbiAgaWYgKG1zID49IG1pbikgcmV0dXJuIChtcyAvIG1pbikudG9GaXhlZCgxKSArICdtJztcbiAgaWYgKG1zID49IHNlYykgcmV0dXJuIChtcyAvIHNlYyB8IDApICsgJ3MnO1xuICByZXR1cm4gbXMgKyAnbXMnO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmRlYnVnLmVuYWJsZWQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBkZWJ1Zy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChkZWJ1Zy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBkZWJ1Zy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChkZWJ1Zy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG5cbi8vIHBlcnNpc3RcblxudHJ5IHtcbiAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2UpIGRlYnVnLmVuYWJsZShsb2NhbFN0b3JhZ2UuZGVidWcpO1xufSBjYXRjaChlKXt9XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWVyZ2UgZGVmYXVsdCB2YWx1ZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRlc3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZhdWx0c1xuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xudmFyIGRlZmF1bHRzID0gZnVuY3Rpb24gKGRlc3QsIHNyYywgcmVjdXJzaXZlKSB7XG4gIGZvciAodmFyIHByb3AgaW4gc3JjKSB7XG4gICAgaWYgKHJlY3Vyc2l2ZSAmJiBkZXN0W3Byb3BdIGluc3RhbmNlb2YgT2JqZWN0ICYmIHNyY1twcm9wXSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgZGVzdFtwcm9wXSA9IGRlZmF1bHRzKGRlc3RbcHJvcF0sIHNyY1twcm9wXSwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmICghIChwcm9wIGluIGRlc3QpKSB7XG4gICAgICBkZXN0W3Byb3BdID0gc3JjW3Byb3BdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZXN0O1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYGRlZmF1bHRzYC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0cztcbiIsIlxudmFyIGpzb24gPSB3aW5kb3cuSlNPTiB8fCB7fTtcbnZhciBzdHJpbmdpZnkgPSBqc29uLnN0cmluZ2lmeTtcbnZhciBwYXJzZSA9IGpzb24ucGFyc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2UgJiYgc3RyaW5naWZ5XG4gID8gSlNPTlxuICA6IHJlcXVpcmUoJ2pzb24tZmFsbGJhY2snKTtcbiIsIi8qXG4gICAganNvbjIuanNcbiAgICAyMDE0LTAyLTA0XG5cbiAgICBQdWJsaWMgRG9tYWluLlxuXG4gICAgTk8gV0FSUkFOVFkgRVhQUkVTU0VEIE9SIElNUExJRUQuIFVTRSBBVCBZT1VSIE9XTiBSSVNLLlxuXG4gICAgU2VlIGh0dHA6Ly93d3cuSlNPTi5vcmcvanMuaHRtbFxuXG5cbiAgICBUaGlzIGNvZGUgc2hvdWxkIGJlIG1pbmlmaWVkIGJlZm9yZSBkZXBsb3ltZW50LlxuICAgIFNlZSBodHRwOi8vamF2YXNjcmlwdC5jcm9ja2ZvcmQuY29tL2pzbWluLmh0bWxcblxuICAgIFVTRSBZT1VSIE9XTiBDT1BZLiBJVCBJUyBFWFRSRU1FTFkgVU5XSVNFIFRPIExPQUQgQ09ERSBGUk9NIFNFUlZFUlMgWU9VIERPXG4gICAgTk9UIENPTlRST0wuXG5cblxuICAgIFRoaXMgZmlsZSBjcmVhdGVzIGEgZ2xvYmFsIEpTT04gb2JqZWN0IGNvbnRhaW5pbmcgdHdvIG1ldGhvZHM6IHN0cmluZ2lmeVxuICAgIGFuZCBwYXJzZS5cblxuICAgICAgICBKU09OLnN0cmluZ2lmeSh2YWx1ZSwgcmVwbGFjZXIsIHNwYWNlKVxuICAgICAgICAgICAgdmFsdWUgICAgICAgYW55IEphdmFTY3JpcHQgdmFsdWUsIHVzdWFsbHkgYW4gb2JqZWN0IG9yIGFycmF5LlxuXG4gICAgICAgICAgICByZXBsYWNlciAgICBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdGhhdCBkZXRlcm1pbmVzIGhvdyBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyBhcmUgc3RyaW5naWZpZWQgZm9yIG9iamVjdHMuIEl0IGNhbiBiZSBhXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBvciBhbiBhcnJheSBvZiBzdHJpbmdzLlxuXG4gICAgICAgICAgICBzcGFjZSAgICAgICBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdGhhdCBzcGVjaWZpZXMgdGhlIGluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBvZiBuZXN0ZWQgc3RydWN0dXJlcy4gSWYgaXQgaXMgb21pdHRlZCwgdGhlIHRleHQgd2lsbFxuICAgICAgICAgICAgICAgICAgICAgICAgYmUgcGFja2VkIHdpdGhvdXQgZXh0cmEgd2hpdGVzcGFjZS4gSWYgaXQgaXMgYSBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdCB3aWxsIHNwZWNpZnkgdGhlIG51bWJlciBvZiBzcGFjZXMgdG8gaW5kZW50IGF0IGVhY2hcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldmVsLiBJZiBpdCBpcyBhIHN0cmluZyAoc3VjaCBhcyAnXFx0JyBvciAnJm5ic3A7JyksXG4gICAgICAgICAgICAgICAgICAgICAgICBpdCBjb250YWlucyB0aGUgY2hhcmFjdGVycyB1c2VkIHRvIGluZGVudCBhdCBlYWNoIGxldmVsLlxuXG4gICAgICAgICAgICBUaGlzIG1ldGhvZCBwcm9kdWNlcyBhIEpTT04gdGV4dCBmcm9tIGEgSmF2YVNjcmlwdCB2YWx1ZS5cblxuICAgICAgICAgICAgV2hlbiBhbiBvYmplY3QgdmFsdWUgaXMgZm91bmQsIGlmIHRoZSBvYmplY3QgY29udGFpbnMgYSB0b0pTT05cbiAgICAgICAgICAgIG1ldGhvZCwgaXRzIHRvSlNPTiBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgYW5kIHRoZSByZXN1bHQgd2lsbCBiZVxuICAgICAgICAgICAgc3RyaW5naWZpZWQuIEEgdG9KU09OIG1ldGhvZCBkb2VzIG5vdCBzZXJpYWxpemU6IGl0IHJldHVybnMgdGhlXG4gICAgICAgICAgICB2YWx1ZSByZXByZXNlbnRlZCBieSB0aGUgbmFtZS92YWx1ZSBwYWlyIHRoYXQgc2hvdWxkIGJlIHNlcmlhbGl6ZWQsXG4gICAgICAgICAgICBvciB1bmRlZmluZWQgaWYgbm90aGluZyBzaG91bGQgYmUgc2VyaWFsaXplZC4gVGhlIHRvSlNPTiBtZXRob2RcbiAgICAgICAgICAgIHdpbGwgYmUgcGFzc2VkIHRoZSBrZXkgYXNzb2NpYXRlZCB3aXRoIHRoZSB2YWx1ZSwgYW5kIHRoaXMgd2lsbCBiZVxuICAgICAgICAgICAgYm91bmQgdG8gdGhlIHZhbHVlXG5cbiAgICAgICAgICAgIEZvciBleGFtcGxlLCB0aGlzIHdvdWxkIHNlcmlhbGl6ZSBEYXRlcyBhcyBJU08gc3RyaW5ncy5cblxuICAgICAgICAgICAgICAgIERhdGUucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZihuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JtYXQgaW50ZWdlcnMgdG8gaGF2ZSBhdCBsZWFzdCB0d28gZGlnaXRzLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4gOiBuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VVRDRnVsbFllYXIoKSAgICsgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDTW9udGgoKSArIDEpICsgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDRGF0ZSgpKSAgICAgICsgJ1QnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDSG91cnMoKSkgICAgICsgJzonICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDTWludXRlcygpKSAgICsgJzonICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDU2Vjb25kcygpKSAgICsgJ1onO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIFlvdSBjYW4gcHJvdmlkZSBhbiBvcHRpb25hbCByZXBsYWNlciBtZXRob2QuIEl0IHdpbGwgYmUgcGFzc2VkIHRoZVxuICAgICAgICAgICAga2V5IGFuZCB2YWx1ZSBvZiBlYWNoIG1lbWJlciwgd2l0aCB0aGlzIGJvdW5kIHRvIHRoZSBjb250YWluaW5nXG4gICAgICAgICAgICBvYmplY3QuIFRoZSB2YWx1ZSB0aGF0IGlzIHJldHVybmVkIGZyb20geW91ciBtZXRob2Qgd2lsbCBiZVxuICAgICAgICAgICAgc2VyaWFsaXplZC4gSWYgeW91ciBtZXRob2QgcmV0dXJucyB1bmRlZmluZWQsIHRoZW4gdGhlIG1lbWJlciB3aWxsXG4gICAgICAgICAgICBiZSBleGNsdWRlZCBmcm9tIHRoZSBzZXJpYWxpemF0aW9uLlxuXG4gICAgICAgICAgICBJZiB0aGUgcmVwbGFjZXIgcGFyYW1ldGVyIGlzIGFuIGFycmF5IG9mIHN0cmluZ3MsIHRoZW4gaXQgd2lsbCBiZVxuICAgICAgICAgICAgdXNlZCB0byBzZWxlY3QgdGhlIG1lbWJlcnMgdG8gYmUgc2VyaWFsaXplZC4gSXQgZmlsdGVycyB0aGUgcmVzdWx0c1xuICAgICAgICAgICAgc3VjaCB0aGF0IG9ubHkgbWVtYmVycyB3aXRoIGtleXMgbGlzdGVkIGluIHRoZSByZXBsYWNlciBhcnJheSBhcmVcbiAgICAgICAgICAgIHN0cmluZ2lmaWVkLlxuXG4gICAgICAgICAgICBWYWx1ZXMgdGhhdCBkbyBub3QgaGF2ZSBKU09OIHJlcHJlc2VudGF0aW9ucywgc3VjaCBhcyB1bmRlZmluZWQgb3JcbiAgICAgICAgICAgIGZ1bmN0aW9ucywgd2lsbCBub3QgYmUgc2VyaWFsaXplZC4gU3VjaCB2YWx1ZXMgaW4gb2JqZWN0cyB3aWxsIGJlXG4gICAgICAgICAgICBkcm9wcGVkOyBpbiBhcnJheXMgdGhleSB3aWxsIGJlIHJlcGxhY2VkIHdpdGggbnVsbC4gWW91IGNhbiB1c2VcbiAgICAgICAgICAgIGEgcmVwbGFjZXIgZnVuY3Rpb24gdG8gcmVwbGFjZSB0aG9zZSB3aXRoIEpTT04gdmFsdWVzLlxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodW5kZWZpbmVkKSByZXR1cm5zIHVuZGVmaW5lZC5cblxuICAgICAgICAgICAgVGhlIG9wdGlvbmFsIHNwYWNlIHBhcmFtZXRlciBwcm9kdWNlcyBhIHN0cmluZ2lmaWNhdGlvbiBvZiB0aGVcbiAgICAgICAgICAgIHZhbHVlIHRoYXQgaXMgZmlsbGVkIHdpdGggbGluZSBicmVha3MgYW5kIGluZGVudGF0aW9uIHRvIG1ha2UgaXRcbiAgICAgICAgICAgIGVhc2llciB0byByZWFkLlxuXG4gICAgICAgICAgICBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgbm9uLWVtcHR5IHN0cmluZywgdGhlbiB0aGF0IHN0cmluZyB3aWxsXG4gICAgICAgICAgICBiZSB1c2VkIGZvciBpbmRlbnRhdGlvbi4gSWYgdGhlIHNwYWNlIHBhcmFtZXRlciBpcyBhIG51bWJlciwgdGhlblxuICAgICAgICAgICAgdGhlIGluZGVudGF0aW9uIHdpbGwgYmUgdGhhdCBtYW55IHNwYWNlcy5cblxuICAgICAgICAgICAgRXhhbXBsZTpcblxuICAgICAgICAgICAgdGV4dCA9IEpTT04uc3RyaW5naWZ5KFsnZScsIHtwbHVyaWJ1czogJ3VudW0nfV0pO1xuICAgICAgICAgICAgLy8gdGV4dCBpcyAnW1wiZVwiLHtcInBsdXJpYnVzXCI6XCJ1bnVtXCJ9XSdcblxuXG4gICAgICAgICAgICB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoWydlJywge3BsdXJpYnVzOiAndW51bSd9XSwgbnVsbCwgJ1xcdCcpO1xuICAgICAgICAgICAgLy8gdGV4dCBpcyAnW1xcblxcdFwiZVwiLFxcblxcdHtcXG5cXHRcXHRcInBsdXJpYnVzXCI6IFwidW51bVwiXFxuXFx0fVxcbl0nXG5cbiAgICAgICAgICAgIHRleHQgPSBKU09OLnN0cmluZ2lmeShbbmV3IERhdGUoKV0sIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNba2V5XSBpbnN0YW5jZW9mIERhdGUgP1xuICAgICAgICAgICAgICAgICAgICAnRGF0ZSgnICsgdGhpc1trZXldICsgJyknIDogdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIHRleHQgaXMgJ1tcIkRhdGUoLS0tY3VycmVudCB0aW1lLS0tKVwiXSdcblxuXG4gICAgICAgIEpTT04ucGFyc2UodGV4dCwgcmV2aXZlcilcbiAgICAgICAgICAgIFRoaXMgbWV0aG9kIHBhcnNlcyBhIEpTT04gdGV4dCB0byBwcm9kdWNlIGFuIG9iamVjdCBvciBhcnJheS5cbiAgICAgICAgICAgIEl0IGNhbiB0aHJvdyBhIFN5bnRheEVycm9yIGV4Y2VwdGlvbi5cblxuICAgICAgICAgICAgVGhlIG9wdGlvbmFsIHJldml2ZXIgcGFyYW1ldGVyIGlzIGEgZnVuY3Rpb24gdGhhdCBjYW4gZmlsdGVyIGFuZFxuICAgICAgICAgICAgdHJhbnNmb3JtIHRoZSByZXN1bHRzLiBJdCByZWNlaXZlcyBlYWNoIG9mIHRoZSBrZXlzIGFuZCB2YWx1ZXMsXG4gICAgICAgICAgICBhbmQgaXRzIHJldHVybiB2YWx1ZSBpcyB1c2VkIGluc3RlYWQgb2YgdGhlIG9yaWdpbmFsIHZhbHVlLlxuICAgICAgICAgICAgSWYgaXQgcmV0dXJucyB3aGF0IGl0IHJlY2VpdmVkLCB0aGVuIHRoZSBzdHJ1Y3R1cmUgaXMgbm90IG1vZGlmaWVkLlxuICAgICAgICAgICAgSWYgaXQgcmV0dXJucyB1bmRlZmluZWQgdGhlbiB0aGUgbWVtYmVyIGlzIGRlbGV0ZWQuXG5cbiAgICAgICAgICAgIEV4YW1wbGU6XG5cbiAgICAgICAgICAgIC8vIFBhcnNlIHRoZSB0ZXh0LiBWYWx1ZXMgdGhhdCBsb29rIGxpa2UgSVNPIGRhdGUgc3RyaW5ncyB3aWxsXG4gICAgICAgICAgICAvLyBiZSBjb252ZXJ0ZWQgdG8gRGF0ZSBvYmplY3RzLlxuXG4gICAgICAgICAgICBteURhdGEgPSBKU09OLnBhcnNlKHRleHQsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGE7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgYSA9XG4vXihcXGR7NH0pLShcXGR7Mn0pLShcXGR7Mn0pVChcXGR7Mn0pOihcXGR7Mn0pOihcXGR7Mn0oPzpcXC5cXGQqKT8pWiQvLmV4ZWModmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKCthWzFdLCArYVsyXSAtIDEsICthWzNdLCArYVs0XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArYVs1XSwgK2FbNl0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbXlEYXRhID0gSlNPTi5wYXJzZSgnW1wiRGF0ZSgwOS8wOS8yMDAxKVwiXScsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQ7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLnNsaWNlKDAsIDUpID09PSAnRGF0ZSgnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS5zbGljZSgtMSkgPT09ICcpJykge1xuICAgICAgICAgICAgICAgICAgICBkID0gbmV3IERhdGUodmFsdWUuc2xpY2UoNSwgLTEpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICBUaGlzIGlzIGEgcmVmZXJlbmNlIGltcGxlbWVudGF0aW9uLiBZb3UgYXJlIGZyZWUgdG8gY29weSwgbW9kaWZ5LCBvclxuICAgIHJlZGlzdHJpYnV0ZS5cbiovXG5cbi8qanNsaW50IGV2aWw6IHRydWUsIHJlZ2V4cDogdHJ1ZSAqL1xuXG4vKm1lbWJlcnMgXCJcIiwgXCJcXGJcIiwgXCJcXHRcIiwgXCJcXG5cIiwgXCJcXGZcIiwgXCJcXHJcIiwgXCJcXFwiXCIsIEpTT04sIFwiXFxcXFwiLCBhcHBseSxcbiAgICBjYWxsLCBjaGFyQ29kZUF0LCBnZXRVVENEYXRlLCBnZXRVVENGdWxsWWVhciwgZ2V0VVRDSG91cnMsXG4gICAgZ2V0VVRDTWludXRlcywgZ2V0VVRDTW9udGgsIGdldFVUQ1NlY29uZHMsIGhhc093blByb3BlcnR5LCBqb2luLFxuICAgIGxhc3RJbmRleCwgbGVuZ3RoLCBwYXJzZSwgcHJvdG90eXBlLCBwdXNoLCByZXBsYWNlLCBzbGljZSwgc3RyaW5naWZ5LFxuICAgIHRlc3QsIHRvSlNPTiwgdG9TdHJpbmcsIHZhbHVlT2ZcbiovXG5cblxuLy8gQ3JlYXRlIGEgSlNPTiBvYmplY3Qgb25seSBpZiBvbmUgZG9lcyBub3QgYWxyZWFkeSBleGlzdC4gV2UgY3JlYXRlIHRoZVxuLy8gbWV0aG9kcyBpbiBhIGNsb3N1cmUgdG8gYXZvaWQgY3JlYXRpbmcgZ2xvYmFsIHZhcmlhYmxlcy5cblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgSlNPTiA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbiAgICBmdW5jdGlvbiBmKG4pIHtcbiAgICAgICAgLy8gRm9ybWF0IGludGVnZXJzIHRvIGhhdmUgYXQgbGVhc3QgdHdvIGRpZ2l0cy5cbiAgICAgICAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4gOiBuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgRGF0ZS5wcm90b3R5cGUudG9KU09OICE9PSAnZnVuY3Rpb24nKSB7XG5cbiAgICAgICAgRGF0ZS5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICByZXR1cm4gaXNGaW5pdGUodGhpcy52YWx1ZU9mKCkpXG4gICAgICAgICAgICAgICAgPyB0aGlzLmdldFVUQ0Z1bGxZZWFyKCkgICAgICsgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ01vbnRoKCkgKyAxKSArICctJyArXG4gICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENEYXRlKCkpICAgICAgKyAnVCcgK1xuICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDSG91cnMoKSkgICAgICsgJzonICtcbiAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ01pbnV0ZXMoKSkgICArICc6JyArXG4gICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENTZWNvbmRzKCkpICAgKyAnWidcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgU3RyaW5nLnByb3RvdHlwZS50b0pTT04gICAgICA9XG4gICAgICAgICAgICBOdW1iZXIucHJvdG90eXBlLnRvSlNPTiAgPVxuICAgICAgICAgICAgQm9vbGVhbi5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKTtcbiAgICAgICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGN4LFxuICAgICAgICBlc2NhcGFibGUsXG4gICAgICAgIGdhcCxcbiAgICAgICAgaW5kZW50LFxuICAgICAgICBtZXRhLFxuICAgICAgICByZXA7XG5cblxuICAgIGZ1bmN0aW9uIHF1b3RlKHN0cmluZykge1xuXG4vLyBJZiB0aGUgc3RyaW5nIGNvbnRhaW5zIG5vIGNvbnRyb2wgY2hhcmFjdGVycywgbm8gcXVvdGUgY2hhcmFjdGVycywgYW5kIG5vXG4vLyBiYWNrc2xhc2ggY2hhcmFjdGVycywgdGhlbiB3ZSBjYW4gc2FmZWx5IHNsYXAgc29tZSBxdW90ZXMgYXJvdW5kIGl0LlxuLy8gT3RoZXJ3aXNlIHdlIG11c3QgYWxzbyByZXBsYWNlIHRoZSBvZmZlbmRpbmcgY2hhcmFjdGVycyB3aXRoIHNhZmUgZXNjYXBlXG4vLyBzZXF1ZW5jZXMuXG5cbiAgICAgICAgZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIHJldHVybiBlc2NhcGFibGUudGVzdChzdHJpbmcpID8gJ1wiJyArIHN0cmluZy5yZXBsYWNlKGVzY2FwYWJsZSwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIHZhciBjID0gbWV0YVthXTtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgYyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICA/IGNcbiAgICAgICAgICAgICAgICA6ICdcXFxcdScgKyAoJzAwMDAnICsgYS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpO1xuICAgICAgICB9KSArICdcIicgOiAnXCInICsgc3RyaW5nICsgJ1wiJztcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIHN0cihrZXksIGhvbGRlcikge1xuXG4vLyBQcm9kdWNlIGEgc3RyaW5nIGZyb20gaG9sZGVyW2tleV0uXG5cbiAgICAgICAgdmFyIGksICAgICAgICAgIC8vIFRoZSBsb29wIGNvdW50ZXIuXG4gICAgICAgICAgICBrLCAgICAgICAgICAvLyBUaGUgbWVtYmVyIGtleS5cbiAgICAgICAgICAgIHYsICAgICAgICAgIC8vIFRoZSBtZW1iZXIgdmFsdWUuXG4gICAgICAgICAgICBsZW5ndGgsXG4gICAgICAgICAgICBtaW5kID0gZ2FwLFxuICAgICAgICAgICAgcGFydGlhbCxcbiAgICAgICAgICAgIHZhbHVlID0gaG9sZGVyW2tleV07XG5cbi8vIElmIHRoZSB2YWx1ZSBoYXMgYSB0b0pTT04gbWV0aG9kLCBjYWxsIGl0IHRvIG9idGFpbiBhIHJlcGxhY2VtZW50IHZhbHVlLlxuXG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIHZhbHVlLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b0pTT04oa2V5KTtcbiAgICAgICAgfVxuXG4vLyBJZiB3ZSB3ZXJlIGNhbGxlZCB3aXRoIGEgcmVwbGFjZXIgZnVuY3Rpb24sIHRoZW4gY2FsbCB0aGUgcmVwbGFjZXIgdG9cbi8vIG9idGFpbiBhIHJlcGxhY2VtZW50IHZhbHVlLlxuXG4gICAgICAgIGlmICh0eXBlb2YgcmVwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHJlcC5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cblxuLy8gV2hhdCBoYXBwZW5zIG5leHQgZGVwZW5kcyBvbiB0aGUgdmFsdWUncyB0eXBlLlxuXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICByZXR1cm4gcXVvdGUodmFsdWUpO1xuXG4gICAgICAgIGNhc2UgJ251bWJlcic6XG5cbi8vIEpTT04gbnVtYmVycyBtdXN0IGJlIGZpbml0ZS4gRW5jb2RlIG5vbi1maW5pdGUgbnVtYmVycyBhcyBudWxsLlxuXG4gICAgICAgICAgICByZXR1cm4gaXNGaW5pdGUodmFsdWUpID8gU3RyaW5nKHZhbHVlKSA6ICdudWxsJztcblxuICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgY2FzZSAnbnVsbCc6XG5cbi8vIElmIHRoZSB2YWx1ZSBpcyBhIGJvb2xlYW4gb3IgbnVsbCwgY29udmVydCBpdCB0byBhIHN0cmluZy4gTm90ZTpcbi8vIHR5cGVvZiBudWxsIGRvZXMgbm90IHByb2R1Y2UgJ251bGwnLiBUaGUgY2FzZSBpcyBpbmNsdWRlZCBoZXJlIGluXG4vLyB0aGUgcmVtb3RlIGNoYW5jZSB0aGF0IHRoaXMgZ2V0cyBmaXhlZCBzb21lZGF5LlxuXG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcblxuLy8gSWYgdGhlIHR5cGUgaXMgJ29iamVjdCcsIHdlIG1pZ2h0IGJlIGRlYWxpbmcgd2l0aCBhbiBvYmplY3Qgb3IgYW4gYXJyYXkgb3Jcbi8vIG51bGwuXG5cbiAgICAgICAgY2FzZSAnb2JqZWN0JzpcblxuLy8gRHVlIHRvIGEgc3BlY2lmaWNhdGlvbiBibHVuZGVyIGluIEVDTUFTY3JpcHQsIHR5cGVvZiBudWxsIGlzICdvYmplY3QnLFxuLy8gc28gd2F0Y2ggb3V0IGZvciB0aGF0IGNhc2UuXG5cbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ251bGwnO1xuICAgICAgICAgICAgfVxuXG4vLyBNYWtlIGFuIGFycmF5IHRvIGhvbGQgdGhlIHBhcnRpYWwgcmVzdWx0cyBvZiBzdHJpbmdpZnlpbmcgdGhpcyBvYmplY3QgdmFsdWUuXG5cbiAgICAgICAgICAgIGdhcCArPSBpbmRlbnQ7XG4gICAgICAgICAgICBwYXJ0aWFsID0gW107XG5cbi8vIElzIHRoZSB2YWx1ZSBhbiBhcnJheT9cblxuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkodmFsdWUpID09PSAnW29iamVjdCBBcnJheV0nKSB7XG5cbi8vIFRoZSB2YWx1ZSBpcyBhbiBhcnJheS4gU3RyaW5naWZ5IGV2ZXJ5IGVsZW1lbnQuIFVzZSBudWxsIGFzIGEgcGxhY2Vob2xkZXJcbi8vIGZvciBub24tSlNPTiB2YWx1ZXMuXG5cbiAgICAgICAgICAgICAgICBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnRpYWxbaV0gPSBzdHIoaSwgdmFsdWUpIHx8ICdudWxsJztcbiAgICAgICAgICAgICAgICB9XG5cbi8vIEpvaW4gYWxsIG9mIHRoZSBlbGVtZW50cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLCBhbmQgd3JhcCB0aGVtIGluXG4vLyBicmFja2V0cy5cblxuICAgICAgICAgICAgICAgIHYgPSBwYXJ0aWFsLmxlbmd0aCA9PT0gMFxuICAgICAgICAgICAgICAgICAgICA/ICdbXSdcbiAgICAgICAgICAgICAgICAgICAgOiBnYXBcbiAgICAgICAgICAgICAgICAgICAgPyAnW1xcbicgKyBnYXAgKyBwYXJ0aWFsLmpvaW4oJyxcXG4nICsgZ2FwKSArICdcXG4nICsgbWluZCArICddJ1xuICAgICAgICAgICAgICAgICAgICA6ICdbJyArIHBhcnRpYWwuam9pbignLCcpICsgJ10nO1xuICAgICAgICAgICAgICAgIGdhcCA9IG1pbmQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgICB9XG5cbi8vIElmIHRoZSByZXBsYWNlciBpcyBhbiBhcnJheSwgdXNlIGl0IHRvIHNlbGVjdCB0aGUgbWVtYmVycyB0byBiZSBzdHJpbmdpZmllZC5cblxuICAgICAgICAgICAgaWYgKHJlcCAmJiB0eXBlb2YgcmVwID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHJlcC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgayA9IHJlcFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSBzdHIoaywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0aWFsLnB1c2gocXVvdGUoaykgKyAoZ2FwID8gJzogJyA6ICc6JykgKyB2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbi8vIE90aGVyd2lzZSwgaXRlcmF0ZSB0aHJvdWdoIGFsbCBvZiB0aGUga2V5cyBpbiB0aGUgb2JqZWN0LlxuXG4gICAgICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gc3RyKGssIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydGlhbC5wdXNoKHF1b3RlKGspICsgKGdhcCA/ICc6ICcgOiAnOicpICsgdik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbi8vIEpvaW4gYWxsIG9mIHRoZSBtZW1iZXIgdGV4dHMgdG9nZXRoZXIsIHNlcGFyYXRlZCB3aXRoIGNvbW1hcyxcbi8vIGFuZCB3cmFwIHRoZW0gaW4gYnJhY2VzLlxuXG4gICAgICAgICAgICB2ID0gcGFydGlhbC5sZW5ndGggPT09IDBcbiAgICAgICAgICAgICAgICA/ICd7fSdcbiAgICAgICAgICAgICAgICA6IGdhcFxuICAgICAgICAgICAgICAgID8gJ3tcXG4nICsgZ2FwICsgcGFydGlhbC5qb2luKCcsXFxuJyArIGdhcCkgKyAnXFxuJyArIG1pbmQgKyAnfSdcbiAgICAgICAgICAgICAgICA6ICd7JyArIHBhcnRpYWwuam9pbignLCcpICsgJ30nO1xuICAgICAgICAgICAgZ2FwID0gbWluZDtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9XG4gICAgfVxuXG4vLyBJZiB0aGUgSlNPTiBvYmplY3QgZG9lcyBub3QgeWV0IGhhdmUgYSBzdHJpbmdpZnkgbWV0aG9kLCBnaXZlIGl0IG9uZS5cblxuICAgIGlmICh0eXBlb2YgSlNPTi5zdHJpbmdpZnkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZXNjYXBhYmxlID0gL1tcXFxcXFxcIlxceDAwLVxceDFmXFx4N2YtXFx4OWZcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZztcbiAgICAgICAgbWV0YSA9IHsgICAgLy8gdGFibGUgb2YgY2hhcmFjdGVyIHN1YnN0aXR1dGlvbnNcbiAgICAgICAgICAgICdcXGInOiAnXFxcXGInLFxuICAgICAgICAgICAgJ1xcdCc6ICdcXFxcdCcsXG4gICAgICAgICAgICAnXFxuJzogJ1xcXFxuJyxcbiAgICAgICAgICAgICdcXGYnOiAnXFxcXGYnLFxuICAgICAgICAgICAgJ1xccic6ICdcXFxccicsXG4gICAgICAgICAgICAnXCInIDogJ1xcXFxcIicsXG4gICAgICAgICAgICAnXFxcXCc6ICdcXFxcXFxcXCdcbiAgICAgICAgfTtcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkgPSBmdW5jdGlvbiAodmFsdWUsIHJlcGxhY2VyLCBzcGFjZSkge1xuXG4vLyBUaGUgc3RyaW5naWZ5IG1ldGhvZCB0YWtlcyBhIHZhbHVlIGFuZCBhbiBvcHRpb25hbCByZXBsYWNlciwgYW5kIGFuIG9wdGlvbmFsXG4vLyBzcGFjZSBwYXJhbWV0ZXIsIGFuZCByZXR1cm5zIGEgSlNPTiB0ZXh0LiBUaGUgcmVwbGFjZXIgY2FuIGJlIGEgZnVuY3Rpb25cbi8vIHRoYXQgY2FuIHJlcGxhY2UgdmFsdWVzLCBvciBhbiBhcnJheSBvZiBzdHJpbmdzIHRoYXQgd2lsbCBzZWxlY3QgdGhlIGtleXMuXG4vLyBBIGRlZmF1bHQgcmVwbGFjZXIgbWV0aG9kIGNhbiBiZSBwcm92aWRlZC4gVXNlIG9mIHRoZSBzcGFjZSBwYXJhbWV0ZXIgY2FuXG4vLyBwcm9kdWNlIHRleHQgdGhhdCBpcyBtb3JlIGVhc2lseSByZWFkYWJsZS5cblxuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBnYXAgPSAnJztcbiAgICAgICAgICAgIGluZGVudCA9ICcnO1xuXG4vLyBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgbnVtYmVyLCBtYWtlIGFuIGluZGVudCBzdHJpbmcgY29udGFpbmluZyB0aGF0XG4vLyBtYW55IHNwYWNlcy5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc3BhY2U7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQgKz0gJyAnO1xuICAgICAgICAgICAgICAgIH1cblxuLy8gSWYgdGhlIHNwYWNlIHBhcmFtZXRlciBpcyBhIHN0cmluZywgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBpbmRlbnQgc3RyaW5nLlxuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpbmRlbnQgPSBzcGFjZTtcbiAgICAgICAgICAgIH1cblxuLy8gSWYgdGhlcmUgaXMgYSByZXBsYWNlciwgaXQgbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIGFuIGFycmF5LlxuLy8gT3RoZXJ3aXNlLCB0aHJvdyBhbiBlcnJvci5cblxuICAgICAgICAgICAgcmVwID0gcmVwbGFjZXI7XG4gICAgICAgICAgICBpZiAocmVwbGFjZXIgJiYgdHlwZW9mIHJlcGxhY2VyICE9PSAnZnVuY3Rpb24nICYmXG4gICAgICAgICAgICAgICAgICAgICh0eXBlb2YgcmVwbGFjZXIgIT09ICdvYmplY3QnIHx8XG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiByZXBsYWNlci5sZW5ndGggIT09ICdudW1iZXInKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSlNPTi5zdHJpbmdpZnknKTtcbiAgICAgICAgICAgIH1cblxuLy8gTWFrZSBhIGZha2Ugcm9vdCBvYmplY3QgY29udGFpbmluZyBvdXIgdmFsdWUgdW5kZXIgdGhlIGtleSBvZiAnJy5cbi8vIFJldHVybiB0aGUgcmVzdWx0IG9mIHN0cmluZ2lmeWluZyB0aGUgdmFsdWUuXG5cbiAgICAgICAgICAgIHJldHVybiBzdHIoJycsIHsnJzogdmFsdWV9KTtcbiAgICAgICAgfTtcbiAgICB9XG5cblxuLy8gSWYgdGhlIEpTT04gb2JqZWN0IGRvZXMgbm90IHlldCBoYXZlIGEgcGFyc2UgbWV0aG9kLCBnaXZlIGl0IG9uZS5cblxuICAgIGlmICh0eXBlb2YgSlNPTi5wYXJzZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjeCA9IC9bXFx1MDAwMFxcdTAwYWRcXHUwNjAwLVxcdTA2MDRcXHUwNzBmXFx1MTdiNFxcdTE3YjVcXHUyMDBjLVxcdTIwMGZcXHUyMDI4LVxcdTIwMmZcXHUyMDYwLVxcdTIwNmZcXHVmZWZmXFx1ZmZmMC1cXHVmZmZmXS9nO1xuICAgICAgICBKU09OLnBhcnNlID0gZnVuY3Rpb24gKHRleHQsIHJldml2ZXIpIHtcblxuLy8gVGhlIHBhcnNlIG1ldGhvZCB0YWtlcyBhIHRleHQgYW5kIGFuIG9wdGlvbmFsIHJldml2ZXIgZnVuY3Rpb24sIGFuZCByZXR1cm5zXG4vLyBhIEphdmFTY3JpcHQgdmFsdWUgaWYgdGhlIHRleHQgaXMgYSB2YWxpZCBKU09OIHRleHQuXG5cbiAgICAgICAgICAgIHZhciBqO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiB3YWxrKGhvbGRlciwga2V5KSB7XG5cbi8vIFRoZSB3YWxrIG1ldGhvZCBpcyB1c2VkIHRvIHJlY3Vyc2l2ZWx5IHdhbGsgdGhlIHJlc3VsdGluZyBzdHJ1Y3R1cmUgc29cbi8vIHRoYXQgbW9kaWZpY2F0aW9ucyBjYW4gYmUgbWFkZS5cblxuICAgICAgICAgICAgICAgIHZhciBrLCB2LCB2YWx1ZSA9IGhvbGRlcltrZXldO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoayBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ID0gd2Fsayh2YWx1ZSwgayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtrXSA9IHY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHZhbHVlW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmV2aXZlci5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG5cblxuLy8gUGFyc2luZyBoYXBwZW5zIGluIGZvdXIgc3RhZ2VzLiBJbiB0aGUgZmlyc3Qgc3RhZ2UsIHdlIHJlcGxhY2UgY2VydGFpblxuLy8gVW5pY29kZSBjaGFyYWN0ZXJzIHdpdGggZXNjYXBlIHNlcXVlbmNlcy4gSmF2YVNjcmlwdCBoYW5kbGVzIG1hbnkgY2hhcmFjdGVyc1xuLy8gaW5jb3JyZWN0bHksIGVpdGhlciBzaWxlbnRseSBkZWxldGluZyB0aGVtLCBvciB0cmVhdGluZyB0aGVtIGFzIGxpbmUgZW5kaW5ncy5cblxuICAgICAgICAgICAgdGV4dCA9IFN0cmluZyh0ZXh0KTtcbiAgICAgICAgICAgIGN4Lmxhc3RJbmRleCA9IDA7XG4gICAgICAgICAgICBpZiAoY3gudGVzdCh0ZXh0KSkge1xuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoY3gsIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFxcXHUnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbi8vIEluIHRoZSBzZWNvbmQgc3RhZ2UsIHdlIHJ1biB0aGUgdGV4dCBhZ2FpbnN0IHJlZ3VsYXIgZXhwcmVzc2lvbnMgdGhhdCBsb29rXG4vLyBmb3Igbm9uLUpTT04gcGF0dGVybnMuIFdlIGFyZSBlc3BlY2lhbGx5IGNvbmNlcm5lZCB3aXRoICcoKScgYW5kICduZXcnXG4vLyBiZWNhdXNlIHRoZXkgY2FuIGNhdXNlIGludm9jYXRpb24sIGFuZCAnPScgYmVjYXVzZSBpdCBjYW4gY2F1c2UgbXV0YXRpb24uXG4vLyBCdXQganVzdCB0byBiZSBzYWZlLCB3ZSB3YW50IHRvIHJlamVjdCBhbGwgdW5leHBlY3RlZCBmb3Jtcy5cblxuLy8gV2Ugc3BsaXQgdGhlIHNlY29uZCBzdGFnZSBpbnRvIDQgcmVnZXhwIG9wZXJhdGlvbnMgaW4gb3JkZXIgdG8gd29yayBhcm91bmRcbi8vIGNyaXBwbGluZyBpbmVmZmljaWVuY2llcyBpbiBJRSdzIGFuZCBTYWZhcmkncyByZWdleHAgZW5naW5lcy4gRmlyc3Qgd2Vcbi8vIHJlcGxhY2UgdGhlIEpTT04gYmFja3NsYXNoIHBhaXJzIHdpdGggJ0AnIChhIG5vbi1KU09OIGNoYXJhY3RlcikuIFNlY29uZCwgd2Vcbi8vIHJlcGxhY2UgYWxsIHNpbXBsZSB2YWx1ZSB0b2tlbnMgd2l0aCAnXScgY2hhcmFjdGVycy4gVGhpcmQsIHdlIGRlbGV0ZSBhbGxcbi8vIG9wZW4gYnJhY2tldHMgdGhhdCBmb2xsb3cgYSBjb2xvbiBvciBjb21tYSBvciB0aGF0IGJlZ2luIHRoZSB0ZXh0LiBGaW5hbGx5LFxuLy8gd2UgbG9vayB0byBzZWUgdGhhdCB0aGUgcmVtYWluaW5nIGNoYXJhY3RlcnMgYXJlIG9ubHkgd2hpdGVzcGFjZSBvciAnXScgb3Jcbi8vICcsJyBvciAnOicgb3IgJ3snIG9yICd9Jy4gSWYgdGhhdCBpcyBzbywgdGhlbiB0aGUgdGV4dCBpcyBzYWZlIGZvciBldmFsLlxuXG4gICAgICAgICAgICBpZiAoL15bXFxdLDp7fVxcc10qJC9cbiAgICAgICAgICAgICAgICAgICAgLnRlc3QodGV4dC5yZXBsYWNlKC9cXFxcKD86W1wiXFxcXFxcL2JmbnJ0XXx1WzAtOWEtZkEtRl17NH0pL2csICdAJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cIlteXCJcXFxcXFxuXFxyXSpcInx0cnVlfGZhbHNlfG51bGx8LT9cXGQrKD86XFwuXFxkKik/KD86W2VFXVsrXFwtXT9cXGQrKT8vZywgJ10nKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyg/Ol58OnwsKSg/OlxccypcXFspKy9nLCAnJykpKSB7XG5cbi8vIEluIHRoZSB0aGlyZCBzdGFnZSB3ZSB1c2UgdGhlIGV2YWwgZnVuY3Rpb24gdG8gY29tcGlsZSB0aGUgdGV4dCBpbnRvIGFcbi8vIEphdmFTY3JpcHQgc3RydWN0dXJlLiBUaGUgJ3snIG9wZXJhdG9yIGlzIHN1YmplY3QgdG8gYSBzeW50YWN0aWMgYW1iaWd1aXR5XG4vLyBpbiBKYXZhU2NyaXB0OiBpdCBjYW4gYmVnaW4gYSBibG9jayBvciBhbiBvYmplY3QgbGl0ZXJhbC4gV2Ugd3JhcCB0aGUgdGV4dFxuLy8gaW4gcGFyZW5zIHRvIGVsaW1pbmF0ZSB0aGUgYW1iaWd1aXR5LlxuXG4gICAgICAgICAgICAgICAgaiA9IGV2YWwoJygnICsgdGV4dCArICcpJyk7XG5cbi8vIEluIHRoZSBvcHRpb25hbCBmb3VydGggc3RhZ2UsIHdlIHJlY3Vyc2l2ZWx5IHdhbGsgdGhlIG5ldyBzdHJ1Y3R1cmUsIHBhc3Npbmdcbi8vIGVhY2ggbmFtZS92YWx1ZSBwYWlyIHRvIGEgcmV2aXZlciBmdW5jdGlvbiBmb3IgcG9zc2libGUgdHJhbnNmb3JtYXRpb24uXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHJldml2ZXIgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgPyB3YWxrKHsnJzogan0sICcnKVxuICAgICAgICAgICAgICAgICAgICA6IGo7XG4gICAgICAgICAgICB9XG5cbi8vIElmIHRoZSB0ZXh0IGlzIG5vdCBKU09OIHBhcnNlYWJsZSwgdGhlbiBhIFN5bnRheEVycm9yIGlzIHRocm93bi5cblxuICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKCdKU09OLnBhcnNlJyk7XG4gICAgICAgIH07XG4gICAgfVxufSgpKTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBwYXJzZSA9IHJlcXVpcmUoJ3VybCcpLnBhcnNlO1xudmFyIGNvb2tpZSA9IHJlcXVpcmUoJ2Nvb2tpZScpO1xuXG4vKipcbiAqIEV4cG9zZSBgZG9tYWluYFxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGRvbWFpbjtcblxuLyoqXG4gKiBFeHBvc2UgYGNvb2tpZWAgZm9yIHRlc3RpbmcuXG4gKi9cblxuZXhwb3J0cy5jb29raWUgPSBjb29raWU7XG5cbi8qKlxuICogR2V0IHRoZSB0b3AgZG9tYWluLlxuICpcbiAqIFRoZSBmdW5jdGlvbiBjb25zdHJ1Y3RzIHRoZSBsZXZlbHMgb2YgZG9tYWluXG4gKiBhbmQgYXR0ZW1wdHMgdG8gc2V0IGEgZ2xvYmFsIGNvb2tpZSBvbiBlYWNoIG9uZVxuICogd2hlbiBpdCBzdWNjZWVkcyBpdCByZXR1cm5zIHRoZSB0b3AgbGV2ZWwgZG9tYWluLlxuICpcbiAqIFRoZSBtZXRob2QgcmV0dXJucyBhbiBlbXB0eSBzdHJpbmcgd2hlbiB0aGUgaG9zdG5hbWVcbiAqIGlzIGFuIGlwIG9yIGBsb2NhbGhvc3RgLlxuICpcbiAqIEV4YW1wbGUgbGV2ZWxzOlxuICpcbiAqICAgICAgZG9tYWluLmxldmVscygnaHR0cDovL3d3dy5nb29nbGUuY28udWsnKTtcbiAqICAgICAgLy8gPT4gW1wiY28udWtcIiwgXCJnb29nbGUuY28udWtcIiwgXCJ3d3cuZ29vZ2xlLmNvLnVrXCJdXG4gKiBcbiAqIEV4YW1wbGU6XG4gKiBcbiAqICAgICAgZG9tYWluKCdodHRwOi8vbG9jYWxob3N0OjMwMDAvYmF6Jyk7XG4gKiAgICAgIC8vID0+ICcnXG4gKiAgICAgIGRvbWFpbignaHR0cDovL2RldjozMDAwL2JheicpO1xuICogICAgICAvLyA9PiAnJ1xuICogICAgICBkb21haW4oJ2h0dHA6Ly8xMjcuMC4wLjE6MzAwMC9iYXonKTtcbiAqICAgICAgLy8gPT4gJydcbiAqICAgICAgZG9tYWluKCdodHRwOi8vc2VnbWVudC5pby9iYXonKTtcbiAqICAgICAgLy8gPT4gJ3NlZ21lbnQuaW8nXG4gKiBcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZG9tYWluKHVybCl7XG4gIHZhciBjb29raWUgPSBleHBvcnRzLmNvb2tpZTtcbiAgdmFyIGxldmVscyA9IGV4cG9ydHMubGV2ZWxzKHVybCk7XG5cbiAgLy8gTG9va3VwIHRoZSByZWFsIHRvcCBsZXZlbCBvbmUuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGV2ZWxzLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGNuYW1lID0gJ19fdGxkX18nO1xuICAgIHZhciBkb21haW4gPSBsZXZlbHNbaV07XG4gICAgdmFyIG9wdHMgPSB7IGRvbWFpbjogJy4nICsgZG9tYWluIH07XG5cbiAgICBjb29raWUoY25hbWUsIDEsIG9wdHMpO1xuICAgIGlmIChjb29raWUoY25hbWUpKSB7XG4gICAgICBjb29raWUoY25hbWUsIG51bGwsIG9wdHMpO1xuICAgICAgcmV0dXJuIGRvbWFpblxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAnJztcbn07XG5cbi8qKlxuICogTGV2ZWxzIHJldHVybnMgYWxsIGxldmVscyBvZiB0aGUgZ2l2ZW4gdXJsLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5kb21haW4ubGV2ZWxzID0gZnVuY3Rpb24odXJsKXtcbiAgdmFyIGhvc3QgPSBwYXJzZSh1cmwpLmhvc3RuYW1lO1xuICB2YXIgcGFydHMgPSBob3N0LnNwbGl0KCcuJyk7XG4gIHZhciBsYXN0ID0gcGFydHNbcGFydHMubGVuZ3RoLTFdO1xuICB2YXIgbGV2ZWxzID0gW107XG5cbiAgLy8gSXAgYWRkcmVzcy5cbiAgaWYgKDQgPT0gcGFydHMubGVuZ3RoICYmIHBhcnNlSW50KGxhc3QsIDEwKSA9PSBsYXN0KSB7XG4gICAgcmV0dXJuIGxldmVscztcbiAgfVxuXG4gIC8vIExvY2FsaG9zdC5cbiAgaWYgKDEgPj0gcGFydHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGxldmVscztcbiAgfVxuXG4gIC8vIENyZWF0ZSBsZXZlbHMuXG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGgtMjsgMCA8PSBpOyAtLWkpIHtcbiAgICBsZXZlbHMucHVzaChwYXJ0cy5zbGljZShpKS5qb2luKCcuJykpO1xuICB9XG5cbiAgcmV0dXJuIGxldmVscztcbn07XG4iLCJcbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGB1cmxgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uKHVybCl7XG4gIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICBhLmhyZWYgPSB1cmw7XG4gIHJldHVybiB7XG4gICAgaHJlZjogYS5ocmVmLFxuICAgIGhvc3Q6IGEuaG9zdCB8fCBsb2NhdGlvbi5ob3N0LFxuICAgIHBvcnQ6ICgnMCcgPT09IGEucG9ydCB8fCAnJyA9PT0gYS5wb3J0KSA/IHBvcnQoYS5wcm90b2NvbCkgOiBhLnBvcnQsXG4gICAgaGFzaDogYS5oYXNoLFxuICAgIGhvc3RuYW1lOiBhLmhvc3RuYW1lIHx8IGxvY2F0aW9uLmhvc3RuYW1lLFxuICAgIHBhdGhuYW1lOiBhLnBhdGhuYW1lLmNoYXJBdCgwKSAhPSAnLycgPyAnLycgKyBhLnBhdGhuYW1lIDogYS5wYXRobmFtZSxcbiAgICBwcm90b2NvbDogIWEucHJvdG9jb2wgfHwgJzonID09IGEucHJvdG9jb2wgPyBsb2NhdGlvbi5wcm90b2NvbCA6IGEucHJvdG9jb2wsXG4gICAgc2VhcmNoOiBhLnNlYXJjaCxcbiAgICBxdWVyeTogYS5zZWFyY2guc2xpY2UoMSlcbiAgfTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYHVybGAgaXMgYWJzb2x1dGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24odXJsKXtcbiAgcmV0dXJuIDAgPT0gdXJsLmluZGV4T2YoJy8vJykgfHwgISF+dXJsLmluZGV4T2YoJzovLycpO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiBgdXJsYCBpcyByZWxhdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmlzUmVsYXRpdmUgPSBmdW5jdGlvbih1cmwpe1xuICByZXR1cm4gIWV4cG9ydHMuaXNBYnNvbHV0ZSh1cmwpO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiBgdXJsYCBpcyBjcm9zcyBkb21haW4uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5pc0Nyb3NzRG9tYWluID0gZnVuY3Rpb24odXJsKXtcbiAgdXJsID0gZXhwb3J0cy5wYXJzZSh1cmwpO1xuICB2YXIgbG9jYXRpb24gPSBleHBvcnRzLnBhcnNlKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgcmV0dXJuIHVybC5ob3N0bmFtZSAhPT0gbG9jYXRpb24uaG9zdG5hbWVcbiAgICB8fCB1cmwucG9ydCAhPT0gbG9jYXRpb24ucG9ydFxuICAgIHx8IHVybC5wcm90b2NvbCAhPT0gbG9jYXRpb24ucHJvdG9jb2w7XG59O1xuXG4vKipcbiAqIFJldHVybiBkZWZhdWx0IHBvcnQgZm9yIGBwcm90b2NvbGAuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBwcm90b2NvbFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHBvcnQgKHByb3RvY29sKXtcbiAgc3dpdGNoIChwcm90b2NvbCkge1xuICAgIGNhc2UgJ2h0dHA6JzpcbiAgICAgIHJldHVybiA4MDtcbiAgICBjYXNlICdodHRwczonOlxuICAgICAgcmV0dXJuIDQ0MztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGxvY2F0aW9uLnBvcnQ7XG4gIH1cbn1cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ2Nvb2tpZScpO1xuXG4vKipcbiAqIFNldCBvciBnZXQgY29va2llIGBuYW1lYCB3aXRoIGB2YWx1ZWAgYW5kIGBvcHRpb25zYCBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBvcHRpb25zKXtcbiAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgY2FzZSAzOlxuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBzZXQobmFtZSwgdmFsdWUsIG9wdGlvbnMpO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBnZXQobmFtZSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBhbGwoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTZXQgY29va2llIGBuYW1lYCB0byBgdmFsdWVgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZXQobmFtZSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciBzdHIgPSBlbmNvZGUobmFtZSkgKyAnPScgKyBlbmNvZGUodmFsdWUpO1xuXG4gIGlmIChudWxsID09IHZhbHVlKSBvcHRpb25zLm1heGFnZSA9IC0xO1xuXG4gIGlmIChvcHRpb25zLm1heGFnZSkge1xuICAgIG9wdGlvbnMuZXhwaXJlcyA9IG5ldyBEYXRlKCtuZXcgRGF0ZSArIG9wdGlvbnMubWF4YWdlKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnBhdGgpIHN0ciArPSAnOyBwYXRoPScgKyBvcHRpb25zLnBhdGg7XG4gIGlmIChvcHRpb25zLmRvbWFpbikgc3RyICs9ICc7IGRvbWFpbj0nICsgb3B0aW9ucy5kb21haW47XG4gIGlmIChvcHRpb25zLmV4cGlyZXMpIHN0ciArPSAnOyBleHBpcmVzPScgKyBvcHRpb25zLmV4cGlyZXMudG9VVENTdHJpbmcoKTtcbiAgaWYgKG9wdGlvbnMuc2VjdXJlKSBzdHIgKz0gJzsgc2VjdXJlJztcblxuICBkb2N1bWVudC5jb29raWUgPSBzdHI7XG59XG5cbi8qKlxuICogUmV0dXJuIGFsbCBjb29raWVzLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGFsbCgpIHtcbiAgdmFyIHN0cjtcbiAgdHJ5IHtcbiAgICBzdHIgPSBkb2N1bWVudC5jb29raWU7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrIHx8IGVycik7XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfVxuICByZXR1cm4gcGFyc2Uoc3RyKTtcbn1cblxuLyoqXG4gKiBHZXQgY29va2llIGBuYW1lYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZ2V0KG5hbWUpIHtcbiAgcmV0dXJuIGFsbCgpW25hbWVdO1xufVxuXG4vKipcbiAqIFBhcnNlIGNvb2tpZSBgc3RyYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgdmFyIG9iaiA9IHt9O1xuICB2YXIgcGFpcnMgPSBzdHIuc3BsaXQoLyAqOyAqLyk7XG4gIHZhciBwYWlyO1xuICBpZiAoJycgPT0gcGFpcnNbMF0pIHJldHVybiBvYmo7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGFpcnMubGVuZ3RoOyArK2kpIHtcbiAgICBwYWlyID0gcGFpcnNbaV0uc3BsaXQoJz0nKTtcbiAgICBvYmpbZGVjb2RlKHBhaXJbMF0pXSA9IGRlY29kZShwYWlyWzFdKTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEVuY29kZS5cbiAqL1xuXG5mdW5jdGlvbiBlbmNvZGUodmFsdWUpe1xuICB0cnkge1xuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZGVidWcoJ2Vycm9yIGBlbmNvZGUoJW8pYCAtICVvJywgdmFsdWUsIGUpXG4gIH1cbn1cblxuLyoqXG4gKiBEZWNvZGUuXG4gKi9cblxuZnVuY3Rpb24gZGVjb2RlKHZhbHVlKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBkZWJ1ZygnZXJyb3IgYGRlY29kZSglbylgIC0gJW8nLCB2YWx1ZSwgZSlcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxuLy8gWFhYOiBIYWNreSBmaXggZm9yIER1byBub3Qgc3VwcG9ydGluZyBzY29wZWQgbW9kdWxlc1xudmFyIGVhY2g7IHRyeSB7IGVhY2ggPSByZXF1aXJlKCdAbmRob3VsZS9lYWNoJyk7IH0gY2F0Y2goZSkgeyBlYWNoID0gcmVxdWlyZSgnZWFjaCcpOyB9XG5cbi8qKlxuICogUmVkdWNlcyBhbGwgdGhlIHZhbHVlcyBpbiBhIGNvbGxlY3Rpb24gZG93biBpbnRvIGEgc2luZ2xlIHZhbHVlLiBEb2VzIHNvIGJ5IGl0ZXJhdGluZyB0aHJvdWdoIHRoZVxuICogY29sbGVjdGlvbiBmcm9tIGxlZnQgdG8gcmlnaHQsIHJlcGVhdGVkbHkgY2FsbGluZyBhbiBgaXRlcmF0b3JgIGZ1bmN0aW9uIGFuZCBwYXNzaW5nIHRvIGl0IGZvdXJcbiAqIGFyZ3VtZW50czogYChhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKWAuXG4gKlxuICogUmV0dXJucyB0aGUgZmluYWwgcmV0dXJuIHZhbHVlIG9mIHRoZSBgaXRlcmF0b3JgIGZ1bmN0aW9uLlxuICpcbiAqIEBuYW1lIGZvbGRsXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0b3IgVGhlIGZ1bmN0aW9uIHRvIGludm9rZSBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHsqfSBhY2N1bXVsYXRvciBUaGUgaW5pdGlhbCBhY2N1bXVsYXRvciB2YWx1ZSwgcGFzc2VkIHRvIHRoZSBmaXJzdCBpbnZvY2F0aW9uIG9mIGBpdGVyYXRvcmAuXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcmV0dXJuIHsqfSBUaGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmaW5hbCBjYWxsIHRvIGBpdGVyYXRvcmAuXG4gKiBAZXhhbXBsZVxuICogZm9sZGwoZnVuY3Rpb24odG90YWwsIG4pIHtcbiAqICAgcmV0dXJuIHRvdGFsICsgbjtcbiAqIH0sIDAsIFsxLCAyLCAzXSk7XG4gKiAvLz0+IDZcbiAqXG4gKiB2YXIgcGhvbmVib29rID0geyBib2I6ICc1NTUtMTExLTIzNDUnLCB0aW06ICc2NTUtMjIyLTY3ODknLCBzaGVpbGE6ICc2NTUtMzMzLTEyOTgnIH07XG4gKlxuICogZm9sZGwoZnVuY3Rpb24ocmVzdWx0cywgcGhvbmVOdW1iZXIpIHtcbiAqICBpZiAocGhvbmVOdW1iZXJbMF0gPT09ICc2Jykge1xuICogICAgcmV0dXJuIHJlc3VsdHMuY29uY2F0KHBob25lTnVtYmVyKTtcbiAqICB9XG4gKiAgcmV0dXJuIHJlc3VsdHM7XG4gKiB9LCBbXSwgcGhvbmVib29rKTtcbiAqIC8vID0+IFsnNjU1LTIyMi02Nzg5JywgJzY1NS0zMzMtMTI5OCddXG4gKi9cblxudmFyIGZvbGRsID0gZnVuY3Rpb24gZm9sZGwoaXRlcmF0b3IsIGFjY3VtdWxhdG9yLCBjb2xsZWN0aW9uKSB7XG4gIGlmICh0eXBlb2YgaXRlcmF0b3IgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBhIGZ1bmN0aW9uIGJ1dCByZWNlaXZlZCBhICcgKyB0eXBlb2YgaXRlcmF0b3IpO1xuICB9XG5cbiAgZWFjaChmdW5jdGlvbih2YWwsIGksIGNvbGxlY3Rpb24pIHtcbiAgICBhY2N1bXVsYXRvciA9IGl0ZXJhdG9yKGFjY3VtdWxhdG9yLCB2YWwsIGksIGNvbGxlY3Rpb24pO1xuICB9LCBjb2xsZWN0aW9uKTtcblxuICByZXR1cm4gYWNjdW11bGF0b3I7XG59O1xuXG4vKipcbiAqIEV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmb2xkbDtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbi8vIFhYWDogSGFja3kgZml4IGZvciBEdW8gbm90IHN1cHBvcnRpbmcgc2NvcGVkIG1vZHVsZXNcbnZhciBrZXlzOyB0cnkgeyBrZXlzID0gcmVxdWlyZSgnQG5kaG91bGUva2V5cycpOyB9IGNhdGNoKGUpIHsga2V5cyA9IHJlcXVpcmUoJ2tleXMnKTsgfVxuXG4vKipcbiAqIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcgcmVmZXJlbmNlLlxuICovXG5cbnZhciBvYmpUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKlxuICogVGVzdHMgaWYgYSB2YWx1ZSBpcyBhIG51bWJlci5cbiAqXG4gKiBAbmFtZSBpc051bWJlclxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWxgIGlzIGEgbnVtYmVyLCBvdGhlcndpc2UgYGZhbHNlYC5cbiAqL1xuXG4vLyBUT0RPOiBNb3ZlIHRvIGxpYnJhcnlcbnZhciBpc051bWJlciA9IGZ1bmN0aW9uIGlzTnVtYmVyKHZhbCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIHJldHVybiB0eXBlID09PSAnbnVtYmVyJyB8fCAodHlwZSA9PT0gJ29iamVjdCcgJiYgb2JqVG9TdHJpbmcuY2FsbCh2YWwpID09PSAnW29iamVjdCBOdW1iZXJdJyk7XG59O1xuXG4vKipcbiAqIFRlc3RzIGlmIGEgdmFsdWUgaXMgYW4gYXJyYXkuXG4gKlxuICogQG5hbWUgaXNBcnJheVxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZSBpcyBhbiBhcnJheSwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gKi9cblxuLy8gVE9ETzogTW92ZSB0byBsaWJyYXJ5XG52YXIgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nID8gQXJyYXkuaXNBcnJheSA6IGZ1bmN0aW9uIGlzQXJyYXkodmFsKSB7XG4gIHJldHVybiBvYmpUb1N0cmluZy5jYWxsKHZhbCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG4vKipcbiAqIFRlc3RzIGlmIGEgdmFsdWUgaXMgYXJyYXktbGlrZS4gQXJyYXktbGlrZSBtZWFucyB0aGUgdmFsdWUgaXMgbm90IGEgZnVuY3Rpb24gYW5kIGhhcyBhIG51bWVyaWNcbiAqIGAubGVuZ3RoYCBwcm9wZXJ0eS5cbiAqXG4gKiBAbmFtZSBpc0FycmF5TGlrZVxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuXG4vLyBUT0RPOiBNb3ZlIHRvIGxpYnJhcnlcbnZhciBpc0FycmF5TGlrZSA9IGZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbCkge1xuICByZXR1cm4gdmFsICE9IG51bGwgJiYgKGlzQXJyYXkodmFsKSB8fCAodmFsICE9PSAnZnVuY3Rpb24nICYmIGlzTnVtYmVyKHZhbC5sZW5ndGgpKSk7XG59O1xuXG4vKipcbiAqIEludGVybmFsIGltcGxlbWVudGF0aW9uIG9mIGBlYWNoYC4gV29ya3Mgb24gYXJyYXlzIGFuZCBhcnJheS1saWtlIGRhdGEgc3RydWN0dXJlcy5cbiAqXG4gKiBAbmFtZSBhcnJheUVhY2hcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbih2YWx1ZSwga2V5LCBjb2xsZWN0aW9uKX0gaXRlcmF0b3IgVGhlIGZ1bmN0aW9uIHRvIGludm9rZSBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5KC1saWtlKSBzdHJ1Y3R1cmUgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHJldHVybiB7dW5kZWZpbmVkfVxuICovXG5cbnZhciBhcnJheUVhY2ggPSBmdW5jdGlvbiBhcnJheUVhY2goaXRlcmF0b3IsIGFycmF5KSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAvLyBCcmVhayBpdGVyYXRpb24gZWFybHkgaWYgYGl0ZXJhdG9yYCByZXR1cm5zIGBmYWxzZWBcbiAgICBpZiAoaXRlcmF0b3IoYXJyYXlbaV0sIGksIGFycmF5KSA9PT0gZmFsc2UpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBgZWFjaGAuIFdvcmtzIG9uIG9iamVjdHMuXG4gKlxuICogQG5hbWUgYmFzZUVhY2hcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbih2YWx1ZSwga2V5LCBjb2xsZWN0aW9uKX0gaXRlcmF0b3IgVGhlIGZ1bmN0aW9uIHRvIGludm9rZSBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAqL1xuXG52YXIgYmFzZUVhY2ggPSBmdW5jdGlvbiBiYXNlRWFjaChpdGVyYXRvciwgb2JqZWN0KSB7XG4gIHZhciBrcyA9IGtleXMob2JqZWN0KTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgLy8gQnJlYWsgaXRlcmF0aW9uIGVhcmx5IGlmIGBpdGVyYXRvcmAgcmV0dXJucyBgZmFsc2VgXG4gICAgaWYgKGl0ZXJhdG9yKG9iamVjdFtrc1tpXV0sIGtzW2ldLCBvYmplY3QpID09PSBmYWxzZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEl0ZXJhdGUgb3ZlciBhbiBpbnB1dCBjb2xsZWN0aW9uLCBpbnZva2luZyBhbiBgaXRlcmF0b3JgIGZ1bmN0aW9uIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlXG4gKiBjb2xsZWN0aW9uIGFuZCBwYXNzaW5nIHRvIGl0IHRocmVlIGFyZ3VtZW50czogYCh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pYC4gVGhlIGBpdGVyYXRvcmBcbiAqIGZ1bmN0aW9uIGNhbiBlbmQgaXRlcmF0aW9uIGVhcmx5IGJ5IHJldHVybmluZyBgZmFsc2VgLlxuICpcbiAqIEBuYW1lIGVhY2hcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge0Z1bmN0aW9uKHZhbHVlLCBrZXksIGNvbGxlY3Rpb24pfSBpdGVyYXRvciBUaGUgZnVuY3Rpb24gdG8gaW52b2tlIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHJldHVybiB7dW5kZWZpbmVkfSBCZWNhdXNlIGBlYWNoYCBpcyBydW4gb25seSBmb3Igc2lkZSBlZmZlY3RzLCBhbHdheXMgcmV0dXJucyBgdW5kZWZpbmVkYC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgbG9nID0gY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAqXG4gKiBlYWNoKGxvZywgWydhJywgJ2InLCAnYyddKTtcbiAqIC8vLT4gJ2EnLCAwLCBbJ2EnLCAnYicsICdjJ11cbiAqIC8vLT4gJ2InLCAxLCBbJ2EnLCAnYicsICdjJ11cbiAqIC8vLT4gJ2MnLCAyLCBbJ2EnLCAnYicsICdjJ11cbiAqIC8vPT4gdW5kZWZpbmVkXG4gKlxuICogZWFjaChsb2csICd0aW0nKTtcbiAqIC8vLT4gJ3QnLCAyLCAndGltJ1xuICogLy8tPiAnaScsIDEsICd0aW0nXG4gKiAvLy0+ICdtJywgMCwgJ3RpbSdcbiAqIC8vPT4gdW5kZWZpbmVkXG4gKlxuICogLy8gTm90ZTogSXRlcmF0aW9uIG9yZGVyIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBlbnZpcm9ubWVudHNcbiAqIGVhY2gobG9nLCB7IG5hbWU6ICd0aW0nLCBvY2N1cGF0aW9uOiAnZW5jaGFudGVyJyB9KTtcbiAqIC8vLT4gJ3RpbScsICduYW1lJywgeyBuYW1lOiAndGltJywgb2NjdXBhdGlvbjogJ2VuY2hhbnRlcicgfVxuICogLy8tPiAnZW5jaGFudGVyJywgJ29jY3VwYXRpb24nLCB7IG5hbWU6ICd0aW0nLCBvY2N1cGF0aW9uOiAnZW5jaGFudGVyJyB9XG4gKiAvLz0+IHVuZGVmaW5lZFxuICovXG5cbnZhciBlYWNoID0gZnVuY3Rpb24gZWFjaChpdGVyYXRvciwgY29sbGVjdGlvbikge1xuICByZXR1cm4gKGlzQXJyYXlMaWtlKGNvbGxlY3Rpb24pID8gYXJyYXlFYWNoIDogYmFzZUVhY2gpLmNhbGwodGhpcywgaXRlcmF0b3IsIGNvbGxlY3Rpb24pO1xufTtcblxuLyoqXG4gKiBFeHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZWFjaDtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBjaGFyQXQgcmVmZXJlbmNlLlxuICovXG5cbnZhciBzdHJDaGFyQXQgPSBTdHJpbmcucHJvdG90eXBlLmNoYXJBdDtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjaGFyYWN0ZXIgYXQgYSBnaXZlbiBpbmRleC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAqIEByZXR1cm4ge3N0cmluZ3x1bmRlZmluZWR9XG4gKi9cblxuLy8gVE9ETzogTW92ZSB0byBhIGxpYnJhcnlcbnZhciBjaGFyQXQgPSBmdW5jdGlvbihzdHIsIGluZGV4KSB7XG4gIHJldHVybiBzdHJDaGFyQXQuY2FsbChzdHIsIGluZGV4KTtcbn07XG5cbi8qKlxuICogaGFzT3duUHJvcGVydHkgcmVmZXJlbmNlLlxuICovXG5cbnZhciBob3AgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcgcmVmZXJlbmNlLlxuICovXG5cbnZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKlxuICogaGFzT3duUHJvcGVydHksIHdyYXBwZWQgYXMgYSBmdW5jdGlvbi5cbiAqXG4gKiBAbmFtZSBoYXNcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHsqfSBjb250ZXh0XG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IHByb3BcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblxuLy8gVE9ETzogTW92ZSB0byBhIGxpYnJhcnlcbnZhciBoYXMgPSBmdW5jdGlvbiBoYXMoY29udGV4dCwgcHJvcCkge1xuICByZXR1cm4gaG9wLmNhbGwoY29udGV4dCwgcHJvcCk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiBhIHZhbHVlIGlzIGEgc3RyaW5nLCBvdGhlcndpc2UgZmFsc2UuXG4gKlxuICogQG5hbWUgaXNTdHJpbmdcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblxuLy8gVE9ETzogTW92ZSB0byBhIGxpYnJhcnlcbnZhciBpc1N0cmluZyA9IGZ1bmN0aW9uIGlzU3RyaW5nKHZhbCkge1xuICByZXR1cm4gdG9TdHIuY2FsbCh2YWwpID09PSAnW29iamVjdCBTdHJpbmddJztcbn07XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIGEgdmFsdWUgaXMgYXJyYXktbGlrZSwgb3RoZXJ3aXNlIGZhbHNlLiBBcnJheS1saWtlIG1lYW5zIGFcbiAqIHZhbHVlIGlzIG5vdCBudWxsLCB1bmRlZmluZWQsIG9yIGEgZnVuY3Rpb24sIGFuZCBoYXMgYSBudW1lcmljIGBsZW5ndGhgXG4gKiBwcm9wZXJ0eS5cbiAqXG4gKiBAbmFtZSBpc0FycmF5TGlrZVxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuXG4vLyBUT0RPOiBNb3ZlIHRvIGEgbGlicmFyeVxudmFyIGlzQXJyYXlMaWtlID0gZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsKSB7XG4gIHJldHVybiB2YWwgIT0gbnVsbCAmJiAodHlwZW9mIHZhbCAhPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgdmFsLmxlbmd0aCA9PT0gJ251bWJlcicpO1xufTtcblxuXG4vKipcbiAqIGluZGV4S2V5c1xuICpcbiAqIEBuYW1lIGluZGV4S2V5c1xuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge30gdGFyZ2V0XG4gKiBAcGFyYW0ge30gcHJlZFxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxudmFyIGluZGV4S2V5cyA9IGZ1bmN0aW9uIGluZGV4S2V5cyh0YXJnZXQsIHByZWQpIHtcbiAgcHJlZCA9IHByZWQgfHwgaGFzO1xuICB2YXIgcmVzdWx0cyA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0YXJnZXQubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICBpZiAocHJlZCh0YXJnZXQsIGkpKSB7XG4gICAgICByZXN1bHRzLnB1c2goU3RyaW5nKGkpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0cztcbn07XG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBvZiBhbGwgdGhlIG93bmVkXG4gKlxuICogQG5hbWUgb2JqZWN0S2V5c1xuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHRhcmdldFxuICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCBQcmVkaWNhdGUgZnVuY3Rpb24gdXNlZCB0byBpbmNsdWRlL2V4Y2x1ZGUgdmFsdWVzIGZyb21cbiAqIHRoZSByZXN1bHRpbmcgYXJyYXkuXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuXG52YXIgb2JqZWN0S2V5cyA9IGZ1bmN0aW9uIG9iamVjdEtleXModGFyZ2V0LCBwcmVkKSB7XG4gIHByZWQgPSBwcmVkIHx8IGhhcztcbiAgdmFyIHJlc3VsdHMgPSBbXTtcblxuXG4gIGZvciAodmFyIGtleSBpbiB0YXJnZXQpIHtcbiAgICBpZiAocHJlZCh0YXJnZXQsIGtleSkpIHtcbiAgICAgIHJlc3VsdHMucHVzaChTdHJpbmcoa2V5KSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgY29tcG9zZWQgb2YgYWxsIGtleXMgb24gdGhlIGlucHV0IG9iamVjdC4gSWdub3JlcyBhbnkgbm9uLWVudW1lcmFibGUgcHJvcGVydGllcy5cbiAqIE1vcmUgcGVybWlzc2l2ZSB0aGFuIHRoZSBuYXRpdmUgYE9iamVjdC5rZXlzYCBmdW5jdGlvbiAobm9uLW9iamVjdHMgd2lsbCBub3QgdGhyb3cgZXJyb3JzKS5cbiAqXG4gKiBAbmFtZSBrZXlzXG4gKiBAYXBpIHB1YmxpY1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgdmFsdWUgdG8gcmV0cmlldmUga2V5cyBmcm9tLlxuICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IGNvbnRhaW5pbmcgYWxsIHRoZSBpbnB1dCBgc291cmNlYCdzIGtleXMuXG4gKiBAZXhhbXBsZVxuICoga2V5cyh7IGxpa2VzOiAnYXZvY2FkbycsIGhhdGVzOiAncGluZWFwcGxlJyB9KTtcbiAqIC8vPT4gWydsaWtlcycsICdwaW5lYXBwbGUnXTtcbiAqXG4gKiAvLyBJZ25vcmVzIG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXNcbiAqIHZhciBoYXNIaWRkZW5LZXkgPSB7IG5hbWU6ICdUaW0nIH07XG4gKiBPYmplY3QuZGVmaW5lUHJvcGVydHkoaGFzSGlkZGVuS2V5LCAnaGlkZGVuJywge1xuICogICB2YWx1ZTogJ2kgYW0gbm90IGVudW1lcmFibGUhJyxcbiAqICAgZW51bWVyYWJsZTogZmFsc2VcbiAqIH0pXG4gKiBrZXlzKGhhc0hpZGRlbktleSk7XG4gKiAvLz0+IFsnbmFtZSddO1xuICpcbiAqIC8vIFdvcmtzIG9uIGFycmF5c1xuICoga2V5cyhbJ2EnLCAnYicsICdjJ10pO1xuICogLy89PiBbJzAnLCAnMScsICcyJ11cbiAqXG4gKiAvLyBTa2lwcyB1bnBvcHVsYXRlZCBpbmRpY2VzIGluIHNwYXJzZSBhcnJheXNcbiAqIHZhciBhcnIgPSBbMV07XG4gKiBhcnJbNF0gPSA0O1xuICoga2V5cyhhcnIpO1xuICogLy89PiBbJzAnLCAnNCddXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBrZXlzKHNvdXJjZSkge1xuICBpZiAoc291cmNlID09IG51bGwpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvLyBJRTYtOCBjb21wYXRpYmlsaXR5IChzdHJpbmcpXG4gIGlmIChpc1N0cmluZyhzb3VyY2UpKSB7XG4gICAgcmV0dXJuIGluZGV4S2V5cyhzb3VyY2UsIGNoYXJBdCk7XG4gIH1cblxuICAvLyBJRTYtOCBjb21wYXRpYmlsaXR5IChhcmd1bWVudHMpXG4gIGlmIChpc0FycmF5TGlrZShzb3VyY2UpKSB7XG4gICAgcmV0dXJuIGluZGV4S2V5cyhzb3VyY2UsIGhhcyk7XG4gIH1cblxuICByZXR1cm4gb2JqZWN0S2V5cyhzb3VyY2UpO1xufTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBFbnRpdHkgPSByZXF1aXJlKCcuL2VudGl0eScpO1xudmFyIGJpbmRBbGwgPSByZXF1aXJlKCdiaW5kLWFsbCcpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnYW5hbHl0aWNzOmdyb3VwJyk7XG52YXIgaW5oZXJpdCA9IHJlcXVpcmUoJ2luaGVyaXQnKTtcblxuLyoqXG4gKiBHcm91cCBkZWZhdWx0c1xuICovXG5cbkdyb3VwLmRlZmF1bHRzID0ge1xuICBwZXJzaXN0OiB0cnVlLFxuICBjb29raWU6IHtcbiAgICBrZXk6ICdhanNfZ3JvdXBfaWQnXG4gIH0sXG4gIGxvY2FsU3RvcmFnZToge1xuICAgIGtleTogJ2Fqc19ncm91cF9wcm9wZXJ0aWVzJ1xuICB9XG59O1xuXG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgR3JvdXBgIHdpdGggYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gR3JvdXAob3B0aW9ucykge1xuICB0aGlzLmRlZmF1bHRzID0gR3JvdXAuZGVmYXVsdHM7XG4gIHRoaXMuZGVidWcgPSBkZWJ1ZztcbiAgRW50aXR5LmNhbGwodGhpcywgb3B0aW9ucyk7XG59XG5cblxuLyoqXG4gKiBJbmhlcml0IGBFbnRpdHlgXG4gKi9cblxuaW5oZXJpdChHcm91cCwgRW50aXR5KTtcblxuXG4vKipcbiAqIEV4cG9zZSB0aGUgZ3JvdXAgc2luZ2xldG9uLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gYmluZEFsbChuZXcgR3JvdXAoKSk7XG5cblxuLyoqXG4gKiBFeHBvc2UgdGhlIGBHcm91cGAgY29uc3RydWN0b3IuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMuR3JvdXAgPSBHcm91cDtcbiIsIlxudmFyIGNsb25lID0gcmVxdWlyZSgnY2xvbmUnKTtcbnZhciBjb29raWUgPSByZXF1aXJlKCcuL2Nvb2tpZScpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnYW5hbHl0aWNzOmVudGl0eScpO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnZGVmYXVsdHMnKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcbnZhciBtZW1vcnkgPSByZXF1aXJlKCcuL21lbW9yeScpO1xudmFyIHN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZScpO1xudmFyIGlzb2RhdGVUcmF2ZXJzZSA9IHJlcXVpcmUoJ2lzb2RhdGUtdHJhdmVyc2UnKTtcblxuXG4vKipcbiAqIEV4cG9zZSBgRW50aXR5YFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5O1xuXG5cbi8qKlxuICogSW5pdGlhbGl6ZSBuZXcgYEVudGl0eWAgd2l0aCBgb3B0aW9uc2AuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBFbnRpdHkob3B0aW9ucykge1xuICB0aGlzLm9wdGlvbnMob3B0aW9ucyk7XG4gIHRoaXMuaW5pdGlhbGl6ZSgpO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemUgcGlja3MgdGhlIHN0b3JhZ2UuXG4gKlxuICogQ2hlY2tzIHRvIHNlZSBpZiBjb29raWVzIGNhbiBiZSBzZXRcbiAqIG90aGVyd2lzZSBmYWxsc2JhY2sgdG8gbG9jYWxTdG9yYWdlLlxuICovXG5cbkVudGl0eS5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCkge1xuICBjb29raWUuc2V0KCdhanM6Y29va2llcycsIHRydWUpO1xuXG4gIC8vIGNvb2tpZXMgYXJlIGVuYWJsZWQuXG4gIGlmIChjb29raWUuZ2V0KCdhanM6Y29va2llcycpKSB7XG4gICAgY29va2llLnJlbW92ZSgnYWpzOmNvb2tpZXMnKTtcbiAgICB0aGlzLl9zdG9yYWdlID0gY29va2llO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGxvY2FsU3RvcmFnZSBpcyBlbmFibGVkLlxuICBpZiAoc3RvcmUuZW5hYmxlZCkge1xuICAgIHRoaXMuX3N0b3JhZ2UgPSBzdG9yZTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBmYWxsYmFjayB0byBtZW1vcnkgc3RvcmFnZS5cbiAgZGVidWcoJ3dhcm5pbmcgdXNpbmcgbWVtb3J5IHN0b3JlIGJvdGggY29va2llcyBhbmQgbG9jYWxTdG9yYWdlIGFyZSBkaXNhYmxlZCcpO1xuICB0aGlzLl9zdG9yYWdlID0gbWVtb3J5O1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHN0b3JhZ2UuXG4gKi9cblxuRW50aXR5LnByb3RvdHlwZS5zdG9yYWdlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9zdG9yYWdlO1xufTtcblxuXG4vKipcbiAqIEdldCBvciBzZXQgc3RvcmFnZSBgb3B0aW9uc2AuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqICAgQHByb3BlcnR5IHtPYmplY3R9IGNvb2tpZVxuICogICBAcHJvcGVydHkge09iamVjdH0gbG9jYWxTdG9yYWdlXG4gKiAgIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gcGVyc2lzdCAoZGVmYXVsdDogYHRydWVgKVxuICovXG5cbkVudGl0eS5wcm90b3R5cGUub3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB0aGlzLl9vcHRpb25zO1xuICB0aGlzLl9vcHRpb25zID0gZGVmYXVsdHMob3B0aW9ucyB8fCB7fSwgdGhpcy5kZWZhdWx0cyB8fCB7fSk7XG59O1xuXG5cbi8qKlxuICogR2V0IG9yIHNldCB0aGUgZW50aXR5J3MgYGlkYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLmlkID0gZnVuY3Rpb24oaWQpIHtcbiAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgY2FzZSAwOiByZXR1cm4gdGhpcy5fZ2V0SWQoKTtcbiAgICBjYXNlIDE6IHJldHVybiB0aGlzLl9zZXRJZChpZCk7XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIE5vIGRlZmF1bHQgY2FzZVxuICB9XG59O1xuXG5cbi8qKlxuICogR2V0IHRoZSBlbnRpdHkncyBpZC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuRW50aXR5LnByb3RvdHlwZS5fZ2V0SWQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJldCA9IHRoaXMuX29wdGlvbnMucGVyc2lzdFxuICAgID8gdGhpcy5zdG9yYWdlKCkuZ2V0KHRoaXMuX29wdGlvbnMuY29va2llLmtleSlcbiAgICA6IHRoaXMuX2lkO1xuICByZXR1cm4gcmV0ID09PSB1bmRlZmluZWQgPyBudWxsIDogcmV0O1xufTtcblxuXG4vKipcbiAqIFNldCB0aGUgZW50aXR5J3MgYGlkYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLl9zZXRJZCA9IGZ1bmN0aW9uKGlkKSB7XG4gIGlmICh0aGlzLl9vcHRpb25zLnBlcnNpc3QpIHtcbiAgICB0aGlzLnN0b3JhZ2UoKS5zZXQodGhpcy5fb3B0aW9ucy5jb29raWUua2V5LCBpZCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5faWQgPSBpZDtcbiAgfVxufTtcblxuXG4vKipcbiAqIEdldCBvciBzZXQgdGhlIGVudGl0eSdzIGB0cmFpdHNgLlxuICpcbiAqIEJBQ0tXQVJEUyBDT01QQVRJQklMSVRZOiBhbGlhc2VkIHRvIGBwcm9wZXJ0aWVzYFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB0cmFpdHNcbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLnByb3BlcnRpZXMgPSBFbnRpdHkucHJvdG90eXBlLnRyYWl0cyA9IGZ1bmN0aW9uKHRyYWl0cykge1xuICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBjYXNlIDA6IHJldHVybiB0aGlzLl9nZXRUcmFpdHMoKTtcbiAgICBjYXNlIDE6IHJldHVybiB0aGlzLl9zZXRUcmFpdHModHJhaXRzKTtcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gTm8gZGVmYXVsdCBjYXNlXG4gIH1cbn07XG5cblxuLyoqXG4gKiBHZXQgdGhlIGVudGl0eSdzIHRyYWl0cy4gQWx3YXlzIGNvbnZlcnQgSVNPIGRhdGUgc3RyaW5ncyBpbnRvIHJlYWwgZGF0ZXMsXG4gKiBzaW5jZSB0aGV5IGFyZW4ndCBwYXJzZWQgYmFjayBmcm9tIGxvY2FsIHN0b3JhZ2UuXG4gKlxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbkVudGl0eS5wcm90b3R5cGUuX2dldFRyYWl0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmV0ID0gdGhpcy5fb3B0aW9ucy5wZXJzaXN0ID8gc3RvcmUuZ2V0KHRoaXMuX29wdGlvbnMubG9jYWxTdG9yYWdlLmtleSkgOiB0aGlzLl90cmFpdHM7XG4gIHJldHVybiByZXQgPyBpc29kYXRlVHJhdmVyc2UoY2xvbmUocmV0KSkgOiB7fTtcbn07XG5cblxuLyoqXG4gKiBTZXQgdGhlIGVudGl0eSdzIGB0cmFpdHNgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB0cmFpdHNcbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLl9zZXRUcmFpdHMgPSBmdW5jdGlvbih0cmFpdHMpIHtcbiAgdHJhaXRzID0gdHJhaXRzIHx8IHt9O1xuICBpZiAodGhpcy5fb3B0aW9ucy5wZXJzaXN0KSB7XG4gICAgc3RvcmUuc2V0KHRoaXMuX29wdGlvbnMubG9jYWxTdG9yYWdlLmtleSwgdHJhaXRzKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl90cmFpdHMgPSB0cmFpdHM7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBJZGVudGlmeSB0aGUgZW50aXR5IHdpdGggYW4gYGlkYCBhbmQgYHRyYWl0c2AuIElmIHdlIGl0J3MgdGhlIHNhbWUgZW50aXR5LFxuICogZXh0ZW5kIHRoZSBleGlzdGluZyBgdHJhaXRzYCBpbnN0ZWFkIG9mIG92ZXJ3cml0aW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBpZFxuICogQHBhcmFtIHtPYmplY3R9IHRyYWl0c1xuICovXG5cbkVudGl0eS5wcm90b3R5cGUuaWRlbnRpZnkgPSBmdW5jdGlvbihpZCwgdHJhaXRzKSB7XG4gIHRyYWl0cyA9IHRyYWl0cyB8fCB7fTtcbiAgdmFyIGN1cnJlbnQgPSB0aGlzLmlkKCk7XG4gIGlmIChjdXJyZW50ID09PSBudWxsIHx8IGN1cnJlbnQgPT09IGlkKSB0cmFpdHMgPSBleHRlbmQodGhpcy50cmFpdHMoKSwgdHJhaXRzKTtcbiAgaWYgKGlkKSB0aGlzLmlkKGlkKTtcbiAgdGhpcy5kZWJ1ZygnaWRlbnRpZnkgJW8sICVvJywgaWQsIHRyYWl0cyk7XG4gIHRoaXMudHJhaXRzKHRyYWl0cyk7XG4gIHRoaXMuc2F2ZSgpO1xufTtcblxuXG4vKipcbiAqIFNhdmUgdGhlIGVudGl0eSB0byBsb2NhbCBzdG9yYWdlIGFuZCB0aGUgY29va2llLlxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuRW50aXR5LnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5fb3B0aW9ucy5wZXJzaXN0KSByZXR1cm4gZmFsc2U7XG4gIGNvb2tpZS5zZXQodGhpcy5fb3B0aW9ucy5jb29raWUua2V5LCB0aGlzLmlkKCkpO1xuICBzdG9yZS5zZXQodGhpcy5fb3B0aW9ucy5sb2NhbFN0b3JhZ2Uua2V5LCB0aGlzLnRyYWl0cygpKTtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG5cbi8qKlxuICogTG9nIHRoZSBlbnRpdHkgb3V0LCByZXNldGluZyBgaWRgIGFuZCBgdHJhaXRzYCB0byBkZWZhdWx0cy5cbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLmxvZ291dCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmlkKG51bGwpO1xuICB0aGlzLnRyYWl0cyh7fSk7XG4gIGNvb2tpZS5yZW1vdmUodGhpcy5fb3B0aW9ucy5jb29raWUua2V5KTtcbiAgc3RvcmUucmVtb3ZlKHRoaXMuX29wdGlvbnMubG9jYWxTdG9yYWdlLmtleSk7XG59O1xuXG5cbi8qKlxuICogUmVzZXQgYWxsIGVudGl0eSBzdGF0ZSwgbG9nZ2luZyBvdXQgYW5kIHJldHVybmluZyBvcHRpb25zIHRvIGRlZmF1bHRzLlxuICovXG5cbkVudGl0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5sb2dvdXQoKTtcbiAgdGhpcy5vcHRpb25zKHt9KTtcbn07XG5cblxuLyoqXG4gKiBMb2FkIHNhdmVkIGVudGl0eSBgaWRgIG9yIGB0cmFpdHNgIGZyb20gc3RvcmFnZS5cbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5pZChjb29raWUuZ2V0KHRoaXMuX29wdGlvbnMuY29va2llLmtleSkpO1xuICB0aGlzLnRyYWl0cyhzdG9yZS5nZXQodGhpcy5fb3B0aW9ucy5sb2NhbFN0b3JhZ2Uua2V5KSk7XG59O1xuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXh0ZW5kIChvYmplY3QpIHtcbiAgICAvLyBUYWtlcyBhbiB1bmxpbWl0ZWQgbnVtYmVyIG9mIGV4dGVuZGVycy5cbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAvLyBGb3IgZWFjaCBleHRlbmRlciwgY29weSB0aGVpciBwcm9wZXJ0aWVzIG9uIG91ciBvYmplY3QuXG4gICAgZm9yICh2YXIgaSA9IDAsIHNvdXJjZTsgc291cmNlID0gYXJnc1tpXTsgaSsrKSB7XG4gICAgICAgIGlmICghc291cmNlKSBjb250aW51ZTtcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBvYmplY3RbcHJvcGVydHldID0gc291cmNlW3Byb3BlcnR5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmplY3Q7XG59OyIsIi8qIGVzbGludCBjb25zaXN0ZW50LXJldHVybjoxICovXG5cbi8qKlxuICogTW9kdWxlIERlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgYmluZEFsbCA9IHJlcXVpcmUoJ2JpbmQtYWxsJyk7XG52YXIgY2xvbmUgPSByZXF1aXJlKCdjbG9uZScpO1xuXG4vKipcbiAqIEhPUC5cbiAqL1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBFeHBvc2UgYE1lbW9yeWBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJpbmRBbGwobmV3IE1lbW9yeSgpKTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGBNZW1vcnlgIHN0b3JlXG4gKi9cblxuZnVuY3Rpb24gTWVtb3J5KCl7XG4gIHRoaXMuc3RvcmUgPSB7fTtcbn1cblxuLyoqXG4gKiBTZXQgYSBga2V5YCBhbmQgYHZhbHVlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5NZW1vcnkucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpe1xuICB0aGlzLnN0b3JlW2tleV0gPSBjbG9uZSh2YWx1ZSk7XG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBHZXQgYSBga2V5YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKi9cblxuTWVtb3J5LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXkpe1xuICBpZiAoIWhhcy5jYWxsKHRoaXMuc3RvcmUsIGtleSkpIHJldHVybjtcbiAgcmV0dXJuIGNsb25lKHRoaXMuc3RvcmVba2V5XSk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhIGBrZXlgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuTWVtb3J5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihrZXkpe1xuICBkZWxldGUgdGhpcy5zdG9yZVtrZXldO1xuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgYmluZEFsbCA9IHJlcXVpcmUoJ2JpbmQtYWxsJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCdkZWZhdWx0cycpO1xudmFyIHN0b3JlID0gcmVxdWlyZSgnc3RvcmUuanMnKTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBTdG9yZWAgd2l0aCBgb3B0aW9uc2AuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBTdG9yZShvcHRpb25zKSB7XG4gIHRoaXMub3B0aW9ucyhvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGBvcHRpb25zYCBmb3IgdGhlIHN0b3JlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiAgIEBmaWVsZCB7Qm9vbGVhbn0gZW5hYmxlZCAodHJ1ZSlcbiAqL1xuXG5TdG9yZS5wcm90b3R5cGUub3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB0aGlzLl9vcHRpb25zO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBkZWZhdWx0cyhvcHRpb25zLCB7IGVuYWJsZWQ6IHRydWUgfSk7XG5cbiAgdGhpcy5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkICYmIHN0b3JlLmVuYWJsZWQ7XG4gIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xufTtcblxuXG4vKipcbiAqIFNldCBhIGBrZXlgIGFuZCBgdmFsdWVgIGluIGxvY2FsIHN0b3JhZ2UuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlXG4gKi9cblxuU3RvcmUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgaWYgKCF0aGlzLmVuYWJsZWQpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHN0b3JlLnNldChrZXksIHZhbHVlKTtcbn07XG5cblxuLyoqXG4gKiBHZXQgYSB2YWx1ZSBmcm9tIGxvY2FsIHN0b3JhZ2UgYnkgYGtleWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cblN0b3JlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXkpIHtcbiAgaWYgKCF0aGlzLmVuYWJsZWQpIHJldHVybiBudWxsO1xuICByZXR1cm4gc3RvcmUuZ2V0KGtleSk7XG59O1xuXG5cbi8qKlxuICogUmVtb3ZlIGEgdmFsdWUgZnJvbSBsb2NhbCBzdG9yYWdlIGJ5IGBrZXlgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqL1xuXG5TdG9yZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oa2V5KSB7XG4gIGlmICghdGhpcy5lbmFibGVkKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KTtcbn07XG5cblxuLyoqXG4gKiBFeHBvc2UgdGhlIHN0b3JlIHNpbmdsZXRvbi5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJpbmRBbGwobmV3IFN0b3JlKCkpO1xuXG5cbi8qKlxuICogRXhwb3NlIHRoZSBgU3RvcmVgIGNvbnN0cnVjdG9yLlxuICovXG5cbm1vZHVsZS5leHBvcnRzLlN0b3JlID0gU3RvcmU7XG4iLCJ2YXIganNvbiAgICAgICAgICAgICA9IHJlcXVpcmUoJ2pzb24nKVxuICAsIHN0b3JlICAgICAgICAgICAgPSB7fVxuICAsIHdpbiAgICAgICAgICAgICAgPSB3aW5kb3dcblx0LFx0ZG9jICAgICAgICAgICAgICA9IHdpbi5kb2N1bWVudFxuXHQsXHRsb2NhbFN0b3JhZ2VOYW1lID0gJ2xvY2FsU3RvcmFnZSdcblx0LFx0bmFtZXNwYWNlICAgICAgICA9ICdfX3N0b3JlanNfXydcblx0LFx0c3RvcmFnZTtcblxuc3RvcmUuZGlzYWJsZWQgPSBmYWxzZVxuc3RvcmUuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge31cbnN0b3JlLmdldCA9IGZ1bmN0aW9uKGtleSkge31cbnN0b3JlLnJlbW92ZSA9IGZ1bmN0aW9uKGtleSkge31cbnN0b3JlLmNsZWFyID0gZnVuY3Rpb24oKSB7fVxuc3RvcmUudHJhbnNhY3QgPSBmdW5jdGlvbihrZXksIGRlZmF1bHRWYWwsIHRyYW5zYWN0aW9uRm4pIHtcblx0dmFyIHZhbCA9IHN0b3JlLmdldChrZXkpXG5cdGlmICh0cmFuc2FjdGlvbkZuID09IG51bGwpIHtcblx0XHR0cmFuc2FjdGlvbkZuID0gZGVmYXVsdFZhbFxuXHRcdGRlZmF1bHRWYWwgPSBudWxsXG5cdH1cblx0aWYgKHR5cGVvZiB2YWwgPT0gJ3VuZGVmaW5lZCcpIHsgdmFsID0gZGVmYXVsdFZhbCB8fCB7fSB9XG5cdHRyYW5zYWN0aW9uRm4odmFsKVxuXHRzdG9yZS5zZXQoa2V5LCB2YWwpXG59XG5zdG9yZS5nZXRBbGwgPSBmdW5jdGlvbigpIHt9XG5cbnN0b3JlLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHJldHVybiBqc29uLnN0cmluZ2lmeSh2YWx1ZSlcbn1cbnN0b3JlLmRlc2VyaWFsaXplID0gZnVuY3Rpb24odmFsdWUpIHtcblx0aWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgeyByZXR1cm4gdW5kZWZpbmVkIH1cblx0dHJ5IHsgcmV0dXJuIGpzb24ucGFyc2UodmFsdWUpIH1cblx0Y2F0Y2goZSkgeyByZXR1cm4gdmFsdWUgfHwgdW5kZWZpbmVkIH1cbn1cblxuLy8gRnVuY3Rpb25zIHRvIGVuY2Fwc3VsYXRlIHF1ZXN0aW9uYWJsZSBGaXJlRm94IDMuNi4xMyBiZWhhdmlvclxuLy8gd2hlbiBhYm91dC5jb25maWc6OmRvbS5zdG9yYWdlLmVuYWJsZWQgPT09IGZhbHNlXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21hcmN1c3dlc3Rpbi9zdG9yZS5qcy9pc3N1ZXMjaXNzdWUvMTNcbmZ1bmN0aW9uIGlzTG9jYWxTdG9yYWdlTmFtZVN1cHBvcnRlZCgpIHtcblx0dHJ5IHsgcmV0dXJuIChsb2NhbFN0b3JhZ2VOYW1lIGluIHdpbiAmJiB3aW5bbG9jYWxTdG9yYWdlTmFtZV0pIH1cblx0Y2F0Y2goZXJyKSB7IHJldHVybiBmYWxzZSB9XG59XG5cbmlmIChpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSkge1xuXHRzdG9yYWdlID0gd2luW2xvY2FsU3RvcmFnZU5hbWVdXG5cdHN0b3JlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0aWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KSB9XG5cdFx0c3RvcmFnZS5zZXRJdGVtKGtleSwgc3RvcmUuc2VyaWFsaXplKHZhbCkpXG5cdFx0cmV0dXJuIHZhbFxuXHR9XG5cdHN0b3JlLmdldCA9IGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRJdGVtKGtleSkpIH1cblx0c3RvcmUucmVtb3ZlID0gZnVuY3Rpb24oa2V5KSB7IHN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpIH1cblx0c3RvcmUuY2xlYXIgPSBmdW5jdGlvbigpIHsgc3RvcmFnZS5jbGVhcigpIH1cblx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJldCA9IHt9XG5cdFx0Zm9yICh2YXIgaT0wOyBpPHN0b3JhZ2UubGVuZ3RoOyArK2kpIHtcblx0XHRcdHZhciBrZXkgPSBzdG9yYWdlLmtleShpKVxuXHRcdFx0cmV0W2tleV0gPSBzdG9yZS5nZXQoa2V5KVxuXHRcdH1cblx0XHRyZXR1cm4gcmV0XG5cdH1cbn0gZWxzZSBpZiAoZG9jLmRvY3VtZW50RWxlbWVudC5hZGRCZWhhdmlvcikge1xuXHR2YXIgc3RvcmFnZU93bmVyLFxuXHRcdHN0b3JhZ2VDb250YWluZXJcblx0Ly8gU2luY2UgI3VzZXJEYXRhIHN0b3JhZ2UgYXBwbGllcyBvbmx5IHRvIHNwZWNpZmljIHBhdGhzLCB3ZSBuZWVkIHRvXG5cdC8vIHNvbWVob3cgbGluayBvdXIgZGF0YSB0byBhIHNwZWNpZmljIHBhdGguICBXZSBjaG9vc2UgL2Zhdmljb24uaWNvXG5cdC8vIGFzIGEgcHJldHR5IHNhZmUgb3B0aW9uLCBzaW5jZSBhbGwgYnJvd3NlcnMgYWxyZWFkeSBtYWtlIGEgcmVxdWVzdCB0b1xuXHQvLyB0aGlzIFVSTCBhbnl3YXkgYW5kIGJlaW5nIGEgNDA0IHdpbGwgbm90IGh1cnQgdXMgaGVyZS4gIFdlIHdyYXAgYW5cblx0Ly8gaWZyYW1lIHBvaW50aW5nIHRvIHRoZSBmYXZpY29uIGluIGFuIEFjdGl2ZVhPYmplY3QoaHRtbGZpbGUpIG9iamVjdFxuXHQvLyAoc2VlOiBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvYWE3NTI1NzQodj1WUy44NSkuYXNweClcblx0Ly8gc2luY2UgdGhlIGlmcmFtZSBhY2Nlc3MgcnVsZXMgYXBwZWFyIHRvIGFsbG93IGRpcmVjdCBhY2Nlc3MgYW5kXG5cdC8vIG1hbmlwdWxhdGlvbiBvZiB0aGUgZG9jdW1lbnQgZWxlbWVudCwgZXZlbiBmb3IgYSA0MDQgcGFnZS4gIFRoaXNcblx0Ly8gZG9jdW1lbnQgY2FuIGJlIHVzZWQgaW5zdGVhZCBvZiB0aGUgY3VycmVudCBkb2N1bWVudCAod2hpY2ggd291bGRcblx0Ly8gaGF2ZSBiZWVuIGxpbWl0ZWQgdG8gdGhlIGN1cnJlbnQgcGF0aCkgdG8gcGVyZm9ybSAjdXNlckRhdGEgc3RvcmFnZS5cblx0dHJ5IHtcblx0XHRzdG9yYWdlQ29udGFpbmVyID0gbmV3IEFjdGl2ZVhPYmplY3QoJ2h0bWxmaWxlJylcblx0XHRzdG9yYWdlQ29udGFpbmVyLm9wZW4oKVxuXHRcdHN0b3JhZ2VDb250YWluZXIud3JpdGUoJzxzJyArICdjcmlwdD5kb2N1bWVudC53PXdpbmRvdzwvcycgKyAnY3JpcHQ+PGlmcmFtZSBzcmM9XCIvZmF2aWNvbi5pY29cIj48L2lmcmFtZT4nKVxuXHRcdHN0b3JhZ2VDb250YWluZXIuY2xvc2UoKVxuXHRcdHN0b3JhZ2VPd25lciA9IHN0b3JhZ2VDb250YWluZXIudy5mcmFtZXNbMF0uZG9jdW1lbnRcblx0XHRzdG9yYWdlID0gc3RvcmFnZU93bmVyLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdH0gY2F0Y2goZSkge1xuXHRcdC8vIHNvbWVob3cgQWN0aXZlWE9iamVjdCBpbnN0YW50aWF0aW9uIGZhaWxlZCAocGVyaGFwcyBzb21lIHNwZWNpYWxcblx0XHQvLyBzZWN1cml0eSBzZXR0aW5ncyBvciBvdGhlcndzZSksIGZhbGwgYmFjayB0byBwZXItcGF0aCBzdG9yYWdlXG5cdFx0c3RvcmFnZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXHRcdHN0b3JhZ2VPd25lciA9IGRvYy5ib2R5XG5cdH1cblx0ZnVuY3Rpb24gd2l0aElFU3RvcmFnZShzdG9yZUZ1bmN0aW9uKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApXG5cdFx0XHRhcmdzLnVuc2hpZnQoc3RvcmFnZSlcblx0XHRcdC8vIFNlZSBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzEwODEodj1WUy44NSkuYXNweFxuXHRcdFx0Ly8gYW5kIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzMTQyNCh2PVZTLjg1KS5hc3B4XG5cdFx0XHRzdG9yYWdlT3duZXIuYXBwZW5kQ2hpbGQoc3RvcmFnZSlcblx0XHRcdHN0b3JhZ2UuYWRkQmVoYXZpb3IoJyNkZWZhdWx0I3VzZXJEYXRhJylcblx0XHRcdHN0b3JhZ2UubG9hZChsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0dmFyIHJlc3VsdCA9IHN0b3JlRnVuY3Rpb24uYXBwbHkoc3RvcmUsIGFyZ3MpXG5cdFx0XHRzdG9yYWdlT3duZXIucmVtb3ZlQ2hpbGQoc3RvcmFnZSlcblx0XHRcdHJldHVybiByZXN1bHRcblx0XHR9XG5cdH1cblxuXHQvLyBJbiBJRTcsIGtleXMgbWF5IG5vdCBjb250YWluIHNwZWNpYWwgY2hhcnMuIFNlZSBhbGwgb2YgaHR0cHM6Ly9naXRodWIuY29tL21hcmN1c3dlc3Rpbi9zdG9yZS5qcy9pc3N1ZXMvNDBcblx0dmFyIGZvcmJpZGRlbkNoYXJzUmVnZXggPSBuZXcgUmVnRXhwKFwiWyFcXFwiIyQlJicoKSorLC9cXFxcXFxcXDo7PD0+P0BbXFxcXF1eYHt8fX5dXCIsIFwiZ1wiKVxuXHRmdW5jdGlvbiBpZUtleUZpeChrZXkpIHtcblx0XHRyZXR1cm4ga2V5LnJlcGxhY2UoZm9yYmlkZGVuQ2hhcnNSZWdleCwgJ19fXycpXG5cdH1cblx0c3RvcmUuc2V0ID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBrZXksIHZhbCkge1xuXHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRpZiAodmFsID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHN0b3JlLnJlbW92ZShrZXkpIH1cblx0XHRzdG9yYWdlLnNldEF0dHJpYnV0ZShrZXksIHN0b3JlLnNlcmlhbGl6ZSh2YWwpKVxuXHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdHJldHVybiB2YWxcblx0fSlcblx0c3RvcmUuZ2V0ID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBrZXkpIHtcblx0XHRrZXkgPSBpZUtleUZpeChrZXkpXG5cdFx0cmV0dXJuIHN0b3JlLmRlc2VyaWFsaXplKHN0b3JhZ2UuZ2V0QXR0cmlidXRlKGtleSkpXG5cdH0pXG5cdHN0b3JlLnJlbW92ZSA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwga2V5KSB7XG5cdFx0a2V5ID0gaWVLZXlGaXgoa2V5KVxuXHRcdHN0b3JhZ2UucmVtb3ZlQXR0cmlidXRlKGtleSlcblx0XHRzdG9yYWdlLnNhdmUobG9jYWxTdG9yYWdlTmFtZSlcblx0fSlcblx0c3RvcmUuY2xlYXIgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UpIHtcblx0XHR2YXIgYXR0cmlidXRlcyA9IHN0b3JhZ2UuWE1MRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmF0dHJpYnV0ZXNcblx0XHRzdG9yYWdlLmxvYWQobG9jYWxTdG9yYWdlTmFtZSlcblx0XHRmb3IgKHZhciBpPTAsIGF0dHI7IGF0dHI9YXR0cmlidXRlc1tpXTsgaSsrKSB7XG5cdFx0XHRzdG9yYWdlLnJlbW92ZUF0dHJpYnV0ZShhdHRyLm5hbWUpXG5cdFx0fVxuXHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHR9KVxuXHRzdG9yZS5nZXRBbGwgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UpIHtcblx0XHR2YXIgYXR0cmlidXRlcyA9IHN0b3JhZ2UuWE1MRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmF0dHJpYnV0ZXNcblx0XHR2YXIgcmV0ID0ge31cblx0XHRmb3IgKHZhciBpPTAsIGF0dHI7IGF0dHI9YXR0cmlidXRlc1tpXTsgKytpKSB7XG5cdFx0XHR2YXIga2V5ID0gaWVLZXlGaXgoYXR0ci5uYW1lKVxuXHRcdFx0cmV0W2F0dHIubmFtZV0gPSBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEF0dHJpYnV0ZShrZXkpKVxuXHRcdH1cblx0XHRyZXR1cm4gcmV0XG5cdH0pXG59XG5cbnRyeSB7XG5cdHN0b3JlLnNldChuYW1lc3BhY2UsIG5hbWVzcGFjZSlcblx0aWYgKHN0b3JlLmdldChuYW1lc3BhY2UpICE9IG5hbWVzcGFjZSkgeyBzdG9yZS5kaXNhYmxlZCA9IHRydWUgfVxuXHRzdG9yZS5yZW1vdmUobmFtZXNwYWNlKVxufSBjYXRjaChlKSB7XG5cdHN0b3JlLmRpc2FibGVkID0gdHJ1ZVxufVxuc3RvcmUuZW5hYmxlZCA9ICFzdG9yZS5kaXNhYmxlZFxuXG5tb2R1bGUuZXhwb3J0cyA9IHN0b3JlOyIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhLCBiKXtcbiAgdmFyIGZuID0gZnVuY3Rpb24oKXt9O1xuICBmbi5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcbiAgYS5wcm90b3R5cGUgPSBuZXcgZm47XG4gIGEucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gYTtcbn07IiwiXG52YXIgaXNFbXB0eSA9IHJlcXVpcmUoJ2lzLWVtcHR5Jyk7XG5cbnRyeSB7XG4gIHZhciB0eXBlT2YgPSByZXF1aXJlKCd0eXBlJyk7XG59IGNhdGNoIChlKSB7XG4gIHZhciB0eXBlT2YgPSByZXF1aXJlKCdjb21wb25lbnQtdHlwZScpO1xufVxuXG5cbi8qKlxuICogVHlwZXMuXG4gKi9cblxudmFyIHR5cGVzID0gW1xuICAnYXJndW1lbnRzJyxcbiAgJ2FycmF5JyxcbiAgJ2Jvb2xlYW4nLFxuICAnZGF0ZScsXG4gICdlbGVtZW50JyxcbiAgJ2Z1bmN0aW9uJyxcbiAgJ251bGwnLFxuICAnbnVtYmVyJyxcbiAgJ29iamVjdCcsXG4gICdyZWdleHAnLFxuICAnc3RyaW5nJyxcbiAgJ3VuZGVmaW5lZCdcbl07XG5cblxuLyoqXG4gKiBFeHBvc2UgdHlwZSBjaGVja2Vycy5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5mb3IgKHZhciBpID0gMCwgdHlwZTsgdHlwZSA9IHR5cGVzW2ldOyBpKyspIGV4cG9ydHNbdHlwZV0gPSBnZW5lcmF0ZSh0eXBlKTtcblxuXG4vKipcbiAqIEFkZCBhbGlhcyBmb3IgYGZ1bmN0aW9uYCBmb3Igb2xkIGJyb3dzZXJzLlxuICovXG5cbmV4cG9ydHMuZm4gPSBleHBvcnRzWydmdW5jdGlvbiddO1xuXG5cbi8qKlxuICogRXhwb3NlIGBlbXB0eWAgY2hlY2suXG4gKi9cblxuZXhwb3J0cy5lbXB0eSA9IGlzRW1wdHk7XG5cblxuLyoqXG4gKiBFeHBvc2UgYG5hbmAgY2hlY2suXG4gKi9cblxuZXhwb3J0cy5uYW4gPSBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiBleHBvcnRzLm51bWJlcih2YWwpICYmIHZhbCAhPSB2YWw7XG59O1xuXG5cbi8qKlxuICogR2VuZXJhdGUgYSB0eXBlIGNoZWNrZXIuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmZ1bmN0aW9uIGdlbmVyYXRlICh0eXBlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZSA9PT0gdHlwZU9mKHZhbHVlKTtcbiAgfTtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzTWV0YSAoZSkge1xuICAgIGlmIChlLm1ldGFLZXkgfHwgZS5hbHRLZXkgfHwgZS5jdHJsS2V5IHx8IGUuc2hpZnRLZXkpIHJldHVybiB0cnVlO1xuXG4gICAgLy8gTG9naWMgdGhhdCBoYW5kbGVzIGNoZWNrcyBmb3IgdGhlIG1pZGRsZSBtb3VzZSBidXR0b24sIGJhc2VkXG4gICAgLy8gb24gW2pRdWVyeV0oaHR0cHM6Ly9naXRodWIuY29tL2pxdWVyeS9qcXVlcnkvYmxvYi9tYXN0ZXIvc3JjL2V2ZW50LmpzI0w0NjYpLlxuICAgIHZhciB3aGljaCA9IGUud2hpY2gsIGJ1dHRvbiA9IGUuYnV0dG9uO1xuICAgIGlmICghd2hpY2ggJiYgYnV0dG9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAoIWJ1dHRvbiAmIDEpICYmICghYnV0dG9uICYgMikgJiYgKGJ1dHRvbiAmIDQpO1xuICAgIH0gZWxzZSBpZiAod2hpY2ggPT09IDIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn07IiwiXG4vKipcbiAqIEhPUCByZWYuXG4gKi9cblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogUmV0dXJuIG93biBrZXlzIGluIGBvYmpgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbihvYmope1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBrZXlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gb3duIHZhbHVlcyBpbiBgb2JqYC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy52YWx1ZXMgPSBmdW5jdGlvbihvYmope1xuICB2YXIgdmFscyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgdmFscy5wdXNoKG9ialtrZXldKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHM7XG59O1xuXG4vKipcbiAqIE1lcmdlIGBiYCBpbnRvIGBhYC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYVxuICogQHBhcmFtIHtPYmplY3R9IGJcbiAqIEByZXR1cm4ge09iamVjdH0gYVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLm1lcmdlID0gZnVuY3Rpb24oYSwgYil7XG4gIGZvciAodmFyIGtleSBpbiBiKSB7XG4gICAgaWYgKGhhcy5jYWxsKGIsIGtleSkpIHtcbiAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGE7XG59O1xuXG4vKipcbiAqIFJldHVybiBsZW5ndGggb2YgYG9iamAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmxlbmd0aCA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiBleHBvcnRzLmtleXMob2JqKS5sZW5ndGg7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGVtcHR5LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuaXNFbXB0eSA9IGZ1bmN0aW9uKG9iail7XG4gIHJldHVybiAwID09IGV4cG9ydHMubGVuZ3RoKG9iaik7XG59OyIsIlxuLyoqXG4gKiBNb2R1bGUgRGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ2FuYWx5dGljcy5qczpub3JtYWxpemUnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2RlZmF1bHRzJyk7XG52YXIgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcbnZhciBpbmNsdWRlcyA9IHJlcXVpcmUoJ2luY2x1ZGVzJyk7XG52YXIgaXMgPSByZXF1aXJlKCdpcycpO1xudmFyIG1hcCA9IHJlcXVpcmUoJ2NvbXBvbmVudC9tYXAnKTtcblxuLyoqXG4gKiBIT1AuXG4gKi9cblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogRXhwb3NlIGBub3JtYWxpemVgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBub3JtYWxpemU7XG5cbi8qKlxuICogVG9wbGV2ZWwgcHJvcGVydGllcy5cbiAqL1xuXG52YXIgdG9wbGV2ZWwgPSBbXG4gICdpbnRlZ3JhdGlvbnMnLFxuICAnYW5vbnltb3VzSWQnLFxuICAndGltZXN0YW1wJyxcbiAgJ2NvbnRleHQnXG5dO1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBgbXNnYCBiYXNlZCBvbiBpbnRlZ3JhdGlvbnMgYGxpc3RgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtc2dcbiAqIEBwYXJhbSB7QXJyYXl9IGxpc3RcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShtc2csIGxpc3Qpe1xuICB2YXIgbG93ZXIgPSBtYXAobGlzdCwgZnVuY3Rpb24ocyl7IHJldHVybiBzLnRvTG93ZXJDYXNlKCk7IH0pO1xuICB2YXIgb3B0cyA9IG1zZy5vcHRpb25zIHx8IHt9O1xuICB2YXIgaW50ZWdyYXRpb25zID0gb3B0cy5pbnRlZ3JhdGlvbnMgfHwge307XG4gIHZhciBwcm92aWRlcnMgPSBvcHRzLnByb3ZpZGVycyB8fCB7fTtcbiAgdmFyIGNvbnRleHQgPSBvcHRzLmNvbnRleHQgfHwge307XG4gIHZhciByZXQgPSB7fTtcbiAgZGVidWcoJzwtJywgbXNnKTtcblxuICAvLyBpbnRlZ3JhdGlvbnMuXG4gIGVhY2gob3B0cywgZnVuY3Rpb24oa2V5LCB2YWx1ZSl7XG4gICAgaWYgKCFpbnRlZ3JhdGlvbihrZXkpKSByZXR1cm47XG4gICAgaWYgKCFoYXMuY2FsbChpbnRlZ3JhdGlvbnMsIGtleSkpIGludGVncmF0aW9uc1trZXldID0gdmFsdWU7XG4gICAgZGVsZXRlIG9wdHNba2V5XTtcbiAgfSk7XG5cbiAgLy8gcHJvdmlkZXJzLlxuICBkZWxldGUgb3B0cy5wcm92aWRlcnM7XG4gIGVhY2gocHJvdmlkZXJzLCBmdW5jdGlvbihrZXksIHZhbHVlKXtcbiAgICBpZiAoIWludGVncmF0aW9uKGtleSkpIHJldHVybjtcbiAgICBpZiAoaXMub2JqZWN0KGludGVncmF0aW9uc1trZXldKSkgcmV0dXJuO1xuICAgIGlmIChoYXMuY2FsbChpbnRlZ3JhdGlvbnMsIGtleSkgJiYgdHlwZW9mIHByb3ZpZGVyc1trZXldID09PSAnYm9vbGVhbicpIHJldHVybjtcbiAgICBpbnRlZ3JhdGlvbnNba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBtb3ZlIGFsbCB0b3BsZXZlbCBvcHRpb25zIHRvIG1zZ1xuICAvLyBhbmQgdGhlIHJlc3QgdG8gY29udGV4dC5cbiAgZWFjaChvcHRzLCBmdW5jdGlvbihrZXkpe1xuICAgIGlmIChpbmNsdWRlcyhrZXksIHRvcGxldmVsKSkge1xuICAgICAgcmV0W2tleV0gPSBvcHRzW2tleV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHRba2V5XSA9IG9wdHNba2V5XTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIGNsZWFudXBcbiAgZGVsZXRlIG1zZy5vcHRpb25zO1xuICByZXQuaW50ZWdyYXRpb25zID0gaW50ZWdyYXRpb25zO1xuICByZXQuY29udGV4dCA9IGNvbnRleHQ7XG4gIHJldCA9IGRlZmF1bHRzKHJldCwgbXNnKTtcbiAgZGVidWcoJy0+JywgcmV0KTtcbiAgcmV0dXJuIHJldDtcblxuICBmdW5jdGlvbiBpbnRlZ3JhdGlvbihuYW1lKXtcbiAgICByZXR1cm4gISEoaW5jbHVkZXMobmFtZSwgbGlzdCkgfHwgbmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYWxsJyB8fCBpbmNsdWRlcyhuYW1lLnRvTG93ZXJDYXNlKCksIGxvd2VyKSk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbi8vIFhYWDogSGFja3kgZml4IGZvciBkdW8gbm90IHN1cHBvcnRpbmcgc2NvcGVkIG5wbSBwYWNrYWdlc1xudmFyIGVhY2g7IHRyeSB7IGVhY2ggPSByZXF1aXJlKCdAbmRob3VsZS9lYWNoJyk7IH0gY2F0Y2goZSkgeyBlYWNoID0gcmVxdWlyZSgnZWFjaCcpOyB9XG5cbi8qKlxuICogU3RyaW5nI2luZGV4T2YgcmVmZXJlbmNlLlxuICovXG5cbnZhciBzdHJJbmRleE9mID0gU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mO1xuXG4vKipcbiAqIE9iamVjdC5pcy9zYW1lVmFsdWVaZXJvIHBvbHlmaWxsLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZTFcbiAqIEBwYXJhbSB7Kn0gdmFsdWUyXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5cbi8vIFRPRE86IE1vdmUgdG8gbGlicmFyeVxudmFyIHNhbWVWYWx1ZVplcm8gPSBmdW5jdGlvbiBzYW1lVmFsdWVaZXJvKHZhbHVlMSwgdmFsdWUyKSB7XG4gIC8vIE5vcm1hbCB2YWx1ZXMgYW5kIGNoZWNrIGZvciAwIC8gLTBcbiAgaWYgKHZhbHVlMSA9PT0gdmFsdWUyKSB7XG4gICAgcmV0dXJuIHZhbHVlMSAhPT0gMCB8fCAxIC8gdmFsdWUxID09PSAxIC8gdmFsdWUyO1xuICB9XG4gIC8vIE5hTlxuICByZXR1cm4gdmFsdWUxICE9PSB2YWx1ZTEgJiYgdmFsdWUyICE9PSB2YWx1ZTI7XG59O1xuXG4vKipcbiAqIFNlYXJjaGVzIGEgZ2l2ZW4gYGNvbGxlY3Rpb25gIGZvciBhIHZhbHVlLCByZXR1cm5pbmcgdHJ1ZSBpZiB0aGUgY29sbGVjdGlvblxuICogY29udGFpbnMgdGhlIHZhbHVlIGFuZCBmYWxzZSBvdGhlcndpc2UuIENhbiBzZWFyY2ggc3RyaW5ncywgYXJyYXlzLCBhbmRcbiAqIG9iamVjdHMuXG4gKlxuICogQG5hbWUgaW5jbHVkZXNcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0geyp9IHNlYXJjaEVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc2VhcmNoIGZvci5cbiAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBzZWFyY2guXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICogQGV4YW1wbGVcbiAqIGluY2x1ZGVzKDIsIFsxLCAyLCAzXSk7XG4gKiAvLz0+IHRydWVcbiAqXG4gKiBpbmNsdWRlcyg0LCBbMSwgMiwgM10pO1xuICogLy89PiBmYWxzZVxuICpcbiAqIGluY2x1ZGVzKDIsIHsgYTogMSwgYjogMiwgYzogMyB9KTtcbiAqIC8vPT4gdHJ1ZVxuICpcbiAqIGluY2x1ZGVzKCdhJywgeyBhOiAxLCBiOiAyLCBjOiAzIH0pO1xuICogLy89PiBmYWxzZVxuICpcbiAqIGluY2x1ZGVzKCdhYmMnLCAneHl6YWJjIG9wcScpO1xuICogLy89PiB0cnVlXG4gKlxuICogaW5jbHVkZXMoJ25vcGUnLCAneHl6YWJjIG9wcScpO1xuICogLy89PiBmYWxzZVxuICovXG52YXIgaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyhzZWFyY2hFbGVtZW50LCBjb2xsZWN0aW9uKSB7XG4gIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gIC8vIERlbGVnYXRlIHRvIFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZiB3aGVuIGBjb2xsZWN0aW9uYCBpcyBhIHN0cmluZ1xuICBpZiAodHlwZW9mIGNvbGxlY3Rpb24gPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHN0ckluZGV4T2YuY2FsbChjb2xsZWN0aW9uLCBzZWFyY2hFbGVtZW50KSAhPT0gLTE7XG4gIH1cblxuICAvLyBJdGVyYXRlIHRocm91Z2ggZW51bWVyYWJsZS9vd24gYXJyYXkgZWxlbWVudHMgYW5kIG9iamVjdCBwcm9wZXJ0aWVzLlxuICBlYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKHNhbWVWYWx1ZVplcm8odmFsdWUsIHNlYXJjaEVsZW1lbnQpKSB7XG4gICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAvLyBFeGl0IGl0ZXJhdGlvbiBlYXJseSB3aGVuIGZvdW5kXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LCBjb2xsZWN0aW9uKTtcblxuICByZXR1cm4gZm91bmQ7XG59O1xuXG4vKipcbiAqIEV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBpbmNsdWRlcztcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0b0Z1bmN0aW9uID0gcmVxdWlyZSgndG8tZnVuY3Rpb24nKTtcblxuLyoqXG4gKiBNYXAgdGhlIGdpdmVuIGBhcnJgIHdpdGggY2FsbGJhY2sgYGZuKHZhbCwgaSlgLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgZm4pe1xuICB2YXIgcmV0ID0gW107XG4gIGZuID0gdG9GdW5jdGlvbihmbik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgcmV0LnB1c2goZm4oYXJyW2ldLCBpKSk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn07IiwiXG4vKipcbiAqIE1vZHVsZSBEZXBlbmRlbmNpZXNcbiAqL1xuXG52YXIgZXhwcjtcbnRyeSB7XG4gIGV4cHIgPSByZXF1aXJlKCdwcm9wcycpO1xufSBjYXRjaChlKSB7XG4gIGV4cHIgPSByZXF1aXJlKCdjb21wb25lbnQtcHJvcHMnKTtcbn1cblxuLyoqXG4gKiBFeHBvc2UgYHRvRnVuY3Rpb24oKWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB0b0Z1bmN0aW9uO1xuXG4vKipcbiAqIENvbnZlcnQgYG9iamAgdG8gYSBgRnVuY3Rpb25gLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IG9ialxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiB0b0Z1bmN0aW9uKG9iaikge1xuICBzd2l0Y2ggKHt9LnRvU3RyaW5nLmNhbGwob2JqKSkge1xuICAgIGNhc2UgJ1tvYmplY3QgT2JqZWN0XSc6XG4gICAgICByZXR1cm4gb2JqZWN0VG9GdW5jdGlvbihvYmopO1xuICAgIGNhc2UgJ1tvYmplY3QgRnVuY3Rpb25dJzpcbiAgICAgIHJldHVybiBvYmo7XG4gICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgIHJldHVybiBzdHJpbmdUb0Z1bmN0aW9uKG9iaik7XG4gICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzpcbiAgICAgIHJldHVybiByZWdleHBUb0Z1bmN0aW9uKG9iaik7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkZWZhdWx0VG9GdW5jdGlvbihvYmopO1xuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCB0byBzdHJpY3QgZXF1YWxpdHkuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGRlZmF1bHRUb0Z1bmN0aW9uKHZhbCkge1xuICByZXR1cm4gZnVuY3Rpb24ob2JqKXtcbiAgICByZXR1cm4gdmFsID09PSBvYmo7XG4gIH07XG59XG5cbi8qKlxuICogQ29udmVydCBgcmVgIHRvIGEgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtSZWdFeHB9IHJlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHJlZ2V4cFRvRnVuY3Rpb24ocmUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iail7XG4gICAgcmV0dXJuIHJlLnRlc3Qob2JqKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IHByb3BlcnR5IGBzdHJgIHRvIGEgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzdHJpbmdUb0Z1bmN0aW9uKHN0cikge1xuICAvLyBpbW1lZGlhdGUgc3VjaCBhcyBcIj4gMjBcIlxuICBpZiAoL14gKlxcVysvLnRlc3Qoc3RyKSkgcmV0dXJuIG5ldyBGdW5jdGlvbignXycsICdyZXR1cm4gXyAnICsgc3RyKTtcblxuICAvLyBwcm9wZXJ0aWVzIHN1Y2ggYXMgXCJuYW1lLmZpcnN0XCIgb3IgXCJhZ2UgPiAxOFwiIG9yIFwiYWdlID4gMTggJiYgYWdlIDwgMzZcIlxuICByZXR1cm4gbmV3IEZ1bmN0aW9uKCdfJywgJ3JldHVybiAnICsgZ2V0KHN0cikpO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYG9iamVjdGAgdG8gYSBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG9iamVjdFRvRnVuY3Rpb24ob2JqKSB7XG4gIHZhciBtYXRjaCA9IHt9O1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgbWF0Y2hba2V5XSA9IHR5cGVvZiBvYmpba2V5XSA9PT0gJ3N0cmluZydcbiAgICAgID8gZGVmYXVsdFRvRnVuY3Rpb24ob2JqW2tleV0pXG4gICAgICA6IHRvRnVuY3Rpb24ob2JqW2tleV0pO1xuICB9XG4gIHJldHVybiBmdW5jdGlvbih2YWwpe1xuICAgIGlmICh0eXBlb2YgdmFsICE9PSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAodmFyIGtleSBpbiBtYXRjaCkge1xuICAgICAgaWYgKCEoa2V5IGluIHZhbCkpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICghbWF0Y2hba2V5XSh2YWxba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbi8qKlxuICogQnVpbHQgdGhlIGdldHRlciBmdW5jdGlvbi4gU3VwcG9ydHMgZ2V0dGVyIHN0eWxlIGZ1bmN0aW9uc1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGdldChzdHIpIHtcbiAgdmFyIHByb3BzID0gZXhwcihzdHIpO1xuICBpZiAoIXByb3BzLmxlbmd0aCkgcmV0dXJuICdfLicgKyBzdHI7XG5cbiAgdmFyIHZhbCwgaSwgcHJvcDtcbiAgZm9yIChpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgcHJvcCA9IHByb3BzW2ldO1xuICAgIHZhbCA9ICdfLicgKyBwcm9wO1xuICAgIHZhbCA9IFwiKCdmdW5jdGlvbicgPT0gdHlwZW9mIFwiICsgdmFsICsgXCIgPyBcIiArIHZhbCArIFwiKCkgOiBcIiArIHZhbCArIFwiKVwiO1xuXG4gICAgLy8gbWltaWMgbmVnYXRpdmUgbG9va2JlaGluZCB0byBhdm9pZCBwcm9ibGVtcyB3aXRoIG5lc3RlZCBwcm9wZXJ0aWVzXG4gICAgc3RyID0gc3RyaXBOZXN0ZWQocHJvcCwgc3RyLCB2YWwpO1xuICB9XG5cbiAgcmV0dXJuIHN0cjtcbn1cblxuLyoqXG4gKiBNaW1pYyBuZWdhdGl2ZSBsb29rYmVoaW5kIHRvIGF2b2lkIHByb2JsZW1zIHdpdGggbmVzdGVkIHByb3BlcnRpZXMuXG4gKlxuICogU2VlOiBodHRwOi8vYmxvZy5zdGV2ZW5sZXZpdGhhbi5jb20vYXJjaGl2ZXMvbWltaWMtbG9va2JlaGluZC1qYXZhc2NyaXB0XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHByb3BcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHN0cmlwTmVzdGVkIChwcm9wLCBzdHIsIHZhbCkge1xuICByZXR1cm4gc3RyLnJlcGxhY2UobmV3IFJlZ0V4cCgnKFxcXFwuKT8nICsgcHJvcCwgJ2cnKSwgZnVuY3Rpb24oJDAsICQxKSB7XG4gICAgcmV0dXJuICQxID8gJDAgOiB2YWw7XG4gIH0pO1xufVxuIiwiLyoqXG4gKiBHbG9iYWwgTmFtZXNcbiAqL1xuXG52YXIgZ2xvYmFscyA9IC9cXGIodGhpc3xBcnJheXxEYXRlfE9iamVjdHxNYXRofEpTT04pXFxiL2c7XG5cbi8qKlxuICogUmV0dXJuIGltbWVkaWF0ZSBpZGVudGlmaWVycyBwYXJzZWQgZnJvbSBgc3RyYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gbWFwIGZ1bmN0aW9uIG9yIHByZWZpeFxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyLCBmbil7XG4gIHZhciBwID0gdW5pcXVlKHByb3BzKHN0cikpO1xuICBpZiAoZm4gJiYgJ3N0cmluZycgPT0gdHlwZW9mIGZuKSBmbiA9IHByZWZpeGVkKGZuKTtcbiAgaWYgKGZuKSByZXR1cm4gbWFwKHN0ciwgcCwgZm4pO1xuICByZXR1cm4gcDtcbn07XG5cbi8qKlxuICogUmV0dXJuIGltbWVkaWF0ZSBpZGVudGlmaWVycyBpbiBgc3RyYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHByb3BzKHN0cikge1xuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoL1xcLlxcdyt8XFx3KyAqXFwofFwiW15cIl0qXCJ8J1teJ10qJ3xcXC8oW14vXSspXFwvL2csICcnKVxuICAgIC5yZXBsYWNlKGdsb2JhbHMsICcnKVxuICAgIC5tYXRjaCgvWyRhLXpBLVpfXVxcdyovZylcbiAgICB8fCBbXTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYHN0cmAgd2l0aCBgcHJvcHNgIG1hcHBlZCB3aXRoIGBmbmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHBhcmFtIHtBcnJheX0gcHJvcHNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtYXAoc3RyLCBwcm9wcywgZm4pIHtcbiAgdmFyIHJlID0gL1xcLlxcdyt8XFx3KyAqXFwofFwiW15cIl0qXCJ8J1teJ10qJ3xcXC8oW14vXSspXFwvfFthLXpBLVpfXVxcdyovZztcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKHJlLCBmdW5jdGlvbihfKXtcbiAgICBpZiAoJygnID09IF9bXy5sZW5ndGggLSAxXSkgcmV0dXJuIGZuKF8pO1xuICAgIGlmICghfnByb3BzLmluZGV4T2YoXykpIHJldHVybiBfO1xuICAgIHJldHVybiBmbihfKTtcbiAgfSk7XG59XG5cbi8qKlxuICogUmV0dXJuIHVuaXF1ZSBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gdW5pcXVlKGFycikge1xuICB2YXIgcmV0ID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAofnJldC5pbmRleE9mKGFycltpXSkpIGNvbnRpbnVlO1xuICAgIHJldC5wdXNoKGFycltpXSk7XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIE1hcCB3aXRoIHByZWZpeCBgc3RyYC5cbiAqL1xuXG5mdW5jdGlvbiBwcmVmaXhlZChzdHIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKF8pe1xuICAgIHJldHVybiBzdHIgKyBfO1xuICB9O1xufVxuIiwiXG4vKipcbiAqIEJpbmQgYGVsYCBldmVudCBgdHlwZWAgdG8gYGZuYC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gY2FwdHVyZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuYmluZCA9IGZ1bmN0aW9uKGVsLCB0eXBlLCBmbiwgY2FwdHVyZSl7XG4gIGlmIChlbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyZSB8fCBmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgZWwuYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGZuKTtcbiAgfVxuICByZXR1cm4gZm47XG59O1xuXG4vKipcbiAqIFVuYmluZCBgZWxgIGV2ZW50IGB0eXBlYCdzIGNhbGxiYWNrIGBmbmAuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGNhcHR1cmVcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnVuYmluZCA9IGZ1bmN0aW9uKGVsLCB0eXBlLCBmbiwgY2FwdHVyZSl7XG4gIGlmIChlbC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyZSB8fCBmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGZuKTtcbiAgfVxuICByZXR1cm4gZm47XG59O1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGNhbm9uaWNhbCA9IHJlcXVpcmUoJ2Nhbm9uaWNhbCcpO1xudmFyIGluY2x1ZGVzID0gcmVxdWlyZSgnaW5jbHVkZXMnKTtcbnZhciB1cmwgPSByZXF1aXJlKCd1cmwnKTtcblxuLyoqXG4gKiBSZXR1cm4gYSBkZWZhdWx0IGBvcHRpb25zLmNvbnRleHQucGFnZWAgb2JqZWN0LlxuICpcbiAqIGh0dHBzOi8vc2VnbWVudC5jb20vZG9jcy9zcGVjL3BhZ2UvI3Byb3BlcnRpZXNcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuZnVuY3Rpb24gcGFnZURlZmF1bHRzKCkge1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGNhbm9uaWNhbFBhdGgoKSxcbiAgICByZWZlcnJlcjogZG9jdW1lbnQucmVmZXJyZXIsXG4gICAgc2VhcmNoOiBsb2NhdGlvbi5zZWFyY2gsXG4gICAgdGl0bGU6IGRvY3VtZW50LnRpdGxlLFxuICAgIHVybDogY2Fub25pY2FsVXJsKGxvY2F0aW9uLnNlYXJjaClcbiAgfTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGNhbm9uaWNhbCBwYXRoIGZvciB0aGUgcGFnZS5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gY2Fub25pY2FsUGF0aCgpIHtcbiAgdmFyIGNhbm9uID0gY2Fub25pY2FsKCk7XG4gIGlmICghY2Fub24pIHJldHVybiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gIHZhciBwYXJzZWQgPSB1cmwucGFyc2UoY2Fub24pO1xuICByZXR1cm4gcGFyc2VkLnBhdGhuYW1lO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgY2Fub25pY2FsIFVSTCBmb3IgdGhlIHBhZ2UgY29uY2F0IHRoZSBnaXZlbiBgc2VhcmNoYFxuICogYW5kIHN0cmlwIHRoZSBoYXNoLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWFyY2hcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiBjYW5vbmljYWxVcmwoc2VhcmNoKSB7XG4gIHZhciBjYW5vbiA9IGNhbm9uaWNhbCgpO1xuICBpZiAoY2Fub24pIHJldHVybiBpbmNsdWRlcygnPycsIGNhbm9uKSA/IGNhbm9uIDogY2Fub24gKyBzZWFyY2g7XG4gIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgdmFyIGkgPSB1cmwuaW5kZXhPZignIycpO1xuICByZXR1cm4gaSA9PT0gLTEgPyB1cmwgOiB1cmwuc2xpY2UoMCwgaSk7XG59XG5cbi8qKlxuICogRXhwb3J0cy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhZ2VEZWZhdWx0cztcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2Fub25pY2FsICgpIHtcbiAgdmFyIHRhZ3MgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGluaycpO1xuICBmb3IgKHZhciBpID0gMCwgdGFnOyB0YWcgPSB0YWdzW2ldOyBpKyspIHtcbiAgICBpZiAoJ2Nhbm9uaWNhbCcgPT0gdGFnLmdldEF0dHJpYnV0ZSgncmVsJykpIHJldHVybiB0YWcuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gIH1cbn07IiwiXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgdXJsYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbih1cmwpe1xuICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgYS5ocmVmID0gdXJsO1xuICByZXR1cm4ge1xuICAgIGhyZWY6IGEuaHJlZixcbiAgICBob3N0OiBhLmhvc3QgfHwgbG9jYXRpb24uaG9zdCxcbiAgICBwb3J0OiAoJzAnID09PSBhLnBvcnQgfHwgJycgPT09IGEucG9ydCkgPyBwb3J0KGEucHJvdG9jb2wpIDogYS5wb3J0LFxuICAgIGhhc2g6IGEuaGFzaCxcbiAgICBob3N0bmFtZTogYS5ob3N0bmFtZSB8fCBsb2NhdGlvbi5ob3N0bmFtZSxcbiAgICBwYXRobmFtZTogYS5wYXRobmFtZS5jaGFyQXQoMCkgIT0gJy8nID8gJy8nICsgYS5wYXRobmFtZSA6IGEucGF0aG5hbWUsXG4gICAgcHJvdG9jb2w6ICFhLnByb3RvY29sIHx8ICc6JyA9PSBhLnByb3RvY29sID8gbG9jYXRpb24ucHJvdG9jb2wgOiBhLnByb3RvY29sLFxuICAgIHNlYXJjaDogYS5zZWFyY2gsXG4gICAgcXVlcnk6IGEuc2VhcmNoLnNsaWNlKDEpXG4gIH07XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGB1cmxgIGlzIGFic29sdXRlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHVybCl7XG4gIHJldHVybiAwID09IHVybC5pbmRleE9mKCcvLycpIHx8ICEhfnVybC5pbmRleE9mKCc6Ly8nKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYHVybGAgaXMgcmVsYXRpdmUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5pc1JlbGF0aXZlID0gZnVuY3Rpb24odXJsKXtcbiAgcmV0dXJuICFleHBvcnRzLmlzQWJzb2x1dGUodXJsKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYHVybGAgaXMgY3Jvc3MgZG9tYWluLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuaXNDcm9zc0RvbWFpbiA9IGZ1bmN0aW9uKHVybCl7XG4gIHVybCA9IGV4cG9ydHMucGFyc2UodXJsKTtcbiAgdmFyIGxvY2F0aW9uID0gZXhwb3J0cy5wYXJzZSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gIHJldHVybiB1cmwuaG9zdG5hbWUgIT09IGxvY2F0aW9uLmhvc3RuYW1lXG4gICAgfHwgdXJsLnBvcnQgIT09IGxvY2F0aW9uLnBvcnRcbiAgICB8fCB1cmwucHJvdG9jb2wgIT09IGxvY2F0aW9uLnByb3RvY29sO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gZGVmYXVsdCBwb3J0IGZvciBgcHJvdG9jb2xgLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gcHJvdG9jb2xcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBwb3J0IChwcm90b2NvbCl7XG4gIHN3aXRjaCAocHJvdG9jb2wpIHtcbiAgICBjYXNlICdodHRwOic6XG4gICAgICByZXR1cm4gODA7XG4gICAgY2FzZSAnaHR0cHM6JzpcbiAgICAgIHJldHVybiA0NDM7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBsb2NhdGlvbi5wb3J0O1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBvYmpUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8vIFRPRE86IE1vdmUgdG8gbGliXG52YXIgZXhpc3R5ID0gZnVuY3Rpb24odmFsKSB7XG4gIHJldHVybiB2YWwgIT0gbnVsbDtcbn07XG5cbi8vIFRPRE86IE1vdmUgdG8gbGliXG52YXIgaXNBcnJheSA9IGZ1bmN0aW9uKHZhbCkge1xuICByZXR1cm4gb2JqVG9TdHJpbmcuY2FsbCh2YWwpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxuLy8gVE9ETzogTW92ZSB0byBsaWJcbnZhciBpc1N0cmluZyA9IGZ1bmN0aW9uKHZhbCkge1xuICAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnIHx8IG9ialRvU3RyaW5nLmNhbGwodmFsKSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7XG59O1xuXG4vLyBUT0RPOiBNb3ZlIHRvIGxpYlxudmFyIGlzT2JqZWN0ID0gZnVuY3Rpb24odmFsKSB7XG4gIHJldHVybiB2YWwgIT0gbnVsbCAmJiB0eXBlb2YgdmFsID09PSAnb2JqZWN0Jztcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIGNvcHkgb2YgdGhlIG5ldyBgb2JqZWN0YCBjb250YWluaW5nIG9ubHkgdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzLlxuICpcbiAqIEBuYW1lIHBpY2tcbiAqIEBhcGkgcHVibGljXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAc2VlIHtAbGluayBvbWl0fVxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPnxzdHJpbmd9IHByb3BzIFRoZSBwcm9wZXJ0eSBvciBwcm9wZXJ0aWVzIHRvIGtlZXAuXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHJldHVybiB7T2JqZWN0fSBBIG5ldyBvYmplY3QgY29udGFpbmluZyBvbmx5IHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBmcm9tIGBvYmplY3RgLlxuICogQGV4YW1wbGVcbiAqIHZhciBwZXJzb24gPSB7IG5hbWU6ICdUaW0nLCBvY2N1cGF0aW9uOiAnZW5jaGFudGVyJywgZmVhcnM6ICdyYWJiaXRzJyB9O1xuICpcbiAqIHBpY2soJ25hbWUnLCBwZXJzb24pO1xuICogLy89PiB7IG5hbWU6ICdUaW0nIH1cbiAqXG4gKiBwaWNrKFsnbmFtZScsICdmZWFycyddLCBwZXJzb24pO1xuICogLy89PiB7IG5hbWU6ICdUaW0nLCBmZWFyczogJ3JhYmJpdHMnIH1cbiAqL1xuXG52YXIgcGljayA9IGZ1bmN0aW9uIHBpY2socHJvcHMsIG9iamVjdCkge1xuICBpZiAoIWV4aXN0eShvYmplY3QpIHx8ICFpc09iamVjdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgaWYgKGlzU3RyaW5nKHByb3BzKSkge1xuICAgIHByb3BzID0gW3Byb3BzXTtcbiAgfVxuXG4gIGlmICghaXNBcnJheShwcm9wcykpIHtcbiAgICBwcm9wcyA9IFtdO1xuICB9XG5cbiAgdmFyIHJlc3VsdCA9IHt9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBpZiAoaXNTdHJpbmcocHJvcHNbaV0pICYmIHByb3BzW2ldIGluIG9iamVjdCkge1xuICAgICAgcmVzdWx0W3Byb3BzW2ldXSA9IG9iamVjdFtwcm9wc1tpXV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogRXhwb3J0cy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBpY2s7XG4iLCJcbi8qKlxuICogcHJldmVudCBkZWZhdWx0IG9uIHRoZSBnaXZlbiBgZWAuXG4gKiBcbiAqIGV4YW1wbGVzOlxuICogXG4gKiAgICAgIGFuY2hvci5vbmNsaWNrID0gcHJldmVudDtcbiAqICAgICAgYW5jaG9yLm9uY2xpY2sgPSBmdW5jdGlvbihlKXtcbiAqICAgICAgICBpZiAoc29tZXRoaW5nKSByZXR1cm4gcHJldmVudChlKTtcbiAqICAgICAgfTtcbiAqIFxuICogQHBhcmFtIHtFdmVudH0gZVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZSl7XG4gIGUgPSBlIHx8IHdpbmRvdy5ldmVudFxuICByZXR1cm4gZS5wcmV2ZW50RGVmYXVsdFxuICAgID8gZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgOiBlLnJldHVyblZhbHVlID0gZmFsc2U7XG59O1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIHRyaW0gPSByZXF1aXJlKCd0cmltJyk7XG52YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcblxudmFyIHBhdHRlcm4gPSAvKFxcdyspXFxbKFxcZCspXFxdL1xuXG4vKipcbiAqIFNhZmVseSBlbmNvZGUgdGhlIGdpdmVuIHN0cmluZ1xuICogXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG52YXIgZW5jb2RlID0gZnVuY3Rpb24oc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzdHIpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufTtcblxuLyoqXG4gKiBTYWZlbHkgZGVjb2RlIHRoZSBzdHJpbmdcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxudmFyIGRlY29kZSA9IGZ1bmN0aW9uKHN0cikge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gcXVlcnkgYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24oc3RyKXtcbiAgaWYgKCdzdHJpbmcnICE9IHR5cGVvZiBzdHIpIHJldHVybiB7fTtcblxuICBzdHIgPSB0cmltKHN0cik7XG4gIGlmICgnJyA9PSBzdHIpIHJldHVybiB7fTtcbiAgaWYgKCc/JyA9PSBzdHIuY2hhckF0KDApKSBzdHIgPSBzdHIuc2xpY2UoMSk7XG5cbiAgdmFyIG9iaiA9IHt9O1xuICB2YXIgcGFpcnMgPSBzdHIuc3BsaXQoJyYnKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWlycy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBwYXJ0cyA9IHBhaXJzW2ldLnNwbGl0KCc9Jyk7XG4gICAgdmFyIGtleSA9IGRlY29kZShwYXJ0c1swXSk7XG4gICAgdmFyIG07XG5cbiAgICBpZiAobSA9IHBhdHRlcm4uZXhlYyhrZXkpKSB7XG4gICAgICBvYmpbbVsxXV0gPSBvYmpbbVsxXV0gfHwgW107XG4gICAgICBvYmpbbVsxXV1bbVsyXV0gPSBkZWNvZGUocGFydHNbMV0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgb2JqW3BhcnRzWzBdXSA9IG51bGwgPT0gcGFydHNbMV1cbiAgICAgID8gJydcbiAgICAgIDogZGVjb2RlKHBhcnRzWzFdKTtcbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuXG4vKipcbiAqIFN0cmluZ2lmeSB0aGUgZ2l2ZW4gYG9iamAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKG9iail7XG4gIGlmICghb2JqKSByZXR1cm4gJyc7XG4gIHZhciBwYWlycyA9IFtdO1xuXG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICB2YXIgdmFsdWUgPSBvYmpba2V5XTtcblxuICAgIGlmICgnYXJyYXknID09IHR5cGUodmFsdWUpKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHBhaXJzLnB1c2goZW5jb2RlKGtleSArICdbJyArIGkgKyAnXScpICsgJz0nICsgZW5jb2RlKHZhbHVlW2ldKSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBwYWlycy5wdXNoKGVuY29kZShrZXkpICsgJz0nICsgZW5jb2RlKG9ialtrZXldKSk7XG4gIH1cblxuICByZXR1cm4gcGFpcnMuam9pbignJicpO1xufTtcbiIsIi8qKlxuICogdG9TdHJpbmcgcmVmLlxuICovXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKlxuICogUmV0dXJuIHRoZSB0eXBlIG9mIGB2YWxgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCl7XG4gIHN3aXRjaCAodG9TdHJpbmcuY2FsbCh2YWwpKSB7XG4gICAgY2FzZSAnW29iamVjdCBEYXRlXSc6IHJldHVybiAnZGF0ZSc7XG4gICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzogcmV0dXJuICdyZWdleHAnO1xuICAgIGNhc2UgJ1tvYmplY3QgQXJndW1lbnRzXSc6IHJldHVybiAnYXJndW1lbnRzJztcbiAgICBjYXNlICdbb2JqZWN0IEFycmF5XSc6IHJldHVybiAnYXJyYXknO1xuICAgIGNhc2UgJ1tvYmplY3QgRXJyb3JdJzogcmV0dXJuICdlcnJvcic7XG4gIH1cblxuICBpZiAodmFsID09PSBudWxsKSByZXR1cm4gJ251bGwnO1xuICBpZiAodmFsID09PSB1bmRlZmluZWQpIHJldHVybiAndW5kZWZpbmVkJztcbiAgaWYgKHZhbCAhPT0gdmFsKSByZXR1cm4gJ25hbic7XG4gIGlmICh2YWwgJiYgdmFsLm5vZGVUeXBlID09PSAxKSByZXR1cm4gJ2VsZW1lbnQnO1xuXG4gIHZhbCA9IHZhbC52YWx1ZU9mXG4gICAgPyB2YWwudmFsdWVPZigpXG4gICAgOiBPYmplY3QucHJvdG90eXBlLnZhbHVlT2YuYXBwbHkodmFsKVxuXG4gIHJldHVybiB0eXBlb2YgdmFsO1xufTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBFbnRpdHkgPSByZXF1aXJlKCcuL2VudGl0eScpO1xudmFyIGJpbmRBbGwgPSByZXF1aXJlKCdiaW5kLWFsbCcpO1xudmFyIGNvb2tpZSA9IHJlcXVpcmUoJy4vY29va2llJyk7XG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdhbmFseXRpY3M6dXNlcicpO1xudmFyIGluaGVyaXQgPSByZXF1aXJlKCdpbmhlcml0Jyk7XG52YXIgcmF3Q29va2llID0gcmVxdWlyZSgnY29va2llJyk7XG52YXIgdXVpZCA9IHJlcXVpcmUoJ3V1aWQnKTtcblxuXG4vKipcbiAqIFVzZXIgZGVmYXVsdHNcbiAqL1xuXG5Vc2VyLmRlZmF1bHRzID0ge1xuICBwZXJzaXN0OiB0cnVlLFxuICBjb29raWU6IHtcbiAgICBrZXk6ICdhanNfdXNlcl9pZCcsXG4gICAgb2xkS2V5OiAnYWpzX3VzZXInXG4gIH0sXG4gIGxvY2FsU3RvcmFnZToge1xuICAgIGtleTogJ2Fqc191c2VyX3RyYWl0cydcbiAgfVxufTtcblxuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYFVzZXJgIHdpdGggYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gVXNlcihvcHRpb25zKSB7XG4gIHRoaXMuZGVmYXVsdHMgPSBVc2VyLmRlZmF1bHRzO1xuICB0aGlzLmRlYnVnID0gZGVidWc7XG4gIEVudGl0eS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xufVxuXG5cbi8qKlxuICogSW5oZXJpdCBgRW50aXR5YFxuICovXG5cbmluaGVyaXQoVXNlciwgRW50aXR5KTtcblxuLyoqXG4gKiBTZXQvZ2V0IHRoZSB1c2VyIGlkLlxuICpcbiAqIFdoZW4gdGhlIHVzZXIgaWQgY2hhbmdlcywgdGhlIG1ldGhvZCB3aWxsIHJlc2V0IGhpcyBhbm9ueW1vdXNJZCB0byBhIG5ldyBvbmUuXG4gKlxuICogLy8gRklYTUU6IFdoYXQgYXJlIHRoZSBtaXhlZCB0eXBlcz9cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAZXhhbXBsZVxuICogLy8gZGlkbid0IGNoYW5nZSBiZWNhdXNlIHRoZSB1c2VyIGRpZG4ndCBoYXZlIHByZXZpb3VzIGlkLlxuICogYW5vbnltb3VzSWQgPSB1c2VyLmFub255bW91c0lkKCk7XG4gKiB1c2VyLmlkKCdmb28nKTtcbiAqIGFzc2VydC5lcXVhbChhbm9ueW1vdXNJZCwgdXNlci5hbm9ueW1vdXNJZCgpKTtcbiAqXG4gKiAvLyBkaWRuJ3QgY2hhbmdlIGJlY2F1c2UgdGhlIHVzZXIgaWQgY2hhbmdlZCB0byBudWxsLlxuICogYW5vbnltb3VzSWQgPSB1c2VyLmFub255bW91c0lkKCk7XG4gKiB1c2VyLmlkKCdmb28nKTtcbiAqIHVzZXIuaWQobnVsbCk7XG4gKiBhc3NlcnQuZXF1YWwoYW5vbnltb3VzSWQsIHVzZXIuYW5vbnltb3VzSWQoKSk7XG4gKlxuICogLy8gY2hhbmdlIGJlY2F1c2UgdGhlIHVzZXIgaGFkIHByZXZpb3VzIGlkLlxuICogYW5vbnltb3VzSWQgPSB1c2VyLmFub255bW91c0lkKCk7XG4gKiB1c2VyLmlkKCdmb28nKTtcbiAqIHVzZXIuaWQoJ2JheicpOyAvLyB0cmlnZ2VycyBjaGFuZ2VcbiAqIHVzZXIuaWQoJ2JheicpOyAvLyBubyBjaGFuZ2VcbiAqIGFzc2VydC5ub3RFcXVhbChhbm9ueW1vdXNJZCwgdXNlci5hbm9ueW1vdXNJZCgpKTtcbiAqL1xuXG5Vc2VyLnByb3RvdHlwZS5pZCA9IGZ1bmN0aW9uKGlkKXtcbiAgdmFyIHByZXYgPSB0aGlzLl9nZXRJZCgpO1xuICB2YXIgcmV0ID0gRW50aXR5LnByb3RvdHlwZS5pZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICBpZiAocHJldiA9PSBudWxsKSByZXR1cm4gcmV0O1xuICAvLyBGSVhNRTogV2UncmUgcmVseWluZyBvbiBjb2VyY2lvbiBoZXJlICgxID09IFwiMVwiKSwgYnV0IG91ciBBUEkgdHJlYXRzIHRoZXNlXG4gIC8vIHR3byB2YWx1ZXMgZGlmZmVyZW50bHkuIEZpZ3VyZSBvdXQgd2hhdCB3aWxsIGJyZWFrIGlmIHdlIHJlbW92ZSB0aGlzIGFuZFxuICAvLyBjaGFuZ2UgdG8gc3RyaWN0IGVxdWFsaXR5XG4gIC8qIGVzbGludC1kaXNhYmxlIGVxZXFlcSAqL1xuICBpZiAocHJldiAhPSBpZCAmJiBpZCkgdGhpcy5hbm9ueW1vdXNJZChudWxsKTtcbiAgLyogZXNsaW50LWVuYWJsZSBlcWVxZXEgKi9cbiAgcmV0dXJuIHJldDtcbn07XG5cbi8qKlxuICogU2V0IC8gZ2V0IC8gcmVtb3ZlIGFub255bW91c0lkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBhbm9ueW1vdXNJZFxuICogQHJldHVybiB7U3RyaW5nfFVzZXJ9XG4gKi9cblxuVXNlci5wcm90b3R5cGUuYW5vbnltb3VzSWQgPSBmdW5jdGlvbihhbm9ueW1vdXNJZCl7XG4gIHZhciBzdG9yZSA9IHRoaXMuc3RvcmFnZSgpO1xuXG4gIC8vIHNldCAvIHJlbW92ZVxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHN0b3JlLnNldCgnYWpzX2Fub255bW91c19pZCcsIGFub255bW91c0lkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIG5ld1xuICBhbm9ueW1vdXNJZCA9IHN0b3JlLmdldCgnYWpzX2Fub255bW91c19pZCcpO1xuICBpZiAoYW5vbnltb3VzSWQpIHtcbiAgICByZXR1cm4gYW5vbnltb3VzSWQ7XG4gIH1cblxuICAvLyBvbGQgLSBpdCBpcyBub3Qgc3RyaW5naWZpZWQgc28gd2UgdXNlIHRoZSByYXcgY29va2llLlxuICBhbm9ueW1vdXNJZCA9IHJhd0Nvb2tpZSgnX3NpbycpO1xuICBpZiAoYW5vbnltb3VzSWQpIHtcbiAgICBhbm9ueW1vdXNJZCA9IGFub255bW91c0lkLnNwbGl0KCctLS0tJylbMF07XG4gICAgc3RvcmUuc2V0KCdhanNfYW5vbnltb3VzX2lkJywgYW5vbnltb3VzSWQpO1xuICAgIHN0b3JlLnJlbW92ZSgnX3NpbycpO1xuICAgIHJldHVybiBhbm9ueW1vdXNJZDtcbiAgfVxuXG4gIC8vIGVtcHR5XG4gIGFub255bW91c0lkID0gdXVpZCgpO1xuICBzdG9yZS5zZXQoJ2Fqc19hbm9ueW1vdXNfaWQnLCBhbm9ueW1vdXNJZCk7XG4gIHJldHVybiBzdG9yZS5nZXQoJ2Fqc19hbm9ueW1vdXNfaWQnKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFub255bW91cyBpZCBvbiBsb2dvdXQgdG9vLlxuICovXG5cblVzZXIucHJvdG90eXBlLmxvZ291dCA9IGZ1bmN0aW9uKCl7XG4gIEVudGl0eS5wcm90b3R5cGUubG9nb3V0LmNhbGwodGhpcyk7XG4gIHRoaXMuYW5vbnltb3VzSWQobnVsbCk7XG59O1xuXG4vKipcbiAqIExvYWQgc2F2ZWQgdXNlciBgaWRgIG9yIGB0cmFpdHNgIGZyb20gc3RvcmFnZS5cbiAqL1xuXG5Vc2VyLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLl9sb2FkT2xkQ29va2llKCkpIHJldHVybjtcbiAgRW50aXR5LnByb3RvdHlwZS5sb2FkLmNhbGwodGhpcyk7XG59O1xuXG5cbi8qKlxuICogQkFDS1dBUkRTIENPTVBBVElCSUxJVFk6IExvYWQgdGhlIG9sZCB1c2VyIGZyb20gdGhlIGNvb2tpZS5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblxuVXNlci5wcm90b3R5cGUuX2xvYWRPbGRDb29raWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHVzZXIgPSBjb29raWUuZ2V0KHRoaXMuX29wdGlvbnMuY29va2llLm9sZEtleSk7XG4gIGlmICghdXNlcikgcmV0dXJuIGZhbHNlO1xuXG4gIHRoaXMuaWQodXNlci5pZCk7XG4gIHRoaXMudHJhaXRzKHVzZXIudHJhaXRzKTtcbiAgY29va2llLnJlbW92ZSh0aGlzLl9vcHRpb25zLmNvb2tpZS5vbGRLZXkpO1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cblxuLyoqXG4gKiBFeHBvc2UgdGhlIHVzZXIgc2luZ2xldG9uLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gYmluZEFsbChuZXcgVXNlcigpKTtcblxuXG4vKipcbiAqIEV4cG9zZSB0aGUgYFVzZXJgIGNvbnN0cnVjdG9yLlxuICovXG5cbm1vZHVsZS5leHBvcnRzLlVzZXIgPSBVc2VyO1xuIiwiXG4vKipcbiAqIFRha2VuIHN0cmFpZ2h0IGZyb20gamVkJ3MgZ2lzdDogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vOTgyODgzXG4gKlxuICogUmV0dXJucyBhIHJhbmRvbSB2NCBVVUlEIG9mIHRoZSBmb3JtIHh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCxcbiAqIHdoZXJlIGVhY2ggeCBpcyByZXBsYWNlZCB3aXRoIGEgcmFuZG9tIGhleGFkZWNpbWFsIGRpZ2l0IGZyb20gMCB0byBmLCBhbmRcbiAqIHkgaXMgcmVwbGFjZWQgd2l0aCBhIHJhbmRvbSBoZXhhZGVjaW1hbCBkaWdpdCBmcm9tIDggdG8gYi5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHV1aWQoYSl7XG4gIHJldHVybiBhICAgICAgICAgICAvLyBpZiB0aGUgcGxhY2Vob2xkZXIgd2FzIHBhc3NlZCwgcmV0dXJuXG4gICAgPyAoICAgICAgICAgICAgICAvLyBhIHJhbmRvbSBudW1iZXIgZnJvbSAwIHRvIDE1XG4gICAgICBhIF4gICAgICAgICAgICAvLyB1bmxlc3MgYiBpcyA4LFxuICAgICAgTWF0aC5yYW5kb20oKSAgLy8gaW4gd2hpY2ggY2FzZVxuICAgICAgKiAxNiAgICAgICAgICAgLy8gYSByYW5kb20gbnVtYmVyIGZyb21cbiAgICAgID4+IGEvNCAgICAgICAgIC8vIDggdG8gMTFcbiAgICAgICkudG9TdHJpbmcoMTYpIC8vIGluIGhleGFkZWNpbWFsXG4gICAgOiAoICAgICAgICAgICAgICAvLyBvciBvdGhlcndpc2UgYSBjb25jYXRlbmF0ZWQgc3RyaW5nOlxuICAgICAgWzFlN10gKyAgICAgICAgLy8gMTAwMDAwMDAgK1xuICAgICAgLTFlMyArICAgICAgICAgLy8gLTEwMDAgK1xuICAgICAgLTRlMyArICAgICAgICAgLy8gLTQwMDAgK1xuICAgICAgLThlMyArICAgICAgICAgLy8gLTgwMDAwMDAwICtcbiAgICAgIC0xZTExICAgICAgICAgIC8vIC0xMDAwMDAwMDAwMDAsXG4gICAgICApLnJlcGxhY2UoICAgICAvLyByZXBsYWNpbmdcbiAgICAgICAgL1swMThdL2csICAgIC8vIHplcm9lcywgb25lcywgYW5kIGVpZ2h0cyB3aXRoXG4gICAgICAgIHV1aWQgICAgICAgICAvLyByYW5kb20gaGV4IGRpZ2l0c1xuICAgICAgKVxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgXCJuYW1lXCI6IFwiYW5hbHl0aWNzLWNvcmVcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMi4xMS4xXCIsXG4gIFwibWFpblwiOiBcImFuYWx5dGljcy5qc1wiLFxuICBcImRlcGVuZGVuY2llc1wiOiB7fSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge31cbn1cbjsiLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgYmluZCA9IHJlcXVpcmUoJ2JpbmQnKTtcbnZhciBjbG9uZSA9IHJlcXVpcmUoJ2Nsb25lJyk7XG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnZGVmYXVsdHMnKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcbnZhciBzbHVnID0gcmVxdWlyZSgnc2x1ZycpO1xudmFyIHByb3RvcyA9IHJlcXVpcmUoJy4vcHJvdG9zJyk7XG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4vc3RhdGljcycpO1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBgSW50ZWdyYXRpb25gIGNvbnN0cnVjdG9yLlxuICpcbiAqIEBjb25zdHJ1Y3RzIEludGVncmF0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7RnVuY3Rpb259IEludGVncmF0aW9uXG4gKi9cblxuZnVuY3Rpb24gY3JlYXRlSW50ZWdyYXRpb24obmFtZSl7XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGEgbmV3IGBJbnRlZ3JhdGlvbmAuXG4gICAqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKi9cblxuICBmdW5jdGlvbiBJbnRlZ3JhdGlvbihvcHRpb25zKXtcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmFkZEludGVncmF0aW9uKSB7XG4gICAgICAvLyBwbHVnaW5cbiAgICAgIHJldHVybiBvcHRpb25zLmFkZEludGVncmF0aW9uKEludGVncmF0aW9uKTtcbiAgICB9XG4gICAgdGhpcy5kZWJ1ZyA9IGRlYnVnKCdhbmFseXRpY3M6aW50ZWdyYXRpb246JyArIHNsdWcobmFtZSkpO1xuICAgIHRoaXMub3B0aW9ucyA9IGRlZmF1bHRzKGNsb25lKG9wdGlvbnMpIHx8IHt9LCB0aGlzLmRlZmF1bHRzKTtcbiAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgIHRoaXMub25jZSgncmVhZHknLCBiaW5kKHRoaXMsIHRoaXMuZmx1c2gpKTtcblxuICAgIEludGVncmF0aW9uLmVtaXQoJ2NvbnN0cnVjdCcsIHRoaXMpO1xuICAgIHRoaXMucmVhZHkgPSBiaW5kKHRoaXMsIHRoaXMucmVhZHkpO1xuICAgIHRoaXMuX3dyYXBJbml0aWFsaXplKCk7XG4gICAgdGhpcy5fd3JhcFBhZ2UoKTtcbiAgICB0aGlzLl93cmFwVHJhY2soKTtcbiAgfVxuXG4gIEludGVncmF0aW9uLnByb3RvdHlwZS5kZWZhdWx0cyA9IHt9O1xuICBJbnRlZ3JhdGlvbi5wcm90b3R5cGUuZ2xvYmFscyA9IFtdO1xuICBJbnRlZ3JhdGlvbi5wcm90b3R5cGUudGVtcGxhdGVzID0ge307XG4gIEludGVncmF0aW9uLnByb3RvdHlwZS5uYW1lID0gbmFtZTtcbiAgZXh0ZW5kKEludGVncmF0aW9uLCBzdGF0aWNzKTtcbiAgZXh0ZW5kKEludGVncmF0aW9uLnByb3RvdHlwZSwgcHJvdG9zKTtcblxuICByZXR1cm4gSW50ZWdyYXRpb247XG59XG5cbi8qKlxuICogRXhwb3J0cy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUludGVncmF0aW9uO1xuIiwiaWYgKCd1bmRlZmluZWQnID09IHR5cGVvZiB3aW5kb3cpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9kZWJ1ZycpO1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG59XG4iLCIvKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIHR0eSA9IHJlcXVpcmUoJ3R0eScpO1xuXG4vKipcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYnVnO1xuXG4vKipcbiAqIEVuYWJsZWQgZGVidWdnZXJzLlxuICovXG5cbnZhciBuYW1lcyA9IFtdXG4gICwgc2tpcHMgPSBbXTtcblxuKHByb2Nlc3MuZW52LkRFQlVHIHx8ICcnKVxuICAuc3BsaXQoL1tcXHMsXSsvKVxuICAuZm9yRWFjaChmdW5jdGlvbihuYW1lKXtcbiAgICBuYW1lID0gbmFtZS5yZXBsYWNlKCcqJywgJy4qPycpO1xuICAgIGlmIChuYW1lWzBdID09PSAnLScpIHtcbiAgICAgIHNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lLnN1YnN0cigxKSArICckJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZSArICckJykpO1xuICAgIH1cbiAgfSk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbnZhciBjb2xvcnMgPSBbNiwgMiwgMywgNCwgNSwgMV07XG5cbi8qKlxuICogUHJldmlvdXMgZGVidWcoKSBjYWxsLlxuICovXG5cbnZhciBwcmV2ID0ge307XG5cbi8qKlxuICogUHJldmlvdXNseSBhc3NpZ25lZCBjb2xvci5cbiAqL1xuXG52YXIgcHJldkNvbG9yID0gMDtcblxuLyoqXG4gKiBJcyBzdGRvdXQgYSBUVFk/IENvbG9yZWQgb3V0cHV0IGlzIGRpc2FibGVkIHdoZW4gYHRydWVgLlxuICovXG5cbnZhciBpc2F0dHkgPSB0dHkuaXNhdHR5KDIpO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvbG9yKCkge1xuICByZXR1cm4gY29sb3JzW3ByZXZDb2xvcisrICUgY29sb3JzLmxlbmd0aF07XG59XG5cbi8qKlxuICogSHVtYW5pemUgdGhlIGdpdmVuIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1cbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGh1bWFuaXplKG1zKSB7XG4gIHZhciBzZWMgPSAxMDAwXG4gICAgLCBtaW4gPSA2MCAqIDEwMDBcbiAgICAsIGhvdXIgPSA2MCAqIG1pbjtcblxuICBpZiAobXMgPj0gaG91cikgcmV0dXJuIChtcyAvIGhvdXIpLnRvRml4ZWQoMSkgKyAnaCc7XG4gIGlmIChtcyA+PSBtaW4pIHJldHVybiAobXMgLyBtaW4pLnRvRml4ZWQoMSkgKyAnbSc7XG4gIGlmIChtcyA+PSBzZWMpIHJldHVybiAobXMgLyBzZWMgfCAwKSArICdzJztcbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge1R5cGV9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRlYnVnKG5hbWUpIHtcbiAgZnVuY3Rpb24gZGlzYWJsZWQoKXt9XG4gIGRpc2FibGVkLmVuYWJsZWQgPSBmYWxzZTtcblxuICB2YXIgbWF0Y2ggPSBza2lwcy5zb21lKGZ1bmN0aW9uKHJlKXtcbiAgICByZXR1cm4gcmUudGVzdChuYW1lKTtcbiAgfSk7XG5cbiAgaWYgKG1hdGNoKSByZXR1cm4gZGlzYWJsZWQ7XG5cbiAgbWF0Y2ggPSBuYW1lcy5zb21lKGZ1bmN0aW9uKHJlKXtcbiAgICByZXR1cm4gcmUudGVzdChuYW1lKTtcbiAgfSk7XG5cbiAgaWYgKCFtYXRjaCkgcmV0dXJuIGRpc2FibGVkO1xuICB2YXIgYyA9IGNvbG9yKCk7XG5cbiAgZnVuY3Rpb24gY29sb3JlZChmbXQpIHtcbiAgICBmbXQgPSBjb2VyY2UoZm10KTtcblxuICAgIHZhciBjdXJyID0gbmV3IERhdGU7XG4gICAgdmFyIG1zID0gY3VyciAtIChwcmV2W25hbWVdIHx8IGN1cnIpO1xuICAgIHByZXZbbmFtZV0gPSBjdXJyO1xuXG4gICAgZm10ID0gJyAgXFx1MDAxYls5JyArIGMgKyAnbScgKyBuYW1lICsgJyAnXG4gICAgICArICdcXHUwMDFiWzMnICsgYyArICdtXFx1MDAxYls5MG0nXG4gICAgICArIGZtdCArICdcXHUwMDFiWzMnICsgYyArICdtJ1xuICAgICAgKyAnICsnICsgaHVtYW5pemUobXMpICsgJ1xcdTAwMWJbMG0nO1xuXG4gICAgY29uc29sZS5lcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGxhaW4oZm10KSB7XG4gICAgZm10ID0gY29lcmNlKGZtdCk7XG5cbiAgICBmbXQgPSBuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKClcbiAgICAgICsgJyAnICsgbmFtZSArICcgJyArIGZtdDtcbiAgICBjb25zb2xlLmVycm9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBjb2xvcmVkLmVuYWJsZWQgPSBwbGFpbi5lbmFibGVkID0gdHJ1ZTtcblxuICByZXR1cm4gaXNhdHR5IHx8IHByb2Nlc3MuZW52LkRFQlVHX0NPTE9SU1xuICAgID8gY29sb3JlZFxuICAgIDogcGxhaW47XG59XG5cbi8qKlxuICogQ29lcmNlIGB2YWxgLlxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiXG4vKipcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYnVnO1xuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7VHlwZX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZSkge1xuICBpZiAoIWRlYnVnLmVuYWJsZWQobmFtZSkpIHJldHVybiBmdW5jdGlvbigpe307XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGZtdCl7XG4gICAgZm10ID0gY29lcmNlKGZtdCk7XG5cbiAgICB2YXIgY3VyciA9IG5ldyBEYXRlO1xuICAgIHZhciBtcyA9IGN1cnIgLSAoZGVidWdbbmFtZV0gfHwgY3Vycik7XG4gICAgZGVidWdbbmFtZV0gPSBjdXJyO1xuXG4gICAgZm10ID0gbmFtZVxuICAgICAgKyAnICdcbiAgICAgICsgZm10XG4gICAgICArICcgKycgKyBkZWJ1Zy5odW1hbml6ZShtcyk7XG5cbiAgICAvLyBUaGlzIGhhY2tlcnkgaXMgcmVxdWlyZWQgZm9yIElFOFxuICAgIC8vIHdoZXJlIGBjb25zb2xlLmxvZ2AgZG9lc24ndCBoYXZlICdhcHBseSdcbiAgICB3aW5kb3cuY29uc29sZVxuICAgICAgJiYgY29uc29sZS5sb2dcbiAgICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xuICB9XG59XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcy5cbiAqL1xuXG5kZWJ1Zy5uYW1lcyA9IFtdO1xuZGVidWcuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmRlYnVnLmVuYWJsZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdHJ5IHtcbiAgICBsb2NhbFN0b3JhZ2UuZGVidWcgPSBuYW1lO1xuICB9IGNhdGNoKGUpe31cblxuICB2YXIgc3BsaXQgPSAobmFtZSB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKVxuICAgICwgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBuYW1lID0gc3BsaXRbaV0ucmVwbGFjZSgnKicsICcuKj8nKTtcbiAgICBpZiAobmFtZVswXSA9PT0gJy0nKSB7XG4gICAgICBkZWJ1Zy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZS5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBkZWJ1Zy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZSArICckJykpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmRlYnVnLmRpc2FibGUgPSBmdW5jdGlvbigpe1xuICBkZWJ1Zy5lbmFibGUoJycpO1xufTtcblxuLyoqXG4gKiBIdW1hbml6ZSB0aGUgZ2l2ZW4gYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbVxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZGVidWcuaHVtYW5pemUgPSBmdW5jdGlvbihtcykge1xuICB2YXIgc2VjID0gMTAwMFxuICAgICwgbWluID0gNjAgKiAxMDAwXG4gICAgLCBob3VyID0gNjAgKiBtaW47XG5cbiAgaWYgKG1zID49IGhvdXIpIHJldHVybiAobXMgLyBob3VyKS50b0ZpeGVkKDEpICsgJ2gnO1xuICBpZiAobXMgPj0gbWluKSByZXR1cm4gKG1zIC8gbWluKS50b0ZpeGVkKDEpICsgJ20nO1xuICBpZiAobXMgPj0gc2VjKSByZXR1cm4gKG1zIC8gc2VjIHwgMCkgKyAncyc7XG4gIHJldHVybiBtcyArICdtcyc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZGVidWcuZW5hYmxlZCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRlYnVnLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGRlYnVnLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRlYnVnLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGRlYnVnLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cblxuLy8gcGVyc2lzdFxuXG50cnkge1xuICBpZiAod2luZG93LmxvY2FsU3RvcmFnZSkgZGVidWcuZW5hYmxlKGxvY2FsU3RvcmFnZS5kZWJ1Zyk7XG59IGNhdGNoKGUpe31cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBleHRlbmQgKG9iamVjdCkge1xuICAgIC8vIFRha2VzIGFuIHVubGltaXRlZCBudW1iZXIgb2YgZXh0ZW5kZXJzLlxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIC8vIEZvciBlYWNoIGV4dGVuZGVyLCBjb3B5IHRoZWlyIHByb3BlcnRpZXMgb24gb3VyIG9iamVjdC5cbiAgICBmb3IgKHZhciBpID0gMCwgc291cmNlOyBzb3VyY2UgPSBhcmdzW2ldOyBpKyspIHtcbiAgICAgICAgaWYgKCFzb3VyY2UpIGNvbnRpbnVlO1xuICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgIG9iamVjdFtwcm9wZXJ0eV0gPSBzb3VyY2VbcHJvcGVydHldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iamVjdDtcbn07IiwiXG4vKipcbiAqIEdlbmVyYXRlIGEgc2x1ZyBmcm9tIHRoZSBnaXZlbiBgc3RyYC5cbiAqXG4gKiBleGFtcGxlOlxuICpcbiAqICAgICAgICBnZW5lcmF0ZSgnZm9vIGJhcicpO1xuICogICAgICAgIC8vID4gZm9vLWJhclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAY29uZmlnIHtTdHJpbmd8UmVnRXhwfSBbcmVwbGFjZV0gY2hhcmFjdGVycyB0byByZXBsYWNlLCBkZWZhdWx0ZWQgdG8gYC9bXmEtejAtOV0vZ2BcbiAqIEBjb25maWcge1N0cmluZ30gW3NlcGFyYXRvcl0gc2VwYXJhdG9yIHRvIGluc2VydCwgZGVmYXVsdGVkIHRvIGAtYFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0ciwgb3B0aW9ucykge1xuICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZShvcHRpb25zLnJlcGxhY2UgfHwgL1teYS16MC05XS9nLCAnICcpXG4gICAgLnJlcGxhY2UoL14gK3wgKyQvZywgJycpXG4gICAgLnJlcGxhY2UoLyArL2csIG9wdGlvbnMuc2VwYXJhdG9yIHx8ICctJylcbn07XG4iLCIvKiBnbG9iYWwgc2V0SW50ZXJ2YWw6dHJ1ZSBzZXRUaW1lb3V0OnRydWUgKi9cblxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSgnZW1pdHRlcicpO1xudmFyIGFmdGVyID0gcmVxdWlyZSgnYWZ0ZXInKTtcbnZhciBlYWNoID0gcmVxdWlyZSgnZWFjaCcpO1xudmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2FuYWx5dGljcy1ldmVudHMnKTtcbnZhciBmbXQgPSByZXF1aXJlKCdmbXQnKTtcbnZhciBmb2xkbCA9IHJlcXVpcmUoJ2ZvbGRsJyk7XG52YXIgbG9hZElmcmFtZSA9IHJlcXVpcmUoJ2xvYWQtaWZyYW1lJyk7XG52YXIgbG9hZFNjcmlwdCA9IHJlcXVpcmUoJ2xvYWQtc2NyaXB0Jyk7XG52YXIgbm9ybWFsaXplID0gcmVxdWlyZSgndG8tbm8tY2FzZScpO1xudmFyIG5leHRUaWNrID0gcmVxdWlyZSgnbmV4dC10aWNrJyk7XG52YXIgZXZlcnkgPSByZXF1aXJlKCdldmVyeScpO1xudmFyIGlzID0gcmVxdWlyZSgnaXMnKTtcblxuLyoqXG4gKiBOb29wLlxuICovXG5cbmZ1bmN0aW9uIG5vb3AoKXt9XG5cbi8qKlxuICogaGFzT3duUHJvcGVydHkgcmVmZXJlbmNlLlxuICovXG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFdpbmRvdyBkZWZhdWx0cy5cbiAqL1xuXG52YXIgb25lcnJvciA9IHdpbmRvdy5vbmVycm9yO1xudmFyIG9ubG9hZCA9IG51bGw7XG52YXIgc2V0SW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWw7XG52YXIgc2V0VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0O1xuXG4vKipcbiAqIE1peGluIGVtaXR0ZXIuXG4gKi9cblxuLyogZXNsaW50LWRpc2FibGUgbmV3LWNhcCAqL1xuRW1pdHRlcihleHBvcnRzKTtcbi8qIGVzbGludC1lbmFibGUgbmV3LWNhcCAqL1xuXG4vKipcbiAqIEluaXRpYWxpemUuXG4gKi9cblxuZXhwb3J0cy5pbml0aWFsaXplID0gZnVuY3Rpb24oKXtcbiAgdmFyIHJlYWR5ID0gdGhpcy5yZWFkeTtcbiAgbmV4dFRpY2socmVhZHkpO1xufTtcblxuLyoqXG4gKiBMb2FkZWQ/XG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5cbmV4cG9ydHMubG9hZGVkID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBQYWdlLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge1BhZ2V9IHBhZ2VcbiAqL1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xuZXhwb3J0cy5wYWdlID0gZnVuY3Rpb24ocGFnZSl7fTtcbi8qIGVzbGludC1lbmFibGUgbm8tdW51c2VkLXZhcnMgKi9cblxuLyoqXG4gKiBUcmFjay5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtUcmFja30gdHJhY2tcbiAqL1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xuZXhwb3J0cy50cmFjayA9IGZ1bmN0aW9uKHRyYWNrKXt9O1xuLyogZXNsaW50LWVuYWJsZSBuby11bnVzZWQtdmFycyAqL1xuXG4vKipcbiAqIEdldCB2YWx1ZXMgZnJvbSBpdGVtcyBpbiBgb3B0aW9uc2AgdGhhdCBhcmUgbWFwcGVkIHRvIGBrZXlgLlxuICogYG9wdGlvbnNgIGlzIGFuIGludGVncmF0aW9uIHNldHRpbmcgd2hpY2ggaXMgYSBjb2xsZWN0aW9uXG4gKiBvZiB0eXBlICdtYXAnLCAnYXJyYXknLCBvciAnbWl4ZWQnXG4gKlxuICogVXNlIGNhc2VzIGluY2x1ZGUgbWFwcGluZyBldmVudHMgdG8gcGl4ZWxJZHMgKG1hcCksIHNlbmRpbmcgZ2VuZXJpY1xuICogY29udmVyc2lvbiBwaXhlbHMgb25seSBmb3Igc3BlY2lmaWMgZXZlbnRzIChhcnJheSksIG9yIGNvbmZpZ3VyaW5nIGR5bmFtaWNcbiAqIG1hcHBpbmdzIG9mIGV2ZW50IHByb3BlcnRpZXMgdG8gcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnMgYmFzZWQgb24gZXZlbnQgKG1peGVkKVxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge09iamVjdHxPYmplY3RbXXxTdHJpbmdbXX0gb3B0aW9ucyBBbiBvYmplY3QsIGFycmF5IG9mIG9iamVjdHMsIG9yXG4gKiBhcnJheSBvZiBzdHJpbmdzIHB1bGxlZCBmcm9tIHNldHRpbmdzLm1hcHBpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBuYW1lIG9mIHRoZSBpdGVtIGluIG9wdGlvbnMgd2hvc2UgbWV0YWRhdGFcbiAqIHdlJ3JlIGxvb2tpbmcgZm9yLlxuICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IG9mIHNldHRpbmdzIHRoYXQgbWF0Y2ggdGhlIGlucHV0IGBrZXlgIG5hbWUuXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vICdNYXAnXG4gKiB2YXIgZXZlbnRzID0geyBteV9ldmVudDogJ2E0OTkxYjg4JyB9O1xuICogLm1hcChldmVudHMsICdNeSBFdmVudCcpO1xuICogLy8gPT4gW1wiYTQ5OTFiODhcIl1cbiAqIC5tYXAoZXZlbnRzLCAnd2hhdGV2ZXInKTtcbiAqIC8vID0+IFtdXG4gKlxuICogLy8gJ0FycmF5J1xuICogKiB2YXIgZXZlbnRzID0gWydDb21wbGV0ZWQgT3JkZXInLCAnTXkgRXZlbnQnXTtcbiAqIC5tYXAoZXZlbnRzLCAnTXkgRXZlbnQnKTtcbiAqIC8vID0+IFtcIk15IEV2ZW50XCJdXG4gKiAubWFwKGV2ZW50cywgJ3doYXRldmVyJyk7XG4gKiAvLyA9PiBbXVxuICpcbiAqIC8vICdNaXhlZCdcbiAqIHZhciBldmVudHMgPSBbeyBrZXk6ICdteSBldmVudCcsIHZhbHVlOiAnOWI1ZWIxZmEnIH1dO1xuICogLm1hcChldmVudHMsICdteV9ldmVudCcpO1xuICogLy8gPT4gW1wiOWI1ZWIxZmFcIl1cbiAqIC5tYXAoZXZlbnRzLCAnd2hhdGV2ZXInKTtcbiAqIC8vID0+IFtdXG4gKi9cblxuZXhwb3J0cy5tYXAgPSBmdW5jdGlvbihvcHRpb25zLCBrZXkpe1xuICB2YXIgbm9ybWFsaXplZENvbXBhcmF0b3IgPSBub3JtYWxpemUoa2V5KTtcbiAgdmFyIG1hcHBpbmdUeXBlID0gZ2V0TWFwcGluZ1R5cGUob3B0aW9ucyk7XG5cbiAgaWYgKG1hcHBpbmdUeXBlID09PSAndW5rbm93bicpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICByZXR1cm4gZm9sZGwoZnVuY3Rpb24obWF0Y2hpbmdWYWx1ZXMsIHZhbCwga2V5KSB7XG4gICAgdmFyIGNvbXBhcmU7XG4gICAgdmFyIHJlc3VsdDtcblxuICAgIGlmIChtYXBwaW5nVHlwZSA9PT0gJ21hcCcpIHtcbiAgICAgIGNvbXBhcmUgPSBrZXk7XG4gICAgICByZXN1bHQgPSB2YWw7XG4gICAgfVxuXG4gICAgaWYgKG1hcHBpbmdUeXBlID09PSAnYXJyYXknKSB7XG4gICAgICBjb21wYXJlID0gdmFsO1xuICAgICAgcmVzdWx0ID0gdmFsO1xuICAgIH1cblxuICAgIGlmIChtYXBwaW5nVHlwZSA9PT0gJ21peGVkJykge1xuICAgICAgY29tcGFyZSA9IHZhbC5rZXk7XG4gICAgICByZXN1bHQgPSB2YWwudmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKG5vcm1hbGl6ZShjb21wYXJlKSA9PT0gbm9ybWFsaXplZENvbXBhcmF0b3IpIHtcbiAgICAgIG1hdGNoaW5nVmFsdWVzLnB1c2gocmVzdWx0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hpbmdWYWx1ZXM7XG4gIH0sIFtdLCBvcHRpb25zKTtcbn07XG5cbi8qKlxuICogSW52b2tlIGEgYG1ldGhvZGAgdGhhdCBtYXkgb3IgbWF5IG5vdCBleGlzdCBvbiB0aGUgcHJvdG90eXBlIHdpdGggYGFyZ3NgLFxuICogcXVldWVpbmcgb3Igbm90IGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBpbnRlZ3JhdGlvbiBpcyBcInJlYWR5XCIuIERvbid0XG4gKiB0cnVzdCB0aGUgbWV0aG9kIGNhbGwsIHNpbmNlIGl0IGNvbnRhaW5zIGludGVncmF0aW9uIHBhcnR5IGNvZGUuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kXG4gKiBAcGFyYW0gey4uLip9IGFyZ3NcbiAqL1xuXG5leHBvcnRzLmludm9rZSA9IGZ1bmN0aW9uKG1ldGhvZCl7XG4gIGlmICghdGhpc1ttZXRob2RdKSByZXR1cm47XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgaWYgKCF0aGlzLl9yZWFkeSkgcmV0dXJuIHRoaXMucXVldWUobWV0aG9kLCBhcmdzKTtcbiAgdmFyIHJldDtcblxuICB0cnkge1xuICAgIHRoaXMuZGVidWcoJyVzIHdpdGggJW8nLCBtZXRob2QsIGFyZ3MpO1xuICAgIHJldCA9IHRoaXNbbWV0aG9kXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRoaXMuZGVidWcoJ2Vycm9yICVvIGNhbGxpbmcgJXMgd2l0aCAlbycsIGUsIG1ldGhvZCwgYXJncyk7XG4gIH1cblxuICByZXR1cm4gcmV0O1xufTtcblxuLyoqXG4gKiBRdWV1ZSBhIGBtZXRob2RgIHdpdGggYGFyZ3NgLiBJZiB0aGUgaW50ZWdyYXRpb24gYXNzdW1lcyBhbiBpbml0aWFsXG4gKiBwYWdldmlldywgdGhlbiBsZXQgdGhlIGZpcnN0IGNhbGwgdG8gYHBhZ2VgIHBhc3MgdGhyb3VnaC5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2RcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3NcbiAqL1xuXG5leHBvcnRzLnF1ZXVlID0gZnVuY3Rpb24obWV0aG9kLCBhcmdzKXtcbiAgaWYgKG1ldGhvZCA9PT0gJ3BhZ2UnICYmIHRoaXMuX2Fzc3VtZXNQYWdldmlldyAmJiAhdGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICByZXR1cm4gdGhpcy5wYWdlLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgdGhpcy5fcXVldWUucHVzaCh7IG1ldGhvZDogbWV0aG9kLCBhcmdzOiBhcmdzIH0pO1xufTtcblxuLyoqXG4gKiBGbHVzaCB0aGUgaW50ZXJuYWwgcXVldWUuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5mbHVzaCA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuX3JlYWR5ID0gdHJ1ZTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGVhY2godGhpcy5fcXVldWUsIGZ1bmN0aW9uKGNhbGwpe1xuICAgIHNlbGZbY2FsbC5tZXRob2RdLmFwcGx5KHNlbGYsIGNhbGwuYXJncyk7XG4gIH0pO1xuXG4gIC8vIEVtcHR5IHRoZSBxdWV1ZS5cbiAgdGhpcy5fcXVldWUubGVuZ3RoID0gMDtcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIGludGVncmF0aW9uLCByZW1vdmluZyBpdHMgZ2xvYmFsIHZhcmlhYmxlcy5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLnJlc2V0ID0gZnVuY3Rpb24oKXtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmdsb2JhbHMubGVuZ3RoOyBpKyspIHtcbiAgICB3aW5kb3dbdGhpcy5nbG9iYWxzW2ldXSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHdpbmRvdy5zZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgd2luZG93LnNldEludGVydmFsID0gc2V0SW50ZXJ2YWw7XG4gIHdpbmRvdy5vbmVycm9yID0gb25lcnJvcjtcbiAgd2luZG93Lm9ubG9hZCA9IG9ubG9hZDtcbn07XG5cbi8qKlxuICogTG9hZCBhIHRhZyBieSBgbmFtZWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHRhZy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBsb2NhbHMgTG9jYWxzIHVzZWQgdG8gcG9wdWxhdGUgdGhlIHRhZydzIHRlbXBsYXRlIHZhcmlhYmxlc1xuICogKGUuZy4gYHVzZXJJZGAgaW4gJzxpbWcgc3JjPVwiaHR0cHM6Ly93aGF0ZXZlci5jb20ve3sgdXNlcklkIH19XCI+JykuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9bm9vcF0gQSBjYWxsYmFjaywgaW52b2tlZCB3aGVuIHRoZSB0YWcgZmluaXNoZXNcbiAqIGxvYWRpbmcuXG4gKi9cblxuZXhwb3J0cy5sb2FkID0gZnVuY3Rpb24obmFtZSwgbG9jYWxzLCBjYWxsYmFjayl7XG4gIC8vIEFyZ3VtZW50IHNodWZmbGluZ1xuICBpZiAodHlwZW9mIG5hbWUgPT09ICdmdW5jdGlvbicpIHsgY2FsbGJhY2sgPSBuYW1lOyBsb2NhbHMgPSBudWxsOyBuYW1lID0gbnVsbDsgfVxuICBpZiAobmFtZSAmJiB0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHsgY2FsbGJhY2sgPSBsb2NhbHM7IGxvY2FscyA9IG5hbWU7IG5hbWUgPSBudWxsOyB9XG4gIGlmICh0eXBlb2YgbG9jYWxzID09PSAnZnVuY3Rpb24nKSB7IGNhbGxiYWNrID0gbG9jYWxzOyBsb2NhbHMgPSBudWxsOyB9XG5cbiAgLy8gRGVmYXVsdCBhcmd1bWVudHNcbiAgbmFtZSA9IG5hbWUgfHwgJ2xpYnJhcnknO1xuICBsb2NhbHMgPSBsb2NhbHMgfHwge307XG5cbiAgbG9jYWxzID0gdGhpcy5sb2NhbHMobG9jYWxzKTtcbiAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZXNbbmFtZV07XG4gIGlmICghdGVtcGxhdGUpIHRocm93IG5ldyBFcnJvcihmbXQoJ3RlbXBsYXRlIFwiJXNcIiBub3QgZGVmaW5lZC4nLCBuYW1lKSk7XG4gIHZhciBhdHRycyA9IHJlbmRlcih0ZW1wbGF0ZSwgbG9jYWxzKTtcbiAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBlbDtcblxuICBzd2l0Y2ggKHRlbXBsYXRlLnR5cGUpIHtcbiAgICBjYXNlICdpbWcnOlxuICAgICAgYXR0cnMud2lkdGggPSAxO1xuICAgICAgYXR0cnMuaGVpZ2h0ID0gMTtcbiAgICAgIGVsID0gbG9hZEltYWdlKGF0dHJzLCBjYWxsYmFjayk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdzY3JpcHQnOlxuICAgICAgZWwgPSBsb2FkU2NyaXB0KGF0dHJzLCBmdW5jdGlvbihlcnIpe1xuICAgICAgICBpZiAoIWVycikgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIHNlbGYuZGVidWcoJ2Vycm9yIGxvYWRpbmcgXCIlc1wiIGVycm9yPVwiJXNcIicsIHNlbGYubmFtZSwgZXJyKTtcbiAgICAgIH0pO1xuICAgICAgLy8gVE9ETzogaGFjayB1bnRpbCByZWZhY3RvcmluZyBsb2FkLXNjcmlwdFxuICAgICAgZGVsZXRlIGF0dHJzLnNyYztcbiAgICAgIGVhY2goYXR0cnMsIGZ1bmN0aW9uKGtleSwgdmFsKXtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKGtleSwgdmFsKTtcbiAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgIGVsID0gbG9hZElmcmFtZShhdHRycywgY2FsbGJhY2spO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIE5vIGRlZmF1bHQgY2FzZVxuICB9XG5cbiAgcmV0dXJuIGVsO1xufTtcblxuLyoqXG4gKiBMb2NhbHMgZm9yIHRhZyB0ZW1wbGF0ZXMuXG4gKlxuICogQnkgZGVmYXVsdCBpdCBpbmNsdWRlcyBhIGNhY2hlIGJ1c3RlciBhbmQgYWxsIG9mIHRoZSBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbbG9jYWxzXVxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmV4cG9ydHMubG9jYWxzID0gZnVuY3Rpb24obG9jYWxzKXtcbiAgbG9jYWxzID0gbG9jYWxzIHx8IHt9O1xuICB2YXIgY2FjaGUgPSBNYXRoLmZsb29yKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMzYwMDAwMCk7XG4gIGlmICghbG9jYWxzLmhhc093blByb3BlcnR5KCdjYWNoZScpKSBsb2NhbHMuY2FjaGUgPSBjYWNoZTtcbiAgZWFjaCh0aGlzLm9wdGlvbnMsIGZ1bmN0aW9uKGtleSwgdmFsKXtcbiAgICBpZiAoIWxvY2Fscy5oYXNPd25Qcm9wZXJ0eShrZXkpKSBsb2NhbHNba2V5XSA9IHZhbDtcbiAgfSk7XG4gIHJldHVybiBsb2NhbHM7XG59O1xuXG4vKipcbiAqIFNpbXBsZSB3YXkgdG8gZW1pdCByZWFkeS5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMucmVhZHkgPSBmdW5jdGlvbigpe1xuICB0aGlzLmVtaXQoJ3JlYWR5Jyk7XG59O1xuXG4vKipcbiAqIFdyYXAgdGhlIGluaXRpYWxpemUgbWV0aG9kIGluIGFuIGV4aXN0cyBjaGVjaywgc28gd2UgZG9uJ3QgaGF2ZSB0byBkbyBpdCBmb3JcbiAqIGV2ZXJ5IHNpbmdsZSBpbnRlZ3JhdGlvbi5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLl93cmFwSW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCl7XG4gIHZhciBpbml0aWFsaXplID0gdGhpcy5pbml0aWFsaXplO1xuICB0aGlzLmluaXRpYWxpemUgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuZGVidWcoJ2luaXRpYWxpemUnKTtcbiAgICB0aGlzLl9pbml0aWFsaXplZCA9IHRydWU7XG4gICAgdmFyIHJldCA9IGluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB0aGlzLmVtaXQoJ2luaXRpYWxpemUnKTtcbiAgICByZXR1cm4gcmV0O1xuICB9O1xuXG4gIGlmICh0aGlzLl9hc3N1bWVzUGFnZXZpZXcpIHRoaXMuaW5pdGlhbGl6ZSA9IGFmdGVyKDIsIHRoaXMuaW5pdGlhbGl6ZSk7XG59O1xuXG4vKipcbiAqIFdyYXAgdGhlIHBhZ2UgbWV0aG9kIHRvIGNhbGwgYGluaXRpYWxpemVgIGluc3RlYWQgaWYgdGhlIGludGVncmF0aW9uIGFzc3VtZXNcbiAqIGEgcGFnZXZpZXcuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5fd3JhcFBhZ2UgPSBmdW5jdGlvbigpe1xuICB2YXIgcGFnZSA9IHRoaXMucGFnZTtcbiAgdGhpcy5wYWdlID0gZnVuY3Rpb24oKXtcbiAgICBpZiAodGhpcy5fYXNzdW1lc1BhZ2V2aWV3ICYmICF0aGlzLl9pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBwYWdlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG59O1xuXG4vKipcbiAqIFdyYXAgdGhlIHRyYWNrIG1ldGhvZCB0byBjYWxsIG90aGVyIGVjb21tZXJjZSBtZXRob2RzIGlmIGF2YWlsYWJsZSBkZXBlbmRpbmdcbiAqIG9uIHRoZSBgdHJhY2suZXZlbnQoKWAuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5fd3JhcFRyYWNrID0gZnVuY3Rpb24oKXtcbiAgdmFyIHQgPSB0aGlzLnRyYWNrO1xuICB0aGlzLnRyYWNrID0gZnVuY3Rpb24odHJhY2spe1xuICAgIHZhciBldmVudCA9IHRyYWNrLmV2ZW50KCk7XG4gICAgdmFyIGNhbGxlZDtcbiAgICB2YXIgcmV0O1xuXG4gICAgZm9yICh2YXIgbWV0aG9kIGluIGV2ZW50cykge1xuICAgICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbWV0aG9kKSkge1xuICAgICAgICB2YXIgcmVnZXhwID0gZXZlbnRzW21ldGhvZF07XG4gICAgICAgIGlmICghdGhpc1ttZXRob2RdKSBjb250aW51ZTtcbiAgICAgICAgaWYgKCFyZWdleHAudGVzdChldmVudCkpIGNvbnRpbnVlO1xuICAgICAgICByZXQgPSB0aGlzW21ldGhvZF0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFjYWxsZWQpIHJldCA9IHQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICByZXR1cm4gcmV0O1xuICB9O1xufTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgdGhlIHR5cGUgb2YgdGhlIG9wdGlvbiBwYXNzZWQgdG8gYCNtYXBgXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdHxPYmplY3RbXX0gbWFwcGluZ1xuICogQHJldHVybiB7U3RyaW5nfSBtYXBwaW5nVHlwZVxuICovXG5cbmZ1bmN0aW9uIGdldE1hcHBpbmdUeXBlKG1hcHBpbmcpIHtcbiAgaWYgKGlzLmFycmF5KG1hcHBpbmcpKSB7XG4gICAgcmV0dXJuIGV2ZXJ5KGlzTWl4ZWQsIG1hcHBpbmcpID8gJ21peGVkJyA6ICdhcnJheSc7XG4gIH1cbiAgaWYgKGlzLm9iamVjdChtYXBwaW5nKSkgcmV0dXJuICdtYXAnO1xuICByZXR1cm4gJ3Vua25vd24nO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBpdGVtIGluIG1hcHBpbmcgYXJyYXkgaXMgYSB2YWxpZCBcIm1peGVkXCIgdHlwZSB2YWx1ZVxuICpcbiAqIE11c3QgYmUgYW4gb2JqZWN0IHdpdGggcHJvcGVydGllcyBcImtleVwiIChvZiB0eXBlIHN0cmluZylcbiAqIGFuZCBcInZhbHVlXCIgKG9mIGFueSB0eXBlKVxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHsqfSBpdGVtXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZ1bmN0aW9uIGlzTWl4ZWQoaXRlbSkge1xuICBpZiAoIWlzLm9iamVjdChpdGVtKSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoIWlzLnN0cmluZyhpdGVtLmtleSkpIHJldHVybiBmYWxzZTtcbiAgaWYgKCFoYXMuY2FsbChpdGVtLCAndmFsdWUnKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBUT0RPOiBEb2N1bWVudCBtZVxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IGF0dHJzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7SW1hZ2V9XG4gKi9cblxuZnVuY3Rpb24gbG9hZEltYWdlKGF0dHJzLCBmbil7XG4gIGZuID0gZm4gfHwgZnVuY3Rpb24oKXt9O1xuICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XG4gIGltZy5vbmVycm9yID0gZXJyb3IoZm4sICdmYWlsZWQgdG8gbG9hZCBwaXhlbCcsIGltZyk7XG4gIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpeyBmbigpOyB9O1xuICBpbWcuc3JjID0gYXR0cnMuc3JjO1xuICBpbWcud2lkdGggPSAxO1xuICBpbWcuaGVpZ2h0ID0gMTtcbiAgcmV0dXJuIGltZztcbn1cblxuLyoqXG4gKiBUT0RPOiBEb2N1bWVudCBtZVxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGltZ1xuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gZXJyb3IoZm4sIG1lc3NhZ2UsIGltZyl7XG4gIHJldHVybiBmdW5jdGlvbihlKXtcbiAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICBlcnIuZXZlbnQgPSBlO1xuICAgIGVyci5zb3VyY2UgPSBpbWc7XG4gICAgZm4oZXJyKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBSZW5kZXIgdGVtcGxhdGUgKyBsb2NhbHMgaW50byBhbiBgYXR0cnNgIG9iamVjdC5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSB0ZW1wbGF0ZVxuICogQHBhcmFtIHtPYmplY3R9IGxvY2Fsc1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIHJlbmRlcih0ZW1wbGF0ZSwgbG9jYWxzKXtcbiAgcmV0dXJuIGZvbGRsKGZ1bmN0aW9uKGF0dHJzLCB2YWwsIGtleSkge1xuICAgIGF0dHJzW2tleV0gPSB2YWwucmVwbGFjZSgvXFx7XFx7XFwgKihcXHcrKVxcICpcXH1cXH0vZywgZnVuY3Rpb24oXywgJDEpe1xuICAgICAgcmV0dXJuIGxvY2Fsc1skMV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGF0dHJzO1xuICB9LCB7fSwgdGVtcGxhdGUuYXR0cnMpO1xufVxuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudHJ5IHtcbiAgdmFyIHR5cGUgPSByZXF1aXJlKCd0eXBlJyk7XG59IGNhdGNoIChlcnIpIHtcbiAgdmFyIHR5cGUgPSByZXF1aXJlKCdjb21wb25lbnQtdHlwZScpO1xufVxuXG52YXIgdG9GdW5jdGlvbiA9IHJlcXVpcmUoJ3RvLWZ1bmN0aW9uJyk7XG5cbi8qKlxuICogSE9QIHJlZmVyZW5jZS5cbiAqL1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBJdGVyYXRlIHRoZSBnaXZlbiBgb2JqYCBhbmQgaW52b2tlIGBmbih2YWwsIGkpYFxuICogaW4gb3B0aW9uYWwgY29udGV4dCBgY3R4YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheXxPYmplY3R9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY3R4XVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgZm4sIGN0eCl7XG4gIGZuID0gdG9GdW5jdGlvbihmbik7XG4gIGN0eCA9IGN0eCB8fCB0aGlzO1xuICBzd2l0Y2ggKHR5cGUob2JqKSkge1xuICAgIGNhc2UgJ2FycmF5JzpcbiAgICAgIHJldHVybiBhcnJheShvYmosIGZuLCBjdHgpO1xuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICBpZiAoJ251bWJlcicgPT0gdHlwZW9mIG9iai5sZW5ndGgpIHJldHVybiBhcnJheShvYmosIGZuLCBjdHgpO1xuICAgICAgcmV0dXJuIG9iamVjdChvYmosIGZuLCBjdHgpO1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gc3RyaW5nKG9iaiwgZm4sIGN0eCk7XG4gIH1cbn07XG5cbi8qKlxuICogSXRlcmF0ZSBzdHJpbmcgY2hhcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjdHhcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHN0cmluZyhvYmosIGZuLCBjdHgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyArK2kpIHtcbiAgICBmbi5jYWxsKGN0eCwgb2JqLmNoYXJBdChpKSwgaSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlIG9iamVjdCBrZXlzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBvYmplY3Qob2JqLCBmbiwgY3R4KSB7XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzLmNhbGwob2JqLCBrZXkpKSB7XG4gICAgICBmbi5jYWxsKGN0eCwga2V5LCBvYmpba2V5XSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZSBhcnJheS1pc2guXG4gKlxuICogQHBhcmFtIHtBcnJheXxPYmplY3R9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjdHhcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGFycmF5KG9iaiwgZm4sIGN0eCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG9iai5sZW5ndGg7ICsraSkge1xuICAgIGZuLmNhbGwoY3R4LCBvYmpbaV0sIGkpO1xuICB9XG59XG4iLCJcbi8qKlxuICogdG9TdHJpbmcgcmVmLlxuICovXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKlxuICogUmV0dXJuIHRoZSB0eXBlIG9mIGB2YWxgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCl7XG4gIHN3aXRjaCAodG9TdHJpbmcuY2FsbCh2YWwpKSB7XG4gICAgY2FzZSAnW29iamVjdCBGdW5jdGlvbl0nOiByZXR1cm4gJ2Z1bmN0aW9uJztcbiAgICBjYXNlICdbb2JqZWN0IERhdGVdJzogcmV0dXJuICdkYXRlJztcbiAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOiByZXR1cm4gJ3JlZ2V4cCc7XG4gICAgY2FzZSAnW29iamVjdCBBcmd1bWVudHNdJzogcmV0dXJuICdhcmd1bWVudHMnO1xuICAgIGNhc2UgJ1tvYmplY3QgQXJyYXldJzogcmV0dXJuICdhcnJheSc7XG4gICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzogcmV0dXJuICdzdHJpbmcnO1xuICB9XG5cbiAgaWYgKHZhbCA9PT0gbnVsbCkgcmV0dXJuICdudWxsJztcbiAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIGlmICh2YWwgJiYgdmFsLm5vZGVUeXBlID09PSAxKSByZXR1cm4gJ2VsZW1lbnQnO1xuICBpZiAodmFsID09PSBPYmplY3QodmFsKSkgcmV0dXJuICdvYmplY3QnO1xuXG4gIHJldHVybiB0eXBlb2YgdmFsO1xufTtcbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHJlbW92ZWRQcm9kdWN0OiAvXlsgX10/cmVtb3ZlZFsgX10/cHJvZHVjdFsgX10/JC9pLFxuICB2aWV3ZWRQcm9kdWN0OiAvXlsgX10/dmlld2VkWyBfXT9wcm9kdWN0WyBfXT8kL2ksXG4gIHZpZXdlZFByb2R1Y3RDYXRlZ29yeTogL15bIF9dP3ZpZXdlZFsgX10/cHJvZHVjdFsgX10/Y2F0ZWdvcnlbIF9dPyQvaSxcbiAgYWRkZWRQcm9kdWN0OiAvXlsgX10/YWRkZWRbIF9dP3Byb2R1Y3RbIF9dPyQvaSxcbiAgY29tcGxldGVkT3JkZXI6IC9eWyBfXT9jb21wbGV0ZWRbIF9dP29yZGVyWyBfXT8kL2ksXG4gIHN0YXJ0ZWRPcmRlcjogL15bIF9dP3N0YXJ0ZWRbIF9dP29yZGVyWyBfXT8kL2ksXG4gIHVwZGF0ZWRPcmRlcjogL15bIF9dP3VwZGF0ZWRbIF9dP29yZGVyWyBfXT8kL2ksXG4gIHJlZnVuZGVkT3JkZXI6IC9eWyBfXT9yZWZ1bmRlZD9bIF9dP29yZGVyWyBfXT8kL2ksXG4gIHZpZXdlZFByb2R1Y3REZXRhaWxzOiAvXlsgX10/dmlld2VkWyBfXT9wcm9kdWN0WyBfXT9kZXRhaWxzP1sgX10/JC9pLFxuICBjbGlja2VkUHJvZHVjdDogL15bIF9dP2NsaWNrZWRbIF9dP3Byb2R1Y3RbIF9dPyQvaSxcbiAgdmlld2VkUHJvbW90aW9uOiAvXlsgX10/dmlld2VkWyBfXT9wcm9tb3Rpb24/WyBfXT8kL2ksXG4gIGNsaWNrZWRQcm9tb3Rpb246IC9eWyBfXT9jbGlja2VkWyBfXT9wcm9tb3Rpb24/WyBfXT8kL2ksXG4gIHZpZXdlZENoZWNrb3V0U3RlcDogL15bIF9dP3ZpZXdlZFsgX10/Y2hlY2tvdXRbIF9dP3N0ZXBbIF9dPyQvaSxcbiAgY29tcGxldGVkQ2hlY2tvdXRTdGVwOiAvXlsgX10/Y29tcGxldGVkWyBfXT9jaGVja291dFsgX10/c3RlcFsgX10/JC9pXG59O1xuIiwiXG4vKipcbiAqIHRvU3RyaW5nLlxuICovXG5cbnZhciB0b1N0cmluZyA9IHdpbmRvdy5KU09OXG4gID8gSlNPTi5zdHJpbmdpZnlcbiAgOiBmdW5jdGlvbihfKXsgcmV0dXJuIFN0cmluZyhfKTsgfTtcblxuLyoqXG4gKiBFeHBvcnQgYGZtdGBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZtdDtcblxuLyoqXG4gKiBGb3JtYXR0ZXJzXG4gKi9cblxuZm10Lm8gPSB0b1N0cmluZztcbmZtdC5zID0gU3RyaW5nO1xuZm10LmQgPSBwYXJzZUludDtcblxuLyoqXG4gKiBGb3JtYXQgdGhlIGdpdmVuIGBzdHJgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7Li4ufSBhcmdzXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZtdChzdHIpe1xuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgdmFyIGogPSAwO1xuXG4gIHJldHVybiBzdHIucmVwbGFjZSgvJShbYS16XSkvZ2ksIGZ1bmN0aW9uKF8sIGYpe1xuICAgIHJldHVybiBmbXRbZl1cbiAgICAgID8gZm10W2ZdKGFyZ3NbaisrXSlcbiAgICAgIDogXyArIGY7XG4gIH0pO1xufVxuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIG9ubG9hZCA9IHJlcXVpcmUoJ3NjcmlwdC1vbmxvYWQnKTtcbnZhciB0aWNrID0gcmVxdWlyZSgnbmV4dC10aWNrJyk7XG52YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcblxuLyoqXG4gKiBFeHBvc2UgYGxvYWRTY3JpcHRgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGxvYWRJZnJhbWUob3B0aW9ucywgZm4pe1xuICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignQ2FudCBsb2FkIG5vdGhpbmcuLi4nKTtcblxuICAvLyBBbGxvdyBmb3IgdGhlIHNpbXBsZXN0IGNhc2UsIGp1c3QgcGFzc2luZyBhIGBzcmNgIHN0cmluZy5cbiAgaWYgKCdzdHJpbmcnID09IHR5cGUob3B0aW9ucykpIG9wdGlvbnMgPSB7IHNyYyA6IG9wdGlvbnMgfTtcblxuICB2YXIgaHR0cHMgPSBkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2h0dHBzOicgfHxcbiAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2wgPT09ICdjaHJvbWUtZXh0ZW5zaW9uOic7XG5cbiAgLy8gSWYgeW91IHVzZSBwcm90b2NvbCByZWxhdGl2ZSBVUkxzLCB0aGlyZC1wYXJ0eSBzY3JpcHRzIGxpa2UgR29vZ2xlXG4gIC8vIEFuYWx5dGljcyBicmVhayB3aGVuIHRlc3Rpbmcgd2l0aCBgZmlsZTpgIHNvIHRoaXMgZml4ZXMgdGhhdC5cbiAgaWYgKG9wdGlvbnMuc3JjICYmIG9wdGlvbnMuc3JjLmluZGV4T2YoJy8vJykgPT09IDApIHtcbiAgICBvcHRpb25zLnNyYyA9IGh0dHBzID8gJ2h0dHBzOicgKyBvcHRpb25zLnNyYyA6ICdodHRwOicgKyBvcHRpb25zLnNyYztcbiAgfVxuXG4gIC8vIEFsbG93IHRoZW0gdG8gcGFzcyBpbiBkaWZmZXJlbnQgVVJMcyBkZXBlbmRpbmcgb24gdGhlIHByb3RvY29sLlxuICBpZiAoaHR0cHMgJiYgb3B0aW9ucy5odHRwcykgb3B0aW9ucy5zcmMgPSBvcHRpb25zLmh0dHBzO1xuICBlbHNlIGlmICghaHR0cHMgJiYgb3B0aW9ucy5odHRwKSBvcHRpb25zLnNyYyA9IG9wdGlvbnMuaHR0cDtcblxuICAvLyBNYWtlIHRoZSBgPGlmcmFtZT5gIGVsZW1lbnQgYW5kIGluc2VydCBpdCBiZWZvcmUgdGhlIGZpcnN0IGlmcmFtZSBvbiB0aGVcbiAgLy8gcGFnZSwgd2hpY2ggaXMgZ3VhcmFudGVlZCB0byBleGlzdCBzaW5jZSB0aGlzIEphdmFpZnJhbWUgaXMgcnVubmluZy5cbiAgdmFyIGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICBpZnJhbWUuc3JjID0gb3B0aW9ucy5zcmM7XG4gIGlmcmFtZS53aWR0aCA9IG9wdGlvbnMud2lkdGggfHwgMTtcbiAgaWZyYW1lLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0IHx8IDE7XG4gIGlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gIC8vIElmIHdlIGhhdmUgYSBmbiwgYXR0YWNoIGV2ZW50IGhhbmRsZXJzLCBldmVuIGluIElFLiBCYXNlZCBvZmYgb2ZcbiAgLy8gdGhlIFRoaXJkLVBhcnR5IEphdmFzY3JpcHQgc2NyaXB0IGxvYWRpbmcgZXhhbXBsZTpcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3RoaXJkcGFydHlqcy90aGlyZHBhcnR5anMtY29kZS9ibG9iL21hc3Rlci9leGFtcGxlcy90ZW1wbGF0ZXMvMDIvbG9hZGluZy1maWxlcy9pbmRleC5odG1sXG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGUoZm4pKSB7XG4gICAgb25sb2FkKGlmcmFtZSwgZm4pO1xuICB9XG5cbiAgdGljayhmdW5jdGlvbigpe1xuICAgIC8vIEFwcGVuZCBhZnRlciBldmVudCBsaXN0ZW5lcnMgYXJlIGF0dGFjaGVkIGZvciBJRS5cbiAgICB2YXIgZmlyc3RTY3JpcHQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF07XG4gICAgZmlyc3RTY3JpcHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoaWZyYW1lLCBmaXJzdFNjcmlwdCk7XG4gIH0pO1xuXG4gIC8vIFJldHVybiB0aGUgaWZyYW1lIGVsZW1lbnQgaW4gY2FzZSB0aGV5IHdhbnQgdG8gZG8gYW55dGhpbmcgc3BlY2lhbCwgbGlrZVxuICAvLyBnaXZlIGl0IGFuIElEIG9yIGF0dHJpYnV0ZXMuXG4gIHJldHVybiBpZnJhbWU7XG59OyIsIlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3RoaXJkcGFydHlqcy90aGlyZHBhcnR5anMtY29kZS9ibG9iL21hc3Rlci9leGFtcGxlcy90ZW1wbGF0ZXMvMDIvbG9hZGluZy1maWxlcy9pbmRleC5odG1sXG5cbi8qKlxuICogSW52b2tlIGBmbihlcnIpYCB3aGVuIHRoZSBnaXZlbiBgZWxgIHNjcmlwdCBsb2Fkcy5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsLCBmbil7XG4gIHJldHVybiBlbC5hZGRFdmVudExpc3RlbmVyXG4gICAgPyBhZGQoZWwsIGZuKVxuICAgIDogYXR0YWNoKGVsLCBmbik7XG59O1xuXG4vKipcbiAqIEFkZCBldmVudCBsaXN0ZW5lciB0byBgZWxgLCBgZm4oKWAuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGFkZChlbCwgZm4pe1xuICBlbC5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oXywgZSl7IGZuKG51bGwsIGUpOyB9LCBmYWxzZSk7XG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZnVuY3Rpb24oZSl7XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcignc2NyaXB0IGVycm9yIFwiJyArIGVsLnNyYyArICdcIicpO1xuICAgIGVyci5ldmVudCA9IGU7XG4gICAgZm4oZXJyKTtcbiAgfSwgZmFsc2UpO1xufVxuXG4vKipcbiAqIEF0dGFjaCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gYXR0YWNoKGVsLCBmbil7XG4gIGVsLmF0dGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbihlKXtcbiAgICBpZiAoIS9jb21wbGV0ZXxsb2FkZWQvLnRlc3QoZWwucmVhZHlTdGF0ZSkpIHJldHVybjtcbiAgICBmbihudWxsLCBlKTtcbiAgfSk7XG4gIGVsLmF0dGFjaEV2ZW50KCdvbmVycm9yJywgZnVuY3Rpb24oZSl7XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcignZmFpbGVkIHRvIGxvYWQgdGhlIHNjcmlwdCBcIicgKyBlbC5zcmMgKyAnXCInKTtcbiAgICBlcnIuZXZlbnQgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICBmbihlcnIpO1xuICB9KTtcbn1cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBvbmxvYWQgPSByZXF1aXJlKCdzY3JpcHQtb25sb2FkJyk7XG52YXIgdGljayA9IHJlcXVpcmUoJ25leHQtdGljaycpO1xudmFyIHR5cGUgPSByZXF1aXJlKCd0eXBlJyk7XG5cbi8qKlxuICogRXhwb3NlIGBsb2FkU2NyaXB0YC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsb2FkU2NyaXB0KG9wdGlvbnMsIGZuKXtcbiAgaWYgKCFvcHRpb25zKSB0aHJvdyBuZXcgRXJyb3IoJ0NhbnQgbG9hZCBub3RoaW5nLi4uJyk7XG5cbiAgLy8gQWxsb3cgZm9yIHRoZSBzaW1wbGVzdCBjYXNlLCBqdXN0IHBhc3NpbmcgYSBgc3JjYCBzdHJpbmcuXG4gIGlmICgnc3RyaW5nJyA9PSB0eXBlKG9wdGlvbnMpKSBvcHRpb25zID0geyBzcmMgOiBvcHRpb25zIH07XG5cbiAgdmFyIGh0dHBzID0gZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonIHx8XG4gICAgICAgICAgICAgIGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sID09PSAnY2hyb21lLWV4dGVuc2lvbjonO1xuXG4gIC8vIElmIHlvdSB1c2UgcHJvdG9jb2wgcmVsYXRpdmUgVVJMcywgdGhpcmQtcGFydHkgc2NyaXB0cyBsaWtlIEdvb2dsZVxuICAvLyBBbmFseXRpY3MgYnJlYWsgd2hlbiB0ZXN0aW5nIHdpdGggYGZpbGU6YCBzbyB0aGlzIGZpeGVzIHRoYXQuXG4gIGlmIChvcHRpb25zLnNyYyAmJiBvcHRpb25zLnNyYy5pbmRleE9mKCcvLycpID09PSAwKSB7XG4gICAgb3B0aW9ucy5zcmMgPSBodHRwcyA/ICdodHRwczonICsgb3B0aW9ucy5zcmMgOiAnaHR0cDonICsgb3B0aW9ucy5zcmM7XG4gIH1cblxuICAvLyBBbGxvdyB0aGVtIHRvIHBhc3MgaW4gZGlmZmVyZW50IFVSTHMgZGVwZW5kaW5nIG9uIHRoZSBwcm90b2NvbC5cbiAgaWYgKGh0dHBzICYmIG9wdGlvbnMuaHR0cHMpIG9wdGlvbnMuc3JjID0gb3B0aW9ucy5odHRwcztcbiAgZWxzZSBpZiAoIWh0dHBzICYmIG9wdGlvbnMuaHR0cCkgb3B0aW9ucy5zcmMgPSBvcHRpb25zLmh0dHA7XG5cbiAgLy8gTWFrZSB0aGUgYDxzY3JpcHQ+YCBlbGVtZW50IGFuZCBpbnNlcnQgaXQgYmVmb3JlIHRoZSBmaXJzdCBzY3JpcHQgb24gdGhlXG4gIC8vIHBhZ2UsIHdoaWNoIGlzIGd1YXJhbnRlZWQgdG8gZXhpc3Qgc2luY2UgdGhpcyBKYXZhc2NyaXB0IGlzIHJ1bm5pbmcuXG4gIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcbiAgc2NyaXB0LnNyYyA9IG9wdGlvbnMuc3JjO1xuXG4gIC8vIElmIHdlIGhhdmUgYSBmbiwgYXR0YWNoIGV2ZW50IGhhbmRsZXJzLCBldmVuIGluIElFLiBCYXNlZCBvZmYgb2ZcbiAgLy8gdGhlIFRoaXJkLVBhcnR5IEphdmFzY3JpcHQgc2NyaXB0IGxvYWRpbmcgZXhhbXBsZTpcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3RoaXJkcGFydHlqcy90aGlyZHBhcnR5anMtY29kZS9ibG9iL21hc3Rlci9leGFtcGxlcy90ZW1wbGF0ZXMvMDIvbG9hZGluZy1maWxlcy9pbmRleC5odG1sXG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGUoZm4pKSB7XG4gICAgb25sb2FkKHNjcmlwdCwgZm4pO1xuICB9XG5cbiAgdGljayhmdW5jdGlvbigpe1xuICAgIC8vIEFwcGVuZCBhZnRlciBldmVudCBsaXN0ZW5lcnMgYXJlIGF0dGFjaGVkIGZvciBJRS5cbiAgICB2YXIgZmlyc3RTY3JpcHQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF07XG4gICAgZmlyc3RTY3JpcHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc2NyaXB0LCBmaXJzdFNjcmlwdCk7XG4gIH0pO1xuXG4gIC8vIFJldHVybiB0aGUgc2NyaXB0IGVsZW1lbnQgaW4gY2FzZSB0aGV5IHdhbnQgdG8gZG8gYW55dGhpbmcgc3BlY2lhbCwgbGlrZVxuICAvLyBnaXZlIGl0IGFuIElEIG9yIGF0dHJpYnV0ZXMuXG4gIHJldHVybiBzY3JpcHQ7XG59OyIsIlxuLyoqXG4gKiBFeHBvc2UgYHRvTm9DYXNlYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRvTm9DYXNlO1xuXG5cbi8qKlxuICogVGVzdCB3aGV0aGVyIGEgc3RyaW5nIGlzIGNhbWVsLWNhc2UuXG4gKi9cblxudmFyIGhhc1NwYWNlID0gL1xccy87XG52YXIgaGFzU2VwYXJhdG9yID0gL1tcXFdfXS87XG5cblxuLyoqXG4gKiBSZW1vdmUgYW55IHN0YXJ0aW5nIGNhc2UgZnJvbSBhIGBzdHJpbmdgLCBsaWtlIGNhbWVsIG9yIHNuYWtlLCBidXQga2VlcFxuICogc3BhY2VzIGFuZCBwdW5jdHVhdGlvbiB0aGF0IG1heSBiZSBpbXBvcnRhbnQgb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiB0b05vQ2FzZSAoc3RyaW5nKSB7XG4gIGlmIChoYXNTcGFjZS50ZXN0KHN0cmluZykpIHJldHVybiBzdHJpbmcudG9Mb3dlckNhc2UoKTtcbiAgaWYgKGhhc1NlcGFyYXRvci50ZXN0KHN0cmluZykpIHJldHVybiB1bnNlcGFyYXRlKHN0cmluZykudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIHVuY2FtZWxpemUoc3RyaW5nKS50b0xvd2VyQ2FzZSgpO1xufVxuXG5cbi8qKlxuICogU2VwYXJhdG9yIHNwbGl0dGVyLlxuICovXG5cbnZhciBzZXBhcmF0b3JTcGxpdHRlciA9IC9bXFxXX10rKC58JCkvZztcblxuXG4vKipcbiAqIFVuLXNlcGFyYXRlIGEgYHN0cmluZ2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIHVuc2VwYXJhdGUgKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2Uoc2VwYXJhdG9yU3BsaXR0ZXIsIGZ1bmN0aW9uIChtLCBuZXh0KSB7XG4gICAgcmV0dXJuIG5leHQgPyAnICcgKyBuZXh0IDogJyc7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogQ2FtZWxjYXNlIHNwbGl0dGVyLlxuICovXG5cbnZhciBjYW1lbFNwbGl0dGVyID0gLyguKShbQS1aXSspL2c7XG5cblxuLyoqXG4gKiBVbi1jYW1lbGNhc2UgYSBgc3RyaW5nYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gdW5jYW1lbGl6ZSAoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcucmVwbGFjZShjYW1lbFNwbGl0dGVyLCBmdW5jdGlvbiAobSwgcHJldmlvdXMsIHVwcGVycykge1xuICAgIHJldHVybiBwcmV2aW91cyArICcgJyArIHVwcGVycy50b0xvd2VyQ2FzZSgpLnNwbGl0KCcnKS5qb2luKCcgJyk7XG4gIH0pO1xufSIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbi8vIEZJWE1FOiBIYWNreSB3b3JrYXJvdW5kIGZvciBEdW9cbnZhciBlYWNoOyB0cnkgeyBlYWNoID0gcmVxdWlyZSgnQG5kaG91bGUvZWFjaCcpOyB9IGNhdGNoKGUpIHsgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTsgfVxuXG4vKipcbiAqIENoZWNrIGlmIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHJldHVybnMgYHRydWVgIGZvciBhbGwgdmFsdWVzIGluIGEgYGNvbGxlY3Rpb25gLlxuICogQ2hlY2tzIG93bmVkLCBlbnVtZXJhYmxlIHZhbHVlcyBhbmQgZXhpdHMgZWFybHkgd2hlbiBgcHJlZGljYXRlYCByZXR1cm5zXG4gKiBgZmFsc2VgLlxuICpcbiAqIEBuYW1lIGV2ZXJ5XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgVGhlIGZ1bmN0aW9uIHVzZWQgdG8gdGVzdCB2YWx1ZXMuXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gc2VhcmNoLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiBhbGwgdmFsdWVzIHBhc3NlcyB0aGUgcHJlZGljYXRlIHRlc3QsIG90aGVyd2lzZSBmYWxzZS5cbiAqIEBleGFtcGxlXG4gKiB2YXIgaXNFdmVuID0gZnVuY3Rpb24obnVtKSB7IHJldHVybiBudW0gJSAyID09PSAwOyB9O1xuICpcbiAqIGV2ZXJ5KGlzRXZlbiwgW10pOyAvLyA9PiB0cnVlXG4gKiBldmVyeShpc0V2ZW4sIFsxLCAyXSk7IC8vID0+IGZhbHNlXG4gKiBldmVyeShpc0V2ZW4sIFsyLCA0LCA2XSk7IC8vID0+IHRydWVcbiAqL1xuXG52YXIgZXZlcnkgPSBmdW5jdGlvbiBldmVyeShwcmVkaWNhdGUsIGNvbGxlY3Rpb24pIHtcbiAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdgcHJlZGljYXRlYCBtdXN0IGJlIGEgZnVuY3Rpb24gYnV0IHdhcyBhICcgKyB0eXBlb2YgcHJlZGljYXRlKTtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSB0cnVlO1xuXG4gIGVhY2goZnVuY3Rpb24odmFsLCBrZXksIGNvbGxlY3Rpb24pIHtcbiAgICByZXN1bHQgPSAhIXByZWRpY2F0ZSh2YWwsIGtleSwgY29sbGVjdGlvbik7XG5cbiAgICAvLyBFeGl0IGVhcmx5XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0sIGNvbGxlY3Rpb24pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIEV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBldmVyeTtcbiIsIlxudmFyIGlzRW1wdHkgPSByZXF1aXJlKCdpcy1lbXB0eScpO1xuXG50cnkge1xuICB2YXIgdHlwZU9mID0gcmVxdWlyZSgndHlwZScpO1xufSBjYXRjaCAoZSkge1xuICB2YXIgdHlwZU9mID0gcmVxdWlyZSgnY29tcG9uZW50LXR5cGUnKTtcbn1cblxuXG4vKipcbiAqIFR5cGVzLlxuICovXG5cbnZhciB0eXBlcyA9IFtcbiAgJ2FyZ3VtZW50cycsXG4gICdhcnJheScsXG4gICdib29sZWFuJyxcbiAgJ2RhdGUnLFxuICAnZWxlbWVudCcsXG4gICdmdW5jdGlvbicsXG4gICdudWxsJyxcbiAgJ251bWJlcicsXG4gICdvYmplY3QnLFxuICAncmVnZXhwJyxcbiAgJ3N0cmluZycsXG4gICd1bmRlZmluZWQnXG5dO1xuXG5cbi8qKlxuICogRXhwb3NlIHR5cGUgY2hlY2tlcnMuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZm9yICh2YXIgaSA9IDAsIHR5cGU7IHR5cGUgPSB0eXBlc1tpXTsgaSsrKSBleHBvcnRzW3R5cGVdID0gZ2VuZXJhdGUodHlwZSk7XG5cblxuLyoqXG4gKiBBZGQgYWxpYXMgZm9yIGBmdW5jdGlvbmAgZm9yIG9sZCBicm93c2Vycy5cbiAqL1xuXG5leHBvcnRzLmZuID0gZXhwb3J0c1snZnVuY3Rpb24nXTtcblxuXG4vKipcbiAqIEV4cG9zZSBgZW1wdHlgIGNoZWNrLlxuICovXG5cbmV4cG9ydHMuZW1wdHkgPSBpc0VtcHR5O1xuXG5cbi8qKlxuICogRXhwb3NlIGBuYW5gIGNoZWNrLlxuICovXG5cbmV4cG9ydHMubmFuID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gZXhwb3J0cy5udW1iZXIodmFsKSAmJiB2YWwgIT0gdmFsO1xufTtcblxuXG4vKipcbiAqIEdlbmVyYXRlIGEgdHlwZSBjaGVja2VyLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5mdW5jdGlvbiBnZW5lcmF0ZSAodHlwZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGUgPT09IHR5cGVPZih2YWx1ZSk7XG4gIH07XG59IiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCdlbWl0dGVyJyk7XG52YXIgZG9taWZ5ID0gcmVxdWlyZSgnZG9taWZ5Jyk7XG52YXIgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcbnZhciBpbmNsdWRlcyA9IHJlcXVpcmUoJ2luY2x1ZGVzJyk7XG5cbi8qKlxuICogTWl4IGluIGVtaXR0ZXIuXG4gKi9cblxuLyogZXNsaW50LWRpc2FibGUgbmV3LWNhcCAqL1xuRW1pdHRlcihleHBvcnRzKTtcbi8qIGVzbGludC1lbmFibGUgbmV3LWNhcCAqL1xuXG4vKipcbiAqIEFkZCBhIG5ldyBvcHRpb24gdG8gdGhlIGludGVncmF0aW9uIGJ5IGBrZXlgIHdpdGggZGVmYXVsdCBgdmFsdWVgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKiBAcmV0dXJuIHtJbnRlZ3JhdGlvbn1cbiAqL1xuXG5leHBvcnRzLm9wdGlvbiA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpe1xuICB0aGlzLnByb3RvdHlwZS5kZWZhdWx0c1trZXldID0gdmFsdWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYSBuZXcgbWFwcGluZyBvcHRpb24uXG4gKlxuICogVGhpcyB3aWxsIGNyZWF0ZSBhIG1ldGhvZCBgbmFtZWAgdGhhdCB3aWxsIHJldHVybiBhIG1hcHBpbmcgZm9yIHlvdSB0byB1c2UuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtJbnRlZ3JhdGlvbn1cbiAqIEBleGFtcGxlXG4gKiBJbnRlZ3JhdGlvbignTXkgSW50ZWdyYXRpb24nKVxuICogICAubWFwcGluZygnZXZlbnRzJyk7XG4gKlxuICogbmV3IE15SW50ZWdyYXRpb24oKS50cmFjaygnTXkgRXZlbnQnKTtcbiAqXG4gKiAudHJhY2sgPSBmdW5jdGlvbih0cmFjayl7XG4gKiAgIHZhciBldmVudHMgPSB0aGlzLmV2ZW50cyh0cmFjay5ldmVudCgpKTtcbiAqICAgZWFjaChldmVudHMsIHNlbmQpO1xuICogIH07XG4gKi9cblxuZXhwb3J0cy5tYXBwaW5nID0gZnVuY3Rpb24obmFtZSl7XG4gIHRoaXMub3B0aW9uKG5hbWUsIFtdKTtcbiAgdGhpcy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbihrZXkpe1xuICAgIHJldHVybiB0aGlzLm1hcCh0aGlzLm9wdGlvbnNbbmFtZV0sIGtleSk7XG4gIH07XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIG5ldyBnbG9iYWwgdmFyaWFibGUgYGtleWAgb3duZWQgYnkgdGhlIGludGVncmF0aW9uLCB3aGljaCB3aWxsIGJlXG4gKiB1c2VkIHRvIHRlc3Qgd2hldGhlciB0aGUgaW50ZWdyYXRpb24gaXMgYWxyZWFkeSBvbiB0aGUgcGFnZS5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHJldHVybiB7SW50ZWdyYXRpb259XG4gKi9cblxuZXhwb3J0cy5nbG9iYWwgPSBmdW5jdGlvbihrZXkpe1xuICB0aGlzLnByb3RvdHlwZS5nbG9iYWxzLnB1c2goa2V5KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE1hcmsgdGhlIGludGVncmF0aW9uIGFzIGFzc3VtaW5nIGFuIGluaXRpYWwgcGFnZXZpZXcsIHNvIHRvIGRlZmVyIGxvYWRpbmdcbiAqIHRoZSBzY3JpcHQgdW50aWwgdGhlIGZpcnN0IGBwYWdlYCBjYWxsLCBub29wIHRoZSBmaXJzdCBgaW5pdGlhbGl6ZWAuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEByZXR1cm4ge0ludGVncmF0aW9ufVxuICovXG5cbmV4cG9ydHMuYXNzdW1lc1BhZ2V2aWV3ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5wcm90b3R5cGUuX2Fzc3VtZXNQYWdldmlldyA9IHRydWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNYXJrIHRoZSBpbnRlZ3JhdGlvbiBhcyBiZWluZyBcInJlYWR5XCIgb25jZSBgbG9hZGAgaXMgY2FsbGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAcmV0dXJuIHtJbnRlZ3JhdGlvbn1cbiAqL1xuXG5leHBvcnRzLnJlYWR5T25Mb2FkID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5wcm90b3R5cGUuX3JlYWR5T25Mb2FkID0gdHJ1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE1hcmsgdGhlIGludGVncmF0aW9uIGFzIGJlaW5nIFwicmVhZHlcIiBvbmNlIGBpbml0aWFsaXplYCBpcyBjYWxsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEByZXR1cm4ge0ludGVncmF0aW9ufVxuICovXG5cbmV4cG9ydHMucmVhZHlPbkluaXRpYWxpemUgPSBmdW5jdGlvbigpe1xuICB0aGlzLnByb3RvdHlwZS5fcmVhZHlPbkluaXRpYWxpemUgPSB0cnVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGVmaW5lIGEgdGFnIHRvIGJlIGxvYWRlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lPSdsaWJyYXJ5J10gQSBuaWNlbmFtZSBmb3IgdGhlIHRhZywgY29tbW9ubHkgdXNlZCBpblxuICogI2xvYWQuIEhlbHBmdWwgd2hlbiB0aGUgaW50ZWdyYXRpb24gaGFzIG11bHRpcGxlIHRhZ3MgYW5kIHlvdSBuZWVkIGEgd2F5IHRvXG4gKiBzcGVjaWZ5IHdoaWNoIG9mIHRoZSB0YWdzIHlvdSB3YW50IHRvIGxvYWQgYXQgYSBnaXZlbiB0aW1lLlxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBET00gdGFnIGFzIHN0cmluZyBvciBVUkwuXG4gKiBAcmV0dXJuIHtJbnRlZ3JhdGlvbn1cbiAqL1xuXG5leHBvcnRzLnRhZyA9IGZ1bmN0aW9uKG5hbWUsIHRhZyl7XG4gIGlmICh0YWcgPT0gbnVsbCkge1xuICAgIHRhZyA9IG5hbWU7XG4gICAgbmFtZSA9ICdsaWJyYXJ5JztcbiAgfVxuICB0aGlzLnByb3RvdHlwZS50ZW1wbGF0ZXNbbmFtZV0gPSBvYmplY3RpZnkodGFnKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdpdmVuIGEgc3RyaW5nLCBnaXZlIGJhY2sgRE9NIGF0dHJpYnV0ZXMuXG4gKlxuICogRG8gaXQgaW4gYSB3YXkgd2hlcmUgdGhlIGJyb3dzZXIgZG9lc24ndCBsb2FkIGltYWdlcyBvciBpZnJhbWVzLiBJdCB0dXJuc1xuICogb3V0IGRvbWlmeSB3aWxsIGxvYWQgaW1hZ2VzL2lmcmFtZXMgYmVjYXVzZSB3aGVuZXZlciB5b3UgY29uc3RydWN0IHRob3NlXG4gKiBET00gZWxlbWVudHMsIHRoZSBicm93c2VyIGltbWVkaWF0ZWx5IGxvYWRzIHRoZW0uXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuZnVuY3Rpb24gb2JqZWN0aWZ5KHN0cikge1xuICAvLyByZXBsYWNlIGBzcmNgIHdpdGggYGRhdGEtc3JjYCB0byBwcmV2ZW50IGltYWdlIGxvYWRpbmdcbiAgc3RyID0gc3RyLnJlcGxhY2UoJyBzcmM9XCInLCAnIGRhdGEtc3JjPVwiJyk7XG5cbiAgdmFyIGVsID0gZG9taWZ5KHN0cik7XG4gIHZhciBhdHRycyA9IHt9O1xuXG4gIGVhY2goZWwuYXR0cmlidXRlcywgZnVuY3Rpb24oYXR0cil7XG4gICAgLy8gdGhlbiByZXBsYWNlIGl0IGJhY2tcbiAgICB2YXIgbmFtZSA9IGF0dHIubmFtZSA9PT0gJ2RhdGEtc3JjJyA/ICdzcmMnIDogYXR0ci5uYW1lO1xuICAgIGlmICghaW5jbHVkZXMoYXR0ci5uYW1lICsgJz0nLCBzdHIpKSByZXR1cm47XG4gICAgYXR0cnNbbmFtZV0gPSBhdHRyLnZhbHVlO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKSxcbiAgICBhdHRyczogYXR0cnNcbiAgfTtcbn1cbiIsIlxuLyoqXG4gKiBFeHBvc2UgYHBhcnNlYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlO1xuXG4vKipcbiAqIFRlc3RzIGZvciBicm93c2VyIHN1cHBvcnQuXG4gKi9cblxudmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuLy8gU2V0dXBcbmRpdi5pbm5lckhUTUwgPSAnICA8bGluay8+PHRhYmxlPjwvdGFibGU+PGEgaHJlZj1cIi9hXCI+YTwvYT48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIvPic7XG4vLyBNYWtlIHN1cmUgdGhhdCBsaW5rIGVsZW1lbnRzIGdldCBzZXJpYWxpemVkIGNvcnJlY3RseSBieSBpbm5lckhUTUxcbi8vIFRoaXMgcmVxdWlyZXMgYSB3cmFwcGVyIGVsZW1lbnQgaW4gSUVcbnZhciBpbm5lckhUTUxCdWcgPSAhZGl2LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdsaW5rJykubGVuZ3RoO1xuZGl2ID0gdW5kZWZpbmVkO1xuXG4vKipcbiAqIFdyYXAgbWFwIGZyb20ganF1ZXJ5LlxuICovXG5cbnZhciBtYXAgPSB7XG4gIGxlZ2VuZDogWzEsICc8ZmllbGRzZXQ+JywgJzwvZmllbGRzZXQ+J10sXG4gIHRyOiBbMiwgJzx0YWJsZT48dGJvZHk+JywgJzwvdGJvZHk+PC90YWJsZT4nXSxcbiAgY29sOiBbMiwgJzx0YWJsZT48dGJvZHk+PC90Ym9keT48Y29sZ3JvdXA+JywgJzwvY29sZ3JvdXA+PC90YWJsZT4nXSxcbiAgLy8gZm9yIHNjcmlwdC9saW5rL3N0eWxlIHRhZ3MgdG8gd29yayBpbiBJRTYtOCwgeW91IGhhdmUgdG8gd3JhcFxuICAvLyBpbiBhIGRpdiB3aXRoIGEgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyIGluIGZyb250LCBoYSFcbiAgX2RlZmF1bHQ6IGlubmVySFRNTEJ1ZyA/IFsxLCAnWDxkaXY+JywgJzwvZGl2PiddIDogWzAsICcnLCAnJ11cbn07XG5cbm1hcC50ZCA9XG5tYXAudGggPSBbMywgJzx0YWJsZT48dGJvZHk+PHRyPicsICc8L3RyPjwvdGJvZHk+PC90YWJsZT4nXTtcblxubWFwLm9wdGlvbiA9XG5tYXAub3B0Z3JvdXAgPSBbMSwgJzxzZWxlY3QgbXVsdGlwbGU9XCJtdWx0aXBsZVwiPicsICc8L3NlbGVjdD4nXTtcblxubWFwLnRoZWFkID1cbm1hcC50Ym9keSA9XG5tYXAuY29sZ3JvdXAgPVxubWFwLmNhcHRpb24gPVxubWFwLnRmb290ID0gWzEsICc8dGFibGU+JywgJzwvdGFibGU+J107XG5cbm1hcC5wb2x5bGluZSA9XG5tYXAuZWxsaXBzZSA9XG5tYXAucG9seWdvbiA9XG5tYXAuY2lyY2xlID1cbm1hcC50ZXh0ID1cbm1hcC5saW5lID1cbm1hcC5wYXRoID1cbm1hcC5yZWN0ID1cbm1hcC5nID0gWzEsICc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2ZXJzaW9uPVwiMS4xXCI+JywnPC9zdmc+J107XG5cbi8qKlxuICogUGFyc2UgYGh0bWxgIGFuZCByZXR1cm4gYSBET00gTm9kZSBpbnN0YW5jZSwgd2hpY2ggY291bGQgYmUgYSBUZXh0Tm9kZSxcbiAqIEhUTUwgRE9NIE5vZGUgb2Ygc29tZSBraW5kICg8ZGl2PiBmb3IgZXhhbXBsZSksIG9yIGEgRG9jdW1lbnRGcmFnbWVudFxuICogaW5zdGFuY2UsIGRlcGVuZGluZyBvbiB0aGUgY29udGVudHMgb2YgdGhlIGBodG1sYCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGh0bWwgLSBIVE1MIHN0cmluZyB0byBcImRvbWlmeVwiXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgLSBUaGUgYGRvY3VtZW50YCBpbnN0YW5jZSB0byBjcmVhdGUgdGhlIE5vZGUgZm9yXG4gKiBAcmV0dXJuIHtET01Ob2RlfSB0aGUgVGV4dE5vZGUsIERPTSBOb2RlLCBvciBEb2N1bWVudEZyYWdtZW50IGluc3RhbmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShodG1sLCBkb2MpIHtcbiAgaWYgKCdzdHJpbmcnICE9IHR5cGVvZiBodG1sKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdHJpbmcgZXhwZWN0ZWQnKTtcblxuICAvLyBkZWZhdWx0IHRvIHRoZSBnbG9iYWwgYGRvY3VtZW50YCBvYmplY3RcbiAgaWYgKCFkb2MpIGRvYyA9IGRvY3VtZW50O1xuXG4gIC8vIHRhZyBuYW1lXG4gIHZhciBtID0gLzwoW1xcdzpdKykvLmV4ZWMoaHRtbCk7XG4gIGlmICghbSkgcmV0dXJuIGRvYy5jcmVhdGVUZXh0Tm9kZShodG1sKTtcblxuICBodG1sID0gaHRtbC5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7IC8vIFJlbW92ZSBsZWFkaW5nL3RyYWlsaW5nIHdoaXRlc3BhY2VcblxuICB2YXIgdGFnID0gbVsxXTtcblxuICAvLyBib2R5IHN1cHBvcnRcbiAgaWYgKHRhZyA9PSAnYm9keScpIHtcbiAgICB2YXIgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCgnaHRtbCcpO1xuICAgIGVsLmlubmVySFRNTCA9IGh0bWw7XG4gICAgcmV0dXJuIGVsLnJlbW92ZUNoaWxkKGVsLmxhc3RDaGlsZCk7XG4gIH1cblxuICAvLyB3cmFwIG1hcFxuICB2YXIgd3JhcCA9IG1hcFt0YWddIHx8IG1hcC5fZGVmYXVsdDtcbiAgdmFyIGRlcHRoID0gd3JhcFswXTtcbiAgdmFyIHByZWZpeCA9IHdyYXBbMV07XG4gIHZhciBzdWZmaXggPSB3cmFwWzJdO1xuICB2YXIgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGVsLmlubmVySFRNTCA9IHByZWZpeCArIGh0bWwgKyBzdWZmaXg7XG4gIHdoaWxlIChkZXB0aC0tKSBlbCA9IGVsLmxhc3RDaGlsZDtcblxuICAvLyBvbmUgZWxlbWVudFxuICBpZiAoZWwuZmlyc3RDaGlsZCA9PSBlbC5sYXN0Q2hpbGQpIHtcbiAgICByZXR1cm4gZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZCk7XG4gIH1cblxuICAvLyBzZXZlcmFsIGVsZW1lbnRzXG4gIHZhciBmcmFnbWVudCA9IGRvYy5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gIHdoaWxlIChlbC5maXJzdENoaWxkKSB7XG4gICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZCkpO1xuICB9XG5cbiAgcmV0dXJuIGZyYWdtZW50O1xufVxuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGNsZWFyQWpheCA9IHJlcXVpcmUoJ2NsZWFyLWFqYXgnKTtcbnZhciBjbGVhclRpbWVvdXRzID0gcmVxdWlyZSgnY2xlYXItdGltZW91dHMnKTtcbnZhciBjbGVhckludGVydmFscyA9IHJlcXVpcmUoJ2NsZWFyLWludGVydmFscycpO1xudmFyIGNsZWFyTGlzdGVuZXJzID0gcmVxdWlyZSgnY2xlYXItbGlzdGVuZXJzJyk7XG52YXIgY2xlYXJHbG9iYWxzID0gcmVxdWlyZSgnY2xlYXItZ2xvYmFscycpO1xudmFyIGNsZWFySW1hZ2VzID0gcmVxdWlyZSgnY2xlYXItaW1hZ2VzJyk7XG52YXIgY2xlYXJTY3JpcHRzID0gcmVxdWlyZSgnY2xlYXItc2NyaXB0cycpO1xudmFyIGNsZWFyQ29va2llcyA9IHJlcXVpcmUoJ2NsZWFyLWNvb2tpZXMnKTtcblxuLyoqXG4gKiBSZXNldCBpbml0aWFsIHN0YXRlLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuICBjbGVhckFqYXgoKTtcbiAgY2xlYXJUaW1lb3V0cygpO1xuICBjbGVhckludGVydmFscygpO1xuICBjbGVhckxpc3RlbmVycygpO1xuICBjbGVhckdsb2JhbHMoKTtcbiAgY2xlYXJJbWFnZXMoKTtcbiAgY2xlYXJTY3JpcHRzKCk7XG4gIGNsZWFyQ29va2llcygpO1xufTsiLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcblxuLyoqXG4gKiBPcmlnaW5hbCBzZW5kIG1ldGhvZC5cbiAqL1xuXG52YXIgc2VuZCA9IFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5zZW5kO1xuXG4vKipcbiAqIFJlcXVlc3RzIG1hZGUuXG4gKi9cblxudmFyIHJlcXVlc3RzID0gW107XG5cbi8qKlxuICogQ2xlYXIgYWxsIGFjdGl2ZSBBSkFYIHJlcXVlc3RzLlxuICogXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG4gIGVhY2gocmVxdWVzdHMsIGZ1bmN0aW9uKHJlcXVlc3Qpe1xuICAgIHRyeSB7XG4gICAgICByZXF1ZXN0Lm9ubG9hZCA9IG5vb3A7XG4gICAgICByZXF1ZXN0Lm9uZXJyb3IgPSBub29wO1xuICAgICAgcmVxdWVzdC5vbmFib3J0ID0gbm9vcDtcbiAgICAgIHJlcXVlc3QuYWJvcnQoKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICB9KTtcbiAgcmVxdWVzdHMubGVuZ3RoID0gW107XG59O1xuXG4vKipcbiAqIENhcHR1cmUgQUpBWCByZXF1ZXN0cy5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuYmluZCA9IGZ1bmN0aW9uKCl7XG4gIFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24oKXtcbiAgICByZXF1ZXN0cy5wdXNoKHRoaXMpO1xuICAgIHJldHVybiBzZW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG59O1xuXG4vKipcbiAqIFJlc2V0IGBYTUxIdHRwUmVxdWVzdGAgYmFjayB0byBub3JtYWwuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnVuYmluZCA9IGZ1bmN0aW9uKCl7XG4gIFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5zZW5kID0gc2VuZDtcbn07XG5cbi8qKlxuICogQXV0b21hdGljYWxseSBiaW5kLlxuICovXG5cbmV4cG9ydHMuYmluZCgpO1xuXG4vKipcbiAqIE5vb3AuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbm9vcCgpe30iLCJcbi8qKlxuICogUHJldmlvdXNcbiAqL1xuXG52YXIgcHJldiA9IDA7XG5cbi8qKlxuICogTm9vcFxuICovXG5cbnZhciBub29wID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4vKipcbiAqIENsZWFyIGFsbCB0aW1lb3V0c1xuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuICB2YXIgdG1wLCBpO1xuICB0bXAgPSBpID0gc2V0VGltZW91dChub29wKTtcbiAgd2hpbGUgKHByZXYgPCBpKSBjbGVhclRpbWVvdXQoaS0tKTtcbiAgcHJldiA9IHRtcDtcbn07XG4iLCJcbi8qKlxuICogUHJldlxuICovXG5cbnZhciBwcmV2ID0gMDtcblxuLyoqXG4gKiBOb29wXG4gKi9cblxudmFyIG5vb3AgPSBGdW5jdGlvbi5wcm90b3R5cGU7XG5cbi8qKlxuICogQ2xlYXIgYWxsIGludGVydmFscy5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcbiAgdmFyIHRtcCwgaTtcbiAgdG1wID0gaSA9IHNldEludGVydmFsKG5vb3ApO1xuICB3aGlsZSAocHJldiA8IGkpIGNsZWFySW50ZXJ2YWwoaS0tKTtcbiAgcHJldiA9IHRtcDtcbn07XG4iLCJcbi8qKlxuICogV2luZG93IGV2ZW50IGxpc3RlbmVycy5cbiAqL1xuXG52YXIgbGlzdGVuZXJzID0gW107XG5cbi8qKlxuICogT3JpZ2luYWwgd2luZG93IGZ1bmN0aW9ucy5cbiAqL1xuXG52YXIgb24gPSB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciA/ICdhZGRFdmVudExpc3RlbmVyJyA6ICdhdHRhY2hFdmVudCc7XG52YXIgb2ZmID0gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgPyAncmVtb3ZlRXZlbnRMaXN0ZW5lcicgOiAnZGV0YWNoRXZlbnQnO1xudmFyIG9uRm4gPSB3aW5kb3dbb25dO1xudmFyIG9mZkZuID0gd2luZG93W29mZl07XG5cbi8qKlxuICogQ2xlYXIgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcbiAgdmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgd2luZG93W29uXS5hcHBseVxuICAgICAgPyB3aW5kb3dbb25dLmFwcGx5KHdpbmRvdywgbGlzdGVuZXJzW2ldKVxuICAgICAgOiB3aW5kb3dbb25dKGxpc3RlbmVyc1tpXVswXSwgbGlzdGVuZXJzW2ldWzFdKTsgLy8gSUVcbiAgfVxuICBsaXN0ZW5lcnMubGVuZ3RoID0gMDtcbn07XG5cbi8qKlxuICogV3JhcCB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciBhbmQgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXJcbiAqIHRvIGJlIGFibGUgdG8gY2xlYW51cCBhbGwgZXZlbnQgbGlzdGVuZXJzIGZvciB0ZXN0aW5nLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5iaW5kID0gZnVuY3Rpb24oKXtcbiAgd2luZG93W29uXSA9IGZ1bmN0aW9uKCl7XG4gICAgbGlzdGVuZXJzLnB1c2goYXJndW1lbnRzKTtcbiAgICByZXR1cm4gb25Gbi5hcHBseVxuICAgICAgPyBvbkZuLmFwcGx5KHdpbmRvdywgYXJndW1lbnRzKVxuICAgICAgOiBvbkZuKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKTsgLy8gSUVcbiAgfTtcblxuICB3aW5kb3dbb2ZmXSA9IGZ1bmN0aW9uKG5hbWUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKXtcbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgIGlmIChuYW1lICE9PSBsaXN0ZW5lcnNbaV1bMF0pIGNvbnRpbnVlO1xuICAgICAgaWYgKGxpc3RlbmVyICE9PSBsaXN0ZW5lcnNbaV1bMV0pIGNvbnRpbnVlO1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIHVzZUNhcHR1cmUgIT09IGxpc3RlbmVyc1tpXVsyXSkgY29udGludWU7XG4gICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBvZmZGbi5hcHBseVxuICAgICAgPyBvZmZGbi5hcHBseSh3aW5kb3csIGFyZ3VtZW50cylcbiAgICAgIDogb2ZmRm4oYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pOyAvLyBJRVxuICB9O1xufTtcblxuXG4vKipcbiAqIFJlc2V0IHdpbmRvdyBiYWNrIHRvIG5vcm1hbC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMudW5iaW5kID0gZnVuY3Rpb24oKXtcbiAgbGlzdGVuZXJzLmxlbmd0aCA9IDA7XG4gIHdpbmRvd1tvbl0gPSBvbkZuO1xuICB3aW5kb3dbb2ZmXSA9IG9mZkZuO1xufTtcblxuLyoqXG4gKiBBdXRvbWF0aWNhbGx5IG92ZXJyaWRlLlxuICovXG5cbmV4cG9ydHMuYmluZCgpOyIsIlxuLyoqXG4gKiBPYmplY3RzIHdlIHdhbnQgdG8ga2VlcCB0cmFjayBvZiBpbml0aWFsIHByb3BlcnRpZXMgZm9yLlxuICovXG5cbnZhciBnbG9iYWxzID0ge1xuICAnd2luZG93Jzoge30sXG4gICdkb2N1bWVudCc6IHt9LFxuICAnWE1MSHR0cFJlcXVlc3QnOiB7fVxufTtcblxuLyoqXG4gKiBDYXB0dXJlIGluaXRpYWwgc3RhdGUgb2YgYHdpbmRvd2AuXG4gKlxuICogTm90ZSwgYHdpbmRvdy5hZGRFdmVudExpc3RlbmVyYCBpcyBvdmVycml0dGVuIGFscmVhZHksXG4gKiBmcm9tIGBjbGVhckxpc3RlbmVyc2AuIEJ1dCB0aGlzIGlzIGRlc2lyZWQgYmVoYXZpb3IuXG4gKi9cblxuZ2xvYmFscy53aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyO1xuZ2xvYmFscy53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciA9IHdpbmRvdy5hZGRFdmVudExpc3RlbmVyO1xuZ2xvYmFscy53aW5kb3cuc2V0VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0O1xuZ2xvYmFscy53aW5kb3cuc2V0SW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWw7XG5nbG9iYWxzLndpbmRvdy5vbmVycm9yID0gbnVsbDtcbmdsb2JhbHMud2luZG93Lm9ubG9hZCA9IG51bGw7XG5cbi8qKlxuICogQ2FwdHVyZSBpbml0aWFsIHN0YXRlIG9mIGBkb2N1bWVudGAuXG4gKi9cblxuZ2xvYmFscy5kb2N1bWVudC53cml0ZSA9IGRvY3VtZW50LndyaXRlO1xuZ2xvYmFscy5kb2N1bWVudC5hcHBlbmRDaGlsZCA9IGRvY3VtZW50LmFwcGVuZENoaWxkO1xuZ2xvYmFscy5kb2N1bWVudC5yZW1vdmVDaGlsZCA9IGRvY3VtZW50LnJlbW92ZUNoaWxkO1xuXG4vKipcbiAqIENhcHR1cmUgdGhlIGluaXRpYWwgc3RhdGUgb2YgYFhNTEh0dHBSZXF1ZXN0YC5cbiAqL1xuXG5pZiAoJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIFhNTEh0dHBSZXF1ZXN0KSB7XG4gIGdsb2JhbHMuWE1MSHR0cFJlcXVlc3Qub3BlbiA9IFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5vcGVuO1xufVxuXG4vKipcbiAqIFJlc2V0IGluaXRpYWwgc3RhdGUuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG4gIGNvcHkoZ2xvYmFscy53aW5kb3csIHdpbmRvdyk7XG4gIGNvcHkoZ2xvYmFscy5YTUxIdHRwUmVxdWVzdCwgWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlKTtcbiAgY29weShnbG9iYWxzLmRvY3VtZW50LCBkb2N1bWVudCk7XG59O1xuXG4vKipcbiAqIFJlc2V0IHByb3BlcnRpZXMgb24gb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2VcbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvcHkoc291cmNlLCB0YXJnZXQpe1xuICBmb3IgKHZhciBuYW1lIGluIHNvdXJjZSkge1xuICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgIHRhcmdldFtuYW1lXSA9IHNvdXJjZVtuYW1lXTtcbiAgICB9XG4gIH1cbn0iLCJcbi8qKlxuICogQ3JlYXRlZCBpbWFnZXMuXG4gKi9cblxudmFyIGltYWdlcyA9IFtdO1xuXG4vKipcbiAqIEtlZXAgdHJhY2sgb2Ygb3JpZ2luYWwgYEltYWdlYC5cbiAqL1xuXG52YXIgT3JpZ2luYWwgPSB3aW5kb3cuSW1hZ2U7XG5cbi8qKlxuICogSW1hZ2Ugb3ZlcnJpZGUgdGhhdCBrZWVwcyB0cmFjayBvZiBpbWFnZXMuXG4gKlxuICogQ2FyZWZ1bCB0aG91Z2gsIGBpbWcgaW5zdGFuY2UgT3ZlcnJpZGVgIGlzbid0IHRydWUuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gT3ZlcnJpZGUoKSB7XG4gIHZhciBpbWcgPSBuZXcgT3JpZ2luYWw7XG4gIGltYWdlcy5wdXNoKGltZyk7XG4gIHJldHVybiBpbWc7XG59XG5cbi8qKlxuICogQ2xlYXIgYG9ubG9hZGAgZm9yIGVhY2ggaW1hZ2UuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuICB2YXIgbm9vcCA9IGZ1bmN0aW9uKCl7fTtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSBpbWFnZXMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgaW1hZ2VzW2ldLm9ubG9hZCA9IG5vb3A7XG4gIH1cbiAgaW1hZ2VzLmxlbmd0aCA9IDA7XG59O1xuXG4vKipcbiAqIE92ZXJyaWRlIGB3aW5kb3cuSW1hZ2VgIHRvIGtlZXAgdHJhY2sgb2YgaW1hZ2VzLFxuICogc28gd2UgY2FuIGNsZWFyIGBvbmxvYWRgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5iaW5kID0gZnVuY3Rpb24oKXtcbiAgd2luZG93LkltYWdlID0gT3ZlcnJpZGU7XG59O1xuXG4vKipcbiAqIFNldCBgd2luZG93LkltYWdlYCBiYWNrIHRvIG5vcm1hbC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMudW5iaW5kID0gZnVuY3Rpb24oKXtcbiAgd2luZG93LkltYWdlID0gT3JpZ2luYWw7XG4gIGltYWdlcy5sZW5ndGggPSAwO1xufTtcblxuLyoqXG4gKiBBdXRvbWF0aWNhbGx5IG92ZXJyaWRlLlxuICovXG5cbmV4cG9ydHMuYmluZCgpOyIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBpbmRleE9mID0gcmVxdWlyZSgnaW5kZXhvZicpO1xudmFyIHF1ZXJ5ID0gcmVxdWlyZSgncXVlcnknKTtcbnZhciBlYWNoID0gcmVxdWlyZSgnZWFjaCcpO1xuXG4vKipcbiAqIEluaXRpYWwgc2NyaXB0cy5cbiAqL1xuXG52YXIgaW5pdGlhbFNjcmlwdHMgPSBbXTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIHNjcmlwdHMgbm90IGluaXRpYWxseSBwcmVzZW50LlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFttYXRjaF0gT25seSByZW1vdmUgb25lcyB0aGF0IHJldHVybiB0cnVlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1hdGNoKXtcbiAgbWF0Y2ggPSBtYXRjaCB8fCBzYXVjZWxhYnM7XG4gIHZhciBmaW5hbFNjcmlwdHMgPSBxdWVyeS5hbGwoJ3NjcmlwdCcpO1xuICBlYWNoKGZpbmFsU2NyaXB0cywgZnVuY3Rpb24oc2NyaXB0KXtcbiAgICBpZiAoLTEgIT0gaW5kZXhPZihpbml0aWFsU2NyaXB0cywgc2NyaXB0KSkgcmV0dXJuO1xuICAgIGlmICghc2NyaXB0LnBhcmVudE5vZGUpIHJldHVybjtcbiAgICBpZiAoIW1hdGNoKHNjcmlwdCkpIHJldHVybjtcbiAgICBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuICB9KTtcbn07XG5cbi8qKlxuICogQ2FwdHVyZSBpbml0aWFsIHNjcmlwdHMsIHRoZSBvbmVzIG5vdCB0byByZW1vdmUuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmJpbmQgPSBmdW5jdGlvbihzY3JpcHRzKXtcbiAgaW5pdGlhbFNjcmlwdHMgPSBzY3JpcHRzIHx8IHF1ZXJ5LmFsbCgnc2NyaXB0Jyk7XG59O1xuXG4vKipcbiAqIERlZmF1bHQgbWF0Y2hpbmcgZnVuY3Rpb24sIGlnbm9yZXMgc2F1Y2VsYWJzIGpzb25wIHNjcmlwdHMuXG4gKlxuICogQHBhcmFtIHtTY3JpcHR9IHNjcmlwdFxuICogQGFwaSBwcml2YXRlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZ1bmN0aW9uIHNhdWNlbGFicyhzY3JpcHQpIHtcbiAgcmV0dXJuICFzY3JpcHQuc3JjLm1hdGNoKC9sb2NhbHR1bm5lbFxcLm1lXFwvc2F1Y2VsYWJzfFxcL2R1b3Rlc3QvKTtcbn07XG5cbi8qKlxuICogQXV0b21hdGljYWxseSBiaW5kLlxuICovXG5cbmV4cG9ydHMuYmluZCgpO1xuIiwiZnVuY3Rpb24gb25lKHNlbGVjdG9yLCBlbCkge1xuICByZXR1cm4gZWwucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG59XG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBlbCl7XG4gIGVsID0gZWwgfHwgZG9jdW1lbnQ7XG4gIHJldHVybiBvbmUoc2VsZWN0b3IsIGVsKTtcbn07XG5cbmV4cG9ydHMuYWxsID0gZnVuY3Rpb24oc2VsZWN0b3IsIGVsKXtcbiAgZWwgPSBlbCB8fCBkb2N1bWVudDtcbiAgcmV0dXJuIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xufTtcblxuZXhwb3J0cy5lbmdpbmUgPSBmdW5jdGlvbihvYmope1xuICBpZiAoIW9iai5vbmUpIHRocm93IG5ldyBFcnJvcignLm9uZSBjYWxsYmFjayByZXF1aXJlZCcpO1xuICBpZiAoIW9iai5hbGwpIHRocm93IG5ldyBFcnJvcignLmFsbCBjYWxsYmFjayByZXF1aXJlZCcpO1xuICBvbmUgPSBvYmoub25lO1xuICBleHBvcnRzLmFsbCA9IG9iai5hbGw7XG4gIHJldHVybiBleHBvcnRzO1xufTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBjb29raWUgPSByZXF1aXJlKCdjb29raWUnKTtcblxuLyoqXG4gKiBDbGVhciBjb29raWVzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcbiAgdmFyIGNvb2tpZXMgPSBjb29raWUoKTtcbiAgZm9yICh2YXIgbmFtZSBpbiBjb29raWVzKSB7XG4gICAgY29va2llKG5hbWUsICcnLCB7IHBhdGg6ICcvJyB9KTtcbiAgfVxufTsiLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgaW5kZXhPZiA9IHJlcXVpcmUoJ2luZGV4b2YnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbnZhciBkb21pZnkgPSByZXF1aXJlKCdkb21pZnknKTtcbnZhciBzdHViID0gcmVxdWlyZSgnc3R1YicpO1xudmFyIGVhY2ggPSByZXF1aXJlKCdlYWNoJyk7XG52YXIga2V5cyA9IHJlcXVpcmUoJ2tleXMnKTtcbnZhciBmbXQgPSByZXF1aXJlKCdmbXQnKTtcbnZhciBzcHkgPSByZXF1aXJlKCdzcHknKTtcbnZhciBpcyA9IHJlcXVpcmUoJ2lzJyk7XG5cbi8qKlxuICogRXhwb3NlIGBwbHVnaW5gLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gcGx1Z2luO1xuXG4vKipcbiAqIEludGVncmF0aW9uIHRlc3RpbmcgcGx1Z2luLlxuICpcbiAqIEBwYXJhbSB7QW5hbHl0aWNzfSBhbmFseXRpY3NcbiAqL1xuXG5mdW5jdGlvbiBwbHVnaW4oYW5hbHl0aWNzKSB7XG4gIGFuYWx5dGljcy5zcGllcyA9IFtdO1xuXG4gIC8qKlxuICAgKiBTcHkgb24gYSBgbWV0aG9kYCBvZiBob3N0IGBvYmplY3RgLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RcbiAgICogQHJldHVybiB7QW5hbHl0aWNzfVxuICAgKi9cblxuICBhbmFseXRpY3Muc3B5ID0gZnVuY3Rpb24ob2JqZWN0LCBtZXRob2Qpe1xuICAgIHZhciBzID0gc3B5KG9iamVjdCwgbWV0aG9kKTtcbiAgICB0aGlzLnNwaWVzLnB1c2gocyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFN0dWIgYSBgbWV0aG9kYCBvZiBob3N0IGBvYmplY3RgLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgaW4gcGxhY2Ugb2YgdGhlIHN0dWJiZWQgbWV0aG9kLlxuICAgKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gICAqL1xuXG4gIGFuYWx5dGljcy5zdHViID0gZnVuY3Rpb24ob2JqZWN0LCBtZXRob2QsIGZuKXtcbiAgICB2YXIgcyA9IHN0dWIob2JqZWN0LCBtZXRob2QsIGZuKTtcbiAgICB0aGlzLnNwaWVzLnB1c2gocyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlc3RvcmUgYWxsIHNwaWVzLlxuICAgKlxuICAgKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gICAqL1xuXG4gIGFuYWx5dGljcy5yZXN0b3JlID0gZnVuY3Rpb24oKXtcbiAgICBlYWNoKHRoaXMuc3BpZXMsIGZ1bmN0aW9uKHNweSwgaSl7XG4gICAgICBzcHkucmVzdG9yZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuc3BpZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQXNzZXJ0IHRoYXQgYSBgc3B5YCB3YXMgY2FsbGVkIHdpdGggYGFyZ3MuLi5gXG4gICAqXG4gICAqIEBwYXJhbSB7U3B5fSBzcHlcbiAgICogQHBhcmFtIHtNaXhlZH0gYXJncy4uLiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAgICovXG5cbiAgYW5hbHl0aWNzLmNhbGxlZCA9IGZ1bmN0aW9uKHNweSl7XG4gICAgYXNzZXJ0KFxuICAgICAgfmluZGV4T2YodGhpcy5zcGllcywgc3B5KSxcbiAgICAgICdZb3UgbXVzdCBjYWxsIGAuc3B5KG9iamVjdCwgbWV0aG9kKWAgcHJpb3IgdG8gY2FsbGluZyBgLmNhbGxlZCgpYC4nXG4gICAgKTtcbiAgICBhc3NlcnQoc3B5LmNhbGxlZCwgZm10KCdFeHBlY3RlZCBcIiVzXCIgdG8gaGF2ZSBiZWVuIGNhbGxlZC4nLCBzcHkubmFtZSkpO1xuXG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKCFhcmdzLmxlbmd0aCkgcmV0dXJuIHRoaXM7XG5cbiAgICBhc3NlcnQoXG4gICAgICBzcHkuZ290LmFwcGx5KHNweSwgYXJncyksIGZtdCgnJ1xuICAgICAgKyAnRXhwZWN0ZWQgXCIlc1wiIHRvIGJlIGNhbGxlZCB3aXRoIFwiJXNcIiwgXFxuJ1xuICAgICAgKyAnYnV0IGl0IHdhcyBjYWxsZWQgd2l0aCBcIiVzXCIuJ1xuICAgICAgLCBzcHkubmFtZVxuICAgICAgLCBKU09OLnN0cmluZ2lmeShhcmdzLCBudWxsLCAyKVxuICAgICAgLCBKU09OLnN0cmluZ2lmeShzcHkuYXJnc1swXSwgbnVsbCwgMikpXG4gICAgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgdGhhdCBhIGBzcHlgIHdhcyBub3QgY2FsbGVkIHdpdGggYGFyZ3MuLi5gLlxuICAgKlxuICAgKiBAcGFyYW0ge1NweX0gc3B5XG4gICAqIEBwYXJhbSB7TWl4ZWR9IGFyZ3MuLi4gKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gICAqL1xuXG4gIGFuYWx5dGljcy5kaWROb3RDYWxsID0gZnVuY3Rpb24oc3B5KXtcbiAgICBhc3NlcnQoXG4gICAgICB+aW5kZXhPZih0aGlzLnNwaWVzLCBzcHkpLFxuICAgICAgJ1lvdSBtdXN0IGNhbGwgYC5zcHkob2JqZWN0LCBtZXRob2QpYCBwcmlvciB0byBjYWxsaW5nIGAuZGlkTm90Q2FsbCgpYC4nXG4gICAgKTtcblxuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmICghYXJncy5sZW5ndGgpIHtcbiAgICAgIGFzc2VydChcbiAgICAgICAgIXNweS5jYWxsZWQsXG4gICAgICAgIGZtdCgnRXhwZWN0ZWQgXCIlc1wiIG5vdCB0byBoYXZlIGJlZW4gY2FsbGVkLicsIHNweS5uYW1lKVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXJ0KCFzcHkuZ290LmFwcGx5KHNweSwgYXJncyksIGZtdCgnJ1xuICAgICAgICArICdFeHBlY3RlZCBcIiVzXCIgbm90IHRvIGJlIGNhbGxlZCB3aXRoIFwiJW9cIiwgJ1xuICAgICAgICArICdidXQgaXQgd2FzIGNhbGxlZCB3aXRoIFwiJW9cIi4nXG4gICAgICAgICwgc3B5Lm5hbWVcbiAgICAgICAgLCBhcmdzXG4gICAgICAgICwgc3B5LmFyZ3NbMF0pXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgdGhhdCBhIGBzcHlgIHdhcyBub3QgY2FsbGVkIDEgdGltZS5cbiAgICpcbiAgICogQHBhcmFtIHtTcHl9IHNweVxuICAgKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gICAqL1xuXG4gIGFuYWx5dGljcy5jYWxsZWRPbmNlID0gY2FsbGVkVGltZXMoMSk7XG5cbiAgLyoqXG4gICAqIEFzc2VydCB0aGF0IGEgYHNweWAgd2FzIGNhbGxlZCAyIHRpbWVzLlxuICAgKlxuICAgKiBAcGFyYW0ge1NweX0gc3B5XG4gICAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAgICovXG5cbiAgYW5hbHl0aWNzLmNhbGxlZFR3aWNlID0gY2FsbGVkVGltZXMoMik7XG5cbiAgLyoqXG4gICAqIEFzc2VydCB0aGF0IGEgYHNweWAgd2FzIGNhbGxlZCAzIHRpbWVzLlxuICAgKlxuICAgKiBAcGFyYW0ge1NweX0gc3B5XG4gICAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAgICovXG5cbiAgYW5hbHl0aWNzLmNhbGxlZFRocmljZSA9IGNhbGxlZFRpbWVzKDIpO1xuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIGZ1bmN0aW9uIGZvciBhc3NlcnRpbmcgYSBzcHlcbiAgICogd2FzIGNhbGxlZCBgbmAgdGltZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKi9cblxuICBmdW5jdGlvbiBjYWxsZWRUaW1lcyhuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNweSkge1xuICAgICAgdmFyIG0gPSBzcHkuYXJncy5sZW5ndGg7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIG4gPT0gbSxcbiAgICAgICAgZm10KCcnXG4gICAgICAgICAgKyAnRXhwZWN0ZWQgXCIlc1wiIHRvIGhhdmUgYmVlbiBjYWxsZWQgJXMgdGltZSVzLCAnXG4gICAgICAgICAgKyAnYnV0IGl0IHdhcyBvbmx5IGNhbGxlZCAlcyB0aW1lJXMuJ1xuICAgICAgICAgICwgc3B5Lm5hbWUsIG4sIDEgIT0gbiA/ICdzJyA6ICcnLCBtLCAxICE9IG0gPyAncycgOiAnJylcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydCB0aGF0IGEgYHNweWAgcmV0dXJuZWQgYHZhbHVlYC5cbiAgICpcbiAgICogQHBhcmFtIHtTcHl9IHNweVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcmV0dXJuIHtUZXN0ZXJ9XG4gICAqL1xuXG4gIGFuYWx5dGljcy5yZXR1cm5lZCA9IGZ1bmN0aW9uKHNweSwgdmFsdWUpe1xuICAgIGFzc2VydChcbiAgICAgIH5pbmRleE9mKHRoaXMuc3BpZXMsIHNweSksXG4gICAgICAnWW91IG11c3QgY2FsbCBgLnNweShvYmplY3QsIG1ldGhvZClgIHByaW9yIHRvIGNhbGxpbmcgYC5yZXR1cm5lZCgpYC4nXG4gICAgKTtcbiAgICBhc3NlcnQoXG4gICAgICBzcHkucmV0dXJuZWQodmFsdWUpLFxuICAgICAgZm10KCdFeHBlY3RlZCBcIiVzXCIgdG8gaGF2ZSByZXR1cm5lZCBcIiVvXCIuJywgc3B5Lm5hbWUsIHZhbHVlKVxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQXNzZXJ0IHRoYXQgYSBgc3B5YCBkaWQgbm90IHJldHVybiBgdmFsdWVgLlxuICAgKlxuICAgKiBAcGFyYW0ge1NweX0gc3B5XG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gICAqIEByZXR1cm4ge1Rlc3Rlcn1cbiAgICovXG5cbiAgYW5hbHl0aWNzLmRpZE5vdFJldHVybiA9IGZ1bmN0aW9uKHNweSwgdmFsdWUpe1xuICAgIGFzc2VydChcbiAgICAgIH5pbmRleE9mKHRoaXMuc3BpZXMsIHNweSksXG4gICAgICAnWW91IG11c3QgY2FsbCBgLnNweShvYmplY3QsIG1ldGhvZClgIHByaW9yIHRvIGNhbGxpbmcgYC5kaWROb3RSZXR1cm4oKWAuJ1xuICAgICk7XG4gICAgYXNzZXJ0KFxuICAgICAgIXNweS5yZXR1cm5lZCh2YWx1ZSksXG4gICAgICBmbXQoJ0V4cGVjdGVkIFwiJXNcIiBub3QgdG8gaGF2ZSByZXR1cm5lZCBcIiVvXCIuJywgc3B5Lm5hbWUsIHZhbHVlKVxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQ2FsbCBgcmVzZXRgIG9uIHRoZSBpbnRlZ3JhdGlvbi5cbiAgICpcbiAgICogQHJldHVybiB7QW5hbHl0aWNzfVxuICAgKi9cblxuICBhbmFseXRpY3MucmVzZXQgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMudXNlcigpLnJlc2V0KCk7XG4gICAgdGhpcy5ncm91cCgpLnJlc2V0KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvbXBhcmUgYGludGAgYWdhaW5zdCBgdGVzdGAuXG4gICAqXG4gICAqIFRvIGRvdWJsZS1jaGVjayB0aGF0IHRoZXkgaGF2ZSB0aGUgcmlnaHQgZGVmYXVsdHMsIGdsb2JhbHMsIGFuZCBjb25maWcuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGEgYWN0dWFsIGludGVncmF0aW9uIGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGIgdGVzdCBpbnRlZ3JhdGlvbiBjb25zdHJ1Y3RvclxuICAgKi9cblxuICBhbmFseXRpY3MuY29tcGFyZSA9IGZ1bmN0aW9uKGEsIGIpe1xuICAgIGEgPSBuZXcgYTtcbiAgICBiID0gbmV3IGI7XG4gICAgLy8gbmFtZVxuICAgIGFzc2VydChcbiAgICAgIGEubmFtZSA9PT0gYi5uYW1lLFxuICAgICAgZm10KCdFeHBlY3RlZCBuYW1lIHRvIGJlIFwiJXNcIiwgYnV0IGl0IHdhcyBcIiVzXCIuJywgYi5uYW1lLCBhLm5hbWUpXG4gICAgKTtcblxuICAgIC8vIG9wdGlvbnNcbiAgICB2YXIgeCA9IGEuZGVmYXVsdHM7XG4gICAgdmFyIHkgPSBiLmRlZmF1bHRzO1xuICAgIGZvciAodmFyIGtleSBpbiB5KSB7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIHguaGFzT3duUHJvcGVydHkoa2V5KSxcbiAgICAgICAgZm10KCdUaGUgaW50ZWdyYXRpb24gZG9lcyBub3QgaGF2ZSBhbiBvcHRpb24gbmFtZWQgXCIlc1wiLicsIGtleSlcbiAgICAgICk7XG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKFxuICAgICAgICB4W2tleV0sIHlba2V5XSxcbiAgICAgICAgZm10KFxuICAgICAgICAgICdFeHBlY3RlZCBvcHRpb24gXCIlc1wiIHRvIGRlZmF1bHQgdG8gXCIlc1wiLCBidXQgaXQgZGVmYXVsdHMgdG8gXCIlc1wiLicsXG4gICAgICAgICAga2V5LCB5W2tleV0sIHhba2V5XVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIGdsb2JhbHNcbiAgICB2YXIgeCA9IGEuZ2xvYmFscztcbiAgICB2YXIgeSA9IGIuZ2xvYmFscztcbiAgICBlYWNoKHksIGZ1bmN0aW9uKGtleSl7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIGluZGV4T2YoeCwga2V5KSAhPT0gLTEsXG4gICAgICAgIGZtdCgnRXhwZWN0ZWQgZ2xvYmFsIFwiJXNcIiB0byBiZSByZWdpc3RlcmVkLicsIGtleSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICAvLyBhc3N1bWVzUGFnZXZpZXdcbiAgICBhc3NlcnQoXG4gICAgICBhLl9hc3N1bWVzUGFnZXZpZXcgPT0gYi5fYXNzdW1lc1BhZ2V2aWV3LFxuICAgICAgJ0V4cGVjdGVkIHRoZSBpbnRlZ3JhdGlvbiB0byBhc3N1bWUgYSBwYWdldmlldy4nXG4gICAgKTtcblxuICAgIC8vIHJlYWR5T25Jbml0aWFsaXplXG4gICAgYXNzZXJ0KFxuICAgICAgYS5fcmVhZHlPbkluaXRpYWxpemUgPT0gYi5fcmVhZHlPbkluaXRpYWxpemUsXG4gICAgICAnRXhwZWN0ZWQgdGhlIGludGVncmF0aW9uIHRvIGJlIHJlYWR5IG9uIGluaXRpYWxpemUuJ1xuICAgICk7XG5cbiAgICAvLyByZWFkeU9uTG9hZFxuICAgIGFzc2VydChcbiAgICAgIGEuX3JlYWR5T25Mb2FkID09IGIuX3JlYWR5T25Mb2FkLFxuICAgICAgJ0V4cGVjdGVkIGludGVncmF0aW9uIHRvIGJlIHJlYWR5IG9uIGxvYWQuJ1xuICAgICk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFzc2VydCB0aGUgaW50ZWdyYXRpb24gYmVpbmcgdGVzdGVkIGxvYWRzLlxuICAgKlxuICAgKiBAcGFyYW0ge0ludGVncmF0aW9ufSBpbnRlZ3JhdGlvblxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gICAqL1xuXG4gIGFuYWx5dGljcy5sb2FkID0gZnVuY3Rpb24oaW50ZWdyYXRpb24sIGRvbmUpe1xuICAgIGFuYWx5dGljcy5hc3NlcnQoIWludGVncmF0aW9uLmxvYWRlZCgpLCAnRXhwZWN0ZWQgYGludGVncmF0aW9uLmxvYWRlZCgpYCB0byBiZSBmYWxzZSBiZWZvcmUgbG9hZGluZy4nKTtcbiAgICBhbmFseXRpY3Mub25jZSgncmVhZHknLCBmdW5jdGlvbigpe1xuICAgICAgYW5hbHl0aWNzLmFzc2VydChpbnRlZ3JhdGlvbi5sb2FkZWQoKSwgJ0V4cGVjdGVkIGBpbnRlZ3JhdGlvbi5sb2FkZWQoKWAgdG8gYmUgdHJ1ZSBhZnRlciBsb2FkaW5nLicpO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgYW5hbHl0aWNzLnBhZ2Uoe30sIHsgTWFya2V0bzogdHJ1ZSB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQXNzZXJ0IGEgc2NyaXB0LCBpbWFnZSwgb3IgaWZyYW1lIHdhcyBsb2FkZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgRE9NIHRlbXBsYXRlXG4gICAqL1xuICBcbiAgYW5hbHl0aWNzLmxvYWRlZCA9IGZ1bmN0aW9uKGludGVncmF0aW9uLCBzdHIpe1xuICAgIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgaW50ZWdyYXRpb24pIHtcbiAgICAgIHN0ciA9IGludGVncmF0aW9uO1xuICAgICAgaW50ZWdyYXRpb24gPSB0aGlzLmludGVncmF0aW9uKCk7XG4gICAgfVxuXG4gICAgdmFyIHRhZ3MgPSBbXTtcblxuICAgIGFzc2VydChcbiAgICAgIH5pbmRleE9mKHRoaXMuc3BpZXMsIGludGVncmF0aW9uLmxvYWQpLFxuICAgICAgJ1lvdSBtdXN0IGNhbGwgYC5zcHkoaW50ZWdyYXRpb24sIFxcJ2xvYWRcXCcpYCBwcmlvciB0byBjYWxsaW5nIGAubG9hZGVkKClgLidcbiAgICApO1xuXG4gICAgLy8gY29sbGVjdCBhbGwgSW1hZ2Ugb3IgSFRNTEVsZW1lbnQgb2JqZWN0c1xuICAgIC8vIGluIGFuIGFycmF5IG9mIHN0cmluZ2lmaWVkIGVsZW1lbnRzLCBmb3IgaHVtYW4tcmVhZGFibGUgYXNzZXJ0aW9ucy5cbiAgICBlYWNoKGludGVncmF0aW9uLmxvYWQucmV0dXJucywgZnVuY3Rpb24oZWwpe1xuICAgICAgdmFyIHRhZyA9IHt9O1xuICAgICAgaWYgKGVsIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkge1xuICAgICAgICB0YWcudHlwZSA9ICdpbWcnO1xuICAgICAgICB0YWcuYXR0cnMgPSB7IHNyYzogZWwuc3JjIH07XG4gICAgICB9IGVsc2UgaWYgKGlzLmVsZW1lbnQoZWwpKSB7XG4gICAgICAgIHRhZy50eXBlID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB0YWcuYXR0cnMgPSBhdHRyaWJ1dGVzKGVsKTtcbiAgICAgICAgc3dpdGNoICh0YWcudHlwZSkge1xuICAgICAgICAgIGNhc2UgJ3NjcmlwdCc6XG4gICAgICAgICAgICAvLyBkb24ndCBjYXJlIGFib3V0IHRoZXNlIHByb3BlcnRpZXMuXG4gICAgICAgICAgICBkZWxldGUgdGFnLmF0dHJzLnR5cGU7XG4gICAgICAgICAgICBkZWxldGUgdGFnLmF0dHJzLmFzeW5jO1xuICAgICAgICAgICAgZGVsZXRlIHRhZy5hdHRycy5kZWZlcjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodGFnLnR5cGUpIHRhZ3MucHVzaChzdHJpbmdpZnkodGFnLnR5cGUsIHRhZy5hdHRycykpO1xuICAgIH0pO1xuXG4gICAgLy8gbm9ybWFsaXplIGZvcm1hdHRpbmdcbiAgICB2YXIgdGFnID0gb2JqZWN0aWZ5KHN0cik7XG4gICAgdmFyIGV4cGVjdGVkID0gc3RyaW5naWZ5KHRhZy50eXBlLCB0YWcuYXR0cnMpO1xuXG4gICAgaWYgKCF0YWdzLmxlbmd0aCkge1xuICAgICAgYXNzZXJ0KGZhbHNlLCBmbXQoJ05vIHRhZ3Mgd2VyZSByZXR1cm5lZC5cXG5FeHBlY3RlZCAlcy4nLCBleHBlY3RlZCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzaG93IHRoZSBjbG9zZXN0IG1hdGNoXG4gICAgICBhc3NlcnQoXG4gICAgICAgIGluZGV4T2YodGFncywgZXhwZWN0ZWQpICE9PSAtMSxcbiAgICAgICAgZm10KCdcXG5FeHBlY3RlZCAlcy5cXG5Gb3VuZCAlcycsIGV4cGVjdGVkLCB0YWdzLmpvaW4oJ1xcbicpKVxuICAgICAgKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCBjdXJyZW50IGludGVncmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtJbnRlZ3JhdGlvbn1cbiAgICovXG4gIFxuICBhbmFseXRpY3MuaW50ZWdyYXRpb24gPSBmdW5jdGlvbigpe1xuICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5faW50ZWdyYXRpb25zKSByZXR1cm4gdGhpcy5faW50ZWdyYXRpb25zW25hbWVdO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgYSBgdmFsdWVgIGlzIHRydXRoeS5cbiAgICpcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHJldHVybiB7VGVzdGVyfVxuICAgKi9cblxuICBhbmFseXRpY3MuYXNzZXJ0ID0gYXNzZXJ0O1xuXG4gIC8qKlxuICAgKiBFeHBvc2UgYWxsIG9mIHRoZSBtZXRob2RzIG9uIGBhc3NlcnRgLlxuICAgKlxuICAgKiBAcGFyYW0ge01peGVkfSBhcmdzLi4uXG4gICAqIEByZXR1cm4ge1Rlc3Rlcn1cbiAgICovXG5cbiAgZWFjaChrZXlzKGFzc2VydCksIGZ1bmN0aW9uKGtleSl7XG4gICAgYW5hbHl0aWNzW2tleV0gPSBmdW5jdGlvbigpe1xuICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICBhc3NlcnRba2V5XS5hcHBseShhc3NlcnQsIGFyZ3MpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIERPTSBub2RlIHN0cmluZy5cbiAgICovXG5cbiAgZnVuY3Rpb24gc3RyaW5naWZ5KG5hbWUsIGF0dHJzKSB7XG4gICAgdmFyIHN0ciA9IFtdO1xuICAgIHN0ci5wdXNoKCc8JyArIG5hbWUpO1xuICAgIGVhY2goYXR0cnMsIGZ1bmN0aW9uKGtleSwgdmFsKXtcbiAgICAgIHN0ci5wdXNoKCcgJyArIGtleSArICc9XCInICsgdmFsICsgJ1wiJyk7XG4gICAgfSk7XG4gICAgc3RyLnB1c2goJz4nKTtcbiAgICAvLyBibG9ja1xuICAgIGlmICgnaW1nJyAhPT0gbmFtZSkgc3RyLnB1c2goJzwvJyArIG5hbWUgKyAnPicpO1xuICAgIHJldHVybiBzdHIuam9pbignJyk7XG4gIH1cblxuICAvKipcbiAgICogRE9NIG5vZGUgYXR0cmlidXRlcyBhcyBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7RWxlbWVudH1cbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgXG4gIGZ1bmN0aW9uIGF0dHJpYnV0ZXMobm9kZSkge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICBlYWNoKG5vZGUuYXR0cmlidXRlcywgZnVuY3Rpb24oYXR0cil7XG4gICAgICBvYmpbYXR0ci5uYW1lXSA9IGF0dHIudmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHN0cmluZywgZ2l2ZSBiYWNrIERPTSBhdHRyaWJ1dGVzLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG5cbiAgZnVuY3Rpb24gb2JqZWN0aWZ5KHN0cikge1xuICAgIC8vIHJlcGxhY2UgYHNyY2Agd2l0aCBgZGF0YS1zcmNgIHRvIHByZXZlbnQgaW1hZ2UgbG9hZGluZ1xuICAgIHN0ciA9IHN0ci5yZXBsYWNlKCcgc3JjPVwiJywgJyBkYXRhLXNyYz1cIicpO1xuICAgIFxuICAgIHZhciBlbCA9IGRvbWlmeShzdHIpO1xuICAgIHZhciBhdHRycyA9IHt9O1xuICAgIFxuICAgIGVhY2goZWwuYXR0cmlidXRlcywgZnVuY3Rpb24oYXR0cil7XG4gICAgICAvLyB0aGVuIHJlcGxhY2UgaXQgYmFja1xuICAgICAgdmFyIG5hbWUgPSAnZGF0YS1zcmMnID09IGF0dHIubmFtZSA/ICdzcmMnIDogYXR0ci5uYW1lO1xuICAgICAgYXR0cnNbbmFtZV0gPSBhdHRyLnZhbHVlO1xuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgICBhdHRyczogYXR0cnNcbiAgICB9O1xuICB9XG59IiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGVxdWFscyA9IHJlcXVpcmUoJ2VxdWFscycpO1xudmFyIGZtdCA9IHJlcXVpcmUoJ2ZtdCcpO1xudmFyIHN0YWNrID0gcmVxdWlyZSgnc3RhY2snKTtcblxuLyoqXG4gKiBBc3NlcnQgYGV4cHJgIHdpdGggb3B0aW9uYWwgZmFpbHVyZSBgbXNnYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBleHByXG4gKiBAcGFyYW0ge1N0cmluZ30gW21zZ11cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZnVuY3Rpb24gKGV4cHIsIG1zZykge1xuICBpZiAoZXhwcikgcmV0dXJuO1xuICB0aHJvdyBlcnJvcihtc2cgfHwgbWVzc2FnZSgpKTtcbn07XG5cbi8qKlxuICogQXNzZXJ0IGBhY3R1YWxgIGlzIHdlYWsgZXF1YWwgdG8gYGV4cGVjdGVkYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBhY3R1YWxcbiAqIEBwYXJhbSB7TWl4ZWR9IGV4cGVjdGVkXG4gKiBAcGFyYW0ge1N0cmluZ30gW21zZ11cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5lcXVhbCA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBtc2cpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkgcmV0dXJuO1xuICB0aHJvdyBlcnJvcihtc2cgfHwgZm10KCdFeHBlY3RlZCAlbyB0byBlcXVhbCAlby4nLCBhY3R1YWwsIGV4cGVjdGVkKSwgYWN0dWFsLCBleHBlY3RlZCk7XG59O1xuXG4vKipcbiAqIEFzc2VydCBgYWN0dWFsYCBpcyBub3Qgd2VhayBlcXVhbCB0byBgZXhwZWN0ZWRgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICogQHBhcmFtIHtNaXhlZH0gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBbbXNnXVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLm5vdEVxdWFsID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG1zZykge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSByZXR1cm47XG4gIHRocm93IGVycm9yKG1zZyB8fCBmbXQoJ0V4cGVjdGVkICVvIG5vdCB0byBlcXVhbCAlby4nLCBhY3R1YWwsIGV4cGVjdGVkKSk7XG59O1xuXG4vKipcbiAqIEFzc2VydCBgYWN0dWFsYCBpcyBkZWVwIGVxdWFsIHRvIGBleHBlY3RlZGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gYWN0dWFsXG4gKiBAcGFyYW0ge01peGVkfSBleHBlY3RlZFxuICogQHBhcmFtIHtTdHJpbmd9IFttc2ddXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuZGVlcEVxdWFsID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG1zZykge1xuICBpZiAoZXF1YWxzKGFjdHVhbCwgZXhwZWN0ZWQpKSByZXR1cm47XG4gIHRocm93IGVycm9yKG1zZyB8fCBmbXQoJ0V4cGVjdGVkICVvIHRvIGRlZXBseSBlcXVhbCAlby4nLCBhY3R1YWwsIGV4cGVjdGVkKSwgYWN0dWFsLCBleHBlY3RlZCk7XG59O1xuXG4vKipcbiAqIEFzc2VydCBgYWN0dWFsYCBpcyBub3QgZGVlcCBlcXVhbCB0byBgZXhwZWN0ZWRgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICogQHBhcmFtIHtNaXhlZH0gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBbbXNnXVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBtc2cpIHtcbiAgaWYgKCFlcXVhbHMoYWN0dWFsLCBleHBlY3RlZCkpIHJldHVybjtcbiAgdGhyb3cgZXJyb3IobXNnIHx8IGZtdCgnRXhwZWN0ZWQgJW8gbm90IHRvIGRlZXBseSBlcXVhbCAlby4nLCBhY3R1YWwsIGV4cGVjdGVkKSk7XG59O1xuXG4vKipcbiAqIEFzc2VydCBgYWN0dWFsYCBpcyBzdHJpY3QgZXF1YWwgdG8gYGV4cGVjdGVkYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBhY3R1YWxcbiAqIEBwYXJhbSB7TWl4ZWR9IGV4cGVjdGVkXG4gKiBAcGFyYW0ge1N0cmluZ30gW21zZ11cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBtc2cpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHJldHVybjtcbiAgdGhyb3cgZXJyb3IobXNnIHx8IGZtdCgnRXhwZWN0ZWQgJW8gdG8gc3RyaWN0bHkgZXF1YWwgJW8uJywgYWN0dWFsLCBleHBlY3RlZCksIGFjdHVhbCwgZXhwZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBBc3NlcnQgYGFjdHVhbGAgaXMgbm90IHN0cmljdCBlcXVhbCB0byBgZXhwZWN0ZWRgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICogQHBhcmFtIHtNaXhlZH0gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBbbXNnXVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG1zZykge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkgcmV0dXJuO1xuICB0aHJvdyBlcnJvcihtc2cgfHwgZm10KCdFeHBlY3RlZCAlbyBub3QgdG8gc3RyaWN0bHkgZXF1YWwgJW8uJywgYWN0dWFsLCBleHBlY3RlZCkpO1xufTtcblxuLyoqXG4gKiBBc3NlcnQgYGJsb2NrYCB0aHJvd3MgYW4gYGVycm9yYC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBibG9ja1xuICogQHBhcmFtIHtGdW5jdGlvbn0gW2Vycm9yXVxuICogQHBhcmFtIHtTdHJpbmd9IFttc2ddXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMudGhyb3dzID0gZnVuY3Rpb24gKGJsb2NrLCBlcnIsIG1zZykge1xuICB2YXIgdGhyZXc7XG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocmV3ID0gZTtcbiAgfVxuXG4gIGlmICghdGhyZXcpIHRocm93IGVycm9yKG1zZyB8fCBmbXQoJ0V4cGVjdGVkICVzIHRvIHRocm93IGFuIGVycm9yLicsIGJsb2NrLnRvU3RyaW5nKCkpKTtcbiAgaWYgKGVyciAmJiAhKHRocmV3IGluc3RhbmNlb2YgZXJyKSkge1xuICAgIHRocm93IGVycm9yKG1zZyB8fCBmbXQoJ0V4cGVjdGVkICVzIHRvIHRocm93IGFuICVvLicsIGJsb2NrLnRvU3RyaW5nKCksIGVycikpO1xuICB9XG59O1xuXG4vKipcbiAqIEFzc2VydCBgYmxvY2tgIGRvZXNuJ3QgdGhyb3cgYW4gYGVycm9yYC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBibG9ja1xuICogQHBhcmFtIHtGdW5jdGlvbn0gW2Vycm9yXVxuICogQHBhcmFtIHtTdHJpbmd9IFttc2ddXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuZG9lc05vdFRocm93ID0gZnVuY3Rpb24gKGJsb2NrLCBlcnIsIG1zZykge1xuICB2YXIgdGhyZXc7XG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocmV3ID0gZTtcbiAgfVxuXG4gIGlmICh0aHJldykgdGhyb3cgZXJyb3IobXNnIHx8IGZtdCgnRXhwZWN0ZWQgJXMgbm90IHRvIHRocm93IGFuIGVycm9yLicsIGJsb2NrLnRvU3RyaW5nKCkpKTtcbiAgaWYgKGVyciAmJiAodGhyZXcgaW5zdGFuY2VvZiBlcnIpKSB7XG4gICAgdGhyb3cgZXJyb3IobXNnIHx8IGZtdCgnRXhwZWN0ZWQgJXMgbm90IHRvIHRocm93IGFuICVvLicsIGJsb2NrLnRvU3RyaW5nKCksIGVycikpO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIG1lc3NhZ2UgZnJvbSB0aGUgY2FsbCBzdGFjay5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtZXNzYWdlKCkge1xuICBpZiAoIUVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSByZXR1cm4gJ2Fzc2VydGlvbiBmYWlsZWQnO1xuICB2YXIgY2FsbHNpdGUgPSBzdGFjaygpWzJdO1xuICB2YXIgZm4gPSBjYWxsc2l0ZS5nZXRGdW5jdGlvbk5hbWUoKTtcbiAgdmFyIGZpbGUgPSBjYWxsc2l0ZS5nZXRGaWxlTmFtZSgpO1xuICB2YXIgbGluZSA9IGNhbGxzaXRlLmdldExpbmVOdW1iZXIoKSAtIDE7XG4gIHZhciBjb2wgPSBjYWxsc2l0ZS5nZXRDb2x1bW5OdW1iZXIoKSAtIDE7XG4gIHZhciBzcmMgPSBnZXQoZmlsZSk7XG4gIGxpbmUgPSBzcmMuc3BsaXQoJ1xcbicpW2xpbmVdLnNsaWNlKGNvbCk7XG4gIHZhciBtID0gbGluZS5tYXRjaCgvYXNzZXJ0XFwoKC4qKVxcKS8pO1xuICByZXR1cm4gbSAmJiBtWzFdLnRyaW0oKTtcbn1cblxuLyoqXG4gKiBMb2FkIGNvbnRlbnRzIG9mIGBzY3JpcHRgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzY3JpcHRcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGdldChzY3JpcHQpIHtcbiAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdDtcbiAgeGhyLm9wZW4oJ0dFVCcsIHNjcmlwdCwgZmFsc2UpO1xuICB4aHIuc2VuZChudWxsKTtcbiAgcmV0dXJuIHhoci5yZXNwb25zZVRleHQ7XG59XG5cbi8qKlxuICogRXJyb3Igd2l0aCBgbXNnYCwgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1zZ1xuICogQHBhcmFtIHtNaXhlZH0gYWN0dWFsXG4gKiBAcGFyYW0ge01peGVkfSBleHBlY3RlZFxuICogQHJldHVybiB7RXJyb3J9XG4gKi9cblxuZnVuY3Rpb24gZXJyb3IobXNnLCBhY3R1YWwsIGV4cGVjdGVkKXtcbiAgdmFyIGVyciA9IG5ldyBFcnJvcihtc2cpO1xuICBlcnIuc2hvd0RpZmYgPSAzID09IGFyZ3VtZW50cy5sZW5ndGg7XG4gIGVyci5hY3R1YWwgPSBhY3R1YWw7XG4gIGVyci5leHBlY3RlZCA9IGV4cGVjdGVkO1xuICByZXR1cm4gZXJyO1xufVxuIiwidmFyIHR5cGUgPSByZXF1aXJlKCdqa3Jvc28tdHlwZScpXG5cbi8vIChhbnksIGFueSwgW2FycmF5XSkgLT4gYm9vbGVhblxuZnVuY3Rpb24gZXF1YWwoYSwgYiwgbWVtb3Mpe1xuICAvLyBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudFxuICBpZiAoYSA9PT0gYikgcmV0dXJuIHRydWVcbiAgdmFyIGZuQSA9IHR5cGVzW3R5cGUoYSldXG4gIHZhciBmbkIgPSB0eXBlc1t0eXBlKGIpXVxuICByZXR1cm4gZm5BICYmIGZuQSA9PT0gZm5CXG4gICAgPyBmbkEoYSwgYiwgbWVtb3MpXG4gICAgOiBmYWxzZVxufVxuXG52YXIgdHlwZXMgPSB7fVxuXG4vLyAoTnVtYmVyKSAtPiBib29sZWFuXG50eXBlcy5udW1iZXIgPSBmdW5jdGlvbihhLCBiKXtcbiAgcmV0dXJuIGEgIT09IGEgJiYgYiAhPT0gYi8qTmFuIGNoZWNrKi9cbn1cblxuLy8gKGZ1bmN0aW9uLCBmdW5jdGlvbiwgYXJyYXkpIC0+IGJvb2xlYW5cbnR5cGVzWydmdW5jdGlvbiddID0gZnVuY3Rpb24oYSwgYiwgbWVtb3Mpe1xuICByZXR1cm4gYS50b1N0cmluZygpID09PSBiLnRvU3RyaW5nKClcbiAgICAvLyBGdW5jdGlvbnMgY2FuIGFjdCBhcyBvYmplY3RzXG4gICAgJiYgdHlwZXMub2JqZWN0KGEsIGIsIG1lbW9zKVxuICAgICYmIGVxdWFsKGEucHJvdG90eXBlLCBiLnByb3RvdHlwZSlcbn1cblxuLy8gKGRhdGUsIGRhdGUpIC0+IGJvb2xlYW5cbnR5cGVzLmRhdGUgPSBmdW5jdGlvbihhLCBiKXtcbiAgcmV0dXJuICthID09PSArYlxufVxuXG4vLyAocmVnZXhwLCByZWdleHApIC0+IGJvb2xlYW5cbnR5cGVzLnJlZ2V4cCA9IGZ1bmN0aW9uKGEsIGIpe1xuICByZXR1cm4gYS50b1N0cmluZygpID09PSBiLnRvU3RyaW5nKClcbn1cblxuLy8gKERPTUVsZW1lbnQsIERPTUVsZW1lbnQpIC0+IGJvb2xlYW5cbnR5cGVzLmVsZW1lbnQgPSBmdW5jdGlvbihhLCBiKXtcbiAgcmV0dXJuIGEub3V0ZXJIVE1MID09PSBiLm91dGVySFRNTFxufVxuXG4vLyAodGV4dG5vZGUsIHRleHRub2RlKSAtPiBib29sZWFuXG50eXBlcy50ZXh0bm9kZSA9IGZ1bmN0aW9uKGEsIGIpe1xuICByZXR1cm4gYS50ZXh0Q29udGVudCA9PT0gYi50ZXh0Q29udGVudFxufVxuXG4vLyBkZWNvcmF0ZSBgZm5gIHRvIHByZXZlbnQgaXQgcmUtY2hlY2tpbmcgb2JqZWN0c1xuLy8gKGZ1bmN0aW9uKSAtPiBmdW5jdGlvblxuZnVuY3Rpb24gbWVtb0dhdXJkKGZuKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKGEsIGIsIG1lbW9zKXtcbiAgICBpZiAoIW1lbW9zKSByZXR1cm4gZm4oYSwgYiwgW10pXG4gICAgdmFyIGkgPSBtZW1vcy5sZW5ndGgsIG1lbW9cbiAgICB3aGlsZSAobWVtbyA9IG1lbW9zWy0taV0pIHtcbiAgICAgIGlmIChtZW1vWzBdID09PSBhICYmIG1lbW9bMV0gPT09IGIpIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHJldHVybiBmbihhLCBiLCBtZW1vcylcbiAgfVxufVxuXG50eXBlc1snYXJndW1lbnRzJ10gPVxudHlwZXNbJ2JpdC1hcnJheSddID1cbnR5cGVzLmFycmF5ID0gbWVtb0dhdXJkKGFycmF5RXF1YWwpXG5cbi8vIChhcnJheSwgYXJyYXksIGFycmF5KSAtPiBib29sZWFuXG5mdW5jdGlvbiBhcnJheUVxdWFsKGEsIGIsIG1lbW9zKXtcbiAgdmFyIGkgPSBhLmxlbmd0aFxuICBpZiAoaSAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuICBtZW1vcy5wdXNoKFthLCBiXSlcbiAgd2hpbGUgKGktLSkge1xuICAgIGlmICghZXF1YWwoYVtpXSwgYltpXSwgbWVtb3MpKSByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG50eXBlcy5vYmplY3QgPSBtZW1vR2F1cmQob2JqZWN0RXF1YWwpXG5cbi8vIChvYmplY3QsIG9iamVjdCwgYXJyYXkpIC0+IGJvb2xlYW5cbmZ1bmN0aW9uIG9iamVjdEVxdWFsKGEsIGIsIG1lbW9zKSB7XG4gIGlmICh0eXBlb2YgYS5lcXVhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgbWVtb3MucHVzaChbYSwgYl0pXG4gICAgcmV0dXJuIGEuZXF1YWwoYiwgbWVtb3MpXG4gIH1cbiAgdmFyIGthID0gZ2V0RW51bWVyYWJsZVByb3BlcnRpZXMoYSlcbiAgdmFyIGtiID0gZ2V0RW51bWVyYWJsZVByb3BlcnRpZXMoYilcbiAgdmFyIGkgPSBrYS5sZW5ndGhcblxuICAvLyBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzXG4gIGlmIChpICE9PSBrYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuXG4gIC8vIGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlclxuICBrYS5zb3J0KClcbiAga2Iuc29ydCgpXG5cbiAgLy8gY2hlYXAga2V5IHRlc3RcbiAgd2hpbGUgKGktLSkgaWYgKGthW2ldICE9PSBrYltpXSkgcmV0dXJuIGZhbHNlXG5cbiAgLy8gcmVtZW1iZXJcbiAgbWVtb3MucHVzaChbYSwgYl0pXG5cbiAgLy8gaXRlcmF0ZSBhZ2FpbiB0aGlzIHRpbWUgZG9pbmcgYSB0aG9yb3VnaCBjaGVja1xuICBpID0ga2EubGVuZ3RoXG4gIHdoaWxlIChpLS0pIHtcbiAgICB2YXIga2V5ID0ga2FbaV1cbiAgICBpZiAoIWVxdWFsKGFba2V5XSwgYltrZXldLCBtZW1vcykpIHJldHVybiBmYWxzZVxuICB9XG5cbiAgcmV0dXJuIHRydWVcbn1cblxuLy8gKG9iamVjdCkgLT4gYXJyYXlcbmZ1bmN0aW9uIGdldEVudW1lcmFibGVQcm9wZXJ0aWVzIChvYmplY3QpIHtcbiAgdmFyIHJlc3VsdCA9IFtdXG4gIGZvciAodmFyIGsgaW4gb2JqZWN0KSBpZiAoayAhPT0gJ2NvbnN0cnVjdG9yJykge1xuICAgIHJlc3VsdC5wdXNoKGspXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVxdWFsXG4iLCJcbnZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nXG52YXIgRG9tTm9kZSA9IHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCdcbiAgPyB3aW5kb3cuTm9kZVxuICA6IEZ1bmN0aW9uXG5cbi8qKlxuICogUmV0dXJuIHRoZSB0eXBlIG9mIGB2YWxgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBmdW5jdGlvbih4KXtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgeFxuICBpZiAodHlwZSAhPSAnb2JqZWN0JykgcmV0dXJuIHR5cGVcbiAgdHlwZSA9IHR5cGVzW3RvU3RyaW5nLmNhbGwoeCldXG4gIGlmICh0eXBlKSByZXR1cm4gdHlwZVxuICBpZiAoeCBpbnN0YW5jZW9mIERvbU5vZGUpIHN3aXRjaCAoeC5ub2RlVHlwZSkge1xuICAgIGNhc2UgMTogIHJldHVybiAnZWxlbWVudCdcbiAgICBjYXNlIDM6ICByZXR1cm4gJ3RleHQtbm9kZSdcbiAgICBjYXNlIDk6ICByZXR1cm4gJ2RvY3VtZW50J1xuICAgIGNhc2UgMTE6IHJldHVybiAnZG9jdW1lbnQtZnJhZ21lbnQnXG4gICAgZGVmYXVsdDogcmV0dXJuICdkb20tbm9kZSdcbiAgfVxufVxuXG52YXIgdHlwZXMgPSBleHBvcnRzLnR5cGVzID0ge1xuICAnW29iamVjdCBGdW5jdGlvbl0nOiAnZnVuY3Rpb24nLFxuICAnW29iamVjdCBEYXRlXSc6ICdkYXRlJyxcbiAgJ1tvYmplY3QgUmVnRXhwXSc6ICdyZWdleHAnLFxuICAnW29iamVjdCBBcmd1bWVudHNdJzogJ2FyZ3VtZW50cycsXG4gICdbb2JqZWN0IEFycmF5XSc6ICdhcnJheScsXG4gICdbb2JqZWN0IFN0cmluZ10nOiAnc3RyaW5nJyxcbiAgJ1tvYmplY3QgTnVsbF0nOiAnbnVsbCcsXG4gICdbb2JqZWN0IFVuZGVmaW5lZF0nOiAndW5kZWZpbmVkJyxcbiAgJ1tvYmplY3QgTnVtYmVyXSc6ICdudW1iZXInLFxuICAnW29iamVjdCBCb29sZWFuXSc6ICdib29sZWFuJyxcbiAgJ1tvYmplY3QgT2JqZWN0XSc6ICdvYmplY3QnLFxuICAnW29iamVjdCBUZXh0XSc6ICd0ZXh0LW5vZGUnLFxuICAnW29iamVjdCBVaW50OEFycmF5XSc6ICdiaXQtYXJyYXknLFxuICAnW29iamVjdCBVaW50MTZBcnJheV0nOiAnYml0LWFycmF5JyxcbiAgJ1tvYmplY3QgVWludDMyQXJyYXldJzogJ2JpdC1hcnJheScsXG4gICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XSc6ICdiaXQtYXJyYXknLFxuICAnW29iamVjdCBFcnJvcl0nOiAnZXJyb3InLFxuICAnW29iamVjdCBGb3JtRGF0YV0nOiAnZm9ybS1kYXRhJyxcbiAgJ1tvYmplY3QgRmlsZV0nOiAnZmlsZScsXG4gICdbb2JqZWN0IEJsb2JdJzogJ2Jsb2InXG59XG4iLCJcbi8qKlxuICogRXhwb3NlIGBzdGFjaygpYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YWNrO1xuXG4vKipcbiAqIFJldHVybiB0aGUgc3RhY2suXG4gKlxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIHN0YWNrKCkge1xuICB2YXIgb3JpZyA9IEVycm9yLnByZXBhcmVTdGFja1RyYWNlO1xuICBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uKF8sIHN0YWNrKXsgcmV0dXJuIHN0YWNrOyB9O1xuICB2YXIgZXJyID0gbmV3IEVycm9yO1xuICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShlcnIsIGFyZ3VtZW50cy5jYWxsZWUpO1xuICB2YXIgc3RhY2sgPSBlcnIuc3RhY2s7XG4gIEVycm9yLnByZXBhcmVTdGFja1RyYWNlID0gb3JpZztcbiAgcmV0dXJuIHN0YWNrO1xufSIsIlxuLyoqXG4gKiBFeHBvc2UgYHBhcnNlYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlO1xuXG4vKipcbiAqIFRlc3RzIGZvciBicm93c2VyIHN1cHBvcnQuXG4gKi9cblxudmFyIGlubmVySFRNTEJ1ZyA9IGZhbHNlO1xudmFyIGJ1Z1Rlc3REaXY7XG5pZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICBidWdUZXN0RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIC8vIFNldHVwXG4gIGJ1Z1Rlc3REaXYuaW5uZXJIVE1MID0gJyAgPGxpbmsvPjx0YWJsZT48L3RhYmxlPjxhIGhyZWY9XCIvYVwiPmE8L2E+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiLz4nO1xuICAvLyBNYWtlIHN1cmUgdGhhdCBsaW5rIGVsZW1lbnRzIGdldCBzZXJpYWxpemVkIGNvcnJlY3RseSBieSBpbm5lckhUTUxcbiAgLy8gVGhpcyByZXF1aXJlcyBhIHdyYXBwZXIgZWxlbWVudCBpbiBJRVxuICBpbm5lckhUTUxCdWcgPSAhYnVnVGVzdERpdi5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGluaycpLmxlbmd0aDtcbiAgYnVnVGVzdERpdiA9IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBXcmFwIG1hcCBmcm9tIGpxdWVyeS5cbiAqL1xuXG52YXIgbWFwID0ge1xuICBsZWdlbmQ6IFsxLCAnPGZpZWxkc2V0PicsICc8L2ZpZWxkc2V0PiddLFxuICB0cjogWzIsICc8dGFibGU+PHRib2R5PicsICc8L3Rib2R5PjwvdGFibGU+J10sXG4gIGNvbDogWzIsICc8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPicsICc8L2NvbGdyb3VwPjwvdGFibGU+J10sXG4gIC8vIGZvciBzY3JpcHQvbGluay9zdHlsZSB0YWdzIHRvIHdvcmsgaW4gSUU2LTgsIHlvdSBoYXZlIHRvIHdyYXBcbiAgLy8gaW4gYSBkaXYgd2l0aCBhIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlciBpbiBmcm9udCwgaGEhXG4gIF9kZWZhdWx0OiBpbm5lckhUTUxCdWcgPyBbMSwgJ1g8ZGl2PicsICc8L2Rpdj4nXSA6IFswLCAnJywgJyddXG59O1xuXG5tYXAudGQgPVxubWFwLnRoID0gWzMsICc8dGFibGU+PHRib2R5Pjx0cj4nLCAnPC90cj48L3Rib2R5PjwvdGFibGU+J107XG5cbm1hcC5vcHRpb24gPVxubWFwLm9wdGdyb3VwID0gWzEsICc8c2VsZWN0IG11bHRpcGxlPVwibXVsdGlwbGVcIj4nLCAnPC9zZWxlY3Q+J107XG5cbm1hcC50aGVhZCA9XG5tYXAudGJvZHkgPVxubWFwLmNvbGdyb3VwID1cbm1hcC5jYXB0aW9uID1cbm1hcC50Zm9vdCA9IFsxLCAnPHRhYmxlPicsICc8L3RhYmxlPiddO1xuXG5tYXAucG9seWxpbmUgPVxubWFwLmVsbGlwc2UgPVxubWFwLnBvbHlnb24gPVxubWFwLmNpcmNsZSA9XG5tYXAudGV4dCA9XG5tYXAubGluZSA9XG5tYXAucGF0aCA9XG5tYXAucmVjdCA9XG5tYXAuZyA9IFsxLCAnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmVyc2lvbj1cIjEuMVwiPicsJzwvc3ZnPiddO1xuXG4vKipcbiAqIFBhcnNlIGBodG1sYCBhbmQgcmV0dXJuIGEgRE9NIE5vZGUgaW5zdGFuY2UsIHdoaWNoIGNvdWxkIGJlIGEgVGV4dE5vZGUsXG4gKiBIVE1MIERPTSBOb2RlIG9mIHNvbWUga2luZCAoPGRpdj4gZm9yIGV4YW1wbGUpLCBvciBhIERvY3VtZW50RnJhZ21lbnRcbiAqIGluc3RhbmNlLCBkZXBlbmRpbmcgb24gdGhlIGNvbnRlbnRzIG9mIHRoZSBgaHRtbGAgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBodG1sIC0gSFRNTCBzdHJpbmcgdG8gXCJkb21pZnlcIlxuICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIC0gVGhlIGBkb2N1bWVudGAgaW5zdGFuY2UgdG8gY3JlYXRlIHRoZSBOb2RlIGZvclxuICogQHJldHVybiB7RE9NTm9kZX0gdGhlIFRleHROb2RlLCBET00gTm9kZSwgb3IgRG9jdW1lbnRGcmFnbWVudCBpbnN0YW5jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2UoaHRtbCwgZG9jKSB7XG4gIGlmICgnc3RyaW5nJyAhPSB0eXBlb2YgaHRtbCkgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RyaW5nIGV4cGVjdGVkJyk7XG5cbiAgLy8gZGVmYXVsdCB0byB0aGUgZ2xvYmFsIGBkb2N1bWVudGAgb2JqZWN0XG4gIGlmICghZG9jKSBkb2MgPSBkb2N1bWVudDtcblxuICAvLyB0YWcgbmFtZVxuICB2YXIgbSA9IC88KFtcXHc6XSspLy5leGVjKGh0bWwpO1xuICBpZiAoIW0pIHJldHVybiBkb2MuY3JlYXRlVGV4dE5vZGUoaHRtbCk7XG5cbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpOyAvLyBSZW1vdmUgbGVhZGluZy90cmFpbGluZyB3aGl0ZXNwYWNlXG5cbiAgdmFyIHRhZyA9IG1bMV07XG5cbiAgLy8gYm9keSBzdXBwb3J0XG4gIGlmICh0YWcgPT0gJ2JvZHknKSB7XG4gICAgdmFyIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2h0bWwnKTtcbiAgICBlbC5pbm5lckhUTUwgPSBodG1sO1xuICAgIHJldHVybiBlbC5yZW1vdmVDaGlsZChlbC5sYXN0Q2hpbGQpO1xuICB9XG5cbiAgLy8gd3JhcCBtYXBcbiAgdmFyIHdyYXAgPSBtYXBbdGFnXSB8fCBtYXAuX2RlZmF1bHQ7XG4gIHZhciBkZXB0aCA9IHdyYXBbMF07XG4gIHZhciBwcmVmaXggPSB3cmFwWzFdO1xuICB2YXIgc3VmZml4ID0gd3JhcFsyXTtcbiAgdmFyIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBlbC5pbm5lckhUTUwgPSBwcmVmaXggKyBodG1sICsgc3VmZml4O1xuICB3aGlsZSAoZGVwdGgtLSkgZWwgPSBlbC5sYXN0Q2hpbGQ7XG5cbiAgLy8gb25lIGVsZW1lbnRcbiAgaWYgKGVsLmZpcnN0Q2hpbGQgPT0gZWwubGFzdENoaWxkKSB7XG4gICAgcmV0dXJuIGVsLnJlbW92ZUNoaWxkKGVsLmZpcnN0Q2hpbGQpO1xuICB9XG5cbiAgLy8gc2V2ZXJhbCBlbGVtZW50c1xuICB2YXIgZnJhZ21lbnQgPSBkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkge1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGVsLnJlbW92ZUNoaWxkKGVsLmZpcnN0Q2hpbGQpKTtcbiAgfVxuXG4gIHJldHVybiBmcmFnbWVudDtcbn1cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBtZXJnZSA9IHJlcXVpcmUoJ21lcmdlJyk7XG52YXIgZXFsID0gcmVxdWlyZSgnZXFsJyk7XG5cbi8qKlxuICogQ3JlYXRlIGEgdGVzdCBzdHViIHdpdGggYG9iamAsIGBtZXRob2RgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgcyA9IHJlcXVpcmUoJ3N0dWInKSh7fSwgJ3RvU3RyaW5nJyk7XG4gKiAgICAgIHMgPSByZXF1aXJlKCdzdHViJykoZG9jdW1lbnQud3JpdGUpO1xuICogICAgICBzID0gcmVxdWlyZSgnc3R1YicpKCk7XG4gKlxuICogQHBhcmFtIHtPYmplY3R8RnVuY3Rpb259IG9ialxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZFxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCBtZXRob2Qpe1xuICB2YXIgZm4gPSB0b0Z1bmN0aW9uKGFyZ3VtZW50cywgc3R1Yik7XG4gIG1lcmdlKHN0dWIsIHByb3RvKTtcbiAgc3R1Yi5yZXNldCgpO1xuICBzdHViLm5hbWUgPSBtZXRob2Q7XG4gIHJldHVybiBzdHViO1xuXG4gIGZ1bmN0aW9uIHN0dWIoKXtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB2YXIgcmV0ID0gZm4oYXJndW1lbnRzKTtcbiAgICAvL3N0dWIucmV0dXJucyB8fCBzdHViLnJlc2V0KCk7XG4gICAgc3R1Yi5hcmdzLnB1c2goYXJncyk7XG4gICAgc3R1Yi5yZXR1cm5zLnB1c2gocmV0KTtcbiAgICBzdHViLnVwZGF0ZSgpO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbn07XG5cbi8qKlxuICogUHJvdG90eXBlLlxuICovXG5cbnZhciBwcm90byA9IHt9O1xuXG4vKipcbiAqIGB0cnVlYCBpZiB0aGUgc3R1YiB3YXMgY2FsbGVkIHdpdGggYGFyZ3NgLlxuICpcbiAqIEBwYXJhbSB7QXJndW1lbnRzfSAuLi5cbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnByb3RvLmdvdCA9XG5wcm90by5jYWxsZWRXaXRoID0gZnVuY3Rpb24obil7XG4gIHZhciBhID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICBmb3IgKHZhciBpID0gMCwgbiA9IHRoaXMuYXJncy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICB2YXIgYiA9IHRoaXMuYXJnc1tpXTtcbiAgICBpZiAoZXFsKGEsIGIuc2xpY2UoMCwgYS5sZW5ndGgpKSkgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuO1xufTtcblxuLyoqXG4gKiBgdHJ1ZWAgaWYgdGhlIHN0dWIgcmV0dXJuZWQgYHZhbHVlYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucHJvdG8ucmV0dXJuZWQgPSBmdW5jdGlvbih2YWx1ZSl7XG4gIHZhciByZXQgPSB0aGlzLnJldHVybnNbdGhpcy5yZXR1cm5zLmxlbmd0aCAtIDFdO1xuICByZXR1cm4gZXFsKHJldCwgdmFsdWUpO1xufTtcblxuLyoqXG4gKiBgdHJ1ZWAgaWYgdGhlIHN0dWIgd2FzIGNhbGxlZCBvbmNlLlxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnByb3RvLm9uY2UgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gMSA9PSB0aGlzLmFyZ3MubGVuZ3RoO1xufTtcblxuLyoqXG4gKiBgdHJ1ZWAgaWYgdGhlIHN0dWIgd2FzIGNhbGxlZCB0d2ljZS5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by50d2ljZSA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiAyID09IHRoaXMuYXJncy5sZW5ndGg7XG59O1xuXG4vKipcbiAqIGB0cnVlYCBpZiB0aGUgc3R1YiB3YXMgY2FsbGVkIHRocmVlIHRpbWVzLlxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnByb3RvLnRocmljZSA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiAzID09IHRoaXMuYXJncy5sZW5ndGg7XG59O1xuXG4vKipcbiAqIFJlc2V0IHRoZSBzdHViLlxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5yZXNldCA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMucmV0dXJucyA9IFtdO1xuICB0aGlzLmFyZ3MgPSBbXTtcbiAgdGhpcy51cGRhdGUoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlc3RvcmUuXG4gKlxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnByb3RvLnJlc3RvcmUgPSBmdW5jdGlvbigpe1xuICBpZiAoIXRoaXMub2JqKSByZXR1cm4gdGhpcztcbiAgdmFyIG0gPSB0aGlzLm1ldGhvZDtcbiAgdmFyIGZuID0gdGhpcy5mbjtcbiAgdGhpcy5vYmpbbV0gPSBmbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFVwZGF0ZSB0aGUgc3R1Yi5cbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnByb3RvLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuY2FsbGVkID0gISEgdGhpcy5hcmdzLmxlbmd0aDtcbiAgdGhpcy5jYWxsZWRPbmNlID0gdGhpcy5vbmNlKCk7XG4gIHRoaXMuY2FsbGVkVHdpY2UgPSB0aGlzLnR3aWNlKCk7XG4gIHRoaXMuY2FsbGVkVGhyaWNlID0gdGhpcy50aHJpY2UoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRvIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7Li4ufSBhcmdzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBzdHViXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHRvRnVuY3Rpb24oYXJncywgc3R1Yil7XG4gIHZhciBvYmogPSBhcmdzWzBdO1xuICB2YXIgbWV0aG9kID0gYXJnc1sxXTtcbiAgdmFyIGZuID0gYXJnc1syXSB8fCBmdW5jdGlvbigpe307XG5cbiAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgIGNhc2UgMDogcmV0dXJuIGZ1bmN0aW9uIG5vb3AoKXt9O1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKGFyZ3MpeyByZXR1cm4gb2JqLmFwcGx5KG51bGwsIGFyZ3MpOyB9O1xuICAgIGNhc2UgMjpcbiAgICBjYXNlIDM6XG4gICAgdmFyIG0gPSBvYmpbbWV0aG9kXTtcbiAgICBzdHViLm1ldGhvZCA9IG1ldGhvZDtcbiAgICBzdHViLmZuID0gbTtcbiAgICBzdHViLm9iaiA9IG9iajtcbiAgICBvYmpbbWV0aG9kXSA9IHN0dWI7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgIHJldHVybiBmbi5hcHBseShvYmosIGFyZ3MpO1xuICAgIH07XG4gIH1cbn1cbiIsIlxuLyoqXG4gKiBtZXJnZSBgYmAncyBwcm9wZXJ0aWVzIHdpdGggYGFgJ3MuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgdmFyIHVzZXIgPSB7fTtcbiAqICAgICAgICBtZXJnZSh1c2VyLCBjb25zb2xlKTtcbiAqICAgICAgICAvLyA+IHsgbG9nOiBmbiwgZGlyOiBmbiAuLn1cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYVxuICogQHBhcmFtIHtPYmplY3R9IGJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gIGZvciAodmFyIGsgaW4gYikgYVtrXSA9IGJba107XG4gIHJldHVybiBhO1xufTtcbiIsIlxuLyoqXG4gKiBkZXBlbmRlbmNpZXNcbiAqL1xuXG52YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcbnZhciBrID0gcmVxdWlyZSgna2V5cycpO1xuXG4vKipcbiAqIEV4cG9ydCBgZXFsYFxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGVxbDtcblxuLyoqXG4gKiBDb21wYXJlIGBhYCB0byBgYmAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gYVxuICogQHBhcmFtIHtNaXhlZH0gYlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZXFsKGEsIGIpe1xuICB2YXIgY29tcGFyZSA9IHR5cGUoYSk7XG5cbiAgLy8gc2FuaXR5IGNoZWNrXG4gIGlmIChjb21wYXJlICE9IHR5cGUoYikpIHJldHVybiBmYWxzZTtcbiAgaWYgKGEgPT09IGIpIHJldHVybiB0cnVlO1xuXG4gIC8vIGNvbXBhcmVcbiAgcmV0dXJuIChjb21wYXJlID0gZXFsW2NvbXBhcmVdKVxuICAgID8gY29tcGFyZShhLCBiKVxuICAgIDogYSA9PSBiO1xufVxuXG4vKipcbiAqIENvbXBhcmUgcmVnZXhwcyBgYWAsIGBiYC5cbiAqXG4gKiBAcGFyYW0ge1JlZ0V4cH0gYVxuICogQHBhcmFtIHtSZWdFeHB9IGJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmVxbC5yZWdleHAgPSBmdW5jdGlvbihhLCBiKXtcbiAgcmV0dXJuIGEuaWdub3JlQ2FzZSA9PSBiLmlnbm9yZUNhc2VcbiAgICAmJiBhLm11bHRpbGluZSA9PSBiLm11bHRpbGluZVxuICAgICYmIGEubGFzdEluZGV4ID09IGIubGFzdEluZGV4XG4gICAgJiYgYS5nbG9iYWwgPT0gYi5nbG9iYWxcbiAgICAmJiBhLnNvdXJjZSA9PSBiLnNvdXJjZTtcbn07XG5cbi8qKlxuICogQ29tcGFyZSBvYmplY3RzIGBhYCwgYGJgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhXG4gKiBAcGFyYW0ge09iamVjdH0gYlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXFsLm9iamVjdCA9IGZ1bmN0aW9uKGEsIGIpe1xuICB2YXIga2V5cyA9IHt9O1xuXG4gIC8vIHByb3RvXG4gIGlmIChhLnByb3RvdHlwZSAhPSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIGtleXNcbiAga2V5cy5hID0gayhhKS5zb3J0KCk7XG4gIGtleXMuYiA9IGsoYikuc29ydCgpO1xuXG4gIC8vIGxlbmd0aFxuICBpZiAoa2V5cy5hLmxlbmd0aCAhPSBrZXlzLmIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8ga2V5c1xuICBpZiAoa2V5cy5hLnRvU3RyaW5nKCkgIT0ga2V5cy5iLnRvU3RyaW5nKCkpIHJldHVybiBmYWxzZTtcblxuICAvLyB3YWxrXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5hLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGtleSA9IGtleXMuYVtpXTtcbiAgICBpZiAoIWVxbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGVxbFxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogQ29tcGFyZSBhcnJheXMgYGFgLCBgYmAuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYVxuICogQHBhcmFtIHtBcnJheX0gYlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXFsLmFycmF5ID0gZnVuY3Rpb24oYSwgYil7XG4gIGlmIChhLmxlbmd0aCAhPSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoIWVxbChhW2ldLCBiW2ldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBDb21wYXJlIGRhdGVzIGBhYCwgYGJgLlxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gYVxuICogQHBhcmFtIHtEYXRlfSBiXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5lcWwuZGF0ZSA9IGZ1bmN0aW9uKGEsIGIpe1xuICByZXR1cm4gK2EgPT0gK2I7XG59O1xuIiwidmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24ob2JqKXtcbiAgdmFyIGtleXMgPSBbXTtcblxuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UnKTtcbnZhciBlcWwgPSByZXF1aXJlKCdlcWwnKTtcblxuLyoqXG4gKiBDcmVhdGUgYSB0ZXN0IHNweSB3aXRoIGBvYmpgLCBgbWV0aG9kYC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHMgPSByZXF1aXJlKCdzcHknKSh7fSwgJ3RvU3RyaW5nJyk7XG4gKiAgICAgIHMgPSByZXF1aXJlKCdzcHknKShkb2N1bWVudC53cml0ZSk7XG4gKiAgICAgIHMgPSByZXF1aXJlKCdzcHknKSgpO1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgbWV0aG9kKXtcbiAgdmFyIGZuID0gdG9GdW5jdGlvbihhcmd1bWVudHMsIHNweSk7XG4gIG1lcmdlKHNweSwgcHJvdG8pO1xuICByZXR1cm4gc3B5LnJlc2V0KCk7XG5cbiAgZnVuY3Rpb24gc3B5KCl7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIHJldCA9IGZuKGFyZ3VtZW50cyk7XG4gICAgc3B5LnJldHVybnMgfHwgc3B5LnJlc2V0KCk7XG4gICAgc3B5LmFyZ3MucHVzaChhcmdzKTtcbiAgICBzcHkucmV0dXJucy5wdXNoKHJldCk7XG4gICAgc3B5LnVwZGF0ZSgpO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbn07XG5cbi8qKlxuICogUHNldWRvLXByb3RvdHlwZS5cbiAqL1xuXG52YXIgcHJvdG8gPSB7fTtcblxuLyoqXG4gKiBMYXppbHkgbWF0Y2ggYGFyZ3NgIGFuZCByZXR1cm4gYHRydWVgIGlmIHRoZSBzcHkgd2FzIGNhbGxlZCB3aXRoIHRoZW0uXG4gKlxuICogQHBhcmFtIHtBcmd1bWVudHN9IGFyZ3NcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnByb3RvLmdvdCA9XG5wcm90by5jYWxsZWRXaXRoID1cbnByb3RvLmdvdExhenkgPVxucHJvdG8uY2FsbGVkV2l0aExhenkgPSBmdW5jdGlvbigpe1xuICB2YXIgYSA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblxuICBmb3IgKHZhciBpID0gMCwgYXJnczsgYXJncyA9IHRoaXMuYXJnc1tpXTsgaSsrKSB7XG4gICAgaWYgKGVxbChhLCAgYXJncy5zbGljZSgwLCBhLmxlbmd0aCkpKSByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogRXhhY3RseSBtYXRjaCBgYXJnc2AgYW5kIHJldHVybiBgdHJ1ZWAgaWYgdGhlIHNweSB3YXMgY2FsbGVkIHdpdGggdGhlbS5cbiAqXG4gKiBAcGFyYW0ge0FyZ3VtZW50c30gLi4uXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5nb3RFeGFjdGx5ID1cbnByb3RvLmNhbGxlZFdpdGhFeGFjdGx5ID0gZnVuY3Rpb24oKXtcbiAgdmFyIGEgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGFyZ3M7IGFyZ3MgPSB0aGlzLmFyZ3NbaV07IGkrKykge1xuICAgIGlmIChlcWwoYSwgYXJncykpIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBgdHJ1ZWAgaWYgdGhlIHNweSByZXR1cm5lZCBgdmFsdWVgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5yZXR1cm5lZCA9IGZ1bmN0aW9uKHZhbHVlKXtcbiAgdmFyIHJldCA9IHRoaXMucmV0dXJuc1t0aGlzLnJldHVybnMubGVuZ3RoIC0gMV07XG4gIHJldHVybiBlcWwocmV0LCB2YWx1ZSk7XG59O1xuXG4vKipcbiAqIGB0cnVlYCBpZiB0aGUgc3B5IHdhcyBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5vbmNlID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIDEgPT0gdGhpcy5hcmdzLmxlbmd0aDtcbn07XG5cbi8qKlxuICogYHRydWVgIGlmIHRoZSBzcHkgd2FzIGNhbGxlZCB0d2ljZS5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by50d2ljZSA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiAyID09IHRoaXMuYXJncy5sZW5ndGg7XG59O1xuXG4vKipcbiAqIGB0cnVlYCBpZiB0aGUgc3B5IHdhcyBjYWxsZWQgdGhyZWUgdGltZXMuXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucHJvdG8udGhyaWNlID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIDMgPT0gdGhpcy5hcmdzLmxlbmd0aDtcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIHNweS5cbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucHJvdG8ucmVzZXQgPSBmdW5jdGlvbigpe1xuICB0aGlzLnJldHVybnMgPSBbXTtcbiAgdGhpcy5hcmdzID0gW107XG4gIHRoaXMudXBkYXRlKCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXN0b3JlLlxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5yZXN0b3JlID0gZnVuY3Rpb24oKXtcbiAgaWYgKCF0aGlzLm9iaikgcmV0dXJuIHRoaXM7XG4gIHZhciBtID0gdGhpcy5tZXRob2Q7XG4gIHZhciBmbiA9IHRoaXMuZm47XG4gIHRoaXMub2JqW21dID0gZm47XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIHNweS5cbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnByb3RvLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuY2FsbGVkID0gISEgdGhpcy5hcmdzLmxlbmd0aDtcbiAgdGhpcy5jYWxsZWRPbmNlID0gdGhpcy5vbmNlKCk7XG4gIHRoaXMuY2FsbGVkVHdpY2UgPSB0aGlzLnR3aWNlKCk7XG4gIHRoaXMuY2FsbGVkVGhyaWNlID0gdGhpcy50aHJpY2UoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRvIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7Li4ufSBhcmdzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBzcHlcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gdG9GdW5jdGlvbihhcmdzLCBzcHkpe1xuICB2YXIgb2JqID0gYXJnc1swXTtcbiAgdmFyIG1ldGhvZCA9IGFyZ3NbMV07XG5cbiAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgIGNhc2UgMDogcmV0dXJuIGZ1bmN0aW9uIG5vb3AoKXt9O1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKGFyZ3MpeyByZXR1cm4gb2JqLmFwcGx5KG51bGwsIGFyZ3MpOyB9O1xuICAgIGNhc2UgMjpcbiAgICAgIHZhciBtID0gb2JqW21ldGhvZF07XG4gICAgICBtZXJnZShzcHksIG0pO1xuICAgICAgc3B5Lm1ldGhvZCA9IG1ldGhvZDtcbiAgICAgIHNweS5mbiA9IG07XG4gICAgICBzcHkub2JqID0gb2JqO1xuICAgICAgb2JqW21ldGhvZF0gPSBzcHk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oYXJncyl7XG4gICAgICAgIHJldHVybiBtLmFwcGx5KG9iaiwgYXJncyk7XG4gICAgICB9O1xuICB9XG59XG4iLCIvKipcbiAqIERlcGVuZGVuY2llc1xuICovXG5cbnZhciBpbnRlZ3JhdGlvbiA9IHJlcXVpcmUoJ2FuYWx5dGljcy5qcy1pbnRlZ3JhdGlvbicpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ25kaG91bGUvZXh0ZW5kJyk7XG52YXIgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcbnZhciB2MU1ldGhvZHMgPSByZXF1aXJlKCcuL3YxJyk7XG52YXIgdjJNZXRob2RzID0gcmVxdWlyZSgnLi92MicpO1xuXG4vKipcbiAqIGhhc093blByb3BlcnR5IHJlZmVyZW5jZS5cbiAqL1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBFeHBvc2UgYE9tbml0dXJlYC5cbiAqL1xuXG52YXIgT21uaXR1cmUgPSBtb2R1bGUuZXhwb3J0cyA9IGludGVncmF0aW9uKCdPbW5pdHVyZScpO1xuXG4vKipcbiAqIFVzZXMgdGhlIGRlZmF1bHQgYGZpZWxkYCBmcm9tIHRoZSBgd2luZG93LnNgIG9iamVjdCBpZiBpdCBleGlzdHMsXG4gKiBvdGhlcndpc2UgdXNlcyB0aGUgcGFzc2VkIGluIGB2YWx1ZWAuIEFsc28gYWRkcyB0aGUgZmllbGQgdG9cbiAqIGB0aGlzLnNPcHRpb25zYCBhbmQgYHRoaXMub3B0aW9uc2BcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZFxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICovXG5cbk9tbml0dXJlLnNPcHRpb24gPSBmdW5jdGlvbihmaWVsZCwgdmFsdWUpIHtcbiAgdmFyIHMgPSB3aW5kb3cucztcbiAgLy8gVE9ETzogSWYgd2UgZG9jdW1lbnQgdGhhdCB0aGV5IGNhbiBhdHRhY2ggc3R1ZmYgdG8gd2luZG93LnMgb3V0c2lkZSBvZiBTZWdtZW50XG4gIC8vIHdlJ2QgYWxzbyBtYWtlIHN1cmUgdGhleSBoYXZlIHMudHJhY2tpbmdTZXJ2ZXIgYW5kIHMudHJhY2tpbmdTZXJ2ZXJTZWN1cmUgZGVmaW5lZCBzaW5jZVxuICAvLyAuZ2xvYmFsKHMpIG1lYW5zIHRoYXQgb3VyIGluaXRpYWxpemUgZnVuY3Rpb24gd2lsbCByZXR1cm4gZWFybHk/P1xuICB2YXIgaXNWYWxpZCA9IHMgJiYgaGFzLmNhbGwocywgZmllbGQpICYmICFpc0VtcHR5U3RyaW5nKGZpZWxkKTtcblxuICB2YWx1ZSA9IGlzVmFsaWQgPyBzW2ZpZWxkXSA6IHZhbHVlO1xuXG4gIC8vIFRPRE86IENvbnNpZGVyIHJlbW92aW5nIHRoaXMuIE5vdCBzdXJlIHdoeSB3ZSBhcmUgZG9pbmcgdGhpcyBzaW5jZSBpdCBoYXMgbm8gZnV0dXJlIHJlZmVyZW5jZVxuICB0aGlzLnByb3RvdHlwZS5zT3B0aW9ucyA9IHRoaXMucHJvdG90eXBlLnNPcHRpb25zIHx8IHt9O1xuICB0aGlzLnByb3RvdHlwZS5zT3B0aW9uc1tmaWVsZF0gPSB2YWx1ZTtcblxuICAvLyBTZXQgZmllbGQgYW5kIHZhbHVlIHRvIHRoaXMub3B0aW9uc1xuICByZXR1cm4gdGhpcy5vcHRpb24oZmllbGQsIHZhbHVlKTtcbn07XG5cbi8qKlxuICogQWRkIG91ciBvbW5pdHVyZVxuICovXG5cbk9tbml0dXJlXG4gIC5nbG9iYWwoJ3MnKVxuICAuZ2xvYmFsKCdzX2dpJylcbiAgLm9wdGlvbignaW5pdGlhbFBhZ2UnLCB0cnVlKVxuICAub3B0aW9uKCdldmVudHMnLCB7fSlcbiAgLm9wdGlvbignZVZhcnMnLCB7fSlcbiAgLm9wdGlvbigncHJvcHMnLCB7fSlcbiAgLm9wdGlvbignaFZhcnMnLCB7fSlcbiAgLm9wdGlvbigncmVwb3J0U3VpdGVJZCcsIHdpbmRvdy5zX2FjY291bnQpXG4gIC5vcHRpb24oJ2luY2x1ZGVUaW1lc3RhbXAnLCB0cnVlKVxuICAub3B0aW9uKCd2ZXJzaW9uJywgMSlcbiAgLnNPcHRpb24oJ3Zpc2l0b3JJRCcpXG4gIC5zT3B0aW9uKCdjaGFubmVsJylcbiAgLnNPcHRpb24oJ2NhbXBhaWduJylcbiAgLnNPcHRpb24oJ3N0YXRlJylcbiAgLnNPcHRpb24oJ3ppcCcpXG4gIC5zT3B0aW9uKCdwYWdlTmFtZScpXG4gIC5zT3B0aW9uKCd0cmFja2luZ1NlcnZlcicpXG4gIC5zT3B0aW9uKCd0cmFja2luZ1NlcnZlclNlY3VyZScpXG4gIC5zT3B0aW9uKCd2aXNpdG9yTWlncmF0aW9uS2V5JylcbiAgLnNPcHRpb24oJ3Zpc2l0b3JNaWdyYXRpb25TZXJ2ZXInKVxuICAuc09wdGlvbigndmlzaXRvck5hbWVzcGFjZScpXG4gIC5zT3B0aW9uKCdkYycpXG4gIC5zT3B0aW9uKCdjaGFyU2V0JywgJ0lTTy04ODU5LTEnKVxuICAuc09wdGlvbignY3VycmVuY3lDb2RlJywgJ1VTRCcpXG4gIC5zT3B0aW9uKCd0cmFja0Rvd25sb2FkTGlua3MnLCB0cnVlKVxuICAuc09wdGlvbigndHJhY2tFeHRlcm5hbExpbmtzJywgdHJ1ZSlcbiAgLnNPcHRpb24oJ3RyYWNrSW5saW5lU3RhdHMnLCB0cnVlKVxuICAuc09wdGlvbignbGlua0Rvd25sb2FkRmlsZVR5cGVzJywgJ2V4ZSx6aXAsd2F2LG1wMyxtb3YsbXBnLGF2aSx3bXYscGRmLGRvYyxkb2N4LHhscyx4bHN4LHBwdCxwcHR4JylcbiAgLnNPcHRpb24oJ2xpbmtJbnRlcm5hbEZpbHRlcnMnKVxuICAuc09wdGlvbignbGlua0xlYXZlUXVlcnlTdHJpbmcnLCBmYWxzZSlcbiAgLnNPcHRpb24oJ2xpbmtUcmFja1ZhcnMnLCAnTm9uZScpXG4gIC5zT3B0aW9uKCdsaW5rVHJhY2tFdmVudHMnLCAnTm9uZScpXG4gIC5zT3B0aW9uKCd1c2VQbHVnaW5zJywgdHJ1ZSlcbiAgLnRhZygnMScsICc8c2NyaXB0IHNyYz1cIi8vY2RuLnNlZ21lbnQuaW8vaW50ZWdyYXRpb25zL29tbml0dXJlL0guMjYuMi9vbW5pdHVyZS5taW4uanNcIj4nKVxuICAudGFnKCcyJywgJzxzY3JpcHQgc3JjPVwiaHR0cDovL2xvY2FsaG9zdDoxNzM4L2FwcG1lYXN1cmVtZW50Lm1pbi5qc1wiPicpO1xuICAvLyAudGFnKCcyJywgJzxzY3JpcHQgc3JjPVwiLy9jZG4uc2VnbWVudC5pby9pbnRlZ3JhdGlvbnMvb21uaXR1cmUvQXBwTWVhc3VyZW1lbnQtMS42L2FwcG1lYXN1cmVtZW50Lm1pbi5qc1wiPicpOyAvLyBUT0RPOiB1bmNvbW1lbnQgb25jZSBDRE4gaXNzdWVzIGFyZSByZXNvbHZlZFxuXG4vKipcbiAqIEluaXRpYWxpemUuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5PbW5pdHVyZS5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIC8vIExvd2VyY2FzZSBhbGwga2V5cyBvZiBldmVudCBtYXAgZm9yIGVhc3kgbWF0Y2hpbmcgbGF0ZXJcbiAgbG93ZXJjYXNlS2V5cyhvcHRpb25zLmV2ZW50cyk7XG5cbiAgLy8gSW4gY2FzZSB0aGlzIGhhcyBiZWVuIGRlZmluZWQgYWxyZWFkeVxuICB3aW5kb3cuc19hY2NvdW50ID0gd2luZG93LnNfYWNjb3VudCB8fCBvcHRpb25zLnJlcG9ydFN1aXRlSWQ7XG5cbiAgLy8gVE9ETzogY29uc2lkZXIgcmVtb3ZpbmcgdGhpcyBzaW5jZSBpdCBoYXMgbm8gZnV0dXJlIHJlZmVyZW5jZVxuICB0aGlzLmxvYWRlZEJ5U2VnbWVudGlvID0gdHJ1ZTtcblxuICAvLyBEZWNpZGUgd2hpY2ggc2NyaXB0IHRvIGxvYWRcbiAgLy8gdGhpcy5sb2FkIHJlcXVpcmVzIGEgc3RyaW5nXG4gIHZhciB2ZXJzaW9uID0gb3B0aW9ucy52ZXJzaW9uID09PSAyID8gJzInIDogJzEnO1xuXG4gIC8vIEV4dGVuZCB0aGlzIGludGVncmF0aW9uIHdpdGggcHJvcGVyIEFQSSBtZXRob2RzXG4gIGlmIChvcHRpb25zLnZlcnNpb24gPT09IDIpIHtcbiAgICBleHRlbmQodGhpcywgdjJNZXRob2RzKTtcbiAgfSBlbHNlIHtcbiAgICBleHRlbmQodGhpcywgdjFNZXRob2RzKTtcbiAgfVxuXG4gIHRoaXMubG9hZCh2ZXJzaW9uLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgcyA9IHdpbmRvdy5zO1xuICAgIC8vIFRPRE86IHJlbmFtZSBvbiBzZXJ2ZXItc2lkZSBhbmQgbW9iaWxlXG4gICAgcy50cmFja2luZ1NlcnZlciA9IHMudHJhY2tpbmdTZXJ2ZXIgfHwgb3B0aW9ucy50cmFja2luZ1NlcnZlclVybDtcbiAgICBzLnRyYWNraW5nU2VydmVyU2VjdXJlID0gcy50cmFja2luZ1NlcnZlclNlY3VyZSB8fCBvcHRpb25zLnRyYWNraW5nU2VydmVyU2VjdXJlVXJsO1xuICAgIHNlbGYucmVhZHkoKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIE9tbml0dXJlIGlzIGxvYWRlZCBpZiB0aGUgYHdpbmRvdy5zX2dpYCBmdW5jdGlvbiBleGlzdHMuXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gbG9hZGVkXG4gKi9cblxuT21uaXR1cmUucHJvdG90eXBlLmxvYWRlZCA9IGZ1bmN0aW9uKCkge1xuICAvLyBUT0RPOiB3b3VsZG4ndCB0aGlzIGFsd2F5cyBwYXNzIGJlY2F1c2Ugb2YgdGhlIC5nbG9iYWwoc19naSkgPz9cbiAgcmV0dXJuICEhd2luZG93LnNfZ2k7XG59O1xuXG4vKipcbiAqIExvd2VyY2FzZSBhbGwgb2YgYW4gb2JqZWN0J3Mga2V5cy5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5mdW5jdGlvbiBsb3dlcmNhc2VLZXlzKG9iaikge1xuICBvYmogPSBvYmogfHwge307XG4gIGVhY2gob2JqLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgZGVsZXRlIG9ialtrZXldO1xuICAgIG9ialtrZXkudG9Mb3dlckNhc2UoKV0gPSB2YWx1ZTtcbiAgfSk7XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogUmV0dXJuIHdoZXRoZXIgYHN0cmAgaXMgYW4gZW1wdHkgc3RyaW5nLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHJldHVybiB7Ym9vbGVhbn0gZW1wdHlcbiAqL1xuXG5mdW5jdGlvbiBpc0VtcHR5U3RyaW5nKHN0cikge1xuICByZXR1cm4gdHlwZW9mIHN0ciA9PT0gJ3N0cmluZycgJiYgc3RyLmxlbmd0aCA9PT0gMDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBoYXNPd25Qcm9wZXJ0eSByZWZlcmVuY2UuXG4gKi9cblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQ29weSB0aGUgcHJvcGVydGllcyBvZiBvbmUgb3IgbW9yZSBgb2JqZWN0c2Agb250byBhIGRlc3RpbmF0aW9uIG9iamVjdC4gSW5wdXQgb2JqZWN0cyBhcmUgaXRlcmF0ZWQgb3ZlclxuICogaW4gbGVmdC10by1yaWdodCBvcmRlciwgc28gZHVwbGljYXRlIHByb3BlcnRpZXMgb24gbGF0ZXIgb2JqZWN0cyB3aWxsIG92ZXJ3cml0ZSB0aG9zZSBmcm9tXG4gKiBlcmV2aW91cyBvbmVzLiBPbmx5IGVudW1lcmFibGUgYW5kIG93biBwcm9wZXJ0aWVzIG9mIHRoZSBpbnB1dCBvYmplY3RzIGFyZSBjb3BpZWQgb250byB0aGVcbiAqIHJlc3VsdGluZyBvYmplY3QuXG4gKlxuICogQG5hbWUgZXh0ZW5kXG4gKiBAYXBpIHB1YmxpY1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IGRlc3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBzb3VyY2VzIFRoZSBzb3VyY2Ugb2JqZWN0cy5cbiAqIEByZXR1cm4ge09iamVjdH0gYGRlc3RgLCBleHRlbmRlZCB3aXRoIHRoZSBwcm9wZXJ0aWVzIG9mIGFsbCBgc291cmNlc2AuXG4gKiBAZXhhbXBsZVxuICogdmFyIGEgPSB7IGE6ICdhJyB9O1xuICogdmFyIGIgPSB7IGI6ICdiJyB9O1xuICogdmFyIGMgPSB7IGM6ICdjJyB9O1xuICpcbiAqIGV4dGVuZChhLCBiLCBjKTtcbiAqIC8vPT4geyBhOiAnYScsIGI6ICdiJywgYzogJ2MnIH07XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZXN0IC8qLCBzb3VyY2VzICovKSB7XG4gIHZhciBzb3VyY2VzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHNvdXJjZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlc1tpXSkge1xuICAgICAgaWYgKGhhcy5jYWxsKHNvdXJjZXNbaV0sIGtleSkpIHtcbiAgICAgICAgZGVzdFtrZXldID0gc291cmNlc1tpXVtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZXN0O1xufTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0b0Z1bmN0aW9uID0gcmVxdWlyZSgndG8tZnVuY3Rpb24nKTtcbnZhciB0eXBlO1xuXG50cnkge1xuICB0eXBlID0gcmVxdWlyZSgndHlwZS1jb21wb25lbnQnKTtcbn0gY2F0Y2ggKGUpIHtcbiAgdHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcbn1cblxuLyoqXG4gKiBIT1AgcmVmZXJlbmNlLlxuICovXG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEl0ZXJhdGUgdGhlIGdpdmVuIGBvYmpgIGFuZCBpbnZva2UgYGZuKHZhbCwgaSlgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fE9iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgZm4pe1xuICBmbiA9IHRvRnVuY3Rpb24oZm4pO1xuICBzd2l0Y2ggKHR5cGUob2JqKSkge1xuICAgIGNhc2UgJ2FycmF5JzpcbiAgICAgIHJldHVybiBhcnJheShvYmosIGZuKTtcbiAgICBjYXNlICdvYmplY3QnOlxuICAgICAgaWYgKCdudW1iZXInID09IHR5cGVvZiBvYmoubGVuZ3RoKSByZXR1cm4gYXJyYXkob2JqLCBmbik7XG4gICAgICByZXR1cm4gb2JqZWN0KG9iaiwgZm4pO1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gc3RyaW5nKG9iaiwgZm4pO1xuICB9XG59O1xuXG4vKipcbiAqIEl0ZXJhdGUgc3RyaW5nIGNoYXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzdHJpbmcob2JqLCBmbikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG9iai5sZW5ndGg7ICsraSkge1xuICAgIGZuKG9iai5jaGFyQXQoaSksIGkpO1xuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZSBvYmplY3Qga2V5cy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gb2JqZWN0KG9iaiwgZm4pIHtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXMuY2FsbChvYmosIGtleSkpIHtcbiAgICAgIGZuKGtleSwgb2JqW2tleV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGUgYXJyYXktaXNoLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBhcnJheShvYmosIGZuKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgKytpKSB7XG4gICAgZm4ob2JqW2ldLCBpKTtcbiAgfVxufVxuIiwiLy8gaHR0cHM6Ly9kZXZlbG9wZXIub21uaXR1cmUuY29tL2VuX1VTL2NvbnRlbnRfcGFnZS9zaXRlY2F0YWx5c3QtdGFnZ2luZy9jLXRhZ2dpbmctb3ZlcnZpZXdcbi8vIGh0dHA6Ly9ibG9ncy5hZG9iZS5jb20vZGlnaXRhbG1hcmtldGluZy9hbmFseXRpY3MvY3VzdG9tLWxpbmstdHJhY2tpbmctY2FwdHVyaW5nLXVzZXItYWN0aW9ucy9cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm9tbml0dXJlLmNvbS9lbl9VUy9mb3J1bS9nZW5lcmFsLXRvcGljLWZvcnVtL2RpZmZlcmVuY2UtYmV0d2Vlbi1zLXQtYW5kLXMtdDFcblxudmFyIGRvdCA9IHJlcXVpcmUoJ29iai1jYXNlJyk7XG52YXIgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcbnZhciBpc28gPSByZXF1aXJlKCd0by1pc28tc3RyaW5nJyk7XG52YXIgbWFwID0gcmVxdWlyZSgnbWFwJyk7XG52YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcblxuLyoqXG4gKiBLZXlzIHRoYXQgZ2V0IGFwcGxpZWQgdG8gYHdpbmRvdy5zYCBvYmplY3QsXG4gKiBidXQgbmVlZCB0byBiZSBjbGVhcmVkIG91dCBiZWZvcmUgZXZlcnkgY2FsbC5cbiAqL1xuXG52YXIgZHluYW1pY0tleXMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2YgZWNvbW1lcmNlIGV2ZW50IG5hbWVzLlxuICovXG5cbnZhciBvbW5pdHVyZUV2ZW50TWFwID0ge1xuICAvLyBlY29tbWVyY2UgYXBpXG4gIHByb2RWaWV3OiBbL3ZpZXdlZCBwcm9kdWN0L2ldLFxuICBzY0FkZDogWy9hZGRlZCBwcm9kdWN0L2ldLFxuICBzY1JlbW92ZTogWy9yZW1vdmVkIHByb2R1Y3QvaV0sXG4gIHB1cmNoYXNlOiBbL2NvbXBsZXRlZCBvcmRlci9pXSxcblxuICAvLyBvbW5pdHVyZSBzcGVjaWZpY1xuICBzY1ZpZXc6IFsvdmlld2VkIGNhcnQvaV0sXG4gIC8vIHdoYXRldmVyIHRoYXQgbWVhbnNcbiAgc2NPcGVuOiBbL29wZW5lZCBjYXJ0L2ldLFxuICBzY0NoZWNrb3V0OiBbL3ZpZXdlZCBjaGVja291dC9pXVxufTtcblxuLyoqXG4gKiBDcmVhdGUgVjEgTWV0aG9kIG9iamVjdCB0byBhdHRhY2ggbWV0aG9kcyB0by5cbiAqL1xuXG52YXIgdjFNZXRob2RzID0ge307XG5cbi8qKlxuICogVHJhY2suXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEBwYXJhbSB7VHJhY2t9IHRyYWNrXG4gKi9cblxudjFNZXRob2RzLnRyYWNrID0gZnVuY3Rpb24odHJhY2spIHtcbiAgaWYgKCF3aW5kb3cuc19naSkgcmV0dXJuO1xuXG4gIHZhciBldmVudCA9IGFsaWFzRXZlbnQodHJhY2suZXZlbnQoKSwgdGhpcy5vcHRpb25zLmV2ZW50cyk7XG4gIGlmICghZXZlbnQpIHJldHVybjtcblxuICB2YXIgcHJvcGVydGllcyA9IHRyYWNrLnByb3BlcnRpZXMoKTtcbiAgd2luZG93LnMubGlua1RyYWNrRXZlbnRzID0gZXZlbnQ7XG5cbiAgY2xlYXJLZXlzKGR5bmFtaWNLZXlzKTtcblxuICAvLyBVcGRhdGUgdGhlIG9tbml0dXJlIHZhcmlhYmxlIGFuZCBleHBsaWNpdGx5IG1hcmsgdGhlIGxpbmsgdmFyc1xuICBmdW5jdGlvbiB1cGRhdGUoa2V5LCB2YWx1ZSkge1xuICAgIGlmICgha2V5IHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHJldHVybjtcbiAgICBkeW5hbWljS2V5cy5wdXNoKGtleSk7XG4gICAgd2luZG93LnNba2V5XSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cblxuICB1cGRhdGUoJ2V2ZW50cycsIGV2ZW50KTtcbiAgdXBkYXRlKCdjaGFubmVsJywgcHJvcGVydGllcy5jaGFubmVsIHx8IHRoaXMub3B0aW9ucy5jaGFubmVsKTtcbiAgdXBkYXRlKCdjYW1wYWlnbicsIHByb3BlcnRpZXMuY2FtcGFpZ24gfHwgdGhpcy5vcHRpb25zLmNhbXBhaWduKTtcbiAgdXBkYXRlKCdwYWdlTmFtZScsIHByb3BlcnRpZXMucGFnZU5hbWUgfHwgdGhpcy5vcHRpb25zLnBhZ2VOYW1lKTtcbiAgdXBkYXRlKCdzdGF0ZScsIHByb3BlcnRpZXMuc3RhdGUgfHwgdGhpcy5vcHRpb25zLnN0YXRlKTtcbiAgdXBkYXRlKCd6aXAnLCBwcm9wZXJ0aWVzLnppcCB8fCB0aGlzLm9wdGlvbnMuemlwKTtcbiAgdXBkYXRlKCdwdXJjaGFzZUlEJywgcHJvcGVydGllcy5wdXJjaGFzZUlkKTtcbiAgdXBkYXRlKCd0cmFuc2FjdGlvbklEJywgcHJvcGVydGllcy50cmFuc2FjdGlvbklkKTtcblxuICAvLyBUaW1lc3RhbXAgbXVzdCBiZSBlaXRoZXIgdW5peCBvciBpc28tODYwMVxuICAvLyBTZWUgZG9jcy5wZGYgcGFnZSA5OC5cbiAgaWYgKHRoaXMub3B0aW9ucy5pbmNsdWRlVGltZXN0YW1wKSB7XG4gICAgdmFyIHRpbWVzdGFtcCA9IHByb3BlcnRpZXMudGltZXN0YW1wIHx8IHRyYWNrLnRpbWVzdGFtcCgpO1xuICAgIGlmICh0eXBlb2YgdGltZXN0YW1wICE9PSAnc3RyaW5nJykgdGltZXN0YW1wID0gaXNvKHRpbWVzdGFtcCk7XG4gICAgdXBkYXRlKCd0aW1lc3RhbXAnLCB0aW1lc3RhbXApO1xuICB9XG5cbiAgLy8gQWxpYXMgZm9yIG9tbml0dXJlIHNwZWNpZmljIGV2ZW50cy5cbiAgaWYgKG9tbml0dXJlRXZlbnRNYXBbZXZlbnRdKSB7XG4gICAgaWYgKHByb3BlcnRpZXMucHJvZHVjdCkge1xuICAgICAgdXBkYXRlKCdwcm9kdWN0cycsIGZvcm1hdFByb2R1Y3QocHJvcGVydGllcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcHJvZHVjdHMgPSBwcm9wZXJ0aWVzLnByb2R1Y3RzO1xuICAgICAgaWYgKHByb2R1Y3RzICYmIHR5cGUocHJvZHVjdHMpID09PSAnYXJyYXknKSB7XG4gICAgICAgIHZhciBwcm9kdWN0U3RyaW5ncyA9IG1hcChwcm9kdWN0cywgZm9ybWF0UHJvZHVjdCk7XG4gICAgICAgIHVwZGF0ZSgncHJvZHVjdHMnLCBwcm9kdWN0U3RyaW5ncy5qb2luKCcsICcpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTZXQgcHJvcHMgYW5kIGVWYXJzIGZvciBldmVudCBwcm9wZXJ0aWVzXG4gIHZhciBwcm9wcyA9IGV4dHJhY3RQcm9wZXJ0aWVzKHByb3BlcnRpZXMsIHRoaXMub3B0aW9ucyk7XG4gIGVhY2gocHJvcHMsIHVwZGF0ZSk7XG5cbiAgLy8gU2V0IGVWYXIgZm9yIGV2ZW50IG5hbWVcbiAgdmFyIGV2ZW50RVZhciA9IGRvdCh0aGlzLm9wdGlvbnMuZVZhcnMsIHRyYWNrLmV2ZW50KCkpO1xuICB1cGRhdGUoZXZlbnRFVmFyLCB0cmFjay5ldmVudCgpKTtcblxuICB3aW5kb3cucy5saW5rVHJhY2tWYXJzID0gZHluYW1pY0tleXMuam9pbignLCcpO1xuXG4gIC8vIFNlbmQgcmVxdWVzdCBvZmYgdG8gT21uaXR1cmVcbiAgd2luZG93LnMudGwodHJ1ZSwgJ28nLCB0cmFjay5ldmVudCgpKTtcbn07XG5cbi8qKlxuICogUGFnZS5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtQYWdlfSBwYWdlXG4gKi9cblxudjFNZXRob2RzLnBhZ2UgPSBmdW5jdGlvbihwYWdlKSB7XG4gIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAvLyBJZiB3ZSBpZ25vcmUgdGhlIGZpcnN0IHBhZ2V2aWV3LCBlbmFibGUgZm9yIGFsbCBzdWJzZXF1ZW50IHBhZ2V2aWV3c1xuICBpZiAob3B0aW9ucy5wYWdlID09IG51bGwpIG9wdGlvbnMucGFnZSA9IG9wdGlvbnMuaW5pdGlhbFBhZ2U7XG4gIGlmICghb3B0aW9ucy5wYWdlKSB7XG4gICAgb3B0aW9ucy5wYWdlID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJZiBvbW5pdHVyZSBpc24ndCBsb2FkZWQgeWV0LCB0cnkgYWdhaW4gc29vbi5cbiAgaWYgKCF0aGlzLmxvYWRlZCgpKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnBhZ2UocGFnZSk7XG4gICAgfSwgMTAwKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBTZXQgdGhlIHBhZ2UgbmFtZVxuICB2YXIgbmFtZSA9IHBhZ2UuZnVsbE5hbWUoKTtcbiAgd2luZG93LnMucGFnZU5hbWUgPSBuYW1lO1xuXG4gIC8vIFZpc2l0b3IgSUQuXG4gIHZhciB1c2VyID0gdGhpcy5hbmFseXRpY3MudXNlcigpO1xuICBpZiAodXNlci5pZCgpKSB3aW5kb3cucy52aXNpdG9ySUQgPSB1c2VyLmlkKCk7XG5cbiAgLy8gR2V0IHRoZSBwcm9wZXJ0aWVzXG4gIHZhciB0cmFjayA9IHBhZ2UudHJhY2soKTtcbiAgdmFyIHByb3BlcnRpZXMgPSB0cmFjay5wcm9wZXJ0aWVzKCk7XG5cbiAgY2xlYXJLZXlzKGR5bmFtaWNLZXlzKTtcbiAgLy8gVXBkYXRlIHRoZSBvbW5pdHVyZSB2YXJpYWJsZSBhbmQgZXhwbGljaXRseSBtYXJrIHRoZSBsaW5rIHZhcnNcbiAgZnVuY3Rpb24gdXBkYXRlKGtleSwgdmFsdWUpIHtcbiAgICBpZiAoIWtleSB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSByZXR1cm47XG4gICAgZHluYW1pY0tleXMucHVzaChrZXkpO1xuICAgIHdpbmRvdy5zW2tleV0gPSB2YWx1ZS50b1N0cmluZygpO1xuICB9XG5cbiAgdXBkYXRlKCdldmVudHMnLCBuYW1lKTtcbiAgdXBkYXRlKCdjaGFubmVsJywgcHJvcGVydGllcy5jaGFubmVsIHx8IHRoaXMub3B0aW9ucy5jaGFubmVsKTtcbiAgdXBkYXRlKCdjYW1wYWlnbicsIHByb3BlcnRpZXMuY2FtcGFpZ24gfHwgdGhpcy5vcHRpb25zLmNhbXBhaWduKTtcbiAgdXBkYXRlKCdzdGF0ZScsIHByb3BlcnRpZXMuc3RhdGUgfHwgdGhpcy5vcHRpb25zLnN0YXRlKTtcbiAgdXBkYXRlKCd6aXAnLCBwcm9wZXJ0aWVzLnppcCB8fCB0aGlzLm9wdGlvbnMuemlwKTtcbiAgdXBkYXRlKCdwdXJjaGFzZUlEJywgcHJvcGVydGllcy5wdXJjaGFzZUlkKTtcbiAgdXBkYXRlKCd0cmFuc2FjdGlvbklEJywgcHJvcGVydGllcy50cmFuc2FjdGlvbklkKTtcblxuICBpZiAodGhpcy5vcHRpb25zLmluY2x1ZGVUaW1lc3RhbXApIHtcbiAgICB2YXIgdGltZXN0YW1wID0gcHJvcGVydGllcy50aW1lc3RhbXAgfHwgdHJhY2sudGltZXN0YW1wKCk7XG4gICAgaWYgKHR5cGVvZiB0aW1lc3RhbXAgIT09ICdzdHJpbmcnKSB0aW1lc3RhbXAgPSBpc28odGltZXN0YW1wKTtcbiAgICB1cGRhdGUoJ3RpbWVzdGFtcCcsIHRpbWVzdGFtcCk7XG4gIH1cblxuICB2YXIgcHJvcHMgPSBleHRyYWN0UHJvcGVydGllcyhwcm9wZXJ0aWVzLCB0aGlzLm9wdGlvbnMpO1xuICBlYWNoKHByb3BzLCB1cGRhdGUpO1xuXG4gIC8vIGFjdHVhbGx5IG1ha2UgdGhlIFwicGFnZVwiIHJlcXVlc3QsIGp1c3QgYSBzaW5nbGUgXCJ0XCIgbm8gXCJ0bFwiXG4gIHdpbmRvdy5zLnQoKTtcbn07XG5cbi8qKlxuICogQWxpYXMgYSByZWd1bGFyIGV2ZW50IGBuYW1lYCB0byBhbiBPbW5pdHVyZSBldmVudCwgdXNpbmcgYSBkaWN0aW9uYXJ5IG9mXG4gKiBgZXZlbnRzYC5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnRzXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuXG5mdW5jdGlvbiBhbGlhc0V2ZW50KG5hbWUsIGV2ZW50cykge1xuICB2YXIgYWxpYXNlZCA9IG51bGw7XG5cbiAgLy8gRmlyc3QgYXR0ZW1wdCB0byBsb29rIHRocm91Z2ggb21uaXR1cmUgZXZlbnRzXG4gIGVhY2gob21uaXR1cmVFdmVudE1hcCwgZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKG5hbWUgPT09IGtleSkge1xuICAgICAgYWxpYXNlZCA9IGtleTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgcmVnZXhlcyA9IG9tbml0dXJlRXZlbnRNYXBba2V5XTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlZ2V4ZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgICBhbGlhc2VkID0ga2V5O1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBpZiAoYWxpYXNlZCkgcmV0dXJuIGFsaWFzZWQ7XG5cbiAgLy8gT3RoZXJ3aXNlIGlmIGl0IGhhcyBhbiBhbGlhc2VkIG5hbWUgdG8gYSBzdG9yZWQgZXZlbnQuXG4gIGlmIChldmVudHNbbmFtZS50b0xvd2VyQ2FzZSgpXSkgcmV0dXJuIGV2ZW50c1tuYW1lLnRvTG93ZXJDYXNlKCldO1xuXG4gIC8vIEhvcGUgdGhhdCB0aGV5IHBhc3NlZCBpbiBhIG5vcm1hbCBldmVudFxuICBpZiAoL2V2ZW50XFxkKy8udGVzdChuYW1lKSkgcmV0dXJuIG5hbWU7XG59XG5cbi8qKlxuICogRm9ybWF0IHByb2R1Y3QgZGVzY3JpcHRpb25zIGZyb20gb2JqZWN0cyB0byBPbW5pdHVyZSBkZXNjcmlwdGlvbiBzdHJpbmdzLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0aW9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0UHJvZHVjdChkZXNjcmlwdGlvbikge1xuICByZXR1cm4gW1xuICAgIGRlc2NyaXB0aW9uLmNhdGVnb3J5LFxuICAgIGRlc2NyaXB0aW9uLnByb2R1Y3QsXG4gICAgZGVzY3JpcHRpb24ucXVhbnRpdHkgfHwgMSxcbiAgICBkZXNjcmlwdGlvbi5wcmljZSB8fCAwXG4gIF0uam9pbignOyAnKTtcbn1cblxuLyoqXG4gKiBDbGVhciBsYXN0IGtleXMgdXNlZCB3aXRoIG9tbml0dXJlLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0ga2V5c1xuICovXG5cbmZ1bmN0aW9uIGNsZWFyS2V5cyhrZXlzKSB7XG4gIGVhY2goa2V5cywgZnVuY3Rpb24obGlua1Zhcikge1xuICAgIGRlbGV0ZSB3aW5kb3cuc1tsaW5rVmFyXTtcbiAgfSk7XG4gIGtleXMubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHByb3BlcnRpZXMgZm9yIGB3aW5kb3cuc2AuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gcHJvcHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gZXh0cmFjdFByb3BlcnRpZXMocHJvcHMsIG9wdGlvbnMpIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuXG4gIC8vIDEuIG1hcCBlVmFyc1xuICBlYWNoKG9wdGlvbnMuZVZhcnMsIGZ1bmN0aW9uKG1hcHBlZEtleSwgbWFwcGVkVmFsdWUpIHtcbiAgICB2YXIgdmFsdWUgPSBkb3QocHJvcHMsIG1hcHBlZEtleSk7XG4gICAgLy8gZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgaWYgKHZhbHVlICE9IG51bGwpIHJlc3VsdFttYXBwZWRWYWx1ZV0gPSB2YWx1ZTtcbiAgfSk7XG5cbiAgLy8gMi4gbWFwIHByb3BzXG4gIGVhY2gob3B0aW9ucy5wcm9wcywgZnVuY3Rpb24obWFwcGVkS2V5LCBtYXBwZWRWYWx1ZSkge1xuICAgIHZhciB2YWx1ZSA9IGRvdChwcm9wcywgbWFwcGVkS2V5KTtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkgcmVzdWx0W21hcHBlZFZhbHVlXSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyAzLiBtYXAgaFZhcnNcbiAgZWFjaChvcHRpb25zLmhWYXJzLCBmdW5jdGlvbihtYXBwZWRLZXksIG1hcHBlZFZhbHVlKSB7XG4gICAgdmFyIHZhbHVlID0gZG90KHByb3BzLCBtYXBwZWRLZXkpO1xuICAgIGlmICh2YWx1ZSAhPSBudWxsKSByZXN1bHRbbWFwcGVkVmFsdWVdID0gdmFsdWU7XG4gIH0pO1xuXG4gIC8vIDQuIG1hcCBiYXNpYyBwcm9wZXJ0aWVzXG4gIC8vIHRoZXkgZG9uJ3QgaGF2ZSBhIHNwZWNpZmljIG1hcHBpbmcsIGJ1dFxuICAvLyBuYW1lZCBpdCBsaWtlIG9tbml0dXJlIGRvZXNcbiAgZWFjaChwcm9wcywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgIGlmICgoL3Byb3BcXGQrL2kpLnRlc3Qoa2V5KSB8fCAoL2VWYXJcXGQrL2kpLnRlc3Qoa2V5KSB8fCAoL2hpZXJcXGQrL2kpLnRlc3Qoa2V5KSkge1xuICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHByb3AgPSBkb3Qob3B0aW9ucy5wcm9wcywga2V5KTtcbiAgICB2YXIgZVZhciA9IGRvdChvcHRpb25zLmVWYXJzLCBrZXkpO1xuICAgIHZhciBoVmFyID0gZG90KG9wdGlvbnMuaFZhcnMsIGtleSk7XG4gICAgLy8gQWRkIGNhc2UgZm9yIG1pcnJvcmluZyBhIHByb3AgcG9zdCBjaGVjay5cbiAgICBpZiAoIWVWYXIgJiYgcHJvcCkgZVZhciA9IG9wdGlvbnMuZVZhcnNbcHJvcF07XG4gICAgaWYgKHByb3ApIHJlc3VsdFtwcm9wXSA9IHZhbHVlO1xuICAgIGlmIChlVmFyKSByZXN1bHRbZVZhcl0gPSB2YWx1ZTtcbiAgICBpZiAoaFZhcikgcmVzdWx0W2hWYXJdID0gdmFsdWU7XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogTWV0YWRhdGEgdXNlZCBmb3IgdGVzdGluZy4gUGxlYXNlIGRvIG5vdCB1c2UgYW55d2hlcmUgZWxzZSBpbiBjb2RlXG4gKi9cblxudjFNZXRob2RzLl9fdmVyc2lvbiA9IDE7XG5cbi8qKlxuICogRXhwb3NlIGB2MU1ldGhvZHNgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gdjFNZXRob2RzO1xuXG4iLCJcbnZhciBpZGVudGl0eSA9IGZ1bmN0aW9uKF8peyByZXR1cm4gXzsgfTtcblxuXG4vKipcbiAqIE1vZHVsZSBleHBvcnRzLCBleHBvcnRcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzLmZpbmQgPSBtdWx0aXBsZShmaW5kKTtcblxuXG4vKipcbiAqIEV4cG9ydCB0aGUgcmVwbGFjZW1lbnQgZnVuY3Rpb24sIHJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG4gKi9cblxubW9kdWxlLmV4cG9ydHMucmVwbGFjZSA9IGZ1bmN0aW9uIChvYmosIGtleSwgdmFsKSB7XG4gIG11bHRpcGxlKHJlcGxhY2UpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIHJldHVybiBvYmo7XG59O1xuXG5cbi8qKlxuICogRXhwb3J0IHRoZSBkZWxldGUgZnVuY3Rpb24sIHJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG4gKi9cblxubW9kdWxlLmV4cG9ydHMuZGVsID0gZnVuY3Rpb24gKG9iaiwga2V5KSB7XG4gIG11bHRpcGxlKGRlbCkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgcmV0dXJuIG9iajtcbn07XG5cblxuLyoqXG4gKiBDb21wb3NlIGFwcGx5aW5nIHRoZSBmdW5jdGlvbiB0byBhIG5lc3RlZCBrZXlcbiAqL1xuXG5mdW5jdGlvbiBtdWx0aXBsZSAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIHBhdGgsIHZhbCkge1xuICAgIHBhdGggPSBub3JtYWxpemUocGF0aCk7XG5cbiAgICB2YXIga2V5O1xuICAgIHZhciBmaW5pc2hlZCA9IGZhbHNlO1xuXG4gICAgd2hpbGUgKCFmaW5pc2hlZCkgbG9vcCgpO1xuXG4gICAgZnVuY3Rpb24gbG9vcCgpIHtcbiAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICB2YXIgbm9ybWFsaXplZEtleSA9IG5vcm1hbGl6ZShrZXkpO1xuICAgICAgICBpZiAoMCA9PT0gcGF0aC5pbmRleE9mKG5vcm1hbGl6ZWRLZXkpKSB7XG4gICAgICAgICAgdmFyIHRlbXAgPSBwYXRoLnN1YnN0cihub3JtYWxpemVkS2V5Lmxlbmd0aCk7XG4gICAgICAgICAgaWYgKHRlbXAuY2hhckF0KDApID09PSAnLicgfHwgdGVtcC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHBhdGggPSB0ZW1wLnN1YnN0cigxKTtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IG9ialtrZXldO1xuXG4gICAgICAgICAgICAvLyB3ZSdyZSBhdCB0aGUgZW5kIGFuZCB0aGVyZSBpcyBub3RoaW5nLlxuICAgICAgICAgICAgaWYgKG51bGwgPT0gY2hpbGQpIHtcbiAgICAgICAgICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBvYmogPSBudWxsO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHdlJ3JlIGF0IHRoZSBlbmQgYW5kIHRoZXJlIGlzIHNvbWV0aGluZy5cbiAgICAgICAgICAgIGlmICghcGF0aC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHN0ZXAgaW50byBjaGlsZFxuICAgICAgICAgICAgb2JqID0gY2hpbGQ7XG5cbiAgICAgICAgICAgIC8vIGJ1dCB3ZSdyZSBkb25lIGhlcmVcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAga2V5ID0gdW5kZWZpbmVkO1xuICAgICAgLy8gaWYgd2UgZm91bmQgbm8gbWF0Y2hpbmcgcHJvcGVydGllc1xuICAgICAgLy8gb24gdGhlIGN1cnJlbnQgb2JqZWN0LCB0aGVyZSdzIG5vIG1hdGNoLlxuICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICgha2V5KSByZXR1cm47XG5cbiAgICAvLyB0aGUgYG9iamAgYW5kIGBrZXlgIGlzIG9uZSBhYm92ZSB0aGUgbGVhZiBvYmplY3QgYW5kIGtleSwgc29cbiAgICAvLyBzdGFydCBvYmplY3Q6IHsgYTogeyAnYi5jJzogMTAgfSB9XG4gICAgLy8gZW5kIG9iamVjdDogeyAnYi5jJzogMTAgfVxuICAgIC8vIGVuZCBrZXk6ICdiLmMnXG4gICAgLy8gdGhpcyB3YXksIHlvdSBjYW4gZG8gYG9ialtrZXldYCBhbmQgZ2V0IGAxMGAuXG4gICAgcmV0dXJuIGZuKG9iaiwga2V5LCB2YWwpO1xuICB9O1xufVxuXG5cbi8qKlxuICogRmluZCBhbiBvYmplY3QgYnkgaXRzIGtleVxuICpcbiAqIGZpbmQoeyBmaXJzdF9uYW1lIDogJ0NhbHZpbicgfSwgJ2ZpcnN0TmFtZScpXG4gKi9cblxuZnVuY3Rpb24gZmluZCAob2JqLCBrZXkpIHtcbiAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSByZXR1cm4gb2JqW2tleV07XG59XG5cblxuLyoqXG4gKiBEZWxldGUgYSB2YWx1ZSBmb3IgYSBnaXZlbiBrZXlcbiAqXG4gKiBkZWwoeyBhIDogJ2InLCB4IDogJ3knIH0sICdYJyB9KSAtPiB7IGEgOiAnYicgfVxuICovXG5cbmZ1bmN0aW9uIGRlbCAob2JqLCBrZXkpIHtcbiAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSBkZWxldGUgb2JqW2tleV07XG4gIHJldHVybiBvYmo7XG59XG5cblxuLyoqXG4gKiBSZXBsYWNlIGFuIG9iamVjdHMgZXhpc3RpbmcgdmFsdWUgd2l0aCBhIG5ldyBvbmVcbiAqXG4gKiByZXBsYWNlKHsgYSA6ICdiJyB9LCAnYScsICdjJykgLT4geyBhIDogJ2MnIH1cbiAqL1xuXG5mdW5jdGlvbiByZXBsYWNlIChvYmosIGtleSwgdmFsKSB7XG4gIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkgb2JqW2tleV0gPSB2YWw7XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogTm9ybWFsaXplIGEgYGRvdC5zZXBhcmF0ZWQucGF0aGAuXG4gKiBcbiAqIEEuSEVMTCghKiYjKCEpT19XT1IgICBMRC5iYXIgPT4gYWhlbGxvd29ybGRiYXJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShwYXRoKSB7XG4gIHJldHVybiBwYXRoLnJlcGxhY2UoL1teYS16QS1aMC05XFwuXSsvZywgJycpLnRvTG93ZXJDYXNlKCk7XG59IiwiXG4vKipcbiAqIEV4cG9zZSBgdG9Jc29TdHJpbmdgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gdG9Jc29TdHJpbmc7XG5cblxuLyoqXG4gKiBUdXJuIGEgYGRhdGVgIGludG8gYW4gSVNPIHN0cmluZy5cbiAqXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9EYXRlL3RvSVNPU3RyaW5nXG4gKlxuICogQHBhcmFtIHtEYXRlfSBkYXRlXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gdG9Jc29TdHJpbmcgKGRhdGUpIHtcbiAgcmV0dXJuIGRhdGUuZ2V0VVRDRnVsbFllYXIoKVxuICAgICsgJy0nICsgcGFkKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpXG4gICAgKyAnLScgKyBwYWQoZGF0ZS5nZXRVVENEYXRlKCkpXG4gICAgKyAnVCcgKyBwYWQoZGF0ZS5nZXRVVENIb3VycygpKVxuICAgICsgJzonICsgcGFkKGRhdGUuZ2V0VVRDTWludXRlcygpKVxuICAgICsgJzonICsgcGFkKGRhdGUuZ2V0VVRDU2Vjb25kcygpKVxuICAgICsgJy4nICsgU3RyaW5nKChkYXRlLmdldFVUQ01pbGxpc2Vjb25kcygpLzEwMDApLnRvRml4ZWQoMykpLnNsaWNlKDIsIDUpXG4gICAgKyAnWic7XG59XG5cblxuLyoqXG4gKiBQYWQgYSBgbnVtYmVyYCB3aXRoIGEgdGVuJ3MgcGxhY2UgemVyby5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbnVtYmVyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gcGFkIChudW1iZXIpIHtcbiAgdmFyIG4gPSBudW1iZXIudG9TdHJpbmcoKTtcbiAgcmV0dXJuIG4ubGVuZ3RoID09PSAxID8gJzAnICsgbiA6IG47XG59IiwiXG4vKipcbiAqIFZhcmlvdXMgZG9jcyBmb3IgcmVmZXJlbmNlXG4gKlxuICogaHR0cHM6Ly9tYXJrZXRpbmcuYWRvYmUuY29tL3Jlc291cmNlcy9oZWxwL2VuX1VTL3NjL2ltcGxlbWVudC9hcHBtZWFzdXJlX21qc19taWdyYXRlLmh0bWxcbiAqIGh0dHBzOi8vd2ViYW5hbHl0aWNzZm9yZGV2ZWxvcGVycy5jb20vMjAxMy8xMi8xMC9taWdyYXRpbmctZnJvbS1oLWNvZGUtdG8tYXBwbWVhc3VyZW1lbnQvXG4gKiBodHRwczovL2Jsb2dzLmFkb2JlLmNvbS9kaWdpdGFsbWFya2V0aW5nL21vYmlsZS9saWdodGVuLXVwLXdpdGgtdGhlLXNtYWxsZXItZmFzdGVyLWFuYWx5dGljcy1qYXZhc2NyaXB0LWZvci13ZWItbW9iaWxlL1xuICogaHR0cHM6Ly93ZWJhbmFseXRpY3Nmb3JkZXZlbG9wZXJzLmNvbS8yMDEzLzA0LzA1L3RoZS1zX2NvZGUtanMtZmlsZS1wbHVnaW5zL1xuICogaHR0cHM6Ly93ZWJhbmFseXRpY3Nmb3JkZXZlbG9wZXJzLmNvbS8yMDEzLzA0LzA5L3ZhcmlhYmxlcy9cbiAqIGh0dHBzOi8vd2ViYW5hbHl0aWNzZm9yZGV2ZWxvcGVycy5jb20vMjAxMy8wNy8wMi90cmFja2luZy1saW5rcy1hY3Rpb25zL1xuICogaHR0cHM6Ly9kb2NzLmFkb2JlLmNvbS9kb2NzL2VuL2FlbS82LTIvYWRtaW5pc3Rlci9pbnRlZ3JhdGlvbi9tYXJrZXRpbmctY2xvdWQvc2l0ZWNhdGFseXN0Lmh0bWxcbiAqIGh0dHBzOi8vYmxvZ3MuYWRvYmUuY29tL2RpZ2l0YWxtYXJrZXRpbmcvYW5hbHl0aWNzL2N1c3RvbS1saW5rLXRyYWNraW5nLWNhcHR1cmluZy11c2VyLWFjdGlvbnMvXG4gKiBodHRwczovL3d3dy5jaGVhdG9ncmFwaHkuY29tL2RtcGctdG9tL2NoZWF0LXNoZWV0cy9hZG9iZS1hbmFseXRpY3Mtb21uaXR1cmUtc2l0ZWNhdGFseXN0LXBhcmFtZXRlcnMvXG4gKiBodHRwOi8vd3d3LmFkb2JlLmNvbS9tYXJrZXRpbmctY2xvdWQvd2ViLWFuYWx5dGljcy5odG1sXG4gKiBodHRwOi8vd3d3LmFkb2JlLmNvbS9tYXJrZXRpbmctY2xvdWQvd2ViLWFuYWx5dGljcy9zdGFuZGFyZC5odG1sXG4gKiBodHRwczovL3dlYmFuYWx5dGljc2ZvcmRldmVsb3BlcnMuY29tLzIwMTMvMDcvMTYvY29udGV4dC1kYXRhLXZhcmlhYmxlcy1wcm9jZXNzaW5nLXJ1bGVzL1xuICogaHR0cHM6Ly9tYXJrZXRpbmcuYWRvYmUuY29tL2RldmVsb3Blci9kb2N1bWVudGF0aW9uL2RhdGEtaW5zZXJ0aW9uL2MtdmlzaXRvci1pZFxuICogaHR0cHM6Ly9tYXJrZXRpbmcuYWRvYmUuY29tL2RldmVsb3Blci9kb2N1bWVudGF0aW9uL2RhdGEtaW5zZXJ0aW9uL2MtZGVsYXllZC1kYXRhXG4gKiBodHRwczovL21hcmtldGluZy5hZG9iZS5jb20vcmVzb3VyY2VzL2hlbHAvZW5fVVMvc2MvaW1wbGVtZW50L3RpbWVzdGFtcHMtb3ZlcnZpZXcuaHRtbFxuICogaHR0cHM6Ly9tYXJrZXRpbmcuYWRvYmUuY29tL2RldmVsb3Blci9nZXQtc3RhcnRlZC9jb25jZXB0cy10ZXJtaW5vbG9neS9jLXdoYXQtYXJlLXRoZS1hdmFpbGFibGUtYW5hbHl0aWNzLXZhcmlhYmxlcy1hbmQtZXZlbnRzXG4gKiBodHRwczovL2Jsb2dzLmFkb2JlLmNvbS9kaWdpdGFsbWFya2V0aW5nL2FuYWx5dGljcy9wcm9kdWN0cy12YXJpYWJsZS1pbnNpZGUtb21uaXR1cmUtc2l0ZWNhdGFseXN0L1xuICogaHR0cDovL3dlYmFuYWx5dGljc3NpbXBsaWZpZWQuYmxvZ3Nwb3QuY29tLzIwMTAvMDIvb21uaXR1cmUtc2l0ZWNhdGFseXN0LWV2ZW50cy5odG1sXG4gKi9cblxudmFyIGRvdCA9IHJlcXVpcmUoJ29iai1jYXNlJyk7XG52YXIgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcbnZhciBpc28gPSByZXF1aXJlKCd0by1pc28tc3RyaW5nJyk7XG5cbi8qKlxuICogS2V5cyB0aGF0IGdldCBhcHBsaWVkIHRvIGB3aW5kb3cuc2Agb2JqZWN0LFxuICogYnV0IG5lZWQgdG8gYmUgY2xlYXJlZCBvdXQgYmVmb3JlIGV2ZXJ5IGNhbGwuXG4gKlxuICogV2UgbmVlZCB0byBrZWVwIHRoaXMgYXJyYXkgdG8gc2hhcmUgc3RhdGUgYmVjYXVzZSBvdGhlcndpc2UsXG4gKiB3ZSBjYW4ndCBkZWxldGUgZXhpc3Rpbmcga2V5cyBvbiB0aGUgd2luZG93LnMgb2JqZWN0IGluIGJldHdlZW5cbiAqIGAudHJhY2soKWAgYW5kIGAucGFnZSgpYCBjYWxscyBzaW5jZSB0aGV5IG1heSBzZXQgZGlmZmVyZW50IGZpZWxkcy5cbiAqIFRoaXMgcHJldmVudHMgcHJvcGVydGllcyBvZiBgLnBhZ2UoKWAgY2FsbCBiZWluZyBzZW50IGFsb25nIHdpdGhcbiAqIGAudHJhY2soKWAgY2FsbHMuXG4gKi9cblxudmFyIGR5bmFtaWNLZXlzID0gW107XG5cbi8qKlxuICogQ3JlYXRlIFYyIE1ldGhvZCBvYmplY3QgdG8gYXR0YWNoIG1ldGhvZHMgdG8uXG4gKi9cblxudmFyIHYyTWV0aG9kcyA9IHt9O1xuXG4vKipcbiAqIFRyYWNrLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge1RyYWNrfSB0cmFja1xuICovXG5cbnYyTWV0aG9kcy50cmFjayA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIC8vIFRPRE86IGRvIHdlIHJlYWxseSBuZWVkIHRoaXMgaGVyZT8gaXNuJ3QgdGhpcyB0YWtlbiBjYXJlIG9mIGR1cmluZ1xuICAvLyBvdXIgaW5pdCBwcm9jZXNzP1xuICBpZiAoIXdpbmRvdy5zX2dpKSByZXR1cm47XG5cbiAgLy8gRmluZCBvbW5pdHVyZSBldmVudCBuYW1lIGZyb20gc2V0dGluZydzIGV2ZW50IG1hcFxuICAvLyBvdGhlcndpc2UgYWJvcnRcbiAgdmFyIGV2ZW50ID0gYWxpYXNFdmVudCh0cmFjay5ldmVudCgpLCB0aGlzLm9wdGlvbnMuZXZlbnRzKTtcbiAgaWYgKCFldmVudCkgcmV0dXJuO1xuXG4gIC8vIERlbGV0ZSBhbnkgZXhpc3Rpbmcga2V5cyBvbiB3aW5kb3cucyBmcm9tIHByZXZpb3VzIGNhbGxcbiAgY2xlYXJLZXlzKGR5bmFtaWNLZXlzKTtcblxuICB2YXIgcHJvcGVydGllcyA9IHRyYWNrLnByb3BlcnRpZXMoKTtcbiAgLy8gVGVsbCBBZG9iZSBBbmFseXRpY3MgbmFtZSBvZiB0aGUgZXZlbnRcbiAgd2luZG93LnMubGlua1RyYWNrRXZlbnRzID0gZXZlbnQ7XG5cbiAgLy8gQXR0YWNoIHNvbWUgc2VtYW50aWMgdmFyaWFibGVzIG9uIHRoZSBgd2luZG93LnNgIHRvIGJlIHNlbnQgd2l0aCB0aGUgY2FsbFxuICB1cGRhdGUoJ2V2ZW50cycsIGV2ZW50KTtcbiAgdXBkYXRlQ29tbW9uVmFyaWFibGVzKHRyYWNrLCB0aGlzLm9wdGlvbnMpO1xuXG4gIC8vIElmIHRoaXMgaXMgYHRydWVgLCB5b3UgbXVzdCBlaXRoZXIgc2V0IHlvdXIgUmVwb3J0aW5nIFN1aXRlIHRvIGJlXG4gIC8vIHRpbWVzdGFtcCBvciBoeWJyaWQgZW5hYmxlZC4gSWYgeW91ciBSUyBpcyBub3QgdGltZXN0YW1wIGVuYWJsZWQsXG4gIC8vIGRhdGEgd2lsbCBiZSBkcm9wcGVkIGJ5IEFkb2JlIEFuYWx5dGljc1xuICBpZiAodGhpcy5vcHRpb25zLmluY2x1ZGVUaW1lc3RhbXApIHVwZGF0ZVRpbWVzdGFtcCh0cmFjayk7XG5cbiAgLy8gQ2hlY2sgaWYgYW55IHByb3BlcnRpZXMgbWF0Y2ggbWFwcGVkIGVWYXIsIHByb3AsIG9yIGhWYXIgaW4gb3B0aW9uc1xuICB2YXIgcHJvcHMgPSBleHRyYWN0UHJvcGVydGllcyhwcm9wZXJ0aWVzLCB0aGlzLm9wdGlvbnMpO1xuICAvLyBBdHRhY2ggdGhlbSB0byB3aW5kb3cucyBhbmQgcHVzaCB0byBkeW5hbWljS2V5c1xuICBlYWNoKHByb3BzLCB1cGRhdGUpO1xuXG4gIC8vIFNldCBlVmFyIGZvciBldmVudCBuYW1lIGlmIG1hcHBlZFxuICB2YXIgZXZlbnRFVmFyID0gZG90KHRoaXMub3B0aW9ucy5lVmFycywgdHJhY2suZXZlbnQoKSk7XG4gIHVwZGF0ZShldmVudEVWYXIsIHRyYWNrLmV2ZW50KCkpO1xuXG4gIC8vIFRlbGwgb21uaXR1cmUgd2hpY2ggdmFyaWFibGVzIChwcm9wcy9lVmFycy9oVmFycykgdG8gdHJhY2tcbiAgLy8gVGhpcyBpcyBvbmx5IHJlcXVpcmVkIGZvciBgcy50bCgpYCBub3QgYHMudCgpYFxuICB3aW5kb3cucy5saW5rVHJhY2tWYXJzID0gZHluYW1pY0tleXMuam9pbignLCcpO1xuICAvLyBTZW5kIHJlcXVlc3Qgb2ZmIHRvIEFkb2JlIEFuYWx5dGljc1xuICAvLyAxc3QgcGFyYW06IHNldHMgNTAwbXMgZGVsYXkgdG8gZ2l2ZSBicm93c2VyIHRpbWUsIGFsc28gbWVhbnMgeW91IGFyZSB0cmFja2luZyBzb21ldGhpbmcgb3RoZXIgdGhhbiBhIGhyZWYgbGlua1xuICAvLyAybmQgcGFyYW06ICdvJyBtZWFucyAnT3RoZXInIGFzIG9wcG9zZWQgdG8gJ2QnIGZvciAnRG93bmxvYWRzJyBhbmQgJ2UnIGZvciBFeGl0IGxpbmtzXG4gIC8vIDNyZCBwYXJhbTogbGluayBuYW1lIHlvdSB3aWxsIHNlZSBpbiByZXBvcnRzXG4gIHdpbmRvdy5zLnRsKHRydWUsICdvJywgdHJhY2suZXZlbnQoKSk7XG59O1xuXG4vKipcbiAqIFZpZXdlZCBQcm9kdWN0LlxuICpcbiAqIGh0dHBzOi8vc2VnbWVudC5jb20vZG9jcy9zcGVjL2Vjb21tZXJjZS8jdmlld2VkLXByb2R1Y3RcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge1RyYWNrfSBUcmFja1xuICovXG5cbnYyTWV0aG9kcy5wcm9kdWN0Vmlld2VkID0gZnVuY3Rpb24odHJhY2spIHtcbiAgcHJvY2Vzc0Vjb21tZXJjZUV2ZW50KHRyYWNrLCAncHJvZFZpZXcnLCB0aGlzLm9wdGlvbnMpO1xuICB3aW5kb3cucy50bCh0cnVlLCAnbycsIHRyYWNrLmV2ZW50KCkpO1xufTtcblxuXG4vKipcbiAqIFByb2R1Y3QgQWRkZWRcbiAqXG4gKiBodHRwczovL3NlZ21lbnQuY29tL2RvY3Mvc3BlYy9lY29tbWVyY2UvI2FkZGVkLXJlbW92ZWQtcHJvZHVjdFxuICogQGFwaSBwdWJsaWNcbiAqIEBwYXJhbSB7VHJhY2t9IFRyYWNrXG4gKi9cblxudjJNZXRob2RzLnByb2R1Y3RBZGRlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHByb2Nlc3NFY29tbWVyY2VFdmVudCh0cmFjaywgJ3NjQWRkJywgdGhpcy5vcHRpb25zKTtcbiAgd2luZG93LnMudGwodHJ1ZSwgJ28nLCB0cmFjay5ldmVudCgpKTtcbn07XG5cbi8qKlxuICogUHJvZHVjdCBSZW1vdmVkXG4gKlxuICogaHR0cHM6Ly9zZWdtZW50LmNvbS9kb2NzL3NwZWMvZWNvbW1lcmNlLyNhZGRlZC1yZW1vdmVkLXByb2R1Y3RcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge1RyYWNrfSBUcmFja1xuICovXG5cbnYyTWV0aG9kcy5wcm9kdWN0UmVtb3ZlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHByb2Nlc3NFY29tbWVyY2VFdmVudCh0cmFjaywgJ3NjUmVtb3ZlJywgdGhpcy5vcHRpb25zKTtcbiAgd2luZG93LnMudGwodHJ1ZSwgJ28nLCB0cmFjay5ldmVudCgpKTtcbn07XG5cbi8qKlxuICogT3JkZXIgQ29tcGxldGVkXG4gKiBodHRwczovL3NlZ21lbnQuY29tL2RvY3Mvc3BlYy9lY29tbWVyY2UvI2NvbXBsZXRpbmctYW4tb3JkZXJcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge1RyYWNrfSBUcmFja1xuICovXG5cbnYyTWV0aG9kcy5vcmRlckNvbXBsZXRlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHZhciBwcm9wZXJ0aWVzID0gdHJhY2sucHJvcGVydGllcygpO1xuICBwcm9jZXNzRWNvbW1lcmNlRXZlbnQodHJhY2ssICdwdXJjaGFzZScsIHRoaXMub3B0aW9ucyk7XG4gIHVwZGF0ZSgncHVyY2hhc2VJRCcsIHByb3BlcnRpZXMucHVyY2hhc2VJZCB8fCB0cmFjay5vcmRlcklkKCkpO1xuICB1cGRhdGUoJ3RyYW5zYWN0aW9uSUQnLCBwcm9wZXJ0aWVzLnRyYW5zYWN0aW9uSWQgfHwgdHJhY2sub3JkZXJJZCgpKTtcbiAgd2luZG93LnMudGwodHJ1ZSwgJ28nLCB0cmFjay5ldmVudCgpKTtcbn07XG5cbi8qKlxuICogQ2FydCBWaWV3ZWRcbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtUcmFja30gVHJhY2tcbiAqL1xuXG52Mk1ldGhvZHMuY2FydFZpZXdlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHByb2Nlc3NFY29tbWVyY2VFdmVudCh0cmFjaywgJ3NjVmlldycsIHRoaXMub3B0aW9ucyk7XG4gIHdpbmRvdy5zLnRsKHRydWUsICdvJywgdHJhY2suZXZlbnQoKSk7XG59O1xuXG4vKipcbiAqIENhcnQgT3BlbmVkXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEBwYXJhbSB7VHJhY2t9IFRyYWNrXG4gKi9cblxudjJNZXRob2RzLmNhcnRPcGVuZWQgPSBmdW5jdGlvbih0cmFjaykge1xuICBwcm9jZXNzRWNvbW1lcmNlRXZlbnQodHJhY2ssICdzY09wZW4nLCB0aGlzLm9wdGlvbnMpO1xuICB3aW5kb3cucy50bCh0cnVlLCAnbycsIHRyYWNrLmV2ZW50KCkpO1xufTtcblxuLyoqXG4gKiBDaGVja291dCBTdGFydGVkXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEBwYXJhbSB7VHJhY2t9IFRyYWNrXG4gKi9cblxudjJNZXRob2RzLmNoZWNrb3V0U3RhcnRlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIC8vIFRPRE86IERvY3VtZW50IHRoaXMgYnJlYWtpbmcgY2hhbmdlXG4gIC8vIEl0IHdhcyBwcmV2aW91c2x5IGB2aWV3ZWQgY2hlY2tvdXRgXG4gIHByb2Nlc3NFY29tbWVyY2VFdmVudCh0cmFjaywgJ3NjQ2hlY2tvdXQnLCB0aGlzLm9wdGlvbnMpO1xuICB3aW5kb3cucy50bCh0cnVlLCAnbycsIHRyYWNrLmV2ZW50KCkpO1xufTtcblxuLyoqXG4gKiBQYWdlLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge1BhZ2V9IHBhZ2VcbiAqL1xuXG52Mk1ldGhvZHMucGFnZSA9IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gIC8vIElmIHdlIGlnbm9yZSB0aGUgZmlyc3QgcGFnZXZpZXcsIGVuYWJsZSBmb3IgYWxsIHN1YnNlcXVlbnQgcGFnZXZpZXdzXG4gIC8vIFRPRE86IFRISVMgSVMgTk9UIFRIRSBCRUhBVklPUiBERVNDUklCRUQgSU4gVEhFIERPQ1NcbiAgLy8gRG9jczogRGlzYWJsZSB0aGlzIGlmIHlvdSdkIGxpa2UgdG8gbWFudWFsbHkgY29udGludWUgdHJhY2tpbmcgeW91ciBvd24gcGFnZXMgdXNpbmcgYHMudCgpYC5cbiAgLy8gTGFiZWw6IFllcywgSSB3YW50IFNlZ21lbnQgdG8gdHJhY2sgYW4gYXV0b21hdGljIHBhZ2V2aWV3IGZvciBPbW5pdHVyZSByYXRoZXIgdGhhbiBoYW5kbGluZyBpdCBteXNlbGZcbiAgLy8gXiB3ZSBzaG91bGQgc2F5IFwidHJhY2sgYW4gaW5pdGlhbCBhdXRvbWF0aWMgcGFnZXZpZXdcIlxuICBpZiAob3B0aW9ucy5wYWdlID09IG51bGwpIG9wdGlvbnMucGFnZSA9IG9wdGlvbnMuaW5pdGlhbFBhZ2U7XG4gIGlmICghb3B0aW9ucy5wYWdlKSB7XG4gICAgb3B0aW9ucy5wYWdlID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJZiBvbW5pdHVyZSBpc24ndCBsb2FkZWQgeWV0LCB0cnkgYWdhaW4gc29vbi5cbiAgLy8gVE9ETzogcmV2aXNpdCB0aGlzLCBkbyB3ZSBuZWVkIHRoaXM/XG4gIGlmICghdGhpcy5sb2FkZWQoKSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5wYWdlKHBhZ2UpO1xuICAgIH0sIDEwMCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRGVsZXRlIGFueSBleGlzdGluZyBrZXlzIG9uIHdpbmRvdy5zIGZyb20gcHJldmlvdXMgY2FsbFxuICBjbGVhcktleXMoZHluYW1pY0tleXMpO1xuXG4gIC8vIFNldCB0aGUgcGFnZSBuYW1lXG4gIHZhciBwYWdlTmFtZSA9IHBhZ2UuZnVsbE5hbWUoKTtcbiAgLy8gVE9ETzogZm9yIG5hbWVsZXNzIGFuYWx5dGljcy5wYWdlKCksIHBhZ2VOYW1lIGlzIGB1bmRlZmluZWRgXG4gIC8vIFNob3VsZCB3ZSBiZSBzZXR0aW5nIG9yIHNlbmRpbmcgc29tZXRoaW5nIGVsc2UgaGVyZT9cbiAgLy8gV2hlbiB3aW5kb3cucy5wYWdlTmFtZSBpcyBub3Qgc2V0LCBBQSBmYWxscyBiYWNrIG9uIHVybCB3aGljaCBpcyBiYWQuXG4gIC8vIE5vdCBzdXJlIHdoYXQgaGFwcGVucyB3aGVuIGl0IGlzIHNlbnQgYXMgYHVuZGVmaW5lZGAgKG5vdCBzdHJpbmcpXG4gIC8vIEVpdGhlciB3YXksIGFueSBjaGFuZ2UgaGVyZSB3b3VsZCBiZSBicmVha2luZ1xuICB3aW5kb3cucy5wYWdlTmFtZSA9IHBhZ2VOYW1lO1xuXG4gIC8vIFZpc2l0b3IgSUQgYWthIEFBJ3MgY29uY2VwdCBvZiBgdXNlcklkYC5cbiAgLy8gVGhpcyBpcyBub3QgdXNpbmcgYHVwZGF0ZSgpYCBzbyBvbmNlIGl0IGlzIHNldCwgaXQgd2lsbCBiZSBzZW50XG4gIC8vIHdpdGggYC50cmFjaygpYCBjYWxscyBhcyB3ZWxsLlxuICAvLyB2aXNpdG9ySWQgaXMgbm90IHN1cHBvcnRlZCBmb3IgdGltZXN0YW1wZWQgaGl0c1xuICB2YXIgdXNlcklkID0gdGhpcy5hbmFseXRpY3MudXNlcigpLmlkKCk7XG4gIGlmICh1c2VySWQgJiYgIXRoaXMub3B0aW9ucy5pbmNsdWRlVGltZXN0YW1wKSB3aW5kb3cucy52aXNpdG9ySUQgPSB1c2VySWQ7XG5cbiAgLy8gQXR0YWNoIHNvbWUgdmFyaWFibGVzIG9uIHRoZSBgd2luZG93LnNgIHRvIGJlIHNlbnQgd2l0aCB0aGUgY2FsbFxuICB1cGRhdGUoJ2V2ZW50cycsIHBhZ2VOYW1lKTtcbiAgdXBkYXRlQ29tbW9uVmFyaWFibGVzKHBhZ2UsIHRoaXMub3B0aW9ucyk7XG5cbiAgaWYgKHRoaXMub3B0aW9ucy5pbmNsdWRlVGltZXN0YW1wKSB1cGRhdGVUaW1lc3RhbXAocGFnZSk7XG5cbiAgLy8gQ2hlY2sgaWYgYW55IHByb3BlcnRpZXMgbWF0Y2ggbWFwcGVkIGVWYXIsIHByb3AsIG9yIGhWYXIgaW4gb3B0aW9uc1xuICB2YXIgcHJvcHMgPSBleHRyYWN0UHJvcGVydGllcyhwYWdlLnByb3BlcnRpZXMoKSwgdGhpcy5vcHRpb25zKTtcbiAgLy8gQXR0YWNoIHRoZW0gdG8gd2luZG93LnMgYW5kIHB1c2ggdG8gZHluYW1pY0tleXNcbiAgZWFjaChwcm9wcywgdXBkYXRlKTtcblxuICAvLyBhY3R1YWxseSBtYWtlIHRoZSBcInBhZ2VcIiByZXF1ZXN0LCBqdXN0IGEgc2luZ2xlIFwidFwiIG5vdCBcInRsXCJcbiAgLy8gXCJ0XCIgd2lsbCBzZW5kIGFsbCB2YXJpYWJsZXMgb24gdGhlIHdpbmRvdy5zIHdoaWxlIFwidGxcIiBkb2VzIG5vdFxuICAvLyBcInRcIiB3aWxsIGluY3JlbWVudCBwYWdldmlld3Mgd2hpbGUgXCJ0bFwiIGRvZXMgbm90XG4gIHdpbmRvdy5zLnQoKTtcbn07XG5cbi8qKlxuICogUHJvY2VzcyBFY29tbWVyY2UgZXZlbnRzXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge0ZhY2FkZX0gZmFjYWRlXG4gKiBAcGFyYW0ge1N0cmluZ30gYWRvYmUgZXZlbnQgbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBwcm9jZXNzRWNvbW1lcmNlRXZlbnQodHJhY2ssIG5hbWUsIG9wdGlvbnMpIHtcbiAgdmFyIHByb3BzID0gdHJhY2sucHJvcGVydGllcygpO1xuICB2YXIgcHJvZHVjdFZhcmlhYmxlcyA9IGZvcm1hdFByb2R1Y3QocHJvcHMpO1xuICB2YXIgYWRvYmVWYXJpYWJsZXMgPSBleHRyYWN0UHJvcGVydGllcyhwcm9wcywgb3B0aW9ucyk7XG4gIHZhciBldmVudEVWYXIgPSBkb3Qob3B0aW9ucy5lVmFycywgdHJhY2suZXZlbnQoKSk7XG5cbiAgY2xlYXJLZXlzKGR5bmFtaWNLZXlzKTtcblxuICB1cGRhdGUoJ2V2ZW50cycsIG5hbWUpO1xuICB1cGRhdGVDb21tb25WYXJpYWJsZXModHJhY2ssIG9wdGlvbnMpO1xuICB1cGRhdGUoZXZlbnRFVmFyLCB0cmFjay5ldmVudCgpKTtcbiAgdXBkYXRlKCdwcm9kdWN0cycsIHByb2R1Y3RWYXJpYWJsZXMpO1xuICBlYWNoKGFkb2JlVmFyaWFibGVzLCB1cGRhdGUpO1xuXG4gIGlmIChvcHRpb25zLmluY2x1ZGVUaW1lc3RhbXApIHVwZGF0ZVRpbWVzdGFtcCh0cmFjayk7XG5cbiAgd2luZG93LnMubGlua1RyYWNrRXZlbnRzID0gbmFtZTtcbiAgd2luZG93LnMubGlua1RyYWNrVmFycyA9IGR5bmFtaWNLZXlzLmpvaW4oJywnKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBudW1iZXIgb2YgQWRvYmUgQW5hbHl0aWNzIGNvbW1vbiB2YXJpYWJsZXMgb24gd2luZG93LnMgdG8gYmVcbiAqIHNlbnQgd2l0aCB0aGUgY2FsbFxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtGYWNhZGV9IGZhY2FkZVxuICovXG5cbmZ1bmN0aW9uIHVwZGF0ZUNvbW1vblZhcmlhYmxlcyhmYWNhZGUsIG9wdGlvbnMpIHtcbiAgdmFyIHByb3BlcnRpZXMgPSBmYWNhZGUucHJvcGVydGllcygpO1xuXG4gIHVwZGF0ZSgnY2hhbm5lbCcsIHByb3BlcnRpZXMuY2hhbm5lbCB8fCBvcHRpb25zLmNoYW5uZWwpO1xuICB1cGRhdGUoJ2NhbXBhaWduJywgcHJvcGVydGllcy5jYW1wYWlnbiB8fCBvcHRpb25zLmNhbXBhaWduKTtcbiAgdXBkYXRlKCdzdGF0ZScsIHByb3BlcnRpZXMuc3RhdGUgfHwgb3B0aW9ucy5zdGF0ZSk7XG4gIHVwZGF0ZSgnemlwJywgcHJvcGVydGllcy56aXAgfHwgb3B0aW9ucy56aXApO1xuICBpZiAoZmFjYWRlLnR5cGUoKSA9PT0gJ3RyYWNrJykgdXBkYXRlKCdwYWdlTmFtZScsIHByb3BlcnRpZXMucGFnZU5hbWUgfHwgb3B0aW9ucy5wYWdlTmFtZSB8fCBmYWNhZGUucHJveHkoJ2NvbnRleHQucGFnZS50aXRsZScpKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgdGhlIG9tbml0dXJlIHZhcmlhYmxlIGFuZCBleHBsaWNpdGx5IG1hcmsgdGhlIGxpbmsgdmFyc1xuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmcsIFN0cmluZ30ga2V5LCB2YWx1ZVxuICogQHJldHVybiB7c3RyaW5nfSB3aW5kb3cuc1trZXldXG4gKi9cblxuZnVuY3Rpb24gdXBkYXRlKGtleSwgdmFsdWUpIHtcbiAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgZXZlcnl0aGluZyB3ZSBuZWVkXG4gIGlmICgha2V5IHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHJldHVybjtcbiAgLy8gUHVzaCBlYWNoIGtleSB0byBiZSBzZW50IGxhdGVyIHdpdGggdGhlIHBheWxvYWRcbiAgLy8gT25seSBrZXlzIGxpc3RlZCBoZXJlIHdpbGwgYmUgcGFyc2VkIGZyb20gdGhlIHdpbmRvdy5zIG9iamVjdCB3aGVuIGRhdGEgaXMgc2VudCB2aWEgcy50bCgpIGFrYSBgLnRyYWNrKClgIGNhbGxzXG4gIGR5bmFtaWNLZXlzLnB1c2goa2V5KTtcbiAgLy8gU2V0IEFkb2JlIEFuYWx5dGljcyB2YXJpYWJsZXMgb24gdGhlIHdpbmRvdy5zIHRvIGJlIHNlbnRcbiAgd2luZG93LnNba2V5XSA9IHZhbHVlLnRvU3RyaW5nKCk7XG59XG5cbi8qKlxuICogVXBkYXRlIHdpbmRvdy5zLnRpbWVzdGFtcFxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtGYWNhZGV9IGZhY2FkZVxuICovXG5cbmZ1bmN0aW9uIHVwZGF0ZVRpbWVzdGFtcChmYWNhZGUpIHtcbiAgdmFyIHByb3BlcnRpZXMgPSBmYWNhZGUucHJvcGVydGllcygpO1xuICAvLyBUT0RPOiByZXZpc2l0IHRoZSBmYWxsYmFjayBvcmRlciBoZXJlXG4gIHZhciB0aW1lc3RhbXAgPSBwcm9wZXJ0aWVzLnRpbWVzdGFtcCB8fCBmYWNhZGUudGltZXN0YW1wKCk7XG4gIC8vIFRpbWVzdGFtcCBtdXN0IGJlIGVpdGhlciB1bml4IG9yIGlzby04NjAxXG4gIGlmICh0eXBlb2YgdGltZXN0YW1wICE9PSAnc3RyaW5nJykgdGltZXN0YW1wID0gaXNvKHRpbWVzdGFtcCk7XG4gIHVwZGF0ZSgndGltZXN0YW1wJywgdGltZXN0YW1wKTtcbn1cblxuLyoqXG4gKiBBbGlhcyBhIHJlZ3VsYXIgZXZlbnQgYG5hbWVgIHRvIGFuIE9tbml0dXJlIGV2ZW50LCB1c2luZyBhIGRpY3Rpb25hcnkgb2ZcbiAqIGBldmVudHNgLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudHNcbiAqIEByZXR1cm4ge3N0cmluZ3xudWxsfVxuICovXG5cbmZ1bmN0aW9uIGFsaWFzRXZlbnQobmFtZSwgZXZlbnRzKSB7XG4gIGlmIChldmVudHNbbmFtZS50b0xvd2VyQ2FzZSgpXSkgcmV0dXJuIGV2ZW50c1tuYW1lLnRvTG93ZXJDYXNlKCldO1xufVxuXG4vKipcbiAqIEZvcm1hdCBzZW1hbnRpYyBlY29tbWVyY2UgcHJvZHVjdCBwcm9wZXJ0aWVzIHRvIEFkb2JlIEFuYWx5dGljcyB2YXJpYWJsZSBzdHJpbmdzLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IHByb3BzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0UHJvZHVjdChwcm9wcykge1xuICByZXR1cm4gW1xuICAgIHByb3BzLmNhdGVnb3J5LFxuICAgIHByb3BzLm5hbWUsXG4gICAgcHJvcHMucXVhbnRpdHkgfHwgMSxcbiAgICBwcm9wcy5wcmljZSB8fCAwXG4gIF0uam9pbignOyAnKTtcbn1cblxuLyoqXG4gKiBDbGVhciBsYXN0IGtleXMgdXNlZCB3aXRoIG9tbml0dXJlLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0ga2V5c1xuICovXG5cbmZ1bmN0aW9uIGNsZWFyS2V5cyhrZXlzKSB7XG4gIGVhY2goa2V5cywgZnVuY3Rpb24obGlua1Zhcikge1xuICAgIGRlbGV0ZSB3aW5kb3cuc1tsaW5rVmFyXTtcbiAgfSk7XG4gIC8vIENsZWFycyB0aGUgYXJyYXkgcGFzc2VkIGluXG4gIGtleXMubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHByb3BlcnRpZXMgZm9yIGB3aW5kb3cuc2AuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gcHJvcHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gZXh0cmFjdFByb3BlcnRpZXMocHJvcHMsIG9wdGlvbnMpIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICB2YXIgbWFwcGluZ3MgPSBbb3B0aW9ucy5lVmFycywgb3B0aW9ucy5wcm9wcywgb3B0aW9ucy5oVmFyc107XG5cbiAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggdmFyaWFibGUgbWFwcGluZ3MgdG8gZmluZCBtYXRjaGluZyBwcm9wc1xuICBmb3IgKHZhciB4ID0gMDsgeCA8IG1hcHBpbmdzLmxlbmd0aDsgeCsrKSB7XG4gICAgZWFjaChtYXBwaW5nc1t4XSwgbWF0Y2gpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWF0Y2gobWFwcGVkS2V5LCBtYXBwZWRWYWx1ZSkge1xuICAgIHZhciB2YWx1ZSA9IGRvdChwcm9wcywgbWFwcGVkS2V5KTtcbiAgICAvLyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkgcmVzdWx0W21hcHBlZFZhbHVlXSA9IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBNZXRhZGF0YSB1c2VkIGZvciB0ZXN0aW5nLiBQbGVhc2UgZG8gbm90IHVzZSBhbnl3aGVyZSBlbHNlIGluIGNvZGVcbiAqL1xuXG52Mk1ldGhvZHMuX192ZXJzaW9uID0gMjtcblxuLyoqXG4gKiBFeHBvc2UgYHYyTWV0aG9kc2AuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB2Mk1ldGhvZHM7XG5cbiIsIlxudmFyIEFuYWx5dGljcyA9IHJlcXVpcmUoJ2FuYWx5dGljcy5qcy1jb3JlJykuY29uc3RydWN0b3I7XG52YXIgaXNvID0gcmVxdWlyZSgndG8taXNvLXN0cmluZycpO1xudmFyIHNhbmRib3ggPSByZXF1aXJlKCdjbGVhci1lbnYnKTtcbnZhciB0ZXN0ZXIgPSByZXF1aXJlKCdhbmFseXRpY3MuanMtaW50ZWdyYXRpb24tdGVzdGVyJyk7XG52YXIgT21uaXR1cmUgPSByZXF1aXJlKCcuLi9saWIvJyk7XG5cbmRlc2NyaWJlKCdPbW5pdHVyZScsIGZ1bmN0aW9uKCkge1xuICB2YXIgYW5hbHl0aWNzO1xuICB2YXIgb21uaXR1cmU7XG4gIHZhciB1c2VyO1xuICB2YXIgb3B0aW9ucyA9IHtcbiAgICB2ZXJzaW9uOiAxLFxuICAgIHJlcG9ydFN1aXRlSWQ6ICdzZWdtZW50aW8nLFxuICAgIHRyYWNraW5nU2VydmVyVXJsOiAnc2VnbWVudC5pbycsXG4gICAgdHJhY2tpbmdTZXJ2ZXJTZWN1cmVVcmw6ICdzZWN1cmUuc2VnbWVudC5pbycsXG4gICAgZXZlbnRzOiB7XG4gICAgICAnUGxheWVkIGEgU29uZyc6ICdldmVudDEnLFxuICAgICAgJ0RyYW5rIFNvbWUgTWlsayc6ICdldmVudDYnLFxuICAgICAgRXZlbnRFVmFyOiAnZXZlbnQ3J1xuICAgIH0sXG4gICAgZVZhcnM6IHtcbiAgICAgIENhcjogJ2VWYXIxJyxcbiAgICAgIERvZzogJ2VWYXI0NycsXG4gICAgICBwcm9wMjA6ICdlVmFyNjMnLFxuICAgICAgRXZlbnRFVmFyOiAnZVZhcjY1JyxcbiAgICAgICdDYXIuSW5mbyc6ICdlVmFyMTAxJyxcbiAgICAgICdNeS5Eb2cnOiAnZVZhcjQwMSdcbiAgICB9LFxuICAgIHByb3BzOiB7XG4gICAgICBBaXJwbGFuZTogJ3Byb3AyMCcsXG4gICAgICBEb2c6ICdwcm9wNDAnLFxuICAgICAgR29vZDogJ3Byb3AxMCcsXG4gICAgICBUeXBlOiAncHJvcDEzJyxcbiAgICAgIEJyYW5kOiAncHJvcDIzJ1xuICAgIH0sXG4gICAgaFZhcnM6IHtcbiAgICAgIGhpZXJfZ3JvdXAxOiAnaGllcjEnLFxuICAgICAgaGllcl9ncm91cDI6ICdoaWVyMidcbiAgICB9XG4gIH07XG5cbiAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICBhbmFseXRpY3MgPSBuZXcgQW5hbHl0aWNzKCk7XG4gICAgb21uaXR1cmUgPSBuZXcgT21uaXR1cmUob3B0aW9ucyk7XG4gICAgYW5hbHl0aWNzLnVzZShPbW5pdHVyZSk7XG4gICAgYW5hbHl0aWNzLnVzZSh0ZXN0ZXIpO1xuICAgIGFuYWx5dGljcy5hZGQob21uaXR1cmUpO1xuICAgIHVzZXIgPSBhbmFseXRpY3MudXNlcigpO1xuICB9KTtcblxuICBhZnRlckVhY2goZnVuY3Rpb24oKSB7XG4gICAgYW5hbHl0aWNzLnJlc3RvcmUoKTtcbiAgICBhbmFseXRpY3MucmVzZXQoKTtcbiAgICBvbW5pdHVyZS5yZXNldCgpO1xuICAgIHNhbmRib3goKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1YxJywgZnVuY3Rpb24oKSB7XG4gICAgYmVmb3JlRWFjaChmdW5jdGlvbihkb25lKSB7XG4gICAgICBhbmFseXRpY3Mub25jZSgncmVhZHknLCBkb25lKTtcbiAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnI3RyYWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBpdCgndHJhY2tzIG5vcm1hbCBldmVudHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudDEnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmV2ZW50cywgJ2V2ZW50MScpO1xuICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5zLmV2ZW50cywgd2luZG93LnMubGlua1RyYWNrRXZlbnRzKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJykpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCd0cmFja3MgYWxpYXNlZCBldmVudHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdEcmFuayBzb21lIG1pbGsnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmV2ZW50cywgJ2V2ZW50NicpO1xuICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5zLmV2ZW50cywgd2luZG93LnMubGlua1RyYWNrRXZlbnRzKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJykpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCd0cmFja3MgYnVpbHQtaW4gZXZlbnRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy50cmFjaygnc2NBZGQnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmV2ZW50cywgJ3NjQWRkJyk7XG4gICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LnMuZXZlbnRzLCB3aW5kb3cucy5saW5rVHJhY2tFdmVudHMpO1xuICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KGNvbnRhaW5zKHdpbmRvdy5zLmxpbmtUcmFja1ZhcnMsICdldmVudHMnKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3RyYWNrcyBhbGlhc2VzIGZvciBidWlsdC1pbiBldmVudHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdWaWV3ZWQgUHJvZHVjdCcpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZXZlbnRzLCAncHJvZFZpZXcnKTtcbiAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cucy5ldmVudHMsIHdpbmRvdy5zLmxpbmtUcmFja0V2ZW50cyk7XG4gICAgICAgIGFuYWx5dGljcy5hc3NlcnQoY29udGFpbnMod2luZG93LnMubGlua1RyYWNrVmFycywgJ2V2ZW50cycpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIHByb2R1Y3QgaW5mb3JtYXRpb24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdWaWV3ZWQgUHJvZHVjdCcsIHtcbiAgICAgICAgICBwcm9kdWN0OiAnV29vZGVuIFRlZXRoJyxcbiAgICAgICAgICBxdWFudGl0eTogMzIsXG4gICAgICAgICAgY2F0ZWdvcnk6ICdEZW50YWwgQWlkcycsXG4gICAgICAgICAgcHJpY2U6IDE3Ljc2XG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvZHVjdHMsICdEZW50YWwgQWlkczsgV29vZGVuIFRlZXRoOyAzMjsgMTcuNzYnKTtcbiAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cucy5ldmVudHMsIHdpbmRvdy5zLmxpbmtUcmFja0V2ZW50cyk7XG4gICAgICAgIGFuYWx5dGljcy5hc3NlcnQoY29udGFpbnMod2luZG93LnMubGlua1RyYWNrVmFycywgJ2V2ZW50cycsICdwcm9kdWN0cycpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIG11bHRpcGxlIHByb2R1Y3QgaW5mb3JtYXRpb24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdWaWV3ZWQgQ2FydCcsIHtcbiAgICAgICAgICBwcm9kdWN0czogW3tcbiAgICAgICAgICAgIHByb2R1Y3Q6ICdXb29kZW4gVGVldGgnLFxuICAgICAgICAgICAgcXVhbnRpdHk6IDMyLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICdEZW50YWwgQWlkcycsXG4gICAgICAgICAgICBwcmljZTogMTcuNzZcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBwcm9kdWN0OiAnTW9sZSBQZW9wbGUnLFxuICAgICAgICAgICAgcXVhbnRpdHk6IDEwMCxcbiAgICAgICAgICAgIGNhdGVnb3J5OiAnU3VidGVycmFuZWFuJyxcbiAgICAgICAgICAgIHByaWNlOiAzMi4zMlxuICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvZHVjdHMsICdEZW50YWwgQWlkczsgV29vZGVuIFRlZXRoOyAzMjsgMTcuNzYsICdcbiAgICAgICAgICArICdTdWJ0ZXJyYW5lYW47IE1vbGUgUGVvcGxlOyAxMDA7IDMyLjMyJyk7XG4gICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LnMuZXZlbnRzLCB3aW5kb3cucy5saW5rVHJhY2tFdmVudHMpO1xuICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KGNvbnRhaW5zKHdpbmRvdy5zLmxpbmtUcmFja1ZhcnMsICdldmVudHMnLCAncHJvZHVjdHMnKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3RyYWNrcyBhbGlhc2VkIHByb3BlcnRpZXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdEcmFuayBTb21lIE1pbGsnLCB7XG4gICAgICAgICAgdHlwZTogJzIlJyxcbiAgICAgICAgICBicmFuZDogJ0x1Y2VybmUnLFxuICAgICAgICAgIGdvb2Q6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wcm9wMTMsICcyJScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvcDIzLCAnTHVjZXJuZScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvcDEwLCAndHJ1ZScpO1xuICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KGNvbnRhaW5zKHdpbmRvdy5zLmxpbmtUcmFja1ZhcnMsICdldmVudHMnLCAncHJvcDEzJywgJ3Byb3AyMycsXG4gICAgICAgICAgJ3Byb3AxMCcpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIGJhc2ljIHByb3BlcnRpZXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudDEwJywge1xuICAgICAgICAgIHByb3AxOiAyMCxcbiAgICAgICAgICBwcm9wNTA6ICdnb29kJyxcbiAgICAgICAgICBwcm9wNzM6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wcm9wNzMsICd0cnVlJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wcm9wMSwgJzIwJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wcm9wNTAsICdnb29kJyk7XG4gICAgICAgIGFuYWx5dGljcy5hc3NlcnQoY29udGFpbnMod2luZG93LnMubGlua1RyYWNrVmFycywgJ2V2ZW50cycsICdwcm9wMScsICdwcm9wNTAnLFxuICAgICAgICAgICdwcm9wNzMnKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3RyYWNrcyBiYXNpYyBwcm9wZXJ0aWVzIG9mIGFsbCBjYXNlcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ2V2ZW50MTAnLCB7XG4gICAgICAgICAgYnJhbmQ6ICdMdWNlcm5lJ1xuICAgICAgICB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyMywgJ0x1Y2VybmUnKTtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudDEwJywge1xuICAgICAgICAgIEJyYW5kOiAnTHVjZXJuZSdcbiAgICAgICAgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wcm9wMjMsICdMdWNlcm5lJyk7XG4gICAgICAgIGFuYWx5dGljcy50cmFjaygnZXZlbnQxMCcsIHtcbiAgICAgICAgICBCckFOZDogJ0x1Y2VybmUnXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvcDIzLCAnTHVjZXJuZScpO1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ2V2ZW50MTAnLCB7XG4gICAgICAgICAgQlJBTkQ6ICdMdWNlcm5lJ1xuICAgICAgICB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyMywgJ0x1Y2VybmUnKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIGFsaWFzZWQgZVZhcnMgd2l0aCBuZXN0ZWQgcHJvcGVydGllcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ0RyYW5rIFNvbWUgTWlsaycsIHtcbiAgICAgICAgICBjYXI6IHsgaW5mbzogJzIwMDMgQWNjb3JkIChvbmx5IG9uZSBwcmV2aW91cyBvd25lciknIH0sXG4gICAgICAgICAgJ215LmRvZyc6ICdEb2cnLFxuICAgICAgICAgIGdvb2Q6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZVZhcjEwMSwgJzIwMDMgQWNjb3JkIChvbmx5IG9uZSBwcmV2aW91cyBvd25lciknKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmVWYXI0MDEsICdEb2cnKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJywgJ2VWYXIxMDEnLFxuICAgICAgICAgICdlVmFyNDAxJywgJ3Byb3AxMCcpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIGJhc2ljIGVWYXJzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy50cmFjaygnZXZlbnQyMCcsIHtcbiAgICAgICAgICBlVmFyMjA6ICcxMjMnLFxuICAgICAgICAgIGVWYXI1NDogZmFsc2UsXG4gICAgICAgICAgZVZhcjogJ2EnXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZVZhciwgdW5kZWZpbmVkKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmVWYXIyMCwgJzEyMycpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZVZhcjU0LCAnZmFsc2UnKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJywgJ2VWYXIyMCcsICdlVmFyNTQnKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3RyYWNrcyBldmVudCBlVmFycycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ0V2ZW50RVZhcicpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZVZhcjY1LCAnRXZlbnRFVmFyJyk7XG4gICAgICAgIGFuYWx5dGljcy5hc3NlcnQoY29udGFpbnMod2luZG93LnMubGlua1RyYWNrVmFycywgJ2V2ZW50cycsICdlVmFyNjUnKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ21pcnJvcnMgZVZhcnMgYW5kIHByb3BlcnRpZXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudDU0Jywge1xuICAgICAgICAgIHByb3AyMDogJ2FiYycsXG4gICAgICAgICAgZG9nOiAnbWFsYW11dGUnLFxuICAgICAgICAgIGVWYXI0OTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmVWYXI0OSwgJ3RydWUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyMCwgJ2FiYycpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZVZhcjYzLCAnYWJjJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5lVmFyNDcsICdtYWxhbXV0ZScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvcDQwLCAnbWFsYW11dGUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJywgJ3Byb3AyMCcsICdlVmFyNjMnLFxuICAgICAgICAgICdwcm9wNDAnLCAnZVZhcjQ3JywgJ2VWYXI0OScpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnbWlycm9ycyBlVmFycyB3aGljaCBhcmUgbm90IGFsaWFzZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudDEnLCB7XG4gICAgICAgICAgYWlycGxhbmU6ICdib2VpbmcgNzQ3J1xuICAgICAgICB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmVWYXI2MywgJ2JvZWluZyA3NDcnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyMCwgJ2JvZWluZyA3NDcnKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJywgJ3Byb3AyMCcsICdlVmFyNjMnKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCByZXNwZWN0IHByb3BlcnRpZXMudGltZXN0YW1wJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudDEnLCB7IHRpbWVzdGFtcDogZGF0ZSB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnRpbWVzdGFtcCwgaXNvKGRhdGUpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGZhbGxiYWNrIHRvIHRyYWNrLnRpbWVzdGFtcCgpJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudDEnLCB7fSwgeyB0aW1lc3RhbXA6IGRhdGUgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy50aW1lc3RhbXAsIGlzbyhkYXRlKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBub3Qgc2VuZCB0aGUgdGltZXN0YW1wIGlmIHRoZSBzZXR0aW5nIGlzIGRpc2FibGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlbGV0ZSB3aW5kb3cucy50aW1lc3RhbXA7XG4gICAgICAgIG9tbml0dXJlLm9wdGlvbnMuaW5jbHVkZVRpbWVzdGFtcCA9IGZhbHNlO1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ2V2ZW50MScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMudGltZXN0YW1wLCBudWxsKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGNhbGwgd2luZG93LnMudGwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnN0dWIod2luZG93LnMsICd0bCcpO1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ0RyYW5rIHNvbWUgbWlsaycpO1xuICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5zLnRsLCB0cnVlLCAnbycsICdEcmFuayBzb21lIG1pbGsnKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGNsZWFyIHdpbmRvdy5zW3ZhcmlhYmxlc10gYmV0d2VlbiBjYWxscycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ0RyYW5rIHNvbWUgbWlsaycsIHsgcHJvcDIwOiAnMTIzJyB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyMCwgJzEyMycpO1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ0RyYW5rIHNvbWUgbWlsaycsIHsgcHJvcDI1OiAnaGV5bycgfSk7XG4gICAgICAgIGFuYWx5dGljcy5hc3NlcnQoIXdpbmRvdy5zLnByb3AyMCk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wcm9wMjUsICdoZXlvJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCcjcGFnZScsIGZ1bmN0aW9uKCkge1xuICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgZGVsZXRlIHdpbmRvdy5zLnZpc2l0b3JJRDtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIG5vcm1hbCBwYWdlcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MucGFnZSgnUGFnZTEnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnBhZ2VOYW1lLCAnUGFnZTEnKTtcbiAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cucy5ldmVudHMsICdQYWdlMScpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCd0cmFja3MgYWxpYXNlZCBwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCdEcmFuayBTb21lIE1pbGsnLCB7XG4gICAgICAgICAgdHlwZTogJzIlJyxcbiAgICAgICAgICBicmFuZDogJ0x1Y2VybmUnLFxuICAgICAgICAgIGdvb2Q6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wYWdlTmFtZSwgJ0RyYW5rIFNvbWUgTWlsaycpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvcDEzLCAnMiUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyMywgJ0x1Y2VybmUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AxMCwgJ3RydWUnKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHNlbmQgdXNlci5pZCBhcyB2aXNpdG9ySUQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdXNlci5pZCgndXNlci1pZCcpO1xuICAgICAgICBhbmFseXRpY3MucGFnZSgnbmFtZScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucGFnZU5hbWUsICduYW1lJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy52aXNpdG9ySUQsICd1c2VyLWlkJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBub3Qgc2VuZCBlbXB0eSB1c2VyLmlkIGFzIHZpc2l0b3JJRCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MucGFnZSgnbmFtZScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucGFnZU5hbWUsICduYW1lJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy52aXNpdG9ySUQsIHVuZGVmaW5lZCk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3RyYWNrcyBiYXNpYyBwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCdldmVudDEwJywge1xuICAgICAgICAgIHByb3AxOiAyMCxcbiAgICAgICAgICBwcm9wNTA6ICdnb29kJyxcbiAgICAgICAgICBwcm9wNzM6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wYWdlTmFtZSwgJ2V2ZW50MTAnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3A3MywgJ3RydWUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AxLCAnMjAnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3A1MCwgJ2dvb2QnKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIGFsaWFzZWQgZVZhcnMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ0RyYW5rIFNvbWUgTWlsaycsIHtcbiAgICAgICAgICBjYXI6ICcyMDAzIEFjY29yZCAob25seSBvbmUgcHJldmlvdXMgb3duZXIpJyxcbiAgICAgICAgICBkb2c6ICdEb2cnLFxuICAgICAgICAgIGdvb2Q6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucGFnZU5hbWUsICdEcmFuayBTb21lIE1pbGsnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmVWYXIxLCAnMjAwMyBBY2NvcmQgKG9ubHkgb25lIHByZXZpb3VzIG93bmVyKScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZVZhcjQ3LCAnRG9nJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3RyYWNrcyBhbGlhc2VkIGVWYXJzIHdpdGggbmVzdGVkIHByb3BlcnRpZXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ0RyYW5rIFNvbWUgTWlsaycsIHtcbiAgICAgICAgICBjYXI6IHsgaW5mbzogJzIwMDMgQWNjb3JkIChvbmx5IG9uZSBwcmV2aW91cyBvd25lciknIH0sXG4gICAgICAgICAgJ215LmRvZyc6ICdEb2cnLFxuICAgICAgICAgIGdvb2Q6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucGFnZU5hbWUsICdEcmFuayBTb21lIE1pbGsnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmVWYXIxMDEsICcyMDAzIEFjY29yZCAob25seSBvbmUgcHJldmlvdXMgb3duZXIpJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5lVmFyNDAxLCAnRG9nJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3RyYWNrcyBiYXNpYyBlVmFycycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MucGFnZSgnZXZlbnQyMCcsIHtcbiAgICAgICAgICBlVmFyMjA6ICcxMjMnLFxuICAgICAgICAgIGVWYXI1NDogZmFsc2UsXG4gICAgICAgICAgZVZhcjogJ2EnXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucGFnZU5hbWUsICdldmVudDIwJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5lVmFyLCB1bmRlZmluZWQpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZVZhcjIwLCAnMTIzJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5lVmFyNTQsICdmYWxzZScpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCd0cmFja3MgYmFzaWMgaFZhcnMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ2V2ZW50MjAnLCB7XG4gICAgICAgICAgaGllcl9ncm91cDE6ICdhbmltYWxzOmRvZ3MnLFxuICAgICAgICAgIGhpZXJfZ3JvdXAyOiAnc3BvcnRzOmJhc2ViYWxsJyxcbiAgICAgICAgICBoaWVyMzogJ2EnXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucGFnZU5hbWUsICdldmVudDIwJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5oaWVyMSwgJ2FuaW1hbHM6ZG9ncycpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuaGllcjIsICdzcG9ydHM6YmFzZWJhbGwnKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHJlc3BlY3QgcHJvcGVydGllcy50aW1lc3RhbXAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBhbmFseXRpY3MucGFnZSgnZXZlbnQxJywgeyB0aW1lc3RhbXA6IGRhdGUgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy50aW1lc3RhbXAsIGlzbyhkYXRlKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBmYWxsYmFjayB0byBwYWdlLnRpbWVzdGFtcCgpJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ2V2ZW50MScsIHt9LCB7IHRpbWVzdGFtcDogZGF0ZSB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnRpbWVzdGFtcCwgaXNvKGRhdGUpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIG5vdCBzZW5kIHRoZSB0aW1lc3RhbXAgaWYgdGhlIHNldHRpbmcgaXMgZGlzYWJsZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZGVsZXRlIHdpbmRvdy5zLnRpbWVzdGFtcDtcbiAgICAgICAgb21uaXR1cmUub3B0aW9ucy5pbmNsdWRlVGltZXN0YW1wID0gZmFsc2U7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCdldmVudDEnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnRpbWVzdGFtcCwgbnVsbCk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBub3QgdHJhY2sgYW4gaW5pdGlhbCBwYWdlIGlmIC5pbml0aWFsUGFnZSBpcyBmYWxzZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBvbW5pdHVyZS5vcHRpb25zLmluaXRpYWxQYWdlID0gZmFsc2U7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCdldmVudDM3Jyk7XG4gICAgICAgIGFuYWx5dGljcy5ub3RFcXVhbCh3aW5kb3cucy5wYWdlTmFtZSwgJ2V2ZW50MzcnKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChvbW5pdHVyZS5vcHRpb25zLnBhZ2UpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgY2FsbCB3aW5kb3cucy50JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5zdHViKHdpbmRvdy5zLCAndCcpO1xuICAgICAgICBhbmFseXRpY3MucGFnZSgpO1xuICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5zLnQpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgY2xlYXIgd2luZG93LnNbdmFyaWFibGVzXSBiZXR3ZWVuIGNhbGxzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCdldmVudDIwJywgeyBwcm9wMjA6ICcxMjMnIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvcDIwLCAnMTIzJyk7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCdldmVudDIwJywgeyBwcm9wMjU6ICdoZXlvJyB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydCghd2luZG93LnMucHJvcDIwKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyNSwgJ2hleW8nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciB0aGUgc3RyaW5nIGNvbnRhaW5zIGFsbCBvZiB0aGUgc3Vic3RyaW5nc1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7Li4uc3RyaW5nfSBzdWJzdHJpbmdzXG4gKi9cblxuZnVuY3Rpb24gY29udGFpbnMoc3RyKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoMSwgYXJndW1lbnRzKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHN0ci5pbmRleE9mKGFyZ3NbaV0pID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4iLCJcbnZhciBBbmFseXRpY3MgPSByZXF1aXJlKCdhbmFseXRpY3MuanMtY29yZScpLmNvbnN0cnVjdG9yO1xudmFyIGlzbyA9IHJlcXVpcmUoJ3RvLWlzby1zdHJpbmcnKTtcbnZhciBzYW5kYm94ID0gcmVxdWlyZSgnY2xlYXItZW52Jyk7XG52YXIgdGVzdGVyID0gcmVxdWlyZSgnYW5hbHl0aWNzLmpzLWludGVncmF0aW9uLXRlc3RlcicpO1xudmFyIE9tbml0dXJlID0gcmVxdWlyZSgnLi4vbGliLycpO1xuXG5kZXNjcmliZSgnT21uaXR1cmUnLCBmdW5jdGlvbigpIHtcbiAgdmFyIGFuYWx5dGljcztcbiAgdmFyIG9tbml0dXJlO1xuICB2YXIgdXNlcjtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgdmVyc2lvbjogMixcbiAgICByZXBvcnRTdWl0ZUlkOiAnc2VnbWVudGlvJyxcbiAgICB0cmFja2luZ1NlcnZlclVybDogJ3NlZ21lbnQuaW8nLFxuICAgIHRyYWNraW5nU2VydmVyU2VjdXJlVXJsOiAnc2VjdXJlLnNlZ21lbnQuaW8nLFxuICAgIGV2ZW50czoge1xuICAgICAgJ1BsYXllZCBhIFNvbmcnOiAnZXZlbnQxJyxcbiAgICAgICdEcmFuayBTb21lIE1pbGsnOiAnZXZlbnQ2JyxcbiAgICAgIEV2ZW50RVZhcjogJ2V2ZW50NydcbiAgICB9LFxuICAgIGVWYXJzOiB7XG4gICAgICBDYXI6ICdlVmFyMScsXG4gICAgICBEb2c6ICdlVmFyNDcnLFxuICAgICAgcHJvcDIwOiAnZVZhcjYzJyxcbiAgICAgIEV2ZW50RVZhcjogJ2VWYXI2NScsXG4gICAgICAnQ2FyLkluZm8nOiAnZVZhcjEwMScsXG4gICAgICAnTXkuRG9nJzogJ2VWYXI0MDEnXG4gICAgfSxcbiAgICBwcm9wczoge1xuICAgICAgQWlycGxhbmU6ICdwcm9wMjAnLFxuICAgICAgRG9nOiAncHJvcDQwJyxcbiAgICAgIEdvb2Q6ICdwcm9wMTAnLFxuICAgICAgVHlwZTogJ3Byb3AxMycsXG4gICAgICBCcmFuZDogJ3Byb3AyMydcbiAgICB9LFxuICAgIGhWYXJzOiB7XG4gICAgICBoaWVyX2dyb3VwMTogJ2hpZXIxJyxcbiAgICAgIGhpZXJfZ3JvdXAyOiAnaGllcjInXG4gICAgfVxuICB9O1xuXG4gIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgYW5hbHl0aWNzID0gbmV3IEFuYWx5dGljcygpO1xuICAgIG9tbml0dXJlID0gbmV3IE9tbml0dXJlKG9wdGlvbnMpO1xuICAgIGFuYWx5dGljcy51c2UoT21uaXR1cmUpO1xuICAgIGFuYWx5dGljcy51c2UodGVzdGVyKTtcbiAgICBhbmFseXRpY3MuYWRkKG9tbml0dXJlKTtcbiAgICB1c2VyID0gYW5hbHl0aWNzLnVzZXIoKTtcbiAgfSk7XG5cbiAgYWZ0ZXJFYWNoKGZ1bmN0aW9uKCkge1xuICAgIGFuYWx5dGljcy5yZXN0b3JlKCk7XG4gICAgYW5hbHl0aWNzLnJlc2V0KCk7XG4gICAgb21uaXR1cmUucmVzZXQoKTtcbiAgICBzYW5kYm94KCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdWMicsIGZ1bmN0aW9uKCkge1xuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oZG9uZSkge1xuICAgICAgYW5hbHl0aWNzLm9uY2UoJ3JlYWR5JywgZG9uZSk7XG4gICAgICBhbmFseXRpY3MuaW5pdGlhbGl6ZSgpO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJyN0cmFjaycsIGZ1bmN0aW9uKCkge1xuICAgICAgaXQoJ3RyYWNrcyBhbGlhc2VkIGV2ZW50cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ0RyYW5rIHNvbWUgbWlsaycpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZXZlbnRzLCAnZXZlbnQ2Jyk7XG4gICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LnMuZXZlbnRzLCB3aW5kb3cucy5saW5rVHJhY2tFdmVudHMpO1xuICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KGNvbnRhaW5zKHdpbmRvdy5zLmxpbmtUcmFja1ZhcnMsICdldmVudHMnKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3RyYWNrcyBidWlsdC1pbiBldmVudHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdzY0FkZCcpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZXZlbnRzLCAnc2NBZGQnKTtcbiAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cucy5ldmVudHMsIHdpbmRvdy5zLmxpbmtUcmFja0V2ZW50cyk7XG4gICAgICAgIGFuYWx5dGljcy5hc3NlcnQoY29udGFpbnMod2luZG93LnMubGlua1RyYWNrVmFycywgJ2V2ZW50cycpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIGFsaWFzZXMgZm9yIGJ1aWx0LWluIGV2ZW50cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ1ZpZXdlZCBQcm9kdWN0Jyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5ldmVudHMsICdwcm9kVmlldycpO1xuICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5zLmV2ZW50cywgd2luZG93LnMubGlua1RyYWNrRXZlbnRzKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJykpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0Lm9ubHkoJ3RyYWNrcyBwcm9kdWN0IGluZm9ybWF0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHVwZGF0ZSB0ZXN0IGZpeHR1cmUgdG8gc3BlY1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ1Byb2R1Y3QgVmlld2VkJywge1xuICAgICAgICAgIGlkOiAnNTA3ZjFmNzdiY2Y4NmNkNzk5NDM5MDExJyxcbiAgICAgICAgICBza3U6ICdHLTMyJyxcbiAgICAgICAgICBuYW1lOiAnTW9ub3BvbHk6IDNyZCBFZGl0aW9uJyxcbiAgICAgICAgICBwcmljZTogMTguOTksXG4gICAgICAgICAgY2F0ZWdvcnk6ICdHYW1lcydcbiAgICAgICAgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wcm9kdWN0cywgJ0dhbWVzO01vbm9wb2x5OiAzcmQgRWRpdGlvbjsxOzE4Ljk5OycpO1xuICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5zLmV2ZW50cywgd2luZG93LnMubGlua1RyYWNrRXZlbnRzKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJywgJ3Byb2R1Y3RzJykpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0LnNraXAoJ3RyYWNrcyBtdWx0aXBsZSBwcm9kdWN0IGluZm9ybWF0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy50cmFjaygnVmlld2VkIENhcnQnLCB7XG4gICAgICAgICAgcHJvZHVjdHM6IFt7XG4gICAgICAgICAgICBwcm9kdWN0OiAnV29vZGVuIFRlZXRoJyxcbiAgICAgICAgICAgIHF1YW50aXR5OiAzMixcbiAgICAgICAgICAgIGNhdGVnb3J5OiAnRGVudGFsIEFpZHMnLFxuICAgICAgICAgICAgcHJpY2U6IDE3Ljc2XG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgcHJvZHVjdDogJ01vbGUgUGVvcGxlJyxcbiAgICAgICAgICAgIHF1YW50aXR5OiAxMDAsXG4gICAgICAgICAgICBjYXRlZ29yeTogJ1N1YnRlcnJhbmVhbicsXG4gICAgICAgICAgICBwcmljZTogMzIuMzJcbiAgICAgICAgICB9XVxuICAgICAgICB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb2R1Y3RzLCAnRGVudGFsIEFpZHM7IFdvb2RlbiBUZWV0aDsgMzI7IDE3Ljc2LCAnXG4gICAgICAgICAgKyAnU3VidGVycmFuZWFuOyBNb2xlIFBlb3BsZTsgMTAwOyAzMi4zMicpO1xuICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5zLmV2ZW50cywgd2luZG93LnMubGlua1RyYWNrRXZlbnRzKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJywgJ3Byb2R1Y3RzJykpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCd0cmFja3MgYWxpYXNlZCBwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy50cmFjaygnRHJhbmsgU29tZSBNaWxrJywge1xuICAgICAgICAgIHR5cGU6ICcyJScsXG4gICAgICAgICAgYnJhbmQ6ICdMdWNlcm5lJyxcbiAgICAgICAgICBnb29kOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvcDEzLCAnMiUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyMywgJ0x1Y2VybmUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AxMCwgJ3RydWUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJywgJ3Byb3AxMycsICdwcm9wMjMnLFxuICAgICAgICAgICdwcm9wMTAnKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3RyYWNrcyBiYXNpYyBwcm9wZXJ0aWVzIG9mIGFsbCBjYXNlcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ2V2ZW50MTAnLCB7XG4gICAgICAgICAgYnJhbmQ6ICdMdWNlcm5lJ1xuICAgICAgICB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyMywgJ0x1Y2VybmUnKTtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudDEwJywge1xuICAgICAgICAgIEJyYW5kOiAnTHVjZXJuZSdcbiAgICAgICAgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wcm9wMjMsICdMdWNlcm5lJyk7XG4gICAgICAgIGFuYWx5dGljcy50cmFjaygnZXZlbnQxMCcsIHtcbiAgICAgICAgICBCckFOZDogJ0x1Y2VybmUnXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvcDIzLCAnTHVjZXJuZScpO1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ2V2ZW50MTAnLCB7XG4gICAgICAgICAgQlJBTkQ6ICdMdWNlcm5lJ1xuICAgICAgICB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyMywgJ0x1Y2VybmUnKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIGFsaWFzZWQgZVZhcnMgd2l0aCBuZXN0ZWQgcHJvcGVydGllcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ0RyYW5rIFNvbWUgTWlsaycsIHtcbiAgICAgICAgICBjYXI6IHsgaW5mbzogJzIwMDMgQWNjb3JkIChvbmx5IG9uZSBwcmV2aW91cyBvd25lciknIH0sXG4gICAgICAgICAgJ215LmRvZyc6ICdEb2cnLFxuICAgICAgICAgIGdvb2Q6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZVZhcjEwMSwgJzIwMDMgQWNjb3JkIChvbmx5IG9uZSBwcmV2aW91cyBvd25lciknKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmVWYXI0MDEsICdEb2cnKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJywgJ2VWYXIxMDEnLFxuICAgICAgICAgICdlVmFyNDAxJywgJ3Byb3AxMCcpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIGV2ZW50IGVWYXJzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy50cmFjaygnRXZlbnRFVmFyJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5lVmFyNjUsICdFdmVudEVWYXInKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydChjb250YWlucyh3aW5kb3cucy5saW5rVHJhY2tWYXJzLCAnZXZlbnRzJywgJ2VWYXI2NScpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHJlc3BlY3QgcHJvcGVydGllcy50aW1lc3RhbXAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAvLyBjaGFuZ2UgdGhlIGV2ZW50IG5hbWUgc2luY2Ugd2Ugbm8gbG9uZ2VyIHN1cHBvcnRcbiAgICAgICAgLy8gYmFzaWMgZXZlbnQgbWFwcGluZ1xuICAgICAgICBhbmFseXRpY3MudHJhY2soJ1BsYXllZCBhIFNvbmcnLCB7IHRpbWVzdGFtcDogZGF0ZSB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnRpbWVzdGFtcCwgaXNvKGRhdGUpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGZhbGxiYWNrIHRvIHRyYWNrLnRpbWVzdGFtcCgpJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgLy8gY2hhbmdlIHRoZSBldmVudCBuYW1lIHNpbmNlIHdlIG5vIGxvbmdlciBzdXBwb3J0XG4gICAgICAgIC8vIGJhc2ljIGV2ZW50IG1hcHBpbmdcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdQbGF5ZWQgYSBTb25nJywge30sIHsgdGltZXN0YW1wOiBkYXRlIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMudGltZXN0YW1wLCBpc28oZGF0ZSkpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgbm90IHNlbmQgdGhlIHRpbWVzdGFtcCBpZiB0aGUgc2V0dGluZyBpcyBkaXNhYmxlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkZWxldGUgd2luZG93LnMudGltZXN0YW1wO1xuICAgICAgICBvbW5pdHVyZS5vcHRpb25zLmluY2x1ZGVUaW1lc3RhbXAgPSBmYWxzZTtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudDEnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnRpbWVzdGFtcCwgbnVsbCk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHdpbmRvdy5zLnRsJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5zdHViKHdpbmRvdy5zLCAndGwnKTtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdEcmFuayBzb21lIG1pbGsnKTtcbiAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cucy50bCwgdHJ1ZSwgJ28nLCAnRHJhbmsgc29tZSBtaWxrJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBjbGVhciB3aW5kb3cuc1t2YXJpYWJsZXNdIGJldHdlZW4gY2FsbHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gdXBkYXRlIHByb3BlcnRpZXMgaGVyZSBzaW5jZSB3ZSBubyBsb25nZXIgc3VwcG9ydFxuICAgICAgICAvLyBiYXNpYyBldmFyL3Byb3AvaHZhciBtYXBwaW5nXG4gICAgICAgIGFuYWx5dGljcy50cmFjaygnRHJhbmsgc29tZSBtaWxrJywgeyBBaXJwbGFuZTogJzEyMycgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wcm9wMjAsICcxMjMnKTtcbiAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdEcmFuayBzb21lIG1pbGsnLCB7IEdvb2Q6ICdoZXlvJyB9KTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydCghd2luZG93LnMucHJvcDIwKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyNSwgJ2hleW8nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJyNwYWdlJywgZnVuY3Rpb24oKSB7XG4gICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICBkZWxldGUgd2luZG93LnMudmlzaXRvcklEO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCd0cmFja3MgbmFtZWxlc3MgcGFnZXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnBhZ2VOYW1lLCB1bmRlZmluZWQpO1xuICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5zLmV2ZW50cywgdW5kZWZpbmVkKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIG5vcm1hbCBwYWdlcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MucGFnZSgnUGFnZTEnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnBhZ2VOYW1lLCAnUGFnZTEnKTtcbiAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cucy5ldmVudHMsICdQYWdlMScpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCd0cmFja3MgYWxpYXNlZCBwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCdEcmFuayBTb21lIE1pbGsnLCB7XG4gICAgICAgICAgdHlwZTogJzIlJyxcbiAgICAgICAgICBicmFuZDogJ0x1Y2VybmUnLFxuICAgICAgICAgIGdvb2Q6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wYWdlTmFtZSwgJ0RyYW5rIFNvbWUgTWlsaycpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvcDEzLCAnMiUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AyMywgJ0x1Y2VybmUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnByb3AxMCwgJ3RydWUnKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHNlbmQgdXNlci5pZCBhcyB2aXNpdG9ySUQgaWYgdGltZXN0YW1wcyBhcmUgZGlzYWJsZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgb21uaXR1cmUub3B0aW9ucy5pbmNsdWRlVGltZXN0YW1wID0gZmFsc2U7XG4gICAgICAgIHVzZXIuaWQoJ3VzZXItaWQnKTtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ25hbWUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnBhZ2VOYW1lLCAnbmFtZScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMudmlzaXRvcklELCAndXNlci1pZCcpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgbm90IHNlbmQgdXNlci5pZCBhcyB2aXNpdG9ySUQgaWYgdGltZXN0YW1wcyBhcmUgZW5hYmxlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBvbW5pdHVyZS5vcHRpb25zLmluY2x1ZGVUaW1lc3RhbXAgPSB0cnVlO1xuICAgICAgICB1c2VyLmlkKCd1c2VyLWlkJyk7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCduYW1lJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wYWdlTmFtZSwgJ25hbWUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmFzc2VydCghd2luZG93LnMudmlzaXRvcklEKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIG5vdCBzZW5kIGVtcHR5IHVzZXIuaWQgYXMgdmlzaXRvcklEJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCduYW1lJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wYWdlTmFtZSwgJ25hbWUnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLnZpc2l0b3JJRCwgdW5kZWZpbmVkKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgndHJhY2tzIGFsaWFzZWQgZVZhcnMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ0RyYW5rIFNvbWUgTWlsaycsIHtcbiAgICAgICAgICBjYXI6ICcyMDAzIEFjY29yZCAob25seSBvbmUgcHJldmlvdXMgb3duZXIpJyxcbiAgICAgICAgICBkb2c6ICdEb2cnLFxuICAgICAgICAgIGdvb2Q6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucGFnZU5hbWUsICdEcmFuayBTb21lIE1pbGsnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmVWYXIxLCAnMjAwMyBBY2NvcmQgKG9ubHkgb25lIHByZXZpb3VzIG93bmVyKScpO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMuZVZhcjQ3LCAnRG9nJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3RyYWNrcyBhbGlhc2VkIGVWYXJzIHdpdGggbmVzdGVkIHByb3BlcnRpZXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ0RyYW5rIFNvbWUgTWlsaycsIHtcbiAgICAgICAgICBjYXI6IHsgaW5mbzogJzIwMDMgQWNjb3JkIChvbmx5IG9uZSBwcmV2aW91cyBvd25lciknIH0sXG4gICAgICAgICAgJ215LmRvZyc6ICdEb2cnLFxuICAgICAgICAgIGdvb2Q6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucGFnZU5hbWUsICdEcmFuayBTb21lIE1pbGsnKTtcbiAgICAgICAgYW5hbHl0aWNzLmVxdWFsKHdpbmRvdy5zLmVWYXIxMDEsICcyMDAzIEFjY29yZCAob25seSBvbmUgcHJldmlvdXMgb3duZXIpJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5lVmFyNDAxLCAnRG9nJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCByZXNwZWN0IHByb3BlcnRpZXMudGltZXN0YW1wJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRlID0gaXNvKG5ldyBEYXRlKCkpO1xuICAgICAgICBhbmFseXRpY3MucGFnZSgnZXZlbnQxJywgeyB0aW1lc3RhbXA6IGRhdGUgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy50aW1lc3RhbXAsIGRhdGUpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgZmFsbGJhY2sgdG8gcGFnZS50aW1lc3RhbXAoKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCdldmVudDEnLCB7fSwgeyB0aW1lc3RhbXA6IGRhdGUgfSk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy50aW1lc3RhbXAsIGlzbyhkYXRlKSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBub3Qgc2VuZCB0aGUgdGltZXN0YW1wIGlmIHRoZSBzZXR0aW5nIGlzIGRpc2FibGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlbGV0ZSB3aW5kb3cucy50aW1lc3RhbXA7XG4gICAgICAgIG9tbml0dXJlLm9wdGlvbnMuaW5jbHVkZVRpbWVzdGFtcCA9IGZhbHNlO1xuICAgICAgICBhbmFseXRpY3MucGFnZSgnZXZlbnQxJyk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy50aW1lc3RhbXAsIG51bGwpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgbm90IHRyYWNrIGFuIGluaXRpYWwgcGFnZSBpZiAuaW5pdGlhbFBhZ2UgaXMgZmFsc2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgb21uaXR1cmUub3B0aW9ucy5pbml0aWFsUGFnZSA9IGZhbHNlO1xuICAgICAgICBhbmFseXRpY3MucGFnZSgnZXZlbnQzNycpO1xuICAgICAgICBhbmFseXRpY3Mubm90RXF1YWwod2luZG93LnMucGFnZU5hbWUsICdldmVudDM3Jyk7XG4gICAgICAgIGFuYWx5dGljcy5hc3NlcnQob21uaXR1cmUub3B0aW9ucy5wYWdlKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGNhbGwgd2luZG93LnMudCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3Muc3R1Yih3aW5kb3cucywgJ3QnKTtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cucy50KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGNsZWFyIHdpbmRvdy5zW3ZhcmlhYmxlc10gYmV0d2VlbiBjYWxscycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmFseXRpY3MucGFnZSgnZXZlbnQyMCcsIHsgQWlycGxhbmU6ICcxMjMnIH0pO1xuICAgICAgICBhbmFseXRpY3MuZXF1YWwod2luZG93LnMucHJvcDIwLCAnMTIzJyk7XG4gICAgICAgIGFuYWx5dGljcy5wYWdlKCdldmVudDIwJywgeyBHb29kOiAnaGV5bycgfSk7XG4gICAgICAgIGFuYWx5dGljcy5hc3NlcnQoIXdpbmRvdy5zLnByb3AyMCk7XG4gICAgICAgIGFuYWx5dGljcy5lcXVhbCh3aW5kb3cucy5wcm9wMjUsICdoZXlvJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTtcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHN0cmluZyBjb250YWlucyBhbGwgb2YgdGhlIHN1YnN0cmluZ3NcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcGFyYW0gey4uLnN0cmluZ30gc3Vic3RyaW5nc1xuICovXG5cbmZ1bmN0aW9uIGNvbnRhaW5zKHN0cikge1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKDEsIGFyZ3VtZW50cyk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzdHIuaW5kZXhPZihhcmdzW2ldKSA9PT0gLTEpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuXG4iXX0=
