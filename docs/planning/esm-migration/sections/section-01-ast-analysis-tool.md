Now I have all the context needed. Let me produce the section content.

# Section 01: AST解析ツール — グローバルシンボル抽出

## 概要

各JSファイルのトップレベル宣言（クラス、関数、変数）と未定義参照（外部シンボルへの依存）を抽出するカスタムAST解析スクリプトを作成する。既存ツール（`madge`等）はESM/CJS前提のためグローバルJSには使用できない。Acornパーサーを使用した独自スクリプトを構築し、ESLint `no-undef`による暗黙グローバル検出、および実行時グローバル差分の取得方法設計と組み合わせる。

**このセクションは他セクションへの依存なし。section-02（依存グラフ構築）がこのセクションの出力に依存する。**

## 出力仕様

各ファイルについて以下をJSON形式で出力する:

- **定義シンボル一覧** (`defines`): クラス定義、関数定義、`const`/`let`/`var`宣言（トップレベル）
- **参照シンボル一覧** (`references`): 他ファイルで定義されたクラス名、関数名、グローバル変数（`g_`プレフィクス等）
- **副作用分類** (`sideEffectCategory`): ファイルロード時に実行されるコードのカテゴリ
  - `pure-definition` — クラス/関数/定数の定義のみ（g_プレフィクスなし）
  - `global-constant` — g_/G_プレフィクスのリテラル定数（文字列連結等の定数式を含む）
  - `global-mutable-state` — let/varのg_変数でnull/false/空文字等のプレースホルダー初期化
  - `global-assignment` — g_変数への実行時初期化（new式、関数呼び出し等）
  - `registry-provider` — グローバルレジストリへの登録（例: `Vue.component()`、`SkillEffectRegistrar`への登録）
  - `prototype-extension` — `Object.assign`によるprototype拡張（Mixinパターン）
  - `initialization-root` — 他の副作用に依存する初期化処理

出力例:
```json
{
  "file": "Sources/GlobalDefinitions.js",
  "defines": ["g_siteRootPath", "g_imageRootPath", "TurnSettingCookiePrefix", ...],
  "references": [],
  "sideEffectCategory": "global-constant"
}
```

## 対象ファイル

`Sources/`ディレクトリ内の全64個のJSファイル。`create_tests.sh`の`SOURCE_FILE_NAMES`に含まれる44ファイルだけでなく、`Main`系（`AetherRaidSimulatorMain.js`等）や`AppData.js`、`VueComponents.js`など結合対象外のファイルも含む。

## テスト

### テストファイルの配置

テストは `Tools/tests/analyze-globals.test.js` に配置する（Toolsディレクトリ配下に独自のテスト基盤を構築）。既存のJest設定（`create_tests.sh`による結合方式）とは別に、Toolsディレクトリ用のJest設定を追加するか、あるいはプロジェクトルートのJest設定に`testPathPattern`を追加する。

### テストスタブ

```
Test: AST解析スクリプトがクラス定義を正しく抽出する
  - 入力: `class Foo {}` を含むJSテキスト
  - 期待: defines に "Foo" が含まれる

Test: AST解析スクリプトが関数定義を正しく抽出する
  - 入力: `function bar() {}` を含むJSテキスト
  - 期待: defines に "bar" が含まれる

Test: AST解析スクリプトがconst/let/var宣言を正しく抽出する
  - 入力: `const X = 1; let y = 2; var z = 3;` を含むJSテキスト
  - 期待: defines に "X", "y", "z" が含まれる

Test: AST解析スクリプトがグローバル変数参照を正しく検出する
  - 入力: `class Bar extends Foo { constructor() { super(); g_appData.init(); } }` を含むJSテキスト
  - 期待: references に "Foo", "g_appData" が含まれる
  - 期待: defines に "Bar" が含まれる

Test: AST解析スクリプトがトップレベル副作用を分類できる — pure-definition
  - 入力: クラス定義と関数定義のみを含むJSテキスト
  - 期待: sideEffectCategory が "pure-definition"

Test: AST解析スクリプトがトップレベル副作用を分類できる — global-assignment
  - 入力: `const g_appData = new AppData();` のようなグローバル変数への代入を含むJSテキスト
  - 期待: sideEffectCategory が "global-assignment"

Test: AST解析スクリプトがトップレベル副作用を分類できる — registry-provider
  - 入力: `SkillEffectRegistrar.register(...)` のようなレジストリ登録呼び出しを含むJSテキスト
  - 期待: sideEffectCategory が "registry-provider"

Test: AST解析スクリプトがトップレベル副作用を分類できる — prototype-extension
  - 入力: `Object.assign(Foo.prototype, { method() {} })` を含むJSテキスト
  - 期待: sideEffectCategory が "prototype-extension"

Test: 結果JSONの形式が正しい
  - 入力: 実際のソースファイル（Sources/GlobalDefinitions.js）
  - 期待: defines が配列、references が配列、sideEffectCategory が有効な文字列
  - 期待: defines に "g_siteRootPath" が含まれる

Test: 組み込みグローバル（window, document, console, Math等）は参照に含まれない
  - 入力: `console.log(Math.max(1, 2)); document.getElementById("x");` を含むJSテキスト
  - 期待: references に "console", "Math", "document" が含まれない
```

