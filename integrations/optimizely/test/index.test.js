'use strict';

var _ = require('lodash');
var Analytics = require('@segment/analytics.js-core').constructor;
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Optimizely = require('../lib/');
var tick = require('next-tick');

/**
 * Test account: han@segment.com
 */

var mockWindowOptimizely = function() {
  window.optimizely.newMockData = {
    2347102720: {
      audiences: [
        {
          name: 'Middle Class',
          id: '7100568438'
        }
      ],
      campaignName: 'Get Rich or Die Tryin',
      id: '2347102720',
      experiment: {
        id: '7522212694',
        name: 'Wells Fargo Scam'
      },
      variation: {
        id: '7551111120',
        name: 'Variation Corruption #1884'
      },
      isInCampaignHoldback: false,
      // these are returned by real Optimizely API but will not be send to integrations
      isActive: false,
      reason: undefined,
      visitorRedirected: true
    },
    7547101713: {
      audiences: [
        {
          name: 'Trust Tree',
          id: '7527565438'
        }
      ],
      campaignName: 'URF',
      id: '7547101713',
      experiment: {
        id: '7547682694',
        name: 'Worlds Group Stage'
      },
      variation: {
        id: '7557950020',
        name: 'Variation #1'
      },
      isInCampaignHoldback: true,
      // these are returned by real Optimizely API but will not be send to integrations
      isActive: true,
      reason: undefined,
      visitorRedirected: false
    },
    2542102702: {
      audiences: [
        {
          name: 'Penthouse 6',
          id: '8888222438'
        },
        {
          name: 'Fam Yolo',
          id: '1234567890'
        }
      ],
      campaignName: 'Coding Bootcamp', // Experiments created in Optimizely X will set this the same as experiment name
      id: '7222777766', // but this will be different than experiment id
      experiment: {
        id: '1111182111',
        name: 'Coding Bootcamp'
      },
      variation: {
        id: '7333333333',
        name: 'Variation DBC'
      },
      isInCampaignHoldback: false,
      // these are returned by real Optimizely API but will not be send to integrations
      isActive: true,
      reason: undefined,
      visitorRedirected: false
    }
  };

  window.optimizely = {
    get: function() {
      return {
        getCampaignStates: function(options) {
          if (!options.isActive) {
            throw new Error('Incorrect call to getCampaignStates');
          }
          return _.filter(window.optimizely.newMockData, {isActive: options.isActive});
        },
        getRedirectInfo: function() {
          var campaigns = this.getCampaignStates({ isActive: true });
          for (var id in campaigns) {
            if (campaigns[id].visitorRedirected)
              return { referrer: 'barstools.com' };
          }
        }
      };
    }
  };
};

// passed into context.integration (not context.integrations!) for all track calls for some reason
var optimizelyContext = {
  name: 'optimizely',
  version: '2.0.0'
};

