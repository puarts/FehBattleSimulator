#!/usr/bin/env bash

./create_tests.sh

TARGET_FILE=All.test.js
CONFIG=jest.config.js
npx jest $TARGET_FILE -c ../$CONFIG --silent=false --verbose false
rm $TARGET_FILE
