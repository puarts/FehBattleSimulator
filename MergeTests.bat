@echo off
set TMP_TEST_JS=%1
set SOURCE_FILE_NAMES=GlobalDefinitions,Utilities,Skill,Tile,Map,Structures,Table,Unit,DamageCalculator,TurnSetting,AudioManager,AetherRaidDefensePresets,AppData,SettingManager

call %~dp0MergeSources.bat %TMP_TEST_JS% %SOURCE_FILE_NAMES%

set TEST_FILE_NAMES=DamageCalculator

for %%n in (%TEST_FILE_NAMES%) do (
    if not exist %~dp0Tests\%%n.test.js (
        echo %~dp0Tests\%%n.test.js was not found
    ) else (
        type %~dp0Tests\%%n.test.js>>%TMP_TEST_JS%
    )
)
