# Section 02: UnitBuilder クラスの実装

## 概要

テスト用ユニットを宣言的に構築するためのフルーエントAPIビルダー `UnitBuilder` と、グローバル状態管理関数 `resetGlobalTestState()`、リグレッションテストヘルパー `RegressionTestHelper` を実装する。これらはすべて `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TestUtilities.js` に追加する。

## 依存関係

- **section-01-test-split** が完了していること（`Tests/TestHelper.test.js` が `create_tests.sh` の `TEST_FILE_NAMES` に登録済み、infra カテゴリでフィルタリング可能）

## 背景

### 現在のテスト用ユニット生成方式

既存のテストでは以下の方法でユニットを生成している:

- `g_testHeroDatabase.createUnit("アルフォンス")` — 英雄名からユニット生成。内部で `test_createDefaultUnit` を呼び、`initUnit` で英雄情報を適用
- `test_createDefaultUnit(groupId)` — デフォルトユニット生成（HP40, Atk40, Spd40, Def30, Res30, 銀の剣+）
- その後、`unit.atkWithSkills = 40` のようにプロパティを直接設定

この方式の問題点:
1. ユニット設定が冗長で読みづらい
2. 英雄ベースステータスの変更でテストが壊れる
3. スキル設定後のステータス再計算を手動で呼ぶ必要がある

### 既存のグローバル状態

- `g_appData` — テスト中に `test_DamageCalculator` の `unitManager` が代入される。テスト間で漏洩しやすい
- `g_testHeroDatabase` — `Tests/TestGlobals.js` で生成。読み取り専用のため、リセット不要

### 既存のヘルパークラス (参考)

`/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TestUtilities.js` に以下が定義済み:

- `test_createDefaultUnit(groupId)` — デフォルトユニット生成
- `test_HeroDatabase` — `HeroDatabase` を拡張、`createUnit(heroName, groupId)` と `updateUnitSkillInfo(unit)` を提供
- `test_DamageCalculator` — `DamageCalculatorWrapper` のテスト用ラッパー
- `test_BeginningOfTurnSkillHandler` — ターン開始処理のテスト用ラッパー
- `test_calcDamage(atkUnit, defUnit)` — 簡易戦闘計算関数。内部で `g_appData = calclator.unitManager` を設定

## テスト（Tests/TestHelper.test.js）

テストファイル `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/TestHelper.test.js` を新規作成する。以下のテストスタブを実装する。

### UnitBuilder テスト

```javascript
describe('UnitBuilder', () => {
    test('fromHero creates a valid unit from hero name', () => {
        // UnitBuilder.fromHero('マルス') で有効なユニットが生成される
        // unit.heroInfo が null でないこと、weapon が設定されていること等を検証
    });

    test('default creates a default unit', () => {
        // UnitBuilder.default() でデフォルトユニットが生成される
        // test_createDefaultUnit と同等の結果であること
    });

    test('createDummy creates a unit with all stats at 50', () => {
        // UnitBuilder.createDummy(UnitGroupType.Ally) で全ステータス50のユニットが生成される
        // hp=50, atk=50, spd=50, def=50, res=50
    });

    test('createDummy with custom stats', () => {
        // createDummy(groupId, {hp:99, atk:60, spd:40, def:30, res:20})
        // 指定したステータスで生成されること
    });

    test('withWeapon recalculates stats after setting skill', () => {
        // withWeapon(weaponId) 後にステータスが再計算されること
        // updateUnitSkillInfo が呼ばれていることを間接的に検証
    });

    test('withStats overrides stats', () => {
        // withStats({atk:99}) で攻撃が99に上書きされること
        // 未指定のステータスは変更されないこと
    });

    test('withHpPercent sets HP to percentage of max HP', () => {
        // withHpPercent(50) で HP が maxHpWithSkills の 50% に設定されること
    });

    test('withSpecialCount sets special count', () => {
        // withSpecialCount(0) で奥義カウントが0になること
    });

    test('withBonuses applies buffs', () => {
        // withBonuses({atk:6}) で atkBuff が 6 になること
    });

    test('withPenalties applies debuffs', () => {
        // withPenalties({spd:-7}) で spdDebuff が -7 になること
    });

    test('atPosition sets tile position', () => {
        // atPosition(3,4) で posX=3, posY=4 になること
    });

    test('method chaining works correctly', () => {
        // UnitBuilder.fromHero('マルス').withWeapon(weaponId).withStats({atk:50}).atPosition(1,2).build()
        // 全設定が反映されたユニットが返ること
    });
});
```

