
4.0.0 / 2019-03-08
==================

  * [New](https://github.com/segment-integrations/analytics.js-integration-segmentio/pull/55): Stop Generating MessageId.

3.9.0 / 2019-01-14
==================

  * [New](https://github.com/segment-integrations/analytics.js-integration-segmentio/pull/54): Add flag and logic to delete cross domain identifiers.

3.8.1 / 2018-12-09
==================

  * [Fix](https://github.com/segment-integrations/analytics.js-integration-segmentio/pull/52): Don't send xid when cross domain analytics is disabled.

3.8.0 / 2018-10-05
==================

  * [Improvement](https://github.com/segment-integrations/analytics.js-integration-segmentio/pull/49): Enable retryQueue by default.

3.7.0 / 2018-28-08
==================

  * [Improvement](https://github.com/segment-integrations/analytics.js-integration-segmentio/pull/48): Handle 429 and 5xx HTTP errors

3.6.5 / 2018-17-08
==================

  * [Fix](https://github.com/segment-integrations/analytics.js-integration-segmentio/pull/47): Update localstorage-retry version with fix limiting the inProgress queue

3.6.4 / 2018-11-07
==================

  * [Fix](https://github.com/segment-integrations/analytics.js-integration-segmentio/pull/45): Update localstorage-retry version with fix for adding multiple items to the queue.

3.6.3 / 2018-28-06
==================

  * Warn when messages exceed limits.

3.6.2 / 2018-17-04
==================

  * Add timeout for requests that will be retried.

3.6.1 / 2018-15-04
==================

  * Retry messages only upto 10 times.

3.6.0 / 2017-11-01
==================

  * add lookup for failedInitializations and pass as _metadata

3.5.4 / 2017-08-24
==================

  * cap retryQueue to 100 items, tune backoff strategy

3.5.3 / 2017-08-02
==================

  * retryQueue falls back to inMemory if localStorage is full

3.5.2 / 2017-08-02
==================

  * Bump localstorage-retry version (again ;)

3.5.1 / 2017-08-02
==================

  * Bump localstorage-retry version (#32)

3.5.0 / 2017-07-31
==================

  * Enqueue All Requests to LocalStorage for Durability (#23)

3.4.2 / 2017-04-03
==================

  * Revert "use top-domain module instead of hand rolled function (#24)"
  * Revert "Address comments. (#25)"
  * Revert "Fix TLD implementation and add tests. (#28)"

3.4.1 / 2017-03-30
==================

  * Address general XID comments. (#25)
  * use top-domain module instead of hand rolled function (#24)
  * fix(normalize): Allow override context.campaign (#26)
  * Improve cookie behavior via using shorter cookie names (#22)

3.4.0 / 2017-01-25
==================

  * Add localStorage queueing for durability

3.3.0 / 2017-01-17
==================

  * Add cross domain id capability (#20)

3.2.2 / 2017-01-02
==================

  * Add beacon support (#19)

3.2.1 / 2016-11-03
==================

  * Always send requests over HTTPS

3.2.0 / 2016-09-01
==================

  * Add unbundled metadata (#17)
  * Add bundled integrations metadata to every request (#16)

3.1.1 / 2016-07-22
==================

  * Add `apiHost` as full integration option

3.1.0 / 2016-07-22
==================

  * Allow configuration of API endpoint (#14)

3.0.0 / 2016-07-18
==================

  * revert context-traits auto-sending (#13)

2.0.0 / 2016-06-21
==================

  * Remove Duo compatibility
  * Add CI setup (coverage, linting, cross-browser compatibility, etc.)
  * Update eslint configuration


1.0.7 / 2016-06-17
==================

  * add .context.amp and pull segment_amp_id


1.0.6 / 2016-05-24
==================

  * fix this forsaken dependency hell
  * add traits to context

1.0.5 / 2016-05-07
==================

  * Bump Analytics.js core, tester, integration to use Facade 2.x

1.0.4 / 2015-09-15
==================

  * Update send-json dependency

1.0.3 / 2015-09-14
==================

  * increasing `messageId` randomness

1.0.2 / 2015-06-30
==================

  * Replace analytics.js dependency with analytics.js-core

1.0.1 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.0 / 2015-06-09
==================

  * Initial commit :sparkles:
