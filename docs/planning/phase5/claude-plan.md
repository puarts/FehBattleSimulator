# Section 12: vitest.setup.js 連結方式廃止 — 実装計画

## 概要

このプランは FEH Battle Simulator のテスト基盤から、レガシーの `vm.runInThisContext` 連結実行方式を完全に廃止し、全テストファイルをESM importのみで動作させるための実装手順を定義する。

### 背景

プロジェクトのテスト基盤では、歴史的に `vitest.setup.js` が33個以上のソースファイルを `fs.readFileSync` で読み込み、import/export文をストリップした上で `vm.runInThisContext()` でグローバルスコープに連結実行していた。Phase 5のSection 01〜11で以下が達成済み:

- 循環依存の完全解消（madge検証0件）
- 全ソースファイルへのESM export追加
- 52テストファイル中51ファイルのESM import化
- `Tests/TestGlobals.js` のESM化と依存注入パターンの導入

残るのは連結処理自体の削除と、`DamageCalculator.test.js` および `SkillEffect.test.js` の完全ESM化である。SkillEffect.test.js は Section 11 で「条件付き完了」とされたが、`g_testHeroDatabase`、`test_DamageCalculator`、`globalThis.g_appData` などの未移行参照が残っている。

### ESM/連結 二重世界問題

現在、`TestGlobals.js` が SkillImpl*.js をESM importする一方、`vitest.setup.js` が同じファイルを連結実行する。この結果、`SkillEffectNode` などのクラスが2つのコンテキストに別オブジェクトとして存在し、`instanceof` チェックの失敗や `TypeError: _targetNode.evaluate is not a function` が発生する。`DamageCalculator.test.js` は連結版グローバルを使用することでこの問題を回避しているが、連結方式を廃止すれば二重世界は自動解消される。

---

## Section A: vitest.setup.js の削除と vite.config.js の更新

### 目的

連結実行方式の完全廃止。ファイル自体を削除する。

### 現在の vitest.setup.js の構造

ファイルは以下の要素で構成されている:

1. **`SOURCE_FILE_NAMES` 配列** — 連結対象の33+αファイル名を定義
2. **`TEST_UTIL_FILE_NAMES` 配列** — `['TestGlobals']` を定義
3. **`filterImportExport(content)` 関数** — import/export文のストリップ処理
4. **メイン処理** — ファイル読み込み → フィルタ → `vm.Script` → `vm.runInThisContext()` → `initUnitSkillEffects(Unit)` の呼び出し

### 実装手順

#### A-1: vitest.setup.js の責務監査

削除前に、vitest.setup.js の全責務を最終監査する。以下を確認:

- 連結処理以外の処理（polyfill、グローバル変数初期化、console抑制、共通フック等）が含まれていないか
- 意図せず混入した非連結処理がないか

監査結果はコミットメッセージまたはPR説明に記録する。

#### A-2: filterImportExport() の退避

ユーザーは `filterImportExport()` 関数を残すことを要望している。vitest.setup.js を削除する前に、この関数を `Tests/legacy/filterImportExport.js` に退避する。

- **退避先: `Tests/legacy/filterImportExport.js`** — テスト基盤のレガシーユーティリティとして隔離。`Sources/` には配置しない（プロダクションコードへの混入を防ぐため）
- 関数のシグネチャと動作はそのまま維持
- JSDocコメントで「旧vitest.setup.jsの連結方式で使用されていた関数。Phase 5 Section 12で連結廃止後に退避」と記録
- export を付けて将来の参照を可能にする

#### A-3: vitest.setup.js の削除

ファイルごと削除する。A-1の責務監査で非連結処理が発見された場合は、適切な場所に移動してから削除する。

#### A-4: vite.config.js から setupFiles を除去

`test` セクションの `setupFiles: ['./vitest.setup.js']` 行を削除する。`globals: true`, `environment: 'jsdom'`, `pool: 'threads'`, `singleThread: true` 等の設定はそのまま維持。

### 判断根拠

- vitest.setup.js には連結処理以外の機能がない（A-1で最終確認）
- jsdom環境設定は vite.config.js の `environment: 'jsdom'` で完結している
- `globals: true` によりVitestの `describe/test/expect` は自動的にグローバルに利用可能

---

## Section B: DamageCalculator.test.js のESM化

### 目的

唯一の未ESM化テストファイルを、他の51テストファイルと同じESM importパターンに移行する。

### 現在の状態

ファイルの先頭にはわずか2行のimportのみ:

