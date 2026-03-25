// Vitest setup file
// Loads all source files via concatenation (stripping import/export),
// mimicking the create_tests.sh approach. This is necessary because
// source files have circular dependencies that prevent proper ESM loading.
//
// TODO: Remove this concatenation after resolving circular dependencies in:
//   - SkillEffect.js ↔ SkillEffectUnit.js (class hierarchy cycle at evaluation time)
//   - SkillEffect.js ↔ SkillEffectField.js (SingleEffectNode cross-reference)
//   - SkillImpl files (hundreds of missing ESM imports from concatenation globals)
// See: docs/planning/phase4/implementation/code_review/section-09-interview.md

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname);
const SOURCES = path.join(ROOT, 'Sources');
const TESTS = path.join(ROOT, 'Tests');

// Same order as create_tests.sh SOURCE_FILE_NAMES
const SOURCE_FILE_NAMES = [
    'AppDataGlobal',
    'GlobalDefinitions', 'Utilities', 'GameUtilities', 'Logger', 'SkillConstants', 'StatusConstants', 'Skill', 'SkillUtil',
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
    const lines = content.split('\n');
    const result = [];
    let inMultiLineImport = false;
    for (const line of lines) {
        if (inMultiLineImport) {
            // Skip lines until we find the closing of the import statement
            if (/\bfrom\s+['"]/.test(line) || /^}\s*from\s+['"]/.test(line)) {
                inMultiLineImport = false;
            }
            continue;
        }
        if (/^import /.test(line)) {
            // Check if this is a complete single-line import
            if (/from\s+['"]/.test(line) || /^import\s+['"]/.test(line)) {
                continue; // single-line import, skip it
            }
            // Multi-line import starts here
            inMultiLineImport = true;
            continue;
        }
        if (/^export \{/.test(line)) {
            continue;
        }
        result.push(line.replace(/^export (function|class|const|let|var) /, '$1 '));
    }
    return result.join('\n');
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
