# Usage Guide: DamageCalculatorWrapper Split

## Overview

The monolithic `DamageCalculatorWrapper.js` (~17,000 lines) has been split into 6 files using a runtime prototype extension pattern (`definePrototypeMethods`). No logic was changed — this is a pure structural refactoring.

## File Structure

```
Sources/combat/
├── DamageCalculatorWrapper.js                         (3,488 lines - core)
├── DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js (1,029 lines)
├── DamageCalculatorWrapper_InitSkillEffectDict_Unit.js   (6,848 lines)
├── DamageCalculatorWrapper_ApplySkillEffects.js          (1,818 lines)
├── DamageCalculatorWrapper_Spur.js                       (2,635 lines)
└── DamageCalculatorWrapper_FollowupAndCounter.js         (1,379 lines)
```

## How It Works

Each split file uses `DamageCalculatorWrapper.definePrototypeMethods({...})` to attach methods to the class prototype at load time. This static helper (defined in the core file) validates that no duplicate method names exist across files, catching errors early.

Each split file has a load guard:
```javascript
if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}
```

## Load Order

Split files must be loaded **after** `DamageCalculatorWrapper.js` and **before** `BeginningOfTurnSkillHandler.js`:

```
combat/DamageCalculatorWrapper
combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef
combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit
combat/DamageCalculatorWrapper_ApplySkillEffects
combat/DamageCalculatorWrapper_Spur
combat/DamageCalculatorWrapper_FollowupAndCounter
combat/BeginningOfTurnSkillHandler
```

This order is configured in:
- `create_tests.sh` (test runner)
- `Deploy.bat` (3 concatenation lists)
- `run_simple_test.sh`
- `MergeTests.bat`
- All 5 HTML files (`ArenaSimulator.html`, `AetherRaidSimulator.html`, `SummonerDuelsSimulator.html`, `UnitBuilder.html`, `DamageCalculator.html`)

## Adding New Methods

When adding new methods to `DamageCalculatorWrapper`:
1. Determine which split file the method belongs to based on its category
2. Add it inside the `definePrototypeMethods({...})` block of that file
3. Use object method shorthand with trailing commas between methods

## Tests

Run `./run_tests.sh` to verify. Split-specific tests are in `Tests/DamageCalculatorWrapperSplit.test.js`.
