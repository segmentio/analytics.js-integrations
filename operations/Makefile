
CMDS := $(wildcard cmd/*)
BINS := $(addprefix bin/,$(notdir $(CMDS)))

bin/%: cmd/%/main.go
	govendor build -o $@ $<

build: $(BINS)

clean:
	rm -rf bin/*

.PHONY: build clean
