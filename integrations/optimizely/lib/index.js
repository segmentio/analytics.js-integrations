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

var Optimizely = (module.exports = integration('Optimizely')
  .option('trackCategorizedPages', true)
  .option('trackNamedPages', true)
  .option('variations', false) // send data via `.identify()`
  .option('listen', true) // send data via `.track()`
  .option('nonInteraction', false)
  .option('sendRevenueOnlyForOrderCompleted', true)
);

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
  // Flag source of integration (requested by Optimizely)
  push({
    type: 'integration',
    OAuthClientId: '5360906403'
  });
  // Initialize listeners for Optimizely Web decisions.
  // We're caling this on the next tick to be safe so we don't hold up
  // initializing the integration even though the function below is designed to be async,
  // just want to be extra safe
  tick(function() {
    this.initWebIntegration();
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

  // Track via Optimizely Web
  push(payload);

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
 * @param {String} id
 * @param {String|undefined} referrer
 */

Optimizely.prototype.sendWebDecisionToSegment = function(id, referrer) {
  var state = window.optimizely.get && window.optimizely.get('state');
  if (!state) {
    return;
  }

  var activeCampaigns = state.getCampaignStates({
    isActive: true
  });
  var campaignState = activeCampaigns[id];
  // Legacy. It's more accurate to use on context.page.referrer or window.optimizelyEffectiveReferrer.
  if (referrer) campaignState.experiment.referrer = referrer;

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
  if (referrer) {
    window.optimizelyEffectiveReferrer = referrer;
    return referrer;
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

  var checkReferrer = function() {
    var state = window.optimizely.get && window.optimizely.get('state');
    if (state) {
      var referrer =
        state.getRedirectInfo() && state.getRedirectInfo().referrer;

      if (referrer) {
        self.setEffectiveReferrer(referrer);
        return referrer; // Segment added code: so I can pass this referrer value in cb
      }
    }
  };

  /**
   * A campaign or experiment can be activated after we have initialized.
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
        self.sendWebDecisionToSegment(id);
      }
    });
  };

  /**
   * If this code is running after Optimizely on the page, there might already be
   * some campaigns or experiments active. This function retrieves and handlers them.
   *
   * This function also checks for an effective referrer if the visitor got to the current
   * page via an Optimizely redirect variation.
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
          if (referrer) {
            self.sendWebDecisionToSegment(id, referrer);
          } else {
            self.sendWebDecisionToSegment(id);
          }
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
