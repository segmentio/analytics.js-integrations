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
var tick = require('next-tick');

/**
 * Expose `Optimizely` integration.
 */

var Optimizely = module.exports = integration('Optimizely')
  .option('trackCategorizedPages', true)
  .option('trackNamedPages', true)
  .option('variations', false) // send data via `.identify()`
  .option('listen', true) // send data via `.track()`
  .option('nonInteraction', false)
  .option('sendRevenueOnlyForOrderCompleted', true);

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
 * https://www.optimizely.com/docs/api#function-calls
 * https://jsfiddle.net/ushmw723/ <- includes optimizely snippets for capturing campaign and experiment data
 *
 * @api public
 */

Optimizely.prototype.initialize = function() {
  var self = this;
  // Flag source of integration (requested by Optimizely)
  push({
    type: 'integration',
    OAuthClientId: '5360906403'
  });
  // Initialize listeners for both Classic and New Optimizely
  // crazying binding because that's just how javascript works
  // We're caling this on the next tick to be safe so we don't hold up
  // initializing the integration even though the function below is designed to be async,
  // just want to be extra safe
  tick(function() {
    Optimizely.initOptimizelyIntegration({
      referrerOverride: self.setEffectiveReferrer.bind(self),
      sendExperimentData: self.sendClassicDataToSegment.bind(self),
      sendCampaignData: self.sendNewDataToSegment.bind(self)
    });
  });

  this.ready();
};

/**
 * Track. The Optimizely X Web event API accepts a single payload object.
 *        It works with Classic Optimizely as well.
 *
 * Optimizely X:  https://developers.optimizely.com/x/solutions/javascript/reference/index.html#function_setevent
 *
 * The new-style X API is forward compatible from Optimizely Classic to Optimizely X.
 *   - Classic will correctly consume the tags object to identify the revenue
 *   - In bundled mode, it will be forwarded along to the X API with the entire payload
 *
 * If the Optimizely X Fullstack JavaScript SDK is being used we should pass along
 * the event to it. Any properties in the track object will be passed along as event tags.
 * If the userId is not passed into the options object of the track call, we'll
 * attempt to use the userId of the track event, which is set using the analytics.identify call.
 *
 * https://developers.optimizely.com/x/solutions/sdks/reference/?language=javascript#tracking
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
  } else if (opts.sendRevenueOnlyForOrderCompleted === false && eventProperties.revenue) {
    eventProperties.revenue = Math.round(eventProperties.revenue * 100);
  }

  // Use the new-style API (which is compatible with Classic and X)
  var eventName = track.event().replace(/:/g, '_'); // can't have colons so replacing with underscores
  var payload = {
    type: 'event',
    eventName: eventName,
    tags: eventProperties
  };

  push(payload);

  var optimizelyClientInstance = window.optimizelyClientInstance;
  if (optimizelyClientInstance && optimizelyClientInstance.track) {
    var optimizelyOptions = track.options('Optimizely');
    var userId = optimizelyOptions.userId || track.userId() || this.analytics.user().id();
    var attributes = optimizelyOptions.attributes || track.traits() || this.analytics.user().traits();
    if (userId) {
      optimizelyClientInstance.track(eventName, userId, attributes, payload.tags);
    }
  }
};

/**
 * Page.
 *
 * https://www.optimizely.com/docs/api#track-event
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
 * sendClassicDataToSegment (Optimizely Classic)
 *
 * This function is executed for each experiment created in Classic Optimizely that is running on the page.
 * This function will also be executed for any experiments activated at a later stage since initOptimizelyIntegration
 * attached listeners on the page
 *
 * @api private
 * @param {Object} experimentState: contains all information regarding experiments
 * @param {Object} experimentState.experiment: the experiment running on the page
 * @param {String} experimentState.experiment.name: name of the experiment
 * @param {String} experimentState.experiment.id: ID of the experiment
 * @param {String} experimentState.experiment.referrer: available if effective referrer if experiment is a redirect
 * @param {Array} experimentState.variations: the variations the current user on page is seeing
 * @param {String} experimentState.variations[].name: the name of the variation
 * @param {String} experimentState.variations[].id: the ID of the variation
 * @param {Object} experimentState.sections: the sections for the experiment (only defined for multivariate experiments) keyed by sectionId
 * @param {String} experimentState.sections[sectionId].name: the name of section
 * @param {Array} experimentState.sections[sectionId].variation_ids: the IDs of the variations in the section
 *
 */

