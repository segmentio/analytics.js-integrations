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
    analytics.compare(Smartlook, integration('Smartlook').option('token', ''));
  });

  describe('before loading', function() {
    describe('#initialize', function() {
      it('should create window.smartlook with populated api array', function() {
        analytics.assert(!window.smartlook);
        analytics.initialize();
        analytics.assert(window.smartlook);
        analytics.assert(window.smartlook.api);
        analytics.assert(window.smartlook.api.length === 1);

        analytics.assert(smartlook.loaded());
      });

      it('should have correct token and default region', function() {
        const token = 'secretToken';

        smartlook.options.token = token;
        analytics.initialize();

        const apiArrayObj = window.smartlook.api[0];
        analytics.assert(apiArrayObj[0] === 'init');
        analytics.assert(apiArrayObj[1] === token);
        analytics.assert(apiArrayObj[2].region);
        analytics.assert(apiArrayObj[2].region === 'eu');
      });

      it('should have correct token and eu region', function() {
        const tokenPart = 'secretTokenWithRegion';
        const regionPart = 'eu';

        smartlook.options.token = `${tokenPart};${regionPart}`;
        analytics.initialize();

        const apiArrayObj = window.smartlook.api[0];
        analytics.assert(apiArrayObj[0] === 'init');
        analytics.assert(apiArrayObj[1] === tokenPart);
        analytics.assert(apiArrayObj[2].region);
        analytics.assert(apiArrayObj[2].region === regionPart);
      });

      it('should have correct token and us region', function() {
        const tokenPart = 'secretTokenWithRegion';
        const regionPart = 'us';

        smartlook.options.token = `${tokenPart};${regionPart}`;
        analytics.initialize();

        const apiArrayObj = window.smartlook.api[0];
        analytics.assert(apiArrayObj[0] === 'init');
        analytics.assert(apiArrayObj[1] === tokenPart);
        analytics.assert(apiArrayObj[2].region);
        analytics.assert(apiArrayObj[2].region === regionPart);
      });

      it('should have correct token and eu region after inserted invalid one', function() {
        const tokenPart = 'secretTokenWithRegion';
        const regionPart = 'notvalid';

        smartlook.options.token = `${tokenPart};${regionPart}`;
        analytics.initialize();

        const apiArrayObj = window.smartlook.api[0];
        analytics.assert(apiArrayObj[0] === 'init');
        analytics.assert(apiArrayObj[1] === tokenPart);
        analytics.assert(apiArrayObj[2].region);
        analytics.assert(apiArrayObj[2].region === 'eu');
      });

      it('should load correct script', function() {
        analytics.spy(smartlook, 'load');

        analytics.initialize();
        analytics.loaded(
          '<script src="https://web-sdk.smartlook.com/recorder.js">'
        );
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
        analytics.called(
          window.smartlook,
          'identify',
          analytics.user().anonymousId(),
          {}
        );
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
        analytics.track('eventName', {
          test1: 'test2',
          test2: true,
          test3: 123
        });
        analytics.called(window.smartlook, 'track', 'eventName', {
          test1: 'test2',
          test2: true,
          test3: 123
        });
      });

      it('should send track event without properties', function() {
        analytics.track('eventName');
        analytics.called(window.smartlook, 'track', 'eventName');
      });
    });
  });
});
