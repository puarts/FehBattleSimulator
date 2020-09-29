
// todo: ビューに依存してしまっているのでどうにかする
function changeCurrentUnitTab(tabIndex) {
    // $('.jquery .tabs li').removeClass('active').eq(tabIndex).addClass('active');
    if (tabIndex < 0) {
        $('.jquery .contents li').removeClass('active');
        return;
    }
    $('.jquery .contents li').removeClass('active').eq(tabIndex).addClass('active');

    // アイコン
    $('.weaponIcon').attr('src', g_imageRootPath + "Weapon.png");
    $('.supportIcon').attr('src', g_imageRootPath + "Support.png");
    $('.specialIcon').attr('src', g_imageRootPath + "Special.png");
    // $('.urlJumpIcon').attr('src', g_imageRootPath + "UrlJump.png");
}

let g_appData = new AppData();

/// シリアライズ可能なシミュレーターの設定を管理するクラスです。
class Setting {
    constructor() {
        this._cookieWriter = new CookieWriter();
    }

    __examineOwnerTypeOfUnit(unit) {
        if (g_appData.map.isUnitAvailable(unit)) {
            return OwnerType.Map;
        }
        else {
            return OwnerType.TrashBox;
        }
    }

    __examineOwnerTypeOfStructure(structure) {
        if (g_appData.map.isObjAvailable(structure)) {
            return OwnerType.Map;
        }
        if (g_deffenceStructureContainer.isAvailable(structure.id)) {
            return OwnerType.DefenceStorage;
        }
        if (g_offenceStructureContainer.isAvailable(structure.id)) {
            return OwnerType.OffenceStorage;
        }

        return OwnerType.TrashBox;
    }

    __writeSetting(setting) {
        let serializable = setting.toString();
        this._cookieWriter.write(setting.serialId, serializable);
    }

    __readSetting(setting) {
        let deserialized = this._cookieWriter.read(setting.serialId);
        if (deserialized == null) {
            return false;
        }

        setting.fromString(deserialized);
        return true;
    }

    __setSerialSettingToUnit(unit) {
        // console.log("saving unit (" + unit.name + ", " + unit.posX + ", " + unit.posY + ")");
        let heroIndex = g_appData.heroInfos.findIndexOfInfo(unit.name);
        if (heroIndex < 0) {
            console.error(unit.id + ' was not found in database.');
            return;
        }
        let ownerType = this.__examineOwnerTypeOfUnit(unit);
        unit.heroIndex = heroIndex;
        unit.ownerType = ownerType;
    }

    __setSerialSettingToStructure(structure) {
        let ownerType = this.__examineOwnerTypeOfStructure(structure);
        structure.ownerType = ownerType;
        switch (ownerType) {
            case OwnerType.Map:
            case OwnerType.TrashBox:
                return structure;
            case OwnerType.OffenceStorage:
            case OwnerType.DefenceStorage:
                // デフォルト位置なので保存する必要なし
                return null;
            default:
                return null;
        }
    }

    __setUnitFromSerialSetting(unit) {
        let evalUnit = unit.snapshot != null ? unit.snapshot : unit;
        switch (evalUnit.ownerType) {
            case OwnerType.Map:
                {
                    let posX = evalUnit.posX;
                    let posY = evalUnit.posY;
                    let targetTile = g_appData.map.getTile(posX, posY);
                    if (targetTile != null && targetTile.placedUnit != null) {
                        moveUnitToTrashBox(targetTile.placedUnit);
                    }

                    let success = g_appData.map.moveUnitForcibly(unit, posX, posY);
                    if (!success) {
                        unit.posX = -1;
                        unit.posY = -1;
                        moveUnitToMap(unit, posX, posY);
                    }
                    // console.log("move " + unit.id + " to (" + unit.posX + ", " + unit.posY + ")");
                }
                break;
            case OwnerType.TrashBox:
                {
                    // console.log("move " + unit.id + " to trash box");
                    moveUnitToTrashBox(unit);
                }
                break;
            default:
                throw new Error("unknown owner type of unit " + unit.ownerType);
        }
    }