Optimizely.prototype.sendClassicDataToSegment = function(experimentState) {
  var experiment = experimentState.experiment;
  var variations = experimentState.variations;
  var sections = experimentState.sections;
  var context = { integration: optimizelyContext }; // backward compatibility

  // Reformatting this data structure into hash map so concatenating variation ids and names is easier later
  var variationsMap = foldl(function(results, variation) {
    results[variation.id] = variation.name;
    return results;
  }, {}, variations);

  // Sorting for consistency across browsers
  var variationIds = keys(variationsMap).sort();
  var variationNames = values(variationsMap).sort();

  // Send data via `.track()`
  if (this.options.listen) {
    var props = {
      experimentId: experiment.id,
      experimentName: experiment.name,
      variationId: variationIds.join(), // eg. '123' or '123,455'
      variationName: variationNames.join(', ') // eg. 'Variation X' or 'Variation 1, Variation 2'
    };

    // If this was a redirect experiment and the effective referrer is different from document.referrer,
    // this value is made available. So if a customer came in via google.com/ad -> tb12.com -> redirect experiment -> Belichickgoat.com
    // `experiment.referrer` would be google.com/ad here NOT `tb12.com`.
    if (experiment.referrer) {
      props.referrer = experiment.referrer;
      context.page = { referrer: experiment.referrer };
    }

    // When there is a multivariate experiment
    if (sections) {
      // Since `sections` include all the possible sections on the page, we need to find the names of the sections
      // if any of its variations were used. Experiments could display variations from multiple sections.
      // The global optimizely data object does not expose a mapping between which section(s) were involved within an experiment.
      // So we will build our own mapping to quickly get the section name(s) and id(s) for any displayed variation.
      var activeSections = {};
      var variationIdsToSectionsMap = foldl(function(results, section, sectionId) {
        each(function(variationId) {
          results[variationId] = { id: sectionId, name: section.name };
        }, section.variation_ids);
        return results;
      }, {}, sections);
      for (var j = 0; j < variationIds.length; j++) {
        var activeVariation = variationIds[j];
        var activeSection = variationIdsToSectionsMap[activeVariation];
        if (activeSection) activeSections[activeSection.id] = activeSection.name;
      }

      // Sorting for consistency across browsers
      props.sectionId = keys(activeSections).sort().join(); // Not adding space for backward compat/consistency reasons since all IDs we've never had spaces
      props.sectionName = values(activeSections).sort().join(', ');
    }

    // For Google's nonInteraction flag
    if (this.options.nonInteraction) props.nonInteraction = 1;

    // Send to Segment
    this.analytics.track('Experiment Viewed', props, context);
  }

  // Send data via `.identify()` (not recommended!)
  // TODO: deprecate this feature
  if (this.options.variations) {
    // Note: The only "breaking" behavior is that now there will be an `.identify()` call per active experiment
    // Legacy behavior was that we would look up all active experiments on the page after init and send one `.identify()` call
    // with all experiment/variation data as traits.
    // New behavior will call `.identify()` per active experiment with isolated experiment/variation data for that single experiment
    // However, since traits are cached, subsequent experiments that trigger `.identify()` calls will likely contain previous experiment data
    var traits = {};
    traits['Experiment: ' + experiment.name] = variationNames.join(', '); // eg. 'Variation X' or 'Variation 1, Variation 2'

    // Send to Segment
    this.analytics.identify(traits);
  }
};

