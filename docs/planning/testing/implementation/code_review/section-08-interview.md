# Section 08 Interview Transcript

## User Decision: Add GRANTS_BONUS and target tests

User chose to add GRANTS_BONUS/INFLICTS_PENALTY tests and UNIT/FOE target resolution.

### Added:
1. GRANTS_BONUS(ATK_SPD(5)).to(UNIT) — verifies +5 damage increase
2. INFLICTS_PENALTY(DEF_RES(5)).on(FOE) — verifies +5 damage increase via foe penalty
3. UNIT target does not affect FOE — verified via damage comparison
4. FOE target does not affect UNIT — verified via counter-damage comparison

### Auto-fixes:
- Tests use comparison approach (baseline vs with-skill) since hero units have default skill spurs
- Total: 17 tests (up from 13)

### Let go:
- DEALS_DAMAGE.excludingAoe() — requires AoE setup
- REDUCES_DAMAGE — complex defender-side setup
- HP threshold conditions — requires specific HP percentage setup
- AFTER_COMBAT_HOOKS — different code path
- Global hook cleanup — unique IDs mitigate pollution
