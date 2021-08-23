#!/usr/bin/env bash

SOURCE_FILE_NAMES=(GlobalDefinitions Utilities Skill Tile Map Structures Table Unit DamageCalculator TurnSetting AudioManager AetherRaidDefensePresets AppData SettingManager)
TEST_FILE_NAMES=(DamageCalculator)

TARGET_FILE=All.test.js
touch ./Tests/$TARGET_FILE
cp /dev/null ./Tests/$TARGET_FILE

for name in ${SOURCE_FILE_NAMES[@]}; do
    cat ./Sources/${name}.js >> ./Tests/$TARGET_FILE
done

for name in ${TEST_FILE_NAMES[@]}; do
    cat ./Tests/${name}.test.js >> ./Tests/$TARGET_FILE
done

CONFIG=jest.config.js

cd Tests
npx jest $TARGET_FILE -c ../$CONFIG --silent=false --verbose false
rm $TARGET_FILE
