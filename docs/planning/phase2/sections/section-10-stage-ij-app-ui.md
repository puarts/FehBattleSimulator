# Section 10: Stage I/J -- App Layer, UI, and Entry Points ESM Conversion

> **実装済み** — 全18ファイルにexport文追加、TestUtilities.jsにimport文追加、全310テストパス

**計画との差異:**
- 非テストファイル（17ファイル）にはexport文のみ追加し、import文は追加しなかった。理由: これらのファイルはcreate_tests.shに含まれておらず、現在のビルドモードではimport/exportが除去されるため、import追加は実行時効果がない。Phase 3（Vite/ネイティブESM移行）で追加予定
- TestUtilities.js（唯一のテスト対象ファイル）にはimport/export両方を追加

## Overview

This section covers the ESM conversion of the application layer (Stage I), UI and entry point files (Stage J), and test utilities (Stage K). These are the highest-level files in the dependency graph and are converted last before final validation.

**Files in scope (18 files total):**

**Stage I -- App Layer (3 files):**
- `Sources/AppData.js`
- `Sources/SettingManager.js`
- `Sources/AetherRaidDefensePresets.js`

**Stage J -- UI and Entry Points (13 files):**
- `Sources/Main_ImageProcessing.js`
- `Sources/Main_OriginalAi.js`
- `Sources/Main_MouseAndTouch.js`
- `Sources/KeyRepeatHandler.js`
- `Sources/BattleSimulatorBase.js`
- `Sources/VueComponents.js`
- `Sources/ArenaSimulatorMain.js`
- `Sources/AetherRaidSimulatorMain.js`
- `Sources/SummonerDuelsSimulatorMain.js`
- `Sources/UnitBuilderMain.js`
- `Sources/StatusCalcMain.js`
- `Sources/DamageCalculatorMain.js`
- `Sources/HeroIconListerMain.js`

**Stage K -- Test Utilities (1 file):**
- `Sources/TestUtilities.js`

**Note:** `TestUtilities.js` is located in `Sources/` (not `Tests/`), as it is concatenated as a source file in `create_tests.sh`.

## Dependencies

This section depends on the completion of:
- **section-07-stage-f-core** (Unit, BattleMap, UnitManager, BattleContext, GlobalBattleContext)
- **section-08-stage-g-skill-impl** (SkillImpl files, CustomSkill)
- **section-09-stage-h-combat** (DamageCalculator, DamageCalculatorWrapper, BeginningOfTurnSkillHandler, PostCombatSkillHander)

All imports from those stages must already be in place and working before this section begins.

## Tests

Tests for this section verify that the ESM conversion does not break any existing functionality. No new test files are created -- the existing test suite serves as the regression check.

### Test expectations (verify after each file conversion)

```
# Test: AppData conversion -- full test suite passes (./run_tests.sh)
# Test: SettingManager conversion -- full test suite passes
# Test: BattleSimulatorBase conversion -- full test suite passes
# Test: TestUtilities.js conversion -- UnitBuilder / BattleScenarioBuilder still work correctly
# Test: All 305+ tests and smoke tests pass after all files in this section are converted
```

After converting each file, run `./run_tests.sh` to confirm no regressions.

## Implementation Details

### Coding Rules (recap from plan)

- All `import` and `export` statements must be on a **single line** (no multi-line imports/exports)
- Use **trailing aggregate `export { ... };`** at the end of each file -- never inline `export class` or `export function`
- `import` statements go at the **top** of the file
- External libraries (Vue, jQuery, Select2) are **not** imported via ESM -- they remain global. Use `/* global Vue, jQuery */` comments for ESLint if needed

### Conversion Order

Convert files in the following order to minimize risk (leaf dependencies first):

