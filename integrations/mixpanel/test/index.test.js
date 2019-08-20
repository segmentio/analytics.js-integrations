'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var iso = require('@segment/to-iso-string');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Mixpanel = require('../lib/');

describe('Mixpanel', function() {
  var analytics;
  var mixpanel;
  var options = {
    token: 'x',
    cookieName: 'y',
    crossSubdomainCookie: true,
    secureCookie: true,
    consolidatedPageCalls: false,
    trackCategorizedPages: true,
    trackNamedPages: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    mixpanel = new Mixpanel(options);
    analytics.use(Mixpanel);
    analytics.use(tester);
    analytics.add(mixpanel);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    mixpanel.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Mixpanel, integration('Mixpanel')
      .global('mixpanel')
      .option('token', '')
      .option('crossSubdomainCookie', false)
      .option('secureCookie', false)
      .option('nameTag', true)
      .option('pageview', false)
      .option('people', false)
      .option('token', '')
      .option('trackAllPages', false)
      .option('persistence', 'cookie')
      .option('trackNamedPages', false)
      .option('consolidatedPageCalls', true)
      .option('setAllTraitsByDefault', true)
      .option('trackCategorizedPages', false)
      .option('sourceName', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(mixpanel, 'load');
    });

    describe('#initialize', function() {
      it('should create window.mixpanel', function() {
        analytics.assert(!window.mixpanel);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.mixpanel);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(mixpanel.load);
      });

      it('should lowercase event increments', function() {
        mixpanel.options.eventIncrements = ['A', 'b', 'c_'];
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(mixpanel.options.eventIncrements, ['a', 'b', 'c_']);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(mixpanel, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('config', function() {
      it('should tag mp_lib as Segment: web', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(window.mixpanel.config.loaded.toString().slice(98, -2), 'mixpanel.register({"mp_lib":"Segment: web"})');
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.mixpanel, 'track');
        analytics.stub(window.mixpanel.people, 'set');
      });

      it('should not track anonymous pages by default', function() {
        analytics.page();
        analytics.didNotCall(window.mixpanel.track);
      });

      it('should track anonymous pages when the option is on', function() {
        mixpanel.options.trackAllPages = true;
        analytics.page();
        analytics.called(window.mixpanel.track, 'Loaded a Page');
      });

      it('should track named pages by default', function() {
        analytics.page('Name');
        analytics.called(window.mixpanel.track, 'Viewed Name Page');
      });

      it('should track named pages with categories', function() {
        analytics.page('Category', 'Name');
        analytics.called(window.mixpanel.track, 'Viewed Category Name Page');
      });

      it('should track categorized pages by default', function() {
        analytics.page('Category', 'Name');
        // This test was incorrectly testing this before, as it was passing based on the multiple call sending bug. The correct new call would be the following as noted in our docs:
        analytics.called(window.mixpanel.track, 'Viewed Category Name Page');
        analytics.didNotCall(window.mixpanel.track, 'Viewed Category Page');
        analytics.didNotCall(window.mixpanel.track, 'Viewed Name Page');
      });

      it('should not track category pages when the option is off', function() {
        mixpanel.options.trackNamedPages = false;
        mixpanel.options.trackCategorizedPages = false;
        analytics.page('Name');
        analytics.page('Category', 'Name');
        analytics.didNotCall(window.mixpanel.track);
      });

      // Exercise a bug where we set people properties in track calls. https://segment.phacility.com/T903
      it('will not track page props as a people property', function() {
        mixpanel.options.people = true;
        analytics.page('Name');
        analytics.called(window.mixpanel.track, 'Viewed Name Page');
        analytics.didNotCall(window.mixpanel.people.set, { $name: 'Name' });
      });

      it('should not send multiple page calls', function() {
        mixpanel.options.trackAllPages = true;
        mixpanel.options.trackNamedPages = true;
        analytics.page('Teemo');
        analytics.called(window.mixpanel.track, 'Loaded a Page');
        analytics.didNotCall(window.mixpanel.track, 'Viewed Teemo Page');
      });

      // consolidatedPageCalls = true
      it('should not send multiple page calls', function() {
        mixpanel.options.consolidatedPageCalls = true;
        analytics.page('Teemo');
        analytics.called(window.mixpanel.track, 'Loaded a Page', {
          name: 'Teemo',
          path: '/context.html',
          referrer: document.referrer,
          search: '',
          title: document.title,
          url: window.location.href
        });
        analytics.didNotCall(window.mixpanel.track, 'Viewed Teemo Page');
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.mixpanel, 'identify');
        analytics.stub(window.mixpanel, 'register');
        analytics.stub(window.mixpanel, 'name_tag');
        analytics.stub(window.mixpanel.people, 'set');
        analytics.stub(window.mixpanel.people, 'union');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.mixpanel.identify, 'id');
        analytics.called(window.mixpanel.register, { id: 'id' });
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.mixpanel.register, { trait: true });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.mixpanel.identify, 'id');
        analytics.called(window.mixpanel.register, { trait: true, id: 'id' });
      });

      it('should use an id as a name tag', function() {
        analytics.identify('id');
        analytics.called(window.mixpanel.name_tag, 'id');
      });

      it('should prefer a username as a name tag', function() {
        analytics.identify('id', { username: 'username' });
        analytics.called(window.mixpanel.name_tag, 'username');
      });

      it('should prefer an email as a name tag', function() {
        analytics.identify('id', {
          username: 'username',
          email: 'name@example.com'
        });
        analytics.called(window.mixpanel.name_tag, 'name@example.com');
      });

      it('should send traits to Mixpanel People', function() {
        mixpanel.options.people = true;
        analytics.identify({ trait: true });
        analytics.called(window.mixpanel.people.set, { trait: true });
      });

      it('should set super properties from the mixpanel.options.superProperties object if setAllTraitsByDefault is false', function() {
        mixpanel.options.setAllTraitsByDefault = false;
        mixpanel.options.superProperties = ['accountStatus', 'subscribed', 'email'];
        analytics.identify(123, { accountStatus: 'Paid', subscribed: true, email: 'androidjones@sky.net' });
        analytics.called(window.mixpanel.identify, 123);
        analytics.called(window.mixpanel.register, { accountStatus: 'Paid', subscribed: true, $email: 'androidjones@sky.net' });
      });

      it('should set people properties from the mixpanel.options.peopleProperties object if setAllTraitsByDefault is false', function() {
        mixpanel.options.people = true;
        mixpanel.options.setAllTraitsByDefault = false;
        mixpanel.options.peopleProperties = ['friend'];
        analytics.identify(123, { friend: 'elmo' });
        analytics.called(window.mixpanel.identify, 123);
        analytics.called(window.mixpanel.people.set, { friend: 'elmo' });
      });

      it('should set people properties from the Mixpanel\'s special traits if setAllTraitsByDefault is false and the property isn\'t on the call', function() {
        mixpanel.options.people = true;
        mixpanel.options.setAllTraitsByDefault = false;
        mixpanel.options.peopleProperties = ['friend'];
        analytics.identify(123, { friend: 'elmo', email: 'dog@dog.com' });
        analytics.called(window.mixpanel.identify, 123);
        analytics.called(window.mixpanel.people.set, { friend: 'elmo', $email: 'dog@dog.com' });
      });


      it('shouldn\'t set super properties that aren\'t included in the mixpanel.options.superProperties object when setAllTraitsByDefault is false', function() {
        mixpanel.options.setAllTraitsByDefault = false;
        mixpanel.options.superProperties = ['accountStatus'];
        analytics.identify(123, { accountStatus: 'Paid', subscribed: true });
        analytics.called(window.mixpanel.identify, 123);
        analytics.called(window.mixpanel.register, { accountStatus: 'Paid' });
        analytics.didNotCall(window.mixpanel.register, { subscribed: true });
      });

      it('shouldn\'t set people properties from the mixpanel.options.peopleProperties object if setAllTraitsByDefault is false', function() {
        mixpanel.options.people = false;
        mixpanel.options.setAllTraitsByDefault = false;
        analytics.identify(123, { friend: 'elmo' });
        analytics.called(window.mixpanel.identify, 123);
        analytics.didNotCall(window.mixpanel.register);
        analytics.didNotCall(window.mixpanel.people.set);
      });

      it('should alias traits', function() {
        var date = new Date();
        analytics.identify({
          created: date,
          email: 'name@example.com',
          firstName: 'first',
          lastName: 'last',
          lastSeen: date,
          name: 'name',
          username: 'username',
          phone: 'phone'
        });
        analytics.called(window.mixpanel.register, {
          $created: iso(date),
          $email: 'name@example.com',
          $first_name: 'first',
          $last_name: 'last',
          $last_seen: iso(date),
          $name: 'name',
          $username: 'username',
          $phone: 'phone'
        });
      });

      it('should alias traits to Mixpanel People', function() {
        mixpanel.options.people = true;
        var date = new Date();
        analytics.identify({
          created: date,
          email: 'name@example.com',
          firstName: 'first',
          lastName: 'last',
          lastSeen: date,
          name: 'name',
          username: 'username',
          phone: 'phone'
        });
        analytics.called(window.mixpanel.people.set, {
          $created: iso(date),
          $email: 'name@example.com',
          $first_name: 'first',
          $last_name: 'last',
          $last_seen: iso(date),
          $name: 'name',
          $username: 'username',
          $phone: 'phone'
        });
      });

      it('should remove .created_at', function() {
        mixpanel.options.people = true;
        var date = new Date();
        analytics.identify({
          created_at: date,
          email: 'name@example.com',
          firstName: 'first',
          lastName: 'last',
          lastSeen: date,
          name: 'name',
          username: 'username',
          phone: 'phone'
        });
        analytics.called(window.mixpanel.people.set, {
          $created: iso(date),
          $email: 'name@example.com',
          $first_name: 'first',
          $last_name: 'last',
          $last_seen: iso(date),
          $name: 'name',
          $username: 'username',
          $phone: 'phone'
        });
      });

      it('should union arrays', function() {
        mixpanel.options.people = true;
        analytics.identify({
          pages_visited: ['homepage']
        });
        analytics.called(window.mixpanel.people.union, {
          pages_visited: ['homepage']
        });
      });

      it('should union arrays when setAllTraitsByDefault is false', function() {
        mixpanel.options.setAllTraitsByDefault = false;
        mixpanel.options.people = true;
        mixpanel.options.peopleProperties = ['pages_visited'];  // eslint-disable-line
        analytics.identify({
          pages_visited: ['homepage']
        });
        analytics.called(window.mixpanel.people.union, {
          pages_visited: ['homepage']
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.mixpanel, 'track');
        analytics.stub(window.mixpanel, 'register');
        analytics.stub(window.mixpanel.people, 'increment');
        analytics.stub(window.mixpanel.people, 'set');
        analytics.stub(window.mixpanel.people, 'track_charge');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.mixpanel.track, 'event');
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.mixpanel.track, 'event', { property: true });
      });

      it('should send a revenue property to Mixpanel People', function() {
        mixpanel.options.people = true;
        analytics.track('event', { revenue: 9.99 });
        analytics.called(window.mixpanel.people.track_charge, 9.99);
      });

      it('should set super properties from the mixpanel.options.superProperties object', function() {
        mixpanel.options.superProperties = ['accountStatus', 'subscribed', 'email'];
        analytics.track('event', { accountStatus: 'Paid', subscribed: true, email: 'androidjones@sky.net' });
        analytics.called(window.mixpanel.register, { accountStatus: 'Paid', subscribed: true, email: 'androidjones@sky.net' });
      });

      // Exercise a bug where we set people properties in track calls. https://segment.phacility.com/T903
      it('should not set people properties from the mixpanl.options.peopleProperties object', function() {
        mixpanel.options.people = true;
        mixpanel.options.peopleProperties = ['friend'];
        analytics.track('event', { friend: 'elmo' });
        analytics.didNotCall(window.mixpanel.people.set);
      });

      // Exercise a bug where we set people properties in track calls. https://segment.phacility.com/T903
      it('should not set people properties from the Mixpanel\'s special traits', function() {
        mixpanel.options.people = true;
        mixpanel.options.peopleProperties = ['friend'];
        analytics.track('event', { friend: 'elmo', email: 'dog@dog.com' });
        analytics.didNotCall(window.mixpanel.people.set);
      });

      // Exercise a bug where we set people properties in track calls. https://segment.phacility.com/T903
      it('shouldn\'t try to register super properties if not specified', function() {
        mixpanel.options.superProperties = [];
        analytics.track('event', { friend: 'elmo' });
        analytics.didNotCall(window.mixpanel.register);
      });

      it('should convert dates to iso strings', function() {
        var date = new Date();
        analytics.track('event', { date: date });
        analytics.called(window.mixpanel.track, 'event', { date: iso(date) });
      });

      it('should convert dates inside lists to iso strings', function() {
        var date = new Date();
        var date2 = new Date();
        analytics.track('event', { dates: [date, date2] });
        analytics.called(window.mixpanel.track, 'event', { dates: [iso(date), iso(date2)] });
      });

      it('should increment events that are in .increments option', function() {
        mixpanel.options.eventIncrements = [0, 'my event', 1];
        mixpanel.options.people = true;
        analytics.track('my event');
        analytics.called(window.mixpanel.people.increment, 'my event');
      });

      it('should should update people property if the event is in .increments', function() {
        mixpanel.options.eventIncrements = ['event'];
        mixpanel.options.people = true;
        analytics.track('event');
        var date = window.mixpanel.people.set.args[0][1];
        analytics.assert(new Date().getTime() - date.getTime() < 1000);
        analytics.called(window.mixpanel.people.increment, 'event');
        analytics.called(window.mixpanel.people.set, 'Last event', date);
      });

      it('should not convert arrays of simple types', function() {
        analytics.track('event', { array: ['a', 'b', 'c'] });
        analytics.called(window.mixpanel.track, 'event', { array: ['a', 'b', 'c'] });
        analytics.track('event', { array: [13, 28, 99] });
        analytics.called(window.mixpanel.track, 'event', { array: [13, 28, 99] });
      });

      it('should remove mixpanel\'s reserved properties', function() {
        analytics.track('event', {
          distinct_id: 'string',
          ip: 'string',
          mp_name_tag: 'string',
          mp_note: 'string',
          token: 'string'
        });
        analytics.called(window.mixpanel.track, 'event', {});
      });

      it('should invert object list properties', function() {
        analytics.track('event', {
          products: [
            { price: 32, sku: 25 },
            { price: 33, sku: 29 }
          ]
        });
        analytics.called(window.mixpanel.track, 'event', {
          products_skus: [25, 29],
          products_prices: [32, 33]
        });
      });

      it('should increment properties when specified', function() {
        mixpanel.options.propIncrements = ['videos_watched'];
        mixpanel.options.people = true;
        analytics.track('event', {
          videos_watched: 3
        });
        analytics.called(window.mixpanel.people.increment, 'videos_watched', 3);
      });

      it('should send sourceName if specified', function() {
        mixpanel.options.sourceName = 'ios_prod';
        analytics.track('event', {
          segment_source_name: 'ios_prod'
        });
        analytics.called(window.mixpanel.track, 'event', {
          segment_source_name: 'ios_prod'
        });
      });
    });

    describe('#alias', function() {
      beforeEach(function() {
        analytics.stub(window.mixpanel, 'alias');
      });

      it('should send a new id', function() {
        analytics.alias('new');
        analytics.called(window.mixpanel.alias, 'new');
      });

      it('should send a new and old id', function() {
        analytics.alias('new', 'old');
        analytics.called(window.mixpanel.alias, 'new', 'old');
      });
    });
  });
});
