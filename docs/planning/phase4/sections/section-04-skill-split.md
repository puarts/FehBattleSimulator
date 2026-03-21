Now I have a complete picture. Let me write the section content.

# Section 4: Skill.jsの分割

## 概要

Skill.js（2,144行）は現在、複数のレイヤーにまたがる責務を持っている。このセクションでは、Skill.jsをLayer 2（データモデル）の責務のみに絞り込み、上位レイヤーの依存を排除する。

**前提条件**: セクション3（StatusConstants.jsの新設）が完了していること。StatusIndex、StatusEffectType、POSITIVE_STATUS_EFFECT_ARRAY、StatFlags等はすでにStatusConstants.jsに移動済みであること。

**ゴール**:
- Skill.jsがLayer 2の責務のみを持つ
- Skill.jsはLayer 0-1のみをimportする
- 既存テスト500件が全パス

## 現状分析

### Skill.jsの現在の構造

ファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Skill.js`（2,144行）

現在のimport:
```javascript
import { WeaponType, Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveS, PassiveX, Captain, SkillType, WeaponRefinementType, EmblemHero, NONE_ID } from './SkillConstants.js';
import { g_siteRootPath, g_skillIconRootPath } from './GlobalDefinitions.js';
```

これらはLayer 0-1のみで、import自体は問題ない。

### 責務の分類

Skill.jsが含む機能は以下の3カテゴリに分かれる:

**1. Layer 1相当（定数）** -- セクション3で移動済み:
- `StatusIndex` (行1820-1826)
- `StatFlags` (行1831-1848)
- `StatusEffectType` (行1271-1382)
- `POSITIVE_STATUS_EFFECT_ARRAY` (行1384+)
- `NEGATIVE_STATUS_EFFECT_ARRAY` (行1550+)
- `POSITIVE_STATUS_EFFECT_ORDER_MAP`, `NEGATIVE_STATUS_EFFECT_ORDER_MAP`
- `getStatusName` (行1850-1855)

**2. Layer 2（データモデル）** -- Skill.jsに残す:
- `SkillInfo`クラス (行1586-1789): スキルデータの構造体。Layer 0-1のみ依存
- 武器種判定関数群: `isPhysicalWeaponType`, `isMeleeWeaponType`, `isRangedWeaponType`, `isWeaponTypeBow`, `isWeaponTypeDagger`, etc.
- スキルID変換関数: `getNormalSkillId`, `getRefinementSkillId`, `getSpecialRefinementSkillId`, `getStatusEffectSkillId`, etc.
- 武器種マップ/定数: `WEAPON_TYPE_ATTACK_RANGE_MAP`, `PHYSICAL_WEAPON_TYPE_SET`, `BOW_WEAPON_TYPE_SET`, etc.
- スキルカテゴリ定数: `REFRESH_SUPPORT_SKILL_SET`, `NORMAL_ATTACK_SPECIAL_SET`, `DEFENSE_SPECIAL_SET`, etc.
- 応援バフ量マップ: `RALLY_BUFF_AMOUNT_MAP`, `getAtkBuffAmount`, `getSpdBuffAmount`, etc.
- VALUE_DICT群: `WEAPON_VALUE_DICT`, `SUPPORT_VALUE_DICT`, etc.
- FuncMap群: `applySkillEffectForUnitFuncMap`, `canActivateCantoFuncMap`, etc. (行1933-2087)
- `getSkillFunc` (行1912-1929)

**3. 上位レイヤー依存を含む関数** -- 移動が必要:
- `canRallyForcibly` (行868-906): `NodeEnv`, `CAN_RALLY_FORCIBLY_HOOKS`, `LoggerBase`に依存（Layer 5）
- `canRalliedForcibly` (行908-943): `NodeEnv`, `CAN_RALLIED_FORCIBLY_HOOKS`, `getSkillLogLevel`に依存（Layer 5）
- `stealBonusEffects` (行1865-1902): `Unit`型のメソッド呼び出しを含む。`StatusEffectType.Dosage`とUnitメソッド（`hasStatusEffect`, `getPositiveStatusEffects`等）に依存。また`getStatusEffectName`をUnitConstants.jsから参照（現在はグローバル経由の暗黙参照）

## テスト（先に作成）

テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/SkillSplit.test.js`

### テストスタブ

