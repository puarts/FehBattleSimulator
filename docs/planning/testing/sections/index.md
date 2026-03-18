<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: ./run_tests.sh
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-test-split
section-02-unit-builder
section-03-battle-scenario-builder
section-04-coverage-perf
section-05-skill-regression-template
section-06-skill-regression-tests
section-07-combat-logic-tests
section-08-dsl-node-tests
END_MANIFEST -->

# Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-test-split | - | 02, 03, 04 | Yes |
| section-02-unit-builder | 01 | 03, 05 | No |
| section-03-battle-scenario-builder | 02 | 05, 06, 07 | No |
| section-04-coverage-perf | 01 | - | Yes |
| section-05-skill-regression-template | 03 | 06 | No |
| section-06-skill-regression-tests | 05 | - | No |
| section-07-combat-logic-tests | 03 | - | Yes |
| section-08-dsl-node-tests | 01 | - | Yes |

## Execution Order

1. section-01-test-split (no dependencies)
2. section-02-unit-builder, section-04-coverage-perf, section-08-dsl-node-tests (parallel after 01)
3. section-03-battle-scenario-builder (after 02)
4. section-05-skill-regression-template, section-07-combat-logic-tests (parallel after 03)
5. section-06-skill-regression-tests (after 05)

## Section Summaries

### section-01-test-split
テスト分割実行アーキテクチャ。create_tests.shのカテゴリ対応、run_tests.sh連携、新規テストファイルのTEST_FILE_NAMES登録、AIエージェント向けガイドライン。

Plan: セクション2
TDD: セクション2

### section-02-unit-builder
UnitBuilderクラスの実装。fromHero/default/createDummy、フルーエントAPI（withStats, withWeapon等）、グローバル状態管理（resetGlobalTestState）、RegressionTestHelper。

Plan: セクション3.1, 3.3, 3.4
TDD: セクション3.1, 3.3, 3.4

### section-03-battle-scenario-builder
BattleScenarioBuilderクラスの実装。ユニット登録・位置自動配置・戦闘実行・ターン開始実行・状態クリーンアップ。

Plan: セクション3.2
TDD: セクション3.2

### section-04-coverage-perf
カバレッジ測定導入（jest.config.js変更、CI連携）とパフォーマンス回帰テスト（Performance.test.js、ウォームアップ、CI閾値）。

Plan: セクション4, 5
TDD: セクション4, 5

### section-05-skill-regression-template
スキルリグレッションテストのテンプレートパターン確立。createDummy使用、テスト構造の標準化、数スキルでのテンプレート検証。

Plan: セクション6.1, 6.3, 6.4
TDD: セクション6（テンプレート検証部分）

### section-06-skill-regression-tests
SkillImpl202601.js/202501.jsの全スキルリグレッションテスト。テンプレートを使った大量テスト生成。

Plan: セクション6.2
TDD: セクション6（スキルテスト部分）

### section-07-combat-logic-tests
戦闘ロジックテスト全般。奥義カウント変動、追撃判定、ダメージ軽減、戦闘フロー、ステータス効果、FEH固有エッジケース。

Plan: セクション7
TDD: セクション7

### section-08-dsl-node-tests
DSLノードの単体テスト拡充。効果ノード、条件ノード、合成ノード、対象ノード、フックタイミング。

Plan: セクション8
TDD: セクション8
