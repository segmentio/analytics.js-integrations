'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Adobe Target` integration.
 */

var AdobeTarget = (module.exports = integration('Adobe Target'));

AdobeTarget.prototype.initialize = function() {
  // make sure the integration doesn't break in case at.js isn't included manually
  window.adobe = window.adobe || {};
  window.adobe.target = window.adobe.target || {};
  window.adobe.target.trackEvent =
    window.adobe.target.trackEvent ||
    function() {
      /* noop */
    };
  this.ready();
};

AdobeTarget.prototype.track = function(track) {
  var mbox = getMboxName(track);

  if (mbox === undefined) {
    return;
  }

  window.adobe.target.trackEvent({
    mbox: mbox,
    params: track.properties()
  });
};

AdobeTarget.prototype.orderCompleted = function(track) {
  var mbox = getMboxName(track);

  if (mbox === undefined) {
    return;
  }

  var products = track.products() || [];
  var productIdArray = [];

  for (var i = 0; i < products.length; i++) {
    var productId =
      products[i].id || products[i].productId || products[i].product_id;
    if (productId) productIdArray.push(productId);
  }

  window.adobe.target.trackEvent({
    mbox: mbox,
    params: {
      orderId: track.orderId(),
      orderTotal: track.revenue(),
      productPurchaseId: productIdArray.join(',')
    }
  });
};

function getMboxName(msg) {
  var opts = msg.options('Adobe Target');

  if (!opts.mboxName) {
    return;
  }

  var mbox = opts.mboxName;

  if (typeof mbox !== 'string') {
    mbox = mbox.toString();
  }
  return mbox;
}
