# Code Review Interview: Section 01

## Auto-fixes Applied

- **#1 終了コード保持**: `run_tests.sh` でnpmの終了コードを `EXIT_CODE=$?` で保持し `exit $EXIT_CODE` で伝播するよう修正
- **#2 変数クォート**: `$CATEGORY` → `"$CATEGORY"`, `$TARGET_FILE` → `"$TARGET_FILE"` にクォート
- **#3 変数名 `cat` → `c`**: `cat` コマンドとの名前衝突を回避

## Let Go

- **#4 Placeholderテスト**: Jestが空テストスイートをエラーにするため必要。実テスト追加時に削除予定
- **#6 不明カテゴリのフォールバック**: `run_tests.sh` は不明引数をカテゴリとして認識しないため `CATEGORY=""` のまま。`create_tests.sh ""` は `*` にフォールし全テスト結合される。`run_tests.sh` では `$#` が残るため `test:only` で実行されるが、Jest側で不明引数はエラーになるため、ユーザーは気づく。完全なフォールバックよりもエラー通知の方が適切。
