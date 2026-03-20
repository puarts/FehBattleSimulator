I now have comprehensive understanding. Let me produce the section content.

# Section 06: Stage E -- スキルDSL基盤のESM化

## 概要

スキルDSL基盤を構成する9ファイルを ES Modules 化する。これらのファイルは独立した系統を形成しており、コアゲームクラス（Unit, BattleContext 等）への依存が軽微なため、Stage B (定数) や Stage C (データ構造) と並行して早期に変換できる。

**対象ファイル** (変換順):

| 順序 | ファイル | 主な定義 | 依存先 |
|------|---------|---------|--------|
| 1 | `Sources/SkillEffectCore.js` | `MultiValueMap`, `SkillEffectHooks` クラス | なし |
| 2 | `Sources/SkillEffectEnv.js` | `NodeEnv` | Logger（型参照のみ） |
| 3 | `Sources/SkillEffect.js` | `SkillEffectNode`, `SingleEffectNode`, `EffectsNode`, `BoolNode`, `NumberNode`, `TRUE_NODE`, `FALSE_NODE`, `IF_NODE` 等 多数 | Logger, Utilities |
| 4 | `Sources/SkillEffectField.js` | `SkillEffectField`, `SkillEffectFieldNode`, `ModSkillEffectFieldNode`, `GetSkillEffectFieldNode` | SkillEffect |
| 5 | `Sources/SkillEffectUnit.js` | `UNIT`, `FOE`, `ALLY`, `SKILL_OWNER` 等のユニット指定子 | SkillEffect, SkillEffectEnv |
| 6 | `Sources/SkillEffectBattleContext.js` | `CallBattleContextFuncNode`, `makeBattleContextFieldOperators` 等 | SkillEffectField |
| 7 | `Sources/SkillEffectHooks.js` | `AT_START_OF_COMBAT_HOOKS`, `AFTER_COMBAT_HOOKS` 等 25+ のグローバルフックインスタンス | SkillEffectCore |
| 8 | `Sources/SkillEffectRegistrar.js` | `SkillEffectRegistrar` クラス | SkillEffectCore, SkillEffectHooks |
| 9 | `Sources/SkillEffectAliases.js` | `GRANTS_BONUS`, `INFLICTS_PENALTY`, `ATK_SPD`, `ATK_SPD_DEF_RES`, `DEALS_DAMAGE`, `REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY` 等 | 全 SkillEffect* ファイル |

## 依存関係

- **前提**: section-02-stage-a-infra（Utilities.js, Logger.js が ESM 化済みであること）
- **後続**: section-08-stage-g-skill-impl が本セクションに依存（SkillImpl ファイルが DSL 基盤を import する）

section-02 で Utilities.js と Logger.js の export が完了していれば、本セクションの作業を開始できる。section-03 (定数) が未完了でも、SkillEffectCore.js 等は定数ファイルに依存しないため問題ない。ただし `SkillEffectRegistrar.js` が `SkillRequirement` を参照する箇所や、`SkillEffectAliases.js` が `StatusIndex` 等を参照する箇所があり、これらは Stage B/C/D のシンボルだが、結合モードではグローバルに存在するため動作する。ESM ネイティブモードで完全に動作させるのは section-11 の最終検証で確認する。

## テスト

以下のテストは既存の `Tests/SmokeTest.test.js` で既にカバーされている。Stage E の変換後、これらが引き続きパスすることを確認する。

### 既存テストによる回帰確認

```
# Test: SkillEffectCore.js -- SkillEffectHooks クラスが定義されている
#   => SmokeTest: 'スキル効果フックが定義されている' (AT_START_OF_COMBAT_HOOKS 等)

# Test: SkillEffect.js -- SkillEffectNode, SingleEffectNode, EffectsNode が定義されている
#   => SmokeTest: 'スキルDSL基盤が定義されている'

# Test: SkillEffectAliases.js -- GRANTS_BONUS, INFLICTS_PENALTY, ATK_SPD 等のDSL関数が定義されている
#   => SmokeTest: 'DSL関数が定義されている'

# Test: SkillEffectHooks.js -- AT_START_OF_COMBAT_HOOKS 等のフックが定義されている
#   => SmokeTest: 'スキル効果フックが定義されている'

# Test: SkillEffectRegistrar.js -- SkillEffectRegistrar が定義されている
#   => SmokeTest: 'スキルDSL基盤が定義されている'
```

