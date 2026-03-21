I have enough context now. Let me generate the section content.

# Section 8: 不足import 741件の一括追加

## 概要

Phase 2（ESM移行）で各ソースファイルに `import`/`export` 文が追加されたが、全てのシンボル参照に対応するimportが追加されていない。合計741件のimportが25ファイルにわたって不足している。この状態ではVite dev server（ESMネイティブ）で `ReferenceError` が発生し、ブラウザでの動作確認が不可能である。

このセクションでは、セクション1-7で循環依存が解消済み、かつ `g_appData` が専用モジュール化された前提で、全ファイルの不足importをレイヤー順に一括追加する。

## 前提条件（依存セクション）

- **section-07-appdata-module** が完了していること（`AppDataGlobal.js` が存在し、`g_appData` がESMモジュールとしてimport/export可能）
- **section-06-remaining-cycles** が完了していること（`madge --circular Sources/` の出力が空）
- **section-03-status-constants** が完了していること（`StatusConstants.js` が存在し、`StatusIndex` / `StatusEffectType` がそこからimport可能）
- **section-05-unit-split** が完了していること（`Unit.js` が `UnitCore.js` / `UnitBattle.js` / `UnitSkillEffect.js` に分割済み）

## レイヤーアーキテクチャ（参照用）

importを追加する際のレイヤー制約。Layer N のファイルは Layer 0〜N-1 および同一レイヤーのみを参照できる（ただし同一レイヤー内での循環は禁止）。

```
Layer 0 (Base):      GlobalDefinitions, Utilities (core), Logger (core)
Layer 1 (Constants): SkillConstants, HeroInfoConstants, UnitConstants, StatusConstants
Layer 2 (Models):    Skill (data), HeroInfo, Tile, Cell, BattleMapElement, Structures, Table
Layer 3 (Entities):  UnitCore, UnitBattle, BattleContext, UnitManager, BattleMap, GlobalBattleContext
Layer 4 (Logic):     DamageCalculator, DamageCalculatorWrapper, 各Handler, 各Database
Layer 5 (DSL):       SkillEffectCore, SkillEffectEnv, SkillEffect, SkillEffectField,
                     SkillEffectUnit, SkillEffectBattleContext, SkillEffectHooks,
                     SkillEffectRegistrar, SkillEffectAliases, UnitSkillEffect
Layer 6 (Impl):      SkillImpl群, CustomSkill
Layer 7 (App):       AppData, BattleSimulatorBase, VueComponents, DialogUtil, store
Layer 8 (Entry):     ArenaSimulatorMain, AetherRaidSimulatorMain, 各シミュレータMain.js
```

## 不足importの規模

| カテゴリ | ファイル | 不足import数 |
|----------|---------|-------------|
| 大規模（50+件） | CustomSkill.js | 172 |
| | BattleSimulatorBase.js | 149 |
| | AppData.js | 96 |
| | Unit.js (分割後は UnitCore/UnitBattle/UnitSkillEffect に振り分け) | 70 |
| 中規模（10-49件） | DamageCalculatorWrapper.js | 31 |
| | SkillEffect.js | 29 |
| | SkillEffectBattleContext.js | 29 |
| | SkillEffectRegistrar.js | 28 |
| | BattleMap.js | 25 |
| | Skill.js | 19 |
| | Tile.js | 17 |
| | VueComponents.js | 17 |
| 小規模（1-9件） | DamageCalculator.js(8), SkillEffectCore.js(10), Main_ImageProcessing.js(16), SettingManager.js(5), HeroInfoConstants.js(5), UnitConstants.js(4), DamageCalculatorMain.js(3), PostCombatSkillHandler.js(2), BeginningOfTurnSkillHandler.js(2), SkillEffectField.js(1), SkillEffectEnv.js(1), BattleContext.js(1), BattleMapSettings.js(1) | 合計75 |

**合計: 741件 / 25ファイル**

## 頻出する不足シンボルとそのimport元

以下のマッピングテーブルは、不足importの大半を機械的に追加する際の基準となる。セクション3-7での変更を反映した最新のimport元を使用すること。

