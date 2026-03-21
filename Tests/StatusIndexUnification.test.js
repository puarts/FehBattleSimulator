// Tests/StatusIndexUnification.test.js
import { describe, it, expect } from 'vitest';

describe('StatusIndex Unification', () => {
    // StatusIndex value tests are in StatusConstants.test.js — not duplicated here

    describe('SkillEffect.js does not export StatusIndex numeric aliases', () => {
        // Verify that SkillEffect.js ATK/SPD/DEF/RES exports are functions (DSL), not numbers
        it('ATK/SPD/DEF/RES from SkillEffect.js are functions, not numbers', async () => {
            const se = await import('../Sources/SkillEffect.js');
            // These should be StatsNode factory functions, not numeric aliases
            expect(typeof se.ATK).toBe('function');
            expect(typeof se.SPD).toBe('function');
            expect(typeof se.DEF).toBe('function');
            expect(typeof se.RES).toBe('function');
        });
    });

    describe('No Layer 1-4 file imports ATK/SPD/DEF/RES from Layer 5', () => {
        it('no Layer 1-4 source files import bare ATK/SPD/DEF/RES from Layer 5 files', async () => {
            const fs = await import('fs');
            const path = await import('path');
            const sourcesDir = path.resolve(process.cwd(), 'Sources');

            // Layer 1-4 files that should NOT import ATK/SPD/DEF/RES from Layer 5
            const layer1to4Files = [
                // L1 (Constants)
                'StatusConstants.js', 'SkillConstants.js', 'HeroInfoConstants.js', 'UnitConstants.js',
                // L2 (Models)
                'Skill.js', 'HeroInfo.js', 'Tile.js', 'Cell.js', 'Structures.js', 'Table.js',
                // L3 (Entities)
                'UnitCore.js', 'UnitBattle.js', 'BattleContext.js', 'UnitManager.js', 'BattleMap.js',
                'GlobalBattleContext.js',
                // L4 (Logic)
                'DamageCalculator.js', 'DamageCalculatorWrapper.js',
                'BeginningOfTurnSkillHandler.js', 'HeroDatabase.js', 'SkillDatabase.js',
            ];

            // Layer 5 source files (imports from any of these would be a violation)
            const layer5Files = ['SkillEffect.js', 'SkillEffectCore.js', 'SkillEffectField.js',
                'SkillEffectUnit.js', 'SkillEffectBattleContext.js', 'SkillEffectAliases.js',
                'UnitSkillEffect.js'];
            const layer5Pattern = layer5Files.map(f => f.replace('.', '\\.')).join('|');

            for (const fileName of layer1to4Files) {
                const filePath = path.join(sourcesDir, fileName);
                if (!fs.existsSync(filePath)) continue;
                const content = fs.readFileSync(filePath, 'utf-8');
                // Check for imports of bare ATK/SPD/DEF/RES from any Layer 5 file
                // Handles both single-line and multi-line import statements
                const importRegex = new RegExp(
                    `import\\s*\\{[^}]*\\b(?:ATK|SPD|DEF|RES)\\b[^}]*\\}\\s*from\\s*['"]\\.\\/(?:${layer5Pattern})['"]`,
                    'gs'
                );
                const badImports = content.match(importRegex);
                expect(badImports, `${fileName} should not import ATK/SPD/DEF/RES from Layer 5`).toBeNull();
            }
        });
    });

    describe('DSL functions remain functional after changes', () => {
        // Verify ATK_SPD and similar DSL stat functions still work
        it('ATK_SPD(5) returns a valid StatsNode', async () => {
            const { ATK_SPD } = await import('../Sources/SkillEffect.js');
            const node = ATK_SPD(5);
            expect(node).toBeDefined();
            expect(node).toHaveProperty('evaluate');
        });
    });
});