1. **KeyRepeatHandler.js** -- no dependencies on other app-layer files
2. **Main_ImageProcessing.js** -- no JS dependencies (uses browser DOM APIs only)
3. **AetherRaidDefensePresets.js** -- depends on SkillConstants, HeroInfoConstants
4. **AppData.js** -- depends on UnitManager, SettingManager (will be a forward reference), GlobalBattleContext, BattleMap, SkillDatabase, HeroDatabase, AudioManager, etc.
5. **SettingManager.js** -- depends on AppData, Unit, TurnSetting
6. **Main_OriginalAi.js** -- depends on Unit, DamageCalculator, BattleMap
7. **BattleSimulatorBase.js** -- depends on AppData, DamageCalculatorWrapper, BeginningOfTurnSkillHandler, and many others
8. **Main_MouseAndTouch.js** -- depends on BattleSimulatorBase
9. **VueComponents.js** -- depends on BattleSimulatorBase, AppData
10. **DamageCalculatorMain.js** -- depends on DamageCalculator, AppData
11. **HeroIconListerMain.js** -- depends on HeroDatabase (defines its own local AppData class)
12. **UnitBuilderMain.js** -- depends on BattleSimulatorBase
13. **StatusCalcMain.js** -- depends on AppData, Unit
14. **ArenaSimulatorMain.js** -- depends on BattleSimulatorBase
15. **AetherRaidSimulatorMain.js** -- depends on BattleSimulatorBase
16. **SummonerDuelsSimulatorMain.js** -- depends on BattleSimulatorBase
17. **TestUtilities.js** -- depends on Unit, HeroInfo, BattleMap, DamageCalculatorWrapper, etc.

### Per-File Conversion Details

#### KeyRepeatHandler.js

Defines: `KeyRepeatHandler`

Dependencies: None.

```javascript
// Sources/KeyRepeatHandler.js -- end of file
export { KeyRepeatHandler };
```

No import statements needed.

#### Main_ImageProcessing.js

Defines: `ImageProcessor`, `drawImage` (function)

Dependencies: Browser DOM APIs only (no JS module dependencies).

```javascript
// Sources/Main_ImageProcessing.js -- end of file
export { ImageProcessor, drawImage };
```

No import statements needed.

#### AetherRaidDefensePresets.js

Defines: `AetherRaidDefensePreset`, `AetherRaidDefensePresetInfo`, preset data arrays.

Dependencies: Uses `SeasonType` (from HeroInfoConstants), unit/hero types.

```javascript
// Sources/AetherRaidDefensePresets.js -- top of file
import { SeasonType } from './HeroInfoConstants.js';
```

Export the preset enum and class at end of file.

#### AppData.js

Defines: `AppData` (extends `UnitManager`), `OcrSettingTarget`, `SelectMode`, `PawnsOfLokiDifficality`, various helper functions and global instances (`g_idGenerator`, `g_deffenceStructureContainer`, `g_offenceStructureContainer`).

The `AppData` class is the central data model. It extends `UnitManager` and aggregates `SettingManager`, `AudioManager`, `GlobalBattleContext`, `BattleMap`, `SkillDatabase`, `HeroDatabase`, etc.

Dependencies: UnitManager, GlobalBattleContext, BattleMap, SkillDatabase, HeroDatabase, AudioManager, SettingManager, StructureContainer (from Structures.js), IdGenerator (from Utilities.js or GlobalDefinitions.js), and many constants.

**Important:** `AppData.js` references `SettingManager` in its constructor. Since `SettingManager.js` depends on `AppData`, there is a potential circular dependency. However, since `SettingManager` is only instantiated inside the `AppData` constructor (not at module evaluation time), this is safe in ESM -- `SettingManager` will be initialized by the time any `AppData` instance is created.

```javascript
// Sources/AppData.js -- top of file
import { UnitManager } from './UnitManager.js';
import { GlobalBattleContext } from './GlobalBattleContext.js';
// ... (other imports as needed based on actual symbol usage)

// Sources/AppData.js -- end of file
export { AppData, OcrSettingTarget, SelectMode, PawnsOfLokiDifficality, g_idGenerator, g_deffenceStructureContainer, g_offenceStructureContainer };
```

Identify all symbols used from other modules. The `g_appData` global variable is likely declared and assigned in this file or in entry points -- check the actual location and export it if defined here.

#### SettingManager.js

Defines: `SettingManager`, `changeCurrentUnitTab` (function).

Dependencies: AppData (type reference in constructor), Unit, TurnSetting, CookieWriter (from Utilities.js or GlobalDefinitions.js).

```javascript
// Sources/SettingManager.js -- top of file
import { CookieWriter } from './Utilities.js';
// ... (other imports)

// Sources/SettingManager.js -- end of file
export { SettingManager, changeCurrentUnitTab };
```

#### Main_OriginalAi.js

Defines: `OriginalAi`.

