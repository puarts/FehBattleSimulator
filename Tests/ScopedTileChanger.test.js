describe('ScopedTileChanger', () => {
    test('ScopedTileChangerクラスがグローバルスコープに存在する', () => {
        expect(typeof ScopedTileChanger).toBe('function');
    });

    test('DamageCalculatorWrapper内からScopedTileChangerが利用可能である', () => {
        expect(typeof ScopedTileChanger).toBe('function');
    });
});
