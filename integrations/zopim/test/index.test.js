'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var Zopim = require('../lib/');
var sandbox = require('@segment/clear-env');

describe('Zopim', function() {
  var analytics;
  var options;
  var zopim;

  beforeEach(function() {
    options = {
      zopimId: '2oA6WC5DSCdcyxVBS1mz75EJBU9cKLXU',
      listen: true
    };

    analytics = new Analytics();
    zopim = new Zopim(options);
    analytics.use(Zopim);
    analytics.use(tester);
    analytics.add(zopim);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    zopim.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(
      Zopim,
      integration('Zopim')
        .global('$zopim')
        .option('zopimId', '')
        .readyOnLoad()
    );
  });

  describe('#initialize', function() {
    beforeEach(function() {
      analytics.stub(zopim, 'load');
    });

    it('should call #load', function() {
      analytics.didNotCall(zopim.load);
      zopim.initialize();
      analytics.calledOnce(zopim.load);
    });
  });

  describe('#loaded', function() {
    it('should return `false` when Zopim is not loaded', function() {
      analytics.assert(typeof window.$zopim === 'undefined');
      analytics.assert(zopim.loaded() === false);
    });

    it('should return `true` when Zopim is loaded', function() {
      window.$zopim = undefined;
      analytics.assert(zopim.loaded() === false);

      window.$zopim = function() {};
      analytics.assert(zopim.loaded() === false);

      window.$zopim = function() {};
      window.$zopim.livechat = {};
      analytics.assert(zopim.loaded() === true);
    });
  });

  xdescribe('before loading', function() {
    beforeEach(function() {
      analytics.stub(zopim, 'load');
    });
  });

  describe('after loading', function() {
    describe('#load', function(done) {
      beforeEach(function() {
        analytics.stub(zopim, 'load');
      });

      it('should initialize `window.$zopim`', function() {
        analytics.assert(typeof window.$zopim === 'undefined');

        zopim.load(function() {
          analytics.assert(typeof window.$zopim !== 'undefined');
          done();
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        window.$zopim = {};
        window.$zopim.livechat = { set: function() {} };
        analytics.spy(window.$zopim.livechat, 'set');
        analytics.initialize();
      });

      it('should set user properties', function() {
        var attrs = {
          name: 'Bob Loblaw',
          email: 'bob.loblaw@test.com',
          phone: '555-555-5555'
        };
        analytics.identify('user-id', attrs);
        analytics.called(window.$zopim.livechat.set, {
          name: 'Bob Loblaw',
          email: 'bob.loblaw@test.com',
          phone: '555-555-5555'
        });
      });

      it('should fall back on `firstName` if `lastName` or `name` are not specified', function() {
        var attrs = {
          firstName: 'Bob',
          email: 'bob.loblaw@test.com'
        };
        analytics.identify('user-id', attrs);
        analytics.called(window.$zopim.livechat.set, {
          name: 'Bob',
          email: 'bob.loblaw@test.com'
        });
      });
    });

    // https://api.zopim.com/files/meshim/widget/controllers/LiveChatAPI-js.html#say
    describe('#listen', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
        analytics.stub(analytics, 'track');
      });

      it('should send a chat started event', function(done) {
        window.$zopim.livechat.say('bananas');
        setTimeout(function() {
          analytics.called(
            analytics.track,
            'Live Chat Conversation Started',
            {},
            { context: { integration: { name: 'zopim', version: '1.0.0' } } }
          );
          done();
        }, 3000);
      });

      it('should send a chat ended event', function(done) {
        window.$zopim.livechat.say('bananas');
        setTimeout(function() {
          window.$zopim.livechat.endChat();
          done();
        }, 2000);
        setTimeout(function() {
          analytics.called(
            analytics.track,
            'Live Chat Conversation Ended',
            {},
            { context: { integration: { name: 'zopim', version: '1.0.0' } } }
          );
          done();
        }, 4000);
      });
    });
  });
});
