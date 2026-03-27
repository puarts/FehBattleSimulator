Now I have enough context. Let me write the section.

# Section 06 -- BattleSimulatorBase.js 分割

## 概要

`Sources/BattleSimulatorBase.js`（12,307行）は、Vue生成、バトルロジック、移動システム、コマンドキュー、設定永続化、AI連携など6つ以上の責務が混在するGod Objectである。本セクションでは、このファイルを責務ごとに分割し、モジュール境界を明確にする。

**重要**: ファイル移動（Phase 2a / section-05）が完了した後に実施する。コードの構造変更のみを行い、ファイルのrename/移動は含まない。

## 前提条件

- **依存セクション**: section-05（ファイル移動）が完了していること
- **現在の状態**: `BattleSimulatorBase.js`は`create_tests.sh`のSOURCE_FILE_NAMESに含まれていない（テスト結合対象外）。`Deploy.bat`および各HTML（`AetherRaidSimulator.html`等）の`loadScripts()`配列には含まれている
- **子クラス**: 4つの子クラスが`BattleSimulatorBase`を継承している:
  - `AetherRaidSimulator` (AetherRaidSimulatorMain.js)
  - `ArenaSimulator` (ArenaSimulatorMain.js)
  - `SummonerDuelsSimulator` (SummonerDuelsSimulatorMain.js)
  - `UnitBuilderMain` (UnitBuilderMain.js)

## 現在のファイル構造

`BattleSimulatorBase.js`は大きく2つのセクションに分かれている:

1. **BattleSimulatorBaseクラス** (行77-11719): クラス本体
2. **トップレベル関数群** (行11724-12307): マップ操作、UI更新、設定管理の自由関数

### クラス内の責務分布

行番号の概算に基づく責務マッピング:

| 責務 | 概算行範囲 | 概算行数 |
|------|-----------|---------|
| コンストラクタ・初期化 | 78-131 | 約50行 |
| Vue統合 (`#create_vue`) | 133-1070 | 約940行 |
| アリーナスコア計算 | 1087-1300 | 約210行 |
| デュオ/ハーモナイズドスキル | 1311-2026 | 約710行 |
| 構造物・画像解析 | 2027-2265 | 約240行 |
| 共鳴戦/テンペスト設定 | 2266-2850 | 約580行 |
| コマンドキュー・プロパティ | 2849-2870 | 約20行 |
| テスト用ユニットリセット | 2872-3060 | 約190行 |
| 耐久テスト | 3060-3210 | 約150行 |
| ターン管理 | 3211-3450 | 約240行 |
| ログ出力 | 3474-3525 | 約50行 |
| ユニット列挙 | 3526-3655 | 約130行 |
| スキル登録・管理 | 3655-3880 | 約220行 |
| ダメージ計算・戦闘処理 | 3878-4640 | 約760行 |
| ターン開始処理 | 4642-5200 | 約560行 |
| AI行動シミュレーション | 5200-7400 | 約2200行 |
| コマンド生成・キュー操作 | 7400-8400 | 約1000行 |
| AI攻撃評価 | 8400-9320 | 約920行 |
| 構造物実行・設定 | 9320-9700 | 約380行 |
| 補助スキル適用 | 9700-11700 | 約2000行 |

### トップレベル関数群の分類

行11724以降のトップレベル関数群:

| 責務 | 関数例 | 概算行数 |
|------|--------|---------|
| マップ操作/UI | `moveStructureToMap`, `updateMapUi`, `changeMap`, `resetPlacement` | 約430行 |
| 設定永続化 | `loadSettings`, `saveSettings`, `importSettingsFromString` | 約110行 |
| タッチイベント | `removeTouchEventFromDraggableElements`, `addTouchEventToDraggableElements` | 約30行 |

## 分割の原則

1. **切り出し先モジュールは入力引数・返り値・外部状態依存・副作用対象を明確にする**
2. **BattleSimulatorBaseインスタンスを丸ごと渡す `function xxx(simulator)` パターンは避ける** -- God Objectの分散再生産になる
3. **メソッド移動は1グループずつ**、各ステップでテスト + ブラウザ確認
4. **git bisectが使えるよう細かくコミット**
5. **Vue統合レイヤーの切り出しは最後に回す** -- Vue 2の`this`バインディングやリアクティブ参照が絡むため

