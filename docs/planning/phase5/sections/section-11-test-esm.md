I have enough information to write the section now.

# Section 11: テストファイルのESM import化

## Overview

全テストファイル (`Tests/*.test.js`) を、`vitest.setup.js` の連結方式（`vm.runInThisContext`）によるグローバル変数参照から、ESM importに切り替える。また `Tests/TestGlobals.js` をESM化し、ESM Read-Only bindings対応も行う。

このセクションが完了すると、Section 12で連結方式を安全に廃止できる状態になる。

## Dependencies

- **Section 06-10**: 全ソースファイルに適切なESM import/exportが追加済みであること
- **Section 05**: 未エクスポートシンボルが全てexportされていること

## Background

### 現状のテスト実行の仕組み

`vitest.setup.js` が `vm.runInThisContext` で全ソースファイルを連結実行し、全シンボルをグローバルスコープに展開している。テストファイルは以下の2つの方法でシンボルにアクセスしている:

1. **ESM import** (Phase 4以降に追加されたもの): `import { UnitGroupType } from '../Sources/UnitConstants.js'` のように明示的にimport
2. **グローバル参照** (連結方式依存): `g_testHeroDatabase`, `UnitBuilder`, `BattleScenarioBuilder`, `test_DamageCalculator`, `resetGlobalTestState` 等をimportなしで直接参照

現在、多くのテストファイルは「一部はESM import + 残りはグローバル参照」というハイブリッド状態にある。

### `Tests/TestGlobals.js` の現状

```javascript
const g_testHeroDatabase = new test_HeroDatabase(
    heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
    passiveSInfos, passiveXInfos);

class test_UnitManager extends UnitManager {
    // ...
}
```

このファイルはESMではなく、連結実行で `heroInfos`, `weaponInfos` 等のグローバル変数に依存している。ESM化が必要。

### `Sources/TestUtilities.js` の現状

既にESM化済み。以下のシンボルをexportしている:
- `test_createDefaultSkillInfo`, `test_createDefaultUnit`, `test_HeroDatabase`, `test_BeginningOfTurnSkillHandler`, `test_DamageCalculator`
- `test_calcDamageWithUnits`, `test_calcDamage`, `UnitBuilder`, `BattleScenarioBuilder`, `RegressionTestHelper`
- `resetGlobalTestState`, `test_executeTest`

ただし `UnitBuilder.fromHero()` と `BattleScenarioBuilder.execute()` の内部で `g_testHeroDatabase` をグローバル参照している。ESM化後は `g_testHeroDatabase` をimportするかパラメータとして渡す必要がある。

## Tests (実装前に作成)

テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/TestEsmMigration.test.js`

```javascript
/**
 * Section 11: テストファイルのESM import化 検証テスト
 *
 * 全テストファイルがESM importを使用していること、
 * グローバル変数への暗黙依存がないことを静的に検証する。
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('テストファイルのESM import化検証', () => {
    const testsDir = path.resolve(process.cwd(), 'Tests');

    /** テストファイル一覧を取得 */
    function getTestFiles() {
        return fs.readdirSync(testsDir)
            .filter(f => f.endsWith('.test.js'))
            .map(f => path.join(testsDir, f));
    }

    it('全テストファイルにESM import文が存在する', () => {
        // 純粋にファイル構造のみをテストするファイル（fs/path以外のSource importが不要）は除外可能
        // ただし大半のテストはSource importが必要
        for (const file of getTestFiles()) {
            const content = fs.readFileSync(file, 'utf-8');
            const hasImport = /^import /m.test(content);
            expect(hasImport, `${path.basename(file)} should have ESM import statements`).toBe(true);
        }
    });

    it('テスト内でimportなしのグローバルシンボル参照がない', () => {
        // 連結方式でのみ提供されるシンボルがimportなしで参照されていないことを検証
        // g_testHeroDatabase, UnitBuilder, BattleScenarioBuilder, test_DamageCalculator,
        // resetGlobalTestState 等がimport文で取り込まれているか確認
        const globalSymbols = [
            'g_testHeroDatabase',
            'UnitBuilder',
            'BattleScenarioBuilder',
            'test_DamageCalculator',
            'test_BeginningOfTurnSkillHandler',
            'resetGlobalTestState',
            'test_executeTest',
            'test_UnitManager',
        ];

        for (const file of getTestFiles()) {
            const content = fs.readFileSync(file, 'utf-8');
            const basename = path.basename(file);
            for (const sym of globalSymbols) {
                const usageRegex = new RegExp(`\\b${sym}\\b`);
                if (usageRegex.test(content)) {
                    // このシンボルが使われている場合、import文にも存在するはず
                    const importRegex = new RegExp(`import.*\\b${sym}\\b.*from`);
                    expect(importRegex.test(content),
                        `${basename} uses '${sym}' but does not import it`).toBe(true);
                }
            }
        }
    });

    it('ESM Read-Only bindings違反がない（import対象変数の再代入なし）', () => {
        // import { x } from '...' した x に対して x = ... で再代入していないことを検証
        // ただし globalThis.g_appData = ... は許容（グローバルオブジェクトのプロパティ代入）
        // ここでは簡易チェック: import文で取り込んだ名前を収集し、直接再代入パターンを検出
        for (const file of getTestFiles()) {
            const content = fs.readFileSync(file, 'utf-8');
            const basename = path.basename(file);
            const importedNames = [];
            const importRegex = /^import\s+\{([^}]+)\}\s+from/gm;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop().trim());
                importedNames.push(...names);
            }
            for (const name of importedNames) {
                // Check for direct reassignment: name = (not ===, !==, <=, >=)
                const reassignRegex = new RegExp(`^\\s*${name}\\s*=[^=]`, 'm');
                expect(reassignRegex.test(content),
                    `${basename} reassigns imported binding '${name}'`).toBe(false);
            }
        }
    });
});
```

## Implementation

### Step 1: `Tests/TestGlobals.js` のESM化

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/TestGlobals.js`

