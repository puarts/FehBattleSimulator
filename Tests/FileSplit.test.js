// ファイル分割リファクタリングのシンボル可視性テスト

// PerformanceProfile
test('PerformanceProfile_class_exists_in_global_scope', () => {
    expect(typeof PerformanceProfile).toBe('function');
});

test('PerformanceProfile_can_create_instance', () => {
    const profile = new PerformanceProfile();
    expect(profile).toBeInstanceOf(PerformanceProfile);
    expect(profile.isEnabled).toBe(true);
    expect(profile.elaspedMilliseconds).toEqual({});
});

test('PerformanceProfile_profile_executes_callback_and_records_time', () => {
    const profile = new PerformanceProfile();
    const result = profile.profile('test', () => 42);
    expect(result).toBe(42);
    expect('test' in profile.elaspedMilliseconds).toBe(true);
    expect(typeof profile.elaspedMilliseconds['test']).toBe('number');
});

test('PerformanceProfile_addElaspedMilliseconds_accumulates', () => {
    const profile = new PerformanceProfile();
    profile.addElaspedMilliseconds('calc', 10);
    expect(profile.elaspedMilliseconds['calc']).toBe(10);
    profile.addElaspedMilliseconds('calc', 5);
    expect(profile.elaspedMilliseconds['calc']).toBe(15);
});