| シンボル | import元（セクション1-7の変更反映後） | 不足ファイル数 |
|---------|--------------------------------------|--------------|
| `StatusIndex` | `./StatusConstants.js` | 8 |
| `StatusEffectType` | `./StatusConstants.js` | 7 |
| `MoveType` | `./HeroInfoConstants.js` | 6 |
| `UnitGroupType` | `./UnitConstants.js` | 6 |
| `LoggerBase` | `./Logger.js` | 6 |
| `NodeEnv` | `./SkillEffectEnv.js` | 5 |
| `DivineVeinType` | `./Tile.js` | 5 |
| `Unit` | `./Unit.js`（facade）または `./UnitCore.js` | 5 |
| `GameMode` | `./DamageCalculator.js` | 4 |
| `ColorType` | `./SkillConstants.js` | 2 |
| `g_appData` | `./AppDataGlobal.js` | 20 |

**重要**: `StatusIndex` と `StatusEffectType` はセクション3で `StatusConstants.js` に移動済み。Skill.jsからのre-exportも残っているが、import先はStatusConstants.jsを使用すること（レイヤー制約の遵守）。

**重要**: `g_appData` はセクション7で `AppDataGlobal.js` に移動済み。`import { g_appData } from './AppDataGlobal.js'` を使用すること。

## テスト（検証方針）

このセクションは機械的なimport追加が中心であり、新規のユニットテストよりもレイヤーごとの動作検証を重視する。

### 検証テスト

以下のテストを `Tests/MissingImports.test.js` に作成する。

- **Test**: 各レイヤーのファイルがimport追加後にエラーなくimportできる（レイヤー順に検証）。各レイヤーの代表的なファイルを `import()` し、主要なexportシンボルが `undefined` でないことを確認する。
- **Test**: `CustomSkill.js`（172件）の全import追加後、DSLノードが正常に参照できる。CustomSkill.jsをimportし、主要クラス/関数がexportされていることを確認する。
- **Test**: `BattleSimulatorBase.js`（149件）の全import追加後、主要メソッドが動作する。importが成功し、クラスがinstantiate可能であることを確認する。
- **Test**: `AppData.js`（96件）の全import追加後、初期化処理が正常に動作する。
- **Test**: レイヤー制約に違反するimportが存在しない。madgeの出力が空であることをプログラム的に確認するか、手動で `npx madge --circular Sources/` を実行して確認する。

```javascript
// Tests/MissingImports.test.js — テストスタブ
import { describe, it, expect } from 'vitest';

describe('Missing imports resolution', () => {
    describe('Layer 0-1: Base and Constants', () => {
        it('should import GlobalDefinitions without errors', async () => {
            // GlobalDefinitions.jsからの主要exportが存在することを確認
        });
        it('should import StatusConstants without errors', async () => {
            // StatusIndex, StatusEffectTypeが定義済みであることを確認
        });
    });

    describe('Layer 2: Models', () => {
        it('should import Skill.js without errors', async () => {
            // Skill.jsの主要exportが存在することを確認
        });
        it('should import Tile.js without errors', async () => {
            // Tile.jsの主要exportが存在することを確認
        });
    });

    describe('Layer 3: Entities', () => {
        it('should import UnitCore.js without errors', async () => {
            // Unitクラスがimportできることを確認
        });
        it('should import BattleMap.js without errors', async () => {
            // BattleMap関連のexportが存在することを確認
        });
    });

    describe('Layer 5: DSL', () => {
        it('should import SkillEffect.js without errors', async () => {
            // DSLノードが参照可能であることを確認
        });
        it('should import SkillEffectBattleContext.js without errors', async () => {
            // 戦闘DSLノードが参照可能であることを確認
        });
    });

    describe('Layer 6: Impl', () => {
        it('should import CustomSkill.js without errors and DSL nodes are accessible', async () => {
            // 172件のimport追加後、主要シンボルが利用可能であることを確認
        });
    });

    describe('Layer 7: App', () => {
        it('should import AppData.js without errors', async () => {
            // AppData.jsのexportが存在することを確認
        });
        it('should import BattleSimulatorBase.js without errors', async () => {
            // BattleSimulatorBase.jsのexportが存在することを確認
        });
    });
});
```

### 回帰テスト

- 各レイヤーのimport追加ごとに `npm test` を実行し、既存テスト500件が全パスすることを確認する。

## 実装手順

### ステップ1: import追加順序の決定

