# Section 05 Code Review Interview

## Reviewed Items

### A1: calcBuffAmount misplaced (UnitBattle.js → UnitCore.js)
- **Decision**: Fix applied
- **Reason**: calcBuffAmount is used by UnitCore.js (AssistableUnitInfo). Leaving it in UnitBattle.js would create circular dependency when Section 08 adds missing imports.
- **Action**: Moved calcBuffAmount to UnitCore.js, updated exports and facade.

### A4: _addStatusEffectRaw redundant hasStatusEffect check
- **Decision**: Keep as-is
- **Reason**: User chose safety over micro-optimization. The duplicate check has no practical cost.

## Auto-skipped Items

### C1/C2: Missing imports in UnitBattle.js / UnitSkillEffect.js
- Explicitly deferred to Section 08 by design.

### A2: UnitBattle.js uses side-effect import instead of init function
- Side-effect import is pragmatic and the plan allowed both approaches.

### A3: Cross-category method calls (UnitCore → UnitSkillEffect)
- Runtime safe; init always runs before usage in all entry points.

### T1/T2: Tests are typeof-only / Test 5 scenario
- Sufficient for module split verification. Behavioral tests exist in other test files.
