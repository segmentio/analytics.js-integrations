package operations

import (
	"fmt"
	"io/ioutil"
	"path"
	"text/template"

	"gopkg.in/libgit2/git2go.v27"
)

const baseURL = "https://github.com/segment-integrations/"
const baseRepoName = "analytics.js-integration-"
const branch = "master"
const migratedLabel = "migrated"
const labelColor = "008000"
const labelDescription = "The issue has been migrated"
const readmeTemplate = `
# [MOVED] Analytics JS integration {{ .Name }}

**This repository has been moved to the open source [Analytics JS Integrations]({{ .MonorepoURL }}).**

If you want to fork, contribute, or open issues, please do it in the new repository. Existing issues/pull requests will be addressed in the new location.

* [New location]({{ .URL }})
* Last release for this repository: [{{ .LastRelease }}]({{ .LastReleaseURL }})
* [Commit]({{ .Commit }})
* [Previous version of this README](README-OLD.md)

Released under the [MIT license](LICENSE).
`
const commitMsg = `
Deprecate repository, migrate to Analytics JS integrations

See README.md for more information.
`
const commentTemplate = `
Hi @{{ .Author }}, as part of the monorepo migration, this issue has been moved to [new issue]({{ .NewIssueURL }}). Our engineers have been notified and will prioritize and work on it ASAP. Thank you!

For more information, see [README.md]({{ .ReadmeURL }}).
`

// Integration
type Integration struct {
	Name string
	Project
	Repo             *git.Repository
	OpenIssues       []Issue
	OpenPullRequests []PullRequest

	readmeTmpl  *template.Template
	commentTmpl *template.Template
}

// OpenIntegration gets the project from GitHub and clones the repo locally
func OpenIntegration(github *GitHub, organization, name, dst string) (*Integration, error) {

	tmpl, err := template.New("integration-readme").Parse(readmeTemplate)
	if err != nil {
		LogError(err, "Error parsing template")
		return nil, err
	}

	commentTmpl, err := template.New("integration-issue-comment").Parse(commentTemplate)
	if err != nil {
		LogError(err, "Error parsing template")
		return nil, err
	}

	project, err := github.GetProject(organization, baseRepoName+name)
	if err != nil {
		return nil, err
	}

	labelExists := false
	for _, label := range project.Labels {
		if label == migratedLabel {
			labelExists = true
			break
		}
	}

	if !labelExists {
		if err := github.AddLabelToRepository(migratedLabel, labelColor, labelDescription, project); err != nil {
			return nil, err
		}
	}

	issues, err := github.GetOpenIssues(organization, baseRepoName+name)
	if err != nil {
		return nil, err
	}

	pullRequests, err := github.GetOpenPullRequests(organization, baseRepoName+name)
	if err != nil {
		return nil, err
	}

	repo, err := clone(baseURL+baseRepoName+name, dst)
	if err != nil {
		LogError(err, "Error cloning repo")
		return nil, err
	}

	return &Integration{
		Name:             name,
		Project:          project,
		Repo:             repo,
		OpenIssues:       issues,
		OpenPullRequests: pullRequests,
		readmeTmpl:       tmpl,
		commentTmpl:      commentTmpl,
	}, nil

}

// IsMigrated returns true if the repo has been commited to the monorepo and all the issues and
// open requests have been migrated
func (i *Integration) IsMigrated() bool {
	for _, topic := range i.Project.Topics {
		if topic == migratedLabel {
			return true
		}
	}

	return false
}

// MigrateToMonorepo commits the source code to the monorepo, migrates
// issues and pull requests, and updates the readme.
func (i *Integration) MigrateToMonorepo(github *GitHub, monorepo *Monorepo) error {
	Debug("Migrating integration %s", i.Name)

	if i.IsMigrated() {
		Log("The integration %s was already migrated, no changes", i.Name)
		return nil
	}

	link, err := monorepo.AddIntegration(*i)
	if err != nil {
		return err
	}

	if err := i.notify(link); err != nil {
		return err
	}

	if err := i.migrateIssues(github, *monorepo); err != nil {
		return err
	}

	if err := i.migratePullRequests(github, *monorepo); err != nil {
		return err
	}

	// Mark as done
	return github.UpdateTopics([]string{migratedLabel, "javascript", "analyticsjs"}, i.Project)
}

func (i *Integration) updateReadme(commitLink, lastTag string) error {
	readme := path.Join(i.Repo.Path(), "..", "README.md")
	newFile := path.Join(i.Repo.Path(), "..", "README-OLD.md")

	if err := copy(readme, newFile); err != nil {
		LogError(err, "Error copying README for %s", i.Name)
		return err
	}

	lastRelease := lastTag
	lastReleaseURL := i.URL + "/releases/tag/" + lastTag
	if lastTag == "" {
		lastRelease = "none"
		lastReleaseURL = "n/a"
	}

	info := struct {
		Name, MonorepoURL, URL, Commit, LastRelease, LastReleaseURL string
	}{
		Name:           i.Name,
		MonorepoURL:    monorepoURL,
		URL:            monorepoURL + "/tree/master/integrations/" + i.Name,
		Commit:         commitLink,
		LastRelease:    lastRelease,
		LastReleaseURL: lastReleaseURL,
	}

	if err := ioutil.WriteFile(readme, []byte(executeTemplate(i.readmeTmpl, info)), 0644); err != nil {
		LogError(err, "Error writing new README")
		return err
	}

	return nil
}

