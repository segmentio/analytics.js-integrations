'use strict'

var Analytics = require('@segment/analytics.js-core').constructor
var sandbox = require('@segment/clear-env')
var tester = require('@segment/analytics.js-integration-tester')
var Asayer = require('../lib/')

describe('asayer', function () {
  var analytics
  var asayer

  beforeEach(function () {
    analytics = new Analytics()
    analytics.use(tester)
  })

  afterEach(function () {
    analytics.restore()
    analytics.reset()
    asayer.reset()
    sandbox()
  })

  describe('before loading', function () {
    it('should call #load', function () {
      asayer = new Asayer({ 'projectId': '1234' })
      analytics.use(Asayer)
      analytics.add(asayer)
      analytics.stub(asayer, 'load')
      analytics.initialize()
      analytics.called(asayer.load)
    })

    it('should not call #load for wrong projectId', function () {
      asayer = new Asayer({ 'projectId': 'wrong' })
      analytics.use(Asayer)
      analytics.add(asayer)
      analytics.stub(asayer, 'load')
      analytics.initialize()
      analytics.didNotCall(asayer.load)
    })
  })

  describe('after loading', function () {
    beforeEach(function (done) {
      asayer = new Asayer({ 'projectId': '1234' })
      analytics.use(Asayer)
      analytics.add(asayer)
      analytics.once('ready', done)
      analytics.initialize()
    })

    describe('#identify', function () {
      it('should send anonymousId', function () {
        analytics.stub(window.asayer, 'userAnonymousID')
        analytics.identify()
        analytics.called(window.asayer.userAnonymousID)
        var id = window.asayer.userAnonymousID.args[0][0]
        analytics.assert(id && typeof id === 'string')
      })

      it('should send userId', function () {
        analytics.stub(window.asayer, 'userID')
        analytics.identify('1')
        analytics.called(window.asayer.userID, '1')
      })

      it('should send only safe traits', function () {
        analytics.stub(window.asayer, 'metadata')
        analytics.identify('1', { 'email': 'hello@asayer.io', title: { hide: 'me' }, admin: true })
        var traits = {}
        window.asayer.metadata.args.forEach(function (entry) {
          traits[entry[0]] = entry[1]
        })
        analytics.assert(traits.email === 'hello@asayer.io' && !traits.title && traits.admin === 'true')
      })
    })

    describe('#track', function () {
      beforeEach(function () {
        analytics.stub(window.asayer, 'event')
      })

      it('should send event properties', function () {
        analytics.track('segment', { test: 'success' })
        analytics.called(window.asayer.event, 'segment', { test: 'success' })
      })
    })
  })
})
