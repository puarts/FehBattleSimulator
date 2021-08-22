@echo off
set JSMIN=%~dp0..\..\..\PortableApplications\JSMin-master\jsmin.bat
set destination=%~dp0..\AetherRaidTacticsBoard\Release2
set output_js=%destination%\FehBattleSimulator.js

call %~dp0MergeSources.bat %output_js%

echo commpressing %output_js%
call %JSMIN% %output_js%

set copyfiles=%filenames%,StatusCalcMain
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.js %destination%\%%n.js
)

pause
