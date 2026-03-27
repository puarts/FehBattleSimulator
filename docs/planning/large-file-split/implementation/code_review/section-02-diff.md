diff --git a/Deploy.bat b/Deploy.bat
index 78db5e72..608bc43d 100644
--- a/Deploy.bat
+++ b/Deploy.bat
@@ -18,7 +18,7 @@ set BF=%BF%,map\BattleMapElement,map\Tile,map\BattleMap,map\BattleMapSettings,ma
 rem ���j�b�g�E���
 set BF=%BF%,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,unit\GlobalBattleContext
 rem �v�Z���W�b�N
-set BF=%BF%,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\DamageCalculatorWrapper
+set BF=%BF%,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper
 set BF=%BF%,combat\BeginningOfTurnSkillHandler
 rem �f�[�^�x�[�X�E�ݒ�
 set BF=%BF%,database\SkillDatabase,database\HeroDatabase,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets
@@ -42,10 +42,10 @@ rem �X�e�[�^�X�v�Z�@
 call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator core\GlobalDefinitions,core\Utilities,data\SkillConstants,data\Skill,map\BattleMapElement,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,pages\StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem ���j�b�g�r���_�[
-call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem �_���[�W�v�Z�@
-call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem �p�Y�A�C�R�����X�g
 call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,data\HeroInfoConstants,data\HeroInfo,database\HeroDatabase,pages\HeroIconListerMain,database\SampleHeroInfos,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
diff --git a/Sources/AetherRaidSimulator.html b/Sources/AetherRaidSimulator.html
index e2293bb8..350b3175 100644
--- a/Sources/AetherRaidSimulator.html
+++ b/Sources/AetherRaidSimulator.html
@@ -1479,6 +1479,7 @@
                     "combat/DamageCalculator.js",
                     "combat/PostCombatSkillHander.js",
                     "combat/PerformanceProfile.js",
+                    "combat/ScopedTileChanger.js",
                     "combat/DamageCalculatorWrapper.js",
                     "combat/BeginningOfTurnSkillHandler.js",
                     "unit/TurnSetting.js",
diff --git a/Sources/ArenaSimulator.html b/Sources/ArenaSimulator.html
index e5748d82..134127de 100644
--- a/Sources/ArenaSimulator.html
+++ b/Sources/ArenaSimulator.html
@@ -1449,6 +1449,7 @@
                     "combat/DamageCalculator.js",
                     "combat/PostCombatSkillHander.js",
                     "combat/PerformanceProfile.js",
+                    "combat/ScopedTileChanger.js",
                     "combat/DamageCalculatorWrapper.js",
                     "combat/BeginningOfTurnSkillHandler.js",
                     "unit/TurnSetting.js",
diff --git a/Sources/DamageCalculator.html b/Sources/DamageCalculator.html
index 92fa86a2..a53c7b96 100644
--- a/Sources/DamageCalculator.html
+++ b/Sources/DamageCalculator.html
@@ -493,6 +493,7 @@
                     "combat/DamageCalculator.js",
                     "combat/PostCombatSkillHander.js",
                     "combat/PerformanceProfile.js",
+                    "combat/ScopedTileChanger.js",
                     "combat/DamageCalculatorWrapper.js",
                     "combat/BeginningOfTurnSkillHandler.js",
                     "app/AudioManager.js",
diff --git a/Sources/SummonerDuelsSimulator.html b/Sources/SummonerDuelsSimulator.html
index b07ac203..ca45eee1 100644
--- a/Sources/SummonerDuelsSimulator.html
+++ b/Sources/SummonerDuelsSimulator.html
@@ -1541,6 +1541,7 @@
                     "combat/DamageCalculator.js",
                     "combat/PostCombatSkillHander.js",
                     "combat/PerformanceProfile.js",
+                    "combat/ScopedTileChanger.js",
                     "combat/DamageCalculatorWrapper.js",
                     "combat/BeginningOfTurnSkillHandler.js",
                     "unit/TurnSetting.js",
diff --git a/Sources/UnitBuilder.html b/Sources/UnitBuilder.html
index 81529b27..4a146eb5 100644
--- a/Sources/UnitBuilder.html
+++ b/Sources/UnitBuilder.html
@@ -1267,6 +1267,7 @@
                     "combat/DamageCalculator.js",
                     "combat/PostCombatSkillHander.js",
                     "combat/PerformanceProfile.js",
+                    "combat/ScopedTileChanger.js",
                     "combat/DamageCalculatorWrapper.js",
                     "combat/BeginningOfTurnSkillHandler.js",
                     "unit/TurnSetting.js",
diff --git a/Sources/combat/DamageCalculatorWrapper.js b/Sources/combat/DamageCalculatorWrapper.js
index d0f8c062..085bd251 100644
--- a/Sources/combat/DamageCalculatorWrapper.js
+++ b/Sources/combat/DamageCalculatorWrapper.js
@@ -1,28 +1,4 @@
 
-class ScopedTileChanger {
-    /**
-     * @param {Unit} atkUnit
-     * @param {Tile} tileToAttack
-     * @param {Function} tileChangedFunc=null
-     */
-    constructor(atkUnit, tileToAttack, tileChangedFunc = null) {
-        this._origTile = atkUnit.placedTile;
-        this._atkUnit = atkUnit;
-        let isTileChanged = tileToAttack !== this._origTile;
-        if (tileToAttack !== null && isTileChanged) {
-            tileToAttack.setUnit(atkUnit);
-            tileChangedFunc?.();
-        }
-    }
-
-    dispose() {
-        if (this._origTile !== this._atkUnit.placedTile) {
-            // ユニットの位置を元に戻す
-            setUnitToTile(this._atkUnit, this._origTile);
-        }
-    }
-}
-
 class DamageCalculatorWrapper {
     /**
      * @param  {UnitManager} unitManager
diff --git a/Sources/combat/ScopedTileChanger.js b/Sources/combat/ScopedTileChanger.js
new file mode 100644
index 00000000..9b9fd9b8
--- /dev/null
+++ b/Sources/combat/ScopedTileChanger.js
@@ -0,0 +1,25 @@
+/* global setUnitToTile */
+
+class ScopedTileChanger {
+    /**
+     * @param {Unit} atkUnit
+     * @param {Tile} tileToAttack
+     * @param {Function} tileChangedFunc=null
+     */
+    constructor(atkUnit, tileToAttack, tileChangedFunc = null) {
+        this._origTile = atkUnit.placedTile;
+        this._atkUnit = atkUnit;
+        let isTileChanged = tileToAttack !== this._origTile;
+        if (tileToAttack !== null && isTileChanged) {
+            tileToAttack.setUnit(atkUnit);
+            tileChangedFunc?.();
+        }
+    }
+
+    dispose() {
+        if (this._origTile !== this._atkUnit.placedTile) {
+            // ユニットの位置を元に戻す
+            setUnitToTile(this._atkUnit, this._origTile);
+        }
+    }
+}
diff --git a/Tests/ScopedTileChanger.test.js b/Tests/ScopedTileChanger.test.js
new file mode 100644
index 00000000..0cfcba6b
--- /dev/null
+++ b/Tests/ScopedTileChanger.test.js
@@ -0,0 +1,9 @@
+describe('ScopedTileChanger', () => {
+    test('ScopedTileChangerクラスがグローバルスコープに存在する', () => {
+        expect(typeof ScopedTileChanger).toBe('function');
+    });
+
+    test('DamageCalculatorWrapper内からScopedTileChangerが利用可能である', () => {
+        expect(typeof ScopedTileChanger).toBe('function');
+    });
+});
diff --git a/create_tests.sh b/create_tests.sh
index 0948186f..aefd8180 100755
--- a/create_tests.sh
+++ b/create_tests.sh
@@ -23,6 +23,7 @@ SOURCE_FILE_NAMES=(
     combat/DamageCalculator
     combat/PostCombatSkillHander
     combat/PerformanceProfile
+    combat/ScopedTileChanger
     combat/DamageCalculatorWrapper
     combat/BeginningOfTurnSkillHandler
     database/SkillDatabase
@@ -67,6 +68,7 @@ TEST_FILE_NAMES=(
     Performance
     TestHelper
     FileSplit
+    ScopedTileChanger
     )
 
 # カテゴリに応じたテストファイル選択