## テスト方針

### 前提: テスト基盤の現状

`BattleSimulatorBase.js`は`create_tests.sh`のSOURCE_FILE_NAMESに含まれていない。テスト結合対象外のため、直接的な単体テストは存在しない。既存テストは`DamageCalculator`、`BeginningOfTurnSkillHandler`、`SkillRegression`等のテストスイートでカバーされている戦闘ロジック周辺のみ。

### 分割前: テストカバレッジ確認

分割作業の開始前に、以下を確認する:

```
Test: BattleSimulatorBaseの主要メソッドが既存テストでカバーされている範囲を特定する
Test: カバレッジが不足している責務について、分割前にテストを追加する
```

現在のテスト基盤では`BattleSimulatorBase`自体がテスト結合対象外のため、分割後のファイルを`create_tests.sh`に追加する際に初めてテスト対象になる。分割後のファイルのうち、グローバルスコープ関数やクラスに直接依存しない純粋ロジック（ダメージ計算呼び出し、AI評価ロジック等）は新規テスト追加の候補である。

### 各責務モジュール切り出し時のテスト

**コアフレーム（コンストラクタ・初期化）:**
```
Test: コンストラクタが正常にインスタンスを生成する
Test: 初期化処理が正しい順序で実行される
Test: 子クラス（AetherRaidSimulator等）が正常に拡張できる
```

**バトルロジック:**
```
Test: ターン処理が正常に動作する
Test: 戦闘シミュレーションの結果が分割前と同一
```

**移動システム:**
```
Test: パスファインディングが正しい経路を返す
Test: 移動可能範囲計算が正しい
```

**コマンドキュー:**
```
Test: コマンドのキューイングと実行順序が正しい
```

**設定永続化:**
```
Test: セーブ/ロードが正常動作する
Test: 分割後もlocalStorageの既存データが読み込める（後方互換性）
```

**Vue統合レイヤー（最後に分割）:**
```
Test: Vue VMが正常に生成される
Test: Vuexストアが正常に動作する
Test: コンポーネント間のデータバインディングが正常
```

### 全ステップ共通の回帰テスト

各メソッドグループの移動後に以下を必ず実行する:

```
Test: ./run_tests.sh が全テストパス
Test: Deploy.batが正常に結合JSを生成
Test: 本番7ページがブラウザで正常動作（AetherRaid, Arena, SummonerDuels, UnitBuilder, StatusCalculator, DamageCalculator, TempestTrials）
Test: ESLintパス
Test: CIが成功（Jest + ESLint）
Test: localStorageの既存データが読み込める（後方互換性）
Test: URLパラメータが正常に処理される
```

## 実装手順

### ステップ0: 分割計画の精緻化

実際のメソッド依存関係を分析してから分割順序を確定する。以下を調査する:

- クラス内メソッド間の呼び出し関係（`this.xxxxx()`の呼び出し元・先）
- `g_appData`への直接アクセスパターン
- トップレベル関数（行11724以降）のクラスメソッドからの参照関係
- 子クラスでオーバーライドされているメソッドの特定

### ステップ1: トップレベル関数群の分離

行11724-12307のトップレベル関数群はクラスメソッドではないため、最もリスクが低い分割対象である。

**分離対象ファイル案:**

| 新ファイル名 | 内容 | 主な関数 |
|-------------|------|---------|
| `MapOperations.js` | マップ操作・UI更新 | `moveStructureToMap`, `moveUnitToMap`, `updateMapUi`, `updateMap`, `changeMap`, `createMap`, `resetPlacement`, `resetPlacementOfStructures`, `resetPlacementOfUnits` 等 |
| `SettingsPersistence.js` | 設定のセーブ/ロード | `loadSettings`, `loadSettingsFromDict`, `saveSettings`, `exportPerTurnSettingAsString`, `importPerTurnSetting`, `importSettingsFromString` |

