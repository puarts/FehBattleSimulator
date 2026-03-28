# Section 02: Init Dict Split -- スキル効果辞書初期化メソッドの分離

## 概要

DamageCalculatorWrapper.js から4つの辞書初期化メソッドを2つの新ファイルに分離する。これは Phase 2 に相当し、約7,900行をコアファイルから移動する最大のステップ。

**前提条件**: Section 01 (preparation) が完了していること。具体的には:
- `definePrototypeMethods` ヘルパーがコアファイルのクラス定義直後に追加済み
- `Tests/DamageCalculatorWrapperSplit.test.js` が作成済みで `create_tests.sh` に登録済み
- ベースラインテストが全パスしている状態

## 作成・変更するファイル

| ファイル | 操作 |
|---------|------|
| `Sources/combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` | **新規作成** |
| `Sources/combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit.js` | **新規作成** |
| `Sources/combat/DamageCalculatorWrapper.js` | **変更**: 4メソッドの本体を削除 |
| `create_tests.sh` | **変更**: `SOURCE_FILE_NAMES` に2ファイル追加 |
| `Deploy.bat` | **変更**: ファイル結合リストに2ファイル追加 |
| `Sources/ArenaSimulator.html` | **変更**: `loadScripts` に2ファイル追加 |
| `Sources/AetherRaidSimulator.html` | **変更**: `loadScripts` に2ファイル追加 |
| `Sources/SummonerDuelsSimulator.html` | **変更**: `loadScripts` に2ファイル追加 |
| `Sources/DamageCalculator.html` | **変更**: `loadScripts` に2ファイル追加 |
| `Sources/UnitBuilder.html` | **変更**: `loadScripts` に2ファイル追加 |
| `Tests/DamageCalculatorWrapperSplit.test.js` | **変更**: Phase 2 テスト追加 |

## テスト（先に作成）

`Tests/DamageCalculatorWrapperSplit.test.js` に以下のテストを追加する。既存の PerformanceProfile テストの後に続けて記述。

### テスト1: init メソッドの存在確認

分割後も4つの init メソッドがインスタンスメソッドとして呼び出し可能であることを確認する。`DamageCalculatorWrapper.prototype` 上にメソッドが存在するかをチェックする:

```javascript
describe('DamageCalculatorWrapper_InitSkillEffectDict split', () => {
    test('__init__applySkillEffectForAtkUnitFuncDict exists on prototype', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__init__applySkillEffectForAtkUnitFuncDict).toBe('function');
    });

    test('__init__applySkillEffectForDefUnitFuncDict exists on prototype', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__init__applySkillEffectForDefUnitFuncDict).toBe('function');
    });

    test('__init__applySkillEffectForUnitFuncDict exists on prototype', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__init__applySkillEffectForUnitFuncDict).toBe('function');
    });

    test('__init__applySpecialSkillEffect exists on prototype', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__init__applySpecialSkillEffect).toBe('function');
    });
});
```

### テスト2: 辞書初期化の正常動作

コンストラクタ完了後に各辞書にエントリが登録されていることを確認。テスト環境で `DamageCalculatorWrapper` のインスタンスを生成するには `TestBattleContext` ヘルパー（既存テストで使われているパターン）を利用する。既存テスト `DamageCalculator.test.js` のインスタンス生成パターンを参考に、最小構成でインスタンスを生成する:

```javascript
describe('DamageCalculatorWrapper dict initialization after split', () => {
    test('_applySkillEffectForAtkUnitFuncDict has entries after construction', () => {
        // 既存テストのBattleScenarioBuilderを使用してインスタンスを取得
        // dictのキー数が0より大きいことを確認
    });

    test('_applySkillEffectForDefUnitFuncDict has entries after construction', () => {
        // 同上
    });

    test('_applySkillEffectForUnitFuncDict has entries after construction', () => {
        // 同上
    });
});
```

