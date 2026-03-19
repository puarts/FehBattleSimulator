# Code Review Interview: Section 05 - Skill Regression Test Template

## Triage Summary

| # | Finding | Action | Rationale |
|---|---------|--------|-----------|
| 1 | Test names don't use getSkillName | **Ask user → Applied** | User approved; added getSkillName helper and dynamic test names |
| 2 | Suspicious regression values | **Let go** | Values are correct — recorded from actual simulator runs |
| 3 | Missing HP assertions | **Auto-fix** | Added atkRestHp/defRestHp to all tests |
| 4 | No PassiveB/C test | **Ask user → Applied** | User approved; added PassiveB.WildAtHeart test |
| 5 | Conflated negative test | **Let go** | Adequate for template validation |
| 6 | withWeapon test weakened | **Auto-fix** | Now checks weapon, weaponInfo, and weaponInfo.id |
| 7 | No getSkillName validation | **Auto-fix** | Added test for getSkillName helper |

## Interview Decisions

### Q: テスト名にgetSkillName(skillId)を使うべきか？PassiveB/Cスキルのテストも追加すべきか？
**A:** 両方実施。getSkillName使用 + PassiveB/C追加。

## Applied Fixes

1. **getSkillName helper**: Added `getSkillName(skillId)` function using `g_testHeroDatabase.skillDatabase.findSkillInfoByDict(skillId)?.name`
2. **Dynamic test names**: All skill validation tests now use `${getSkillName(skillId)}:` prefix
3. **getSkillName validation test**: Added test confirming getSkillName returns valid string
4. **PassiveB.WildAtHeart test**: Added test covering attacks-twice and stat penalty effects
5. **HP assertions**: Added atkRestHp/defRestHp checks to SwiftSpecter and AtkSpdAirspace tests
6. **withWeapon test improved**: Now verifies weapon ID, weaponInfo existence, and weaponInfo.id

## Test Count
- Before: 9 tests (3 template + 3 known skill + 2 multi-unit + 1 placeholder)
- After: 11 tests (5 template + 4 known skill + 2 multi-unit)
