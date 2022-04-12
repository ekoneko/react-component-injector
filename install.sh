#!/usr/bin/env bash

rm -f node_modules/react-component-injector node_modules/react-component-injector-loader
ln -s ../react-component-injector node_modules/react-component-injector
ln -s ../react-component-injector-loader node_modules/react-component-injector-loader
./node_modules/.bin/tsc -p react-component-injector
./node_modules/.bin/tsc -p react-component-injector-loader