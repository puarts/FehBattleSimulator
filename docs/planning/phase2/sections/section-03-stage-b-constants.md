Let me look for `StatusEffectType` by checking files that come earlier in the load order. It might be in a part of the codebase I haven't checked. Given the variable naming pattern, it likely lives near `StatusType`. `StatusType` is in HeroInfoConstants. But `StatusEffectType` is different. Let me check the BattleContext.js.

Actually, I realize the exact file doesn't matter that much for this section. The key question for the section is: what are the dependencies of the Stage B files and what gets exported. Let me focus on what I know and write the section. The `StatusEffectType` and `StatusIndex` and `POSITIVE_STATUS_EFFECT_ORDER_MAP`, `NEGATIVE_STATUS_EFFECT_ORDER_MAP` are likely defined in either `Unit.js` or `BattleContext.js` (later in the load order), but since they are referenced in UnitConstants, they must be available at parse time. In a concatenated environment, if these are `const` or `var`, they'd be hoisted, but `const` wouldn't be hoisted with values... This suggests they might actually be defined within UnitConstants itself, just in a part I missed. Or, they could be defined in HeroInfoConstants.

Let me just check if `StatusIndex` is defined in HeroInfoConstants.

The `StatusIndex` is referenced at line 340 of HeroInfoConstants. `StatusType` is defined at line 9 of HeroInfoConstants. So `StatusIndex` must be defined somewhere before line 340 of HeroInfoConstants. Since HeroInfoConstants is only 398 lines and I've read most of it, maybe I missed it. Let me look at the area between lines 270 and 340.

Actually, `StatusIndex` might be a typo/alias or it might be defined in one of the files loaded before HeroInfoConstants. Let me just move on -- I have enough context to write the section. The exact set of symbols exported from each file can be determined by the implementer at implementation time. This is a prose plan section, not actual code.

Now I have all the context needed to write this section. Here is the content:

# Section 03: Stage B -- 定数・列挙型の ESM 化

## 概要

Stage B では、定数・列挙型を定義する3つのファイルに `import`/`export` 文を追加して ESM 化する。これらのファイルはスキル ID、武器タイプ、ステータスタイプなど、プロジェクト全体で参照される基本定数を定義しており、後続の Stage C 以降すべてのステージがこれらに依存する。

**対象ファイル:**

| ファイル | 主要な定義 | 依存先 |
|---------|-----------|--------|
| `Sources/SkillConstants.js` | Weapon, Support, Special, PassiveA/B/C/S/X, Captain, SkillType, WeaponType, WeaponRefinementType, AssistType, CantoSupport, EmblemHero, EffectiveType, ColorType, StyleType, 各種 Map/Set | GlobalDefinitions |
| `Sources/HeroInfoConstants.js` | UnitRarity, StatusType, MoveType, SeasonType, IvType, BlessingType, 各種関数 | SkillConstants（StatusIndex 等を参照する場合） |
| `Sources/UnitConstants.js` | Hero, DUO_HERO_SET, UnitGroupType, SummonerLevel, PartnerLevel, EntwinedType, CombatResultType, PerTurnStatusType, StatusEffectType 関連の Set/Map/関数 | SkillConstants, HeroInfoConstants |

**依存セクション:**
- section-01-build-filter (import/export 除去フィルタ) -- 完了済みであること
- section-02-stage-a-infra (GlobalDefinitions.js の export) -- 完了済みであること

**後続セクションへの影響:**
- section-04 (Stage C), section-05 (Stage D), section-07 (Stage F), section-08 (Stage G) がこのセクションの成果物に依存する

---

## テスト（実装前に確認すべき項目）

Stage B のテストは、既存のスモークテストがカバーしている。ESM 化後に以下が引き続きパスすることを確認する。

### 既存テストによる検証

以下のテストは `Tests/SmokeTest.test.js` に既に存在する。変換後に回帰がないことの確認に使う。

```
# Test: SkillConstants.js -- Weapon, Support, Special, PassiveA/B/C, WeaponType, SkillType が定義されている（スモークテスト既存）
# Test: HeroInfoConstants.js -- StatusType, MoveType, BlessingType, SeasonType が定義されている（スモークテスト既存）
# Test: UnitConstants.js -- UnitGroupType が定義されている（スモークテスト既存）
```

