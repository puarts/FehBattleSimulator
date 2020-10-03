@echo off
SetLocal EnableDelayedExpansion
set JSMIN=%~dp0..\..\..\PortableApplications\JSMin-master\jsmin.bat
set destination=%~dp0..\AetherRaidTacticsBoard\Release2

for %%n in (%~dp0Sources\*.js) do (
    if not %%~nn==GlobalDefinitions (
        xcopy /y %%n %destination%
        echo commpressing %destination%\%%~nxn
        %JSMIN% %destination%\%%~nxn
    )
)

pause
