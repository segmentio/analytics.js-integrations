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
    pinterestCustomProperties: ['custom_prop']
  };

  beforeEach(function() {
    analytics = new Analytics();
    pinterest = new Pinterest(options);
    analytics.use(Pinterest);
    analytics.use(tester);
    analytics.add(pinterest);
    analytics.identify('123', {
      e_mail: 'chris@sperand.io'
    });
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
        .option('tid', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(pinterest, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(pinterest.load);
      });

      it("should call load with the user's email if it's there", function() {
        analytics.stub(window, 'pintrk');
        analytics.initialize();
        analytics.called(window.pintrk, 'load', options.tid, {
          em: 'chris@sperand.io'
        });
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
  });
});
