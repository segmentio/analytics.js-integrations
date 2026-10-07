
**What does this PR do?**


**Are there breaking changes in this PR?**


**Testing**
<!---

All PRs must follow the process for change control as outlined in:
https://docs.google.com/document/d/1N2MtcLtiI7MK_GgwEe1tXtDYrMZnbfJCVyFvVoof-Ss/edit?tab=t.0

- Testing completed successfully using <how did you test, environment>; or
- Testing not required because <explain why you think testing isn't needed>

--->

## Change Release Safety

<!-- Per the Segment Change Release Safety guidelines, every PR that can reach production must
     include the plans below plus risk mitigation, in enough detail that another engineer could
     reproduce them. Vague entries ("Tested in stage", "Auto deployed", "Check dashboards",
     "Revert PR and push", "N/A") are not acceptable and will be flagged in review.
     Guidelines: https://docs.google.com/document/d/1N2MtcLtiI7MK_GgwEe1tXtDYrMZnbfJCVyFvVoof-Ss/edit?tab=t.0 -->

### Test Plan

<!-- Environment(s) used and tests run (unit, integration, local end-to-end) and their results, in enough detail for another engineer to reproduce. -->

### Deployment Plan

<!-- How the change is released (version bump, publish pipeline, who/what triggers it), and any linked PRs or downstream upgrades that must land together. -->

### Verification Plan

<!-- How you will confirm the released version works: CI/E2E results, smoke checks against the published version, and downstream consumers exercised. Aim for ~3 independent signals. Required complement to the Test Plan. -->

### Rollback Plan

<!-- Steps any teammate can execute to roll back, e.g. deprecate the bad published version and publish a fixed one, or pin consumers to the last good version. Test risky rollbacks first. -->

### Risk Mitigation

<!-- Actions taken to reduce risk, e.g. limiting the change to one integration or command, and keeping behavior backward compatible for existing consumers. -->

### Change Control Checklist

<!-- Approval count and plan sections are enforced elsewhere (branch ruleset), so only items GitHub cannot enforce are listed. -->

- [ ] [Segmenters] Deep review run before requesting review and again before merge, with critical/high findings addressed, and the attestation comment posted on the PR

**Existing Unit Tests**

Since the existing unit tests for several integrations are not in good shape, developers are expected to fix
them for the integration they are working/touch on.
Please ensure the following before submitting a PR:
- [ ] Fixed all the existing unit tests for the integration touched.

**Any background context you want to provide?**


**Is there parity with the server-side/android/iOS integration components (if applicable)?**


**Does this require a new integration setting? If so, please explain how the new setting works**


**Links to helpful docs and other external resources**
