#!/usr/bin/env bash

./create_tests.sh

TARGET_FILE=All.test.js
npm test
rm $TARGET_FILE
