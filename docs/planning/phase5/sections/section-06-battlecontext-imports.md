Section-05 hasn't been written yet. That's fine - it's a dependency but I should reference it. Now I have enough context to write the section.

# Section 06: SkillEffectBattleContext.js の不足ESM import追加

## Overview

SkillEffectBattleContext.js（3,845行）に不足しているESM importを追加し、連結方式（`vm.runInThisContext`）に依存しない完全なESMモジュールとして動作可能な状態にする。

このファイルは戦闘中効果ノード（BattleContextベースのDSLノード）を大量に定義しており、既に7つのimport文と約99のexport行を持つ。不足importは少数であり、Phase 5のimport追加セクション群の中では最も軽量な作業。

## Dependencies

- **section-05-unexported-symbols**: 未エクスポートシンボル6件の対処が完了していること。SkillEffectBattleContext.jsが必要とするシンボルが定義元ファイルでexportされていなければimportできない。

## Background

### 現在のimport状態

SkillEffectBattleContext.jsは既に以下7つのimport文を持つ:

```javascript
import { BoolNode, FALSE_NODE, FromNumberEnsuredNonNegativeNode, FromNumberNode, FromNumbersNode, FromPositiveNumberNode, FromPositiveNumbersNode, GT_NODE, IF_ELSE_NODE, NOT_NODE, NumberNode, PositiveNumberNode, SKILL_EFFECT_NODE, SetNode, SkillEffectNode } from './SkillEffectCore.js';
import { ApplyingNumberNode, EFFECTS, FOR_TARGETS_FOE_DURING_COMBAT_NODE, FromBoolStatsNode, GetFoeDuringCombatMixin, GetUnitDuringCombatMixin, GetUnitMixin, GetValueMixin, IF_ELSE_EFFECT, IS_IN_COMBAT_PHASE_NODE, SetBoolToEachStatusNode, SingleEffectNode, TARGETS_MAX_HP_NODE } from './SkillEffect.js';
import { GetSkillEffectFieldNode, ModSkillEffectFieldNode, SkillEffectField } from './SkillEffectField.js';
import { BattleContext } from './BattleContext.js';
import { PERCENTAGE_NODE } from './SkillEffectAliases.js';
import { NodeEnv } from './SkillEffectEnv.js';
import { g_appData } from './AppDataGlobal.js';
```

### 不足しているimport

調査の結果、ランタイムコードで使用されているが未importのシンボルは以下の通り:

| Symbol | Defined In | Usage Count | Usage Context |
|--------|-----------|-------------|---------------|
| `ObjectUtil` | `Utilities.js` | 4 | `ObjectUtil.getKeyName(NodeEnv.CombatPhase, ...)` — エラーメッセージ内でenumキー名を取得 |

`ObjectUtil`は`Utilities.js`で定義・exportされており（line 28: `class ObjectUtil`, line 2426: export文に含まれる）、SkillEffectBattleContext.js内で4箇所、全て`env.error()`のメッセージ生成に使用されている。

### SkillEffectField.jsからのimportについて

Section-03でSkillEffectField.jsがSkillEffect.jsに統合されre-exportファイルに変換された後も、`import { ... } from './SkillEffectField.js'`は引き続き動作する（re-export経由）。ただし、直接importに書き換える方が望ましい。Section-03完了後の状態に応じて判断する。

---

## Tests

テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/SkillEffectBattleContextImports.test.js`

### Test 1: 動的importが成功すること（ReferenceErrorなし）

SkillEffectBattleContext.jsをESMとして動的importし、モジュール評価時にReferenceErrorやTypeErrorが発生しないことを確認する。

```javascript
/**
 * SkillEffectBattleContext.jsの動的importが成功し、
 * モジュール評価時エラー（ReferenceError等）が発生しないことを確認。
 */
test('SkillEffectBattleContext.js can be dynamically imported without errors', async () => {
    const module = await import('../Sources/SkillEffectBattleContext.js');
    expect(module).toBeDefined();
});
```

### Test 2: 主要クラス/関数がexportされimportできること

代表的なexportシンボルが`undefined`でないことを確認する。

```javascript
/**
 * 主要なexportシンボルが正しくimport可能であることを確認。
 */
