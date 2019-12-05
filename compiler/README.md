# Analaytics.js-Integrations Tester

This is a simple command line tool that supports building and testing Analytics.js locally.

Note: The path to all directories referenced in this document are relative to the Compiler tool root folder (where this README is located).

# Install

Before you begin, run `yarn install --no-lockfile` to install dependencies. Be sure to include `no-lockfile` - this prevents yarn from generating a `yarn.lock` file. The lock file locks dependency versions, which prevents this CLI 
from pulling in local changes you make to integrations in this repo. If at any point you generate a lock file in this 
directory, delete it before continuing, or you won't be able to test any of your local integration changes.

To get started, simply run `./compile --writeKey=<YOUR WRITE KEY>`.

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

 - This tool builds all A.js integration packages from the `../integrations` directory into a local version of A.js.
 - The tool retrieves integration settings from `http://cdn.segment.com/v1/projects/${writeKey}/settings`. Because we pull settings from the 
Segment account associated with the `--writeKey` option, you must enable and set up each integration you'd like to test in your Segment dashboard 
before building a version of A.js locally using this tool.
 - Once A.js is built, this tool saves a copy of your A.js build in the `./builds` folder. Build names follow the pattern `analytics-${date}.js`, where 
`date` is the unix timestamp in seconds at which the file was generated.
 - Next, the tool launches your default browser, serving a sample `index` file from `./src/index.html`. This file includes the Segment snippet and 
initializes the your just-generated A.js build so you can begin testing right away.

# Adding New Destinations

Adding new destinations is easy - just add the package name and file path to the `./package.json` file in this directory. For example, to
add a new integration with slug `google-v2`, just add the following line to the `dependencies` section of `./package.json`:

```
"@segment/analytics.js-integrations-google-v2": "file:../integrations/google-v2"
```

Note the `google-v2` destination directory must exist in `../integrations`, and the package name in that directory must match the package name
specified in the `package.json` file in this directory.

# FAQ

**Are A.js video plugins and client-side tracking plans supported?**
No, currently the A.js Tester doesn't support video plugins or tracking plans; however, we will add these in the future if needed for testing.
