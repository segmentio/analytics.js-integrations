'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var Track = require('segmentio-facade').Track;
var reject = require('reject');
var defaults = require('@ndhoule/defaults');
var extend = require('extend');

/**
 * Expose `GTAG`.
 *  Purposely using different data-layer name to avoid conflicts
 *  with any other tool.
 */

var GTAG = (module.exports = integration('Gtag')
  .global('gtagDataLayer')
  .option('awConversionId', '')
  .option('dcFloodLightId', '')
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true)
  .option('includeQueryString', false)
  .option('gaWebMeasurementId', '')
  .option('gaWebAppMeasurementId', '')
  .option('gaCustomDimensions', {})
  .option('gaCustomMetrics', {})
  .option('gaContentGroupings', {})
  .option('gaEnhancedEcommerce', false)
  .option('gaAnonymizeIp', false)
  .option('gaCookieDomain', 'auto')
  .option('gaEnhancedLinkAttribution', false)
  .option('gaOptimizeContainerId', '')
  .option('gaSampleRate', 100)
  .option('gaSendUserId', false)
  .option('gaUseAmpClientId', false)
  .option('gaSiteSpeedSampleRate', 1)
  .option('gaSetAllMappedProps', false)
  .tag(
    '<script src="//www.googletagmanager.com/gtag/js?id={{ accountId }}&l=gtagDataLayer">'
  ));

GTAG.on('construct', function(Integration) {
  /* eslint-disable */
  if (Integration.options.gaEnhancedEcommerce) {
      Integration.productListViewed = Integration.productListViewedEnhanced;
      Integration.productClicked = Integration.productClickedEnhanced;
      Integration.productViewed = Integration.productViewedEnhanced;
      Integration.productAdded = Integration.productAddedEnhanced;
      Integration.productRemoved = Integration.productRemovedEnhanced;
      Integration.promotionViewed = Integration.promotionViewedEnhanced;
      Integration.promotionClicked = Integration.promotionClickedEnhanced;
      Integration.checkoutStarted = Integration.checkoutStartedEnhanced;
      Integration.orderRefunded = Integration.orderRefundedEnhanced;
      Integration.orderCompleted = Integration.orderCompletedEnhanced;
      Integration.checkoutStepViewed = Integration.checkoutStepViewedEnhanced;
      Integration.checkoutStepCompleted =
        Integration.checkoutStepCompletedEnhanced;
      Integration.orderUpdated = Integration.orderUpdatedEnhanced;

      // Additional event on top og GA destination
      Integration.productAddedToWishlist = Integration.productAddedToWishlistEnhanced;
      Integration.productShared = Integration.productSharedEnhanced;
      Integration.productsSearched = Integration.productsSearchedEnhanced;

      // This mapping is for events which are not supported by segment and will
      // be tracked by track method.
      Integration.customEventsMapping = {
        login: Integration.loggedInEnhanced,
        sign_up: Integration.signedUpEnhanced,
        exception: Integration.exceptionOccuredEnhanced,
        timing_complete: Integration.timingCompletedEnhanced,
        generate_lead: Integration.leadGeneratedEnhanced,
        set_checkout_option: Integration.setCheckoutOptionEnhanced
      };
    }
    /* eslint-enable */
});

/**
 * Initialize.
 *
 * https://developers.google.com/gtagjs
 *
 * @api public
 */

