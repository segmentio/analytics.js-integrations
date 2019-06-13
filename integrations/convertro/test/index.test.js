'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Convertro = require('../lib/');

describe('Convertro', function() {
  var analytics;
  var convertro;
  var options = {
    account: 'baublebar',
    events: {
      tomap: 'mapped',
      'oder completed': 'oder completed'
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    convertro = new Convertro(options);
    analytics.use(Convertro);
    analytics.use(tester);
    analytics.add(convertro);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    convertro.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(Convertro, integration('Convertro')
      .global('$CVO')
      .global('__cvo')
      .mapping('events')
      .option('account', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(convertro, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(convertro.load);
      });
    });

    describe('#loaded', function() {
      it('should return `true` if window.$CVO.trackEvent', function() {
        analytics.assert(!convertro.loaded());
        window.$CVO = {};
        analytics.assert(!convertro.loaded());
        window.$CVO.trackEvent = function() {};
        analytics.assert(convertro.loaded());
      });
    });
  });

  describe.skip('loading', function() {
    it('should load', function(done) {
      analytics.load(convertro, done);
    });
  });

  describe.skip('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.$CVO, 'push');
      });

      it('should send the user id as `id`', function() {
        analytics.identify('id');
        analytics.called(window.$CVO.push, ['trackUser', { id: 'id' }]);
      });

      it('should send the traits', function() {
        analytics.identify('id', { email: 'baz@email.com' });
        analytics.called(window.$CVO.push, ['trackUser', {
          email: 'baz@email.com',
          id: 'id'
        }]);
      });

      it('should not send if userId is omitted', function() {
        analytics.identify(null, { email: 'baz@baz.com' });
        analytics.didNotCall(window.$CVO.push);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.$CVO, 'push');
      });

      it('should not send event if not mapped', function() {
        analytics.track('event');
        analytics.didNotCall(window.$CVO.push);
      });

      it('should send event if mapped', function() {
        analytics.track('tomap');

        analytics.calledOnce(window.$CVO.push);

        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: undefined,
          type: 'mapped',
          id: undefined
        }]);
      });

      it('should send revenue', function() {
        analytics.track('order completed', { total: 50.99 });

        analytics.calledOnce(window.$CVO.push);

        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: 50.99,
          type: 'sale',
          id: undefined
        }]);
      });

      it('should send orderId', function() {
        analytics.track('order completed', { total: 50.99, orderId: 'asdfasdf' });

        analytics.calledOnce(window.$CVO.push);

        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: 50.99,
          type: 'sale',
          id: 'asdfasdf'
        }]);
      });

      it('should send `sale` when .repeat=null', function() {
        analytics.track('order completed', { total: 50.99, orderId: '1' });

        analytics.calledOnce(window.$CVO.push);

        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: 50.99,
          type: 'sale',
          id: '1'
        }]);
      });

      it('should only send `sale.repeat` when `.repeat=true` and `hybridAttributionModel=false`', function() {
        analytics.track('order completed', { total: 50.99, orderId: '1', repeat: true });

        analytics.calledOnce(window.$CVO.push);

        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: 50.99,
          type: 'sale.repeat',
          id: '1'
        }]);
      });

      it('should only send `sale.new` when `.repeat=false` and `hybridAttributionModel=false`', function() {
        analytics.track('order completed', { total: 50.99, orderId: '1', repeat: false });

        analytics.calledOnce(window.$CVO.push);

        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: 50.99,
          type: 'sale.new',
          id: '1'
        }]);
      });

      it('should send `sale` and `sale.new` when `.repeat=false` and `hybridAttributionModel=true`', function() {
        convertro.options.hybridAttributionModel = true;
        analytics.track('order completed', { total: 50.99, orderId: '1', repeat: false });

        analytics.calledTwice(window.$CVO.push);

        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: 50.99,
          type: 'sale',
          id: '1'
        }]);

        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: 50.99,
          type: 'sale.new',
          id: '1'
        }]);
      });

      it('should send `sale` and `sale.repeat` when `.repeat=true` and `hybridAttributionModel=true`', function() {
        convertro.options.hybridAttributionModel = true;
        analytics.track('order completed', { total: 50.99, orderId: '1', repeat: true });

        analytics.calledTwice(window.$CVO.push);

        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: 50.99,
          type: 'sale',
          id: '1'
        }]);

        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: 50.99,
          type: 'sale.repeat',
          id: '1'
        }]);
      });

      it('should support array events', function() {
        convertro.options.events = [{ key: 'event', value: 'event-value' }];
        analytics.track('event', { total: 99.99, orderId: 'x' });
        analytics.called(window.$CVO.push, ['trackEvent', {
          amount: 99.99,
          type: 'event-value',
          id: 'x'
        }]);
      });
    });
  });
});
