describe('Test skill effect', () => {
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
        GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(STATS_NODE(...spurs)).evaluate(env);
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
        INFLICTS_ATK_SPD_DEF_RES_ON_TARGET_DURING_COMBAT_NODE(STATS_NODE(...spurs)).evaluate(env);
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
        AT_COMPARING_STATS_HOOKS.addSkillIfAbsent(skillId, () => DEF_NODE(7));
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
