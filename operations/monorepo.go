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

var ignorePaths = map[string]bool{
	".circleci":         true,
	".eslintrc":         true,
	".git":              true,
	".gitignore":        true,
	".github":           true,
	"circle.yml":        true,
	"karma.conf.ci.js":  true,
	"karma.conf.js":     true,
	"CONTRIBUTING.md":   true,
	"LICENSE":           true,
	"Makefile":          true,
	"package-lock.json": true,
	"yarn.lock":         true,
}

// Monorepo
type Monorepo struct {
	Project
	IntegrationsPath string

	repo       *git.Repository
	path       string
	commitTmpl *template.Template
}

// OpenMonorepo returns the git repository of the monorepo
func OpenMonorepo(path string) (*Monorepo, error) {
	Debug("Opening monorepo from %s", path)

	repo, err := git.OpenRepository(path)
	if err != nil {
		LogError(err, "Error opening monorepo")
		return nil, err
	}

	return &Monorepo{
		IntegrationsPath: integrationsFolder,
		repo:             repo,
		path:             path,
	}, nil
}

// ConnectToGitHub updates the struct containing GitHub metadata. This was separated from
// `OpenMonorepo` because in some ocasions we don't need all GitHub information.
func (m *Monorepo) ConnectToGitHub(github *GitHub, organization, name string) error {
	project, err := github.GetProject(organization, name)
	if err != nil {
		return err
	}

	tmpl, err := template.New("monorepo-commit").Parse(commitTemplate)
	if err != nil {
		LogError(err, "Error parsing template")
		return err
	}

	m.Project = project
	m.commitTmpl = tmpl
	return nil
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

	if err := copyFiles(src, dst, ignorePaths); err != nil {
		return "", err
	}

	if err := m.updatePackageURLs(integration.Name, dst); err != nil {
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

// ListUpdatedIntegrationsSinceCommit compare the current state of the integration with a commit (oid or ref)
// and return the integrations that have change.
func (m *Monorepo) ListUpdatedIntegrationsSinceCommit(commitID string) (map[string]*Integration, error) {

	diffRegexp := regexp.MustCompilePOSIX(fmt.Sprintf(`^%s/([a-z_-]+)/.*$`, m.IntegrationsPath))

	integrations, err := m.OpenAllIntegrations()
	if err != nil {
		return nil, err
	}

	commit, err := resolveCommit(commitID, m.repo)
	if err != nil {
		LogError(err, "Can not get commit for %s", commitID)
		return nil, err
	}

	treeToCompare, err := commit.Tree()
	if err != nil {
		LogError(err, "Can not retrieve tree for commit %s", commitID)
		return nil, err
	}

	options := &git.DiffOptions{}

	diff, err := m.repo.DiffTreeToWorkdirWithIndex(treeToCompare, options)
	if err != nil {
		LogError(err, "Error getting diff")
		return nil, err
	}

	updatedIntegrations := make(map[string]*Integration)

	p := func(delta git.DiffDelta, _ float64) (git.DiffForEachHunkCallback, error) {
		for _, file := range []string{delta.NewFile.Path, delta.OldFile.Path} {
			unixFile := filepath.ToSlash(file)
			matches := diffRegexp.FindAllStringSubmatch(unixFile, -1)
			if len(matches) > 0 && len(matches[0]) == 2 {
				name := matches[0][1]
				if i, found := integrations[name]; found {
					updatedIntegrations[name] = i
				}
			}
		}
		return doNothingForEachHunk, nil
	}

	if err := diff.ForEach(p, git.DiffDetailFiles); err != nil {
		LogError(err, "Error getting diff for files")
		return nil, err
	}

	return updatedIntegrations, nil
}

// updatePackageURLs change the repo, homepage and bugs urls for a migrated
// integration
func (m *Monorepo) updatePackageURLs(integrationName, folder string) error {

	file := path.Join(folder, "package.json")

	pack, err := DecodePackage(file)
	if err != nil {
		return err
	}

	pack.Repository.URL = fmt.Sprintf("git+%s.git", m.Project.URL)
	pack.Bugs.URL = fmt.Sprintf("%s/issues", m.Project.URL)
	pack.Homepage = fmt.Sprintf("%s/blob/master/integrations/%s#readme", m.Project.URL, integrationName)

	return EncodePackage(pack, file)
}

func (m *Monorepo) getIntegrationsFolder() string {
	return path.Join(m.repo.Path(), "..", m.IntegrationsPath)
}
