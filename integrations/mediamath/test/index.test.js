'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var MediaMath = require('../lib/');

describe('MediaMath', function() {
  var mediamath;
  var analytics;
  var options = {
    events: [
      {
        key: 'testEvent',
        value: {
          event: 'testEvent',
          mtAdId: 'mt-ad-id',
          mtId: 'mt-id',
          vParameters: [
            {
              key: 'revenue',
              value: 'v1'
            },
            {
              key: 'plan',
              value: 'v2'
            },
            {
              key: 'color',
              value: 'v3'
            }
          ],
          sParameters: [
            {
              key: 'orderId',
              value: 's1'
            },
            {
              key: 'friendCount',
              value: 's2'
            },
            {
              key: 'name',
              value: 's3'
            }
          ]
        }
      },
      {
        key: 'testEvent2',
        value: {
          event: 'testEvent2',
          mtAdId: 'mt-ad-id',
          mtId: 'mt-id'
        }
      },
      {
        key: 'testEvent3',
        value: {
          event: 'testEvent3',
          mtAdId: 'mt-ad-id',
          mtId: 'mt-id',
          sParameters: [
            {
              key: 'random',
              value: 's9'
            }
          ]
        }
      }
    ]
  };

  beforeEach(function() {
    analytics = new Analytics();
    mediamath = new MediaMath(options);
    analytics.use(MediaMath);
    analytics.use(tester);
    analytics.add(mediamath);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    mediamath.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(MediaMath, integration('MediaMath').mapping('events'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.spy(mediamath, 'load');
    });

    describe('#initialize', function() {
      it('should not load a pixel if options not there', function() {
        analytics.initialize();
        analytics.page();
        analytics.didNotCall(mediamath.load);
      });

      it('should load a pixel if options are there', function() {
        mediamath.options.allPagesMtId = 'asdf';
        mediamath.options.allPagesMtAdId = 'lkjh';
        analytics.initialize();
        analytics.page();
        analytics.loaded(
          '<script src="http://pixel.mathtag.com/event/js?mt_id=asdf&mt_adid=lkjh&v1=&v2=&v3=&s1=&s2=&s3=">'
        );
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(mediamath, 'load');
      });

      it('should load the right pixel', function() {
        analytics.track('testEvent', { revenue: '$180', orderId: 43 });
        analytics.loaded(
          '<script src="http://pixel.mathtag.com/event/js?mt_id=mt-id&mt_adid=mt-ad-id&v1=180.00&v2=&v3=&s1=43&s2=&s3=">'
        );
      });

      it('should not load a pixel if not mapped', function() {
        analytics.track('notMapped');
        analytics.didNotCall(mediamath.load);
      });

      it('should work without `orderId` or `revenue`', function() {
        analytics.track('testEvent');
        analytics.loaded(
          '<script src="http://pixel.mathtag.com/event/js?mt_id=mt-id&mt_adid=mt-ad-id&v1=0.00&v2=&v3=&s1=&s2=&s3=">'
        );
      });

      it('should map properties to params if set in settings', function() {
        analytics.track('testEvent', {
          revenue: 99.99,
          orderId: 20,
          plan: 'Silver',
          color: 'silver',
          friendCount: 0,
          name: 'Chris'
        });
        analytics.loaded(
          '<script src="http://pixel.mathtag.com/event/js?mt_id=mt-id&mt_adid=mt-ad-id&v1=99.99&v2=Silver&v3=silver&s1=20&s2=0&s3=Chris">'
        );
      });

      it('should map arbitrarily ordered params', function() {
        analytics.track('testEvent3', { random: 'what' });
        analytics.loaded(
          '<script src="http://pixel.mathtag.com/event/js?mt_id=mt-id&mt_adid=mt-ad-id&v1=&v2=&v3=&s1=&s2=&s3=&s9=what">'
        );
      });

      it('should fail gracefully if s/v params not present settings', function() {
        analytics.track('testEvent2', {
          revenue: 99.99,
          orderId: 20,
          plan: 'Silver',
          color: 'silver',
          friendCount: 0,
          name: 'Chris'
        });
        analytics.loaded(
          '<script src="http://pixel.mathtag.com/event/js?mt_id=mt-id&mt_adid=mt-ad-id&v1=&v2=&v3=&s1=&s2=&s3=">'
        );
      });
    });
  });
});
