2.0.0 / 2020-02-06
==================

  * Events are mapped to Nielsen DCR only when Segment `load_type` property is set to 'dynamic'.

1.5.0 / 2020-01-27
==================

  * Supports tracking videos in SPA apps.

1.4.0 / 2020-01-17
==================

  * Change approach to persisting `content_asset_id` to better keep track of session-level info.

1.3.5 / 2020-01-06
==================

  * Send unix timestamp in seconds (rather than milliseconds) when livestreams end.

1.3.4 / 2019-10-23
==================

  * Default content length to `0` if not explicitly defined.

1.3.3 / 2019-10-11
==================

  * Add support for `Video Playback Seek Started`, `Video Playback Buffer Started` and `Video Playback Buffer Completed` events.

1.0.1 / 2017-09-07
==================

  * Add call to `.ggPM('stop')` to pause as asked by Nielsen Reps

1.0.0 / 2017-09-06
==================

  * Initial Release

0.0.1 / 2017-06-27
==================

  * Initial scaffold :sparkles:
