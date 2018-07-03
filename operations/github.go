package operations

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/go-github/github"
	"github.com/shurcooL/githubv4"
	"golang.org/x/oauth2"
)

const gitHubAuthvar = "GITHUB_TOKEN"

// Look away, I'm hideous! - KramerQL

// GitHub is a convenient wrapper for the GraphQL client
type GitHub struct {
	V3 *github.Client
	V4 *githubv4.Client
}

// Project represents a GitHub project
type Project struct {
	ID               string
	URL              string
	Organization     string
	RepositoryName   string
	IsPrivate        bool
	Forks            int
	OpenPullRequests int
	OpenIssues       int
	LastUpdated      time.Time
	Labels           []string
	Topics           []string
	IsArchived       bool
}

// Issue represents a GitHub issue
type Issue struct {
	ID          string
	Number      int
	Title       string
	URL         string
	Body        string
	Author      string
	PublishedAt time.Time
	UpdatedAt   time.Time
	Labels      []string

	Organization   string
	RepositoryName string
}

// PullRequest represents a GitHub pull request
type PullRequest struct {
	ID          string
	Number      int
	Title       string
	URL         string
	Body        string
	Author      string
	PublishedAt time.Time
	UpdatedAt   time.Time
	Labels      []string

	Organization   string
	RepositoryName string
}

// NewGitHubClient creates and authenticates a GraphQL client for
// GitHub's V4 API.
func NewGitHubClient() *GitHub {
	src := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: GetGitHubAuthToken()},
	)
	httpClient := oauth2.NewClient(context.Background(), src)

	return &GitHub{
		V3: github.NewClient(httpClient),
		V4: githubv4.NewClient(httpClient),
	}
}

// ListProjects retrieves all repositories starting with prefix
func (g *GitHub) ListProjects(organization, prefix string, mods ...string) ([]Project, error) {
	var search struct {
		Search struct {
			Edges []struct {
				Node struct {
					Repository struct {
						ID         string
						URL        string
						Name       string
						ForkCount  int
						IsPrivate  bool
						PushedAt   time.Time
						IsArchived bool
						Issues     struct {
							TotalCount int
						} `graphql:"issues(states:[OPEN])"`
						PullRequests struct {
							TotalCount int
						} `graphql:"pullRequests(states:[OPEN])"`
						Labels struct {
							Edges []struct {
								Node struct {
									Label struct {
										Name string
									} `graphql:"... on Label"`
								}
							}
						} `graphql:"labels(first:100)"`
						RepositoryTopics struct {
							Edges []struct {
								Node struct {
									RepositoryTopic struct {
										Topic struct {
											Name string
										}
									} `graphql:"... on RepositoryTopic"`
								}
							}
						} `graphql:"repositoryTopics(first:100)"`
					} `graphql:"... on Repository"`
				}
			}
			PageInfo struct {
				EndCursor   string
				HasNextPage bool
			}
		} `graphql:"search(query: $query, type: REPOSITORY, first: 100, after: $cursor)"`
	}

	params := map[string]interface{}{
		"query":  githubv4.String(fmt.Sprintf("%s org:%s in:name %s", prefix, organization, strings.Join(mods, " "))),
		"cursor": (*githubv4.String)(nil),
	}

	projects := make([]Project, 0)

	for {
		if err := g.V4.Query(context.Background(), &search, params); err != nil {
			LogError(err, "Error during search")
			return nil, err
		}

		for _, edge := range search.Search.Edges {
			r := edge.Node.Repository
			project := Project{
				ID:               r.ID,
				URL:              r.URL,
				RepositoryName:   r.Name,
				Organization:     organization,
				IsPrivate:        r.IsPrivate,
				IsArchived:       r.IsArchived,
				Forks:            r.ForkCount,
				LastUpdated:      r.PushedAt,
				OpenIssues:       r.Issues.TotalCount,
				OpenPullRequests: r.PullRequests.TotalCount,
			}

			for _, label := range r.Labels.Edges {
				project.Labels = append(project.Labels, label.Node.Label.Name)
			}

			for _, topic := range r.RepositoryTopics.Edges {
				project.Topics = append(project.Topics, topic.Node.RepositoryTopic.Topic.Name)
			}

			projects = append(projects, project)
		}

		if !search.Search.PageInfo.HasNextPage {
			break
		}
		params["cursor"] = githubv4.String(search.Search.PageInfo.EndCursor)
	}

	return projects, nil
}

