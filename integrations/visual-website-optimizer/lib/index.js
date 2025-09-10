/* eslint-disable strict */

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var tick = require('next-tick');

var allowedExperimentTypes = ['VISUAL_AB', 'VISUAL', 'SPLIT_URL', 'SURVEY'];

/**
 * Expose `VWO` integration.
 */

var VWO = (module.exports = integration('Visual Website Optimizer')
  .global('_vis_opt_queue')
  .global('_vis_opt_revenue_conversion')
  .global('_vwo_exp')
  .global('_vwo_exp_ids')
  .global('VWO')
  .option('accountId')
  .option('useAsyncSmartCode', false)
  .option('settingsTolerance', 2000)
  .option('libraryTolerance', 2500)
  .option('useExistingJQuery', false)
  .option('replay', true)
  .option('listen', false)
  .option('experimentNonInteraction', false)
  .option('isSpa', false)
  .option('trackOnlyAbExperiments', false));

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
    var options = this.options;
    window._vwo_code || (function() {
      var account_id=options.accountId,
      version=2.1,
      settings_tolerance=options.settingsTolerance,
      hide_element='body',
      /* The VWO SmartCode v2.1 script when it gets executed auto-detects (detecting first-contentful-paint Ref: [PerformancePaintTiming - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming)) if the page is already loaded then it prevents the page (body) from hiding from it. */
      hide_element_style = 'opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important;transition:none !important;',
      /* DO NOT EDIT BELOW THIS LINE */
      f=false,w=window,d=document,v=d.querySelector('#vwoCode'),cK='_vwo_'+account_id+'_settings',cc={};try{var c=JSON.parse(localStorage.getItem('_vwo_'+account_id+'_config'));cc=c&&typeof c==='object'?c:{}}catch(e){}var stT=cc.stT==='session'?w.sessionStorage:w.localStorage;code={nonce:v&&v.nonce,use_existing_jquery:function(){return typeof use_existing_jquery!=='undefined'?use_existing_jquery:undefined},library_tolerance:function(){return typeof library_tolerance!=='undefined'?library_tolerance:undefined},settings_tolerance:function(){return cc.sT||settings_tolerance},hide_element_style:function(){return'{'+(cc.hES||hide_element_style)+'}'},hide_element:function(){if(performance.getEntriesByName('first-contentful-paint')[0]){return''}return typeof cc.hE==='string'?cc.hE:hide_element},getVersion:function(){return version},finish:function(e){if(!f){f=true;var t=d.getElementById('_vis_opt_path_hides');if(t)t.parentNode.removeChild(t);if(e)(new Image).src='https://dev.visualwebsiteoptimizer.com/ee.gif?a='+account_id+e}},finished:function(){return f},addScript:function(e){var t=d.createElement('script');t.type='text/javascript';if(e.src){t.src=e.src}else{t.text=e.text}v&&t.setAttribute('nonce',v.nonce);d.getElementsByTagName('head')[0].appendChild(t)},load:function(e,t){var n=this.getSettings(),i=d.createElement('script'),r=this;t=t||{};if(n){i.textContent=n;d.getElementsByTagName('head')[0].appendChild(i);if(!w.VWO||VWO.caE){stT.removeItem(cK);r.load(e)}}else{var o=new XMLHttpRequest;o.open('GET',e,true);o.withCredentials=!t.dSC;o.responseType=t.responseType||'text';o.onload=function(){if(t.onloadCb){return t.onloadCb(o,e)}if(o.status===200||o.status===304){_vwo_code.addScript({text:o.responseText})}else{_vwo_code.finish('&e=loading_failure:'+e)}};o.onerror=function(){if(t.onerrorCb){return t.onerrorCb(e)}_vwo_code.finish('&e=loading_failure:'+e)};o.send()}},getSettings:function(){try{var e=stT.getItem(cK);if(!e){return}e=JSON.parse(e);if(Date.now()>e.e){stT.removeItem(cK);return}return e.s}catch(e){return}},init:function(){if(d.URL.indexOf('__vwo_disable__')>-1)return;var e=this.settings_tolerance();w._vwo_settings_timer=setTimeout(function(){_vwo_code.finish();stT.removeItem(cK)},e);var t;if(this.hide_element()!=='body'){t=d.createElement('style');var n=this.hide_element(),i=n?n+this.hide_element_style():'',r=d.getElementsByTagName('head')[0];t.setAttribute('id','_vis_opt_path_hides');v&&t.setAttribute('nonce',v.nonce);t.setAttribute('type','text/css');if(t.styleSheet)t.styleSheet.cssText=i;else t.appendChild(d.createTextNode(i));r.appendChild(t)}else{t=d.getElementsByTagName('head')[0];var i=d.createElement('div');i.style.cssText='z-index: 2147483647 !important;position: fixed !important;left: 0 !important;top: 0 !important;width: 100% !important;height: 100% !important;background: white !important;display: block !important;';i.setAttribute('id','_vis_opt_path_hides');i.classList.add('_vis_hide_layer');t.parentNode.insertBefore(i,t.nextSibling)}var o=window._vis_opt_url||d.URL,s='https://dev.visualwebsiteoptimizer.com/j.php?a='+account_id+'&u='+encodeURIComponent(o)+'&vn='+version;if(w.location.search.indexOf('_vwo_xhr')!==-1){this.addScript({src:s})}else{this.load(s+'&x=true')}}};w._vwo_code=code;code.init();})();
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
  var identifyCalled = false;
  var experimentsTracked = {};
  rootExperiments(function(err, data) {
    each(data, function(experimentId, variationName) {
      var uuid = window.VWO.data.vin.uuid;
      var experimentName = window._vwo_exp[experimentId].name;
      var props = {
        experimentId: experimentId,
        variationName: variationName,
        experimentName: experimentName,
        vwoUserId: uuid
      };

      if (self.options.experimentNonInteraction) props.nonInteraction = 1;
      
      if(identifyCalled === false) {
        analytics.identify({vwoUserId: uuid});
        identifyCalled = true;
      }
      if (!experimentsTracked[experimentId]) {
        analytics.track('Experiment Viewed', props, {
          context: { integration: integrationContext }
        });
        experimentsTracked[experimentId] = true;
      }
    });
  }, this.options.trackOnlyAbExperiments);
};

