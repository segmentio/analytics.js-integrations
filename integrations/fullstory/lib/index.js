'use strict';

/**
 * Module dependencies.
 */

var foldl = require('@ndhoule/foldl');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `FullStory` integration.
 *
 * https://www.fullstory.com/docs/developer
 */

var FullStory = module.exports = integration('FullStory')
  .option('org', '')
  .option('debug', false)
  .option('passEvents', false)
  .tag('<script src="https://www.fullstory.com/s/fs.js"></script>');

/**
 * Initialize.
 */
FullStory.prototype.initialize = function() {
  window._fs_debug = this.options.debug;
  window._fs_host = 'www.fullstory.com';
  window._fs_org = this.options.org;
  window._fs_namespace = 'FS';

  /* eslint-disable */
  (function(m,n,e,t,l,o,g,y){
    if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');} return;}
    g=m[e]=function(a,b){g.q?g.q.push([a,b]):g._api(a,b);};g.q=[];
    g.identify=function(i,v){g(l,{uid:i});if(v)g(l,v)};g.setUserVars=function(v){g(l,v)};g.event=function(i,v,s){g('event',{n:i,p:v,s:s})};
    g.shutdown=function(){g("rec",!1)};g.restart=function(){g("rec",!0)};
    g.consent=function(a){g("consent",!arguments.length||a)};
    g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
    g.clearUserCookie=function(){};
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

  var newTraits = foldl(function(results, value, key) {
    if (key !== 'id') {
      results[key === 'displayName' || key === 'email' ? key : camelCaseWs(key)] = value;
    }
    return results;
  }, {}, traits);
  if (identify.userId()) {
    window.FS.identify(String(identify.userId()), newTraits);
  } else {
    newTraits.segmentAnonymousId_str = String(identify.anonymousId());
    window.FS.setUserVars(newTraits);
  }
};

/**
 * Track. Passes the events directly to FullStory via FS.event API only when the
 * option passEvents is set to true. passEvents is set to false by default.
 *
 * @param {Track} track
 */
FullStory.prototype.track = function(track) {
  if (this.options.passEvents) {
    window.FS.event(track.event(), track.properties());
  }
};

/**
 * Camel cases white space separated keys. Leaves underscores alone.
 *
 * NOTE: Does not fix otherwise malformed keys.
 * FullStory will reject keys that do not conform to /^[a-zA-Z][a-zA-Z0-9_]*$/.
 *
 * @param {string} key
 */
function camelCaseWs(key) {
  var parts = key.split(' ');
  var keyParts = [];
  for (var i=0; i < parts.length; i++) {
    var tok = parts[i];
    if (tok !== '') { // Handle multiple spaces.
      keyParts.push(keyParts.length > 0 ? upperCaseFirstChar(tok) : tok);
    }
  }
  return keyParts.join('');
}

/**
 * Uppercases the first character in the supplied string.
 *
 * @param {string} str
 */
function upperCaseFirstChar(str) {
  if (str === '') {
    return str;
  }
  return str[0].toUpperCase() + str.substr(1);
}
