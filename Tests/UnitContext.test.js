// UnitContext.js ファイル分割のシンボル可視性テスト

// AttackableUnitInfo
test('AttackableUnitInfo_class_exists_in_global_scope', () => {
    expect(typeof AttackableUnitInfo).toBe('function');
});

// AttackEvaluationContext
test('AttackEvaluationContext_class_exists_in_global_scope', () => {
    expect(typeof AttackEvaluationContext).toBe('function');
});

test('AttackEvaluationContext_initial_combatResult_is_Draw', () => {
    const ctx = new AttackEvaluationContext();
    expect(ctx.combatResult).toBe(CombatResultType.Draw);
});

// AssistableUnitInfo
test('AssistableUnitInfo_class_exists_in_global_scope', () => {
    expect(typeof AssistableUnitInfo).toBe('function');
});

// ActionContext
test('ActionContext_class_exists_in_global_scope', () => {
    expect(typeof ActionContext).toBe('function');
});

test('ActionContext_initial_state_has_empty_arrays', () => {
    const ctx = new ActionContext();
    expect(ctx.attackableUnitInfos).toEqual([]);
    expect(ctx.assistableUnitInfos).toEqual([]);
});

// PrecombatContext (BattleContext.jsからロード)
test('PrecombatContext_class_exists_in_global_scope', () => {
    expect(typeof PrecombatContext).toBe('function');
});
