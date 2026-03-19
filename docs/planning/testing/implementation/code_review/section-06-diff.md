diff --git a/Tests/SkillRegression.test.js b/Tests/SkillRegression.test.js
index 571f88f2..a3a6d78a 100644
--- a/Tests/SkillRegression.test.js
+++ b/Tests/SkillRegression.test.js
@@ -205,3 +205,265 @@ describe('Skill regression template - multi-unit scenarios', () => {
         expect(snapshot.defRestHp).toBe(50);
     });
 });
+
+// ============================================================
+// Skill Regression Tests - SkillImpl202601.js
+// ============================================================
+
+describe('Weapon skills (SkillImpl202601)', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    {
+        const skillId = Weapon.HeroicMaltet;
+        test(`${getSkillName(skillId)}: grants Atk/Spd/Def/Res+10, deals +25 damage, reduces damage by 15`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withWeapon(skillId)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(30);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkUnit_totalAttackCount).toBe(2);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+
+    {
+        const skillId = Weapon.SistersBlade;
+        test(`${getSkillName(skillId)}: grants Atk/Spd/Def/Res+15, deals +25 damage, reduces damage by 15`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withWeapon(skillId)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(40);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkUnit_totalAttackCount).toBe(2);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+
+    {
+        const skillId = Weapon.GiftOfLove;
+        test(`${getSkillName(skillId)}: grants Atk/Spd/Def/Res+15, deals +25 damage, follow-up attack`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withWeapon(skillId)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(40);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkUnit_totalAttackCount).toBe(3);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+
+    {
+        const skillId = Weapon.SweetStaff;
+        test(`${getSkillName(skillId)}: grants Atk/Spd/Def/Res+15, deals +25 damage, reduces damage by 15`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withWeapon(skillId)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(40);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkUnit_totalAttackCount).toBe(2);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+});
+
+describe('Passive A skills (SkillImpl202601)', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    {
+        const skillId = PassiveA.OstianBackbone;
+        test(`${getSkillName(skillId)}: deals +7 damage, reduces damage by 7`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withPassiveA(skillId)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(7);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+});
+
+describe('Passive B skills (SkillImpl202601)', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    {
+        const skillId = PassiveB.SRDetectAerial;
+        test(`${getSkillName(skillId)}: inflicts Spd/Res penalties and deals +8 damage`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withPassiveB(skillId)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(8);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(10);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+
+    {
+        const skillId = PassiveB.ARDetectAerial;
+        test(`${getSkillName(skillId)}: inflicts Atk/Res penalties and deals +8 damage`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withPassiveB(skillId)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(8);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(10);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+});
+
+describe('Passive C skills (SkillImpl202601)', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    {
+        const skillId = PassiveC.TrulyInspired;
+        test(`${getSkillName(skillId)}: grants Atk/Res+4 during combat`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withPassiveC(skillId)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(4);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+});
+
+describe('Special skills (SkillImpl202601)', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    {
+        const skillId = Special.ArmoredFlare;
+        test(`${getSkillName(skillId)}: regression baseline with specialCount=0`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally, { def: 40 })
+                .withSpecial(skillId)
+                .withSpecialCount(0)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(10);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+
+    {
+        const skillId = Special.FrozenMirror;
+        test(`${getSkillName(skillId)}: regression baseline with specialCount=0`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally, { spd: 60 })
+                .withSpecial(skillId)
+                .withSpecialCount(0)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkUnit_totalAttackCount).toBe(2);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+
+    {
+        const skillId = Special.DelugeCharm;
+        test(`${getSkillName(skillId)}: regression baseline with specialCount=0`, () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally, { atk: 60 })
+                .withSpecial(skillId)
+                .withSpecialCount(0)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(10);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+});