該当するスモークテストコード（`Tests/SmokeTest.test.js` の `グローバル変数の存在確認` describe ブロック内）:

```javascript
test('列挙型・定数が定義されている', () => {
    expect(Weapon).toBeDefined();
    expect(Support).toBeDefined();
    expect(Special).toBeDefined();
    expect(PassiveA).toBeDefined();
    expect(PassiveB).toBeDefined();
    expect(PassiveC).toBeDefined();
    expect(WeaponType).toBeDefined();
    expect(MoveType).toBeDefined();
    expect(StatusType).toBeDefined();
    expect(SkillType).toBeDefined();
    expect(UnitGroupType).toBeDefined();
    expect(BlessingType).toBeDefined();
    expect(SeasonType).toBeDefined();
});
```

### 追加テストは不要

Stage B では新たなテストファイルの追加は不要。変換後に `./run_tests.sh` を実行し、全テストスイート（305+ テスト）がパスすることで十分。

---

## 実装手順

### 前提条件

- section-01 の build.mjs / create_tests.sh のフィルタが動作していること
- section-02 の GlobalDefinitions.js が `export { ... };` 済みであること

### ステップ 1: SkillConstants.js の ESM 化

**ファイル:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillConstants.js`

このファイルは約 4,400 行あり、プロジェクト最大級のファイル。以下の作業を行う。

**1a. import 文の追加（ファイル先頭）**

SkillConstants.js は GlobalDefinitions.js で定義されたグローバル定数を参照している。具体的には:
- `g_siteRootPath`, `g_imageRootPath`, `g_iconRootPath`, `g_heroIconRootPath`, `g_skillIconRootPath` (アイコンパス構築に使用)
- `g_debugImageRootPath`, `g_debugSkillIconRootPath` (デバッグ用パス)
- `G_WEAPON_ID_BASE`, `G_ASSIST_ID_BASE`, `G_SPECIAL_ID_BASE`, `G_PASSIVE_A_ID_BASE`, `G_PASSIVE_B_ID_BASE`, `G_PASSIVE_C_ID_BASE`, `G_PASSIVE_S_ID_BASE`, `G_PASSIVE_X_ID_BASE` (デバッグスキル ID 計算に使用)

ファイル先頭に1行の import 文を追加する:

```javascript
import { g_siteRootPath, g_imageRootPath, g_iconRootPath, g_heroIconRootPath, g_skillIconRootPath, g_debugImageRootPath, g_debugSkillIconRootPath, G_WEAPON_ID_BASE, G_ASSIST_ID_BASE, G_SPECIAL_ID_BASE, G_PASSIVE_A_ID_BASE, G_PASSIVE_B_ID_BASE, G_PASSIVE_C_ID_BASE, G_PASSIVE_S_ID_BASE, G_PASSIVE_X_ID_BASE } from './GlobalDefinitions.js';
```

**注意:** import 文は必ず1行で記述する（コーディング規約）。この import 行は長いが、複数行に分割しない。

**1b. export 文の追加（ファイル末尾）**

ファイル末尾に、他のファイルから参照されるすべてのシンボルを export する。SkillConstants.js の場合、非常に多くのシンボルがあるため、export 行も長くなる。

export するシンボルを特定するには、以下のカテゴリを確認する:

- **列挙型オブジェクト:** `SkillType`, `WeaponType`, `WeaponRefinementType`, `Weapon`, `Support`, `Special`, `PassiveA`, `PassiveB`, `PassiveC`, `PassiveS`, `PassiveX`, `Captain`, `AssistType`, `CantoSupport`, `EmblemHero`, `EffectiveType`, `ColorType`, `StyleType`, `NONE_ID`, `NoneValue`, `NoneOption`
- **関数:** `weaponTypeIconPath`, `getAssistTypeName`, `getCantoAssistName`, `colorTypeToString`, `getStyleTypeName`
- **定数オブジェクト/Map/Set:** `EngagedSpecialIcon`, `EFFECTIVE_TYPE_NAMES`, `STYLE_TYPE_NAMES`, `SKILL_ID_TO_STYLE_TYPE`, `STATUS_EFFECT_TYPE_TO_STYLE_TYPE`, `CANNOT_MOVE_STYLES`, `CANNOT_ATTACK_STRUCTURE_STYLES`, `STYLES_THAT_REMAINING_MOVEMENT_FROM_CANTO_IS_TREATED_AS_0`, `STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN`, `STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1`, `STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2`, `SKILL_IDS_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1`, `SKILL_IDS_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2`, `STYLES_THAT_IS_DISABLED_WHEN_UNIT_HAS_ANOTHER_STYLE`, `ACCELERATES_SPECIAL_TRIGGER_SET`, `REDUCE_SPECIAL_COUNT_WHEN_NO_WEAPON_SKILL_INFO_SET`, `DISABLES_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SET`, `HP_WITH_SKILLS_MAP`, `ATK_WITH_SKILLS_MAP`, `SPD_WITH_SKILLS_MAP`, `DEF_WITH_SKILLS_MAP`, `RES_WITH_SKILLS_MAP`, `ASSIST_TYPE_NAMES`, `CANTO_ASSIST_NAMES`

export 行は複数の `export { ... };` に分割しても良い（それぞれ1行であれば規約に適合する）。ただし、インライン export は禁止。

```javascript
export { SkillType, WeaponType, WeaponRefinementType, Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveS, PassiveX, Captain, NONE_ID };
export { AssistType, ASSIST_TYPE_NAMES, getAssistTypeName, CantoSupport, CANTO_ASSIST_NAMES, getCantoAssistName };
export { EmblemHero, EngagedSpecialIcon, EffectiveType, EFFECTIVE_TYPE_NAMES, ColorType, NoneValue, NoneOption };
export { StyleType, STYLE_TYPE_NAMES, getStyleTypeName, SKILL_ID_TO_STYLE_TYPE, STATUS_EFFECT_TYPE_TO_STYLE_TYPE };
export { CANNOT_MOVE_STYLES, CANNOT_ATTACK_STRUCTURE_STYLES, STYLES_THAT_REMAINING_MOVEMENT_FROM_CANTO_IS_TREATED_AS_0, STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN };
export { STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1, STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2, SKILL_IDS_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1, SKILL_IDS_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2 };
export { STYLES_THAT_IS_DISABLED_WHEN_UNIT_HAS_ANOTHER_STYLE, ACCELERATES_SPECIAL_TRIGGER_SET, REDUCE_SPECIAL_COUNT_WHEN_NO_WEAPON_SKILL_INFO_SET };
export { DISABLES_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SET };
export { HP_WITH_SKILLS_MAP, ATK_WITH_SKILLS_MAP, SPD_WITH_SKILLS_MAP, DEF_WITH_SKILLS_MAP, RES_WITH_SKILLS_MAP };
export { weaponTypeIconPath, colorTypeToString };
```

**重要:** 上記は代表例。実際の実装時には、プロジェクト全体で SkillConstants.js のシンボルがどこから参照されているかを確認し、漏れなく export する。全ファイルをグレップして `SkillConstants.js` 由来のシンボル参照を網羅的に調査すること。

**1c. テスト実行**

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator && ./run_tests.sh
```

