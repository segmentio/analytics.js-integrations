# Analaytics.js-Integrations Tester

This is a simple command line tool that supports building and testing Analytics.js locally.

# Install

There is NO NEED to `yarn` or `yarn install` before using this command line tool. Simply run `./compile --writeKey=<YOUR WRITE KEY>` to get started.

# Usage

```bash
./compile -h

  Usage: ./compile [options]

  Options:

    -w, --write-key <writeKey>  Writekey of target Segment source [Required]
    -p, --port [port]           Set a port to serve the local ajs file from (default: 3000)
    -h, --help                  Output usage information
```

# Build Process

 - This tool builds all A.js-integrations from the local `../integrations` directory into a local version of A.js. 
 - The tool retrieves integration settings from `http://cdn.segment.com/v1/projects/${writeKey}/settings`. Because we pull settings from the 
Segment account associated with the `--writeKey` option, you must enable and set up each integration you'd like to test in your Segment dashboard 
before building a version of A.js locally using this tool.
 - Once A.js is built, this tool saves a copy of your A.js build in the `./builds` folder. Build names follow the pattern `analytics-${date}.js`, where 
`date` is the unix timestamp in seconds at which the file was generated.
 - Next, the tool launches your default browser, serving a sample `index` file from `./src/index.html`. This file includes the Segment snippet and 
initializes the your just-generated A.js build so you can begin testing right away.

# FAQ

We'll add answers to FAQs here as we receive questions.
