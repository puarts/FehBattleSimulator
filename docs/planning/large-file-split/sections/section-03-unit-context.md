Now I have all the information needed. Let me produce the section content.

# Section 03: UnitContext -- 独立コンテキストクラス群の抽出

## 概要

`Sources/unit/Unit.js` の先頭付近（行19-371）に定義されている5つの独立クラスを抽出する。4クラスは新規ファイル `Sources/unit/UnitContext.js` に移動し、1クラス（PrecombatContext）は既存の `Sources/unit/BattleContext.js` 末尾に再配置する。

**対象クラス（UnitContext.jsへ移動）:**
- `AttackableUnitInfo` (行19-51) -- 攻撃対象情報のデータコンテナ
- `AttackEvaluationContext` (行54-120) -- 攻撃優先度の評価コンテキスト
- `AssistableUnitInfo` (行123-268) -- アシスト対象評価のデータコンテナ
- `ActionContext` (行271-350) -- AI意思決定のコンテキスト

**例外的再配置（BattleContext.jsへ移動）:**
- `PrecombatContext` (行356-371) -- 戦闘前コンテキスト。`copyTo`メソッドでBattleContextに値をコピーする関係があり、責務的にBattleContext側が適切

**前提**: Section 02（ScopedTileChanger抽出）が完了していること。

---

## テスト

本リファクタリングは物理分割のみでロジック変更なし。既存テスト全パスが主要な回帰検出手段となる。以下のTDDテストはシンボルの可視性・ロード順序を検証する。

テストファイルは `Tests/` ディレクトリに配置し、`create_tests.sh` の `TEST_FILE_NAMES` に追加する。既存テストファイルに追記する形でもよい。

```javascript
// Test: AttackableUnitInfoクラスがグローバルスコープに存在すること
// Test: AttackEvaluationContextクラスがグローバルスコープに存在すること
// Test: AttackEvaluationContextがCombatResultTypeを参照できること
// Test: AssistableUnitInfoクラスがグローバルスコープに存在すること
// Test: ActionContextクラスがグローバルスコープに存在すること
// Test: PrecombatContextクラスがグローバルスコープに存在すること（BattleContext.jsからロード）
// Test: new ActionContext()で初期状態が正しいこと（attackableUnitInfos/assistableUnitInfosが空配列）
```

テスト実装の指針:
- `typeof AttackableUnitInfo !== 'undefined'` や `typeof AttackableUnitInfo === 'function'` でグローバル存在を確認
- `new ActionContext()` を生成し、`attackableUnitInfos` と `assistableUnitInfos` がいずれも空配列であることを検証
- `new AttackEvaluationContext()` を生成し、`combatResult` が `CombatResultType.Draw` と等しいことを検証
- 既存テスト全体（`./run_tests.sh`）のパスも必須。特に `DamageCalculator.test.js`、`UnitManager.test.js` が間接検証として機能する

---

## 事前チェック

実装前に以下を確認する。すべて確認できてから作業を開始すること。

### 1. 4クラスの全非ローカル参照の列挙

Unit.js 行19-350の4クラスが参照する外部シンボルを完全に列挙する。現時点の分析結果:

| シンボル | 参照元クラス | 定義ファイル |
|---------|-------------|-------------|
| `CombatResultType` | AttackEvaluationContext (行57) | `Sources/data/UnitConstants.js` 行219 |
| `AssistType` | AssistableUnitInfo (行151, 157, 161, 164, 167, 170, 173, 181) | `Sources/data/SkillConstants.js` 行4204 |
| `isRallyHealSkill` | AssistableUnitInfo (行156, 179) | grep で定義場所を特定すること |
| `isRallyUp` | AssistableUnitInfo (行255) | grep で定義場所を特定すること |
| `calcHealAmount` | AssistableUnitInfo (行190, 228) | `Sources/unit/Unit.js` 末尾（Section 04でUnitUtility.jsに移動予定） |
| `calcBuffAmount` | AssistableUnitInfo (行256, 259) | `Sources/unit/Unit.js` 末尾（Section 04でUnitUtility.jsに移動予定） |
| `Support` | AssistableUnitInfo (行246) | `Sources/data/SkillConstants.js` |

**重要**: `calcHealAmount` と `calcBuffAmount` は現時点では Unit.js 末尾に定義されている。Section 04 で UnitUtility.js に移動される予定。いずれにせよメソッド内部での参照（実行時解決）であり、パース時には評価されないため、UnitContext.js を Unit.js の直前に配置しても問題ない。

