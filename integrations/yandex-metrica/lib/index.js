'use strict';

/**
 * Module dependencies.
 */

var bind = require('component-bind');
var each = require('component-each');
var tick = require('next-tick');
var when = require('do-when');
var dataLayerPush = require('global-queue')('dataLayer', { wrap: false });
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Yandex` integration.
 */

var Yandex = (module.exports = integration('Yandex Metrica')
  .assumesPageview()
  .global('yandex_metrika_callbacks')
  .global('Ya')
  .option('type', 0)
  .option('counterId', null)
  .option('clickmap', false)
  .option('webvisor', false)
  .option('trackHash', false)
  .option('trackLinks', false)
  .option('accurateTrackBounce', false)
  .tag('<script src="//mc.yandex.ru/metrika/watch.js">'));

/**
 * Initialize.
 *
 * https://tech.yandex.com/metrika/
 * http://help.yandex.com/metrica/objects/creating-object.xml
 *
 * @api public
 */

Yandex.prototype.initialize = function() {
  var id = this.options.counterId;
  var type = this.options.type;
  var clickmap = this.options.clickmap;
  var webvisor = this.options.webvisor;
  var trackHash = this.options.trackHash;
  var trackLinks = this.options.trackLinks;
  var accurateTrackBounce = this.options.accurateTrackBounce;

  push(function() {
    window['yaCounter' + id] = new window.Ya.Metrika({
      id: id,
      type: type,
      clickmap: clickmap,
      webvisor: webvisor,
      trackHash: trackHash,
      trackLinks: trackLinks,
      accurateTrackBounce: accurateTrackBounce
    });
  });

  var loaded = bind(this, this.loaded);
  var ready = this.ready;
  this.load(function() {
    when(loaded, function() {
      tick(ready);
    });
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Yandex.prototype.loaded = function() {
  return !!(window.Ya && window.Ya.Metrika);
};

/**
 * Push a new callback on the global Yandex queue.
 *
 * @api private
 * @param {Function} callback
 */

function push(callback) {
  window.yandex_metrika_callbacks = window.yandex_metrika_callbacks || [];
  window.yandex_metrika_callbacks.push(callback);
}

/**
 * Create dataLayerObj for desired action
 * 
 * @param {String} action ("detail", "add", "remove")
 * @param {Track} track
*/
function createEcommerceObj(action, track) {
  var props = track.properties();
  return {
      "ecommerce": {
          "currencyCode": track.currency(),
          [action]: {
              "products": [
                  {
                      "id": track.productId() || track.id() || track.sku() || '',
                      "name" : track.name() || '',
                      "price": track.price(),
                      "brand": props.brand,
                      "category": track.category() || '',
                      "variant" : props.variant,
                  }
              ]
          }
      }
  };
}

/**
 * Product viewed.
 * (RU) https://yandex.ru/support/metrica/ecommerce/data.html#examples__product-detail
 * (EN) https://translate.google.com/translate?sl=auto&tl=en&u=https://yandex.ru/support/metrica/ecommerce/data.html%23examples__product-detail
 * @api private
 * @param {Track} track
 */

Yandex.prototype.productViewed = function(track) {
  dataLayerPush(createEcommerceObj("detail", track));
};

/**
 * Product added to the card.
 * (RU) https://yandex.ru/support/metrica/ecommerce/data.html#examples__add
 * (EN) https://translate.google.com/translate?sl=auto&tl=en&u=https://yandex.ru/support/metrica/ecommerce/data.html%23examples__add
 * @api private
 * @param {Track} track
 */

Yandex.prototype.productAdded = function(track) {
  dataLayerPush(createEcommerceObj("add", track));
};

/**
 * Product removed from the card.
 * (RU) https://yandex.ru/support/metrica/ecommerce/data.html#examples__remove
 * (EN) https://translate.google.com/translate?sl=auto&tl=en&u=https://yandex.ru/support/metrica/ecommerce/data.html%23examples__remove
 * @api private
 * @param {Track} track
 */

Yandex.prototype.productRemoved = function(track) {
  dataLayerPush(createEcommerceObj("remove", track));
};

/**
 * Order completed.
 *
 * (RU) https://yandex.ru/support/metrica/ecommerce/data.html#examples__purchase
 * (EN) https://translate.google.com/translate?sl=auto&tl=en&u=https://yandex.ru/support/metrica/ecommerce/data.html%23examples__purchase
 *
 * @param {Track} track
 * @api private
 */

Yandex.prototype.orderCompleted = function(track) {
  var props = track.properties();
  var products = track.products();
  var productsList = [];
  
  // add products
  each(products, function(product) {
    var productTrack = createProductTrack(track, product);
    productsList.push({
      category: productTrack.category(),
      quantity: productTrack.quantity(),
      price: productTrack.price(),
      name: productTrack.name(),
      sku: productTrack.sku(),
      id: productTrack.sku(),
      currency: productTrack.currency(),
      brand: productTrack.properties().brand,
      variant: productTrack.properties().variant,
    });
  });
  
  dataLayerPush({
      "ecommerce": {
          "currencyCode": track.currency(),
          "purchase": {
              "actionField": {
                  "id" : track.orderId(),
              },
              "products": productsList
          }
      }
  });
};

/**
 * Creates a track out of product properties.
 *
 * @api private
 * @param {Track} track
 * @param {Object} properties
 * @return {Track}
 */

function createProductTrack(track, properties) {
  var props = properties || {};
  props.currency = properties.currency || track.currency();
  return new Track({ properties: props });
}