## 実装詳細

### 1. 依存パッケージの追加

`acorn`パーサーをdevDependenciesに追加する。`acorn-walk`（ASTウォーカー）も併用する。

```
npm install --save-dev acorn acorn-walk
```

### 2. スクリプトの配置

```
Tools/
  analyze-globals.js      # メインスクリプト（CLIエントリポイント）
  lib/
    ast-extractor.js      # AST解析ロジック（テスト対象の核）
    side-effect-classifier.js  # 副作用分類ロジック
  tests/
    analyze-globals.test.js    # テスト
```

### 3. ast-extractor.js の設計

Acornでパースし、トップレベルASTノードを走査する。

**定義シンボル抽出ロジック:**
- `ClassDeclaration` → `node.id.name`
- `FunctionDeclaration` → `node.id.name`
- `VariableDeclaration`（トップレベル） → 各`declarator.id.name`
- ネストされたスコープ内の宣言は除外する

**参照シンボル抽出ロジック:**
- `acorn-walk`で全`Identifier`ノードを走査
- ローカルスコープで定義された変数を除外（スコープチェーンの追跡が必要）
- トップレベルで定義されたシンボルを除外
- ブラウザ組み込みグローバル（`window`, `document`, `console`, `Math`, `JSON`, `Promise`, `Array`, `Object`, `String`, `Number`, `Boolean`, `Map`, `Set`, `WeakMap`, `WeakSet`, `Symbol`, `Proxy`, `Reflect`, `Error`, `TypeError`, `parseInt`, `parseFloat`, `isNaN`, `undefined`, `null`, `NaN`, `Infinity`, `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `fetch`, `alert`, `confirm`, `prompt`等）を除外
- Jest/テスト環境グローバル（`describe`, `test`, `expect`, `beforeEach`等）はフィルタ候補に入れるが、`Sources/`配下のファイル解析時は不要（`Tests/`を解析する場合のみ）
- プロパティアクセスの右辺（`foo.bar`の`bar`）は参照に含めない — `MemberExpression`の`property`は除外
- メソッド定義名（`class { method() {} }`の`method`）も除外

**スコープ追跡の簡易実装:**
- 関数/ブロックスコープごとにローカル変数のSetを積むスタック構造
- `FunctionDeclaration`, `FunctionExpression`, `ArrowFunctionExpression` → パラメータをローカルスコープに追加
- `VariableDeclaration`（`const`/`let`はブロックスコープ、`var`は関数スコープ）
- `CatchClause` → `param`をローカルスコープに追加
- `for...in` / `for...of` の左辺

### 4. side-effect-classifier.js の設計

トップレベルのステートメントを走査し、以下のルールで分類する:

- **全ステートメントが宣言（class/function/const/let/var）のみ** → `pure-definition`
- **トップレベルに`Object.assign(*.prototype, ...)`がある** → `prototype-extension`
- **トップレベルに`*.register*(...)`や`Vue.component(...)`呼び出しがある** → `registry-provider`
- **トップレベルにグローバル変数への代入（`g_*`プレフィクスの`const`/`let`/`var`で`new`式を含む、または代入式）がある** → `global-assignment`
- **上記のいずれにも該当しないトップレベル副作用がある** → `initialization-root`

複数カテゴリに該当する場合は、最も「重い」カテゴリを採用する（`initialization-root` > `registry-provider` > `prototype-extension` > `global-assignment` > `pure-definition`）。

### 5. analyze-globals.js（CLIエントリポイント）

コマンドライン使用例:
```bash
# 単一ファイル解析
node Tools/analyze-globals.js Sources/GlobalDefinitions.js

# 全ファイル解析（ディレクトリ指定）
node Tools/analyze-globals.js Sources/

