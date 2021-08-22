@echo off
set output_js=%1
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
