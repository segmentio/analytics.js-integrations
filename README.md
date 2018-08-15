# Analytics.js Integrations
[![Circle CI](https://ci.segment.com/gh/segmentio/analytics.js-integrations.svg?style=svg&circle-token=9ea127ae84700c7717d40e7f3ab2cb75a927292d)](https://ci.segment.com/gh/segmentio/analytics.js-integrations)

## License

Released under the [MIT license](LICENSE).

## Configuration

### Yarn
Use always `yarn`, not `npm` to install your packges.

### Lint

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

### Tests
Karma + Mocha. Supported browsers:
- PhantomJS (local and CircleCI)
- Chrome latest (CircleCI only)
- Firefox latest (CircleCI only)
- Safari 9 (CircleCI only)
- IE 9 (CircleCI only)
- IE 10 (CircleCI only)
- IE 11 (CircleCI only)
- Edge latest (CircleCI only)

* Test one integration: `$ yarn test-integration <integration-name> <browser-type>`
* Test updated integrations (require Golang): `$ yarn test-updated-integrations <browser-type>`
* Test all integrarions: `$ yarn test-all-integrations <browser-type>`

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
