# Analytics.js Integrations
[![Circle CI](https://ci.segment.com/gh/segmentio/analytics.js-integrations.svg?style=svg&circle-token=9ea127ae84700c7717d40e7f3ab2cb75a927292d)](https://ci.segment.com/gh/segmentio/analytics.js-integrations)

## License

Released under the [MIT license](LICENSE).

## Configuration

### Yarn
Use always `yarn`, not `npm` to install your packges.

### Lint
TBD (probably `standard` without configuration).

### Tests
Karma + Mocha. Supported browsers:
- PhantomJS
- Chrome latest
- Firefox latest
- Safari 9
- IE 9
- IE 10
- IE 11
- Edge latest

### Credentials
(Work in progress)
Do not hardcode secrets, account ids or other credentials in the
code. If a credential gets commited and upload, it has to be immediately
removed and revoked.

## Pull Requests and releases

Make sure your PR includes the new version in `package.json`. When the PR gets
merged, it will automatically be published.

**IMPORTANT:** Auto-release is not activated for new integrations. If you
want to publish your new, shiny integration, merge the pull request and publish
the first version manually.
