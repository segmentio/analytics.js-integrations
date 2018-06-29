#!/bin/bash

# Run with admin privileges

DIST_URL="https://github.com/libgit2/libgit2/archive/v0.27.2.tar.gz" 

if [ $(which cmake) == "" ]; then {
    echo cmake not found
    exit 1
} fi;

set -e

mkdir -p libgit2/build
cd libgit2
wget -qO - $DIST_URL | sudo tar -zxf - --strip-components 1
cd build
cmake ..
cmake --build .
pkg-config libgit2.pc 
make install
ldconfig
