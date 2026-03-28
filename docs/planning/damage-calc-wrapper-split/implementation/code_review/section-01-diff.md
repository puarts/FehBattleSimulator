diff --git a/Sources/combat/DamageCalculatorWrapper.js b/Sources/combat/DamageCalculatorWrapper.js
index 085bd251..588b6db7 100644
--- a/Sources/combat/DamageCalculatorWrapper.js
+++ b/Sources/combat/DamageCalculatorWrapper.js
@@ -17139,3 +17139,17 @@ class DamageCalculatorWrapper {
         damageCalcEnv.applySkill('全ての条件決定後', damageCalcEnv.atkUnit, damageCalcEnv.defUnit, applySkill, this);
     }
 }
+
+DamageCalculatorWrapper.definePrototypeMethods = function(methods) {
+    for (const [name, fn] of Object.entries(methods)) {
+        if (Object.prototype.hasOwnProperty.call(DamageCalculatorWrapper.prototype, name)) {
+            throw new Error(`Duplicate prototype method: ${name}`);
+        }
+        Object.defineProperty(DamageCalculatorWrapper.prototype, name, {
+            value: fn,
+            writable: true,
+            configurable: true,
+            enumerable: false,
+        });
+    }
+};
diff --git a/Tests/DamageCalculatorWrapperSplit.test.js b/Tests/DamageCalculatorWrapperSplit.test.js
new file mode 100644
index 00000000..e03b3f4b
--- /dev/null
+++ b/Tests/DamageCalculatorWrapperSplit.test.js
@@ -0,0 +1,83 @@
+// DamageCalculatorWrapper 分割リファクタリング検証テスト
+
+describe('DamageCalculatorWrapper split verification', () => {
+
+    // --- definePrototypeMethods ヘルパー ---
+
+    describe('definePrototypeMethods helper', () => {
+        const testMethodName = '__test_defineProto_callable';
+
+        afterEach(() => {
+            delete DamageCalculatorWrapper.prototype[testMethodName];
+        });
+
+        test('definePrototypeMethods でメソッドを追加するとインスタンスから呼び出せる', () => {
+            DamageCalculatorWrapper.definePrototypeMethods({
+                [testMethodName]: function() { return 42; },
+            });
+            const calc = new test_DamageCalculator();
+            expect(calc.damageCalc[testMethodName]()).toBe(42);
+        });
+
+        test('追加されたメソッドが non-enumerable である', () => {
+            DamageCalculatorWrapper.definePrototypeMethods({
+                [testMethodName]: function() {},
+            });
+            expect(Object.keys(DamageCalculatorWrapper.prototype)).not.toContain(testMethodName);
+        });
+
+        test('同名メソッドを二重に追加すると Error がスローされる', () => {
+            DamageCalculatorWrapper.definePrototypeMethods({
+                [testMethodName]: function() {},
+            });
+            expect(() => {
+                DamageCalculatorWrapper.definePrototypeMethods({
+                    [testMethodName]: function() {},
+                });
+            }).toThrow('Duplicate prototype method');
+        });
+    });
+
+    // --- constructor smoke test ---
+
+    describe('constructor smoke test', () => {
+        test('DamageCalculatorWrapper がエラーなくインスタンス化できる', () => {
+            expect(() => new test_DamageCalculator()).not.toThrow();
+        });
+
+        test('インスタンスが内部オブジェクトを保持している', () => {
+            const calc = new test_DamageCalculator();
+            expect(calc.damageCalc._damageCalc).toBeDefined();
+            expect(calc.damageCalc._combatHander).toBeDefined();
+            expect(calc.damageCalc.profiler).toBeDefined();
+        });
+    });
+
+    // --- public API names assertion ---
+
+    describe('public API names assertion', () => {
+        test('DamageCalculatorWrapper.prototype が全 public メソッド名を持つ', () => {
+            const expectedPublicMethods = [
+                'clearLog', 'writeLog', 'writeDebugLog',
+                'updateDamageCalculation', 'calcDamageTemporary', 'calcDamage',
+                'calcPreCombatResult', 'calcPrecombatSpecialDamage',
+                'calcPrecombatSpecialResult', 'calcCombatResult',
+                'applyBeastCavalryRefinedSkillEffect',
+                'addFixedDamageByStatus', 'applyFixedValueSkill',
+                'applyDamageReductionByOwnStatus',
+                'canCounterAttack', 'getFollowupAttackPriorityForBoth',
+                'enumerateUnitsInTheSameGroupWithinSpecifiedSpaces',
+                'enumerateUnitsInDifferentGroupWithinSpecifiedSpaces',
+                'enumerateUnitsInTheSameGroupOnMap',
+                'enumerateUnitsInDifferentGroupOnMap',
+                'updateAllUnitSpur', 'updateUnitSpur',
+                'applySkillEffectsAfterAfterBeginningOfCombat',
+                'applySkillEffectsAfterAfterBeginningOfCombatFromAllies',
+                'applySkillEffectAfterConditionDetermined',
+            ];
+            for (const name of expectedPublicMethods) {
+                expect(typeof DamageCalculatorWrapper.prototype[name]).toBe('function');
+            }
+        });
+    });
+});
diff --git a/create_tests.sh b/create_tests.sh
index 69aa66ad..271f0073 100755
--- a/create_tests.sh
+++ b/create_tests.sh
@@ -73,6 +73,7 @@ TEST_FILE_NAMES=(
     ScopedTileChanger
     UnitContext
     UnitUtility
+    DamageCalculatorWrapperSplit
     )
 
 # カテゴリに応じたテストファイル選択
