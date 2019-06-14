'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var iso = require('@segment/to-iso-string');
var plugin = require('../lib/');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');

describe('Totango', function() {
  var Totango = plugin;
  var totango;
  var analytics;
  var options = {
    serviceId: 'SP-3389-01',
    disableHeartbeat: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    totango = new Totango(options);
    analytics.use(plugin);
    analytics.use(tester);
    analytics.add(totango);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    totango.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Totango,
      integration('Totango')
        .assumesPageview()
        .global('totango')
        .global('totango_options')
        .option('serviceId', null)
        .option('disableHeartbeat', false)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(totango, 'load');
    });

    describe('#initialize', function() {
      it('should create the window.totango object', function() {
        analytics.assert(!window.totango);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.totango);
      });

      it('should create the window.totango_options object', function() {
        analytics.assert(!window.totango_options);
        analytics.initialize();
        analytics.page('Category', 'Name');
        analytics.deepEqual(window.totango_options, {
          allow_empty_accounts: false,
          service_id: options.serviceId,
          disable_heartbeat: options.disableHeartbeat,
          module: 'Category'
        });
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(totango.load);
      });
    });

    describe('#loaded', function() {
      it('should test window.__totango3', function() {
        analytics.assert(!totango.loaded());
        window.__totango3 = {};
        analytics.assert(totango.loaded());
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(totango, done);
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
        analytics.stub(totango, 'debug');
        analytics.stub(window.totango, 'go');
        analytics.stub(window.totango, 'track');
      });

      it('should track named pages by default', function() {
        analytics.page(null, 'Name');
        analytics.called(window.totango.track, 'Viewed Name Page');
      });

      it('should track named pages with categories', function() {
        analytics.page('Category', 'Name');
        analytics.called(window.totango.track, 'Viewed Category Name Page');
      });

      it('should track categorized pages by default', function() {
        analytics.page('Category', 'Name');
        analytics.called(window.totango.track, 'Viewed Category Page');
      });

      it('should not track category pages when the option is off', function() {
        totango.options.trackNamedPages = false;
        totango.options.trackCategorizedPages = false;
        analytics.page(null, 'Name');
        analytics.page('Category', 'Name');
        analytics.didNotCall(window.totango.track);
      });

      it('should not send the category without a user and group', function() {
        analytics.page();
        analytics.didNotCall(window.totango.go);
        analytics.called(totango.debug, 'must identify and group first');
      });

      it('should not call go without a category', function() {
        analytics.user().identify('id');
        analytics.group().identify('id');
        analytics.page();
        analytics.didNotCall(window.totango.go);
        analytics.called(totango.debug, 'category required');
      });

      it('should send a category', function() {
        analytics.identify('id');
        analytics.group('id');
        analytics.page('Category', 'Name');
        analytics.called(window.totango.go, {
          service_id: options.serviceId,
          disable_heartbeat: options.disableHeartbeat,
          allow_empty_accounts: false,
          module: 'Category'
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(totango, 'debug');
        analytics.stub(window.totango, 'go');
      });

      it('should not send traits without an id', function() {
        analytics.identify(null, { trait: true });
        analytics.didNotCall(window.totango.go);
        analytics.called(totango.debug, 'id required');
      });

      it('should send traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.totango.go, {
          service_id: options.serviceId,
          disable_heartbeat: options.disableHeartbeat,
          allow_empty_accounts: false,
          username: 'id',
          user: {
            id: 'id',
            trait: true
          }
        });
      });

      it('should convert dates to isostrings', function() {
        var date = new Date();
        analytics.identify('id', { date: date });
        analytics.called(window.totango.go, {
          service_id: options.serviceId,
          disable_heartbeat: options.disableHeartbeat,
          allow_empty_accounts: false,
          username: 'id',
          user: {
            id: 'id',
            date: iso(date)
          }
        });
      });

      it('should alias a created trait', function() {
        var date = new Date();
        analytics.identify('id', { created: date });
        analytics.called(window.totango.go, {
          service_id: options.serviceId,
          disable_heartbeat: options.disableHeartbeat,
          allow_empty_accounts: false,
          username: 'id',
          user: {
            id: 'id',
            'Create Date': iso(date)
          }
        });
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(totango, 'debug');
        analytics.stub(window.totango, 'go');
      });

      it('should not send properties without an id', function() {
        analytics.group(null, { property: true });
        analytics.didNotCall(window.totango.go);
        analytics.called(totango.debug, 'id required');
      });

      it('should send properties', function() {
        analytics.group('id', { property: true });
        analytics.called(window.totango.go, {
          service_id: options.serviceId,
          disable_heartbeat: options.disableHeartbeat,
          allow_empty_accounts: false,
          account: {
            id: 'id',
            property: true
          }
        });
      });

      it('should convert dates to isostrings', function() {
        var date = new Date();
        analytics.group('id', { date: date });
        analytics.called(window.totango.go, {
          service_id: options.serviceId,
          disable_heartbeat: options.disableHeartbeat,
          allow_empty_accounts: false,
          account: {
            id: 'id',
            date: iso(date)
          }
        });
      });

      it('should alias a created property', function() {
        var date = new Date();
        analytics.group('id', { created: date });
        analytics.called(window.totango.go, {
          service_id: options.serviceId,
          disable_heartbeat: options.disableHeartbeat,
          allow_empty_accounts: false,
          account: {
            id: 'id',
            'Create Date': iso(date)
          }
        });
      });

      it('should add parent properties to the totango account options', function() {
        analytics.group(
          'id',
          { property: true },
          { Totango: { parent: { id: 'XYZ-85b' } } }
        );
        analytics.called(window.totango.go, {
          service_id: options.serviceId,
          disable_heartbeat: options.disableHeartbeat,
          allow_empty_accounts: false,
          account: {
            id: 'id',
            property: true,
            parent: {
              id: 'XYZ-85b'
            }
          }
        });
      });

      it('should add enableHierarchy flag to the totango options', function() {
        analytics.group(
          'id',
          { property: true },
          { Totango: { enableHierarchy: false } }
        );
        analytics.called(window.totango.go, {
          service_id: options.serviceId,
          disable_heartbeat: options.disableHeartbeat,
          allow_empty_accounts: false,
          enableHierarchy: false,
          account: {
            id: 'id',
            property: true
          }
        });
      });

      describe('with product account', function() {
        it('should add product properties', function() {
          analytics.group(
            'id',
            { property: true },
            { Totango: { product: { id: 'productA' } } }
          );
          analytics.called(window.totango.go, {
            service_id: options.serviceId,
            disable_heartbeat: options.disableHeartbeat,
            allow_empty_accounts: false,
            account: {
              id: 'id',
              property: true
            },
            product: {
              id: 'productA'
            }
          });
        });

        it('should convert product dates to isostrings', function() {
          var date = new Date();
          analytics.group(
            'id',
            { property: true },
            { Totango: { product: { date: date } } }
          );
          analytics.called(window.totango.go, {
            service_id: options.serviceId,
            disable_heartbeat: options.disableHeartbeat,
            allow_empty_accounts: false,
            account: {
              id: 'id',
              property: true
            },
            product: {
              date: iso(date)
            }
          });
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.totango, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.totango.track, 'event');
      });

      it('should send a stored category', function() {
        analytics.page('Category', 'Name');
        analytics.track('event');
        analytics.called(window.totango.track, 'event', 'Category');
      });

      it('should prefer a category property', function() {
        analytics.page('Category', 'Name');
        analytics.track('event', { category: 'preferred' });
        analytics.called(window.totango.track, 'event', 'preferred');
      });
    });
  });
});