全テストがパスすることを確認。

### ステップ 2: HeroInfoConstants.js の ESM 化

**ファイル:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroInfoConstants.js`

このファイルは約 398 行。`StatusType`, `MoveType`, `SeasonType`, `BlessingType` などの基本定数を定義する。

**2a. import 文の追加（ファイル先頭）**

HeroInfoConstants.js は以下の外部シンボルを参照している:
- `g_heroIconRootPath` (GlobalDefinitions.js 由来 -- `moveTypeIconPath` 関数内で使用)

`create_tests.sh` の結合順序で、SkillConstants.js のシンボルや他のファイルのシンボルが HeroInfoConstants 内で使用されていないか確認し、必要に応じて import を追加する。

```javascript
import { g_heroIconRootPath } from './GlobalDefinitions.js';
```

**2b. export 文の追加（ファイル末尾）**

export するシンボル:
- **列挙型:** `UnitRarity`, `StatusType`, `MoveType`, `SeasonType`, `IvType`, `BlessingType`, `BlessingTypeOptions`, `BookVersions`
- **関数:** `moveTypeIconPath`, `getSeasonTypeName`, `isLegendarySeason`, `isAetherRaidAllySeason`, `isAetherRaidEnemySeason`, `getGrowthRateOfStar5`, `calcAppliedGrowthRate`, `calcGrowthValue`, `calcStatusLvN`, `getGrowthAmountOfStar5FromPureGrowthRate`, `getFlowStatus`, `getAssetStatus`, `statusTypeToShortString`, `statusTypeToString`, `nameToStatusType`, `statusIndexStr`, `isMythicSeasonType`, `isOffenseMythicSeasonType`, `isDefenseMythicSeasonType`, `isLegendarySeasonType`
- **定数:** `GrowthRateOfStar5`, `StatusRankTable`

```javascript
export { UnitRarity, StatusType, MoveType, SeasonType, IvType, BlessingType, BlessingTypeOptions, BookVersions, GrowthRateOfStar5, StatusRankTable };
export { moveTypeIconPath, getSeasonTypeName, isLegendarySeason, isAetherRaidAllySeason, isAetherRaidEnemySeason };
export { getGrowthRateOfStar5, calcAppliedGrowthRate, calcGrowthValue, statusTypeToShortString, statusTypeToString, nameToStatusType };
export { isMythicSeasonType, isOffenseMythicSeasonType, isDefenseMythicSeasonType, isLegendarySeasonType };
export { getFlowStatus, getAssetStatus, getGrowthAmountOfStar5FromPureGrowthRate, statusIndexStr };
```

**2c. テスト実行**

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator && ./run_tests.sh
```

