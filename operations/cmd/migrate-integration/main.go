package main

import (
	"flag"
	"os"
	"path"

	"github.com/segmentio/analytics.js-integrations/operations"
)

const organization = "segment-integrations"

var integrationName string
var monorepoPath string
var tmpPath string

func init() {
	flag.BoolVar(&operations.Verbose, "verbose", false, "prints more stuff")
	flag.StringVar(&integrationName, "integration", "", "integration name")
	flag.StringVar(&monorepoPath, "monorepoPath", "..", "Local path where the monrepo is")
	flag.StringVar(&tmpPath, "tmpPath", "/tmp/integrations", "path where the integration code is going to be stored")
}

func main() {

	operations.GetAuthToken()

	flag.Parse()
	if integrationName == "" {
		operations.Log("No integration provided")
		flag.Usage()
		os.Exit(1)
	}

	github := operations.NewGitHubClient()
	integration, err := operations.OpenIntegration(github, organization, integrationName, path.Join(tmpPath, integrationName))
	if err != nil {
		os.Exit(1)
	}

	monorepo, err := operations.OpenMonorepo(github, "segmentio", "analytics.js-integrations", monorepoPath)
	if err != nil {
		os.Exit(1)
	}

	if err := integration.MigrateToMonorepo(github, monorepo); err != nil {
		os.Exit(1)
	}

	operations.Log("The integration %s has been migrated", integrationName)

}
