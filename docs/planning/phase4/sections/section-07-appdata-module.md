Now I have all the context needed. Let me produce the section content.

# Section 7: g_appData の専用モジュール化 (AppDataGlobal.js)

## 概要

グローバル変数 `g_appData` は 28 ファイル・計 654 箇所から参照されるシングルトンであり、現在は `Sources/AppData.js` 末尾で `const g_appData = new AppData()` として生成・export されている。しかし、大半のファイル（BattleSimulatorBase.js の 364 箇所を含む）は import 文を持たず、旧来のグローバルスコープ共有に依存している。

本セクションでは、g_appData を保持・提供する薄い専用モジュール `Sources/AppDataGlobal.js` を新設し、ESM の import/export で全ファイルから安全にアクセスできる基盤を構築する。

## 前提条件 (Dependencies)

- **Section 06 (remaining-cycles)** が完了していること -- 循環依存がゼロの状態であること
- g_appData を使用するファイルへの import 文追加自体は Section 08 (missing-imports) で行う。本セクションでは AppDataGlobal.js の新設と、AppData.js およびエントリーポイントの接続のみを行う

## 背景

### 現在の g_appData の状態

- **定義場所**: `Sources/AppData.js` 2508 行目 -- `const g_appData = new AppData();`
- **export**: `AppData.js` の末尾で named export されている
- **import している箇所**: エントリーポイント 4 ファイルのみ:
  - `Sources/ArenaSimulatorMain.js` -- `import { g_appData } from './AppData.js';`
  - `Sources/SummonerDuelsSimulatorMain.js` -- 同上
  - `Sources/DamageCalculatorMain.js` -- 同上
  - `Sources/UnitBuilderMain.js` -- 同上
- **import なしで参照しているファイル**: 24 ファイル（BattleSimulatorBase.js, Unit.js, BattleMap.js, SkillEffect.js, SkillImpl.js, Main_MouseAndTouch.js 等）

### テストコードでの g_appData

`Sources/TestUtilities.js` では g_appData をテスト用に差し替える処理がある:

```javascript
// resetGlobalTestState()
g_appData = new UnitManager();

// test_calcDamage()
g_appData = calclator.unitManager;
```

テストでは `g_appData` に `UnitManager` インスタンスを代入するパターンが使われている。AppDataGlobal.js の setter はこのパターンをサポートする必要がある。

### なぜ専用モジュールが必要か

`AppData.js` は 2,510 行の大規模ファイルであり、Layer 7 (App) に位置する。g_appData を参照する下位レイヤーのファイル（Unit.js: Layer 3、SkillEffect.js: Layer 5 等）が AppData.js を直接 import すると、Layer 制約（上位 -> 下位のみ参照可）に違反し、循環依存を再導入するリスクがある。

AppDataGlobal.js は依存ゼロ（Layer 0 相当）の薄いモジュールにすることで、どのレイヤーからも安全に import できる。

## テスト (Tests FIRST)

テストファイル: `Tests/AppDataGlobal.test.js`

### テストスタブ

```javascript
// Tests/AppDataGlobal.test.js
import { describe, it, expect } from 'vitest';
import { g_appData, setAppData } from '../Sources/AppDataGlobal.js';

describe('AppDataGlobal', () => {
    it('初期状態で g_appData が null', () => {
        // setAppData 呼び出し前の初期値を検証
    });

    it('setAppData(instance) 呼び出し後、g_appData が同じインスタンスを返す', () => {
        // const mockAppData = { name: 'test' };
        // setAppData(mockAppData);
        // expect(g_appData).toBe(mockAppData);
    });

    it('setAppData を複数回呼び出すと最後のインスタンスが保持される', () => {
        // const first = { id: 1 };
        // const second = { id: 2 };
        // setAppData(first);
        // setAppData(second);
        // expect(g_appData).toBe(second);
    });

    it('異なるモジュールから g_appData を import しても同じインスタンスが返る', () => {
        // ESM モジュールキャッシュにより、同一モジュールの export は
        // どこから import しても同一の binding を参照する。
        // 別のテストヘルパーから g_appData を import して同一性を検証。
    });
});
```

### 重要な設計上の注意: ESM live binding

`g_appData` を `export let` で宣言し、`setAppData()` で値を更新するパターンでは、**ESM の live binding** が機能する。import 側は常に最新の値を参照できる。ただし `import { g_appData }` した側で `g_appData` を直接代入することはできない（read-only binding）。値の更新は必ず `setAppData()` を経由する。

テストの 4 番目（シングルトン動作）は、Vitest が同一ワーカー内でモジュールキャッシュを共有することを利用して検証できる。2 つの異なるインポートパスから同じ binding が返ることを確認する。

### 回帰テスト

- 既存テスト 500 件が全パス: `npm run test:only`

## 実装

### Step 1: `Sources/AppDataGlobal.js` の新規作成

Layer 0 相当の薄いモジュール。外部依存ゼロ。

ファイルパス: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AppDataGlobal.js`

構造:

```javascript
// AppDataGlobal.js
// g_appData シングルトンを保持する専用モジュール。
// 依存ゼロ（Layer 0 相当）のため、どのレイヤーからも安全に import 可能。

export var g_appData;

