describe('Test skill effect', () => {
    describe(`Test ${NumberNode.name}`, () => {
        test('mult function', () => {
            expect(CONSTANT_NUMBER_NODE(2).mult(4).evaluate(new NodeEnv())).toBe(8);
        });

        test('max function', () => {
            const max = 5;
            expect(CONSTANT_NUMBER_NODE(max).mult(4).max(max).evaluate(new NodeEnv())).toBe(max);
        });
    });

    describe(`Test ${MultiValueMap.name}`, () => {
        beforeEach(() => {
            map = new MultiValueMap();
        });

        test('Test constructor should return an empty Map', () => {
            expect(map.size).toBe(0);
        });

        test('Test getValues() returns an empty Array as a default value', () => {
            expect(map.getValues(1)).toEqual([]);
        });

        test('Test addValue()', () => {
            map.addValue(1, "one");
            expect(map.getValues(1)).toEqual(["one"]);
            map.addValue(1, "one 2");
            expect(map.getValues(1)).toEqual(["one", "one 2"]);
            map.addValue(2, "two");
            expect(map.getValues(2)).toEqual(["two"]);

            expect(map.getValues(3)).toEqual([]);
        });

        test('Test delete()', () => {
            map.addValue(1, "one");
            expect(map.getValues(1)).toEqual(["one"]);
            map.addValue(1, "one 2");
            expect(map.getValues(1)).toEqual(["one", "one 2"]);

            map.delete(1);
            expect(map.getValues(1)).toEqual([]);
        });
    });

    describe(`Test ${SkillEffectHooks.name}`, () => {
        beforeEach(() => {
            /** @type {SkillEffectHooks<ConstantNumberNode>} */
            skillEffectMap = new SkillEffectHooks();
        });

        test('Test constructor should return an empty map', () => {
            expect(skillEffectMap.getSkills(1)).toEqual([]);
        });

        test('Test addSkill(), getSkills() and evaluate()', () => {
            skillEffectMap.addSkill(1, () => new ConstantNumberNode(1));
            expect(skillEffectMap.getSkills(1).length).toEqual(1);
            skillEffectMap.addSkill(1, () => new ConstantNumberNode(2));
            skillEffectMap.addSkill(1, () => new ConstantNumberNode(3));
            expect(skillEffectMap.getSkills(1).length).toEqual(3);
            skillEffectMap.addSkill(2, () => new ConstantNumberNode(3));
            expect(skillEffectMap.evaluate(1, null)).toEqual([1, 2, 3]);
            expect(skillEffectMap.evaluate(2, null)).toEqual([3]);
        });
    });

    describe(`Test ${SkillEffectNode.name}`, () => {
        test('Test constructor', () => {
            let sen = new SkillEffectNode();
            expect(sen.getChildren().length).toEqual(0);
        });

        test('Test constructor with arguments', () => {
            let sen1 = new SkillEffectNode();
            let sen2 = new SkillEffectNode();
            let sen = new SkillEffectNode(sen1, sen2);
            expect(sen.getChildren().length).toEqual(2);
            expect(sen.getChildren()).toContain(sen1);
            expect(sen.getChildren()).toContain(sen2);
        });

        test('Test evaluate()', () => {
            let sen = new SkillEffectNode(new ConstantNumberNode(1), new ConstantNumberNode(3));
            expect(sen.evaluate()).toEqual([1, 3]);
        });
    });

    describe(`Test ${AndNode.name}`, () => {
        test('Test evaluate()', () => {
            expect(new AndNode().evaluate()).toEqual(true);
            expect(new AndNode(TRUE_NODE).evaluate()).toEqual(true);
            expect(new AndNode(FALSE_NODE).evaluate()).toEqual(false);

            expect(new AndNode(TRUE_NODE, TRUE_NODE).evaluate()).toEqual(true);
            expect(new AndNode(TRUE_NODE, FALSE_NODE).evaluate()).toEqual(false);
            expect(new AndNode(FALSE_NODE, TRUE_NODE).evaluate()).toEqual(false);
            expect(new AndNode(FALSE_NODE, FALSE_NODE).evaluate()).toEqual(false);

            expect(new AndNode(FALSE_NODE, TRUE_NODE, FALSE_NODE).evaluate()).toEqual(false);
            expect(new AndNode(FALSE_NODE, FALSE_NODE, FALSE_NODE).evaluate()).toEqual(false);
            expect(new AndNode(TRUE_NODE, TRUE_NODE, TRUE_NODE).evaluate()).toEqual(true);
        });
    });

    describe(`Test ${OrNode.name}`, () => {
        test('Test evaluate()', () => {
            expect(new OrNode().evaluate()).toEqual(false);
            expect(new OrNode(TRUE_NODE).evaluate()).toEqual(true);
            expect(new OrNode(FALSE_NODE).evaluate()).toEqual(false);

            expect(new OrNode(TRUE_NODE, TRUE_NODE).evaluate()).toEqual(true);
            expect(new OrNode(TRUE_NODE, FALSE_NODE).evaluate()).toEqual(true);
            expect(new OrNode(FALSE_NODE, TRUE_NODE).evaluate()).toEqual(true);
            expect(new OrNode(FALSE_NODE, FALSE_NODE).evaluate()).toEqual(false);

            expect(new OrNode(FALSE_NODE, TRUE_NODE, FALSE_NODE).evaluate()).toEqual(true);
            expect(new OrNode(FALSE_NODE, FALSE_NODE, FALSE_NODE).evaluate()).toEqual(false);
            expect(new OrNode(TRUE_NODE, TRUE_NODE, TRUE_NODE).evaluate()).toEqual(true);
        });
    });

    describe(`Test ${CannotAnyNode.name}`, () => {
        test('Test evaluate()', () => {
            expect(new CannotAnyNode().evaluate()).toEqual(true);
            expect(new CannotAnyNode(TRUE_NODE).evaluate()).toEqual(false);
            expect(new CannotAnyNode(FALSE_NODE).evaluate()).toEqual(true);
            expect(new CannotAnyNode(FALSE_NODE, FALSE_NODE).evaluate()).toEqual(true);
            expect(new CannotAnyNode(FALSE_NODE, FALSE_NODE, TRUE_NODE, FALSE_NODE).evaluate()).toEqual(false);
        })
    })

    describe(`Test ${IfNode.name}`, () => {
        test('Test evaluate()', () => {
            expect(
                new IfNode(
                    new OrNode(FALSE_NODE, FALSE_NODE, TRUE_NODE),
                    new ConstantNumberNode(3)
                ).evaluate()).toEqual([3]);
            expect(
                new IfNode(
                    new OrNode(FALSE_NODE, FALSE_NODE, TRUE_NODE),
                    new ConstantNumberNode(3),
                    new ConstantNumberNode(7),
                ).evaluate()).toEqual([3, 7]);

            expect(
                new IfNode(
                    new OrNode(FALSE_NODE, FALSE_NODE, FALSE_NODE),
                    new ConstantNumberNode(3)
                ).evaluate()).toBeUndefined();
        });
    });

    describe(`Test ${MultNode.name}`, () => {
        test('Test evaluate()', () => {
            expect(new MultNode(new ConstantNumberNode(61), 0.15, 2).evaluate(null)).toBe(18.3);
            expect(() => new MultNode().evaluate(null)).toThrowError();
        });
    });

    describe(`Test ${MultTruncNode.name}`, () => {
        test('Test evaluate()', () => {
            expect(new MultTruncNode(new ConstantNumberNode(61), 0.15, 2).evaluate(null)).toBe(18);
            expect(() => new MultTruncNode().evaluate(null)).toThrowError();
        });
    });

    describe(`Test ${CollectionNode.name}`, () => {
        test('collection count', () => {
            let collectionNode = COLLECTION_NODE(TRUE_NODE, TRUE_NODE, TRUE_NODE);
            expect(COUNT_COLLECTION(collectionNode).evaluate(new NodeEnv())).toBe(3);
        });

        test('collection.count()', () => {
            let collectionNode = COLLECTION_NODE(TRUE_NODE, TRUE_NODE, TRUE_NODE);
            expect(collectionNode.count().evaluate(new NodeEnv())).toBe(3);
        });

        test('exists', () => {
            let collectionNode = COLLECTION_NODE(TRUE_NODE, TRUE_NODE, TRUE_NODE);
            expect(EXISTS(collectionNode).evaluate(new NodeEnv())).toBe(true);
        });

        test('not exists', () => {
            let collectionNode = COLLECTION_NODE();
            expect(EXISTS(collectionNode).evaluate(new NodeEnv())).toBe(false);
        });

        test('intersect', () => {
            const numbers = [1, 2, 3, 4, 5].map(v => new ConstantNumberNode(v - 1));
            const collectionNode1 = COLLECTION_NODE(numbers[0], numbers[1], numbers[2]);
            const collectionNode2 = COLLECTION_NODE(numbers[1], numbers[2], numbers[3]);
            const result =
                new IntersectCollectionNode(collectionNode1, collectionNode2).evaluate(new NodeEnv());
            expect(new Set(result)).toEqual(new Set([1, 2]));
        });
    });
});

