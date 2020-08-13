'use strict';

var _ = require('lodash');
var Analytics = require('@segment/analytics.js-core').constructor;
var assert = require('chai').assert;
var sandbox = require('@segment/clear-env');
var sinon = require('sinon');
var tester = require('@segment/analytics.js-integration-tester');
var Optimizely = require('../lib/');
var tick = require('next-tick');

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

/**
 * Test account: han@segment.com
 */

var mockWindowOptimizely = function() {
  window.optimizely = {
    newMockData: {
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
    },

    get: function() {
      return {
        getCampaignStates: function(options) {
          if (!options.isActive) {
            throw new Error('Incorrect call to getCampaignStates');
          }
          return _.pickBy(window.optimizely.newMockData, {
            isActive: options.isActive
          });
        },
        getRedirectInfo: function() {
          var campaigns = this.getCampaignStates({ isActive: true });
          var campaignIds = Object.keys(campaigns);
          for (var i = 0; i < campaignIds.length; i++) {
            var id = campaignIds[i];
            if (campaigns[id].visitorRedirected) {
              return {
                experimentId: campaigns[id].experiment.id,
                variationId: campaigns[id].variation.id,
                referrer: 'barstools.com'
              };
            }
          }
          return null;
        }
      };
    },

    push: sinon.stub()
  };
};

var mockWindowEdge = function() {
  window.optimizelyEdge = {
    edgeMockData: {
      7522212694: {
        id: '7522212694',
        name: 'Wells Fargo Scam',
        variation: {
          id: '7551111120',
          name: 'Variation Corruption #1884'
        },
        // these are returned by real Optimizely API but will not be send to integrations
        isActive: false,
        reason: undefined,
        visitorRedirected: true
      },
      7547682694: {
        id: '7547682694',
        name: 'Worlds Group Stage',
        variation: {
          id: '7557950020',
          name: 'Variation #1'
        },
        // these are returned by real Optimizely API but will not be send to integrations
        isActive: true,
        reason: undefined,
        visitorRedirected: false
      },
      1111182111: {
        id: '1111182111',
        name: 'Coding Bootcamp',
        variation: {
          id: '7333333333',
          name: 'Variation DBC'
        },
        // these are returned by real Optimizely API but will not be send to integrations
        isActive: true,
        reason: undefined,
        visitorRedirected: false
      }
    },

    get: function() {
      return {
        getActiveExperiments: function() {
          var data = _.filter(window.optimizelyEdge.edgeMockData, {
            isActive: true
          });

          data = Object.keys(data).map(function(key) {
            return data[key];
          });
          var formatExperiment = function(experimentState) {
            return {
              id: experimentState.id,
              name: experimentState.name,
              variation: {
                id: experimentState.variation.id,
                name: experimentState.variation.name
              }
            };
          };

          /* eslint-disable no-param-reassign */
          return data.reduce(function(activeExperiments, experiment) {
            var formatted = formatExperiment(experiment);
            activeExperiments[formatted.id] = formatted;
            return activeExperiments;
          }, {});
          /* eslint-enable no-param-reassign */
        }
      };
    },

    push: sinon.stub()
  };
};

// passed into context.integration (not context.integrations!) for all track calls for some reason
var optimizelyContext = {
  name: 'optimizely',
  version: '2.0.0'
};

