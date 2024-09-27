#!/usr/bin/env bash
# add files
SOURCE_FILE_NAMES=(
    GlobalDefinitions
    Utilities
    Logger
    SkillConstants
    Skill
    SkillEffectCore
    SkillEffectEnv
    SkillEffect
    SkillEffectBattleContext
    SkillEffectHooks
    BattleMapElement
    Tile
    Structures
    Cell
    Table
    HeroInfoConstants
    HeroInfo
    UnitConstants
    BattleContext
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
    SkillEffectAliases
    SkillImpl
    SkillImpl202408
    TestUtilities
    )
TEST_UTIL_FILE_NAMES=(
    TestGlobals
    )
TEST_FILE_NAMES=(
    DamageCalculator
    UnitManager
    BeginningOfTurnSkillHandler
    SkillEffect
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
