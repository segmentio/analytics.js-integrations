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
}

func main() {

	flag.Parse()

	monorepo, err := operations.OpenMonorepo(monorepoPath)
	if err != nil {
		os.Exit(1)
	}

	integrations, err := monorepo.OpenAllIntegrations()

	for _, integration := range integrations {
		operations.Output("%s", integration.Name)
		operations.Debug(" - Version: %s", integration.Package.Version)
		operations.Debug(" - Dependencies: %d", len(integration.Package.Dependencies))
		operations.Debug(" - Path: %s", integration.Path)

	}

	operations.Debug("---------")
	operations.Debug("Total integrations: %d", len(integrations))
	operations.Debug("---------")

}
