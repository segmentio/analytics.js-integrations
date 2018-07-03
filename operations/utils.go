package operations

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path"
	"text/template"

	"github.com/blang/semver"
)

// Verbose prints some extra info
var Verbose = false

// Output prints the message to stdout
func Output(format string, args ...interface{}) {
	fmt.Fprintf(os.Stdout, format+"\n", args...)
}

// Log prints the message to stderr
func Log(format string, args ...interface{}) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
}

// LogError prints the error and a message to stderr
func LogError(err error, format string, args ...interface{}) {
	a := append(args, err.Error())
	fmt.Fprintf(os.Stderr, format+": %s\n", a...)
}

// Debug prints a message if the Verbose flag is set
func Debug(format string, args ...interface{}) {
	if Verbose {
		Log(format, args...)
	}
}

// copyFiles copies all the files/directories into
// the destination folder.
func copyFiles(src, dst string, ignorePaths map[string]bool) error {
	Debug("Copying %s into %s", src, dst)

	if err := makeDir(dst); err != nil {
		LogError(err, "Error creating destination folder")
		return err
	}

	files, err := ioutil.ReadDir(src)
	if err != nil {
		LogError(err, "Error reading files of %s", src)
		return err
	}

	for _, entry := range files {
		name := entry.Name()
		if ignorePaths[name] {
			continue
		}

		if err := copy(path.Join(src, name), path.Join(dst, name)); err != nil {
			LogError(err, "Error copying %s", name)
			return err
		}
	}

	return nil
}

// copy copies the file/directory to a different directory
// Golang, why don't you have this in the standard library?
func copy(src, dst string) error {
	Debug("Copying %s into %s", src, dst)
	cmd := exec.Command("cp", "-r", src, dst)
	if Verbose {
		cmd.Stderr = os.Stderr
		cmd.Stdout = os.Stdout
	}
	return cmd.Run()
}

// makeDir creates the full path for the integration
func makeDir(dir string) error {
	Debug("Creating %s", dir)
	return exec.Command("mkdir", "-p", dir).Run()
}

func executeTemplate(tmpl *template.Template, data interface{}) string {
	buffer := new(bytes.Buffer)

	if err := tmpl.Execute(buffer, data); err != nil {
		panic(err)
	}

	return buffer.String()
}

func fileExists(file string) (bool, error) {
	if _, err := os.Stat(file); err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		LogError(err, "Error reading file")
		return false, err

	}

	return true, nil
}

func writeFileWithTemplate(filename string, tmpl *template.Template, data interface{}) error {
	if err := ioutil.WriteFile(filename, []byte(executeTemplate(tmpl, data)), 0644); err != nil {
		LogError(err, "Error writing file")
		return err
	}

	return nil
}

// CompareSemanticVersion returns -1, 0 or 1 if the version is older, the
// same or newer than the other.
// See https://godoc.org/github.com/blang/semver#Version.Compare
func CompareSemanticVersion(version, other string) (int, error) {
	v, err := semver.Parse(version)
	if err != nil {
		LogError(err, "Error parsing %s", version)
		return 0, err
	}

	o, err := semver.Parse(other)
	if err != nil {
		LogError(err, "Error parsing %s", other)
		return 0, err
	}

	return v.Compare(o), nil
}
