// AppDataGlobal.js
// g_appData シングルトンを保持する専用モジュール。
// 依存ゼロ（Layer 0 相当）のため、どのレイヤーからも安全に import 可能。

export var g_appData;

export function setAppData(appData) {
    g_appData = appData;
}

export var g_deffenceStructureContainer;
export var g_offenceStructureContainer;

export function setStructureContainers(defence, offence) {
    g_deffenceStructureContainer = defence;
    g_offenceStructureContainer = offence;
}

/** @type {((structure: Object) => void) | null} */
export let moveStructureToTrashBoxCallback = null;

/**
 * Register the moveStructureToTrashBox implementation.
 * Called by Layer 7 (BattleSimulatorBase.js) at initialization.
 * @param {(structure: Object) => void} callback
 */
export function setMoveStructureToTrashBoxCallback(callback) {
    moveStructureToTrashBoxCallback = callback;
}
