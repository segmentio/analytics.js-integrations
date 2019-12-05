const github = require('@actions/github')
const core = require('@actions/core')

const {
    GITHUB_TOKEN
} = process.env

const PR_LABEL = 'TEST'
const REPO_OWNER = 'segmentio'
const REPO_NAME = 'analytics.js-integrations'

const octokit = new github.GitHub(GITHUB_TOKEN)

async function run () {
  const { number, pull_request } = github.context.payload

    // No need to check if the label has already been applied.
  if (pull_request.labels.includes(PR_LABEL)) {
    return
  }

  await octokit.issues.addLabels({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    issue_number: number,
    labels: [PR_LABEL]
  })
}

try {
  run()
} catch (err) {
  core.fail(err)
}
