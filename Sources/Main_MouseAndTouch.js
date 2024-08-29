/// @file
/// @brief シミュレーターのマウスやタッチイベントの実装です。

class DoubleClickChecker {
    constructor() {
        this._firstClickTime = 0;
        this._diffMillisec = 0;
    }

    notifyClick() {
        let time = Date.now();
        this._diffMillisec = time - this._firstClickTime;
        this._firstClickTime = time;
    }

    isDoubleClicked() {
        const threshold = 300;
        return this._diffMillisec < threshold;
    }
}

const g_keyboardManager = new KeyboardManager();
let g_draggingElemId = "";
/** @type {Queue<Tile>} */
let g_dragoverTileHistory = new Queue(10);

let g_doubleClickChecker = new DoubleClickChecker();

function selectItemById(id, add = false, toggle = false) {
    if (toggle) {
        g_app.selectItemToggle(id);
    }
    else {
        g_app.selectItem(id, add);
    }

    // 選択アイテムのタイルを更新
    syncSelectedTileColor();
}

function findParentTdElement(elem) {
    let currentNode = elem;
    while (currentNode != null && currentNode.nodeName != "TD") {
        currentNode = currentNode.parentElement;
    }
    return currentNode;
}

function __selectItemById(id) {
    if (g_keyboardManager.isShiftKeyPressing) {
        selectItemById(id, true, false);
    }
    else if (g_keyboardManager.isControlKeyPressing) {
        selectItemById(id, false, true);
    }
    else {
        selectItemById(id);
    }
}

function onItemSelected(event) {
    console.log("onItemSelected");
    g_doubleClickChecker.notifyClick();

    let targetElem = event.target;
    if (targetElem.id == undefined || targetElem.id == "") {
        let tdElem = findParentTdElement(targetElem);
        if (tdElem != null) {
            // タイルが選択された
            __selectItemById(tdElem.id);
        }
    }
    else {
        __selectItemById(targetElem.id);
    }

    if (g_doubleClickChecker.isDoubleClicked()) {
        for (let unit of g_appData.enumerateSelectedItems(x => x instanceof Unit && !x.isActionDone)) {
            g_app.executeEndActionCommand(unit);
        }
        updateAllUi();
    }
}

function onMouseDown(event) {
    g_app.showItemInfo(event.target.id);
    g_appData.selectCurrentItem();
}

/***** ドラッグ開始時の処理 *****/
function f_dragstart(event) {
    //ドラッグするデータのid名をDataTransferオブジェクトにセット
    event.dataTransfer.setData("text", event.target.id);
    g_draggingElemId = event.target.id;
    g_dragoverTileHistory.clear();
}

/***** ドラッグ要素がドロップ要素に重なっている間の処理 *****/
function f_dragover(event) {
    //dragoverイベントをキャンセルして、ドロップ先の要素がドロップを受け付けるようにする
    let dropTargetId = event.currentTarget.id;
    if (dropTargetId.includes('_')) {
        let pos = getPositionFromCellId(dropTargetId);
        dragoverImpl(pos[0], pos[1]);
    }
    event.preventDefault();
}

function table_dragend(event) {
    let unit = g_app.findUnitById(g_draggingElemId);
    if (unit != null) {
        resetUnitAttackableRange(unit);
    }
}


/***** ドロップ時の処理 *****/
function f_drop(event) {
    //ドラッグされたデータのid名をDataTransferオブジェクトから取得
    let objId = event.dataTransfer.getData("text");
    let dropTargetId = event.currentTarget.id;

    dropEventImpl(objId, dropTargetId);

    //エラー回避のため、ドロップ処理の最後にdropイベントをキャンセルしておく
    event.preventDefault();
}

// タッチ開始イベント
function touchStartEvent(event) {
    let touch = event.changedTouches[0];

    // タッチによる画面スクロールを止める
    event.preventDefault();
    console.log("touchstart");

    onItemSelected(event);

    g_draggingElemId = event.target.id;
}

// タッチ移動イベント
function touchMoveEvent(event) {
    let touch = event.changedTouches[0];
    event.preventDefault();

    // ドラッグ中のアイテムをカーソルの位置に追従
    let draggedElem = event.target;

    // テーブルの中はセルのルート要素がposition:relativeになってるので、staticに変更して絶対座標で移動できるようにする
    if (draggedElem.parentElement != null) {
        if (draggedElem.parentElement.className == "cell-root") {
            draggedElem.parentElement.style.position = "static";
        }
        // console.log("touchmove: " + touch.pageX + ", " + touch.pageY);
        draggedElem.style.position = "absolute";
        draggedElem.style.top = (touch.pageY - draggedElem.offsetHeight / 2) + "px";
        draggedElem.style.left = (touch.pageX - draggedElem.offsetWidth / 2) + "px";

        let dropTargetId = findDropTargetElementId(touch, draggedElem);
        if (dropTargetId != null) {
            if (dropTargetId.includes('_')) {
                let pos = getPositionFromCellId(dropTargetId);
                dragoverImpl(pos[0], pos[1], draggedElem.id);
            }
        }
    }
}

