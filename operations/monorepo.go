package operations

import (
	"fmt"
	"path"
	"path/filepath"
	"regexp"
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
	IntegrationsPath string

	repo       *git.Repository
	path       string
	commitTmpl *template.Template
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
		IntegrationsPath: integrationsFolder,
		repo:             repo,
		path:             path,
		commitTmpl:       tmpl,
	}, nil
}

// AddIntegrationRepo adds the integration files into the monorepo as a folder, and commits
// the results. It returns the new commit's link.
func (m *Monorepo) AddIntegrationRepo(integration IntegrationRepo) (string, error) {
	Debug("Adding %s to the monorepo", integration.Name)

	// Copy files into /integrations/<integration>
	src := path.Join(integration.Repo.Path(), "..")
	dst := path.Join(m.repo.Path(), "..", m.IntegrationsPath, integration.Name)

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

	oid, err := commitFiles(m.repo, []string{m.IntegrationsPath}, m.commitMigrationMessage(integration))
	if err != nil {
		return "", err
	}

	return monorepoURL + "/commit/" + oid.String(), nil
}

func (m *Monorepo) commitMigrationMessage(integration IntegrationRepo) string {
	info := struct {
		Name, URL, Readme string
	}{
		Name:   integration.Name,
		URL:    integration.URL,
		Readme: integration.URL + "/blob/master/README.md",
	}

	return executeTemplate(m.commitTmpl, info)
}

// ListUpdatedIntegrationsSinceCommit compare the current state of the integration with a commit
// and return the names of the integrations that have change.
func (m *Monorepo) ListUpdatedIntegrationsSinceCommit(commitSha *git.Oid) ([]string, error) {

	diffRegexp := regexp.MustCompilePOSIX(fmt.Sprintf(`^%s/([a-z_-]+)/.*$`, m.IntegrationsPath))

	commit, err := m.repo.LookupCommit(commitSha)
	if err != nil {
		LogError(err, "Can not get commit for %s", commitSha.String())
		return nil, err
	}

	treeToCompare, err := commit.Tree()
	if err != nil {
		LogError(err, "Can not retrieve tree for commit %s", commitSha.String())
		return nil, err
	}

	options := &git.DiffOptions{}

	diff, err := m.repo.DiffTreeToWorkdirWithIndex(treeToCompare, options)
	if err != nil {
		LogError(err, "Error getting diff")
		return nil, err
	}

	integrations := make(map[string]bool)

	p := func(delta git.DiffDelta, _ float64) (git.DiffForEachHunkCallback, error) {
		for _, file := range []string{delta.NewFile.Path, delta.OldFile.Path} {
			unixFile := filepath.ToSlash(file)
			matches := diffRegexp.FindAllStringSubmatch(unixFile, -1)
			if len(matches) > 0 && len(matches[0]) == 2 {
				integrations[matches[0][1]] = true
			}
		}
		return doNothingForEachHunk, nil
	}

	if err := diff.ForEach(p, git.DiffDetailFiles); err != nil {
		LogError(err, "Error getting diff for files")
		return nil, err
	}

	res := make([]string, 0, len(integrations))
	for integration := range integrations {
		res = append(res, integration)
	}

	return res, nil
}