describe('Stats node', () => {
    /** @type {Unit} */
    let unit;
    /** @type {NodeEnv} */
    let env;

    const BASE_SPD = 40;
    const SPD_SPUR = 10;
    const PHANTOM_SPD_3_VALUE = 10;

    beforeEach(() => {
        unit = heroDatabase.createUnit('アルフォンス');
        env = new NodeEnv();
        env.setTarget(unit);

        // 素のSPD & spurを明示
        unit.spdWithSkills = BASE_SPD;
        unit.spdSpur = SPD_SPUR;
    });

    afterEach(() => {
        // 必要なら: env.dispose(); heroDatabase.reset(); 等
    });

    test('on map', () => {
        const result = TARGETS_SPD_ON_MAP.evaluate(env);
        expect(result).toBe(BASE_SPD);
    });

    describe('when eval', () => {
        test('on map', () => {
            env.setCombatPhase(NodeEnv.CombatPhase.NULL_PHASE);
            const result = TARGETS_EVAL_SPD_NODE.evaluate(env);
            expect(result).toBe(BASE_SPD);
        });

        test.each([
            ['AT_START_OF_COMBAT', NodeEnv.CombatPhase.AT_START_OF_COMBAT],
            ['AFTER_COMBAT', NodeEnv.CombatPhase.AFTER_COMBAT],
            ['AFTER_DAMAGE_AS_COMBAT_BEGINS_FIXED', NodeEnv.CombatPhase.AFTER_DAMAGE_AS_COMBAT_BEGINS_FIXED],
        ])('%s phase', (_label, phase) => {
            env.setCombatPhase(phase);
            const result = TARGETS_EVAL_SPD_NODE.evaluate(env);
            expect(result).toBe(BASE_SPD + SPD_SPUR);
        });

        test('with phantom on map', () => {
            env.setCombatPhase(NodeEnv.CombatPhase.NULL_PHASE);
            unit.passiveS = PassiveS.HayasaNoKyosei3;
            const result = TARGETS_EVAL_SPD_NODE.evaluate(env);
            expect(result).toBe(BASE_SPD + PHANTOM_SPD_3_VALUE);
        });

        test('with phantom during combat', () => {
            env.setCombatPhase(NodeEnv.CombatPhase.AT_START_OF_COMBAT);
            unit.passiveS = PassiveS.HayasaNoKyosei3;
            const result = TARGETS_EVAL_SPD_NODE.evaluate(env);
            expect(result).toBe(BASE_SPD + SPD_SPUR + PHANTOM_SPD_3_VALUE);
        });

        test('no spur when spdSpur = 0', () => {
            unit.spdSpur = 0;
            env.setCombatPhase(NodeEnv.CombatPhase.AT_START_OF_COMBAT);
            const result = TARGETS_EVAL_SPD_NODE.evaluate(env);
            expect(result).toBe(BASE_SPD);
        });
    });
});

