# Code Review Interview: Section 03 - Strict Mode準拠化

## Triage Summary

### Asked User (real tradeoff)
- **sourceType: "module" での strict/no-implicit-globals の実効性**: `sourceType: "module"` のままでは `strict` と `no-implicit-globals` ルールが実質no-opとなる問題
  - **検証結果**: `sourceType: "script"` で確認し、3583件の違反を検出。内訳は `strict`（use strict未追加）3219件、`no-implicit-globals`（トップレベル関数宣言）364件。実際に危険なStrict Mode違反（8進数、with文、delete var等）は0件。
  - **ユーザー判断**: `strict` と `no-implicit-globals` を削除し、実効性のある4ルール（no-octal, no-octal-escape, no-with, no-delete-var）のみ常設とする。理由: 検査しているつもりになるルールより、実際に効くルールだけに絞る方がレビューでも説明しやすい。

### Auto-fix (applied)
- なし

### Let Go (nitpicks)
- **Missing newline at end of file**: 些末な問題のため対応しない
- **Missing env.jest in Tests config**: 既存テストが問題なく動作しており、本セクションのスコープ外
- **no-octal等がeslint:recommendedと重複**: 明示化することでCI意図を文書化する価値がある

## Applied Changes
1. `Sources/.eslintrc.json`: `strict` と `no-implicit-globals` ルールを削除、4ルールのみ残す
2. `Tests/.eslintrc.json`: 同上

## Verification
- `npm test`: 310 tests passed, ESLint clean
- `sourceType: "script"` での一次検証で危険なStrict Mode違反が0件であることを確認済み
