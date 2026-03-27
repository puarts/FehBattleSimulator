diff --git a/Deploy.bat b/Deploy.bat
index d1ae2e03..8b96bf4d 100644
--- a/Deploy.bat
+++ b/Deploy.bat
@@ -1,79 +1,79 @@
-@echo off
-
-rem --- 1. ÉXÉLÉãÉGÉtÉFÉNÉgä÷òA ---
-set ef=SkillEffectCore,SkillEffectEnv,SkillEffect,SkillEffectField,SkillEffectUnit
-set ef=%ef%,SkillEffectBattleContext,SkillEffectHooks,SkillEffectRegistrar
-set battle_simulator_skill_effect_filenames=%ef%
-
-rem --- 2. ÉXÉLÉãé¿ëïä÷òA ---
-set im=SkillEffectAliases,CustomSkill,SkillImpl
-set im=%im%,SkillImpl202408,SkillImpl202501,SkillImpl202601
-set battle_simulator_skill_impl_filenames=%im%
-
-rem --- 3. ÉVÉ~ÉÖÉåÅ[É^Å[äÓñ{ÉtÉ@ÉCÉãÅiÉJÉeÉSÉäï Ç…åpÇ¨ë´ÇµÅj ---
-rem äÓî’ÅEÉÜÅ[ÉeÉBÉäÉeÉB
-set BF=GlobalDefinitions,Utilities,Logger,SkillConstants,Skill
-rem É}ÉbÉvÅEç\ë¢
-set BF=%BF%,BattleMapElement,Tile,BattleMap,BattleMapSettings,Structures,Cell,Table
-rem ÉÜÉjÉbÉgÅEèÓïÒ
-set BF=%BF%,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,GlobalBattleContext
-rem åvéZÉçÉWÉbÉN
-set BF=%BF%,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper
-set BF=%BF%,BeginningOfTurnSkillHandler
-rem ÉfÅ[É^ÉxÅ[ÉXÅEê›íË
-set BF=%BF%,SkillDatabase,HeroDatabase,TurnSetting,AudioManager,AetherRaidDefensePresets
-set BF=%BF%,SettingManager,AppData
-rem ÉÅÉCÉìèàóùÅEUI
-set BF=%BF%,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,VueComponents
-
-rem --- 4. ç≈èIìIÇ»ìùçá ---
-set battle_simulator_filenames=%BF%,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
-
-rem îÚãÛèÈÉVÉ~ÉÖÉåÅ[É^Å[
-call %~dp0MergeSourcesAndCompress.bat FehBattleSimulator %battle_simulator_filenames%,AetherRaidSimulatorMain
-
-rem ì¨ãZèÍÉVÉ~ÉÖÉåÅ[É^Å[
-call %~dp0MergeSourcesAndCompress.bat FehArenaSimulator %battle_simulator_filenames%,ArenaSimulatorMain
-
-rem âpóYåàì¨ÉVÉ~ÉÖÉåÅ[É^Å[
-call %~dp0MergeSourcesAndCompress.bat FehSummonerDuelsSimulator %battle_simulator_filenames%,SummonerDuelsSimulatorMain
-
-rem ÉXÉeÅ[É^ÉXåvéZã@
-call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator GlobalDefinitions,Utilities,SkillConstants,Skill,BattleMapElement,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
-
-rem ÉÜÉjÉbÉgÉrÉãÉ_Å[
-call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder GlobalDefinitions,Cell,Table,Utilities,Logger,SkillConstants,Skill,BattleMapElement,Tile, Structures,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,BattleMap,BattleMapSettings,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,TurnSetting,AudioManager,AetherRaidDefensePresets,SkillDatabase,HeroDatabase,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,UnitBuilderMain,VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
-
-rem É_ÉÅÅ[ÉWåvéZã@
-call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator GlobalDefinitions,Utilities,Logger,SkillConstants,Skill,BattleMapElement,Tile,BattleMap,GlobalBattleContext,Structures,Table,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,SkillDatabase,HeroDatabase,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,AudioManager,SampleSkillInfos,SampleHeroInfos,VueComponents,KeyRepeatHandler,DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
-
-rem âpóYÉAÉCÉRÉìÉäÉXÉg
-call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister GlobalDefinitions,Utilities,Logger,SkillConstants,Skill,HeroInfoConstants,HeroInfo,HeroDatabase,HeroIconListerMain,SampleHeroInfos,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
-
-rem ÇªÇÃëºÉcÅ[ÉãÇ≈égÇ§ÉtÉ@ÉCÉã
-echo other files
-set copyfiles=%battle_simulator_filenames% StatusCalcMain SampleSkillInfos SampleHeroInfos KeyRepeatHandler DamageCalculatorMain HeroStatusClustererMain
-
-rem ëΩï™ç°ÇÕÉRÉsÅ[ïsóvÇ»ÇÃÇ≈ÅAàÍíUÉRÉsÅ[ÇµÇ»Ç¢Ç≈Ç®Ç≠
-REM for %%n in (%copyfiles%) do (
-    REM copy %~dp0Sources\%%n.js %destination%\%%n.js
-REM )
-
-echo css files
-set css_filenames=feh-battle-simulator
-set copyfiles=%css_filenames%
-for %%n in (%copyfiles%) do (
-    copy %~dp0Sources\%%n.css %destination%\%%n.css
-)
-
-rem HTMLÉtÉ@ÉCÉã
-echo html files
-set trunk_root=%~dp0..\..\trunk
-set root=%trunk_root%\Websites\fire-emblem.fun
-set html_destination=%root%\blog\entries
-set copyfiles=AetherRaidSimulator ArenaSimulator DamageCalculator SummonerDuelsSimulator UnitBuilder HeroIconLister StatusCalculator
-for %%n in (%copyfiles%) do (
-    copy %~dp0Sources\%%n.html %html_destination%\%%n.html
-)
-
-pause
+@echo off
+
+rem --- 1. „Çπ„Ç≠„É´„Ç®„Éï„Çß„ÇØ„ÉàÈñ¢ÈÄ£ ---
+set ef=skill-dsl\SkillEffectCore,skill-dsl\SkillEffectEnv,skill-dsl\SkillEffect,skill-dsl\SkillEffectField,skill-dsl\SkillEffectUnit
+set ef=%ef%,skill-dsl\SkillEffectBattleContext,skill-dsl\SkillEffectHooks,skill-dsl\SkillEffectRegistrar
+set battle_simulator_skill_effect_filenames=%ef%
+
+rem --- 2. „Çπ„Ç≠„É´ÂÆüË£ÖÈñ¢ÈÄ£ ---
+set im=skill-dsl\SkillEffectAliases,skill-impl\CustomSkill,skill-impl\SkillImpl
+set im=%im%,skill-impl\SkillImpl202408,skill-impl\SkillImpl202501,skill-impl\SkillImpl202601
+set battle_simulator_skill_impl_filenames=%im%
+
+rem --- 3. „Ç∑„Éü„É•„É¨„Éº„Çø„ÉºÂü∫Êú¨„Éï„Ç°„Ç§„É´Ôºà„Ç´„ÉÜ„Ç¥„É™Âà•„Å´Á∂ôÊâøÈ†ÜÔºâ ---
+rem Âü∫Áõ§„Éª„É¶„Éº„ÉÜ„Ç£„É™„ÉÜ„Ç£
+set BF=core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill
+rem „Éû„ÉÉ„Éó„ÉªÊßãÈÄ†
+set BF=%BF%,map\BattleMapElement,map\Tile,map\BattleMap,map\BattleMapSettings,map\Structures,map\Cell,map\Table
+rem „É¶„Éã„ÉÉ„Éà„ÉªÊÉÖÂ†±
+set BF=%BF%,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,unit\GlobalBattleContext
+rem Ë®àÁÆó„É≠„Ç∏„ÉÉ„ÇØ
+set BF=%BF%,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\DamageCalculatorWrapper
+set BF=%BF%,combat\BeginningOfTurnSkillHandler
+rem „Éá„Éº„Çø„Éô„Éº„Çπ„ÉªË®≠ÂÆö
+set BF=%BF%,database\SkillDatabase,database\HeroDatabase,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets
+set BF=%BF%,app\SettingManager,app\AppData
+rem „É°„Ç§„É≥„É≠„Ç∏„ÉÉ„ÇØ„ÉªUI
+set BF=%BF%,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\BattleSimulatorBase,app\VueComponents
+
+rem --- 4. ÊúÄÁµÇÁöÑ„Å™Áµ±Âêà ---
+set battle_simulator_filenames=%BF%,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+
+rem È£õÁ©∫Âüé„Ç∑„Éü„É•„É¨„Éº„Çø„Éº
+call %~dp0MergeSourcesAndCompress.bat FehBattleSimulator %battle_simulator_filenames%,pages\AetherRaidSimulatorMain
+
+rem ÈóòÊäÄÂ†¥„Ç∑„Éü„É•„É¨„Éº„Çø„Éº
+call %~dp0MergeSourcesAndCompress.bat FehArenaSimulator %battle_simulator_filenames%,pages\ArenaSimulatorMain
+
+rem Ëã±ÈõÑÊ±∫Èóò„Ç∑„Éü„É•„É¨„Éº„Çø„Éº
+call %~dp0MergeSourcesAndCompress.bat FehSummonerDuelsSimulator %battle_simulator_filenames%,pages\SummonerDuelsSimulatorMain
+
+rem „Çπ„ÉÜ„Éº„Çø„ÇπË®àÁÆóÊ©ü
+call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator core\GlobalDefinitions,core\Utilities,data\SkillConstants,data\Skill,map\BattleMapElement,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,pages\StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+
+rem „É¶„Éã„ÉÉ„Éà„Éì„É´„ÉÄ„Éº
+call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+
+rem „ÉÄ„É°„Éº„Ç∏Ë®àÁÆóÊ©ü
+call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+
+rem Ëã±ÈõÑ„Ç¢„Ç§„Ç≥„É≥„É™„Çπ„Éà
+call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,data\HeroInfoConstants,data\HeroInfo,database\HeroDatabase,pages\HeroIconListerMain,database\SampleHeroInfos,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+
+rem „Åù„ÅÆ‰ªñ„ÉÑ„Éº„É´„Åß‰Ωø„ÅÜ„Éï„Ç°„Ç§„É´
+echo other files
+set copyfiles=%battle_simulator_filenames% pages\StatusCalcMain database\SampleSkillInfos database\SampleHeroInfos core\KeyRepeatHandler pages\DamageCalculatorMain pages\HeroStatusClustererMain
+
+rem ÁèæÊôÇÁÇπ„Åß„ÅØ„Ç≥„Éî„Éº‰∏çË¶Å„Å™„ÅÆ„Åß„ÄÅ‰∏ÄÊó¶„Ç≥„Éî„Éº„Åó„Å™„ÅÑ„Åß„Åä„Åè
+REM for %%n in (%copyfiles%) do (
+    REM copy %~dp0Sources\%%n.js %destination%\%%n.js
+REM )
+
+echo css files
+set css_filenames=feh-battle-simulator
+set copyfiles=%css_filenames%
+for %%n in (%copyfiles%) do (
+    copy %~dp0Sources\%%n.css %destination%\%%n.css
+)
+
+rem HTML„Éï„Ç°„Ç§„É´
+echo html files
+set trunk_root=%~dp0..\..\trunk
+set root=%trunk_root%\Websites\fire-emblem.fun
+set html_destination=%root%\blog\entries
+set copyfiles=AetherRaidSimulator ArenaSimulator DamageCalculator SummonerDuelsSimulator UnitBuilder HeroIconLister StatusCalculator
+for %%n in (%copyfiles%) do (
+    copy %~dp0Sources\%%n.html %html_destination%\%%n.html
+)
+
+pause
diff --git a/Sources/AetherRaidSimulator.html b/Sources/AetherRaidSimulator.html
index 9cff215a..4ec593f6 100644
--- a/Sources/AetherRaidSimulator.html
+++ b/Sources/AetherRaidSimulator.html
@@ -1456,45 +1456,45 @@
             let additionalScripts = [];
             if (isLocal) {
                 additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Cell.js",
-                    "Table.js",
-                    "Utilities.js",
-                    "Logger.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "Tile.js",
-                    "Structures.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "UnitManager.js",
-                    "BattleMap.js",
-                    "BattleMapSettings.js",
-                    "GlobalBattleContext.js",
-                    "DamageCalculationUtility.js",
-                    "DamageCalculator.js",
-                    "PostCombatSkillHander.js",
-                    "DamageCalculatorWrapper.js",
-                    "BeginningOfTurnSkillHandler.js",
-                    "TurnSetting.js",
-                    "AudioManager.js",
-                    "AetherRaidDefensePresets.js",
-                    "SkillDatabase.js",
-                    "HeroDatabase.js",
-                    "SettingManager.js",
-                    "AppData.js",
-                    "Main_ImageProcessing.js",
-                    "Main_OriginalAi.js",
-                    "Main_MouseAndTouch.js",
-                    "BattleSimulatorBase.js",
-                    "AetherRaidSimulatorMain.js",
-                    "VueComponents.js",
-                    "SampleSkillInfos.js",
-                    "SampleHeroInfos.js",
+                    "core/GlobalDefinitions_Debug.js",
+                    "map/Cell.js",
+                    "map/Table.js",
+                    "core/Utilities.js",
+                    "core/Logger.js",
+                    "data/SkillConstants.js",
+                    "data/Skill.js",
+                    "map/BattleMapElement.js",
+                    "map/Tile.js",
+                    "map/Structures.js",
+                    "data/HeroInfoConstants.js",
+                    "data/HeroInfo.js",
+                    "data/UnitConstants.js",
+                    "unit/BattleContext.js",
+                    "unit/Unit.js",
+                    "unit/UnitManager.js",
+                    "map/BattleMap.js",
+                    "map/BattleMapSettings.js",
+                    "unit/GlobalBattleContext.js",
+                    "combat/DamageCalculationUtility.js",
+                    "combat/DamageCalculator.js",
+                    "combat/PostCombatSkillHander.js",
+                    "combat/DamageCalculatorWrapper.js",
+                    "combat/BeginningOfTurnSkillHandler.js",
+                    "unit/TurnSetting.js",
+                    "app/AudioManager.js",
+                    "database/AetherRaidDefensePresets.js",
+                    "database/SkillDatabase.js",
+                    "database/HeroDatabase.js",
+                    "app/SettingManager.js",
+                    "app/AppData.js",
+                    "app/Main_ImageProcessing.js",
+                    "app/Main_OriginalAi.js",
+                    "app/Main_MouseAndTouch.js",
+                    "app/BattleSimulatorBase.js",
+                    "pages/AetherRaidSimulatorMain.js",
+                    "app/VueComponents.js",
+                    "database/SampleSkillInfos.js",
+                    "database/SampleHeroInfos.js",
                     ...SKILL_EFFECT_FILES,
                     ...SKILL_IMPL_FILES,
                 ];
diff --git a/Sources/ArenaSimulator.html b/Sources/ArenaSimulator.html
index 067ff275..d17c34fc 100644
--- a/Sources/ArenaSimulator.html
+++ b/Sources/ArenaSimulator.html
@@ -1426,45 +1426,45 @@
             let additionalScripts = [];
             if (isLocal) {
                 additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Cell.js",
-                    "Table.js",
-                    "Utilities.js",
-                    "Logger.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "Tile.js",
-                    "Structures.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "UnitManager.js",
-                    "BattleMap.js",
-                    "BattleMapSettings.js",
-                    "GlobalBattleContext.js",
-                    "DamageCalculationUtility.js",
-                    "DamageCalculator.js",
-                    "PostCombatSkillHander.js",
-                    "DamageCalculatorWrapper.js",
-                    "BeginningOfTurnSkillHandler.js",
-                    "TurnSetting.js",
-                    "AudioManager.js",
-                    "AetherRaidDefensePresets.js",
-                    "SkillDatabase.js",
-                    "HeroDatabase.js",
-                    "SettingManager.js",
-                    "AppData.js",
-                    "Main_ImageProcessing.js",
-                    "Main_OriginalAi.js",
-                    "Main_MouseAndTouch.js",
-                    "BattleSimulatorBase.js",
-                    "ArenaSimulatorMain.js",
-                    "VueComponents.js",
-                    "SampleSkillInfos.js",
-                    "SampleHeroInfos.js",
+                    "core/GlobalDefinitions_Debug.js",
+                    "map/Cell.js",
+                    "map/Table.js",
+                    "core/Utilities.js",
+                    "core/Logger.js",
+                    "data/SkillConstants.js",
+                    "data/Skill.js",
+                    "map/BattleMapElement.js",
+                    "map/Tile.js",
+                    "map/Structures.js",
+                    "data/HeroInfoConstants.js",
+                    "data/HeroInfo.js",
+                    "data/UnitConstants.js",
+                    "unit/BattleContext.js",
+                    "unit/Unit.js",
+                    "unit/UnitManager.js",
+                    "map/BattleMap.js",
+                    "map/BattleMapSettings.js",
+                    "unit/GlobalBattleContext.js",
+                    "combat/DamageCalculationUtility.js",
+                    "combat/DamageCalculator.js",
+                    "combat/PostCombatSkillHander.js",
+                    "combat/DamageCalculatorWrapper.js",
+                    "combat/BeginningOfTurnSkillHandler.js",
+                    "unit/TurnSetting.js",
+                    "app/AudioManager.js",
+                    "database/AetherRaidDefensePresets.js",
+                    "database/SkillDatabase.js",
+                    "database/HeroDatabase.js",
+                    "app/SettingManager.js",
+                    "app/AppData.js",
+                    "app/Main_ImageProcessing.js",
+                    "app/Main_OriginalAi.js",
+                    "app/Main_MouseAndTouch.js",
+                    "app/BattleSimulatorBase.js",
+                    "pages/ArenaSimulatorMain.js",
+                    "app/VueComponents.js",
+                    "database/SampleSkillInfos.js",
+                    "database/SampleHeroInfos.js",
                     ...SKILL_EFFECT_FILES,
                     ...SKILL_IMPL_FILES,
                 ];
diff --git a/Sources/DamageCalculator.html b/Sources/DamageCalculator.html
index 5858637e..5bb16be8 100644
--- a/Sources/DamageCalculator.html
+++ b/Sources/DamageCalculator.html
@@ -469,37 +469,37 @@
             let additionalScripts = [];
             if (isLocal) {
                 additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Utilities.js",
-                    "Logger.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "Tile.js",
-                    "BattleMap.js",
-                    "GlobalBattleContext.js",
-                    "Structures.js",
-                    "Table.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "UnitManager.js",
-                    "SkillDatabase.js",
-                    "HeroDatabase.js",
-                    "AudioManager.js",
-                    "DamageCalculationUtility.js",
-                    "DamageCalculator.js",
-                    "PostCombatSkillHander.js",
-                    "DamageCalculatorWrapper.js",
-                    "BeginningOfTurnSkillHandler.js",
-                    "AudioManager.js",
-                    "SampleSkillInfos.js",
-                    "SampleHeroInfos.js",
-                    "VueComponents.js",
-                    "KeyRepeatHandler.js",
-                    "DamageCalculatorMain.js",
+                    "core/GlobalDefinitions_Debug.js",
+                    "core/Utilities.js",
+                    "core/Logger.js",
+                    "data/SkillConstants.js",
+                    "data/Skill.js",
+                    "map/BattleMapElement.js",
+                    "map/Tile.js",
+                    "map/BattleMap.js",
+                    "unit/GlobalBattleContext.js",
+                    "map/Structures.js",
+                    "map/Table.js",
+                    "data/HeroInfoConstants.js",
+                    "data/HeroInfo.js",
+                    "data/UnitConstants.js",
+                    "unit/BattleContext.js",
+                    "unit/Unit.js",
+                    "unit/UnitManager.js",
+                    "database/SkillDatabase.js",
+                    "database/HeroDatabase.js",
+                    "app/AudioManager.js",
+                    "combat/DamageCalculationUtility.js",
+                    "combat/DamageCalculator.js",
+                    "combat/PostCombatSkillHander.js",
+                    "combat/DamageCalculatorWrapper.js",
+                    "combat/BeginningOfTurnSkillHandler.js",
+                    "app/AudioManager.js",
+                    "database/SampleSkillInfos.js",
+                    "database/SampleHeroInfos.js",
+                    "app/VueComponents.js",
+                    "core/KeyRepeatHandler.js",
+                    "pages/DamageCalculatorMain.js",
                     ...SKILL_EFFECT_FILES,
                     ...SKILL_IMPL_FILES,
                 ];
diff --git a/Sources/HeroIconLister.html b/Sources/HeroIconLister.html
index 495d7665..a7cd5a85 100644
--- a/Sources/HeroIconLister.html
+++ b/Sources/HeroIconLister.html
@@ -194,15 +194,15 @@
             let additionalScripts = [];
             if (isLocal) {
                 additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Utilities.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "HeroDatabase.js",
-                    "HeroIconListerMain.js",
-                    "SampleHeroInfos.js",
+                    "core/GlobalDefinitions_Debug.js",
+                    "core/Utilities.js",
+                    "data/SkillConstants.js",
+                    "data/Skill.js",
+                    "data/HeroInfoConstants.js",
+                    "data/HeroInfo.js",
+                    "database/HeroDatabase.js",
+                    "pages/HeroIconListerMain.js",
+                    "database/SampleHeroInfos.js",
                     ...SKILL_EFFECT_FILES,
                     ...SKILL_IMPL_FILES,
                 ];
diff --git a/Sources/HeroStatusClusterer.html b/Sources/HeroStatusClusterer.html
index 713d3877..f128dbdd 100644
--- a/Sources/HeroStatusClusterer.html
+++ b/Sources/HeroStatusClusterer.html
@@ -263,21 +263,21 @@
         $(function () {
             const startTime = Date.now();
             loadScripts([
-                "GlobalDefinitions_Debug.js",
-                "Utilities.js",
-                "Skill.js",
-                "GlobalBattleContext.js",
-                "HeroInfoConstants.js",
-                "HeroInfo.js",
-                "BattleMapElement.js",
-                "UnitConstants.js",
-                "BattleContext.js",
-                "Unit.js",
-                "UnitManager.js",
-                "HeroDatabase.js",
-                "SampleHeroInfos.js",
-                "VueComponents.js",
-                "HeroStatusClustererMain.js",
+                "core/GlobalDefinitions_Debug.js",
+                "core/Utilities.js",
+                "data/Skill.js",
+                "unit/GlobalBattleContext.js",
+                "data/HeroInfoConstants.js",
+                "data/HeroInfo.js",
+                "map/BattleMapElement.js",
+                "data/UnitConstants.js",
+                "unit/BattleContext.js",
+                "unit/Unit.js",
+                "unit/UnitManager.js",
+                "database/HeroDatabase.js",
+                "database/SampleHeroInfos.js",
+                "app/VueComponents.js",
+                "pages/HeroStatusClustererMain.js",
             ], () => {
                 const endTime = Date.now();
                 console.log(`${endTime - startTime} ms to load all scripts`);
diff --git a/Sources/Local.js b/Sources/Local.js
index bf746a89..fedb19f5 100644
--- a/Sources/Local.js
+++ b/Sources/Local.js
@@ -1,21 +1,21 @@
 // „É≠„Éº„Ç´„É´Áî®„ÅÆ„Çπ„ÇØ„É™„Éó„Éà
 // add files
 const SKILL_EFFECT_FILES = [
-    "SkillEffectCore.js",
-    "SkillEffectEnv.js",
-    "SkillEffect.js",
-    "SkillEffectField.js",
-    "SkillEffectUnit.js",
-    "SkillEffectBattleContext.js",
-    "SkillEffectHooks.js",
-    "SkillEffectRegistrar.js",
+    "skill-dsl/SkillEffectCore.js",
+    "skill-dsl/SkillEffectEnv.js",
+    "skill-dsl/SkillEffect.js",
+    "skill-dsl/SkillEffectField.js",
+    "skill-dsl/SkillEffectUnit.js",
+    "skill-dsl/SkillEffectBattleContext.js",
+    "skill-dsl/SkillEffectHooks.js",
+    "skill-dsl/SkillEffectRegistrar.js",
 ];
 
 const SKILL_IMPL_FILES = [
-    "SkillEffectAliases.js",
-    "CustomSkill.js",
-    "SkillImpl.js",
-    "SkillImpl202408.js",
-    "SkillImpl202501.js",
-    "SkillImpl202601.js",
+    "skill-dsl/SkillEffectAliases.js",
+    "skill-impl/CustomSkill.js",
+    "skill-impl/SkillImpl.js",
+    "skill-impl/SkillImpl202408.js",
+    "skill-impl/SkillImpl202501.js",
+    "skill-impl/SkillImpl202601.js",
 ];
diff --git a/Sources/StatusCalculator.html b/Sources/StatusCalculator.html
index ddf50b66..168d3fdb 100644
--- a/Sources/StatusCalculator.html
+++ b/Sources/StatusCalculator.html
@@ -263,17 +263,17 @@
             let additionalScripts = [];
             if (isLocal) {
                 additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Utilities.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "StatusCalcMain.js",
+                    "core/GlobalDefinitions_Debug.js",
+                    "core/Utilities.js",
+                    "data/SkillConstants.js",
+                    "data/Skill.js",
+                    "map/BattleMapElement.js",
+                    "data/HeroInfoConstants.js",
+                    "data/HeroInfo.js",
+                    "data/UnitConstants.js",
+                    "unit/BattleContext.js",
+                    "unit/Unit.js",
+                    "pages/StatusCalcMain.js",
                     ...SKILL_EFFECT_FILES,
                     ...SKILL_IMPL_FILES,
                 ];
diff --git a/Sources/SummonerDuelsSimulator.html b/Sources/SummonerDuelsSimulator.html
index 4e56aad4..85ea1fbb 100644
--- a/Sources/SummonerDuelsSimulator.html
+++ b/Sources/SummonerDuelsSimulator.html
@@ -1518,45 +1518,45 @@
             let additionalScripts = [];
             if (isLocal) {
                 additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Cell.js",
-                    "Table.js",
-                    "Utilities.js",
-                    "Logger.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "Tile.js",
-                    "Structures.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "UnitManager.js",
-                    "BattleMap.js",
-                    "BattleMapSettings.js",
-                    "GlobalBattleContext.js",
-                    "DamageCalculationUtility.js",
-                    "DamageCalculator.js",
-                    "PostCombatSkillHander.js",
-                    "DamageCalculatorWrapper.js",
-                    "BeginningOfTurnSkillHandler.js",
-                    "TurnSetting.js",
-                    "AudioManager.js",
-                    "AetherRaidDefensePresets.js",
-                    "SkillDatabase.js",
-                    "HeroDatabase.js",
-                    "SettingManager.js",
-                    "AppData.js",
-                    "Main_ImageProcessing.js",
-                    "Main_OriginalAi.js",
-                    "Main_MouseAndTouch.js",
-                    "BattleSimulatorBase.js",
-                    "SummonerDuelsSimulatorMain.js",
-                    "VueComponents.js",
-                    "SampleSkillInfos.js",
-                    "SampleHeroInfos.js",
+                    "core/GlobalDefinitions_Debug.js",
+                    "map/Cell.js",
+                    "map/Table.js",
+                    "core/Utilities.js",
+                    "core/Logger.js",
+                    "data/SkillConstants.js",
+                    "data/Skill.js",
+                    "map/BattleMapElement.js",
+                    "map/Tile.js",
+                    "map/Structures.js",
+                    "data/HeroInfoConstants.js",
+                    "data/HeroInfo.js",
+                    "data/UnitConstants.js",
+                    "unit/BattleContext.js",
+                    "unit/Unit.js",
+                    "unit/UnitManager.js",
+                    "map/BattleMap.js",
+                    "map/BattleMapSettings.js",
+                    "unit/GlobalBattleContext.js",
+                    "combat/DamageCalculationUtility.js",
+                    "combat/DamageCalculator.js",
+                    "combat/PostCombatSkillHander.js",
+                    "combat/DamageCalculatorWrapper.js",
+                    "combat/BeginningOfTurnSkillHandler.js",
+                    "unit/TurnSetting.js",
+                    "app/AudioManager.js",
+                    "database/AetherRaidDefensePresets.js",
+                    "database/SkillDatabase.js",
+                    "database/HeroDatabase.js",
+                    "app/SettingManager.js",
+                    "app/AppData.js",
+                    "app/Main_ImageProcessing.js",
+                    "app/Main_OriginalAi.js",
+                    "app/Main_MouseAndTouch.js",
+                    "app/BattleSimulatorBase.js",
+                    "pages/SummonerDuelsSimulatorMain.js",
+                    "app/VueComponents.js",
+                    "database/SampleSkillInfos.js",
+                    "database/SampleHeroInfos.js",
                     ...SKILL_EFFECT_FILES,
                     ...SKILL_IMPL_FILES,
                 ];
diff --git a/Sources/UnitBuilder.html b/Sources/UnitBuilder.html
index 1644e424..483f7f1c 100644
--- a/Sources/UnitBuilder.html
+++ b/Sources/UnitBuilder.html
@@ -1244,45 +1244,45 @@
             let additionalScripts = [];
             if (isLocal) {
                 additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Cell.js",
-                    "Table.js",
-                    "Utilities.js",
-                    "Logger.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "Tile.js",
-                    "Structures.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "UnitManager.js",
-                    "BattleMap.js",
-                    "BattleMapSettings.js",
-                    "GlobalBattleContext.js",
-                    "DamageCalculationUtility.js",
-                    "DamageCalculator.js",
-                    "PostCombatSkillHander.js",
-                    "DamageCalculatorWrapper.js",
-                    "BeginningOfTurnSkillHandler.js",
-                    "TurnSetting.js",
-                    "AudioManager.js",
-                    "AetherRaidDefensePresets.js",
-                    "SkillDatabase.js",
-                    "HeroDatabase.js",
-                    "SettingManager.js",
-                    "AppData.js",
-                    "Main_ImageProcessing.js",
-                    "Main_OriginalAi.js",
-                    "Main_MouseAndTouch.js",
-                    "BattleSimulatorBase.js",
-                    "UnitBuilderMain.js",
-                    "VueComponents.js",
-                    "SampleSkillInfos.js",
-                    "SampleHeroInfos.js",
+                    "core/GlobalDefinitions_Debug.js",
+                    "map/Cell.js",
+                    "map/Table.js",
+                    "core/Utilities.js",
+                    "core/Logger.js",
+                    "data/SkillConstants.js",
+                    "data/Skill.js",
+                    "map/BattleMapElement.js",
+                    "map/Tile.js",
+                    "map/Structures.js",
+                    "data/HeroInfoConstants.js",
+                    "data/HeroInfo.js",
+                    "data/UnitConstants.js",
+                    "unit/BattleContext.js",
+                    "unit/Unit.js",
+                    "unit/UnitManager.js",
+                    "map/BattleMap.js",
+                    "map/BattleMapSettings.js",
+                    "unit/GlobalBattleContext.js",
+                    "combat/DamageCalculationUtility.js",
+                    "combat/DamageCalculator.js",
+                    "combat/PostCombatSkillHander.js",
+                    "combat/DamageCalculatorWrapper.js",
+                    "combat/BeginningOfTurnSkillHandler.js",
+                    "unit/TurnSetting.js",
+                    "app/AudioManager.js",
+                    "database/AetherRaidDefensePresets.js",
+                    "database/SkillDatabase.js",
+                    "database/HeroDatabase.js",
+                    "app/SettingManager.js",
+                    "app/AppData.js",
+                    "app/Main_ImageProcessing.js",
+                    "app/Main_OriginalAi.js",
+                    "app/Main_MouseAndTouch.js",
+                    "app/BattleSimulatorBase.js",
+                    "pages/UnitBuilderMain.js",
+                    "app/VueComponents.js",
+                    "database/SampleSkillInfos.js",
+                    "database/SampleHeroInfos.js",
                     ...SKILL_EFFECT_FILES,
                     ...SKILL_IMPL_FILES,
                 ];
diff --git a/Sources/AppData.js b/Sources/app/AppData.js
similarity index 100%
rename from Sources/AppData.js
rename to Sources/app/AppData.js
diff --git a/Sources/AudioManager.js b/Sources/app/AudioManager.js
similarity index 100%
rename from Sources/AudioManager.js
rename to Sources/app/AudioManager.js
diff --git a/Sources/BattleSimulatorBase.js b/Sources/app/BattleSimulatorBase.js
similarity index 100%
rename from Sources/BattleSimulatorBase.js
rename to Sources/app/BattleSimulatorBase.js
diff --git a/Sources/Main_ImageProcessing.js b/Sources/app/Main_ImageProcessing.js
similarity index 100%
rename from Sources/Main_ImageProcessing.js
rename to Sources/app/Main_ImageProcessing.js
diff --git a/Sources/Main_MouseAndTouch.js b/Sources/app/Main_MouseAndTouch.js
similarity index 100%
rename from Sources/Main_MouseAndTouch.js
rename to Sources/app/Main_MouseAndTouch.js
diff --git a/Sources/Main_OriginalAi.js b/Sources/app/Main_OriginalAi.js
similarity index 100%
rename from Sources/Main_OriginalAi.js
rename to Sources/app/Main_OriginalAi.js
diff --git a/Sources/SettingManager.js b/Sources/app/SettingManager.js
similarity index 100%
rename from Sources/SettingManager.js
rename to Sources/app/SettingManager.js
diff --git a/Sources/VueComponents.js b/Sources/app/VueComponents.js
similarity index 100%
rename from Sources/VueComponents.js
rename to Sources/app/VueComponents.js
diff --git a/Sources/BeginningOfTurnSkillHandler.js b/Sources/combat/BeginningOfTurnSkillHandler.js
similarity index 100%
rename from Sources/BeginningOfTurnSkillHandler.js
rename to Sources/combat/BeginningOfTurnSkillHandler.js
diff --git a/Sources/DamageCalculationUtility.js b/Sources/combat/DamageCalculationUtility.js
similarity index 100%
rename from Sources/DamageCalculationUtility.js
rename to Sources/combat/DamageCalculationUtility.js
diff --git a/Sources/DamageCalculator.js b/Sources/combat/DamageCalculator.js
similarity index 100%
rename from Sources/DamageCalculator.js
rename to Sources/combat/DamageCalculator.js
diff --git a/Sources/DamageCalculatorWrapper.js b/Sources/combat/DamageCalculatorWrapper.js
similarity index 100%
rename from Sources/DamageCalculatorWrapper.js
rename to Sources/combat/DamageCalculatorWrapper.js
diff --git a/Sources/PostCombatSkillHander.js b/Sources/combat/PostCombatSkillHander.js
similarity index 100%
rename from Sources/PostCombatSkillHander.js
rename to Sources/combat/PostCombatSkillHander.js
diff --git a/Sources/GlobalDefinitions.js b/Sources/core/GlobalDefinitions.js
similarity index 100%
rename from Sources/GlobalDefinitions.js
rename to Sources/core/GlobalDefinitions.js
diff --git a/Sources/GlobalDefinitions_Debug.js b/Sources/core/GlobalDefinitions_Debug.js
similarity index 100%
rename from Sources/GlobalDefinitions_Debug.js
rename to Sources/core/GlobalDefinitions_Debug.js
diff --git a/Sources/KeyRepeatHandler.js b/Sources/core/KeyRepeatHandler.js
similarity index 100%
rename from Sources/KeyRepeatHandler.js
rename to Sources/core/KeyRepeatHandler.js
diff --git a/Sources/Logger.js b/Sources/core/Logger.js
similarity index 100%
rename from Sources/Logger.js
rename to Sources/core/Logger.js
diff --git a/Sources/Utilities.js b/Sources/core/Utilities.js
similarity index 100%
rename from Sources/Utilities.js
rename to Sources/core/Utilities.js
diff --git a/Sources/HeroInfo.js b/Sources/data/HeroInfo.js
similarity index 100%
rename from Sources/HeroInfo.js
rename to Sources/data/HeroInfo.js
diff --git a/Sources/HeroInfoConstants.js b/Sources/data/HeroInfoConstants.js
similarity index 100%
rename from Sources/HeroInfoConstants.js
rename to Sources/data/HeroInfoConstants.js
diff --git a/Sources/Skill.js b/Sources/data/Skill.js
similarity index 100%
rename from Sources/Skill.js
rename to Sources/data/Skill.js
diff --git a/Sources/SkillConstants.js b/Sources/data/SkillConstants.js
similarity index 100%
rename from Sources/SkillConstants.js
rename to Sources/data/SkillConstants.js
diff --git a/Sources/UnitConstants.js b/Sources/data/UnitConstants.js
similarity index 100%
rename from Sources/UnitConstants.js
rename to Sources/data/UnitConstants.js
diff --git a/Sources/AetherRaidDefensePresets.js b/Sources/database/AetherRaidDefensePresets.js
similarity index 100%
rename from Sources/AetherRaidDefensePresets.js
rename to Sources/database/AetherRaidDefensePresets.js
diff --git a/Sources/HeroDatabase.js b/Sources/database/HeroDatabase.js
similarity index 100%
rename from Sources/HeroDatabase.js
rename to Sources/database/HeroDatabase.js
diff --git a/Sources/SampleHeroInfos.js b/Sources/database/SampleHeroInfos.js
similarity index 100%
rename from Sources/SampleHeroInfos.js
rename to Sources/database/SampleHeroInfos.js
diff --git a/Sources/SampleSkillInfos.js b/Sources/database/SampleSkillInfos.js
similarity index 100%
rename from Sources/SampleSkillInfos.js
rename to Sources/database/SampleSkillInfos.js
diff --git a/Sources/SkillDatabase.js b/Sources/database/SkillDatabase.js
similarity index 100%
rename from Sources/SkillDatabase.js
rename to Sources/database/SkillDatabase.js
diff --git a/Sources/BattleMap.js b/Sources/map/BattleMap.js
similarity index 100%
rename from Sources/BattleMap.js
rename to Sources/map/BattleMap.js
diff --git a/Sources/BattleMapElement.js b/Sources/map/BattleMapElement.js
similarity index 100%
rename from Sources/BattleMapElement.js
rename to Sources/map/BattleMapElement.js
diff --git a/Sources/BattleMapSettings.js b/Sources/map/BattleMapSettings.js
similarity index 100%
rename from Sources/BattleMapSettings.js
rename to Sources/map/BattleMapSettings.js
diff --git a/Sources/Cell.js b/Sources/map/Cell.js
similarity index 100%
rename from Sources/Cell.js
rename to Sources/map/Cell.js
diff --git a/Sources/Structures.js b/Sources/map/Structures.js
similarity index 100%
rename from Sources/Structures.js
rename to Sources/map/Structures.js
diff --git a/Sources/Table.js b/Sources/map/Table.js
similarity index 100%
rename from Sources/Table.js
rename to Sources/map/Table.js
diff --git a/Sources/Tile.js b/Sources/map/Tile.js
similarity index 100%
rename from Sources/Tile.js
rename to Sources/map/Tile.js
diff --git a/Sources/AetherRaidSimulatorMain.js b/Sources/pages/AetherRaidSimulatorMain.js
similarity index 100%
rename from Sources/AetherRaidSimulatorMain.js
rename to Sources/pages/AetherRaidSimulatorMain.js
diff --git a/Sources/ArenaSimulatorMain.js b/Sources/pages/ArenaSimulatorMain.js
similarity index 100%
rename from Sources/ArenaSimulatorMain.js
rename to Sources/pages/ArenaSimulatorMain.js
diff --git a/Sources/DamageCalculatorMain.js b/Sources/pages/DamageCalculatorMain.js
similarity index 100%
rename from Sources/DamageCalculatorMain.js
rename to Sources/pages/DamageCalculatorMain.js
diff --git a/Sources/HeroIconListerMain.js b/Sources/pages/HeroIconListerMain.js
similarity index 100%
rename from Sources/HeroIconListerMain.js
rename to Sources/pages/HeroIconListerMain.js
diff --git a/Sources/HeroStatusClustererMain.js b/Sources/pages/HeroStatusClustererMain.js
similarity index 100%
rename from Sources/HeroStatusClustererMain.js
rename to Sources/pages/HeroStatusClustererMain.js
diff --git a/Sources/StatusCalcMain.js b/Sources/pages/StatusCalcMain.js
similarity index 100%
rename from Sources/StatusCalcMain.js
rename to Sources/pages/StatusCalcMain.js
diff --git a/Sources/SummonerDuelsSimulatorMain.js b/Sources/pages/SummonerDuelsSimulatorMain.js
similarity index 100%
rename from Sources/SummonerDuelsSimulatorMain.js
rename to Sources/pages/SummonerDuelsSimulatorMain.js
diff --git a/Sources/UnitBuilderMain.js b/Sources/pages/UnitBuilderMain.js
similarity index 100%
rename from Sources/UnitBuilderMain.js
rename to Sources/pages/UnitBuilderMain.js
diff --git a/Sources/SkillEffect.js b/Sources/skill-dsl/SkillEffect.js
similarity index 100%
rename from Sources/SkillEffect.js
rename to Sources/skill-dsl/SkillEffect.js
diff --git a/Sources/SkillEffectAliases.js b/Sources/skill-dsl/SkillEffectAliases.js
similarity index 100%
rename from Sources/SkillEffectAliases.js
rename to Sources/skill-dsl/SkillEffectAliases.js
diff --git a/Sources/SkillEffectBattleContext.js b/Sources/skill-dsl/SkillEffectBattleContext.js
similarity index 100%
rename from Sources/SkillEffectBattleContext.js
rename to Sources/skill-dsl/SkillEffectBattleContext.js
diff --git a/Sources/SkillEffectCore.js b/Sources/skill-dsl/SkillEffectCore.js
similarity index 100%
rename from Sources/SkillEffectCore.js
rename to Sources/skill-dsl/SkillEffectCore.js
diff --git a/Sources/SkillEffectEnv.js b/Sources/skill-dsl/SkillEffectEnv.js
similarity index 100%
rename from Sources/SkillEffectEnv.js
rename to Sources/skill-dsl/SkillEffectEnv.js
diff --git a/Sources/SkillEffectField.js b/Sources/skill-dsl/SkillEffectField.js
similarity index 100%
rename from Sources/SkillEffectField.js
rename to Sources/skill-dsl/SkillEffectField.js
diff --git a/Sources/SkillEffectHooks.js b/Sources/skill-dsl/SkillEffectHooks.js
similarity index 100%
rename from Sources/SkillEffectHooks.js
rename to Sources/skill-dsl/SkillEffectHooks.js
diff --git a/Sources/SkillEffectRegistrar.js b/Sources/skill-dsl/SkillEffectRegistrar.js
similarity index 100%
rename from Sources/SkillEffectRegistrar.js
rename to Sources/skill-dsl/SkillEffectRegistrar.js
diff --git a/Sources/SkillEffectUnit.js b/Sources/skill-dsl/SkillEffectUnit.js
similarity index 100%
rename from Sources/SkillEffectUnit.js
rename to Sources/skill-dsl/SkillEffectUnit.js
diff --git a/Sources/CustomSkill.js b/Sources/skill-impl/CustomSkill.js
similarity index 100%
rename from Sources/CustomSkill.js
rename to Sources/skill-impl/CustomSkill.js
diff --git a/Sources/SkillImpl.js b/Sources/skill-impl/SkillImpl.js
similarity index 100%
rename from Sources/SkillImpl.js
rename to Sources/skill-impl/SkillImpl.js
diff --git a/Sources/SkillImpl202408.js b/Sources/skill-impl/SkillImpl202408.js
similarity index 100%
rename from Sources/SkillImpl202408.js
rename to Sources/skill-impl/SkillImpl202408.js
diff --git a/Sources/SkillImpl202501.js b/Sources/skill-impl/SkillImpl202501.js
similarity index 100%
rename from Sources/SkillImpl202501.js
rename to Sources/skill-impl/SkillImpl202501.js
diff --git a/Sources/SkillImpl202601.js b/Sources/skill-impl/SkillImpl202601.js
similarity index 100%
rename from Sources/SkillImpl202601.js
rename to Sources/skill-impl/SkillImpl202601.js
diff --git a/Sources/BattleContext.js b/Sources/unit/BattleContext.js
similarity index 100%
rename from Sources/BattleContext.js
rename to Sources/unit/BattleContext.js
diff --git a/Sources/GlobalBattleContext.js b/Sources/unit/GlobalBattleContext.js
similarity index 100%
rename from Sources/GlobalBattleContext.js
rename to Sources/unit/GlobalBattleContext.js
diff --git a/Sources/TurnSetting.js b/Sources/unit/TurnSetting.js
similarity index 100%
rename from Sources/TurnSetting.js
rename to Sources/unit/TurnSetting.js
diff --git a/Sources/Unit.js b/Sources/unit/Unit.js
similarity index 100%
rename from Sources/Unit.js
rename to Sources/unit/Unit.js
diff --git a/Sources/UnitManager.js b/Sources/unit/UnitManager.js
similarity index 100%
rename from Sources/UnitManager.js
rename to Sources/unit/UnitManager.js
diff --git a/create_tests.sh b/create_tests.sh
index 478f2531..e61f154a 100755
--- a/create_tests.sh
+++ b/create_tests.sh
@@ -1,47 +1,47 @@
 #!/usr/bin/env bash
 # add files
 SOURCE_FILE_NAMES=(
-    GlobalDefinitions
-    Utilities
-    Logger
-    SkillConstants
-    Skill
-    BattleMapElement
-    Tile
-    Structures
-    Cell
-    Table
-    HeroInfoConstants
-    HeroInfo
-    UnitConstants
-    BattleContext
-    Unit
-    UnitManager
-    BattleMap
-    GlobalBattleContext
-    DamageCalculationUtility
-    DamageCalculator
-    PostCombatSkillHander
-    DamageCalculatorWrapper
-    BeginningOfTurnSkillHandler
-    SkillDatabase
-    HeroDatabase
-    SampleSkillInfos
-    SampleHeroInfos
-    SkillEffectCore
-    SkillEffectEnv
-    SkillEffect
-    SkillEffectField
-    SkillEffectUnit
-    SkillEffectBattleContext
-    SkillEffectHooks
-    SkillEffectRegistrar
-    SkillEffectAliases
-    CustomSkill
-    SkillImpl
-    SkillImpl202408
-    SkillImpl202501
-    SkillImpl202601
+    core/GlobalDefinitions
+    core/Utilities
+    core/Logger
+    data/SkillConstants
+    data/Skill
+    map/BattleMapElement
+    map/Tile
+    map/Structures
+    map/Cell
+    map/Table
+    data/HeroInfoConstants
+    data/HeroInfo
+    data/UnitConstants
+    unit/BattleContext
+    unit/Unit
+    unit/UnitManager
+    map/BattleMap
+    unit/GlobalBattleContext
+    combat/DamageCalculationUtility
+    combat/DamageCalculator
+    combat/PostCombatSkillHander
+    combat/DamageCalculatorWrapper
+    combat/BeginningOfTurnSkillHandler
+    database/SkillDatabase
+    database/HeroDatabase
+    database/SampleSkillInfos
+    database/SampleHeroInfos
+    skill-dsl/SkillEffectCore
+    skill-dsl/SkillEffectEnv
+    skill-dsl/SkillEffect
+    skill-dsl/SkillEffectField
+    skill-dsl/SkillEffectUnit
+    skill-dsl/SkillEffectBattleContext
+    skill-dsl/SkillEffectHooks
+    skill-dsl/SkillEffectRegistrar
+    skill-dsl/SkillEffectAliases
+    skill-impl/CustomSkill
+    skill-impl/SkillImpl
+    skill-impl/SkillImpl202408
+    skill-impl/SkillImpl202501
+    skill-impl/SkillImpl202601
     TestUtilities
     )
 TEST_UTIL_FILE_NAMES=(
