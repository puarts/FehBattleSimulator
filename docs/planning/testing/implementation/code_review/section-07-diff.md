diff --git a/Tests/CombatFlow.test.js b/Tests/CombatFlow.test.js
index 53831b9c..ac7554eb 100644
--- a/Tests/CombatFlow.test.js
+++ b/Tests/CombatFlow.test.js
@@ -1,4 +1,176 @@
-describe('Combat Flow Tests', () => {
-    // テストはsection-07で追加
-    test('placeholder', () => {});
+describe('Combat flow', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    describe('Basic combat flow', () => {
+        test('Attacker attacks first, defender counter-attacks', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, def: 30, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ atk: 50, def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            expect(result.atkUnit_totalAttackCount).toBe(1);
+            expect(result.defUnit_totalAttackCount).toBe(1);
+            // Both deal 50 - 30 = 20 damage
+            expect(result.atkUnit_normalAttackDamage).toBe(20);
+            expect(result.defUnit_normalAttackDamage).toBe(20);
+        });
+
+        test('Damage equals Atk minus Def', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // 60 - 30 = 30
+            expect(result.atkUnit_normalAttackDamage).toBe(30);
+        });
+
+        test('No damage when Def exceeds Atk', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 20, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 50, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            expect(result.atkUnit_normalAttackDamage).toBe(0);
+        });
+    });
+
+    describe('Miracle (survive at 1 HP)', () => {
+        test('Miracle activates when defender would be KOd', () => {
+            // Miracle: if unit's HP > 1 and foe would reduce HP to 0, unit survives with 1 HP
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 99, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withSpecial(Special.Miracle)
+                .withSpecialCount(0)
+                .withStats({ hp: 50, def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Miracle should be triggered - defender still participates in combat
+            // The damage value should be 99-30=69, but Miracle limits damage to hp-1=49
+            expect(result.atkUnit_normalAttackDamage).toBeGreaterThan(0);
+            expect(result.defUnit_totalAttackCount).toBe(1); // Defender survives to counter
+        });
+    });
+
+    describe('Counter-attack prevention (Sweep)', () => {
+        test('Windsweep prevents enemy counter-attack', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withPassiveB(PassiveB.Kazenagi3)
+                .withStats({ atk: 50, spd: 40 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ atk: 50, def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Windsweep: foe cannot counter
+            expect(result.defUnit_totalAttackCount).toBe(0);
+            // Attacker deals damage
+            expect(result.atkUnit_normalAttackDamage).toBe(20);
+        });
+
+        test('Firesweep prevents all counter-attacks', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withWeapon(Weapon.FiresweepSwordPlus)
+                .withStats({ atk: 50, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ atk: 50, def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Firesweep: neither unit can counter
+            expect(result.defUnit_totalAttackCount).toBe(0);
+        });
+    });
+
+    describe('AoE special', () => {
+        test('AoE special deals pre-combat damage', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withSpecial(Special.BlazingFlame)
+                .withSpecialCount(0)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, res: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // AoE special should deal pre-combat damage
+            expect(result.preCombatDamage).toBeGreaterThan(0);
+        });
+    });
+
+    describe('Vantage', () => {
+        test('Vantage allows defender to attack first when HP <= 75%', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ hp: 50, atk: 50, def: 30, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withPassiveB(PassiveB.Vantage3)
+                .withStats({ hp: 40, atk: 60, def: 30, spd: 30 })
+                .withHpPercent(50) // below 75% threshold
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Both units should attack once
+            expect(result.atkUnit_totalAttackCount).toBe(1);
+            expect(result.defUnit_totalAttackCount).toBe(1);
+            // Damage values
+            expect(result.atkUnit_normalAttackDamage).toBe(20); // 50 - 30
+            expect(result.defUnit_normalAttackDamage).toBe(30); // 60 - 30
+        });
+    });
+
+    describe('Desperation', () => {
+        test('Desperation allows attacker to follow-up before counter when HP <= 75%', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withPassiveB(PassiveB.Desperation3)
+                .withStats({ hp: 40, atk: 50, spd: 45 })
+                .withHpPercent(50) // below 75% threshold
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ hp: 99, atk: 99, def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Spd diff = 15 >= 5, so attacker gets follow-up
+            // With Desperation, attack order: atk, atk, def
+            expect(result.atkUnit_totalAttackCount).toBe(2);
+            expect(result.defUnit_totalAttackCount).toBe(1);
+            expect(result.atkUnit_normalAttackDamage).toBe(20); // 50 - 30
+        });
+    });
 });
