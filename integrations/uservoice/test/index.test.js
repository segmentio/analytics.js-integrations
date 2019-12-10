'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var jQuery = require('jquery');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var unix = require('to-unix-timestamp');
var when = require('do-when');
var UserVoice = require('../lib/');

describe('UserVoice', function() {
  var analytics;
  var uservoice;
  var options = {
    apiKey: 'EvAljSeJvWrrIidgVvI2g'
  };

  beforeEach(function() {
    analytics = new Analytics();
    analytics.use(UserVoice);
    analytics.use(tester);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    sandbox();
  });

  it('should store the right settings', function() {
    analytics.compare(UserVoice, integration('UserVoice')
      .assumesPageview()
      .global('UserVoice')
      .option('apiKey', '')
      .option('classic', false)
      .option('forumId', null)
      .option('showWidget', true)
      .option('mode', 'contact')
      .option('accentColor', '#448dd6')
      .option('smartvote', true)
      .option('trigger', null)
      .option('triggerPosition', 'bottom-right')
      .option('triggerColor', '#ffffff')
      .option('triggerBackgroundColor', 'rgba(46, 49, 51, 0.6)')
      // BACKWARDS COMPATIBILITY: classic options
      .option('classicMode', 'full')
      .option('primaryColor', '#cc6d00')
      .option('linkColor', '#007dbf')
      .option('defaultMode', 'support')
      .option('tabLabel', 'Feedback & Support')
      .option('tabColor', '#cc6d00')
      .option('tabPosition', 'middle-right')
      .option('tabInverted', false)
      .option('screenshotEnabled', true)
      .option('customTicketFields', {}));
  });

  describe('Non-Classic', function() {
    beforeEach(function() {
      uservoice = new UserVoice(options);
      analytics.add(uservoice);
    });

    afterEach(function() {
      uservoice.reset();
    });

    describe('before loading', function() {
      beforeEach(function() {
        analytics.stub(uservoice, 'load');
      });

      describe('#initialize', function() {
        var opts = {
          accent_color: '#448dd6',
          apiKey: 'EvAljSeJvWrrIidgVvI2g',
          classic: false,
          classicMode: 'full',
          defaultMode: 'support',
          forum_id: null,
          linkColor: '#007dbf',
          mode: 'contact',
          primaryColor: '#cc6d00',
          showWidget: true,
          smartvote_enabled: true,
          tabColor: '#cc6d00',
          tabInverted: false,
          tabLabel: 'Feedback & Support',
          tabPosition: 'middle-right',
          trigger: null,
          trigger_background_color: 'rgba(46, 49, 51, 0.6)',
          trigger_color: '#ffffff',
          trigger_position: 'bottom-right',
          screenshot_enabled: true,
          ticket_custom_fields: {}
        };

        it('should call #load', function() {
          analytics.initialize();
          analytics.page();
          analytics.called(uservoice.load);
        });

        it('should push the right options onto window.UserVoice', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window.UserVoice[0], ['set', opts]);
        });

        it('should push the autoprompt options', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window.UserVoice[1], ['autoprompt', {}]);
        });

        it('should push the addTrigger options', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window.UserVoice[2], ['addTrigger', opts]);
        });
      });
    });

    describe('loading', function() {
      it('should load', function(done) {
        analytics.load(uservoice, done);
      });
    });

    describe('after loading', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
        analytics.page();
      });

      after(function() {
        uservoice.reset();
      });

      it('should show the trigger', function(done) {
        when(function() {
          return jQuery('.uv-icon').length;
        }, done);
      });

      describe('#identify', function() {
        beforeEach(function() {
          analytics.stub(window.UserVoice, 'push');
        });

        it('should send an id', function() {
          analytics.identify('id');
          analytics.called(window.UserVoice.push, [
            'identify',
            { id: 'id' }
          ]);
        });

        it('should send traits', function() {
          analytics.identify({ trait: true });
          analytics.called(window.UserVoice.push, [
            'identify',
            { trait: true }
          ]);
        });

        it('should send an id and traits', function() {
          analytics.identify('id', { trait: true });
          analytics.called(window.UserVoice.push, [
            'identify',
            { id: 'id', trait: true }
          ]);
        });

        it('should convert a created date', function() {
          var date = new Date();
          analytics.identify({ created: date });
          analytics.called(window.UserVoice.push, [
            'identify',
            { created_at: unix(date) }
          ]);
        });
      });

      describe('#group', function() {
        beforeEach(function() {
          analytics.stub(window.UserVoice, 'push');
        });

        it('should send an id', function() {
          analytics.group('id');
          analytics.called(window.UserVoice.push, [
            'identify',
            { account: { id: 'id' } }
          ]);
        });

        it('should send properties', function() {
          analytics.group({ property: true });
          analytics.called(window.UserVoice.push, [
            'identify',
            { account: { property: true } }
          ]);
        });

        it('should send an id and properties', function() {
          analytics.group('id', { property: true });
          analytics.called(window.UserVoice.push, [
            'identify',
            { account: { id: 'id', property: true } }
          ]);
        });

        it('should convert a created date', function() {
          var date = new Date();
          analytics.group({ created: date });
          analytics.called(window.UserVoice.push, [
            'identify',
            { account: { created_at: unix(date) } }
          ]);
        });
      });
    });
  });

  describe('Classic', function() {
    beforeEach(function() {
      options = {
        classic: true,
        classicMode: 'full',
        apiKey: 'mhz5Op4MUft592O8Q82MwA',
        forumId: 221539,
        tabLabel: 'test',
        defaultMode: 'feedback',
        primaryColor: '#ffffff'
      };
      uservoice = new UserVoice(options);
      analytics.add(uservoice);
    });

    afterEach(function() {
      uservoice.reset();
    });

    describe('before loading', function() {
      beforeEach(function() {
        analytics.stub(uservoice, 'load');
      });

      describe('#initialize', function() {
        it('should push the options onto window.UserVoice.push', function() {
          analytics.initialize();
          analytics.page();
          analytics.deepEqual(window.UserVoice[0], [
            'showTab',
            'classic_widget',
            {
              accentColor: '#448dd6',
              apiKey: 'mhz5Op4MUft592O8Q82MwA',
              classic: true,
              default_mode: 'feedback',
              forum_id: 221539,
              link_color: '#007dbf',
              mode: 'full',
              primary_color: '#ffffff',
              showWidget: true,
              smartvote: true,
              tab_color: '#cc6d00',
              tab_inverted: false,
              tab_label: 'test',
              tab_position: 'middle-right',
              trigger: null,
              triggerBackgroundColor: 'rgba(46, 49, 51, 0.6)',
              triggerColor: '#ffffff',
              triggerPosition: 'bottom-right',
              screenshotEnabled: true,
              customTicketFields: {}
            }
          ]);
        });

        it('should create the window.showClassicWidget function', function() {
          analytics.assert(!window.showClassicWidget);
          analytics.initialize();
          analytics.page();
          analytics.assert(window.showClassicWidget);
        });

        it('should call #load', function() {
          analytics.initialize();
          analytics.page();
          analytics.called(uservoice.load);
        });

        it('should not have a group method if set to classic', function() {
          analytics.initialize();
          analytics.page();
          analytics.assert(uservoice.group === undefined);
        });
      });
    });

    describe('loading', function() {
      it('should load', function(done) {
        analytics.load(uservoice, done);
      });
    });

    describe('after loading', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
        analytics.page();
      });

      it('should show the tab', function(done) {
        when(function() {
          return document.getElementById('uvTab');
        }, done);
      });

      describe('#identify', function() {
        beforeEach(function() {
          analytics.stub(window.UserVoice, 'push');
        });

        it('should send an id', function() {
          analytics.identify('id');
          analytics.called(window.UserVoice.push, [
            'setCustomFields',
            { id: 'id' }
          ]);
        });

        it('should send traits', function() {
          analytics.identify({ trait: true });
          analytics.called(window.UserVoice.push, [
            'setCustomFields',
            { trait: true }
          ]);
        });

        it('should send an id and traits', function() {
          analytics.identify('id', { trait: true });
          analytics.called(window.UserVoice.push, [
            'setCustomFields',
            { id: 'id', trait: true }
          ]);
        });
      });
    });
  });
});
