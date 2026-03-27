# ESM移行 — ディレクトリ構成設計書

> section-02の依存グラフ分析結果に基づく確定版

## 概要

Sources/配下の64個のJSファイルを機能ドメイン別の10ディレクトリに再配置する。アプリケーションロジックは変更しない（パス参照のみ更新）。

### 重要な前提

依存グラフ分析（section-02）の結果、64ファイル中39ファイルが1つの巨大SCC（強連結成分）を形成している。これはグローバルスコープでの暗黙的依存が推移的に絡み合っている実態を反映する。したがって、ディレクトリ境界は**依存方向の強制**ではなく**機能ドメインによる整理**として機能する。循環依存の解消は将来のESM化（別途計画策定）で行う。

### ロード順序の維持ルール

**Phase 2aでは、create_tests.sh / HTML / Deploy.bat のファイル列挙順序は「現行の相対順序を完全に維持し、各エントリにディレクトリプレフィックスを付加するのみ」とする。** initialization-rootファイル（SkillConstants, Skill, Tile, BattleMap, DamageCalculationUtility, CustomSkill, VueComponents等）はロード順序に依存するため、順序変更は動作を壊す。

**注意: 移動バッチの実行順序と最終的なロード順序は別物である。** バッチは機能ドメイン単位で移動するが、create_tests.sh / HTML / Deploy.bat の列挙順は現行順を維持する。バッチNの移動時には、そのバッチに含まれるファイルの列挙箇所だけにプレフィックスを追加し、他のエントリの位置は動かさない。

### クロスディレクトリ依存分析

39ファイルSCCを10ディレクトリに分割した場合の依存エッジ分布:

| ディレクトリ | 内部エッジ | 外部エッジ | 合計 | 内部率 | 主な流出先 |
|------------|----------|----------|------|-------|----------|
| core/ | 2 | 3 | 5 | 40% | data(2), map(1) |
| data/ | 8 | 17 | 25 | 32% | core(11), skill-dsl(3), app(1) |
| map/ | 11 | 25 | 36 | 31% | core(9), data(8), skill-dsl(3) |
| unit/ | 2 | 28 | 30 | 7% | data(11), core(8), map(3) |
| combat/ | 4 | 50 | 54 | 7% | data(17), skill-dsl(13), core(7) |
| database/ | 0 | 6 | 6 | 0% | data(6) |
| skill-dsl/ | 26 | 45 | 71 | 37% | data(13), core(10), app(6) |
| skill-impl/ | 0 | 57 | 57 | 0% | skill-dsl(29), data(17), map(4) |
| app/ | 19 | 102 | 121 | 16% | pages(24), map(19), core(19) |
| pages/ | 3 | 49 | 52 | 6% | data(12), core(10), app(9) |
| **合計** | **75** | **382** | **457** | **16%** | |

