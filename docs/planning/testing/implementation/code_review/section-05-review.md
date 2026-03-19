# Code Review: Section 05 - Skill Regression Test Template

The implementation covers the three required describe blocks and picks concrete skills, which is good. However, several issues stand out:

1. **Test names do not use `getSkillName(skillId)` as specified in the plan's Standard Test Template.** The plan explicitly shows `test(\`${getSkillName(skillId)}: [brief effect description]\`, ...)` as the canonical pattern. The implementation hardcodes string literals like `'ChosenLance: Grants Atk/Spd/Def/Res+15...'` and `'SwiftSpecter: condition met...'`. This deviates from the template that section-06 will depend on. If `getSkillName` returns a different display name, tests will be confusing.

2. **Suspicious regression values that appear fabricated rather than recorded from an actual simulator run.** The plan states: 'Record phase: When writing a test, run it once to obtain the actual combat result values from the current simulator.' Several values look questionable:
   - ChosenLance test (line 84-89): `atkUnit_normalAttackDamage` = 40, `defRestHp` = 50. If the attacker deals 40 damage twice (totalAttackCount=2), the defender's remaining HP should be negative or at minimum not 50. Either the `defRestHp` snapshot is taken before combat, the attack count includes a follow-up that was blocked, or these values were not actually recorded from the simulator.
   - SwiftSpecter test (line 108): `atkUnit_normalAttackDamage` = 16 with comment '+ additional effects = 16'. The math from Atk/Spd+9 alone gives atk 59 - def 50 = 9, yet the asserted value is 16. The 7-point gap is unexplained.
   - AtkSpdAirspace test (line 154): `atkUnit_normalAttackDamage` = 17 with comment '+ additional effects = 17'. atk 50 + 10 = 60 - def 50 = 10, yet asserted as 17. Again a mysterious 7-point gap.

3. **Missing defender HP post-combat assertions in conditional tests.** The plan's 'Assertions to Include Per Skill' section requires `attacker.hp` and `defender.hp` after combat. The SwiftSpecter condition-met test and the AtkSpdAirspace tests omit `atkRestHp` and `defRestHp` checks. Only the ChosenLance test includes them.

4. **No passive B/C skill test.** The plan says 'Cover different skill slots (weapon, passive A, passive B/C)'. The implementation only covers Weapon (ChosenLance) and Passive A (SwiftSpecter, AtkSpdAirspace). No Passive B or C skill is tested.

5. **Missing negative test for multi-unit scenario.** The plan's multi-unit test validates 'if allies within 2 spaces' by showing ally presence enables the condition. The implementation's AtkSpdAirspace negative test tests foe-initiated combat without allies, which conflates two conditions (no allies nearby AND foe initiating).

6. **`withWeapon` stat recalculation test weakened.** The plan specifies 'Template: withWeapon triggers stat recalculation' -- verifying that the attacker's effective atk reflects weapon Mt. The implementation only checks `attacker.weapon === Weapon.ChosenLance`, which tests assignment, not stat recalculation.

7. **No `getSkillName` import or usage validation.** If section-06 depends on `getSkillName` being available in the test environment, section-05 should validate it works.

Severity ranking: Issue #2 (possibly incorrect regression values) is the most critical -- if the baseline values are wrong, every future regression test built on this template will be unreliable. Issue #1 and #6 undermine the template's purpose as a validated pattern for section-06.
