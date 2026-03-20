/// @file
/// @brief Pinia ストア定義（Vuex からの移行）

import { defineStore } from 'pinia';

/**
 * メインアプリケーションストア。
 * state: appData, battleSimulator, imageRootPath を保持。
 * actions: グローバル関数へのデリゲート。
 */
export const useMainStore = defineStore('main', {
    state: () => ({
        appData: null,
        battleSimulator: null,
        imageRootPath: '',
    }),
    actions: {
        updateMap() { return updateMap(); },
        saveSettings() { return saveSettings(); },
        showSettingDialog() { return showSettingDialog(); },
        showImportDialog() { return showImportDialog(); },
        showExportDialog() { return showExportDialog(); },
        loadLazyImages() { return loadLazyImages(); },
        resetPlacement() { return resetPlacement(); },
    }
});
