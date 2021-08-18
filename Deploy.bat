@echo off
set JSMIN=%~dp0..\..\..\PortableApplications\JSMin-master\jsmin.bat
set destination=%~dp0..\AetherRaidTacticsBoard\Release2
set output_js=%destination%\FehBattleSimulator.js
set filenames=GlobalDefinitions,VueComponents,Utilities,Skill,Tile,Map,Structures,Table,Unit,DamageCalculator,TurnSetting,AudioManager,AetherRaidDefensePresets,AppData,SettingManager,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,Main
if exist %output_js% del %output_js%
break>%output_js%
for %%n in (%filenames%) do (
    if not exist %~dp0Sources\%%n.js (
        echo %~dp0Sources\%%n.js was not found
    ) else (
        type %~dp0Sources\%%n.js>>%output_js%
    )
)

echo commpressing %output_js%
call %JSMIN% %output_js%

set copyfiles=%filenames%,StatusCalcMain
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.js %destination%\%%n.js
)

pause