**分析**:
- 全体の内部率は16%。SCC内でのディレクトリ分割は「依存方向の強制」としては機能しない
- **skill-dsl/**（37%）と**core/**（40%）が最も凝集度が高い — 機能ドメインとして自然なグルーピング
- **app/**は外部エッジ102と最多 — BattleSimulatorBase.jsが36ファイルに依存するGod Objectであることが原因。Phase 2b（section-06）での分割対象
- **skill-impl/**は内部エッジ0 — 全依存が外部（主にskill-dsl）。ESM化時のimport先が明確
- **combat/**と**unit/**は内部率7%と低いが、ファイル数が少なく機能的凝集は高い

この分析は、`docs/planning/esm-migration/claude-plan.md` のPhase 2b（巨大ファイルの責務分割）での分割優先順位付けに使用する。

---

## 基本ディレクトリ構成案

```
Sources/
├── core/                    # 基盤・ユーティリティ
│   ├── GlobalDefinitions.js        [Layer 0, global-constant]
│   ├── GlobalDefinitions_Debug.js  [Layer 0, global-constant]
│   ├── Utilities.js                [Layer 3/SCC, pure-definition]
│   ├── Logger.js                   [Layer 0, pure-definition]
│   └── KeyRepeatHandler.js         [Layer 0, pure-definition]
│
├── data/                    # データ定義・定数・列挙
│   ├── SkillConstants.js           [Layer 1, initialization-root]
│   ├── Skill.js                    [Layer 3/SCC, initialization-root]
│   ├── HeroInfoConstants.js        [Layer 3/SCC, initialization-root]
│   ├── HeroInfo.js                 [Layer 4, pure-definition]
│   └── UnitConstants.js            [Layer 3/SCC, pure-definition]
│
├── map/                     # マップ・構造物・テーブル
│   ├── BattleMapElement.js         [Layer 0, pure-definition]
│   ├── Cell.js                     [Layer 0, pure-definition]
│   ├── Tile.js                     [Layer 3/SCC, initialization-root]
│   ├── Structures.js               [Layer 3/SCC, pure-definition]
│   ├── BattleMap.js                [Layer 3/SCC, initialization-root]
│   ├── BattleMapSettings.js        [Layer 3/SCC, pure-definition]
│   └── Table.js                    [Layer 3/SCC, pure-definition]
│
├── unit/                    # ユニット・コンテキスト
│   ├── BattleContext.js            [Layer 3/SCC, pure-definition]
│   ├── Unit.js                     [Layer 3/SCC, pure-definition]
│   ├── UnitManager.js              [Layer 3/SCC, pure-definition]
│   ├── GlobalBattleContext.js      [Layer 3/SCC, pure-definition]
│   └── TurnSetting.js             [Layer 1, pure-definition]
│
├── combat/                  # 戦闘計算
│   ├── DamageCalculationUtility.js [Layer 3/SCC, initialization-root]
│   ├── DamageCalculator.js         [Layer 3/SCC, pure-definition]
│   ├── PostCombatSkillHander.js    [Layer 3/SCC, pure-definition]
│   ├── DamageCalculatorWrapper.js  [Layer 3/SCC, pure-definition]
│   └── BeginningOfTurnSkillHandler.js [Layer 3/SCC, pure-definition]
│
├── database/                # データベース・プリセット・サンプル
│   ├── SkillDatabase.js            [Layer 2, pure-definition]
│   ├── HeroDatabase.js             [Layer 0, pure-definition]
│   ├── SampleSkillInfos.js         [Layer 4, pure-definition]
│   ├── SampleHeroInfos.js          [Layer 5, pure-definition]
│   └── AetherRaidDefensePresets.js [Layer 0, pure-definition]
│
├── skill-dsl/               # スキルDSL基盤
│   ├── SkillEffectCore.js          [Layer 3/SCC, pure-definition]
│   ├── SkillEffectEnv.js           [Layer 3/SCC, pure-definition]
│   ├── SkillEffect.js              [Layer 3/SCC, pure-definition]
│   ├── SkillEffectField.js         [Layer 3/SCC, pure-definition]
│   ├── SkillEffectUnit.js          [Layer 3/SCC, pure-definition]
│   ├── SkillEffectBattleContext.js  [Layer 3/SCC, pure-definition]
│   ├── SkillEffectHooks.js         [Layer 3/SCC, pure-definition]
│   ├── SkillEffectRegistrar.js     [Layer 4, pure-definition]
│   └── SkillEffectAliases.js       [Layer 3/SCC, pure-definition]
│
├── skill-impl/              # スキル実装（変更頻度高、コンフリクトリスク高）
│   ├── CustomSkill.js              [Layer 3/SCC, initialization-root]
│   ├── SkillImpl.js                [Layer 5, initialization-root]
│   ├── SkillImpl202408.js          [Layer 4, initialization-root]
│   ├── SkillImpl202501.js          [Layer 5, initialization-root]
│   └── SkillImpl202601.js          [Layer 5, initialization-root]
│
├── app/                     # アプリケーション・UI統合
│   ├── SettingManager.js           [Layer 3/SCC, pure-definition]
│   ├── AppData.js                  [Layer 3/SCC, global-assignment]
│   ├── AudioManager.js             [Layer 3/SCC, pure-definition]
│   ├── Main_ImageProcessing.js     [Layer 3/SCC, pure-definition]
│   ├── Main_OriginalAi.js          [Layer 3/SCC, pure-definition]
│   ├── Main_MouseAndTouch.js       [Layer 3/SCC, global-assignment]
│   ├── BattleSimulatorBase.js      [Layer 3/SCC, global-assignment]
│   └── VueComponents.js            [Layer 4, initialization-root]
│
├── pages/                   # ページ起点のファイル群
│   ├── AetherRaidSimulatorMain.js  [Layer 3/SCC, global-assignment]
│   ├── ArenaSimulatorMain.js       [Layer 3/SCC, global-assignment]
│   ├── SummonerDuelsSimulatorMain.js [Layer 3/SCC, global-assignment]
│   ├── DamageCalculatorMain.js     [Layer 4, global-assignment]
│   ├── StatusCalcMain.js           [Layer 3/SCC, global-mutable-state]
│   ├── UnitBuilderMain.js          [Layer 3/SCC, global-assignment]
│   ├── HeroIconListerMain.js       [Layer 1, global-mutable-state]
│   └── HeroStatusClustererMain.js  [Layer 4, global-assignment]
│
├── Local.js                 # ローカル開発用（ルートに維持）
├── TestUtilities.js         # テスト用（ルートに維持）
├── *.html                   # HTMLファイル（ルートに維持）
└── samples/                 # 既存（変更なし）
    └── tmp.js
```

### ファイル数確認

| ディレクトリ | ファイル数 |
|-------------|----------|
| core/ | 5 |
| data/ | 5 |
| map/ | 7 |
| unit/ | 5 |
| combat/ | 5 |
| database/ | 5 |
| skill-dsl/ | 9 |
| skill-impl/ | 5 |
| app/ | 8 |
| pages/ | 8 |
| ルート | 2 |
| **合計** | **64** |

### skill-impl/ の扱い

本設計では `skill-impl/` を含む構成を基本案とする。ただし、`update_skills` ブランチとのマージコストが高い場合に限り、Phase 2aでは SkillImpl 系ファイルの物理移動を見送り、`Sources/` ルートに維持する代替案を許容する。

- **基本案**: `CustomSkill.js`, `SkillImpl*.js` を `skill-impl/` に移動
- **代替案**: SkillImpl 系ファイルのみ `Sources/` ルートに維持し、他ディレクトリのみ先行移動
- どちらの場合も、将来のESM化までに最終配置を再評価する

### 設計根拠とsection-02からの調整

1. **Utilities.jsはcore/に維持**: Layer 3/SCCに属するが、機能的にはコアユーティリティ。依存方向としてはSkillConstants→Tile→UnitConstantsを参照するためSCCに引き込まれているが、配置はcore/が自然。

2. **HeroIconListerMain.jsはpages/に暫定配置**: Layer 1で多くのLayer 3ファイルから参照される特異なファイル。実質的にはshared moduleだが、ファイル名が`*Main.js`パターンでありページ起点のファイルとして作られた経緯がある。グローバル状態（g_heroIconBgColorDict等）を他ファイルが参照しており、pages/を「純粋なエントリポイント群」とみなすことはできない。**したがって本設計におけるpages/は「ページ起点のファイル群」という意味で用いる。** ESM化時にグローバル状態をdata/等の別モジュールに分離し、pages/を純粋なエントリポイントへ整理する。

3. **StatusCalcMain.jsはpages/に配置**: Layer 3/SCCに属するが、機能的にはページエントリ。DamageCalculator.jsやBattleSimulatorBase.jsから参照されているためSCCに巻き込まれている。

4. **SkillEffectRegistrar.jsはskill-dsl/に維持**: Layer 4だが、機能的にはDSL基盤の一部。

5. **database/を独立ディレクトリにする根拠**: 内部エッジ0（全依存がdata/への外部参照）だが、独立ディレクトリにする理由は依存分析ではなく運用都合。データベースクラス（SkillDatabase, HeroDatabase）とサンプルデータ（SampleSkillInfos, SampleHeroInfos）とプリセット（AetherRaidDefensePresets）は「データソース」として機能的に一貫しており、data/（定義・定数・列挙）とは役割が異なる。

6. **skill-impl/を独立ディレクトリにする根拠**: 内部エッジ0（全依存がskill-dsl等への外部参照）だが、変更頻度が最も高くupdate_skillsブランチとのコンフリクトリスクが最大のため、運用上の独立性を確保する。

---

## 移動バッチ計画

機能ドメイン単位で移動する。各バッチ完了時に`./run_tests.sh`でテスト確認。create_tests.sh / HTML / Deploy.bat のロード順は現行順を維持する（バッチ順に並べ替えない）。

**Local.jsの更新**: Local.jsはSKILL_EFFECT_FILESとSKILL_IMPL_FILESの2つの配列のみパス更新が必要。したがってLocal.jsの更新が発生するのはバッチ7（skill-dsl/）とバッチ10（skill-impl/）のみ。他のバッチではLocal.jsは更新不要。

### バッチ1: core/ — 基盤ユーティリティ（5ファイル）

| ファイル | Layer | 副作用分類 |
|---------|-------|-----------|
| GlobalDefinitions.js | 0 | global-constant |
| GlobalDefinitions_Debug.js | 0 | global-constant |
| Logger.js | 0 | pure-definition |
| KeyRepeatHandler.js | 0 | pure-definition |
| Utilities.js | 3/SCC | pure-definition |

**更新対象**: create_tests.sh, 全HTML (7本番+1ローカル), Deploy.bat

### バッチ2: data/ — データ定義・定数（5ファイル）

| ファイル | Layer | 副作用分類 |
|---------|-------|-----------|
| SkillConstants.js | 1 | initialization-root |
| Skill.js | 3/SCC | initialization-root |
| HeroInfoConstants.js | 3/SCC | initialization-root |
| HeroInfo.js | 4 | pure-definition |
| UnitConstants.js | 3/SCC | pure-definition |

**更新対象**: create_tests.sh, 全HTML, Deploy.bat

### バッチ3: map/ — マップ関連（7ファイル）

| ファイル | Layer | 副作用分類 |
|---------|-------|-----------|
| BattleMapElement.js | 0 | pure-definition |
| Cell.js | 0 | pure-definition |
| Tile.js | 3/SCC | initialization-root |
| Structures.js | 3/SCC | pure-definition |
| BattleMap.js | 3/SCC | initialization-root |
| BattleMapSettings.js | 3/SCC | pure-definition |
| Table.js | 3/SCC | pure-definition |

**更新対象**: create_tests.sh, 全HTML, Deploy.bat

### バッチ4: unit/ — ユニット・コンテキスト（5ファイル）

| ファイル | Layer | 副作用分類 |
|---------|-------|-----------|
| BattleContext.js | 3/SCC | pure-definition |
| Unit.js | 3/SCC | pure-definition |
| UnitManager.js | 3/SCC | pure-definition |
| GlobalBattleContext.js | 3/SCC | pure-definition |
| TurnSetting.js | 1 | pure-definition |

**更新対象**: create_tests.sh, 全HTML, Deploy.bat

### バッチ5: combat/ — 戦闘計算（5ファイル）

| ファイル | Layer | 副作用分類 |
|---------|-------|-----------|
| DamageCalculationUtility.js | 3/SCC | initialization-root |
| DamageCalculator.js | 3/SCC | pure-definition |
| PostCombatSkillHander.js | 3/SCC | pure-definition |
| DamageCalculatorWrapper.js | 3/SCC | pure-definition |
| BeginningOfTurnSkillHandler.js | 3/SCC | pure-definition |

**更新対象**: create_tests.sh, 全HTML, Deploy.bat

### バッチ6: database/ — データベース・プリセット（5ファイル）

| ファイル | Layer | 副作用分類 |
|---------|-------|-----------|
| SkillDatabase.js | 2 | pure-definition |
| HeroDatabase.js | 0 | pure-definition |
| SampleSkillInfos.js | 4 | pure-definition |
| SampleHeroInfos.js | 5 | pure-definition |
| AetherRaidDefensePresets.js | 0 | pure-definition |

**更新対象**: create_tests.sh, 全HTML, Deploy.bat

### バッチ7: skill-dsl/ — スキルDSL基盤（9ファイル）

| ファイル | Layer | 副作用分類 |
|---------|-------|-----------|
| SkillEffectCore.js | 3/SCC | pure-definition |
| SkillEffectEnv.js | 3/SCC | pure-definition |
| SkillEffect.js | 3/SCC | pure-definition |
| SkillEffectField.js | 3/SCC | pure-definition |
| SkillEffectUnit.js | 3/SCC | pure-definition |
| SkillEffectBattleContext.js | 3/SCC | pure-definition |
| SkillEffectHooks.js | 3/SCC | pure-definition |
| SkillEffectRegistrar.js | 4 | pure-definition |
| SkillEffectAliases.js | 3/SCC | pure-definition |

**更新対象**: create_tests.sh, 全HTML, Deploy.bat, Local.js (SKILL_EFFECT_FILES)

### バッチ8: app/ — アプリケーション層（8ファイル）

| ファイル | Layer | 副作用分類 |
|---------|-------|-----------|
| SettingManager.js | 3/SCC | pure-definition |
| AppData.js | 3/SCC | global-assignment |
| AudioManager.js | 3/SCC | pure-definition |
| Main_ImageProcessing.js | 3/SCC | pure-definition |
| Main_OriginalAi.js | 3/SCC | pure-definition |
| Main_MouseAndTouch.js | 3/SCC | global-assignment |
| BattleSimulatorBase.js | 3/SCC | global-assignment |
| VueComponents.js | 4 | initialization-root |

**更新対象**: create_tests.sh, 全HTML, Deploy.bat

### バッチ9: pages/ — ページエントリポイント（8ファイル）

| ファイル | Layer | 副作用分類 |
|---------|-------|-----------|
| AetherRaidSimulatorMain.js | 3/SCC | global-assignment |
| ArenaSimulatorMain.js | 3/SCC | global-assignment |
| SummonerDuelsSimulatorMain.js | 3/SCC | global-assignment |
| DamageCalculatorMain.js | 4 | global-assignment |
| StatusCalcMain.js | 3/SCC | global-mutable-state |
| UnitBuilderMain.js | 3/SCC | global-assignment |
| HeroIconListerMain.js | 1 | global-mutable-state |
| HeroStatusClustererMain.js | 4 | global-assignment |

**更新対象**: create_tests.sh, 対応HTML, Deploy.bat

### バッチ10（最後）: skill-impl/ — スキル実装（5ファイル）

| ファイル | Layer | 副作用分類 |
|---------|-------|-----------|
| CustomSkill.js | 3/SCC | initialization-root |
| SkillImpl.js | 5 | initialization-root |
| SkillImpl202408.js | 4 | initialization-root |
| SkillImpl202501.js | 5 | initialization-root |
| SkillImpl202601.js | 5 | initialization-root |

**更新対象**: create_tests.sh, 全HTML, Deploy.bat, Local.js (SKILL_IMPL_FILES)

**条件付き実施**: update_skillsブランチとの衝突リスクが最も高いため、Phase 2a開始時点で以下のどちらかを確定する。
- **基本案（推奨）**: skill-impl/ へ移動する
  - 条件: update_skillsブランチとのマージが近い、または想定コンフリクト量が許容範囲内
- **代替案**: SkillImpl系のみ `Sources/` ルートに維持する
  - 条件: マージコストが高すぎる、またはrename追跡の破綻が懸念される
  - この場合、Phase 2a完了時点では本設計書の `skill-impl/` は「将来移動予定」として扱う

---

## 周辺ファイルのパス更新方式

### create_tests.sh

**方式A（採用）**: SOURCE_FILE_NAMESの各エントリにディレクトリプレフィックスを付加する。**現行の列挙順序はそのまま維持する**（ディレクトリ順に並べ替えない）。

```bash
# 現行順序を維持し、各エントリにプレフィックスを追加するのみ
SOURCE_FILE_NAMES=(
    core/GlobalDefinitions          # was: GlobalDefinitions
    core/Utilities                  # was: Utilities
    core/Logger                     # was: Logger
    data/SkillConstants             # was: SkillConstants
    data/Skill                      # was: Skill
    map/BattleMapElement            # was: BattleMapElement
    map/Tile                        # was: Tile
    map/Structures                  # was: Structures
    map/Cell                        # was: Cell
    map/Table                       # was: Table
    data/HeroInfoConstants          # was: HeroInfoConstants
    data/HeroInfo                   # was: HeroInfo
    data/UnitConstants              # was: UnitConstants
    unit/BattleContext              # was: BattleContext
    unit/Unit                       # was: Unit
    unit/UnitManager                # was: UnitManager
    map/BattleMap                   # was: BattleMap
    unit/GlobalBattleContext        # was: GlobalBattleContext
    combat/DamageCalculationUtility # was: DamageCalculationUtility
    combat/DamageCalculator         # was: DamageCalculator
    combat/PostCombatSkillHander    # was: PostCombatSkillHander
    combat/DamageCalculatorWrapper  # was: DamageCalculatorWrapper
    combat/BeginningOfTurnSkillHandler # was: BeginningOfTurnSkillHandler
    database/SkillDatabase          # was: SkillDatabase
    database/HeroDatabase           # was: HeroDatabase
    database/SampleSkillInfos       # was: SampleSkillInfos
    database/SampleHeroInfos        # was: SampleHeroInfos
    skill-dsl/SkillEffectCore       # was: SkillEffectCore
    skill-dsl/SkillEffectEnv        # was: SkillEffectEnv
    skill-dsl/SkillEffect           # was: SkillEffect
    skill-dsl/SkillEffectField      # was: SkillEffectField
    skill-dsl/SkillEffectUnit       # was: SkillEffectUnit
    skill-dsl/SkillEffectBattleContext # was: SkillEffectBattleContext
    skill-dsl/SkillEffectHooks      # was: SkillEffectHooks
    skill-dsl/SkillEffectRegistrar  # was: SkillEffectRegistrar
    skill-dsl/SkillEffectAliases    # was: SkillEffectAliases
    skill-impl/CustomSkill          # was: CustomSkill
    skill-impl/SkillImpl            # was: SkillImpl
    skill-impl/SkillImpl202408      # was: SkillImpl202408
    skill-impl/SkillImpl202501      # was: SkillImpl202501
    skill-impl/SkillImpl202601      # was: SkillImpl202601
    TestUtilities                   # ルートに維持
    )
# cat行は変更不要: cat ./Sources/${name}.js >> ./$TARGET_FILE
```

**注意**: 同一ディレクトリのファイルが連続していないのは意図的。現行のロード順を維持するため。

### HTMLファイルのloadScripts/additionalScripts配列

ファイル名にディレクトリプレフィックスを追加:

```javascript
// Before
"GlobalDefinitions.js",
// After
"core/GlobalDefinitions.js",
```

### Deploy.bat

`Deploy.bat` は `BF` だけでなく、`ef` / `im` / ページ個別の引数列も更新対象である。**ディレクトリプレフィックスの追加対象は `BF` 変数に限定されない**。SkillEffect 系、SkillImpl 系、各ページ専用ファイル指定を含めて、`Sources\...js` に解決される全エントリを更新する。

```bat
rem Before
set ef=SkillEffectCore,SkillEffectEnv,SkillEffect,...
set im=SkillEffectAliases,CustomSkill,SkillImpl,...
set BF=GlobalDefinitions,Utilities,...
call %~dp0MergeSourcesAndCompress.bat FehArenaSimulator %battle_simulator_filenames%,ArenaSimulatorMain

rem After
set ef=skill-dsl\SkillEffectCore,skill-dsl\SkillEffectEnv,skill-dsl\SkillEffect,...
set im=skill-dsl\SkillEffectAliases,skill-impl\CustomSkill,skill-impl\SkillImpl,...
set BF=core\GlobalDefinitions,core\Utilities,...
call %~dp0MergeSourcesAndCompress.bat FehArenaSimulator %battle_simulator_filenames%,pages\ArenaSimulatorMain
```

### Local.js

SKILL_EFFECT_FILESとSKILL_IMPL_FILESのパスにディレクトリプレフィックスを追加:

```javascript
const SKILL_EFFECT_FILES = [
    "skill-dsl/SkillEffectCore.js",
    "skill-dsl/SkillEffectEnv.js",
    // ...
];
const SKILL_IMPL_FILES = [
    "skill-impl/CustomSkill.js",
    "skill-impl/SkillImpl.js",
    // ...
];
```

**補足**: `TestUtilities.js` のように `Sources/` ルートへ維持するファイルは、例外的にディレクトリプレフィックスを付与しない。

---

## update_skillsブランチとのコンフリクト対策

### コンフリクト発生箇所の予測

| ファイル | リスク | 理由 |
|---------|-------|------|
| SkillImpl系ファイル | 高 | git mvによるrenameとupdate_skillsでの内容変更 |
| Local.js | 中 | SKILL_IMPL_FILESへの新ファイル追加 |
| HTML（loadScripts） | 中 | SkillImpl系の追加 |
| create_tests.sh | 中 | SOURCE_FILE_NAMESへの新ファイル追加 |
| Deploy.bat | 中 | skill_impl_filenames変数 |

### 緩和策

1. **SkillImpl系は最後のバッチ（バッチ10）で移動**: コンフリクト期間を最小化
2. **git mvの徹底**: フォーマット変更を混ぜない（Gitのrename検出を確実にする）
3. **Phase 2a全体を集中的に実施**: コンフリクト期間の短縮
4. **バッチ10を移動しない選択肢も維持**: マージコストが高すぎる場合

### マージ手順

```
1. update_skillsブランチでPhase 2a完了をコミット
2. masterにマージ
3. コンフリクト解決:
   a. SkillImpl系ファイル: 新パスで内容はupdate_skills側を採用
   b. Local.js / HTML / create_tests.sh / Deploy.bat: 新パス形式で新ファイル名を追加
4. テスト実行 + ブラウザ確認
5. コミット
```

---

## 設計検証チェックリスト

- [x] 全64 JSファイルがいずれかのディレクトリに割り当てられている（漏れなし）
- [x] 1ディレクトリあたり5〜9ファイルの粒度（最小5、最大9）
- [x] 循環依存がディレクトリ境界を跨ぐことは許容し、記録済み（39ファイルSCC）
- [x] SkillImpl系ファイルの移動は最後のバッチ（条件付き実施、コンフリクト対策）
- [x] 移動バッチ計画の各バッチで更新対象が明確
- [x] 周辺ファイル（create_tests.sh, HTML, Deploy.bat, Local.js）のパス更新方式が確定
- [x] update_skillsブランチとのコンフリクト対策手順が記載
