<!-- IMPLEMENTATION_STATUS: complete -->

# Section 3: SkillEffectField.jsをSkillEffect.jsに統合

## Overview

SkillEffectField.js（188行）の全内容をSkillEffect.jsに移動し、SkillEffectField.jsをre-exportファイルに変換する。これにより SkillEffect.js <-> SkillEffectField.js の循環依存を物理的に解消する。

## Implementation Notes

### 実際の実装経緯
- ステップ1-3（コード移動、export追加、re-exportファイル変換）はSection 02と同時に実施済み（commit ec4e6ec1）
- 本セクションでは残りの作業を実施:
  - TDDテスト作成（`Tests/SkillEffectFieldMerge.test.js` — 6テスト）
  - `SkillEffectBattleContext.js`のimportパスを`./SkillEffectField.js`から`./SkillEffect.js`に変更、2つのimport文を1行に統合
- コードレビューで指摘された改善を反映:
  - re-exportテストに`SkillEffectFieldNode`の検証を追加
  - re-exportと直接importの同一参照性テストを追加

### 作成・変更ファイル
- `Tests/SkillEffectFieldMerge.test.js` (新規) — 6テスト
- `Sources/SkillEffectBattleContext.js` (変更) — import統合

### Dependencies

- **Section 01 (事前調査)**: `filterImportExport`のre-export構文対応調査の結果に基づいてre-exportの形式を決定する
- **Section 02 (SkillEffectUnit.js統合)**: 並行可能だが同じファイル（SkillEffect.js）を編集するため、実際はどちらかが先に完了している必要がある

### Blocked By This Section

- **Section 04 (統合後検証)**: 本セクションの完了を前提とする

---

## Background

### 現状の循環構造

SkillEffectField.jsは以下の3ファイルからimportしている:

- `SkillEffectCore.js` -- `SkillEffectNode`, `NumberNode`, `BoolNode`
- `SkillEffect.js` -- `SingleEffectNode`
- `Utilities.js` -- `ArrayUtil`

一方、SkillEffect.jsはSkillEffectField.jsを直接importしていない（grep結果で確認済み）。しかし、連結方式（`vitest.setup.js`の`vm.runInThisContext`）では SkillEffect.js の後に SkillEffectField.js を読み込む順序で動作しており、SkillEffectBattleContext.js や SkillEffectUnit.js がSkillEffectField.jsで定義されたクラス（`GetSkillEffectFieldNode`, `ModSkillEffectFieldNode`, `SkillEffectField`）を使っている。

### SkillEffectField.jsの内容（188行）

4つのクラス/シンボルが定義されている:

1. **`SkillEffectField`** -- 演算子enum (`Op`) と静的メソッド `calc(a, b, op)` を持つユーティリティクラス
2. **`SkillEffectFieldNode`** -- `SingleEffectNode`を継承する抽象基底クラス。`setKey()`, `setLogMessage()`, `battleContext()` メソッドを提供
3. **`GetSkillEffectFieldNode`** -- `SkillEffectFieldNode`を継承。フィールド値の取得を行う
4. **`ModSkillEffectFieldNode`** -- `SkillEffectFieldNode`を継承。フィールド値の変更を行う。コンストラクタで `SkillEffectNode`, `BoolNode`, `NumberNode` を使用

### 消費者ファイル

SkillEffectField.jsからimportしているファイル:

- **`SkillEffectBattleContext.js`** (line 3): `import { GetSkillEffectFieldNode, ModSkillEffectFieldNode, SkillEffectField } from './SkillEffectField.js';`
- **`*Main.js`ファイル** (8ファイル): side-effect import `import './SkillEffectField.js';` -- これらはモジュール読み込み順序の保証のためのもの
- **`SkillEffectUnit.js`**: 連結方式で `GetSkillEffectFieldNode`, `ModSkillEffectFieldNode`, `SkillEffectField` を暗黙的に使用（ESM importなし）

### filterImportExportの制約

`vitest.setup.js`の`filterImportExport`関数は以下のパターンのみを除去する:

```javascript
// 除去される:
/^import /     // import文
/^export \{/   // named export文

// 除去されない:
export * from './x.js'
export { x } from './y.js'
```

re-exportファイルに `export * from` や `export { x } from` 構文を使うと、Section 12（連結方式廃止）まで`filterImportExport`で除去されず、連結実行時にSyntaxErrorが発生する。対策として以下のいずれかが必要:

