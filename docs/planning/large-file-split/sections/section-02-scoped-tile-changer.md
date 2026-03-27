Now I have all the context needed. Let me produce the section content.

# Section 02: ScopedTileChanger抽出

## 概要

`ScopedTileChanger`クラス（22行）を`Sources/combat/DamageCalculatorWrapper.js`の行30-52から`Sources/combat/ScopedTileChanger.js`に抽出する。タイル位置の一時変更とリストアを行うスコープ管理パターンの実装であり、DamageCalculatorWrapper固有のロジックではない。

## 依存関係

**前提**: section-01-performance-profile が完了していること。section-01により`PerformanceProfile`クラスがすでに`Sources/combat/PerformanceProfile.js`に抽出され、`create_tests.sh`・`Deploy.bat`・HTMLの3系統でDamageCalculatorWrapperの直前に配置されている状態を前提とする。

## テスト（実装前に作成）

テストファイル: `Tests/ScopedTileChanger.test.js`

テストは`create_tests.sh`の`TEST_FILE_NAMES`に追加する。

```javascript
// Test: ScopedTileChangerクラスがグローバルスコープに存在すること
// Test: DamageCalculatorWrapper内からScopedTileChangerが利用可能であること
// （既存のDamageCalculator.test.jsのダメージ計算テストが全パスすることで間接検証）
```

具体的なテストスタブ:

```javascript
describe('ScopedTileChanger', () => {
    test('ScopedTileChangerクラスがグローバルスコープに存在する', () => {
        expect(typeof ScopedTileChanger).toBe('function');
    });

    test('DamageCalculatorWrapper内からScopedTileChangerが利用可能である', () => {
        // DamageCalculatorWrapperのソースコード内でScopedTileChangerを
        // new ScopedTileChanger(...)として使用しており、
        // 既存のダメージ計算テストが全パスすることで間接的に検証される
        expect(typeof ScopedTileChanger).toBe('function');
    });
});
```

加えて、既存の`DamageCalculator.test.js`が全パスすることが主要な回帰検証手段となる。

## 事前チェック

実装前に以下を確認する:

### 1. ScopedTileChangerの全非ローカル参照の列挙

抽出対象コード（DamageCalculatorWrapper.js 行30-52）を確認すると、以下の外部シンボルを参照している:

- **`Unit`** — JSDocコメント内の型アノテーション（`@param {Unit} atkUnit`）。実行時には`atkUnit.placedTile`プロパティへのアクセスとして使用
- **`Tile`** — JSDocコメント内の型アノテーション（`@param {Tile} tileToAttack`）
- **`setUnitToTile()`** — `dispose()`メソッド内で呼び出すグローバル関数

### 2. 重複定義の確認

リポジトリ全体で`class ScopedTileChanger`を検索し、`Sources/combat/DamageCalculatorWrapper.js`の1箇所のみであることを確認する。

### 3. setUnitToTileの定義ファイルとロード順序の確認

`setUnitToTile()`は`Sources/map/Tile.js`（行88）に`function`宣言として定義されている。`Tile.js`は全HTMLの`loadScripts`で`DamageCalculatorWrapper.js`より前にロードされている。したがって、`ScopedTileChanger.js`をDamageCalculatorWrapperの直前に配置すれば`setUnitToTile`は利用可能。

### 4. ScopedTileChangerの使用箇所の確認

DamageCalculatorWrapper.js内部（行336付近）で`using_(new ScopedTileChanger(...))`として使用されている。これは実行時の呼び出しなので、ScopedTileChangerがDamageCalculatorWrapperより前にロードされていれば問題ない。

## 実装手順

### Step 1: 新規ファイル作成

**ファイル**: `Sources/combat/ScopedTileChanger.js`

DamageCalculatorWrapper.jsの行30-52のコードをそのまま移動する。ファイル先頭に`/* global setUnitToTile */` のESLintグローバル宣言を追加する（`Unit`と`Tile`はJSDocのみで実行時参照ではないが、ESLintの設定によっては必要になる場合がある — `run_tests.sh`の結果で判断）。

移動対象のコードは以下の構造:

```javascript
/* global setUnitToTile */

class ScopedTileChanger {
    /**
     * @param {Unit} atkUnit
     * @param {Tile} tileToAttack
     * @param {Function} tileChangedFunc=null
     */
    constructor(atkUnit, tileToAttack, tileChangedFunc = null) {
        // ... (元コードをそのまま移動、変更禁止)
    }

    dispose() {
        // ... (元コードをそのまま移動、変更禁止)
    }
}
```

コードの内容を一切変更してはならない（typo修正・整形・改行変更も禁止）。

### Step 2: DamageCalculatorWrapper.jsから削除

