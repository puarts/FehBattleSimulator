@echo off
set JSMIN=%~dp0..\..\..\PortableApplications\JSMin-master\jsmin.bat
set destination=%~dp0..\AetherRaidTacticsBoard\Release2
set output_js=%destination%\FehBattleSimulator.js
set filenames=GlobalDefinitions,VueComponents,Utilities,Skill,Tile,Map,Structures,Cell,Table,Unit,DamageCalculationUtility,DamageCalculator,DamageCalculatorWrapper,TurnSetting,AudioManager,AetherRaidDefensePresets,AppData,SettingManager,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,Main

call %~dp0MergeSources.bat %output_js% %filenames%

echo commpressing %output_js%
call %JSMIN% %output_js%

set copyfiles=%filenames% StatusCalcMain SampleSkillInfos KeyRepeatHandler DamageCalculatorMain
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.js %destination%\%%n.js
)

pause
