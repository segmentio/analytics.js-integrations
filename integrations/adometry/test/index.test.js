'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var assert = require('proclaim');
var fmt = require('@segment/fmt');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Adometry = require('../lib/');

describe('Adometry', function() {
  var adometry;
  var analytics;
  var protocol = 'http:';
  var settings = {
    advertiserId: '1',
    campaignId: '3851',
    pageId: '730111',
    anonymousId: '123wcj',
    events: {
      'Home Page': '730792',
      'Signed Up': '730792'
    },
    aliases: {
      anonymous: 'ano',
      label: 'lab'
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    adometry = new Adometry(settings);
    analytics.use(Adometry);
    analytics.use(tester);
    analytics.add(adometry);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    adometry.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Adometry,
      integration('Adometry')
        .option('advertiserId', '')
        .option('campaignId', '')
        .option('pageId', '')
        .mapping('events')
        .mapping('aliases')
    );
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(adometry, 'load');
      });

      it('should map events', function() {
        var event = 'Signed Up';
        var tag = fmt(
          '<script src="%s//js.dmtry.com/channel.js#gid:%s;advid:%s;pid:%s;cus.lab:omg"></script>',
          protocol,
          settings.campaignId,
          settings.advertiserId,
          settings.events[event]
        );
        analytics.track(event, { label: 'omg' });
        analytics.loaded(tag);
      });

      it('should not add `undefined` to the URL when no properties are passed', function() {
        var event = 'Signed Up';
        var tag = fmt(
          '<script src="%s//js.dmtry.com/channel.js#gid:%s;advid:%s;pid:%s"></script>',
          protocol,
          settings.campaignId,
          settings.advertiserId,
          settings.events[event]
        );
        analytics.track(event);
        analytics.loaded(tag);
      });

      it('should ignore un-aliased properties', function() {
        analytics.spy(adometry, '_hashify');
        analytics.track('Signed Up', { ignore: 'me' });
        analytics.called(adometry._hashify, {});
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.spy(adometry, 'load');
      });

      it('should fire the page script with the proper IDs', function() {
        var name = 'Home Page';
        var tag = fmt(
          '<script src="%s//js.dmtry.com/channel.js#gid:%s;advid:%s;pid:%s;cus.ano:%s"></script>',
          protocol,
          settings.campaignId,
          settings.advertiserId,
          settings.pageId,
          settings.anonymousId
        );
        analytics.user().anonymousId(settings.anonymousId);
        analytics.page(name);
        analytics.loaded(tag);
      });
    });

    describe('#_hashify', function() {
      it('should format an object in key:value format with a leading semicolon', function() {
        assert.equal(
          adometry._hashify({ one: 1, two: 'TWO' }),
          ';one:1;two:TWO'
        );
      });

      it('should return an empty string for an empty object', function() {
        assert.equal(adometry._hashify({}), '');
      });

      it('should return an empty string for a null or undefined `props`', function() {
        assert.equal(adometry._hashify(null), '');
        assert.equal(adometry._hashify(undefined), '');
      });

      it('should append an optional prefix to parameters', function() {
        assert.equal(
          adometry._hashify({ one: 1, two: 'TWO' }, 'cus.'),
          ';cus.one:1;cus.two:TWO'
        );
      });
    });
  });
});
