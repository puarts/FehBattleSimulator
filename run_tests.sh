#!/usr/bin/env bash

CATEGORIES="skill combat dsl infra golden coverage"
CATEGORY=""

# 第1引数がカテゴリ名かチェック
for c in $CATEGORIES; do
  if [ "$1" = "$c" ]; then
    CATEGORY="$1"
    shift  # カテゴリ引数を消費
    break
  fi
done

# create_tests.sh にカテゴリを渡す
./create_tests.sh "$CATEGORY"

TARGET_FILE=All.test.js

if [ -n "$CATEGORY" ] || [ $# -gt 0 ]; then
  # カテゴリ指定時またはJest引数ありの場合: ESLintスキップ
  npm run test:only -- "$@"
else
  # 引数なし: 従来の npm test (jest + eslint)
  npm test
fi

EXIT_CODE=$?
rm "$TARGET_FILE"
exit $EXIT_CODE
