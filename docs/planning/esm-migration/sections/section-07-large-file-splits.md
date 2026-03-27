Now I have a thorough understanding of the codebase structure. Let me compose the section content.

# Section 07: その他の巨大ファイル分割 (Large File Splits)

## 概要

DamageCalculatorWrapper.js（17,193行）と SkillEffect.js（9,632行→現在約8,200行）を責務ごとに分割する。SkillImpl系ファイルは日付ベースの分割方式を維持するため、対象外とする。

**前提条件**: Section 06（BattleSimulatorBase.js分割）が完了していること。

## 対象ファイル

| ファイル | 現在の行数 | 含まれるクラス/責務 |
|---------|-----------|-------------------|
| `Sources/DamageCalculatorWrapper.js` | 17,193行 | PerformanceProfile, ScopedTileChanger, DamageCalculatorWrapper（巨大クラス） |
| `Sources/SkillEffect.js` | ~8,200行 | Mixin定義、クエリノード群（UnitNode, BoolNode派生等）、エフェクトノード群（EffectNode, SingleEffectNode, EffectsNode等） |

**注意**: SkillEffect関連ファイルは既に一部分割済み。`SkillEffectCore.js`, `SkillEffectEnv.js`, `SkillEffectField.js`, `SkillEffectUnit.js`, `SkillEffectBattleContext.js`, `SkillEffectHooks.js`, `SkillEffectRegistrar.js`, `SkillEffectAliases.js` が既存。本セクションの対象は残りの `SkillEffect.js` 本体のみ。

## テスト方針

すべてのステップで以下の回帰テストを実行する。新規テストの追加よりも、既存テストの継続パスが最重要。

### DamageCalculatorWrapper.js 分割テスト

```
# Test: PerformanceProfile切り出し後、プロファイリングが正常動作
# Test: ユーティリティ関数切り出し後、ダメージ計算結果が分割前と同一
# Test: 既存のDamageCalculatorテストスイートがすべてパス
```

具体的には、分割の各ステップで以下を確認する:

- `Tests/DamageCalculator.test.js` のテストがすべてパス
- `Tests/Performance.test.js` のテストがすべてパス
- スキル回帰テスト（SkillRegression等）がすべてパス（DamageCalculatorWrapperはスキル効果適用の中核であるため）

### SkillEffect.js 分割テスト

```
# Test: 基盤インフラ切り出し後、ベースノードが正常動作
# Test: クエリノード切り出し後、全クエリノードが正常動作
# Test: エフェクトノード切り出し後、全エフェクトノードが正常動作
# Test: Mixinパターン（Object.assign）が分割後も正常に適用される
# Test: 既存のSkillEffectテストスイートとDslNodeテストがすべてパス
# Test: SkillImpl系からの参照が正常動作（SkillRegressionテスト）
```

具体的には:

- `Tests/SkillEffect.test.js` のテストがすべてパス
- `Tests/DslNode.test.js` のテストがすべてパス
- SkillImpl系からのDSLノード参照が正常に動作すること

### 全ステップ共通の回帰テスト

```
# Test: 分割後にcreate_tests.shが正常にAll.test.jsを生成
# Test: ./run_tests.sh がすべてパス（Jest + ESLint）
# Test: 分割後にDeploy.batが正常に結合JSを生成
# Test: 分割後の結合JSが分割前と機能的に同等（同じ入力に対して同じ出力）
# Test: 分割後に本番7ページがブラウザで正常動作
# Test: CIが成功（Jest + ESLint）
```

## 実装手順

### Step 1: DamageCalculatorWrapper.js — PerformanceProfile抽出

**目的**: `PerformanceProfile` クラスを独立ファイルに切り出す。ダメージ計算と無関係な汎用プロファイリングユーティリティである。

**新規ファイル**: `Sources/PerformanceProfile.js`

**切り出し対象** (DamageCalculatorWrapper.js 2-28行目):
- `PerformanceProfile` クラス全体（コンストラクタ、`addElaspedMilliseconds`, `profile` メソッド）

