package operations

import (
	"path"
	"text/template"

	"gopkg.in/libgit2/git2go.v27"
)

const integrationsFolder = "integrations"
const monorepoURL = "https://github.com/segmentio/analytics.js-integrations"
const commitTemplate = `
Add integration {{ .Name }}

This commit copies the content of the integration repo into
the "integrations" folder.

Original repo: {{ .URL }}
Readme: {{ .Readme }}
`

// Monorepo
type Monorepo struct {
	Project

	repo                   *git.Repository
	path, integrationsPath string
	commitTmpl             *template.Template
}

// OpenMonorepo returns the git repository of the monorepo
func OpenMonorepo(github *GitHub, organization, name, path string) (*Monorepo, error) {
	Debug("Opening monorepo from %s", path)

	project, err := github.GetProject(organization, name)
	if err != nil {
		return nil, err
	}

	repo, err := git.OpenRepository(path)
	if err != nil {
		LogError(err, "Error opening monorepo")
		return nil, err
	}

	tmpl, err := template.New("monorepo-commit").Parse(commitTemplate)
	if err != nil {
		LogError(err, "Error parsing template")
		return nil, err
	}

	return &Monorepo{
		Project:          project,
		repo:             repo,
		path:             path,
		integrationsPath: integrationsFolder,
		commitTmpl:       tmpl,
	}, nil
}

// AddIntegration adds the integration files into the monorepo as a folder, and commits
// the results. It returns the new commit's link.
func (m *Monorepo) AddIntegration(integration Integration) (string, error) {
	Debug("Adding %s to the monorepo", integration.Name)

	// Copy files into /integrations/<integration>
	src := path.Join(integration.Repo.Path(), "..")
	dst := path.Join(m.repo.Path(), "..", integrationsFolder, integration.Name)

	exists, err := fileExists(dst)
	if err != nil {
		return "", err
	}
	if exists {
		// already added
		return "monorepoURL", nil
	}

	if err := copyFiles(src, dst); err != nil {
		return "", err
	}

	oid, err := commitFiles(m.repo, []string{m.integrationsPath}, m.commitMessage(integration))
	if err != nil {
		return "", err
	}

	return monorepoURL + "/commit/" + oid.String(), nil
}

func (m *Monorepo) commitMessage(integration Integration) string {
	info := struct {
		Name, URL, Readme string
	}{
		Name:   integration.Name,
		URL:    integration.URL,
		Readme: integration.URL + "/blob/master/README.md",
	}

	return executeTemplate(m.commitTmpl, info)
}