# 結果をJSONファイルに出力
node Tools/analyze-globals.js Sources/ --output Tools/output/global-symbols.json
```

出力は標準出力にJSON形式で表示する。`--output`オプションでファイルに書き出す。

### 6. ESLint `no-undef` による補完

AST解析スクリプトとは別に、ESLintの`no-undef`ルールを各ファイル単独で実行し、暗黙的グローバル参照を検出する方法を文書化する。これはAST解析結果の検証（クロスチェック）に使用する。

実行方法の例:
```bash
# 各ファイル単独でno-undefを実行
npx eslint --no-eslintrc --rule '{"no-undef": "error"}' --env browser Sources/Unit.js
```

ただし、グローバルスコープで他ファイルの定義を参照しているため大量のエラーが出る。そのエラーリスト自体が「このファイルが外部に期待しているシンボル」のリストとなる。この情報をAST解析の`references`と照合する。

### 7. 実行時グローバル差分の設計

ブラウザ環境で各ファイルロード前後の`Object.getOwnPropertyNames(window)`差分を記録する仕組みを設計する。実装はスニペットレベルで十分（自動化ツールは不要）。

考え方:
```javascript
// ブラウザコンソールで実行するスニペット
const before = new Set(Object.getOwnPropertyNames(window));
// <script src="Sources/Unit.js"></script> をロード
const after = new Set(Object.getOwnPropertyNames(window));
const added = [...after].filter(name => !before.has(name));
console.log('Added globals:', added);
```

この手法はAST解析で検出できない動的なグローバル登録（`window["Foo"] = ...`パターン等）を補完するために使用する。結果は手動で記録し、AST解析結果と照合する。

## 実装手順

1. `npm install --save-dev acorn acorn-walk` を実行
2. `Tools/lib/ast-extractor.js` を作成 — 定義シンボル・参照シンボル抽出ロジック
3. `Tools/lib/side-effect-classifier.js` を作成 — 副作用分類ロジック
4. `Tools/tests/analyze-globals.test.js` を作成 — 上記テストスタブを実装
5. テストが通ることを確認
6. `Tools/analyze-globals.js` を作成 — CLIエントリポイント
7. 全64ファイルに対してスクリプトを実行し、結果を`Tools/output/global-symbols.json`に保存
8. ESLint `no-undef`の結果と照合し、AST解析の精度を検証
9. 実行時グローバル差分スニペットを`Tools/runtime-globals-snippet.js`として保存

## Jest設定の追加

Tools配下のテストを既存のJest設定と共存させるため、`Tools/jest.config.js`を作成する。

```javascript
// Tools/jest.config.js の構成概要
// - testMatch: ["**/Tools/tests/**/*.test.js"]
// - transform: デフォルト（Babelなし、Node.js環境）
// - testEnvironment: "node"（jsdomは不要）
```

`package.json`の`scripts`に追加:
```json
{
  "scripts": {
    "test:tools": "jest --config Tools/jest.config.js"
  }
}
```

## Acornパーサーの注意点

- `sourceType: "script"` を指定する（ESMではなくスクリプトモードでパース）
- `ecmaVersion: "latest"` を指定する（最新のJS構文をサポート）
- パースエラーが発生するファイルがある場合は、エラーを記録して次のファイルに進む（全ファイルの処理を中断しない）
- クラスフィールド（`class Foo { field = 1; }`）やプライベートフィールド（`#field`）が使われている可能性があるため、Acornの対応バージョンを確認する

## 既知の課題

- **動的プロパティ参照**: `window["Foo"]`や`this[methodName]()`のようなパターンは静的解析で検出できない。実行時グローバル差分で補完する
- **Vueテンプレート内の参照**: HTMLファイル内の`{{ }}`や`v-bind`で参照されるシンボルはAST解析の対象外。section-02でHTMLエントリポイント分析時に別途対応する
- **eval/Function**: `eval()`や`new Function()`による動的コード実行があれば検出不能。本プロジェクトでは使用されていない想定だが、存在する場合は手動で記録する
- **列挙型の大量定義**: `SkillConstants.js`や`HeroInfoConstants.js`のような定数列挙ファイルは数百のシンボルを定義する。出力が大きくなるが、section-02の依存グラフ構築に必要なので省略しない

## 実装結果

### 計画からの差分

1. **副作用分類の拡張**: 計画の5カテゴリから7カテゴリに拡張。`global-assignment`を3分割:
   - `global-constant` — リテラル定数のg_変数
   - `global-mutable-state` — プレースホルダー初期化のg_変数
   - `global-assignment` — 実行時初期化のg_変数
2. **acorn-walkは未使用**: 独自のスコープ追跡付きウォーカーを実装。acorn-walkは依存として残存
3. **AST共有**: extractSymbolsとclassifySideEffectsが同一ASTを共有するよう`parseCode()`を追加
4. **ESLint no-undef検証**: 本セクションでは未実施（手動で実行可能）

### 作成ファイル

- `Tools/lib/ast-extractor.js` — AST解析・シンボル抽出
- `Tools/lib/side-effect-classifier.js` — 副作用分類
- `Tools/analyze-globals.js` — CLIエントリポイント
- `Tools/tests/analyze-globals.test.js` — テスト（24件）
- `Tools/jest.config.js` — Tools用Jest設定
- `Tools/runtime-globals-snippet.js` — ブラウザ実行時グローバル差分スニペット

### テスト結果

- 24テスト全パス（定義抽出4件、参照抽出8件、重複排除1件、実ファイル1件、副作用分類10件）
- 既存プロジェクトテスト310件に影響なし

### 解析結果サマリ（64ファイル）

| カテゴリ | ファイル数 |
|----------|-----------|
| pure-definition | 39 |
| initialization-root | 12 |
| global-assignment | 9 |
| global-constant | 2 |
| global-mutable-state | 2 |