現在このファイルは連結実行に依存し、`heroInfos`, `weaponInfos` 等をグローバルから参照している。ESM化する。

変更内容:
- `heroInfos` を `../Sources/SampleHeroInfos.js` からimport
- `weaponInfos`, `supportInfos`, `specialInfos`, `passiveAInfos`, `passiveBInfos`, `passiveCInfos`, `passiveSInfos`, `passiveXInfos` を `../Sources/SampleSkillInfos.js` からimport
- `test_HeroDatabase` を `../Sources/TestUtilities.js` からimport
- `UnitManager` を `../Sources/UnitManager.js` からimport
- `g_testHeroDatabase` と `test_UnitManager` をexport
- `initUnitSkillEffects` の呼び出しを追加（Section 10で対処済みのパターンに従う）

ESM化後のイメージ（スタブ）:
```javascript
import { heroInfos } from '../Sources/SampleHeroInfos.js';
import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveSInfos, passiveXInfos } from '../Sources/SampleSkillInfos.js';
import { test_HeroDatabase } from '../Sources/TestUtilities.js';
import { UnitManager } from '../Sources/UnitManager.js';

// SkillImpl*のスキル登録を実行するために必要なimport
// （具体的なimportはSection 09の結果に依存）
import '../Sources/SkillImpl.js';
import '../Sources/SkillImpl202408.js';
import '../Sources/SkillImpl202501.js';
import '../Sources/SkillImpl202601.js';

const g_testHeroDatabase = new test_HeroDatabase(
    heroInfos, weaponInfos, supportInfos, specialInfos,
    passiveAInfos, passiveBInfos, passiveCInfos, passiveSInfos, passiveXInfos);

class test_UnitManager extends UnitManager {
    *enumerateUnitsInSpecifiedGroup(groupId) {
        for (let unit of this.enumerateUnits()) {
            if (unit.groupId == groupId) {
                yield unit;
            }
        }
    }
}

export { g_testHeroDatabase, test_UnitManager };
```

**注意**: `initUnitSkillEffects(Unit)` の呼び出しが必要な場合がある。`vitest.setup.js` の連結コード末尾で `initUnitSkillEffects(Unit)` を実行しているが、ESM化後はこの呼び出しを `TestGlobals.js` または各テストのsetup内で行う必要がある。Section 10の `UnitSkillEffect.js` の対処結果に基づき、適切な場所に配置する。

### Step 2: `Sources/TestUtilities.js` の `g_testHeroDatabase` 依存の解消

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TestUtilities.js`

`UnitBuilder.fromHero()` (line 199) と他のメソッドで `g_testHeroDatabase` をグローバル参照している。ESM化後の選択肢:

**推奨アプローチ**: `g_testHeroDatabase` をモジュールスコープ変数として設定する関数を提供する。

```javascript
// TestUtilities.js に追加
let _heroDatabase = null;

export function setTestHeroDatabase(db) {
    _heroDatabase = db;
}

