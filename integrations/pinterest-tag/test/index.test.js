'use strict'

var Analytics = require('@segment/analytics.js-core').constructor
var integration = require('@segment/analytics.js-integration')
var tester = require('@segment/analytics.js-integration-tester')
var sandbox = require('@segment/clear-env')
var Pinterest = require('../lib/')

describe('Pinterest', function () {
  var analytics
  var pinterest
  var options = {
    tid: '2620795819800',
    pinterestEventMapping: {
      'Some Custom Event': 'Custom',
      'Lead Generated': 'Lead',
      'User Signed Up': 'Signup'
    },
    pinterestCustomProperties: [
      'custom_prop'
    ],
    initWithExistingTraits: false
  }

  beforeEach(function () {
    analytics = new Analytics()
    pinterest = new Pinterest(options)
    analytics.use(Pinterest)
    analytics.use(tester)
    analytics.add(pinterest)
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
  })

  afterEach(function () {
    analytics.restore()
    analytics.reset()
    pinterest.reset()
    sandbox()
  })

  it('should have the right settings', function () {
    analytics.compare(Pinterest, integration('Pinterest Tag')
      .global('pintrk')
      .mapping('pinterestEventMapping')
      .option('pinterestCustomProperties', [])
      .option('tid', '')
      .option('initWithExistingTraits', false))
  })

  before(function() {
    options.initWithExistingTraits = true;
  });

  after(function() {
    options.initWithExistingTraits = false;
  });

  it('should call init with the user\'s traits if option enabled', function() {
    var payload = {
      em: 'ash@ketchum.com',
    };
    analytics.stub(window, 'pintrk');
    analytics.initialize();
    analytics.called(window.pintrk, 'init', options.tid, payload);
  });

  describe('before loading', function () {
    beforeEach(function () {
      analytics.stub(pinterest, 'load')
    })

    describe('#initialize', function () {
      it('should call #load', function () {
        analytics.initialize()
        analytics.page()
        analytics.called(pinterest.load)
      })
    })
  })

  describe('loading', function () {
    it('should load', function (done) {
      analytics.load(pinterest, done)
    })
  })
})
