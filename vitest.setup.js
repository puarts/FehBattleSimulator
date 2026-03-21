// Vitest setup file
// Loads all source files via concatenation (stripping import/export),
// mimicking the create_tests.sh approach. This is necessary because
// source files have circular dependencies that prevent proper ESM loading.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname);
const SOURCES = path.join(ROOT, 'Sources');
const TESTS = path.join(ROOT, 'Tests');

// Same order as create_tests.sh SOURCE_FILE_NAMES
const SOURCE_FILE_NAMES = [
    'GlobalDefinitions', 'Utilities', 'Logger', 'SkillConstants', 'StatusConstants', 'Skill', 'SkillUtil',
    'BattleMapElement', 'Tile', 'Structures', 'Cell', 'Table',
    'HeroInfoConstants', 'HeroInfo', 'UnitConstants', 'BattleContext', 'UnitCore', 'UnitBattle',
    'UnitManager', 'BattleMap', 'GlobalBattleContext', 'DamageCalculationUtility',
    'DamageCalculator', 'PostCombatSkillHander', 'DamageCalculatorWrapper',
    'BeginningOfTurnSkillHandler', 'SkillDatabase', 'HeroDatabase',
    'SampleSkillInfos', 'SampleHeroInfos', 'SkillEffectCore', 'SkillEffectEnv',
    'SkillEffect', 'SkillEffectField', 'SkillEffectUnit',
    'SkillEffectBattleContext', 'SkillEffectHooks', 'UnitSkillEffect', 'SkillEffectRegistrar',
    'SkillEffectAliases', 'CustomSkill', 'SkillImpl', 'SkillImpl202408',
    'SkillImpl202501', 'SkillImpl202601', 'TestUtilities',
];

const TEST_UTIL_FILE_NAMES = ['TestGlobals'];

function filterImportExport(content) {
    return content
        .split('\n')
        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
        .map(line => line.replace(/^export (function|class|const|let|var) /, '$1 '))
        .join('\n');
}

// Concatenate all source files
let concatenated = '';
for (const name of SOURCE_FILE_NAMES) {
    const filePath = path.join(SOURCES, name + '.js');
    concatenated += filterImportExport(fs.readFileSync(filePath, 'utf-8')) + '\n';
}
for (const name of TEST_UTIL_FILE_NAMES) {
    const filePath = path.join(TESTS, name + '.js');
    concatenated += fs.readFileSync(filePath, 'utf-8') + '\n';
}

// Execute in a context where 'this' is globalThis, so var/function declarations
// and explicit assignments become global properties.
// Wrap in a function to catch const/let/class and expose them via 'this'.
// UnitSkillEffect.js の initUnitSkillEffects を呼び出して prototype にメソッドを追加
concatenated += '\ninitUnitSkillEffects(Unit);\n';

const script = new vm.Script(concatenated, { filename: 'vitest-concatenated-sources.js' });
script.runInThisContext();
