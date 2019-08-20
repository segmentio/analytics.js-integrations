'use strict';

/**
 * Module dependencies.
 */

var alias = require('@segment/alias');
var dates = require('@segment/convert-dates');
var del = require('obj-case').del;
var includes = require('@ndhoule/includes');
var integration = require('@segment/analytics.js-integration');
var iso = require('@segment/to-iso-string');
var pick = require('@ndhoule/pick');
var is = require('is');
var indexOf = require('component-indexof');

/**
 * Expose `Mixpanel` integration.
 */

var Mixpanel = module.exports = integration('Mixpanel')
  .global('mixpanel')
  .option('eventIncrements', [])
  .option('propIncrements', [])
  .option('peopleProperties', [])
  .option('superProperties', [])
  .option('cookieName', '')
  .option('crossSubdomainCookie', false)
  .option('secureCookie', false)
  .option('persistence', 'cookie')
  .option('nameTag', true)
  .option('pageview', false)
  .option('people', false)
  .option('token', '')
  .option('setAllTraitsByDefault', true)
  .option('consolidatedPageCalls', true)
  .option('trackAllPages', false)
  .option('trackNamedPages', false)
  .option('trackCategorizedPages', false)
  .option('sourceName', '')
  .tag('<script src="//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js">');

/**
 * Options aliases.
 */

var optionsAliases = {
  cookieName: 'cookie_name',
  crossSubdomainCookie: 'cross_subdomain_cookie',
  secureCookie: 'secure_cookie'
};

/**
 * Initialize.
 *
 * https://mixpanel.com/help/reference/javascript#installing
 * https://mixpanel.com/help/reference/javascript-full-api-reference#mixpanel.init
 *
 * @api public
 */

Mixpanel.prototype.initialize = function() {
  /* eslint-disable */
  (function(e,a){if(!a.__SV){var b=window;try{var c,l,i,j=b.location,g=j.hash;c=function(a,b){return(l=a.match(RegExp(b+"=([^&]*)")))?l[1]:null};g&&c(g,"state")&&(i=JSON.parse(decodeURIComponent(c(g,"state"))),"mpeditor"===i.action&&(b.sessionStorage.setItem("_mpcehash",g),history.replaceState(i.desiredHash||"",e.title,j.pathname+j.search)))}catch(m){}var k,h;window.mixpanel=a;a._i=[];a.init=function(b,c,f){function e(b,a){var c=a.split(".");2==c.length&&(b=b[c[0]],a=c[1]);b[a]=function(){b.push([a].concat(Array.prototype.slice.call(arguments,
0)))}}var d=a;"undefined"!==typeof f?d=a[f]=[]:f="mixpanel";d.people=d.people||[];d.toString=function(b){var a="mixpanel";"mixpanel"!==f&&(a+="."+f);b||(a+=" (stub)");return a};d.people.toString=function(){return d.toString(1)+".people (stub)"};k="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset people.set people.set_once people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");
for(h=0;h<k.length;h++)e(d,k[h]);a._i.push([b,c,f])};a.__SV=1.2;}})(document,window.mixpanel||[]);
  /* eslint-enable */
  this.options.eventIncrements = lowercase(this.options.eventIncrements);
  this.options.propIncrements = lowercase(this.options.propIncrements);
  var options = alias(this.options, optionsAliases);
  // tag ajs requests with Segment by request from Mixpanel team for better mutual debugging
  options.loaded = function(mixpanel) {
    mixpanel.register({ mp_lib: 'Segment: web' });
  };
  window.mixpanel.init(options.token, options);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Mixpanel.prototype.loaded = function() {
  return !!(window.mixpanel && window.mixpanel.config);
};

/**
 * Page.
 *
 * https://mixpanel.com/help/reference/javascript-full-api-reference#mixpanel.track_pageview
 *
 * @api public
 * @param {Page} page
 */

Mixpanel.prototype.page = function(page) {
  var category = page.category();
  var name = page.name();
  var opts = this.options;

  // consolidated Page Calls
  if (opts.consolidatedPageCalls) {
    this.track(page.track());
    return;
  }

  // all pages
  if (opts.trackAllPages) {
    this.track(page.track());
    return;
  }

  // categorized pages
  if (opts.trackCategorizedPages && category) {
    // If this option is checked and name was also passed, used the full name which includes both category & name
    if (name) {
      this.track(page.track(page.fullName()));
      return;
    }
    this.track(page.track(category));
    return;
  }

  // named pages
  if (name && opts.trackNamedPages) {
    this.track(page.track(name));
  }
};

/**
 * Trait aliases.
 */

var traitAliases = {
  created: '$created',
  email: '$email',
  firstName: '$first_name',
  lastName: '$last_name',
  lastSeen: '$last_seen',
  name: '$name',
  username: '$username',
  phone: '$phone'
};