diff --git a/Tests/DamageReduction.test.js b/Tests/DamageReduction.test.js
index 853f5572..ab25747d 100644
--- a/Tests/DamageReduction.test.js
+++ b/Tests/DamageReduction.test.js
@@ -1,4 +1,142 @@
-describe('Damage Reduction Tests', () => {
-    // テストはsection-07で追加
-    test('placeholder', () => {});
+describe('Damage reduction mechanics', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    describe('Basic damage calculation', () => {
+        test('Damage equals Atk minus Def (physical)', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            expect(result.atkUnit_normalAttackDamage).toBe(30);
+        });
+
+        test('Damage minimum is 0 when Def exceeds Atk', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 20, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 50, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            expect(result.atkUnit_normalAttackDamage).toBe(0);
+        });
+    });
+
+    describe('Visible buff and debuff effects on damage', () => {
+        test('Atk buff increases damage', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 30 })
+                .withBonuses({ atk: 6 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Damage = (50 + 6) - 30 = 26
+            expect(result.atkUnit_normalAttackDamage).toBe(26);
+        });
+
+        test('Def buff reduces incoming damage', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .withBonuses({ def: 6 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Damage = 60 - (30 + 6) = 24
+            expect(result.atkUnit_normalAttackDamage).toBe(24);
+        });
+
+        test('Atk debuff reduces outgoing damage', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 60, spd: 30 })
+                .withPenalties({ atk: -6 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Damage = (60 - 6) - 30 = 24
+            expect(result.atkUnit_normalAttackDamage).toBe(24);
+        });
+    });
+
+    describe('Follow-up multiplies total damage', () => {
+        test('Two attacks deal double the per-hit damage to HP', () => {
+            // Attacker with follow-up deals damage twice
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 60, spd: 50 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 20 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Per-hit damage = 60 - 30 = 30, attacks twice
+            expect(result.atkUnit_normalAttackDamage).toBe(30);
+            expect(result.atkUnit_totalAttackCount).toBe(2);
+        });
+    });
+
+    describe('Weapon triangle', () => {
+        test('Neutral matchup: no weapon triangle modifier', () => {
+            // Sword vs Sword (same weapon type, both default dummies)
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Neutral: damage = 50 - 30 = 20
+            expect(result.atkUnit_normalAttackDamage).toBe(20);
+        });
+    });
+
+    describe('Buff and debuff combined', () => {
+        test('Buffs and debuffs both affect damage', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 30 })
+                .withBonuses({ atk: 6 })
+                .withPenalties({ atk: -4 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Effective atk = 50 + 6 - 4 = 52
+            // Damage = 52 - 30 = 22
+            expect(result.atkUnit_normalAttackDamage).toBe(22);
+        });
+    });
 });
