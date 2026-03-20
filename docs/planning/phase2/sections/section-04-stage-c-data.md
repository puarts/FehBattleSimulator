Now I have sufficient context. Let me produce the section content.

# Section 04: Stage C -- データ構造の ESM 化

## 概要

このセクションでは、Stage C に属する5つのデータ構造ファイルに `import`/`export` 文を追加して ESM 化する。これらのファイルはゲームのマップタイル、配置物、マップ設定、ターン設定、スキル情報といったデータ構造を定義している。

**対象ファイル:**

| ファイル | 定義する主要シンボル | 依存先 |
|---------|---------------------|--------|
| `Sources/Tile.js` | `Tile`, `TileType`, `DivineVeinType`, `CanNotReachTile`, `ObstructTile`, `TileTypeOptions`, `tileTypeToString` 等 | `BattleMapElement`, `GlobalDefinitions` |
| `Sources/Structures.js` | `StructureBase`, `ObjType`, `BreakableWall`, `BreakableWallIconType`, 各施設クラス, `isMovableForUnit` 等 | `BattleMapElement`, `GlobalDefinitions` |
| `Sources/BattleMapSettings.js` | `changeMapKind`, `resetBattleMapPlacement` 等 | `Tile`, `BattleMapElement` (+ `BattleMap`, `MapType` を実行時参照) |
| `Sources/TurnSetting.js` | `TurnSetting` | `GlobalDefinitions` |
| `Sources/Skill.js` | `SkillInfo`, 多数の FuncMap (`applySkillEffectForUnitFuncMap` 等), ユーティリティ関数群 | `SkillConstants`, `GlobalDefinitions` |

## 前提条件（依存セクション）

- **section-01-build-filter**: `build.mjs` と `create_tests.sh` に import/export 除去フィルタが導入済みであること
- **section-02-stage-a-infra**: `BattleMapElement.js`, `GlobalDefinitions.js` が ESM 化済みであること
- **section-03-stage-b-constants**: `SkillConstants.js` が ESM 化済みであること（`Skill.js` が `WeaponType`, `Weapon`, `Support`, `Special`, `SkillType`, `WeaponRefinementType`, `EmblemHero`, `StatusEffectType`, `PassiveB` 等を参照するため）

## テスト

以下のテストは、各ファイル変換後に既存テストスイート全体が通ることで検証する。追加で以下のスモークテスト的な確認を行う。

```
# Test: Tile.js -- Tile, TileType が定義されている
#   typeof Tile !== 'undefined' && typeof TileType !== 'undefined'
#   を確認する。結合後のグローバルスコープで参照可能であること。

# Test: Structures.js -- StructureBase, ObjType が定義されている
#   typeof StructureBase !== 'undefined' && typeof ObjType !== 'undefined'
#   を確認する。

# Test: Skill.js -- SkillInfo が定義されている
#   typeof SkillInfo !== 'undefined'
#   を確認する。

# Test: 全既存テストスイートがパスする
#   ./run_tests.sh で全テストが通ることを確認。
```

既存のスモークテストやその他のテストが既にこれらのシンボルを間接的に使っているため、全テストパスが最も重要な検証となる。新規テストファイルの追加は不要。

## 実装手順

全ファイル共通の変換パターンに従う:

1. ファイル先頭に `import { ... } from '...'` を追加（依存先から必要なシンボルを import）
2. ファイル末尾に `export { ... };` を追加（他ファイルから参照されるシンボルをすべて列挙）
3. `./run_tests.sh` で全テストパスを確認
4. 1ファイルずつ変換し、テスト確認を繰り返す

**重要なコーディング規約:**
- import/export は**必ず1行で記述する**（複数行禁止。結合時のフィルタが行単位で動作するため）
- export スタイルは**末尾まとめ** `export { ... };` に統一（インライン `export class` 等は禁止）

### 4-1. Tile.js の変換

**ファイルパス:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Tile.js`

**import の追加（ファイル先頭）:**

```javascript
import { BattleMapElement } from './BattleMapElement.js';
import { g_siteRootPath } from './GlobalDefinitions.js';
```

`Tile` クラスは `BattleMapElement` を継承しているため import が必要。`g_siteRootPath` 等のグローバル定数は `GlobalDefinitions.js` から import する。具体的にどのグローバル定数が使われているかは、ファイル内の参照を精査して確定する。

**export の追加（ファイル末尾）:**

他ファイルから参照されるシンボルを列挙する。主要なものは以下の通り:
- `Tile`, `TileType`, `TileTypeOptions`, `tileTypeToString`
- `DivineVeinType`, `DIVINE_VEIN_NAMES`, `getDivineVeinName`
- `CanNotReachTile`, `ObstructTile`
- その他、ファイル内で定義され他ファイルから参照されるすべてのトップレベルシンボル

実装時にファイル全体を精査し、他ファイルからの参照を確認して export リストを確定すること。

### 4-2. Structures.js の変換

**ファイルパス:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Structures.js`

**import の追加（ファイル先頭）:**

```javascript
import { BattleMapElement } from './BattleMapElement.js';
```

