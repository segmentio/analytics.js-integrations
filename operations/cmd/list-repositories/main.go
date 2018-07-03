package main

import (
	"flag"
	"os"

	"github.com/segmentio/analytics.js-integrations/operations"
)

var mods string
var monorepoPath string
var repos bool

const organization = "segment-integrations"

func init() {
	flag.BoolVar(&operations.Verbose, "verbose", false, "prints more stuff")
	flag.StringVar(&monorepoPath, "monorepoPath", ".", "Local path where the monrepo is")
	flag.StringVar(&mods, "searchMods", "", "extra search parameters, like archived:no or is:private")
}

func main() {

	operations.GetGitHubAuthToken()

	flag.Parse()
	github := operations.NewGitHubClient()

	projects, err := github.ListProjects(organization, "analytics.js-integration-", mods)
	if err != nil {
		os.Exit(1)
	}

	openPullRequests := 0
	openIssues := 0
	projectsWithForks := 0

	for _, project := range projects {
		operations.Output("%s", project.RepositoryName)
		operations.Debug(" - URL: %s", project.URL)
		operations.Debug(" - Forks: %d", project.Forks)
		operations.Debug(" - Open Pull Requests: %d", project.OpenPullRequests)
		operations.Debug(" - Open Issues: %d", project.OpenIssues)
		operations.Debug(" - Is private: %t", project.IsPrivate)
		operations.Debug(" - Last Updated: %s", project.LastUpdated.Format("01/02/2006"))

		if project.Forks > 0 {
			projectsWithForks++
		}
		openIssues += project.OpenIssues
		openPullRequests += project.OpenPullRequests

		issues, err := github.GetOpenIssues(organization, project.RepositoryName)
		if err != nil {
			os.Exit(1)
		}

		for _, issue := range issues {
			operations.Debug(" - Issue #%d: %s (by @%s)", issue.Number, issue.Title, issue.Author)
		}

		pullRequests, err := github.GetOpenPullRequests(organization, project.RepositoryName)
		if err != nil {
			os.Exit(1)
		}

		for _, pullRequest := range pullRequests {
			operations.Debug(" - Pull Request #%d: %s (by @%s)", pullRequest.Number, pullRequest.Title, pullRequest.Author)
		}

	}

	operations.Debug("---------")
	operations.Debug("Total integrations: %d", len(projects))
	operations.Debug("Open Pull Requests: %d", openPullRequests)
	operations.Debug("Open Issues: %d", openIssues)
	operations.Debug("Integrations with forks: %d", projectsWithForks)
	operations.Debug("---------")

}