Dependencies: Uses `g_app` (global), `TreeNode` (from Utilities.js), `ScopedStopwatch`, Unit-related types.

```javascript
// Sources/Main_OriginalAi.js -- top of file
import { TreeNode, ScopedStopwatch } from './Utilities.js';
// ... (other imports)

// Sources/Main_OriginalAi.js -- end of file
export { OriginalAi };
```

#### BattleSimulatorBase.js

Defines: `BattleSimulatorBase`, `MoveResult`, `MovementAssistResult`, `determineAssistType`, `hasTargetOptionValue`, `isTrapActivationResult`.

This is a large file with many dependencies. Key imports include: AppData (via `g_appData`), DamageCalculatorWrapper, BeginningOfTurnSkillHandler, Unit types, BattleMap, SkillConstants, AudioManager, etc.

```javascript
// Sources/BattleSimulatorBase.js -- top of file
import { DamageCalculatorWrapper } from './DamageCalculatorWrapper.js';
import { BeginningOfTurnSkillHandler } from './BeginningOfTurnSkillHandler.js';
// ... (many other imports)

// Sources/BattleSimulatorBase.js -- end of file
export { BattleSimulatorBase, MoveResult, MovementAssistResult };
```

#### Main_MouseAndTouch.js

Defines: `DoubleClickChecker`, `g_keyboardManager`, mouse/touch event setup functions.

Dependencies: Uses BattleSimulatorBase indirectly, KeyboardManager (likely from GlobalDefinitions.js or another file).

```javascript
// Sources/Main_MouseAndTouch.js -- end of file
export { DoubleClickChecker, g_keyboardManager };
```

#### VueComponents.js

Defines: `initVueComponents` (function).

Dependencies: Uses `Vue` (global -- do not import), references AppData and BattleSimulatorBase types in templates.

```javascript
// Sources/VueComponents.js -- end of file
export { initVueComponents };
```

Vue remains a global dependency -- do not add an import for it.

#### Entry Point *Main.js Files

Each `*Main.js` file defines a simulator subclass and a global `g_app` variable, plus an `initAetherRaidBoard` (or similar) function. These are entry points for their respective HTML pages.

**ArenaSimulatorMain.js:** Defines `ArenaSimulator` (extends `BattleSimulatorBase`), `g_app`, `initAetherRaidBoard`.

**AetherRaidSimulatorMain.js:** Defines `AetherRaidSimulator` (extends `BattleSimulatorBase`), `g_app`, `initAetherRaidBoard`.

**SummonerDuelsSimulatorMain.js:** Defines `SummonerDuelsSimulator` (extends `BattleSimulatorBase`), `g_app`.

**UnitBuilderMain.js:** Defines `UnitBuilderMain` (extends `BattleSimulatorBase`), `g_app`.

**StatusCalcMain.js:** Defines `StatusCalculator`-related code, `g_app`, standalone `unit` variable.

**DamageCalculatorMain.js:** Defines `DamageCalculatorMode`, `DamageCalcModeOptions`, and damage calculator UI logic.

**HeroIconListerMain.js:** Defines its own local `AppData` class (extends `HeroDatabase`), distinct from the main `AppData`. This file's `AppData` is not the same class as in `AppData.js`.

For each entry point file, add the necessary imports at the top and export the defined classes/functions at the end.

**Special consideration for `HeroIconListerMain.js`:** This file defines its own `AppData` class that extends `HeroDatabase`. This shadows the main `AppData` from `AppData.js`. When adding exports, export this local class under a distinct name or simply export as-is since these entry points are consumed independently (one per HTML page).

```javascript
// Sources/ArenaSimulatorMain.js -- top of file
import { BattleSimulatorBase } from './BattleSimulatorBase.js';
// ...

// Sources/ArenaSimulatorMain.js -- end of file
export { ArenaSimulator };
```

#### TestUtilities.js

Defines: `test_createDefaultSkillInfo`, `test_createDefaultUnit`, `test_HeroDatabase`, `test_BeginningOfTurnSkillHandler`, `test_DamageCalculator`, `test_calcDamageWithUnits`, `test_calcDamage`, `UnitBuilder`, `BattleScenarioBuilder`, `RegressionTestHelper`, `resetGlobalTestState`, `test_executeTest`.

This file is critical for the test infrastructure. It is listed in `create_tests.sh`'s `SOURCE_FILE_NAMES` array.

