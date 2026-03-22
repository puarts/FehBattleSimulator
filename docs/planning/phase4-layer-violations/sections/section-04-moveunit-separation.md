`g_trashArea` is a local variable in `BattleSimulatorBase.js`. This makes the functions tightly coupled to L7.

Now I have a complete understanding. Let me write the section content.

# Section 04: moveUnit / moveStructureToTrashBox Function Separation

## Overview

This section resolves layer violations related to unit/structure movement functions defined in `BattleSimulatorBase.js` (Layer 7) that are referenced from lower layers. The primary confirmed violation is `moveStructureToTrashBox` being called as a global from `SkillEffect.js` (Layer 5). An investigation phase confirms the exact violations and determines the best approach -- either state-driven design (preferred) or callback registration.

## Background

### Layer Architecture Reference

```
Layer 0 (Base):      GlobalDefinitions, Utilities, Logger, AppDataGlobal
Layer 1 (Constants): SkillConstants, HeroInfoConstants, UnitConstants, StatusConstants
Layer 2 (Models):    Skill, HeroInfo, Tile, Cell, BattleMapElement, Structures, Table
Layer 3 (Entities):  UnitCore, UnitBattle, BattleContext, UnitManager, BattleMap, GlobalBattleContext
Layer 4 (Logic):     DamageCalculator, DamageCalculatorWrapper, Handlers, Databases
Layer 5 (DSL):       SkillEffectCore, SkillEffect, SkillEffectField, SkillEffectUnit, etc.
Layer 6 (Impl):      SkillImpl群, CustomSkill
Layer 7 (App):       AppData, BattleSimulatorBase, VueComponents, DialogUtil, store
Layer 8 (Entry):     ArenaSimulatorMain, StatusCalcMain, 各Main.js
```

The layer rule is: **Layer N may only import from Layers 0 through N-1**.

### Function Definitions (all in BattleSimulatorBase.js, Layer 7)

The following functions are defined as module-level functions in `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleSimulatorBase.js`:

```javascript
// Line 11785
function moveStructureToTrashBox(structure) {
    removeFromAll(structure);
    g_trashArea.addStructure(structure);
}

// Line 11811
function removeFromAll(structure) {
    g_appData.map.removeObj(structure);
    g_appData.map.removeUnit(structure);
    g_trashArea.removeStructure(structure);
    g_deffenceStructureContainer.removeStructure(structure);
    g_offenceStructureContainer.removeStructure(structure);
}

// Line 11819
function moveUnitToTrashBox(unit) {
    removeFromAll(unit);
    g_trashArea.addStructure(unit);
    unit.ownerType = OwnerType.TrashBox;
}

// Line 11826
function moveUnitToMap(unit, x, y, endsActionIfActivateTrap = false, executesTrap = true) {
    let moveResult = placeUnitToMap(unit, x, y, endsActionIfActivateTrap, executesTrap);
    g_trashArea.removeStructure(unit);
    return moveResult;
}

// Line 11838
function moveUnit(unit, tile, endsActionIfActivateTrap = false, executesTrap = true) {
    return moveUnitToMap(unit, tile.posX, tile.posY, endsActionIfActivateTrap, executesTrap);
}
```

These functions depend on `g_trashArea` (a `StructureContainer` local to BattleSimulatorBase.js, line 11749), `g_deffenceStructureContainer`, and `g_offenceStructureContainer`, all of which are Layer 7 state.

### Confirmed Layer Violation

**`SkillEffect.js` (Layer 5) line 4565** calls `moveStructureToTrashBox` as a global without import:

```javascript
// Sources/SkillEffect.js lines 4558-4569
class DestroysOffenceSafetyFenceNode extends SkillEffectNode {
    // destroys foe's Safety Fence (O) structure
    evaluate(env) {
        for (let st of g_appData.getOffenseStructures()) {
            if (st instanceof SafetyFence) {
                env.debug('攻撃の安全柵を破壊');
                moveStructureToTrashBox(st);  // <-- L5 calling L7 function (VIOLATION)
            }
        }
    }
}
```