// push is a simple push to remote from the current branch
func (i *Integration) pushHead() error {
	Debug("Pushing integration %s", i.Name)

	origin, err := i.Repo.Remotes.Lookup("origin")
	if err != nil {
		LogError(err, "Error getting the origin remote")
		return err
	}

	headReference, err := i.Repo.Head()
	if err != nil {
		LogError(err, "Error getting HEAD")
		return err
	}

	options := &git.PushOptions{
		RemoteCallbacks: git.RemoteCallbacks{
			CredentialsCallback:      credentialsCallback,
			SidebandProgressCallback: printMessage,
		},
	}

	refs := []string{headReference.Name()}
	if err := origin.Push(refs, options); err != nil {
		LogError(err, "Error pushing to origin")
		return err
	}

	return nil
}

// notify adds a note to the README and commits to master.
func (i *Integration) notify(commitLink string) error {

	notified, err := fileExists("README-OLD.md")
	if err != nil {
		return err
	}

	if notified {
		// already notified
		return nil
	}

	lastTag, err := getLatestTag(i.Repo)
	if err != nil {
		return err
	}

	var lastTagName string
	if lastTag != nil {
		lastTagName = lastTag.Name()
	}

	if err := i.updateReadme(commitLink, lastTagName); err != nil {
		return err
	}

	pathspec := []string{
		"README.md",
		"README-OLD.md",
	}

	if _, err := commitFiles(i.Repo, pathspec, commitMsg); err != nil {
		return err
	}

	return i.pushHead()
}

// migrateIssues copies the body of each issue in a new issue in the monorepo,
// leaves a comment in the original issue and marks the issue as migrated
func (i *Integration) migrateIssues(github *GitHub, monorepo Monorepo) error {

	for _, issue := range i.OpenIssues {
		Debug("Labels for issue %s", issue.Labels)
		for _, label := range issue.Labels {
			if label == migratedLabel {
				return nil
			}
		}

		title := fmt.Sprintf("[%s] %s", i.Name, issue.Title)
		body := fmt.Sprintf("_Migrated from [#%d](%s) by @%s_\n\n%s", issue.Number, issue.URL, issue.Author, issue.Body)

		newIssue, err := github.AddIssue(title, body, monorepo.Project)
		if err != nil {
			return err
		}

		data := struct {
			Author, NewIssueURL, ReadmeURL string
		}{
			Author:      issue.Author,
			NewIssueURL: fmt.Sprintf("%s/issues/%d", monorepo.URL, newIssue.Number),
			ReadmeURL:   i.URL + "/blob/master/README.md",
		}
		comment := executeTemplate(i.commentTmpl, data)
		Debug("Comment to submit:\n %s", comment)
		if err := github.AddCommentToIssue(comment, issue); err != nil {
			return err
		}

		if err := github.AddLabelToIssue(migratedLabel, issue); err != nil {
			return err
		}
	}

	return nil
}

// migratePullRequests copies the body of each pull request in a new issue in the monorepo,
// leaves a comment in the original one and marks the pull request as migrated
func (i *Integration) migratePullRequests(github *GitHub, monorepo Monorepo) error {

	for _, pullRequest := range i.OpenPullRequests {
		Debug("Labels for issue %s", pullRequest.Labels)
		for _, label := range pullRequest.Labels {
			if label == migratedLabel {
				return nil
			}
		}

		title := fmt.Sprintf("[%s] Pull Request #%d: %s", i.Name, pullRequest.Number, pullRequest.Title)
		body := fmt.Sprintf("_Migrated from [#%d](%s) by @%s_\n\n%s", pullRequest.Number, pullRequest.URL, pullRequest.Author, pullRequest.Body)

		newIssue, err := github.AddIssue(title, body, monorepo.Project)
		if err != nil {
			return err
		}

		data := struct {
			Author, NewIssueURL, ReadmeURL string
		}{
			Author:      pullRequest.Author,
			NewIssueURL: fmt.Sprintf("%s/issues/%d", monorepo.URL, newIssue.Number),
			ReadmeURL:   i.URL + "/blob/master/README.md",
		}
		comment := executeTemplate(i.commentTmpl, data)

		if err := github.AddCommentToPullRequest(comment, pullRequest); err != nil {
			return err
		}

		if err := github.AddLabelToPullRequest(migratedLabel, pullRequest); err != nil {
			return err
		}
	}

	return nil
}
