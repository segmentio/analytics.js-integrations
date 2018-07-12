'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');


/**
 * Expose `ibm-cmaas` integration.
 */
var cmaas = module.exports = integration('CMaaS')
  .option('apiKey', '');

/**
* Initialize.
*
* @api public
*/

cmaas.prototype.initialize = function() {
  this._loaded = true
  var tags = this.options.tags
  //this.appendObject(tags[1].value.tagToAdd);
  //this.appendScript(tags[0].value.tagToAdd);
  this.load(this.ready);
};

cmaas.prototype.loaded = function() {
  return this._loaded
}

cmaas.prototype.appendObject = function(object) {
  var node = document.createElement('script')
  console.log('node=', node)
  // var body = 'var digitalData={product:[{productInfo:{productID:\"WCM_765aad41-8e1f-4006-9829-3847062134b5\",productName:\"IBM Resiliency Assessment\",pageName:\"business-continuity-assessment\"}}],page:{category:{primaryCategory:\"IBM GTS - Resiliency Services\"},pageInfo:{effectiveDate:\"2018-03-05\",expiryDate:\"2017-12-18\",language:\"en-US\",publishDate:\"2018-03-05\",publisher:\"IBM Corporation\",productTitle:\"IBM Resiliency Assessment\",version:\"v18\",contactModuleConfiguration:{contactInformationBundleKey:{focusArea:\"IBM GTS - Resiliency Services\",languageCode:\"en\",regionCode:\"US\"},contactModuleTranslationKey:{languageCode:\"en\",regionCode:\"US\"}},ibm:{contentDelivery:\"Storefront\",contentProducer:\"ECM/WCM/Cloudant\",country:\"US\",industry:\"ZZ\",owner:\"Corporate Webmaster/New York/IBM\",subject:\"ZZ999\",siteID:\"ECOM\",type:\"CT502\"}}}}'
  var scriptBody = document.createTextNode(object)
  console.log('scriptBody=', scriptBody)
  node.appendChild(scriptBody)
  var head = document.getElementsByTagName('head')[0]
  console.log('head=', head)
  head.appendChild(node)
}

cmaas.prototype.appendScript = function(script) {
  var node = document.createElement('script')
  console.log('node=', node)
  node.setAttribute('src', script)
  var head = document.getElementsByTagName('head')[0]
  console.log('head=', head)
  head.appendChild(node)
}
