diff --git a/Deploy.bat b/Deploy.bat
index 88af0bc7..aa88f1a4 100644
--- a/Deploy.bat
+++ b/Deploy.bat
@@ -24,7 +24,7 @@ rem �f�[�^�x�[�X�E�ݒ�
 set BF=%BF%,database\SkillDatabase,database\HeroDatabase,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets
 set BF=%BF%,app\SettingManager,app\AppData
 rem ���C�������EUI
-set BF=%BF%,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\BattleSimulatorBase,app\VueComponents
+set BF=%BF%,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,app\VueComponents
 
 rem --- 4. �ŏI�I�ȓ��� ---
 set battle_simulator_filenames=%BF%,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
@@ -42,7 +42,7 @@ rem �X�e�[�^�X�v�Z�@
 call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator core\GlobalDefinitions,core\Utilities,data\SkillConstants,data\Skill,map\BattleMapElement,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,pages\StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem ���j�b�g�r���_�[
-call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem �_���[�W�v�Z�@
 call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
diff --git a/Sources/AetherRaidSimulator.html b/Sources/AetherRaidSimulator.html
index 4ec593f6..eeb7f43d 100644
--- a/Sources/AetherRaidSimulator.html
+++ b/Sources/AetherRaidSimulator.html
@@ -1490,6 +1490,8 @@
                     "app/Main_ImageProcessing.js",
                     "app/Main_OriginalAi.js",
                     "app/Main_MouseAndTouch.js",
+                    "app/MapOperations.js",
+                    "app/SettingsPersistence.js",
                     "app/BattleSimulatorBase.js",
                     "pages/AetherRaidSimulatorMain.js",
                     "app/VueComponents.js",
diff --git a/Sources/ArenaSimulator.html b/Sources/ArenaSimulator.html
index d17c34fc..31c09d20 100644
--- a/Sources/ArenaSimulator.html
+++ b/Sources/ArenaSimulator.html
@@ -1460,6 +1460,8 @@
                     "app/Main_ImageProcessing.js",
                     "app/Main_OriginalAi.js",
                     "app/Main_MouseAndTouch.js",
+                    "app/MapOperations.js",
+                    "app/SettingsPersistence.js",
                     "app/BattleSimulatorBase.js",
                     "pages/ArenaSimulatorMain.js",
                     "app/VueComponents.js",
diff --git a/Sources/SummonerDuelsSimulator.html b/Sources/SummonerDuelsSimulator.html
index 85ea1fbb..4d044092 100644
--- a/Sources/SummonerDuelsSimulator.html
+++ b/Sources/SummonerDuelsSimulator.html
@@ -1552,6 +1552,8 @@
                     "app/Main_ImageProcessing.js",
                     "app/Main_OriginalAi.js",
                     "app/Main_MouseAndTouch.js",
+                    "app/MapOperations.js",
+                    "app/SettingsPersistence.js",
                     "app/BattleSimulatorBase.js",
                     "pages/SummonerDuelsSimulatorMain.js",
                     "app/VueComponents.js",
diff --git a/Sources/UnitBuilder.html b/Sources/UnitBuilder.html
index 483f7f1c..0983f975 100644
--- a/Sources/UnitBuilder.html
+++ b/Sources/UnitBuilder.html
@@ -1278,6 +1278,8 @@
                     "app/Main_ImageProcessing.js",
                     "app/Main_OriginalAi.js",
                     "app/Main_MouseAndTouch.js",
+                    "app/MapOperations.js",
+                    "app/SettingsPersistence.js",
                     "app/BattleSimulatorBase.js",
                     "pages/UnitBuilderMain.js",
                     "app/VueComponents.js",
diff --git a/Sources/app/BattleSimulatorBase.js b/Sources/app/BattleSimulatorBase.js
index 6b6a613f..5dfe043d 100644
--- a/Sources/app/BattleSimulatorBase.js
+++ b/Sources/app/BattleSimulatorBase.js
@@ -11677,631 +11677,3 @@ class BattleSimulatorBase {
         this.__applySnag4Skill(unit2, debuffFunc);
     }
 }
-
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-// ==========================================================================================
-
-const OwnerType = {
-    Map: 0,
-    DefenceStorage: 1,
-    OffenceStorage: 2,
-    TrashBox: 3,
-};
-
-let g_trashArea = new StructureContainer('trashArea');
-
-function removeTouchEventFromDraggableElements() {
-    let draggableItems = $(".draggable-elem");
-    for (let i = 0; i < draggableItems.length; ++i) {
-        let item = draggableItems[i];
-        item.removeEventListener('touchstart', touchStartEvent, { passive: false });
-        item.removeEventListener('touchmove', touchMoveEvent, { passive: false });
-        item.removeEventListener('touchend', touchEndEvent, { passive: true });
-    }
-}
-
-function addTouchEventToDraggableElements() {
-    // ドラッグ可能アイテムへのタッチイベントの設定
-    let draggableItems = $(".draggable-elem");
-    for (let i = 0; i < draggableItems.length; ++i) {
-        let item = draggableItems[i];
-        item.addEventListener('touchstart', touchStartEvent, { passive: false });
-        item.addEventListener('touchmove', touchMoveEvent, { passive: false });
-        item.addEventListener('touchend', touchEndEvent, { passive: true });
-    }
-}
-
-function moveStructureToMap(structure, x, y) {
-    let success = g_appData.map.exchangeObj(structure, Number(x), Number(y));
-    if (!success) {
-        success = g_appData.map.placeObj(structure, Number(x), Number(y));
-        if (!success) {
-            g_appData.map.placeObjToEmptyTile(structure);
-        }
-    }
-    g_deffenceStructureContainer.removeStructure(structure);
-    g_offenceStructureContainer.removeStructure(structure);
-    g_trashArea.removeStructure(structure);
-}
-
-function moveStructureToTrashBox(structure) {
-    removeFromAll(structure);
-    g_trashArea.addStructure(structure);
-}
-
-function moveStructureToDefenceStorage(structure) {
-    removeFromAll(structure);
-    g_deffenceStructureContainer.addStructure(structure);
-}
-
-function moveStructureToOffenceStorage(structure) {
-    removeFromAll(structure);
-    g_offenceStructureContainer.addStructure(structure);
-}
-
-function moveStructureToEmptyTileOfMap(structure, ignoresUnit = true) {
-    g_appData.map.placeObjToEmptyTile(structure, ignoresUnit);
-    g_trashArea.removeStructure(structure);
-    g_deffenceStructureContainer.removeStructure(structure);
-    g_offenceStructureContainer.removeStructure(structure);
-}
-
-function isMapTileId(id) {
-    return id.includes('_');
-}
-
-function removeFromAll(structure) {
-    g_appData.map.removeObj(structure);
-    g_appData.map.removeUnit(structure);
-    g_trashArea.removeStructure(structure);
-    g_deffenceStructureContainer.removeStructure(structure);
-    g_offenceStructureContainer.removeStructure(structure);
-}
-
-function moveUnitToTrashBox(unit) {
-    // console.log(unit.getNameWithGroup() + "を使用済みへ移動");
-    removeFromAll(unit);
-    g_trashArea.addStructure(unit);
-    unit.ownerType = OwnerType.TrashBox;
-}
-
-function moveUnitToMap(unit, x, y, endsActionIfActivateTrap = false, executesTrap = true) {
-    let moveResult = placeUnitToMap(unit, x, y, endsActionIfActivateTrap, executesTrap);
-    g_trashArea.removeStructure(unit);
-    return moveResult;
-}
-
-function moveUnitToEmptyTileOfMap(unit) {
-    let moveResult = placeUnitToMap(unit, 0, 0);
-    g_trashArea.removeStructure(unit);
-    return moveResult;
-}
-
-function moveUnit(unit, tile, endsActionIfActivateTrap = false, executesTrap = true) {
-    return moveUnitToMap(unit, tile.posX, tile.posY, endsActionIfActivateTrap, executesTrap);
-}
-
-function placeUnitToMap(unit, x, y, endsActionIfActivateTrap = false, executesTrap = true) {
-    g_appData.map.placeUnit(unit, x, y);
-    unit.ownerType = OwnerType.Map;
-
-    // updateAllUnitSpur();
-    if (unit.placedTile == null) {
-        console.error(`could not place unit to map (${x}, ${y})`);
-        console.log(unit);
-        return MoveResult.Failure;
-    }
-
-    if (executesTrap) {
-        return executeTrapIfPossible(unit, endsActionIfActivateTrap);
-    } else {
-        return MoveResult.Success;
-    }
-}
-/**
- * @param {Unit} unit
- * @param {boolean} endsActionIfActivateTrap
- * @returns {Number}
- */
-function executeTrapIfPossible(unit, endsActionIfActivateTrap = false) {
-    let tile = unit.placedTile;
-    let result = MoveResult.Success;
-    if (tile == null) {
-        return result;
-    }
-
-    let obj = tile.obj;
-
-    if (unit.groupId === UnitGroupType.Ally && obj instanceof TrapBase && !obj.isDisabled) {
-        // トラップ床発動
-        if (obj.isExecutable) {
-            let trapCondSatisfied = false;
-            switch (obj.constructor) {
-                case HeavyTrap:
-                case BoltTrap: {
-                    trapCondSatisfied = !DISARM_TRAP_SKILL_SET.has(unit.passiveB);
-                    break;
-                }
-                case HexTrap:
-                    trapCondSatisfied = unit.hp <= obj.level * 5 + 35 - (DISARM_HEX_TRAP_SKILL_SET.has(unit.passiveB) ? 10 : 0);
-                    break;
-            }
-            if (trapCondSatisfied) {
-                if (endsActionIfActivateTrap) {
-                    unit.endAction();
-                } else {
-                    if (obj instanceof HexTrap) {
-                        unit.endAction();
-                    }
-                }
-
-                g_app.audioManager.playSoundEffect(SoundEffectId.Trap);
-                g_app.executeStructure(obj);
-                if (obj instanceof HeavyTrap) {
-                    result = MoveResult.HeavyTrapActivated;
-                } else if (obj instanceof BoltTrap) {
-                    result = MoveResult.BoltTrapActivated;
-                } else if (obj instanceof HexTrap) {
-                    result = MoveResult.HexTrapActivated;
-                }
-            }
-        }
-
-        obj.isDisabled = true;
-    }
-    return result;
-}
-
-function moveToDefault(target) {
-    if (target instanceof BreakableWall) {
-        // todo: 面倒でなければマップ種類別の初期値に戻す
-    } else if (target instanceof OffenceStructureBase) {
-        if (target.isRequired) {
-            for (let x = 0; x < 6; ++x) {
-                let tile = g_appData.map.getTile(x, 7);
-                if (tile.isObjPlaceable()) {
-                    moveStructureToMap(target, x, 7);
-                    break;
-                }
-            }
-        }
-        else {
-            moveStructureToOffenceStorage(target);
-        }
-    } else if (target instanceof DefenceStructureBase) {
-        if (target.isRequired) {
-            for (let x = 0; x < 6; ++x) {
-                let tile = g_appData.map.getTile(x, 0);
-                if (tile.isObjPlaceable()) {
-                    moveStructureToMap(target, x, 0);
-                    break;
-                }
-            }
-        }
-        else {
-            moveStructureToDefenceStorage(target);
-        }
-    } else if (target instanceof Unit) {
-        moveUnitToEmptyTileOfMap(target);
-    }
-}
-
-function __getTileFromMapElement(item) {
-    if (item instanceof Unit || item instanceof StructureBase) {
-        return item.placedTile;
-    }
-    else if (item instanceof Tile) {
-        return item;
-    }
-    return null;
-}
-
-function __getUnselectedTileBgColor(tile) {
-    // 攻撃範囲など諸々込みの色を取得します。
-    let cell = new Cell();
-    g_appData.map.setCellStyle(tile, cell);
-    return cell.bgColor;
-}
-
-function __clearSelectedTileColor() {
-    for (let tile of g_appData.map.enumerateTiles()) {
-        updateCellBgColor(tile.posX, tile.posY, __getUnselectedTileBgColor(tile));
-    }
-}
-
-function syncSelectedTileColor() {
-    __clearSelectedTileColor();
-
-    for (let item of g_appData.enumerateItems()) {
-        if (item.isSelected) {
-            updateCellBgColor(item.posX, item.posY, SelectedTileColor);
-            if (item instanceof Unit) {
-                drawUnitRange(item, item.posX, item.posY);
-            }
-        }
-    }
-}
-
-function updateMapUi() {
-    let mapArea = document.getElementById('mapArea');
-    if (mapArea == null) {
-        return;
-    }
-
-    g_appData.map.updateTiles();
-    let table = g_appData.map.toTable(g_appData.globalBattleContext.currentPhaseType);
-    table.onDragOverEvent = "f_dragover(event)";
-    table.onDropEvent = "f_drop(event)";
-    table.onDragEndEvent = "table_dragend(event)";
-    if (isSummonerDuelsMap(g_appData.map._type)) {
-        // 得点エリアを表示
-        let scale = 4 / 10;
-        let verticalPercent = 100 * (1 / 2 + g_appData.globalBattleContext.summonerDuelsPointAreaOffset / 6);
-        let bgImageInfo = new BackgroundImageInfo(
-            g_summonerDuelsMapRoot + "SummonerDuels_PointArea.png",
-            `50% ${verticalPercent.toFixed()}%`,
-            `${(100 * 6 / 8).toFixed()}% ${(100 * scale).toFixed()}%`
-        );
-        table.backgroundImages.splice(0, 0, bgImageInfo);
-    }
-
-    // とりあえず海を後ろに表示しておく。海じゃないやつがあったらどうにかして分岐するか、マップ画像を加工する
-    {
-        let bgImageInfo = new BackgroundImageInfo(
-            g_corsImageRootPath + "Maps/WavePatternSea.png"
-        );
-        table.backgroundImages.push(bgImageInfo);
-    }
-
-    let tableElem = table.updateTableElement();
-    if (mapArea.childElementCount === 0) {
-        mapArea.appendChild(tableElem);
-    }
-    syncSelectedTileColor();
-}
-
-function updateMap() {
-    if (g_disableUpdateUi) {
-        return;
-    }
-
-    removeTouchEventFromDraggableElements();
-    updateMapUi();
-    addTouchEventToDraggableElements();
-}
-
-function changeMap() {
-    g_appData.syncMapKind();
-    updateMap();
-}
-
-function removeBreakableWallsFromTrashBox() {
-    for (let structure of g_appData.map.enumerateBreakableWalls()) {
-        moveStructureToEmptyTileOfMap(structure);
-    }
-}
-
-function createMap() {
-    resetPlacementOfStructures();
-    resetPlacementOfUnits();
-}
-
-function resetPlacementForArena() {
-    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
-        moveStructureToDefenceStorage(structure);
-    }
-    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
-        moveStructureToOffenceStorage(structure);
-    }
-
-    removeAllUnitsFromMap();
-
-    for (let obj of g_appData.map.enumerateBreakableWallsOfCurrentMapType()) {
-        moveStructureToMap(obj);
-    }
-
-    resetPlacementOfUnits();
-    g_appData.resetBattleMapPlacement(true);
-}
-
-function resetPlacementOfStructures() {
-    // 攻撃施設は大体毎回同じなのでリセットしない
-    // リセット位置が重なって不定になるのを防ぐために最初に取り除く
-    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
-        moveStructureToDefenceStorage(structure);
-    }
-
-    removeAllUnitsFromMap();
-
-    for (let obj of g_appData.map.enumerateBreakableWallsOfCurrentMapType()) {
-        moveStructureToMap(obj);
-    }
-
-    g_appData.resetBattleMapPlacement();
-
-    // 施設を施設置き場へ移動
-    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
-        moveToDefault(structure);
-    }
-
-    // 攻撃施設も必須のものがマップになければ配置する
-    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
-        if (!structure.isRequired) {
-            continue;
-        }
-
-        if (!g_appData.map.isObjAvailable(structure)) {
-            moveToDefault(structure);
-        }
-    }
-}
-
-function resetPlacementOfUnits() {
-    removeAllUnitsFromMap();
-
-    // 英雄を初期値に配置
-    {
-        let posX = 0;
-        let posY = 1;
-        if (g_appData.gameMode === GameMode.PawnsOfLoki) {
-            posY = 0;
-        }
-        for (let unit of g_app.enumerateEnemyUnits()) {
-            moveUnitToMap(unit, posX, posY);
-            ++posX;
-            if (posX === g_app.map.width) {
-                posX = 0;
-                ++posY;
-            }
-        }
-    }
-
-    {
-        let posX = 0;
-        let posY = g_app.map.height - 2;
-        let maxCount = 100;
-        if (g_appData.gameMode === GameMode.PawnsOfLoki) {
-            posY = g_app.map.height - 1;
-            maxCount = 8;
-        }
-
-        let count = 0;
-        for (let unit of g_app.enumerateAllyUnits()) {
-            if (count >= maxCount) {
-                moveUnitToTrashBox(unit);
-            }
-            else {
-                moveUnitToMap(unit, posX, posY);
-                ++posX;
-                if (posX === g_app.map.width) {
-                    posX = 0;
-                    --posY;
-                }
-            }
-
-            ++count;
-        }
-    }
-}
-
-function resetPlacement() {
-    g_appData.clearReservedSkillsForAllUnits();
-
-    switch (g_appData.gameMode) {
-        case GameMode.AetherRaid:
-            resetPlacementOfStructures();
-            resetPlacementOfUnits();
-            break;
-        case GameMode.Arena:
-            resetPlacementForArena();
-            break;
-        case GameMode.ResonantBattles:
-            resetPlacementForArena();
-            break;
-        case GameMode.TempestTrials:
-            resetPlacementForArena();
-            break;
-        case GameMode.PawnsOfLoki:
-            resetPlacementForArena();
-            break;
-        case GameMode.SummonerDuels:
-            resetPlacementForArena();
-            break;
-    }
-    updateAllUi();
-}
-
-function removeAllObjsFromMap() {
-    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
-        moveStructureToDefenceStorage(structure);
-    }
-
-    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
-        moveStructureToOffenceStorage(structure);
-    }
-}
-
-function removeAllUnitsFromMap() {
-    for (let unit of g_app.enumerateAllUnits()) {
-        // console.log(`remove ${unit.id}`);
-        // moveUnitToTrashBox(unit);
-        removeFromAll(unit);
-    }
-}
-
-let g_disableUpdateUi = false;
-function updateAllUi() {
-    if (g_disableUpdateUi) {
-        return;
-    }
-
-    changeMap();
-    removeTouchEventFromDraggableElements();
-    g_offenceStructureContainer.updateUi();
-    g_deffenceStructureContainer.updateUi();
-    g_trashArea.updateUi();
-    updateMapUi();
-    addTouchEventToDraggableElements();
-    g_appData.__showStatusToAttackerInfo();
-}
-
-function __updateChaseTargetTilesForAllUnits() {
-    if (g_appData.currentTurn > 0) {
-        g_app.__updateChaseTargetTiles(g_appData.allyUnits);
-        g_app.__updateChaseTargetTiles(g_appData.enemyUnits);
-    }
-}
-
-function loadSettings() {
-    console.log("loading..");
-    console.log("current cookie:" + document.cookie);
-    let fromCookies = LocalStorageUtil.getBoolean('uses-cookie-for-storing-settings', false);
-    if (fromCookies) {
-        console.log('load settings from cookies');
-    } else {
-        console.log('load settings from local storage');
-    }
-    g_appData.settings.loadSettings(fromCookies);
-    if (g_appData.gameMode === GameMode.ResonantBattles) {
-        g_app.__setUnitsForResonantBattles();
-    }
-    g_app.updateAllUnitSpur();
-
-    let turnText = g_appData.currentTurn === 0 ? "戦闘開始前" : "ターン" + g_appData.currentTurn;
-    g_app.writeSimpleLogLine(`<div class="log-action-header">${turnText}の設定を読み込みました。</div>`);
-    g_appData.commandQueuePerAction.clear();
-    __updateChaseTargetTilesForAllUnits();
-    updateAllUi();
-    g_app.enumerateAllUnits().forEach(unit => unit.resetMaxSpecialCount());
-}
-
-function loadSettingsFromDict(
-    settingDict,
-    loadsAllySettings = true,
-    loadsEnemySettings = true,
-    loadsOffenceSettings = true,
-    loadsDefenceSettings = true,
-    loadsMapSettings = false,
-    clearsAllFirst = true,
-    updatesChaseTarget = true,
-) {
-    g_appData.settings.loadSettingsFromDict(settingDict,
-        loadsAllySettings,
-        loadsEnemySettings,
-        loadsOffenceSettings,
-        loadsDefenceSettings,
-        loadsMapSettings,
-        clearsAllFirst);
-    g_app.updateAllUnitSpur();
-    if (updatesChaseTarget) {
-        __updateChaseTargetTilesForAllUnits();
-    }
-}
-
-function saveSettings() {
-    console.log("saving..");
-    let toCookie = LocalStorageUtil.getBoolean('uses-cookie-for-storing-settings', false);
-    if (toCookie) {
-        console.log('save settings to cookies');
-    } else {
-        console.log('save settings to local storage');
-    }
-    g_appData.settings.saveSettings(toCookie);
-    console.log("current cookie:" + document.cookie);
-    g_app.writeSimpleLogLine(`<div class="log-action-header">ターン${g_appData.currentTurn}の設定を保存しました。</div>`);
-}
-
-function exportPerTurnSettingAsString(
-    loadsAllies = true, loadsEnemies = true, loadsOffenceStructures = true, loadsDefenseStructures = true
-) {
-    let turnSetting = g_appData.settings.convertToPerTurnSetting(loadsAllies, loadsEnemies, loadsOffenceStructures, loadsDefenseStructures);
-    return turnSetting.perTurnStatusToString();
-}
-
-function importPerTurnSetting(perTurnSettingAsString, updatesChaseTarget = true) {
-    let currentTurn = g_appData.currentTurn;
-    let turnSetting = new TurnSetting(currentTurn);
-    let dict = {};
-    dict[turnSetting.serialId] = perTurnSettingAsString;
-    loadSettingsFromDict(dict, true, true, true, true, true, false, updatesChaseTarget);
-}
-
-function importSettingsFromString(
-    inputText,
-    loadsAllySettings = true,
-    loadsEnemySettings = true,
-    loadsOffenceSettings = true,
-    loadsDefenceSettings = true,
-    loadsMapSettings = false,
-    compressMode = null
-) {
-    console.log("loadsAllySettings = " + loadsAllySettings);
-    console.log("loadsEnemySettings = " + loadsEnemySettings);
-
-    let decompressed = compressMode == null ?
-        g_appData.decompressSettingAutomatically(inputText) :
-        g_appData.decompressSettingByCompressMode(inputText, compressMode);
-    console.log(`decompressed: ${decompressed}`);
-    let settings = decompressed.split(';');
-    let dict = {};
-    let currentTurn = g_appData.currentTurn;
-    let turnSetting = new TurnSetting(currentTurn);
-    for (let setting of settings) {
-        let idAndValue = setting.split('=');
-        let id = idAndValue[0];
-        if (id.startsWith(TurnSettingCookiePrefix)) {
-            // 他のターンの設定だった場合、現在のターンに置き換える
-            id = turnSetting.serialId;
-        }
-
-        dict[id] = setting.substring(idAndValue[0].length + 1).trim();
-    }
-    loadSettingsFromDict(
-        dict,
-        loadsAllySettings,
-        loadsEnemySettings,
-        loadsOffenceSettings,
-        loadsDefenceSettings,
-        loadsMapSettings
-    );
-}
diff --git a/Sources/app/MapOperations.js b/Sources/app/MapOperations.js
new file mode 100644
index 00000000..f10a512f
--- /dev/null
+++ b/Sources/app/MapOperations.js
@@ -0,0 +1,474 @@
+/// @file
+/// @brief マップ操作・UI更新・タッチイベント・配置リセットの自由関数群。
+/// BattleSimulatorBase.jsから分離。
+
+const OwnerType = {
+    Map: 0,
+    DefenceStorage: 1,
+    OffenceStorage: 2,
+    TrashBox: 3,
+};
+
+let g_trashArea = new StructureContainer('trashArea');
+
+function removeTouchEventFromDraggableElements() {
+    let draggableItems = $(".draggable-elem");
+    for (let i = 0; i < draggableItems.length; ++i) {
+        let item = draggableItems[i];
+        item.removeEventListener('touchstart', touchStartEvent, { passive: false });
+        item.removeEventListener('touchmove', touchMoveEvent, { passive: false });
+        item.removeEventListener('touchend', touchEndEvent, { passive: true });
+    }
+}
+
+function addTouchEventToDraggableElements() {
+    // ドラッグ可能アイテムへのタッチイベントの設定
+    let draggableItems = $(".draggable-elem");
+    for (let i = 0; i < draggableItems.length; ++i) {
+        let item = draggableItems[i];
+        item.addEventListener('touchstart', touchStartEvent, { passive: false });
+        item.addEventListener('touchmove', touchMoveEvent, { passive: false });
+        item.addEventListener('touchend', touchEndEvent, { passive: true });
+    }
+}
+
+function moveStructureToMap(structure, x, y) {
+    let success = g_appData.map.exchangeObj(structure, Number(x), Number(y));
+    if (!success) {
+        success = g_appData.map.placeObj(structure, Number(x), Number(y));
+        if (!success) {
+            g_appData.map.placeObjToEmptyTile(structure);
+        }
+    }
+    g_deffenceStructureContainer.removeStructure(structure);
+    g_offenceStructureContainer.removeStructure(structure);
+    g_trashArea.removeStructure(structure);
+}
+
+function moveStructureToTrashBox(structure) {
+    removeFromAll(structure);
+    g_trashArea.addStructure(structure);
+}
+
+function moveStructureToDefenceStorage(structure) {
+    removeFromAll(structure);
+    g_deffenceStructureContainer.addStructure(structure);
+}
+
+function moveStructureToOffenceStorage(structure) {
+    removeFromAll(structure);
+    g_offenceStructureContainer.addStructure(structure);
+}
+
+function moveStructureToEmptyTileOfMap(structure, ignoresUnit = true) {
+    g_appData.map.placeObjToEmptyTile(structure, ignoresUnit);
+    g_trashArea.removeStructure(structure);
+    g_deffenceStructureContainer.removeStructure(structure);
+    g_offenceStructureContainer.removeStructure(structure);
+}
+
+function isMapTileId(id) {
+    return id.includes('_');
+}
+
+function removeFromAll(structure) {
+    g_appData.map.removeObj(structure);
+    g_appData.map.removeUnit(structure);
+    g_trashArea.removeStructure(structure);
+    g_deffenceStructureContainer.removeStructure(structure);
+    g_offenceStructureContainer.removeStructure(structure);
+}
+
+function moveUnitToTrashBox(unit) {
+    // console.log(unit.getNameWithGroup() + "を使用済みへ移動");
+    removeFromAll(unit);
+    g_trashArea.addStructure(unit);
+    unit.ownerType = OwnerType.TrashBox;
+}
+
+function moveUnitToMap(unit, x, y, endsActionIfActivateTrap = false, executesTrap = true) {
+    let moveResult = placeUnitToMap(unit, x, y, endsActionIfActivateTrap, executesTrap);
+    g_trashArea.removeStructure(unit);
+    return moveResult;
+}
+
+function moveUnitToEmptyTileOfMap(unit) {
+    let moveResult = placeUnitToMap(unit, 0, 0);
+    g_trashArea.removeStructure(unit);
+    return moveResult;
+}
+
+function moveUnit(unit, tile, endsActionIfActivateTrap = false, executesTrap = true) {
+    return moveUnitToMap(unit, tile.posX, tile.posY, endsActionIfActivateTrap, executesTrap);
+}
+
+function placeUnitToMap(unit, x, y, endsActionIfActivateTrap = false, executesTrap = true) {
+    g_appData.map.placeUnit(unit, x, y);
+    unit.ownerType = OwnerType.Map;
+
+    // updateAllUnitSpur();
+    if (unit.placedTile == null) {
+        console.error(`could not place unit to map (${x}, ${y})`);
+        console.log(unit);
+        return MoveResult.Failure;
+    }
+
+    if (executesTrap) {
+        return executeTrapIfPossible(unit, endsActionIfActivateTrap);
+    } else {
+        return MoveResult.Success;
+    }
+}
+/**
+ * @param {Unit} unit
+ * @param {boolean} endsActionIfActivateTrap
+ * @returns {Number}
+ */
+function executeTrapIfPossible(unit, endsActionIfActivateTrap = false) {
+    let tile = unit.placedTile;
+    let result = MoveResult.Success;
+    if (tile == null) {
+        return result;
+    }
+
+    let obj = tile.obj;
+
+    if (unit.groupId === UnitGroupType.Ally && obj instanceof TrapBase && !obj.isDisabled) {
+        // トラップ床発動
+        if (obj.isExecutable) {
+            let trapCondSatisfied = false;
+            switch (obj.constructor) {
+                case HeavyTrap:
+                case BoltTrap: {
+                    trapCondSatisfied = !DISARM_TRAP_SKILL_SET.has(unit.passiveB);
+                    break;
+                }
+                case HexTrap:
+                    trapCondSatisfied = unit.hp <= obj.level * 5 + 35 - (DISARM_HEX_TRAP_SKILL_SET.has(unit.passiveB) ? 10 : 0);
+                    break;
+            }
+            if (trapCondSatisfied) {
+                if (endsActionIfActivateTrap) {
+                    unit.endAction();
+                } else {
+                    if (obj instanceof HexTrap) {
+                        unit.endAction();
+                    }
+                }
+
+                g_app.audioManager.playSoundEffect(SoundEffectId.Trap);
+                g_app.executeStructure(obj);
+                if (obj instanceof HeavyTrap) {
+                    result = MoveResult.HeavyTrapActivated;
+                } else if (obj instanceof BoltTrap) {
+                    result = MoveResult.BoltTrapActivated;
+                } else if (obj instanceof HexTrap) {
+                    result = MoveResult.HexTrapActivated;
+                }
+            }
+        }
+
+        obj.isDisabled = true;
+    }
+    return result;
+}
+
+function moveToDefault(target) {
+    if (target instanceof BreakableWall) {
+        // todo: 面倒でなければマップ種類別の初期値に戻す
+    } else if (target instanceof OffenceStructureBase) {
+        if (target.isRequired) {
+            for (let x = 0; x < 6; ++x) {
+                let tile = g_appData.map.getTile(x, 7);
+                if (tile.isObjPlaceable()) {
+                    moveStructureToMap(target, x, 7);
+                    break;
+                }
+            }
+        }
+        else {
+            moveStructureToOffenceStorage(target);
+        }
+    } else if (target instanceof DefenceStructureBase) {
+        if (target.isRequired) {
+            for (let x = 0; x < 6; ++x) {
+                let tile = g_appData.map.getTile(x, 0);
+                if (tile.isObjPlaceable()) {
+                    moveStructureToMap(target, x, 0);
+                    break;
+                }
+            }
+        }
+        else {
+            moveStructureToDefenceStorage(target);
+        }
+    } else if (target instanceof Unit) {
+        moveUnitToEmptyTileOfMap(target);
+    }
+}
+
+function __getTileFromMapElement(item) {
+    if (item instanceof Unit || item instanceof StructureBase) {
+        return item.placedTile;
+    }
+    else if (item instanceof Tile) {
+        return item;
+    }
+    return null;
+}
+
+function __getUnselectedTileBgColor(tile) {
+    // 攻撃範囲など諸々込みの色を取得します。
+    let cell = new Cell();
+    g_appData.map.setCellStyle(tile, cell);
+    return cell.bgColor;
+}
+
+function __clearSelectedTileColor() {
+    for (let tile of g_appData.map.enumerateTiles()) {
+        updateCellBgColor(tile.posX, tile.posY, __getUnselectedTileBgColor(tile));
+    }
+}
+
+function syncSelectedTileColor() {
+    __clearSelectedTileColor();
+
+    for (let item of g_appData.enumerateItems()) {
+        if (item.isSelected) {
+            updateCellBgColor(item.posX, item.posY, SelectedTileColor);
+            if (item instanceof Unit) {
+                drawUnitRange(item, item.posX, item.posY);
+            }
+        }
+    }
+}
+
+function updateMapUi() {
+    let mapArea = document.getElementById('mapArea');
+    if (mapArea == null) {
+        return;
+    }
+
+    g_appData.map.updateTiles();
+    let table = g_appData.map.toTable(g_appData.globalBattleContext.currentPhaseType);
+    table.onDragOverEvent = "f_dragover(event)";
+    table.onDropEvent = "f_drop(event)";
+    table.onDragEndEvent = "table_dragend(event)";
+    if (isSummonerDuelsMap(g_appData.map._type)) {
+        // 得点エリアを表示
+        let scale = 4 / 10;
+        let verticalPercent = 100 * (1 / 2 + g_appData.globalBattleContext.summonerDuelsPointAreaOffset / 6);
+        let bgImageInfo = new BackgroundImageInfo(
+            g_summonerDuelsMapRoot + "SummonerDuels_PointArea.png",
+            `50% ${verticalPercent.toFixed()}%`,
+            `${(100 * 6 / 8).toFixed()}% ${(100 * scale).toFixed()}%`
+        );
+        table.backgroundImages.splice(0, 0, bgImageInfo);
+    }
+
+    // とりあえず海を後ろに表示しておく。海じゃないやつがあったらどうにかして分岐するか、マップ画像を加工する
+    {
+        let bgImageInfo = new BackgroundImageInfo(
+            g_corsImageRootPath + "Maps/WavePatternSea.png"
+        );
+        table.backgroundImages.push(bgImageInfo);
+    }
+
+    let tableElem = table.updateTableElement();
+    if (mapArea.childElementCount === 0) {
+        mapArea.appendChild(tableElem);
+    }
+    syncSelectedTileColor();
+}
+
+function updateMap() {
+    if (g_disableUpdateUi) {
+        return;
+    }
+
+    removeTouchEventFromDraggableElements();
+    updateMapUi();
+    addTouchEventToDraggableElements();
+}
+
+function changeMap() {
+    g_appData.syncMapKind();
+    updateMap();
+}
+
+function removeBreakableWallsFromTrashBox() {
+    for (let structure of g_appData.map.enumerateBreakableWalls()) {
+        moveStructureToEmptyTileOfMap(structure);
+    }
+}
+
+function createMap() {
+    resetPlacementOfStructures();
+    resetPlacementOfUnits();
+}
+
+function resetPlacementForArena() {
+    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
+        moveStructureToDefenceStorage(structure);
+    }
+    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
+        moveStructureToOffenceStorage(structure);
+    }
+
+    removeAllUnitsFromMap();
+
+    for (let obj of g_appData.map.enumerateBreakableWallsOfCurrentMapType()) {
+        moveStructureToMap(obj);
+    }
+
+    resetPlacementOfUnits();
+    g_appData.resetBattleMapPlacement(true);
+}
+
+function resetPlacementOfStructures() {
+    // 攻撃施設は大体毎回同じなのでリセットしない
+    // リセット位置が重なって不定になるのを防ぐために最初に取り除く
+    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
+        moveStructureToDefenceStorage(structure);
+    }
+
+    removeAllUnitsFromMap();
+
+    for (let obj of g_appData.map.enumerateBreakableWallsOfCurrentMapType()) {
+        moveStructureToMap(obj);
+    }
+
+    g_appData.resetBattleMapPlacement();
+
+    // 施設を施設置き場へ移動
+    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
+        moveToDefault(structure);
+    }
+
+    // 攻撃施設も必須のものがマップになければ配置する
+    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
+        if (!structure.isRequired) {
+            continue;
+        }
+
+        if (!g_appData.map.isObjAvailable(structure)) {
+            moveToDefault(structure);
+        }
+    }
+}
+
+function resetPlacementOfUnits() {
+    removeAllUnitsFromMap();
+
+    // 英雄を初期値に配置
+    {
+        let posX = 0;
+        let posY = 1;
+        if (g_appData.gameMode === GameMode.PawnsOfLoki) {
+            posY = 0;
+        }
+        for (let unit of g_app.enumerateEnemyUnits()) {
+            moveUnitToMap(unit, posX, posY);
+            ++posX;
+            if (posX === g_app.map.width) {
+                posX = 0;
+                ++posY;
+            }
+        }
+    }
+
+    {
+        let posX = 0;
+        let posY = g_app.map.height - 2;
+        let maxCount = 100;
+        if (g_appData.gameMode === GameMode.PawnsOfLoki) {
+            posY = g_app.map.height - 1;
+            maxCount = 8;
+        }
+
+        let count = 0;
+        for (let unit of g_app.enumerateAllyUnits()) {
+            if (count >= maxCount) {
+                moveUnitToTrashBox(unit);
+            }
+            else {
+                moveUnitToMap(unit, posX, posY);
+                ++posX;
+                if (posX === g_app.map.width) {
+                    posX = 0;
+                    --posY;
+                }
+            }
+
+            ++count;
+        }
+    }
+}
+
+function resetPlacement() {
+    g_appData.clearReservedSkillsForAllUnits();
+
+    switch (g_appData.gameMode) {
+        case GameMode.AetherRaid:
+            resetPlacementOfStructures();
+            resetPlacementOfUnits();
+            break;
+        case GameMode.Arena:
+            resetPlacementForArena();
+            break;
+        case GameMode.ResonantBattles:
+            resetPlacementForArena();
+            break;
+        case GameMode.TempestTrials:
+            resetPlacementForArena();
+            break;
+        case GameMode.PawnsOfLoki:
+            resetPlacementForArena();
+            break;
+        case GameMode.SummonerDuels:
+            resetPlacementForArena();
+            break;
+    }
+    updateAllUi();
+}
+
+function removeAllObjsFromMap() {
+    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
+        moveStructureToDefenceStorage(structure);
+    }
+
+    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
+        moveStructureToOffenceStorage(structure);
+    }
+}
+
+function removeAllUnitsFromMap() {
+    for (let unit of g_app.enumerateAllUnits()) {
+        // console.log(`remove ${unit.id}`);
+        // moveUnitToTrashBox(unit);
+        removeFromAll(unit);
+    }
+}
+
+let g_disableUpdateUi = false;
+function updateAllUi() {
+    if (g_disableUpdateUi) {
+        return;
+    }
+
+    changeMap();
+    removeTouchEventFromDraggableElements();
+    g_offenceStructureContainer.updateUi();
+    g_deffenceStructureContainer.updateUi();
+    g_trashArea.updateUi();
+    updateMapUi();
+    addTouchEventToDraggableElements();
+    g_appData.__showStatusToAttackerInfo();
+}
+
+function __updateChaseTargetTilesForAllUnits() {
+    if (g_appData.currentTurn > 0) {
+        g_app.__updateChaseTargetTiles(g_appData.allyUnits);
+        g_app.__updateChaseTargetTiles(g_appData.enemyUnits);
+    }
+}
diff --git a/Sources/app/SettingsPersistence.js b/Sources/app/SettingsPersistence.js
new file mode 100644
index 00000000..f702ac53
--- /dev/null
+++ b/Sources/app/SettingsPersistence.js
@@ -0,0 +1,117 @@
+/// @file
+/// @brief 設定のセーブ/ロード/インポート/エクスポートの自由関数群。
+/// BattleSimulatorBase.jsから分離。
+
+function loadSettings() {
+    console.log("loading..");
+    console.log("current cookie:" + document.cookie);
+    let fromCookies = LocalStorageUtil.getBoolean('uses-cookie-for-storing-settings', false);
+    if (fromCookies) {
+        console.log('load settings from cookies');
+    } else {
+        console.log('load settings from local storage');
+    }
+    g_appData.settings.loadSettings(fromCookies);
+    if (g_appData.gameMode === GameMode.ResonantBattles) {
+        g_app.__setUnitsForResonantBattles();
+    }
+    g_app.updateAllUnitSpur();
+
+    let turnText = g_appData.currentTurn === 0 ? "戦闘開始前" : "ターン" + g_appData.currentTurn;
+    g_app.writeSimpleLogLine(`<div class="log-action-header">${turnText}の設定を読み込みました。</div>`);
+    g_appData.commandQueuePerAction.clear();
+    __updateChaseTargetTilesForAllUnits();
+    updateAllUi();
+    g_app.enumerateAllUnits().forEach(unit => unit.resetMaxSpecialCount());
+}
+
+function loadSettingsFromDict(
+    settingDict,
+    loadsAllySettings = true,
+    loadsEnemySettings = true,
+    loadsOffenceSettings = true,
+    loadsDefenceSettings = true,
+    loadsMapSettings = false,
+    clearsAllFirst = true,
+    updatesChaseTarget = true,
+) {
+    g_appData.settings.loadSettingsFromDict(settingDict,
+        loadsAllySettings,
+        loadsEnemySettings,
+        loadsOffenceSettings,
+        loadsDefenceSettings,
+        loadsMapSettings,
+        clearsAllFirst);
+    g_app.updateAllUnitSpur();
+    if (updatesChaseTarget) {
+        __updateChaseTargetTilesForAllUnits();
+    }
+}
+
+function saveSettings() {
+    console.log("saving..");
+    let toCookie = LocalStorageUtil.getBoolean('uses-cookie-for-storing-settings', false);
+    if (toCookie) {
+        console.log('save settings to cookies');
+    } else {
+        console.log('save settings to local storage');
+    }
+    g_appData.settings.saveSettings(toCookie);
+    console.log("current cookie:" + document.cookie);
+    g_app.writeSimpleLogLine(`<div class="log-action-header">ターン${g_appData.currentTurn}の設定を保存しました。</div>`);
+}
+
+function exportPerTurnSettingAsString(
+    loadsAllies = true, loadsEnemies = true, loadsOffenceStructures = true, loadsDefenseStructures = true
+) {
+    let turnSetting = g_appData.settings.convertToPerTurnSetting(loadsAllies, loadsEnemies, loadsOffenceStructures, loadsDefenseStructures);
+    return turnSetting.perTurnStatusToString();
+}
+
+function importPerTurnSetting(perTurnSettingAsString, updatesChaseTarget = true) {
+    let currentTurn = g_appData.currentTurn;
+    let turnSetting = new TurnSetting(currentTurn);
+    let dict = {};
+    dict[turnSetting.serialId] = perTurnSettingAsString;
+    loadSettingsFromDict(dict, true, true, true, true, true, false, updatesChaseTarget);
+}
+
+function importSettingsFromString(
+    inputText,
+    loadsAllySettings = true,
+    loadsEnemySettings = true,
+    loadsOffenceSettings = true,
+    loadsDefenceSettings = true,
+    loadsMapSettings = false,
+    compressMode = null
+) {
+    console.log("loadsAllySettings = " + loadsAllySettings);
+    console.log("loadsEnemySettings = " + loadsEnemySettings);
+
+    let decompressed = compressMode == null ?
+        g_appData.decompressSettingAutomatically(inputText) :
+        g_appData.decompressSettingByCompressMode(inputText, compressMode);
+    console.log(`decompressed: ${decompressed}`);
+    let settings = decompressed.split(';');
+    let dict = {};
+    let currentTurn = g_appData.currentTurn;
+    let turnSetting = new TurnSetting(currentTurn);
+    for (let setting of settings) {
+        let idAndValue = setting.split('=');
+        let id = idAndValue[0];
+        if (id.startsWith(TurnSettingCookiePrefix)) {
+            // 他のターンの設定だった場合、現在のターンに置き換える
+            id = turnSetting.serialId;
+        }
+
+        dict[id] = setting.substring(idAndValue[0].length + 1).trim();
+    }
+    loadSettingsFromDict(
+        dict,
+        loadsAllySettings,
+        loadsEnemySettings,
+        loadsOffenceSettings,
+        loadsDefenceSettings,
+        loadsMapSettings
+    );
+}
diff --git a/docs/planning/esm-migration/implementation/deep_implement_config.json b/docs/planning/esm-migration/implementation/deep_implement_config.json
index 73498fcf..4b4d4dc0 100644
--- a/docs/planning/esm-migration/implementation/deep_implement_config.json
+++ b/docs/planning/esm-migration/implementation/deep_implement_config.json
@@ -31,6 +31,10 @@
     "section-04-directory-design": {
       "status": "complete",
       "commit_hash": "4f1c4379"
+    },
+    "section-05-file-relocation": {
+      "status": "complete",
+      "commit_hash": "f3bdc5ba423206cf3448f522a66d6f80344816e5"
     }
   },
   "pre_commit": {