/**
 * sendNewDataToSegment (Optimizely X)
 *
 * This function is called for each experiment created in New Optimizely that are running on the page.
 * New Optimizely added a dimension called "Campaigns" that encapsulate over the Experiments. So a campaign can have multiple experiments.
 * Multivariate experiments are no longer supported in New Optimizely.
 * This function will also be executed for any experiments activated at a later stage since initOptimizelyIntegration
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

Optimizely.prototype.sendNewDataToSegment = function(campaignState) {
  var experiment = campaignState.experiment;
  var variation = campaignState.variation;
  var context = { integration: optimizelyContext }; // backward compatibility

  // Reformatting this data structure into hash map so concatenating variation ids and names is easier later
  var audiencesMap = foldl(function(results, audience) {
    results[audience.id] = audience.name;
    return results;
  }, {}, campaignState.audiences);

  // Sorting for consistency across browsers
  var audienceIds = keys(audiencesMap).sort().join(); // Not adding space for backward compat/consistency reasons since all IDs we've never had spaces
  var audienceNames = values(audiencesMap).sort().join(', ');

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

    // If this was a redirect experiment and the effective referrer is different from document.referrer,
    // this value is made available. So if a customer came in via google.com/ad -> tb12.com -> redirect experiment -> Belichickgoat.com
    // `experiment.referrer` would be google.com/ad here NOT `tb12.com`.
    if (experiment.referrer) {
      props.referrer = experiment.referrer;
      context.page = { referrer: experiment.referrer };
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
 * setEffectiveReferrer
 *
 * This function is called when a redirect experiment changed the effective referrer value where it is different from the `document.referrer`.
 * This is a documented caveat for any mutual customers that are using redirect experiments.
 * We will set this global variable that Segment customers can lookup and pass down in their initial `.page()` call inside
 * their Segment snippet.
 *
 * @apr private
 * @param {string} referrer
 */

Optimizely.prototype.setEffectiveReferrer = function(referrer) {
  if (referrer) return window.optimizelyEffectiveReferrer = referrer;
};

/**
 * initOptimizelyIntegration(handlers)
 *
 * This function was provided by Optimizely's Engineering team. The function below once initialized can detect which version of
 * Optimizely a customer is using and call the appropriate callback functions when an experiment runs on the page.
 * Instead of Segment looking up the experiment data, we can now just bind Segment APIs to their experiment listener/handlers!
 *
 * @api private
 * @param {Object} handlers
 * @param {Function} referrerOverride: called if the effective refferer value differs from the current `document.referrer` due to a
 * invocation of a redirect experiment on the page
 * @param {Function} sendExperimentData: called for every running experiment on the page (Classic)
 * @param {Function} sendCampaignData: called for every running campaign on the page (New)
 */

