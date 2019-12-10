'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var once = require('once-component');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Olark = require('../lib/');

describe('Olark', function() {
  var analytics;
  var olark;
  var options = {
    siteId: '2548-952-10-3071',
    listen: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    olark = new Olark(options);
    analytics.use(Olark);
    analytics.use(tester);
    analytics.add(olark);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    sandbox();
  });

  after(function() {
    olark.reset();
  });

  it('should have the right settings', function() {
    analytics.compare(Olark, integration('Olark')
      .assumesPageview()
      .global('olark')
      .option('groupId', '')
      .option('identify', true)
      .option('listen', false)
      .option('page', true)
      .option('siteId', '')
      .option('track', false)
      .option('inline', false));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(window, 'olark');
      analytics.stub(olark, 'load');
    });

    afterEach(function() {
      olark.reset();
    });

    it('should pass in group id to `configure`', function() {
      olark.options.groupId = '-groupId-';
      analytics.initialize();
      analytics.page();
      analytics.called(window.olark, 'api.chat.setOperatorGroup', { group: '-groupId-' });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(olark, done);
    });
  });

  describe('loading inline', function() {
    beforeEach(function() {
      analytics.spy(window.olark, 'configure');
    });

    it('should pass in inline chat to `configure` if set', function() {
      olark.options.inline = true;
      analytics.initialize();
      analytics.page();
      analytics.called(window.olark.configure, 'box.inline', true);
    });

    it('should not pass in inline chat to `configure` if not set', function() {
      olark.options.inline = false;
      analytics.initialize();
      analytics.page();
      analytics.didNotCall(window.olark.configure, 'box.inline');
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should create the window.olark variable', function() {
      analytics.assert(window.olark);
    });

    it('should set up expand/shrink listeners', function(done) {
      expandThen(function() {
        analytics.assert(olark._open);
        shrinkThen(function() {
          analytics.assert(!olark._open);
          done();
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window, 'olark');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.olark, 'api.visitor.updateCustomFields', {
          id: 'id'
        });
      });

      it('should send traits', function() {
        analytics.identify(undefined, { trait: true });
        analytics.called(window.olark, 'api.visitor.updateCustomFields', {
          trait: true
        });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.olark, 'api.visitor.updateCustomFields', {
          trait: true,
          id: 'id'
        });
      });

      it('should send an email', function() {
        analytics.identify(undefined, { email: 'name@example.com' });
        analytics.called(window.olark, 'api.visitor.updateEmailAddress', {
          emailAddress: 'name@example.com'
        });
      });

      it('shouldnt send an empty email', function() {
        analytics.identify('id');
        analytics.didNotCall(window.olark, 'api.visitor.updateEmailAddress');
      });

      it('should send a name', function() {
        analytics.identify(undefined, { name: 'first last' });
        analytics.called(window.olark, 'api.visitor.updateFullName', {
          fullName: 'first last'
        });
      });

      it('shouldnt send an empty name', function() {
        analytics.identify('id');
        analytics.didNotCall(window.olark, 'api.visitor.updateFullName');
      });

      it('should fallback to sending first and last name', function() {
        analytics.identify(undefined, {
          firstName: 'first',
          lastName: 'last'
        });
        analytics.called(window.olark, 'api.visitor.updateFullName', {
          fullName: 'first last'
        });
      });

      it('should fallback to sending only a first name', function() {
        analytics.identify(undefined, { firstName: 'first' });
        analytics.called(window.olark, 'api.visitor.updateFullName', {
          fullName: 'first'
        });
      });

      it('should send a phone number', function() {
        analytics.identify(undefined, { phone: 'phone' });
        analytics.called(window.olark, 'api.visitor.updatePhoneNumber', {
          phoneNumber: 'phone'
        });
      });

      it('shouldnt send an empty phone number', function() {
        analytics.identify('id');
        analytics.didNotCall(window.olark, 'api.visitor.updatePhoneNumber');
      });

      it('should us an id as a nickname', function() {
        analytics.identify('id');
        analytics.called(window.olark, 'api.chat.updateVisitorNickname', {
          snippet: 'id'
        });
      });

      it('should prefer a username as a nickname', function() {
        analytics.identify('id', { username: 'username' });
        analytics.called(window.olark, 'api.chat.updateVisitorNickname', {
          snippet: 'username'
        });
      });

      it('should prefer an email as a nickname', function() {
        analytics.identify('id', {
          username: 'username',
          email: 'name@example.com'
        });
        analytics.called(window.olark, 'api.chat.updateVisitorNickname', {
          snippet: 'name@example.com'
        });
      });

      it('should prefer a name as a nickname', function() {
        analytics.identify('id', {
          username: 'username',
          name: 'name'
        });
        analytics.called(window.olark, 'api.chat.updateVisitorNickname', {
          snippet: 'name'
        });
      });

      it('should prefer a name and email as a nickname', function() {
        analytics.identify('id', {
          username: 'username',
          name: 'name',
          email: 'name@example.com'
        });
        analytics.called(window.olark, 'api.chat.updateVisitorNickname', {
          snippet: 'name (name@example.com)'
        });
      });
    });

    describe('not open', function() {
      beforeEach(function() {
        analytics.spy(window, 'olark');
      });

      describe('#page', function() {
        it('should not send an event when the chat isnt open', function() {
          olark.options.page = true;
          analytics.page();
          analytics.didNotCall(window.olark);
        });
      });

      describe('#track', function() {
        it('should not send an event by default', function() {
          analytics.track('event');
          analytics.didNotCall(window.olark);
        });

        it('should not send an event when the chat isnt open', function() {
          olark.options.track = true;
          analytics.track('event');
          analytics.didNotCall(window.olark);
        });
      });
    });

    describe('open and not conversing', function() {
      beforeEach(function(done) {
        expandThen(function() {
          analytics.spy(window, 'olark');
          done();
        });
      });

      afterEach(function(done) {
        analytics.restore();
        shrinkThen(function() {
          done();
        });
      });

      describe('#page', function() {
        it('should not send a notification', function() {
          analytics.page();
          analytics.didNotCall(window.olark, 'api.chat.sendNotificationToOperator');
        });

        it('should not send a notification when the chat isnt open', function() {
          olark.options.page = true;
          analytics.page();
          analytics.didNotCall(window.olark, 'api.chat.sendNotificationToOperator');
        });
      });

      describe('#track', function() {
        it('should not send a notification by default', function() {
          analytics.track('event');
          analytics.didNotCall(window.olark, 'api.chat.sendNotificationToOperator');
        });

        it('should not send a notification when the chat isnt open', function() {
          olark.options.track = true;
          analytics.track('event');
          analytics.didNotCall(window.olark, 'api.chat.sendNotificationToOperator');
        });
      });
    });

    describe('#listen', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
        analytics.stub(analytics, 'track');
      });

      afterEach(function(done) {
        analytics.restore();
        shrinkThen(function() {
          done();
        });
      });

      it('should send a chat started event', function(done) {
        window.olark('api.chat.sendMessageToVisitor', { body: 'hello' });
        setTimeout(function() {
          analytics.called(analytics.track, 'Live Chat Conversation Started', {}, { context: { integration: { name: 'olark', version: '1.0.0' } }, integrations: { Olark: false } });
          done();
        }, 3000);
      });

      /**
       * FIXME: Olark has no way to send a test message to the operator :(
       * Notifications don't trigger the event handler.....
       *
      it('should send a chat sent event', function(done) {
        window.olark('api.chat.sendMessageToVisitor', { body: 'hi, PLEASE RESPOND' });
        setTimeout(function() {
          analytics.called(analytics.track, 'Live Chat Message Sent', { messageBody: 'hi' }, { context: { integration: { name: 'olark', version: '1.0.0' }}, integrations: { Olark: false }});
          done();
        }, 5000);
      });**/

      it('should send a chat received event', function(done) {
        window.olark('api.chat.sendMessageToVisitor', { body: 'oh hai' });
        setTimeout(function() {
          analytics.called(analytics.track, 'Live Chat Message Received', {}, { context: { integration: { name: 'olark', version: '1.0.0' } }, integrations: { Olark: false } });
          done();
        }, 3000);
      });
    });

    describe('open and conversing', function() {
      beforeEach(function(done) {
        // force the chat to start, so the user is considered "conversing"
        window.olark('api.chat.sendMessageToVisitor', { body: 'conversing' });
        expandThen(function() {
          analytics.spy(window, 'olark');
          done();
        });
      });

      afterEach(function(done) {
        analytics.restore();
        shrinkThen(function() {
          done();
        });
      });

      describe('#page', function() {
        it('should send a page name', function() {
          analytics.page('Name');
          analytics.called(window.olark, 'api.chat.sendNotificationToOperator', {
            body: 'looking at name page'
          });
        });

        it('should send a page category and name', function() {
          analytics.page('Category', 'Name');
          analytics.called(window.olark, 'api.chat.sendNotificationToOperator', {
            body: 'looking at category name page'
          });
        });

        it('should send a page url', function() {
          analytics.page({ url: 'url' });
          analytics.called(window.olark, 'api.chat.sendNotificationToOperator', {
            body: 'looking at url'
          });
        });

        it('should not send an event when page is disabled', function() {
          olark.options.page = false;
          analytics.page();
          analytics.didNotCall(window.olark);
        });
      });

      describe('#track', function() {
        it('should send an event', function() {
          olark.options.track = true;
          analytics.track('event');
          analytics.called(window.olark, 'api.chat.sendNotificationToOperator', {
            body: 'visitor triggered "event"'
          });
        });
      });
    });
  });
});

/**
 * TODO: Document me
 *
 * @param {Function} fn
 */

function expandThen(fn) {
  if (document.querySelector('.olrk-state-expanded')) return fn();
  window.olark('api.box.onExpand', once(fn));
  window.olark('api.box.expand');
}

/**
 * TODO: Document me
 *
 * @param {Function} fn
 */

function shrinkThen(fn) {
  if (document.querySelector('.olrk-state-compressed')) return fn();
  window.olark('api.box.onShrink', once(fn));
  window.olark('api.box.shrink');
}
