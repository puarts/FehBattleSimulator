<!-- PROJECT_CONFIG
runtime: javascript-npm
test_command: ./run_tests.sh
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-performance-profile
section-02-scoped-tile-changer
section-03-unit-context
section-04-unit-utility
END_MANIFEST -->

# Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-performance-profile | - | section-02 | Yes |
| section-02-scoped-tile-changer | section-01 | section-03 | No |
| section-03-unit-context | section-02 | section-04 | No |
| section-04-unit-utility | section-03 | - | No |

## Execution Order

1. section-01-performance-profile (Phase A-1, 依存なし)
2. section-02-scoped-tile-changer (Phase A-2, section-01完了後)
3. section-03-unit-context (Phase B-1, section-02完了後)
4. section-04-unit-utility (Phase B-2, section-03完了後)

各セクションは順次実行する。前のステップでロード順序リストが正しく更新されていることが後続ステップの前提となるため、並列実行は不可。

## Section Summaries

### section-01-performance-profile
PerformanceProfileクラスをDamageCalculatorWrapper.jsから`Sources/combat/PerformanceProfile.js`に抽出。依存なしの純ユーティリティ。事前チェック、ファイル作成、ロード順序3系統更新、ESLint対応、テスト+ブラウザsmoke check。

### section-02-scoped-tile-changer
ScopedTileChangerクラスをDamageCalculatorWrapper.jsから`Sources/combat/ScopedTileChanger.js`に抽出。Unit/setUnitToTileへの依存あり。事前チェック、ファイル作成、ロード順序3系統更新、ESLint対応、テスト+ブラウザsmoke check。

### section-03-unit-context
Unit.jsから4つの独立クラス（AttackableUnitInfo, AttackEvaluationContext, AssistableUnitInfo, ActionContext）を`Sources/unit/UnitContext.js`に抽出。PrecombatContextはBattleContext.jsに例外的に再配置。事前チェック（CombatResultTypeロード順確認、パース時Unit評価なし確認）、ファイル作成、ロード順序3系統更新（全7HTML）、ESLint対応、テスト+ブラウザsmoke check。

### section-04-unit-utility
Unit.js末尾のユーティリティ関数群（UnitUtil, calcBuffAmount, calcHealAmount, isDebufferTier1/2, isAfflictor, canRefreshTo）を`Sources/unit/UnitUtility.js`に抽出。最も広範な依存関係を持つため事前チェックが最重要（全参照元grep必須）。ファイル作成、ロード順序3系統更新（全7HTML）、ESLint対応、テスト+ブラウザsmoke check。
