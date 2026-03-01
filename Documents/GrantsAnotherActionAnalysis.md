# grantsAnotherActionXXX メソッド群 調査レポート

## 概要

`Unit.js` に定義されている `grantsAnotherAction` 系メソッド群は、FEHの「再行動」メカニズムを**トリガーの種類ごと**に分離して管理している。すべてのメソッドの核心は `this.isActionDone = false` の設定であり、行動済みのユニットを再び行動可能にする。

---

## 1. メインメソッド一覧

### 1.1 grantsAnotherAction() (行 6761)

- **トリガー**: 汎用（ターン開始時等）
- **1ターン1回制限**: なし
- **フック実行**: なし
- **呼び出し元**: `GrantsAnotherActionAndAppliesSkillNode`, `GrantsAnotherActionAndInflictsIsolationNode` 等（SkillEffect.js のスキルノード評価系）
- **処理内容**: `isActionDone = false` のみ

### 1.2 grantsAnotherActionByRefresh() (行 6765)

- **トリガー**: 踊り/歌い（再行動補助スキル）
- **1ターン1回制限**: なし
- **フック実行**: なし
- **呼び出し元**: `BattleSimulatorBase.js` の `__applyRefresh()`
- **処理内容**: `isActionDone = false` のみ
- **備考**: 踊り子等の再行動補助スキル使用時に対象ユニットに対して呼ばれる

### 1.3 grantsAnotherActionOnMap() (行 6769)

- **トリガー**: マップ上の効果（ターン開始時のスキル等）
- **1ターン1回制限**: なし
- **フック実行**: なし
- **呼び出し元**: `GrantsAnotherActionNode`, `GrantsAnotherActionToTargetOnMapNode` (SkillEffect.js)
- **処理内容**: `isActionDone = false` のみ
- **備考**: ターン開始時などマップ上で発動するスキルによる再行動

### 1.4 grantsAnotherActionWithEmblemSkill() (行 6773)

- **トリガー**: 紋章士スキル（エンゲージ効果）
- **1ターン1回制限**: なし
- **フック実行**: なし
- **呼び出し元**: `GrantsAnotherActionWithEmblemSkillNode` (SkillEffect.js)
- **処理内容**: `isActionDone = false` のみ
- **備考**: 紋章士（エンゲージ）の効果による再行動を区別するためのメソッド

### 1.5 grantsAnotherActionAfterCombat() (行 6777)

- **トリガー**: 自分の戦闘後（自分のスキル）
- **1ターン1回制限**: なし
- **フック実行**: **あり** — `AFTER_BEING_GRANTED_ANOTHER_ACTION_AFTER_COMBAT_HOOKS`
- **呼び出し元**: `GrantsAnotherActionToTargetAfterCombatNode` (SkillEffect.js)
- **処理内容**:
  1. `isActionDone` が true の場合のみフックを評価
  2. `isActionDone = false` を設定
- **備考**: 自分のスキルによる戦闘後再行動。フックで再行動後の追加効果を処理

### 1.6 grantsAnotherActionAfterCombatExceptOwnSkills(skillOwner) (行 6787)

- **トリガー**: 戦闘後（他ユニットのスキルによる）
- **1ターン1回制限**: **あり** — `skillOwner` の `activatedOncePerTurnSkillEffectIdsThisTurn` で管理
- **フック実行**: **あり** — `AFTER_BEING_GRANTED_ANOTHER_ACTION_AFTER_COMBAT_HOOKS`
- **呼び出し元**: `GrantsAnotherActionToTargetAfterCombatExceptsTargetsSkillNode` (SkillEffect.js)
- **処理内容**:
  1. `isActionDone` が false なら即 `return false`
  2. スキル所有者がこのターン未発動なら: フック評価 → `reservedAnotherAction = true` → 発動済みフラグ追加
  3. 発動済みなら `return false`
- **備考**: 即時ではなく**予約型**の再行動（`reservedAnotherAction`）。スキル所有者単位で1ターン1回制限

### 1.7 grantsAnotherActionAfterAlliesCombat() (行 6804)

- **トリガー**: 味方の戦闘後
- **1ターン1回制限**: **あり** — 自身の `activatedOncePerTurnSkillEffectIdsThisTurn` で管理
- **フック実行**: なし
- **呼び出し元**: `GrantsAnotherActionToTargetAfterTargetAlliesCombatNode` (SkillEffect.js)
- **処理内容**:
  1. `isActionDone` が false なら即 `return false`
  2. このターン未発動なら: 発動済みフラグ追加 → `reservedAnotherAction = true`
  3. 発動済みなら `return false`
- **備考**: **予約型**の再行動。自身単位で1ターン1回制限

### 1.8 grantsAnotherActionWhenAssist(isAssist) (行 6825)

- **トリガー**: 補助使用時または被使用時
- **処理内容**: `isAssist` が true なら `grantsAnotherActionOnAssist()` を、false なら `grantsAnotherActionOnAssisted()` を呼ぶ振り分けメソッド
- **呼び出し元**: `SkillImpl.js:4696`

### 1.9 grantsAnotherActionOnAssist() (行 6833)

