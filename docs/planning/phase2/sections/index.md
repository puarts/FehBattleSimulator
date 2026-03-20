<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: ./run_tests.sh
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-build-filter
section-02-stage-a-infra
section-03-stage-b-constants
section-04-stage-c-data
section-05-stage-d-info
section-06-stage-e-skill-dsl
section-07-stage-f-core
section-08-stage-g-skill-impl
section-09-stage-h-combat
section-10-stage-ij-app-ui
section-11-esm-validation
END_MANIFEST -->

# Phase 2 セクションインデックス

## 依存グラフ

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-build-filter | - | all | Yes |
| section-02-stage-a-infra | 01 | 03, 04, 05, 06 | Yes |
| section-03-stage-b-constants | 02 | 04, 05, 07, 08 | Yes |
| section-04-stage-c-data | 02, 03 | 05, 07 | Yes |
| section-05-stage-d-info | 03, 04 | 07, 08, 09 | Yes |
| section-06-stage-e-skill-dsl | 02 | 08 | Yes |
| section-07-stage-f-core | 03, 04, 05 | 08, 09, 10 | No |
| section-08-stage-g-skill-impl | 03, 06, 07 | 09 | No |
| section-09-stage-h-combat | 07, 08 | 10 | No |
| section-10-stage-ij-app-ui | 07, 08, 09 | 11 | No |
| section-11-esm-validation | all | - | No |

## 実行順序

1. section-01-build-filter（依存なし）
2. section-02-stage-a-infra（01の後）
3. section-03-stage-b-constants, section-06-stage-e-skill-dsl（02の後、並行可能）
4. section-04-stage-c-data（02, 03の後）
5. section-05-stage-d-info（03, 04の後）
6. section-07-stage-f-core（03, 04, 05の後 — 循環依存解消含む）
7. section-08-stage-g-skill-impl（03, 06, 07の後）
8. section-09-stage-h-combat（07, 08の後）
9. section-10-stage-ij-app-ui（07, 08, 09の後）
10. section-11-esm-validation（全セクション完了後）

## セクション概要

### section-01-build-filter
build.mjs と create_tests.sh に import/export 行除去フィルタを追加。フィルタの検証テスト。

### section-02-stage-a-infra
依存なしのインフラ層ファイル（Utilities, Logger, Cell, Table, BattleMapElement, AudioManager, GlobalDefinitions）をESM化。

### section-03-stage-b-constants
定数・列挙型（SkillConstants, HeroInfoConstants, UnitConstants）をESM化。

### section-04-stage-c-data
データ構造（Tile, Structures, BattleMapSettings, TurnSetting, Skill）をESM化。

### section-05-stage-d-info
情報クラス・データベース（HeroInfo, SkillDatabase, HeroDatabase, SampleSkillInfos, SampleHeroInfos）をESM化。

### section-06-stage-e-skill-dsl
スキルDSL基盤（SkillEffectCore〜SkillEffectAliases の9ファイル）をESM化。独立した系統のため早期に変換可能。

### section-07-stage-f-core
コアゲームクラス（BattleContext, GlobalBattleContext, UnitManager, Unit, BattleMap）をESM化。Unit ↔ DamageCalculator の循環依存解消を含む。

### section-08-stage-g-skill-impl
スキル実装の副作用モジュール（CustomSkill, SkillImpl, SkillImpl202408〜202601）をESM化。import文の追加。

### section-09-stage-h-combat
戦闘計算（DamageCalculationUtility, DamageCalculator, PostCombatSkillHander, DamageCalculatorWrapper, BeginningOfTurnSkillHandler）をESM化。

### section-10-stage-ij-app-ui
アプリ層・UI・エントリポイント（AppData, SettingManager, BattleSimulatorBase, VueComponents, *Main.js, TestUtilities.js）をESM化。

### section-11-esm-validation
最終検証。ネイティブESMモードでの TDZ エラー検証、全テスト・ビルドの最終確認。
