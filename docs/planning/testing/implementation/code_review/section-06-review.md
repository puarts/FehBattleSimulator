# Code Review: Section 06 - Skill Regression Tests

The implementation delivers 11 new tests covering the primary combat effects of each listed skill. Key review findings:

1. **Test count shortfall**: Plan estimates ~150 tests, implementation delivers ~22 total (11 from section-05 + 11 new). However, the plan explicitly says "estimated" and the priority is establishing regression baselines.

2. **Missing conditional/negative tests**: No tests for SwiftSpecter Spd comparison, SpdResFaith Bulwark active/inactive, etc.

3. **Missing interaction tests**: No OstianBackbone + WildAtHeart combined tests.

4. **Some skills already covered in section-05**: ChosenLance, SwiftSpecter, WildAtHeart are in the template validation tests.

5. **No Support/Style skill tests**: GuardianPlus, Scendscale style, ChosenLance style not tested.

6. **No SkillImpl202501 representative tests**: Priority 2 coverage not done.

7. **Special skill tests may not exercise trigger logic**: ArmoredFlare and FrozenMirror show 0 normalAttackDamage, suggesting specials may not be triggering with the current test setup.

8. **No spur value assertions**: Only downstream damage is checked, not intermediate stat values.

9. **SistersBlade ally bonus differentiation not tested**: Plan specifically asks for +5 to allies vs +15 to unit.

Severity: Items 2, 7, and 9 are the most valuable improvements for regression detection.
