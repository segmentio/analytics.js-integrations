##Aptrinsic Destination

Segment makes it easy to send your data to Aptrinsic (and lots of other destinations). Once you've tracked your data through our open source [libraries](https://segment.com/libraries) we'll translate and route your data to Aptrinsic in the format they understand. [Learn more about how to use Aptrinsic with Segment](https://segment.com/integrations/aptrinsic).

Aptrinsic extends your product to help you acquire, retain and grow customers by creating real-time, personalized experiences driven by product usage. [Visit Website](https://www.aptrinsic.com)

This destination is maintained by [Aptrinsic](https://www.aptrinsic.com). Our Aptrinsic destination code is open sourced on Github, feel free to check it out: [Javascript](https://github.com/segment-integrations/analytics.js-integration-aptrinsic)

##Getting Started

From your Segment Destinations page, click on Aptrinsic and enter your Aptrinsic API key. To find your API key, log into Aptrinsic and navigate to Settings > Products > Web App.  If you have not already entered the URL for your web application, do that and click the Generate button.  The apiKey is the value to the right of the "Generate" button.  By using this integration, you will not need to include the Aptrinsic tag on your page, it will be loaded automatically by Segment.

Aptrinsic supports the identify and group methods. Because Aptrinsic automatically pulls in all page and click events, no additional Segment calls will need to be made.

We will automatically initialize Aptrinsic with your API key upon loading Analytics.js.

##Identify
When you identify a user, we will pass that user’s information to Aptrinsic with userId as the Aptrinsic’s user identifier. User traits are mapped to visitor metadata in Aptrinsic.  Any matching custom attributes will also be mapped into Aptrinsic.

##Group
When you call group, we will send groupId as the account id to Aptrinsic. Group traits are mapped to account metadata in Aptrinsic.

##Supported Sources and Connection Modes
|                 | Web           | Mobile      | Server|
| -------------   | ------------- |-------------| ----- |
| 📱 Device-based |   ✅          |             |       |
| ☁ Cloud-based   |               |             |       |
			
To learn more about about Connection Modes and what dictates which we support, see [here](https://segment.com/docs/destinations/).

##Settings
Segment lets you change these destination settings via your Segment dashboard without having to touch any code.

##API Key
To find your API key, log into Aptrinsic and navigate to Settings > Products > Web App.  If you have not already entered the URL for your web application, do that and click the Generate button.  The apiKey is the string of characters and numbers to the right of the "Generate" button. 

