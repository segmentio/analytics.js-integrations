'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var GoSquared = require('../lib/');

describe('GoSquared', function() {
  var analytics;
  var goSquared;
  var options = {
    apiSecret: 'x'
  };

  beforeEach(function() {
    analytics = new Analytics();
    goSquared = new GoSquared(options);
    analytics.use(GoSquared);
    analytics.use(tester);
    analytics.add(goSquared);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    goSquared.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(GoSquared, integration('GoSquared')
      .assumesPageview()
      .global('_gs')
      .option('anonymizeIP', false)
      .option('apiSecret', '')
      .option('cookieDomain', null)
      .option('trackHash', false)
      .option('trackLocal', false)
      .option('trackParams', true)
      .option('useCookies', true));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(goSquared, 'load');
    });

    describe('#initialize', function() {
      it('should initialize the _gs global', function() {
        analytics.assert(!window._gs);
        analytics.initialize();
        analytics.page();
        analytics.assert(typeof window._gs === 'function');
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(goSquared.load);
      });

      it('should be configure the site token', function() {
        analytics.stub(window, '_gs');
        analytics.initialize();
        analytics.page();
        analytics.called(window._gs, options.apiSecret);
      });

      it('should configure all defaults', function() {
        analytics.stub(window, '_gs');
        analytics.initialize();
        analytics.page();
        each(goSquared.options, function(name, value) {
          if (name === 'apiSecret') return;
          if (value == null) return;
          analytics.called(window._gs, 'set', name, value);
        });
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(goSquared, done);
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
        analytics.stub(window, '_gs');
      });

      it('should send a path and title', function() {
        analytics.page({ path: '/path', title: 'title' });
        analytics.called(window._gs, 'track', '/path', 'title');
      });

      it('should prefer a name', function() {
        analytics.page('name', { path: '/path', title: 'title' });
        analytics.called(window._gs, 'track', '/path', 'name');
      });

      it('should prefer a name and category', function() {
        analytics.page('category', 'name', { path: '/path', title: 'title' });
        analytics.called(window._gs, 'track', '/path', 'category name');
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window, '_gs');
      });

      var created = new Date();

      it('should set an id', function() {
        analytics.identify('id');
        analytics.called(window._gs, 'identify', 'id');
      });

      it('should alias traits', function() {
        analytics.identify({
          firstName: 'first_name',
          lastName: 'last_name',
          createdAt: created,
          title: 'company_position',
          industry: 'company_industry'
        });
        analytics.called(window._gs, 'properties', {
          first_name: 'first_name',
          last_name: 'last_name',
          created_at: created,
          company_position: 'company_position',
          company_industry: 'company_industry',
          custom: {}
        });
      });

      it('should keep special traits in root object', function() {
        analytics.identify({
          id: 'id',
          email: 'email',
          firstName: 'first_name',
          lastName: 'last_name',
          username: 'username',
          description: 'description',
          avatar: 'avatar',
          phone: 'phone',
          createdAt: created,
          company_name: 'company_name',
          company_size: 'company_size',
          title: 'company_position',
          industry: 'company_industry'
        });
        analytics.called(window._gs, 'properties', {
          id: 'id',
          email: 'email',
          first_name: 'first_name',
          last_name: 'last_name',
          username: 'username',
          description: 'description',
          avatar: 'avatar',
          phone: 'phone',
          created_at: created,
          company_name: 'company_name',
          company_size: 'company_size',
          company_position: 'company_position',
          company_industry: 'company_industry',
          custom: {}
        });
      });

      it('should move non-special traits to custom object', function() {
        analytics.identify({
          trait: true,
          weirdTraits: 'can go anywhere',
          custom: 'works too'
        });
        analytics.called(window._gs, 'properties', {
          custom: {
            trait: true,
            weirdTraits: 'can go anywhere',
            custom: 'works too'
          }
        });
      });

      it('should keep both custom traits and non-special traits', function() {
        analytics.identify({
          trait: true,
          weirdTraits: 'can go anywhere',
          custom: {
            iWantThese: 'traits',
            too: 'yes'
          }
        });
        analytics.called(window._gs, 'properties', {
          custom: {
            trait: true,
            weirdTraits: 'can go anywhere',
            custom: {
              iWantThese: 'traits',
              too: 'yes'
            }
          }
        });
      });

      it('should set an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window._gs, 'identify', 'id', {
          id: 'id',
          custom: {
            trait: true
          }
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, '_gs');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._gs, 'event', 'event', {});
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window._gs, 'event', 'event', { property: true });
      });
    });

    describe('ecommerce', function() {
      beforeEach(function() {
        analytics.stub(window, '_gs');
      });

      it('should send a transaction', function() {
        analytics.track('order completed', {
          id: 'a9173991',
          total: 90,
          quantity: 10,
          products: [{
            category: 'my category',
            name: 'my-product',
            quantity: 10,
            price: 9
          }]
        });

        analytics.called(window._gs, 'transaction', 'a9173991', {
          revenue: 90,
          track: true
        }, [{
          name: 'my-product',
          category: 'my category',
          quantity: 10,
          price: 9
        }]);
      });
    });
  });
});
