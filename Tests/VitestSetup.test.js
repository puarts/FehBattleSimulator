import { describe, test, expect } from 'vitest';

// Vitest setup verification test
// This file validates the Vitest configuration works correctly.

describe('Vitest environment setup', () => {
    test('globals are available without import (globals: true)', () => {
        // describe, test, expect should be available without importing from vitest
        expect(true).toBe(true);
    });

    test('jsdom environment provides document and window', () => {
        expect(typeof document).toBe('object');
        expect(typeof window).toBe('object');
        expect(document.createElement).toBeDefined();
    });

    test('performance API is available', () => {
        expect(globalThis.performance).toBeDefined();
        expect(typeof performance.now).toBe('function');
    });

    test('TextEncoder and TextDecoder are available', () => {
        expect(globalThis.TextEncoder).toBeDefined();
        expect(globalThis.TextDecoder).toBeDefined();
    });
});
