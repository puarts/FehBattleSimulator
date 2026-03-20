I now have all the context needed. Let me generate the section content.

# Section 01: Build Filter -- import/export 行除去フィルタの追加

## 概要

ESモジュール化（Phase 2）の前提条件として、`scripts/build.mjs` と `create_tests.sh` のファイル結合処理に import/export 行除去フィルタを追加する。これにより、各ソースファイルに `import` / `export` 文を追加しても、既存の結合ベースのビルド・テスト・ローカル開発が壊れない。

**このセクションは他の全セクション（02〜11）の前提条件であり、最初に実装する必要がある。**

## 背景

現在のプロジェクトは3つの仕組みでJSファイルを消費している:

1. **テスト**: `create_tests.sh` が全ファイルを結合して `All.test.js` を生成し、Jest が実行
2. **ビルド**: `scripts/build.mjs` が全ファイルを結合して1ファイルを出力
3. **ローカル開発**: HTML が `loadScripts()` で個別ファイルを `<script>` タグとして動的読み込み

いずれもグローバルスコープ前提。ESM の `export`/`import` 文を追加すると結合モードで構文エラーになるため、結合時にこれらの行を除去するフィルタが必要。

### コーディング規約（フィルタ設計の前提）

import 文と export 文は **必ず1行で記述する**。複数行にまたがる import/export は禁止。これにより、行単位の単純なフィルタで安全に動作する。

```javascript
// OK: 1行で書く
import { Weapon, Support, Special, PassiveA, PassiveB } from './SkillConstants.js';
export { ObjectUtil, NULL_OBJECT, TreeNode };

// NG: 複数行にまたがる（フィルタが破綻する）
import {
    Weapon,
    Support,
} from './SkillConstants.js';
```

export スタイルは末尾まとめ `export { ... };` に統一。インライン export（`export class`, `export function`）は禁止。

### フィルタの除去対象パターン

- `import ` で始まる行を除去（行頭マッチ: `^import `）
- `export {` で始まる行を除去（行頭マッチ: `^export {`）
- 通常のコード行（コメント内の "import" や文字列リテラル内の "import" 等）は除去しない

## テスト

テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/BuildFilter.test.js`

テストファイルを `create_tests.sh` の `TEST_FILE_NAMES` 配列に追加する。

### テスト仕様

以下のテストを実装する。フィルタ関数を `build.mjs` から直接テストするのではなく（build.mjs はESMスクリプト）、フィルタロジックと同等の関数をテストファイル内に定義してテストする。

```
describe('Build filter', () => {
    // フィルタ関数の定義（build.mjs の filterImportExport と同じロジック）
    // function filterImportExport(content) { ... }

    test('import 行を除去する', () => {
        // "import { Foo } from './Bar.js';" のような行が除去されること
    });

    test('export { ... } 行を除去する', () => {
        // "export { Foo, Bar };" のような行が除去されること
    });

    test('通常のコード行を除去しない', () => {
        // "// import something" （コメント内）
        // "const s = 'import { X } from ...';" （文字列リテラル内）
        // "console.log('export { ... }');" （文字列リテラル内）
        // これらは除去されないこと
    });

    test('フィルタ適用前後で import/export 以外の行数が変わらない', () => {
        // 通常のコード行のみのコンテンツでフィルタを適用し、行数が変わらないことを確認
    });
});
```

### 結合出力の互換性テスト（手動確認）

フィルタ追加後に以下を手動確認:

- `./run_tests.sh` で全テストがパス（フィルタ追加前と同じ結果）
- `npm run build` の出力が正常（フィルタ追加前と同等のサイズ・内容。まだ import/export 文がないため、出力は同一になるはず）

## 実装

### 1. `scripts/build.mjs` の変更

ファイルパス: `/Users/studio/Documents/GitHub/FehBattleSimulator/scripts/build.mjs`

`mergeFiles()` 関数内で、各ファイルの内容を読み込んだ後に行単位でフィルタリングを適用する。

変更箇所: `mergeFiles()` 関数（現在は112行目付近）。`readFileSync` で読み込んだ内容に対して、行単位で以下のパターンに一致する行を除去する:

- 行が `import ` で始まる（正規表現: `/^import /`）
- 行が `export {` で始まる（正規表現: `/^export \{/`） -- `export {` と `export{` の両方に対応するなら `/^export\s*\{/` だが、コーディング規約でスペースありに統一するため `/^export \{/` で十分

フィルタ関数のシグネチャ:

```javascript
/**
 * import/export 行を除去するフィルタ。
 * ESM化で追加される import/export 文を結合出力から除去し、
 * グローバルスコープ前提の結合モードとの互換性を維持する。
 *
 * @param {string} content - ファイル内容
 * @returns {string} フィルタ適用後の内容
 */
function filterImportExport(content) {
    // 行単位で ^import と ^export { にマッチする行を除去
}
```

`mergeFiles()` 内での呼び出し位置: `readFileSync(filePath, 'utf-8')` の戻り値に対して `filterImportExport()` を適用してから `parts` 配列に追加する。

### 2. `create_tests.sh` の変更

ファイルパス: `/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh`

ソースファイル結合のループ（現在は96〜98行目）で、`cat` の出力に `grep -v` を適用して import/export 行を除去する。

変更前:
```bash
for name in ${SOURCE_FILE_NAMES[@]}; do
    cat ./Sources/${name}.js >> ./$TARGET_FILE
done
```

変更後:
```bash
for name in ${SOURCE_FILE_NAMES[@]}; do
    grep -v -E '^import |^export \{' ./Sources/${name}.js >> ./$TARGET_FILE
done
```

`grep -v -E` の `-v` は非マッチ行を出力、`-E` は拡張正規表現。パターン `^import |^export \{` で、行頭が `import ` または `export {` で始まる行を除外する。

**注意**: `TestUtilities.js` もソースファイルとして結合されるため、このフィルタは全ソースファイルに適用される。テストユーティリティファイル（`Tests/TestGlobals.js`）やテストファイル（`Tests/*.test.js`）の結合ループ（100〜106行目）にも同じフィルタを適用すべきか検討が必要。Phase 2 ではテストファイル自体には import/export を追加しない（結合方式のため）ので、テストファイル用ループのフィルタは不要。ただし、将来の拡張性を考慮して全ループに適用しても害はない。

### 3. テストファイルの作成と登録

テストファイル `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/BuildFilter.test.js` を作成する。

`create_tests.sh` の `TEST_FILE_NAMES` 配列に `BuildFilter` を追加する。

テストファイル内にフィルタ関数（`build.mjs` の `filterImportExport` と同じロジック）を定義し、そのロジックをテストする。build.mjs はESMスクリプトで直接 require できないため、テスト内にロジックを複製する形になる。ロジックが単純（数行）なので、複製のリスクは低い。

## 依存関係

- **依存するセクション**: なし（最初に実装する）
- **ブロックするセクション**: section-02 以降の全セクション（import/export 文を追加する前にフィルタが必要）

## チェックリスト

1. [x] `filterImportExport` 関数を `build.mjs` に追加し、`mergeFiles()` 内で使用（JSDoc付き）
2. [x] `create_tests.sh` のソースファイル結合ループに `grep -v` フィルタを追加（`|| true` で安全化）
3. [x] `Tests/BuildFilter.test.js` を作成（5テスト: import除去, export除去, 通常行保持, 行数不変, 混合パターン）
4. [x] `create_tests.sh` の `TEST_FILE_NAMES` に `BuildFilter` を追加
5. [x] `./run_tests.sh` で全310テストがパス
6. [x] `npm run build` で出力が正常

## 実装時の差分（計画との相違点）

- コードレビューにより `grep -v` に `|| true` を追加（exit code 1 対策）
- `build.mjs` と `BuildFilter.test.js` に相互参照コメントを追加
- 計画の4テストに加え、統合テスト（import+code+export混合パターン）を1件追加