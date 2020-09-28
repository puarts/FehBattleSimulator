@echo off
SetLocal EnableDelayedExpansion
set JSMIN=F:\trunk\PortableApplications\JSMin-master\jsmin.bat
set destination=F:\trunk\Websites\puarts.com\AetherRaidTacticsBoard\Release2
set deply_filenames=Main.js,Unit.js,Skill.js,AetherRaidDefensePresets.js,AppData.js,AudioManager.js,DamageCalculator.js,Map.js,Setting.js,StatusCalcMain.js,Structures.js,Table.js,TurnSetting.js,Utilities.js

for %%n in (%deply_filenames%) do (
    xcopy /y %~dp0Sources\%%n %destination%
     echo commpressing %destination%\%%n
    %JSMIN% %destination%\%%n
)

pause
