import { describe, test, expect } from 'vitest';

describe('SkillEffectField merge into SkillEffect', () => {
    test('SkillEffect.js exports SkillEffectField class', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        expect(mod.SkillEffectField).toBeDefined();
        expect(typeof mod.SkillEffectField.calc).toBe('function');
        expect(mod.SkillEffectField.Op).toBeDefined();
    });

    test('SkillEffect.js exports GetSkillEffectFieldNode class', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        expect(mod.GetSkillEffectFieldNode).toBeDefined();
    });

    test('SkillEffect.js exports ModSkillEffectFieldNode class', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        expect(mod.ModSkillEffectFieldNode).toBeDefined();
    });
});

describe('SkillEffectField.js re-export', () => {
    test('SkillEffectField.js re-exports all Field symbols from SkillEffect.js', async () => {
        const mod = await import('../Sources/SkillEffectField.js');
        expect(mod.SkillEffectField).toBeDefined();
        expect(mod.SkillEffectFieldNode).toBeDefined();
        expect(mod.GetSkillEffectFieldNode).toBeDefined();
        expect(mod.ModSkillEffectFieldNode).toBeDefined();
    });

    test('re-exported symbols are identical references to direct imports', async () => {
        const direct = await import('../Sources/SkillEffect.js');
        const reexport = await import('../Sources/SkillEffectField.js');
        expect(reexport.SkillEffectField).toBe(direct.SkillEffectField);
        expect(reexport.GetSkillEffectFieldNode).toBe(direct.GetSkillEffectFieldNode);
        expect(reexport.ModSkillEffectFieldNode).toBe(direct.ModSkillEffectFieldNode);
    });
});

describe('SkillEffectFieldNode inheritance', () => {
    test('GetSkillEffectFieldNode extends SingleEffectNode', async () => {
        const mod = await import('../Sources/SkillEffect.js');
        const node = new mod.GetSkillEffectFieldNode();
        expect(node).toBeInstanceOf(mod.SingleEffectNode);
    });
});
