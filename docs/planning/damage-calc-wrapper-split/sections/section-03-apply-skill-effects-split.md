# Section 03: ApplySkillEffects の分離

## 概要

`DamageCalculatorWrapper.js` からスキル効果適用関連メソッド群を `Sources/combat/DamageCalculatorWrapper_ApplySkillEffects.js` に分離する。これは Phase 3 に該当し、Section 02（InitSkillEffectDict の分離）が完了済みであることを前提とする。

## 前提条件

- Section 01 が完了済み: `definePrototypeMethods` ヘルパーがコアファイルに存在し、テストファイル `Tests/DamageCalculatorWrapperSplit.test.js` が `create_tests.sh` に登録済み
- Section 02 が完了済み: `DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` と `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js` が分離済みで、ロード順序が更新済み

## テスト（先に記述）

以下のテストを `Tests/DamageCalculatorWrapperSplit.test.js` に追加する（Section 01 で作成済みのファイルに追記）。

### メソッド存在確認テスト

```javascript
describe("Phase 3: ApplySkillEffects split", () => {
    test("__applySkillEffectForUnit がインスタンスメソッドとして存在すること", () => {
        // DamageCalculatorWrapper.prototype に __applySkillEffectForUnit が存在することを確認
    });

    test("____applySkillEffectForUnit がインスタンスメソッドとして存在すること", () => {
        // DamageCalculatorWrapper.prototype に ____applySkillEffectForUnit が存在することを確認
    });

    test("__applySkillEffectRelatedToEnemyStatusEffects がインスタンスメソッドとして存在すること", () => {
        // DamageCalculatorWrapper.prototype に __applySkillEffectRelatedToEnemyStatusEffects が存在することを確認
    });
});
```

### 既存テスト全パス

- `./run_tests.sh` を実行し、全既存テスト（DamageCalculator.test.js 等）+ ESLint がパスすることを確認

## 移動対象メソッド

以下のメソッドを `DamageCalculatorWrapper.js` から `DamageCalculatorWrapper_ApplySkillEffects.js` に移動する。メソッド本体のコードは一切変更しない。

### メソッド一覧と現在の行番号（目安）

行番号は Section 02 完了後の状態に依存するため、実装時に必ず再確認すること。以下は分割前の原本での位置。

| メソッド名 | 原本行番号(目安) | 行数(目安) | 説明 |
|-----------|---------------|-----------|------|
| `__getPartnersInSpecifiedRange` | 2349 | 3行 | 指定範囲内のパートナー取得 |
| `__countAllyUnitsInCrossWithOffset` | 2354 | 9行 | 十字範囲内の味方カウント |
| `__isThereBreakableStructureForEnemyIn2Spaces` | 2364 | 10行 | 2マス以内の破壊可能構造物判定 |
| `__applySkillEffectForUnit` | 2374 | 6行 | スキル効果適用（profiling wrapper） |
| `____applySkillEffectForUnit` | 2386 | ~172行 | スキル効果適用本体（辞書引き + フォールバック） |
| `__applySkillEffectForUnitImpl_Optimized` | 9401 | 6行 | 辞書ベースのスキル効果適用（最適化版） |
| `__getTotalBuffAmountOfTop3Units` | 9408 | 20行 | 上位3体の合計バフ量取得 |
| `__applySkillEffectRelatedToEnemyStatusEffects` | 9614 | ~224行 | 敵ステータス効果関連スキル適用 |
| `__applyCatch3` | 9839 | 6行 | 機先3効果の適用ヘルパー |
| `__applyCatch4` | 9847 | 11行 | 機先4効果の適用ヘルパー |
| `__applySkillEffectForUnitAfterCombatStatusFixed` | 11741 | ~2,800行 | 戦闘ステータス確定後のスキル効果適用 |
| `__applySkillEffectRelatedToFollowupAttackPossibility` | 14595 | 7行 | 追撃可否条件のスキル効果適用 |
| `__applyInvalidationSkillEffect` | 14607 | ~244行 | 無効化スキル効果適用 |
| `__applySpecialSkillEffect` | 15171 | 11行 | 奥義スキル効果適用 |
| `__setSkillEffetToContext` | 15183 | 35行 | スキル効果をコンテキストに設定 |
| `__setBothOfAtkDefSkillEffetToContext` | 15219 | 89行 | 攻守両方のスキル効果をコンテキストに設定 |
| `__setBothOfAtkDefSkillEffetToContextForEnemyUnit` | 15309 | 7行 | 敵ユニット向けスキル効果設定 |

**注意**: `__init__applySpecialSkillEffect` は Section 02 で `DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` に移動済みであるため、ここでは対象外。

### コアファイルに残すメソッド（移動しない）

以下はスキル効果の「ハブ」として `calcCombatResult` から直接呼ばれるオーケストレーション層であり、コアファイルに残す:

- `__applySkillEffect` — スキル効果適用のエントリポイント（`calcCombatResult` から呼ばれる）
- `__applyTransformedSkillEffects` — 変身スキル効果適用
- `__applyChangingAttackPrioritySkillEffects` — 攻撃優先度変更スキル

## 実装手順

### 1. 新ファイルの作成