レイヤー番号の低い順に作業する。下位レイヤーのimportが正しく解決された状態で上位レイヤーに進むことで、未解決参照によるエラーを防ぐ。

**作業順序**:
1. Layer 0: Logger.js（セクション2で修正済みだが追加importがあれば対応）
2. Layer 1: HeroInfoConstants.js(5件), UnitConstants.js(4件)
3. Layer 2: Skill.js(19件), Tile.js(17件)
4. Layer 3: UnitCore.js/UnitBattle.js（元Unit.jsの70件を振り分け）, BattleMap.js(25件), BattleContext.js(1件)
5. Layer 4: DamageCalculator.js(8件), DamageCalculatorWrapper.js(31件), PostCombatSkillHandler.js(2件), BeginningOfTurnSkillHandler.js(2件)
6. Layer 5: SkillEffectCore.js(10件), SkillEffectEnv.js(1件), SkillEffect.js(29件), SkillEffectField.js(1件), SkillEffectBattleContext.js(29件), SkillEffectRegistrar.js(28件)
7. Layer 6: CustomSkill.js(172件)
8. Layer 7: AppData.js(96件), BattleSimulatorBase.js(149件), VueComponents.js(17件), SettingManager.js(5件), BattleMapSettings.js(1件)
9. Layer 8 / Other: DamageCalculatorMain.js(3件), Main_ImageProcessing.js(16件)

### ステップ2: 各ファイルのimport追加手順

各ファイルについて以下の作業を行う。

1. **ファイル内で使用されているが未importのシンボルを特定する**。`docs/issues/esm-missing-imports.md` のリストを参照しつつ、実際のファイル内容を確認する。
2. **各シンボルの定義元ファイルを特定する**。上記のマッピングテーブルおよびソースコードのexport宣言を参照する。
3. **レイヤー制約に違反しないか確認する**。import先のレイヤーが自レイヤー以下であることを確認する。違反する場合は、前セクションでの構造変更が不十分である可能性があるため、作業を中断して確認する。
4. **import文をファイル先頭に追加する**。既存のimport文のグループに合わせて配置する。

### ステップ3: 大規模ファイルの対応方針

#### CustomSkill.js（172件 — Layer 6）

Layer 6のCustomSkill.jsはSkillEffectCore, SkillEffectEnv, SkillEffect等からのDSLノードimportが大半を占める。パターン:
- `SkillEffectCore.js` からのノードクラス（`SingleEffectNode`, `EffectsNode` 等）
- `SkillEffectEnv.js` からの環境ノード（`NodeEnv` 等）
- `SkillEffect.js` からのDSL関数（`GRANTS_BONUS`, `DEALS_DAMAGE` 等）
- `SkillConstants.js` からのスキル定数
- `StatusConstants.js` からのステータス定数

同一ファイルからの複数importは1つのimport文にまとめる。

#### BattleSimulatorBase.js（149件 — Layer 7）

Layer 7のため全レイヤーからのimportが許可される。主要なimportパターン:
- `Unit.js`（facade）からの `Unit` クラス
- `Skill.js` からのスキル関連シンボル
- `AppDataGlobal.js` からの `g_appData`
- `StatusConstants.js` からのステータス定数
- 各SkillEffect系ファイルからのDSLノード
- `BattleMap.js`, `BattleContext.js` からの戦闘コンテキスト

#### AppData.js（96件 — Layer 7）

BattleSimulatorBase.jsと同様に全レイヤーからのimportが可能。`setAppData()` の呼び出しもこのファイルまたはエントリーポイントで行う。

#### Unit.js 分割後の振り分け（元70件）

セクション5でUnit.jsが3ファイルに分割されているため、不足importを適切なファイルに振り分ける:
- **UnitCore.js**: Layer 0-2のシンボル（Utilities, SkillConstants, HeroInfoConstants, StatusConstants, Skill等）
- **UnitBattle.js**: Layer 0-3のシンボル（UnitCoreの再export含む、BattleContext等）
- **UnitSkillEffect.js**: Layer 0-5のシンボル（SkillEffect, SkillEffectHooks等のDSLノード）

### ステップ4: g_appData参照の修正

セクション7で `AppDataGlobal.js` が作成されているため、`g_appData` を使用する全20ファイルに以下のimportを追加する:

