# Usage Guide — Phase 2: ESM Migration

## Quick Start

ESM化された全ソースファイルは従来通り2つの方法で動作します:

### 1. 開発モード（HTMLファイル直接開き）
```bash
# ブラウザでHTMLファイルを直接開く（従来通り）
open Sources/ArenaSimulator.html
```
`create_tests.sh` が import/export 行をフィルタして結合するため、既存の動作に影響なし。

### 2. ビルドモード
```bash
# 7つのシミュレーター用JSファイルを dist/ に生成
npm run build

# 圧縮版
npm run build:minify

# デプロイ（圧縮 + trunk へコピー）
npm run deploy
```

### 3. テスト
```bash
# 全テスト + ESLint
./run_tests.sh

# カテゴリ別テスト
./run_tests.sh skill    # スキル回帰テスト
./run_tests.sh combat   # 戦闘テスト
./run_tests.sh dsl      # DSLノードテスト
./run_tests.sh infra    # インフラテスト
```

### 4. ESM検証
```bash
# TDZエラー検証 + カバレッジチェック
npm run validate:esm

# 個別実行
node scripts/validate-esm.mjs           # エントリポイントのTDZ検証
node scripts/validate-esm-circular.mjs  # 循環依存の検証
node scripts/check-esm-coverage.mjs     # import/exportカバレッジ
```

## What Was Built

### Phase 2 で追加・変更されたファイル

**ビルドインフラ:**
- `scripts/build.mjs` — import/export フィルタ付きビルドスクリプト（Section 01で追加）
- `create_tests.sh` — テスト用結合スクリプト（import/export除去フィルタ追加）

**ESM検証:**
- `scripts/validate-esm.mjs` — ネイティブESM TDZ検証
- `scripts/validate-esm-circular.mjs` — Unit↔DamageCalculator循環依存検証
- `scripts/check-esm-coverage.mjs` — 全ソースのESMカバレッジ確認
- `Tests/EsmValidation.test.js` — ESM検証のJestテスト（5件）
- `Tests/BuildFilter.test.js` — import/exportフィルタのテスト（5件）

**ESM化されたソースファイル（全61ファイル）:**
各ファイルに `import` / `export` 文を追加。結合モードでは自動除去される。

## Architecture Notes

### Import/Export フィルタパイプライン
```
Sources/*.js (import/export付き)
    ↓ create_tests.sh（grep -v でフィルタ）
    All.test.js（結合 → Jest実行）

Sources/*.js (import/export付き)
    ↓ build.mjs（filterImportExport()）
    dist/*.js（結合 → デプロイ）
```

### 循環依存の解消
`Unit.js` ↔ `DamageCalculator.js` の循環依存は Section 07 で解消済み。
`validate-esm-circular.mjs` で継続的に検証可能。

## Adding New Source Files

新しいソースファイルを追加する場合:
1. `Sources/NewFile.js` を作成（import/export文を含める）
2. `create_tests.sh` の `SOURCE_FILE_NAMES` に追加
3. `scripts/build.mjs` の該当ビルド定義に追加
4. `scripts/check-esm-coverage.mjs` のファイルリストに追加