**手順**:
1. `Sources/PerformanceProfile.js` を作成し、`PerformanceProfile` クラスをそのまま移動
2. `Sources/DamageCalculatorWrapper.js` から該当コードを削除
3. `create_tests.sh` の `SOURCE_FILE_NAMES` に `PerformanceProfile` を追加（`DamageCalculatorWrapper` より前に配置）
4. `Deploy.bat` の結合リストを更新（`DamageCalculatorWrapper` の前に `PerformanceProfile` を追加）
5. HTML ファイルの `loadScripts` 配列を更新（必要な場合）
6. `./run_tests.sh` を実行して全テストパスを確認
7. ブラウザで本番ページの動作確認

**ロード順序の制約**: `PerformanceProfile` は `DamageCalculatorWrapper` のコンストラクタで `new PerformanceProfile()` として使用されるため、先にロードされる必要がある。

### Step 2: DamageCalculatorWrapper.js — ScopedTileChanger抽出

**目的**: `ScopedTileChanger` クラスを独立ファイルに切り出す。タイル操作のスコープ管理ユーティリティであり、DamageCalculatorWrapper固有のロジックではない。

**新規ファイル**: `Sources/ScopedTileChanger.js`

**切り出し対象** (DamageCalculatorWrapper.js 30-52行目):
- `ScopedTileChanger` クラス全体

**外部依存**: `setUnitToTile` グローバル関数を使用している。この関数の定義元を確認し、ロード順序で先にロードされることを保証する。

**手順**:
1. `Sources/ScopedTileChanger.js` を作成し、`ScopedTileChanger` クラスを移動
2. `Sources/DamageCalculatorWrapper.js` から該当コードを削除
3. `create_tests.sh`, `Deploy.bat`, HTML を更新（`DamageCalculatorWrapper` より前）
4. `./run_tests.sh` を実行して全テストパスを確認
5. ブラウザ確認

### Step 3: DamageCalculatorWrapper.js — 戦闘ユーティリティ関数の分離検討

**目的**: DamageCalculatorWrapper クラス内の static メソッドやクラス非依存のユーティリティロジックを特定し、分離可能なものを抽出する。

**分析対象**: DamageCalculatorWrapper には以下の static メソッドが存在する:
- `static __applyIdealEffect(targetUnit, enemyUnit, buffFunc, buffAmount, additionalBuffAmount)` (11775行目)
- `static __applyBonusDoubler(targetUnit, enemyUnit)` (12706行目)
- `static __applyHeavyBladeSkill(atkUnit, defUnit)` (12717行目)
- `static __applyFlashingBladeSkill(atkUnit, defUnit)` (12723行目)
- `static canActivateBreakerSkill(breakerUnit, targetUnit)` (14536行目)
- `static __getAtk/__getSpd/__getDef/__getRes` (13717-13726行目)
- `static __calcAddDamageForDiffOfNPercent` (13730行目)

**新規ファイル**: `Sources/CombatUtility.js`（仮称）

**手順**:
1. static メソッドの依存関係を分析する。自クラスのインスタンスメソッドから呼び出されているものは `DamageCalculatorWrapper.methodName()` 形式で参照され続ける点に注意
2. 独立性が高く、他のクラスからも再利用可能なものを `CombatUtility.js` に移動
3. 元の static メソッドが DamageCalculatorWrapper 内部からのみ呼ばれている場合は、移動せずにそのまま残すことも許容する（無理に分割しない）
4. `create_tests.sh`, `Deploy.bat`, HTML を更新
5. `./run_tests.sh` を実行して全テストパスを確認
6. ブラウザ確認

**重要な判断基準**: DamageCalculatorWrapper クラス自体は17,000行の巨大クラスだが、そのほとんどはスキル効果の適用ロジック（`__applySkillEffectForUnit*` メソッド群、`__init__applySkillEffect*FuncDict` メソッド群）である。これらはDamageCalculatorWrapperのインスタンスの `this` を密結合で参照しており、外部に切り出すと God Object の分散再生産になる。Step 1-2 の独立クラス抽出と static メソッドの一部抽出にとどめ、DamageCalculatorWrapper クラス本体のこれ以上の分割は行わない。