    __findStructure(id) {
        let structure = g_appData.defenseStructureStorage.findById(id);
        if (structure != null) {
            return structure;
        }

        structure = g_appData.offenceStructureStorage.findById(id);
        return structure;
    }

    __setStructureFromSerialSetting(structure) {
        switch (structure.ownerType) {
            case OwnerType.Map:
                {
                    let posX = structure.posX;
                    let posY = structure.posY;
                    let targetTile = g_appData.map.getTile(posX, posY);
                    if (targetTile.isObjPlaceableByNature()) {
                        if (targetTile != null && targetTile.obj != null) {
                            moveStructureToTrashBox(targetTile.obj);
                        }
                        moveStructureToMap(structure, posX, posY);
                        console.log("move " + structure.id + " to (" + structure.posX + ", " + structure.posY + ")");
                    }
                }
                break;
            case OwnerType.DefenceStorage:
                moveStructureToDefenceStorage(structure);
                break;
            case OwnerType.OffenceStorage:
                moveStructureToOffenceStorage(structure);
                break;
            case OwnerType.TrashBox:
                moveStructureToTrashBox(structure);
                break;
            default:
                throw new Error("Unknown OwnerType " + structure.ownerType);
        }
    }

    convertToPerTurnSetting(
        loadsAllies = true,
        loadsEnemies = true,
        loadsOffenceStructures = true,
        loadsDefenseStructures = true,
        exportsMapSettings = false
    ) {
        let currentTurn = g_appData.currentTurn;
        let turnSetting = new TurnSetting(currentTurn);

        // ユニットの設定を保存
        if (loadsEnemies) {
            for (let unit of g_appData.enumerateEnemyUnits()) {
                this.__setSerialSettingToUnit(unit);
                turnSetting.pushUnit(unit);
            }
        }
        if (loadsAllies) {
            for (let unit of g_appData.enumerateAllyUnits()) {
                this.__setSerialSettingToUnit(unit);
                turnSetting.pushUnit(unit);
            }
        }

        // 防衛施設の設定
        if (loadsDefenseStructures) {
            turnSetting.setAppData(g_appData);
            // console.log("saving defense structures");
            for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
                let setting = this.__setSerialSettingToStructure(structure);
                if (setting != null) {
                    turnSetting.pushStructure(setting);
                }
            }

            // マップオブジェクトの設定
            // console.log("saving map objects");
            for (let structure of g_appData.map.enumerateBreakableWallsOfCurrentMapType()) {
                let setting = this.__setSerialSettingToStructure(structure);
                if (setting != null) {
                    turnSetting.pushStructure(setting);
                }
            }
        }

