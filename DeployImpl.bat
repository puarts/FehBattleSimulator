@echo off
set main=%1
set outputname=%2
set JSMIN=%~dp0..\..\..\PortableApplications\JSMin-master\jsmin.bat
set root=%~dp0..\..\trunk\Websites\puarts.com
set destination=%root%\AetherRaidTacticsBoard\Release2
set output_js=%destination%\%outputname%.js
set filenames=GlobalDefinitions,Utilities,Logger,Skill,BattleMapElement,Tile,BattleMap,BattleMapSettings,Structures,Cell,Table,HeroInfo,Unit,UnitManager,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,SkillDatabase,HeroDatabase,TurnSetting,AudioManager,AetherRaidDefensePresets,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,%main%,VueComponents

call %~dp0MergeSources.bat %output_js% %filenames%

echo commpressing %output_js%
call %JSMIN% %output_js%

set copyfiles=%filenames% StatusCalcMain SampleSkillInfos SampleHeroInfos KeyRepeatHandler DamageCalculatorMain HeroStatusClustererMain
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.js %destination%\%%n.js
)
