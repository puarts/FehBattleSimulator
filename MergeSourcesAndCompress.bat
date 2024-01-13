@echo off
set outputname=%1
shift
set filenames=
:CHECK_AND_SHIFT_ARGS
if "%1"=="" goto END_PARSE_ARGS
set filenames=%filenames% %1
shift
goto CHECK_AND_SHIFT_ARGS
:END_PARSE_ARGS

set trunk_root=%~dp0..\..\trunk
set JSMIN=%trunk_root%\PortableApplications\JSMin-master\jsmin.bat
set root=%trunk_root%\Websites\fire-emblem.fun
set destination=%root%\feh\AetherRaidTacticsBoard\Release2
set output_js=%destination%\%outputname%.js

call %~dp0MergeSources.bat %output_js% %filenames%

echo commpressing %output_js%
call %JSMIN% %output_js%
