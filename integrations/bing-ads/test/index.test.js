'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Bing = require('../lib/');

describe('Bing Ads', function() {
  var analytics;
  var bing;
  var options = {
    tagId: '4002754',
    enableConsent: true,
    adStoragePropertyMapping: '',
    adStorage: 'denied',
    consentSettings: {
      categories: []
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    bing = new Bing(options);
    analytics.use(Bing);
    analytics.use(tester);
    analytics.add(bing);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    bing.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(
      Bing,
      integration('Bing Ads')
        .global('UET')
        .global('uetq')
        .option('tagId', '')
    );
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(bing, done);
    });
  });

  describe('#initialize', function() {
    beforeEach(function() {
      window.uetq = [];
      window.UET = function(setup) {
        this.ti = setup.ti;
        this.q = setup.q;
      };
      analytics.stub(bing, 'load', function(callback) {
        callback();
      });
      analytics.spy(window.uetq, 'push');
    });

    afterEach(function() {
      // Clean up after each test
      delete window.uetq;
    });

    it('should initialize uetq as an empty array if not already defined', function() {
      delete window.uetq;
      bing.options.enableConsent = false;

      bing.initialize();

      analytics.assert(Array.isArray(window.uetq.q));
      analytics.assert.deepEqual(window.uetq.q, []);
    });

    it('should push default consent if enableConsent is true', function() {
      bing.options.enableConsent = true;
      bing.initialize();
      analytics.spy(window.uetq, 'push');
      analytics.called(window.uetq.q.push, 'consent', 'default', {
        ad_storage: 'denied'
      });
    });

    it('should not push default consent if enableConsent is false', function() {
      bing.options.enableConsent = false;
      bing.initialize();
      analytics.spy(window.uetq, 'push');
      analytics.didNotCall(window.uetq.push, 'consent', 'default');
    });

    it('should call load and set up UET after loading', function() {
      bing.initialize();
      analytics.called(bing.load);
      analytics.assert(window.uetq instanceof window.UET);
      analytics.assert.equal(window.uetq.ti, bing.options.tagId);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.uetq, 'push');
      });

      it('should track pageviews', function() {
        analytics.page();
        analytics.called(window.uetq.push, 'pageLoad');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.uetq, 'push');
      });

      it('should send correctly', function() {
        analytics.track('play', { category: 'fun', revenue: 90 });
        analytics.called(window.uetq.push, {
          ea: 'track',
          el: 'play',
          ec: 'fun',
          gv: 90
        });
      });

      it('should not call updateConsent when enable_consent is false', function() {
        bing.options.enableConsent = false;
        analytics.spy(bing, 'updateConsent');
        analytics.track('play', { category: 'fun', revenue: 90 });
        analytics.didNotCall(bing.updateConsent);
      });

      it('should not update consent if ad_storagePropertyMapping is missing', function() {
        bing.options.enableConsent = true;
        bing.options.adStoragePropertyMapping = '';
        analytics.stub(window.uetq, 'push');
        analytics.track('purchase', { properties: { ad_storage: 'granted' } });
        analytics.didNotCall(window.uetq.push, 'consent', 'update');
      });

      it('should update consent if adStoragePropertyMapping has value', function() {
        bing.options.enableConsent = true;
        bing.options.adStoragePropertyMapping = 'ad_storage';
        analytics.stub(window.uetq, 'push');
        analytics.track('purchase', { ad_storage: 'granted' });
        analytics.called(window.uetq.push, 'consent', 'update', {
          ad_storage: 'granted'
        });
      });

      it('should update consent based on consentSettings categories', function() {
        bing.options.enable_consent = true;
        bing.options.consentSettings.categories = ['analytics', 'ads'];
        bing.options.adStorageConsentCategory = 'ads';
        analytics.stub(window.uetq, 'push');
        analytics.track('purchase');
        analytics.called(window.uetq.push, 'consent', 'update', {
          ad_storage: 'granted'
        });
      });

      it('should not update consent if consentSettings categories do not match', function() {
        bing.options.enable_consent = true;
        bing.options.consentSettings.categories = ['analytics'];
        bing.options.adStorageConsentCategory = 'ads';
        analytics.stub(window.uetq, 'push');
        analytics.track('purchase');
        analytics.didNotCall(window.uetq.push, 'consent', 'update');
      });
    });
  });
});