### グローバル状態管理テスト

```javascript
describe('Global state management', () => {
    test('resetGlobalTestState sets g_appData to null', () => {
        // g_appData に値を設定後、resetGlobalTestState() を呼び、null になることを検証
    });

    test('separate execute calls do not affect each other', () => {
        // 注: BattleScenarioBuilder は section-03 で実装するため、
        // ここでは test_calcDamage を使って g_appData の汚染がリセットで解消されることを検証
    });
});
```

### RegressionTestHelper テスト

```javascript
describe('RegressionTestHelper', () => {
    test('extractCombatSnapshot extracts key values from combat result', () => {
        // 戦闘結果オブジェクトから HP, ダメージ等の主要値を抽出
        // 返り値オブジェクトに atkUnit_normalAttackDamage, restHp 等が含まれること
    });

    test('extractUnitSnapshot extracts unit status', () => {
        // ユニットのステータス・状態をスナップショットとして取得
        // hp, atk, spd, def, res, buffs, debuffs 等が含まれること
    });
});
```

## 実装詳細

### ファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TestUtilities.js`

既存ファイルの末尾に以下のクラス・関数を追加する。

### 1. UnitBuilder クラス

フルーエントAPI（メソッドチェーン）でテスト用ユニットを構築するビルダー。

**API設計**:

```javascript
class UnitBuilder {
    /** 英雄名からユニット生成を開始 */
    static fromHero(heroName, groupId = UnitGroupType.Ally)

    /** デフォルトユニットから開始（test_createDefaultUnit ラッパー） */
    static default(groupId = UnitGroupType.Ally)

    /**
     * 固定ステータスのダミーユニット生成。
     * スキルロジックテストの標準。英雄ベースステータス変更の影響を受けない。
     * @param {UnitGroupType} groupId
     * @param {{hp?:number, atk?:number, spd?:number, def?:number, res?:number}} stats - デフォルト全50
     */
    static createDummy(groupId = UnitGroupType.Ally, stats = {})

    // ステータス設定（部分上書き可能）
    withStats({ hp, atk, spd, def, res })
    withAtk(value)
    withSpd(value)
    withDef(value)
    withRes(value)

    // スキル設定（設定後に updateUnitSkillInfo を呼ぶ）
    withWeapon(weaponId)
    withSupport(supportId)
    withSpecial(specialId)
    withPassiveA(passiveAId)
    withPassiveB(passiveBId)
    withPassiveC(passiveCId)
    withPassiveS(passiveSId)
    withPassiveX(passiveXId)

    // 位置設定
    atPosition(x, y)

    // 状態設定
    withHpPercent(percent)
    withSpecialCount(count)
    withBonuses({ atk, spd, def, res })
    withPenalties({ atk, spd, def, res })

    // 構築完了
    build()  // → Unit
}
```

**内部実装のポイント**:

- コンストラクタは `unit` インスタンスと設定キューを保持
- `fromHero` は内部で `g_testHeroDatabase.createUnit(heroName, groupId)` を呼ぶ
- `default` は `test_createDefaultUnit(groupId)` をラップ
- `createDummy` は `test_createDefaultUnit(groupId)` をベースにステータスを上書き。デフォルト値は `{hp:50, atk:50, spd:50, def:50, res:50}`
- スキル設定メソッド（`withWeapon` 等）は、スキルIDをユニットのプロパティに設定後、`g_testHeroDatabase.updateUnitSkillInfo(unit)` を呼び出してステータスを再計算する
- `withStats` はスキル計算後のステータスを直接上書きする。スキル設定より後に呼ぶことで意図したステータスを確定できる
- `withHpPercent(percent)` は `unit.hp = Math.floor(unit.maxHpWithSkills * percent / 100)` で設定
- `withBonuses` は `unit.atkBuff`, `unit.spdBuff` 等に値を設定
- `withPenalties` は `unit.atkDebuff`, `unit.spdDebuff` 等に値を設定
- `atPosition` は `unit.placedTile.posX` と `unit.placedTile.posY` を設定
- `build()` は構築済みの `unit` をそのまま返す（遅延適用ではなく、各メソッドで即時適用する方式）
- 全 setter メソッドは `return this` でメソッドチェーンをサポート

