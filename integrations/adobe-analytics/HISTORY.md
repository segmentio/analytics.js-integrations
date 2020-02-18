1.15.1 / 2020-02-12
===================

  * Support sending custom Context Data Variables on `Video Playback Started`, `Video Playback Resumed`, and `Video Content Started` when using Adobe Heartbeat Tracking URL

1.14.3 / 2018-06-25
===================

  * Dummy release (forgot to update package.json in 1.14.2

1.14.2 / 2018-06-25
===================

  * Format Product Array For All Events (#34)
1.14.1 / 2018-06-19
===================

  * Stop overriding s.pageURL (#33)

1.14.0 / 2018-04-03
===================

  * feat(page): add more specced variables (#32)

1.13.0 / 2018-04-02
===================

  * Revert "Revert "support mapping multiple custom events (#30)""

1.12.0 / 2018-03-30
===================

  * Revert "support mapping multiple custom events (#30)"
  * Revert "refactor: remove support for legacy events mapping (#31)"
  * refactor: remove support for legacy events mapping (#31)

1.11.0 / 2018-03-29
===================

  * support mapping multiple custom events (#30)

1.10.1 / 2018-03-27
===================

  * Add support for product view for multiple products (#29)
  * adding yarn lockfile
  * update circle links in README for circle enterprise (badges still need to be updated)
  * update circle config to circle enterprise

1.10.0 / 2017-12-21
==================

  * Add Heartbeat Beta Implementation

1.9.1 / 2017-12-06
==================

  * Set contextData for props put in window.s (#27)

1.9.0 / 2017-11-06
==================

  * Bring parity with server side by sending all properties as context data variables
  * Support prefixing properties before sending as CDV (brings parity with server side)

1.8.0 / 2017-09-27
==================

  * Update AppMeasurement and Visitor to 2.5.0

1.7.0 / 2017-06-12
==================

  * Add option to prefer setting visitorID for hybrid timestamp reporting suites

1.6.0 / 2017-04-27
==================

  * Add option "contextData" to allow users to map context values to contextData

1.5.0 / 2017-02-07
==================

  * Add option `disableVisitorId` that lets you skip on setting the visitorID

1.4.0 / 2017-01-18
==================

  * Add option `enableTrackPageName` that lets you choose to set pageName for `.track()` events

1.3.0 / 2016-12-06
==================

  * Support list variables

1.2.0 / 2016-09-22
==================

  * server side parity

1.1.0 / 2016-09-07
==================

  * support ecom spec v2

1.0.2 / 2016-08-30
==================

  * send product info to checkoutStarted event

1.0.1 / 2016-07-28
==================

  * deprecate legacy behavior, add more comments
  * remove unused options and add additional tests for new options
  * fix total

1.0.0 / 2016-07-26
==================

  * initial release
