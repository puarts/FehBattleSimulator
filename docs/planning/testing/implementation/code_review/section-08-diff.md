diff --git a/Tests/DslNode.test.js b/Tests/DslNode.test.js
index 13d4439b..6fc50ab1 100644
--- a/Tests/DslNode.test.js
+++ b/Tests/DslNode.test.js
@@ -1,4 +1,180 @@
 describe('DSL Node Tests', () => {
-    // テストはsection-08で追加
-    test('placeholder', () => {});
+    /** @type {Unit} */
+    let atkUnit;
+    /** @type {Unit} */
+    let defUnit;
+    let calculator;
+
+    beforeEach(() => {
+        let heroDatabase = g_testHeroDatabase;
+        atkUnit = heroDatabase.createUnit('アルフォンス');
+        defUnit = heroDatabase.createUnit('アルフォンス', UnitGroupType.Enemy);
+        calculator = new test_DamageCalculator();
+        calculator.unitManager.units = [atkUnit, defUnit];
+        calculator.isLogEnabled = false;
+        g_appData = calculator.unitManager;
+    });
+
+    describe('Effect nodes via combat', () => {
+        test('DEALS_DAMAGE_X_NODE adds fixed damage during combat', () => {
+            let additionalDamage = 15;
+            let skillId = 'test-deals-damage-15';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                DEALS_DAMAGE_X_NODE(additionalDamage),
+            ));
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            // Normal damage + additional damage
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
+        });
+
+        test('DEALS_DAMAGE_X_NODE with zero additional damage equals normal damage', () => {
+            let skillId = 'test-deals-damage-0';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                DEALS_DAMAGE_X_NODE(0),
+            ));
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
+        });
+    });
+
+    describe('Condition nodes via combat', () => {
+        test('IF_NODE with TRUE_NODE applies effect', () => {
+            let additionalDamage = 10;
+            let skillId = 'test-if-true-damage';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                IF_NODE(TRUE_NODE, DEALS_DAMAGE_X_NODE(additionalDamage)),
+            ));
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
+        });
+
+        test('IF_NODE with FALSE_NODE does not apply effect', () => {
+            let skillId = 'test-if-false-damage';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                IF_NODE(FALSE_NODE, DEALS_DAMAGE_X_NODE(10)),
+            ));
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
+        });
+    });
+
+    describe('Composite nodes in combat context', () => {
+        test('AND condition: both true applies effect', () => {
+            let additionalDamage = 20;
+            let skillId = 'test-and-both-true';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                IF_NODE(new AndNode(TRUE_NODE, TRUE_NODE), DEALS_DAMAGE_X_NODE(additionalDamage)),
+            ));
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
+        });
+
+        test('AND condition: one false blocks effect', () => {
+            let skillId = 'test-and-one-false';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                IF_NODE(new AndNode(TRUE_NODE, FALSE_NODE), DEALS_DAMAGE_X_NODE(20)),
+            ));
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
+        });
+
+        test('OR condition: one true applies effect', () => {
+            let additionalDamage = 20;
+            let skillId = 'test-or-one-true';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                IF_NODE(new OrNode(FALSE_NODE, TRUE_NODE), DEALS_DAMAGE_X_NODE(additionalDamage)),
+            ));
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
+        });
+
+        test('OR condition: both false blocks effect', () => {
+            let skillId = 'test-or-both-false';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                IF_NODE(new OrNode(FALSE_NODE, FALSE_NODE), DEALS_DAMAGE_X_NODE(20)),
+            ));
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
+        });
+    });
+
+    describe('Hook registration', () => {
+        test('AT_START_OF_COMBAT_HOOKS: registered skill is evaluated', () => {
+            let additionalDamage = 7;
+            let skillId = 'test-hook-start-combat';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                DEALS_DAMAGE_X_NODE(additionalDamage),
+            ));
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
+        });
+
+        test('Skill without matching passiveS does not activate', () => {
+            let skillId = 'test-hook-not-assigned';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                DEALS_DAMAGE_X_NODE(99),
+            ));
+            // Don't assign skillId to any unit
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
+        });
+
+        test('registerSkillsDuringCombat: registered skill evaluated during combat', () => {
+            let additionalDamage = 12;
+            let skillId = 'test-registrar-during-combat';
+            SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
+                DEALS_DAMAGE_X_NODE(additionalDamage),
+            );
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
+        });
+
+        test('registerSkillsDuringCombat with FALSE condition does not apply', () => {
+            let skillId = 'test-registrar-false-cond';
+            SkillEffectRegistrar.registerSkillsDuringCombat(skillId, FALSE_NODE,
+                DEALS_DAMAGE_X_NODE(99),
+            );
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
+        });
+    });
+
+    describe('Multiple effects composition', () => {
+        test('Multiple DEALS_DAMAGE effects stack additively', () => {
+            let damage1 = 5;
+            let damage2 = 8;
+            let skillId = 'test-multi-damage';
+            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
+                DEALS_DAMAGE_X_NODE(damage1),
+                DEALS_DAMAGE_X_NODE(damage2),
+            ));
+            atkUnit.passiveS = skillId;
+            let result = calculator.calcDamage(atkUnit, defUnit);
+            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
+            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + damage1 + damage2);
+        });
+    });
 });
