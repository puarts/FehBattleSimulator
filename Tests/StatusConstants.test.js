import { describe, it, expect } from 'vitest';
import {
    StatusIndex,
    StatusEffectType,
    POSITIVE_STATUS_EFFECT_ARRAY,
    POSITIVE_STATUS_EFFECT_ORDER_MAP,
    NEGATIVE_STATUS_EFFECT_ARRAY,
    NEGATIVE_STATUS_EFFECT_ORDER_MAP,
    StatFlags,
    getStatusName,
} from '../Sources/StatusConstants.js';

describe('StatusConstants', () => {
    describe('StatusIndex', () => {
        it('全プロパティが正しい値を持つ', () => {
            expect(StatusIndex.NONE).toBe(-1);
            expect(StatusIndex.ATK).toBe(0);
            expect(StatusIndex.SPD).toBe(1);
            expect(StatusIndex.DEF).toBe(2);
            expect(StatusIndex.RES).toBe(3);
        });

        it('Object.freezeされている', () => {
            expect(Object.isFrozen(StatusIndex)).toBe(true);
        });
    });

    describe('StatusEffectType', () => {
        it('代表的なプロパティが正しい値を持つ', () => {
            expect(StatusEffectType.None).toBe(-1);
            expect(StatusEffectType.Panic).toBe(0);
            expect(StatusEffectType.Gravity).toBe(1);
            expect(StatusEffectType.MobilityIncreased).toBe(2);
            expect(StatusEffectType.CounterattacksDisrupted).toBe(3);
        });
    });

    describe('POSITIVE_STATUS_EFFECT_ARRAY', () => {
        it('配列であり、正しい要素数を持つ', () => {
            expect(Array.isArray(POSITIVE_STATUS_EFFECT_ARRAY)).toBe(true);
            expect(POSITIVE_STATUS_EFFECT_ARRAY.length).toBe(79);
        });
    });

    describe('POSITIVE_STATUS_EFFECT_ORDER_MAP', () => {
        it('Mapであり、POSITIVE_STATUS_EFFECT_ARRAYと同じサイズ', () => {
            expect(POSITIVE_STATUS_EFFECT_ORDER_MAP).toBeInstanceOf(Map);
            expect(POSITIVE_STATUS_EFFECT_ORDER_MAP.size).toBe(POSITIVE_STATUS_EFFECT_ARRAY.length);
        });
    });

    describe('NEGATIVE_STATUS_EFFECT_ARRAY', () => {
        it('配列であり、要素を持つ', () => {
            expect(Array.isArray(NEGATIVE_STATUS_EFFECT_ARRAY)).toBe(true);
            expect(NEGATIVE_STATUS_EFFECT_ARRAY.length).toBe(27);
        });
    });

    describe('NEGATIVE_STATUS_EFFECT_ORDER_MAP', () => {
        it('Mapであり、NEGATIVE_STATUS_EFFECT_ARRAYと同じサイズ', () => {
            expect(NEGATIVE_STATUS_EFFECT_ORDER_MAP).toBeInstanceOf(Map);
            expect(NEGATIVE_STATUS_EFFECT_ORDER_MAP.size).toBe(NEGATIVE_STATUS_EFFECT_ARRAY.length);
        });
    });

    describe('StatFlags', () => {
        it('全プロパティが正しい値を持つ', () => {
            expect(StatFlags.NONE).toEqual([false, false, false, false]);
            expect(StatFlags.ALL).toEqual([true, true, true, true]);
            expect(StatFlags.ATK).toEqual([true, false, false, false]);
            expect(StatFlags.SPD).toEqual([false, true, false, false]);
            expect(StatFlags.DEF).toEqual([false, false, true, false]);
            expect(StatFlags.RES).toEqual([false, false, false, true]);
        });

        it('Object.freezeされている', () => {
            expect(Object.isFrozen(StatFlags)).toBe(true);
        });
    });

    describe('getStatusName', () => {
        it('正しいステータス名を返す', () => {
            expect(getStatusName(StatusIndex.NONE)).toBe('ー');
            expect(getStatusName(StatusIndex.ATK)).toBe('攻撃');
            expect(getStatusName(StatusIndex.SPD)).toBe('速さ');
            expect(getStatusName(StatusIndex.DEF)).toBe('守備');
            expect(getStatusName(StatusIndex.RES)).toBe('魔防');
        });
    });
});

describe('Skill.jsからのre-export後方互換', () => {
    it('Skill.jsからStatusIndex/StatusEffectTypeが引き続き取得でき、同一の値', async () => {
        const skill = await import('../Sources/Skill.js');
        expect(skill.StatusIndex).toBe(StatusIndex);
        expect(skill.StatusEffectType).toBe(StatusEffectType);
        expect(skill.StatFlags).toBe(StatFlags);
        expect(skill.getStatusName).toBe(getStatusName);
    });
});

describe('SkillEffect.jsの循環参照解消', () => {
    it('SkillEffect.jsがSkill.jsからimportしていない', async () => {
        const fs = await import('fs');
        const path = await import('path');
        const sourcesDir = path.resolve(process.cwd(), 'Sources');
        const content = fs.readFileSync(path.join(sourcesDir, 'SkillEffect.js'), 'utf-8');
        // SkillEffect.js should not import from Skill.js
        const skillImports = content.match(/import\s+\{[^}]*\}\s+from\s+['"]\.\/Skill\.js['"]/g);
        expect(skillImports).toBeNull();
    });
});
