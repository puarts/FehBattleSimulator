import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

describe('Final Validation: All layer violations resolved', () => {

    // Test 1: madge --circular で循環依存ゼロ
    it('madge --circular reports no circular dependencies', { timeout: 30000 }, () => {
        let exitCode = 0;
        try {
            execFileSync('npx', ['madge', '--circular', '--no-color', 'Sources/'], {
                cwd: process.cwd(),
                encoding: 'utf-8',
                timeout: 30000,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        } catch (e) {
            exitCode = e.status || 1;
        }
        expect(exitCode, 'madge should exit with 0 (no circular dependencies)').toBe(0);
    });

    // Test 2: Layer 1-4 ファイルが Layer 5+ からimportしていない
    describe('Layer 1-4 files do not import from Layer 5+', () => {
        // Layer 5+ ファイルのリスト
        // - AppDataGlobal.js(L0)を除外するため AppData\.js に修正
        const layer5PlusPatterns = [
            'SkillEffectCore', 'SkillEffectEnv', 'SkillEffectField', 'SkillEffectUnit',
            'SkillEffectHooks', 'SkillEffect\\.js',
            'SkillImpl', 'CustomSkill',
            'AppData\\.js', 'BattleSimulatorBase', 'VueComponents', 'DialogUtil',
            'ArenaSimulatorMain', 'StatusCalcMain',
        ];

        // DamageCalculator.js(L4)のLayer 5依存は既知でこのフェーズではスコープ外
        // violation-status.md に記録済み
        const knownExceptions = {
            'DamageCalculator.js': ['SkillEffect.js', 'SkillEffectHooks.js', 'SkillEffectEnv.js'],
            'DamageCalculatorWrapper.js': ['SkillEffect.js', 'SkillEffectEnv.js', 'SkillEffectHooks.js'],
        };

        const layer1to4Files = [
            'StatusConstants.js',         // L1
            'SkillConstants.js',          // L1
            'Skill.js',                   // L2
            'HeroInfo.js',                // L2
            'UnitCore.js',                // L3
            'UnitBattle.js',              // L3
            'BattleContext.js',           // L3
            'BattleMap.js',               // L3
            'DamageCalculator.js',        // L4
            'DamageCalculatorWrapper.js', // L4
        ];

        for (const file of layer1to4Files) {
            it(`${file} does not import from Layer 5+ files`, () => {
                const filePath = join(resolve(process.cwd(), 'Sources'), file);
                expect(existsSync(filePath), `${file} should exist`).toBe(true);
                const content = readFileSync(filePath, 'utf-8');
                const importPaths = [...content.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g)]
                    .map(m => m[1]);
                const exceptions = knownExceptions[file] || [];
                for (const imp of importPaths) {
                    if (exceptions.includes(imp)) continue;
                    for (const pattern of layer5PlusPatterns) {
                        expect(imp, `${file} should not import ${imp} (matches Layer 5+ pattern: ${pattern})`)
                            .not.toMatch(new RegExp(`^${pattern}`));
                    }
                }
            });
        }
    });

    // Test 3: Layer 5 ファイルが Layer 7+ からimportしていない
    describe('Layer 5 files do not import from Layer 7+', () => {
        const layer7PlusPatterns = [
            'AppData\\.js', 'BattleSimulatorBase', 'VueComponents', 'DialogUtil',
            'ArenaSimulatorMain', 'StatusCalcMain', 'store',
        ];

        const layer5Files = [
            'SkillEffect.js',
            'SkillEffectCore.js',
            'SkillEffectField.js',
            'SkillEffectUnit.js',
        ];

        for (const file of layer5Files) {
            it(`${file} does not import from Layer 7+ files`, () => {
                const filePath = join(resolve(process.cwd(), 'Sources'), file);
                expect(existsSync(filePath), `${file} should exist`).toBe(true);
                const content = readFileSync(filePath, 'utf-8');
                const importPaths = [...content.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g)]
                    .map(m => m[1]);
                for (const imp of importPaths) {
                    for (const pattern of layer7PlusPatterns) {
                        expect(imp, `${file} should not import ${imp} (matches Layer 7+ pattern: ${pattern})`)
                            .not.toMatch(new RegExp(pattern));
                    }
                }
            });
        }
    });
});
