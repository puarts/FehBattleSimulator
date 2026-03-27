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
    describe('Task 1: EffectNode layer separation', () => {
        it('SkillEffectCore.js exports EffectNode (abstract base class)', () => {
            const content = readSource('SkillEffectCore.js');
            expect(content).toMatch(/export\s*\{[^}]*EffectNode[^}]*\}/);
        });

        it('EffectNode class is defined in SkillEffectCore.js', () => {
            const content = readSource('SkillEffectCore.js');
            expect(content).toMatch(/class EffectNode extends SkillEffectNode/);
        });

        it('SingleEffectNode and EffectsNode remain in SkillEffect.js', () => {
            const content = readSource('SkillEffect.js');
            expect(content).toMatch(/class SingleEffectNode extends EffectNode/);
            expect(content).toMatch(/class EffectsNode extends EffectNode/);
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
            expect(content).toMatch(/export\s+(function\s+setCustomSkillRegistry|\{[^}]*setCustomSkillRegistry[^}]*\})/);
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
        it('madge --circular Sources/ reports no circular dependencies', { timeout: 30000 }, () => {
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
