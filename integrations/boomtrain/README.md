Boomtrain is a predictive intelligence platform for marketers that leverages machine learning to drive increased clicks, engagement and revenue through customer communications. [Visit Website](http://boomtrain.com).

The Boomtrain integration with Segment.io supports the `identify`, `track` and `page` methods.  Our Javascript integration code is open sourced on Github. [Feel free to check it out](https://github.com/boomtrain/segmentio_integration).

## Getting Started
Steps to connect.
 - Turn on Boomtrain integration via Segment dashboard.
 - Enter your Boomtrain API Key.  

If you're not sure where to find your Boomtrain API Key, contact [Boomtrain Support](mailto:support@boomtrain.com) or your Boomtrain CSM directly.

When you turn on Boomtrain in Segment, this is what happens:
- The Boomtrain snippet will start asynchronously loading Boomtrain's Javascript library onto your page.
- Once loaded, the Boomtrain Javascript library will automatically start sending events to the Boomtrain system indicating that the current page has been viewed.
- When users visit pages on your site, the "viewed" events sent to the Boomtrain system will trigger ingestion of your content and processing by our machine learning algorithms.
- To start sending custom events and user data, use the Javascript methods described below.

## Identify
When you call [`identify`](https://segment.com/docs/spec/identify) on analytics.js, we call `person.set` on the Boomtrain Javascript Library with the `traits` object. A `userId` must be specified.  For additional details about the Boomtrain `person.set` methods see [this article](https://boomtrain.readme.io/docs/personset-attributes-callback) on the Boomtrain Developer Documentation.

## Track
When you call [`track`](https://segment.com/docs/spec/track), we will send the `event` you specify to the `track` method on the Boomtrain Javascript library, along with the properties you provide.  For additional details about the Boomtrain `track` method see [this article](https://boomtrain.readme.io/docs/track-an-activity-1) on the Boomtrain Developer Documentation.

## Settings
Segment lets you change these settings on the Integrations page, without having to touch any code.
### App ID
The App ID for your app can be taken from the integration guide provided by Boomtrain to your company.  For additional information about your App ID or integration details, contact your Boomtrain CSM or [support@boomtrain.com](mailto:support@boomtrain.com).


If you have any questions, or sueggestions on we can improve this documentation, feel free to [contact us](http://boomtrain.com/contact/).
