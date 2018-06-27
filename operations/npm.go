package operations

import (
	"bytes"
	"errors"
	"os/exec"
	"strings"
)

// ErrPackageNotFound returned by NPM when the package is not found
// in the registry
var ErrPackageNotFound = errors.New("not found")

// Look away, I'm hideous! - KramerNPM
type NPM struct {
}

// GetLatestVersion returns the latest version uploaded to NPM
func (n *NPM) GetLatestVersion(pack string) (string, error) {
	cmd := exec.Command("npm", "view", pack, "dist-tags.latest")

	buff := &bytes.Buffer{}
	cmd.Stdout = buff

	if err := cmd.Run(); err != nil {
		if e, ok := err.(*exec.ExitError); ok {
			if strings.Contains(string(e.Stderr), "404") {
				return "", ErrPackageNotFound
			}
		}
		return "", err
	}

	return strings.Replace(buff.String(), "\n", "", -1), nil
}