Optimizely.initOptimizelyIntegration = function(handlers) {
  /**
   * `initClassicOptimizelyIntegration` fetches all the experiment data from the classic Optimizely client
   * and calls the functions provided in the arguments with the data that needs to
   * be used for sending information. It is recommended to leave this function as is
   * and to create your own implementation of the functions referrerOverride and
   * sendExperimentData.
   *
   * @param {Function} referrerOverride - This function is called if the effective referrer value differs from
   *   the current document.referrer value. The only argument provided is the effective referrer value.
   * @param {Function} sendExperimentData - This function is called for every running experiment on the page.
   *   The function is called with all the relevant ids and names.
   */
  var initClassicOptimizelyIntegration = function(referrerOverride, sendExperimentData) {
    var data = window.optimizely && window.optimizely.data;
    var state = data && data.state;
    if (state) {
      var activeExperiments = state.activeExperiments;
      if (state.redirectExperiment) {
        var redirectExperimentId = state.redirectExperiment.experimentId;
        var index = -1;
        for (var i = 0; i < state.activeExperiments.length; i++) {
          if (state.activeExperiments[i] === redirectExperimentId) {
            index = i;
            break;
          }
        }
        if (index === -1) {
          activeExperiments.push(redirectExperimentId);
        }
        referrerOverride(state.redirectExperiment.referrer);
      }

      for (var k = 0; k < activeExperiments.length; k++) {
        var currentExperimentId = activeExperiments[k];
        var activeExperimentState = {
          experiment: {
            id: currentExperimentId,
            name: data.experiments[currentExperimentId].name
          },
          variations: [],
          /** Segment added code */
          // we need to send sectionName for multivariate experiments
          sections: data.sections
          /**/
        };

        /** Segment added code */
        // for backward compatability since we send referrer with the experiment properties
        if (state.redirectExperiment && currentExperimentId === redirectExperimentId && state.redirectExperiment.referrer) {
          activeExperimentState.experiment.referrer = state.redirectExperiment.referrer;
        }
        /**/

        var variationIds = state.variationIdsMap[activeExperimentState.experiment.id];
        for (var j = 0; j < variationIds.length; j++) {
          var id = variationIds[j];
          var name = data.variations[id].name;
          activeExperimentState.variations.push({
            id: id,
            name: name
          });
        }
        sendExperimentData(activeExperimentState);
      }
    }
  };

  /**
   * This function fetches all the campaign data from the new Optimizely client
   * and calls the functions provided in the arguments with the data that needs to
   * be used for sending information. It is recommended to leave this function as is
   * and to create your own implementation of the functions referrerOverride and
   * sendCampaignData.
   *
   * @param {Function} referrerOverride - This function is called if the effective referrer value differs from
   *   the current document.referrer value. The only argument provided is the effective referrer value.
   * @param {Function} sendCampaignData - This function is called for every running campaign on the page.
   *   The function is called with the campaignState for the activated campaign
   */
  var initNewOptimizelyIntegration = function(referrerOverride, sendCampaignData) {
    var newActiveCampaign = function(id, referrer) {
      var state = window.optimizely.get && window.optimizely.get('state');
      if (state) {
        var activeCampaigns = state.getCampaignStates({
          isActive: true
        });
        var campaignState = activeCampaigns[id];
        // Segment added code: in case this is a redirect experiment
        if (referrer) campaignState.experiment.referrer = referrer;
        sendCampaignData(campaignState);
      }
    };

    var checkReferrer = function() {
      var state = window.optimizely.get && window.optimizely.get('state');
      if (state) {
        var referrer = state.getRedirectInfo() && state.getRedirectInfo().referrer;

        if (referrer) {
          referrerOverride(referrer);
          return referrer; // Segment added code: so I can pass this referrer value in cb
        }
      }
    };

    /**
     * At any moment, a new campaign can be activated (manual or conditional activation).
     * This function registers a listener that listens to newly activated campaigns and
     * handles them.
     */
    var registerFutureActiveCampaigns = function() {
      window.optimizely = window.optimizely || [];
      window.optimizely.push({
        type: 'addListener',
        filter: {
          type: 'lifecycle',
          name: 'campaignDecided'
        },
        handler: function(event) {
          var id = event.data.campaign.id;
          newActiveCampaign(id);
        }
      });
    };

    /**
     * If this code is running after Optimizely on the page, there might already be
     * some campaigns active. This function makes sure all those campaigns are
     * handled.
     */
    var registerCurrentlyActiveCampaigns = function() {
      window.optimizely = window.optimizely || [];
      var state = window.optimizely.get && window.optimizely.get('state');
      if (state) {
        var referrer = checkReferrer();
        var activeCampaigns = state.getCampaignStates({
          isActive: true
        });
        for (var id in activeCampaigns) {
          if ({}.hasOwnProperty.call(activeCampaigns, id)) {
            // Segment modified code: need to pass down referrer in the cb for backward compat reasons
            referrer ? newActiveCampaign(id, referrer) : newActiveCampaign(id);
          }
        }
      } else {
        window.optimizely.push({
          type: 'addListener',
          filter: {
            type: 'lifecycle',
            name: 'initialized'
          },
          handler: function() {
            checkReferrer();
          }
        });
      }
    };
    registerCurrentlyActiveCampaigns();
    registerFutureActiveCampaigns();
  };

  initClassicOptimizelyIntegration(handlers.referrerOverride, handlers.sendExperimentData);
  initNewOptimizelyIntegration(handlers.referrerOverride, handlers.sendCampaignData);
};