This is a **Layer 5 to Layer 7 upward dependency** -- a clear violation. In strict ESM mode, this would cause a `ReferenceError` since `moveStructureToTrashBox` is not imported.

### Existing Pattern: Dependency Injection in BeginningOfTurnSkillHandler

`BeginningOfTurnSkillHandler.js` (Layer 4) already uses dependency injection for the same function:

```javascript
// Sources/BeginningOfTurnSkillHandler.js line 20
constructor(unitManager, map, globalBattleContext, logger, moveStructureToTrashBox) {
    ...
    this.moveStructureToTrashBox = moveStructureToTrashBox;
}
```

Layer 7 (`BattleSimulatorBase.js`) passes the function as a constructor argument at line 123. This is an established pattern in the codebase.

### Non-Violations (clarification)

The following are NOT layer violations and require no changes:

- **`BattleMap.moveUnit(unit, x, y)`** (Layer 3): A class method on BattleMap. Used correctly via `this.moveUnit()` or `g_appData.map.moveUnit()`.
- **`moveUnit` parameter name in Tile.js, SkillImpl.js, UnitSkillEffect.js**: These use `moveUnit` as a function parameter name for a unit object, not the standalone function.
- **`SettingManager.js` importing from BattleSimulatorBase.js**: Both are Layer 7, so L7-to-L7 is valid.
- **`Main_MouseAndTouch.js` using `moveUnit`/`moveUnitToTrashBox` as globals**: Layer 8 file, L8 can use L7. (The missing imports are a separate ESM correctness issue, not a layer violation.)

## Dependencies

- **Section 01 (Baseline Inventory)** must be complete: baseline tests pass, madge reports zero cycles.
- **Section 02 and 03** should ideally be complete first (sequential execution recommended to avoid file conflicts in SkillEffect.js).

## Tests

### Test File: `Tests/MoveUnitSeparation.test.js`

```javascript
// Tests/MoveUnitSeparation.test.js

import { describe, it, expect } from 'vitest';

describe('moveUnit/moveStructureToTrashBox separation', () => {
    // Test: SkillEffect.js (Layer 5) does not import from BattleSimulatorBase.js (Layer 7)
    // Verify by checking import statements in SkillEffect.js
    it('SkillEffect.js should not import from BattleSimulatorBase.js', async () => {
        // Read SkillEffect.js imports and verify none reference BattleSimulatorBase
        const fs = await import('fs');
        const content = fs.readFileSync('Sources/SkillEffect.js', 'utf-8');
        const importLines = content.split('\n').filter(line => line.match(/^\s*import\s.*from/));
        const bsbImports = importLines.filter(line => line.includes('BattleSimulatorBase'));
        expect(bsbImports).toHaveLength(0);
    });

    // Test: DestroysOffenceSafetyFenceNode does not call moveStructureToTrashBox directly
    // (after refactoring, it should use a callback registry or state-driven approach)
    it('DestroysOffenceSafetyFenceNode should not reference moveStructureToTrashBox as a global', async () => {
        const fs = await import('fs');
        const content = fs.readFileSync('Sources/SkillEffect.js', 'utf-8');
        // After fix: moveStructureToTrashBox should not appear as a bare function call
        // It may appear as a registered callback invocation instead
        const bareCallPattern = /[^.]\bmoveStructureToTrashBox\s*\(/;
        // Find the DestroysOffenceSafetyFenceNode class section
        const classStart = content.indexOf('class DestroysOffenceSafetyFenceNode');
        const classEnd = content.indexOf('\nconst DESTROYS_OFFENCE_SAFETY_FENCE_NODE', classStart);
        const classContent = content.slice(classStart, classEnd);
        expect(classContent).not.toMatch(bareCallPattern);
    });

    // Test: madge --circular Sources/ reports zero cycles
    // (Already covered by Tests/MissingImports.test.js)

    // Test: moveStructureToTrashBox callback registry works (if callback approach chosen)
    // (Tested via the existing npm test suite -- functional behavior must not regress)
});
```

