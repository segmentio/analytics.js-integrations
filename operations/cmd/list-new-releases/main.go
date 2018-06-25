package main

import (
	"errors"
	"flag"
	"os"

	"github.com/segmentio/analytics.js-integrations/operations"
)

var monorepoPath string

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
	if err != nil {
		os.Exit(1)
	}

	npm := &operations.NPM{}

	for _, integration := range integrations {
		latestPublished, err := npm.GetLatestVersion(integration.Package.Name)
		if err != nil {
			if err != operations.ErrPackageNotFound {
				os.Exit(1)
			}
			operations.Output(integration.Name)
			operations.Debug(" - Current version: %s", integration.Package.Version)
			operations.Debug(" - NPM uploaded version: none")
			continue
		}

		c, err := operations.CompareSemanticVersion(latestPublished, integration.Package.Version)
		if err != nil {
			os.Exit(1)
		}

		if c < 0 {
			operations.Output(integration.Name)
			operations.Debug(" - Current version: %s", integration.Package.Version)
			operations.Debug(" - NPM uploaded version: %s", latestPublished)
		} else if c > 0 {
			operations.LogError(errors.New("version mismatch"), "%s - The current version %s is older than NPM's one %s, please fix and try again", integration.Name, integration.Package.Version, latestPublished)
			os.Exit(1)
		}
	}

}