        // 攻撃施設の設定
        if (loadsOffenceStructures) {
            // console.log("saving offence structures");
            for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
                let setting = this.__setSerialSettingToStructure(structure);
                if (setting != null) {
                    turnSetting.pushStructure(setting);
                }
            }
        }

        if (exportsMapSettings) {
            for (let structure of g_appData.map.enumerateWallsOnMap()) {
                let setting = this.__setSerialSettingToStructure(structure);
                if (setting != null) {
                    turnSetting.pushStructure(setting);
                }
            }

            for (let tile of g_appData.map.enumerateTiles()) {
                turnSetting.pushTile(tile);
            }
        }

        return turnSetting;
    }

    convertCurrentSettingsToDict(
        loadsAllies = true,
        loadsEnemies = true,
        loadsOffenceStructures = true,
        loadsDefenseStructures = true,
        exportsMapSettings = false
    ) {
        let turnSetting = this.convertToPerTurnSetting(
            loadsAllies, loadsEnemies, loadsOffenceStructures, loadsDefenseStructures, exportsMapSettings);
        let result = {};
        result[TurnWideCookieId] = turnSetting.turnWideStatusToString();
        result[turnSetting.serialId] = turnSetting.perTurnStatusToString();
        return result;
    }

    saveSettings() {
        let savesMap = g_appData.mapKind == MapType.ResonantBattles_Default;
        let dict = this.convertCurrentSettingsToDict(true, true, true, true, savesMap);
        for (let key in dict) {
            console.log("delete " + key + "..");
            this._cookieWriter.delete(key);
            let settingText = dict[key];
            console.log(document.cookie);
            console.log("save " + key + "..");
            console.log("value = " + settingText);
            let compressed = LZString.compressToBase64(settingText);
            // let compressed = LZString.compressToBase64(settingText);
            console.log(`compressed: ${compressed}`);
            this._cookieWriter.write(key, compressed);
        }
    }

    loadSettingsFromDict(
        settingDict,
        loadsAllySettings = true,
        loadsEnemySettings = true,
        loadsOffenceSettings = true,
        loadsDefenceSettings = true,
        loadsMapSettings = false,
        clearsAllFirst = true,
    ) {
        try {
            g_disableUpdateUi = true;
            let currentTurn = g_appData.currentTurn;
            let turnSetting = new TurnSetting(currentTurn);
            if (loadsDefenceSettings) {
                turnSetting.setAppData(g_appData);
            }

            if (clearsAllFirst) {
                if (settingDict[turnSetting.serialId]) {
                    if (loadsDefenceSettings) {
                        // リセット位置が重なって不定になるのを防ぐために最初に取り除く
                        for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
                            moveStructureToDefenceStorage(structure);
                        }
                    }
                    if (loadsOffenceSettings) {
                        // リセット位置が重なって不定になるのを防ぐために最初に取り除く
                        for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
                            moveStructureToOffenceStorage(structure);
                        }
                    }
                    if (loadsEnemySettings) {
                        for (let unit of g_appData.enumerateEnemyUnits()) {
                            moveUnitToTrashBox(unit);
                        }
                    }
                    if (loadsAllySettings) {
                        for (let unit of g_appData.enumerateAllyUnits()) {
                            moveUnitToTrashBox(unit);
                        }
                    }

                    g_appData.map.resetPlacement();
                }
            }

            if (loadsEnemySettings) {
                for (let unit of g_appData.enumerateAllEnemyUnits()) {
                    turnSetting.pushUnit(unit);
                }
            }
            if (loadsAllySettings) {
                for (let unit of g_appData.enumerateAllAllyUnits()) {
                    turnSetting.pushUnit(unit);
                }
            }
            if (loadsOffenceSettings) {
                for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
                    turnSetting.pushStructure(structure);
                }
            }
            if (loadsDefenceSettings) {
                for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
                    turnSetting.pushStructure(structure);
                }
                for (let structure of g_appData.map.enumerateBreakableWalls()) {
                    turnSetting.pushStructure(structure);
                }
            }
            if (loadsMapSettings) {
                for (let structure of g_appData.map.enumerateWalls()) {
                    turnSetting.pushStructure(structure);
                }
                for (let tile of g_appData.map.enumerateTiles()) {
                    turnSetting.pushTile(tile);
                }
            }

            // heroIndexChangedイベントが走ってスキルなどが上書きされないよう
            // 現在のユニットを未設定にしておく
            g_appData.clearCurrentItemSelection();
            changeCurrentUnitTab(-1);

            if (settingDict[turnSetting.serialId] == null && settingDict[TurnWideCookieId] == null) {
                console.log("failed to load turn setting");
                resetPlacement();
                updateAllUi();
                return;
            }

            if (settingDict[TurnWideCookieId]) {
                turnSetting.fromTurnWideStatusString(settingDict[TurnWideCookieId]);
                if (loadsDefenceSettings) {
                    // マップ種類
                    g_appData.map.changeMapKind(g_appData.mapKind, g_appData.gameVersion);
                }

                if (loadsEnemySettings) {
                    // console.log("敵の設定をロード");
                    for (let unit of g_appData.enumerateEnemyUnits()) {
                        g_appData.initializeByHeroInfo(unit, unit.heroIndex, false);
                    }
                }
                if (loadsAllySettings) {
                    // console.log("味方の設定をロード");
                    for (let unit of g_appData.enumerateAllyUnits()) {
                        g_appData.initializeByHeroInfo(unit, unit.heroIndex, false);
                    }
                }
            }

            if (settingDict[turnSetting.serialId]) {
                turnSetting.fromPerTurnStatusString(settingDict[turnSetting.serialId]);

                // 施設の設定をロード
                if (loadsDefenceSettings) {
                    // マップオブジェクトのロード
                    // console.log("loading map objects");
                    // console.log("map object count: " + g_appData.map.breakableObjCountOfCurrentMapType);
                    for (let structure of g_appData.map.enumerateBreakableWallsOfCurrentMapType()) {
                        // console.log(structure.id);
                        if (!turnSetting.isDeserialized(structure)) { continue; }
                        // console.log(structure.id + " is deserialized");
                        try {
                            this.__setStructureFromSerialSetting(structure);
                        } catch (e) {
                            moveToDefault(structure);
                        }
                    }

                    // console.log("loading deffence structures");
                    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
                        if (!turnSetting.isDeserialized(structure)) { continue; }
                        try {
                            this.__setStructureFromSerialSetting(structure);
                        } catch (e) {
                            moveToDefault(structure);
                        }
                    }
                }

                if (loadsOffenceSettings) {
                    // console.log("loading offence structures");
                    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
                        if (!turnSetting.isDeserialized(structure)) { continue; }
                        try {
                            this.__setStructureFromSerialSetting(structure);
                        } catch (e) {
                            moveToDefault(structure);
                        }
                    }
                }

                if (loadsEnemySettings) {
                    // console.log("敵の設定をロード");
                    for (let unit of g_appData.enumerateEnemyUnits()) {
                        this.__setUnitFromSerialSetting(unit);
                    }
                }
                if (loadsAllySettings) {
                    // console.log("味方の設定をロード");
                    for (let unit of g_appData.enumerateAllyUnits()) {
                        this.__setUnitFromSerialSetting(unit);
                    }
                }

                if (loadsMapSettings) {
                    for (let structure of g_appData.map.enumerateWalls()) {
                        // console.log(structure.id);
                        if (!turnSetting.isDeserialized(structure)) {
                            removeFromAll(structure);
                            continue;
                        }
                        // console.log(structure.id + " is deserialized");
                        try {
                            this.__setStructureFromSerialSetting(structure);
                        } catch (e) {
                            moveToDefault(structure);
                        }
                    }
                }
            }
        }
        finally {
            g_disableUpdateUi = false;
        }

        g_appData.sortUnitsBySlotOrder();

        // 祝福を反映させるために更新が必要
        g_appData.__updateStatusBySkillsAndMergeForAllHeroes(false);

        g_appData.map.createTileSnapshots();
    }

    loadSettings() {
        let currentTurn = g_appData.currentTurn;
        let turnSetting = new TurnSetting(currentTurn);
        let dict = {};
        dict[TurnWideCookieId] = null;
        dict[turnSetting.serialId] = null;
        for (let key in dict) {
            let readText = this._cookieWriter.read(key);
            let decompressed = LZString.decompressFromBase64(readText);
            console.log(`decompressed: ${decompressed}`);
            dict[key] = decompressed;
        }
        if (dict[TurnWideCookieId] == null && dict[turnSetting.serialId] == null) {
            console.log("ターン" + currentTurn + "の設定なし");
            return;
        }
        let loadsMap = g_appData.mapKind == MapType.ResonantBattles_Default;
        this.loadSettingsFromDict(dict, true, true, true, true, loadsMap);
    }
}
