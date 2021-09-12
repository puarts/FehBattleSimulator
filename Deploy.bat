@echo off
set JSMIN=%~dp0..\..\..\PortableApplications\JSMin-master\jsmin.bat
set destination=%~dp0..\AetherRaidTacticsBoard\Release2
set output_js=%destination%\FehBattleSimulator.js
set filenames=GlobalDefinitions,Utilities,Logger,Skill,Tile,Map,Structures,Cell,Table,HeroInfo,Unit,UnitManager,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,DamageCalculatorWrapper,SkillDatabase,HeroDatabase,TurnSetting,AudioManager,AetherRaidDefensePresets,AppData,SettingManager,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,Main,VueComponents

call %~dp0MergeSources.bat %output_js% %filenames%

echo commpressing %output_js%
call %JSMIN% %output_js%

set copyfiles=%filenames% StatusCalcMain SampleSkillInfos KeyRepeatHandler DamageCalculatorMain
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.js %destination%\%%n.js
)

pause
