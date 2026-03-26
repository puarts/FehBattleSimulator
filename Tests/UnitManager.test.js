import { UnitGroupType } from '../Sources/UnitConstants.js';
import { g_testHeroDatabase, test_UnitManager } from './TestGlobals.js';
import { Unit } from '../Sources/Unit.js';

test('UnitManager_EnumerateUnits', () => {
    let manager = new test_UnitManager();

    let allies = Array.from(manager.enumerateUnitsInSpecifiedGroup(UnitGroupType.Ally));

    expect(allies.length).toBeGreaterThan(0);
    for (let unit of allies) {
        expect(unit.groupId).toBe(UnitGroupType.Ally);
    }
});

describe('Unit heroId', () => {
    test('heroInfo が設定されている場合、heroInfo.id を返す', () => {
        const heroes = ["アルフォンス", "シャロン", "アンナ", "ウェンディ", "ファ"];
        for (const name of heroes) {
            const unit = g_testHeroDatabase.createUnit(name);
            expect(unit.heroId).toBe(unit.heroInfo.id);
        }
    });

    test('異なる英雄は異なる heroId を持つ', () => {
        const unit1 = g_testHeroDatabase.createUnit("アルフォンス");
        const unit2 = g_testHeroDatabase.createUnit("シャロン");
        expect(unit1.heroId).not.toBe(unit2.heroId);
    });

    test('heroInfo が null の場合、-1 を返す', () => {
        const unit = new Unit("", "テスト", UnitGroupType.Ally);
        expect(unit.heroId).toBe(-1);
    });
});
