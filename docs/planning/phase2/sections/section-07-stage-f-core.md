Now I have all the information I need. Let me produce the section content.

# Section 07: Stage F -- コアゲームクラスのESM化

## 概要

このセクションでは、FEH Battle Simulator のコアゲームクラス群（BattleContext, GlobalBattleContext, UnitManager, Unit, BattleMap）に `import`/`export` 文を追加してESモジュール化する。Unit と DamageCalculator 間の循環依存の解析と解消もこのセクションのスコープに含まれる。

## 前提条件（依存セクション）

- **section-01-build-filter**: `build.mjs` と `create_tests.sh` に import/export 行除去フィルタが実装済み
- **section-03-stage-b-constants**: SkillConstants.js, HeroInfoConstants.js, UnitConstants.js がESM化済み
- **section-04-stage-c-data**: Tile.js, Structures.js, BattleMapSettings.js, TurnSetting.js, Skill.js がESM化済み
- **section-05-stage-d-info**: HeroInfo.js, SkillDatabase.js, HeroDatabase.js, SampleSkillInfos.js, SampleHeroInfos.js がESM化済み
- **section-02-stage-a-infra**: Utilities.js, Logger.js, BattleMapElement.js, GlobalDefinitions.js 等がESM化済み

## 対象ファイル

