import { describe, test, expect } from 'vitest';

describe('SkillEffectHooks.js ESM imports', () => {
    test('dynamic import succeeds without ReferenceError', async () => {
        const module = await import('../Sources/SkillEffectHooks.js');
        expect(module).toBeDefined();
    });

    test('hook constants are importable and defined', async () => {
        const { AT_START_OF_COMBAT_HOOKS, AFTER_COMBAT_HOOKS, AT_START_OF_TURN_HOOKS } =
            await import('../Sources/SkillEffectHooks.js');
        expect(AT_START_OF_COMBAT_HOOKS).toBeDefined();
        expect(AFTER_COMBAT_HOOKS).toBeDefined();
        expect(AT_START_OF_TURN_HOOKS).toBeDefined();
    });

});

describe('SkillEffectRegistrar.js ESM imports', () => {
    test('dynamic import succeeds without ReferenceError', async () => {
        const module = await import('../Sources/SkillEffectRegistrar.js');
        expect(module).toBeDefined();
    });

    test('SkillEffectRegistrar class is exported', async () => {
        const { SkillEffectRegistrar } = await import('../Sources/SkillEffectRegistrar.js');
        expect(SkillEffectRegistrar).toBeDefined();
        expect(typeof SkillEffectRegistrar.registerSkillsDuringCombat).toBe('function');
        expect(typeof SkillEffectRegistrar.registerSkillsForFoesDuringCombat).toBe('function');
        expect(typeof SkillEffectRegistrar.registerSkillsForAlliesDuringCombat).toBe('function');
    });
});

describe('Composite hooks', () => {
    test('DURING_COMBAT_INCLUDING_AOE_HOOKS has addSkill method', async () => {
        const { DURING_COMBAT_INCLUDING_AOE_HOOKS } = await import('../Sources/SkillEffectHooks.js');
        expect(typeof DURING_COMBAT_INCLUDING_AOE_HOOKS.addSkill).toBe('function');
    });

    test('DURING_COMBAT_USING_STATS_INCLUDING_AOE_HOOKS has addSkill method', async () => {
        const { DURING_COMBAT_USING_STATS_INCLUDING_AOE_HOOKS } = await import('../Sources/SkillEffectHooks.js');
        expect(typeof DURING_COMBAT_USING_STATS_INCLUDING_AOE_HOOKS.addSkill).toBe('function');
    });
});
