.DEFAULT_GOAL := build-image

# Operations
build-operations: $(addprefix bin/,$(notdir $(wildcard ../operations/cmd/*)))

clean:
	rm -f bin/*

bin/%: ../operations/cmd/%/main.go
	govendor build -o $@ $<
	
build-image: build-operations
	docker build -t 528451384384.dkr.ecr.us-west-2.amazonaws.com/analytics.js-integrations-ci .
push-image: build-image
	docker push 528451384384.dkr.ecr.us-west-2.amazonaws.com/analytics.js-integrations-ci

.PHONY: clean docker build-operations