Dependencies: Unit, HeroInfo, HeroDatabase, SkillDatabase, SkillInfo, BattleMap, UnitManager, GlobalBattleContext, DamageCalculatorWrapper, BeginningOfTurnSkillHandler, Tile, WeaponType, MoveType, UnitGroupType, Weapon, ScopedStopwatch, SimpleLogger, and many constants.

```javascript
// Sources/TestUtilities.js -- top of file
import { Unit } from './Unit.js';
import { Tile } from './Tile.js';
import { BattleMap } from './BattleMap.js';
import { UnitManager } from './UnitManager.js';
import { GlobalBattleContext } from './GlobalBattleContext.js';
import { DamageCalculatorWrapper } from './DamageCalculatorWrapper.js';
import { BeginningOfTurnSkillHandler } from './BeginningOfTurnSkillHandler.js';
import { HeroDatabase } from './HeroDatabase.js';
import { SkillDatabase } from './SkillDatabase.js';
import { SkillInfo } from './Skill.js';
// ... (other imports for constants)

// Sources/TestUtilities.js -- end of file
export { test_createDefaultSkillInfo, test_createDefaultUnit, test_HeroDatabase, test_BeginningOfTurnSkillHandler, test_DamageCalculator, test_calcDamageWithUnits, test_calcDamage, UnitBuilder, BattleScenarioBuilder, RegressionTestHelper, resetGlobalTestState, test_executeTest };
```

### Global Variables

Several files define or reference global variables like `g_appData` and `g_app`. In the current (concatenated) mode, these are true globals. For ESM conversion:

- **`g_appData`**: Used extensively across files. It is likely initialized in `AppData.js` or in entry point files. Identify where it is declared and export it from that file. Other files that reference it will import it. Since `g_appData` is reassigned in test code (`resetGlobalTestState` sets `g_appData = new UnitManager()`), it must be exported as a mutable binding or accessed through a getter. In the concatenated (non-ESM) mode, this works as a global. For ESM correctness, the simplest approach is to export `g_appData` from the file that declares it and import it in consumers. Since `create_tests.sh` strips imports, the concatenated mode will continue to work.

- **`g_app`**: Defined in each `*Main.js` entry point. Export it from each entry point file.

### Verification Steps

After converting each file:

1. Run `./run_tests.sh` -- all tests must pass
2. Run `npm run build` -- build output must be generated without errors
3. Verify the build output does not contain any `import ` or `export {` lines (the filter from section-01 handles this)

### Handling the `HeroIconListerMain.js` AppData Name Collision

`HeroIconListerMain.js` defines its own `AppData` class (extending `HeroDatabase`), which collides with the main `AppData` class in `AppData.js`. In the concatenated build, this is not an issue because `HeroIconListerMain.js` is loaded separately (different HTML page) and is not included in `create_tests.sh`'s `SOURCE_FILE_NAMES`.

For ESM conversion:
- Simply add `export { AppData };` at the end of `HeroIconListerMain.js` -- the name collision does not matter since these files are never imported together in the same module graph
- If `HeroIconListerMain.js` is not in `create_tests.sh`'s `SOURCE_FILE_NAMES` (it is not, based on the current list), no special handling is needed for tests

### Files NOT in create_tests.sh

The following files from this section are **not** listed in `create_tests.sh`'s `SOURCE_FILE_NAMES`:
- All `*Main.js` entry point files
- `SettingManager.js`
- `AetherRaidDefensePresets.js`
- `Main_ImageProcessing.js`
- `Main_OriginalAi.js`
- `Main_MouseAndTouch.js`
- `KeyRepeatHandler.js`
- `BattleSimulatorBase.js`
- `VueComponents.js`

These files do not need to be added to `create_tests.sh` as part of this section. They are only consumed via the build output or direct HTML loading. Their `import`/`export` lines will be stripped by `build.mjs`'s filter during the build process.

### Summary Checklist

For each file in this section:

1. Identify all symbols defined in the file (classes, functions, constants, global variables)
2. Identify all symbols used from other files
3. Add `import { ... } from './...';` at the top for each dependency
4. Add `export { ... };` at the bottom for all public symbols
5. Run `./run_tests.sh` to verify no regressions
6. Run `npm run build` to verify build output is correct

After all files are converted, the full test suite and build must pass. This section blocks section-11 (final ESM validation).