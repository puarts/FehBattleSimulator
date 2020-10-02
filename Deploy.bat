@echo off
SetLocal EnableDelayedExpansion
set JSMIN=%~dp0..\..\..\PortableApplications\JSMin-master\jsmin.bat
set destination=%~dp0..\AetherRaidTacticsBoard\Release2
set deply_filenames=Main.js,Unit.js,Skill.js,AetherRaidDefensePresets.js,AppData.js,AudioManager.js,DamageCalculator.js,Tile.js,Map.js,SettingManager.js,StatusCalcMain.js,Structures.js,Table.js,TurnSetting.js,Utilities.js

for %%n in (%deply_filenames%) do (
    xcopy /y %~dp0Sources\%%n %destination%
     echo commpressing %destination%\%%n
    %JSMIN% %destination%\%%n
)

pause