```javascript
import { UnitGroupType } from '../Sources/UnitConstants.js';
import { PassiveA, PassiveC } from '../Sources/SkillConstants.js';
```

残りのシンボルは連結によるグローバルスコープから暗黙的に参照されている。

### 暗黙依存シンボル一覧

以下は DamageCalculator.test.js が連結グローバルから参照している主要シンボルと、ESM化後のimport元:

| シンボル | import元 | 種別 |
|---------|---------|------|
| `g_testHeroDatabase` | `Tests/TestGlobals.js` | named import (`import { g_testHeroDatabase } from './TestGlobals.js'`) |
| `test_DamageCalculator` | `Sources/TestUtilities.js` | named import |
| `test_calcDamage` | `Sources/TestUtilities.js` | named import |
| `test_createDefaultUnit` | `Sources/TestUtilities.js` | named import |
| `test_executeTest` | `Sources/TestUtilities.js` | named import |
| `Unit` | `Sources/Unit.js` | named import |

**注意:** この一覧は事前分析に基づく。実際のESM化時にはテスト実行で `ReferenceError: xxx is not defined` を検出し、機械的に不足importを追加する。

### 実装手順

#### B-1: 必要なimportの追加

他のESM化済みテストファイル（例: CombatFlow.test.js）と同じパターンを適用する。

**TestGlobals.js の import について:** TestGlobals.js は初期化責務（`g_testHeroDatabase` の生成、SkillImpl*.js のスキル登録、`initUnitSkillEffects(Unit)` の実行）を持つため、依存関係として必ず import する。ESM では import 文の見た目の位置ではなく依存グラフ全体の評価順で実行されるため、「最上部に書けば安全」とは限らないが、`g_testHeroDatabase` を named import で取得することで依存関係が明示される。

1. **TestGlobals.js からの named import** — `import { g_testHeroDatabase } from './TestGlobals.js'` で初期化と取得を同時に行う
2. **TestUtilities.js からの名前付きimport** — `test_DamageCalculator`, `test_calcDamage`, `test_createDefaultUnit`, `test_executeTest`
3. **Unit クラスのimport** — `Sources/Unit.js` から
4. **既存importの維持** — `UnitGroupType`, `PassiveA`, `PassiveC` はそのまま

#### B-2: 不要なコメントの削除

ファイル先頭にある「ESM/連結版ノード型混線のため連結版グローバルを使用する」旨のコメント（3〜5行目）を削除。連結廃止後はこのコメントの前提が消滅する。

#### B-3: グローバル参照の機械的検証

目視でのコード走査に頼らず、ツールベースで検証する:

1. ESM化した状態でテストを実行する
2. Vitest が出力する `ReferenceError: xxx is not defined` エラーに基づき、不足しているimportを機械的に追加する
3. 全てのReferenceErrorが解消されるまで繰り返す

### HeroBattleTest の重要性

`DamageCalculator_HeroBattleTest` は1391回の英雄別戦闘テストを実行する。このテストはスキル効果ノードの `instanceof` チェック、side-effect登録の完全性、`initUnitSkillEffects(Unit)` によるプロトタイプ拡張の全てに依存するため、ESM移行の成否を最も鋭敏に検出する。

---

## Section B2: SkillEffect.test.js の完全ESM化

### 目的

Section 11 で「条件付き完了」とされた SkillEffect.test.js の未移行参照を解消し、連結廃止後も正常に動作する状態にする。

### 現在の状態

SkillEffect.test.js には以下の未移行参照が残っている:

- `g_testHeroDatabase` — 連結グローバルから参照
- `test_DamageCalculator` — 連結グローバルから参照
- `globalThis.g_appData = ...` — グローバル状態への直接代入

### 実装手順

#### B2-1: 未移行参照の特定と import 追加

DamageCalculator.test.js と同様のアプローチで、不足している ESM import を追加する:

- `import { g_testHeroDatabase } from './TestGlobals.js'`
- `import { test_DamageCalculator } from '../Sources/TestUtilities.js'`
- その他、テスト実行で `ReferenceError` として検出されるシンボル

#### B2-2: globalThis.g_appData の対応

`globalThis.g_appData = ...` の使用を確認し、ESM の仕組みで代替可能な場合は import ベースに置換する。テスト固有の状態設定として必要な場合はそのまま維持する。

---

## Section C: 検証とデバッグ

### 目的

変更後のテスト全体の正常性を確認し、WARN: Non-TDZ ReferenceError 警告の解消を検証する。

### 検証方針

