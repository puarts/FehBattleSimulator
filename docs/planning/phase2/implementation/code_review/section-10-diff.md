diff --git a/Sources/AetherRaidDefensePresets.js b/Sources/AetherRaidDefensePresets.js
index a81ebbff..994440a9 100644
--- a/Sources/AetherRaidDefensePresets.js
+++ b/Sources/AetherRaidDefensePresets.js
@@ -142,3 +142,5 @@ function findAetherRaidDefensePreset(id) {
     }
     return null;
 }
+
+export { AetherRaidDefensePreset, AetherRaidDefensePresetInfo, AetherRaidDefensePresetOptions_AnimaSeason, AetherRaidDefensePresetOptions_DarkSeason, AetherRaidOffensePresetOptions_AstraSeason, AetherRaidOffensePresetOptions_LightSeason, findAetherRaidDefensePreset };
diff --git a/Sources/AetherRaidSimulatorMain.js b/Sources/AetherRaidSimulatorMain.js
index 825c6bad..0e4a9351 100644
--- a/Sources/AetherRaidSimulatorMain.js
+++ b/Sources/AetherRaidSimulatorMain.js
@@ -27,3 +27,5 @@ function initAetherRaidBoard(
         loadSettings();
     });
 }
+
+export { AetherRaidSimulator, g_app, initAetherRaidBoard };
diff --git a/Sources/AppData.js b/Sources/AppData.js
index 5a99adc0..4f067e39 100644
--- a/Sources/AppData.js
+++ b/Sources/AppData.js
@@ -2504,3 +2504,5 @@ class AppData extends UnitManager {
 }
 
 const g_appData = new AppData();
+
+export { AppData, OcrSettingTarget, SettingCompressMode, ItemType, SelectMode, SelectModeOptions, PawnsOfLokiDifficality, PawnsOfLokiDifficalityOptions, g_idGenerator, g_deffenceStructureContainer, g_offenceStructureContainer, g_appData };
diff --git a/Sources/ArenaSimulatorMain.js b/Sources/ArenaSimulatorMain.js
index c5815825..e22a29ec 100644
--- a/Sources/ArenaSimulatorMain.js
+++ b/Sources/ArenaSimulatorMain.js
@@ -36,3 +36,5 @@ function initAetherRaidBoard(
         }
     });
 }
+
+export { ArenaSimulator, g_app, initAetherRaidBoard };
diff --git a/Sources/BattleSimulatorBase.js b/Sources/BattleSimulatorBase.js
index 6b6a613f..6e8e3c0e 100644
--- a/Sources/BattleSimulatorBase.js
+++ b/Sources/BattleSimulatorBase.js
@@ -12305,3 +12305,5 @@ function importSettingsFromString(
         loadsMapSettings
     );
 }
+
+export { BattleSimulatorBase, MovementAssistResult, MoveResult, OwnerType, ModuleLoadState, hasTargetOptionValue, isTrapActivationResult, determineAssistType, removeTouchEventFromDraggableElements, addTouchEventToDraggableElements, moveStructureToMap, moveStructureToTrashBox, moveStructureToDefenceStorage, moveStructureToOffenceStorage, moveUnitToTrashBox, moveUnitToMap, moveUnit, placeUnitToMap, syncSelectedTileColor, updateMapUi, updateMap, changeMap, removeBreakableWallsFromTrashBox, createMap, resetPlacement, removeAllObjsFromMap, removeAllUnitsFromMap, updateAllUi, loadSettings, loadSettingsFromDict, saveSettings, exportPerTurnSettingAsString, importPerTurnSetting, importSettingsFromString };
diff --git a/Sources/DamageCalculatorMain.js b/Sources/DamageCalculatorMain.js
index bc28b667..05a1e186 100644
--- a/Sources/DamageCalculatorMain.js
+++ b/Sources/DamageCalculatorMain.js
@@ -1103,3 +1103,5 @@ function initDamageCalculator(heroInfos, weaponInfos, supportInfos, specialInfos
         }
     });
 }
+
+export { DamageCalculatorMode, DamageCalcModeOptions, DamageCalcHeroDatabase, DamageCalcData, g_damageCalcData, initDamageCalculator };
diff --git a/Sources/HeroIconListerMain.js b/Sources/HeroIconListerMain.js
index aecbacc3..8f566e04 100644
--- a/Sources/HeroIconListerMain.js
+++ b/Sources/HeroIconListerMain.js
@@ -90,3 +90,5 @@ function init(heroInfos) {
     g_appData.heroInfos = heroInfos;
     g_appData.applyFilter();
 }
+
+export { AppData, g_appData, init };
diff --git a/Sources/KeyRepeatHandler.js b/Sources/KeyRepeatHandler.js
index c3e62b8d..ee8f4c13 100644
--- a/Sources/KeyRepeatHandler.js
+++ b/Sources/KeyRepeatHandler.js
@@ -24,3 +24,5 @@ class KeyRepeatHandler {
         clearTimeout(this._keyRepeatTimeoutId);
     }
 }
+
+export { KeyRepeatHandler };
diff --git a/Sources/Main_ImageProcessing.js b/Sources/Main_ImageProcessing.js
index b1549c0f..648af8f8 100644
--- a/Sources/Main_ImageProcessing.js
+++ b/Sources/Main_ImageProcessing.js
@@ -1301,3 +1301,5 @@ class ImageProcessor {
         }
     }
 }