DamageCalculatorWrapper.jsの行30-52（`class ScopedTileChanger { ... }`の全体）を削除する。行間の空行も含めて、PerformanceProfile削除後の状態に応じて適切に削除する。

**注意**: section-01完了後の状態では、PerformanceProfileがすでに削除されているため、行番号はオリジナルとずれている可能性がある。実際のファイル内容を確認して`class ScopedTileChanger`の開始位置を特定すること。

### Step 3: ロード順序の更新（3系統）

3系統すべてで、ScopedTileChanger.jsをPerformanceProfile.jsの後、DamageCalculatorWrapper.jsの前に配置する。

#### create_tests.sh

`SOURCE_FILE_NAMES`配列で、`combat/PerformanceProfile`の後、`combat/DamageCalculatorWrapper`の前に`combat/ScopedTileChanger`を追加する。

section-01完了後の状態では以下のようになっているはず:

```
    combat/PerformanceProfile
    combat/DamageCalculationUtility
    combat/DamageCalculator
    combat/PostCombatSkillHander
    combat/DamageCalculatorWrapper
```

ここに`combat/ScopedTileChanger`をDamageCalculatorWrapperの直前に追加:

```
    combat/PerformanceProfile
    combat/ScopedTileChanger
    combat/DamageCalculationUtility
    combat/DamageCalculator
    combat/PostCombatSkillHander
    combat/DamageCalculatorWrapper
```

**注意**: PerformanceProfileの直後でもDamageCalculatorWrapperの直前でも依存関係上は問題ないが、section-01でPerformanceProfileがDamageCalculatorWrapperの直前に配置されている場合は、PerformanceProfileの直後（= 同じくDamageCalculatorWrapperの直前エリア）に配置する。元のDamageCalculatorWrapper.js内での定義順序（PerformanceProfile → ScopedTileChanger → DamageCalculatorWrapper）を反映する。

#### Deploy.bat

`set BF=%BF%,...`行で、DamageCalculatorWrapperの前に`combat\ScopedTileChanger`を追加する。section-01完了後の状態に応じて、PerformanceProfileの後に配置する。

#### HTMLファイル（5ファイル）

以下の5つのHTMLファイルの`loadScripts`配列で、DamageCalculatorWrapperの前にScopedTileChangerを追加する:

- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilder.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AetherRaidSimulator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulator.html`

エントリの形式は既存に合わせる（例: `"combat/ScopedTileChanger.js",`）。

`HeroStatusClusterer.html`と`StatusCalculator.html`はDamageCalculatorWrapper.jsを読み込んでいないため、更新不要。

### Step 4: テストファイルの登録

`create_tests.sh`の`TEST_FILE_NAMES`配列に`ScopedTileChanger`テストファイルを追加する。

### Step 5: 3系統の相対順序一致確認

3系統（create_tests.sh、Deploy.bat、HTML）すべてで、以下の相対順序が一致していることを目視確認する:

```
... → PerformanceProfile → ScopedTileChanger → ... → DamageCalculatorWrapper → ...
```

### Step 6: 検証

1. `./run_tests.sh` を実行し、全テスト + ESLintがパスすることを確認
2. ブラウザsmoke check: DamageCalculator.htmlを読み込み、ダメージ計算を1回実行し、コンソールエラーがないことを確認

## コミット

メッセージ: `refactor(combat): ScopedTileChangerをDamageCalculatorWrapperから独立ファイルに分離`

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `Sources/combat/ScopedTileChanger.js` | 新規作成（ScopedTileChangerクラス、~22行 + ESLintコメント） |
| `Sources/combat/DamageCalculatorWrapper.js` | ScopedTileChangerクラス定義を削除 |
| `create_tests.sh` | SOURCE_FILE_NAMESにScopedTileChanger追加 |
| `Deploy.bat` | 結合リストにScopedTileChanger追加 |
| `Sources/ArenaSimulator.html` | loadScriptsにScopedTileChanger追加 |
| `Sources/DamageCalculator.html` | loadScriptsにScopedTileChanger追加 |
| `Sources/UnitBuilder.html` | loadScriptsにScopedTileChanger追加 |
| `Sources/AetherRaidSimulator.html` | loadScriptsにScopedTileChanger追加 |
| `Sources/SummonerDuelsSimulator.html` | loadScriptsにScopedTileChanger追加 |
| `Tests/ScopedTileChanger.test.js` | 新規作成（テストスタブ） |

## ロジック変更禁止の再確認

本ステップでは以下のみが許可される:

- ScopedTileChangerクラスのDamageCalculatorWrapper.jsからScopedTileChanger.jsへの物理的な移動
- `/* global ... */` ESLintコメントの追加
- ロード順序リスト（create_tests.sh, Deploy.bat, HTML）の更新
- 移動元からのコード削除

typo修正、コード整形、ロジック変更は一切禁止。