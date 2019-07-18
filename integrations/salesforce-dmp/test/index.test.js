'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var SalesforceDMP = require('../lib/');
var Track = require('segmentio-facade').Track;

describe('Salesforce DMP', function() {
  var analytics;
  var salesforceDMP;
  var options = {
    confId: '123',
    useV2LogicClient: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    salesforceDMP = new SalesforceDMP(options);
    analytics.use(SalesforceDMP);
    analytics.use(tester);
    analytics.add(salesforceDMP);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    salesforceDMP.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      SalesforceDMP,
      integration('Salesforce DMP').option('confId', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(salesforceDMP, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.stub(salesforceDMP, 'load');
        analytics.initialize();
        analytics.page();
        analytics.called(salesforceDMP.load);
        analytics.assert(window.Krux);
      });
    });
  });
});

describe('Salesforce DMP V2', function() {
  var analytics;
  var salesforceDMP;
  var optionsV2 = {
    confId: '123',
    useV2LogicClient: true,
    sendEventNames: true,
    sendIdentifyAsEventName: true,
    namespace: 'test',
    trackFireEvents: ['event'],
    eventAttributeMap: { test: 'test_property' },
    contextTraitsMap: { trait: 'context_trait' }
  };

  beforeEach(function() {
    analytics = new Analytics();
    salesforceDMP = new SalesforceDMP(optionsV2);
    analytics.use(SalesforceDMP);
    analytics.use(tester);
    analytics.add(salesforceDMP);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    salesforceDMP.reset();
    if (window.kruxDataLayer) delete window.kruxDataLayer;
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      SalesforceDMP,
      integration('Salesforce DMP').option('confId', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(salesforceDMP, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(salesforceDMP.load);
        analytics.assert(window.Krux);
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.stub(salesforceDMP, 'load');
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window, 'Krux');
      });

      it('should fire the Krux pixel tag', function() {
        analytics.identify();
        analytics.called(window.Krux);
      });

      it('should push Segment user ids to the dataLayer', function() {
        analytics.identify('123');
        analytics.assert(window.kruxDataLayer.segmentio_user_id === '123');
        analytics.assert(window.kruxDataLayer.segmentio_anonymous_id);
      });

      it('should push `identify` to the dataLayer as `event_name', function() {
        analytics.identify('123');
        analytics.assert(window.kruxDataLayer.event_name === 'identify');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'Krux');
      });

      it('should fire the Krux pixel tag', function() {
        analytics.track('event');
        analytics.called(window.Krux);
      });

      it('should push Segment anonymous id to the dataLayer', function() {
        analytics.track('event');
        analytics.assert(window.kruxDataLayer.segmentio_anonymous_id);
      });

      it('should not push event properties to the dataLayer if properties are not mapped in settings', function() {
        analytics.track('event', {
          property: 'value'
        });
        analytics.assert(!window.kruxDataLayer.property);
      });

      it('should not create a dataLayer if the Segment track event is not mapped in settings', function() {
        analytics.track('test', {
          test: 'value'
        });
        analytics.assert(!window.kruxDataLayer);
      });

      it('should push event properties only if both the event and property are mapped in settings', function() {
        analytics.track('event', {
          test: 'value'
        });
        analytics.assert(window.kruxDataLayer.test_property === 'value');
      });

      it('should push mapped contextTraits to the dataLayer', function() {
        analytics.track(
          'event',
          {},
          {
            context: {
              traits: {
                trait: 'value'
              }
            }
          }
        );
        analytics.assert(window.kruxDataLayer.context_trait === 'value');
      });

      it('should push the event name to the dataLayer if `sendEventNames` setting is enabled', function() {
        analytics.track('event');
        analytics.assert(window.kruxDataLayer.event_name === 'event');
      });

      it('should not override an `event_name` that has already been pushed to the dataLayer', function() {
        window.kruxDataLayer = {};
        window.kruxDataLayer.event_name = 'do not override';
        analytics.track('event');
        analytics.assert(window.kruxDataLayer.event_name === 'do not override');
      });

      // previously SFDMP would throw an error if a customer invoked an
      // unmapped `track` event while `sendEventNames` setting was enabled
      // this edge case has been resolved, but we test for it anyway
      it('does not throw an error if `sendEventNames` setting is enabled but no track events are whitelisted', function() {
        var edgeCaseOptions = {
          confId: '123',
          useV2LogicClient: true,
          sendEventNames: true,
          sendIdentifyAsEventName: true,
          namespace: 'test',
          trackFireEvents: [],
          eventAttributeMap: {},
          contextTraitsMap: { trait: 'context_trait' }
        };

        salesforceDMP = new SalesforceDMP(edgeCaseOptions);
        analytics.doesNotThrow(function() {
          salesforceDMP.track(new Track({ name: 'Testing' }));
        });
      });
    });
  });
});
