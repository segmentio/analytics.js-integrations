'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var AdWords = require('../lib/');
var sandbox = require('@segment/clear-env');

describe('AdWords', function() {
  var adwords;
  var analytics;
  var options = {
    conversionId: 978352801,
    eventMappings: [
      {
        key: 'signup',
        value: {
          eventName: 'signup',
          label: '-kGkCJ_TsgcQofXB0gM',
          conversionId: '',
          remarketing: false
        }
      },
      {
        key: 'login',
        value: {
          eventName: 'login',
          label: 'QbThCM_zogcQofXB0gM',
          conversionId: '',
          remarketing: false
        }
      },
      {
        key: 'play',
        value: {
          eventName: 'play',
          label: 'b91fc77f',
          conversionId: '',
          remarketing: false
        }
      }
    ],
    pageRemarketing: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    adwords = new AdWords(options);
    analytics.use(AdWords);
    analytics.use(tester);
    analytics.add(adwords);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    adwords.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(AdWords, integration('AdWords')
      .option('conversionId', '')
      .option('pageRemarketing', false)
      .option('eventMappings', []));
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(adwords, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'google_trackConversion');
      });

      it('should not load remarketing if option is not on', function() {
        adwords.options.pageRemarketing = false;
        analytics.page();
        analytics.calledOnce(window.google_trackConversion);
        analytics.deepEqual(window.google_trackConversion.args[0], [{
          google_conversion_id: options.conversionId,
          google_custom_params: {},
          google_remarketing_only: false
        }]);
      });

      it('should fire additional remarketing tag if option is on', function() {
        adwords.options.pageRemarketing = true;
        analytics.page();
        analytics.calledTwice(window.google_trackConversion);
        // fire conversion tag first
        analytics.deepEqual(window.google_trackConversion.args[0], [{
          google_conversion_id: options.conversionId,
          google_custom_params: {},
          google_remarketing_only: false 
        }]);
        // then fire remarketing with props
        analytics.deepEqual(window.google_trackConversion.args[1], [{
          google_conversion_id: options.conversionId,
          google_custom_params: {
            path: window.location.pathname,
            referrer: document.referrer,
            search: '',
            title: '',
            url: window.location.href
          },
          google_remarketing_only: true
        }]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'google_trackConversion');
      });

      it('should not send any tags if event is not defined', function() {
        analytics.track('toString', {});
        analytics.didNotCall(window.google_trackConversion);
      });

      it('should send conversion tag if event is defined', function() {
        analytics.track('signup', {});
        analytics.called(window.google_trackConversion, {
          google_conversion_id: options.conversionId,
          google_custom_params: {},
          google_conversion_language: 'en',
          google_conversion_format: '3',
          google_conversion_color: 'ffffff',
          google_conversion_label: options.eventMappings[0].value.label,
          google_conversion_value: 0,
          google_remarketing_only: false
        });
      });

      it('should use mapping specific IDs if provided', function() {
        adwords.options.eventMappings = [
          {
            key: 'signup',
            value: {
              eventName: 'signup',
              label: '-kGkCJ_TsgcQofXB0gM',
              conversionId: 431
            }
          },
          {
            key: 'signup',
            value: {
              eventName: 'signup',
              label: 'QbThCM_zogcQofXB0gM',
              conversionId: 23
            }
          }
        ];
        analytics.track('signup', {});
        analytics.called(window.google_trackConversion, {
          google_conversion_id: 431,
          google_custom_params: {},
          google_conversion_language: 'en',
          google_conversion_format: '3',
          google_conversion_color: 'ffffff',
          google_conversion_label: options.eventMappings[0].value.label,
          google_conversion_value: 0,
          google_remarketing_only: false
        });
        analytics.called(window.google_trackConversion, {
          google_conversion_id: 23,
          google_custom_params: {},
          google_conversion_language: 'en',
          google_conversion_format: '3',
          google_conversion_color: 'ffffff',
          google_conversion_label: options.eventMappings[1].value.label,
          google_conversion_value: 0,
          google_remarketing_only: false
        });
      });

      it('should send remarketing along with conversion if both are enabled', function() {
        adwords.options.eventMappings = [{ value: { eventName: 'danny mcbride is funny', conversionId: 4879235, remarketing: true, label: '' } }];
        analytics.track('danny mcbride is funny', { revenue: 90 });
        analytics.calledOnce(window.google_trackConversion);
        analytics.deepEqual(window.google_trackConversion.args[0], [{
          google_conversion_id: 4879235,
          google_custom_params: { revenue: 90 },
          google_remarketing_only: true
        }]);
      });

      it('should send revenue', function() {
        analytics.track('login', { revenue: 90 });
        analytics.called(window.google_trackConversion, {
          google_conversion_id: options.conversionId,
          google_custom_params: {},
          google_conversion_language: 'en',
          google_conversion_format: '3',
          google_conversion_color: 'ffffff',
          google_conversion_label: options.eventMappings[1].value.label,
          google_conversion_value: 90,
          google_remarketing_only: false
        });
      });

      it('should always send google_remarketing_only false for conversion tags', function() {
        adwords.options.remarketing = true;
        analytics.track('login', { revenue: 90 });
        analytics.called(window.google_trackConversion, {
          google_conversion_id: options.conversionId,
          google_custom_params: {},
          google_conversion_language: 'en',
          google_conversion_format: '3',
          google_conversion_color: 'ffffff',
          google_conversion_label: options.eventMappings[1].value.label,
          google_conversion_value: 90,
          google_remarketing_only: false
        });
      });

      it('should send only the conversion tag if remarketing is false', function() {
        adwords.options.remarketing = false;
        analytics.track('login', { revenue: 90 });
        analytics.calledOnce(window.google_trackConversion);
        analytics.deepEqual(window.google_trackConversion.args[0], [{
          google_conversion_id: options.conversionId,
          google_custom_params: {},
          google_conversion_language: 'en',
          google_conversion_format: '3',
          google_conversion_color: 'ffffff',
          google_conversion_label: options.eventMappings[1].value.label,
          google_conversion_value: 90,
          google_remarketing_only: false
        }]);
      });

      it('should send only the remarketing tag if no conversions are mapped but is whitelisted', function() {
        adwords.options.eventMappings = [{ value: { eventName: 'danny mcbride is funny', conversionId: '', remarketing: true, label: '' } }];
        analytics.track('danny mcbride is funny', { revenue: 90 });
        analytics.calledOnce(window.google_trackConversion);
        analytics.deepEqual(window.google_trackConversion.args[0], [{
          google_conversion_id: options.conversionId,
          google_custom_params: { revenue: 90 },
          google_remarketing_only: true
        }]);
      });

      it('should send both conversion and remarketing tag if remarketing is true', function() {
        adwords.options.eventMappings[1].value.remarketing = true;
        analytics.track('login', { revenue: 90, hello: 'foo' });
        analytics.calledTwice(window.google_trackConversion);
        analytics.deepEqual(window.google_trackConversion.args[0], [{
          google_conversion_id: options.conversionId,
          google_custom_params: { hello: 'foo' },
          google_conversion_language: 'en',
          google_conversion_format: '3',
          google_conversion_color: 'ffffff',
          google_conversion_label: options.eventMappings[1].value.label,
          google_conversion_value: 90,
          google_remarketing_only: false
        }]);
        analytics.deepEqual(window.google_trackConversion.args[1], [{
          google_conversion_id: options.conversionId,
          google_custom_params: { hello: 'foo' },
          google_remarketing_only: true
        }]);
      });
    });
  });
});
