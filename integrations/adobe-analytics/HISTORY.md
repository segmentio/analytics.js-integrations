1.16.3 / 2020-12-14
===================
* Bump segmentio-facade to ^3.2.7

1.16.2 / 2020-07-13
===================
* Reads session playhead values from `window._segHBPlayheads` if it exists. This solves an issue where the playhead is only updated when 'Video Content Playing' (+ various others) events are tracked. To get around this, we allow video implementations to set the playhead value as often as possible without the need to trigger an event.
* Removes trackComplete from Video Content Completed events and only calls chapterComplete on these events. It also adds trackComplete to Video Playback Completed events. This is in line with Adobe's documentation and also allows for parity between iOS, a.js, and Android.
* Stringifies context data values which are booleans. The AA SDK tends to reject false boolean values when setting them on the window object. This does not break existing behavior since booleans are stringified when they're sent in the query string.

1.16.1 / 2020-05-15
===================
* Supports sending top level `event` as `prop`, `eVar`, `lVar`, `hVar`, or Context Data Variable.

1.16.0 / 2020-05-05
===================
* Supports sending top level `messageId` and `anonymousId` as `prop`, `eVar`, `lVar`, `hVar`, or Context Data Variable.
* Updates the AppMeasurement, VisitorAPI, and MediaSDK (previously VideoHeartBeat) libraries to be the latest
versions:
  * AppMeasurement - 2.20.0
  * VisitorAPI.js - 4.4.0
  * MediaSDK - 2.2.1
* Adds support for merchandising variables and events
* Implement Video Playback Interrupted handler.
* Add support for Cart Opened events.

1.15.2 / 2020-02-12
===================

  * Support sending custom Context Data Variables on `Video Playback Started`, `Video Playback Resumed`, and `Video Content Started` when using Adobe Heartbeat Tracking URL (from context object)

1.15.1 / 2020-02-12
===================

  * Support sending custom Context Data Variables on `Video Playback Started`, `Video Playback Resumed`, and `Video Content Started` when using Adobe Heartbeat Tracking URL (from properties object)

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
