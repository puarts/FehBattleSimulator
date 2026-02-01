#!/usr/bin/env bash

./create_tests.sh

TARGET_FILE=All.test.js

# 引数の数($#)が0より大きいかチェック
if [ $# -gt 0 ]; then
  # 引数がある場合: test:only に引数をそのまま渡す
  # "$@" を使うことで、スペースを含む引数(例: -t "closest")も正しく渡されます
  npm run test:only -- "$@"
else
  # 引数がない場合: 従来の npm test (jest + eslint) を実行
  npm test
fi

rm $TARGET_FILE
