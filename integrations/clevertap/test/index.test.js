'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var CleverTap = require('../lib/');

describe('<CleverTap>', function() {
  var analytics;
  var clevertap;
  var options;

  beforeEach(function() {
    options = {
      clevertap_account_id: 'R78-7WW-KW5Z',
      region: ''
    };
    analytics = new Analytics();
    clevertap = new CleverTap(options);
    analytics.use(CleverTap);
    analytics.use(tester);
    analytics.add(clevertap);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    clevertap.reset();
    sandbox();
  });

  it('should have the correct options', function() {
    analytics.compare(
      CleverTap,
      integration('CleverTap')
        .global('clevertap')
        .option('clevertap_account_id', '')
        .option('region', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(clevertap, 'load');
    });

    describe('#initialize', function() {
      it('should create window.clevertap', function() {
        analytics.assert(!window.clevertap);
        analytics.initialize();
        analytics.assert(window.clevertap);
      });

      it('should call load', function() {
        analytics.initialize();
        analytics.called(clevertap.load);
      });

      it('should init with specified region', function() {
        var region = 'in';
        clevertap.options.region = region;
        analytics.initialize();
        analytics.assert(window.clevertap.region === region);
      });

      it('should strip periods in region', function() {
        var region = 'in.';
        clevertap.options.region = region;
        analytics.initialize();
        analytics.assert(window.clevertap.region === 'in');
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(clevertap, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    it('should set account id', function() {
      analytics.assert(
        window.clevertap.account[0].id === options.clevertap_account_id
      );
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.clevertap.profile, 'push');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.clevertap.profile.push, {
          Site: { Identity: 'id' }
        });
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.clevertap.profile.push, {
          Site: { trait: true }
        });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.clevertap.profile.push, {
          Site: { Identity: 'id', trait: true }
        });
      });

      it('should drop objects traits', function() {
        analytics.identify('id', {
          trait1: true,
          testObj: { k: 'v' },
          testArray: ['k', 'v']
        });
        analytics.called(window.clevertap.profile.push, {
          Site: { Identity: 'id', trait1: true, testArray: ['k', 'v'] }
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.clevertap.event, 'push');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.clevertap.event.push, 'event');
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.clevertap.event.push, 'event', {
          property: true
        });
      });

      it('should drop nested object/array event properties', function() {
        analytics.track('event', {
          prop: true,
          testObj: { k: 'v' },
          testArray: ['k', 'v']
        });
        analytics.called(window.clevertap.event.push, 'event', { prop: true });
      });
    });

    describe('#alias', function() {
      beforeEach(function() {
        analytics.stub(window.clevertap.profile, 'push');
      });

      it('should send an id', function() {
        analytics.alias('aliasId');
        analytics.called(window.clevertap.profile.push, {
          Site: { Identity: 'aliasId' }
        });
      });
    });

    describe('#orderCompleted', function() {
      beforeEach(function() {
        analytics.stub(window.clevertap.event, 'push');
      });

      it('should send a Charged event', function() {
        analytics.track('Order Completed', {
          order_id: '50314b8e9bcf000000000002',
          total: 30,
          revenue: 25,
          currency: 'USD',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games'
            },
            {
              product_id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'Uno Card Game',
              price: 3,
              quantity: 2,
              category: 'Games'
            }
          ]
        });

        analytics.called(window.clevertap.event.push, 'Charged', {
          total: 30,
          revenue: 25,
          currency: 'USD',
          'Charged ID': '50314b8e9bcf000000000002',
          Items: [
            {
              product_id: '507f1f77bcf86cd799439011',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games'
            },
            {
              product_id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'Uno Card Game',
              price: 3,
              quantity: 2,
              category: 'Games'
            }
          ],
          Amount: 30
        });
      });
    });
  });
});
