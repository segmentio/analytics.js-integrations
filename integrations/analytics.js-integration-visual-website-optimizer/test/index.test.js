'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var tick = require('next-tick');
var VWO = require('../lib/');

describe('Visual Website Optimizer', function() {
  var analytics;
  var vwo;
  var options = { listen: false };

  beforeEach(function() {
    analytics = new Analytics();
    vwo = new VWO(options);
    analytics.use(VWO);
    analytics.use(tester);
    analytics.add(vwo);

    // set up fake VWO data to simulate the replay
    window._vwo_exp_ids = [1];
    window._vwo_exp = { 1: { comb_n: { 1: 'Variation' }, combination_chosen: 1, ready: true } };
    window._vis_opt_queue = [];
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    vwo.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(VWO, integration('Visual Website Optimizer')
      .option('replay', true));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(vwo, 'load');
      analytics.stub(vwo, 'replay');
      analytics.stub(vwo, 'roots');
    });

    describe('#initialize defaults', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
        analytics.page();
      });

      it('should call #replay by default', function(done) {
        tick(function() {
          analytics.called(vwo.replay);
          done();
        });
      });

      it('should not call #roots by default', function(done) {
        tick(function() {
          analytics.didNotCall(vwo.roots);
          done();
        });
      });
    });

    describe('#initialize on settings change', function() {
      it('should not call #replay if replay is disabled', function(done) {
        vwo.options.replay = false;
        analytics.initialize();
        analytics.page();
        analytics.on('ready', tick(function() {
          analytics.didNotCall(vwo.replay);
          done();
        })
         );
      });

      it('should call #roots if listen is enabled', function(done) {
        vwo.options.listen = true;
        analytics.initialize();
        analytics.page();
        analytics.on('ready', tick(function() {
          analytics.called(vwo.roots);
          done();
        })
        );
      });
    });
  });

  describe('#replay', function() {
    beforeEach(function() {
      analytics.stub(analytics, 'identify');
    });

    it('should replay experiments', function(done) {
      vwo.options.listen = true;
      analytics.initialize();
      analytics.page();

      tick(function() {
        window._vis_opt_queue[0]();
        analytics.called(analytics.identify, { 'Experiment: 1': 'Variation' });
        done();
      });
    });
  });

  describe('#roots', function() {
    beforeEach(function() {
      analytics.stub(analytics, 'track');
    });

    it('should send active experiments if experiment is ready', function(done) {
      vwo.options.listen = true;
      analytics.initialize();
      analytics.page();

      tick(function() {
        window._vis_opt_queue[1]();

        analytics.called(analytics.track, 'Experiment Viewed', {
          experimentId: '1',
          variationName: 'Variation' },
          { context: { integration: { name: 'visual-website-optimizer', version: '1.0.0' } }
        });
        done();
      });
    });

    it('should not send active experiments if experiment is not ready', function(done) {
      vwo.options.listen = true;
      window._vwo_exp[1].ready = false;
      analytics.initialize();
      analytics.page();

      tick(function() {
        window._vis_opt_queue[1]();

        analytics.didNotCall(analytics.track, 'Experiment Viewed', {
          experimentId: '1',
          variationName: 'Variation' },
          { context: { integration: { name: 'visual-website-optimizer', version: '1.0.0' } }
        });
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

    describe('#orderCompleted', function() {
      beforeEach(function() {
        analytics.stub(window._vis_opt_queue, 'push');
        analytics.stub(window, '_vis_opt_revenue_conversion');
      });

      it('should track order completed', function() {
        analytics.track('order completed', {
          orderId: '12074d48',
          tax: 16,
          total: 166,
          products: [{
            sku: '40bcda73',
            name: 'my-product',
            price: 75,
            quantity: 1
          }, {
            sku: '64346fc6',
            name: 'other-product',
            price: 75,
            quantity: 1
          }]
        });

        window._vis_opt_queue.push.args[0][0]();
        analytics.assert.equal(window._vis_opt_revenue_conversion.args[0][0], 166);
      });
    });
  });
});
