Now I have enough context. Let me produce the section content.

# Section 03: Strict Mode準拠化

## 概要

ESM（ECMAScript Modules）では Strict Mode が自動的に適用される。将来の ESM 移行に備えて、現在の約15万行のバニラ JavaScript コードベースを Strict Mode 互換にする。ESLint の静的解析ルールを使って違反を検出・修正する。

**重要な制約**: `create_tests.sh` でファイルを結合して単一の `All.test.js` を生成するテスト方式のため、個別ファイル先頭への `"use strict";` 追加は結合後に効かない箇所がある。したがって `"use strict";` ディレクティブの追加は ESM 化フェーズまで保留し、本セクションでは ESLint による静的検出と修正のみを行う。

## 依存関係

- **依存**: section-02-dependency-graph（依存グラフの構築が完了していること。ただし Strict Mode 修正自体は依存グラフ情報なしでも実行可能）
- **ブロック**: section-05-file-relocation（Strict Mode 準拠が完了してからファイル移動に進む）

## テスト方針

本セクションでは新規テストファイルは作成しない。既存テストスイート全体が回帰テストとして機能する。

### 検証基準

```
# Test: ESLint strictルール（no-implicit-globals, no-octal等）でエラーが0件
# Test: Strict Mode違反修正後、既存テスト16スイートがすべてパス
# Test: 修正後、本番7ページがブラウザで正常動作
```

### 検証手順

1. ESLint の strict 関連ルールを有効化し、違反を検出する（修正前の現状把握）
2. 違反を修正する
3. `./run_tests.sh` で全テスト（16スイート）がパスすることを確認
4. `npm test` で ESLint も含めてパスすることを確認
5. ブラウザで本番7ページ（AetherRaidSimulator, ArenaSimulator, SummonerDuelsSimulator, DamageCalculator, UnitBuilder, StatusCalculator, HeroIconLister）が正常に起動・動作することを手動確認

## 実装手順

### Step 1: ESLint 設定の更新（Strict Mode 関連ルール追加）

**対象ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/.eslintrc.json`

現在の ESLint 設定は `eslint:recommended` を継承しているが、`no-unused-vars` と `no-undef` が無効化されている。Strict Mode 関連のルールは明示的に有効化されていない。

以下のルールを `rules` セクションに追加する:

- **`strict`**: `["error", "safe"]` — Strict Mode 違反の検出。`"safe"` は sourceType に応じて動作を自動調整する
- **`no-octal`**: `"error"` — 8進数リテラル（`0777` 形式）の禁止（`eslint:recommended` で既に有効だが明示化）
- **`no-octal-escape`**: `"error"` — 8進エスケープシーケンスの禁止
- **`no-with`**: `"error"` — `with` 文の禁止（`eslint:recommended` で既に有効だが明示化）
- **`no-delete-var`**: `"error"` — `delete` による変数削除の禁止（`eslint:recommended` で既に有効だが明示化）
- **`no-implicit-globals`**: `"error"` — 暗黙的グローバル宣言の検出

**注意点**: 現在の `sourceType` が `"module"` に設定されている。この設定では `strict` ルールの `"safe"` モードは ESM として扱い、`"use strict"` 不要と判定する。`no-implicit-globals` も `sourceType: "module"` では `var` や `function` がモジュールスコープとなるため一部の検出が変わる。現在のコードベースは実際にはグローバルスコープで動作するスクリプトだが、ESLint の解析が既に `sourceType: "module"` で行われている環境を維持しつつ、追加ルールで Strict Mode 固有の構文違反を検出する。

`sourceType` を `"script"` に変更すると `no-implicit-globals` がより正確に暗黙グローバルを検出できるが、既存の ESLint パイプラインに影響する可能性がある。変更する場合は段階的に行い、まず現在の設定でルール追加 → 違反修正 → 必要に応じて `sourceType` 変更の順序で進める。

### Step 2: Strict Mode 違反の検出

ESLint を実行して違反箇所を一覧化する:

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
npx eslint ./Sources/ --format compact 2>&1 | head -100
```

出力から以下のカテゴリに分類する:

