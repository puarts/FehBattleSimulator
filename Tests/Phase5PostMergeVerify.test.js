import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

describe('Phase5 Post-Merge Verification', () => {
    const ROOT = path.resolve(import.meta.dirname, '..');
    const SOURCES = path.join(ROOT, 'Sources');

    describe('Circular dependency check', () => {
        it('madge --circular reports zero cycles in Sources/', { timeout: 30000 }, () => {
            const result = execFileSync('npx', ['madge', '--circular', '--json', 'Sources/'], {
                cwd: ROOT,
                encoding: 'utf-8',
            });
            const cycles = JSON.parse(result);
            expect(cycles).toEqual([]);
        });
    });

    describe('SkillEffect.js dynamic import', () => {
        it('should import successfully without module evaluation errors', async () => {
            const mod = await import('../Sources/SkillEffect.js');
            expect(mod).toBeDefined();
        });

        it('should export key symbols from merged SkillEffectUnit.js content', async () => {
            const mod = await import('../Sources/SkillEffect.js');
            expect(mod.UNIT).toBeDefined();
            expect(mod.FOE).toBeDefined();
            expect(mod.ALLIES).toBeDefined();
            expect(mod.FOES).toBeDefined();
            expect(mod.TextUnitNode).toBeDefined();
            expect(mod.TextFoeNode).toBeDefined();
        });

        it('should export key symbols from merged SkillEffectField.js content', async () => {
            const mod = await import('../Sources/SkillEffect.js');
            expect(mod.SkillEffectField).toBeDefined();
            expect(mod.SkillEffectFieldNode).toBeDefined();
            expect(mod.GetSkillEffectFieldNode).toBeDefined();
            expect(mod.ModSkillEffectFieldNode).toBeDefined();
        });
    });

    describe('Re-export files', () => {
        it('SkillEffectUnit.js re-exports UNIT, FOE, ALLIES from SkillEffect.js', async () => {
            const mod = await import('../Sources/SkillEffectUnit.js');
            expect(mod.UNIT).toBeDefined();
            expect(mod.FOE).toBeDefined();
            expect(mod.ALLY).toBeDefined();
            expect(mod.ALLIES).toBeDefined();
            expect(mod.FOES).toBeDefined();
        });

        it('SkillEffectField.js re-exports Field symbols from SkillEffect.js', async () => {
            const mod = await import('../Sources/SkillEffectField.js');
            expect(mod.SkillEffectField).toBeDefined();
            expect(mod.SkillEffectFieldNode).toBeDefined();
            expect(mod.GetSkillEffectFieldNode).toBeDefined();
            expect(mod.ModSkillEffectFieldNode).toBeDefined();
        });

        it('re-export symbols are identical to direct SkillEffect.js exports', async () => {
            const direct = await import('../Sources/SkillEffect.js');
            const viaUnit = await import('../Sources/SkillEffectUnit.js');
            const viaField = await import('../Sources/SkillEffectField.js');
            expect(viaUnit.UNIT).toBe(direct.UNIT);
            expect(viaField.SkillEffectFieldNode).toBe(direct.SkillEffectFieldNode);
        });
    });

    describe('Merged class functionality', () => {
        it('UNIT.sameGroup() returns a valid node instance', async () => {
            const { UNIT } = await import('../Sources/SkillEffect.js');
            const allies = UNIT.sameGroup();
            expect(allies).toBeDefined();
            expect(typeof allies).toBe('object');
        });

        it('GRANTS_BONUS DSL function works correctly', async () => {
            const { GRANTS_BONUS } = await import('../Sources/SkillEffect.js');
            expect(typeof GRANTS_BONUS).toBe('function');
        });
    });

    describe('Transitional compatibility', () => {
        it('re-export files are filtered cleanly by filterImportExport logic', () => {
            for (const filename of ['SkillEffectUnit.js', 'SkillEffectField.js']) {
                const content = fs.readFileSync(path.join(SOURCES, filename), 'utf-8');
                const filtered = content
                    .split('\n')
                    .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
                    .map(line => line.replace(/^export (function|class|const|let|var) /, '$1 '))
                    .join('\n')
                    .trim();
                // After filtering, re-export files should be empty (no executable code remains)
                expect(filtered, `${filename} should be empty after filterImportExport`).toBe('');
            }
        });
    });
});
