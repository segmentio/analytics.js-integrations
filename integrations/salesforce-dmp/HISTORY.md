
2.0.3 / 2018-10-10
==================

  * Add logic to prevent errors when an un-whitelisted `track` event is invoked 
    while the `sendEventNames` option is set to `true`.

2.0.2 / 2018-07-09
==================

  * Pushes `event_name: 'identify'` to the dataLayer for Segment identify
    events when "Send Event Names" UI setting is enabled.

2.0.1 / 2018-06-25
==================

  * Fix bug preventing us from deleting dataLayer b/w sessions.

2.0.0 / 2018-06-13
==================

  * Add v2 logic and tests and remove temp fix.

1.3.4 / 2018-01-18
==================

  * Instantiate window.kruxDataLayer manually if non-existent

1.3.0 / 2017-11-21
==================

  * Add functionality for Track calls to re-fire pixel.gif

1.2.0 / 2017-08-28
==================

  * Modify usermatch logic.

1.0.1 / 2017-07-18
==================

  * Patch bump for deploy

1.0.0 / 2017-07-16
==================

  * Initial commit :sparkles:
