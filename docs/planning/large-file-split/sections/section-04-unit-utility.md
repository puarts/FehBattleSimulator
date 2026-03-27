Now I have everything needed. Let me write the section.

# Section 04: UnitUtility.js — ユーティリティ関数群の抽出

## 概要

`Sources/unit/Unit.js` 末尾（行7144-7424）に定義されている `UnitUtil` クラスと6つのユーティリティ関数を、新規ファイル `Sources/unit/UnitUtility.js` に抽出する。これはPhase B-2（Step B-2）に該当し、本リファクタリング計画の最終ステップである。

**前提条件**: Section 03 (UnitContext) が完了していること。Section 03 で Unit.js の前半部分（行19-371）が抽出済みであるため、行番号は変動している可能性がある。実際のコード位置は `class UnitUtil` や `function calcBuffAmount` などのシンボル名で特定すること。

## 抽出対象シンボル

| シンボル | 種別 | 行数(目安) | 責務 |
|---------|------|-----------|------|
| `UnitUtil` | クラス | 21行 | `withCache` 静的メソッドによるキャッシュラッパー |
| `calcBuffAmount` | 関数 | 41行 | バフ量の計算（サポートスキルタイプに応じたswitch文） |
| `calcHealAmount` | 関数 | 83行 | 回復量の計算（20+ヒールタイプ対応、`CALC_HEAL_AMOUNT_HOOKS` 使用） |
| `isDebufferTier1` | 関数 | 9行 | Tier 1デバッファー判定（`IS_DEBUFFER_TIER_1_HOOKS` 使用） |
| `isDebufferTier2` | 関数 | 38行 | Tier 2デバッファー判定（フック+switch文） |
| `isAfflictor` | 関数 | 64行 | ステータス付与判定（フック+スキルチェック） |
| `canRefreshTo` | 関数 | 3行 | リフレッシュ可否の単純判定 |

## テスト（実装前に作成）

テストファイル: `Tests/UnitUtility.test.js`

テストファイルを `create_tests.sh` の `TEST_FILE_NAMES` 配列に追加すること。

```javascript
// Test: UnitUtilクラスがグローバルスコープに存在すること
test('UnitUtil class is available in global scope', () => {
    expect(typeof UnitUtil).toBe('function');
});

// Test: calcBuffAmount関数がグローバルスコープに存在すること
test('calcBuffAmount function is available in global scope', () => {
    expect(typeof calcBuffAmount).toBe('function');
});

// Test: calcHealAmount関数がグローバルスコープに存在すること
test('calcHealAmount function is available in global scope', () => {
    expect(typeof calcHealAmount).toBe('function');
});

// Test: isDebufferTier1関数がグローバルスコープに存在すること
test('isDebufferTier1 function is available in global scope', () => {
    expect(typeof isDebufferTier1).toBe('function');
});

// Test: isDebufferTier2関数がグローバルスコープに存在すること
test('isDebufferTier2 function is available in global scope', () => {
    expect(typeof isDebufferTier2).toBe('function');
});

// Test: isAfflictor関数がグローバルスコープに存在すること
test('isAfflictor function is available in global scope', () => {
    expect(typeof isAfflictor).toBe('function');
});

// Test: canRefreshTo関数がグローバルスコープに存在すること
test('canRefreshTo function is available in global scope', () => {
    expect(typeof canRefreshTo).toBe('function');
});
```

加えて、既存テスト（`DamageCalculator.test.js`, `UnitManager.test.js`, `StatusEffect.test.js` 等）の全パスが回帰検出の主要手段となる。

## 事前チェック（実装時に必ず実施）

### チェック1: 全参照元のgrep

以下のシンボルについてリポジトリ全体で参照元を確認済み。主な参照元ファイル:

- **`calcBuffAmount`**: `Sources/unit/Unit.js` 内の `AssistableUnitInfo.__calcRallyTargetPriority` から呼び出し（Section 03 で `UnitContext.js` に移動済みの場合はそちら）
- **`calcHealAmount`**: `Sources/unit/Unit.js` 内の `AssistableUnitInfo` メソッドから呼び出し、`Sources/app/BattleSimulatorBase.js` から呼び出し
- **`isDebufferTier1` / `isDebufferTier2`**: `Sources/app/BattleSimulatorBase.js` から呼び出し
- **`isAfflictor`**: `Sources/app/BattleSimulatorBase.js` から呼び出し
- **`canRefreshTo`**: `Sources/app/BattleSimulatorBase.js` から呼び出し
- **`UnitUtil`**: `Sources/combat/DamageCalculatorWrapper.js` から呼び出し
- **`calcHealAmountFuncMap`**: `Sources/data/Skill.js` で定義、`Sources/skill-impl/SkillImpl.js` と `Sources/skill-dsl/SkillEffectAliases.js` でエントリ登録
- **`isAfflictorFuncMap`**: `Sources/data/Skill.js` で定義、`Sources/skill-impl/SkillImpl.js` でエントリ登録