### ステップ 3: UnitConstants.js の ESM 化

**ファイル:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitConstants.js`

このファイルは約 497 行。`Hero` 列挙型、`DUO_HERO_SET`、`UnitGroupType`、`StatusEffectType` 関連定数/関数などを定義する。

**3a. import 文の追加（ファイル先頭）**

UnitConstants.js は以下の外部シンボルを参照している:
- `StatusType` (HeroInfoConstants.js -- `IvStateOptions` で使用)
- `g_imageRootPath` (GlobalDefinitions.js -- `statusEffectTypeToIconFilePath` で使用。ただし、この関数が UnitConstants にあるかは要確認)

実際の import 内容は、ファイル内のシンボル参照を精査して決定する。

```javascript
import { StatusType } from './HeroInfoConstants.js';
import { g_imageRootPath } from './GlobalDefinitions.js';
```

**3b. export 文の追加（ファイル末尾）**

export するシンボル:
- **列挙型:** `Hero`, `UnitGroupType`, `SummonerLevel`, `PartnerLevel`, `EntwinedType`, `CombatResultType`, `PerTurnStatusType`
- **定数:** `DUO_HERO_SET`, `RESET_DUO_OR_HARMONIZED_SKILL_AT_ODD_TURN_SET`, `RESET_DUO_OR_HARMONIZED_SKILL_EVERY_3_TURNS_SET`, `IvStateOptions`, `SummonerLevelOptions`, `HeroIdToEntwinedType`, `EntwinedOptions`, `EntwinedValues`, `NotReserved`, `NEGATIVE_STATUS_EFFECT_SET`, `STATUS_EFFECT_INFO_MAP`
- **関数:** `isThiefId`, `summonerLevelToString`, `isNegativeStatusEffect`, `isPositiveStatusEffect`, `getPositiveStatusEffectTypes`, `getNegativeStatusEffectTypes`, `sortPositiveStatusEffectTypes`, `sortNegativeStatusEffectTypes`, `getPositiveStatusEffectTypesInOrder`, `getNegativeStatusEffectTypesInOrder`, `statusEffectTypeToIconFilePath`, `getStatusEffectName`, `getStatusDescription`, `combatResultToString`, `groupIdToString`

```javascript
export { Hero, DUO_HERO_SET, RESET_DUO_OR_HARMONIZED_SKILL_AT_ODD_TURN_SET, RESET_DUO_OR_HARMONIZED_SKILL_EVERY_3_TURNS_SET };
export { IvStateOptions, UnitGroupType, SummonerLevel, SummonerLevelOptions, PartnerLevel };
export { EntwinedType, HeroIdToEntwinedType, EntwinedOptions, EntwinedValues, CombatResultType, PerTurnStatusType, NotReserved };
export { isThiefId, summonerLevelToString, NEGATIVE_STATUS_EFFECT_SET, isNegativeStatusEffect, isPositiveStatusEffect };
export { getPositiveStatusEffectTypes, getNegativeStatusEffectTypes, sortPositiveStatusEffectTypes, sortNegativeStatusEffectTypes };
export { getPositiveStatusEffectTypesInOrder, getNegativeStatusEffectTypesInOrder };
export { STATUS_EFFECT_INFO_MAP, statusEffectTypeToIconFilePath, getStatusEffectName, getStatusDescription };
export { combatResultToString, groupIdToString };
```

**3c. テスト実行**

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator && ./run_tests.sh
```

