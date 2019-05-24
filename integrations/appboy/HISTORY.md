1.7.1 / 2018-08-02
==================

* Revert changes introduced in 1.7.0 (#26)(#27).

1.7.0 / 2018-07-31
==================

This release includes two changes:

1. Have Initialization hook into Braze callbacks (#26)

  The `v2` initialization of this integration operates with a synchronous mindset inherited from `v1` of the integration. In fact, the Braze `v2` SDK has callbacks which indicate, among other things, when in-app messaging is available. It is important that this integration not invoke `ready()` until these in-app messages are ready. Otherwise, a race condition results, and users invoking `analytics.page()` are not guaranteed to see the appropriate in-app messages.

2.  Remove changeUser from track, page, group and completedOrder (#27).

  Currently, the Braze `Analytics.js` integration does not properly retrieve the` userId` on `track`, `group`, `page`, and `completedOrder` events. After speaking with the Braze team, they mentioned that we should only be calling `changeUser` on `identify`.

1.6.0 / 2018-07-06
==================

  * Update SDK URLs (#21)

1.5.0 / 2018-07-27
==================

  * Update datacenter mappings to support new Appboy clusters

1.5.0 / 2018-04-11
==================

  * Add support for v2 of Braze SDK

1.4.1 / 2017-08-09
==================

  * Update custom endpoint validation

1.4.0 / 2017-07-19
==================

  * Add ability to add a custom API endpoint

1.3.0 / 2017-07-05
==================

  * Switch the endpoint when datacenter is set to 'eu'

1.2.1 / 2017-06-26
==================

  * Remove reserved keys from custom event properties and user attributes

1.2.0 / 2017-05-15
==================

  * Add enableHtmlInAppMessages option
  * Add support for page calls

1.1.0 / 2017-04-27
==================

  * Add analytics hanlding for client side

1.0.0 / 2017-03-01
==================

  * Initial release

0.0.1 / 2017-02-21
==================

  * Initial scaffold :sparkles:
