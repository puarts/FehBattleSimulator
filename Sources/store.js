/// @file
/// @brief Pinia ストア定義（Vuex からの移行）

import { defineStore } from 'pinia';

/**
 * メインアプリケーションストア。
 * state: appData, battleSimulator, imageRootPath を保持。
 * actions: 初期化時に setupStoreActions() で登録される。
 */
export const useMainStore = defineStore('main', {
    state: () => ({
        appData: null,
        battleSimulator: null,
        imageRootPath: '',
    }),
    actions: {
        // Actions are thin delegates to functions defined elsewhere.
        // Module-scoped functions (from BattleSimulatorBase.js) are injected
        // via setupStoreActions() to avoid circular imports.
        // HTML-global functions (loadLazyImages, showSettingDialog, etc.)
        // are called via window at runtime.
        updateMap() { return this._delegates.updateMap(); },
        saveSettings() { return this._delegates.saveSettings(); },
        resetPlacement() { return this._delegates.resetPlacement(); },
        showSettingDialog() { return window.showSettingDialog(); },
        showImportDialog() { return window.showImportDialog(); },
        showExportDialog() { return window.showExportDialog(); },
        loadLazyImages() { return window.loadLazyImages(); },
    }
});

/**
 * モジュールスコープの関数をストアアクションに注入する。
 * BattleSimulatorBase.js の初期化時に呼ばれる（循環 import 回避）。
 */
export function setupStoreActions(delegates) {
    const store = useMainStore();
    store._delegates = delegates;
}
