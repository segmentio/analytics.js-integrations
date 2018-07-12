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
var each = require('@ndhoule/each');
// mapping of Standard Marketo API names: restAPIName: soapAPIName
var apiNameMapping = {
  annualRevenue: 'AnnualRevenue',
  anonymousIP: 'AnonymousIP',
  billingCity: 'BillingCity',
  billingCountry: 'BillingCountry',
  billingPostalCode: 'BillingPostalCode',
  billingState: 'BillingState',
  billingStreet: 'BillingStreet',
  department: 'Department',
  doNotCall: 'DoNotCall',
  doNotCallReason: 'DoNotCallReason',
  emailInvalid: 'EmailInvalid',
  emailInvalidCause: 'EmailInvalidCause',
  fax: 'Fax',
  industry: 'Industry',
  inferredCompany: 'InferredCompany',
  inferredCountry: 'InferredCountry',
  leadRole: 'LeadRole',
  leadScore: 'LeadScore',
  leadSource: 'LeadSource',
  leadStatus: 'LeadStatus',
  mainPhone: 'MainPhone',
  facebookDisplayName: 'MarketoSocialFacebookDisplayName',
  facebookId: 'MarketoSocialFacebookId',
  facebookPhotoURL: 'MarketoSocialFacebookPhotoURL',
  facebookProfileURL: 'MarketoSocialFacebookProfileURL',
  facebookReach: 'MarketoSocialFacebookReach',
  facebookReferredEnrollments: 'MarketoSocialFacebookReferredEnrollments',
  facebookReferredVisits: 'MarketoSocialFacebookReferredVisits',
  lastReferredEnrollment: 'MarketoSocialLastReferredEnrollment',
  lastReferredVisit: 'MarketoSocialLastReferredVisit',
  linkedInDisplayName: 'MarketoSocialLinkedInDisplayName',
  linkedInId: 'MarketoSocialLinkedInId',
  linkedInPhotoURL: 'MarketoSocialLinkedInPhotoURL',
  linkedInProfileURL: 'MarketoSocialLinkedInProfileURL',
  linkedInReach: 'MarketoSocialLinkedInReach',
  linkedInReferredEnrollments: 'MarketoSocialLinkedInReferredEnrollments',
  linkedInReferredVisits: 'MarketoSocialLinkedInReferredVisits',
  syndicationId: 'MarketoSocialSyndicationId',
  totalReferredEnrollments: 'MarketoSocialTotalReferredEnrollments',
  totalReferredVisits: 'MarketoSocialTotalReferredVisits',
  twitterDisplayName: 'MarketoSocialTwitterDisplayName',
  twitterId: 'MarketoSocialTwitterId',
  twitterPhotoURL: 'MarketoSocialTwitterPhotoURL',
  twitterProfileURL: 'MarketoSocialTwitterProfileURL',
  twitterReach: 'MarketoSocialTwitterReach',
  twitterReferredEnrollments: 'MarketoSocialTwitterReferredEnrollments',
  twitterReferredVisits: 'MarketoSocialTwitterReferredVisits',
  middleName: 'MiddleName',
  mktoCompanyNotes: 'MktoCompanyNotes',
  mktoPersonNotes: 'MktoPersonNotes',
  mobilePhone: 'MobilePhone',
  numberOfEmployees: 'NumberOfEmployees',
  rating: 'Rating',
  salutation: 'Salutation',
  sicCode: 'SICCode',
  site: 'Site',
  title: 'Title',
  unsubscribed: 'Unsubscribed',
  unsubscribedReason: 'UnsubscribedReason',
  website: 'Website'
};

/**
 * Expose `Marketo` integration.
 */

var Marketo = module.exports = integration('Marketo V2')
  .assumesPageview()
  .global('Munchkin')
  .option('host', 'https://api.segment.io')
  .option('accountId', '')
  .option('projectId', '')
  .option('traits', [])
  .tag('<script src="//munchkin.marketo.net/munchkin.js">');

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
  // Remove once V1 is completely deprecated.
  if (!page.enabled('Marketo')) return;

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
  // Remove once V1 is completely deprecated.
  if (!identify.enabled('Marketo')) {
    return;
  }

  var settings = this.options;

  // we _must_ have an email
  var email = identify.email();
  if (!email) return;

  // setting standard traits
  var traitsToSendMarketo = {};
  var traits = identify.traits();
  var company = identify.proxy('traits.company');
  var address = identify.address();

  traitsToSendMarketo.Email = email;
  if (identify.birthday()) traitsToSendMarketo.DateofBirth = identify.birthday();
  if (identify.firstName()) traitsToSendMarketo.FirstName = identify.firstName();
  if (identify.gender()) traitsToSendMarketo.MarketoSocialGender = identify.gender();
  if (identify.lastName()) traitsToSendMarketo.LastName = identify.lastName();
  if (identify.phone()) traitsToSendMarketo.Phone = identify.phone();
  if (identify.userId()) traitsToSendMarketo.userId = identify.userId();
  if (identify.anonymousId()) traitsToSendMarketo.anonymousId = identify.anonymousId();

  if (address) {
    if (is.object(address)) {
      traitsToSendMarketo.City = address.city;
      traitsToSendMarketo.Country = address.country;
      traitsToSendMarketo.PostalCode = address.zip || address.postalCode;
      traitsToSendMarketo.State = address.state;
    } else {
      traitsToSendMarketo.Address = address;
    }
  }

  if (company) {
    if (is.object(company)) {
      traitsToSendMarketo.Company = company.name;
    } else {
      traitsToSendMarketo.Company = company;
    }
  }

  each(function(trait) {
    var segmentTrait = trait.value ? trait.value.segmentTrait : trait.segmentTrait;
    var marketoField = trait.value ? trait.value.marketoFieldName : trait.marketoFieldName;
    // Marketo requires the SOAP API name when using munchkin but users will be giving us the REST API names
    // in their integrations settings so we have to do a check for any standard Marketo trait that we don't map by default
    // and use the SOAP name. Custom Marketo API names are the same between the REST and SOAP API.
    if (apiNameMapping[marketoField]) {
      marketoField = apiNameMapping[marketoField];
    }
    if (traits[segmentTrait] !== undefined) {
      traitsToSendMarketo[marketoField] = traits[segmentTrait];
    }
  }, settings.traits);

  // associate the lead on the client-side so that
  // we can track to the same user
  this.requestHash(traitsToSendMarketo.Email, function(err, hash) {
    var marketoFn = window.mktoMunchkinFunction;
    if (marketoFn) marketoFn('associateLead', traitsToSendMarketo, hash);
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
  return fmt('%s/integrations/marketo/v1/%s/%s/hash-v2', host, projectId, email);
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
