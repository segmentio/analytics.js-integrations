# Analytics.js Integrations

[![CircleCI](https://ci.segment.com/gh/segmentio/analytics.js-integrations.svg?style=svg&circle-token=3902c34188b9a248fb3cf745442f626e8bbc89a5)](https://ci.segment.com/gh/segmentio/analytics.js-integrations)

## Introduction
This repo stores the majority of the `analytics.js` integrations that Segment currently supports. It is organized as a monorepo with each individual integration packaged and deployed as their own npm modules.

## Getting Started
To start contributing, please ensure you have the following installed on your local machine:

- [yarn](https://yarnpkg.com/en/)
- [node](https://nodejs.org/en/)

Once these pre-requisites are met, feel free to clone the repo locally and install the required dependencies:

```bash
git clone https://github.com/segmentio/analytics.js-integrations && cd analytics.js-integrations
yarn
```

## Contributing
All indiviudal integrations are stored in the `integrations/` directory. We recommend navigating into the individual integration you are contributing to in your terminal rather than working from the root directory:

```bash
cd integrations/<INTEGRATION_NAME>
```

### Breaking Changes
Please note, there is currently no way for user's of these integrations to choose specific versions. **Therefore, all changes must always be fully backwards compatible**. If a change is breaking it will not be considered.

### Adding Dependencies
If you need to add an external dependency to an integration, **please ensure you add it within the integration directory, not the root directory**. That being said, please keep in mind that these integrations are run client side. Please only add external dependencies if it is critical to your code changes.

### Running Tests
Each integration directory has an npm script called `test` that you can use to easily run the unit tests with via `yarn test`.

### Code Formatting
This project uses eslint to ensure uniform code formatting standards are maintained. You can see the specific eslint config in the root `.eslintrc` file. A pre-commit hook is used to help automate this process for you.

### Pull Requests
Please make sure your PR includes the new version in `package.json` as well as an update to the integration's HISTORY.md file describing the change.

### Releasing
All releases are handled by Segment engineers. Releases will be managed after a change has been approved and merged.