describe('Bonuses or penalties', () => {
    /** @type {Unit} */
    let unit;
    /** @type {Unit} */
    let foe;
    /** @type {NodeEnv} */
    let env;

    const BASE_STATS = [40, 35, 30, 25];
    const SPURS = [10, 8, 6, 4];

    beforeEach(() => {
        heroDatabase = g_testHeroDatabase;
        unit = heroDatabase.createUnit('アルフォンス');
        foe = heroDatabase.createUnit('シャロン');
        env = new NodeEnv();
        env.setTarget(unit).setUnitsDuringCombat(unit, foe);

        [unit.atkWithSkills, unit.spdWithSkills, unit.defWithSkills, unit.resWithSkills] = BASE_STATS;
        [foe.atkWithSkills, foe.spdWithSkills, foe.defWithSkills, foe.resWithSkills] = BASE_STATS;

        unit.addSpurs(...SPURS);
        foe.addSpurs(...SPURS);
    });

    afterEach(() => {
        // 必要なら: env.dispose(); heroDatabase.reset(); 等
    });

    test('when grants bonus during combat', () => {
        env.setCombatPhase(NodeEnv.CombatPhase.AT_START_OF_COMBAT);
        env.setTarget(unit).setTextUnit(unit);
        GRANTS_BONUS(STATS(1, 2, 3, 4)).to(UNIT).evaluate(env);
        expect(unit.getSpurs()).toEqual(ArrayUtil.add(SPURS, [1, 2, 3, 4]));
        expect(foe.getSpurs()).toEqual(SPURS);
    });

    test('when grants bonus on map', () => {
        env.setCombatPhase(NodeEnv.CombatPhase.NULL_PHASE);
        env.setTarget(unit);
        GRANTS_BONUS(STATS(1, 2, 3, 4)).to(TARGET_NODE).evaluate(env);
        expect(unit.getReservedBuffs()).toEqual([1, 2, 3, 4]);
        expect(foe.getReservedBuffs()).toEqual([0, 0, 0, 0]);
    });

    test('when inflicts penalty during combat', () => {
        env.setCombatPhase(NodeEnv.CombatPhase.AT_START_OF_COMBAT);
        env.setTarget(unit);
        INFLICTS_PENALTY(STATS(1, 2, 3, 4)).to(TARGET_NODE).evaluate(env);
        expect(unit.getSpurs()).toEqual(ArrayUtil.sub(SPURS, [1, 2, 3, 4]));
        expect(foe.getSpurs()).toEqual(SPURS);
    });

    test('when inflicts penalty on map', () => {
        env.setCombatPhase(NodeEnv.CombatPhase.NULL_PHASE);
        env.setTarget(unit);
        INFLICTS_PENALTY(STATS(1, 2, 3, 4)).to(TARGET_NODE).evaluate(env);
        expect(unit.getReservedDebuffs()).toEqual([1, 2, 3, 4].map(v => -v));
        expect(foe.getReservedDebuffs()).toEqual([0, 0, 0, 0]);
    });

    test('when grants status effects', () => {
        env.setCombatPhase(NodeEnv.CombatPhase.NULL_PHASE);
        env.setTarget(unit);
        let status = [StatusEffectType.FringeBonus, StatusEffectType.Imbue];
        GRANTS_STATUS_EFFECTS(...status).to(TARGET_NODE).evaluate(env);
        expect(unit.getStatusEffects().length === 0);
        unit.applyReservedStatusEffects();
        expect(unit.getStatusEffects()).toEqual(status);
    });

    test('when inflicts status effects', () => {
        env.setCombatPhase(NodeEnv.CombatPhase.NULL_PHASE);
        env.setTarget(unit);
        let status = [StatusEffectType.Frozen, StatusEffectType.Exposure];
        INFLICTS_STATUS_EFFECTS(...status).to(TARGET_NODE).evaluate(env);
        expect(unit.getStatusEffects().length === 0);
        unit.applyReservedStatusEffects();
        expect(unit.getStatusEffects()).toEqual(status);
    });

    test('neutralizes stat penalties', () => {
        env.setTarget(unit);
        let flag = StatFlags.ATK_DEF;
        NEUTRALIZES_STAT_PENALTIES(flag).to(TARGET_NODE).evaluate(env);
        expect(unit.reservedDebuffFlagsToNeutralize).toEqual(flag);
    });

    test('neutralizes targets n penalty effects', () => {
        env.setTarget(unit);
        let n = 3;
        NEUTRALIZES_N_PENALTY_EFFECTS(n).to(TARGET_NODE).evaluate(env);
        expect(unit.reservedNegativeStatusEffectCountInOrder).toEqual(n);
    });

    test('when grants 5', () => {
        GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE.evaluate(env);
        expect(unit.getSpurs()).toEqual(ArrayUtil.add(SPURS, [5, 5, 5, 5]));
        expect(foe.getSpurs()).toEqual(SPURS);
    });

    test('when grants atk/spd/def/res', () => {
        let spurs = [1, 2, 3, 4];
        GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(...spurs).evaluate(env);
        expect(unit.getSpurs()).toEqual(ArrayUtil.add(SPURS, spurs));
        expect(foe.getSpurs()).toEqual(SPURS);
    });

    test('when grants stats', () => {
        let spurs = [1, 2, 3, 4];
        GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(STATS(...spurs)).evaluate(env);
        expect(unit.getSpurs()).toEqual(ArrayUtil.add(SPURS, spurs));
        expect(foe.getSpurs()).toEqual(SPURS);
    });

    test('when inflicts 5', () => {
        INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE.evaluate(env);
        expect(foe.getSpurs()).toEqual(ArrayUtil.sub(SPURS, [5, 5, 5, 5]));
        expect(unit.getSpurs()).toEqual(SPURS);
    });

    test('when inflicts atk/spd/def/res on foe', () => {
        let spurs = [1, 2, 3, 4];
        INFLICTS_ATK_SPD_DEF_RES_ON_FOE_DURING_COMBAT_NODE(...spurs).evaluate(env);
        expect(foe.getSpurs()).toEqual(ArrayUtil.sub(SPURS, spurs));
        expect(unit.getSpurs()).toEqual(SPURS);
    });

    test('when inflicts atk/spd/def/res on target', () => {
        let spurs = [1, 2, 3, 4];
        INFLICTS_ATK_SPD_DEF_RES_ON_TARGET_DURING_COMBAT_NODE(...spurs).evaluate(env);
        expect(unit.getSpurs()).toEqual(ArrayUtil.sub(SPURS, spurs));
        expect(foe.getSpurs()).toEqual(SPURS);
    });

    test('when inflicts stats', () => {
        let spurs = [1, 2, 3, 4];
        INFLICTS_ATK_SPD_DEF_RES_ON_TARGET_DURING_COMBAT_NODE(STATS(...spurs)).evaluate(env);
        expect(unit.getSpurs()).toEqual(ArrayUtil.sub(SPURS, spurs));
        expect(foe.getSpurs()).toEqual(SPURS);
    });
});

describe('Skills during combat', () => {
    /** @type {Unit} */
    let atkUnit;
    /** @type {Unit} */
    let defUnit;
    let calculator;

    beforeEach(() => {
        heroDatabase = g_testHeroDatabase;
        atkUnit = heroDatabase.createUnit('アルフォンス');
        defUnit = heroDatabase.createUnit('アルフォンス');
        calculator = new test_DamageCalculator();
        calculator.unitManager.units = [atkUnit, defUnit];
        calculator.isLogEnabled = true;
        g_appData = calculator.unitManager;
        // g_appData.skillLogLevel = LoggerBase.LogLevel.ALL;
    });

    test('when Frozen added', () => {
        atkUnit.addStatusEffect(StatusEffectType.Frozen);
        atkUnit.defWithSkills = 40;
        defUnit.defWithSkills = 40;
        calculator.calcDamage(atkUnit, defUnit);
        expect(atkUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack).toBe(10);
        expect(defUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack).toBe(-10);
    });

    test('when Frozen added with def diff', () => {
        let skillId = 'phantom-def';
        AT_COMPARING_STATS_HOOKS.addSkillIfAbsent(skillId, () => DEF(7));
        defUnit.passiveS = skillId;
        atkUnit.addStatusEffect(StatusEffectType.Frozen);
        atkUnit.defWithSkills = 40;
        defUnit.defWithSkills = 65;
        calculator.calcDamage(atkUnit, defUnit);
        // 守備の差 * 2 + 10
        let expected = (65 + 7 - 40) * 2 + 10;
        expect(atkUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack).toBe(expected);
        expect(defUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack).toBe(-expected);
    });

    test('deals damage during combat', () => {
        let additionalDamage = 25;
        let skillId = 'deals-damage-during-combat';
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
            DEALS_DAMAGE_X_NODE(additionalDamage),
        ));
        atkUnit.passiveS = skillId;
        let result = calculator.calcDamage(atkUnit, defUnit);
        expect(result.atkUnit_atk).toBe(63);
        expect(result.defUnit_def).toBe(34);
        expect(result.atkUnit_totalAttackCount).toBe(1);
        expect(result.atkUnit_normalAttackDamage).toBe(result.atkUnit_atk - result.defUnit_def + additionalDamage);
    });

    test('deals damage during combat when atk - def = 0', () => {
        let additionalDamage = 25;
        let skillId = 'deals-damage-during-combat';
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(
            DEALS_DAMAGE_X_NODE(additionalDamage),
        ));
        atkUnit.passiveS = skillId;
        defUnit.defWithSkills = 99;
        let result = calculator.calcDamage(atkUnit, defUnit);
        expect(result.atkUnit_atk).toBe(63);
        expect(result.defUnit_def).toBe(99);
        expect(result.atkUnit_totalAttackCount).toBe(1);
        expect(result.atkUnit_normalAttackDamage).toBe(
            MathUtil.ensureMin(result.atkUnit_atk - result.defUnit_def, 0) + additionalDamage
        );
    });
});

