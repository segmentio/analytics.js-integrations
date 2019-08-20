/* eslint-disable strict */

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var tick = require('next-tick');

/**
 * Expose `VWO` integration.
 */

var VWO = module.exports = integration('Visual Website Optimizer')
  .global('_vis_opt_queue')
  .global('_vis_opt_revenue_conversion')
  .global('_vwo_exp')
  .global('_vwo_exp_ids')
  .option('accountId')
  .option('useAsyncSmartCode', false)
  .option('settingsTolerance', 2000)
  .option('libraryTolerance', 2500)
  .option('useExistingJQuery', false)
  .option('replay', true)
  .option('listen', false)
  .option('experimentNonInteraction', false);

/**
 * The context for this integration.
 */

var integrationContext = {
  name: 'visual-website-optimizer',
  version: '1.0.0'
};

/**
 * Initialize.
 */

VWO.prototype.initialize = function() {
  if (this.options.useAsyncSmartCode) {
    /* eslint-disable */
    var account_id = this.options.accountId;
    var settings_tolerance = this.options.settingsTolerance;
    var library_tolerance = this.options.libraryTolerance;
    var use_existing_jquery = this.options.useExistingJQuery;

    window._vwo_code=(function(){f=false,d=document;return{use_existing_jquery:function(){return use_existing_jquery;},library_tolerance:function(){return library_tolerance;},finish:function(){if(!f){f=true;var a=d.getElementById('_vis_opt_path_hides');if(a)a.parentNode.removeChild(a);}},finished:function(){return f;},load:function(a){var b=d.createElement('script');b.src=a;b.type='text/javascript';b.innerText;b.onerror=function(){_vwo_code.finish();};d.getElementsByTagName('head')[0].appendChild(b);},init:function(){settings_timer=setTimeout('_vwo_code.finish()',settings_tolerance);var a=d.createElement('style'),b='body{opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important;}',h=d.getElementsByTagName('head')[0];a.setAttribute('id','_vis_opt_path_hides');a.setAttribute('type','text/css');if(a.styleSheet)a.styleSheet.cssText=b;else a.appendChild(d.createTextNode(b));h.appendChild(a);this.load('//dev.visualwebsiteoptimizer.com/j.php?a='+account_id+'&u='+encodeURIComponent(d.URL)+'&r='+Math.random());return settings_timer;}};}());_vwo_settings_timer=_vwo_code.init();
    /* eslint-enable */
  }

  var self = this;

  if (this.options.replay) {
    tick(function() {
      self.replay();
    });
  }

  if (this.options.listen) {
    tick(function() {
      self.roots();
    });
  }

  if (this.options.useAsyncSmartCode) {
    enqueue(function() {
      self.ready();
    });
  } else {
    self.ready();
  }
};

/**
 * Completed Purchase.
 *
 * https://vwo.com/knowledge/vwo-revenue-tracking-goal
 */

VWO.prototype.orderCompleted = function(track) {
  var total = track.total() || track.revenue() || 0;
  enqueue(function() {
    window._vis_opt_revenue_conversion(total);
  });
};

/**
 * Replay the experiments the user has seen as traits to all other integrations.
 * Wait for the next tick to replay so that the `analytics` object and all of
 * the integrations are fully initialized.
 */

VWO.prototype.replay = function() {
  var analytics = this.analytics;

  experiments(function(err, traits) {
    if (traits) analytics.identify(traits);
  });
};

/**
 * Replay the experiments the user has seen as traits to all other integrations.
 * Wait for the next tick to replay so that the `analytics` object and all of
 * the integrations are fully initialized.
 */

VWO.prototype.roots = function() {
  var analytics = this.analytics;
  var self = this;

  rootExperiments(function(err, data) {
    each(data, function(experimentId, variationName) {
      var props = {
        experimentId: experimentId,
        variationName: variationName
      };

      if (self.options.experimentNonInteraction) props.nonInteraction = 1;
      
      analytics.track(
        'Experiment Viewed',
        props,
        { context: { integration: integrationContext } }
      );
    });
  });
};

/**
 * Get dictionary of experiment keys and variations.
 *
 * http://visualwebsiteoptimizer.com/knowledge/integration-of-vwo-with-kissmetrics/
 *
 * @param {Function} fn
 * @return {Object}
 */

function rootExperiments(fn) {
  enqueue(function() {
    var data = {};
    var experimentIds = window._vwo_exp_ids;
    if (!experimentIds) return fn();
    each(experimentIds, function(experimentId) {
      var variationName = variation(experimentId);
      if (variationName) data[experimentId] = variationName;
    });
    fn(null, data);
  });
}

/**
 * Get dictionary of experiment keys and variations.
 *
 * http://visualwebsiteoptimizer.com/knowledge/integration-of-vwo-with-kissmetrics/
 *
 * @param {Function} fn
 * @return {Object}
 */

function experiments(fn) {
  enqueue(function() {
    var data = {};
    var ids = window._vwo_exp_ids;
    if (!ids) return fn();
    each(ids, function(id) {
      var name = variation(id);
      if (name) data['Experiment: ' + id] = name;
    });
    fn(null, data);
  });
}

/**
 * Add a `fn` to the VWO queue, creating one if it doesn't exist.
 *
 * @param {Function} fn
 */

function enqueue(fn) {
  window._vis_opt_queue = window._vis_opt_queue || [];
  window._vis_opt_queue.push(fn);
}

/**
 * Get the chosen variation's name from an experiment `id`.
 *
 * http://visualwebsiteoptimizer.com/knowledge/integration-of-vwo-with-kissmetrics/
 *
 * @param {String} id
 * @return {String}
 */

function variation(id) {
  var experiments = window._vwo_exp;
  if (!experiments) return null;
  var experiment = experiments[id];
  var variationId = experiment.combination_chosen;

  // Send data only if experiment is marked ready by VWO and User is not previewing the VWO campaign
  if (experiment.ready && !window._vis_debug && variationId) {
    return experiment.comb_n[variationId];
  }
  return null;
}