**注意点:**
- `OwnerType`定数、`g_trashArea`変数もこの領域に定義されている
- `moveStructureToTrashBox`は`BeginningOfTurnSkillHandler`のコンストラクタに渡されている（`BattleSimulatorBase`コンストラクタ行96）
- トップレベル関数はクラスメソッドの`#create_vue()`内のVueメソッドから参照されている（例: `resetPlacement`, `updateAllUi`）
- これらの関数はグローバルスコープにあるため、分離後も同じグローバルスコープで動作する限り問題ない

**作業:**
1. 新ファイルを作成し、対象の関数・定数・変数を移動
2. `BattleSimulatorBase.js`から移動した部分を削除
3. `create_tests.sh`のSOURCE_FILE_NAMESに新ファイルを追加（BattleSimulatorBaseの前に配置）
4. `Deploy.bat`の`BF`変数にファイルを追加（BattleSimulatorBaseの前）
5. 各HTMLの`loadScripts()`配列にファイルを追加（BattleSimulatorBaseの前）
6. テスト + ブラウザ確認

### ステップ2: コアフレーム分離

コンストラクタと初期化ロジック（行78-131）はBattleSimulatorBaseクラス自体に残す。これはクラスの骨格であり分離の意味がない。代わりに、クラスのプロパティアクセサやユーティリティ的メソッドを整理する。

ステップ2以降では、BattleSimulatorBaseクラスのメソッドをグループ単位で別ファイルに切り出す。切り出し方法は以下のいずれか:

**方式A: プロトタイプ拡張**
```javascript
// BattleSimulatorBase_Movement.js
BattleSimulatorBase.prototype.__getMovableTiles = function(unit) { ... };
BattleSimulatorBase.prototype.simulateMovement = function(targetUnits, enemyUnits, ...) { ... };
```

**方式B: Mixin関数**
```javascript
// BattleSimulatorBase_Movement.js
function BattleSimulatorBase_MovementMixin(Base) {
    Base.prototype.__getMovableTiles = function(unit) { ... };
    // ...
}
BattleSimulatorBase_MovementMixin(BattleSimulatorBase);
```

**方式C: スタンドアロン関数化**（God Objectパターンを避ける場合に推奨）
```javascript
// MovementSystem.js
function getMovableTiles(unit, map) { ... }
function simulateMovement(targetUnits, enemyUnits, allyUnits, map, ...) { ... }
```

プロトタイプ拡張（方式A）が最もリスクが低い。既存のメソッド呼び出し（`this.xxx()`）がそのまま動作するため。スタンドアロン関数化は理想的だが、`this`経由の依存が多いため段階的に進める必要がある。

**推奨**: まず方式Aでファイル分割を行い、モジュール境界を確立した後、将来のESM化フェーズで方式Cへのリファクタリングを検討する。

### ステップ3: バトルロジック分離

戦闘処理関連のメソッドを別ファイルに切り出す。

**対象メソッド群:**
- `updateDamageCalculation` (行3878)
- `removeDeadUnit` (行4042)
- `applyAnotherActionSkillBySpecial` (行4088)
- `applySkillEffectAfterMovementSkill` (行4132)
- `calcDamage` / `calcDamageTemporary` (行4201, 4220)
- `showDamageCalcSummary` / `clearDamageCalcSummary` (行4421, 4468)
- `__createDamageCalcSummaryHtml` 系 (行4492-)

**新ファイル**: `BattleSimulatorBase_Combat.js`（仮称）

### ステップ4: AI行動シミュレーション分離

AI関連のメソッド群を分離する。これはファイル内で最大のメソッド群（約2200行）。

**対象メソッド群:**
- `simulateEnemiesForCurrentTurn` (行5867)
- `simulateEnemyTurn` (行5892)
- `simulateAllyAction` / `simulateEnemyAction` 系 (行5928-)
- `simulateMovement` (行7141)
- `simulatePrecombatAssist` / `simulatePostCombatAssist` 系 (行6145-)
- `simulateAttack` (行8591)
- `__evaluateBestTileToAttack` / `__evaluateBestAttackTarget` 系 (行8691-)
- `__updateMovementOrders` (行6928)
- `__updateChaseTargetTiles` 系 (行6986-)

