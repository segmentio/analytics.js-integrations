2.8.0 / 2018-04-04
==================

  * Update SDK version to 4.1.1

2.7.0 / 2018-02-12
==================

  * anonymousID-as-deviceID + group{Type, Value}Trait support (#38)

2.6.0 / 2017-09-18
==================

  * Update Amplitude to 3.7.0

2.5.0 / 2017-08-30
==================

  * Improve revenue tracking from Order Completed events.

2.4.0 / 2017-05-17
==================

  * Patch potential duplicate track event issue when using Groups functionality.

2.4.0 / 2017-05-17
==================

  * Add support for Amplitude's `group` functionality to both identify and track events

2.3.0 / 2017-04-11
==================

  * Allow mapping query params from context.page.search to a custom user/event property

2.2.0 / 2016-11-15
==================

  * Update Amplitude v3.4.0 with support for forceHttps, trackGclid, saveParamsReferrerOncePerSession, deviceIdFromUrlParam options.

2.1.1 / 2016-08-08
==================

  * Only send revenue event if revenue is being tracked

2.1.0 / 2016-07-21
==================

  * update amplitude v3.0.2 with support for logrevenueV2 option
  * Update Karma to 1.1.0

2.0.0 / 2016-06-21
==================

  * Remove Duo compatibility
  * Add CI setup (coverage, linting, cross-browser compatibility, etc.)
  * Update eslint configuration

1.0.16 / 2016-05-07
==================

  * Bump Analytics.js core, tester, integration to use Facade 2.x

1.0.15 / 2016-05-02
===================

  * correctly set options

1.0.14 / 2016-03-16
===================

  * Update Amplitude v2.9.1
  * Fix bug where saveReferrer throws exception if sessionStorage is disabled.
  * Log messages with a try/catch to support IE 8.
  * Validate event properties during logEvent and initialization before sending request.
  * Add instructions for proper integration with RequireJS.

1.0.13 / 2016-02-11
===================

  * Updating Amplitude SDK v2.9.0

1.0.12 / 2016-01-11
===================

  * Merge pull request #11 from amplitude/fix-runqueuedfunctions
  * Only runQueuedFunctions after SDK loads
1.0.11 / 2015-12-04
===================

  * updating Amplitude SDK v2.7.0

1.0.10 / 2015-11-07
===================

  * updating Amplitude SDK v2.6.1

1.0.9 / 2015-11-03
==================

  * updating amplitude SDK v2.6.0

1.0.8 / 2015-10-21
==================

  * updating Amplitude SDK to v2.5.0

1.0.7 / 2015-09-23
==================

  * Update Amplitude javascript sdk to v2.4.1

1.0.6 / 2015-09-23
==================

  * Update Amplitude javascript sdk to v2.3.0

1.0.5 / 2015-08-26
==================

  * Update Amplitude version to 2.2.1

1.0.4 / 2015-06-30
==================

  * Replace analytics.js dependency with analytics.js-core

1.0.3 / 2015-06-30
==================

  * Replace analytics.js dependency with analytics.js-core

1.0.2 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.1 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.0 / 2015-06-09
==================

  * Initial commit :sparkles:
