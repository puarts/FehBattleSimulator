@echo off

set TMP_TEST_JS=%~dp0Outputs\All.test.js
echo %TMP_TEST_JS%

mkdir Outputs

call %~dp0MergeTests.bat %TMP_TEST_JS%

rem jestではパスにバックスラッシュがあるとエラーになるのでスラッシュに変換
set TMP_TEST_JS=%TMP_TEST_JS:\=/%

REM set TEST_PATH=%~dp0Tests/.+.js
REM set TEST_PATH=%TEST_PATH:\=/%

set CONFIG=%~dp0jest.config.js
set CONFIG=%CONFIG:\=/%

call npx jest "%TMP_TEST_JS%" -c %CONFIG% --silent=false --verbose false

