Now I have all the context I need to write the section. Let me produce the output.

# Section 08: Stage G -- スキル実装（副作用モジュール）のESM化

## 概要

スキル実装の副作用モジュール群（`CustomSkill.js`, `SkillImpl.js`, `SkillImpl202408.js`, `SkillImpl202501.js`, `SkillImpl202601.js`）に `import` / `export` 文を追加し、ESモジュール化する。

これらのファイルは主に「副作用モジュール」であり、スキルIDをグローバルなフックやマップに登録するコードが主体である。多くのファイルは export 不要（副作用のみ）だが、`CustomSkill.js` は `CustomSkill` クラスを外部から参照するため export が必要。また、`SkillImpl.js` が定義するグローバルマップ（`applySkillEffectForUnitFuncMap` 等）がある場合はそれも export が必要。

## 依存セクション

- **section-03-stage-b-constants** (完了前提): `SkillConstants.js` が export 済みであること
- **section-06-stage-e-skill-dsl** (完了前提): `SkillEffectAliases.js`, `SkillEffectRegistrar.js`, `SkillEffectHooks.js` 等が export 済みであること
- **section-07-stage-f-core** (完了前提): `Unit.js`, `BattleContext.js`, `BattleMap.js` 等が export 済みであること

## 対象ファイル

