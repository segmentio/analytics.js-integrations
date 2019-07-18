This directory contains useful scripts and commands to update integrations in bulk.

**Please Note:** the commands in this directory are only useful for Segment engineers. External contributors can safely ignore.

## Env vars
- `GITHUB_TOKEN`: To query/update GitHub.
- `GITHUB_USER`: For commits. Optional, if not present it will use the system configuration.
- `GITHUB_EMAIL`: For commits. Optional, if not present it will use the system configuration.

To use `SegmentDestinationsBot`, get the credentials from:
```bash
$ aws-okta exec production-write -- chamber read -q destinations github_bot_(token|user|email)
```

## list-repositories
Lists all the integrations repositories.
Options:
- `--verbose`
- `--searchMods=<string>`: GitHub search mods to query the repositories (`is:private`, `is:public`).

## list-integrations

Lists all the integrations.
Options:
- `--verbose`
- `--monorepoPath=<string>`: Local path where the monorepo lives. Default to `.`.

## list-updated-integrations

Lists all the updated integrations since the specified commit or `refs/heads/master`.
Options:
- `--verbose`
- `--monorepoPath=<string>`: Local path where the monorepo lives. Default to `.`.
- `--commit=<string>`: Commit or reference to compare with the current workspace. Default to `refs/heads/master`.

## migrate-integration

Migrates the integration repo into the monorepo:
1. Copies the integration code in the monorepo.
1. Updates references in package.json for the integration.
1. Commits the integration code.
1. Updates the integration repo with a notice.
1. Comments in all opened issues and pull requests and copies them to the monorepo as issues.
1. Marks the repo as `migrated`.

Options:
- `--verbose`
- `--integration=<name>`
- `--monorepoPath=<string>`: Local path where the monorepo lives. Default to `.`.
- `--tmpPath=<string>`: Temporal folder. Default to `/tmp/integrations`.

## archive-integration-repository

Archives the repository of the integration:
1. Removes all webhooks.
1. Archives the repository.

Options:
- `--verbose`
- `--integration=<name>`
- `--tmpPath=<string>`: Temporal folder. Default to `/tmp/integrations`.

## boneyard-integration-repository

Moves the repository to the boneyard organization.

Options:
- `--verbose`
- `--integration=<name>`
- `--tmpPath=<string>`: Temporal folder. Default to `/tmp/integrations`.

## libgit2

Install libgit2 v27 following [this script](ci/install-libgit2). This is also required
for the CI docker image.
**IMPORTANT:** The following extensions need to be present for libgit2:
- `openssl`
- `libhttp-parser-dev`

## SauceConnect

We use SauceConnect to make a tunnel between localhost and SauceLabs infrastructure. To install
it, check [this script](ci/install-sc). This is also required
for the CI docker image.
