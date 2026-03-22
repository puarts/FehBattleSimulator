// ESM import sanity check — verifies ESM imports coexist with concatenation globals
import { NumberNode, CONSTANT_NUMBER_NODE } from '../Sources/SkillEffectCore.js';
import { NodeEnv } from '../Sources/SkillEffectEnv.js';
import { UnitGroupType } from '../Sources/UnitConstants.js';
import { Weapon } from '../Sources/SkillConstants.js';
import { StatusEffectType } from '../Sources/StatusConstants.js';

describe('ESM import sanity check', () => {
    test('can import and use SkillEffectCore symbols directly', () => {
        expect(CONSTANT_NUMBER_NODE(2).mult(4).evaluate(new NodeEnv())).toBe(8);
    });

    test('NumberNode class is importable', () => {
        expect(NumberNode).toBeDefined();
        expect(typeof NumberNode).toBe('function');
    });

    test('ESM-imported enum values are defined', () => {
        expect(UnitGroupType.Ally).toBeDefined();
        expect(StatusEffectType).toBeDefined();
        expect(Weapon).toBeDefined();
    });

    test('ESM-imported enums have correct values', () => {
        expect(UnitGroupType.Ally).toBe(0);
        expect(UnitGroupType.Enemy).toBe(1);
    });
});
