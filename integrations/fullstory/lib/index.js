'use strict';

/**
 * Module dependencies.
 */

var camel = require('camelcase');
var foldl = require('@ndhoule/foldl');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `FullStory` integration.
 *
 * https://www.fullstory.com/docs/developer
 */

var FullStory = (module.exports = integration('FullStory')
  .option('org', '')
  .option('debug', false)
  .option('trackAllPages', false)
  .option('trackNamedPages', false)
  .option('trackCategorizedPages', false)
  .option('trackPagesWithEvents', true)
  .tag(
    '<script async src="https://edge.fullstory.com/s/fs.js" crossorigin="anonymous"></script>'
  ));

/**
 * The ApiSource string.
 *
 * @type {string}
 */
var apiSource = 'segment';

/**
 * Initialize.
 */
FullStory.prototype.initialize = function() {
  window._fs_debug = this.options.debug;
  window._fs_host = 'fullstory.com';
  window._fs_script = 'edge.fullstory.com/s/fs.js';
  window._fs_org = this.options.org;
  window._fs_namespace = 'FS';

  /* eslint-disable */
  /* istanbul ignore next */
  /* The snippet below differs slightly from the snippet available on fullstory.com because fs.js is already loaded above*/
  (function(m,n,e,t,l,o,g,y){
    if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');} return;}
    g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};g.q=[];
    g.identify=function(i,v,s){g(l,{uid:i},s);if(v)g(l,v,s)};g.setUserVars=function(v,s){g(l,v,s)};g.event=function(i,v,s){g('event',{n:i,p:v},s)};
    g.anonymize=function(){g.identify(!!0)};
    g.shutdown=function(){g("rec",!1)};g.restart=function(){g("rec",!0)};
    g.log = function(a,b){g("log",[a,b])};
    g.consent=function(a){g("consent",!arguments.length||a)};
    g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
    g.clearUserCookie=function(){};
    g.setVars=function(n, p){g('setVars',[n,p]);};
    g._w={};y='XMLHttpRequest';g._w[y]=m[y];y='fetch';g._w[y]=m[y];
    if(m[y])m[y]=function(){return g._w[y].apply(this,arguments)};
    g._v="1.3.0";
  })(window,document,window['_fs_namespace'],'script','user');
  /* eslint-enable */

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */
FullStory.prototype.loaded = function() {
  return !!window.FS;
};

/**
 * Identify.  But, use FS.setUserVars if we only have an anonymous id, keeping the
 * user id unbound until we (hopefully) get a login page or similar and another call
 * to identify with more useful contents.  (This because FullStory doesn't like the
 * user id changing once set.)
 *
 * @param {Identify} identify
 */
FullStory.prototype.identify = function(identify) {
  var traits = identify.traits({ name: 'displayName' });

  var newTraits = foldl(
    function(results, value, key) {
      var rs = results;
      if (key !== 'id') {
        rs[
          key === 'displayName' || key === 'email' ? key : camelCaseField(key)
        ] = value;
      }
      return rs;
    },
    {},
    traits
  );
  if (identify.userId()) {
    window.FS.identify(String(identify.userId()), newTraits, apiSource);
  } else {
    newTraits.segmentAnonymousId_str = String(identify.anonymousId());
    window.FS.setUserVars(newTraits, apiSource);
  }
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

FullStory.prototype.page = function(page) {
  var category = page.category();
  var name = page.fullName();
  var opts = this.options;
  var trackProps = page.track().properties();

  if (name && opts.trackNamedPages) {
    // named pages
    if (opts.trackPagesWithEvents) {
      this.track(page.track(name));
    }

    window.FS.setVars(
      'page',
      Object.assign(trackProps, { pageName: name }),
      apiSource
    );
  } else if (category && opts.trackCategorizedPages) {
    // categorized pages
    if (opts.trackPagesWithEvents) {
      this.track(page.track(category));
    }

    window.FS.setVars(
      'page',
      Object.assign(trackProps, { pageName: category }),
      apiSource
    );
  } else if (opts.trackAllPages) {
    // all pages
    if (opts.trackPagesWithEvents) {
      this.track(page.track());
    }
    window.FS.setVars('page', trackProps, apiSource);
  }
};

/**
 * Track. Passes the events directly to FullStory via FS.event API.
 *
 * @param {Track} track
 */
FullStory.prototype.track = function(track) {
  window.FS.event(track.event(), track.properties(), apiSource);
};

/**
 * Camel cases `.`, `-`, `_`, and white space within fieldNames. Leaves type suffix alone.
 *
 * NOTE: Does not fix otherwise malformed fieldNames.
 * FullStory will scrub characters from keys that do not conform to /^[a-zA-Z][a-zA-Z0-9_]*$/.
 *
 * @param {string} fieldName
 */
function camelCaseField(fieldName) {
  // Do not camel case across type suffixes.
  var parts = fieldName.split('_');
  if (parts.length > 1) {
    var typeSuffix = parts.pop();
    switch (typeSuffix) {
      case 'str':
      case 'int':
      case 'date':
      case 'real':
      case 'bool':
      case 'strs':
      case 'ints':
      case 'dates':
      case 'reals':
      case 'bools':
        return camel(parts.join('_')) + '_' + typeSuffix;
      default: // passthrough
    }
  }

  // No type suffix found. Camel case the whole field name.
  return camel(fieldName);
}
