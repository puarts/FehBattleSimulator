import { describe, it, expect } from 'vitest';

describe('SkillEffectBattleContext.js ESM imports', () => {
    it('can be dynamically imported without errors', async () => {
        const module = await import('../Sources/SkillEffectBattleContext.js');
        expect(module).toBeDefined();
    });

    it('major exported symbols are importable and defined', async () => {
        const module = await import('../Sources/SkillEffectBattleContext.js');
        expect(module.INITIATED_COMBAT).toBeDefined();
        expect(module.ATTACKS_TWICE).toBeDefined();
        expect(module.BOOSTS_DAMAGE_BY).toBeTypeOf('function');
    });

    it('battle context DSL nodes can be instantiated', async () => {
        const { BOOSTS_DAMAGE_BY, NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS } =
            await import('../Sources/SkillEffectBattleContext.js');

        const damageNode = BOOSTS_DAMAGE_BY(5);
        expect(damageNode).toBeDefined();

        const followupNode = NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS(true);
        expect(followupNode).toBeDefined();
    });

    it('ObjectUtil.getKeyName is callable via the import chain (exercises error-message path)', async () => {
        const { ObjectUtil } = await import('../Sources/Utilities.js');
        const { NodeEnv } = await import('../Sources/SkillEffectEnv.js');
        // This is the exact call pattern used in SkillEffectBattleContext.js:2946 etc.
        const keyName = ObjectUtil.getKeyName(NodeEnv.CombatPhase, NodeEnv.CombatPhase.AFTER_FOLLOWUP_CONFIGURED);
        expect(keyName).toBe('AFTER_FOLLOWUP_CONFIGURED');
    });
});
