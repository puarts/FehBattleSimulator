import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve } from 'path';

const SOURCES_DIR = resolve(import.meta.dirname, '..', 'Sources');

function readSource(filename) {
    return readFileSync(resolve(SOURCES_DIR, filename), 'utf-8');
}

/**
 * import文からモジュール名を抽出する
 */
function extractImportSources(content) {
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const sources = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        sources.push(match[1]);
    }
    return sources;
}

describe('Section 6: Remaining cycle resolution', () => {
    describe('Task 1: SkillEffect.js and SkillEffectBattleContext.js', () => {
        it('SkillEffectBattleContext.js does not import from SkillEffect.js', () => {
            const content = readSource('SkillEffectBattleContext.js');
            const sources = extractImportSources(content);
            expect(sources).not.toContain('./SkillEffect.js');
        });

        it('SkillEffectField.js does not import from SkillEffect.js', () => {
            const content = readSource('SkillEffectField.js');
            const sources = extractImportSources(content);
            expect(sources).not.toContain('./SkillEffect.js');
        });

        it('SkillEffectCore.js exports EffectNode', () => {
            const content = readSource('SkillEffectCore.js');
            expect(content).toMatch(/export\s*\{[^}]*EffectNode[^}]*\}/);
        });

        it('SkillEffectCore.js exports SingleEffectNode', () => {
            const content = readSource('SkillEffectCore.js');
            expect(content).toMatch(/export\s*\{[^}]*SingleEffectNode[^}]*\}/);
        });

        it('SkillEffectCore.js exports EffectsNode', () => {
            const content = readSource('SkillEffectCore.js');
            expect(content).toMatch(/export\s*\{[^}]*EffectsNode[^}]*\}/);
        });
    });

    describe('Task 2: SkillEffectCore.js and CustomSkill.js', () => {
        it('SkillEffectCore.js does not reference CustomSkill directly', () => {
            const content = readSource('SkillEffectCore.js');
            // CustomSkill should not appear as a direct reference (except in comments)
            const lines = content.split('\n');
            const codeLines = lines.filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
            const codeContent = codeLines.join('\n');
            expect(codeContent).not.toMatch(/\bCustomSkill\b/);
        });

        it('SkillEffectCore.js exports setCustomSkillRegistry', () => {
            const content = readSource('SkillEffectCore.js');
            expect(content).toMatch(/export\s*\{[^}]*setCustomSkillRegistry[^}]*\}/);
        });

        it('CustomSkill.js imports and calls setCustomSkillRegistry', () => {
            const content = readSource('CustomSkill.js');
            expect(content).toMatch(/setCustomSkillRegistry/);
        });
    });

    describe('Task 3: Utilities.js layer purity', () => {
        it('Utilities.js does not import from Unit, Tile, Skill, or any Layer 1+ module', () => {
            const content = readSource('Utilities.js');
            const sources = extractImportSources(content);
            const forbiddenModules = ['Unit', 'Tile', 'Skill', 'StatusEffect', 'BattleSimulator'];
            for (const source of sources) {
                for (const forbidden of forbiddenModules) {
                    expect(source).not.toContain(forbidden);
                }
            }
        });

        it('GameUtilities.js exists and exports UnitQuery', () => {
            const content = readSource('GameUtilities.js');
            expect(content).toMatch(/class UnitQuery/);
            expect(content).toMatch(/export\s*\{[^}]*UnitQuery[^}]*\}/);
        });

        it('GameUtilities.js exists and exports TileQuery', () => {
            const content = readSource('GameUtilities.js');
            expect(content).toMatch(/class TileQuery/);
            expect(content).toMatch(/export\s*\{[^}]*TileQuery[^}]*\}/);
        });

        it('Utilities.js does not contain UnitQuery or TileQuery', () => {
            const content = readSource('Utilities.js');
            expect(content).not.toMatch(/class UnitQuery/);
            expect(content).not.toMatch(/class TileQuery/);
        });
    });

    describe('Task 4: Zero cycles', () => {
        it('madge --circular Sources/ reports no circular dependencies', () => {
            const result = execFileSync('npx', ['madge', '--circular', '--no-color', 'Sources/'], {
                cwd: resolve(SOURCES_DIR, '..'),
                encoding: 'utf-8',
                timeout: 30000,
            });
            // madge outputs "Processed N files (Xs)" when no cycles found
            // and lists "→" arrows between files when cycles exist
            expect(result).not.toMatch(/→/);
            expect(result).toMatch(/Processed \d+ files/);
        });
    });
});
