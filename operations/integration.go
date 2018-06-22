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
	Name            string
	Description     string
	Version         string
	Keywords        []string
	Main            string
	Scripts         Scripts
	Author          string
	License         string
	Homepage        string
	Bugs            Bugs
	Repository      Repository
	Dependencies    Dependencies
	DevDependencies Dependencies
}

// Bugs from package.json
type Bugs struct {
	URL string
}

// Dependencies is a map of package:version
type Dependencies map[string]string

// Repository from package.json
type Repository struct {
	Type string
	URL  string
}

// Scripts from package.json
type Scripts map[string]string

// OpenIntegration retuns a reference to the integration stored in the monorepo.
func (m *Monorepo) OpenIntegration(name string) (*Integration, error) {
	folder := path.Join(m.repo.Path(), "..", m.IntegrationsPath, name)
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
