'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var KeenLib = require('../lib/');

describe('Keen IO', function() {
  var analytics;
  var keen;
  var options = {
    projectId: '53e40374e861700e79000002',
    writeKey: 'f474c11bcf5813fabc933d0a1f80ff2e1ac9ff1c9338dcf2707bbb8cf68971ae524b4cac8db5da549aa3383d499ed4a809e2b6294d1d093818d699495a4171dab3e6ad86e2c31d06627f27aadb8433f43c8f27f3e0354e6ea4c12f9da57ca9d8420b18c5e4f719286a0fae08914d9c44'
  };
  var readKey = 'e5cdee9b7395b315bd8cc635f3b04fc07561d4e42889fe1b6ac719a9a4b45732c746666d83ce8644c8b0f06b867166654f900b67b250adbc225befac4b3a2562729c2ebebfbf19b1d13f631c2ed0c9f8de0be7897eded88102abe4366c7906011dd480631ed9ba60cdef84f908abc852';

  beforeEach(function() {
    analytics = new Analytics();
    keen = new KeenLib(options);
    analytics.use(KeenLib);
    analytics.use(tester);
    analytics.add(keen);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    keen.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(KeenLib, integration('Keen IO')
      .global('KeenSegment')
      .option('ipAddon', false)
      .option('projectId', '')
      .option('readKey', '')
      .option('referrerAddon', false)
      .option('trackAllPages', false)
      .option('trackNamedPages', true)
      .option('uaAddon', false)
      .option('urlAddon', false)
      .option('writeKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(keen, 'load');
    });

    describe('#initialize', function() {
      it('should create window.KeenSegment', function() {
        analytics.assert(!window.KeenSegment);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.KeenSegment);
      });

      it('should configure KeenSegment', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(keen.client._config, {
          projectId: options.projectId,
          writeKey: options.writeKey,
          readKey: ''
        });
      });
    });
  });

  describe('loading', function() {
    beforeEach(function() {
      analytics.spy(keen, 'load');
    });

    it('should load slim version by default', function(done) {
      analytics.load(keen, function() {
        analytics.assert(!window.KeenSegment.Dataviz);
        done();
      });
    });

    it('should load full version if you have a `readKey`', function(done) {
      keen.options.readKey = readKey;
      analytics.load(keen, function() {
        analytics.assert(window.KeenSegment.Dataviz);
        done();
      });
    });

    it('should preserve existing window.Keen', function(done) {
      window.Keen = { version: '3.4.1' };
      analytics.load(keen, function() {
        analytics.equal(window.Keen.version, '3.4.1');
        done();
      });
    });

    it('should expose window.Keen (v3.4.0) when no previous version is available', function(done) {
      window.Keen = undefined;
      analytics.load(keen, function() {
        analytics.equal(window.Keen.version, '3.4.0');
        done();
      });
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
        analytics.stub(keen.client, 'addEvent');
      });

      it('should not track anonymous pages by default', function() {
        analytics.page();
        analytics.didNotCall(keen.client.addEvent);
      });

      it('should track anonymous pages when the option is on', function() {
        keen.options.trackAllPages = true;
        analytics.page();
        analytics.called(keen.client.addEvent, 'Loaded a Page');
      });

      it('should track named pages by default', function() {
        analytics.page('Name');
        analytics.called(keen.client.addEvent, 'Viewed Name Page');
      });

      it('should track named pages with categories', function() {
        analytics.page('Category', 'Name');
        analytics.called(keen.client.addEvent, 'Viewed Category Name Page');
      });

      it('should track categorized pages by default', function() {
        analytics.page('Category', 'Name');
        analytics.called(keen.client.addEvent, 'Viewed Category Page');
      });

      it('should not track a named or categorized page when the option is off', function() {
        keen.options.trackNamedPages = false;
        keen.options.trackCategorizedPages = false;
        analytics.page('Name');
        analytics.page('Category', 'Name');
        analytics.didNotCall(keen.client.addEvent);
      });

      it('should pass properties to .addEvent', function() {
        var time = new Date();
        analytics.page('category', 'name', { prop: true }, { timestamp: time });
        analytics.called(keen.client.addEvent, 'Viewed category name Page', {
          prop: true,
          path: location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: location.search,
          name: 'name',
          category: 'category',
          url: location.href,
          keen: {
            timestamp: time,
            addons: []
          }
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(keen.client, 'addEvent');
      });

      it('should pass an id', function() {
        analytics.identify('id');
        var user = keen.client.config.globalProperties().user;
        analytics.deepEqual(user, { userId: 'id', traits: { id: 'id' } });
      });

      it('should pass a traits', function() {
        analytics.identify({ trait: true });
        var user = keen.client.config.globalProperties().user;
        analytics.deepEqual(user, { traits: { trait: true } });
      });

      it('should pass an id and traits', function() {
        analytics.identify('id', { trait: true });
        var user = keen.client.config.globalProperties().user;
        analytics.deepEqual(user, { userId: 'id', traits: { trait: true, id: 'id' } });
      });

      it('should not have modified traits after addEvent', function() {
        analytics.identify('id', { trait: true });
        analytics.track('event', { other_trait: true });
        
        analytics.equal(typeof keen.client.config.globalProperties().user.traits.other_trait, 'undefined');
      });

      describe('addons', function() {
        it('should add ipAddon if enabled', function() {
          keen.options.ipAddon = true;
          analytics.identify('id');
          var props = keen.client.config.globalProperties();
          var addon = props.keen.addons[0];
          analytics.deepEqual(addon, {
            name: 'keen:ip_to_geo',
            input: { ip: 'ip_address' },
            output: 'ip_geo_info'
          });
          analytics.equal(props.ip_address, '${keen.ip}');
        });

        it('should add uaAddon if enabled', function() {
          keen.options.uaAddon = true;
          analytics.identify('id');
          var props = keen.client.config.globalProperties();
          var addon = props.keen.addons[0];
          analytics.deepEqual(addon, {
            name: 'keen:ua_parser',
            input: { ua_string: 'user_agent' },
            output: 'parsed_user_agent'
          });
          analytics.equal(props.user_agent, '${keen.user_agent}');
        });

        it('should add urlAddon if enabled', function() {
          keen.options.urlAddon = true;
          analytics.identify('id');
          var props = keen.client.config.globalProperties();
          var addon = props.keen.addons[0];
          analytics.deepEqual(addon, {
            name: 'keen:url_parser',
            input: { url: 'page_url' },
            output: 'parsed_page_url'
          });
          analytics.equal(props.page_url, document.location.href);
        });

        it('should add referrerAddon if enabled', function() {
          keen.options.referrerAddon = true;
          analytics.identify('id');
          var props = keen.client.config.globalProperties();
          var addon = props.keen.addons[0];
          analytics.deepEqual(addon, {
            name: 'keen:referrer_parser',
            input: {
              referrer_url: 'referrer_url',
              page_url: 'page_url'
            },
            output: 'referrer_info'
          });
          analytics.equal(props.referrer_url, document.referrer);
          analytics.equal(props.page_url, document.location.href);
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(keen.client, 'addEvent');
      });

      it('should pass an event', function() {
        analytics.track('event');
        analytics.called(keen.client.addEvent, 'event');
      });

      it('should pass an event and properties', function() {
        var time = new Date();
        analytics.track('event', { property: true }, { timestamp: time });
        analytics.called(keen.client.addEvent, 'event', {
          property: true,
          keen: {
            timestamp: time,
            addons: []
          }
        });
      });

      describe('addons', function() {
        it('should add ipAddon if enabled', function() {
          keen.options.ipAddon = true;
          analytics.track('event');
          var props = keen.client.addEvent.args[0][1];
          var addon = props.keen.addons[0];
          analytics.deepEqual(addon, {
            name: 'keen:ip_to_geo',
            input: { ip: 'ip_address' },
            output: 'ip_geo_info'
          });
          analytics.equal(props.ip_address, '${keen.ip}');
        });

        it('should add uaAddon if enabled', function() {
          keen.options.uaAddon = true;
          analytics.track('event');
          var props = keen.client.addEvent.args[0][1];
          var addon = props.keen.addons[0];
          analytics.deepEqual(addon, {
            name: 'keen:ua_parser',
            input: { ua_string: 'user_agent' },
            output: 'parsed_user_agent'
          });
          analytics.equal(props.user_agent, '${keen.user_agent}');
        });

        it('should add urlAddon if enabled', function() {
          keen.options.urlAddon = true;
          analytics.track('event');
          var props = keen.client.addEvent.args[0][1];
          var addon = props.keen.addons[0];
          analytics.deepEqual(addon, {
            name: 'keen:url_parser',
            input: { url: 'page_url' },
            output: 'parsed_page_url'
          });
          analytics.equal(props.page_url, document.location.href);
        });

        it('should add referrerAddon if enabled', function() {
          keen.options.referrerAddon = true;
          analytics.track('event');
          var props = keen.client.addEvent.args[0][1];
          var addon = props.keen.addons[0];
          analytics.deepEqual(addon, {
            name: 'keen:referrer_parser',
            input: {
              referrer_url: 'referrer_url',
              page_url: 'page_url'
            },
            output: 'referrer_info'
          });
          analytics.equal(props.referrer_url, document.referrer);
          analytics.equal(props.page_url, document.location.href);
        });
      });
    });
  });
});
