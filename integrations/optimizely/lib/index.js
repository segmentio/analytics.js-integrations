'use strict';

/**
 * Module dependencies.
 */

var keys = require('@ndhoule/keys');
var values = require('@ndhoule/values');
var foldl = require('@ndhoule/foldl');
var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('optimizely', { wrap: false });
var edgePush = require('global-queue')('optimizelyEdge', { wrap: false });
var tick = require('next-tick');

/**
 * Expose `Optimizely` integration.
 */

var Optimizely = (module.exports = integration('Optimizely')
  .option('trackCategorizedPages', true)
  .option('trackNamedPages', true)
  .option('variations', false) // send data via `.identify()`
  .option('listen', true) // send data via `.track()`
  .option('nonInteraction', false)
  .option('sendRevenueOnlyForOrderCompleted', true));

/**
 * The name and version for this integration.
 */

var optimizelyContext = {
  name: 'optimizely',
  version: '2.0.0'
};

/**
 * Initialize.
 *
 * @api public
 */

Optimizely.prototype.initialize = function() {
  var self = this;
  window.optimizelyEdge.push({
    type: 'addListener',
    filter: {
      type: 'lifecycle',
      name: 'initialized'
    },
    handler: function() {
      // Initialize the Edge integration if that hasn't been done already
      if (window.optimizelyEdge && window.optimizelyEdge.get) {
        edgePush({
          type: 'integration',
          // Flag source of integration (requested by Optimizely)
          OAuthClientId: '5360906403'
        });

        // Initialize listeners for Optimizely Edge decisions.
        // We're calling this on the next tick to be safe so we don't hold up
        // initializing the integration even though the function below is designed to be async,
        // just want to be extra safe
        tick(function() {
          self.initEdgeIntegration();
        });
      }
    }
  });

  window.optimizely.push({
    type: 'addListener',
    filter: {
      type: 'lifecycle',
      name: 'initialized'
    },
    handler: function() {
      // We have to check this because Edge microsnippets currently process
      // window.optimizely calls and not just window.optimizelyEdge calls.
      if (window.optimizelyEdge && window.optimizelyEdge.get) {
        // Initialize the Edge integration if that hasn't been done already
        edgePush({
          type: 'integration',
          // Flag source of integration (requested by Optimizely)
          OAuthClientId: '5360906403'
        });

        // Initialize listeners for Optimizely Edge decisions.
        // We're calling this on the next tick to be safe so we don't hold up
        // initializing the integration even though the function below is designed to be async,
        // just want to be extra safe
        tick(function() {
          self.initEdgeIntegration();
        });
      } else if (window.optimizely && window.optimizely.get) {
        // Initialize the Web integration
        push({
          type: 'integration',
          // Flag source of integration (requested by Optimizely)
          OAuthClientId: '5360906403'
        });

        // Initialize listeners for Optimizely Web decisions.
        // We're calling this on the next tick to be safe so we don't hold up
        // initializing the integration even though the function below is designed to be async,
        // just want to be extra safe
        tick(function() {
          self.initWebIntegration();
        });
      }
    }
  });
  this.ready();
};

/**
 * Track.
 *
 * If Optimizely Web or Optimizely Edge is implemented on the page, its JS API can accept a custom event.
 * https://docs.developers.optimizely.com/web/docs/event
 * https://docs.developers.optimizely.com/performance-edge/reference/event
 *
 * If the Optimizely Full Stack JavaScript SDK is initialized on the page, its API can also accept a custom event.
 * Any properties in the track object will be passed along as event tags.
 * If the userId is not passed into the options object of the track call, we'll
 * attempt to use the userId of the track event, which is set using the analytics.identify call.
 * https://docs.developers.optimizely.com/full-stack/docs/track-javascript
 *
 * @api public
 * @param {Track} track
 */

