# Section 09 Code Review

## Critical: Missing Imports

### DamageCalculator.js
- `LoggerBase` used at runtime (e.g. `LoggerBase.LogLevel.NOTICE`) but not imported from Logger.js
- `getSkillLogLevel` used at runtime (3 occurrences) but not imported from SkillEffect.js

### BeginningOfTurnSkillHandler.js
- `getSkillLogLevel` used at runtime (6 occurrences) — missing from SkillEffect.js
- `isNormalAttackSpecial` used at runtime — missing from Skill.js
- `isPhysicalWeaponType` used at runtime — missing from Skill.js
- `isWeaponTypeBreathOrBeast` used at runtime (6 occurrences) — missing from Skill.js
- `isMeleeWeaponType` used at runtime (1 free function call) — missing from Skill.js
- `MoveType` used at runtime (21 occurrences) — missing from HeroInfoConstants.js
- `UnitGroupType` used at runtime (17 occurrences) — missing from UnitConstants.js

## Low: Duplicate import paths
- PostCombatSkillHander.js has two imports from Skill.js and two from SkillEffect.js
- DamageCalculator.js has two imports from Skill.js
- (Convention does not prohibit this; cosmetic only)

## Verdict
Exports are correct and complete. Import sources are correct where provided. Auto-fix for all missing imports.
