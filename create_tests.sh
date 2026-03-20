#!/usr/bin/env bash
# add files
SOURCE_FILE_NAMES=(
    GlobalDefinitions
    Utilities
    Logger
    SkillConstants
    Skill
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
    SkillEffectCore
    SkillEffectEnv
    SkillEffect
    SkillEffectField
    SkillEffectUnit
    SkillEffectBattleContext
    SkillEffectHooks
    SkillEffectRegistrar
    SkillEffectAliases
    CustomSkill
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
    # 既存
    DamageCalculator
    UnitManager
    BeginningOfTurnSkillHandler
    SkillEffect
    GetRequirements
    SimpleUtility
    # 新規
    SkillRegression
    CombatFlow
    SpecialCount
    DamageReduction
    FollowUpAttack
    StatusEffect
    DslNode
    Performance
    TestHelper
    SmokeTest
    BuildFilter
    # EsmValidation -- uses ESM imports, Vitest-only
    )

# カテゴリに応じたテストファイル選択
case "$1" in
  skill)
    SELECTED_TEST_FILES=(SkillRegression)
    ;;
  combat)
    SELECTED_TEST_FILES=(DamageCalculator BeginningOfTurnSkillHandler
                         CombatFlow SpecialCount DamageReduction
                         FollowUpAttack StatusEffect)
    ;;
  dsl)
    SELECTED_TEST_FILES=(SkillEffect GetRequirements DslNode)
    ;;
  infra)
    SELECTED_TEST_FILES=(UnitManager SimpleUtility Performance TestHelper SmokeTest)
    ;;
  *)
    SELECTED_TEST_FILES=("${TEST_FILE_NAMES[@]}")
    ;;
esac

TARGET_FILE=All.test.js
touch ./$TARGET_FILE
cp /dev/null ./$TARGET_FILE

for name in ${SOURCE_FILE_NAMES[@]}; do
    grep -v -E '^import |^export \{' ./Sources/${name}.js >> ./$TARGET_FILE || true
done

for name in ${TEST_UTIL_FILE_NAMES[@]}; do
    cat ./Tests/${name}.js >> ./$TARGET_FILE
done

for name in ${SELECTED_TEST_FILES[@]}; do
    cat ./Tests/${name}.test.js >> ./$TARGET_FILE
done