1. **8進数リテラル / 8進エスケープ** (`no-octal`, `no-octal-escape`)
2. **`with` 文** (`no-with`)
3. **変数の `delete`** (`no-delete-var`)
4. **暗黙的グローバル宣言** (`no-implicit-globals`)
5. **その他の Strict Mode 固有の問題**

### Step 3: 違反の修正

Strict Mode で禁止される主要パターンと修正方法:

| 違反パターン | 修正方法 |
|-------------|---------|
| `0777` (8進数リテラル) | `0o777` に変更 |
| `"\101"` (8進エスケープ) | `"\x41"` または `"A"` に変更 |
| `with (obj) { ... }` | 変数への分割代入またはプロパティ直接参照に変更 |
| `delete variable` | 変数を `undefined` に代入、または設計変更 |
| `arguments.callee` | 名前付き関数式に変更 |
| `eval()` 内の変数宣言が外部スコープに漏出 | 可能であれば `eval` を排除 |
| 暗黙のグローバル変数宣言（`var` なしの代入） | `let`/`const`/`var` を付加 |
| 重複パラメータ名 `function f(a, a)` | パラメータ名をユニークにする |

**修正の原則**:
- 動作の等価性を保つ（セマンティクスを変えない）
- 1カテゴリずつ修正してコミット（git bisect しやすくする）
- 各修正後にテスト実行

### Step 4: 修正後の検証

1. `npx eslint ./Sources/` で追加した Strict Mode 関連ルールのエラーが 0 件であることを確認
2. `./run_tests.sh` で全16テストスイートがパスすることを確認
3. ブラウザで本番7ページの起動・動作確認

### Step 5: ESLint 設定の確定

すべての違反が修正されたら、追加したルールを `"error"` レベルで確定する。これにより CI（GitHub Actions）で今後の Strict Mode 違反が自動検出される。

**最終的な `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/.eslintrc.json` の rules セクション** には、既存の `no-unused-vars: 0` と `no-undef: 0` に加えて、上記の Strict Mode 関連ルールが `"error"` レベルで追加された状態になる。

## 実施結果

### sourceType: "script" による一次検証

`sourceType: "script"` でESLintを実行し、3583件の違反を検出:
- `strict`（use strict未追加）: 3219件 → ESM化フェーズで自動解消（計画通り保留）
- `no-implicit-globals`（トップレベル関数宣言）: 364件 → ESM化で解消される既知事項
- **危険なStrict Mode違反（8進数リテラル、with文、delete var、arguments.callee等）: 0件**

### ESLint常設ルール

`sourceType: "module"` 環境では `strict` と `no-implicit-globals` が実質no-opとなるため、実効性のある4ルールのみ常設化:
- `no-octal`: 8進数リテラル禁止
- `no-octal-escape`: 8進エスケープ禁止
- `no-with`: with文禁止
- `no-delete-var`: delete変数禁止

### 計画からの変更点

- `strict` ルール: 削除（sourceType: "module" ではno-op。一次検証で危険な違反なしを確認済み）
- `no-implicit-globals` ルール: 削除（同上）
- ソースコード修正: 0件（危険なStrict Mode違反が存在しなかったため）

## 成果物

- 更新された `Sources/.eslintrc.json`（実効性のあるStrict Mode関連4ルール追加）
- 更新された `Tests/.eslintrc.json`（同上）
- CI で今後のStrict Mode違反が継続的に検出される状態
- sourceType: "script" での一次検証により危険な違反0件を確認

## 注意事項

- `"use strict";` ディレクティブ自体はこのセクションでは追加しない。ESM 化フェーズで自動適用される
- `no-undef` ルール（現在無効）は本セクションのスコープ外。グローバルシンボルの依存関係は section-01 / section-02 で別途管理する
- テスト側の ESLint 設定 (`/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/.eslintrc.json`) も必要に応じて同様のルールを追加するが、テストコードは Jest のグローバル API（`describe`, `expect` 等）を使用するため `env.jest: true` の設定確認も行う
- ESLint のバージョンは `^8.57.0`（ESLint 8 系）。ルール名や設定形式は ESLint 8 のドキュメントに準拠する