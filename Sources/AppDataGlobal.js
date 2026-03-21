// AppDataGlobal.js
// g_appData シングルトンを保持する専用モジュール。
// 依存ゼロ（Layer 0 相当）のため、どのレイヤーからも安全に import 可能。

export var g_appData;

export function setAppData(appData) {
    g_appData = appData;
}
