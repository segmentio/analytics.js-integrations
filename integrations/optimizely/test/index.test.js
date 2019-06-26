'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Optimizely = require('../lib/');
var tick = require('next-tick');

/**
 * Test account: han@segment.com
 *
 * Docs for Optimizely data object: https://developers.optimizely.com/javascript/personalization/index.html#reading-data-and-state
 */

var mockOptimizelyClassicDataObject = function() {
  // Classic
  window.optimizely.data = {
    experiments: {
      0: { name: 'Test' },
      1: { name: 'MultiVariate Test' },
      2: { name: 'Inactive Test' },
      11: { name: 'Redirect Test' }
    },
    variations: {
      22: { name: 'Redirect Variation', code: '' },
      123: { name: 'Variation #123', code: '' },
      789: { name: 'Var 789', code: '' },
      44: { name: 'Var 44', code: '' }
    },
    sections: undefined, // we'll set this during multivariate test since that's when this is set by Optimizely's API
    state: {
      activeExperiments: ['0', '11'],
      variationNamesMap: {
        0: 'Variation #123',
        1: 'Variation #123, Redirect Variation, Var 789', // this is the data format
        2: 'Inactive Variation',
        11: 'Redirect Variation'
      },
      variationIdsMap: { 0: ['123'], 1: ['123', '22', '789'], 11: ['22'], 2: ['44'] },
      redirectExperiment: {
        variationId: '22',
        experimentId: '11',
        referrer: 'google.com'
      }
    }
  };
};

// Optimizely X
var mockOptimizelyXDataObject = function() {
  // remove Classic data object
  delete window.optimizely.data;

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
  // Optimizely init snippet uses new API methods below to access data rather than the global optimizely.data object
  window.optimizely.get = function() {
    return {
      getCampaignStates: function(options) {
        if (!('isActive' in options)) return window.optimizely.newMockData;
        // returns all campaigns with option to return just active ones (which is what we do in the snippet)
        var ret = {};
        for (var campaign in window.optimizely.newMockData) {
          if (window.optimizely.newMockData[campaign].isActive === options.isActive) {
            ret[campaign] = window.optimizely.newMockData[campaign];
          }
        }
        return ret;
      },
      getRedirectInfo: function() {
        var campaigns = this.getCampaignStates({ isActive: true });
        for (var id in campaigns) {
          if (campaigns[id].visitorRedirected) return { referrer: 'barstools.com' };
        }
        return;
      }
    };
  };
};

