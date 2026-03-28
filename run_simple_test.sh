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
    SkillEffectField
    SkillEffectUnit
    SkillEffectBattleContext
    SkillEffectHooks
    SkillEffectRegistrar
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
    combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef
    combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit
    combat/DamageCalculatorWrapper_ApplySkillEffects
    combat/DamageCalculatorWrapper_Spur
    combat/DamageCalculatorWrapper_FollowupAndCounter
    BeginningOfTurnSkillHandler
    SkillDatabase
    HeroDatabase
    SampleSkillInfos
    SampleHeroInfos
    SkillEffectAliases
    SkillImpl
    SkillImpl202408
    SkillImpl202501
    SkillImpl202601
    TestUtilities
    )
TEST_UTIL_FILE_NAMES=(
    TestGlobals
    )
TEST_FILE_NAMES=(
    SimpleUtility
    )

TARGET_FILE=SimpleUtility.test.js
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

# Run the test
npx jest $TARGET_FILE --silent=false --verbose true

# Clean up
rm $TARGET_FILE