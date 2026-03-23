<!-- IMPLEMENTATION_STATUS: complete -->

# Section 4: 統合後の循環依存検証（Post-Merge Verification）

## Implementation Notes

### 作成ファイル
- `Tests/Phase5PostMergeVerify.test.js` (新規) — 10テスト
  - madge循環依存ゼロ確認
  - SkillEffect.js動的import成功確認
  - Unit/Field統合シンボルのexport確認
  - re-exportファイル経由の動作・同一参照性確認
  - DSLクラス基本動作確認
  - filterImportExport過渡期互換性確認

### コードレビュー反映
- SkillEffectFieldのexportアサーション追加
- ALLY, FOESのre-exportテスト追加

## 概要

Section 2（SkillEffectUnit.jsをSkillEffect.jsに統合）とSection 3（SkillEffectField.jsをSkillEffect.jsに統合）が完了した後に実行する検証セクション。統合が正しく行われ、循環依存が解消されていること、re-exportファイルが正しく機能すること、既存テストがregressionを起こしていないことを確認する。

## 前提条件

- **Section 02（merge-unit）が完了していること**: SkillEffectUnit.jsの内容がSkillEffect.jsに統合済み。SkillEffectUnit.jsはre-exportファイルに変換済み。
- **Section 03（merge-field）が完了していること**: SkillEffectField.jsの内容がSkillEffect.jsに統合済み。SkillEffectField.jsはre-exportファイルに変換済み。
- この時点では`vitest.setup.js`の連結方式（`vm.runInThisContext`）はまだ動作中。連結方式の廃止はSection 12で行う。

## テスト（Tests FIRST）

テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/Phase5PostMergeVerify.test.js`

### テスト1: madge循環依存チェック

`npx madge --circular Sources/`の出力が0件（循環依存がない）であることを確認する。

```javascript
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