export function getTestHeroDatabase() {
    return _heroDatabase;
}
```

`UnitBuilder.fromHero()` 内の `g_testHeroDatabase` 参照を `getTestHeroDatabase()` に置き換える。

**代替アプローチ**: `TestGlobals.js` で `g_testHeroDatabase` を作成後、`setTestHeroDatabase()` を呼び出して登録する。テストファイルでは `getTestHeroDatabase()` をimportして使用する。

### Step 3: 各テストファイルにESM importを追加

全テストファイルを走査し、連結方式のグローバル参照をESM importに置き換える。

**対象ファイル一覧と必要な変更** (以下は主要な変更パターン):

#### パターンA: TestUtilitiesのシンボルが必要なファイル（約15ファイル）

`g_testHeroDatabase`, `UnitBuilder`, `BattleScenarioBuilder`, `test_DamageCalculator`, `resetGlobalTestState`, `test_executeTest`, `test_BeginningOfTurnSkillHandler` を使用しているファイル:

- `Tests/SmokeTest.test.js`
- `Tests/CombatFlow.test.js`
- `Tests/DamageCalculator.test.js`
- `Tests/DamageReduction.test.js`
- `Tests/FollowUpAttack.test.js`
- `Tests/SpecialCount.test.js`
- `Tests/StatusEffect.test.js`
- `Tests/SkillRegression.test.js`
- `Tests/TestHelper.test.js`
- `Tests/DslNode.test.js`
- `Tests/SkillEffect.test.js`
- `Tests/Performance.test.js`
- `Tests/BeginningOfTurnSkillHandler.test.js`
- `Tests/UnitManager.test.js`
- `Tests/GetRequirements.test.js`

各ファイルの先頭に以下の形式でimportを追加:

```javascript
import { UnitBuilder, BattleScenarioBuilder, resetGlobalTestState } from '../Sources/TestUtilities.js';
import { g_testHeroDatabase } from './TestGlobals.js';
```

使用しているシンボルに応じてimportを調整する。例えば:

- `test_DamageCalculator` を使用しているファイル: `import { test_DamageCalculator } from '../Sources/TestUtilities.js';`
- `test_BeginningOfTurnSkillHandler` を使用しているファイル: `import { test_BeginningOfTurnSkillHandler } from '../Sources/TestUtilities.js';`
- `test_executeTest` を使用しているファイル: `import { test_executeTest } from '../Sources/TestUtilities.js';`
- `test_UnitManager` を使用しているファイル: `import { test_UnitManager } from './TestGlobals.js';`

#### パターンB: SkillEffect DSLシンボルが必要なファイル

`UNIT`, `FOE`, `GRANTS_BONUS`, `AT_START_OF_COMBAT_HOOKS`, `DEALS_DAMAGE_X_NODE`, `SkillRequirement` 等を参照しているファイル:

- `Tests/SmokeTest.test.js` — `UNIT`, `FOE`, `GRANTS_BONUS`, `INFLICTS_PENALTY`, `DEALS_DAMAGE`, `REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY`, `IF_NODE`, `ATK_SPD`, `ATK_SPD_DEF_RES`, `AT_START_OF_COMBAT_HOOKS`, `AFTER_COMBAT_HOOKS`, `AT_START_OF_TURN_HOOKS`, `SkillEffectRegistrar`, `SkillEffectNode`, `SingleEffectNode`, `EffectsNode`, `TRUE_NODE`, `FALSE_NODE`
- `Tests/DslNode.test.js` — `DEALS_DAMAGE_X_NODE`, `AT_START_OF_COMBAT_HOOKS`, `MathUtil`
- `Tests/SkillEffect.test.js` — 多数のDSLシンボル
- `Tests/GetRequirements.test.js` — `UNIT`, `FOE`, `SkillRequirement`

これらのimport元は各シンボルの定義元ファイルに依存する（Section 06-10で完備済み）:
- `UNIT`, `FOE` → `../Sources/SkillEffect.js`（統合後）
- `GRANTS_BONUS`, `INFLICTS_PENALTY` 等のDSL関数 → `../Sources/SkillEffect.js` または `../Sources/SkillEffectAliases.js`
- `AT_START_OF_COMBAT_HOOKS` 等のフック → `../Sources/SkillEffectCore.js`
- `SkillRequirement` → `../Sources/SkillEffectCore.js` または定義元
- `MathUtil` → `../Sources/Utilities.js`

#### パターンC: その他のグローバルシンボル

- `WeaponRefinementType` → `../Sources/SkillConstants.js` (使用: Performance.test.js, BeginningOfTurnSkillHandler.test.js, DamageCalculator.test.js)
- `MoveType` → `../Sources/HeroInfoConstants.js` (使用: SmokeTest.test.js)
- `StatusType`, `SkillType`, `BlessingType`, `SeasonType` → 各定義元
- `using_`, `ScopedStopwatch` → `../Sources/Utilities.js` (使用: BeginningOfTurnSkillHandler.test.js)
- `Unit` → `../Sources/Unit.js` (使用: UnitManager.test.js, SmokeTest.test.js)
- `ObjectUtil` → `../Sources/Utilities.js` (使用: SimpleUtility.test.js)

#### パターンD: importなしのテストファイル

`Tests/SimpleUtility.test.js` は現在import文が一切なく、`ObjectUtil` をグローバルから参照している。ESM importを追加する:

```javascript
import { ObjectUtil } from '../Sources/Utilities.js';
```

### Step 4: ESM Read-Only bindings対応

Section 1の調査で特定された、import対象変数を上書きしているパターンへの対応。

**既知のパターン: `globalThis.g_appData = ...`**

多数のテストファイル（DslNode.test.js, DamageCalculator.test.js, SkillEffect.test.js, Performance.test.js, BeginningOfTurnSkillHandler.test.js, TestHelper.test.js）で `globalThis.g_appData = calculator.unitManager` のパターンが使用されている。

これは `g_appData` をESM importしたうえで再代入しているのではなく、`globalThis` のプロパティに代入しているため、Read-Only bindings違反にはならない。ただし `Sources/AppDataGlobal.js` が提供する `setAppData()` 関数を使用する方が安全:

```javascript
import { setAppData } from '../Sources/AppDataGlobal.js';