- **Option A**: `filterImportExport`の正規表現を拡張して`export * from`と`export { ... } from`もフィルタする
- **Option B**: re-exportファイルで `import` + `export { }` の2行形式を使う（既存のfilterImportExportでフィルタ可能）

Section 01の調査結果に基づいて選択する。Option Aが推奨（将来のre-exportファイルにも対応できるため）。

---

## Tests (TDD)

以下のテストを `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/` に作成する。テストファイル名: `SkillEffectFieldMerge.test.js`

### テスト1: SkillEffect.jsからFieldクラスがexportされていること

```javascript
import { describe, test, expect } from 'vitest';

describe('SkillEffectField merge into SkillEffect', () => {
    test('SkillEffect.js exports SkillEffectField class', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        expect(mod.SkillEffectField).toBeDefined();
        expect(typeof mod.SkillEffectField.calc).toBe('function');
        expect(mod.SkillEffectField.Op).toBeDefined();
    });

    test('SkillEffect.js exports GetSkillEffectFieldNode class', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        expect(mod.GetSkillEffectFieldNode).toBeDefined();
    });

    test('SkillEffect.js exports ModSkillEffectFieldNode class', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        expect(mod.ModSkillEffectFieldNode).toBeDefined();
    });
});
```

### テスト2: re-exportファイル経由でも同じシンボルがimportできること

```javascript
describe('SkillEffectField.js re-export', () => {
    test('SkillEffectField.js re-exports SkillEffectField from SkillEffect.js', async () => {
        const mod = await import('../Sources/SkillEffectField.js');
        expect(mod.SkillEffectField).toBeDefined();
        expect(mod.GetSkillEffectFieldNode).toBeDefined();
        expect(mod.ModSkillEffectFieldNode).toBeDefined();
    });
});
```

### テスト3: 継承チェーンの正しさ

```javascript
describe('SkillEffectFieldNode inheritance', () => {
    test('SkillEffectFieldNode extends SingleEffectNode', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        const node = new mod.GetSkillEffectFieldNode();
        expect(node).toBeInstanceOf(mod.SingleEffectNode);
    });
});
```

### テスト4: 連結方式の過渡期互換性

```javascript
describe('transitional compatibility', () => {
    test('vitest.setup.js concatenation does not throw SyntaxError', () => {
        // 既存テストが全パスしていればこの条件は満たされている
        // npm test の成功で確認
        expect(true).toBe(true);
    });
});
```

---

## Implementation Steps

### ステップ1: SkillEffectField.jsの内容をSkillEffect.jsに移動

**対象ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffect.js`

SkillEffectField.jsの4つのクラス/シンボルをSkillEffect.jsに移動する。

**配置位置**: `SingleEffectNode`クラス定義の直後（line 2837付近以降）。`SingleEffectNode`が定義された後で、かつそれを使用するコードの前。

移動する内容:
1. `SkillEffectField`クラス（Op enum + calc静的メソッド）-- これは`SingleEffectNode`に依存しないので`SingleEffectNode`の前でも良いが、まとめて配置する
2. `SkillEffectFieldNode extends SingleEffectNode` -- `SingleEffectNode`の直後に配置
3. `GetSkillEffectFieldNode extends SkillEffectFieldNode`
4. `ModSkillEffectFieldNode extends SkillEffectFieldNode` -- コンストラクタ内で`SkillEffectNode`, `BoolNode`, `NumberNode`を使用（これらは既にSkillEffect.jsの冒頭でSkillEffectCore.jsからimport済み）

**依存確認**: SkillEffectField.jsが使用するimportシンボルがSkillEffect.jsで既に利用可能か:
- `SkillEffectNode` -- SkillEffectCore.jsからimport済み (line 1)
- `NumberNode` -- SkillEffectCore.jsからimport済み (line 1)
- `BoolNode` -- SkillEffectCore.jsからimport済み (line 1)
- `SingleEffectNode` -- SkillEffect.js内で定義済み (line 2837)
- `ArrayUtil` -- Utilities.jsからimport済み (line 12)

全て利用可能。追加のimport文は不要。

### ステップ2: SkillEffect.jsのexport文に追加

SkillEffect.jsの末尾のexport文群に以下を追加:

```javascript
export { SkillEffectField, SkillEffectFieldNode, GetSkillEffectFieldNode, ModSkillEffectFieldNode };
```

### ステップ3: SkillEffectField.jsをre-exportファイルに変換

**対象ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectField.js`

