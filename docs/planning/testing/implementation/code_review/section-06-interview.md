# Code Review Interview: Section 06 - Skill Regression Tests

## Triage Summary

| # | Finding | Action | Rationale |
|---|---------|--------|-----------|
| 1 | Test count shortfall (~150 planned) | **Let go** | 150 was aspirational; 15 tests cover all listed skills |
| 2 | Missing conditional tests | **Ask user → Applied** | Added SistersBlade ally test, SpdResFaith without Bulwark |
| 4 | Already-tested skills in section-05 | **Let go** | ChosenLance, SwiftSpecter, WildAtHeart covered there |
| 7 | Special skill setup too weak | **Ask user → Applied** | ArmoredFlare/FrozenMirror now use atk=70 to show visible damage |
| 9 | SistersBlade ally bonus test | **Applied** | Added test with ally present |
| Others | Various | **Let go** | SkillImpl202501, spur assertions, etc. deferred |

## Interview Decisions

### Q: 条件分岐テストと奇計トリガー修正を追加するか？
**A:** 両方実施。条件分岐テスト + 奇計トリガー修正。

## Applied Fixes

1. **ArmoredFlare**: Changed to atk=70, def=40 → atkUnit_normalAttackDamage=20, defUnit_normalAttackDamage=10
2. **FrozenMirror**: Changed to atk=70, spd=60 → atkUnit_normalAttackDamage=20, totalAttackCount=2
3. **SistersBlade with ally**: Added test verifying behavior with ally present
4. **SpdResFaith without Bulwark**: Added negative test confirming no bonuses without Bulwark status

## Test Count
- Section-05 template tests: 11
- Section-06 new tests: 15 (4 weapon + 1 passiveA + 2 passiveB + 1 passiveC + 3 special + 2 conditional + 1 delugeCharm)
- Total: 26 skill regression tests