**createDummy の詳細設計**:

`createDummy` は英雄データに依存しないテスト用ユニットを生成する。これにより、英雄のベースステータスが本体側で変更されてもテストが壊れない。

```javascript
static createDummy(groupId = UnitGroupType.Ally, { hp = 50, atk = 50, spd = 50, def = 50, res = 50 } = {}) {
    let builder = new UnitBuilder();
    builder._unit = test_createDefaultUnit(groupId);
    builder._unit.maxHpWithSkills = hp;
    builder._unit.hp = hp;
    builder._unit.atkWithSkills = atk;
    builder._unit.spdWithSkills = spd;
    builder._unit.defWithSkills = def;
    builder._unit.resWithSkills = res;
    builder._unit.saveCurrentHpAndSpecialCount();
    return builder;
}
```

### 2. resetGlobalTestState 関数

```javascript
/**
 * テスト間のグローバル状態汚染を防ぐリセット関数。
 * 各テストファイルの beforeEach で使用する。
 */
function resetGlobalTestState() {
    g_appData = null;
    // 将来的にテスト中に変更されるグローバル変数が判明した場合、ここに追加
}
```

**使用パターン**: 新規テストファイルでは `beforeEach(() => resetGlobalTestState())` を記述する。既存テストは変更不要。

### 3. RegressionTestHelper クラス

```javascript
class RegressionTestHelper {
    /**
     * 戦闘結果から検証対象の主要値を抽出する。
     * @param {Object} combatResult - test_DamageCalculator.calcDamage() の戻り値
     * @returns {Object} スナップショットオブジェクト
     */
    static extractCombatSnapshot(combatResult) {
        // combatResult から以下を抽出:
        // - atkUnit_normalAttackDamage (通常攻撃ダメージ)
        // - defUnit_normalAttackDamage (反撃ダメージ)
        // - atkUnit のrestHp (攻撃側残HP)
        // - defUnit のrestHp (防御側残HP)
        // - 追撃の有無
        // - 奥義発動の有無
    }

    /**
     * ユニットの現在ステータス・状態をスナップショットとして取得。
     * @param {Unit} unit
     * @returns {Object}
     */
    static extractUnitSnapshot(unit) {
        // 以下を抽出:
        // - hp, maxHpWithSkills
        // - atkWithSkills, spdWithSkills, defWithSkills, resWithSkills
        // - バフ (atkBuff, spdBuff, defBuff, resBuff)
        // - デバフ (atkDebuff, spdDebuff, defDebuff, resDebuff)
        // - specialCount
        // - 位置 (posX, posY)
    }
}
```

**抽出対象プロパティの決定方針**: 既存テストで `expect` されているプロパティ（`atkUnit_normalAttackDamage`, `restHp` 等）を中心に、戦闘結果オブジェクトの主要フィールドを返す。具体的なプロパティ名は `DamageCalculatorWrapper.calcDamage()` の戻り値を調査して決定する。

## 検証手順

実装完了後、以下で検証する:

```bash
./run_tests.sh infra
```

section-01 のテスト分割が完了していない場合は:

```bash
./run_tests.sh
```

`TestHelper.test.js` の全テストが PASS すれば完了。

## 実装結果

### 計画からの差異

- `resetGlobalTestState()`: `g_appData = null` → `g_appData = new UnitManager()` に変更。SkillInfoコンストラクタが `g_appData.isDebugMenuEnabled` にアクセスするため null だと NPE が発生する
- `build()` で `saveCurrentHpAndSpecialCount()` を呼び出すよう追加。restHpスナップショットの整合性を保証
- `extractCombatSnapshot` に `totalAttackCount`, `preCombatDamage` フィールドを追加（追撃回数検出用）
- `withHp(value)` メソッドを追加（withAtk/withSpd等と一貫したAPI）
- `withHpPercent` テストは `Math.floor` で期待値を計算する形に調整（maxHpWithSkills の getter が hpMult を含む計算を行うため）

### テスト結果

- infra カテゴリ: 22テスト全パス
- 全テスト: 212テスト全パス（既存188 + section-01 プレースホルダ9 + section-02 UnitBuilder/状態管理/Regression 15）