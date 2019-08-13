(function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @api public
   */

  function require(name){
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

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];
    var threw = true;

    try {
      fn.call(m.exports, function(req){
        var dep = modules[id][1][req];
        return require(dep || req);
      }, m, m.exports, outer, modules, cache, entries);
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
})({
1: [function(require, module, exports) {

var Analytics = require('analytics.js-core').constructor;
var integration = require('analytics.js-integration');
var sandbox = require('clear-env');
var tester = require('analytics.js-integration-tester');
var plugin = require('../lib/');

describe('Google Analytics', function() {
  var GA = plugin.Integration;
  var analytics;
  var ga;

  beforeEach(function() {
    analytics = new Analytics();
    analytics.use(plugin);
    analytics.use(tester);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(GA, integration('Google Analytics')
      .readyOnLoad()
      .global('ga')
      .global('gaplugins')
      .global('_gaq')
      .global('GoogleAnalyticsObject')
      .option('anonymizeIp', false)
      .option('classic', false)
      .option('dimensions', {})
      .option('domain', 'auto')
      .option('doubleClick', false)
      .option('enhancedEcommerce', false)
      .option('enhancedLinkAttribution', false)
      .option('ignoredReferrers', null)
      .option('includeSearch', false)
      .option('metrics', {})
      .option('nonInteraction', false)
      .option('sendUserId', false)
      .option('siteSpeedSampleRate', 1)
      .option('trackCategorizedPages', true)
      .option('trackNamedPages', true)
      .option('trackingId', ''));
  });

  describe('Universal', function() {
    var settings = {
      anonymizeIp: true,
      domain: 'auto',
      siteSpeedSampleRate: 42,
      trackingId: 'UA-27033709-12'
    };

    beforeEach(function() {
      ga = new GA(settings);
      analytics.add(ga);
    });

    afterEach(function() {
      ga.reset();
    });

    describe('before loading', function() {
      beforeEach(function() {
        analytics.stub(ga, 'load');
      });

      describe('#initialize', function() {
        it('should require \'displayfeatures\' if .doubleClick option is `true`', function() {
          ga.options.doubleClick = true;
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window.ga.q[1], ['require', 'displayfeatures']);
        });

        it('should require "linkid.js" if enhanced link attribution is `true`', function() {
          ga.options.enhancedLinkAttribution = true;
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window.ga.q[1], ['require', 'linkid', 'linkid.js']);
        });

        it('should create window.GoogleAnalyticsObject', function() {
          analytics.assert(!window.GoogleAnalyticsObject);
          analytics.initialize();
          analytics.page();
          analytics.assert(window.GoogleAnalyticsObject === 'ga');
        });

        it('should create window.ga', function() {
          analytics.assert(!window.ga);
          analytics.initialize();
          analytics.page();
          analytics.assert(typeof window.ga === 'function');
        });

        it('should create window.ga.l', function() {
          analytics.assert(!window.ga);
          analytics.initialize();
          analytics.page();
          analytics.assert(typeof window.ga.l === 'number');
        });

        it('should call window.ga.create with options', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(Array.prototype.slice.call(window.ga.q[0]), ['create', settings.trackingId, {
            cookieDomain: 'none',
            siteSpeedSampleRate: settings.siteSpeedSampleRate,
            allowLinker: true
          }]);
        });

        it('should anonymize the ip', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window.ga.q[1], ['set', 'anonymizeIp', true]);
        });

        it('should call #load', function() {
          analytics.initialize();
          analytics.page();
          analytics.called(ga.load);
        });

        it('should not send universal user id by default', function() {
          analytics.user().id('baz');
          analytics.initialize();
          analytics.page();
          analytics.notDeepEqual(window.ga.q[1], ['set', 'userId', 'baz']);
        });

        it('should send universal user id if sendUserId option is true and user.id() is truthy', function() {
          analytics.user().id('baz');
          ga.options.sendUserId = true;
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window.ga.q[1], ['set', 'userId', 'baz']);
        });

        it('should map custom dimensions & metrics using user.traits()', function() {
          ga.options.metrics = { firstName: 'metric1', last_name: 'metric2', foo: 'metric3' };
          ga.options.dimensions = { Age: 'dimension2', bar: 'dimension3' };
          analytics.user().traits({ firstName: 'John', lastName: 'Doe', age: 20, foo: true, bar: false });
          analytics.initialize();
          analytics.page();

          analytics.deepEqual(window.ga.q[2], ['set', {
            metric1: 'John',
            metric2: 'Doe',
            metric3: 'true',
            dimension2: 20,
            dimension3: 'false'
          }]);
        });

        it('should not set metrics and dimensions if there are no traits', function() {
          ga.options.metrics = { metric1: 'something' };
          ga.options.dimensions = { dimension3: 'industry' };
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window.ga.q[2], undefined);
        });

        it('should set metrics and dimensions that have dots but arent nested', function() {
          ga.options.metrics = { 'name.first': 'metric1', 'name.last': 'metric2' };
          ga.options.dimensions = { Age: 'dimension2' };
          analytics.user().traits({ 'name.first': 'John', 'name.last': 'Doe', age: 20 });
          analytics.initialize();
          analytics.page();

          analytics.deepEqual(window.ga.q[2], ['set', {
            metric1: 'John',
            metric2: 'Doe',
            dimension2: 20
          }]);
        });

        it('should set metrics and dimensions that are nested, using dot notation', function() {
          ga.options.metrics = { 'name.first': 'metric1', 'name.last': 'metric2' };
          ga.options.dimensions = { Age: 'dimension2' };
          analytics.user().traits({
            name: {
              first: 'John',
              last: 'Doe'
            },
            age: 20
          });
          analytics.initialize();
          analytics.page();

          analytics.deepEqual(window.ga.q[2], ['set', {
            metric1: 'John',
            metric2: 'Doe',
            dimension2: 20
          }]);
        });
      });
    });

    describe('loading', function() {
      it('should load', function(done) {
        analytics.load(ga, done);
      });
    });

    describe('after loading', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
        analytics.page();
      });

      describe('#page', function() {
        beforeEach(function() {
          analytics.stub(window, 'ga');
        });

        it('should send a page view', function() {
          analytics.page();
          analytics.called(window.ga, 'send', 'pageview', {
            page: window.location.pathname,
            title: document.title,
            location: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search
          });
        });

        it('should set the tracker\'s page object', function() {
          analytics.page();
          analytics.called(window.ga, 'set', {
            page: window.location.pathname,
            title: document.title
          });
        });

        it('should send a page view with properties', function() {
          analytics.page('category', 'name', { url: 'url', path: '/path' });
          analytics.called(window.ga, 'send', 'pageview', {
            page: '/path',
            title: 'category name',
            location: 'url'
          });
        });

        it('should send the query if its included', function() {
          ga.options.includeSearch = true;
          analytics.page('category', 'name', { url: 'url', path: '/path', search: '?q=1' });
          analytics.called(window.ga, 'send', 'pageview', {
            page: '/path?q=1',
            title: 'category name',
            location: 'url'
          });
        });

        it('should send the campaign info if its included', function() {
          ga.options.includeSearch = true;
          analytics.page('category', 'name', { url: 'url', path: '/path', search: '?q=1' }, {
            campaign: {
              name: 'test',
              source: 'test',
              medium: 'test',
              term: 'test',
              content: 'test'
            }
          });
          analytics.called(window.ga, 'send', 'pageview', {
            page: '/path?q=1',
            title: 'category name',
            location: 'url',
            campaignName: 'test',
            campaignSource: 'test',
            campaignMedium: 'test',
            campaignKeyword: 'test',
            campaignContent: 'test'
          });
        });

        it('should map custom dimensions & metrics using track.properties()', function() {
          ga.options.metrics = { score: 'metric1' };
          ga.options.dimensions = { author: 'dimension1', postType: 'dimension2' };
          analytics.page({ score: 21, author: 'Author', postType: 'blog' });

          analytics.called(window.ga, 'set', {
            metric1: 21,
            dimension1: 'Author',
            dimension2: 'blog'
          });
        });

        it('should track a named page', function() {
          analytics.page('Name');
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'All',
            eventAction: 'Viewed Name Page',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: true
          });
        });

        it('should track a named page with context', function() {
          analytics.page('Name', {}, {
            campaign: {
              name: 'test',
              source: 'test',
              medium: 'test',
              term: 'test',
              content: 'test'
            }
          });
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'All',
            eventAction: 'Viewed Name Page',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: true,
            campaignName: 'test',
            campaignSource: 'test',
            campaignMedium: 'test',
            campaignKeyword: 'test',
            campaignContent: 'test'
          });
        });

        it('should track a name + category page', function() {
          analytics.page('Category', 'Name');
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'Category',
            eventAction: 'Viewed Category Name Page',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: true
          });
        });

        it('should track a categorized page', function() {
          analytics.page('Category', 'Name');
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'Category',
            eventAction: 'Viewed Category Page',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: true
          });
        });

        it('should not track a named or categorized page when the option is off', function() {
          ga.options.trackNamedPages = false;
          ga.options.trackCategorizedPages = false;
          analytics.page('Name');
          analytics.page('Category', 'Name');
          // send should only be sent twice, for pageviews, not events
          analytics.assert(window.ga.args.length === 4);
          analytics.assert(window.ga.args[0][0] === 'set');
          analytics.assert(window.ga.args[1][0] === 'send');
          analytics.assert(window.ga.args[2][0] === 'set');
          analytics.assert(window.ga.args[3][0] === 'send');
        });
      });

      describe('#identify', function() {
        beforeEach(function() {
          analytics.stub(window, 'ga');
        });

        it('should send user id if sendUserId option is true and identify.user() is truthy', function() {
          ga.options.sendUserId = true;
          analytics.identify('Steven');
          analytics.called(window.ga, 'set', 'userId', 'Steven');
        });

        it('should send not user id if sendUserId option is false and identify.user() is truthy', function() {
          ga.options.sendUserId = false;
          analytics.identify('Steven');
          analytics.assert(window.ga.args.length === 0);
        });

        it('should set custom dimensions', function() {
          ga.options.dimensions = { age: 'dimension1' };
          analytics.identify('Steven', { age: 25 });
          analytics.called(window.ga, 'set', { dimension1: 25 });
        });
      });

      describe('#track', function() {
        beforeEach(function() {
          analytics.stub(window, 'ga');
        });

        it('should send an event', function() {
          analytics.track('event');
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'All',
            eventAction: 'event',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: false
          });
        });

        it('should send an event with context', function() {
          analytics.track('event', {}, {
            campaign: {
              name: 'test',
              source: 'test',
              medium: 'test',
              term: 'test',
              content: 'test'
            }
          });
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'All',
            eventAction: 'event',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: false,
            campaignName: 'test',
            campaignSource: 'test',
            campaignMedium: 'test',
            campaignKeyword: 'test',
            campaignContent: 'test'
          });
        });

        it('should send a category property', function() {
          analytics.track('event', { category: 'category' });
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'category',
            eventAction: 'event',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: false
          });
        });

        it('should send a stored category', function() {
          analytics.page('category', 'name');
          analytics.track('event', {});
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'category',
            eventAction: 'event',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: false
          });
        });

        it('should send a category property even if there is a stored category', function() {
          analytics.page('category(page)');
          analytics.track('event', { category: 'category(track)' });
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'category(track)',
            eventAction: 'event',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: false
          });
        });

        it('should send a label property', function() {
          analytics.track('event', { label: 'label' });
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'All',
            eventAction: 'event',
            eventLabel: 'label',
            eventValue: 0,
            nonInteraction: false
          });
        });

        it('should send a rounded value property', function() {
          analytics.track('event', { value: 1.1 });
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'All',
            eventAction: 'event',
            eventLabel: undefined,
            eventValue: 1,
            nonInteraction: false
          });
        });

        it('should prefer a rounded revenue property', function() {
          analytics.track('event', { revenue: 9.99 });
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'All',
            eventAction: 'event',
            eventLabel: undefined,
            eventValue: 10,
            nonInteraction: false
          });
        });

        it('should send a non-interaction property', function() {
          analytics.track('event', { nonInteraction: 1 });
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'All',
            eventAction: 'event',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: true
          });
        });

        it('should send a non-interaction option', function() {
          analytics.track('event', {}, { 'Google Analytics': { nonInteraction: 1 } });
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'All',
            eventAction: 'event',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: true
          });
        });

        it('should respect the non-interaction option', function() {
          ga.options.nonInteraction = true;
          analytics.track('event');
          analytics.called(window.ga, 'send', 'event', {
            eventCategory: 'All',
            eventAction: 'event',
            eventLabel: undefined,
            eventValue: 0,
            nonInteraction: true
          });
        });

        it('should map custom dimensions & metrics using track.properties()', function() {
          ga.options.metrics = { loadTime: 'metric1', levelAchieved: 'metric2' };
          ga.options.dimensions = { referrer: 'dimension2', potato: 'dimension1' };
          analytics.track('Level Unlocked', { loadTime: '100', levelAchieved: '5', potato: 'five', referrer: 'Google' });

          analytics.called(window.ga, 'set', {
            metric1: '100',
            metric2: '5',
            dimension1: 'five',
            dimension2: 'Google'
          });
        });
      });

      describe('ecommerce', function() {
        beforeEach(function() {
          analytics.stub(window, 'ga');
        });

        it('should require ecommerce.js', function() {
          analytics.track('completed order', { orderId: 'ee099bf7' });
          analytics.called(window.ga, 'require', 'ecommerce');
          analytics.assert(ga.ecommerce);
        });

        it('should not require ecommerce if .ecommerce is true', function() {
          ga.ecommerce = true;
          analytics.track('completed order', { orderId: 'e213e4da' });
          analytics.didNotCall(window.ga, 'require', 'ecommerce');
        });

        it('should send simple ecommerce data', function() {
          analytics.track('completed order', { orderId: '7306cc06' });
          analytics.assert(window.ga.args.length === 3);
          analytics.assert(window.ga.args[1][0] === 'ecommerce:addTransaction');
          analytics.assert(window.ga.args[2][0] === 'ecommerce:send');
        });

        it('should send ecommerce data', function() {
          analytics.track('completed order', {
            orderId: '780bc55',
            total: 99.99,
            shipping: 13.99,
            tax: 20.99,
            products: [{
              quantity: 1,
              price: 24.75,
              name: 'my product',
              sku: 'p-298'
            }, {
              quantity: 3,
              price: 24.75,
              name: 'other product',
              sku: 'p-299'
            }]
          });

          analytics.deepEqual(window.ga.args[1], ['ecommerce:addTransaction', {
            id: '780bc55',
            revenue: 99.99,
            shipping: 13.99,
            affiliation: undefined,
            tax: 20.99,
            currency: 'USD'
          }]);

          analytics.deepEqual(window.ga.args[2], ['ecommerce:addItem', {
            id: '780bc55',
            category: undefined,
            name: 'my product',
            price: 24.75,
            quantity: 1,
            sku: 'p-298',
            currency: 'USD'
          }]);

          analytics.deepEqual(window.ga.args[3], ['ecommerce:addItem', {
            id: '780bc55',
            category: undefined,
            name: 'other product',
            price: 24.75,
            sku: 'p-299',
            quantity: 3,
            currency: 'USD'
          }]);

          analytics.deepEqual(window.ga.args[4], ['ecommerce:send']);
        });

        it('should fallback to revenue', function() {
          analytics.track('completed order', {
            orderId: '5d4c7cb5',
            revenue: 99.9,
            shipping: 13.99,
            tax: 20.99,
            products: []
          });

          analytics.deepEqual(window.ga.args[1], ['ecommerce:addTransaction', {
            id: '5d4c7cb5',
            revenue: 99.9,
            shipping: 13.99,
            affiliation: undefined,
            tax: 20.99,
            currency: 'USD'
          }]);
        });

        it('should pass custom currency', function() {
          analytics.track('completed order', {
            orderId: '5d4c7cb5',
            revenue: 99.9,
            shipping: 13.99,
            tax: 20.99,
            products: [],
            currency: 'EUR'
          });

          analytics.deepEqual(window.ga.args[1], ['ecommerce:addTransaction', {
            id: '5d4c7cb5',
            revenue: 99.9,
            shipping: 13.99,
            affiliation: undefined,
            tax: 20.99,
            currency: 'EUR'
          }]);
        });
      });
    });
  });

  describe('Universal Enhanced Ecommerce', function() {
    var settings = {
      enhancedEcommerce: true,
      anonymizeIp: true,
      domain: 'none',
      siteSpeedSampleRate: 42,
      trackingId: 'UA-27033709-12'
    };

    beforeEach(function() {
      ga = new GA(settings);
      analytics.add(ga);
    });

    afterEach(function() {
      ga.reset();
    });

    describe('after loading', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
        analytics.page();
      });

      describe('enhanced ecommerce', function() {
        beforeEach(function() {
          analytics.spy(window, 'ga');
        });

        it('should require ec.js', function() {
          analytics.track('completed order', { orderId: 'ee099bf7' });
          analytics.assert(window.ga.args.length > 0);
          analytics.deepEqual(window.ga.args[0], ['require', 'ec']);
        });

        it('should not require ec if .enhancedEcommerceLoaded is true', function() {
          ga.enhancedEcommerceLoaded = true;
          analytics.track('completed order', { orderId: 'e213e4da' });
          analytics.assert(window.ga.args.length > 0);
          analytics.notDeepEqual(window.ga.args[0], ['require', 'ec']);
        });

        it('should set currency for ec.js  to default', function() {
          analytics.track('completed order', { orderId: 'ee099bf7' });
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'USD']);
        });

        it('should set currency for ec.js to custom currency', function() {
          analytics.track('completed order', { orderId: 'ee099bf7', currency: 'EUR' });
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'EUR']);
        });

        it('should send added product data', function() {
          analytics.track('added product', {
            currency: 'CAD',
            quantity: 1,
            price: 24.75,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298'
          });

          analytics.assert(window.ga.args.length === 5);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addProduct', {
            id: 'p-298',
            name: 'my product',
            category: 'cat 1',
            quantity: 1,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD'
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:setAction', 'add', {}]);
          analytics.deepEqual(window.ga.args[4], ['send', 'event', 'cat 1', 'added product', { nonInteraction: 1 }]);
        });

        it('should send send label tracking enhanced ecommerce events with Univeral Analytics', function() {
          analytics.track('added product', {
            currency: 'CAD',
            quantity: 1,
            price: 24.75,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298',
            label: 'sample label'
          });

          analytics.assert(window.ga.args.length === 5);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addProduct', {
            id: 'p-298',
            name: 'my product',
            category: 'cat 1',
            quantity: 1,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD'
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:setAction', 'add', {}]);
          analytics.deepEqual(window.ga.args[4], ['send', 'event', 'cat 1', 'added product', 'sample label', { nonInteraction: 1 }]);
        });

        it('should send removed product data', function() {
          analytics.track('removed product', {
            currency: 'CAD',
            quantity: 1,
            price: 24.75,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298'
          });

          analytics.assert(window.ga.args.length === 5);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addProduct', {
            id: 'p-298',
            name: 'my product',
            category: 'cat 1',
            quantity: 1,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD'
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:setAction', 'remove', {}]);
          analytics.deepEqual(window.ga.args[4], ['send', 'event', 'cat 1', 'removed product', { nonInteraction: 1 }]);
        });

        it('should send viewed product data', function() {
          analytics.track('viewed product', {
            currency: 'CAD',
            quantity: 1,
            price: 24.75,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298'
          });

          analytics.assert(window.ga.args.length === 5);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addProduct', {
            id: 'p-298',
            name: 'my product',
            category: 'cat 1',
            quantity: 1,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD'
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:setAction', 'detail', {}]);
          analytics.deepEqual(window.ga.args[4], ['send', 'event', 'cat 1', 'viewed product', { nonInteraction: 1 }]);
        });

        it('should send clicked product data', function() {
          analytics.track('clicked product', {
            currency: 'CAD',
            quantity: 1,
            price: 24.75,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298',
            list: 'search results'
          });

          analytics.assert(window.ga.args.length === 5);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addProduct', {
            id: 'p-298',
            name: 'my product',
            category: 'cat 1',
            quantity: 1,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD'
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:setAction', 'click', {
            list: 'search results'
          }]);
          analytics.deepEqual(window.ga.args[4], ['send', 'event', 'cat 1', 'clicked product', { nonInteraction: 1 }]);
        });

        it('should send viewed promotion data', function() {
          analytics.track('viewed promotion', {
            currency: 'CAD',
            id: 'PROMO_1234',
            name: 'Summer Sale',
            creative: 'summer_banner2',
            position: 'banner_slot1'
          });

          // FIXME: Why is this commented out?
          // analytics.assert(4 == window.ga.args.length);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addPromo', {
            id: 'PROMO_1234',
            name: 'Summer Sale',
            creative: 'summer_banner2',
            position: 'banner_slot1'
          }]);
          analytics.deepEqual(window.ga.args[3], ['send', 'event', 'EnhancedEcommerce', 'viewed promotion', { nonInteraction: 1 }]);
        });

        it('should send clicked promotion data', function() {
          analytics.track('clicked promotion', {
            currency: 'CAD',
            id: 'PROMO_1234',
            name: 'Summer Sale',
            creative: 'summer_banner2',
            position: 'banner_slot1'
          });

          // FIXME: Why is this commented out?
          // analytics.assert(5 == window.ga.args.length);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addPromo', {
            id: 'PROMO_1234',
            name: 'Summer Sale',
            creative: 'summer_banner2',
            position: 'banner_slot1'
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:setAction', 'promo_click', {}]);
          analytics.deepEqual(window.ga.args[4], ['send', 'event', 'EnhancedEcommerce', 'clicked promotion', { nonInteraction: 1 }]);
        });

        it('should send started order data', function() {
          analytics.track('started order', {
            currency: 'CAD',
            products: [{
              quantity: 1,
              price: 24.75,
              name: 'my product',
              sku: 'p-298'
            }, {
              quantity: 3,
              price: 24.75,
              name: 'other product',
              sku: 'p-299'
            }],
            step: 1,
            paymentMethod: 'Visa'
          });
          analytics.assert(window.ga.args.length === 6);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addProduct', {
            id: 'p-298',
            name: 'my product',
            category: undefined,
            quantity: 1,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD'
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:addProduct', {
            id: 'p-299',
            name: 'other product',
            category: undefined,
            quantity: 3,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD'
          }]);
          analytics.deepEqual(window.ga.args[4], ['ec:setAction', 'checkout', {
            step: 1,
            option: 'Visa'
          }]);
          analytics.deepEqual(window.ga.args[5], ['send', 'event', 'EnhancedEcommerce', 'started order', { nonInteraction: 1 }]);
        });

        it('should send updated order data', function() {
          analytics.track('updated order', {
            currency: 'CAD',
            products: [{
              quantity: 1,
              price: 24.75,
              name: 'my product',
              category: 'cat 1',
              sku: 'p-298'
            }, {
              quantity: 3,
              price: 24.75,
              name: 'other product',
              category: 'cat 2',
              sku: 'p-299'
            }],
            step: 1,
            paymentMethod: 'Visa'
          });

          analytics.assert(window.ga.args.length === 6);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addProduct', {
            id: 'p-298',
            name: 'my product',
            category: 'cat 1',
            quantity: 1,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD'
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:addProduct', {
            id: 'p-299',
            name: 'other product',
            category: 'cat 2',
            quantity: 3,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD'
          }]);
          analytics.deepEqual(window.ga.args[4], ['ec:setAction', 'checkout', {
            step: 1,
            option: 'Visa'
          }]);
          analytics.deepEqual(window.ga.args[5], ['send', 'event', 'EnhancedEcommerce', 'updated order', { nonInteraction: 1 }]);
        });

        it('should send viewed checkout step data', function() {
          analytics.track('viewed checkout step', {
            currency: 'CAD',
            step: 2
          });

          analytics.assert(window.ga.args.length === 4);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:setAction', 'checkout', {
            step: 2,
            option: undefined
          }]);
          analytics.deepEqual(window.ga.args[3], ['send', 'event', 'EnhancedEcommerce', 'viewed checkout step', { nonInteraction: 1 }]);
        });

        it('should send completed checkout step data', function() {
          analytics.track('completed checkout step', {
            currency: 'CAD',
            step: 2,
            shippingMethod: 'FedEx'
          });

          analytics.assert(window.ga.args.length === 4);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:setAction', 'checkout_option', {
            step: 2,
            option: 'FedEx'
          }]);
          analytics.deepEqual(window.ga.args[3], ['send', 'event', 'Checkout', 'Option']);
        });

        it('should send completed checkout step data with all options', function() {
          analytics.track('completed checkout step', {
            currency: 'CAD',
            step: 2,
            paymentMethod: 'Visa',
            shippingMethod: 'FedEx'
          });

          analytics.assert(window.ga.args.length === 4);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:setAction', 'checkout_option', {
            step: 2,
            option: 'Visa, FedEx'
          }]);
          analytics.deepEqual(window.ga.args[3], ['send', 'event', 'Checkout', 'Option']);
        });

        it('should not send completed checkout step data without a step', function() {
          analytics.track('completed checkout step', {
            currency: 'CAD',
            shippingMethod: 'FedEx'
          });

          analytics.assert(window.ga.args.length === 0);
        });

        it('should not send completed checkout step data without an option', function() {
          analytics.track('completed checkout step', {
            currency: 'CAD',
            step: 2
          });

          analytics.assert(window.ga.args.length === 0);
        });

        it('should send simple completed order data', function() {
          analytics.track('completed order', { orderId: '7306cc06' });
          analytics.assert(window.ga.args.length === 4);
          analytics.deepEqual(window.ga.args[2], ['ec:setAction', 'purchase', {
            id: '7306cc06',
            affiliation: undefined,
            revenue: 0.0,
            tax: undefined,
            shipping: undefined,
            coupon: undefined
          }]);
          analytics.deepEqual(window.ga.args[3], ['send', 'event', 'EnhancedEcommerce', 'completed order', { nonInteraction: 1 }]);
        });

        it('should send completed order data', function() {
          analytics.track('completed order', {
            orderId: '780bc55',
            total: 99.9,
            shipping: 13.99,
            tax: 20.99,
            currency: 'CAD',
            coupon: 'coupon',
            affiliation: 'affiliation',
            products: [{
              quantity: 1,
              price: 24.75,
              name: 'my product',
              category: 'cat 1',
              sku: 'p-298'
            }, {
              quantity: 3,
              price: 24.75,
              name: 'other product',
              category: 'cat 2',
              sku: 'p-299',
              currency: 'EUR'
            }]
          });

          analytics.assert(window.ga.args.length === 6);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addProduct', {
            id: 'p-298',
            name: 'my product',
            category: 'cat 1',
            quantity: 1,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD'
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:addProduct', {
            id: 'p-299',
            name: 'other product',
            category: 'cat 2',
            quantity: 3,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'EUR'
          }]);
          analytics.deepEqual(window.ga.args[4], ['ec:setAction', 'purchase', {
            id: '780bc55',
            affiliation: 'affiliation',
            revenue: 99.9,
            tax: 20.99,
            shipping: 13.99,
            coupon: 'coupon'
          }]);
          analytics.deepEqual(window.ga.args[5], ['send', 'event', 'EnhancedEcommerce', 'completed order', { nonInteraction: 1 }]);
        });

        it('should add coupon to product level in completed order', function() {
          analytics.track('completed order', {
            orderId: '780bc55',
            total: 99.9,
            shipping: 13.99,
            tax: 20.99,
            currency: 'CAD',
            coupon: 'coupon',
            affiliation: 'affiliation',
            products: [{
              quantity: 1,
              price: 24.75,
              name: 'my product',
              category: 'cat 1',
              sku: 'p-298',
              coupon: 'promo'
            }, {
              quantity: 3,
              price: 24.75,
              name: 'other product',
              category: 'cat 2',
              sku: 'p-299',
              currency: 'EUR'
            }]
          });

          analytics.assert(window.ga.args.length === 6);
          analytics.deepEqual(window.ga.args[1], ['set', '&cu', 'CAD']);
          analytics.deepEqual(window.ga.args[2], ['ec:addProduct', {
            id: 'p-298',
            name: 'my product',
            category: 'cat 1',
            quantity: 1,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'CAD',
            coupon: 'promo'
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:addProduct', {
            id: 'p-299',
            name: 'other product',
            category: 'cat 2',
            quantity: 3,
            price: 24.75,
            brand: undefined,
            variant: undefined,
            currency: 'EUR'
          }]);
          analytics.deepEqual(window.ga.args[4], ['ec:setAction', 'purchase', {
            id: '780bc55',
            affiliation: 'affiliation',
            revenue: 99.9,
            tax: 20.99,
            shipping: 13.99,
            coupon: 'coupon'
          }]);
          analytics.deepEqual(window.ga.args[5], ['send', 'event', 'EnhancedEcommerce', 'completed order', { nonInteraction: 1 }]);
        });

        it('completed order should fallback to revenue', function() {
          analytics.track('completed order', {
            orderId: '5d4c7cb5',
            revenue: 99.9,
            shipping: 13.99,
            tax: 20.99,
            products: []
          });

          analytics.deepEqual(window.ga.args[2], ['ec:setAction', 'purchase', {
            id: '5d4c7cb5',
            affiliation: undefined,
            revenue: 99.9,
            tax: 20.99,
            shipping: 13.99,
            coupon: undefined
          }]);
        });

        it('should send full refunded order data', function() {
          analytics.track('refunded order', { orderId: '780bc55' });

          analytics.assert(window.ga.args.length === 4);
          analytics.deepEqual(window.ga.args[2], ['ec:setAction', 'refund', {
            id: '780bc55'
          }]);
          analytics.deepEqual(window.ga.args[3], ['send', 'event', 'EnhancedEcommerce', 'refunded order', { nonInteraction: 1 }]);
        });

        it('should send partial refunded order data', function() {
          analytics.track('refunded order', {
            orderId: '780bc55',
            products: [{
              quantity: 1,
              sku: 'p-298'
            }, {
              quantity: 2,
              sku: 'p-299'
            }]
          });

          analytics.assert(window.ga.args.length === 6);
          analytics.deepEqual(window.ga.args[2], ['ec:addProduct', {
            id: 'p-298',
            quantity: 1
          }]);
          analytics.deepEqual(window.ga.args[3], ['ec:addProduct', {
            id: 'p-299',
            quantity: 2
          }]);
          analytics.deepEqual(window.ga.args[4], ['ec:setAction', 'refund', {
            id: '780bc55'
          }]);
          analytics.deepEqual(window.ga.args[5], ['send', 'event', 'EnhancedEcommerce', 'refunded order', { nonInteraction: 1 }]);
        });
      });
    });
  });

  describe('Classic', function() {
    var settings = {
      anonymizeIp: true,
      classic: true,
      domain: 'auto',
      enhancedLinkAttribution: true,
      ignoredReferrers: ['domain.com', 'www.domain.com'],
      siteSpeedSampleRate: 42,
      trackingId: 'UA-27033709-5'
    };

    beforeEach(function() {
      ga = new GA(settings);
      analytics.add(ga);
    });

    afterEach(function() {
      ga.reset();
    });

    describe('before loading', function() {
      beforeEach(function() {
        analytics.stub(ga, 'load');
      });

      describe('#initialize', function() {
        it('should create window._gaq', function() {
          analytics.assert(!window._gaq);
          analytics.initialize();
          analytics.page();
          analytics.assert(window._gaq instanceof Array);
        });

        it('should push the tracking id', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window._gaq[0], ['_setAccount', settings.trackingId]);
        });

        it('should set allow linker', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window._gaq[1], ['_setAllowLinker', true]);
        });

        it('should set anonymize ip', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window._gaq[2], ['_gat._anonymizeIp']);
        });

        it('should set domain name', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window._gaq[3], ['_setDomainName', settings.domain]);
        });

        it('should set site speed sample rate', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window._gaq[4], ['_setSiteSpeedSampleRate', settings.siteSpeedSampleRate]);
        });

        it('should set enhanced link attribution', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window._gaq[5], ['_require', 'inpage_linkid', 'http://www.google-analytics.com/plugins/ga/inpage_linkid.js']);
        });

        it('should set ignored referrers', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window._gaq[6], ['_addIgnoredRef', settings.ignoredReferrers[0]]);
          analytics.deepEqual(window._gaq[7], ['_addIgnoredRef', settings.ignoredReferrers[1]]);
        });
      });
    });

    describe('loading', function() {
      it('should load', function(done) {
        analytics.load(ga, done);
      });
    });

    describe('after loading', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
        analytics.page();
      });

      describe('#page', function() {
        beforeEach(function() {
          analytics.stub(window._gaq, 'push');
        });

        it('should send a page view', function() {
          analytics.page();
          analytics.called(window._gaq.push, ['_trackPageview', window.location.pathname]);
        });

        it('should send a path', function() {
          analytics.page({ path: '/path' });
          analytics.called(window._gaq.push, ['_trackPageview', '/path']);
        });

        it('should send the query if its included', function() {
          ga.options.includeSearch = true;
          analytics.page({ path: '/path', search: '?q=1' });
          analytics.called(window._gaq.push, ['_trackPageview', '/path?q=1']);
        });

        it('should track a named page', function() {
          analytics.page('Name');
          analytics.called(window._gaq.push, ['_trackEvent', 'All', 'Viewed Name Page', undefined, 0, true]);
        });

        it('should track a named page with a category', function() {
          analytics.page('Category', 'Name');
          analytics.called(window._gaq.push, ['_trackEvent', 'Category', 'Viewed Category Name Page', undefined, 0, true]);
        });

        it('should track a categorized page', function() {
          analytics.page('Category', 'Name');
          analytics.called(window._gaq.push, ['_trackEvent', 'Category', 'Viewed Category Page', undefined, 0, true]);
        });

        it('should not track a named or categorized page when the option is off', function() {
          ga.options.trackNamedPages = false;
          ga.options.trackCategorizedPages = false;
          analytics.page('Name');
          analytics.page('Category', 'Name');
          analytics.calledTwice(window._gaq.push);
        });
      });

      describe('#track', function() {
        beforeEach(function() {
          analytics.stub(window._gaq, 'push');
        });

        it('should send an event', function() {
          analytics.track('event');
          analytics.called(window._gaq.push, ['_trackEvent', 'All', 'event', undefined, 0, false]);
        });

        it('should send a category property', function() {
          analytics.track('event', { category: 'category' });
          analytics.called(window._gaq.push, ['_trackEvent', 'category', 'event', undefined, 0, false]);
        });

        it('should send a stored category', function() {
          analytics.page('category');
          analytics.track('event', { category: 'category' });
          analytics.called(window._gaq.push, ['_trackEvent', 'category', 'event', undefined, 0, false]);
        });

        it('should send a label property', function() {
          analytics.track('event', { label: 'label' });
          analytics.called(window._gaq.push, ['_trackEvent', 'All', 'event', 'label', 0, false]);
        });

        it('should send a rounded value property', function() {
          analytics.track('event', { value: 1.1 });
          analytics.called(window._gaq.push, ['_trackEvent', 'All', 'event', undefined, 1, false]);
        });

        it('should prefer a rounded revenue property', function() {
          analytics.track('event', { revenue: 9.99 });
          analytics.called(window._gaq.push, ['_trackEvent', 'All', 'event', undefined, 10, false]);
        });

        it('should send a non-interaction property', function() {
          analytics.track('event', { nonInteraction: 1 });
          analytics.called(window._gaq.push, ['_trackEvent', 'All', 'event', undefined, 0, true]);
        });

        it('should send a non-interaction option', function() {
          analytics.track('event', {}, { 'Google Analytics': { nonInteraction: 1 } });
          analytics.called(window._gaq.push, ['_trackEvent', 'All', 'event', undefined, 0, true]);
        });
      });

      describe('ecommerce', function() {
        beforeEach(function() {
          analytics.stub(window._gaq, 'push');
        });

        it('should send simple ecommerce data', function() {
          analytics.track('completed order', { orderId: '078781c7' });
          analytics.assert(window._gaq.push.args.length === 3);
          analytics.assert(window._gaq.push.args[0][0][0] === '_addTrans');
          analytics.deepEqual(['_set', 'currencyCode', 'USD'], window._gaq.push.args[1][0]);
          analytics.assert(window._gaq.push.args[2][0][0] === '_trackTrans');
        });

        it('should send ecommerce data', function() {
          analytics.track('completed order', {
            orderId: 'af5ccd73',
            total: 99.99,
            shipping: 13.99,
            tax: 20.99,
            products: [{
              quantity: 1,
              price: 24.75,
              name: 'my product',
              sku: 'p-298'
            }, {
              quantity: 3,
              price: 24.75,
              name: 'other product',
              sku: 'p-299'
            }]
          });

          analytics.deepEqual(window._gaq.push.args[0], [[
            '_addTrans',
            'af5ccd73',
            undefined,
            99.99,
            20.99,
            13.99,
            null,
            null,
            null
          ]]);

          analytics.deepEqual(window._gaq.push.args[1], [[
            '_addItem',
            'af5ccd73',
            'p-298',
            'my product',
            undefined,
            24.75,
            1
          ]]);

          analytics.deepEqual(window._gaq.push.args[2], [[
            '_addItem',
            'af5ccd73',
            'p-299',
            'other product',
            undefined,
            24.75,
            3
          ]]);

          analytics.deepEqual(window._gaq.push.args[3], [[
            '_set',
            'currencyCode',
            'USD'
          ]]);

          analytics.deepEqual(window._gaq.push.args[4], [[
            '_trackTrans'
          ]]);
        });

        it('should fallback to revenue', function() {
          analytics.track('completed order', {
            orderId: 'f2ffee5c',
            revenue: 9,
            shipping: 3,
            tax: 2,
            products: []
          });

          analytics.deepEqual(window._gaq.push.args[0], [[
            '_addTrans',
            'f2ffee5c',
            undefined,
            9,
            2,
            3,
            null,
            null,
            null
          ]]);
        });
      });
    });
  });
});

}, {"analytics.js-core":2,"analytics.js-integration":3,"clear-env":4,"analytics.js-integration-tester":5,"../lib/":6}],
2: [function(require, module, exports) {

/**
 * Analytics.js
 *
 * (C) 2013 Segment.io Inc.
 */

var Analytics = require('./analytics');

/**
 * Expose the `analytics` singleton.
 */

var analytics = module.exports = exports = new Analytics();

/**
 * Expose require
 */

analytics.require = require;

/**
 * Expose `VERSION`.
 */

exports.VERSION = require('../bower.json').version;

}, {"./analytics":7,"../bower.json":8}],
7: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var _analytics = window.analytics;
var Emitter = require('emitter');
var Facade = require('facade');
var after = require('after');
var bind = require('bind');
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
  bind.all(this);

  var self = this;
  this.on('initialize', function(settings, options){
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
  if (!name) throw new TypeError('attempted to add an invalid integration');
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

Analytics.prototype.init = Analytics.prototype.initialize = function(settings, options) {
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
    if (options.initialPageview && integration.options.initialPageview === false) {
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

Analytics.prototype.setAnonymousId = function(id){
  this.user().anonymousId(id);
  return this;
};

/**
 * Add an integration.
 *
 * @param {Integration} integration
 */

Analytics.prototype.add = function(integration){
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
  if (is.fn(options)) fn = options, options = null;
  if (is.fn(traits)) fn = traits, options = null, traits = null;
  if (is.object(id)) options = traits, traits = id, id = user.id();
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
  if (is.fn(options)) fn = options, options = null;
  if (is.fn(traits)) fn = traits, options = null, traits = null;
  if (is.object(id)) options = traits, traits = id, id = group.id();
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
  if (is.fn(options)) fn = options, options = null;
  if (is.fn(properties)) fn = properties, options = null, properties = null;
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

Analytics.prototype.trackClick = Analytics.prototype.trackLink = function(links, event, properties) {
  if (!links) return this;
  // always arrays, handles jquery
  if (is.element(links)) links = [links];

  var self = this;
  each(links, function(el) {
    if (!is.element(el)) throw new TypeError('Must pass HTMLElement to `analytics.trackLink`.');
    on(el, 'click', function(e) {
      var ev = is.fn(event) ? event(el) : event;
      var props = is.fn(properties) ? properties(el) : properties;
      var href = el.getAttribute('href')
        || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
        || el.getAttribute('xlink:href');

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

Analytics.prototype.trackSubmit = Analytics.prototype.trackForm = function(forms, event, properties) {
  if (!forms) return this;
  // always arrays, handles jquery
  if (is.element(forms)) forms = [forms];

  var self = this;
  each(forms, function(el) {
    if (!is.element(el)) throw new TypeError('Must pass HTMLElement to `analytics.trackForm`.');
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

Analytics.prototype.page = function(category, name, properties, options, fn) {
  // Argument reshuffling.
  /* eslint-disable no-unused-expressions, no-sequences */
  if (is.fn(options)) fn = options, options = null;
  if (is.fn(properties)) fn = properties, options = properties = null;
  if (is.fn(name)) fn = name, options = properties = name = null;
  if (is.object(category)) options = name, properties = category, name = category = null;
  if (is.object(name)) options = properties, properties = name, name = null;
  if (is.string(category) && !is.string(name)) name = category, category = null;
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
  if (is.fn(options)) fn = options, options = null;
  if (is.fn(from)) fn = from, options = null, from = null;
  if (is.object(from)) options = from, from = null;
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

Analytics.prototype.debug = function(str){
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

Analytics.prototype.push = function(args){
  var method = args.shift();
  if (!this[method]) return;
  this[method].apply(this, args);
};

/**
 * Reset group and user traits and id's.
 *
 * @api public
 */

Analytics.prototype.reset = function(){
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
    return foldl(function(acc, val, key) {
      if (key.substr(0, length) === prefix) {
        sub = key.substr(length);
        acc[sub] = val;
      }
      return acc;
    }, {}, object);
  }
};

/**
 * Normalize the given `msg`.
 *
 * @param {Object} msg
 * @return {Object}
 */

Analytics.prototype.normalize = function(msg){
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

Analytics.prototype.noConflict = function(){
  window.analytics = _analytics;
  return this;
};

}, {"emitter":9,"facade":10,"after":11,"bind":12,"callback":13,"clone":14,"./cookie":15,"debug":16,"defaults":17,"each":18,"foldl":19,"./group":20,"is":21,"is-meta":22,"object":23,"./memory":24,"./normalize":25,"event":26,"./pageDefaults":27,"pick":28,"prevent":29,"querystring":30,"./store":31,"./user":32}],
9: [function(require, module, exports) {

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
};

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

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
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

Emitter.prototype.once = function(event, fn){
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

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
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

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

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

Emitter.prototype.listeners = function(event){
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

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

}, {"indexof":33}],
33: [function(require, module, exports) {
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
}, {}],
10: [function(require, module, exports) {

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

}, {"./facade":34,"./alias":35,"./group":36,"./identify":37,"./track":38,"./page":39,"./screen":40}],
34: [function(require, module, exports) {

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
 */

function Facade (obj) {
  obj = clone(obj);
  if (!obj.hasOwnProperty('timestamp')) obj.timestamp = new Date();
  else obj.timestamp = newDate(obj.timestamp);
  traverse(obj);
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

Facade.prototype.proxy = function (field) {
  var fields = field.split('.');
  field = fields.shift();

  // Call a function at the beginning to take advantage of facaded fields
  var obj = this[field] || this.field(field);
  if (!obj) return obj;
  if (typeof obj === 'function') obj = obj.call(this) || {};
  if (fields.length === 0) return transform(obj);

  obj = objCase(obj, fields.join('.'));
  return transform(obj);
};

/**
 * Directly access a specific `field` from the underlying object, returning a
 * clone so outsiders don't mess with stuff.
 *
 * @param {String} field
 * @return {Mixed}
 */

Facade.prototype.field = function (field) {
  var obj = this.obj[field];
  return transform(obj);
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

Facade.proxy = function (field) {
  return function () {
    return this.proxy(field);
  };
};

/**
 * Utility method to directly access a `field`.
 *
 * @param {String} field
 * @return {Function}
 */

Facade.field = function (field) {
  return function () {
    return this.field(field);
  };
};

/**
 * Proxy multiple `path`.
 *
 * @param {String} path
 * @return {Array}
 */

Facade.multi = function(path){
  return function(){
    var multi = this.proxy(path + 's');
    if ('array' == type(multi)) return multi;
    var one = this.proxy(path);
    if (one) one = [clone(one)];
    return one || [];
  };
};

/**
 * Proxy one `path`.
 *
 * @param {String} path
 * @return {Mixed}
 */

Facade.one = function(path){
  return function(){
    var one = this.proxy(path);
    if (one) return one;
    var multi = this.proxy(path + 's');
    if ('array' == type(multi)) return multi[0];
  };
};

/**
 * Get the basic json object of this facade.
 *
 * @return {Object}
 */

Facade.prototype.json = function () {
  var ret = clone(this.obj);
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

Facade.prototype.context =
Facade.prototype.options = function (integration) {
  var options = clone(this.obj.options || this.obj.context) || {};
  if (!integration) return clone(options);
  if (!this.enabled(integration)) return;
  var integrations = this.integrations();
  var value = integrations[integration] || objCase(integrations, integration);
  if ('boolean' == typeof value) value = {};
  return value || {};
};

/**
 * Check whether an integration is enabled.
 *
 * @param {String} integration
 * @return {Boolean}
 */

Facade.prototype.enabled = function (integration) {
  var allEnabled = this.proxy('options.providers.all');
  if (typeof allEnabled !== 'boolean') allEnabled = this.proxy('options.all');
  if (typeof allEnabled !== 'boolean') allEnabled = this.proxy('integrations.all');
  if (typeof allEnabled !== 'boolean') allEnabled = true;

  var enabled = allEnabled && isEnabled(integration);
  var options = this.integrations();

  // If the integration is explicitly enabled or disabled, use that
  // First, check options.providers for backwards compatibility
  if (options.providers && options.providers.hasOwnProperty(integration)) {
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

  return enabled ? true : false;
};

/**
 * Get all `integration` options.
 *
 * @param {String} integration
 * @return {Object}
 * @api private
 */

Facade.prototype.integrations = function(){
  return this.obj.integrations
    || this.proxy('options.providers')
    || this.options();
};

/**
 * Check whether the user is active.
 *
 * @return {Boolean}
 */

Facade.prototype.active = function () {
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

Facade.prototype.sessionId =
Facade.prototype.anonymousId = function(){
  return this.field('anonymousId')
    || this.field('sessionId');
};

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

Facade.prototype.traits = function (aliases) {
  var ret = this.proxy('options.traits') || {};
  var id = this.userId();
  aliases = aliases || {};

  if (id) ret.id = id;

  for (var alias in aliases) {
    var value = null == this[alias]
      ? this.proxy('options.traits.' + alias)
      : this[alias]();
    if (null == value) continue;
    ret[aliases[alias]] = value;
    delete ret[alias];
  }

  return ret;
};

/**
 * Add a convenient way to get the library name and version
 */

Facade.prototype.library = function(){
  var library = this.proxy('options.library');
  if (!library) return { name: 'unknown', version: null };
  if (typeof library === 'string') return { name: library, version: null };
  return library;
};

/**
 * Setup some basic proxies.
 */

Facade.prototype.userId = Facade.field('userId');
Facade.prototype.channel = Facade.field('channel');
Facade.prototype.timestamp = Facade.field('timestamp');
Facade.prototype.userAgent = Facade.proxy('options.userAgent');
Facade.prototype.ip = Facade.proxy('options.ip');

/**
 * Return the cloned and traversed object
 *
 * @param {Mixed} obj
 * @return {Mixed}
 */

function transform(obj){
  var cloned = clone(obj);
  return cloned;
}

}, {"isodate-traverse":41,"./is-enabled":42,"./utils":43,"./address":44,"obj-case":45,"new-date":46}],
41: [function(require, module, exports) {

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

function traverse (input, strict) {
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

function object (obj, strict) {
  each(obj, function (key, val) {
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

function array (arr, strict) {
  each(arr, function (val, x) {
    if (is.object(val)) {
      traverse(val, strict);
    } else if (isodate.is(val, strict)) {
      arr[x] = isodate.parse(val);
    }
  });
  return arr;
}

}, {"is":47,"isodate":48,"each":18}],
47: [function(require, module, exports) {

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

for (var i = 0, type; type = types[i]; i++) exports[type] = generate(type);


/**
 * Add alias for `function` for old browsers.
 */

exports.fn = exports['function'];


/**
 * Expose `empty` check.
 */

exports.empty = isEmpty;


/**
 * Expose `nan` check.
 */

exports.nan = function (val) {
  return exports.number(val) && val != val;
};


/**
 * Generate a type checker.
 *
 * @param {String} type
 * @return {Function}
 */

function generate (type) {
  return function (value) {
    return type === typeOf(value);
  };
}
}, {"is-empty":49,"type":50,"component-type":50}],
49: [function(require, module, exports) {

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

function isEmpty (val) {
  if (null == val) return true;
  if ('number' == typeof val) return 0 === val;
  if (undefined !== val.length) return 0 === val.length;
  for (var key in val) if (has.call(val, key)) return false;
  return true;
}
}, {}],
50: [function(require, module, exports) {
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

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};

}, {}],
48: [function(require, module, exports) {

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

exports.parse = function (iso) {
  var numericKeys = [1, 5, 6, 7, 11, 12];
  var arr = matcher.exec(iso);
  var offset = 0;

  // fallback to native parsing
  if (!arr) return new Date(iso);

  // remove undefined values
  for (var i = 0, val; val = numericKeys[i]; i++) {
    arr[val] = parseInt(arr[val], 10) || 0;
  }

  // allow undefined days and months
  arr[2] = parseInt(arr[2], 10) || 1;
  arr[3] = parseInt(arr[3], 10) || 1;

  // month is 0-11
  arr[2]--;

  // allow abitrary sub-second precision
  arr[8] = arr[8]
    ? (arr[8] + '00').substring(0, 3)
    : 0;

  // apply timezone if one exists
  if (arr[4] == ' ') {
    offset = new Date().getTimezoneOffset();
  } else if (arr[9] !== 'Z' && arr[10]) {
    offset = arr[11] * 60 + arr[12];
    if ('+' == arr[10]) offset = 0 - offset;
  }

  var millis = Date.UTC(arr[1], arr[2], arr[3], arr[5], arr[6] + offset, arr[7], arr[8]);
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

exports.is = function (string, strict) {
  if (strict && false === /^\d{4}-\d{2}-\d{2}/.test(string)) return false;
  return matcher.test(string);
};
}, {}],
18: [function(require, module, exports) {

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

module.exports = function(obj, fn){
  switch (type(obj)) {
    case 'array':
      return array(obj, fn);
    case 'object':
      if ('number' == typeof obj.length) return array(obj, fn);
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
}, {"type":50}],
42: [function(require, module, exports) {

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
 * @param {String} integration
 * @return {Boolean}
 */

module.exports = function (integration) {
  return ! disabled[integration];
};
}, {}],
43: [function(require, module, exports) {

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

}, {"inherit":51,"clone":52,"type":50}],
51: [function(require, module, exports) {

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
}, {}],
52: [function(require, module, exports) {
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

function clone(obj){
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

    default: // string, number, boolean, …
      return obj;
  }
}

}, {"component-type":50,"type":50}],
44: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var get = require('obj-case');

/**
 * Add address getters to `proto`.
 *
 * @param {Function} proto
 */

module.exports = function(proto){
  proto.zip = trait('postalCode', 'zip');
  proto.country = trait('country');
  proto.street = trait('street');
  proto.state = trait('state');
  proto.city = trait('city');

  function trait(a, b){
    return function(){
      var traits = this.traits();
      var props = this.properties ? this.properties() : {};

      return get(traits, 'address.' + a)
        || get(traits, a)
        || (b ? get(traits, 'address.' + b) : null)
        || (b ? get(traits, b) : null)
        || get(props, 'address.' + a)
        || get(props, a)
        || (b ? get(props, 'address.' + b) : null)
        || (b ? get(props, b) : null);
    };
  }
};

}, {"obj-case":45}],
45: [function(require, module, exports) {

var identity = function(_){ return _; };


/**
 * Module exports, export
 */

module.exports = multiple(find);
module.exports.find = module.exports;


/**
 * Export the replacement function, return the modified object
 */

module.exports.replace = function (obj, key, val, options) {
  multiple(replace).call(this, obj, key, val, options);
  return obj;
};


/**
 * Export the delete function, return the modified object
 */

module.exports.del = function (obj, key, options) {
  multiple(del).call(this, obj, key, null, options);
  return obj;
};


/**
 * Compose applying the function to a nested key
 */

function multiple (fn) {
  return function (obj, path, val, options) {
    var normalize = options && isFunction(options.normalizer) ? options.normalizer : defaultNormalize;
    path = normalize(path);

    var key;
    var finished = false;

    while (!finished) loop();

    function loop() {
      for (key in obj) {
        var normalizedKey = normalize(key);
        if (0 === path.indexOf(normalizedKey)) {
          var temp = path.substr(normalizedKey.length);
          if (temp.charAt(0) === '.' || temp.length === 0) {
            path = temp.substr(1);
            var child = obj[key];

            // we're at the end and there is nothing.
            if (null == child) {
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
    if (null == obj) return obj;

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

function find (obj, key) {
  if (obj.hasOwnProperty(key)) return obj[key];
}


/**
 * Delete a value for a given key
 *
 * del({ a : 'b', x : 'y' }, 'X' }) -> { a : 'b' }
 */

function del (obj, key) {
  if (obj.hasOwnProperty(key)) delete obj[key];
  return obj;
}


/**
 * Replace an objects existing value with a new one
 *
 * replace({ a : 'b' }, 'a', 'c') -> { a : 'c' }
 */

function replace (obj, key, val) {
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

}, {}],
46: [function(require, module, exports) {

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

module.exports = function newDate (val) {
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

function toMs (num) {
  if (num < 31557600000) return num * 1000;
  return num;
}
}, {"is":53,"isodate":48,"./milliseconds":54,"./seconds":55}],
53: [function(require, module, exports) {

var isEmpty = require('is-empty')
  , typeOf = require('type');


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

for (var i = 0, type; type = types[i]; i++) exports[type] = generate(type);


/**
 * Add alias for `function` for old browsers.
 */

exports.fn = exports['function'];


/**
 * Expose `empty` check.
 */

exports.empty = isEmpty;


/**
 * Expose `nan` check.
 */

exports.nan = function (val) {
  return exports.number(val) && val != val;
};


/**
 * Generate a type checker.
 *
 * @param {String} type
 * @return {Function}
 */

function generate (type) {
  return function (value) {
    return type === typeOf(value);
  };
}
}, {"is-empty":49,"type":50}],
54: [function(require, module, exports) {

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

exports.is = function (string) {
  return matcher.test(string);
};


/**
 * Convert a millisecond string to a date.
 *
 * @param {String} millis
 * @return {Date}
 */

exports.parse = function (millis) {
  millis = parseInt(millis, 10);
  return new Date(millis);
};
}, {}],
55: [function(require, module, exports) {

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

exports.is = function (string) {
  return matcher.test(string);
};


/**
 * Convert a second string to a date.
 *
 * @param {String} seconds
 * @return {Date}
 */

exports.parse = function (seconds) {
  var millis = parseInt(seconds, 10) * 1000;
  return new Date(millis);
};
}, {}],
35: [function(require, module, exports) {

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
 */

function Alias (dictionary) {
  Facade.call(this, dictionary);
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

Alias.prototype.type =
Alias.prototype.action = function () {
  return 'alias';
};

/**
 * Get `previousId`.
 *
 * @return {Mixed}
 * @api public
 */

Alias.prototype.from =
Alias.prototype.previousId = function(){
  return this.field('previousId')
    || this.field('from');
};

/**
 * Get `userId`.
 *
 * @return {String}
 * @api public
 */

Alias.prototype.to =
Alias.prototype.userId = function(){
  return this.field('userId')
    || this.field('to');
};

}, {"./utils":43,"./facade":34}],
36: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var inherit = require('./utils').inherit;
var address = require('./address');
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
 */

function Group (dictionary) {
  Facade.call(this, dictionary);
}

/**
 * Inherit from `Facade`
 */

inherit(Group, Facade);

/**
 * Get the facade's action.
 */

Group.prototype.type =
Group.prototype.action = function () {
  return 'group';
};

/**
 * Setup some basic proxies.
 */

Group.prototype.groupId = Facade.field('groupId');

/**
 * Get created or createdAt.
 *
 * @return {Date}
 */

Group.prototype.created = function(){
  var created = this.proxy('traits.createdAt')
    || this.proxy('traits.created')
    || this.proxy('properties.createdAt')
    || this.proxy('properties.created');

  if (created) return newDate(created);
};

/**
 * Get the group's email, falling back to the group ID if it's a valid email.
 *
 * @return {String}
 */

Group.prototype.email = function () {
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

Group.prototype.traits = function (aliases) {
  var ret = this.properties();
  var id = this.groupId();
  aliases = aliases || {};

  if (id) ret.id = id;

  for (var alias in aliases) {
    var value = null == this[alias]
      ? this.proxy('traits.' + alias)
      : this[alias]();
    if (null == value) continue;
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

Group.prototype.properties = function(){
  return this.field('traits')
    || this.field('properties')
    || {};
};

}, {"./utils":43,"./address":44,"is-email":56,"new-date":46,"./facade":34}],
56: [function(require, module, exports) {

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

function isEmail (string) {
  return matcher.test(string);
}
}, {}],
37: [function(require, module, exports) {

var address = require('./address');
var Facade = require('./facade');
var isEmail = require('is-email');
var newDate = require('new-date');
var utils = require('./utils');
var get = require('obj-case');
var trim = require('trim');
var inherit = utils.inherit;
var clone = utils.clone;
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
 */

function Identify (dictionary) {
  Facade.call(this, dictionary);
}

/**
 * Inherit from `Facade`.
 */

inherit(Identify, Facade);

/**
 * Get the facade's action.
 */

Identify.prototype.type =
Identify.prototype.action = function () {
  return 'identify';
};

/**
 * Get the user's traits.
 *
 * @param {Object} aliases
 * @return {Object}
 */

Identify.prototype.traits = function (aliases) {
  var ret = this.field('traits') || {};
  var id = this.userId();
  aliases = aliases || {};

  if (id) ret.id = id;

  for (var alias in aliases) {
    var value = null == this[alias]
      ? this.proxy('traits.' + alias)
      : this[alias]();
    if (null == value) continue;
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

Identify.prototype.email = function () {
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

Identify.prototype.created = function () {
  var created = this.proxy('traits.created') || this.proxy('traits.createdAt');
  if (created) return newDate(created);
};

/**
 * Get the company created date.
 *
 * @return {Date or undefined}
 */

Identify.prototype.companyCreated = function(){
  var created = this.proxy('traits.company.created')
    || this.proxy('traits.company.createdAt');

  if (created) return newDate(created);
};

/**
 * Get the user's name, optionally combining a first and last name if that's all
 * that was provided.
 *
 * @return {String or Undefined}
 */

Identify.prototype.name = function () {
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
 * @return {String or Undefined}
 */

Identify.prototype.firstName = function () {
  var firstName = this.proxy('traits.firstName');
  if (typeof firstName === 'string') return trim(firstName);

  var name = this.proxy('traits.name');
  if (typeof name === 'string') return trim(name).split(' ')[0];
};

/**
 * Get the user's last name, optionally splitting it out of a single name if
 * that's all that was provided.
 *
 * @return {String or Undefined}
 */

Identify.prototype.lastName = function () {
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

Identify.prototype.uid = function(){
  return this.userId()
    || this.username()
    || this.email();
};

/**
 * Get description.
 *
 * @return {String}
 */

Identify.prototype.description = function(){
  return this.proxy('traits.description')
    || this.proxy('traits.background');
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

Identify.prototype.age = function(){
  var date = this.birthday();
  var age = get(this.traits(), 'age');
  if (null != age) return age;
  if ('date' != type(date)) return;
  var now = new Date;
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

Identify.prototype.avatar = function(){
  var traits = this.traits();
  return get(traits, 'avatar')
    || get(traits, 'photoUrl')
    || get(traits, 'avatarUrl');
};

/**
 * Get the position.
 *
 * .jobTitle needed because some integrations use it.
 *
 * @return {Mixed}
 */

Identify.prototype.position = function(){
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

}, {"./address":44,"./facade":34,"is-email":56,"new-date":46,"./utils":43,"obj-case":45,"trim":57}],
57: [function(require, module, exports) {

exports = module.exports = trim;

function trim(str){
  if (str.trim) return str.trim();
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  if (str.trimLeft) return str.trimLeft();
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  if (str.trimRight) return str.trimRight();
  return str.replace(/\s*$/, '');
};

}, {}],
38: [function(require, module, exports) {

var inherit = require('./utils').inherit;
var clone = require('./utils').clone;
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
 *   @property {String} event
 *   @property {String} userId
 *   @property {String} sessionId
 *   @property {Object} properties
 *   @property {Object} options
 */

function Track (dictionary) {
  Facade.call(this, dictionary);
}

/**
 * Inherit from `Facade`.
 */

inherit(Track, Facade);

/**
 * Return the facade's action.
 *
 * @return {String}
 */

Track.prototype.type =
Track.prototype.action = function () {
  return 'track';
};

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
 * @return {String}
 * @api public
 */

Track.prototype.orderId = function(){
  return this.proxy('properties.id')
    || this.proxy('properties.orderId');
};

/**
 * Get subtotal.
 *
 * @return {Number}
 */

Track.prototype.subtotal = function(){
  var subtotal = get(this.properties(), 'subtotal');
  var total = this.total();
  var n;

  if (subtotal) return subtotal;
  if (!total) return 0;
  if (n = this.tax()) total -= n;
  if (n = this.shipping()) total -= n;
  if (n = this.discount()) total += n;

  return total;
};

/**
 * Get products.
 *
 * @return {Array}
 */

Track.prototype.products = function(){
  var props = this.properties();
  var products = get(props, 'products');
  return 'array' == type(products)
    ? products
    : [];
};

/**
 * Get quantity.
 *
 * @return {Number}
 */

Track.prototype.quantity = function(){
  var props = this.obj.properties || {};
  return props.quantity || 1;
};

/**
 * Get currency.
 *
 * @return {String}
 */

Track.prototype.currency = function(){
  var props = this.obj.properties || {};
  return props.currency || 'USD';
};

/**
 * BACKWARDS COMPATIBILITY: should probably re-examine where these come from.
 */

Track.prototype.referrer = Facade.proxy('properties.referrer');
Track.prototype.query = Facade.proxy('options.query');

/**
 * Get the call's properties.
 *
 * @param {Object} aliases
 * @return {Object}
 */

Track.prototype.properties = function (aliases) {
  var ret = this.field('properties') || {};
  aliases = aliases || {};

  for (var alias in aliases) {
    var value = null == this[alias]
      ? this.proxy('properties.' + alias)
      : this[alias]();
    if (null == value) continue;
    ret[aliases[alias]] = value;
    delete ret[alias];
  }

  return ret;
};

/**
 * Get the call's username.
 *
 * @return {String or Undefined}
 */

Track.prototype.username = function () {
  return this.proxy('traits.username') ||
         this.proxy('properties.username') ||
         this.userId() ||
         this.sessionId();
};

/**
 * Get the call's email, using an the user ID if it's a valid email.
 *
 * @return {String or Undefined}
 */

Track.prototype.email = function () {
  var email = this.proxy('traits.email');
  email = email || this.proxy('properties.email');
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
 * @return {Number}
 */

Track.prototype.revenue = function () {
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
 * @return {Number}
 */

Track.prototype.cents = function(){
  var revenue = this.revenue();
  return 'number' != typeof revenue
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

Track.prototype.identify = function () {
  var json = this.json();
  json.traits = this.traits();
  return new Identify(json);
};

/**
 * Get float from currency value.
 *
 * @param {Mixed} val
 * @return {Number}
 */

function currency(val) {
  if (!val) return;
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return;

  val = val.replace(/\$/g, '');
  val = parseFloat(val);

  if (!isNaN(val)) return val;
}

}, {"./utils":43,"./facade":34,"./identify":37,"is-email":56,"obj-case":45}],
39: [function(require, module, exports) {

var inherit = require('./utils').inherit;
var Facade = require('./facade');
var Track = require('./track');

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
 */

function Page(dictionary){
  Facade.call(this, dictionary);
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

Page.prototype.type =
Page.prototype.action = function(){
  return 'page';
};

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

Page.prototype.referrer = function(){
  return this.proxy('properties.referrer')
    || this.proxy('context.referrer.url');
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
    var value = null == this[alias]
      ? this.proxy('properties.' + alias)
      : this[alias]();
    if (null == value) continue;
    props[aliases[alias]] = value;
    if (alias !== aliases[alias]) delete props[alias];
  }

  return props;
};

/**
 * Get the page fullName.
 *
 * @return {String}
 */

Page.prototype.fullName = function(){
  var category = this.category();
  var name = this.name();
  return name && category
    ? category + ' ' + name
    : name;
};

/**
 * Get event with `name`.
 *
 * @return {String}
 */

Page.prototype.event = function(name){
  return name
    ? 'Viewed ' + name + ' Page'
    : 'Loaded a Page';
};

/**
 * Convert this Page to a Track facade with `name`.
 *
 * @param {String} name
 * @return {Track}
 */

Page.prototype.track = function(name){
  var props = this.properties();
  return new Track({
    event: this.event(name),
    timestamp: this.timestamp(),
    context: this.context(),
    properties: props
  });
};

}, {"./utils":43,"./facade":34,"./track":38}],
40: [function(require, module, exports) {

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
 *   @param {String} category
 *   @param {String} name
 *   @param {Object} traits
 *   @param {Object} options
 */

function Screen(dictionary){
  Page.call(this, dictionary);
}

/**
 * Inherit from `Page`
 */

inherit(Screen, Page);

/**
 * Get the facade's action.
 *
 * @return {String}
 * @api public
 */

Screen.prototype.type =
Screen.prototype.action = function(){
  return 'screen';
};

/**
 * Get event with `name`.
 *
 * @param {String} name
 * @return {String}
 * @api public
 */

Screen.prototype.event = function(name){
  return name
    ? 'Viewed ' + name + ' Screen'
    : 'Loaded a Screen';
};

/**
 * Convert this Screen.
 *
 * @param {String} name
 * @return {Track}
 * @api public
 */

Screen.prototype.track = function(name){
  var props = this.properties();
  return new Track({
    event: this.event(name),
    timestamp: this.timestamp(),
    context: this.context(),
    properties: props
  });
};

}, {"./utils":43,"./page":39,"./track":38}],
11: [function(require, module, exports) {

module.exports = function after (times, func) {
  // After 0, really?
  if (times <= 0) return func();

  // That's more like it.
  return function() {
    if (--times < 1) {
      return func.apply(this, arguments);
    }
  };
};
}, {}],
12: [function(require, module, exports) {

try {
  var bind = require('bind');
} catch (e) {
  var bind = require('bind-component');
}

var bindAll = require('bind-all');


/**
 * Expose `bind`.
 */

module.exports = exports = bind;


/**
 * Expose `bindAll`.
 */

exports.all = bindAll;


/**
 * Expose `bindMethods`.
 */

exports.methods = bindMethods;


/**
 * Bind `methods` on `obj` to always be called with the `obj` as context.
 *
 * @param {Object} obj
 * @param {String} methods...
 */

function bindMethods (obj, methods) {
  methods = [].slice.call(arguments, 1);
  for (var i = 0, method; method = methods[i]; i++) {
    obj[method] = bind(obj, obj[method]);
  }
  return obj;
}
}, {"bind":58,"bind-all":59}],
58: [function(require, module, exports) {
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

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

}, {}],
59: [function(require, module, exports) {

try {
  var bind = require('bind');
  var type = require('type');
} catch (e) {
  var bind = require('bind-component');
  var type = require('type-component');
}

module.exports = function (obj) {
  for (var key in obj) {
    var val = obj[key];
    if (type(val) === 'function') obj[key] = bind(obj, obj[key]);
  }
  return obj;
};
}, {"bind":58,"type":50}],
13: [function(require, module, exports) {
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

function callback (fn) {
  if ('function' === typeof fn) fn();
}


/**
 * Call an `fn` back asynchronously if it exists. If `wait` is ommitted, the
 * `fn` will be called on next tick.
 *
 * @param {Function} fn
 * @param {Number} wait (optional)
 */

callback.async = function (fn, wait) {
  if ('function' !== typeof fn) return;
  if (!wait) return next(fn);
  setTimeout(fn, wait);
};


/**
 * Symmetry.
 */

callback.sync = callback;

}, {"next-tick":60}],
60: [function(require, module, exports) {
"use strict"

if (typeof setImmediate == 'function') {
  module.exports = function(f){ setImmediate(f) }
}
// legacy node.js
else if (typeof process != 'undefined' && typeof process.nextTick == 'function') {
  module.exports = process.nextTick
}
// fallback for other environments / postMessage behaves badly on IE8
else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
  module.exports = function(f){ setTimeout(f) };
} else {
  var q = [];

  window.addEventListener('message', function(){
    var i = 0;
    while (i < q.length) {
      try { q[i++](); }
      catch (e) {
        q = q.slice(i);
        window.postMessage('tic!', '*');
        throw e;
      }
    }
    q.length = 0;
  }, true);

  module.exports = function(fn){
    if (!q.length) window.postMessage('tic!', '*');
    q.push(fn);
  }
}

}, {}],
14: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var type;

try {
  type = require('type');
} catch(e){
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

function clone(obj){
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

    default: // string, number, boolean, …
      return obj;
  }
}

}, {"type":50}],
15: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var bind = require('bind');
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

module.exports = bind.all(new Cookie());


/**
 * Expose the `Cookie` constructor.
 */

module.exports.Cookie = Cookie;

}, {"bind":12,"clone":14,"cookie":61,"debug":16,"defaults":17,"json":62,"top-domain":63}],
61: [function(require, module, exports) {

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

module.exports = function(name, value, options){
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

  if (null == value) options.maxage = -1;

  if (options.maxage) {
    options.expires = new Date(+new Date + options.maxage);
  }

  if (options.path) str += '; path=' + options.path;
  if (options.domain) str += '; domain=' + options.domain;
  if (options.expires) str += '; expires=' + options.expires.toUTCString();
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
  if ('' == pairs[0]) return obj;
  for (var i = 0; i < pairs.length; ++i) {
    pair = pairs[i].split('=');
    obj[decode(pair[0])] = decode(pair[1]);
  }
  return obj;
}

/**
 * Encode.
 */

function encode(value){
  try {
    return encodeURIComponent(value);
  } catch (e) {
    debug('error `encode(%o)` - %o', value, e)
  }
}

/**
 * Decode.
 */

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    debug('error `decode(%o)` - %o', value, e)
  }
}

}, {"debug":16}],
16: [function(require, module, exports) {
if ('undefined' == typeof window) {
  module.exports = require('./lib/debug');
} else {
  module.exports = require('./debug');
}

}, {"./lib/debug":64,"./debug":65}],
64: [function(require, module, exports) {
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

var names = []
  , skips = [];

(process.env.DEBUG || '')
  .split(/[\s,]+/)
  .forEach(function(name){
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
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
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
  function disabled(){}
  disabled.enabled = false;

  var match = skips.some(function(re){
    return re.test(name);
  });

  if (match) return disabled;

  match = names.some(function(re){
    return re.test(name);
  });

  if (!match) return disabled;
  var c = color();

  function colored(fmt) {
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (prev[name] || curr);
    prev[name] = curr;

    fmt = '  \u001b[9' + c + 'm' + name + ' '
      + '\u001b[3' + c + 'm\u001b[90m'
      + fmt + '\u001b[3' + c + 'm'
      + ' +' + humanize(ms) + '\u001b[0m';

    console.error.apply(this, arguments);
  }

  function plain(fmt) {
    fmt = coerce(fmt);

    fmt = new Date().toUTCString()
      + ' ' + name + ' ' + fmt;
    console.error.apply(this, arguments);
  }

  colored.enabled = plain.enabled = true;

  return isatty || process.env.DEBUG_COLORS
    ? colored
    : plain;
}

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

}, {}],
65: [function(require, module, exports) {

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
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
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
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
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
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
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
} catch(e){}

}, {}],
17: [function(require, module, exports) {
'use strict';

/**
 * Merge default values.
 *
 * @param {Object} dest
 * @param {Object} defaults
 * @return {Object}
 * @api public
 */
var defaults = function (dest, src, recursive) {
  for (var prop in src) {
    if (recursive && dest[prop] instanceof Object && src[prop] instanceof Object) {
      dest[prop] = defaults(dest[prop], src[prop], true);
    } else if (! (prop in dest)) {
      dest[prop] = src[prop];
    }
  }

  return dest;
};

/**
 * Expose `defaults`.
 */
module.exports = defaults;

}, {}],
62: [function(require, module, exports) {

var json = window.JSON || {};
var stringify = json.stringify;
var parse = json.parse;

module.exports = parse && stringify
  ? JSON
  : require('json-fallback');

}, {"json-fallback":66}],
66: [function(require, module, exports) {
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

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

(function () {
    'use strict';

    var JSON = module.exports = {};

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function () {
                return this.valueOf();
            };
    }

    var cx,
        escapable,
        gap,
        indent,
        meta,
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
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

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
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

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        };
        JSON.stringify = function (value, replacer, space) {

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
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
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
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
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

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

}, {}],
63: [function(require, module, exports) {

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

function domain(url){
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
      return domain
    }
  }

  return '';
};

/**
 * Levels returns all levels of the given url.
 *
 * @param {String} url
 * @return {Array}
 * @api public
 */

domain.levels = function(url){
  var host = parse(url).hostname;
  var parts = host.split('.');
  var last = parts[parts.length-1];
  var levels = [];

  // Ip address.
  if (4 == parts.length && parseInt(last, 10) == last) {
    return levels;
  }

  // Localhost.
  if (1 >= parts.length) {
    return levels;
  }

  // Create levels.
  for (var i = parts.length-2; 0 <= i; --i) {
    levels.push(parts.slice(i).join('.'));
  }

  return levels;
};

}, {"url":67,"cookie":68}],
67: [function(require, module, exports) {

/**
 * Parse the given `url`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(url){
  var a = document.createElement('a');
  a.href = url;
  return {
    href: a.href,
    host: a.host || location.host,
    port: ('0' === a.port || '' === a.port) ? port(a.protocol) : a.port,
    hash: a.hash,
    hostname: a.hostname || location.hostname,
    pathname: a.pathname.charAt(0) != '/' ? '/' + a.pathname : a.pathname,
    protocol: !a.protocol || ':' == a.protocol ? location.protocol : a.protocol,
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

exports.isAbsolute = function(url){
  return 0 == url.indexOf('//') || !!~url.indexOf('://');
};

/**
 * Check if `url` is relative.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isRelative = function(url){
  return !exports.isAbsolute(url);
};

/**
 * Check if `url` is cross domain.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isCrossDomain = function(url){
  url = exports.parse(url);
  var location = exports.parse(window.location.href);
  return url.hostname !== location.hostname
    || url.port !== location.port
    || url.protocol !== location.protocol;
};

/**
 * Return default port for `protocol`.
 *
 * @param  {String} protocol
 * @return {String}
 * @api private
 */
function port (protocol){
  switch (protocol) {
    case 'http:':
      return 80;
    case 'https:':
      return 443;
    default:
      return location.port;
  }
}

}, {}],
68: [function(require, module, exports) {

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

module.exports = function(name, value, options){
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

  if (null == value) options.maxage = -1;

  if (options.maxage) {
    options.expires = new Date(+new Date + options.maxage);
  }

  if (options.path) str += '; path=' + options.path;
  if (options.domain) str += '; domain=' + options.domain;
  if (options.expires) str += '; expires=' + options.expires.toUTCString();
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
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
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
  if ('' == pairs[0]) return obj;
  for (var i = 0; i < pairs.length; ++i) {
    pair = pairs[i].split('=');
    obj[decode(pair[0])] = decode(pair[1]);
  }
  return obj;
}

/**
 * Encode.
 */

function encode(value){
  try {
    return encodeURIComponent(value);
  } catch (e) {
    debug('error `encode(%o)` - %o', value, e)
  }
}

/**
 * Decode.
 */

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    debug('error `decode(%o)` - %o', value, e)
  }
}

}, {"debug":16}],
19: [function(require, module, exports) {
'use strict';

/**
 * Module dependencies.
 */

// XXX: Hacky fix for Duo not supporting scoped modules
var each; try { each = require('@ndhoule/each'); } catch(e) { each = require('each'); }

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
    throw new TypeError('Expected a function but received a ' + typeof iterator);
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

}, {"each":69}],
69: [function(require, module, exports) {
'use strict';

/**
 * Module dependencies.
 */

// XXX: Hacky fix for Duo not supporting scoped modules
var keys; try { keys = require('@ndhoule/keys'); } catch(e) { keys = require('keys'); }

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
  return type === 'number' || (type === 'object' && objToString.call(val) === '[object Number]');
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
var isArray = typeof Array.isArray === 'function' ? Array.isArray : function isArray(val) {
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
  return val != null && (isArray(val) || (val !== 'function' && isNumber(val.length)));
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
  return (isArrayLike(collection) ? arrayEach : baseEach).call(this, iterator, collection);
};

/**
 * Exports.
 */

module.exports = each;

}, {"keys":70}],
70: [function(require, module, exports) {
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
  return val != null && (typeof val !== 'function' && typeof val.length === 'number');
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

}, {}],
20: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var Entity = require('./entity');
var bind = require('bind');
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

module.exports = bind.all(new Group());


/**
 * Expose the `Group` constructor.
 */

module.exports.Group = Group;

}, {"./entity":71,"bind":12,"debug":16,"inherit":72}],
71: [function(require, module, exports) {

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
  debug('warning using memory store both cookies and localStorage are disabled');
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
    case 0: return this._getId();
    case 1: return this._setId(id);
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

Entity.prototype.properties = Entity.prototype.traits = function(traits) {
  switch (arguments.length) {
    case 0: return this._getTraits();
    case 1: return this._setTraits(traits);
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
  var ret = this._options.persist ? store.get(this._options.localStorage.key) : this._traits;
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
  if (current === null || current === id) traits = extend(this.traits(), traits);
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


}, {"clone":14,"./cookie":15,"debug":16,"defaults":17,"extend":73,"./memory":24,"./store":31,"isodate-traverse":41}],
73: [function(require, module, exports) {

module.exports = function extend (object) {
    // Takes an unlimited number of extenders.
    var args = Array.prototype.slice.call(arguments, 1);

    // For each extender, copy their properties on our object.
    for (var i = 0, source; source = args[i]; i++) {
        if (!source) continue;
        for (var property in source) {
            object[property] = source[property];
        }
    }

    return object;
};
}, {}],
24: [function(require, module, exports) {
/* eslint consistent-return:1 */

/**
 * Module Dependencies.
 */

var bind = require('bind');
var clone = require('clone');

/**
 * HOP.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Expose `Memory`
 */

module.exports = bind.all(new Memory());

/**
 * Initialize `Memory` store
 */

function Memory(){
  this.store = {};
}

/**
 * Set a `key` and `value`.
 *
 * @param {String} key
 * @param {Mixed} value
 * @return {Boolean}
 */

Memory.prototype.set = function(key, value){
  this.store[key] = clone(value);
  return true;
};

/**
 * Get a `key`.
 *
 * @param {String} key
 */

Memory.prototype.get = function(key){
  if (!has.call(this.store, key)) return;
  return clone(this.store[key]);
};

/**
 * Remove a `key`.
 *
 * @param {String} key
 * @return {Boolean}
 */

Memory.prototype.remove = function(key){
  delete this.store[key];
  return true;
};

}, {"bind":12,"clone":14}],
31: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var bind = require('bind');
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

module.exports = bind.all(new Store());


/**
 * Expose the `Store` constructor.
 */

module.exports.Store = Store;

}, {"bind":12,"defaults":17,"store.js":74}],
74: [function(require, module, exports) {
var json             = require('json')
  , store            = {}
  , win              = window
	,	doc              = win.document
	,	localStorageName = 'localStorage'
	,	namespace        = '__storejs__'
	,	storage;

store.disabled = false
store.set = function(key, value) {}
store.get = function(key) {}
store.remove = function(key) {}
store.clear = function() {}
store.transact = function(key, defaultVal, transactionFn) {
	var val = store.get(key)
	if (transactionFn == null) {
		transactionFn = defaultVal
		defaultVal = null
	}
	if (typeof val == 'undefined') { val = defaultVal || {} }
	transactionFn(val)
	store.set(key, val)
}
store.getAll = function() {}

store.serialize = function(value) {
	return json.stringify(value)
}
store.deserialize = function(value) {
	if (typeof value != 'string') { return undefined }
	try { return json.parse(value) }
	catch(e) { return value || undefined }
}

// Functions to encapsulate questionable FireFox 3.6.13 behavior
// when about.config::dom.storage.enabled === false
// See https://github.com/marcuswestin/store.js/issues#issue/13
function isLocalStorageNameSupported() {
	try { return (localStorageName in win && win[localStorageName]) }
	catch(err) { return false }
}

if (isLocalStorageNameSupported()) {
	storage = win[localStorageName]
	store.set = function(key, val) {
		if (val === undefined) { return store.remove(key) }
		storage.setItem(key, store.serialize(val))
		return val
	}
	store.get = function(key) { return store.deserialize(storage.getItem(key)) }
	store.remove = function(key) { storage.removeItem(key) }
	store.clear = function() { storage.clear() }
	store.getAll = function() {
		var ret = {}
		for (var i=0; i<storage.length; ++i) {
			var key = storage.key(i)
			ret[key] = store.get(key)
		}
		return ret
	}
} else if (doc.documentElement.addBehavior) {
	var storageOwner,
		storageContainer
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
		storageContainer = new ActiveXObject('htmlfile')
		storageContainer.open()
		storageContainer.write('<s' + 'cript>document.w=window</s' + 'cript><iframe src="/favicon.ico"></iframe>')
		storageContainer.close()
		storageOwner = storageContainer.w.frames[0].document
		storage = storageOwner.createElement('div')
	} catch(e) {
		// somehow ActiveXObject instantiation failed (perhaps some special
		// security settings or otherwse), fall back to per-path storage
		storage = doc.createElement('div')
		storageOwner = doc.body
	}
	function withIEStorage(storeFunction) {
		return function() {
			var args = Array.prototype.slice.call(arguments, 0)
			args.unshift(storage)
			// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
			// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
			storageOwner.appendChild(storage)
			storage.addBehavior('#default#userData')
			storage.load(localStorageName)
			var result = storeFunction.apply(store, args)
			storageOwner.removeChild(storage)
			return result
		}
	}

	// In IE7, keys may not contain special chars. See all of https://github.com/marcuswestin/store.js/issues/40
	var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
	function ieKeyFix(key) {
		return key.replace(forbiddenCharsRegex, '___')
	}
	store.set = withIEStorage(function(storage, key, val) {
		key = ieKeyFix(key)
		if (val === undefined) { return store.remove(key) }
		storage.setAttribute(key, store.serialize(val))
		storage.save(localStorageName)
		return val
	})
	store.get = withIEStorage(function(storage, key) {
		key = ieKeyFix(key)
		return store.deserialize(storage.getAttribute(key))
	})
	store.remove = withIEStorage(function(storage, key) {
		key = ieKeyFix(key)
		storage.removeAttribute(key)
		storage.save(localStorageName)
	})
	store.clear = withIEStorage(function(storage) {
		var attributes = storage.XMLDocument.documentElement.attributes
		storage.load(localStorageName)
		for (var i=0, attr; attr=attributes[i]; i++) {
			storage.removeAttribute(attr.name)
		}
		storage.save(localStorageName)
	})
	store.getAll = withIEStorage(function(storage) {
		var attributes = storage.XMLDocument.documentElement.attributes
		var ret = {}
		for (var i=0, attr; attr=attributes[i]; ++i) {
			var key = ieKeyFix(attr.name)
			ret[attr.name] = store.deserialize(storage.getAttribute(key))
		}
		return ret
	})
}

try {
	store.set(namespace, namespace)
	if (store.get(namespace) != namespace) { store.disabled = true }
	store.remove(namespace)
} catch(e) {
	store.disabled = true
}
store.enabled = !store.disabled

module.exports = store;
}, {"json":62}],
72: [function(require, module, exports) {

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
}, {}],
21: [function(require, module, exports) {

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

for (var i = 0, type; type = types[i]; i++) exports[type] = generate(type);


/**
 * Add alias for `function` for old browsers.
 */

exports.fn = exports['function'];


/**
 * Expose `empty` check.
 */

exports.empty = isEmpty;


/**
 * Expose `nan` check.
 */

exports.nan = function (val) {
  return exports.number(val) && val != val;
};


/**
 * Generate a type checker.
 *
 * @param {String} type
 * @return {Function}
 */

function generate (type) {
  return function (value) {
    return type === typeOf(value);
  };
}
}, {"is-empty":49,"type":50,"component-type":50}],
22: [function(require, module, exports) {
module.exports = function isMeta (e) {
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return true;

    // Logic that handles checks for the middle mouse button, based
    // on [jQuery](https://github.com/jquery/jquery/blob/master/src/event.js#L466).
    var which = e.which, button = e.button;
    if (!which && button !== undefined) {
      return (!button & 1) && (!button & 2) && (button & 4);
    } else if (which === 2) {
      return true;
    }

    return false;
};
}, {}],
23: [function(require, module, exports) {

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

exports.keys = Object.keys || function(obj){
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

exports.values = function(obj){
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

exports.merge = function(a, b){
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

exports.length = function(obj){
  return exports.keys(obj).length;
};

/**
 * Check if `obj` is empty.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api public
 */

exports.isEmpty = function(obj){
  return 0 == exports.length(obj);
};
}, {}],
25: [function(require, module, exports) {

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

var toplevel = [
  'integrations',
  'anonymousId',
  'timestamp',
  'context'
];

/**
 * Normalize `msg` based on integrations `list`.
 *
 * @param {Object} msg
 * @param {Array} list
 * @return {Function}
 */

function normalize(msg, list){
  var lower = map(list, function(s){ return s.toLowerCase(); });
  var opts = msg.options || {};
  var integrations = opts.integrations || {};
  var providers = opts.providers || {};
  var context = opts.context || {};
  var ret = {};
  debug('<-', msg);

  // integrations.
  each(opts, function(key, value){
    if (!integration(key)) return;
    if (!has.call(integrations, key)) integrations[key] = value;
    delete opts[key];
  });

  // providers.
  delete opts.providers;
  each(providers, function(key, value){
    if (!integration(key)) return;
    if (is.object(integrations[key])) return;
    if (has.call(integrations, key) && typeof providers[key] === 'boolean') return;
    integrations[key] = value;
  });

  // move all toplevel options to msg
  // and the rest to context.
  each(opts, function(key){
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

  function integration(name){
    return !!(includes(name, list) || name.toLowerCase() === 'all' || includes(name.toLowerCase(), lower));
  }
}

}, {"debug":16,"defaults":17,"each":18,"includes":75,"is":21,"component/map":76}],
75: [function(require, module, exports) {
'use strict';

/**
 * Module dependencies.
 */

// XXX: Hacky fix for duo not supporting scoped npm packages
var each; try { each = require('@ndhoule/each'); } catch(e) { each = require('each'); }

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

}, {"each":69}],
76: [function(require, module, exports) {

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

module.exports = function(arr, fn){
  var ret = [];
  fn = toFunction(fn);
  for (var i = 0; i < arr.length; ++i) {
    ret.push(fn(arr[i], i));
  }
  return ret;
};
}, {"to-function":77}],
77: [function(require, module, exports) {

/**
 * Module Dependencies
 */

var expr;
try {
  expr = require('props');
} catch(e) {
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
  return function(obj){
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
  return function(obj){
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
    match[key] = typeof obj[key] === 'string'
      ? defaultToFunction(obj[key])
      : toFunction(obj[key]);
  }
  return function(val){
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

  var val, i, prop;
  for (i = 0; i < props.length; i++) {
    prop = props[i];
    val = '_.' + prop;
    val = "('function' == typeof " + val + " ? " + val + "() : " + val + ")";

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

function stripNested (prop, str, val) {
  return str.replace(new RegExp('(\\.)?' + prop, 'g'), function($0, $1) {
    return $1 ? $0 : val;
  });
}

}, {"props":78,"component-props":78}],
78: [function(require, module, exports) {
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

module.exports = function(str, fn){
  var p = unique(props(str));
  if (fn && 'string' == typeof fn) fn = prefixed(fn);
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
  return str
    .replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
    .replace(globals, '')
    .match(/[$a-zA-Z_]\w*/g)
    || [];
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
  return str.replace(re, function(_){
    if ('(' == _[_.length - 1]) return fn(_);
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
  return function(_){
    return str + _;
  };
}

}, {}],
26: [function(require, module, exports) {

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

exports.bind = function(el, type, fn, capture){
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

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture || false);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

}, {}],
27: [function(require, module, exports) {

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

}, {"canonical":79,"includes":75,"url":80}],
79: [function(require, module, exports) {
module.exports = function canonical () {
  var tags = document.getElementsByTagName('link');
  for (var i = 0, tag; tag = tags[i]; i++) {
    if ('canonical' == tag.getAttribute('rel')) return tag.getAttribute('href');
  }
};
}, {}],
80: [function(require, module, exports) {

/**
 * Parse the given `url`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(url){
  var a = document.createElement('a');
  a.href = url;
  return {
    href: a.href,
    host: a.host || location.host,
    port: ('0' === a.port || '' === a.port) ? port(a.protocol) : a.port,
    hash: a.hash,
    hostname: a.hostname || location.hostname,
    pathname: a.pathname.charAt(0) != '/' ? '/' + a.pathname : a.pathname,
    protocol: !a.protocol || ':' == a.protocol ? location.protocol : a.protocol,
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

exports.isAbsolute = function(url){
  return 0 == url.indexOf('//') || !!~url.indexOf('://');
};

/**
 * Check if `url` is relative.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isRelative = function(url){
  return !exports.isAbsolute(url);
};

/**
 * Check if `url` is cross domain.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isCrossDomain = function(url){
  url = exports.parse(url);
  var location = exports.parse(window.location.href);
  return url.hostname !== location.hostname
    || url.port !== location.port
    || url.protocol !== location.protocol;
};

/**
 * Return default port for `protocol`.
 *
 * @param  {String} protocol
 * @return {String}
 * @api private
 */
function port (protocol){
  switch (protocol) {
    case 'http:':
      return 80;
    case 'https:':
      return 443;
    default:
      return location.port;
  }
}

}, {}],
28: [function(require, module, exports) {
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
   return typeof val === 'string' || objToString.call(val) === '[object String]';
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

}, {}],
29: [function(require, module, exports) {

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

module.exports = function(e){
  e = e || window.event
  return e.preventDefault
    ? e.preventDefault()
    : e.returnValue = false;
};

}, {}],
30: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var trim = require('trim');
var type = require('type');

var pattern = /(\w+)\[(\d+)\]/

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
}

/**
 * Parse the given query `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if ('string' != typeof str) return {};

  str = trim(str);
  if ('' == str) return {};
  if ('?' == str.charAt(0)) str = str.slice(1);

  var obj = {};
  var pairs = str.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var parts = pairs[i].split('=');
    var key = decode(parts[0]);
    var m;

    if (m = pattern.exec(key)) {
      obj[m[1]] = obj[m[1]] || [];
      obj[m[1]][m[2]] = decode(parts[1]);
      continue;
    }

    obj[parts[0]] = null == parts[1]
      ? ''
      : decode(parts[1]);
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

exports.stringify = function(obj){
  if (!obj) return '';
  var pairs = [];

  for (var key in obj) {
    var value = obj[key];

    if ('array' == type(value)) {
      for (var i = 0; i < value.length; ++i) {
        pairs.push(encode(key + '[' + i + ']') + '=' + encode(value[i]));
      }
      continue;
    }

    pairs.push(encode(key) + '=' + encode(obj[key]));
  }

  return pairs.join('&');
};

}, {"trim":57,"type":50}],
32: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var Entity = require('./entity');
var bind = require('bind');
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

User.prototype.id = function(id){
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

User.prototype.anonymousId = function(anonymousId){
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

User.prototype.logout = function(){
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

module.exports = bind.all(new User());


/**
 * Expose the `User` constructor.
 */

module.exports.User = User;

}, {"./entity":71,"bind":12,"./cookie":15,"debug":16,"inherit":72,"cookie":61,"uuid":81}],
81: [function(require, module, exports) {

/**
 * Taken straight from jed's gist: https://gist.github.com/982883
 *
 * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
 * where each x is replaced with a random hexadecimal digit from 0 to f, and
 * y is replaced with a random hexadecimal digit from 8 to b.
 */

module.exports = function uuid(a){
  return a           // if the placeholder was passed, return
    ? (              // a random number from 0 to 15
      a ^            // unless b is 8,
      Math.random()  // in which case
      * 16           // a random number from
      >> a/4         // 8 to 11
      ).toString(16) // in hexadecimal
    : (              // or otherwise a concatenated string:
      [1e7] +        // 10000000 +
      -1e3 +         // -1000 +
      -4e3 +         // -4000 +
      -8e3 +         // -80000000 +
      -1e11          // -100000000000,
      ).replace(     // replacing
        /[018]/g,    // zeroes, ones, and eights with
        uuid         // random hex digits
      )
};
}, {}],
8: [function(require, module, exports) {
module.exports = {
  "name": "analytics-core",
  "version": "2.10.0",
  "main": "analytics.js",
  "dependencies": {},
  "devDependencies": {}
}
;
}, {}],
3: [function(require, module, exports) {

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

function createIntegration(name){
  /**
   * Initialize a new `Integration`.
   *
   * @class
   * @param {Object} options
   */

  function Integration(options){
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

}, {"bind":82,"clone":14,"debug":83,"defaults":17,"extend":84,"slug":85,"./protos":86,"./statics":87}],
82: [function(require, module, exports) {

var bind = require('bind')
  , bindAll = require('bind-all');


/**
 * Expose `bind`.
 */

module.exports = exports = bind;


/**
 * Expose `bindAll`.
 */

exports.all = bindAll;


/**
 * Expose `bindMethods`.
 */

exports.methods = bindMethods;


/**
 * Bind `methods` on `obj` to always be called with the `obj` as context.
 *
 * @param {Object} obj
 * @param {String} methods...
 */

function bindMethods (obj, methods) {
  methods = [].slice.call(arguments, 1);
  for (var i = 0, method; method = methods[i]; i++) {
    obj[method] = bind(obj, obj[method]);
  }
  return obj;
}
}, {"bind":58,"bind-all":59}],
83: [function(require, module, exports) {
if ('undefined' == typeof window) {
  module.exports = require('./lib/debug');
} else {
  module.exports = require('./debug');
}

}, {"./lib/debug":88,"./debug":89}],
88: [function(require, module, exports) {
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

var names = []
  , skips = [];

(process.env.DEBUG || '')
  .split(/[\s,]+/)
  .forEach(function(name){
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
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
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
  function disabled(){}
  disabled.enabled = false;

  var match = skips.some(function(re){
    return re.test(name);
  });

  if (match) return disabled;

  match = names.some(function(re){
    return re.test(name);
  });

  if (!match) return disabled;
  var c = color();

  function colored(fmt) {
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (prev[name] || curr);
    prev[name] = curr;

    fmt = '  \u001b[9' + c + 'm' + name + ' '
      + '\u001b[3' + c + 'm\u001b[90m'
      + fmt + '\u001b[3' + c + 'm'
      + ' +' + humanize(ms) + '\u001b[0m';

    console.error.apply(this, arguments);
  }

  function plain(fmt) {
    fmt = coerce(fmt);

    fmt = new Date().toUTCString()
      + ' ' + name + ' ' + fmt;
    console.error.apply(this, arguments);
  }

  colored.enabled = plain.enabled = true;

  return isatty || process.env.DEBUG_COLORS
    ? colored
    : plain;
}

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

}, {}],
89: [function(require, module, exports) {

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
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
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
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
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
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
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
} catch(e){}

}, {}],
84: [function(require, module, exports) {

module.exports = function extend (object) {
    // Takes an unlimited number of extenders.
    var args = Array.prototype.slice.call(arguments, 1);

    // For each extender, copy their properties on our object.
    for (var i = 0, source; source = args[i]; i++) {
        if (!source) continue;
        for (var property in source) {
            object[property] = source[property];
        }
    }

    return object;
};
}, {}],
85: [function(require, module, exports) {

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

module.exports = function (str, options) {
  options || (options = {});
  return str.toLowerCase()
    .replace(options.replace || /[^a-z0-9]/g, ' ')
    .replace(/^ +| +$/g, '')
    .replace(/ +/g, options.separator || '-')
};

}, {}],
86: [function(require, module, exports) {
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

function noop(){}

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

exports.initialize = function(){
  var ready = this.ready;
  nextTick(ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

exports.loaded = function(){
  return false;
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

/* eslint-disable no-unused-vars */
exports.page = function(page){};
/* eslint-enable no-unused-vars */

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

/* eslint-disable no-unused-vars */
exports.track = function(track){};
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

exports.map = function(options, key){
  var normalizedComparator = normalize(key);
  var mappingType = getMappingType(options);

  if (mappingType === 'unknown') {
    return [];
  }

  return foldl(function(matchingValues, val, key) {
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
  }, [], options);
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

exports.invoke = function(method){
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

exports.queue = function(method, args){
  if (method === 'page' && this._assumesPageview && !this._initialized) {
    return this.page.apply(this, args);
  }

  this._queue.push({ method: method, args: args });
};

/**
 * Flush the internal queue.
 *
 * @api private
 */

exports.flush = function(){
  this._ready = true;
  var self = this;

  each(this._queue, function(call){
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

exports.reset = function(){
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

exports.load = function(name, locals, callback){
  // Argument shuffling
  if (typeof name === 'function') { callback = name; locals = null; name = null; }
  if (name && typeof name === 'object') { callback = locals; locals = name; name = null; }
  if (typeof locals === 'function') { callback = locals; locals = null; }

  // Default arguments
  name = name || 'library';
  locals = locals || {};

  locals = this.locals(locals);
  var template = this.templates[name];
  if (!template) throw new Error(fmt('template "%s" not defined.', name));
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
      el = loadScript(attrs, function(err){
        if (!err) return callback();
        self.debug('error loading "%s" error="%s"', self.name, err);
      });
      // TODO: hack until refactoring load-script
      delete attrs.src;
      each(attrs, function(key, val){
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

exports.locals = function(locals){
  locals = locals || {};
  var cache = Math.floor(new Date().getTime() / 3600000);
  if (!locals.hasOwnProperty('cache')) locals.cache = cache;
  each(this.options, function(key, val){
    if (!locals.hasOwnProperty(key)) locals[key] = val;
  });
  return locals;
};

/**
 * Simple way to emit ready.
 *
 * @api public
 */

exports.ready = function(){
  this.emit('ready');
};

/**
 * Wrap the initialize method in an exists check, so we don't have to do it for
 * every single integration.
 *
 * @api private
 */

exports._wrapInitialize = function(){
  var initialize = this.initialize;
  this.initialize = function(){
    this.debug('initialize');
    this._initialized = true;
    var ret = initialize.apply(this, arguments);
    this.emit('initialize');
    return ret;
  };

  if (this._assumesPageview) this.initialize = after(2, this.initialize);
};

/**
 * Wrap the page method to call `initialize` instead if the integration assumes
 * a pageview.
 *
 * @api private
 */

exports._wrapPage = function(){
  var page = this.page;
  this.page = function(){
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

exports._wrapTrack = function(){
  var t = this.track;
  this.track = function(track){
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

function loadImage(attrs, fn){
  fn = fn || function(){};
  var img = new Image();
  img.onerror = error(fn, 'failed to load pixel', img);
  img.onload = function(){ fn(); };
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

function error(fn, message, img){
  return function(e){
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

function render(template, locals){
  return foldl(function(attrs, val, key) {
    attrs[key] = val.replace(/\{\{\ *(\w+)\ *\}\}/g, function(_, $1){
      return locals[$1];
    });
    return attrs;
  }, {}, template.attrs);
}

}, {"emitter":9,"after":11,"each":90,"analytics-events":91,"fmt":92,"foldl":19,"load-iframe":93,"load-script":94,"to-no-case":95,"next-tick":60,"every":96,"is":97}],
90: [function(require, module, exports) {

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

module.exports = function(obj, fn, ctx){
  fn = toFunction(fn);
  ctx = ctx || this;
  switch (type(obj)) {
    case 'array':
      return array(obj, fn, ctx);
    case 'object':
      if ('number' == typeof obj.length) return array(obj, fn, ctx);
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

}, {"type":98,"component-type":98,"to-function":77}],
98: [function(require, module, exports) {

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

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

}, {}],
91: [function(require, module, exports) {

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

}, {}],
92: [function(require, module, exports) {

/**
 * toString.
 */

var toString = window.JSON
  ? JSON.stringify
  : function(_){ return String(_); };

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

function fmt(str){
  var args = [].slice.call(arguments, 1);
  var j = 0;

  return str.replace(/%([a-z])/gi, function(_, f){
    return fmt[f]
      ? fmt[f](args[j++])
      : _ + f;
  });
}

}, {}],
93: [function(require, module, exports) {

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

module.exports = function loadIframe(options, fn){
  if (!options) throw new Error('Cant load nothing...');

  // Allow for the simplest case, just passing a `src` string.
  if ('string' == type(options)) options = { src : options };

  var https = document.location.protocol === 'https:' ||
              document.location.protocol === 'chrome-extension:';

  // If you use protocol relative URLs, third-party scripts like Google
  // Analytics break when testing with `file:` so this fixes that.
  if (options.src && options.src.indexOf('//') === 0) {
    options.src = https ? 'https:' + options.src : 'http:' + options.src;
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
  if ('function' == type(fn)) {
    onload(iframe, fn);
  }

  tick(function(){
    // Append after event listeners are attached for IE.
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(iframe, firstScript);
  });

  // Return the iframe element in case they want to do anything special, like
  // give it an ID or attributes.
  return iframe;
};
}, {"script-onload":99,"next-tick":60,"type":50}],
99: [function(require, module, exports) {

// https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html

/**
 * Invoke `fn(err)` when the given `el` script loads.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api public
 */

module.exports = function(el, fn){
  return el.addEventListener
    ? add(el, fn)
    : attach(el, fn);
};

/**
 * Add event listener to `el`, `fn()`.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api private
 */

function add(el, fn){
  el.addEventListener('load', function(_, e){ fn(null, e); }, false);
  el.addEventListener('error', function(e){
    var err = new Error('script error "' + el.src + '"');
    err.event = e;
    fn(err);
  }, false);
}

/**
 * Attach event.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api private
 */

function attach(el, fn){
  el.attachEvent('onreadystatechange', function(e){
    if (!/complete|loaded/.test(el.readyState)) return;
    fn(null, e);
  });
  el.attachEvent('onerror', function(e){
    var err = new Error('failed to load the script "' + el.src + '"');
    err.event = e || window.event;
    fn(err);
  });
}

}, {}],
94: [function(require, module, exports) {

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

module.exports = function loadScript(options, fn){
  if (!options) throw new Error('Cant load nothing...');

  // Allow for the simplest case, just passing a `src` string.
  if ('string' == type(options)) options = { src : options };

  var https = document.location.protocol === 'https:' ||
              document.location.protocol === 'chrome-extension:';

  // If you use protocol relative URLs, third-party scripts like Google
  // Analytics break when testing with `file:` so this fixes that.
  if (options.src && options.src.indexOf('//') === 0) {
    options.src = https ? 'https:' + options.src : 'http:' + options.src;
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
  if ('function' == type(fn)) {
    onload(script, fn);
  }

  tick(function(){
    // Append after event listeners are attached for IE.
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  });

  // Return the script element in case they want to do anything special, like
  // give it an ID or attributes.
  return script;
};
}, {"script-onload":99,"next-tick":60,"type":50}],
95: [function(require, module, exports) {

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

function toNoCase (string) {
  if (hasSpace.test(string)) return string.toLowerCase();
  if (hasSeparator.test(string)) return unseparate(string).toLowerCase();
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

function unseparate (string) {
  return string.replace(separatorSplitter, function (m, next) {
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

function uncamelize (string) {
  return string.replace(camelSplitter, function (m, previous, uppers) {
    return previous + ' ' + uppers.toLowerCase().split('').join(' ');
  });
}
}, {}],
96: [function(require, module, exports) {
'use strict';

/**
 * Module dependencies.
 */

// FIXME: Hacky workaround for Duo
var each; try { each = require('@ndhoule/each'); } catch(e) { each = require('each'); }

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
    throw new TypeError('`predicate` must be a function but was a ' + typeof predicate);
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

}, {"each":69}],
97: [function(require, module, exports) {

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

for (var i = 0, type; type = types[i]; i++) exports[type] = generate(type);


/**
 * Add alias for `function` for old browsers.
 */

exports.fn = exports['function'];


/**
 * Expose `empty` check.
 */

exports.empty = isEmpty;


/**
 * Expose `nan` check.
 */

exports.nan = function (val) {
  return exports.number(val) && val != val;
};


/**
 * Generate a type checker.
 *
 * @param {String} type
 * @return {Function}
 */

function generate (type) {
  return function (value) {
    return type === typeOf(value);
  };
}
}, {"is-empty":49,"type":50,"component-type":50}],
87: [function(require, module, exports) {

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

exports.option = function(key, value){
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

exports.mapping = function(name){
  this.option(name, []);
  this.prototype[name] = function(key){
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

exports.global = function(key){
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

exports.assumesPageview = function(){
  this.prototype._assumesPageview = true;
  return this;
};

/**
 * Mark the integration as being "ready" once `load` is called.
 *
 * @api public
 * @return {Integration}
 */

exports.readyOnLoad = function(){
  this.prototype._readyOnLoad = true;
  return this;
};

/**
 * Mark the integration as being "ready" once `initialize` is called.
 *
 * @api public
 * @return {Integration}
 */

exports.readyOnInitialize = function(){
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

exports.tag = function(name, tag){
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

  each(el.attributes, function(attr){
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

}, {"emitter":9,"domify":100,"each":90,"includes":75}],
100: [function(require, module, exports) {

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var div = document.createElement('div');
// Setup
div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
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

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.polyline =
map.ellipse =
map.polygon =
map.circle =
map.text =
map.line =
map.path =
map.rect =
map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

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
  if ('string' != typeof html) throw new TypeError('String expected');

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

}, {}],
4: [function(require, module, exports) {

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

module.exports = function(){
  clearAjax();
  clearTimeouts();
  clearIntervals();
  clearListeners();
  clearGlobals();
  clearImages();
  clearScripts();
  clearCookies();
};
}, {"clear-ajax":101,"clear-timeouts":102,"clear-intervals":103,"clear-listeners":104,"clear-globals":105,"clear-images":106,"clear-scripts":107,"clear-cookies":108}],
101: [function(require, module, exports) {

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

exports = module.exports = function(){
  each(requests, function(request){
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

exports.bind = function(){
  XMLHttpRequest.prototype.send = function(){
    requests.push(this);
    return send.apply(this, arguments);
  };
};

/**
 * Reset `XMLHttpRequest` back to normal.
 *
 * @api public
 */

exports.unbind = function(){
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

function noop(){}
}, {"each":90}],
102: [function(require, module, exports) {

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

module.exports = function(){
  var tmp, i;
  tmp = i = setTimeout(noop);
  while (prev < i) clearTimeout(i--);
  prev = tmp;
};

}, {}],
103: [function(require, module, exports) {

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

module.exports = function(){
  var tmp, i;
  tmp = i = setInterval(noop);
  while (prev < i) clearInterval(i--);
  prev = tmp;
};

}, {}],
104: [function(require, module, exports) {

/**
 * Window event listeners.
 */

var listeners = [];

/**
 * Original window functions.
 */

var on = window.addEventListener ? 'addEventListener' : 'attachEvent';
var off = window.removeEventListener ? 'removeEventListener' : 'detachEvent';
var onFn = window[on];
var offFn = window[off];

/**
 * Clear event listeners.
 *
 * @api public
 */

exports = module.exports = function(){
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

exports.bind = function(){
  window[on] = function(){
    listeners.push(arguments);
    return onFn.apply
      ? onFn.apply(window, arguments)
      : onFn(arguments[0], arguments[1]); // IE
  };

  window[off] = function(name, listener, useCapture){
    for (var i = 0, n = listeners.length; i < n; i++) {
      if (name !== listeners[i][0]) continue;
      if (listener !== listeners[i][1]) continue;
      if (arguments.length > 2 && useCapture !== listeners[i][2]) continue;
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

exports.unbind = function(){
  listeners.length = 0;
  window[on] = onFn;
  window[off] = offFn;
};

/**
 * Automatically override.
 */

exports.bind();
}, {}],
105: [function(require, module, exports) {

/**
 * Objects we want to keep track of initial properties for.
 */

var globals = {
  'window': {},
  'document': {},
  'XMLHttpRequest': {}
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

if ('undefined' != typeof XMLHttpRequest) {
  globals.XMLHttpRequest.open = XMLHttpRequest.prototype.open;
}

/**
 * Reset initial state.
 *
 * @api public
 */

module.exports = function(){
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

function copy(source, target){
  for (var name in source) {
    if (source.hasOwnProperty(name)) {
      target[name] = source[name];
    }
  }
}
}, {}],
106: [function(require, module, exports) {

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
  var img = new Original;
  images.push(img);
  return img;
}

/**
 * Clear `onload` for each image.
 *
 * @api public
 */

exports = module.exports = function(){
  var noop = function(){};
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

exports.bind = function(){
  window.Image = Override;
};

/**
 * Set `window.Image` back to normal.
 *
 * @api public
 */

exports.unbind = function(){
  window.Image = Original;
  images.length = 0;
};

/**
 * Automatically override.
 */

exports.bind();
}, {}],
107: [function(require, module, exports) {

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

exports = module.exports = function(match){
  match = match || saucelabs;
  var finalScripts = query.all('script');
  each(finalScripts, function(script){
    if (-1 != indexOf(initialScripts, script)) return;
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

exports.bind = function(scripts){
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
};

/**
 * Automatically bind.
 */

exports.bind();

}, {"indexof":33,"query":109,"each":90}],
109: [function(require, module, exports) {
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

}, {}],
108: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var cookie = require('cookie');

/**
 * Clear cookies.
 */

module.exports = function(){
  var cookies = cookie();
  for (var name in cookies) {
    cookie(name, '', { path: '/' });
  }
};
}, {"cookie":68}],
5: [function(require, module, exports) {

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

  analytics.spy = function(object, method){
    var s = spy(object, method);
    this.spies.push(s);
    return this;
  };

  /**
   * Stub a `method` of host `object`.
   *
   * @param {Object} object
   * @param {String} method
   * @return {Analytics}
   */

  analytics.stub = function(object, method){
    var s = stub(object, method);
    this.spies.push(s);
    return this;
  };

  /**
   * Restore all spies.
   *
   * @return {Analytics}
   */

  analytics.restore = function(){
    each(this.spies, function(spy, i){
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

  analytics.called = function(spy){
    assert(
      ~indexOf(this.spies, spy),
      'You must call `.spy(object, method)` prior to calling `.called()`.'
    );
    assert(spy.called, fmt('Expected "%s" to have been called.', spy.name));

    var args = [].slice.call(arguments, 1);
    if (!args.length) return this;

    assert(
      spy.got.apply(spy, args), fmt(''
      + 'Expected "%s" to be called with "%s", \n'
      + 'but it was called with "%s".'
      , spy.name
      , JSON.stringify(args, null, 2)
      , JSON.stringify(spy.args[0], null, 2))
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

  analytics.didNotCall = function(spy){
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
      assert(!spy.got.apply(spy, args), fmt(''
        + 'Expected "%s" not to be called with "%o", '
        + 'but it was called with "%o".'
        , spy.name
        , args
        , spy.args[0])
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
        fmt(''
          + 'Expected "%s" to have been called %s time%s, '
          + 'but it was only called %s time%s.'
          , spy.name, n, 1 != n ? 's' : '', m, 1 != m ? 's' : '')
      );
    }
  }

  /**
   * Assert that a `spy` returned `value`.
   *
   * @param {Spy} spy
   * @param {Mixed} value
   * @return {Tester}
   */

  analytics.returned = function(spy, value){
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

  analytics.didNotReturn = function(spy, value){
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

  analytics.reset = function(){
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

  analytics.compare = function(a, b){
    a = new a;
    b = new b;
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
        x[key], y[key],
        fmt(
          'Expected option "%s" to default to "%s", but it defaults to "%s".',
          key, y[key], x[key]
        )
      );
    }

    // globals
    var x = a.globals;
    var y = b.globals;
    each(y, function(key){
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

  analytics.load = function(integration, done){
    analytics.assert(!integration.loaded(), 'Expected `integration.loaded()` to be false before loading.');
    analytics.once('ready', function(){
      analytics.assert(integration.loaded(), 'Expected `integration.loaded()` to be true after loading.');
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
  
  analytics.loaded = function(integration, str){
    if ('string' == typeof integration) {
      str = integration;
      integration = this.integration();
    }

    var tags = [];

    assert(
      ~indexOf(this.spies, integration.load),
      'You must call `.spy(integration, \'load\')` prior to calling `.loaded()`.'
    );

    // collect all Image or HTMLElement objects
    // in an array of stringified elements, for human-readable assertions.
    each(integration.load.returns, function(el){
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
      assert(false, fmt('No tags were returned.\nExpected %s.', expected));
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
  
  analytics.integration = function(){
    for (var name in this._integrations) return this._integrations[name];
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

  each(keys(assert), function(key){
    analytics[key] = function(){
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
    each(attrs, function(key, val){
      str.push(' ' + key + '="' + val + '"');
    });
    str.push('>');
    // block
    if ('img' !== name) str.push('</' + name + '>');
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
    each(node.attributes, function(attr){
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
    
    each(el.attributes, function(attr){
      // then replace it back
      var name = 'data-src' == attr.name ? 'src' : attr.name;
      attrs[name] = attr.value;
    });
    
    return {
      type: el.tagName.toLowerCase(),
      attrs: attrs
    };
  }
}
}, {"indexof":33,"assert":110,"domify":111,"stub":112,"each":90,"keys":113,"fmt":92,"spy":114,"is":47}],
110: [function(require, module, exports) {

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

module.exports = exports = function (expr, msg) {
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

exports.equal = function (actual, expected, msg) {
  if (actual == expected) return;
  throw error(msg || fmt('Expected %o to equal %o.', actual, expected), actual, expected);
};

/**
 * Assert `actual` is not weak equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.notEqual = function (actual, expected, msg) {
  if (actual != expected) return;
  throw error(msg || fmt('Expected %o not to equal %o.', actual, expected));
};

/**
 * Assert `actual` is deep equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.deepEqual = function (actual, expected, msg) {
  if (equals(actual, expected)) return;
  throw error(msg || fmt('Expected %o to deeply equal %o.', actual, expected), actual, expected);
};

/**
 * Assert `actual` is not deep equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.notDeepEqual = function (actual, expected, msg) {
  if (!equals(actual, expected)) return;
  throw error(msg || fmt('Expected %o not to deeply equal %o.', actual, expected));
};

/**
 * Assert `actual` is strict equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.strictEqual = function (actual, expected, msg) {
  if (actual === expected) return;
  throw error(msg || fmt('Expected %o to strictly equal %o.', actual, expected), actual, expected);
};

/**
 * Assert `actual` is not strict equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.notStrictEqual = function (actual, expected, msg) {
  if (actual !== expected) return;
  throw error(msg || fmt('Expected %o not to strictly equal %o.', actual, expected));
};

/**
 * Assert `block` throws an `error`.
 *
 * @param {Function} block
 * @param {Function} [error]
 * @param {String} [msg]
 * @api public
 */

exports.throws = function (block, err, msg) {
  var threw;
  try {
    block();
  } catch (e) {
    threw = e;
  }

  if (!threw) throw error(msg || fmt('Expected %s to throw an error.', block.toString()));
  if (err && !(threw instanceof err)) {
    throw error(msg || fmt('Expected %s to throw an %o.', block.toString(), err));
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

exports.doesNotThrow = function (block, err, msg) {
  var threw;
  try {
    block();
  } catch (e) {
    threw = e;
  }

  if (threw) throw error(msg || fmt('Expected %s not to throw an error.', block.toString()));
  if (err && (threw instanceof err)) {
    throw error(msg || fmt('Expected %s not to throw an %o.', block.toString(), err));
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
  var xhr = new XMLHttpRequest;
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

function error(msg, actual, expected){
  var err = new Error(msg);
  err.showDiff = 3 == arguments.length;
  err.actual = actual;
  err.expected = expected;
  return err;
}

}, {"equals":115,"fmt":92,"stack":116}],
115: [function(require, module, exports) {
var type = require('type')

// (any, any, [array]) -> boolean
function equal(a, b, memos){
  // All identical values are equivalent
  if (a === b) return true
  var fnA = types[type(a)]
  var fnB = types[type(b)]
  return fnA && fnA === fnB
    ? fnA(a, b, memos)
    : false
}

var types = {}

// (Number) -> boolean
types.number = function(a, b){
  return a !== a && b !== b/*Nan check*/
}

// (function, function, array) -> boolean
types['function'] = function(a, b, memos){
  return a.toString() === b.toString()
    // Functions can act as objects
    && types.object(a, b, memos)
    && equal(a.prototype, b.prototype)
}

// (date, date) -> boolean
types.date = function(a, b){
  return +a === +b
}

// (regexp, regexp) -> boolean
types.regexp = function(a, b){
  return a.toString() === b.toString()
}

// (DOMElement, DOMElement) -> boolean
types.element = function(a, b){
  return a.outerHTML === b.outerHTML
}

// (textnode, textnode) -> boolean
types.textnode = function(a, b){
  return a.textContent === b.textContent
}

// decorate `fn` to prevent it re-checking objects
// (function) -> function
function memoGaurd(fn){
  return function(a, b, memos){
    if (!memos) return fn(a, b, [])
    var i = memos.length, memo
    while (memo = memos[--i]) {
      if (memo[0] === a && memo[1] === b) return true
    }
    return fn(a, b, memos)
  }
}

types['arguments'] =
types.array = memoGaurd(arrayEqual)

// (array, array, array) -> boolean
function arrayEqual(a, b, memos){
  var i = a.length
  if (i !== b.length) return false
  memos.push([a, b])
  while (i--) {
    if (!equal(a[i], b[i], memos)) return false
  }
  return true
}

types.object = memoGaurd(objectEqual)

// (object, object, array) -> boolean
function objectEqual(a, b, memos) {
  if (typeof a.equal == 'function') {
    memos.push([a, b])
    return a.equal(b, memos)
  }
  var ka = getEnumerableProperties(a)
  var kb = getEnumerableProperties(b)
  var i = ka.length

  // same number of properties
  if (i !== kb.length) return false

  // although not necessarily the same order
  ka.sort()
  kb.sort()

  // cheap key test
  while (i--) if (ka[i] !== kb[i]) return false

  // remember
  memos.push([a, b])

  // iterate again this time doing a thorough check
  i = ka.length
  while (i--) {
    var key = ka[i]
    if (!equal(a[key], b[key], memos)) return false
  }

  return true
}

// (object) -> array
function getEnumerableProperties (object) {
  var result = []
  for (var k in object) if (k !== 'constructor') {
    result.push(k)
  }
  return result
}

module.exports = equal

}, {"type":117}],
117: [function(require, module, exports) {

var toString = {}.toString
var DomNode = typeof window != 'undefined'
  ? window.Node
  : Function

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = exports = function(x){
  var type = typeof x
  if (type != 'object') return type
  type = types[toString.call(x)]
  if (type) return type
  if (x instanceof DomNode) switch (x.nodeType) {
    case 1:  return 'element'
    case 3:  return 'text-node'
    case 9:  return 'document'
    case 11: return 'document-fragment'
    default: return 'dom-node'
  }
}

var types = exports.types = {
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
}

}, {}],
116: [function(require, module, exports) {

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
  Error.prepareStackTrace = function(_, stack){ return stack; };
  var err = new Error;
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}
}, {}],
111: [function(require, module, exports) {

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
  bugTestDiv.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
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

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.polyline =
map.ellipse =
map.polygon =
map.circle =
map.text =
map.line =
map.path =
map.rect =
map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

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
  if ('string' != typeof html) throw new TypeError('String expected');

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

}, {}],
112: [function(require, module, exports) {

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

module.exports = function(obj, method){
  var fn = toFunction(arguments, stub);
  merge(stub, proto);
  stub.reset();
  stub.name = method;
  return stub;

  function stub(){
    var args = [].slice.call(arguments);
    var ret = fn(arguments);
    //stub.returns || stub.reset();
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

proto.got =
proto.calledWith = function(n){
  var a = [].slice.call(arguments);
  for (var i = 0, n = this.args.length; i < n; i++) {
    var b = this.args[i];
    if (eql(a, b.slice(0, a.length))) return true;
  }
  return;
};

/**
 * `true` if the stub returned `value`.
 *
 * @param {Mixed} value
 * @return {Boolean}
 * @api public
 */

proto.returned = function(value){
  var ret = this.returns[this.returns.length - 1];
  return eql(ret, value);
};

/**
 * `true` if the stub was called once.
 *
 * @return {Boolean}
 * @api public
 */

proto.once = function(){
  return 1 == this.args.length;
};

/**
 * `true` if the stub was called twice.
 *
 * @return {Boolean}
 * @api public
 */

proto.twice = function(){
  return 2 == this.args.length;
};

/**
 * `true` if the stub was called three times.
 *
 * @return {Boolean}
 * @api public
 */

proto.thrice = function(){
  return 3 == this.args.length;
};

/**
 * Reset the stub.
 *
 * @return {Function}
 * @api public
 */

proto.reset = function(){
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

proto.restore = function(){
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

proto.update = function(){
  this.called = !! this.args.length;
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

function toFunction(args, stub){
  var obj = args[0];
  var method = args[1];
  var fn = args[2] || function(){};

  switch (args.length) {
    case 0: return function noop(){};
    case 1: return function(args){ return obj.apply(null, args); };
    case 2:
    case 3:
    var m = obj[method];
    stub.method = method;
    stub.fn = m;
    stub.obj = obj;
    obj[method] = stub;
    return function(args) { fn.apply(obj, args) };
  }
}
}, {"merge":118,"eql":119}],
118: [function(require, module, exports) {

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

module.exports = function (a, b) {
  for (var k in b) a[k] = b[k];
  return a;
};

}, {}],
119: [function(require, module, exports) {

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

function eql(a, b){
  var compare = type(a);

  // sanity check
  if (compare != type(b)) return false;
  if (a === b) return true;

  // compare
  return (compare = eql[compare])
    ? compare(a, b)
    : a == b;
}

/**
 * Compare regexps `a`, `b`.
 *
 * @param {RegExp} a
 * @param {RegExp} b
 * @return {Boolean}
 * @api public
 */

eql.regexp = function(a, b){
  return a.ignoreCase == b.ignoreCase
    && a.multiline == b.multiline
    && a.lastIndex == b.lastIndex
    && a.global == b.global
    && a.source == b.source;
};

/**
 * Compare objects `a`, `b`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Boolean}
 * @api public
 */

eql.object = function(a, b){
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

eql.array = function(a, b){
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

eql.date = function(a, b){
  return +a == +b;
};

}, {"type":50,"keys":113}],
113: [function(require, module, exports) {
var has = Object.prototype.hasOwnProperty;

module.exports = Object.keys || function(obj){
  var keys = [];

  for (var key in obj) {
    if (has.call(obj, key)) {
      keys.push(key);
    }
  }

  return keys;
};

}, {}],
114: [function(require, module, exports) {

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

module.exports = function(obj, method){
  var fn = toFunction(arguments, spy);
  merge(spy, proto);
  return spy.reset();

  function spy(){
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

proto.got =
proto.calledWith =
proto.gotLazy =
proto.calledWithLazy = function(){
  var a = [].slice.call(arguments);

  for (var i = 0, args; args = this.args[i]; i++) {
    if (eql(a,  args.slice(0, a.length))) return true;
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

proto.gotExactly =
proto.calledWithExactly = function(){
  var a = [].slice.call(arguments);

  for (var i = 0, args; args = this.args[i]; i++) {
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

proto.returned = function(value){
  var ret = this.returns[this.returns.length - 1];
  return eql(ret, value);
};

/**
 * `true` if the spy was called once.
 *
 * @return {Boolean}
 * @api public
 */

proto.once = function(){
  return 1 == this.args.length;
};

/**
 * `true` if the spy was called twice.
 *
 * @return {Boolean}
 * @api public
 */

proto.twice = function(){
  return 2 == this.args.length;
};

/**
 * `true` if the spy was called three times.
 *
 * @return {Boolean}
 * @api public
 */

proto.thrice = function(){
  return 3 == this.args.length;
};

/**
 * Reset the spy.
 *
 * @return {Function}
 * @api public
 */

proto.reset = function(){
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

proto.restore = function(){
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

proto.update = function(){
  this.called = !! this.args.length;
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

function toFunction(args, spy){
  var obj = args[0];
  var method = args[1];

  switch (args.length) {
    case 0: return function noop(){};
    case 1: return function(args){ return obj.apply(null, args); };
    case 2:
      var m = obj[method];
      merge(spy, m);
      spy.method = method;
      spy.fn = m;
      spy.obj = obj;
      obj[method] = spy;
      return function(args){
        return m.apply(obj, args);
      };
  }
}

}, {"merge":118,"eql":119}],
6: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var Track = require('facade').Track;
var defaults = require('defaults');
var dot = require('obj-case');
var each = require('each');
var integration = require('analytics.js-integration');
var is = require('is');
var keys = require('object').keys;
var len = require('object').length;
var push = require('global-queue')('_gaq');
var select = require('select');
var useHttps = require('use-https');
var user;

/**
 * Expose plugin.
 */

module.exports = exports = function(analytics) {
  analytics.addIntegration(GA);
  user = analytics.user();
};

/**
 * Expose `GA` integration.
 *
 * http://support.google.com/analytics/bin/answer.py?hl=en&answer=2558867
 * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiBasicConfiguration#_gat.GA_Tracker_._setSiteSpeedSampleRate
 */

var GA = exports.Integration = integration('Google Analytics')
  .readyOnLoad()
  .global('ga')
  .global('gaplugins')
  .global('_gaq')
  .global('GoogleAnalyticsObject')
  .option('anonymizeIp', false)
  .option('classic', false)
  .option('dimensions', {})
  .option('domain', 'auto')
  .option('doubleClick', false)
  .option('enhancedEcommerce', false)
  .option('enhancedLinkAttribution', false)
  .option('ignoredReferrers', null)
  .option('includeSearch', false)
  .option('metrics', {})
  .option('nonInteraction', false)
  .option('sendUserId', false)
  .option('siteSpeedSampleRate', 1)
  .option('trackCategorizedPages', true)
  .option('trackNamedPages', true)
  .option('trackingId', '')
  .tag('library', '<script src="//www.google-analytics.com/analytics.js">')
  .tag('double click', '<script src="//stats.g.doubleclick.net/dc.js">')
  .tag('http', '<script src="http://www.google-analytics.com/ga.js">')
  .tag('https', '<script src="https://ssl.google-analytics.com/ga.js">');

/**
 * On `construct` swap any config-based methods to the proper implementation.
 */

GA.on('construct', function(integration) {
  if (integration.options.classic) {
    integration.initialize = integration.initializeClassic;
    integration.loaded = integration.loadedClassic;
    integration.page = integration.pageClassic;
    integration.track = integration.trackClassic;
    integration.completedOrder = integration.completedOrderClassic;
  } else if (integration.options.enhancedEcommerce) {
    integration.viewedProduct = integration.viewedProductEnhanced;
    integration.clickedProduct = integration.clickedProductEnhanced;
    integration.addedProduct = integration.addedProductEnhanced;
    integration.removedProduct = integration.removedProductEnhanced;
    integration.startedOrder = integration.startedOrderEnhanced;
    integration.viewedCheckoutStep = integration.viewedCheckoutStepEnhanced;
    integration.completedCheckoutStep = integration.completedCheckoutStepEnhanced;
    integration.updatedOrder = integration.updatedOrderEnhanced;
    integration.completedOrder = integration.completedOrderEnhanced;
    integration.refundedOrder = integration.refundedOrderEnhanced;
    integration.viewedPromotion = integration.viewedPromotionEnhanced;
    integration.clickedPromotion = integration.clickedPromotionEnhanced;
  }
});

/**
 * Initialize.
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/advanced
 */

GA.prototype.initialize = function() {
  var opts = this.options;

  // setup the tracker globals
  window.GoogleAnalyticsObject = 'ga';
  window.ga = window.ga || function() {
    window.ga.q = window.ga.q || [];
    window.ga.q.push(arguments);
  };
  window.ga.l = new Date().getTime();

  if (window.location.hostname === 'localhost') opts.domain = 'none';

  window.ga('create', opts.trackingId, {
    // Fall back on default to protect against empty string
    cookieDomain: opts.domain || GA.prototype.defaults.domain,
    siteSpeedSampleRate: opts.siteSpeedSampleRate,
    allowLinker: true
  });

  // display advertising
  if (opts.doubleClick) {
    window.ga('require', 'displayfeatures');
  }

  // https://support.google.com/analytics/answer/2558867?hl=en
  if (opts.enhancedLinkAttribution) {
    window.ga('require', 'linkid', 'linkid.js');
  }

  // send global id
  if (opts.sendUserId && user.id()) {
    window.ga('set', 'userId', user.id());
  }

  // anonymize after initializing, otherwise a warning is shown
  // in google analytics debugger
  if (opts.anonymizeIp) window.ga('set', 'anonymizeIp', true);

  // custom dimensions & metrics
  var custom = metrics(user.traits(), opts);
  if (len(custom)) window.ga('set', custom);

  this.load('library', this.ready);
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */

GA.prototype.loaded = function() {
  return !!window.gaplugins;
};

/**
 * Page.
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications#multiple-hits
 *
 * @api public
 * @param {Page} page
 */

GA.prototype.page = function(page) {
  var category = page.category();
  var props = page.properties();
  var name = page.fullName();
  var opts = this.options;
  var campaign = page.proxy('context.campaign') || {};
  var pageview = {};
  var pagePath = path(props, this.options);
  var pageTitle = name || props.title;
  var track;

  // store for later
  // TODO: Why? Document this better
  this._category = category;

  pageview.page = pagePath;
  pageview.title = pageTitle;
  pageview.location = props.url;

  if (campaign.name) pageview.campaignName = campaign.name;
  if (campaign.source) pageview.campaignSource = campaign.source;
  if (campaign.medium) pageview.campaignMedium = campaign.medium;
  if (campaign.content) pageview.campaignContent = campaign.content;
  if (campaign.term) pageview.campaignKeyword = campaign.term;

  // custom dimensions and metrics
  var custom = metrics(props, opts);
  if (len(custom)) window.ga('set', custom);

  // set
  window.ga('set', { page: pagePath, title: pageTitle });

  // send
  window.ga('send', 'pageview', pageview);

  // categorized pages
  if (category && this.options.trackCategorizedPages) {
    track = page.track(category);
    this.track(track, { nonInteraction: 1 });
  }

  // named pages
  if (name && this.options.trackNamedPages) {
    track = page.track(name);
    this.track(track, { nonInteraction: 1 });
  }
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} event
 */

GA.prototype.identify = function(identify) {
  var opts = this.options;

  if (opts.sendUserId && identify.userId()) {
    window.ga('set', 'userId', identify.userId());
  }

  // Set dimensions
  var custom = metrics(user.traits(), opts);
  if (len(custom)) window.ga('set', custom);
};

/**
 * Track.
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/events
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference
 *
 * @param {Track} event
 */

GA.prototype.track = function(track, options) {
  var contextOpts = track.options(this.name);
  var interfaceOpts = this.options;
  var opts = defaults(options || {}, contextOpts);
  opts = defaults(opts, interfaceOpts);
  var props = track.properties();
  var campaign = track.proxy('context.campaign') || {};

  // custom dimensions & metrics
  var custom = metrics(props, interfaceOpts);
  if (len(custom)) window.ga('set', custom);

  var payload = {
    eventAction: track.event(),
    eventCategory: props.category || this._category || 'All',
    eventLabel: props.label,
    eventValue: formatValue(props.value || track.revenue()),
    nonInteraction: !!(props.nonInteraction || opts.nonInteraction)
  };

  if (campaign.name) payload.campaignName = campaign.name;
  if (campaign.source) payload.campaignSource = campaign.source;
  if (campaign.medium) payload.campaignMedium = campaign.medium;
  if (campaign.content) payload.campaignContent = campaign.content;
  if (campaign.term) payload.campaignKeyword = campaign.term;

  window.ga('send', 'event', payload);
};

/**
 * Completed order.
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce#multicurrency
 *
 * @param {Track} track
 * @api private
 */

GA.prototype.completedOrder = function(track) {
  var total = track.total() || track.revenue() || 0;
  var orderId = track.orderId();
  var products = track.products();
  var props = track.properties();

  // orderId is required.
  if (!orderId) return;

  // require ecommerce
  if (!this.ecommerce) {
    window.ga('require', 'ecommerce');
    this.ecommerce = true;
  }

  // add transaction
  window.ga('ecommerce:addTransaction', {
    affiliation: props.affiliation,
    shipping: track.shipping(),
    revenue: total,
    tax: track.tax(),
    id: orderId,
    currency: track.currency()
  });

  // add products
  each(products, function(product) {
    var productTrack = createProductTrack(track, product);
    window.ga('ecommerce:addItem', {
      category: productTrack.category(),
      quantity: productTrack.quantity(),
      price: productTrack.price(),
      name: productTrack.name(),
      sku: productTrack.sku(),
      id: orderId,
      currency: productTrack.currency()
    });
  });

  // send
  window.ga('ecommerce:send');
};

/**
 * Initialize (classic).
 *
 * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiBasicConfiguration
 */

GA.prototype.initializeClassic = function() {
  var opts = this.options;
  var anonymize = opts.anonymizeIp;
  var domain = opts.domain;
  var enhanced = opts.enhancedLinkAttribution;
  var ignore = opts.ignoredReferrers;
  var sample = opts.siteSpeedSampleRate;

  window._gaq = window._gaq || [];
  push('_setAccount', opts.trackingId);
  push('_setAllowLinker', true);

  if (anonymize) push('_gat._anonymizeIp');
  if (domain) push('_setDomainName', domain);
  if (sample) push('_setSiteSpeedSampleRate', sample);

  if (enhanced) {
    var protocol = document.location.protocol === 'https:' ? 'https:' : 'http:';
    var pluginUrl = protocol + '//www.google-analytics.com/plugins/ga/inpage_linkid.js';
    push('_require', 'inpage_linkid', pluginUrl);
  }

  if (ignore) {
    if (!is.array(ignore)) ignore = [ignore];
    each(ignore, function(domain) {
      push('_addIgnoredRef', domain);
    });
  }

  if (this.options.doubleClick) {
    this.load('double click', this.ready);
  } else {
    var name = useHttps() ? 'https' : 'http';
    this.load(name, this.ready);
  }
};

/**
 * Loaded? (classic)
 *
 * @return {Boolean}
 */

GA.prototype.loadedClassic = function() {
  return !!(window._gaq && window._gaq.push !== Array.prototype.push);
};

/**
 * Page (classic).
 *
 * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiBasicConfiguration
 *
 * @param {Page} page
 */

GA.prototype.pageClassic = function(page) {
  var category = page.category();
  var props = page.properties();
  var name = page.fullName();
  var track;

  push('_trackPageview', path(props, this.options));

  // categorized pages
  if (category && this.options.trackCategorizedPages) {
    track = page.track(category);
    this.track(track, { nonInteraction: 1 });
  }

  // named pages
  if (name && this.options.trackNamedPages) {
    track = page.track(name);
    this.track(track, { nonInteraction: 1 });
  }
};

/**
 * Track (classic).
 *
 * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiEventTracking
 *
 * @param {Track} track
 */

GA.prototype.trackClassic = function(track, options) {
  var opts = options || track.options(this.name);
  var props = track.properties();
  var revenue = track.revenue();
  var event = track.event();
  var category = this._category || props.category || 'All';
  var label = props.label;
  var value = formatValue(revenue || props.value);
  var nonInteraction = !!(props.nonInteraction || opts.nonInteraction);
  push('_trackEvent', category, event, label, value, nonInteraction);
};

/**
 * Completed order.
 *
 * https://developers.google.com/analytics/devguides/collection/gajs/gaTrackingEcommerce
 * https://developers.google.com/analytics/devguides/collection/gajs/gaTrackingEcommerce#localcurrencies
 *
 * @param {Track} track
 * @api private
 */

GA.prototype.completedOrderClassic = function(track) {
  var total = track.total() || track.revenue() || 0;
  var orderId = track.orderId();
  var products = track.products() || [];
  var props = track.properties();
  var currency = track.currency();

  // required
  if (!orderId) return;

  // add transaction
  push('_addTrans',
    orderId,
    props.affiliation,
    total,
    track.tax(),
    track.shipping(),
    track.city(),
    track.state(),
    track.country());

  // add items
  each(products, function(product) {
    var track = new Track({ properties: product });
    push('_addItem',
      orderId,
      track.sku(),
      track.name(),
      track.category(),
      track.price(),
      track.quantity());
  });

  // send
  push('_set', 'currencyCode', currency);
  push('_trackTrans');
};

/**
 * Return the path based on `properties` and `options`.
 *
 * @param {Object} properties
 * @param {Object} options
 * @return {string|undefined}
 */

function path(properties, options) {
  if (!properties) return;
  var str = properties.path;
  if (options.includeSearch && properties.search) str += properties.search;
  return str;
}

/**
 * Format the value property to Google's liking.
 *
 * @param {Number} value
 * @return {Number}
 */

function formatValue(value) {
  if (!value || value < 0) return 0;
  return Math.round(value);
}

/**
 * Map google's custom dimensions & metrics with `obj`.
 *
 * Example:
 *
 *      metrics({ revenue: 1.9 }, { { metrics : { revenue: 'metric8' } });
 *      // => { metric8: 1.9 }
 *
 *      metrics({ revenue: 1.9 }, {});
 *      // => {}
 *
 * @param {Object} obj
 * @param {Object} data
 * @return {Object|null}
 * @api private
 */

function metrics(obj, data) {
  var dimensions = data.dimensions;
  var metrics = data.metrics;
  var names = keys(metrics).concat(keys(dimensions));
  var ret = {};

  for (var i = 0; i < names.length; ++i) {
    var name = names[i];
    var key = metrics[name] || dimensions[name];
    var value = dot(obj, name) || obj[name];
    if (value == null) continue;
    if (is.boolean(value)) value = value.toString();
    ret[key] = value;
  }

  return ret;
}

/**
 * Loads ec.js (unless already loaded)
 *
 * @param {Track} track
 */

GA.prototype.loadEnhancedEcommerce = function(track) {
  if (!this.enhancedEcommerceLoaded) {
    window.ga('require', 'ec');
    this.enhancedEcommerceLoaded = true;
  }

  // Ensure we set currency for every hit
  window.ga('set', '&cu', track.currency());
};

/**
 * Pushes an event and all previously set EE data to GA.
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.pushEnhancedEcommerce = function(track) {
  // Send a custom non-interaction event to ensure all EE data is pushed.
  // Without doing this we'd need to require page display after setting EE data.
  var args = select([
    'send',
    'event',
    track.category() || 'EnhancedEcommerce',
    track.event() || 'Action not defined',
    track.properties().label,
    { nonInteraction: 1 }
    ], function(n){ return n !== undefined; });
  window.ga.apply(window, args);
};

/**
 * Started order - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#checkout-steps
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.startedOrderEnhanced = function(track) {
  // same as viewed checkout step #1
  this.viewedCheckoutStep(track);
};

/**
 * Updated order - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#checkout-steps
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.updatedOrderEnhanced = function(track) {
  // Same event as started order - will override
  this.startedOrderEnhanced(track);
};

/**
 * Viewed checkout step - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#checkout-steps
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.viewedCheckoutStepEnhanced = function(track) {
  var products = track.products();
  var props = track.properties();
  var options = extractCheckoutOptions(props);

  this.loadEnhancedEcommerce(track);

  each(products, function(product) {
    var productTrack = createProductTrack(track, product);
    enhancedEcommerceTrackProduct(productTrack);
  });

  window.ga('ec:setAction', 'checkout', {
    step: props.step || 1,
    option: options || undefined
  });

  this.pushEnhancedEcommerce(track);
};

/**
 * Completed checkout step - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#checkout-options
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.completedCheckoutStepEnhanced = function(track) {
  var props = track.properties();
  var options = extractCheckoutOptions(props);

  // Only send an event if we have step and options to update
  if (!props.step || !options) return;

  this.loadEnhancedEcommerce(track);

  window.ga('ec:setAction', 'checkout_option', {
    step: props.step || 1,
    option: options
  });

  window.ga('send', 'event', 'Checkout', 'Option');
};

/**
 * Completed order - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-transactions
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.completedOrderEnhanced = function(track) {
  var total = track.total() || track.revenue() || 0;
  var orderId = track.orderId();
  var products = track.products();
  var props = track.properties();

  // orderId is required.
  if (!orderId) return;

  this.loadEnhancedEcommerce(track);

  each(products, function(product) {
    var productTrack = createProductTrack(track, product);
    enhancedEcommerceTrackProduct(productTrack);
  });

  window.ga('ec:setAction', 'purchase', {
    id: orderId,
    affiliation: props.affiliation,
    revenue: total,
    tax: track.tax(),
    shipping: track.shipping(),
    coupon: track.coupon()
  });

  this.pushEnhancedEcommerce(track);
};

/**
 * Refunded order - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-refunds
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.refundedOrderEnhanced = function(track) {
  var orderId = track.orderId();
  var products = track.products();

  // orderId is required.
  if (!orderId) return;

  this.loadEnhancedEcommerce(track);

  // Without any products it's a full refund
  each(products, function(product) {
    var track = new Track({ properties: product });
    window.ga('ec:addProduct', {
      id: track.id() || track.sku(),
      quantity: track.quantity()
    });
  });

  window.ga('ec:setAction', 'refund', {
    id: orderId
  });

  this.pushEnhancedEcommerce(track);
};

/**
 * Added product - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#add-remove-cart
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.addedProductEnhanced = function(track) {
  this.loadEnhancedEcommerce(track);
  enhancedEcommerceProductAction(track, 'add');
  this.pushEnhancedEcommerce(track);
};

/**
 * Removed product - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#add-remove-cart
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.removedProductEnhanced = function(track) {
  this.loadEnhancedEcommerce(track);
  enhancedEcommerceProductAction(track, 'remove');
  this.pushEnhancedEcommerce(track);
};

/**
 * Viewed product details - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#product-detail-view
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.viewedProductEnhanced = function(track) {
  this.loadEnhancedEcommerce(track);
  enhancedEcommerceProductAction(track, 'detail');
  this.pushEnhancedEcommerce(track);
};

/**
 * Clicked product - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-actions
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.clickedProductEnhanced = function(track) {
  var props = track.properties();

  this.loadEnhancedEcommerce(track);
  enhancedEcommerceProductAction(track, 'click', {
    list: props.list
  });
  this.pushEnhancedEcommerce(track);
};

/**
 * Viewed promotion - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-promo-impressions
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.viewedPromotionEnhanced = function(track) {
  var props = track.properties();

  this.loadEnhancedEcommerce(track);
  window.ga('ec:addPromo', {
    id: track.id(),
    name: track.name(),
    creative: props.creative,
    position: props.position
  });
  this.pushEnhancedEcommerce(track);
};

/**
 * Clicked promotion - Enhanced Ecommerce
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-promo-clicks
 *
 * @api private
 * @param {Track} track
 */

GA.prototype.clickedPromotionEnhanced = function(track) {
  var props = track.properties();

  this.loadEnhancedEcommerce(track);
  window.ga('ec:addPromo', {
    id: track.id(),
    name: track.name(),
    creative: props.creative,
    position: props.position
  });
  window.ga('ec:setAction', 'promo_click', {});
  this.pushEnhancedEcommerce(track);
};

/**
 * Enhanced ecommerce track product.
 *
 * Simple helper so that we don't repeat `ec:addProduct` everywhere.
 *
 * @api private
 * @param {Track} track
 */

function enhancedEcommerceTrackProduct(track) {
  var props = track.properties();
  var product = {
    id: track.id() || track.sku(),
    name: track.name(),
    category: track.category(),
    quantity: track.quantity(),
    price: track.price(),
    brand: props.brand,
    variant: props.variant,
    currency: track.currency()
  };

  // append coupon if it set
  // https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-transactions
  var coupon = track.proxy('properties.coupon');
  if (coupon) product.coupon = coupon;
  window.ga('ec:addProduct', product);
}

/**
 * Set `action` on `track` with `data`.
 *
 * @api private
 * @param {Track} track
 * @param {String} action
 * @param {Object} data
 */

function enhancedEcommerceProductAction(track, action, data) {
  enhancedEcommerceTrackProduct(track);
  window.ga('ec:setAction', action, data || {});
}

/**
 * Extracts checkout options.
 *
 * @api private
 * @param {Object} props
 * @return {string|null}
 */

function extractCheckoutOptions(props) {
  var options = [
    props.paymentMethod,
    props.shippingMethod
  ];

  // Remove all nulls, empty strings, zeroes, and join with commas.
  var valid = select(options, function(e) {return e; });
  return valid.length > 0 ? valid.join(', ') : null;
}

/**
 * Creates a track out of product properties.
 *
 * @api private
 * @param {Track} track
 * @param {Object} properties
 * @return {Track}
 */

function createProductTrack(track, properties) {
  properties.currency = properties.currency || track.currency();
  return new Track({ properties: properties });
}

}, {"facade":10,"defaults":120,"obj-case":45,"each":18,"analytics.js-integration":3,"is":21,"object":23,"global-queue":121,"select":122,"use-https":123}],
120: [function(require, module, exports) {
/**
 * Expose `defaults`.
 */
module.exports = defaults;

function defaults (dest, defaults) {
  for (var prop in defaults) {
    if (! (prop in dest)) {
      dest[prop] = defaults[prop];
    }
  }

  return dest;
};

}, {}],
121: [function(require, module, exports) {

/**
 * Expose `generate`.
 */

module.exports = generate;


/**
 * Generate a global queue pushing method with `name`.
 *
 * @param {String} name
 * @param {Object} options
 *   @property {Boolean} wrap
 * @return {Function}
 */

function generate (name, options) {
  options = options || {};

  return function (args) {
    args = [].slice.call(arguments);
    window[name] || (window[name] = []);
    options.wrap === false
      ? window[name].push.apply(window[name], args)
      : window[name].push(args);
  };
}
}, {}],
122: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var toFunction = require('to-function');

/**
 * Filter the given `arr` with callback `fn(val, i)`,
 * when a truthy value is return then `val` is included
 * in the array returned.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @return {Array}
 * @api public
 */

module.exports = function(arr, fn){
  var ret = [];
  fn = toFunction(fn);
  for (var i = 0; i < arr.length; ++i) {
    if (fn(arr[i], i)) {
      ret.push(arr[i]);
    }
  }
  return ret;
};

}, {"to-function":77}],
123: [function(require, module, exports) {

/**
 * Protocol.
 */

module.exports = function (url) {
  switch (arguments.length) {
    case 0: return check();
    case 1: return transform(url);
  }
};


/**
 * Transform a protocol-relative `url` to the use the proper protocol.
 *
 * @param {String} url
 * @return {String}
 */

function transform (url) {
  return check() ? 'https:' + url : 'http:' + url;
}


/**
 * Check whether `https:` be used for loading scripts.
 *
 * @return {Boolean}
 */

function check () {
  return (
    location.protocol == 'https:' ||
    location.protocol == 'chrome-extension:'
  );
}
}, {}]}, {}, {"1":""})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9yZXF1aXJlLmpzIiwiL3Rlc3QvaW5kZXgudGVzdC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hbmFseXRpY3MuanMtY29yZUAyLjExLjAvbGliL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1jb3JlQDIuMTEuMC9saWIvYW5hbHl0aWNzLmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LWVtaXR0ZXJAMS4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtaW5kZXhvZkAwLjAuMy9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1mYWNhZGVAMS41LjAvbGliL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWZhY2FkZUAxLjUuMC9saWIvZmFjYWRlLmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWlzb2RhdGUtdHJhdmVyc2VAMC4zLjMvaW5kZXguanMiLCIvY29tcG9uZW50cy9pYW5zdG9ybXRheWxvci1pc0AwLjEuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL2lhbnN0b3JtdGF5bG9yLWlzLWVtcHR5QDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXR5cGVAMS4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8taXNvZGF0ZUAwLjAuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1lYWNoQDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWZhY2FkZUAxLjUuMC9saWIvaXMtZW5hYmxlZC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1mYWNhZGVAMS41LjAvbGliL3V0aWxzLmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LWluaGVyaXRAMC4wLjMvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtY2xvbmVAMC4yLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tZmFjYWRlQDEuNS4wL2xpYi9hZGRyZXNzLmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLW9iai1jYXNlQDAuMi4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLW5ldy1kYXRlQDAuMy4xL2xpYi9pbmRleC5qcyIsIi9jb21wb25lbnRzL2lhbnN0b3JtdGF5bG9yLWlzQDAuMC41L2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLW5ldy1kYXRlQDAuMy4xL2xpYi9taWxsaXNlY29uZHMuanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tbmV3LWRhdGVAMC4zLjEvbGliL3NlY29uZHMuanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tZmFjYWRlQDEuNS4wL2xpYi9hbGlhcy5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1mYWNhZGVAMS41LjAvbGliL2dyb3VwLmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWlzLWVtYWlsQDAuMS4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWZhY2FkZUAxLjUuMC9saWIvaWRlbnRpZnkuanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtdHJpbUAwLjAuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1mYWNhZGVAMS41LjAvbGliL3RyYWNrLmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWZhY2FkZUAxLjUuMC9saWIvcGFnZS5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1mYWNhZGVAMS41LjAvbGliL3NjcmVlbi5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hZnRlckAwLjAuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL2lhbnN0b3JtdGF5bG9yLWJpbmRAMC4wLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtYmluZEAxLjAuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1iaW5kLWFsbEAwLjAuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL2lhbnN0b3JtdGF5bG9yLWNhbGxiYWNrQDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvdGltb3hsZXktbmV4dC10aWNrQDAuMC4yL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LWNsb25lQDAuMS4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1jb3JlQDIuMTEuMC9saWIvY29va2llLmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LWNvb2tpZUAxLjEuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL3Zpc2lvbm1lZGlhLWRlYnVnQDAuNy40L2luZGV4LmpzIiwiL2NvbXBvbmVudHMvdmlzaW9ubWVkaWEtZGVidWdAMC43LjQvbGliL2RlYnVnLmpzIiwiL2NvbXBvbmVudHMvdmlzaW9ubWVkaWEtZGVidWdAMC43LjQvZGVidWcuanMiLCIvY29tcG9uZW50cy9hdmV0aXNrLWRlZmF1bHRzQDAuMC40L2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWpzb25AMS4wLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtanNvbi1mYWxsYmFja0AxLjAuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby10b3AtZG9tYWluQDIuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXVybEB2MC4yLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtY29va2llQDEuMS4yL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvbmRob3VsZS1mb2xkbEAxLjAuMy9pbmRleC5qcyIsIi9jb21wb25lbnRzL25kaG91bGUtZWFjaEAxLjAuMy9pbmRleC5qcyIsIi9jb21wb25lbnRzL25kaG91bGUta2V5c0AxLjEuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hbmFseXRpY3MuanMtY29yZUAyLjExLjAvbGliL2dyb3VwLmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1jb3JlQDIuMTEuMC9saWIvZW50aXR5LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWV4dGVuZEAwLjAuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hbmFseXRpY3MuanMtY29yZUAyLjExLjAvbGliL21lbW9yeS5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hbmFseXRpY3MuanMtY29yZUAyLjExLjAvbGliL3N0b3JlLmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLXN0b3JlLmpzQDIuMC4wL3N0b3JlLmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LWluaGVyaXRAMC4wLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy9pYW5zdG9ybXRheWxvci1pc0AwLjEuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1pcy1tZXRhQDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LW9iamVjdEAwLjAuMy9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hbmFseXRpY3MuanMtY29yZUAyLjExLjAvbGliL25vcm1hbGl6ZS5qcyIsIi9jb21wb25lbnRzL25kaG91bGUtaW5jbHVkZXNAMS4wLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtbWFwQDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXRvLWZ1bmN0aW9uQDIuMC42L2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXByb3BzQDEuMS4yL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LWV2ZW50QDAuMS4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1jb3JlQDIuMTEuMC9saWIvcGFnZURlZmF1bHRzLmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWNhbm9uaWNhbEAwLjAuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC11cmxAMC4yLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9uZGhvdWxlLXBpY2tAMS4wLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtcHJldmVudEAwLjAuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1xdWVyeXN0cmluZ0AyLjAuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hbmFseXRpY3MuanMtY29yZUAyLjExLjAvbGliL3VzZXIuanMiLCIvY29tcG9uZW50cy9nam9obnNvbi11dWlkQDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1jb3JlQDIuMTEuMC9ib3dlci5qc29uIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1pbnRlZ3JhdGlvbkAxLjAuMS9saWIvaW5kZXguanMiLCIvY29tcG9uZW50cy9pYW5zdG9ybXRheWxvci1iaW5kQDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvdmlzaW9ubWVkaWEtZGVidWdAMC43LjMvaW5kZXguanMiLCIvY29tcG9uZW50cy92aXNpb25tZWRpYS1kZWJ1Z0AwLjcuMy9saWIvZGVidWcuanMiLCIvY29tcG9uZW50cy92aXNpb25tZWRpYS1kZWJ1Z0AwLjcuMy9kZWJ1Zy5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1leHRlbmRAMS4wLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtc2x1Z0AxLjEuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1hbmFseXRpY3MuanMtaW50ZWdyYXRpb25AMS4wLjEvbGliL3Byb3Rvcy5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1lYWNoQDAuMi42L2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXR5cGVAMS4wLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tYW5hbHl0aWNzLWV2ZW50c0AxLjIuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3lpZWxkcy1mbXRAMC4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tbG9hZC1pZnJhbWVAMC4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tc2NyaXB0LW9ubG9hZEAxLjAuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1sb2FkLXNjcmlwdEAwLjEuMy9pbmRleC5qcyIsIi9jb21wb25lbnRzL2lhbnN0b3JtdGF5bG9yLXRvLW5vLWNhc2VAMC4xLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy9uZGhvdWxlLWV2ZXJ5QDEuMC4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LWlzQDAuMS4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWFuYWx5dGljcy5qcy1pbnRlZ3JhdGlvbkAxLjAuMS9saWIvc3RhdGljcy5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1kb21pZnlAMS4zLjMvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tY2xlYXItZW52QDAuMi4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWNsZWFyLWFqYXhAMC4wLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtY2xlYXItdGltZW91dHNAMC4wLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtY2xlYXItaW50ZXJ2YWxzQDAuMC4zL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWNsZWFyLWxpc3RlbmVyc0AwLjEuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1jbGVhci1nbG9iYWxzQDAuMS4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWNsZWFyLWltYWdlc0AwLjEuMC9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1jbGVhci1zY3JpcHRzQDAuMi4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvY29tcG9uZW50LXF1ZXJ5QDAuMC4zL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLWNsZWFyLWNvb2tpZXNAMC4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9zZWdtZW50aW8tYW5hbHl0aWNzLmpzLWludGVncmF0aW9uLXRlc3RlckAxLjQuMi9pbmRleC5qcyIsIi9jb21wb25lbnRzL2NvbXBvbmVudC1hc3NlcnRAMC41LjEvaW5kZXguanMiLCIvY29tcG9uZW50cy9qa3Jvc28tZXF1YWxzQDEuMC4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvamtyb3NvLXR5cGVAMS4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtc3RhY2tAMC4wLjEvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtZG9taWZ5QDEuNC4wL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLXN0dWJAMC4xLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtbWVyZ2VAMS4wLjAvaW5kZXguanMiLCIvY29tcG9uZW50cy95aWVsZHMtZXFsQDAuMC4yL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvbWF0dGhld3Ata2V5c0AwLjAuMy9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1zcHlAMC4zLjAvaW5kZXguanMiLCIvbGliL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvYXZldGlzay1kZWZhdWx0c0AwLjAuMS9pbmRleC5qcyIsIi9jb21wb25lbnRzL3NlZ21lbnRpby1nbG9iYWwtcXVldWVAMC4wLjIvaW5kZXguanMiLCIvY29tcG9uZW50cy9jb21wb25lbnQtc2VsZWN0QDAuMC4xL2luZGV4LmpzIiwiL2NvbXBvbmVudHMvc2VnbWVudGlvLXVzZS1odHRwc0AwLjEuMC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0L0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDanJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdmVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcmVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDejRCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InRlc3QvaW5kZXgudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIvZHVvIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIG91dGVyKG1vZHVsZXMsIGNhY2hlLCBlbnRyaWVzKXtcblxuICAvKipcbiAgICogR2xvYmFsXG4gICAqL1xuXG4gIHZhciBnbG9iYWwgPSAoZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXM7IH0pKCk7XG5cbiAgLyoqXG4gICAqIFJlcXVpcmUgYG5hbWVgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiByZXF1aXJlKG5hbWUpe1xuICAgIGlmIChjYWNoZVtuYW1lXSkgcmV0dXJuIGNhY2hlW25hbWVdLmV4cG9ydHM7XG4gICAgaWYgKG1vZHVsZXNbbmFtZV0pIHJldHVybiBjYWxsKG5hbWUsIHJlcXVpcmUpO1xuICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgbW9kdWxlIFwiJyArIG5hbWUgKyAnXCInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsIG1vZHVsZSBgaWRgIGFuZCBjYWNoZSBpdC5cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGlkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHJlcXVpcmVcbiAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBmdW5jdGlvbiBjYWxsKGlkLCByZXF1aXJlKXtcbiAgICB2YXIgbSA9IGNhY2hlW2lkXSA9IHsgZXhwb3J0czoge30gfTtcbiAgICB2YXIgbW9kID0gbW9kdWxlc1tpZF07XG4gICAgdmFyIG5hbWUgPSBtb2RbMl07XG4gICAgdmFyIGZuID0gbW9kWzBdO1xuICAgIHZhciB0aHJldyA9IHRydWU7XG5cbiAgICB0cnkge1xuICAgICAgZm4uY2FsbChtLmV4cG9ydHMsIGZ1bmN0aW9uKHJlcSl7XG4gICAgICAgIHZhciBkZXAgPSBtb2R1bGVzW2lkXVsxXVtyZXFdO1xuICAgICAgICByZXR1cm4gcmVxdWlyZShkZXAgfHwgcmVxKTtcbiAgICAgIH0sIG0sIG0uZXhwb3J0cywgb3V0ZXIsIG1vZHVsZXMsIGNhY2hlLCBlbnRyaWVzKTtcbiAgICAgIHRocmV3ID0gZmFsc2U7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmICh0aHJldykge1xuICAgICAgICBkZWxldGUgY2FjaGVbaWRdO1xuICAgICAgfSBlbHNlIGlmIChuYW1lKSB7XG4gICAgICAgIC8vIGV4cG9zZSBhcyAnbmFtZScuXG4gICAgICAgIGNhY2hlW25hbWVdID0gY2FjaGVbaWRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjYWNoZVtpZF0uZXhwb3J0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1aXJlIGFsbCBlbnRyaWVzIGV4cG9zaW5nIHRoZW0gb24gZ2xvYmFsIGlmIG5lZWRlZC5cbiAgICovXG5cbiAgZm9yICh2YXIgaWQgaW4gZW50cmllcykge1xuICAgIGlmIChlbnRyaWVzW2lkXSkge1xuICAgICAgZ2xvYmFsW2VudHJpZXNbaWRdXSA9IHJlcXVpcmUoaWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXF1aXJlKGlkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHVvIGZsYWcuXG4gICAqL1xuXG4gIHJlcXVpcmUuZHVvID0gdHJ1ZTtcblxuICAvKipcbiAgICogRXhwb3NlIGNhY2hlLlxuICAgKi9cblxuICByZXF1aXJlLmNhY2hlID0gY2FjaGU7XG5cbiAgLyoqXG4gICAqIEV4cG9zZSBtb2R1bGVzXG4gICAqL1xuXG4gIHJlcXVpcmUubW9kdWxlcyA9IG1vZHVsZXM7XG5cbiAgLyoqXG4gICAqIFJldHVybiBuZXdlc3QgcmVxdWlyZS5cbiAgICovXG5cbiAgIHJldHVybiByZXF1aXJlO1xufSkiLCJcbnZhciBBbmFseXRpY3MgPSByZXF1aXJlKCdhbmFseXRpY3MuanMtY29yZScpLmNvbnN0cnVjdG9yO1xudmFyIGludGVncmF0aW9uID0gcmVxdWlyZSgnYW5hbHl0aWNzLmpzLWludGVncmF0aW9uJyk7XG52YXIgc2FuZGJveCA9IHJlcXVpcmUoJ2NsZWFyLWVudicpO1xudmFyIHRlc3RlciA9IHJlcXVpcmUoJ2FuYWx5dGljcy5qcy1pbnRlZ3JhdGlvbi10ZXN0ZXInKTtcbnZhciBwbHVnaW4gPSByZXF1aXJlKCcuLi9saWIvJyk7XG5cbmRlc2NyaWJlKCdHb29nbGUgQW5hbHl0aWNzJywgZnVuY3Rpb24oKSB7XG4gIHZhciBHQSA9IHBsdWdpbi5JbnRlZ3JhdGlvbjtcbiAgdmFyIGFuYWx5dGljcztcbiAgdmFyIGdhO1xuXG4gIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgYW5hbHl0aWNzID0gbmV3IEFuYWx5dGljcygpO1xuICAgIGFuYWx5dGljcy51c2UocGx1Z2luKTtcbiAgICBhbmFseXRpY3MudXNlKHRlc3Rlcik7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaChmdW5jdGlvbigpIHtcbiAgICBhbmFseXRpY3MucmVzdG9yZSgpO1xuICAgIGFuYWx5dGljcy5yZXNldCgpO1xuICAgIHNhbmRib3goKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBoYXZlIHRoZSByaWdodCBzZXR0aW5ncycsIGZ1bmN0aW9uKCkge1xuICAgIGFuYWx5dGljcy5jb21wYXJlKEdBLCBpbnRlZ3JhdGlvbignR29vZ2xlIEFuYWx5dGljcycpXG4gICAgICAucmVhZHlPbkxvYWQoKVxuICAgICAgLmdsb2JhbCgnZ2EnKVxuICAgICAgLmdsb2JhbCgnZ2FwbHVnaW5zJylcbiAgICAgIC5nbG9iYWwoJ19nYXEnKVxuICAgICAgLmdsb2JhbCgnR29vZ2xlQW5hbHl0aWNzT2JqZWN0JylcbiAgICAgIC5vcHRpb24oJ2Fub255bWl6ZUlwJywgZmFsc2UpXG4gICAgICAub3B0aW9uKCdjbGFzc2ljJywgZmFsc2UpXG4gICAgICAub3B0aW9uKCdkaW1lbnNpb25zJywge30pXG4gICAgICAub3B0aW9uKCdkb21haW4nLCAnYXV0bycpXG4gICAgICAub3B0aW9uKCdkb3VibGVDbGljaycsIGZhbHNlKVxuICAgICAgLm9wdGlvbignZW5oYW5jZWRFY29tbWVyY2UnLCBmYWxzZSlcbiAgICAgIC5vcHRpb24oJ2VuaGFuY2VkTGlua0F0dHJpYnV0aW9uJywgZmFsc2UpXG4gICAgICAub3B0aW9uKCdpZ25vcmVkUmVmZXJyZXJzJywgbnVsbClcbiAgICAgIC5vcHRpb24oJ2luY2x1ZGVTZWFyY2gnLCBmYWxzZSlcbiAgICAgIC5vcHRpb24oJ21ldHJpY3MnLCB7fSlcbiAgICAgIC5vcHRpb24oJ25vbkludGVyYWN0aW9uJywgZmFsc2UpXG4gICAgICAub3B0aW9uKCdzZW5kVXNlcklkJywgZmFsc2UpXG4gICAgICAub3B0aW9uKCdzaXRlU3BlZWRTYW1wbGVSYXRlJywgMSlcbiAgICAgIC5vcHRpb24oJ3RyYWNrQ2F0ZWdvcml6ZWRQYWdlcycsIHRydWUpXG4gICAgICAub3B0aW9uKCd0cmFja05hbWVkUGFnZXMnLCB0cnVlKVxuICAgICAgLm9wdGlvbigndHJhY2tpbmdJZCcsICcnKSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdVbml2ZXJzYWwnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2V0dGluZ3MgPSB7XG4gICAgICBhbm9ueW1pemVJcDogdHJ1ZSxcbiAgICAgIGRvbWFpbjogJ2F1dG8nLFxuICAgICAgc2l0ZVNwZWVkU2FtcGxlUmF0ZTogNDIsXG4gICAgICB0cmFja2luZ0lkOiAnVUEtMjcwMzM3MDktMTInXG4gICAgfTtcblxuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgICBnYSA9IG5ldyBHQShzZXR0aW5ncyk7XG4gICAgICBhbmFseXRpY3MuYWRkKGdhKTtcbiAgICB9KTtcblxuICAgIGFmdGVyRWFjaChmdW5jdGlvbigpIHtcbiAgICAgIGdhLnJlc2V0KCk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnYmVmb3JlIGxvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5zdHViKGdhLCAnbG9hZCcpO1xuICAgICAgfSk7XG5cbiAgICAgIGRlc2NyaWJlKCcjaW5pdGlhbGl6ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpdCgnc2hvdWxkIHJlcXVpcmUgXFwnZGlzcGxheWZlYXR1cmVzXFwnIGlmIC5kb3VibGVDbGljayBvcHRpb24gaXMgYHRydWVgJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5kb3VibGVDbGljayA9IHRydWU7XG4gICAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLnFbMV0sIFsncmVxdWlyZScsICdkaXNwbGF5ZmVhdHVyZXMnXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgcmVxdWlyZSBcImxpbmtpZC5qc1wiIGlmIGVuaGFuY2VkIGxpbmsgYXR0cmlidXRpb24gaXMgYHRydWVgJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5lbmhhbmNlZExpbmtBdHRyaWJ1dGlvbiA9IHRydWU7XG4gICAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLnFbMV0sIFsncmVxdWlyZScsICdsaW5raWQnLCAnbGlua2lkLmpzJ10pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIGNyZWF0ZSB3aW5kb3cuR29vZ2xlQW5hbHl0aWNzT2JqZWN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCghd2luZG93Lkdvb2dsZUFuYWx5dGljc09iamVjdCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93Lkdvb2dsZUFuYWx5dGljc09iamVjdCA9PT0gJ2dhJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgY3JlYXRlIHdpbmRvdy5nYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQoIXdpbmRvdy5nYSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQodHlwZW9mIHdpbmRvdy5nYSA9PT0gJ2Z1bmN0aW9uJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgY3JlYXRlIHdpbmRvdy5nYS5sJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCghd2luZG93LmdhKTtcbiAgICAgICAgICBhbmFseXRpY3MuaW5pdGlhbGl6ZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh0eXBlb2Ygd2luZG93LmdhLmwgPT09ICdudW1iZXInKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBjYWxsIHdpbmRvdy5nYS5jcmVhdGUgd2l0aCBvcHRpb25zJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwod2luZG93LmdhLnFbMF0pLCBbJ2NyZWF0ZScsIHNldHRpbmdzLnRyYWNraW5nSWQsIHtcbiAgICAgICAgICAgIGNvb2tpZURvbWFpbjogJ25vbmUnLFxuICAgICAgICAgICAgc2l0ZVNwZWVkU2FtcGxlUmF0ZTogc2V0dGluZ3Muc2l0ZVNwZWVkU2FtcGxlUmF0ZSxcbiAgICAgICAgICAgIGFsbG93TGlua2VyOiB0cnVlXG4gICAgICAgICAgfV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIGFub255bWl6ZSB0aGUgaXAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MuaW5pdGlhbGl6ZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EucVsxXSwgWydzZXQnLCAnYW5vbnltaXplSXAnLCB0cnVlXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgY2FsbCAjbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKGdhLmxvYWQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIG5vdCBzZW5kIHVuaXZlcnNhbCB1c2VyIGlkIGJ5IGRlZmF1bHQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MudXNlcigpLmlkKCdiYXonKTtcbiAgICAgICAgICBhbmFseXRpY3MuaW5pdGlhbGl6ZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLm5vdERlZXBFcXVhbCh3aW5kb3cuZ2EucVsxXSwgWydzZXQnLCAndXNlcklkJywgJ2JheiddKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIHVuaXZlcnNhbCB1c2VyIGlkIGlmIHNlbmRVc2VySWQgb3B0aW9uIGlzIHRydWUgYW5kIHVzZXIuaWQoKSBpcyB0cnV0aHknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MudXNlcigpLmlkKCdiYXonKTtcbiAgICAgICAgICBnYS5vcHRpb25zLnNlbmRVc2VySWQgPSB0cnVlO1xuICAgICAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5xWzFdLCBbJ3NldCcsICd1c2VySWQnLCAnYmF6J10pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIG1hcCBjdXN0b20gZGltZW5zaW9ucyAmIG1ldHJpY3MgdXNpbmcgdXNlci50cmFpdHMoKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdhLm9wdGlvbnMubWV0cmljcyA9IHsgZmlyc3ROYW1lOiAnbWV0cmljMScsIGxhc3RfbmFtZTogJ21ldHJpYzInLCBmb286ICdtZXRyaWMzJyB9O1xuICAgICAgICAgIGdhLm9wdGlvbnMuZGltZW5zaW9ucyA9IHsgQWdlOiAnZGltZW5zaW9uMicsIGJhcjogJ2RpbWVuc2lvbjMnIH07XG4gICAgICAgICAgYW5hbHl0aWNzLnVzZXIoKS50cmFpdHMoeyBmaXJzdE5hbWU6ICdKb2huJywgbGFzdE5hbWU6ICdEb2UnLCBhZ2U6IDIwLCBmb286IHRydWUsIGJhcjogZmFsc2UgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgpO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EucVsyXSwgWydzZXQnLCB7XG4gICAgICAgICAgICBtZXRyaWMxOiAnSm9obicsXG4gICAgICAgICAgICBtZXRyaWMyOiAnRG9lJyxcbiAgICAgICAgICAgIG1ldHJpYzM6ICd0cnVlJyxcbiAgICAgICAgICAgIGRpbWVuc2lvbjI6IDIwLFxuICAgICAgICAgICAgZGltZW5zaW9uMzogJ2ZhbHNlJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBub3Qgc2V0IG1ldHJpY3MgYW5kIGRpbWVuc2lvbnMgaWYgdGhlcmUgYXJlIG5vIHRyYWl0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdhLm9wdGlvbnMubWV0cmljcyA9IHsgbWV0cmljMTogJ3NvbWV0aGluZycgfTtcbiAgICAgICAgICBnYS5vcHRpb25zLmRpbWVuc2lvbnMgPSB7IGRpbWVuc2lvbjM6ICdpbmR1c3RyeScgfTtcbiAgICAgICAgICBhbmFseXRpY3MuaW5pdGlhbGl6ZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EucVsyXSwgdW5kZWZpbmVkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZXQgbWV0cmljcyBhbmQgZGltZW5zaW9ucyB0aGF0IGhhdmUgZG90cyBidXQgYXJlbnQgbmVzdGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5tZXRyaWNzID0geyAnbmFtZS5maXJzdCc6ICdtZXRyaWMxJywgJ25hbWUubGFzdCc6ICdtZXRyaWMyJyB9O1xuICAgICAgICAgIGdhLm9wdGlvbnMuZGltZW5zaW9ucyA9IHsgQWdlOiAnZGltZW5zaW9uMicgfTtcbiAgICAgICAgICBhbmFseXRpY3MudXNlcigpLnRyYWl0cyh7ICduYW1lLmZpcnN0JzogJ0pvaG4nLCAnbmFtZS5sYXN0JzogJ0RvZScsIGFnZTogMjAgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgpO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EucVsyXSwgWydzZXQnLCB7XG4gICAgICAgICAgICBtZXRyaWMxOiAnSm9obicsXG4gICAgICAgICAgICBtZXRyaWMyOiAnRG9lJyxcbiAgICAgICAgICAgIGRpbWVuc2lvbjI6IDIwXG4gICAgICAgICAgfV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNldCBtZXRyaWNzIGFuZCBkaW1lbnNpb25zIHRoYXQgYXJlIG5lc3RlZCwgdXNpbmcgZG90IG5vdGF0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5tZXRyaWNzID0geyAnbmFtZS5maXJzdCc6ICdtZXRyaWMxJywgJ25hbWUubGFzdCc6ICdtZXRyaWMyJyB9O1xuICAgICAgICAgIGdhLm9wdGlvbnMuZGltZW5zaW9ucyA9IHsgQWdlOiAnZGltZW5zaW9uMicgfTtcbiAgICAgICAgICBhbmFseXRpY3MudXNlcigpLnRyYWl0cyh7XG4gICAgICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICAgIGZpcnN0OiAnSm9obicsXG4gICAgICAgICAgICAgIGxhc3Q6ICdEb2UnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWdlOiAyMFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcblxuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLnFbMl0sIFsnc2V0Jywge1xuICAgICAgICAgICAgbWV0cmljMTogJ0pvaG4nLFxuICAgICAgICAgICAgbWV0cmljMjogJ0RvZScsXG4gICAgICAgICAgICBkaW1lbnNpb24yOiAyMFxuICAgICAgICAgIH1dKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdsb2FkaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBpdCgnc2hvdWxkIGxvYWQnLCBmdW5jdGlvbihkb25lKSB7XG4gICAgICAgIGFuYWx5dGljcy5sb2FkKGdhLCBkb25lKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2FmdGVyIGxvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICBhbmFseXRpY3Mub25jZSgncmVhZHknLCBkb25lKTtcbiAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgnI3BhZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3Muc3R1Yih3aW5kb3csICdnYScpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgYSBwYWdlIHZpZXcnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93LmdhLCAnc2VuZCcsICdwYWdldmlldycsIHtcbiAgICAgICAgICAgIHBhZ2U6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSxcbiAgICAgICAgICAgIHRpdGxlOiBkb2N1bWVudC50aXRsZSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgKHdpbmRvdy5sb2NhdGlvbi5wb3J0ID8gJzonICsgd2luZG93LmxvY2F0aW9uLnBvcnQgOiAnJykgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyB3aW5kb3cubG9jYXRpb24uc2VhcmNoXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2V0IHRoZSB0cmFja2VyXFwncyBwYWdlIG9iamVjdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdzZXQnLCB7XG4gICAgICAgICAgICBwYWdlOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUsXG4gICAgICAgICAgICB0aXRsZTogZG9jdW1lbnQudGl0bGVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIGEgcGFnZSB2aWV3IHdpdGggcHJvcGVydGllcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCdjYXRlZ29yeScsICduYW1lJywgeyB1cmw6ICd1cmwnLCBwYXRoOiAnL3BhdGgnIH0pO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93LmdhLCAnc2VuZCcsICdwYWdldmlldycsIHtcbiAgICAgICAgICAgIHBhZ2U6ICcvcGF0aCcsXG4gICAgICAgICAgICB0aXRsZTogJ2NhdGVnb3J5IG5hbWUnLFxuICAgICAgICAgICAgbG9jYXRpb246ICd1cmwnXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCB0aGUgcXVlcnkgaWYgaXRzIGluY2x1ZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5pbmNsdWRlU2VhcmNoID0gdHJ1ZTtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgnY2F0ZWdvcnknLCAnbmFtZScsIHsgdXJsOiAndXJsJywgcGF0aDogJy9wYXRoJywgc2VhcmNoOiAnP3E9MScgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdzZW5kJywgJ3BhZ2V2aWV3Jywge1xuICAgICAgICAgICAgcGFnZTogJy9wYXRoP3E9MScsXG4gICAgICAgICAgICB0aXRsZTogJ2NhdGVnb3J5IG5hbWUnLFxuICAgICAgICAgICAgbG9jYXRpb246ICd1cmwnXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCB0aGUgY2FtcGFpZ24gaW5mbyBpZiBpdHMgaW5jbHVkZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBnYS5vcHRpb25zLmluY2x1ZGVTZWFyY2ggPSB0cnVlO1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCdjYXRlZ29yeScsICduYW1lJywgeyB1cmw6ICd1cmwnLCBwYXRoOiAnL3BhdGgnLCBzZWFyY2g6ICc/cT0xJyB9LCB7XG4gICAgICAgICAgICBjYW1wYWlnbjoge1xuICAgICAgICAgICAgICBuYW1lOiAndGVzdCcsXG4gICAgICAgICAgICAgIHNvdXJjZTogJ3Rlc3QnLFxuICAgICAgICAgICAgICBtZWRpdW06ICd0ZXN0JyxcbiAgICAgICAgICAgICAgdGVybTogJ3Rlc3QnLFxuICAgICAgICAgICAgICBjb250ZW50OiAndGVzdCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5nYSwgJ3NlbmQnLCAncGFnZXZpZXcnLCB7XG4gICAgICAgICAgICBwYWdlOiAnL3BhdGg/cT0xJyxcbiAgICAgICAgICAgIHRpdGxlOiAnY2F0ZWdvcnkgbmFtZScsXG4gICAgICAgICAgICBsb2NhdGlvbjogJ3VybCcsXG4gICAgICAgICAgICBjYW1wYWlnbk5hbWU6ICd0ZXN0JyxcbiAgICAgICAgICAgIGNhbXBhaWduU291cmNlOiAndGVzdCcsXG4gICAgICAgICAgICBjYW1wYWlnbk1lZGl1bTogJ3Rlc3QnLFxuICAgICAgICAgICAgY2FtcGFpZ25LZXl3b3JkOiAndGVzdCcsXG4gICAgICAgICAgICBjYW1wYWlnbkNvbnRlbnQ6ICd0ZXN0J1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIG1hcCBjdXN0b20gZGltZW5zaW9ucyAmIG1ldHJpY3MgdXNpbmcgdHJhY2sucHJvcGVydGllcygpJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5tZXRyaWNzID0geyBzY29yZTogJ21ldHJpYzEnIH07XG4gICAgICAgICAgZ2Eub3B0aW9ucy5kaW1lbnNpb25zID0geyBhdXRob3I6ICdkaW1lbnNpb24xJywgcG9zdFR5cGU6ICdkaW1lbnNpb24yJyB9O1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKHsgc2NvcmU6IDIxLCBhdXRob3I6ICdBdXRob3InLCBwb3N0VHlwZTogJ2Jsb2cnIH0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdzZXQnLCB7XG4gICAgICAgICAgICBtZXRyaWMxOiAyMSxcbiAgICAgICAgICAgIGRpbWVuc2lvbjE6ICdBdXRob3InLFxuICAgICAgICAgICAgZGltZW5zaW9uMjogJ2Jsb2cnXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgdHJhY2sgYSBuYW1lZCBwYWdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ05hbWUnKTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5nYSwgJ3NlbmQnLCAnZXZlbnQnLCB7XG4gICAgICAgICAgICBldmVudENhdGVnb3J5OiAnQWxsJyxcbiAgICAgICAgICAgIGV2ZW50QWN0aW9uOiAnVmlld2VkIE5hbWUgUGFnZScsXG4gICAgICAgICAgICBldmVudExhYmVsOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBldmVudFZhbHVlOiAwLFxuICAgICAgICAgICAgbm9uSW50ZXJhY3Rpb246IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCB0cmFjayBhIG5hbWVkIHBhZ2Ugd2l0aCBjb250ZXh0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ05hbWUnLCB7fSwge1xuICAgICAgICAgICAgY2FtcGFpZ246IHtcbiAgICAgICAgICAgICAgbmFtZTogJ3Rlc3QnLFxuICAgICAgICAgICAgICBzb3VyY2U6ICd0ZXN0JyxcbiAgICAgICAgICAgICAgbWVkaXVtOiAndGVzdCcsXG4gICAgICAgICAgICAgIHRlcm06ICd0ZXN0JyxcbiAgICAgICAgICAgICAgY29udGVudDogJ3Rlc3QnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdzZW5kJywgJ2V2ZW50Jywge1xuICAgICAgICAgICAgZXZlbnRDYXRlZ29yeTogJ0FsbCcsXG4gICAgICAgICAgICBldmVudEFjdGlvbjogJ1ZpZXdlZCBOYW1lIFBhZ2UnLFxuICAgICAgICAgICAgZXZlbnRMYWJlbDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZXZlbnRWYWx1ZTogMCxcbiAgICAgICAgICAgIG5vbkludGVyYWN0aW9uOiB0cnVlLFxuICAgICAgICAgICAgY2FtcGFpZ25OYW1lOiAndGVzdCcsXG4gICAgICAgICAgICBjYW1wYWlnblNvdXJjZTogJ3Rlc3QnLFxuICAgICAgICAgICAgY2FtcGFpZ25NZWRpdW06ICd0ZXN0JyxcbiAgICAgICAgICAgIGNhbXBhaWduS2V5d29yZDogJ3Rlc3QnLFxuICAgICAgICAgICAgY2FtcGFpZ25Db250ZW50OiAndGVzdCdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCB0cmFjayBhIG5hbWUgKyBjYXRlZ29yeSBwYWdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ0NhdGVnb3J5JywgJ05hbWUnKTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5nYSwgJ3NlbmQnLCAnZXZlbnQnLCB7XG4gICAgICAgICAgICBldmVudENhdGVnb3J5OiAnQ2F0ZWdvcnknLFxuICAgICAgICAgICAgZXZlbnRBY3Rpb246ICdWaWV3ZWQgQ2F0ZWdvcnkgTmFtZSBQYWdlJyxcbiAgICAgICAgICAgIGV2ZW50TGFiZWw6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGV2ZW50VmFsdWU6IDAsXG4gICAgICAgICAgICBub25JbnRlcmFjdGlvbjogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHRyYWNrIGEgY2F0ZWdvcml6ZWQgcGFnZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCdDYXRlZ29yeScsICdOYW1lJyk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdzZW5kJywgJ2V2ZW50Jywge1xuICAgICAgICAgICAgZXZlbnRDYXRlZ29yeTogJ0NhdGVnb3J5JyxcbiAgICAgICAgICAgIGV2ZW50QWN0aW9uOiAnVmlld2VkIENhdGVnb3J5IFBhZ2UnLFxuICAgICAgICAgICAgZXZlbnRMYWJlbDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZXZlbnRWYWx1ZTogMCxcbiAgICAgICAgICAgIG5vbkludGVyYWN0aW9uOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgbm90IHRyYWNrIGEgbmFtZWQgb3IgY2F0ZWdvcml6ZWQgcGFnZSB3aGVuIHRoZSBvcHRpb24gaXMgb2ZmJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy50cmFja05hbWVkUGFnZXMgPSBmYWxzZTtcbiAgICAgICAgICBnYS5vcHRpb25zLnRyYWNrQ2F0ZWdvcml6ZWRQYWdlcyA9IGZhbHNlO1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCdOYW1lJyk7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ0NhdGVnb3J5JywgJ05hbWUnKTtcbiAgICAgICAgICAvLyBzZW5kIHNob3VsZCBvbmx5IGJlIHNlbnQgdHdpY2UsIGZvciBwYWdldmlld3MsIG5vdCBldmVudHNcbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5nYS5hcmdzLmxlbmd0aCA9PT0gNCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuZ2EuYXJnc1swXVswXSA9PT0gJ3NldCcpO1xuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LmdhLmFyZ3NbMV1bMF0gPT09ICdzZW5kJyk7XG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuZ2EuYXJnc1syXVswXSA9PT0gJ3NldCcpO1xuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LmdhLmFyZ3NbM11bMF0gPT09ICdzZW5kJyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGRlc2NyaWJlKCcjaWRlbnRpZnknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3Muc3R1Yih3aW5kb3csICdnYScpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgdXNlciBpZCBpZiBzZW5kVXNlcklkIG9wdGlvbiBpcyB0cnVlIGFuZCBpZGVudGlmeS51c2VyKCkgaXMgdHJ1dGh5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5zZW5kVXNlcklkID0gdHJ1ZTtcbiAgICAgICAgICBhbmFseXRpY3MuaWRlbnRpZnkoJ1N0ZXZlbicpO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93LmdhLCAnc2V0JywgJ3VzZXJJZCcsICdTdGV2ZW4nKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIG5vdCB1c2VyIGlkIGlmIHNlbmRVc2VySWQgb3B0aW9uIGlzIGZhbHNlIGFuZCBpZGVudGlmeS51c2VyKCkgaXMgdHJ1dGh5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5zZW5kVXNlcklkID0gZmFsc2U7XG4gICAgICAgICAgYW5hbHl0aWNzLmlkZW50aWZ5KCdTdGV2ZW4nKTtcbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5nYS5hcmdzLmxlbmd0aCA9PT0gMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2V0IGN1c3RvbSBkaW1lbnNpb25zJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5kaW1lbnNpb25zID0geyBhZ2U6ICdkaW1lbnNpb24xJyB9O1xuICAgICAgICAgIGFuYWx5dGljcy5pZGVudGlmeSgnU3RldmVuJywgeyBhZ2U6IDI1IH0pO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93LmdhLCAnc2V0JywgeyBkaW1lbnNpb24xOiAyNSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgZGVzY3JpYmUoJyN0cmFjaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5zdHViKHdpbmRvdywgJ2dhJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBhbiBldmVudCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnZXZlbnQnKTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5nYSwgJ3NlbmQnLCAnZXZlbnQnLCB7XG4gICAgICAgICAgICBldmVudENhdGVnb3J5OiAnQWxsJyxcbiAgICAgICAgICAgIGV2ZW50QWN0aW9uOiAnZXZlbnQnLFxuICAgICAgICAgICAgZXZlbnRMYWJlbDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZXZlbnRWYWx1ZTogMCxcbiAgICAgICAgICAgIG5vbkludGVyYWN0aW9uOiBmYWxzZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgYW4gZXZlbnQgd2l0aCBjb250ZXh0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHt9LCB7XG4gICAgICAgICAgICBjYW1wYWlnbjoge1xuICAgICAgICAgICAgICBuYW1lOiAndGVzdCcsXG4gICAgICAgICAgICAgIHNvdXJjZTogJ3Rlc3QnLFxuICAgICAgICAgICAgICBtZWRpdW06ICd0ZXN0JyxcbiAgICAgICAgICAgICAgdGVybTogJ3Rlc3QnLFxuICAgICAgICAgICAgICBjb250ZW50OiAndGVzdCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5nYSwgJ3NlbmQnLCAnZXZlbnQnLCB7XG4gICAgICAgICAgICBldmVudENhdGVnb3J5OiAnQWxsJyxcbiAgICAgICAgICAgIGV2ZW50QWN0aW9uOiAnZXZlbnQnLFxuICAgICAgICAgICAgZXZlbnRMYWJlbDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZXZlbnRWYWx1ZTogMCxcbiAgICAgICAgICAgIG5vbkludGVyYWN0aW9uOiBmYWxzZSxcbiAgICAgICAgICAgIGNhbXBhaWduTmFtZTogJ3Rlc3QnLFxuICAgICAgICAgICAgY2FtcGFpZ25Tb3VyY2U6ICd0ZXN0JyxcbiAgICAgICAgICAgIGNhbXBhaWduTWVkaXVtOiAndGVzdCcsXG4gICAgICAgICAgICBjYW1wYWlnbktleXdvcmQ6ICd0ZXN0JyxcbiAgICAgICAgICAgIGNhbXBhaWduQ29udGVudDogJ3Rlc3QnXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBhIGNhdGVnb3J5IHByb3BlcnR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHsgY2F0ZWdvcnk6ICdjYXRlZ29yeScgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdzZW5kJywgJ2V2ZW50Jywge1xuICAgICAgICAgICAgZXZlbnRDYXRlZ29yeTogJ2NhdGVnb3J5JyxcbiAgICAgICAgICAgIGV2ZW50QWN0aW9uOiAnZXZlbnQnLFxuICAgICAgICAgICAgZXZlbnRMYWJlbDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZXZlbnRWYWx1ZTogMCxcbiAgICAgICAgICAgIG5vbkludGVyYWN0aW9uOiBmYWxzZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgYSBzdG9yZWQgY2F0ZWdvcnknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgnY2F0ZWdvcnknLCAnbmFtZScpO1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnZXZlbnQnLCB7fSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdzZW5kJywgJ2V2ZW50Jywge1xuICAgICAgICAgICAgZXZlbnRDYXRlZ29yeTogJ2NhdGVnb3J5JyxcbiAgICAgICAgICAgIGV2ZW50QWN0aW9uOiAnZXZlbnQnLFxuICAgICAgICAgICAgZXZlbnRMYWJlbDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZXZlbnRWYWx1ZTogMCxcbiAgICAgICAgICAgIG5vbkludGVyYWN0aW9uOiBmYWxzZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgYSBjYXRlZ29yeSBwcm9wZXJ0eSBldmVuIGlmIHRoZXJlIGlzIGEgc3RvcmVkIGNhdGVnb3J5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ2NhdGVnb3J5KHBhZ2UpJyk7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHsgY2F0ZWdvcnk6ICdjYXRlZ29yeSh0cmFjayknIH0pO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93LmdhLCAnc2VuZCcsICdldmVudCcsIHtcbiAgICAgICAgICAgIGV2ZW50Q2F0ZWdvcnk6ICdjYXRlZ29yeSh0cmFjayknLFxuICAgICAgICAgICAgZXZlbnRBY3Rpb246ICdldmVudCcsXG4gICAgICAgICAgICBldmVudExhYmVsOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBldmVudFZhbHVlOiAwLFxuICAgICAgICAgICAgbm9uSW50ZXJhY3Rpb246IGZhbHNlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBhIGxhYmVsIHByb3BlcnR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHsgbGFiZWw6ICdsYWJlbCcgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdzZW5kJywgJ2V2ZW50Jywge1xuICAgICAgICAgICAgZXZlbnRDYXRlZ29yeTogJ0FsbCcsXG4gICAgICAgICAgICBldmVudEFjdGlvbjogJ2V2ZW50JyxcbiAgICAgICAgICAgIGV2ZW50TGFiZWw6ICdsYWJlbCcsXG4gICAgICAgICAgICBldmVudFZhbHVlOiAwLFxuICAgICAgICAgICAgbm9uSW50ZXJhY3Rpb246IGZhbHNlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBhIHJvdW5kZWQgdmFsdWUgcHJvcGVydHknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MudHJhY2soJ2V2ZW50JywgeyB2YWx1ZTogMS4xIH0pO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93LmdhLCAnc2VuZCcsICdldmVudCcsIHtcbiAgICAgICAgICAgIGV2ZW50Q2F0ZWdvcnk6ICdBbGwnLFxuICAgICAgICAgICAgZXZlbnRBY3Rpb246ICdldmVudCcsXG4gICAgICAgICAgICBldmVudExhYmVsOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBldmVudFZhbHVlOiAxLFxuICAgICAgICAgICAgbm9uSW50ZXJhY3Rpb246IGZhbHNlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgcHJlZmVyIGEgcm91bmRlZCByZXZlbnVlIHByb3BlcnR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHsgcmV2ZW51ZTogOS45OSB9KTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5nYSwgJ3NlbmQnLCAnZXZlbnQnLCB7XG4gICAgICAgICAgICBldmVudENhdGVnb3J5OiAnQWxsJyxcbiAgICAgICAgICAgIGV2ZW50QWN0aW9uOiAnZXZlbnQnLFxuICAgICAgICAgICAgZXZlbnRMYWJlbDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZXZlbnRWYWx1ZTogMTAsXG4gICAgICAgICAgICBub25JbnRlcmFjdGlvbjogZmFsc2VcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIGEgbm9uLWludGVyYWN0aW9uIHByb3BlcnR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHsgbm9uSW50ZXJhY3Rpb246IDEgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdzZW5kJywgJ2V2ZW50Jywge1xuICAgICAgICAgICAgZXZlbnRDYXRlZ29yeTogJ0FsbCcsXG4gICAgICAgICAgICBldmVudEFjdGlvbjogJ2V2ZW50JyxcbiAgICAgICAgICAgIGV2ZW50TGFiZWw6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGV2ZW50VmFsdWU6IDAsXG4gICAgICAgICAgICBub25JbnRlcmFjdGlvbjogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgYSBub24taW50ZXJhY3Rpb24gb3B0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHt9LCB7ICdHb29nbGUgQW5hbHl0aWNzJzogeyBub25JbnRlcmFjdGlvbjogMSB9IH0pO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93LmdhLCAnc2VuZCcsICdldmVudCcsIHtcbiAgICAgICAgICAgIGV2ZW50Q2F0ZWdvcnk6ICdBbGwnLFxuICAgICAgICAgICAgZXZlbnRBY3Rpb246ICdldmVudCcsXG4gICAgICAgICAgICBldmVudExhYmVsOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBldmVudFZhbHVlOiAwLFxuICAgICAgICAgICAgbm9uSW50ZXJhY3Rpb246IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCByZXNwZWN0IHRoZSBub24taW50ZXJhY3Rpb24gb3B0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5ub25JbnRlcmFjdGlvbiA9IHRydWU7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcpO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93LmdhLCAnc2VuZCcsICdldmVudCcsIHtcbiAgICAgICAgICAgIGV2ZW50Q2F0ZWdvcnk6ICdBbGwnLFxuICAgICAgICAgICAgZXZlbnRBY3Rpb246ICdldmVudCcsXG4gICAgICAgICAgICBldmVudExhYmVsOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBldmVudFZhbHVlOiAwLFxuICAgICAgICAgICAgbm9uSW50ZXJhY3Rpb246IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBtYXAgY3VzdG9tIGRpbWVuc2lvbnMgJiBtZXRyaWNzIHVzaW5nIHRyYWNrLnByb3BlcnRpZXMoKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdhLm9wdGlvbnMubWV0cmljcyA9IHsgbG9hZFRpbWU6ICdtZXRyaWMxJywgbGV2ZWxBY2hpZXZlZDogJ21ldHJpYzInIH07XG4gICAgICAgICAgZ2Eub3B0aW9ucy5kaW1lbnNpb25zID0geyByZWZlcnJlcjogJ2RpbWVuc2lvbjInLCBwb3RhdG86ICdkaW1lbnNpb24xJyB9O1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnTGV2ZWwgVW5sb2NrZWQnLCB7IGxvYWRUaW1lOiAnMTAwJywgbGV2ZWxBY2hpZXZlZDogJzUnLCBwb3RhdG86ICdmaXZlJywgcmVmZXJyZXI6ICdHb29nbGUnIH0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdzZXQnLCB7XG4gICAgICAgICAgICBtZXRyaWMxOiAnMTAwJyxcbiAgICAgICAgICAgIG1ldHJpYzI6ICc1JyxcbiAgICAgICAgICAgIGRpbWVuc2lvbjE6ICdmaXZlJyxcbiAgICAgICAgICAgIGRpbWVuc2lvbjI6ICdHb29nbGUnXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGRlc2NyaWJlKCdlY29tbWVyY2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3Muc3R1Yih3aW5kb3csICdnYScpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHJlcXVpcmUgZWNvbW1lcmNlLmpzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdjb21wbGV0ZWQgb3JkZXInLCB7IG9yZGVySWQ6ICdlZTA5OWJmNycgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuZ2EsICdyZXF1aXJlJywgJ2Vjb21tZXJjZScpO1xuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQoZ2EuZWNvbW1lcmNlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBub3QgcmVxdWlyZSBlY29tbWVyY2UgaWYgLmVjb21tZXJjZSBpcyB0cnVlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2EuZWNvbW1lcmNlID0gdHJ1ZTtcbiAgICAgICAgICBhbmFseXRpY3MudHJhY2soJ2NvbXBsZXRlZCBvcmRlcicsIHsgb3JkZXJJZDogJ2UyMTNlNGRhJyB9KTtcbiAgICAgICAgICBhbmFseXRpY3MuZGlkTm90Q2FsbCh3aW5kb3cuZ2EsICdyZXF1aXJlJywgJ2Vjb21tZXJjZScpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgc2ltcGxlIGVjb21tZXJjZSBkYXRhJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdjb21wbGV0ZWQgb3JkZXInLCB7IG9yZGVySWQ6ICc3MzA2Y2MwNicgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuZ2EuYXJncy5sZW5ndGggPT09IDMpO1xuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LmdhLmFyZ3NbMV1bMF0gPT09ICdlY29tbWVyY2U6YWRkVHJhbnNhY3Rpb24nKTtcbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5nYS5hcmdzWzJdWzBdID09PSAnZWNvbW1lcmNlOnNlbmQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIGVjb21tZXJjZSBkYXRhJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdjb21wbGV0ZWQgb3JkZXInLCB7XG4gICAgICAgICAgICBvcmRlcklkOiAnNzgwYmM1NScsXG4gICAgICAgICAgICB0b3RhbDogOTkuOTksXG4gICAgICAgICAgICBzaGlwcGluZzogMTMuOTksXG4gICAgICAgICAgICB0YXg6IDIwLjk5LFxuICAgICAgICAgICAgcHJvZHVjdHM6IFt7XG4gICAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgICBwcmljZTogMjQuNzUsXG4gICAgICAgICAgICAgIG5hbWU6ICdteSBwcm9kdWN0JyxcbiAgICAgICAgICAgICAgc2t1OiAncC0yOTgnXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIHF1YW50aXR5OiAzLFxuICAgICAgICAgICAgICBwcmljZTogMjQuNzUsXG4gICAgICAgICAgICAgIG5hbWU6ICdvdGhlciBwcm9kdWN0JyxcbiAgICAgICAgICAgICAgc2t1OiAncC0yOTknXG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1sxXSwgWydlY29tbWVyY2U6YWRkVHJhbnNhY3Rpb24nLCB7XG4gICAgICAgICAgICBpZDogJzc4MGJjNTUnLFxuICAgICAgICAgICAgcmV2ZW51ZTogOTkuOTksXG4gICAgICAgICAgICBzaGlwcGluZzogMTMuOTksXG4gICAgICAgICAgICBhZmZpbGlhdGlvbjogdW5kZWZpbmVkLFxuICAgICAgICAgICAgdGF4OiAyMC45OSxcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnVVNEJ1xuICAgICAgICAgIH1dKTtcblxuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMl0sIFsnZWNvbW1lcmNlOmFkZEl0ZW0nLCB7XG4gICAgICAgICAgICBpZDogJzc4MGJjNTUnLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIG5hbWU6ICdteSBwcm9kdWN0JyxcbiAgICAgICAgICAgIHByaWNlOiAyNC43NSxcbiAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgc2t1OiAncC0yOTgnLFxuICAgICAgICAgICAgY3VycmVuY3k6ICdVU0QnXG4gICAgICAgICAgfV0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1szXSwgWydlY29tbWVyY2U6YWRkSXRlbScsIHtcbiAgICAgICAgICAgIGlkOiAnNzgwYmM1NScsXG4gICAgICAgICAgICBjYXRlZ29yeTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgbmFtZTogJ290aGVyIHByb2R1Y3QnLFxuICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgc2t1OiAncC0yOTknLFxuICAgICAgICAgICAgcXVhbnRpdHk6IDMsXG4gICAgICAgICAgICBjdXJyZW5jeTogJ1VTRCdcbiAgICAgICAgICB9XSk7XG5cbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzRdLCBbJ2Vjb21tZXJjZTpzZW5kJ10pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIGZhbGxiYWNrIHRvIHJldmVudWUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MudHJhY2soJ2NvbXBsZXRlZCBvcmRlcicsIHtcbiAgICAgICAgICAgIG9yZGVySWQ6ICc1ZDRjN2NiNScsXG4gICAgICAgICAgICByZXZlbnVlOiA5OS45LFxuICAgICAgICAgICAgc2hpcHBpbmc6IDEzLjk5LFxuICAgICAgICAgICAgdGF4OiAyMC45OSxcbiAgICAgICAgICAgIHByb2R1Y3RzOiBbXVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1sxXSwgWydlY29tbWVyY2U6YWRkVHJhbnNhY3Rpb24nLCB7XG4gICAgICAgICAgICBpZDogJzVkNGM3Y2I1JyxcbiAgICAgICAgICAgIHJldmVudWU6IDk5LjksXG4gICAgICAgICAgICBzaGlwcGluZzogMTMuOTksXG4gICAgICAgICAgICBhZmZpbGlhdGlvbjogdW5kZWZpbmVkLFxuICAgICAgICAgICAgdGF4OiAyMC45OSxcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnVVNEJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBwYXNzIGN1c3RvbSBjdXJyZW5jeScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY29tcGxldGVkIG9yZGVyJywge1xuICAgICAgICAgICAgb3JkZXJJZDogJzVkNGM3Y2I1JyxcbiAgICAgICAgICAgIHJldmVudWU6IDk5LjksXG4gICAgICAgICAgICBzaGlwcGluZzogMTMuOTksXG4gICAgICAgICAgICB0YXg6IDIwLjk5LFxuICAgICAgICAgICAgcHJvZHVjdHM6IFtdLFxuICAgICAgICAgICAgY3VycmVuY3k6ICdFVVInXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzFdLCBbJ2Vjb21tZXJjZTphZGRUcmFuc2FjdGlvbicsIHtcbiAgICAgICAgICAgIGlkOiAnNWQ0YzdjYjUnLFxuICAgICAgICAgICAgcmV2ZW51ZTogOTkuOSxcbiAgICAgICAgICAgIHNoaXBwaW5nOiAxMy45OSxcbiAgICAgICAgICAgIGFmZmlsaWF0aW9uOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB0YXg6IDIwLjk5LFxuICAgICAgICAgICAgY3VycmVuY3k6ICdFVVInXG4gICAgICAgICAgfV0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnVW5pdmVyc2FsIEVuaGFuY2VkIEVjb21tZXJjZScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZXR0aW5ncyA9IHtcbiAgICAgIGVuaGFuY2VkRWNvbW1lcmNlOiB0cnVlLFxuICAgICAgYW5vbnltaXplSXA6IHRydWUsXG4gICAgICBkb21haW46ICdub25lJyxcbiAgICAgIHNpdGVTcGVlZFNhbXBsZVJhdGU6IDQyLFxuICAgICAgdHJhY2tpbmdJZDogJ1VBLTI3MDMzNzA5LTEyJ1xuICAgIH07XG5cbiAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgZ2EgPSBuZXcgR0Eoc2V0dGluZ3MpO1xuICAgICAgYW5hbHl0aWNzLmFkZChnYSk7XG4gICAgfSk7XG5cbiAgICBhZnRlckVhY2goZnVuY3Rpb24oKSB7XG4gICAgICBnYS5yZXNldCgpO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2FmdGVyIGxvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICBhbmFseXRpY3Mub25jZSgncmVhZHknLCBkb25lKTtcbiAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgnZW5oYW5jZWQgZWNvbW1lcmNlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnNweSh3aW5kb3csICdnYScpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHJlcXVpcmUgZWMuanMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MudHJhY2soJ2NvbXBsZXRlZCBvcmRlcicsIHsgb3JkZXJJZDogJ2VlMDk5YmY3JyB9KTtcbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5nYS5hcmdzLmxlbmd0aCA+IDApO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMF0sIFsncmVxdWlyZScsICdlYyddKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBub3QgcmVxdWlyZSBlYyBpZiAuZW5oYW5jZWRFY29tbWVyY2VMb2FkZWQgaXMgdHJ1ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdhLmVuaGFuY2VkRWNvbW1lcmNlTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICBhbmFseXRpY3MudHJhY2soJ2NvbXBsZXRlZCBvcmRlcicsIHsgb3JkZXJJZDogJ2UyMTNlNGRhJyB9KTtcbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5nYS5hcmdzLmxlbmd0aCA+IDApO1xuICAgICAgICAgIGFuYWx5dGljcy5ub3REZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMF0sIFsncmVxdWlyZScsICdlYyddKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZXQgY3VycmVuY3kgZm9yIGVjLmpzICB0byBkZWZhdWx0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdjb21wbGV0ZWQgb3JkZXInLCB7IG9yZGVySWQ6ICdlZTA5OWJmNycgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1sxXSwgWydzZXQnLCAnJmN1JywgJ1VTRCddKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZXQgY3VycmVuY3kgZm9yIGVjLmpzIHRvIGN1c3RvbSBjdXJyZW5jeScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY29tcGxldGVkIG9yZGVyJywgeyBvcmRlcklkOiAnZWUwOTliZjcnLCBjdXJyZW5jeTogJ0VVUicgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1sxXSwgWydzZXQnLCAnJmN1JywgJ0VVUiddKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIGFkZGVkIHByb2R1Y3QgZGF0YScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnYWRkZWQgcHJvZHVjdCcsIHtcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJyxcbiAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgbmFtZTogJ215IHByb2R1Y3QnLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMScsXG4gICAgICAgICAgICBza3U6ICdwLTI5OCdcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LmdhLmFyZ3MubGVuZ3RoID09PSA1KTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzFdLCBbJ3NldCcsICcmY3UnLCAnQ0FEJ10pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMl0sIFsnZWM6YWRkUHJvZHVjdCcsIHtcbiAgICAgICAgICAgIGlkOiAncC0yOTgnLFxuICAgICAgICAgICAgbmFtZTogJ215IHByb2R1Y3QnLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMScsXG4gICAgICAgICAgICBxdWFudGl0eTogMSxcbiAgICAgICAgICAgIHByaWNlOiAyNC43NSxcbiAgICAgICAgICAgIGJyYW5kOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB2YXJpYW50OiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjdXJyZW5jeTogJ0NBRCdcbiAgICAgICAgICB9XSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1szXSwgWydlYzpzZXRBY3Rpb24nLCAnYWRkJywge31dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzRdLCBbJ3NlbmQnLCAnZXZlbnQnLCAnY2F0IDEnLCAnYWRkZWQgcHJvZHVjdCcsIHsgbm9uSW50ZXJhY3Rpb246IDEgfV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgc2VuZCBsYWJlbCB0cmFja2luZyBlbmhhbmNlZCBlY29tbWVyY2UgZXZlbnRzIHdpdGggVW5pdmVyYWwgQW5hbHl0aWNzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdhZGRlZCBwcm9kdWN0Jywge1xuICAgICAgICAgICAgY3VycmVuY3k6ICdDQUQnLFxuICAgICAgICAgICAgcXVhbnRpdHk6IDEsXG4gICAgICAgICAgICBwcmljZTogMjQuNzUsXG4gICAgICAgICAgICBuYW1lOiAnbXkgcHJvZHVjdCcsXG4gICAgICAgICAgICBjYXRlZ29yeTogJ2NhdCAxJyxcbiAgICAgICAgICAgIHNrdTogJ3AtMjk4JyxcbiAgICAgICAgICAgIGxhYmVsOiAnc2FtcGxlIGxhYmVsJ1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuZ2EuYXJncy5sZW5ndGggPT09IDUpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMV0sIFsnc2V0JywgJyZjdScsICdDQUQnXSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1syXSwgWydlYzphZGRQcm9kdWN0Jywge1xuICAgICAgICAgICAgaWQ6ICdwLTI5OCcsXG4gICAgICAgICAgICBuYW1lOiAnbXkgcHJvZHVjdCcsXG4gICAgICAgICAgICBjYXRlZ29yeTogJ2NhdCAxJyxcbiAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgYnJhbmQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHZhcmlhbnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzNdLCBbJ2VjOnNldEFjdGlvbicsICdhZGQnLCB7fV0pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbNF0sIFsnc2VuZCcsICdldmVudCcsICdjYXQgMScsICdhZGRlZCBwcm9kdWN0JywgJ3NhbXBsZSBsYWJlbCcsIHsgbm9uSW50ZXJhY3Rpb246IDEgfV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgcmVtb3ZlZCBwcm9kdWN0IGRhdGEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MudHJhY2soJ3JlbW92ZWQgcHJvZHVjdCcsIHtcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJyxcbiAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgbmFtZTogJ215IHByb2R1Y3QnLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMScsXG4gICAgICAgICAgICBza3U6ICdwLTI5OCdcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LmdhLmFyZ3MubGVuZ3RoID09PSA1KTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzFdLCBbJ3NldCcsICcmY3UnLCAnQ0FEJ10pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMl0sIFsnZWM6YWRkUHJvZHVjdCcsIHtcbiAgICAgICAgICAgIGlkOiAncC0yOTgnLFxuICAgICAgICAgICAgbmFtZTogJ215IHByb2R1Y3QnLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMScsXG4gICAgICAgICAgICBxdWFudGl0eTogMSxcbiAgICAgICAgICAgIHByaWNlOiAyNC43NSxcbiAgICAgICAgICAgIGJyYW5kOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB2YXJpYW50OiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjdXJyZW5jeTogJ0NBRCdcbiAgICAgICAgICB9XSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1szXSwgWydlYzpzZXRBY3Rpb24nLCAncmVtb3ZlJywge31dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzRdLCBbJ3NlbmQnLCAnZXZlbnQnLCAnY2F0IDEnLCAncmVtb3ZlZCBwcm9kdWN0JywgeyBub25JbnRlcmFjdGlvbjogMSB9XSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCB2aWV3ZWQgcHJvZHVjdCBkYXRhJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCd2aWV3ZWQgcHJvZHVjdCcsIHtcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJyxcbiAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgbmFtZTogJ215IHByb2R1Y3QnLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMScsXG4gICAgICAgICAgICBza3U6ICdwLTI5OCdcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LmdhLmFyZ3MubGVuZ3RoID09PSA1KTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzFdLCBbJ3NldCcsICcmY3UnLCAnQ0FEJ10pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMl0sIFsnZWM6YWRkUHJvZHVjdCcsIHtcbiAgICAgICAgICAgIGlkOiAncC0yOTgnLFxuICAgICAgICAgICAgbmFtZTogJ215IHByb2R1Y3QnLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMScsXG4gICAgICAgICAgICBxdWFudGl0eTogMSxcbiAgICAgICAgICAgIHByaWNlOiAyNC43NSxcbiAgICAgICAgICAgIGJyYW5kOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB2YXJpYW50OiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjdXJyZW5jeTogJ0NBRCdcbiAgICAgICAgICB9XSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1szXSwgWydlYzpzZXRBY3Rpb24nLCAnZGV0YWlsJywge31dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzRdLCBbJ3NlbmQnLCAnZXZlbnQnLCAnY2F0IDEnLCAndmlld2VkIHByb2R1Y3QnLCB7IG5vbkludGVyYWN0aW9uOiAxIH1dKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIGNsaWNrZWQgcHJvZHVjdCBkYXRhJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdjbGlja2VkIHByb2R1Y3QnLCB7XG4gICAgICAgICAgICBjdXJyZW5jeTogJ0NBRCcsXG4gICAgICAgICAgICBxdWFudGl0eTogMSxcbiAgICAgICAgICAgIHByaWNlOiAyNC43NSxcbiAgICAgICAgICAgIG5hbWU6ICdteSBwcm9kdWN0JyxcbiAgICAgICAgICAgIGNhdGVnb3J5OiAnY2F0IDEnLFxuICAgICAgICAgICAgc2t1OiAncC0yOTgnLFxuICAgICAgICAgICAgbGlzdDogJ3NlYXJjaCByZXN1bHRzJ1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuZ2EuYXJncy5sZW5ndGggPT09IDUpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMV0sIFsnc2V0JywgJyZjdScsICdDQUQnXSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1syXSwgWydlYzphZGRQcm9kdWN0Jywge1xuICAgICAgICAgICAgaWQ6ICdwLTI5OCcsXG4gICAgICAgICAgICBuYW1lOiAnbXkgcHJvZHVjdCcsXG4gICAgICAgICAgICBjYXRlZ29yeTogJ2NhdCAxJyxcbiAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgYnJhbmQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHZhcmlhbnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzNdLCBbJ2VjOnNldEFjdGlvbicsICdjbGljaycsIHtcbiAgICAgICAgICAgIGxpc3Q6ICdzZWFyY2ggcmVzdWx0cydcbiAgICAgICAgICB9XSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1s0XSwgWydzZW5kJywgJ2V2ZW50JywgJ2NhdCAxJywgJ2NsaWNrZWQgcHJvZHVjdCcsIHsgbm9uSW50ZXJhY3Rpb246IDEgfV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgdmlld2VkIHByb21vdGlvbiBkYXRhJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCd2aWV3ZWQgcHJvbW90aW9uJywge1xuICAgICAgICAgICAgY3VycmVuY3k6ICdDQUQnLFxuICAgICAgICAgICAgaWQ6ICdQUk9NT18xMjM0JyxcbiAgICAgICAgICAgIG5hbWU6ICdTdW1tZXIgU2FsZScsXG4gICAgICAgICAgICBjcmVhdGl2ZTogJ3N1bW1lcl9iYW5uZXIyJyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYmFubmVyX3Nsb3QxJ1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gRklYTUU6IFdoeSBpcyB0aGlzIGNvbW1lbnRlZCBvdXQ/XG4gICAgICAgICAgLy8gYW5hbHl0aWNzLmFzc2VydCg0ID09IHdpbmRvdy5nYS5hcmdzLmxlbmd0aCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1sxXSwgWydzZXQnLCAnJmN1JywgJ0NBRCddKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzJdLCBbJ2VjOmFkZFByb21vJywge1xuICAgICAgICAgICAgaWQ6ICdQUk9NT18xMjM0JyxcbiAgICAgICAgICAgIG5hbWU6ICdTdW1tZXIgU2FsZScsXG4gICAgICAgICAgICBjcmVhdGl2ZTogJ3N1bW1lcl9iYW5uZXIyJyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYmFubmVyX3Nsb3QxJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzNdLCBbJ3NlbmQnLCAnZXZlbnQnLCAnRW5oYW5jZWRFY29tbWVyY2UnLCAndmlld2VkIHByb21vdGlvbicsIHsgbm9uSW50ZXJhY3Rpb246IDEgfV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgY2xpY2tlZCBwcm9tb3Rpb24gZGF0YScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY2xpY2tlZCBwcm9tb3Rpb24nLCB7XG4gICAgICAgICAgICBjdXJyZW5jeTogJ0NBRCcsXG4gICAgICAgICAgICBpZDogJ1BST01PXzEyMzQnLFxuICAgICAgICAgICAgbmFtZTogJ1N1bW1lciBTYWxlJyxcbiAgICAgICAgICAgIGNyZWF0aXZlOiAnc3VtbWVyX2Jhbm5lcjInLFxuICAgICAgICAgICAgcG9zaXRpb246ICdiYW5uZXJfc2xvdDEnXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICAvLyBGSVhNRTogV2h5IGlzIHRoaXMgY29tbWVudGVkIG91dD9cbiAgICAgICAgICAvLyBhbmFseXRpY3MuYXNzZXJ0KDUgPT0gd2luZG93LmdhLmFyZ3MubGVuZ3RoKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzFdLCBbJ3NldCcsICcmY3UnLCAnQ0FEJ10pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMl0sIFsnZWM6YWRkUHJvbW8nLCB7XG4gICAgICAgICAgICBpZDogJ1BST01PXzEyMzQnLFxuICAgICAgICAgICAgbmFtZTogJ1N1bW1lciBTYWxlJyxcbiAgICAgICAgICAgIGNyZWF0aXZlOiAnc3VtbWVyX2Jhbm5lcjInLFxuICAgICAgICAgICAgcG9zaXRpb246ICdiYW5uZXJfc2xvdDEnXG4gICAgICAgICAgfV0pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbM10sIFsnZWM6c2V0QWN0aW9uJywgJ3Byb21vX2NsaWNrJywge31dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzRdLCBbJ3NlbmQnLCAnZXZlbnQnLCAnRW5oYW5jZWRFY29tbWVyY2UnLCAnY2xpY2tlZCBwcm9tb3Rpb24nLCB7IG5vbkludGVyYWN0aW9uOiAxIH1dKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIHN0YXJ0ZWQgb3JkZXIgZGF0YScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnc3RhcnRlZCBvcmRlcicsIHtcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJyxcbiAgICAgICAgICAgIHByb2R1Y3RzOiBbe1xuICAgICAgICAgICAgICBxdWFudGl0eTogMSxcbiAgICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgICBuYW1lOiAnbXkgcHJvZHVjdCcsXG4gICAgICAgICAgICAgIHNrdTogJ3AtMjk4J1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBxdWFudGl0eTogMyxcbiAgICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgICBuYW1lOiAnb3RoZXIgcHJvZHVjdCcsXG4gICAgICAgICAgICAgIHNrdTogJ3AtMjk5J1xuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBzdGVwOiAxLFxuICAgICAgICAgICAgcGF5bWVudE1ldGhvZDogJ1Zpc2EnXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuZ2EuYXJncy5sZW5ndGggPT09IDYpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMV0sIFsnc2V0JywgJyZjdScsICdDQUQnXSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1syXSwgWydlYzphZGRQcm9kdWN0Jywge1xuICAgICAgICAgICAgaWQ6ICdwLTI5OCcsXG4gICAgICAgICAgICBuYW1lOiAnbXkgcHJvZHVjdCcsXG4gICAgICAgICAgICBjYXRlZ29yeTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcXVhbnRpdHk6IDEsXG4gICAgICAgICAgICBwcmljZTogMjQuNzUsXG4gICAgICAgICAgICBicmFuZDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgdmFyaWFudDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgY3VycmVuY3k6ICdDQUQnXG4gICAgICAgICAgfV0pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbM10sIFsnZWM6YWRkUHJvZHVjdCcsIHtcbiAgICAgICAgICAgIGlkOiAncC0yOTknLFxuICAgICAgICAgICAgbmFtZTogJ290aGVyIHByb2R1Y3QnLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHF1YW50aXR5OiAzLFxuICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgYnJhbmQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHZhcmlhbnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzRdLCBbJ2VjOnNldEFjdGlvbicsICdjaGVja291dCcsIHtcbiAgICAgICAgICAgIHN0ZXA6IDEsXG4gICAgICAgICAgICBvcHRpb246ICdWaXNhJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzVdLCBbJ3NlbmQnLCAnZXZlbnQnLCAnRW5oYW5jZWRFY29tbWVyY2UnLCAnc3RhcnRlZCBvcmRlcicsIHsgbm9uSW50ZXJhY3Rpb246IDEgfV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgdXBkYXRlZCBvcmRlciBkYXRhJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCd1cGRhdGVkIG9yZGVyJywge1xuICAgICAgICAgICAgY3VycmVuY3k6ICdDQUQnLFxuICAgICAgICAgICAgcHJvZHVjdHM6IFt7XG4gICAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgICBwcmljZTogMjQuNzUsXG4gICAgICAgICAgICAgIG5hbWU6ICdteSBwcm9kdWN0JyxcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMScsXG4gICAgICAgICAgICAgIHNrdTogJ3AtMjk4J1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBxdWFudGl0eTogMyxcbiAgICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgICBuYW1lOiAnb3RoZXIgcHJvZHVjdCcsXG4gICAgICAgICAgICAgIGNhdGVnb3J5OiAnY2F0IDInLFxuICAgICAgICAgICAgICBza3U6ICdwLTI5OSdcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgc3RlcDogMSxcbiAgICAgICAgICAgIHBheW1lbnRNZXRob2Q6ICdWaXNhJ1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuZ2EuYXJncy5sZW5ndGggPT09IDYpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMV0sIFsnc2V0JywgJyZjdScsICdDQUQnXSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1syXSwgWydlYzphZGRQcm9kdWN0Jywge1xuICAgICAgICAgICAgaWQ6ICdwLTI5OCcsXG4gICAgICAgICAgICBuYW1lOiAnbXkgcHJvZHVjdCcsXG4gICAgICAgICAgICBjYXRlZ29yeTogJ2NhdCAxJyxcbiAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgYnJhbmQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHZhcmlhbnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzNdLCBbJ2VjOmFkZFByb2R1Y3QnLCB7XG4gICAgICAgICAgICBpZDogJ3AtMjk5JyxcbiAgICAgICAgICAgIG5hbWU6ICdvdGhlciBwcm9kdWN0JyxcbiAgICAgICAgICAgIGNhdGVnb3J5OiAnY2F0IDInLFxuICAgICAgICAgICAgcXVhbnRpdHk6IDMsXG4gICAgICAgICAgICBwcmljZTogMjQuNzUsXG4gICAgICAgICAgICBicmFuZDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgdmFyaWFudDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgY3VycmVuY3k6ICdDQUQnXG4gICAgICAgICAgfV0pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbNF0sIFsnZWM6c2V0QWN0aW9uJywgJ2NoZWNrb3V0Jywge1xuICAgICAgICAgICAgc3RlcDogMSxcbiAgICAgICAgICAgIG9wdGlvbjogJ1Zpc2EnXG4gICAgICAgICAgfV0pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbNV0sIFsnc2VuZCcsICdldmVudCcsICdFbmhhbmNlZEVjb21tZXJjZScsICd1cGRhdGVkIG9yZGVyJywgeyBub25JbnRlcmFjdGlvbjogMSB9XSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCB2aWV3ZWQgY2hlY2tvdXQgc3RlcCBkYXRhJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCd2aWV3ZWQgY2hlY2tvdXQgc3RlcCcsIHtcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJyxcbiAgICAgICAgICAgIHN0ZXA6IDJcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LmdhLmFyZ3MubGVuZ3RoID09PSA0KTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzFdLCBbJ3NldCcsICcmY3UnLCAnQ0FEJ10pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMl0sIFsnZWM6c2V0QWN0aW9uJywgJ2NoZWNrb3V0Jywge1xuICAgICAgICAgICAgc3RlcDogMixcbiAgICAgICAgICAgIG9wdGlvbjogdW5kZWZpbmVkXG4gICAgICAgICAgfV0pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbM10sIFsnc2VuZCcsICdldmVudCcsICdFbmhhbmNlZEVjb21tZXJjZScsICd2aWV3ZWQgY2hlY2tvdXQgc3RlcCcsIHsgbm9uSW50ZXJhY3Rpb246IDEgfV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgY29tcGxldGVkIGNoZWNrb3V0IHN0ZXAgZGF0YScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY29tcGxldGVkIGNoZWNrb3V0IHN0ZXAnLCB7XG4gICAgICAgICAgICBjdXJyZW5jeTogJ0NBRCcsXG4gICAgICAgICAgICBzdGVwOiAyLFxuICAgICAgICAgICAgc2hpcHBpbmdNZXRob2Q6ICdGZWRFeCdcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LmdhLmFyZ3MubGVuZ3RoID09PSA0KTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzFdLCBbJ3NldCcsICcmY3UnLCAnQ0FEJ10pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMl0sIFsnZWM6c2V0QWN0aW9uJywgJ2NoZWNrb3V0X29wdGlvbicsIHtcbiAgICAgICAgICAgIHN0ZXA6IDIsXG4gICAgICAgICAgICBvcHRpb246ICdGZWRFeCdcbiAgICAgICAgICB9XSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1szXSwgWydzZW5kJywgJ2V2ZW50JywgJ0NoZWNrb3V0JywgJ09wdGlvbiddKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIGNvbXBsZXRlZCBjaGVja291dCBzdGVwIGRhdGEgd2l0aCBhbGwgb3B0aW9ucycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY29tcGxldGVkIGNoZWNrb3V0IHN0ZXAnLCB7XG4gICAgICAgICAgICBjdXJyZW5jeTogJ0NBRCcsXG4gICAgICAgICAgICBzdGVwOiAyLFxuICAgICAgICAgICAgcGF5bWVudE1ldGhvZDogJ1Zpc2EnLFxuICAgICAgICAgICAgc2hpcHBpbmdNZXRob2Q6ICdGZWRFeCdcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LmdhLmFyZ3MubGVuZ3RoID09PSA0KTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzFdLCBbJ3NldCcsICcmY3UnLCAnQ0FEJ10pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMl0sIFsnZWM6c2V0QWN0aW9uJywgJ2NoZWNrb3V0X29wdGlvbicsIHtcbiAgICAgICAgICAgIHN0ZXA6IDIsXG4gICAgICAgICAgICBvcHRpb246ICdWaXNhLCBGZWRFeCdcbiAgICAgICAgICB9XSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1szXSwgWydzZW5kJywgJ2V2ZW50JywgJ0NoZWNrb3V0JywgJ09wdGlvbiddKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBub3Qgc2VuZCBjb21wbGV0ZWQgY2hlY2tvdXQgc3RlcCBkYXRhIHdpdGhvdXQgYSBzdGVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdjb21wbGV0ZWQgY2hlY2tvdXQgc3RlcCcsIHtcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJyxcbiAgICAgICAgICAgIHNoaXBwaW5nTWV0aG9kOiAnRmVkRXgnXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5nYS5hcmdzLmxlbmd0aCA9PT0gMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgbm90IHNlbmQgY29tcGxldGVkIGNoZWNrb3V0IHN0ZXAgZGF0YSB3aXRob3V0IGFuIG9wdGlvbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY29tcGxldGVkIGNoZWNrb3V0IHN0ZXAnLCB7XG4gICAgICAgICAgICBjdXJyZW5jeTogJ0NBRCcsXG4gICAgICAgICAgICBzdGVwOiAyXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5nYS5hcmdzLmxlbmd0aCA9PT0gMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBzaW1wbGUgY29tcGxldGVkIG9yZGVyIGRhdGEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MudHJhY2soJ2NvbXBsZXRlZCBvcmRlcicsIHsgb3JkZXJJZDogJzczMDZjYzA2JyB9KTtcbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5nYS5hcmdzLmxlbmd0aCA9PT0gNCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1syXSwgWydlYzpzZXRBY3Rpb24nLCAncHVyY2hhc2UnLCB7XG4gICAgICAgICAgICBpZDogJzczMDZjYzA2JyxcbiAgICAgICAgICAgIGFmZmlsaWF0aW9uOiB1bmRlZmluZWQsXG4gICAgICAgICAgICByZXZlbnVlOiAwLjAsXG4gICAgICAgICAgICB0YXg6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHNoaXBwaW5nOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjb3Vwb246IHVuZGVmaW5lZFxuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzNdLCBbJ3NlbmQnLCAnZXZlbnQnLCAnRW5oYW5jZWRFY29tbWVyY2UnLCAnY29tcGxldGVkIG9yZGVyJywgeyBub25JbnRlcmFjdGlvbjogMSB9XSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBjb21wbGV0ZWQgb3JkZXIgZGF0YScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY29tcGxldGVkIG9yZGVyJywge1xuICAgICAgICAgICAgb3JkZXJJZDogJzc4MGJjNTUnLFxuICAgICAgICAgICAgdG90YWw6IDk5LjksXG4gICAgICAgICAgICBzaGlwcGluZzogMTMuOTksXG4gICAgICAgICAgICB0YXg6IDIwLjk5LFxuICAgICAgICAgICAgY3VycmVuY3k6ICdDQUQnLFxuICAgICAgICAgICAgY291cG9uOiAnY291cG9uJyxcbiAgICAgICAgICAgIGFmZmlsaWF0aW9uOiAnYWZmaWxpYXRpb24nLFxuICAgICAgICAgICAgcHJvZHVjdHM6IFt7XG4gICAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgICBwcmljZTogMjQuNzUsXG4gICAgICAgICAgICAgIG5hbWU6ICdteSBwcm9kdWN0JyxcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMScsXG4gICAgICAgICAgICAgIHNrdTogJ3AtMjk4J1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBxdWFudGl0eTogMyxcbiAgICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgICBuYW1lOiAnb3RoZXIgcHJvZHVjdCcsXG4gICAgICAgICAgICAgIGNhdGVnb3J5OiAnY2F0IDInLFxuICAgICAgICAgICAgICBza3U6ICdwLTI5OScsXG4gICAgICAgICAgICAgIGN1cnJlbmN5OiAnRVVSJ1xuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQod2luZG93LmdhLmFyZ3MubGVuZ3RoID09PSA2KTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzFdLCBbJ3NldCcsICcmY3UnLCAnQ0FEJ10pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMl0sIFsnZWM6YWRkUHJvZHVjdCcsIHtcbiAgICAgICAgICAgIGlkOiAncC0yOTgnLFxuICAgICAgICAgICAgbmFtZTogJ215IHByb2R1Y3QnLFxuICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMScsXG4gICAgICAgICAgICBxdWFudGl0eTogMSxcbiAgICAgICAgICAgIHByaWNlOiAyNC43NSxcbiAgICAgICAgICAgIGJyYW5kOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB2YXJpYW50OiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjdXJyZW5jeTogJ0NBRCdcbiAgICAgICAgICB9XSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1szXSwgWydlYzphZGRQcm9kdWN0Jywge1xuICAgICAgICAgICAgaWQ6ICdwLTI5OScsXG4gICAgICAgICAgICBuYW1lOiAnb3RoZXIgcHJvZHVjdCcsXG4gICAgICAgICAgICBjYXRlZ29yeTogJ2NhdCAyJyxcbiAgICAgICAgICAgIHF1YW50aXR5OiAzLFxuICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgYnJhbmQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHZhcmlhbnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnRVVSJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzRdLCBbJ2VjOnNldEFjdGlvbicsICdwdXJjaGFzZScsIHtcbiAgICAgICAgICAgIGlkOiAnNzgwYmM1NScsXG4gICAgICAgICAgICBhZmZpbGlhdGlvbjogJ2FmZmlsaWF0aW9uJyxcbiAgICAgICAgICAgIHJldmVudWU6IDk5LjksXG4gICAgICAgICAgICB0YXg6IDIwLjk5LFxuICAgICAgICAgICAgc2hpcHBpbmc6IDEzLjk5LFxuICAgICAgICAgICAgY291cG9uOiAnY291cG9uJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzVdLCBbJ3NlbmQnLCAnZXZlbnQnLCAnRW5oYW5jZWRFY29tbWVyY2UnLCAnY29tcGxldGVkIG9yZGVyJywgeyBub25JbnRlcmFjdGlvbjogMSB9XSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgYWRkIGNvdXBvbiB0byBwcm9kdWN0IGxldmVsIGluIGNvbXBsZXRlZCBvcmRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY29tcGxldGVkIG9yZGVyJywge1xuICAgICAgICAgICAgb3JkZXJJZDogJzc4MGJjNTUnLFxuICAgICAgICAgICAgdG90YWw6IDk5LjksXG4gICAgICAgICAgICBzaGlwcGluZzogMTMuOTksXG4gICAgICAgICAgICB0YXg6IDIwLjk5LFxuICAgICAgICAgICAgY3VycmVuY3k6ICdDQUQnLFxuICAgICAgICAgICAgY291cG9uOiAnY291cG9uJyxcbiAgICAgICAgICAgIGFmZmlsaWF0aW9uOiAnYWZmaWxpYXRpb24nLFxuICAgICAgICAgICAgcHJvZHVjdHM6IFt7XG4gICAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgICBwcmljZTogMjQuNzUsXG4gICAgICAgICAgICAgIG5hbWU6ICdteSBwcm9kdWN0JyxcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMScsXG4gICAgICAgICAgICAgIHNrdTogJ3AtMjk4JyxcbiAgICAgICAgICAgICAgY291cG9uOiAncHJvbW8nXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIHF1YW50aXR5OiAzLFxuICAgICAgICAgICAgICBwcmljZTogMjQuNzUsXG4gICAgICAgICAgICAgIG5hbWU6ICdvdGhlciBwcm9kdWN0JyxcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdjYXQgMicsXG4gICAgICAgICAgICAgIHNrdTogJ3AtMjk5JyxcbiAgICAgICAgICAgICAgY3VycmVuY3k6ICdFVVInXG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuZ2EuYXJncy5sZW5ndGggPT09IDYpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMV0sIFsnc2V0JywgJyZjdScsICdDQUQnXSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1syXSwgWydlYzphZGRQcm9kdWN0Jywge1xuICAgICAgICAgICAgaWQ6ICdwLTI5OCcsXG4gICAgICAgICAgICBuYW1lOiAnbXkgcHJvZHVjdCcsXG4gICAgICAgICAgICBjYXRlZ29yeTogJ2NhdCAxJyxcbiAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgcHJpY2U6IDI0Ljc1LFxuICAgICAgICAgICAgYnJhbmQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHZhcmlhbnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGN1cnJlbmN5OiAnQ0FEJyxcbiAgICAgICAgICAgIGNvdXBvbjogJ3Byb21vJ1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzNdLCBbJ2VjOmFkZFByb2R1Y3QnLCB7XG4gICAgICAgICAgICBpZDogJ3AtMjk5JyxcbiAgICAgICAgICAgIG5hbWU6ICdvdGhlciBwcm9kdWN0JyxcbiAgICAgICAgICAgIGNhdGVnb3J5OiAnY2F0IDInLFxuICAgICAgICAgICAgcXVhbnRpdHk6IDMsXG4gICAgICAgICAgICBwcmljZTogMjQuNzUsXG4gICAgICAgICAgICBicmFuZDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgdmFyaWFudDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgY3VycmVuY3k6ICdFVVInXG4gICAgICAgICAgfV0pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbNF0sIFsnZWM6c2V0QWN0aW9uJywgJ3B1cmNoYXNlJywge1xuICAgICAgICAgICAgaWQ6ICc3ODBiYzU1JyxcbiAgICAgICAgICAgIGFmZmlsaWF0aW9uOiAnYWZmaWxpYXRpb24nLFxuICAgICAgICAgICAgcmV2ZW51ZTogOTkuOSxcbiAgICAgICAgICAgIHRheDogMjAuOTksXG4gICAgICAgICAgICBzaGlwcGluZzogMTMuOTksXG4gICAgICAgICAgICBjb3Vwb246ICdjb3Vwb24nXG4gICAgICAgICAgfV0pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbNV0sIFsnc2VuZCcsICdldmVudCcsICdFbmhhbmNlZEVjb21tZXJjZScsICdjb21wbGV0ZWQgb3JkZXInLCB7IG5vbkludGVyYWN0aW9uOiAxIH1dKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ2NvbXBsZXRlZCBvcmRlciBzaG91bGQgZmFsbGJhY2sgdG8gcmV2ZW51ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY29tcGxldGVkIG9yZGVyJywge1xuICAgICAgICAgICAgb3JkZXJJZDogJzVkNGM3Y2I1JyxcbiAgICAgICAgICAgIHJldmVudWU6IDk5LjksXG4gICAgICAgICAgICBzaGlwcGluZzogMTMuOTksXG4gICAgICAgICAgICB0YXg6IDIwLjk5LFxuICAgICAgICAgICAgcHJvZHVjdHM6IFtdXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzJdLCBbJ2VjOnNldEFjdGlvbicsICdwdXJjaGFzZScsIHtcbiAgICAgICAgICAgIGlkOiAnNWQ0YzdjYjUnLFxuICAgICAgICAgICAgYWZmaWxpYXRpb246IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHJldmVudWU6IDk5LjksXG4gICAgICAgICAgICB0YXg6IDIwLjk5LFxuICAgICAgICAgICAgc2hpcHBpbmc6IDEzLjk5LFxuICAgICAgICAgICAgY291cG9uOiB1bmRlZmluZWRcbiAgICAgICAgICB9XSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBmdWxsIHJlZnVuZGVkIG9yZGVyIGRhdGEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MudHJhY2soJ3JlZnVuZGVkIG9yZGVyJywgeyBvcmRlcklkOiAnNzgwYmM1NScgfSk7XG5cbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5nYS5hcmdzLmxlbmd0aCA9PT0gNCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1syXSwgWydlYzpzZXRBY3Rpb24nLCAncmVmdW5kJywge1xuICAgICAgICAgICAgaWQ6ICc3ODBiYzU1J1xuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzNdLCBbJ3NlbmQnLCAnZXZlbnQnLCAnRW5oYW5jZWRFY29tbWVyY2UnLCAncmVmdW5kZWQgb3JkZXInLCB7IG5vbkludGVyYWN0aW9uOiAxIH1dKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIHBhcnRpYWwgcmVmdW5kZWQgb3JkZXIgZGF0YScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygncmVmdW5kZWQgb3JkZXInLCB7XG4gICAgICAgICAgICBvcmRlcklkOiAnNzgwYmM1NScsXG4gICAgICAgICAgICBwcm9kdWN0czogW3tcbiAgICAgICAgICAgICAgcXVhbnRpdHk6IDEsXG4gICAgICAgICAgICAgIHNrdTogJ3AtMjk4J1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBxdWFudGl0eTogMixcbiAgICAgICAgICAgICAgc2t1OiAncC0yOTknXG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuZ2EuYXJncy5sZW5ndGggPT09IDYpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbMl0sIFsnZWM6YWRkUHJvZHVjdCcsIHtcbiAgICAgICAgICAgIGlkOiAncC0yOTgnLFxuICAgICAgICAgICAgcXVhbnRpdHk6IDFcbiAgICAgICAgICB9XSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuZ2EuYXJnc1szXSwgWydlYzphZGRQcm9kdWN0Jywge1xuICAgICAgICAgICAgaWQ6ICdwLTI5OScsXG4gICAgICAgICAgICBxdWFudGl0eTogMlxuICAgICAgICAgIH1dKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5nYS5hcmdzWzRdLCBbJ2VjOnNldEFjdGlvbicsICdyZWZ1bmQnLCB7XG4gICAgICAgICAgICBpZDogJzc4MGJjNTUnXG4gICAgICAgICAgfV0pO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93LmdhLmFyZ3NbNV0sIFsnc2VuZCcsICdldmVudCcsICdFbmhhbmNlZEVjb21tZXJjZScsICdyZWZ1bmRlZCBvcmRlcicsIHsgbm9uSW50ZXJhY3Rpb246IDEgfV0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ2xhc3NpYycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZXR0aW5ncyA9IHtcbiAgICAgIGFub255bWl6ZUlwOiB0cnVlLFxuICAgICAgY2xhc3NpYzogdHJ1ZSxcbiAgICAgIGRvbWFpbjogJ2F1dG8nLFxuICAgICAgZW5oYW5jZWRMaW5rQXR0cmlidXRpb246IHRydWUsXG4gICAgICBpZ25vcmVkUmVmZXJyZXJzOiBbJ2RvbWFpbi5jb20nLCAnd3d3LmRvbWFpbi5jb20nXSxcbiAgICAgIHNpdGVTcGVlZFNhbXBsZVJhdGU6IDQyLFxuICAgICAgdHJhY2tpbmdJZDogJ1VBLTI3MDMzNzA5LTUnXG4gICAgfTtcblxuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgICBnYSA9IG5ldyBHQShzZXR0aW5ncyk7XG4gICAgICBhbmFseXRpY3MuYWRkKGdhKTtcbiAgICB9KTtcblxuICAgIGFmdGVyRWFjaChmdW5jdGlvbigpIHtcbiAgICAgIGdhLnJlc2V0KCk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnYmVmb3JlIGxvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuYWx5dGljcy5zdHViKGdhLCAnbG9hZCcpO1xuICAgICAgfSk7XG5cbiAgICAgIGRlc2NyaWJlKCcjaW5pdGlhbGl6ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpdCgnc2hvdWxkIGNyZWF0ZSB3aW5kb3cuX2dhcScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5hc3NlcnQoIXdpbmRvdy5fZ2FxKTtcbiAgICAgICAgICBhbmFseXRpY3MuaW5pdGlhbGl6ZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuX2dhcSBpbnN0YW5jZW9mIEFycmF5KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBwdXNoIHRoZSB0cmFja2luZyBpZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5fZ2FxWzBdLCBbJ19zZXRBY2NvdW50Jywgc2V0dGluZ3MudHJhY2tpbmdJZF0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNldCBhbGxvdyBsaW5rZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MuaW5pdGlhbGl6ZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuX2dhcVsxXSwgWydfc2V0QWxsb3dMaW5rZXInLCB0cnVlXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2V0IGFub255bWl6ZSBpcCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5fZ2FxWzJdLCBbJ19nYXQuX2Fub255bWl6ZUlwJ10pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNldCBkb21haW4gbmFtZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5fZ2FxWzNdLCBbJ19zZXREb21haW5OYW1lJywgc2V0dGluZ3MuZG9tYWluXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2V0IHNpdGUgc3BlZWQgc2FtcGxlIHJhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MuaW5pdGlhbGl6ZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuX2dhcVs0XSwgWydfc2V0U2l0ZVNwZWVkU2FtcGxlUmF0ZScsIHNldHRpbmdzLnNpdGVTcGVlZFNhbXBsZVJhdGVdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZXQgZW5oYW5jZWQgbGluayBhdHRyaWJ1dGlvbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5fZ2FxWzVdLCBbJ19yZXF1aXJlJywgJ2lucGFnZV9saW5raWQnLCAnaHR0cDovL3d3dy5nb29nbGUtYW5hbHl0aWNzLmNvbS9wbHVnaW5zL2dhL2lucGFnZV9saW5raWQuanMnXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2V0IGlnbm9yZWQgcmVmZXJyZXJzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93Ll9nYXFbNl0sIFsnX2FkZElnbm9yZWRSZWYnLCBzZXR0aW5ncy5pZ25vcmVkUmVmZXJyZXJzWzBdXSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuX2dhcVs3XSwgWydfYWRkSWdub3JlZFJlZicsIHNldHRpbmdzLmlnbm9yZWRSZWZlcnJlcnNbMV1dKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdsb2FkaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBpdCgnc2hvdWxkIGxvYWQnLCBmdW5jdGlvbihkb25lKSB7XG4gICAgICAgIGFuYWx5dGljcy5sb2FkKGdhLCBkb25lKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2FmdGVyIGxvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICBhbmFseXRpY3Mub25jZSgncmVhZHknLCBkb25lKTtcbiAgICAgICAgYW5hbHl0aWNzLmluaXRpYWxpemUoKTtcbiAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgnI3BhZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3Muc3R1Yih3aW5kb3cuX2dhcSwgJ3B1c2gnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIGEgcGFnZSB2aWV3JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoKTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5fZ2FxLnB1c2gsIFsnX3RyYWNrUGFnZXZpZXcnLCB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIGEgcGF0aCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKHsgcGF0aDogJy9wYXRoJyB9KTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5fZ2FxLnB1c2gsIFsnX3RyYWNrUGFnZXZpZXcnLCAnL3BhdGgnXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCB0aGUgcXVlcnkgaWYgaXRzIGluY2x1ZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy5pbmNsdWRlU2VhcmNoID0gdHJ1ZTtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSh7IHBhdGg6ICcvcGF0aCcsIHNlYXJjaDogJz9xPTEnIH0pO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93Ll9nYXEucHVzaCwgWydfdHJhY2tQYWdldmlldycsICcvcGF0aD9xPTEnXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgdHJhY2sgYSBuYW1lZCBwYWdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ05hbWUnKTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5fZ2FxLnB1c2gsIFsnX3RyYWNrRXZlbnQnLCAnQWxsJywgJ1ZpZXdlZCBOYW1lIFBhZ2UnLCB1bmRlZmluZWQsIDAsIHRydWVdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCB0cmFjayBhIG5hbWVkIHBhZ2Ugd2l0aCBhIGNhdGVnb3J5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ0NhdGVnb3J5JywgJ05hbWUnKTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5fZ2FxLnB1c2gsIFsnX3RyYWNrRXZlbnQnLCAnQ2F0ZWdvcnknLCAnVmlld2VkIENhdGVnb3J5IE5hbWUgUGFnZScsIHVuZGVmaW5lZCwgMCwgdHJ1ZV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHRyYWNrIGEgY2F0ZWdvcml6ZWQgcGFnZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCdDYXRlZ29yeScsICdOYW1lJyk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuX2dhcS5wdXNoLCBbJ190cmFja0V2ZW50JywgJ0NhdGVnb3J5JywgJ1ZpZXdlZCBDYXRlZ29yeSBQYWdlJywgdW5kZWZpbmVkLCAwLCB0cnVlXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgbm90IHRyYWNrIGEgbmFtZWQgb3IgY2F0ZWdvcml6ZWQgcGFnZSB3aGVuIHRoZSBvcHRpb24gaXMgb2ZmJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2Eub3B0aW9ucy50cmFja05hbWVkUGFnZXMgPSBmYWxzZTtcbiAgICAgICAgICBnYS5vcHRpb25zLnRyYWNrQ2F0ZWdvcml6ZWRQYWdlcyA9IGZhbHNlO1xuICAgICAgICAgIGFuYWx5dGljcy5wYWdlKCdOYW1lJyk7XG4gICAgICAgICAgYW5hbHl0aWNzLnBhZ2UoJ0NhdGVnb3J5JywgJ05hbWUnKTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkVHdpY2Uod2luZG93Ll9nYXEucHVzaCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGRlc2NyaWJlKCcjdHJhY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3Muc3R1Yih3aW5kb3cuX2dhcSwgJ3B1c2gnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIGFuIGV2ZW50JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcpO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93Ll9nYXEucHVzaCwgWydfdHJhY2tFdmVudCcsICdBbGwnLCAnZXZlbnQnLCB1bmRlZmluZWQsIDAsIGZhbHNlXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBhIGNhdGVnb3J5IHByb3BlcnR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHsgY2F0ZWdvcnk6ICdjYXRlZ29yeScgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuX2dhcS5wdXNoLCBbJ190cmFja0V2ZW50JywgJ2NhdGVnb3J5JywgJ2V2ZW50JywgdW5kZWZpbmVkLCAwLCBmYWxzZV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgYSBzdG9yZWQgY2F0ZWdvcnknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MucGFnZSgnY2F0ZWdvcnknKTtcbiAgICAgICAgICBhbmFseXRpY3MudHJhY2soJ2V2ZW50JywgeyBjYXRlZ29yeTogJ2NhdGVnb3J5JyB9KTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5fZ2FxLnB1c2gsIFsnX3RyYWNrRXZlbnQnLCAnY2F0ZWdvcnknLCAnZXZlbnQnLCB1bmRlZmluZWQsIDAsIGZhbHNlXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBhIGxhYmVsIHByb3BlcnR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHsgbGFiZWw6ICdsYWJlbCcgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuX2dhcS5wdXNoLCBbJ190cmFja0V2ZW50JywgJ0FsbCcsICdldmVudCcsICdsYWJlbCcsIDAsIGZhbHNlXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBhIHJvdW5kZWQgdmFsdWUgcHJvcGVydHknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmFseXRpY3MudHJhY2soJ2V2ZW50JywgeyB2YWx1ZTogMS4xIH0pO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93Ll9nYXEucHVzaCwgWydfdHJhY2tFdmVudCcsICdBbGwnLCAnZXZlbnQnLCB1bmRlZmluZWQsIDEsIGZhbHNlXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgcHJlZmVyIGEgcm91bmRlZCByZXZlbnVlIHByb3BlcnR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHsgcmV2ZW51ZTogOS45OSB9KTtcbiAgICAgICAgICBhbmFseXRpY3MuY2FsbGVkKHdpbmRvdy5fZ2FxLnB1c2gsIFsnX3RyYWNrRXZlbnQnLCAnQWxsJywgJ2V2ZW50JywgdW5kZWZpbmVkLCAxMCwgZmFsc2VdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBzZW5kIGEgbm9uLWludGVyYWN0aW9uIHByb3BlcnR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHsgbm9uSW50ZXJhY3Rpb246IDEgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmNhbGxlZCh3aW5kb3cuX2dhcS5wdXNoLCBbJ190cmFja0V2ZW50JywgJ0FsbCcsICdldmVudCcsIHVuZGVmaW5lZCwgMCwgdHJ1ZV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgYSBub24taW50ZXJhY3Rpb24gb3B0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdldmVudCcsIHt9LCB7ICdHb29nbGUgQW5hbHl0aWNzJzogeyBub25JbnRlcmFjdGlvbjogMSB9IH0pO1xuICAgICAgICAgIGFuYWx5dGljcy5jYWxsZWQod2luZG93Ll9nYXEucHVzaCwgWydfdHJhY2tFdmVudCcsICdBbGwnLCAnZXZlbnQnLCB1bmRlZmluZWQsIDAsIHRydWVdKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgZGVzY3JpYmUoJ2Vjb21tZXJjZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy5zdHViKHdpbmRvdy5fZ2FxLCAncHVzaCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHNlbmQgc2ltcGxlIGVjb21tZXJjZSBkYXRhJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5hbHl0aWNzLnRyYWNrKCdjb21wbGV0ZWQgb3JkZXInLCB7IG9yZGVySWQ6ICcwNzg3ODFjNycgfSk7XG4gICAgICAgICAgYW5hbHl0aWNzLmFzc2VydCh3aW5kb3cuX2dhcS5wdXNoLmFyZ3MubGVuZ3RoID09PSAzKTtcbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5fZ2FxLnB1c2guYXJnc1swXVswXVswXSA9PT0gJ19hZGRUcmFucycpO1xuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwoWydfc2V0JywgJ2N1cnJlbmN5Q29kZScsICdVU0QnXSwgd2luZG93Ll9nYXEucHVzaC5hcmdzWzFdWzBdKTtcbiAgICAgICAgICBhbmFseXRpY3MuYXNzZXJ0KHdpbmRvdy5fZ2FxLnB1c2guYXJnc1syXVswXVswXSA9PT0gJ190cmFja1RyYW5zJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgc2VuZCBlY29tbWVyY2UgZGF0YScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY29tcGxldGVkIG9yZGVyJywge1xuICAgICAgICAgICAgb3JkZXJJZDogJ2FmNWNjZDczJyxcbiAgICAgICAgICAgIHRvdGFsOiA5OS45OSxcbiAgICAgICAgICAgIHNoaXBwaW5nOiAxMy45OSxcbiAgICAgICAgICAgIHRheDogMjAuOTksXG4gICAgICAgICAgICBwcm9kdWN0czogW3tcbiAgICAgICAgICAgICAgcXVhbnRpdHk6IDEsXG4gICAgICAgICAgICAgIHByaWNlOiAyNC43NSxcbiAgICAgICAgICAgICAgbmFtZTogJ215IHByb2R1Y3QnLFxuICAgICAgICAgICAgICBza3U6ICdwLTI5OCdcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgcXVhbnRpdHk6IDMsXG4gICAgICAgICAgICAgIHByaWNlOiAyNC43NSxcbiAgICAgICAgICAgICAgbmFtZTogJ290aGVyIHByb2R1Y3QnLFxuICAgICAgICAgICAgICBza3U6ICdwLTI5OSdcbiAgICAgICAgICAgIH1dXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5fZ2FxLnB1c2guYXJnc1swXSwgW1tcbiAgICAgICAgICAgICdfYWRkVHJhbnMnLFxuICAgICAgICAgICAgJ2FmNWNjZDczJyxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIDk5Ljk5LFxuICAgICAgICAgICAgMjAuOTksXG4gICAgICAgICAgICAxMy45OSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgbnVsbFxuICAgICAgICAgIF1dKTtcblxuICAgICAgICAgIGFuYWx5dGljcy5kZWVwRXF1YWwod2luZG93Ll9nYXEucHVzaC5hcmdzWzFdLCBbW1xuICAgICAgICAgICAgJ19hZGRJdGVtJyxcbiAgICAgICAgICAgICdhZjVjY2Q3MycsXG4gICAgICAgICAgICAncC0yOTgnLFxuICAgICAgICAgICAgJ215IHByb2R1Y3QnLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgMjQuNzUsXG4gICAgICAgICAgICAxXG4gICAgICAgICAgXV0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuX2dhcS5wdXNoLmFyZ3NbMl0sIFtbXG4gICAgICAgICAgICAnX2FkZEl0ZW0nLFxuICAgICAgICAgICAgJ2FmNWNjZDczJyxcbiAgICAgICAgICAgICdwLTI5OScsXG4gICAgICAgICAgICAnb3RoZXIgcHJvZHVjdCcsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAyNC43NSxcbiAgICAgICAgICAgIDNcbiAgICAgICAgICBdXSk7XG5cbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5fZ2FxLnB1c2guYXJnc1szXSwgW1tcbiAgICAgICAgICAgICdfc2V0JyxcbiAgICAgICAgICAgICdjdXJyZW5jeUNvZGUnLFxuICAgICAgICAgICAgJ1VTRCdcbiAgICAgICAgICBdXSk7XG5cbiAgICAgICAgICBhbmFseXRpY3MuZGVlcEVxdWFsKHdpbmRvdy5fZ2FxLnB1c2guYXJnc1s0XSwgW1tcbiAgICAgICAgICAgICdfdHJhY2tUcmFucydcbiAgICAgICAgICBdXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KCdzaG91bGQgZmFsbGJhY2sgdG8gcmV2ZW51ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuYWx5dGljcy50cmFjaygnY29tcGxldGVkIG9yZGVyJywge1xuICAgICAgICAgICAgb3JkZXJJZDogJ2YyZmZlZTVjJyxcbiAgICAgICAgICAgIHJldmVudWU6IDksXG4gICAgICAgICAgICBzaGlwcGluZzogMyxcbiAgICAgICAgICAgIHRheDogMixcbiAgICAgICAgICAgIHByb2R1Y3RzOiBbXVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYW5hbHl0aWNzLmRlZXBFcXVhbCh3aW5kb3cuX2dhcS5wdXNoLmFyZ3NbMF0sIFtbXG4gICAgICAgICAgICAnX2FkZFRyYW5zJyxcbiAgICAgICAgICAgICdmMmZmZWU1YycsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICA5LFxuICAgICAgICAgICAgMixcbiAgICAgICAgICAgIDMsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIG51bGxcbiAgICAgICAgICBdXSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iLCJcbi8qKlxuICogQW5hbHl0aWNzLmpzXG4gKlxuICogKEMpIDIwMTMgU2VnbWVudC5pbyBJbmMuXG4gKi9cblxudmFyIEFuYWx5dGljcyA9IHJlcXVpcmUoJy4vYW5hbHl0aWNzJyk7XG5cbi8qKlxuICogRXhwb3NlIHRoZSBgYW5hbHl0aWNzYCBzaW5nbGV0b24uXG4gKi9cblxudmFyIGFuYWx5dGljcyA9IG1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IG5ldyBBbmFseXRpY3MoKTtcblxuLyoqXG4gKiBFeHBvc2UgcmVxdWlyZVxuICovXG5cbmFuYWx5dGljcy5yZXF1aXJlID0gcmVxdWlyZTtcblxuLyoqXG4gKiBFeHBvc2UgYFZFUlNJT05gLlxuICovXG5cbmV4cG9ydHMuVkVSU0lPTiA9IHJlcXVpcmUoJy4uL2Jvd2VyLmpzb24nKS52ZXJzaW9uO1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIF9hbmFseXRpY3MgPSB3aW5kb3cuYW5hbHl0aWNzO1xudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCdlbWl0dGVyJyk7XG52YXIgRmFjYWRlID0gcmVxdWlyZSgnZmFjYWRlJyk7XG52YXIgYWZ0ZXIgPSByZXF1aXJlKCdhZnRlcicpO1xudmFyIGJpbmQgPSByZXF1aXJlKCdiaW5kJyk7XG52YXIgY2FsbGJhY2sgPSByZXF1aXJlKCdjYWxsYmFjaycpO1xudmFyIGNsb25lID0gcmVxdWlyZSgnY2xvbmUnKTtcbnZhciBjb29raWUgPSByZXF1aXJlKCcuL2Nvb2tpZScpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2RlZmF1bHRzJyk7XG52YXIgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcbnZhciBmb2xkbCA9IHJlcXVpcmUoJ2ZvbGRsJyk7XG52YXIgZ3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XG52YXIgaXMgPSByZXF1aXJlKCdpcycpO1xudmFyIGlzTWV0YSA9IHJlcXVpcmUoJ2lzLW1ldGEnKTtcbnZhciBrZXlzID0gcmVxdWlyZSgnb2JqZWN0Jykua2V5cztcbnZhciBtZW1vcnkgPSByZXF1aXJlKCcuL21lbW9yeScpO1xudmFyIG5vcm1hbGl6ZSA9IHJlcXVpcmUoJy4vbm9ybWFsaXplJyk7XG52YXIgb24gPSByZXF1aXJlKCdldmVudCcpLmJpbmQ7XG52YXIgcGFnZURlZmF1bHRzID0gcmVxdWlyZSgnLi9wYWdlRGVmYXVsdHMnKTtcbnZhciBwaWNrID0gcmVxdWlyZSgncGljaycpO1xudmFyIHByZXZlbnQgPSByZXF1aXJlKCdwcmV2ZW50Jyk7XG52YXIgcXVlcnlzdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xudmFyIHNpemUgPSByZXF1aXJlKCdvYmplY3QnKS5sZW5ndGg7XG52YXIgc3RvcmUgPSByZXF1aXJlKCcuL3N0b3JlJyk7XG52YXIgdXNlciA9IHJlcXVpcmUoJy4vdXNlcicpO1xudmFyIEFsaWFzID0gRmFjYWRlLkFsaWFzO1xudmFyIEdyb3VwID0gRmFjYWRlLkdyb3VwO1xudmFyIElkZW50aWZ5ID0gRmFjYWRlLklkZW50aWZ5O1xudmFyIFBhZ2UgPSBGYWNhZGUuUGFnZTtcbnZhciBUcmFjayA9IEZhY2FkZS5UcmFjaztcblxuLyoqXG4gKiBFeHBvc2UgYEFuYWx5dGljc2AuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gQW5hbHl0aWNzO1xuXG4vKipcbiAqIEV4cG9zZSBzdG9yYWdlLlxuICovXG5cbmV4cG9ydHMuY29va2llID0gY29va2llO1xuZXhwb3J0cy5zdG9yZSA9IHN0b3JlO1xuZXhwb3J0cy5tZW1vcnkgPSBtZW1vcnk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgQW5hbHl0aWNzYCBpbnN0YW5jZS5cbiAqL1xuXG5mdW5jdGlvbiBBbmFseXRpY3MoKSB7XG4gIHRoaXMuX29wdGlvbnMoe30pO1xuICB0aGlzLkludGVncmF0aW9ucyA9IHt9O1xuICB0aGlzLl9pbnRlZ3JhdGlvbnMgPSB7fTtcbiAgdGhpcy5fcmVhZGllZCA9IGZhbHNlO1xuICB0aGlzLl90aW1lb3V0ID0gMzAwO1xuICAvLyBYWFg6IEJBQ0tXQVJEUyBDT01QQVRJQklMSVRZXG4gIHRoaXMuX3VzZXIgPSB1c2VyO1xuICB0aGlzLmxvZyA9IGRlYnVnKCdhbmFseXRpY3MuanMnKTtcbiAgYmluZC5hbGwodGhpcyk7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLm9uKCdpbml0aWFsaXplJywgZnVuY3Rpb24oc2V0dGluZ3MsIG9wdGlvbnMpe1xuICAgIGlmIChvcHRpb25zLmluaXRpYWxQYWdldmlldykgc2VsZi5wYWdlKCk7XG4gICAgc2VsZi5fcGFyc2VRdWVyeSh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcbiAgfSk7XG59XG5cbi8qKlxuICogRXZlbnQgRW1pdHRlci5cbiAqL1xuXG5FbWl0dGVyKEFuYWx5dGljcy5wcm90b3R5cGUpO1xuXG4vKipcbiAqIFVzZSBhIGBwbHVnaW5gLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHBsdWdpblxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24ocGx1Z2luKSB7XG4gIHBsdWdpbih0aGlzKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIERlZmluZSBhIG5ldyBgSW50ZWdyYXRpb25gLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IEludGVncmF0aW9uXG4gKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5hZGRJbnRlZ3JhdGlvbiA9IGZ1bmN0aW9uKEludGVncmF0aW9uKSB7XG4gIHZhciBuYW1lID0gSW50ZWdyYXRpb24ucHJvdG90eXBlLm5hbWU7XG4gIGlmICghbmFtZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYXR0ZW1wdGVkIHRvIGFkZCBhbiBpbnZhbGlkIGludGVncmF0aW9uJyk7XG4gIHRoaXMuSW50ZWdyYXRpb25zW25hbWVdID0gSW50ZWdyYXRpb247XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbml0aWFsaXplIHdpdGggdGhlIGdpdmVuIGludGVncmF0aW9uIGBzZXR0aW5nc2AgYW5kIGBvcHRpb25zYC5cbiAqXG4gKiBBbGlhc2VkIHRvIGBpbml0YCBmb3IgY29udmVuaWVuY2UuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtzZXR0aW5ncz17fV1cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV1cbiAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLmluaXQgPSBBbmFseXRpY3MucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbihzZXR0aW5ncywgb3B0aW9ucykge1xuICBzZXR0aW5ncyA9IHNldHRpbmdzIHx8IHt9O1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB0aGlzLl9vcHRpb25zKG9wdGlvbnMpO1xuICB0aGlzLl9yZWFkaWVkID0gZmFsc2U7XG5cbiAgLy8gY2xlYW4gdW5rbm93biBpbnRlZ3JhdGlvbnMgZnJvbSBzZXR0aW5nc1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGVhY2goc2V0dGluZ3MsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgSW50ZWdyYXRpb24gPSBzZWxmLkludGVncmF0aW9uc1tuYW1lXTtcbiAgICBpZiAoIUludGVncmF0aW9uKSBkZWxldGUgc2V0dGluZ3NbbmFtZV07XG4gIH0pO1xuXG4gIC8vIGFkZCBpbnRlZ3JhdGlvbnNcbiAgZWFjaChzZXR0aW5ncywgZnVuY3Rpb24obmFtZSwgb3B0cykge1xuICAgIHZhciBJbnRlZ3JhdGlvbiA9IHNlbGYuSW50ZWdyYXRpb25zW25hbWVdO1xuICAgIHZhciBpbnRlZ3JhdGlvbiA9IG5ldyBJbnRlZ3JhdGlvbihjbG9uZShvcHRzKSk7XG4gICAgc2VsZi5sb2coJ2luaXRpYWxpemUgJW8gLSAlbycsIG5hbWUsIG9wdHMpO1xuICAgIHNlbGYuYWRkKGludGVncmF0aW9uKTtcbiAgfSk7XG5cbiAgdmFyIGludGVncmF0aW9ucyA9IHRoaXMuX2ludGVncmF0aW9ucztcblxuICAvLyBsb2FkIHVzZXIgbm93IHRoYXQgb3B0aW9ucyBhcmUgc2V0XG4gIHVzZXIubG9hZCgpO1xuICBncm91cC5sb2FkKCk7XG5cbiAgLy8gbWFrZSByZWFkeSBjYWxsYmFja1xuICB2YXIgcmVhZHkgPSBhZnRlcihzaXplKGludGVncmF0aW9ucyksIGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuX3JlYWRpZWQgPSB0cnVlO1xuICAgIHNlbGYuZW1pdCgncmVhZHknKTtcbiAgfSk7XG5cbiAgLy8gaW5pdGlhbGl6ZSBpbnRlZ3JhdGlvbnMsIHBhc3NpbmcgcmVhZHlcbiAgZWFjaChpbnRlZ3JhdGlvbnMsIGZ1bmN0aW9uKG5hbWUsIGludGVncmF0aW9uKSB7XG4gICAgaWYgKG9wdGlvbnMuaW5pdGlhbFBhZ2V2aWV3ICYmIGludGVncmF0aW9uLm9wdGlvbnMuaW5pdGlhbFBhZ2V2aWV3ID09PSBmYWxzZSkge1xuICAgICAgaW50ZWdyYXRpb24ucGFnZSA9IGFmdGVyKDIsIGludGVncmF0aW9uLnBhZ2UpO1xuICAgIH1cblxuICAgIGludGVncmF0aW9uLmFuYWx5dGljcyA9IHNlbGY7XG4gICAgaW50ZWdyYXRpb24ub25jZSgncmVhZHknLCByZWFkeSk7XG4gICAgaW50ZWdyYXRpb24uaW5pdGlhbGl6ZSgpO1xuICB9KTtcblxuICAvLyBiYWNrd2FyZHMgY29tcGF0IHdpdGggYW5ndWxhciBwbHVnaW4uXG4gIC8vIFRPRE86IHJlbW92ZVxuICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcblxuICB0aGlzLmVtaXQoJ2luaXRpYWxpemUnLCBzZXR0aW5ncywgb3B0aW9ucyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIHVzZXIncyBgaWRgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGlkXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5zZXRBbm9ueW1vdXNJZCA9IGZ1bmN0aW9uKGlkKXtcbiAgdGhpcy51c2VyKCkuYW5vbnltb3VzSWQoaWQpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGFuIGludGVncmF0aW9uLlxuICpcbiAqIEBwYXJhbSB7SW50ZWdyYXRpb259IGludGVncmF0aW9uXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihpbnRlZ3JhdGlvbil7XG4gIHRoaXMuX2ludGVncmF0aW9uc1tpbnRlZ3JhdGlvbi5uYW1lXSA9IGludGVncmF0aW9uO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSWRlbnRpZnkgYSB1c2VyIGJ5IG9wdGlvbmFsIGBpZGAgYW5kIGB0cmFpdHNgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbaWQ9dXNlci5pZCgpXSBVc2VyIElELlxuICogQHBhcmFtIHtPYmplY3R9IFt0cmFpdHM9bnVsbF0gVXNlciB0cmFpdHMuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9bnVsbF1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl1cbiAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLmlkZW50aWZ5ID0gZnVuY3Rpb24oaWQsIHRyYWl0cywgb3B0aW9ucywgZm4pIHtcbiAgLy8gQXJndW1lbnQgcmVzaHVmZmxpbmcuXG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucywgbm8tc2VxdWVuY2VzICovXG4gIGlmIChpcy5mbihvcHRpb25zKSkgZm4gPSBvcHRpb25zLCBvcHRpb25zID0gbnVsbDtcbiAgaWYgKGlzLmZuKHRyYWl0cykpIGZuID0gdHJhaXRzLCBvcHRpb25zID0gbnVsbCwgdHJhaXRzID0gbnVsbDtcbiAgaWYgKGlzLm9iamVjdChpZCkpIG9wdGlvbnMgPSB0cmFpdHMsIHRyYWl0cyA9IGlkLCBpZCA9IHVzZXIuaWQoKTtcbiAgLyogZXNsaW50LWVuYWJsZSBuby11bnVzZWQtZXhwcmVzc2lvbnMsIG5vLXNlcXVlbmNlcyAqL1xuXG4gIC8vIGNsb25lIHRyYWl0cyBiZWZvcmUgd2UgbWFuaXB1bGF0ZSBzbyB3ZSBkb24ndCBkbyBhbnl0aGluZyB1bmNvdXRoLCBhbmQgdGFrZVxuICAvLyBmcm9tIGB1c2VyYCBzbyB0aGF0IHdlIGNhcnJ5b3ZlciBhbm9ueW1vdXMgdHJhaXRzXG4gIHVzZXIuaWRlbnRpZnkoaWQsIHRyYWl0cyk7XG5cbiAgdmFyIG1zZyA9IHRoaXMubm9ybWFsaXplKHtcbiAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgIHRyYWl0czogdXNlci50cmFpdHMoKSxcbiAgICB1c2VySWQ6IHVzZXIuaWQoKVxuICB9KTtcblxuICB0aGlzLl9pbnZva2UoJ2lkZW50aWZ5JywgbmV3IElkZW50aWZ5KG1zZykpO1xuXG4gIC8vIGVtaXRcbiAgdGhpcy5lbWl0KCdpZGVudGlmeScsIGlkLCB0cmFpdHMsIG9wdGlvbnMpO1xuICB0aGlzLl9jYWxsYmFjayhmbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgdXNlci5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS51c2VyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB1c2VyO1xufTtcblxuLyoqXG4gKiBJZGVudGlmeSBhIGdyb3VwIGJ5IG9wdGlvbmFsIGBpZGAgYW5kIGB0cmFpdHNgLiBPciwgaWYgbm8gYXJndW1lbnRzIGFyZVxuICogc3VwcGxpZWQsIHJldHVybiB0aGUgY3VycmVudCBncm91cC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW2lkPWdyb3VwLmlkKCldIEdyb3VwIElELlxuICogQHBhcmFtIHtPYmplY3R9IFt0cmFpdHM9bnVsbF0gR3JvdXAgdHJhaXRzLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPW51bGxdXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtBbmFseXRpY3N8T2JqZWN0fVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUuZ3JvdXAgPSBmdW5jdGlvbihpZCwgdHJhaXRzLCBvcHRpb25zLCBmbikge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtZXhwcmVzc2lvbnMsIG5vLXNlcXVlbmNlcyAqL1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBncm91cDtcbiAgaWYgKGlzLmZuKG9wdGlvbnMpKSBmbiA9IG9wdGlvbnMsIG9wdGlvbnMgPSBudWxsO1xuICBpZiAoaXMuZm4odHJhaXRzKSkgZm4gPSB0cmFpdHMsIG9wdGlvbnMgPSBudWxsLCB0cmFpdHMgPSBudWxsO1xuICBpZiAoaXMub2JqZWN0KGlkKSkgb3B0aW9ucyA9IHRyYWl0cywgdHJhaXRzID0gaWQsIGlkID0gZ3JvdXAuaWQoKTtcbiAgLyogZXNsaW50LWVuYWJsZSBuby11bnVzZWQtZXhwcmVzc2lvbnMsIG5vLXNlcXVlbmNlcyAqL1xuXG5cbiAgLy8gZ3JhYiBmcm9tIGdyb3VwIGFnYWluIHRvIG1ha2Ugc3VyZSB3ZSdyZSB0YWtpbmcgZnJvbSB0aGUgc291cmNlXG4gIGdyb3VwLmlkZW50aWZ5KGlkLCB0cmFpdHMpO1xuXG4gIHZhciBtc2cgPSB0aGlzLm5vcm1hbGl6ZSh7XG4gICAgb3B0aW9uczogb3B0aW9ucyxcbiAgICB0cmFpdHM6IGdyb3VwLnRyYWl0cygpLFxuICAgIGdyb3VwSWQ6IGdyb3VwLmlkKClcbiAgfSk7XG5cbiAgdGhpcy5faW52b2tlKCdncm91cCcsIG5ldyBHcm91cChtc2cpKTtcblxuICB0aGlzLmVtaXQoJ2dyb3VwJywgaWQsIHRyYWl0cywgb3B0aW9ucyk7XG4gIHRoaXMuX2NhbGxiYWNrKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRyYWNrIGFuIGBldmVudGAgdGhhdCBhIHVzZXIgaGFzIHRyaWdnZXJlZCB3aXRoIG9wdGlvbmFsIGBwcm9wZXJ0aWVzYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz1udWxsXVxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPW51bGxdXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS50cmFjayA9IGZ1bmN0aW9uKGV2ZW50LCBwcm9wZXJ0aWVzLCBvcHRpb25zLCBmbikge1xuICAvLyBBcmd1bWVudCByZXNodWZmbGluZy5cbiAgLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLWV4cHJlc3Npb25zLCBuby1zZXF1ZW5jZXMgKi9cbiAgaWYgKGlzLmZuKG9wdGlvbnMpKSBmbiA9IG9wdGlvbnMsIG9wdGlvbnMgPSBudWxsO1xuICBpZiAoaXMuZm4ocHJvcGVydGllcykpIGZuID0gcHJvcGVydGllcywgb3B0aW9ucyA9IG51bGwsIHByb3BlcnRpZXMgPSBudWxsO1xuICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucywgbm8tc2VxdWVuY2VzICovXG5cbiAgLy8gZmlndXJlIG91dCBpZiB0aGUgZXZlbnQgaXMgYXJjaGl2ZWQuXG4gIHZhciBwbGFuID0gdGhpcy5vcHRpb25zLnBsYW4gfHwge307XG4gIHZhciBldmVudHMgPSBwbGFuLnRyYWNrIHx8IHt9O1xuXG4gIC8vIG5vcm1hbGl6ZVxuICB2YXIgbXNnID0gdGhpcy5ub3JtYWxpemUoe1xuICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXMsXG4gICAgb3B0aW9uczogb3B0aW9ucyxcbiAgICBldmVudDogZXZlbnRcbiAgfSk7XG5cbiAgLy8gcGxhbi5cbiAgcGxhbiA9IGV2ZW50c1tldmVudF07XG4gIGlmIChwbGFuKSB7XG4gICAgdGhpcy5sb2coJ3BsYW4gJW8gLSAlbycsIGV2ZW50LCBwbGFuKTtcbiAgICBpZiAocGxhbi5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuIHRoaXMuX2NhbGxiYWNrKGZuKTtcbiAgICBkZWZhdWx0cyhtc2cuaW50ZWdyYXRpb25zLCBwbGFuLmludGVncmF0aW9ucyB8fCB7fSk7XG4gIH1cblxuICB0aGlzLl9pbnZva2UoJ3RyYWNrJywgbmV3IFRyYWNrKG1zZykpO1xuXG4gIHRoaXMuZW1pdCgndHJhY2snLCBldmVudCwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gIHRoaXMuX2NhbGxiYWNrKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEhlbHBlciBtZXRob2QgdG8gdHJhY2sgYW4gb3V0Ym91bmQgbGluayB0aGF0IHdvdWxkIG5vcm1hbGx5IG5hdmlnYXRlIGF3YXlcbiAqIGZyb20gdGhlIHBhZ2UgYmVmb3JlIHRoZSBhbmFseXRpY3MgY2FsbHMgd2VyZSBzZW50LlxuICpcbiAqIEJBQ0tXQVJEUyBDT01QQVRJQklMSVRZOiBhbGlhc2VkIHRvIGB0cmFja0NsaWNrYC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR8QXJyYXl9IGxpbmtzXG4gKiBAcGFyYW0ge3N0cmluZ3xGdW5jdGlvbn0gZXZlbnRcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBwcm9wZXJ0aWVzIChvcHRpb25hbClcbiAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAqL1xuXG5BbmFseXRpY3MucHJvdG90eXBlLnRyYWNrQ2xpY2sgPSBBbmFseXRpY3MucHJvdG90eXBlLnRyYWNrTGluayA9IGZ1bmN0aW9uKGxpbmtzLCBldmVudCwgcHJvcGVydGllcykge1xuICBpZiAoIWxpbmtzKSByZXR1cm4gdGhpcztcbiAgLy8gYWx3YXlzIGFycmF5cywgaGFuZGxlcyBqcXVlcnlcbiAgaWYgKGlzLmVsZW1lbnQobGlua3MpKSBsaW5rcyA9IFtsaW5rc107XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBlYWNoKGxpbmtzLCBmdW5jdGlvbihlbCkge1xuICAgIGlmICghaXMuZWxlbWVudChlbCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ011c3QgcGFzcyBIVE1MRWxlbWVudCB0byBgYW5hbHl0aWNzLnRyYWNrTGlua2AuJyk7XG4gICAgb24oZWwsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBldiA9IGlzLmZuKGV2ZW50KSA/IGV2ZW50KGVsKSA6IGV2ZW50O1xuICAgICAgdmFyIHByb3BzID0gaXMuZm4ocHJvcGVydGllcykgPyBwcm9wZXJ0aWVzKGVsKSA6IHByb3BlcnRpZXM7XG4gICAgICB2YXIgaHJlZiA9IGVsLmdldEF0dHJpYnV0ZSgnaHJlZicpXG4gICAgICAgIHx8IGVsLmdldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgJ2hyZWYnKVxuICAgICAgICB8fCBlbC5nZXRBdHRyaWJ1dGUoJ3hsaW5rOmhyZWYnKTtcblxuICAgICAgc2VsZi50cmFjayhldiwgcHJvcHMpO1xuXG4gICAgICBpZiAoaHJlZiAmJiBlbC50YXJnZXQgIT09ICdfYmxhbmsnICYmICFpc01ldGEoZSkpIHtcbiAgICAgICAgcHJldmVudChlKTtcbiAgICAgICAgc2VsZi5fY2FsbGJhY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEhlbHBlciBtZXRob2QgdG8gdHJhY2sgYW4gb3V0Ym91bmQgZm9ybSB0aGF0IHdvdWxkIG5vcm1hbGx5IG5hdmlnYXRlIGF3YXlcbiAqIGZyb20gdGhlIHBhZ2UgYmVmb3JlIHRoZSBhbmFseXRpY3MgY2FsbHMgd2VyZSBzZW50LlxuICpcbiAqIEJBQ0tXQVJEUyBDT01QQVRJQklMSVRZOiBhbGlhc2VkIHRvIGB0cmFja1N1Ym1pdGAuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fEFycmF5fSBmb3Jtc1xuICogQHBhcmFtIHtzdHJpbmd8RnVuY3Rpb259IGV2ZW50XG4gKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gcHJvcGVydGllcyAob3B0aW9uYWwpXG4gKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS50cmFja1N1Ym1pdCA9IEFuYWx5dGljcy5wcm90b3R5cGUudHJhY2tGb3JtID0gZnVuY3Rpb24oZm9ybXMsIGV2ZW50LCBwcm9wZXJ0aWVzKSB7XG4gIGlmICghZm9ybXMpIHJldHVybiB0aGlzO1xuICAvLyBhbHdheXMgYXJyYXlzLCBoYW5kbGVzIGpxdWVyeVxuICBpZiAoaXMuZWxlbWVudChmb3JtcykpIGZvcm1zID0gW2Zvcm1zXTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGVhY2goZm9ybXMsIGZ1bmN0aW9uKGVsKSB7XG4gICAgaWYgKCFpcy5lbGVtZW50KGVsKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignTXVzdCBwYXNzIEhUTUxFbGVtZW50IHRvIGBhbmFseXRpY3MudHJhY2tGb3JtYC4nKTtcbiAgICBmdW5jdGlvbiBoYW5kbGVyKGUpIHtcbiAgICAgIHByZXZlbnQoZSk7XG5cbiAgICAgIHZhciBldiA9IGlzLmZuKGV2ZW50KSA/IGV2ZW50KGVsKSA6IGV2ZW50O1xuICAgICAgdmFyIHByb3BzID0gaXMuZm4ocHJvcGVydGllcykgPyBwcm9wZXJ0aWVzKGVsKSA6IHByb3BlcnRpZXM7XG4gICAgICBzZWxmLnRyYWNrKGV2LCBwcm9wcyk7XG5cbiAgICAgIHNlbGYuX2NhbGxiYWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICBlbC5zdWJtaXQoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFN1cHBvcnQgdGhlIGV2ZW50cyBoYXBwZW5pbmcgdGhyb3VnaCBqUXVlcnkgb3IgWmVwdG8gaW5zdGVhZCBvZiB0aHJvdWdoXG4gICAgLy8gdGhlIG5vcm1hbCBET00gQVBJLCBiZWNhdXNlIGBlbC5zdWJtaXRgIGRvZXNuJ3QgYnViYmxlIHVwIGV2ZW50cy4uLlxuICAgIHZhciAkID0gd2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG87XG4gICAgaWYgKCQpIHtcbiAgICAgICQoZWwpLnN1Ym1pdChoYW5kbGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb24oZWwsICdzdWJtaXQnLCBoYW5kbGVyKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VyIGEgcGFnZXZpZXcsIGxhYmVsaW5nIHRoZSBjdXJyZW50IHBhZ2Ugd2l0aCBhbiBvcHRpb25hbCBgY2F0ZWdvcnlgLFxuICogYG5hbWVgIGFuZCBgcHJvcGVydGllc2AuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFtjYXRlZ29yeV1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZV1cbiAqIEBwYXJhbSB7T2JqZWN0fHN0cmluZ30gW3Byb3BlcnRpZXNdIChvciBwYXRoKVxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZuXVxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUucGFnZSA9IGZ1bmN0aW9uKGNhdGVnb3J5LCBuYW1lLCBwcm9wZXJ0aWVzLCBvcHRpb25zLCBmbikge1xuICAvLyBBcmd1bWVudCByZXNodWZmbGluZy5cbiAgLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLWV4cHJlc3Npb25zLCBuby1zZXF1ZW5jZXMgKi9cbiAgaWYgKGlzLmZuKG9wdGlvbnMpKSBmbiA9IG9wdGlvbnMsIG9wdGlvbnMgPSBudWxsO1xuICBpZiAoaXMuZm4ocHJvcGVydGllcykpIGZuID0gcHJvcGVydGllcywgb3B0aW9ucyA9IHByb3BlcnRpZXMgPSBudWxsO1xuICBpZiAoaXMuZm4obmFtZSkpIGZuID0gbmFtZSwgb3B0aW9ucyA9IHByb3BlcnRpZXMgPSBuYW1lID0gbnVsbDtcbiAgaWYgKGlzLm9iamVjdChjYXRlZ29yeSkpIG9wdGlvbnMgPSBuYW1lLCBwcm9wZXJ0aWVzID0gY2F0ZWdvcnksIG5hbWUgPSBjYXRlZ29yeSA9IG51bGw7XG4gIGlmIChpcy5vYmplY3QobmFtZSkpIG9wdGlvbnMgPSBwcm9wZXJ0aWVzLCBwcm9wZXJ0aWVzID0gbmFtZSwgbmFtZSA9IG51bGw7XG4gIGlmIChpcy5zdHJpbmcoY2F0ZWdvcnkpICYmICFpcy5zdHJpbmcobmFtZSkpIG5hbWUgPSBjYXRlZ29yeSwgY2F0ZWdvcnkgPSBudWxsO1xuICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucywgbm8tc2VxdWVuY2VzICovXG5cbiAgcHJvcGVydGllcyA9IGNsb25lKHByb3BlcnRpZXMpIHx8IHt9O1xuICBpZiAobmFtZSkgcHJvcGVydGllcy5uYW1lID0gbmFtZTtcbiAgaWYgKGNhdGVnb3J5KSBwcm9wZXJ0aWVzLmNhdGVnb3J5ID0gY2F0ZWdvcnk7XG5cbiAgLy8gRW5zdXJlIHByb3BlcnRpZXMgaGFzIGJhc2VsaW5lIHNwZWMgcHJvcGVydGllcy5cbiAgLy8gVE9ETzogRXZlbnR1YWxseSBtb3ZlIHRoZXNlIGVudGlyZWx5IHRvIGBvcHRpb25zLmNvbnRleHQucGFnZWBcbiAgdmFyIGRlZnMgPSBwYWdlRGVmYXVsdHMoKTtcbiAgZGVmYXVsdHMocHJvcGVydGllcywgZGVmcyk7XG5cbiAgLy8gTWlycm9yIHVzZXIgb3ZlcnJpZGVzIHRvIGBvcHRpb25zLmNvbnRleHQucGFnZWAgKGJ1dCBleGNsdWRlIGN1c3RvbSBwcm9wZXJ0aWVzKVxuICAvLyAoQW55IHBhZ2UgZGVmYXVsdHMgZ2V0IGFwcGxpZWQgaW4gYHRoaXMubm9ybWFsaXplYCBmb3IgY29uc2lzdGVuY3kuKVxuICAvLyBXZWlyZCwgeWVhaC0tbW92aW5nIHNwZWNpYWwgcHJvcHMgdG8gYGNvbnRleHQucGFnZWAgd2lsbCBmaXggdGhpcyBpbiB0aGUgbG9uZyB0ZXJtLlxuICB2YXIgb3ZlcnJpZGVzID0gcGljayhrZXlzKGRlZnMpLCBwcm9wZXJ0aWVzKTtcbiAgaWYgKCFpcy5lbXB0eShvdmVycmlkZXMpKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy5jb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0IHx8IHt9O1xuICAgIG9wdGlvbnMuY29udGV4dC5wYWdlID0gb3ZlcnJpZGVzO1xuICB9XG5cbiAgdmFyIG1zZyA9IHRoaXMubm9ybWFsaXplKHtcbiAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzLFxuICAgIGNhdGVnb3J5OiBjYXRlZ29yeSxcbiAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgIG5hbWU6IG5hbWVcbiAgfSk7XG5cbiAgdGhpcy5faW52b2tlKCdwYWdlJywgbmV3IFBhZ2UobXNnKSk7XG5cbiAgdGhpcy5lbWl0KCdwYWdlJywgY2F0ZWdvcnksIG5hbWUsIHByb3BlcnRpZXMsIG9wdGlvbnMpO1xuICB0aGlzLl9jYWxsYmFjayhmbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBGSVhNRTogQkFDS1dBUkRTIENPTVBBVElCSUxJVFk6IGNvbnZlcnQgYW4gb2xkIGBwYWdldmlld2AgdG8gYSBgcGFnZWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW3VybF1cbiAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUucGFnZXZpZXcgPSBmdW5jdGlvbih1cmwpIHtcbiAgdmFyIHByb3BlcnRpZXMgPSB7fTtcbiAgaWYgKHVybCkgcHJvcGVydGllcy5wYXRoID0gdXJsO1xuICB0aGlzLnBhZ2UocHJvcGVydGllcyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNZXJnZSB0d28gcHJldmlvdXNseSB1bmFzc29jaWF0ZWQgdXNlciBpZGVudGl0aWVzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0b1xuICogQHBhcmFtIHtzdHJpbmd9IGZyb20gKG9wdGlvbmFsKVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gKG9wdGlvbmFsKVxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUuYWxpYXMgPSBmdW5jdGlvbih0bywgZnJvbSwgb3B0aW9ucywgZm4pIHtcbiAgLy8gQXJndW1lbnQgcmVzaHVmZmxpbmcuXG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucywgbm8tc2VxdWVuY2VzICovXG4gIGlmIChpcy5mbihvcHRpb25zKSkgZm4gPSBvcHRpb25zLCBvcHRpb25zID0gbnVsbDtcbiAgaWYgKGlzLmZuKGZyb20pKSBmbiA9IGZyb20sIG9wdGlvbnMgPSBudWxsLCBmcm9tID0gbnVsbDtcbiAgaWYgKGlzLm9iamVjdChmcm9tKSkgb3B0aW9ucyA9IGZyb20sIGZyb20gPSBudWxsO1xuICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucywgbm8tc2VxdWVuY2VzICovXG5cbiAgdmFyIG1zZyA9IHRoaXMubm9ybWFsaXplKHtcbiAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgIHByZXZpb3VzSWQ6IGZyb20sXG4gICAgdXNlcklkOiB0b1xuICB9KTtcblxuICB0aGlzLl9pbnZva2UoJ2FsaWFzJywgbmV3IEFsaWFzKG1zZykpO1xuXG4gIHRoaXMuZW1pdCgnYWxpYXMnLCB0bywgZnJvbSwgb3B0aW9ucyk7XG4gIHRoaXMuX2NhbGxiYWNrKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgYGZuYCB0byBiZSBmaXJlZCB3aGVuIGFsbCB0aGUgYW5hbHl0aWNzIHNlcnZpY2VzIGFyZSByZWFkeS5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUucmVhZHkgPSBmdW5jdGlvbihmbikge1xuICBpZiAoaXMuZm4oZm4pKSB7XG4gICAgaWYgKHRoaXMuX3JlYWRpZWQpIHtcbiAgICAgIGNhbGxiYWNrLmFzeW5jKGZuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vbmNlKCdyZWFkeScsIGZuKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgYHRpbWVvdXRgIChpbiBtaWxsaXNlY29uZHMpIHVzZWQgZm9yIGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGltZW91dFxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHtcbiAgdGhpcy5fdGltZW91dCA9IHRpbWVvdXQ7XG59O1xuXG4vKipcbiAqIEVuYWJsZSBvciBkaXNhYmxlIGRlYnVnLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IHN0clxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUuZGVidWcgPSBmdW5jdGlvbihzdHIpe1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGggfHwgc3RyKSB7XG4gICAgZGVidWcuZW5hYmxlKCdhbmFseXRpY3M6JyArIChzdHIgfHwgJyonKSk7XG4gIH0gZWxzZSB7XG4gICAgZGVidWcuZGlzYWJsZSgpO1xuICB9XG59O1xuXG4vKipcbiAqIEFwcGx5IG9wdGlvbnMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUuX29wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICBjb29raWUub3B0aW9ucyhvcHRpb25zLmNvb2tpZSk7XG4gIHN0b3JlLm9wdGlvbnMob3B0aW9ucy5sb2NhbFN0b3JhZ2UpO1xuICB1c2VyLm9wdGlvbnMob3B0aW9ucy51c2VyKTtcbiAgZ3JvdXAub3B0aW9ucyhvcHRpb25zLmdyb3VwKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENhbGxiYWNrIGEgYGZuYCBhZnRlciBvdXIgZGVmaW5lZCB0aW1lb3V0IHBlcmlvZC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5fY2FsbGJhY2sgPSBmdW5jdGlvbihmbikge1xuICBjYWxsYmFjay5hc3luYyhmbiwgdGhpcy5fdGltZW91dCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDYWxsIGBtZXRob2RgIHdpdGggYGZhY2FkZWAgb24gYWxsIGVuYWJsZWQgaW50ZWdyYXRpb25zLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2RcbiAqIEBwYXJhbSB7RmFjYWRlfSBmYWNhZGVcbiAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUuX2ludm9rZSA9IGZ1bmN0aW9uKG1ldGhvZCwgZmFjYWRlKSB7XG4gIHRoaXMuZW1pdCgnaW52b2tlJywgZmFjYWRlKTtcblxuICBlYWNoKHRoaXMuX2ludGVncmF0aW9ucywgZnVuY3Rpb24obmFtZSwgaW50ZWdyYXRpb24pIHtcbiAgICBpZiAoIWZhY2FkZS5lbmFibGVkKG5hbWUpKSByZXR1cm47XG4gICAgaW50ZWdyYXRpb24uaW52b2tlLmNhbGwoaW50ZWdyYXRpb24sIG1ldGhvZCwgZmFjYWRlKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFB1c2ggYGFyZ3NgLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3NcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKGFyZ3Mpe1xuICB2YXIgbWV0aG9kID0gYXJncy5zaGlmdCgpO1xuICBpZiAoIXRoaXNbbWV0aG9kXSkgcmV0dXJuO1xuICB0aGlzW21ldGhvZF0uYXBwbHkodGhpcywgYXJncyk7XG59O1xuXG4vKipcbiAqIFJlc2V0IGdyb3VwIGFuZCB1c2VyIHRyYWl0cyBhbmQgaWQncy5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkFuYWx5dGljcy5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpe1xuICB0aGlzLnVzZXIoKS5sb2dvdXQoKTtcbiAgdGhpcy5ncm91cCgpLmxvZ291dCgpO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgcXVlcnkgc3RyaW5nIGZvciBjYWxsYWJsZSBtZXRob2RzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBxdWVyeVxuICogQHJldHVybiB7QW5hbHl0aWNzfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5fcGFyc2VRdWVyeSA9IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gIC8vIFBhcnNlIHF1ZXJ5c3RyaW5nIHRvIGFuIG9iamVjdFxuICB2YXIgcSA9IHF1ZXJ5c3RyaW5nLnBhcnNlKHF1ZXJ5KTtcbiAgLy8gQ3JlYXRlIHRyYWl0cyBhbmQgcHJvcGVydGllcyBvYmplY3RzLCBwb3B1bGF0ZSBmcm9tIHF1ZXJ5c3RpbmcgcGFyYW1zXG4gIHZhciB0cmFpdHMgPSBwaWNrUHJlZml4KCdhanNfdHJhaXRfJywgcSk7XG4gIHZhciBwcm9wcyA9IHBpY2tQcmVmaXgoJ2Fqc19wcm9wXycsIHEpO1xuICAvLyBUcmlnZ2VyIGJhc2VkIG9uIGNhbGxhYmxlIHBhcmFtZXRlcnMgaW4gdGhlIFVSTFxuICBpZiAocS5hanNfdWlkKSB0aGlzLmlkZW50aWZ5KHEuYWpzX3VpZCwgdHJhaXRzKTtcbiAgaWYgKHEuYWpzX2V2ZW50KSB0aGlzLnRyYWNrKHEuYWpzX2V2ZW50LCBwcm9wcyk7XG4gIGlmIChxLmFqc19haWQpIHVzZXIuYW5vbnltb3VzSWQocS5hanNfYWlkKTtcbiAgcmV0dXJuIHRoaXM7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIHNoYWxsb3cgY29weSBvZiBhbiBpbnB1dCBvYmplY3QgY29udGFpbmluZyBvbmx5IHRoZSBwcm9wZXJ0aWVzXG4gICAqIHdob3NlIGtleXMgYXJlIHNwZWNpZmllZCBieSBhIHByZWZpeCwgc3RyaXBwZWQgb2YgdGhhdCBwcmVmaXhcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHByZWZpeFxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHBpY2tQcmVmaXgocHJlZml4LCBvYmplY3QpIHtcbiAgICB2YXIgbGVuZ3RoID0gcHJlZml4Lmxlbmd0aDtcbiAgICB2YXIgc3ViO1xuICAgIHJldHVybiBmb2xkbChmdW5jdGlvbihhY2MsIHZhbCwga2V5KSB7XG4gICAgICBpZiAoa2V5LnN1YnN0cigwLCBsZW5ndGgpID09PSBwcmVmaXgpIHtcbiAgICAgICAgc3ViID0ga2V5LnN1YnN0cihsZW5ndGgpO1xuICAgICAgICBhY2Nbc3ViXSA9IHZhbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30sIG9iamVjdCk7XG4gIH1cbn07XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSBnaXZlbiBgbXNnYC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbXNnXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbihtc2cpe1xuICBtc2cgPSBub3JtYWxpemUobXNnLCBrZXlzKHRoaXMuX2ludGVncmF0aW9ucykpO1xuICBpZiAobXNnLmFub255bW91c0lkKSB1c2VyLmFub255bW91c0lkKG1zZy5hbm9ueW1vdXNJZCk7XG4gIG1zZy5hbm9ueW1vdXNJZCA9IHVzZXIuYW5vbnltb3VzSWQoKTtcblxuICAvLyBFbnN1cmUgYWxsIG91dGdvaW5nIHJlcXVlc3RzIGluY2x1ZGUgcGFnZSBkYXRhIGluIHRoZWlyIGNvbnRleHRzLlxuICBtc2cuY29udGV4dC5wYWdlID0gZGVmYXVsdHMobXNnLmNvbnRleHQucGFnZSB8fCB7fSwgcGFnZURlZmF1bHRzKCkpO1xuXG4gIHJldHVybiBtc2c7XG59O1xuXG4vKipcbiAqIE5vIGNvbmZsaWN0IHN1cHBvcnQuXG4gKi9cblxuQW5hbHl0aWNzLnByb3RvdHlwZS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKXtcbiAgd2luZG93LmFuYWx5dGljcyA9IF9hbmFseXRpY3M7XG4gIHJldHVybiB0aGlzO1xufTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBpbmRleCA9IHJlcXVpcmUoJ2luZGV4b2YnKTtcblxuLyoqXG4gKiBFeHBvc2UgYEVtaXR0ZXJgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gRW1pdHRlcjtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBFbWl0dGVyYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIEVtaXR0ZXIob2JqKSB7XG4gIGlmIChvYmopIHJldHVybiBtaXhpbihvYmopO1xufTtcblxuLyoqXG4gKiBNaXhpbiB0aGUgZW1pdHRlciBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG1peGluKG9iaikge1xuICBmb3IgKHZhciBrZXkgaW4gRW1pdHRlci5wcm90b3R5cGUpIHtcbiAgICBvYmpba2V5XSA9IEVtaXR0ZXIucHJvdG90eXBlW2tleV07XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBMaXN0ZW4gb24gdGhlIGdpdmVuIGBldmVudGAgd2l0aCBgZm5gLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uID1cbkVtaXR0ZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gICh0aGlzLl9jYWxsYmFja3NbZXZlbnRdID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XSB8fCBbXSlcbiAgICAucHVzaChmbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGRzIGFuIGBldmVudGAgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGludm9rZWQgYSBzaW5nbGVcbiAqIHRpbWUgdGhlbiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIGZ1bmN0aW9uIG9uKCkge1xuICAgIHNlbGYub2ZmKGV2ZW50LCBvbik7XG4gICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIGZuLl9vZmYgPSBvbjtcbiAgdGhpcy5vbihldmVudCwgb24pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgYGV2ZW50YCBvciBhbGxcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9mZiA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICAvLyBhbGxcbiAgaWYgKDAgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gc3BlY2lmaWMgZXZlbnRcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1tldmVudF07XG4gIGlmICghY2FsbGJhY2tzKSByZXR1cm4gdGhpcztcblxuICAvLyByZW1vdmUgYWxsIGhhbmRsZXJzXG4gIGlmICgxID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHJlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXG4gIHZhciBpID0gaW5kZXgoY2FsbGJhY2tzLCBmbi5fb2ZmIHx8IGZuKTtcbiAgaWYgKH5pKSBjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge01peGVkfSAuLi5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICAgICwgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcblxuICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLnNsaWNlKDApO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjYWxsYmFja3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgYGV2ZW50YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgcmV0dXJuIHRoaXMuX2NhbGxiYWNrc1tldmVudF0gfHwgW107XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoaXMgZW1pdHRlciBoYXMgYGV2ZW50YCBoYW5kbGVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmhhc0xpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgcmV0dXJuICEhIHRoaXMubGlzdGVuZXJzKGV2ZW50KS5sZW5ndGg7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIG9iail7XG4gIGlmIChhcnIuaW5kZXhPZikgcmV0dXJuIGFyci5pbmRleE9mKG9iaik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKGFycltpXSA9PT0gb2JqKSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59OyIsIlxudmFyIEZhY2FkZSA9IHJlcXVpcmUoJy4vZmFjYWRlJyk7XG5cbi8qKlxuICogRXhwb3NlIGBGYWNhZGVgIGZhY2FkZS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhY2FkZTtcblxuLyoqXG4gKiBFeHBvc2Ugc3BlY2lmaWMtbWV0aG9kIGZhY2FkZXMuXG4gKi9cblxuRmFjYWRlLkFsaWFzID0gcmVxdWlyZSgnLi9hbGlhcycpO1xuRmFjYWRlLkdyb3VwID0gcmVxdWlyZSgnLi9ncm91cCcpO1xuRmFjYWRlLklkZW50aWZ5ID0gcmVxdWlyZSgnLi9pZGVudGlmeScpO1xuRmFjYWRlLlRyYWNrID0gcmVxdWlyZSgnLi90cmFjaycpO1xuRmFjYWRlLlBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKTtcbkZhY2FkZS5TY3JlZW4gPSByZXF1aXJlKCcuL3NjcmVlbicpO1xuIiwiXG52YXIgdHJhdmVyc2UgPSByZXF1aXJlKCdpc29kYXRlLXRyYXZlcnNlJyk7XG52YXIgaXNFbmFibGVkID0gcmVxdWlyZSgnLi9pcy1lbmFibGVkJyk7XG52YXIgY2xvbmUgPSByZXF1aXJlKCcuL3V0aWxzJykuY2xvbmU7XG52YXIgdHlwZSA9IHJlcXVpcmUoJy4vdXRpbHMnKS50eXBlO1xudmFyIGFkZHJlc3MgPSByZXF1aXJlKCcuL2FkZHJlc3MnKTtcbnZhciBvYmpDYXNlID0gcmVxdWlyZSgnb2JqLWNhc2UnKTtcbnZhciBuZXdEYXRlID0gcmVxdWlyZSgnbmV3LWRhdGUnKTtcblxuLyoqXG4gKiBFeHBvc2UgYEZhY2FkZWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBGYWNhZGU7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgRmFjYWRlYCB3aXRoIGFuIGBvYmpgIG9mIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKi9cblxuZnVuY3Rpb24gRmFjYWRlIChvYmopIHtcbiAgb2JqID0gY2xvbmUob2JqKTtcbiAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoJ3RpbWVzdGFtcCcpKSBvYmoudGltZXN0YW1wID0gbmV3IERhdGUoKTtcbiAgZWxzZSBvYmoudGltZXN0YW1wID0gbmV3RGF0ZShvYmoudGltZXN0YW1wKTtcbiAgdHJhdmVyc2Uob2JqKTtcbiAgdGhpcy5vYmogPSBvYmo7XG59XG5cbi8qKlxuICogTWl4aW4gYWRkcmVzcyB0cmFpdHMuXG4gKi9cblxuYWRkcmVzcyhGYWNhZGUucHJvdG90eXBlKTtcblxuLyoqXG4gKiBSZXR1cm4gYSBwcm94eSBmdW5jdGlvbiBmb3IgYSBgZmllbGRgIHRoYXQgd2lsbCBhdHRlbXB0IHRvIGZpcnN0IHVzZSBtZXRob2RzLFxuICogYW5kIGZhbGxiYWNrIHRvIGFjY2Vzc2luZyB0aGUgdW5kZXJseWluZyBvYmplY3QgZGlyZWN0bHkuIFlvdSBjYW4gc3BlY2lmeVxuICogZGVlcGx5IG5lc3RlZCBmaWVsZHMgdG9vIGxpa2U6XG4gKlxuICogICB0aGlzLnByb3h5KCdvcHRpb25zLkxpYnJhdG8nKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqL1xuXG5GYWNhZGUucHJvdG90eXBlLnByb3h5ID0gZnVuY3Rpb24gKGZpZWxkKSB7XG4gIHZhciBmaWVsZHMgPSBmaWVsZC5zcGxpdCgnLicpO1xuICBmaWVsZCA9IGZpZWxkcy5zaGlmdCgpO1xuXG4gIC8vIENhbGwgYSBmdW5jdGlvbiBhdCB0aGUgYmVnaW5uaW5nIHRvIHRha2UgYWR2YW50YWdlIG9mIGZhY2FkZWQgZmllbGRzXG4gIHZhciBvYmogPSB0aGlzW2ZpZWxkXSB8fCB0aGlzLmZpZWxkKGZpZWxkKTtcbiAgaWYgKCFvYmopIHJldHVybiBvYmo7XG4gIGlmICh0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nKSBvYmogPSBvYmouY2FsbCh0aGlzKSB8fCB7fTtcbiAgaWYgKGZpZWxkcy5sZW5ndGggPT09IDApIHJldHVybiB0cmFuc2Zvcm0ob2JqKTtcblxuICBvYmogPSBvYmpDYXNlKG9iaiwgZmllbGRzLmpvaW4oJy4nKSk7XG4gIHJldHVybiB0cmFuc2Zvcm0ob2JqKTtcbn07XG5cbi8qKlxuICogRGlyZWN0bHkgYWNjZXNzIGEgc3BlY2lmaWMgYGZpZWxkYCBmcm9tIHRoZSB1bmRlcmx5aW5nIG9iamVjdCwgcmV0dXJuaW5nIGFcbiAqIGNsb25lIHNvIG91dHNpZGVycyBkb24ndCBtZXNzIHdpdGggc3R1ZmYuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqL1xuXG5GYWNhZGUucHJvdG90eXBlLmZpZWxkID0gZnVuY3Rpb24gKGZpZWxkKSB7XG4gIHZhciBvYmogPSB0aGlzLm9ialtmaWVsZF07XG4gIHJldHVybiB0cmFuc2Zvcm0ob2JqKTtcbn07XG5cbi8qKlxuICogVXRpbGl0eSBtZXRob2QgdG8gYWx3YXlzIHByb3h5IGEgcGFydGljdWxhciBgZmllbGRgLiBZb3UgY2FuIHNwZWNpZnkgZGVlcGx5XG4gKiBuZXN0ZWQgZmllbGRzIHRvbyBsaWtlOlxuICpcbiAqICAgRmFjYWRlLnByb3h5KCdvcHRpb25zLkxpYnJhdG8nKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbkZhY2FkZS5wcm94eSA9IGZ1bmN0aW9uIChmaWVsZCkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3h5KGZpZWxkKTtcbiAgfTtcbn07XG5cbi8qKlxuICogVXRpbGl0eSBtZXRob2QgdG8gZGlyZWN0bHkgYWNjZXNzIGEgYGZpZWxkYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbkZhY2FkZS5maWVsZCA9IGZ1bmN0aW9uIChmaWVsZCkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZpZWxkKGZpZWxkKTtcbiAgfTtcbn07XG5cbi8qKlxuICogUHJveHkgbXVsdGlwbGUgYHBhdGhgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuXG5GYWNhZGUubXVsdGkgPSBmdW5jdGlvbihwYXRoKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgdmFyIG11bHRpID0gdGhpcy5wcm94eShwYXRoICsgJ3MnKTtcbiAgICBpZiAoJ2FycmF5JyA9PSB0eXBlKG11bHRpKSkgcmV0dXJuIG11bHRpO1xuICAgIHZhciBvbmUgPSB0aGlzLnByb3h5KHBhdGgpO1xuICAgIGlmIChvbmUpIG9uZSA9IFtjbG9uZShvbmUpXTtcbiAgICByZXR1cm4gb25lIHx8IFtdO1xuICB9O1xufTtcblxuLyoqXG4gKiBQcm94eSBvbmUgYHBhdGhgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqL1xuXG5GYWNhZGUub25lID0gZnVuY3Rpb24ocGF0aCl7XG4gIHJldHVybiBmdW5jdGlvbigpe1xuICAgIHZhciBvbmUgPSB0aGlzLnByb3h5KHBhdGgpO1xuICAgIGlmIChvbmUpIHJldHVybiBvbmU7XG4gICAgdmFyIG11bHRpID0gdGhpcy5wcm94eShwYXRoICsgJ3MnKTtcbiAgICBpZiAoJ2FycmF5JyA9PSB0eXBlKG11bHRpKSkgcmV0dXJuIG11bHRpWzBdO1xuICB9O1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGJhc2ljIGpzb24gb2JqZWN0IG9mIHRoaXMgZmFjYWRlLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5GYWNhZGUucHJvdG90eXBlLmpzb24gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByZXQgPSBjbG9uZSh0aGlzLm9iaik7XG4gIGlmICh0aGlzLnR5cGUpIHJldC50eXBlID0gdGhpcy50eXBlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgb3B0aW9ucyBvZiBhIGNhbGwgKGZvcm1lcmx5IGNhbGxlZCBcImNvbnRleHRcIikuIElmIHlvdSBwYXNzIGFuXG4gKiBpbnRlZ3JhdGlvbiBuYW1lLCBpdCB3aWxsIGdldCB0aGUgb3B0aW9ucyBmb3IgdGhhdCBzcGVjaWZpYyBpbnRlZ3JhdGlvbiwgb3JcbiAqIHVuZGVmaW5lZCBpZiB0aGUgaW50ZWdyYXRpb24gaXMgbm90IGVuYWJsZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGludGVncmF0aW9uIChvcHRpb25hbClcbiAqIEByZXR1cm4ge09iamVjdCBvciBOdWxsfVxuICovXG5cbkZhY2FkZS5wcm90b3R5cGUuY29udGV4dCA9XG5GYWNhZGUucHJvdG90eXBlLm9wdGlvbnMgPSBmdW5jdGlvbiAoaW50ZWdyYXRpb24pIHtcbiAgdmFyIG9wdGlvbnMgPSBjbG9uZSh0aGlzLm9iai5vcHRpb25zIHx8IHRoaXMub2JqLmNvbnRleHQpIHx8IHt9O1xuICBpZiAoIWludGVncmF0aW9uKSByZXR1cm4gY2xvbmUob3B0aW9ucyk7XG4gIGlmICghdGhpcy5lbmFibGVkKGludGVncmF0aW9uKSkgcmV0dXJuO1xuICB2YXIgaW50ZWdyYXRpb25zID0gdGhpcy5pbnRlZ3JhdGlvbnMoKTtcbiAgdmFyIHZhbHVlID0gaW50ZWdyYXRpb25zW2ludGVncmF0aW9uXSB8fCBvYmpDYXNlKGludGVncmF0aW9ucywgaW50ZWdyYXRpb24pO1xuICBpZiAoJ2Jvb2xlYW4nID09IHR5cGVvZiB2YWx1ZSkgdmFsdWUgPSB7fTtcbiAgcmV0dXJuIHZhbHVlIHx8IHt9O1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGludGVncmF0aW9uIGlzIGVuYWJsZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGludGVncmF0aW9uXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbkZhY2FkZS5wcm90b3R5cGUuZW5hYmxlZCA9IGZ1bmN0aW9uIChpbnRlZ3JhdGlvbikge1xuICB2YXIgYWxsRW5hYmxlZCA9IHRoaXMucHJveHkoJ29wdGlvbnMucHJvdmlkZXJzLmFsbCcpO1xuICBpZiAodHlwZW9mIGFsbEVuYWJsZWQgIT09ICdib29sZWFuJykgYWxsRW5hYmxlZCA9IHRoaXMucHJveHkoJ29wdGlvbnMuYWxsJyk7XG4gIGlmICh0eXBlb2YgYWxsRW5hYmxlZCAhPT0gJ2Jvb2xlYW4nKSBhbGxFbmFibGVkID0gdGhpcy5wcm94eSgnaW50ZWdyYXRpb25zLmFsbCcpO1xuICBpZiAodHlwZW9mIGFsbEVuYWJsZWQgIT09ICdib29sZWFuJykgYWxsRW5hYmxlZCA9IHRydWU7XG5cbiAgdmFyIGVuYWJsZWQgPSBhbGxFbmFibGVkICYmIGlzRW5hYmxlZChpbnRlZ3JhdGlvbik7XG4gIHZhciBvcHRpb25zID0gdGhpcy5pbnRlZ3JhdGlvbnMoKTtcblxuICAvLyBJZiB0aGUgaW50ZWdyYXRpb24gaXMgZXhwbGljaXRseSBlbmFibGVkIG9yIGRpc2FibGVkLCB1c2UgdGhhdFxuICAvLyBGaXJzdCwgY2hlY2sgb3B0aW9ucy5wcm92aWRlcnMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gIGlmIChvcHRpb25zLnByb3ZpZGVycyAmJiBvcHRpb25zLnByb3ZpZGVycy5oYXNPd25Qcm9wZXJ0eShpbnRlZ3JhdGlvbikpIHtcbiAgICBlbmFibGVkID0gb3B0aW9ucy5wcm92aWRlcnNbaW50ZWdyYXRpb25dO1xuICB9XG5cbiAgLy8gTmV4dCwgY2hlY2sgZm9yIHRoZSBpbnRlZ3JhdGlvbidzIGV4aXN0ZW5jZSBpbiAnb3B0aW9ucycgdG8gZW5hYmxlIGl0LlxuICAvLyBJZiB0aGUgc2V0dGluZ3MgYXJlIGEgYm9vbGVhbiwgdXNlIHRoYXQsIG90aGVyd2lzZSBpdCBzaG91bGQgYmUgZW5hYmxlZC5cbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaW50ZWdyYXRpb24pKSB7XG4gICAgdmFyIHNldHRpbmdzID0gb3B0aW9uc1tpbnRlZ3JhdGlvbl07XG4gICAgaWYgKHR5cGVvZiBzZXR0aW5ncyA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBlbmFibGVkID0gc2V0dGluZ3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVuYWJsZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbmFibGVkID8gdHJ1ZSA6IGZhbHNlO1xufTtcblxuLyoqXG4gKiBHZXQgYWxsIGBpbnRlZ3JhdGlvbmAgb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaW50ZWdyYXRpb25cbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbkZhY2FkZS5wcm90b3R5cGUuaW50ZWdyYXRpb25zID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMub2JqLmludGVncmF0aW9uc1xuICAgIHx8IHRoaXMucHJveHkoJ29wdGlvbnMucHJvdmlkZXJzJylcbiAgICB8fCB0aGlzLm9wdGlvbnMoKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgdXNlciBpcyBhY3RpdmUuXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5GYWNhZGUucHJvdG90eXBlLmFjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGFjdGl2ZSA9IHRoaXMucHJveHkoJ29wdGlvbnMuYWN0aXZlJyk7XG4gIGlmIChhY3RpdmUgPT09IG51bGwgfHwgYWN0aXZlID09PSB1bmRlZmluZWQpIGFjdGl2ZSA9IHRydWU7XG4gIHJldHVybiBhY3RpdmU7XG59O1xuXG4vKipcbiAqIEdldCBgc2Vzc2lvbklkIC8gYW5vbnltb3VzSWRgLlxuICpcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5GYWNhZGUucHJvdG90eXBlLnNlc3Npb25JZCA9XG5GYWNhZGUucHJvdG90eXBlLmFub255bW91c0lkID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMuZmllbGQoJ2Fub255bW91c0lkJylcbiAgICB8fCB0aGlzLmZpZWxkKCdzZXNzaW9uSWQnKTtcbn07XG5cbi8qKlxuICogR2V0IGBncm91cElkYCBmcm9tIGBjb250ZXh0Lmdyb3VwSWRgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRmFjYWRlLnByb3RvdHlwZS5ncm91cElkID0gRmFjYWRlLnByb3h5KCdvcHRpb25zLmdyb3VwSWQnKTtcblxuLyoqXG4gKiBHZXQgdGhlIGNhbGwncyBcInN1cGVyIHByb3BlcnRpZXNcIiB3aGljaCBhcmUganVzdCB0cmFpdHMgdGhhdCBoYXZlIGJlZW5cbiAqIHBhc3NlZCBpbiBhcyBpZiBmcm9tIGFuIGlkZW50aWZ5IGNhbGwuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFsaWFzZXNcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5GYWNhZGUucHJvdG90eXBlLnRyYWl0cyA9IGZ1bmN0aW9uIChhbGlhc2VzKSB7XG4gIHZhciByZXQgPSB0aGlzLnByb3h5KCdvcHRpb25zLnRyYWl0cycpIHx8IHt9O1xuICB2YXIgaWQgPSB0aGlzLnVzZXJJZCgpO1xuICBhbGlhc2VzID0gYWxpYXNlcyB8fCB7fTtcblxuICBpZiAoaWQpIHJldC5pZCA9IGlkO1xuXG4gIGZvciAodmFyIGFsaWFzIGluIGFsaWFzZXMpIHtcbiAgICB2YXIgdmFsdWUgPSBudWxsID09IHRoaXNbYWxpYXNdXG4gICAgICA/IHRoaXMucHJveHkoJ29wdGlvbnMudHJhaXRzLicgKyBhbGlhcylcbiAgICAgIDogdGhpc1thbGlhc10oKTtcbiAgICBpZiAobnVsbCA9PSB2YWx1ZSkgY29udGludWU7XG4gICAgcmV0W2FsaWFzZXNbYWxpYXNdXSA9IHZhbHVlO1xuICAgIGRlbGV0ZSByZXRbYWxpYXNdO1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn07XG5cbi8qKlxuICogQWRkIGEgY29udmVuaWVudCB3YXkgdG8gZ2V0IHRoZSBsaWJyYXJ5IG5hbWUgYW5kIHZlcnNpb25cbiAqL1xuXG5GYWNhZGUucHJvdG90eXBlLmxpYnJhcnkgPSBmdW5jdGlvbigpe1xuICB2YXIgbGlicmFyeSA9IHRoaXMucHJveHkoJ29wdGlvbnMubGlicmFyeScpO1xuICBpZiAoIWxpYnJhcnkpIHJldHVybiB7IG5hbWU6ICd1bmtub3duJywgdmVyc2lvbjogbnVsbCB9O1xuICBpZiAodHlwZW9mIGxpYnJhcnkgPT09ICdzdHJpbmcnKSByZXR1cm4geyBuYW1lOiBsaWJyYXJ5LCB2ZXJzaW9uOiBudWxsIH07XG4gIHJldHVybiBsaWJyYXJ5O1xufTtcblxuLyoqXG4gKiBTZXR1cCBzb21lIGJhc2ljIHByb3hpZXMuXG4gKi9cblxuRmFjYWRlLnByb3RvdHlwZS51c2VySWQgPSBGYWNhZGUuZmllbGQoJ3VzZXJJZCcpO1xuRmFjYWRlLnByb3RvdHlwZS5jaGFubmVsID0gRmFjYWRlLmZpZWxkKCdjaGFubmVsJyk7XG5GYWNhZGUucHJvdG90eXBlLnRpbWVzdGFtcCA9IEZhY2FkZS5maWVsZCgndGltZXN0YW1wJyk7XG5GYWNhZGUucHJvdG90eXBlLnVzZXJBZ2VudCA9IEZhY2FkZS5wcm94eSgnb3B0aW9ucy51c2VyQWdlbnQnKTtcbkZhY2FkZS5wcm90b3R5cGUuaXAgPSBGYWNhZGUucHJveHkoJ29wdGlvbnMuaXAnKTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGNsb25lZCBhbmQgdHJhdmVyc2VkIG9iamVjdFxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IG9ialxuICogQHJldHVybiB7TWl4ZWR9XG4gKi9cblxuZnVuY3Rpb24gdHJhbnNmb3JtKG9iail7XG4gIHZhciBjbG9uZWQgPSBjbG9uZShvYmopO1xuICByZXR1cm4gY2xvbmVkO1xufVxuIiwiXG52YXIgaXMgPSByZXF1aXJlKCdpcycpO1xudmFyIGlzb2RhdGUgPSByZXF1aXJlKCdpc29kYXRlJyk7XG52YXIgZWFjaDtcblxudHJ5IHtcbiAgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcbn0gY2F0Y2ggKGVycikge1xuICBlYWNoID0gcmVxdWlyZSgnZWFjaC1jb21wb25lbnQnKTtcbn1cblxuLyoqXG4gKiBFeHBvc2UgYHRyYXZlcnNlYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRyYXZlcnNlO1xuXG4vKipcbiAqIFRyYXZlcnNlIGFuIG9iamVjdCBvciBhcnJheSwgYW5kIHJldHVybiBhIGNsb25lIHdpdGggYWxsIElTTyBzdHJpbmdzIHBhcnNlZFxuICogaW50byBEYXRlIG9iamVjdHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIHRyYXZlcnNlIChpbnB1dCwgc3RyaWN0KSB7XG4gIGlmIChzdHJpY3QgPT09IHVuZGVmaW5lZCkgc3RyaWN0ID0gdHJ1ZTtcblxuICBpZiAoaXMub2JqZWN0KGlucHV0KSkgcmV0dXJuIG9iamVjdChpbnB1dCwgc3RyaWN0KTtcbiAgaWYgKGlzLmFycmF5KGlucHV0KSkgcmV0dXJuIGFycmF5KGlucHV0LCBzdHJpY3QpO1xuICByZXR1cm4gaW5wdXQ7XG59XG5cbi8qKlxuICogT2JqZWN0IHRyYXZlcnNlci5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHN0cmljdFxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIG9iamVjdCAob2JqLCBzdHJpY3QpIHtcbiAgZWFjaChvYmosIGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICAgIGlmIChpc29kYXRlLmlzKHZhbCwgc3RyaWN0KSkge1xuICAgICAgb2JqW2tleV0gPSBpc29kYXRlLnBhcnNlKHZhbCk7XG4gICAgfSBlbHNlIGlmIChpcy5vYmplY3QodmFsKSB8fCBpcy5hcnJheSh2YWwpKSB7XG4gICAgICB0cmF2ZXJzZSh2YWwsIHN0cmljdCk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBBcnJheSB0cmF2ZXJzZXIuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHN0cmljdFxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxuZnVuY3Rpb24gYXJyYXkgKGFyciwgc3RyaWN0KSB7XG4gIGVhY2goYXJyLCBmdW5jdGlvbiAodmFsLCB4KSB7XG4gICAgaWYgKGlzLm9iamVjdCh2YWwpKSB7XG4gICAgICB0cmF2ZXJzZSh2YWwsIHN0cmljdCk7XG4gICAgfSBlbHNlIGlmIChpc29kYXRlLmlzKHZhbCwgc3RyaWN0KSkge1xuICAgICAgYXJyW3hdID0gaXNvZGF0ZS5wYXJzZSh2YWwpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBhcnI7XG59XG4iLCJcbnZhciBpc0VtcHR5ID0gcmVxdWlyZSgnaXMtZW1wdHknKTtcblxudHJ5IHtcbiAgdmFyIHR5cGVPZiA9IHJlcXVpcmUoJ3R5cGUnKTtcbn0gY2F0Y2ggKGUpIHtcbiAgdmFyIHR5cGVPZiA9IHJlcXVpcmUoJ2NvbXBvbmVudC10eXBlJyk7XG59XG5cblxuLyoqXG4gKiBUeXBlcy5cbiAqL1xuXG52YXIgdHlwZXMgPSBbXG4gICdhcmd1bWVudHMnLFxuICAnYXJyYXknLFxuICAnYm9vbGVhbicsXG4gICdkYXRlJyxcbiAgJ2VsZW1lbnQnLFxuICAnZnVuY3Rpb24nLFxuICAnbnVsbCcsXG4gICdudW1iZXInLFxuICAnb2JqZWN0JyxcbiAgJ3JlZ2V4cCcsXG4gICdzdHJpbmcnLFxuICAndW5kZWZpbmVkJ1xuXTtcblxuXG4vKipcbiAqIEV4cG9zZSB0eXBlIGNoZWNrZXJzLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZvciAodmFyIGkgPSAwLCB0eXBlOyB0eXBlID0gdHlwZXNbaV07IGkrKykgZXhwb3J0c1t0eXBlXSA9IGdlbmVyYXRlKHR5cGUpO1xuXG5cbi8qKlxuICogQWRkIGFsaWFzIGZvciBgZnVuY3Rpb25gIGZvciBvbGQgYnJvd3NlcnMuXG4gKi9cblxuZXhwb3J0cy5mbiA9IGV4cG9ydHNbJ2Z1bmN0aW9uJ107XG5cblxuLyoqXG4gKiBFeHBvc2UgYGVtcHR5YCBjaGVjay5cbiAqL1xuXG5leHBvcnRzLmVtcHR5ID0gaXNFbXB0eTtcblxuXG4vKipcbiAqIEV4cG9zZSBgbmFuYCBjaGVjay5cbiAqL1xuXG5leHBvcnRzLm5hbiA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIGV4cG9ydHMubnVtYmVyKHZhbCkgJiYgdmFsICE9IHZhbDtcbn07XG5cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHR5cGUgY2hlY2tlci5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gZ2VuZXJhdGUgKHR5cGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlID09PSB0eXBlT2YodmFsdWUpO1xuICB9O1xufSIsIlxuLyoqXG4gKiBFeHBvc2UgYGlzRW1wdHlgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNFbXB0eTtcblxuXG4vKipcbiAqIEhhcy5cbiAqL1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuXG4vKipcbiAqIFRlc3Qgd2hldGhlciBhIHZhbHVlIGlzIFwiZW1wdHlcIi5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gaXNFbXB0eSAodmFsKSB7XG4gIGlmIChudWxsID09IHZhbCkgcmV0dXJuIHRydWU7XG4gIGlmICgnbnVtYmVyJyA9PSB0eXBlb2YgdmFsKSByZXR1cm4gMCA9PT0gdmFsO1xuICBpZiAodW5kZWZpbmVkICE9PSB2YWwubGVuZ3RoKSByZXR1cm4gMCA9PT0gdmFsLmxlbmd0aDtcbiAgZm9yICh2YXIga2V5IGluIHZhbCkgaWYgKGhhcy5jYWxsKHZhbCwga2V5KSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gdHJ1ZTtcbn0iLCIvKipcbiAqIHRvU3RyaW5nIHJlZi5cbiAqL1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFJldHVybiB0aGUgdHlwZSBvZiBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwpe1xuICBzd2l0Y2ggKHRvU3RyaW5nLmNhbGwodmFsKSkge1xuICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOiByZXR1cm4gJ2RhdGUnO1xuICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6IHJldHVybiAncmVnZXhwJztcbiAgICBjYXNlICdbb2JqZWN0IEFyZ3VtZW50c10nOiByZXR1cm4gJ2FyZ3VtZW50cyc7XG4gICAgY2FzZSAnW29iamVjdCBBcnJheV0nOiByZXR1cm4gJ2FycmF5JztcbiAgICBjYXNlICdbb2JqZWN0IEVycm9yXSc6IHJldHVybiAnZXJyb3InO1xuICB9XG5cbiAgaWYgKHZhbCA9PT0gbnVsbCkgcmV0dXJuICdudWxsJztcbiAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIGlmICh2YWwgIT09IHZhbCkgcmV0dXJuICduYW4nO1xuICBpZiAodmFsICYmIHZhbC5ub2RlVHlwZSA9PT0gMSkgcmV0dXJuICdlbGVtZW50JztcblxuICB2YWwgPSB2YWwudmFsdWVPZlxuICAgID8gdmFsLnZhbHVlT2YoKVxuICAgIDogT2JqZWN0LnByb3RvdHlwZS52YWx1ZU9mLmFwcGx5KHZhbClcblxuICByZXR1cm4gdHlwZW9mIHZhbDtcbn07XG4iLCJcbi8qKlxuICogTWF0Y2hlciwgc2xpZ2h0bHkgbW9kaWZpZWQgZnJvbTpcbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vY3Nub3Zlci9qcy1pc284NjAxL2Jsb2IvbGF4L2lzbzg2MDEuanNcbiAqL1xuXG52YXIgbWF0Y2hlciA9IC9eKFxcZHs0fSkoPzotPyhcXGR7Mn0pKD86LT8oXFxkezJ9KSk/KT8oPzooWyBUXSkoXFxkezJ9KTo/KFxcZHsyfSkoPzo6PyhcXGR7Mn0pKD86WyxcXC5dKFxcZHsxLH0pKT8pPyg/OihaKXwoWytcXC1dKShcXGR7Mn0pKD86Oj8oXFxkezJ9KSk/KT8pPyQvO1xuXG5cbi8qKlxuICogQ29udmVydCBhbiBJU08gZGF0ZSBzdHJpbmcgdG8gYSBkYXRlLiBGYWxsYmFjayB0byBuYXRpdmUgYERhdGUucGFyc2VgLlxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jc25vdmVyL2pzLWlzbzg2MDEvYmxvYi9sYXgvaXNvODYwMS5qc1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBpc29cbiAqIEByZXR1cm4ge0RhdGV9XG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChpc28pIHtcbiAgdmFyIG51bWVyaWNLZXlzID0gWzEsIDUsIDYsIDcsIDExLCAxMl07XG4gIHZhciBhcnIgPSBtYXRjaGVyLmV4ZWMoaXNvKTtcbiAgdmFyIG9mZnNldCA9IDA7XG5cbiAgLy8gZmFsbGJhY2sgdG8gbmF0aXZlIHBhcnNpbmdcbiAgaWYgKCFhcnIpIHJldHVybiBuZXcgRGF0ZShpc28pO1xuXG4gIC8vIHJlbW92ZSB1bmRlZmluZWQgdmFsdWVzXG4gIGZvciAodmFyIGkgPSAwLCB2YWw7IHZhbCA9IG51bWVyaWNLZXlzW2ldOyBpKyspIHtcbiAgICBhcnJbdmFsXSA9IHBhcnNlSW50KGFyclt2YWxdLCAxMCkgfHwgMDtcbiAgfVxuXG4gIC8vIGFsbG93IHVuZGVmaW5lZCBkYXlzIGFuZCBtb250aHNcbiAgYXJyWzJdID0gcGFyc2VJbnQoYXJyWzJdLCAxMCkgfHwgMTtcbiAgYXJyWzNdID0gcGFyc2VJbnQoYXJyWzNdLCAxMCkgfHwgMTtcblxuICAvLyBtb250aCBpcyAwLTExXG4gIGFyclsyXS0tO1xuXG4gIC8vIGFsbG93IGFiaXRyYXJ5IHN1Yi1zZWNvbmQgcHJlY2lzaW9uXG4gIGFycls4XSA9IGFycls4XVxuICAgID8gKGFycls4XSArICcwMCcpLnN1YnN0cmluZygwLCAzKVxuICAgIDogMDtcblxuICAvLyBhcHBseSB0aW1lem9uZSBpZiBvbmUgZXhpc3RzXG4gIGlmIChhcnJbNF0gPT0gJyAnKSB7XG4gICAgb2Zmc2V0ID0gbmV3IERhdGUoKS5nZXRUaW1lem9uZU9mZnNldCgpO1xuICB9IGVsc2UgaWYgKGFycls5XSAhPT0gJ1onICYmIGFyclsxMF0pIHtcbiAgICBvZmZzZXQgPSBhcnJbMTFdICogNjAgKyBhcnJbMTJdO1xuICAgIGlmICgnKycgPT0gYXJyWzEwXSkgb2Zmc2V0ID0gMCAtIG9mZnNldDtcbiAgfVxuXG4gIHZhciBtaWxsaXMgPSBEYXRlLlVUQyhhcnJbMV0sIGFyclsyXSwgYXJyWzNdLCBhcnJbNV0sIGFycls2XSArIG9mZnNldCwgYXJyWzddLCBhcnJbOF0pO1xuICByZXR1cm4gbmV3IERhdGUobWlsbGlzKTtcbn07XG5cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIGBzdHJpbmdgIGlzIGFuIElTTyBkYXRlIHN0cmluZy4gYHN0cmljdGAgbW9kZSByZXF1aXJlcyB0aGF0XG4gKiB0aGUgZGF0ZSBzdHJpbmcgYXQgbGVhc3QgaGF2ZSBhIHllYXIsIG1vbnRoIGFuZCBkYXRlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gc3RyaWN0XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmV4cG9ydHMuaXMgPSBmdW5jdGlvbiAoc3RyaW5nLCBzdHJpY3QpIHtcbiAgaWYgKHN0cmljdCAmJiBmYWxzZSA9PT0gL15cXGR7NH0tXFxkezJ9LVxcZHsyfS8udGVzdChzdHJpbmcpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBtYXRjaGVyLnRlc3Qoc3RyaW5nKTtcbn07IiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIHR5cGUgPSByZXF1aXJlKCd0eXBlJyk7XG5cbi8qKlxuICogSE9QIHJlZmVyZW5jZS5cbiAqL1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBJdGVyYXRlIHRoZSBnaXZlbiBgb2JqYCBhbmQgaW52b2tlIGBmbih2YWwsIGkpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheXxPYmplY3R9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIGZuKXtcbiAgc3dpdGNoICh0eXBlKG9iaikpIHtcbiAgICBjYXNlICdhcnJheSc6XG4gICAgICByZXR1cm4gYXJyYXkob2JqLCBmbik7XG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIGlmICgnbnVtYmVyJyA9PSB0eXBlb2Ygb2JqLmxlbmd0aCkgcmV0dXJuIGFycmF5KG9iaiwgZm4pO1xuICAgICAgcmV0dXJuIG9iamVjdChvYmosIGZuKTtcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuIHN0cmluZyhvYmosIGZuKTtcbiAgfVxufTtcblxuLyoqXG4gKiBJdGVyYXRlIHN0cmluZyBjaGFycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc3RyaW5nKG9iaiwgZm4pIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyArK2kpIHtcbiAgICBmbihvYmouY2hhckF0KGkpLCBpKTtcbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGUgb2JqZWN0IGtleXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG9iamVjdChvYmosIGZuKSB7XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzLmNhbGwob2JqLCBrZXkpKSB7XG4gICAgICBmbihrZXksIG9ialtrZXldKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlIGFycmF5LWlzaC5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gYXJyYXkob2JqLCBmbikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG9iai5sZW5ndGg7ICsraSkge1xuICAgIGZuKG9ialtpXSwgaSk7XG4gIH1cbn0iLCJcbi8qKlxuICogQSBmZXcgaW50ZWdyYXRpb25zIGFyZSBkaXNhYmxlZCBieSBkZWZhdWx0LiBUaGV5IG11c3QgYmUgZXhwbGljaXRseVxuICogZW5hYmxlZCBieSBzZXR0aW5nIG9wdGlvbnNbUHJvdmlkZXJdID0gdHJ1ZS5cbiAqL1xuXG52YXIgZGlzYWJsZWQgPSB7XG4gIFNhbGVzZm9yY2U6IHRydWVcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBpbnRlZ3JhdGlvbiBzaG91bGQgYmUgZW5hYmxlZCBieSBkZWZhdWx0LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBpbnRlZ3JhdGlvblxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChpbnRlZ3JhdGlvbikge1xuICByZXR1cm4gISBkaXNhYmxlZFtpbnRlZ3JhdGlvbl07XG59OyIsIlxuLyoqXG4gKiBUT0RPOiB1c2UgY29tcG9uZW50IHN5bWxpbmssIGV2ZXJ5d2hlcmUgP1xuICovXG5cbnRyeSB7XG4gIGV4cG9ydHMuaW5oZXJpdCA9IHJlcXVpcmUoJ2luaGVyaXQnKTtcbiAgZXhwb3J0cy5jbG9uZSA9IHJlcXVpcmUoJ2Nsb25lJyk7XG4gIGV4cG9ydHMudHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcbn0gY2F0Y2ggKGUpIHtcbiAgZXhwb3J0cy5pbmhlcml0ID0gcmVxdWlyZSgnaW5oZXJpdC1jb21wb25lbnQnKTtcbiAgZXhwb3J0cy5jbG9uZSA9IHJlcXVpcmUoJ2Nsb25lLWNvbXBvbmVudCcpO1xuICBleHBvcnRzLnR5cGUgPSByZXF1aXJlKCd0eXBlLWNvbXBvbmVudCcpO1xufVxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGEsIGIpe1xuICB2YXIgZm4gPSBmdW5jdGlvbigpe307XG4gIGZuLnByb3RvdHlwZSA9IGIucHJvdG90eXBlO1xuICBhLnByb3RvdHlwZSA9IG5ldyBmbjtcbiAgYS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBhO1xufTsiLCIvKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIHR5cGU7XG50cnkge1xuICB0eXBlID0gcmVxdWlyZSgnY29tcG9uZW50LXR5cGUnKTtcbn0gY2F0Y2ggKF8pIHtcbiAgdHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcbn1cblxuLyoqXG4gKiBNb2R1bGUgZXhwb3J0cy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsb25lO1xuXG4vKipcbiAqIENsb25lcyBvYmplY3RzLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGFueSBvYmplY3RcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gY2xvbmUob2JqKXtcbiAgc3dpdGNoICh0eXBlKG9iaikpIHtcbiAgICBjYXNlICdvYmplY3QnOlxuICAgICAgdmFyIGNvcHkgPSB7fTtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgY29weVtrZXldID0gY2xvbmUob2JqW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY29weTtcblxuICAgIGNhc2UgJ2FycmF5JzpcbiAgICAgIHZhciBjb3B5ID0gbmV3IEFycmF5KG9iai5sZW5ndGgpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGNvcHlbaV0gPSBjbG9uZShvYmpbaV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvcHk7XG5cbiAgICBjYXNlICdyZWdleHAnOlxuICAgICAgLy8gZnJvbSBtaWxsZXJtZWRlaXJvcy9hbWQtdXRpbHMgLSBNSVRcbiAgICAgIHZhciBmbGFncyA9ICcnO1xuICAgICAgZmxhZ3MgKz0gb2JqLm11bHRpbGluZSA/ICdtJyA6ICcnO1xuICAgICAgZmxhZ3MgKz0gb2JqLmdsb2JhbCA/ICdnJyA6ICcnO1xuICAgICAgZmxhZ3MgKz0gb2JqLmlnbm9yZUNhc2UgPyAnaScgOiAnJztcbiAgICAgIHJldHVybiBuZXcgUmVnRXhwKG9iai5zb3VyY2UsIGZsYWdzKTtcblxuICAgIGNhc2UgJ2RhdGUnOlxuICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai5nZXRUaW1lKCkpO1xuXG4gICAgZGVmYXVsdDogLy8gc3RyaW5nLCBudW1iZXIsIGJvb2xlYW4sIOKAplxuICAgICAgcmV0dXJuIG9iajtcbiAgfVxufVxuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGdldCA9IHJlcXVpcmUoJ29iai1jYXNlJyk7XG5cbi8qKlxuICogQWRkIGFkZHJlc3MgZ2V0dGVycyB0byBgcHJvdG9gLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHByb3RvXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcm90byl7XG4gIHByb3RvLnppcCA9IHRyYWl0KCdwb3N0YWxDb2RlJywgJ3ppcCcpO1xuICBwcm90by5jb3VudHJ5ID0gdHJhaXQoJ2NvdW50cnknKTtcbiAgcHJvdG8uc3RyZWV0ID0gdHJhaXQoJ3N0cmVldCcpO1xuICBwcm90by5zdGF0ZSA9IHRyYWl0KCdzdGF0ZScpO1xuICBwcm90by5jaXR5ID0gdHJhaXQoJ2NpdHknKTtcblxuICBmdW5jdGlvbiB0cmFpdChhLCBiKXtcbiAgICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICAgIHZhciB0cmFpdHMgPSB0aGlzLnRyYWl0cygpO1xuICAgICAgdmFyIHByb3BzID0gdGhpcy5wcm9wZXJ0aWVzID8gdGhpcy5wcm9wZXJ0aWVzKCkgOiB7fTtcblxuICAgICAgcmV0dXJuIGdldCh0cmFpdHMsICdhZGRyZXNzLicgKyBhKVxuICAgICAgICB8fCBnZXQodHJhaXRzLCBhKVxuICAgICAgICB8fCAoYiA/IGdldCh0cmFpdHMsICdhZGRyZXNzLicgKyBiKSA6IG51bGwpXG4gICAgICAgIHx8IChiID8gZ2V0KHRyYWl0cywgYikgOiBudWxsKVxuICAgICAgICB8fCBnZXQocHJvcHMsICdhZGRyZXNzLicgKyBhKVxuICAgICAgICB8fCBnZXQocHJvcHMsIGEpXG4gICAgICAgIHx8IChiID8gZ2V0KHByb3BzLCAnYWRkcmVzcy4nICsgYikgOiBudWxsKVxuICAgICAgICB8fCAoYiA/IGdldChwcm9wcywgYikgOiBudWxsKTtcbiAgICB9O1xuICB9XG59O1xuIiwiXG52YXIgaWRlbnRpdHkgPSBmdW5jdGlvbihfKXsgcmV0dXJuIF87IH07XG5cblxuLyoqXG4gKiBNb2R1bGUgZXhwb3J0cywgZXhwb3J0XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBtdWx0aXBsZShmaW5kKTtcbm1vZHVsZS5leHBvcnRzLmZpbmQgPSBtb2R1bGUuZXhwb3J0cztcblxuXG4vKipcbiAqIEV4cG9ydCB0aGUgcmVwbGFjZW1lbnQgZnVuY3Rpb24sIHJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG4gKi9cblxubW9kdWxlLmV4cG9ydHMucmVwbGFjZSA9IGZ1bmN0aW9uIChvYmosIGtleSwgdmFsLCBvcHRpb25zKSB7XG4gIG11bHRpcGxlKHJlcGxhY2UpLmNhbGwodGhpcywgb2JqLCBrZXksIHZhbCwgb3B0aW9ucyk7XG4gIHJldHVybiBvYmo7XG59O1xuXG5cbi8qKlxuICogRXhwb3J0IHRoZSBkZWxldGUgZnVuY3Rpb24sIHJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG4gKi9cblxubW9kdWxlLmV4cG9ydHMuZGVsID0gZnVuY3Rpb24gKG9iaiwga2V5LCBvcHRpb25zKSB7XG4gIG11bHRpcGxlKGRlbCkuY2FsbCh0aGlzLCBvYmosIGtleSwgbnVsbCwgb3B0aW9ucyk7XG4gIHJldHVybiBvYmo7XG59O1xuXG5cbi8qKlxuICogQ29tcG9zZSBhcHBseWluZyB0aGUgZnVuY3Rpb24gdG8gYSBuZXN0ZWQga2V5XG4gKi9cblxuZnVuY3Rpb24gbXVsdGlwbGUgKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAob2JqLCBwYXRoLCB2YWwsIG9wdGlvbnMpIHtcbiAgICB2YXIgbm9ybWFsaXplID0gb3B0aW9ucyAmJiBpc0Z1bmN0aW9uKG9wdGlvbnMubm9ybWFsaXplcikgPyBvcHRpb25zLm5vcm1hbGl6ZXIgOiBkZWZhdWx0Tm9ybWFsaXplO1xuICAgIHBhdGggPSBub3JtYWxpemUocGF0aCk7XG5cbiAgICB2YXIga2V5O1xuICAgIHZhciBmaW5pc2hlZCA9IGZhbHNlO1xuXG4gICAgd2hpbGUgKCFmaW5pc2hlZCkgbG9vcCgpO1xuXG4gICAgZnVuY3Rpb24gbG9vcCgpIHtcbiAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICB2YXIgbm9ybWFsaXplZEtleSA9IG5vcm1hbGl6ZShrZXkpO1xuICAgICAgICBpZiAoMCA9PT0gcGF0aC5pbmRleE9mKG5vcm1hbGl6ZWRLZXkpKSB7XG4gICAgICAgICAgdmFyIHRlbXAgPSBwYXRoLnN1YnN0cihub3JtYWxpemVkS2V5Lmxlbmd0aCk7XG4gICAgICAgICAgaWYgKHRlbXAuY2hhckF0KDApID09PSAnLicgfHwgdGVtcC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHBhdGggPSB0ZW1wLnN1YnN0cigxKTtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IG9ialtrZXldO1xuXG4gICAgICAgICAgICAvLyB3ZSdyZSBhdCB0aGUgZW5kIGFuZCB0aGVyZSBpcyBub3RoaW5nLlxuICAgICAgICAgICAgaWYgKG51bGwgPT0gY2hpbGQpIHtcbiAgICAgICAgICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHdlJ3JlIGF0IHRoZSBlbmQgYW5kIHRoZXJlIGlzIHNvbWV0aGluZy5cbiAgICAgICAgICAgIGlmICghcGF0aC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHN0ZXAgaW50byBjaGlsZFxuICAgICAgICAgICAgb2JqID0gY2hpbGQ7XG5cbiAgICAgICAgICAgIC8vIGJ1dCB3ZSdyZSBkb25lIGhlcmVcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAga2V5ID0gdW5kZWZpbmVkO1xuICAgICAgLy8gaWYgd2UgZm91bmQgbm8gbWF0Y2hpbmcgcHJvcGVydGllc1xuICAgICAgLy8gb24gdGhlIGN1cnJlbnQgb2JqZWN0LCB0aGVyZSdzIG5vIG1hdGNoLlxuICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICgha2V5KSByZXR1cm47XG4gICAgaWYgKG51bGwgPT0gb2JqKSByZXR1cm4gb2JqO1xuXG4gICAgLy8gdGhlIGBvYmpgIGFuZCBga2V5YCBpcyBvbmUgYWJvdmUgdGhlIGxlYWYgb2JqZWN0IGFuZCBrZXksIHNvXG4gICAgLy8gc3RhcnQgb2JqZWN0OiB7IGE6IHsgJ2IuYyc6IDEwIH0gfVxuICAgIC8vIGVuZCBvYmplY3Q6IHsgJ2IuYyc6IDEwIH1cbiAgICAvLyBlbmQga2V5OiAnYi5jJ1xuICAgIC8vIHRoaXMgd2F5LCB5b3UgY2FuIGRvIGBvYmpba2V5XWAgYW5kIGdldCBgMTBgLlxuICAgIHJldHVybiBmbihvYmosIGtleSwgdmFsKTtcbiAgfTtcbn1cblxuXG4vKipcbiAqIEZpbmQgYW4gb2JqZWN0IGJ5IGl0cyBrZXlcbiAqXG4gKiBmaW5kKHsgZmlyc3RfbmFtZSA6ICdDYWx2aW4nIH0sICdmaXJzdE5hbWUnKVxuICovXG5cbmZ1bmN0aW9uIGZpbmQgKG9iaiwga2V5KSB7XG4gIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkgcmV0dXJuIG9ialtrZXldO1xufVxuXG5cbi8qKlxuICogRGVsZXRlIGEgdmFsdWUgZm9yIGEgZ2l2ZW4ga2V5XG4gKlxuICogZGVsKHsgYSA6ICdiJywgeCA6ICd5JyB9LCAnWCcgfSkgLT4geyBhIDogJ2InIH1cbiAqL1xuXG5mdW5jdGlvbiBkZWwgKG9iaiwga2V5KSB7XG4gIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkgZGVsZXRlIG9ialtrZXldO1xuICByZXR1cm4gb2JqO1xufVxuXG5cbi8qKlxuICogUmVwbGFjZSBhbiBvYmplY3RzIGV4aXN0aW5nIHZhbHVlIHdpdGggYSBuZXcgb25lXG4gKlxuICogcmVwbGFjZSh7IGEgOiAnYicgfSwgJ2EnLCAnYycpIC0+IHsgYSA6ICdjJyB9XG4gKi9cblxuZnVuY3Rpb24gcmVwbGFjZSAob2JqLCBrZXksIHZhbCkge1xuICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIG9ialtrZXldID0gdmFsO1xuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIGBkb3Quc2VwYXJhdGVkLnBhdGhgLlxuICpcbiAqIEEuSEVMTCghKiYjKCEpT19XT1IgICBMRC5iYXIgPT4gYWhlbGxvd29ybGRiYXJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIGRlZmF1bHROb3JtYWxpemUocGF0aCkge1xuICByZXR1cm4gcGF0aC5yZXBsYWNlKC9bXmEtekEtWjAtOVxcLl0rL2csICcnKS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgdmFsdWUgaXMgYSBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHJldHVybiB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbGAgaXMgYSBmdW5jdGlvbiwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gKi9cblxuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWwpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbic7XG59XG4iLCJcbnZhciBpcyA9IHJlcXVpcmUoJ2lzJyk7XG52YXIgaXNvZGF0ZSA9IHJlcXVpcmUoJ2lzb2RhdGUnKTtcbnZhciBtaWxsaXNlY29uZHMgPSByZXF1aXJlKCcuL21pbGxpc2Vjb25kcycpO1xudmFyIHNlY29uZHMgPSByZXF1aXJlKCcuL3NlY29uZHMnKTtcblxuXG4vKipcbiAqIFJldHVybnMgYSBuZXcgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCwgYWxsb3dpbmcgYSB2YXJpZXR5IG9mIGV4dHJhIGlucHV0IHR5cGVzXG4gKiBvdmVyIHRoZSBuYXRpdmUgRGF0ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBAcGFyYW0ge0RhdGV8U3RyaW5nfE51bWJlcn0gdmFsXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBuZXdEYXRlICh2YWwpIHtcbiAgaWYgKGlzLmRhdGUodmFsKSkgcmV0dXJuIHZhbDtcbiAgaWYgKGlzLm51bWJlcih2YWwpKSByZXR1cm4gbmV3IERhdGUodG9Ncyh2YWwpKTtcblxuICAvLyBkYXRlIHN0cmluZ3NcbiAgaWYgKGlzb2RhdGUuaXModmFsKSkgcmV0dXJuIGlzb2RhdGUucGFyc2UodmFsKTtcbiAgaWYgKG1pbGxpc2Vjb25kcy5pcyh2YWwpKSByZXR1cm4gbWlsbGlzZWNvbmRzLnBhcnNlKHZhbCk7XG4gIGlmIChzZWNvbmRzLmlzKHZhbCkpIHJldHVybiBzZWNvbmRzLnBhcnNlKHZhbCk7XG5cbiAgLy8gZmFsbGJhY2sgdG8gRGF0ZS5wYXJzZVxuICByZXR1cm4gbmV3IERhdGUodmFsKTtcbn07XG5cblxuLyoqXG4gKiBJZiB0aGUgbnVtYmVyIHBhc3NlZCB2YWwgaXMgc2Vjb25kcyBmcm9tIHRoZSBlcG9jaCwgdHVybiBpdCBpbnRvIG1pbGxpc2Vjb25kcy5cbiAqIE1pbGxpc2Vjb25kcyB3b3VsZCBiZSBncmVhdGVyIHRoYW4gMzE1NTc2MDAwMDAgKERlY2VtYmVyIDMxLCAxOTcwKS5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbnVtXG4gKi9cblxuZnVuY3Rpb24gdG9NcyAobnVtKSB7XG4gIGlmIChudW0gPCAzMTU1NzYwMDAwMCkgcmV0dXJuIG51bSAqIDEwMDA7XG4gIHJldHVybiBudW07XG59IiwiXG52YXIgaXNFbXB0eSA9IHJlcXVpcmUoJ2lzLWVtcHR5JylcbiAgLCB0eXBlT2YgPSByZXF1aXJlKCd0eXBlJyk7XG5cblxuLyoqXG4gKiBUeXBlcy5cbiAqL1xuXG52YXIgdHlwZXMgPSBbXG4gICdhcmd1bWVudHMnLFxuICAnYXJyYXknLFxuICAnYm9vbGVhbicsXG4gICdkYXRlJyxcbiAgJ2VsZW1lbnQnLFxuICAnZnVuY3Rpb24nLFxuICAnbnVsbCcsXG4gICdudW1iZXInLFxuICAnb2JqZWN0JyxcbiAgJ3JlZ2V4cCcsXG4gICdzdHJpbmcnLFxuICAndW5kZWZpbmVkJ1xuXTtcblxuXG4vKipcbiAqIEV4cG9zZSB0eXBlIGNoZWNrZXJzLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZvciAodmFyIGkgPSAwLCB0eXBlOyB0eXBlID0gdHlwZXNbaV07IGkrKykgZXhwb3J0c1t0eXBlXSA9IGdlbmVyYXRlKHR5cGUpO1xuXG5cbi8qKlxuICogQWRkIGFsaWFzIGZvciBgZnVuY3Rpb25gIGZvciBvbGQgYnJvd3NlcnMuXG4gKi9cblxuZXhwb3J0cy5mbiA9IGV4cG9ydHNbJ2Z1bmN0aW9uJ107XG5cblxuLyoqXG4gKiBFeHBvc2UgYGVtcHR5YCBjaGVjay5cbiAqL1xuXG5leHBvcnRzLmVtcHR5ID0gaXNFbXB0eTtcblxuXG4vKipcbiAqIEV4cG9zZSBgbmFuYCBjaGVjay5cbiAqL1xuXG5leHBvcnRzLm5hbiA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIGV4cG9ydHMubnVtYmVyKHZhbCkgJiYgdmFsICE9IHZhbDtcbn07XG5cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHR5cGUgY2hlY2tlci5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gZ2VuZXJhdGUgKHR5cGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlID09PSB0eXBlT2YodmFsdWUpO1xuICB9O1xufSIsIlxuLyoqXG4gKiBNYXRjaGVyLlxuICovXG5cbnZhciBtYXRjaGVyID0gL1xcZHsxM30vO1xuXG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhIHN0cmluZyBpcyBhIG1pbGxpc2Vjb25kIGRhdGUgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZXhwb3J0cy5pcyA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgcmV0dXJuIG1hdGNoZXIudGVzdChzdHJpbmcpO1xufTtcblxuXG4vKipcbiAqIENvbnZlcnQgYSBtaWxsaXNlY29uZCBzdHJpbmcgdG8gYSBkYXRlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtaWxsaXNcbiAqIEByZXR1cm4ge0RhdGV9XG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChtaWxsaXMpIHtcbiAgbWlsbGlzID0gcGFyc2VJbnQobWlsbGlzLCAxMCk7XG4gIHJldHVybiBuZXcgRGF0ZShtaWxsaXMpO1xufTsiLCJcbi8qKlxuICogTWF0Y2hlci5cbiAqL1xuXG52YXIgbWF0Y2hlciA9IC9cXGR7MTB9LztcblxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYSBzdHJpbmcgaXMgYSBzZWNvbmQgZGF0ZSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5leHBvcnRzLmlzID0gZnVuY3Rpb24gKHN0cmluZykge1xuICByZXR1cm4gbWF0Y2hlci50ZXN0KHN0cmluZyk7XG59O1xuXG5cbi8qKlxuICogQ29udmVydCBhIHNlY29uZCBzdHJpbmcgdG8gYSBkYXRlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWNvbmRzXG4gKiBAcmV0dXJuIHtEYXRlfVxuICovXG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc2Vjb25kcykge1xuICB2YXIgbWlsbGlzID0gcGFyc2VJbnQoc2Vjb25kcywgMTApICogMTAwMDtcbiAgcmV0dXJuIG5ldyBEYXRlKG1pbGxpcyk7XG59OyIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBpbmhlcml0ID0gcmVxdWlyZSgnLi91dGlscycpLmluaGVyaXQ7XG52YXIgRmFjYWRlID0gcmVxdWlyZSgnLi9mYWNhZGUnKTtcblxuLyoqXG4gKiBFeHBvc2UgYEFsaWFzYCBmYWNhZGUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBBbGlhcztcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBBbGlhc2AgZmFjYWRlIHdpdGggYSBgZGljdGlvbmFyeWAgb2YgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkaWN0aW9uYXJ5XG4gKiAgIEBwcm9wZXJ0eSB7U3RyaW5nfSBmcm9tXG4gKiAgIEBwcm9wZXJ0eSB7U3RyaW5nfSB0b1xuICogICBAcHJvcGVydHkge09iamVjdH0gb3B0aW9uc1xuICovXG5cbmZ1bmN0aW9uIEFsaWFzIChkaWN0aW9uYXJ5KSB7XG4gIEZhY2FkZS5jYWxsKHRoaXMsIGRpY3Rpb25hcnkpO1xufVxuXG4vKipcbiAqIEluaGVyaXQgZnJvbSBgRmFjYWRlYC5cbiAqL1xuXG5pbmhlcml0KEFsaWFzLCBGYWNhZGUpO1xuXG4vKipcbiAqIFJldHVybiB0eXBlIG9mIGZhY2FkZS5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuQWxpYXMucHJvdG90eXBlLnR5cGUgPVxuQWxpYXMucHJvdG90eXBlLmFjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICdhbGlhcyc7XG59O1xuXG4vKipcbiAqIEdldCBgcHJldmlvdXNJZGAuXG4gKlxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkFsaWFzLnByb3RvdHlwZS5mcm9tID1cbkFsaWFzLnByb3RvdHlwZS5wcmV2aW91c0lkID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMuZmllbGQoJ3ByZXZpb3VzSWQnKVxuICAgIHx8IHRoaXMuZmllbGQoJ2Zyb20nKTtcbn07XG5cbi8qKlxuICogR2V0IGB1c2VySWRgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuQWxpYXMucHJvdG90eXBlLnRvID1cbkFsaWFzLnByb3RvdHlwZS51c2VySWQgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdGhpcy5maWVsZCgndXNlcklkJylcbiAgICB8fCB0aGlzLmZpZWxkKCd0bycpO1xufTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBpbmhlcml0ID0gcmVxdWlyZSgnLi91dGlscycpLmluaGVyaXQ7XG52YXIgYWRkcmVzcyA9IHJlcXVpcmUoJy4vYWRkcmVzcycpO1xudmFyIGlzRW1haWwgPSByZXF1aXJlKCdpcy1lbWFpbCcpO1xudmFyIG5ld0RhdGUgPSByZXF1aXJlKCduZXctZGF0ZScpO1xudmFyIEZhY2FkZSA9IHJlcXVpcmUoJy4vZmFjYWRlJyk7XG5cbi8qKlxuICogRXhwb3NlIGBHcm91cGAgZmFjYWRlLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gR3JvdXA7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgR3JvdXBgIGZhY2FkZSB3aXRoIGEgYGRpY3Rpb25hcnlgIG9mIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZGljdGlvbmFyeVxuICogICBAcGFyYW0ge1N0cmluZ30gdXNlcklkXG4gKiAgIEBwYXJhbSB7U3RyaW5nfSBncm91cElkXG4gKiAgIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzXG4gKiAgIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gR3JvdXAgKGRpY3Rpb25hcnkpIHtcbiAgRmFjYWRlLmNhbGwodGhpcywgZGljdGlvbmFyeSk7XG59XG5cbi8qKlxuICogSW5oZXJpdCBmcm9tIGBGYWNhZGVgXG4gKi9cblxuaW5oZXJpdChHcm91cCwgRmFjYWRlKTtcblxuLyoqXG4gKiBHZXQgdGhlIGZhY2FkZSdzIGFjdGlvbi5cbiAqL1xuXG5Hcm91cC5wcm90b3R5cGUudHlwZSA9XG5Hcm91cC5wcm90b3R5cGUuYWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gJ2dyb3VwJztcbn07XG5cbi8qKlxuICogU2V0dXAgc29tZSBiYXNpYyBwcm94aWVzLlxuICovXG5cbkdyb3VwLnByb3RvdHlwZS5ncm91cElkID0gRmFjYWRlLmZpZWxkKCdncm91cElkJyk7XG5cbi8qKlxuICogR2V0IGNyZWF0ZWQgb3IgY3JlYXRlZEF0LlxuICpcbiAqIEByZXR1cm4ge0RhdGV9XG4gKi9cblxuR3JvdXAucHJvdG90eXBlLmNyZWF0ZWQgPSBmdW5jdGlvbigpe1xuICB2YXIgY3JlYXRlZCA9IHRoaXMucHJveHkoJ3RyYWl0cy5jcmVhdGVkQXQnKVxuICAgIHx8IHRoaXMucHJveHkoJ3RyYWl0cy5jcmVhdGVkJylcbiAgICB8fCB0aGlzLnByb3h5KCdwcm9wZXJ0aWVzLmNyZWF0ZWRBdCcpXG4gICAgfHwgdGhpcy5wcm94eSgncHJvcGVydGllcy5jcmVhdGVkJyk7XG5cbiAgaWYgKGNyZWF0ZWQpIHJldHVybiBuZXdEYXRlKGNyZWF0ZWQpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGdyb3VwJ3MgZW1haWwsIGZhbGxpbmcgYmFjayB0byB0aGUgZ3JvdXAgSUQgaWYgaXQncyBhIHZhbGlkIGVtYWlsLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5Hcm91cC5wcm90b3R5cGUuZW1haWwgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBlbWFpbCA9IHRoaXMucHJveHkoJ3RyYWl0cy5lbWFpbCcpO1xuICBpZiAoZW1haWwpIHJldHVybiBlbWFpbDtcbiAgdmFyIGdyb3VwSWQgPSB0aGlzLmdyb3VwSWQoKTtcbiAgaWYgKGlzRW1haWwoZ3JvdXBJZCkpIHJldHVybiBncm91cElkO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGdyb3VwJ3MgdHJhaXRzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhbGlhc2VzXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuR3JvdXAucHJvdG90eXBlLnRyYWl0cyA9IGZ1bmN0aW9uIChhbGlhc2VzKSB7XG4gIHZhciByZXQgPSB0aGlzLnByb3BlcnRpZXMoKTtcbiAgdmFyIGlkID0gdGhpcy5ncm91cElkKCk7XG4gIGFsaWFzZXMgPSBhbGlhc2VzIHx8IHt9O1xuXG4gIGlmIChpZCkgcmV0LmlkID0gaWQ7XG5cbiAgZm9yICh2YXIgYWxpYXMgaW4gYWxpYXNlcykge1xuICAgIHZhciB2YWx1ZSA9IG51bGwgPT0gdGhpc1thbGlhc11cbiAgICAgID8gdGhpcy5wcm94eSgndHJhaXRzLicgKyBhbGlhcylcbiAgICAgIDogdGhpc1thbGlhc10oKTtcbiAgICBpZiAobnVsbCA9PSB2YWx1ZSkgY29udGludWU7XG4gICAgcmV0W2FsaWFzZXNbYWxpYXNdXSA9IHZhbHVlO1xuICAgIGRlbGV0ZSByZXRbYWxpYXNdO1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn07XG5cbi8qKlxuICogU3BlY2lhbCB0cmFpdHMuXG4gKi9cblxuR3JvdXAucHJvdG90eXBlLm5hbWUgPSBGYWNhZGUucHJveHkoJ3RyYWl0cy5uYW1lJyk7XG5Hcm91cC5wcm90b3R5cGUuaW5kdXN0cnkgPSBGYWNhZGUucHJveHkoJ3RyYWl0cy5pbmR1c3RyeScpO1xuR3JvdXAucHJvdG90eXBlLmVtcGxveWVlcyA9IEZhY2FkZS5wcm94eSgndHJhaXRzLmVtcGxveWVlcycpO1xuXG4vKipcbiAqIEdldCB0cmFpdHMgb3IgcHJvcGVydGllcy5cbiAqXG4gKiBUT0RPOiByZW1vdmUgbWVcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuR3JvdXAucHJvdG90eXBlLnByb3BlcnRpZXMgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gdGhpcy5maWVsZCgndHJhaXRzJylcbiAgICB8fCB0aGlzLmZpZWxkKCdwcm9wZXJ0aWVzJylcbiAgICB8fCB7fTtcbn07XG4iLCJcbi8qKlxuICogRXhwb3NlIGBpc0VtYWlsYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRW1haWw7XG5cblxuLyoqXG4gKiBFbWFpbCBhZGRyZXNzIG1hdGNoZXIuXG4gKi9cblxudmFyIG1hdGNoZXIgPSAvLitcXEAuK1xcLi4rLztcblxuXG4vKipcbiAqIExvb3NlbHkgdmFsaWRhdGUgYW4gZW1haWwgYWRkcmVzcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZ1bmN0aW9uIGlzRW1haWwgKHN0cmluZykge1xuICByZXR1cm4gbWF0Y2hlci50ZXN0KHN0cmluZyk7XG59IiwiXG52YXIgYWRkcmVzcyA9IHJlcXVpcmUoJy4vYWRkcmVzcycpO1xudmFyIEZhY2FkZSA9IHJlcXVpcmUoJy4vZmFjYWRlJyk7XG52YXIgaXNFbWFpbCA9IHJlcXVpcmUoJ2lzLWVtYWlsJyk7XG52YXIgbmV3RGF0ZSA9IHJlcXVpcmUoJ25ldy1kYXRlJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgZ2V0ID0gcmVxdWlyZSgnb2JqLWNhc2UnKTtcbnZhciB0cmltID0gcmVxdWlyZSgndHJpbScpO1xudmFyIGluaGVyaXQgPSB1dGlscy5pbmhlcml0O1xudmFyIGNsb25lID0gdXRpbHMuY2xvbmU7XG52YXIgdHlwZSA9IHV0aWxzLnR5cGU7XG5cbi8qKlxuICogRXhwb3NlIGBJZGVuZml0eWAgZmFjYWRlLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gSWRlbnRpZnk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgSWRlbnRpZnlgIGZhY2FkZSB3aXRoIGEgYGRpY3Rpb25hcnlgIG9mIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZGljdGlvbmFyeVxuICogICBAcGFyYW0ge1N0cmluZ30gdXNlcklkXG4gKiAgIEBwYXJhbSB7U3RyaW5nfSBzZXNzaW9uSWRcbiAqICAgQHBhcmFtIHtPYmplY3R9IHRyYWl0c1xuICogICBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICovXG5cbmZ1bmN0aW9uIElkZW50aWZ5IChkaWN0aW9uYXJ5KSB7XG4gIEZhY2FkZS5jYWxsKHRoaXMsIGRpY3Rpb25hcnkpO1xufVxuXG4vKipcbiAqIEluaGVyaXQgZnJvbSBgRmFjYWRlYC5cbiAqL1xuXG5pbmhlcml0KElkZW50aWZ5LCBGYWNhZGUpO1xuXG4vKipcbiAqIEdldCB0aGUgZmFjYWRlJ3MgYWN0aW9uLlxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS50eXBlID1cbklkZW50aWZ5LnByb3RvdHlwZS5hY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAnaWRlbnRpZnknO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHVzZXIncyB0cmFpdHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFsaWFzZXNcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5JZGVudGlmeS5wcm90b3R5cGUudHJhaXRzID0gZnVuY3Rpb24gKGFsaWFzZXMpIHtcbiAgdmFyIHJldCA9IHRoaXMuZmllbGQoJ3RyYWl0cycpIHx8IHt9O1xuICB2YXIgaWQgPSB0aGlzLnVzZXJJZCgpO1xuICBhbGlhc2VzID0gYWxpYXNlcyB8fCB7fTtcblxuICBpZiAoaWQpIHJldC5pZCA9IGlkO1xuXG4gIGZvciAodmFyIGFsaWFzIGluIGFsaWFzZXMpIHtcbiAgICB2YXIgdmFsdWUgPSBudWxsID09IHRoaXNbYWxpYXNdXG4gICAgICA/IHRoaXMucHJveHkoJ3RyYWl0cy4nICsgYWxpYXMpXG4gICAgICA6IHRoaXNbYWxpYXNdKCk7XG4gICAgaWYgKG51bGwgPT0gdmFsdWUpIGNvbnRpbnVlO1xuICAgIHJldFthbGlhc2VzW2FsaWFzXV0gPSB2YWx1ZTtcbiAgICBpZiAoYWxpYXMgIT09IGFsaWFzZXNbYWxpYXNdKSBkZWxldGUgcmV0W2FsaWFzXTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgdXNlcidzIGVtYWlsLCBmYWxsaW5nIGJhY2sgdG8gdGhlaXIgdXNlciBJRCBpZiBpdCdzIGEgdmFsaWQgZW1haWwuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS5lbWFpbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGVtYWlsID0gdGhpcy5wcm94eSgndHJhaXRzLmVtYWlsJyk7XG4gIGlmIChlbWFpbCkgcmV0dXJuIGVtYWlsO1xuXG4gIHZhciB1c2VySWQgPSB0aGlzLnVzZXJJZCgpO1xuICBpZiAoaXNFbWFpbCh1c2VySWQpKSByZXR1cm4gdXNlcklkO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHVzZXIncyBjcmVhdGVkIGRhdGUsIG9wdGlvbmFsbHkgbG9va2luZyBmb3IgYGNyZWF0ZWRBdGAgc2luY2UgbG90cyBvZlxuICogcGVvcGxlIGRvIHRoYXQgaW5zdGVhZC5cbiAqXG4gKiBAcmV0dXJuIHtEYXRlIG9yIFVuZGVmaW5lZH1cbiAqL1xuXG5JZGVudGlmeS5wcm90b3R5cGUuY3JlYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGNyZWF0ZWQgPSB0aGlzLnByb3h5KCd0cmFpdHMuY3JlYXRlZCcpIHx8IHRoaXMucHJveHkoJ3RyYWl0cy5jcmVhdGVkQXQnKTtcbiAgaWYgKGNyZWF0ZWQpIHJldHVybiBuZXdEYXRlKGNyZWF0ZWQpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGNvbXBhbnkgY3JlYXRlZCBkYXRlLlxuICpcbiAqIEByZXR1cm4ge0RhdGUgb3IgdW5kZWZpbmVkfVxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS5jb21wYW55Q3JlYXRlZCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBjcmVhdGVkID0gdGhpcy5wcm94eSgndHJhaXRzLmNvbXBhbnkuY3JlYXRlZCcpXG4gICAgfHwgdGhpcy5wcm94eSgndHJhaXRzLmNvbXBhbnkuY3JlYXRlZEF0Jyk7XG5cbiAgaWYgKGNyZWF0ZWQpIHJldHVybiBuZXdEYXRlKGNyZWF0ZWQpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHVzZXIncyBuYW1lLCBvcHRpb25hbGx5IGNvbWJpbmluZyBhIGZpcnN0IGFuZCBsYXN0IG5hbWUgaWYgdGhhdCdzIGFsbFxuICogdGhhdCB3YXMgcHJvdmlkZWQuXG4gKlxuICogQHJldHVybiB7U3RyaW5nIG9yIFVuZGVmaW5lZH1cbiAqL1xuXG5JZGVudGlmeS5wcm90b3R5cGUubmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5hbWUgPSB0aGlzLnByb3h5KCd0cmFpdHMubmFtZScpO1xuICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSByZXR1cm4gdHJpbShuYW1lKTtcblxuICB2YXIgZmlyc3ROYW1lID0gdGhpcy5maXJzdE5hbWUoKTtcbiAgdmFyIGxhc3ROYW1lID0gdGhpcy5sYXN0TmFtZSgpO1xuICBpZiAoZmlyc3ROYW1lICYmIGxhc3ROYW1lKSByZXR1cm4gdHJpbShmaXJzdE5hbWUgKyAnICcgKyBsYXN0TmFtZSk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgdXNlcidzIGZpcnN0IG5hbWUsIG9wdGlvbmFsbHkgc3BsaXR0aW5nIGl0IG91dCBvZiBhIHNpbmdsZSBuYW1lIGlmXG4gKiB0aGF0J3MgYWxsIHRoYXQgd2FzIHByb3ZpZGVkLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZyBvciBVbmRlZmluZWR9XG4gKi9cblxuSWRlbnRpZnkucHJvdG90eXBlLmZpcnN0TmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGZpcnN0TmFtZSA9IHRoaXMucHJveHkoJ3RyYWl0cy5maXJzdE5hbWUnKTtcbiAgaWYgKHR5cGVvZiBmaXJzdE5hbWUgPT09ICdzdHJpbmcnKSByZXR1cm4gdHJpbShmaXJzdE5hbWUpO1xuXG4gIHZhciBuYW1lID0gdGhpcy5wcm94eSgndHJhaXRzLm5hbWUnKTtcbiAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykgcmV0dXJuIHRyaW0obmFtZSkuc3BsaXQoJyAnKVswXTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSB1c2VyJ3MgbGFzdCBuYW1lLCBvcHRpb25hbGx5IHNwbGl0dGluZyBpdCBvdXQgb2YgYSBzaW5nbGUgbmFtZSBpZlxuICogdGhhdCdzIGFsbCB0aGF0IHdhcyBwcm92aWRlZC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmcgb3IgVW5kZWZpbmVkfVxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS5sYXN0TmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxhc3ROYW1lID0gdGhpcy5wcm94eSgndHJhaXRzLmxhc3ROYW1lJyk7XG4gIGlmICh0eXBlb2YgbGFzdE5hbWUgPT09ICdzdHJpbmcnKSByZXR1cm4gdHJpbShsYXN0TmFtZSk7XG5cbiAgdmFyIG5hbWUgPSB0aGlzLnByb3h5KCd0cmFpdHMubmFtZScpO1xuICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSByZXR1cm47XG5cbiAgdmFyIHNwYWNlID0gdHJpbShuYW1lKS5pbmRleE9mKCcgJyk7XG4gIGlmIChzcGFjZSA9PT0gLTEpIHJldHVybjtcblxuICByZXR1cm4gdHJpbShuYW1lLnN1YnN0cihzcGFjZSArIDEpKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSB1c2VyJ3MgdW5pcXVlIGlkLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZyBvciB1bmRlZmluZWR9XG4gKi9cblxuSWRlbnRpZnkucHJvdG90eXBlLnVpZCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB0aGlzLnVzZXJJZCgpXG4gICAgfHwgdGhpcy51c2VybmFtZSgpXG4gICAgfHwgdGhpcy5lbWFpbCgpO1xufTtcblxuLyoqXG4gKiBHZXQgZGVzY3JpcHRpb24uXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB0aGlzLnByb3h5KCd0cmFpdHMuZGVzY3JpcHRpb24nKVxuICAgIHx8IHRoaXMucHJveHkoJ3RyYWl0cy5iYWNrZ3JvdW5kJyk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgYWdlLlxuICpcbiAqIElmIHRoZSBhZ2UgaXMgbm90IGV4cGxpY2l0bHkgc2V0XG4gKiB0aGUgbWV0aG9kIHdpbGwgY29tcHV0ZSBpdCBmcm9tIGAuYmlydGhkYXkoKWBcbiAqIGlmIHBvc3NpYmxlLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqL1xuXG5JZGVudGlmeS5wcm90b3R5cGUuYWdlID0gZnVuY3Rpb24oKXtcbiAgdmFyIGRhdGUgPSB0aGlzLmJpcnRoZGF5KCk7XG4gIHZhciBhZ2UgPSBnZXQodGhpcy50cmFpdHMoKSwgJ2FnZScpO1xuICBpZiAobnVsbCAhPSBhZ2UpIHJldHVybiBhZ2U7XG4gIGlmICgnZGF0ZScgIT0gdHlwZShkYXRlKSkgcmV0dXJuO1xuICB2YXIgbm93ID0gbmV3IERhdGU7XG4gIHJldHVybiBub3cuZ2V0RnVsbFllYXIoKSAtIGRhdGUuZ2V0RnVsbFllYXIoKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBhdmF0YXIuXG4gKlxuICogLnBob3RvVXJsIG5lZWRlZCBiZWNhdXNlIGhlbHAtc2NvdXRcbiAqIGltcGxlbWVudGF0aW9uIHVzZXMgYC5hdmF0YXIgfHwgLnBob3RvVXJsYC5cbiAqXG4gKiAuYXZhdGFyVXJsIG5lZWRlZCBiZWNhdXNlIHRyYWtpbyB1c2VzIGl0LlxuICpcbiAqIEByZXR1cm4ge01peGVkfVxuICovXG5cbklkZW50aWZ5LnByb3RvdHlwZS5hdmF0YXIgPSBmdW5jdGlvbigpe1xuICB2YXIgdHJhaXRzID0gdGhpcy50cmFpdHMoKTtcbiAgcmV0dXJuIGdldCh0cmFpdHMsICdhdmF0YXInKVxuICAgIHx8IGdldCh0cmFpdHMsICdwaG90b1VybCcpXG4gICAgfHwgZ2V0KHRyYWl0cywgJ2F2YXRhclVybCcpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHBvc2l0aW9uLlxuICpcbiAqIC5qb2JUaXRsZSBuZWVkZWQgYmVjYXVzZSBzb21lIGludGVncmF0aW9ucyB1c2UgaXQuXG4gKlxuICogQHJldHVybiB7TWl4ZWR9XG4gKi9cblxuSWRlbnRpZnkucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24oKXtcbiAgdmFyIHRyYWl0cyA9IHRoaXMudHJhaXRzKCk7XG4gIHJldHVybiBnZXQodHJhaXRzLCAncG9zaXRpb24nKSB8fCBnZXQodHJhaXRzLCAnam9iVGl0bGUnKTtcbn07XG5cbi8qKlxuICogU2V0dXAgc21lIGJhc2ljIFwic3BlY2lhbFwiIHRyYWl0IHByb3hpZXMuXG4gKi9cblxuSWRlbnRpZnkucHJvdG90eXBlLnVzZXJuYW1lID0gRmFjYWRlLnByb3h5KCd0cmFpdHMudXNlcm5hbWUnKTtcbklkZW50aWZ5LnByb3RvdHlwZS53ZWJzaXRlID0gRmFjYWRlLm9uZSgndHJhaXRzLndlYnNpdGUnKTtcbklkZW50aWZ5LnByb3RvdHlwZS53ZWJzaXRlcyA9IEZhY2FkZS5tdWx0aSgndHJhaXRzLndlYnNpdGUnKTtcbklkZW50aWZ5LnByb3RvdHlwZS5waG9uZSA9IEZhY2FkZS5vbmUoJ3RyYWl0cy5waG9uZScpO1xuSWRlbnRpZnkucHJvdG90eXBlLnBob25lcyA9IEZhY2FkZS5tdWx0aSgndHJhaXRzLnBob25lJyk7XG5JZGVudGlmeS5wcm90b3R5cGUuYWRkcmVzcyA9IEZhY2FkZS5wcm94eSgndHJhaXRzLmFkZHJlc3MnKTtcbklkZW50aWZ5LnByb3RvdHlwZS5nZW5kZXIgPSBGYWNhZGUucHJveHkoJ3RyYWl0cy5nZW5kZXInKTtcbklkZW50aWZ5LnByb3RvdHlwZS5iaXJ0aGRheSA9IEZhY2FkZS5wcm94eSgndHJhaXRzLmJpcnRoZGF5Jyk7XG4iLCJcbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHRyaW07XG5cbmZ1bmN0aW9uIHRyaW0oc3RyKXtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKTtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzKnxcXHMqJC9nLCAnJyk7XG59XG5cbmV4cG9ydHMubGVmdCA9IGZ1bmN0aW9uKHN0cil7XG4gIGlmIChzdHIudHJpbUxlZnQpIHJldHVybiBzdHIudHJpbUxlZnQoKTtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzKi8sICcnKTtcbn07XG5cbmV4cG9ydHMucmlnaHQgPSBmdW5jdGlvbihzdHIpe1xuICBpZiAoc3RyLnRyaW1SaWdodCkgcmV0dXJuIHN0ci50cmltUmlnaHQoKTtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXHMqJC8sICcnKTtcbn07XG4iLCJcbnZhciBpbmhlcml0ID0gcmVxdWlyZSgnLi91dGlscycpLmluaGVyaXQ7XG52YXIgY2xvbmUgPSByZXF1aXJlKCcuL3V0aWxzJykuY2xvbmU7XG52YXIgdHlwZSA9IHJlcXVpcmUoJy4vdXRpbHMnKS50eXBlO1xudmFyIEZhY2FkZSA9IHJlcXVpcmUoJy4vZmFjYWRlJyk7XG52YXIgSWRlbnRpZnkgPSByZXF1aXJlKCcuL2lkZW50aWZ5Jyk7XG52YXIgaXNFbWFpbCA9IHJlcXVpcmUoJ2lzLWVtYWlsJyk7XG52YXIgZ2V0ID0gcmVxdWlyZSgnb2JqLWNhc2UnKTtcblxuLyoqXG4gKiBFeHBvc2UgYFRyYWNrYCBmYWNhZGUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBUcmFjaztcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBUcmFja2AgZmFjYWRlIHdpdGggYSBgZGljdGlvbmFyeWAgb2YgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBkaWN0aW9uYXJ5XG4gKiAgIEBwcm9wZXJ0eSB7U3RyaW5nfSBldmVudFxuICogICBAcHJvcGVydHkge1N0cmluZ30gdXNlcklkXG4gKiAgIEBwcm9wZXJ0eSB7U3RyaW5nfSBzZXNzaW9uSWRcbiAqICAgQHByb3BlcnR5IHtPYmplY3R9IHByb3BlcnRpZXNcbiAqICAgQHByb3BlcnR5IHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBUcmFjayAoZGljdGlvbmFyeSkge1xuICBGYWNhZGUuY2FsbCh0aGlzLCBkaWN0aW9uYXJ5KTtcbn1cblxuLyoqXG4gKiBJbmhlcml0IGZyb20gYEZhY2FkZWAuXG4gKi9cblxuaW5oZXJpdChUcmFjaywgRmFjYWRlKTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGZhY2FkZSdzIGFjdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLnR5cGUgPVxuVHJhY2sucHJvdG90eXBlLmFjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICd0cmFjayc7XG59O1xuXG4vKipcbiAqIFNldHVwIHNvbWUgYmFzaWMgcHJveGllcy5cbiAqL1xuXG5UcmFjay5wcm90b3R5cGUuZXZlbnQgPSBGYWNhZGUuZmllbGQoJ2V2ZW50Jyk7XG5UcmFjay5wcm90b3R5cGUudmFsdWUgPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMudmFsdWUnKTtcblxuLyoqXG4gKiBNaXNjXG4gKi9cblxuVHJhY2sucHJvdG90eXBlLmNhdGVnb3J5ID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLmNhdGVnb3J5Jyk7XG5cbi8qKlxuICogRWNvbW1lcmNlXG4gKi9cblxuVHJhY2sucHJvdG90eXBlLmlkID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLmlkJyk7XG5UcmFjay5wcm90b3R5cGUuc2t1ID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLnNrdScpO1xuVHJhY2sucHJvdG90eXBlLnRheCA9IEZhY2FkZS5wcm94eSgncHJvcGVydGllcy50YXgnKTtcblRyYWNrLnByb3RvdHlwZS5uYW1lID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLm5hbWUnKTtcblRyYWNrLnByb3RvdHlwZS5wcmljZSA9IEZhY2FkZS5wcm94eSgncHJvcGVydGllcy5wcmljZScpO1xuVHJhY2sucHJvdG90eXBlLnRvdGFsID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLnRvdGFsJyk7XG5UcmFjay5wcm90b3R5cGUuY291cG9uID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLmNvdXBvbicpO1xuVHJhY2sucHJvdG90eXBlLnNoaXBwaW5nID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLnNoaXBwaW5nJyk7XG5UcmFjay5wcm90b3R5cGUuZGlzY291bnQgPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMuZGlzY291bnQnKTtcblxuLyoqXG4gKiBEZXNjcmlwdGlvblxuICovXG5cblRyYWNrLnByb3RvdHlwZS5kZXNjcmlwdGlvbiA9IEZhY2FkZS5wcm94eSgncHJvcGVydGllcy5kZXNjcmlwdGlvbicpO1xuXG4vKipcbiAqIFBsYW5cbiAqL1xuXG5UcmFjay5wcm90b3R5cGUucGxhbiA9IEZhY2FkZS5wcm94eSgncHJvcGVydGllcy5wbGFuJyk7XG5cbi8qKlxuICogT3JkZXIgaWQuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5UcmFjay5wcm90b3R5cGUub3JkZXJJZCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB0aGlzLnByb3h5KCdwcm9wZXJ0aWVzLmlkJylcbiAgICB8fCB0aGlzLnByb3h5KCdwcm9wZXJ0aWVzLm9yZGVySWQnKTtcbn07XG5cbi8qKlxuICogR2V0IHN1YnRvdGFsLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqL1xuXG5UcmFjay5wcm90b3R5cGUuc3VidG90YWwgPSBmdW5jdGlvbigpe1xuICB2YXIgc3VidG90YWwgPSBnZXQodGhpcy5wcm9wZXJ0aWVzKCksICdzdWJ0b3RhbCcpO1xuICB2YXIgdG90YWwgPSB0aGlzLnRvdGFsKCk7XG4gIHZhciBuO1xuXG4gIGlmIChzdWJ0b3RhbCkgcmV0dXJuIHN1YnRvdGFsO1xuICBpZiAoIXRvdGFsKSByZXR1cm4gMDtcbiAgaWYgKG4gPSB0aGlzLnRheCgpKSB0b3RhbCAtPSBuO1xuICBpZiAobiA9IHRoaXMuc2hpcHBpbmcoKSkgdG90YWwgLT0gbjtcbiAgaWYgKG4gPSB0aGlzLmRpc2NvdW50KCkpIHRvdGFsICs9IG47XG5cbiAgcmV0dXJuIHRvdGFsO1xufTtcblxuLyoqXG4gKiBHZXQgcHJvZHVjdHMuXG4gKlxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLnByb2R1Y3RzID0gZnVuY3Rpb24oKXtcbiAgdmFyIHByb3BzID0gdGhpcy5wcm9wZXJ0aWVzKCk7XG4gIHZhciBwcm9kdWN0cyA9IGdldChwcm9wcywgJ3Byb2R1Y3RzJyk7XG4gIHJldHVybiAnYXJyYXknID09IHR5cGUocHJvZHVjdHMpXG4gICAgPyBwcm9kdWN0c1xuICAgIDogW107XG59O1xuXG4vKipcbiAqIEdldCBxdWFudGl0eS5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLnF1YW50aXR5ID0gZnVuY3Rpb24oKXtcbiAgdmFyIHByb3BzID0gdGhpcy5vYmoucHJvcGVydGllcyB8fCB7fTtcbiAgcmV0dXJuIHByb3BzLnF1YW50aXR5IHx8IDE7XG59O1xuXG4vKipcbiAqIEdldCBjdXJyZW5jeS5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLmN1cnJlbmN5ID0gZnVuY3Rpb24oKXtcbiAgdmFyIHByb3BzID0gdGhpcy5vYmoucHJvcGVydGllcyB8fCB7fTtcbiAgcmV0dXJuIHByb3BzLmN1cnJlbmN5IHx8ICdVU0QnO1xufTtcblxuLyoqXG4gKiBCQUNLV0FSRFMgQ09NUEFUSUJJTElUWTogc2hvdWxkIHByb2JhYmx5IHJlLWV4YW1pbmUgd2hlcmUgdGhlc2UgY29tZSBmcm9tLlxuICovXG5cblRyYWNrLnByb3RvdHlwZS5yZWZlcnJlciA9IEZhY2FkZS5wcm94eSgncHJvcGVydGllcy5yZWZlcnJlcicpO1xuVHJhY2sucHJvdG90eXBlLnF1ZXJ5ID0gRmFjYWRlLnByb3h5KCdvcHRpb25zLnF1ZXJ5Jyk7XG5cbi8qKlxuICogR2V0IHRoZSBjYWxsJ3MgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYWxpYXNlc1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cblRyYWNrLnByb3RvdHlwZS5wcm9wZXJ0aWVzID0gZnVuY3Rpb24gKGFsaWFzZXMpIHtcbiAgdmFyIHJldCA9IHRoaXMuZmllbGQoJ3Byb3BlcnRpZXMnKSB8fCB7fTtcbiAgYWxpYXNlcyA9IGFsaWFzZXMgfHwge307XG5cbiAgZm9yICh2YXIgYWxpYXMgaW4gYWxpYXNlcykge1xuICAgIHZhciB2YWx1ZSA9IG51bGwgPT0gdGhpc1thbGlhc11cbiAgICAgID8gdGhpcy5wcm94eSgncHJvcGVydGllcy4nICsgYWxpYXMpXG4gICAgICA6IHRoaXNbYWxpYXNdKCk7XG4gICAgaWYgKG51bGwgPT0gdmFsdWUpIGNvbnRpbnVlO1xuICAgIHJldFthbGlhc2VzW2FsaWFzXV0gPSB2YWx1ZTtcbiAgICBkZWxldGUgcmV0W2FsaWFzXTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgY2FsbCdzIHVzZXJuYW1lLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZyBvciBVbmRlZmluZWR9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLnVzZXJuYW1lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5wcm94eSgndHJhaXRzLnVzZXJuYW1lJykgfHxcbiAgICAgICAgIHRoaXMucHJveHkoJ3Byb3BlcnRpZXMudXNlcm5hbWUnKSB8fFxuICAgICAgICAgdGhpcy51c2VySWQoKSB8fFxuICAgICAgICAgdGhpcy5zZXNzaW9uSWQoKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBjYWxsJ3MgZW1haWwsIHVzaW5nIGFuIHRoZSB1c2VyIElEIGlmIGl0J3MgYSB2YWxpZCBlbWFpbC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmcgb3IgVW5kZWZpbmVkfVxuICovXG5cblRyYWNrLnByb3RvdHlwZS5lbWFpbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGVtYWlsID0gdGhpcy5wcm94eSgndHJhaXRzLmVtYWlsJyk7XG4gIGVtYWlsID0gZW1haWwgfHwgdGhpcy5wcm94eSgncHJvcGVydGllcy5lbWFpbCcpO1xuICBpZiAoZW1haWwpIHJldHVybiBlbWFpbDtcblxuICB2YXIgdXNlcklkID0gdGhpcy51c2VySWQoKTtcbiAgaWYgKGlzRW1haWwodXNlcklkKSkgcmV0dXJuIHVzZXJJZDtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBjYWxsJ3MgcmV2ZW51ZSwgcGFyc2luZyBpdCBmcm9tIGEgc3RyaW5nIHdpdGggYW4gb3B0aW9uYWwgbGVhZGluZ1xuICogZG9sbGFyIHNpZ24uXG4gKlxuICogRm9yIHByb2R1Y3RzL3NlcnZpY2VzIHRoYXQgZG9uJ3QgaGF2ZSBzaGlwcGluZyBhbmQgYXJlIG5vdCBkaXJlY3RseSB0YXhlZCxcbiAqIHRoZXkgb25seSBjYXJlIGFib3V0IHRyYWNraW5nIGByZXZlbnVlYC4gVGhlc2UgYXJlIHRoaW5ncyBsaWtlXG4gKiBTYWFTIGNvbXBhbmllcywgd2hvIHNlbGwgbW9udGhseSBzdWJzY3JpcHRpb25zLiBUaGUgc3Vic2NyaXB0aW9ucyBhcmVuJ3RcbiAqIHRheGVkIGRpcmVjdGx5LCBhbmQgc2luY2UgaXQncyBhIGRpZ2l0YWwgcHJvZHVjdCwgaXQgaGFzIG5vIHNoaXBwaW5nLlxuICpcbiAqIFRoZSBvbmx5IGNhc2Ugd2hlcmUgdGhlcmUncyBhIGRpZmZlcmVuY2UgYmV0d2VlbiBgcmV2ZW51ZWAgYW5kIGB0b3RhbGBcbiAqIChpbiB0aGUgY29udGV4dCBvZiBhbmFseXRpY3MpIGlzIG9uIGVjb21tZXJjZSBwbGF0Zm9ybXMsIHdoZXJlIHRoZXkgd2FudFxuICogdGhlIGByZXZlbnVlYCBmdW5jdGlvbiB0byBhY3R1YWxseSByZXR1cm4gdGhlIGB0b3RhbGAgKHdoaWNoIGluY2x1ZGVzXG4gKiB0YXggYW5kIHNoaXBwaW5nLCB0b3RhbCA9IHN1YnRvdGFsICsgdGF4ICsgc2hpcHBpbmcpLiBUaGlzIGlzIHByb2JhYmx5XG4gKiBiZWNhdXNlIG9uIHRoZWlyIGJhY2tlbmQgdGhleSBhc3N1bWUgdGF4IGFuZCBzaGlwcGluZyBoYXMgYmVlbiBhcHBsaWVkIHRvXG4gKiB0aGUgdmFsdWUsIGFuZCBzbyBjYW4gZ2V0IHRoZSByZXZlbnVlIG9uIHRoZWlyIG93bi5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLnJldmVudWUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByZXZlbnVlID0gdGhpcy5wcm94eSgncHJvcGVydGllcy5yZXZlbnVlJyk7XG4gIHZhciBldmVudCA9IHRoaXMuZXZlbnQoKTtcblxuICAvLyBpdCdzIGFsd2F5cyByZXZlbnVlLCB1bmxlc3MgaXQncyBjYWxsZWQgZHVyaW5nIGFuIG9yZGVyIGNvbXBsZXRpb24uXG4gIGlmICghcmV2ZW51ZSAmJiBldmVudCAmJiBldmVudC5tYXRjaCgvY29tcGxldGVkID9vcmRlci9pKSkge1xuICAgIHJldmVudWUgPSB0aGlzLnByb3h5KCdwcm9wZXJ0aWVzLnRvdGFsJyk7XG4gIH1cblxuICByZXR1cm4gY3VycmVuY3kocmV2ZW51ZSk7XG59O1xuXG4vKipcbiAqIEdldCBjZW50cy5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKi9cblxuVHJhY2sucHJvdG90eXBlLmNlbnRzID0gZnVuY3Rpb24oKXtcbiAgdmFyIHJldmVudWUgPSB0aGlzLnJldmVudWUoKTtcbiAgcmV0dXJuICdudW1iZXInICE9IHR5cGVvZiByZXZlbnVlXG4gICAgPyB0aGlzLnZhbHVlKCkgfHwgMFxuICAgIDogcmV2ZW51ZSAqIDEwMDtcbn07XG5cbi8qKlxuICogQSB1dGlsaXR5IHRvIHR1cm4gdGhlIHBpZWNlcyBvZiBhIHRyYWNrIGNhbGwgaW50byBhbiBpZGVudGlmeS4gVXNlZCBmb3JcbiAqIGludGVncmF0aW9ucyB3aXRoIHN1cGVyIHByb3BlcnRpZXMgb3IgcmF0ZSBsaW1pdHMuXG4gKlxuICogVE9ETzogcmVtb3ZlIG1lLlxuICpcbiAqIEByZXR1cm4ge0ZhY2FkZX1cbiAqL1xuXG5UcmFjay5wcm90b3R5cGUuaWRlbnRpZnkgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBqc29uID0gdGhpcy5qc29uKCk7XG4gIGpzb24udHJhaXRzID0gdGhpcy50cmFpdHMoKTtcbiAgcmV0dXJuIG5ldyBJZGVudGlmeShqc29uKTtcbn07XG5cbi8qKlxuICogR2V0IGZsb2F0IGZyb20gY3VycmVuY3kgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKi9cblxuZnVuY3Rpb24gY3VycmVuY3kodmFsKSB7XG4gIGlmICghdmFsKSByZXR1cm47XG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykgcmV0dXJuIHZhbDtcbiAgaWYgKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnKSByZXR1cm47XG5cbiAgdmFsID0gdmFsLnJlcGxhY2UoL1xcJC9nLCAnJyk7XG4gIHZhbCA9IHBhcnNlRmxvYXQodmFsKTtcblxuICBpZiAoIWlzTmFOKHZhbCkpIHJldHVybiB2YWw7XG59XG4iLCJcbnZhciBpbmhlcml0ID0gcmVxdWlyZSgnLi91dGlscycpLmluaGVyaXQ7XG52YXIgRmFjYWRlID0gcmVxdWlyZSgnLi9mYWNhZGUnKTtcbnZhciBUcmFjayA9IHJlcXVpcmUoJy4vdHJhY2snKTtcblxuLyoqXG4gKiBFeHBvc2UgYFBhZ2VgIGZhY2FkZVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZTtcblxuLyoqXG4gKiBJbml0aWFsaXplIG5ldyBgUGFnZWAgZmFjYWRlIHdpdGggYGRpY3Rpb25hcnlgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkaWN0aW9uYXJ5XG4gKiAgIEBwYXJhbSB7U3RyaW5nfSBjYXRlZ29yeVxuICogICBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogICBAcGFyYW0ge09iamVjdH0gdHJhaXRzXG4gKiAgIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gUGFnZShkaWN0aW9uYXJ5KXtcbiAgRmFjYWRlLmNhbGwodGhpcywgZGljdGlvbmFyeSk7XG59XG5cbi8qKlxuICogSW5oZXJpdCBmcm9tIGBGYWNhZGVgXG4gKi9cblxuaW5oZXJpdChQYWdlLCBGYWNhZGUpO1xuXG4vKipcbiAqIEdldCB0aGUgZmFjYWRlJ3MgYWN0aW9uLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5QYWdlLnByb3RvdHlwZS50eXBlID1cblBhZ2UucHJvdG90eXBlLmFjdGlvbiA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiAncGFnZSc7XG59O1xuXG4vKipcbiAqIEZpZWxkc1xuICovXG5cblBhZ2UucHJvdG90eXBlLmNhdGVnb3J5ID0gRmFjYWRlLmZpZWxkKCdjYXRlZ29yeScpO1xuUGFnZS5wcm90b3R5cGUubmFtZSA9IEZhY2FkZS5maWVsZCgnbmFtZScpO1xuXG4vKipcbiAqIFByb3hpZXMuXG4gKi9cblxuUGFnZS5wcm90b3R5cGUudGl0bGUgPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMudGl0bGUnKTtcblBhZ2UucHJvdG90eXBlLnBhdGggPSBGYWNhZGUucHJveHkoJ3Byb3BlcnRpZXMucGF0aCcpO1xuUGFnZS5wcm90b3R5cGUudXJsID0gRmFjYWRlLnByb3h5KCdwcm9wZXJ0aWVzLnVybCcpO1xuXG4vKipcbiAqIFJlZmVycmVyLlxuICovXG5cblBhZ2UucHJvdG90eXBlLnJlZmVycmVyID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRoaXMucHJveHkoJ3Byb3BlcnRpZXMucmVmZXJyZXInKVxuICAgIHx8IHRoaXMucHJveHkoJ2NvbnRleHQucmVmZXJyZXIudXJsJyk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgcGFnZSBwcm9wZXJ0aWVzIG1peGluZyBgY2F0ZWdvcnlgIGFuZCBgbmFtZWAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFsaWFzZXNcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5QYWdlLnByb3RvdHlwZS5wcm9wZXJ0aWVzID0gZnVuY3Rpb24oYWxpYXNlcykge1xuICB2YXIgcHJvcHMgPSB0aGlzLmZpZWxkKCdwcm9wZXJ0aWVzJykgfHwge307XG4gIHZhciBjYXRlZ29yeSA9IHRoaXMuY2F0ZWdvcnkoKTtcbiAgdmFyIG5hbWUgPSB0aGlzLm5hbWUoKTtcbiAgYWxpYXNlcyA9IGFsaWFzZXMgfHwge307XG5cbiAgaWYgKGNhdGVnb3J5KSBwcm9wcy5jYXRlZ29yeSA9IGNhdGVnb3J5O1xuICBpZiAobmFtZSkgcHJvcHMubmFtZSA9IG5hbWU7XG5cbiAgZm9yICh2YXIgYWxpYXMgaW4gYWxpYXNlcykge1xuICAgIHZhciB2YWx1ZSA9IG51bGwgPT0gdGhpc1thbGlhc11cbiAgICAgID8gdGhpcy5wcm94eSgncHJvcGVydGllcy4nICsgYWxpYXMpXG4gICAgICA6IHRoaXNbYWxpYXNdKCk7XG4gICAgaWYgKG51bGwgPT0gdmFsdWUpIGNvbnRpbnVlO1xuICAgIHByb3BzW2FsaWFzZXNbYWxpYXNdXSA9IHZhbHVlO1xuICAgIGlmIChhbGlhcyAhPT0gYWxpYXNlc1thbGlhc10pIGRlbGV0ZSBwcm9wc1thbGlhc107XG4gIH1cblxuICByZXR1cm4gcHJvcHM7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgcGFnZSBmdWxsTmFtZS5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuUGFnZS5wcm90b3R5cGUuZnVsbE5hbWUgPSBmdW5jdGlvbigpe1xuICB2YXIgY2F0ZWdvcnkgPSB0aGlzLmNhdGVnb3J5KCk7XG4gIHZhciBuYW1lID0gdGhpcy5uYW1lKCk7XG4gIHJldHVybiBuYW1lICYmIGNhdGVnb3J5XG4gICAgPyBjYXRlZ29yeSArICcgJyArIG5hbWVcbiAgICA6IG5hbWU7XG59O1xuXG4vKipcbiAqIEdldCBldmVudCB3aXRoIGBuYW1lYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuUGFnZS5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbihuYW1lKXtcbiAgcmV0dXJuIG5hbWVcbiAgICA/ICdWaWV3ZWQgJyArIG5hbWUgKyAnIFBhZ2UnXG4gICAgOiAnTG9hZGVkIGEgUGFnZSc7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgdGhpcyBQYWdlIHRvIGEgVHJhY2sgZmFjYWRlIHdpdGggYG5hbWVgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtUcmFja31cbiAqL1xuXG5QYWdlLnByb3RvdHlwZS50cmFjayA9IGZ1bmN0aW9uKG5hbWUpe1xuICB2YXIgcHJvcHMgPSB0aGlzLnByb3BlcnRpZXMoKTtcbiAgcmV0dXJuIG5ldyBUcmFjayh7XG4gICAgZXZlbnQ6IHRoaXMuZXZlbnQobmFtZSksXG4gICAgdGltZXN0YW1wOiB0aGlzLnRpbWVzdGFtcCgpLFxuICAgIGNvbnRleHQ6IHRoaXMuY29udGV4dCgpLFxuICAgIHByb3BlcnRpZXM6IHByb3BzXG4gIH0pO1xufTtcbiIsIlxudmFyIGluaGVyaXQgPSByZXF1aXJlKCcuL3V0aWxzJykuaW5oZXJpdDtcbnZhciBQYWdlID0gcmVxdWlyZSgnLi9wYWdlJyk7XG52YXIgVHJhY2sgPSByZXF1aXJlKCcuL3RyYWNrJyk7XG5cbi8qKlxuICogRXhwb3NlIGBTY3JlZW5gIGZhY2FkZVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gU2NyZWVuO1xuXG4vKipcbiAqIEluaXRpYWxpemUgbmV3IGBTY3JlZW5gIGZhY2FkZSB3aXRoIGBkaWN0aW9uYXJ5YC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZGljdGlvbmFyeVxuICogICBAcGFyYW0ge1N0cmluZ30gY2F0ZWdvcnlcbiAqICAgQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqICAgQHBhcmFtIHtPYmplY3R9IHRyYWl0c1xuICogICBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICovXG5cbmZ1bmN0aW9uIFNjcmVlbihkaWN0aW9uYXJ5KXtcbiAgUGFnZS5jYWxsKHRoaXMsIGRpY3Rpb25hcnkpO1xufVxuXG4vKipcbiAqIEluaGVyaXQgZnJvbSBgUGFnZWBcbiAqL1xuXG5pbmhlcml0KFNjcmVlbiwgUGFnZSk7XG5cbi8qKlxuICogR2V0IHRoZSBmYWNhZGUncyBhY3Rpb24uXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5TY3JlZW4ucHJvdG90eXBlLnR5cGUgPVxuU2NyZWVuLnByb3RvdHlwZS5hY3Rpb24gPSBmdW5jdGlvbigpe1xuICByZXR1cm4gJ3NjcmVlbic7XG59O1xuXG4vKipcbiAqIEdldCBldmVudCB3aXRoIGBuYW1lYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5TY3JlZW4ucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24obmFtZSl7XG4gIHJldHVybiBuYW1lXG4gICAgPyAnVmlld2VkICcgKyBuYW1lICsgJyBTY3JlZW4nXG4gICAgOiAnTG9hZGVkIGEgU2NyZWVuJztcbn07XG5cbi8qKlxuICogQ29udmVydCB0aGlzIFNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7VHJhY2t9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblNjcmVlbi5wcm90b3R5cGUudHJhY2sgPSBmdW5jdGlvbihuYW1lKXtcbiAgdmFyIHByb3BzID0gdGhpcy5wcm9wZXJ0aWVzKCk7XG4gIHJldHVybiBuZXcgVHJhY2soe1xuICAgIGV2ZW50OiB0aGlzLmV2ZW50KG5hbWUpLFxuICAgIHRpbWVzdGFtcDogdGhpcy50aW1lc3RhbXAoKSxcbiAgICBjb250ZXh0OiB0aGlzLmNvbnRleHQoKSxcbiAgICBwcm9wZXJ0aWVzOiBwcm9wc1xuICB9KTtcbn07XG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYWZ0ZXIgKHRpbWVzLCBmdW5jKSB7XG4gIC8vIEFmdGVyIDAsIHJlYWxseT9cbiAgaWYgKHRpbWVzIDw9IDApIHJldHVybiBmdW5jKCk7XG5cbiAgLy8gVGhhdCdzIG1vcmUgbGlrZSBpdC5cbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGlmICgtLXRpbWVzIDwgMSkge1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH07XG59OyIsIlxudHJ5IHtcbiAgdmFyIGJpbmQgPSByZXF1aXJlKCdiaW5kJyk7XG59IGNhdGNoIChlKSB7XG4gIHZhciBiaW5kID0gcmVxdWlyZSgnYmluZC1jb21wb25lbnQnKTtcbn1cblxudmFyIGJpbmRBbGwgPSByZXF1aXJlKCdiaW5kLWFsbCcpO1xuXG5cbi8qKlxuICogRXhwb3NlIGBiaW5kYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBiaW5kO1xuXG5cbi8qKlxuICogRXhwb3NlIGBiaW5kQWxsYC5cbiAqL1xuXG5leHBvcnRzLmFsbCA9IGJpbmRBbGw7XG5cblxuLyoqXG4gKiBFeHBvc2UgYGJpbmRNZXRob2RzYC5cbiAqL1xuXG5leHBvcnRzLm1ldGhvZHMgPSBiaW5kTWV0aG9kcztcblxuXG4vKipcbiAqIEJpbmQgYG1ldGhvZHNgIG9uIGBvYmpgIHRvIGFsd2F5cyBiZSBjYWxsZWQgd2l0aCB0aGUgYG9iamAgYXMgY29udGV4dC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kcy4uLlxuICovXG5cbmZ1bmN0aW9uIGJpbmRNZXRob2RzIChvYmosIG1ldGhvZHMpIHtcbiAgbWV0aG9kcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgZm9yICh2YXIgaSA9IDAsIG1ldGhvZDsgbWV0aG9kID0gbWV0aG9kc1tpXTsgaSsrKSB7XG4gICAgb2JqW21ldGhvZF0gPSBiaW5kKG9iaiwgb2JqW21ldGhvZF0pO1xuICB9XG4gIHJldHVybiBvYmo7XG59IiwiLyoqXG4gKiBTbGljZSByZWZlcmVuY2UuXG4gKi9cblxudmFyIHNsaWNlID0gW10uc2xpY2U7XG5cbi8qKlxuICogQmluZCBgb2JqYCB0byBgZm5gLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBmbiBvciBzdHJpbmdcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgZm4pe1xuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIGZuKSBmbiA9IG9ialtmbl07XG4gIGlmICgnZnVuY3Rpb24nICE9IHR5cGVvZiBmbikgdGhyb3cgbmV3IEVycm9yKCdiaW5kKCkgcmVxdWlyZXMgYSBmdW5jdGlvbicpO1xuICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIGZuLmFwcGx5KG9iaiwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gIH1cbn07XG4iLCJcbnRyeSB7XG4gIHZhciBiaW5kID0gcmVxdWlyZSgnYmluZCcpO1xuICB2YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcbn0gY2F0Y2ggKGUpIHtcbiAgdmFyIGJpbmQgPSByZXF1aXJlKCdiaW5kLWNvbXBvbmVudCcpO1xuICB2YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUtY29tcG9uZW50Jyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgdmFyIHZhbCA9IG9ialtrZXldO1xuICAgIGlmICh0eXBlKHZhbCkgPT09ICdmdW5jdGlvbicpIG9ialtrZXldID0gYmluZChvYmosIG9ialtrZXldKTtcbiAgfVxuICByZXR1cm4gb2JqO1xufTsiLCJ2YXIgbmV4dCA9IHJlcXVpcmUoJ25leHQtdGljaycpO1xuXG5cbi8qKlxuICogRXhwb3NlIGBjYWxsYmFja2AuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBjYWxsYmFjaztcblxuXG4vKipcbiAqIENhbGwgYW4gYGZuYCBiYWNrIHN5bmNocm9ub3VzbHkgaWYgaXQgZXhpc3RzLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKi9cblxuZnVuY3Rpb24gY2FsbGJhY2sgKGZuKSB7XG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm4pIGZuKCk7XG59XG5cblxuLyoqXG4gKiBDYWxsIGFuIGBmbmAgYmFjayBhc3luY2hyb25vdXNseSBpZiBpdCBleGlzdHMuIElmIGB3YWl0YCBpcyBvbW1pdHRlZCwgdGhlXG4gKiBgZm5gIHdpbGwgYmUgY2FsbGVkIG9uIG5leHQgdGljay5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtOdW1iZXJ9IHdhaXQgKG9wdGlvbmFsKVxuICovXG5cbmNhbGxiYWNrLmFzeW5jID0gZnVuY3Rpb24gKGZuLCB3YWl0KSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgZm4pIHJldHVybjtcbiAgaWYgKCF3YWl0KSByZXR1cm4gbmV4dChmbik7XG4gIHNldFRpbWVvdXQoZm4sIHdhaXQpO1xufTtcblxuXG4vKipcbiAqIFN5bW1ldHJ5LlxuICovXG5cbmNhbGxiYWNrLnN5bmMgPSBjYWxsYmFjaztcbiIsIlwidXNlIHN0cmljdFwiXG5cbmlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09ICdmdW5jdGlvbicpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihmKXsgc2V0SW1tZWRpYXRlKGYpIH1cbn1cbi8vIGxlZ2FjeSBub2RlLmpzXG5lbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcHJvY2Vzcy5uZXh0VGljayA9PSAnZnVuY3Rpb24nKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gcHJvY2Vzcy5uZXh0VGlja1xufVxuLy8gZmFsbGJhY2sgZm9yIG90aGVyIGVudmlyb25tZW50cyAvIHBvc3RNZXNzYWdlIGJlaGF2ZXMgYmFkbHkgb24gSUU4XG5lbHNlIGlmICh0eXBlb2Ygd2luZG93ID09ICd1bmRlZmluZWQnIHx8IHdpbmRvdy5BY3RpdmVYT2JqZWN0IHx8ICF3aW5kb3cucG9zdE1lc3NhZ2UpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihmKXsgc2V0VGltZW91dChmKSB9O1xufSBlbHNlIHtcbiAgdmFyIHEgPSBbXTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgcS5sZW5ndGgpIHtcbiAgICAgIHRyeSB7IHFbaSsrXSgpOyB9XG4gICAgICBjYXRjaCAoZSkge1xuICAgICAgICBxID0gcS5zbGljZShpKTtcbiAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCd0aWMhJywgJyonKTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcS5sZW5ndGggPSAwO1xuICB9LCB0cnVlKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGZuKXtcbiAgICBpZiAoIXEubGVuZ3RoKSB3aW5kb3cucG9zdE1lc3NhZ2UoJ3RpYyEnLCAnKicpO1xuICAgIHEucHVzaChmbik7XG4gIH1cbn1cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0eXBlO1xuXG50cnkge1xuICB0eXBlID0gcmVxdWlyZSgndHlwZScpO1xufSBjYXRjaChlKXtcbiAgdHlwZSA9IHJlcXVpcmUoJ3R5cGUtY29tcG9uZW50Jyk7XG59XG5cbi8qKlxuICogTW9kdWxlIGV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBjbG9uZTtcblxuLyoqXG4gKiBDbG9uZXMgb2JqZWN0cy5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBhbnkgb2JqZWN0XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGNsb25lKG9iail7XG4gIHN3aXRjaCAodHlwZShvYmopKSB7XG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIHZhciBjb3B5ID0ge307XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIGNvcHlba2V5XSA9IGNsb25lKG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGNvcHk7XG5cbiAgICBjYXNlICdhcnJheSc6XG4gICAgICB2YXIgY29weSA9IG5ldyBBcnJheShvYmoubGVuZ3RoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBjb3B5W2ldID0gY2xvbmUob2JqW2ldKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb3B5O1xuXG4gICAgY2FzZSAncmVnZXhwJzpcbiAgICAgIC8vIGZyb20gbWlsbGVybWVkZWlyb3MvYW1kLXV0aWxzIC0gTUlUXG4gICAgICB2YXIgZmxhZ3MgPSAnJztcbiAgICAgIGZsYWdzICs9IG9iai5tdWx0aWxpbmUgPyAnbScgOiAnJztcbiAgICAgIGZsYWdzICs9IG9iai5nbG9iYWwgPyAnZycgOiAnJztcbiAgICAgIGZsYWdzICs9IG9iai5pZ25vcmVDYXNlID8gJ2knIDogJyc7XG4gICAgICByZXR1cm4gbmV3IFJlZ0V4cChvYmouc291cmNlLCBmbGFncyk7XG5cbiAgICBjYXNlICdkYXRlJzpcbiAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouZ2V0VGltZSgpKTtcblxuICAgIGRlZmF1bHQ6IC8vIHN0cmluZywgbnVtYmVyLCBib29sZWFuLCDigKZcbiAgICAgIHJldHVybiBvYmo7XG4gIH1cbn1cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBiaW5kID0gcmVxdWlyZSgnYmluZCcpO1xudmFyIGNsb25lID0gcmVxdWlyZSgnY2xvbmUnKTtcbnZhciBjb29raWUgPSByZXF1aXJlKCdjb29raWUnKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ2FuYWx5dGljcy5qczpjb29raWUnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2RlZmF1bHRzJyk7XG52YXIganNvbiA9IHJlcXVpcmUoJ2pzb24nKTtcbnZhciB0b3BEb21haW4gPSByZXF1aXJlKCd0b3AtZG9tYWluJyk7XG5cblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBDb29raWVgIHdpdGggYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gQ29va2llKG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zKG9wdGlvbnMpO1xufVxuXG5cbi8qKlxuICogR2V0IG9yIHNldCB0aGUgY29va2llIG9wdGlvbnMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqICAgQGZpZWxkIHtOdW1iZXJ9IG1heGFnZSAoMSB5ZWFyKVxuICogICBAZmllbGQge1N0cmluZ30gZG9tYWluXG4gKiAgIEBmaWVsZCB7U3RyaW5nfSBwYXRoXG4gKiAgIEBmaWVsZCB7Qm9vbGVhbn0gc2VjdXJlXG4gKi9cblxuQ29va2llLnByb3RvdHlwZS5vcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRoaXMuX29wdGlvbnM7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIGRvbWFpbiA9ICcuJyArIHRvcERvbWFpbih3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gIGlmIChkb21haW4gPT09ICcuJykgZG9tYWluID0gbnVsbDtcblxuICB0aGlzLl9vcHRpb25zID0gZGVmYXVsdHMob3B0aW9ucywge1xuICAgIC8vIGRlZmF1bHQgdG8gYSB5ZWFyXG4gICAgbWF4YWdlOiAzMTUzNjAwMDAwMCxcbiAgICBwYXRoOiAnLycsXG4gICAgZG9tYWluOiBkb21haW5cbiAgfSk7XG5cbiAgLy8gaHR0cDovL2N1cmwuaGF4eC5zZS9yZmMvY29va2llX3NwZWMuaHRtbFxuICAvLyBodHRwczovL3B1YmxpY3N1ZmZpeC5vcmcvbGlzdC9lZmZlY3RpdmVfdGxkX25hbWVzLmRhdFxuICAvL1xuICAvLyB0cnkgc2V0dGluZyBhIGR1bW15IGNvb2tpZSB3aXRoIHRoZSBvcHRpb25zXG4gIC8vIGlmIHRoZSBjb29raWUgaXNuJ3Qgc2V0LCBpdCBwcm9iYWJseSBtZWFuc1xuICAvLyB0aGF0IHRoZSBkb21haW4gaXMgb24gdGhlIHB1YmxpYyBzdWZmaXggbGlzdFxuICAvLyBsaWtlIG15YXBwLmhlcm9rdWFwcC5jb20gb3IgbG9jYWxob3N0IC8gaXAuXG4gIHRoaXMuc2V0KCdhanM6dGVzdCcsIHRydWUpO1xuICBpZiAoIXRoaXMuZ2V0KCdhanM6dGVzdCcpKSB7XG4gICAgZGVidWcoJ2ZhbGxiYWNrIHRvIGRvbWFpbj1udWxsJyk7XG4gICAgdGhpcy5fb3B0aW9ucy5kb21haW4gPSBudWxsO1xuICB9XG4gIHRoaXMucmVtb3ZlKCdhanM6dGVzdCcpO1xufTtcblxuXG4vKipcbiAqIFNldCBhIGBrZXlgIGFuZCBgdmFsdWVgIGluIG91ciBjb29raWUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufSBzYXZlZFxuICovXG5cbkNvb2tpZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICB0cnkge1xuICAgIHZhbHVlID0ganNvbi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIGNvb2tpZShrZXksIHZhbHVlLCBjbG9uZSh0aGlzLl9vcHRpb25zKSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBHZXQgYSB2YWx1ZSBmcm9tIG91ciBjb29raWUgYnkgYGtleWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHJldHVybiB7T2JqZWN0fSB2YWx1ZVxuICovXG5cbkNvb2tpZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG4gIHRyeSB7XG4gICAgdmFyIHZhbHVlID0gY29va2llKGtleSk7XG4gICAgdmFsdWUgPSB2YWx1ZSA/IGpzb24ucGFyc2UodmFsdWUpIDogbnVsbDtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcblxuXG4vKipcbiAqIFJlbW92ZSBhIHZhbHVlIGZyb20gb3VyIGNvb2tpZSBieSBga2V5YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcmV0dXJuIHtCb29sZWFufSByZW1vdmVkXG4gKi9cblxuQ29va2llLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihrZXkpIHtcbiAgdHJ5IHtcbiAgICBjb29raWUoa2V5LCBudWxsLCBjbG9uZSh0aGlzLl9vcHRpb25zKSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBFeHBvc2UgdGhlIGNvb2tpZSBzaW5nbGV0b24uXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBiaW5kLmFsbChuZXcgQ29va2llKCkpO1xuXG5cbi8qKlxuICogRXhwb3NlIHRoZSBgQ29va2llYCBjb25zdHJ1Y3Rvci5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cy5Db29raWUgPSBDb29raWU7XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdjb29raWUnKTtcblxuLyoqXG4gKiBTZXQgb3IgZ2V0IGNvb2tpZSBgbmFtZWAgd2l0aCBgdmFsdWVgIGFuZCBgb3B0aW9uc2Agb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgb3B0aW9ucyl7XG4gIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGNhc2UgMzpcbiAgICBjYXNlIDI6XG4gICAgICByZXR1cm4gc2V0KG5hbWUsIHZhbHVlLCBvcHRpb25zKTtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gZ2V0KG5hbWUpO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gYWxsKCk7XG4gIH1cbn07XG5cbi8qKlxuICogU2V0IGNvb2tpZSBgbmFtZWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2V0KG5hbWUsIHZhbHVlLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgc3RyID0gZW5jb2RlKG5hbWUpICsgJz0nICsgZW5jb2RlKHZhbHVlKTtcblxuICBpZiAobnVsbCA9PSB2YWx1ZSkgb3B0aW9ucy5tYXhhZ2UgPSAtMTtcblxuICBpZiAob3B0aW9ucy5tYXhhZ2UpIHtcbiAgICBvcHRpb25zLmV4cGlyZXMgPSBuZXcgRGF0ZSgrbmV3IERhdGUgKyBvcHRpb25zLm1heGFnZSk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5wYXRoKSBzdHIgKz0gJzsgcGF0aD0nICsgb3B0aW9ucy5wYXRoO1xuICBpZiAob3B0aW9ucy5kb21haW4pIHN0ciArPSAnOyBkb21haW49JyArIG9wdGlvbnMuZG9tYWluO1xuICBpZiAob3B0aW9ucy5leHBpcmVzKSBzdHIgKz0gJzsgZXhwaXJlcz0nICsgb3B0aW9ucy5leHBpcmVzLnRvVVRDU3RyaW5nKCk7XG4gIGlmIChvcHRpb25zLnNlY3VyZSkgc3RyICs9ICc7IHNlY3VyZSc7XG5cbiAgZG9jdW1lbnQuY29va2llID0gc3RyO1xufVxuXG4vKipcbiAqIFJldHVybiBhbGwgY29va2llcy5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBhbGwoKSB7XG4gIHJldHVybiBwYXJzZShkb2N1bWVudC5jb29raWUpO1xufVxuXG4vKipcbiAqIEdldCBjb29raWUgYG5hbWVgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBnZXQobmFtZSkge1xuICByZXR1cm4gYWxsKClbbmFtZV07XG59XG5cbi8qKlxuICogUGFyc2UgY29va2llIGBzdHJgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICB2YXIgb2JqID0ge307XG4gIHZhciBwYWlycyA9IHN0ci5zcGxpdCgvICo7ICovKTtcbiAgdmFyIHBhaXI7XG4gIGlmICgnJyA9PSBwYWlyc1swXSkgcmV0dXJuIG9iajtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWlycy5sZW5ndGg7ICsraSkge1xuICAgIHBhaXIgPSBwYWlyc1tpXS5zcGxpdCgnPScpO1xuICAgIG9ialtkZWNvZGUocGFpclswXSldID0gZGVjb2RlKHBhaXJbMV0pO1xuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogRW5jb2RlLlxuICovXG5cbmZ1bmN0aW9uIGVuY29kZSh2YWx1ZSl7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBkZWJ1ZygnZXJyb3IgYGVuY29kZSglbylgIC0gJW8nLCB2YWx1ZSwgZSlcbiAgfVxufVxuXG4vKipcbiAqIERlY29kZS5cbiAqL1xuXG5mdW5jdGlvbiBkZWNvZGUodmFsdWUpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGRlYnVnKCdlcnJvciBgZGVjb2RlKCVvKWAgLSAlbycsIHZhbHVlLCBlKVxuICB9XG59XG4iLCJpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHdpbmRvdykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL2RlYnVnJyk7XG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbn1cbiIsIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgdHR5ID0gcmVxdWlyZSgndHR5Jyk7XG5cbi8qKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZGVidWc7XG5cbi8qKlxuICogRW5hYmxlZCBkZWJ1Z2dlcnMuXG4gKi9cblxudmFyIG5hbWVzID0gW11cbiAgLCBza2lwcyA9IFtdO1xuXG4ocHJvY2Vzcy5lbnYuREVCVUcgfHwgJycpXG4gIC5zcGxpdCgvW1xccyxdKy8pXG4gIC5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpe1xuICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoJyonLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVbMF0gPT09ICctJykge1xuICAgICAgc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWUuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lICsgJyQnKSk7XG4gICAgfVxuICB9KTtcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxudmFyIGNvbG9ycyA9IFs2LCAyLCAzLCA0LCA1LCAxXTtcblxuLyoqXG4gKiBQcmV2aW91cyBkZWJ1ZygpIGNhbGwuXG4gKi9cblxudmFyIHByZXYgPSB7fTtcblxuLyoqXG4gKiBQcmV2aW91c2x5IGFzc2lnbmVkIGNvbG9yLlxuICovXG5cbnZhciBwcmV2Q29sb3IgPSAwO1xuXG4vKipcbiAqIElzIHN0ZG91dCBhIFRUWT8gQ29sb3JlZCBvdXRwdXQgaXMgZGlzYWJsZWQgd2hlbiBgdHJ1ZWAuXG4gKi9cblxudmFyIGlzYXR0eSA9IHR0eS5pc2F0dHkoMik7XG5cbi8qKlxuICogU2VsZWN0IGEgY29sb3IuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29sb3IoKSB7XG4gIHJldHVybiBjb2xvcnNbcHJldkNvbG9yKysgJSBjb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBIdW1hbml6ZSB0aGUgZ2l2ZW4gYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbVxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gaHVtYW5pemUobXMpIHtcbiAgdmFyIHNlYyA9IDEwMDBcbiAgICAsIG1pbiA9IDYwICogMTAwMFxuICAgICwgaG91ciA9IDYwICogbWluO1xuXG4gIGlmIChtcyA+PSBob3VyKSByZXR1cm4gKG1zIC8gaG91cikudG9GaXhlZCgxKSArICdoJztcbiAgaWYgKG1zID49IG1pbikgcmV0dXJuIChtcyAvIG1pbikudG9GaXhlZCgxKSArICdtJztcbiAgaWYgKG1zID49IHNlYykgcmV0dXJuIChtcyAvIHNlYyB8IDApICsgJ3MnO1xuICByZXR1cm4gbXMgKyAnbXMnO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7VHlwZX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZSkge1xuICBmdW5jdGlvbiBkaXNhYmxlZCgpe31cbiAgZGlzYWJsZWQuZW5hYmxlZCA9IGZhbHNlO1xuXG4gIHZhciBtYXRjaCA9IHNraXBzLnNvbWUoZnVuY3Rpb24ocmUpe1xuICAgIHJldHVybiByZS50ZXN0KG5hbWUpO1xuICB9KTtcblxuICBpZiAobWF0Y2gpIHJldHVybiBkaXNhYmxlZDtcblxuICBtYXRjaCA9IG5hbWVzLnNvbWUoZnVuY3Rpb24ocmUpe1xuICAgIHJldHVybiByZS50ZXN0KG5hbWUpO1xuICB9KTtcblxuICBpZiAoIW1hdGNoKSByZXR1cm4gZGlzYWJsZWQ7XG4gIHZhciBjID0gY29sb3IoKTtcblxuICBmdW5jdGlvbiBjb2xvcmVkKGZtdCkge1xuICAgIGZtdCA9IGNvZXJjZShmbXQpO1xuXG4gICAgdmFyIGN1cnIgPSBuZXcgRGF0ZTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZbbmFtZV0gfHwgY3Vycik7XG4gICAgcHJldltuYW1lXSA9IGN1cnI7XG5cbiAgICBmbXQgPSAnICBcXHUwMDFiWzknICsgYyArICdtJyArIG5hbWUgKyAnICdcbiAgICAgICsgJ1xcdTAwMWJbMycgKyBjICsgJ21cXHUwMDFiWzkwbSdcbiAgICAgICsgZm10ICsgJ1xcdTAwMWJbMycgKyBjICsgJ20nXG4gICAgICArICcgKycgKyBodW1hbml6ZShtcykgKyAnXFx1MDAxYlswbSc7XG5cbiAgICBjb25zb2xlLmVycm9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBmdW5jdGlvbiBwbGFpbihmbXQpIHtcbiAgICBmbXQgPSBjb2VyY2UoZm10KTtcblxuICAgIGZtdCA9IG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKVxuICAgICAgKyAnICcgKyBuYW1lICsgJyAnICsgZm10O1xuICAgIGNvbnNvbGUuZXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIGNvbG9yZWQuZW5hYmxlZCA9IHBsYWluLmVuYWJsZWQgPSB0cnVlO1xuXG4gIHJldHVybiBpc2F0dHkgfHwgcHJvY2Vzcy5lbnYuREVCVUdfQ09MT1JTXG4gICAgPyBjb2xvcmVkXG4gICAgOiBwbGFpbjtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCJcbi8qKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZGVidWc7XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtUeXBlfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lKSB7XG4gIGlmICghZGVidWcuZW5hYmxlZChuYW1lKSkgcmV0dXJuIGZ1bmN0aW9uKCl7fTtcblxuICByZXR1cm4gZnVuY3Rpb24oZm10KXtcbiAgICBmbXQgPSBjb2VyY2UoZm10KTtcblxuICAgIHZhciBjdXJyID0gbmV3IERhdGU7XG4gICAgdmFyIG1zID0gY3VyciAtIChkZWJ1Z1tuYW1lXSB8fCBjdXJyKTtcbiAgICBkZWJ1Z1tuYW1lXSA9IGN1cnI7XG5cbiAgICBmbXQgPSBuYW1lXG4gICAgICArICcgJ1xuICAgICAgKyBmbXRcbiAgICAgICsgJyArJyArIGRlYnVnLmh1bWFuaXplKG1zKTtcblxuICAgIC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4XG4gICAgLy8gd2hlcmUgYGNvbnNvbGUubG9nYCBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICAgIHdpbmRvdy5jb25zb2xlXG4gICAgICAmJiBjb25zb2xlLmxvZ1xuICAgICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgY3VycmVudGx5IGFjdGl2ZSBkZWJ1ZyBtb2RlIG5hbWVzLlxuICovXG5cbmRlYnVnLm5hbWVzID0gW107XG5kZWJ1Zy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWUuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcbiAqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZGVidWcuZW5hYmxlID0gZnVuY3Rpb24obmFtZSkge1xuICB0cnkge1xuICAgIGxvY2FsU3RvcmFnZS5kZWJ1ZyA9IG5hbWU7XG4gIH0gY2F0Y2goZSl7fVxuXG4gIHZhciBzcGxpdCA9IChuYW1lIHx8ICcnKS5zcGxpdCgvW1xccyxdKy8pXG4gICAgLCBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIG5hbWUgPSBzcGxpdFtpXS5yZXBsYWNlKCcqJywgJy4qPycpO1xuICAgIGlmIChuYW1lWzBdID09PSAnLScpIHtcbiAgICAgIGRlYnVnLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lLnN1YnN0cigxKSArICckJykpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGRlYnVnLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lICsgJyQnKSk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZGVidWcuZGlzYWJsZSA9IGZ1bmN0aW9uKCl7XG4gIGRlYnVnLmVuYWJsZSgnJyk7XG59O1xuXG4vKipcbiAqIEh1bWFuaXplIHRoZSBnaXZlbiBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5kZWJ1Zy5odW1hbml6ZSA9IGZ1bmN0aW9uKG1zKSB7XG4gIHZhciBzZWMgPSAxMDAwXG4gICAgLCBtaW4gPSA2MCAqIDEwMDBcbiAgICAsIGhvdXIgPSA2MCAqIG1pbjtcblxuICBpZiAobXMgPj0gaG91cikgcmV0dXJuIChtcyAvIGhvdXIpLnRvRml4ZWQoMSkgKyAnaCc7XG4gIGlmIChtcyA+PSBtaW4pIHJldHVybiAobXMgLyBtaW4pLnRvRml4ZWQoMSkgKyAnbSc7XG4gIGlmIChtcyA+PSBzZWMpIHJldHVybiAobXMgLyBzZWMgfCAwKSArICdzJztcbiAgcmV0dXJuIG1zICsgJ21zJztcbn07XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5kZWJ1Zy5lbmFibGVkID0gZnVuY3Rpb24obmFtZSkge1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gZGVidWcuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZGVidWcuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gZGVidWcubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZGVidWcubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQ29lcmNlIGB2YWxgLlxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuXG4vLyBwZXJzaXN0XG5cbnRyeSB7XG4gIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlKSBkZWJ1Zy5lbmFibGUobG9jYWxTdG9yYWdlLmRlYnVnKTtcbn0gY2F0Y2goZSl7fVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1lcmdlIGRlZmF1bHQgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZXN0XG4gKiBAcGFyYW0ge09iamVjdH0gZGVmYXVsdHNcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cbnZhciBkZWZhdWx0cyA9IGZ1bmN0aW9uIChkZXN0LCBzcmMsIHJlY3Vyc2l2ZSkge1xuICBmb3IgKHZhciBwcm9wIGluIHNyYykge1xuICAgIGlmIChyZWN1cnNpdmUgJiYgZGVzdFtwcm9wXSBpbnN0YW5jZW9mIE9iamVjdCAmJiBzcmNbcHJvcF0gaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgIGRlc3RbcHJvcF0gPSBkZWZhdWx0cyhkZXN0W3Byb3BdLCBzcmNbcHJvcF0sIHRydWUpO1xuICAgIH0gZWxzZSBpZiAoISAocHJvcCBpbiBkZXN0KSkge1xuICAgICAgZGVzdFtwcm9wXSA9IHNyY1twcm9wXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVzdDtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBkZWZhdWx0c2AuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZGVmYXVsdHM7XG4iLCJcbnZhciBqc29uID0gd2luZG93LkpTT04gfHwge307XG52YXIgc3RyaW5naWZ5ID0ganNvbi5zdHJpbmdpZnk7XG52YXIgcGFyc2UgPSBqc29uLnBhcnNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlICYmIHN0cmluZ2lmeVxuICA/IEpTT05cbiAgOiByZXF1aXJlKCdqc29uLWZhbGxiYWNrJyk7XG4iLCIvKlxuICAgIGpzb24yLmpzXG4gICAgMjAxNC0wMi0wNFxuXG4gICAgUHVibGljIERvbWFpbi5cblxuICAgIE5PIFdBUlJBTlRZIEVYUFJFU1NFRCBPUiBJTVBMSUVELiBVU0UgQVQgWU9VUiBPV04gUklTSy5cblxuICAgIFNlZSBodHRwOi8vd3d3LkpTT04ub3JnL2pzLmh0bWxcblxuXG4gICAgVGhpcyBjb2RlIHNob3VsZCBiZSBtaW5pZmllZCBiZWZvcmUgZGVwbG95bWVudC5cbiAgICBTZWUgaHR0cDovL2phdmFzY3JpcHQuY3JvY2tmb3JkLmNvbS9qc21pbi5odG1sXG5cbiAgICBVU0UgWU9VUiBPV04gQ09QWS4gSVQgSVMgRVhUUkVNRUxZIFVOV0lTRSBUTyBMT0FEIENPREUgRlJPTSBTRVJWRVJTIFlPVSBET1xuICAgIE5PVCBDT05UUk9MLlxuXG5cbiAgICBUaGlzIGZpbGUgY3JlYXRlcyBhIGdsb2JhbCBKU09OIG9iamVjdCBjb250YWluaW5nIHR3byBtZXRob2RzOiBzdHJpbmdpZnlcbiAgICBhbmQgcGFyc2UuXG5cbiAgICAgICAgSlNPTi5zdHJpbmdpZnkodmFsdWUsIHJlcGxhY2VyLCBzcGFjZSlcbiAgICAgICAgICAgIHZhbHVlICAgICAgIGFueSBKYXZhU2NyaXB0IHZhbHVlLCB1c3VhbGx5IGFuIG9iamVjdCBvciBhcnJheS5cblxuICAgICAgICAgICAgcmVwbGFjZXIgICAgYW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRoYXQgZGV0ZXJtaW5lcyBob3cgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgYXJlIHN0cmluZ2lmaWVkIGZvciBvYmplY3RzLiBJdCBjYW4gYmUgYVxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gb3IgYW4gYXJyYXkgb2Ygc3RyaW5ncy5cblxuICAgICAgICAgICAgc3BhY2UgICAgICAgYW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRoYXQgc3BlY2lmaWVzIHRoZSBpbmRlbnRhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgb2YgbmVzdGVkIHN0cnVjdHVyZXMuIElmIGl0IGlzIG9taXR0ZWQsIHRoZSB0ZXh0IHdpbGxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlIHBhY2tlZCB3aXRob3V0IGV4dHJhIHdoaXRlc3BhY2UuIElmIGl0IGlzIGEgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXQgd2lsbCBzcGVjaWZ5IHRoZSBudW1iZXIgb2Ygc3BhY2VzIHRvIGluZGVudCBhdCBlYWNoXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXZlbC4gSWYgaXQgaXMgYSBzdHJpbmcgKHN1Y2ggYXMgJ1xcdCcgb3IgJyZuYnNwOycpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXQgY29udGFpbnMgdGhlIGNoYXJhY3RlcnMgdXNlZCB0byBpbmRlbnQgYXQgZWFjaCBsZXZlbC5cblxuICAgICAgICAgICAgVGhpcyBtZXRob2QgcHJvZHVjZXMgYSBKU09OIHRleHQgZnJvbSBhIEphdmFTY3JpcHQgdmFsdWUuXG5cbiAgICAgICAgICAgIFdoZW4gYW4gb2JqZWN0IHZhbHVlIGlzIGZvdW5kLCBpZiB0aGUgb2JqZWN0IGNvbnRhaW5zIGEgdG9KU09OXG4gICAgICAgICAgICBtZXRob2QsIGl0cyB0b0pTT04gbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGFuZCB0aGUgcmVzdWx0IHdpbGwgYmVcbiAgICAgICAgICAgIHN0cmluZ2lmaWVkLiBBIHRvSlNPTiBtZXRob2QgZG9lcyBub3Qgc2VyaWFsaXplOiBpdCByZXR1cm5zIHRoZVxuICAgICAgICAgICAgdmFsdWUgcmVwcmVzZW50ZWQgYnkgdGhlIG5hbWUvdmFsdWUgcGFpciB0aGF0IHNob3VsZCBiZSBzZXJpYWxpemVkLFxuICAgICAgICAgICAgb3IgdW5kZWZpbmVkIGlmIG5vdGhpbmcgc2hvdWxkIGJlIHNlcmlhbGl6ZWQuIFRoZSB0b0pTT04gbWV0aG9kXG4gICAgICAgICAgICB3aWxsIGJlIHBhc3NlZCB0aGUga2V5IGFzc29jaWF0ZWQgd2l0aCB0aGUgdmFsdWUsIGFuZCB0aGlzIHdpbGwgYmVcbiAgICAgICAgICAgIGJvdW5kIHRvIHRoZSB2YWx1ZVxuXG4gICAgICAgICAgICBGb3IgZXhhbXBsZSwgdGhpcyB3b3VsZCBzZXJpYWxpemUgRGF0ZXMgYXMgSVNPIHN0cmluZ3MuXG5cbiAgICAgICAgICAgICAgICBEYXRlLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGYobikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9ybWF0IGludGVnZXJzIHRvIGhhdmUgYXQgbGVhc3QgdHdvIGRpZ2l0cy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuIDogbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFVUQ0Z1bGxZZWFyKCkgICArICctJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ01vbnRoKCkgKyAxKSArICctJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ0RhdGUoKSkgICAgICArICdUJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ0hvdXJzKCkpICAgICArICc6JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ01pbnV0ZXMoKSkgICArICc6JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ1NlY29uZHMoKSkgICArICdaJztcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBZb3UgY2FuIHByb3ZpZGUgYW4gb3B0aW9uYWwgcmVwbGFjZXIgbWV0aG9kLiBJdCB3aWxsIGJlIHBhc3NlZCB0aGVcbiAgICAgICAgICAgIGtleSBhbmQgdmFsdWUgb2YgZWFjaCBtZW1iZXIsIHdpdGggdGhpcyBib3VuZCB0byB0aGUgY29udGFpbmluZ1xuICAgICAgICAgICAgb2JqZWN0LiBUaGUgdmFsdWUgdGhhdCBpcyByZXR1cm5lZCBmcm9tIHlvdXIgbWV0aG9kIHdpbGwgYmVcbiAgICAgICAgICAgIHNlcmlhbGl6ZWQuIElmIHlvdXIgbWV0aG9kIHJldHVybnMgdW5kZWZpbmVkLCB0aGVuIHRoZSBtZW1iZXIgd2lsbFxuICAgICAgICAgICAgYmUgZXhjbHVkZWQgZnJvbSB0aGUgc2VyaWFsaXphdGlvbi5cblxuICAgICAgICAgICAgSWYgdGhlIHJlcGxhY2VyIHBhcmFtZXRlciBpcyBhbiBhcnJheSBvZiBzdHJpbmdzLCB0aGVuIGl0IHdpbGwgYmVcbiAgICAgICAgICAgIHVzZWQgdG8gc2VsZWN0IHRoZSBtZW1iZXJzIHRvIGJlIHNlcmlhbGl6ZWQuIEl0IGZpbHRlcnMgdGhlIHJlc3VsdHNcbiAgICAgICAgICAgIHN1Y2ggdGhhdCBvbmx5IG1lbWJlcnMgd2l0aCBrZXlzIGxpc3RlZCBpbiB0aGUgcmVwbGFjZXIgYXJyYXkgYXJlXG4gICAgICAgICAgICBzdHJpbmdpZmllZC5cblxuICAgICAgICAgICAgVmFsdWVzIHRoYXQgZG8gbm90IGhhdmUgSlNPTiByZXByZXNlbnRhdGlvbnMsIHN1Y2ggYXMgdW5kZWZpbmVkIG9yXG4gICAgICAgICAgICBmdW5jdGlvbnMsIHdpbGwgbm90IGJlIHNlcmlhbGl6ZWQuIFN1Y2ggdmFsdWVzIGluIG9iamVjdHMgd2lsbCBiZVxuICAgICAgICAgICAgZHJvcHBlZDsgaW4gYXJyYXlzIHRoZXkgd2lsbCBiZSByZXBsYWNlZCB3aXRoIG51bGwuIFlvdSBjYW4gdXNlXG4gICAgICAgICAgICBhIHJlcGxhY2VyIGZ1bmN0aW9uIHRvIHJlcGxhY2UgdGhvc2Ugd2l0aCBKU09OIHZhbHVlcy5cbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHVuZGVmaW5lZCkgcmV0dXJucyB1bmRlZmluZWQuXG5cbiAgICAgICAgICAgIFRoZSBvcHRpb25hbCBzcGFjZSBwYXJhbWV0ZXIgcHJvZHVjZXMgYSBzdHJpbmdpZmljYXRpb24gb2YgdGhlXG4gICAgICAgICAgICB2YWx1ZSB0aGF0IGlzIGZpbGxlZCB3aXRoIGxpbmUgYnJlYWtzIGFuZCBpbmRlbnRhdGlvbiB0byBtYWtlIGl0XG4gICAgICAgICAgICBlYXNpZXIgdG8gcmVhZC5cblxuICAgICAgICAgICAgSWYgdGhlIHNwYWNlIHBhcmFtZXRlciBpcyBhIG5vbi1lbXB0eSBzdHJpbmcsIHRoZW4gdGhhdCBzdHJpbmcgd2lsbFxuICAgICAgICAgICAgYmUgdXNlZCBmb3IgaW5kZW50YXRpb24uIElmIHRoZSBzcGFjZSBwYXJhbWV0ZXIgaXMgYSBudW1iZXIsIHRoZW5cbiAgICAgICAgICAgIHRoZSBpbmRlbnRhdGlvbiB3aWxsIGJlIHRoYXQgbWFueSBzcGFjZXMuXG5cbiAgICAgICAgICAgIEV4YW1wbGU6XG5cbiAgICAgICAgICAgIHRleHQgPSBKU09OLnN0cmluZ2lmeShbJ2UnLCB7cGx1cmlidXM6ICd1bnVtJ31dKTtcbiAgICAgICAgICAgIC8vIHRleHQgaXMgJ1tcImVcIix7XCJwbHVyaWJ1c1wiOlwidW51bVwifV0nXG5cblxuICAgICAgICAgICAgdGV4dCA9IEpTT04uc3RyaW5naWZ5KFsnZScsIHtwbHVyaWJ1czogJ3VudW0nfV0sIG51bGwsICdcXHQnKTtcbiAgICAgICAgICAgIC8vIHRleHQgaXMgJ1tcXG5cXHRcImVcIixcXG5cXHR7XFxuXFx0XFx0XCJwbHVyaWJ1c1wiOiBcInVudW1cIlxcblxcdH1cXG5dJ1xuXG4gICAgICAgICAgICB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoW25ldyBEYXRlKCldLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2tleV0gaW5zdGFuY2VvZiBEYXRlID9cbiAgICAgICAgICAgICAgICAgICAgJ0RhdGUoJyArIHRoaXNba2V5XSArICcpJyA6IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyB0ZXh0IGlzICdbXCJEYXRlKC0tLWN1cnJlbnQgdGltZS0tLSlcIl0nXG5cblxuICAgICAgICBKU09OLnBhcnNlKHRleHQsIHJldml2ZXIpXG4gICAgICAgICAgICBUaGlzIG1ldGhvZCBwYXJzZXMgYSBKU09OIHRleHQgdG8gcHJvZHVjZSBhbiBvYmplY3Qgb3IgYXJyYXkuXG4gICAgICAgICAgICBJdCBjYW4gdGhyb3cgYSBTeW50YXhFcnJvciBleGNlcHRpb24uXG5cbiAgICAgICAgICAgIFRoZSBvcHRpb25hbCByZXZpdmVyIHBhcmFtZXRlciBpcyBhIGZ1bmN0aW9uIHRoYXQgY2FuIGZpbHRlciBhbmRcbiAgICAgICAgICAgIHRyYW5zZm9ybSB0aGUgcmVzdWx0cy4gSXQgcmVjZWl2ZXMgZWFjaCBvZiB0aGUga2V5cyBhbmQgdmFsdWVzLFxuICAgICAgICAgICAgYW5kIGl0cyByZXR1cm4gdmFsdWUgaXMgdXNlZCBpbnN0ZWFkIG9mIHRoZSBvcmlnaW5hbCB2YWx1ZS5cbiAgICAgICAgICAgIElmIGl0IHJldHVybnMgd2hhdCBpdCByZWNlaXZlZCwgdGhlbiB0aGUgc3RydWN0dXJlIGlzIG5vdCBtb2RpZmllZC5cbiAgICAgICAgICAgIElmIGl0IHJldHVybnMgdW5kZWZpbmVkIHRoZW4gdGhlIG1lbWJlciBpcyBkZWxldGVkLlxuXG4gICAgICAgICAgICBFeGFtcGxlOlxuXG4gICAgICAgICAgICAvLyBQYXJzZSB0aGUgdGV4dC4gVmFsdWVzIHRoYXQgbG9vayBsaWtlIElTTyBkYXRlIHN0cmluZ3Mgd2lsbFxuICAgICAgICAgICAgLy8gYmUgY29udmVydGVkIHRvIERhdGUgb2JqZWN0cy5cblxuICAgICAgICAgICAgbXlEYXRhID0gSlNPTi5wYXJzZSh0ZXh0LCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBhO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGEgPVxuL14oXFxkezR9KS0oXFxkezJ9KS0oXFxkezJ9KVQoXFxkezJ9KTooXFxkezJ9KTooXFxkezJ9KD86XFwuXFxkKik/KVokLy5leGVjKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQygrYVsxXSwgK2FbMl0gLSAxLCArYVszXSwgK2FbNF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgK2FbNV0sICthWzZdKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG15RGF0YSA9IEpTT04ucGFyc2UoJ1tcIkRhdGUoMDkvMDkvMjAwMSlcIl0nLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBkO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS5zbGljZSgwLCA1KSA9PT0gJ0RhdGUoJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUuc2xpY2UoLTEpID09PSAnKScpIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9IG5ldyBEYXRlKHZhbHVlLnNsaWNlKDUsIC0xKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgVGhpcyBpcyBhIHJlZmVyZW5jZSBpbXBsZW1lbnRhdGlvbi4gWW91IGFyZSBmcmVlIHRvIGNvcHksIG1vZGlmeSwgb3JcbiAgICByZWRpc3RyaWJ1dGUuXG4qL1xuXG4vKmpzbGludCBldmlsOiB0cnVlLCByZWdleHA6IHRydWUgKi9cblxuLyptZW1iZXJzIFwiXCIsIFwiXFxiXCIsIFwiXFx0XCIsIFwiXFxuXCIsIFwiXFxmXCIsIFwiXFxyXCIsIFwiXFxcIlwiLCBKU09OLCBcIlxcXFxcIiwgYXBwbHksXG4gICAgY2FsbCwgY2hhckNvZGVBdCwgZ2V0VVRDRGF0ZSwgZ2V0VVRDRnVsbFllYXIsIGdldFVUQ0hvdXJzLFxuICAgIGdldFVUQ01pbnV0ZXMsIGdldFVUQ01vbnRoLCBnZXRVVENTZWNvbmRzLCBoYXNPd25Qcm9wZXJ0eSwgam9pbixcbiAgICBsYXN0SW5kZXgsIGxlbmd0aCwgcGFyc2UsIHByb3RvdHlwZSwgcHVzaCwgcmVwbGFjZSwgc2xpY2UsIHN0cmluZ2lmeSxcbiAgICB0ZXN0LCB0b0pTT04sIHRvU3RyaW5nLCB2YWx1ZU9mXG4qL1xuXG5cbi8vIENyZWF0ZSBhIEpTT04gb2JqZWN0IG9ubHkgaWYgb25lIGRvZXMgbm90IGFscmVhZHkgZXhpc3QuIFdlIGNyZWF0ZSB0aGVcbi8vIG1ldGhvZHMgaW4gYSBjbG9zdXJlIHRvIGF2b2lkIGNyZWF0aW5nIGdsb2JhbCB2YXJpYWJsZXMuXG5cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEpTT04gPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gZihuKSB7XG4gICAgICAgIC8vIEZvcm1hdCBpbnRlZ2VycyB0byBoYXZlIGF0IGxlYXN0IHR3byBkaWdpdHMuXG4gICAgICAgIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuIDogbjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIERhdGUucHJvdG90eXBlLnRvSlNPTiAhPT0gJ2Z1bmN0aW9uJykge1xuXG4gICAgICAgIERhdGUucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGlzRmluaXRlKHRoaXMudmFsdWVPZigpKVxuICAgICAgICAgICAgICAgID8gdGhpcy5nZXRVVENGdWxsWWVhcigpICAgICArICctJyArXG4gICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENNb250aCgpICsgMSkgKyAnLScgK1xuICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDRGF0ZSgpKSAgICAgICsgJ1QnICtcbiAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ0hvdXJzKCkpICAgICArICc6JyArXG4gICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENNaW51dGVzKCkpICAgKyAnOicgK1xuICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDU2Vjb25kcygpKSAgICsgJ1onXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIFN0cmluZy5wcm90b3R5cGUudG9KU09OICAgICAgPVxuICAgICAgICAgICAgTnVtYmVyLnByb3RvdHlwZS50b0pTT04gID1cbiAgICAgICAgICAgIEJvb2xlYW4ucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCk7XG4gICAgICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBjeCxcbiAgICAgICAgZXNjYXBhYmxlLFxuICAgICAgICBnYXAsXG4gICAgICAgIGluZGVudCxcbiAgICAgICAgbWV0YSxcbiAgICAgICAgcmVwO1xuXG5cbiAgICBmdW5jdGlvbiBxdW90ZShzdHJpbmcpIHtcblxuLy8gSWYgdGhlIHN0cmluZyBjb250YWlucyBubyBjb250cm9sIGNoYXJhY3RlcnMsIG5vIHF1b3RlIGNoYXJhY3RlcnMsIGFuZCBub1xuLy8gYmFja3NsYXNoIGNoYXJhY3RlcnMsIHRoZW4gd2UgY2FuIHNhZmVseSBzbGFwIHNvbWUgcXVvdGVzIGFyb3VuZCBpdC5cbi8vIE90aGVyd2lzZSB3ZSBtdXN0IGFsc28gcmVwbGFjZSB0aGUgb2ZmZW5kaW5nIGNoYXJhY3RlcnMgd2l0aCBzYWZlIGVzY2FwZVxuLy8gc2VxdWVuY2VzLlxuXG4gICAgICAgIGVzY2FwYWJsZS5sYXN0SW5kZXggPSAwO1xuICAgICAgICByZXR1cm4gZXNjYXBhYmxlLnRlc3Qoc3RyaW5nKSA/ICdcIicgKyBzdHJpbmcucmVwbGFjZShlc2NhcGFibGUsIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICB2YXIgYyA9IG1ldGFbYV07XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGMgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgPyBjXG4gICAgICAgICAgICAgICAgOiAnXFxcXHUnICsgKCcwMDAwJyArIGEuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC00KTtcbiAgICAgICAgfSkgKyAnXCInIDogJ1wiJyArIHN0cmluZyArICdcIic7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBzdHIoa2V5LCBob2xkZXIpIHtcblxuLy8gUHJvZHVjZSBhIHN0cmluZyBmcm9tIGhvbGRlcltrZXldLlxuXG4gICAgICAgIHZhciBpLCAgICAgICAgICAvLyBUaGUgbG9vcCBjb3VudGVyLlxuICAgICAgICAgICAgaywgICAgICAgICAgLy8gVGhlIG1lbWJlciBrZXkuXG4gICAgICAgICAgICB2LCAgICAgICAgICAvLyBUaGUgbWVtYmVyIHZhbHVlLlxuICAgICAgICAgICAgbGVuZ3RoLFxuICAgICAgICAgICAgbWluZCA9IGdhcCxcbiAgICAgICAgICAgIHBhcnRpYWwsXG4gICAgICAgICAgICB2YWx1ZSA9IGhvbGRlcltrZXldO1xuXG4vLyBJZiB0aGUgdmFsdWUgaGFzIGEgdG9KU09OIG1ldGhvZCwgY2FsbCBpdCB0byBvYnRhaW4gYSByZXBsYWNlbWVudCB2YWx1ZS5cblxuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiB2YWx1ZS50b0pTT04gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9KU09OKGtleSk7XG4gICAgICAgIH1cblxuLy8gSWYgd2Ugd2VyZSBjYWxsZWQgd2l0aCBhIHJlcGxhY2VyIGZ1bmN0aW9uLCB0aGVuIGNhbGwgdGhlIHJlcGxhY2VyIHRvXG4vLyBvYnRhaW4gYSByZXBsYWNlbWVudCB2YWx1ZS5cblxuICAgICAgICBpZiAodHlwZW9mIHJlcCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFsdWUgPSByZXAuY2FsbChob2xkZXIsIGtleSwgdmFsdWUpO1xuICAgICAgICB9XG5cbi8vIFdoYXQgaGFwcGVucyBuZXh0IGRlcGVuZHMgb24gdGhlIHZhbHVlJ3MgdHlwZS5cblxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgcmV0dXJuIHF1b3RlKHZhbHVlKTtcblxuICAgICAgICBjYXNlICdudW1iZXInOlxuXG4vLyBKU09OIG51bWJlcnMgbXVzdCBiZSBmaW5pdGUuIEVuY29kZSBub24tZmluaXRlIG51bWJlcnMgYXMgbnVsbC5cblxuICAgICAgICAgICAgcmV0dXJuIGlzRmluaXRlKHZhbHVlKSA/IFN0cmluZyh2YWx1ZSkgOiAnbnVsbCc7XG5cbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIGNhc2UgJ251bGwnOlxuXG4vLyBJZiB0aGUgdmFsdWUgaXMgYSBib29sZWFuIG9yIG51bGwsIGNvbnZlcnQgaXQgdG8gYSBzdHJpbmcuIE5vdGU6XG4vLyB0eXBlb2YgbnVsbCBkb2VzIG5vdCBwcm9kdWNlICdudWxsJy4gVGhlIGNhc2UgaXMgaW5jbHVkZWQgaGVyZSBpblxuLy8gdGhlIHJlbW90ZSBjaGFuY2UgdGhhdCB0aGlzIGdldHMgZml4ZWQgc29tZWRheS5cblxuICAgICAgICAgICAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG5cbi8vIElmIHRoZSB0eXBlIGlzICdvYmplY3QnLCB3ZSBtaWdodCBiZSBkZWFsaW5nIHdpdGggYW4gb2JqZWN0IG9yIGFuIGFycmF5IG9yXG4vLyBudWxsLlxuXG4gICAgICAgIGNhc2UgJ29iamVjdCc6XG5cbi8vIER1ZSB0byBhIHNwZWNpZmljYXRpb24gYmx1bmRlciBpbiBFQ01BU2NyaXB0LCB0eXBlb2YgbnVsbCBpcyAnb2JqZWN0Jyxcbi8vIHNvIHdhdGNoIG91dCBmb3IgdGhhdCBjYXNlLlxuXG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdudWxsJztcbiAgICAgICAgICAgIH1cblxuLy8gTWFrZSBhbiBhcnJheSB0byBob2xkIHRoZSBwYXJ0aWFsIHJlc3VsdHMgb2Ygc3RyaW5naWZ5aW5nIHRoaXMgb2JqZWN0IHZhbHVlLlxuXG4gICAgICAgICAgICBnYXAgKz0gaW5kZW50O1xuICAgICAgICAgICAgcGFydGlhbCA9IFtdO1xuXG4vLyBJcyB0aGUgdmFsdWUgYW4gYXJyYXk/XG5cbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KHZhbHVlKSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuXG4vLyBUaGUgdmFsdWUgaXMgYW4gYXJyYXkuIFN0cmluZ2lmeSBldmVyeSBlbGVtZW50LiBVc2UgbnVsbCBhcyBhIHBsYWNlaG9sZGVyXG4vLyBmb3Igbm9uLUpTT04gdmFsdWVzLlxuXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0aWFsW2ldID0gc3RyKGksIHZhbHVlKSB8fCAnbnVsbCc7XG4gICAgICAgICAgICAgICAgfVxuXG4vLyBKb2luIGFsbCBvZiB0aGUgZWxlbWVudHMgdG9nZXRoZXIsIHNlcGFyYXRlZCB3aXRoIGNvbW1hcywgYW5kIHdyYXAgdGhlbSBpblxuLy8gYnJhY2tldHMuXG5cbiAgICAgICAgICAgICAgICB2ID0gcGFydGlhbC5sZW5ndGggPT09IDBcbiAgICAgICAgICAgICAgICAgICAgPyAnW10nXG4gICAgICAgICAgICAgICAgICAgIDogZ2FwXG4gICAgICAgICAgICAgICAgICAgID8gJ1tcXG4nICsgZ2FwICsgcGFydGlhbC5qb2luKCcsXFxuJyArIGdhcCkgKyAnXFxuJyArIG1pbmQgKyAnXSdcbiAgICAgICAgICAgICAgICAgICAgOiAnWycgKyBwYXJ0aWFsLmpvaW4oJywnKSArICddJztcbiAgICAgICAgICAgICAgICBnYXAgPSBtaW5kO1xuICAgICAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgICAgfVxuXG4vLyBJZiB0aGUgcmVwbGFjZXIgaXMgYW4gYXJyYXksIHVzZSBpdCB0byBzZWxlY3QgdGhlIG1lbWJlcnMgdG8gYmUgc3RyaW5naWZpZWQuXG5cbiAgICAgICAgICAgIGlmIChyZXAgJiYgdHlwZW9mIHJlcCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBsZW5ndGggPSByZXAubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlcFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGsgPSByZXBbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gc3RyKGssIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydGlhbC5wdXNoKHF1b3RlKGspICsgKGdhcCA/ICc6ICcgOiAnOicpICsgdik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4vLyBPdGhlcndpc2UsIGl0ZXJhdGUgdGhyb3VnaCBhbGwgb2YgdGhlIGtleXMgaW4gdGhlIG9iamVjdC5cblxuICAgICAgICAgICAgICAgIGZvciAoayBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBrKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdiA9IHN0cihrLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRpYWwucHVzaChxdW90ZShrKSArIChnYXAgPyAnOiAnIDogJzonKSArIHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4vLyBKb2luIGFsbCBvZiB0aGUgbWVtYmVyIHRleHRzIHRvZ2V0aGVyLCBzZXBhcmF0ZWQgd2l0aCBjb21tYXMsXG4vLyBhbmQgd3JhcCB0aGVtIGluIGJyYWNlcy5cblxuICAgICAgICAgICAgdiA9IHBhcnRpYWwubGVuZ3RoID09PSAwXG4gICAgICAgICAgICAgICAgPyAne30nXG4gICAgICAgICAgICAgICAgOiBnYXBcbiAgICAgICAgICAgICAgICA/ICd7XFxuJyArIGdhcCArIHBhcnRpYWwuam9pbignLFxcbicgKyBnYXApICsgJ1xcbicgKyBtaW5kICsgJ30nXG4gICAgICAgICAgICAgICAgOiAneycgKyBwYXJ0aWFsLmpvaW4oJywnKSArICd9JztcbiAgICAgICAgICAgIGdhcCA9IG1pbmQ7XG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfVxuICAgIH1cblxuLy8gSWYgdGhlIEpTT04gb2JqZWN0IGRvZXMgbm90IHlldCBoYXZlIGEgc3RyaW5naWZ5IG1ldGhvZCwgZ2l2ZSBpdCBvbmUuXG5cbiAgICBpZiAodHlwZW9mIEpTT04uc3RyaW5naWZ5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGVzY2FwYWJsZSA9IC9bXFxcXFxcXCJcXHgwMC1cXHgxZlxceDdmLVxceDlmXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2c7XG4gICAgICAgIG1ldGEgPSB7ICAgIC8vIHRhYmxlIG9mIGNoYXJhY3RlciBzdWJzdGl0dXRpb25zXG4gICAgICAgICAgICAnXFxiJzogJ1xcXFxiJyxcbiAgICAgICAgICAgICdcXHQnOiAnXFxcXHQnLFxuICAgICAgICAgICAgJ1xcbic6ICdcXFxcbicsXG4gICAgICAgICAgICAnXFxmJzogJ1xcXFxmJyxcbiAgICAgICAgICAgICdcXHInOiAnXFxcXHInLFxuICAgICAgICAgICAgJ1wiJyA6ICdcXFxcXCInLFxuICAgICAgICAgICAgJ1xcXFwnOiAnXFxcXFxcXFwnXG4gICAgICAgIH07XG4gICAgICAgIEpTT04uc3RyaW5naWZ5ID0gZnVuY3Rpb24gKHZhbHVlLCByZXBsYWNlciwgc3BhY2UpIHtcblxuLy8gVGhlIHN0cmluZ2lmeSBtZXRob2QgdGFrZXMgYSB2YWx1ZSBhbmQgYW4gb3B0aW9uYWwgcmVwbGFjZXIsIGFuZCBhbiBvcHRpb25hbFxuLy8gc3BhY2UgcGFyYW1ldGVyLCBhbmQgcmV0dXJucyBhIEpTT04gdGV4dC4gVGhlIHJlcGxhY2VyIGNhbiBiZSBhIGZ1bmN0aW9uXG4vLyB0aGF0IGNhbiByZXBsYWNlIHZhbHVlcywgb3IgYW4gYXJyYXkgb2Ygc3RyaW5ncyB0aGF0IHdpbGwgc2VsZWN0IHRoZSBrZXlzLlxuLy8gQSBkZWZhdWx0IHJlcGxhY2VyIG1ldGhvZCBjYW4gYmUgcHJvdmlkZWQuIFVzZSBvZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGNhblxuLy8gcHJvZHVjZSB0ZXh0IHRoYXQgaXMgbW9yZSBlYXNpbHkgcmVhZGFibGUuXG5cbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgZ2FwID0gJyc7XG4gICAgICAgICAgICBpbmRlbnQgPSAnJztcblxuLy8gSWYgdGhlIHNwYWNlIHBhcmFtZXRlciBpcyBhIG51bWJlciwgbWFrZSBhbiBpbmRlbnQgc3RyaW5nIGNvbnRhaW5pbmcgdGhhdFxuLy8gbWFueSBzcGFjZXMuXG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3BhY2UgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNwYWNlOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50ICs9ICcgJztcbiAgICAgICAgICAgICAgICB9XG5cbi8vIElmIHRoZSBzcGFjZSBwYXJhbWV0ZXIgaXMgYSBzdHJpbmcsIGl0IHdpbGwgYmUgdXNlZCBhcyB0aGUgaW5kZW50IHN0cmluZy5cblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc3BhY2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaW5kZW50ID0gc3BhY2U7XG4gICAgICAgICAgICB9XG5cbi8vIElmIHRoZXJlIGlzIGEgcmVwbGFjZXIsIGl0IG11c3QgYmUgYSBmdW5jdGlvbiBvciBhbiBhcnJheS5cbi8vIE90aGVyd2lzZSwgdGhyb3cgYW4gZXJyb3IuXG5cbiAgICAgICAgICAgIHJlcCA9IHJlcGxhY2VyO1xuICAgICAgICAgICAgaWYgKHJlcGxhY2VyICYmIHR5cGVvZiByZXBsYWNlciAhPT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAgICAgICAgICAgICAodHlwZW9mIHJlcGxhY2VyICE9PSAnb2JqZWN0JyB8fFxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgcmVwbGFjZXIubGVuZ3RoICE9PSAnbnVtYmVyJykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0pTT04uc3RyaW5naWZ5Jyk7XG4gICAgICAgICAgICB9XG5cbi8vIE1ha2UgYSBmYWtlIHJvb3Qgb2JqZWN0IGNvbnRhaW5pbmcgb3VyIHZhbHVlIHVuZGVyIHRoZSBrZXkgb2YgJycuXG4vLyBSZXR1cm4gdGhlIHJlc3VsdCBvZiBzdHJpbmdpZnlpbmcgdGhlIHZhbHVlLlxuXG4gICAgICAgICAgICByZXR1cm4gc3RyKCcnLCB7Jyc6IHZhbHVlfSk7XG4gICAgICAgIH07XG4gICAgfVxuXG5cbi8vIElmIHRoZSBKU09OIG9iamVjdCBkb2VzIG5vdCB5ZXQgaGF2ZSBhIHBhcnNlIG1ldGhvZCwgZ2l2ZSBpdCBvbmUuXG5cbiAgICBpZiAodHlwZW9mIEpTT04ucGFyc2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY3ggPSAvW1xcdTAwMDBcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZztcbiAgICAgICAgSlNPTi5wYXJzZSA9IGZ1bmN0aW9uICh0ZXh0LCByZXZpdmVyKSB7XG5cbi8vIFRoZSBwYXJzZSBtZXRob2QgdGFrZXMgYSB0ZXh0IGFuZCBhbiBvcHRpb25hbCByZXZpdmVyIGZ1bmN0aW9uLCBhbmQgcmV0dXJuc1xuLy8gYSBKYXZhU2NyaXB0IHZhbHVlIGlmIHRoZSB0ZXh0IGlzIGEgdmFsaWQgSlNPTiB0ZXh0LlxuXG4gICAgICAgICAgICB2YXIgajtcblxuICAgICAgICAgICAgZnVuY3Rpb24gd2Fsayhob2xkZXIsIGtleSkge1xuXG4vLyBUaGUgd2FsayBtZXRob2QgaXMgdXNlZCB0byByZWN1cnNpdmVseSB3YWxrIHRoZSByZXN1bHRpbmcgc3RydWN0dXJlIHNvXG4vLyB0aGF0IG1vZGlmaWNhdGlvbnMgY2FuIGJlIG1hZGUuXG5cbiAgICAgICAgICAgICAgICB2YXIgaywgdiwgdmFsdWUgPSBob2xkZXJba2V5XTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGsgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdiA9IHdhbGsodmFsdWUsIGspO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVba10gPSB2O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB2YWx1ZVtrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldml2ZXIuY2FsbChob2xkZXIsIGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuXG5cbi8vIFBhcnNpbmcgaGFwcGVucyBpbiBmb3VyIHN0YWdlcy4gSW4gdGhlIGZpcnN0IHN0YWdlLCB3ZSByZXBsYWNlIGNlcnRhaW5cbi8vIFVuaWNvZGUgY2hhcmFjdGVycyB3aXRoIGVzY2FwZSBzZXF1ZW5jZXMuIEphdmFTY3JpcHQgaGFuZGxlcyBtYW55IGNoYXJhY3RlcnNcbi8vIGluY29ycmVjdGx5LCBlaXRoZXIgc2lsZW50bHkgZGVsZXRpbmcgdGhlbSwgb3IgdHJlYXRpbmcgdGhlbSBhcyBsaW5lIGVuZGluZ3MuXG5cbiAgICAgICAgICAgIHRleHQgPSBTdHJpbmcodGV4dCk7XG4gICAgICAgICAgICBjeC5sYXN0SW5kZXggPSAwO1xuICAgICAgICAgICAgaWYgKGN4LnRlc3QodGV4dCkpIHtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKGN4LCBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcXFx1JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAoJzAwMDAnICsgYS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4vLyBJbiB0aGUgc2Vjb25kIHN0YWdlLCB3ZSBydW4gdGhlIHRleHQgYWdhaW5zdCByZWd1bGFyIGV4cHJlc3Npb25zIHRoYXQgbG9va1xuLy8gZm9yIG5vbi1KU09OIHBhdHRlcm5zLiBXZSBhcmUgZXNwZWNpYWxseSBjb25jZXJuZWQgd2l0aCAnKCknIGFuZCAnbmV3J1xuLy8gYmVjYXVzZSB0aGV5IGNhbiBjYXVzZSBpbnZvY2F0aW9uLCBhbmQgJz0nIGJlY2F1c2UgaXQgY2FuIGNhdXNlIG11dGF0aW9uLlxuLy8gQnV0IGp1c3QgdG8gYmUgc2FmZSwgd2Ugd2FudCB0byByZWplY3QgYWxsIHVuZXhwZWN0ZWQgZm9ybXMuXG5cbi8vIFdlIHNwbGl0IHRoZSBzZWNvbmQgc3RhZ2UgaW50byA0IHJlZ2V4cCBvcGVyYXRpb25zIGluIG9yZGVyIHRvIHdvcmsgYXJvdW5kXG4vLyBjcmlwcGxpbmcgaW5lZmZpY2llbmNpZXMgaW4gSUUncyBhbmQgU2FmYXJpJ3MgcmVnZXhwIGVuZ2luZXMuIEZpcnN0IHdlXG4vLyByZXBsYWNlIHRoZSBKU09OIGJhY2tzbGFzaCBwYWlycyB3aXRoICdAJyAoYSBub24tSlNPTiBjaGFyYWN0ZXIpLiBTZWNvbmQsIHdlXG4vLyByZXBsYWNlIGFsbCBzaW1wbGUgdmFsdWUgdG9rZW5zIHdpdGggJ10nIGNoYXJhY3RlcnMuIFRoaXJkLCB3ZSBkZWxldGUgYWxsXG4vLyBvcGVuIGJyYWNrZXRzIHRoYXQgZm9sbG93IGEgY29sb24gb3IgY29tbWEgb3IgdGhhdCBiZWdpbiB0aGUgdGV4dC4gRmluYWxseSxcbi8vIHdlIGxvb2sgdG8gc2VlIHRoYXQgdGhlIHJlbWFpbmluZyBjaGFyYWN0ZXJzIGFyZSBvbmx5IHdoaXRlc3BhY2Ugb3IgJ10nIG9yXG4vLyAnLCcgb3IgJzonIG9yICd7JyBvciAnfScuIElmIHRoYXQgaXMgc28sIHRoZW4gdGhlIHRleHQgaXMgc2FmZSBmb3IgZXZhbC5cblxuICAgICAgICAgICAgaWYgKC9eW1xcXSw6e31cXHNdKiQvXG4gICAgICAgICAgICAgICAgICAgIC50ZXN0KHRleHQucmVwbGFjZSgvXFxcXCg/OltcIlxcXFxcXC9iZm5ydF18dVswLTlhLWZBLUZdezR9KS9nLCAnQCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCJbXlwiXFxcXFxcblxccl0qXCJ8dHJ1ZXxmYWxzZXxudWxsfC0/XFxkKyg/OlxcLlxcZCopPyg/OltlRV1bK1xcLV0/XFxkKyk/L2csICddJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oPzpefDp8LCkoPzpcXHMqXFxbKSsvZywgJycpKSkge1xuXG4vLyBJbiB0aGUgdGhpcmQgc3RhZ2Ugd2UgdXNlIHRoZSBldmFsIGZ1bmN0aW9uIHRvIGNvbXBpbGUgdGhlIHRleHQgaW50byBhXG4vLyBKYXZhU2NyaXB0IHN0cnVjdHVyZS4gVGhlICd7JyBvcGVyYXRvciBpcyBzdWJqZWN0IHRvIGEgc3ludGFjdGljIGFtYmlndWl0eVxuLy8gaW4gSmF2YVNjcmlwdDogaXQgY2FuIGJlZ2luIGEgYmxvY2sgb3IgYW4gb2JqZWN0IGxpdGVyYWwuIFdlIHdyYXAgdGhlIHRleHRcbi8vIGluIHBhcmVucyB0byBlbGltaW5hdGUgdGhlIGFtYmlndWl0eS5cblxuICAgICAgICAgICAgICAgIGogPSBldmFsKCcoJyArIHRleHQgKyAnKScpO1xuXG4vLyBJbiB0aGUgb3B0aW9uYWwgZm91cnRoIHN0YWdlLCB3ZSByZWN1cnNpdmVseSB3YWxrIHRoZSBuZXcgc3RydWN0dXJlLCBwYXNzaW5nXG4vLyBlYWNoIG5hbWUvdmFsdWUgcGFpciB0byBhIHJldml2ZXIgZnVuY3Rpb24gZm9yIHBvc3NpYmxlIHRyYW5zZm9ybWF0aW9uLlxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiByZXZpdmVyID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgID8gd2Fsayh7Jyc6IGp9LCAnJylcbiAgICAgICAgICAgICAgICAgICAgOiBqO1xuICAgICAgICAgICAgfVxuXG4vLyBJZiB0aGUgdGV4dCBpcyBub3QgSlNPTiBwYXJzZWFibGUsIHRoZW4gYSBTeW50YXhFcnJvciBpcyB0aHJvd24uXG5cbiAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcignSlNPTi5wYXJzZScpO1xuICAgICAgICB9O1xuICAgIH1cbn0oKSk7XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgcGFyc2UgPSByZXF1aXJlKCd1cmwnKS5wYXJzZTtcbnZhciBjb29raWUgPSByZXF1aXJlKCdjb29raWUnKTtcblxuLyoqXG4gKiBFeHBvc2UgYGRvbWFpbmBcbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBkb21haW47XG5cbi8qKlxuICogRXhwb3NlIGBjb29raWVgIGZvciB0ZXN0aW5nLlxuICovXG5cbmV4cG9ydHMuY29va2llID0gY29va2llO1xuXG4vKipcbiAqIEdldCB0aGUgdG9wIGRvbWFpbi5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gY29uc3RydWN0cyB0aGUgbGV2ZWxzIG9mIGRvbWFpblxuICogYW5kIGF0dGVtcHRzIHRvIHNldCBhIGdsb2JhbCBjb29raWUgb24gZWFjaCBvbmVcbiAqIHdoZW4gaXQgc3VjY2VlZHMgaXQgcmV0dXJucyB0aGUgdG9wIGxldmVsIGRvbWFpbi5cbiAqXG4gKiBUaGUgbWV0aG9kIHJldHVybnMgYW4gZW1wdHkgc3RyaW5nIHdoZW4gdGhlIGhvc3RuYW1lXG4gKiBpcyBhbiBpcCBvciBgbG9jYWxob3N0YC5cbiAqXG4gKiBFeGFtcGxlIGxldmVsczpcbiAqXG4gKiAgICAgIGRvbWFpbi5sZXZlbHMoJ2h0dHA6Ly93d3cuZ29vZ2xlLmNvLnVrJyk7XG4gKiAgICAgIC8vID0+IFtcImNvLnVrXCIsIFwiZ29vZ2xlLmNvLnVrXCIsIFwid3d3Lmdvb2dsZS5jby51a1wiXVxuICogXG4gKiBFeGFtcGxlOlxuICogXG4gKiAgICAgIGRvbWFpbignaHR0cDovL2xvY2FsaG9zdDozMDAwL2JheicpO1xuICogICAgICAvLyA9PiAnJ1xuICogICAgICBkb21haW4oJ2h0dHA6Ly9kZXY6MzAwMC9iYXonKTtcbiAqICAgICAgLy8gPT4gJydcbiAqICAgICAgZG9tYWluKCdodHRwOi8vMTI3LjAuMC4xOjMwMDAvYmF6Jyk7XG4gKiAgICAgIC8vID0+ICcnXG4gKiAgICAgIGRvbWFpbignaHR0cDovL3NlZ21lbnQuaW8vYmF6Jyk7XG4gKiAgICAgIC8vID0+ICdzZWdtZW50LmlvJ1xuICogXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRvbWFpbih1cmwpe1xuICB2YXIgY29va2llID0gZXhwb3J0cy5jb29raWU7XG4gIHZhciBsZXZlbHMgPSBleHBvcnRzLmxldmVscyh1cmwpO1xuXG4gIC8vIExvb2t1cCB0aGUgcmVhbCB0b3AgbGV2ZWwgb25lLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxldmVscy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBjbmFtZSA9ICdfX3RsZF9fJztcbiAgICB2YXIgZG9tYWluID0gbGV2ZWxzW2ldO1xuICAgIHZhciBvcHRzID0geyBkb21haW46ICcuJyArIGRvbWFpbiB9O1xuXG4gICAgY29va2llKGNuYW1lLCAxLCBvcHRzKTtcbiAgICBpZiAoY29va2llKGNuYW1lKSkge1xuICAgICAgY29va2llKGNuYW1lLCBudWxsLCBvcHRzKTtcbiAgICAgIHJldHVybiBkb21haW5cbiAgICB9XG4gIH1cblxuICByZXR1cm4gJyc7XG59O1xuXG4vKipcbiAqIExldmVscyByZXR1cm5zIGFsbCBsZXZlbHMgb2YgdGhlIGdpdmVuIHVybC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZG9tYWluLmxldmVscyA9IGZ1bmN0aW9uKHVybCl7XG4gIHZhciBob3N0ID0gcGFyc2UodXJsKS5ob3N0bmFtZTtcbiAgdmFyIHBhcnRzID0gaG9zdC5zcGxpdCgnLicpO1xuICB2YXIgbGFzdCA9IHBhcnRzW3BhcnRzLmxlbmd0aC0xXTtcbiAgdmFyIGxldmVscyA9IFtdO1xuXG4gIC8vIElwIGFkZHJlc3MuXG4gIGlmICg0ID09IHBhcnRzLmxlbmd0aCAmJiBwYXJzZUludChsYXN0LCAxMCkgPT0gbGFzdCkge1xuICAgIHJldHVybiBsZXZlbHM7XG4gIH1cblxuICAvLyBMb2NhbGhvc3QuXG4gIGlmICgxID49IHBhcnRzLmxlbmd0aCkge1xuICAgIHJldHVybiBsZXZlbHM7XG4gIH1cblxuICAvLyBDcmVhdGUgbGV2ZWxzLlxuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoLTI7IDAgPD0gaTsgLS1pKSB7XG4gICAgbGV2ZWxzLnB1c2gocGFydHMuc2xpY2UoaSkuam9pbignLicpKTtcbiAgfVxuXG4gIHJldHVybiBsZXZlbHM7XG59O1xuIiwiXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgdXJsYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbih1cmwpe1xuICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgYS5ocmVmID0gdXJsO1xuICByZXR1cm4ge1xuICAgIGhyZWY6IGEuaHJlZixcbiAgICBob3N0OiBhLmhvc3QgfHwgbG9jYXRpb24uaG9zdCxcbiAgICBwb3J0OiAoJzAnID09PSBhLnBvcnQgfHwgJycgPT09IGEucG9ydCkgPyBwb3J0KGEucHJvdG9jb2wpIDogYS5wb3J0LFxuICAgIGhhc2g6IGEuaGFzaCxcbiAgICBob3N0bmFtZTogYS5ob3N0bmFtZSB8fCBsb2NhdGlvbi5ob3N0bmFtZSxcbiAgICBwYXRobmFtZTogYS5wYXRobmFtZS5jaGFyQXQoMCkgIT0gJy8nID8gJy8nICsgYS5wYXRobmFtZSA6IGEucGF0aG5hbWUsXG4gICAgcHJvdG9jb2w6ICFhLnByb3RvY29sIHx8ICc6JyA9PSBhLnByb3RvY29sID8gbG9jYXRpb24ucHJvdG9jb2wgOiBhLnByb3RvY29sLFxuICAgIHNlYXJjaDogYS5zZWFyY2gsXG4gICAgcXVlcnk6IGEuc2VhcmNoLnNsaWNlKDEpXG4gIH07XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGB1cmxgIGlzIGFic29sdXRlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHVybCl7XG4gIHJldHVybiAwID09IHVybC5pbmRleE9mKCcvLycpIHx8ICEhfnVybC5pbmRleE9mKCc6Ly8nKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYHVybGAgaXMgcmVsYXRpdmUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5pc1JlbGF0aXZlID0gZnVuY3Rpb24odXJsKXtcbiAgcmV0dXJuICFleHBvcnRzLmlzQWJzb2x1dGUodXJsKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYHVybGAgaXMgY3Jvc3MgZG9tYWluLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuaXNDcm9zc0RvbWFpbiA9IGZ1bmN0aW9uKHVybCl7XG4gIHVybCA9IGV4cG9ydHMucGFyc2UodXJsKTtcbiAgdmFyIGxvY2F0aW9uID0gZXhwb3J0cy5wYXJzZSh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gIHJldHVybiB1cmwuaG9zdG5hbWUgIT09IGxvY2F0aW9uLmhvc3RuYW1lXG4gICAgfHwgdXJsLnBvcnQgIT09IGxvY2F0aW9uLnBvcnRcbiAgICB8fCB1cmwucHJvdG9jb2wgIT09IGxvY2F0aW9uLnByb3RvY29sO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gZGVmYXVsdCBwb3J0IGZvciBgcHJvdG9jb2xgLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gcHJvdG9jb2xcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBwb3J0IChwcm90b2NvbCl7XG4gIHN3aXRjaCAocHJvdG9jb2wpIHtcbiAgICBjYXNlICdodHRwOic6XG4gICAgICByZXR1cm4gODA7XG4gICAgY2FzZSAnaHR0cHM6JzpcbiAgICAgIHJldHVybiA0NDM7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBsb2NhdGlvbi5wb3J0O1xuICB9XG59XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdjb29raWUnKTtcblxuLyoqXG4gKiBTZXQgb3IgZ2V0IGNvb2tpZSBgbmFtZWAgd2l0aCBgdmFsdWVgIGFuZCBgb3B0aW9uc2Agb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgb3B0aW9ucyl7XG4gIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGNhc2UgMzpcbiAgICBjYXNlIDI6XG4gICAgICByZXR1cm4gc2V0KG5hbWUsIHZhbHVlLCBvcHRpb25zKTtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gZ2V0KG5hbWUpO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gYWxsKCk7XG4gIH1cbn07XG5cbi8qKlxuICogU2V0IGNvb2tpZSBgbmFtZWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2V0KG5hbWUsIHZhbHVlLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgc3RyID0gZW5jb2RlKG5hbWUpICsgJz0nICsgZW5jb2RlKHZhbHVlKTtcblxuICBpZiAobnVsbCA9PSB2YWx1ZSkgb3B0aW9ucy5tYXhhZ2UgPSAtMTtcblxuICBpZiAob3B0aW9ucy5tYXhhZ2UpIHtcbiAgICBvcHRpb25zLmV4cGlyZXMgPSBuZXcgRGF0ZSgrbmV3IERhdGUgKyBvcHRpb25zLm1heGFnZSk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5wYXRoKSBzdHIgKz0gJzsgcGF0aD0nICsgb3B0aW9ucy5wYXRoO1xuICBpZiAob3B0aW9ucy5kb21haW4pIHN0ciArPSAnOyBkb21haW49JyArIG9wdGlvbnMuZG9tYWluO1xuICBpZiAob3B0aW9ucy5leHBpcmVzKSBzdHIgKz0gJzsgZXhwaXJlcz0nICsgb3B0aW9ucy5leHBpcmVzLnRvVVRDU3RyaW5nKCk7XG4gIGlmIChvcHRpb25zLnNlY3VyZSkgc3RyICs9ICc7IHNlY3VyZSc7XG5cbiAgZG9jdW1lbnQuY29va2llID0gc3RyO1xufVxuXG4vKipcbiAqIFJldHVybiBhbGwgY29va2llcy5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBhbGwoKSB7XG4gIHZhciBzdHI7XG4gIHRyeSB7XG4gICAgc3RyID0gZG9jdW1lbnQuY29va2llO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayB8fCBlcnIpO1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cbiAgcmV0dXJuIHBhcnNlKHN0cik7XG59XG5cbi8qKlxuICogR2V0IGNvb2tpZSBgbmFtZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGdldChuYW1lKSB7XG4gIHJldHVybiBhbGwoKVtuYW1lXTtcbn1cblxuLyoqXG4gKiBQYXJzZSBjb29raWUgYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHZhciBvYmogPSB7fTtcbiAgdmFyIHBhaXJzID0gc3RyLnNwbGl0KC8gKjsgKi8pO1xuICB2YXIgcGFpcjtcbiAgaWYgKCcnID09IHBhaXJzWzBdKSByZXR1cm4gb2JqO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhaXJzLmxlbmd0aDsgKytpKSB7XG4gICAgcGFpciA9IHBhaXJzW2ldLnNwbGl0KCc9Jyk7XG4gICAgb2JqW2RlY29kZShwYWlyWzBdKV0gPSBkZWNvZGUocGFpclsxXSk7XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBFbmNvZGUuXG4gKi9cblxuZnVuY3Rpb24gZW5jb2RlKHZhbHVlKXtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGRlYnVnKCdlcnJvciBgZW5jb2RlKCVvKWAgLSAlbycsIHZhbHVlLCBlKVxuICB9XG59XG5cbi8qKlxuICogRGVjb2RlLlxuICovXG5cbmZ1bmN0aW9uIGRlY29kZSh2YWx1ZSkge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZGVidWcoJ2Vycm9yIGBkZWNvZGUoJW8pYCAtICVvJywgdmFsdWUsIGUpXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbi8vIFhYWDogSGFja3kgZml4IGZvciBEdW8gbm90IHN1cHBvcnRpbmcgc2NvcGVkIG1vZHVsZXNcbnZhciBlYWNoOyB0cnkgeyBlYWNoID0gcmVxdWlyZSgnQG5kaG91bGUvZWFjaCcpOyB9IGNhdGNoKGUpIHsgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTsgfVxuXG4vKipcbiAqIFJlZHVjZXMgYWxsIHRoZSB2YWx1ZXMgaW4gYSBjb2xsZWN0aW9uIGRvd24gaW50byBhIHNpbmdsZSB2YWx1ZS4gRG9lcyBzbyBieSBpdGVyYXRpbmcgdGhyb3VnaCB0aGVcbiAqIGNvbGxlY3Rpb24gZnJvbSBsZWZ0IHRvIHJpZ2h0LCByZXBlYXRlZGx5IGNhbGxpbmcgYW4gYGl0ZXJhdG9yYCBmdW5jdGlvbiBhbmQgcGFzc2luZyB0byBpdCBmb3VyXG4gKiBhcmd1bWVudHM6IGAoYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbilgLlxuICpcbiAqIFJldHVybnMgdGhlIGZpbmFsIHJldHVybiB2YWx1ZSBvZiB0aGUgYGl0ZXJhdG9yYCBmdW5jdGlvbi5cbiAqXG4gKiBAbmFtZSBmb2xkbFxuICogQGFwaSBwdWJsaWNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdG9yIFRoZSBmdW5jdGlvbiB0byBpbnZva2UgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gYWNjdW11bGF0b3IgVGhlIGluaXRpYWwgYWNjdW11bGF0b3IgdmFsdWUsIHBhc3NlZCB0byB0aGUgZmlyc3QgaW52b2NhdGlvbiBvZiBgaXRlcmF0b3JgLlxuICogQHBhcmFtIHtBcnJheXxPYmplY3R9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHJldHVybiB7Kn0gVGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZmluYWwgY2FsbCB0byBgaXRlcmF0b3JgLlxuICogQGV4YW1wbGVcbiAqIGZvbGRsKGZ1bmN0aW9uKHRvdGFsLCBuKSB7XG4gKiAgIHJldHVybiB0b3RhbCArIG47XG4gKiB9LCAwLCBbMSwgMiwgM10pO1xuICogLy89PiA2XG4gKlxuICogdmFyIHBob25lYm9vayA9IHsgYm9iOiAnNTU1LTExMS0yMzQ1JywgdGltOiAnNjU1LTIyMi02Nzg5Jywgc2hlaWxhOiAnNjU1LTMzMy0xMjk4JyB9O1xuICpcbiAqIGZvbGRsKGZ1bmN0aW9uKHJlc3VsdHMsIHBob25lTnVtYmVyKSB7XG4gKiAgaWYgKHBob25lTnVtYmVyWzBdID09PSAnNicpIHtcbiAqICAgIHJldHVybiByZXN1bHRzLmNvbmNhdChwaG9uZU51bWJlcik7XG4gKiAgfVxuICogIHJldHVybiByZXN1bHRzO1xuICogfSwgW10sIHBob25lYm9vayk7XG4gKiAvLyA9PiBbJzY1NS0yMjItNjc4OScsICc2NTUtMzMzLTEyOTgnXVxuICovXG5cbnZhciBmb2xkbCA9IGZ1bmN0aW9uIGZvbGRsKGl0ZXJhdG9yLCBhY2N1bXVsYXRvciwgY29sbGVjdGlvbikge1xuICBpZiAodHlwZW9mIGl0ZXJhdG9yICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYSBmdW5jdGlvbiBidXQgcmVjZWl2ZWQgYSAnICsgdHlwZW9mIGl0ZXJhdG9yKTtcbiAgfVxuXG4gIGVhY2goZnVuY3Rpb24odmFsLCBpLCBjb2xsZWN0aW9uKSB7XG4gICAgYWNjdW11bGF0b3IgPSBpdGVyYXRvcihhY2N1bXVsYXRvciwgdmFsLCBpLCBjb2xsZWN0aW9uKTtcbiAgfSwgY29sbGVjdGlvbik7XG5cbiAgcmV0dXJuIGFjY3VtdWxhdG9yO1xufTtcblxuLyoqXG4gKiBFeHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZm9sZGw7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG4vLyBYWFg6IEhhY2t5IGZpeCBmb3IgRHVvIG5vdCBzdXBwb3J0aW5nIHNjb3BlZCBtb2R1bGVzXG52YXIga2V5czsgdHJ5IHsga2V5cyA9IHJlcXVpcmUoJ0BuZGhvdWxlL2tleXMnKTsgfSBjYXRjaChlKSB7IGtleXMgPSByZXF1aXJlKCdrZXlzJyk7IH1cblxuLyoqXG4gKiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nIHJlZmVyZW5jZS5cbiAqL1xuXG52YXIgb2JqVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFRlc3RzIGlmIGEgdmFsdWUgaXMgYSBudW1iZXIuXG4gKlxuICogQG5hbWUgaXNOdW1iZXJcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWwgVGhlIHZhbHVlIHRvIHRlc3QuXG4gKiBAcmV0dXJuIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsYCBpcyBhIG51bWJlciwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gKi9cblxuLy8gVE9ETzogTW92ZSB0byBsaWJyYXJ5XG52YXIgaXNOdW1iZXIgPSBmdW5jdGlvbiBpc051bWJlcih2YWwpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuICByZXR1cm4gdHlwZSA9PT0gJ251bWJlcicgfHwgKHR5cGUgPT09ICdvYmplY3QnICYmIG9ialRvU3RyaW5nLmNhbGwodmFsKSA9PT0gJ1tvYmplY3QgTnVtYmVyXScpO1xufTtcblxuLyoqXG4gKiBUZXN0cyBpZiBhIHZhbHVlIGlzIGFuIGFycmF5LlxuICpcbiAqIEBuYW1lIGlzQXJyYXlcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWwgVGhlIHZhbHVlIHRvIHRlc3QuXG4gKiBAcmV0dXJuIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdmFsdWUgaXMgYW4gYXJyYXksIG90aGVyd2lzZSBgZmFsc2VgLlxuICovXG5cbi8vIFRPRE86IE1vdmUgdG8gbGlicmFyeVxudmFyIGlzQXJyYXkgPSB0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJyA/IEFycmF5LmlzQXJyYXkgOiBmdW5jdGlvbiBpc0FycmF5KHZhbCkge1xuICByZXR1cm4gb2JqVG9TdHJpbmcuY2FsbCh2YWwpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxuLyoqXG4gKiBUZXN0cyBpZiBhIHZhbHVlIGlzIGFycmF5LWxpa2UuIEFycmF5LWxpa2UgbWVhbnMgdGhlIHZhbHVlIGlzIG5vdCBhIGZ1bmN0aW9uIGFuZCBoYXMgYSBudW1lcmljXG4gKiBgLmxlbmd0aGAgcHJvcGVydHkuXG4gKlxuICogQG5hbWUgaXNBcnJheUxpa2VcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblxuLy8gVE9ETzogTW92ZSB0byBsaWJyYXJ5XG52YXIgaXNBcnJheUxpa2UgPSBmdW5jdGlvbiBpc0FycmF5TGlrZSh2YWwpIHtcbiAgcmV0dXJuIHZhbCAhPSBudWxsICYmIChpc0FycmF5KHZhbCkgfHwgKHZhbCAhPT0gJ2Z1bmN0aW9uJyAmJiBpc051bWJlcih2YWwubGVuZ3RoKSkpO1xufTtcblxuLyoqXG4gKiBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBgZWFjaGAuIFdvcmtzIG9uIGFycmF5cyBhbmQgYXJyYXktbGlrZSBkYXRhIHN0cnVjdHVyZXMuXG4gKlxuICogQG5hbWUgYXJyYXlFYWNoXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb24odmFsdWUsIGtleSwgY29sbGVjdGlvbil9IGl0ZXJhdG9yIFRoZSBmdW5jdGlvbiB0byBpbnZva2UgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSgtbGlrZSkgc3RydWN0dXJlIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAqL1xuXG52YXIgYXJyYXlFYWNoID0gZnVuY3Rpb24gYXJyYXlFYWNoKGl0ZXJhdG9yLCBhcnJheSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgLy8gQnJlYWsgaXRlcmF0aW9uIGVhcmx5IGlmIGBpdGVyYXRvcmAgcmV0dXJucyBgZmFsc2VgXG4gICAgaWYgKGl0ZXJhdG9yKGFycmF5W2ldLCBpLCBhcnJheSkgPT09IGZhbHNlKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYGVhY2hgLiBXb3JrcyBvbiBvYmplY3RzLlxuICpcbiAqIEBuYW1lIGJhc2VFYWNoXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb24odmFsdWUsIGtleSwgY29sbGVjdGlvbil9IGl0ZXJhdG9yIFRoZSBmdW5jdGlvbiB0byBpbnZva2UgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gKi9cblxudmFyIGJhc2VFYWNoID0gZnVuY3Rpb24gYmFzZUVhY2goaXRlcmF0b3IsIG9iamVjdCkge1xuICB2YXIga3MgPSBrZXlzKG9iamVjdCk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgIC8vIEJyZWFrIGl0ZXJhdGlvbiBlYXJseSBpZiBgaXRlcmF0b3JgIHJldHVybnMgYGZhbHNlYFxuICAgIGlmIChpdGVyYXRvcihvYmplY3Rba3NbaV1dLCBrc1tpXSwgb2JqZWN0KSA9PT0gZmFsc2UpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgYW4gaW5wdXQgY29sbGVjdGlvbiwgaW52b2tpbmcgYW4gYGl0ZXJhdG9yYCBmdW5jdGlvbiBmb3IgZWFjaCBlbGVtZW50IGluIHRoZVxuICogY29sbGVjdGlvbiBhbmQgcGFzc2luZyB0byBpdCB0aHJlZSBhcmd1bWVudHM6IGAodmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKWAuIFRoZSBgaXRlcmF0b3JgXG4gKiBmdW5jdGlvbiBjYW4gZW5kIGl0ZXJhdGlvbiBlYXJseSBieSByZXR1cm5pbmcgYGZhbHNlYC5cbiAqXG4gKiBAbmFtZSBlYWNoXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtGdW5jdGlvbih2YWx1ZSwga2V5LCBjb2xsZWN0aW9uKX0gaXRlcmF0b3IgVGhlIGZ1bmN0aW9uIHRvIGludm9rZSBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gQmVjYXVzZSBgZWFjaGAgaXMgcnVuIG9ubHkgZm9yIHNpZGUgZWZmZWN0cywgYWx3YXlzIHJldHVybnMgYHVuZGVmaW5lZGAuXG4gKiBAZXhhbXBsZVxuICogdmFyIGxvZyA9IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XG4gKlxuICogZWFjaChsb2csIFsnYScsICdiJywgJ2MnXSk7XG4gKiAvLy0+ICdhJywgMCwgWydhJywgJ2InLCAnYyddXG4gKiAvLy0+ICdiJywgMSwgWydhJywgJ2InLCAnYyddXG4gKiAvLy0+ICdjJywgMiwgWydhJywgJ2InLCAnYyddXG4gKiAvLz0+IHVuZGVmaW5lZFxuICpcbiAqIGVhY2gobG9nLCAndGltJyk7XG4gKiAvLy0+ICd0JywgMiwgJ3RpbSdcbiAqIC8vLT4gJ2knLCAxLCAndGltJ1xuICogLy8tPiAnbScsIDAsICd0aW0nXG4gKiAvLz0+IHVuZGVmaW5lZFxuICpcbiAqIC8vIE5vdGU6IEl0ZXJhdGlvbiBvcmRlciBub3QgZ3VhcmFudGVlZCBhY3Jvc3MgZW52aXJvbm1lbnRzXG4gKiBlYWNoKGxvZywgeyBuYW1lOiAndGltJywgb2NjdXBhdGlvbjogJ2VuY2hhbnRlcicgfSk7XG4gKiAvLy0+ICd0aW0nLCAnbmFtZScsIHsgbmFtZTogJ3RpbScsIG9jY3VwYXRpb246ICdlbmNoYW50ZXInIH1cbiAqIC8vLT4gJ2VuY2hhbnRlcicsICdvY2N1cGF0aW9uJywgeyBuYW1lOiAndGltJywgb2NjdXBhdGlvbjogJ2VuY2hhbnRlcicgfVxuICogLy89PiB1bmRlZmluZWRcbiAqL1xuXG52YXIgZWFjaCA9IGZ1bmN0aW9uIGVhY2goaXRlcmF0b3IsIGNvbGxlY3Rpb24pIHtcbiAgcmV0dXJuIChpc0FycmF5TGlrZShjb2xsZWN0aW9uKSA/IGFycmF5RWFjaCA6IGJhc2VFYWNoKS5jYWxsKHRoaXMsIGl0ZXJhdG9yLCBjb2xsZWN0aW9uKTtcbn07XG5cbi8qKlxuICogRXhwb3J0cy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVhY2g7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogY2hhckF0IHJlZmVyZW5jZS5cbiAqL1xuXG52YXIgc3RyQ2hhckF0ID0gU3RyaW5nLnByb3RvdHlwZS5jaGFyQXQ7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY2hhcmFjdGVyIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKiBAcmV0dXJuIHtzdHJpbmd8dW5kZWZpbmVkfVxuICovXG5cbi8vIFRPRE86IE1vdmUgdG8gYSBsaWJyYXJ5XG52YXIgY2hhckF0ID0gZnVuY3Rpb24oc3RyLCBpbmRleCkge1xuICByZXR1cm4gc3RyQ2hhckF0LmNhbGwoc3RyLCBpbmRleCk7XG59O1xuXG4vKipcbiAqIGhhc093blByb3BlcnR5IHJlZmVyZW5jZS5cbiAqL1xuXG52YXIgaG9wID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nIHJlZmVyZW5jZS5cbiAqL1xuXG52YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIGhhc093blByb3BlcnR5LCB3cmFwcGVkIGFzIGEgZnVuY3Rpb24uXG4gKlxuICogQG5hbWUgaGFzXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gY29udGV4dFxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBwcm9wXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5cbi8vIFRPRE86IE1vdmUgdG8gYSBsaWJyYXJ5XG52YXIgaGFzID0gZnVuY3Rpb24gaGFzKGNvbnRleHQsIHByb3ApIHtcbiAgcmV0dXJuIGhvcC5jYWxsKGNvbnRleHQsIHByb3ApO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgYSB2YWx1ZSBpcyBhIHN0cmluZywgb3RoZXJ3aXNlIGZhbHNlLlxuICpcbiAqIEBuYW1lIGlzU3RyaW5nXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5cbi8vIFRPRE86IE1vdmUgdG8gYSBsaWJyYXJ5XG52YXIgaXNTdHJpbmcgPSBmdW5jdGlvbiBpc1N0cmluZyh2YWwpIHtcbiAgcmV0dXJuIHRvU3RyLmNhbGwodmFsKSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiBhIHZhbHVlIGlzIGFycmF5LWxpa2UsIG90aGVyd2lzZSBmYWxzZS4gQXJyYXktbGlrZSBtZWFucyBhXG4gKiB2YWx1ZSBpcyBub3QgbnVsbCwgdW5kZWZpbmVkLCBvciBhIGZ1bmN0aW9uLCBhbmQgaGFzIGEgbnVtZXJpYyBgbGVuZ3RoYFxuICogcHJvcGVydHkuXG4gKlxuICogQG5hbWUgaXNBcnJheUxpa2VcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblxuLy8gVE9ETzogTW92ZSB0byBhIGxpYnJhcnlcbnZhciBpc0FycmF5TGlrZSA9IGZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbCkge1xuICByZXR1cm4gdmFsICE9IG51bGwgJiYgKHR5cGVvZiB2YWwgIT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIHZhbC5sZW5ndGggPT09ICdudW1iZXInKTtcbn07XG5cblxuLyoqXG4gKiBpbmRleEtleXNcbiAqXG4gKiBAbmFtZSBpbmRleEtleXNcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHt9IHRhcmdldFxuICogQHBhcmFtIHt9IHByZWRcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5cbnZhciBpbmRleEtleXMgPSBmdW5jdGlvbiBpbmRleEtleXModGFyZ2V0LCBwcmVkKSB7XG4gIHByZWQgPSBwcmVkIHx8IGhhcztcbiAgdmFyIHJlc3VsdHMgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGFyZ2V0Lmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgaWYgKHByZWQodGFyZ2V0LCBpKSkge1xuICAgICAgcmVzdWx0cy5wdXNoKFN0cmluZyhpKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgYWxsIHRoZSBvd25lZFxuICpcbiAqIEBuYW1lIG9iamVjdEtleXNcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB0YXJnZXRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWQgUHJlZGljYXRlIGZ1bmN0aW9uIHVzZWQgdG8gaW5jbHVkZS9leGNsdWRlIHZhbHVlcyBmcm9tXG4gKiB0aGUgcmVzdWx0aW5nIGFycmF5LlxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxudmFyIG9iamVjdEtleXMgPSBmdW5jdGlvbiBvYmplY3RLZXlzKHRhcmdldCwgcHJlZCkge1xuICBwcmVkID0gcHJlZCB8fCBoYXM7XG4gIHZhciByZXN1bHRzID0gW107XG5cblxuICBmb3IgKHZhciBrZXkgaW4gdGFyZ2V0KSB7XG4gICAgaWYgKHByZWQodGFyZ2V0LCBrZXkpKSB7XG4gICAgICByZXN1bHRzLnB1c2goU3RyaW5nKGtleSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRzO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IGNvbXBvc2VkIG9mIGFsbCBrZXlzIG9uIHRoZSBpbnB1dCBvYmplY3QuIElnbm9yZXMgYW55IG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXMuXG4gKiBNb3JlIHBlcm1pc3NpdmUgdGhhbiB0aGUgbmF0aXZlIGBPYmplY3Qua2V5c2AgZnVuY3Rpb24gKG5vbi1vYmplY3RzIHdpbGwgbm90IHRocm93IGVycm9ycykuXG4gKlxuICogQG5hbWUga2V5c1xuICogQGFwaSBwdWJsaWNcbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgVGhlIHZhbHVlIHRvIHJldHJpZXZlIGtleXMgZnJvbS5cbiAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSBjb250YWluaW5nIGFsbCB0aGUgaW5wdXQgYHNvdXJjZWAncyBrZXlzLlxuICogQGV4YW1wbGVcbiAqIGtleXMoeyBsaWtlczogJ2F2b2NhZG8nLCBoYXRlczogJ3BpbmVhcHBsZScgfSk7XG4gKiAvLz0+IFsnbGlrZXMnLCAncGluZWFwcGxlJ107XG4gKlxuICogLy8gSWdub3JlcyBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzXG4gKiB2YXIgaGFzSGlkZGVuS2V5ID0geyBuYW1lOiAnVGltJyB9O1xuICogT2JqZWN0LmRlZmluZVByb3BlcnR5KGhhc0hpZGRlbktleSwgJ2hpZGRlbicsIHtcbiAqICAgdmFsdWU6ICdpIGFtIG5vdCBlbnVtZXJhYmxlIScsXG4gKiAgIGVudW1lcmFibGU6IGZhbHNlXG4gKiB9KVxuICoga2V5cyhoYXNIaWRkZW5LZXkpO1xuICogLy89PiBbJ25hbWUnXTtcbiAqXG4gKiAvLyBXb3JrcyBvbiBhcnJheXNcbiAqIGtleXMoWydhJywgJ2InLCAnYyddKTtcbiAqIC8vPT4gWycwJywgJzEnLCAnMiddXG4gKlxuICogLy8gU2tpcHMgdW5wb3B1bGF0ZWQgaW5kaWNlcyBpbiBzcGFyc2UgYXJyYXlzXG4gKiB2YXIgYXJyID0gWzFdO1xuICogYXJyWzRdID0gNDtcbiAqIGtleXMoYXJyKTtcbiAqIC8vPT4gWycwJywgJzQnXVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ga2V5cyhzb3VyY2UpIHtcbiAgaWYgKHNvdXJjZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLy8gSUU2LTggY29tcGF0aWJpbGl0eSAoc3RyaW5nKVxuICBpZiAoaXNTdHJpbmcoc291cmNlKSkge1xuICAgIHJldHVybiBpbmRleEtleXMoc291cmNlLCBjaGFyQXQpO1xuICB9XG5cbiAgLy8gSUU2LTggY29tcGF0aWJpbGl0eSAoYXJndW1lbnRzKVxuICBpZiAoaXNBcnJheUxpa2Uoc291cmNlKSkge1xuICAgIHJldHVybiBpbmRleEtleXMoc291cmNlLCBoYXMpO1xuICB9XG5cbiAgcmV0dXJuIG9iamVjdEtleXMoc291cmNlKTtcbn07XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgRW50aXR5ID0gcmVxdWlyZSgnLi9lbnRpdHknKTtcbnZhciBiaW5kID0gcmVxdWlyZSgnYmluZCcpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnYW5hbHl0aWNzOmdyb3VwJyk7XG52YXIgaW5oZXJpdCA9IHJlcXVpcmUoJ2luaGVyaXQnKTtcblxuLyoqXG4gKiBHcm91cCBkZWZhdWx0c1xuICovXG5cbkdyb3VwLmRlZmF1bHRzID0ge1xuICBwZXJzaXN0OiB0cnVlLFxuICBjb29raWU6IHtcbiAgICBrZXk6ICdhanNfZ3JvdXBfaWQnXG4gIH0sXG4gIGxvY2FsU3RvcmFnZToge1xuICAgIGtleTogJ2Fqc19ncm91cF9wcm9wZXJ0aWVzJ1xuICB9XG59O1xuXG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgR3JvdXBgIHdpdGggYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gR3JvdXAob3B0aW9ucykge1xuICB0aGlzLmRlZmF1bHRzID0gR3JvdXAuZGVmYXVsdHM7XG4gIHRoaXMuZGVidWcgPSBkZWJ1ZztcbiAgRW50aXR5LmNhbGwodGhpcywgb3B0aW9ucyk7XG59XG5cblxuLyoqXG4gKiBJbmhlcml0IGBFbnRpdHlgXG4gKi9cblxuaW5oZXJpdChHcm91cCwgRW50aXR5KTtcblxuXG4vKipcbiAqIEV4cG9zZSB0aGUgZ3JvdXAgc2luZ2xldG9uLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gYmluZC5hbGwobmV3IEdyb3VwKCkpO1xuXG5cbi8qKlxuICogRXhwb3NlIHRoZSBgR3JvdXBgIGNvbnN0cnVjdG9yLlxuICovXG5cbm1vZHVsZS5leHBvcnRzLkdyb3VwID0gR3JvdXA7XG4iLCJcbnZhciBjbG9uZSA9IHJlcXVpcmUoJ2Nsb25lJyk7XG52YXIgY29va2llID0gcmVxdWlyZSgnLi9jb29raWUnKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ2FuYWx5dGljczplbnRpdHknKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2RlZmF1bHRzJyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG52YXIgbWVtb3J5ID0gcmVxdWlyZSgnLi9tZW1vcnknKTtcbnZhciBzdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmUnKTtcbnZhciBpc29kYXRlVHJhdmVyc2UgPSByZXF1aXJlKCdpc29kYXRlLXRyYXZlcnNlJyk7XG5cblxuLyoqXG4gKiBFeHBvc2UgYEVudGl0eWBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eTtcblxuXG4vKipcbiAqIEluaXRpYWxpemUgbmV3IGBFbnRpdHlgIHdpdGggYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gRW50aXR5KG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zKG9wdGlvbnMpO1xuICB0aGlzLmluaXRpYWxpemUoKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHBpY2tzIHRoZSBzdG9yYWdlLlxuICpcbiAqIENoZWNrcyB0byBzZWUgaWYgY29va2llcyBjYW4gYmUgc2V0XG4gKiBvdGhlcndpc2UgZmFsbHNiYWNrIHRvIGxvY2FsU3RvcmFnZS5cbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgY29va2llLnNldCgnYWpzOmNvb2tpZXMnLCB0cnVlKTtcblxuICAvLyBjb29raWVzIGFyZSBlbmFibGVkLlxuICBpZiAoY29va2llLmdldCgnYWpzOmNvb2tpZXMnKSkge1xuICAgIGNvb2tpZS5yZW1vdmUoJ2Fqczpjb29raWVzJyk7XG4gICAgdGhpcy5fc3RvcmFnZSA9IGNvb2tpZTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBsb2NhbFN0b3JhZ2UgaXMgZW5hYmxlZC5cbiAgaWYgKHN0b3JlLmVuYWJsZWQpIHtcbiAgICB0aGlzLl9zdG9yYWdlID0gc3RvcmU7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gZmFsbGJhY2sgdG8gbWVtb3J5IHN0b3JhZ2UuXG4gIGRlYnVnKCd3YXJuaW5nIHVzaW5nIG1lbW9yeSBzdG9yZSBib3RoIGNvb2tpZXMgYW5kIGxvY2FsU3RvcmFnZSBhcmUgZGlzYWJsZWQnKTtcbiAgdGhpcy5fc3RvcmFnZSA9IG1lbW9yeTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBzdG9yYWdlLlxuICovXG5cbkVudGl0eS5wcm90b3R5cGUuc3RvcmFnZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fc3RvcmFnZTtcbn07XG5cblxuLyoqXG4gKiBHZXQgb3Igc2V0IHN0b3JhZ2UgYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiAgIEBwcm9wZXJ0eSB7T2JqZWN0fSBjb29raWVcbiAqICAgQHByb3BlcnR5IHtPYmplY3R9IGxvY2FsU3RvcmFnZVxuICogICBAcHJvcGVydHkge0Jvb2xlYW59IHBlcnNpc3QgKGRlZmF1bHQ6IGB0cnVlYClcbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLm9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdGhpcy5fb3B0aW9ucztcbiAgdGhpcy5fb3B0aW9ucyA9IGRlZmF1bHRzKG9wdGlvbnMgfHwge30sIHRoaXMuZGVmYXVsdHMgfHwge30pO1xufTtcblxuXG4vKipcbiAqIEdldCBvciBzZXQgdGhlIGVudGl0eSdzIGBpZGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gKi9cblxuRW50aXR5LnByb3RvdHlwZS5pZCA9IGZ1bmN0aW9uKGlkKSB7XG4gIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGNhc2UgMDogcmV0dXJuIHRoaXMuX2dldElkKCk7XG4gICAgY2FzZSAxOiByZXR1cm4gdGhpcy5fc2V0SWQoaWQpO1xuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBObyBkZWZhdWx0IGNhc2VcbiAgfVxufTtcblxuXG4vKipcbiAqIEdldCB0aGUgZW50aXR5J3MgaWQuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbkVudGl0eS5wcm90b3R5cGUuX2dldElkID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXQgPSB0aGlzLl9vcHRpb25zLnBlcnNpc3RcbiAgICA/IHRoaXMuc3RvcmFnZSgpLmdldCh0aGlzLl9vcHRpb25zLmNvb2tpZS5rZXkpXG4gICAgOiB0aGlzLl9pZDtcbiAgcmV0dXJuIHJldCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHJldDtcbn07XG5cblxuLyoqXG4gKiBTZXQgdGhlIGVudGl0eSdzIGBpZGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gKi9cblxuRW50aXR5LnByb3RvdHlwZS5fc2V0SWQgPSBmdW5jdGlvbihpZCkge1xuICBpZiAodGhpcy5fb3B0aW9ucy5wZXJzaXN0KSB7XG4gICAgdGhpcy5zdG9yYWdlKCkuc2V0KHRoaXMuX29wdGlvbnMuY29va2llLmtleSwgaWQpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX2lkID0gaWQ7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBHZXQgb3Igc2V0IHRoZSBlbnRpdHkncyBgdHJhaXRzYC5cbiAqXG4gKiBCQUNLV0FSRFMgQ09NUEFUSUJJTElUWTogYWxpYXNlZCB0byBgcHJvcGVydGllc2BcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdHJhaXRzXG4gKi9cblxuRW50aXR5LnByb3RvdHlwZS5wcm9wZXJ0aWVzID0gRW50aXR5LnByb3RvdHlwZS50cmFpdHMgPSBmdW5jdGlvbih0cmFpdHMpIHtcbiAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgY2FzZSAwOiByZXR1cm4gdGhpcy5fZ2V0VHJhaXRzKCk7XG4gICAgY2FzZSAxOiByZXR1cm4gdGhpcy5fc2V0VHJhaXRzKHRyYWl0cyk7XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIE5vIGRlZmF1bHQgY2FzZVxuICB9XG59O1xuXG5cbi8qKlxuICogR2V0IHRoZSBlbnRpdHkncyB0cmFpdHMuIEFsd2F5cyBjb252ZXJ0IElTTyBkYXRlIHN0cmluZ3MgaW50byByZWFsIGRhdGVzLFxuICogc2luY2UgdGhleSBhcmVuJ3QgcGFyc2VkIGJhY2sgZnJvbSBsb2NhbCBzdG9yYWdlLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLl9nZXRUcmFpdHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJldCA9IHRoaXMuX29wdGlvbnMucGVyc2lzdCA/IHN0b3JlLmdldCh0aGlzLl9vcHRpb25zLmxvY2FsU3RvcmFnZS5rZXkpIDogdGhpcy5fdHJhaXRzO1xuICByZXR1cm4gcmV0ID8gaXNvZGF0ZVRyYXZlcnNlKGNsb25lKHJldCkpIDoge307XG59O1xuXG5cbi8qKlxuICogU2V0IHRoZSBlbnRpdHkncyBgdHJhaXRzYC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdHJhaXRzXG4gKi9cblxuRW50aXR5LnByb3RvdHlwZS5fc2V0VHJhaXRzID0gZnVuY3Rpb24odHJhaXRzKSB7XG4gIHRyYWl0cyA9IHRyYWl0cyB8fCB7fTtcbiAgaWYgKHRoaXMuX29wdGlvbnMucGVyc2lzdCkge1xuICAgIHN0b3JlLnNldCh0aGlzLl9vcHRpb25zLmxvY2FsU3RvcmFnZS5rZXksIHRyYWl0cyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fdHJhaXRzID0gdHJhaXRzO1xuICB9XG59O1xuXG5cbi8qKlxuICogSWRlbnRpZnkgdGhlIGVudGl0eSB3aXRoIGFuIGBpZGAgYW5kIGB0cmFpdHNgLiBJZiB3ZSBpdCdzIHRoZSBzYW1lIGVudGl0eSxcbiAqIGV4dGVuZCB0aGUgZXhpc3RpbmcgYHRyYWl0c2AgaW5zdGVhZCBvZiBvdmVyd3JpdGluZy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqIEBwYXJhbSB7T2JqZWN0fSB0cmFpdHNcbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLmlkZW50aWZ5ID0gZnVuY3Rpb24oaWQsIHRyYWl0cykge1xuICB0cmFpdHMgPSB0cmFpdHMgfHwge307XG4gIHZhciBjdXJyZW50ID0gdGhpcy5pZCgpO1xuICBpZiAoY3VycmVudCA9PT0gbnVsbCB8fCBjdXJyZW50ID09PSBpZCkgdHJhaXRzID0gZXh0ZW5kKHRoaXMudHJhaXRzKCksIHRyYWl0cyk7XG4gIGlmIChpZCkgdGhpcy5pZChpZCk7XG4gIHRoaXMuZGVidWcoJ2lkZW50aWZ5ICVvLCAlbycsIGlkLCB0cmFpdHMpO1xuICB0aGlzLnRyYWl0cyh0cmFpdHMpO1xuICB0aGlzLnNhdmUoKTtcbn07XG5cblxuLyoqXG4gKiBTYXZlIHRoZSBlbnRpdHkgdG8gbG9jYWwgc3RvcmFnZSBhbmQgdGhlIGNvb2tpZS5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbkVudGl0eS5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuX29wdGlvbnMucGVyc2lzdCkgcmV0dXJuIGZhbHNlO1xuICBjb29raWUuc2V0KHRoaXMuX29wdGlvbnMuY29va2llLmtleSwgdGhpcy5pZCgpKTtcbiAgc3RvcmUuc2V0KHRoaXMuX29wdGlvbnMubG9jYWxTdG9yYWdlLmtleSwgdGhpcy50cmFpdHMoKSk7XG4gIHJldHVybiB0cnVlO1xufTtcblxuXG4vKipcbiAqIExvZyB0aGUgZW50aXR5IG91dCwgcmVzZXRpbmcgYGlkYCBhbmQgYHRyYWl0c2AgdG8gZGVmYXVsdHMuXG4gKi9cblxuRW50aXR5LnByb3RvdHlwZS5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5pZChudWxsKTtcbiAgdGhpcy50cmFpdHMoe30pO1xuICBjb29raWUucmVtb3ZlKHRoaXMuX29wdGlvbnMuY29va2llLmtleSk7XG4gIHN0b3JlLnJlbW92ZSh0aGlzLl9vcHRpb25zLmxvY2FsU3RvcmFnZS5rZXkpO1xufTtcblxuXG4vKipcbiAqIFJlc2V0IGFsbCBlbnRpdHkgc3RhdGUsIGxvZ2dpbmcgb3V0IGFuZCByZXR1cm5pbmcgb3B0aW9ucyB0byBkZWZhdWx0cy5cbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubG9nb3V0KCk7XG4gIHRoaXMub3B0aW9ucyh7fSk7XG59O1xuXG5cbi8qKlxuICogTG9hZCBzYXZlZCBlbnRpdHkgYGlkYCBvciBgdHJhaXRzYCBmcm9tIHN0b3JhZ2UuXG4gKi9cblxuRW50aXR5LnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuaWQoY29va2llLmdldCh0aGlzLl9vcHRpb25zLmNvb2tpZS5rZXkpKTtcbiAgdGhpcy50cmFpdHMoc3RvcmUuZ2V0KHRoaXMuX29wdGlvbnMubG9jYWxTdG9yYWdlLmtleSkpO1xufTtcblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGV4dGVuZCAob2JqZWN0KSB7XG4gICAgLy8gVGFrZXMgYW4gdW5saW1pdGVkIG51bWJlciBvZiBleHRlbmRlcnMuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgLy8gRm9yIGVhY2ggZXh0ZW5kZXIsIGNvcHkgdGhlaXIgcHJvcGVydGllcyBvbiBvdXIgb2JqZWN0LlxuICAgIGZvciAodmFyIGkgPSAwLCBzb3VyY2U7IHNvdXJjZSA9IGFyZ3NbaV07IGkrKykge1xuICAgICAgICBpZiAoIXNvdXJjZSkgY29udGludWU7XG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgb2JqZWN0W3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb2JqZWN0O1xufTsiLCIvKiBlc2xpbnQgY29uc2lzdGVudC1yZXR1cm46MSAqL1xuXG4vKipcbiAqIE1vZHVsZSBEZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGJpbmQgPSByZXF1aXJlKCdiaW5kJyk7XG52YXIgY2xvbmUgPSByZXF1aXJlKCdjbG9uZScpO1xuXG4vKipcbiAqIEhPUC5cbiAqL1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBFeHBvc2UgYE1lbW9yeWBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJpbmQuYWxsKG5ldyBNZW1vcnkoKSk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBgTWVtb3J5YCBzdG9yZVxuICovXG5cbmZ1bmN0aW9uIE1lbW9yeSgpe1xuICB0aGlzLnN0b3JlID0ge307XG59XG5cbi8qKlxuICogU2V0IGEgYGtleWAgYW5kIGB2YWx1ZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuTWVtb3J5LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKXtcbiAgdGhpcy5zdG9yZVtrZXldID0gY2xvbmUodmFsdWUpO1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogR2V0IGEgYGtleWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICovXG5cbk1lbW9yeS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oa2V5KXtcbiAgaWYgKCFoYXMuY2FsbCh0aGlzLnN0b3JlLCBrZXkpKSByZXR1cm47XG4gIHJldHVybiBjbG9uZSh0aGlzLnN0b3JlW2tleV0pO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYSBga2V5YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbk1lbW9yeS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oa2V5KXtcbiAgZGVsZXRlIHRoaXMuc3RvcmVba2V5XTtcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGJpbmQgPSByZXF1aXJlKCdiaW5kJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCdkZWZhdWx0cycpO1xudmFyIHN0b3JlID0gcmVxdWlyZSgnc3RvcmUuanMnKTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBTdG9yZWAgd2l0aCBgb3B0aW9uc2AuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBTdG9yZShvcHRpb25zKSB7XG4gIHRoaXMub3B0aW9ucyhvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGBvcHRpb25zYCBmb3IgdGhlIHN0b3JlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiAgIEBmaWVsZCB7Qm9vbGVhbn0gZW5hYmxlZCAodHJ1ZSlcbiAqL1xuXG5TdG9yZS5wcm90b3R5cGUub3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB0aGlzLl9vcHRpb25zO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBkZWZhdWx0cyhvcHRpb25zLCB7IGVuYWJsZWQ6IHRydWUgfSk7XG5cbiAgdGhpcy5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkICYmIHN0b3JlLmVuYWJsZWQ7XG4gIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xufTtcblxuXG4vKipcbiAqIFNldCBhIGBrZXlgIGFuZCBgdmFsdWVgIGluIGxvY2FsIHN0b3JhZ2UuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlXG4gKi9cblxuU3RvcmUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgaWYgKCF0aGlzLmVuYWJsZWQpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHN0b3JlLnNldChrZXksIHZhbHVlKTtcbn07XG5cblxuLyoqXG4gKiBHZXQgYSB2YWx1ZSBmcm9tIGxvY2FsIHN0b3JhZ2UgYnkgYGtleWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cblN0b3JlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXkpIHtcbiAgaWYgKCF0aGlzLmVuYWJsZWQpIHJldHVybiBudWxsO1xuICByZXR1cm4gc3RvcmUuZ2V0KGtleSk7XG59O1xuXG5cbi8qKlxuICogUmVtb3ZlIGEgdmFsdWUgZnJvbSBsb2NhbCBzdG9yYWdlIGJ5IGBrZXlgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqL1xuXG5TdG9yZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oa2V5KSB7XG4gIGlmICghdGhpcy5lbmFibGVkKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KTtcbn07XG5cblxuLyoqXG4gKiBFeHBvc2UgdGhlIHN0b3JlIHNpbmdsZXRvbi5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJpbmQuYWxsKG5ldyBTdG9yZSgpKTtcblxuXG4vKipcbiAqIEV4cG9zZSB0aGUgYFN0b3JlYCBjb25zdHJ1Y3Rvci5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cy5TdG9yZSA9IFN0b3JlO1xuIiwidmFyIGpzb24gICAgICAgICAgICAgPSByZXF1aXJlKCdqc29uJylcbiAgLCBzdG9yZSAgICAgICAgICAgID0ge31cbiAgLCB3aW4gICAgICAgICAgICAgID0gd2luZG93XG5cdCxcdGRvYyAgICAgICAgICAgICAgPSB3aW4uZG9jdW1lbnRcblx0LFx0bG9jYWxTdG9yYWdlTmFtZSA9ICdsb2NhbFN0b3JhZ2UnXG5cdCxcdG5hbWVzcGFjZSAgICAgICAgPSAnX19zdG9yZWpzX18nXG5cdCxcdHN0b3JhZ2U7XG5cbnN0b3JlLmRpc2FibGVkID0gZmFsc2VcbnN0b3JlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHt9XG5zdG9yZS5nZXQgPSBmdW5jdGlvbihrZXkpIHt9XG5zdG9yZS5yZW1vdmUgPSBmdW5jdGlvbihrZXkpIHt9XG5zdG9yZS5jbGVhciA9IGZ1bmN0aW9uKCkge31cbnN0b3JlLnRyYW5zYWN0ID0gZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsLCB0cmFuc2FjdGlvbkZuKSB7XG5cdHZhciB2YWwgPSBzdG9yZS5nZXQoa2V5KVxuXHRpZiAodHJhbnNhY3Rpb25GbiA9PSBudWxsKSB7XG5cdFx0dHJhbnNhY3Rpb25GbiA9IGRlZmF1bHRWYWxcblx0XHRkZWZhdWx0VmFsID0gbnVsbFxuXHR9XG5cdGlmICh0eXBlb2YgdmFsID09ICd1bmRlZmluZWQnKSB7IHZhbCA9IGRlZmF1bHRWYWwgfHwge30gfVxuXHR0cmFuc2FjdGlvbkZuKHZhbClcblx0c3RvcmUuc2V0KGtleSwgdmFsKVxufVxuc3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oKSB7fVxuXG5zdG9yZS5zZXJpYWxpemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRyZXR1cm4ganNvbi5zdHJpbmdpZnkodmFsdWUpXG59XG5zdG9yZS5kZXNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHsgcmV0dXJuIHVuZGVmaW5lZCB9XG5cdHRyeSB7IHJldHVybiBqc29uLnBhcnNlKHZhbHVlKSB9XG5cdGNhdGNoKGUpIHsgcmV0dXJuIHZhbHVlIHx8IHVuZGVmaW5lZCB9XG59XG5cbi8vIEZ1bmN0aW9ucyB0byBlbmNhcHN1bGF0ZSBxdWVzdGlvbmFibGUgRmlyZUZveCAzLjYuMTMgYmVoYXZpb3Jcbi8vIHdoZW4gYWJvdXQuY29uZmlnOjpkb20uc3RvcmFnZS5lbmFibGVkID09PSBmYWxzZVxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzI2lzc3VlLzEzXG5mdW5jdGlvbiBpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSB7XG5cdHRyeSB7IHJldHVybiAobG9jYWxTdG9yYWdlTmFtZSBpbiB3aW4gJiYgd2luW2xvY2FsU3RvcmFnZU5hbWVdKSB9XG5cdGNhdGNoKGVycikgeyByZXR1cm4gZmFsc2UgfVxufVxuXG5pZiAoaXNMb2NhbFN0b3JhZ2VOYW1lU3VwcG9ydGVkKCkpIHtcblx0c3RvcmFnZSA9IHdpbltsb2NhbFN0b3JhZ2VOYW1lXVxuXHRzdG9yZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuXHRcdGlmICh2YWwgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gc3RvcmUucmVtb3ZlKGtleSkgfVxuXHRcdHN0b3JhZ2Uuc2V0SXRlbShrZXksIHN0b3JlLnNlcmlhbGl6ZSh2YWwpKVxuXHRcdHJldHVybiB2YWxcblx0fVxuXHRzdG9yZS5nZXQgPSBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHN0b3JlLmRlc2VyaWFsaXplKHN0b3JhZ2UuZ2V0SXRlbShrZXkpKSB9XG5cdHN0b3JlLnJlbW92ZSA9IGZ1bmN0aW9uKGtleSkgeyBzdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KSB9XG5cdHN0b3JlLmNsZWFyID0gZnVuY3Rpb24oKSB7IHN0b3JhZ2UuY2xlYXIoKSB9XG5cdHN0b3JlLmdldEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciByZXQgPSB7fVxuXHRcdGZvciAodmFyIGk9MDsgaTxzdG9yYWdlLmxlbmd0aDsgKytpKSB7XG5cdFx0XHR2YXIga2V5ID0gc3RvcmFnZS5rZXkoaSlcblx0XHRcdHJldFtrZXldID0gc3RvcmUuZ2V0KGtleSlcblx0XHR9XG5cdFx0cmV0dXJuIHJldFxuXHR9XG59IGVsc2UgaWYgKGRvYy5kb2N1bWVudEVsZW1lbnQuYWRkQmVoYXZpb3IpIHtcblx0dmFyIHN0b3JhZ2VPd25lcixcblx0XHRzdG9yYWdlQ29udGFpbmVyXG5cdC8vIFNpbmNlICN1c2VyRGF0YSBzdG9yYWdlIGFwcGxpZXMgb25seSB0byBzcGVjaWZpYyBwYXRocywgd2UgbmVlZCB0b1xuXHQvLyBzb21laG93IGxpbmsgb3VyIGRhdGEgdG8gYSBzcGVjaWZpYyBwYXRoLiAgV2UgY2hvb3NlIC9mYXZpY29uLmljb1xuXHQvLyBhcyBhIHByZXR0eSBzYWZlIG9wdGlvbiwgc2luY2UgYWxsIGJyb3dzZXJzIGFscmVhZHkgbWFrZSBhIHJlcXVlc3QgdG9cblx0Ly8gdGhpcyBVUkwgYW55d2F5IGFuZCBiZWluZyBhIDQwNCB3aWxsIG5vdCBodXJ0IHVzIGhlcmUuICBXZSB3cmFwIGFuXG5cdC8vIGlmcmFtZSBwb2ludGluZyB0byB0aGUgZmF2aWNvbiBpbiBhbiBBY3RpdmVYT2JqZWN0KGh0bWxmaWxlKSBvYmplY3Rcblx0Ly8gKHNlZTogaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2FhNzUyNTc0KHY9VlMuODUpLmFzcHgpXG5cdC8vIHNpbmNlIHRoZSBpZnJhbWUgYWNjZXNzIHJ1bGVzIGFwcGVhciB0byBhbGxvdyBkaXJlY3QgYWNjZXNzIGFuZFxuXHQvLyBtYW5pcHVsYXRpb24gb2YgdGhlIGRvY3VtZW50IGVsZW1lbnQsIGV2ZW4gZm9yIGEgNDA0IHBhZ2UuICBUaGlzXG5cdC8vIGRvY3VtZW50IGNhbiBiZSB1c2VkIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgZG9jdW1lbnQgKHdoaWNoIHdvdWxkXG5cdC8vIGhhdmUgYmVlbiBsaW1pdGVkIHRvIHRoZSBjdXJyZW50IHBhdGgpIHRvIHBlcmZvcm0gI3VzZXJEYXRhIHN0b3JhZ2UuXG5cdHRyeSB7XG5cdFx0c3RvcmFnZUNvbnRhaW5lciA9IG5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpXG5cdFx0c3RvcmFnZUNvbnRhaW5lci5vcGVuKClcblx0XHRzdG9yYWdlQ29udGFpbmVyLndyaXRlKCc8cycgKyAnY3JpcHQ+ZG9jdW1lbnQudz13aW5kb3c8L3MnICsgJ2NyaXB0PjxpZnJhbWUgc3JjPVwiL2Zhdmljb24uaWNvXCI+PC9pZnJhbWU+Jylcblx0XHRzdG9yYWdlQ29udGFpbmVyLmNsb3NlKClcblx0XHRzdG9yYWdlT3duZXIgPSBzdG9yYWdlQ29udGFpbmVyLncuZnJhbWVzWzBdLmRvY3VtZW50XG5cdFx0c3RvcmFnZSA9IHN0b3JhZ2VPd25lci5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXHR9IGNhdGNoKGUpIHtcblx0XHQvLyBzb21laG93IEFjdGl2ZVhPYmplY3QgaW5zdGFudGlhdGlvbiBmYWlsZWQgKHBlcmhhcHMgc29tZSBzcGVjaWFsXG5cdFx0Ly8gc2VjdXJpdHkgc2V0dGluZ3Mgb3Igb3RoZXJ3c2UpLCBmYWxsIGJhY2sgdG8gcGVyLXBhdGggc3RvcmFnZVxuXHRcdHN0b3JhZ2UgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jylcblx0XHRzdG9yYWdlT3duZXIgPSBkb2MuYm9keVxuXHR9XG5cdGZ1bmN0aW9uIHdpdGhJRVN0b3JhZ2Uoc3RvcmVGdW5jdGlvbikge1xuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKVxuXHRcdFx0YXJncy51bnNoaWZ0KHN0b3JhZ2UpXG5cdFx0XHQvLyBTZWUgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTMxMDgxKHY9VlMuODUpLmFzcHhcblx0XHRcdC8vIGFuZCBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzE0MjQodj1WUy44NSkuYXNweFxuXHRcdFx0c3RvcmFnZU93bmVyLmFwcGVuZENoaWxkKHN0b3JhZ2UpXG5cdFx0XHRzdG9yYWdlLmFkZEJlaGF2aW9yKCcjZGVmYXVsdCN1c2VyRGF0YScpXG5cdFx0XHRzdG9yYWdlLmxvYWQobG9jYWxTdG9yYWdlTmFtZSlcblx0XHRcdHZhciByZXN1bHQgPSBzdG9yZUZ1bmN0aW9uLmFwcGx5KHN0b3JlLCBhcmdzKVxuXHRcdFx0c3RvcmFnZU93bmVyLnJlbW92ZUNoaWxkKHN0b3JhZ2UpXG5cdFx0XHRyZXR1cm4gcmVzdWx0XG5cdFx0fVxuXHR9XG5cblx0Ly8gSW4gSUU3LCBrZXlzIG1heSBub3QgY29udGFpbiBzcGVjaWFsIGNoYXJzLiBTZWUgYWxsIG9mIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzQwXG5cdHZhciBmb3JiaWRkZW5DaGFyc1JlZ2V4ID0gbmV3IFJlZ0V4cChcIlshXFxcIiMkJSYnKCkqKywvXFxcXFxcXFw6Ozw9Pj9AW1xcXFxdXmB7fH1+XVwiLCBcImdcIilcblx0ZnVuY3Rpb24gaWVLZXlGaXgoa2V5KSB7XG5cdFx0cmV0dXJuIGtleS5yZXBsYWNlKGZvcmJpZGRlbkNoYXJzUmVnZXgsICdfX18nKVxuXHR9XG5cdHN0b3JlLnNldCA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwga2V5LCB2YWwpIHtcblx0XHRrZXkgPSBpZUtleUZpeChrZXkpXG5cdFx0aWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KSB9XG5cdFx0c3RvcmFnZS5zZXRBdHRyaWJ1dGUoa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRzdG9yYWdlLnNhdmUobG9jYWxTdG9yYWdlTmFtZSlcblx0XHRyZXR1cm4gdmFsXG5cdH0pXG5cdHN0b3JlLmdldCA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwga2V5KSB7XG5cdFx0a2V5ID0gaWVLZXlGaXgoa2V5KVxuXHRcdHJldHVybiBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEF0dHJpYnV0ZShrZXkpKVxuXHR9KVxuXHRzdG9yZS5yZW1vdmUgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UsIGtleSkge1xuXHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRzdG9yYWdlLnJlbW92ZUF0dHJpYnV0ZShrZXkpXG5cdFx0c3RvcmFnZS5zYXZlKGxvY2FsU3RvcmFnZU5hbWUpXG5cdH0pXG5cdHN0b3JlLmNsZWFyID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlKSB7XG5cdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0c3RvcmFnZS5sb2FkKGxvY2FsU3RvcmFnZU5hbWUpXG5cdFx0Zm9yICh2YXIgaT0wLCBhdHRyOyBhdHRyPWF0dHJpYnV0ZXNbaV07IGkrKykge1xuXHRcdFx0c3RvcmFnZS5yZW1vdmVBdHRyaWJ1dGUoYXR0ci5uYW1lKVxuXHRcdH1cblx0XHRzdG9yYWdlLnNhdmUobG9jYWxTdG9yYWdlTmFtZSlcblx0fSlcblx0c3RvcmUuZ2V0QWxsID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlKSB7XG5cdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0dmFyIHJldCA9IHt9XG5cdFx0Zm9yICh2YXIgaT0wLCBhdHRyOyBhdHRyPWF0dHJpYnV0ZXNbaV07ICsraSkge1xuXHRcdFx0dmFyIGtleSA9IGllS2V5Rml4KGF0dHIubmFtZSlcblx0XHRcdHJldFthdHRyLm5hbWVdID0gc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRBdHRyaWJ1dGUoa2V5KSlcblx0XHR9XG5cdFx0cmV0dXJuIHJldFxuXHR9KVxufVxuXG50cnkge1xuXHRzdG9yZS5zZXQobmFtZXNwYWNlLCBuYW1lc3BhY2UpXG5cdGlmIChzdG9yZS5nZXQobmFtZXNwYWNlKSAhPSBuYW1lc3BhY2UpIHsgc3RvcmUuZGlzYWJsZWQgPSB0cnVlIH1cblx0c3RvcmUucmVtb3ZlKG5hbWVzcGFjZSlcbn0gY2F0Y2goZSkge1xuXHRzdG9yZS5kaXNhYmxlZCA9IHRydWVcbn1cbnN0b3JlLmVuYWJsZWQgPSAhc3RvcmUuZGlzYWJsZWRcblxubW9kdWxlLmV4cG9ydHMgPSBzdG9yZTsiLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYSwgYil7XG4gIHZhciBmbiA9IGZ1bmN0aW9uKCl7fTtcbiAgZm4ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XG4gIGEucHJvdG90eXBlID0gbmV3IGZuO1xuICBhLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGE7XG59OyIsIlxudmFyIGlzRW1wdHkgPSByZXF1aXJlKCdpcy1lbXB0eScpO1xuXG50cnkge1xuICB2YXIgdHlwZU9mID0gcmVxdWlyZSgndHlwZScpO1xufSBjYXRjaCAoZSkge1xuICB2YXIgdHlwZU9mID0gcmVxdWlyZSgnY29tcG9uZW50LXR5cGUnKTtcbn1cblxuXG4vKipcbiAqIFR5cGVzLlxuICovXG5cbnZhciB0eXBlcyA9IFtcbiAgJ2FyZ3VtZW50cycsXG4gICdhcnJheScsXG4gICdib29sZWFuJyxcbiAgJ2RhdGUnLFxuICAnZWxlbWVudCcsXG4gICdmdW5jdGlvbicsXG4gICdudWxsJyxcbiAgJ251bWJlcicsXG4gICdvYmplY3QnLFxuICAncmVnZXhwJyxcbiAgJ3N0cmluZycsXG4gICd1bmRlZmluZWQnXG5dO1xuXG5cbi8qKlxuICogRXhwb3NlIHR5cGUgY2hlY2tlcnMuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZm9yICh2YXIgaSA9IDAsIHR5cGU7IHR5cGUgPSB0eXBlc1tpXTsgaSsrKSBleHBvcnRzW3R5cGVdID0gZ2VuZXJhdGUodHlwZSk7XG5cblxuLyoqXG4gKiBBZGQgYWxpYXMgZm9yIGBmdW5jdGlvbmAgZm9yIG9sZCBicm93c2Vycy5cbiAqL1xuXG5leHBvcnRzLmZuID0gZXhwb3J0c1snZnVuY3Rpb24nXTtcblxuXG4vKipcbiAqIEV4cG9zZSBgZW1wdHlgIGNoZWNrLlxuICovXG5cbmV4cG9ydHMuZW1wdHkgPSBpc0VtcHR5O1xuXG5cbi8qKlxuICogRXhwb3NlIGBuYW5gIGNoZWNrLlxuICovXG5cbmV4cG9ydHMubmFuID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gZXhwb3J0cy5udW1iZXIodmFsKSAmJiB2YWwgIT0gdmFsO1xufTtcblxuXG4vKipcbiAqIEdlbmVyYXRlIGEgdHlwZSBjaGVja2VyLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5mdW5jdGlvbiBnZW5lcmF0ZSAodHlwZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGUgPT09IHR5cGVPZih2YWx1ZSk7XG4gIH07XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc01ldGEgKGUpIHtcbiAgICBpZiAoZS5tZXRhS2V5IHx8IGUuYWx0S2V5IHx8IGUuY3RybEtleSB8fCBlLnNoaWZ0S2V5KSByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIExvZ2ljIHRoYXQgaGFuZGxlcyBjaGVja3MgZm9yIHRoZSBtaWRkbGUgbW91c2UgYnV0dG9uLCBiYXNlZFxuICAgIC8vIG9uIFtqUXVlcnldKGh0dHBzOi8vZ2l0aHViLmNvbS9qcXVlcnkvanF1ZXJ5L2Jsb2IvbWFzdGVyL3NyYy9ldmVudC5qcyNMNDY2KS5cbiAgICB2YXIgd2hpY2ggPSBlLndoaWNoLCBidXR0b24gPSBlLmJ1dHRvbjtcbiAgICBpZiAoIXdoaWNoICYmIGJ1dHRvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gKCFidXR0b24gJiAxKSAmJiAoIWJ1dHRvbiAmIDIpICYmIChidXR0b24gJiA0KTtcbiAgICB9IGVsc2UgaWYgKHdoaWNoID09PSAyKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG59OyIsIlxuLyoqXG4gKiBIT1AgcmVmLlxuICovXG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFJldHVybiBvd24ga2V5cyBpbiBgb2JqYC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24ob2JqKXtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXMuY2FsbChvYmosIGtleSkpIHtcbiAgICAgIGtleXMucHVzaChrZXkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG5cbi8qKlxuICogUmV0dXJuIG93biB2YWx1ZXMgaW4gYG9iamAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMudmFsdWVzID0gZnVuY3Rpb24ob2JqKXtcbiAgdmFyIHZhbHMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXMuY2FsbChvYmosIGtleSkpIHtcbiAgICAgIHZhbHMucHVzaChvYmpba2V5XSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWxzO1xufTtcblxuLyoqXG4gKiBNZXJnZSBgYmAgaW50byBgYWAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBiXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5tZXJnZSA9IGZ1bmN0aW9uKGEsIGIpe1xuICBmb3IgKHZhciBrZXkgaW4gYikge1xuICAgIGlmIChoYXMuY2FsbChiLCBrZXkpKSB7XG4gICAgICBhW2tleV0gPSBiW2tleV07XG4gICAgfVxuICB9XG4gIHJldHVybiBhO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gbGVuZ3RoIG9mIGBvYmpgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5sZW5ndGggPSBmdW5jdGlvbihvYmope1xuICByZXR1cm4gZXhwb3J0cy5rZXlzKG9iaikubGVuZ3RoO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiBgb2JqYCBpcyBlbXB0eS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmlzRW1wdHkgPSBmdW5jdGlvbihvYmope1xuICByZXR1cm4gMCA9PSBleHBvcnRzLmxlbmd0aChvYmopO1xufTsiLCJcbi8qKlxuICogTW9kdWxlIERlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdhbmFseXRpY3MuanM6bm9ybWFsaXplJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCdkZWZhdWx0cycpO1xudmFyIGVhY2ggPSByZXF1aXJlKCdlYWNoJyk7XG52YXIgaW5jbHVkZXMgPSByZXF1aXJlKCdpbmNsdWRlcycpO1xudmFyIGlzID0gcmVxdWlyZSgnaXMnKTtcbnZhciBtYXAgPSByZXF1aXJlKCdjb21wb25lbnQvbWFwJyk7XG5cbi8qKlxuICogSE9QLlxuICovXG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEV4cG9zZSBgbm9ybWFsaXplYFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gbm9ybWFsaXplO1xuXG4vKipcbiAqIFRvcGxldmVsIHByb3BlcnRpZXMuXG4gKi9cblxudmFyIHRvcGxldmVsID0gW1xuICAnaW50ZWdyYXRpb25zJyxcbiAgJ2Fub255bW91c0lkJyxcbiAgJ3RpbWVzdGFtcCcsXG4gICdjb250ZXh0J1xuXTtcblxuLyoqXG4gKiBOb3JtYWxpemUgYG1zZ2AgYmFzZWQgb24gaW50ZWdyYXRpb25zIGBsaXN0YC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbXNnXG4gKiBAcGFyYW0ge0FycmF5fSBsaXN0XG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5mdW5jdGlvbiBub3JtYWxpemUobXNnLCBsaXN0KXtcbiAgdmFyIGxvd2VyID0gbWFwKGxpc3QsIGZ1bmN0aW9uKHMpeyByZXR1cm4gcy50b0xvd2VyQ2FzZSgpOyB9KTtcbiAgdmFyIG9wdHMgPSBtc2cub3B0aW9ucyB8fCB7fTtcbiAgdmFyIGludGVncmF0aW9ucyA9IG9wdHMuaW50ZWdyYXRpb25zIHx8IHt9O1xuICB2YXIgcHJvdmlkZXJzID0gb3B0cy5wcm92aWRlcnMgfHwge307XG4gIHZhciBjb250ZXh0ID0gb3B0cy5jb250ZXh0IHx8IHt9O1xuICB2YXIgcmV0ID0ge307XG4gIGRlYnVnKCc8LScsIG1zZyk7XG5cbiAgLy8gaW50ZWdyYXRpb25zLlxuICBlYWNoKG9wdHMsIGZ1bmN0aW9uKGtleSwgdmFsdWUpe1xuICAgIGlmICghaW50ZWdyYXRpb24oa2V5KSkgcmV0dXJuO1xuICAgIGlmICghaGFzLmNhbGwoaW50ZWdyYXRpb25zLCBrZXkpKSBpbnRlZ3JhdGlvbnNba2V5XSA9IHZhbHVlO1xuICAgIGRlbGV0ZSBvcHRzW2tleV07XG4gIH0pO1xuXG4gIC8vIHByb3ZpZGVycy5cbiAgZGVsZXRlIG9wdHMucHJvdmlkZXJzO1xuICBlYWNoKHByb3ZpZGVycywgZnVuY3Rpb24oa2V5LCB2YWx1ZSl7XG4gICAgaWYgKCFpbnRlZ3JhdGlvbihrZXkpKSByZXR1cm47XG4gICAgaWYgKGlzLm9iamVjdChpbnRlZ3JhdGlvbnNba2V5XSkpIHJldHVybjtcbiAgICBpZiAoaGFzLmNhbGwoaW50ZWdyYXRpb25zLCBrZXkpICYmIHR5cGVvZiBwcm92aWRlcnNba2V5XSA9PT0gJ2Jvb2xlYW4nKSByZXR1cm47XG4gICAgaW50ZWdyYXRpb25zW2tleV0gPSB2YWx1ZTtcbiAgfSk7XG5cbiAgLy8gbW92ZSBhbGwgdG9wbGV2ZWwgb3B0aW9ucyB0byBtc2dcbiAgLy8gYW5kIHRoZSByZXN0IHRvIGNvbnRleHQuXG4gIGVhY2gob3B0cywgZnVuY3Rpb24oa2V5KXtcbiAgICBpZiAoaW5jbHVkZXMoa2V5LCB0b3BsZXZlbCkpIHtcbiAgICAgIHJldFtrZXldID0gb3B0c1trZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0W2tleV0gPSBvcHRzW2tleV07XG4gICAgfVxuICB9KTtcblxuICAvLyBjbGVhbnVwXG4gIGRlbGV0ZSBtc2cub3B0aW9ucztcbiAgcmV0LmludGVncmF0aW9ucyA9IGludGVncmF0aW9ucztcbiAgcmV0LmNvbnRleHQgPSBjb250ZXh0O1xuICByZXQgPSBkZWZhdWx0cyhyZXQsIG1zZyk7XG4gIGRlYnVnKCctPicsIHJldCk7XG4gIHJldHVybiByZXQ7XG5cbiAgZnVuY3Rpb24gaW50ZWdyYXRpb24obmFtZSl7XG4gICAgcmV0dXJuICEhKGluY2x1ZGVzKG5hbWUsIGxpc3QpIHx8IG5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2FsbCcgfHwgaW5jbHVkZXMobmFtZS50b0xvd2VyQ2FzZSgpLCBsb3dlcikpO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG4vLyBYWFg6IEhhY2t5IGZpeCBmb3IgZHVvIG5vdCBzdXBwb3J0aW5nIHNjb3BlZCBucG0gcGFja2FnZXNcbnZhciBlYWNoOyB0cnkgeyBlYWNoID0gcmVxdWlyZSgnQG5kaG91bGUvZWFjaCcpOyB9IGNhdGNoKGUpIHsgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTsgfVxuXG4vKipcbiAqIFN0cmluZyNpbmRleE9mIHJlZmVyZW5jZS5cbiAqL1xuXG52YXIgc3RySW5kZXhPZiA9IFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZjtcblxuLyoqXG4gKiBPYmplY3QuaXMvc2FtZVZhbHVlWmVybyBwb2x5ZmlsbC5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUxXG4gKiBAcGFyYW0geyp9IHZhbHVlMlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuXG4vLyBUT0RPOiBNb3ZlIHRvIGxpYnJhcnlcbnZhciBzYW1lVmFsdWVaZXJvID0gZnVuY3Rpb24gc2FtZVZhbHVlWmVybyh2YWx1ZTEsIHZhbHVlMikge1xuICAvLyBOb3JtYWwgdmFsdWVzIGFuZCBjaGVjayBmb3IgMCAvIC0wXG4gIGlmICh2YWx1ZTEgPT09IHZhbHVlMikge1xuICAgIHJldHVybiB2YWx1ZTEgIT09IDAgfHwgMSAvIHZhbHVlMSA9PT0gMSAvIHZhbHVlMjtcbiAgfVxuICAvLyBOYU5cbiAgcmV0dXJuIHZhbHVlMSAhPT0gdmFsdWUxICYmIHZhbHVlMiAhPT0gdmFsdWUyO1xufTtcblxuLyoqXG4gKiBTZWFyY2hlcyBhIGdpdmVuIGBjb2xsZWN0aW9uYCBmb3IgYSB2YWx1ZSwgcmV0dXJuaW5nIHRydWUgaWYgdGhlIGNvbGxlY3Rpb25cbiAqIGNvbnRhaW5zIHRoZSB2YWx1ZSBhbmQgZmFsc2Ugb3RoZXJ3aXNlLiBDYW4gc2VhcmNoIHN0cmluZ3MsIGFycmF5cywgYW5kXG4gKiBvYmplY3RzLlxuICpcbiAqIEBuYW1lIGluY2x1ZGVzXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHsqfSBzZWFyY2hFbGVtZW50IFRoZSBlbGVtZW50IHRvIHNlYXJjaCBmb3IuXG4gKiBAcGFyYW0ge09iamVjdHxBcnJheXxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gc2VhcmNoLlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqIEBleGFtcGxlXG4gKiBpbmNsdWRlcygyLCBbMSwgMiwgM10pO1xuICogLy89PiB0cnVlXG4gKlxuICogaW5jbHVkZXMoNCwgWzEsIDIsIDNdKTtcbiAqIC8vPT4gZmFsc2VcbiAqXG4gKiBpbmNsdWRlcygyLCB7IGE6IDEsIGI6IDIsIGM6IDMgfSk7XG4gKiAvLz0+IHRydWVcbiAqXG4gKiBpbmNsdWRlcygnYScsIHsgYTogMSwgYjogMiwgYzogMyB9KTtcbiAqIC8vPT4gZmFsc2VcbiAqXG4gKiBpbmNsdWRlcygnYWJjJywgJ3h5emFiYyBvcHEnKTtcbiAqIC8vPT4gdHJ1ZVxuICpcbiAqIGluY2x1ZGVzKCdub3BlJywgJ3h5emFiYyBvcHEnKTtcbiAqIC8vPT4gZmFsc2VcbiAqL1xudmFyIGluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXMoc2VhcmNoRWxlbWVudCwgY29sbGVjdGlvbikge1xuICB2YXIgZm91bmQgPSBmYWxzZTtcblxuICAvLyBEZWxlZ2F0ZSB0byBTdHJpbmcucHJvdG90eXBlLmluZGV4T2Ygd2hlbiBgY29sbGVjdGlvbmAgaXMgYSBzdHJpbmdcbiAgaWYgKHR5cGVvZiBjb2xsZWN0aW9uID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBzdHJJbmRleE9mLmNhbGwoY29sbGVjdGlvbiwgc2VhcmNoRWxlbWVudCkgIT09IC0xO1xuICB9XG5cbiAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVudW1lcmFibGUvb3duIGFycmF5IGVsZW1lbnRzIGFuZCBvYmplY3QgcHJvcGVydGllcy5cbiAgZWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmIChzYW1lVmFsdWVaZXJvKHZhbHVlLCBzZWFyY2hFbGVtZW50KSkge1xuICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgLy8gRXhpdCBpdGVyYXRpb24gZWFybHkgd2hlbiBmb3VuZFxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSwgY29sbGVjdGlvbik7XG5cbiAgcmV0dXJuIGZvdW5kO1xufTtcblxuLyoqXG4gKiBFeHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaW5jbHVkZXM7XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgdG9GdW5jdGlvbiA9IHJlcXVpcmUoJ3RvLWZ1bmN0aW9uJyk7XG5cbi8qKlxuICogTWFwIHRoZSBnaXZlbiBgYXJyYCB3aXRoIGNhbGxiYWNrIGBmbih2YWwsIGkpYC5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIGZuKXtcbiAgdmFyIHJldCA9IFtdO1xuICBmbiA9IHRvRnVuY3Rpb24oZm4pO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkge1xuICAgIHJldC5wdXNoKGZuKGFycltpXSwgaSkpO1xuICB9XG4gIHJldHVybiByZXQ7XG59OyIsIlxuLyoqXG4gKiBNb2R1bGUgRGVwZW5kZW5jaWVzXG4gKi9cblxudmFyIGV4cHI7XG50cnkge1xuICBleHByID0gcmVxdWlyZSgncHJvcHMnKTtcbn0gY2F0Y2goZSkge1xuICBleHByID0gcmVxdWlyZSgnY29tcG9uZW50LXByb3BzJyk7XG59XG5cbi8qKlxuICogRXhwb3NlIGB0b0Z1bmN0aW9uKClgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gdG9GdW5jdGlvbjtcblxuLyoqXG4gKiBDb252ZXJ0IGBvYmpgIHRvIGEgYEZ1bmN0aW9uYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBvYmpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gdG9GdW5jdGlvbihvYmopIHtcbiAgc3dpdGNoICh7fS50b1N0cmluZy5jYWxsKG9iaikpIHtcbiAgICBjYXNlICdbb2JqZWN0IE9iamVjdF0nOlxuICAgICAgcmV0dXJuIG9iamVjdFRvRnVuY3Rpb24ob2JqKTtcbiAgICBjYXNlICdbb2JqZWN0IEZ1bmN0aW9uXSc6XG4gICAgICByZXR1cm4gb2JqO1xuICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICByZXR1cm4gc3RyaW5nVG9GdW5jdGlvbihvYmopO1xuICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICByZXR1cm4gcmVnZXhwVG9GdW5jdGlvbihvYmopO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGVmYXVsdFRvRnVuY3Rpb24ob2JqKTtcbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgdG8gc3RyaWN0IGVxdWFsaXR5LlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBkZWZhdWx0VG9GdW5jdGlvbih2YWwpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iail7XG4gICAgcmV0dXJuIHZhbCA9PT0gb2JqO1xuICB9O1xufVxuXG4vKipcbiAqIENvbnZlcnQgYHJlYCB0byBhIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7UmVnRXhwfSByZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiByZWdleHBUb0Z1bmN0aW9uKHJlKSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmope1xuICAgIHJldHVybiByZS50ZXN0KG9iaik7XG4gIH07XG59XG5cbi8qKlxuICogQ29udmVydCBwcm9wZXJ0eSBgc3RyYCB0byBhIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc3RyaW5nVG9GdW5jdGlvbihzdHIpIHtcbiAgLy8gaW1tZWRpYXRlIHN1Y2ggYXMgXCI+IDIwXCJcbiAgaWYgKC9eICpcXFcrLy50ZXN0KHN0cikpIHJldHVybiBuZXcgRnVuY3Rpb24oJ18nLCAncmV0dXJuIF8gJyArIHN0cik7XG5cbiAgLy8gcHJvcGVydGllcyBzdWNoIGFzIFwibmFtZS5maXJzdFwiIG9yIFwiYWdlID4gMThcIiBvciBcImFnZSA+IDE4ICYmIGFnZSA8IDM2XCJcbiAgcmV0dXJuIG5ldyBGdW5jdGlvbignXycsICdyZXR1cm4gJyArIGdldChzdHIpKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGBvYmplY3RgIHRvIGEgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBvYmplY3RUb0Z1bmN0aW9uKG9iaikge1xuICB2YXIgbWF0Y2ggPSB7fTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIG1hdGNoW2tleV0gPSB0eXBlb2Ygb2JqW2tleV0gPT09ICdzdHJpbmcnXG4gICAgICA/IGRlZmF1bHRUb0Z1bmN0aW9uKG9ialtrZXldKVxuICAgICAgOiB0b0Z1bmN0aW9uKG9ialtrZXldKTtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24odmFsKXtcbiAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKHZhciBrZXkgaW4gbWF0Y2gpIHtcbiAgICAgIGlmICghKGtleSBpbiB2YWwpKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIW1hdGNoW2tleV0odmFsW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xufVxuXG4vKipcbiAqIEJ1aWx0IHRoZSBnZXR0ZXIgZnVuY3Rpb24uIFN1cHBvcnRzIGdldHRlciBzdHlsZSBmdW5jdGlvbnNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBnZXQoc3RyKSB7XG4gIHZhciBwcm9wcyA9IGV4cHIoc3RyKTtcbiAgaWYgKCFwcm9wcy5sZW5ndGgpIHJldHVybiAnXy4nICsgc3RyO1xuXG4gIHZhciB2YWwsIGksIHByb3A7XG4gIGZvciAoaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgIHByb3AgPSBwcm9wc1tpXTtcbiAgICB2YWwgPSAnXy4nICsgcHJvcDtcbiAgICB2YWwgPSBcIignZnVuY3Rpb24nID09IHR5cGVvZiBcIiArIHZhbCArIFwiID8gXCIgKyB2YWwgKyBcIigpIDogXCIgKyB2YWwgKyBcIilcIjtcblxuICAgIC8vIG1pbWljIG5lZ2F0aXZlIGxvb2tiZWhpbmQgdG8gYXZvaWQgcHJvYmxlbXMgd2l0aCBuZXN0ZWQgcHJvcGVydGllc1xuICAgIHN0ciA9IHN0cmlwTmVzdGVkKHByb3AsIHN0ciwgdmFsKTtcbiAgfVxuXG4gIHJldHVybiBzdHI7XG59XG5cbi8qKlxuICogTWltaWMgbmVnYXRpdmUgbG9va2JlaGluZCB0byBhdm9pZCBwcm9ibGVtcyB3aXRoIG5lc3RlZCBwcm9wZXJ0aWVzLlxuICpcbiAqIFNlZTogaHR0cDovL2Jsb2cuc3RldmVubGV2aXRoYW4uY29tL2FyY2hpdmVzL21pbWljLWxvb2tiZWhpbmQtamF2YXNjcmlwdFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzdHJpcE5lc3RlZCAocHJvcCwgc3RyLCB2YWwpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKG5ldyBSZWdFeHAoJyhcXFxcLik/JyArIHByb3AsICdnJyksIGZ1bmN0aW9uKCQwLCAkMSkge1xuICAgIHJldHVybiAkMSA/ICQwIDogdmFsO1xuICB9KTtcbn1cbiIsIi8qKlxuICogR2xvYmFsIE5hbWVzXG4gKi9cblxudmFyIGdsb2JhbHMgPSAvXFxiKHRoaXN8QXJyYXl8RGF0ZXxPYmplY3R8TWF0aHxKU09OKVxcYi9nO1xuXG4vKipcbiAqIFJldHVybiBpbW1lZGlhdGUgaWRlbnRpZmllcnMgcGFyc2VkIGZyb20gYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IG1hcCBmdW5jdGlvbiBvciBwcmVmaXhcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0ciwgZm4pe1xuICB2YXIgcCA9IHVuaXF1ZShwcm9wcyhzdHIpKTtcbiAgaWYgKGZuICYmICdzdHJpbmcnID09IHR5cGVvZiBmbikgZm4gPSBwcmVmaXhlZChmbik7XG4gIGlmIChmbikgcmV0dXJuIG1hcChzdHIsIHAsIGZuKTtcbiAgcmV0dXJuIHA7XG59O1xuXG4vKipcbiAqIFJldHVybiBpbW1lZGlhdGUgaWRlbnRpZmllcnMgaW4gYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwcm9wcyhzdHIpIHtcbiAgcmV0dXJuIHN0clxuICAgIC5yZXBsYWNlKC9cXC5cXHcrfFxcdysgKlxcKHxcIlteXCJdKlwifCdbXiddKid8XFwvKFteL10rKVxcLy9nLCAnJylcbiAgICAucmVwbGFjZShnbG9iYWxzLCAnJylcbiAgICAubWF0Y2goL1skYS16QS1aX11cXHcqL2cpXG4gICAgfHwgW107XG59XG5cbi8qKlxuICogUmV0dXJuIGBzdHJgIHdpdGggYHByb3BzYCBtYXBwZWQgd2l0aCBgZm5gLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7QXJyYXl9IHByb3BzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbWFwKHN0ciwgcHJvcHMsIGZuKSB7XG4gIHZhciByZSA9IC9cXC5cXHcrfFxcdysgKlxcKHxcIlteXCJdKlwifCdbXiddKid8XFwvKFteL10rKVxcL3xbYS16QS1aX11cXHcqL2c7XG4gIHJldHVybiBzdHIucmVwbGFjZShyZSwgZnVuY3Rpb24oXyl7XG4gICAgaWYgKCcoJyA9PSBfW18ubGVuZ3RoIC0gMV0pIHJldHVybiBmbihfKTtcbiAgICBpZiAoIX5wcm9wcy5pbmRleE9mKF8pKSByZXR1cm4gXztcbiAgICByZXR1cm4gZm4oXyk7XG4gIH0pO1xufVxuXG4vKipcbiAqIFJldHVybiB1bmlxdWUgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHVuaXF1ZShhcnIpIHtcbiAgdmFyIHJldCA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKH5yZXQuaW5kZXhPZihhcnJbaV0pKSBjb250aW51ZTtcbiAgICByZXQucHVzaChhcnJbaV0pO1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cblxuLyoqXG4gKiBNYXAgd2l0aCBwcmVmaXggYHN0cmAuXG4gKi9cblxuZnVuY3Rpb24gcHJlZml4ZWQoc3RyKSB7XG4gIHJldHVybiBmdW5jdGlvbihfKXtcbiAgICByZXR1cm4gc3RyICsgXztcbiAgfTtcbn1cbiIsIlxuLyoqXG4gKiBCaW5kIGBlbGAgZXZlbnQgYHR5cGVgIHRvIGBmbmAuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGNhcHR1cmVcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmJpbmQgPSBmdW5jdGlvbihlbCwgdHlwZSwgZm4sIGNhcHR1cmUpe1xuICBpZiAoZWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmUgfHwgZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIGVsLmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCBmbik7XG4gIH1cbiAgcmV0dXJuIGZuO1xufTtcblxuLyoqXG4gKiBVbmJpbmQgYGVsYCBldmVudCBgdHlwZWAncyBjYWxsYmFjayBgZm5gLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtCb29sZWFufSBjYXB0dXJlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy51bmJpbmQgPSBmdW5jdGlvbihlbCwgdHlwZSwgZm4sIGNhcHR1cmUpe1xuICBpZiAoZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmUgfHwgZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIGVsLmRldGFjaEV2ZW50KCdvbicgKyB0eXBlLCBmbik7XG4gIH1cbiAgcmV0dXJuIGZuO1xufTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBjYW5vbmljYWwgPSByZXF1aXJlKCdjYW5vbmljYWwnKTtcbnZhciBpbmNsdWRlcyA9IHJlcXVpcmUoJ2luY2x1ZGVzJyk7XG52YXIgdXJsID0gcmVxdWlyZSgndXJsJyk7XG5cbi8qKlxuICogUmV0dXJuIGEgZGVmYXVsdCBgb3B0aW9ucy5jb250ZXh0LnBhZ2VgIG9iamVjdC5cbiAqXG4gKiBodHRwczovL3NlZ21lbnQuY29tL2RvY3Mvc3BlYy9wYWdlLyNwcm9wZXJ0aWVzXG4gKlxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIHBhZ2VEZWZhdWx0cygpIHtcbiAgcmV0dXJuIHtcbiAgICBwYXRoOiBjYW5vbmljYWxQYXRoKCksXG4gICAgcmVmZXJyZXI6IGRvY3VtZW50LnJlZmVycmVyLFxuICAgIHNlYXJjaDogbG9jYXRpb24uc2VhcmNoLFxuICAgIHRpdGxlOiBkb2N1bWVudC50aXRsZSxcbiAgICB1cmw6IGNhbm9uaWNhbFVybChsb2NhdGlvbi5zZWFyY2gpXG4gIH07XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjYW5vbmljYWwgcGF0aCBmb3IgdGhlIHBhZ2UuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIGNhbm9uaWNhbFBhdGgoKSB7XG4gIHZhciBjYW5vbiA9IGNhbm9uaWNhbCgpO1xuICBpZiAoIWNhbm9uKSByZXR1cm4gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICB2YXIgcGFyc2VkID0gdXJsLnBhcnNlKGNhbm9uKTtcbiAgcmV0dXJuIHBhcnNlZC5wYXRobmFtZTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGNhbm9uaWNhbCBVUkwgZm9yIHRoZSBwYWdlIGNvbmNhdCB0aGUgZ2l2ZW4gYHNlYXJjaGBcbiAqIGFuZCBzdHJpcCB0aGUgaGFzaC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VhcmNoXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gY2Fub25pY2FsVXJsKHNlYXJjaCkge1xuICB2YXIgY2Fub24gPSBjYW5vbmljYWwoKTtcbiAgaWYgKGNhbm9uKSByZXR1cm4gaW5jbHVkZXMoJz8nLCBjYW5vbikgPyBjYW5vbiA6IGNhbm9uICsgc2VhcmNoO1xuICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gIHZhciBpID0gdXJsLmluZGV4T2YoJyMnKTtcbiAgcmV0dXJuIGkgPT09IC0xID8gdXJsIDogdXJsLnNsaWNlKDAsIGkpO1xufVxuXG4vKipcbiAqIEV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBwYWdlRGVmYXVsdHM7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNhbm9uaWNhbCAoKSB7XG4gIHZhciB0YWdzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2xpbmsnKTtcbiAgZm9yICh2YXIgaSA9IDAsIHRhZzsgdGFnID0gdGFnc1tpXTsgaSsrKSB7XG4gICAgaWYgKCdjYW5vbmljYWwnID09IHRhZy5nZXRBdHRyaWJ1dGUoJ3JlbCcpKSByZXR1cm4gdGFnLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuICB9XG59OyIsIlxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHVybGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24odXJsKXtcbiAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gIGEuaHJlZiA9IHVybDtcbiAgcmV0dXJuIHtcbiAgICBocmVmOiBhLmhyZWYsXG4gICAgaG9zdDogYS5ob3N0IHx8IGxvY2F0aW9uLmhvc3QsXG4gICAgcG9ydDogKCcwJyA9PT0gYS5wb3J0IHx8ICcnID09PSBhLnBvcnQpID8gcG9ydChhLnByb3RvY29sKSA6IGEucG9ydCxcbiAgICBoYXNoOiBhLmhhc2gsXG4gICAgaG9zdG5hbWU6IGEuaG9zdG5hbWUgfHwgbG9jYXRpb24uaG9zdG5hbWUsXG4gICAgcGF0aG5hbWU6IGEucGF0aG5hbWUuY2hhckF0KDApICE9ICcvJyA/ICcvJyArIGEucGF0aG5hbWUgOiBhLnBhdGhuYW1lLFxuICAgIHByb3RvY29sOiAhYS5wcm90b2NvbCB8fCAnOicgPT0gYS5wcm90b2NvbCA/IGxvY2F0aW9uLnByb3RvY29sIDogYS5wcm90b2NvbCxcbiAgICBzZWFyY2g6IGEuc2VhcmNoLFxuICAgIHF1ZXJ5OiBhLnNlYXJjaC5zbGljZSgxKVxuICB9O1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiBgdXJsYCBpcyBhYnNvbHV0ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbih1cmwpe1xuICByZXR1cm4gMCA9PSB1cmwuaW5kZXhPZignLy8nKSB8fCAhIX51cmwuaW5kZXhPZignOi8vJyk7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGB1cmxgIGlzIHJlbGF0aXZlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuaXNSZWxhdGl2ZSA9IGZ1bmN0aW9uKHVybCl7XG4gIHJldHVybiAhZXhwb3J0cy5pc0Fic29sdXRlKHVybCk7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGB1cmxgIGlzIGNyb3NzIGRvbWFpbi5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmlzQ3Jvc3NEb21haW4gPSBmdW5jdGlvbih1cmwpe1xuICB1cmwgPSBleHBvcnRzLnBhcnNlKHVybCk7XG4gIHZhciBsb2NhdGlvbiA9IGV4cG9ydHMucGFyc2Uod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICByZXR1cm4gdXJsLmhvc3RuYW1lICE9PSBsb2NhdGlvbi5ob3N0bmFtZVxuICAgIHx8IHVybC5wb3J0ICE9PSBsb2NhdGlvbi5wb3J0XG4gICAgfHwgdXJsLnByb3RvY29sICE9PSBsb2NhdGlvbi5wcm90b2NvbDtcbn07XG5cbi8qKlxuICogUmV0dXJuIGRlZmF1bHQgcG9ydCBmb3IgYHByb3RvY29sYC5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHByb3RvY29sXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gcG9ydCAocHJvdG9jb2wpe1xuICBzd2l0Y2ggKHByb3RvY29sKSB7XG4gICAgY2FzZSAnaHR0cDonOlxuICAgICAgcmV0dXJuIDgwO1xuICAgIGNhc2UgJ2h0dHBzOic6XG4gICAgICByZXR1cm4gNDQzO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gbG9jYXRpb24ucG9ydDtcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb2JqVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vLyBUT0RPOiBNb3ZlIHRvIGxpYlxudmFyIGV4aXN0eSA9IGZ1bmN0aW9uKHZhbCkge1xuICByZXR1cm4gdmFsICE9IG51bGw7XG59O1xuXG4vLyBUT0RPOiBNb3ZlIHRvIGxpYlxudmFyIGlzQXJyYXkgPSBmdW5jdGlvbih2YWwpIHtcbiAgcmV0dXJuIG9ialRvU3RyaW5nLmNhbGwodmFsKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbi8vIFRPRE86IE1vdmUgdG8gbGliXG52YXIgaXNTdHJpbmcgPSBmdW5jdGlvbih2YWwpIHtcbiAgIHJldHVybiB0eXBlb2YgdmFsID09PSAnc3RyaW5nJyB8fCBvYmpUb1N0cmluZy5jYWxsKHZhbCkgPT09ICdbb2JqZWN0IFN0cmluZ10nO1xufTtcblxuLy8gVE9ETzogTW92ZSB0byBsaWJcbnZhciBpc09iamVjdCA9IGZ1bmN0aW9uKHZhbCkge1xuICByZXR1cm4gdmFsICE9IG51bGwgJiYgdHlwZW9mIHZhbCA9PT0gJ29iamVjdCc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBuZXcgYG9iamVjdGAgY29udGFpbmluZyBvbmx5IHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcy5cbiAqXG4gKiBAbmFtZSBwaWNrXG4gKiBAYXBpIHB1YmxpY1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHNlZSB7QGxpbmsgb21pdH1cbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz58c3RyaW5nfSBwcm9wcyBUaGUgcHJvcGVydHkgb3IgcHJvcGVydGllcyB0byBrZWVwLlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEByZXR1cm4ge09iamVjdH0gQSBuZXcgb2JqZWN0IGNvbnRhaW5pbmcgb25seSB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMgZnJvbSBgb2JqZWN0YC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgcGVyc29uID0geyBuYW1lOiAnVGltJywgb2NjdXBhdGlvbjogJ2VuY2hhbnRlcicsIGZlYXJzOiAncmFiYml0cycgfTtcbiAqXG4gKiBwaWNrKCduYW1lJywgcGVyc29uKTtcbiAqIC8vPT4geyBuYW1lOiAnVGltJyB9XG4gKlxuICogcGljayhbJ25hbWUnLCAnZmVhcnMnXSwgcGVyc29uKTtcbiAqIC8vPT4geyBuYW1lOiAnVGltJywgZmVhcnM6ICdyYWJiaXRzJyB9XG4gKi9cblxudmFyIHBpY2sgPSBmdW5jdGlvbiBwaWNrKHByb3BzLCBvYmplY3QpIHtcbiAgaWYgKCFleGlzdHkob2JqZWN0KSB8fCAhaXNPYmplY3Qob2JqZWN0KSkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIGlmIChpc1N0cmluZyhwcm9wcykpIHtcbiAgICBwcm9wcyA9IFtwcm9wc107XG4gIH1cblxuICBpZiAoIWlzQXJyYXkocHJvcHMpKSB7XG4gICAgcHJvcHMgPSBbXTtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSB7fTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgaWYgKGlzU3RyaW5nKHByb3BzW2ldKSAmJiBwcm9wc1tpXSBpbiBvYmplY3QpIHtcbiAgICAgIHJlc3VsdFtwcm9wc1tpXV0gPSBvYmplY3RbcHJvcHNbaV1dO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIEV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBwaWNrO1xuIiwiXG4vKipcbiAqIHByZXZlbnQgZGVmYXVsdCBvbiB0aGUgZ2l2ZW4gYGVgLlxuICogXG4gKiBleGFtcGxlczpcbiAqIFxuICogICAgICBhbmNob3Iub25jbGljayA9IHByZXZlbnQ7XG4gKiAgICAgIGFuY2hvci5vbmNsaWNrID0gZnVuY3Rpb24oZSl7XG4gKiAgICAgICAgaWYgKHNvbWV0aGluZykgcmV0dXJuIHByZXZlbnQoZSk7XG4gKiAgICAgIH07XG4gKiBcbiAqIEBwYXJhbSB7RXZlbnR9IGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGUpe1xuICBlID0gZSB8fCB3aW5kb3cuZXZlbnRcbiAgcmV0dXJuIGUucHJldmVudERlZmF1bHRcbiAgICA/IGUucHJldmVudERlZmF1bHQoKVxuICAgIDogZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xufTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0cmltID0gcmVxdWlyZSgndHJpbScpO1xudmFyIHR5cGUgPSByZXF1aXJlKCd0eXBlJyk7XG5cbnZhciBwYXR0ZXJuID0gLyhcXHcrKVxcWyhcXGQrKVxcXS9cblxuLyoqXG4gKiBTYWZlbHkgZW5jb2RlIHRoZSBnaXZlbiBzdHJpbmdcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxudmFyIGVuY29kZSA9IGZ1bmN0aW9uKHN0cikge1xuICB0cnkge1xuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc3RyKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn07XG5cbi8qKlxuICogU2FmZWx5IGRlY29kZSB0aGUgc3RyaW5nXG4gKiBcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnZhciBkZWNvZGUgPSBmdW5jdGlvbihzdHIpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0ci5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIHF1ZXJ5IGBzdHJgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uKHN0cil7XG4gIGlmICgnc3RyaW5nJyAhPSB0eXBlb2Ygc3RyKSByZXR1cm4ge307XG5cbiAgc3RyID0gdHJpbShzdHIpO1xuICBpZiAoJycgPT0gc3RyKSByZXR1cm4ge307XG4gIGlmICgnPycgPT0gc3RyLmNoYXJBdCgwKSkgc3RyID0gc3RyLnNsaWNlKDEpO1xuXG4gIHZhciBvYmogPSB7fTtcbiAgdmFyIHBhaXJzID0gc3RyLnNwbGl0KCcmJyk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGFpcnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcGFydHMgPSBwYWlyc1tpXS5zcGxpdCgnPScpO1xuICAgIHZhciBrZXkgPSBkZWNvZGUocGFydHNbMF0pO1xuICAgIHZhciBtO1xuXG4gICAgaWYgKG0gPSBwYXR0ZXJuLmV4ZWMoa2V5KSkge1xuICAgICAgb2JqW21bMV1dID0gb2JqW21bMV1dIHx8IFtdO1xuICAgICAgb2JqW21bMV1dW21bMl1dID0gZGVjb2RlKHBhcnRzWzFdKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIG9ialtwYXJ0c1swXV0gPSBudWxsID09IHBhcnRzWzFdXG4gICAgICA/ICcnXG4gICAgICA6IGRlY29kZShwYXJ0c1sxXSk7XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxuLyoqXG4gKiBTdHJpbmdpZnkgdGhlIGdpdmVuIGBvYmpgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5zdHJpbmdpZnkgPSBmdW5jdGlvbihvYmope1xuICBpZiAoIW9iaikgcmV0dXJuICcnO1xuICB2YXIgcGFpcnMgPSBbXTtcblxuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgdmFyIHZhbHVlID0gb2JqW2tleV07XG5cbiAgICBpZiAoJ2FycmF5JyA9PSB0eXBlKHZhbHVlKSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBwYWlycy5wdXNoKGVuY29kZShrZXkgKyAnWycgKyBpICsgJ10nKSArICc9JyArIGVuY29kZSh2YWx1ZVtpXSkpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcGFpcnMucHVzaChlbmNvZGUoa2V5KSArICc9JyArIGVuY29kZShvYmpba2V5XSkpO1xuICB9XG5cbiAgcmV0dXJuIHBhaXJzLmpvaW4oJyYnKTtcbn07XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgRW50aXR5ID0gcmVxdWlyZSgnLi9lbnRpdHknKTtcbnZhciBiaW5kID0gcmVxdWlyZSgnYmluZCcpO1xudmFyIGNvb2tpZSA9IHJlcXVpcmUoJy4vY29va2llJyk7XG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdhbmFseXRpY3M6dXNlcicpO1xudmFyIGluaGVyaXQgPSByZXF1aXJlKCdpbmhlcml0Jyk7XG52YXIgcmF3Q29va2llID0gcmVxdWlyZSgnY29va2llJyk7XG52YXIgdXVpZCA9IHJlcXVpcmUoJ3V1aWQnKTtcblxuXG4vKipcbiAqIFVzZXIgZGVmYXVsdHNcbiAqL1xuXG5Vc2VyLmRlZmF1bHRzID0ge1xuICBwZXJzaXN0OiB0cnVlLFxuICBjb29raWU6IHtcbiAgICBrZXk6ICdhanNfdXNlcl9pZCcsXG4gICAgb2xkS2V5OiAnYWpzX3VzZXInXG4gIH0sXG4gIGxvY2FsU3RvcmFnZToge1xuICAgIGtleTogJ2Fqc191c2VyX3RyYWl0cydcbiAgfVxufTtcblxuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYFVzZXJgIHdpdGggYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gVXNlcihvcHRpb25zKSB7XG4gIHRoaXMuZGVmYXVsdHMgPSBVc2VyLmRlZmF1bHRzO1xuICB0aGlzLmRlYnVnID0gZGVidWc7XG4gIEVudGl0eS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xufVxuXG5cbi8qKlxuICogSW5oZXJpdCBgRW50aXR5YFxuICovXG5cbmluaGVyaXQoVXNlciwgRW50aXR5KTtcblxuLyoqXG4gKiBTZXQvZ2V0IHRoZSB1c2VyIGlkLlxuICpcbiAqIFdoZW4gdGhlIHVzZXIgaWQgY2hhbmdlcywgdGhlIG1ldGhvZCB3aWxsIHJlc2V0IGhpcyBhbm9ueW1vdXNJZCB0byBhIG5ldyBvbmUuXG4gKlxuICogLy8gRklYTUU6IFdoYXQgYXJlIHRoZSBtaXhlZCB0eXBlcz9cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAZXhhbXBsZVxuICogLy8gZGlkbid0IGNoYW5nZSBiZWNhdXNlIHRoZSB1c2VyIGRpZG4ndCBoYXZlIHByZXZpb3VzIGlkLlxuICogYW5vbnltb3VzSWQgPSB1c2VyLmFub255bW91c0lkKCk7XG4gKiB1c2VyLmlkKCdmb28nKTtcbiAqIGFzc2VydC5lcXVhbChhbm9ueW1vdXNJZCwgdXNlci5hbm9ueW1vdXNJZCgpKTtcbiAqXG4gKiAvLyBkaWRuJ3QgY2hhbmdlIGJlY2F1c2UgdGhlIHVzZXIgaWQgY2hhbmdlZCB0byBudWxsLlxuICogYW5vbnltb3VzSWQgPSB1c2VyLmFub255bW91c0lkKCk7XG4gKiB1c2VyLmlkKCdmb28nKTtcbiAqIHVzZXIuaWQobnVsbCk7XG4gKiBhc3NlcnQuZXF1YWwoYW5vbnltb3VzSWQsIHVzZXIuYW5vbnltb3VzSWQoKSk7XG4gKlxuICogLy8gY2hhbmdlIGJlY2F1c2UgdGhlIHVzZXIgaGFkIHByZXZpb3VzIGlkLlxuICogYW5vbnltb3VzSWQgPSB1c2VyLmFub255bW91c0lkKCk7XG4gKiB1c2VyLmlkKCdmb28nKTtcbiAqIHVzZXIuaWQoJ2JheicpOyAvLyB0cmlnZ2VycyBjaGFuZ2VcbiAqIHVzZXIuaWQoJ2JheicpOyAvLyBubyBjaGFuZ2VcbiAqIGFzc2VydC5ub3RFcXVhbChhbm9ueW1vdXNJZCwgdXNlci5hbm9ueW1vdXNJZCgpKTtcbiAqL1xuXG5Vc2VyLnByb3RvdHlwZS5pZCA9IGZ1bmN0aW9uKGlkKXtcbiAgdmFyIHByZXYgPSB0aGlzLl9nZXRJZCgpO1xuICB2YXIgcmV0ID0gRW50aXR5LnByb3RvdHlwZS5pZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICBpZiAocHJldiA9PSBudWxsKSByZXR1cm4gcmV0O1xuICAvLyBGSVhNRTogV2UncmUgcmVseWluZyBvbiBjb2VyY2lvbiBoZXJlICgxID09IFwiMVwiKSwgYnV0IG91ciBBUEkgdHJlYXRzIHRoZXNlXG4gIC8vIHR3byB2YWx1ZXMgZGlmZmVyZW50bHkuIEZpZ3VyZSBvdXQgd2hhdCB3aWxsIGJyZWFrIGlmIHdlIHJlbW92ZSB0aGlzIGFuZFxuICAvLyBjaGFuZ2UgdG8gc3RyaWN0IGVxdWFsaXR5XG4gIC8qIGVzbGludC1kaXNhYmxlIGVxZXFlcSAqL1xuICBpZiAocHJldiAhPSBpZCAmJiBpZCkgdGhpcy5hbm9ueW1vdXNJZChudWxsKTtcbiAgLyogZXNsaW50LWVuYWJsZSBlcWVxZXEgKi9cbiAgcmV0dXJuIHJldDtcbn07XG5cbi8qKlxuICogU2V0IC8gZ2V0IC8gcmVtb3ZlIGFub255bW91c0lkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBhbm9ueW1vdXNJZFxuICogQHJldHVybiB7U3RyaW5nfFVzZXJ9XG4gKi9cblxuVXNlci5wcm90b3R5cGUuYW5vbnltb3VzSWQgPSBmdW5jdGlvbihhbm9ueW1vdXNJZCl7XG4gIHZhciBzdG9yZSA9IHRoaXMuc3RvcmFnZSgpO1xuXG4gIC8vIHNldCAvIHJlbW92ZVxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHN0b3JlLnNldCgnYWpzX2Fub255bW91c19pZCcsIGFub255bW91c0lkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIG5ld1xuICBhbm9ueW1vdXNJZCA9IHN0b3JlLmdldCgnYWpzX2Fub255bW91c19pZCcpO1xuICBpZiAoYW5vbnltb3VzSWQpIHtcbiAgICByZXR1cm4gYW5vbnltb3VzSWQ7XG4gIH1cblxuICAvLyBvbGQgLSBpdCBpcyBub3Qgc3RyaW5naWZpZWQgc28gd2UgdXNlIHRoZSByYXcgY29va2llLlxuICBhbm9ueW1vdXNJZCA9IHJhd0Nvb2tpZSgnX3NpbycpO1xuICBpZiAoYW5vbnltb3VzSWQpIHtcbiAgICBhbm9ueW1vdXNJZCA9IGFub255bW91c0lkLnNwbGl0KCctLS0tJylbMF07XG4gICAgc3RvcmUuc2V0KCdhanNfYW5vbnltb3VzX2lkJywgYW5vbnltb3VzSWQpO1xuICAgIHN0b3JlLnJlbW92ZSgnX3NpbycpO1xuICAgIHJldHVybiBhbm9ueW1vdXNJZDtcbiAgfVxuXG4gIC8vIGVtcHR5XG4gIGFub255bW91c0lkID0gdXVpZCgpO1xuICBzdG9yZS5zZXQoJ2Fqc19hbm9ueW1vdXNfaWQnLCBhbm9ueW1vdXNJZCk7XG4gIHJldHVybiBzdG9yZS5nZXQoJ2Fqc19hbm9ueW1vdXNfaWQnKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFub255bW91cyBpZCBvbiBsb2dvdXQgdG9vLlxuICovXG5cblVzZXIucHJvdG90eXBlLmxvZ291dCA9IGZ1bmN0aW9uKCl7XG4gIEVudGl0eS5wcm90b3R5cGUubG9nb3V0LmNhbGwodGhpcyk7XG4gIHRoaXMuYW5vbnltb3VzSWQobnVsbCk7XG59O1xuXG4vKipcbiAqIExvYWQgc2F2ZWQgdXNlciBgaWRgIG9yIGB0cmFpdHNgIGZyb20gc3RvcmFnZS5cbiAqL1xuXG5Vc2VyLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLl9sb2FkT2xkQ29va2llKCkpIHJldHVybjtcbiAgRW50aXR5LnByb3RvdHlwZS5sb2FkLmNhbGwodGhpcyk7XG59O1xuXG5cbi8qKlxuICogQkFDS1dBUkRTIENPTVBBVElCSUxJVFk6IExvYWQgdGhlIG9sZCB1c2VyIGZyb20gdGhlIGNvb2tpZS5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblxuVXNlci5wcm90b3R5cGUuX2xvYWRPbGRDb29raWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHVzZXIgPSBjb29raWUuZ2V0KHRoaXMuX29wdGlvbnMuY29va2llLm9sZEtleSk7XG4gIGlmICghdXNlcikgcmV0dXJuIGZhbHNlO1xuXG4gIHRoaXMuaWQodXNlci5pZCk7XG4gIHRoaXMudHJhaXRzKHVzZXIudHJhaXRzKTtcbiAgY29va2llLnJlbW92ZSh0aGlzLl9vcHRpb25zLmNvb2tpZS5vbGRLZXkpO1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cblxuLyoqXG4gKiBFeHBvc2UgdGhlIHVzZXIgc2luZ2xldG9uLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gYmluZC5hbGwobmV3IFVzZXIoKSk7XG5cblxuLyoqXG4gKiBFeHBvc2UgdGhlIGBVc2VyYCBjb25zdHJ1Y3Rvci5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cy5Vc2VyID0gVXNlcjtcbiIsIlxuLyoqXG4gKiBUYWtlbiBzdHJhaWdodCBmcm9tIGplZCdzIGdpc3Q6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tLzk4Mjg4M1xuICpcbiAqIFJldHVybnMgYSByYW5kb20gdjQgVVVJRCBvZiB0aGUgZm9ybSB4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgsXG4gKiB3aGVyZSBlYWNoIHggaXMgcmVwbGFjZWQgd2l0aCBhIHJhbmRvbSBoZXhhZGVjaW1hbCBkaWdpdCBmcm9tIDAgdG8gZiwgYW5kXG4gKiB5IGlzIHJlcGxhY2VkIHdpdGggYSByYW5kb20gaGV4YWRlY2ltYWwgZGlnaXQgZnJvbSA4IHRvIGIuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB1dWlkKGEpe1xuICByZXR1cm4gYSAgICAgICAgICAgLy8gaWYgdGhlIHBsYWNlaG9sZGVyIHdhcyBwYXNzZWQsIHJldHVyblxuICAgID8gKCAgICAgICAgICAgICAgLy8gYSByYW5kb20gbnVtYmVyIGZyb20gMCB0byAxNVxuICAgICAgYSBeICAgICAgICAgICAgLy8gdW5sZXNzIGIgaXMgOCxcbiAgICAgIE1hdGgucmFuZG9tKCkgIC8vIGluIHdoaWNoIGNhc2VcbiAgICAgICogMTYgICAgICAgICAgIC8vIGEgcmFuZG9tIG51bWJlciBmcm9tXG4gICAgICA+PiBhLzQgICAgICAgICAvLyA4IHRvIDExXG4gICAgICApLnRvU3RyaW5nKDE2KSAvLyBpbiBoZXhhZGVjaW1hbFxuICAgIDogKCAgICAgICAgICAgICAgLy8gb3Igb3RoZXJ3aXNlIGEgY29uY2F0ZW5hdGVkIHN0cmluZzpcbiAgICAgIFsxZTddICsgICAgICAgIC8vIDEwMDAwMDAwICtcbiAgICAgIC0xZTMgKyAgICAgICAgIC8vIC0xMDAwICtcbiAgICAgIC00ZTMgKyAgICAgICAgIC8vIC00MDAwICtcbiAgICAgIC04ZTMgKyAgICAgICAgIC8vIC04MDAwMDAwMCArXG4gICAgICAtMWUxMSAgICAgICAgICAvLyAtMTAwMDAwMDAwMDAwLFxuICAgICAgKS5yZXBsYWNlKCAgICAgLy8gcmVwbGFjaW5nXG4gICAgICAgIC9bMDE4XS9nLCAgICAvLyB6ZXJvZXMsIG9uZXMsIGFuZCBlaWdodHMgd2l0aFxuICAgICAgICB1dWlkICAgICAgICAgLy8gcmFuZG9tIGhleCBkaWdpdHNcbiAgICAgIClcbn07IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIFwibmFtZVwiOiBcImFuYWx5dGljcy1jb3JlXCIsXG4gIFwidmVyc2lvblwiOiBcIjIuMTAuMFwiLFxuICBcIm1haW5cIjogXCJhbmFseXRpY3MuanNcIixcbiAgXCJkZXBlbmRlbmNpZXNcIjoge30sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHt9XG59XG47IiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGJpbmQgPSByZXF1aXJlKCdiaW5kJyk7XG52YXIgY2xvbmUgPSByZXF1aXJlKCdjbG9uZScpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2RlZmF1bHRzJyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG52YXIgc2x1ZyA9IHJlcXVpcmUoJ3NsdWcnKTtcbnZhciBwcm90b3MgPSByZXF1aXJlKCcuL3Byb3RvcycpO1xudmFyIHN0YXRpY3MgPSByZXF1aXJlKCcuL3N0YXRpY3MnKTtcblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgYEludGVncmF0aW9uYCBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBAY29uc3RydWN0cyBJbnRlZ3JhdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBJbnRlZ3JhdGlvblxuICovXG5cbmZ1bmN0aW9uIGNyZWF0ZUludGVncmF0aW9uKG5hbWUpe1xuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhIG5ldyBgSW50ZWdyYXRpb25gLlxuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICovXG5cbiAgZnVuY3Rpb24gSW50ZWdyYXRpb24ob3B0aW9ucyl7XG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5hZGRJbnRlZ3JhdGlvbikge1xuICAgICAgLy8gcGx1Z2luXG4gICAgICByZXR1cm4gb3B0aW9ucy5hZGRJbnRlZ3JhdGlvbihJbnRlZ3JhdGlvbik7XG4gICAgfVxuICAgIHRoaXMuZGVidWcgPSBkZWJ1ZygnYW5hbHl0aWNzOmludGVncmF0aW9uOicgKyBzbHVnKG5hbWUpKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBkZWZhdWx0cyhjbG9uZShvcHRpb25zKSB8fCB7fSwgdGhpcy5kZWZhdWx0cyk7XG4gICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICB0aGlzLm9uY2UoJ3JlYWR5JywgYmluZCh0aGlzLCB0aGlzLmZsdXNoKSk7XG5cbiAgICBJbnRlZ3JhdGlvbi5lbWl0KCdjb25zdHJ1Y3QnLCB0aGlzKTtcbiAgICB0aGlzLnJlYWR5ID0gYmluZCh0aGlzLCB0aGlzLnJlYWR5KTtcbiAgICB0aGlzLl93cmFwSW5pdGlhbGl6ZSgpO1xuICAgIHRoaXMuX3dyYXBQYWdlKCk7XG4gICAgdGhpcy5fd3JhcFRyYWNrKCk7XG4gIH1cblxuICBJbnRlZ3JhdGlvbi5wcm90b3R5cGUuZGVmYXVsdHMgPSB7fTtcbiAgSW50ZWdyYXRpb24ucHJvdG90eXBlLmdsb2JhbHMgPSBbXTtcbiAgSW50ZWdyYXRpb24ucHJvdG90eXBlLnRlbXBsYXRlcyA9IHt9O1xuICBJbnRlZ3JhdGlvbi5wcm90b3R5cGUubmFtZSA9IG5hbWU7XG4gIGV4dGVuZChJbnRlZ3JhdGlvbiwgc3RhdGljcyk7XG4gIGV4dGVuZChJbnRlZ3JhdGlvbi5wcm90b3R5cGUsIHByb3Rvcyk7XG5cbiAgcmV0dXJuIEludGVncmF0aW9uO1xufVxuXG4vKipcbiAqIEV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVJbnRlZ3JhdGlvbjtcbiIsIlxudmFyIGJpbmQgPSByZXF1aXJlKCdiaW5kJylcbiAgLCBiaW5kQWxsID0gcmVxdWlyZSgnYmluZC1hbGwnKTtcblxuXG4vKipcbiAqIEV4cG9zZSBgYmluZGAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gYmluZDtcblxuXG4vKipcbiAqIEV4cG9zZSBgYmluZEFsbGAuXG4gKi9cblxuZXhwb3J0cy5hbGwgPSBiaW5kQWxsO1xuXG5cbi8qKlxuICogRXhwb3NlIGBiaW5kTWV0aG9kc2AuXG4gKi9cblxuZXhwb3J0cy5tZXRob2RzID0gYmluZE1ldGhvZHM7XG5cblxuLyoqXG4gKiBCaW5kIGBtZXRob2RzYCBvbiBgb2JqYCB0byBhbHdheXMgYmUgY2FsbGVkIHdpdGggdGhlIGBvYmpgIGFzIGNvbnRleHQuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZHMuLi5cbiAqL1xuXG5mdW5jdGlvbiBiaW5kTWV0aG9kcyAob2JqLCBtZXRob2RzKSB7XG4gIG1ldGhvZHMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gIGZvciAodmFyIGkgPSAwLCBtZXRob2Q7IG1ldGhvZCA9IG1ldGhvZHNbaV07IGkrKykge1xuICAgIG9ialttZXRob2RdID0gYmluZChvYmosIG9ialttZXRob2RdKTtcbiAgfVxuICByZXR1cm4gb2JqO1xufSIsImlmICgndW5kZWZpbmVkJyA9PSB0eXBlb2Ygd2luZG93KSB7XG4gIG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvZGVidWcnKTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xufVxuIiwiLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0dHkgPSByZXF1aXJlKCd0dHknKTtcblxuLyoqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcblxuLyoqXG4gKiBFbmFibGVkIGRlYnVnZ2Vycy5cbiAqL1xuXG52YXIgbmFtZXMgPSBbXVxuICAsIHNraXBzID0gW107XG5cbihwcm9jZXNzLmVudi5ERUJVRyB8fCAnJylcbiAgLnNwbGl0KC9bXFxzLF0rLylcbiAgLmZvckVhY2goZnVuY3Rpb24obmFtZSl7XG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgnKicsICcuKj8nKTtcbiAgICBpZiAobmFtZVswXSA9PT0gJy0nKSB7XG4gICAgICBza2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZS5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWUgKyAnJCcpKTtcbiAgICB9XG4gIH0pO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG52YXIgY29sb3JzID0gWzYsIDIsIDMsIDQsIDUsIDFdO1xuXG4vKipcbiAqIFByZXZpb3VzIGRlYnVnKCkgY2FsbC5cbiAqL1xuXG52YXIgcHJldiA9IHt9O1xuXG4vKipcbiAqIFByZXZpb3VzbHkgYXNzaWduZWQgY29sb3IuXG4gKi9cblxudmFyIHByZXZDb2xvciA9IDA7XG5cbi8qKlxuICogSXMgc3Rkb3V0IGEgVFRZPyBDb2xvcmVkIG91dHB1dCBpcyBkaXNhYmxlZCB3aGVuIGB0cnVlYC5cbiAqL1xuXG52YXIgaXNhdHR5ID0gdHR5LmlzYXR0eSgyKTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb2xvcigpIHtcbiAgcmV0dXJuIGNvbG9yc1twcmV2Q29sb3IrKyAlIGNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIEh1bWFuaXplIHRoZSBnaXZlbiBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBodW1hbml6ZShtcykge1xuICB2YXIgc2VjID0gMTAwMFxuICAgICwgbWluID0gNjAgKiAxMDAwXG4gICAgLCBob3VyID0gNjAgKiBtaW47XG5cbiAgaWYgKG1zID49IGhvdXIpIHJldHVybiAobXMgLyBob3VyKS50b0ZpeGVkKDEpICsgJ2gnO1xuICBpZiAobXMgPj0gbWluKSByZXR1cm4gKG1zIC8gbWluKS50b0ZpeGVkKDEpICsgJ20nO1xuICBpZiAobXMgPj0gc2VjKSByZXR1cm4gKG1zIC8gc2VjIHwgMCkgKyAncyc7XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtUeXBlfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lKSB7XG4gIGZ1bmN0aW9uIGRpc2FibGVkKCl7fVxuICBkaXNhYmxlZC5lbmFibGVkID0gZmFsc2U7XG5cbiAgdmFyIG1hdGNoID0gc2tpcHMuc29tZShmdW5jdGlvbihyZSl7XG4gICAgcmV0dXJuIHJlLnRlc3QobmFtZSk7XG4gIH0pO1xuXG4gIGlmIChtYXRjaCkgcmV0dXJuIGRpc2FibGVkO1xuXG4gIG1hdGNoID0gbmFtZXMuc29tZShmdW5jdGlvbihyZSl7XG4gICAgcmV0dXJuIHJlLnRlc3QobmFtZSk7XG4gIH0pO1xuXG4gIGlmICghbWF0Y2gpIHJldHVybiBkaXNhYmxlZDtcbiAgdmFyIGMgPSBjb2xvcigpO1xuXG4gIGZ1bmN0aW9uIGNvbG9yZWQoZm10KSB7XG4gICAgZm10ID0gY29lcmNlKGZtdCk7XG5cbiAgICB2YXIgY3VyciA9IG5ldyBEYXRlO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldltuYW1lXSB8fCBjdXJyKTtcbiAgICBwcmV2W25hbWVdID0gY3VycjtcblxuICAgIGZtdCA9ICcgIFxcdTAwMWJbOScgKyBjICsgJ20nICsgbmFtZSArICcgJ1xuICAgICAgKyAnXFx1MDAxYlszJyArIGMgKyAnbVxcdTAwMWJbOTBtJ1xuICAgICAgKyBmbXQgKyAnXFx1MDAxYlszJyArIGMgKyAnbSdcbiAgICAgICsgJyArJyArIGh1bWFuaXplKG1zKSArICdcXHUwMDFiWzBtJztcblxuICAgIGNvbnNvbGUuZXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBsYWluKGZtdCkge1xuICAgIGZtdCA9IGNvZXJjZShmbXQpO1xuXG4gICAgZm10ID0gbmV3IERhdGUoKS50b1VUQ1N0cmluZygpXG4gICAgICArICcgJyArIG5hbWUgKyAnICcgKyBmbXQ7XG4gICAgY29uc29sZS5lcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgY29sb3JlZC5lbmFibGVkID0gcGxhaW4uZW5hYmxlZCA9IHRydWU7XG5cbiAgcmV0dXJuIGlzYXR0eSB8fCBwcm9jZXNzLmVudi5ERUJVR19DT0xPUlNcbiAgICA/IGNvbG9yZWRcbiAgICA6IHBsYWluO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cbiIsIlxuLyoqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge1R5cGV9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRlYnVnKG5hbWUpIHtcbiAgaWYgKCFkZWJ1Zy5lbmFibGVkKG5hbWUpKSByZXR1cm4gZnVuY3Rpb24oKXt9O1xuXG4gIHJldHVybiBmdW5jdGlvbihmbXQpe1xuICAgIGZtdCA9IGNvZXJjZShmbXQpO1xuXG4gICAgdmFyIGN1cnIgPSBuZXcgRGF0ZTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKGRlYnVnW25hbWVdIHx8IGN1cnIpO1xuICAgIGRlYnVnW25hbWVdID0gY3VycjtcblxuICAgIGZtdCA9IG5hbWVcbiAgICAgICsgJyAnXG4gICAgICArIGZtdFxuICAgICAgKyAnICsnICsgZGVidWcuaHVtYW5pemUobXMpO1xuXG4gICAgLy8gVGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRThcbiAgICAvLyB3aGVyZSBgY29uc29sZS5sb2dgIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gICAgd2luZG93LmNvbnNvbGVcbiAgICAgICYmIGNvbnNvbGUubG9nXG4gICAgICAmJiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbChjb25zb2xlLmxvZywgY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMuXG4gKi9cblxuZGVidWcubmFtZXMgPSBbXTtcbmRlYnVnLnNraXBzID0gW107XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZS4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5kZWJ1Zy5lbmFibGUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHRyeSB7XG4gICAgbG9jYWxTdG9yYWdlLmRlYnVnID0gbmFtZTtcbiAgfSBjYXRjaChlKXt9XG5cbiAgdmFyIHNwbGl0ID0gKG5hbWUgfHwgJycpLnNwbGl0KC9bXFxzLF0rLylcbiAgICAsIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgbmFtZSA9IHNwbGl0W2ldLnJlcGxhY2UoJyonLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVbMF0gPT09ICctJykge1xuICAgICAgZGVidWcuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWUuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZGVidWcubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWUgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogRGlzYWJsZSBkZWJ1ZyBvdXRwdXQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5kZWJ1Zy5kaXNhYmxlID0gZnVuY3Rpb24oKXtcbiAgZGVidWcuZW5hYmxlKCcnKTtcbn07XG5cbi8qKlxuICogSHVtYW5pemUgdGhlIGdpdmVuIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1cbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmRlYnVnLmh1bWFuaXplID0gZnVuY3Rpb24obXMpIHtcbiAgdmFyIHNlYyA9IDEwMDBcbiAgICAsIG1pbiA9IDYwICogMTAwMFxuICAgICwgaG91ciA9IDYwICogbWluO1xuXG4gIGlmIChtcyA+PSBob3VyKSByZXR1cm4gKG1zIC8gaG91cikudG9GaXhlZCgxKSArICdoJztcbiAgaWYgKG1zID49IG1pbikgcmV0dXJuIChtcyAvIG1pbikudG9GaXhlZCgxKSArICdtJztcbiAgaWYgKG1zID49IHNlYykgcmV0dXJuIChtcyAvIHNlYyB8IDApICsgJ3MnO1xuICByZXR1cm4gbXMgKyAnbXMnO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmRlYnVnLmVuYWJsZWQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBkZWJ1Zy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChkZWJ1Zy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBkZWJ1Zy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChkZWJ1Zy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG5cbi8vIHBlcnNpc3RcblxudHJ5IHtcbiAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2UpIGRlYnVnLmVuYWJsZShsb2NhbFN0b3JhZ2UuZGVidWcpO1xufSBjYXRjaChlKXt9XG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXh0ZW5kIChvYmplY3QpIHtcbiAgICAvLyBUYWtlcyBhbiB1bmxpbWl0ZWQgbnVtYmVyIG9mIGV4dGVuZGVycy5cbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAvLyBGb3IgZWFjaCBleHRlbmRlciwgY29weSB0aGVpciBwcm9wZXJ0aWVzIG9uIG91ciBvYmplY3QuXG4gICAgZm9yICh2YXIgaSA9IDAsIHNvdXJjZTsgc291cmNlID0gYXJnc1tpXTsgaSsrKSB7XG4gICAgICAgIGlmICghc291cmNlKSBjb250aW51ZTtcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBvYmplY3RbcHJvcGVydHldID0gc291cmNlW3Byb3BlcnR5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmplY3Q7XG59OyIsIlxuLyoqXG4gKiBHZW5lcmF0ZSBhIHNsdWcgZnJvbSB0aGUgZ2l2ZW4gYHN0cmAuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgZ2VuZXJhdGUoJ2ZvbyBiYXInKTtcbiAqICAgICAgICAvLyA+IGZvby1iYXJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQGNvbmZpZyB7U3RyaW5nfFJlZ0V4cH0gW3JlcGxhY2VdIGNoYXJhY3RlcnMgdG8gcmVwbGFjZSwgZGVmYXVsdGVkIHRvIGAvW15hLXowLTldL2dgXG4gKiBAY29uZmlnIHtTdHJpbmd9IFtzZXBhcmF0b3JdIHNlcGFyYXRvciB0byBpbnNlcnQsIGRlZmF1bHRlZCB0byBgLWBcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzdHIsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2Uob3B0aW9ucy5yZXBsYWNlIHx8IC9bXmEtejAtOV0vZywgJyAnKVxuICAgIC5yZXBsYWNlKC9eICt8ICskL2csICcnKVxuICAgIC5yZXBsYWNlKC8gKy9nLCBvcHRpb25zLnNlcGFyYXRvciB8fCAnLScpXG59O1xuIiwiLyogZ2xvYmFsIHNldEludGVydmFsOnRydWUgc2V0VGltZW91dDp0cnVlICovXG5cbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2VtaXR0ZXInKTtcbnZhciBhZnRlciA9IHJlcXVpcmUoJ2FmdGVyJyk7XG52YXIgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcbnZhciBldmVudHMgPSByZXF1aXJlKCdhbmFseXRpY3MtZXZlbnRzJyk7XG52YXIgZm10ID0gcmVxdWlyZSgnZm10Jyk7XG52YXIgZm9sZGwgPSByZXF1aXJlKCdmb2xkbCcpO1xudmFyIGxvYWRJZnJhbWUgPSByZXF1aXJlKCdsb2FkLWlmcmFtZScpO1xudmFyIGxvYWRTY3JpcHQgPSByZXF1aXJlKCdsb2FkLXNjcmlwdCcpO1xudmFyIG5vcm1hbGl6ZSA9IHJlcXVpcmUoJ3RvLW5vLWNhc2UnKTtcbnZhciBuZXh0VGljayA9IHJlcXVpcmUoJ25leHQtdGljaycpO1xudmFyIGV2ZXJ5ID0gcmVxdWlyZSgnZXZlcnknKTtcbnZhciBpcyA9IHJlcXVpcmUoJ2lzJyk7XG5cbi8qKlxuICogTm9vcC5cbiAqL1xuXG5mdW5jdGlvbiBub29wKCl7fVxuXG4vKipcbiAqIGhhc093blByb3BlcnR5IHJlZmVyZW5jZS5cbiAqL1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBXaW5kb3cgZGVmYXVsdHMuXG4gKi9cblxudmFyIG9uZXJyb3IgPSB3aW5kb3cub25lcnJvcjtcbnZhciBvbmxvYWQgPSBudWxsO1xudmFyIHNldEludGVydmFsID0gd2luZG93LnNldEludGVydmFsO1xudmFyIHNldFRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dDtcblxuLyoqXG4gKiBNaXhpbiBlbWl0dGVyLlxuICovXG5cbi8qIGVzbGludC1kaXNhYmxlIG5ldy1jYXAgKi9cbkVtaXR0ZXIoZXhwb3J0cyk7XG4vKiBlc2xpbnQtZW5hYmxlIG5ldy1jYXAgKi9cblxuLyoqXG4gKiBJbml0aWFsaXplLlxuICovXG5cbmV4cG9ydHMuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCl7XG4gIHZhciByZWFkeSA9IHRoaXMucmVhZHk7XG4gIG5leHRUaWNrKHJlYWR5KTtcbn07XG5cbi8qKlxuICogTG9hZGVkP1xuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuXG5leHBvcnRzLmxvYWRlZCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogUGFnZS5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtQYWdlfSBwYWdlXG4gKi9cblxuLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbmV4cG9ydHMucGFnZSA9IGZ1bmN0aW9uKHBhZ2Upe307XG4vKiBlc2xpbnQtZW5hYmxlIG5vLXVudXNlZC12YXJzICovXG5cbi8qKlxuICogVHJhY2suXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEBwYXJhbSB7VHJhY2t9IHRyYWNrXG4gKi9cblxuLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbmV4cG9ydHMudHJhY2sgPSBmdW5jdGlvbih0cmFjayl7fTtcbi8qIGVzbGludC1lbmFibGUgbm8tdW51c2VkLXZhcnMgKi9cblxuLyoqXG4gKiBHZXQgdmFsdWVzIGZyb20gaXRlbXMgaW4gYG9wdGlvbnNgIHRoYXQgYXJlIG1hcHBlZCB0byBga2V5YC5cbiAqIGBvcHRpb25zYCBpcyBhbiBpbnRlZ3JhdGlvbiBzZXR0aW5nIHdoaWNoIGlzIGEgY29sbGVjdGlvblxuICogb2YgdHlwZSAnbWFwJywgJ2FycmF5Jywgb3IgJ21peGVkJ1xuICpcbiAqIFVzZSBjYXNlcyBpbmNsdWRlIG1hcHBpbmcgZXZlbnRzIHRvIHBpeGVsSWRzIChtYXApLCBzZW5kaW5nIGdlbmVyaWNcbiAqIGNvbnZlcnNpb24gcGl4ZWxzIG9ubHkgZm9yIHNwZWNpZmljIGV2ZW50cyAoYXJyYXkpLCBvciBjb25maWd1cmluZyBkeW5hbWljXG4gKiBtYXBwaW5ncyBvZiBldmVudCBwcm9wZXJ0aWVzIHRvIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXJzIGJhc2VkIG9uIGV2ZW50IChtaXhlZClcbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtPYmplY3R8T2JqZWN0W118U3RyaW5nW119IG9wdGlvbnMgQW4gb2JqZWN0LCBhcnJheSBvZiBvYmplY3RzLCBvclxuICogYXJyYXkgb2Ygc3RyaW5ncyBwdWxsZWQgZnJvbSBzZXR0aW5ncy5tYXBwaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUgbmFtZSBvZiB0aGUgaXRlbSBpbiBvcHRpb25zIHdob3NlIG1ldGFkYXRhXG4gKiB3ZSdyZSBsb29raW5nIGZvci5cbiAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSBvZiBzZXR0aW5ncyB0aGF0IG1hdGNoIHRoZSBpbnB1dCBga2V5YCBuYW1lLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyAnTWFwJ1xuICogdmFyIGV2ZW50cyA9IHsgbXlfZXZlbnQ6ICdhNDk5MWI4OCcgfTtcbiAqIC5tYXAoZXZlbnRzLCAnTXkgRXZlbnQnKTtcbiAqIC8vID0+IFtcImE0OTkxYjg4XCJdXG4gKiAubWFwKGV2ZW50cywgJ3doYXRldmVyJyk7XG4gKiAvLyA9PiBbXVxuICpcbiAqIC8vICdBcnJheSdcbiAqICogdmFyIGV2ZW50cyA9IFsnQ29tcGxldGVkIE9yZGVyJywgJ015IEV2ZW50J107XG4gKiAubWFwKGV2ZW50cywgJ015IEV2ZW50Jyk7XG4gKiAvLyA9PiBbXCJNeSBFdmVudFwiXVxuICogLm1hcChldmVudHMsICd3aGF0ZXZlcicpO1xuICogLy8gPT4gW11cbiAqXG4gKiAvLyAnTWl4ZWQnXG4gKiB2YXIgZXZlbnRzID0gW3sga2V5OiAnbXkgZXZlbnQnLCB2YWx1ZTogJzliNWViMWZhJyB9XTtcbiAqIC5tYXAoZXZlbnRzLCAnbXlfZXZlbnQnKTtcbiAqIC8vID0+IFtcIjliNWViMWZhXCJdXG4gKiAubWFwKGV2ZW50cywgJ3doYXRldmVyJyk7XG4gKiAvLyA9PiBbXVxuICovXG5cbmV4cG9ydHMubWFwID0gZnVuY3Rpb24ob3B0aW9ucywga2V5KXtcbiAgdmFyIG5vcm1hbGl6ZWRDb21wYXJhdG9yID0gbm9ybWFsaXplKGtleSk7XG4gIHZhciBtYXBwaW5nVHlwZSA9IGdldE1hcHBpbmdUeXBlKG9wdGlvbnMpO1xuXG4gIGlmIChtYXBwaW5nVHlwZSA9PT0gJ3Vua25vd24nKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIGZvbGRsKGZ1bmN0aW9uKG1hdGNoaW5nVmFsdWVzLCB2YWwsIGtleSkge1xuICAgIHZhciBjb21wYXJlO1xuICAgIHZhciByZXN1bHQ7XG5cbiAgICBpZiAobWFwcGluZ1R5cGUgPT09ICdtYXAnKSB7XG4gICAgICBjb21wYXJlID0ga2V5O1xuICAgICAgcmVzdWx0ID0gdmFsO1xuICAgIH1cblxuICAgIGlmIChtYXBwaW5nVHlwZSA9PT0gJ2FycmF5Jykge1xuICAgICAgY29tcGFyZSA9IHZhbDtcbiAgICAgIHJlc3VsdCA9IHZhbDtcbiAgICB9XG5cbiAgICBpZiAobWFwcGluZ1R5cGUgPT09ICdtaXhlZCcpIHtcbiAgICAgIGNvbXBhcmUgPSB2YWwua2V5O1xuICAgICAgcmVzdWx0ID0gdmFsLnZhbHVlO1xuICAgIH1cblxuICAgIGlmIChub3JtYWxpemUoY29tcGFyZSkgPT09IG5vcm1hbGl6ZWRDb21wYXJhdG9yKSB7XG4gICAgICBtYXRjaGluZ1ZhbHVlcy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoaW5nVmFsdWVzO1xuICB9LCBbXSwgb3B0aW9ucyk7XG59O1xuXG4vKipcbiAqIEludm9rZSBhIGBtZXRob2RgIHRoYXQgbWF5IG9yIG1heSBub3QgZXhpc3Qgb24gdGhlIHByb3RvdHlwZSB3aXRoIGBhcmdzYCxcbiAqIHF1ZXVlaW5nIG9yIG5vdCBkZXBlbmRpbmcgb24gd2hldGhlciB0aGUgaW50ZWdyYXRpb24gaXMgXCJyZWFkeVwiLiBEb24ndFxuICogdHJ1c3QgdGhlIG1ldGhvZCBjYWxsLCBzaW5jZSBpdCBjb250YWlucyBpbnRlZ3JhdGlvbiBwYXJ0eSBjb2RlLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZFxuICogQHBhcmFtIHsuLi4qfSBhcmdzXG4gKi9cblxuZXhwb3J0cy5pbnZva2UgPSBmdW5jdGlvbihtZXRob2Qpe1xuICBpZiAoIXRoaXNbbWV0aG9kXSkgcmV0dXJuO1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gIGlmICghdGhpcy5fcmVhZHkpIHJldHVybiB0aGlzLnF1ZXVlKG1ldGhvZCwgYXJncyk7XG4gIHZhciByZXQ7XG5cbiAgdHJ5IHtcbiAgICB0aGlzLmRlYnVnKCclcyB3aXRoICVvJywgbWV0aG9kLCBhcmdzKTtcbiAgICByZXQgPSB0aGlzW21ldGhvZF0uYXBwbHkodGhpcywgYXJncyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aGlzLmRlYnVnKCdlcnJvciAlbyBjYWxsaW5nICVzIHdpdGggJW8nLCBlLCBtZXRob2QsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn07XG5cbi8qKlxuICogUXVldWUgYSBgbWV0aG9kYCB3aXRoIGBhcmdzYC4gSWYgdGhlIGludGVncmF0aW9uIGFzc3VtZXMgYW4gaW5pdGlhbFxuICogcGFnZXZpZXcsIHRoZW4gbGV0IHRoZSBmaXJzdCBjYWxsIHRvIGBwYWdlYCBwYXNzIHRocm91Z2guXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kXG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzXG4gKi9cblxuZXhwb3J0cy5xdWV1ZSA9IGZ1bmN0aW9uKG1ldGhvZCwgYXJncyl7XG4gIGlmIChtZXRob2QgPT09ICdwYWdlJyAmJiB0aGlzLl9hc3N1bWVzUGFnZXZpZXcgJiYgIXRoaXMuX2luaXRpYWxpemVkKSB7XG4gICAgcmV0dXJuIHRoaXMucGFnZS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHRoaXMuX3F1ZXVlLnB1c2goeyBtZXRob2Q6IG1ldGhvZCwgYXJnczogYXJncyB9KTtcbn07XG5cbi8qKlxuICogRmx1c2ggdGhlIGludGVybmFsIHF1ZXVlLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMuZmx1c2ggPSBmdW5jdGlvbigpe1xuICB0aGlzLl9yZWFkeSA9IHRydWU7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBlYWNoKHRoaXMuX3F1ZXVlLCBmdW5jdGlvbihjYWxsKXtcbiAgICBzZWxmW2NhbGwubWV0aG9kXS5hcHBseShzZWxmLCBjYWxsLmFyZ3MpO1xuICB9KTtcblxuICAvLyBFbXB0eSB0aGUgcXVldWUuXG4gIHRoaXMuX3F1ZXVlLmxlbmd0aCA9IDA7XG59O1xuXG4vKipcbiAqIFJlc2V0IHRoZSBpbnRlZ3JhdGlvbiwgcmVtb3ZpbmcgaXRzIGdsb2JhbCB2YXJpYWJsZXMuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5yZXNldCA9IGZ1bmN0aW9uKCl7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5nbG9iYWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgd2luZG93W3RoaXMuZ2xvYmFsc1tpXV0gPSB1bmRlZmluZWQ7XG4gIH1cblxuICB3aW5kb3cuc2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gIHdpbmRvdy5zZXRJbnRlcnZhbCA9IHNldEludGVydmFsO1xuICB3aW5kb3cub25lcnJvciA9IG9uZXJyb3I7XG4gIHdpbmRvdy5vbmxvYWQgPSBvbmxvYWQ7XG59O1xuXG4vKipcbiAqIExvYWQgYSB0YWcgYnkgYG5hbWVgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSB0YWcuXG4gKiBAcGFyYW0ge09iamVjdH0gbG9jYWxzIExvY2FscyB1c2VkIHRvIHBvcHVsYXRlIHRoZSB0YWcncyB0ZW1wbGF0ZSB2YXJpYWJsZXNcbiAqIChlLmcuIGB1c2VySWRgIGluICc8aW1nIHNyYz1cImh0dHBzOi8vd2hhdGV2ZXIuY29tL3t7IHVzZXJJZCB9fVwiPicpLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrPW5vb3BdIEEgY2FsbGJhY2ssIGludm9rZWQgd2hlbiB0aGUgdGFnIGZpbmlzaGVzXG4gKiBsb2FkaW5nLlxuICovXG5cbmV4cG9ydHMubG9hZCA9IGZ1bmN0aW9uKG5hbWUsIGxvY2FscywgY2FsbGJhY2spe1xuICAvLyBBcmd1bWVudCBzaHVmZmxpbmdcbiAgaWYgKHR5cGVvZiBuYW1lID09PSAnZnVuY3Rpb24nKSB7IGNhbGxiYWNrID0gbmFtZTsgbG9jYWxzID0gbnVsbDsgbmFtZSA9IG51bGw7IH1cbiAgaWYgKG5hbWUgJiYgdHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7IGNhbGxiYWNrID0gbG9jYWxzOyBsb2NhbHMgPSBuYW1lOyBuYW1lID0gbnVsbDsgfVxuICBpZiAodHlwZW9mIGxvY2FscyA9PT0gJ2Z1bmN0aW9uJykgeyBjYWxsYmFjayA9IGxvY2FsczsgbG9jYWxzID0gbnVsbDsgfVxuXG4gIC8vIERlZmF1bHQgYXJndW1lbnRzXG4gIG5hbWUgPSBuYW1lIHx8ICdsaWJyYXJ5JztcbiAgbG9jYWxzID0gbG9jYWxzIHx8IHt9O1xuXG4gIGxvY2FscyA9IHRoaXMubG9jYWxzKGxvY2Fscyk7XG4gIHZhciB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGVzW25hbWVdO1xuICBpZiAoIXRlbXBsYXRlKSB0aHJvdyBuZXcgRXJyb3IoZm10KCd0ZW1wbGF0ZSBcIiVzXCIgbm90IGRlZmluZWQuJywgbmFtZSkpO1xuICB2YXIgYXR0cnMgPSByZW5kZXIodGVtcGxhdGUsIGxvY2Fscyk7XG4gIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgZWw7XG5cbiAgc3dpdGNoICh0ZW1wbGF0ZS50eXBlKSB7XG4gICAgY2FzZSAnaW1nJzpcbiAgICAgIGF0dHJzLndpZHRoID0gMTtcbiAgICAgIGF0dHJzLmhlaWdodCA9IDE7XG4gICAgICBlbCA9IGxvYWRJbWFnZShhdHRycywgY2FsbGJhY2spO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnc2NyaXB0JzpcbiAgICAgIGVsID0gbG9hZFNjcmlwdChhdHRycywgZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgaWYgKCFlcnIpIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICBzZWxmLmRlYnVnKCdlcnJvciBsb2FkaW5nIFwiJXNcIiBlcnJvcj1cIiVzXCInLCBzZWxmLm5hbWUsIGVycik7XG4gICAgICB9KTtcbiAgICAgIC8vIFRPRE86IGhhY2sgdW50aWwgcmVmYWN0b3JpbmcgbG9hZC1zY3JpcHRcbiAgICAgIGRlbGV0ZSBhdHRycy5zcmM7XG4gICAgICBlYWNoKGF0dHJzLCBmdW5jdGlvbihrZXksIHZhbCl7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShrZXksIHZhbCk7XG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICBlbCA9IGxvYWRJZnJhbWUoYXR0cnMsIGNhbGxiYWNrKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBObyBkZWZhdWx0IGNhc2VcbiAgfVxuXG4gIHJldHVybiBlbDtcbn07XG5cbi8qKlxuICogTG9jYWxzIGZvciB0YWcgdGVtcGxhdGVzLlxuICpcbiAqIEJ5IGRlZmF1bHQgaXQgaW5jbHVkZXMgYSBjYWNoZSBidXN0ZXIgYW5kIGFsbCBvZiB0aGUgb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gW2xvY2Fsc11cbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5leHBvcnRzLmxvY2FscyA9IGZ1bmN0aW9uKGxvY2Fscyl7XG4gIGxvY2FscyA9IGxvY2FscyB8fCB7fTtcbiAgdmFyIGNhY2hlID0gTWF0aC5mbG9vcihuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDM2MDAwMDApO1xuICBpZiAoIWxvY2Fscy5oYXNPd25Qcm9wZXJ0eSgnY2FjaGUnKSkgbG9jYWxzLmNhY2hlID0gY2FjaGU7XG4gIGVhY2godGhpcy5vcHRpb25zLCBmdW5jdGlvbihrZXksIHZhbCl7XG4gICAgaWYgKCFsb2NhbHMuaGFzT3duUHJvcGVydHkoa2V5KSkgbG9jYWxzW2tleV0gPSB2YWw7XG4gIH0pO1xuICByZXR1cm4gbG9jYWxzO1xufTtcblxuLyoqXG4gKiBTaW1wbGUgd2F5IHRvIGVtaXQgcmVhZHkuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnJlYWR5ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5lbWl0KCdyZWFkeScpO1xufTtcblxuLyoqXG4gKiBXcmFwIHRoZSBpbml0aWFsaXplIG1ldGhvZCBpbiBhbiBleGlzdHMgY2hlY2ssIHNvIHdlIGRvbid0IGhhdmUgdG8gZG8gaXQgZm9yXG4gKiBldmVyeSBzaW5nbGUgaW50ZWdyYXRpb24uXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5fd3JhcEluaXRpYWxpemUgPSBmdW5jdGlvbigpe1xuICB2YXIgaW5pdGlhbGl6ZSA9IHRoaXMuaW5pdGlhbGl6ZTtcbiAgdGhpcy5pbml0aWFsaXplID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmRlYnVnKCdpbml0aWFsaXplJyk7XG4gICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIHZhciByZXQgPSBpbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdGhpcy5lbWl0KCdpbml0aWFsaXplJyk7XG4gICAgcmV0dXJuIHJldDtcbiAgfTtcblxuICBpZiAodGhpcy5fYXNzdW1lc1BhZ2V2aWV3KSB0aGlzLmluaXRpYWxpemUgPSBhZnRlcigyLCB0aGlzLmluaXRpYWxpemUpO1xufTtcblxuLyoqXG4gKiBXcmFwIHRoZSBwYWdlIG1ldGhvZCB0byBjYWxsIGBpbml0aWFsaXplYCBpbnN0ZWFkIGlmIHRoZSBpbnRlZ3JhdGlvbiBhc3N1bWVzXG4gKiBhIHBhZ2V2aWV3LlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMuX3dyYXBQYWdlID0gZnVuY3Rpb24oKXtcbiAgdmFyIHBhZ2UgPSB0aGlzLnBhZ2U7XG4gIHRoaXMucGFnZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYgKHRoaXMuX2Fzc3VtZXNQYWdldmlldyAmJiAhdGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFnZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xufTtcblxuLyoqXG4gKiBXcmFwIHRoZSB0cmFjayBtZXRob2QgdG8gY2FsbCBvdGhlciBlY29tbWVyY2UgbWV0aG9kcyBpZiBhdmFpbGFibGUgZGVwZW5kaW5nXG4gKiBvbiB0aGUgYHRyYWNrLmV2ZW50KClgLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMuX3dyYXBUcmFjayA9IGZ1bmN0aW9uKCl7XG4gIHZhciB0ID0gdGhpcy50cmFjaztcbiAgdGhpcy50cmFjayA9IGZ1bmN0aW9uKHRyYWNrKXtcbiAgICB2YXIgZXZlbnQgPSB0cmFjay5ldmVudCgpO1xuICAgIHZhciBjYWxsZWQ7XG4gICAgdmFyIHJldDtcblxuICAgIGZvciAodmFyIG1ldGhvZCBpbiBldmVudHMpIHtcbiAgICAgIGlmIChoYXMuY2FsbChldmVudHMsIG1ldGhvZCkpIHtcbiAgICAgICAgdmFyIHJlZ2V4cCA9IGV2ZW50c1ttZXRob2RdO1xuICAgICAgICBpZiAoIXRoaXNbbWV0aG9kXSkgY29udGludWU7XG4gICAgICAgIGlmICghcmVnZXhwLnRlc3QoZXZlbnQpKSBjb250aW51ZTtcbiAgICAgICAgcmV0ID0gdGhpc1ttZXRob2RdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghY2FsbGVkKSByZXQgPSB0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIHJldDtcbiAgfTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lIHRoZSB0eXBlIG9mIHRoZSBvcHRpb24gcGFzc2VkIHRvIGAjbWFwYFxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R8T2JqZWN0W119IG1hcHBpbmdcbiAqIEByZXR1cm4ge1N0cmluZ30gbWFwcGluZ1R5cGVcbiAqL1xuXG5mdW5jdGlvbiBnZXRNYXBwaW5nVHlwZShtYXBwaW5nKSB7XG4gIGlmIChpcy5hcnJheShtYXBwaW5nKSkge1xuICAgIHJldHVybiBldmVyeShpc01peGVkLCBtYXBwaW5nKSA/ICdtaXhlZCcgOiAnYXJyYXknO1xuICB9XG4gIGlmIChpcy5vYmplY3QobWFwcGluZykpIHJldHVybiAnbWFwJztcbiAgcmV0dXJuICd1bmtub3duJztcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgaXRlbSBpbiBtYXBwaW5nIGFycmF5IGlzIGEgdmFsaWQgXCJtaXhlZFwiIHR5cGUgdmFsdWVcbiAqXG4gKiBNdXN0IGJlIGFuIG9iamVjdCB3aXRoIHByb3BlcnRpZXMgXCJrZXlcIiAob2YgdHlwZSBzdHJpbmcpXG4gKiBhbmQgXCJ2YWx1ZVwiIChvZiBhbnkgdHlwZSlcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gaXRlbVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5mdW5jdGlvbiBpc01peGVkKGl0ZW0pIHtcbiAgaWYgKCFpcy5vYmplY3QoaXRlbSkpIHJldHVybiBmYWxzZTtcbiAgaWYgKCFpcy5zdHJpbmcoaXRlbS5rZXkpKSByZXR1cm4gZmFsc2U7XG4gIGlmICghaGFzLmNhbGwoaXRlbSwgJ3ZhbHVlJykpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogVE9ETzogRG9jdW1lbnQgbWVcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0ltYWdlfVxuICovXG5cbmZ1bmN0aW9uIGxvYWRJbWFnZShhdHRycywgZm4pe1xuICBmbiA9IGZuIHx8IGZ1bmN0aW9uKCl7fTtcbiAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuICBpbWcub25lcnJvciA9IGVycm9yKGZuLCAnZmFpbGVkIHRvIGxvYWQgcGl4ZWwnLCBpbWcpO1xuICBpbWcub25sb2FkID0gZnVuY3Rpb24oKXsgZm4oKTsgfTtcbiAgaW1nLnNyYyA9IGF0dHJzLnNyYztcbiAgaW1nLndpZHRoID0gMTtcbiAgaW1nLmhlaWdodCA9IDE7XG4gIHJldHVybiBpbWc7XG59XG5cbi8qKlxuICogVE9ETzogRG9jdW1lbnQgbWVcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICogQHBhcmFtIHtFbGVtZW50fSBpbWdcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmZ1bmN0aW9uIGVycm9yKGZuLCBtZXNzYWdlLCBpbWcpe1xuICByZXR1cm4gZnVuY3Rpb24oZSl7XG4gICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgZXJyLmV2ZW50ID0gZTtcbiAgICBlcnIuc291cmNlID0gaW1nO1xuICAgIGZuKGVycik7XG4gIH07XG59XG5cbi8qKlxuICogUmVuZGVyIHRlbXBsYXRlICsgbG9jYWxzIGludG8gYW4gYGF0dHJzYCBvYmplY3QuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gdGVtcGxhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBsb2NhbHNcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5mdW5jdGlvbiByZW5kZXIodGVtcGxhdGUsIGxvY2Fscyl7XG4gIHJldHVybiBmb2xkbChmdW5jdGlvbihhdHRycywgdmFsLCBrZXkpIHtcbiAgICBhdHRyc1trZXldID0gdmFsLnJlcGxhY2UoL1xce1xce1xcICooXFx3KylcXCAqXFx9XFx9L2csIGZ1bmN0aW9uKF8sICQxKXtcbiAgICAgIHJldHVybiBsb2NhbHNbJDFdO1xuICAgIH0pO1xuICAgIHJldHVybiBhdHRycztcbiAgfSwge30sIHRlbXBsYXRlLmF0dHJzKTtcbn1cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnRyeSB7XG4gIHZhciB0eXBlID0gcmVxdWlyZSgndHlwZScpO1xufSBjYXRjaCAoZXJyKSB7XG4gIHZhciB0eXBlID0gcmVxdWlyZSgnY29tcG9uZW50LXR5cGUnKTtcbn1cblxudmFyIHRvRnVuY3Rpb24gPSByZXF1aXJlKCd0by1mdW5jdGlvbicpO1xuXG4vKipcbiAqIEhPUCByZWZlcmVuY2UuXG4gKi9cblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogSXRlcmF0ZSB0aGUgZ2l2ZW4gYG9iamAgYW5kIGludm9rZSBgZm4odmFsLCBpKWBcbiAqIGluIG9wdGlvbmFsIGNvbnRleHQgYGN0eGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8QXJyYXl8T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge09iamVjdH0gW2N0eF1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIGZuLCBjdHgpe1xuICBmbiA9IHRvRnVuY3Rpb24oZm4pO1xuICBjdHggPSBjdHggfHwgdGhpcztcbiAgc3dpdGNoICh0eXBlKG9iaikpIHtcbiAgICBjYXNlICdhcnJheSc6XG4gICAgICByZXR1cm4gYXJyYXkob2JqLCBmbiwgY3R4KTtcbiAgICBjYXNlICdvYmplY3QnOlxuICAgICAgaWYgKCdudW1iZXInID09IHR5cGVvZiBvYmoubGVuZ3RoKSByZXR1cm4gYXJyYXkob2JqLCBmbiwgY3R4KTtcbiAgICAgIHJldHVybiBvYmplY3Qob2JqLCBmbiwgY3R4KTtcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuIHN0cmluZyhvYmosIGZuLCBjdHgpO1xuICB9XG59O1xuXG4vKipcbiAqIEl0ZXJhdGUgc3RyaW5nIGNoYXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzdHJpbmcob2JqLCBmbiwgY3R4KSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgKytpKSB7XG4gICAgZm4uY2FsbChjdHgsIG9iai5jaGFyQXQoaSksIGkpO1xuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZSBvYmplY3Qga2V5cy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtPYmplY3R9IGN0eFxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gb2JqZWN0KG9iaiwgZm4sIGN0eCkge1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgZm4uY2FsbChjdHgsIGtleSwgb2JqW2tleV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGUgYXJyYXktaXNoLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBhcnJheShvYmosIGZuLCBjdHgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyArK2kpIHtcbiAgICBmbi5jYWxsKGN0eCwgb2JqW2ldLCBpKTtcbiAgfVxufVxuIiwiXG4vKipcbiAqIHRvU3RyaW5nIHJlZi5cbiAqL1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFJldHVybiB0aGUgdHlwZSBvZiBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwpe1xuICBzd2l0Y2ggKHRvU3RyaW5nLmNhbGwodmFsKSkge1xuICAgIGNhc2UgJ1tvYmplY3QgRnVuY3Rpb25dJzogcmV0dXJuICdmdW5jdGlvbic7XG4gICAgY2FzZSAnW29iamVjdCBEYXRlXSc6IHJldHVybiAnZGF0ZSc7XG4gICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzogcmV0dXJuICdyZWdleHAnO1xuICAgIGNhc2UgJ1tvYmplY3QgQXJndW1lbnRzXSc6IHJldHVybiAnYXJndW1lbnRzJztcbiAgICBjYXNlICdbb2JqZWN0IEFycmF5XSc6IHJldHVybiAnYXJyYXknO1xuICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6IHJldHVybiAnc3RyaW5nJztcbiAgfVxuXG4gIGlmICh2YWwgPT09IG51bGwpIHJldHVybiAnbnVsbCc7XG4gIGlmICh2YWwgPT09IHVuZGVmaW5lZCkgcmV0dXJuICd1bmRlZmluZWQnO1xuICBpZiAodmFsICYmIHZhbC5ub2RlVHlwZSA9PT0gMSkgcmV0dXJuICdlbGVtZW50JztcbiAgaWYgKHZhbCA9PT0gT2JqZWN0KHZhbCkpIHJldHVybiAnb2JqZWN0JztcblxuICByZXR1cm4gdHlwZW9mIHZhbDtcbn07XG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICByZW1vdmVkUHJvZHVjdDogL15bIF9dP3JlbW92ZWRbIF9dP3Byb2R1Y3RbIF9dPyQvaSxcbiAgdmlld2VkUHJvZHVjdDogL15bIF9dP3ZpZXdlZFsgX10/cHJvZHVjdFsgX10/JC9pLFxuICB2aWV3ZWRQcm9kdWN0Q2F0ZWdvcnk6IC9eWyBfXT92aWV3ZWRbIF9dP3Byb2R1Y3RbIF9dP2NhdGVnb3J5WyBfXT8kL2ksXG4gIGFkZGVkUHJvZHVjdDogL15bIF9dP2FkZGVkWyBfXT9wcm9kdWN0WyBfXT8kL2ksXG4gIGNvbXBsZXRlZE9yZGVyOiAvXlsgX10/Y29tcGxldGVkWyBfXT9vcmRlclsgX10/JC9pLFxuICBzdGFydGVkT3JkZXI6IC9eWyBfXT9zdGFydGVkWyBfXT9vcmRlclsgX10/JC9pLFxuICB1cGRhdGVkT3JkZXI6IC9eWyBfXT91cGRhdGVkWyBfXT9vcmRlclsgX10/JC9pLFxuICByZWZ1bmRlZE9yZGVyOiAvXlsgX10/cmVmdW5kZWQ/WyBfXT9vcmRlclsgX10/JC9pLFxuICB2aWV3ZWRQcm9kdWN0RGV0YWlsczogL15bIF9dP3ZpZXdlZFsgX10/cHJvZHVjdFsgX10/ZGV0YWlscz9bIF9dPyQvaSxcbiAgY2xpY2tlZFByb2R1Y3Q6IC9eWyBfXT9jbGlja2VkWyBfXT9wcm9kdWN0WyBfXT8kL2ksXG4gIHZpZXdlZFByb21vdGlvbjogL15bIF9dP3ZpZXdlZFsgX10/cHJvbW90aW9uP1sgX10/JC9pLFxuICBjbGlja2VkUHJvbW90aW9uOiAvXlsgX10/Y2xpY2tlZFsgX10/cHJvbW90aW9uP1sgX10/JC9pLFxuICB2aWV3ZWRDaGVja291dFN0ZXA6IC9eWyBfXT92aWV3ZWRbIF9dP2NoZWNrb3V0WyBfXT9zdGVwWyBfXT8kL2ksXG4gIGNvbXBsZXRlZENoZWNrb3V0U3RlcDogL15bIF9dP2NvbXBsZXRlZFsgX10/Y2hlY2tvdXRbIF9dP3N0ZXBbIF9dPyQvaVxufTtcbiIsIlxuLyoqXG4gKiB0b1N0cmluZy5cbiAqL1xuXG52YXIgdG9TdHJpbmcgPSB3aW5kb3cuSlNPTlxuICA/IEpTT04uc3RyaW5naWZ5XG4gIDogZnVuY3Rpb24oXyl7IHJldHVybiBTdHJpbmcoXyk7IH07XG5cbi8qKlxuICogRXhwb3J0IGBmbXRgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmbXQ7XG5cbi8qKlxuICogRm9ybWF0dGVyc1xuICovXG5cbmZtdC5vID0gdG9TdHJpbmc7XG5mbXQucyA9IFN0cmluZztcbmZtdC5kID0gcGFyc2VJbnQ7XG5cbi8qKlxuICogRm9ybWF0IHRoZSBnaXZlbiBgc3RyYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcGFyYW0gey4uLn0gYXJnc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmbXQoc3RyKXtcbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gIHZhciBqID0gMDtcblxuICByZXR1cm4gc3RyLnJlcGxhY2UoLyUoW2Etel0pL2dpLCBmdW5jdGlvbihfLCBmKXtcbiAgICByZXR1cm4gZm10W2ZdXG4gICAgICA/IGZtdFtmXShhcmdzW2orK10pXG4gICAgICA6IF8gKyBmO1xuICB9KTtcbn1cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBvbmxvYWQgPSByZXF1aXJlKCdzY3JpcHQtb25sb2FkJyk7XG52YXIgdGljayA9IHJlcXVpcmUoJ25leHQtdGljaycpO1xudmFyIHR5cGUgPSByZXF1aXJlKCd0eXBlJyk7XG5cbi8qKlxuICogRXhwb3NlIGBsb2FkU2NyaXB0YC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsb2FkSWZyYW1lKG9wdGlvbnMsIGZuKXtcbiAgaWYgKCFvcHRpb25zKSB0aHJvdyBuZXcgRXJyb3IoJ0NhbnQgbG9hZCBub3RoaW5nLi4uJyk7XG5cbiAgLy8gQWxsb3cgZm9yIHRoZSBzaW1wbGVzdCBjYXNlLCBqdXN0IHBhc3NpbmcgYSBgc3JjYCBzdHJpbmcuXG4gIGlmICgnc3RyaW5nJyA9PSB0eXBlKG9wdGlvbnMpKSBvcHRpb25zID0geyBzcmMgOiBvcHRpb25zIH07XG5cbiAgdmFyIGh0dHBzID0gZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonIHx8XG4gICAgICAgICAgICAgIGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sID09PSAnY2hyb21lLWV4dGVuc2lvbjonO1xuXG4gIC8vIElmIHlvdSB1c2UgcHJvdG9jb2wgcmVsYXRpdmUgVVJMcywgdGhpcmQtcGFydHkgc2NyaXB0cyBsaWtlIEdvb2dsZVxuICAvLyBBbmFseXRpY3MgYnJlYWsgd2hlbiB0ZXN0aW5nIHdpdGggYGZpbGU6YCBzbyB0aGlzIGZpeGVzIHRoYXQuXG4gIGlmIChvcHRpb25zLnNyYyAmJiBvcHRpb25zLnNyYy5pbmRleE9mKCcvLycpID09PSAwKSB7XG4gICAgb3B0aW9ucy5zcmMgPSBodHRwcyA/ICdodHRwczonICsgb3B0aW9ucy5zcmMgOiAnaHR0cDonICsgb3B0aW9ucy5zcmM7XG4gIH1cblxuICAvLyBBbGxvdyB0aGVtIHRvIHBhc3MgaW4gZGlmZmVyZW50IFVSTHMgZGVwZW5kaW5nIG9uIHRoZSBwcm90b2NvbC5cbiAgaWYgKGh0dHBzICYmIG9wdGlvbnMuaHR0cHMpIG9wdGlvbnMuc3JjID0gb3B0aW9ucy5odHRwcztcbiAgZWxzZSBpZiAoIWh0dHBzICYmIG9wdGlvbnMuaHR0cCkgb3B0aW9ucy5zcmMgPSBvcHRpb25zLmh0dHA7XG5cbiAgLy8gTWFrZSB0aGUgYDxpZnJhbWU+YCBlbGVtZW50IGFuZCBpbnNlcnQgaXQgYmVmb3JlIHRoZSBmaXJzdCBpZnJhbWUgb24gdGhlXG4gIC8vIHBhZ2UsIHdoaWNoIGlzIGd1YXJhbnRlZWQgdG8gZXhpc3Qgc2luY2UgdGhpcyBKYXZhaWZyYW1lIGlzIHJ1bm5pbmcuXG4gIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgaWZyYW1lLnNyYyA9IG9wdGlvbnMuc3JjO1xuICBpZnJhbWUud2lkdGggPSBvcHRpb25zLndpZHRoIHx8IDE7XG4gIGlmcmFtZS5oZWlnaHQgPSBvcHRpb25zLmhlaWdodCB8fCAxO1xuICBpZnJhbWUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAvLyBJZiB3ZSBoYXZlIGEgZm4sIGF0dGFjaCBldmVudCBoYW5kbGVycywgZXZlbiBpbiBJRS4gQmFzZWQgb2ZmIG9mXG4gIC8vIHRoZSBUaGlyZC1QYXJ0eSBKYXZhc2NyaXB0IHNjcmlwdCBsb2FkaW5nIGV4YW1wbGU6XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90aGlyZHBhcnR5anMvdGhpcmRwYXJ0eWpzLWNvZGUvYmxvYi9tYXN0ZXIvZXhhbXBsZXMvdGVtcGxhdGVzLzAyL2xvYWRpbmctZmlsZXMvaW5kZXguaHRtbFxuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlKGZuKSkge1xuICAgIG9ubG9hZChpZnJhbWUsIGZuKTtcbiAgfVxuXG4gIHRpY2soZnVuY3Rpb24oKXtcbiAgICAvLyBBcHBlbmQgYWZ0ZXIgZXZlbnQgbGlzdGVuZXJzIGFyZSBhdHRhY2hlZCBmb3IgSUUuXG4gICAgdmFyIGZpcnN0U2NyaXB0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdO1xuICAgIGZpcnN0U2NyaXB0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGlmcmFtZSwgZmlyc3RTY3JpcHQpO1xuICB9KTtcblxuICAvLyBSZXR1cm4gdGhlIGlmcmFtZSBlbGVtZW50IGluIGNhc2UgdGhleSB3YW50IHRvIGRvIGFueXRoaW5nIHNwZWNpYWwsIGxpa2VcbiAgLy8gZ2l2ZSBpdCBhbiBJRCBvciBhdHRyaWJ1dGVzLlxuICByZXR1cm4gaWZyYW1lO1xufTsiLCJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS90aGlyZHBhcnR5anMvdGhpcmRwYXJ0eWpzLWNvZGUvYmxvYi9tYXN0ZXIvZXhhbXBsZXMvdGVtcGxhdGVzLzAyL2xvYWRpbmctZmlsZXMvaW5kZXguaHRtbFxuXG4vKipcbiAqIEludm9rZSBgZm4oZXJyKWAgd2hlbiB0aGUgZ2l2ZW4gYGVsYCBzY3JpcHQgbG9hZHMuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbCwgZm4pe1xuICByZXR1cm4gZWwuYWRkRXZlbnRMaXN0ZW5lclxuICAgID8gYWRkKGVsLCBmbilcbiAgICA6IGF0dGFjaChlbCwgZm4pO1xufTtcblxuLyoqXG4gKiBBZGQgZXZlbnQgbGlzdGVuZXIgdG8gYGVsYCwgYGZuKClgLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBhZGQoZWwsIGZuKXtcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKF8sIGUpeyBmbihudWxsLCBlKTsgfSwgZmFsc2UpO1xuICBlbC5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGZ1bmN0aW9uKGUpe1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ3NjcmlwdCBlcnJvciBcIicgKyBlbC5zcmMgKyAnXCInKTtcbiAgICBlcnIuZXZlbnQgPSBlO1xuICAgIGZuKGVycik7XG4gIH0sIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBBdHRhY2ggZXZlbnQuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGF0dGFjaChlbCwgZm4pe1xuICBlbC5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24oZSl7XG4gICAgaWYgKCEvY29tcGxldGV8bG9hZGVkLy50ZXN0KGVsLnJlYWR5U3RhdGUpKSByZXR1cm47XG4gICAgZm4obnVsbCwgZSk7XG4gIH0pO1xuICBlbC5hdHRhY2hFdmVudCgnb25lcnJvcicsIGZ1bmN0aW9uKGUpe1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBsb2FkIHRoZSBzY3JpcHQgXCInICsgZWwuc3JjICsgJ1wiJyk7XG4gICAgZXJyLmV2ZW50ID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgZm4oZXJyKTtcbiAgfSk7XG59XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgb25sb2FkID0gcmVxdWlyZSgnc2NyaXB0LW9ubG9hZCcpO1xudmFyIHRpY2sgPSByZXF1aXJlKCduZXh0LXRpY2snKTtcbnZhciB0eXBlID0gcmVxdWlyZSgndHlwZScpO1xuXG4vKipcbiAqIEV4cG9zZSBgbG9hZFNjcmlwdGAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbG9hZFNjcmlwdChvcHRpb25zLCBmbil7XG4gIGlmICghb3B0aW9ucykgdGhyb3cgbmV3IEVycm9yKCdDYW50IGxvYWQgbm90aGluZy4uLicpO1xuXG4gIC8vIEFsbG93IGZvciB0aGUgc2ltcGxlc3QgY2FzZSwganVzdCBwYXNzaW5nIGEgYHNyY2Agc3RyaW5nLlxuICBpZiAoJ3N0cmluZycgPT0gdHlwZShvcHRpb25zKSkgb3B0aW9ucyA9IHsgc3JjIDogb3B0aW9ucyB9O1xuXG4gIHZhciBodHRwcyA9IGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JyB8fFxuICAgICAgICAgICAgICBkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2Nocm9tZS1leHRlbnNpb246JztcblxuICAvLyBJZiB5b3UgdXNlIHByb3RvY29sIHJlbGF0aXZlIFVSTHMsIHRoaXJkLXBhcnR5IHNjcmlwdHMgbGlrZSBHb29nbGVcbiAgLy8gQW5hbHl0aWNzIGJyZWFrIHdoZW4gdGVzdGluZyB3aXRoIGBmaWxlOmAgc28gdGhpcyBmaXhlcyB0aGF0LlxuICBpZiAob3B0aW9ucy5zcmMgJiYgb3B0aW9ucy5zcmMuaW5kZXhPZignLy8nKSA9PT0gMCkge1xuICAgIG9wdGlvbnMuc3JjID0gaHR0cHMgPyAnaHR0cHM6JyArIG9wdGlvbnMuc3JjIDogJ2h0dHA6JyArIG9wdGlvbnMuc3JjO1xuICB9XG5cbiAgLy8gQWxsb3cgdGhlbSB0byBwYXNzIGluIGRpZmZlcmVudCBVUkxzIGRlcGVuZGluZyBvbiB0aGUgcHJvdG9jb2wuXG4gIGlmIChodHRwcyAmJiBvcHRpb25zLmh0dHBzKSBvcHRpb25zLnNyYyA9IG9wdGlvbnMuaHR0cHM7XG4gIGVsc2UgaWYgKCFodHRwcyAmJiBvcHRpb25zLmh0dHApIG9wdGlvbnMuc3JjID0gb3B0aW9ucy5odHRwO1xuXG4gIC8vIE1ha2UgdGhlIGA8c2NyaXB0PmAgZWxlbWVudCBhbmQgaW5zZXJ0IGl0IGJlZm9yZSB0aGUgZmlyc3Qgc2NyaXB0IG9uIHRoZVxuICAvLyBwYWdlLCB3aGljaCBpcyBndWFyYW50ZWVkIHRvIGV4aXN0IHNpbmNlIHRoaXMgSmF2YXNjcmlwdCBpcyBydW5uaW5nLlxuICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gIHNjcmlwdC5hc3luYyA9IHRydWU7XG4gIHNjcmlwdC5zcmMgPSBvcHRpb25zLnNyYztcblxuICAvLyBJZiB3ZSBoYXZlIGEgZm4sIGF0dGFjaCBldmVudCBoYW5kbGVycywgZXZlbiBpbiBJRS4gQmFzZWQgb2ZmIG9mXG4gIC8vIHRoZSBUaGlyZC1QYXJ0eSBKYXZhc2NyaXB0IHNjcmlwdCBsb2FkaW5nIGV4YW1wbGU6XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90aGlyZHBhcnR5anMvdGhpcmRwYXJ0eWpzLWNvZGUvYmxvYi9tYXN0ZXIvZXhhbXBsZXMvdGVtcGxhdGVzLzAyL2xvYWRpbmctZmlsZXMvaW5kZXguaHRtbFxuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlKGZuKSkge1xuICAgIG9ubG9hZChzY3JpcHQsIGZuKTtcbiAgfVxuXG4gIHRpY2soZnVuY3Rpb24oKXtcbiAgICAvLyBBcHBlbmQgYWZ0ZXIgZXZlbnQgbGlzdGVuZXJzIGFyZSBhdHRhY2hlZCBmb3IgSUUuXG4gICAgdmFyIGZpcnN0U2NyaXB0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdO1xuICAgIGZpcnN0U2NyaXB0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHNjcmlwdCwgZmlyc3RTY3JpcHQpO1xuICB9KTtcblxuICAvLyBSZXR1cm4gdGhlIHNjcmlwdCBlbGVtZW50IGluIGNhc2UgdGhleSB3YW50IHRvIGRvIGFueXRoaW5nIHNwZWNpYWwsIGxpa2VcbiAgLy8gZ2l2ZSBpdCBhbiBJRCBvciBhdHRyaWJ1dGVzLlxuICByZXR1cm4gc2NyaXB0O1xufTsiLCJcbi8qKlxuICogRXhwb3NlIGB0b05vQ2FzZWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB0b05vQ2FzZTtcblxuXG4vKipcbiAqIFRlc3Qgd2hldGhlciBhIHN0cmluZyBpcyBjYW1lbC1jYXNlLlxuICovXG5cbnZhciBoYXNTcGFjZSA9IC9cXHMvO1xudmFyIGhhc1NlcGFyYXRvciA9IC9bXFxXX10vO1xuXG5cbi8qKlxuICogUmVtb3ZlIGFueSBzdGFydGluZyBjYXNlIGZyb20gYSBgc3RyaW5nYCwgbGlrZSBjYW1lbCBvciBzbmFrZSwgYnV0IGtlZXBcbiAqIHNwYWNlcyBhbmQgcHVuY3R1YXRpb24gdGhhdCBtYXkgYmUgaW1wb3J0YW50IG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gdG9Ob0Nhc2UgKHN0cmluZykge1xuICBpZiAoaGFzU3BhY2UudGVzdChzdHJpbmcpKSByZXR1cm4gc3RyaW5nLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChoYXNTZXBhcmF0b3IudGVzdChzdHJpbmcpKSByZXR1cm4gdW5zZXBhcmF0ZShzdHJpbmcpLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiB1bmNhbWVsaXplKHN0cmluZykudG9Mb3dlckNhc2UoKTtcbn1cblxuXG4vKipcbiAqIFNlcGFyYXRvciBzcGxpdHRlci5cbiAqL1xuXG52YXIgc2VwYXJhdG9yU3BsaXR0ZXIgPSAvW1xcV19dKygufCQpL2c7XG5cblxuLyoqXG4gKiBVbi1zZXBhcmF0ZSBhIGBzdHJpbmdgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiB1bnNlcGFyYXRlIChzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKHNlcGFyYXRvclNwbGl0dGVyLCBmdW5jdGlvbiAobSwgbmV4dCkge1xuICAgIHJldHVybiBuZXh0ID8gJyAnICsgbmV4dCA6ICcnO1xuICB9KTtcbn1cblxuXG4vKipcbiAqIENhbWVsY2FzZSBzcGxpdHRlci5cbiAqL1xuXG52YXIgY2FtZWxTcGxpdHRlciA9IC8oLikoW0EtWl0rKS9nO1xuXG5cbi8qKlxuICogVW4tY2FtZWxjYXNlIGEgYHN0cmluZ2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIHVuY2FtZWxpemUgKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoY2FtZWxTcGxpdHRlciwgZnVuY3Rpb24gKG0sIHByZXZpb3VzLCB1cHBlcnMpIHtcbiAgICByZXR1cm4gcHJldmlvdXMgKyAnICcgKyB1cHBlcnMudG9Mb3dlckNhc2UoKS5zcGxpdCgnJykuam9pbignICcpO1xuICB9KTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG4vLyBGSVhNRTogSGFja3kgd29ya2Fyb3VuZCBmb3IgRHVvXG52YXIgZWFjaDsgdHJ5IHsgZWFjaCA9IHJlcXVpcmUoJ0BuZGhvdWxlL2VhY2gnKTsgfSBjYXRjaChlKSB7IGVhY2ggPSByZXF1aXJlKCdlYWNoJyk7IH1cblxuLyoqXG4gKiBDaGVjayBpZiBhIHByZWRpY2F0ZSBmdW5jdGlvbiByZXR1cm5zIGB0cnVlYCBmb3IgYWxsIHZhbHVlcyBpbiBhIGBjb2xsZWN0aW9uYC5cbiAqIENoZWNrcyBvd25lZCwgZW51bWVyYWJsZSB2YWx1ZXMgYW5kIGV4aXRzIGVhcmx5IHdoZW4gYHByZWRpY2F0ZWAgcmV0dXJuc1xuICogYGZhbHNlYC5cbiAqXG4gKiBAbmFtZSBldmVyeVxuICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZGljYXRlIFRoZSBmdW5jdGlvbiB1c2VkIHRvIHRlc3QgdmFsdWVzLlxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIHNlYXJjaC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgYWxsIHZhbHVlcyBwYXNzZXMgdGhlIHByZWRpY2F0ZSB0ZXN0LCBvdGhlcndpc2UgZmFsc2UuXG4gKiBAZXhhbXBsZVxuICogdmFyIGlzRXZlbiA9IGZ1bmN0aW9uKG51bSkgeyByZXR1cm4gbnVtICUgMiA9PT0gMDsgfTtcbiAqXG4gKiBldmVyeShpc0V2ZW4sIFtdKTsgLy8gPT4gdHJ1ZVxuICogZXZlcnkoaXNFdmVuLCBbMSwgMl0pOyAvLyA9PiBmYWxzZVxuICogZXZlcnkoaXNFdmVuLCBbMiwgNCwgNl0pOyAvLyA9PiB0cnVlXG4gKi9cblxudmFyIGV2ZXJ5ID0gZnVuY3Rpb24gZXZlcnkocHJlZGljYXRlLCBjb2xsZWN0aW9uKSB7XG4gIGlmICh0eXBlb2YgcHJlZGljYXRlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYHByZWRpY2F0ZWAgbXVzdCBiZSBhIGZ1bmN0aW9uIGJ1dCB3YXMgYSAnICsgdHlwZW9mIHByZWRpY2F0ZSk7XG4gIH1cblxuICB2YXIgcmVzdWx0ID0gdHJ1ZTtcblxuICBlYWNoKGZ1bmN0aW9uKHZhbCwga2V5LCBjb2xsZWN0aW9uKSB7XG4gICAgcmVzdWx0ID0gISFwcmVkaWNhdGUodmFsLCBrZXksIGNvbGxlY3Rpb24pO1xuXG4gICAgLy8gRXhpdCBlYXJseVxuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LCBjb2xsZWN0aW9uKTtcblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBFeHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZXZlcnk7XG4iLCJcbnZhciBpc0VtcHR5ID0gcmVxdWlyZSgnaXMtZW1wdHknKTtcblxudHJ5IHtcbiAgdmFyIHR5cGVPZiA9IHJlcXVpcmUoJ3R5cGUnKTtcbn0gY2F0Y2ggKGUpIHtcbiAgdmFyIHR5cGVPZiA9IHJlcXVpcmUoJ2NvbXBvbmVudC10eXBlJyk7XG59XG5cblxuLyoqXG4gKiBUeXBlcy5cbiAqL1xuXG52YXIgdHlwZXMgPSBbXG4gICdhcmd1bWVudHMnLFxuICAnYXJyYXknLFxuICAnYm9vbGVhbicsXG4gICdkYXRlJyxcbiAgJ2VsZW1lbnQnLFxuICAnZnVuY3Rpb24nLFxuICAnbnVsbCcsXG4gICdudW1iZXInLFxuICAnb2JqZWN0JyxcbiAgJ3JlZ2V4cCcsXG4gICdzdHJpbmcnLFxuICAndW5kZWZpbmVkJ1xuXTtcblxuXG4vKipcbiAqIEV4cG9zZSB0eXBlIGNoZWNrZXJzLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZvciAodmFyIGkgPSAwLCB0eXBlOyB0eXBlID0gdHlwZXNbaV07IGkrKykgZXhwb3J0c1t0eXBlXSA9IGdlbmVyYXRlKHR5cGUpO1xuXG5cbi8qKlxuICogQWRkIGFsaWFzIGZvciBgZnVuY3Rpb25gIGZvciBvbGQgYnJvd3NlcnMuXG4gKi9cblxuZXhwb3J0cy5mbiA9IGV4cG9ydHNbJ2Z1bmN0aW9uJ107XG5cblxuLyoqXG4gKiBFeHBvc2UgYGVtcHR5YCBjaGVjay5cbiAqL1xuXG5leHBvcnRzLmVtcHR5ID0gaXNFbXB0eTtcblxuXG4vKipcbiAqIEV4cG9zZSBgbmFuYCBjaGVjay5cbiAqL1xuXG5leHBvcnRzLm5hbiA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIGV4cG9ydHMubnVtYmVyKHZhbCkgJiYgdmFsICE9IHZhbDtcbn07XG5cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHR5cGUgY2hlY2tlci5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gZ2VuZXJhdGUgKHR5cGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlID09PSB0eXBlT2YodmFsdWUpO1xuICB9O1xufSIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSgnZW1pdHRlcicpO1xudmFyIGRvbWlmeSA9IHJlcXVpcmUoJ2RvbWlmeScpO1xudmFyIGVhY2ggPSByZXF1aXJlKCdlYWNoJyk7XG52YXIgaW5jbHVkZXMgPSByZXF1aXJlKCdpbmNsdWRlcycpO1xuXG4vKipcbiAqIE1peCBpbiBlbWl0dGVyLlxuICovXG5cbi8qIGVzbGludC1kaXNhYmxlIG5ldy1jYXAgKi9cbkVtaXR0ZXIoZXhwb3J0cyk7XG4vKiBlc2xpbnQtZW5hYmxlIG5ldy1jYXAgKi9cblxuLyoqXG4gKiBBZGQgYSBuZXcgb3B0aW9uIHRvIHRoZSBpbnRlZ3JhdGlvbiBieSBga2V5YCB3aXRoIGRlZmF1bHQgYHZhbHVlYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICogQHJldHVybiB7SW50ZWdyYXRpb259XG4gKi9cblxuZXhwb3J0cy5vcHRpb24gPSBmdW5jdGlvbihrZXksIHZhbHVlKXtcbiAgdGhpcy5wcm90b3R5cGUuZGVmYXVsdHNba2V5XSA9IHZhbHVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGEgbmV3IG1hcHBpbmcgb3B0aW9uLlxuICpcbiAqIFRoaXMgd2lsbCBjcmVhdGUgYSBtZXRob2QgYG5hbWVgIHRoYXQgd2lsbCByZXR1cm4gYSBtYXBwaW5nIGZvciB5b3UgdG8gdXNlLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7SW50ZWdyYXRpb259XG4gKiBAZXhhbXBsZVxuICogSW50ZWdyYXRpb24oJ015IEludGVncmF0aW9uJylcbiAqICAgLm1hcHBpbmcoJ2V2ZW50cycpO1xuICpcbiAqIG5ldyBNeUludGVncmF0aW9uKCkudHJhY2soJ015IEV2ZW50Jyk7XG4gKlxuICogLnRyYWNrID0gZnVuY3Rpb24odHJhY2spe1xuICogICB2YXIgZXZlbnRzID0gdGhpcy5ldmVudHModHJhY2suZXZlbnQoKSk7XG4gKiAgIGVhY2goZXZlbnRzLCBzZW5kKTtcbiAqICB9O1xuICovXG5cbmV4cG9ydHMubWFwcGluZyA9IGZ1bmN0aW9uKG5hbWUpe1xuICB0aGlzLm9wdGlvbihuYW1lLCBbXSk7XG4gIHRoaXMucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oa2V5KXtcbiAgICByZXR1cm4gdGhpcy5tYXAodGhpcy5vcHRpb25zW25hbWVdLCBrZXkpO1xuICB9O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgZ2xvYmFsIHZhcmlhYmxlIGBrZXlgIG93bmVkIGJ5IHRoZSBpbnRlZ3JhdGlvbiwgd2hpY2ggd2lsbCBiZVxuICogdXNlZCB0byB0ZXN0IHdoZXRoZXIgdGhlIGludGVncmF0aW9uIGlzIGFscmVhZHkgb24gdGhlIHBhZ2UuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqIEByZXR1cm4ge0ludGVncmF0aW9ufVxuICovXG5cbmV4cG9ydHMuZ2xvYmFsID0gZnVuY3Rpb24oa2V5KXtcbiAgdGhpcy5wcm90b3R5cGUuZ2xvYmFscy5wdXNoKGtleSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNYXJrIHRoZSBpbnRlZ3JhdGlvbiBhcyBhc3N1bWluZyBhbiBpbml0aWFsIHBhZ2V2aWV3LCBzbyB0byBkZWZlciBsb2FkaW5nXG4gKiB0aGUgc2NyaXB0IHVudGlsIHRoZSBmaXJzdCBgcGFnZWAgY2FsbCwgbm9vcCB0aGUgZmlyc3QgYGluaXRpYWxpemVgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAcmV0dXJuIHtJbnRlZ3JhdGlvbn1cbiAqL1xuXG5leHBvcnRzLmFzc3VtZXNQYWdldmlldyA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMucHJvdG90eXBlLl9hc3N1bWVzUGFnZXZpZXcgPSB0cnVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTWFyayB0aGUgaW50ZWdyYXRpb24gYXMgYmVpbmcgXCJyZWFkeVwiIG9uY2UgYGxvYWRgIGlzIGNhbGxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQHJldHVybiB7SW50ZWdyYXRpb259XG4gKi9cblxuZXhwb3J0cy5yZWFkeU9uTG9hZCA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMucHJvdG90eXBlLl9yZWFkeU9uTG9hZCA9IHRydWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNYXJrIHRoZSBpbnRlZ3JhdGlvbiBhcyBiZWluZyBcInJlYWR5XCIgb25jZSBgaW5pdGlhbGl6ZWAgaXMgY2FsbGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAcmV0dXJuIHtJbnRlZ3JhdGlvbn1cbiAqL1xuXG5leHBvcnRzLnJlYWR5T25Jbml0aWFsaXplID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5wcm90b3R5cGUuX3JlYWR5T25Jbml0aWFsaXplID0gdHJ1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIERlZmluZSBhIHRhZyB0byBiZSBsb2FkZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZT0nbGlicmFyeSddIEEgbmljZW5hbWUgZm9yIHRoZSB0YWcsIGNvbW1vbmx5IHVzZWQgaW5cbiAqICNsb2FkLiBIZWxwZnVsIHdoZW4gdGhlIGludGVncmF0aW9uIGhhcyBtdWx0aXBsZSB0YWdzIGFuZCB5b3UgbmVlZCBhIHdheSB0b1xuICogc3BlY2lmeSB3aGljaCBvZiB0aGUgdGFncyB5b3Ugd2FudCB0byBsb2FkIGF0IGEgZ2l2ZW4gdGltZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgRE9NIHRhZyBhcyBzdHJpbmcgb3IgVVJMLlxuICogQHJldHVybiB7SW50ZWdyYXRpb259XG4gKi9cblxuZXhwb3J0cy50YWcgPSBmdW5jdGlvbihuYW1lLCB0YWcpe1xuICBpZiAodGFnID09IG51bGwpIHtcbiAgICB0YWcgPSBuYW1lO1xuICAgIG5hbWUgPSAnbGlicmFyeSc7XG4gIH1cbiAgdGhpcy5wcm90b3R5cGUudGVtcGxhdGVzW25hbWVdID0gb2JqZWN0aWZ5KHRhZyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBHaXZlbiBhIHN0cmluZywgZ2l2ZSBiYWNrIERPTSBhdHRyaWJ1dGVzLlxuICpcbiAqIERvIGl0IGluIGEgd2F5IHdoZXJlIHRoZSBicm93c2VyIGRvZXNuJ3QgbG9hZCBpbWFnZXMgb3IgaWZyYW1lcy4gSXQgdHVybnNcbiAqIG91dCBkb21pZnkgd2lsbCBsb2FkIGltYWdlcy9pZnJhbWVzIGJlY2F1c2Ugd2hlbmV2ZXIgeW91IGNvbnN0cnVjdCB0aG9zZVxuICogRE9NIGVsZW1lbnRzLCB0aGUgYnJvd3NlciBpbW1lZGlhdGVseSBsb2FkcyB0aGVtLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIG9iamVjdGlmeShzdHIpIHtcbiAgLy8gcmVwbGFjZSBgc3JjYCB3aXRoIGBkYXRhLXNyY2AgdG8gcHJldmVudCBpbWFnZSBsb2FkaW5nXG4gIHN0ciA9IHN0ci5yZXBsYWNlKCcgc3JjPVwiJywgJyBkYXRhLXNyYz1cIicpO1xuXG4gIHZhciBlbCA9IGRvbWlmeShzdHIpO1xuICB2YXIgYXR0cnMgPSB7fTtcblxuICBlYWNoKGVsLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uKGF0dHIpe1xuICAgIC8vIHRoZW4gcmVwbGFjZSBpdCBiYWNrXG4gICAgdmFyIG5hbWUgPSBhdHRyLm5hbWUgPT09ICdkYXRhLXNyYycgPyAnc3JjJyA6IGF0dHIubmFtZTtcbiAgICBpZiAoIWluY2x1ZGVzKGF0dHIubmFtZSArICc9Jywgc3RyKSkgcmV0dXJuO1xuICAgIGF0dHJzW25hbWVdID0gYXR0ci52YWx1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgYXR0cnM6IGF0dHJzXG4gIH07XG59XG4iLCJcbi8qKlxuICogRXhwb3NlIGBwYXJzZWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZTtcblxuLyoqXG4gKiBUZXN0cyBmb3IgYnJvd3NlciBzdXBwb3J0LlxuICovXG5cbnZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbi8vIFNldHVwXG5kaXYuaW5uZXJIVE1MID0gJyAgPGxpbmsvPjx0YWJsZT48L3RhYmxlPjxhIGhyZWY9XCIvYVwiPmE8L2E+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiLz4nO1xuLy8gTWFrZSBzdXJlIHRoYXQgbGluayBlbGVtZW50cyBnZXQgc2VyaWFsaXplZCBjb3JyZWN0bHkgYnkgaW5uZXJIVE1MXG4vLyBUaGlzIHJlcXVpcmVzIGEgd3JhcHBlciBlbGVtZW50IGluIElFXG52YXIgaW5uZXJIVE1MQnVnID0gIWRpdi5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGluaycpLmxlbmd0aDtcbmRpdiA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBXcmFwIG1hcCBmcm9tIGpxdWVyeS5cbiAqL1xuXG52YXIgbWFwID0ge1xuICBsZWdlbmQ6IFsxLCAnPGZpZWxkc2V0PicsICc8L2ZpZWxkc2V0PiddLFxuICB0cjogWzIsICc8dGFibGU+PHRib2R5PicsICc8L3Rib2R5PjwvdGFibGU+J10sXG4gIGNvbDogWzIsICc8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPicsICc8L2NvbGdyb3VwPjwvdGFibGU+J10sXG4gIC8vIGZvciBzY3JpcHQvbGluay9zdHlsZSB0YWdzIHRvIHdvcmsgaW4gSUU2LTgsIHlvdSBoYXZlIHRvIHdyYXBcbiAgLy8gaW4gYSBkaXYgd2l0aCBhIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlciBpbiBmcm9udCwgaGEhXG4gIF9kZWZhdWx0OiBpbm5lckhUTUxCdWcgPyBbMSwgJ1g8ZGl2PicsICc8L2Rpdj4nXSA6IFswLCAnJywgJyddXG59O1xuXG5tYXAudGQgPVxubWFwLnRoID0gWzMsICc8dGFibGU+PHRib2R5Pjx0cj4nLCAnPC90cj48L3Rib2R5PjwvdGFibGU+J107XG5cbm1hcC5vcHRpb24gPVxubWFwLm9wdGdyb3VwID0gWzEsICc8c2VsZWN0IG11bHRpcGxlPVwibXVsdGlwbGVcIj4nLCAnPC9zZWxlY3Q+J107XG5cbm1hcC50aGVhZCA9XG5tYXAudGJvZHkgPVxubWFwLmNvbGdyb3VwID1cbm1hcC5jYXB0aW9uID1cbm1hcC50Zm9vdCA9IFsxLCAnPHRhYmxlPicsICc8L3RhYmxlPiddO1xuXG5tYXAucG9seWxpbmUgPVxubWFwLmVsbGlwc2UgPVxubWFwLnBvbHlnb24gPVxubWFwLmNpcmNsZSA9XG5tYXAudGV4dCA9XG5tYXAubGluZSA9XG5tYXAucGF0aCA9XG5tYXAucmVjdCA9XG5tYXAuZyA9IFsxLCAnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmVyc2lvbj1cIjEuMVwiPicsJzwvc3ZnPiddO1xuXG4vKipcbiAqIFBhcnNlIGBodG1sYCBhbmQgcmV0dXJuIGEgRE9NIE5vZGUgaW5zdGFuY2UsIHdoaWNoIGNvdWxkIGJlIGEgVGV4dE5vZGUsXG4gKiBIVE1MIERPTSBOb2RlIG9mIHNvbWUga2luZCAoPGRpdj4gZm9yIGV4YW1wbGUpLCBvciBhIERvY3VtZW50RnJhZ21lbnRcbiAqIGluc3RhbmNlLCBkZXBlbmRpbmcgb24gdGhlIGNvbnRlbnRzIG9mIHRoZSBgaHRtbGAgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBodG1sIC0gSFRNTCBzdHJpbmcgdG8gXCJkb21pZnlcIlxuICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIC0gVGhlIGBkb2N1bWVudGAgaW5zdGFuY2UgdG8gY3JlYXRlIHRoZSBOb2RlIGZvclxuICogQHJldHVybiB7RE9NTm9kZX0gdGhlIFRleHROb2RlLCBET00gTm9kZSwgb3IgRG9jdW1lbnRGcmFnbWVudCBpbnN0YW5jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2UoaHRtbCwgZG9jKSB7XG4gIGlmICgnc3RyaW5nJyAhPSB0eXBlb2YgaHRtbCkgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RyaW5nIGV4cGVjdGVkJyk7XG5cbiAgLy8gZGVmYXVsdCB0byB0aGUgZ2xvYmFsIGBkb2N1bWVudGAgb2JqZWN0XG4gIGlmICghZG9jKSBkb2MgPSBkb2N1bWVudDtcblxuICAvLyB0YWcgbmFtZVxuICB2YXIgbSA9IC88KFtcXHc6XSspLy5leGVjKGh0bWwpO1xuICBpZiAoIW0pIHJldHVybiBkb2MuY3JlYXRlVGV4dE5vZGUoaHRtbCk7XG5cbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpOyAvLyBSZW1vdmUgbGVhZGluZy90cmFpbGluZyB3aGl0ZXNwYWNlXG5cbiAgdmFyIHRhZyA9IG1bMV07XG5cbiAgLy8gYm9keSBzdXBwb3J0XG4gIGlmICh0YWcgPT0gJ2JvZHknKSB7XG4gICAgdmFyIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2h0bWwnKTtcbiAgICBlbC5pbm5lckhUTUwgPSBodG1sO1xuICAgIHJldHVybiBlbC5yZW1vdmVDaGlsZChlbC5sYXN0Q2hpbGQpO1xuICB9XG5cbiAgLy8gd3JhcCBtYXBcbiAgdmFyIHdyYXAgPSBtYXBbdGFnXSB8fCBtYXAuX2RlZmF1bHQ7XG4gIHZhciBkZXB0aCA9IHdyYXBbMF07XG4gIHZhciBwcmVmaXggPSB3cmFwWzFdO1xuICB2YXIgc3VmZml4ID0gd3JhcFsyXTtcbiAgdmFyIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBlbC5pbm5lckhUTUwgPSBwcmVmaXggKyBodG1sICsgc3VmZml4O1xuICB3aGlsZSAoZGVwdGgtLSkgZWwgPSBlbC5sYXN0Q2hpbGQ7XG5cbiAgLy8gb25lIGVsZW1lbnRcbiAgaWYgKGVsLmZpcnN0Q2hpbGQgPT0gZWwubGFzdENoaWxkKSB7XG4gICAgcmV0dXJuIGVsLnJlbW92ZUNoaWxkKGVsLmZpcnN0Q2hpbGQpO1xuICB9XG5cbiAgLy8gc2V2ZXJhbCBlbGVtZW50c1xuICB2YXIgZnJhZ21lbnQgPSBkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkge1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGVsLnJlbW92ZUNoaWxkKGVsLmZpcnN0Q2hpbGQpKTtcbiAgfVxuXG4gIHJldHVybiBmcmFnbWVudDtcbn1cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBjbGVhckFqYXggPSByZXF1aXJlKCdjbGVhci1hamF4Jyk7XG52YXIgY2xlYXJUaW1lb3V0cyA9IHJlcXVpcmUoJ2NsZWFyLXRpbWVvdXRzJyk7XG52YXIgY2xlYXJJbnRlcnZhbHMgPSByZXF1aXJlKCdjbGVhci1pbnRlcnZhbHMnKTtcbnZhciBjbGVhckxpc3RlbmVycyA9IHJlcXVpcmUoJ2NsZWFyLWxpc3RlbmVycycpO1xudmFyIGNsZWFyR2xvYmFscyA9IHJlcXVpcmUoJ2NsZWFyLWdsb2JhbHMnKTtcbnZhciBjbGVhckltYWdlcyA9IHJlcXVpcmUoJ2NsZWFyLWltYWdlcycpO1xudmFyIGNsZWFyU2NyaXB0cyA9IHJlcXVpcmUoJ2NsZWFyLXNjcmlwdHMnKTtcbnZhciBjbGVhckNvb2tpZXMgPSByZXF1aXJlKCdjbGVhci1jb29raWVzJyk7XG5cbi8qKlxuICogUmVzZXQgaW5pdGlhbCBzdGF0ZS5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcbiAgY2xlYXJBamF4KCk7XG4gIGNsZWFyVGltZW91dHMoKTtcbiAgY2xlYXJJbnRlcnZhbHMoKTtcbiAgY2xlYXJMaXN0ZW5lcnMoKTtcbiAgY2xlYXJHbG9iYWxzKCk7XG4gIGNsZWFySW1hZ2VzKCk7XG4gIGNsZWFyU2NyaXB0cygpO1xuICBjbGVhckNvb2tpZXMoKTtcbn07IiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGVhY2ggPSByZXF1aXJlKCdlYWNoJyk7XG5cbi8qKlxuICogT3JpZ2luYWwgc2VuZCBtZXRob2QuXG4gKi9cblxudmFyIHNlbmQgPSBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZDtcblxuLyoqXG4gKiBSZXF1ZXN0cyBtYWRlLlxuICovXG5cbnZhciByZXF1ZXN0cyA9IFtdO1xuXG4vKipcbiAqIENsZWFyIGFsbCBhY3RpdmUgQUpBWCByZXF1ZXN0cy5cbiAqIFxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuICBlYWNoKHJlcXVlc3RzLCBmdW5jdGlvbihyZXF1ZXN0KXtcbiAgICB0cnkge1xuICAgICAgcmVxdWVzdC5vbmxvYWQgPSBub29wO1xuICAgICAgcmVxdWVzdC5vbmVycm9yID0gbm9vcDtcbiAgICAgIHJlcXVlc3Qub25hYm9ydCA9IG5vb3A7XG4gICAgICByZXF1ZXN0LmFib3J0KCk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfSk7XG4gIHJlcXVlc3RzLmxlbmd0aCA9IFtdO1xufTtcblxuLyoqXG4gKiBDYXB0dXJlIEFKQVggcmVxdWVzdHMuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmJpbmQgPSBmdW5jdGlvbigpe1xuICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKCl7XG4gICAgcmVxdWVzdHMucHVzaCh0aGlzKTtcbiAgICByZXR1cm4gc2VuZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xufTtcblxuLyoqXG4gKiBSZXNldCBgWE1MSHR0cFJlcXVlc3RgIGJhY2sgdG8gbm9ybWFsLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy51bmJpbmQgPSBmdW5jdGlvbigpe1xuICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZCA9IHNlbmQ7XG59O1xuXG4vKipcbiAqIEF1dG9tYXRpY2FsbHkgYmluZC5cbiAqL1xuXG5leHBvcnRzLmJpbmQoKTtcblxuLyoqXG4gKiBOb29wLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG5vb3AoKXt9IiwiXG4vKipcbiAqIFByZXZpb3VzXG4gKi9cblxudmFyIHByZXYgPSAwO1xuXG4vKipcbiAqIE5vb3BcbiAqL1xuXG52YXIgbm9vcCA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuLyoqXG4gKiBDbGVhciBhbGwgdGltZW91dHNcbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcbiAgdmFyIHRtcCwgaTtcbiAgdG1wID0gaSA9IHNldFRpbWVvdXQobm9vcCk7XG4gIHdoaWxlIChwcmV2IDwgaSkgY2xlYXJUaW1lb3V0KGktLSk7XG4gIHByZXYgPSB0bXA7XG59O1xuIiwiXG4vKipcbiAqIFByZXZcbiAqL1xuXG52YXIgcHJldiA9IDA7XG5cbi8qKlxuICogTm9vcFxuICovXG5cbnZhciBub29wID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4vKipcbiAqIENsZWFyIGFsbCBpbnRlcnZhbHMuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG4gIHZhciB0bXAsIGk7XG4gIHRtcCA9IGkgPSBzZXRJbnRlcnZhbChub29wKTtcbiAgd2hpbGUgKHByZXYgPCBpKSBjbGVhckludGVydmFsKGktLSk7XG4gIHByZXYgPSB0bXA7XG59O1xuIiwiXG4vKipcbiAqIFdpbmRvdyBldmVudCBsaXN0ZW5lcnMuXG4gKi9cblxudmFyIGxpc3RlbmVycyA9IFtdO1xuXG4vKipcbiAqIE9yaWdpbmFsIHdpbmRvdyBmdW5jdGlvbnMuXG4gKi9cblxudmFyIG9uID0gd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgPyAnYWRkRXZlbnRMaXN0ZW5lcicgOiAnYXR0YWNoRXZlbnQnO1xudmFyIG9mZiA9IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyID8gJ3JlbW92ZUV2ZW50TGlzdGVuZXInIDogJ2RldGFjaEV2ZW50JztcbnZhciBvbkZuID0gd2luZG93W29uXTtcbnZhciBvZmZGbiA9IHdpbmRvd1tvZmZdO1xuXG4vKipcbiAqIENsZWFyIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIHdpbmRvd1tvbl0uYXBwbHlcbiAgICAgID8gd2luZG93W29uXS5hcHBseSh3aW5kb3csIGxpc3RlbmVyc1tpXSlcbiAgICAgIDogd2luZG93W29uXShsaXN0ZW5lcnNbaV1bMF0sIGxpc3RlbmVyc1tpXVsxXSk7IC8vIElFXG4gIH1cbiAgbGlzdGVuZXJzLmxlbmd0aCA9IDA7XG59O1xuXG4vKipcbiAqIFdyYXAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgYW5kIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyXG4gKiB0byBiZSBhYmxlIHRvIGNsZWFudXAgYWxsIGV2ZW50IGxpc3RlbmVycyBmb3IgdGVzdGluZy5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuYmluZCA9IGZ1bmN0aW9uKCl7XG4gIHdpbmRvd1tvbl0gPSBmdW5jdGlvbigpe1xuICAgIGxpc3RlbmVycy5wdXNoKGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIG9uRm4uYXBwbHlcbiAgICAgID8gb25Gbi5hcHBseSh3aW5kb3csIGFyZ3VtZW50cylcbiAgICAgIDogb25Gbihhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSk7IC8vIElFXG4gIH07XG5cbiAgd2luZG93W29mZl0gPSBmdW5jdGlvbihuYW1lLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSl7XG4gICAgZm9yICh2YXIgaSA9IDAsIG4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICBpZiAobmFtZSAhPT0gbGlzdGVuZXJzW2ldWzBdKSBjb250aW51ZTtcbiAgICAgIGlmIChsaXN0ZW5lciAhPT0gbGlzdGVuZXJzW2ldWzFdKSBjb250aW51ZTtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMiAmJiB1c2VDYXB0dXJlICE9PSBsaXN0ZW5lcnNbaV1bMl0pIGNvbnRpbnVlO1xuICAgICAgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gb2ZmRm4uYXBwbHlcbiAgICAgID8gb2ZmRm4uYXBwbHkod2luZG93LCBhcmd1bWVudHMpXG4gICAgICA6IG9mZkZuKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKTsgLy8gSUVcbiAgfTtcbn07XG5cblxuLyoqXG4gKiBSZXNldCB3aW5kb3cgYmFjayB0byBub3JtYWwuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnVuYmluZCA9IGZ1bmN0aW9uKCl7XG4gIGxpc3RlbmVycy5sZW5ndGggPSAwO1xuICB3aW5kb3dbb25dID0gb25GbjtcbiAgd2luZG93W29mZl0gPSBvZmZGbjtcbn07XG5cbi8qKlxuICogQXV0b21hdGljYWxseSBvdmVycmlkZS5cbiAqL1xuXG5leHBvcnRzLmJpbmQoKTsiLCJcbi8qKlxuICogT2JqZWN0cyB3ZSB3YW50IHRvIGtlZXAgdHJhY2sgb2YgaW5pdGlhbCBwcm9wZXJ0aWVzIGZvci5cbiAqL1xuXG52YXIgZ2xvYmFscyA9IHtcbiAgJ3dpbmRvdyc6IHt9LFxuICAnZG9jdW1lbnQnOiB7fSxcbiAgJ1hNTEh0dHBSZXF1ZXN0Jzoge31cbn07XG5cbi8qKlxuICogQ2FwdHVyZSBpbml0aWFsIHN0YXRlIG9mIGB3aW5kb3dgLlxuICpcbiAqIE5vdGUsIGB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcmAgaXMgb3ZlcnJpdHRlbiBhbHJlYWR5LFxuICogZnJvbSBgY2xlYXJMaXN0ZW5lcnNgLiBCdXQgdGhpcyBpcyBkZXNpcmVkIGJlaGF2aW9yLlxuICovXG5cbmdsb2JhbHMud2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgPSB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcbmdsb2JhbHMud2luZG93LmFkZEV2ZW50TGlzdGVuZXIgPSB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcjtcbmdsb2JhbHMud2luZG93LnNldFRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dDtcbmdsb2JhbHMud2luZG93LnNldEludGVydmFsID0gd2luZG93LnNldEludGVydmFsO1xuZ2xvYmFscy53aW5kb3cub25lcnJvciA9IG51bGw7XG5nbG9iYWxzLndpbmRvdy5vbmxvYWQgPSBudWxsO1xuXG4vKipcbiAqIENhcHR1cmUgaW5pdGlhbCBzdGF0ZSBvZiBgZG9jdW1lbnRgLlxuICovXG5cbmdsb2JhbHMuZG9jdW1lbnQud3JpdGUgPSBkb2N1bWVudC53cml0ZTtcbmdsb2JhbHMuZG9jdW1lbnQuYXBwZW5kQ2hpbGQgPSBkb2N1bWVudC5hcHBlbmRDaGlsZDtcbmdsb2JhbHMuZG9jdW1lbnQucmVtb3ZlQ2hpbGQgPSBkb2N1bWVudC5yZW1vdmVDaGlsZDtcblxuLyoqXG4gKiBDYXB0dXJlIHRoZSBpbml0aWFsIHN0YXRlIG9mIGBYTUxIdHRwUmVxdWVzdGAuXG4gKi9cblxuaWYgKCd1bmRlZmluZWQnICE9IHR5cGVvZiBYTUxIdHRwUmVxdWVzdCkge1xuICBnbG9iYWxzLlhNTEh0dHBSZXF1ZXN0Lm9wZW4gPSBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUub3Blbjtcbn1cblxuLyoqXG4gKiBSZXNldCBpbml0aWFsIHN0YXRlLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuICBjb3B5KGdsb2JhbHMud2luZG93LCB3aW5kb3cpO1xuICBjb3B5KGdsb2JhbHMuWE1MSHR0cFJlcXVlc3QsIFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZSk7XG4gIGNvcHkoZ2xvYmFscy5kb2N1bWVudCwgZG9jdW1lbnQpO1xufTtcblxuLyoqXG4gKiBSZXNldCBwcm9wZXJ0aWVzIG9uIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gc291cmNlXG4gKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb3B5KHNvdXJjZSwgdGFyZ2V0KXtcbiAgZm9yICh2YXIgbmFtZSBpbiBzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICB0YXJnZXRbbmFtZV0gPSBzb3VyY2VbbmFtZV07XG4gICAgfVxuICB9XG59IiwiXG4vKipcbiAqIENyZWF0ZWQgaW1hZ2VzLlxuICovXG5cbnZhciBpbWFnZXMgPSBbXTtcblxuLyoqXG4gKiBLZWVwIHRyYWNrIG9mIG9yaWdpbmFsIGBJbWFnZWAuXG4gKi9cblxudmFyIE9yaWdpbmFsID0gd2luZG93LkltYWdlO1xuXG4vKipcbiAqIEltYWdlIG92ZXJyaWRlIHRoYXQga2VlcHMgdHJhY2sgb2YgaW1hZ2VzLlxuICpcbiAqIENhcmVmdWwgdGhvdWdoLCBgaW1nIGluc3RhbmNlIE92ZXJyaWRlYCBpc24ndCB0cnVlLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIE92ZXJyaWRlKCkge1xuICB2YXIgaW1nID0gbmV3IE9yaWdpbmFsO1xuICBpbWFnZXMucHVzaChpbWcpO1xuICByZXR1cm4gaW1nO1xufVxuXG4vKipcbiAqIENsZWFyIGBvbmxvYWRgIGZvciBlYWNoIGltYWdlLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcbiAgdmFyIG5vb3AgPSBmdW5jdGlvbigpe307XG4gIGZvciAodmFyIGkgPSAwLCBuID0gaW1hZ2VzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgIGltYWdlc1tpXS5vbmxvYWQgPSBub29wO1xuICB9XG4gIGltYWdlcy5sZW5ndGggPSAwO1xufTtcblxuLyoqXG4gKiBPdmVycmlkZSBgd2luZG93LkltYWdlYCB0byBrZWVwIHRyYWNrIG9mIGltYWdlcyxcbiAqIHNvIHdlIGNhbiBjbGVhciBgb25sb2FkYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuYmluZCA9IGZ1bmN0aW9uKCl7XG4gIHdpbmRvdy5JbWFnZSA9IE92ZXJyaWRlO1xufTtcblxuLyoqXG4gKiBTZXQgYHdpbmRvdy5JbWFnZWAgYmFjayB0byBub3JtYWwuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnVuYmluZCA9IGZ1bmN0aW9uKCl7XG4gIHdpbmRvdy5JbWFnZSA9IE9yaWdpbmFsO1xuICBpbWFnZXMubGVuZ3RoID0gMDtcbn07XG5cbi8qKlxuICogQXV0b21hdGljYWxseSBvdmVycmlkZS5cbiAqL1xuXG5leHBvcnRzLmJpbmQoKTsiLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgaW5kZXhPZiA9IHJlcXVpcmUoJ2luZGV4b2YnKTtcbnZhciBxdWVyeSA9IHJlcXVpcmUoJ3F1ZXJ5Jyk7XG52YXIgZWFjaCA9IHJlcXVpcmUoJ2VhY2gnKTtcblxuLyoqXG4gKiBJbml0aWFsIHNjcmlwdHMuXG4gKi9cblxudmFyIGluaXRpYWxTY3JpcHRzID0gW107XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBzY3JpcHRzIG5vdCBpbml0aWFsbHkgcHJlc2VudC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbbWF0Y2hdIE9ubHkgcmVtb3ZlIG9uZXMgdGhhdCByZXR1cm4gdHJ1ZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtYXRjaCl7XG4gIG1hdGNoID0gbWF0Y2ggfHwgc2F1Y2VsYWJzO1xuICB2YXIgZmluYWxTY3JpcHRzID0gcXVlcnkuYWxsKCdzY3JpcHQnKTtcbiAgZWFjaChmaW5hbFNjcmlwdHMsIGZ1bmN0aW9uKHNjcmlwdCl7XG4gICAgaWYgKC0xICE9IGluZGV4T2YoaW5pdGlhbFNjcmlwdHMsIHNjcmlwdCkpIHJldHVybjtcbiAgICBpZiAoIXNjcmlwdC5wYXJlbnROb2RlKSByZXR1cm47XG4gICAgaWYgKCFtYXRjaChzY3JpcHQpKSByZXR1cm47XG4gICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIENhcHR1cmUgaW5pdGlhbCBzY3JpcHRzLCB0aGUgb25lcyBub3QgdG8gcmVtb3ZlLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5iaW5kID0gZnVuY3Rpb24oc2NyaXB0cyl7XG4gIGluaXRpYWxTY3JpcHRzID0gc2NyaXB0cyB8fCBxdWVyeS5hbGwoJ3NjcmlwdCcpO1xufTtcblxuLyoqXG4gKiBEZWZhdWx0IG1hdGNoaW5nIGZ1bmN0aW9uLCBpZ25vcmVzIHNhdWNlbGFicyBqc29ucCBzY3JpcHRzLlxuICpcbiAqIEBwYXJhbSB7U2NyaXB0fSBzY3JpcHRcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5mdW5jdGlvbiBzYXVjZWxhYnMoc2NyaXB0KSB7XG4gIHJldHVybiAhc2NyaXB0LnNyYy5tYXRjaCgvbG9jYWx0dW5uZWxcXC5tZVxcL3NhdWNlbGFic3xcXC9kdW90ZXN0Lyk7XG59O1xuXG4vKipcbiAqIEF1dG9tYXRpY2FsbHkgYmluZC5cbiAqL1xuXG5leHBvcnRzLmJpbmQoKTtcbiIsImZ1bmN0aW9uIG9uZShzZWxlY3RvciwgZWwpIHtcbiAgcmV0dXJuIGVsLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xufVxuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3RvciwgZWwpe1xuICBlbCA9IGVsIHx8IGRvY3VtZW50O1xuICByZXR1cm4gb25lKHNlbGVjdG9yLCBlbCk7XG59O1xuXG5leHBvcnRzLmFsbCA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBlbCl7XG4gIGVsID0gZWwgfHwgZG9jdW1lbnQ7XG4gIHJldHVybiBlbC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbn07XG5cbmV4cG9ydHMuZW5naW5lID0gZnVuY3Rpb24ob2JqKXtcbiAgaWYgKCFvYmoub25lKSB0aHJvdyBuZXcgRXJyb3IoJy5vbmUgY2FsbGJhY2sgcmVxdWlyZWQnKTtcbiAgaWYgKCFvYmouYWxsKSB0aHJvdyBuZXcgRXJyb3IoJy5hbGwgY2FsbGJhY2sgcmVxdWlyZWQnKTtcbiAgb25lID0gb2JqLm9uZTtcbiAgZXhwb3J0cy5hbGwgPSBvYmouYWxsO1xuICByZXR1cm4gZXhwb3J0cztcbn07XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgY29va2llID0gcmVxdWlyZSgnY29va2llJyk7XG5cbi8qKlxuICogQ2xlYXIgY29va2llcy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBjb29raWVzID0gY29va2llKCk7XG4gIGZvciAodmFyIG5hbWUgaW4gY29va2llcykge1xuICAgIGNvb2tpZShuYW1lLCAnJywgeyBwYXRoOiAnLycgfSk7XG4gIH1cbn07IiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGluZGV4T2YgPSByZXF1aXJlKCdpbmRleG9mJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG52YXIgZG9taWZ5ID0gcmVxdWlyZSgnZG9taWZ5Jyk7XG52YXIgc3R1YiA9IHJlcXVpcmUoJ3N0dWInKTtcbnZhciBlYWNoID0gcmVxdWlyZSgnZWFjaCcpO1xudmFyIGtleXMgPSByZXF1aXJlKCdrZXlzJyk7XG52YXIgZm10ID0gcmVxdWlyZSgnZm10Jyk7XG52YXIgc3B5ID0gcmVxdWlyZSgnc3B5Jyk7XG52YXIgaXMgPSByZXF1aXJlKCdpcycpO1xuXG4vKipcbiAqIEV4cG9zZSBgcGx1Z2luYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBsdWdpbjtcblxuLyoqXG4gKiBJbnRlZ3JhdGlvbiB0ZXN0aW5nIHBsdWdpbi5cbiAqXG4gKiBAcGFyYW0ge0FuYWx5dGljc30gYW5hbHl0aWNzXG4gKi9cblxuZnVuY3Rpb24gcGx1Z2luKGFuYWx5dGljcykge1xuICBhbmFseXRpY3Muc3BpZXMgPSBbXTtcblxuICAvKipcbiAgICogU3B5IG9uIGEgYG1ldGhvZGAgb2YgaG9zdCBgb2JqZWN0YC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gICAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAgICovXG5cbiAgYW5hbHl0aWNzLnNweSA9IGZ1bmN0aW9uKG9iamVjdCwgbWV0aG9kKXtcbiAgICB2YXIgcyA9IHNweShvYmplY3QsIG1ldGhvZCk7XG4gICAgdGhpcy5zcGllcy5wdXNoKHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTdHViIGEgYG1ldGhvZGAgb2YgaG9zdCBgb2JqZWN0YC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gICAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAgICovXG5cbiAgYW5hbHl0aWNzLnN0dWIgPSBmdW5jdGlvbihvYmplY3QsIG1ldGhvZCl7XG4gICAgdmFyIHMgPSBzdHViKG9iamVjdCwgbWV0aG9kKTtcbiAgICB0aGlzLnNwaWVzLnB1c2gocyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlc3RvcmUgYWxsIHNwaWVzLlxuICAgKlxuICAgKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gICAqL1xuXG4gIGFuYWx5dGljcy5yZXN0b3JlID0gZnVuY3Rpb24oKXtcbiAgICBlYWNoKHRoaXMuc3BpZXMsIGZ1bmN0aW9uKHNweSwgaSl7XG4gICAgICBzcHkucmVzdG9yZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuc3BpZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQXNzZXJ0IHRoYXQgYSBgc3B5YCB3YXMgY2FsbGVkIHdpdGggYGFyZ3MuLi5gXG4gICAqXG4gICAqIEBwYXJhbSB7U3B5fSBzcHlcbiAgICogQHBhcmFtIHtNaXhlZH0gYXJncy4uLiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAgICovXG5cbiAgYW5hbHl0aWNzLmNhbGxlZCA9IGZ1bmN0aW9uKHNweSl7XG4gICAgYXNzZXJ0KFxuICAgICAgfmluZGV4T2YodGhpcy5zcGllcywgc3B5KSxcbiAgICAgICdZb3UgbXVzdCBjYWxsIGAuc3B5KG9iamVjdCwgbWV0aG9kKWAgcHJpb3IgdG8gY2FsbGluZyBgLmNhbGxlZCgpYC4nXG4gICAgKTtcbiAgICBhc3NlcnQoc3B5LmNhbGxlZCwgZm10KCdFeHBlY3RlZCBcIiVzXCIgdG8gaGF2ZSBiZWVuIGNhbGxlZC4nLCBzcHkubmFtZSkpO1xuXG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKCFhcmdzLmxlbmd0aCkgcmV0dXJuIHRoaXM7XG5cbiAgICBhc3NlcnQoXG4gICAgICBzcHkuZ290LmFwcGx5KHNweSwgYXJncyksIGZtdCgnJ1xuICAgICAgKyAnRXhwZWN0ZWQgXCIlc1wiIHRvIGJlIGNhbGxlZCB3aXRoIFwiJXNcIiwgXFxuJ1xuICAgICAgKyAnYnV0IGl0IHdhcyBjYWxsZWQgd2l0aCBcIiVzXCIuJ1xuICAgICAgLCBzcHkubmFtZVxuICAgICAgLCBKU09OLnN0cmluZ2lmeShhcmdzLCBudWxsLCAyKVxuICAgICAgLCBKU09OLnN0cmluZ2lmeShzcHkuYXJnc1swXSwgbnVsbCwgMikpXG4gICAgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgdGhhdCBhIGBzcHlgIHdhcyBub3QgY2FsbGVkIHdpdGggYGFyZ3MuLi5gLlxuICAgKlxuICAgKiBAcGFyYW0ge1NweX0gc3B5XG4gICAqIEBwYXJhbSB7TWl4ZWR9IGFyZ3MuLi4gKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gICAqL1xuXG4gIGFuYWx5dGljcy5kaWROb3RDYWxsID0gZnVuY3Rpb24oc3B5KXtcbiAgICBhc3NlcnQoXG4gICAgICB+aW5kZXhPZih0aGlzLnNwaWVzLCBzcHkpLFxuICAgICAgJ1lvdSBtdXN0IGNhbGwgYC5zcHkob2JqZWN0LCBtZXRob2QpYCBwcmlvciB0byBjYWxsaW5nIGAuZGlkTm90Q2FsbCgpYC4nXG4gICAgKTtcblxuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmICghYXJncy5sZW5ndGgpIHtcbiAgICAgIGFzc2VydChcbiAgICAgICAgIXNweS5jYWxsZWQsXG4gICAgICAgIGZtdCgnRXhwZWN0ZWQgXCIlc1wiIG5vdCB0byBoYXZlIGJlZW4gY2FsbGVkLicsIHNweS5uYW1lKVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXJ0KCFzcHkuZ290LmFwcGx5KHNweSwgYXJncyksIGZtdCgnJ1xuICAgICAgICArICdFeHBlY3RlZCBcIiVzXCIgbm90IHRvIGJlIGNhbGxlZCB3aXRoIFwiJW9cIiwgJ1xuICAgICAgICArICdidXQgaXQgd2FzIGNhbGxlZCB3aXRoIFwiJW9cIi4nXG4gICAgICAgICwgc3B5Lm5hbWVcbiAgICAgICAgLCBhcmdzXG4gICAgICAgICwgc3B5LmFyZ3NbMF0pXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgdGhhdCBhIGBzcHlgIHdhcyBub3QgY2FsbGVkIDEgdGltZS5cbiAgICpcbiAgICogQHBhcmFtIHtTcHl9IHNweVxuICAgKiBAcmV0dXJuIHtBbmFseXRpY3N9XG4gICAqL1xuXG4gIGFuYWx5dGljcy5jYWxsZWRPbmNlID0gY2FsbGVkVGltZXMoMSk7XG5cbiAgLyoqXG4gICAqIEFzc2VydCB0aGF0IGEgYHNweWAgd2FzIGNhbGxlZCAyIHRpbWVzLlxuICAgKlxuICAgKiBAcGFyYW0ge1NweX0gc3B5XG4gICAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAgICovXG5cbiAgYW5hbHl0aWNzLmNhbGxlZFR3aWNlID0gY2FsbGVkVGltZXMoMik7XG5cbiAgLyoqXG4gICAqIEFzc2VydCB0aGF0IGEgYHNweWAgd2FzIGNhbGxlZCAzIHRpbWVzLlxuICAgKlxuICAgKiBAcGFyYW0ge1NweX0gc3B5XG4gICAqIEByZXR1cm4ge0FuYWx5dGljc31cbiAgICovXG5cbiAgYW5hbHl0aWNzLmNhbGxlZFRocmljZSA9IGNhbGxlZFRpbWVzKDIpO1xuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIGZ1bmN0aW9uIGZvciBhc3NlcnRpbmcgYSBzcHlcbiAgICogd2FzIGNhbGxlZCBgbmAgdGltZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKi9cblxuICBmdW5jdGlvbiBjYWxsZWRUaW1lcyhuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNweSkge1xuICAgICAgdmFyIG0gPSBzcHkuYXJncy5sZW5ndGg7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIG4gPT0gbSxcbiAgICAgICAgZm10KCcnXG4gICAgICAgICAgKyAnRXhwZWN0ZWQgXCIlc1wiIHRvIGhhdmUgYmVlbiBjYWxsZWQgJXMgdGltZSVzLCAnXG4gICAgICAgICAgKyAnYnV0IGl0IHdhcyBvbmx5IGNhbGxlZCAlcyB0aW1lJXMuJ1xuICAgICAgICAgICwgc3B5Lm5hbWUsIG4sIDEgIT0gbiA/ICdzJyA6ICcnLCBtLCAxICE9IG0gPyAncycgOiAnJylcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydCB0aGF0IGEgYHNweWAgcmV0dXJuZWQgYHZhbHVlYC5cbiAgICpcbiAgICogQHBhcmFtIHtTcHl9IHNweVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcmV0dXJuIHtUZXN0ZXJ9XG4gICAqL1xuXG4gIGFuYWx5dGljcy5yZXR1cm5lZCA9IGZ1bmN0aW9uKHNweSwgdmFsdWUpe1xuICAgIGFzc2VydChcbiAgICAgIH5pbmRleE9mKHRoaXMuc3BpZXMsIHNweSksXG4gICAgICAnWW91IG11c3QgY2FsbCBgLnNweShvYmplY3QsIG1ldGhvZClgIHByaW9yIHRvIGNhbGxpbmcgYC5yZXR1cm5lZCgpYC4nXG4gICAgKTtcbiAgICBhc3NlcnQoXG4gICAgICBzcHkucmV0dXJuZWQodmFsdWUpLFxuICAgICAgZm10KCdFeHBlY3RlZCBcIiVzXCIgdG8gaGF2ZSByZXR1cm5lZCBcIiVvXCIuJywgc3B5Lm5hbWUsIHZhbHVlKVxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQXNzZXJ0IHRoYXQgYSBgc3B5YCBkaWQgbm90IHJldHVybiBgdmFsdWVgLlxuICAgKlxuICAgKiBAcGFyYW0ge1NweX0gc3B5XG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gICAqIEByZXR1cm4ge1Rlc3Rlcn1cbiAgICovXG5cbiAgYW5hbHl0aWNzLmRpZE5vdFJldHVybiA9IGZ1bmN0aW9uKHNweSwgdmFsdWUpe1xuICAgIGFzc2VydChcbiAgICAgIH5pbmRleE9mKHRoaXMuc3BpZXMsIHNweSksXG4gICAgICAnWW91IG11c3QgY2FsbCBgLnNweShvYmplY3QsIG1ldGhvZClgIHByaW9yIHRvIGNhbGxpbmcgYC5kaWROb3RSZXR1cm4oKWAuJ1xuICAgICk7XG4gICAgYXNzZXJ0KFxuICAgICAgIXNweS5yZXR1cm5lZCh2YWx1ZSksXG4gICAgICBmbXQoJ0V4cGVjdGVkIFwiJXNcIiBub3QgdG8gaGF2ZSByZXR1cm5lZCBcIiVvXCIuJywgc3B5Lm5hbWUsIHZhbHVlKVxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQ2FsbCBgcmVzZXRgIG9uIHRoZSBpbnRlZ3JhdGlvbi5cbiAgICpcbiAgICogQHJldHVybiB7QW5hbHl0aWNzfVxuICAgKi9cblxuICBhbmFseXRpY3MucmVzZXQgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMudXNlcigpLnJlc2V0KCk7XG4gICAgdGhpcy5ncm91cCgpLnJlc2V0KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvbXBhcmUgYGludGAgYWdhaW5zdCBgdGVzdGAuXG4gICAqXG4gICAqIFRvIGRvdWJsZS1jaGVjayB0aGF0IHRoZXkgaGF2ZSB0aGUgcmlnaHQgZGVmYXVsdHMsIGdsb2JhbHMsIGFuZCBjb25maWcuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGEgYWN0dWFsIGludGVncmF0aW9uIGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGIgdGVzdCBpbnRlZ3JhdGlvbiBjb25zdHJ1Y3RvclxuICAgKi9cblxuICBhbmFseXRpY3MuY29tcGFyZSA9IGZ1bmN0aW9uKGEsIGIpe1xuICAgIGEgPSBuZXcgYTtcbiAgICBiID0gbmV3IGI7XG4gICAgLy8gbmFtZVxuICAgIGFzc2VydChcbiAgICAgIGEubmFtZSA9PT0gYi5uYW1lLFxuICAgICAgZm10KCdFeHBlY3RlZCBuYW1lIHRvIGJlIFwiJXNcIiwgYnV0IGl0IHdhcyBcIiVzXCIuJywgYi5uYW1lLCBhLm5hbWUpXG4gICAgKTtcblxuICAgIC8vIG9wdGlvbnNcbiAgICB2YXIgeCA9IGEuZGVmYXVsdHM7XG4gICAgdmFyIHkgPSBiLmRlZmF1bHRzO1xuICAgIGZvciAodmFyIGtleSBpbiB5KSB7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIHguaGFzT3duUHJvcGVydHkoa2V5KSxcbiAgICAgICAgZm10KCdUaGUgaW50ZWdyYXRpb24gZG9lcyBub3QgaGF2ZSBhbiBvcHRpb24gbmFtZWQgXCIlc1wiLicsIGtleSlcbiAgICAgICk7XG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKFxuICAgICAgICB4W2tleV0sIHlba2V5XSxcbiAgICAgICAgZm10KFxuICAgICAgICAgICdFeHBlY3RlZCBvcHRpb24gXCIlc1wiIHRvIGRlZmF1bHQgdG8gXCIlc1wiLCBidXQgaXQgZGVmYXVsdHMgdG8gXCIlc1wiLicsXG4gICAgICAgICAga2V5LCB5W2tleV0sIHhba2V5XVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIGdsb2JhbHNcbiAgICB2YXIgeCA9IGEuZ2xvYmFscztcbiAgICB2YXIgeSA9IGIuZ2xvYmFscztcbiAgICBlYWNoKHksIGZ1bmN0aW9uKGtleSl7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIGluZGV4T2YoeCwga2V5KSAhPT0gLTEsXG4gICAgICAgIGZtdCgnRXhwZWN0ZWQgZ2xvYmFsIFwiJXNcIiB0byBiZSByZWdpc3RlcmVkLicsIGtleSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICAvLyBhc3N1bWVzUGFnZXZpZXdcbiAgICBhc3NlcnQoXG4gICAgICBhLl9hc3N1bWVzUGFnZXZpZXcgPT0gYi5fYXNzdW1lc1BhZ2V2aWV3LFxuICAgICAgJ0V4cGVjdGVkIHRoZSBpbnRlZ3JhdGlvbiB0byBhc3N1bWUgYSBwYWdldmlldy4nXG4gICAgKTtcblxuICAgIC8vIHJlYWR5T25Jbml0aWFsaXplXG4gICAgYXNzZXJ0KFxuICAgICAgYS5fcmVhZHlPbkluaXRpYWxpemUgPT0gYi5fcmVhZHlPbkluaXRpYWxpemUsXG4gICAgICAnRXhwZWN0ZWQgdGhlIGludGVncmF0aW9uIHRvIGJlIHJlYWR5IG9uIGluaXRpYWxpemUuJ1xuICAgICk7XG5cbiAgICAvLyByZWFkeU9uTG9hZFxuICAgIGFzc2VydChcbiAgICAgIGEuX3JlYWR5T25Mb2FkID09IGIuX3JlYWR5T25Mb2FkLFxuICAgICAgJ0V4cGVjdGVkIGludGVncmF0aW9uIHRvIGJlIHJlYWR5IG9uIGxvYWQuJ1xuICAgICk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFzc2VydCB0aGUgaW50ZWdyYXRpb24gYmVpbmcgdGVzdGVkIGxvYWRzLlxuICAgKlxuICAgKiBAcGFyYW0ge0ludGVncmF0aW9ufSBpbnRlZ3JhdGlvblxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gICAqL1xuXG4gIGFuYWx5dGljcy5sb2FkID0gZnVuY3Rpb24oaW50ZWdyYXRpb24sIGRvbmUpe1xuICAgIGFuYWx5dGljcy5hc3NlcnQoIWludGVncmF0aW9uLmxvYWRlZCgpLCAnRXhwZWN0ZWQgYGludGVncmF0aW9uLmxvYWRlZCgpYCB0byBiZSBmYWxzZSBiZWZvcmUgbG9hZGluZy4nKTtcbiAgICBhbmFseXRpY3Mub25jZSgncmVhZHknLCBmdW5jdGlvbigpe1xuICAgICAgYW5hbHl0aWNzLmFzc2VydChpbnRlZ3JhdGlvbi5sb2FkZWQoKSwgJ0V4cGVjdGVkIGBpbnRlZ3JhdGlvbi5sb2FkZWQoKWAgdG8gYmUgdHJ1ZSBhZnRlciBsb2FkaW5nLicpO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICAgIGFuYWx5dGljcy5pbml0aWFsaXplKCk7XG4gICAgYW5hbHl0aWNzLnBhZ2Uoe30sIHsgTWFya2V0bzogdHJ1ZSB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQXNzZXJ0IGEgc2NyaXB0LCBpbWFnZSwgb3IgaWZyYW1lIHdhcyBsb2FkZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgRE9NIHRlbXBsYXRlXG4gICAqL1xuICBcbiAgYW5hbHl0aWNzLmxvYWRlZCA9IGZ1bmN0aW9uKGludGVncmF0aW9uLCBzdHIpe1xuICAgIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgaW50ZWdyYXRpb24pIHtcbiAgICAgIHN0ciA9IGludGVncmF0aW9uO1xuICAgICAgaW50ZWdyYXRpb24gPSB0aGlzLmludGVncmF0aW9uKCk7XG4gICAgfVxuXG4gICAgdmFyIHRhZ3MgPSBbXTtcblxuICAgIGFzc2VydChcbiAgICAgIH5pbmRleE9mKHRoaXMuc3BpZXMsIGludGVncmF0aW9uLmxvYWQpLFxuICAgICAgJ1lvdSBtdXN0IGNhbGwgYC5zcHkoaW50ZWdyYXRpb24sIFxcJ2xvYWRcXCcpYCBwcmlvciB0byBjYWxsaW5nIGAubG9hZGVkKClgLidcbiAgICApO1xuXG4gICAgLy8gY29sbGVjdCBhbGwgSW1hZ2Ugb3IgSFRNTEVsZW1lbnQgb2JqZWN0c1xuICAgIC8vIGluIGFuIGFycmF5IG9mIHN0cmluZ2lmaWVkIGVsZW1lbnRzLCBmb3IgaHVtYW4tcmVhZGFibGUgYXNzZXJ0aW9ucy5cbiAgICBlYWNoKGludGVncmF0aW9uLmxvYWQucmV0dXJucywgZnVuY3Rpb24oZWwpe1xuICAgICAgdmFyIHRhZyA9IHt9O1xuICAgICAgaWYgKGVsIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkge1xuICAgICAgICB0YWcudHlwZSA9ICdpbWcnO1xuICAgICAgICB0YWcuYXR0cnMgPSB7IHNyYzogZWwuc3JjIH07XG4gICAgICB9IGVsc2UgaWYgKGlzLmVsZW1lbnQoZWwpKSB7XG4gICAgICAgIHRhZy50eXBlID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB0YWcuYXR0cnMgPSBhdHRyaWJ1dGVzKGVsKTtcbiAgICAgICAgc3dpdGNoICh0YWcudHlwZSkge1xuICAgICAgICAgIGNhc2UgJ3NjcmlwdCc6XG4gICAgICAgICAgICAvLyBkb24ndCBjYXJlIGFib3V0IHRoZXNlIHByb3BlcnRpZXMuXG4gICAgICAgICAgICBkZWxldGUgdGFnLmF0dHJzLnR5cGU7XG4gICAgICAgICAgICBkZWxldGUgdGFnLmF0dHJzLmFzeW5jO1xuICAgICAgICAgICAgZGVsZXRlIHRhZy5hdHRycy5kZWZlcjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodGFnLnR5cGUpIHRhZ3MucHVzaChzdHJpbmdpZnkodGFnLnR5cGUsIHRhZy5hdHRycykpO1xuICAgIH0pO1xuXG4gICAgLy8gbm9ybWFsaXplIGZvcm1hdHRpbmdcbiAgICB2YXIgdGFnID0gb2JqZWN0aWZ5KHN0cik7XG4gICAgdmFyIGV4cGVjdGVkID0gc3RyaW5naWZ5KHRhZy50eXBlLCB0YWcuYXR0cnMpO1xuXG4gICAgaWYgKCF0YWdzLmxlbmd0aCkge1xuICAgICAgYXNzZXJ0KGZhbHNlLCBmbXQoJ05vIHRhZ3Mgd2VyZSByZXR1cm5lZC5cXG5FeHBlY3RlZCAlcy4nLCBleHBlY3RlZCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzaG93IHRoZSBjbG9zZXN0IG1hdGNoXG4gICAgICBhc3NlcnQoXG4gICAgICAgIGluZGV4T2YodGFncywgZXhwZWN0ZWQpICE9PSAtMSxcbiAgICAgICAgZm10KCdcXG5FeHBlY3RlZCAlcy5cXG5Gb3VuZCAlcycsIGV4cGVjdGVkLCB0YWdzLmpvaW4oJ1xcbicpKVxuICAgICAgKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCBjdXJyZW50IGludGVncmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtJbnRlZ3JhdGlvbn1cbiAgICovXG4gIFxuICBhbmFseXRpY3MuaW50ZWdyYXRpb24gPSBmdW5jdGlvbigpe1xuICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5faW50ZWdyYXRpb25zKSByZXR1cm4gdGhpcy5faW50ZWdyYXRpb25zW25hbWVdO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBc3NlcnQgYSBgdmFsdWVgIGlzIHRydXRoeS5cbiAgICpcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHJldHVybiB7VGVzdGVyfVxuICAgKi9cblxuICBhbmFseXRpY3MuYXNzZXJ0ID0gYXNzZXJ0O1xuXG4gIC8qKlxuICAgKiBFeHBvc2UgYWxsIG9mIHRoZSBtZXRob2RzIG9uIGBhc3NlcnRgLlxuICAgKlxuICAgKiBAcGFyYW0ge01peGVkfSBhcmdzLi4uXG4gICAqIEByZXR1cm4ge1Rlc3Rlcn1cbiAgICovXG5cbiAgZWFjaChrZXlzKGFzc2VydCksIGZ1bmN0aW9uKGtleSl7XG4gICAgYW5hbHl0aWNzW2tleV0gPSBmdW5jdGlvbigpe1xuICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICBhc3NlcnRba2V5XS5hcHBseShhc3NlcnQsIGFyZ3MpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIERPTSBub2RlIHN0cmluZy5cbiAgICovXG5cbiAgZnVuY3Rpb24gc3RyaW5naWZ5KG5hbWUsIGF0dHJzKSB7XG4gICAgdmFyIHN0ciA9IFtdO1xuICAgIHN0ci5wdXNoKCc8JyArIG5hbWUpO1xuICAgIGVhY2goYXR0cnMsIGZ1bmN0aW9uKGtleSwgdmFsKXtcbiAgICAgIHN0ci5wdXNoKCcgJyArIGtleSArICc9XCInICsgdmFsICsgJ1wiJyk7XG4gICAgfSk7XG4gICAgc3RyLnB1c2goJz4nKTtcbiAgICAvLyBibG9ja1xuICAgIGlmICgnaW1nJyAhPT0gbmFtZSkgc3RyLnB1c2goJzwvJyArIG5hbWUgKyAnPicpO1xuICAgIHJldHVybiBzdHIuam9pbignJyk7XG4gIH1cblxuICAvKipcbiAgICogRE9NIG5vZGUgYXR0cmlidXRlcyBhcyBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7RWxlbWVudH1cbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgXG4gIGZ1bmN0aW9uIGF0dHJpYnV0ZXMobm9kZSkge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICBlYWNoKG5vZGUuYXR0cmlidXRlcywgZnVuY3Rpb24oYXR0cil7XG4gICAgICBvYmpbYXR0ci5uYW1lXSA9IGF0dHIudmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHN0cmluZywgZ2l2ZSBiYWNrIERPTSBhdHRyaWJ1dGVzLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG5cbiAgZnVuY3Rpb24gb2JqZWN0aWZ5KHN0cikge1xuICAgIC8vIHJlcGxhY2UgYHNyY2Agd2l0aCBgZGF0YS1zcmNgIHRvIHByZXZlbnQgaW1hZ2UgbG9hZGluZ1xuICAgIHN0ciA9IHN0ci5yZXBsYWNlKCcgc3JjPVwiJywgJyBkYXRhLXNyYz1cIicpO1xuICAgIFxuICAgIHZhciBlbCA9IGRvbWlmeShzdHIpO1xuICAgIHZhciBhdHRycyA9IHt9O1xuICAgIFxuICAgIGVhY2goZWwuYXR0cmlidXRlcywgZnVuY3Rpb24oYXR0cil7XG4gICAgICAvLyB0aGVuIHJlcGxhY2UgaXQgYmFja1xuICAgICAgdmFyIG5hbWUgPSAnZGF0YS1zcmMnID09IGF0dHIubmFtZSA/ICdzcmMnIDogYXR0ci5uYW1lO1xuICAgICAgYXR0cnNbbmFtZV0gPSBhdHRyLnZhbHVlO1xuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgICBhdHRyczogYXR0cnNcbiAgICB9O1xuICB9XG59IiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGVxdWFscyA9IHJlcXVpcmUoJ2VxdWFscycpO1xudmFyIGZtdCA9IHJlcXVpcmUoJ2ZtdCcpO1xudmFyIHN0YWNrID0gcmVxdWlyZSgnc3RhY2snKTtcblxuLyoqXG4gKiBBc3NlcnQgYGV4cHJgIHdpdGggb3B0aW9uYWwgZmFpbHVyZSBgbXNnYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBleHByXG4gKiBAcGFyYW0ge1N0cmluZ30gW21zZ11cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZnVuY3Rpb24gKGV4cHIsIG1zZykge1xuICBpZiAoZXhwcikgcmV0dXJuO1xuICB0aHJvdyBlcnJvcihtc2cgfHwgbWVzc2FnZSgpKTtcbn07XG5cbi8qKlxuICogQXNzZXJ0IGBhY3R1YWxgIGlzIHdlYWsgZXF1YWwgdG8gYGV4cGVjdGVkYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBhY3R1YWxcbiAqIEBwYXJhbSB7TWl4ZWR9IGV4cGVjdGVkXG4gKiBAcGFyYW0ge1N0cmluZ30gW21zZ11cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5lcXVhbCA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBtc2cpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkgcmV0dXJuO1xuICB0aHJvdyBlcnJvcihtc2cgfHwgZm10KCdFeHBlY3RlZCAlbyB0byBlcXVhbCAlby4nLCBhY3R1YWwsIGV4cGVjdGVkKSwgYWN0dWFsLCBleHBlY3RlZCk7XG59O1xuXG4vKipcbiAqIEFzc2VydCBgYWN0dWFsYCBpcyBub3Qgd2VhayBlcXVhbCB0byBgZXhwZWN0ZWRgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICogQHBhcmFtIHtNaXhlZH0gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBbbXNnXVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLm5vdEVxdWFsID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG1zZykge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSByZXR1cm47XG4gIHRocm93IGVycm9yKG1zZyB8fCBmbXQoJ0V4cGVjdGVkICVvIG5vdCB0byBlcXVhbCAlby4nLCBhY3R1YWwsIGV4cGVjdGVkKSk7XG59O1xuXG4vKipcbiAqIEFzc2VydCBgYWN0dWFsYCBpcyBkZWVwIGVxdWFsIHRvIGBleHBlY3RlZGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gYWN0dWFsXG4gKiBAcGFyYW0ge01peGVkfSBleHBlY3RlZFxuICogQHBhcmFtIHtTdHJpbmd9IFttc2ddXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuZGVlcEVxdWFsID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG1zZykge1xuICBpZiAoZXF1YWxzKGFjdHVhbCwgZXhwZWN0ZWQpKSByZXR1cm47XG4gIHRocm93IGVycm9yKG1zZyB8fCBmbXQoJ0V4cGVjdGVkICVvIHRvIGRlZXBseSBlcXVhbCAlby4nLCBhY3R1YWwsIGV4cGVjdGVkKSwgYWN0dWFsLCBleHBlY3RlZCk7XG59O1xuXG4vKipcbiAqIEFzc2VydCBgYWN0dWFsYCBpcyBub3QgZGVlcCBlcXVhbCB0byBgZXhwZWN0ZWRgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICogQHBhcmFtIHtNaXhlZH0gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBbbXNnXVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBtc2cpIHtcbiAgaWYgKCFlcXVhbHMoYWN0dWFsLCBleHBlY3RlZCkpIHJldHVybjtcbiAgdGhyb3cgZXJyb3IobXNnIHx8IGZtdCgnRXhwZWN0ZWQgJW8gbm90IHRvIGRlZXBseSBlcXVhbCAlby4nLCBhY3R1YWwsIGV4cGVjdGVkKSk7XG59O1xuXG4vKipcbiAqIEFzc2VydCBgYWN0dWFsYCBpcyBzdHJpY3QgZXF1YWwgdG8gYGV4cGVjdGVkYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBhY3R1YWxcbiAqIEBwYXJhbSB7TWl4ZWR9IGV4cGVjdGVkXG4gKiBAcGFyYW0ge1N0cmluZ30gW21zZ11cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBtc2cpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHJldHVybjtcbiAgdGhyb3cgZXJyb3IobXNnIHx8IGZtdCgnRXhwZWN0ZWQgJW8gdG8gc3RyaWN0bHkgZXF1YWwgJW8uJywgYWN0dWFsLCBleHBlY3RlZCksIGFjdHVhbCwgZXhwZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBBc3NlcnQgYGFjdHVhbGAgaXMgbm90IHN0cmljdCBlcXVhbCB0byBgZXhwZWN0ZWRgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICogQHBhcmFtIHtNaXhlZH0gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBbbXNnXVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG1zZykge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkgcmV0dXJuO1xuICB0aHJvdyBlcnJvcihtc2cgfHwgZm10KCdFeHBlY3RlZCAlbyBub3QgdG8gc3RyaWN0bHkgZXF1YWwgJW8uJywgYWN0dWFsLCBleHBlY3RlZCkpO1xufTtcblxuLyoqXG4gKiBBc3NlcnQgYGJsb2NrYCB0aHJvd3MgYW4gYGVycm9yYC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBibG9ja1xuICogQHBhcmFtIHtGdW5jdGlvbn0gW2Vycm9yXVxuICogQHBhcmFtIHtTdHJpbmd9IFttc2ddXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMudGhyb3dzID0gZnVuY3Rpb24gKGJsb2NrLCBlcnIsIG1zZykge1xuICB2YXIgdGhyZXc7XG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocmV3ID0gZTtcbiAgfVxuXG4gIGlmICghdGhyZXcpIHRocm93IGVycm9yKG1zZyB8fCBmbXQoJ0V4cGVjdGVkICVzIHRvIHRocm93IGFuIGVycm9yLicsIGJsb2NrLnRvU3RyaW5nKCkpKTtcbiAgaWYgKGVyciAmJiAhKHRocmV3IGluc3RhbmNlb2YgZXJyKSkge1xuICAgIHRocm93IGVycm9yKG1zZyB8fCBmbXQoJ0V4cGVjdGVkICVzIHRvIHRocm93IGFuICVvLicsIGJsb2NrLnRvU3RyaW5nKCksIGVycikpO1xuICB9XG59O1xuXG4vKipcbiAqIEFzc2VydCBgYmxvY2tgIGRvZXNuJ3QgdGhyb3cgYW4gYGVycm9yYC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBibG9ja1xuICogQHBhcmFtIHtGdW5jdGlvbn0gW2Vycm9yXVxuICogQHBhcmFtIHtTdHJpbmd9IFttc2ddXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuZG9lc05vdFRocm93ID0gZnVuY3Rpb24gKGJsb2NrLCBlcnIsIG1zZykge1xuICB2YXIgdGhyZXc7XG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocmV3ID0gZTtcbiAgfVxuXG4gIGlmICh0aHJldykgdGhyb3cgZXJyb3IobXNnIHx8IGZtdCgnRXhwZWN0ZWQgJXMgbm90IHRvIHRocm93IGFuIGVycm9yLicsIGJsb2NrLnRvU3RyaW5nKCkpKTtcbiAgaWYgKGVyciAmJiAodGhyZXcgaW5zdGFuY2VvZiBlcnIpKSB7XG4gICAgdGhyb3cgZXJyb3IobXNnIHx8IGZtdCgnRXhwZWN0ZWQgJXMgbm90IHRvIHRocm93IGFuICVvLicsIGJsb2NrLnRvU3RyaW5nKCksIGVycikpO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIG1lc3NhZ2UgZnJvbSB0aGUgY2FsbCBzdGFjay5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtZXNzYWdlKCkge1xuICBpZiAoIUVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSByZXR1cm4gJ2Fzc2VydGlvbiBmYWlsZWQnO1xuICB2YXIgY2FsbHNpdGUgPSBzdGFjaygpWzJdO1xuICB2YXIgZm4gPSBjYWxsc2l0ZS5nZXRGdW5jdGlvbk5hbWUoKTtcbiAgdmFyIGZpbGUgPSBjYWxsc2l0ZS5nZXRGaWxlTmFtZSgpO1xuICB2YXIgbGluZSA9IGNhbGxzaXRlLmdldExpbmVOdW1iZXIoKSAtIDE7XG4gIHZhciBjb2wgPSBjYWxsc2l0ZS5nZXRDb2x1bW5OdW1iZXIoKSAtIDE7XG4gIHZhciBzcmMgPSBnZXQoZmlsZSk7XG4gIGxpbmUgPSBzcmMuc3BsaXQoJ1xcbicpW2xpbmVdLnNsaWNlKGNvbCk7XG4gIHZhciBtID0gbGluZS5tYXRjaCgvYXNzZXJ0XFwoKC4qKVxcKS8pO1xuICByZXR1cm4gbSAmJiBtWzFdLnRyaW0oKTtcbn1cblxuLyoqXG4gKiBMb2FkIGNvbnRlbnRzIG9mIGBzY3JpcHRgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzY3JpcHRcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGdldChzY3JpcHQpIHtcbiAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdDtcbiAgeGhyLm9wZW4oJ0dFVCcsIHNjcmlwdCwgZmFsc2UpO1xuICB4aHIuc2VuZChudWxsKTtcbiAgcmV0dXJuIHhoci5yZXNwb25zZVRleHQ7XG59XG5cbi8qKlxuICogRXJyb3Igd2l0aCBgbXNnYCwgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1zZ1xuICogQHBhcmFtIHtNaXhlZH0gYWN0dWFsXG4gKiBAcGFyYW0ge01peGVkfSBleHBlY3RlZFxuICogQHJldHVybiB7RXJyb3J9XG4gKi9cblxuZnVuY3Rpb24gZXJyb3IobXNnLCBhY3R1YWwsIGV4cGVjdGVkKXtcbiAgdmFyIGVyciA9IG5ldyBFcnJvcihtc2cpO1xuICBlcnIuc2hvd0RpZmYgPSAzID09IGFyZ3VtZW50cy5sZW5ndGg7XG4gIGVyci5hY3R1YWwgPSBhY3R1YWw7XG4gIGVyci5leHBlY3RlZCA9IGV4cGVjdGVkO1xuICByZXR1cm4gZXJyO1xufVxuIiwidmFyIHR5cGUgPSByZXF1aXJlKCd0eXBlJylcblxuLy8gKGFueSwgYW55LCBbYXJyYXldKSAtPiBib29sZWFuXG5mdW5jdGlvbiBlcXVhbChhLCBiLCBtZW1vcyl7XG4gIC8vIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50XG4gIGlmIChhID09PSBiKSByZXR1cm4gdHJ1ZVxuICB2YXIgZm5BID0gdHlwZXNbdHlwZShhKV1cbiAgdmFyIGZuQiA9IHR5cGVzW3R5cGUoYildXG4gIHJldHVybiBmbkEgJiYgZm5BID09PSBmbkJcbiAgICA/IGZuQShhLCBiLCBtZW1vcylcbiAgICA6IGZhbHNlXG59XG5cbnZhciB0eXBlcyA9IHt9XG5cbi8vIChOdW1iZXIpIC0+IGJvb2xlYW5cbnR5cGVzLm51bWJlciA9IGZ1bmN0aW9uKGEsIGIpe1xuICByZXR1cm4gYSAhPT0gYSAmJiBiICE9PSBiLypOYW4gY2hlY2sqL1xufVxuXG4vLyAoZnVuY3Rpb24sIGZ1bmN0aW9uLCBhcnJheSkgLT4gYm9vbGVhblxudHlwZXNbJ2Z1bmN0aW9uJ10gPSBmdW5jdGlvbihhLCBiLCBtZW1vcyl7XG4gIHJldHVybiBhLnRvU3RyaW5nKCkgPT09IGIudG9TdHJpbmcoKVxuICAgIC8vIEZ1bmN0aW9ucyBjYW4gYWN0IGFzIG9iamVjdHNcbiAgICAmJiB0eXBlcy5vYmplY3QoYSwgYiwgbWVtb3MpXG4gICAgJiYgZXF1YWwoYS5wcm90b3R5cGUsIGIucHJvdG90eXBlKVxufVxuXG4vLyAoZGF0ZSwgZGF0ZSkgLT4gYm9vbGVhblxudHlwZXMuZGF0ZSA9IGZ1bmN0aW9uKGEsIGIpe1xuICByZXR1cm4gK2EgPT09ICtiXG59XG5cbi8vIChyZWdleHAsIHJlZ2V4cCkgLT4gYm9vbGVhblxudHlwZXMucmVnZXhwID0gZnVuY3Rpb24oYSwgYil7XG4gIHJldHVybiBhLnRvU3RyaW5nKCkgPT09IGIudG9TdHJpbmcoKVxufVxuXG4vLyAoRE9NRWxlbWVudCwgRE9NRWxlbWVudCkgLT4gYm9vbGVhblxudHlwZXMuZWxlbWVudCA9IGZ1bmN0aW9uKGEsIGIpe1xuICByZXR1cm4gYS5vdXRlckhUTUwgPT09IGIub3V0ZXJIVE1MXG59XG5cbi8vICh0ZXh0bm9kZSwgdGV4dG5vZGUpIC0+IGJvb2xlYW5cbnR5cGVzLnRleHRub2RlID0gZnVuY3Rpb24oYSwgYil7XG4gIHJldHVybiBhLnRleHRDb250ZW50ID09PSBiLnRleHRDb250ZW50XG59XG5cbi8vIGRlY29yYXRlIGBmbmAgdG8gcHJldmVudCBpdCByZS1jaGVja2luZyBvYmplY3RzXG4vLyAoZnVuY3Rpb24pIC0+IGZ1bmN0aW9uXG5mdW5jdGlvbiBtZW1vR2F1cmQoZm4pe1xuICByZXR1cm4gZnVuY3Rpb24oYSwgYiwgbWVtb3Mpe1xuICAgIGlmICghbWVtb3MpIHJldHVybiBmbihhLCBiLCBbXSlcbiAgICB2YXIgaSA9IG1lbW9zLmxlbmd0aCwgbWVtb1xuICAgIHdoaWxlIChtZW1vID0gbWVtb3NbLS1pXSkge1xuICAgICAgaWYgKG1lbW9bMF0gPT09IGEgJiYgbWVtb1sxXSA9PT0gYikgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGZuKGEsIGIsIG1lbW9zKVxuICB9XG59XG5cbnR5cGVzWydhcmd1bWVudHMnXSA9XG50eXBlcy5hcnJheSA9IG1lbW9HYXVyZChhcnJheUVxdWFsKVxuXG4vLyAoYXJyYXksIGFycmF5LCBhcnJheSkgLT4gYm9vbGVhblxuZnVuY3Rpb24gYXJyYXlFcXVhbChhLCBiLCBtZW1vcyl7XG4gIHZhciBpID0gYS5sZW5ndGhcbiAgaWYgKGkgIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgbWVtb3MucHVzaChbYSwgYl0pXG4gIHdoaWxlIChpLS0pIHtcbiAgICBpZiAoIWVxdWFsKGFbaV0sIGJbaV0sIG1lbW9zKSkgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxudHlwZXMub2JqZWN0ID0gbWVtb0dhdXJkKG9iamVjdEVxdWFsKVxuXG4vLyAob2JqZWN0LCBvYmplY3QsIGFycmF5KSAtPiBib29sZWFuXG5mdW5jdGlvbiBvYmplY3RFcXVhbChhLCBiLCBtZW1vcykge1xuICBpZiAodHlwZW9mIGEuZXF1YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG1lbW9zLnB1c2goW2EsIGJdKVxuICAgIHJldHVybiBhLmVxdWFsKGIsIG1lbW9zKVxuICB9XG4gIHZhciBrYSA9IGdldEVudW1lcmFibGVQcm9wZXJ0aWVzKGEpXG4gIHZhciBrYiA9IGdldEVudW1lcmFibGVQcm9wZXJ0aWVzKGIpXG4gIHZhciBpID0ga2EubGVuZ3RoXG5cbiAgLy8gc2FtZSBudW1iZXIgb2YgcHJvcGVydGllc1xuICBpZiAoaSAhPT0ga2IubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAvLyBhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXJcbiAga2Euc29ydCgpXG4gIGtiLnNvcnQoKVxuXG4gIC8vIGNoZWFwIGtleSB0ZXN0XG4gIHdoaWxlIChpLS0pIGlmIChrYVtpXSAhPT0ga2JbaV0pIHJldHVybiBmYWxzZVxuXG4gIC8vIHJlbWVtYmVyXG4gIG1lbW9zLnB1c2goW2EsIGJdKVxuXG4gIC8vIGl0ZXJhdGUgYWdhaW4gdGhpcyB0aW1lIGRvaW5nIGEgdGhvcm91Z2ggY2hlY2tcbiAgaSA9IGthLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgdmFyIGtleSA9IGthW2ldXG4gICAgaWYgKCFlcXVhbChhW2tleV0sIGJba2V5XSwgbWVtb3MpKSByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbi8vIChvYmplY3QpIC0+IGFycmF5XG5mdW5jdGlvbiBnZXRFbnVtZXJhYmxlUHJvcGVydGllcyAob2JqZWN0KSB7XG4gIHZhciByZXN1bHQgPSBbXVxuICBmb3IgKHZhciBrIGluIG9iamVjdCkgaWYgKGsgIT09ICdjb25zdHJ1Y3RvcicpIHtcbiAgICByZXN1bHQucHVzaChrKVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlcXVhbFxuIiwiXG52YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZ1xudmFyIERvbU5vZGUgPSB0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnXG4gID8gd2luZG93Lk5vZGVcbiAgOiBGdW5jdGlvblxuXG4vKipcbiAqIFJldHVybiB0aGUgdHlwZSBvZiBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZnVuY3Rpb24oeCl7XG4gIHZhciB0eXBlID0gdHlwZW9mIHhcbiAgaWYgKHR5cGUgIT0gJ29iamVjdCcpIHJldHVybiB0eXBlXG4gIHR5cGUgPSB0eXBlc1t0b1N0cmluZy5jYWxsKHgpXVxuICBpZiAodHlwZSkgcmV0dXJuIHR5cGVcbiAgaWYgKHggaW5zdGFuY2VvZiBEb21Ob2RlKSBzd2l0Y2ggKHgubm9kZVR5cGUpIHtcbiAgICBjYXNlIDE6ICByZXR1cm4gJ2VsZW1lbnQnXG4gICAgY2FzZSAzOiAgcmV0dXJuICd0ZXh0LW5vZGUnXG4gICAgY2FzZSA5OiAgcmV0dXJuICdkb2N1bWVudCdcbiAgICBjYXNlIDExOiByZXR1cm4gJ2RvY3VtZW50LWZyYWdtZW50J1xuICAgIGRlZmF1bHQ6IHJldHVybiAnZG9tLW5vZGUnXG4gIH1cbn1cblxudmFyIHR5cGVzID0gZXhwb3J0cy50eXBlcyA9IHtcbiAgJ1tvYmplY3QgRnVuY3Rpb25dJzogJ2Z1bmN0aW9uJyxcbiAgJ1tvYmplY3QgRGF0ZV0nOiAnZGF0ZScsXG4gICdbb2JqZWN0IFJlZ0V4cF0nOiAncmVnZXhwJyxcbiAgJ1tvYmplY3QgQXJndW1lbnRzXSc6ICdhcmd1bWVudHMnLFxuICAnW29iamVjdCBBcnJheV0nOiAnYXJyYXknLFxuICAnW29iamVjdCBTdHJpbmddJzogJ3N0cmluZycsXG4gICdbb2JqZWN0IE51bGxdJzogJ251bGwnLFxuICAnW29iamVjdCBVbmRlZmluZWRdJzogJ3VuZGVmaW5lZCcsXG4gICdbb2JqZWN0IE51bWJlcl0nOiAnbnVtYmVyJyxcbiAgJ1tvYmplY3QgQm9vbGVhbl0nOiAnYm9vbGVhbicsXG4gICdbb2JqZWN0IE9iamVjdF0nOiAnb2JqZWN0JyxcbiAgJ1tvYmplY3QgVGV4dF0nOiAndGV4dC1ub2RlJyxcbiAgJ1tvYmplY3QgVWludDhBcnJheV0nOiAnYml0LWFycmF5JyxcbiAgJ1tvYmplY3QgVWludDE2QXJyYXldJzogJ2JpdC1hcnJheScsXG4gICdbb2JqZWN0IFVpbnQzMkFycmF5XSc6ICdiaXQtYXJyYXknLFxuICAnW29iamVjdCBVaW50OENsYW1wZWRBcnJheV0nOiAnYml0LWFycmF5JyxcbiAgJ1tvYmplY3QgRXJyb3JdJzogJ2Vycm9yJyxcbiAgJ1tvYmplY3QgRm9ybURhdGFdJzogJ2Zvcm0tZGF0YScsXG4gICdbb2JqZWN0IEZpbGVdJzogJ2ZpbGUnLFxuICAnW29iamVjdCBCbG9iXSc6ICdibG9iJ1xufVxuIiwiXG4vKipcbiAqIEV4cG9zZSBgc3RhY2soKWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBzdGFjaztcblxuLyoqXG4gKiBSZXR1cm4gdGhlIHN0YWNrLlxuICpcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBzdGFjaygpIHtcbiAgdmFyIG9yaWcgPSBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZTtcbiAgRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSBmdW5jdGlvbihfLCBzdGFjayl7IHJldHVybiBzdGFjazsgfTtcbiAgdmFyIGVyciA9IG5ldyBFcnJvcjtcbiAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoZXJyLCBhcmd1bWVudHMuY2FsbGVlKTtcbiAgdmFyIHN0YWNrID0gZXJyLnN0YWNrO1xuICBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IG9yaWc7XG4gIHJldHVybiBzdGFjaztcbn0iLCJcbi8qKlxuICogRXhwb3NlIGBwYXJzZWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZTtcblxuLyoqXG4gKiBUZXN0cyBmb3IgYnJvd3NlciBzdXBwb3J0LlxuICovXG5cbnZhciBpbm5lckhUTUxCdWcgPSBmYWxzZTtcbnZhciBidWdUZXN0RGl2O1xuaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgYnVnVGVzdERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAvLyBTZXR1cFxuICBidWdUZXN0RGl2LmlubmVySFRNTCA9ICcgIDxsaW5rLz48dGFibGU+PC90YWJsZT48YSBocmVmPVwiL2FcIj5hPC9hPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIi8+JztcbiAgLy8gTWFrZSBzdXJlIHRoYXQgbGluayBlbGVtZW50cyBnZXQgc2VyaWFsaXplZCBjb3JyZWN0bHkgYnkgaW5uZXJIVE1MXG4gIC8vIFRoaXMgcmVxdWlyZXMgYSB3cmFwcGVyIGVsZW1lbnQgaW4gSUVcbiAgaW5uZXJIVE1MQnVnID0gIWJ1Z1Rlc3REaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2xpbmsnKS5sZW5ndGg7XG4gIGJ1Z1Rlc3REaXYgPSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogV3JhcCBtYXAgZnJvbSBqcXVlcnkuXG4gKi9cblxudmFyIG1hcCA9IHtcbiAgbGVnZW5kOiBbMSwgJzxmaWVsZHNldD4nLCAnPC9maWVsZHNldD4nXSxcbiAgdHI6IFsyLCAnPHRhYmxlPjx0Ym9keT4nLCAnPC90Ym9keT48L3RhYmxlPiddLFxuICBjb2w6IFsyLCAnPHRhYmxlPjx0Ym9keT48L3Rib2R5Pjxjb2xncm91cD4nLCAnPC9jb2xncm91cD48L3RhYmxlPiddLFxuICAvLyBmb3Igc2NyaXB0L2xpbmsvc3R5bGUgdGFncyB0byB3b3JrIGluIElFNi04LCB5b3UgaGF2ZSB0byB3cmFwXG4gIC8vIGluIGEgZGl2IHdpdGggYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIgaW4gZnJvbnQsIGhhIVxuICBfZGVmYXVsdDogaW5uZXJIVE1MQnVnID8gWzEsICdYPGRpdj4nLCAnPC9kaXY+J10gOiBbMCwgJycsICcnXVxufTtcblxubWFwLnRkID1cbm1hcC50aCA9IFszLCAnPHRhYmxlPjx0Ym9keT48dHI+JywgJzwvdHI+PC90Ym9keT48L3RhYmxlPiddO1xuXG5tYXAub3B0aW9uID1cbm1hcC5vcHRncm91cCA9IFsxLCAnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JywgJzwvc2VsZWN0PiddO1xuXG5tYXAudGhlYWQgPVxubWFwLnRib2R5ID1cbm1hcC5jb2xncm91cCA9XG5tYXAuY2FwdGlvbiA9XG5tYXAudGZvb3QgPSBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXTtcblxubWFwLnBvbHlsaW5lID1cbm1hcC5lbGxpcHNlID1cbm1hcC5wb2x5Z29uID1cbm1hcC5jaXJjbGUgPVxubWFwLnRleHQgPVxubWFwLmxpbmUgPVxubWFwLnBhdGggPVxubWFwLnJlY3QgPVxubWFwLmcgPSBbMSwgJzxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZlcnNpb249XCIxLjFcIj4nLCc8L3N2Zz4nXTtcblxuLyoqXG4gKiBQYXJzZSBgaHRtbGAgYW5kIHJldHVybiBhIERPTSBOb2RlIGluc3RhbmNlLCB3aGljaCBjb3VsZCBiZSBhIFRleHROb2RlLFxuICogSFRNTCBET00gTm9kZSBvZiBzb21lIGtpbmQgKDxkaXY+IGZvciBleGFtcGxlKSwgb3IgYSBEb2N1bWVudEZyYWdtZW50XG4gKiBpbnN0YW5jZSwgZGVwZW5kaW5nIG9uIHRoZSBjb250ZW50cyBvZiB0aGUgYGh0bWxgIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaHRtbCAtIEhUTUwgc3RyaW5nIHRvIFwiZG9taWZ5XCJcbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyAtIFRoZSBgZG9jdW1lbnRgIGluc3RhbmNlIHRvIGNyZWF0ZSB0aGUgTm9kZSBmb3JcbiAqIEByZXR1cm4ge0RPTU5vZGV9IHRoZSBUZXh0Tm9kZSwgRE9NIE5vZGUsIG9yIERvY3VtZW50RnJhZ21lbnQgaW5zdGFuY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKGh0bWwsIGRvYykge1xuICBpZiAoJ3N0cmluZycgIT0gdHlwZW9mIGh0bWwpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0cmluZyBleHBlY3RlZCcpO1xuXG4gIC8vIGRlZmF1bHQgdG8gdGhlIGdsb2JhbCBgZG9jdW1lbnRgIG9iamVjdFxuICBpZiAoIWRvYykgZG9jID0gZG9jdW1lbnQ7XG5cbiAgLy8gdGFnIG5hbWVcbiAgdmFyIG0gPSAvPChbXFx3Ol0rKS8uZXhlYyhodG1sKTtcbiAgaWYgKCFtKSByZXR1cm4gZG9jLmNyZWF0ZVRleHROb2RlKGh0bWwpO1xuXG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTsgLy8gUmVtb3ZlIGxlYWRpbmcvdHJhaWxpbmcgd2hpdGVzcGFjZVxuXG4gIHZhciB0YWcgPSBtWzFdO1xuXG4gIC8vIGJvZHkgc3VwcG9ydFxuICBpZiAodGFnID09ICdib2R5Jykge1xuICAgIHZhciBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KCdodG1sJyk7XG4gICAgZWwuaW5uZXJIVE1MID0gaHRtbDtcbiAgICByZXR1cm4gZWwucmVtb3ZlQ2hpbGQoZWwubGFzdENoaWxkKTtcbiAgfVxuXG4gIC8vIHdyYXAgbWFwXG4gIHZhciB3cmFwID0gbWFwW3RhZ10gfHwgbWFwLl9kZWZhdWx0O1xuICB2YXIgZGVwdGggPSB3cmFwWzBdO1xuICB2YXIgcHJlZml4ID0gd3JhcFsxXTtcbiAgdmFyIHN1ZmZpeCA9IHdyYXBbMl07XG4gIHZhciBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZWwuaW5uZXJIVE1MID0gcHJlZml4ICsgaHRtbCArIHN1ZmZpeDtcbiAgd2hpbGUgKGRlcHRoLS0pIGVsID0gZWwubGFzdENoaWxkO1xuXG4gIC8vIG9uZSBlbGVtZW50XG4gIGlmIChlbC5maXJzdENoaWxkID09IGVsLmxhc3RDaGlsZCkge1xuICAgIHJldHVybiBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcbiAgfVxuXG4gIC8vIHNldmVyYWwgZWxlbWVudHNcbiAgdmFyIGZyYWdtZW50ID0gZG9jLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgd2hpbGUgKGVsLmZpcnN0Q2hpbGQpIHtcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKSk7XG4gIH1cblxuICByZXR1cm4gZnJhZ21lbnQ7XG59XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgbWVyZ2UgPSByZXF1aXJlKCdtZXJnZScpO1xudmFyIGVxbCA9IHJlcXVpcmUoJ2VxbCcpO1xuXG4vKipcbiAqIENyZWF0ZSBhIHRlc3Qgc3R1YiB3aXRoIGBvYmpgLCBgbWV0aG9kYC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHMgPSByZXF1aXJlKCdzdHViJykoe30sICd0b1N0cmluZycpO1xuICogICAgICBzID0gcmVxdWlyZSgnc3R1YicpKGRvY3VtZW50LndyaXRlKTtcbiAqICAgICAgcyA9IHJlcXVpcmUoJ3N0dWInKSgpO1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgbWV0aG9kKXtcbiAgdmFyIGZuID0gdG9GdW5jdGlvbihhcmd1bWVudHMsIHN0dWIpO1xuICBtZXJnZShzdHViLCBwcm90byk7XG4gIHN0dWIucmVzZXQoKTtcbiAgc3R1Yi5uYW1lID0gbWV0aG9kO1xuICByZXR1cm4gc3R1YjtcblxuICBmdW5jdGlvbiBzdHViKCl7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIHJldCA9IGZuKGFyZ3VtZW50cyk7XG4gICAgLy9zdHViLnJldHVybnMgfHwgc3R1Yi5yZXNldCgpO1xuICAgIHN0dWIuYXJncy5wdXNoKGFyZ3MpO1xuICAgIHN0dWIucmV0dXJucy5wdXNoKHJldCk7XG4gICAgc3R1Yi51cGRhdGUoKTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG59O1xuXG4vKipcbiAqIFByb3RvdHlwZS5cbiAqL1xuXG52YXIgcHJvdG8gPSB7fTtcblxuLyoqXG4gKiBgdHJ1ZWAgaWYgdGhlIHN0dWIgd2FzIGNhbGxlZCB3aXRoIGBhcmdzYC5cbiAqXG4gKiBAcGFyYW0ge0FyZ3VtZW50c30gLi4uXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5nb3QgPVxucHJvdG8uY2FsbGVkV2l0aCA9IGZ1bmN0aW9uKG4pe1xuICB2YXIgYSA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSB0aGlzLmFyZ3MubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgdmFyIGIgPSB0aGlzLmFyZ3NbaV07XG4gICAgaWYgKGVxbChhLCBiLnNsaWNlKDAsIGEubGVuZ3RoKSkpIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybjtcbn07XG5cbi8qKlxuICogYHRydWVgIGlmIHRoZSBzdHViIHJldHVybmVkIGB2YWx1ZWAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnByb3RvLnJldHVybmVkID0gZnVuY3Rpb24odmFsdWUpe1xuICB2YXIgcmV0ID0gdGhpcy5yZXR1cm5zW3RoaXMucmV0dXJucy5sZW5ndGggLSAxXTtcbiAgcmV0dXJuIGVxbChyZXQsIHZhbHVlKTtcbn07XG5cbi8qKlxuICogYHRydWVgIGlmIHRoZSBzdHViIHdhcyBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5vbmNlID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIDEgPT0gdGhpcy5hcmdzLmxlbmd0aDtcbn07XG5cbi8qKlxuICogYHRydWVgIGlmIHRoZSBzdHViIHdhcyBjYWxsZWQgdHdpY2UuXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucHJvdG8udHdpY2UgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gMiA9PSB0aGlzLmFyZ3MubGVuZ3RoO1xufTtcblxuLyoqXG4gKiBgdHJ1ZWAgaWYgdGhlIHN0dWIgd2FzIGNhbGxlZCB0aHJlZSB0aW1lcy5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by50aHJpY2UgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gMyA9PSB0aGlzLmFyZ3MubGVuZ3RoO1xufTtcblxuLyoqXG4gKiBSZXNldCB0aGUgc3R1Yi5cbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucHJvdG8ucmVzZXQgPSBmdW5jdGlvbigpe1xuICB0aGlzLnJldHVybnMgPSBbXTtcbiAgdGhpcy5hcmdzID0gW107XG4gIHRoaXMudXBkYXRlKCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXN0b3JlLlxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5yZXN0b3JlID0gZnVuY3Rpb24oKXtcbiAgaWYgKCF0aGlzLm9iaikgcmV0dXJuIHRoaXM7XG4gIHZhciBtID0gdGhpcy5tZXRob2Q7XG4gIHZhciBmbiA9IHRoaXMuZm47XG4gIHRoaXMub2JqW21dID0gZm47XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIHN0dWIuXG4gKlxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5wcm90by51cGRhdGUgPSBmdW5jdGlvbigpe1xuICB0aGlzLmNhbGxlZCA9ICEhIHRoaXMuYXJncy5sZW5ndGg7XG4gIHRoaXMuY2FsbGVkT25jZSA9IHRoaXMub25jZSgpO1xuICB0aGlzLmNhbGxlZFR3aWNlID0gdGhpcy50d2ljZSgpO1xuICB0aGlzLmNhbGxlZFRocmljZSA9IHRoaXMudGhyaWNlKCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBUbyBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gey4uLn0gYXJnc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gc3R1YlxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiB0b0Z1bmN0aW9uKGFyZ3MsIHN0dWIpe1xuICB2YXIgb2JqID0gYXJnc1swXTtcbiAgdmFyIG1ldGhvZCA9IGFyZ3NbMV07XG4gIHZhciBmbiA9IGFyZ3NbMl0gfHwgZnVuY3Rpb24oKXt9O1xuXG4gIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICBjYXNlIDA6IHJldHVybiBmdW5jdGlvbiBub29wKCl7fTtcbiAgICBjYXNlIDE6IHJldHVybiBmdW5jdGlvbihhcmdzKXsgcmV0dXJuIG9iai5hcHBseShudWxsLCBhcmdzKTsgfTtcbiAgICBjYXNlIDI6XG4gICAgY2FzZSAzOlxuICAgIHZhciBtID0gb2JqW21ldGhvZF07XG4gICAgc3R1Yi5tZXRob2QgPSBtZXRob2Q7XG4gICAgc3R1Yi5mbiA9IG07XG4gICAgc3R1Yi5vYmogPSBvYmo7XG4gICAgb2JqW21ldGhvZF0gPSBzdHViO1xuICAgIHJldHVybiBmdW5jdGlvbihhcmdzKSB7IGZuLmFwcGx5KG9iaiwgYXJncykgfTtcbiAgfVxufSIsIlxuLyoqXG4gKiBtZXJnZSBgYmAncyBwcm9wZXJ0aWVzIHdpdGggYGFgJ3MuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgdmFyIHVzZXIgPSB7fTtcbiAqICAgICAgICBtZXJnZSh1c2VyLCBjb25zb2xlKTtcbiAqICAgICAgICAvLyA+IHsgbG9nOiBmbiwgZGlyOiBmbiAuLn1cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYVxuICogQHBhcmFtIHtPYmplY3R9IGJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gIGZvciAodmFyIGsgaW4gYikgYVtrXSA9IGJba107XG4gIHJldHVybiBhO1xufTtcbiIsIlxuLyoqXG4gKiBkZXBlbmRlbmNpZXNcbiAqL1xuXG52YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcbnZhciBrID0gcmVxdWlyZSgna2V5cycpO1xuXG4vKipcbiAqIEV4cG9ydCBgZXFsYFxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGVxbDtcblxuLyoqXG4gKiBDb21wYXJlIGBhYCB0byBgYmAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gYVxuICogQHBhcmFtIHtNaXhlZH0gYlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZXFsKGEsIGIpe1xuICB2YXIgY29tcGFyZSA9IHR5cGUoYSk7XG5cbiAgLy8gc2FuaXR5IGNoZWNrXG4gIGlmIChjb21wYXJlICE9IHR5cGUoYikpIHJldHVybiBmYWxzZTtcbiAgaWYgKGEgPT09IGIpIHJldHVybiB0cnVlO1xuXG4gIC8vIGNvbXBhcmVcbiAgcmV0dXJuIChjb21wYXJlID0gZXFsW2NvbXBhcmVdKVxuICAgID8gY29tcGFyZShhLCBiKVxuICAgIDogYSA9PSBiO1xufVxuXG4vKipcbiAqIENvbXBhcmUgcmVnZXhwcyBgYWAsIGBiYC5cbiAqXG4gKiBAcGFyYW0ge1JlZ0V4cH0gYVxuICogQHBhcmFtIHtSZWdFeHB9IGJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmVxbC5yZWdleHAgPSBmdW5jdGlvbihhLCBiKXtcbiAgcmV0dXJuIGEuaWdub3JlQ2FzZSA9PSBiLmlnbm9yZUNhc2VcbiAgICAmJiBhLm11bHRpbGluZSA9PSBiLm11bHRpbGluZVxuICAgICYmIGEubGFzdEluZGV4ID09IGIubGFzdEluZGV4XG4gICAgJiYgYS5nbG9iYWwgPT0gYi5nbG9iYWxcbiAgICAmJiBhLnNvdXJjZSA9PSBiLnNvdXJjZTtcbn07XG5cbi8qKlxuICogQ29tcGFyZSBvYmplY3RzIGBhYCwgYGJgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhXG4gKiBAcGFyYW0ge09iamVjdH0gYlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXFsLm9iamVjdCA9IGZ1bmN0aW9uKGEsIGIpe1xuICB2YXIga2V5cyA9IHt9O1xuXG4gIC8vIHByb3RvXG4gIGlmIChhLnByb3RvdHlwZSAhPSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIGtleXNcbiAga2V5cy5hID0gayhhKS5zb3J0KCk7XG4gIGtleXMuYiA9IGsoYikuc29ydCgpO1xuXG4gIC8vIGxlbmd0aFxuICBpZiAoa2V5cy5hLmxlbmd0aCAhPSBrZXlzLmIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8ga2V5c1xuICBpZiAoa2V5cy5hLnRvU3RyaW5nKCkgIT0ga2V5cy5iLnRvU3RyaW5nKCkpIHJldHVybiBmYWxzZTtcblxuICAvLyB3YWxrXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5hLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGtleSA9IGtleXMuYVtpXTtcbiAgICBpZiAoIWVxbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGVxbFxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogQ29tcGFyZSBhcnJheXMgYGFgLCBgYmAuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYVxuICogQHBhcmFtIHtBcnJheX0gYlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXFsLmFycmF5ID0gZnVuY3Rpb24oYSwgYil7XG4gIGlmIChhLmxlbmd0aCAhPSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoIWVxbChhW2ldLCBiW2ldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBDb21wYXJlIGRhdGVzIGBhYCwgYGJgLlxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gYVxuICogQHBhcmFtIHtEYXRlfSBiXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5lcWwuZGF0ZSA9IGZ1bmN0aW9uKGEsIGIpe1xuICByZXR1cm4gK2EgPT0gK2I7XG59O1xuIiwidmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24ob2JqKXtcbiAgdmFyIGtleXMgPSBbXTtcblxuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UnKTtcbnZhciBlcWwgPSByZXF1aXJlKCdlcWwnKTtcblxuLyoqXG4gKiBDcmVhdGUgYSB0ZXN0IHNweSB3aXRoIGBvYmpgLCBgbWV0aG9kYC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHMgPSByZXF1aXJlKCdzcHknKSh7fSwgJ3RvU3RyaW5nJyk7XG4gKiAgICAgIHMgPSByZXF1aXJlKCdzcHknKShkb2N1bWVudC53cml0ZSk7XG4gKiAgICAgIHMgPSByZXF1aXJlKCdzcHknKSgpO1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgbWV0aG9kKXtcbiAgdmFyIGZuID0gdG9GdW5jdGlvbihhcmd1bWVudHMsIHNweSk7XG4gIG1lcmdlKHNweSwgcHJvdG8pO1xuICByZXR1cm4gc3B5LnJlc2V0KCk7XG5cbiAgZnVuY3Rpb24gc3B5KCl7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIHJldCA9IGZuKGFyZ3VtZW50cyk7XG4gICAgc3B5LnJldHVybnMgfHwgc3B5LnJlc2V0KCk7XG4gICAgc3B5LmFyZ3MucHVzaChhcmdzKTtcbiAgICBzcHkucmV0dXJucy5wdXNoKHJldCk7XG4gICAgc3B5LnVwZGF0ZSgpO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbn07XG5cbi8qKlxuICogUHNldWRvLXByb3RvdHlwZS5cbiAqL1xuXG52YXIgcHJvdG8gPSB7fTtcblxuLyoqXG4gKiBMYXppbHkgbWF0Y2ggYGFyZ3NgIGFuZCByZXR1cm4gYHRydWVgIGlmIHRoZSBzcHkgd2FzIGNhbGxlZCB3aXRoIHRoZW0uXG4gKlxuICogQHBhcmFtIHtBcmd1bWVudHN9IGFyZ3NcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnByb3RvLmdvdCA9XG5wcm90by5jYWxsZWRXaXRoID1cbnByb3RvLmdvdExhenkgPVxucHJvdG8uY2FsbGVkV2l0aExhenkgPSBmdW5jdGlvbigpe1xuICB2YXIgYSA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblxuICBmb3IgKHZhciBpID0gMCwgYXJnczsgYXJncyA9IHRoaXMuYXJnc1tpXTsgaSsrKSB7XG4gICAgaWYgKGVxbChhLCAgYXJncy5zbGljZSgwLCBhLmxlbmd0aCkpKSByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogRXhhY3RseSBtYXRjaCBgYXJnc2AgYW5kIHJldHVybiBgdHJ1ZWAgaWYgdGhlIHNweSB3YXMgY2FsbGVkIHdpdGggdGhlbS5cbiAqXG4gKiBAcGFyYW0ge0FyZ3VtZW50c30gLi4uXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5nb3RFeGFjdGx5ID1cbnByb3RvLmNhbGxlZFdpdGhFeGFjdGx5ID0gZnVuY3Rpb24oKXtcbiAgdmFyIGEgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGFyZ3M7IGFyZ3MgPSB0aGlzLmFyZ3NbaV07IGkrKykge1xuICAgIGlmIChlcWwoYSwgYXJncykpIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBgdHJ1ZWAgaWYgdGhlIHNweSByZXR1cm5lZCBgdmFsdWVgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5yZXR1cm5lZCA9IGZ1bmN0aW9uKHZhbHVlKXtcbiAgdmFyIHJldCA9IHRoaXMucmV0dXJuc1t0aGlzLnJldHVybnMubGVuZ3RoIC0gMV07XG4gIHJldHVybiBlcWwocmV0LCB2YWx1ZSk7XG59O1xuXG4vKipcbiAqIGB0cnVlYCBpZiB0aGUgc3B5IHdhcyBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5vbmNlID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIDEgPT0gdGhpcy5hcmdzLmxlbmd0aDtcbn07XG5cbi8qKlxuICogYHRydWVgIGlmIHRoZSBzcHkgd2FzIGNhbGxlZCB0d2ljZS5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by50d2ljZSA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiAyID09IHRoaXMuYXJncy5sZW5ndGg7XG59O1xuXG4vKipcbiAqIGB0cnVlYCBpZiB0aGUgc3B5IHdhcyBjYWxsZWQgdGhyZWUgdGltZXMuXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucHJvdG8udGhyaWNlID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIDMgPT0gdGhpcy5hcmdzLmxlbmd0aDtcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIHNweS5cbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucHJvdG8ucmVzZXQgPSBmdW5jdGlvbigpe1xuICB0aGlzLnJldHVybnMgPSBbXTtcbiAgdGhpcy5hcmdzID0gW107XG4gIHRoaXMudXBkYXRlKCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXN0b3JlLlxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5wcm90by5yZXN0b3JlID0gZnVuY3Rpb24oKXtcbiAgaWYgKCF0aGlzLm9iaikgcmV0dXJuIHRoaXM7XG4gIHZhciBtID0gdGhpcy5tZXRob2Q7XG4gIHZhciBmbiA9IHRoaXMuZm47XG4gIHRoaXMub2JqW21dID0gZm47XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIHNweS5cbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnByb3RvLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuY2FsbGVkID0gISEgdGhpcy5hcmdzLmxlbmd0aDtcbiAgdGhpcy5jYWxsZWRPbmNlID0gdGhpcy5vbmNlKCk7XG4gIHRoaXMuY2FsbGVkVHdpY2UgPSB0aGlzLnR3aWNlKCk7XG4gIHRoaXMuY2FsbGVkVGhyaWNlID0gdGhpcy50aHJpY2UoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRvIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7Li4ufSBhcmdzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBzcHlcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gdG9GdW5jdGlvbihhcmdzLCBzcHkpe1xuICB2YXIgb2JqID0gYXJnc1swXTtcbiAgdmFyIG1ldGhvZCA9IGFyZ3NbMV07XG5cbiAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgIGNhc2UgMDogcmV0dXJuIGZ1bmN0aW9uIG5vb3AoKXt9O1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKGFyZ3MpeyByZXR1cm4gb2JqLmFwcGx5KG51bGwsIGFyZ3MpOyB9O1xuICAgIGNhc2UgMjpcbiAgICAgIHZhciBtID0gb2JqW21ldGhvZF07XG4gICAgICBtZXJnZShzcHksIG0pO1xuICAgICAgc3B5Lm1ldGhvZCA9IG1ldGhvZDtcbiAgICAgIHNweS5mbiA9IG07XG4gICAgICBzcHkub2JqID0gb2JqO1xuICAgICAgb2JqW21ldGhvZF0gPSBzcHk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oYXJncyl7XG4gICAgICAgIHJldHVybiBtLmFwcGx5KG9iaiwgYXJncyk7XG4gICAgICB9O1xuICB9XG59XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgVHJhY2sgPSByZXF1aXJlKCdmYWNhZGUnKS5UcmFjaztcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ2RlZmF1bHRzJyk7XG52YXIgZG90ID0gcmVxdWlyZSgnb2JqLWNhc2UnKTtcbnZhciBlYWNoID0gcmVxdWlyZSgnZWFjaCcpO1xudmFyIGludGVncmF0aW9uID0gcmVxdWlyZSgnYW5hbHl0aWNzLmpzLWludGVncmF0aW9uJyk7XG52YXIgaXMgPSByZXF1aXJlKCdpcycpO1xudmFyIGtleXMgPSByZXF1aXJlKCdvYmplY3QnKS5rZXlzO1xudmFyIGxlbiA9IHJlcXVpcmUoJ29iamVjdCcpLmxlbmd0aDtcbnZhciBwdXNoID0gcmVxdWlyZSgnZ2xvYmFsLXF1ZXVlJykoJ19nYXEnKTtcbnZhciBzZWxlY3QgPSByZXF1aXJlKCdzZWxlY3QnKTtcbnZhciB1c2VIdHRwcyA9IHJlcXVpcmUoJ3VzZS1odHRwcycpO1xudmFyIHVzZXI7XG5cbi8qKlxuICogRXhwb3NlIHBsdWdpbi5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBmdW5jdGlvbihhbmFseXRpY3MpIHtcbiAgYW5hbHl0aWNzLmFkZEludGVncmF0aW9uKEdBKTtcbiAgdXNlciA9IGFuYWx5dGljcy51c2VyKCk7XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgR0FgIGludGVncmF0aW9uLlxuICpcbiAqIGh0dHA6Ly9zdXBwb3J0Lmdvb2dsZS5jb20vYW5hbHl0aWNzL2Jpbi9hbnN3ZXIucHk/aGw9ZW4mYW5zd2VyPTI1NTg4NjdcbiAqIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9nYWpzL21ldGhvZHMvZ2FKU0FwaUJhc2ljQ29uZmlndXJhdGlvbiNfZ2F0LkdBX1RyYWNrZXJfLl9zZXRTaXRlU3BlZWRTYW1wbGVSYXRlXG4gKi9cblxudmFyIEdBID0gZXhwb3J0cy5JbnRlZ3JhdGlvbiA9IGludGVncmF0aW9uKCdHb29nbGUgQW5hbHl0aWNzJylcbiAgLnJlYWR5T25Mb2FkKClcbiAgLmdsb2JhbCgnZ2EnKVxuICAuZ2xvYmFsKCdnYXBsdWdpbnMnKVxuICAuZ2xvYmFsKCdfZ2FxJylcbiAgLmdsb2JhbCgnR29vZ2xlQW5hbHl0aWNzT2JqZWN0JylcbiAgLm9wdGlvbignYW5vbnltaXplSXAnLCBmYWxzZSlcbiAgLm9wdGlvbignY2xhc3NpYycsIGZhbHNlKVxuICAub3B0aW9uKCdkaW1lbnNpb25zJywge30pXG4gIC5vcHRpb24oJ2RvbWFpbicsICdhdXRvJylcbiAgLm9wdGlvbignZG91YmxlQ2xpY2snLCBmYWxzZSlcbiAgLm9wdGlvbignZW5oYW5jZWRFY29tbWVyY2UnLCBmYWxzZSlcbiAgLm9wdGlvbignZW5oYW5jZWRMaW5rQXR0cmlidXRpb24nLCBmYWxzZSlcbiAgLm9wdGlvbignaWdub3JlZFJlZmVycmVycycsIG51bGwpXG4gIC5vcHRpb24oJ2luY2x1ZGVTZWFyY2gnLCBmYWxzZSlcbiAgLm9wdGlvbignbWV0cmljcycsIHt9KVxuICAub3B0aW9uKCdub25JbnRlcmFjdGlvbicsIGZhbHNlKVxuICAub3B0aW9uKCdzZW5kVXNlcklkJywgZmFsc2UpXG4gIC5vcHRpb24oJ3NpdGVTcGVlZFNhbXBsZVJhdGUnLCAxKVxuICAub3B0aW9uKCd0cmFja0NhdGVnb3JpemVkUGFnZXMnLCB0cnVlKVxuICAub3B0aW9uKCd0cmFja05hbWVkUGFnZXMnLCB0cnVlKVxuICAub3B0aW9uKCd0cmFja2luZ0lkJywgJycpXG4gIC50YWcoJ2xpYnJhcnknLCAnPHNjcmlwdCBzcmM9XCIvL3d3dy5nb29nbGUtYW5hbHl0aWNzLmNvbS9hbmFseXRpY3MuanNcIj4nKVxuICAudGFnKCdkb3VibGUgY2xpY2snLCAnPHNjcmlwdCBzcmM9XCIvL3N0YXRzLmcuZG91YmxlY2xpY2submV0L2RjLmpzXCI+JylcbiAgLnRhZygnaHR0cCcsICc8c2NyaXB0IHNyYz1cImh0dHA6Ly93d3cuZ29vZ2xlLWFuYWx5dGljcy5jb20vZ2EuanNcIj4nKVxuICAudGFnKCdodHRwcycsICc8c2NyaXB0IHNyYz1cImh0dHBzOi8vc3NsLmdvb2dsZS1hbmFseXRpY3MuY29tL2dhLmpzXCI+Jyk7XG5cbi8qKlxuICogT24gYGNvbnN0cnVjdGAgc3dhcCBhbnkgY29uZmlnLWJhc2VkIG1ldGhvZHMgdG8gdGhlIHByb3BlciBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuXG5HQS5vbignY29uc3RydWN0JywgZnVuY3Rpb24oaW50ZWdyYXRpb24pIHtcbiAgaWYgKGludGVncmF0aW9uLm9wdGlvbnMuY2xhc3NpYykge1xuICAgIGludGVncmF0aW9uLmluaXRpYWxpemUgPSBpbnRlZ3JhdGlvbi5pbml0aWFsaXplQ2xhc3NpYztcbiAgICBpbnRlZ3JhdGlvbi5sb2FkZWQgPSBpbnRlZ3JhdGlvbi5sb2FkZWRDbGFzc2ljO1xuICAgIGludGVncmF0aW9uLnBhZ2UgPSBpbnRlZ3JhdGlvbi5wYWdlQ2xhc3NpYztcbiAgICBpbnRlZ3JhdGlvbi50cmFjayA9IGludGVncmF0aW9uLnRyYWNrQ2xhc3NpYztcbiAgICBpbnRlZ3JhdGlvbi5jb21wbGV0ZWRPcmRlciA9IGludGVncmF0aW9uLmNvbXBsZXRlZE9yZGVyQ2xhc3NpYztcbiAgfSBlbHNlIGlmIChpbnRlZ3JhdGlvbi5vcHRpb25zLmVuaGFuY2VkRWNvbW1lcmNlKSB7XG4gICAgaW50ZWdyYXRpb24udmlld2VkUHJvZHVjdCA9IGludGVncmF0aW9uLnZpZXdlZFByb2R1Y3RFbmhhbmNlZDtcbiAgICBpbnRlZ3JhdGlvbi5jbGlja2VkUHJvZHVjdCA9IGludGVncmF0aW9uLmNsaWNrZWRQcm9kdWN0RW5oYW5jZWQ7XG4gICAgaW50ZWdyYXRpb24uYWRkZWRQcm9kdWN0ID0gaW50ZWdyYXRpb24uYWRkZWRQcm9kdWN0RW5oYW5jZWQ7XG4gICAgaW50ZWdyYXRpb24ucmVtb3ZlZFByb2R1Y3QgPSBpbnRlZ3JhdGlvbi5yZW1vdmVkUHJvZHVjdEVuaGFuY2VkO1xuICAgIGludGVncmF0aW9uLnN0YXJ0ZWRPcmRlciA9IGludGVncmF0aW9uLnN0YXJ0ZWRPcmRlckVuaGFuY2VkO1xuICAgIGludGVncmF0aW9uLnZpZXdlZENoZWNrb3V0U3RlcCA9IGludGVncmF0aW9uLnZpZXdlZENoZWNrb3V0U3RlcEVuaGFuY2VkO1xuICAgIGludGVncmF0aW9uLmNvbXBsZXRlZENoZWNrb3V0U3RlcCA9IGludGVncmF0aW9uLmNvbXBsZXRlZENoZWNrb3V0U3RlcEVuaGFuY2VkO1xuICAgIGludGVncmF0aW9uLnVwZGF0ZWRPcmRlciA9IGludGVncmF0aW9uLnVwZGF0ZWRPcmRlckVuaGFuY2VkO1xuICAgIGludGVncmF0aW9uLmNvbXBsZXRlZE9yZGVyID0gaW50ZWdyYXRpb24uY29tcGxldGVkT3JkZXJFbmhhbmNlZDtcbiAgICBpbnRlZ3JhdGlvbi5yZWZ1bmRlZE9yZGVyID0gaW50ZWdyYXRpb24ucmVmdW5kZWRPcmRlckVuaGFuY2VkO1xuICAgIGludGVncmF0aW9uLnZpZXdlZFByb21vdGlvbiA9IGludGVncmF0aW9uLnZpZXdlZFByb21vdGlvbkVuaGFuY2VkO1xuICAgIGludGVncmF0aW9uLmNsaWNrZWRQcm9tb3Rpb24gPSBpbnRlZ3JhdGlvbi5jbGlja2VkUHJvbW90aW9uRW5oYW5jZWQ7XG4gIH1cbn0pO1xuXG4vKipcbiAqIEluaXRpYWxpemUuXG4gKlxuICogaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vYW5hbHl0aWNzL2Rldmd1aWRlcy9jb2xsZWN0aW9uL2FuYWx5dGljc2pzL2FkdmFuY2VkXG4gKi9cblxuR0EucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9wdHMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgLy8gc2V0dXAgdGhlIHRyYWNrZXIgZ2xvYmFsc1xuICB3aW5kb3cuR29vZ2xlQW5hbHl0aWNzT2JqZWN0ID0gJ2dhJztcbiAgd2luZG93LmdhID0gd2luZG93LmdhIHx8IGZ1bmN0aW9uKCkge1xuICAgIHdpbmRvdy5nYS5xID0gd2luZG93LmdhLnEgfHwgW107XG4gICAgd2luZG93LmdhLnEucHVzaChhcmd1bWVudHMpO1xuICB9O1xuICB3aW5kb3cuZ2EubCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gIGlmICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgPT09ICdsb2NhbGhvc3QnKSBvcHRzLmRvbWFpbiA9ICdub25lJztcblxuICB3aW5kb3cuZ2EoJ2NyZWF0ZScsIG9wdHMudHJhY2tpbmdJZCwge1xuICAgIC8vIEZhbGwgYmFjayBvbiBkZWZhdWx0IHRvIHByb3RlY3QgYWdhaW5zdCBlbXB0eSBzdHJpbmdcbiAgICBjb29raWVEb21haW46IG9wdHMuZG9tYWluIHx8IEdBLnByb3RvdHlwZS5kZWZhdWx0cy5kb21haW4sXG4gICAgc2l0ZVNwZWVkU2FtcGxlUmF0ZTogb3B0cy5zaXRlU3BlZWRTYW1wbGVSYXRlLFxuICAgIGFsbG93TGlua2VyOiB0cnVlXG4gIH0pO1xuXG4gIC8vIGRpc3BsYXkgYWR2ZXJ0aXNpbmdcbiAgaWYgKG9wdHMuZG91YmxlQ2xpY2spIHtcbiAgICB3aW5kb3cuZ2EoJ3JlcXVpcmUnLCAnZGlzcGxheWZlYXR1cmVzJyk7XG4gIH1cblxuICAvLyBodHRwczovL3N1cHBvcnQuZ29vZ2xlLmNvbS9hbmFseXRpY3MvYW5zd2VyLzI1NTg4Njc/aGw9ZW5cbiAgaWYgKG9wdHMuZW5oYW5jZWRMaW5rQXR0cmlidXRpb24pIHtcbiAgICB3aW5kb3cuZ2EoJ3JlcXVpcmUnLCAnbGlua2lkJywgJ2xpbmtpZC5qcycpO1xuICB9XG5cbiAgLy8gc2VuZCBnbG9iYWwgaWRcbiAgaWYgKG9wdHMuc2VuZFVzZXJJZCAmJiB1c2VyLmlkKCkpIHtcbiAgICB3aW5kb3cuZ2EoJ3NldCcsICd1c2VySWQnLCB1c2VyLmlkKCkpO1xuICB9XG5cbiAgLy8gYW5vbnltaXplIGFmdGVyIGluaXRpYWxpemluZywgb3RoZXJ3aXNlIGEgd2FybmluZyBpcyBzaG93blxuICAvLyBpbiBnb29nbGUgYW5hbHl0aWNzIGRlYnVnZ2VyXG4gIGlmIChvcHRzLmFub255bWl6ZUlwKSB3aW5kb3cuZ2EoJ3NldCcsICdhbm9ueW1pemVJcCcsIHRydWUpO1xuXG4gIC8vIGN1c3RvbSBkaW1lbnNpb25zICYgbWV0cmljc1xuICB2YXIgY3VzdG9tID0gbWV0cmljcyh1c2VyLnRyYWl0cygpLCBvcHRzKTtcbiAgaWYgKGxlbihjdXN0b20pKSB3aW5kb3cuZ2EoJ3NldCcsIGN1c3RvbSk7XG5cbiAgdGhpcy5sb2FkKCdsaWJyYXJ5JywgdGhpcy5yZWFkeSk7XG59O1xuXG4vKipcbiAqIExvYWRlZD9cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbkdBLnByb3RvdHlwZS5sb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICEhd2luZG93LmdhcGx1Z2lucztcbn07XG5cbi8qKlxuICogUGFnZS5cbiAqXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvcGFnZXNcbiAqIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9zaW5nbGUtcGFnZS1hcHBsaWNhdGlvbnMjbXVsdGlwbGUtaGl0c1xuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAcGFyYW0ge1BhZ2V9IHBhZ2VcbiAqL1xuXG5HQS5wcm90b3R5cGUucGFnZSA9IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgdmFyIGNhdGVnb3J5ID0gcGFnZS5jYXRlZ29yeSgpO1xuICB2YXIgcHJvcHMgPSBwYWdlLnByb3BlcnRpZXMoKTtcbiAgdmFyIG5hbWUgPSBwYWdlLmZ1bGxOYW1lKCk7XG4gIHZhciBvcHRzID0gdGhpcy5vcHRpb25zO1xuICB2YXIgY2FtcGFpZ24gPSBwYWdlLnByb3h5KCdjb250ZXh0LmNhbXBhaWduJykgfHwge307XG4gIHZhciBwYWdldmlldyA9IHt9O1xuICB2YXIgcGFnZVBhdGggPSBwYXRoKHByb3BzLCB0aGlzLm9wdGlvbnMpO1xuICB2YXIgcGFnZVRpdGxlID0gbmFtZSB8fCBwcm9wcy50aXRsZTtcbiAgdmFyIHRyYWNrO1xuXG4gIC8vIHN0b3JlIGZvciBsYXRlclxuICAvLyBUT0RPOiBXaHk/IERvY3VtZW50IHRoaXMgYmV0dGVyXG4gIHRoaXMuX2NhdGVnb3J5ID0gY2F0ZWdvcnk7XG5cbiAgcGFnZXZpZXcucGFnZSA9IHBhZ2VQYXRoO1xuICBwYWdldmlldy50aXRsZSA9IHBhZ2VUaXRsZTtcbiAgcGFnZXZpZXcubG9jYXRpb24gPSBwcm9wcy51cmw7XG5cbiAgaWYgKGNhbXBhaWduLm5hbWUpIHBhZ2V2aWV3LmNhbXBhaWduTmFtZSA9IGNhbXBhaWduLm5hbWU7XG4gIGlmIChjYW1wYWlnbi5zb3VyY2UpIHBhZ2V2aWV3LmNhbXBhaWduU291cmNlID0gY2FtcGFpZ24uc291cmNlO1xuICBpZiAoY2FtcGFpZ24ubWVkaXVtKSBwYWdldmlldy5jYW1wYWlnbk1lZGl1bSA9IGNhbXBhaWduLm1lZGl1bTtcbiAgaWYgKGNhbXBhaWduLmNvbnRlbnQpIHBhZ2V2aWV3LmNhbXBhaWduQ29udGVudCA9IGNhbXBhaWduLmNvbnRlbnQ7XG4gIGlmIChjYW1wYWlnbi50ZXJtKSBwYWdldmlldy5jYW1wYWlnbktleXdvcmQgPSBjYW1wYWlnbi50ZXJtO1xuXG4gIC8vIGN1c3RvbSBkaW1lbnNpb25zIGFuZCBtZXRyaWNzXG4gIHZhciBjdXN0b20gPSBtZXRyaWNzKHByb3BzLCBvcHRzKTtcbiAgaWYgKGxlbihjdXN0b20pKSB3aW5kb3cuZ2EoJ3NldCcsIGN1c3RvbSk7XG5cbiAgLy8gc2V0XG4gIHdpbmRvdy5nYSgnc2V0JywgeyBwYWdlOiBwYWdlUGF0aCwgdGl0bGU6IHBhZ2VUaXRsZSB9KTtcblxuICAvLyBzZW5kXG4gIHdpbmRvdy5nYSgnc2VuZCcsICdwYWdldmlldycsIHBhZ2V2aWV3KTtcblxuICAvLyBjYXRlZ29yaXplZCBwYWdlc1xuICBpZiAoY2F0ZWdvcnkgJiYgdGhpcy5vcHRpb25zLnRyYWNrQ2F0ZWdvcml6ZWRQYWdlcykge1xuICAgIHRyYWNrID0gcGFnZS50cmFjayhjYXRlZ29yeSk7XG4gICAgdGhpcy50cmFjayh0cmFjaywgeyBub25JbnRlcmFjdGlvbjogMSB9KTtcbiAgfVxuXG4gIC8vIG5hbWVkIHBhZ2VzXG4gIGlmIChuYW1lICYmIHRoaXMub3B0aW9ucy50cmFja05hbWVkUGFnZXMpIHtcbiAgICB0cmFjayA9IHBhZ2UudHJhY2sobmFtZSk7XG4gICAgdGhpcy50cmFjayh0cmFjaywgeyBub25JbnRlcmFjdGlvbjogMSB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBJZGVudGlmeS5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQHBhcmFtIHtJZGVudGlmeX0gZXZlbnRcbiAqL1xuXG5HQS5wcm90b3R5cGUuaWRlbnRpZnkgPSBmdW5jdGlvbihpZGVudGlmeSkge1xuICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucztcblxuICBpZiAob3B0cy5zZW5kVXNlcklkICYmIGlkZW50aWZ5LnVzZXJJZCgpKSB7XG4gICAgd2luZG93LmdhKCdzZXQnLCAndXNlcklkJywgaWRlbnRpZnkudXNlcklkKCkpO1xuICB9XG5cbiAgLy8gU2V0IGRpbWVuc2lvbnNcbiAgdmFyIGN1c3RvbSA9IG1ldHJpY3ModXNlci50cmFpdHMoKSwgb3B0cyk7XG4gIGlmIChsZW4oY3VzdG9tKSkgd2luZG93LmdhKCdzZXQnLCBjdXN0b20pO1xufTtcblxuLyoqXG4gKiBUcmFjay5cbiAqXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvZXZlbnRzXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvZmllbGQtcmVmZXJlbmNlXG4gKlxuICogQHBhcmFtIHtUcmFja30gZXZlbnRcbiAqL1xuXG5HQS5wcm90b3R5cGUudHJhY2sgPSBmdW5jdGlvbih0cmFjaywgb3B0aW9ucykge1xuICB2YXIgY29udGV4dE9wdHMgPSB0cmFjay5vcHRpb25zKHRoaXMubmFtZSk7XG4gIHZhciBpbnRlcmZhY2VPcHRzID0gdGhpcy5vcHRpb25zO1xuICB2YXIgb3B0cyA9IGRlZmF1bHRzKG9wdGlvbnMgfHwge30sIGNvbnRleHRPcHRzKTtcbiAgb3B0cyA9IGRlZmF1bHRzKG9wdHMsIGludGVyZmFjZU9wdHMpO1xuICB2YXIgcHJvcHMgPSB0cmFjay5wcm9wZXJ0aWVzKCk7XG4gIHZhciBjYW1wYWlnbiA9IHRyYWNrLnByb3h5KCdjb250ZXh0LmNhbXBhaWduJykgfHwge307XG5cbiAgLy8gY3VzdG9tIGRpbWVuc2lvbnMgJiBtZXRyaWNzXG4gIHZhciBjdXN0b20gPSBtZXRyaWNzKHByb3BzLCBpbnRlcmZhY2VPcHRzKTtcbiAgaWYgKGxlbihjdXN0b20pKSB3aW5kb3cuZ2EoJ3NldCcsIGN1c3RvbSk7XG5cbiAgdmFyIHBheWxvYWQgPSB7XG4gICAgZXZlbnRBY3Rpb246IHRyYWNrLmV2ZW50KCksXG4gICAgZXZlbnRDYXRlZ29yeTogcHJvcHMuY2F0ZWdvcnkgfHwgdGhpcy5fY2F0ZWdvcnkgfHwgJ0FsbCcsXG4gICAgZXZlbnRMYWJlbDogcHJvcHMubGFiZWwsXG4gICAgZXZlbnRWYWx1ZTogZm9ybWF0VmFsdWUocHJvcHMudmFsdWUgfHwgdHJhY2sucmV2ZW51ZSgpKSxcbiAgICBub25JbnRlcmFjdGlvbjogISEocHJvcHMubm9uSW50ZXJhY3Rpb24gfHwgb3B0cy5ub25JbnRlcmFjdGlvbilcbiAgfTtcblxuICBpZiAoY2FtcGFpZ24ubmFtZSkgcGF5bG9hZC5jYW1wYWlnbk5hbWUgPSBjYW1wYWlnbi5uYW1lO1xuICBpZiAoY2FtcGFpZ24uc291cmNlKSBwYXlsb2FkLmNhbXBhaWduU291cmNlID0gY2FtcGFpZ24uc291cmNlO1xuICBpZiAoY2FtcGFpZ24ubWVkaXVtKSBwYXlsb2FkLmNhbXBhaWduTWVkaXVtID0gY2FtcGFpZ24ubWVkaXVtO1xuICBpZiAoY2FtcGFpZ24uY29udGVudCkgcGF5bG9hZC5jYW1wYWlnbkNvbnRlbnQgPSBjYW1wYWlnbi5jb250ZW50O1xuICBpZiAoY2FtcGFpZ24udGVybSkgcGF5bG9hZC5jYW1wYWlnbktleXdvcmQgPSBjYW1wYWlnbi50ZXJtO1xuXG4gIHdpbmRvdy5nYSgnc2VuZCcsICdldmVudCcsIHBheWxvYWQpO1xufTtcblxuLyoqXG4gKiBDb21wbGV0ZWQgb3JkZXIuXG4gKlxuICogaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vYW5hbHl0aWNzL2Rldmd1aWRlcy9jb2xsZWN0aW9uL2FuYWx5dGljc2pzL2Vjb21tZXJjZVxuICogaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vYW5hbHl0aWNzL2Rldmd1aWRlcy9jb2xsZWN0aW9uL2FuYWx5dGljc2pzL2Vjb21tZXJjZSNtdWx0aWN1cnJlbmN5XG4gKlxuICogQHBhcmFtIHtUcmFja30gdHJhY2tcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbkdBLnByb3RvdHlwZS5jb21wbGV0ZWRPcmRlciA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHZhciB0b3RhbCA9IHRyYWNrLnRvdGFsKCkgfHwgdHJhY2sucmV2ZW51ZSgpIHx8IDA7XG4gIHZhciBvcmRlcklkID0gdHJhY2sub3JkZXJJZCgpO1xuICB2YXIgcHJvZHVjdHMgPSB0cmFjay5wcm9kdWN0cygpO1xuICB2YXIgcHJvcHMgPSB0cmFjay5wcm9wZXJ0aWVzKCk7XG5cbiAgLy8gb3JkZXJJZCBpcyByZXF1aXJlZC5cbiAgaWYgKCFvcmRlcklkKSByZXR1cm47XG5cbiAgLy8gcmVxdWlyZSBlY29tbWVyY2VcbiAgaWYgKCF0aGlzLmVjb21tZXJjZSkge1xuICAgIHdpbmRvdy5nYSgncmVxdWlyZScsICdlY29tbWVyY2UnKTtcbiAgICB0aGlzLmVjb21tZXJjZSA9IHRydWU7XG4gIH1cblxuICAvLyBhZGQgdHJhbnNhY3Rpb25cbiAgd2luZG93LmdhKCdlY29tbWVyY2U6YWRkVHJhbnNhY3Rpb24nLCB7XG4gICAgYWZmaWxpYXRpb246IHByb3BzLmFmZmlsaWF0aW9uLFxuICAgIHNoaXBwaW5nOiB0cmFjay5zaGlwcGluZygpLFxuICAgIHJldmVudWU6IHRvdGFsLFxuICAgIHRheDogdHJhY2sudGF4KCksXG4gICAgaWQ6IG9yZGVySWQsXG4gICAgY3VycmVuY3k6IHRyYWNrLmN1cnJlbmN5KClcbiAgfSk7XG5cbiAgLy8gYWRkIHByb2R1Y3RzXG4gIGVhY2gocHJvZHVjdHMsIGZ1bmN0aW9uKHByb2R1Y3QpIHtcbiAgICB2YXIgcHJvZHVjdFRyYWNrID0gY3JlYXRlUHJvZHVjdFRyYWNrKHRyYWNrLCBwcm9kdWN0KTtcbiAgICB3aW5kb3cuZ2EoJ2Vjb21tZXJjZTphZGRJdGVtJywge1xuICAgICAgY2F0ZWdvcnk6IHByb2R1Y3RUcmFjay5jYXRlZ29yeSgpLFxuICAgICAgcXVhbnRpdHk6IHByb2R1Y3RUcmFjay5xdWFudGl0eSgpLFxuICAgICAgcHJpY2U6IHByb2R1Y3RUcmFjay5wcmljZSgpLFxuICAgICAgbmFtZTogcHJvZHVjdFRyYWNrLm5hbWUoKSxcbiAgICAgIHNrdTogcHJvZHVjdFRyYWNrLnNrdSgpLFxuICAgICAgaWQ6IG9yZGVySWQsXG4gICAgICBjdXJyZW5jeTogcHJvZHVjdFRyYWNrLmN1cnJlbmN5KClcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gc2VuZFxuICB3aW5kb3cuZ2EoJ2Vjb21tZXJjZTpzZW5kJyk7XG59O1xuXG4vKipcbiAqIEluaXRpYWxpemUgKGNsYXNzaWMpLlxuICpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9nYWpzL21ldGhvZHMvZ2FKU0FwaUJhc2ljQ29uZmlndXJhdGlvblxuICovXG5cbkdBLnByb3RvdHlwZS5pbml0aWFsaXplQ2xhc3NpYyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucztcbiAgdmFyIGFub255bWl6ZSA9IG9wdHMuYW5vbnltaXplSXA7XG4gIHZhciBkb21haW4gPSBvcHRzLmRvbWFpbjtcbiAgdmFyIGVuaGFuY2VkID0gb3B0cy5lbmhhbmNlZExpbmtBdHRyaWJ1dGlvbjtcbiAgdmFyIGlnbm9yZSA9IG9wdHMuaWdub3JlZFJlZmVycmVycztcbiAgdmFyIHNhbXBsZSA9IG9wdHMuc2l0ZVNwZWVkU2FtcGxlUmF0ZTtcblxuICB3aW5kb3cuX2dhcSA9IHdpbmRvdy5fZ2FxIHx8IFtdO1xuICBwdXNoKCdfc2V0QWNjb3VudCcsIG9wdHMudHJhY2tpbmdJZCk7XG4gIHB1c2goJ19zZXRBbGxvd0xpbmtlcicsIHRydWUpO1xuXG4gIGlmIChhbm9ueW1pemUpIHB1c2goJ19nYXQuX2Fub255bWl6ZUlwJyk7XG4gIGlmIChkb21haW4pIHB1c2goJ19zZXREb21haW5OYW1lJywgZG9tYWluKTtcbiAgaWYgKHNhbXBsZSkgcHVzaCgnX3NldFNpdGVTcGVlZFNhbXBsZVJhdGUnLCBzYW1wbGUpO1xuXG4gIGlmIChlbmhhbmNlZCkge1xuICAgIHZhciBwcm90b2NvbCA9IGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JyA/ICdodHRwczonIDogJ2h0dHA6JztcbiAgICB2YXIgcGx1Z2luVXJsID0gcHJvdG9jb2wgKyAnLy93d3cuZ29vZ2xlLWFuYWx5dGljcy5jb20vcGx1Z2lucy9nYS9pbnBhZ2VfbGlua2lkLmpzJztcbiAgICBwdXNoKCdfcmVxdWlyZScsICdpbnBhZ2VfbGlua2lkJywgcGx1Z2luVXJsKTtcbiAgfVxuXG4gIGlmIChpZ25vcmUpIHtcbiAgICBpZiAoIWlzLmFycmF5KGlnbm9yZSkpIGlnbm9yZSA9IFtpZ25vcmVdO1xuICAgIGVhY2goaWdub3JlLCBmdW5jdGlvbihkb21haW4pIHtcbiAgICAgIHB1c2goJ19hZGRJZ25vcmVkUmVmJywgZG9tYWluKTtcbiAgICB9KTtcbiAgfVxuXG4gIGlmICh0aGlzLm9wdGlvbnMuZG91YmxlQ2xpY2spIHtcbiAgICB0aGlzLmxvYWQoJ2RvdWJsZSBjbGljaycsIHRoaXMucmVhZHkpO1xuICB9IGVsc2Uge1xuICAgIHZhciBuYW1lID0gdXNlSHR0cHMoKSA/ICdodHRwcycgOiAnaHR0cCc7XG4gICAgdGhpcy5sb2FkKG5hbWUsIHRoaXMucmVhZHkpO1xuICB9XG59O1xuXG4vKipcbiAqIExvYWRlZD8gKGNsYXNzaWMpXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5HQS5wcm90b3R5cGUubG9hZGVkQ2xhc3NpYyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gISEod2luZG93Ll9nYXEgJiYgd2luZG93Ll9nYXEucHVzaCAhPT0gQXJyYXkucHJvdG90eXBlLnB1c2gpO1xufTtcblxuLyoqXG4gKiBQYWdlIChjbGFzc2ljKS5cbiAqXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vZ2Fqcy9tZXRob2RzL2dhSlNBcGlCYXNpY0NvbmZpZ3VyYXRpb25cbiAqXG4gKiBAcGFyYW0ge1BhZ2V9IHBhZ2VcbiAqL1xuXG5HQS5wcm90b3R5cGUucGFnZUNsYXNzaWMgPSBmdW5jdGlvbihwYWdlKSB7XG4gIHZhciBjYXRlZ29yeSA9IHBhZ2UuY2F0ZWdvcnkoKTtcbiAgdmFyIHByb3BzID0gcGFnZS5wcm9wZXJ0aWVzKCk7XG4gIHZhciBuYW1lID0gcGFnZS5mdWxsTmFtZSgpO1xuICB2YXIgdHJhY2s7XG5cbiAgcHVzaCgnX3RyYWNrUGFnZXZpZXcnLCBwYXRoKHByb3BzLCB0aGlzLm9wdGlvbnMpKTtcblxuICAvLyBjYXRlZ29yaXplZCBwYWdlc1xuICBpZiAoY2F0ZWdvcnkgJiYgdGhpcy5vcHRpb25zLnRyYWNrQ2F0ZWdvcml6ZWRQYWdlcykge1xuICAgIHRyYWNrID0gcGFnZS50cmFjayhjYXRlZ29yeSk7XG4gICAgdGhpcy50cmFjayh0cmFjaywgeyBub25JbnRlcmFjdGlvbjogMSB9KTtcbiAgfVxuXG4gIC8vIG5hbWVkIHBhZ2VzXG4gIGlmIChuYW1lICYmIHRoaXMub3B0aW9ucy50cmFja05hbWVkUGFnZXMpIHtcbiAgICB0cmFjayA9IHBhZ2UudHJhY2sobmFtZSk7XG4gICAgdGhpcy50cmFjayh0cmFjaywgeyBub25JbnRlcmFjdGlvbjogMSB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBUcmFjayAoY2xhc3NpYykuXG4gKlxuICogaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vYW5hbHl0aWNzL2Rldmd1aWRlcy9jb2xsZWN0aW9uL2dhanMvbWV0aG9kcy9nYUpTQXBpRXZlbnRUcmFja2luZ1xuICpcbiAqIEBwYXJhbSB7VHJhY2t9IHRyYWNrXG4gKi9cblxuR0EucHJvdG90eXBlLnRyYWNrQ2xhc3NpYyA9IGZ1bmN0aW9uKHRyYWNrLCBvcHRpb25zKSB7XG4gIHZhciBvcHRzID0gb3B0aW9ucyB8fCB0cmFjay5vcHRpb25zKHRoaXMubmFtZSk7XG4gIHZhciBwcm9wcyA9IHRyYWNrLnByb3BlcnRpZXMoKTtcbiAgdmFyIHJldmVudWUgPSB0cmFjay5yZXZlbnVlKCk7XG4gIHZhciBldmVudCA9IHRyYWNrLmV2ZW50KCk7XG4gIHZhciBjYXRlZ29yeSA9IHRoaXMuX2NhdGVnb3J5IHx8IHByb3BzLmNhdGVnb3J5IHx8ICdBbGwnO1xuICB2YXIgbGFiZWwgPSBwcm9wcy5sYWJlbDtcbiAgdmFyIHZhbHVlID0gZm9ybWF0VmFsdWUocmV2ZW51ZSB8fCBwcm9wcy52YWx1ZSk7XG4gIHZhciBub25JbnRlcmFjdGlvbiA9ICEhKHByb3BzLm5vbkludGVyYWN0aW9uIHx8IG9wdHMubm9uSW50ZXJhY3Rpb24pO1xuICBwdXNoKCdfdHJhY2tFdmVudCcsIGNhdGVnb3J5LCBldmVudCwgbGFiZWwsIHZhbHVlLCBub25JbnRlcmFjdGlvbik7XG59O1xuXG4vKipcbiAqIENvbXBsZXRlZCBvcmRlci5cbiAqXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vZ2Fqcy9nYVRyYWNraW5nRWNvbW1lcmNlXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vZ2Fqcy9nYVRyYWNraW5nRWNvbW1lcmNlI2xvY2FsY3VycmVuY2llc1xuICpcbiAqIEBwYXJhbSB7VHJhY2t9IHRyYWNrXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5HQS5wcm90b3R5cGUuY29tcGxldGVkT3JkZXJDbGFzc2ljID0gZnVuY3Rpb24odHJhY2spIHtcbiAgdmFyIHRvdGFsID0gdHJhY2sudG90YWwoKSB8fCB0cmFjay5yZXZlbnVlKCkgfHwgMDtcbiAgdmFyIG9yZGVySWQgPSB0cmFjay5vcmRlcklkKCk7XG4gIHZhciBwcm9kdWN0cyA9IHRyYWNrLnByb2R1Y3RzKCkgfHwgW107XG4gIHZhciBwcm9wcyA9IHRyYWNrLnByb3BlcnRpZXMoKTtcbiAgdmFyIGN1cnJlbmN5ID0gdHJhY2suY3VycmVuY3koKTtcblxuICAvLyByZXF1aXJlZFxuICBpZiAoIW9yZGVySWQpIHJldHVybjtcblxuICAvLyBhZGQgdHJhbnNhY3Rpb25cbiAgcHVzaCgnX2FkZFRyYW5zJyxcbiAgICBvcmRlcklkLFxuICAgIHByb3BzLmFmZmlsaWF0aW9uLFxuICAgIHRvdGFsLFxuICAgIHRyYWNrLnRheCgpLFxuICAgIHRyYWNrLnNoaXBwaW5nKCksXG4gICAgdHJhY2suY2l0eSgpLFxuICAgIHRyYWNrLnN0YXRlKCksXG4gICAgdHJhY2suY291bnRyeSgpKTtcblxuICAvLyBhZGQgaXRlbXNcbiAgZWFjaChwcm9kdWN0cywgZnVuY3Rpb24ocHJvZHVjdCkge1xuICAgIHZhciB0cmFjayA9IG5ldyBUcmFjayh7IHByb3BlcnRpZXM6IHByb2R1Y3QgfSk7XG4gICAgcHVzaCgnX2FkZEl0ZW0nLFxuICAgICAgb3JkZXJJZCxcbiAgICAgIHRyYWNrLnNrdSgpLFxuICAgICAgdHJhY2submFtZSgpLFxuICAgICAgdHJhY2suY2F0ZWdvcnkoKSxcbiAgICAgIHRyYWNrLnByaWNlKCksXG4gICAgICB0cmFjay5xdWFudGl0eSgpKTtcbiAgfSk7XG5cbiAgLy8gc2VuZFxuICBwdXNoKCdfc2V0JywgJ2N1cnJlbmN5Q29kZScsIGN1cnJlbmN5KTtcbiAgcHVzaCgnX3RyYWNrVHJhbnMnKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBwYXRoIGJhc2VkIG9uIGBwcm9wZXJ0aWVzYCBhbmQgYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7c3RyaW5nfHVuZGVmaW5lZH1cbiAqL1xuXG5mdW5jdGlvbiBwYXRoKHByb3BlcnRpZXMsIG9wdGlvbnMpIHtcbiAgaWYgKCFwcm9wZXJ0aWVzKSByZXR1cm47XG4gIHZhciBzdHIgPSBwcm9wZXJ0aWVzLnBhdGg7XG4gIGlmIChvcHRpb25zLmluY2x1ZGVTZWFyY2ggJiYgcHJvcGVydGllcy5zZWFyY2gpIHN0ciArPSBwcm9wZXJ0aWVzLnNlYXJjaDtcbiAgcmV0dXJuIHN0cjtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHZhbHVlIHByb3BlcnR5IHRvIEdvb2dsZSdzIGxpa2luZy5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWVcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZSh2YWx1ZSkge1xuICBpZiAoIXZhbHVlIHx8IHZhbHVlIDwgMCkgcmV0dXJuIDA7XG4gIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBNYXAgZ29vZ2xlJ3MgY3VzdG9tIGRpbWVuc2lvbnMgJiBtZXRyaWNzIHdpdGggYG9iamAuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiAgICAgIG1ldHJpY3MoeyByZXZlbnVlOiAxLjkgfSwgeyB7IG1ldHJpY3MgOiB7IHJldmVudWU6ICdtZXRyaWM4JyB9IH0pO1xuICogICAgICAvLyA9PiB7IG1ldHJpYzg6IDEuOSB9XG4gKlxuICogICAgICBtZXRyaWNzKHsgcmV2ZW51ZTogMS45IH0sIHt9KTtcbiAqICAgICAgLy8gPT4ge31cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICogQHJldHVybiB7T2JqZWN0fG51bGx9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtZXRyaWNzKG9iaiwgZGF0YSkge1xuICB2YXIgZGltZW5zaW9ucyA9IGRhdGEuZGltZW5zaW9ucztcbiAgdmFyIG1ldHJpY3MgPSBkYXRhLm1ldHJpY3M7XG4gIHZhciBuYW1lcyA9IGtleXMobWV0cmljcykuY29uY2F0KGtleXMoZGltZW5zaW9ucykpO1xuICB2YXIgcmV0ID0ge307XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgdmFyIGtleSA9IG1ldHJpY3NbbmFtZV0gfHwgZGltZW5zaW9uc1tuYW1lXTtcbiAgICB2YXIgdmFsdWUgPSBkb3Qob2JqLCBuYW1lKSB8fCBvYmpbbmFtZV07XG4gICAgaWYgKHZhbHVlID09IG51bGwpIGNvbnRpbnVlO1xuICAgIGlmIChpcy5ib29sZWFuKHZhbHVlKSkgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgIHJldFtrZXldID0gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIExvYWRzIGVjLmpzICh1bmxlc3MgYWxyZWFkeSBsb2FkZWQpXG4gKlxuICogQHBhcmFtIHtUcmFja30gdHJhY2tcbiAqL1xuXG5HQS5wcm90b3R5cGUubG9hZEVuaGFuY2VkRWNvbW1lcmNlID0gZnVuY3Rpb24odHJhY2spIHtcbiAgaWYgKCF0aGlzLmVuaGFuY2VkRWNvbW1lcmNlTG9hZGVkKSB7XG4gICAgd2luZG93LmdhKCdyZXF1aXJlJywgJ2VjJyk7XG4gICAgdGhpcy5lbmhhbmNlZEVjb21tZXJjZUxvYWRlZCA9IHRydWU7XG4gIH1cblxuICAvLyBFbnN1cmUgd2Ugc2V0IGN1cnJlbmN5IGZvciBldmVyeSBoaXRcbiAgd2luZG93LmdhKCdzZXQnLCAnJmN1JywgdHJhY2suY3VycmVuY3koKSk7XG59O1xuXG4vKipcbiAqIFB1c2hlcyBhbiBldmVudCBhbmQgYWxsIHByZXZpb3VzbHkgc2V0IEVFIGRhdGEgdG8gR0EuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge1RyYWNrfSB0cmFja1xuICovXG5cbkdBLnByb3RvdHlwZS5wdXNoRW5oYW5jZWRFY29tbWVyY2UgPSBmdW5jdGlvbih0cmFjaykge1xuICAvLyBTZW5kIGEgY3VzdG9tIG5vbi1pbnRlcmFjdGlvbiBldmVudCB0byBlbnN1cmUgYWxsIEVFIGRhdGEgaXMgcHVzaGVkLlxuICAvLyBXaXRob3V0IGRvaW5nIHRoaXMgd2UnZCBuZWVkIHRvIHJlcXVpcmUgcGFnZSBkaXNwbGF5IGFmdGVyIHNldHRpbmcgRUUgZGF0YS5cbiAgdmFyIGFyZ3MgPSBzZWxlY3QoW1xuICAgICdzZW5kJyxcbiAgICAnZXZlbnQnLFxuICAgIHRyYWNrLmNhdGVnb3J5KCkgfHwgJ0VuaGFuY2VkRWNvbW1lcmNlJyxcbiAgICB0cmFjay5ldmVudCgpIHx8ICdBY3Rpb24gbm90IGRlZmluZWQnLFxuICAgIHRyYWNrLnByb3BlcnRpZXMoKS5sYWJlbCxcbiAgICB7IG5vbkludGVyYWN0aW9uOiAxIH1cbiAgICBdLCBmdW5jdGlvbihuKXsgcmV0dXJuIG4gIT09IHVuZGVmaW5lZDsgfSk7XG4gIHdpbmRvdy5nYS5hcHBseSh3aW5kb3csIGFyZ3MpO1xufTtcblxuLyoqXG4gKiBTdGFydGVkIG9yZGVyIC0gRW5oYW5jZWQgRWNvbW1lcmNlXG4gKlxuICogaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vYW5hbHl0aWNzL2Rldmd1aWRlcy9jb2xsZWN0aW9uL2FuYWx5dGljc2pzL2VuaGFuY2VkLWVjb21tZXJjZSNjaGVja291dC1zdGVwc1xuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtUcmFja30gdHJhY2tcbiAqL1xuXG5HQS5wcm90b3R5cGUuc3RhcnRlZE9yZGVyRW5oYW5jZWQgPSBmdW5jdGlvbih0cmFjaykge1xuICAvLyBzYW1lIGFzIHZpZXdlZCBjaGVja291dCBzdGVwICMxXG4gIHRoaXMudmlld2VkQ2hlY2tvdXRTdGVwKHRyYWNrKTtcbn07XG5cbi8qKlxuICogVXBkYXRlZCBvcmRlciAtIEVuaGFuY2VkIEVjb21tZXJjZVxuICpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9lbmhhbmNlZC1lY29tbWVyY2UjY2hlY2tvdXQtc3RlcHNcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7VHJhY2t9IHRyYWNrXG4gKi9cblxuR0EucHJvdG90eXBlLnVwZGF0ZWRPcmRlckVuaGFuY2VkID0gZnVuY3Rpb24odHJhY2spIHtcbiAgLy8gU2FtZSBldmVudCBhcyBzdGFydGVkIG9yZGVyIC0gd2lsbCBvdmVycmlkZVxuICB0aGlzLnN0YXJ0ZWRPcmRlckVuaGFuY2VkKHRyYWNrKTtcbn07XG5cbi8qKlxuICogVmlld2VkIGNoZWNrb3V0IHN0ZXAgLSBFbmhhbmNlZCBFY29tbWVyY2VcbiAqXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvZW5oYW5jZWQtZWNvbW1lcmNlI2NoZWNrb3V0LXN0ZXBzXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge1RyYWNrfSB0cmFja1xuICovXG5cbkdBLnByb3RvdHlwZS52aWV3ZWRDaGVja291dFN0ZXBFbmhhbmNlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHZhciBwcm9kdWN0cyA9IHRyYWNrLnByb2R1Y3RzKCk7XG4gIHZhciBwcm9wcyA9IHRyYWNrLnByb3BlcnRpZXMoKTtcbiAgdmFyIG9wdGlvbnMgPSBleHRyYWN0Q2hlY2tvdXRPcHRpb25zKHByb3BzKTtcblxuICB0aGlzLmxvYWRFbmhhbmNlZEVjb21tZXJjZSh0cmFjayk7XG5cbiAgZWFjaChwcm9kdWN0cywgZnVuY3Rpb24ocHJvZHVjdCkge1xuICAgIHZhciBwcm9kdWN0VHJhY2sgPSBjcmVhdGVQcm9kdWN0VHJhY2sodHJhY2ssIHByb2R1Y3QpO1xuICAgIGVuaGFuY2VkRWNvbW1lcmNlVHJhY2tQcm9kdWN0KHByb2R1Y3RUcmFjayk7XG4gIH0pO1xuXG4gIHdpbmRvdy5nYSgnZWM6c2V0QWN0aW9uJywgJ2NoZWNrb3V0Jywge1xuICAgIHN0ZXA6IHByb3BzLnN0ZXAgfHwgMSxcbiAgICBvcHRpb246IG9wdGlvbnMgfHwgdW5kZWZpbmVkXG4gIH0pO1xuXG4gIHRoaXMucHVzaEVuaGFuY2VkRWNvbW1lcmNlKHRyYWNrKTtcbn07XG5cbi8qKlxuICogQ29tcGxldGVkIGNoZWNrb3V0IHN0ZXAgLSBFbmhhbmNlZCBFY29tbWVyY2VcbiAqXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvZW5oYW5jZWQtZWNvbW1lcmNlI2NoZWNrb3V0LW9wdGlvbnNcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7VHJhY2t9IHRyYWNrXG4gKi9cblxuR0EucHJvdG90eXBlLmNvbXBsZXRlZENoZWNrb3V0U3RlcEVuaGFuY2VkID0gZnVuY3Rpb24odHJhY2spIHtcbiAgdmFyIHByb3BzID0gdHJhY2sucHJvcGVydGllcygpO1xuICB2YXIgb3B0aW9ucyA9IGV4dHJhY3RDaGVja291dE9wdGlvbnMocHJvcHMpO1xuXG4gIC8vIE9ubHkgc2VuZCBhbiBldmVudCBpZiB3ZSBoYXZlIHN0ZXAgYW5kIG9wdGlvbnMgdG8gdXBkYXRlXG4gIGlmICghcHJvcHMuc3RlcCB8fCAhb3B0aW9ucykgcmV0dXJuO1xuXG4gIHRoaXMubG9hZEVuaGFuY2VkRWNvbW1lcmNlKHRyYWNrKTtcblxuICB3aW5kb3cuZ2EoJ2VjOnNldEFjdGlvbicsICdjaGVja291dF9vcHRpb24nLCB7XG4gICAgc3RlcDogcHJvcHMuc3RlcCB8fCAxLFxuICAgIG9wdGlvbjogb3B0aW9uc1xuICB9KTtcblxuICB3aW5kb3cuZ2EoJ3NlbmQnLCAnZXZlbnQnLCAnQ2hlY2tvdXQnLCAnT3B0aW9uJyk7XG59O1xuXG4vKipcbiAqIENvbXBsZXRlZCBvcmRlciAtIEVuaGFuY2VkIEVjb21tZXJjZVxuICpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9lbmhhbmNlZC1lY29tbWVyY2UjbWVhc3VyaW5nLXRyYW5zYWN0aW9uc1xuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtUcmFja30gdHJhY2tcbiAqL1xuXG5HQS5wcm90b3R5cGUuY29tcGxldGVkT3JkZXJFbmhhbmNlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHZhciB0b3RhbCA9IHRyYWNrLnRvdGFsKCkgfHwgdHJhY2sucmV2ZW51ZSgpIHx8IDA7XG4gIHZhciBvcmRlcklkID0gdHJhY2sub3JkZXJJZCgpO1xuICB2YXIgcHJvZHVjdHMgPSB0cmFjay5wcm9kdWN0cygpO1xuICB2YXIgcHJvcHMgPSB0cmFjay5wcm9wZXJ0aWVzKCk7XG5cbiAgLy8gb3JkZXJJZCBpcyByZXF1aXJlZC5cbiAgaWYgKCFvcmRlcklkKSByZXR1cm47XG5cbiAgdGhpcy5sb2FkRW5oYW5jZWRFY29tbWVyY2UodHJhY2spO1xuXG4gIGVhY2gocHJvZHVjdHMsIGZ1bmN0aW9uKHByb2R1Y3QpIHtcbiAgICB2YXIgcHJvZHVjdFRyYWNrID0gY3JlYXRlUHJvZHVjdFRyYWNrKHRyYWNrLCBwcm9kdWN0KTtcbiAgICBlbmhhbmNlZEVjb21tZXJjZVRyYWNrUHJvZHVjdChwcm9kdWN0VHJhY2spO1xuICB9KTtcblxuICB3aW5kb3cuZ2EoJ2VjOnNldEFjdGlvbicsICdwdXJjaGFzZScsIHtcbiAgICBpZDogb3JkZXJJZCxcbiAgICBhZmZpbGlhdGlvbjogcHJvcHMuYWZmaWxpYXRpb24sXG4gICAgcmV2ZW51ZTogdG90YWwsXG4gICAgdGF4OiB0cmFjay50YXgoKSxcbiAgICBzaGlwcGluZzogdHJhY2suc2hpcHBpbmcoKSxcbiAgICBjb3Vwb246IHRyYWNrLmNvdXBvbigpXG4gIH0pO1xuXG4gIHRoaXMucHVzaEVuaGFuY2VkRWNvbW1lcmNlKHRyYWNrKTtcbn07XG5cbi8qKlxuICogUmVmdW5kZWQgb3JkZXIgLSBFbmhhbmNlZCBFY29tbWVyY2VcbiAqXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvZW5oYW5jZWQtZWNvbW1lcmNlI21lYXN1cmluZy1yZWZ1bmRzXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge1RyYWNrfSB0cmFja1xuICovXG5cbkdBLnByb3RvdHlwZS5yZWZ1bmRlZE9yZGVyRW5oYW5jZWQgPSBmdW5jdGlvbih0cmFjaykge1xuICB2YXIgb3JkZXJJZCA9IHRyYWNrLm9yZGVySWQoKTtcbiAgdmFyIHByb2R1Y3RzID0gdHJhY2sucHJvZHVjdHMoKTtcblxuICAvLyBvcmRlcklkIGlzIHJlcXVpcmVkLlxuICBpZiAoIW9yZGVySWQpIHJldHVybjtcblxuICB0aGlzLmxvYWRFbmhhbmNlZEVjb21tZXJjZSh0cmFjayk7XG5cbiAgLy8gV2l0aG91dCBhbnkgcHJvZHVjdHMgaXQncyBhIGZ1bGwgcmVmdW5kXG4gIGVhY2gocHJvZHVjdHMsIGZ1bmN0aW9uKHByb2R1Y3QpIHtcbiAgICB2YXIgdHJhY2sgPSBuZXcgVHJhY2soeyBwcm9wZXJ0aWVzOiBwcm9kdWN0IH0pO1xuICAgIHdpbmRvdy5nYSgnZWM6YWRkUHJvZHVjdCcsIHtcbiAgICAgIGlkOiB0cmFjay5pZCgpIHx8IHRyYWNrLnNrdSgpLFxuICAgICAgcXVhbnRpdHk6IHRyYWNrLnF1YW50aXR5KClcbiAgICB9KTtcbiAgfSk7XG5cbiAgd2luZG93LmdhKCdlYzpzZXRBY3Rpb24nLCAncmVmdW5kJywge1xuICAgIGlkOiBvcmRlcklkXG4gIH0pO1xuXG4gIHRoaXMucHVzaEVuaGFuY2VkRWNvbW1lcmNlKHRyYWNrKTtcbn07XG5cbi8qKlxuICogQWRkZWQgcHJvZHVjdCAtIEVuaGFuY2VkIEVjb21tZXJjZVxuICpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9lbmhhbmNlZC1lY29tbWVyY2UjYWRkLXJlbW92ZS1jYXJ0XG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge1RyYWNrfSB0cmFja1xuICovXG5cbkdBLnByb3RvdHlwZS5hZGRlZFByb2R1Y3RFbmhhbmNlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHRoaXMubG9hZEVuaGFuY2VkRWNvbW1lcmNlKHRyYWNrKTtcbiAgZW5oYW5jZWRFY29tbWVyY2VQcm9kdWN0QWN0aW9uKHRyYWNrLCAnYWRkJyk7XG4gIHRoaXMucHVzaEVuaGFuY2VkRWNvbW1lcmNlKHRyYWNrKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlZCBwcm9kdWN0IC0gRW5oYW5jZWQgRWNvbW1lcmNlXG4gKlxuICogaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vYW5hbHl0aWNzL2Rldmd1aWRlcy9jb2xsZWN0aW9uL2FuYWx5dGljc2pzL2VuaGFuY2VkLWVjb21tZXJjZSNhZGQtcmVtb3ZlLWNhcnRcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7VHJhY2t9IHRyYWNrXG4gKi9cblxuR0EucHJvdG90eXBlLnJlbW92ZWRQcm9kdWN0RW5oYW5jZWQgPSBmdW5jdGlvbih0cmFjaykge1xuICB0aGlzLmxvYWRFbmhhbmNlZEVjb21tZXJjZSh0cmFjayk7XG4gIGVuaGFuY2VkRWNvbW1lcmNlUHJvZHVjdEFjdGlvbih0cmFjaywgJ3JlbW92ZScpO1xuICB0aGlzLnB1c2hFbmhhbmNlZEVjb21tZXJjZSh0cmFjayk7XG59O1xuXG4vKipcbiAqIFZpZXdlZCBwcm9kdWN0IGRldGFpbHMgLSBFbmhhbmNlZCBFY29tbWVyY2VcbiAqXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvZW5oYW5jZWQtZWNvbW1lcmNlI3Byb2R1Y3QtZGV0YWlsLXZpZXdcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7VHJhY2t9IHRyYWNrXG4gKi9cblxuR0EucHJvdG90eXBlLnZpZXdlZFByb2R1Y3RFbmhhbmNlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHRoaXMubG9hZEVuaGFuY2VkRWNvbW1lcmNlKHRyYWNrKTtcbiAgZW5oYW5jZWRFY29tbWVyY2VQcm9kdWN0QWN0aW9uKHRyYWNrLCAnZGV0YWlsJyk7XG4gIHRoaXMucHVzaEVuaGFuY2VkRWNvbW1lcmNlKHRyYWNrKTtcbn07XG5cbi8qKlxuICogQ2xpY2tlZCBwcm9kdWN0IC0gRW5oYW5jZWQgRWNvbW1lcmNlXG4gKlxuICogaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vYW5hbHl0aWNzL2Rldmd1aWRlcy9jb2xsZWN0aW9uL2FuYWx5dGljc2pzL2VuaGFuY2VkLWVjb21tZXJjZSNtZWFzdXJpbmctYWN0aW9uc1xuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtUcmFja30gdHJhY2tcbiAqL1xuXG5HQS5wcm90b3R5cGUuY2xpY2tlZFByb2R1Y3RFbmhhbmNlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHZhciBwcm9wcyA9IHRyYWNrLnByb3BlcnRpZXMoKTtcblxuICB0aGlzLmxvYWRFbmhhbmNlZEVjb21tZXJjZSh0cmFjayk7XG4gIGVuaGFuY2VkRWNvbW1lcmNlUHJvZHVjdEFjdGlvbih0cmFjaywgJ2NsaWNrJywge1xuICAgIGxpc3Q6IHByb3BzLmxpc3RcbiAgfSk7XG4gIHRoaXMucHVzaEVuaGFuY2VkRWNvbW1lcmNlKHRyYWNrKTtcbn07XG5cbi8qKlxuICogVmlld2VkIHByb21vdGlvbiAtIEVuaGFuY2VkIEVjb21tZXJjZVxuICpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9lbmhhbmNlZC1lY29tbWVyY2UjbWVhc3VyaW5nLXByb21vLWltcHJlc3Npb25zXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge1RyYWNrfSB0cmFja1xuICovXG5cbkdBLnByb3RvdHlwZS52aWV3ZWRQcm9tb3Rpb25FbmhhbmNlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHZhciBwcm9wcyA9IHRyYWNrLnByb3BlcnRpZXMoKTtcblxuICB0aGlzLmxvYWRFbmhhbmNlZEVjb21tZXJjZSh0cmFjayk7XG4gIHdpbmRvdy5nYSgnZWM6YWRkUHJvbW8nLCB7XG4gICAgaWQ6IHRyYWNrLmlkKCksXG4gICAgbmFtZTogdHJhY2submFtZSgpLFxuICAgIGNyZWF0aXZlOiBwcm9wcy5jcmVhdGl2ZSxcbiAgICBwb3NpdGlvbjogcHJvcHMucG9zaXRpb25cbiAgfSk7XG4gIHRoaXMucHVzaEVuaGFuY2VkRWNvbW1lcmNlKHRyYWNrKTtcbn07XG5cbi8qKlxuICogQ2xpY2tlZCBwcm9tb3Rpb24gLSBFbmhhbmNlZCBFY29tbWVyY2VcbiAqXG4gKiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvZW5oYW5jZWQtZWNvbW1lcmNlI21lYXN1cmluZy1wcm9tby1jbGlja3NcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7VHJhY2t9IHRyYWNrXG4gKi9cblxuR0EucHJvdG90eXBlLmNsaWNrZWRQcm9tb3Rpb25FbmhhbmNlZCA9IGZ1bmN0aW9uKHRyYWNrKSB7XG4gIHZhciBwcm9wcyA9IHRyYWNrLnByb3BlcnRpZXMoKTtcblxuICB0aGlzLmxvYWRFbmhhbmNlZEVjb21tZXJjZSh0cmFjayk7XG4gIHdpbmRvdy5nYSgnZWM6YWRkUHJvbW8nLCB7XG4gICAgaWQ6IHRyYWNrLmlkKCksXG4gICAgbmFtZTogdHJhY2submFtZSgpLFxuICAgIGNyZWF0aXZlOiBwcm9wcy5jcmVhdGl2ZSxcbiAgICBwb3NpdGlvbjogcHJvcHMucG9zaXRpb25cbiAgfSk7XG4gIHdpbmRvdy5nYSgnZWM6c2V0QWN0aW9uJywgJ3Byb21vX2NsaWNrJywge30pO1xuICB0aGlzLnB1c2hFbmhhbmNlZEVjb21tZXJjZSh0cmFjayk7XG59O1xuXG4vKipcbiAqIEVuaGFuY2VkIGVjb21tZXJjZSB0cmFjayBwcm9kdWN0LlxuICpcbiAqIFNpbXBsZSBoZWxwZXIgc28gdGhhdCB3ZSBkb24ndCByZXBlYXQgYGVjOmFkZFByb2R1Y3RgIGV2ZXJ5d2hlcmUuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge1RyYWNrfSB0cmFja1xuICovXG5cbmZ1bmN0aW9uIGVuaGFuY2VkRWNvbW1lcmNlVHJhY2tQcm9kdWN0KHRyYWNrKSB7XG4gIHZhciBwcm9wcyA9IHRyYWNrLnByb3BlcnRpZXMoKTtcbiAgdmFyIHByb2R1Y3QgPSB7XG4gICAgaWQ6IHRyYWNrLmlkKCkgfHwgdHJhY2suc2t1KCksXG4gICAgbmFtZTogdHJhY2submFtZSgpLFxuICAgIGNhdGVnb3J5OiB0cmFjay5jYXRlZ29yeSgpLFxuICAgIHF1YW50aXR5OiB0cmFjay5xdWFudGl0eSgpLFxuICAgIHByaWNlOiB0cmFjay5wcmljZSgpLFxuICAgIGJyYW5kOiBwcm9wcy5icmFuZCxcbiAgICB2YXJpYW50OiBwcm9wcy52YXJpYW50LFxuICAgIGN1cnJlbmN5OiB0cmFjay5jdXJyZW5jeSgpXG4gIH07XG5cbiAgLy8gYXBwZW5kIGNvdXBvbiBpZiBpdCBzZXRcbiAgLy8gaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vYW5hbHl0aWNzL2Rldmd1aWRlcy9jb2xsZWN0aW9uL2FuYWx5dGljc2pzL2VuaGFuY2VkLWVjb21tZXJjZSNtZWFzdXJpbmctdHJhbnNhY3Rpb25zXG4gIHZhciBjb3Vwb24gPSB0cmFjay5wcm94eSgncHJvcGVydGllcy5jb3Vwb24nKTtcbiAgaWYgKGNvdXBvbikgcHJvZHVjdC5jb3Vwb24gPSBjb3Vwb247XG4gIHdpbmRvdy5nYSgnZWM6YWRkUHJvZHVjdCcsIHByb2R1Y3QpO1xufVxuXG4vKipcbiAqIFNldCBgYWN0aW9uYCBvbiBgdHJhY2tgIHdpdGggYGRhdGFgLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICogQHBhcmFtIHtUcmFja30gdHJhY2tcbiAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gKi9cblxuZnVuY3Rpb24gZW5oYW5jZWRFY29tbWVyY2VQcm9kdWN0QWN0aW9uKHRyYWNrLCBhY3Rpb24sIGRhdGEpIHtcbiAgZW5oYW5jZWRFY29tbWVyY2VUcmFja1Byb2R1Y3QodHJhY2spO1xuICB3aW5kb3cuZ2EoJ2VjOnNldEFjdGlvbicsIGFjdGlvbiwgZGF0YSB8fCB7fSk7XG59XG5cbi8qKlxuICogRXh0cmFjdHMgY2hlY2tvdXQgb3B0aW9ucy5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wc1xuICogQHJldHVybiB7c3RyaW5nfG51bGx9XG4gKi9cblxuZnVuY3Rpb24gZXh0cmFjdENoZWNrb3V0T3B0aW9ucyhwcm9wcykge1xuICB2YXIgb3B0aW9ucyA9IFtcbiAgICBwcm9wcy5wYXltZW50TWV0aG9kLFxuICAgIHByb3BzLnNoaXBwaW5nTWV0aG9kXG4gIF07XG5cbiAgLy8gUmVtb3ZlIGFsbCBudWxscywgZW1wdHkgc3RyaW5ncywgemVyb2VzLCBhbmQgam9pbiB3aXRoIGNvbW1hcy5cbiAgdmFyIHZhbGlkID0gc2VsZWN0KG9wdGlvbnMsIGZ1bmN0aW9uKGUpIHtyZXR1cm4gZTsgfSk7XG4gIHJldHVybiB2YWxpZC5sZW5ndGggPiAwID8gdmFsaWQuam9pbignLCAnKSA6IG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHRyYWNrIG91dCBvZiBwcm9kdWN0IHByb3BlcnRpZXMuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKiBAcGFyYW0ge1RyYWNrfSB0cmFja1xuICogQHBhcmFtIHtPYmplY3R9IHByb3BlcnRpZXNcbiAqIEByZXR1cm4ge1RyYWNrfVxuICovXG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2R1Y3RUcmFjayh0cmFjaywgcHJvcGVydGllcykge1xuICBwcm9wZXJ0aWVzLmN1cnJlbmN5ID0gcHJvcGVydGllcy5jdXJyZW5jeSB8fCB0cmFjay5jdXJyZW5jeSgpO1xuICByZXR1cm4gbmV3IFRyYWNrKHsgcHJvcGVydGllczogcHJvcGVydGllcyB9KTtcbn1cbiIsIi8qKlxuICogRXhwb3NlIGBkZWZhdWx0c2AuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZGVmYXVsdHM7XG5cbmZ1bmN0aW9uIGRlZmF1bHRzIChkZXN0LCBkZWZhdWx0cykge1xuICBmb3IgKHZhciBwcm9wIGluIGRlZmF1bHRzKSB7XG4gICAgaWYgKCEgKHByb3AgaW4gZGVzdCkpIHtcbiAgICAgIGRlc3RbcHJvcF0gPSBkZWZhdWx0c1twcm9wXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVzdDtcbn07XG4iLCJcbi8qKlxuICogRXhwb3NlIGBnZW5lcmF0ZWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmF0ZTtcblxuXG4vKipcbiAqIEdlbmVyYXRlIGEgZ2xvYmFsIHF1ZXVlIHB1c2hpbmcgbWV0aG9kIHdpdGggYG5hbWVgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogICBAcHJvcGVydHkge0Jvb2xlYW59IHdyYXBcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmZ1bmN0aW9uIGdlbmVyYXRlIChuYW1lLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHJldHVybiBmdW5jdGlvbiAoYXJncykge1xuICAgIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgd2luZG93W25hbWVdIHx8ICh3aW5kb3dbbmFtZV0gPSBbXSk7XG4gICAgb3B0aW9ucy53cmFwID09PSBmYWxzZVxuICAgICAgPyB3aW5kb3dbbmFtZV0ucHVzaC5hcHBseSh3aW5kb3dbbmFtZV0sIGFyZ3MpXG4gICAgICA6IHdpbmRvd1tuYW1lXS5wdXNoKGFyZ3MpO1xuICB9O1xufSIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0b0Z1bmN0aW9uID0gcmVxdWlyZSgndG8tZnVuY3Rpb24nKTtcblxuLyoqXG4gKiBGaWx0ZXIgdGhlIGdpdmVuIGBhcnJgIHdpdGggY2FsbGJhY2sgYGZuKHZhbCwgaSlgLFxuICogd2hlbiBhIHRydXRoeSB2YWx1ZSBpcyByZXR1cm4gdGhlbiBgdmFsYCBpcyBpbmNsdWRlZFxuICogaW4gdGhlIGFycmF5IHJldHVybmVkLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgZm4pe1xuICB2YXIgcmV0ID0gW107XG4gIGZuID0gdG9GdW5jdGlvbihmbik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKGZuKGFycltpXSwgaSkpIHtcbiAgICAgIHJldC5wdXNoKGFycltpXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXQ7XG59O1xuIiwiXG4vKipcbiAqIFByb3RvY29sLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHVybCkge1xuICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBjYXNlIDA6IHJldHVybiBjaGVjaygpO1xuICAgIGNhc2UgMTogcmV0dXJuIHRyYW5zZm9ybSh1cmwpO1xuICB9XG59O1xuXG5cbi8qKlxuICogVHJhbnNmb3JtIGEgcHJvdG9jb2wtcmVsYXRpdmUgYHVybGAgdG8gdGhlIHVzZSB0aGUgcHJvcGVyIHByb3RvY29sLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiB0cmFuc2Zvcm0gKHVybCkge1xuICByZXR1cm4gY2hlY2soKSA/ICdodHRwczonICsgdXJsIDogJ2h0dHA6JyArIHVybDtcbn1cblxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYGh0dHBzOmAgYmUgdXNlZCBmb3IgbG9hZGluZyBzY3JpcHRzLlxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gY2hlY2sgKCkge1xuICByZXR1cm4gKFxuICAgIGxvY2F0aW9uLnByb3RvY29sID09ICdodHRwczonIHx8XG4gICAgbG9jYXRpb24ucHJvdG9jb2wgPT0gJ2Nocm9tZS1leHRlbnNpb246J1xuICApO1xufSJdfQ==