### Step 4: SkillEffect.js — Mixin定義の分離

**目的**: ファイル冒頭のMixin定義群を独立ファイルに切り出す。

**新規ファイル**: `Sources/SkillEffectMixin.js`

**切り出し対象** (SkillEffect.js 1-109行目付近):
- `GetUnitMixin`
- `GetTargetsFoeMixin`
- `GetTargetsAllyMixin`
- `GetUnitDuringCombatMixin`
- `GetFoeDuringCombatMixin`
- `GetSkillOwnerMixin`
- `GetAssistTargetsAllyMixin`
- `GetAssistTargetingMixin`
- `GetAssistTargetMixin`
- `GetValueMixin`
- `GetTargetTileMixin`
- `CheckIfStatsDuringCombatAreDeterminedMixin`
- `NSpacesMixin`
- `ForUnitMixin`
- その他 `SkillEffect.js` 冒頭のMixin定義すべて

**外部依存**: これらのMixinは `SkillEffectNode`（`SkillEffectCore.js` で定義）の `evaluate` メソッドや `NodeEnv` を参照する。`SkillEffectCore.js` の後、`SkillEffect.js` の前にロードする。

**手順**:
1. `Sources/SkillEffectMixin.js` を作成し、Mixin定義をすべて移動
2. `Sources/SkillEffect.js` から該当コードを削除
3. `create_tests.sh` の `SOURCE_FILE_NAMES` に追加（`SkillEffectCore` の後、`SkillEffect` の前）
4. `Deploy.bat` の `ef` 変数を更新
5. `./run_tests.sh` を実行して全テストパスを確認
6. ブラウザ確認

### Step 5: SkillEffect.js — クエリノード群の分離

**目的**: ユニット情報の問い合わせ（クエリ）を行うノード群を独立ファイルに切り出す。EffectNode（行 2816付近）より前に定義されているノードクラス群が対象。

**新規ファイル**: `Sources/SkillEffectQuery.js`

**切り出し対象** (おおよそ SkillEffect.js 110行目 ~ 2815行目):
- `DebugEnvNode`, `PrintDebugNode`
- `UnitNode` および派生（`EnvUnitNode`, `TargetNode`, `TargetsFoeDuringCombatNode`, `TargetsFoeNode` 等）
- `UnitsNode` および派生（`TargetsAlliesOnMapNode`, `TargetsFoesOnMapNode`, `FilterUnitsNode` 等）
- `IncludesUnitNode`
- 空間系クエリノード（`TargetsAlliesWithinNSpacesNode`, `TargetsClosestFoesNode` 等）
- CantoEnv, BattleMapEnv, AtStartOfTurnEnv 等の環境クラス
- ステータス系クエリノード（`IsBonusActiveOnTargetNode`, `IsStatusEffectActiveOnTargetNode` 等）
- 数値系クエリノード（`NumOfTargetsAlliesWithinNSpacesNode` 等）
- 定数ノード（`TARGET_NODE`, `TARGETS_FOE_DURING_COMBAT_NODE`, `UNIT_DURING_COMBAT_NODE` 等）
- ファクトリ関数（`TARGETS_ALLIES_WITHIN_N_SPACES_NODE()` 等の `const` 定義）

**分割の境界**: `EffectNode` クラス（行 2816付近、docstringに「スキル効果を表現するノードツリーの抽象基底クラス」と記載）の定義開始を境界とする。それより前がクエリノード、それ以降がエフェクトノード。

**外部依存**: クエリノードは `SkillEffectCore.js` の基底クラス（`SkillEffectNode`, `NumberNode`, `BoolNode`, `CollectionNode` 等）を継承する。Mixin定義（Step 4で分離済み）も `Object.assign` で参照する。

