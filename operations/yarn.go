package operations

import (
	"bytes"
	"encoding/json"
	"errors"
	"os/exec"
	"strings"
)

// ErrPackageNotFound returned by NPM when the package is not found
// in the registry
var ErrPackageNotFound = errors.New("not found")

// Look away, I'm hideous! - KramerYarn
type Yarn struct {
}

// NewYarnClient returns a new npm client
func NewYarnClient() *Yarn {
	return &Yarn{}
}

// GetLatestVersion returns the latest version uploaded to NPM
func (y *Yarn) GetLatestVersion(pack string) (string, error) {

	cmd := exec.Command("yarn", "info", pack, "dist-tags.latest", "--json")

	buff := &bytes.Buffer{}
	errBuff := &bytes.Buffer{}
	cmd.Stdout = buff
	cmd.Stderr = errBuff

	if err := cmd.Run(); err != nil {
		if _, ok := err.(*exec.ExitError); ok {
			if strings.Contains(buff.String(), "404") {
				return "", ErrPackageNotFound
			}
		}

		errOutput := errBuff.String()
		Debug("Output:\n%s", errOutput)

		if strings.Contains(errOutput, "404") || strings.Contains(errOutput, "Not found") {
			return "", ErrPackageNotFound
		}

		LogError(err, "Error running yarn for package %s", pack)

		return "", err
	}

	output := buff.String()

	var res struct {
		Type string
		Data string
	}

	if err := json.Unmarshal([]byte(output), &res); err != nil {
		LogError(err, "Error parsing output, expected json object \n%s", output)
		return "", err
	}

	return res.Data, nil
}