GTAG.prototype.initialize = function() {
  window.gtagDataLayer = window.gtagDataLayer || [];
  window.gtag = function() {
    window.gtagDataLayer.push(arguments);
  };
  // This line is in all of the gtag examples but not well documented. Seems like a requirement when loading the tag.
  // Best I could find:
  // https://stackoverflow.com/questions/59256532/what-is-the-js-gtags-js-command
  window.gtag('js', new Date());

  var config = [];
  var that = this;
  var gaWebMeasurementId = this.options.gaWebMeasurementId;
  var gaWebAppMeasurementId = this.options.gaWebAppMeasurementId;
  var awConversionId = this.options.awConversionId;
  var dcFloodLightId = this.options.dcFloodLightId;
  var accountId =
    gaWebMeasurementId ||
    gaWebAppMeasurementId ||
    awConversionId ||
    dcFloodLightId;
  if (gaWebMeasurementId || gaWebAppMeasurementId) {
    var gaSetting = {};

    // set custom dimension and metrics if present
    // To Set persistent values we need to use set instead of config
    // https://developers.google.com/analytics/devguides/collection/gtagjs/setting-values
    var customMap = merge(
      this.options.gaCustomDimensions || {},
      this.options.gaCustomMetrics || {}
    );

    // The dimension and metric mappings are stored as objects where the key is the
    // event field and the value is the dimension or metric so we swap them!
    // e.g.; { 'properties.age': 'dimension1' }
    //
    var customMapSwap = {};
    for (var field in customMap) {
      if (customMap.hasOwnProperty(field)) {
        customMapSwap[customMap[field]] = field;
      }
    }

    gaSetting.custom_map = customMapSwap;

    // https://developers.google.com/analytics/devguides/collection/gtagjs/ip-anonymization
    if (this.options.gaAnonymizeIp) {
      gaSetting.anonymize_ip = true;
    }

    // https://developers.google.com/analytics/devguides/collection/gtagjs/cookies-user-id
    if (this.options.gaCookieDomain) {
      gaSetting.cookie_domain = this.options.gaCookieDomain;
    }

    // https://developers.google.com/analytics/devguides/collection/gtagjs/enhanced-link-attribution
    if (this.options.gaEnhancedLinkAttribution) {
      gaSetting.link_attribution = true;
    }

    // https://support.google.com/optimize/answer/9183119?hl=en
    if (this.options.gaOptimizeContainerId) {
      gaSetting.optimize_id = this.options.gaOptimizeContainerId;
    }

    // https://support.google.com/analytics/thread/7741119?hl=en
    if (this.options.gaSampleRate) {
      gaSetting.sample_rate = this.options.gaSampleRate;
    }

    if (this.options.gaSiteSpeedSampleRate) {
      gaSetting.site_speed_sample_rate = this.options.gaSiteSpeedSampleRate;
    }

    if (this.options.gaUseAmpClientId) {
      gaSetting.use_amp_client_id = true;
    }

    var userId = this.analytics.user().id();

    // https://support.google.com/analytics/thread/7741119?hl=en
    if (this.options.gaSendUserId && userId) {
      gaSetting.user_id = userId;
    }

    if (gaWebMeasurementId) {
      config.push(['config', gaWebMeasurementId, gaSetting]);
    }

    if (gaWebAppMeasurementId) {
      config.push(['config', gaWebAppMeasurementId, gaSetting]);
    }
  }

  if (awConversionId) {
    config.push(['config', awConversionId, {}]);
  }

  if (dcFloodLightId) {
    config.push(['config', dcFloodLightId, {}]);
  }

  if (!accountId) {
    return;
  }

  this.load({ accountId: accountId }, function() {
    // Default routing.
    for (var i = 0; i < config.length; i++) {
      window.gtag(config[i][0], config[i][1], config[i][2]);
    }
    that.ready();
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

GTAG.prototype.loaded = function() {
  return !!(
    window.gtagDataLayer && Array.prototype.push !== window.gtagDataLayer.push
  );
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} event
 */

GTAG.prototype.identify = function(identify) {
  var userId = identify.userId();
  var opts = this.options;
  if (!userId || !opts.gaSendUserId) {
    return;
  }
  if (opts.gaWebMeasurementId) {
    window.gtag('config', opts.gaWebMeasurementId, {
      user_id: userId
    });
  }
  if (opts.gaWebAppMeasurementId) {
    window.gtag('config', opts.gaWebAppMeasurementId, {
      user_id: userId
    });
  }

  setContentGroups(identify.traits(), opts);
  setCustomDimensionsAndMetrics(identify.traits(), opts);
};

/**
 * Track
 *
 * @api public
 * @param {Track} track
 */

GTAG.prototype.track = function(track, params) {
  var event = track.event() || '';
  if (
    this.customEventsMapping &&
    typeof this.customEventsMapping[event] === 'function'
  ) {
    this.customEventsMapping[event](track);
    return;
  }
  var contextOpts = track.options(this.name);
  var opts = defaults(params || {}, contextOpts);
  var props = track.properties();
  props.event = event;

  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  props.non_interaction =
    props.nonInteraction !== undefined
      ? !!props.nonInteraction
      : !!opts.nonInteraction;

  delete props.nonInteraction;

  window.gtag('event', props.event, props);
};

/**
 * Page
 *
 * @api public
 * @param {Page} page
 */

GTAG.prototype.page = function(page) {
  setContentGroups(page.properties(), this.options);
  setCustomDimensionsAndMetrics(page.properties(), this.options);
  this.trackPageViewEvent(page, this.options);
};

/**
 * Product List Viewed - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.productListViewedEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('view_item_list', {
    items: getFormattedProductList(track)
  });
};

/**
 * Product Clicked - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.productClickedEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('select_content', {
    content_type: 'product',
    items: [getFormattedProduct(track)]
  });
};

/**
 * Product Viewed - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.productViewedEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('view_item', {
    items: [getFormattedProduct(track)]
  });
};

/**
 * Product Added - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.productAddedEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('add_to_cart', {
    items: [getFormattedProduct(track)]
  });
};

/**
 * Product Removed - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.productRemovedEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('remove_from_cart', {
    items: [getFormattedProduct(track)]
  });
};

/**
 * Promotion Viewed - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.promotionViewedEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('view_promotion', {
    promotions: [getFormattedPromotion(track)]
  });
};

/**
 * Promotion Clicked - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.promotionClickedEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('select_content', {
    promotions: [getFormattedPromotion(track)]
  });
};

/**
 * Checkout Started - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.checkoutStartedEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  var coupon = track.coupon();

  trackEnhancedEvent('begin_checkout', {
    value: track.total() || track.revenue() || 0,
    currency: track.currency(),
    items: getFormattedProductList(track),
    coupon: coupon
  });
};

/**
 * Order Updated - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.orderUpdatedEnhanced = function(track) {
  // Same event as started order - will override
  this.checkoutStartedEnhanced(track);
};

/**
 * Checkout Step Viewed - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.checkoutStepViewedEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('checkout_progress', extractCheckoutOptions(track));
};

/**
 * Checkout Step Completed - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.checkoutStepCompletedEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('checkout_progress', extractCheckoutOptions(track));
};

/**
 * Set Checkout Options - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.setCheckoutOptionEnhanced = function(track) {
  var props = track.properties();
  var options = reject([track.paymentMethod(), track.shippingMethod()]);

  trackEnhancedEvent('set_checkout_option', {
    value: track.value() || 0,
    checkout_step: props.step || 1,
    checkout_option: options.length ? options.join(', ') : null
  });
};

/**
 * Order Refunded - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.orderRefundedEnhanced = function(track) {
  var products = track.products();

  var eventData = {
    transaction_id: track.orderId()
  };
  if (products.length) {
    eventData.value = track.total() || track.revenue() || 0;
    eventData.currency = track.currency();
    eventData.tax = track.tax();
    eventData.shipping = track.shipping();
    eventData.affiliation = track.properties().affiliation;
    eventData.items = getFormattedProductList(track);
  }

  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('refund', eventData);
};

/**
 * Order Completed - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.orderCompletedEnhanced = function(track) {
  var total = track.total() || track.revenue() || 0;
  var orderId = track.orderId();
  var props = track.properties();

  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('purchase', {
    transaction_id: orderId,
    affiliation: props.affiliation,
    value: total,
    currency: track.currency(),
    tax: track.tax(),
    shipping: track.shipping(),
    items: getFormattedProductList(track)
  });
};

/**
 * Product Added to Wishlist - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.productAddedToWishlistEnhanced = function(track) {
  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('add_to_wishlist', {
    value: track.price(),
    currency: track.currency(),
    items: [getFormattedProduct(track)]
  });
};

/**
 * Product Shared - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.productSharedEnhanced = function(track) {
  var id = track.productId() || track.id() || track.sku();
  var props = track.properties();
  if (!id) {
    return;
  }

  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('share', {
    method: props.share_via,
    content_type: track.category(),
    content_id: id
  });
};

/**
 * Product Searched - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.productsSearchedEnhanced = function(track) {
  var searchQuery = track.proxy('properties.query');

  if (!searchQuery) {
    return;
  }

  setContentGroups(track.properties(), this.options);
  setCustomDimensionsAndMetrics(track.properties(), this.options);

  trackEnhancedEvent('search', {
    search_term: searchQuery
  });
};

/**
 * User Logged In - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.loggedInEnhanced = function(track) {
  var props = track.properties();
  trackEnhancedEvent('login', { method: props.method });
};

/**
 * User signed Up - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.signedUpEnhanced = function(track) {
  var props = track.properties();
  trackEnhancedEvent('sign_up', { method: props.method });
};

/**
 * Lead Generated - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.leadGeneratedEnhanced = function(track) {
  trackEnhancedEvent('generate_lead', {
    transaction_id: track.id(),
    value: track.price(),
    currency: track.currency()
  });
};

/**
 * Exception - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.exceptionOccuredEnhanced = function(track) {
  var props = track.properties();
  trackEnhancedEvent('exception', {
    description: props.description,
    fatal: props.fatal
  });
};

/**
 * Timing Completed - Enhanced Ecommerce
 *
 * @param {Track} track
 */

GTAG.prototype.timingCompletedEnhanced = function(track) {
  trackEnhancedEvent('timing_complete', {
    name: track.name(),
    value: track.value()
  });
};

/**
 * Track page view event.
 *
 * @api private
 * @param { Page } page
 * @param  opt
 */

GTAG.prototype.trackPageViewEvent = function(page, options) {
  var name = page.fullName();
  var category = page.category();
  var props = page.properties();
  var campaign = page.proxy('context.campaign');
  var track;

  if (campaign && options.gaWebMeasurementId) {
    window.gtag('config', options.gaWebMeasurementId, {
      campaign: reject({
        name: campaign.name,
        source: campaign.source,
        medium: campaign.medium,
        content: campaign.content,
        keyword: campaign.term
      })
    });
  }

  if (campaign && options.gaWebAppMeasurementId) {
    window.gtag('config', options.gaWebAppMeasurementId, {
      campaign: reject({
        name: campaign.name,
        source: campaign.source,
        medium: campaign.medium,
        content: campaign.content,
        keyword: campaign.term
      })
    });
  }

  var nonInteraction = !!(options && options.nonInteraction);
  var str = props.path;
  if (options.includeQueryString && props.search) {
    str += props.search;
  }

  window.gtag('event', 'page_view', {
    page_title: name || props.title,
    page_location: props.url,
    page_path: str,
    non_interaction: nonInteraction
  });

  if (name && options.trackNamedPages) {
    track = page.track(name);
    this.track(track, { nonInteraction: 1 });
  }
  if (category && options.trackCategorizedPages) {
    track = page.track(category);
    this.track(track, { nonInteraction: 1 });
  }
};

/**
 * Track enhanced events.
 *
 * @api private
 * @param eventName
 * @param payload
 */
function trackEnhancedEvent(eventName, payload) {
  window.gtag(
    'event',
    eventName,
    extend(payload, {
      non_interaction: true
    })
  );
}

/**
 * Set custom dimensions and metrics.
 *
 * @api private
 * @param {Object} props
 * @param {Object} options
 */

function setCustomDimensionsAndMetrics(props, options) {
  if (options.gaSetAllMappedProps) {
    // Set custom dimension and metrics if present
    // https://developers.google.com/analytics/devguides/collection/gtagjs/custom-dims-mets
    var customMap = merge(
      options.gaCustomDimensions || {},
      options.gaCustomMetrics || {}
    );
    var customMapValues = {};
    for (var field in customMap) {
      if (customMap.hasOwnProperty(field)) {
        customMapValues[customMap[field]] = props[field];
      }
    }
    if (options.gaWebMeasurementId) {
      window.gtag('config', options.gaWebMeasurementId, {
        custom_map: reject(customMapValues)
      });
    }
    if (options.gaWebAppMeasurementId) {
      window.gtag('config', options.gaWebAppMeasurementId, {
        custom_map: reject(customMapValues)
      });
    }
  }
}

/**
 * Set the content groups for an event.
 * https://support.google.com/analytics/answer/7475939?hl=en#code
 *
 * @api private
 * @param {Object} props
 * @param {Object} opts
 */
function setContentGroups(props, opts) {
  if (opts.gaContentGroupings && Object.keys(opts.gaContentGroupings).length) {
    var contentGroupValues = {};
    for (var field in opts.gaContentGroupings) {
      if (opts.gaContentGroupings.hasOwnProperty(field)) {
        contentGroupValues[opts.gaContentGroupings[field]] = props[field];
      }
    }

    if (opts.gaWebMeasurementId) {
      window.gtag(
        'config',
        opts.gaWebMeasurementId,
        reject(contentGroupValues)
      );
    }
    if (opts.gaWebAppMeasurementId) {
      window.gtag(
        'config',
        opts.gaWebAppMeasurementId,
        reject(contentGroupValues)
      );
    }
  }
}

/**
 * Enhanced ecommerce format data for checkout.
 *
 * @api private
 * @param {Track} track
 */
function extractCheckoutOptions(track) {
  var props = track.properties();
  var total = track.total() || track.revenue() || 0;
  var coupon = track.coupon();
  var options = reject([track.paymentMethod(), track.shippingMethod()]);

  return {
    currency: track.currency(),
    value: total,
    items: getFormattedProductList(track),
    coupon: coupon,
    checkout_step: props.step || 1,
    checkout_option: options.length ? options.join(', ') : null
  };
}

/**
 * Enhanced ecommerce format data for promotion.
 *
 *
 * @api private
 * @param {Track} track
 */

function getFormattedPromotion(track) {
  var props = track.properties();
  return {
    id: track.promotionId() || track.id(),
    name: track.name(),
    creative: props.creative,
    position: props.position
  };
}

/**
 * Enhanced ecommerce format data for product.
 *
 *
 * @api private
 * @param {Track} track
 */

function getFormattedProduct(track) {
  var props = track.properties();
  var product = {
    id: track.productId() || track.id() || track.sku(),
    name: track.name(),
    category: track.category(),
    quantity: track.quantity(),
    price: track.price(),
    brand: props.brand,
    variant: props.variant,
    currency: track.currency()
  };

  // https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#product-data
  // GA requires an integer but our specs says "Number", so it could be a float.
  if (props.position != null) {
    product.position = Math.round(props.position);
  }

  // append coupon if it set
  // https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-transactions
  var coupon = track.coupon();
  if (coupon) product.coupon = coupon;

  return product;
}

function getFormattedProductList(track) {
  var productList = [];
  var products = track.products();
  var props = track.properties();

  for (var i = 0; i < products.length; i++) {
    var product = new Track({ properties: products[i] });
    var productId = product.id() || product.productId() || product.sku();
    if (productId) {
      productList.push({
        id: productId,
        name: product.name(),
        category: product.category() || track.category(),
        list_name: props.list_id || track.category() || 'products',
        brand: product.properties().brand,
        variant: product.properties().variant,
        quantity: product.quantity(),
        price: product.price(),
        list_position: getProductPosition(product, products)
      });
    }
  }
  return productList;
}

function getProductPosition(item, products) {
  var position = item.properties().position;
  if (
    typeof position !== 'undefined' &&
    !Number.isNaN(Number(position)) &&
    Number(position) > -1
  ) {
    // If position passed and is valid positive number.
    return Number(position);
  }
  var productIds = products
    .map(function(x) {
      return x.product_id;
    })
    .filter(Boolean);
  if (productIds.length === 0) {
    productIds = products.map(function(x) {
      return x.sku;
    });
    return productIds.indexOf(item.sku()) + 1;
  }
  return productIds.indexOf(item.productId()) + 1;
}

/**
 * Merge two javascript objects. This works similarly to `Object.assign({}, obj1, obj2)`
 * but it's compatible with old browsers. The properties of the first argument takes preference
 * over the other.
 *
 * It does not do fancy stuff, just use it with top level properties.
 *
 * @param {Object} obj1 Object 1
 * @param {Object} obj2 Object 2
 *
 * @return {Object} a new object with all the properties of obj1 and the remainder of obj2.
 */
function merge(obj1, obj2) {
  var res = {};

  // All properties of obj1
  for (var propObj1 in obj1) {
    if (obj1.hasOwnProperty(propObj1)) {
      res[propObj1] = obj1[propObj1];
    }
  }

  // Extra properties of obj2
  for (var propObj2 in obj2) {
    if (obj2.hasOwnProperty(propObj2) && !res.hasOwnProperty(propObj2)) {
      res[propObj2] = obj2[propObj2];
    }
  }

  return res;
}

// Exposed only for testing
GTAG.merge = merge;
