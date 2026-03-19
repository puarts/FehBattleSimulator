# Section 08 Code Review: DSL Node Tests

## Coverage Gaps
1. **GRANTS_BONUS / INFLICTS_PENALTY** — core DSL patterns absent
2. **DEALS_DAMAGE(N).excludingAoe()** — not tested
3. **REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(N)** — not tested
4. **Target nodes (UNIT/FOE)** — entire block absent
5. **HP threshold / stat comparison conditions** — only trivial TRUE/FALSE tested
6. **AFTER_COMBAT_HOOKS** — not tested
7. **Nested composite nodes** — not tested

## Quality Issues
8. All tests use same pattern (DEALS_DAMAGE_X_NODE only)
9. No defender-side skill testing
10. Global hook pollution risk (no afterEach cleanup)

## Positive
- File registration correct
- Common setup matches plan
- Good negative test (skill without passiveS)
- SkillEffectRegistrar tested with conditions