test('major exported symbols are importable and defined', async () => {
    const module = await import('../Sources/SkillEffectBattleContext.js');
    // 代表的なシンボルをチェック
    expect(module.INITIATED_COMBAT).toBeDefined();
    expect(module.ATTACKS_TWICE).toBeDefined();
    expect(module.BOOSTS_DAMAGE_BY).toBeTypeOf('function');
});
```

### Test 3: 戦闘中効果ノードの基本的なインスタンス生成が動作すること

DSLノードのインスタンス化が正しく動作することを確認する。

```javascript
/**
 * DSLノードファクトリ関数が正しくインスタンスを返すことを確認。
 */
test('battle context DSL nodes can be instantiated', async () => {
    const { BOOSTS_DAMAGE_BY, NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS } = 
        await import('../Sources/SkillEffectBattleContext.js');
    
    const damageNode = BOOSTS_DAMAGE_BY(5);
    expect(damageNode).toBeDefined();
    
    const followupNode = NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS(true);
    expect(followupNode).toBeDefined();
});
```

---

## Implementation

### 対象ファイル

`/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectBattleContext.js`

### Step 1: ObjectUtil importの追加

ファイル冒頭のimportブロック（lines 1-7）に以下を追加:

```javascript
import { ObjectUtil } from './Utilities.js';
```

追加位置は既存のimport文の後（例: line 7の`g_appData` importの次）。

### Step 2: SkillEffectField.js importの検討（条件付き）

Section-03でSkillEffectField.jsがSkillEffect.jsに統合された後、line 3の:
```javascript
import { GetSkillEffectFieldNode, ModSkillEffectFieldNode, SkillEffectField } from './SkillEffectField.js';
```
を以下に変更することを検討:
```javascript
import { GetSkillEffectFieldNode, ModSkillEffectFieldNode, SkillEffectField } from './SkillEffect.js';
```

ただし、re-export経由でも動作するため、これは任意。Section-03の完了状態に応じて判断する。もしSkillEffect.jsのimport行（line 2）に統合できるなら、import行数を減らせる。

### Step 3: export文の確認

SkillEffectBattleContext.jsは既に約99行のexport文を持ち、定義している全てのパブリックシンボルをexportしている。追加のexportは不要。

### Step 4: テスト実行

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
npm test
```

既存テストが全てパスすることを確認。連結方式（`vitest.setup.js`）はこの時点ではまだ動作中であり、import追加はロジック変更を伴わないためregressionリスクは極めて低い。

---

## Verification Checklist (Actual)

- [x] `ObjectUtil`のimportが追加されている
- [x] 動的importテスト（Test 1）がパスする
- [x] 主要シンボルexportテスト（Test 2）がパスする（BOOSTS_DAMAGE_BY型チェック含む）
- [x] DSLノードインスタンス化テスト（Test 3）がパスする
- [x] `npm test`で既存テストが全てパスする（1件の既存タイムアウトを除く）
- [x] `npx madge --circular Sources/`で循環依存が増えていないこと（Phase5Baseline.test.jsで検証）

## Files Modified (Actual)

- `Sources/SkillEffectBattleContext.js` — Added `import { ObjectUtil } from './Utilities.js'`
- `Tests/SkillEffectBattleContextImports.test.js` — New test file (3 tests)

**Note**: SkillEffectField.js import consolidation (Step 2 optional) was not performed — re-export path works correctly.

## Notes

- このファイルはPhase 5のimport追加セクション群の中で最も作業量が少ない（不足importが`ObjectUtil`の1件のみ）
- `PERCENTAGE_NODE`のimport元である`SkillEffectAliases.js`は現時点ではzero-importsファイルだが、Section-08でimportが追加される。SkillEffectBattleContext.js側のimportは既に正しく記述されている
- Section-03完了後、SkillEffectField.jsがre-exportファイルに変換された場合でも、既存のimportパスは壊れない