import { describe, it, expect } from 'vitest';
import { UnitBuilder } from '../Sources/TestUtilities.js';
import './TestGlobals.js';

describe('Remaining imports - dynamic import verification', () => {
    it('CustomSkill.js dynamic import succeeds', async () => {
        const mod = await import('../Sources/CustomSkill.js');
        expect(mod.CustomSkill).toBeDefined();
    });

    it('UnitSkillEffect.js dynamic import succeeds', async () => {
        const mod = await import('../Sources/UnitSkillEffect.js');
        expect(mod.initUnitSkillEffects).toBeDefined();
        expect(typeof mod.initUnitSkillEffects).toBe('function');
    });

    it('TestUtilities.js dynamic import succeeds', async () => {
        const mod = await import('../Sources/TestUtilities.js');
        expect(mod.test_createDefaultUnit).toBeDefined();
        expect(mod.UnitBuilder).toBeDefined();
        expect(mod.BattleScenarioBuilder).toBeDefined();
        expect(mod.test_DamageCalculator).toBeDefined();
    });

    it('initUnitSkillEffects is re-exported from Unit.js', async () => {
        const mod = await import('../Sources/Unit.js');
        expect(mod.initUnitSkillEffects).toBeDefined();
        expect(typeof mod.initUnitSkillEffects).toBe('function');
    });

    it('TestUtilities.js exports setTestHeroDatabase setter', async () => {
        const mod = await import('../Sources/TestUtilities.js');
        expect(mod.setTestHeroDatabase).toBeDefined();
        expect(typeof mod.setTestHeroDatabase).toBe('function');
    });

    // setTestHeroDatabase → UnitBuilder.fromHero の依存注入経路を検証
    it('UnitBuilder.fromHero works after setTestHeroDatabase is called', () => {
        const unit = UnitBuilder.fromHero('アルフォンス').build();
        expect(unit).toBeDefined();
        expect(unit.heroInfo).toBeDefined();
    });
});