| ファイル | パス | 種類 | export の要否 |
|---------|------|------|--------------|
| CustomSkill.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/CustomSkill.js` | カスタムスキルUI登録 | **要** (`CustomSkill` クラス) |
| SkillImpl.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl.js` | レガシースキル実装 | 要調査（グローバルマップ定義がある場合） |
| SkillImpl202408.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202408.js` | 2024-08+ スキル実装 | **不要**（副作用のみ） |
| SkillImpl202501.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202501.js` | 2025-01+ スキル実装 | **不要**（副作用のみ） |
| SkillImpl202601.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202601.js` | 2026-01+ スキル実装 | **不要**（副作用のみ） |

## テスト（実装前に確認）

以下のテストは既存のスモークテスト（`Tests/SmokeTest.test.js`）でカバーされている。各ファイル変換後に `./run_tests.sh` を実行し、全テストがパスすることを確認する。

### テスト: 副作用の登録

```
# Test: SkillImpl.js -- 代表スキル（Weapon.QuietingAntler）が登録されている（スモークテスト既存）
# Test: SkillImpl202408.js -- 代表スキル（Weapon.LadysBow）が登録されている（スモークテスト既存）
# Test: SkillImpl202501.js -- 代表スキル（Weapon.DongJiNoshiRiPlus）が登録されている（スモークテスト既存）
# Test: SkillImpl202601.js -- 代表スキル（Weapon.HeroicMaltet）が登録されている（スモークテスト既存）
# Test: 戦闘実行が正常動作する（スモークテスト既存）
```

具体的には、`Tests/SmokeTest.test.js` の「スキル登録の整合性」セクション（107-132行目）で以下を検証している:

- 各 SkillImpl ファイルの代表スキルIDが `Weapon` 等の定数オブジェクトに定義されている
- `AT_START_OF_COMBAT_HOOKS` にスキルが登録されている
- 代表スキルを持つユニットで戦闘が正常に動作する

### 回帰テスト

各ファイルの変換後に全テストスイート（305テスト + スモークテスト）を実行して回帰がないことを確認する。SkillImpl ファイルの副作用登録が壊れると、スキル効果テスト（`Tests/SkillRegression.test.js`, `Tests/CombatFlow.test.js` 等）で回帰が検出される。

## 実装手順

### 手順 1: 依存関係の特定

各ファイルで使用している外部シンボルを特定する。以下は代表的な依存関係。

**CustomSkill.js の依存:**
- `NONE_ID` -- `GlobalDefinitions.js` から
- `SkillEffectNode`, `NumberNode`, `StatsNode` 等 -- `SkillEffect.js` 系から
- `AT_START_OF_COMBAT_HOOKS`, `AFTER_COMBAT_HOOKS` 等 -- `SkillEffectHooks.js` から
- `GRANTS_BONUS`, `INFLICTS_PENALTY` 等のDSL関数 -- `SkillEffectAliases.js` から
- `MultiValueMap` -- `SkillEffectCore.js` から

**SkillImpl.js の依存:**
- `PassiveB`, `Special`, `Weapon`, `PassiveA`, `PassiveC` -- `SkillConstants.js` から
- `StatusEffectType` -- `HeroInfoConstants.js` から
- `applySkillEffectForUnitFuncMap`, `hasTransformSkillsFuncMap` 等のグローバルマップ -- `DamageCalculatorWrapper.js` / `BeginningOfTurnSkillHandler.js` 等から（Stage H で export される予定）
- `NORMAL_ATTACK_SPECIAL_SET`, `COUNT2_SPECIALS` 等 -- 同上
- `BEAST_COMMON_SKILL_MAP`, `WEAPON_TYPES_ADD_ATK2_AFTER_TRANSFORM_SET` 等 -- 同上

**SkillImpl202408.js, SkillImpl202501.js, SkillImpl202601.js の依存:**
- `Weapon`, `Special`, `PassiveA`, `PassiveB`, `PassiveC` -- `SkillConstants.js` から
- `SkillEffectRegistrar` -- `SkillEffectRegistrar.js` から
- `TRUE_NODE`, `GRANTS_BONUS`, `ATK_SPD`, `UNIT`, `FOE` 等 -- `SkillEffectAliases.js` から
- `AT_START_OF_COMBAT_HOOKS`, `AFTER_COMBAT_HOOKS` 等 -- `SkillEffectHooks.js` から
- 各種 DSL ノードクラス -- `SkillEffect.js` 系から

### 手順 2: import 文の追加

各ファイルの先頭に必要な import 文を追加する。**1行ルール**を厳守（複数行にまたがる import は禁止）。

**注意点**: SkillImpl ファイルで参照するグローバルマップ（`applySkillEffectForUnitFuncMap` 等）は Stage H の `DamageCalculatorWrapper.js` / `BeginningOfTurnSkillHandler.js` で export される。Stage H が未完了の段階では、これらの import は「結合時に除去される」ため問題にならないが、import 文としては正しいパスを記述しておく。

実装時の import 文の例:

**SkillImpl202601.js** の先頭（参考例）:
```javascript
import { Weapon, Special, PassiveA, PassiveB, PassiveC, Support, Captain } from './SkillConstants.js';
import { StatusEffectType } from './HeroInfoConstants.js';
import { SkillEffectRegistrar } from './SkillEffectRegistrar.js';
import { TRUE_NODE, GRANTS_BONUS, ATK_SPD, ATK_SPD_DEF_RES, UNIT, FOE, IF_NODE, DEALS_DAMAGE, REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY, INFLICTS_PENALTY, REDUCES_DAMAGE_FROM_FOES_SPECIALS_BY } from './SkillEffectAliases.js';
import { AT_START_OF_COMBAT_HOOKS, AFTER_COMBAT_HOOKS, BEFORE_AOE_SPECIAL_HOOKS, AFTER_COMBAT_IF_UNIT_ATTACKED_HOOKS } from './SkillEffectHooks.js';
import { SkillEffectNode, NODE_FUNC } from './SkillEffect.js';
```

**重要**: 実際の import 対象は各ファイル内で使用されているシンボルを精査して決定すること。上記はあくまで構造の例。特に `SkillEffectAliases.js` からの import は非常に多くのシンボルを含む可能性があるが、必ず1行で記述する。

**SkillImpl.js** の先頭（参考例）:
```javascript
import { Weapon, Special, PassiveA, PassiveB, PassiveC, Support, WeaponType } from './SkillConstants.js';
import { StatusEffectType, MoveType } from './HeroInfoConstants.js';
```

SkillImpl.js はレガシーコードで、グローバルマップ（`applySkillEffectForUnitFuncMap` 等）を直接使用している。これらのマップの import 元は Stage H で決まるため、Stage H 完了後に正確な import パスを確定する。

### 手順 3: export 文の追加

**CustomSkill.js**: ファイル末尾に export を追加。

```javascript
export { CustomSkill };
```

**SkillImpl.js**: ファイル内でトップレベルに定義されているグローバル変数（Map や Set）を特定し、export する。SkillImpl.js は副作用コード（ブロックスコープ `{}` 内のスキル登録）が大部分だが、ファイル外から参照されるシンボルがある場合は export が必要。

実装時に確認すべきポイント:
- `SkillImpl.js` 内で `let` / `const` / `var` でトップレベルに宣言されている変数を洗い出す
- それらが他のファイル（`DamageCalculatorWrapper.js`, `BeginningOfTurnSkillHandler.js` 等）から参照されているか確認する
- 参照されているものを `export { ... };` に含める

**SkillImpl202408.js, SkillImpl202501.js, SkillImpl202601.js**: export 不要。これらは純粋な副作用モジュール（スキルをフックやマップに登録するだけ）であり、外部に公開するシンボルはない。

### 手順 4: 変換順序

1. **CustomSkill.js** を最初に変換（独立したクラス定義）
2. **SkillImpl.js** を変換（レガシーコード、グローバルマップの export 判断を含む）
3. **SkillImpl202408.js** を変換
4. **SkillImpl202501.js** を変換
5. **SkillImpl202601.js** を変換

各ファイル変換後に `./run_tests.sh` を実行。

### 手順 5: テスト実行と検証

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
./run_tests.sh
```

