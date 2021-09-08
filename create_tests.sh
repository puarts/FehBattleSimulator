#!/usr/bin/env bash

SOURCE_FILE_NAMES=(
    GlobalDefinitions
    Utilities
    Skill
    Tile
    Structures
    Cell
    Table
    HeroInfo
    Unit
    UnitManager
    Map
    GlobalBattleContext
    DamageCalculationUtility
    DamageCalculator
    DamageCalculatorWrapper
    SkillDatabase
    HeroDatabase
    SampleSkillInfos
    SampleHeroInfos
    TestUtilities
    )
TEST_FILE_NAMES=(
    DamageCalculator
    UnitManager
    )

TARGET_FILE=All.test.js
touch ./$TARGET_FILE
cp /dev/null ./$TARGET_FILE

for name in ${SOURCE_FILE_NAMES[@]}; do
    cat ./Sources/${name}.js >> ./$TARGET_FILE
done

for name in ${TEST_FILE_NAMES[@]}; do
    cat ./Tests/${name}.test.js >> ./$TARGET_FILE
done