// GetProject returns the GitHub repo info
func (g *GitHub) GetProject(organization, name string) (Project, error) {
	var repository struct {
		Repository struct {
			ID         string
			URL        string
			Name       string
			ForkCount  int
			IsPrivate  bool
			IsArchived bool
			PushedAt   time.Time
			Issues     struct {
				TotalCount int
			} `graphql:"issues(states:[OPEN])"`
			PullRequests struct {
				TotalCount int
			} `graphql:"pullRequests(states:[OPEN])"`
			Labels struct {
				Edges []struct {
					Node struct {
						Label struct {
							Name string
						} `graphql:"... on Label"`
					}
				}
			} `graphql:"labels(first:100)"`
			RepositoryTopics struct {
				Edges []struct {
					Node struct {
						RepositoryTopic struct {
							Topic struct {
								Name string
							}
						} `graphql:"... on RepositoryTopic"`
					}
				}
			} `graphql:"repositoryTopics(first:100)"`
		} `graphql:"repository(name: $name owner: $organization)"`
	}

	params := map[string]interface{}{
		"name":         githubv4.String(name),
		"organization": githubv4.String(organization),
	}

	if err := g.V4.Query(context.Background(), &repository, params); err != nil {
		LogError(err, "Error retrieving project")
		return Project{}, err
	}

	r := repository.Repository

	project := Project{
		ID:               r.ID,
		URL:              r.URL,
		RepositoryName:   r.Name,
		Organization:     organization,
		IsPrivate:        r.IsPrivate,
		IsArchived:       r.IsArchived,
		Forks:            r.ForkCount,
		LastUpdated:      r.PushedAt,
		OpenIssues:       r.Issues.TotalCount,
		OpenPullRequests: r.PullRequests.TotalCount,
	}

	for _, label := range r.Labels.Edges {
		project.Labels = append(project.Labels, label.Node.Label.Name)
	}

	for _, topic := range r.RepositoryTopics.Edges {
		project.Topics = append(project.Topics, topic.Node.RepositoryTopic.Topic.Name)
	}

	return project, nil
}

// GetOpenIssues retrieves a list of opened issues for the given project
func (g *GitHub) GetOpenIssues(organization, name string) ([]Issue, error) {
	var repository struct {
		Repository struct {
			Issues struct {
				Edges []struct {
					Node struct {
						Issue struct {
							ID     string
							Number int
							Title  string
							URL    string
							Body   string
							Author struct {
								Login string
							}
							PublishedAt time.Time
							UpdatedAt   time.Time
							Labels      struct {
								Edges []struct {
									Node struct {
										Label struct {
											Name string
										} `graphql:"... on Label"`
									}
								}
							} `graphql:"labels(first:100)"`
						} `graphql:"... on Issue"`
					}
				}
				PageInfo struct {
					EndCursor   string
					HasNextPage bool
				}
			} `graphql:"issues(states:[OPEN] first:100 after:$cursor)"`
		} `graphql:"repository(name: $name owner: $organization)"`
	}

	params := map[string]interface{}{
		"name":         githubv4.String(name),
		"organization": githubv4.String(organization),
		"cursor":       (*githubv4.String)(nil),
	}

	issues := make([]Issue, 0)

	for {
		if err := g.V4.Query(context.Background(), &repository, params); err != nil {
			LogError(err, "Error retrieving issues")
			return nil, err
		}

		for _, edge := range repository.Repository.Issues.Edges {
			i := edge.Node.Issue
			issue := Issue{
				ID:             i.ID,
				Number:         i.Number,
				Title:          i.Title,
				URL:            i.URL,
				Body:           i.Body,
				Author:         i.Author.Login,
				PublishedAt:    i.PublishedAt,
				UpdatedAt:      i.UpdatedAt,
				RepositoryName: name,
				Organization:   organization,
			}

			for _, label := range i.Labels.Edges {
				issue.Labels = append(issue.Labels, label.Node.Label.Name)
			}

			issues = append(issues, issue)
		}

		if !repository.Repository.Issues.PageInfo.HasNextPage {
			break
		}
		params["cursor"] = githubv4.String(repository.Repository.Issues.PageInfo.EndCursor)
	}

	return issues, nil

}