### 2. 重複定義チェック

リポジトリ全体で `AttackableUnitInfo`、`AttackEvaluationContext`、`AssistableUnitInfo`、`ActionContext` の定義が Unit.js 以外にないことをgrepで確認する。

### 3. PrecombatContextの参照箇所

grepの結果、`PrecombatContext` は以下2箇所でのみ参照されている:
- `Sources/unit/Unit.js` 行356: クラス定義
- `Sources/unit/Unit.js` 行434: `this.precombatContext = new PrecombatContext();`（Unitコンストラクタ内）

BattleContext.js に移動しても、BattleContext.js は Unit.js より前にロードされるため、Unit.js コンストラクタ内の `new PrecombatContext()` は問題なく解決される。

### 4. パース時のUnit評価がないことの確認

4クラスの定義内で `Unit` シンボルをトップレベル（クラス宣言のstatic初期化、デフォルト引数等）で評価していないことを確認する。メソッド本体内での `Unit` インスタンスのプロパティ参照は実行時解決のため問題ない。

現状の分析: 4クラスいずれも `Unit` を直接参照しておらず、引数として受け取った `unit` オブジェクトのプロパティを参照するのみ。パース時に `Unit` シンボルは評価されない。

### 5. PrecombatContext移動によるBattleContext.jsへの影響

PrecombatContext は `BattleContext` を型として `copyTo` メソッドの引数で使用するが、これはJSDoc注記のみであり実行時の依存はない。PrecombatContext を BattleContext.js 末尾に追加しても新たな外部シンボル依存は発生しない。BattleContext.js 内に `PrecombatContext` と同名の既存定義がないことも確認済み。

---

## 実装手順

### 手順 1: 新規ファイル作成 -- `Sources/unit/UnitContext.js`

Unit.js から以下の行範囲をそのまま移動（コードの変更・整形は一切禁止）:

- 行19-51: `AttackableUnitInfo` クラス全体
- 行54-120: `AttackEvaluationContext` クラス全体
- 行123-268: `AssistableUnitInfo` クラス全体
- 行271-350: `ActionContext` クラス全体

ファイル先頭に ESLint グローバル宣言を追加:

```javascript
/* global CombatResultType, AssistType, isRallyHealSkill, isRallyUp, calcHealAmount, calcBuffAmount, Support */
```

**注意**: 上記シンボルリストは事前チェック #1 の結果に基づく。実際の grep 結果で追加のシンボルが発見された場合はリストに追加すること。

### 手順 2: PrecombatContext を BattleContext.js に移動

Unit.js 行352-371（コメント含む）を `Sources/unit/BattleContext.js` の末尾に追加する。BattleContext クラスの閉じ括弧（行1138 `}`）の後に追加。コード変更は一切行わない。

BattleContext.js に新たな `/* global */` 追加は不要（PrecombatContext は新たな外部依存を持たない）。

### 手順 3: Unit.js からの削除

Unit.js から以下を削除:
- 行19-371: 4クラス + PrecombatContext（移動済みのコード全体）

削除後、Unit.js は行6-16の小関数3つの直後に `class Unit extends BattleMapElement {` が来る構造となる。

### 手順 4: ロード順序更新（3系統すべて）

#### `create_tests.sh`

`SOURCE_FILE_NAMES` 配列で、`unit/BattleContext` と `unit/Unit` の間に `unit/UnitContext` を追加:

```
    unit/BattleContext
    unit/UnitContext      ← 追加
    unit/Unit
```

#### `Deploy.bat`

Unit関連の結合リストで、`unit\BattleContext` と `unit\Unit` の間に `unit\UnitContext` を追加。Deploy.bat には複数のビルドターゲットがあり、Unit.js を含むすべてのターゲットに追加する必要がある。

現状 Deploy.bat では以下のパターンで Unit が含まれている:
- 行19: `unit\BattleContext,unit\Unit,unit\UnitManager` → `unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitManager`
- 行42 (StatusCalculator): 同様に `unit\BattleContext` と `unit\Unit` の間に追加
- 行45 (UnitBuilder): 同上
- 行48 (DamageCalculator): 同上

すべてのビルドターゲットで `unit\UnitContext` を `unit\BattleContext` と `unit\Unit` の間に挿入する。

#### HTMLファイル（全7ファイル）

