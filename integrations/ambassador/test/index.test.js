'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Ambassador = require('../lib/');

describe('Ambassador', function() {
  var analytics;
  var ambassador;
  var options = {
    uid: '11111111-1111-1111-1111-111111111111',
    campaigns: {
      'example.com': 1
    },
    events: {
      'Completed Order': 'conversion'
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    ambassador = new Ambassador(options);
    analytics.use(Ambassador);
    analytics.use(tester);
    analytics.add(ambassador);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    ambassador.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Ambassador, integration('Ambassador')
      .global('mbsy')
      .option('uid', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(ambassador, 'load');
    });

    describe('#initialize', function() {
      it('should create the window.mbsy object', function() {
        analytics.assert(!window.mbsy);
        analytics.initialize();
        analytics.assert(window.mbsy);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(ambassador.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(ambassador, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.mbsy, 'identify');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.mbsy.identify, 'id', {}, { identifyType: 'segment' });
      });

      it('should send traits', function() {
        analytics.identify({ email: 'test@example.com' });
        analytics.called(window.mbsy.identify, { email: 'test@example.com' }, { identifyType: 'segment' });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { identifyType: 'segment' });
      });

      it('should send traits and options', function() {
        window.mockLocation = 'http://example.com';
        analytics.identify({ email: 'test@example.com' });
        analytics.called(window.mbsy.identify, { email: 'test@example.com' }, { campaign: 1, identifyType: 'segment' });
      });

      it('should send an id and options', function() {
        window.mockLocation = 'http://example.com';
        analytics.identify('id', {});
        analytics.called(window.mbsy.identify, 'id', {}, { campaign: 1, identifyType: 'segment' });
      });

      it('should send an id, traits and options', function() {
        window.mockLocation = 'http://example.com';
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 1, identifyType: 'segment' });
      });

      it('should send call identify for all valid campaigns', function() {
        window.mockLocation = 'http://example.com';
        ambassador.options.campaigns = {
          'example.com': 1,
          'example.com/*': 2
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.calledTwice(window.mbsy.identify);
      });

      it('should send call identify without a campaign if none match the url', function() {
        window.mockLocation = 'http://example.com';
        ambassador.options.campaigns = {
          'test.com': 1,
          'test.com/*': 2
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { identifyType: 'segment' });
      });

      it('should send call identify for campaign matching test.example2.com', function() {
        window.mockLocation = 'http://test.example2.com';
        ambassador.options.campaigns = {
          'test.example2.com': 3
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 3, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching *.example3.com', function() {
        window.mockLocation = 'http://www.example3.com';
        ambassador.options.campaigns = {
          '*.example3.com': 4
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 4, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching example4.*', function() {
        window.mockLocation = 'http://example4.net';
        ambassador.options.campaigns = {
          'example4.*': 5
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 5, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching *.com', function() {
        window.mockLocation = 'http://test.com';
        ambassador.options.campaigns = {
          '*.com': 6
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 6, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching *.*', function() {
        window.mockLocation = 'http://test2.biz';
        ambassador.options.campaigns = {
          '*.*': 7
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 7, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching example5.com/*', function() {
        window.mockLocation = 'http://example5.com/test';
        ambassador.options.campaigns = {
          'example5.com/*': 8
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 8, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching example6.com/test/*', function() {
        window.mockLocation = 'http://example6.com/test/example';
        ambassador.options.campaigns = {
          'example6.com/test/*': 9
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 9, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching example7.com/*/test2', function() {
        window.mockLocation = 'http://example7.com/test/test2';
        ambassador.options.campaigns = {
          'example7.com/*/test2': 10
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 10, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching example8.com/#/', function() {
        window.mockLocation = 'http://example8.com/#/';
        ambassador.options.campaigns = {
          'example8.com/#/': 11
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 11, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching example9.com/#/*', function() {
        window.mockLocation = 'http://example9.com/#/test';
        ambassador.options.campaigns = {
          'example9.com/#/*': 12
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 12, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching example10.com/#/test/*', function() {
        window.mockLocation = 'http://example10.com/#/test/example';
        ambassador.options.campaigns = {
          'example10.com/#/test/*': 13
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 13, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching example11.com/#/*/test2', function() {
        window.mockLocation = 'http://example11.com/#/example/test2';
        ambassador.options.campaigns = {
          'example11.com/#/*/test2': 14
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 14, identifyType: 'segment' });
      });

      it('should send call identify for campaign matching *．test．com', function() {
        window.mockLocation = 'http://sub.test.com';
        ambassador.options.campaigns = {
          '*．test．com': 14
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 14, identifyType: 'segment' });
      });

      it('should return true when path of browser contains mixed case', function() {
        window.mockLocation = 'http://example6.com/TeSt/eXAMplE';
        ambassador.options.campaigns = {
          'example6.com/test/*': 9
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 9, identifyType: 'segment' });
      });

      it('should return true when path of url contains mixed case', function() {
        window.mockLocation = 'http://example6.com/test/example';
        ambassador.options.campaigns = {
          'example6.com/TeST/*': 9
        };
        analytics.identify('id', { email: 'test@example.com' });
        analytics.called(window.mbsy.identify, 'id', { email: 'test@example.com' }, { campaign: 9, identifyType: 'segment' });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.mbsy, 'track');
      });

      it('should not track if event is not mapped to a conversion', function() {
        analytics.track('Event Name');
        analytics.didNotCall(window.mbsy.track);
      });

      it('should send an event, properties and options', function() {
        window.mockLocation = 'http://example.com';
        analytics.track('Completed Order', { revenue: 1 });
        analytics.called(window.mbsy.track, 'Completed Order', { revenue: 1, campaign: 1 }, { conversion: true });
      });
    });
  });
});
