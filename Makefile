ESLINT := node_modules/.bin/eslint
KARMA := node_modules/.bin/karma
OPERATIONS := $(wildcard operations/cmd/*)
BINS := $(addprefix bin/,$(notdir $(OPERATIONS)))

##
# Program options/flags
##

# A list of options to pass to Karma
# Overriding this overwrites all options specified in this file (e.g. BROWSERS)
KARMA_FLAGS ?=

# A list of Karma browser launchers to run
# http://karma-runner.github.io/0.13/config/browsers.html
BROWSERS ?=
ifdef BROWSERS
KARMA_FLAGS += --browsers $(BROWSERS)
endif

ifdef CI
KARMA_CONF ?= karma.conf.ci.js
else
KARMA_CONF ?= karma.conf.js
endif

# Mocha flags.
GREP ?= .

# Install node modules.
node_modules: package.json $(wildcard node_modules/*/package.json)
	yarn install
	touch $@

# Install dependencies.
install: node_modules

# Remove temporary files and build artifacts.
clean:
	rm -rf *.log coverage
	rm -f bin/*
.PHONY: clean

# Remove temporary files, build artifacts, and vendor dependencies.
distclean: clean
	rm -rf node_modules
.PHONY: distclean

# Lint JavaScript source files.
lint: install
	$(ESLINT) integrations/**/lib/ integrations/**/test/ integrations/**/karma*.js
.PHONY: lint

# Attempt to fix linting errors.
fmt: install
	$(ESLINT) --fix integrations/**/lib/ integrations/**/test/ integrations/**/karma*.js
.PHONY: fmt

# Run browser unit tests in a browser.
test: test-updated
test-updated: install
	export INTEGRATIONS="$(shell bin/list-updated-integrations)"
	$(KARMA) start $(KARMA_FLAGS) $(KARMA_CONF) --single-run;

test-all: install
	@echo WARNING: Testing all integrations. Sit down and relax
	$(KARMA) start $(KARMA_FLAGS) $(KARMA_CONF) --single-run;

.PHONY: test test-updated test-all

# Publish updated integrations
publish:
	@for integration in $(shell bin/list-new-releases); do \
		npm publish integrations/$$integration; \
	done

.PHONY: publish

# Operations
build-operations: $(BINS)

bin/%: operations/cmd/%/main.go
	govendor build -o $@ $<
	
.PHONY: build-operations
