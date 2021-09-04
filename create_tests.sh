#!/usr/bin/env bash

SOURCE_FILE_NAMES=(GlobalDefinitions Utilities Skill Tile Map Structures Cell Table Unit DamageCalculationUtility DamageCalculator DamageCalculatorWrapper TurnSetting AudioManager AetherRaidDefensePresets UnitManager AppData SettingManager)
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
