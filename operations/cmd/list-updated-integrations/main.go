package main

import (
	"flag"
	"os"

	"github.com/segmentio/analytics.js-integrations/operations"
	"gopkg.in/libgit2/git2go.v27"
)

var commit string
var monorepoPath string

func init() {
	flag.BoolVar(&operations.Verbose, "verbose", false, "prints more stuff")
	flag.StringVar(&monorepoPath, "monorepoPath", "..", "Local path where the monrepo is")
	flag.StringVar(&commit, "commit", "e4d3f47fac92fc618b3af85d559b24793cce4861", "Commit to compare")
}

func main() {

	operations.GetAuthToken()

	flag.Parse()

	github := operations.NewGitHubClient()

	monorepo, err := operations.OpenMonorepo(github, "segmentio", "analytics.js-integrations", monorepoPath)
	if err != nil {
		os.Exit(1)
	}

	oid, err := git.NewOid(commit)
	if err != nil {
		operations.LogError(err, "Error looking up commit")
		os.Exit(1)
	}

	integrations, err := monorepo.ListUpdatedIntegrationsSinceCommit(oid)
	if err != nil {
		os.Exit(1)
	}

	operations.Log("Integrations updated since commit %s: ", commit)
	for _, integration := range integrations {
		operations.Log("%s: %s", integration.Name, integration.Package.Version)
	}

}