全参照元はロード順序上 `Unit.js` の直後以降にロードされるため、`UnitUtility.js` を `Unit.js` 直後に配置すれば問題ない。

### チェック2: ロード時評価の有無

抽出対象はすべて `class` 定義または `function` 宣言であり、トップレベルで即時実行されるコードはない。ロード時には関数/クラスが定義されるのみで、実行時まで外部シンボルは評価されない。安全に移動可能。

### チェック3: 重複定義の確認

`UnitUtil`, `calcBuffAmount`, `calcHealAmount`, `isDebufferTier1`, `isDebufferTier2`, `isAfflictor`, `canRefreshTo` はいずれも `Unit.js` 内に唯一の定義がある。重複定義なし。

注意: `AttackEvaluationContext` クラス（Section 03 で `UnitContext.js` に移動済み）のプロパティとして `isDebufferTier1`, `isDebufferTier2`, `isAfflictor` が存在するが、これらはプロパティ名（文字列）であり、同名の関数定義とは別物。混同しないこと。

### チェック4: フックオブジェクトの定義場所と宣言方式

| フックオブジェクト | 定義ファイル | 宣言方式 |
|-------------------|-------------|---------|
| `CALC_HEAL_AMOUNT_HOOKS` | `Sources/skill-dsl/SkillEffectHooks.js` (行487) | `const` |
| `IS_DEBUFFER_TIER_1_HOOKS` | `Sources/skill-dsl/SkillEffectHooks.js` (行524) | `const` |
| `IS_DEBUFFER_TIER_2_HOOKS` | `Sources/skill-dsl/SkillEffectHooks.js` (行529) | `const` |
| `IS_AFFLICTOR_HOOKS` | `Sources/skill-dsl/SkillEffectHooks.js` (行534) | `const` |

`SkillEffectHooks.js` は `create_tests.sh` のロード順で `Unit.js` より後に位置する（行37）。しかし、これらのフックは関数の実行時に参照されるのみで、ロード時（パース時）には評価されない。テスト環境では全ファイルが1つに結合されるため問題なし。ブラウザ環境でも、これらの関数が呼ばれるのはユーザー操作時であり、全スクリプトロード完了後なので問題なし。

### チェック5: 前後のローカルヘルパー確認

`UnitUtil` の直前は `Unit` クラスの閉じ括弧（行7142）、`canRefreshTo` の直後は EOF（行7424-7425）。抽出対象の範囲内に含まれるローカルヘルパーや関連定数はない。

`calcHealAmountFuncMap` と `isAfflictorFuncMap` は `Sources/data/Skill.js` で定義されたグローバル定数（`const`）であり、抽出対象と一緒に移動する必要はない。

## 実装手順

### 手順1: 新規ファイル作成

**ファイル**: `Sources/unit/UnitUtility.js`

Unit.js から以下の範囲をカット&ペーストで移動する（Section 03 完了後の行番号は変動しているため、シンボル名で特定）:

1. `class UnitUtil { ... }` — 全体
2. `function calcBuffAmount(assistUnit, targetUnit) { ... }` — 全体
3. `function calcHealAmount(assistUnit, targetUnit) { ... }` — 全体（JSDOCコメント含む）
4. `function isDebufferTier1(attackUnit, targetUnit) { ... }` — 全体（コメント含む）
5. `function isDebufferTier2(attackUnit, targetUnit) { ... }` — 全体（コメント含む）
6. `function isAfflictor(attackUnit, lossesInCombat, result) { ... }` — 全体（JSDOCコメント含む）
7. `function canRefreshTo(targetUnit) { ... }` — 全体

コードのロジック、フォーマット、コメント（TODO含む）、typoは一切変更しないこと。

### 手順2: ESLint対応

`UnitUtility.js` の先頭に `/* global ... */` コメントを追加する。対象シンボルは抽出コード内で参照されるがファイル内に定義がないもの:

- `Support` — calcBuffAmount, calcHealAmount で使用
- `Weapon` — isDebufferTier1, isDebufferTier2, isAfflictor で使用
- `PassiveB` — isDebufferTier2 で使用
- `PassiveC` — isAfflictor で使用
- `WeaponRefinementType` — isDebufferTier2 で使用
- `MoveType` — isDebufferTier2 で使用
- `NodeEnv` — calcHealAmount, isDebufferTier1, isDebufferTier2, isAfflictor で使用
- `LoggerBase` — isDebufferTier1, isDebufferTier2, isAfflictor で使用
- `getSkillFunc` — calcHealAmount, isAfflictor で使用
- `calcHealAmountFuncMap` — calcHealAmount で使用
- `isAfflictorFuncMap` — isAfflictor で使用
- `getAtkBuffAmount`, `getSpdBuffAmount`, `getDefBuffAmount`, `getResBuffAmount` — calcBuffAmount で使用
- `getSkillLogLevel` — calcHealAmount で使用
- `isWeaponTypeTome` — isDebufferTier2 で使用
- `CALC_HEAL_AMOUNT_HOOKS` — calcHealAmount で使用
- `IS_DEBUFFER_TIER_1_HOOKS` — isDebufferTier1 で使用
- `IS_DEBUFFER_TIER_2_HOOKS` — isDebufferTier2 で使用
- `IS_AFFLICTOR_HOOKS` — isAfflictor で使用