describe('Effect Node', () => {
    /** @type {Unit} */
    let atkUnit;
    /** @type {Unit} */
    let defUnit;
    let calculator;

    beforeEach(() => {
        heroDatabase = g_testHeroDatabase;
        battleMap = new BattleMap('');
        battleMap.setMapSize(6, 8);

        atkUnit = heroDatabase.createUnit('アルフォンス');
        defUnit = heroDatabase.createUnit('アルフォンス');
        calculator = new test_DamageCalculator();
        calculator.unitManager.units = [atkUnit, defUnit];
        calculator.isLogEnabled = true;
        g_appData = calculator.unitManager;
        // g_appData.skillLogLevel = LoggerBase.LogLevel.ALL;
    });

    test('for unit', () => {
        let bonusStatuses = [StatusEffectType.FringeBonus, StatusEffectType.Imbue];
        let penaltyStatuses = [StatusEffectType.Frozen, StatusEffectType.Exposure];
        FOR_UNIT(UNITS_NODE(atkUnit, defUnit)).withEffects(
            GRANTS_STATUS_EFFECTS(...bonusStatuses),
            INFLICTS_STATUS_EFFECTS(...penaltyStatuses),
        ).evaluate(new NodeEnv());
        expect(atkUnit.reservedStatusEffects).toEqual(bonusStatuses.concat(penaltyStatuses));
        expect(defUnit.reservedStatusEffects).toEqual(bonusStatuses.concat(penaltyStatuses));
    });

    test('effects to unit', () => {
        let bonusStatuses = [StatusEffectType.FringeBonus, StatusEffectType.Imbue];
        let penaltyStatuses = [StatusEffectType.Frozen, StatusEffectType.Exposure];
        EFFECTS(
            GRANTS_STATUS_EFFECTS(...bonusStatuses),
            INFLICTS_STATUS_EFFECTS(...penaltyStatuses),
        ).to(UNITS_NODE(atkUnit, defUnit)).evaluate(new NodeEnv());
        expect(atkUnit.reservedStatusEffects).toEqual(bonusStatuses.concat(penaltyStatuses));
        expect(defUnit.reservedStatusEffects).toEqual(bonusStatuses.concat(penaltyStatuses));
    });

    test('do', () => {
        let bonusStatuses = [StatusEffectType.FringeBonus, StatusEffectType.Imbue];
        UNITS_NODE(atkUnit, defUnit).do(GRANTS_STATUS_EFFECTS(...bonusStatuses)).evaluate(new NodeEnv());
        expect(atkUnit.reservedStatusEffects).toEqual(bonusStatuses);
        expect(defUnit.reservedStatusEffects).toEqual(bonusStatuses);
    });

    test('unit do effect and effect', () => {
        let env = new NodeEnv().setTextUnit(atkUnit);
        UNIT.do(GRANTS_STATUS_EFFECTS(StatusEffectType.FringeBonus))
            .and(GRANTS_STATUS_EFFECTS(StatusEffectType.Imbue))
            .evaluate(env);
        expect(new Set(atkUnit.reservedStatusEffects)).toEqual(new Set([
            StatusEffectType.FringeBonus,
            StatusEffectType.Imbue
        ]));
    });

    test('units do effect and effect', () => {
        let env = new NodeEnv().setTextUnit(atkUnit);
        UNITS_NODE(atkUnit, defUnit)
            .do(GRANTS_STATUS_EFFECTS(StatusEffectType.FringeBonus))
            .and(GRANTS_STATUS_EFFECTS(StatusEffectType.Imbue))
            .evaluate(env);
        expect(new Set(atkUnit.reservedStatusEffects)).toEqual(new Set([
            StatusEffectType.FringeBonus,
            StatusEffectType.Imbue
        ]));
        expect(new Set(defUnit.reservedStatusEffects)).toEqual(new Set([
            StatusEffectType.FringeBonus,
            StatusEffectType.Imbue
        ]));
    });

    test('unit do effects and effect', () => {
        let env = new NodeEnv().setTextUnit(atkUnit);
        UNIT.doEffects(
            GRANTS_STATUS_EFFECTS(StatusEffectType.FringeBonus),
            GRANTS_STATUS_EFFECTS(StatusEffectType.Imbue),
        ).and(
            GRANTS_STATUS_EFFECTS(StatusEffectType.MobilityIncreased),
        ).evaluate(env);
        expect(new Set(atkUnit.reservedStatusEffects))
            .toEqual(new Set([
                StatusEffectType.FringeBonus,
                StatusEffectType.Imbue,
                StatusEffectType.MobilityIncreased
            ]));
    });

    test('unit do effect and effects', () => {
        let env = new NodeEnv().setTextUnit(atkUnit);
        UNIT.do(
            GRANTS_STATUS_EFFECTS(StatusEffectType.FringeBonus),
        ).andEffects(
            GRANTS_STATUS_EFFECTS(StatusEffectType.Imbue),
            GRANTS_STATUS_EFFECTS(StatusEffectType.MobilityIncreased),
        ).evaluate(env);
        expect(new Set(atkUnit.reservedStatusEffects))
            .toEqual(new Set([
                StatusEffectType.FringeBonus,
                StatusEffectType.Imbue,
                StatusEffectType.MobilityIncreased
            ]));
    });

    test('unit do effects and effects', () => {
        let env = new NodeEnv().setTextUnit(atkUnit);
        UNIT.doEffects(
            GRANTS_STATUS_EFFECTS(StatusEffectType.FringeBonus),
            GRANTS_STATUS_EFFECTS(StatusEffectType.Imbue),
        ).andEffects(
            GRANTS_STATUS_EFFECTS(StatusEffectType.MobilityIncreased),
            GRANTS_STATUS_EFFECTS(StatusEffectType.Reflex),
        ).evaluate(env);
        expect(new Set(atkUnit.reservedStatusEffects))
            .toEqual(new Set([
                StatusEffectType.FringeBonus,
                StatusEffectType.Imbue,
                StatusEffectType.MobilityIncreased,
                StatusEffectType.Reflex
            ]));
    });

    test('unit do and chain', () => {
        let env = new NodeEnv().setTextUnit(atkUnit);
        UNIT.do(
            GRANTS_STATUS_EFFECTS(StatusEffectType.FringeBonus),
        ).and(
            GRANTS_STATUS_EFFECTS(StatusEffectType.Imbue),
        ).and(
            GRANTS_STATUS_EFFECTS(StatusEffectType.MobilityIncreased),
        ).and(
            GRANTS_STATUS_EFFECTS(StatusEffectType.Reflex),
        ).evaluate(env);
        expect(new Set(atkUnit.reservedStatusEffects))
            .toEqual(new Set([
                StatusEffectType.FringeBonus,
                StatusEffectType.Imbue,
                StatusEffectType.MobilityIncreased,
                StatusEffectType.Reflex
            ]));
    });

    test('deals aoe damage', () => {
        const damage = 10;
        UNITS_NODE(atkUnit).do(DEALS_DAMAGE(damage)).evaluate(new NodeEnv());
        expect(atkUnit.battleContext.additionalDamageInPrecombat).toEqual(damage);
    });

    test('deals damage during combat', () => {
        const damage = 10;
        const env = new NodeEnv().setCombatPhase(NodeEnv.CombatPhase.AT_START_OF_COMBAT);
        UNITS_NODE(atkUnit).do(DEALS_DAMAGE(damage)).evaluate(env);
        expect(atkUnit.battleContext.additionalDamage).toEqual(damage);
    });

    test('deals X damage', () => {
        const damage = 10;
        UNITS_NODE(atkUnit).do(DEALS_DAMAGE(X).x(damage)).evaluate(new NodeEnv());
        expect(atkUnit.battleContext.additionalDamageInPrecombat).toEqual(damage);
    });

    test('deals X damage (X = 10 * 3)', () => {
        const damage = 10;
        UNITS_NODE(atkUnit).do(DEALS_DAMAGE(X).x(MULT_NODE(damage, 3))).evaluate(new NodeEnv());
        expect(atkUnit.battleContext.additionalDamageInPrecombat).toEqual(damage * 3);
    });

    test('deals X * 3 damage', () => {
        const damage = 10;
        UNITS_NODE(atkUnit).do(DEALS_DAMAGE(MULT_NODE(X, 3)).x(damage)).evaluate(new NodeEnv());
        expect(atkUnit.battleContext.additionalDamageInPrecombat).toEqual(damage * 3);
    });

    test('deals with max', () => {
        const damage = 20;
        const max = 10;
        UNITS_NODE(atkUnit).do(DEALS_DAMAGE(damage).max(max)).evaluate(new NodeEnv());
        expect(atkUnit.battleContext.additionalDamageInPrecombat).toEqual(max);
    });
});