function findDropTargetElementId(touch, droppedElem) {
    let dropTargetElems = document.elementsFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset);
    if (dropTargetElems != null) {
        for (let dropTargetElem of dropTargetElems) {
            if (dropTargetElem.className == "droppable-elem") {
                let dropTargetId = dropTargetElem.id;
                return dropTargetId;
            }
        }
    }
    return null;
}

// タッチ終了イベント
function touchEndEvent(event) {
    let touch = event.changedTouches[0];

    // event.preventDefault();

    // ドラッグ中の操作のために変更していたスタイルを元に戻す
    let droppedElem = event.target;
    if (droppedElem.parentElement != null && droppedElem.parentElement.className == "cell-root") {
        // セルからドラッグされた場合
        droppedElem.parentElement.style.position = "relative";
        droppedElem.style.position = "absolute";
        droppedElem.style.top = "0";
        droppedElem.style.left = "0";
    }
    else {
        // コンテナからドラッグされた場合
        droppedElem.style.position = "";
        droppedElem.style.top = "";
        droppedElem.style.left = "";
    }

    // console.log("touchend: " + touch.pageX + ", " + touch.pageY);
    let dropTargetId = findDropTargetElementId(touch, droppedElem);
    if (dropTargetId != null) {
        console.log(`droppedElem.id=${droppedElem.id}, dropTargetId=${dropTargetId}`);
        let trElem = document.getElementById(dropTargetId);
        if (trElem != null && trElem.childElementCount > 0) {
            let cellRoot = trElem.children[0];
            cellRoot.appendChild(droppedElem);
            dropEventImpl(droppedElem.id, dropTargetId);
        }
    }

    let unit = g_app.findUnitById(g_draggingElemId);
    if (unit != null) {
        resetUnitAttackableRange(unit);
    }
}

function findBestActionTile(targetTile, spaces) {
    for (let i = g_dragoverTileHistory.length - 1; i >= 0; --i) {
        let tile = g_dragoverTileHistory.data[i];
        let distance = tile.calculateDistance(targetTile);
        if (distance === spaces) {
            return tile;
        }
    }

    return null;
}