### 各ファイル変換後の確認手順

各ファイルの変換後に `./run_tests.sh` を実行し、全305テスト + スモークテストがパスすることを確認する。特に以下のテストカテゴリが影響を受けやすい:

- `SmokeTest` -- グローバル変数の存在確認
- `DslNode` -- DSL ノードの動作テスト
- `SkillEffect` -- スキル効果のテスト
- `SkillRegression` -- スキル回帰テスト（DSL を使用したスキルが正常動作するか）

## 実装手順

### 前提条件の確認

section-01 のビルドフィルタ（`build.mjs` と `create_tests.sh` の import/export 行除去）が適用済みであること。これがないと export/import 文の追加で結合出力が壊れる。

### コーディング規約（全ファイル共通）

- **import 文は必ず1行で記述する**（複数行にまたがるのは禁止）
- **export スタイルは末尾まとめ `export { ... };` に統一**（インライン export は禁止）
- import 文はファイル先頭、export 文はファイル末尾

### ファイル 1: SkillEffectCore.js

**パス**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectCore.js`

このファイルは外部依存がゼロ。`MultiValueMap` と `SkillEffectHooks` クラスを定義する。

**作業**:
- ファイル末尾に export 文を追加。import は不要（依存なし）。

```javascript
// SkillEffectCore.js 末尾に追加
export { MultiValueMap, SkillEffectHooks };
```

`SkillEffectHooks` クラスは `CustomSkill.FUNC_ID_TO_FUNC` をメソッド内で参照しているが、これは実行時参照（`evaluate()` メソッド内）であり、初期化時には問題にならない。結合モードではグローバルに存在するため動作する。

### ファイル 2: SkillEffectEnv.js

**パス**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectEnv.js`

`NodeEnv` クラスを定義。`LoggerBase`（Logger.js）と `GroupLogger` を型参照で使用。`Unit`, `BattleMap`, `DamageCalculator` 等への型参照もあるが、これらはプロパティの JSDoc 型アノテーションのみで、実行時にはインスタンスが代入されるだけ。

**作業**:
- ファイル先頭に Logger からの import を追加
- ファイル末尾に export 文を追加

```javascript
// SkillEffectEnv.js 先頭に追加
import { LoggerBase, GroupLogger } from './Logger.js';

// SkillEffectEnv.js 末尾に追加
export { NodeEnv };
```

**注意**: `NodeEnv` が参照する `Unit`, `BattleMap`, `DamageCalculator` 等はプロパティの型アノテーションのみ（`/** @type {Unit} */` の形）で、実行時のクラス参照はない。これらの import は不要。

### ファイル 3: SkillEffect.js

