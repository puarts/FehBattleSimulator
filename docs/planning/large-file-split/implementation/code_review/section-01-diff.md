diff --git a/Deploy.bat b/Deploy.bat
index aa88f1a4..78db5e72 100644
--- a/Deploy.bat
+++ b/Deploy.bat
@@ -18,7 +18,7 @@ set BF=%BF%,map\BattleMapElement,map\Tile,map\BattleMap,map\BattleMapSettings,ma
 rem ���j�b�g�E���
 set BF=%BF%,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,unit\GlobalBattleContext
 rem �v�Z���W�b�N
-set BF=%BF%,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\DamageCalculatorWrapper
+set BF=%BF%,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\DamageCalculatorWrapper
 set BF=%BF%,combat\BeginningOfTurnSkillHandler
 rem �f�[�^�x�[�X�E�ݒ�
 set BF=%BF%,database\SkillDatabase,database\HeroDatabase,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets
@@ -42,10 +42,10 @@ rem �X�e�[�^�X�v�Z�@
 call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator core\GlobalDefinitions,core\Utilities,data\SkillConstants,data\Skill,map\BattleMapElement,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,pages\StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem ���j�b�g�r���_�[
-call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem �_���[�W�v�Z�@
-call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem �p�Y�A�C�R�����X�g
 call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,data\HeroInfoConstants,data\HeroInfo,database\HeroDatabase,pages\HeroIconListerMain,database\SampleHeroInfos,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
diff --git a/Sources/AetherRaidSimulator.html b/Sources/AetherRaidSimulator.html
index eeb7f43d..e2293bb8 100644
--- a/Sources/AetherRaidSimulator.html
+++ b/Sources/AetherRaidSimulator.html
@@ -1478,6 +1478,7 @@
                     "combat/DamageCalculationUtility.js",
                     "combat/DamageCalculator.js",
                     "combat/PostCombatSkillHander.js",
+                    "combat/PerformanceProfile.js",
                     "combat/DamageCalculatorWrapper.js",
                     "combat/BeginningOfTurnSkillHandler.js",
                     "unit/TurnSetting.js",
diff --git a/Sources/ArenaSimulator.html b/Sources/ArenaSimulator.html
index 31c09d20..e5748d82 100644
--- a/Sources/ArenaSimulator.html
+++ b/Sources/ArenaSimulator.html
@@ -1448,6 +1448,7 @@
                     "combat/DamageCalculationUtility.js",
                     "combat/DamageCalculator.js",
                     "combat/PostCombatSkillHander.js",
+                    "combat/PerformanceProfile.js",
                     "combat/DamageCalculatorWrapper.js",
                     "combat/BeginningOfTurnSkillHandler.js",
                     "unit/TurnSetting.js",
diff --git a/Sources/DamageCalculator.html b/Sources/DamageCalculator.html
index 5bb16be8..92fa86a2 100644
--- a/Sources/DamageCalculator.html
+++ b/Sources/DamageCalculator.html
@@ -492,6 +492,7 @@
                     "combat/DamageCalculationUtility.js",
                     "combat/DamageCalculator.js",
                     "combat/PostCombatSkillHander.js",
+                    "combat/PerformanceProfile.js",
                     "combat/DamageCalculatorWrapper.js",
                     "combat/BeginningOfTurnSkillHandler.js",
                     "app/AudioManager.js",
diff --git a/Sources/SummonerDuelsSimulator.html b/Sources/SummonerDuelsSimulator.html
index 4d044092..b07ac203 100644
--- a/Sources/SummonerDuelsSimulator.html
+++ b/Sources/SummonerDuelsSimulator.html
@@ -1540,6 +1540,7 @@
                     "combat/DamageCalculationUtility.js",
                     "combat/DamageCalculator.js",
                     "combat/PostCombatSkillHander.js",
+                    "combat/PerformanceProfile.js",
                     "combat/DamageCalculatorWrapper.js",
                     "combat/BeginningOfTurnSkillHandler.js",
                     "unit/TurnSetting.js",
diff --git a/Sources/UnitBuilder.html b/Sources/UnitBuilder.html
index 0983f975..81529b27 100644
--- a/Sources/UnitBuilder.html
+++ b/Sources/UnitBuilder.html
@@ -1266,6 +1266,7 @@
                     "combat/DamageCalculationUtility.js",
                     "combat/DamageCalculator.js",
                     "combat/PostCombatSkillHander.js",
+                    "combat/PerformanceProfile.js",
                     "combat/DamageCalculatorWrapper.js",
                     "combat/BeginningOfTurnSkillHandler.js",
                     "unit/TurnSetting.js",
diff --git a/Sources/combat/DamageCalculatorWrapper.js b/Sources/combat/DamageCalculatorWrapper.js
index 8bd29be3..d0f8c062 100644
--- a/Sources/combat/DamageCalculatorWrapper.js
+++ b/Sources/combat/DamageCalculatorWrapper.js
@@ -1,32 +1,4 @@
 
-class PerformanceProfile {
-    constructor() {
-        this.elaspedMilliseconds = {};
-        this.isEnabled = true;
-    }
-
-    addElaspedMilliseconds(name, ms) {
-        if (name in this.elaspedMilliseconds) {
-            this.elaspedMilliseconds[name] += ms;
-        }
-        else {
-            this.elaspedMilliseconds[name] = ms;
-        }
-    }
-
-    profile(name, func) {
-        if (this.isEnabled) {
-            const startTime = performance.now();
-            const result = func();
-            this.addElaspedMilliseconds(name, performance.now() - startTime);
-            return result;
-        }
-        else {
-            return func();
-        }
-    }
-}
-
 class ScopedTileChanger {
     /**
      * @param {Unit} atkUnit
diff --git a/Sources/combat/PerformanceProfile.js b/Sources/combat/PerformanceProfile.js
new file mode 100644
index 00000000..46203bb6
--- /dev/null
+++ b/Sources/combat/PerformanceProfile.js
@@ -0,0 +1,28 @@
+
+class PerformanceProfile {
+    constructor() {
+        this.elaspedMilliseconds = {};
+        this.isEnabled = true;
+    }
+
+    addElaspedMilliseconds(name, ms) {
+        if (name in this.elaspedMilliseconds) {
+            this.elaspedMilliseconds[name] += ms;
+        }
+        else {
+            this.elaspedMilliseconds[name] = ms;
+        }
+    }
+
+    profile(name, func) {
+        if (this.isEnabled) {
+            const startTime = performance.now();
+            const result = func();
+            this.addElaspedMilliseconds(name, performance.now() - startTime);
+            return result;
+        }
+        else {
+            return func();
+        }
+    }
+}
diff --git a/Tests/FileSplit.test.js b/Tests/FileSplit.test.js
new file mode 100644
index 00000000..4a5fef8a
--- /dev/null
+++ b/Tests/FileSplit.test.js
@@ -0,0 +1,29 @@
+// ファイル分割リファクタリングのシンボル可視性テスト
+
+// PerformanceProfile
+test('PerformanceProfile_class_exists_in_global_scope', () => {
+    expect(typeof PerformanceProfile).toBe('function');
+});
+
+test('PerformanceProfile_can_create_instance', () => {
+    const profile = new PerformanceProfile();
+    expect(profile).toBeInstanceOf(PerformanceProfile);
+    expect(profile.isEnabled).toBe(true);
+    expect(profile.elaspedMilliseconds).toEqual({});
+});
+
+test('PerformanceProfile_profile_executes_callback_and_records_time', () => {
+    const profile = new PerformanceProfile();
+    const result = profile.profile('test', () => 42);
+    expect(result).toBe(42);
+    expect('test' in profile.elaspedMilliseconds).toBe(true);
+    expect(typeof profile.elaspedMilliseconds['test']).toBe('number');
+});
+
+test('PerformanceProfile_addElaspedMilliseconds_accumulates', () => {
+    const profile = new PerformanceProfile();
+    profile.addElaspedMilliseconds('calc', 10);
+    expect(profile.elaspedMilliseconds['calc']).toBe(10);
+    profile.addElaspedMilliseconds('calc', 5);
+    expect(profile.elaspedMilliseconds['calc']).toBe(15);
+});
diff --git a/create_tests.sh b/create_tests.sh
index e61f154a..0948186f 100755
--- a/create_tests.sh
+++ b/create_tests.sh
@@ -22,6 +22,7 @@ SOURCE_FILE_NAMES=(
     combat/DamageCalculationUtility
     combat/DamageCalculator
     combat/PostCombatSkillHander
+    combat/PerformanceProfile
     combat/DamageCalculatorWrapper
     combat/BeginningOfTurnSkillHandler
     database/SkillDatabase
@@ -65,6 +66,7 @@ TEST_FILE_NAMES=(
     DslNode
     Performance
     TestHelper
+    FileSplit
     )
 
 # カテゴリに応じたテストファイル選択
