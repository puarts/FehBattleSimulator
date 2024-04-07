/// @file
/// @brief シミュレーターのメインコードです。


/// シミュレーター本体です。
class ArenaSimulator extends BattleSimulatorBase {
    constructor() {
        super();
    }
}

let g_app = new ArenaSimulator();

function initAetherRaidBoard(
    heroInfos
) {
    using_(new ScopedStopwatch(time => g_app.writeDebugLogLine("マップの初期化: " + time + " ms")), () => {
        g_appData.setGameMode(GameMode.Arena);
        resetPlacement();

        // 全ユニットをアルフォンスで初期化(名前が変わらない事があるので一旦コメントアウト)
        // let defaultHeroIndex = 18;
        // g_app.resetUnits(defaultHeroIndex);
    });

    using_(new ScopedStopwatch(time => g_app.writeDebugLogLine("保存状態の復元: " + time + " ms")), () => {
        // g_app.resetUnitsForTesting();
        loadSettings();
        if (!isArenaMap(g_appData.mapKind)) {
            g_appData.setGameMode(GameMode.Arena);
            g_appData.setMapKind(MapType.Arena_1);
            removeBreakableWallsFromTrashBox();
            changeMap();
            resetPlacement();
            updateAllUi();
        }
    });
}