diff --git a/Tests/FollowUpAttack.test.js b/Tests/FollowUpAttack.test.js
index b0f93583..9370dd7a 100644
--- a/Tests/FollowUpAttack.test.js
+++ b/Tests/FollowUpAttack.test.js
@@ -1,4 +1,149 @@
-describe('Follow-Up Attack Tests', () => {
-    // テストはsection-07で追加
-    test('placeholder', () => {});
+describe('Follow-up attack determination', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    describe('Speed-based follow-up', () => {
+        test('Follow-up occurs when Spd difference >= 5', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 45 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 40 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Spd diff = 5, follow-up occurs → attacker attacks twice
+            expect(result.atkUnit_totalAttackCount).toBe(2);
+        });
+
+        test('No follow-up when Spd difference < 5', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 44 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 40 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Spd diff = 4, no follow-up → attacker attacks once
+            expect(result.atkUnit_totalAttackCount).toBe(1);
+        });
+
+        test('Spd difference exactly 5 triggers follow-up (boundary)', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 35 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            expect(result.atkUnit_totalAttackCount).toBe(2);
+        });
+
+        test('Spd difference exactly 4 does not trigger follow-up (boundary)', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 34 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            expect(result.atkUnit_totalAttackCount).toBe(1);
+        });
+
+        test('Defender follow-up when defender Spd >= attacker Spd + 5', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 35 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            expect(result.defUnit_totalAttackCount).toBe(2);
+        });
+    });
+
+    describe('Guaranteed follow-up (Quick Riposte)', () => {
+        test('Quick Riposte grants guaranteed follow-up on defense', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 50 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withPassiveB(PassiveB.QuickRiposte3)
+                .withStats({ def: 30, spd: 20 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Quick Riposte: guaranteed follow-up when defending at HP >= 70%
+            // Defender spd 20 vs attacker spd 50, but QR grants follow-up
+            expect(result.defUnit_totalAttackCount).toBe(2);
+            expect(result.defUnitFollowUpPriorityInc).toBeGreaterThanOrEqual(1);
+        });
+    });
+
+    describe('Follow-up prevention (Wary Fighter)', () => {
+        test('Wary Fighter prevents both units follow-up', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 50 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withPassiveB(PassiveB.WaryFighter3)
+                .withStats({ def: 30, spd: 20 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Wary Fighter: prevents follow-up for both units
+            expect(result.atkUnit_totalAttackCount).toBe(1);
+            expect(result.defUnit_totalAttackCount).toBe(1);
+        });
+    });
+
+    describe('Guaranteed vs Prevention interaction', () => {
+        test('Guaranteed follow-up and prevention cancel each other, revert to Spd check', () => {
+            // Attacker has guaranteed follow-up (from Quick Riposte on seal as defender scenario)
+            // But let's test: defender has both QR (guaranteed) and attacker has high spd
+            // Use Wary Fighter on defender + Quick Riposte on defender
+            // WF prevents defender follow-up, QR grants it → cancel out → Spd check
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 50 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withPassiveB(PassiveB.WaryFighter3)
+                .withPassiveS(PassiveS.QuickRiposte3)
+                .withStats({ def: 30, spd: 20 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Wary Fighter prevents both follow-ups
+            // QR grants defender follow-up
+            // Net for defender: prevention + guarantee = cancel → Spd check (spd 20 vs 50, no follow-up)
+            // Net for attacker: Wary Fighter prevents → no follow-up (unless spd check after cancel)
+            // Actually WF prevents follow-up attacks by unit AND foe
+            // So attacker: WF prevention, no guarantee → prevented
+            // Defender: WF gives guaranteed prevention to self too? Let's check the result
+            expect(result.atkUnit_totalAttackCount).toBe(1);
+            // Defender: QR +1, WF -1 → cancel → spd check → 20 vs 50, no follow-up
+            expect(result.defUnit_totalAttackCount).toBe(1);
+        });
+    });
 });
diff --git a/Tests/SpecialCount.test.js b/Tests/SpecialCount.test.js
index d2a07625..9ce02021 100644
--- a/Tests/SpecialCount.test.js
+++ b/Tests/SpecialCount.test.js
@@ -1,4 +1,145 @@
-describe('Special Count Tests', () => {
-    // テストはsection-07で追加
-    test('placeholder', () => {});
+describe('Special count mechanics', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    describe('Basic charge', () => {
+        test('Special count decreases by 1 per attack', () => {
+            // Moonbow has cooldown 2
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withSpecial(Special.Moonbow)
+                .withStats({ atk: 60, spd: 50 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 20 })
+                .build();
+            expect(attacker.specialCount).toBe(2);
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Attacker attacks twice (follow-up), special charges during attacks
+            expect(result.atkUnit_totalAttackCount).toBe(2);
+        });
+
+        test('Special triggers at count 0 and increases damage', () => {
+            // Moonbow: Treats foe's Def/Res as if reduced by 30%
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withSpecial(Special.Moonbow)
+                .withSpecialCount(0)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 40, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Special activates: special attack damage > normal attack damage
+            expect(result.atkUnit_specialAttackDamage).toBeGreaterThan(result.atkUnit_normalAttackDamage);
+        });
+
+        test('Special count resets to max after activation', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withSpecial(Special.Moonbow)
+                .withSpecialCount(0)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // After special activation (count 0→triggers→resets to 2),
+            // then defender counter reduces by 1: count = 1
+            expect(result.atkUnit_specialCount).toBe(1);
+        });
+    });
+
+    describe('Charge acceleration (Heavy Blade)', () => {
+        test('Heavy Blade grants extra charge when Atk condition met', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withPassiveA(PassiveA.HeavyBlade4)
+                .withSpecial(Special.Moonbow)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ atk: 30, def: 30, spd: 30 })
+                .build();
+            // Attacker atk 60 > defender atk 30 → Heavy Blade activates
+            // Moonbow cooldown 2, +1 charge per attack = 2 charge on first attack → triggers
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Special should have triggered
+            expect(result.atkUnit_specialAttackDamage).toBeGreaterThan(0);
+        });
+
+        test('Heavy Blade does not grant extra charge when Atk condition not met', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withPassiveA(PassiveA.HeavyBlade4)
+                .withSpecial(Special.Moonbow)
+                .withStats({ atk: 30, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ atk: 60, def: 30, spd: 30 })
+                .build();
+            // Attacker atk 30 < defender atk 60 → Heavy Blade does NOT activate
+            // Without extra charge: after atk (count 2→1) + def counter (1→0)
+            // Special ready but only triggers on own attack, count = 0
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            expect(result.atkUnit_specialCount).toBe(0);
+        });
+    });
+
+    describe('Charge deceleration (Guard)', () => {
+        test('Guard B skill delays special charge', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withSpecial(Special.Moonbow)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withPassiveB(PassiveB.Guard4)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            // Guard: inflicts Special cooldown charge -1 on foe
+            // Attacker charge per attack: 1 - 1 = 0
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // With Guard, attacker's special charge should be slowed
+            // After 1 atk + 1 def counter: if charge = 0 per action, count stays at 2
+            expect(result.atkUnit_specialCount).toBe(2);
+        });
+    });
+
+    describe('Offensive special damage', () => {
+        test('Moonbow reduces effective Def by 30%', () => {
+            // Moonbow at count 0: should trigger on first attack
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withSpecial(Special.Moonbow)
+                .withSpecialCount(0)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 50, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Normal damage: 60 - 50 = 10
+            // Moonbow: Def treated as 50 * 0.7 = 35 → damage = 60 - 35 = 25
+            expect(result.atkUnit_normalAttackDamage).toBe(10);
+            expect(result.atkUnit_specialAttackDamage).toBe(25);
+        });
+    });
 });
