'use strict';

/**
 * Module dependencies.
 */

var fmt = require('@segment/fmt');
var integration = require('@segment/analytics.js-integration');
var is = require('is');
var jsonp = require('jsonp');
var url = require('component-url');
var when = require('do-when');

/**
 * hasOwnProperty reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Expose `Marketo` integration.
 */

var Marketo = (module.exports = integration('Marketo')
  .assumesPageview()
  .global('Munchkin')
  .option('host', 'https://api.segment.io')
  .option('accountId', '')
  .option('projectId', '')
  .tag('<script src="//munchkin.marketo.net/munchkin.js">'));

/**
 * Initialize.
 *
 * https://app-q.marketo.com/#MS0A1
 *
 * @api public
 */

Marketo.prototype.initialize = function() {
  var self = this;
  this.load(function() {
    window.Munchkin.init(self.options.accountId, {
      asyncOnly: true
    });
    // marketo integration actually loads a marketo snippet
    // and the snippet loads the real marketo, this is required
    // because there's a race between `window.mktoMunchkinFunction = sinon.spy()`
    // and marketo's real javascript which overrides `window.mktoMunchkinFunction`
    // and deletes the spy.
    when(self.loaded, self.ready);
  });
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

Marketo.prototype.loaded = function() {
  return is.object(window.Munchkin) && !!window.MunchkinTracker;
};

/**
 * Page.
 *
 * @api public
 * @param {Page}
 */

Marketo.prototype.page = function(page) {
  var properties = page.properties();
  var parsed = url.parse(properties.url);
  window.mktoMunchkinFunction('visitWebPage', {
    url: properties.url,
    params: parsed.query
  });
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Marketo.prototype.identify = function(identify) {
  // we _must_ have an email
  if (!identify.email()) return;

  var traits = identify.traits({
    address: 'Address',
    company: 'Company',
    email: 'Email',
    firstName: 'FirstName',
    industry: 'Industry',
    lastName: 'LastName',
    phone: 'Phone'
  });

  // add `userId` since `id` is ignored by marketo
  // `id` seems to be an undocumented standard field that marketo
  // self increments for every new user and is required to
  // retrieve user data for their REST api
  // http://developers.marketo.com/documentation/rest/get-lead-by-id/
  if (identify.userId()) traits.userId = identify.userId();

  if (is.object(traits.Address)) {
    traits.City = identify.proxy('address.city');
    traits.Country = identify.proxy('address.country');
    traits.PostalCode = identify.proxy('address.postalCode');
    traits.State = identify.proxy('address.state');
    delete traits.Address;
  }

  // associate the lead on the client-side so that
  // we can track to the same user
  this.requestHash(traits.Email, function(err, hash) {
    var marketoFn = window.mktoMunchkinFunction;
    if (marketoFn) marketoFn('associateLead', traits, hash);
  });
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Marketo.prototype.track = function(track) {
  var properties = track.properties();
  var event = track.event();

  // we're going to fake a Marketo javascript event
  // by sending it as a visitWebPage event
  // with a relative URL of /event/{actual_event}
  var url = event.replace(/[ _]/g, '-');

  if (event.match(/^\/event\//) === null) {
    url = fmt('/event/%s', url);
  }

  // the url parameters will be the event properties
  var params = '';
  for (var prop in properties) {
    if (has.call(properties, prop)) {
      // TODO: dont send a trailing &, make sure thats ok to remove
      params += prop + '=' + encodeURIComponent(properties[prop]) + '&';
    }
  }

  window.mktoMunchkinFunction('visitWebPage', {
    url: url,
    params: params
  });
};

/**
 * Generate the URL to the Segment endpoint that hashes Marketo emails.
 *
 * @api private
 * @param {string} email
 * @return {string}
 */

Marketo.prototype.emailHashUrl = function(email) {
  var host = this.options.host;
  var projectId = this.options.projectId;
  return fmt('%s/integrations/marketo/v1/%s/%s/hash', host, projectId, email);
};

/**
 * Marketo requires that users' requests come with a hashed version of their
 * email address. It's a hash that can't be done on the client-side for some
 * reason.
 *
 * Man, it'd have been great if someone had documented this in the first place.
 *
 * See https://github.com/segmentio/marketo-hash-app for more details.
 *
 * TODO: Improve this documentation
 *
 * @api private
 * @param {string} email
 * @param {Function} callback
 */

Marketo.prototype.requestHash = function(email, callback) {
  var url = this.emailHashUrl(email);
  jsonp(url, callback);
};