注意: インスタンス生成の具体的な方法は既存テスト (`Tests/DamageCalculator.test.js`) のパターンを参照すること。`BattleScenarioBuilder` を使うか、直接 `new DamageCalculatorWrapper(...)` を呼ぶかは既存テストに合わせる。

### テスト3: 既存テスト全パス

新ファイル作成・ロード順序更新後に `./run_tests.sh` を実行し、全テスト + ESLint がパスすることを確認する。これは自動テストではなく手動実行の検証ステップ。

## 実装手順

### Step 1: 新ファイル `DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` の作成

ファイルパス: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js`

ファイル構造:

```javascript
if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    __init__applySkillEffectForAtkUnitFuncDict() {
        // line 1564-1861 の内容をそのまま移動
    },
    __init__applySkillEffectForDefUnitFuncDict() {
        // line 1863-2273 の内容をそのまま移動
    },
    __init__applySpecialSkillEffect() {
        // line 14853-15164 の内容をそのまま移動
    },
});
```

移動するメソッドの行範囲（`DamageCalculatorWrapper.js` 内）:
- `__init__applySkillEffectForAtkUnitFuncDict`: line 1564 ~ line 1861（メソッド定義行からクロージングブレースまで）
- `__init__applySkillEffectForDefUnitFuncDict`: line 1863 ~ line 2273
- `__init__applySpecialSkillEffect`: line 14853 ~ line 15164

**重要な注意事項**:
- 各メソッドの `let self = this;` はそのまま残す。prototype メソッドとして呼ばれた時に `this` は正しくインスタンスを参照するため変更不要
- メソッド内で `self.__isThereAllyInSpecifiedSpaces()` 等のユーティリティを呼んでいるが、これらはコアファイルのクラス定義内に残っているため prototype chain で解決される
- メソッド本体のインデントを調整する。class body 内の `    methodName() {` (4スペースインデント) から、`definePrototypeMethods` のオブジェクトリテラル内の `    methodName() {` (4スペースインデント) に変わる。メソッド本体のインデントは変更しない方が差分を最小化できる

### Step 2: 新ファイル `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js` の作成

ファイルパス: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit.js`

ファイル構造:

```javascript
if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    __init__applySkillEffectForUnitFuncDict() {
        // line 2559-9400 の内容をそのまま移動
    },
});
```

移動するメソッドの行範囲:
- `__init__applySkillEffectForUnitFuncDict`: line 2559 ~ line 9400（約6,842行の巨大メソッド）

このファイルは約6,900行となり5,000行の原則を超えるが、単一メソッドであるため分割不可。例外として許容する。

### Step 3: コアファイルからメソッド本体を削除

`/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/combat/DamageCalculatorWrapper.js` から以下の行範囲を削除する:

1. line 1564 ~ line 1861 (`__init__applySkillEffectForAtkUnitFuncDict` の定義全体)
2. line 1863 ~ line 2273 (`__init__applySkillEffectForDefUnitFuncDict` の定義全体)
3. line 2559 ~ line 9400 (`__init__applySkillEffectForUnitFuncDict` の定義全体)
4. line 14853 ~ line 15164 (`__init__applySpecialSkillEffect` の定義全体)

**削除しないもの**: コンストラクタ内の呼び出し（line 40-43）はそのまま残す:

```javascript
this.__init__applySkillEffectForAtkUnitFuncDict();
this.__init__applySkillEffectForDefUnitFuncDict();
this.__init__applySkillEffectForUnitFuncDict();
this.__init__applySpecialSkillEffect();
```

これらの呼び出しは、prototype chain を通じて分割ファイルのメソッドを参照する。

**削除の順序**: 行番号のずれを避けるため、後ろから削除する（14853-15164 → 2559-9400 → 1863-2273 → 1564-1861）。

### Step 4: ロード順序の更新

3つのロードシステムすべてで、`combat/DamageCalculatorWrapper` の直後に2つの新ファイルを追加する。

#### 4a: `create_tests.sh`

`SOURCE_FILE_NAMES` 配列内の `combat/DamageCalculatorWrapper` の直後に追加:

```
combat/DamageCalculatorWrapper
combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef
combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit
combat/BeginningOfTurnSkillHandler
```

#### 4b: `Deploy.bat`

line 21 の `combat\DamageCalculatorWrapper` の直後に追加。現在の行:

```
set BF=%BF%,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper
```

この行の末尾に追加するか、次の行として:

```
set BF=%BF%,combat\DamageCalculatorWrapper_InitSkillEffectDict_AtkDef,combat\DamageCalculatorWrapper_InitSkillEffectDict_Unit
```

#### 4c: HTML ファイル

`Grep` で `Sources/**/*.html` 内の `DamageCalculatorWrapper` 参照を検索し、全対象ファイルを実装時に確定する。既知の候補:

- `Sources/ArenaSimulator.html`
- `Sources/AetherRaidSimulator.html`
- `Sources/SummonerDuelsSimulator.html`
- `Sources/DamageCalculator.html`
- `Sources/UnitBuilder.html`

ただしこのリストは不完全な可能性がある。必ず検索ベースで全対象を確定すること。

追加するエントリ:

```javascript
"combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js",
"combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit.js",
```

各 HTML ファイルで `"combat/DamageCalculatorWrapper.js"` を検索し、その直後の行に挿入する。現在のパターン:

```javascript
"combat/ScopedTileChanger.js",
"combat/DamageCalculatorWrapper.js",
"combat/BeginningOfTurnSkillHandler.js",  // ← この前に挿入
```

### Step 5: テスト実行と検証

1. `./run_tests.sh` を実行し、全テスト + ESLint がパスすることを確認
2. 特に注目すべきテスト:
   - `DamageCalculator.test.js` 内の戦闘計算テスト（辞書初期化が正しく行われないと失敗する）
   - 新規追加した `FileSplit.test.js` 内の init メソッド存在確認テスト
3. ESLint エラーがないことを確認（特に未使用変数やスコープの問題）

## 技術的注意点

### `let self = this` パターンの安全性

4つの init メソッドはすべて冒頭で `let self = this;` を行い、内部のクロージャ（辞書に登録する関数）が `self` 経由でインスタンスメソッドを呼ぶ。prototype 拡張でメソッドを外部ファイルに移しても:

1. コンストラクタが `this.__init__applySkillEffectForAtkUnitFuncDict()` を呼ぶ
2. `this` はインスタンスを指す
3. メソッド内の `let self = this` で `self` にインスタンスが代入される
4. クロージャ内の `self.__isThereAllyInSpecifiedSpaces(...)` は正しくインスタンスメソッドを呼ぶ

よって動作に変更なし。

### `definePrototypeMethods` の重複検出

`definePrototypeMethods` ヘルパーは同名メソッドの二重登録時に `Error` をスローする。もしコアファイルからメソッド削除を忘れた場合、ロード時に即座にエラーが発生するため、安全ネットとして機能する。

### ロード順序の厳密性

新ファイルは `DamageCalculatorWrapper.js`（クラス定義 + `definePrototypeMethods` ヘルパー）の**直後**にロードする必要がある。`BeginningOfTurnSkillHandler.js` より**前**にロードする必要がある（`BeginningOfTurnSkillHandler` が `DamageCalculatorWrapper` のインスタンスを利用する可能性があるため）。

### コアファイルの行数変化

この Phase 完了後のコアファイル行数の見積もり:
- 削除される行数: 約 298 (AtkUnit) + 411 (DefUnit) + 6,842 (Unit) + 312 (Special) = 約 7,863 行
- 残りの行数: 17,141 - 7,863 = 約 9,278 行

## 実装結果

- コアファイル: 17,155行 → 9,292行（7,863行削除）
- AtkDefファイル: 1,031行（3メソッド）
- Unitファイル: 6,848行（1メソッド）
- コードレビューで修正: 末尾カンマのフォーマット修正、_applySpecialSkillEffectFuncDictのテスト追加
- テスト: 8新規テスト追加、全327テストパス