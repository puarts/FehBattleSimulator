# Section 02 Code Review

## Summary

The implementation successfully accomplishes the primary goal (deleting vitest.setup.js and removing setupFiles from vite.config.js) and goes well beyond the original plan scope to fix circular dependencies, ESM-ize multiple files, and fix DSL bugs. The core changes are sound and all 650 tests passing is strong evidence of correctness. However, there are several issues worth flagging.

## High Severity

None. No security, data loss, or crash risks identified.

## Medium Severity

### 1. Duplicate UNITE_SPACES_NODE / UniteCollectionsNode shadowing concern
In `Sources/SkillEffectCore.js` lines 700-707, a new `UniteCollectionsNode` class and `UNITE_SPACES_NODE` factory function were added. However, `SkillEffect.js` already defines `UniteSpacesNode` (line 1443) and its own `UNITE_SPACES_NODE` (line 1463), which is the one that gets exported and used everywhere. The `SkillEffectCore.js` version is only used internally by `CollectionNode.or()` (line 664). While both implementations are functionally equivalent (Set-based dedup of concatenated iterables), having two competing definitions with the same factory name in different modules is confusing and fragile. If `CollectionNode.or()` is ever called on a `SpacesNode`, it will return an `UniteCollectionsNode` instead of an `UniteSpacesNode`, which could cause issues if downstream code does `instanceof UniteSpacesNode` checks. This should be documented or consolidated.

### 2. Duplicate PERCENTAGE_NODE definition
Similar to above: `PERCENTAGE_NODE` is now defined identically in both `SkillEffectCore.js` (line 977) and `SkillEffect.js` (line 9863). Both have the corrected argument order `(percentage, num)`. The `SkillEffectCore.js` version is only used by `NumberNode.percentage()` (line 618), while the `SkillEffect.js` version is the exported one. The duplication is consistent but should ideally be consolidated -- if someone fixes a bug in one copy they might miss the other.

### 3. Performance threshold silently bumped
In `Tests/Performance.test.js` line 81, the beginning-of-turn skill handler benchmark threshold was raised from 800ms to 1000ms (a 25% increase). This change is not mentioned in the section plan and could mask a real performance regression introduced by the ESM migration. The cause of this slowdown should be investigated and documented.

## Low Severity

### 4. Duplicate import statements from same module
In `Sources/DamageCalculator.js` lines 5-6, there are two separate import statements from `./SkillEffectEnv.js`:
```javascript
import { NodeEnv, DamageCalculatorEnv } from './SkillEffectEnv.js';
import { getSkillLogLevel } from './SkillEffectEnv.js';
```
Same issue in `Sources/DamageCalculatorWrapper.js` lines 4-5. These should be consolidated into single import statements.

### 5. Re-export sprawl from SkillEffect.js
`SkillEffect.js` still re-exports `CantoEnv`, `BattleMapEnv`, `AtStartOfTurnEnv`, `AfterCombatEnv`, and `getSkillLogLevel` even though the definitions have been moved to `SkillEffectEnv.js`. All consumers in the diff were updated to import from `SkillEffectEnv.js` directly, so these re-exports appear to be dead paths. If they exist for backward compatibility with un-migrated consumers, that should be documented. Otherwise they should be removed to avoid confusion about the canonical import path.

### 6. String literal fragility for Unit.nameOf replacements
The replacement of `Unit.nameOf(unit => unit.spurs)` with `'spurs'` breaks the compile-time safety that `nameOf` provided. If the `spurs` property is ever renamed on the `Unit` class, these string literals will silently break at runtime. The comments like `// Unit.nameOf(unit => unit.spurs)` are helpful but not enforceable. This is acknowledged as a necessary tradeoff for circular dependency resolution, but it would be better to add a runtime assertion or test that validates these string keys against the Unit class.

## Scope Observations

The implementation scope expanded significantly beyond the plan. The plan specified only two operations: (1) delete vitest.setup.js, (2) remove setupFiles from vite.config.js. The actual diff touches 25 files across Sources/ and Tests/, including ESM-izing SkillUtil.js, fixing DSL bugs, adding missing imports to SkillImpl files, and fully ESM-izing DamageCalculator.test.js and SkillEffect.test.js (which the plan explicitly said would be handled in section-03 and section-04). This scope creep means sections 03 and 04 may now be partially or fully obsolete, which should be reflected in the section index.
