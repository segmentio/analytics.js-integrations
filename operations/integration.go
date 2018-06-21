package operations

import (
	"errors"
	"path"
)

// Integration represents an integration contained in the monorepo
type Integration struct {
	Name string
	Path string

	monorepo *Monorepo
}

// OpenIntegration retuns a reference to the integration stored in the monorepo.
func (m *Monorepo) OpenIntegration(name string) (*Integration, error) {
	folder := path.Join(m.repo.Path(), "..", m.IntegrationsPath, name)

	exists, err := fileExists(folder)
	if err != nil {
		return nil, err
	}

	if !exists {
		err := errors.New("not found")
		LogError(err, "Error opening integration")
		return nil, err
	}

	return &Integration{
		Name:     name,
		Path:     folder,
		monorepo: m,
	}, nil
}