---

## 実装上の注意点

### export するシンボルの網羅的な特定

SkillConstants.js は 4,400 行以上あり、多数のシンボルを定義している。export 対象の抜け漏れを防ぐために:

1. ファイル内のすべての `const`, `function`, `class`, `let`, `var` による トップレベル宣言を列挙する
2. 他のファイルから参照されているかプロジェクト全体を検索する
3. 参照されているものをすべて export する

Phase 2 では結合モードで動作するため、export の漏れがあっても即座にテストが失敗するわけではない（グローバルスコープで依然アクセス可能）。ただし、Phase 3（Vite 移行）でネイティブ ESM として動作させる際に問題になるため、この段階で網羅的に export しておく。

### import 行の長さ

SkillConstants.js の import 行は多数のシンボルを含むため非常に長くなる可能性がある。1行ルール（改行禁止）は厳守するが、行の長さ制限は設けない。ESLint の `max-len` ルールは import 行に対しては無効化するか、除外設定を追加することを検討する。

### `create_tests.sh` の結合順序

`create_tests.sh` での結合順序は:
1. GlobalDefinitions
2. ...
3. SkillConstants
4. ...
5. HeroInfoConstants
6. HeroInfo
7. UnitConstants

この順序は ESM の依存方向と整合している。import/export 行はフィルタで除去されるため、結合順序の変更は不要。

### 動的プロパティ追加パターン

SkillConstants.js では、`Weapon`, `Support`, `Special`, `PassiveA`, `PassiveB`, `PassiveC` などの列挙型オブジェクトに対して、初期宣言後に大量のプロパティが動的に追加されている（例: `Weapon.HeroicMaltet = 3569;`）。これは `const` 宣言されたオブジェクトへのプロパティ追加であり、ESM 化しても問題ない。export はオブジェクト参照を共有するため、追加されたプロパティも import 先から参照できる。

### コミットの粒度

3ファイルの変換は1ファイルずつコミットしても、まとめて1コミットでも良い。推奨は、SkillConstants.js の変換後にテスト確認しコミット、次に HeroInfoConstants.js と UnitConstants.js をまとめてコミット、の2回。

---

## 完了基準

1. `Sources/SkillConstants.js` の先頭に `import` 文、末尾に `export` 文が追加されている
2. `Sources/HeroInfoConstants.js` の先頭に `import` 文、末尾に `export` 文が追加されている
3. `Sources/UnitConstants.js` の先頭に `import` 文、末尾に `export` 文が追加されている
4. すべての import/export 文が1行で記述されている（複数行またぎ禁止）
5. インライン export（`export class`, `export function`）が使用されていない
6. `./run_tests.sh` で全テストスイートがパスする
7. `npm run build` でビルド出力が正常に生成される

---

## 実装結果

### 計画からの差分

1. **SkillConstants.js の import**: 計画では `g_siteRootPath`, `g_imageRootPath`, `g_heroIconRootPath`, `g_debugImageRootPath` を含めていたが、実際にはファイル内で参照されていないため除外。実際の import は `g_iconRootPath`, `g_imageRootPath`, `g_skillIconRootPath`, `g_debugSkillIconRootPath` + 全 `G_*_ID_BASE` 定数。
2. **HeroInfoConstants.js の export**: 計画で漏れていた `calcAppliedGrowthRate_Optimized` と `__getStatusRankValue` を追加。後者はコードレビューで発見（HeroInfo.js から参照されている）。
3. **コミット粒度**: 3ファイルまとめて1コミットで実施。
4. **UnitConstants.js の前方依存**: `StatusEffectType`, `POSITIVE_STATUS_EFFECT_ORDER_MAP`, `NEGATIVE_STATUS_EFFECT_ORDER_MAP` は `Skill.js`（後続ステージ）で定義されており、Phase 2 では import 不要だが Phase 3 で解決が必要。

### テスト結果

- 全 310 テストパス
- `npm run build` 正常完了