### Existing Tests (no changes needed)

- `Tests/MissingImports.test.js` -- verifies `madge --circular Sources/` reports zero cycles
- Full `npm test` suite validates no regressions

## Implementation Steps

### Step 1: Investigate and Confirm Violations

Search all Layer 5 and below files for references to functions defined in `BattleSimulatorBase.js`:

**Known violation:**
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffect.js` line 4565: `moveStructureToTrashBox(st)` -- L5 calling L7 function

**Search for additional violations:** Grep all Layer 1-6 files for `moveUnit(`, `moveUnitToTrashBox(`, `moveUnitToMap(`, `moveStructureToTrashBox(`, `placeUnitToMap(`, `removeFromAll(`, `moveStructureToMap(`, `moveStructureToDefenceStorage(`, `moveStructureToOffenceStorage(` as bare function calls (not method calls on objects).

Document any additional findings before proceeding.

### Step 2: Choose Resolution Approach

Two approaches are available. The **preferred approach** depends on the nature of the violation.

#### Approach A: Callback Registration (Recommended for this case)

This follows the existing pattern used by `BeginningOfTurnSkillHandler.js`. Create a callback registry at a low layer that Layer 7 populates at initialization.

**File to create or modify:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AppDataGlobal.js` (Layer 0)

Add a callback registry following the existing `g_appData` / `setAppData` pattern:

```javascript
// In AppDataGlobal.js (Layer 0) -- add alongside existing exports

/** @type {((structure: Object) => void) | null} */
export let moveStructureToTrashBoxCallback = null;

/**
 * Register the moveStructureToTrashBox implementation.
 * Called by Layer 7 (BattleSimulatorBase.js) at initialization.
 * @param {(structure: Object) => void} callback
 */
export function setMoveStructureToTrashBoxCallback(callback) {
    moveStructureToTrashBoxCallback = callback;
}
```

**File to modify:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleSimulatorBase.js` (Layer 7)

At initialization (e.g., in the `BattleSimulatorBase` constructor or module-level code), register the callback:

```javascript
import { setMoveStructureToTrashBoxCallback } from './AppDataGlobal.js';

// At module load or in constructor:
setMoveStructureToTrashBoxCallback(moveStructureToTrashBox);
```

**File to modify:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffect.js` (Layer 5)

Replace the direct global call with the callback invocation:

```javascript
import { moveStructureToTrashBoxCallback } from './AppDataGlobal.js';

// In DestroysOffenceSafetyFenceNode.evaluate():
class DestroysOffenceSafetyFenceNode extends SkillEffectNode {
    evaluate(env) {
        for (let st of g_appData.getOffenseStructures()) {
            if (st instanceof SafetyFence) {
                env.debug('攻撃の安全柵を破壊');
                moveStructureToTrashBoxCallback?.(st);  // callback, not direct call
            }
        }
    }
}
```

#### Approach B: State-Driven Design (Alternative)

If the operation can be expressed purely as state changes that Vue reactivity handles:

- `SkillEffect.js` (L5) sets `structure.isDestroyed = true` or similar domain state
- `BattleSimulatorBase.js` (L7) or a Vue watcher reacts to the state change and performs the actual removal

However, this approach requires significant refactoring of how `g_trashArea`, `g_deffenceStructureContainer`, and `g_offenceStructureContainer` work. The `removeFromAll` function touches 5 different container/map operations. State-driven design would require all of these to become reactive, which is a larger change than this section warrants.

**Recommendation**: Use **Approach A (Callback Registration)** since it matches the existing `BeginningOfTurnSkillHandler` pattern and requires minimal changes.

### Step 3: Implement the Callback Registry

Follow Approach A as described above. The specific files to modify are:

1. `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AppDataGlobal.js` -- Add callback variable and setter
2. `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleSimulatorBase.js` -- Register the callback at initialization
3. `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffect.js` -- Replace bare `moveStructureToTrashBox(st)` with `moveStructureToTrashBoxCallback?.(st)`

### Step 4: Handle Additional Violations (if found)

If Step 1 discovers additional violations beyond `moveStructureToTrashBox` in `SkillEffect.js`:

- Apply the same callback registration pattern for each function
- Group related callbacks (e.g., if both `moveStructureToTrashBox` and `moveUnitToTrashBox` are needed, register both)
- Each callback should have its own setter function in `AppDataGlobal.js`

If no additional violations are found, this step is a no-op.

### Step 5: Add Missing Imports to Main_MouseAndTouch.js (ESM correctness)

While not a layer violation (L8 can import from L7), `Main_MouseAndTouch.js` uses `moveUnit`, `moveUnitToTrashBox`, `MoveResult`, and `updateAllUi` as globals without imports. Add the necessary import statement at the top of the file:

**File:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Main_MouseAndTouch.js`

```javascript
import { moveUnit, moveUnitToTrashBox, MoveResult, updateAllUi } from './BattleSimulatorBase.js';
```

Note: This file may have other missing imports as well. Only add the ones related to moveUnit functions in this section. Other missing imports are out of scope.

### Step 6: Validate

After all changes:

1. Run `npm test` -- all tests must pass
2. Run `npx madge --circular --no-color Sources/` -- zero cycles
3. Run the new `Tests/MoveUnitSeparation.test.js` tests
4. Verify `SkillEffect.js` has no imports from `BattleSimulatorBase.js`
5. Verify no Layer 5 or below file imports from Layer 7+

### Step 7: Commit

Commit with message following the convention:

```
refactor(phase4): moveStructureToTrashBoxのレイヤー違反を解消、コールバック登録パターンに変更
```

## Error Handling

If `npx madge --circular Sources/` reports any cycles after changes:
- **Stop immediately**
- **Do not attempt to fix independently**
- **Report to the user** with the madge output and the specific change that triggered it
- Wait for guidance before proceeding

If the investigation in Step 1 reveals violations not described in this section:
- Document the findings
- Report to the user before implementing fixes
- The callback registration pattern from Approach A should be applicable to most cases

## Implementation Result

### Deviations from Plan

1. **エラーログ追加**: プランでは `moveStructureToTrashBoxCallback?.(st)` を使用していたが、コードレビューでサイレント失敗の懸念が指摘され、ユーザー判断により `if/else` + `console.error` に変更。
2. **Main_MouseAndTouch.jsのimport**: プランでは4シンボルのみ指定していたが、実際には8シンボルをimport（`moveStructureToMap`, `moveStructureToTrashBox`, `moveStructureToDefenceStorage`, `moveStructureToOffenceStorage` も追加）。いずれもファイル内で使用されている。
3. **追加のレイヤー違反は発見されず**: Step 1の調査で他のL5以下のファイルからの違反は確認されなかった。

### Validation Results

- `npm test`: 全テスト通過（既存のtimeout系flaky testを除く）
- `npx madge --circular Sources/`: 循環依存なし
- `Tests/MoveUnitSeparation.test.js`: 2/2 pass

## Summary

| Item | Details |
|------|---------|
| **Primary violation** | `SkillEffect.js` (L5) line 4565 calls `moveStructureToTrashBox` from `BattleSimulatorBase.js` (L7) |
| **Resolution approach** | Callback registration in `AppDataGlobal.js` (L0), matching `BeginningOfTurnSkillHandler` pattern |
| **Files modified** | `AppDataGlobal.js`, `BattleSimulatorBase.js`, `SkillEffect.js`, `Main_MouseAndTouch.js` |
| **Files created** | `Tests/MoveUnitSeparation.test.js` |
| **Additional work** | `Main_MouseAndTouch.js` に8つの不足importを追加（ESM正確性、レイヤー違反ではない） |
| **Risk** | Low -- callback pattern already proven in codebase |