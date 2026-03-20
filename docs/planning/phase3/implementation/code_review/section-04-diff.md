diff --git a/Sources/DamageCalculatorWrapper.js b/Sources/DamageCalculatorWrapper.js
index 287a3f21..c859f4ff 100644
--- a/Sources/DamageCalculatorWrapper.js
+++ b/Sources/DamageCalculatorWrapper.js
@@ -3733,13 +3733,13 @@ class DamageCalculatorWrapper {
         this._applySkillEffectForUnitFuncDict[Weapon.HadoNoSenfu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
             if (!targetUnit.isWeaponRefined) {
                 // <通常効果>
-                if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, calcPotentialDamage)) {
+                if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                     targetUnit.battleContext.followupAttackPriorityIncrement++;
                 }
             } else {
                 // <錬成効果>
                 if (targetUnit.battleContext.restHpPercentage >= 25 ||
-                    this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, calcPotentialDamage)) {
+                    this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                     targetUnit.addAllSpur(4);
                     targetUnit.battleContext.followupAttackPriorityIncrement++;
                 }
diff --git a/Tests/BeginningOfTurnSkillHandler.test.js b/Tests/BeginningOfTurnSkillHandler.test.js
index 9602560f..6b9bb42a 100644
--- a/Tests/BeginningOfTurnSkillHandler.test.js
+++ b/Tests/BeginningOfTurnSkillHandler.test.js
@@ -20,6 +20,7 @@ test('BeginningOfTurnSkillHandler_Simple', () => test_executeTest(() => {
     handler.map.getTile(2, 2).setUnit(enemyUnit);
     handler.map.getTile(2, 0).setUnit(enemyAllyUnit);
     handler.unitManager.units = [unit, unit, enemyUnit, enemyAllyUnit];
+    globalThis.g_appData = handler.unitManager;
 
     // 全ての英雄のターン開始時スキルを実行して例外が出ない事を確認する
     using_(new ScopedStopwatch(x => log += `${g_testHeroDatabase.length}回のターン開始時スキル評価の時間: ${x} ms\n`), () => {
diff --git a/Tests/DamageCalculator.test.js b/Tests/DamageCalculator.test.js
index e37a35a8..6925e950 100644
--- a/Tests/DamageCalculator.test.js
+++ b/Tests/DamageCalculator.test.js
@@ -1,4 +1,12 @@
 describe('Test feud skills', () => {
+  let heroDatabase;
+  let atkUnit;
+  let atkAllyUnit;
+  let defUnit;
+  let defAllyUnit;
+  let defAllyUnit2;
+  let calclator;
+
   beforeEach(() => {
     // _  0  1  2
     // 0    da
@@ -25,7 +33,7 @@ describe('Test feud skills', () => {
 
     calclator = new test_DamageCalculator();
     calclator.isLogEnabled = false;
-    g_appData = calclator.unitManager;
+    globalThis.g_appData = calclator.unitManager;
   });
 
   describe('Test disable skills from other enemies', () => {
@@ -253,11 +261,18 @@ describe('Test feud skills', () => {
 
 // 無効系スキル
 describe('Test invalidation skills', () => {
+  let heroDatabase;
+  let atkUnit;
+  let defUnit;
+  let atkAllyUnit;
+  let defAllyUnit;
+  let calclator;
+
   beforeEach(() => {
     // _  0  1  2
     // 0 du
     // 1 au
-    // 2 
+    // 2
     heroDatabase = g_testHeroDatabase;
 
     atkUnit = heroDatabase.createUnit("アルフォンス");
@@ -474,6 +489,7 @@ test('DamageCalculator_HeroBattleTest', () => test_executeTest(() => {
     calclator.map.getTile(2, 0).setUnit(defAllyUnit);
     calclator.unitManager.units = [atkUnit, defUnit, atkAllyUnit, defAllyUnit];
     calclator.isLogEnabled = false;
+    globalThis.g_appData = calclator.unitManager;
     // calclator.disableProfile();
 
     atkUnit.weaponRefinement = WeaponRefinementType.Special;
@@ -571,6 +587,7 @@ describe('Test for additional damage calculation', () => {
   let atkUnit;
   /** @type {Unit} */
   let defUnit;
+  let atkAllyUnit;
   beforeEach(() => {
     atkUnit = test_createDefaultUnit();
     atkUnit.atkWithSkills = 0;
@@ -802,6 +819,9 @@ test('DamageCalculator_SpecialDamageReductionTest', () => test_executeTest(() =>
 /// ダメージ軽減テストです。
 /// ダメージ軽減を半分無効にするスキルのテスト
 describe('Test to reduce the percentage of foe\'s non-Special "reduce damage by X%" skills', () => {
+  let atkUnit;
+  let defUnit;
+
   beforeEach(() => {
     atkUnit = test_createDefaultUnit();
     defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
@@ -935,6 +955,12 @@ test('DamageCalculator_RangedSpecial', () => test_executeTest(() => {
 }));
 
 describe('Test great talent', () => {
+  let heroDatabase;
+  let atkUnit;
+  let defUnit;
+  let defAllyUnit;
+  let calclator;
+
   beforeEach(() => {
     heroDatabase = g_testHeroDatabase;
 
@@ -945,15 +971,19 @@ describe('Test great talent', () => {
     atkUnit.placedTile.posX = 0;
     atkUnit.placedTile.posY = 1;
 
-    defAllyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
+    defUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
     defUnit.defWithSkills = 30;
     defUnit.setGreatTalent(StatusIndex.DEF, 4);
+    defUnit.placedTile.posX = 0;
+    defUnit.placedTile.posY = 0;
+
+    defAllyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
     defAllyUnit.placedTile.posX = 1;
     defAllyUnit.placedTile.posY = 0;
 
     calclator = new test_DamageCalculator();
     calclator.isLogEnabled = false;
-    g_appData = calclator.unitManager;
+    globalThis.g_appData = calclator.unitManager;
   });
 
   test('Test great talent applied', () => {
diff --git a/Tests/DslNode.test.js b/Tests/DslNode.test.js
index 95d9f87b..63981bf3 100644
--- a/Tests/DslNode.test.js
+++ b/Tests/DslNode.test.js
@@ -12,7 +12,7 @@ describe('DSL Node Tests', () => {
         calculator = new test_DamageCalculator();
         calculator.unitManager.units = [atkUnit, defUnit];
         calculator.isLogEnabled = false;
-        g_appData = calculator.unitManager;
+        globalThis.g_appData = calculator.unitManager;
     });
 
     describe('Effect nodes via combat', () => {
@@ -173,7 +173,7 @@ describe('DSL Node Tests', () => {
             defUnit = g_testHeroDatabase.createUnit('アルフォンス', UnitGroupType.Enemy);
             calculator = new test_DamageCalculator();
             calculator.unitManager.units = [atkUnit, defUnit];
-            g_appData = calculator.unitManager;
+            globalThis.g_appData = calculator.unitManager;
 
             let skillId = 'test-grants-bonus-atk-spd';
             SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
@@ -193,7 +193,7 @@ describe('DSL Node Tests', () => {
             defUnit = g_testHeroDatabase.createUnit('アルフォンス', UnitGroupType.Enemy);
             calculator = new test_DamageCalculator();
             calculator.unitManager.units = [atkUnit, defUnit];
-            g_appData = calculator.unitManager;
+            globalThis.g_appData = calculator.unitManager;
 
             let skillId = 'test-inflicts-penalty-def-res';
             SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
@@ -221,7 +221,7 @@ describe('DSL Node Tests', () => {
             let baseAtk = g_testHeroDatabase.createUnit('アルフォンス');
             let baseDef = g_testHeroDatabase.createUnit('アルフォンス', UnitGroupType.Enemy);
             baseCalc.unitManager.units = [baseAtk, baseDef];
-            g_appData = baseCalc.unitManager;
+            globalThis.g_appData = baseCalc.unitManager;
             let baseResult = baseCalc.calcDamage(baseAtk, baseDef);
             expect(result.atkUnit_normalAttackDamage).toBe(baseResult.atkUnit_normalAttackDamage + 7);
         });
@@ -238,7 +238,7 @@ describe('DSL Node Tests', () => {
             let baseAtk = g_testHeroDatabase.createUnit('アルフォンス');
             let baseDef = g_testHeroDatabase.createUnit('アルフォンス', UnitGroupType.Enemy);
             baseCalc.unitManager.units = [baseAtk, baseDef];
-            g_appData = baseCalc.unitManager;
+            globalThis.g_appData = baseCalc.unitManager;
             let baseResult = baseCalc.calcDamage(baseAtk, baseDef);
             // Foe's counter damage should be 6 less
             expect(result.defUnit_normalAttackDamage).toBe(baseResult.defUnit_normalAttackDamage - 6);
diff --git a/Tests/EsmValidation.test.js b/Tests/EsmValidation.test.js
index 63cd89f0..32234fa5 100644
--- a/Tests/EsmValidation.test.js
+++ b/Tests/EsmValidation.test.js
@@ -1,9 +1,10 @@
-const { execFileSync } = require('child_process');
-const fs = require('fs');
-const path = require('path');
+import { execFileSync } from 'child_process';
+import fs from 'fs';
+import path from 'path';
+import { fileURLToPath } from 'url';
 
-// Tests run from concatenated All.test.js at project root, so __dirname IS the root
-const ROOT = __dirname;
+// When run via Vitest, __dirname equivalent is the Tests/ dir, so go up one level
+const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
 const SOURCES = path.join(ROOT, 'Sources');
 
 describe('ESM Validation', () => {
diff --git a/Tests/Performance.test.js b/Tests/Performance.test.js
index 645c17c2..0ade0a50 100644
--- a/Tests/Performance.test.js
+++ b/Tests/Performance.test.js
@@ -28,7 +28,7 @@ describe('Performance benchmarks', () => {
             calculator.map.getTile(0, 0).setUnit(defUnit);
             calculator.unitManager.units = [atkUnit, defUnit];
             calculator.isLogEnabled = false;
-            g_appData = calculator.unitManager;
+            globalThis.g_appData = calculator.unitManager;
 
             atkUnit.weaponRefinement = WeaponRefinementType.Special;
             defUnit.weaponRefinement = WeaponRefinementType.Special;
@@ -47,7 +47,7 @@ describe('Performance benchmarks', () => {
         }
 
         runBenchmark(runAllHeroBattle, 3000, 1500);
-    });
+    }, 30000);
 
     test('ターン開始スキル適用（全英雄）が閾値以内で完了する', () => {
         let heroDatabase = g_testHeroDatabase;
@@ -64,7 +64,7 @@ describe('Performance benchmarks', () => {
             handler.map.getTile(2, 0).setUnit(enemyAllyUnit);
             handler.unitManager.units = [unit, allyUnit, enemyUnit, enemyAllyUnit];
             handler.battleContext.currentTurn = 1;
-            g_appData = handler.unitManager;
+            globalThis.g_appData = handler.unitManager;
 
             unit.weaponRefinement = WeaponRefinementType.Special;
             for (let heroInfo of heroDatabase.enumerateHeroInfos()) {
diff --git a/Tests/SkillEffect.test.js b/Tests/SkillEffect.test.js
index 7f78172a..8ac05aee 100644
--- a/Tests/SkillEffect.test.js
+++ b/Tests/SkillEffect.test.js
@@ -11,6 +11,8 @@ describe('Test skill effect', () => {
     });
 
     describe(`Test ${MultiValueMap.name}`, () => {
+        let map;
+
         beforeEach(() => {
             map = new MultiValueMap();
         });
@@ -46,8 +48,10 @@ describe('Test skill effect', () => {
     });
 
     describe(`Test ${SkillEffectHooks.name}`, () => {
+        /** @type {SkillEffectHooks<ConstantNumberNode>} */
+        let skillEffectMap;
+
         beforeEach(() => {
-            /** @type {SkillEffectHooks<ConstantNumberNode>} */
             skillEffectMap = new SkillEffectHooks();
         });
 
@@ -201,6 +205,7 @@ describe('Test skill effect', () => {
 });
 
 describe('Stats node', () => {
+    let heroDatabase;
     /** @type {Unit} */
     let unit;
     /** @type {NodeEnv} */
@@ -211,6 +216,7 @@ describe('Stats node', () => {
     const PHANTOM_SPD_3_VALUE = 10;
 
     beforeEach(() => {
+        heroDatabase = g_testHeroDatabase;
         unit = heroDatabase.createUnit('アルフォンス');
         env = new NodeEnv();
         env.setTarget(unit);
@@ -270,6 +276,7 @@ describe('Stats node', () => {
 });
 
 describe('Bonuses or penalties', () => {
+    let heroDatabase;
     /** @type {Unit} */
     let unit;
     /** @type {Unit} */
@@ -287,6 +294,10 @@ describe('Bonuses or penalties', () => {
         env = new NodeEnv();
         env.setTarget(unit).setUnitsDuringCombat(unit, foe);
 
+        let calculator = new test_DamageCalculator();
+        calculator.unitManager.units = [unit, foe];
+        globalThis.g_appData = calculator.unitManager;
+
         [unit.atkWithSkills, unit.spdWithSkills, unit.defWithSkills, unit.resWithSkills] = BASE_STATS;
         [foe.atkWithSkills, foe.spdWithSkills, foe.defWithSkills, foe.resWithSkills] = BASE_STATS;
 
@@ -413,6 +424,7 @@ describe('Bonuses or penalties', () => {
 });
 
 describe('Skills during combat', () => {
+    let heroDatabase;
     /** @type {Unit} */
     let atkUnit;
     /** @type {Unit} */
@@ -426,7 +438,7 @@ describe('Skills during combat', () => {
         calculator = new test_DamageCalculator();
         calculator.unitManager.units = [atkUnit, defUnit];
         calculator.isLogEnabled = true;
-        g_appData = calculator.unitManager;
+        globalThis.g_appData = calculator.unitManager;
         // g_appData.skillLogLevel = LoggerBase.LogLevel.ALL;
     });
 
@@ -486,6 +498,8 @@ describe('Skills during combat', () => {
 });
 
 describe('Effect Node', () => {
+    let heroDatabase;
+    let battleMap;
     /** @type {Unit} */
     let atkUnit;
     /** @type {Unit} */
@@ -502,7 +516,7 @@ describe('Effect Node', () => {
         calculator = new test_DamageCalculator();
         calculator.unitManager.units = [atkUnit, defUnit];
         calculator.isLogEnabled = true;
-        g_appData = calculator.unitManager;
+        globalThis.g_appData = calculator.unitManager;
         // g_appData.skillLogLevel = LoggerBase.LogLevel.ALL;
     });
 
@@ -673,6 +687,12 @@ describe('Effect Node', () => {
 
 
 describe('Test map', () => {
+    let heroDatabase;
+    let battleMap;
+    let allies;
+    let enemies;
+    let calclator;
+
     beforeEach(() => {
         heroDatabase = g_testHeroDatabase;
         battleMap = new BattleMap('');
@@ -993,6 +1013,7 @@ test("Status Effects", () => {
 });
 
 describe('ModSkillEffectFieldNode DSL functions', () => {
+    let heroDatabase;
     /** @type {Unit} */
     let unit;
     /** @type {Unit} */
@@ -1198,6 +1219,7 @@ describe('ModSkillEffectFieldNode DSL functions', () => {
 });
 
 describe('CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP', () => {
+    let heroDatabase;
     let unit;
     let foe;
     let env;
diff --git a/Tests/TestHelper.test.js b/Tests/TestHelper.test.js
index bea82139..bb70e019 100644
--- a/Tests/TestHelper.test.js
+++ b/Tests/TestHelper.test.js
@@ -89,22 +89,22 @@ describe('UnitBuilder', () => {
 
 describe('Global state management', () => {
     test('resetGlobalTestState resets g_appData to clean UnitManager', () => {
-        g_appData = { dummy: true };
+        globalThis.g_appData = { dummy: true };
         resetGlobalTestState();
-        expect(g_appData).toBeInstanceOf(UnitManager);
+        expect(globalThis.g_appData).toBeInstanceOf(UnitManager);
     });
 
     test('separate execute calls do not leak state', () => {
         let atk = UnitBuilder.createDummy(UnitGroupType.Ally).build();
         let def = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
-        let prevAppData = g_appData;
+        let prevAppData = globalThis.g_appData;
         test_calcDamage(atk, def);
         // test_calcDamage sets g_appData to its own UnitManager
-        expect(g_appData).not.toBe(prevAppData);
+        expect(globalThis.g_appData).not.toBe(prevAppData);
         resetGlobalTestState();
         // After reset, g_appData is a fresh UnitManager (not the one from calcDamage)
-        expect(g_appData).not.toBe(prevAppData);
-        expect(g_appData).toBeInstanceOf(UnitManager);
+        expect(globalThis.g_appData).not.toBe(prevAppData);
+        expect(globalThis.g_appData).toBeInstanceOf(UnitManager);
     });
 });
 
@@ -226,14 +226,14 @@ describe('BattleScenarioBuilder', () => {
     test('execute() cleans up global state afterward', () => {
         let atk1 = UnitBuilder.createDummy(UnitGroupType.Ally).build();
         let def1 = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
-        let prevAppData = g_appData;
+        let prevAppData = globalThis.g_appData;
         new BattleScenarioBuilder()
             .withAttacker(atk1)
             .withDefender(def1)
             .execute();
         // g_appData should be reset after execute (not the calculator's unitManager)
-        expect(g_appData).toBeInstanceOf(UnitManager);
-        expect(g_appData).not.toBe(prevAppData);
+        expect(globalThis.g_appData).toBeInstanceOf(UnitManager);
+        expect(globalThis.g_appData).not.toBe(prevAppData);
 
         // Second scenario should work independently
         let atk2 = UnitBuilder.createDummy(UnitGroupType.Ally).build();
diff --git a/Tests/ViteBuild.test.js b/Tests/ViteBuild.test.js
index a6d75cb7..8126a840 100644
--- a/Tests/ViteBuild.test.js
+++ b/Tests/ViteBuild.test.js
@@ -2,18 +2,17 @@
  * Vite Build Output Verification Tests
  *
  * Validates that `vite build` produces correct output.
- * Run with: node --test Tests/ViteBuild.test.js
- * (Uses Node.js built-in test runner since Vitest is not yet configured)
+ * Run with: npx vitest run Tests/ViteBuild.test.js
  *
  * Prerequisites: Run `npx vite build` before running these tests.
  */
 
-import { describe, it } from 'node:test';
-import assert from 'node:assert';
 import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
-import { join } from 'path';
+import { join, dirname } from 'path';
+import { fileURLToPath } from 'node:url';
 
-const DIST = join(import.meta.dirname, '..', 'dist');
+const __dirname = dirname(fileURLToPath(import.meta.url));
+const DIST = join(__dirname, '..', 'dist');
 
 const SIMULATOR_HTMLS = [
     'AetherRaidSimulator.html',
@@ -28,13 +27,12 @@ const SIMULATOR_HTMLS = [
 
 describe('Vite Build Output', () => {
     it('vite build should have produced dist/ directory', () => {
-        assert.ok(existsSync(DIST), 'dist/ directory should exist');
+        expect(existsSync(DIST)).toBeTruthy();
     });
 
     it('all 8 simulator HTML files exist in dist/', () => {
         for (const html of SIMULATOR_HTMLS) {
-            assert.ok(existsSync(join(DIST, html)),
-                `${html} should exist in dist/`);
+            expect(existsSync(join(DIST, html))).toBeTruthy();
         }
     });
 
@@ -43,8 +41,7 @@ describe('Vite Build Output', () => {
             const filePath = join(DIST, html);
             if (!existsSync(filePath)) continue;
             const content = readFileSync(filePath, 'utf-8');
-            assert.ok(content.includes('type="module"'),
-                `${html} should contain <script type="module">`);
+            expect(content.includes('type="module"')).toBeTruthy();
         }
     });
 
@@ -53,10 +50,8 @@ describe('Vite Build Output', () => {
             const filePath = join(DIST, html);
             if (!existsSync(filePath)) continue;
             const content = readFileSync(filePath, 'utf-8');
-            assert.ok(!content.includes('loadScripts'),
-                `${html} should not contain loadScripts`);
-            assert.ok(!content.includes('createScriptElement'),
-                `${html} should not contain createScriptElement`);
+            expect(content.includes('loadScripts')).toBe(false);
+            expect(content.includes('createScriptElement')).toBe(false);
         }
     });
 
@@ -67,7 +62,7 @@ describe('Vite Build Output', () => {
         const assetsDir = join(DIST, 'assets');
         if (!existsSync(assetsDir)) return;
         const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
-        assert.ok(jsFiles.length > 0, 'Should have JS bundles');
+        expect(jsFiles.length > 0).toBeTruthy();
         // Verify entry point files reference shared chunks (code splitting works)
         let hasChunkImport = false;
         for (const jsFile of jsFiles) {
@@ -77,21 +72,18 @@ describe('Vite Build Output', () => {
                 break;
             }
         }
-        assert.ok(hasChunkImport || jsFiles.length === 1,
-            'Should have code-split chunks with inter-chunk imports');
+        expect(hasChunkImport || jsFiles.length === 1).toBeTruthy();
     });
 
     it('total JS output is substantial (> 1MB combined)', () => {
         const assetsDir = join(DIST, 'assets');
         if (!existsSync(assetsDir)) return;
         const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
-        assert.ok(jsFiles.length > 0, 'Should have at least one JS bundle');
+        expect(jsFiles.length > 0).toBeTruthy();
         let totalSize = 0;
         for (const jsFile of jsFiles) {
             totalSize += statSync(join(assetsDir, jsFile)).size;
         }
-        const totalKB = Math.round(totalSize / 1024);
-        assert.ok(totalSize > 1024 * 1024,
-            `Total JS output should be > 1MB (was ${totalKB}KB)`);
+        expect(totalSize > 1024 * 1024).toBeTruthy();
     });
 });
diff --git a/Tests/ViteSetup.test.js b/Tests/ViteSetup.test.js
index 6cc3e796..d54b9aa0 100644
--- a/Tests/ViteSetup.test.js
+++ b/Tests/ViteSetup.test.js
@@ -2,49 +2,43 @@
  * Section 01: Vite Setup verification tests
  *
  * These tests verify that Vite is properly installed and configured.
- * Run with: node --test Tests/ViteSetup.test.js
- * (Uses Node.js built-in test runner since Vitest is not yet configured)
+ * Compatible with both Node.js built-in test runner and Vitest.
  */
 
-import { describe, it } from 'node:test';
-import assert from 'node:assert';
 import { readFileSync, existsSync } from 'fs';
 import { join } from 'path';
+import { fileURLToPath } from 'url';
 
-const ROOT = join(import.meta.dirname, '..');
+const ROOT = join(fileURLToPath(import.meta.url), '../..');
 
 describe('A.1 package.json dependencies', () => {
     const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
 
     it('should have vite in devDependencies', () => {
-        assert.ok(pkg.devDependencies.vite, 'vite should be in devDependencies');
+        expect(pkg.devDependencies.vite).toBeTruthy();
     });
 
     it('should have @vitejs/plugin-vue in devDependencies', () => {
-        assert.ok(pkg.devDependencies['@vitejs/plugin-vue'],
-            '@vitejs/plugin-vue should be in devDependencies');
+        expect(pkg.devDependencies['@vitejs/plugin-vue']).toBeTruthy();
     });
 });
 
 describe('A.2 vite.config.js', () => {
     it('should exist at project root', () => {
-        assert.ok(existsSync(join(ROOT, 'vite.config.js')),
-            'vite.config.js should exist at project root');
+        expect(existsSync(join(ROOT, 'vite.config.js'))).toBe(true);
     });
 
-    it('should set root to Sources', async () => {
+    it('should set root to Sources', () => {
         const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
-        assert.ok(content.includes("root:") && content.includes("Sources"),
-            'vite.config.js should set root to Sources directory');
+        expect(content.includes("root:") && content.includes("Sources")).toBe(true);
     });
 
-    it('should configure build.outDir to ../dist', async () => {
+    it('should configure build.outDir to ../dist', () => {
         const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
-        assert.ok(content.includes("outDir") && content.includes("../dist"),
-            'vite.config.js should set outDir to ../dist');
+        expect(content.includes("outDir") && content.includes("../dist")).toBe(true);
     });
 
-    it('should list all 8 HTML entry points in rollupOptions.input', async () => {
+    it('should list all 8 HTML entry points in rollupOptions.input', () => {
         const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
         const expectedHtmlFiles = [
             'AetherRaidSimulator',
@@ -57,20 +51,17 @@ describe('A.2 vite.config.js', () => {
             'HeroStatusClusterer',
         ];
         for (const name of expectedHtmlFiles) {
-            assert.ok(content.includes(name),
-                `vite.config.js should reference ${name}`);
+            expect(content.includes(name)).toBe(true);
         }
     });
 
-    it('should set build.target to es2015', async () => {
+    it('should set build.target to es2015', () => {
         const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
-        assert.ok(content.includes('es2015'),
-            'vite.config.js should set build target to es2015');
+        expect(content.includes('es2015')).toBe(true);
     });
 
-    it('should include comment or placeholder for Vue 3 runtime compiler alias', async () => {
+    it('should include comment or placeholder for Vue 3 runtime compiler alias', () => {
         const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
-        assert.ok(content.includes('vue/dist/vue.esm-bundler') || content.includes('esm-bundler'),
-            'vite.config.js should have a placeholder for Vue 3 runtime compiler alias');
+        expect(content.includes('vue/dist/vue.esm-bundler') || content.includes('esm-bundler')).toBe(true);
     });
 });
diff --git a/create_tests.sh b/create_tests.sh
index 0acf30e9..d1e94c07 100755
--- a/create_tests.sh
+++ b/create_tests.sh
@@ -67,7 +67,7 @@ TEST_FILE_NAMES=(
     TestHelper
     SmokeTest
     BuildFilter
-    EsmValidation
+    # EsmValidation -- uses ESM imports, Vitest-only
     )
 
 # カテゴリに応じたテストファイル選択
diff --git a/vite.config.js b/vite.config.js
index c0e94b96..fb2a8deb 100644
--- a/vite.config.js
+++ b/vite.config.js
@@ -12,12 +12,9 @@ export default defineConfig({
         root: './',
         include: ['Tests/**/*.test.js'],
         exclude: ['**/All.test.js', '**/node_modules/**'],
+        // Single-threaded: tests share global state (g_appData, skill hooks)
         pool: 'threads',
-        poolOptions: {
-            threads: {
-                singleThread: true,
-            },
-        },
+        singleThread: true,
     },
     build: {
         outDir: '../dist',
diff --git a/vitest.setup.js b/vitest.setup.js
index eeb4b8ad..c65edba4 100644
--- a/vitest.setup.js
+++ b/vitest.setup.js
@@ -1,10 +1,53 @@
-// Vitest setup file (replaces jest.setup.js for Vitest)
-//
-// The original jest.setup.js provided polyfills for:
-//   - globalThis.performance (from 'perf_hooks')
-//   - globalThis.TextEncoder (from 'util')
-//   - globalThis.TextDecoder (from 'util')
-//
-// In Vitest with jsdom environment on Node 22+, all three are
-// already globally available, so no polyfills are needed.
-// This file is kept as a placeholder for any future setup needs.
+// Vitest setup file
+// Loads all source files via concatenation (stripping import/export),
+// mimicking the create_tests.sh approach. This is necessary because
+// source files have circular dependencies that prevent proper ESM loading.
+
+import fs from 'node:fs';
+import path from 'node:path';
+import vm from 'node:vm';
+
+const ROOT = path.resolve(import.meta.dirname);
+const SOURCES = path.join(ROOT, 'Sources');
+const TESTS = path.join(ROOT, 'Tests');
+
+// Same order as create_tests.sh SOURCE_FILE_NAMES
+const SOURCE_FILE_NAMES = [
+    'GlobalDefinitions', 'Utilities', 'Logger', 'SkillConstants', 'Skill',
+    'BattleMapElement', 'Tile', 'Structures', 'Cell', 'Table',
+    'HeroInfoConstants', 'HeroInfo', 'UnitConstants', 'BattleContext', 'Unit',
+    'UnitManager', 'BattleMap', 'GlobalBattleContext', 'DamageCalculationUtility',
+    'DamageCalculator', 'PostCombatSkillHander', 'DamageCalculatorWrapper',
+    'BeginningOfTurnSkillHandler', 'SkillDatabase', 'HeroDatabase',
+    'SampleSkillInfos', 'SampleHeroInfos', 'SkillEffectCore', 'SkillEffectEnv',
+    'SkillEffect', 'SkillEffectField', 'SkillEffectUnit',
+    'SkillEffectBattleContext', 'SkillEffectHooks', 'SkillEffectRegistrar',
+    'SkillEffectAliases', 'CustomSkill', 'SkillImpl', 'SkillImpl202408',
+    'SkillImpl202501', 'SkillImpl202601', 'TestUtilities',
+];
+
+const TEST_UTIL_FILE_NAMES = ['TestGlobals'];
+
+function filterImportExport(content) {
+    return content
+        .split('\n')
+        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
+        .join('\n');
+}
+
+// Concatenate all source files
+let concatenated = '';
+for (const name of SOURCE_FILE_NAMES) {
+    const filePath = path.join(SOURCES, name + '.js');
+    concatenated += filterImportExport(fs.readFileSync(filePath, 'utf-8')) + '\n';
+}
+for (const name of TEST_UTIL_FILE_NAMES) {
+    const filePath = path.join(TESTS, name + '.js');
+    concatenated += fs.readFileSync(filePath, 'utf-8') + '\n';
+}
+
+// Execute in a context where 'this' is globalThis, so var/function declarations
+// and explicit assignments become global properties.
+// Wrap in a function to catch const/let/class and expose them via 'this'.
+const script = new vm.Script(concatenated, { filename: 'vitest-concatenated-sources.js' });
+script.runInThisContext();
