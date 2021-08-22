@echo off

set output_js=%1
shift
set filenames=
:CHECK_AND_SHIFT_ARGS
if "%1"=="" goto END_PARSE_ARGS
set filenames=%filenames% %1
shift
goto CHECK_AND_SHIFT_ARGS
:END_PARSE_ARGS

echo %output_js%
echo %filenames%
break>%output_js%
for %%n in (%filenames%) do (
    if not exist %~dp0Sources\%%n.js (
        echo %~dp0Sources\%%n.js was not found
    ) else (
        type %~dp0Sources\%%n.js>>%output_js%
    )
)

