# Section 01: テスト分割実行アーキテクチャ

## 概要

AIエージェントがスキル実装後に関連テストのみ実行できるよう、`create_tests.sh` にカテゴリ別テスト分割を導入し、`run_tests.sh` と連携させる。新規テストファイル9個の登録枠も準備する。

この作業は他セクションに依存せず、セクション02（UnitBuilder）、03（BattleScenarioBuilder）、04（カバレッジ）、08（DSLノードテスト）の前提となる。

## 対象ファイル

| ファイル | 操作 | 内容 |
|---------|------|------|
| `/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh` | 変更 | カテゴリ引数対応、新規テストファイル登録 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/run_tests.sh` | 変更 | カテゴリ引数転送、カテゴリ指定時ESLintスキップ |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/.gitignore` | 変更 | `coverage/` 追加 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/SkillRegression.test.js` | 新規 | 空のテストファイル（プレースホルダ） |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/CombatFlow.test.js` | 新規 | 空のテストファイル |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/SpecialCount.test.js` | 新規 | 空のテストファイル |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DamageReduction.test.js` | 新規 | 空のテストファイル |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/FollowUpAttack.test.js` | 新規 | 空のテストファイル |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/StatusEffect.test.js` | 新規 | 空のテストファイル |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DslNode.test.js` | 新規 | 空のテストファイル |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/Performance.test.js` | 新規 | 空のテストファイル |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/TestHelper.test.js` | 新規 | 空のテストファイル |

## テスト（手動検証）

シェルスクリプトの変更はJest自動テストではなく手動検証で確認する。以下のすべてが成功すること。

### create_tests.sh カテゴリ対応の検証

1. `./create_tests.sh` （引数なし）で全テストファイル（既存6個 + 新規9個 = 15個）が `All.test.js` に結合される
2. `./create_tests.sh skill` で `SkillRegression.test.js` のみが結合される（ソースファイルは全て含まれる）
3. `./create_tests.sh combat` で `DamageCalculator.test.js`, `BeginningOfTurnSkillHandler.test.js`, `CombatFlow.test.js`, `SpecialCount.test.js`, `DamageReduction.test.js`, `FollowUpAttack.test.js`, `StatusEffect.test.js` が結合される
4. `./create_tests.sh dsl` で `SkillEffect.test.js`, `GetRequirements.test.js`, `DslNode.test.js` が結合される
5. `./create_tests.sh infra` で `UnitManager.test.js`, `SimpleUtility.test.js`, `Performance.test.js`, `TestHelper.test.js` が結合される
6. 存在しないカテゴリ（例: `./create_tests.sh foo`）は全テスト実行にフォールバックする

### run_tests.sh カテゴリ連携の検証

1. `./run_tests.sh skill` でESLintがスキップされ、スキルテストのみ実行される
2. `./run_tests.sh` （引数なし）で従来通りESLint + 全テストが実行される
3. `./run_tests.sh combat` でESLintがスキップされ、戦闘テストのみ実行される

### 回帰確認

- 変更後に `./run_tests.sh` （引数なし）を実行し、既存188テストがすべてパスすることを確認する

## 実装詳細

### 1. 新規テストファイルの作成

9個の新規テストファイルを `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/` に作成する。各ファイルは最低限の空describeブロックを持つ。これにより `create_tests.sh` が結合時にエラーを起こさない。

各ファイルの内容は最小限でよい。例:

```javascript
// Tests/SkillRegression.test.js
describe('Skill Regression Tests', () => {
    // テストはsection-05, section-06で追加
});
```

同様のパターンで以下を作成:
- `CombatFlow.test.js` — `describe('Combat Flow Tests', ...)`
- `SpecialCount.test.js` — `describe('Special Count Tests', ...)`
- `DamageReduction.test.js` — `describe('Damage Reduction Tests', ...)`
- `FollowUpAttack.test.js` — `describe('Follow-Up Attack Tests', ...)`
- `StatusEffect.test.js` — `describe('Status Effect Tests', ...)`
- `DslNode.test.js` — `describe('DSL Node Tests', ...)`
- `Performance.test.js` — `describe('Performance Benchmarks', ...)`
- `TestHelper.test.js` — `describe('Test Helper Tests', ...)`

### 2. create_tests.sh の変更

現在のファイル構造（`/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh`）:

```bash
SOURCE_FILE_NAMES=(...)   # 44ソースファイル
TEST_UTIL_FILE_NAMES=(TestGlobals)
TEST_FILE_NAMES=(...)     # 6テストファイル
```

変更内容:

**A. TEST_FILE_NAMES に新規9ファイルを追加:**

```bash
TEST_FILE_NAMES=(
    # 既存
    DamageCalculator
    UnitManager
    BeginningOfTurnSkillHandler
    SkillEffect
    GetRequirements
    SimpleUtility
    # 新規
    SkillRegression
    CombatFlow
    SpecialCount
    DamageReduction
    FollowUpAttack
    StatusEffect
    DslNode
    Performance
    TestHelper
)
```

**B. カテゴリ引数によるテストファイル選択ロジックを追加:**

スクリプトの先頭（`TARGET_FILE=All.test.js` の前）で、第1引数 `$1` に基づいて `TEST_FILES` 配列を決定する case 文を挿入する。

```bash
# カテゴリに応じたテストファイル選択
case "$1" in
  skill)
    SELECTED_TEST_FILES=(SkillRegression)
    ;;
  combat)
    SELECTED_TEST_FILES=(DamageCalculator BeginningOfTurnSkillHandler
                         CombatFlow SpecialCount DamageReduction
                         FollowUpAttack StatusEffect)
    ;;
  dsl)
    SELECTED_TEST_FILES=(SkillEffect GetRequirements DslNode)
    ;;
  infra)
    SELECTED_TEST_FILES=(UnitManager SimpleUtility Performance TestHelper)
    ;;
  *)
    SELECTED_TEST_FILES=("${TEST_FILE_NAMES[@]}")
    ;;
