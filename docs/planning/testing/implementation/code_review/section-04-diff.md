diff --git a/Tests/Performance.test.js b/Tests/Performance.test.js
index 9746c3f7..59bcd626 100644
--- a/Tests/Performance.test.js
+++ b/Tests/Performance.test.js
@@ -1,4 +1,88 @@
-describe('Performance Benchmarks', () => {
-    // テストはsection-04で追加
-    test('placeholder', () => {});
+describe('Performance benchmarks', () => {
+    const isCI = !!process.env.CI;
+
+    function runBenchmark(operation, ciThreshold, localThreshold, warmupCount = 2) {
+        const threshold = isCI ? ciThreshold : localThreshold;
+
+        // Warmup iterations
+        for (let i = 0; i < warmupCount; i++) {
+            operation();
+        }
+
+        // Measured run
+        const start = performance.now();
+        operation();
+        const duration = performance.now() - start;
+
+        expect(duration).toBeLessThan(threshold);
+    }
+
+    test('全英雄戦闘計算が閾値以内で完了する', () => {
+        let heroDatabase = g_testHeroDatabase;
+        let atkUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Ally);
+        let defUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
+
+        function runAllHeroBattle() {
+            let calculator = new test_DamageCalculator();
+            calculator.map.getTile(0, 2).setUnit(atkUnit);
+            calculator.map.getTile(0, 0).setUnit(defUnit);
+            calculator.unitManager.units = [atkUnit, defUnit];
+            calculator.isLogEnabled = false;
+            g_appData = calculator.unitManager;
+
+            atkUnit.weaponRefinement = WeaponRefinementType.Special;
+            defUnit.weaponRefinement = WeaponRefinementType.Special;
+            for (let heroInfo of heroDatabase.enumerateHeroInfos()) {
+                heroDatabase.initUnit(atkUnit, heroInfo.name);
+                heroDatabase.initUnit(defUnit, heroInfo.name);
+                try {
+                    calculator.calcDamage(atkUnit, defUnit, false);
+                } catch (e) {
+                    // Skip heroes with known skill implementation issues
+                }
+                atkUnit.hp = atkUnit.maxHpWithSkills;
+                defUnit.hp = defUnit.maxHpWithSkills;
+            }
+            resetGlobalTestState();
+        }
+
+        runBenchmark(runAllHeroBattle, 3000, 1500);
+    });
+
+    test('ターン開始スキル適用（全英雄）が閾値以内で完了する', () => {
+        let heroDatabase = g_testHeroDatabase;
+        let unit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Ally);
+        let allyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Ally);
+        let enemyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
+        let enemyAllyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
+
+        runBenchmark(() => {
+            let handler = new test_BeginningOfTurnSkillHandler();
+            handler.map.getTile(0, 2).setUnit(unit);
+            handler.map.getTile(0, 0).setUnit(allyUnit);
+            handler.map.getTile(2, 2).setUnit(enemyUnit);
+            handler.map.getTile(2, 0).setUnit(enemyAllyUnit);
+            handler.unitManager.units = [unit, allyUnit, enemyUnit, enemyAllyUnit];
+            handler.battleContext.currentTurn = 1;
+            g_appData = handler.unitManager;
+
+            unit.weaponRefinement = WeaponRefinementType.Special;
+            for (let heroInfo of heroDatabase.enumerateHeroInfos()) {
+                heroDatabase.initUnit(unit, heroInfo.name);
+                handler.applySkillsForBeginningOfTurn(unit);
+            }
+            resetGlobalTestState();
+        }, 2000, 800);
+    });
+
+    test('ユニット初期化（全英雄生成）が閾値以内で完了する', () => {
+        let heroDatabase = g_testHeroDatabase;
+        let unit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Ally);
+
+        runBenchmark(() => {
+            for (let heroInfo of heroDatabase.enumerateHeroInfos()) {
+                heroDatabase.initUnit(unit, heroInfo.name);
+            }
+        }, 500, 200);
+    });
 });
diff --git a/jest.config.js b/jest.config.js
index a530cbe6..c2ba9937 100644
--- a/jest.config.js
+++ b/jest.config.js
@@ -18,14 +18,14 @@ module.exports = {
   // Automatically clear mock calls and instances between every test
   clearMocks: true,
 
-  // Indicates whether the coverage information should be collected while executing the test
-  // collectCoverage: false,
+  // Collect coverage only in CI (GitHub Actions sets CI=true)
+  collectCoverage: !!process.env.CI,
 
   // An array of glob patterns indicating a set of files for which coverage information should be collected
   // collectCoverageFrom: undefined,
 
-  // The directory where Jest should output its coverage files
-  // coverageDirectory: undefined,
+  // Output directory for coverage reports
+  coverageDirectory: "coverage",
 
   // An array of regexp pattern strings used to skip coverage collection
   // coveragePathIgnorePatterns: [
@@ -35,13 +35,8 @@ module.exports = {
   // Indicates which provider should be used to instrument code for coverage
   coverageProvider: "v8",
 
-  // A list of reporter names that Jest uses when writing coverage reports
-  // coverageReporters: [
-  //   "json",
-  //   "text",
-  //   "lcov",
-  //   "clover"
-  // ],
+  // Reporter formats: summary for terminal, lcov for HTML, json-summary for tooling
+  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
 
   // An object that configures minimum threshold enforcement for coverage results
   // coverageThreshold: undefined,