var mockBothOptimizelyDataObjects = function() {
  mockOptimizelyXDataObject();
  mockOptimizelyClassicDataObject();
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
    nonInteraction: false
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
    beforeEach(function() {
      analytics.stub(Optimizely, 'initOptimizelyIntegration', Optimizely.initOptimizelyIntegration); // Reference to constructor intentionally
      analytics.stub(optimizely, 'load');
      analytics.stub(optimizely, 'sendClassicDataToSegment');
      analytics.stub(optimizely, 'sendNewDataToSegment');
      analytics.stub(optimizely, 'setEffectiveReferrer');
    });

    describe('#initialize', function() {
      beforeEach(function(done) {
        analytics.stub(window.optimizely, 'push');
        analytics.once('ready', done);
        analytics.initialize();
        analytics.page();
      });

      it('should call initOptimizelyIntegration', function(done) {
        executeAsyncTest(done, function() {
          analytics.called(Optimizely.initOptimizelyIntegration);
        });
      });

      it('should flag source of integration', function() {
        analytics.called(window.optimizely.push, {
          type: 'integration',
          OAuthClientId: '5360906403'
        });
      });
    });

    describe('#initOptimizelyIntegration', function() {
      // Testing the behavior of the Optimizely provided private init function
      // to ensure that proper callback functions were executed with expected params
      // given each of the possible Optimizely snippet you could have on the page (Classic, X, Both)
      describe('Classic', function() {
        beforeEach(function(done) {
          mockOptimizelyClassicDataObject();
          analytics.initialize();
          tick(done);
        });

        it('should call setEffectiveReferrer for redirect experiments', function() {
          analytics.called(optimizely.setEffectiveReferrer, 'google.com');
        });

        it('should call sendClassicDataToSegment for active Classic experiments', function() {
          // we have two active experiments running in the mock data object
          analytics.calledTwice(optimizely.sendClassicDataToSegment);
          analytics.deepEqual(optimizely.sendClassicDataToSegment.args[0], [{
            experiment: {
              id: '0',
              name: 'Test'
            },
            variations: [{
              id: '123',
              name: 'Variation #123'
            }],
            sections: undefined
          }]);
          analytics.deepEqual(optimizely.sendClassicDataToSegment.args[1], [{
            experiment: {
              id: '11',
              name: 'Redirect Test',
              referrer: 'google.com'
            },
            variations: [{
              id: '22',
              name: 'Redirect Variation'
            }],
            sections: undefined
          }]);
        });
      });

      describe('New', function() {
        beforeEach(function() {
          mockOptimizelyXDataObject();
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

        it('should call sendNewDataToSegment for active Optimizely X campaigns', function(done) {
          analytics.initialize();
          executeAsyncTest(done, function() {
            analytics.calledTwice(optimizely.sendNewDataToSegment);
            analytics.deepEqual(optimizely.sendNewDataToSegment.args[0], [
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
            analytics.deepEqual(optimizely.sendNewDataToSegment.args[1], [
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

      describe('Both', function() {
        beforeEach(function() {
          mockBothOptimizelyDataObjects();
          analytics.initialize();
        });

        // Note: we're not testing setEffectiveReferrer here since you can only have one version
        // or the other, not both. And each one has been tested in the above unit tests

        it('should call both sendClassicDataToSegment and sendNewDataToSegment', function(done) {
          // we have two active experiments running in the mock data object for both versions
          executeAsyncTest(done, function() {
            analytics.calledTwice(optimizely.sendClassicDataToSegment);
            analytics.calledTwice(optimizely.sendNewDataToSegment);
            analytics.deepEqual(optimizely.sendClassicDataToSegment.args[0], [{
              experiment: {
                id: '0',
                name: 'Test'
              },
              variations: [{
                id: '123',
                name: 'Variation #123'
              }],
              sections: undefined
            }]);
            analytics.deepEqual(optimizely.sendClassicDataToSegment.args[1], [{
              experiment: {
                id: '11',
                name: 'Redirect Test',
                referrer: 'google.com'
              },
              variations: [{
                id: '22',
                name: 'Redirect Variation'
              }],
              sections: undefined
            }]);
            analytics.deepEqual(optimizely.sendNewDataToSegment.args[0], [
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
            analytics.deepEqual(optimizely.sendNewDataToSegment.args[1], [
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
  });

  describe('#setEffectiveReferrer', function() {
    describe('Classic', function() {
      beforeEach(function(done) {
        mockOptimizelyClassicDataObject();
        analytics.initialize();
        tick(done);
      });

      it('should set a global variable `window.optimizelyEffectiveReferrer`', function() {
        analytics.equal(window.optimizelyEffectiveReferrer, 'google.com');
      });
    });

    describe('New', function() {
      beforeEach(function() {
        mockOptimizelyXDataObject();
        // enable redirect experiment
        window.optimizely.newMockData[2347102720].isActive = true;
        analytics.initialize();
      });

      it('should set a global variable `window.optimizelyEffectiveReferrer`', function(done) {
        executeAsyncTest(done, function() {
          analytics.equal(window.optimizelyEffectiveReferrer, 'barstools.com');
        });
      });
    });

    // Again -- we're not testing for both since there is no point.
    // You can't have this function execute twice each with different referrer value
    // It will always either just call one or the other
  });

  describe('#sendClassicDataToSegment', function() {
    beforeEach(function() {
      mockOptimizelyClassicDataObject();
    });

    describe('#options.variations', function() {
      beforeEach(function(done) {
        optimizely.options.variations = true;
        analytics.stub(analytics, 'identify');
        analytics.initialize();
        tick(done);
      });

      it('should send each experiment via `.identify()`', function() {
        // Since we have two experiments in `window.optimizely.data.state.activeExperiments`
        // This test proves the breaking changes for the option (it used to send both experiment data in one
        // `.identify()` call)
        analytics.calledTwice(analytics.identify);
        analytics.deepEqual(analytics.identify.args[0], [{
          'Experiment: Test': 'Variation #123'
        }]);
        analytics.deepEqual(analytics.identify.args[1], [{
          'Experiment: Redirect Test': 'Redirect Variation'
        }]);
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

      it('should send each standard active experiment data via `.track()`', function(done) {
        // activate standard experiment
        window.optimizely.data.state.activeExperiments = ['0'];
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              experimentId: '0',
              experimentName: 'Test',
              variationId: '123',
              variationName: 'Variation #123'
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should send multivariate active experiment data via `.track()`', function(done) {
        // activate multivariate experiment and set section info
        window.optimizely.data.state.activeExperiments = ['0'];
        window.optimizely.data.sections = { 123409: { name: 'Section 1', variation_ids: ['123'] } };
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              experimentId: '0',
              experimentName: 'Test',
              variationId: '123',
              variationName: 'Variation #123',
              sectionName: 'Section 1',
              sectionId: '123409'
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should dedupe sectionNames for multi section multivariate active experiment data via `.track()`', function(done) {
        // activate multivariate experiment and set section info
        window.optimizely.data.state.activeExperiments = ['1'];
        window.optimizely.data.sections = { 123409: { name: 'Section 1', variation_ids: ['123', '22', '789'] } };
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              experimentId: '1',
              experimentName: 'MultiVariate Test',
              variationId: '123,22,789',
              variationName: 'Redirect Variation, Var 789, Variation #123',
              sectionName: 'Section 1',
              sectionId: '123409'
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should send multivariate active experiment with multiple section data via `.track()`', function(done) {
        // activate multivariate experiment and set section info
        window.optimizely.data.state.activeExperiments = ['1'];
        window.optimizely.data.sections = {
          112309: { name: 'Section 1', variation_ids: ['123'] },
          111111: { name: 'Section 2', variation_ids: ['22', '789'] }
        };
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              experimentId: '1',
              experimentName: 'MultiVariate Test',
              variationId: '123,22,789',
              variationName: 'Redirect Variation, Var 789, Variation #123',
              sectionName: 'Section 1, Section 2',
              sectionId: '111111,112309'
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should send redirect active experiment data via `.track()`', function(done) {
        // activate redirect experiment
        window.optimizely.data.state.activeExperiments = [];
        var context = {
          integration: optimizelyContext,
          page: { referrer: 'google.com' }
        };
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              experimentId: '11',
              experimentName: 'Redirect Test',
              referrer: 'google.com',
              variationId: '22',
              variationName: 'Redirect Variation'
            },
            context
          ]);
        });
      });

      it('should send Google\'s nonInteraction flag via `.track()`', function(done) {
        // flip the nonInteraction option on and activate standard experiment
        optimizely.options.nonInteraction = true;
        window.optimizely.data.state.activeExperiments = ['0'];
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              experimentId: '0',
              experimentName: 'Test',
              variationId: '123',
              variationName: 'Variation #123',
              nonInteraction: 1
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should not send inactive experiments', function(done) {
        // clear out the redirect experiment
        window.optimizely.data.state.redirectExperiment = undefined;
        // disable all active experiments
        window.optimizely.data.state.activeExperiments = [];
        analytics.initialize();
        executeAsyncTest(done, function() {
          analytics.didNotCall(analytics.track);
        });
      });
    });
  });

  describe('#sendNewDataToSegment', function() {
    beforeEach(function() {
      mockOptimizelyXDataObject();
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
        analytics.deepEqual(analytics.identify.args[0], [{
          'Experiment: Coding Bootcamp': 'Variation DBC'
        }]);
        analytics.deepEqual(analytics.identify.args[1], [{
          'Experiment: Worlds Group Stage': 'Variation #1'
        }]);
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

      it('should send Google\'s nonInteraction flag via `.track()`', function(done) {
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
      mockBothOptimizelyDataObjects();
      analytics.page();
    });

    describe('#track', function() {
      beforeEach(function() {
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
      
      it('should repace colons with underscore in eventName', function() {
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

      describe('the Optimizely X Fullstack JavaScript client is present', function() {
        beforeEach(function() {
          window.optimizelyClientInstance = {};
          analytics.stub(window.optimizelyClientInstance, 'track');
        });

        afterEach(function() {
          window.optimizelyClientInstance.track.restore();
        });

        it('should send an event through the Optimizely X Fullstack JS SDK using the logged in user', function() {
          analytics.identify('user1');
          analytics.track('event', { purchasePrice: 9.99, property: 'foo' });
          analytics.called(window.optimizelyClientInstance.track, 'event', 'user1', {}, { purchasePrice: 9.99, property: 'foo' });
        });

        it('should replace colons with underscores for event names', function() {
          analytics.identify('user1');
          analytics.track('foo:bar:baz');
          analytics.called(window.optimizelyClientInstance.track, 'foo_bar_baz', 'user1', {}, {});
        });

        it('should send an event through the Optimizely X Fullstack JS SDK using the user provider user id', function() {
          analytics.track('event', { purchasePrice: 9.99, property: 'foo' }, { Optimizely: { userId: 'user1', attributes: { country: 'usa' } } });
          analytics.called(window.optimizelyClientInstance.track, 'event', 'user1', { country: 'usa' }, { property: 'foo', purchasePrice: 9.99 });
        });

        it('should send revenue on `Order Completed` through the Optimizely X Fullstack JS SDK and `properites.revenue` is passed', function() {
          analytics.track('Order Completed', { purchasePrice: 9.99, property: 'foo', revenue: 1.99 }, { Optimizely: { userId: 'user1', attributes: { country: 'usa' } } });
          analytics.called(window.optimizelyClientInstance.track, 'Order Completed', 'user1', { country: 'usa' }, { property: 'foo', purchasePrice: 9.99, revenue: 199 });
        });

        it('should not default to sending revenue through the Optimizely X Fullstack JS SDK on non `Order Completed` events and `properites.revenue` is passed', function() {
          analytics.track('event', { purchasePrice: 9.99, property: 'foo', revenue: 1.99 }, { Optimizely: { userId: 'user1', attributes: { country: 'usa' } } });
          analytics.called(window.optimizelyClientInstance.track, 'event', 'user1', { country: 'usa' }, { property: 'foo', purchasePrice: 9.99 });
        });

        it('should send revenue through the Optimizely X Fullstack JS SDK on all events if `sendRevenueOnlyForOrderCompleted` is disabled and `properites.revenue` is passed', function() {
          optimizely.options.sendRevenueOnlyForOrderCompleted = false;
          analytics.track('event', { purchasePrice: 9.99, property: 'foo', revenue: 1.99 }, { Optimizely: { userId: 'user1', attributes: { country: 'usa' } } });
          analytics.called(window.optimizelyClientInstance.track, 'event', 'user1', { country: 'usa' }, { property: 'foo', purchasePrice: 9.99, revenue: 199 });
        });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
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
