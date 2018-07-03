package main

import (
	"flag"
	"os"
	"path"

	"github.com/segmentio/analytics.js-integrations/operations"
)

const organization = "segment-integrations"

var integrationName string
var tmpPath string

func init() {
	flag.BoolVar(&operations.Verbose, "verbose", false, "prints more stuff")
	flag.StringVar(&integrationName, "integration", "", "integration name")
	flag.StringVar(&tmpPath, "tmpPath", "/tmp/integrations", "path where the integration code is going to be stored")
}

func main() {

	operations.GetGitHubAuthToken()

	flag.Parse()
	if integrationName == "" {
		operations.Log("No integration provided")
		flag.Usage()
		os.Exit(1)
	}

	github := operations.NewGitHubClient()
	integration, err := operations.OpenIntegrationRepo(github, organization, integrationName, path.Join(tmpPath, integrationName))
	if err != nil {
		os.Exit(1)
	}

	operations.Log("Archiving %s", integration.RepositoryName)

	if err := integration.Archive(github); err != nil {
		os.Exit(1)
	}

}
