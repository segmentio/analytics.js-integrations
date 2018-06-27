package main

import (
	"flag"
	"os"

	"github.com/segmentio/analytics.js-integrations/operations"
)

var commit string
var monorepoPath string

func init() {
	flag.BoolVar(&operations.Verbose, "verbose", false, "prints more stuff")
	flag.StringVar(&monorepoPath, "monorepoPath", ".", "Local path where the monrepo is")
	flag.StringVar(&commit, "commit", "refs/heads/master", "Commit (or reference) to compare")
}

func main() {

	flag.Parse()

	monorepo, err := operations.OpenMonorepo(monorepoPath)
	if err != nil {
		os.Exit(1)
	}

	integrations, err := monorepo.ListUpdatedIntegrationsSinceCommit(commit)
	if err != nil {
		os.Exit(1)
	}

	operations.Debug("Integrations updated since commit %s: ", commit)
	for _, integration := range integrations {
		operations.Output(integration.Name)
	}

}