/**
 * Identify.
 *
 * https://mixpanel.com/help/reference/javascript#super-properties
 * https://mixpanel.com/help/reference/javascript#user-identity
 * https://mixpanel.com/help/reference/javascript#storing-user-profiles
 *
 * @api public
 * @param {Identify} identify
 */

Mixpanel.prototype.identify = function(identify) {
  var username = identify.username();
  var email = identify.email();
  var id = identify.userId();
  var setAllTraitsByDefault = this.options.setAllTraitsByDefault;
  var people = this.options.people;
  var peopleProperties = extendTraits(this.options.peopleProperties);
  var superProperties = this.options.superProperties;

  // id
  if (id) window.mixpanel.identify(id);

  // name tag
  var nametag = email || username || id;
  if (nametag) window.mixpanel.name_tag(nametag);

  var traits = identify.traits(traitAliases);
  if (traits.$created) del(traits, 'createdAt');
  traits = dates(traits, iso);

  // determine which traits to union to existing properties and which to set as new properties
  var traitsToUnion = {};
  var traitsToSet = {};
  for (var key in traits) {
    if (!traits.hasOwnProperty(key)) continue;

    var trait = traits[key];
    if (Array.isArray(trait) && trait.length > 0) {
      traitsToUnion[key] = trait;
      // since mixpanel doesn't offer a union method for super properties we have to do it manually by retrieving the existing list super property
      // from mixpanel and manually unioning to it ourselves
      var existingTrait = window.mixpanel.get_property(key);
      if (existingTrait && Array.isArray(existingTrait)) {
        traits[key] = unionArrays(existingTrait, trait);
      }
    } else {
      traitsToSet[key] = trait;
    }
  }

  if (setAllTraitsByDefault) {
    window.mixpanel.register(traits);
    if (people) {
      window.mixpanel.people.set(traitsToSet);
      window.mixpanel.people.union(traitsToUnion);
    }
  } else {
    // explicitly set select traits as people and super properties
    var mappedSuperProps = mapTraits(superProperties);
    var superProps = pick(mappedSuperProps || [], traits);
    if (!is.empty(superProps)) window.mixpanel.register(superProps);
    if (people) {
      var mappedPeopleProps = mapTraits(peopleProperties);
      var peoplePropsToSet = pick(mappedPeopleProps || [], traitsToSet);
      var peoplePropsToUnion = pick(mappedPeopleProps || [], traitsToUnion);
      if (!is.empty(peoplePropsToSet)) window.mixpanel.people.set(peoplePropsToSet);
      if (!is.empty(peoplePropsToUnion)) window.mixpanel.people.union(peoplePropsToUnion);
    }
  }
};

/**
 * Track.
 *
 * https://mixpanel.com/help/reference/javascript#sending-events
 * https://mixpanel.com/help/reference/javascript#tracking-revenue
 *
 * @api public
 * @param {Track} track
 */

Mixpanel.prototype.track = function(track) {
  var eventIncrements = this.options.eventIncrements || this.options.increments; // TODO: remove settings.increments check, it's only here as we cutover from increments to eventIncrements
  var propIncrements = this.options.propIncrements;
  var eventLowercase = track.event().toLowerCase();
  var people = this.options.people;
  var props = track.properties();
  var revenue = track.revenue();
  // Don't map traits, clients should use identify instead.
  var superProps = pick(this.options.superProperties, props);
  var sourceName = this.options.sourceName;

  if (sourceName) props.segment_source_name = sourceName;

  // delete mixpanel's reserved properties, so they don't conflict
  delete props.distinct_id;
  delete props.ip;
  delete props.mp_name_tag;
  delete props.mp_note;
  delete props.token;

  props = dates(props, iso);
  invertObjectArrays(props);

  // Mixpanel People operations
  if (people) {
    // increment event count
    if (includes(eventLowercase, eventIncrements)) {
      window.mixpanel.people.increment(track.event());
      window.mixpanel.people.set('Last ' + track.event(), new Date());
    }
    // increment property counts
    for (var key in props) {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        continue;
      }
      var prop = props[key];
      if (includes(key.toLowerCase(), propIncrements)) {
        window.mixpanel.people.increment(key, prop);
      }
    }
    // track revenue
    if (revenue) {
      window.mixpanel.people.track_charge(revenue);
    }
  }

  // track the event
  var query;
  if (props.link_query) {
    query = props.link_query; // DOM query
    delete props.link_query;
    window.mixpanel.track_links(query, track.event(), props);
  } else if (props.form_query) {  // DOM query
    query = props.form_query;
    delete props.form_query;
    window.mixpanel.track_forms(query, track.event(), props);
  } else {
    window.mixpanel.track(track.event(), props);
  }

  // register super properties if present in context.mixpanel.superProperties
  if (!is.empty(superProps)) {
    window.mixpanel.register(superProps);
  }
};