実装時に実際のESLint出力を確認し、不足があれば追加すること。

### 手順3: Unit.js からの削除

Unit.js から移動した範囲（`class UnitUtil` の開始行から `function canRefreshTo` の最終行まで）を削除する。Unit.js の末尾は `Unit` クラスの閉じ括弧で終わる形になる。

### 手順4: ロード順序の更新（3系統すべて）

**配置位置**: Unit.js の直後（元のUnit.js内でもUnitクラス定義の後に置かれていた関数群のため）。

#### 4a. `create_tests.sh`

`SOURCE_FILE_NAMES` 配列で `unit/Unit` の直後に `unit/UnitUtility` を追加:

```
    unit/Unit
    unit/UnitUtility    ← 追加
    unit/UnitManager
```

#### 4b. `Deploy.bat`

行19の `unit\Unit` の直後に `unit\UnitUtility` を追加。結合文字列にカンマ区切りで追加する:

```
set BF=%BF%,...,unit\BattleContext,unit\Unit,unit\UnitUtility,unit\UnitManager,...
```

**注意**: Deploy.bat の行42（StatusCalculator用の結合リスト）にも `unit\Unit` が含まれる。こちらにも `unit\UnitUtility` を `unit\Unit` の直後に追加すること。行45, 48 等の他のリストも同様に確認し、`unit\Unit` が含まれるすべての結合リストに追加する。

#### 4c. HTMLファイル（全7ファイル）

以下の全HTMLの `loadScripts` 配列で `"unit/Unit.js"` の直後に `"unit/UnitUtility.js"` を追加:

1. `Sources/ArenaSimulator.html`
2. `Sources/DamageCalculator.html`
3. `Sources/UnitBuilder.html`
4. `Sources/AetherRaidSimulator.html`
5. `Sources/SummonerDuelsSimulator.html`
6. `Sources/HeroStatusClusterer.html`
7. `Sources/StatusCalculator.html`

#### 4d. 3系統の相対順序一致確認

3系統すべてで `UnitUtility` が以下の相対順序であることを確認:

```
... → Unit → UnitUtility → UnitManager → ...
```

### 手順5: テストファイル登録

`create_tests.sh` の `TEST_FILE_NAMES` 配列に `UnitUtility` を追加。

### 手順6: 検証

1. `./run_tests.sh` を実行し、全テスト + ESLint がパスすることを確認
2. ブラウザ smoke check: `ArenaSimulator.html` を開き、戦闘シミュレーションを1回実行し、コンソールエラーがないことを確認

### 手順7: コミット

コミットメッセージ: `refactor(unit): ユーティリティ関数群をUnitUtility.jsに分離`

## 実装結果

**実施日**: 2026-03-28
**結果**: 計画通りに完了。全312テストパス（ESLint含む）。

### 実際のファイルパス
- 新規: `Sources/unit/UnitUtility.js` (281行、ESLintコメント含む)
- 新規: `Tests/UnitUtility.test.js` (7テスト)
- 変更: `Sources/unit/Unit.js` (6789→6788行、末尾のユーティリティ関数群を削除)
- 変更: `create_tests.sh` (SOURCE_FILE_NAMESとTEST_FILE_NAMES更新)
- 変更: `Deploy.bat` (全4ビルドターゲット更新)
- 変更: HTML 7ファイル (loadScripts更新)

### 計画からの差異
- なし。計画通りverbatim移動を実施。

### コードレビュー所見
- `.call(this, ...)` パターン（calcHealAmount/isAfflictor）は既知の技術的負債として記録。今回未修正。
- テストは存在チェックのみ。既存テストが回帰検出を担保。

---

## 重要な注意事項

- **ロジック変更禁止**: コードの移動のみ。typo修正、コード整形、未使用変数削除は行わない
- **`calcHealAmount` 内の `this` 参照**: 行7217 で `getSkillFunc(skillId, calcHealAmountFuncMap)?.call(this, ...)` と `this` を使用している。これはグローバル関数なので `this` は `undefined`（strict mode）または `globalThis` になる。元のコードの挙動そのままであり、修正しない
- **`isAfflictor` 内の `this` 参照**: 行7367 で同様に `.call(this, ...)` を使用。同上
- **Section 03 との関係**: `calcBuffAmount` と `calcHealAmount` は `AssistableUnitInfo` クラスのメソッド内から呼び出される。Section 03 で `AssistableUnitInfo` が `UnitContext.js` に移動済みの場合、`UnitUtility.js` は `UnitContext.js` よりも後にロードされる必要がある（`Unit.js` の直後 = `UnitContext.js` の後）。`create_tests.sh` のロード順で `UnitContext` → `Unit` → `UnitUtility` の順になっていることを確認すること