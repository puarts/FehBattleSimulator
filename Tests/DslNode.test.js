import { UnitGroupType } from '../Sources/UnitConstants.js';
import { StatusEffectType } from '../Sources/StatusConstants.js';
import { NumberNode, SkillEffectHooks, NODE_FUNC, IF_NODE, TRUE_NODE, FALSE_NODE, CONSTANT_NUMBER_NODE, MultiValueMap, AndNode, OrNode } from '../Sources/SkillEffectCore.js';
import { NodeEnv } from '../Sources/SkillEffectEnv.js';
import { test_DamageCalculator } from '../Sources/TestUtilities.js';
import { g_testHeroDatabase } from './TestGlobals.js';
import { setAppData } from '../Sources/AppDataGlobal.js';
import { AT_START_OF_COMBAT_HOOKS } from '../Sources/SkillEffectHooks.js';
import { DEALS_DAMAGE_X_NODE } from '../Sources/SkillEffectAliases.js';
import { SkillEffectRegistrar } from '../Sources/SkillEffectRegistrar.js';
import { UNIT, FOE, GRANTS_BONUS, INFLICTS_PENALTY } from '../Sources/SkillEffectUnit.js';
import { ATK_SPD, ATK_SPD_DEF_RES, DEF_RES } from '../Sources/SkillEffect.js';
import { MathUtil } from '../Sources/Utilities.js';