function dragoverImpl(overTilePx, overTilePy, draggingElemId = null) {
    try {
        let elemId = "";
        if (draggingElemId == null) {
            elemId = g_draggingElemId;
        }
        else {
            elemId = draggingElemId;
        }
        let unit = g_app.findUnitById(elemId);
        if (unit != null) {
            let targetTile = g_appData.map.getTile(overTilePx, overTilePy);
            if (targetTile != null) {
                dragoverImplForTargetTile(unit, targetTile);
            }

            if (g_appData.showMovableRangeWhenMovingUnit) {
                let currentTile = g_dragoverTileHistory.lastValue;
                const alpha = "a0";
                for (let tile of unit.attackableTiles) {
                    let color = "#feccc5";
                    color = "#ff8888" + alpha;
                    updateCellBgColor(tile.posX, tile.posY, color);
                }
                for (let tile of unit.movableTiles) {
                    let color = "#cbd6ee";
                    color = "#88aaff" + alpha;
                    if (tile === currentTile) {
                        color = "#8888ff" + alpha;
                    }
                    updateCellBgColor(tile.posX, tile.posY, color);
                }
                for (let tile of unit.teleportOnlyTiles) {
                    let color = "#cbd6ee";
                    color = "#aaccff" + alpha;
                    if (tile === currentTile) {
                        color = "#8888ff" + alpha;
                    }
                    updateCellBgColor(tile.posX, tile.posY, color);
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function dragoverImplForTargetTile(unit, targetTile) {
    g_app.clearDamageCalcSummary();

    if (targetTile.isUnitPlacable(unit)) {
        if (g_dragoverTileHistory.lastValue !== targetTile) {
            g_dragoverTileHistory.enqueue(targetTile);
        }
    } else {
        // ドロップ先に敵ユニットがいる場合はダメージ計算を行う
        let unitPlacedOnTargetTile = targetTile.placedUnit;
        if (unitPlacedOnTargetTile != null && unit.groupId !== unitPlacedOnTargetTile.groupId) {
            let attackTile = findBestActionTile(targetTile, unit.attackRange);
            // TODO: 応急処置なのできちんと修正する
            if (attackTile === null) {
                attackTile = unit.placedTile;
                unit.fromPosX = attackTile.posX;
                unit.fromPosY = attackTile.posY;
            }
            g_app.showDamageCalcSummary(unit, unitPlacedOnTargetTile, attackTile);
        }
    }
}

function getBestActionTile(unit, targetTile, spaces) {
    let moveTile = findBestActionTile(targetTile, spaces);
    if (moveTile == null) {
        // マウスオーバーした座標から決められなかった場合はユニットから一番近い攻撃可能なタイル
        let tiles = g_appData.map.enumerateTilesInSpecifiedDistanceFrom(targetTile, spaces);
        let isNotAnotherUnit = tile => !(tile.placedUnit != null && tile.placedUnit !== unit);
        let distFunc = t => t.calculateDistanceToUnit(unit);
        /** @type {Tile} */
        moveTile = IterUtil.minElement(GeneratorUtil.filter(tiles, isNotAnotherUnit), distFunc);
        let minDist = unit.moveCount + 1;
        if (moveTile !== null && moveTile.calculateDistanceToUnit(unit) >= minDist) {
            moveTile = null;
        }
    }

    if (moveTile == null) {
        return null;
    }

    return moveTile;
}


function moveToBestActionTile(unit, targetTile, spaces) {
    let moveTile = getBestActionTile(unit, targetTile, spaces);
    if (moveTile == null) {
        return MoveResult.Failure;
    }

    g_app.__enqueueMoveCommand(unit, moveTile, true);
    return MoveResult.Success;
}

function examinesCanBreak(unit, obj, tile) {
    if (tile.hasEnemyBreakableDivineVein(unit.groupId)) {
        return true;
    }

    if (!obj.isBreakable) { return false }

    if (obj instanceof BreakableWall) {
        return true;
    }
    switch (unit.groupId) {
        case UnitGroupType.Ally:
            if (obj instanceof DefenceStructureBase) {
                return true;
            }
            return false;
        case UnitGroupType.Enemy:
            if (obj instanceof OffenceStructureBase) {
                return true;
            }
            return false;
    }
}

function resetUnitAttackableRange(unit) {
    for (let tile of unit.attackableTiles) {
        let cell = new Cell();
        g_appData.map.setCellStyle(tile, cell);
        updateCellBgColor(tile.posX, tile.posY, cell.bgColor);
    }
}

function dropToUnitImpl(unit, dropTargetId) {
    resetUnitAttackableRange(unit);
    // 武器なしの場合があるので移動可能タイルもリセット
    for (let tile of unit.movableTiles) {
        let cell = new Cell();
        g_appData.map.setCellStyle(tile, cell);
        updateCellBgColor(tile.posX, tile.posY, cell.bgColor);
    }

    if (isMapTileId(dropTargetId)) {
        // テーブルのセルにドロップされた
        let [x, y] = g_appData.map.getPosFromCellId(dropTargetId);
        let targetTile = g_appData.map.getTile(x, y);
        if (targetTile === unit.placedTile) {
            return;
        }

        let unitPlacedOnTargetTile = targetTile.placedUnit;
        let isActioned = false;
        let isDifferentGroup = unitPlacedOnTargetTile != null && unit.groupId !== unitPlacedOnTargetTile.groupId;
        let isSupportEnabled = !g_appData.isSupportActivationDisabled;
        if (isSupportEnabled && isDifferentGroup) {
            g_app.writeSimpleLogLine("attack!");
            // ドロップ先に敵ユニットがいる場合はダメージ計算を行う
            let bestTile = getBestActionTile(unit, targetTile, unit.attackRange);
            if (bestTile != null) {
                g_app.__enqueueAttackCommand(unit, unitPlacedOnTargetTile, bestTile);
                g_appData.isEnemyActionTriggered = true;
                unit.isEnemyActionTriggered = true;
                isActioned = true;
            }
        } else if (unitPlacedOnTargetTile != null) {
            // ドロップ先が味方なら補助スキル発動
            if (g_appData.isSupportActivationDisabled) {
                // 0ターン(配置変更)であれば入替え
                g_appData.map.moveUnit(unit, x, y);
                isActioned = true;
            } else {
                let supportRange = getAssistRange(unit.support);
                let bestTile = getBestActionTile(unit, targetTile, supportRange);
                if (bestTile != null) {
                    if (unit.supportInfo != null) {
                        let assistType = unit.supportInfo.assistType;
                        // TODO: 検証する。とりあえず応援として実装。
                        if (isRallyHealSkill(unit.support)) {
                            assistType = AssistType.Rally;
                        }
                        let isNotRally = assistType !== AssistType.Rally;
                        let isRally = assistType === AssistType.Rally;
                        let canRally =
                            unit.canRallyForcibly() ||
                            canRallyForciblyByPlayer(unit) ||
                            unit.canRallyTo(unitPlacedOnTargetTile, 1) ||
                            unitPlacedOnTargetTile.canRalliedForcibly();
                        let hasNotIsolation =
                            !unit.hasStatusEffect(StatusEffectType.Isolation) &&
                            !unitPlacedOnTargetTile.hasStatusEffect(StatusEffectType.Isolation);
                        let canApplyAssist = isNotRally || (isRally && canRally) && hasNotIsolation;
                        if (canApplyAssist) {
                            g_app.__enqueueSupportCommand(unit, bestTile, unitPlacedOnTargetTile);
                            isActioned = true;
                        }
                    }
                }
            }
        } else {
            if (targetTile.obj != null || targetTile.hasEnemyBreakableDivineVein(unit.groupId)) {
                let obj = targetTile.obj;
                if (examinesCanBreak(unit, obj, targetTile)) {
                    // 壊せる壁や施設を破壊
                    let tile = getBestActionTile(unit, targetTile, unit.attackRange);
                    if (tile != null) {
                        // 破壊対象が施設か天脈かでコマンドを分ける
                        if (targetTile.hasEnemyBreakableDivineVein(unit.groupId)) {
                            g_app.__enqueueBreakDivineVeinCommand(unit, tile, targetTile);
                        } else {
                            g_app.__enqueueBreakStructureCommand(unit, tile, targetTile);
                        }
                        isActioned = true;
                    }
                } else if (obj instanceof TrapBase) {
                    g_app.__enqueueMoveCommand(unit, targetTile, true);
                    isActioned = true;
                }
            } else {
                // 移動
                if (isSupportEnabled) {
                    if (targetTile !== unit.placedTile) {
                        g_app.__enqueueMoveCommand(unit, targetTile, true, CommandType.Normal, true);
                        isActioned = true;
                    }
                } else {
                    let moveResult = moveUnit(unit, targetTile, true);
                    isActioned = moveResult !== MoveResult.Failure;
                }
            }
        }

        g_app.executePerActionCommand();
        if (isActioned) {
            // g_app.deselectItem();
        }
    } else if (dropTargetId === "trashArea") {
        moveUnitToTrashBox(unit);
    }

    g_app.updateAllUnitSpur();
    updateAllUi();
}

function dropEventImpl(objId, dropTargetId) {
    // g_app.writeSimpleLogLine("dropEvent: dragObjId=" + objId + ", dropTargetId=" + dropTargetId);

    g_app.clearDamageCalcSummary();
    g_app.showItemInfo(objId);

    // ユニットのドロップ処理
    {
        let unit = g_app.findUnitById(objId);
        if (unit != null) {
            dropToUnitImpl(unit, dropTargetId);
        }
    }

    // 防衛施設のドロップ処理
    {
        let structure = g_appData.defenseStructureStorage.findById(objId);
        if (structure != null) {
            if (isMapTileId(dropTargetId)) {
                // テーブルのセルにドロップされた
                let xy = dropTargetId.split('_');
                let x = xy[0];
                let y = xy[1];
                moveStructureToMap(structure, x - g_appData.map.cellOffsetX, y);
            }
            else if (dropTargetId === "trashArea") {
                moveStructureToTrashBox(structure);
            }
            else {
                moveStructureToDefenceStorage(structure);
            }
            // UI の更新
            updateAllUi();
        }
    }

    // 攻撃施設のドロップ処理
    {
        let structure = g_appData.offenceStructureStorage.findById(objId);
        if (structure != null) {
            if (isMapTileId(dropTargetId)) {
                // テーブルのセルにドロップされた
                let xy = dropTargetId.split('_');
                let x = xy[0];
                let y = xy[1];
                moveStructureToMap(structure, x - g_appData.map.cellOffsetX, y);
            }
            else if (dropTargetId === "trashArea") {
                moveStructureToTrashBox(structure);
            }
            else {
                moveStructureToOffenceStorage(structure);
            }
            // UI の更新
            updateAllUi();
        }
    }

    // 壁のドロップ処理
    {
        let wall = g_appData.map.findWallOrBreakableWallById(objId);
        if (wall != null) {
            console.log("dropped breakable wall");
            if (isMapTileId(dropTargetId)) {
                // テーブルのセルにドロップされた
                let xy = dropTargetId.split('_');
                let x = xy[0];
                let y = xy[1];
                moveStructureToMap(wall, x - g_appData.map.cellOffsetX, y);
            }
            else if (dropTargetId === "trashArea") {
                moveStructureToTrashBox(wall);
            }
            // UI の更新
            updateAllUi();
        }
    }
}
