package operations

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"path"
)

// Integration represents an integration contained in the monorepo
type Integration struct {
	Name    string
	Path    string
	Package Package

	monorepo *Monorepo
}

// Package is the representation of package.json
type Package struct {
	Name            string       `json:"name"`
	Description     string       `json:"description"`
	Version         string       `json:"version"`
	Keywords        []string     `json:"keywords"`
	Main            string       `json:"main"`
	Scripts         Scripts      `json:"scripts"`
	Author          string       `json:"author"`
	License         string       `json:"license"`
	Homepage        string       `json:"homepage"`
	Bugs            Bugs         `json:"bugs"`
	Repository      Repository   `json:"repository"`
	Dependencies    Dependencies `json:"dependencies"`
	DevDependencies Dependencies `json:"devDependencies"`
}

// Bugs from package.json
type Bugs struct {
	URL string `json:"url"`
}

// Dependencies is a map of package:version
type Dependencies map[string]string

// Repository from package.json
type Repository struct {
	Type string `json:"type"`
	URL  string `json:"url"`
}

// Scripts from package.json
type Scripts map[string]string

// OpenIntegration retuns a reference to the integration stored in the monorepo.
func (m *Monorepo) OpenIntegration(name string) (*Integration, error) {
	folder := path.Join(m.getIntegrationsFolder(), name)
	packageJSON := path.Join(folder, "package.json")

	folderExists, err := fileExists(folder)
	if err != nil {
		return nil, err
	}

	packageExists, err := fileExists(packageJSON)
	if err != nil {
		return nil, err
	}

	if !folderExists || !packageExists {
		err := errors.New("not found")
		LogError(err, "Error opening integration")
		return nil, err
	}

	p, err := DecodePackage(packageJSON)
	if err != nil {
		return nil, err
	}

	return &Integration{
		Name:     name,
		Path:     folder,
		Package:  p,
		monorepo: m,
	}, nil
}

// OpenAllIntegrations scans the integration folder
func (m *Monorepo) OpenAllIntegrations() (map[string]*Integration, error) {

	entries, err := ioutil.ReadDir(m.getIntegrationsFolder())
	if err != nil {
		LogError(err, "Error reading directory")
		return nil, err
	}

	integrations := make(map[string]*Integration)

	for _, entry := range entries {
		if entry.IsDir() {
			integration, err := m.OpenIntegration(entry.Name())
			if err == nil {
				// Is not an integration
				integrations[integration.Name] = integration
			}
		}
	}

	return integrations, nil
}

// DecodePackage parses package.json into the struct
func DecodePackage(file string) (Package, error) {

	data, err := ioutil.ReadFile(file)
	if err != nil {
		LogError(err, "Error reading package.json")
		return Package{}, err
	}

	var p Package

	if err := json.Unmarshal(data, &p); err != nil {
		LogError(err, "Error decoding package.json")
		return Package{}, err
	}

	return p, nil
}

// EncodePackage writes the struct into package.json
func EncodePackage(p Package, file string) error {

	data, err := json.MarshalIndent(p, "", "  ")
	if err != nil {
		LogError(err, "Error encoding package")
		return err
	}

	if err := ioutil.WriteFile(file, data, 0644); err != nil {
		LogError(err, "Error writing package.json")
		return err
	}

	return nil
}