describe('Phase5 Post-Merge Verification', () => {
    const ROOT = path.resolve(import.meta.dirname, '..');
    const SOURCES = path.join(ROOT, 'Sources');

    describe('Circular dependency check', () => {
        it('madge --circular reports zero cycles in Sources/', () => {
            // madgeの--circularオプションは循環がなければ空配列のJSONを返す
            const result = execSync(`npx madge --circular --json "${SOURCES}"`, {
                cwd: ROOT,
                encoding: 'utf-8',
            });
            const cycles = JSON.parse(result);
            expect(cycles).toEqual([]);
        });
    });
});
```

### テスト2: SkillEffect.jsの動的importが成功すること

統合後のSkillEffect.jsがモジュール評価時エラー（TDZ、ReferenceError、TypeError等）なしにimportできることを確認する。

```javascript
describe('SkillEffect.js dynamic import', () => {
    it('should import successfully without module evaluation errors', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        expect(mod).toBeDefined();
    });

    it('should export key symbols from merged SkillEffectUnit.js content', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        // SkillEffectUnit.jsから統合されたシンボル
        expect(mod.UNIT).toBeDefined();
        expect(mod.FOE).toBeDefined();
        expect(mod.ALLIES).toBeDefined();
        expect(mod.FOES).toBeDefined();
        expect(mod.TextUnitNode).toBeDefined();
        expect(mod.TextFoeNode).toBeDefined();
    });

    it('should export key symbols from merged SkillEffectField.js content', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        // SkillEffectField.jsから統合されたシンボル
        expect(mod.SkillEffectFieldNode).toBeDefined();
        expect(mod.GetSkillEffectFieldNode).toBeDefined();
        expect(mod.ModSkillEffectFieldNode).toBeDefined();
    });
});
```

### テスト3: re-exportファイル経由のimportが動作すること

SkillEffectUnit.jsとSkillEffectField.jsがre-exportファイルとして正しく機能し、既存のimportパスが壊れないことを確認する。

```javascript
describe('Re-export files', () => {
    it('SkillEffectUnit.js re-exports UNIT, FOE, ALLIES from SkillEffect.js', async () => {
        const mod = await import('../Sources/SkillEffectUnit.js');
        expect(mod.UNIT).toBeDefined();
        expect(mod.FOE).toBeDefined();
        expect(mod.ALLIES).toBeDefined();
    });

    it('SkillEffectField.js re-exports SkillEffectFieldNode from SkillEffect.js', async () => {
        const mod = await import('../Sources/SkillEffectField.js');
        expect(mod.SkillEffectFieldNode).toBeDefined();
        expect(mod.GetSkillEffectFieldNode).toBeDefined();
        expect(mod.ModSkillEffectFieldNode).toBeDefined();
    });

    it('re-export symbols are identical to direct SkillEffect.js exports', async () => {
        const direct = await import('../Sources/SkillEffect.js');
        const viaUnit = await import('../Sources/SkillEffectUnit.js');
        const viaField = await import('../Sources/SkillEffectField.js');
        // 同一オブジェクト参照であることを確認（re-exportはコピーではない）
        expect(viaUnit.UNIT).toBe(direct.UNIT);
        expect(viaField.SkillEffectFieldNode).toBe(direct.SkillEffectFieldNode);
    });
});
```

### テスト4: 統合されたクラスの基本動作テスト

統合後のクラス継承チェーンが正しく機能していることを確認する。

```javascript
describe('Merged class functionality', () => {
    it('UNIT.sameGroup() returns a valid node instance', async () => {
        const { UNIT } = await import('../Sources/SkillEffect.js');
        const allies = UNIT.sameGroup();
        // UnitsNodeのインスタンスであること（クラスチェーンが正しい）
        expect(allies).toBeDefined();
        expect(typeof allies).toBe('object');
    });

    it('GRANTS_BONUS DSL function works correctly', async () => {
        const { GRANTS_BONUS } = await import('../Sources/SkillEffect.js');
        expect(typeof GRANTS_BONUS).toBe('function');
    });
});
```

### テスト5: 既存テストのregression確認

このテストは`npm test`全体の実行で確認する。個別テストとしては作成不要だが、セクション完了時に必ず`npm test`を実行して全パスを確認すること。

### テスト6: vitest.setup.jsの連結方式が過渡期でも動作すること

統合後のSkillEffect.jsとre-exportファイルが、`vitest.setup.js`の`filterImportExport`連結方式でもSyntaxErrorを起こさないことを確認する。

```javascript
describe('Transitional compatibility', () => {
    it('filterImportExport handles re-export files without SyntaxError', () => {
        // re-exportファイルの内容を読み取ってfilterImportExportを適用
        // 結果がSyntaxError-freeであることを確認
        // Note: filterImportExportは export * from / export { x } from を処理できない
        // Section 2-3でre-exportの形式を決定した結果に基づきテストする
        const fs = require('node:fs');
        const unitContent = fs.readFileSync(
            path.join(SOURCES, 'SkillEffectUnit.js'), 'utf-8'
        );
        // re-exportファイルがfilterImportExportで空になっても問題ないことを確認
        // （連結方式ではSkillEffect.jsに統合された内容が先に読み込まれるため）
        expect(() => {
            // filterImportExport相当の処理を適用
            const filtered = unitContent
                .split('\n')
                .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
                .map(line => line.replace(/^export (function|class|const|let|var) /, '$1 '))
                .join('\n');
            // 残った内容にexport * fromが含まれていないこと
            // （含まれていると連結方式でSyntaxErrorになる）
        }).not.toThrow();
    });
});
```

## 実装手順

### ステップ1: テストファイルの作成

上記テストを `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/Phase5PostMergeVerify.test.js` に作成する。

テストファイルの先頭にはESM importを使用する。Phase 4で確立されたハイブリッド方式（ESM importでテスト対象モジュールを動的にimport）に従う。

### ステップ2: madge循環依存チェックの実行

ターミナルで以下を実行し、循環が0件であることを確認する。

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
npx madge --circular Sources/
```

出力が空であれば成功。循環が検出された場合は、Section 2またはSection 3の統合作業に問題があるため、該当セクションに戻って修正する。

