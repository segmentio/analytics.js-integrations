
CMDS := $(wildcard cmd/*)
BINS := $(addprefix bin/,$(notdir $(CMDS)))

bin/%: cmd/%/main.go
	govendor build -o $@ $<

build: $(BINS)

clean:
	rm -r bin/*

.PHONY: build clean
