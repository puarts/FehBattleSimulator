import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, mapState, mapActions } from 'pinia';
import { useMainStore, setupStoreActions } from '../Sources/store.js';

// Mock window-global functions (defined in HTML <script> tags)
window.showSettingDialog = vi.fn();
window.showImportDialog = vi.fn();
window.showExportDialog = vi.fn();
window.loadLazyImages = vi.fn();

// Mock module-scoped delegates (injected via setupStoreActions)
const mockDelegates = {
    updateMap: vi.fn(),
    saveSettings: vi.fn(),
    resetPlacement: vi.fn(),
};

describe('Pinia Store Migration', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        setupStoreActions(mockDelegates);
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

    it('should delegate module-scoped actions via setupStoreActions', () => {
        const store = useMainStore();

        store.updateMap();
        expect(mockDelegates.updateMap).toHaveBeenCalledOnce();

        store.saveSettings();
        expect(mockDelegates.saveSettings).toHaveBeenCalledOnce();

        store.resetPlacement();
        expect(mockDelegates.resetPlacement).toHaveBeenCalledOnce();
    });

    it('should delegate window-global actions via window.*', () => {
        const store = useMainStore();

        store.showSettingDialog();
        expect(window.showSettingDialog).toHaveBeenCalledOnce();

        store.showImportDialog();
        expect(window.showImportDialog).toHaveBeenCalledOnce();

        store.showExportDialog();
        expect(window.showExportDialog).toHaveBeenCalledOnce();

        store.loadLazyImages();
        expect(window.loadLazyImages).toHaveBeenCalledOnce();
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

        expect(typeof computed.appData).toBe('function');

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
