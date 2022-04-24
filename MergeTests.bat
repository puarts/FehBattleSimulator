@echo off
set TMP_TEST_JS=%1
set SOURCE_FILE_NAMES=GlobalDefinitions,Utilities,Logger,Skill,BattleMapElement,Tile,BattleMap,Structures,Cell,Table,HeroInfo,Unit,UnitManager,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,TurnSetting,AudioManager,AetherRaidDefensePresets,SkillDatabase,HeroDatabase
set SOURCE_FILE_NAMES=%SOURCE_FILE_NAMES%,SampleSkillInfos,SampleHeroInfos,TestUtilities

call %~dp0MergeSources.bat %TMP_TEST_JS% %SOURCE_FILE_NAMES%

set TEST_UTIL_FILE_NAMES=TestGlobals
set TEST_FILE_NAMES=UnitManager DamageCalculator BeginningOfTurnSkillHandler

for %%n in (%TEST_UTIL_FILE_NAMES%) do (
    if exist %~dp0Tests\%%n.js (
        type %~dp0Tests\%%n.js>>%TMP_TEST_JS%
    ) else (
        echo %~dp0Tests\%%n.js was not found
    )
)

for %%n in (%TEST_FILE_NAMES%) do (
    if exist %~dp0Tests\%%n.test.js (
        type %~dp0Tests\%%n.test.js>>%TMP_TEST_JS%
    ) else (
        echo %~dp0Tests\%%n.test.js was not found
    )
)