Optimizely.prototype.track = function(track) {
  var opts = this.options;
  var eventProperties = track.properties();

  // Optimizely expects revenue only passed through Order Completed events
  if (eventProperties.revenue && opts.sendRevenueOnlyForOrderCompleted) {
    if (track.event() === 'Order Completed') {
      eventProperties.revenue = Math.round(eventProperties.revenue * 100);
    } else if (track.event() !== 'Order Completed') {
      delete eventProperties.revenue;
    }
    // This is legacy Segment-Optimizely behavior,
    // which passes revenue whenever it is present
  } else if (
    opts.sendRevenueOnlyForOrderCompleted === false &&
    eventProperties.revenue
  ) {
    eventProperties.revenue = Math.round(eventProperties.revenue * 100);
  }

  var eventName = track.event().replace(/:/g, '_'); // can't have colons so replacing with underscores
  var payload = {
    type: 'event',
    eventName: eventName,
    tags: eventProperties
  };

  if (window.optimizelyEdge && window.optimizelyEdge.get) {
    // Track via Optimizely Edge
    edgePush(payload);
  } else {
    // Track via Optimizely Web
    push(payload);
  }

  // Track via Optimizely Full Stack
  var optimizelyClientInstance = window.optimizelyClientInstance;
  if (optimizelyClientInstance && optimizelyClientInstance.track) {
    var optimizelyOptions = track.options('Optimizely');
    var userId =
      optimizelyOptions.userId || track.userId() || this.analytics.user().id();
    var attributes =
      optimizelyOptions.attributes ||
      track.traits() ||
      this.analytics.user().traits();
    if (userId) {
      optimizelyClientInstance.track(
        eventName,
        userId,
        attributes,
        payload.tags
      );
    }
  }
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Optimizely.prototype.page = function(page) {
  var category = page.category();
  var name = page.fullName();
  var opts = this.options;

  // categorized pages
  if (category && opts.trackCategorizedPages) {
    this.track(page.track(category));
  }

  // named pages
  if (name && opts.trackNamedPages) {
    this.track(page.track(name));
  }
};

/**
 * sendWebDecisionToSegment (Optimizely X)
 *
 * This function is called for each experiment created in New Optimizely that are running on the page.
 * New Optimizely added a dimension called "Campaigns" that encapsulate over the Experiments. So a campaign can have multiple experiments.
 * Multivariate experiments are no longer supported in New Optimizely.
 * This function will also be executed for any experiments activated at a later stage since initWebIntegration
 * attached listeners on the page
 *
 * @api private
 * @param {Object} campaignState: contains all information regarding experiments and campaign
 * @param {String} campaignState.id: the ID of the campaign
 * @param {String} campaignState.campaignName: the name of the campaign
 * @param {Array} campaignState.audiences: "Audiences" the visitor is considered part of related to this campaign
 * @param {String} campaignState.audiences[].id: the id of the Audience
 * @param {String} campaignState.audiences[].name: the name of the Audience
 * @param {Object} campaignState.experiment: the experiment the visitor is seeing
 * @param {String} campaignState.experiment.id: the id of the experiment
 * @param {String} campaignState.experiment.name: the name of the experiment
 * @param {String} campaignState.experiment.referrer: the effective referrer of the experiment (only defined for redirect)
 * @param {Object} campaignState.variation: the variation the visitor is seeing
 * @param {String} campaignState.variation.id: the id of the variation
 * @param {String} campaignState.variation.name: the name of the variation
 * @param {String} campaignState.isInCampaignHoldback: whether the visitor is in the Campaign holdback
 */
Optimizely.prototype.sendWebDecisionToSegment = function(campaignState) {
  var experiment = campaignState.experiment;
  var variation = campaignState.variation;
  var context = { integration: optimizelyContext }; // backward compatibility

  // Reformatting this data structure into hash map so concatenating variation ids and names is easier later
  var audiencesMap = foldl(
    function(results, audience) {
      var res = results;
      res[audience.id] = audience.name;
      return res;
    },
    {},
    campaignState.audiences
  );

  // Sorting for consistency across browsers
  var audienceIds = keys(audiencesMap)
    .sort()
    .join(); // Not adding space for backward compat/consistency reasons since all IDs we've never had spaces
  var audienceNames = values(audiencesMap)
    .sort()
    .join(', ');

  // Send data via `.track()`
  if (this.options.listen) {
    var props = {
      campaignName: campaignState.campaignName,
      campaignId: campaignState.id,
      experimentId: experiment.id,
      experimentName: experiment.name,
      variationName: variation.name,
      variationId: variation.id,
      audienceId: audienceIds, // eg. '7527562222,7527111138'
      audienceName: audienceNames, // eg. 'Peaky Blinders, Trust Tree'
      isInCampaignHoldback: campaignState.isInCampaignHoldback
    };

    if (this.redirectInfo) {
      // Legacy. It's more accurate to use context.page.referrer or window.optimizelyEffectiveReferrer.
      // TODO: Maybe only set this if experiment.id matches this.redirectInfo.experimentId?
      props.referrer = this.redirectInfo.referrer;

      context.page = { referrer: this.redirectInfo.referrer };
    }

    // For Google's nonInteraction flag
    if (this.options.nonInteraction) props.nonInteraction = 1;

    // Send to Segment
    this.analytics.track('Experiment Viewed', props, context);
  }

  // Send data via `.identify()` (not recommended!)
  // TODO: deprecate this feature
  if (this.options.variations) {
    // Legacy: We never sent any experiment Id or variation Id
    // Note: The only "breaking" behavior is that now there will be an `.identify()` per active experiment
    // Legacy behavior was that we would look up all active experiments on the page after init and send one `.identify()` call
    // with all experiment/variation data as traits.
    // New behavior will call `.identify()` per active experiment with isolated experiment/variation data for that single experiment
    var traits = {};
    traits['Experiment: ' + experiment.name] = variation.name;

    // Send to Segment
    this.analytics.identify(traits);
  }
};

/**
 * sendEdgeExperimentToSegment (Optimizely Performance Edge)
 *
 * This function is called for each experiment created in Performance Edge that are running on the page.
 * This function will also be executed for any experiments activated at a later stage since initEdgeIntegration
 * attached listeners on the page. Currently, those listeners leverage the Web API.
 * @api private
 * @param {Object} experimentState
 * @param {String} experimentState.id
 * @param {String} experimentState.name
 * @param {Object} experimentState.variation
 * @param {String} experimentState.variation.id
 * @param {String} experimentState.variation.name
 */
Optimizely.prototype.sendEdgeExperimentToSegment = function(experimentState) {
  var variation = experimentState.variation;
  var context = { integration: optimizelyContext }; // backward compatibility

  // Send data via `.track()`
  if (this.options.listen) {
    var props = {
      experimentId: experimentState.id,
      experimentName: experimentState.name,
      variationName: variation.name,
      variationId: variation.id
    };

    // For Google's nonInteraction flag
    if (this.options.nonInteraction) props.nonInteraction = 1;

    // Send to Segment
    this.analytics.track('Experiment Viewed', props, context);
  }
};

/**
 * setRedirectInfo
 *
 * This function is called when a redirect experiment changed the effective referrer value where it is different from the `document.referrer`.
 * This is a documented caveat for any mutual customers that are using redirect experiments.
 * We will set this global variable that Segment customers can lookup and pass down in their initial `.page()` call inside
 * their Segment snippet.
 *
 * @apr private
 * @param {Object?} redirectInfo
 * @param {String} redirectInfo.experimentId
 * @param {String} redirectInfo.variationId
 * @param {String} redirectInfo.referrer
 */
Optimizely.prototype.setRedirectInfo = function(redirectInfo) {
  if (redirectInfo) {
    this.redirectInfo = redirectInfo;
    window.optimizelyEffectiveReferrer = redirectInfo.referrer;
  }
};

/**
 * This function fetches all active Optimizely Web campaigns and experiments,
 * invoking the sendWebDecisionToSegment callback for each one.
 *
 * @api private
 */
Optimizely.prototype.initWebIntegration = function() {
  var self = this;

  /**
   * If the visitor got to the current page via an Optimizely redirect variation,
   * record the "effective referrer", i.e. the URL that referred the visitor to the
   * _pre-redirect_ page.
   */
  var checkReferrer = function() {
    var state = window.optimizely.get && window.optimizely.get('state');
    if (state) {
      self.setRedirectInfo(state.getRedirectInfo());
    } else {
      push({
        type: 'addListener',
        filter: {
          type: 'lifecycle',
          name: 'initialized'
        },
        handler: function() {
          state = window.optimizely.get && window.optimizely.get('state');
          if (state) {
            self.setRedirectInfo(state.getRedirectInfo());
          }
        }
      });
    }
  };

  /**
   * A campaign or experiment can be activated after we have initialized.
   * This function registers a listener that listens to newly activated campaigns and
   * handles them.
   */
  var registerFutureActiveCampaigns = function() {
    push({
      type: 'addListener',
      filter: {
        type: 'lifecycle',
        name: 'campaignDecided'
      },
      handler: function(event) {
        var campaignId = event.data.campaign.id;
        var state = window.optimizely.get && window.optimizely.get('state');
        if (!state) {
          return;
        }
        // Make sure the campaign actually activated (rather than producing a null decision)
        var activeCampaigns = state.getCampaignStates({ isActive: true });
        if (!activeCampaigns[campaignId]) {
          return;
        }
        self.sendWebDecisionToSegment(activeCampaigns[campaignId]);
      }
    });
  };

  /**
   * If this code is running after Optimizely on the page, there might already be
   * some campaigns or experiments active. This function retrieves and handlers them.
   */
  var registerCurrentlyActiveCampaigns = function() {
    window.optimizely = window.optimizely || [];
    var state = window.optimizely.get && window.optimizely.get('state');
    if (state) {
      var activeCampaigns = state.getCampaignStates({
        isActive: true
      });
      each(function(campaignState) {
        self.sendWebDecisionToSegment(campaignState);
      }, activeCampaigns);
    }
  };

  checkReferrer();
  registerCurrentlyActiveCampaigns();
  registerFutureActiveCampaigns();
};

/**
 * This function fetches all active Optimizely Performance Edge experiments,
 * invoking the sendEdgeExperimentToSegment callback for each one.
 *
 * @api private
 */
Optimizely.prototype.initEdgeIntegration = function() {
  var self = this;

  /**
   * At any moment, a new Edge experiment can be activated (manual or conditional activation).
   * This function registers a listener that listens to newly activated Edge experiment and
   * handles them.
   *
   * However, the Edge API does not support a 'campaignDecided' listener. For now, we can
   * utilize the Web API to listen to newly activated Edge experiments.
   */
  var registerFutureActiveEdgeExperiment = function() {
    edgePush({
      type: 'addListener',
      filter: {
        type: 'lifecycle',
        name: 'campaignDecided'
      },
      handler: function(event) {
        var experimentId = event.data.decision.experimentId;
        if (experimentId && event.data.decision.variationId) {
          var edgeState =
            window.optimizelyEdge.get && window.optimizelyEdge.get('state');
          if (edgeState) {
            var allActiveExperiments = edgeState.getActiveExperiments();
            var experimentState = allActiveExperiments[experimentId];
            if (experimentState) {
              self.sendEdgeExperimentToSegment(experimentState);
            }
          }
        }
      }
    });
  };

  /**
   * If this code is running after Optimizely on the page, there might already be
   * some experiments active. This function makes sure all those experiments are
   * handled.
   */
  var registerCurrentlyActiveEdgeExperiment = function() {
    window.optimizelyEdge = window.optimizelyEdge || [];
    var edgeState =
      window.optimizelyEdge.get && window.optimizelyEdge.get('state');
    if (edgeState) {
      var activeExperiments = edgeState.getActiveExperiments();

      each(function(experimentState) {
        if (experimentState) {
          self.sendEdgeExperimentToSegment(experimentState);
        }
      }, activeExperiments);
    }
  };

  // Normally, we would like to check referrer info, but we don't provide
  // a 'getRedirectInfo' API in Edge. We will skip checking if an
  // experiment is from a redirect.
  //
  // Additionally, because a page event requires redirect info,
  // we will not be sending such event.
  registerCurrentlyActiveEdgeExperiment();
  registerFutureActiveEdgeExperiment();
};
