#!/usr/bin/env node
// Verifies all source files referenced in create_tests.sh and build.mjs
// have import or export statements (i.e., have been converted to ESM).

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SOURCES = join(ROOT, 'Sources');

// Files referenced in create_tests.sh SOURCE_FILE_NAMES
const TEST_SOURCE_FILES = [
    'GlobalDefinitions', 'Utilities', 'Logger', 'SkillConstants', 'Skill',
    'BattleMapElement', 'Tile', 'Structures', 'Cell', 'Table',
    'HeroInfoConstants', 'HeroInfo', 'UnitConstants', 'BattleContext', 'Unit',
    'UnitManager', 'BattleMap', 'GlobalBattleContext',
    'DamageCalculationUtility', 'DamageCalculator', 'PostCombatSkillHander',
    'DamageCalculatorWrapper', 'BeginningOfTurnSkillHandler',
    'SkillDatabase', 'HeroDatabase', 'SampleSkillInfos', 'SampleHeroInfos',
    'SkillEffectCore', 'SkillEffectEnv', 'SkillEffect', 'SkillEffectField',
    'SkillEffectUnit', 'SkillEffectBattleContext', 'SkillEffectHooks',
    'SkillEffectRegistrar', 'SkillEffectAliases',
    'CustomSkill', 'SkillImpl', 'SkillImpl202408', 'SkillImpl202501', 'SkillImpl202601',
    'TestUtilities',
];

// Additional files referenced in build.mjs but not in test sources
const BUILD_ONLY_FILES = [
    'BattleMapSettings', 'TurnSetting', 'AudioManager', 'AetherRaidDefensePresets',
    'SettingManager', 'AppData',
    'Main_ImageProcessing', 'Main_OriginalAi', 'Main_MouseAndTouch',
    'BattleSimulatorBase', 'VueComponents',
    'AetherRaidSimulatorMain', 'ArenaSimulatorMain', 'SummonerDuelsSimulatorMain',
    'StatusCalcMain', 'UnitBuilderMain', 'KeyRepeatHandler',
    'DamageCalculatorMain', 'HeroIconListerMain',
];

const ALL_FILES = [...TEST_SOURCE_FILES, ...BUILD_ONLY_FILES];

function checkFile(name) {
    const filePath = join(SOURCES, `${name}.js`);
    let content;
    try {
        content = readFileSync(filePath, 'utf-8');
    } catch {
        return { name, status: 'missing', error: 'File not found' };
    }

    const lines = content.split('\n');
    const hasImport = lines.some(line => /^import /.test(line));
    const hasExport = lines.some(line => /^export /.test(line));

    if (hasImport || hasExport) {
        return { name, status: 'ok', hasImport, hasExport };
    }
    return { name, status: 'no_esm', hasImport, hasExport };
}

const results = ALL_FILES.map(checkFile);
const failures = results.filter(r => r.status !== 'ok');

if (failures.length === 0) {
    console.log(`OK: All ${results.length} source files have import/export statements.`);
    process.exit(0);
} else {
    console.error(`FAIL: ${failures.length} file(s) missing import/export statements:`);
    for (const f of failures) {
        console.error(`  - ${f.name}.js (${f.status})`);
    }
    process.exit(1);
}
