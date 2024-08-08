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

    describe(`Test ${BoolToBoolNode.name}`, () => {
        test('Test evaluate()', () => {
            expect(new BoolToBoolNode(true).evaluate(null)).toEqual(true);
            expect(new BoolToBoolNode(false).evaluate(null)).toEqual(false);
            expect(new BoolToBoolNode(new OrNode(FALSE_NODE, TRUE_NODE)).evaluate(null)).toEqual(true);
            expect(new BoolToBoolNode(new OrNode(FALSE_NODE, FALSE_NODE)).evaluate(null)).toEqual(false);
        });
    })

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
