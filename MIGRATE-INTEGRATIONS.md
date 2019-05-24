# HOW TO MIGRATE AN AJS INTEGRATION TO THE MONOREPO

We are in the process of migrating all analytics-js integrations into
this monorepo. These are the steps to follow to ensure we don't break
people's stuff.

1. Make sure your environment is set up:
    - Github credentials (see [README](operations/README.md))
    - The latest build of operations

2. Copy the integrations file into the monorepo with `migrate-integration`:
    - `$ goto analytics.js-integrations`
    - `$ bin/migrate-integration --integration <integration name>`
This step also updates the original repository, migrating the issues
and pull requests.

3. Submit the pull request and merge the changes.
4. Archive original repository:
    - `$ bin/archive-integration-repository --integration <integration name>`
5. When all original pull requests and issues have been addressed, "boneyard"
the repository:
    - `$ bin/boneyard-integration-repository --integration <integration name>`

NOTE: For big migrations, it's ok to skip SauceLabs tests, but make sure
local tests work (Chrome headless).
