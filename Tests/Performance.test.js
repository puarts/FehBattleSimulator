import { UnitGroupType } from '../Sources/UnitConstants.js';
import { WeaponRefinementType } from '../Sources/SkillConstants.js';
import { test_DamageCalculator, test_BeginningOfTurnSkillHandler, resetGlobalTestState } from '../Sources/TestUtilities.js';
import { g_testHeroDatabase } from './TestGlobals.js';
import { setAppData } from '../Sources/AppDataGlobal.js';

describe('Performance benchmarks', () => {
    const isCI = !!process.env.CI;

    function runBenchmark(operation, ciThreshold, localThreshold, warmupCount = 5) {
        const threshold = isCI ? ciThreshold : localThreshold;

        // Warmup iterations
        for (let i = 0; i < warmupCount; i++) {
            operation();
        }

        // Measured run
        const start = performance.now();
        operation();
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(threshold);
    }

    test('全英雄戦闘計算が閾値以内で完了する', () => {
        let heroDatabase = g_testHeroDatabase;
        let atkUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Ally);
        let defUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);

        function runAllHeroBattle() {
            let calculator = new test_DamageCalculator();
            calculator.map.getTile(0, 2).setUnit(atkUnit);
            calculator.map.getTile(0, 0).setUnit(defUnit);
            calculator.unitManager.units = [atkUnit, defUnit];
            calculator.isLogEnabled = false;
            setAppData(calculator.unitManager);

            atkUnit.weaponRefinement = WeaponRefinementType.Special;
            defUnit.weaponRefinement = WeaponRefinementType.Special;
            for (let heroInfo of heroDatabase.enumerateHeroInfos()) {
                heroDatabase.initUnit(atkUnit, heroInfo.name);
                heroDatabase.initUnit(defUnit, heroInfo.name);
                try {
                    calculator.calcDamage(atkUnit, defUnit, false);
                } catch (e) {
                    // Skip heroes with known skill implementation issues
                }
                atkUnit.hp = atkUnit.maxHpWithSkills;
                defUnit.hp = defUnit.maxHpWithSkills;
            }
            resetGlobalTestState();
        }

        runBenchmark(runAllHeroBattle, 3000, 1500);
    }, 30000);

    test('ターン開始スキル適用（全英雄）が閾値以内で完了する', () => {
        let heroDatabase = g_testHeroDatabase;
        let unit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Ally);
        let allyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Ally);
        let enemyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
        let enemyAllyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);

        runBenchmark(() => {
            let handler = new test_BeginningOfTurnSkillHandler();
            handler.map.getTile(0, 2).setUnit(unit);
            handler.map.getTile(0, 0).setUnit(allyUnit);
            handler.map.getTile(2, 2).setUnit(enemyUnit);
            handler.map.getTile(2, 0).setUnit(enemyAllyUnit);
            handler.unitManager.units = [unit, allyUnit, enemyUnit, enemyAllyUnit];
            handler.battleContext.currentTurn = 1;
            setAppData(handler.unitManager);

            unit.weaponRefinement = WeaponRefinementType.Special;
            for (let heroInfo of heroDatabase.enumerateHeroInfos()) {
                heroDatabase.initUnit(unit, heroInfo.name);
                handler.applySkillsForBeginningOfTurn(unit);
            }
            resetGlobalTestState();
        }, 2000, 800);
    });

    test('ユニット初期化（全英雄生成）が閾値以内で完了する', () => {
        let heroDatabase = g_testHeroDatabase;
        let unit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Ally);

        runBenchmark(() => {
            for (let heroInfo of heroDatabase.enumerateHeroInfos()) {
                heroDatabase.initUnit(unit, heroInfo.name);
            }
            resetGlobalTestState();
        }, 500, 200);
    });
});