**新ファイル**: `BattleSimulatorBase_AI.js`（仮称）

### ステップ5: 補助スキル適用分離

補助スキル（移動補助、回復、応援等）の適用ロジックを分離する（約2000行）。

**対象メソッド群:**
- `__applyMovementAssist` (行9794)
- `__applyMovementAssistSkill` (行9886)
- `#applyMovementAssistSkill` (行9893)
- `__applyRefresh` / `#applyRefreshSkills` (行10103, 10145)
- `__applyRally` / `__applySkillsAfterRally` (行10501, 10533)
- `__applyHeal` / `#applyRestore` (行10829, 10872)
- `applySupportSkill` / `applyCantoAssistSkill` (行10921, 11174)
- `canUseAssistOn` (行11232)
- `__findTileAfterMovementAssist` 系 (行11287-)

**新ファイル**: `BattleSimulatorBase_Assist.js`（仮称）

**注意**: `#applyMovementAssistSkill`, `#applyRefreshSkills`等のプライベートメソッド（`#`プレフィックス）はプロトタイプ拡張方式では移動できない。これらは元のクラス定義内に残すか、通常メソッドに変換する必要がある。

### ステップ6: コマンドキュー分離

コマンド生成・キュー操作のメソッドを分離する（約1000行）。

**対象メソッド群:**
- `__createCommand` / `__enqueueCommand` 系 (行8285-)
- `__createMoveCommand` / `__enqueueMoveCommand` (行8108-)
- `__createAttackCommand` / `__enqueueAttackCommand` (行8197-)
- `__createSupportCommand` / `__enqueueSupportCommand` (行7665-)
- `executePerActionCommand` / `undoCommand` / `redoCommand` (行8341-)

**新ファイル**: `BattleSimulatorBase_Commands.js`（仮称）

### ステップ7: ターン開始処理分離

ターン開始時のスキル適用処理を分離する（約560行）。

**対象メソッド群:**
- `__applySkillsForBeginningOfTurn` (行4695)
- `#applyHpSkillsForBeginningOfTurnForAllGroups` (行4727)
- `#applySkillsForBeginningOfTurnForAllGroups` (行4741)
- `__simulateBeginningOfTurn` (行4819)
- `simulateBeginningOfEnemyTurn` / `simulateBeginningOfAllyTurn` (行5194, 5237)
- `__initializeUnitsPerTurn` (行4954)

**新ファイル**: `BattleSimulatorBase_TurnStart.js`（仮称）

**注意**: `#applyHpSkillsForBeginningOfTurnForAllGroups`等のプライベートメソッドは前述のステップ5と同様の制約がある。

### ステップ8: 構造物実行分離

構造物の実行処理を分離する（約380行）。

**対象メソッド群:**
- `executeStructuresByUnitGroupType` (行9320)
- `executeStructure` (行9440)
- `executeCurrentStructure` (行9634)
- `__executeDarkShrine` / `__executeBrightShrine` (行9658, 9667)
- `__executeSchool` (行9627)

**新ファイル**: `BattleSimulatorBase_Structures.js`（仮称）

### ステップ9: Vue統合レイヤー分離（最後）

`#create_vue()`メソッド（行133-1070、約940行）を分離する。

**リスクが最も高い理由:**
- Vue 2の`this`バインディングがVueメソッド内で使用されている
- `self`変数（BattleSimulatorBaseインスタンス）がクロージャで捕捉されている
- Vuexストアの定義も含まれている
- 多数のグローバル関数（`updateMapUi`, `resetPlacement`等）への参照がある

**方針:**
- `#create_vue()`はプライベートメソッドのため、プロトタイプ拡張では移動できない
- 選択肢1: 通常メソッド`_createVue()`に変換してからプロトタイプ拡張で移動
- 選択肢2: Vueメソッド定義をオブジェクトとして別ファイルに切り出し、`#create_vue()`内でマージ
- 選択肢3: Vue統合は現段階ではBattleSimulatorBase.jsに残し、将来のVue 3移行時に対処

