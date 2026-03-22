diff --git a/Tests/CombatFlow.test.js b/Tests/CombatFlow.test.js
index d3947937..e14fab82 100644
--- a/Tests/CombatFlow.test.js
+++ b/Tests/CombatFlow.test.js
@@ -1,3 +1,6 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { Special, PassiveB, Weapon } from '../Sources/SkillConstants.js';
+
 describe('Combat flow', () => {
     beforeEach(() => {
         resetGlobalTestState();
diff --git a/Tests/DamageCalculator.test.js b/Tests/DamageCalculator.test.js
index 6925e950..457705cb 100644
--- a/Tests/DamageCalculator.test.js
+++ b/Tests/DamageCalculator.test.js
@@ -1,3 +1,6 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { PassiveA } from '../Sources/SkillConstants.js';
+
 describe('Test feud skills', () => {
   let heroDatabase;
   let atkUnit;
diff --git a/Tests/DamageReduction.test.js b/Tests/DamageReduction.test.js
index ab25747d..02567148 100644
--- a/Tests/DamageReduction.test.js
+++ b/Tests/DamageReduction.test.js
@@ -1,3 +1,5 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+
 describe('Damage reduction mechanics', () => {
     beforeEach(() => {
         resetGlobalTestState();
diff --git a/Tests/DslNode.test.js b/Tests/DslNode.test.js
index 63981bf3..e1ea7eb4 100644
--- a/Tests/DslNode.test.js
+++ b/Tests/DslNode.test.js
@@ -1,3 +1,8 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { StatusEffectType } from '../Sources/StatusConstants.js';
+import { NumberNode, SkillEffectHooks, NODE_FUNC, IF_NODE, TRUE_NODE, FALSE_NODE, CONSTANT_NUMBER_NODE, MultiValueMap } from '../Sources/SkillEffectCore.js';
+import { NodeEnv } from '../Sources/SkillEffectEnv.js';
+
 describe('DSL Node Tests', () => {
     /** @type {Unit} */
     let atkUnit;
diff --git a/Tests/EsmImportSanity.test.js b/Tests/EsmImportSanity.test.js
new file mode 100644
index 00000000..b67fb853
--- /dev/null
+++ b/Tests/EsmImportSanity.test.js
@@ -0,0 +1,29 @@
+// ESM import sanity check — verifies ESM imports coexist with concatenation globals
+import { NumberNode, CONSTANT_NUMBER_NODE } from '../Sources/SkillEffectCore.js';
+import { NodeEnv } from '../Sources/SkillEffectEnv.js';
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { Weapon } from '../Sources/SkillConstants.js';
+import { StatusEffectType } from '../Sources/StatusConstants.js';
+
+describe('ESM import sanity check', () => {
+    test('can import and use SkillEffectCore symbols directly', () => {
+        expect(CONSTANT_NUMBER_NODE(2).mult(4).evaluate(new NodeEnv())).toBe(8);
+    });
+
+    test('NumberNode class is importable', () => {
+        expect(NumberNode).toBeDefined();
+        expect(typeof NumberNode).toBe('function');
+    });
+
+    test('enum imports resolve to same values as concatenation globals', () => {
+        // ESM-imported enums should match the concatenation globals
+        expect(UnitGroupType.Ally).toBeDefined();
+        expect(StatusEffectType).toBeDefined();
+        expect(Weapon).toBeDefined();
+    });
+
+    test('ESM-imported enums have correct values', () => {
+        expect(UnitGroupType.Ally).toBe(0);
+        expect(UnitGroupType.Enemy).toBe(1);
+    });
+});
diff --git a/Tests/FollowUpAttack.test.js b/Tests/FollowUpAttack.test.js
index 9370dd7a..fcc9e4e1 100644
--- a/Tests/FollowUpAttack.test.js
+++ b/Tests/FollowUpAttack.test.js
@@ -1,3 +1,6 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { PassiveB, PassiveS } from '../Sources/SkillConstants.js';
+
 describe('Follow-up attack determination', () => {
     beforeEach(() => {
         resetGlobalTestState();
diff --git a/Tests/GetRequirements.test.js b/Tests/GetRequirements.test.js
index 4a2bf612..7f2517e7 100644
--- a/Tests/GetRequirements.test.js
+++ b/Tests/GetRequirements.test.js
@@ -1,3 +1,5 @@
+import { StatusEffectType } from '../Sources/StatusConstants.js';
+
 describe('getRequirements tests', () => {
     test('IF node with stat comparison should return STAT requirement', () => {
         // UNIT.spd.sgt(FOE.spd) の部分をテスト
diff --git a/Tests/Performance.test.js b/Tests/Performance.test.js
index 0ade0a50..9ebe393d 100644
--- a/Tests/Performance.test.js
+++ b/Tests/Performance.test.js
@@ -1,3 +1,5 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+
 describe('Performance benchmarks', () => {
     const isCI = !!process.env.CI;
 
diff --git a/Tests/SkillEffect.test.js b/Tests/SkillEffect.test.js
index 8ac05aee..e6568602 100644
--- a/Tests/SkillEffect.test.js
+++ b/Tests/SkillEffect.test.js
@@ -1,3 +1,6 @@
+import { NumberNode, CONSTANT_NUMBER_NODE, MultiValueMap, SkillEffectHooks } from '../Sources/SkillEffectCore.js';
+import { NodeEnv } from '../Sources/SkillEffectEnv.js';
+
 describe('Test skill effect', () => {
     describe(`Test ${NumberNode.name}`, () => {
         test('mult function', () => {
diff --git a/Tests/SkillRegression.test.js b/Tests/SkillRegression.test.js
index d4936742..9220a0db 100644
--- a/Tests/SkillRegression.test.js
+++ b/Tests/SkillRegression.test.js
@@ -1,3 +1,6 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { Weapon, PassiveA, PassiveB, PassiveC, Special } from '../Sources/SkillConstants.js';
+
 // スキルIDからスキル名を取得するヘルパー
 function getSkillName(skillId) {
     let info = g_testHeroDatabase.skillDatabase.findSkillInfoByDict(skillId);
diff --git a/Tests/SmokeTest.test.js b/Tests/SmokeTest.test.js
index 289a6a2b..3cf7a5d8 100644
--- a/Tests/SmokeTest.test.js
+++ b/Tests/SmokeTest.test.js
@@ -1,3 +1,7 @@
+import { Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveS, WeaponType } from '../Sources/SkillConstants.js';
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { StatusEffectType } from '../Sources/StatusConstants.js';
+
 // =============================================================================
 // Phase 0: スモークテスト
 // Vite + Vue 3 移行の安全網として、アプリの基本動作を確認する
diff --git a/Tests/SpecialCount.test.js b/Tests/SpecialCount.test.js
index de314b33..f06e0660 100644
--- a/Tests/SpecialCount.test.js
+++ b/Tests/SpecialCount.test.js
@@ -1,3 +1,6 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { Special, PassiveA, PassiveB } from '../Sources/SkillConstants.js';
+
 describe('Special count mechanics', () => {
     beforeEach(() => {
         resetGlobalTestState();
diff --git a/Tests/StatusEffect.test.js b/Tests/StatusEffect.test.js
index eedef865..bf12e9ca 100644
--- a/Tests/StatusEffect.test.js
+++ b/Tests/StatusEffect.test.js
@@ -1,3 +1,7 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { PassiveB, Special } from '../Sources/SkillConstants.js';
+import { StatusEffectType } from '../Sources/StatusConstants.js';
+
 describe('Status effects', () => {
     beforeEach(() => {
         resetGlobalTestState();
diff --git a/Tests/TestHelper.test.js b/Tests/TestHelper.test.js
index bb70e019..48cd049e 100644
--- a/Tests/TestHelper.test.js
+++ b/Tests/TestHelper.test.js
@@ -1,3 +1,6 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { Weapon } from '../Sources/SkillConstants.js';
+
 describe('UnitBuilder', () => {
     test('fromHero creates a valid unit from hero name', () => {
         let unit = UnitBuilder.fromHero('マルス').build();
diff --git a/Tests/UnitManager.test.js b/Tests/UnitManager.test.js
index c35c6531..af0f58d7 100644
--- a/Tests/UnitManager.test.js
+++ b/Tests/UnitManager.test.js
@@ -1,3 +1,4 @@
+import { UnitGroupType } from '../Sources/UnitConstants.js';
 
 test('UnitManager_EnumerateUnits', () => {
     let manager = new test_UnitManager();
diff --git a/docs/planning/phase4-layer-violations/implementation/deep_implement_config.json b/docs/planning/phase4-layer-violations/implementation/deep_implement_config.json
index fe05b851..d57ec16d 100644
--- a/docs/planning/phase4-layer-violations/implementation/deep_implement_config.json
+++ b/docs/planning/phase4-layer-violations/implementation/deep_implement_config.json
@@ -25,6 +25,14 @@
     "section-03-gamemode-relocation": {
       "status": "complete",
       "commit_hash": "7cb4b143"
+    },
+    "section-04-moveunit-separation": {
+      "status": "complete",
+      "commit_hash": "a039d369"
+    },
+    "section-05-final-validation": {
+      "status": "complete",
+      "commit_hash": "658efa8d"
     }
   },
   "pre_commit": {