```javascript
/**
 * @file Skill.js分割の検証テスト
 * セクション4: Skill.jsがLayer 2データモデルのみに絞り込まれたことを確認する
 */

// Test: Skill.jsからimportできる全publicシンボルが、分割後も同じ名前・同じ値でimportできる
//   - SkillInfo クラスがimportでき、インスタンス生成が可能
//   - getAttackRangeOfWeaponType, isPhysicalWeaponType 等の関数がimportできる
//   - WEAPON_TYPE_ATTACK_RANGE_MAP, PHYSICAL_WEAPON_TYPE_SET 等の定数がimportできる
//   - 全FuncMap（applySkillEffectForUnitFuncMap等）がimportできMapインスタンスである

// Test: SkillInfoクラスの生成・プロパティアクセスが正常に動作する
//   - new SkillInfo(...) で例外なく生成される
//   - id, name, might, type 等の基本プロパティにアクセスできる
//   - isDuel4(), isDuel3(), getDisplayName(), isImplemented() メソッドが正常に動作する

// Test: Skill.jsがLayer 2の責務のみを持ち、Layer 3以上のシンボルをimportしていない
//   - madge --circular で確認、またはimport文の手動検査
//   - NodeEnv, CAN_RALLY_FORCIBLY_HOOKS, LoggerBase 等のLayer 5シンボルがSkill.jsに存在しない
//   - stealBonusEffects 関数がSkill.jsに存在しない（移動先に存在する）
```

### 回帰テスト

既存テスト500件が全パスすること: `npm test`

## 実装手順

### 手順1: 上位レイヤー依存関数の移動先を決定・作成

以下の3関数をSkill.jsから移動する必要がある:

**`canRallyForcibly` と `canRalliedForcibly`**:
- 依存先: `NodeEnv`（SkillEffectCore.js/Layer 5）、`CAN_RALLY_FORCIBLY_HOOKS`/`CAN_RALLIED_FORCIBLY_HOOKS`（SkillEffectHooks.js/Layer 5）、`LoggerBase`（Logger.js/Layer 0）、`getSkillLogLevel`
- 呼び出し元: Unit.js、BattleSimulatorBase.js
- 移動先候補: これらはスキル効果の評価ロジックであり、Layer 5以上が適切。セクション6（残りの循環依存解消）で最終配置を決定するが、一旦は新ファイルまたは既存のLayer 5末尾ファイルに移動する

**`stealBonusEffects`**:
- 依存先: `StatusEffectType`（StatusConstants.js/Layer 1に移動済み）、`getStatusEffectName`（UnitConstants.js/Layer 1）、Unitインスタンスのメソッド呼び出し
- Unitのメソッドはインターフェース経由で呼ばれるだけ（duck typing）なので、Layer 2にも置けるが、そもそもSkill.js内のTODOコメント（行1904: `// TODO: ここから下の内容を別ファイルに分ける`）が示す通り、本来このファイルに属さない
- 移動先候補: 呼び出し元を確認し、BeginningOfTurnSkillHandler.jsやBattleSimulatorBase.js等の適切な上位レイヤーファイルに移動する

### 手順2: 関数を移動

1. `canRallyForcibly`、`canRalliedForcibly`をSkill.jsから切り出す。移動先ファイルに必要なimportを追加する

2. `stealBonusEffects`をSkill.jsから切り出す。移動先ファイルに必要なimport（`StatusEffectType` from StatusConstants.js、`getStatusEffectName` from UnitConstants.js）を追加する

3. Skill.jsのexport文から移動した関数を削除する

4. 移動先ファイルから新たにexportする

5. 呼び出し元のimport文を更新する。`stealBonusEffects`と`canRallyForcibly`/`canRalliedForcibly`の呼び出し元を確認し、import先を変更する

### 手順3: Skill.jsのimportが Layer 0-1のみであることを確認

分割完了後、Skill.jsのimport文は以下のみであるべき:
```javascript
import { ... } from './SkillConstants.js';       // Layer 1
import { ... } from './GlobalDefinitions.js';     // Layer 0
import { ... } from './StatusConstants.js';        // Layer 1 (re-export用、セクション3で設定済み)
```

Layer 3以上（Unit.js、SkillEffect.js、SkillEffectHooks.js、SkillEffectCore.js等）からのimportが存在しないことを確認する。

### 手順4: re-exportの整理

セクション3で追加されたStatusConstants.jsからのre-exportは維持する。移動した関数（`canRallyForcibly`, `canRalliedForcibly`, `stealBonusEffects`）についても、後方互換のためSkill.jsからre-exportすることを検討するが、re-exportが循環を生む場合（移動先がLayer 5以上の場合）は**re-exportしない**。その場合、呼び出し元のimport先を直接変更する。

### 手順5: テスト実行と確認