| ファイル | パス | 主要な定義 | 主要な依存 |
|---------|------|-----------|-----------|
| BattleContext.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleContext.js` | `BattleContext` クラス | Utilities (ObjectUtil), DamageCalculationUtility (実行時参照) |
| GlobalBattleContext.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/GlobalBattleContext.js` | `GlobalBattleContext` クラス | UnitConstants (UnitGroupType), SkillConstants (Captain), HeroInfoConstants (SeasonType) |
| UnitManager.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitManager.js` | `UnitManager`, `MaxEnemyUnitCount`, `MaxAllyUnitCount` | Unit, UnitConstants (UnitGroupType, MoveType) |
| Unit.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Unit.js` | `Unit`, `AttackableUnitInfo`, `AttackEvaluationContext`, `AssistableUnitInfo`, `ActionContext`, `PrecombatContext`, 各種ヘルパー関数 | BattleMapElement, HeroInfo, BattleContext, SkillConstants, HeroInfoConstants, UnitConstants, Tile |
| BattleMap.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleMap.js` | `BattleMap`, `MapType`, マップ定数群 | Tile, Structures, Unit, BattleMapSettings |

## テスト計画

### テスト1: Unit.js 変換後のユニット作成

既存テストが引き続きパスすることを確認する。特に `UnitBuilder.fromHero('マルス').build()` のようなユニット作成パターンが正常動作すること。これは既存テストスイート内のスモークテストおよびユニット作成テストでカバーされている。

```
# Test: Unit.js 変換後、UnitBuilder.fromHero('マルス').build() でユニット作成が正常動作
# 確認方法: ./run_tests.sh を実行し、全テストがパス
```

### テスト2: BattleContext.js 変換後の戦闘実行

BattleScenarioBuilder を使った戦闘実行テストが正常動作すること。

```
# Test: BattleContext.js 変換後、BattleScenarioBuilder で戦闘実行が正常動作
# 確認方法: ./run_tests.sh を実行し、combat カテゴリの全テストがパス
```

### テスト3: 循環依存の解消確認

Unit.js と DamageCalculator.js 間の循環依存が解消されていることは、最終的に section-11 でネイティブESMモードで検証する。このセクションでは結合モード（create_tests.sh）でのテストパスを確認する。

```
# Test: Unit.js と DamageCalculator.js 間の循環依存が解消されている
# 確認方法: Phase 2 完了時にネイティブ ESM で検証（section-11 で実施）
# このセクションでは ./run_tests.sh での全テストパスを確認
```

### 全テスト回帰確認

各ファイル変換後、必ず `./run_tests.sh` を実行して全305テスト + スモークテストがパスすることを確認する。

## 実装手順

### 手順の概要

1. 循環依存の解析を行い、解消方針を決定する
2. BattleContext.js を変換する（依存が最も少ない）
3. GlobalBattleContext.js を変換する
4. Unit.js を変換する（循環依存の解消を含む）
5. UnitManager.js を変換する
6. BattleMap.js を変換する
7. 各変換後にテストを実行して回帰がないことを確認する

### Step 1: 循環依存の解析

Unit.js と DamageCalculator.js（Stage H で変換予定）の間には循環依存の可能性がある。変換前に以下を解析する。

**Unit.js が DamageCalculator.js から使うもの:**
- `BattleContext` クラス内のメソッド `setDodgeInCombat` と `setResDodgeInCombat` が `DamageCalculationUtility.getDodgeDamageReductionRatio` / `getResDodgeDamageReductionRatio` を参照している
- ただしこれは BattleContext.js のファイル内であり、Unit.js 自体は DamageCalculator を直接参照していない可能性が高い

**DamageCalculator.js が Unit.js から使うもの:**
- `Unit` クラスのインスタンスを引数として受け取り、メソッド・プロパティを呼び出す（型参照として使用）

**解消方針:**
- ESM の循環依存は「初期化時に相手のエクスポートが `undefined` になる」問題。しかしこのプロジェクトでは Phase 2 の間は結合出力のみ使用するため、import/export 行は結合時に除去される。実際の ESM ローダーが循環を解決する必要はない
- BattleContext.js が `DamageCalculationUtility` を参照している箇所は、コールバック関数内（`getDamageReductionRatioFuncs.push` のコールバック）での参照であり、初期化時ではなく実行時の参照。ESM でも問題にならない（関数呼び出し時にはすべてのモジュールが初期化済み）
- Unit.js 自体は DamageCalculator.js を直接参照しておらず、DamageCalculator.js が Unit.js を参照するのは一方向。よって実際には循環依存は Unit ↔ DamageCalculator 間では軽微であり、import 文の追加順序を適切に管理すれば解消不要の可能性が高い
- もし初期化時の循環参照が見つかった場合は、共通の型/インターフェースを別ファイルに抽出するか、遅延参照（関数内で動的にアクセス）で解消する

### Step 2: BattleContext.js の変換

BattleContext.js は `BattleContext` クラスを定義する。依存は `ObjectUtil`（Utilities.js）と `DamageCalculationUtility`（実行時参照のみ）。

**ファイル先頭に追加する import 文:**

```javascript
import { ObjectUtil } from './Utilities.js';
import { DamageCalculationUtility } from './DamageCalculationUtility.js';
```

注意: `DamageCalculationUtility` への参照はコールバック関数内（`setDodgeInCombat` / `setResDodgeInCombat` メソッド内の `getDamageReductionRatioFuncs.push` のコールバック）のみ。初期化時には参照されないため、循環依存があっても ESM で問題にならない。

**ファイル末尾に追加する export 文:**

```javascript
export { BattleContext };
```

**変換後:** `./run_tests.sh` を実行して全テストパスを確認。

### Step 3: GlobalBattleContext.js の変換

GlobalBattleContext.js は `GlobalBattleContext` クラスを定義する。`UnitGroupType`、`Captain`、`SeasonType` を参照している。

**ファイル先頭に追加する import 文:**

```javascript
import { UnitGroupType } from './UnitConstants.js';
import { Captain } from './SkillConstants.js';
import { SeasonType } from './HeroInfoConstants.js';
```

注意: 実際のシンボル参照はファイル内容を精査して確定する。上記は代表的なもの。`UnitGroupType` はコンストラクタ内で即座に使用されるため、正しい import が必須。

**ファイル末尾に追加する export 文:**

```javascript
export { GlobalBattleContext };
```

**変換後:** `./run_tests.sh` を実行して全テストパスを確認。

### Step 4: Unit.js の変換

Unit.js はプロジェクト最大級のファイル（約7,425行）であり、多数のクラスと関数を定義している。

**定義されている主要シンボル:**
- クラス: `AttackableUnitInfo`, `AttackEvaluationContext`, `AssistableUnitInfo`, `ActionContext`, `PrecombatContext`, `Unit`
- 関数: `isThief`, `calcArenaBaseStatusScore`, `calcArenaTotalSpScore`, `canRefreshTo`, その他多数のヘルパー関数

**ファイル先頭に追加する import 文:**

```javascript
import { ObjectUtil } from './Utilities.js';
import { BattleMapElement } from './BattleMapElement.js';
import { BattleContext } from './BattleContext.js';
import { Weapon, Support, Special, PassiveA, PassiveB, PassiveC, Captain, WeaponType, SkillType, WeaponRefinementType } from './SkillConstants.js';
import { MoveType, StatusType, BlessingType, UnitRarity, SummonerLevel } from './HeroInfoConstants.js';
import { UnitGroupType, Hero } from './UnitConstants.js';
```

注意: 実際の import リストはファイル内で参照しているシンボルを網羅的に確認して決定する。上記は代表的なもの。1行ルールにより、import が非常に長くなる場合は複数の import 文に分割する（ただし各行は1行で完結させる）。

**ファイル末尾に追加する export 文:**

```javascript
export { Unit, AttackableUnitInfo, AttackEvaluationContext, AssistableUnitInfo, ActionContext, PrecombatContext, isThief, calcArenaBaseStatusScore, calcArenaTotalSpScore, canRefreshTo };
```

注意: export するシンボルは、他のファイルから参照されているもの全てを含める必要がある。ファイル内のヘルパー関数で他ファイルから参照されているものを漏らさないよう注意する。

**変換後:** `./run_tests.sh` を実行して全テストパスを確認。

### Step 5: UnitManager.js の変換

UnitManager.js は `UnitManager` クラスと定数 `MaxEnemyUnitCount`, `MaxAllyUnitCount` を定義する。

**ファイル先頭に追加する import 文:**

```javascript
import { Unit } from './Unit.js';
import { UnitGroupType } from './UnitConstants.js';
import { MoveType } from './HeroInfoConstants.js';
```

**ファイル末尾に追加する export 文:**

```javascript
export { UnitManager, MaxEnemyUnitCount, MaxAllyUnitCount };
```

**変換後:** `./run_tests.sh` を実行して全テストパスを確認。

### Step 6: BattleMap.js の変換

BattleMap.js は `BattleMap` クラスと `MapType` オブジェクト、およびマップ定数群を定義する大きなファイル（約3,666行）。

**ファイル先頭に追加する import 文:**

```javascript
import { Tile, TileType, DivineVeinType } from './Tile.js';
import { StructureBase, ObjType } from './Structures.js';
import { BattleMapSettings } from './BattleMapSettings.js';
import { Unit } from './Unit.js';
```

注意: BattleMapSettings.js に定義されている `changeMapKind` などの関数も参照している可能性があるため、精査が必要。

**ファイル末尾に追加する export 文:**

```javascript
export { BattleMap, MapType, MapType_ArenaOffset, MapType_ResonantBattlesOffset, MapType_TempestTrialsOffset, MapType_SummonerDuelsOffset };
```

注意: `MapType` に加えてオフセット定数も他ファイルから参照されている可能性があるため確認する。BattleMapSettings.js 内の `changeMapKind` などのトップレベル関数が BattleMap.js に定義されている場合は、それらも export に含める。

**変換後:** `./run_tests.sh` を実行して全テストパスを確認。

## 共通の変換ルール（全ファイル共通）

### コーディング規約

- import 文と export 文は**必ず1行で記述する**。複数行にまたがる import/export は禁止
- export スタイルは末尾まとめ `export { ... };` に統一。インライン export（`export class`, `export function`）は禁止
- バレルファイルは作らない。直接 import を使用

### import のスタイル

```javascript
// ファイル先頭
import { ObjectUtil } from './Utilities.js';
import { Weapon, WeaponType } from './SkillConstants.js';
```

### export のスタイル

```javascript
// ファイル末尾
export { ClassName1, ClassName2, CONSTANT_A, functionB };
```

### 変換手順（各ファイル共通）

1. ファイル内で使用している他ファイルの定義を特定する
2. ファイル先頭に必要な import を追加する
3. ファイル末尾に `export { ... };` を追加する
4. `./run_tests.sh` で全テストパスを確認する
5. `npm run build` で出力が正常なことを確認する

## 注意事項

### 結合順序との整合性

`create_tests.sh` の `SOURCE_FILE_NAMES` 配列では、ファイルの結合順序が以下のように定義されている:

```
BattleContext → Unit → UnitManager → BattleMap → GlobalBattleContext
```

import/export 行は結合時にフィルタで除去されるため、結合順序自体は変更不要。ただし、ESM としての依存方向（import の方向）がこの結合順序と矛盾しないことを確認する。

### BattleContext の DamageCalculationUtility 参照

BattleContext.js 内の `setDodgeInCombat` / `setResDodgeInCombat` メソッドが `DamageCalculationUtility` を参照している。DamageCalculationUtility.js は Stage H（section-09）で変換予定。この参照はコールバック関数内での実行時参照であり、モジュール初期化時には評価されないため、import を追加しても TDZ エラーにはならない。

### Unit.js の巨大な export リスト

Unit.js には多数のトップレベル関数が定義されている。他ファイルから参照されている関数を全て export する必要がある。実装時は、他のソースファイル（特に DamageCalculator.js, BattleSimulatorBase.js, Main_OriginalAi.js 等）が Unit.js の関数を参照しているかを確認して export リストを完成させる。

### BattleMap.js の関数群

BattleMap.js 内にはマップ初期化用の多数の関数（`resetBattleMapPlacement` 等）が定義されている可能性がある。BattleMapSettings.js との間で関数の定義場所が分散している場合は、どちらのファイルから export するかを整理する。

## このセクションの成果物

変換完了後、以下のファイルが import/export 文を持つ状態になる:

1. `Sources/BattleContext.js` — import: ObjectUtil, DamageCalculationUtility / export: BattleContext
2. `Sources/GlobalBattleContext.js` — import: UnitGroupType, Captain, SeasonType / export: GlobalBattleContext
3. `Sources/Unit.js` — import: 17行（Utilities, BattleMapElement, BattleContext, SkillConstants, HeroInfoConstants, UnitConstants, Tile, Structures, Skill, Logger, SkillEffectEnv, SkillEffectHooks, SkillEffect, GlobalDefinitions） / export: Unit, AttackableUnitInfo, AttackEvaluationContext, AssistableUnitInfo, ActionContext, PrecombatContext, UnitUtil, isThief, calcArenaBaseStatusScore, calcArenaTotalSpScore, calcBuffAmount, calcHealAmount, isDebufferTier1, isDebufferTier2, isAfflictor, canRefreshTo
4. `Sources/UnitManager.js` — import: Unit, UnitUtil, UnitGroupType, MoveType, IterUtil, GeneratorUtil, UnitQuery, isWeaponTypeBreath, isWeaponTypeBeast / export: UnitManager, MaxEnemyUnitCount, MaxAllyUnitCount
5. `Sources/BattleMap.js` — import: Tile, TileType, DivineVeinType, CanNotReachTile, Structures(9シンボル), UnitGroupType, MoveType, ArrayUtil, MapUtil, g_imageRootPath, g_corsImageRootPath / export: MapType, MapType_*Offset(4), MapKindOptions(4), ArenaMapRotation, map判定関数(5), Default*Map(2), tileTypeToThumb, tileTypeToColor, getMapBackgroundImage, BattleMap

## 実装時の差異

- **計画との差異**: SummonerLevel の import 元は HeroInfoConstants.js ではなく UnitConstants.js（実際の定義場所）
- **コードレビューで追加**: BattleMap.js に Structures.js から Wall, DefenceStructureBase, OffenceStructureBase, TileTypeStructureBase, TrapBase, OfCallingCircle, DefCallingCircle の import を追加。Tile.js に CanNotReachTile、Utilities.js に ArrayUtil, MapUtil を追加。Unit.js に Hero を追加。
- **循環依存**: BattleContext.js → DamageCalculationUtility.js は実行時参照のみ（コールバック内）で、初期化時の循環は無し
- **テスト結果**: 全310テストパス

## 後続セクションへの影響

- **section-08-stage-g-skill-impl**: Unit クラスを import して使用する SkillImpl ファイル群が、このセクションの完了を前提とする
- **section-09-stage-h-combat**: DamageCalculator.js, DamageCalculationUtility.js 等が Unit, BattleContext を import する
- **section-10-stage-ij-app-ui**: AppData, BattleSimulatorBase 等が BattleMap, UnitManager, Unit, GlobalBattleContext を import する