全ての変更は**1つの変更セット（コミット）として同時に適用する**（vitest.setup.js 削除 + vite.config.js 更新 + DamageCalculator.test.js ESM化）。ただし、**ローカルでの段階的な検証は推奨する**。中間状態でのコミットは行わないが、デバッグ目的の部分テストは積極的に活用する。

### ローカル検証手順（段階的）

#### C-1: DamageCalculator.test.js の単体検証

変更適用後、まず DamageCalculator.test.js のみを実行して基本的な動作を確認する。HeroBattleTest（1391回）のパスを最優先で確認。

#### C-2: 関連テストの検証

SkillEffect.test.js など、スキル効果ノードに依存するテストの動作確認。

#### C-3: 全体テスト実行

`npm run test:only` で全52テストファイルを実行。Performance.test.js の環境依存閾値超過は許容（連結とは無関係）。

**注意:** 全体実行時に単独実行では出なかった失敗が発生した場合、テスト間の状態汚染（State bleed）を疑う。ESMモジュールは全テスト間でシングルトンとなるため、あるテストでのミューテーションが次のテストに影響する可能性がある。

#### C-4: WARN: Non-TDZ ReferenceError の確認

テスト実行出力に `WARN: Non-TDZ ReferenceError` が含まれていないことを確認する。

**消えない場合の切り分け手順:**
1. vitest.setup.js が完全に削除されているか（setupFiles設定の残存含む）
2. TestGlobals.js / SkillImpl* / initUnitSkillEffects(Unit) の評価順序に問題がないか
3. 例外を握りつぶして warning にしている箇所の特定（grep で `Non-TDZ` や `ReferenceError` を検索）

#### C-5: 連結方式の完全廃止確認

- プロジェクト全体で `vm.runInThisContext` の使用がないことを grep で確認
- `DamageCalculator.test.js` に ESLint `no-undef` 違反がないことを確認

### HeroBattleTest 失敗時のデバッグガイド

失敗する場合は「ESM化の失敗」ではなく、以下の原因を疑う:

1. **ノード同一性依存** — ESM版とグローバル版でクラスオブジェクトが別になっていないか
2. **side-effect 登録順** — SkillImpl*.js の import 順序が期待通りか
3. **initUnitSkillEffects(Unit) の適用順** — TestGlobals.js での呼び出しが全ての SkillImpl import の後に実行されているか

---

## Section D: filterImportExport() の退避

### 目的

vitest.setup.js 削除に伴い消滅する `filterImportExport()` 関数を、ユーザー要望に従い別ファイルに退避する。

### 退避先

**`Tests/legacy/filterImportExport.js`**

- テスト基盤のレガシーユーティリティとして `Tests/legacy/` ディレクトリに隔離
- `Sources/` には配置しない（プロダクションコードへの混入防止、本番バンドルへの紛れ込み防止）
- export 付きで退避し、JSDocコメントで経緯を記録

### 判断根拠

- 現時点でこの関数の利用箇所は vitest.setup.js のみ
- 連結廃止後に直接的な用途はないが、ユーザーが「残す」と回答
- 将来のデバッグツールやマイグレーションユーティリティとして参照される可能性
- `Tests/legacy/` に隔離することで、プロダクションコードとの境界を明確にする

---

## 変更対象ファイルまとめ

| ファイル | 変更内容 |
|---------|---------|
| `vitest.setup.js` | 削除 |
| `vite.config.js` | `setupFiles` 行を削除 |
| `Tests/DamageCalculator.test.js` | ESM importを追加、不要コメント削除 |
| `Tests/SkillEffect.test.js` | 未移行参照をESM importに置換 |
| `Tests/legacy/filterImportExport.js` | 新規作成、`filterImportExport()` を退避 |

## 成功基準

1. `vitest.setup.js` が削除されている
2. `vite.config.js` から `setupFiles` 設定が除去されている
3. `filterImportExport()` が `Tests/legacy/filterImportExport.js` に退避されている
4. `DamageCalculator.test.js` がESM importのみで動作する（未定義グローバル参照がない）
5. `SkillEffect.test.js` の未移行参照が全てESM importに置換されている
6. `npm run test:only` で全テストが通過する（Performance.test.jsの環境依存閾値を除く）
7. `WARN: Non-TDZ ReferenceError` 警告が出ない
8. `DamageCalculator_HeroBattleTest`（1391回の全英雄戦闘テスト）がパスする
9. プロジェクト内に `vm.runInThisContext` の使用がないことが grep で確認されている
