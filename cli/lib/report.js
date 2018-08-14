const github = require("github-paths");
const log = require("./log");

/**
 * Logs an error and creates a special github link that
 * lets a user log the error as a github issue.
 * @param {Error} err
 */
function reportErr(err) {
  log.error(err);

  log.body(
    "Whoops we screwed up and served you an error! Would you mind reporting it by clicking on the link below?"
  );

  const issueLink = github("segmentio/analytics.js-integrations").issue(
    "ajs-cli bug",
    err
  );

  log.important(issueLink);
}

module.exports = reportErr;
