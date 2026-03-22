import { describe, it, expect } from 'vitest';

describe('moveUnit/moveStructureToTrashBox separation', () => {
    it('SkillEffect.js should not import from BattleSimulatorBase.js', async () => {
        const fs = await import('fs');
        const content = fs.readFileSync('Sources/SkillEffect.js', 'utf-8');
        const importLines = content.split('\n').filter(line => line.match(/^\s*import\s.*from/));
        const bsbImports = importLines.filter(line => line.includes('BattleSimulatorBase'));
        expect(bsbImports).toHaveLength(0);
    });

    it('DestroysOffenceSafetyFenceNode should not reference moveStructureToTrashBox as a global', async () => {
        const fs = await import('fs');
        const content = fs.readFileSync('Sources/SkillEffect.js', 'utf-8');
        const bareCallPattern = /[^.]\bmoveStructureToTrashBox\s*\(/;
        const classStart = content.indexOf('class DestroysOffenceSafetyFenceNode');
        const classEnd = content.indexOf('\nconst DESTROYS_OFFENCE_SAFETY_FENCE_NODE', classStart);
        const classContent = content.slice(classStart, classEnd);
        expect(classContent).not.toMatch(bareCallPattern);
    });
});
