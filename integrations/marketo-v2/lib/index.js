'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var is = require('is');
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

var Marketo = (module.exports = integration('Marketo V2')
  .assumesPageview()
  .global('Munchkin')
  .global('MktForms2')
  .option('host', 'https://api.segment.io')
  .option('accountId', '')
  .option('projectId', '')
  .option('marketoHostUrl', '')
  .option('marketoFormId', '')
  .option('traits', [])
  .tag('<script src="//munchkin.marketo.net/munchkin.js">')
  .tag(
    'forms',
    '<script src="{{marketoHostUrl}}/js/forms2/js/forms2.min.js">'
  ));

/**
 * Initialize.
 *
 * https://app-q.marketo.com/#MS0A1
 *
 * @api public
 */

Marketo.prototype.initialize = function() {
  var munchkinId = this.options.accountId;
  var marketoHostUrl = this.options.marketoHostUrl;
  var marketoFormId = parseInt(this.options.marketoFormId, 10);

  var identifySettingsAreInvalid =
    marketoHostUrl === undefined ||
    marketoHostUrl === '' ||
    Number.isNaN(marketoFormId) ||
    marketoFormId <= 0;

  if (identifySettingsAreInvalid) {
    console.warn(
      'Invalid settings for identify method. Please review your Marketo V2 destination settings.'
    );
    return;
  }

  var self = this;
  this.load(function() {
    window.Munchkin.init(munchkinId, {
      asyncOnly: true
    });

    // marketo integration actually loads a marketo snippet
    // and the snippet loads the real marketo, this is required
    // because there's a race between `window.mktoMunchkinFunction = sinon.spy()`
    // and marketo's real javascript which overrides `window.mktoMunchkinFunction`
    // and deletes the spy.
    when(self.loaded, self.ready);
  });

  this.load('forms', { marketoHostUrl: marketoHostUrl }, function() {
    var marketoForm = document.createElement('form');
    marketoForm.setAttribute('id', 'mktoForm_' + marketoFormId);
    marketoForm.setAttribute('style', 'display:none');
    document.body.appendChild(marketoForm);
    window.MktoForms2.loadForm(marketoHostUrl, munchkinId, marketoFormId);
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

Marketo.prototype.setupAndSubmitForm = function(traits, form) {
  form.addHiddenFields(traits, form);
  // Do not remove this callback. This ensures there are no page refreshes after the form is submitted.
  form.onSuccess(function() {
    return false;
  });
  form.submit();
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

  var self = this;
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
  if (identify.birthday())
    traitsToSendMarketo.DateofBirth = identify.birthday();
  if (identify.firstName())
    traitsToSendMarketo.FirstName = identify.firstName();
  if (identify.gender())
    traitsToSendMarketo.MarketoSocialGender = identify.gender();
  if (identify.lastName()) traitsToSendMarketo.LastName = identify.lastName();
  if (identify.phone()) traitsToSendMarketo.Phone = identify.phone();
  if (identify.userId()) traitsToSendMarketo.userId = identify.userId();
  if (identify.anonymousId())
    traitsToSendMarketo.anonymousId = identify.anonymousId();

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
    var segmentTrait = trait.value
      ? trait.value.segmentTrait
      : trait.segmentTrait;
    var marketoField = trait.value
      ? trait.value.marketoFieldName
      : trait.marketoFieldName;
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

  window.MktoForms2.whenReady(function(form) {
    self.setupAndSubmitForm(traitsToSendMarketo, form);
  });
};