**手順**:
1. `Sources/SkillEffectQuery.js` を作成
2. SkillEffect.js の Mixin定義（Step 4で既に移動済み）の後から `EffectNode` クラス定義の直前までのコードをすべて移動
3. `SkillEffect.js` から該当コードを削除
4. `create_tests.sh` の `SOURCE_FILE_NAMES` に追加（`SkillEffectMixin` の後、`SkillEffect` の前）
5. `Deploy.bat` の `ef` 変数を更新
6. `./run_tests.sh` を実行して全テストパスを確認
7. `Tests/DslNode.test.js` と `Tests/SkillEffect.test.js` が特にパスすることを確認
8. ブラウザ確認

### Step 6: SkillEffect.js に残るエフェクトノード群の確認

Step 4-5 の後、`SkillEffect.js` には以下が残る:

- `EffectNode` クラスとその派生群（`SingleEffectNode`, `EffectsNode`, `IfElseEffectNode` 等）
- `GrantsStatsPlusToTargetDuringCombatNode` 等のステータス付与ノード
- `InflictsStatsMinusOnTargetDuringCombatNode` 等のデバフノード
- `DealsDamageNode`, `ReducesDamageNode` 等のダメージ系ノード
- `ForEachUnitOnMapNode` 等のイテレーションノード
- `GrantsAnotherActionNode` 等のアクション系ノード
- 空間操作ノード（`AppliesDivineVeinNode` 等）
- その他すべてのエフェクトノード

この残りの部分はエフェクトノードとして一貫した責務を持つため、`SkillEffect.js` にそのまま残す。ファイル名をそのまま維持することで、既存の `SkillImpl*.js` からの参照や `create_tests.sh`, `Deploy.bat` の設定変更を最小限に抑える。

Mixin + クエリノードの抽出により、SkillEffect.js は約5,400行（8,200行 - 2,800行）に縮小される見込みで、十分に管理可能なサイズとなる。

## 更新が必要なファイル一覧

### create_tests.sh

`SOURCE_FILE_NAMES` 配列に以下を追加（ロード順序を守ること）:

```
# DamageCalculatorWrapper の前に追加:
PerformanceProfile
ScopedTileChanger
CombatUtility  # Step 3 で static メソッドを分離した場合のみ

# SkillEffectCore の後、SkillEffect の前に追加:
SkillEffectMixin
SkillEffectQuery
```

### Deploy.bat

`set ef=` 行と戦闘関連の結合リストを更新:

- `ef` 変数: `SkillEffectCore,SkillEffectEnv,SkillEffectMixin,SkillEffectQuery,SkillEffect,...`
- 戦闘関連: `...,PerformanceProfile,ScopedTileChanger,CombatUtility,DamageCalculator,...,DamageCalculatorWrapper`

### HTML ファイル

`loadScripts` 配列にファイルを追加する必要がある場合は更新する。具体的にはSection 05/06の実施後のHTML構成に依存するため、その時点の状態に合わせて対応する。

## 分割の原則（再掲）

- 切り出し先は**入力引数・返り値・外部状態依存・副作用対象**を明確にする
- DamageCalculatorWrapperインスタンスを丸ごと渡すパターンは避ける
- メソッド移動は1グループずつ、各ステップでテスト＋ブラウザ確認
- git bisect が使えるよう細かくコミット
- **無理に分割しない**: DamageCalculatorWrapperのインスタンスメソッド群のように `this` に密結合なものは、クラス内に残す方が安全

## コミット単位

各 Step を1コミットとする（6コミット）。コミットメッセージ例:

1. `refactor(perf): PerformanceProfileをDamageCalculatorWrapperから独立ファイルに分離`
2. `refactor(combat): ScopedTileChangerをDamageCalculatorWrapperから独立ファイルに分離`
3. `refactor(combat): DamageCalculatorWrapperのstaticユーティリティメソッドを分離` （実施した場合のみ）
4. `refactor(dsl): SkillEffect MixinをSkillEffectMixin.jsに分離`
5. `refactor(dsl): クエリノード群をSkillEffectQuery.jsに分離`
6. `chore: Step 6確認（SkillEffect.jsの残りエフェクトノード構成確認）`（コード変更なし、確認のみの場合はコミット不要）