/**
 * Alias.
 *
 * https://mixpanel.com/help/reference/javascript#user-identity
 * https://mixpanel.com/help/reference/javascript-full-api-reference#mixpanel.alias
 *
 * @api public
 * @param {Alias} alias
 */

Mixpanel.prototype.alias = function(alias) {
  var mp = window.mixpanel;
  var to = alias.to();
  if (mp.get_distinct_id && mp.get_distinct_id() === to) return;
  // HACK: internal mixpanel API to ensure we don't overwrite
  if (mp.get_property && mp.get_property('$people_distinct_id') === to) return;
  // although undocumented, mixpanel takes an optional original id
  mp.alias(to, alias.from());
};

/**
 * Lowercase the given `arr`.
 *
 * @api private
 * @param {Array} arr
 * @return {Array}
 */

function lowercase(arr) {
  var ret = new Array(arr.length);

  for (var i = 0; i < arr.length; ++i) {
    ret[i] = String(arr[i]).toLowerCase();
  }

  return ret;
}

/**
 * Map Special traits in the given `arr`.
 * From the TraitAliases for Mixpanel's special props
 *
 * @api private
 * @param {Array} arr
 * @return {Array}
 */

function mapTraits(arr) {
  var ret = new Array(arr.length);

  for (var i = 0; i < arr.length; ++i) {
    if (traitAliases.hasOwnProperty(arr[i])) {
      ret.push(traitAliases[arr[i]]);
    } else {
      ret.push(arr[i]);
    }
  }

  return ret;
}

/**
 * extend Mixpanel's special trait keys in the given `arr`.
 *
 * @api private
 * @param {Array} arr
 * @return {Array}
 */

function extendTraits(arr) {
  var keys = [];

  for (var key in traitAliases) {
    if (traitAliases.hasOwnProperty(key)) {
      keys.push(key);
    }
  }

  for (var i = 0; i < keys.length; ++i) {
    if (indexOf(arr, keys[i]) < 0) {
      arr.push(keys[i]);
    }
  }

  return arr;
}

/**
 * Since Mixpanel doesn't support lists of objects, invert each list of objects to a set of lists of object properties.
 * Treats list transformation atomically, e.g. will only transform if EVERY item in list is an object
 *
 * @api private
 * @param {Object} props
 * @example
 * input: {products: [{sku: 32, revenue: 99}, {sku:2, revenue: 103}]}
 * output: {products_skus: [32, 2], products_revenues: [99, 103]}
 */

function invertObjectArrays(props) {
  for (var propName in props) {  // eslint-disable-line
    var propValue = props[propName];
    if (!props.hasOwnProperty(propName) || !Array.isArray(propValue)) {
      continue;
    }

    var invertedArrays = invertObjectArray(propName, propValue);
    if (Object.keys(invertedArrays).length !== 0) { // make sure obj isn't empty
      mergeArraysIntoObj(props, invertedArrays);
      delete props[propName];
    }
  }
}

// Example:
// input: 'products', [{sku: 32, revenue: 99}, {sku:2, revenue: 103}]
// output: {products_skus: [32, 2], products_revenues: [99, 103]}
function invertObjectArray(propName, arr) {
  var invertedArrays = {};

  // invert object lists and collect into invertedLists
  for (var i=0; i<arr.length; i++) {
    var elem = arr[i];

    // abort operation if non-object encountered in array
    if (typeof elem !== 'object') {
      return {};
    }
    for (var key in elem) {
      if (!elem.hasOwnProperty(key)) {
        continue;
      }
      var attrKey = propName+'_'+key+'s';  // e.g. products_skus

      // append to list if it exists or create new one if not
      if (attrKey in invertedArrays) {
        invertedArrays[attrKey].push(elem[key]);
      } else {
        invertedArrays[attrKey] = [elem[key]];
      }
    }
  }
  return invertedArrays;
}

function mergeArraysIntoObj(destination, source) {
  for (var arrayName in source) {
    if (source.hasOwnProperty(arrayName)) {
      var arr = source[arrayName];
      destination[arrayName] = arrayName in destination ? destination[arrayName].concat(arr) : arr;
    }
  }
}


/**
 * Return union of two arrays
 * Pulled from https://stackoverflow.com/a/3629861
 *
 * @param {Array} x
 * @param {Array} y
 * @return {Array} res
 * @api private
 */

function unionArrays(x, y) {
  var obj = {};
  // store items of each array as keys/values of obj, implicitly overwriting duplicates
  var i;
  for (i = 0; i < x.length; i++) {
    obj[x[i]] = x[i];
  }
  for (i = 0; i < y.length; i++) {
    obj[y[i]] = y[i];
  }
  return Object.keys(obj);
}