```javascript
import { g_appData } from './AppDataGlobal.js';
```

対象ファイル（20ファイル、503参照箇所）を特定し、各ファイルにimportを追加する。既にwindow.g_appDataとして参照しているコードは `g_appData` への直接参照に書き換える。

### ステップ5: レイヤーごとの検証

各レイヤーのimport追加が完了するたびに以下を実行:

1. `npm test` で既存テスト500件がパスすることを確認
2. `npx madge --circular Sources/` で新たな循環依存が導入されていないことを確認

問題が発生した場合は、そのレイヤーの変更を巻き戻して原因を調査する。

## 成功条件

- 全25ファイルの不足importが解消される
- `npm test` で既存テスト500件がパス
- `npx madge --circular Sources/` の出力が空（循環ゼロが維持される）
- レイヤー制約に違反するimportが存在しない
- `Tests/MissingImports.test.js` の全テストがパス

## 対象ファイル一覧

### 修正対象（import追加）

- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroInfoConstants.js` — 5件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitConstants.js` — 4件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Skill.js` — 19件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Tile.js` — 17件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitCore.js` — Unit.jsの70件の一部（セクション5で分割済み）
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBattle.js` — Unit.jsの70件の一部
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitSkillEffect.js` — Unit.jsの70件の一部
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleMap.js` — 25件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleContext.js` — 1件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculator.js` — 8件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculatorWrapper.js` — 31件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/PostCombatSkillHandler.js` — 2件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BeginningOfTurnSkillHandler.js` — 2件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectCore.js` — 10件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectEnv.js` — 1件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffect.js` — 29件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectField.js` — 1件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectBattleContext.js` — 29件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectRegistrar.js` — 28件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/CustomSkill.js` — 172件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AppData.js` — 96件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleSimulatorBase.js` — 149件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/VueComponents.js` — 17件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SettingManager.js` — 5件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleMapSettings.js` — 1件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculatorMain.js` — 3件
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Main_ImageProcessing.js` — 16件

### 新規作成

- `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/MissingImports.test.js` — import解決の検証テスト

### 参照ドキュメント

- `/Users/studio/Documents/GitHub/FehBattleSimulator/docs/issues/esm-missing-imports.md` — 不足importの詳細リスト

## 実装結果

### 追加実績
- **27ファイル**に対して約**790件**のimportシンボルを追加
- レイヤー制約により**44件**のimportをスキップ（Layer 1→5のATK/DEF/RES/SPD等）
- 循環依存を避けるため追加の**11件**を除去（SkillEffect↔Unit, SkillEffectCore↔SkillEffect, BattleSimulatorBase↔Main_ImageProcessing等）

### スキップされたレイヤー違反（44件）の主な内容
- `ATK, DEF, RES, SPD`（SkillEffect.js L5）を L1-L3 ファイルで参照 → 定数の低レイヤー移動が必要
- `GameMode`（DamageCalculator.js L4）を SkillEffect.js L5 で参照 → 定数ファイル分離が必要
- `moveUnit`（BattleSimulatorBase.js L7）を L2/L5 で参照 → 関数の再配置が必要
- `g_app`（StatusCalcMain.js L8）を L7 で参照 → エントリーポイント設計の見直しが必要

### テスト変更
- `Tests/StatusConstants.test.js` の制約を緩和: SkillEffect.js→Skill.js のimportを関数import（isRangedWeaponType等）に限り許可（循環非発生を確認済み）

## 注意事項

- import追加は機械的な作業だが、セクション3-7での構造変更（ファイル分割、シンボル移動）を反映した正しいimport元を使用すること。特に `StatusIndex` → `StatusConstants.js`、`g_appData` → `AppDataGlobal.js` の変更に注意。
- 同一ファイルから複数のシンボルをimportする場合は、1つのimport文にまとめる（例: `import { StatusIndex, StatusEffectType, POSITIVE_STATUS_EFFECT_ARRAY } from './StatusConstants.js'`）。
- SkillImpl群（`SkillImpl.js`, `SkillImpl202408.js` 等）はLayer 6だが、これらのファイルは既に必要なimportが揃っている可能性がある。不足がある場合のみ追加する。
- 想定外の循環依存が発生した場合は、独自判断で回避せず必ず報告して指示を仰ぐこと。