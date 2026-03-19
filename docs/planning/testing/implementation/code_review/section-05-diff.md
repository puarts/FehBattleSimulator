diff --git a/Tests/SkillRegression.test.js b/Tests/SkillRegression.test.js
index 0e786dd2..c13cbc0a 100644
--- a/Tests/SkillRegression.test.js
+++ b/Tests/SkillRegression.test.js
@@ -1,4 +1,167 @@
-describe('Skill Regression Tests', () => {
-    // テストはsection-05, section-06で追加
-    test('placeholder', () => {});
+describe('Skill regression test template validation', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    test('Template: createDummy + withWeapon + execute produces valid combat result', () => {
+        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+            .withWeapon(Weapon.ChosenLance)
+            .build();
+        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+            .build();
+        const result = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .execute();
+        expect(result).toBeDefined();
+        expect(result.atkUnit_normalAttackDamage).toBeDefined();
+        expect(result.defUnit_normalAttackDamage).toBeDefined();
+    });
+
+    test('Template: baseline damage with no skills is predictable', () => {
+        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        const result = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .execute();
+        // Default dummy (atk 50) vs default dummy (def 50) = 0 damage
+        expect(result.atkUnit_normalAttackDamage).toBe(0);
+        expect(result.defUnit_normalAttackDamage).toBe(0);
+        expect(result.atkUnit_totalAttackCount).toBe(1);
+        expect(result.defUnit_totalAttackCount).toBe(1);
+    });
+
+    test('Template: createDummy with custom stats affects combat result', () => {
+        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally, {
+            hp: 99, atk: 60, spd: 40, def: 30, res: 20
+        }).build();
+        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        const result = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .execute();
+        // atk 60 - def 50 = 10
+        expect(result.atkUnit_normalAttackDamage).toBe(10);
+    });
+
+    test('Template: withWeapon changes the equipped weapon', () => {
+        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+            .withWeapon(Weapon.ChosenLance)
+            .build();
+        expect(attacker.weapon).toBe(Weapon.ChosenLance);
+    });
+});
+
+describe('Skill regression template - known skill validation', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    // Weapon.ChosenLance: unconditional, Grants Atk/Spd/Def/Res+15, deals +25 damage, reduces damage by 15
+    {
+        const skillId = Weapon.ChosenLance;
+        test('ChosenLance: Grants Atk/Spd/Def/Res+15, deals +25 damage, reduces damage by 15', () => {
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
+            // atk 50 + 15 spur = 65 vs def 50, base 15 + deals_damage 25 = 40
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(40);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkUnit_totalAttackCount).toBe(2);
+            expect(snapshot.defUnit_totalAttackCount).toBe(1);
+            expect(snapshot.atkRestHp).toBe(50);
+            expect(snapshot.defRestHp).toBe(50);
+        });
+    }
+
+    // PassiveA.SwiftSpecter: HP >= 25% or within 3 spaces of ally → Atk/Spd+9
+    {
+        const skillId = PassiveA.SwiftSpecter;
+        test('SwiftSpecter: condition met (HP >= 25%) grants Atk/Spd+9', () => {
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
+            // atk 50 + 9 spur = 59 vs def 50 = 9, + additional effects = 16
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(16);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkUnit_totalAttackCount).toBe(2);
+        });
+
+        test('SwiftSpecter: condition NOT met (HP < 25%, no allies) grants nothing extra', () => {
+            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+                .withPassiveA(skillId)
+                .withHpPercent(10)
+                .build();
+            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+                .build();
+            const result = new BattleScenarioBuilder()
+                .withAttacker(attacker)
+                .withDefender(defender)
+                .execute();
+            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+            // No bonus: atk 50 - def 50 = 0
+            expect(snapshot.atkUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+            expect(snapshot.atkUnit_totalAttackCount).toBe(1);
+        });
+    }
+});
+
+describe('Skill regression template - multi-unit scenarios', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    test('AtkSpdAirspace: ally within 3 spaces enables skill', () => {
+        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+            .withPassiveA(PassiveA.AtkSpdAirspace)
+            .build();
+        const ally = UnitBuilder.createDummy(UnitGroupType.Ally)
+            .atPosition(1, 0)
+            .build();
+        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
+            .build();
+        const result = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .addAlly(ally)
+            .execute();
+        const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+        // atk 50 + 10 spur = 60 vs def 50 = 10, + additional effects = 17
+        expect(snapshot.atkUnit_normalAttackDamage).toBe(17);
+        expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+        expect(snapshot.atkUnit_totalAttackCount).toBe(2);
+    });
+
+    test('AtkSpdAirspace: no ally nearby and foe initiates - skill does NOT activate', () => {
+        const unit = UnitBuilder.createDummy(UnitGroupType.Enemy)
+            .withPassiveA(PassiveA.AtkSpdAirspace)
+            .build();
+        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
+            .build();
+        const result = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(unit)
+            .execute();
+        const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+        // No bonus: atk 50 - def 50 = 0
+        expect(snapshot.atkUnit_normalAttackDamage).toBe(0);
+        expect(snapshot.defUnit_normalAttackDamage).toBe(0);
+        expect(snapshot.atkUnit_totalAttackCount).toBe(1);
+    });
 });
