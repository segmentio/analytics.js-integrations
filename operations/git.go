package operations

import (
	"os"
	"time"

	"gopkg.in/libgit2/git2go.v27"
)

// Tag is an annotated or lightweight tag
type Tag struct {
	Name        string
	When        time.Time
	IsAnnotated bool
	Tag         *git.Tag    // for annotated
	Commit      *git.Commit // for lightweight
}

// printMessage is the default "print" callback
func printMessage(msg string) git.ErrorCode {
	Debug("Message %s", msg)
	return git.ErrOk
}

// credentialsCallback returns the default credentials
func credentialsCallback(url, username string, t git.CredType) (git.ErrorCode, *git.Cred) {
	Debug("Credentials called, type %d (%s, %s)", t, url, username)
	ret, cred := git.NewCredUserpassPlaintext(GetGitHubAuthToken(), "x-oauth-basic")
	Debug("Credentials returned, errorCode %d, type %d, hasUsername %t", ret, cred.Type(), cred.HasUsername())
	return git.ErrOk, &cred
}

// clone clones the repo in the destination folder
func clone(url, dst string) (*git.Repository, error) {
	Debug("Cloning %s into %s", url, dst)

	options := &git.CloneOptions{
		FetchOptions: &git.FetchOptions{
			RemoteCallbacks: git.RemoteCallbacks{
				CredentialsCallback:      credentialsCallback,
				SidebandProgressCallback: printMessage,
			},
		},
	}

	repo, err := git.Clone(url, dst, options)
	if err != nil {
		LogError(err, "Error cloning repo")
		return nil, err
	}

	return repo, nil
}

// commitFiles adds the new files to the current index and commits them
// as the new HEAD
func commitFiles(repo *git.Repository, pathspec []string, msg string) (*git.Oid, error) {
	Debug("Commiting files")

	head, err := getLocalHead(repo)
	if err != nil {
		return nil, err
	}

	index, err := repo.Index()
	if err != nil {
		LogError(err, "Error creating new index")
		return nil, err
	}
	defer index.Free()

	var callback git.IndexMatchedPathCallback
	if Verbose {
		callback = func(path, match string) int {
			Log("File %s added to index (%s)", path, match)
			return 0
		}
	}

	if err := index.AddAll(pathspec, git.IndexAddDefault, callback); err != nil {
		LogError(err, "Error adding integration to the index")
		return nil, err
	}

	if err := index.Write(); err != nil {
		LogError(err, "Error writing index to disk")
		return nil, err
	}

	indexTree, err := index.WriteTree()
	if err != nil {
		LogError(err, "Error writing index tree")
		return nil, err
	}

	commitTree, err := repo.LookupTree(indexTree)
	if err != nil {
		LogError(err, "Error getting index tree")
		return nil, err
	}
	commitTree.Free()

	me, err := getSignature(repo)
	if err != nil {
		LogError(err, "Error getting signature")
		return nil, err
	}

	oid, err := repo.CreateCommit("HEAD", me, me, msg, commitTree, head)
	if err != nil {
		LogError(err, "Error creating commit")
		return nil, err
	}

	return oid, nil
}

// getLocalHead retrieves the head of the current local branch
func getLocalHead(repo *git.Repository) (*git.Commit, error) {
	Debug("Getting HEAD")

	// Get current branch's HEAD
	headReference, err := repo.Head()
	if err != nil {
		LogError(err, "Error getting HEAD")
		return nil, err
	}

	head, err := repo.LookupCommit(headReference.Target())
	if err != nil {
		LogError(err, "Error looking for HEAD commit")
		return nil, err
	}

	return head, nil
}

func GetLatestTag(repo *git.Repository) (*Tag, error) {
	return getLatestTag(repo)
}

// getLatestTag retrieves the last tag. In some situations this is not the latest tag
// in the master branch. If not tags are found, it will return nil.
// For lightweigh tags, it will return the empty struct with the name only.
func getLatestTag(repo *git.Repository) (*Tag, error) {

	tagNames, err := repo.Tags.List()
	if err != nil {
		LogError(err, "Error retrieving all tags")
		return nil, err
	}

	var latestTag *Tag

	for _, name := range tagNames {
		tag, err := resolveTag(repo, name)
		if err != nil {
			return nil, err
		}

		if latestTag == nil || latestTag.When.Before(tag.When) {
			latestTag = tag
		}
	}

	return latestTag, nil
}

// resolveTag retrieves the tag using the name
func resolveTag(repo *git.Repository, name string) (*Tag, error) {
	reference, err := repo.References.Lookup("refs/tags/" + name)
	if err != nil {
		LogError(err, "Error getting reference for tag %s", name)
		return nil, err
	}

	tag, err := repo.LookupTag(reference.Target())
	if err == nil {
		return &Tag{
			Name:        tag.Name(),
			When:        tag.Tagger().When,
			IsAnnotated: true,
			Tag:         tag,
		}, nil
	}

	// Lightweight tag or reference
	commit, err := repo.LookupCommit(reference.Target())
	if err != nil {
		LogError(err, "The tag %s is not an annotated tag or references a commit", name)
		return nil, err
	}

	return &Tag{
		Name:   name,
		When:   commit.Committer().When,
		Commit: commit,
	}, nil
}

// getSignature returns the default signature unless the env vars GITHUB_USER
// and GITHUB_EMAIL are present.
func getSignature(repo *git.Repository) (*git.Signature, error) {
	user := os.Getenv("GITHUB_USER")
	email := os.Getenv("GITHUB_EMAIL")

	if user == "" || email == "" {
		return repo.DefaultSignature()
	}

	return &git.Signature{
		Name:  user,
		Email: email,
		When:  time.Now(),
	}, nil
}

func doNothingForEachLine(line git.DiffLine) error {
	return nil
}

func doNothingForEachHunk(hunk git.DiffHunk) (git.DiffForEachLineCallback, error) {
	return doNothingForEachLine, nil
}

// resolveCommit returns the commit from the commit's OID or reference
func resolveCommit(id string, repo *git.Repository) (*git.Commit, error) {

	var oid *git.Oid
	var err error

	// OID
	oid, err = git.NewOid(id)
	if err != nil {
		// Ref
		var ref *git.Reference
		ref, err = repo.References.Lookup(id)
		if err != nil {
			LogError(err, "Can not resolve %s", id)
			return nil, err
		}

		oid = ref.Target()
	}

	return repo.LookupCommit(oid)

}