// GetOpenPullRequests retrieves a list of opened pull requests for the given project
func (g *GitHub) GetOpenPullRequests(organization, name string) ([]PullRequest, error) {
	var repository struct {
		Repository struct {
			PullRequests struct {
				Edges []struct {
					Node struct {
						PullRequest struct {
							ID     string
							Number int
							Title  string
							URL    string
							Body   string
							Author struct {
								Login string
							}
							PublishedAt time.Time
							UpdatedAt   time.Time
							Labels      struct {
								Edges []struct {
									Node struct {
										Label struct {
											Name string
										} `graphql:"... on Label"`
									}
								}
							} `graphql:"labels(first:100)"`
						} `graphql:"... on PullRequest"`
					}
				}
				PageInfo struct {
					EndCursor   string
					HasNextPage bool
				}
			} `graphql:"pullRequests(states:[OPEN] first:100 after:$cursor)"`
		} `graphql:"repository(name: $name owner: $organization)"`
	}

	params := map[string]interface{}{
		"name":         githubv4.String(name),
		"organization": githubv4.String(organization),
		"cursor":       (*githubv4.String)(nil),
	}

	pullRequests := make([]PullRequest, 0)

	for {
		if err := g.V4.Query(context.Background(), &repository, params); err != nil {
			LogError(err, "Error retrieving pull requests")
			return nil, err
		}

		for _, edge := range repository.Repository.PullRequests.Edges {
			pr := edge.Node.PullRequest
			pullRequest := PullRequest{
				ID:             pr.ID,
				Number:         pr.Number,
				Title:          pr.Title,
				URL:            pr.URL,
				Body:           pr.Body,
				Author:         pr.Author.Login,
				PublishedAt:    pr.PublishedAt,
				UpdatedAt:      pr.UpdatedAt,
				RepositoryName: name,
				Organization:   organization,
			}

			for _, label := range pr.Labels.Edges {
				pullRequest.Labels = append(pullRequest.Labels, label.Node.Label.Name)
			}

			pullRequests = append(pullRequests, pullRequest)
		}

		if !repository.Repository.PullRequests.PageInfo.HasNextPage {
			break
		}
		params["cursor"] = githubv4.String(repository.Repository.PullRequests.PageInfo.EndCursor)
	}

	return pullRequests, nil

}

// AddCommentToIssue append a comment to an existing issue
func (g *GitHub) AddCommentToIssue(comment string, issue Issue) error {
	return g.addCommentToObject(comment, issue.ID)
}

// AddCommentToPullRequest append a comment to an existing issue
func (g *GitHub) AddCommentToPullRequest(comment string, pr PullRequest) error {
	return g.addCommentToObject(comment, pr.ID)
}

func (g *GitHub) addCommentToObject(comment, id string) error {
	Debug("Adding comment to %s", id)
	var mutation struct {
		AddComment struct {
			ClientMutationID string
		} `graphql:"addComment(input: $input)"`
	}

	input := githubv4.AddCommentInput{
		SubjectID: githubv4.String(id),
		Body:      githubv4.String(comment),
	}

	if err := g.V4.Mutate(context.Background(), &mutation, input, nil); err != nil {
		LogError(err, "Error adding comment")
		return err
	}
	return nil
}

// AddLabelToIssue adds a label
func (g *GitHub) AddLabelToIssue(label string, issue Issue) error {
	return g.addLabelToIssue(label, issue.Organization, issue.RepositoryName, issue.Number)
}

// AddLabelToPullRequest adds a label
func (g *GitHub) AddLabelToPullRequest(label string, pr PullRequest) error {
	return g.addLabelToIssue(label, pr.Organization, pr.RepositoryName, pr.Number)
}

// AddLabelToRepository adds a label
func (g *GitHub) AddLabelToRepository(label, color, description string, project Project) error {
	// No GraphQL yet: https://platform.github.community/t/schema-request-create-issues-labels-milestones-etc/5355/6
	labelRequest := &github.Label{
		Name:        github.String(label),
		Color:       github.String(color),
		Description: github.String(description),
	}

	_, resp, err := g.V3.Issues.CreateLabel(
		context.Background(), project.Organization, project.RepositoryName, labelRequest,
	)

	if err != nil {
		LogError(err, "Error adding label")
		return err
	}

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		err := errors.New("Unexpected HTTP Response")
		LogError(err, "Error adding label, got %d", resp.StatusCode)
		return err
	}

	return nil
}

