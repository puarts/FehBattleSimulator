#!/usr/bin/env bash
# add files
SOURCE_FILE_NAMES=(
    core/GlobalDefinitions
    core/Utilities
    core/Logger
    data/SkillConstants
    data/Skill
    map/BattleMapElement
    map/Tile
    map/Structures
    map/Cell
    map/Table
    data/HeroInfoConstants
    data/HeroInfo
    data/UnitConstants
    unit/BattleContext
    unit/UnitContext
    unit/Unit
    unit/UnitUtility
    unit/UnitManager
    map/BattleMap
    unit/GlobalBattleContext
    combat/DamageCalculationUtility
    combat/DamageCalculator
    combat/PostCombatSkillHander
    combat/PerformanceProfile
    combat/ScopedTileChanger
    combat/DamageCalculatorWrapper
    combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef
    combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit
    combat/DamageCalculatorWrapper_ApplySkillEffects
    combat/DamageCalculatorWrapper_Spur
    combat/DamageCalculatorWrapper_FollowupAndCounter
    combat/BeginningOfTurnSkillHandler
    database/SkillDatabase
    database/HeroDatabase
    database/SampleSkillInfos
    database/SampleHeroInfos
    skill-dsl/SkillEffectCore
    skill-dsl/SkillEffectEnv
    skill-dsl/SkillEffect
    skill-dsl/SkillEffectField
    skill-dsl/SkillEffectUnit
    skill-dsl/SkillEffectBattleContext
    skill-dsl/SkillEffectHooks
    skill-dsl/SkillEffectRegistrar
    skill-dsl/SkillEffectAliases
    skill-impl/CustomSkill
    skill-impl/SkillImpl
    skill-impl/SkillImpl202408
    skill-impl/SkillImpl202501
    skill-impl/SkillImpl202601
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
    FileSplit
    ScopedTileChanger
    UnitContext
    UnitUtility
    DamageCalculatorWrapperSplit
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
    SELECTED_TEST_FILES=(UnitManager SimpleUtility Performance TestHelper)
    ;;
  *)
    SELECTED_TEST_FILES=("${TEST_FILE_NAMES[@]}")
    ;;
esac

TARGET_FILE=All.test.js
touch ./$TARGET_FILE
cp /dev/null ./$TARGET_FILE

for name in ${SOURCE_FILE_NAMES[@]}; do
    cat ./Sources/${name}.js >> ./$TARGET_FILE
done

for name in ${TEST_UTIL_FILE_NAMES[@]}; do
    cat ./Tests/${name}.js >> ./$TARGET_FILE
done

for name in ${SELECTED_TEST_FILES[@]}; do
    cat ./Tests/${name}.test.js >> ./$TARGET_FILE
done
