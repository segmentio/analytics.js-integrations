'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');
var Extole = require('../lib/');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');

describe('Extole', function() {
  var extole;
  var analytics;
  var options = {
    clientId: 99286621,
    events: {
      'Completed Order': 'purchase',
      'Completed Loan': 'purchase',
      'Investment Made': 'purchase'
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    extole = new Extole(options);
    analytics.use(Extole);
    analytics.use(tester);
    analytics.add(extole);
  });

  afterEach(function(done) {
    function teardown() {
      analytics.restore();
      analytics.reset();
      extole.reset();
      sandbox();
      done();
    }

    if (extole.loaded() && window.extole.main) {
      return waitForWidgets(function() {
        xtlTearDown();
        teardown();
      });
    }

    teardown();
  });

  it('should have the correct settings', function() {
    analytics.compare(Extole, integration('Extole')
      .global('extole')
      .option('clientId', '')
      .mapping('events'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.spy(extole, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.called(extole.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(extole, done);
    });

    it('should create window.extole object when loaded', function(done) {
      analytics.assert(!window.extole);
      analytics.load(extole, function() {
        analytics.assert(window.extole);
        done();
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', function() {
        if (window.extole.microsite) {
          done();
        } else {
          window.extole.initializeGo().andWhenItsReady(done);
        }
      });
      analytics.initialize();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.identify(12345, {
          name: 'first last',
          email: 'name@example.com'
        });

        analytics.stub(window.extole.main, 'fireConversion');
      });

      it('should track an event listed in the `events` mapping', function() {
        analytics.track('Completed Loan', { total: 1.23 });
        analytics.called(window.extole.main.fireConversion);
      });

      it('should track a different event', function() {
        analytics.track('Completed Order', { total: 1.95 });
        analytics.called(window.extole.main.fireConversion);
      });

      it('should not track an event that is not listed in the `events` mapping', function() {
        analytics.track('Nonexistent', { craziness: 9.99 });
        analytics.didNotCall(window.extole.main.fireConversion);
      });
    });

    describe('data mapper', function() {
      it('should convert `purchase` events to Extole\'s format', function() {
        var userId = 12345;
        var email = 'name@example.com';
        var event = 'Completed Order';
        var data = {
          orderId: 12345,
          total: 1.95,
          products: [{
            sku: 'fakesku',
            quantity: 1,
            price: 1.95,
            name: 'fake-product'
          }]
        };
        var expected = {
          'tag:cart_value': 1.95,
          'tag:segment_event': event,
          e: email,
          orderId: 12345,
          partner_conversion_id: userId,
          products: [{
            sku: 'fakesku',
            quantity: 1,
            price: 1.95,
            name: 'fake-product'
          }]
        };

        analytics.deepEqual(extole._formatConversionParams(event, email, userId, data), expected);
      });
    });
  });
});

/**
 * Extole setup/teardown helper functions.
 */

function waitForWidgets(cb, attempts) {
  window.extole.require(['jquery'], function($) {
    attempts = attempts || 70;
    if (
      attempts < 2
        || $('[id^="extole-advocate-widget"]')[0]
        && $('[id^="easyXDM_cloudsponge"]')[0]
        && $('#cs_container')[0]
        && $('#cs_link')[0]
    ) {
      window.setTimeout(cb, 200);
    } else {
      window.setTimeout(function() {
        waitForWidgets(cb, attempts - 1);
      }, 100);
    }
  });
}

function messageListenerOff() {
  window.extole.require(['jquery'], function($) {
    var windowEvents = $._data($(window)[0], 'events');

    if (windowEvents) {
      each(function(msgEvent) {
        var msgNamespace;
        if (msgEvent.namespace && msgEvent.namespace.match) {
          msgNamespace = msgEvent.namespace.match(/^view\d+$/);
          if (msgNamespace) {
            $(window).off('message.' + msgNamespace);
          }
        }
      }, windowEvents.message);
    }
  });
}

function xtlTearDown() {
  window.extole.require(['jquery'], function($) {
    var xtlSelectors = '[id^="extole-"], [id^="easyXDM_cloudsponge"], div[class^="extole"], #cs_container, #cs_link, #wrapped, #footer, style, link[href="https://api.cloudsponge.com/javascripts/address_books/floatbox.css"], link[href^="https://media.extole.com/"]';
    $(xtlSelectors).remove();
    delete window.cloudsponge;
    messageListenerOff();
  });
}
