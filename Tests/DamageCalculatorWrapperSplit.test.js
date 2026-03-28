// DamageCalculatorWrapper 分割リファクタリング検証テスト

describe('DamageCalculatorWrapper split verification', () => {

    // --- definePrototypeMethods ヘルパー ---

    describe('definePrototypeMethods helper', () => {
        const testMethodName = '__test_defineProto_callable';

        afterEach(() => {
            delete DamageCalculatorWrapper.prototype[testMethodName];
        });

        test('definePrototypeMethods でメソッドを追加するとインスタンスから呼び出せる', () => {
            DamageCalculatorWrapper.definePrototypeMethods({
                [testMethodName]: function() { return 42; },
            });
            const calc = new test_DamageCalculator();
            expect(calc.damageCalc[testMethodName]()).toBe(42);
        });

        test('追加されたメソッドが non-enumerable である', () => {
            DamageCalculatorWrapper.definePrototypeMethods({
                [testMethodName]: function() {},
            });
            expect(Object.keys(DamageCalculatorWrapper.prototype)).not.toContain(testMethodName);
        });

        test('同名メソッドを二重に追加すると Error がスローされる', () => {
            DamageCalculatorWrapper.definePrototypeMethods({
                [testMethodName]: function() {},
            });
            expect(() => {
                DamageCalculatorWrapper.definePrototypeMethods({
                    [testMethodName]: function() {},
                });
            }).toThrow('Duplicate prototype method');
        });
    });

    // --- constructor smoke test ---

    describe('constructor smoke test', () => {
        test('DamageCalculatorWrapper がエラーなくインスタンス化できる', () => {
            expect(() => new test_DamageCalculator()).not.toThrow();
        });

        test('インスタンスが内部オブジェクトを保持している', () => {
            const calc = new test_DamageCalculator();
            expect(calc.damageCalc._damageCalc).toBeDefined();
            expect(calc.damageCalc._combatHander).toBeDefined();
            expect(calc.damageCalc.profiler).toBeDefined();
        });
    });

    // --- public API names assertion ---

    describe('public API names assertion', () => {
        test('DamageCalculatorWrapper.prototype が全 public メソッド名を持つ', () => {
            const expectedPublicMethods = [
                'clearLog', 'writeLog', 'writeDebugLog',
                'updateDamageCalculation', 'calcDamageTemporary', 'calcDamage',
                'calcPreCombatResult', 'calcPrecombatSpecialDamage',
                'calcPrecombatSpecialResult', 'calcCombatResult',
                'applyBeastCavalryRefinedSkillEffect',
                'addFixedDamageByStatus', 'applyFixedValueSkill',
                'applyDamageReductionByOwnStatus',
                'canCounterAttack', 'getFollowupAttackPriorityForBoth',
                'enumerateUnitsInTheSameGroupWithinSpecifiedSpaces',
                'enumerateUnitsInDifferentGroupWithinSpecifiedSpaces',
                'enumerateUnitsInTheSameGroupOnMap',
                'enumerateUnitsInDifferentGroupOnMap',
                'updateAllUnitSpur', 'updateUnitSpur',
                'applySkillEffectsAfterAfterBeginningOfCombat',
                'applySkillEffectsAfterAfterBeginningOfCombatFromAllies',
                'applySkillEffectAfterConditionDetermined',
            ];
            for (const name of expectedPublicMethods) {
                expect(typeof DamageCalculatorWrapper.prototype[name]).toBe('function');
            }
        });

        test('DamageCalculatorWrapper.prototype が全 getter/setter を持つ', () => {
            const expectedGetters = [
                'log', 'simpleLog', 'currentTurn', 'isOddTurn',
                'isEvenTurn', 'isLogEnabled', 'unitManager',
            ];
            for (const name of expectedGetters) {
                const desc = Object.getOwnPropertyDescriptor(DamageCalculatorWrapper.prototype, name);
                expect(desc).toBeDefined();
                expect(typeof desc.get).toBe('function');
            }

            const expectedSetters = ['isLogEnabled'];
            for (const name of expectedSetters) {
                const desc = Object.getOwnPropertyDescriptor(DamageCalculatorWrapper.prototype, name);
                expect(desc).toBeDefined();
                expect(typeof desc.set).toBe('function');
            }
        });
    });
});

// Phase 2: InitSkillEffectDict split verification

describe('DamageCalculatorWrapper_InitSkillEffectDict split', () => {
    test('__init__applySkillEffectForAtkUnitFuncDict exists on prototype', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__init__applySkillEffectForAtkUnitFuncDict).toBe('function');
    });

    test('__init__applySkillEffectForDefUnitFuncDict exists on prototype', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__init__applySkillEffectForDefUnitFuncDict).toBe('function');
    });

    test('__init__applySkillEffectForUnitFuncDict exists on prototype', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__init__applySkillEffectForUnitFuncDict).toBe('function');
    });

    test('__init__applySpecialSkillEffect exists on prototype', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__init__applySpecialSkillEffect).toBe('function');
    });
});

// Phase 3: ApplySkillEffects split verification

describe('DamageCalculatorWrapper_ApplySkillEffects split', () => {
    test('__applySkillEffectForUnit がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__applySkillEffectForUnit).toBe('function');
    });

    test('____applySkillEffectForUnit がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.____applySkillEffectForUnit).toBe('function');
    });

    test('__applySkillEffectRelatedToEnemyStatusEffects がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__applySkillEffectRelatedToEnemyStatusEffects).toBe('function');
    });

    test('__applySkillEffectForUnitAfterCombatStatusFixed がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__applySkillEffectForUnitAfterCombatStatusFixed).toBe('function');
    });

    test('__applyInvalidationSkillEffect がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__applyInvalidationSkillEffect).toBe('function');
    });

    test('__applySpecialSkillEffect がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__applySpecialSkillEffect).toBe('function');
    });

    test('__setSkillEffetToContext がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__setSkillEffetToContext).toBe('function');
    });

    test('__setBothOfAtkDefSkillEffetToContext がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__setBothOfAtkDefSkillEffetToContext).toBe('function');
    });
});

// Phase 4: Spur split verification

describe('DamageCalculatorWrapper_Spur split', () => {
    test('updateAllUnitSpur がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.updateAllUnitSpur).toBe('function');
    });

    test('updateUnitSpur がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.updateUnitSpur).toBe('function');
    });

    test('__updateUnitSpur がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__updateUnitSpur).toBe('function');
    });
});

describe('DamageCalculatorWrapper dict initialization after split', () => {
    let calc;
    beforeAll(() => {
        calc = new test_DamageCalculator();
    });

    test('_applySkillEffectForAtkUnitFuncDict has entries after construction', () => {
        expect(Object.keys(calc.damageCalc._applySkillEffectForAtkUnitFuncDict).length).toBeGreaterThan(0);
    });

    test('_applySkillEffectForDefUnitFuncDict has entries after construction', () => {
        expect(Object.keys(calc.damageCalc._applySkillEffectForDefUnitFuncDict).length).toBeGreaterThan(0);
    });

    test('_applySkillEffectForUnitFuncDict has entries after construction', () => {
        expect(Object.keys(calc.damageCalc._applySkillEffectForUnitFuncDict).length).toBeGreaterThan(0);
    });

    test('_applySpecialSkillEffectFuncDict has entries after construction', () => {
        expect(Object.keys(calc.damageCalc._applySpecialSkillEffectFuncDict).length).toBeGreaterThan(0);
    });
});
