import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, mapState, mapActions } from 'pinia';
import { useMainStore } from '../Sources/store.js';

// Mock global functions that store actions delegate to
globalThis.updateMap = vi.fn();
globalThis.saveSettings = vi.fn();
globalThis.showSettingDialog = vi.fn();
globalThis.showImportDialog = vi.fn();
globalThis.showExportDialog = vi.fn();
globalThis.loadLazyImages = vi.fn();
globalThis.resetPlacement = vi.fn();

describe('Pinia Store Migration', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('should define a store with expected state properties', () => {
        const store = useMainStore();
        expect(store.appData).toBeNull();
        expect(store.battleSimulator).toBeNull();
        expect(store.imageRootPath).toBe('');
    });

    it('should allow direct state mutation', () => {
        const store = useMainStore();
        const mockAppData = { units: [] };
        const mockSimulator = { name: 'test' };

        store.appData = mockAppData;
        store.battleSimulator = mockSimulator;
        store.imageRootPath = '/images';

        expect(store.appData).toStrictEqual(mockAppData);
        expect(store.battleSimulator).toStrictEqual(mockSimulator);
        expect(store.imageRootPath).toBe('/images');
    });

    it('should have actions that delegate to global functions', () => {
        const store = useMainStore();

        store.updateMap();
        expect(globalThis.updateMap).toHaveBeenCalledOnce();

        store.saveSettings();
        expect(globalThis.saveSettings).toHaveBeenCalledOnce();

        store.showSettingDialog();
        expect(globalThis.showSettingDialog).toHaveBeenCalledOnce();

        store.showImportDialog();
        expect(globalThis.showImportDialog).toHaveBeenCalledOnce();

        store.showExportDialog();
        expect(globalThis.showExportDialog).toHaveBeenCalledOnce();

        store.loadLazyImages();
        expect(globalThis.loadLazyImages).toHaveBeenCalledOnce();

        store.resetPlacement();
        expect(globalThis.resetPlacement).toHaveBeenCalledOnce();
    });

    it('should provide mapState-compatible computed properties', () => {
        const store = useMainStore();
        store.appData = { test: true };
        store.battleSimulator = { id: 1 };
        store.imageRootPath = '/img';

        const computed = mapState(useMainStore, ['appData', 'battleSimulator', 'imageRootPath']);

        expect(computed).toHaveProperty('appData');
        expect(computed).toHaveProperty('battleSimulator');
        expect(computed).toHaveProperty('imageRootPath');

        // mapState returns getter functions that read from the active store
        expect(typeof computed.appData).toBe('function');

        // Verify getters return correct values when called with a store context
        const mockThis = { $pinia: store.$pinia };
        expect(computed.appData.call(mockThis)).toStrictEqual({ test: true });
        expect(computed.battleSimulator.call(mockThis)).toStrictEqual({ id: 1 });
        expect(computed.imageRootPath.call(mockThis)).toBe('/img');
    });

    it('should provide mapActions-compatible methods', () => {
        const methods = mapActions(useMainStore, [
            'updateMap', 'saveSettings', 'showSettingDialog',
            'showImportDialog', 'showExportDialog', 'loadLazyImages', 'resetPlacement'
        ]);

        expect(typeof methods.updateMap).toBe('function');
        expect(typeof methods.saveSettings).toBe('function');
        expect(typeof methods.showSettingDialog).toBe('function');
        expect(typeof methods.showImportDialog).toBe('function');
        expect(typeof methods.showExportDialog).toBe('function');
        expect(typeof methods.loadLazyImages).toBe('function');
        expect(typeof methods.resetPlacement).toBe('function');
    });
});