// Before:
globalThis.g_appData = calculator.unitManager;
// After:
setAppData(calculator.unitManager);
```

`TestUtilities.js` の `resetGlobalTestState()` と `BattleScenarioBuilder.execute()` は既に `setAppData()` を使用しているため、テストファイル内の直接 `globalThis.g_appData = ...` 代入も同様に `setAppData()` に統一する。

### Step 5: `vitest.setup.js` の過渡期対応

この段階では連結方式はまだ残す（Section 12で廃止）。ただし、ESM importが正しく動作することを確認するため:

1. 各テストファイルにimportを追加した後、`npm test` で全テストが引き続きパスすることを確認
2. ESM importとグローバル参照が衝突しないことを確認（同一シンボルがESM importとグローバルの両方から提供される場合、ESM importが優先される）

### Step 6: `vitest.setup.js` での `TestGlobals.js` の扱い

`vitest.setup.js` は現在 `TestGlobals.js` を連結対象に含めている（`TEST_UTIL_FILE_NAMES = ['TestGlobals']`）。ESM化後:

- `TestGlobals.js` をESMモジュールとしてテストファイルから直接importする
- `vitest.setup.js` の `TEST_UTIL_FILE_NAMES` からの連結は Section 12 で廃止するまで残す（過渡期）
- ただし `TestGlobals.js` がESM化されると `filterImportExport` で import/export 行が除去されてしまうため、連結方式との互換性に注意。必要に応じて `filterImportExport` の拡張か、`vitest.setup.js` 側で `TestGlobals.js` の連結をスキップする

## File Change Summary

| ファイル | 変更内容 |
|---------|---------|
| `Tests/TestGlobals.js` | ESM化: import追加、export追加 |
| `Sources/TestUtilities.js` | `g_testHeroDatabase` のグローバル参照を解消 (setter/getter追加) |
| `Tests/SmokeTest.test.js` | TestUtilities, TestGlobals, DSLシンボル等のimport追加 |
| `Tests/CombatFlow.test.js` | TestUtilities, TestGlobalsからのimport追加 |
| `Tests/DamageCalculator.test.js` | TestUtilities, TestGlobals, SkillConstants追加import |
| `Tests/DamageReduction.test.js` | TestUtilities, TestGlobalsからのimport追加 |
| `Tests/FollowUpAttack.test.js` | TestUtilities, TestGlobalsからのimport追加 |
| `Tests/SpecialCount.test.js` | TestUtilities, TestGlobalsからのimport追加 |
| `Tests/StatusEffect.test.js` | TestUtilities, TestGlobalsからのimport追加 |
| `Tests/SkillRegression.test.js` | TestUtilities, TestGlobalsからのimport追加 |
| `Tests/TestHelper.test.js` | TestUtilities, TestGlobals, AppDataGlobalからのimport追加 |
| `Tests/DslNode.test.js` | TestUtilities, TestGlobals, DSLシンボル追加import |
| `Tests/SkillEffect.test.js` | TestUtilities, TestGlobals, DSLシンボル追加import |
| `Tests/Performance.test.js` | TestUtilities, TestGlobals, SkillConstants追加import |
| `Tests/BeginningOfTurnSkillHandler.test.js` | TestUtilities, TestGlobals, Utilities追加import |
| `Tests/UnitManager.test.js` | TestGlobalsからのimport追加 |
| `Tests/GetRequirements.test.js` | DSLシンボル(UNIT, FOE, SkillRequirement)のimport追加 |
| `Tests/SimpleUtility.test.js` | ObjectUtilのimport追加 |
| `Tests/BuildFilter.test.js` | 変更不要（外部シンボル参照なし） |
| `vitest.setup.js` | TestGlobals.jsの連結スキップ（必要に応じて） |
| `Tests/TestEsmMigration.test.js` | 新規作成: ESM化の検証テスト |

## Verification

各ステップ完了後に以下を実行:

1. `npm test` で全テストがパスすること
2. ESM importの重複や不足がないこと（ReferenceError が出ないこと）
3. `TestEsmMigration.test.js` の3つの検証テストが全てパスすること

---

## Actual Implementation Results

### 変更されたファイル

| ファイル | 実際の変更内容 |
|---------|-------------|
| `Tests/TestGlobals.js` | ESM化: import追加、export追加、`initUnitSkillEffects(Unit)` 呼び出し、SkillImpl*.js side-effect import |
| `vitest.setup.js` | TestGlobals.jsの連結時に`filterImportExport`を適用 |
| `Tests/TestEsmMigration.test.js` | 新規作成: ESM化の検証テスト（3テスト） |
| `Tests/SmokeTest.test.js` | TestUtilities, TestGlobals, DSLシンボル, ソースクラス追加import |
| `Tests/CombatFlow.test.js` | TestUtilities + TestGlobals side-effect import |
| `Tests/DamageCalculator.test.js` | TestUtilities, TestGlobals, setAppData追加import |
| `Tests/DamageReduction.test.js` | TestUtilities + TestGlobals side-effect import |
| `Tests/FollowUpAttack.test.js` | TestUtilities + TestGlobals side-effect import |
| `Tests/SpecialCount.test.js` | TestUtilities + TestGlobals side-effect import |
| `Tests/StatusEffect.test.js` | TestUtilities + TestGlobals side-effect import |
| `Tests/SkillRegression.test.js` | TestUtilities, TestGlobals import |
| `Tests/TestHelper.test.js` | TestUtilities, UnitManager, AppDataGlobal, TestGlobals import |
| `Tests/DslNode.test.js` | TestUtilities, TestGlobals, DSLシンボル, setAppData追加import |
| `Tests/Performance.test.js` | TestUtilities, TestGlobals, SkillConstants, setAppData追加import |
| `Tests/BeginningOfTurnSkillHandler.test.js` | TestUtilities, TestGlobals, Utilities, SkillConstants, setAppData追加import |
| `Tests/UnitManager.test.js` | TestGlobals, Unit import追加 |
| `Tests/GetRequirements.test.js` | SkillEffectCore, SkillEffectUnit, SkillEffectBattleContext import追加 |
| `Tests/SimpleUtility.test.js` | ObjectUtil import追加 |
| `Tests/BuildFilter.test.js` | `import { describe, test, expect } from 'vitest'` 追加 |
| `Tests/VitestSetup.test.js` | `import { describe, test, expect } from 'vitest'` 追加 |
| `Tests/RemainingImports.test.js` | UnitBuilder, TestGlobals import追加 |

### 計画からの逸脱

1. **SkillEffect.test.js は除外**: DSLノード型同一性に強く依存しており、ESM/連結版のノードクラスが別インスタンスとなるため32テスト失敗する。Section 12（連結方式廃止）で一括対処する。
2. **vitest.setup.js**: TestGlobalsを連結リストから除外するのではなく、`filterImportExport`を適用して連結版との互換性を維持。ESM側は各テストファイルのimportで初期化。
3. **BuildFilter.test.js, VitestSetup.test.js**: 計画では「変更不要」だったが、検証テスト「全テストファイルにESM import文が存在する」を満たすために`import { describe, test, expect } from 'vitest'`を追加。

### テスト結果

- 641 passed, 2 failed (pre-existing: DamageCalculator_HeroBattleTest timeout, Performance threshold flakiness)
- TestEsmMigration.test.js: 3/3 passed