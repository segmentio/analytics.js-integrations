'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Smartlook = require('../lib/');

describe('Smartlook', function() {
  var analytics;
  var smartlook;
  var options = {
    token: 'abc'
  };

  beforeEach(function() {
    analytics = new Analytics();
    smartlook = new Smartlook(options);
    analytics.use(Smartlook);
    analytics.use(tester);
    analytics.add(smartlook);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    smartlook.reset();
    sandbox();

    // Remove stub on window object
    delete window.smartlook;
  });

  it('should have the right settings', function() {
    analytics.compare(Smartlook, integration('Smartlook')
      .option('token', ''));
  });

  describe('before loading', function() {
    describe('#initialize', function() {
      it('should create window.smartlook', function() {
        analytics.assert(!window.smartlook);
        analytics.initialize();
        analytics.assert(window.smartlook);
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('identify', function() {
      beforeEach(function() {
        analytics.stub(window, 'smartlook');
      });

      it('should default to anonymousId', function() {
        analytics.identify();
        analytics.called(window.smartlook, 'identify', analytics.user().anonymousId(), {});
      });

      it('should set number id', function() {
        analytics.identify(42);
        analytics.called(window.smartlook, 'identify', 42, {});
      });

      it('should save custom props', function() {
        analytics.identify('id', {
          name: 'John Doe',
          email: 'example@domain.com',
          'foo bar': 'foo',
          barbar: 'barbar',
          test_var1: 'val',
          test_var2: 42,
          test_var3: true,
          value: 150,
          currency: 'usd',
          product: 'Product Description'
        });
        analytics.called(window.smartlook, 'identify', 'id', {
          name: 'John Doe',
          email: 'example@domain.com',
          'foo bar': 'foo',
          barbar: 'barbar',
          test_var1: 'val',
          test_var2: 42,
          test_var3: true,
          value: 150,
          currency: 'usd',
          product: 'Product Description'
        });
      });
    });

    
    describe('track', function() {
      beforeEach(function() {
        analytics.stub(window, 'smartlook');
      });

      it('should send track event with properties', function() {
        analytics.track('eventName', { test1: 'test2', test2: true, test3: 123 });
        analytics.called(window.smartlook, 'track', 'eventName', { test1: 'test2', test2: true, test3: 123 });
      });

      it('should send track event without properties', function() {
        analytics.track('eventName');
        analytics.called(window.smartlook, 'track', 'eventName');
      });
    });
  });
});