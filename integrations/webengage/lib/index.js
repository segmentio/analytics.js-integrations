'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var useHttps = require('use-https');
var remove = require('obj-case').del;

/**
 * Expose `WebEngage` integration.
 */

var WebEngage = module.exports = integration('WebEngage')
  .readyOnInitialize()
  .global('webengage')
  .option('licenseCode', '')
  .tag('http', '<script src="http://cdn.widgets.webengage.com/js/webengage-min-v-6.0.js">')
  .tag('https', '<script src="https://ssl.widgets.webengage.com/js/webengage-min-v-6.0.js">');

/**
 * Initialize.
 *
 * http://docs.webengage.com/docs/web-sdk-integration#section-integration-code
 * @api public
 */

WebEngage.prototype.initialize = function() {
  /* eslint-disable */

  !function(e,t,n){function o(e,t){e[t[t.length-1]]=function(){r.__queue.push([t.join("."),arguments])}}var i,s,r=e[n],g=" ",l="init options track screen onReady".split(g),a="feedback survey notification".split(g),c="options render clear abort".split(g),p="Open Close Submit Complete View Click".split(g),u="identify login logout setAttribute".split(g);if(!r||!r.__v){for(e[n]=r={__queue:[],__v:"6.0",user:{}},i=0;i<l.length;i++)o(r,[l[i]]);for(i=0;i<a.length;i++){for(r[a[i]]={},s=0;s<c.length;s++)o(r[a[i]],[a[i],c[s]]);for(s=0;s<p.length;s++)o(r[a[i]],[a[i],"on"+p[s]])}for(i=0;i<u.length;i++)o(r.user,["user",u[i]]);}}(window,document,"webengage");

  window.webengage.ixP = 'Segment';
  /* eslint-enable */

  window.webengage.init(this.options.licenseCode);

  var name = useHttps() ? 'https' : 'http';
  this.load(name, this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

WebEngage.prototype.loaded = function() {
  return !!window.webengage;
};


/**
 * Identify.
 *
 * http://docs.webengage.com/docs/web-sdk-user#section-webengage-user-login
 *
 * @api public
 * @param {Identify} identify
 */

WebEngage.prototype.identify = function(identify) {
  var traits = identify.traits();
  var id = identify.userId();
  var mappedTraits = mapTraits(traits);
  // handle names
  if (identify.firstName()) mappedTraits.we_first_name = identify.firstName();
  if (identify.lastName()) mappedTraits.we_last_name = identify.lastName();
  remove(mappedTraits, 'name');
  remove(mappedTraits, 'firstName');
  remove(mappedTraits, 'lastName');

  if (id) window.webengage.user.login(id);

  if (traits) window.webengage.user.setAttribute(mappedTraits);
};


/**
 * Track.
 *
 * http://docs.webengage.com/docs/web-sdk-events#section-webengage-track
 *
 * @api public
 * @param {Track} track
 */

WebEngage.prototype.track = function(track) {
  var event = track.event();
  var properties = track.properties();
  window.webengage.track(event, properties);
};


/**
 * Page.
 *
 * http://docs.webengage.com/docs/web-sdk-integration#section-webengage-screen
 * @param {Page} page
 */

WebEngage.prototype.page = function(page) {
  var name = page.name() || '';
  var properties = page.properties();

  window.webengage.screen(name, properties);
};


/**
 * Map traits to their WebEngage attributes.
 *
 * http://docs.webengage.com/docs/web-sdk-user#section-reserved-attributes
 *
 * @param {Object} traits
 * @return {Object} mapped
 * @api private
 */

function mapTraits(traits) {
  var aliases = {
    email: 'we_email',
    gender: 'we_gender',
    birthday: 'we_birth_date',
    phone: 'we_phone',
    company: 'we_company'
  };

  var mapped = {};
  for (var k in traits) {
    if (aliases.hasOwnProperty(k)) {
      mapped[aliases[k]] = traits[k];
    } else {
      mapped[k] = traits[k];
    }
  }

  if (Object.prototype.toString.call(mapped.we_birth_date) === '[object Date]') {
    var date = mapped.we_birth_date;

    mapped.we_birth_date = date.getUTCFullYear()
      + '-' + pad(date.getUTCMonth() + 1)
      + '-' + pad(date.getUTCDate());
  }

  return mapped;
}


/**
 * Pad single digit numbers with a leading 0.
 *
 * @param {number} number
 * @return {number}
 * @api private
 */

function pad(number) {
  return number < 10 ? '0' + number : number;
}
