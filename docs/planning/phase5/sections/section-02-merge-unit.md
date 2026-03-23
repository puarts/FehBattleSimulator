SkillEffectUnit.js has zero import statements - all dependencies come through the concatenation mechanism. Now I have everything I need to write the section.

# Section 2: SkillEffectUnit.jsをSkillEffect.jsに統合

## Overview

SkillEffectUnit.js（427行）の全内容をSkillEffect.jsに物理的に移動し、SkillEffect.js ↔ SkillEffectUnit.js間の循環依存を解消する。移動後のSkillEffectUnit.jsはre-exportファイルに変換し、他ファイルからの既存importを維持する。

## Background

SkillEffectUnit.jsは現在import文が0行で、全ての依存シンボルを`vitest.setup.js`の連結実行（`vm.runInThisContext`）によるグローバルスコープ経由で解決している。このファイルは以下のシンボルに暗黙依存している:

- **SkillEffect.js由来**: `EnvUnitNode`, `UnitsNode`, `SingleEffectNode`, `SkillEffectNode`, `ARE_TARGET_AND_SKILL_OWNERS_HAS_SAME_TITLE_NODE`, `IF_ELSE_EFFECT`, `IS_IN_COMBAT_PHASE_NODE`
- **SkillEffectField.js由来**: `SkillEffectField`, `GetSkillEffectFieldNode`, `ModSkillEffectFieldNode`, `SkillEffectFieldNode`
- **SkillEffectCore.js由来**: `NumberNode`
- **Utilities.js由来**: `SetUtil`
- **UnitConstants.js由来**: `getStatusEffectName`, `StatFlags`
- **Unit関連**: `Unit`（`Unit.nameOf()`で使用）

ESMではSkillEffect.jsがSkillEffectUnit.jsからシンボルをimportし、SkillEffectUnit.jsがSkillEffect.jsのクラス（`EnvUnitNode`等）を継承するため、循環依存でTDZエラーが発生する。物理的な統合によりこの循環を解消する。

### 現在の循環構造

```
SkillEffect.js --import--> SkillEffectUnit.js
  (ALLIES, GRANTS_BONUS, etc.)

SkillEffectUnit.js --暗黙依存--> SkillEffect.js
  (EnvUnitNode, UnitsNode, SingleEffectNode, etc.)
```

SkillEffect.jsの14行目に以下のimport文がある:
```javascript
import { ALLIES, GRANTS_BONUS, GRANTS_STATUS_EFFECTS, INFLICTS_PENALTY, INFLICTS_STATUS_EFFECTS, MOVE_TYPE, UNIT, WEAPON_TYPE } from './SkillEffectUnit.js';
```

## Dependencies

- **Section 1（事前調査）** が完了していること
- `filterImportExport`のre-export構文対応方針がSection 1で決定済みであること

## Tests (write first)

テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/MergeSkillEffectUnit.test.js`

以下のテストスタブを作成する。全てESM importを使用し、`vitest.setup.js`の連結方式に依存しない。

```javascript
import { describe, test, expect } from 'vitest';

