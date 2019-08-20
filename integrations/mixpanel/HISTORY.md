3.0.1 / 2018-07-18
==================
  * Supports mapping to settings.sourceName on `track` and `page` calls (#32)
  * Fix flaky tests (#31)

3.0.0 / 2017-10-19
==================

  * Parity rewrite (#29)
  * Bump a.js-int-tester version to ^3.1.0 (#28)
  * Pin karma, karma-mocha dev dependencies (#27)

2.2.0 / 2016-08-16
==================

  * update snippet

2.1.0 / 2016-08-12
==================

  * tag mp_lib with Segment: web

2.0.0 / 2016-06-21
==================

  * Remove Duo compatibility
  * Add CI setup (coverage, linting, cross-browser compatibility, etc.)
  * Update eslint configuration


1.5.0 / 2016-05-12
==================

  * Update Page Call Logic with consolidatedPageCalls setting

1.4.2 / 2016-05-07
==================

  * Bump Analytics.js core, tester, integration to use Facade 2.x

1.4.1 / 2016-02-03
==================

  * fix multiple page call issue

1.4.0 / 2015-12-09
==================

  * add persistence config

1.3.2 / 2015-11-03
==================

  * make mixpanel es5 friendly
  * Dont set peopleProperties in track calls.

1.3.1 / 2015-10-29
==================

  * Dont set peopleProperties in track calls. Dont map special traits in track, people should use identify instead.

1.3.0 / 2015-10-27
==================



1.3.0 / 2015-10-27
==================

  * refactor super people props

1.2.1 / 2015-09-08
==================

  * adding check for no Mixpanel.superProperties object closes #11

1.2.0 / 2015-09-08
==================

  * Allow explicit declaration of people/super properties ([More Info](https://github.com/segment-integrations/analytics.js-integration-mixpanel/pull/10))
  * stub every possible mixpanel method

1.1.0 / 2015-08-25
==================

  * Merge pull request #6 from segment-integrations/people-super-properties
  * added enhancedTrack support

1.0.5 / 2015-08-05
==================

  * Send arrays through to Mixpanel

1.0.4 / 2015-06-30
==================

  * Replace analytics.js dependency with analytics.js-core

1.0.3 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.2 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.1 / 2015-06-10
==================

  * Bump dependency versions

1.0.0 / 2015-06-09
==================

  * Initial commit :sparkles:
