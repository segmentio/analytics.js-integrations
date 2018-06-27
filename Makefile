ESLINT := node_modules/.bin/eslint
KARMA := node_modules/.bin/karma
CODECOV := node_modules/.bin/codecov
OPERATIONS := $(wildcard operations/cmd/*)
BINS := $(addprefix bin/,$(notdir $(OPERATIONS)))

export PATH := bin:$(PATH)

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

ifndef CI
	OPERATIONS_PREFIX := bin/
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

coverage:
	$(CODECOV)
.PHONY: coverage

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

# If we are in master, compare with the previous commit instead
ifeq ($(shell git rev-parse --abbrev-ref HEAD),master)
	$(eval export INTEGRATIONS := $(shell $(OPERATIONS_PREFIX)list-updated-integrations --commit=$(shell git rev-parse --verify HEAD~)))
else
	$(eval export INTEGRATIONS := $(shell $(OPERATIONS_PREFIX)list-updated-integrations))
endif

	$(KARMA) start $(KARMA_FLAGS) $(KARMA_CONF) --single-run;

test-all: install
	$(KARMA) start $(KARMA_FLAGS) $(KARMA_CONF) --single-run;

.PHONY: test test-updated test-all

# Publish updated integrations
publish:
	@for integration in $(shell $(OPERATIONS_PREFIX)list-new-releases); do \
		npm publish integrations/$$integration; \
	done

.PHONY: publish

# Operations
build-operations: $(BINS)

bin/%: operations/cmd/%/main.go
	govendor build -o $@ $<
	
docker-operations: build-operations
	docker build -f operations/ci/Dockerfile -t 528451384384.dkr.ecr.us-west-2.amazonaws.com/analytics.js-integrations-ci .
	docker push 528451384384.dkr.ecr.us-west-2.amazonaws.com/analytics.js-integrations-ciz

.PHONY: docker-operations build-operations