describe('Section 2: SkillEffectUnit.js統合', () => {
    describe('SkillEffect.jsからの主要シンボルexport', () => {
        test('UNIT, FOE, ALLY等のインスタンスがexportされていること', async () => {
            // SkillEffect.jsからUNIT, FOE, ALLY, ALLIES, FOES, TARGET, TARGET_FOE, TARGET_ALLY, SKILL_OWNERが
            // exportされimportできることを動的importで検証
        });

        test('TextUnitNode, TextFoeNode, EnvUnitNode等のクラスがexportされていること', async () => {
            // SkillEffect.jsからTextUnitNode, TextFoeNode, TextAllyNode, TargetAllyNode,
            // TextTargetNode, SkillOwnerUnitNode, UnitsWithinNode等のクラスがexportされていることを検証
        });

        test('DSL関数（GRANTS_BONUS, INFLICTS_PENALTY等）がexportされていること', async () => {
            // SkillEffect.jsからGRANTS_BONUS, INFLICTS_PENALTY, GRANTS_STATUS_EFFECTS,
            // INFLICTS_STATUS_EFFECTS, CALL_UNIT_FUNC等がexportされていることを検証
        });

        test('UNIT.sameGroup()がUnitsNodeインスタンスを返すこと', async () => {
            // ALLIESの生成に使われるUNIT.sameGroup()が正しく動作することを検証
        });
    });

    describe('SkillEffectUnit.js（re-exportファイル）からのimport', () => {
        test('re-export経由で同じシンボルがimportできること', async () => {
            // SkillEffectUnit.jsからUNIT, FOE, ALLIES, GRANTS_BONUS等が
            // import可能であることを動的importで検証
        });
    });

    describe('過渡期の互換性', () => {
        test('vitest.setup.jsの連結方式でSyntaxErrorが出ないこと', async () => {
            // filterImportExportがre-export後のSkillEffectUnit.jsを正しく処理できることを検証
            // または、re-export形式がfilterImportExportで処理可能な形式であることを検証
        });
    });
});
```

**テスト方針**:
- 動的import（`await import()`）を使用し、モジュール評価時エラー（TDZ、ReferenceError等）を検出する
- 統合前のシンボルが統合後も同一のオブジェクト/関数であることをtypeof等で検証
- re-exportファイルとオリジナルファイルの両方からのimportを検証

## Implementation Steps

### Step 1: SkillEffectUnit.jsの全内容をSkillEffect.jsに移動

**対象ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffect.js`

SkillEffectUnit.jsの全クラスとインスタンスをSkillEffect.jsに移動する。配置位置は以下の順序制約を満たす必要がある:

1. `EnvUnitNode`定義（386行目付近）の後
2. `UnitsNode`定義（520行目付近）の後
3. `SingleEffectNode`定義（2837行目付近）の後
4. `ARE_TARGET_AND_SKILL_OWNERS_HAS_SAME_TITLE_NODE`定義（9160行目付近）の後
5. `IF_ELSE_EFFECT`定義（5596行目付近）の後
6. `IS_IN_COMBAT_PHASE_NODE`定義（8493行目付近）の後

実質的に、SkillEffectUnit.jsの内容は **ファイル末尾のexport文の直前** に配置するのが最も安全。これは全ての依存シンボルが既に定義された後の位置になる。

**移動する内容**（SkillEffectUnit.js 1行目〜422行目）:
- `SkillOwnerUnitNode`クラスと`SKILL_OWNER`定数
- `TextUnitNode`クラスと`UNIT`定数
- `TextFoeNode`クラスと`FOE`, `TARGET_FOE`定数
- `TextAllyNode`クラスと`ALLY`定数
- `TargetAllyNode`クラスと`TARGET_ALLY`定数
- `TextTargetNode`クラスと`TARGET`定数
- `ALLIES`, `ALLIES_FROM_SAME_TITLES_AS_UNIT`, `ALLIES_ON_MAP`, `FOES`, `SUPPORT_PARTNERS`定数
- `UnitsWithinNode`クラスと`ALLIES_WITHIN`, `FOES_WITHIN`定数
- `CLOSEST_FOES`定数
- `makeUnitFieldOperators`関数
- `CallUnitFuncNode`クラス
- `BONUS_DURING_COMBAT`, `GRANTS_BONUS_DURING_COMBAT`, `GRANTS_BONUS_ON_MAP`, `GRANTS_BONUS`
- `PENALTY_DURING_COMBAT`, `INFLICTS_PENALTY_DURING_COMBAT`, `INFLICTS_PENALTY_ON_MAP`, `INFLICTS_PENALTY`
- `CALL_UNIT_FUNC`定数
- `NEUTRALIZES_N_PENALTY_EFFECTS`
- `GRANTS_STATUS_EFFECTS`, `INFLICTS_STATUS_EFFECTS`
- `NEUTRALIZES_STAT_PENALTIES`, `RE_ENABLES_CANTO`
- `CANTO_HAS_ALREADY_BEEN_TRIGGERED`, `MOVE_TYPE`, `WEAPON_TYPE`, `RANGE`, `ON_MAP`
- `GeneralGrantsAnotherActionNode`クラスと`GRANTS_ANOTHER_ACTION`