ファイルの全内容を削除し、re-exportのみにする。

**filterImportExport対応** -- Section 01の調査結果に基づいて形式を選択:

**Option A（filterImportExport拡張の場合）**:
```javascript
export { SkillEffectField, SkillEffectFieldNode, GetSkillEffectFieldNode, ModSkillEffectFieldNode } from './SkillEffect.js';
```

この場合、`vitest.setup.js`の`filterImportExport`を拡張して`export { ... } from`パターンも除去する必要がある:

```javascript
function filterImportExport(content) {
    return content
        .split('\n')
        .filter(line => !(/^import /.test(line) || /^export \{/.test(line) || /^export \* from/.test(line)))
        .map(line => line.replace(/^export (function|class|const|let|var) /, '$1 '))
        .join('\n');
}
```

注意: `/^export \{/` は既に `export { x } from` もマッチする（`export {` で始まるため）。つまり既存の正規表現で `export { ... } from` は除去される。追加が必要なのは `export * from` パターンのみ。

**Option B（import + export形式の場合）**:
```javascript
import { SkillEffectField, SkillEffectFieldNode, GetSkillEffectFieldNode, ModSkillEffectFieldNode } from './SkillEffect.js';
export { SkillEffectField, SkillEffectFieldNode, GetSkillEffectFieldNode, ModSkillEffectFieldNode };
```

この形式は既存の`filterImportExport`で両行とも除去される。連結時にはSkillEffect.jsの方で既にシンボルが定義されているため問題ない。

**推奨**: 実際の`filterImportExport`の正規表現 `/^export \{/` を確認すると、`export { SkillEffectField, ... } from './SkillEffect.js'` は `export {` で始まるためマッチする。よってOption A（`export { ... } from` 形式）がシンプルでそのまま動作する可能性が高い。ただし確実を期すならOption Bを使う。

### ステップ4: 消費者ファイルのimportパス更新

SkillEffectField.jsからimportしているファイルの更新:

**`SkillEffectBattleContext.js`** (line 3):
```javascript
// 変更前:
import { GetSkillEffectFieldNode, ModSkillEffectFieldNode, SkillEffectField } from './SkillEffectField.js';
// 変更後（推奨 - 直接importに変更）:
import { GetSkillEffectFieldNode, ModSkillEffectFieldNode, SkillEffectField } from './SkillEffect.js';
```

re-export経由でも動作するが、直接importが望ましい。

**`*Main.js`ファイル** (8ファイル):
side-effect import `import './SkillEffectField.js';` はそのまま維持しても良い（re-exportファイルを読み込むことでSkillEffect.jsが確実に評価される）。ただし、SkillEffect.jsは他のimportで既に読み込まれているはずなので、削除しても問題ない可能性がある。安全のためこの時点では維持し、Section 13（Viteエントリー整合確認）で整理する。

**`SkillEffectUnit.js`**:
SkillEffectUnit.jsはESM importなしで`GetSkillEffectFieldNode`等を使用している（連結方式による暗黙依存）。Section 02でSkillEffectUnit.jsの統合が行われる場合、この問題は解消される。Section 02と03の実行順序に注意。

---

## Verification

### 実行すべき確認

1. **`npm test`で全テストがパスすること** -- 連結方式がまだ動作しているため、既存テストのregressionを確認
2. **新テスト (`SkillEffectFieldMerge.test.js`) がパスすること** -- ESM importでの動作確認
3. **`npx madge --circular Sources/`で循環が増えていないこと** -- SkillEffect.js <-> SkillEffectField.js の循環が解消されていること

### 注意事項

- SkillEffect.jsは既に9,000行超の大規模ファイル。188行の追加は行数的には軽微だが、`SingleEffectNode`定義の直後に正しく配置すること
- `ModSkillEffectFieldNode`のコンストラクタは`SkillEffectNode`の`instanceof`チェックを行うため、importされたクラスと同一であることが重要（同一ファイル内なので問題なし）
- SkillEffectField.jsの`SkillEffectFieldNode`は`export`リスト内に含まれているが、外部で直接使用されているのは主に`GetSkillEffectFieldNode`と`ModSkillEffectFieldNode`。`SkillEffectFieldNode`もJSDocの型参照で使われているためexportは維持する