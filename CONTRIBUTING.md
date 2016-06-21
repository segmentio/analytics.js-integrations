# Contributing

We're huge fans of open-source, and we absolutely love getting good contributions to **analytics.js**! Integrations are available to thousands of Segment customers and we have hundreds of integrations in already in our queue, so it's important that you do the following _before writing a pull request_. 

1. Read about our integration options and apply to be a partner: https://segment.com/partners/
1. Hear from the Segment team before submitting your pull request.

## Getting Set Up

To start, we'll get you set up with our development environment. All of our development scripts and helpers are written in [node.js](http://nodejs.org), so you'll want to install that first by going to [nodejs.org](http://nodejs.org).

Then after forking **analytics.js-integrations** just `cd` into the folder and run `make`:

```bash
$ cd analytics.js-integration-${ name }
$ make
```

That will install all of our [npm](http://npmjs.org) and [component](http://component.io) dependencies and compile the latest version of the development build to test against. You can now add your changes to the library, and run `make test` to make sure everything is passing still.

The commands you'll want to know for development are:

```bash
$ make               # re-compiles the development build of analytics.js for testing
$ make test          # runs all of the tests in your terminal
$ make test-browser  # runs all of the tests in your browser, for nicer debugging
```

## Writing Tests

Every contribution should be accompanied by matching tests. If you look inside of the `test/` directory, you'll see we're pretty serious about this. That's because:

1. **analytics.js** runs on tons of different types of browsers, operating systems, etc. and we want to make sure it runs well everywhere.
1. It lets us add new features much, much more quickly.
1. We aren't insane.

When adding your own integration, the easiest way to figure out what major things to test is to look at everything you've added to the integration `prototype`. You'll want to write testing groups for `#initialize`, `#load`, `#identify`, `#track`, etc. And each group should test all of the expected functionality.

The most important thing to writing clean, easy-to-manage integrations is to **keep them small** and **clean up after each test**, so that the environment is never polluted by an individual test.

If you run into any questions, check out a few of our existing integrations to see how we've done it.

## Contributing Checklist

To help make contributing easy, here's all the things you need to remember:

- Add your integration file to `/lib`.
- Create a new Integration constructor with the `integration` factory component.
- Add your integration's default options with `.option()`.
- Add an `initialize` method to your integration's `prototype`.
- Add methods you want to support to the `prototype`. (`identify`, `track`, `pageview`, etc.)
- Write tests for all of your integration's logic.
- Run the tests and get everything passing.
- Commit your changes with a nice commit message.
- Submit your pull request.