describe('Optimizely', function() {
  this.timeout(0);

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
    sinon.restore();
  });

  describe('#initialize on Web', function() {
    beforeEach(function(done) {
      sinon.stub(Optimizely.prototype, 'initWebIntegration');
      sinon.stub(window.optimizely, 'push');
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    context('if on a Web page', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
        analytics.page();
      });

      afterEach(function() {
        analytics.reset();
      });

      it('should call initWebIntegration', function(done) {
        executeAsyncTest(done, function() {
          sinon.assert.calledWith(optimizely.initWebIntegration);
        });
      });

      it('should flag source of integration', function() {
        sinon.assert.calledWith(window.optimizely.push, {
          type: 'integration',
          OAuthClientId: '5360906403'
        });
      });
    });
  });

  // causes another test suite to fail (#sendWebDecisionToSegment).
  describe.skip('#initialize on Edge', function() {
    beforeEach(function(done) {
      window.optimizelyEdge = [];
      sinon.stub(Optimizely.prototype, 'initEdgeIntegration');
      sinon.stub(window.optimizelyEdge, 'push');
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    afterEach(function() {
      delete window.optimizelyEdge;
    });

    it('should call initEdgeIntegration', function(done) {
      executeAsyncTest(done, function() {
        sinon.assert.calledWith(optimizely.initEdgeIntegration);
      });
    });

    it('should flag source of integration', function() {
      sinon.assert.calledWith(window.optimizelyEdge.push, {
        type: 'integration',
        OAuthClientId: '5360906403'
      });
    });
  });

  describe('#setRedirectInfo', function() {
    beforeEach(function(done) {
      analytics.initialize();
      tick(done);
    });

    context('when no redirect info was captured', function() {
      beforeEach(function() {
        optimizely.setRedirectInfo(null);
      });

      it('does not set redirect info', function() {
        assert.isUndefined(optimizely.redirectInfo);
        assert.isUndefined(window.optimizelyEffectiveReferrer);
      });
    });

    context('when redirect info was captured', function() {
      beforeEach(function() {
        optimizely.setRedirectInfo({
          experimentId: 'x',
          variationId: 'v',
          referrer: 'r'
        });
      });

      it('sets redirect info', function() {
        assert.deepEqual(optimizely.redirectInfo, {
          experimentId: 'x',
          variationId: 'v',
          referrer: 'r'
        });
        assert.equal(window.optimizelyEffectiveReferrer, 'r');
      });
    });
  });

  describe('#initWebIntegration', function() {
    beforeEach(function() {
      sinon.stub(optimizely, 'sendWebDecisionToSegment');
      sinon.stub(optimizely, 'setRedirectInfo');
    });

    context('before the Optimizely snippet has loaded', function() {
      var prePushStub;

      beforeEach(function() {
        prePushStub = sinon.stub();
        window.optimizely = {
          push: prePushStub
        };

        optimizely.initWebIntegration();
      });

      context('if a redirect experiment has executed', function() {
        beforeEach(function() {
          mockWindowOptimizely();
          // Make sure window.optimizely.getRedirectInfo returns something
          window.optimizely.newMockData[2347102720].isActive = true;
        });

        it('eventually captures redirect info', function() {
          sinon.assert.notCalled(optimizely.setRedirectInfo);

          var initializedCalls = _.filter(prePushStub.getCalls(), {
            args: [
              {
                type: 'addListener',
                filter: {
                  type: 'lifecycle',
                  name: 'initialized'
                }
              }
            ]
          });
          assert.equal(initializedCalls.length, 1);
          // Actually simulate an 'initialized' event.
          initializedCalls[0].args[0].handler();

          sinon.assert.calledOnceWithExactly(optimizely.setRedirectInfo, {
            experimentId: '7522212694',
            variationId: '7551111120',
            referrer: 'barstools.com'
          });
        });
      });

      context("if a redirect experiment hasn't executed", function() {
        beforeEach(function() {
          // by default mock data has no redirect experiments active
          mockWindowOptimizely();
        });

        it('does not capture redirect info', function() {
          sinon.assert.notCalled(optimizely.setRedirectInfo);

          var initializedCalls = _.filter(prePushStub.getCalls(), {
            args: [
              {
                type: 'addListener',
                filter: {
                  type: 'lifecycle',
                  name: 'initialized'
                }
              }
            ]
          });
          assert.equal(initializedCalls.length, 1);
          // Actually simulate an 'initialized' event.
          initializedCalls[0].args[0].handler();

          sinon.assert.calledOnceWithExactly(optimizely.setRedirectInfo, null);
        });
      });

      it('does not immediately call sendWebDecisionToSegment', function() {
        optimizely.initWebIntegration();
        sinon.assert.notCalled(optimizely.sendWebDecisionToSegment);
      });

      context('when a campaign is finally decided', function() {
        var handler;

        beforeEach(function() {
          // Make sure the code is actually listening for campaign decisions
          var campaignDecidedCalls = _.filter(prePushStub.getCalls(), {
            args: [
              {
                type: 'addListener',
                filter: {
                  type: 'lifecycle',
                  name: 'campaignDecided'
                }
              }
            ]
          });
          assert.equal(campaignDecidedCalls.length, 1);
          // We'll call this later in order to simulate the 'campaignDecided' event.
          handler = campaignDecidedCalls[0].args[0].handler;
        });

        context('and the campaign is active', function() {
          beforeEach(function() {
            mockWindowOptimizely();
            window.optimizely.newMockData[2347102720].isActive = true;

            handler({
              data: {
                campaign: {
                  id: '2347102720'
                }
              }
            });
          });

          it('calls #sendWebDecisionToSegment', function() {
            sinon.assert.calledWithExactly(
              optimizely.sendWebDecisionToSegment,
              sinon.match({
                id: '2347102720',
                campaignName: 'Get Rich or Die Tryin',
                experiment: {
                  id: '7522212694',
                  name: 'Wells Fargo Scam'
                },
                variation: {
                  id: '7551111120',
                  name: 'Variation Corruption #1884'
                },
                isInCampaignHoldback: false,
                audiences: [
                  {
                    name: 'Middle Class',
                    id: '7100568438'
                  }
                ]
              })
            );
          });
        });

        context('and the campaign is inactive', function() {
          beforeEach(function() {
            mockWindowOptimizely();

            handler({
              data: {
                campaign: {
                  id: '2347102720'
                }
              }
            });
          });

          it('does not call #sendWebDecisionToSegment', function() {
            sinon.assert.notCalled(optimizely.sendWebDecisionToSegment);
          });
        });
      });
    });

    context('after the Optimizely snippet has loaded', function() {
      beforeEach(function() {
        mockWindowOptimizely();
      });

      context('if a redirect experiment has executed', function() {
        beforeEach(function() {
          // Make sure window.optimizely.getRedirectInfo returns something
          window.optimizely.newMockData[2347102720].isActive = true;

          optimizely.initWebIntegration();
        });

        it('immediately captures redirect info', function() {
          sinon.assert.calledOnceWithExactly(optimizely.setRedirectInfo, {
            experimentId: '7522212694',
            variationId: '7551111120',
            referrer: 'barstools.com'
          });
        });

        it('captures redirect info _before_ tracking decisions', function() {
          sinon.assert.callOrder(
            optimizely.setRedirectInfo,
            optimizely.sendWebDecisionToSegment
          );
        });
      });

      context("if a redirect experiment hasn't executed", function() {
        beforeEach(function() {
          optimizely.initWebIntegration();
        });

        it('does not capture redirect info', function() {
          sinon.assert.calledOnceWithExactly(optimizely.setRedirectInfo, null);
        });
      });

      it('calls sendWebDecisionToSegment for active Optimizely X campaigns', function() {
        optimizely.initWebIntegration();

        sinon.assert.calledTwice(optimizely.sendWebDecisionToSegment);
        sinon.assert.calledWithExactly(optimizely.sendWebDecisionToSegment, {
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
        });
        sinon.assert.calledWithExactly(optimizely.sendWebDecisionToSegment, {
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
        });
      });

      context('when a future campaign is decided', function() {
        var handler;

        beforeEach(function() {
          optimizely.initWebIntegration();
          // Forget about the initial campaigns that were tracked.
          optimizely.sendWebDecisionToSegment.resetHistory();

          // Make sure the code is actually listening for campaign decisions
          var campaignDecidedCalls = _.filter(
            window.optimizely.push.getCalls(),
            {
              args: [
                {
                  type: 'addListener',
                  filter: {
                    type: 'lifecycle',
                    name: 'campaignDecided'
                  }
                }
              ]
            }
          );
          assert.equal(campaignDecidedCalls.length, 1);
          // We'll call this later in order to simulate the 'campaignDecided' event.
          handler = campaignDecidedCalls[0].args[0].handler;
        });

        context('and the campaign is active', function() {
          beforeEach(function() {
            window.optimizely.newMockData[2347102720].isActive = true;

            handler({
              data: {
                campaign: {
                  id: '2347102720'
                }
              }
            });
          });

          it('calls #sendWebDecisionToSegment', function() {
            sinon.assert.calledWithExactly(
              optimizely.sendWebDecisionToSegment,
              sinon.match({
                id: '2347102720',
                campaignName: 'Get Rich or Die Tryin',
                experiment: {
                  id: '7522212694',
                  name: 'Wells Fargo Scam'
                },
                variation: {
                  id: '7551111120',
                  name: 'Variation Corruption #1884'
                },
                isInCampaignHoldback: false,
                audiences: [
                  {
                    name: 'Middle Class',
                    id: '7100568438'
                  }
                ]
              })
            );
          });
        });

        context('and the campaign is inactive', function() {
          beforeEach(function() {
            handler({
              data: {
                campaign: {
                  id: '2347102720'
                }
              }
            });
          });

          it('does not call #sendWebDecisionToSegment', function() {
            sinon.assert.notCalled(optimizely.sendWebDecisionToSegment);
          });
        });
      });
    });
  });

  describe('#sendWebDecisionToSegment', function() {
    // TODO: Turn these into proper _unit_ tests.
    //       * Directly call sendWebDecisionToSegment (after calling setRedirectInfo in cases where
    //         that precondition is relevant) instead of calling analytics.initialize.
    //       * For some of these tests (e.g. the ones that reference "personalized" campaigns),
    //         move the tests to #initWebIntegration and assert that #sendWebDecisionToSegment is called
    //         with particular arguments.

    beforeEach(function() {
      mockWindowOptimizely();
    });

    context('options.variations', function() {
      beforeEach(function(done) {
        optimizely.options.variations = true;
        sinon.stub(analytics, 'identify');
        analytics.initialize();
        tick(done);
      });

      it('should send active campaign via `.identify()`', function() {
        // Since we have two experiments in `window.optimizely.data.state.activeExperiments`
        // This test proves the breaking changes for the option (it used to send both experiment data in one
        // `.identify()` call)
        sinon.assert.calledTwice(analytics.identify);
        assert.deepEqual(analytics.identify.args[0], [
          {
            'Experiment: Coding Bootcamp': 'Variation DBC'
          }
        ]);
        assert.deepEqual(analytics.identify.args[1], [
          {
            'Experiment: Worlds Group Stage': 'Variation #1'
          }
        ]);
      });
    });

    context('options.sendRevenueOnlyForOrderCompleted', function() {
      it('should not include revenue on a non Order Completed event if `onlySendRevenueOnOrderCompleted` is enabled', function(done) {
        analytics.initialize();
        tick(done);

        analytics.track('Order Updated', {
          revenue: 25
        });
        sinon.assert.calledWith(window.optimizely.push, {
          type: 'event',
          eventName: 'Order Updated',
          tags: {}
        });
      });

      it('should send revenue only on Order Completed if `onlySendRevenueOnOrderCompleted` is enabled', function(done) {
        optimizely.options.sendRevenueOnlyForOrderCompleted = true;

        analytics.initialize();
        tick(done);

        analytics.track('Order Completed', {
          revenue: 9.99
        });
        sinon.assert.calledWith(window.optimizely.push, {
          type: 'event',
          eventName: 'Order Completed',
          tags: {
            revenue: 999
          }
        });
      });

      it('should send revenue on all events with properties.revenue if `onlySendRevenueOnOrderCompleted` is disabled', function(done) {
        optimizely.options.sendRevenueOnlyForOrderCompleted = false;

        analytics.initialize();
        tick(done);

        analytics.track('Checkout Started', {
          revenue: 9.99
        });
        sinon.assert.calledWith(window.optimizely.push, {
          type: 'event',
          eventName: 'Checkout Started',
          tags: {
            revenue: 999
          }
        });
      });
    });

    context('options.listen', function() {
      beforeEach(function() {
        optimizely.options.listen = true;
        sinon.stub(analytics, 'track');
      });

      it('should send standard active campaign data via `.track()`', function(done) {
        // Mock data by default has two active campaign/experiments.
        // Going to leave just the one that was created as a standard
        // experiment inside Optimizely X (not campaign)
        window.optimizely.newMockData[7547101713].isActive = false;
        analytics.initialize();
        executeAsyncTest(done, function() {
          assert.deepEqual(analytics.track.args[0], [
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
          sinon.assert.calledWithExactly(
            analytics.track,
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
          );
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
          sinon.assert.calledWithExactly(
            analytics.track,
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
          );
        });
      });

      it("should send Google's nonInteraction flag via `.track()`", function(done) {
        // Mock data has two active campaigns running
        // For convenience, we'll disable one of them
        window.optimizely.newMockData[2542102702] = false;
        optimizely.options.nonInteraction = true;
        analytics.initialize();
        executeAsyncTest(done, function() {
          sinon.assert.calledWithExactly(
            analytics.track,
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
          );
        });
      });

      it('should not send inactive experiments', function(done) {
        // deactivate all experiments
        window.optimizely.newMockData[2347102720].isActive = false;
        window.optimizely.newMockData[7547101713].isActive = false;
        window.optimizely.newMockData[2542102702].isActive = false;
        analytics.initialize();
        executeAsyncTest(done, function() {
          sinon.assert.notCalled(analytics.track);
        });
      });
    });
  });

  describe('#initEdgeIntegration', function() {
    beforeEach(function() {
      window.optimizelyEdge = [];
      sinon.stub(optimizely, 'sendEdgeExperimentToSegment');
      sinon.stub(window.optimizely, 'push');
    });

    afterEach(function() {
      delete window.optimizelyEdge;
      sinon.reset();
    });

    context('before the Edge microsnippet has loaded', function() {
      var prePushStub;

      beforeEach(function() {
        prePushStub = sinon.stub();
        window.optimizely = {
          push: prePushStub
        };

        optimizely.initEdgeIntegration();
      });

      // Optimizely Edge is not supporting an API to get redirect information.
      context.skip('if a redirect experiment has executed', function() {
        beforeEach(function() {
          mockWindowEdge();
          // Make sure window.optimizely.getRedirectInfo returns something
          window.optimizelyEdge.edgeMockData[2347102720].isActive = true;
        });

        it('eventually captures redirect info', function() {
          sinon.assert.notCalled(optimizely.setRedirectInfo);

          var initializedCalls = _.filter(prePushStub.getCalls(), {
            args: [
              {
                type: 'addListener',
                filter: {
                  type: 'lifecycle',
                  name: 'initialized'
                }
              }
            ]
          });
          assert.equal(initializedCalls.length, 1);
          // Actually simulated an 'initialized' event.
          initializedCalls[0].args[0].handler();

          sinon.assert.calledOnceWithExactly(optimizely.setRedirectInfo, {
            experimentId: '7522212694',
            variationId: '7551111120',
            referrer: 'barstools.com'
          });
        });
      });

      // Optimizely Edge is not supporting an API to get redirect information.
      context.skip("if a redirect experiment hasn't executed", function() {
        beforeEach(function() {
          // by default mock data has no redirect experiments active
          mockWindowOptimizely();
        });

        it('does not capture redirect info', function() {
          sinon.assert.notCalled(optimizely.setRedirectInfo);

          var initializedCalls = _.filter(prePushStub.getCalls(), {
            args: [
              {
                type: 'addListener',
                filter: {
                  type: 'lifecycle',
                  name: 'initialized'
                }
              }
            ]
          });
          assert.equal(initializedCalls.length, 1);
          // Actually simulated an 'initialized' event.
          initializedCalls[0].args[0].handler();

          sinon.assert.calledOnceWithExactly(optimizely.setRedirectInfo, null);
        });
      });

      it('does not immediately call sendEdgeExperimentToSegment', function() {
        sinon.assert.notCalled(optimizely.sendEdgeExperimentToSegment);
      });

      context('when an experiment is finally decided', function() {
        var handler;

        beforeEach(function() {
          // Make sure the code is actually listening for experiments
          var campaignDecidedCalls = _.filter(prePushStub.getCalls(), {
            args: [
              {
                type: 'addListener',
                filter: {
                  type: 'lifecycle',
                  name: 'campaignDecided'
                }
              }
            ]
          });
          assert.equal(campaignDecidedCalls.length, 1);
          // We'll call this later in order to simulate the 'campaignDecided' event.
          handler = campaignDecidedCalls[0].args[0].handler;
        });

        context('and the experiment is active', function() {
          beforeEach(function() {
            mockWindowEdge();
            window.optimizelyEdge.edgeMockData[7522212694].isActive = true;

            handler({
              data: {
                decision: {
                  experimentId: '7522212694',
                  variationId: '7551111120'
                }
              }
            });
          });

          it('calls #sendEdgeExperimentToSegment', function() {
            sinon.assert.calledWithExactly(
              optimizely.sendEdgeExperimentToSegment,
              sinon.match({
                id: '7522212694',
                name: 'Wells Fargo Scam',
                variation: {
                  id: '7551111120',
                  name: 'Variation Corruption #1884'
                }
              })
            );
          });
        });

        context('and the experiment is inactive', function() {
          beforeEach(function() {
            mockWindowEdge();
            handler({
              data: {
                decision: {
                  experimentId: '7522212694',
                  variationId: '7551111120'
                }
              }
            });
          });

          it('does not call #sendEdgeExperimentToSegment', function() {
            sinon.assert.notCalled(optimizely.sendEdgeExperimentToSegment);
          });
        });
      });
    });

    context('after the Optimizely Edge microsnippet has loaded', function() {
      beforeEach(function() {
        mockWindowEdge();
      });

      // Optimizely Edge is not supporting an API to get redirect information.
      context.skip('if a redirect experiment has executed', function() {
        beforeEach(function() {
          // Make sure window.optimizely.getRedirectInfo returns something
          window.optimizely.newMockData[2347102720].isActive = true;

          optimizely.initWebIntegration();
        });

        it('immediately captures redirect info', function() {
          sinon.assert.calledOnceWithExactly(optimizely.setRedirectInfo, {
            experimentId: '7522212694',
            variationId: '7551111120',
            referrer: 'barstools.com'
          });
        });

        it('captures redirect info _before_ tracking decisions', function() {
          sinon.assert.callOrder(
            optimizely.setRedirectInfo,
            optimizely.sendWebDecisionToSegment
          );
        });
      });

      // Optimizely Edge is not supporting an API to get redirect information.
      context.skip("if a redirect experiment hasn't executed", function() {
        beforeEach(function() {
          optimizely.initWebIntegration();
        });

        it('does not capture redirect info', function() {
          sinon.assert.calledOnceWithExactly(optimizely.setRedirectInfo, null);
        });
      });

      it('calls sendEdgeExperimentToSegment for active Optimizely Edge experiments', function() {
        optimizely.initEdgeIntegration();

        sinon.assert.calledTwice(optimizely.sendEdgeExperimentToSegment);
        sinon.assert.calledWithExactly(optimizely.sendEdgeExperimentToSegment, {
          id: '1111182111',
          name: 'Coding Bootcamp',
          variation: {
            id: '7333333333',
            name: 'Variation DBC'
          }
        });

        sinon.assert.calledWithExactly(optimizely.sendEdgeExperimentToSegment, {
          id: '7547682694',
          name: 'Worlds Group Stage',
          variation: {
            id: '7557950020',
            name: 'Variation #1'
          }
        });
      });

      context('when a future experiment is decided', function() {
        var handler;

        beforeEach(function() {
          optimizely.initEdgeIntegration();
          // Forget about the initial campaigns that were tracked.
          optimizely.sendEdgeExperimentToSegment.resetHistory();

          // Make sure the code is actually listening for campaign decisions
          var campaignDecidedCalls = _.filter(
            window.optimizely.push.getCalls(),
            {
              args: [
                {
                  type: 'addListener',
                  filter: {
                    type: 'lifecycle',
                    name: 'campaignDecided'
                  }
                }
              ]
            }
          );
          assert.equal(campaignDecidedCalls.length, 1);
          // We'll call this later in order to simulate the 'campaignDecided' event.
          handler = campaignDecidedCalls[0].args[0].handler;
        });

        context('and the experiment is active', function() {
          beforeEach(function() {
            window.optimizelyEdge.edgeMockData[7522212694].isActive = true;

            handler({
              data: {
                decision: {
                  experimentId: '7522212694',
                  variationId: '7551111120'
                }
              }
            });
          });

          it('calls #sendEdgeExperimentToSegment', function() {
            sinon.assert.calledWithExactly(
              optimizely.sendEdgeExperimentToSegment,
              sinon.match({
                id: '7522212694',
                name: 'Wells Fargo Scam',
                variation: {
                  id: '7551111120',
                  name: 'Variation Corruption #1884'
                }
              })
            );
          });
        });

        context('and the experiment is inactive', function() {
          beforeEach(function() {
            handler({
              data: {
                decision: {
                  experimentId: '7522212694',
                  variationId: '7551111120'
                }
              }
            });
          });

          it('does not call #sendEdgeExperimentToSegment', function() {
            sinon.assert.notCalled(optimizely.sendEdgeExperimentToSegment);
          });
        });
      });
    });
  });

  describe('#sendEdgeDecisionToSegment', function() {
    beforeEach(function() {
      window.optimizelyEdge = [];
      mockWindowEdge();
    });

    afterEach(function() {
      delete window.optimizelyEdge;
    });

    context('options.sendRevenueOnlyForOrderCompleted', function() {
      it('should not include revenue on a non Order Completed event if `onlySendRevenueOnOrderCompleted` is enabled', function(done) {
        analytics.initialize();
        tick(done);

        analytics.track('Order Updated', {
          revenue: 25
        });
        sinon.assert.calledWith(window.optimizelyEdge.push, {
          type: 'event',
          eventName: 'Order Updated',
          tags: {}
        });
      });

      it('should send revenue only on Order Completed if `onlySendRevenueOnOrderCompleted` is enabled', function(done) {
        optimizely.options.sendRevenueOnlyForOrderCompleted = true;

        analytics.initialize();
        tick(done);

        analytics.track('Order Completed', {
          revenue: 9.99
        });
        sinon.assert.calledWith(window.optimizelyEdge.push, {
          type: 'event',
          eventName: 'Order Completed',
          tags: {
            revenue: 999
          }
        });
      });

      it('should send revenue on all events with properties.revenue if `onlySendRevenueOnOrderCompleted` is disabled', function(done) {
        optimizely.options.sendRevenueOnlyForOrderCompleted = false;

        analytics.initialize();
        tick(done);

        analytics.track('Checkout Started', {
          revenue: 9.99
        });
        sinon.assert.calledWith(window.optimizelyEdge.push, {
          type: 'event',
          eventName: 'Checkout Started',
          tags: {
            revenue: 999
          }
        });
      });
    });

    context('options.listen', function() {
      beforeEach(function() {
        optimizely.options.listen = true;
        sinon.stub(analytics, 'track');
      });

      it('should send standard active experiment data via `.track()`', function(done) {
        // Mock data by default has two active campaign/experiments.
        // Going to leave just the one that was created as a standard
        // experiment inside Optimizely X (not campaign)
        window.optimizelyEdge.edgeMockData[1111182111].isActive = false;
        analytics.initialize();
        executeAsyncTest(done, function() {
          assert.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              experimentId: '7547682694',
              experimentName: 'Worlds Group Stage',
              variationId: '7557950020',
              variationName: 'Variation #1'
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      // Edge does not have a way to retrieve redirect info
      it.skip('should send redirect experiment data via `.track()`', function(done) {
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
          assert.deepEqual(analytics.track.args[0], [
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
        window.optimizelyEdge.edgeMockData[7547682694] = false;
        optimizely.options.nonInteraction = true;
        analytics.initialize();
        executeAsyncTest(done, function() {
          console.log(analytics.track.args[0]);

          assert.deepEqual(analytics.track.args[0], [
            'Experiment Viewed',
            {
              experimentId: '1111182111',
              experimentName: 'Coding Bootcamp',
              variationId: '7333333333',
              variationName: 'Variation DBC',
              nonInteraction: 1
            },
            { integration: optimizelyContext }
          ]);
        });
      });

      it('should not send inactive experiments', function(done) {
        // deactivate all experiments
        window.optimizelyEdge.edgeMockData[7522212694].isActive = false;
        window.optimizelyEdge.edgeMockData[7547682694].isActive = false;
        window.optimizelyEdge.edgeMockData[1111182111].isActive = false;
        analytics.initialize();
        executeAsyncTest(done, function() {
          sinon.assert.notCalled(analytics.track);
        });
      });
    });
  });

  describe('#track', function() {
    beforeEach(function() {
      analytics.initialize();
    });

    context('when Optimizely Web is implemented', function() {
      beforeEach(function() {
        window.optimizely = {
          push: sinon.stub()
        };
      });

      it('should send an event', function() {
        analytics.track('event');
        sinon.assert.calledWith(window.optimizely.push, {
          type: 'event',
          eventName: 'event',
          tags: {}
        });
      });

      it('should replace colons with underscore in eventName', function() {
        analytics.track('event:foo:bar');
        sinon.assert.calledWith(window.optimizely.push, {
          type: 'event',
          eventName: 'event_foo_bar',
          tags: {}
        });
      });

      it('should send all additional properties along as tags', function() {
        analytics.track('event', { id: 'c00lHa$h', name: 'jerry' });
        sinon.assert.calledWith(window.optimizely.push, {
          type: 'event',
          eventName: 'event',
          tags: { id: 'c00lHa$h', name: 'jerry' }
        });
      });

      it('should change revenue to cents and include in tags', function() {
        analytics.track('Order Completed', { revenue: 9.99 });
        sinon.assert.calledWith(window.optimizely.push, {
          type: 'event',
          eventName: 'Order Completed',
          tags: { revenue: 999 }
        });
      });

      it('should round the revenue value to an integer value if passed in as a floating point number', function() {
        analytics.track('Order Completed', { revenue: 534.3099999999999 });
        sinon.assert.calledWith(window.optimizely.push, {
          type: 'event',
          eventName: 'Order Completed',
          tags: { revenue: 53431 }
        });
      });
    });

    context('when Optimizely Edge microsnippet is initialized', function() {
      beforeEach(function() {
        window.optimizelyEdge = {
          push: sinon.stub()
        };
        window.optimizely = {
          push: sinon.stub()
        };
      });

      afterEach(function() {
        delete window.optimizelyEdge;
      });

      it('should send an event', function() {
        analytics.track('event');
        sinon.assert.calledWith(window.optimizelyEdge.push, {
          type: 'event',
          eventName: 'event',
          tags: {}
        });

        // does not send a duplicate event under Web
        sinon.assert.notCalled(window.optimizely.push);
      });
    });

    context('when Optimizely Full Stack is implemented', function() {
      beforeEach(function() {
        window.optimizelyClientInstance = {
          track: sinon.stub()
        };
      });

      it('should send an event through the Optimizely X Full Stack JS SDK using the logged in user', function() {
        analytics.identify('user1');
        analytics.track('event', { purchasePrice: 9.99, property: 'foo' });
        sinon.assert.calledWith(
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
        sinon.assert.calledWith(
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
          {
            Optimizely: { userId: 'user1', attributes: { country: 'usa' } }
          }
        );
        sinon.assert.calledWith(
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
          {
            Optimizely: { userId: 'user1', attributes: { country: 'usa' } }
          }
        );
        sinon.assert.calledWith(
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
          {
            Optimizely: { userId: 'user1', attributes: { country: 'usa' } }
          }
        );
        sinon.assert.calledWith(
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
          {
            Optimizely: { userId: 'user1', attributes: { country: 'usa' } }
          }
        );
        sinon.assert.calledWith(
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
    beforeEach(function() {
      analytics.initialize();
    });

    context('when Optimizely Web is implemented', function() {
      beforeEach(function() {
        window.optimizely = {
          push: sinon.stub()
        };
      });

      it('should send an event for a named page', function() {
        var referrer = window.document.referrer;
        analytics.page('Home');
        sinon.assert.calledWith(window.optimizely.push, {
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
        sinon.assert.calledWith(window.optimizely.push, {
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