+
+export { drawImage, ImageProcessor };
diff --git a/Sources/Main_MouseAndTouch.js b/Sources/Main_MouseAndTouch.js
index 12bb63c6..d9c8e1ef 100644
--- a/Sources/Main_MouseAndTouch.js
+++ b/Sources/Main_MouseAndTouch.js
@@ -861,3 +861,5 @@ function dropEventImpl(objId, dropTargetId) {
     // ユニットの状態が変わるので再描画
     g_app.clearDamageCalcSummary();
 }
+
+export { DoubleClickChecker, selectItemById };
diff --git a/Sources/Main_OriginalAi.js b/Sources/Main_OriginalAi.js
index 668300ac..53a49276 100644
--- a/Sources/Main_OriginalAi.js
+++ b/Sources/Main_OriginalAi.js
@@ -754,3 +754,5 @@ class OriginalAi {
         // return false;
     }
 }
+
+export { OriginalAi };
diff --git a/Sources/SettingManager.js b/Sources/SettingManager.js
index 29ba7587..ff483c89 100644
--- a/Sources/SettingManager.js
+++ b/Sources/SettingManager.js
@@ -499,3 +499,5 @@ class SettingManager {
         this.loadSettingsFromDict(dict, true, true, true, true, true);
     }
 }
+
+export { changeCurrentUnitTab, SettingManager };
diff --git a/Sources/StatusCalcMain.js b/Sources/StatusCalcMain.js
index eec39443..dc4f3698 100644
--- a/Sources/StatusCalcMain.js
+++ b/Sources/StatusCalcMain.js
@@ -142,3 +142,5 @@ function diffToHtml(value) {
     else if (value < 0) return `<span style='color:red'>${signedValue}</span>`;
     else return signedValue;
 }
+
+export { unit, g_app, updateStatus, init, diffToHtml };
diff --git a/Sources/SummonerDuelsSimulatorMain.js b/Sources/SummonerDuelsSimulatorMain.js
index 2dbf3a15..dafac631 100644
--- a/Sources/SummonerDuelsSimulatorMain.js
+++ b/Sources/SummonerDuelsSimulatorMain.js
@@ -115,3 +115,5 @@ function initAetherRaidBoard(
         }
     });
 }
+
+export { SummonerDuelsSimulator, g_app, initAetherRaidBoard };
diff --git a/Sources/TestUtilities.js b/Sources/TestUtilities.js
index f6014059..b85c499a 100644
--- a/Sources/TestUtilities.js
+++ b/Sources/TestUtilities.js
@@ -1,3 +1,20 @@
+import { Weapon, WeaponType, AssistType } from './SkillConstants.js';
+import { MoveType } from './HeroInfoConstants.js';
+import { UnitGroupType } from './UnitConstants.js';
+import { SkillInfo, StatusEffectType } from './Skill.js';
+import { Unit } from './Unit.js';
+import { Tile } from './Tile.js';
+import { HeroDatabase } from './HeroDatabase.js';
+import { SkillDatabase } from './SkillDatabase.js';
+import { UnitManager } from './UnitManager.js';
+import { BattleMap } from './BattleMap.js';
+import { GlobalBattleContext } from './GlobalBattleContext.js';
+import { BeginningOfTurnSkillHandler } from './BeginningOfTurnSkillHandler.js';
+import { DamageCalculatorWrapper } from './DamageCalculatorWrapper.js';
+import { DamageType } from './DamageCalculator.js';
+import { SimpleLogger } from './Logger.js';
+import { ScopedStopwatch, using_ } from './Utilities.js';
+
 function test_createDefaultSkillInfo() {
     return new SkillInfo(
         "", "", 16, 2, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false,
@@ -486,4 +503,6 @@ function test_executeTest(testFunc, isTestTimeLogEnabled = false) {
     if (log != "") {
         console.log(log);
     }
-}
\ No newline at end of file
+}
+
+export { test_createDefaultSkillInfo, test_createDefaultUnit, test_HeroDatabase, test_BeginningOfTurnSkillHandler, test_DamageCalculator, test_calcDamageWithUnits, test_calcDamage, UnitBuilder, BattleScenarioBuilder, RegressionTestHelper, resetGlobalTestState, test_executeTest };
\ No newline at end of file
diff --git a/Sources/UnitBuilderMain.js b/Sources/UnitBuilderMain.js
index dc71893f..245e1c00 100644
--- a/Sources/UnitBuilderMain.js
+++ b/Sources/UnitBuilderMain.js
@@ -142,4 +142,6 @@ function initUnitBuilder() {
         g_appData.updateArenaScoreForAll();
         updateUrl();
     });
-}
\ No newline at end of file
+}
+
+export { UnitBuilderMain, g_app };
\ No newline at end of file
diff --git a/Sources/VueComponents.js b/Sources/VueComponents.js
index 2cc533d3..162fefe9 100644
--- a/Sources/VueComponents.js
+++ b/Sources/VueComponents.js
@@ -3224,3 +3224,5 @@ Vue.config.errorHandler = (err, vm, info) => {
     console.error('[Vue]', vm && vm.$options && vm.$options.name, info, err);
 };
 initVueComponents();
+
+export { initVueComponents };