- **トリガー**: 補助を使用した時
- **1ターン1回制限**: **あり** — `GRANTS_ANOTHER_ACTION_ON_ASSIST_ID` で管理
- **フック実行**: **あり** — `AFTER_BEING_GRANTED_ANOTHER_ACTION_ON_ASSIST_HOOKS`
- **呼び出し元**: `grantsAnotherActionWhenAssist()`, `grantAnotherActionOnAssistIfPossible()`, `grantAnotherActionOnAssistIfAnotherActionEffectIsNotActivatedThisTurn()`
- **処理内容**:
  1. `isActionDone` が true の場合のみフックを評価
  2. `isActionDone = false` を設定
  3. 発動済みフラグ追加
  4. グローバルコンテキストに補助による再行動フラグを設定

### 1.10 grantsAnotherActionOnAssisted() (行 6846)

- **トリガー**: 補助を受けた時
- **1ターン1回制限**: なし
- **フック実行**: なし
- **呼び出し元**: `grantsAnotherActionWhenAssist()`
- **処理内容**: `isActionDone = false` のみ
- **備考**: `// TODO: 再行動可能かどうかの判定を行う` コメントあり。今後ロジック追加予定

---

## 2. 補助メソッド（条件付きラッパー）

### 2.1 grantAnotherActionOnAssistIfPossible() (行 6851)

- **条件**: `isOneTimeActionActivatedForSupport` が未発動 かつ `isActionDone` が true
- **処理**: 条件を満たせば `grantsAnotherActionOnAssist()` を実行、`isOneTimeActionActivatedForSupport = true` を設定
- **戻り値**: 発動したら `true`、できなければ `false`
- **呼び出し元**: `GrantsAnotherActionToTargetOncePerTurnOnAssistNode` (SkillEffect.js)

### 2.2 grantAnotherActionOnAssistIfAnotherActionEffectIsNotActivatedThisTurn() (行 6861)

- **条件**: 上記に加え、`GRANTS_ANOTHER_ACTION_ON_ASSIST_ID` がこのターン未発動
- **処理**: より厳格な条件で `grantsAnotherActionOnAssist()` を実行
- **戻り値**: 発動したら `true`
- **呼び出し元**: `GrantsAnotherActionToTargetOncePerTurnOnAssistIfAnotherActionEffectIsNotActivatedNode` (SkillEffect.js)
- **備考**: 他の再行動効果が既に発動していた場合は発動しない

### 2.3 grantAnotherActionByCallingCircleIfPossible(currentTurn) (行 6871)

- **条件**: `anotherActionTurnForCallingCircle` と現在ターンが一致 かつ `isActionDone` が true
- **処理**: 条件を満たせば `anotherActionTurnForCallingCircle = -1` にリセットし `isActionDone = false`
- **呼び出し元**: `BattleSimulatorBase.js` の複数箇所（戦闘後、ターン開始時等）
- **備考**: 召喚陣等の特定ターン予約型再行動

---

## 3. メソッド分離の設計意図

現時点では多くのメソッドの本体が同一（`isActionDone = false` のみ）だが、以下の理由で分離されている。

### 3.1 フック（後処理）の有無

- `grantsAnotherActionAfterCombat` / `AfterCombatExceptOwnSkills` → `AFTER_BEING_GRANTED_ANOTHER_ACTION_AFTER_COMBAT_HOOKS`
- `grantsAnotherActionOnAssist` → `AFTER_BEING_GRANTED_ANOTHER_ACTION_ON_ASSIST_HOOKS`
- その他のメソッドにはフックなし

### 3.2 1ターン1回制限の管理方法の違い

| 管理方法 | 対象メソッド |
|---------|------------|
| `activatedOncePerTurnSkillEffectIdsThisTurn` (Set) | `AfterCombatExceptOwnSkills`, `AfterAlliesCombat`, `OnAssist` |
| `isOneTimeActionActivatedForSupport` (boolean) | `grantAnotherActionOnAssistIfPossible` 系 |
| `anotherActionTurnForCallingCircle` (ターン番号) | `grantAnotherActionByCallingCircleIfPossible` |
| 制限なし | `grantsAnotherAction`, `ByRefresh`, `OnMap`, `WithEmblemSkill`, `AfterCombat` |

### 3.3 即時 vs 予約型

| 種類 | 対象メソッド |
|------|------------|
| 即時（`isActionDone = false`） | 大多数のメソッド |
| 予約型（`reservedAnotherAction = true`） | `AfterCombatExceptOwnSkills`, `AfterAlliesCombat` |

### 3.4 ログ/デバッグ上の区別

SkillEffect.js のノードクラスがメソッドごとに異なるログメッセージを出力するため、どのトリガーで再行動が発生したか追跡可能。

### 3.5 将来の拡張余地

`grantsAnotherActionOnAssisted()` には `// TODO` コメントがあり、今後個別のロジック追加が予定されている。

---

## 4. 関連する定数・フック

```
// Unit.js 静的定数
static GRANTS_ANOTHER_ACTION_ON_ASSIST_ID = 'grants-another-action-on-assist'
static GRANTS_ANOTHER_ACTION_AFTER_COMBAT_EXCEPT_OWN_SKILLS_ID = 'grants-another-action-after-combat-except-own-skills'
static GRANTS_ANOTHER_ACTION_AFTER_ALLIES_COMBAT_ID = 'grants-another-action-after-allies-combat'

// SkillEffectHooks.js フック
AFTER_BEING_GRANTED_ANOTHER_ACTION_AFTER_COMBAT_HOOKS  (行 321)
AFTER_BEING_GRANTED_ANOTHER_ACTION_ON_ASSIST_HOOKS     (行 326)
```
