#!/bin/bash

set -euf -o pipefail
DIR_SCRIPTS=$(cd -P -- "$(dirname -- "$0")" && pwd -P)  # https://stackoverflow.com/a/17744637
DIR_ROOT="${DIR_SCRIPTS}/.."
cd $DIR_ROOT

SDK_VERSION=3.1.18
ARCH=64bit

if [ ! -e ./vendor/emsdk-portable/clang/e${SDK_VERSION}_${ARCH}/clang ]; then
	./vendor/emsdk-portable/emsdk update
	./vendor/emsdk-portable/emsdk install sdk-$SDK_VERSION-$ARCH
fi

./vendor/emsdk-portable/emsdk activate sdk-$SDK_VERSION-$ARCH

source ./vendor/emsdk-portable/emsdk_env.sh

emcc -o src/libtimidity.js \
	-O3 \
	--memory-init-file 0 \
	./vendor/libtimidity/src/common.c \
	./vendor/libtimidity/src/instrum.c \
	./vendor/libtimidity/src/mix.c \
	./vendor/libtimidity/src/output.c \
	./vendor/libtimidity/src/playmidi.c \
	./vendor/libtimidity/src/readmidi.c \
	./vendor/libtimidity/src/resample.c \
	./vendor/libtimidity/src/stream.c \
	./vendor/libtimidity/src/tables.c \
	./vendor/libtimidity/src/timidity.c \
	-s EXPORTED_FUNCTIONS=@vendor/libtimidityjs-exports.json \
	-s MODULARIZE=1 \
	-s 'EXPORT_NAME='\''Libtimidity'\''' \
	-s 'EXTRA_EXPORTED_RUNTIME_METHODS=['\''FS'\'']'