esac
```

テストファイル結合ループを `SELECTED_TEST_FILES` を使うように変更:

```bash
for name in ${SELECTED_TEST_FILES[@]}; do
    cat ./Tests/${name}.test.js >> ./$TARGET_FILE
done
```

**重要**: ソースファイル（`SOURCE_FILE_NAMES`）とテストユーティリティ（`TEST_UTIL_FILE_NAMES`）の結合はカテゴリに関係なく常に全ファイルを含める。テストファイルのみがカテゴリでフィルタリングされる。

### 3. run_tests.sh の変更

現在のファイル構造（`/Users/studio/Documents/GitHub/FehBattleSimulator/run_tests.sh`）:

```bash
./create_tests.sh
# ... 引数の有無で npm test / npm run test:only を切り替え
```

変更内容:

**A. カテゴリ引数を create_tests.sh に転送する。** 既知のカテゴリ名（`skill`, `combat`, `dsl`, `infra`）が第1引数の場合、それを `create_tests.sh` に渡し、ESLintをスキップして `npm run test:only` で実行する。

**B. カテゴリ以外の引数（例: `--testNamePattern "pattern"`）は従来通り Jest に渡す。**

ロジックの概要:

```bash
#!/usr/bin/env bash

CATEGORIES="skill combat dsl infra"
CATEGORY=""

# 第1引数がカテゴリ名かチェック
for cat in $CATEGORIES; do
  if [ "$1" = "$cat" ]; then
    CATEGORY="$1"
    shift  # カテゴリ引数を消費
    break
  fi
done

# create_tests.sh にカテゴリを渡す
./create_tests.sh $CATEGORY

TARGET_FILE=All.test.js

if [ -n "$CATEGORY" ] || [ $# -gt 0 ]; then
  # カテゴリ指定時またはJest引数ありの場合: ESLintスキップ
  npm run test:only -- "$@"
else
  # 引数なし: 従来の npm test (jest + eslint)
  npm test
fi

rm $TARGET_FILE
```

**設計判断**: カテゴリ指定時にESLintをスキップする理由は、AIエージェントが高速にテスト結果を得るため。CIでは引数なしで実行するため、ESLintは常にCI上で動く。

### 4. .gitignore への追加

`/Users/studio/Documents/GitHub/FehBattleSimulator/.gitignore` の `# Generated files` セクション末尾に `coverage/` を追加:

```
# Generated files
All.test.js
coverage/
```

### カテゴリ定義の意味

| カテゴリ | 目的 | テストファイル |
|---------|------|-------------|
| `skill` | 特定スキルIDの効果検証リグレッションテスト | SkillRegression |
| `combat` | 戦闘メカニクス（追撃、奥義、ダメージ軽減等）のテスト | DamageCalculator, BeginningOfTurnSkillHandler, CombatFlow, SpecialCount, DamageReduction, FollowUpAttack, StatusEffect |
| `dsl` | DSLノードの単体評価・合成テスト | SkillEffect, GetRequirements, DslNode |
| `infra` | ユーティリティ、ヘルパー、パフォーマンスベンチマーク | UnitManager, SimpleUtility, Performance, TestHelper |

### AIエージェント向けガイドライン

この分割が完了すると、AIエージェントは以下のワークフローで作業できる:

- スキル実装後: `./run_tests.sh skill` で関連テストのみ高速実行
- DSLノード変更後: `./run_tests.sh dsl` でDSLテストのみ実行
- 最終確認: `./run_tests.sh` で全テスト + ESLint
- `All.test.js` は結合生成ファイルのため直接読み込み禁止（コンテキストウィンドウの浪費）
- テスト追加は `Tests/*.test.js` の個別ファイルを直接編集する