**パス**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffect.js`

最も大きいファイル（2000行以上）。DSL のコアノードクラス群を定義する。`SkillEffectNode`（基底クラス）、`SingleEffectNode`、`EffectsNode`、`BoolNode`、`NumberNode`、`TRUE_NODE`、`FALSE_NODE`、`IF_NODE` 等の多数のクラスと関数。

**作業**:
- ファイル先頭に import を追加
- ファイル末尾に export 文を追加

```javascript
// SkillEffect.js 先頭に追加
import { NodeEnv } from './SkillEffectEnv.js';
```

export 対象が非常に多い（50個以上のクラス・関数・定数）。ファイル末尾で使用されている全てのグローバルシンボルを列挙する必要がある。ファイルの全体を精査し、他ファイルから参照されるシンボルを漏れなく export する。

主要な export 対象（抜粋 -- 実際にはファイル内の全 public クラス・関数・定数を列挙すること）:

- クラス: `SkillEffectNode`, `SingleEffectNode`, `EffectsNode`, `BoolNode`, `NumberNode`, `NumbersNode`, `FromNumberNode`, `FromNumbersNode`, `PositiveNumberNode`, `CollectionNode`, `SetNode`, `CompareNode`, `IfNode`, `IfElseNode`, `NumberOperationNode`, `ConstantNumberNode`, `EnvUnitNode`, `CacheNode`, `StoreNumNode`, `ReadNumNode`, `WrapBoolNode` 等
- 関数/定数: `TRUE_NODE`, `FALSE_NODE`, `IF_NODE`, `IF`, `IF_ELSE_NODE`, `IF_ELSE`, `AND_NODE`, `OR_NODE`, `NOT_NODE`, `ADD_NODE`, `SUB_NODE`, `MULT_NODE`, `MULT_TRUNC_NODE`, `MIN_NODE`, `MAX_NODE`, `SUM_NODE`, `GT_NODE`, `GTE_NODE`, `LT_NODE`, `LTE_NODE`, `EQ_NODE`, `COND_OP`, `IF_VALUE_NODE`, `ENSURE_MIN_NODE`, `ENSURE_MAX_NODE`, `ENSURE_MIN_MAX_NODE`, `CONSTANT_NUMBER_NODE`, `ZERO_NUMBER_NODE`, `CACHE_NODE`, `READ_CACHE_NODE`, `READ_NUM_NODE`, `READ_NUM_AT_NODE`, `X_NUM_NODE`, `APPLY_X_NODE`, `USE_X_NODE`, `APPLY_X_NODES`, `UNLESS_NODE`, `SOME_NODE`, `TO_BOOL`, `SET_SKILL_FUNCS`, `CANNOT_ANY`, `UNION_SET_NODE`, `SET_SIZE_NODE`, `IF_EXPRESSION_NODE`, `MULT_ADD_NODE`, `MULT_MAX_NODE`, `MULT_ADD_MAX_NODE`, `ADD_MULT_NODE`, `ADD_MULT_MAX_NODE`, `ADD_MAX_NODE`, `MAX_ADD_NODE`, `IS_ODD_NODE`, `IS_EVEN_NODE`, `GREATER` 等
- Mixin: `GetUnitMixin`, `GetTargetsFoeMixin`, `GetTargetsAllyMixin`, `GetUnitDuringCombatMixin`, `GetFoeDuringCombatMixin`, `GetSkillOwnerMixin`, `GetAssistTargetsAllyMixin` 等

**重要**: export 対象が膨大なため、1行の export 文が非常に長くなる可能性がある。その場合でも必ず1行に収めること（規約）。実装時にファイル全体を走査して、定義されたクラス名・関数名・const 定数名を全て列挙する。

### ファイル 4: SkillEffectField.js

**パス**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectField.js`

`SkillEffectField`, `SkillEffectFieldNode`, `ModSkillEffectFieldNode`, `GetSkillEffectFieldNode` 等を定義。

**作業**:
- ファイル先頭に SkillEffect.js からの import を追加
- ファイル末尾に export 文を追加

```javascript
// SkillEffectField.js 先頭
import { SkillEffectNode, SingleEffectNode, NumberNode } from './SkillEffect.js';

// SkillEffectField.js 末尾
export { SkillEffectField, SkillEffectFieldNode, ModSkillEffectFieldNode, GetSkillEffectFieldNode };
```

実際の import/export 対象はファイル内容を精査して決定する。

### ファイル 5: SkillEffectUnit.js

**パス**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectUnit.js`

`UNIT`, `FOE`, `ALLY`, `SKILL_OWNER` 等のユニット指定ノードを定義。`EnvUnitNode`（SkillEffect.js）と `NodeEnv`（SkillEffectEnv.js）に依存。

**作業**:
```javascript
// SkillEffectUnit.js 先頭
import { EnvUnitNode } from './SkillEffect.js';
import { NodeEnv } from './SkillEffectEnv.js';

// SkillEffectUnit.js 末尾
export { UNIT, FOE, SKILL_OWNER };
```

ファイル内で定義される全てのグローバルシンボルを export 対象に含める。

### ファイル 6: SkillEffectBattleContext.js

**パス**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectBattleContext.js`

`makeBattleContextFieldOperators`, `CallBattleContextFuncNode`, `MOD_BATTLE_CONTEXT_FIELD`, `GET_BATTLE_CONTEXT_FIELD` 等を定義。

**作業**:
```javascript
// SkillEffectBattleContext.js 先頭
import { SingleEffectNode } from './SkillEffect.js';
import { SkillEffectField, ModSkillEffectFieldNode, GetSkillEffectFieldNode } from './SkillEffectField.js';

// SkillEffectBattleContext.js 末尾 -- 定義されたシンボルを列挙
export { makeBattleContextFieldOperators, CallBattleContextFuncNode, MOD_BATTLE_CONTEXT_FIELD, GET_BATTLE_CONTEXT_FIELD };
```

### ファイル 7: SkillEffectHooks.js