func (g *GitHub) addLabelToIssue(label, owner, name string, number int) error {
	// No GraphQL yet: https://platform.github.community/t/schema-request-create-issues-labels-milestones-etc/5355/6
	_, resp, err := g.V3.Issues.AddLabelsToIssue(
		context.Background(), owner, name, number, []string{label},
	)

	if err != nil {
		LogError(err, "Error adding label")
		return err
	}

	if resp.StatusCode != 200 {
		err := errors.New("Unexpected HTTP Response")
		LogError(err, "Error adding label, got %d", resp.StatusCode)
		return err
	}

	return nil
}

// AddIssue adds an issue to an existing repository
func (g *GitHub) AddIssue(title, body string, project Project) (Issue, error) {

	issueRequest := &github.IssueRequest{
		Title: github.String(title),
		Body:  github.String(body),
	}

	issue, resp, err := g.V3.Issues.Create(context.Background(), project.Organization, project.RepositoryName, issueRequest)
	if err != nil {
		LogError(err, "Error creating issue")
		return Issue{}, err
	}

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		err := errors.New("Unexpected HTTP Response")
		LogError(err, "Error creating issue, got %d", resp.StatusCode)
		return Issue{}, err
	}

	return Issue{
		ID:             *issue.NodeID,
		Number:         *issue.Number,
		Title:          *issue.Title,
		Body:           *issue.Body,
		Author:         *issue.User.Login,
		URL:            *issue.URL,
		PublishedAt:    *issue.CreatedAt,
		UpdatedAt:      *issue.CreatedAt,
		Organization:   project.Organization,
		RepositoryName: project.RepositoryName,
	}, nil

}

// UpdateTopics override the existing topics of a repository
func (g *GitHub) UpdateTopics(topics []string, project Project) error {
	var mutation struct {
		UpdateTopics struct {
			ClientMutationID string
		} `graphql:"updateTopics(input: $input)"`
	}

	input := githubv4.UpdateTopicsInput{RepositoryID: project.ID}

	for _, topic := range topics {
		input.TopicNames = append(input.TopicNames, githubv4.String(topic))
	}

	if err := g.V4.Mutate(context.Background(), &mutation, input, nil); err != nil {
		LogError(err, "Error updating topics")
		return err
	}

	return nil
}

// DeleteAllWebHooks retrieves and deletes all webhooks for the project
func (g *GitHub) DeleteAllWebHooks(project Project) error {
	ops := github.ListOptions{PerPage: 50}
	hooks, _, err := g.V3.Repositories.ListHooks(context.Background(), project.Organization, project.RepositoryName, &ops)
	if err != nil {
		LogError(err, "Error listing hooks")
		return err
	}

	for _, hook := range hooks {
		if _, err := g.V3.Repositories.DeleteHook(context.Background(), project.Organization, project.RepositoryName, *hook.ID); err != nil {
			LogError(err, "Error removing hook %d", *hook.ID)
			return err
		}
	}

	return nil
}

// ArchiveRepository patches the repo and archives it
func (g *GitHub) ArchiveRepository(project Project) error {
	if project.IsArchived {
		return nil
	}

	repo := github.Repository{
		Archived: github.Bool(true),
	}

	if _, _, err := g.V3.Repositories.Edit(context.Background(), project.Organization, project.RepositoryName, &repo); err != nil {
		LogError(err, "Error archiving repository %s", project.RepositoryName)
		return err
	}

	return nil
}

// Transfer moves the repository to another organization
func (g *GitHub) Transfer(project Project, organization string) error {
	if project.Organization == organization {
		return nil
	}

	transfer := github.TransferRequest{
		NewOwner: organization,
	}

	if _, _, err := g.V3.Repositories.Transfer(context.Background(), project.Organization, project.RepositoryName, transfer); err != nil {
		LogError(err, "Error transfering repository %s", project.RepositoryName)
		return err
	}

	return nil
}

// GetGitHubAuthToken returns the authentication token if found, if not, it exist the
// app.
func GetGitHubAuthToken() string {
	token := os.Getenv(gitHubAuthvar)
	if token == "" {
		Log("Please export $%s with a personal token and try again. Exiting", gitHubAuthvar)
		os.Exit(1)
	}
	return token
}