/**
 * Get dictionary of experiment keys and variations.
 *
 * http://visualwebsiteoptimizer.com/knowledge/integration-of-vwo-with-kissmetrics/
 *
 * @param {Function} fn
 * @return {Object}
 */

function rootExperiments(fn, trackOnlyAbExperiments) {
  enqueue(function() {
    var data = {};
    var experimentIds = window._vwo_exp_ids;
    if (!experimentIds) return fn();
    each(experimentIds, function(experimentId) {
      var variationName = variation(experimentId, trackOnlyAbExperiments);
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
 * Check whether the experiment type is one of allowed types.
 *
 * @param {Object} experiment
 * @return {Boolean}
 */
function isValidExperimentType(experiment) {
  if (!experiment || !experiment.type) {
    return false;
  }
  return allowedExperimentTypes.indexOf(experiment.type.toUpperCase()) !== -1;
}

/**
 * Get the chosen variation's name from an experiment `id`.
 *
 * http://visualwebsiteoptimizer.com/knowledge/integration-of-vwo-with-kissmetrics/
 *
 * @param {String} id
 * @return {String}
 */

function variation(id, trackOnlyAbExperiments) {
  var experiments = window._vwo_exp;
  if (!experiments) return null;
  var experiment = experiments[id];

  if (!experiment || !Object.keys(experiment).length) {
    // if falsey value or empty object
    // This will avoid further errors.
    return null;
  }

  if (
    trackOnlyAbExperiments &&
    !isValidExperimentType(experiment, trackOnlyAbExperiments)
  ) {
    return null;
  }

  var variationId = experiment.combination_chosen;

  // Send data only if experiment is marked ready by VWO and User is not previewing the VWO campaign
  if (experiment.ready && !window._vis_debug && variationId) {
    return experiment.comb_n[variationId];
  }
  return null;
}