**パス**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectHooks.js`

25個以上のグローバルフックインスタンス（`AT_START_OF_COMBAT_HOOKS`, `AFTER_COMBAT_HOOKS` 等）を定義。全て `new SkillEffectHooks()` で生成。

**作業**:
```javascript
// SkillEffectHooks.js 先頭
import { SkillEffectHooks } from './SkillEffectCore.js';

// SkillEffectHooks.js 末尾 -- 全フックインスタンスを列挙
export { AT_START_OF_COMBAT_HOOKS, CAN_TRIGGER_CANTO_HOOKS, AT_START_OF_TURN_HOOKS, AFTER_COMBAT_HOOKS, ... };
```

export 対象が50個以上のフックインスタンスになる。ファイル末尾でまとめて1行 export する。行が長くなるが規約上許容される（改行禁止）。

末尾の `DURING_COMBAT_INCLUDING_AOE_HOOKS` と `DURING_COMBAT_USING_STATS_INCLUDING_AOE_HOOKS` は匿名クラスのインスタンスだが、他ファイルから参照されるため export 対象に含める。

### ファイル 8: SkillEffectRegistrar.js

**パス**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectRegistrar.js`

`SkillEffectRegistrar` クラスを定義。内部で多数のフックインスタンス（SkillEffectHooks.js）を参照する。

**作業**:
```javascript
// SkillEffectRegistrar.js 先頭
import { SkillEffectHooks } from './SkillEffectCore.js';
import { AT_START_OF_COMBAT_HOOKS, WHEN_APPLIES_POTENT_EFFECTS_HOOKS, NON_STATS_SKILL_USING_STATS_HOOKS, STATS_SKILL_USING_STATS_HOOKS, FOR_ALLIES_AT_START_OF_COMBAT_HOOKS, FOR_ALLIES_WHEN_APPLIES_POTENT_EFFECTS_HOOKS, FOR_ALLIES_NON_STATS_SKILL_USING_STATS_HOOKS, FOR_ALLIES_STATS_SKILLS_USING_STATS_HOOKS, FOR_FOES_AT_START_OF_COMBAT_HOOKS, FOR_FOE_NON_STATS_SKILL_USING_STATS_HOOKS, FOR_FOE_STATS_SKILLS_USING_STATS_HOOKS, FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS, FOR_FOES_INFLICTS_STATS_MINUS_HOOKS } from './SkillEffectHooks.js';
import { IF_NODE, SkillEffectNode } from './SkillEffect.js';

// SkillEffectRegistrar.js 末尾
export { SkillEffectRegistrar };
```

`SkillEffectRegistrar` は `SkillRequirement`, `SKILL_EFFECT_NODE`, `NULL_OBJECT` 等も参照する。`NULL_OBJECT` は Utilities.js から、`SkillRequirement` はスキル関連ファイルから来る。結合モードではグローバルに存在するため問題ないが、import 文としてはこれらも追加する必要がある。ただし循環依存を避けるため、Stage A/B の完了を前提に適切な import 元を指定する。

### ファイル 9: SkillEffectAliases.js

**パス**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectAliases.js`

DSL のユーザー向けエイリアス関数（`GRANTS_BONUS`, `INFLICTS_PENALTY`, `ATK_SPD`, `ATK_SPD_DEF_RES`, `DEALS_DAMAGE`, `REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY` 等）を定義。全ての SkillEffect* ファイルに依存する。

**作業**:
```javascript
// SkillEffectAliases.js 先頭
import { SingleEffectNode, EffectsNode, NumberNode, BoolNode, IF_NODE, TRUE_NODE, FALSE_NODE, COND_OP } from './SkillEffect.js';
import { SkillEffectField, ModSkillEffectFieldNode } from './SkillEffectField.js';
import { UNIT, FOE } from './SkillEffectUnit.js';
import { makeBattleContextFieldOperators } from './SkillEffectBattleContext.js';
import { NodeEnv } from './SkillEffectEnv.js';

