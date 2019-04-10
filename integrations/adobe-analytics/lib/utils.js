'use strict';

/**
 * Merch Event Setting structure.
 * @typedef {Object} MerchEventSetting
 * @property {string} segmentEvent
 * @property {{valueScope: string, segmentProp: string, adobeEvent: string}[]} adobeEvent
 * @property {{key: string, value: string}[]} productEVars
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
 *
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

module.exports = {
  getMerchEventMapping: getMerchEventMapping,
  getEventValue: getEventValue
};