describe('Optimizely', function() {
  var analytics;
  var optimizely;
  var options = {
    listen: false,
    variations: false,
    nonInteraction: false,
    customExperimentProperties: {},
    customCampaignProperties: {}
  };

  beforeEach(function() {
    analytics = new Analytics();
    optimizely = new Optimizely(options);
    analytics.use(Optimizely);
    analytics.use(tester);
    analytics.add(optimizely);
    window.optimizely = [];
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    optimizely.reset();
    sandbox();
  });

  describe('before loading', function() {
    describe('#initialize', function() {
      beforeEach(function(done) {
        analytics.stub(optimizely, 'initWebIntegration');
        analytics.stub(window.optimizely, 'push');
        analytics.once('ready', done);
        analytics.initialize();
        analytics.page();
      });

      afterEach(function() {
        optimizely.initWebIntegration.restore();
      });

      it('should call initWebIntegration', function(done) {
        executeAsyncTest(done, function() {
          analytics.called(Optimizely.initWebIntegration);
        });
      });

      it('should flag source of integration', function() {
        analytics.called(window.optimizely.push, {
          type: 'integration',
          OAuthClientId: '5360906403'
        });
      });
    });

    describe('#initWebIntegration', function() {
      beforeEach(function() {
        analytics.stub(optimizely, 'sendWebDecisionToSegment');
        analytics.stub(optimizely, 'setEffectiveReferrer');
        mockWindowOptimizely();
      });

      afterEach(function() {
        optimizely.sendWebDecisionToSegment.restore();
        optimizely.setEffectiveReferrer.restore();
      });

      it('should not call setEffectiveReferrer for non redirect experiments', function(done) {
        // by default mock data has no redirect experiments active
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.didNotCall(optimizely.setEffectiveReferrer);
        });
      });

      it('should call setEffectiveReferrer for redirect experiments', function(done) {
        // enable redirect experiment
        window.optimizely.newMockData[2347102720].isActive = true;
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.called(optimizely.setEffectiveReferrer, 'barstools.com');
        });
      });

      it('should call sendWebDecisionToSegment for active Optimizely X campaigns', function(done) {
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.calledTwice(optimizely.sendWebDecisionToSegment);
          analytics.deepEqual(optimizely.sendWebDecisionToSegment.args[0], [
            {
              audiences: [
                {
                  name: 'Penthouse 6',
                  id: '8888222438'
                },
                {
                  name: 'Fam Yolo',
                  id: '1234567890'
                }
              ],
              campaignName: 'Coding Bootcamp',
              id: '7222777766',
              experiment: {
                id: '1111182111',
                name: 'Coding Bootcamp'
              },
              variation: {
                id: '7333333333',
                name: 'Variation DBC'
              },
              isActive: true,
              isInCampaignHoldback: false,
              reason: undefined,
              visitorRedirected: false
            }
          ]);
          analytics.deepEqual(optimizely.sendWebDecisionToSegment.args[1], [
            {
              audiences: [
                {
                  name: 'Trust Tree',
                  id: '7527565438'
                }
              ],
              campaignName: 'URF',
              id: '7547101713',
              experiment: {
                id: '7547682694',
                name: 'Worlds Group Stage'
              },
              variation: {
                id: '7557950020',
                name: 'Variation #1'
              },
              isActive: true,
              isInCampaignHoldback: true,
              reason: undefined,
              visitorRedirected: false
            }
          ]);
        });
      });
    });
  });

  describe('#setEffectiveReferrer', function() {
    describe('Web', function() {
      beforeEach(function() {
        mockWindowOptimizely();
        // Make sure window.optimizely.getRedirectInfo returns something
        window.optimizely.newMockData[2347102720].isActive = true;
        analytics.initialize();
      });

      it('should set a global variable `window.optimizelyEffectiveReferrer`', function(done) {
        executeAsyncTest(done, function() {
          analytics.equal(window.optimizelyEffectiveReferrer, 'barstools.com');
        });
      });
    });
  });

  describe('#sendWebDecisionToSegment', function() {
    beforeEach(function() {
      mockWindowOptimizely();
    });

    describe('#options.variations', function() {
      beforeEach(function(done) {
        optimizely.options.variations = true;
        analytics.stub(analytics, 'identify');
        analytics.initialize();
        tick(done);
      });

      it('should send active campaign via `.identify()`', function() {
        // Since we have two experiments in `window.optimizely.data.state.activeExperiments`
        // This test proves the breaking changes for the option (it used to send both experiment data in one
        // `.identify()` call)
        analytics.calledTwice(analytics.identify);
        analytics.deepEqual(analytics.identify.args[0], [
          {
            'Experiment: Coding Bootcamp': 'Variation DBC'
          }
        ]);
        analytics.deepEqual(analytics.identify.args[1], [
          {
            'Experiment: Worlds Group Stage': 'Variation #1'
          }
        ]);
      });
    });

    describe('#options.sendRevenueOnlyForOrderCompleted', function() {
      beforeEach(function() {
        analytics.stub(window.optimizely, 'push');
      });

      it('should not include revenue on a non Order Completed event if `onlySendRevenueOnOrderCompleted` is enabled', function() {
        analytics.initialize();
        analytics.track('Order Updated', {
          revenue: 25
        });
        analytics.called(window.optimizely.push, {
          type: 'event',
          eventName: 'Order Updated',
          tags: {}
        });
      });

      it('should send revenue only on Order Completed if `onlySendRevenueOnOrderCompleted` is enabled', function() {
        optimizely.options.sendRevenueOnlyForOrderCompleted = true;
        analytics.initialize();
        analytics.track('Order Completed', {
          revenue: 9.99
        });
        analytics.called(window.optimizely.push, {
          type: 'event',
          eventName: 'Order Completed',
          tags: {
            revenue: 999
          }
        });
      });

      it('should send revenue on all events with properties.revenue if `onlySendRevenueOnOrderCompleted` is disabled', function() {
        optimizely.options.sendRevenueOnlyForOrderCompleted = false;
        analytics.initialize();
        analytics.track('Checkout Started', {
          revenue: 9.99
        });
        analytics.called(window.optimizely.push, {
          type: 'event',
          eventName: 'Checkout Started',
          tags: {
            revenue: 999
          }
        });
      });
    });

    describe('#options.listen', function() {
      beforeEach(function() {
        optimizely.options.listen = true;
        analytics.stub(analytics, 'track');
      });

      it('should send standard active campaign data via `.track()`', function(done) {
        // Mock data by default has two active campaign/experiments.
        // Going to leave just the one that was created as a standard
        // experiment inside Optimizely X (not campaign)
        window.optimizely.newMockData[7547101713].isActive = false;
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              campaignName: 'Coding Bootcamp',
              campaignId: '7222777766',
              experimentId: '1111182111',
              experimentName: 'Coding Bootcamp',
              variationId: '7333333333',
              variationName: 'Variation DBC',
              audienceId: '1234567890,8888222438',
              audienceName: 'Fam Yolo, Penthouse 6',
              isInCampaignHoldback: false
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should send personalized campaign data via `.track()`', function(done) {
        // Mock data by default has two active campaign/experiments.
        // Going to leave just the personalized campaign
        window.optimizely.newMockData[2542102702].isActive = false;
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              campaignName: 'URF',
              campaignId: '7547101713',
              experimentId: '7547682694',
              experimentName: 'Worlds Group Stage',
              variationId: '7557950020',
              variationName: 'Variation #1',
              audienceId: '7527565438',
              audienceName: 'Trust Tree',
              isInCampaignHoldback: true
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should map custom properties and send campaign data via `.track()`', function(done) {
        optimizely.options.customCampaignProperties = {
          campaignName: 'campaign_name',
          campaignId: 'campaign_id',
          experimentId: 'experiment_id',
          experimentName: 'experiment_name'
        };

        window.optimizely.newMockData.experiment_id = '124';
        window.optimizely.newMockData.experiment_name =
          'custom experiment name';
        window.optimizely.newMockData.campaign_id = '421';
        window.optimizely.newMockData.campaign_name = 'custom campaign name';

        window.optimizely.newMockData[2542102702].isActive = false;
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              campaignName: 'custom campaign name',
              campaignId: '421',
              experimentId: '124',
              experimentName: 'custom experiment name',
              variationId: '7557950020',
              variationName: 'Variation #1',
              audienceId: '7527565438',
              audienceName: 'Trust Tree',
              isInCampaignHoldback: true
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should not map existing properties if custom properties not specified`', function(done) {
        optimizely.options.customCampaignProperties = {
          campaignName: 'campaign_name',
          campaignId: 'campaign_id'
        };

        window.optimizely.newMockData.experiment_id = '124';
        window.optimizely.newMockData.experiment_name =
          'custom experiment name';
        window.optimizely.newMockData.campaign_id = '421';
        window.optimizely.newMockData.campaign_name = 'custom campaign name';

        window.optimizely.newMockData[2542102702].isActive = false;
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              campaignName: 'custom campaign name',
              campaignId: '421',
              experimentId: '7547682694',
              experimentName: 'Worlds Group Stage',
              variationId: '7557950020',
              variationName: 'Variation #1',
              audienceId: '7527565438',
              audienceName: 'Trust Tree',
              isInCampaignHoldback: true
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should send redirect experiment data via `.track()`', function(done) {
        // Enable just the campaign with redirect variation
        window.optimizely.newMockData[2347102720].isActive = true;
        window.optimizely.newMockData[7547101713].isActive = false;
        window.optimizely.newMockData[2542102702].isActive = false;
        var context = {
          integration: optimizelyContext,
          page: { referrer: 'barstools.com' }
        };
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              campaignName: 'Get Rich or Die Tryin',
              campaignId: '2347102720',
              experimentId: '7522212694',
              experimentName: 'Wells Fargo Scam',
              variationId: '7551111120',
              variationName: 'Variation Corruption #1884',
              audienceId: '7100568438',
              audienceName: 'Middle Class',
              referrer: 'barstools.com',
              isInCampaignHoldback: false
            },
            context
          ]);
        });
      });

      it("should send Google's nonInteraction flag via `.track()`", function(done) {
        // Mock data has two active campaigns running
        // For convenience, we'll disable one of them
        window.optimizely.newMockData[2542102702] = false;
        optimizely.options.nonInteraction = true;
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              campaignName: 'URF',
              campaignId: '7547101713',
              experimentId: '7547682694',
              experimentName: 'Worlds Group Stage',
              variationId: '7557950020',
              variationName: 'Variation #1',
              audienceId: '7527565438',
              audienceName: 'Trust Tree',
              nonInteraction: 1,
              isInCampaignHoldback: true
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should not send inactive experiments', function(done) {
        // deactivate all experiments
        window.optimizely.newMockData[2347102720].isActive = false;
        window.optimizely.newMockData[7547101713].isActive = false;
        window.optimizely.newMockData[2542102702].isActive = false;
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.didNotCall(analytics.track);
        });
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#track', function() {
      context('when the Optimizely Web snippet has initialized', function() {
        beforeEach(function() {
          mockWindowOptimizely();
          analytics.stub(window.optimizely, 'push');
        });

        it('should send an event', function() {
          analytics.track('event');
          analytics.called(window.optimizely.push, {
            type: 'event',
            eventName: 'event',
            tags: {}
          });
        });

        it('should replace colons with underscore in eventName', function() {
          analytics.track('event:foo:bar');
          analytics.called(window.optimizely.push, {
            type: 'event',
            eventName: 'event_foo_bar',
            tags: {}
          });
        });

        it('should send all additional properties along as tags', function() {
          analytics.track('event', { id: 'c00lHa$h', name: 'jerry' });
          analytics.called(window.optimizely.push, {
            type: 'event',
            eventName: 'event',
            tags: { id: 'c00lHa$h', name: 'jerry' }
          });
        });

        it('should change revenue to cents and include in tags', function() {
          analytics.track('Order Completed', { revenue: 9.99 });
          analytics.called(window.optimizely.push, {
            type: 'event',
            eventName: 'Order Completed',
            tags: { revenue: 999 }
          });
        });

        it('should round the revenue value to an integer value if passed in as a floating point number', function() {
          analytics.track('Order Completed', { revenue: 534.3099999999999 });
          analytics.called(window.optimizely.push, {
            type: 'event',
            eventName: 'Order Completed',
            tags: { revenue: 53431 }
          });
        });
      });

      context('when the Optimizely Full Stack JavaScript SDK has initialized', function() {
        beforeEach(function() {
          window.optimizelyClientInstance = {};
          analytics.stub(window.optimizelyClientInstance, 'track');
        });

        afterEach(function() {
          window.optimizelyClientInstance.track.restore();
        });

        it('should send an event through the Optimizely X Full Stack JS SDK using the logged in user', function() {
          analytics.identify('user1');
          analytics.track('event', { purchasePrice: 9.99, property: 'foo' });
          analytics.called(
            window.optimizelyClientInstance.track,
            'event',
            'user1',
            {},
            { purchasePrice: 9.99, property: 'foo' }
          );
        });

        it('should replace colons with underscores for event names', function() {
          analytics.identify('user1');
          analytics.track('foo:bar:baz');
          analytics.called(
            window.optimizelyClientInstance.track,
            'foo_bar_baz',
            'user1',
            {},
            {}
          );
        });

        it('should send an event through the Optimizely X Fullstack JS SDK using the user provider user id', function() {
          analytics.track(
            'event',
            { purchasePrice: 9.99, property: 'foo' },
            { Optimizely: { userId: 'user1', attributes: { country: 'usa' } } }
          );
          analytics.called(
            window.optimizelyClientInstance.track,
            'event',
            'user1',
            { country: 'usa' },
            { property: 'foo', purchasePrice: 9.99 }
          );
        });

        it('should send revenue on `Order Completed` through the Optimizely X Fullstack JS SDK and `properites.revenue` is passed', function() {
          analytics.track(
            'Order Completed',
            { purchasePrice: 9.99, property: 'foo', revenue: 1.99 },
            { Optimizely: { userId: 'user1', attributes: { country: 'usa' } } }
          );
          analytics.called(
            window.optimizelyClientInstance.track,
            'Order Completed',
            'user1',
            { country: 'usa' },
            { property: 'foo', purchasePrice: 9.99, revenue: 199 }
          );
        });

        it('should not default to sending revenue through the Optimizely X Fullstack JS SDK on non `Order Completed` events and `properites.revenue` is passed', function() {
          analytics.track(
            'event',
            { purchasePrice: 9.99, property: 'foo', revenue: 1.99 },
            { Optimizely: { userId: 'user1', attributes: { country: 'usa' } } }
          );
          analytics.called(
            window.optimizelyClientInstance.track,
            'event',
            'user1',
            { country: 'usa' },
            { property: 'foo', purchasePrice: 9.99 }
          );
        });

        it('should send revenue through the Optimizely X Fullstack JS SDK on all events if `sendRevenueOnlyForOrderCompleted` is disabled and `properites.revenue` is passed', function() {
          optimizely.options.sendRevenueOnlyForOrderCompleted = false;
          analytics.track(
            'event',
            { purchasePrice: 9.99, property: 'foo', revenue: 1.99 },
            { Optimizely: { userId: 'user1', attributes: { country: 'usa' } } }
          );
          analytics.called(
            window.optimizelyClientInstance.track,
            'event',
            'user1',
            { country: 'usa' },
            { property: 'foo', purchasePrice: 9.99, revenue: 199 }
          );
        });
      });
    });

    describe('#page', function() {
      context('when the Optimizely Web snippet has initialized', function() {
        beforeEach(function() {
          mockWindowOptimizely();
          analytics.stub(window.optimizely, 'push');
        });

        it('should send an event for a named page', function() {
          var referrer = window.document.referrer;
          analytics.page('Home');
          analytics.called(window.optimizely.push, {
            type: 'event',
            eventName: 'Viewed Home Page',
            tags: {
              name: 'Home',
              path: '/context.html',
              referrer: referrer,
              search: '',
              title: '',
              url: 'http://localhost:9876/context.html'
            }
          });
        });

        it('should send an event for a named and categorized page', function() {
          var referrer = window.document.referrer;
          analytics.page('Blog', 'New Integration');
          analytics.called(window.optimizely.push, {
            type: 'event',
            eventName: 'Viewed Blog New Integration Page',
            tags: {
              name: 'New Integration',
              category: 'Blog',
              path: '/context.html',
              referrer: referrer,
              search: '',
              title: '',
              url: 'http://localhost:9876/context.html'
            }
          });
        });
      });
    });
  });
});

/*
 * execute AsyncTest
 *
 * Prevent tests from hanging if deepEqual fails inside `tick`
 * @api private
 * @param {Function} done cb
 * @param {Function} function that runs test
 */
function executeAsyncTest(done, test) {
  tick(function() {
    try {
      test();
      done();
    } catch (e) {
      done(e);
    }
  });
}
