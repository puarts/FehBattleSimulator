/// @file
/// @brief 設定のセーブ/ロード/インポート/エクスポートの自由関数群。
/// BattleSimulatorBase.jsから分離。

function loadSettings() {
    console.log("loading..");
    console.log("current cookie:" + document.cookie);
    let fromCookies = LocalStorageUtil.getBoolean('uses-cookie-for-storing-settings', false);
    if (fromCookies) {
        console.log('load settings from cookies');
    } else {
        console.log('load settings from local storage');
    }
    g_appData.settings.loadSettings(fromCookies);
    if (g_appData.gameMode === GameMode.ResonantBattles) {
        g_app.__setUnitsForResonantBattles();
    }
    g_app.updateAllUnitSpur();

    let turnText = g_appData.currentTurn === 0 ? "戦闘開始前" : "ターン" + g_appData.currentTurn;
    g_app.writeSimpleLogLine(`<div class="log-action-header">${turnText}の設定を読み込みました。</div>`);
    g_appData.commandQueuePerAction.clear();
    __updateChaseTargetTilesForAllUnits();
    updateAllUi();
    g_app.enumerateAllUnits().forEach(unit => unit.resetMaxSpecialCount());
}

function loadSettingsFromDict(
    settingDict,
    loadsAllySettings = true,
    loadsEnemySettings = true,
    loadsOffenceSettings = true,
    loadsDefenceSettings = true,
    loadsMapSettings = false,
    clearsAllFirst = true,
    updatesChaseTarget = true,
) {
    g_appData.settings.loadSettingsFromDict(settingDict,
        loadsAllySettings,
        loadsEnemySettings,
        loadsOffenceSettings,
        loadsDefenceSettings,
        loadsMapSettings,
        clearsAllFirst);
    g_app.updateAllUnitSpur();
    if (updatesChaseTarget) {
        __updateChaseTargetTilesForAllUnits();
    }
}

function saveSettings() {
    console.log("saving..");
    let toCookie = LocalStorageUtil.getBoolean('uses-cookie-for-storing-settings', false);
    if (toCookie) {
        console.log('save settings to cookies');
    } else {
        console.log('save settings to local storage');
    }
    g_appData.settings.saveSettings(toCookie);
    console.log("current cookie:" + document.cookie);
    g_app.writeSimpleLogLine(`<div class="log-action-header">ターン${g_appData.currentTurn}の設定を保存しました。</div>`);
}

function exportPerTurnSettingAsString(
    loadsAllies = true, loadsEnemies = true, loadsOffenceStructures = true, loadsDefenseStructures = true
) {
    let turnSetting = g_appData.settings.convertToPerTurnSetting(loadsAllies, loadsEnemies, loadsOffenceStructures, loadsDefenseStructures);
    return turnSetting.perTurnStatusToString();
}

function importPerTurnSetting(perTurnSettingAsString, updatesChaseTarget = true) {
    let currentTurn = g_appData.currentTurn;
    let turnSetting = new TurnSetting(currentTurn);
    let dict = {};
    dict[turnSetting.serialId] = perTurnSettingAsString;
    loadSettingsFromDict(dict, true, true, true, true, true, false, updatesChaseTarget);
}

function importSettingsFromString(
    inputText,
    loadsAllySettings = true,
    loadsEnemySettings = true,
    loadsOffenceSettings = true,
    loadsDefenceSettings = true,
    loadsMapSettings = false,
    compressMode = null
) {
    console.log("loadsAllySettings = " + loadsAllySettings);
    console.log("loadsEnemySettings = " + loadsEnemySettings);

    let decompressed = compressMode == null ?
        g_appData.decompressSettingAutomatically(inputText) :
        g_appData.decompressSettingByCompressMode(inputText, compressMode);
    console.log(`decompressed: ${decompressed}`);
    let settings = decompressed.split(';');
    let dict = {};
    let currentTurn = g_appData.currentTurn;
    let turnSetting = new TurnSetting(currentTurn);
    for (let setting of settings) {
        let idAndValue = setting.split('=');
        let id = idAndValue[0];
        if (id.startsWith(TurnSettingCookiePrefix)) {
            // 他のターンの設定だった場合、現在のターンに置き換える
            id = turnSetting.serialId;
        }

        dict[id] = setting.substring(idAndValue[0].length + 1).trim();
    }
    loadSettingsFromDict(
        dict,
        loadsAllySettings,
        loadsEnemySettings,
        loadsOffenceSettings,
        loadsDefenceSettings,
        loadsMapSettings
    );
}