describe('DSL Node Tests', () => {
    /** @type {Unit} */
    let atkUnit;
    /** @type {Unit} */
    let defUnit;
    let calculator;

    beforeEach(() => {
        let heroDatabase = g_testHeroDatabase;
        atkUnit = heroDatabase.createUnit('アルフォンス');
        defUnit = heroDatabase.createUnit('アルフォンス', UnitGroupType.Enemy);
        calculator = new test_DamageCalculator();
        calculator.unitManager.units = [atkUnit, defUnit];
        calculator.isLogEnabled = false;
        setAppData(calculator.unitManager);
    });

    describe('Effect nodes via combat', () => {
        test('DEALS_DAMAGE_X_NODE adds fixed damage during combat', () => {
            let additionalDamage = 15;
            let skillId = 'test-deals-damage-15';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                DEALS_DAMAGE_X_NODE(additionalDamage),
            ));
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            // Normal damage + additional damage
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
        });

        test('DEALS_DAMAGE_X_NODE with zero additional damage equals normal damage', () => {
            let skillId = 'test-deals-damage-0';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                DEALS_DAMAGE_X_NODE(0),
            ));
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
        });
    });

    describe('Condition nodes via combat', () => {
        test('IF_NODE with TRUE_NODE applies effect', () => {
            let additionalDamage = 10;
            let skillId = 'test-if-true-damage';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                IF_NODE(TRUE_NODE, DEALS_DAMAGE_X_NODE(additionalDamage)),
            ));
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
        });

        test('IF_NODE with FALSE_NODE does not apply effect', () => {
            let skillId = 'test-if-false-damage';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                IF_NODE(FALSE_NODE, DEALS_DAMAGE_X_NODE(10)),
            ));
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
        });
    });

    describe('Composite nodes in combat context', () => {
        test('AND condition: both true applies effect', () => {
            let additionalDamage = 20;
            let skillId = 'test-and-both-true';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                IF_NODE(new AndNode(TRUE_NODE, TRUE_NODE), DEALS_DAMAGE_X_NODE(additionalDamage)),
            ));
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
        });

        test('AND condition: one false blocks effect', () => {
            let skillId = 'test-and-one-false';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                IF_NODE(new AndNode(TRUE_NODE, FALSE_NODE), DEALS_DAMAGE_X_NODE(20)),
            ));
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
        });

        test('OR condition: one true applies effect', () => {
            let additionalDamage = 20;
            let skillId = 'test-or-one-true';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                IF_NODE(new OrNode(FALSE_NODE, TRUE_NODE), DEALS_DAMAGE_X_NODE(additionalDamage)),
            ));
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
        });

        test('OR condition: both false blocks effect', () => {
            let skillId = 'test-or-both-false';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                IF_NODE(new OrNode(FALSE_NODE, FALSE_NODE), DEALS_DAMAGE_X_NODE(20)),
            ));
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
        });
    });

    describe('Hook registration', () => {
        test('AT_START_OF_COMBAT_HOOKS: registered skill is evaluated', () => {
            let additionalDamage = 7;
            let skillId = 'test-hook-start-combat';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                DEALS_DAMAGE_X_NODE(additionalDamage),
            ));
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
        });

        test('Skill without matching passiveS does not activate', () => {
            let skillId = 'test-hook-not-assigned';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                DEALS_DAMAGE_X_NODE(99),
            ));
            // Don't assign skillId to any unit
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
        });

        test('registerSkillsDuringCombat: registered skill evaluated during combat', () => {
            let additionalDamage = 12;
            let skillId = 'test-registrar-during-combat';
            SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
                DEALS_DAMAGE_X_NODE(additionalDamage),
            );
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + additionalDamage);
        });

        test('registerSkillsDuringCombat with FALSE condition does not apply', () => {
            let skillId = 'test-registrar-false-cond';
            SkillEffectRegistrar.registerSkillsDuringCombat(skillId, FALSE_NODE,
                DEALS_DAMAGE_X_NODE(99),
            );
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage);
        });
    });

    describe('GRANTS_BONUS and INFLICTS_PENALTY', () => {
        test('GRANTS_BONUS(ATK_SPD(5)).to(UNIT) increases attacker damage by 5', () => {
            // Baseline: combat without bonus skill
            let baseResult = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = baseResult.atkUnit_normalAttackDamage;

            // Re-setup units for second combat
            atkUnit = g_testHeroDatabase.createUnit('アルフォンス');
            defUnit = g_testHeroDatabase.createUnit('アルフォンス', UnitGroupType.Enemy);
            calculator = new test_DamageCalculator();
            calculator.unitManager.units = [atkUnit, defUnit];
            setAppData(calculator.unitManager);

            let skillId = 'test-grants-bonus-atk-spd';
            SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
                GRANTS_BONUS(ATK_SPD(5)).to(UNIT),
            );
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            // Bonus +5 Atk → damage increases by 5
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + 5);
        });

        test('INFLICTS_PENALTY(DEF_RES(5)).on(FOE) increases attacker damage by 5', () => {
            let baseResult = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = baseResult.atkUnit_normalAttackDamage;

            atkUnit = g_testHeroDatabase.createUnit('アルフォンス');
            defUnit = g_testHeroDatabase.createUnit('アルフォンス', UnitGroupType.Enemy);
            calculator = new test_DamageCalculator();
            calculator.unitManager.units = [atkUnit, defUnit];
            setAppData(calculator.unitManager);

            let skillId = 'test-inflicts-penalty-def-res';
            SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
                INFLICTS_PENALTY(DEF_RES(5)).on(FOE),
            );
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            // Penalty -5 Def on foe → damage increases by 5
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + 5);
        });
    });

    describe('Target nodes (UNIT/FOE)', () => {
        test('UNIT bonus does not affect FOE', () => {
            let skillId = 'test-target-unit-only';
            SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
                GRANTS_BONUS(ATK_SPD_DEF_RES(7)).to(UNIT),
            );
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            // UNIT = atkUnit gets +7, FOE should not get +7 to def
            // If FOE also got +7 def, damage would be baseDamage + 7 - 7 = baseDamage
            // If only UNIT gets +7 atk, damage increases by 7
            let baseCalc = new test_DamageCalculator();
            let baseAtk = g_testHeroDatabase.createUnit('アルフォンス');
            let baseDef = g_testHeroDatabase.createUnit('アルフォンス', UnitGroupType.Enemy);
            baseCalc.unitManager.units = [baseAtk, baseDef];
            setAppData(baseCalc.unitManager);
            let baseResult = baseCalc.calcDamage(baseAtk, baseDef);
            expect(result.atkUnit_normalAttackDamage).toBe(baseResult.atkUnit_normalAttackDamage + 7);
        });

        test('FOE penalty does not affect UNIT', () => {
            let skillId = 'test-target-foe-only';
            SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
                INFLICTS_PENALTY(ATK_SPD(6)).on(FOE),
            );
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            // FOE gets -6 atk, so foe's counter-damage should decrease
            let baseCalc = new test_DamageCalculator();
            let baseAtk = g_testHeroDatabase.createUnit('アルフォンス');
            let baseDef = g_testHeroDatabase.createUnit('アルフォンス', UnitGroupType.Enemy);
            baseCalc.unitManager.units = [baseAtk, baseDef];
            setAppData(baseCalc.unitManager);
            let baseResult = baseCalc.calcDamage(baseAtk, baseDef);
            // Foe's counter damage should be 6 less
            expect(result.defUnit_normalAttackDamage).toBe(baseResult.defUnit_normalAttackDamage - 6);
        });
    });

    describe('Multiple effects composition', () => {
        test('Multiple DEALS_DAMAGE effects stack additively', () => {
            let damage1 = 5;
            let damage2 = 8;
            let skillId = 'test-multi-damage';
            AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
                DEALS_DAMAGE_X_NODE(damage1),
                DEALS_DAMAGE_X_NODE(damage2),
            ));
            atkUnit.passiveS = skillId;
            let result = calculator.calcDamage(atkUnit, defUnit);
            let baseDamage = MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0);
            expect(result.atkUnit_normalAttackDamage).toBe(baseDamage + damage1 + damage2);
        });
    });
});