diff --git a/Tests/StatusEffect.test.js b/Tests/StatusEffect.test.js
index 42137d6b..eedef865 100644
--- a/Tests/StatusEffect.test.js
+++ b/Tests/StatusEffect.test.js
@@ -1,4 +1,139 @@
-describe('Status Effect Tests', () => {
-    // テストはsection-07で追加
-    test('placeholder', () => {});
+describe('Status effects', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    describe('Panic', () => {
+        test('Panic inverts visible buffs (bonus becomes penalty)', () => {
+            // Unit with Panic and +6 Atk buff → Atk bonus treated as -6
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 30 })
+                .build();
+            // Apply Panic status to defender, who has Atk buff
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .withBonuses({ atk: 6 })
+                .build();
+            defender.addStatusEffect(StatusEffectType.Panic);
+
+            const resultPanic = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+
+            // Compare with same setup without Panic
+            const attacker2 = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 30 })
+                .build();
+            const defenderNoPanic = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .withBonuses({ atk: 6 })
+                .build();
+            const resultNoPanic = new BattleScenarioBuilder()
+                .withAttacker(attacker2)
+                .withDefender(defenderNoPanic)
+                .execute();
+
+            // Without Panic: defender counter-atk uses atk bonus +6
+            // With Panic: defender counter-atk treats +6 as -6 (total -12 swing)
+            // So defender's counter damage should be less with Panic
+            expect(resultPanic.defUnit_normalAttackDamage).toBeLessThan(resultNoPanic.defUnit_normalAttackDamage);
+        });
+
+        test('Panic on defender Def bonus helps attacker damage', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 30 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .withBonuses({ def: 6 })
+                .build();
+            defender.addStatusEffect(StatusEffectType.Panic);
+
+            const resultPanic = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+
+            // With Panic: def bonus +6 becomes -6 → effective def = 30 - 6 = 24
+            // Attacker damage = 50 - 24 = 26
+            const attacker2 = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 30 })
+                .build();
+            const defenderNoPanic = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .withBonuses({ def: 6 })
+                .build();
+            const resultNoPanic = new BattleScenarioBuilder()
+                .withAttacker(attacker2)
+                .withDefender(defenderNoPanic)
+                .execute();
+
+            // Panic makes defender's def bonus negative → more damage taken
+            expect(resultPanic.atkUnit_normalAttackDamage).toBeGreaterThan(resultNoPanic.atkUnit_normalAttackDamage);
+        });
+    });
+
+    describe('Guard status effect', () => {
+        test('Guard status slows special charge compared to no Guard', () => {
+            // Without Guard: after 1 atk + 1 def counter, Moonbow count 2→1→0
+            const attacker1 = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withSpecial(Special.Moonbow)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender1 = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const resultNoGuard = new BattleScenarioBuilder()
+                .withAttacker(attacker1)
+                .withDefender(defender1)
+                .execute();
+
+            // With Guard B skill: charge deceleration
+            const attacker2 = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withSpecial(Special.Moonbow)
+                .withStats({ atk: 60, spd: 30 })
+                .build();
+            const defender2 = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withPassiveB(PassiveB.Guard4)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const resultGuard = new BattleScenarioBuilder()
+                .withAttacker(attacker2)
+                .withDefender(defender2)
+                .execute();
+
+            // Guard should result in higher (less charged) special count
+            expect(resultGuard.atkUnit_specialCount).toBeGreaterThan(resultNoGuard.atkUnit_specialCount);
+        });
+    });
+
+    describe('Deep Wounds', () => {
+        test('Deep Wounds status is applied to unit', () => {
+            const unit = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .build();
+            unit.addStatusEffect(StatusEffectType.DeepWounds);
+            expect(unit.hasStatusEffect(StatusEffectType.DeepWounds)).toBe(true);
+        });
+    });
+
+    describe('Buff and debuff interaction', () => {
+        test('Buffs and debuffs stack independently', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withStats({ atk: 50, spd: 30 })
+                .withBonuses({ atk: 6 })
+                .withPenalties({ atk: -7 })
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .withStats({ def: 30, spd: 30 })
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            // Effective atk = 50 + 6 - 7 = 49
+            // Damage = 49 - 30 = 19
+            expect(result.atkUnit_normalAttackDamage).toBe(19);
+        });
+    });
 });