`Sources/combat/DamageCalculatorWrapper_ApplySkillEffects.js` を作成する。

ファイルの構造:

```javascript
if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    // ここに移動対象メソッドを全て配置
    // メソッド名() { ... } の形式（class body と同じ構文）
});
```

### 2. メソッドの移動

上記一覧のメソッドをコアファイルから切り取り、新ファイルの `definePrototypeMethods({...})` 内に配置する。

**重要な注意点**:

- メソッド本体のコードは一切変更しない
- `class` body 内のメソッド構文（`methodName() { ... }`）をそのまま `definePrototypeMethods` のオブジェクトリテラル内に配置する。メソッド間はカンマで区切る
- `this` 参照はそのまま動作する（prototype メソッドとして呼ばれるため）
- `____applySkillEffectForUnit` 内のメソッド境界に注意。`__init__applySkillEffectForUnitFuncDict` の開始位置（Section 02 で移動済み）と混同しないこと
- `__applyCatch3` / `__applyCatch4` はコンストラクタの `catchFuncs` 辞書から `this.__applyCatch3(...)` として参照されている。prototype 拡張後もコンストラクタ実行時点でメソッドが存在するため正常に動作する

### 3. コアファイルからの削除

移動したメソッドをコアファイル（`DamageCalculatorWrapper.js`）から削除する。コンストラクタや `calcCombatResult` からの呼び出しコードはそのまま残す（`this.__applySkillEffectForUnit(...)` 等）。

### 4. ロード順序の更新

3 系統すべてで `DamageCalculatorWrapper_ApplySkillEffects` を追加する。

#### 4a. `create_tests.sh`

`SOURCE_FILE_NAMES` 配列内で、`combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit`（Section 02 で追加済み）の直後に追加:

```
combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef
combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit
combat/DamageCalculatorWrapper_ApplySkillEffects          ← NEW
combat/BeginningOfTurnSkillHandler
```

#### 4b. `Deploy.bat`

同様の位置に追加。具体的な構文は既存の `DamageCalculatorWrapper_InitSkillEffectDict_*` エントリのパターンに従う。

**重要**: `Deploy.bat` には複数の独立した結合リストがある。以下の3箇所すべてに追加すること:
1. `battle_simulator_filenames` 共通リスト（line 21付近の `set BF=%BF%,...`）
2. `FehUnitBuilder` 個別リスト（line 46付近の `call ...MergeSourcesAndCompress.bat FehUnitBuilder ...`）
3. `FehDamageCalculator` 個別リスト（line 49付近の `call ...MergeSourcesAndCompress.bat FehDamageCalculator ...`）

Section 02 で共通リストのみ更新し個別リストを漏らした経緯があるため、必ず3箇所を確認すること。

#### 4c. HTML ファイル

`Sources/**/*.html` を検索し、`loadScripts()` 呼び出しリスト内に同様の位置で追加する。対象 HTML ファイルの特定には以下を使用:

```
Grep: "DamageCalculatorWrapper" in Sources/**/*.html
```

### 5. テスト実行

```bash
./run_tests.sh
```

全テスト + ESLint がパスすることを確認する。

## メソッド間の依存関係

移動するメソッド群は以下のコアファイルのメソッド・ユーティリティを `this` 経由で呼び出す。これらはコアファイルに残るため、prototype chain で実行時に解決される:

- `this.enumerateUnitsInTheSameGroupOnMap()` — 味方列挙
- `this.__isThereAllyInSpecifiedSpaces()` — 味方存在判定
- `this.__isThereAllyIn2Spaces()` — 2マス以内味方判定
- `this.__isSolo()` — 孤立判定
- `this.__isInCross()` / `this.__isInCrossWithOffset()` — 十字範囲判定
- `this.__canDisableSkillsFrom()` — スキル無効化判定
- `this.__countUnit()` — ユニットカウント
- `this.__writeDamageCalcDebugLog()` — デバッグログ
- `this.profiler` — パフォーマンスプロファイラ（コンストラクタで初期化されるインスタンスプロパティ）
- `this.map` — マップ参照（インスタンスプロパティ）
- `this._unitManager` — ユニットマネージャ（インスタンスプロパティ）

また、以下のグローバル関数・定数を参照する（グローバルスコープ連結環境のため問題なし）:

- `getSkillFunc()`, `getSkillLogLevel()`
- 各種 `FuncMap` / `HOOKS` 定数（`applySkillEffectForUnitFuncMap`, `AFTER_FOLLOW_UP_CONFIGURED_HOOKS` 等）
- `StatusEffectType`, `PassiveA`, `PassiveB`, `Weapon`, `Special` 等の enum

## コミット

Phase 3 全体で 1 commit とする。コミットメッセージ案:

```
refactor(combat): スキル効果適用メソッドをDamageCalculatorWrapper_ApplySkillEffects.jsに分離
```

## 推定結果

- `DamageCalculatorWrapper_ApplySkillEffects.js`: 約 3,000 行（移動したメソッド群 + ロードガード + definePrototypeMethods ラッパー）
- コアファイル: Section 02 完了後の約 9,200 行から約 3,000 行削減 → 約 6,200 行に縮小