// SkillEffectAliases.js 末尾 -- 全エイリアス関数を列挙
export { GRANTS_BONUS, INFLICTS_PENALTY, ATK_SPD, ATK_SPD_DEF_RES, ATK_DEF, DEALS_DAMAGE, REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY, INFLICTS_STATUS_EFFECTS, ... };
```

このファイルも export 対象が非常に多い。`StatusIndex` 等の外部定数を参照するが、これらは Stage B/D で ESM 化される。結合モードではグローバルに存在するため、Phase 2 の段階ではこれらの import は省略してもよい（結合時にフィルタで除去されるため、import があってもなくても結合出力は同じ）。ただし、ESM として正しい依存宣言のためには全ての import を記述すべき。

## 注意事項

### export 対象の網羅性

SkillEffect.js と SkillEffectAliases.js は export 対象が極めて多い（それぞれ50個以上）。実装時には以下の手順で漏れを防ぐ:

1. ファイル内の全 `class` 宣言、`const` 宣言、`function` 宣言を列挙する
2. 他ファイルから参照されるシンボルを特定する（結合モードではグローバルスコープで参照されるため、原則として全てのトップレベルシンボルが対象）
3. 1行の export 文にまとめる

### 結合モードでの動作

Phase 2 の期間中、テストとビルドは引き続き結合モード（`create_tests.sh` / `build.mjs`）で動作する。import/export 行は結合時にフィルタで除去されるため、追加した import/export が結合出力に影響しないことを確認する。

### SkillEffect.js の巨大 export

SkillEffect.js は2000行以上のファイルで、内部で定義されるクラス・関数・定数が非常に多い。export 文が1行で数百文字になる可能性がある。これは規約上問題ないが、可読性のため将来的にファイル分割を検討してもよい（ただし Phase 2 のスコープ外）。

### SkillEffectRegistrar.js の外部依存

`SkillEffectRegistrar` クラスの `_registerToHooks` メソッドは `SkillRequirement` 列挙型を参照する。この列挙型の定義元ファイルを特定し、適切な import を追加する必要がある。`SkillRequirement` が Stage B-D のいずれかのファイルで定義されている場合、そのファイルの ESM 化完了後に import を追加する。結合モードでは問題にならないため、暫定的に import なしで進めて後から追加することも可能。

### 変換ごとのテスト実行

9ファイルの変換は1ファイルずつ行い、各ファイルの変換後に `./run_tests.sh` を実行する。1ファイルの変換でテストが失敗した場合、そのファイルの export/import を修正してから次のファイルに進む。

## 実装結果

### 計画との差異

- **シンボル数の実態**: 計画では SkillEffect.js と SkillEffectAliases.js が「それぞれ50個以上」とあったが、実際は SkillEffect.js: 1032シンボル、SkillEffectAliases.js: 252シンボル、SkillEffectBattleContext.js: 502シンボルと桁違いに多かった
- **SkillEffectCore.js**: 計画では `MultiValueMap` と `SkillEffectHooks` のみと記載されていたが、実際には `SkillEffectNode`, `NumberNode`, `BoolNode`, `IF_NODE` 等のDSLコアクラス137シンボルが定義されている（計画の「SkillEffect.js の定義」と記載されていたものの多くが実際にはここにあった）
- **SingleEffectNode**: 計画では SkillEffectCore.js 内と暗示されていたが、実際は SkillEffect.js で定義。SkillEffectField.js と SkillEffectBattleContext.js の import 元を修正
- **export 方式**: 1行に収まらないシンボル数のため、Skill.js と同様に複数の `export { ... };` 行に分割（各行は1行以内）
- **SkillRequirement**: SkillEffectCore.js 内で定義されていた（計画では外部依存と想定していた）。SkillEffectRegistrar.js の import に含めた
- **import の完全性**: SkillEffectUnit.js と SkillEffectAliases.js は参照シンボルが膨大なため、import 行を省略。結合モードでは問題なく、section-11 の ESM 検証で完全化する
- **変換手順**: 効率化のため9ファイルを一括で変換し、最後にテストを実行（1ファイルずつではない）

### テスト結果
- `./run_tests.sh`: 310テスト全パス
- `npm run build`: 正常完了

### 追加・変更ファイル
| ファイル | import行 | exportシンボル数 |
|---------|---------|----------------|
| Sources/SkillEffectCore.js | 1 | 137 |
| Sources/SkillEffectEnv.js | 1 | 9 |
| Sources/SkillEffect.js | 11 | 1032 |
| Sources/SkillEffectField.js | 2 | 4 |
| Sources/SkillEffectUnit.js | 0 | 45 |
| Sources/SkillEffectBattleContext.js | 3 | 502 |
| Sources/SkillEffectHooks.js | 1 | 112 |
| Sources/SkillEffectRegistrar.js | 1 | 1 |
| Sources/SkillEffectAliases.js | 0 | 252 |