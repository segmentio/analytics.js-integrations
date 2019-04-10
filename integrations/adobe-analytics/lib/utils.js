'use strict';

/**
 * @typedef {Object} AdobeEventMapping
 * @property {string} valueScope
 * @property {string} segmentProp
 * @property {string} adobeEvent
 */

/**
 * @typedef {Object} ProductEvarMapping
 * @property {string} key
 * @property {string} value
 */

/**
 * Merch Event Setting structure.
 * @typedef {Object} MerchEventSetting
 * @property {string} segmentEvent
 * @property {AdobeEventMapping[]} adobeEvent
 * @property {ProductEvarMapping[]} productEVars
 */

/**
 * Filter out any merch event settings that are not mapped to the current event.
 * @param {object} facade
 * @param {Object} options
 * @param {MerchEventSetting[]} options.merchEvents
 * @returns {MerchEventSetting | undefined}
 */

function getMerchEventMapping(facade, options) {
  var eventName = getEventName(facade);
  var merchEvents = options.merchEvents || [];
  for (var i = 0; i < merchEvents.length; i++) {
    var mapping = merchEvents[i];
    var mappedEventName = mapping.segmentEvent;
    if (mappedEventName) {
      if (eventName === mappedEventName.toLowerCase()) {
        return mapping;
      }
    }
  }
}

/**
 * Get the event name to use as the lookup when finding relevant merch event mappings.
 * Based on the logic in the SS component.
 * @param {object} facade
 * @returns {string | undefined}
 */
function getEventName(facade) {
  if (facade.type() === 'page') {
    var eventName = facade.properties().eventName;
    if (eventName && typeof eventName === 'string') {
      return eventName.toLowerCase();
    }
  }

  if (facade.type() === 'track') {
    return facade.event().toLowerCase();
  }

  return '';
}

/**
 * Get the value to use as the incrementer for a product level event.
 * @param {MerchEventSetting['adobeEvent']} mapping
 * @param {Object} properties
 * @returns {*}
 */
function getEventValue(mapping, properties) {
  if (mapping.valueScope === 'product' || mapping.segmentProp == null) {
    // If the valueScope is product, the Adobe event must
    // still be passed in to s.events but without a value
    return '';
  }
  return properties[mapping.segmentProp];
}

/**
 * Create the event and/or evar section of the s.products string.
 * Structure should be: event_incrementer;eVarN=merch_category|eVarM=merch_category2
 * @param {Object} facade
 * @param {Object} options
 * @param {Object} product
 * @returns {string | undefined}
 */
function buildEventAndEvarString(facade, options, product) {
  var properties = facade.properties();
  var merchEventMapping = getMerchEventMapping(facade, options);

  if (merchEventMapping) {
    // Build events string
    var events = merchEventMapping.adobeEvent
      .reduce(function(accumulator, adobeEvent) {
        var str = createProductStringMember(
          adobeEvent.adobeEvent,
          adobeEvent.segmentProp,
          properties,
          product
        );
        if (str) {
          accumulator.push(str);
        }
        return accumulator;
      }, [])
      .join('|');

    // Build eVars string
    var evars = merchEventMapping.productEVars
      .reduce(function(accumulator, evarMapping) {
        var str = createProductStringMember(
          evarMapping.value,
          evarMapping.key,
          properties,
          product
        );
        if (str) {
          accumulator.push(str);
        }
        return accumulator;
      }, [])
      .join('|');

    if (evars.length) {
      return events.concat(';', evars);
    }

    return events;
  }
}

/**
 * Get the incrementer for a given evar mapping or event mapping.
 * @param {string} prefix
 * @param {string} segmentProp
 * @param {object} properties
 * @param {object} product
 * @returns {string | undefined}
 */
function createProductStringMember(prefix, segmentProp, properties, product) {
  var incrementValue;
  if (segmentProp.indexOf('products.') === 0) {
    var key = segmentProp.split('.').pop();
    incrementValue = product[key];
  } else {
    incrementValue = properties[segmentProp];
  }

  if (incrementValue !== undefined) {
    return prefix.concat('=', incrementValue);
  }
}

module.exports = {
  getMerchEventMapping: getMerchEventMapping,
  getEventValue: getEventValue,
  buildEventAndEvarString: buildEventAndEvarString
};