export function setAppData(appData) {
    g_appData = appData;
}
```

要件:
- `export var` を使用する（ESM live binding + vitest.setup.js の concatenation 互換性のため。`var` は `vm.runInThisContext` でグローバル変数として巻き上げられる）
- 初期値は `undefined`（`null` ではない）。既存コードの `typeof g_appData !== 'undefined'` ガードとの整合性のため
- `setAppData` は型チェック不要（AppData インスタンスだけでなく UnitManager インスタンスもテストから渡される）
- 他のモジュールへの import/依存は一切持たないこと

### Step 2: `Sources/AppData.js` の修正

AppData.js 末尾の g_appData 生成と export を変更する。

修正前（2508-2510 行目）:
```javascript
const g_appData = new AppData();

export { AppData, ..., g_appData };
```

修正後:
```javascript
import { setAppData, g_appData } from './AppDataGlobal.js';

// AppData インスタンスを生成して AppDataGlobal に登録
const _appData = new AppData();
setAppData(_appData);

// 後方互換: g_appData を re-export する
export { AppData, ..., g_appData };
```

ポイント:
- `g_appData` は AppDataGlobal.js からの re-export に変更する。既存の `import { g_appData } from './AppData.js'` は引き続き動作する
- `AppDataGlobal.js` の import は AppData.js の**先頭**に追加する（他の import 文と並ぶ位置）
- `setAppData` の呼び出しはモジュールのトップレベルで行う（AppData クラス定義の後、export の前）

### Step 3: エントリーポイントの確認

以下の 4 ファイルは既に `import { g_appData } from './AppData.js'` を持っている。AppData.js が g_appData を re-export するため、変更不要:

- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulatorMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulatorMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculatorMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilderMain.js`

### Step 4: `Sources/HeroIconListerMain.js` の確認

このファイルは独自に `let g_appData = null;` を宣言し、ローカルで AppData を生成している（99-103 行目）。このファイルは AppDataGlobal.js パターンに移行するか、独自のローカル変数のまま残すか判断が必要。

推奨: HeroIconListerMain.js はエントリーポイント（Layer 8）であり、他のファイルから g_appData を参照される可能性は低い。ローカル変数のままで問題ないが、統一性のために AppDataGlobal.js の `setAppData` を使う形に修正しても良い。

### Step 5: `Sources/TestUtilities.js` の修正

TestUtilities.js では `g_appData = ...` で直接代入している（186, 324, 468, 482 行目）。ESM では import した binding に直接代入できないため、`setAppData()` に変更する必要がある。

修正対象箇所:
- 186 行目: `g_appData = calclator.unitManager;` -> `setAppData(calclator.unitManager);`
- 324 行目: `g_appData = new UnitManager();` -> `setAppData(new UnitManager());`
- 468 行目: `g_appData = calculator.unitManager;` -> `setAppData(calculator.unitManager);`
- 482 行目: `g_appData = handler.unitManager;` -> `setAppData(handler.unitManager);`

また、ファイル先頭の import に追加:
```javascript
import { setAppData } from './AppDataGlobal.js';
```

**注意**: TestUtilities.js は現在 vm.runInThisContext で評価されているため、この修正は Section 09 (test-esm-migration) と連携する。ただし、`setAppData` 関数は import なしでもグローバルスコープに露出していれば vm.runInThisContext 方式でも動作する。安全のため、本セクションでは TestUtilities.js に import 文を追加し、vm.runInThisContext 方式では import 行が正規表現で除去されることに依存する（既存の挙動と同じ）。

### Step 6: g_appData を参照する他の 24 ファイルへの import 追加について

g_appData を使用しているが import していないファイル（BattleSimulatorBase.js: 364 箇所、Main_MouseAndTouch.js: 31 箇所、etc.）への `import { g_appData } from './AppDataGlobal.js'` の追加は **Section 08 (missing-imports)** で行う。本セクションではモジュールの新設と既存接続の修正のみを行う。

## 修正対象ファイル一覧

| ファイル | 操作 | 内容 |
|----------|------|------|
| `Sources/AppDataGlobal.js` | 新規作成 | g_appData の保持・setter・export |
| `Sources/AppData.js` | 修正 | AppDataGlobal.js から import/setAppData、g_appData を re-export |
| `Sources/TestUtilities.js` | 修正 | `g_appData = ...` を `setAppData(...)` に変更、import 追加 |
| `vitest.setup.js` | 修正 | `SOURCE_FILE_NAMES` 先頭に `'AppDataGlobal'` を追加（concatenation 互換性） |
| `Tests/AppDataGlobal.test.js` | 新規作成 | AppDataGlobal のユニットテスト (4件) |

## 成功条件

1. `Sources/AppDataGlobal.js` が存在し、`g_appData` と `setAppData` を export している
2. `AppDataGlobal.js` は外部依存ゼロ（import 文なし）
3. `Sources/AppData.js` から `import { g_appData } from './AppData.js'` が引き続き動作する（re-export による後方互換）
4. `setAppData()` で設定した値が、どのファイルから `import { g_appData }` しても同じインスタンスとして取得できる
5. `Tests/AppDataGlobal.test.js` が全パス
6. 既存テスト 500 件が全パス: `npm run test:only`
7. `npx madge --circular Sources/` で新たな循環依存が導入されていない