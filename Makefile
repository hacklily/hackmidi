.PHONY: help clean_libtimidity_js clean_tr clean build_libtimidity_js build_ts build

help:
	@echo Usage:
	@echo "    make build"
	@echo "    make clean"
	@echo "The documentation is built separately:"
	@echo "    cd docs-src # ... then"
	@echo "    yarn serve"
	@echo "    yarn build"

clean_libtimidity_js:
	git clean -xffd ./vendor/emsdk-portable
	rm -f ./libtimidity-js/libtimidity.js

clean_ts:
	rm -f lib/*


clean: clean_libtimidity_js clean_tr

build_libtimidity_js:
	./scripts/build-libtimidity.sh

build_ts:
	yarn
	rm -f lib/*
	cp ./src/*js ./lib
	./node_modules/.bin/tsc

build:
	make build_libtimidity_js
	make build_ts
