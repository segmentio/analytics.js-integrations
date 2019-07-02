'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Pinterest = require('../lib/');

describe('Pinterest', function() {
  var analytics;
  var pinterest;
  var options = {
    tid: '2620795819800',
    pinterestEventMapping: {
      'Some Custom Event': 'Custom',
      'Lead Generated': 'Lead',
      'User Signed Up': 'Signup'
    },
    initWithExistingTraits: false,
    pinterestCustomProperties: ['custom_prop']
  };

  beforeEach(function() {
    analytics = new Analytics();
    pinterest = new Pinterest(options);
    analytics.use(Pinterest);
    analytics.use(tester);
    analytics.add(pinterest);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    pinterest.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Pinterest,
      integration('Pinterest Tag')
        .global('pintrk')
        .mapping('pinterestEventMapping')
        .option('pinterestCustomProperties', [])
        .option('initWithExistingTraits', false)
        .option('tid', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(pinterest, 'load');
      analytics.stub(window, 'pintrk');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(pinterest.load);
        analytics.called(window.pintrk, 'load', options.tid);
      });
    });

    describe('#initialize with traits enabled', function() {
      before(function() {
        options.initWithExistingTraits = true;
      });

      after(function() {
        options.initWithExistingTraits = false;
      });

      it("should call init with the user's traits if option enabled", function() {
        // For existing traits
        analytics.identify('123', {
          name: 'Ash Ketchum',
          email: 'ash@ketchum.com',
          gender: 'Male',
          birthday: '01/13/1991',
          address: {
            city: 'Emerald',
            state: 'Kanto',
            postalCode: 123456
          }
        });

        analytics.initialize();

        analytics.called(window.pintrk, 'load', options.tid, {
          em: 'ash@ketchum.com'
        });
      });

      it("should call init with the user's traits if option enabled but no identify call was made", function() {
        analytics.reset();
        analytics.initialize();

        analytics.called(window.pintrk, 'load', options.tid);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(pinterest, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.stub(pinterest, 'load');
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.spy(window, 'pintrk');
      });

      it('should not fire the Pinterest pixel tag', function() {
        analytics.identify();
        analytics.didNotCall(window.pintrk);
      });
      it('should push Segment email to Pinterest Enhanced Match', function() {
        analytics.identify('123', { email: 'prakash@segment.com' });
        analytics.called(window.pintrk, 'load', '2620795819800', {
          em: 'prakash@segment.com'
        });
      });
    });
  });
});