**注意**: 移動するコードはSkillEffectField.jsのシンボル（`SkillEffectField`, `GetSkillEffectFieldNode`, `ModSkillEffectFieldNode`）にも依存している。Section 3（SkillEffectField.js統合）が未完了の段階では、これらのシンボルはSkillEffect.js内にまだ存在しない。

対処方法は2つ:
1. **Section 2とSection 3を連続して実行** し、両方の統合を完了させてからテストする
2. SkillEffectField.jsからのimportを一時的にSkillEffect.jsに追加する（`import { SkillEffectField, GetSkillEffectFieldNode, ModSkillEffectFieldNode } from './SkillEffectField.js'`）

推奨は方法1。Section 3はSection 2と同様のパターンで188行のみのため、連続作業が効率的。

### Step 2: SkillEffect.jsのself-importを削除

SkillEffect.jsの14行目にある以下のimport文を削除する:

```javascript
import { ALLIES, GRANTS_BONUS, GRANTS_STATUS_EFFECTS, INFLICTS_PENALTY, INFLICTS_STATUS_EFFECTS, MOVE_TYPE, UNIT, WEAPON_TYPE } from './SkillEffectUnit.js';
```

統合後はこれらのシンボルが同一ファイル内で定義されるため、importは不要。

### Step 3: SkillEffect.jsのexport文に統合シンボルを追加

SkillEffectUnit.jsのexport文（424-426行目）に含まれる全シンボルをSkillEffect.jsのexport文に追加する。追加するシンボル一覧:

```
SkillOwnerUnitNode, SKILL_OWNER, TextUnitNode, UNIT, TextFoeNode, FOE, TARGET_FOE,
TextAllyNode, ALLY, TargetAllyNode, TARGET_ALLY, TextTargetNode, TARGET, ALLIES,
ALLIES_FROM_SAME_TITLES_AS_UNIT, ALLIES_ON_MAP, FOES, SUPPORT_PARTNERS,
UnitsWithinNode, ALLIES_WITHIN, FOES_WITHIN, CLOSEST_FOES, makeUnitFieldOperators,
CallUnitFuncNode, BONUS_DURING_COMBAT, GRANTS_BONUS_DURING_COMBAT,
GRANTS_BONUS_ON_MAP, GRANTS_BONUS, PENALTY_DURING_COMBAT,
INFLICTS_PENALTY_DURING_COMBAT, INFLICTS_PENALTY_ON_MAP, INFLICTS_PENALTY,
CALL_UNIT_FUNC, NEUTRALIZES_N_PENALTY_EFFECTS, GRANTS_STATUS_EFFECTS,
INFLICTS_STATUS_EFFECTS, NEUTRALIZES_STAT_PENALTIES, RE_ENABLES_CANTO,
CANTO_HAS_ALREADY_BEEN_TRIGGERED, MOVE_TYPE, WEAPON_TYPE, RANGE, ON_MAP,
GeneralGrantsAnotherActionNode, GRANTS_ANOTHER_ACTION
```

### Step 4: SkillEffectUnit.jsをre-exportファイルに変換

