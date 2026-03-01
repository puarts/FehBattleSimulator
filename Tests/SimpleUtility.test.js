// Simple test for ObjectUtil.getKeyName function
test('ObjectUtil_getKeyName', () => {
    // Create a simple object for testing
    const testObject = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
    };
    
    // Test that the function correctly finds the key for a given value
    expect(ObjectUtil.getKeyName(testObject, 'value1')).toBe('key1');
    expect(ObjectUtil.getKeyName(testObject, 'value2')).toBe('key2');
    expect(ObjectUtil.getKeyName(testObject, 'value3')).toBe('key3');
    
    // Test that the function returns undefined for a value that doesn't exist
    expect(ObjectUtil.getKeyName(testObject, 'nonexistent')).toBeUndefined();
});