`StructureBase` は `BattleMapElement` を継承している。`GlobalDefinitions.js` からの定数（`g_imageRootPath`, `StructureCookiePrefix`, `ValueDelimiter` 等）も import が必要。

**export の追加（ファイル末尾）:**

主要なシンボル:
- `ObjType`, `OrnamentSettings`, `StructureBase`
- `OffenceStructureBase`, `DefenceStructureBase`
- 各施設クラス: `DefFortress`, `OfFortress`, `DefBoltTower`, `OfBoltTower`, `ExcapeLadder`, `HeavyTrap` 等
- `BreakableWall`, `BreakableWallIconType`, `Wall`
- `TileTypeStructureBase`（存在する場合）
- `isMovableForUnit`
- `findOrnamentTypeIndexByIcon`

ファイル内のクラス・関数・定数をすべて洗い出して export リストを確定すること。

### 4-3. BattleMapSettings.js の変換

**ファイルパス:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleMapSettings.js`

**import の追加（ファイル先頭）:**

```javascript
import { TileType } from './Tile.js';
import { BreakableWallIconType } from './Structures.js';
```

このファイルは `BattleMap`, `MapType`, `isArenaMap`, `isAetherRaidMap` 等も使用するが、これらは Stage F（`BattleMap.js`）で定義される。Stage C 時点ではこれらはまだグローバルスコープにあるため、**Stage C では実際に ESM 化済みのファイルからのみ import する**。Stage F 以降で `BattleMap.js` が ESM 化された際に import を追加する。

**export の追加（ファイル末尾）:**

```javascript
export { changeMapKind, resetBattleMapPlacement };
```

内部ヘルパー関数（`__resetBattleMapPlacementForArena` 等の `__` プレフィックス関数）は export しない。

### 4-4. TurnSetting.js の変換

**ファイルパス:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TurnSetting.js`

**import の追加（ファイル先頭）:**

```javascript
import { TurnSettingCookiePrefix, NameValueDelimiter, ElemDelimiter, ValueDelimiter, UnitCookiePrefix, StructureCookiePrefix, TileCookiePrefix } from './GlobalDefinitions.js';
```

`TurnSetting` クラスは `TurnSettingCookiePrefix`, `NameValueDelimiter`, `ElemDelimiter` 等のグローバル定数を使用する。これらが `GlobalDefinitions.js` で定義されているか確認し、適切な import 元を指定する。

**export の追加（ファイル末尾）:**

```javascript
export { TurnSetting };
```

### 4-5. Skill.js の変換