以下の全HTMLファイルの `loadScripts` 配列で、`"unit/BattleContext.js"` と `"unit/Unit.js"` の間に `"unit/UnitContext.js"` を追加:

| HTML ファイル | 挿入位置 |
|--------------|---------|
| `Sources/ArenaSimulator.html` | 行1442-1443の間 |
| `Sources/DamageCalculator.html` | 行486-487の間 |
| `Sources/UnitBuilder.html` | 行1260-1261の間 |
| `Sources/AetherRaidSimulator.html` | 行1472-1473の間 |
| `Sources/SummonerDuelsSimulator.html` | 行1534-1535の間 |
| `Sources/HeroStatusClusterer.html` | 行274-275の間 |
| `Sources/StatusCalculator.html` | 行274-275の間 |

**3系統の相対順序一致を確認**: すべての系統で `BattleContext → UnitContext → Unit` の順序になっていることを検証する。

### 手順 5: ESLint対応

UnitContext.js の先頭 `/* global ... */` コメントが正しく設定されていることを確認。`./run_tests.sh` を実行してESLintエラーがないことを検証する。

不足しているシンボルがあればESLintの `no-undef` エラーとして報告されるので、追加する。

---

## 検証

1. **テスト実行**: `./run_tests.sh` -- 全テスト + ESLint パス
2. **ブラウザ smoke check**: `Sources/ArenaSimulator.html` をブラウザで開き、ユニット配置などの代表操作を1つ実行し、コンソールエラーがないことを確認

---

## コミット

1 Step = 1 コミット:

```
refactor(unit): 独立コンテキストクラス群をUnitContext.jsに分離、PrecombatContextをBattleContext.jsに移動
```

---

## 実装結果

**実施日**: 2026-03-28
**結果**: 計画通りに完了。全305テストパス（ESLint含む）。

### 実際のファイルパス
- 新規: `Sources/unit/UnitContext.js` (289行、ESLintコメント含む)
- 新規: `Tests/UnitContext.test.js` (7テスト)
- 変更: `Sources/unit/BattleContext.js` (末尾にPrecombatContext追加)
- 変更: `Sources/unit/Unit.js` (5クラス削除)
- 変更: `create_tests.sh` (SOURCE_FILE_NAMESとTEST_FILE_NAMES更新)
- 変更: `Deploy.bat` (4ビルドターゲットすべて更新)
- 変更: HTML 7ファイル (loadScripts更新)

### 計画からの差異
- なし。計画通りverbatim移動を実施。

### コードレビュー所見
- 既存バグ検出: `ActionContext.clear()` 内の `hasThreatensEnemyStatus` 重複代入。今回は未修正（別issueで対応予定）。

---

## 依存関係

- **前提（Section 02完了）**: ScopedTileChanger 抽出が完了し、`create_tests.sh`/`Deploy.bat`/HTML のロード順序が正しく更新されていること
- **後続（Section 04への影響）**: 本セクション完了後、Unit.js から行19-371が削除される。Section 04 は Unit.js 末尾のユーティリティ関数群（行7144-7424付近、本セクション削除分で行番号がずれる）を UnitUtility.js に抽出する。本セクションでの行削除により、Section 04 の対象行番号は約350行分前にずれることに注意

---

## ファイル一覧

### 新規作成

| ファイル | 内容 | 行数目安 |
|---------|------|---------|
| `Sources/unit/UnitContext.js` | AttackableUnitInfo, AttackEvaluationContext, AssistableUnitInfo, ActionContext | ~332行（ESLintコメント含む） |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `Sources/unit/Unit.js` | 行19-371を削除（5クラス分） |
| `Sources/unit/BattleContext.js` | 末尾にPrecombatContextクラスを追加（~20行） |
| `create_tests.sh` | `SOURCE_FILE_NAMES` に `unit/UnitContext` を追加 |
| `Deploy.bat` | 全ビルドターゲットに `unit\UnitContext` を追加 |
| `Sources/ArenaSimulator.html` | `loadScripts` に `"unit/UnitContext.js"` を追加 |
| `Sources/DamageCalculator.html` | 同上 |
| `Sources/UnitBuilder.html` | 同上 |
| `Sources/AetherRaidSimulator.html` | 同上 |
| `Sources/SummonerDuelsSimulator.html` | 同上 |
| `Sources/HeroStatusClusterer.html` | 同上 |
| `Sources/StatusCalculator.html` | 同上 |