**推奨**: 選択肢2または3。Vue統合は密結合が強いため、無理に分離するよりも将来のVue 3移行と同時に対処する方がリスクが低い。

## ファイル更新箇所

各ステップで以下のファイルを更新する:

| ファイル | 更新内容 |
|---------|---------|
| `Sources/BattleSimulatorBase.js` | 切り出したメソッド・関数の削除 |
| `create_tests.sh` | SOURCE_FILE_NAMESに新ファイルを追加（BattleSimulatorBaseの前に配置。ロード順序依存のため） |
| `Deploy.bat` | `BF`変数に新ファイルを追加（BattleSimulatorBaseの前） |
| `Sources/AetherRaidSimulator.html` | `loadScripts()`配列に新ファイルを追加 |
| `Sources/ArenaSimulator.html` | 同上 |
| `Sources/SummonerDuelsSimulator.html` | 同上 |
| `Sources/UnitBuilder.html` | 同上 |

新ファイルはBattleSimulatorBaseの**前**にロードする必要がある（プロトタイプ拡張方式の場合は**後**にロードする）。方式に応じてロード順序を調整すること。

## プライベートメソッド（#プレフィックス）の扱い

BattleSimulatorBaseには以下のプライベートメソッドが存在する:

- `#create_vue` (行133)
- `#shouldLog` (行3508)
- `#applyHpSkillsForBeginningOfTurnForAllGroups` (行4727)
- `#applySkillsForBeginningOfTurnForAllGroups` (行4741)
- `#applySkillsForBeginningOfTurnAfterHpSkillsForAllGroups` (行4762)
- `#applySkillsAfterSkillsForBeginningOfTurnForAllGroups` (行4791)
- `#resetDuoOrHarmonizedSkill` (行4980)
- `#getDivineVeinSummaryHtml` (行4555)
- `#applyMovementAssistSkill` (行9893)
- `#applyRefreshSkills` (行10145)
- `#applyRestore` (行10872)
- `#healSupporter` (行10886)
- `#applySkillsAfterRallyForTargetUnit` (行10565)
- `#applySkillsAfterRallyForSupporter` (行10646)
- `#applySupportSkillForSupporter` (行11054)

これらはJavaScriptのプライベートクラスフィールドであり、プロトタイプ拡張では移動できない。対処方法:

1. **クラス定義内に残す**: プライベートメソッドは元のクラスに残し、そこから呼び出す公開メソッドのみを分離ファイルに移動
2. **通常メソッドに変換**: `#method`を`__method`（アンダースコア2つのコンベンション）に変換してからプロトタイプ拡張で移動。後方互換性のリスクは低い（プライベートメソッドは外部から呼ばれない）
3. **ファサードパターン**: プライベートメソッドの処理を外部関数に委譲し、プライベートメソッドはラッパーとして残す

**推奨**: 方法2。既存コードでは`__method`（アンダースコア2つ）パターンが多用されており、`#method`との混在は少ない。変換後もクラス外部からの呼び出しは発生しないため安全。

## リスク管理

### 回帰リスク

- **緩和策**: メソッド移動は1グループずつ、各ステップでテスト + ブラウザ確認
- **緩和策**: git bisectが使えるよう細かくコミット
- **緩和策**: `this`コンテキストの維持を確認（プロトタイプ拡張方式ならば自動的に維持される）

### 子クラスとの互換性

4つの子クラスが`BattleSimulatorBase`を継承している。プロトタイプ拡張方式ではプロトタイプチェーンが維持されるため、子クラスからの`super`呼び出しや`this`経由のメソッド呼び出しは影響を受けない。ただし、子クラスでオーバーライドされているメソッドがある場合は注意が必要。分割前に各子クラスのメソッド一覧を確認すること。

### update_skillsブランチとのコンフリクト

`BattleSimulatorBase.js`はスキル実装（SkillImpl系）とは直接的な変更競合が少ない。ただし、新スキルの効果でBattleSimulatorBaseのメソッドが変更される可能性はある。分割作業は集中的に進めてコンフリクト期間を短縮すること。