**ファイルパス:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Skill.js`

これは Stage C で最も大きく複雑なファイル。多数の関数、定数、FuncMap（`Map` オブジェクト）、そして `SkillInfo` クラスを定義している。

**import の追加（ファイル先頭）:**

```javascript
import { WeaponType, Weapon, Support, Special, PassiveA, PassiveB, PassiveC, SkillType, WeaponRefinementType, EmblemHero, StatusEffectType } from './SkillConstants.js';
import { g_siteRootPath, g_skillIconRootPath } from './GlobalDefinitions.js';
```

`SkillConstants.js` からの import が大量になる可能性がある。使用されているシンボルを精査して1行の import に収める。import が非常に長くなる場合でも**必ず1行で書く**こと。

**注意点:** `Skill.js` は `StatusIndex` を定義しているが、`SkillConstants.js` の `StatusIndex` や `HeroInfoConstants.js` の同名シンボルと重複がないか確認する。重複がある場合は適切に解消する。

**注意点2:** `Skill.js` の末尾付近に `applySkillEffectsAfterAfterBeginningOfCombatFuncMap` と `applySkillEffectsAfterAfterBeginningOfCombatFromAlliesFuncMap` が `const` なしで宣言されている（暗黙のグローバル変数）。ESM 化時にこれらを `const` 宣言に修正すべきかどうか検討する。修正する場合は他ファイルでの参照に影響がないか確認すること。

**export の追加（ファイル末尾）:**

export するシンボルが非常に多い。主要カテゴリ:

1. **SkillInfo クラス**: `SkillInfo`
2. **ユーティリティ関数**: `getAttackRangeOfWeaponType`, `isPhysicalWeaponType`, `isWeaponSpecialRefined`, `isFiresweepWeapon`, `getAssistRange`, `isRallyUp`, `getAtkBuffAmount`, `getSpdBuffAmount`, `getDefBuffAmount`, `getResBuffAmount`, `weaponRefinementTypeToString`, `getEmblemHeroSkillId`, `getNormalSkillId`, `getRefinementSkillId`, `getSpecialRefinementSkillId`, `getRefinementSkillIds`, `getStatusEffectSkillId`, `getStyleSkillId`, `getDuoOrHarmonizedSkillId`, `getDivineVeinSkillId`, `getCustomSkillId`, `getSkillFunc`, `stealBonusEffects`, `getStatusName`, `getPrecombatHealThreshold` 等
3. **定数・Set**: `WEAPON_TYPE_ATTACK_RANGE_MAP`, `EMBLEM_HERO_SET`, `PHYSICAL_WEAPON_TYPE_SET`, `FIRESWEEP_WEAPON_SET`, `RALLY_UP_SET`, `RALLY_BUFF_AMOUNT_MAP`, `ASSIST_RANGE_MAP`, `DISARM_TRAP_SKILL_SET`, `DISARM_HEX_TRAP_SKILL_SET`, `StatusIndex`, `StatFlags`, `COUNT2_SPECIALS`, `INHERITABLE_COUNT2_SPECIALS` 等
4. **ステータスエフェクト配列**: `POSITIVE_STATUS_EFFECT_ARRAY`, `NEGATIVE_STATUS_EFFECT_ARRAY`, `POSITIVE_STATUS_EFFECT_ORDER_MAP`, `NEGATIVE_STATUS_EFFECT_ORDER_MAP`
5. **FuncMap 群**: `applySkillEffectForUnitFuncMap`, `canActivateCantoFuncMap`, `calcMoveCountForCantoFuncMap` 等（約50個以上の Map 定数）
6. **奥義関連**: `NO_EFFECT_ON_SPECIAL_COOLDOWN_CHARGE_ON_SUPPORT_SKILL_SET`, `PRECOMBAT_HEAL_THRESHOLD_MAP`

export リストが非常に長くなるが、**1行で書く**規約を守ること。実装時にファイル内の全トップレベルシンボルを列挙し、他ファイルから参照されるものをすべて export する。

## 変換順序

ファイル間の依存関係に基づき、以下の順序で変換する:

1. **Tile.js** -- `BattleMapElement` のみに依存。Stage A 完了後すぐ変換可能。
2. **Structures.js** -- `BattleMapElement` に依存。`Tile.js` とは独立しているため並行変換も可能。
3. **TurnSetting.js** -- `GlobalDefinitions` のみに依存。他の Stage C ファイルとは独立。
4. **Skill.js** -- `SkillConstants` に依存。Stage B 完了後に変換可能。
5. **BattleMapSettings.js** -- `Tile.js` と `Structures.js` に依存するため最後に変換。

各ファイル変換後に `./run_tests.sh` を実行し、全テストがパスすることを確認してから次のファイルに進む。

## 注意事項

- **BattleMapSettings.js の未解決依存**: このファイルは `BattleMap`, `MapType`, `isArenaMap` 等を使うが、これらは Stage F で ESM 化される `BattleMap.js` で定義される。Stage C の時点ではこれらはグローバルスコープに残っているため、import は不要（結合ビルドでグローバルとして参照できる）。Stage F 完了後にこれらの import を追加する。
- **Skill.js の暗黙グローバル変数**: `applySkillEffectsAfterAfterBeginningOfCombatFuncMap` と `applySkillEffectsAfterAfterBeginningOfCombatFromAlliesFuncMap` は `const` なしで宣言されている。ESM 化に伴い `const` を付与することを推奨するが、他ファイルでの参照方法（直接代入やグローバルアクセス）に影響がないか確認が必要。
- **export リストの長さ**: `Skill.js` は export するシンボルが非常に多い。1行が長くなるが規約通り1行で記述する。エディタの横スクロールは許容する。
- **`g_appData` 参照**: `Skill.js` 内のいくつかの関数（`getSpdBuffAmount` 等）が `g_appData.globalBattleContext.currentTurn` を参照している。これは Stage I で ESM 化される `AppData.js` のグローバル変数。Stage C の時点では import せず、グローバル参照のまま残す。

---

## 実装結果

### 変換されたファイル

1. **Tile.js** — import: `BattleMapElement`, `ValueDelimiter` / export: 13シンボル
2. **Structures.js** — import: `BattleMapElement`, `g_imageRootPath`, `StructureCookiePrefix`, `ValueDelimiter` / export: 全クラス・関数（8行のexport文）
3. **TurnSetting.js** — import: `TurnSettingCookiePrefix`, `NameValueDelimiter`, `ElemDelimiter`, `UnitCookiePrefix`, `StructureCookiePrefix`, `TileCookiePrefix` / export: `TurnSetting`
4. **Skill.js** — import: SkillConstants 14シンボル + GlobalDefinitions 2シンボル / export: ~100シンボル（約30行のexport文）
5. **BattleMapSettings.js** — import: `TileType`, `BreakableWallIconType` / export: `changeMapKind`, `resetBattleMapPlacement`

### 計画からの差分

1. **Skill.js の暗黙グローバル変数を修正**: コードレビューで発見。`applySkillEffectsAfterAfterBeginningOfCombatFuncMap` と `applySkillEffectsAfterAfterBeginningOfCombatFromAlliesFuncMap` に `const` を追加し、export リストにも含めた。
2. **export 文の分割**: Skill.js は ~100 シンボルを export するため、1行では非現実的。約30行の `export { ... };` に分割。build filter は行単位で処理するため問題なし。
3. **TurnSetting.js の import**: 計画では `ValueDelimiter` を含めていたが、実際にはファイル内で未使用のため除外。
4. **Tile.js の import**: 計画では `g_siteRootPath` を含めていたが、実際にはファイル内で未使用。`ValueDelimiter` のみを import。

### テスト結果

- 全 310 テストパス
- `npm run build` 正常完了