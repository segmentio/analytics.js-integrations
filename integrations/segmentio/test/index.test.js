'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var JSON = require('json3');
var Segment = require('../lib/');
var assert = require('proclaim');
var cookie = require('component-cookie');
var integration = require('@segment/analytics.js-integration');
var protocol = require('@segment/protocol');
var sandbox = require('@segment/clear-env');
var store = require('yields-store');
var tester = require('@segment/analytics.js-integration-tester');
var type = require('component-type');
var sinon = require('sinon');
var send = require('@segment/send-json');
var Schedule = require('@segment/localstorage-retry/lib/schedule');
var lolex = require('lolex');

// FIXME(ndhoule): clear-env's AJAX request clearing interferes with PhantomJS 2
// Detect Phantom env and use it to disable affected tests. We should use a
// better/more robust way of intercepting and canceling AJAX requests to avoid
// this hackery
var isPhantomJS = /PhantomJS/.test(window.navigator.userAgent);

describe('Segment.io', function() {
  var segment;
  var analytics;
  var options;

  before(function() {
    // Just to make sure that `cookie()`
    // doesn't throw URIError we add a cookie
    // that will cause `decodeURIComponent()` to throw.
    document.cookie = 'bad=%';
  });

  beforeEach(function() {
    options = { apiKey: 'oq0vdlg7yi' };
    protocol.reset();
    analytics = new Analytics();
    segment = new Segment(options);
    analytics.use(Segment);
    analytics.use(tester);
    analytics.add(segment);
    analytics.assert(Segment.global === window);
    resetCookies();
    if (window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    resetCookies();
    if (window.localStorage) {
      window.localStorage.clear();
    }
    segment.reset();
    sandbox();
  });

  function resetCookies() {
    store('s:context.referrer', null);
    cookie('s:context.referrer', null, { maxage: -1, path: '/' });
    store('_ga', null);
    cookie('_ga', null, { maxage: -1, path: '/' });
    store('seg_xid', null);
    cookie('seg_xid', null, { maxage: -1, path: '/' });
    store('seg_xid_fd', null);
    cookie('seg_xid_fd', null, { maxage: -1, path: '/' });
    store('seg_xid_ts', null);
    cookie('seg_xid_ts', null, { maxage: -1, path: '/' });
  }

  it('should have the right settings', function() {
    analytics.compare(
      Segment,
      integration('Segment.io')
        .option('apiKey', '')
        .option('retryQueue', true)
    );
  });

  it('should always be turned on', function(done) {
    var Analytics = analytics.constructor;
    var ajs = new Analytics();
    ajs.use(Segment);
    ajs.initialize({ 'Segment.io': options });
    ajs.ready(function() {
      var segment = ajs._integrations['Segment.io'];
      segment.ontrack = sinon.spy();
      ajs.track('event', {}, { All: false });
      assert(segment.ontrack.calledOnce);
      done();
    });
  });

  describe('Segment.storage()', function() {
    it('should return cookie() when the protocol isnt file://', function() {
      analytics.assert(Segment.storage(), cookie);
    });

    it('should return store() when the protocol is file://', function() {
      analytics.assert(Segment.storage(), cookie);
      protocol('file:');
      analytics.assert(Segment.storage(), store);
    });

    it('should return store() when the protocol is chrome-extension://', function() {
      analytics.assert(Segment.storage(), cookie);
      protocol('chrome-extension:');
      analytics.assert(Segment.storage(), store);
    });
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(segment, 'load');
    });

    describe('#normalize', function() {
      var object;

      beforeEach(function() {
        segment.cookie('s:context.referrer', null);
        analytics.initialize();
        object = {};
      });

      it('should add .anonymousId', function() {
        analytics.user().anonymousId('anon-id');
        segment.normalize(object);
        analytics.assert(object.anonymousId === 'anon-id');
      });

      it('should add .sentAt', function() {
        segment.normalize(object);
        analytics.assert(object.sentAt);
        analytics.assert(type(object.sentAt) === 'date');
      });

      it('should add .userId', function() {
        analytics.user().id('user-id');
        segment.normalize(object);
        analytics.assert(object.userId === 'user-id');
      });

      it('should not replace the .userId', function() {
        analytics.user().id('user-id');
        object.userId = 'existing-id';
        segment.normalize(object);
        analytics.assert(object.userId === 'existing-id');
      });

      it('should always add .anonymousId even if .userId is given', function() {
        var object = { userId: 'baz' };
        segment.normalize(object);
        analytics.assert(object.anonymousId.length === 36);
      });

      it('should add .context', function() {
        segment.normalize(object);
        analytics.assert(object.context);
      });

      it('should not rewrite context if provided', function() {
        var ctx = {};
        var object = { context: ctx };
        segment.normalize(object);
        analytics.assert(object.context === ctx);
      });

      it('should copy .options to .context', function() {
        var opts = {};
        var object = { options: opts };
        segment.normalize(object);
        analytics.assert(object.context === opts);
        analytics.assert(object.options == null);
      });

      it('should add .writeKey', function() {
        segment.normalize(object);
        analytics.assert(object.writeKey === segment.options.apiKey);
      });

      it('should add .library', function() {
        segment.normalize(object);
        analytics.assert(object.context.library);
        analytics.assert(object.context.library.name === 'analytics.js');
        analytics.assert(object.context.library.version === analytics.VERSION);
      });

      it('should allow override of .library', function() {
        var ctx = {
          library: {
            name: 'analytics-wordpress',
            version: '1.0.3'
          }
        };
        var object = { context: ctx };
        segment.normalize(object);
        analytics.assert(object.context.library);
        analytics.assert(object.context.library.name === 'analytics-wordpress');
        analytics.assert(object.context.library.version === '1.0.3');
      });

      it('should add .userAgent', function() {
        segment.normalize(object);
        analytics.assert(object.context.userAgent === navigator.userAgent);
      });

      it('should add .locale', function() {
        segment.normalize(object);
        analytics.assert(object.context.locale === navigator.language);
      });

      it('should not replace .locale if provided', function() {
        var ctx = {
          locale: 'foobar'
        };
        var object = { context: ctx };
        segment.normalize(object);
        analytics.assert(object.context.locale === 'foobar');
      });

      it('should add .campaign', function() {
        Segment.global = { navigator: {}, location: {} };
        Segment.global.location.search =
          '?utm_source=source&utm_medium=medium&utm_term=term&utm_content=content&utm_campaign=name';
        Segment.global.location.hostname = 'localhost';
        segment.normalize(object);
        analytics.assert(object);
        analytics.assert(object.context);
        analytics.assert(object.context.campaign);
        analytics.assert(object.context.campaign.source === 'source');
        analytics.assert(object.context.campaign.medium === 'medium');
        analytics.assert(object.context.campaign.term === 'term');
        analytics.assert(object.context.campaign.content === 'content');
        analytics.assert(object.context.campaign.name === 'name');
        Segment.global = window;
      });

      it('should decode .campaign', function() {
        Segment.global = { navigator: {}, location: {} };
        Segment.global.location.search =
          '?utm_source=%5BFoo%5D';
        segment.normalize(object);
        analytics.assert(object);
        analytics.assert(object.context);
        analytics.assert(object.context.campaign);
        analytics.assert(object.context.campaign.source === '[Foo]');
        Segment.global = window;
      });

      it('should allow override of .campaign', function() {
        Segment.global = { navigator: {}, location: {} };
        Segment.global.location.search =
          '?utm_source=source&utm_medium=medium&utm_term=term&utm_content=content&utm_campaign=name';
        Segment.global.location.hostname = 'localhost';
        var object = {
          context: {
            campaign: {
              source: 'overrideSource',
              medium: 'overrideMedium',
              term: 'overrideTerm',
              content: 'overrideContent',
              name: 'overrideName'
            }
          }
        };
        segment.normalize(object);
        analytics.assert(object);
        analytics.assert(object.context);
        analytics.assert(object.context.campaign);
        analytics.assert(object.context.campaign.source === 'overrideSource');
        analytics.assert(object.context.campaign.medium === 'overrideMedium');
        analytics.assert(object.context.campaign.term === 'overrideTerm');
        analytics.assert(object.context.campaign.content === 'overrideContent');
        analytics.assert(object.context.campaign.name === 'overrideName');
        Segment.global = window;
      });

      it('should add .referrer.id and .referrer.type', function() {
        Segment.global = { navigator: {}, location: {} };
        Segment.global.location.search = '?utm_source=source&urid=medium';
        Segment.global.location.hostname = 'localhost';
        segment.normalize(object);
        analytics.assert(object);
        analytics.assert(object.context);
        analytics.assert(object.context.referrer);
        analytics.assert(object.context.referrer.id === 'medium');
        analytics.assert(object.context.referrer.type === 'millennial-media');
        Segment.global = window;
      });

      it('should add .referrer.id and .referrer.type from cookie', function() {
        segment.cookie(
          's:context.referrer',
          '{"id":"baz","type":"millennial-media"}'
        );
        Segment.global = { navigator: {}, location: {} };
        Segment.global.location.search = '?utm_source=source';
        Segment.global.location.hostname = 'localhost';
        segment.normalize(object);
        analytics.assert(object);
        analytics.assert(object.context);
        analytics.assert(object.context.referrer);
        analytics.assert(object.context.referrer.id === 'baz');
        analytics.assert(object.context.referrer.type === 'millennial-media');
        Segment.global = window;
      });

      it('should add .referrer.id and .referrer.type from cookie when no query is given', function() {
        segment.cookie(
          's:context.referrer',
          '{"id":"medium","type":"millennial-media"}'
        );
        Segment.global = { navigator: {}, location: {} };
        Segment.global.location.search = '';
        Segment.global.location.hostname = 'localhost';
        segment.normalize(object);
        analytics.assert(object);
        analytics.assert(object.context);
        analytics.assert(object.context.referrer);
        analytics.assert(object.context.referrer.id === 'medium');
        analytics.assert(object.context.referrer.type === 'millennial-media');
        Segment.global = window;
      });

      it('shouldnt add non amp ga cookie', function() {
        segment.cookie('_ga', 'some-nonamp-id');
        segment.normalize(object);
        analytics.assert(object);
        analytics.assert(object.context);
        analytics.assert(!object.context.amp);
      });

      it('should add .amp.id from store', function() {
        segment.cookie('_ga', 'amp-foo');
        segment.normalize(object);
        analytics.assert(object);
        analytics.assert(object.context);
        analytics.assert(object.context.amp);
        analytics.assert(object.context.amp.id === 'amp-foo');
      });

      it('should not add .amp if theres no _ga', function() {
        segment.normalize(object);
        analytics.assert(object);
        analytics.assert(object.context);
        analytics.assert(!object.context.amp);
      });

      it('should set xid from cookie, and context.traits is not defined', function() {
        segment.cookie('seg_xid', 'test_id');
        segment.options.crossDomainIdServers = [
          'userdata.example1.com',
          'xid.domain2.com',
          'localhost'
        ];
        segment.options.saveCrossDomainIdInLocalStorage = false;

        segment.normalize(object);
        assert.equal(object.context.traits.crossDomainId, 'test_id');
      });

      it('should set xid from cookie, and context.traits is defined', function() {
        segment.cookie('seg_xid', 'test_id');
        segment.options.crossDomainIdServers = [
          'userdata.example1.com',
          'xid.domain2.com',
          'localhost'
        ];
        segment.options.saveCrossDomainIdInLocalStorage = false;

        var msg = { context: { traits: { email: 'prateek@segment.com' } } };
        segment.normalize(msg);
        assert.equal(msg.context.traits.crossDomainId, 'test_id');
      });

      it('should set xid from localStorage, and context.traits is not defined', function() {
        window.localStorage.setItem('seg_xid', 'test_id');
        segment.options.crossDomainIdServers = [
          'userdata.example1.com',
          'xid.domain2.com',
          'localhost'
        ];
        segment.options.saveCrossDomainIdInLocalStorage = true;

        segment.normalize(object);
        assert.equal(object.context.traits.crossDomainId, 'test_id');
      });

      it('should set xid from localStorage, is enabled, and context.traits is defined', function() {
        window.localStorage.setItem('seg_xid', 'test_id');
        segment.options.crossDomainIdServers = [
          'userdata.example1.com',
          'xid.domain2.com',
          'localhost'
        ];
        segment.options.saveCrossDomainIdInLocalStorage = true;

        var msg = { context: { traits: { email: 'prateek@segment.com' } } };
        segment.normalize(msg);
        assert.equal(msg.context.traits.crossDomainId, 'test_id');
      });

      it('should not set xid if available, and is disabled', function() {
        segment.cookie('seg_xid', 'test_id');
        segment.options.crossDomainIdServers = [];

        segment.normalize(object);

        // context.traits will not be set, which implicitly verifies that
        // context.traits.crossDomainId is not set.
        assert.equal(object.context.traits, undefined);
      });

      it('should not set xid if not available, and context.traits is not defined', function() {
        segment.cookie('seg_xid', null);
        segment.normalize(object);
        // context.traits will not be set, which implicitly verifies that
        // context.traits.crossDomainId is not set.
        assert.equal(object.context.traits, undefined);
      });

      it('should not set xid if not available and context.traits is defined', function() {
        segment.cookie('seg_xid', null);

        var msg = { context: { traits: { email: 'prateek@segment.com' } } };
        segment.normalize(msg);
        assert.equal(msg.context.traits.crossDomainId, undefined);
      });

      describe('failed initializations', function() {
        it('should add failedInitializations as part of _metadata object if this.analytics.failedInitilizations is not empty', function() {
          var spy = sinon.spy(segment, 'normalize');
          var TestIntegration = integration('TestIntegration');
          TestIntegration.prototype.initialize = function() {
            throw new Error('Uh oh!');
          };
          TestIntegration.prototype.page = function() {};
          var testIntegration = new TestIntegration();
          analytics.use(TestIntegration);
          analytics.add(testIntegration);
          analytics.initialize();
          analytics.page();
          assert(
            spy.returnValues[0]._metadata.failedInitializations[0] ===
              'TestIntegration'
          );
        });
      });

      describe('unbundling', function() {
        var segment;

        beforeEach(function() {
          var Analytics = analytics.constructor;
          var ajs = new Analytics();
          segment = new Segment(options);
          ajs.use(Segment);
          ajs.use(integration('other'));
          ajs.use(integration('another'));
          ajs.add(segment);
          ajs.initialize({ other: {}, another: {} });
        });

        it('should add a list of bundled integrations when `addBundledMetadata` is set', function() {
          segment.options.addBundledMetadata = true;
          segment.normalize(object);

          assert(object);
          assert(object._metadata);
          assert.deepEqual(object._metadata.bundled, ['Segment.io', 'other', 'another']);
        });

        it('should add a list of unbundled integrations when `addBundledMetadata` and `unbundledIntegrations` are set', function() {
          segment.options.addBundledMetadata = true;
          segment.options.unbundledIntegrations = ['other2'];
          segment.normalize(object);

          assert(object);
          assert(object._metadata);
          assert.deepEqual(object._metadata.unbundled, ['other2']);
        });

        it('should not add _metadata when `addBundledMetadata` is unset', function() {
          segment.normalize(object);

          assert(object);
          assert(!object._metadata);
        });

        it('should generate and add a list of bundled destination config ids when `addBundledMetadata` is set', function() {
          segment.options.addBundledMetadata = true;
          segment.options.maybeBundledConfigIds = {
            'other': ['config21'],
            'slack': ['slack99'] // should be ignored
          };
          segment.normalize(object);

          assert(object);
          assert(object._metadata);
          assert.deepEqual(object._metadata.bundledIds, ['config21']);
        });

        it('should generate a list of multiple bundled destination config ids when `addBundledMetadata` is set', function() {
          segment.options.addBundledMetadata = true;
          segment.options.maybeBundledConfigIds = {
            'other': ['config21'],
            'another': ['anotherConfig99'],
            'slack': ['slack99'] // should be ignored
          };
          segment.normalize(object);

          assert(object);
          assert(object._metadata);
          assert.deepEqual(object._metadata.bundledIds, ['config21', 'anotherConfig99']);
        });
      });

      it('should pick up messageId from AJS', function() {
        object = analytics.normalize(object); // ajs core generates the message ID here
        var messageId = object.messageId;
        segment.normalize(object);
        assert.equal(object.messageId, messageId);
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#settings', function() {
      it('should have retryQueue enabled', function() {
        analytics.assert(segment.options.retryQueue === true);
      });
    });

    var cases = {
      'retryQueue enabled': true,
      'retryQueue disabled': false
    };

    for (var scenario in cases) {
      if (!cases.hasOwnProperty(scenario)) {
        continue;
      }

      describe('with ' + scenario, function() {
        beforeEach(function() {
          segment.options.retryQueue = cases[scenario];
        });

        describe('#page', function() {
          beforeEach(function() {
            analytics.stub(segment, 'enqueue');
          });

          it('should enqueue section, name and properties', function() {
            analytics.page(
              'section',
              'name',
              { property: true },
              { opt: true }
            );
            var args = segment.enqueue.args[0];
            analytics.assert(args[0] === '/p');
            analytics.assert(args[1].name === 'name');
            analytics.assert(args[1].category === 'section');
            analytics.assert(args[1].properties.property === true);
            analytics.assert(args[1].context.opt === true);
            analytics.assert(args[1].timestamp);
          });
        });

        describe('#identify', function() {
          beforeEach(function() {
            analytics.stub(segment, 'enqueue');
          });

          it('identify should not ultimately call getCachedCrossDomainId if crossDomainAnalytics is not enabled', function() {
            segment.options.crossDomainIdServers = [];
            var getCachedCrossDomainIdSpy = sinon.spy(
              segment,
              'getCachedCrossDomainId'
            );
            segment.normalize({});
            sinon.assert.notCalled(getCachedCrossDomainIdSpy);
            segment.getCachedCrossDomainId.restore();
          });

          it('should enqueue an id and traits', function() {
            analytics.identify('id', { trait: true }, { opt: true });
            var args = segment.enqueue.args[0];
            analytics.assert(args[0] === '/i');
            analytics.assert(args[1].userId === 'id');
            analytics.assert(args[1].traits.trait === true);
            analytics.assert(args[1].context.opt === true);
            analytics.assert(args[1].timestamp);
          });
        });

        describe('#track', function() {
          beforeEach(function() {
            analytics.stub(segment, 'enqueue');
          });

          it('should enqueue an event and properties', function() {
            analytics.track('event', { prop: true }, { opt: true });
            var args = segment.enqueue.args[0];
            analytics.assert(args[0] === '/t');
            analytics.assert(args[1].event === 'event');
            analytics.assert(args[1].context.opt === true);
            analytics.assert(args[1].properties.prop === true);
            analytics.assert(args[1].traits == null);
            analytics.assert(args[1].timestamp);
          });
        });

        describe('#group', function() {
          beforeEach(function() {
            analytics.stub(segment, 'enqueue');
          });

          it('should enqueue groupId and traits', function() {
            analytics.group('id', { trait: true }, { opt: true });
            var args = segment.enqueue.args[0];
            analytics.assert(args[0] === '/g');
            analytics.assert(args[1].groupId === 'id');
            analytics.assert(args[1].context.opt === true);
            analytics.assert(args[1].traits.trait === true);
            analytics.assert(args[1].timestamp);
          });
        });

        describe('#alias', function() {
          beforeEach(function() {
            analytics.stub(segment, 'enqueue');
          });

          it('should enqueue .userId and .previousId', function() {
            analytics.alias('to', 'from');
            var args = segment.enqueue.args[0];
            analytics.assert(args[0] === '/a');
            analytics.assert(args[1].previousId === 'from');
            analytics.assert(args[1].userId === 'to');
            analytics.assert(args[1].timestamp);
          });

          it('should fallback to user.anonymousId if .previousId is omitted', function() {
            analytics.user().anonymousId('anon-id');
            analytics.alias('to');
            var args = segment.enqueue.args[0];
            analytics.assert(args[0] === '/a');
            analytics.assert(args[1].previousId === 'anon-id');
            analytics.assert(args[1].userId === 'to');
            analytics.assert(args[1].timestamp);
          });

          it('should fallback to user.anonymousId if .previousId and user.id are falsey', function() {
            analytics.alias('to');
            var args = segment.enqueue.args[0];
            analytics.assert(args[0] === '/a');
            analytics.assert(args[1].previousId);
            analytics.assert(args[1].previousId.length === 36);
            analytics.assert(args[1].userId === 'to');
          });

          it('should rename `.from` and `.to` to `.previousId` and `.userId`', function() {
            analytics.alias('user-id', 'previous-id');
            var args = segment.enqueue.args[0];
            analytics.assert(args[0] === '/a');
            analytics.assert(args[1].previousId === 'previous-id');
            analytics.assert(args[1].userId === 'user-id');
            analytics.assert(args[1].from == null);
            analytics.assert(args[1].to == null);
          });
        });

        describe('#enqueue', function() {
          var xhr;

          beforeEach(function() {
            analytics.spy(segment, 'session');
            sinon.spy(segment, 'debug');
            xhr = sinon.useFakeXMLHttpRequest();
          });

          afterEach(function() {
            if (xhr.restore) xhr.restore();
            if (segment.debug.restore) segment.debug.restore();
          });

          it(
            'should use https: protocol when http:',
            sinon.test(function() {
              var spy = sinon.spy();
              xhr.onCreate = spy;

              protocol('http:');
              segment.enqueue('/i', { userId: 'id' });

              assert(spy.calledOnce);
              var req = spy.getCall(0).args[0];
              assert.strictEqual(req.url, 'https://api.segment.io/v1/i');
            })
          );

          it(
            'should use https: protocol when https:',
            sinon.test(function() {
              var spy = sinon.spy();
              xhr.onCreate = spy;

              protocol('https:');
              segment.enqueue('/i', { userId: 'id' });

              assert(spy.calledOnce);
              var req = spy.getCall(0).args[0];
              assert.strictEqual(req.url, 'https://api.segment.io/v1/i');
            })
          );

          it(
            'should use https: protocol when https:',
            sinon.test(function() {
              var spy = sinon.spy();
              xhr.onCreate = spy;

              protocol('file:');
              segment.enqueue('/i', { userId: 'id' });

              assert(spy.calledOnce);
              var req = spy.getCall(0).args[0];
              assert.strictEqual(req.url, 'https://api.segment.io/v1/i');
            })
          );

          it(
            'should use https: protocol when chrome-extension:',
            sinon.test(function() {
              var spy = sinon.spy();
              xhr.onCreate = spy;

              protocol('chrome-extension:');
              segment.enqueue('/i', { userId: 'id' });

              assert(spy.calledOnce);
              var req = spy.getCall(0).args[0];
              assert.strictEqual(req.url, 'https://api.segment.io/v1/i');
            })
          );

          it(
            'should enqueue to `api.segment.io/v1` by default',
            sinon.test(function() {
              var spy = sinon.spy();
              xhr.onCreate = spy;

              protocol('https:');
              segment.enqueue('/i', { userId: 'id' });

              assert(spy.calledOnce);
              var req = spy.getCall(0).args[0];
              assert.strictEqual(req.url, 'https://api.segment.io/v1/i');
            })
          );

          it(
            'should enqueue to `options.apiHost` when set',
            sinon.test(function() {
              segment.options.apiHost = 'api.example.com';

              var spy = sinon.spy();
              xhr.onCreate = spy;

              protocol('https:');
              segment.enqueue('/i', { userId: 'id' });

              assert(spy.calledOnce);
              var req = spy.getCall(0).args[0];
              assert.strictEqual(req.url, 'https://api.example.com/i');
            })
          );

          it(
            'should enqueue a normalized payload',
            sinon.test(function() {
              var spy = sinon.spy();
              xhr.onCreate = spy;

              var payload = {
                key1: 'value1',
                key2: 'value2'
              };

              segment.normalize = function() {
                return payload;
              };

              segment.enqueue('/i', {});

              assert(spy.calledOnce);
              var req = spy.getCall(0).args[0];
              assert.strictEqual(JSON.parse(req.requestBody).key1, 'value1');
              assert.strictEqual(JSON.parse(req.requestBody).key2, 'value2');
            })
          );

          it(
            'should not log a normal payload',
            sinon.test(function() {
              var spy = sinon.spy();
              xhr.onCreate = spy;

              var payload = {
                key1: 'value1',
                key2: 'value2'
              };

              segment.normalize = function() {
                return payload;
              };

              segment.enqueue('/i', {});

              sinon.assert.neverCalledWith(
                segment.debug,
                'message must be less than 32kb %O',
                payload
              );

              assert(spy.calledOnce);
              var req = spy.getCall(0).args[0];
              assert.strictEqual(JSON.parse(req.requestBody).key1, 'value1');
              assert.strictEqual(JSON.parse(req.requestBody).key2, 'value2');
            })
          );

          it(
            'should enqueue an oversized payload',
            sinon.test(function() {
              var spy = sinon.spy();
              xhr.onCreate = spy;

              var payload = {};
              for (var i = 0; i < 1750; i++) {
                payload['key' + i] = 'value' + i;
              }

              segment.normalize = function() {
                return payload;
              };

              segment.enqueue('/i', {});

              sinon.assert.calledWith(
                segment.debug,
                'message must be less than 32kb %O',
                payload
              );

              assert(spy.calledOnce);
              var req = spy.getCall(0).args[0];
              assert.strictEqual(
                JSON.parse(req.requestBody).key1749,
                'value1749'
              );
            })
          );
        });

        // FIXME(ndhoule): See note at `isPhantomJS` definition
        (isPhantomJS
          ? xdescribe
          : describe)('e2e tests — without queueing', function() {
          beforeEach(function() {
            segment.options.retryQueue = false;
          });

          describe('/g', function() {
            it('should succeed', function(done) {
              segment.enqueue('/g', { groupId: 'gid', userId: 'uid' }, function(
                err,
                res
              ) {
                if (err) return done(err);
                analytics.assert(JSON.parse(res.responseText).success);
                done();
              });
            });
          });

          describe('/p', function() {
            it('should succeed', function(done) {
              var data = { userId: 'id', name: 'page', properties: {} };
              segment.enqueue('/p', data, function(err, res) {
                if (err) return done(err);
                analytics.assert(JSON.parse(res.responseText).success);
                done();
              });
            });
          });

          describe('/a', function() {
            it('should succeed', function(done) {
              var data = { userId: 'id', from: 'b', to: 'a' };
              segment.enqueue('/a', data, function(err, res) {
                if (err) return done(err);
                analytics.assert(JSON.parse(res.responseText).success);
                done();
              });
            });
          });

          describe('/t', function() {
            it('should succeed', function(done) {
              var data = { userId: 'id', event: 'my-event', properties: {} };

              segment.enqueue('/t', data, function(err, res) {
                if (err) return done(err);
                analytics.assert(JSON.parse(res.responseText).success);
                done();
              });
            });
          });

          describe('/i', function() {
            it('should succeed', function(done) {
              var data = { userId: 'id' };

              segment.enqueue('/i', data, function(err, res) {
                if (err) return done(err);
                analytics.assert(JSON.parse(res.responseText).success);
                done();
              });
            });
          });
        });

        (isPhantomJS
          ? xdescribe
          : describe)('e2e tests — with queueing', function() {
          beforeEach(function() {
            segment.options.retryQueue = true;
            analytics.initialize();
          });

          describe('/g', function() {
            it('should succeed', function(done) {
              segment._lsqueue.on('processed', function(err, res) {
                if (err) return done(err);
                analytics.assert(JSON.parse(res.responseText).success);
                done();
              });
              segment.enqueue('/g', { groupId: 'gid', userId: 'uid' });
            });
          });

          describe('/p', function() {
            it('should succeed', function(done) {
              segment._lsqueue.on('processed', function(err, res) {
                if (err) return done(err);
                analytics.assert(JSON.parse(res.responseText).success);
                done();
              });
              segment.enqueue('/p', {
                userId: 'id',
                name: 'page',
                properties: {}
              });
            });
          });

          describe('/a', function() {
            it('should succeed', function(done) {
              segment._lsqueue.on('processed', function(err, res) {
                if (err) return done(err);
                analytics.assert(JSON.parse(res.responseText).success);
                done();
              });
              segment.enqueue('/a', { userId: 'id', from: 'b', to: 'a' });
            });
          });

          describe('/t', function() {
            it('should succeed', function(done) {
              segment._lsqueue.on('processed', function(err, res) {
                if (err) return done(err);
                analytics.assert(JSON.parse(res.responseText).success);
                done();
              });
              segment.enqueue('/t', {
                userId: 'id',
                event: 'my-event',
                properties: {}
              });
            });
          });

          describe('/i', function() {
            it('should succeed', function(done) {
              segment._lsqueue.on('processed', function(err, res) {
                if (err) return done(err);
                analytics.assert(JSON.parse(res.responseText).success);
                done();
              });
              segment.enqueue('/i', { userId: 'id' });
            });
          });
        });

        describe('#cookie', function() {
          beforeEach(function() {
            segment.cookie('foo', null);
          });

          it('should persist the cookie even when the hostname is "dev"', function() {
            Segment.global = { navigator: {}, location: {} };
            Segment.global.location.href = 'https://dev:300/path';
            analytics.assert(segment.cookie('foo') == null);
            segment.cookie('foo', 'bar');
            analytics.assert(segment.cookie('foo') === 'bar');
            Segment.global = window;
          });

          it('should persist the cookie even when the hostname is "127.0.0.1"', function() {
            Segment.global = { navigator: {}, location: {} };
            Segment.global.location.href = 'http://127.0.0.1:3000/';
            analytics.assert(segment.cookie('foo') == null);
            segment.cookie('foo', 'bar');
            analytics.assert(segment.cookie('foo') === 'bar');
            Segment.global = window;
          });

          it('should persist the cookie even when the hostname is "app.herokuapp.com"', function() {
            Segment.global = { navigator: {}, location: {} };
            Segment.global.location.href = 'https://app.herokuapp.com/about';
            Segment.global.location.hostname = 'app.herokuapp.com';
            analytics.assert(segment.cookie('foo') == null);
            segment.cookie('foo', 'bar');
            analytics.assert(segment.cookie('foo') === 'bar');
            Segment.global = window;
          });
        });

        describe('#crossDomainId', function() {
          var server;

          beforeEach(function() {
            server = sinon.fakeServer.create();
            segment.options.crossDomainIdServers = [
              'userdata.example1.com',
              'xid.domain2.com',
              'localhost'
            ];
            analytics.stub(segment, 'onidentify');
          });

          afterEach(function() {
            server.restore();
          });

          it('should not crash with invalid config', function() {
            segment.options.crossDomainIdServers = undefined;

            var res = null;
            var err = null;
            segment.retrieveCrossDomainId(function(error, response) {
              res = response;
              err = error;
            });

            analytics.assert(!res);
            analytics.assert(err === 'crossDomainId not enabled');
          });

          it('should use cached cross domain identifier from LS when saveCrossDomainIdInLocalStorage is true', function() {
            segment.options.crossDomainIdServers = ['localhost'];
            segment.options.saveCrossDomainIdInLocalStorage = true;

            store('seg_xid', 'test_xid_cache_ls');

            var res = null;
            var err = null;
            segment.retrieveCrossDomainId(function(error, response) {
              res = response;
              err = error;
            });

            assert.isNull(err);
            assert.deepEqual(res, {
              crossDomainId: 'test_xid_cache_ls'
            });
          });

          it('should use cached cross domain identifier from cookies when saveCrossDomainIdInLocalStorage is false', function() {
            segment.options.crossDomainIdServers = ['localhost'];
            segment.options.saveCrossDomainIdInLocalStorage = false;

            segment.cookie('seg_xid', 'test_xid_cache_cookie');

            var res = null;
            var err = null;
            segment.retrieveCrossDomainId(function(error, response) {
              res = response;
              err = error;
            });

            assert.isNull(err);
            assert.deepEqual(res, {
              crossDomainId: 'test_xid_cache_cookie'
            });
          });

          describe('getCachedCrossDomainId', function() {
            it('should return identifiers from localstorage when saveCrossDomainIdInLocalStorage is true', function() {
              store('seg_xid', 'test_xid_cache_ls');
              segment.cookie('seg_xid', 'test_xid_cache_cookie');

              segment.options.saveCrossDomainIdInLocalStorage = true;

              assert.equal(
                segment.getCachedCrossDomainId(),
                'test_xid_cache_ls'
              );
            });

            it('should return identifiers from localstorage when saveCrossDomainIdInLocalStorage is true', function() {
              store('seg_xid', 'test_xid_cache_ls');
              segment.cookie('seg_xid', 'test_xid_cache_cookie');

              segment.options.saveCrossDomainIdInLocalStorage = false;

              assert.equal(
                segment.getCachedCrossDomainId(),
                'test_xid_cache_cookie'
              );
            });
          });

          var cases = {
            'saveCrossDomainIdInLocalStorage true': true,
            'saveCrossDomainIdInLocalStorage false': false
          };

          for (var scenario in cases) {
            if (!cases.hasOwnProperty(scenario)) {
              continue;
            }

            describe('with ' + scenario, function() {
              it('should obtain crossDomainId', function() {
                server.respondWith(
                  'GET',
                  'https://xid.domain2.com/v1/id/' + segment.options.apiKey,
                  [
                    200,
                    { 'Content-Type': 'application/json' },
                    '{ "id": "xdomain-id-1" }'
                  ]
                );
                if (segment.options.saveCrossDomainIdInLocalStorage) {
                  server.respondWith(
                    'GET',
                    'https://localhost/v1/saveId?writeKey=' +
                      segment.options.apiKey +
                      '&xid=xdomain-id-1',
                    [200, { 'Content-Type': 'text/plan' }, 'OK']
                  );
                }
                server.respondImmediately = true;

                var res = null;
                segment.retrieveCrossDomainId(function(err, response) {
                  res = response;
                });

                var identify = segment.onidentify.args[0];
                analytics.assert(
                  identify[0].traits().crossDomainId === 'xdomain-id-1'
                );

                analytics.assert(res.crossDomainId === 'xdomain-id-1');
                analytics.assert(res.fromDomain === 'xid.domain2.com');

                assert.equal(segment.getCachedCrossDomainId(), 'xdomain-id-1');
              });

              it('should generate crossDomainId if no server has it', function() {
                server.respondWith(
                  'GET',
                  'https://xid.domain2.com/v1/id/' + segment.options.apiKey,
                  [
                    200,
                    { 'Content-Type': 'application/json' },
                    '{ "id": null }'
                  ]
                );
                server.respondWith(
                  'GET',
                  'https://userdata.example1.com/v1/id/' +
                    segment.options.apiKey,
                  [
                    200,
                    { 'Content-Type': 'application/json' },
                    '{ "id": null }'
                  ]
                );
                server.respondWith(
                  'GET',
                  'https://localhost/v1/id/' + segment.options.apiKey,
                  [
                    200,
                    { 'Content-Type': 'application/json' },
                    '{ "id": null }'
                  ]
                );
                if (segment.options.saveCrossDomainIdInLocalStorage) {
                  server.respondWith('GET', /https:\/\/localhost\/v1\/saveId/, [
                    200,
                    { 'Content-Type': 'text/plan' },
                    'OK'
                  ]);
                }
                server.respondImmediately = true;

                var res = null;
                segment.retrieveCrossDomainId(function(err, response) {
                  res = response;
                });

                var identify = segment.onidentify.args[0];
                var crossDomainId = identify[0].traits().crossDomainId;
                analytics.assert(crossDomainId);

                analytics.assert(res.crossDomainId === crossDomainId);
                analytics.assert(res.fromDomain === 'localhost');

                assert.equal(segment.getCachedCrossDomainId(), crossDomainId);
              });

              it('should bail if all servers error', function() {
                var err = null;
                var res = null;
                segment.retrieveCrossDomainId(function(error, response) {
                  err = error;
                  res = response;
                });

                server.respondWith(
                  'GET',
                  'https://xid.domain2.com/v1/id/' + segment.options.apiKey,
                  [500, { 'Content-Type': 'application/json' }, '']
                );
                server.respondWith(
                  'GET',
                  'https://userdata.example1.com/v1/id/' +
                    segment.options.apiKey,
                  [500, { 'Content-Type': 'application/json' }, '']
                );
                server.respondWith(
                  'GET',
                  'https://localhost/v1/id/' + segment.options.apiKey,
                  [500, { 'Content-Type': 'application/json' }, '']
                );
                server.respond();

                var identify = segment.onidentify.args[0];
                analytics.assert(!identify);
                analytics.assert(!res);
                analytics.assert.equal(err, 'Internal Server Error');

                assert.equal(segment.getCachedCrossDomainId(), null);
              });

              it('should bail if some servers fail and others have no xid', function() {
                var err = null;
                var res = null;
                segment.retrieveCrossDomainId(function(error, response) {
                  err = error;
                  res = response;
                });

                server.respondWith(
                  'GET',
                  'https://xid.domain2.com/v1/id/' + segment.options.apiKey,
                  [400, { 'Content-Type': 'application/json' }, '']
                );
                server.respondWith(
                  'GET',
                  'https://userdata.example1.com/v1/id/' +
                    segment.options.apiKey,
                  [
                    200,
                    { 'Content-Type': 'application/json' },
                    '{ "id": null }'
                  ]
                );
                server.respondWith(
                  'GET',
                  'https://localhost/v1/id/' + segment.options.apiKey,
                  [
                    200,
                    { 'Content-Type': 'application/json' },
                    '{ "id": null }'
                  ]
                );
                server.respond();

                var identify = segment.onidentify.args[0];
                analytics.assert(!identify);
                analytics.assert(!res);
                analytics.assert(err === 'Bad Request');

                assert.equal(segment.getCachedCrossDomainId(), null);
              });

              it('should succeed even if one server fails', function() {
                server.respondWith(
                  'GET',
                  'https://xid.domain2.com/v1/id/' + segment.options.apiKey,
                  [500, { 'Content-Type': 'application/json' }, '']
                );
                server.respondWith(
                  'GET',
                  'https://userdata.example1.com/v1/id/' +
                    segment.options.apiKey,
                  [
                    200,
                    { 'Content-Type': 'application/json' },
                    '{ "id": "xidxid" }'
                  ]
                );
                if (segment.options.saveCrossDomainIdInLocalStorage) {
                  server.respondWith(
                    'GET',
                    'https://localhost/v1/saveId?writeKey=' +
                      segment.options.apiKey +
                      '&xid=xidxid',
                    [200, { 'Content-Type': 'text/plan' }, 'OK']
                  );
                }
                server.respondImmediately = true;

                var err = null;
                var res = null;
                segment.retrieveCrossDomainId(function(error, response) {
                  err = error;
                  res = response;
                });

                var identify = segment.onidentify.args[0];
                analytics.assert(
                  identify[0].traits().crossDomainId === 'xidxid'
                );

                analytics.assert(res.crossDomainId === 'xidxid');
                analytics.assert(res.fromDomain === 'userdata.example1.com');
                analytics.assert(!err);

                assert.equal(segment.getCachedCrossDomainId(), 'xidxid');
              });
            });
          }

          describe('isCrossDomainAnalyticsEnabled', function() {
            it('should return false when crossDomainIdServers is undefined', function() {
              segment.options.crossDomainIdServers = undefined;

              assert.equal(segment.isCrossDomainAnalyticsEnabled(), false);
            });

            it('should return false when crossDomainIdServers is empty', function() {
              segment.options.crossDomainIdServers = [];

              assert.equal(segment.isCrossDomainAnalyticsEnabled(), false);
            });

            it('should return true when crossDomainIdServers is set', function() {
              segment.options.crossDomainIdServers = [
                'userdata.example1.com',
                'xid.domain2.com',
                'localhost'
              ];

              assert.equal(segment.isCrossDomainAnalyticsEnabled(), true);
            });

            it('should return true even when crossDomainIdServers is set with 1 server', function() {
              segment.options.crossDomainIdServers = ['localhost'];

              assert.equal(segment.isCrossDomainAnalyticsEnabled(), true);
            });
          });

          describe('deleteCrossDomainId', function() {
            it('should not delete cross domain identifiers by default', function() {
              segment.cookie('seg_xid', 'test_xid');
              segment.cookie('seg_xid_ts', 'test_xid_ts');
              segment.cookie('seg_xid_fd', 'test_xid_fd');
              analytics.identify({
                crossDomainId: 'test_xid'
              });

              segment.deleteCrossDomainIdIfNeeded();

              assert.equal(segment.cookie('seg_xid'), 'test_xid');
              assert.equal(segment.cookie('seg_xid_ts'), 'test_xid_ts');
              assert.equal(segment.cookie('seg_xid_fd'), 'test_xid_fd');
              assert.equal(analytics.user().traits().crossDomainId, 'test_xid');
            });

            it('should do not delete cross domain identifiers if disabled', function() {
              segment.options.deleteCrossDomainId = false;

              segment.cookie('seg_xid', 'test_xid');
              segment.cookie('seg_xid_ts', 'test_xid_ts');
              segment.cookie('seg_xid_fd', 'test_xid_fd');
              analytics.identify({
                crossDomainId: 'test_xid'
              });

              segment.deleteCrossDomainIdIfNeeded();

              assert.equal(segment.cookie('seg_xid'), 'test_xid');
              assert.equal(segment.cookie('seg_xid_ts'), 'test_xid_ts');
              assert.equal(segment.cookie('seg_xid_fd'), 'test_xid_fd');
              assert.equal(analytics.user().traits().crossDomainId, 'test_xid');
            });

            it('should delete cross domain identifiers if enabled', function() {
              segment.options.deleteCrossDomainId = true;

              segment.cookie('seg_xid', 'test_xid');
              segment.cookie('seg_xid_ts', 'test_xid_ts');
              segment.cookie('seg_xid_fd', 'test_xid_fd');
              store('seg_xid', 'test_xid');

              analytics.identify({
                crossDomainId: 'test_xid'
              });

              segment.deleteCrossDomainIdIfNeeded();

              assert.equal(segment.cookie('seg_xid'), null);
              assert.equal(segment.cookie('seg_xid_ts'), null);
              assert.equal(segment.cookie('seg_xid_fd'), null);
              assert.equal(store('seg_xid'), null);
              assert.equal(analytics.user().traits().crossDomainId, null);
            });

            it('should delete localStorage trait even if only traits exists', function() {
              segment.options.deleteCrossDomainId = true;

              analytics.identify({
                crossDomainId: 'test_xid'
              });

              segment.deleteCrossDomainIdIfNeeded();

              assert.equal(analytics.user().traits().crossDomainId, null);
            });

            it('should delete xid cookie even if only cookie exists', function() {
              segment.options.deleteCrossDomainId = true;

              segment.cookie('seg_xid', 'test_xid');

              segment.deleteCrossDomainIdIfNeeded();

              assert.equal(segment.cookie('seg_xid'), null);
              assert.equal(segment.cookie('seg_xid_ts'), null);
              assert.equal(segment.cookie('seg_xid_fd'), null);
            });

            it('should not delete any other traits if enabled', function() {
              segment.options.deleteCrossDomainId = true;

              analytics.identify({
                crossDomainId: 'test_xid',
                name: 'Prateek',
                age: 26
              });

              segment.deleteCrossDomainIdIfNeeded();

              assert.deepEqual(analytics.user().traits(), {
                name: 'Prateek',
                age: 26
              });
            });
          });
        });
      });
    }
  });

  describe('localStorage queueing', function() {
    var xhr;

    beforeEach(function(done) {
      xhr = sinon.useFakeXMLHttpRequest();
      analytics.once('ready', done);
      segment.options.retryQueue = true;
      analytics.initialize();
    });

    afterEach(function() {
      segment._lsqueue.stop();
      xhr.restore();
    });

    it('#enqueue should add to the retry queue', function() {
      analytics.stub(segment._lsqueue, 'addItem');
      segment.enqueue('/i', { userId: '1' });
      assert(segment._lsqueue.addItem.calledOnce);
    });

    it('should send requests', function() {
      var spy = sinon.spy();
      xhr.onCreate = spy;

      segment.enqueue('/i', { userId: '1' });

      assert(spy.calledOnce);
      var req = spy.getCall(0).args[0];
      var body = JSON.parse(req.requestBody);
      assert.equal(body.userId, '1');
    });

    it('should retry on HTTP errors', function() {
      var clock = lolex.createClock(0);
      var spy = sinon.spy();

      Schedule.setClock(clock);
      xhr.onCreate = spy;

      segment.enqueue('/i', { userId: '1' });
      assert(spy.calledOnce);

      var req = spy.getCall(0).args[0];
      req.respond(500, null, 'segment machine broke');

      clock.tick(segment._lsqueue.getDelay(1));
      assert(spy.calledTwice);
    });
  });

  describe('sendJsonWithTimeout', function() {
    var protocol = location.protocol;
    var hostname = location.hostname;
    var port = location.port;
    var endpoint = '/base/data';
    var url = protocol + '//' + hostname + ':' + port + endpoint;

    var headers = { 'Content-Type': 'application/json' };

    it('should timeout', function(done) {
      this.skip(); // disabling this test for now, ticket https://segment.atlassian.net/browse/LIB-1723
      if (send.type !== 'xhr') return done();

      Segment.sendJsonWithTimeout(url, [1, 2, 3], headers, 1, function(err) {
        assert(err !== null);
        assert(err.type === 'timeout');
        done();
      });
    });

    it('should work', function(done) {
      if (send.type !== 'xhr') return done();

      Segment.sendJsonWithTimeout(url, [1, 2, 3], headers, 10 * 1000, function(
        err,
        req
      ) {
        if (err) {
          return done(new Error(err.message));
        }
        var res = JSON.parse(req.responseText);
        assert(res === true);
        done();
      });
    });

    describe('error handling', function() {
      var xhr;
      var req;

      beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        xhr.onCreate = function(_req) {
          req = _req;
        };
      });

      afterEach(function() {
        xhr.restore();
      });

      [429, 500, 503].forEach(function(code) {
        it('should throw on ' + code + ' HTTP errors', function(done) {
          if (send.type !== 'xhr') return done();

          Segment.sendJsonWithTimeout(
            url + '/null',
            [1, 2, 3],
            headers,
            10 * 1000,
            function(err) {
              assert(
                RegExp('^HTTP Error ' + code + ' (.+)$').test(err.message)
              );
              done();
            }
          );

          req.respond(code, null, 'nope');
        });
      });

      [200, 204, 300, 302, 400, 404].forEach(function(code) {
        it('should not throw on ' + code + ' HTTP errors', function(done) {
          if (send.type !== 'xhr') return done();

          Segment.sendJsonWithTimeout(
            url + '/null',
            [1, 2, 3],
            headers,
            10 * 1000,
            done
          );

          req.respond(code, null, 'ok');
        });
      });
    });
  });
});
