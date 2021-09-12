@echo off
set TMP_TEST_JS=%1
set SOURCE_FILE_NAMES=GlobalDefinitions,Utilities,Logger,Skill,Tile,Map,Structures,Cell,Table,HeroInfo,Unit,UnitManager,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,DamageCalculatorWrapper,TurnSetting,AudioManager,AetherRaidDefensePresets,SkillDatabase,HeroDatabase
set SOURCE_FILE_NAMES=%SOURCE_FILE_NAMES%,SampleSkillInfos,SampleHeroInfos,TestUtilities

call %~dp0MergeSources.bat %TMP_TEST_JS% %SOURCE_FILE_NAMES%

set TEST_FILE_NAMES=UnitManager DamageCalculator

for %%n in (%TEST_FILE_NAMES%) do (
    if not exist %~dp0Tests\%%n.test.js (
        echo %~dp0Tests\%%n.test.js was not found
    ) else (
        type %~dp0Tests\%%n.test.js>>%TMP_TEST_JS%
    )
)
