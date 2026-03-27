# Section 12 Research: vitest.setup.js 連結方式廃止

## Codebase Research

### 1. vitest.setup.js — 連結処理の詳細

**現在の処理フロー:**
1. `SOURCE_FILE_NAMES` に定義された33個のSourceファイル + `TEST_UTIL_FILE_NAMES` の1ファイル(TestGlobals)を読み込み
2. `filterImportExport(content)` で import/export 文をストリップ
3. `vm.Script` + `vm.runInThisContext()` でグローバルスコープに連結実行
4. 連結後に `initUnitSkillEffects(Unit)` を呼び出し

**連結対象ファイル一覧 (SOURCE_FILE_NAMES):**
```
AppDataGlobal, GlobalDefinitions, Utilities, GameUtilities, Logger,
SkillConstants, StatusConstants, Skill, SkillUtil,
BattleMapElement, Tile, Structures, Cell, Table,
HeroInfoConstants, HeroInfo, UnitConstants, BattleContext, UnitCore,
UnitBattle, UnitManager, BattleMap, GlobalBattleContext,
DamageCalculationUtility, DamageCalculator, PostCombatSkillHander,
DamageCalculatorWrapper, BeginningOfTurnSkillHandler, SkillDatabase,
HeroDatabase, SampleSkillInfos, SampleHeroInfos, SkillEffectCore,
SkillEffectEnv, SkillEffect, SkillEffectField, SkillEffectUnit,
SkillEffectBattleContext, SkillEffectHooks, UnitSkillEffect,
SkillEffectRegistrar, SkillEffectAliases, CustomSkill, SkillImpl,
SkillImpl202408, SkillImpl202501, SkillImpl202601, TestUtilities
```
TEST_UTIL_FILE_NAMES: `TestGlobals`

**filterImportExport() 関数:**
- import文（複数行importを含む）をストリップ
- export文およびexportキーワードプレフィックスを除去
- 連結されたコードがvm.Scriptコンテキストで実行可能にする

**非連結設定:** なし（vitest.config.jsで `globals: true, environment: 'jsdom'` を設定）

### 2. Tests/DamageCalculator.test.js — 唯一の未ESM化テスト

**現在のimport (2行のみ):**
```javascript
import { UnitGroupType } from '../Sources/UnitConstants.js';
import { PassiveA, PassiveC } from '../Sources/SkillConstants.js';
```

**コメントに明記された理由:**
```javascript
// Note: ESM TestUtilities/TestGlobals importなし。全英雄戦闘テスト(HeroBattleTest)で
// ESM/連結版ノード型混線が発生するため、連結版グローバルを使用する。
// Section 12で連結方式廃止後にESM化する。
```

**連結版グローバルとして参照している主要シンボル:**
- `g_testHeroDatabase` — 100回以上参照
- `test_DamageCalculator` — クラスとして使用
- `test_calcDamage()` — 関数として使用
- `test_createDefaultUnit()` — 関数として使用
- `Unit` — クラスとして使用
- `test_executeTest()` — テストラッパー関数

**テスト構造:**
- 約1016行、約47のdescribe/testブロック
- `DamageCalculator_HeroBattleTest` (1391回の全英雄戦闘テスト) が重要

### 3. Tests/TestGlobals.js — ESM化済みハブ

**imports:**
```javascript
import { heroInfos } from '../Sources/SampleHeroInfos.js';
import { weaponInfos, supportInfos, specialInfos, ... } from '../Sources/SampleSkillInfos.js';
import { test_HeroDatabase, setTestHeroDatabase } from '../Sources/TestUtilities.js';
import { UnitManager } from '../Sources/UnitManager.js';
import { Unit } from '../Sources/Unit.js';
import { initUnitSkillEffects } from '../Sources/UnitSkillEffect.js';
import '../Sources/SkillImpl.js';           // Side-effect imports
import '../Sources/SkillImpl202408.js';
import '../Sources/SkillImpl202501.js';
import '../Sources/SkillImpl202601.js';
```

**exports:**
```javascript
export { g_testHeroDatabase, test_UnitManager };
```

**初期化処理:**
```javascript
const g_testHeroDatabase = new test_HeroDatabase(...);
setTestHeroDatabase(g_testHeroDatabase);
initUnitSkillEffects(Unit);
```

### 4. Sources/TestUtilities.js — テストインフラ

