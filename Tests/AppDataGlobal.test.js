import { describe, it, expect, beforeEach } from 'vitest';
import { g_appData, setAppData } from '../Sources/AppDataGlobal.js';

describe('AppDataGlobal', () => {
    beforeEach(() => {
        setAppData(undefined);
    });

    it('初期状態で g_appData が undefined', () => {
        expect(g_appData).toBeUndefined();
    });

    it('setAppData(instance) 呼び出し後、g_appData が同じインスタンスを返す', () => {
        const mockAppData = { name: 'test' };
        setAppData(mockAppData);
        expect(g_appData).toBe(mockAppData);
    });

    it('setAppData を複数回呼び出すと最後のインスタンスが保持される', () => {
        const first = { id: 1 };
        const second = { id: 2 };
        setAppData(first);
        setAppData(second);
        expect(g_appData).toBe(second);
    });

    it('異なるモジュールから g_appData を import しても同じインスタンスが返る', async () => {
        const mockAppData = { singleton: true };
        setAppData(mockAppData);
        // ESM モジュールキャッシュにより同一 binding を参照する
        const mod = await import('../Sources/AppDataGlobal.js');
        expect(mod.g_appData).toBe(mockAppData);
    });
});