**対象ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectUnit.js`

SkillEffectUnit.jsの全内容を削除し、SkillEffect.jsからのre-exportのみにする。

**重要: `filterImportExport`との互換性**

現在の`filterImportExport`は以下のパターンのみ処理する:
- `^import ` で始まる行を除去
- `^export {` で始まる行を除去
- `^export (function|class|const|let|var)` の`export`を除去

`export * from './SkillEffect.js'`や`export { X } from './SkillEffect.js'`は**処理できない**（`export {`は除去されるが`from`句が残る、または`export *`が未対応）。

**対処方法**: re-exportファイルの形式を`filterImportExport`が正しく処理できるようにする。具体的には:

Option A: `filterImportExport`の正規表現を拡張して`export * from`と`export { ... } from`に対応する
Option B: re-exportを`import` + `export { }`の2行に分けて書く（現行のfilterで両方除去される）

Option Bが安全（filterImportExportの変更を最小限にできる）:

```javascript
import { SkillOwnerUnitNode, SKILL_OWNER, TextUnitNode, UNIT, /* ... */ } from './SkillEffect.js';
export { SkillOwnerUnitNode, SKILL_OWNER, TextUnitNode, UNIT, /* ... */ };
```

この形式なら`filterImportExport`は`import`行を除去し、`export {`行を除去するため、連結時に空文字列になり問題ない。

Option Aを選ぶ場合は`filterImportExport`を以下のように拡張:

```javascript
function filterImportExport(content) {
    return content
        .split('\n')
        .filter(line => !(
            /^import /.test(line) ||
            /^export \{/.test(line) ||
            /^export \* from/.test(line)
        ))
        .map(line => line.replace(/^export (function|class|const|let|var) /, '$1 '))
        .join('\n');
}
```

**Section 1の調査結果に基づき方針を決定すること。**

### Step 5: 他ファイルのimportパス更新

SkillEffectUnit.jsをimportしている他ファイル（re-export経由でも動作するが直接importが望ましい）:

1. **SkillEffect.js** (14行目) -- Step 2で削除済み
2. **各`*Main.js`ファイル** -- side-effect import（`import './SkillEffectUnit.js'`）が以下の7ファイルに存在:
   - `ArenaSimulatorMain.js`
   - `SummonerDuelsSimulatorMain.js`
   - `UnitBuilderMain.js`
   - `StatusCalcMain.js`
   - `HeroIconListerMain.js`
   - `HeroStatusClustererMain.js`
   - `AetherRaidSimulatorMain.js`
   - `DamageCalculatorMain.js`

`*Main.js`のside-effect importは、SkillEffectUnit.jsがre-exportファイルになった後も動作する（re-exportファイルをimportすると、元のSkillEffect.jsのモジュール評価が行われる）。ただし、将来的にはre-exportファイルへの依存を減らすため、`import './SkillEffect.js'`に変更するか、SkillEffectUnit.jsのside-effect importを削除することが望ましい。

**この段階では`*Main.js`の変更は任意。** re-exportファイルが正しく動作していれば互換性は維持される。

## Verification

実装完了後に以下を確認:

1. `npm test` で全テストがパスすること（連結方式がまだ動作中のため）
2. `npx madge --circular Sources/` でSkillEffect.js ↔ SkillEffectUnit.js間の循環が解消されていること
3. 新規テスト `MergeSkillEffectUnit.test.js` がパスすること
4. SkillEffectUnit.jsのre-exportファイルが正しく動作すること

## 実装結果

Section 2とSection 3を同時に実施（SkillEffectUnit.jsがSkillEffectField.jsシンボルに依存するため）。

### 実施内容
- SkillEffectField.js（188行）の全内容をSkillEffect.jsのexportブロック直前に移動
- SkillEffectUnit.js（427行）の全内容をその後に配置
- SkillEffect.jsのSkillEffectUnit.jsからのself-import（旧14行目）を削除
- 新しいexport文を追加（SkillEffectField: 4シンボル、SkillEffectUnit: 42シンボル）
- 両ファイルをre-exportファイルに変換（import + export {} の2行形式でfilterImportExport互換）
- vitest.setup.jsのfilterImportExport変更は不要（re-export形式がOption B準拠のため）

### 検証結果
- `npm test`: 591/592 pass（DamageCalculator_HeroBattleTestのtimeoutは既存問題）
- `npx madge --circular`: 循環依存 0件
- 新規テスト MergeSkillEffectUnit.test.js: 6テスト全pass

### 未解決（意図的）
- `Unit`と`StatFlags`はSkillEffect.jsにimportされていない。Section 06-10で対応予定。
  現在は連結方式のグローバルスコープで動作。

## Files Modified (実際)

| File | Action |
|------|--------|
| Sources/SkillEffect.js | +620行（SkillEffectField+SkillEffectUnit内容統合、export追加、self-import削除） |
| Sources/SkillEffectField.js | re-exportファイルに変換（2行） |
| Sources/SkillEffectUnit.js | re-exportファイルに変換（6行） |
| Tests/MergeSkillEffectUnit.test.js | 新規作成（6テスト） |