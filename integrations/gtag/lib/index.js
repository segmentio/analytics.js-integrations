'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('gtagDataLayer', { wrap: false });
var Track = require('segmentio-facade').Track;

/**
 * Expose `GTAG`.
 *  Purposely using different data-layer name to avoid conflicts
 *  with any other tool.
 */

var GTAG = (module.exports = integration('Gtag')
  .global('gtagDataLayer')
  .option('GA_WEB_MEASUREMENT_ID', '')
  .option('GA_WEB_APP_MEASUREMENT_ID', '')
  .option('AW_CONVERSION_ID', '')
  .option('DC_FLOODLIGHT_ID', '')
  .option('trackAllPages', false)
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true)
  .option('sendTo', [])
  .option('gaOptions', {
    classic: false,
    enhancedEcommerce: false,
    setAllMappedProps: true
  })
  .tag(
    '<script src="//www.googletagmanager.com/gtag/js?id={{ accountId }}&l=gtagDataLayer">'
  ));

GTAG.on('construct', function(Integration) {
  /* eslint-disable */
  if (Integration.options.gaOptions.classic) {
      Integration.page = Integration.pageClassic;
      Integration.orderCompleted = Integration.orderCompletedClassic;
    } else if (Integration.options.gaOptions.enhancedEcommerce) {
      Integration.productListViewed = Integration.productListViewedEnhanced;
      Integration.productClicked = Integration.productClickedEnhanced;
      Integration.productViewed = Integration.productViewedEnhanced;
      Integration.productAdded = Integration.productAddedEnhanced;
      Integration.productRemoved = Integration.productRemovedEnhanced;
      Integration.promotionViewed = Integration.promotionViewedEnhanced;
      Integration.promotionClicked = Integration.promotionClickedEnhanced;
      Integration.checkoutStarted = Integration.checkoutStartedEnhanced;

      // Integration.checkoutStepViewed = Integration.checkoutStepViewedEnhanced;
      // Integration.checkoutStepCompleted =
      //   Integration.checkoutStepCompletedEnhanced;
      // Integration.orderUpdated = Integration.orderUpdatedEnhanced;
      // Integration.orderCompleted = Integration.orderCompletedEnhanced;
      // Integration.orderRefunded = Integration.orderRefundedEnhanced;
      // Integration.productListFiltered = Integration.productListFilteredEnhanced;
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
  var config = [];
  var that = this;
  var gaOptions = this.options.gaOptions;
  var GA_WEB_MEASUREMENT_ID = this.options.GA_WEB_MEASUREMENT_ID;
  var GA_WEB_APP_MEASUREMENT_ID = this.options.GA_WEB_APP_MEASUREMENT_ID;
  var AW_CONVERSION_ID = this.options.AW_CONVERSION_ID;
  var DC_FLOODLIGHT_ID = this.options.DC_FLOODLIGHT_ID;
  var accountId =
    GA_WEB_MEASUREMENT_ID ||
    GA_WEB_APP_MEASUREMENT_ID ||
    AW_CONVERSION_ID ||
    DC_FLOODLIGHT_ID;

  if (GA_WEB_MEASUREMENT_ID) {
    config.push(['config', GA_WEB_MEASUREMENT_ID]);
    if (gaOptions && Object.keys(gaOptions).length) {
      // set custom dimension and metrics if present
      push('config', GA_WEB_MEASUREMENT_ID, {
        custom_map: merge(gaOptions.dimensions, gaOptions.metrics)
      });
    }
  }

  if (GA_WEB_APP_MEASUREMENT_ID) {
    config.push(['config', GA_WEB_APP_MEASUREMENT_ID]);
    if (gaOptions && Object.keys(gaOptions).length) {
      // set custom dimension and metrics if present
      push('config', GA_WEB_APP_MEASUREMENT_ID, {
        custom_map: merge(gaOptions.dimensions, gaOptions.metrics)
      });
    }
  }

  if (AW_CONVERSION_ID) {
    config.push(['config', AW_CONVERSION_ID]);
  }

  if (DC_FLOODLIGHT_ID) {
    config.push(['config', DC_FLOODLIGHT_ID]);
  }

  if (accountId) {
    this.load({ accountId: accountId }, function() {
      // Default routing.
      for (var i = 0; i < config.length; i++) {
        push(config[i][0], config[i][1]);
      }
      that.ready();
    });
  } else {
    // Error case where not any of the ID specified
  }
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
  if (userId) {
    if (this.options.GA_WEB_MEASUREMENT_ID) {
      push('config', this.options.GA_WEB_MEASUREMENT_ID, {
        user_id: userId
      });
    }
    if (this.options.GA_WEB_APP_MEASUREMENT_ID) {
      push('config', this.options.GA_WEB_APP_MEASUREMENT_ID, {
        user_id: userId
      });
    }
  }
};

/**
 * Track
 *
 * @api public
 * @param {Track} track
 */

GTAG.prototype.track = function(track) {
  var options = this.options;
  var props = track.properties();
  props.event = track.event() || '';

  var gaOptions = this.options.gaOptions || {};
  if (gaOptions && Object.keys(gaOptions).length) {
    if (gaOptions.setAllMappedProps) {
      // set custom dimension and metrics if present
      // REF: https://developers.google.com/analytics/devguides/collection/gtagjs/custom-dims-mets

      var customMap = merge(gaOptions.dimensions, gaOptions.metrics);
      if (options.GA_WEB_MEASUREMENT_ID) {
        push('config', this.options.GA_WEB_MEASUREMENT_ID, {
          custom_map: customMap
        });
      }
      if (options.GA_WEB_APP_MEASUREMENT_ID) {
        push('config', this.options.GA_WEB_APP_MEASUREMENT_ID, {
          custom_map: customMap
        });
      }
    }
  }
  if (this.options.sendTo && this.options.sendTo.length) {
    props.send_to = this.options.sendTo;
  }

  if (props.sendTo && props.sendTo.length) {
    // override the sendTo if provided event specific
    props.send_to = props.sendTo;
    delete props.sendTo;
  }
  push('event', props.event, props);
};

/**
 * Page
 *
 * @api public
 * @param {Page} page
 */

GTAG.prototype.page = function(page) {
  var name = page.fullName();
  var category = page.category();
  if (this.options.trackAllPages) {
    this.track(page.track());
  }
  if (name && this.options.trackNamedPages) {
    this.track(page.track(name));
  }
  if (category && this.options.trackCategorizedPages) {
    this.track(page.track(category));
  }
};

/**
 * Page (classic).
 *
 * @param {Page} page
 */

GTAG.prototype.pageClassic = function(page) {
  var name = page.fullName();
  var category = page.category();
  if (this.options.trackAllPages) {
    this.track(page.track());
  }
  if (name && this.options.trackNamedPages) {
    this.track(page.track(name));
  }
  if (category && this.options.trackCategorizedPages) {
    this.track(page.track(category));
  }
};

/**
 * Completed order.
 *
 * @param {Track} track
 * @api private
 */

GTAG.prototype.orderCompletedClassic = function(track) {
  var total = track.total() || track.revenue() || 0;
  var orderId = track.orderId();
  var currency = track.currency();
  var props = track.properties();

  // orderId is required.
  if (!orderId) {
    return;
  }

  push('event', 'purchase', {
    transaction_id: orderId,
    affiliation: props.affiliation,
    value: total,
    currency: currency,
    tax: track.tax(),
    shipping: track.shipping(),
    items: getFormattedProductList(track)
  });
};

/**
 * Product List Viewed - Enhanced Ecommerce
 *
 * @param {Track} track
 * @api private
 */

GTAG.prototype.productListViewedEnhanced = function(track) {
  push('event', 'view_item_list', {
    items: getFormattedProductList(track)
  });
};

/**
 * Product Clicked - Enhanced Ecommerce
 *
 * @param {Track} track
 * @api private
 */

GTAG.prototype.productClickedEnhanced = function(track) {
  push('event', 'select_content', {
    content_type: 'product',
    items: [getFormattedProduct(track)]
  });
};

/**
 * Product Viewed - Enhanced Ecommerce
 *
 * @param {Track} track
 * @api private
 */

GTAG.prototype.productViewedEnhanced = function(track) {
  push('event', 'view_item', {
    items: [getFormattedProduct(track)]
  });
};

/**
 * Product Added - Enhanced Ecommerce
 *
 * @param {Track} track
 * @api private
 */

GTAG.prototype.productAddedEnhanced = function(track) {
  push('event', 'add_to_cart', {
    items: [getFormattedProduct(track)]
  });
};

/**
 * Product Removed - Enhanced Ecommerce
 *
 * @param {Track} track
 * @api private
 */

GTAG.prototype.productRemovedEnhanced = function(track) {
  push('event', 'remove_from_cart', {
    items: [getFormattedProduct(track)]
  });
};

/**
 * Promotion Viewed - Enhanced Ecommerce
 *
 * @param {Track} track
 * @api private
 */

GTAG.prototype.promotionViewedEnhanced = function(track) {
  push('event', 'view_promotion', {
    promotions: [getFormattedPromotion(track)]
  });
};

/**
 * Promotion Clicked - Enhanced Ecommerce
 *
 * @param {Track} track
 * @api private
 */

GTAG.prototype.promotionClickedEnhanced = function(track) {
  push('event', 'select_content', {
    promotions: [getFormattedPromotion(track)]
  });
};

/**
 * Checkout Started - Enhanced Ecommerce
 *
 * @param {Track} track
 * @api private
 */

GTAG.prototype.checkoutStartedEnhanced = function(track) {
  var coupon = track.proxy('properties.coupon');

  push('event', 'begin_checkout', {
    items: getFormattedProductList(track),
    coupon: coupon
  });
};

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
  var coupon = track.proxy('properties.coupon');
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
