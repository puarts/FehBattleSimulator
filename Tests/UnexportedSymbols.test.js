import { describe, it, expect } from 'vitest';

describe('Unexported symbols verification', () => {
    it('all symbols needed by SkillEffectAliases.js are exported from their source files', async () => {
        const mod = await import('../Sources/SkillEffectAliases.js');
        expect(mod).toBeDefined();
    });

    it('all symbols needed by SkillEffectBattleContext.js are exported from their source files', async () => {
        const mod = await import('../Sources/SkillEffectBattleContext.js');
        expect(mod).toBeDefined();
    });

    it('all symbols needed by SkillEffectUnit.js (re-export) are importable', async () => {
        const mod = await import('../Sources/SkillEffectUnit.js');
        expect(mod.UNIT).toBeDefined();
        expect(mod.FOE).toBeDefined();
    });

    it('all symbols needed by SkillEffectField.js (re-export) are importable', async () => {
        const mod = await import('../Sources/SkillEffectField.js');
        expect(mod.SkillEffectField).toBeDefined();
    });

    it('PATHFINDER_SKILL_SET is exported from Skill.js', async () => {
        const mod = await import('../Sources/Skill.js');
        expect(mod.PATHFINDER_SKILL_SET).toBeDefined();
        expect(mod.PATHFINDER_SKILL_SET).toBeInstanceOf(Set);
    });

    it('previously unexported symbols from SkillEffect.js are now exported', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        expect(mod.DOES_IT_COUNT_AS_DIFFICULT_TERRAIN_EXCLUDING_IMPASSABLE_TERRAIN).toBeDefined();
        expect(mod.NUM_OF_TARGETS_FOES_DEFEATED_BY_TARGET_TEAM_ON_CURRENT_TURN_NODE).toBeDefined();
    });

    it('previously unexported symbols from SkillEffectBattleContext.js are now exported', async () => {
        const mod = await import('../Sources/SkillEffectBattleContext.js');
        expect(mod.DECREASES_SPD_DIFF_NECESSARY_FOR_UNIT_TO_MAKE_FOLLOW_UP_NODE).toBeDefined();
        expect(mod.GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE).toBeDefined();
        expect(mod.GRANTS_TRIANGLE_ADVANTAGE_AGAINST_COLORLESS_TARGETS_FOES_AND_INFLICTS_TRIANGLE_DISADVANTAGE_ON_COLORLESS_TARGETS_FOES_DURING_COMBAT_NODE).toBeDefined();
        expect(mod.REDUCES_PERCENTAGE_OF_FOES_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE).toBeDefined();
        expect(mod.REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE).toBeDefined();
        expect(mod.REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE).toBeDefined();
        expect(mod.REDUCES_PERCENTAGE_OF_UNITS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE).toBeDefined();
        expect(mod.TARGETS_NEXT_ATTACK_DEALS_DAMAGE_X_PERCENT_OF_TARGETS_FORES_ATTACK_PRIOR_TO_REDUCTION_ONLY_HIGHEST_VALUE_APPLIED_AND_DOES_NOT_STACK_NODE).toBeDefined();
        expect(mod.TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE).toBeDefined();
    });

    it('previously unexported symbol from SkillEffectAliases.js is now exported', async () => {
        const mod = await import('../Sources/SkillEffectAliases.js');
        expect(mod.HIGHEST_HP_AMONG_SKILL_OWNERS_ALLIES).toBeDefined();
    });
});