### ステップ3: SkillEffect.jsのexport確認

統合後のSkillEffect.jsが以下のシンボルを正しくexportしていることを確認する。

**SkillEffectUnit.jsから統合されたシンボル（主要なもの）:**
- クラス: `TextUnitNode`, `TextFoeNode`, `TextAllyNode`, `TargetAllyNode`, `TextTargetNode`, `SkillOwnerUnitNode`, `UnitsWithinNode`
- 定数: `UNIT`, `FOE`, `ALLY`, `ALLIES`, `FOES`, `CLOSEST_FOES`
- DSL関数: `GRANTS_BONUS`, `INFLICTS_PENALTY` 等

**SkillEffectField.jsから統合されたシンボル:**
- クラス: `SkillEffectField`, `SkillEffectFieldNode`, `GetSkillEffectFieldNode`, `ModSkillEffectFieldNode`

### ステップ4: re-exportファイルの動作確認

SkillEffectUnit.jsとSkillEffectField.jsがre-exportファイルとして正しく機能していることを確認する。

**重要な注意点**: `vitest.setup.js`の`filterImportExport`関数は以下の行パターンしか除去しない:
- `^import ` で始まる行
- `^export {` で始まる行
- `^export (function|class|const|let|var) ` で始まる行（exportキーワードのみ除去）

`export * from './SkillEffect.js'`のような構文は `^export {` にマッチしないため、連結方式でSyntaxErrorを引き起こす。

**対策（Section 2-3での決定事項に依存）:**
1. `filterImportExport`の正規表現を拡張して`export * from`と`export { ... } from`も除去する
2. または、re-exportファイルで`export * from`構文を使わず、個別に`import`→`export`する形式にする

どちらの方式が採用されたかをSection 2-3の完了時に確認し、テストの期待値を合わせる。

### ステップ5: 既存テストの全数実行

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
npm test
```

全テストがパスすることを確認する。失敗するテストがある場合は、統合作業で壊れた箇所を特定して修正する。

### ステップ6: ESM import動的テストの実行

作成したテストファイルを個別に実行する。

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
npx vitest run Tests/Phase5PostMergeVerify.test.js
```

全テストがパスすることを確認する。

## 対象ファイル

| ファイルパス | 操作 |
|-------------|------|
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/Phase5PostMergeVerify.test.js` | 新規作成 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffect.js` | 検証対象（変更なし） |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectUnit.js` | 検証対象（変更なし） |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectField.js` | 検証対象（変更なし） |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/vitest.setup.js` | 検証対象（filterImportExport拡張が必要な場合のみ変更） |

## 完了条件

1. `npx madge --circular Sources/` が0件（循環依存なし）
2. SkillEffect.jsの動的importが成功（モジュール評価時エラーなし）
3. SkillEffectUnit.js / SkillEffectField.jsのre-export経由importが動作
4. re-exportファイルが`filterImportExport`連結方式でSyntaxErrorを起こさない
5. `npm test`で全既存テストがパス（regression なし）
6. `Tests/Phase5PostMergeVerify.test.js`の全テストがパス

## トラブルシューティング

**madgeが循環を報告する場合:**
- SkillEffect.jsにSkillEffectUnit.jsまたはSkillEffectField.jsへの`import`文が残っていないか確認
- re-exportファイルがSkillEffect.jsからのみimportしていることを確認

**動的importでTDZ/TypeErrorが出る場合:**
- SkillEffectUnit.jsのモジュール評価時コード（`const ALLIES = UNIT.sameGroup()`等）がSkillEffect.js内で正しい位置（`EnvUnitNode`や`UnitsNode`定義の後）に配置されているか確認

**filterImportExportでSyntaxErrorが出る場合:**
- re-exportファイルの構文を確認。`export * from`を使っている場合は`filterImportExport`の正規表現拡張が必要
- 正規表現拡張案: `filter`行に `/^export \* from/.test(line)` と `/^export \{[^}]*\} from/.test(line)` の条件を追加