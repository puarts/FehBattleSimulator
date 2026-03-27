// UnitUtility.js ファイル分割のシンボル可視性テスト

test('UnitUtil class is available in global scope', () => {
    expect(typeof UnitUtil).toBe('function');
});

test('calcBuffAmount function is available in global scope', () => {
    expect(typeof calcBuffAmount).toBe('function');
});

test('calcHealAmount function is available in global scope', () => {
    expect(typeof calcHealAmount).toBe('function');
});

test('isDebufferTier1 function is available in global scope', () => {
    expect(typeof isDebufferTier1).toBe('function');
});

test('isDebufferTier2 function is available in global scope', () => {
    expect(typeof isDebufferTier2).toBe('function');
});

test('isAfflictor function is available in global scope', () => {
    expect(typeof isAfflictor).toBe('function');
});

test('canRefreshTo function is available in global scope', () => {
    expect(typeof canRefreshTo).toBe('function');
});