全テストがパスすることを確認。特に以下のテストカテゴリに注目:
- `SmokeTest`: スキル登録の整合性（各 SkillImpl のスキルが登録されていること）
- `SkillRegression`: スキル効果の回帰テスト
- `CombatFlow`: 戦闘フローのテスト

## 副作用モジュールの扱いに関する補足

SkillImpl ファイル群はスキルをグローバルなフック/マップに登録する「副作用」コードが主体。ESM 化後の import は以下のパターンになる:

```javascript
// SkillImpl202601.js
// import 文で依存を宣言（結合時はフィルタで除去される）
import { Weapon, Special, PassiveA } from './SkillConstants.js';
import { SkillEffectRegistrar } from './SkillEffectRegistrar.js';
import { TRUE_NODE, GRANTS_BONUS, ATK_SPD, UNIT, FOE } from './SkillEffectAliases.js';

// 既存のスキル登録コードはそのまま（変更不要）
{
    const skillId = Weapon.HeroicMaltet;
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        GRANTS_BONUS(ATK_SPD_DEF_RES(10)).to(UNIT),
    );
}
```

export は不要（副作用のみのモジュール）。ただし ESM ローダーがモジュールを実行するためには、エントリポイントから `import './SkillImpl202601.js';` のように副作用 import される必要がある（Phase 3 で対応）。

## update_skills ブランチとのコンフリクト対策

SkillImpl ファイルは `update_skills` ブランチで頻繁に更新される（新スキルの追加はファイル末尾）。ESM 化で追加する import 文はファイル先頭に集約されるため、コンフリクトは先頭部分（import 文の追加）でのみ発生し、解消は容易（import 行をマージするだけ）。

## コーディング規約の再確認

- **import は必ず1行で記述**。複数行にまたがる import は禁止（結合時のフィルタが行単位のため）。
- **export は末尾まとめ `export { ... };`** に統一。インライン export（`export class`, `export function`）は禁止。
- **export が不要なファイル**（副作用のみ）には export 文を追加しない。

## 完了基準

1. 5ファイル全てに適切な import 文が追加されている
2. CustomSkill.js に `export { CustomSkill };` が追加されている
3. SkillImpl.js の外部参照シンボルが export されている（該当する場合）
4. `./run_tests.sh` で全テストがパス
5. `npm run build` で出力が正常

## 実装結果

### 各ファイルの変更内容

1. **CustomSkill.js**: 7行のimport文追加（SkillConstants, SkillEffectCore, SkillEffectHooks, SkillEffect, Skill, Tile, UnitConstants）、`export { CustomSkill };` 追加
2. **SkillImpl.js**: 31行のimport文追加（SkillConstants, Skill, HeroInfoConstants から ~70 funcMapを含む）、export なし（純粋な副作用モジュール、setLanternは内部関数のみ）
3. **SkillImpl202408.js**: 8行のimport文追加、export なし（副作用モジュール）
4. **SkillImpl202501.js**: 9行のimport文追加、export なし（副作用モジュール）
5. **SkillImpl202601.js**: 9行のimport文追加、export なし（副作用モジュール）

### 計画との差異

- **StatusEffectType の import 元**: 計画では HeroInfoConstants.js だが、実際の定義・export は Skill.js にある
- **funcMap の import 元**: 計画では DamageCalculatorWrapper.js / BeginningOfTurnSkillHandler.js だが、実際の定義・export は Skill.js にある
- **SkillImpl.js の export**: 計画では「要調査」だったが、唯一のトップレベル関数 setLantern は内部使用のみで export 不要

### テスト結果

全310テストパス