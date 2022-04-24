#!/usr/bin/env bash

SOURCE_FILE_NAMES=(
    GlobalDefinitions
    Utilities
    Logger
    Skill
    BattleMapElement
    Tile
    Structures
    Cell
    Table
    HeroInfo
    Unit
    UnitManager
    BattleMap
    GlobalBattleContext
    DamageCalculationUtility
    DamageCalculator
    PostCombatSkillHander
    DamageCalculatorWrapper
    BeginningOfTurnSkillHandler
    SkillDatabase
    HeroDatabase
    SampleSkillInfos
    SampleHeroInfos
    TestUtilities
    )
TEST_UTIL_FILE_NAMES=(
    TestGlobals
    )
TEST_FILE_NAMES=(
    DamageCalculator
    UnitManager
    BeginningOfTurnSkillHandler
    )

TARGET_FILE=All.test.js
touch ./$TARGET_FILE
cp /dev/null ./$TARGET_FILE

for name in ${SOURCE_FILE_NAMES[@]}; do
    cat ./Sources/${name}.js >> ./$TARGET_FILE
done

for name in ${TEST_UTIL_FILE_NAMES[@]}; do
    cat ./Tests/${name}.js >> ./$TARGET_FILE
done

for name in ${TEST_FILE_NAMES[@]}; do
    cat ./Tests/${name}.test.js >> ./$TARGET_FILE
done