describe('Test map', () => {
    beforeEach(() => {
        heroDatabase = g_testHeroDatabase;
        battleMap = new BattleMap('');
        battleMap.setMapSize(6, 8);

        allies = [
            heroDatabase.createUnit("アルフォンス"),
            heroDatabase.createUnit("アルフォンス"),
            heroDatabase.createUnit("アルフォンス"),
            heroDatabase.createUnit("アルフォンス"),
            heroDatabase.createUnit("アルフォンス"),
            heroDatabase.createUnit("アルフォンス"),
        ];
        for (let i = 0; i < allies.length; i++) {
            battleMap.placeUnit(allies[i], i, 6);
        }

        enemies = [
            heroDatabase.createUnit("シャロン", UnitGroupType.Enemy),
            heroDatabase.createUnit("シャロン", UnitGroupType.Enemy),
            heroDatabase.createUnit("シャロン", UnitGroupType.Enemy),
            heroDatabase.createUnit("シャロン", UnitGroupType.Enemy),
            heroDatabase.createUnit("シャロン", UnitGroupType.Enemy),
            heroDatabase.createUnit("シャロン", UnitGroupType.Enemy),
        ];
        for (let i = 0; i < enemies.length; i++) {
            battleMap.placeUnit(enemies[i], i, 1);
        }

        calclator = new test_DamageCalculator();
        calclator.isLogEnabled = false;
        calclator.unitManager.units = [...allies, ...enemies];
    });

    test('unit and closest foes', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(UNIT.and(CLOSEST_FOES).evaluate(env));
        expect(new Set([allies[2], enemies[2]])).toEqual(units);
    });

    test('unit and allies within 1 spaces and closest foes', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(UNIT.and(ALLIES_WITHIN.spaces(1).of(UNIT)).and(CLOSEST_FOES).evaluate(env));
        expect(new Set([allies[1], allies[2], allies[3], enemies[2]])).toEqual(units);
    });

    test('allies within 1 spaces of unit', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(ALLIES_WITHIN.spaces(1).of(UNIT).evaluate(env));
        expect(new Set([allies[1], allies[3]])).toEqual(units);
    });

    test('allies within 2 spaces of unit', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(ALLIES_WITHIN.spaces(2).of(UNIT).evaluate(env));
        expect(new Set([allies[0], allies[1], allies[3], allies[4]])).toEqual(units);
    });

    test('allies within 1 spaces of (allies within 1 spaces of unit)', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(ALLIES_WITHIN.spaces(1).of(ALLIES_WITHIN.spaces(1).of(UNIT)).evaluate(env));
        expect(new Set([allies[0], allies[2], allies[4]])).toEqual(units);
    });

    test('foes within 1 spaces of (foes within 1 spaces of foe)', () => {
        const env = new NodeEnv().setBattleMap(battleMap)
            .setSkillOwner(allies[2])
            .setTextUnit(allies[2])
            .setTextFoe(enemies[2]);
        const units = new Set(FOES_WITHIN.spaces(1).of(FOES_WITHIN.spaces(1).of(FOE)).evaluate(env));
        expect(new Set([enemies[0], enemies[2], enemies[4]])).toEqual(units);
    });

    test('foes within 2 spaces of closest foes', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(FOES_WITHIN.spaces(2).of(CLOSEST_FOES).evaluate(env));
        expect(new Set([enemies[0], enemies[1], enemies[3], enemies[4]])).toEqual(units);
    });

    test('allies within 2 spaces of closest foes', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(ALLIES_WITHIN.spaces(2).of(CLOSEST_FOES).evaluate(env));
        expect(new Set()).toEqual(units);
    });

    test('closest foes', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(CLOSEST_FOES.evaluate(env));
        expect(new Set([enemies[2]])).toEqual(units);
    });

    test('closest foes and unit', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(CLOSEST_FOES.and(UNIT).evaluate(env));
        expect(new Set([allies[2], enemies[2]])).toEqual(units);
    });

    test('unit and allies within 1 spaces', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(UNIT.and(ALLIES_WITHIN.spaces(1).of(UNIT)).evaluate(env));
        expect(new Set([allies[1], allies[2], allies[3]])).toEqual(units);
    });

    test('unit and allies within 2 spaces', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT)).evaluate(env));
        expect(new Set([allies[0], allies[1], allies[2], allies[3], allies[4]])).toEqual(units);
    });

    test('allies within 3 rows', () => {
        battleMap.placeUnit(allies[0], 0, 7);
        battleMap.placeUnit(allies[5], 5, 4);
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(ALLIES_WITHIN.rows(3).centeredOn(UNIT).evaluate(env));
        expect(new Set([allies[0], allies[1], allies[3], allies[4]])).toEqual(units);
    });

    test('allies within 3 columns', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(ALLIES_WITHIN.columns(3).centeredOn(UNIT).evaluate(env));
        expect(new Set([allies[1], allies[3]])).toEqual(units);
    });

    test('allies within 3 rows and 3 columns', () => {
        battleMap.placeUnit(allies[0], 2, 4);
        battleMap.placeUnit(allies[5], 5, 4);
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(ALLIES_WITHIN.rows(3).columns(3).centeredOn(UNIT).evaluate(env));
        expect(new Set([allies[1], allies[3]])).toEqual(units);
    });

    test('allies within 3 rows or 3 columns', () => {
        battleMap.placeUnit(allies[0], 2, 4);
        battleMap.placeUnit(allies[5], 5, 4);
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(ALLIES_WITHIN.rowsOrColumns(3, 3).centeredOn(UNIT).evaluate(env));
        expect(new Set([allies[0], allies[1], allies[3], allies[4]])).toEqual(units);
    });

    test('closest foes', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(CLOSEST_FOES.evaluate(env));
        expect(new Set([enemies[2]])).toEqual(units);
    });

    test('closest foes', () => {
        battleMap.placeUnit(enemies[2], 2, 0);
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(CLOSEST_FOES.evaluate(env));
        expect(new Set([enemies[1], enemies[2], enemies[3]])).toEqual(units);
    });

    test('closest foes and foes within 1 spaces of those foes', () => {
        battleMap.placeUnit(enemies[2], 2, 0);
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(CLOSEST_FOES.and(FOES_WITHIN.spaces(1).of(CLOSEST_FOES)).evaluate(env));
        expect(new Set([enemies[0], enemies[1], enemies[2], enemies[3], enemies[4]])).toEqual(units);
    });

    test('closest foes and foes within 2 spaces of those foes', () => {
        battleMap.placeUnit(enemies[2], 2, 0);
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(CLOSEST_FOES.and(FOES_WITHIN.spaces(2).of(CLOSEST_FOES)).evaluate(env));
        expect(new Set([enemies[0], enemies[1], enemies[2], enemies[3], enemies[4], enemies[5]])).toEqual(units);
    });

    test('spaces within 1 spaces of unit', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        expect(new Set(ANY_SPACE.withinSpaces(1).ofUnit(UNIT).evaluate(env)).size).toEqual(5);
    });

    test('spaces within 2 spaces of unit', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        expect(new Set(ANY_SPACE.withinSpaces(2).ofUnit(UNIT).evaluate(env)).size).toEqual(13 - 1); // 1マス画面外
    });

    test('spaces within 3 spaces of unit', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        expect(new Set(ANY_SPACE.withinSpaces(3).ofUnit(UNIT).evaluate(env)).size).toEqual(20); // 画面外を考慮
    });

    test('spaces within 1 spaces of space', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        expect(new Set(ANY_SPACE.withinSpaces(1).ofSpace(PLACED_SPACES(UNIT)).evaluate(env)).size).toEqual(5);
    });

    test('placed spaces', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const tile = allies[2].placedTile;
        expect(new Set(PLACED_SPACES(UNIT).evaluate(env)).size).toEqual(1);
        expect(new Set(PLACED_SPACES(UNIT).evaluate(env))).toEqual(new Set([tile]));
    });

    test('placed spaces and spaces within 1 spaces', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        expect(new Set(PLACED_SPACES(UNIT).orWithinSpacesOfThatSpaces(1).evaluate(env)).size).toEqual(5);
    });

    test('placed spaces and spaces within 2 spaces', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        expect(new Set(PLACED_SPACES(UNIT).orWithinSpacesOfThatSpaces(2).evaluate(env)).size).toEqual(13 - 1);
    });

    test('placed spaces and spaces within 3 spaces', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        expect(new Set(PLACED_SPACES(UNIT).orWithinSpacesOfThatSpaces(3).evaluate(env)).size).toEqual(20);
    });

    test('spaces that meet any condition', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const result = new Set(PLACED_SPACES(UNIT).meetAnyConditions(TRUE_NODE).evaluate(env));
        expect(result.size).toEqual(1);
    });

    test('spaces that meet any condition', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const result = new Set(PLACED_SPACES(UNIT).meetAnyConditions(FALSE_NODE).evaluate(env));
        expect(result.size).toEqual(0);
    });

    test('highest', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        allies[0].atkWithSkills = 80;
        allies[2].atkWithSkills = 70;
        let value =
            HIGHEST(TARGETS_ATK_ON_MAP).among(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).evaluate(env);
        expect(value).toEqual(80);
    });

    test('foes within 2 spaces of foe', () => {
        const env = new NodeEnv().setBattleMap(battleMap)
            .setSkillOwner(allies[2]).setTextUnit(allies[2]).setTextFoe(enemies[2]);
        const units = new Set(FOES_WITHIN.spaces(2).of(FOE).evaluate(env));
        expect(units).toEqual(new Set([enemies[0], enemies[1], enemies[3], enemies[4]]));
    });

    test('foe and foes within 2 spaces of foe', () => {
        const env = new NodeEnv().setBattleMap(battleMap)
            .setSkillOwner(allies[2]).setTextUnit(allies[2]).setTextFoe(enemies[2]);
        const units = new Set(FOE.and(FOES_WITHIN.spaces(2).of(FOE)).evaluate(env));
        expect(units).toEqual(new Set([enemies[0], enemies[1], enemies[2], enemies[3], enemies[4]]));
    });

    test('foes within 2 spaces of foe including foe', () => {
        const env = new NodeEnv().setBattleMap(battleMap)
            .setSkillOwner(allies[2]).setTextUnit(allies[2]).setTextFoe(enemies[2]);
        const units = new Set(FOES_WITHIN.spaces(2).of(FOE).include(FOE).evaluate(env));
        expect(units).toEqual(new Set([enemies[0], enemies[1], enemies[2], enemies[3], enemies[4]]));
    });

    test('allies within 3 columns and 3 rows (reversed order)', () => {
        battleMap.placeUnit(allies[0], 2, 4);
        battleMap.placeUnit(allies[5], 5, 4);
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        const units = new Set(ALLIES_WITHIN.columns(3).rows(3).centeredOn(UNIT).evaluate(env));
        expect(units).toEqual(new Set([allies[1], allies[3]]));
    });

    test('THERE_IS allies within 3 columns and 3 rows', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        expect(THERE_IS(ALLIES_WITHIN.columns(3).rows(3).centeredOn(UNIT)).evaluate(env)).toBe(true);
    });

    test('NUM_OF allies within rowsOrColumns', () => {
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        expect(NUM_OF(ALLIES_WITHIN.rowsOrColumns(3, 3).centeredOn(UNIT)).evaluate(env)).toBe(5);
    });

    test('ALLIES_WITHIN is not mutated by chaining', () => {
        const before = ALLIES_WITHIN._filters.length;
        ALLIES_WITHIN.spaces(3).of(UNIT);
        ALLIES_WITHIN.rows(3).centeredOn(UNIT);
        expect(ALLIES_WITHIN._filters.length).toBe(before);
        expect(ALLIES_WITHIN._centerNode).toBeNull();
    });

    test('cloned UnitsWithinNode has independent filters', () => {
        const a = ALLIES_WITHIN.spaces(2).of(UNIT);
        const b = a.clone();
        const env = new NodeEnv().setBattleMap(battleMap).setSkillOwner(allies[2]).setTextUnit(allies[2]);
        expect(new Set(a.evaluate(env))).toEqual(new Set(b.evaluate(env)));
        expect(a._filters).not.toBe(b._filters);
    });
});

