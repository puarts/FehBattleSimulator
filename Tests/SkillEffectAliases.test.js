import { describe, test, expect } from 'vitest';

describe('SkillEffectAliases ESM import', () => {
    test('dynamic import succeeds without errors', async () => {
        // ReferenceError が出なければ全依存シンボルが解決されている
        const module = await import('../Sources/SkillEffectAliases.js');
        expect(module).toBeDefined();
    });

    test('key alias constants are exported and importable', async () => {
        const { UNITS_ATK_NODE, UNITS_SPD_NODE, FOES_ATK_NODE, FOES_SPD_NODE } =
            await import('../Sources/SkillEffectAliases.js');
        expect(UNITS_ATK_NODE).toBeDefined();
        expect(UNITS_SPD_NODE).toBeDefined();
        expect(FOES_ATK_NODE).toBeDefined();
        expect(FOES_SPD_NODE).toBeDefined();
    });

    test('alias constants are not undefined (detects evaluation order issues)', async () => {
        const mod = await import('../Sources/SkillEffectAliases.js');
        // UNITS_ATK_NODE は StatusIndex.ATK を使って初期化される
        // undefined ならば評価順依存の問題がある
        expect(mod.UNITS_ATK_NODE).not.toBeUndefined();
        expect(mod.UNITS_STAT_NODE).not.toBeUndefined();
        expect(mod.SPD_DIFF_NODE).not.toBeUndefined();
        expect(typeof mod.PERCENTAGE_NODE).toBe('function');
    });
});