**主要exports:**
```javascript
export {
    test_createDefaultSkillInfo, test_createDefaultUnit,
    test_HeroDatabase, test_BeginningOfTurnSkillHandler,
    test_DamageCalculator, test_calcDamageWithUnits, test_calcDamage,
    UnitBuilder, BattleScenarioBuilder, RegressionTestHelper,
    resetGlobalTestState, test_executeTest, setTestHeroDatabase
}
```

**依存注入パターン:**
```javascript
let _testHeroDatabase = null;
function setTestHeroDatabase(db) { _testHeroDatabase = db; }
```

### 5. vite.config.js — テスト設定

```javascript
test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    root: './',
    include: ['Tests/**/*.test.js'],
    exclude: ['**/All.test.js', '**/node_modules/**'],
    pool: 'threads',
    singleThread: true,
}
```

### 6. ESM化済みテストのimportパターン例 (CombatFlow.test.js)

```javascript
import { UnitGroupType } from '../Sources/UnitConstants.js';
import { Special, PassiveB, Weapon } from '../Sources/SkillConstants.js';
import { UnitBuilder, BattleScenarioBuilder, resetGlobalTestState } from '../Sources/TestUtilities.js';
import './TestGlobals.js';  // Side-effect import to initialize g_testHeroDatabase
```

### 7. ESM/連結 二重世界問題の詳細

- TestGlobals.js が SkillImpl*.js をESM importする
- vitest.setup.js が同じファイルを連結実行する
- SkillEffectNode クラスが2つのコンテキストに存在
- instanceof チェックが失敗: `TypeError: _targetNode.evaluate is not a function`
- DamageCalculator.test.js は連結版を使用して回避中

---

## Web Research

### Vitest Setup File ベストプラクティス

#### setupFiles vs globalSetup

| 特性 | setupFiles | globalSetup |
|---|---|---|
| スコープ | テストと同じプロセス | 別スコープ、ワーカー前 |
| 実行 | 各テストファイルの前 | 全テストの前に1回 |
| 変数アクセス | テストからグローバルにアクセス可能 | テストからアクセス不可 |
| 用途 | DOM stubs, グローバルmock, カスタムmatcher | DB起動、サーバー起動 |

**推奨: テストユーティリティやグローバル状態には `setupFiles` を使用**

#### setupFiles に入れるべきもの
- グローバルpolyfills/stubs（`vi.stubGlobal()`）
- DOM環境カスタマイズ
- 共有 `afterEach` クリーンアップ
- カスタムmatcher（`expect.extend(...)`）

#### setupFiles に入れるべきでないもの
- `vi.mock()` / `vi.hoisted()` — 個別テストファイルに配置
- テスト固有のモッキング
- 重い計算（ガード付きなら可）

### ESM Migration パターン

#### Chrome DevTools チームの2フェーズ戦略（約30,000行の移行実績）

**Phase 1: Export Phase（追加的、非破壊）**
- 全シンボルに `export` 文を追加
- レガシーのグローバルスコープ代入を並行維持

**Phase 2: Import Phase（参照の置換）**
- グローバル参照をESM importに体系的に置換
- 全消費者の移行後、レガシーのグローバル代入を除去

#### よくある落とし穴
1. **循環依存が可視化される** — 連結では隠れていた循環参照がESMでエラーに（※本プロジェクトでは解消済み）
2. **strict mode 強制** — ESMは常にstrict mode。未宣言変数等が壊れる
3. **モジュールキャッシュ** — ESMモジュールは初回import後にキャッシュされる
4. **ファイル拡張子の必須化** — `.js` 拡張子が必要
5. **vi.mock()のホイスティング制約** — setup fileではなくテストファイルに配置

#### 推奨: setup file の役割を縮小する
目標は各テストファイルでの明示的importであり、大きなsetup fileで全てをグローバル注入することではない。

Sources:
- https://vitest.dev/config/setupfiles
- https://developer.chrome.com/blog/migrating-to-js-modules
- https://vitest.dev/guide/improving-performance

---

## Testing

### 現在のテスト環境
- **フレームワーク:** Vitest
- **環境:** jsdom
- **テストファイル位置:** `Tests/**/*.test.js`
- **実行方法:** `npm run test:only` (vitest run), `npm test` (vitest + eslint)
- **テスト状況:** 52ファイル（51 ESM化済み、1 未ESM化）、642テスト通過、1失敗（Performance.test.js、環境依存）
- **設定:** `vite.config.js` の `test` セクション
- **実行モード:** `pool: 'threads'`, `singleThread: true`（共有グローバル状態のため）