test("Status Effects", () => {
    const unclassified = Object.entries(StatusEffectType).filter(
        ([key, value]) =>
            value !== -1 &&
            !POSITIVE_STATUS_EFFECT_ARRAY.includes(value) &&
            !NEGATIVE_STATUS_EFFECT_ARRAY.includes(value)
    );

    const notInInfoMap = Object.entries(StatusEffectType).filter(
        ([key, value]) => value !== -1 && !STATUS_EFFECT_INFO_MAP.has(value)
    );

    // --- 未分類チェック ---
    if (unclassified.length !== 0) {
        console.log("❌ 未分類のステータス効果があります:");
        for (const [key, value] of unclassified) {
            console.log(` - ${key}: ${value}`);
        }
        throw new Error(`未分類: ${unclassified.length} 件`);
    }

    // --- 未登録チェック ---
    if (notInInfoMap.length !== 0) {
        console.log("❌ STATUS_EFFECT_INFO_MAP に未登録のステータス効果があります:");
        for (const [key, value] of notInInfoMap) {
            console.log(` - ${key}: ${value}`);
        }
        throw new Error(`未登録: ${notInInfoMap.length} 件`);
    }

    expect(unclassified.length).toBe(0);
    expect(notInInfoMap.length).toBe(0);
});

describe('ModSkillEffectFieldNode DSL functions', () => {
    /** @type {Unit} */
    let unit;
    /** @type {Unit} */
    let foe;
    /** @type {NodeEnv} */
    let env;

    beforeEach(() => {
        heroDatabase = g_testHeroDatabase;
        unit = heroDatabase.createUnit('アルフォンス');
        foe = heroDatabase.createUnit('シャロン');
        env = new NodeEnv();
        env.setTarget(unit).setUnitsDuringCombat(unit, foe);
        env.setTextUnit(unit).setTextFoe(foe);
        env.setCombatPhase(NodeEnv.CombatPhase.AT_START_OF_COMBAT);
    });

    // --- SkillEffectField.Op.SET ---
    test('SkillEffectField.calc SET op returns operand', () => {
        expect(SkillEffectField.calc(10, 2, SkillEffectField.Op.SET)).toBe(2);
        expect(SkillEffectField.calc(false, true, SkillEffectField.Op.SET)).toBe(true);
        expect(SkillEffectField.calc(0, 99, SkillEffectField.Op.SET)).toBe(99);
    });

    // --- Category 1: Boolean SET_TRUE ---
    test('CANNOT_TRIGGER_PRECOMBAT_SPECIAL sets field to true', () => {
        expect(unit.battleContext.cannotTriggerPrecombatSpecial).toBe(false);
        CANNOT_TRIGGER_PRECOMBAT_SPECIAL().to(UNIT).evaluate(env);
        expect(unit.battleContext.cannotTriggerPrecombatSpecial).toBe(true);
    });

    test('DISABLES_DEFENSIVE_TERRAIN_EFFECTS sets field to true', () => {
        expect(unit.battleContext.invalidatesDefensiveTerrainEffect).toBe(false);
        DISABLES_DEFENSIVE_TERRAIN_EFFECTS().to(UNIT).evaluate(env);
        expect(unit.battleContext.invalidatesDefensiveTerrainEffect).toBe(true);
    });

    test('DISABLES_SUPPORT_EFFECTS sets field to true', () => {
        expect(unit.battleContext.invalidatesSupportEffect).toBe(false);
        DISABLES_SUPPORT_EFFECTS().to(UNIT).evaluate(env);
        expect(unit.battleContext.invalidatesSupportEffect).toBe(true);
    });

    test('INVALIDATES_COUNTERATTACK sets field to true', () => {
        expect(unit.battleContext.invalidatesCounterattack).toBe(false);
        INVALIDATES_COUNTERATTACK().to(UNIT).evaluate(env);
        expect(unit.battleContext.invalidatesCounterattack).toBe(true);
    });

    test('DISABLES_SKILLS_THAT_PREVENT_COUNTERATTACKS sets field to true', () => {
        expect(unit.battleContext.nullCounterDisrupt).toBe(false);
        DISABLES_SKILLS_THAT_PREVENT_COUNTERATTACKS().to(UNIT).evaluate(env);
        expect(unit.battleContext.nullCounterDisrupt).toBe(true);
    });

    test('PREVENTS_ATTACKER_SPECIAL sets field to true', () => {
        expect(unit.battleContext.preventedAttackerSpecial).toBe(false);
        PREVENTS_ATTACKER_SPECIAL().to(UNIT).evaluate(env);
        expect(unit.battleContext.preventedAttackerSpecial).toBe(true);
    });

    test('PREVENTS_DEFENDER_SPECIAL sets field to true', () => {
        expect(unit.battleContext.preventedDefenderSpecial).toBe(false);
        PREVENTS_DEFENDER_SPECIAL().to(UNIT).evaluate(env);
        expect(unit.battleContext.preventedDefenderSpecial).toBe(true);
    });

    test('PREVENTS_DEFENDER_SPECIAL_PER_ATTACK sets field to true', () => {
        expect(unit.battleContext.preventedDefenderSpecialPerAttack).toBe(false);
        PREVENTS_DEFENDER_SPECIAL_PER_ATTACK().to(UNIT).evaluate(env);
        expect(unit.battleContext.preventedDefenderSpecialPerAttack).toBe(true);
    });

    test('DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY sets field to true', () => {
        expect(unit.battleContext.canUnitDisableSkillsThatChangeAttackPriority).toBe(false);
        DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY().to(UNIT).evaluate(env);
        expect(unit.battleContext.canUnitDisableSkillsThatChangeAttackPriority).toBe(true);
    });

    test('CAN_COUNTERATTACK_REGARDLESS_OF_RANGE sets field to true', () => {
        expect(unit.battleContext.canCounterattackToAllDistance).toBe(false);
        CAN_COUNTERATTACK_REGARDLESS_OF_RANGE().to(UNIT).evaluate(env);
        expect(unit.battleContext.canCounterattackToAllDistance).toBe(true);
    });

    test('CALCULATES_DAMAGE_USING_LOWER_OF_FOES_DEF_OR_RES sets field to true', () => {
        expect(unit.battleContext.refersMinOfDefOrRes).toBe(false);
        CALCULATES_DAMAGE_USING_LOWER_OF_FOES_DEF_OR_RES().to(UNIT).evaluate(env);
        expect(unit.battleContext.refersMinOfDefOrRes).toBe(true);
    });

    test('INVALIDATES_FOES_NON_SPECIAL_DAMAGE_REDUCTION sets field to true', () => {
        expect(unit.battleContext.invalidatesDamageReductionExceptSpecial).toBe(false);
        INVALIDATES_FOES_NON_SPECIAL_DAMAGE_REDUCTION().to(UNIT).evaluate(env);
        expect(unit.battleContext.invalidatesDamageReductionExceptSpecial).toBe(true);
    });

    test('IS_DESPERATION_ACTIVATABLE sets field to true', () => {
        expect(unit.battleContext.isDesperationActivatable).toBe(false);
        IS_DESPERATION_ACTIVATABLE().to(UNIT).evaluate(env);
        expect(unit.battleContext.isDesperationActivatable).toBe(true);
    });

    test('IS_VANTAGE_ACTIVATABLE sets field to true', () => {
        expect(unit.battleContext.isVantageActivatable).toBe(false);
        IS_VANTAGE_ACTIVATABLE().to(UNIT).evaluate(env);
        expect(unit.battleContext.isVantageActivatable).toBe(true);
    });

    test('HAS_DEEP_WOUNDS sets field to true', () => {
        expect(unit.battleContext.hasDeepWounds).toBe(false);
        HAS_DEEP_WOUNDS().to(UNIT).evaluate(env);
        expect(unit.battleContext.hasDeepWounds).toBe(true);
    });

    test('DOES_NOT_TRIGGER_FOES_SAVIOR_EFFECTS sets field to true', () => {
        expect(unit.battleContext.doesNotTriggerFoesSaviorEffects).toBe(false);
        DOES_NOT_TRIGGER_FOES_SAVIOR_EFFECTS().to(UNIT).evaluate(env);
        expect(unit.battleContext.doesNotTriggerFoesSaviorEffects).toBe(true);
    });

    // --- Category 2: Numeric ADD ---
    test('DEALS_DAMAGE_PER_ATTACK adds to field', () => {
        expect(unit.battleContext.additionalDamagePerAttack).toBe(0);
        DEALS_DAMAGE_PER_ATTACK(10).to(UNIT).evaluate(env);
        expect(unit.battleContext.additionalDamagePerAttack).toBe(10);
        DEALS_DAMAGE_PER_ATTACK(5).to(UNIT).evaluate(env);
        expect(unit.battleContext.additionalDamagePerAttack).toBe(15);
    });

    test('DEALS_DAMAGE_OF_SPECIAL adds to field', () => {
        expect(unit.battleContext.additionalDamageOfSpecial).toBe(0);
        DEALS_DAMAGE_OF_SPECIAL(7).to(UNIT).evaluate(env);
        expect(unit.battleContext.additionalDamageOfSpecial).toBe(7);
    });

    test('RESTORES_HP_AFTER_COMBAT adds to field', () => {
        expect(unit.battleContext.healedHpAfterCombat).toBe(0);
        RESTORES_HP_AFTER_COMBAT(7).to(UNIT).evaluate(env);
        expect(unit.battleContext.healedHpAfterCombat).toBe(7);
    });

    test('REDUCES_DAMAGE_PER_ATTACK adds to field', () => {
        expect(unit.battleContext.damageReductionValuePerAttack).toBe(0);
        REDUCES_DAMAGE_PER_ATTACK(5).to(UNIT).evaluate(env);
        expect(unit.battleContext.damageReductionValuePerAttack).toBe(5);
    });

    test('INCREASES_SPD_DIFF_FOR_FOLLOWUP adds to field', () => {
        expect(unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack).toBe(0);
        INCREASES_SPD_DIFF_FOR_FOLLOWUP(10).to(UNIT).evaluate(env);
        expect(unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack).toBe(10);
    });

    test('FOLLOWUP_ATTACK_PRIORITY_INCREMENT adds 1', () => {
        expect(unit.battleContext.followupAttackPriorityIncrement).toBe(0);
        FOLLOWUP_ATTACK_PRIORITY_INCREMENT(1).to(UNIT).evaluate(env);
        expect(unit.battleContext.followupAttackPriorityIncrement).toBe(1);
    });

    test('FOLLOWUP_ATTACK_PRIORITY_DECREMENT subtracts 1', () => {
        expect(unit.battleContext.followupAttackPriorityDecrement).toBe(0);
        FOLLOWUP_ATTACK_PRIORITY_DECREMENT(1).to(UNIT).evaluate(env);
        expect(unit.battleContext.followupAttackPriorityDecrement).toBe(-1);
    });

    test('SPECIAL_COUNT_REDUCTION_BEFORE_ATTACK adds to field', () => {
        expect(unit.battleContext.specialCountReductionBeforeAttack).toBe(0);
        SPECIAL_COUNT_REDUCTION_BEFORE_ATTACK(1).to(UNIT).evaluate(env);
        expect(unit.battleContext.specialCountReductionBeforeAttack).toBe(1);
    });

    // --- Category 3: Numeric SET ---
    test('SETS_ATTACK_COUNT sets field', () => {
        expect(unit.battleContext.attackCount).toBe(1);
        SETS_ATTACK_COUNT(2).to(UNIT).evaluate(env);
        expect(unit.battleContext.attackCount).toBe(2);
    });

    test('SETS_COUNTERATTACK_COUNT sets field', () => {
        expect(unit.battleContext.counterattackCount).toBe(1);
        SETS_COUNTERATTACK_COUNT(2).to(UNIT).evaluate(env);
        expect(unit.battleContext.counterattackCount).toBe(2);
    });

    test('SETS_NON_SPECIAL_MIRACLE_HP_THRESHOLD sets field', () => {
        SETS_NON_SPECIAL_MIRACLE_HP_THRESHOLD(25).to(UNIT).evaluate(env);
        expect(unit.battleContext.nonSpecialMiracleHpPercentageThreshold).toBe(25);
    });

    // --- Category 4: Boolean SET_FALSE ---
    test('DISABLES_INCREASE_COOLDOWN_COUNT_FOR_ATTACK sets field to false', () => {
        unit.battleContext.increaseCooldownCountForAttack = true;
        DISABLES_INCREASE_COOLDOWN_COUNT_FOR_ATTACK().to(UNIT).evaluate(env);
        expect(unit.battleContext.increaseCooldownCountForAttack).toBe(false);
    });

    test('DISABLES_INCREASE_COOLDOWN_COUNT_FOR_DEFENSE sets field to false', () => {
        unit.battleContext.increaseCooldownCountForDefense = true;
        DISABLES_INCREASE_COOLDOWN_COUNT_FOR_DEFENSE().to(UNIT).evaluate(env);
        expect(unit.battleContext.increaseCooldownCountForDefense).toBe(false);
    });
});

describe('Function-as-node validation', () => {
    test('addChildren rejects function', () => {
        const node = new SkillEffectNode();
        const MY_FACTORY = () => new SkillEffectNode();
        expect(() => node.addChildren(MY_FACTORY)).toThrowError(/function.*passed/i);
    });

    test('addChildren error message includes function name', () => {
        const node = new SkillEffectNode();
        const MY_FACTORY = () => new SkillEffectNode();
        expect(() => node.addChildren(MY_FACTORY)).toThrowError(/MY_FACTORY/);
    });

    test('doEffects rejects function', () => {
        const MY_FACTORY = () => new SkillEffectNode();
        expect(() => UNIT.doEffects(MY_FACTORY)).toThrowError(/function.*passed/i);
    });
});
