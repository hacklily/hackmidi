.PHONY: help clean_libtimidity_js clean_tr clean build_libtimidity_js build_ts build

help:
	@echo Usage:
	@echo "    make build"
	@echo "    make prettier"
	@echo "    make clean"
	@echo "Thre is also a devserver for the docs:"
	@echo "    cd docs-src # ... then"
	@echo "    npm run serve"

clean_libtimidity_js:
	git clean -xffd ./vendor/emsdk-portable
	rm -f ./libtimidity-js/libtimidity.js

clean_ts:
	rm -f lib/*


clean: clean_libtimidity_js clean_ts

build_libtimidity_js:
	./scripts/build-libtimidity.sh
	make prettier

build_ts:
	npm install
	rm -f lib/*
	cp ./src/libtimidity.* ./lib
	./node_modules/.bin/tsc

build_docs:
	rm -fr ./docs
	cd ./docs-src && npm install && npm run build
	mv ./docs-src/build ./docs

build:
	make build_libtimidity_js
	make build_ts
	make build_docs

prettier:
	./node_modules/.bin/prettier --write ./src ./docs-src