1. `npm test` で既存500テストが全パスすることを確認
2. `npx madge --circular Sources/` でSkill.js関連の循環が存在しないことを確認
3. Skill.jsのimport文を目視確認し、Layer 0-1のみであることを確認

## 対象ファイル一覧

| ファイル | 操作 | 内容 |
|----------|------|------|
| `Sources/Skill.js` | 修正 | 上位レイヤー依存の3関数を削除、Layer 2データモデルのみに絞り込み |
| `Tests/SkillSplit.test.js` | 新規 | 分割後のシンボル可用性・SkillInfoクラス動作・レイヤー制約テスト |
| 移動先ファイル（TBD） | 修正 | `canRallyForcibly`, `canRalliedForcibly`, `stealBonusEffects` の受け入れ |
| 呼び出し元ファイル群 | 修正 | 移動した関数のimport先を更新 |

## 移動対象関数の詳細

### `canRallyForcibly(skill, unit)` (行868-906)

Layer 5依存: `NodeEnv`, `CAN_RALLY_FORCIBLY_HOOKS`, `LoggerBase.LogLevel`

ロジック概要: FuncMapチェック -> SkillEffectHooksチェック -> switch文によるスキルID個別チェック

### `canRalliedForcibly(skillId, unit)` (行908-943)

Layer 5依存: `NodeEnv`, `CAN_RALLIED_FORCIBLY_HOOKS`, `getSkillLogLevel`

ロジック概要: `canRallyForcibly`と同構造

### `stealBonusEffects(enemies, targetUnit, targetAllies, logger)` (行1865-1902)

依存: `StatusEffectType`（Layer 1）、`getStatusEffectName`（Layer 1、現在は暗黙参照）、Unitインスタンスメソッド群

ロジック概要: 敵のポジティブステータス効果と強化を奪い、味方に付与する

## 注意事項

- `SkillInfo`コンストラクタ内の`g_appData`参照（行1676-1684）は`typeof g_appData !== 'undefined'`でガードされており、グローバル変数として参照している。セクション7（AppDataGlobal.js）完了後にESM importに変更される予定。この時点では変更不要
- `getSkillFunc`関数と全FuncMap群はSkill.jsに残す。これらはスキルIDからコールバックを引くための純粋なデータ構造であり、Layer 2の責務に該当する
- Skill.jsの行1904のTODOコメント（`// TODO: ここから下の内容を別ファイルに分ける`）は、FuncMap群の分離を示唆しているが、FuncMap群自体はLayer 0-1にのみ依存するMap初期化であり、現時点では移動不要

## 成功基準

1. Skill.jsのimport文がLayer 0-1（SkillConstants.js、GlobalDefinitions.js、StatusConstants.js）のみ
2. `NodeEnv`, `CAN_RALLY_FORCIBLY_HOOKS`, `CAN_RALLIED_FORCIBLY_HOOKS`, `LoggerBase`, `getSkillLogLevel` がSkill.js内に存在しない
3. `stealBonusEffects` がSkill.js内に存在しない
4. `npm test` で既存テスト500件が全パス
5. 分割後も全publicシンボルがいずれかのファイルからimport可能（後方互換）

## 実装結果

### 実施内容

- `Sources/SkillUtil.js` を新規作成、以下の関数を移動:
  - `canRallyForcibly` (Layer 5依存: NodeEnv, CAN_RALLY_FORCIBLY_HOOKS)
  - `canRalliedForcibly` (Layer 5依存: NodeEnv, CAN_RALLIED_FORCIBLY_HOOKS)
  - `canRallyForciblyByPlayer` (FuncMap依存)
  - `stealBonusEffects` (Unit型メソッド呼び出し、StatusEffectType依存)
- `Sources/Skill.js` の export 文から移動した関数を削除
- `vitest.setup.js` に `SkillUtil` を追加（Skill の直後）
- `Tests/SkillSplit.test.js` を新規作成（12テスト）

### 計画との差異

- `canRallyForciblyByPlayer` も追加で移動（計画では3関数のみだが、同じFuncMap依存パターンのため一緒に移動が妥当）
- caller 側の import 更新は未実施（concat mode で動作するため、section 8 で一括対応）
- SkillUtil.js は ESM import なし（グローバル参照、section 8 で追加予定）
- Skill.js からの re-export は追加せず（移動先が Layer 5 相当のため循環回避）

### 検証結果

- 527テスト全パス（DamageCalculator_HeroBattleTest のタイムアウトは既知の flaky test）
- `npx madge --circular Sources/` → 循環依存ゼロ
- Skill.js の import は Layer 0-1 のみ（SkillConstants.js, GlobalDefinitions.js, StatusConstants.js）