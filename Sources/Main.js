/// @file
/// @brief シミュレーターのメインコードです。

function hasTargetOptionValue(targetOptionId, options) {
    for (let index in options) {
        let option = options[index];
        if (option.id == targetOptionId) {
            return true;
        }
    }
    return false;
}

function extractUnitAndSkillType(elemName) {
    let unit = null;
    let skillType = null;
    if (elemName != null || elemName != "") {
        let splited = elemName.split("-");
        if (splited.length == 2) {
            unitId = splited[0];
            skillType = splited[1];
            unit = g_appData.findItemById(unitId);
        }
    }
    return [unit, skillType];
}

const MoveResult = {
    Success: 0,
    Failure: 1,
    BoltTrapActivated: 2,
    HeavyTrapActivated: 3,
}

class MovementAssistResult {
    constructor(success, assistUnitTileAfterAssist, targetUnitTileAfterAssist) {
        this.success = success;
        this.assistUnitTileAfterAssist = assistUnitTileAfterAssist;
        this.targetUnitTileAfterAssist = targetUnitTileAfterAssist;
    }
}

const ModuleLoadState = {
    NotLoaded: 0,
    Loading: 1,
    Loaded: 2,
};

/// シミュレーター本体です。
class AetherRaidTacticsBoard {
    constructor() {
        this.isTurnWideCommandQueueEnabled = false;
        this.disableAllLogs = false;
        this.isCommandLogEnabled = true;
        this.tempSerializedTurn = null;
        this.currentPatternIndex = 0; // 暫定処置用

        this.openCvLoadState = ModuleLoadState.NotLoaded;
        this.tesseractLoadState = ModuleLoadState.NotLoaded;

        this.cropper = null;
        this.damageCalc = new DamageCalculator();
        this.weaponSkillCharWhiteList = "";
        this.supportSkillCharWhiteList = "";
        this.specialSkillCharWhiteList = "";
        this.passiveSkillCharWhiteList = "";
        this.passiveSkillCharBlackList = "鼻董輿養遣驚";

        this.ocrCanvases = [];
        for (let i = 0; i < 6; ++i) {
            let canvases = [];
            this.ocrCanvases.push(canvases);

            for (let j = 0; j < 12; ++j) {
                let canvas = document.createElement("canvas");
                canvases.push(canvas);
            }
        }

        this.settings = new SettingManager();
        this._imageProcessor = new ImageProcessor();
        this.origAi = new OriginalAi();

        this.skillIdToNameDict = {};

        let self = this;
        this.vm = new Vue({
            el: "#app",
            data: g_appData,
            methods: {
                bgmEnabledChanged: function () {
                    if (self.audioManager.isBgmEnabled) {
                        self.vm.audioManager.isSoundEffectEnabled = true;
                        if (self.vm.changesBgmRandomly) {
                            self.audioManager.setBgmRandom();
                            self.writeDebugLogLine(`BGM番号: ${self.audioManager.currentBgmId}`);
                        }
                        self.audioManager.playBgm();
                    }
                    else {
                        self.vm.audioManager.isSoundEffectEnabled = false;
                        self.audioManager.pauseBgm();
                    }
                },
                backgroundImageEnabledChanged: function () {
                    updateMapUi();
                },
                gameModeChanged: function () {
                    // g_appData.clearReservedSkillsForAllUnits();
                    g_appData.setPropertiesForCurrentGameMode();

                    // デフォルトのマップに設定
                    switch (this.gameMode) {
                        case GameMode.AetherRaid:
                            this.mapKind = MapType.Izumi;
                            break;
                        case GameMode.Arena:
                            this.mapKind = MapType.Arena_1;
                            break;
                        case GameMode.ResonantBattles:
                            this.mapKind = DefaultResonantBattleMap;
                            break;
                        case GameMode.TempestTrials:
                            this.mapKind = DefaultTempestTrialsMap;
                            break;
                        case GameMode.PawnsOfLoki:
                            this.mapKind = -1;
                        default:
                            break;
                    }


                    g_appData.updateEnemyAndAllyUnits();
                    g_appData.sortUnitsBySlotOrder();
                    g_appData.__updateStatusBySkillsAndMergeForAllHeroes();
                    changeMap();
                    g_appData.clearReservedSkillsForAllUnits();
                    resetPlacement();
                    switch (this.gameMode) {
                        case GameMode.Arena:
                            break;
                        case GameMode.ResonantBattles:
                            self.__setUnitsForResonantBattles();
                            break;
                        case GameMode.TempestTrials:
                            self.__setUnitsForTempestTrials();
                            break;
                    }
                    updateAllUi();
                },
                mapChanged: function () {
                    // g_appData.clearReservedSkillsForAllUnits();
                    removeBreakableWallsFromTrashbox();
                    changeMap();
                    switch (this.gameMode) {
                        case GameMode.Arena:
                            resetPlacement();
                            break;
                        case GameMode.ResonantBattles:
                            resetPlacement();
                            self.__setUnitsForResonantBattles();
                            break;
                        case GameMode.TempestTrials:
                            resetPlacement();
                            break;
                        case GameMode.PawnsOfLoki:
                            resetPlacement();
                            break;
                    }

                    updateAllUi();
                },
                addWallToMap: function () {
                    let newWallIndex = this.map.countWallsOnMap();
                    let wall = this.map.getWall(newWallIndex);
                    if (wall == null) {
                        self.writeErrorLine("これ以上壁を配置できません");
                        return;
                    }
                    removeFromAll(wall);
                    moveStructureToEmptyTileOfMap(wall);
                    updateAllUi();
                },
                removeWallFromMap: function () {
                    let wallIndex = this.map.countWallsOnMap() - 1;
                    if (wallIndex < 0) {
                        self.writeErrorLine("削除する壁がありません");
                        return;
                    }
                    let wall = this.map.getWall(wallIndex);

                    removeFromAll(wall);
                    updateAllUi();
                },
                addBreakableWallToMap: function () {
                    let newWallIndex = this.map.countBreakableWallsOnMap();
                    let wall = this.map.getBreakableWall(newWallIndex);
                    if (wall == null) {
                        self.writeErrorLine("これ以上壊せる壁を配置できません");
                        return;
                    }
                    removeFromAll(wall);
                    moveStructureToEmptyTileOfMap(wall);
                    updateAllUi();
                },
                removeBreakableWallFromMap: function () {
                    let wallIndex = this.map.countBreakableWallsOnMap() - 1;
                    if (wallIndex < 0) {
                        self.writeErrorLine("削除する壊せる壁がありません");
                        return;
                    }
                    let wall = this.map.getBreakableWall(wallIndex);

                    removeFromAll(wall);
                    updateAllUi();
                },
                resonantBattleIntervalChanged: function () {
                    self.__setUnitsForResonantBattles();
                    updateAllUi();
                },
                currentItemIndexChanged: function () {
                    // if (g_app == null) { return; }
                    // changeCurrentUnitTab(this.currentItemIndex);

                    // let currentItem = g_appData.currentItem;
                    // for (let item of g_appData.enumerateItems()) {
                    //     if (item == currentItem) {
                    //         item.isSelected = true;
                    //     }
                    //     else {
                    //         item.isSelected = false;
                    //     }
                    // }

                    // let currentUnit = g_app.__getCurrentUnit();
                    // if (currentUnit != null) {
                    //     if (currentUnit.groupId == UnitGroupType.Ally) {
                    //         this.attackerUnitIndex = this.currentItemIndex;
                    //     }
                    //     else {
                    //         this.attackTargetUnitIndex = this.currentItemIndex;
                    //     }
                    // }
                    // g_appData.__showStatusToAttackerInfo();
                    // updateAllUi();
                },
                heroIndexChanged: function (e) {
                    if (g_app == null) { return; }
                    let currentUnit = g_app.__getCurrentUnit();
                    if (currentUnit == null) { return; }
                    g_appData.initializeByHeroInfo(currentUnit, currentUnit.heroIndex);
                    g_appData.__updateStatusBySkillsAndMergeForAllHeroes();
                    console.log("heroIndexChanged");
                    updateAllUi();
                },
                buffChanged: function () {
                    if (g_app == null) { return; }
                    g_appData.__showStatusToAttackerInfo();
                    updateAllUi();
                },
                moveCountChanged: function () {
                    if (g_app == null) { return; }
                    updateAllUi();
                },
                weaponChanged: function () {
                    console.log("weaponChanged");
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    unit.weaponRefinement = WeaponRefinementType.None;
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    unit.resetMaxSpecialCount();
                    self.updateAllUnitSpur();
                    g_appData.updateArenaScore(unit);
                },
                weaponOptionChanged: function () {
                    console.log("weaponOptionChanged");
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    unit.resetMaxSpecialCount();
                    g_app.updateAllUnitSpur();
                    g_appData.updateArenaScore(unit);
                },
                supportChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateUnitSkillInfo(unit);
                    g_appData.updateArenaScore(unit);
                },
                specialChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateUnitSkillInfo(unit);
                    unit.resetMaxSpecialCount();
                    g_appData.updateArenaScore(unit);
                    updateAllUi();
                },
                specialCountChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    updateAllUi();
                },
                hpChanged: function () {
                    if (g_app == null) { return; }
                    g_appData.__showStatusToAttackerInfo();
                    updateAllUi();
                },
                passiveAChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    unit.resetMaxSpecialCount();
                    g_app.updateAllUnitSpur();
                    g_appData.updateArenaScore(unit);
                },
                passiveBChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateUnitSkillInfo(unit);
                    g_appData.updateArenaScore(unit);

                    // 救援等に変わったら移動可能範囲の更新が必要
                    updateAllUi();
                },
                passiveCChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    g_app.updateAllUnitSpur();
                    g_appData.updateArenaScore(unit);
                },
                passiveSChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    g_app.updateAllUnitSpur();
                    g_appData.updateArenaScore(unit);

                    // 曲技飛行等で移動範囲が変わる
                    updateAllUi();
                },
                mergeChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    updateAllUi();
                },
                dragonflowerChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    updateAllUi();
                },
                summonerLevelChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    updateAllUi();
                },
                grantedBlessingChanged: function () {
                    if (g_app == null) { return; }
                    let currentUnit = g_app.__getCurrentUnit();
                    if (currentUnit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(currentUnit);

                    for (let unit of g_appData.enumerateSelectedItems(x => x != currentUnit && x instanceof Unit)) {
                        if (unit.grantedBlessing != currentUnit.grantedBlessing
                            && unit.providableBlessingSeason == SeasonType.None
                        ) {
                            unit.grantedBlessing = currentUnit.grantedBlessing;
                            g_appData.__updateStatusBySkillsAndMerges(unit);
                        }
                    }
                    updateAllUi();
                },
                ivChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    unit.updatePureGrowthRate();
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    updateAllUi();
                },
                addChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    updateAllUi();
                },
                blessingChanged: function () {
                    // if (g_app == null) { return; }
                    // let unit = g_app.__getCurrentUnit();
                    // if (unit == null) { return; }
                    // g_appData.__updateStatusBySkillsAndMerges(unit);
                    updateAllUi();
                },
                transformedChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                },
                lightSeasonChanged: function () {
                    if (g_app == null) { return; }
                    this.isAstraSeason = !this.isLightSeason;
                    g_appData.__updateStatusBySkillsAndMergeForAllHeroes();
                    g_appData.resetCurrentAetherRaidDefensePreset();
                },
                astraSeasonChanged: function () {
                    if (g_app == null) { return; }
                    this.isLightSeason = !this.isAstraSeason;
                    g_appData.__updateStatusBySkillsAndMergeForAllHeroes();
                    g_appData.resetCurrentAetherRaidDefensePreset();
                },
                seasonChanged: function () {
                    if (g_app == null) { return; }
                    g_appData.__updateStatusBySkillsAndMergeForAllHeroes();
                    updateAllUi();
                },
                aetherRaidDefensePresetChanged: function () {
                    g_appData.updateAetherRaidDefensePresetDescription();
                },
                aetherRaidOffensePresetChanged: function () {
                },
                slotOrderChanged: function () {
                    updateMapUi();
                },
                showDetailLogChanged: function () {
                },
                resetUnitRandom: function () {
                    if (g_app == null) { return; }
                    g_app.resetUnitRandom();
                    updateAllUi();
                },
                healHpFull: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    unit.hp = unit.maxHpWithSkills;
                    g_appData.__showStatusToAttackerInfo();
                    updateAllUi();
                },
                healHpFullForAllUnits: function () {
                    if (g_app == null) { return; }
                    for (let unit of this.units) {
                        unit.resetAllState();
                    }
                    g_appData.__showStatusToAttackerInfo();
                    updateAllUi();
                },
                debugMenuEnabledChanged: function () {
                    g_appData.applyDebugMenuVisibility();
                },
                actionDoneChanged: function () {
                    updateAllUi();
                },
                activateAllUnit: function () {
                    for (let unit of this.units) {
                        unit.isActionDone = false;
                    }
                    updateAllUi();
                },
                isBonusCharChanged: function () {
                    if (g_app == null) { return; }
                    let currentUnit = g_app.__getCurrentUnit();
                    if (currentUnit == null) { return; }
                    let value = currentUnit.isBonusChar;
                    for (let unit of g_appData.enumerateSelectedItems(x => x instanceof Unit)) {
                        if (unit.isBonusChar == value) {
                            continue;
                        }
                        unit.isBonusChar = value;
                    }
                    g_appData.__updateStatusBySkillsAndMergeForAllHeroes();
                },
                resetUnitForTesting: function () {
                    if (g_app == null) { return; }
                    g_app.resetUnitsForTesting();
                },
                ornamentIconChanged: function () {
                    if (g_app == null) { return; }
                    let currentItem = g_appData.currentItem;
                    if ((currentItem instanceof Ornament) == false) {
                        return;
                    }
                    currentItem.setIconByOrnamentTypeIndex();
                    updateAllUi();
                },
                structureLevelChanged: function () {
                    if (g_app == null) { return; }
                    let currentItem = g_appData.currentItem;
                    let isUpdateUnitRequired = (currentItem instanceof OfFortress) || (currentItem instanceof DefFortress);
                    for (let st of g_appData.enumerateSelectedItems(x => x != currentItem && x instanceof StructureBase)) {
                        if (st.hasLevel && Number(st.level) != Number(currentItem.level)) {
                            st.level = Number(currentItem.level);
                        }

                        isUpdateUnitRequired |= (st instanceof OfFortress) || (st instanceof DefFortress);
                    }

                    if (isUpdateUnitRequired) {
                        g_appData.__updateStatusBySkillsAndMergeForAllHeroes();
                    }

                    updateAllUi();
                },
                currentTurnChanged: function () {
                    console.log("current turn changed");
                    if (this.isAutoLoadTurnSettingEnabled) {
                        loadSettings();
                    }
                },
                enemyUnitSorted: function (event) {
                    let slotOrder = 0;
                    for (let elem of event.to.childNodes) {
                        let unit = g_app.findUnitById(elem.classList[0]);
                        unit.slotOrder = slotOrder;
                        ++slotOrder;
                    }
                    g_appData.updateAetherRaidDefenseLiftLoss();
                    updateMapUi();
                },
                unitSelected: function (event) {
                    let name = event.item.name;
                    if (name == undefined) {
                        name = event.item.classList[0];
                    }
                    g_app.selectItem(name);
                },
                examinesAliveTiles: function (event) {
                    self.examinesAliveTiles();
                },
                resetCellOverrides: function (event) {
                    this.map.resetOverriddenTiles();
                    updateAllUi();
                },
                removeDefenceStructuresNoEffectForEnemyMovement: function (event) {
                    console.log("removeDefenceStructuresNoEffectForEnemyMovement");
                    self.removeDefenceStructuresNoEffectForEnemyMovement();
                    updateAllUi();
                },
                examinesAttackableEnemies: function (event) {
                    console.log("examinesAttackableEnemies");
                    self.origAi.examinesAttackableEnemies();
                    updateAllUi();
                },
                endTurn: function (event) {
                    self.clearLog();
                    self.simulateBeginningOfEnemyTurn();
                    self.__executeAllCommands(self.commandQueuePerAction, 0);
                    updateAllUi();
                },
                iconOverlayDisabledChanged: function (event) {
                    updateAllUi();
                },
                exportSettingChanged: function () {
                    if (g_app == null) {
                        return;
                    }
                    g_appData.updateExportText();
                },
                cellSizeChanged: function () {
                    self.map.cellHeight = self.map.cellWidth;
                    g_appData.updateTargetInfoTdStyle();
                    updateAllUi();
                },
                ocrSettingFileChanged: function (event) {
                    this.showOcrImage = false;
                    const files = event.target.files;
                    if (files.length == 0) {
                        return;
                    }

                    this.showOcrImage = true;
                    self._imageProcessor.showOcrSettingSourceImage(files);
                }
            },
        });

        {
            let order = 0;
            for (let unit of this.enumerateUnitsInSpecifiedGroup(UnitGroupType.Ally)) {
                unit.slotOrder = order;
                ++order;
            }
        }
        {
            let order = 0;
            for (let unit of this.enumerateUnitsInSpecifiedGroup(UnitGroupType.Enemy)) {
                unit.slotOrder = order;
                ++order;
            }
        }
    }

    __findMaxSpWeaponId(defaultSkillId, options) {
        let skillInfoArrays = [g_appData.weaponInfos];
        let maxSpSkillInfo = this.__findSkillInfoFromArrays(skillInfoArrays, defaultSkillId);
        let maxSp = 0;
        if (maxSpSkillInfo != null) {
            maxSp = maxSpSkillInfo.sp;
            if (maxSp == 300 && maxSpSkillInfo.weaponRefinementOptions.length > 1) {
                maxSp += 50;
            }
        }
        for (let option of options) {
            let skillId = option.id;
            if (option.id < 0) {
                continue;
            }
            let info = this.__findSkillInfoFromArrays(skillInfoArrays, skillId);
            if (info == null) {
                console.error(`${option.text}(${skillId}) was not found`);
                continue;
            }

            let sp = info.sp;
            if (sp == 300 && info.weaponRefinementOptions.length > 1) {
                sp += 50;
            }

            if (sp > maxSp) {
                maxSp = sp;
                maxSpSkillInfo = info;
            }
        }
        if (maxSpSkillInfo == null) {
            return -1;
        }
        return maxSpSkillInfo.id;
    }

    __findMaxSpSkillId(defaultSkillId, options, skillInfoArrays) {
        let maxSpSkillInfo = this.__findSkillInfoFromArrays(skillInfoArrays, defaultSkillId);
        let maxSp = 0;
        if (maxSpSkillInfo != null) {
            maxSp = maxSpSkillInfo.sp;
        }
        for (let option of options) {
            let skillId = option.id;
            if (option.id < 0) {
                continue;
            }
            let info = this.__findSkillInfoFromArrays(skillInfoArrays, skillId);
            if (info == null) {
                console.error(`${option.text}(${skillId}) was not found`);
                continue;
            }
            if (info.sp > maxSp) {
                maxSp = info.sp;
                maxSpSkillInfo = info;
            }
        }
        if (maxSpSkillInfo == null) {
            return -1;
        }
        return maxSpSkillInfo.id;
    }

    setUnitToMaxArenaScore(unit) {
        if (unit.heroInfo == null) {
            return;
        }

        unit.merge = 10;
        unit.level = 40;

        unit.clearReservedSkills();
        unit.weapon = this.__findMaxSpWeaponId(unit.weapon, unit.heroInfo.weaponOptions);
        let weaponInfo = this.__findWeaponInfo(unit.weapon);
        if (weaponInfo.sp == 300 && weaponInfo.weaponRefinementOptions.length > 1) {
            unit.weaponRefinement = weaponInfo.weaponRefinementOptions[1].id;
        }
        unit.support = this.__findMaxSpSkillId(unit.support, unit.heroInfo.supportOptions, [g_appData.supportInfos]);
        unit.special = this.__findMaxSpSkillId(unit.special, unit.heroInfo.specialOptions, [g_appData.specialInfos]);
        unit.passiveA = this.__findEquipableMaxDuelSkill(unit);
        if (unit.passiveA < 0) {
            unit.passiveA = this.__findMaxSpSkillId(unit.passiveA, unit.heroInfo.passiveAOptions, [g_appData.passiveAInfos]);
        }
        unit.passiveA = this.__findMaxSpSkillId(unit.passiveA, unit.heroInfo.passiveAOptions, [g_appData.passiveAInfos]);
        unit.passiveB = this.__findMaxSpSkillId(unit.passiveB, unit.heroInfo.passiveBOptions, [g_appData.passiveBInfos]);
        unit.passiveC = this.__findMaxSpSkillId(unit.passiveC, unit.heroInfo.passiveCOptions, [g_appData.passiveCInfos]);
        unit.passiveS = this.__findMaxSpSkillId(unit.passiveS, unit.heroInfo.passiveSOptions, [
            g_appData.passiveAInfos,
            g_appData.passiveBInfos,
            g_appData.passiveCInfos,
            g_appData.passiveSInfos]);
        g_appData.__updateStatusBySkillsAndMerges(unit);
        this.updateAllUnitSpur();
        g_appData.updateArenaScore(unit);
        updateAllUi();
    }

    __findEquipableMaxDuelSkill(unit) {
        if (unit.heroInfo == null) {
            return -1;
        }
        let duelSkillId = -1;
        for (let option of unit.heroInfo.passiveAOptions) {
            if (option.id < 0) {
                continue;
            }

            let skillId = option.id;
            let info = this.__findSkillInfoFromArrays([g_appData.passiveAInfos], skillId);
            if (info == null) {
                console.error(`${option.text}(${skillId}) was not found`);
                continue;
            }

            if (info.isDuel3()) {
                duelSkillId = skillId;
            }
            if (info.isDuel4()) {
                return skillId;
            }
        }

        return duelSkillId;
    }

    updateArenaScoreForAllUnits() {
        for (let unit of this.enumerateAllUnits()) {
            g_appData.updateArenaScoreOfUnit(unit);
        }
        g_appData.updateArenaScoreOfParties();
    }

    get audioManager() {
        return this.vm.audioManager;
    }

    __canActivateDuoSigurdSkill(duoUnit) {
        for (let targetUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 1, false)) {
            let result = this.__findTileAfterReposition(duoUnit, targetUnit, duoUnit.placedTile);
            if (result.success) {
                return true;
            }
        }
        return false;
    }

    canActivateDuoSkillOrHarmonizedSkill(duoUnit) {
        if (!duoUnit.isDuoHero && !duoUnit.isHarmonicHero) {
            return false;
        }

        if (duoUnit.isDuoOrHarmonicSkillActivatedInThisTurn) {
            return false;
        }

        switch (duoUnit.heroIndex) {
            case Hero.DuoLyn:
                if (!duoUnit.isActionDone) {
                    return false;
                }
                break;
            case Hero.DuoSigurd:
                if (!this.__canActivateDuoSigurdSkill(duoUnit)) {
                    return false;
                }
                break;
        }

        if (this.__isThereAnyUnit(UnitGroupType.Enemy, x => x.isDuoHero || x.isHarmonicHero)) {
            for (let st of this.__enumerateDefenseStructuresOnMap()) {
                if (st instanceof DefHiyokuNoTorikago) {
                    let limitTurn = 2 + Number(st.level);
                    if (this.vm.currentTurn <= limitTurn) {
                        return false;
                    }
                    break;
                }
            }
        }

        let activatableCount = 1;
        for (let st of this.__enumerateOffenceStructuresOnMap()) {
            if (st instanceof OfHiyokuNoHisyo) {
                let limitTurn = 2 + Number(st.level);
                if (this.vm.currentTurn <= limitTurn) {
                    ++activatableCount;
                }
                break;
            }
        }

        return duoUnit.duoOrHarmonizedSkillActivationCount < activatableCount;
    }

    activateDuoOrHarmonizedSkill(duoUnit) {
        this.__enqueueDuoSkillCommand(duoUnit);
        this.executePerActionCommand();
    }

    __areSameOrigin(unit, targetOrigins) {
        let origins = unit.heroInfo.origin.split('|');
        for (let origin of origins) {
            let isMonsyoNoNazo = origin.indexOf("紋章の謎") >= 0;
            for (let targetOrigin of targetOrigins) {
                if (isMonsyoNoNazo) {
                    if (targetOrigin.indexOf("紋章の謎") >= 0) {
                        return true;
                    }
                }
                else if (origin == targetOrigin) {
                    return true;
                }
            }
        }
        return false;
    }

    __addStatusEffectToSameOriginUnits(duoUnit, statusEffect) {
        let targetOrigins = duoUnit.heroInfo.origin.split('|');
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit, true)) {
            if (this.__areSameOrigin(unit, targetOrigins)) {
                unit.addStatusEffect(statusEffect);
            }
        }
    }

    __refreshHighestHpUnitsInSameOrigin(duoUnit) {
        let targetOrigins = duoUnit.heroInfo.origin.split('|');
        let highestHpUnits = [];
        let highestHp = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 2, true)) {
            if (this.__areSameOrigin(unit, targetOrigins)) {
                if (unit != duoUnit && unit.isActionDone) {
                    if (unit.hp > highestHp) {
                        highestHpUnits = [unit];
                        highestHp = unit.hp;
                    } else if (unit.hp == highestHp) {
                        highestHpUnits.push(unit);
                    }
                }
            }
        }

        if (highestHpUnits.length == 1) {
            for (let unit of highestHpUnits) {
                unit.isActionDone = false;
            }
        }
    }

    __activateDuoOrHarmonizedSkill(duoUnit) {
        if (!this.canActivateDuoSkillOrHarmonizedSkill(duoUnit)) {
            return;
        }
        switch (duoUnit.heroIndex) {
            case Hero.DuoHinoka:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Ally, 3, 99)) {
                    if (unit.moveType === MoveType.Flying) {
                        unit.applyAtkBuff(6);
                        unit.applySpdBuff(6);
                        unit.addStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                }
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Ally, 99, 3)) {
                    if (unit.moveType === MoveType.Flying) {
                        unit.applyAtkBuff(6);
                        unit.applySpdBuff(6);
                        unit.addStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                }

                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Enemy, 3, 99)) {
                    if (unit.isRangedWeaponType() && unit.moveType !== MoveType.Flying) {
                        unit.addStatusEffect(StatusEffectType.Gravity);
                    }
                }
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Enemy, 99, 3)) {
                    if (unit.isRangedWeaponType() && unit.moveType !== MoveType.Flying) {
                        unit.addStatusEffect(StatusEffectType.Gravity);
                    }
                }
                break;
            case Hero.DuoHilda: {
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Enemy, 3, 99)) {
                    unit.applyAtkDebuff(-7);
                    unit.addStatusEffect(StatusEffectType.Isolation);
                }
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Enemy, 99, 3)) {
                    unit.applyAtkDebuff(-7);
                    unit.addStatusEffect(StatusEffectType.Isolation);
                }
                break;
            }
            case Hero.HarmonizedCatria:
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.Desperation);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.FollowUpAttackPlus);
                break;
            case Hero.DuoEirika:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, duoUnit.groupId, 3, 3)) {
                    unit.addStatusEffect(StatusEffectType.Dodge);
                }
                break;
            case Hero.HarmonizedMyrrh: {
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.FollowUpAttackMinus);
                duoUnit.addStatusEffect(StatusEffectType.ShieldFlying);
                break;
            }
            case Hero.DuoLif: {
                let damage = 0;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 3)) {
                    damage += unit.maxHpWithSkills - unit.hp;
                }
                damage = Math.trunc(damage / 2);
                for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(duoUnit, 3)) {
                    unit.takeDamage(10 + Math.min(damage, 30));
                    unit.applyAtkDebuff(-7);
                    unit.applySpdDebuff(-7);
                }
                break;
            }
            case Hero.HarmonizedCaeda:
            case Hero.PlegianDorothea:
                {
                    this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantShield);
                    this.__refreshHighestHpUnitsInSameOrigin(duoUnit);

                }
                break;
            case Hero.DuoPeony:
                {
                    let highestHpUnits = [];
                    let heigestHp = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 1, false)) {
                        if (unit.isActionDone) {
                            if (unit.hp > heigestHp) {
                                highestHpUnits = [unit];
                                heigestHp = unit.hp;
                            }
                            else if (unit.hp == highestHp) {
                                highestHpUnits.push(unit);
                            }
                        }
                    }

                    if (highestHpUnits.length == 1) {
                        for (let unit of highestHpUnits) {
                            unit.isActionDone = false;
                            unit.addStatusEffect(StatusEffectType.AirOrders);
                        }
                    }
                }
                break;
            case Hero.DuoAltina:
                {
                    this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                    duoUnit.addStatusEffect(StatusEffectType.Vantage);
                }
                break;
            case Hero.DuoLyn:
                {
                    duoUnit.isActionDone = false;
                }
                break;
            case Hero.HaloweenTiki:
                {
                    this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                    this.__refreshHighestHpUnitsInSameOrigin(duoUnit);
                }
                break;
            case Hero.DuoSigurd:
                {
                    for (let targetUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 1, false)) {
                        this.__applyMovementAssist(duoUnit, targetUnit,
                            (unit, target, tile) => this.__findTileAfterReposition(unit, target, tile));
                    }
                }
                break;
            case Hero.PirateVeronica:
                {
                    this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantShield);
                }
                break;
            case Hero.SummerMia:
                {
                    this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                }
                break;
            case Hero.HaloweenHector:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Enemy, 3, 99)) {
                    let damage = 20;
                    unit.takeDamage(damage, true);
                }
                break;
            case Hero.DuoEphraim:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 2, true)) {
                    if (unit.moveType == MoveType.Infantry || unit.moveType == MoveType.Armor) {
                        unit.addStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                }
                break;
            case Hero.ChristmasMarth:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Ally, 99, 3)) {
                    if (unit == duoUnit) {
                        continue;
                    }
                    if (unit.moveType == MoveType.Flying || unit.moveType == MoveType.Armor) {
                        unit.applyAllBuff(3);
                        unit.addStatusEffect(StatusEffectType.BonusDoubler);
                    }
                }
                break;
            case Hero.NewYearAlfonse:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Ally, 3, 3)) {
                    if (unit.moveType == MoveType.Infantry) {
                        unit.reduceSpecialCount(2);
                    }
                }
                break;
            case Hero.ValentineAlm:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Ally, 5, 5)) {
                    unit.clearNegativeStatusEffects();
                    unit.resetDebuffs();
                    unit.applyAtkBuff(6);
                    unit.applySpdBuff(6);

                    // 回復不可状態でも回復できるので、状態異常治癒が先に行われてる
                    unit.heal(30);
                }
                break;
            case Hero.SpringIdunn:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Ally, 5, 5)) {
                    unit.addStatusEffect(StatusEffectType.SieldDragonArmor);
                    unit.applyDefBuff(6);
                    unit.applyResBuff(6);
                }
                break;
            case Hero.YoungPalla:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 1, true)) {
                    unit.addStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case Hero.BridalMicaiah:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Ally, 3, 99)) {
                    unit.addStatusEffect(StatusEffectType.TotalPenaltyDamage);
                }
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Enemy, 3, 99)) {
                    unit.applyDefDebuff(-7);
                    unit.applyResDebuff(-7);
                }
                break;
            case Hero.SummerByleth:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 2, true)) {
                    unit.addStatusEffect(StatusEffectType.Desperation);
                }
                break;
        }
        duoUnit.isDuoOrHarmonicSkillActivatedInThisTurn = true;
        ++duoUnit.duoOrHarmonizedSkillActivationCount;
        updateAllUi();
    }

    __findStructure(predicator) {
        for (let st of g_appData.defenseStructureStorage.objs) {
            if (predicator(st)) {
                return st;
            }
        }
        return null;
    }

    __findStructureByIconFileName(iconFileName) {
        for (let st of g_appData.defenseStructureStorage.objs) {
            if (st.iconFileName == iconFileName) {
                return st;
            }
        }

        for (let setting of OrnamentSettings) {
            if (setting.icon == iconFileName) {
                return this.__findStructure(st => st instanceof Ornament);
            }
        }
        return null;
    }


    limitArrayLengthTo2WithLargerLengthString(strArray) {
        if (strArray.length == 2) {
            return strArray;
        }

        let maxIndices = [[-1, 0], [-1, 0]];
        for (let i = 0; i < strArray.length; ++i) {
            let elem = strArray[i];

            for (let j = 0; j < maxIndices.length; ++j) {
                if (elem.length > maxIndices[j][1]) {
                    for (let k = maxIndices.length - 1; k > j; --k) {
                        maxIndices[k][0] = maxIndices[k - 1][0];
                        maxIndices[k][1] = maxIndices[k - 1][1];
                    }
                    maxIndices[j][0] = i;
                    maxIndices[j][1] = elem.length;
                    break;
                }
            }
        }
        let filtered = [];
        for (let i = 0; i < strArray.length; ++i) {
            for (let j = 0; j < maxIndices.length; ++j) {
                if (maxIndices[j][0] == i) {
                    filtered.push(strArray[i]);
                    break;
                }
            }
        }
        return filtered;
    }


    __findSkillInfoWithDict(name, unit, dict) {
        let candidates = [];
        let infoCandidates = [];
        if (!dict[SkillType.Support]) {
            for (let option of unit.heroInfo.supportOptions) {
                candidates.push(option.text);
            }
            infoCandidates.push(g_appData.supportInfos);
        }
        if (!dict[SkillType.Special]) {
            for (let option of unit.heroInfo.specialOptions) {
                candidates.push(option.text);
            }
            infoCandidates.push(g_appData.specialInfos);
        }
        if (!dict[SkillType.PassiveA]) {
            for (let option of unit.heroInfo.passiveAOptions) {
                candidates.push(option.text);
            }
            infoCandidates.push(g_appData.passiveAInfos);
        }
        if (!dict[SkillType.PassiveB]) {
            for (let option of unit.heroInfo.passiveBOptions) {
                candidates.push(option.text);
            }
            infoCandidates.push(g_appData.passiveBInfos);
        }
        if (!dict[SkillType.PassiveC]) {
            for (let option of unit.heroInfo.passiveCOptions) {
                candidates.push(option.text);
            }
            infoCandidates.push(g_appData.passiveCInfos);
        }
        let result = this.findSimilarNameSkillFromNameCandidates(name, candidates);
        if (result == null) {
            return null;
        }

        let foundName = result[0];
        for (let skillInfo of this.__enumerateElemOfArrays(infoCandidates)) {
            if (skillInfo.name == foundName) {
                return skillInfo;
            }
        }
        return null;
    }

    loadImageAnalysisLibraries() {
        let self = this;
        if (this.tesseractLoadState == ModuleLoadState.NotLoaded) {
            self.tesseractLoadState = ModuleLoadState.Loading;
            self.writeSimpleLogLine("Tesseract の初期化開始..");
            importJs("https://unpkg.com/tesseract.js@1.0.19/dist/tesseract.min.js", x => {
                self.tesseractLoadState = ModuleLoadState.Loaded;
                self.writeSimpleLogLine("Tesseract の初期化完了");
            });
        }

        if (this.openCvLoadState == ModuleLoadState.NotLoaded) {
            self.openCvLoadState = ModuleLoadState.Loading;
            self.writeSimpleLogLine("OpenCV の初期化開始..");
            // let jsPath = "https://docs.opencv.org/4.3.0/opencv.js";
            let jsPath = g_siteRootPath + "externals/opencv4.5.3/opencv.js";
            importJs(jsPath, x => {
                cv['onRuntimeInitialized'] = () => {
                    self.openCvLoadState = ModuleLoadState.Loaded;
                    self.writeSimpleLogLine("OpenCV の初期化完了");
                };
            });
        }
    }

    async setUnitsByStatusImages(files) {
        if (files.length == 0) {
            this.writeErrorLine("画像ファイルを選択してください");
            return;
        }

        if (this.openCvLoadState != ModuleLoadState.Loaded) {
            this.writeErrorLine("OpenCV の初期化が終わっていません。少し待ってから実行してください。");
            return;
        }
        if (this.tesseractLoadState != ModuleLoadState.Loaded) {
            this.writeErrorLine("Tesseract の初期化が終わっていません。少し待ってから実行してください。");
            return;
        }

        this._imageProcessor.setUnitsByStatusImages(files);
    }


    __setUnitsForResonantBattlesImpl(heroInfos) {
        let slotOrder = 0;
        for (let heroInfo of heroInfos) {
            let heroIndex = heroInfo[0];
            let skillIds = heroInfo[1];
            let addStatuses = heroInfo[2];
            let growthRates = heroInfo[3];

            let unit = g_appData.findEnemyUnitBySlotOrder(slotOrder);
            // unit.clearReservedSkills();

            unit.merge = 0;
            unit.dragonflower = 0;
            unit.isBonusChar = false;
            unit.isResplendent = false;
            unit.setIvHighStat(StatusType.None, false);
            unit.setIvLowStat(StatusType.None, false);
            unit.level = g_appData.getResonantBattlesEnemyLevelForAdvanced();

            let isHeroIndexChanged = heroIndex != null && unit.heroIndex != heroIndex;
            if (heroIndex != null) {
                g_appData.initializeByHeroInfo(unit, heroIndex, false);
                unit.updatePureGrowthRate();
                unit.initializeSkillsToDefault();
            }

            if (skillIds != null) {
                this.__setUnitSkills(unit, skillIds);
            }

            if (addStatuses != null || growthRates != null) {
                let enableHpMult = true;
                let enableAtkMult = !isThief(unit);
                this.__setUnitStatusAdd(unit, addStatuses, growthRates, enableHpMult, enableAtkMult);
            }
            if (isThief(unit)) {
                unit.defGrowthRate = 0.4;
            }

            if (isHeroIndexChanged) {
                unit.reserveCurrentSkills();
            }
            ++slotOrder;
        }

        g_appData.__updateStatusBySkillsAndMergeForAllHeroes(false);
    }

    __setUnitForTempestTrials(unit, heroIndex) {
        let isHeroIndexChanged = heroIndex != unit.heroIndex;
        unit.merge = 0;
        unit.dragonflower = 0;
        unit.isBonusChar = false;
        unit.isResplendent = false;
        unit.setIvHighStat(StatusType.None);
        unit.setIvLowStat(StatusType.None);
        unit.level = 45;
        g_appData.initializeByHeroInfo(unit, heroIndex, false);
        unit.clearReservedSkills();
        unit.clearSkills();
        unit.initializeSkillsToDefault();
        unit.resetStatusAdjustment();
        unit.hpMult = 1.3;
        if (isHeroIndexChanged) {
            unit.reserveCurrentSkills();
        }
    }
    __selectHeroInfoRandom(moveType, attackRange) {
        let candidates = [];
        for (let heroInfo of g_appData.heroInfos.data) {
            if (heroInfo.moveType == moveType
                && heroInfo.attackRange == attackRange
                && heroInfo.howToGet == "ガチャ"
                && heroInfo.name != "スルト"
            ) {
                candidates.push(heroInfo);
            }
        }
        let index = Math.floor(Math.random() * candidates.length);
        return candidates[index];
    }
    __setUnitsForTempestTrials() {
        let units = [];
        let enemyInfos = [];
        switch (this.vm.mapKind) {
            case MapType.TempestTrials_ShinmaiNinjaNoHatsuNinmu:
                {
                    {
                        // ボス
                        let unit = g_appData.findEnemyUnitBySlotOrder(1);
                        this.__setUnitForTempestTrials(unit, 588);
                        // unit.isBonusChar = true;
                        unit.hpMult = 1.5;
                        unit.atkAdd = 0;
                        unit.spdAdd = 0;
                        unit.defAdd = 0;
                        unit.resAdd = 0;
                        unit.special = Special.None;
                        unit.reservedSpecial = NotReserved;
                    }

                    enemyInfos = [
                        [[MoveType.Cavalry, 2]],
                        [null],
                        [[MoveType.Flying, 1]],
                        [[MoveType.Armor, 1]],
                        [[MoveType.Infantry, 2]],
                    ];
                }
                break;
            case MapType.TempestTrials_ButosaiNoKyodai:
                {
                    {
                        // ボス
                        let unit = g_appData.findEnemyUnitBySlotOrder(4);
                        this.__setUnitForTempestTrials(unit, 178);
                        unit.isBonusChar = true;
                        unit.hpAdd = -6;
                        unit.atkAdd = -1;
                        unit.spdAdd = -1;
                        unit.defAdd = -1;
                        unit.resAdd = 3;
                        unit.passiveA = PassiveA.Fury3;
                    }

                    enemyInfos = [
                        [[MoveType.Armor, 1]],
                        [[MoveType.Infantry, 1]],
                        [[MoveType.Infantry, 2]],
                        [[MoveType.Cavalry, 2]],
                        [null],
                    ];
                }
                break;
            case MapType.TempestTrials_KojoNoTakaraSagashi:
                {
                    {
                        // ボス
                        let unit = g_appData.findEnemyUnitBySlotOrder(1);
                        this.__setUnitForTempestTrials(unit, 555);
                        unit.isBonusChar = true;
                        unit.hpAdd = -5;
                        unit.atkAdd = -1;
                        unit.spdAdd = -1;
                        unit.resAdd = 1;
                    }

                    enemyInfos = [
                        [[MoveType.Armor, 1]],
                        [null],
                        [[MoveType.Infantry, 2]],
                        [[MoveType.Flying, 1]],
                        [[MoveType.Infantry, 1]],
                    ];
                }
                break;
        }

        for (let slotOrder = 0; slotOrder < enemyInfos.length; ++slotOrder) {
            let unit = g_appData.findEnemyUnitBySlotOrder(slotOrder);
            units.push(unit);
            let enemyInfo = enemyInfos[slotOrder];
            let heroSelectInfo = enemyInfo[0];
            if (heroSelectInfo == null) {
                continue;
            }

            let heroInfo = this.__selectHeroInfoRandom(heroSelectInfo[0], heroSelectInfo[1]);
            let heroIndex = g_appData.heroInfos.findIndexOfInfo(heroInfo.name);
            this.__setUnitForTempestTrials(unit, heroIndex);
        }
        g_appData.__updateStatusBySkillsAndMergeForAllHeroes(false);


        for (let unit of units) {
            unit.heal(99);
        }

        updateAllUi();
    }

    // 双界の敵セットアップ
    __setUnitsForResonantBattles(onlyGrowthRate = false) {
        for (let unit of this.enumerateAllyUnitsOnMap()) {
            unit.isBonusChar = true;
        }

        let heroInfos = [];
        switch (this.vm.mapKind) {
            case MapType.ResonantBattles_8:
                {
                    heroInfos = [[548, [-1, -1, -1, -1, -1, -1, -1, 1402], [1, 2, 3, 2, 3], [0.45, 0.4, 0.55]],
                    [550, [-1, -1, -1, -1, -1, -1, -1, 1397], [2, 1, 3, 2, 0], [0.45, 0.4, 0.55]],
                    [549, [-1, -1, -1, -1, -1, -1, -1, 1401], [1, 1, 2, 2, 1], [0.45, 0.4, 0.55]],
                    [293, [173, -1, -1, 453, 583, 631, 731, 1396], [1, 3, 1, 1, 3], [0.6, 0.6, 0.55]],
                    [312, [763, -1, -1, 462, 764, 615, 707, 1396], [0, 3, 1, 1, 3], [0.5, 0.55, 0.55]],
                    [550, [-1, -1, -1, -1, -1, -1, -1, 1400], [1, 0, 2, 2, 1], [0.45, 0.4, 0.55]],
                    [549, [-1, -1, -1, -1, -1, -1, -1, 1398], [3, 0, 2, 2, 2], [0.45, 0.4, 0.55]],
                    [292, [64, -1, 416, -1, 526, 649, 711, 1396], [2, 3, 2, 2, 1], [0.5, 0.6, 0.6]],
                    [293, [173, -1, -1, 453, 583, 631, 731, 1396], [-1, 1, 0, 0, 1], [0.6, 0.6, 0.55]],
                    [294, [65, -1, -1, 455, 582, 614, 685, 1396], [-1, 3, 0, 2, 1], [0.55, 0.65, 0.65]],
                    [312, [763, -1, -1, 462, 764, 615, 707, 1396], [3, 2, 3, 1, 3], [0.5, 0.6, 0.6]],
                    [548, [-1, -1, -1, -1, -1, -1, -1, 1399], [0, 3, 0, 0, 2], [0.45, 0.4, 0.55]],
                    ];
                }
                break;
            case MapType.ResonantBattles_7:
                {
                    heroInfos = [
                        [548, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKogun], [1, 1, 0, 4, 1], [null, 0.4, null]], // レッドシーフ1
                        [550, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoOdori], [1, 2, 0, 4, 0], [null, 0.4, null]], // グリーンシーフ1
                        [548, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKobu], [2, 0, 2, 4, 0], [null, 0.4, null]], // レッドシーフ2
                        // エーデルガルト
                        [398, [null, WeaponRefinementType.None, null, null, null, null, null, 1396], [3, 2, 3, 1, 1], [null, null, 0.6]],
                        // フェルディナント
                        [493, [null, WeaponRefinementType.Hp5_Res4, null, 485, null, 647, null, 1396], [0, 2, 2, 1, 2], [null, 0.6, 0.6]],
                        // ベレス
                        [401, [null, WeaponRefinementType.None, null, null, null, null, null, 1396], [0, 1, 3, 0, 1], [null, null, 0.6]],
                        [549, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoRakurai], [0, 1, 0, 3, 1], [null, 0.4, null]], // ブルーシーフ1
                        // アネット
                        [494, [null, WeaponRefinementType.None, null, 497, 546, null, null, 1396], [3, 0, 1, 3, 3], [null, 0.55, 0.55]],
                        [549, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoOugi], [3, 0, 1, 1, 0], [null, 0.4, null]], // ブルーシーフ2
                        // クロード
                        [400, [null, WeaponRefinementType.None, null, null, 531, null, null, 1396], [1, 1, 3, 1, 3], [null, 0.6, 0.6]],
                        // リシテア
                        [492, [null, WeaponRefinementType.None, null, null, null, null, null, 1396], [2, 0, 1, 2, 2], [null, 0.6, 0.6]],
                        [550, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoRakurai], [1, 0, 2, 2, 1], [null, 0.4, null]], // グリーンシーフ2
                    ];
                }
                break;
            case MapType.ResonantBattles_6:
                {
                    heroInfos = [
                        // リリス
                        [504, [null, WeaponRefinementType.None, null, 475, null, null, null, 1396], [1, 1, 0, 2, 1], [null, 0.6, null]],
                        // サイゾウ
                        [48, [null, WeaponRefinementType.Special, null, 461, 538, null, null, 1396], [0, 1, 1, 1, 1], [null, null, 0.6]],
                        [549, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoRakurai], [1, 2, 0, 3, 0], [null, 0.4, null]], // ブルーシーフ1
                        // カザハナ
                        [22, [null, WeaponRefinementType.Special_Hp3, null, 481, null, null, 726, 1396], [2, 2, 3, 2, 3], [null, 0.55, 0.55]],
                        [548, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKusuri], [2, 2, 0, 2, 1], [null, 0.4, null]], // レッドシーフ1
                        // シャラ
                        [190, [null, WeaponRefinementType.Special, null, 493, null, 597, null, 1396], [1, 2, 2, 3, 2], [null, 0.55, 0.55]],
                        [550, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoOugi], [1, 3, 1, 0, 3], [null, 0.4, null]], // グリーンシーフ1
                        [550, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoOdori], [2, 2, 1, 1, 0], [null, 0.4, null]], // グリーンシーフ2
                        [548, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKogun], [1, 1, 3, 2, 0], [null, 0.4, null]], // レッドシーフ2
                        // フランネル
                        [343, [null, WeaponRefinementType.None, null, null, 552, null, null, 1396], [3, 3, 3, 2, 0], [null, null, 0.6]],
                        // ベルカ
                        [31, [null, WeaponRefinementType.Hp5_Res4, null, null, null, null, 703, 1396], [0, 1, 2, 3, 1], [null, null, 0.6]],
                        [549, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKobu], [3, 0, 3, 0, 2], [null, 0.4, null]], // ブルーシーフ2
                    ];
                }
                break;
            case MapType.ResonantBattles_5:
                {
                    heroInfos = [
                        [548, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKusuri], [2, 0, 0, 2, 2], [null, 0.4, null]], // レッドシーフ1
                        [550, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKogun], [3, 2, 1, 2, 0], [null, 0.4, null]], // グリーンシーフ1
                        // サイリ
                        [526, [null, WeaponRefinementType.None, null, null, null, null, 720, 1396], [0, 1, 1, 4, 2], [null, 0.55, null]],
                        [549, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoRakurai], [3, 3, 3, 4, 1], [null, 0.4, null]], // ブルーシーフ1
                        // クロム
                        [24, [null, WeaponRefinementType.Special_Hp3, null, null, null, 597, null, 1396], [-1, 1, 2, 3, 3], [null, null, 0.6]],
                        // マーク
                        [224, [null, WeaponRefinementType.Special, null, null, null, null, null, 1396], [1, 1, 2, 3, 0], [null, 0.6, null]],
                        // リズ
                        [78, [null, WeaponRefinementType.WrathfulStaff, null, null, 509, null, 676, 1396], [1, 2, 2, 2, 3], [null, 0.55, 0.55]],
                        // ドニ
                        [5, [null, WeaponRefinementType.Hp5_Atk2, null, 481, null, null, 682, 1396], [-4, -1, 2, 0, 2], [null, null, 0.6]],
                        [550, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKobu], [2, 3, 1, 1, 0], [null, 0.4, null]], // グリーンシーフ2
                        // リベラ
                        [267, [null, WeaponRefinementType.Hp5_Spd3, null, null, 534, null, null, 1396], [-1, 2, 3, 1, 3], [null, 0.6, 0.55]],
                        [549, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoOdori], [3, 1, 0, 4, 1], [null, 0.4, null]], // ブルーシーフ2
                        [548, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoOugi], [0, 1, 3, 1, 3], [null, 0.4, null]], // レッドシーフ2
                    ];
                }
                break;
            case MapType.ResonantBattles_4:
                {
                    heroInfos = [
                        [548, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoRakurai], [1, 2, 1, 0, 1], [null, 0.4, null]], // レッドシーフ1
                        // ニケ
                        [330, [null, WeaponRefinementType.None, null, null, null, null, null, 1396], [0, 3, 3, 1, 1], [null, null, 0.6]],
                        // レテ
                        [361, [null, WeaponRefinementType.None, null, null, null, 593, null, 1396], [2, 0, 1, 1, 4], [null, 0.6, 0.55]],
                        [550, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoOdori], [2, 2, 1, 2, 1], [null, 0.4, null]], // グリーンシーフ1
                        [550, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKusuri], [0, 2, 2, 1, 3], [null, 0.4, null]], // グリーンシーフ2
                        // サザ
                        [204, [null, WeaponRefinementType.None, null, null, null, 613, null, 1396], [3, 0, 3, 3, 3], [null, 0.55, 0.55]],
                        [549, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoOugi], [1, 0, 0, 0, 0], [null, 0.4, null]], // ブルーシーフ1
                        // サナキ
                        [100, [null, WeaponRefinementType.Special, null, 482, null, 1389, null, 1396], [3, 2, 0, 1, 1], [null, 0.6, null]],
                        // ライ
                        [360, [null, WeaponRefinementType.None, null, 483, 554, null, null, 1396], [0, 1, 0, 2, 1], [null, null, 0.6]],
                        // モゥディ
                        [362, [null, WeaponRefinementType.None, null, 477, 519, null, null, 1396], [1, 2, 1, 3, 0], [null, null, 0.6]],
                        [548, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKogun], [0, 3, 3, 2, 2], [null, 0.4, null]], // レッドシーフ2
                        [549, [-1, null, -1, -1, -1, -1, -1, PassiveS.TozokuNoGuzoKobu], [3, 1, 0, 0, 1], [null, 0.4, null]], // ブルーシーフ2
                    ];
                }
                break;
            case MapType.ResonantBattles_3:
                {
                    heroInfos = [
                        [548, [-1, null, -1, -1, -1, -1, -1, 1402], [1, 0, 1, 2, 0], [null, 0.4, null]], // レッドシーフ1
                        [167, [115, WeaponRefinementType.Special_Hp3, null, null, null, null, 676, 1396], [-6, 3, 3, 0, 1], [0.5, null, 0.6]], // ネフェニー
                        [550, [-1, null, -1, -1, -1, -1, -1, 1398], [2, 0, 1, 0, 0], [null, 0.4, null]], // グリーンシーフ1
                        [550, [-1, null, -1, -1, -1, -1, -1, 1399], [1, 0, 2, 1, 0], [null, 0.4, null]], // グリーンシーフ2
                        [549, [-1, null, -1, -1, -1, -1, -1, 1400], [2, 0, 3, 1, 3], [null, 0.4, null]], // ブルーシーフ1
                        [169, [null, WeaponRefinementType.Hp5_Spd3, null, 494, null, null, 729, 1396], [-6, 3, 2, 2, 4], [0.5, 0.6, 0.5]], // エリンシア
                        [168, [null, WeaponRefinementType.Hp5_Atk2, null, 494, 514, null, null, 1396], [3, 2, 2, 1, 1], [0.45, 0.6, 0.6]], // オスカー
                        [122, [null, null, null, null, null, null, 710, 1396], [1, 1, 3, 3, 0], [null, 0.55, 0.65]], // アイク
                        [548, [-1, null, -1, -1, -1, -1, -1, 1401], [3, 1, 1, -1, 2], [null, 0.4, null]], // レッドシーフ2
                        [120, [null, WeaponRefinementType.WrathfulStaff, null, null, 518, 623, null, 1396], [3, 2, 3, 0, 1], [null, 0.65, null]], // ミスト
                        [121, [null, WeaponRefinementType.Special, null, null, 533, null, null, 1396], [3, 3, 3, 0, -4], [null, 0.65, 0.65]], // セネリオ
                        [549, [-1, null, -1, -1, -1, -1, -1, 1397], [1, 1, 2, 0, 3], [null, 0.4, null]], // ブルーシーフ2
                    ];
                }
                break;
            case MapType.ResonantBattles_2:
                {
                    heroInfos = [
                        // [英雄インデックス, [スキルID], [加算値], [HP守魔の成長率]]
                        [93, [109, null, null, null, 509, null, null, 1396], [0, 2, 3, 2, 2], [null, null, 0.55]], // エフラム
                        [549, [-1, null, -1, -1, -1, -1, -1, 1398], [3, 1, 1, 2, 0], [null, 0.4, null]], // ブルーシーフ1
                        [550, [-1, null, -1, -1, -1, -1, -1, 1397], [0, 0, 3, 3, 0], [null, 0.4, null]], // グリーンシーフ1
                        [158, [null, WeaponRefinementType.Special_Hp3, null, null, null, 609, null, 1396], [1, 0, 3, 2, 0], [null, null, 0.65]], // アメリア
                        [550, [-1, null, -1, -1, -1, -1, -1, 1399], [3, 1, 0, 2, 3], [null, 0.4, null]], // グリーンシーフ2
                        [441, [null, null, null, null, null, null, null, 1396], [2, 0, 0, 2, 0], [0.55, 0.65]], // ジスト
                        [549, [-1, null, -1, -1, -1, -1, -1, 1402], [1, 3, 3, 1, 0], [null, 0.4, null]], // ブルーシーフ2
                        [161, [null, WeaponRefinementType.Hp2_Atk1, null, null, null, null, 722, 1396], [1, 2, 2, 0, 1], [null, 0.65, null]], // ヒーニアス
                        [442, [null, WeaponRefinementType.Hp2_Def3, null, null, null, null, 717, 1396], [0, 0, 0, 0, 2], [null, 0.65, 0.65]], // ユアン
                        [548, [-1, null, -1, -1, -1, -1, -1, 1401], [3, 2, 0, 3, 0], [null, 0.4, null]], // レッドシーフ1
                        [208, [null, null, null, null, 509, null, null, 1396], [2, 1, 3, 0, 0], [null, 0.6, 0.6]], // ラーチェル
                        [548, [-1, null, -1, -1, -1, -1, -1, 1400], [1, 0, 0, 0, 3], [null, 0.4, null]], // レッドシーフ2
                    ];
                }
                break;
            case MapType.ResonantBattles_1:
                {
                    heroInfos = [
                        // [英雄インデックス, [スキルID]]
                        [253, [null, null, null, null, 547, null, null, 1396], [25, 21, 0, 12, 12], [null, null, null]], // カアラ
                        [549, [-1, null, -1, -1, -1, -1, -1, 1402], [22, 2, 1, 10, 0], [null, null, null]], // ブルーシーフ1
                        [550, [-1, null, -1, -1, -1, -1, -1, 1401], [23, 2, 3, 11, 2], [null, null, null]], // グリーンシーフ1
                        [550, [-1, null, -1, -1, -1, -1, -1, 1400], [23, 0, 1, 11, 1], [null, null, null]], // グリーンシーフ2
                        [30, [null, WeaponRefinementType.Special_Hp3, null, 497, null, 611, null, 1396], [26, 17, 1, 8, 1], [null, null, null]], // フロリーナ
                        [81, [null, WeaponRefinementType.Hp5_Res4, null, null, 527, null, null, 1396], [21, 21, 0, 9, 2], [null, null, null]], // エリウッド
                        [85, [null, WeaponRefinementType.Hp2_Spd2, null, 497, null, 609, null, 1396], [20, 21, 2, 15, 9], [null, null, null]], // ニノ
                        [548, [-1, null, -1, -1, -1, -1, -1, 1399], [22, 0, 0, 8, 0], [null, null, null]], // レッドシーフ1
                        [548, [-1, null, -1, -1, -1, -1, -1, 1398], [22, 1, 0, 11, 2], [null, null, null]], // レッドシーフ2
                        [255, [null, null, null, null, null, null, null, 1396], [23, 22, 3, 18, 8], [null, null, null]], // 飛行ニノ
                        [104, [null, WeaponRefinementType.Hp2_Spd2, null, null, null, 623, null, 1396], [25, 17, 2, 8, 12], [null, null, null]], // ジャファル
                        [549, [-1, null, -1, -1, -1, -1, -1, 1397], [22, 1, 3, 10, 1], [null, null, null]], // ブルーシーフ2
                    ];
                }
                break;
            default:
                heroInfos = [
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                ];
                break;
        }
        if (onlyGrowthRate) {
            for (let i = 0; i < heroInfos.length; ++i) {
                heroInfos[i][1] = null;
                heroInfos[i][2] = null;
            }
        }
        this.__setUnitsForResonantBattlesImpl(heroInfos);
    }

    applyResonantBattleEnemyStatus() {
        let currentUnit = this.currentUnit;
        if (currentUnit == null) {
            return;
        }

        // 初期化
        {
            currentUnit.hpMult = 1.5;
            currentUnit.atkMult = 1.5;
            currentUnit.spdMult = 1.0;
            currentUnit.defMult = 1.0;
            currentUnit.resMult = 1.0;
            currentUnit.hpAdd = 0;
            currentUnit.atkAdd = 0;
            currentUnit.spdAdd = 0;
            currentUnit.defAdd = 0;
            currentUnit.resAdd = 0;
            g_appData.__updateStatusBySkillsAndMerges(currentUnit, true);
        }

        let targetHp = Number(this.vm.rbEnemySettingInputHp);
        let targetAtk = Number(this.vm.rbEnemySettingInputAtk);
        let targetSpd = Number(this.vm.rbEnemySettingInputSpd);
        let targetDef = Number(this.vm.rbEnemySettingInputDef);
        let targetRes = Number(this.vm.rbEnemySettingInputRes);

        currentUnit.hpAdd = targetHp - currentUnit.maxHpWithSkills;
        currentUnit.atkAdd = targetAtk - currentUnit.atkWithSkills;
        currentUnit.spdAdd = targetSpd - currentUnit.spdWithSkills;

        {
            let addValue = targetDef - currentUnit.defWithSkills;
            while (addValue > 3) {
                currentUnit.defGrowthRate += 0.05;
                g_appData.__updateStatusBySkillsAndMerges(currentUnit);
                addValue = targetDef - currentUnit.defWithSkills;
            }
            currentUnit.defGrowthRate = Math.round(currentUnit.defGrowthRate * 100) * 0.01
            currentUnit.defAdd = addValue;
        }

        {
            let addValue = targetRes - currentUnit.resWithSkills;
            while (addValue > 3) {
                currentUnit.resGrowthRate += 0.05;
                g_appData.__updateStatusBySkillsAndMerges(currentUnit);
                addValue = targetRes - currentUnit.resWithSkills;
            }
            currentUnit.resGrowthRate = Math.round(currentUnit.resGrowthRate * 100) * 0.01
            currentUnit.resAdd = addValue;
        }

        g_appData.__updateStatusBySkillsAndMerges(currentUnit);
    }

    __setUnitStatusAdd(unit, addStatuses, growthRates, enableHpMult, enableAtkMult) {
        let i = 0;
        if (addStatuses != null && addStatuses[i] != null) {
            if (enableHpMult) {
                unit.hpMult = 1.5;
            }
            else {
                unit.hpMult = 1;
            }
            unit.hpAdd = addStatuses[i];
        }
        ++i;
        if (addStatuses != null && addStatuses[i] != null) {
            if (enableAtkMult) {
                unit.atkMult = 1.5;
            }
            else {
                unit.atkMult = 1;
            }
            unit.atkAdd = addStatuses[i];
        }
        ++i;
        if (addStatuses != null && addStatuses[i] != null) {
            unit.spdAdd = addStatuses[i];
        }
        ++i;
        if (addStatuses != null && addStatuses[i] != null) {
            unit.defAdd = addStatuses[i];
        }
        ++i;
        if (addStatuses != null && addStatuses[i] != null) {
            unit.resAdd = addStatuses[i];
        }

        if (growthRates != null && growthRates[0] != null) {
            unit.hpGrowthRate = growthRates[0];
        }
        if (growthRates != null && growthRates[1] != null) {
            unit.defGrowthRate = growthRates[1];
        }
        if (growthRates != null && growthRates[2] != null) {
            unit.resGrowthRate = growthRates[2];
        }
    }

    __setUnitSkills(unit, skillIds) {
        let i = 0;
        if (skillIds[i] != null) {
            unit.weapon = skillIds[i];
        }
        ++i;
        if (skillIds[i] != null) {
            unit.weaponRefinement = skillIds[i];
        }
        ++i;
        if (skillIds[i] != null) {
            unit.support = skillIds[i];
        }
        ++i;
        if (skillIds[i] != null) {
            unit.special = skillIds[i];
        }
        ++i;
        if (skillIds[i] != null) {
            unit.passiveA = skillIds[i];
        }
        ++i;
        if (skillIds[i] != null) {
            unit.passiveB = skillIds[i];
        }
        ++i;
        if (skillIds[i] != null) {
            unit.passiveC = skillIds[i];
        }
        ++i;
        if (skillIds[i] != null) {
            unit.passiveS = skillIds[i];
        }
        return unit;
    }

    writeProgress(message) {
        g_appData.ocrProgress = message;
    }
    ocrProgress(p, label) {
        this.writeProgress(`${label}: ` + p.status + " " + Math.round(p.progress * 100) + "%");
    }
    clearOcrProgress() {
        this.writeProgress("");
    }

    findSimilarHeroNameInfo(partialName, epithet) {
        let result = this.__findSimilarNameInfo(
            partialName,
            g_appData.heroInfos.data,
            info => {
                let pureName = info.pureNames[0];
                let nameDiff = calcSimilarity(partialName, pureName);
                let epithetDiff = calcSimilarity(epithet, info.epithet);
                // console.log(`${partialName} - ${pureName} = ${nameDiff}`);
                // console.log(`${epithet} - ${info.epithet} = ${epithetDiff}`);
                return nameDiff + epithetDiff;
            }
        );

        if (result != null) {
            let replacedPartialName = adjustChars(partialName);
            this.writeDebugLogLine(`${replacedPartialName}(${epithet}) is similar to ${result[0].pureNames[0]}(${result[0].epithet})(${result[1]})`);
        }
        return result;
    }

    __findSimilarStatusName(partialName) {
        const statusNames = ["HP", "攻撃", "速さ", "守備", "魔防"];
        for (let statusName of statusNames) {
            if (partialName[0] == statusName[0]) {
                return statusName;
            }
        }

        let result = this.__findSimilarNameInfo(
            partialName,
            statusNames,
            info => {
                return calcSimilarity(partialName, info);
            }
        );
        if (result != null) {
            let replacedPartialName = adjustChars(partialName);
            this.writeDebugLogLine(`${replacedPartialName} is similar to ${result[0]}(${result[1]})`);
        }
        return result[0];
    }

    __removeExplanationFromSkillName(name) {
        let index = name.indexOf("(");
        if (index < 0) {
            return name;
        }
        return name.substring(0, index);
    }

    findSimilarNameSkill(partialName, infos) {
        let result = this.__findSimilarNameInfo(
            partialName,
            infos,
            info => {
                return calcSimilarity(partialName, this.__removeExplanationFromSkillName(info.name));
            }
        );
        if (result != null) {
            let replacedPartialName = adjustChars(partialName);
            this.writeDebugLogLine(`${replacedPartialName} is similar to ${result[0].name}(${result[1]})`);
        }
        return result;
    }

    findSimilarNameSkillFromNameCandidates(partialName, names) {
        let result = this.__findSimilarName(
            partialName,
            names,
            name => {
                return calcSimilarity(partialName, this.__removeExplanationFromSkillName(name));
            }
        );
        if (result != null) {
            let replacedPartialName = adjustChars(partialName);
            this.writeDebugLogLine(`${replacedPartialName} is similar to ${result[0]}(${result[1]})`);
        }
        return result;
    }

    __findSimilarName(partialName, names, calcSimilarityFunc) {
        let diffThreshold = 20;
        let minDiff = 1000;
        let minName = null;
        for (let name of names) {
            let diff = calcSimilarityFunc(name);
            if (diff == 0) {
                return [name, diff];
            }
            if (diff <= diffThreshold && diff < minDiff) {
                minDiff = diff;
                minName = name;
            }
        }
        if (minName == null) {
            return null;
        }

        return [minName, minDiff];
    }

    __findSimilarNameInfo(partialName, infos, calcSimilarityFunc) {
        let diffThreshold = 20;
        let minDiff = 1000;
        let minInfo = null;
        for (let info of infos) {
            let diff = calcSimilarityFunc(info);
            if (diff == 0) {
                return [info, diff];
            }
            if (diff <= diffThreshold && diff < minDiff) {
                minDiff = diff;
                minInfo = info;
            }
        }
        if (minInfo == null) {
            return null;
        }

        return [minInfo, minDiff];
    }


    get commandQueuePerAction() {
        return this.vm.commandQueuePerAction;
    }
    get commandQueue() {
        return this.vm.commandQueue;
    }

    get defenseStructureStorage() {
        return g_appData.defenseStructureStorage;
    }
    get offenceStructureStorage() {
        return g_appData.offenceStructureStorage;
    }


    resetUnitRandom() {
        for (let i = 0; i < this.vm.units.length; ++i) {
            let unit = this.vm.units[i];
            let randIndex = Math.round(Math.random() * g_appData.heroInfos.length);
            this.setHero(unit, randIndex);
        }
    }

    resetUnitsForTesting() {
        // this.resetUnitRandom();
        {
            let unit = this.vm.units[0];
            this.setHero(unit, 81);
            // moveUnitToTrashBox(unit);
            unit.isActionDone = true;
        }

        {
            let unit = this.vm.units[1];
            this.setHero(unit, 364);
            moveUnitToTrashBox(unit);
        }
        // カイネギス
        {
            let unit = this.vm.units[2];
            this.setHero(unit, 363);
            moveUnitToTrashBox(unit);
        }
        // ノノ
        {
            let unit = this.vm.units[3];
            this.setHero(unit, 73);
            unit.merge = 10;
            unit.dragonflower = 8;
            unit.ivHighStat = StatusType.Def;
            unit.weapon = 399;
            unit.weaponRefinement = WeaponRefinementType.Hp5_Res4;
            unit.support = 413;
            unit.special = Special.Aether;
            unit.passiveA = 766;
            unit.passiveB = 599;
            unit.passiveC = 909;
            unit.passiveS = 539;
            g_appData.__updateStatusBySkillsAndMerges(unit);
            unit.resetMaxSpecialCount();
            moveUnitToTrashBox(unit);
        }

        // 総選挙アイク
        {
            let unit = this.vm.units[4];
            this.setHero(unit, 163);
            unit.weaponRefinement = WeaponRefinementType.Special_Hp3;
            g_appData.__updateStatusBySkillsAndMerges(unit);
            unit.resetMaxSpecialCount();
            moveUnitToTrashBox(unit);
        }

        // ミカヤ
        {
            let unit = this.vm.units[5];
            this.setHero(unit, 203);
            // unit.support = Support.RallyAttack;
            unit.support = Support.Reposition;
            unit.special = 462;
            unit.passiveA = PassiveA.DeathBlow3;
            unit.passiveB = PassiveB.Kyuen3;
            unit.passiveC = 680;
            unit.passiveS = 509;
            unit.merge = 1;
            g_appData.__updateStatusBySkillsAndMerges(unit);
            unit.resetMaxSpecialCount();
            // moveUnitToTrashBox(unit);
        }

        // エイル
        {
            let unit = this.vm.units[6];
            this.setHero(unit, 316);
            unit.merge = 6;
            unit.dragonflower = 3;
            unit.ivHighStat = StatusType.Atk;
            unit.weapon = Weapon.SplashyBucketPlus;
            unit.passiveA = PassiveA.DeathBlow3;
            unit.passiveB = PassiveB.Ridatsu3;
            unit.passiveS = PassiveB.KyokugiHiKo3;
            moveUnitToTrashBox(unit);
        }

        // // ピアニー
        // {
        //     let unit = this.vm.units[7];
        //     this.setHero(unit, 456);
        //     moveUnitToTrashBox(unit);
        // }

        // // リーフ
        // {
        //     let unit = this.vm.units[8];
        //     this.setHero(unit, 439);
        //     unit.passiveA = PassiveA.LifeAndDeath3;
        //     unit.passiveB = PassiveB.Vantage3;
        //     unit.passiveC = PassiveC.SavageBlow3;
        //     unit.dragonflower = 3;
        //     moveUnitToTrashBox(unit);
        // }

        // ナーガ
        {
            let unit = this.vm.units[7];
            this.setHero(unit, 381);
            unit.support = Support.Smite;
            unit.passiveA = PassiveA.Fury3;
            unit.passiveB = 648;
            unit.PassiveS = PassiveB.KyokugiHiKo3;
            unit.dragonflower = 5;
            unit.merge = 4;
            g_appData.__updateStatusBySkillsAndMerges(unit);
            unit.resetMaxSpecialCount();
            moveUnitToTrashBox(unit);
        }

        // リン
        {
            let unit = this.vm.units[8];
            this.setHero(unit, 166);
            unit.weapon = Weapon.YushaNoYumiPlus;
            unit.support = Support.Reposition;
            unit.passiveA = PassiveA.LifeAndDeath3;
            unit.passiveB = PassiveB.Vantage3;
            unit.passiveC = PassiveC.SavageBlow3;
            unit.PassiveS = PassiveA.Atk3;
            unit.dragonflower = 3;
            unit.merge = 3;
            g_appData.__updateStatusBySkillsAndMerges(unit);
            unit.resetMaxSpecialCount();
            moveUnitToTrashBox(unit);
        }

        // ラインハルト
        {
            let unit = this.vm.units[9];
            this.setHero(unit, 98);
            unit.summonerLevel = SummonerLevel.S;
            unit.blessing1 = BlessingType.Hp5_Atk3;
            unit.blessing2 = BlessingType.Hp5_Def5;
            unit.merge = 7;
            unit.dragonflower = 2;
            unit.support = Support.Reposition;
            unit.special = Special.Moonbow;
            unit.passiveA = PassiveA.DeathBlow3;
            unit.passiveS = PassiveA.HpAtk2;
            g_appData.__updateStatusBySkillsAndMerges(unit);
            unit.resetMaxSpecialCount();
            moveUnitToTrashBox(unit);
        }

        // オルティナ
        {
            let unit = this.vm.units[10];
            this.setHero(unit, 452);
            unit.ivHighStat = StatusType.Atk;
            unit.ivLowStat = StatusType.Spd;
            unit.dragonflower = 4;
            unit.support = Support.Reposition;
            unit.passiveB = PassiveB.Vantage3;
            unit.passiveS = PassiveA.HeavyBlade3;
            g_appData.__updateStatusBySkillsAndMerges(unit);
            unit.resetMaxSpecialCount();
        }

        // // ノノ
        // {
        //     let unit = this.vm.units[10];
        //     this.setHero(unit, 73);
        //     unit.blessing1 = BlessingType.Hp5_Res5;
        //     unit.blessing2 = BlessingType.Hp5_Spd4;
        //     unit.merge = 10;
        //     unit.dragonflower = 8;
        //     unit.ivHighStat = StatusType.Def;
        //     unit.weapon = 399;
        //     unit.weaponRefinement = WeaponRefinementType.Hp5_Res4;
        //     unit.support = 413;
        //     unit.special = Special.Taiyo;
        //     unit.passiveA = 766;
        //     unit.passiveB = 810;
        //     unit.passiveC = 909;
        //     unit.passiveS = 599;
        //     g_appData.__updateStatusBySkillsAndMerges(unit);
        //     unit.resetMaxSpecialCount();
        // }
        moveUnit(this.vm.units[0], g_appData.map.getTile(4, 1), false);
        moveUnit(this.vm.units[5], g_appData.map.getTile(1, 1), false);
        moveUnit(this.vm.units[10], g_appData.map.getTile(4, 4), false);
    }

    __writeUnitStatusToDebugLog(unit) {
        this.writeDebugLogLine(`${unit.getNameWithGroup()}: hp=${unit.hp}, atk=${unit.atkWithSkills}, spd=${unit.spdWithSkills}, def=${unit.defWithSkills}, res=${unit.resWithSkills}`);
    }

    createDurabilityRanking() {
        let targetUnit = g_appData.getDurabilityTestAlly();
        if (targetUnit == null) {
            this.writeErrorLine("耐久テスト対象のユニットが選択されていません");
            return;
        }
        let enemyUnit = g_appData.getDurabilityTestEnemy();
        if (enemyUnit == null) {
            this.writeErrorLine("耐久テストに使用する敵ユニットが選択されていません");
            return;
        }
        this.writeLogLine(`テスト開始--------------------`);
        this.writeLogLine(`テスト対象: ${targetUnit.getNameWithGroup()}、敵: ${enemyUnit.getNameWithGroup()}`);

        // 元の状態を保存
        let serializedTurn = exportSettingsAsString();

        let self = this;
        let results = [];
        this.damageCalc.isLogEnabled = false;
        let durabilityTestLogEnabled = this.vm.durabilityTestIsLogEnabled;
        this.vm.durabilityTestIsLogEnabled = false;
        let reducedTargetSpecialCount = targetUnit.maxSpecialCount - targetUnit.specialCount;


        const startTime = Date.now();

        let dummyHeroIndices = [targetUnit.heroIndex];
        startProgressiveProcess(g_appData.heroInfos.length,
            // startProgressiveProcess(dummyHeroIndices.length,
            function (iter) {
                let heroInfo = g_appData.heroInfos.get(iter);
                // let heroInfo = g_appData.heroInfos.get(dummyHeroIndices[iter]);
                self.__durabilityTest_initUnit(targetUnit, heroInfo, enemyUnit, false, reducedTargetSpecialCount);
                self.__writeUnitStatusToDebugLog(targetUnit);

                let result = self.__durabilityTest_simulateImpl(targetUnit, enemyUnit);
                results.push({ heroInfo: heroInfo, result: result });
            },
            function (iter, iterMax) {
                $("#progress").progressbar({
                    value: iter,
                    max: iterMax,
                });

                let lastIndex = results.length - 1;
                let winRate = results[lastIndex].result.winCount / g_appData.heroInfos.length;
                let aliveRate = (results[lastIndex].result.winCount + results[lastIndex].result.drawCount) / g_appData.heroInfos.length;
                self.writeSimpleLogLine(`${iter} / ${iterMax}: 勝率 ${winRate}, 生存率 ${aliveRate}`);
            },
            function () {
                self.damageCalc.isLogEnabled = true;
                self.vm.durabilityTestIsLogEnabled = durabilityTestLogEnabled;
                results.sort((a, b) => {
                    return b.result.winCount - a.result.winCount;
                });
                for (let i = 0; i < results.length; ++i) {
                    let result = results[i];
                    let totalCount = result.result.winCount + result.result.loseCount + result.result.drawCount;
                    let winRate = result.result.winCount / totalCount;
                    console.log(`${result.heroInfo.name}: ${winRate}`);
                    self.writeDebugLogLine(`${result.heroInfo.name}: ${winRate}`);
                }
                const endTime = Date.now();
                var diffSec = (endTime - startTime) * 0.001;
                self.writeLogLine(`テスト完了(${diffSec} sec)--------------------`);

                let originalDisableAllLogs = self.disableAllLogs;
                self.disableAllLogs = true;
                importSettingsFromString(serializedTurn);
                $("#progress").progressbar({ disabled: true });
                updateAllUi();
                self.disableAllLogs = originalDisableAllLogs;
            });

    }

    beginDurabilityTest() {
        let targetUnit = g_appData.getDurabilityTestAlly();
        if (targetUnit == null) {
            this.writeErrorLine("耐久テスト対象のユニットが選択されていません");
            return;
        }
        let enemyUnit = g_appData.getDurabilityTestEnemy();
        if (enemyUnit == null) {
            this.writeErrorLine("耐久テストに使用する敵ユニットが選択されていません");
            return;
        }
        this.writeLogLine(`テスト対象: ${targetUnit.getNameWithGroup()}、敵: ${enemyUnit.getNameWithGroup()}`);

        // 元の状態を保存
        let serializedTurn = exportSettingsAsString();

        this.__durabilityTest_simulate(targetUnit, enemyUnit);

        importSettingsFromString(serializedTurn);
        updateAllUi();
    }

    plotDamage() {
        let targetUnit = g_appData.getDurabilityTestAlly();
        if (targetUnit == null) {
            this.writeErrorLine("耐久テスト対象のユニットが選択されていません");
            return;
        }
        let enemyUnit = g_appData.getDurabilityTestEnemy();
        if (enemyUnit == null) {
            this.writeErrorLine("耐久テストに使用する敵ユニットが選択されていません");
            return;
        }
        this.writeLogLine(`テスト対象: ${targetUnit.getNameWithGroup()}、敵: ${enemyUnit.getNameWithGroup()}`);

        // 元の状態を保存
        let serializedTurn = exportSettingsAsString();

        this.__plotDamageImpl(targetUnit, enemyUnit);

        importSettingsFromString(serializedTurn);
        updateAllUi();
    }

    get isAutoChangeDetailEnabled() {
        return this.vm.autoChangeDetail;
    }

    * enumerateAllUnits() {
        for (let unit of this.vm.units) {
            yield unit;
        }
    }

    * enumerateAllUnitsOnMap(predicator = null) {
        for (let unit of this.vm.units) {
            if (unit.isOnMap) {
                if (predicator == null || predicator(unit)) {
                    yield unit;
                }
            }
        }
    }

    __getCurrentUnit() {
        return g_appData.currentUnit;
    }

    setHeroByIndex(unitIndex, heroIndex) {
        this.setHero(this.vm.units[unitIndex], heroIndex);
    }

    setHero(unit, heroIndex) {
        if (unit.heroIndex == heroIndex) {
            return;
        }

        g_appData.initializeByHeroInfo(unit, heroIndex);
    }

    gainCurrentTurn() {
        if (this.vm.currentTurn > 6) {
            return;
        }
        g_appData.commandQueuePerAction.clear();
        if (this.vm.currentTurn > 0 && this.vm.currentTurnType == UnitGroupType.Ally) {
            this.vm.currentTurnType = UnitGroupType.Enemy;
            return;
        }
        this.vm.currentTurnType = UnitGroupType.Ally;
        ++this.vm.currentTurn;
        this.__turnChanged();
    }
    backToZeroTurn() {
        this.clearLog();
        this.commandQueuePerAction.undoAll();
        if (this.vm.currentTurn > 0) {
            this.vm.currentTurn = 0;
            loadSettings();
        }
        else {
            updateAllUi();
        }
        this.__turnChanged();
    }
    backCurrentTurn() {
        if (g_app.vm.currentTurn < 1) {
            return;
        }
        g_appData.commandQueuePerAction.clear();
        if (this.vm.currentTurn > 0 && this.vm.currentTurnType == UnitGroupType.Enemy) {
            this.vm.currentTurnType = UnitGroupType.Ally;
            return;
        }
        this.vm.currentTurnType = UnitGroupType.Enemy;
        --g_app.vm.currentTurn;
        this.__turnChanged();
    }

    __turnChanged() {
    }

    resetUnits(heroIndex) {
        for (let unit of this.vm.units) {
            g_appData.initializeByHeroInfo(unit, heroIndex);
        }

        this.clearDamageCalcSummary();
    }

    findNameOfPassiveASkill(id) {
        return this.__findNameOfSkill(this.vm.passiveAOptions, id);
    }
    findNameOfPassiveCSkill(id) {
        return this.__findNameOfSkill(this.vm.passiveCOptions, id);
    }

    __findNameOfSkill(skillOptions, id) {
        for (let option of skillOptions) {
            if (option.id == id) {
                return option.text;
            }
        }

        return "";
    }

    get currentUnit() {
        return g_appData.currentUnit;
    }

    setCurrentUnit(id) {
        this.setCurrentItemIndex(this.__findIndexOfUnit(id));
    }

    setCurrentItem(id) {
        let index = g_appData.findIndexOfItem(id);
        this.setCurrentItemIndex(index);
    }

    setCurrentItemIndex(index) {
        this.vm.currentItemIndex = index;
    }
    deselectItem() {
        this.vm.currentItemIndex = -1;
    }

    setDamageCalcSummary(attacker, attackTarget, attackerInfo, attackTargetInfo) {
        if (attacker.groupId == UnitGroupType.Ally) {
            this.__setAttackerUnit(attacker.id);
            this.__setAttackTargetUnit(attackTarget.id);
            this.vm.attackerInfo = attackerInfo;
            this.vm.attackTargetInfo = attackTargetInfo;
        } else {
            this.__setAttackerUnit(attackTarget.id);
            this.__setAttackTargetUnit(attacker.id);
            this.vm.attackerInfo = attackTargetInfo;
            this.vm.attackTargetInfo = attackerInfo;
        }
    }
    __setAttackerUnit(id) {
        this.vm.attackerUnitIndex = this.__findIndexOfUnit(id);
    }

    __setAttackTargetUnit(id) {
        this.vm.attackTargetUnitIndex = this.__findIndexOfUnit(id);
    }

    useItem(itemType) {
        let self = this;
        this.__enqueueCommand(`${getItemTypeName(itemType)}使用`, function () {
            switch (itemType) {
                case ItemType.RakuraiNoJufu:
                    for (let unit of self.enumerateEnemyUnitsOnMap()) {
                        unit.takeDamage(20, true);
                    }
                    break;
                case ItemType.KobuNoTsunobue:
                    for (let unit of self.enumerateAllyUnitsOnMap()) {
                        unit.applyAllBuff(6);
                    }
                    break;
                case ItemType.KogunNoBoots:
                    for (let unit of self.enumerateAllyUnitsOnMap()) {
                        unit.addStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                    break;
                case ItemType.Tokkoyaku:
                    for (let unit of self.enumerateAllyUnitsOnMap()) {
                        unit.heal(99);
                    }
                    break;
                case ItemType.OugiNoYaiba:
                    for (let unit of self.enumerateAllyUnitsOnMap()) {
                        unit.reduceSpecialCountToZero();
                    }
                    break;
                case ItemType.OdorikoNoVeru:
                    {
                        let candidates = [];
                        for (let unit of self.enumerateAllyUnitsOnMap()) {
                            if (unit.isActionDone) {
                                candidates.push(unit);
                            }
                        }
                        let index = getRandomInt(candidates.length);
                        let target = candidates[index];
                        target.isActionDone = false;
                    }
                    break;
            }
        });
        this.__executeAllCommands(this.commandQueuePerAction, 0);
        updateAllUi();
        g_appData.removeItem(itemType);
    }

    setCurrentAetherRaidOffensePreset() {
        this.writeDebugLogLine(`模擬戦の攻撃編成設定 ${this.vm.aetherRaidOffensePresetIndex} を適用`);
        let setting = this.__findAetherRaidOffensePresetSetting(this.vm.aetherRaidOffensePresetIndex);
        importSettingsFromString(
            setting,
            true,
            false,
            false,
            false,
            false);
        updateAllUi();
    }

    setCurrentAetherRaidDefensePreset() {
        this.writeDebugLogLine(`模擬戦の防衛設定 ${this.vm.aetherRaidDefensePreset} を適用`);
        let setting = this.__findAetherRaidDefensePresetSetting(this.vm.aetherRaidDefensePreset);
        importSettingsFromString(
            setting,
            false,
            true,
            false,
            true,
            false);
        this.vm.map.isTrapIconOverlayDisabled = true;
        updateAllUi();
    }

    __findAetherRaidDefensePresetSetting(id) {
        let preset = findAetherRaidDefensePreset(id);
        if (preset == null) {
            return null;
        }
        return preset.setting;
    }

    __findAetherRaidOffensePresetSetting(index) {
        let preset = null;
        if (this.vm.isLightSeason) {
            if (index < AetherRaidOffensePresetOptions_LightSeason.length) {
                preset = AetherRaidOffensePresetOptions_LightSeason[index];
            }
            else {
                preset = AetherRaidOffensePresetOptions_LightSeason[AetherRaidOffensePresetOptions_LightSeason.length - 1];
            }
        }
        else {
            if (index < AetherRaidOffensePresetOptions_AstraSeason.length) {
                preset = AetherRaidOffensePresetOptions_AstraSeason[index];
            }
            else {
                preset = AetherRaidOffensePresetOptions_AstraSeason[AetherRaidOffensePresetOptions_AstraSeason.length - 1];
            }
        }

        return preset.setting;
    }


    writeSimpleLogLine(log) {
        if (this.disableAllLogs) {
            return;
        }

        this.vm.simpleLog += "<span style='font-size:10px;color:#000000'>" + log + '</span><br/>';
    }

    writeErrorLine(log) {
        let error = "<span style='font-size:14px;color:red'>" + log + '</span><br/>';
        this.vm.damageCalcLog += error;
        this.writeSimpleLogLine(error);
    }

    writeWarningLine(log) {
        let warnning = "<span style='font-size:14px;color:blue'>" + log + '</span><br/>';
        this.vm.damageCalcLog += warnning;
        this.writeSimpleLogLine(warnning);
    }

    writeLog(log) {
        if (this.disableAllLogs) {
            return;
        }
        this.vm.damageCalcLog += log;
    }

    writeLogLine(log) {
        if (this.disableAllLogs) {
            return;
        }
        this.vm.damageCalcLog += "<span style='font-size:14px'>" + log + '</span><br/>';
    }

    writeDebugLogLine(log) {
        if (this.disableAllLogs || this.vm.showDetailLog == false) {
            return;
        }
        this.vm.damageCalcLog += "<span style='font-size:10px;color:#666666;'>" + log + '</span><br/>';
    }

    clearSimpleLog() {
        this.vm.simpleLog = "";
    }

    clearLog() {
        this.vm.damageCalcLog = "";
    }
    clearAllLogs() {
        this.clearLog();
        this.clearSimpleLog();
    }

    * enumerateUnits(predicator = null) {
        for (let unit of this.vm.units) {
            if (predicator == null || predicator(unit)) {
                yield unit;
            }
        }
    }

    __findIndexOfUnit(id) {
        for (let i = 0; i < this.vm.units.length; ++i) {
            let unit = this.vm.units[i];
            if (unit.id == id) {
                return i;
            }
        }

        return -1;
    }

    findUnitById(id) {
        return g_appData.findUnitById(id);
    }

    registerHeroOptions(heroInfos) {
        using(new ScopedStopwatch(time => this.writeDebugLogLine("英雄情報の登録: " + time + " ms")), () => {
            if (heroInfos.length == 0) {
                return;
            }

            for (let i = 0; i < heroInfos.length; ++i) {
                let heroInfo = heroInfos[i];
                this.vm.heroOptions.push({ id: i, text: heroInfo.name });
                let weaponType = stringToWeaponType(heroInfo.weaponType);
                let moveType = heroInfo.moveType;
                this.__registerInheritableWeapons(heroInfo);
                this.__registerInheritableSkills(heroInfo.supportOptions, this.vm.supportOptions, [g_appData.supportInfos],
                    x => (!x.canInherit && heroInfo.supports.includes(x.id))
                        || this.__isInheritableSkill(weaponType, moveType, x));
                this.__registerInheritableSkills(heroInfo.specialOptions, this.vm.specialOptions, [g_appData.specialInfos],
                    x => (!x.canInherit && heroInfo.specials.includes(x.id))
                        || this.__isInheritableSkill(weaponType, moveType, x));
                this.__registerInheritableSkills(heroInfo.passiveAOptions, this.vm.passiveAOptions, [g_appData.passiveAInfos],
                    x => (!x.canInherit && heroInfo.passiveAs.includes(x.id))
                        || this.__isInheritableSkill(weaponType, moveType, x));
                this.__registerInheritableSkills(heroInfo.passiveBOptions, this.vm.passiveBOptions, [g_appData.passiveBInfos],
                    x => (!x.canInherit && heroInfo.passiveBs.includes(x.id))
                        || this.__isInheritableSkill(weaponType, moveType, x));
                this.__registerInheritableSkills(heroInfo.passiveCOptions, this.vm.passiveCOptions, [g_appData.passiveCInfos],
                    x => (!x.canInherit && heroInfo.passiveCs.includes(x.id))
                        || this.__isInheritableSkill(weaponType, moveType, x));
                this.__registerInheritableSkills(heroInfo.passiveSOptions, this.vm.passiveSOptions, [g_appData.passiveAInfos, g_appData.passiveBInfos, g_appData.passiveCInfos, g_appData.passiveSInfos],
                    x => (x.isSacredSealAvailable || x.type == SkillType.PassiveS) && this.__isInheritableSkill(weaponType, moveType, x));

                // this.__markUnsupportedSkills(heroInfo.weaponOptions, [Weapon], [g_appData.weaponInfos]);
                // this.__markUnsupportedSkills(heroInfo.supportOptions, [Support], [g_appData.supportInfos]);
                // this.__markUnsupportedSkills(heroInfo.specialOptions, [Special], [g_appData.specialInfos]);
                // this.__markUnsupportedSkills(heroInfo.passiveAOptions, [PassiveA], [g_appData.passiveAInfos]);
                // this.__markUnsupportedSkills(heroInfo.passiveBOptions, [PassiveB], [g_appData.passiveBInfos]);
                // this.__markUnsupportedSkills(heroInfo.passiveCOptions, [PassiveC], [g_appData.passiveCInfos]);
                // this.__markUnsupportedSkills(heroInfo.passiveSOptions, [PassiveS, PassiveA, PassiveB, PassiveC], [g_appData.passiveSInfos, g_appData.passiveAInfos, g_appData.passiveBInfos, g_appData.passiveSInfos]);
            }
        });
        using(new ScopedStopwatch(time => g_app.writeDebugLogLine("英雄データベースの初期化: " + time + " ms")), () => {
            g_appData.initHeroInfos(heroInfos);
        });
    }
    __isInheritableSkill(weaponType, moveType, skillInfo) {
        return isInheritableWeaponType(weaponType, skillInfo.inheritableWeaponTypes) && skillInfo.inheritableMoveTypes.includes(moveType);
    }
    __registerInheritableSkills(options, allOptions, allInfos, canInheritFunc) {
        let noneOption = allOptions[0];
        options.push(noneOption);
        for (let infos of allInfos) {
            for (let info of infos) {
                if (canInheritFunc(info)) {
                    let name = this.skillIdToNameDict[info.id];
                    options.push({ id: info.id, text: name });
                }
            }
        }
        // this.__sortSkillOptionsAlphabetically(options);
    }

    __registerInheritableWeapons(heroInfo) {
        // 装備可能な武器の設定
        heroInfo.weaponOptions = [];
        heroInfo.weaponOptions.push(this.vm.weaponOptions[0]);
        for (let info of g_appData.weaponInfos) {
            if (!this.__canEquipWeapon(info, heroInfo)) {
                continue;
            }

            // 上位武器がある武器を除外
            // if (this.__isPlusWeaponAvailable(info.name)) {
            //     continue;
            // }

            let name = this.skillIdToNameDict[info.id];
            heroInfo.weaponOptions.push({ id: info.id, text: name });
        }
        // if (heroInfo.weaponOptions.length == 1) {
        //     throw new Error(`Undefined weapon type "${heroInfo.weaponType}"`);
        // }
    }

    __isPlusWeaponAvailable(weaponName) {
        let plusWeaponName = weaponName + "+";
        for (let info of g_appData.weaponInfos) {
            if (info.name == plusWeaponName) {
                return true;
            }
        }
        return false;
    }

    __canEquipWeapon(weaponInfo, heroInfo) {
        if (!weaponInfo.canInherit) {
            return heroInfo.weapons.includes(weaponInfo.id);
        }

        if (heroInfo.weaponType == weaponTypeToString(weaponInfo.weaponType)
            || (heroInfo.weaponType.includes("暗器") > 0 && isWeaponTypeDagger(weaponInfo.weaponType))
            || (heroInfo.weaponType.includes("弓") > 0 && isWeaponTypeBow(weaponInfo.weaponType))
            || (heroInfo.weaponType.includes("竜") > 0 && isWeaponTypeBreath(weaponInfo.weaponType))
            || (heroInfo.weaponType.includes("獣") > 0 && isWeaponTypeBeast(weaponInfo.weaponType))
        ) {
            return true;
        }

        return false;
    }



    * __enumerateElemOfArrays(arrays) {
        for (let array of arrays) {
            for (let elem of array) {
                yield elem;
            }
        }
    }

    * enumerateSkillInfos() {
        for (let info of g_appData.weaponInfos) {
            yield info;
        }
        for (let info of g_appData.supportInfos) {
            yield info;
        }
        for (let info of g_appData.specialInfos) {
            yield info;
        }
        for (let info of g_appData.passiveAInfos) {
            yield info;
        }
        for (let info of g_appData.passiveBInfos) {
            yield info;
        }
        for (let info of g_appData.passiveCInfos) {
            yield info;
        }
        for (let info of g_appData.passiveSInfos) {
            yield info;
        }
    }

    __findPassiveAInfoByName(name) {
        return this.__findSkillInfoByName(g_appData.passiveAInfos, name);
    }

    __findWeaponInfo(id) {
        return g_appData.__findWeaponInfo(id);
    }

    __findSupportInfo(id) {
        return g_appData.__findSupportInfo(id);
    }

    __findSpecialInfo(id) {
        return g_appData.__findSpecialInfo(id);
    }

    __findPassiveAInfo(id) {
        return g_appData.__findPassiveAInfo(id);
    }
    __findPassiveBInfo(id) {
        return g_appData.__findPassiveBInfo(id);
    }
    __findPassiveCInfo(id) {
        return g_appData.__findPassiveCInfo(id);
    }
    __findPassiveSInfo(id) {
        return g_appData.__findPassiveSInfo(id);
    }

    __findSkillInfoByName(skillInfos, name) {
        for (let info of skillInfos) {
            if (info.name == name) {
                return info;
            }
        }

        return null;
    }

    __findSkillInfo(skillInfos, id) {
        return __findSkillInfo(skillInfos, id);
    }

    __findSkillInfoFromArrays(skillInfoArrays, id) {
        for (let skillInfos of skillInfoArrays) {
            for (let info of skillInfos) {
                if (info.id == id) {
                    return info;
                }
            }
        }

        return null;
    }

    registerSkillOptions(weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs) {
        let self = this;
        using(new ScopedStopwatch(time => self.writeDebugLogLine("スキル情報の登録: " + time + " ms")), () => {
            g_appData.registerSkillOptions(weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs);

            self.passiveSkillCharWhiteList = "";
            self.weaponSkillCharWhiteList = "";
            self.supportSkillCharWhiteList = "";
            self.specialSkillCharWhiteList = "";
            for (let info of g_appData.weaponInfos) {
                info.type = SkillType.Weapon;
                self.weaponSkillCharWhiteList += info.name;

                info.weaponRefinementOptions.push(self.vm.weaponRefinementOptions[0]);
                if (info.hasSpecialWeaponRefinement) {
                    if (info.specialRefineHpAdd == 3) {
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Special_Hp3, text: "特殊、HP+3" });
                    }
                    else {
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Special, text: "特殊" });

                        // 間違ってるものが多いのでHP+3もとりあえず出しておく
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Special_Hp3, text: "特殊、HP+3" });
                    }
                }

                if (info.weaponType == WeaponType.Staff) {
                    info.weaponRefinementOptions.push({ id: WeaponRefinementType.WrathfulStaff, text: "神罰の杖" });
                    info.weaponRefinementOptions.push({ id: WeaponRefinementType.DazzlingStaff, text: "幻惑の杖" });
                    continue;
                }

                if (info.hasStatusWeaponRefinement) {
                    if (isRangedWeaponType(info.weaponType)) {
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Hp2_Atk1, text: "HP+2、攻撃+1" });
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Hp2_Spd2, text: "HP+2、速さ+2" });
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Hp2_Def3, text: "HP+2、守備+3" });
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Hp2_Res3, text: "HP+2、魔防+3" });
                    }
                    else {
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Hp5_Atk2, text: "HP+5、攻撃+2" });
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Hp5_Spd3, text: "HP+5、速さ+3" });
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Hp5_Def4, text: "HP+5、守備+4" });
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Hp5_Res4, text: "HP+5、魔防+4" });
                    }
                }
            }
            for (let info of g_appData.supportInfos) {
                info.type = SkillType.Support;
                self.supportSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.specialInfos) {
                info.type = SkillType.Special;
                self.specialSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.passiveAInfos) {
                info.type = SkillType.PassiveA;
                self.passiveSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.passiveBInfos) {
                info.type = SkillType.PassiveB;
                self.passiveSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.passiveCInfos) {
                info.type = SkillType.PassiveC;
                self.passiveSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.passiveSInfos) {
                info.type = SkillType.PassiveS;
                self.passiveSkillCharWhiteList += info.name;
            }

            distinctStr(self.supportSkillCharWhiteList);
            distinctStr(self.specialSkillCharWhiteList);
            distinctStr(self.passiveSkillCharWhiteList);
            distinctStr(self.weaponSkillCharWhiteList);

            // 対応してないスキルに目印×をつける
            self.__markUnsupportedSkills(self.vm.weaponOptions, [Weapon], [g_appData.weaponInfos], () => ++self.vm.weaponCount, () => ++self.vm.weaponImplCount);
            self.__markUnsupportedSkills(self.vm.supportOptions, [Support], [g_appData.supportInfos], () => ++self.vm.supportCount, () => ++self.vm.supportImplCount);
            self.__markUnsupportedSkills(self.vm.specialOptions, [Special], [g_appData.specialInfos], () => ++self.vm.specialCount, () => ++self.vm.specialImplCount);
            self.__markUnsupportedSkills(self.vm.passiveAOptions, [PassiveA], [g_appData.passiveAInfos], () => ++self.vm.passiveACount, () => ++self.vm.passiveAImplCount);
            self.__markUnsupportedSkills(self.vm.passiveBOptions, [PassiveB], [g_appData.passiveBInfos], () => ++self.vm.passiveBCount, () => ++self.vm.passiveBImplCount);
            self.__markUnsupportedSkills(self.vm.passiveCOptions, [PassiveC], [g_appData.passiveCInfos], () => ++self.vm.passiveCCount, () => ++self.vm.passiveCImplCount);
            self.__markUnsupportedSkills(self.vm.passiveSOptions, [PassiveS, PassiveA, PassiveB, PassiveC], [g_appData.passiveSInfos, g_appData.passiveAInfos, g_appData.passiveBInfos, g_appData.passiveSInfos], () => ++self.vm.passiveSCount, () => ++self.vm.passiveSImplCount);

            // アルファベットソート(今は全スキルのオプションをメインで使ってないので速度優先でソートは無効化)
            // self.__sortSkillOptionsAlphabetically(self.vm.weaponOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.supportOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.specialOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.passiveAOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.passiveBOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.passiveCOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.passiveSOptions);
        });
    }
    outputSkillsNotImplemented() {
        let optionDict = {};
        for (let option of this.__enumerateSkillOptionsNotImplemented()) {
            optionDict[option.text] = option;
        }
        this.writeDebugLogLine("未実装スキル-----");
        for (let text in optionDict) {
            this.writeDebugLogLine(text);
        }
    }
    *__enumerateSkillOptionsNotImplemented() {
        let self = this;
        for (let option of self.vm.weaponOptions) {
            if (option.text.startsWith("×")) {
                yield option;
            }
        }
        for (let option of self.vm.supportOptions) {
            if (option.text.startsWith("×")) {
                yield option;
            }
        }
        for (let option of self.vm.specialOptions) {
            if (option.text.startsWith("×")) {
                yield option;
            }
        }
        for (let option of self.vm.passiveAOptions) {
            if (option.text.startsWith("×")) {
                yield option;
            }
        }
        for (let option of self.vm.passiveBOptions) {
            if (option.text.startsWith("×")) {
                yield option;
            }
        }
        for (let option of self.vm.passiveCOptions) {
            if (option.text.startsWith("×")) {
                yield option;
            }
        }
        for (let option of self.vm.passiveSOptions) {
            if (option.text.startsWith("×")) {
                yield option;
            }
        }
    }
    __sortSkillOptionsAlphabetically(options) {
        options.sort(function (a, b) {
            if (a.id == -1) { return -1; }
            if (b.id == -1) { return 1; }
            if (a.text < b.text) { return -1; }
            if (a.text > b.text) { return 1; }
            return 0;
        });
    }
    __markUnsupportedSkills(skillOptions, supportedSkillEnums, infoLists, countFunc = null, countImplFunc = null) {
        for (let skill of skillOptions) {
            if (skill < 0) {
                continue;
            }
            if (countFunc != null) {
                countFunc();
            }

            let isImplemented = this.__isImplementedSkill(skill, supportedSkillEnums, infoLists);
            if (!isImplemented) {
                skill.text = "×" + skill.text;
            }
            else if (countImplFunc != null) {
                countImplFunc();
            }

            this.skillIdToNameDict[skill.id] = skill.text;
        }
    }

    __findSkillNameFromSkillOptions(skillId, options) {
        let option = options.find(x => x.id == skillId);
        if (option == null) {
            return "不明";
        }

        return option.text;
    }

    __isImplementedSkill(skill, supportedSkillEnums, infoLists) {
        let skillInfo = this.__findSkillInfoFromArrays(infoLists, skill.id);
        let isImplRequired = (skillInfo == null || skillInfo.isAdditionalImplRequired)
        return !isImplRequired || this.__isSupportedSkill(skill, supportedSkillEnums);
    }

    __isSupportedSkill(skill, supportedSkillEnums) {
        for (let supportedSkillEnum of supportedSkillEnums) {
            for (var key in supportedSkillEnum) {
                if (skill.id == supportedSkillEnum[key]) {
                    return true;
                }
            }
        }
        return false;
    }

    /// 戦闘ダメージを計算し、計算結果に基づき、ユニットの状態を更新します。戦闘後に発動するスキルの効果も反映されます。
    updateDamageCalculation(atkUnit, defUnit, tileToAttack = null) {
        // 攻撃対象以外の戦闘前の範囲奥義ダメージ
        if (atkUnit.battleContext.isSpecialActivated && isRangedAttackSpecial(atkUnit.special)) {
            // 範囲攻撃ダメージを周囲の敵に反映
            for (let tile of g_appData.map.enumerateRangedSpecialTiles(defUnit.placedTile, atkUnit.special)) {
                if (tile.placedUnit != null
                    && tile.placedUnit != defUnit
                    && tile.placedUnit.groupId == defUnit.groupId
                ) {
                    let targetUnit = tile.placedUnit;
                    let damage = this.damageCalc.calcPrecombatDamage(atkUnit, targetUnit);
                    this.writeLogLine(
                        atkUnit.specialInfo.name + "により" +
                        targetUnit.getNameWithGroup() + "に" + damage + "ダメージ");
                    targetUnit.takeDamage(damage, true);
                }
            }
        }

        // 攻撃
        let result = this.calcDamage(atkUnit, defUnit, tileToAttack);

        // this.clearSimpleLog();
        this.writeSimpleLogLine(this.damageCalc.simpleLog);
        this.writeLogLine(this.damageCalc.log);

        // 戦闘の計算結果を反映させる
        {
            atkUnit.applyRestHpAndTemporarySpecialCount();
            atkUnit.endAction();

            defUnit.applyRestHpAndTemporarySpecialCount();

            if (defUnit != result.defUnit) {
                // 護り手で一時的に戦闘対象が入れ替わっているケース
                result.defUnit.applyRestHpAndTemporarySpecialCount();

                // 戦闘後スキル効果の対象外にしなければいけないので一旦マップ上から除外
                defUnit.saveOriginalTile();
                defUnit.placedTile = null;
            }
        }

        // 戦闘後発動のスキル等を評価
        this.__applyPostCombatProcess(atkUnit, result.defUnit, result, defUnit == result.defUnit);

        if (defUnit != result.defUnit) {
            // 護り手で一時的に戦闘対象が入れ替わっていたので元に戻す
            let saverUnit = result.defUnit;
            if (!saverUnit.isDead) {
                saverUnit.restoreOriginalTile();
            }
            defUnit.restoreOriginalTile();
            this.updateAllUnitSpur();
        }

        // 戦闘後の移動系スキルを加味する必要があるので後段で評価
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.TwinCrestPower:
                    if (!atkUnit.isOneTimeActionActivatedForWeapon
                        && atkUnit.snapshot.restHpPercentage >= 25
                        && atkUnit.isTransformed
                        && atkUnit.isActionDone
                    ) {
                        this.writeLogLine(atkUnit.getNameWithGroup() + "は" + atkUnit.weaponInfo.name + "により再行動");
                        atkUnit.isActionDone = false;
                        atkUnit.isOneTimeActionActivatedForWeapon = true;
                    }
                    break;
                case PassiveB.RagingStorm:
                    if (!atkUnit.isOneTimeActionActivatedForPassiveB
                        && !this.__isThereAllyInSpecifiedSpaces(atkUnit, 1)
                        && atkUnit.isActionDone
                    ) {
                        this.writeLogLine(atkUnit.getNameWithGroup() + "は" + atkUnit.passiveBInfo.name + "により再行動");
                        atkUnit.isActionDone = false;
                        atkUnit.isOneTimeActionActivatedForPassiveB = true;
                    }
                    break;
            }
        }

        // 戦闘済みであるフラグの有効化
        {
            g_appData.isCombatOccuredInCurrentTurn = true;
        }

        // 再行動奥義
        if (atkUnit.specialCount == 0
            && !atkUnit.isOneTimeActionActivatedForSpecial
            && atkUnit.isActionDone
        ) {
            switch (atkUnit.special) {
                case Special.NjorunsZeal:
                    this.__activateRefreshSpecial(atkUnit);
                    atkUnit.addStatusEffect(StatusEffectType.Gravity);
                    break;
                case Special.Galeforce:
                    this.__activateRefreshSpecial(atkUnit);
                    break;
            }
        }

        // 再移動の評価
        this.__activateCantoIfPossible(atkUnit);

        // unit.endAction()のタイミングが戦闘後処理の前でなければいけないので、endUnitActionは直接呼べない
        this.__goToNextPhaseIfAllActionDone(atkUnit.groupId);
    }

    /// 戦闘結果の評価や戦闘後発動のスキルなどを適用します。
    __applyPostCombatProcess(atkUnit, defUnit, result, isMoveSkillEnabled) {
        // 戦闘後のダメージ、回復の合計を反映させないといけないので予約HPとして計算
        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.initReservedHp();
        }

        // 最初の戦闘のみで発動する状態効果は、状態が付与されていない戦闘も最初の戦闘にカウントするので
        // 強制的にtrueにする
        this.__setOnetimeActionFlag(atkUnit);
        this.__setOnetimeActionFlag(defUnit);

        // 戦闘後発動のスキル効果
        if (atkUnit.isAlive) {
            if (result.atkUnit_actualTotalAttackCount > 0) {
                this.writeDebugLogLine(atkUnit.getNameWithGroup() + "の戦闘後発動のスキル効果を評価");
                this.__applyOverlappableSkillEffectFromAttackerAfterCombat(atkUnit, defUnit);
                this.__applyAttackSkillEffectAfterCombat(atkUnit, defUnit);
            }

            this.__applySkillEffectAfterCombatForUnit(atkUnit, defUnit);
        }

        if (defUnit.isAlive) {
            if (result.defUnit_actualTotalAttackCount > 0) {
                this.__applyAttackSkillEffectForDefenseAfterCombat(defUnit, atkUnit);
                this.__applyAttackSkillEffectAfterCombat(defUnit, atkUnit);
            }
            this.__applySkillEffectAfterCombatForUnit(defUnit, atkUnit);
        }

        if (result.atkUnit_actualTotalAttackCount > 0) {
            this.__applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(atkUnit, defUnit);
        }
        this.__applySkillEffectAfterCombatNeverthelessDeadForUnit(atkUnit, defUnit, result.atkUnit_actualTotalAttackCount);

        if (result.defUnit_actualTotalAttackCount > 0) {
            this.__applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(defUnit, atkUnit);
        }
        this.__applySkillEffectAfterCombatNeverthelessDeadForUnit(defUnit, atkUnit, result.defUnit_actualTotalAttackCount);

        // 不治の幻煙による回復無効化
        {
            if (atkUnit.battleContext.invalidatesHeal) {
                defUnit.reservedHeal = 0;
            }
            if (defUnit.battleContext.invalidatesHeal) {
                atkUnit.reservedHeal = 0;
            }
        }

        // 奥義カウントやHP変動の加減値をここで確定
        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.modifySpecialCount();
            if (!unit.isDead) {
                unit.applyReservedHp(true);
            }
        }

        // 切り込みなどの移動系スキル
        if (isMoveSkillEnabled && atkUnit.isAlive) {
            this.__applyMovementSkillAfterCombat(atkUnit, defUnit);
        }

        if (atkUnit.hp == 0) {
            this.audioManager.playSoundEffect(SoundEffectId.Dead);

            // マップからの除外と追跡対象の更新
            let updateRequiredTile = atkUnit.placedTile;
            moveUnitToTrashBox(atkUnit);
            this.__updateChaseTargetTilesForSpecifiedTile(updateRequiredTile);
        }
        else if (defUnit.hp == 0) {
            this.audioManager.playSoundEffect(SoundEffectId.Dead);
            switch (defUnit.passiveS) {
                case PassiveS.TozokuNoGuzoRakurai:
                    g_appData.resonantBattleItems.push(ItemType.RakuraiNoJufu);
                    break;
                case PassiveS.TozokuNoGuzoKobu:
                    g_appData.resonantBattleItems.push(ItemType.KobuNoTsunobue);
                    break;
                case PassiveS.TozokuNoGuzoKogun:
                    g_appData.resonantBattleItems.push(ItemType.KogunNoBoots);
                    break;
                case PassiveS.TozokuNoGuzoKusuri:
                    g_appData.resonantBattleItems.push(ItemType.Tokkoyaku);
                    break;
                case PassiveS.TozokuNoGuzoOdori:
                    g_appData.resonantBattleItems.push(ItemType.OdorikoNoVeru);
                    break;
                case PassiveS.TozokuNoGuzoOugi:
                    g_appData.resonantBattleItems.push(ItemType.OugiNoYaiba);
                    break;
            }

            // マップからの除外と追跡対象の更新
            let updateRequiredTile = defUnit.placedTile;
            moveUnitToTrashBox(defUnit);
            this.__updateChaseTargetTilesForSpecifiedTile(updateRequiredTile);
        }
    }

    __activateRefreshSpecial(atkUnit) {
        this.writeLogLine(atkUnit.getNameWithGroup() + "が" + atkUnit.specialInfo.name + "を発動");
        atkUnit.isOneTimeActionActivatedForSpecial = true;
        atkUnit.specialCount = atkUnit.maxSpecialCount;
        atkUnit.isActionDone = false;
    }

    __canActivateSaveSkill(atkUnit, unit) {
        for (let skillId of unit.enumerateSkills()) {
            switch (skillId) {
                case PassiveC.ArFarSave3:
                    if (atkUnit.isRangedWeaponType()) {
                        return true;
                    }
                    break;
                case PassiveC.AdNearSave3:
                case PassiveC.DrNearSave3:
                    if (atkUnit.isMeleeWeaponType()) {
                        return true;
                    }
                    break;
            }
        }

        return false;
    }

    __getSaverUnitIfPossible(atkUnit, defUnit) {
        let saverUnit = null;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 2, false)) {
            if (defUnit.placedTile == null
                || !defUnit.placedTile.isMovableTileForUnit(unit)
            ) {
                continue;
            }

            if (this.__canActivateSaveSkill(atkUnit, unit)) {
                if (saverUnit != null) {
                    // 複数発動可能な場合は発動しない
                    return null;
                }

                saverUnit = unit;
            }
        }

        return saverUnit;
    }

    /// 一時的に戦闘のダメージを計算します。
    calcDamageTemporary(
        atkUnit,
        defUnit,
        tileToAttack = null,
        calcPotentialDamage = false
    ) {
        let result = this.calcDamage(atkUnit, defUnit, tileToAttack, calcPotentialDamage);
        if (defUnit != result.defUnit) {
            // 護り手で一時的に戦闘対象が入れ替わっていたので元に戻す
            let saverUnit = result.defUnit;
            let tile = saverUnit.placedTile;
            saverUnit.restoreOriginalTile();
            this.updateAllUnitSpur();
            tile.setUnit(defUnit);
        }
        return result;
    }

    /// 戦闘のダメージを計算します。
    calcDamage(
        atkUnit,
        defUnit,
        tileToAttack = null,
        calcPotentialDamage = false
    ) {

        atkUnit.battleContext.clear();
        atkUnit.battleContext.hpBeforeCombat = atkUnit.hp;
        atkUnit.battleContext.initiatesCombat = true;

        defUnit.battleContext.clear();
        defUnit.battleContext.hpBeforeCombat = defUnit.hp;
        defUnit.battleContext.initiatesCombat = false;

        let origTile = atkUnit.placedTile;
        let isUpdateSpurRequired = true; // 戦闘中強化をリセットするために必ず必要
        if (tileToAttack != null) {
            // 攻撃ユニットの位置を一時的に変更
            // this.writeDebugLogLine(atkUnit.getNameWithGroup() + "の位置を(" + tileToAttack.posX + ", " + tileToAttack.posY + ")に変更");
            tileToAttack.setUnit(atkUnit);

            isUpdateSpurRequired = true;
        }

        if (isUpdateSpurRequired) {
            this.__updateUnitSpur(atkUnit, calcPotentialDamage);
            this.__updateUnitSpur(defUnit, calcPotentialDamage);
        }

        atkUnit.saveCurrentHpAndSpecialCount();
        defUnit.saveCurrentHpAndSpecialCount();

        // 範囲奥義と戦闘中のどちらにも効くスキル効果の適用
        this.__applySkillEffectForPrecombatAndCombat(atkUnit, defUnit, calcPotentialDamage);
        this.__applySkillEffectForPrecombatAndCombat(defUnit, atkUnit, calcPotentialDamage);

        // 戦闘前ダメージ計算
        this.damageCalc.clearLog();
        let preCombatDamage = this.damageCalc.calcPreCombatDamage(atkUnit, defUnit);

        // 戦闘開始時の状態を保存
        atkUnit.createSnapshot();
        defUnit.createSnapshot();

        let actualDefUnit = defUnit;
        if (!calcPotentialDamage) {
            let saverUnit = this.__getSaverUnitIfPossible(atkUnit, defUnit);
            if (saverUnit != null) {
                saverUnit.saveOriginalTile();

                // Tile.placedUnit に本当は配置ユニットが設定されないといけないが、
                // 1マスに複数ユニットが配置される状況は考慮していなかった。
                // おそらく戦闘中だけの設定であれば不要だと思われるので一旦設定無視してる。
                // todo: 必要になったら、Tile.placedUnit を複数設定できるよう対応する
                saverUnit.placedTile = defUnit.placedTile;
                saverUnit.setPos(saverUnit.placedTile.posX, saverUnit.placedTile.posY);

                saverUnit.battleContext.clear();
                saverUnit.battleContext.hpBeforeCombat = defUnit.hp;
                saverUnit.battleContext.initiatesCombat = defUnit.battleContext.initiatesCombat;
                saverUnit.battleContext.isSaviorActivated = true;
                saverUnit.saveCurrentHpAndSpecialCount();
                saverUnit.createSnapshot();

                actualDefUnit = saverUnit;
                this.updateAllUnitSpur(calcPotentialDamage);
            }
        }

        let result = this.__calcDamageImpl(atkUnit, actualDefUnit);

        result.preCombatDamage = preCombatDamage;

        if (tileToAttack != null) {
            // ユニットの位置を元に戻す
            setUnitToTile(atkUnit, origTile);
        }

        // 計算のために変更した紋章値をリセット
        if (isUpdateSpurRequired) {
            this.updateAllUnitSpur();
        }
        return result;
    }

    __calcDamageImpl(atkUnit, defUnit, calcPotentialDamage) {
        this.__applyImpenetrableDark(atkUnit, defUnit, calcPotentialDamage);
        this.__applyImpenetrableDark(defUnit, atkUnit, calcPotentialDamage);

        this.__applySkillEffect(atkUnit, defUnit, calcPotentialDamage);
        this.__applySkillEffectForUnit(atkUnit, defUnit, calcPotentialDamage);
        this.__applySkillEffectForUnit(defUnit, atkUnit, calcPotentialDamage);

        this.__applySkillEffectRelatedToEnemyStatusEffects(atkUnit, defUnit, calcPotentialDamage);
        this.__applySkillEffectRelatedToEnemyStatusEffects(defUnit, atkUnit, calcPotentialDamage);


        // 紋章を除く味方ユニットからの戦闘中バフ
        {
            this.__applySkillEffectForAttackerAndDefenderFromAllies(atkUnit, defUnit);
            this.__applySkillEffectFromAllies(atkUnit, defUnit, calcPotentialDamage);
            this.__applySkillEffectFromAllies(defUnit, atkUnit, calcPotentialDamage);
        }

        // 武器情報等からの設定反映
        {
            this.__setAttackCount(atkUnit, defUnit);
            this.__setAttackCount(defUnit, atkUnit);

            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.FalcionEchoes:
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.snapshot.restHpPercentage == 100) {
                                atkUnit.battleContext.attackCount = 2;
                            }
                        }
                        break;
                    case Weapon.WhitedownSpear:
                        if (this.__countAlliesWithinSpecifiedSpaces(atkUnit, 2, x =>
                            x.moveType == MoveType.Flying) >= 2
                        ) {
                            atkUnit.battleContext.attackCount = 2;
                        }
                        break;
                    case Weapon.ShirokiNoTyokusou:
                    case Weapon.ShirokiNoTyouken:
                    case Weapon.ShirokiNoTansou:
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (this.__countAlliesWithinSpecifiedSpaces(atkUnit, 2, x =>
                                x.moveType == MoveType.Flying) >= 2
                            ) {
                                atkUnit.battleContext.attackCount = 2;
                            }
                        }
                        break;
                    case Weapon.KurohyoNoYari:
                    case Weapon.MogyuNoKen:
                        if (this.__isThereAllyInSpecifiedSpaces(atkUnit, 2, x =>
                            x.moveType == MoveType.Cavalry
                            && (x.weaponType == WeaponType.Sword
                                || x.weaponType == WeaponType.Lance
                                || x.weaponType == WeaponType.Axe)
                        )) {
                            atkUnit.battleContext.attackCount = 2;
                        }
                        break;
                    case PassiveB.Shishirenzan:
                        if (atkUnit.snapshot.isRestHpFull) {
                            atkUnit.battleContext.attackCount = 2;
                        }
                        break;
                }
            }

            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.WakakiKurohyoNoKen:
                    case Weapon.WakakiMogyuNoYari:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(defUnit, 2, x =>
                                x.moveType == MoveType.Cavalry
                                && (x.weaponType == WeaponType.Sword
                                    || x.weaponType == WeaponType.Lance
                                    || x.weaponType == WeaponType.Axe)
                            )) {
                                atkUnit.battleContext.counterattackCount = 2;
                            }
                        }
                        break;
                }
            }

            // 神罰の杖
            this.__setWrathfulStaff(atkUnit, defUnit);
            this.__setWrathfulStaff(defUnit, atkUnit);

            // 特効
            this.__setEffectiveAttackEnabledIfPossible(atkUnit, defUnit);
            this.__setEffectiveAttackEnabledIfPossible(defUnit, atkUnit);

            // スキル内蔵の全距離反撃
            defUnit.battleContext.canCounterattackToAllDistance = this.__canCounterAttackToAllDistance(defUnit);
        }

        // 戦闘中バフが決まった後に評価するスキル効果
        {
            this.__applySpurForUnitAfterCombatStatusFixed(atkUnit, defUnit, calcPotentialDamage);
            this.__applySpurForUnitAfterCombatStatusFixed(defUnit, atkUnit, calcPotentialDamage);

            this.__applySkillEffectAfterCombatStatusFixed(atkUnit, defUnit, calcPotentialDamage);
            this.__applySkillEffectForUnitAfterCombatStatusFixed(atkUnit, defUnit, calcPotentialDamage);
            this.__applySkillEffectForUnitAfterCombatStatusFixed(defUnit, atkUnit, calcPotentialDamage);
        }

        // 敵が反撃可能か判定
        defUnit.battleContext.canCounterattack = this.__canCounterAttack(atkUnit, defUnit);
        // this.writeDebugLogLine(defUnit.getNameWithGroup() + "の反撃可否:" + defUnit.battleContext.canCounterattack);

        // 追撃可能か判定
        atkUnit.battleContext.canFollowupAttack = this.__examinesCanFollowupAttackForAttacker(atkUnit, defUnit, calcPotentialDamage);
        if (defUnit.battleContext.canCounterattack) {
            defUnit.battleContext.canFollowupAttack = this.__examinesCanFollowupAttackForDefender(atkUnit, defUnit, calcPotentialDamage);
        }

        // 追撃可能かどうかが条件として必要なスキル効果の適用
        {
            this.__applySkillEffectRelatedToFollowupAttackPossibility(atkUnit, defUnit);
            this.__applySkillEffectRelatedToFollowupAttackPossibility(defUnit, atkUnit);
        }

        // 効果を無効化するスキル
        {
            this.__applyInvalidationSkillEffect(atkUnit, defUnit);
            this.__applyInvalidationSkillEffect(defUnit, atkUnit);
        }

        // 奥義
        {
            this.__applySpecialSkillEffect(atkUnit, defUnit);
            this.__applySpecialSkillEffect(defUnit, atkUnit);
        }

        let result = this.damageCalc.calc(atkUnit, defUnit);
        result.atkUnit_atk = atkUnit.getAtkInCombat(defUnit);
        result.atkUnit_spd = atkUnit.getSpdInCombat(defUnit);
        result.atkUnit_def = atkUnit.getDefInCombat(defUnit);
        result.atkUnit_res = atkUnit.getResInCombat(defUnit);

        result.defUnit_atk = defUnit.getAtkInCombat(atkUnit);
        result.defUnit_spd = defUnit.getSpdInCombat(atkUnit);
        result.defUnit_def = defUnit.getDefInCombat(atkUnit);
        result.defUnit_res = defUnit.getResInCombat(atkUnit);
        return result;
    }

    __applySpecialSkillEffect(targetUnit, enemyUnit) {
        switch (targetUnit.special) {
            case Special.Kagetsuki:
            case Special.Moonbow:
                // 月虹
                targetUnit.battleContext.specialSufferPercentage = 30;
                break;
            case Special.Luna:
                // 月光
                targetUnit.battleContext.specialSufferPercentage = 50;
                break;
            case Special.KuroNoGekko:
                targetUnit.battleContext.specialSufferPercentage = 80;
                break;
            case Special.Aether:
            case Special.AoNoTenku:
            case Special.RadiantAether2:
            case Special.MayhemAether:
                // 天空
                targetUnit.battleContext.specialSufferPercentage = 50;
                break;
            case Special.LunaFlash: {
                // 月光閃
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.2);
                targetUnit.battleContext.specialSufferPercentage = 20;
                break;
            }

            case Special.Hoshikage:
            case Special.Glimmer:
                // 凶星
                targetUnit.battleContext.specialMultDamage = 1.5;
                break;
            case Special.Deadeye:
                targetUnit.battleContext.specialMultDamage = 2;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                break;
            case Special.Astra: {
                // 流星
                targetUnit.battleContext.specialMultDamage = 2.5;
                break;
            }
            case Special.Hotarubi:
            case Special.Bonfire:
                // 緋炎
                {
                    let totalDef = targetUnit.getDefInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalDef * 0.5);
                }
                break;
            case Special.Ignis:
                // 華炎
                {
                    let totalDef = targetUnit.getDefInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalDef * 0.8);
                }
                break;
            case Special.Hyouten:
            case Special.Iceberg:
                // 氷蒼
                {
                    let totalRes = targetUnit.getResInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.5);
                }
                break;
            case Special.Glacies:
                // 氷華
                {
                    let totalRes = targetUnit.getResInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.8);
                }
                break;
            case Special.HolyKnightAura:
                // グランベルの聖騎士
                {
                    let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalAtk * 0.25);
                }
                break;
            case Special.Fukuryu:
            case Special.DraconicAura:
                // 竜裂
                {
                    let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalAtk * 0.3);
                }
                break;
            case Special.DragonFang: {
                // 竜穿
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalAtk * 0.5);
                break;
            }
            case Special.ShiningEmblem:
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.35);
                }
                break;
            case Special.HonoNoMonsyo:
            case Special.HerosBlood:
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
                }
                break;
            case Special.RighteousWind:
            case Special.Sirius:
                // 聖風
                // 天狼
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
                }
                break;
            case Special.TwinBlades: // 双刃
                {
                    let totalRes = targetUnit.getResInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.4);
                    targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                }
                break;
            case Special.RupturedSky: {
                if (isWeaponTypeBeast(enemyUnit.weaponType) || isWeaponTypeBreath(enemyUnit.weaponType)) {
                    targetUnit.battleContext.specialAddDamage = Math.trunc(enemyUnit.getAtkInCombat(targetUnit) * 0.4);
                }
                else {
                    targetUnit.battleContext.specialAddDamage = Math.trunc(enemyUnit.getAtkInCombat(targetUnit) * 0.2);
                }
                break;
            }
            case Special.SublimeHeaven:
                if (isWeaponTypeBeast(enemyUnit.weaponType) || isWeaponTypeBreath(enemyUnit.weaponType)) {
                    targetUnit.battleContext.specialAddDamage = Math.trunc(targetUnit.getAtkInCombat(enemyUnit) * 0.5);
                }
                else {
                    targetUnit.battleContext.specialAddDamage = Math.trunc(targetUnit.getAtkInCombat(enemyUnit) * 0.25);
                }
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                break;
            case Special.RegnalAstra:
            case Special.ImperialAstra:
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.4);
                }
                break;
            case Special.OpenTheFuture:
                {
                    let totalDef = targetUnit.getDefInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalDef * 0.5);
                }
                break;
            case Special.BlueFrame:
                targetUnit.battleContext.specialAddDamage = 10;
                for (let tile of targetUnit.placedTile.neighbors) {
                    if (tile.placedUnit != null && tile.placedUnit.groupId == targetUnit.groupId) {
                        targetUnit.battleContext.specialAddDamage += 15;
                        break;
                    }
                }
                break;
        }
    }

    /// 追撃可能かどうかが条件として必要なスキル効果の適用
    __applySkillEffectRelatedToFollowupAttackPossibility(targetUnit, enemyUnit) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.VengefulLance:
                    {
                        if (!this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)
                            && !targetUnit.battleContext.canFollowupAttack
                        ) {
                            targetUnit.battleContext.rateOfAtkMinusDefForAdditionalDamage = 0.5;
                        }
                    }
                    break;
            }
        }
    }

    __canCounterAttackToAllDistance(defUnit) {
        if (defUnit.weaponInfo == null) {
            return false;
        }

        if (defUnit.weaponInfo.canCounterattackToAllDistance) {
            return true;
        }
        if (defUnit.passiveAInfo != null && defUnit.passiveAInfo.canCounterattackToAllDistance) {
            return true;
        }

        switch (defUnit.weapon) {
            case Weapon.Kurimuhirudo:
                if (this.__isThereAllyInSpecifiedSpaces(defUnit, 2)) {
                    return true;
                }
                break;
            case Weapon.Amatsu:
            case Weapon.Puji:
                if (defUnit.snapshot.restHpPercentage >= 50) {
                    return true;
                }
                break;
            case Weapon.TwinCrestPower:
            case Weapon.ShishiouNoTsumekiba:
                if (defUnit.isTransformed) {
                    return true;
                }
                break;
            case Weapon.OgonNoTanken:
                if (defUnit.isSpecialCharged) {
                    return true;
                }
                break;
        }

        return false;
    }

    __applyImpenetrableDark(targetUnit, enemyUnit, calcPotentialDamage) {
        switch (targetUnit.passiveC) {
            case PassiveC.ImpenetrableDark:
                this.__updateUnitSpur(enemyUnit, calcPotentialDamage, true);
                break;
        }
    }

    __setWrathfulStaff(atkUnit, defUnit) {
        if (this.__canInvalidateWrathfulStaff(defUnit)) {
            return;
        }

        let atkWeaponInfo = this.__findSkillInfo(g_appData.weaponInfos, atkUnit.weapon);
        let passiveBInfo = this.__findSkillInfo(g_appData.passiveBInfos, atkUnit.passiveB);

        // 神罰の杖
        if ((atkWeaponInfo != null && atkWeaponInfo.wrathfulStaff)
            || (passiveBInfo != null && passiveBInfo.wrathfulStaff)
            || (atkUnit.weaponRefinement == WeaponRefinementType.WrathfulStaff)
        ) {
            atkUnit.battleContext.wrathfulStaff = true;
        }
    }

    __canInvalidateWrathfulStaff(unit) {
        for (let skillId of unit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.SeimeiNoGofu3:
                case Weapon.SplashyBucketPlus:
                    return true;
            }
        }
        return false;
    }

    __setAttackCount(atkUnit, enemyUnit) {
        let atkWeaponInfo = this.__findSkillInfo(g_appData.weaponInfos, atkUnit.weapon);
        if (atkWeaponInfo != null) {
            atkUnit.battleContext.attackCount = atkWeaponInfo.attackCount;
            atkUnit.battleContext.counterattackCount = atkWeaponInfo.counterattackCount;
        }
        else {
            atkUnit.battleContext.attackCount = 0;
            atkUnit.battleContext.counterattackCount = 0;
        }

        // Triangle Attack
        if (atkUnit.hasStatusEffect(StatusEffectType.TriangleAttack)) {
            let triangleAttackerCount = 0;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 2, false)) {
                if (unit.hasStatusEffect(StatusEffectType.TriangleAttack)) {
                    triangleAttackerCount++;
                }
            }
            if (atkUnit.battleContext.initiatesCombat && triangleAttackerCount >= 2) {
                atkUnit.battleContext.attackCount = 2;
            }
        }

        switch (atkUnit.weapon) {
            case Weapon.GullinkambiEgg:
                {
                    if (atkUnit.battleContext.initiatesCombat
                        && enemyUnit.snapshot.restHpPercentage >= 75
                        && g_appData.isCombatOccuredInCurrentTurn
                    ) {
                        atkUnit.battleContext.attackCount = 2;
                    }
                }
                break;
            case Weapon.RazuwarudoNoMaiken:
                {
                    let count = this.__countAlliesWithinSpecifiedSpaces(atkUnit, 3, x =>
                        x.buffTotal >= 10);
                    if (count >= 2) {
                        atkUnit.battleContext.attackCount = 2;
                        atkUnit.battleContext.counterattackCount = 2;
                    }
                }
                break;
        }
    }

    __applyInvalidationSkillEffect(atkUnit, defUnit) {
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.HolyYewfelle:
                    if (atkUnit.battleContext.initiatesCombat || defUnit.snapshot.restHpPercentage >= 75) {
                        defUnit.battleContext.increaseCooldownCountForAttack = false;
                        defUnit.battleContext.increaseCooldownCountForDefense = false;
                        defUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.SyunsenAiraNoKen:
                    if (atkUnit.isWeaponRefined) {
                        defUnit.battleContext.increaseCooldownCountForAttack = false;
                        defUnit.battleContext.increaseCooldownCountForDefense = false;
                        defUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.TenteiNoKen:
                    defUnit.battleContext.increaseCooldownCountForAttack = false;
                    defUnit.battleContext.increaseCooldownCountForDefense = false;
                    defUnit.battleContext.reducesCooldownCount = false;
                    break;
            }
        }
    }

    __canCounterAttack(atkUnit, defUnit) {
        return this.__examinesCanCounterattackBasically(atkUnit, defUnit)
            && !this.__isCounterAttackDisabled(atkUnit, defUnit);
    }

    __isTherePartnerInSpace2(unit) {
        return this.__isThereAnyAllyUnit(unit,
            x => unit.calculateDistanceToUnit(x) <= 2
                && unit.partnerHeroIndex == x.heroIndex);
    }
    __isTherePartnerInSpace3(unit) {
        return this.__isThereAnyAllyUnit(unit,
            x => unit.calculateDistanceToUnit(x) <= 3
                && unit.partnerHeroIndex == x.heroIndex);
    }

    __isCounterAttackDisabled(atkUnit, defUnit) {
        if (this.__isCounterAttackDisabledImpl(atkUnit, defUnit)) {
            if (!defUnit.hasPassiveSkill(PassiveB.MikiriHangeki3)) {
                return true;
            }
        }
        return false;
    }

    __isCounterAttackDisabledImpl(atkUnit, defUnit) {
        if (defUnit.hasStatusEffect(StatusEffectType.CounterattacksDisrupted)) {
            return true;
        }

        if (atkUnit.battleContext.invalidatesCounterattack) {
            return true;
        }

        switch (atkUnit.weapon) {
            case Weapon.SurvivalistBow:
                if (this.__isSolo(atkUnit) && defUnit.snapshot.restHpPercentage >= 80) {
                    return true;
                }
                break;
            case Weapon.Nizuheggu:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (isWeaponTypeTome(defUnit.weaponType) || isWeaponTypeBreath(defUnit.weaponType)) {
                        return true;
                    }
                }
                break;
            case Weapon.GeneiLongBow:
                if (atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)) {
                    return true;
                }
                break;
            case Weapon.SnipersBow:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.snapshot.restHpPercentage >= 50
                        && this.__isTherePartnerInSpace2(atkUnit)
                    ) {
                        return true;
                    }
                }
                break;
            case Weapon.EishinNoAnki:
                if (this.__isTherePartnerInSpace2(atkUnit)) {
                    return true;
                }
                break;
            case Weapon.DeathlyDagger:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (isWeaponTypeTome(defUnit.weaponType)) {
                        return true;
                    }
                }
                break;
        }

        switch (atkUnit.passiveA) {
            case PassiveA.LawsOfSacae2:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAnyUnitIn2Spaces(atkUnit)) {
                    if (defUnit.isMeleeWeaponType()) {
                        let atkUnitSpd = atkUnit.getSpdInCombat(defUnit);
                        let defUnitSpd = defUnit.getSpdInCombat(atkUnit);
                        if (atkUnitSpd >= defUnitSpd + 5) {
                            return true;
                        }
                    }
                }
                break;
        }

        // 反撃不可
        let atkWeaponInfo = this.__findSkillInfo(g_appData.weaponInfos, atkUnit.weapon);
        let passiveBInfo = this.__findSkillInfo(g_appData.passiveBInfos, atkUnit.passiveB);
        if ((atkWeaponInfo != null && atkWeaponInfo.disableCounterattack)
            || (passiveBInfo != null && passiveBInfo.disableCounterattack)
            || (atkUnit.weaponRefinement == WeaponRefinementType.DazzlingStaff)
            || (atkUnit.passiveB == PassiveB.SacaesBlessing
                && (defUnit.weaponType == WeaponType.Sword || defUnit.weaponType == WeaponType.Lance || defUnit.weaponType == WeaponType.Axe))
            || isFiresweepWeapon(atkUnit.weapon)
            || isFiresweepWeapon(defUnit.weapon)
            || (atkUnit.hasPassiveSkill(PassiveB.Kazenagi3)
                && atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)
                && isPhysicalWeaponType(defUnit.weaponType))
            || (atkUnit.hasPassiveSkill(PassiveB.Mizunagi3)
                && atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)
                && !isPhysicalWeaponType(defUnit.weaponType))
            || (atkUnit.passiveB == PassiveB.FuinNoTate && isWeaponTypeBreath(defUnit.weaponType))
        ) {
            return true;
        }
        return false;
    }

    __examinesCanCounterattackBasically(atkUnit, defUnit) {
        if (!defUnit.hasWeapon) {
            return false;
        }

        if (defUnit.battleContext.canCounterattackToAllDistance) {
            return true;
        }

        if (atkUnit.attackRange == defUnit.attackRange) {
            return true;
        }

        if (atkUnit.isRangedWeaponType()) {
            switch (defUnit.passiveA) {
                case PassiveA.DistantCounter:
                case PassiveA.OstiasCounter:
                    return true;
                case PassiveA.DistantFoil:
                    if (isPhysicalWeaponType(atkUnit.weaponType)) {
                        return true;
                    }
                    break;
                case PassiveA.DistantWard:
                    if (atkUnit.weaponType == WeaponType.Staff
                        || isWeaponTypeBreath(atkUnit.weaponType)
                        || isWeaponTypeTome(atkUnit.weaponType)) {
                        return true;
                    }
                    break;
            }
        }
        else if (atkUnit.isMeleeWeaponType()) {
            switch (defUnit.passiveA) {
                case PassiveA.CloseCounter:
                    return true;
                case PassiveA.CloseFoil:
                    if (isPhysicalWeaponType(atkUnit.weaponType)) {
                        return true;
                    }
                    break;
                case PassiveA.CloseWard:
                    if (atkUnit.weaponType === WeaponType.Staff ||
                        isWeaponTypeBreath(atkUnit.weaponType) ||
                        isWeaponTypeTome(atkUnit.weaponType)) {
                        return true;
                    }
                    break;
            }
            switch (defUnit.weapon) {
                case Weapon.DoubleBow:
                    if (this.__isSolo(defUnit)) {
                        return true;
                    }
                    break;
                case Weapon.KinsekiNoSyo:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (atkUnit.weaponType == WeaponType.Sword
                            || atkUnit.weaponType == WeaponType.Lance
                            || atkUnit.weaponType == WeaponType.Axe
                            || isWeaponTypeBeast(atkUnit.weaponType)
                        ) {
                            return true;
                        }
                    }
                    break;
            }
        }

        return false;
    }

    __canActivateBreakerSkill(breakerUnit, targetUnit) {
        // 殺し3の評価
        if (breakerUnit.snapshot.restHpPercentage < 50) { return false; }
        switch (breakerUnit.passiveB) {
            case PassiveB.Swordbreaker3: return targetUnit.weaponType == WeaponType.Sword;
            case PassiveB.Lancebreaker3: return targetUnit.weaponType == WeaponType.Lance;
            case PassiveB.Axebreaker3: return targetUnit.weaponType == WeaponType.Axe;
            case PassiveB.Bowbreaker3: return targetUnit.weaponType == WeaponType.ColorlessBow;
            case PassiveB.Daggerbreaker3: return targetUnit.weaponType == WeaponType.ColorlessDagger;
            case PassiveB.RedTomebreaker3: return targetUnit.weaponType == WeaponType.RedTome;
            case PassiveB.BlueTomebreaker3: return targetUnit.weaponType == WeaponType.BlueTome;
            case PassiveB.GreenTomebreaker3: return targetUnit.weaponType == WeaponType.GreenTome;
        }

        return false;
    }
    __isAllyCountIsGreaterThanEnemyCount(skillUnit, battleTargetUnit, calcPotentialDamage) {
        if (calcPotentialDamage) {
            return true;
        }

        let allyCount = this.__countAlliesWithinSpecifiedSpaces(skillUnit, 2, x => true);
        let enemyCount = this.__countEnemiesWithinSpecifiedSpaces(skillUnit, 2, x => x != battleTargetUnit);
        return allyCount > enemyCount;
    }

    __isEnemyCountIsGreaterThanOrEqualToAllyCount(skillUnit, battleTargetUnit, calcPotentialDamage) {
        if (calcPotentialDamage) {
            return true;
        }

        let allyCount = this.__countAlliesWithinSpecifiedSpaces(skillUnit, 2, x => true);
        let enemyCount = this.__countEnemiesWithinSpecifiedSpaces(skillUnit, 2, x => x != battleTargetUnit);
        return enemyCount >= allyCount;
    }

    /// 敵の絶対追撃を無効化できるか調べます。
    __canInvalidateAbsoluteFollowupAttack(targetUnit, enemyUnit) {
        if (targetUnit.hasPassiveSkill(PassiveB.MikiriTsuigeki3)) {
            return true;
        }
        if (targetUnit.passiveB == PassiveB.SphiasSoul) {
            return true;
        }

        if (targetUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            return true;
        }

        // 味方から受ける効果
        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
            switch (allyUnit.weapon) {
                case Weapon.ProfessorialText:
                    if (targetUnit.getSpdInCombat(enemyUnit) > enemyUnit.getSpdInCombat(targetUnit)) {
                        return true;
                    }
                    break;
            }
        }

        switch (targetUnit.weapon) {
            case Weapon.ProfessorialText:
                if (targetUnit.battleContext.initiatesCombat
                    || this.__isThereAnyUnitIn2Spaces(targetUnit)
                ) {
                    if (targetUnit.getSpdInCombat(enemyUnit) > enemyUnit.getSpdInCombat(targetUnit)) {
                        return true;
                    }
                }
                break;
            case Weapon.KenhimeNoKatana:
                if (targetUnit.isWeaponRefined) {
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            return true;
                        }
                    }
                }
                break;
            case Weapon.Failnaught:
                if (targetUnit.snapshot.restHpPercentage >= 25) {
                    return true;
                }
                break;
            case Weapon.TomeOfStorms:
                if (enemyUnit.snapshot.restHpPercentage >= 75) {
                    return true;
                }
                break;
            case Weapon.ShinenNoBreath:
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.snapshot.restHpPercentage >= 25 && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        return true;
                    }
                }
                break;
            case Weapon.SunsPercussors:
                if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                    || enemyUnit.snapshot.restHpPercentage == 100
                ) {
                    return true;
                }
                break;
            case Weapon.WindsOfChange:
                if (targetUnit.isBuffed || targetUnit.snapshot.restHpPercentage >= 50) {
                    return true;
                }
                break;
            case Weapon.HakutoshinNoNinjin:
                return true;
            case Weapon.TenteiNoKen:
                return true;
            case Weapon.Ifingr:
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    return true;
                }
                break;
            case Weapon.MaritaNoKen:
                if (this.__isSolo(targetUnit)) {
                    return true;
                }
                break;
        }
        return false;
    }

    /// 自分の追撃不可を無効化できるかを調べます。
    __canInvalidateInvalidationOfFollowupAttack(targetUnit, enemyUnit) {
        if (targetUnit.hasPassiveSkill(PassiveB.MikiriTsuigeki3)) {
            return true;
        }

        if (targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            return true;
        }

        // 味方から受ける効果
        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
            switch (allyUnit.weapon) {
                case Weapon.ProfessorialText:
                    if (targetUnit.getSpdInCombat(enemyUnit) > enemyUnit.getSpdInCombat(targetUnit)) {
                        return true;
                    }
                    break;
            }
        }

        switch (targetUnit.passiveB) {
            case PassiveB.SphiasSoul:
                return true;
            case PassiveB.KyusyuTaikei3:
                return targetUnit.battleContext.initiatesCombat;
            case PassiveB.DragonsIre3:
                return enemyUnit.battleContext.initiatesCombat && targetUnit.snapshot.restHpPercentage >= 50;
        }

        switch (targetUnit.weapon) {
            case Weapon.ProfessorialText:
                if (targetUnit.battleContext.initiatesCombat
                    || this.__isThereAnyUnitIn2Spaces(targetUnit)
                ) {
                    if (targetUnit.getSpdInCombat(enemyUnit) > enemyUnit.getSpdInCombat(targetUnit)) {
                        return true;
                    }
                }
                break;
            case Weapon.Failnaught:
                if (targetUnit.snapshot.restHpPercentage >= 25) {
                    return true;
                }
                break;
            case Weapon.TomeOfStorms:
                if (enemyUnit.snapshot.restHpPercentage >= 75) {
                    return true;
                }
                break;
            case Weapon.Thunderbrand:
                if (enemyUnit.snapshot.restHpPercentage >= 50) {
                    return true;
                }
                break;
            case Weapon.CourtlyFanPlus:
                return targetUnit.battleContext.initiatesCombat;
            case Weapon.Garumu:
                if (targetUnit.isWeaponRefined) {
                    if (targetUnit.hasPositiveStatusEffect()) {
                        return true;
                    }
                }
                break;
            case Weapon.SunsPercussors:
                if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                    || enemyUnit.snapshot.restHpPercentage == 100
                ) {
                    return true;
                }
                break;
            case Weapon.WindsOfChange:
                if (targetUnit.isBuffed || targetUnit.snapshot.restHpPercentage >= 50) {
                    return true;
                }
                break;
            case Weapon.HakutoshinNoNinjin:
                return true;
            case Weapon.TenteiNoKen:
                return true;
            case Weapon.MaritaNoKen:
                if (this.__isSolo(targetUnit)) {
                    return true;
                }
                break;
            case Weapon.TenmaNoNinjinPlus:
                if (this.damageCalc.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) == TriangleAdvantage.Advantageous) {
                    return true;
                }
                break;
        }

        return false;
    }

    __getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage) {
        let followupAttackPriority = atkUnit.battleContext.followupAttackPriority;
        if (!this.__canInvalidateAbsoluteFollowupAttack(defUnit, atkUnit)) {
            followupAttackPriority += atkUnit.battleContext.followupAttackPriorityIncrement;

            if (this.__canActivateBreakerSkill(atkUnit, defUnit)) {
                ++followupAttackPriority;
            }

            if (atkUnit.hasStatusEffect(StatusEffectType.FollowUpAttackPlus)) {
                ++followupAttackPriority;
            }

            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.BlackEagleRule:
                        if (atkUnit.snapshot.restHpPercentage >= 25) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.GateAnchorAxe:
                        if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(atkUnit, 1)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.SkyPirateClaw:
                        if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(atkUnit, 1)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.DarkScripture:
                        if (!defUnit.hasEffective(EffectiveType.Dragon)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.RagingStorm:
                        if (calcPotentialDamage ||
                            (isWeaponTypeBreathOrBeast(defUnit.weaponType)
                                && !this.__isThereAllyInSpecifiedSpaces(atkUnit, 1))
                        ) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.VoidTome:
                        if (defUnit.getSpdInPrecombat() >= 35
                            || defUnit.hasNegativeStatusEffect()
                        ) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Garumu:
                        if (atkUnit.isWeaponRefined) {
                            if (atkUnit.hasPositiveStatusEffect()) {
                                ++followupAttackPriority;
                            }
                        }
                        else if (atkUnit.isBuffed || atkUnit.isMobilityIncreased) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.AnkigoroshiNoYumi:
                    case Weapon.AnkigoroshiNoYumiPlus:
                        if (isWeaponTypeDagger(defUnit.weaponType)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.KouketsuNoSensou:
                        if ((atkUnit.snapshot.restHpPercentage == 100 && defUnit.snapshot.restHpPercentage == 100)
                            || (atkUnit.snapshot.restHpPercentage < 100 && defUnit.snapshot.restHpPercentage < 100)
                        ) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.ReginRave:
                        if (atkUnit.getAtkInCombat(defUnit) > defUnit.getAtkInCombat(atkUnit) || atkUnit.isMobilityIncreased) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.FlameSiegmund:
                    case Weapon.HadoNoSenfu:
                        if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, calcPotentialDamage)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Gyorru:
                    case Weapon.ChaosManifest:
                        if (defUnit.hasNegativeStatusEffect()) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Sekuvaveku:
                        if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(atkUnit, 3)) {
                            ++followupAttackPriority;
                        }
                        break;
                }
            }

            if (atkUnit.passiveB == PassiveB.FuinNoTate) {
                if (isWeaponTypeBreath(defUnit.weaponType)) {
                    ++followupAttackPriority;
                }
            }
            else if (atkUnit.passiveB == PassiveB.TsuigekiRing) {
                if (atkUnit.snapshot.restHpPercentage >= 50) {
                    ++followupAttackPriority;
                }
            }
        }

        if (!this.__canInvalidateInvalidationOfFollowupAttack(atkUnit, defUnit)) {
            followupAttackPriority += atkUnit.battleContext.followupAttackPriorityDecrement;

            if (defUnit.hasStatusEffect(StatusEffectType.FollowUpAttackMinus)) {
                --followupAttackPriority;
            }

            if (defUnit.hasStatusEffect(StatusEffectType.ResonantShield) && defUnit.isOneTimeActionActivatedForShieldEffect == false) {
                --followupAttackPriority;
            }
            if (atkUnit.passiveB == PassiveB.WaryFighter3 && atkUnit.snapshot.restHpPercentage >= 50) {
                --followupAttackPriority;
            }
            if (this.__canActivateBreakerSkill(defUnit, atkUnit)) {
                --followupAttackPriority;
            }

            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.Marute:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (!defUnit.battleContext.initiatesCombat
                                || atkUnit.snapshot.restHpPercentage == 100) {
                                --followupAttackPriority;
                            }
                        }

                        break;
                    case Weapon.Aymr:
                        if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(defUnit, 1)) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.HarukazeNoBreath:
                        if (this.__isThereAllyInSpecifiedSpaces(defUnit, 2)
                            || defUnit.isBuffed
                        ) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.TenraiArumazu:
                        if (this.__isAllyCountIsGreaterThanEnemyCount(defUnit, atkUnit, calcPotentialDamage)) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.AnkigoroshiNoYumi:
                    case Weapon.AnkigoroshiNoYumiPlus:
                        if (isWeaponTypeDagger(atkUnit.weaponType)) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.Buryunhirude:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (atkUnit.isRangedWeaponType()) {
                                if (defUnit.getDefInCombat(atkUnit) > atkUnit.getDefInCombat(defUnit)) {
                                    --followupAttackPriority;
                                }
                            }
                        }
                        break;
                    case Weapon.Gyorru:
                        if (atkUnit.hasNegativeStatusEffect()) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.ShintakuNoBreath:
                        if (defUnit.isBuffed) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.SarieruNoOkama:
                        if (atkUnit.isBuffed || atkUnit.isMobilityIncreased) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.ImbuedKoma:
                        if (defUnit.isSpecialCharged) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.FellBreath:
                        if (atkUnit.snapshot.restHpPercentage < 100) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.ShinenNoBreath:
                        if (defUnit.getDefInCombat(atkUnit) >= atkUnit.getDefInCombat(defUnit) + 5) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.BaraNoYari:
                        if (defUnit.getAtkInPrecombat() > atkUnit.getAtkInPrecombat()) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.GeneiBattleAxe:
                        if (this.__isThereAllyInSpecifiedSpaces(defUnit, 2)) {
                            --followupAttackPriority;
                        }
                        break;


                    case PassiveB.WaryFighter3:
                        if (defUnit.snapshot.restHpPercentage >= 50) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveB.FuinNoTate:
                        if (isWeaponTypeBreath(atkUnit.weaponType)) {
                            --followupAttackPriority;
                        }
                        break;
                }
            }

        }
        return followupAttackPriority;
    }

    __examinesCanFollowupAttackForAttacker(atkUnit, defUnit, calcPotentialDamage) {
        this.damageCalc.writeDebugLog(`${atkUnit.getNameWithGroup()}の追撃評価 ------`);
        let followupAttackPriority = this.__getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage);
        if (!this.__canInvalidateAbsoluteFollowupAttack(defUnit, atkUnit)) {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.DarkSpikesT:
                        if (atkUnit.snapshot.restHpPercentage <= 99) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.WhitedownSpear:
                        if (this.__countUnit(atkUnit.groupId, x => x.isOnMap && x.moveType == MoveType.Flying) >= 3) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Jikumunt:
                        if (atkUnit.snapshot.restHpPercentage >= 90) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.SeireiNoBreath:
                        if (atkUnit.getDefInPrecombat() >= defUnit.getDefInPrecombat() + 5) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.BoldFighter3: ++followupAttackPriority; break;
                    case Weapon.TakaouNoHashizume:
                        if (defUnit.snapshot.isRestHpFull) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (this.vm.currentTurn % 2 == 1) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (this.vm.currentTurn % 2 === 0) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.Sashitigae3:
                        if (atkUnit.snapshot.restHpPercentage <= 50 && this.__canCounterAttack(atkUnit, defUnit)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.SoulCaty:
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.snapshot.restHpPercentage <= 75 && this.__canCounterAttack(atkUnit, defUnit)) {
                                ++followupAttackPriority;
                            }
                        }
                        break;
                    case Weapon.RohyouNoKnife:
                        if ((defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) && this.__canCounterAttack(atkUnit, defUnit)) {
                            ++followupAttackPriority;
                        }
                        break;
                }
            }
        }

        if (!this.__canInvalidateInvalidationOfFollowupAttack(atkUnit, defUnit)) {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.Kazenagi3:
                        --followupAttackPriority;
                        break;
                    case PassiveB.Mizunagi3:
                        --followupAttackPriority;
                        break;
                }
            }

            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                }
            }
        }

        if (followupAttackPriority < 0) {
            // 追撃不可を受けた
            this.damageCalc.writeDebugLog(atkUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            this.damageCalc.writeDebugLog(atkUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
            return true;
        }
        else {
            // 速さ勝負
            if (this.__examinesCanFollowupAttack(atkUnit, defUnit)) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    __examinesCanFollowupAttackForDefender(atkUnit, defUnit, calcPotentialDamage) {
        this.damageCalc.writeDebugLog(`${defUnit.getNameWithGroup()}の追撃評価 ------`);
        let followupAttackPriority = this.__getFollowupAttackPriorityForBoth(defUnit, atkUnit, calcPotentialDamage);
        if (!this.__canInvalidateAbsoluteFollowupAttack(atkUnit, defUnit)) {
            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.SlickFighter3:
                        if (defUnit.snapshot.restHpPercentage >= 25) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Marute:
                        if (defUnit.isWeaponRefined) {
                            if (defUnit.snapshot.restHpPercentage >= 25) {
                                ++followupAttackPriority;
                            }
                        }
                        else if (defUnit.snapshot.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.BlueLionRule:
                        ++followupAttackPriority;
                        break;
                    case PassiveB.HolyWarsEnd:
                        if (defUnit.snapshot.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.QuickRiposte1:
                        if (defUnit.snapshot.restHpPercentage >= 90) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.QuickRiposte2:
                        if (defUnit.snapshot.restHpPercentage >= 80) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.QuickRiposte3:
                        if (defUnit.snapshot.restHpPercentage >= 70) {
                            // this.writeDebugLogLine("HP" + defUnit.snapshot.restHpPercentage + "%で切り返し発動、" + defUnit.getNameWithGroup() + "は絶対追撃");
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.DragonsIre3:
                        if (defUnit.snapshot.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.VengefulFighter3:
                        if (defUnit.snapshot.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Arumazu:
                        if (defUnit.snapshot.restHpPercentage >= 80) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.HuinNoKen:
                    case Weapon.MoumokuNoYumi:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (defUnit.snapshot.restHpPercentage >= 50) {
                                ++followupAttackPriority;
                            }
                        }
                        break;
                }
            }
        }

        if (!this.__canInvalidateInvalidationOfFollowupAttack(defUnit, atkUnit)) {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.InstantLancePlus:
                        --followupAttackPriority;
                        break;
                    case Weapon.Rifia:
                        if (atkUnit.snapshot.restHpPercentage >= 50) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.HewnLance:
                        if (atkUnit.isWeaponSpecialRefined) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.JoyfulVows:
                        if (atkUnit.hasPositiveStatusEffect(defUnit)) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.KarenNoYumi:
                        if (atkUnit.isWeaponSpecialRefined) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.BlazingDurandal:
                        if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.MasterBow:
                        if (atkUnit.groupId == UnitGroupType.Ally) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveA.KishinKongoNoSyungeki:
                    case PassiveA.KishinMeikyoNoSyungeki:
                    case PassiveA.SteadyImpact:
                    case PassiveA.SwiftImpact:
                        --followupAttackPriority;
                        break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (this.vm.currentTurn % 2 == 1) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (this.vm.currentTurn % 2 === 0) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.AijouNoHanaNoYumiPlus:
                    case Weapon.BukeNoSteckPlus:
                        --followupAttackPriority;
                        break;
                }
            }
        }

        if (atkUnit.isTransformed) {
            switch (atkUnit.weapon) {
                case Weapon.RefreshedFang:
                case Weapon.RaydreamHorn:
                case Weapon.BrightmareHorn:
                case Weapon.NightmareHorn:
                case Weapon.BrazenCatFang:
                case Weapon.NewBrazenCatFang:
                case Weapon.NewFoxkitFang:
                case Weapon.FoxkitFang:
                case Weapon.TaguelFang:
                case Weapon.TaguelChildFang:
                case Weapon.YoukoohNoTsumekiba:
                case Weapon.JunaruSenekoNoTsumekiba:
                    --followupAttackPriority;
                    break;
            }
        }

        if (followupAttackPriority < 0) {
            // 追撃不可を受けた
            this.damageCalc.writeDebugLog(defUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            this.damageCalc.writeDebugLog(defUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
            return true;
        }
        else {
            // 速さ勝負
            if (this.__examinesCanFollowupAttack(defUnit, atkUnit)) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    __examinesCanFollowupAttack(atkUnit, defUnit) {
        var totalSpdAtk = atkUnit.getSpdInCombat(defUnit);
        var totalSpdDef = defUnit.getSpdInCombat(atkUnit);
        this.damageCalc.writeDebugLog(`${atkUnit.getNameWithGroup()}の速さによる追撃評価:`);
        this.__logSpdInCombat(atkUnit, defUnit, TabChar);
        this.__logSpdInCombat(defUnit, atkUnit, TabChar);
        if (totalSpdAtk >= totalSpdDef + 5) {
            this.damageCalc.writeDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが5以上高いので追撃可能");
            return true;
        }

        this.damageCalc.writeDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが足りないので追撃不可");
        return false;
    }

    __logSpdInCombat(unit, enemyUnit, tab = "") {
        this.damageCalc.writeDebugLog(tab + unit.getNameWithGroup()
            + `の戦闘中速さ${unit.getSpdInCombat(enemyUnit)}(速さ${unit.spdWithSkills}、強化${unit.getSpdBuffInCombat(enemyUnit)}、弱化${unit.spdDebuff}、戦闘中強化${unit.spdSpur})`);
    }

    __applySkillEffectAfterCombatStatusFixed(atkUnit, defUnit, calcPotentialDamage) {
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.BoldFighter3:
                    atkUnit.battleContext.increaseCooldownCountForAttack = true;
                    break;
            }
        }

        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Misteruthin:
                    defUnit.battleContext.increaseCooldownCountForDefense = true;
                    break;
                case PassiveB.VengefulFighter3:
                    if (defUnit.snapshot.restHpPercentage >= 50) {
                        defUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
            }
        }
    }

    __applyDebuffBlade(atkUnit, defUnit) {
        if (defUnit.atkDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.atkDebuffTotal; }
        if (defUnit.spdDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.spdDebuffTotal; }
        if (defUnit.defDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.defDebuffTotal; }
        if (defUnit.resDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.resDebuffTotal; }
    }

    __applyIdealEffect(targetUnit, enemyUnit, buffFunc) {
        if (targetUnit.snapshot.restHpPercentage == 100
            || targetUnit.hasPositiveStatusEffect(enemyUnit)
        ) {
            buffFunc(targetUnit, 7);
            if (targetUnit.snapshot.restHpPercentage == 100
                && targetUnit.hasPositiveStatusEffect(enemyUnit)
            ) {
                buffFunc(targetUnit, 2);
            }
        }
    }

    __applySpurForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.SunflowerBowPlus:
                case Weapon.VictorfishPlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.defSpur += enemyUnit.getDefBuffInCombat(targetUnit);

                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.DivineSeaSpear:
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += enemyUnit.getAtkBuffInCombat(targetUnit);
                        targetUnit.spdSpur += enemyUnit.getSpdBuffInCombat(targetUnit);
                        targetUnit.defSpur += enemyUnit.getDefBuffInCombat(targetUnit);

                        enemyUnit.atkSpur -= enemyUnit.getAtkBuffInCombat(targetUnit);
                        enemyUnit.spdSpur -= enemyUnit.getSpdBuffInCombat(targetUnit);
                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.PeachyParfaitPlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.resSpur += enemyUnit.getResBuffInCombat(targetUnit);

                        enemyUnit.resSpur -= enemyUnit.getResBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.Hrimfaxi:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        this.__applyBonusDoubler(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.BladeOfRenais:
                    if (targetUnit.battleContext.initiatesCombat
                        || targetUnit.battleContext.isThereAnyUnitIn2Spaces
                    ) {
                        targetUnit.addAllSpur(5);

                        if (targetUnit.hasPositiveStatusEffect(enemyUnit)
                            || targetUnit.hasNegativeStatusEffect()
                        ) {
                            let value = Math.trunc(0.2 * enemyUnit.getDefInCombat(targetUnit));
                            targetUnit.battleContext.healedHpByAttack = value;
                        }
                    }
                    break;
                case Weapon.OrdersSentence:
                    if (targetUnit.snapshot.restHpPercentage >= 25
                        || targetUnit.hasPositiveStatusEffect(enemyUnit)
                    ) {
                        targetUnit.addAllSpur(5);

                        let maxBuff = 0;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                            maxBuff = Math.max(unit.buffTotal, maxBuff);
                        }

                        targetUnit.atkSpur += maxBuff;
                    }
                    break;
                case PassiveA.AtkSpdIdeal4:
                    this.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value; unit.spdSpur += value;
                        });
                    break;
                case PassiveA.AtkDefIdeal4:
                    this.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value; unit.defSpur += value;
                        });
                    break;
                case PassiveA.AtkResIdeal4:
                    this.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value; unit.resSpur += value;
                        });
                    break;
                case PassiveA.DefResIdeal4:
                    this.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.defSpur += value; unit.resSpur += value;
                        });
                    break;
                case Weapon.Skinfaxi:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applySpdUnity();
                        targetUnit.applyDefUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case Weapon.SparkingTome:
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        enemyUnit.resSpur -= 6;
                        enemyUnit.spdSpur -= 6;

                        let spdBuff = enemyUnit.getSpdBuffInCombat(targetUnit);
                        if (spdBuff > 0) {
                            enemyUnit.spdSpur -= spdBuff * 2;
                        }
                        let resBuff = enemyUnit.getResBuffInCombat(targetUnit);
                        if (resBuff > 0) {
                            enemyUnit.resSpur -= resBuff * 2;
                        }
                    }
                    break;
                case PassiveB.BindingNecklace:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        targetUnit.addAllSpur(2);
                        enemyUnit.addAllSpur(-2);

                        targetUnit.atkSpur += enemyUnit.getAtkBuffInCombat(targetUnit);
                        targetUnit.spdSpur += enemyUnit.getSpdBuffInCombat(targetUnit);
                        targetUnit.defSpur += enemyUnit.getDefBuffInCombat(targetUnit);
                        targetUnit.resSpur += enemyUnit.getResBuffInCombat(targetUnit);

                        enemyUnit.atkSpur -= enemyUnit.getAtkBuffInCombat(targetUnit);
                        enemyUnit.spdSpur -= enemyUnit.getSpdBuffInCombat(targetUnit);
                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                        enemyUnit.resSpur -= enemyUnit.getResBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.FrostfireBreath:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        targetUnit.atkSpur += Math.floor((
                            targetUnit.getDefBuffInCombat(enemyUnit) +
                            targetUnit.getResBuffInCombat(enemyUnit)
                        ) * 1.5);
                    }
                    break;
                case PassiveA.AtkDefUnity:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces = this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (calcPotentialDamage || targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyDefUnity();
                    }
                    break;
                case PassiveA.AtkResUnity:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces = this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (calcPotentialDamage || targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case Weapon.SneeringAxe:
                    {
                        let atkBuff = enemyUnit.getAtkBuffInCombat(targetUnit);
                        if (atkBuff > 0) {
                            enemyUnit.atkSpur -= atkBuff * 2;
                        }
                        let spdBuff = enemyUnit.getSpdBuffInCombat(targetUnit);
                        if (spdBuff > 0) {
                            enemyUnit.spdSpur -= spdBuff * 2;
                        }
                        let defBuff = enemyUnit.getDefBuffInCombat(targetUnit);
                        if (defBuff > 0) {
                            enemyUnit.defSpur -= defBuff * 2;
                        }
                        let resBuff = enemyUnit.getResBuffInCombat(targetUnit);
                        if (resBuff > 0) {
                            enemyUnit.resSpur -= resBuff * 2;
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                            }
                        }
                    }
                    break;
                case Weapon.BouryakuNoSenkyu:
                    if (targetUnit.buffTotal + enemyUnit.debuffTotal >= 10) {
                        enemyUnit.addAllSpur(-5);
                    }
                    break;
                case Weapon.Niu: {
                    let amount = 0;
                    if (!targetUnit.isWeaponRefined) {
                        amount = Math.trunc(enemyUnit.getBuffTotalInCombat(targetUnit) * 0.5);
                    } else {
                        let buff = targetUnit.getBuffTotalInCombat(enemyUnit) + enemyUnit.getBuffTotalInCombat(targetUnit);
                        amount = Math.min(Math.trunc(buff * 0.4), 10);
                    }
                    if (amount > 0) {
                        targetUnit.addAllSpur(amount);
                    }
                }
                    break;
                case Weapon.AxeOfDespair:
                case Weapon.TomeOfDespair:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        let buff = targetUnit.getBuffTotalInCombat(enemyUnit);
                        let debuffTotal = targetUnit.debuffTotal;
                        let buffDebuffTotal = buff - debuffTotal;
                        if (buffDebuffTotal >= 5) {
                            if (!this.__canInvalidateInvalidationOfFollowupAttack(enemyUnit, targetUnit)) {
                                --enemyUnit.battleContext.followupAttackPriority;
                            }

                            if (buffDebuffTotal >= 10) {
                                ++targetUnit.battleContext.followupAttackPriority;

                                if (buffDebuffTotal >= 15) {
                                    targetUnit.battleContext.reducesCooldownCount = true;
                                }
                            }
                        }
                    }
                    break;
                case Weapon.Revatein:
                case Weapon.Blarblade:
                case Weapon.BlarbladePlus:
                case Weapon.Gronnblade:
                case Weapon.GronnbladePlus:
                case Weapon.Rauarblade:
                case Weapon.RauarbladePlus:
                case Weapon.AirisuNoSyo:
                case Weapon.RaisenNoSyo:
                case Weapon.OrdinNoKokusyo:
                case Weapon.TharjasHex:
                    {
                        let buff = targetUnit.getBuffTotalInCombat(enemyUnit);
                        if (buff > 0) {
                            targetUnit.atkSpur += buff;
                        }
                    }
                    break;
                case Weapon.TwinStarAxe:
                    {
                        let buff = Math.trunc(targetUnit.getBuffTotalInCombat(enemyUnit) / 2);
                        if (buff > 0) {
                            targetUnit.atkSpur += buff;
                        }
                    }
                    break;
                case Weapon.AkatsukiNoHikari:
                    if (enemyUnit.atkDebuffTotal < 0) { targetUnit.atkSpur += -enemyUnit.atkDebuffTotal; }
                    if (enemyUnit.spdDebuffTotal < 0) { targetUnit.spdSpur += -enemyUnit.spdDebuffTotal; }
                    if (enemyUnit.defDebuffTotal < 0) { targetUnit.defSpur += -enemyUnit.defDebuffTotal; }
                    if (enemyUnit.resDebuffTotal < 0) { targetUnit.resSpur += -enemyUnit.resDebuffTotal; }
                    break;
                case Weapon.SyukuseiNoAnki:
                case Weapon.SyukuseiNoAnkiPlus:
                    {
                        let buff = enemyUnit.getBuffTotalInCombat(targetUnit);
                        if (buff > 0) {
                            targetUnit.atkSpur += buff;
                        }
                    }
                    break;
                case Weapon.Faraflame:
                case Weapon.GunshinNoSyo:
                case Weapon.MitteiNoAnki:
                case Weapon.AokarasuNoSyo:
                    if (targetUnit.isWeaponSpecialRefined) {
                        this.__applyDebuffBlade(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.Blizard:
                case Weapon.HaNoOugiPlus:
                    this.__applyDebuffBlade(targetUnit, enemyUnit);
                    break;
                case Weapon.SyugosyaNoRekkyu:
                    if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                        || targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)
                    ) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.SaizoNoBakuenshin:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += Math.abs(enemyUnit.atkDebuffTotal);
                        targetUnit.spdSpur += Math.abs(enemyUnit.spdDebuffTotal);
                        targetUnit.defSpur += Math.abs(enemyUnit.defDebuffTotal);
                        targetUnit.resSpur += Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.MeikiNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += Math.abs(enemyUnit.atkDebuffTotal);
                        targetUnit.spdSpur += Math.abs(enemyUnit.spdDebuffTotal);
                        targetUnit.defSpur += Math.abs(enemyUnit.defDebuffTotal);
                        targetUnit.resSpur += Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.ChaosRagnell:
                    {
                        let atkAdd = Math.abs(targetUnit.atkDebuffTotal) * 2;
                        let spdAdd = Math.abs(targetUnit.spdDebuffTotal) * 2;
                        let defAdd = Math.abs(targetUnit.defDebuffTotal) * 2;
                        let resAdd = Math.abs(targetUnit.resDebuffTotal) * 2;
                        this.damageCalc.writeDebugLog(`混沌ラグネルにより攻+${atkAdd}, 速+${spdAdd}, 守+${defAdd}, 魔+${resAdd}`);
                        targetUnit.atkSpur += atkAdd;
                        targetUnit.spdSpur += spdAdd;
                        targetUnit.defSpur += defAdd;
                        targetUnit.resSpur += resAdd;
                    }
                    break;
            }
        }
    }
    __applyBonusDoubler(targetUnit, enemyUnit) {
        if (targetUnit.hasPanic) {
            return;
        }

        this.damageCalc.writeDebugLog("強化増幅効果により各ステータスの強化値分をさらに強化");
        targetUnit.atkSpur += targetUnit.getAtkBuffInCombat(enemyUnit);
        targetUnit.spdSpur += targetUnit.getSpdBuffInCombat(enemyUnit);
        targetUnit.defSpur += targetUnit.getDefBuffInCombat(enemyUnit);
        targetUnit.resSpur += targetUnit.getResBuffInCombat(enemyUnit);
    }
    __applySkillEffectForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, calcPotentialDamage) {
        if (targetUnit.hasStatusEffect(StatusEffectType.BonusDoubler)
        ) {
            this.__applyBonusDoubler(targetUnit, enemyUnit);
        }

        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.MermaidBow:
                    if (targetUnit.snapshot.restHpPercentage >= 25 &&
                        targetUnit.battleContext.initiatesCombat) {
                        if (this.damageCalc.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) == TriangleAdvantage.Advantageous) {
                            if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getSpdInCombat() + 1) {
                                targetUnit.battleContext.attackCount = 2;
                            }
                        }
                    }
                    break;
                case Weapon.Luin:
                    if (targetUnit.battleContext.initiatesCombat
                        || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                    ) {
                        targetUnit.battleContext.additionalDamage = Math.trunc(targetUnit.getEvalSpdInCombat() * 0.2);
                        targetUnit.battleContext.invalidatesCounterattack = true;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.PlegianAxePlus:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                    }
                    break;
                case Weapon.PlegianBowPlus:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                    }
                    break;
                case Weapon.FellFlambeau:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        enemyUnit.resSpur -= 5;
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.PlegianTorchPlus:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.resSpur -= 5;
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case PassiveA.Kyokazohuku3:
                case Weapon.ShinkenFalcion:
                    this.__applyBonusDoubler(targetUnit, enemyUnit);
                    break;
                case Weapon.FoxkitFang:
                    if (enemyUnit.weaponType == WeaponType.Sword
                        || enemyUnit.weaponType == WeaponType.Lance
                        || enemyUnit.weaponType == WeaponType.Axe
                        || isWeaponTypeBreath(enemyUnit.weaponType)
                        || isWeaponTypeBeast(enemyUnit.weaponType)) {
                        let atkRes = targetUnit.getResInCombat(enemyUnit);
                        let defRes = enemyUnit.getResInCombat(targetUnit);
                        if (atkRes > defRes) {
                            let spurAmount = Math.floor((atkRes - defRes) * 0.5);
                            targetUnit.addAllSpur(spurAmount);
                        }
                    }
                    break;
                case PassiveA.HeavyBlade1:
                    if (targetUnit.getAtkInCombat(enemyUnit) >= enemyUnit.getAtkInCombat(targetUnit) + 5) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case PassiveA.HeavyBlade2:
                    if (targetUnit.getAtkInCombat(enemyUnit) >= enemyUnit.getAtkInCombat(targetUnit) + 3) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case PassiveA.HeavyBlade3:
                case PassiveA.HeavyBlade4:
                case Weapon.KentoushiNoGoken:
                    this.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                    break;
                case PassiveA.FlashingBlade2:
                    if (targetUnit.getSpdInCombat(enemyUnit) >= enemyUnit.getSpdInCombat(targetUnit) + 5) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case PassiveA.FlashingBlade2:
                    if (targetUnit.getSpdInCombat(enemyUnit) >= enemyUnit.getSpdInCombat(targetUnit) + 3) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case PassiveA.FlashingBlade3:
                case PassiveA.FlashingBlade4:
                    this.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                    break;
            }
        }

        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.HokoNoGogeki3:
                        if (targetUnit.moveType == MoveType.Infantry) {
                            this.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                        }
                        break;
                    case PassiveC.HokoNoJugeki3:
                        if (targetUnit.moveType == MoveType.Infantry) {
                            this.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                        }
                        break;
                }
            }
        }
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 1, false)) {
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.HokoNoKokyu3:
                        if (targetUnit.moveType == MoveType.Infantry
                            && targetUnit.isPhysicalAttacker()
                        ) {
                            targetUnit.defSpur += 2;
                            targetUnit.resSpur += 2;
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                        }
                        break;
                    case PassiveC.HokoNoMajin3:
                        if (!calcPotentialDamage) {
                            if (targetUnit.moveType == MoveType.Infantry
                                && targetUnit.isPhysicalAttacker()
                            ) {
                                targetUnit.atkSpur += 2;
                                targetUnit.spdSpur += 2;
                                targetUnit.battleContext.refersMinOfDefOrRes = true;
                            }
                        }
                        break;
                }
            }
        }
    }
    __getAtkInCombatDetail(unit, enemyUnit) {
        return `攻撃${unit.atkWithSkills}、強化${unit.getAtkBuffInCombat(enemyUnit)}、弱化${unit.getAtkDebuffInCombat()}、戦闘中強化${Number(unit.atkSpur)}`;
    }
    __applyHeavyBladeSkill(atkUnit, defUnit) {
        let atkUnitAtk = atkUnit.getAtkInCombat(defUnit);
        let defUnitAtk = defUnit.getAtkInCombat(atkUnit);
        const tab = "&nbsp;&nbsp;";
        this.damageCalc.writeDebugLog(`剛剣を評価:<br/>${tab}${atkUnit.getNameWithGroup()}の攻撃${atkUnitAtk}(${this.__getAtkInCombatDetail(atkUnit, defUnit)})`
            + `<br/>${tab}${defUnit.getNameWithGroup()}の攻撃${defUnitAtk}(${this.__getAtkInCombatDetail(defUnit, atkUnit)})`);
        if (atkUnitAtk > defUnitAtk) {
            this.damageCalc.writeDebugLog(`${tab}剛剣発動`);
            atkUnit.battleContext.increaseCooldownCountForAttack = true;
        }
        else {
            this.damageCalc.writeDebugLog(`${tab}剛剣は発動しない`);
        }
    }

    __applyFlashingBladeSkill(atkUnit, defUnit) {
        if (atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)) {
            atkUnit.battleContext.increaseCooldownCountForAttack = true;
        }
    }

    __setOnetimeActionFlag(unit) {
        unit.isOneTimeActionActivatedForShieldEffect = true;
        unit.isOneTimeActionActivatedForFallenStar = true;

        for (let skillId of unit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.ArmoredWall:
                case PassiveB.GuardBearing3:
                    unit.isOneTimeActionActivatedForPassiveB = true;
                    break;
            }
        }
    }

    __applySkillEffectAfterCombatForUnit(targetUnit, enemyUnit) {
        for (let skillId of enemyUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveS.GoeiNoGuzo:
                case PassiveS.TozokuNoGuzoRakurai:
                case PassiveS.TozokuNoGuzoKobu:
                case PassiveS.TozokuNoGuzoKogun:
                case PassiveS.TozokuNoGuzoKusuri:
                case PassiveS.TozokuNoGuzoOugi:
                case PassiveS.TozokuNoGuzoOdori:
                    if (!enemyUnit.isAlive) {
                        this.writeDebugLogLine(`${enemyUnit.passiveSInfo.name}発動、${targetUnit.getNameWithGroup()}のHP10回復、奥義カウント+1`);
                        targetUnit.reserveHeal(10);
                        targetUnit.specialCount += 1;
                    }
                    break;
            }
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.FlowRefresh3:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.reserveHeal(10);
                    }
                    break;
                case PassiveB.ArmoredWall:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                case Weapon.Ivarudhi:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            targetUnit.reserveHeal(7);
                        }
                    }
                    break;
                case PassiveB.FallenStar:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.addStatusEffect(StatusEffectType.FallenStar);
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 1, true)) {
                            unit.addStatusEffect(StatusEffectType.Gravity);
                        }
                    }
                    break;
                case Weapon.Aureola:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                        unit.reserveHeal(7);
                    }
                    break;
                case Weapon.DarkCreatorS:
                    targetUnit.isOneTimeActionActivatedForWeapon = true;
                    break;
                case Weapon.EffiesLance:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.isOneTimeActionActivatedForWeapon = true;
                    }
                    break;
                case Weapon.TomeOfFavors:
                    if (!isWeaponTypeBeast(enemyUnit.weaponType)) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                case Weapon.OukeNoKen:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.reserveHeal(7);
                            targetUnit.specialCount -= 1;
                        }
                    }
                    break;
                case Weapon.RauarRabbitPlus:
                case Weapon.BlarRabbitPlus:
                case Weapon.ConchBouquetPlus:
                case Weapon.MelonFloatPlus:
                case Weapon.HiddenThornsPlus:
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.reserveHeal(7);
                        targetUnit.isOneTimeActionActivatedForWeapon = true;
                    }
                    break;
                case Weapon.StarpointLance:
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.reserveHeal(10);
                        targetUnit.isOneTimeActionActivatedForWeapon = true;
                    }
                    break;
                case PassiveB.SealAtk1: enemyUnit.applyAtkDebuff(-3); break;
                case PassiveB.SealAtk2: enemyUnit.applyAtkDebuff(-5); break;
                case PassiveB.SealAtk3: enemyUnit.applyAtkDebuff(-7); break;
                case PassiveB.SealSpd1: enemyUnit.applySpdDebuff(-3); break;
                case PassiveB.SealSpd2: enemyUnit.applySpdDebuff(-5); break;
                case PassiveB.SealSpd3: enemyUnit.applySpdDebuff(-7); break;
                case PassiveB.SealDef1: enemyUnit.applyDefDebuff(-3); break;
                case PassiveB.SealDef2: enemyUnit.applyDefDebuff(-5); break;
                case PassiveB.SealDef3: enemyUnit.applyDefDebuff(-7); break;
                case PassiveB.SealRes1: enemyUnit.applyResDebuff(-3); break;
                case PassiveB.SealRes2: enemyUnit.applyResDebuff(-5); break;
                case PassiveB.SealRes3: enemyUnit.applyResDebuff(-7); break;
                case PassiveB.SealAtkSpd1: enemyUnit.applyAtkDebuff(-3); enemyUnit.applySpdDebuff(-3); break;
                case PassiveB.SealAtkDef1: enemyUnit.applyAtkDebuff(-3); enemyUnit.applyDefDebuff(-3); break;
                case PassiveB.SealDefRes1: enemyUnit.applyDefDebuff(-3); enemyUnit.applyResDebuff(-3); break;
                case PassiveB.SealSpdDef1: enemyUnit.applySpdDebuff(-3); enemyUnit.applyDefDebuff(-3); break;
                case PassiveB.SealSpdRes1: enemyUnit.applySpdDebuff(-3); enemyUnit.applyResDebuff(-3); break;
                case PassiveB.SealAtkSpd2: enemyUnit.applyAtkDebuff(-5); enemyUnit.applySpdDebuff(-5); break;
                case PassiveB.SealAtkDef2: enemyUnit.applyAtkDebuff(-5); enemyUnit.applyDefDebuff(-5); break;
                case PassiveB.SealAtkRes2: enemyUnit.applyAtkDebuff(-5); enemyUnit.applyResDebuff(-5); break;
                case PassiveB.SealDefRes2: enemyUnit.applyDefDebuff(-5); enemyUnit.applyResDebuff(-5); break;
                case PassiveB.SealSpdDef2: enemyUnit.applySpdDebuff(-5); enemyUnit.applyDefDebuff(-5); break;
                case PassiveB.SealSpdRes2: enemyUnit.applySpdDebuff(-5); enemyUnit.applyResDebuff(-5); break;
                case PassiveB.SeimeiNoGofu3:
                    targetUnit.reserveHeal(6);
                    break;
                case Weapon.TaguelChildFang:
                    if (targetUnit.hpPercentage <= 75) {
                        targetUnit.specialCount -= 2;
                    }
                    break;
                case Weapon.MasyouNoYari:
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.reserveTakeDamage(6);
                    } else {
                        targetUnit.reserveTakeDamage(4);
                    }
                    break;
                case Weapon.DevilAxe:
                    targetUnit.reserveTakeDamage(4);
                    break;
                case Weapon.BatoruNoGofu:
                case Weapon.HinataNoMoutou:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.reserveTakeDamage(6);
                    }
                    break;
                case PassiveA.Fury1:
                    targetUnit.reserveTakeDamage(2);
                    break;
                case PassiveA.Fury2:
                    targetUnit.reserveTakeDamage(4);
                    break;
                case Weapon.FurasukoPlus:
                case Weapon.KabochaNoGyotoPlus:
                case Weapon.BikkuriBakoPlus:
                case Weapon.RosokuNoYumiPlus:
                case Weapon.Mistoruthin:
                case PassiveA.Fury3:
                    targetUnit.reserveTakeDamage(6);
                    break;
                case PassiveA.Fury4:
                    targetUnit.reserveTakeDamage(8);
                    break;
                case PassiveA.AtkSpdPush3:
                case PassiveA.AtkDefPush3:
                case PassiveA.AtkResPush3:
                    this.writeDebugLogLine("渾身3を評価: 戦闘前のHP=" + targetUnit.battleContext.hpBeforeCombat);
                    if (targetUnit.battleContext.hpBeforeCombat == targetUnit.maxHpWithSkills) {
                        this.writeLogLine("渾身3による1ダメージ");
                        targetUnit.reserveTakeDamage(1);
                    }
                    break;
                case PassiveA.DistantPressure:
                case PassiveA.AtkSpdPush4:
                case PassiveA.AtkResPush4:
                case PassiveA.AtkDefPush4:
                    this.writeDebugLogLine(`${targetUnit.passiveAInfo.name}を評価: 戦闘前のHP=` + targetUnit.battleContext.hpBeforeCombat);
                    if (targetUnit.battleContext.hpBeforeCombat >= Math.floor(targetUnit.maxHpWithSkills * 0.25)) {
                        this.writeLogLine(`${targetUnit.passiveAInfo.name}による5ダメージ`);
                        targetUnit.reserveTakeDamage(5);
                    }
                    break;
                case PassiveB.OgiNoRasen3:
                case Weapon.MakenMistoruthin:
                    if (targetUnit.battleContext.isSpecialActivated) {
                        targetUnit.specialCount -= 2;
                    }
                    break;
                case PassiveC.FatalSmoke3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.DeepWounds);
                    }
                    break;
                case PassiveC.PanicSmoke3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.Panic);
                    }
                    break;
                case PassiveC.KodoNoGenen3:
                    this.writeDebugLogLine(targetUnit.getNameWithGroup() + "の鼓動の幻煙3発動");
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                        this.writeDebugLogLine(unit.getNameWithGroup() + "の奥義カウントを+1");
                        unit.specialCount += 1;
                    }
                    break;
                case PassiveB.Atrocity:
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        this.writeDebugLogLine(targetUnit.getNameWithGroup() + "の無惨発動");
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                            this.writeDebugLogLine(unit.getNameWithGroup() + "の奥義カウントを+1");
                            unit.specialCount += 1;
                            unit.applyAllDebuff(-5);
                        }
                    }
                    break;
                case PassiveC.AtkSmoke1: this.__applySmokeSkill(enemyUnit, x => x.applyAtkDebuff(-3)); break;
                case PassiveC.AtkSmoke2: this.__applySmokeSkill(enemyUnit, x => x.applyAtkDebuff(-5)); break;
                case PassiveC.AtkSmoke3: this.__applySmokeSkill(enemyUnit, x => x.applyAtkDebuff(-7)); break;
                case PassiveC.SpdSmoke1: this.__applySmokeSkill(enemyUnit, x => x.applySpdDebuff(-3)); break;
                case PassiveC.SpdSmoke2: this.__applySmokeSkill(enemyUnit, x => x.applySpdDebuff(-5)); break;
                case PassiveC.SpdSmoke3: this.__applySmokeSkill(enemyUnit, x => x.applySpdDebuff(-7)); break;
                case PassiveC.DefSmoke1: this.__applySmokeSkill(enemyUnit, x => x.applyDefDebuff(-3)); break;
                case PassiveC.DefSmoke2: this.__applySmokeSkill(enemyUnit, x => x.applyDefDebuff(-5)); break;
                case PassiveC.DefSmoke3: this.__applySmokeSkill(enemyUnit, x => x.applyDefDebuff(-7)); break;
                case PassiveC.ResSmoke1: this.__applySmokeSkill(enemyUnit, x => x.applyResDebuff(-3)); break;
                case PassiveC.ResSmoke2: this.__applySmokeSkill(enemyUnit, x => x.applyResDebuff(-5)); break;
                case PassiveC.ResSmoke3: this.__applySmokeSkill(enemyUnit, x => x.applyResDebuff(-7)); break;
            }
        }
    }

    __applySmokeSkill(attackTargetUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, false)) {
            debuffFunc(unit);
        }
    }

    __findNearestEnemies(targetUnit, distLimit = 100) {
        return this.__findNearestUnits(targetUnit, this.enumerateUnitsInDifferentGroupOnMap(targetUnit), distLimit);
    }

    __findNearestAllies(targetUnit, distLimit = 100) {
        return this.__findNearestUnits(targetUnit, this.enumerateUnitsInTheSameGroupOnMap(targetUnit), distLimit);
    }

    __findNearestUnits(targetUnit, candidateUnits, distLimit) {
        let minDist = 1000;
        let minUnits = [];
        for (let unit of candidateUnits) {
            let dist = calcDistance(unit.posX, unit.posY, targetUnit.posX, targetUnit.posY);
            if (dist > distLimit) {
                continue;
            }
            if (dist < minDist) {
                minUnits = [unit];
                minDist = dist;
            } else if (dist == minDist) {
                minUnits.push(unit);
            }
        }
        return minUnits;
    }

    __applyAttackSkillEffectForDefenseAfterCombat(defUnit, atkUnit) {
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Kurimuhirudo:
                    if (atkUnit.isRangedWeaponType()) {
                        for (let unit of this.__findNearestAllies(defUnit, 2)) {
                            unit.reserveTakeDamage(20);
                        }
                    }
                    break;
            }
        }
    }

    __applySkillEffectAfterCombatNeverthelessDeadForUnit(attackUnit, attackTargetUnit, attackCount) {
        for (let skillId of attackUnit.enumerateSkills()) {
            switch (skillId) {
                case Special.HolyKnightAura:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.applyAtkBuff(6);
                            unit.addStatusEffect(StatusEffectType.MobilityIncreased);
                        }
                    }
                    break;
                case Special.ShiningEmblem:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.applyAllBuff(6);
                        }
                    }
                    break;
                case Special.HerosBlood:
                case Special.HonoNoMonsyo:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.applyAllBuff(4);
                        }
                    }
                    break;
                case Special.RighteousWind:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.reserveHeal(10);
                        }
                    }
                    break;
            }
        }
    }
    __applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(attackUnit, attackTargetUnit) {
        for (let skillId of attackUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.TigerSpirit:
                    if (attackUnit.snapshot.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.addStatusEffect(StatusEffectType.Panic);
                        }
                    }
                    break;
                case Weapon.FrostbiteBreath:
                    if (attackUnit.snapshot.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                        }
                    }
                    break;
                case Weapon.Scadi:
                    if (attackUnit.isWeaponSpecialRefined) {
                        if (attackUnit.snapshot.restHpPercentage >= 25) {
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                                unit.reserveTakeDamage(7);
                            }
                        }
                    }
                    break;
                case Weapon.ObsessiveCurse:
                    if (!attackUnit.isWeaponSpecialRefined) break;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        this.writeLogLine(`${unit.getNameWithGroup()}は${attackUnit.weaponInfo.name}により7ダメージ、反撃不可の状態異常付与`);
                        unit.reserveTakeDamage(7);
                        unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                    break;
                case Weapon.Buryunhirude:
                    if (!attackUnit.isWeaponRefined) {
                        attackTargetUnit.addStatusEffect(StatusEffectType.Gravity);
                    }
                    break;
                case PassiveC.Jagan:
                case Weapon.GravityPlus:
                case Weapon.Sangurizuru:
                case Weapon.ElisesStaff:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 1, true)) {
                        unit.addStatusEffect(StatusEffectType.Gravity);
                    }
                    break;
                case Weapon.Gravity:
                    attackTargetUnit.addStatusEffect(StatusEffectType.Gravity);
                    break;
                case Weapon.SpringtimeStaff:
                    attackTargetUnit.addStatusEffect(StatusEffectType.Gravity);
                    if (attackUnit.isWeaponSpecialRefined) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                            unit.reserveHeal(7);
                        }
                    }
                    break;
                case Weapon.SlowPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applySpdDebuff(-7);
                    }
                    break;
                case Weapon.Slow:
                    attackTargetUnit.applySpdDebuff(-6);
                    break;
                case Weapon.ElenasStaff:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAtkDebuff(-7);
                        unit.applySpdDebuff(-7);
                        if (attackUnit.isWeaponSpecialRefined) {
                            unit.addStatusEffect(StatusEffectType.Panic);
                        }
                    }
                    break;
                case Weapon.FearPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAtkDebuff(-7);
                    }
                    break;
                case Weapon.Fear:
                    attackTargetUnit.applyAtkDebuff(-6);
                    break;
                case Weapon.Pesyukado: {
                    let amount = attackUnit.isWeaponRefined ? 5 : 4;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.applyAllBuff(amount);
                    }
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAllDebuff(amount);
                    }
                    if (!attackUnit.isWeaponSpecialRefined) break;
                    if (attackUnit.snapshot.restHpPercentage >= 25) {
                        this.writeDebugLogLine(attackUnit.getNameWithGroup() + "の特殊錬成ペシュカド発動");
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            this.writeDebugLogLine(unit.getNameWithGroup() + "の奥義カウントを+1");
                            unit.specialCount += 1;
                        }
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                            unit.specialCount -= 1;
                        }
                    }
                    break;
                }
                case Weapon.Hlidskjalf:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.applyAllBuff(4);
                    }
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAllDebuff(-4);
                    }
                    break;
                case Weapon.MerankoryPlus:
                case Weapon.CandyStaff:
                case Weapon.CandyStaffPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.setSpecialCountToMax();
                        unit.addStatusEffect(StatusEffectType.Guard);
                    }
                    break;
                case Weapon.Candlelight:
                    attackTargetUnit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    break;
                case Weapon.CandlelightPlus:
                case Weapon.FlashPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                    break;
                case Weapon.Trilemma:
                    attackTargetUnit.addStatusEffect(StatusEffectType.TriangleAdept);
                    break;
                case Weapon.TrilemmaPlus:
                case Weapon.PunishmentStaff:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.TriangleAdept);
                    }
                    break;
                case Weapon.AbsorbPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, false)) {
                        unit.reserveHeal(7);
                    }
                    break;
                case Weapon.Sekuvaveku:
                case Weapon.Thjalfi:
                    if (this.__isThereAllyInSpecifiedSpaces(attackUnit, 3)) {
                        for (let unit of this.__findNearestAllies(attackUnit)) {
                            unit.reserveTakeDamage(20);
                        }
                    }
                    break;
                case Weapon.LightBreath:
                case Weapon.LightBreathPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.applyAllBuff(5);
                    }
                    break;
                case Weapon.Ifingr:
                    if (this.__isThereAllyInSpecifiedSpaces(attackUnit, 3)) {
                        for (let unit of this.__findNearestAllies(attackUnit)) {
                            unit.applyAllDebuff(-4);
                        }
                    }
                    break;
                case Weapon.GhostNoMadosyo:
                case Weapon.GhostNoMadosyoPlus:
                case Weapon.MonstrousBow:
                case Weapon.MonstrousBowPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.Panic);
                    }
                    break;
                case Weapon.Panic:
                case Weapon.LegionsAxe:
                case Weapon.RoroNoOnoPlus:
                    attackTargetUnit.addStatusEffect(StatusEffectType.Panic);
                    break;
                case Weapon.GrimasTruth:
                    if (attackUnit.isWeaponRefined) {
                    } else {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                            unit.applyAtkBuff(5);
                            unit.applySpdBuff(5);
                        }
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.applyAtkDebuff(-5);
                            unit.applySpdDebuff(-5);
                        }
                    }
                    break;
                case Weapon.DeathlyDagger:
                    if (attackUnit.isWeaponRefined) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.reserveTakeDamage(10);
                            unit.applyDefDebuff(-7);
                            unit.applyResDebuff(-7);
                        }
                    }
                    else {
                        if (attackUnit.battleContext.initiatesCombat) {
                            attackTargetUnit.reserveTakeDamage(7);
                        }
                        attackTargetUnit.applyDefDebuff(-7);
                        attackTargetUnit.applyResDebuff(-7);
                    }
                    break;
                case Weapon.PainPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        this.writeLogLine(unit.getNameWithGroup() + "は" + attackUnit.weaponInfo.name + "により10ダメージ");
                        unit.reserveTakeDamage(10);
                    }
                    break;
                case Weapon.SneeringAxe:
                    {
                        attackTargetUnit.addStatusEffect(StatusEffectType.Panic);
                    }
                    break;
                case Weapon.MitteiNoAnki:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.applyDefBuff(6);
                        unit.applyResBuff(6);
                    }
                    break;
                case Weapon.DokuNoKen:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        this.writeLogLine(unit.getNameWithGroup() + "は" + attackUnit.weaponInfo.name + "により10ダメージ、反撃不可の状態異常付与");
                        unit.reserveTakeDamage(10);
                        unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                    break;
                case Weapon.PanicPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.Panic);
                    }
                    break;
                case Weapon.SaizoNoBakuenshin:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAllDebuff(-6);
                    }
                    break;
                case Weapon.MeikiNoBreath:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAtkDebuff(-7);
                        unit.applySpdDebuff(-7);
                    }
                    break;
            }
        }

        if (attackUnit.hasDagger7Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -7);
        }
        else if (attackUnit.hasDagger6Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -6);
        }
        else if (attackUnit.hasDagger5Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -5);
        }
        else if (attackUnit.hasDagger4Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -4);
        }
        else if (attackUnit.hasDagger3Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -3);
        } else if (attackUnit.weapon == Weapon.PoisonDaggerPlus) {
            if (attackTargetUnit.moveType == MoveType.Infantry) {
                attackTargetUnit.applyDefDebuff(-6);
                attackTargetUnit.applyResDebuff(-6);
            }
        } else if (attackUnit.weapon == Weapon.PoisonDagger) {
            if (attackTargetUnit.moveType == MoveType.Infantry) {
                attackTargetUnit.applyDefDebuff(-4);
                attackTargetUnit.applyResDebuff(-4);
            }
        }
    }

    __applyAttackSkillEffectAfterCombat(attackUnit, attackTargetUnit) {
        for (let skillId of attackUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.KyupidNoYaPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, false)) {
                        unit.applyDefBuff(2);
                        unit.applyResBuff(2);
                    }
                    break;
                case Weapon.BridesFang:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        attackUnit.specialCount -= 1;
                    }
                    break;
                case Weapon.SpendthriftBowPlus:
                    attackUnit.specialCount += 2;
                    break;
                case Weapon.Rifia:
                    if (attackUnit.snapshot.restHpPercentage >= 50) {
                        attackUnit.reserveTakeDamage(4);
                    }
                    break;
                case Weapon.Death:
                    attackUnit.reserveTakeDamage(4);
                    break;
                case Weapon.SakanaWoTsuitaMori:
                case Weapon.SakanaWoTsuitaMoriPlus:
                case Weapon.SuikaWariNoKonbo:
                case Weapon.SuikaWariNoKonboPlus:
                case Weapon.KorigashiNoYumi:
                case Weapon.KorigashiNoYumiPlus:
                case Weapon.Kaigara:
                case Weapon.KaigaraPlus:
                    if (this.__getStatusEvalUnit(attackUnit).isRestHpFull) {
                        attackUnit.reserveTakeDamage(2);
                    }
                    break;
                case PassiveA.HashinDanryuKen:
                    attackUnit.reserveTakeDamage(7);
                    break;
                case Weapon.Ragnarok:
                    if (attackUnit.isWeaponSpecialRefined) {
                        attackUnit.reserveTakeDamage(5);
                    }
                    else {
                        if (this.__getStatusEvalUnit(attackUnit).isRestHpFull) {
                            attackUnit.reserveTakeDamage(5);
                        }
                    }
                    break;
                case Weapon.HokenSophia:
                    if (!targetUnit.isWeaponRefined) {
                        if (this.__getStatusEvalUnit(attackUnit).isRestHpFull) {
                            attackUnit.reserveTakeDamage(4);
                        }
                    }
                    else {
                        attackUnit.reserveTakeDamage(4);
                    }
                    break;
            }
        }
    }

    __applyDaggerEffect(attackUnit, attackTargetUnit, debuffAmount) {
        this.writeLogLine(attackUnit.getNameWithGroup() + "の暗器(" + debuffAmount + ")効果発動");
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
            unit.applyDefDebuff(debuffAmount);
            unit.applyResDebuff(debuffAmount);
        }
    }

    __canDebuff2PointsOfDefOrRes(attackUnit, targetUnit) {
        let unit = new Unit("", "", UnitGroupType.Ally, 0, "", 1);
        unit.defDebuff = targetUnit.defDebuff;
        unit.resDebuff = targetUnit.resDebuff;

        for (let skillId of attackUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Hlidskjalf:
                    unit.applyAllDebuff(-4);
                    break;
                case PassiveB.SealDef3: unit.applyDefDebuff(-7); break;
                case PassiveB.SealRes3: unit.applyResDebuff(-7); break;
                case PassiveB.SealAtkDef2: unit.applyAtkDebuff(-5); unit.applyDefDebuff(-5); break;
                case PassiveB.SealAtkRes2: unit.applyAtkDebuff(-5); unit.applyResDebuff(-5); break;
                case PassiveB.SealDefRes2: unit.applyDefDebuff(-5); unit.applyResDebuff(-5); break;
                case PassiveB.SealSpdDef2: unit.applySpdDebuff(-5); unit.applyDefDebuff(-5); break;
            }
        }
        if (attackUnit.hasDagger7Effect()) {
            unit.applyDefDebuff(-7);
            unit.applyResDebuff(-7);
        }
        else if (attackUnit.hasDagger6Effect()) {
            unit.applyDefDebuff(-6);
            unit.applyResDebuff(-6);
        }
        else if (attackUnit.hasDagger5Effect()) {
            unit.applyDefDebuff(-5);
            unit.applyResDebuff(-5);
        }
        else if (attackUnit.hasDagger4Effect()) {
            unit.applyDefDebuff(-4);
            unit.applyResDebuff(-4);
        }
        else if (attackUnit.hasDagger3Effect()) {
            unit.applyDefDebuff(-3);
            unit.applyResDebuff(-3);
        }
        return (targetUnit.defDebuff - unit.defDebuff) >= 2
            || (targetUnit.resDebuff - unit.resDebuff) >= 2;
    }

    __applyOverlappableSkillEffectFromAttackerAfterCombat(atkUnit, attackTargetUnit) {
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Simuberin:
                    if (!atkUnit.isWeaponRefined) {
                        this.__applyHoneSkill(atkUnit, x => true, x => x.applyAtkBuff(4));
                    }
                    break;
                case Weapon.KuraineNoYumi:
                case Weapon.KuraineNoYumiPlus:
                case Weapon.YamiNoBreath:
                case Weapon.YamiNoBreathPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, false)) {
                        unit.applyAtkDebuff(-5);
                        unit.applySpdDebuff(-5);
                    }
                    break;
                case Weapon.FirstBite:
                case Weapon.FirstBitePlus:
                case Weapon.KyupittoNoYa:
                case Weapon.KyupittoNoYaPlus:
                case Weapon.SeinaruBuke:
                case Weapon.SeinaruBukePlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 2, false)) {
                        unit.applyDefBuff(2);
                        unit.applyResBuff(2);
                    }
                    break;
                case Weapon.NinjinNoYari:
                case Weapon.NinjinNoYariPlus:
                case Weapon.NinjinNoOno:
                case Weapon.NinjinNoOnoPlus:
                case Weapon.AoNoTamago:
                case Weapon.AoNoTamagoPlus:
                case Weapon.MidoriNoTamago:
                case Weapon.MidoriNoTamagoPlus:
                    atkUnit.heal(4);
                    break;
                case Weapon.FalcionEchoes:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (this.__getStatusEvalUnit(atkUnit).isRestHpFull) {
                            atkUnit.reserveTakeDamage(5);
                        }
                    }
                    break;
                case PassiveB.Shishirenzan:
                    if (this.__getStatusEvalUnit(atkUnit).isRestHpFull) {
                        atkUnit.reserveTakeDamage(1);
                    }
                    break;
                case Weapon.ButosaiNoGakuhu:
                case Weapon.ButosaiNoGakuhuPlus:
                case Weapon.ButosaiNoSensu:
                case Weapon.ButosaiNoSensuPlus:
                case Weapon.ButosaiNoWa:
                case Weapon.ButosaiNoWaPlus:
                case PassiveC.SeiNoIbuki3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 1, false)) {
                        unit.reserveHeal(7);
                    }
                    break;
                case Weapon.Ora:
                    if (!atkUnit.isWeaponRefined) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 1, false)) {
                            unit.reserveHeal(5);
                        }
                    }
                    break;
                case Weapon.SnipersBow:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveTakeDamage(7);
                        unit.applyAtkDebuff(-7);
                        unit.applySpdDebuff(-7);
                    }
                    break;
                case PassiveC.SavageBlow1:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2)) {
                        this.writeLogLine(unit.getNameWithGroup() + "は死の吐息により3ダメージ");
                        unit.reserveTakeDamage(3);
                    }
                    break;
                case PassiveC.SavageBlow2:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2)) {
                        this.writeLogLine(unit.getNameWithGroup() + "は死の吐息により5ダメージ");
                        unit.reserveTakeDamage(5);
                    }
                    break;
                case PassiveC.SavageBlow3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2)) {
                        this.writeLogLine(unit.getNameWithGroup() + "は死の吐息により7ダメージ");
                        unit.reserveTakeDamage(7);
                    }
                    break;
                case Weapon.Pain:
                case PassiveB.PoisonStrike3:
                    attackTargetUnit.reserveTakeDamage(10);
                    break;

            }
        }
    }

    __applyMovementSkillAfterCombat(atkUnit, attackTargetUnit) {
        let isMoved = false;
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.KaihiTatakikomi3:
                case PassiveB.Tatakikomi:
                    isMoved = this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterShove(unit, target, tile), false);
                    break;
                case PassiveB.Kirikomi:
                    isMoved = this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterSwap(unit, target, tile), false);
                    break;
                case PassiveB.Hikikomi:
                    isMoved = this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterDrawback(unit, target, tile), false);
                    break;
                case PassiveB.KaihiIchigekiridatsu3:
                case PassiveB.Ichigekiridatsu:
                    isMoved = this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterDrawback(unit, target, tile), false, false);
                    break;
                case Weapon.EishinNoAnki:
                    {
                        let partners = this.__getPartnersInSpecifiedRange(atkUnit, 2);
                        if (partners.length == 1) {
                            let partner = partners[0];
                            isMoved = this.__applyMovementAssist(atkUnit, partner,
                                (unit, target, tile) => this.__findTileAfterSwap(unit, target, tile), false);
                        }
                    }
                    break;
            }
        }
        if (isMoved) {
            this.map.createTileSnapshots();
        }
    }

    __isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces)) {
            if (predicator != null && !predicator(unit)) {
                continue;
            }
            return true;
        }
        return false;
    }

    get isOddTurn() {
        return this.vm.currentTurn % 2 == 1;
    }

    __applySkillEffectRelatedToEnemyStatusEffects(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
            if (Math.abs(targetUnit.posX - unit.posX) <= 1) {
                // 縦3列以内
                switch (unit.weapon) {
                    case Weapon.FlowerOfEase:
                        if (targetUnit.hasNegativeStatusEffect()) {
                            targetUnit.atkSpur -= 3;
                            targetUnit.defSpur -= 3;
                            targetUnit.resSpur -= 3;
                        }
                        break;
                }
            }
        }

        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveA.AtkSpdCatch4:
                    if (enemyUnit.snapshot.restHpPercentage == 100
                        || enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.atkSpur += 7;
                        targetUnit.spdSpur += 7;

                        if (enemyUnit.snapshot.restHpPercentage == 100
                            && enemyUnit.hasNegativeStatusEffect()
                        ) {
                            targetUnit.atkSpur += 2;
                            targetUnit.spdSpur += 2;
                        }
                    }
                    break;
                case PassiveA.AtkDefCatch4:
                    if (enemyUnit.snapshot.restHpPercentage == 100
                        || enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.atkSpur += 7;
                        targetUnit.defSpur += 7;

                        if (enemyUnit.snapshot.restHpPercentage == 100
                            && enemyUnit.hasNegativeStatusEffect()
                        ) {
                            targetUnit.atkSpur += 2;
                            targetUnit.defSpur += 2;
                        }
                    }
                    break;
                case PassiveA.DefResCatch4:
                    if (enemyUnit.snapshot.restHpPercentage == 100
                        || enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.defSpur += 7;
                        targetUnit.resSpur += 7;

                        if (enemyUnit.snapshot.restHpPercentage == 100
                            && enemyUnit.hasNegativeStatusEffect()
                        ) {
                            targetUnit.defSpur += 2;
                            targetUnit.resSpur += 2;
                        }
                    }
                    break;
                case Weapon.FukenFalcion:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.snapshot.restHpPercentage < 100
                            || targetUnit.hasPositiveStatusEffect(enemyUnit)
                        ) {
                            targetUnit.addAllSpur(5);
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.defSpur += 5;
                                if (!this.__canInvalidateInvalidationOfFollowupAttack(enemyUnit, targetUnit)) {
                                    --enemyUnit.battleContext.followupAttackPriority;
                                }
                            }
                        }
                    }
                    else {
                        if (targetUnit.snapshot.restHpPercentage < 100) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case Weapon.EternalBreath:
                    {
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                enemyUnit.atkSpur -= 4;
                                enemyUnit.refSpur -= 4;
                                targetUnit.battleContext.increaseCooldownCountForDefense = true;
                            }
                        }
                    }
                    break;
                case Weapon.JoyfulVows:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.SpiritedSpearPlus:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.PledgedBladePlus:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.HugeFanPlus:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.SetsunasYumi:
                    {
                        if (enemyUnit.isRangedWeaponType()) {
                            targetUnit.addAllSpur(4);
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                            }
                        }
                    }
                    break;
                case Weapon.LevinDagger:
                    if (enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.VoidTome:
                    if (enemyUnit.getAtkInPrecombat() >= 50
                        || enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case PassiveB.KillingIntent:
                    if (enemyUnit.snapshot.restHpPercentage < 100 || enemyUnit.hasNegativeStatusEffect()) {
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case Weapon.WeirdingTome:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    break;
                case Weapon.ChaosManifest:
                    if (enemyUnit.hasNegativeStatusEffect()) {
                        targetUnit.atkSpur += 6;
                    }
                    break;
                case Weapon.HigasaPlus:
                case Weapon.TairyoNoYuPlus:
                case Weapon.KaigaraNoNaifuPlus:
                    if (enemyUnit.hasNegativeStatusEffect()) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.HarorudoNoYufu:
                    if (targetUnit.isBuffed) {
                        targetUnit.addAllSpur(3);
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.hasNegativeStatusEffect()
                            || !targetUnit.snapshot.isRestHpFull
                        ) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case PassiveB.ShisyaNoChojiriwo:
                    if (targetUnit.snapshot.restHpPercentage >= 50 || targetUnit.hasNegativeStatusEffect()) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.HigaimosoNoYumi:
                    if (targetUnit.hasNegativeStatusEffect()
                        || !targetUnit.snapshot.isRestHpFull
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.MaryuNoBreath:
                    if (targetUnit.hasNegativeStatusEffect()
                        || !targetUnit.snapshot.isRestHpFull
                    ) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                    }
                    break;
                case Weapon.Fimbulvetr:
                    if (targetUnit.snapshot.restHpPercentage < 100 || targetUnit.hasNegativeStatusEffect()) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                        targetUnit.addAllSpur(4);
                    }

                    break;
                case Weapon.RuneAxe:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    break;
                case Weapon.MasyouNoYari:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage < 100
                            || enemyUnit.hasNegativeStatusEffect()
                        ) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                            targetUnit.defSpur += 5;
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
            }
        }
    }

    __applySkillEffectForPrecombatAndCombat(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.BladeOfRenais:
                    // 戦闘前奥義にも必要なのでここでフラグを立てておく
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces |= this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    break;
                case Weapon.DarkCreatorS:
                    if (!calcPotentialDamage && !targetUnit.isOneTimeActionActivatedForWeapon) {
                        let count = this.__countUnit(targetUnit.groupId, x => x.hpPercentage >= 90);
                        let damageReductionRatio = Math.min(count * 15, 45) * 0.01;
                        targetUnit.battleContext.multDamageReductionRatio(damageReductionRatio);
                    }
                    break;
            }
        }
    }

    __isThereAnyUnitIn2Spaces(targetUnit) {
        targetUnit.battleContext.isThereAnyUnitIn2Spaces =
            targetUnit.battleContext.isThereAnyUnitIn2Spaces ||
            this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
        return targetUnit.battleContext.isThereAnyUnitIn2Spaces;
    }

    __getTotalBuffAmountOfTop3Units(targetUnit) {
        let units = [];
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit, false)) {
            units.push(unit);
        }

        units.sort(function (a, b) {
            return b.buffTotal - a.buffTotal;
        });

        let total = 0;
        for (let i = 0; i < 3; ++i) {
            if (i == units.length) {
                break;
            }

            total += units[i].buffTotal;
        }
        return total;
    }

    __applySkillEffectForUnit(targetUnit, enemyUnit, calcPotentialDamage) {
        if (!targetUnit.isOneTimeActionActivatedForFallenStar
            && targetUnit.hasStatusEffect(StatusEffectType.FallenStar)
        ) {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8);
        }

        if (targetUnit.hasStatusEffect(StatusEffectType.ResonantShield)) {
            targetUnit.defSpur += 4;
            targetUnit.resSpur += 4;
        }


        if (targetUnit.hasStatusEffect(StatusEffectType.ResonantBlades)) {
            targetUnit.atkSpur += 4;
            targetUnit.spdSpur += 4;
        }

        if (targetUnit.hasStatusEffect(StatusEffectType.Guard)) {
            enemyUnit.battleContext.reducesCooldownCount = true;
        }

        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Niu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.addAllSpur(4);
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.MakenMistoruthin:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                        }
                    }
                    break;
                case Weapon.LoyaltySpear:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.atkSpur -= 4;
                        enemyUnit.spdSpur -= 4;
                        enemyUnit.defSpur -= 4;
                        targetUnit.battleContext.invalidateAtkBuff = true;
                        targetUnit.battleContext.invalidateDefBuff = true;
                    }
                    break;
                case Weapon.GenesisFalchion:
                    if (targetUnit.initiatesCombat || this.__isThereAnyUnitIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(5);
                        let buffTotal = this.__getTotalBuffAmountOfTop3Units(targetUnit);
                        if (buffTotal >= 10) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        }
                        if (buffTotal >= 25) {
                            targetUnit.atkSpur += 5;
                            targetUnit.battleContext.healedHpByAttack = 5;
                        }
                        if (buffTotal >= 60) {
                            targetUnit.battleContext.isVantabeActivatable = true;
                        }
                    }
                    break;
                case Weapon.NifuruNoHyoka:
                    if (!targetUnit.isWeaponRefined) break;
                    let allies = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3));
                    if (allies.length >= 1) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                        targetUnit.atkSpur += Math.min(allies.length, 2) * 2;
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.atkSpur += 5;
                            targetUnit.resSpur += 5;
                            let units = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false));
                            let atkMax = units.reduce((max, unit) => Math.max(max, unit.hasStatusEffect(StatusEffectType.Panic) ? 0 : unit.atkBuff), 0);
                            targetUnit.atkSpur += atkMax;
                        }
                    }
                    break;
                case Weapon.PunishmentStaff:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.MermaidBow:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.battleContext.refersMinOfDefOrRes = true;
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.EbonPirateClaw:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.CrossbonesClaw:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        enemyUnit.spdSpur -= 6;
                        enemyUnit.defSpur -= 6;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        if (targetUnit.isTransformed) {
                            targetUnit.battleContext.isDesperationActivated = true;
                        }
                    }
                    break;
                case PassiveB.YngviAscendant:
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    break;
                case Weapon.HolyYewfelle:
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                    }
                    break;
                case Weapon.Ginnungagap:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        let isTomeOrStaff = enemyUnit.isTome || (enemyUnit.weaponType === WeaponType.Staff);
                        if (targetUnit.battleContext.initiatesCombat ||
                            (enemyUnit.battleContext.initiatesCombat && isTomeOrStaff)) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4);
                        }
                    }
                    break;
                case Weapon.TigerSpirit:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case PassiveC.DomainOfIce:
                    if (this.__isThereAnyUnitIn2Spaces(targetUnit)) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3);
                        targetUnit.spdSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case Weapon.FrostbiteBreath:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.addAllSpur(-5);
                    }
                    break;
                case PassiveB.FlowRefresh3:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                    break;
                case Weapon.DolphinDiveAxe:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAnyUnitIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.ShellpointLancePlus:
                case Weapon.TridentPlus:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                case Weapon.RaydreamHorn:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAnyUnitIn2Spaces(targetUnit)) {
                        targetUnit.atkSpur += 6;
                        enemyUnit.atkSpur -= 6;
                        if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                            targetUnit.battleContext.followupAttackPriority++;
                        }
                    }
                    break;
                case Weapon.BrightmareHorn:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        if (targetUnit.isTransformed) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.Blizard:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            enemyUnit.spdSpur -= 4;
                            enemyUnit.resSpur -= 4;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.snapshot.restHpPercentage >= 25) {
                                enemyUnit.addAllSpur(-4);
                                enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                                enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                                enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                                enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                            }
                        }
                    }
                    break;
                case Weapon.StoutTomahawk:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAnyUnitIn2Spaces(targetUnit)) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.Leiptr:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.addAllSpur(4);
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                            if (enemyUnit.battleContext.initiatesCombat) {
                                targetUnit.defSpur += 4;
                                targetUnit.resSpur += 4;
                            }
                        }
                    }
                    break;
                case Weapon.MaskingAxe:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                        }
                    }
                    break;
                case Weapon.FuginNoMaran:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAnyUnitIn2Spaces(targetUnit)) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3);
                            }
                        }
                    }
                    break;
                case Weapon.JaryuNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.addAllSpur(4);
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case PassiveA.DragonSkin2:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(6);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case PassiveA.LawsOfSacae2:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAnyUnitIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(6);
                    }
                    break;
                case Weapon.ProfessorialText:
                    if (targetUnit.battleContext.initiatesCombat
                        || this.__isThereAnyUnitIn2Spaces(targetUnit)
                    ) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.SunflowerBowPlus:
                case Weapon.VictorfishPlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.defSpur += 5;
                        enemyUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.DivineSeaSpear:
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 3;
                        targetUnit.spdSpur += 3;
                        targetUnit.defSpur += 3;

                        enemyUnit.atkSpur -= 3;
                        enemyUnit.spdSpur -= 3;
                        enemyUnit.defSpur -= 3;
                    }
                    break;
                case Weapon.PeachyParfaitPlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.resSpur += 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case Weapon.SunshadeStaff:
                    if (!this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.Scadi:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                    }
                    break;
                case Weapon.KenhimeNoKatana:
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.battleContext.isThereAnyUnitIn2Spaces =
                            targetUnit.battleContext.isThereAnyUnitIn2Spaces ||
                            this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                        if (targetUnit.battleContext.isThereAnyUnitIn2Spaces || targetUnit.battleContext.initiatesCombat) {
                            targetUnit.spdSpur += 5;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                        }
                    }
                    break;
                case Weapon.MuninNoMaran:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            targetUnit.addAllSpur(4);
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            targetUnit.battleContext.isThereAnyUnitIn2Spaces =
                                targetUnit.battleContext.isThereAnyUnitIn2Spaces ||
                                this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                            if (targetUnit.battleContext.isThereAnyUnitIn2Spaces || targetUnit.battleContext.initiatesCombat) {
                                targetUnit.addAllSpur(4);
                            }
                        }
                    }
                    break;
                case Weapon.HolyGradivus:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                            targetUnit.battleContext.followupAttackPriority++;
                        }
                    }
                    break;
                case Weapon.Ladyblade:
                    targetUnit.battleContext.refersMinOfDefOrRes = true;
                    break;
                case Weapon.RohyouNoKnife:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.battleContext.isThereAnyUnitIn2Spaces =
                            targetUnit.battleContext.isThereAnyUnitIn2Spaces ||
                            this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                        if (targetUnit.battleContext.initiatesCombat || targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.Pesyukado:
                    if (!targetUnit.isWeaponSpecialRefined) break;
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.ObservantStaffPlus:
                    let units = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3));
                    let partners = units.map(u => u.partnerHeroIndex);
                    targetUnit.battleContext.isThereAnyPartnerPairsIn3Spaces |= units.some(u => partners.includes(u.heroIndex));
                    if (targetUnit.battleContext.isThereAnyPartnerPairsIn3Spaces) {
                        targetUnit.addAllSpur(6);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.FairFuryAxe:
                case Weapon.WeddingBellAxe:
                case Weapon.RoseQuartsBow:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces =
                        targetUnit.battleContext.isThereAnyUnitIn2Spaces ||
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (targetUnit.battleContext.initiatesCombat || targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.Gradivus:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                            targetUnit.addAllSpur(4);
                            targetUnit.battleContext.healedHpByAttack = 7;
                        }
                    }
                    break;
                case Weapon.Siegfried:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            enemyUnit.atkSpur -= 4;
                            enemyUnit.defSpur -= 4;
                            if (!this.__canInvalidateInvalidationOfFollowupAttack(enemyUnit, targetUnit)) {
                                --enemyUnit.battleContext.followupAttackPriority;
                            }
                        }
                    }
                    break;
                case Weapon.Raijinto:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.battleContext.isThereAnyUnitIn2Spaces =
                            targetUnit.battleContext.isThereAnyUnitIn2Spaces ||
                            this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                        if (targetUnit.battleContext.initiatesCombat || targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                            targetUnit.addAllSpur(4)
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.Ragnell:
                case Weapon.Alondite:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    break;
                case Weapon.BereftLance:
                    {
                        let allyCount = this.__countAlliesWithinSpecifiedSpaces(
                            targetUnit, 2);
                        let buffAmount = 0;
                        if (allyCount == 0) {
                            buffAmount = 6;
                        }
                        else if (allyCount == 1) {
                            buffAmount = 4;
                        }
                        else if (allyCount == 2) {
                            buffAmount = 2;
                        }
                        targetUnit.atkSpur += buffAmount;
                        targetUnit.defSpur += buffAmount;

                        if (allyCount <= 1) {
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.AxeOfDespair:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.TomeOfDespair:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.resSpur -= 6;
                    }
                    break;
                case PassiveB.MurderousLion:
                    if (!this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.spdSpur -= 3;
                        enemyUnit.defSpur -= 3;
                        targetUnit.battleContext.invalidatesCounterattack = true;
                    }
                    break;
                case Weapon.AstraBlade:
                    targetUnit.battleContext.rateOfAtkMinusDefForAdditionalDamage = 0.5;
                    break;
                case PassiveB.ArmoredWall:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                        targetUnit.battleContext.reducesCooldownCount = true;
                        if (targetUnit.isTransformed
                            && !targetUnit.isOneTimeActionActivatedForPassiveB
                        ) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4);
                        }
                    }
                    break;
                case Weapon.TwinCrestPower:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                        targetUnit.battleContext.followupAttackPriority--;
                        if (!this.__canInvalidateInvalidationOfFollowupAttack(enemyUnit, targetUnit)) {
                            enemyUnit.battleContext.followupAttackPriority--;
                        }
                    }
                    break;
                case Weapon.HallowedTyrfing:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(5);
                        if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                            targetUnit.battleContext.followupAttackPriority++;
                        }
                        if (targetUnit.battleContext.initiatesCombat || enemyUnit.isRangedWeaponType()) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4);
                        }
                    }
                    break;
                case PassiveC.FatalSmoke3:
                    targetUnit.battleContext.invalidatesHeal = true;
                    break;
                case Weapon.KyoufuArmars:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                        }
                    }
                    break;
                case Weapon.FlowerLance:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.GrimasTruth:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.snapshot.restHpPercentage >= 25) {
                                enemyUnit.addAllSpur(-4);
                                enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                                enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                                enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                                enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                            }
                        }
                    }
                    break;
                case Weapon.Shamsir:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                    }
                    break;
                case PassiveB.AtkDefNearTrace3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.defSpur -= 3;
                    break;
                case PassiveB.SpdDefNearTrace3:
                    enemyUnit.spdSpur -= 3;
                    enemyUnit.defSpur -= 3;
                    break;
                case PassiveB.AtkDefFarTrace3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.defSpur -= 3;
                    break;
                case PassiveB.AtkResFarTrace3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.resSpur -= 3;
                    break;
                case PassiveB.SpdResFarTrace3:
                    enemyUnit.spdSpur -= 3;
                    enemyUnit.resSpur -= 3;
                    break;
                case Weapon.BowOfFrelia:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        targetUnit.battleContext.additionalDamageOfSpecial = 7;
                        targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                    }
                    break;
                case Weapon.TomeOfGrado:
                    if (!targetUnit.battleContext.initiatesCombat
                        || enemyUnit.snapshot.restHpPercentage == 100
                    ) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.resSpur -= 6;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnResDebuff = true;
                        if (enemyUnit.attackRange == 2) {
                            targetUnit.battleContext.isAdvantageForColorless = true;
                        }
                    }
                    break;
                case Weapon.StaffOfRausten:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.LanceOfFrelia:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.defSpur += 10;
                            targetUnit.resSpur += 10;
                        }
                    }
                    break;
                case Weapon.HotshotLance:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        let buffAmount = 4;
                        if (targetUnit.dragonflower == 3) {
                            buffAmount = 5;
                        }
                        else if (targetUnit.dragonflower == 4) {
                            buffAmount = 6;
                        }
                        else if (targetUnit.dragonflower == 5) {
                            buffAmount = 7;
                        }
                        targetUnit.addAllSpur(buffAmount);

                        if (targetUnit.dragonflower >= 3) {
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.TomeOfReglay:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case PassiveB.MoonTwinWing:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                    }
                    break;
                case PassiveB.SunTwinWing:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    }
                    break;
                case Weapon.SpringyBowPlus:
                case Weapon.SpringyAxePlus:
                case Weapon.SpringyLancePlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                    }
                    break;
                case Weapon.LilacJadeBreath:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.GullinkambiEgg:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.TallHammer:
                    if (targetUnit.isWeaponRefined) {
                        // 周囲1マスにいない時の強化は別の処理で行っているため、ここでは除外
                        if (!this.__isSolo(targetUnit) && targetUnit.battleContext.initiatesCombat) {
                            targetUnit.spdSpur += 6;
                            if (targetUnit.isWeaponSpecialRefined) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                        }
                    }
                    else {
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.spdSpur += 6;
                        }
                    }
                    break;
                case Weapon.Nagurufaru:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            enemyUnit.atkSpur -= 4;
                            enemyUnit.resSpur -= 4;
                        }
                        if (!targetUnit.battleContext.initiatesCombat
                            && targetUnit.snapshot.restHpPercentage >= 70
                        ) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                        }
                    }
                    break;
                case Weapon.IcyFimbulvetr:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.resSpur -= 6;

                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3,
                            x => x.moveType == MoveType.Cavalry || x.moveType == MoveType.Flying)
                        ) {
                            if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                                targetUnit.battleContext.followupAttackPriority++;
                            }

                            targetUnit.battleContext.healedHpByAttack = 5;
                        }
                    }
                    break;
                case Weapon.SteadfastLancePlus:
                case Weapon.SteadfastLance:
                case Weapon.SteadfastAxePlus:
                case Weapon.SteadfastAxe:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                    }
                    break;
                case PassiveB.FallenStar:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8);
                    }
                    break;
                case Weapon.Failnaught:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.UnboundBlade:
                case Weapon.UnboundBladePlus:
                    if (this.__isSolo(targetUnit)) {
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.SilesseFrost:
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;

                        let partners = this.__getPartnersInSpecifiedRange(targetUnit, 2);
                        if (partners.length > 0) {
                            targetUnit.battleContext.attackCount = 2;
                        }
                    }
                    break;
                case Weapon.Audhulma:
                    if (!targetUnit.isWeaponSpecialRefined) break;
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case Weapon.Meisterschwert:
                    if (!targetUnit.isWeaponSpecialRefined) break;
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                        if (targetUnit.battleContext.initiatesCombat) {
                            if (!this.__canInvalidateInvalidationOfFollowupAttack(enemyUnit, targetUnit)) {
                                --enemyUnit.battleContext.followupAttackPriority;
                            }
                        }
                    }
                    break;
                case Weapon.SpySongBow: {
                    if (!targetUnit.isWeaponSpecialRefined) break;
                    let units = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3));
                    let partners = units.map(u => u.partnerHeroIndex);
                    targetUnit.battleContext.isThereAnyPartnerPairsIn3Spaces |= units.some(u => partners.includes(u.heroIndex));
                    if (targetUnit.battleContext.isThereAnyPartnerPairsIn3Spaces) {
                        targetUnit.addAllSpur(6);
                    }
                    break;
                }
                case Weapon.Thjalfi:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.battleContext.reductionRatioOfDamageReductionRatioExceptSpecial = 0.5;
                        targetUnit.addAllSpur(6);
                        if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                            targetUnit.battleContext.followupAttackPriority++;
                        }
                    }
                    break;
                case Weapon.UnityBloomsPlus:
                case Weapon.AmityBloomsPlus:
                case Weapon.PactBloomsPlus:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces =
                        targetUnit.battleContext.isThereAnyUnitIn2Spaces ||
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case Weapon.SeaSearLance:
                case Weapon.LoyalistAxe:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case PassiveC.AdNearSave3:
                    if (targetUnit.battleContext.isSaviorActivated) {
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                    }
                    break;
                case PassiveC.ArFarSave3:
                    if (targetUnit.battleContext.isSaviorActivated) {
                        targetUnit.atkSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveC.DrNearSave3:
                    if (targetUnit.battleContext.isSaviorActivated) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case Weapon.AuroraBreath:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.atkSpur += 6;
                        if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                            ++targetUnit.battleContext.followupAttackPriority;
                        }
                    }
                    else {
                        targetUnit.defSpur += 6;
                        targetUnit.resSpur += 6;
                        if (!this.__canInvalidateInvalidationOfFollowupAttack(enemyUnit, targetUnit)) {
                            --enemyUnit.battleContext.followupAttackPriority;
                        }
                    }
                    break;
                case Weapon.IndignantBow:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                        targetUnit.atkSpur += 6;
                        enemyUnit.atkSpur -= 6;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                    }
                    break;
                case Weapon.Grafcalibur:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces =
                        targetUnit.battleContext.isThereAnyUnitIn2Spaces ||
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (targetUnit.battleContext.initiatesCombat || targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.Forusethi:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.initiatesCombat
                            && targetUnit.snapshot.restHpPercentage >= 25
                        ) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 4;
                                targetUnit.spdSpur += 4;
                                targetUnit.battleContext.invalidateAllOwnDebuffs();
                                targetUnit.battleContext.invalidatesAtkBuff = true;
                                targetUnit.battleContext.invalidatesSpdBuff = true;
                            }
                        }
                    }
                    break;
                case Weapon.SpringtimeStaff:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat
                            || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                        ) {
                            targetUnit.atkSpur += 5;
                            targetUnit.resSpur += 5;
                        }
                    }
                    break;
                case Weapon.ArdensBlade:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.atkSpur += 4;
                            targetUnit.defSpur += 6;
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.ResolvedFang:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.defSpur += 5;
                        enemyUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.RefreshedFang:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.spdSpur += 5;
                        enemyUnit.spdSpur -= 5;
                    }
                    break;
                case Weapon.RenewedFang:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                        (u) =>
                            targetUnit.partnerHeroIndex === u.heroIndex ||
                            targetUnit.heroIndex === u.partnerHeroIndex)) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.spdSpur -= 6;
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                    break;
                case Weapon.StudiedForblaze:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.ReindeerBowPlus:
                case Weapon.CandyCanePlus:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces =
                        targetUnit.battleContext.isThereAnyUnitIn2Spaces ||
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case Weapon.Hrist:
                    if (targetUnit.snapshot.restHpPercentage <= 99) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.TomeOfFavors:
                    if (!isWeaponTypeBeast(enemyUnit.weaponType)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.PurifyingBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.addAllSpur(4);
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                        }
                    }
                    break;
                case Weapon.ObsidianLance:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                        if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                            targetUnit.battleContext.followupAttackPriority++;
                        }
                    }
                    break;
                case Weapon.TomeOfStorms:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.Lyngheior:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3);
                    }
                    break;
                case Weapon.Aureola:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces |=
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (targetUnit.battleContext.initiatesCombat || targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.resSpur += 5;
                        targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                    }
                    break;
                case Weapon.TigerRoarAxe:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces |=
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (targetUnit.battleContext.initiatesCombat || targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        targetUnit.addAllSpur(5);
                        if (enemyUnit.snapshot.restHpPercentage === 100) {
                            if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                                targetUnit.battleContext.followupAttackPriority++;
                            }
                        }
                    }
                    break;
                case Weapon.Areadbhar:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.DarkCreatorS:
                    if (!calcPotentialDamage && !targetUnit.isOneTimeActionActivatedForWeapon) {
                        let count = this.__countUnit(targetUnit.groupId, x => x.hpPercentage >= 90);
                        let buff = Math.min(count * 2, 6);
                        targetUnit.atkSpur += buff;
                        targetUnit.defSpur += buff;
                    }
                    break;
                case Weapon.SpearOfAssal:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces |=
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (!calcPotentialDamage && targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesSpdBuff = true;
                    }
                    break;
                case Weapon.Thunderbrand:
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.EffiesLance:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 6;
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            targetUnit.battleContext.invalidatesAtkBuff = true;
                            targetUnit.battleContext.invalidatesDefBuff = true;
                        }
                    }
                    break;
                case Weapon.PaleBreathPlus:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces =
                        targetUnit.battleContext.isThereAnyUnitIn2Spaces ||
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (!calcPotentialDamage && targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                    }
                    break;
                case Weapon.JokersWild:
                    {
                        let atk = 0;
                        let spd = 0;
                        let def = 0;
                        let res = 0;
                        let foundUnit = false;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                            atk = Math.max(atk, unit.getAtkInPrecombat());
                            spd = Math.max(spd, unit.getSpdInPrecombat());
                            def = Math.max(def, unit.getDefInPrecombat());
                            res = Math.max(res, unit.getResInPrecombat());
                            foundUnit = true;
                        }
                        if (foundUnit) {
                            targetUnit.atkSpur += atk - targetUnit.getAtkInPrecombat();
                            targetUnit.spdSpur += spd - targetUnit.getSpdInPrecombat();
                            targetUnit.defSpur += def - targetUnit.getDefInPrecombat();
                            targetUnit.resSpur += res - targetUnit.getResInPrecombat();
                        }
                    }
                    break;
                case PassiveB.SlickFighter3:
                    if (targetUnit.snapshot.restHpPercentage >= 25 && enemyUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                    }
                    break;
                case Weapon.BlackfireBreathPlus:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.resSpur -= 5;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesResBuff = true;
                    }
                    break;
                case PassiveA.Dragonscale:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.resSpur -= 6;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.FlameLance:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case Weapon.TalreganAxe:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces = this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (targetUnit.battleContext.initiatesCombat
                        || (!calcPotentialDamage && targetUnit.battleContext.isThereAnyUnitIn2Spaces)
                    ) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.GiltGoblet:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.CourtlyMaskPlus:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.CourtlyBowPlus:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                case Weapon.CourtlyCandlePlus:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                case PassiveB.CraftFighter3:
                    if (!targetUnit.battleContext.initiatesCombat
                        && targetUnit.snapshot.restHpPercentage >= 25
                    ) {
                        targetUnit.battleContext.reducesCooldownCount = true;
                        if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                            ++targetUnit.battleContext.followupAttackPriority;
                        }
                    }
                    break;
                case Weapon.Garumu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case Weapon.PrimordialBreath:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.ArmorsmasherPlus:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.moveType == MoveType.Armor) {
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.KeenGronnwolfPlus:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.moveType == MoveType.Cavalry) {
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.FlowerHauteclere:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.MoonGradivus:
                    targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    break;
                case Weapon.WindParthia:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces = this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (targetUnit.battleContext.initiatesCombat
                        || (!calcPotentialDamage && targetUnit.battleContext.isThereAnyUnitIn2Spaces)
                    ) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.DarkSpikesT:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.DeckSwabberPlus:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.GateAnchorAxe:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.defSpur += 5;
                        targetUnit.resSpur += 5;
                        enemyUnit.defSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case Weapon.FlowingLancePlus:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.HelmBowPlus:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.invalidatesSpdBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.SkyPirateClaw:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                    }
                    break;
                case Weapon.ShirokiChiNoNaginata:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                        }
                    }
                    break;
                case Weapon.BladeOfShadow:
                case Weapon.SpearOfShadow:
                    if (!targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.SunsPercussors:
                    if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                        || enemyUnit.snapshot.restHpPercentage == 100
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.RauarRabbitPlus:
                case Weapon.BlarRabbitPlus:
                case Weapon.ConchBouquetPlus:
                case Weapon.MelonFloatPlus:
                case Weapon.HiddenThornsPlus:
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.StarpointLance:
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.ShinenNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!calcPotentialDamage
                            && targetUnit.snapshot.restHpPercentage >= 25
                            && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                        ) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case Weapon.StalwartSword:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                            targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                            targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                        }
                    }
                    break;
                case Weapon.SnipersBow:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                    }
                    break;
                case Weapon.ApotheosisSpear:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.BridesFang:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.JukishiNoJuso:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                        }

                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;

                case Weapon.KarenNoYumi:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                            targetUnit.defSpur += 4;
                        }
                    }
                    break;
                case Weapon.KurokiChiNoTaiken:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.BrutalBreath:
                    {
                        let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x => true);
                        let spur = 0;
                        if (count == 0) {
                            spur = 5;
                        } else if (count == 1) {
                            spur = 3;
                        } else if (count == 2) {
                            spur = 1;
                        }
                        targetUnit.addAllSpur(spur);

                        if (count <= 1) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.DarkScripture:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.resSpur -= 6;
                    }
                    break;
                case Weapon.Aymr:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.AkaiRyukishiNoOno:
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case Weapon.WindsOfChange:
                    if (targetUnit.isBuffed || targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.SpendthriftBowPlus:
                    targetUnit.atkSpur += 7;
                    enemyUnit.atkSpur -= 7;
                    this.damageCalc.writeDebugLog(`お大尽の弓により${targetUnit.getNameWithGroup()}の攻撃+7、${enemyUnit.getNameWithGroup()}の攻撃-7`);
                    break;
                case PassiveA.AtkSpdBond4:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                    }
                    break;
                case PassiveA.AtkDefBond4:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                    }
                    break;
                case PassiveA.AtkResBond4:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnResDebuff = true;
                    }
                    break;
                case Weapon.OgonNoFolkPlus:
                case Weapon.NinjinhuNoSosyokuPlus:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                    }
                    break;
                case Weapon.VezuruNoYoran:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                    }
                    break;
                case Weapon.SuyakuNoKen:
                    if (targetUnit.maxHpWithSkills > enemyUnit.snapshot.restHp) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.GrayNoHyouken:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.addAllSpur(3);
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case Weapon.Randgrior:
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.Rigarublade:
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        if (targetUnit.isWeaponRefined) {
                            targetUnit.atkSpur += 3;
                            targetUnit.spdSpur += 3;
                        }
                        else {
                            targetUnit.atkSpur += 2;
                            targetUnit.spdSpur += 2;
                        }
                    }
                    break;
                case Weapon.SeikenThirufingu:
                    if (isWeaponTypeTome(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5);
                    }
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 50) {
                                targetUnit.atkSpur += 5;
                                targetUnit.defSpur += 5;
                                if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                                    targetUnit.battleContext.followupAttackPriority++;
                                }
                            }
                        }
                    }
                    break;
                case Weapon.HikariNoKen:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.snapshot.restHpPercentage == 100) {
                            targetUnit.spdSpur += 4;
                            targetUnit.defSpur += 4;
                        }
                    }
                    break;
                case Weapon.OukeNoKen:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.initiatesCombat
                            || (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
                        ) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.snapshot.restHpPercentage >= 25) {
                                targetUnit.addAllSpur(5);
                            }
                        }
                    }
                    else if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.Fensariru:
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.Roputous:
                    if (!enemyUnit.isWeaponEffectiveAgainst(EffectiveType.Dragon)) {
                        enemyUnit.atkSpur -= 6;
                    }
                    break;
                case Weapon.Buryunhirude:
                    if (isWeaponTypeTome(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3);
                    }
                    break;
                case Weapon.Seini:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.isRangedWeaponType()) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3);
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.snapshot.restHpPercentage >= 50) {
                                targetUnit.atkSpur += 5;
                                targetUnit.resSpur += 5;
                                if (!this.__canInvalidateAbsoluteFollowupAttack(enemyUnit, targetUnit)) {
                                    targetUnit.battleContext.followupAttackPriority++;
                                }
                            }
                        }
                    }
                    else {
                        if (enemyUnit.moveType == MoveType.Armor || enemyUnit.moveType == MoveType.Cavalry) {
                            if (enemyUnit.isRangedWeaponType()) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3);
                            }
                        }
                    }
                    break;
                case Weapon.Gureipuniru:
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.atkSpur += 3;
                        targetUnit.spdSpur += 3;
                        if (targetUnit.isWeaponSpecialRefined) {
                            enemyUnit.addAllSpur(-4);
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                        }
                    }
                    break;
                case Weapon.Ivarudhi:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            targetUnit.atkSpur += 3;
                            targetUnit.spdSpur += 3;
                            targetUnit.resSpur += 3;
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                enemyUnit.atkSpur -= 5;
                                enemyUnit.resSpur -= 5;
                            }
                        }
                    }
                    else {
                        if (enemyUnit.snapshot.restHpPercentage == 100) {
                            targetUnit.atkSpur += 3;
                            targetUnit.spdSpur += 3;
                        }
                    }
                    break;
                case Weapon.Arrow:
                    if (targetUnit.getAtkInPrecombat() <= enemyUnit.getAtkInPrecombat() - 5) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.Naga:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (isWeaponTypeBreath(enemyUnit.weaponType)) {
                            targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                            targetUnit.battleContext.canCounterattackToAllDistance = true;
                        }
                    }
                    break;
                case Weapon.KiriNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                            x.weaponType == WeaponType.Sword || isWeaponTypeBreath(x.weaponType))
                        ) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                        }
                    }
                    break;
                case Weapon.ShikkyuMyurugure:
                case Weapon.MizuNoHimatsu:
                    if (this.__isAllyCountIsGreaterThanEnemyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.MugenNoSyo:
                    if (this.__isNextToOtherUnits(targetUnit)) {
                        enemyUnit.addAllSpur(-4);
                    }
                    break;
                case Weapon.Syurugu:
                    if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.Rifia:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.ShirokiNoTyouken:
                case Weapon.ShirokiNoTyokusou:
                case Weapon.ShirokiNoTansou:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x =>
                            x.moveType == MoveType.Flying) >= 2
                        ) {
                            targetUnit.addAllSpur(3);
                        }
                    }
                    break;
                case Weapon.OgonNoTanken:
                    if (targetUnit.isSpecialCharged) {
                        targetUnit.addAllSpur(3);
                    }
                    break;
                case Weapon.OkamijoouNoKiba:
                    {
                        let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x => true);
                        let amount = Math.min(6, count * 2);
                        targetUnit.atkSpur += amount;
                        targetUnit.spdSpur += amount;
                    }
                    break;
                case Weapon.GuradoNoSenfu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.isBuffed || targetUnit.isMobilityIncreased) {
                            targetUnit.spdSpur += 5;
                            targetUnit.defSpur += 5;
                        }
                    }
                    break;
                case Weapon.FeruniruNoYouran:
                    if (targetUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.HisenNoNinjinYariPlus:
                case Weapon.HaruNoYoukyuPlus:
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.addAllSpur(2);
                    }
                    break;
                case Weapon.Saferimuniru:
                    if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                        let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                        let diffHalf = Math.floor(diff * 0.5);
                        let amount = Math.max(0, Math.min(8, diffHalf));
                        enemyUnit.atkSpur -= amount;
                        enemyUnit.defSpur -= amount;
                    }
                    break;
                case Weapon.Erudofurimuniru:
                    if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                        let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                        let diffHalf = Math.floor(diff * 0.5);
                        let amount = Math.max(0, Math.min(8, diffHalf));
                        enemyUnit.atkSpur -= amount;
                        enemyUnit.spdSpur -= amount;
                    }
                    break;
                case Weapon.BoranNoBreath:
                    {
                        let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x => true);
                        if (count == 0) {
                            targetUnit.addAllSpur(6);
                        }
                        else if (count == 1) {
                            targetUnit.addAllSpur(4);
                        }
                        else if (count == 2) {
                            targetUnit.addAllSpur(2);
                        }
                    }
                    break;
                case Weapon.AsuNoSEikishiNoKen:
                    if (!enemyUnit.isBuffed) {
                        enemyUnit.atkSpur += 6;
                        enemyUnit.defSpur += 6;
                    }
                    break;
                case Weapon.Flykoogeru:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                        x.getDefInPrecombat() > targetUnit.getDefInPrecombat())
                    ) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.SyuryouNoEijin:
                    {
                        let atk = false;
                        let spd = false;
                        let def = false;
                        let res = false;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                            if (unit.getAtkInPrecombat() > targetUnit.getAtkInPrecombat()) {
                                atk = true;
                            }
                            if (unit.getSpdInPrecombat() > targetUnit.getSpdInPrecombat()) {
                                spd = true;
                            }
                            if (unit.getDefInPrecombat() > targetUnit.getDefInPrecombat()) {
                                def = true;
                            }
                            if (unit.getResInPrecombat() > targetUnit.getResInPrecombat()) {
                                res = true;
                            }
                        }
                        if (atk) { targetUnit.atkSpur += 5; }
                        if (spd) { targetUnit.spdSpur += 5; }
                        if (def) { targetUnit.defSpur += 5; }
                        if (res) { targetUnit.resSpur += 5; }
                    }
                    break;
                case Weapon.BerukaNoSatsufu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            enemyUnit.atkSpur -= 4;
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.SarieruNoOkama:
                    if (enemyUnit.isBuffed || enemyUnit.isMobilityIncreased) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.MagetsuNoSaiki:
                    if (this.isOddTurn || enemyUnit.snapshot.restHpPercentage < 100) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.TsubakiNoKinnagitou:
                    if (targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() - 3) {
                        targetUnit.addAllSpur(3);
                    }
                    break;
                case Weapon.SyugosyaNoKyofu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.atkSpur -= 3;
                        enemyUnit.defSpur -= 3;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.ByakuyaNoRyuuseki:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.atkSpur -= 3;
                        enemyUnit.spdSpur -= 3;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesSpdBuff = true;
                    }
                    break;
                case Weapon.YumikishiNoMiekyu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.atkSpur -= 4;
                        enemyUnit.defSpur -= 4;
                    }
                    break;
                case Weapon.KishisyogunNoHousou:
                    if (enemyUnit.snapshot.restHpPercentage < 100) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case Weapon.PieriNoSyousou:
                    if (targetUnit.snapshot.restHpPercentage < 100) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.Tangurisuni:
                    if (targetUnit.isBuffed || targetUnit.isMobilityIncreased) {
                        targetUnit.addAllSpur(3);
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.ChisouGeiborugu:
                    if (enemyUnit.moveType == MoveType.Infantry
                        || enemyUnit.moveType == MoveType.Armor
                        || enemyUnit.moveType == MoveType.Cavalry
                    ) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.KokukarasuNoSyo:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.getAtkInPrecombat() >= targetUnit.getAtkInPrecombat() + 3) {
                            this.damageCalc.writeDebugLog("黒鴉の書の効果が発動、敵の攻魔-6、奥義カウント変動量を-1");
                            enemyUnit.atkSpur -= 6;
                            enemyUnit.resSpur -= 6;
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.ThiamoNoAisou:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 70) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                    }
                    break;
                case Weapon.GeneiBattleAxe:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.defSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.BaraNoYari:
                    if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.AiNoSaiki:
                    if (targetUnit.isBuffed || targetUnit.snapshot.restHpPercentage >= 70) {
                        targetUnit.atkSpur += Math.floor(enemyUnit.getDefInPrecombat() * 0.25);
                        enemyUnit.atkSpur -= Math.floor(enemyUnit.getResInPrecombat() * 0.25);
                    }
                    break;
                case Weapon.RazuwarudoNoMaiken:
                    {
                        let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 3, x =>
                            x.buffTotal >= 10);
                        if (count >= 2) {
                            targetUnit.atkSpur += 3;
                            targetUnit.defSpur += 3;
                        }
                    }
                    break;
                case Weapon.ChichiNoSenjutsusyo:
                    if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case PassiveB.Tenmakoku3:
                    if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 7) {
                        let resDiff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                        let amount = Math.max(0, Math.min(7, Math.floor(resDiff * 0.5)));
                        enemyUnit.atkSpur -= amount;
                        enemyUnit.defSpur -= amount;
                    }
                    break;
                case PassiveB.WyvernFlight3:
                    if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 10) {
                        let defDiff = targetUnit.getEvalDefInPrecombat() - enemyUnit.getEvalDefInPrecombat();
                        let amount = Math.max(0, Math.min(7, Math.floor(defDiff * 0.5)));
                        enemyUnit.atkSpur -= amount;
                        enemyUnit.defSpur -= amount;
                    }
                    break;
                case Weapon.AsameiNoTanken:
                    if (!enemyUnit.snapshot.isRestHpFull) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.Jikurinde:
                    if (targetUnit.isWeaponSpecialRefined) {
                        let atk = 0;
                        let spd = 0;
                        let def = 0;
                        let res = 0;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                            if (!unit.hasStatusEffect(StatusEffectType.Panic)) {
                                atk = Math.max(atk, unit.atkBuff);
                                spd = Math.max(spd, unit.spdBuff);
                                def = Math.max(def, unit.defBuff);
                                res = Math.max(res, unit.resBuff);
                            }
                        }
                        targetUnit.atkSpur += atk;
                        targetUnit.spdSpur += spd;
                        targetUnit.defSpur += def;
                        targetUnit.resSpur += res;
                    }
                    break;
                case Weapon.RaikenJikurinde:
                    if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                        targetUnit.defSpur += 3;
                        targetUnit.resSpur += 3;
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.RyukenFalcion:
                    if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.Vorufuberugu:
                    if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.DevilAxe:
                    targetUnit.addAllSpur(4);
                    break;
                case Weapon.ZeroNoGyakukyu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        this.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.SyunsenAiraNoKen:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                targetUnit.addAllSpur(4);
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.2);
                            }
                        }
                    }
                    else {
                        this.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.WingSword:
                case Weapon.Romfire:
                    if (targetUnit.isWeaponSpecialRefined) {
                        this.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.KageroNoGenwakushin:
                    if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.Death:
                    targetUnit.addAllSpur(4);
                    break;
                case Weapon.RebbekkaNoRyoukyu:
                    if (targetUnit.isBuffed) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.UminiUkabuItaPlus:
                case Weapon.NangokuNoKajitsuPlus:
                    if (targetUnit.isBuffed) {
                        targetUnit.atkSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case Weapon.SunahamaNoScopPlus:
                case Weapon.SunahamaNoKuwaPlus:
                    if (targetUnit.isBuffed) {
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                    }
                    break;
                case Weapon.SakanaWoTsuitaMori:
                case Weapon.SakanaWoTsuitaMoriPlus:
                case Weapon.SuikaWariNoKonbo:
                case Weapon.SuikaWariNoKonboPlus:
                case Weapon.KorigashiNoYumi:
                case Weapon.KorigashiNoYumiPlus:
                case Weapon.Kaigara:
                case Weapon.KaigaraPlus:
                    if (targetUnit.snapshot.isRestHpFull) {
                        targetUnit.addAllSpur(2);
                    }
                    break;
                case Weapon.Kasaburanka:
                case Weapon.KasaburankaPlus:
                case Weapon.Grathia:
                case Weapon.GrathiaPlus:
                case Weapon.AoNoPresentBukuro:
                case Weapon.AoNoPresentBukuroPlus:
                case Weapon.MidoriNoPresentBukuro:
                case Weapon.MidoriNoPresentBukuroPlus:
                case Weapon.YamaNoInjaNoSyo:
                    if (enemyUnit.isRangedWeaponType()) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.SeisyoNaga:
                    targetUnit.battleContext.invalidateAllBuffs();
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                        if (targetUnit.getEvalResInPrecombat() >= enemyUnit.getEvalResInPrecombat() + 3) {
                            targetUnit.addAllSpur(3);
                        }
                    }
                    break;
                case Weapon.Forukuvangu:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.snapshot.restHpPercentage <= 80) {
                            targetUnit.atkSpur += 7;
                            targetUnit.defSpur += 7;
                        }
                    }
                    break;
                case Weapon.KizokutekinaYumi:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.hp > enemyUnit.hp) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    break;
                case Weapon.RunaNoEiken:
                    if (enemyUnit.getAtkInPrecombat() >= targetUnit.getAtkInPrecombat() + 3) {
                        targetUnit.addAllSpur(3);
                    }
                    break;
                case Weapon.Sekuvaveku:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case PassiveB.HikariToYamito:
                    enemyUnit.addAllSpur(-2);
                    targetUnit.battleContext.invalidateAllBuffs();

                    break;
                case Weapon.ShiseiNaga:
                    if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.Uchikudakumono:
                    targetUnit.battleContext.refersMinOfDefOrRes = true;
                    break;
                case Weapon.FerisiaNoKorizara:
                    targetUnit.battleContext.refersMinOfDefOrRes = true;
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (isWeaponTypeTome(enemyUnit.weaponType)) {
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                        }
                    }
                    break;
                case PassiveA.MadoNoYaiba3:
                    if (!calcPotentialDamage) {
                        let isActivated = false;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 1, false)) {
                            if (isWeaponTypeTome(unit.weaponType)) {
                                isActivated = true;
                                break;
                            }
                        }
                        if (isActivated) {
                            targetUnit.battleContext.refersMinOfDefOrRes = true;
                        }
                    }
                    break;
                case PassiveA.SeimeiNoGoka3:
                    if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.atkSpur += 6; }
                    break;
                case PassiveA.SeimeiNoShippu3:
                    if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.spdSpur += 6; }
                    break;
                case PassiveA.SeimeiNoDaichi3:
                    if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.defSpur += 6; }
                    break;
                case PassiveA.SeimeiNoSeisui3:
                    if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.resSpur += 6; }
                    break;
                case Weapon.GaeBolg:
                    if (enemyUnit.moveType == MoveType.Armor
                        || enemyUnit.moveType == MoveType.Cavalry
                        || enemyUnit.moveType == MoveType.Infantry
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        let units = this.enumerateUnitsInTheSameGroupOnMap(targetUnit);
                        let found = false;
                        for (let unit of units) {
                            if (unit.weaponType === WeaponType.Sword ||
                                unit.weaponType === WeaponType.Lance ||
                                unit.weaponType === WeaponType.Axe ||
                                unit.moveType === MoveType.Cavalry
                            ) {
                                found = true;
                            }
                        }
                        if (found) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                        }
                    }
                    break;
                case Weapon.Ragnarok:
                    if (isWeaponSpecialRefined(targetUnit.weaponRefinement)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        if (targetUnit.snapshot.restHpPercentage <= 80) {
                            targetUnit.atkSpur += 7;
                            targetUnit.spdSpur += 7;
                        }
                    }
                    else {
                        if (targetUnit.snapshot.isRestHpFull) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                    }
                    break;
                case Weapon.HokenSophia:
                    if (!targetUnit.isWeaponRefined) {
                        if (targetUnit.snapshot.isRestHpFull) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    else {
                        targetUnit.addAllSpur(4);
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (!targetUnit.snapshot.isRestHpFull || !enemyUnit.snapshot.isRestHpFull) {
                                targetUnit.addAllSpur(4);
                            }
                        }
                    }

                    break;
                case Weapon.ImbuedKoma:
                    if (targetUnit.isSpecialCharged) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.Marute:
                    if (targetUnit.isWeaponRefined) {
                        if (!targetUnit.battleContext.initiatesCombat
                            && targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                        }
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!targetUnit.battleContext.initiatesCombat
                            || enemyUnit.snapshot.restHpPercentage == 100) {
                            enemyUnit.atkSpur -= 6;
                            enemyUnit.defSpur -= 6;
                        }
                    }
                    break;
                case Weapon.HarukazeNoBreath:
                    if ((!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
                        || targetUnit.isBuffed
                    ) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                        enemyUnit.atkSpur -= 6;
                    }
                    break;
                case Weapon.LarceisEdge:
                    if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                        || enemyUnit.snapshot.isRestHpFull
                    ) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.Mulagir:
                    if (!targetUnit.isWeaponRefined) {
                        if (isWeaponTypeTome(enemyUnit.weaponType)
                        ) {
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    else {
                        if (enemyUnit.isRangedWeaponType()) {
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                        if (isWeaponSpecialRefined(targetUnit.weaponRefinement)) {
                            if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()) {
                                targetUnit.addAllSpur(4);
                            }
                        }
                    }
                    break;
                case Weapon.Ifingr:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.BookOfShadows:
                    if (this.__isNextToOtherUnits(targetUnit)) {
                        enemyUnit.addAllSpur(-4);
                    }
                    break;
                case Weapon.FellBreath:
                    if (enemyUnit.snapshot.restHpPercentage < 100) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.TaguelFang:
                    {
                        if (!this.__isNextToOtherUnitsExceptDragonAndBeast(targetUnit)) {
                            targetUnit.addAllSpur(3);
                        }
                    }
                    break;

                case Weapon.SnowsGrace:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.DivineBreath:
                    if (!calcPotentialDamage) {
                        let statusPlus = 0;
                        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                            if (isWeaponTypeBreath(allyUnit.weaponType)
                                || allyUnit.hasEffective(EffectiveType.Dragon)) {
                                statusPlus += 3;
                            }
                        }
                        if (statusPlus > 9) {
                            statusPlus = 9;
                        }
                        targetUnit.atkSpur += statusPlus;
                        targetUnit.spdSpur += statusPlus;
                        targetUnit.defSpur += statusPlus;
                        targetUnit.resSpur += statusPlus;
                    }
                    break;
                case PassiveA.AtkSpdPush3:
                    if (targetUnit.snapshot.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.spdSpur += 5; }
                    break;
                case PassiveA.AtkDefPush3:
                    if (targetUnit.snapshot.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.defSpur += 5; }
                    break;
                case PassiveA.AtkResPush3:
                    if (targetUnit.snapshot.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.resSpur += 5; }
                    break;
                case PassiveA.AtkDefPush4:
                    if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.defSpur += 7; }
                    break;
                case PassiveA.AtkResPush4:
                    if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.resSpur += 7; }
                    break;
                case PassiveA.AtkSpdPush4:
                    if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.spdSpur += 7; }
                    break;
                case PassiveA.DistantPressure:
                    if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.spdSpur += 5; }
                    break;
                case PassiveA.BrazenAtkSpd3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.spdSpur += 7; }
                    break;
                case PassiveA.BrazenAtkSpd4:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 9; targetUnit.spdSpur += 10; }
                    break;
                case PassiveA.BrazenAtkDef3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.defSpur += 7; }
                    break;
                case PassiveA.BrazenAtkRes3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.resSpur += 7; }
                    break;
                case PassiveA.BrazenDefRes3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.defSpur += 7; targetUnit.resSpur += 7; }
                    break;
                case PassiveA.BrazenSpdDef3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.spdSpur += 7; targetUnit.defSpur += 7; }
                    break;
                case PassiveA.BrazenSpdRes3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.spdSpur += 7; targetUnit.resSpur += 7; }
                    break;
                case Weapon.KurooujiNoYari:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.atkSpur -= 3;
                        enemyUnit.defSpur -= 3;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case PassiveB.LullAtkDef3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.defSpur -= 3;
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                    targetUnit.battleContext.invalidatesDefBuff = true;
                    break;
                case PassiveB.LullAtkSpd3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.spdSpur -= 3;
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                    targetUnit.battleContext.invalidatesSpdBuff = true;
                    break;
                case PassiveB.LullAtkRes3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.resSpur -= 3;
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                    targetUnit.battleContext.invalidatesResBuff = true;
                    break;
                case PassiveB.LullSpdDef3:
                    enemyUnit.spdSpur -= 3;
                    enemyUnit.defSpur -= 3;
                    targetUnit.battleContext.invalidatesSpdBuff = true;
                    targetUnit.battleContext.invalidatesDefBuff = true;
                    break;
                case PassiveB.LullSpdRes3:
                    enemyUnit.spdSpur -= 3;
                    enemyUnit.resSpur -= 3;
                    targetUnit.battleContext.invalidatesSpdBuff = true;
                    targetUnit.battleContext.invalidatesResBuff = true;
                    break;
                case PassiveB.BeokuNoKago:
                    if (enemyUnit.moveType == MoveType.Cavalry || enemyUnit.moveType == MoveType.Flying) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case PassiveB.KyokaMukoKinkyori3:
                    if (enemyUnit.isMeleeWeaponType()) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case PassiveB.KyokaMukoEnkyori3:
                    if (enemyUnit.isRangedWeaponType()) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case PassiveB.SpecialFighter3:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case Weapon.KabochaNoOno:
                case Weapon.KabochaNoOnoPlus:
                case Weapon.KoumoriNoYumi:
                case Weapon.KoumoriNoYumiPlus:
                case Weapon.KajuNoBottle:
                case Weapon.KajuNoBottlePlus:
                case Weapon.CancelNoKenPlus:
                case Weapon.CancelNoYariPlus:
                case Weapon.CancelNoOnoPlus:
                case Weapon.CancelNoOno:
                    targetUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveB.Cancel1:
                    if (targetUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case PassiveB.Cancel2:
                    if (targetUnit.snapshot.restHpPercentage >= 90) {
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case PassiveB.Cancel3:
                    if (targetUnit.snapshot.restHpPercentage >= 80) {
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case PassiveA.AtkSpdBojosen3:
                    {
                        let spurAmount = this.__calcBojosenSpurAmount();
                        targetUnit.atkSpur += spurAmount;
                        targetUnit.spdSpur += spurAmount;
                    }
                    break;
                case PassiveA.AtkResBojosen3:
                    {
                        let spurAmount = this.__calcBojosenSpurAmount();
                        targetUnit.atkSpur += spurAmount;
                        targetUnit.resSpur += spurAmount;
                    }
                    break;
                case PassiveA.SpdDefBojosen3:
                    {
                        let spurAmount = this.__calcBojosenSpurAmount();
                        targetUnit.spdSpur += spurAmount;
                        targetUnit.defSpur += spurAmount;
                    }
                    break;
                case PassiveA.DefResBojosen3:
                    {
                        let spurAmount = this.__calcBojosenSpurAmount();
                        targetUnit.resSpur += spurAmount;
                        targetUnit.defSpur += spurAmount;
                    }
                    break;
                case PassiveA.SpdResBojosen3:
                    {
                        let spurAmount = this.__calcBojosenSpurAmount();
                        targetUnit.spdSpur += spurAmount;
                        targetUnit.resSpur += spurAmount;
                    }
                    break;
                case PassiveA.AtkDefBojosen3:
                    {
                        let spurAmount = this.__calcBojosenSpurAmount();
                        targetUnit.atkSpur += spurAmount;
                        targetUnit.defSpur += spurAmount;
                    }
                    break;
                case PassiveA.AtkDefKojosen3:
                    {
                        let spurAmount = this.__calcKojosenSpurAmount();
                        targetUnit.atkSpur += spurAmount;
                        targetUnit.defSpur += spurAmount;
                    }
                    break;
                case PassiveA.AtkSpdKojosen3:
                    {
                        let spurAmount = this.__calcKojosenSpurAmount();
                        targetUnit.atkSpur += spurAmount;
                        targetUnit.spdSpur += spurAmount;
                    }
                    break;
                case PassiveA.SpdResKojosen3:
                    {
                        let spurAmount = this.__calcKojosenSpurAmount();
                        targetUnit.spdSpur += spurAmount;
                        targetUnit.resSpur += spurAmount;
                    }
                    break;
                case PassiveA.AtkSpdBojosen4: {
                    let spurAmount = this.__calcBojosen4SpurAmount();
                    targetUnit.atkSpur += spurAmount;
                    targetUnit.spdSpur += spurAmount;
                }
                    break;
            }
        }
    }

    __calcKojosenSpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        this.damageCalc.writeDebugLog(`攻城戦に影響する施設数: ${count}`);
        if (count <= 2) {
            return 10;
        }
        else if (count == 3) {
            return 7;
        }
        else if (count == 4) {
            return 4;
        }
        else {
            return 1;
        }
    }

    __calcBojosenSpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        this.damageCalc.writeDebugLog(`防城戦に影響する施設数: ${count}`);
        if (count >= 5) {
            return 10;
        }
        else if (count == 4) {
            return 7;
        }
        else if (count == 3) {
            return 4;
        }
        else {
            return 1;
        }
    }

    __calcBojosen4SpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        this.damageCalc.writeDebugLog(`防城戦4に影響する施設数: ${count}`);
        if (count >= 5) {
            return 11;
        } else if (count === 4) {
            return 7;
        } else {
            return 3;
        }
    }

    __countDefenceStructuresOnMap() {
        return this.__countBreakableDefenseStructuresWithoutEnergyOnMap() + 1;
    }

    __countBreakableDefenseStructuresWithoutEnergyOnMap() {
        let count = 0;
        for (let st of this.defenseStructureStorage.enumerateAllObjs()) {
            if (st.isOnMap && st instanceof DefenceStructureBase && !(st instanceof Ornament) && st.isBreakable && !st.isRequired) {
                ++count;
            }
        }
        return count;
    }

    __isSolo(unit) {
        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1)) {
            return false;
        }

        return true;
    }

    __countEnemiesActionDone(targetUnit) {
        let count = 0;
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
            if (unit.isActionDone) {
                ++count;
            }
        }
        return count;
    }

    __countAlliesActionDone(targetUnit) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit, false)) {
            if (unit.isActionDone) {
                ++count;
            }
        }
        return count;
    }

    __applySkillEffect(atkUnit, defUnit, calcPotentialDamage) {
        for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(defUnit, 2)) {
            switch (unit.weapon) {
                case Weapon.ElisesStaff:
                    if (unit.isWeaponSpecialRefined) {
                        defUnit.addAllSpur(-4);
                    }
                    break;
                case Weapon.RaisenNoSyo:
                    if (unit.isWeaponSpecialRefined) {
                        defUnit.spdSpur -= 5;
                        defUnit.resSpur -= 5;
                    }
                    break;
            }
        }

        if (atkUnit.isTransformed) {
            switch (atkUnit.weapon) {
                case Weapon.RefreshedFang:
                case Weapon.RaydreamHorn:
                case Weapon.BrightmareHorn:
                case Weapon.NightmareHorn:
                case Weapon.BrazenCatFang:
                case Weapon.NewBrazenCatFang:
                case Weapon.NewFoxkitFang:
                case Weapon.FoxkitFang:
                case Weapon.TaguelFang:
                case Weapon.TaguelChildFang:
                case Weapon.YoukoohNoTsumekiba:
                case Weapon.JunaruSenekoNoTsumekiba:
                    defUnit.atkSpur -= 4;
                    defUnit.defSpur -= 4;
                    break;
            }
        }
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.InstantLancePlus:
                    atkUnit.atkSpur += 4;
                    atkUnit.defSpur += 4;
                    break;
                case Weapon.CourtlyFanPlus:
                    atkUnit.atkSpur += 5;
                    atkUnit.spdSpur += 5;
                    break;
                case Weapon.BenihimeNoOno:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (defUnit.snapshot.restHpPercentage == 100) {
                            atkUnit.atkSpur += 5;
                            atkUnit.defSpur += 5;
                            atkUnit.battleContext.increaseCooldownCountForBoth();
                        }
                    }
                    break;
                case Weapon.KurooujiNoYari:
                    if (defUnit.snapshot.restHpPercentage == 100) {
                        atkUnit.atkSpur += 5;
                        atkUnit.defSpur += 5;
                        atkUnit.resSpur += 5;
                    }
                    break;
                case Weapon.VirtuousTyrfing:
                    if (atkUnit.snapshot.restHpPercentage <= 99) {
                        defUnit.atkSpur -= 6;
                        defUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.SummerStrikers:
                    if (atkUnit.snapshot.restHpPercentage >= 25) {
                        atkUnit.atkSpur += 5;
                        atkUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.HewnLance:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += 4;
                        atkUnit.defSpur += 4;
                    }
                    break;
                case Weapon.WhitedownSpear:
                    if (this.__countUnit(atkUnit.groupId, x => x.isOnMap && x.moveType == MoveType.Flying) >= 3) {
                        defUnit.atkSpur -= 4;
                        defUnit.defSpur -= 4;
                    }
                    break;
                case PassiveB.BeliefInLove:
                    if (defUnit.snapshot.restHpPercentage == 100) {
                        defUnit.atkSpur -= 5;
                        defUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.SatougashiNoAnki:
                    atkUnit.spdSpur += 4;
                    break;
                case Weapon.RinkahNoOnikanabo:
                    if (atkUnit.snapshot.restHpPercentage < 100) {
                        atkUnit.atkSpur += 5;
                        atkUnit.defSpur += 5;
                        atkUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.KokyousyaNoYari:
                    if (defUnit.snapshot.restHpPercentage >= 70) {
                        atkUnit.atkSpur += 5;
                        atkUnit.resSpur += 5;
                    }
                    break;
                case Weapon.HadesuOmega:
                    atkUnit.atkSpur += 4;
                    atkUnit.spdSpur += 4;
                    if (atkUnit.hasSpecial && atkUnit.tmpSpecialCount == 0) {
                        atkUnit.atkSpur += 6;
                    }
                    break;
                case Weapon.ZekkaiNoSoukyu:
                    if (defUnit.snapshot.restHpPercentage == 100) {
                        atkUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.GeneiFeather:
                    if (this.__isThereAnyAllyUnit(atkUnit, x => x.isActionDone)) {
                        atkUnit.atkSpur += 6;
                        atkUnit.spdSpur += 6;
                        atkUnit.battleContext.isDesperationActivated = true;
                    }
                    break;
                case Weapon.EishinNoAnki:
                    atkUnit.atkSpur += 5;
                    atkUnit.spdSpur += 5;
                    break;
                case Weapon.KinranNoSyo:
                    atkUnit.atkSpur += 6;
                    break;
                case Weapon.HelmsmanAxePlus:
                case Weapon.RauaFoxPlus:
                case Weapon.BlarfoxPlus:
                case Weapon.GronnfoxPlus:
                    defUnit.addAllSpur(-4);
                    break;
                case Weapon.RohyouNoKnife:
                    if (defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) {
                        atkUnit.defSpur += 20;
                    }
                    break;
                case Weapon.Paruthia:
                    if (!atkUnit.isWeaponRefined) {
                        atkUnit.resSpur += 4;
                    }
                    else {
                        if (isWeaponTypeTome(defUnit.weaponType)) {
                            atkUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3);
                        }
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (defUnit.isRangedWeaponType()) {
                                atkUnit.atkSpur += 6;
                            }
                        }
                    }
                    break;
                case Weapon.Yatonokami:
                    if (atkUnit.weaponRefinement == WeaponRefinementType.None) {
                        atkUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.KageroNoGenwakushin:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5);
                    }
                    break;
                case Weapon.KaigaraNoYari:
                case Weapon.KiagaraNoYariPlus:
                case Weapon.BeachFlag:
                case Weapon.BeachFlagPlus:
                case Weapon.YashiNoMiNoYumi:
                case Weapon.YashiNoMiNoYumiPlus:
                    atkUnit.addAllSpur(2);
                    break;
                case Weapon.Sangurizuru:
                    atkUnit.atkSpur += 3;
                    atkUnit.spdSpur += 3;
                    break;
                case Weapon.GeneiFalcion:
                    {
                        let count = this.__countAlliesActionDone(atkUnit);
                        let amount = Math.min(7, count * 2 + 3);
                        atkUnit.atkSpur += amount;
                        atkUnit.spdSpur += amount;
                    }
                    break;
                case PassiveA.YaibaNoSession3:
                    if (!calcPotentialDamage) {
                        let count = this.__countAlliesActionDone(atkUnit);
                        let amount = Math.min(9, count * 3 + 3);
                        atkUnit.atkSpur += amount;
                        atkUnit.spdSpur += amount;
                    }
                    break;
                case PassiveA.SteadyImpact:
                    atkUnit.spdSpur += 7;
                    atkUnit.defSpur += 10;
                    break;
                case PassiveA.SwiftImpact:
                    atkUnit.spdSpur += 7;
                    atkUnit.resSpur += 10;
                    break;
                case PassiveA.KishinKongoNoSyungeki:
                    atkUnit.atkSpur += 6;
                    atkUnit.defSpur += 10;
                    break;
                case PassiveA.KishinMeikyoNoSyungeki:
                    atkUnit.atkSpur += 6;
                    atkUnit.resSpur += 10;
                    break;
                case Weapon.BlazingDurandal:
                    atkUnit.battleContext.increaseCooldownCountForBoth();
                    atkUnit.battleContext.reducesCooldownCount = true;
                    if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                        atkUnit.spdSpur += 7;
                        atkUnit.defSpur += 10;
                    }
                    break;
                case Weapon.Balmung:
                    if (defUnit.snapshot.isRestHpFull) {
                        atkUnit.battleContext.invalidateAllOwnDebuffs();
                        atkUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.NinissIceLance:
                    atkUnit.addAllSpur(4);
                    break;
                case Weapon.Forblaze:
                    if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                        atkUnit.atkSpur += 6;
                    }
                    break;
                case Weapon.HanasKatana:
                    if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                        atkUnit.atkSpur += 4;
                        atkUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.Durandal:
                    atkUnit.atkSpur += 6;
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += 4;
                        atkUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.FurederikuNoKenfu:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += 6;
                    }
                    break;
                case Weapon.AijouNoHanaNoYumiPlus:
                case Weapon.BukeNoSteckPlus:
                    atkUnit.atkSpur += 4;
                    atkUnit.defSpur += 4;
                    break;
                case Weapon.JokerNoSyokki:
                    defUnit.addAllSpur(-4);
                    if (atkUnit.isWeaponSpecialRefined) {
                        let isActivated = false;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 3, false)) {
                            if (!unit.isFullHp) {
                                isActivated = true;
                                break;
                            }
                        }
                        if (isActivated) {
                            atkUnit.addAllSpur(4);
                        }
                    }
                    break;
                case PassiveA.DeathBlow3:
                    atkUnit.atkSpur += 6;
                    break;
                case PassiveA.DeathBlow4: atkUnit.atkSpur += 8; break;
                case Weapon.Toron:
                case Weapon.MiraiNoSeikishiNoYari:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.spdSpur += 6;
                    }
                    break;
                case PassiveA.HienNoIchigeki1: atkUnit.spdSpur += 2; break;
                case PassiveA.HienNoIchigeki2: atkUnit.spdSpur += 4; break;
                case PassiveA.HienNoIchigeki3: atkUnit.spdSpur += 6; break;
                case PassiveA.HienNoIchigeki4: atkUnit.spdSpur += 9; break;
                case PassiveA.KongoNoIchigeki3: atkUnit.defSpur += 6; break;
                case PassiveA.MeikyoNoIchigeki3: atkUnit.resSpur += 6; break;
                case Weapon.KurokiChiNoTaiken:
                case Weapon.FlowerStandPlus:
                case Weapon.CakeKnifePlus:
                case Weapon.SyukuhaiNoBottlePlus:
                case Weapon.SyukuhukuNoHanaNoYumiPlus:
                case PassiveA.KishinHienNoIchigeki2:
                    atkUnit.atkSpur += 4; atkUnit.spdSpur += 4;
                    break;
                case Weapon.Amite:
                case Weapon.KazahanaNoReitou:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += 4; atkUnit.spdSpur += 4;
                    }
                    break;
                case PassiveA.KishinHienNoIchigeki3: atkUnit.atkSpur += 6; atkUnit.spdSpur += 7; break;
                case PassiveA.KishinKongoNoIchigeki2: atkUnit.atkSpur += 4; atkUnit.defSpur += 4; break;
                case PassiveA.KishinMeikyoNoIchigeki2: atkUnit.atkSpur += 4; atkUnit.resSpur += 4; break;
                case PassiveA.HienKongoNoIchigeki2: atkUnit.spdSpur += 4; atkUnit.defSpur += 4; break;
                case PassiveA.HienMeikyoNoIchigeki2: atkUnit.spdSpur += 4; atkUnit.resSpur += 4; break;
                case PassiveA.KongoMeikyoNoIchigeki2: atkUnit.defSpur += 4; atkUnit.resSpur += 4; break;
                case Weapon.Sogun:
                    if (defUnit.weaponType == WeaponType.Sword
                        || defUnit.weaponType == WeaponType.Lance
                        || defUnit.weaponType == WeaponType.Axe
                        || isWeaponTypeBreath(defUnit.weaponType)) {
                        atkUnit.atkSpur += 4;
                        atkUnit.spdSpur += 4;
                        atkUnit.defSpur += 4;
                        atkUnit.resSpur += 4;
                    }
                    break;
            }
        }

        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.BenihimeNoOno:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += 5;
                        atkUnit.defSpur += 5;
                        atkUnit.battleContext.increaseCooldownCountForBoth();
                    }
                    break;
                case Weapon.KurooujiNoYari:
                    defUnit.atkSpur += 5;
                    defUnit.defSpur += 5;
                    defUnit.resSpur += 5;
                    break;
                case PassiveB.GuardBearing3:
                    if (!defUnit.isOneTimeActionActivatedForPassiveB) {
                        defUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5);
                    }
                    break;
                case Weapon.VirtuousTyrfing:
                    atkUnit.atkSpur -= 6;
                    atkUnit.defSpur -= 6;
                    break;
                case Weapon.StalwartSword:
                    atkUnit.atkSpur -= 6;
                    break;
                case PassiveB.BeliefInLove:
                    atkUnit.atkSpur -= 5;
                    atkUnit.defSpur -= 5;
                    break;
                case Weapon.RinkahNoOnikanabo:
                    defUnit.atkSpur += 5;
                    defUnit.defSpur += 5;
                    defUnit.battleContext.increaseCooldownCountForDefense = true;
                    break;
                case PassiveA.DistantFoil:
                case PassiveA.CloseFoil:
                    if (isPhysicalWeaponType(atkUnit.weaponType)) {
                        defUnit.atkSpur += 5;
                        defUnit.defSpur += 5;
                    }
                    break;
                case PassiveA.DistantWard:
                    if (!isPhysicalWeaponType(atkUnit.weaponType)) {
                        defUnit.atkSpur += 5;
                        defUnit.resSpur += 5;
                    }
                    break;
                case PassiveA.CloseWard:
                    if (!isPhysicalWeaponType(atkUnit.weaponType)) {
                        defUnit.atkSpur += 5;
                        defUnit.resSpur += 5;
                        defUnit.battleContext.invalidatesReferenceLowerMit = true;
                    }
                    break;
                case Weapon.KokyousyaNoYari:
                    defUnit.atkSpur += 5;
                    defUnit.resSpur += 5;
                    break;
                case Weapon.Vidofuniru:
                    if (!defUnit.isWeaponRefined) {
                        if (atkUnit.weaponType == WeaponType.Sword
                            || atkUnit.weaponType == WeaponType.Lance
                            || atkUnit.weaponType == WeaponType.Axe
                        ) {
                            defUnit.defSpur += 7;
                        }
                    } else {
                        if (atkUnit.weaponType == WeaponType.Sword
                            || atkUnit.weaponType == WeaponType.Lance
                            || atkUnit.weaponType == WeaponType.Axe
                            || isWeaponTypeBreath(atkUnit.weaponType)
                            || isWeaponTypeBeast(atkUnit.weaponType)
                        ) {
                            defUnit.defSpur += 7;
                            defUnit.ResSpur += 7;
                        }
                    }
                    break;
                case Weapon.Naga:
                    if (defUnit.isWeaponSpecialRefined) {
                        defUnit.defSpur += 4;
                        defUnit.resSpur += 4;
                    }
                    else {
                        defUnit.defSpur += 2;
                        defUnit.resSpur += 2;
                    }
                    break;
                case Weapon.ManatsuNoBreath:
                    defUnit.battleContext.increaseCooldownCountForDefense = true;
                    break;
                case Weapon.FurorinaNoSeisou:
                    if (atkUnit.weaponType == WeaponType.Sword
                        || atkUnit.weaponType == WeaponType.Lance
                        || atkUnit.weaponType == WeaponType.Axe
                        || isWeaponTypeBreathOrBeast(atkUnit.weaponType)
                    ) {
                        defUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.HinataNoMoutou:
                    defUnit.atkSpur += 4;
                    defUnit.defSpur += 4;
                    break;
                case Weapon.OboroNoShitsunagitou:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (atkUnit.isMeleeWeaponType()) {
                            defUnit.resSpur += 6;
                            defUnit.defSpur += 6;
                        }
                    }
                    break;
                case Weapon.ShishiouNoTsumekiba:
                    defUnit.addAllSpur(4);
                    break;
                case Weapon.YukyuNoSyo:
                    if (defUnit.isWeaponSpecialRefined) {
                        defUnit.resSpur += 4;
                        defUnit.defSpur += 4;
                    }
                    break;
                case Weapon.FutsugyouNoYari:
                    if (defUnit.isWeaponSpecialRefined) {
                        defUnit.atkSpur += 4;
                        defUnit.defSpur += 4;
                    }
                    break;
                case Weapon.ByakuyaNoRyuuseki:
                    if (!atkUnit.isBuffed) {
                        defUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.Blarserpent:
                case Weapon.BlarserpentPlus:
                case Weapon.GronnserpentPlus:
                case Weapon.RauarserpentPlus:
                    if (atkUnit.isRangedWeaponType()) {
                        defUnit.defSpur += 6;
                        defUnit.resSpur += 6;
                    }
                    break;
                case Weapon.GeneiFalcion:
                    {
                        let count = this.__countEnemiesActionDone(defUnit);
                        let amount = Math.max(3, 7 - count * 2);
                        defUnit.defSpur += amount;
                        defUnit.resSpur += amount;
                    }
                    break;
                case PassiveA.TateNoSession3:
                    if (!calcPotentialDamage) {
                        let count = this.__countEnemiesActionDone(defUnit);
                        let amount = Math.max(3, 9 - count * 3);
                        atkUnit.defSpur += amount;
                        atkUnit.resSpur += amount;
                    }
                    break;
                case Weapon.Balmung:
                    defUnit.battleContext.invalidateAllOwnDebuffs();
                    defUnit.addAllSpur(5);
                    break;
                case PassiveA.DartingBreath:
                    defUnit.spdSpur += 4;
                    defUnit.battleContext.increaseCooldownCountForBoth();
                    break;
                case PassiveA.KishinNoKokyu:
                    defUnit.atkSpur += 4;
                    defUnit.battleContext.increaseCooldownCountForBoth();
                    break;
                case PassiveA.KongoNoKokyu:
                    defUnit.defSpur += 4;
                    defUnit.battleContext.increaseCooldownCountForBoth();
                    break;
                case PassiveA.MeikyoNoKokyu:
                    defUnit.resSpur += 4;
                    defUnit.battleContext.increaseCooldownCountForBoth();
                    break;
                case Weapon.BerkutsLance:
                    defUnit.resSpur += 4;
                    break;
                case Weapon.BerkutsLancePlus:
                    if (defUnit.weaponRefinement == WeaponRefinementType.None) {
                        defUnit.resSpur += 4;
                    } else {
                        defUnit.resSpur += 7;
                    }
                    break;
                case Weapon.Ekkezakkusu:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (atkUnit.isRangedWeaponType()) {
                            defUnit.defSpur += 6;
                            defUnit.resSpur += 6;
                        }
                    }
                    break;
                case PassiveA.DistantDef4:
                    if (atkUnit.isRangedWeaponType()) {
                        defUnit.defSpur += 8;
                        defUnit.resSpur += 8;
                        defUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case PassiveA.CloseDef4:
                    if (atkUnit.isMeleeWeaponType()) {
                        defUnit.defSpur += 8;
                        defUnit.resSpur += 8;
                        defUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.EnkyoriBougyoNoYumiPlus:
                case PassiveA.DistantDef3:
                    if (atkUnit.isRangedWeaponType()) {
                        defUnit.defSpur += 6;
                        defUnit.resSpur += 6;
                    }
                    break;
                case PassiveA.CloseDef3:
                    if (atkUnit.isMeleeWeaponType()) {
                        defUnit.defSpur += 6;
                        defUnit.resSpur += 6;
                    }
                    break;
                case Weapon.MoumokuNoYumi:
                    if (atkUnit.isRangedWeaponType()) {
                        defUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.HuinNoKen:
                    if (defUnit.isWeaponSpecialRefined) {
                        defUnit.defSpur += 4;
                        defUnit.resSpur += 4;
                    }
                    else {
                        defUnit.defSpur += 2;
                        defUnit.resSpur += 2;
                    }
                    break;
                case Weapon.ShirokiChiNoNaginata:
                    defUnit.atkSpur += 4;
                    defUnit.defSpur += 4;
                    break;
                case Weapon.Seiju:
                case Weapon.SeijuPlus:
                case Weapon.HandBell:
                case Weapon.HandBellPlus:
                case Weapon.PresentBukuro:
                case Weapon.PresentBukuroPlus:
                case Weapon.Syokudai:
                case Weapon.SyokudaiPlus:
                    defUnit.addAllSpur(2);
                    break;
                case Weapon.MamoriNoKen:
                case Weapon.MamoriNoKenPlus:
                case Weapon.MamoriNoYariPlus:
                case Weapon.MamoriNoOnoPlus:
                    defUnit.defSpur += 7;
                    break;
                case Weapon.BariaNoKen:
                case Weapon.BariaNoKenPlus:
                case Weapon.BariaNoYariPlus:
                case Weapon.BarrierAxePlus:
                    defUnit.resSpur += 7;
                    break;
                case Weapon.HankoNoYari:
                case Weapon.HankoNoYariPlus:
                case Weapon.ReprisalAxePlus:
                case PassiveA.KishinNoKamae3:
                    defUnit.atkSpur += 6;
                    break;
                case PassiveA.HienNoKamae3: defUnit.spdSpur += 6; break;
                case PassiveA.KongoNoKamae3: defUnit.defSpur += 6; break;
                case PassiveA.MeikyoNoKamae3: defUnit.resSpur += 6; break;
                case PassiveA.KishinHienNoKamae2:
                    defUnit.atkSpur += 4; defUnit.spdSpur += 4; break;
                case PassiveA.KishinKongoNoKamae1:
                    defUnit.atkSpur += 2; defUnit.defSpur += 2;
                    break;
                case PassiveA.OstiasCounter:
                case Weapon.KorakuNoKazariYariPlus:
                case PassiveA.KishinKongoNoKamae2:
                    defUnit.atkSpur += 4; defUnit.defSpur += 4;
                    break;
                case Weapon.SaladaSandPlus:
                case PassiveA.KishinMeikyoNoKamae2:
                    defUnit.atkSpur += 4; defUnit.resSpur += 4;
                    break;
                case Weapon.GiyuNoYari:
                    if (defUnit.isWeaponSpecialRefined) {
                        defUnit.spdSpur += 4; defUnit.defSpur += 4;
                    }
                    break;
                case PassiveA.HienKongoNoKamae2: defUnit.spdSpur += 4; defUnit.defSpur += 4; break;
                case PassiveA.HienMeikyoNoKamae1: defUnit.spdSpur += 2; defUnit.resSpur += 2; break;
                case PassiveA.HienMeikyoNoKamae2: defUnit.spdSpur += 4; defUnit.resSpur += 4; break;
                case PassiveA.JaryuNoUroko:
                case Weapon.MizuNoBreath:
                case Weapon.MizuNoBreathPlus:
                case PassiveA.KongoMeikyoNoKamae2: defUnit.defSpur += 4; defUnit.resSpur += 4; break;
                case PassiveA.KongoNoKamae4:
                    defUnit.defSpur += 8;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.MeikyoNoKamae4:
                    defUnit.resSpur += 8;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.KishinMeikyoNoKamae3:
                    defUnit.atkSpur += 6;
                    defUnit.resSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.HienKongoNoKamae3:
                    defUnit.spdSpur += 6;
                    defUnit.defSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.SwiftStance3:
                    defUnit.spdSpur += 6;
                    defUnit.resSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.KishinKongoNoKamae3:
                    defUnit.atkSpur += 6;
                    defUnit.defSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.KishinHienNoKamae3:
                    defUnit.atkSpur += 6;
                    defUnit.spdSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.KongoMeikyoNoKamae3:
                    defUnit.resSpur += 6;
                    defUnit.defSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.SacaNoOkite:
                    if (this.__countAlliesWithinSpecifiedSpaces(defUnit, 2, x => true) >= 2) {
                        defUnit.addAllSpur(4);
                    }
                    break;
            }
        }
    }

    __applySkillEffectForAttackerAndDefenderFromAllies(atkUnit, defUnit) {
        if (atkUnit.canDisableEnemySpursFromAlly()) {
            return;
        }

        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 2)) {
            for (let skillId of allyUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.SunshadeStaff:
                        defUnit.battleContext.increaseCooldownCountForDefense = true;
                        defUnit.atkSpur += 6;
                        break;
                    case Weapon.Geirusukeguru:
                        if (allyUnit.isWeaponSpecialRefined) {
                            if (defUnit.isPhysicalAttacker()) {
                                defUnit.battleContext.increaseCooldownCountForBoth();
                            }
                        }
                        break;
                    case Weapon.MasyumaroNoTsuePlus:
                        defUnit.defSpur += 3;
                        defUnit.resSpur += 3;
                        break;
                }
            }
        }
    }
    __applySkillEffectFromAllies(unit, vsUnit, calcPotentialDamage) {
        if (vsUnit.canDisableEnemySpursFromAlly()) {
            return;
        }

        // 2マス以内の味方からの効果
        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
            for (let skillId of allyUnit.enumerateSkills()) {
                if (!calcPotentialDamage) {
                    switch (skillId) {
                        case PassiveC.DomainOfIce:
                            unit.battleContext.multDamageReductionRatioOfFirstAttack(0.3);
                            break;
                        case Weapon.RenewedFang:
                            if (unit.partnerHeroIndex === allyUnit.heroIndex ||
                                unit.heroIndex === allyUnit.partnerHeroIndex) {
                                unit.battleContext.increaseCooldownCountForBoth();
                            }
                            break;
                        case Weapon.CaduceusStaff:
                            {
                                unit.battleContext.multDamageReductionRatio(0.3);
                            }
                            break;
                        case Weapon.Flykoogeru:
                            if (unit.getDefInPrecombat() > allyUnit.getDefInPrecombat()) {
                                unit.atkSpur += 4;
                                unit.spdSpur += 4;
                            }
                            break;
                        case Weapon.YoukoohNoTsumekiba:
                            if (!allyUnit.hasStatusEffect(StatusEffectType.Panic)) {
                                unit.atkSpur += allyUnit.atkBuff;
                                unit.spdSpur += allyUnit.spdBuff;
                                unit.defSpur += allyUnit.defBuff;
                                unit.resSpur += allyUnit.resBuff;
                            }
                            break;
                        case Weapon.GengakkiNoYumiPlus:
                            if (vsUnit.isMeleeWeaponType()) {
                                unit.defSpur += 4;
                                unit.resSpur += 4;
                            }
                            break;
                        case Weapon.GinNoGobulettoPlus:
                            if (vsUnit.isRangedWeaponType()) {
                                unit.defSpur += 4;
                                unit.resSpur += 4;
                            }
                            break;
                        case PassiveC.CloseGuard1:
                            if (vsUnit.isMeleeWeaponType()) {
                                unit.defSpur += 2;
                                unit.resSpur += 2;
                            }
                            break;
                        case PassiveC.CloseGuard2:
                            if (vsUnit.isMeleeWeaponType()) {
                                unit.defSpur += 3;
                                unit.resSpur += 3;
                            }
                            break;
                        case PassiveC.CloseGuard3:
                            if (vsUnit.isMeleeWeaponType()) {
                                unit.defSpur += 4;
                                unit.resSpur += 4;
                            }
                            break;
                        case PassiveC.DistantGuard1:
                            if (vsUnit.isRangedWeaponType()) {
                                unit.defSpur += 2;
                                unit.resSpur += 2;
                            }
                            break;
                        case PassiveC.DistantGuard2:
                            if (vsUnit.isRangedWeaponType()) {
                                unit.defSpur += 3;
                                unit.resSpur += 3;
                            }
                            break;
                        case PassiveC.DistantGuard3:
                            if (vsUnit.isRangedWeaponType()) {
                                unit.defSpur += 4;
                                unit.resSpur += 4;
                            }
                            break;
                    }
                }
            }
        }

        switch (unit.passiveA) {
            case PassiveA.AsherasChosen:
                if (calcPotentialDamage || this.__isThereAllyExceptDragonAndBeastWithin1Space(unit) == false) {
                    unit.atkSpur += 6;
                    unit.defSpur += 6;
                }
                break;
        }
    }

    __isThereAllyExceptDragonAndBeastWithin1Space(unit) {
        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1)) {
            if (isWeaponTypeBreath(allyUnit.weaponType) == false
                && isWeaponTypeBeast(allyUnit.weaponType) == false) {
                return true;
            }
        }

        return false;
    }

    __setEffectiveAttackEnabledIfPossible(atkUnit, defUnit) {
        if (atkUnit.weaponInfo == null) {
            return;
        }

        atkUnit.battleContext.isEffectiveToOpponent = false;
        for (let effective of atkUnit.weaponInfo.effectives) {
            if (this.__isEffectiveAttackEnabled(defUnit, effective)) {
                atkUnit.battleContext.isEffectiveToOpponent = true;
                return;
            }
        }
        if (atkUnit.hasStatusEffect(StatusEffectType.EffectiveAgainstDragons)) {
            if (this.__isEffectiveAttackEnabled(defUnit, EffectiveType.Dragon)) {
                atkUnit.battleContext.isEffectiveToOpponent = true;
                return;
            }
        }
    }

    __isEffectiveAttackEnabled(unit, effective) {
        if (this.isEffectiveAttackInvalidated(unit, effective)) {
            // 特効無効
            return false;
        }

        switch (effective) {
            case EffectiveType.Armor: return unit.moveType == MoveType.Armor;
            case EffectiveType.Cavalry: return unit.moveType == MoveType.Cavalry;
            case EffectiveType.Flying: return unit.moveType == MoveType.Flying;
            case EffectiveType.Infantry: return unit.moveType == MoveType.Infantry;
            case EffectiveType.Dragon:
                return isWeaponTypeBreath(unit.weaponType)
                    || unit.weapon == Weapon.Roputous;
            case EffectiveType.Beast: return isWeaponTypeBeast(unit.weaponType);
            case EffectiveType.Tome: return isWeaponTypeTome(unit.weaponType);
            case EffectiveType.Sword: return unit.weaponType == WeaponType.Sword;
            case EffectiveType.Lance: return unit.weaponType == WeaponType.Lance;
            case EffectiveType.Axe: return unit.weaponType == WeaponType.Axe;
            case EffectiveType.ColorlessBow: return unit.weaponType == WeaponType.ColorlessBow;
        }

        return false;
    }

    isEffectiveAttackInvalidated(unit, effective) {
        if (unit.hasStatusEffect(StatusEffectType.ShieldFlying)) {
            if (effective === EffectiveType.Flying) {
                return true;
            }
        }

        if (unit.hasStatusEffect(StatusEffectType.SieldDragonArmor)) {
            if (effective == EffectiveType.Armor
                || effective == EffectiveType.Dragon
            ) {
                return true;
            }
        }

        for (let skillInfo of this.enumerateOwnWeaponAndPassiveSkillInfos(unit)) {
            if (skillInfo.invalidatedEffectives.includes(effective)) {
                return true;
            }
        }

        switch (unit.weapon) {
            case Weapon.Marute:
                if (unit.isWeaponRefined && effective == EffectiveType.Armor) {
                    return true;
                }
                break;
        }

        return false;
    }

    * enumerateOwnWeaponAndPassiveSkillInfos(unit) {
        let weaponInfo = this.__findWeaponInfo(unit.weapon);
        if (weaponInfo != null) {
            yield weaponInfo;
        }
        let passiveAInfo = this.__findPassiveAInfo(unit.passiveA);
        if (passiveAInfo != null) {
            yield passiveAInfo;
        }
        let passiveBInfo = this.__findPassiveBInfo(unit.passiveB);
        if (passiveBInfo != null) {
            yield passiveBInfo;
        }
        let passiveCInfo = this.__findPassiveCInfo(unit.passiveC);
        if (passiveCInfo != null) {
            yield passiveCInfo;
        }
        let passiveSInfo = this.__findPassiveSInfo(unit.passiveS);
        if (passiveSInfo != null) {
            yield passiveSInfo;
        }
    }

    * enumerateUnitsWithinSpecifiedRange(posX, posY, unitGroup, rangeHorLength, rangeVerLength) {
        let halfHorLength = Math.floor(rangeHorLength / 2);
        let xRangeBegin = posX - halfHorLength;
        let xRangeEnd = posX + halfHorLength;
        let halfVerLength = Math.floor(rangeVerLength / 2);
        let yRangeBegin = posY - halfVerLength;
        let yRangeEnd = posY + halfVerLength;
        for (let unit of this.enumerateUnitsInSpecifiedGroup(unitGroup)) {
            if (xRangeBegin <= unit.posX && unit.posX <= xRangeEnd
                && yRangeBegin <= unit.posY && unit.posY <= yRangeEnd) {
                yield unit;
            }
        }
    }

    * enumerateUnitsWithinSpecifiedSpaces(posX, posY, unitGroup, spaces) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(unitGroup)) {
            if (!unit.isOnMap) { continue; }
            let dist = Math.abs(unit.posX - posX) + Math.abs(unit.posY - posY);
            if (dist <= spaces) {
                yield unit;
            }
        }
    }

    * enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        let targetGroup = this.getDifferentGroup(targetUnit);
        for (let unit of this.enumerateUnitsWithinSpecifiedSpaces(targetUnit.posX, targetUnit.posY, targetGroup, spaces)) {
            yield unit;
        }
    }

    * enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit, withTargetUnit)) {
            let dist = Math.abs(unit.posX - targetUnit.posX) + Math.abs(unit.posY - targetUnit.posY);
            if (dist <= spaces) {
                yield unit;
            }
        }
    }

    enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit = false) {
        return g_appData.enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit);
    }

    getDifferentGroup(targetUnit) {
        let targetGroup = UnitGroupType.Ally;
        if (targetUnit.groupId == targetGroup) {
            targetGroup = UnitGroupType.Enemy;
        }
        return targetGroup;
    }
    * enumerateUnitsInTheSameGroupOnMap(targetUnit, withTargetUnit = false) {
        for (let unit of this.enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit)) {
            if (unit.isOnMap) {
                yield unit;
            }
        }
    }
    * enumerateUnitsInDifferentGroupOnMap(targetUnit) {
        for (let unit of this.enumerateUnitsInDifferentGroup(targetUnit)) {
            if (unit.isOnMap) {
                yield unit;
            }
        }
    }
    * enumerateUnitsInDifferentGroup(targetUnit) {
        let targetGroup = this.getDifferentGroup(targetUnit);
        for (let unit of this.enumerateUnitsInSpecifiedGroup(targetGroup)) {
            if (unit != targetUnit) {
                yield unit;
            }
        }
    }

    * enumerateEnemyUnitsOnMap() {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(UnitGroupType.Enemy)) {
            if (unit.isOnMap) {
                yield unit;
            }
        }
    }
    * enumerateEnemyUnits() {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(UnitGroupType.Enemy)) {
            yield unit;
        }
    }
    * enumerateAllyUnitsOnMap() {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(UnitGroupType.Ally)) {
            if (unit.isOnMap) {
                yield unit;
            }
        }
    }
    * enumerateAllyUnits() {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(UnitGroupType.Ally)) {
            yield unit;
        }
    }

    enumerateUnitsInSpecifiedGroup(groupId) {
        return g_appData.enumerateUnitsInSpecifiedGroup(groupId);
    }

    showDamageCalcSummary(atkUnit, defUnit, attackTile) {
        let result = this.calcDamageTemporary(atkUnit, defUnit, attackTile);
        this.setDamageCalcSummary(
            atkUnit,
            result.defUnit,
            this.__createDamageCalcSummaryHtml(atkUnit,
                result.preCombatDamage,
                result.atkUnit_normalAttackDamage, result.atkUnit_totalAttackCount,
                result.atkUnit_atk,
                result.atkUnit_spd,
                result.atkUnit_def,
                result.atkUnit_res),
            this.__createDamageCalcSummaryHtml(result.defUnit,
                -1,
                result.defUnit_normalAttackDamage, result.defUnit_totalAttackCount,
                result.defUnit_atk,
                result.defUnit_spd,
                result.defUnit_def,
                result.defUnit_res));
    }

    clearDamageCalcSummary() {
        let defaultMessage = "ここにダメージを<br/>表示します";
        this.vm.attackerInfo = defaultMessage;
        this.vm.attackTargetInfo = defaultMessage;
        this.vm.attackerUnitIndex = -1;
        this.vm.attackTargetUnitIndex = -1;
        g_appData.__showStatusToAttackerInfo();
    }

    __createDamageCalcSummaryHtml(unit, preCombatDamage, damage, attackCount,
        atk, spd, def, res
    ) {
        let html = "HP: " + unit.hp + " → ";
        if (unit.restHp == 0) {
            html += "<span style='color:#ffaaaa'>" + unit.restHp + "</span><br/>";
        }
        else {
            html += unit.restHp + "<br/>";
        }

        if (attackCount > 0) {
            html += "攻撃: ";
            if (preCombatDamage > 0) {
                html += `${preCombatDamage}+`;
            }
            html += `${damage}`;
            if (attackCount > 1) {
                html += "×" + attackCount;
            }
            html += "<br/>";
        }
        html += `(攻${atk},速${spd},守${def},魔${res})`;

        return html;
    }


    __isNear(unitA, unitB, nearRange) {
        let diffX = Math.abs(unitA.posX - unitB.posX);
        let diffY = Math.abs(unitA.posY - unitB.posY);
        let dist = diffX + diffY;
        return dist <= nearRange;
    }

    __isInCloss(unitA, unitB) {
        return unitA.posX == unitB.posX || unitA.posY == unitB.posY;
    }

    updateCurrentUnitSpur() {
        this.__updateUnitSpur(this.currentUnit);
    }

    updateAllUnitSpur(calcPotentialDamage = false) {
        for (let unit of this.enumerateUnits()) {
            if (!unit.isOnMap) {
                continue;
            }
            this.__updateUnitSpur(unit, calcPotentialDamage);
        }
    }
    updateSpurForSpecifiedGroupUnits(groupId, calcPotentialDamage = false) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (!unit.isOnMap) {
                continue;
            }
            this.__updateUnitSpur(unit, calcPotentialDamage);
        }
    }
    __updateUnitSpur(targetUnit, calcPotentialDamage = false, ignoresSkillEffectFromAllies = false) {
        targetUnit.resetSpurs();

        if (!calcPotentialDamage) {
            if (!ignoresSkillEffectFromAllies) {
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    // 距離に関係ないもの
                    {
                        for (let skillId of unit.enumerateSkills()) {
                            switch (skillId) {
                                case PassiveC.WingsOfLight:
                                    if (targetUnit.isMythicHero
                                        && this.vm.currentTurn <= 5
                                        && this.__countUnit(targetUnit.groupId, x => x.isOnMap && x.isMythicHero) <= 3
                                    ) {
                                        targetUnit.addAllSpur(2 + this.vm.currentTurn);
                                    }
                                    break;
                            }
                        }
                    }

                    if (Math.abs(unit.posX - targetUnit.posX) <= 1 && Math.abs(unit.posY - targetUnit.posY) <= 2) {
                        // 5×3マス以内にいる場合
                        for (let skillId of unit.enumerateSkills()) {
                            switch (skillId) {
                                case Weapon.FlowerOfPlenty:
                                    targetUnit.atkSpur += 3;
                                    targetUnit.resSpur += 3;
                                    break;
                            }
                        }
                    }

                    if (Math.abs(unit.posX - targetUnit.posX) <= 3 && Math.abs(unit.posY - targetUnit.posY) <= 3) {
                        // 7×7マス以内にいる場合
                        for (let skillId of unit.enumerateSkills()) {
                            switch (skillId) {
                                case Weapon.DaichiBoshiNoBreath:
                                    {
                                        targetUnit.addAllSpur(2);
                                    }
                                    break;
                            }
                        }
                    }

                    if (this.__isNear(unit, targetUnit, 3)) {
                        // 3マス以内で発動する戦闘中バフ
                        for (let skillId of unit.enumerateSkills()) {
                            switch (skillId) {
                                case Weapon.FirstDreamBow:
                                    targetUnit.atkSpur += 4;
                                    break;
                                case Weapon.Hlidskjalf:
                                    if (unit.isWeaponSpecialRefined) {
                                        targetUnit.atkSpur += 3;
                                        targetUnit.spdSpur += 3;
                                    }
                                    break;
                            }
                        }
                    }

                    if (this.__isNear(unit, targetUnit, 3)) {
                        // 3マス以内で発動する戦闘中バフ
                        // this.writeDebugLogLine(unit.getNameWithGroup() + "の3マス以内で発動する戦闘中バフを" + targetUnit.getNameWithGroup() + "に適用");
                        this.__addSpurInRange3(targetUnit, unit, calcPotentialDamage);
                    }

                    if (this.__isNear(unit, targetUnit, 2)) {
                        // 2マス以内で発動する戦闘中バフ
                        // this.writeDebugLogLine(unit.getNameWithGroup() + "の2マス以内で発動する戦闘中バフを" + targetUnit.getNameWithGroup() + "に適用");
                        this.__addSpurInRange2(targetUnit, unit, calcPotentialDamage);
                    }

                    if (this.__isNear(unit, targetUnit, 1)) {
                        // 1マス以内で発動する戦闘中バフ
                        this.__addSpurInRange1(targetUnit, unit.passiveC, calcPotentialDamage);
                        this.__addSpurInRange1(targetUnit, unit.passiveS, calcPotentialDamage);
                    }

                    if (this.__isInCloss(unit, targetUnit)) {
                        // 十字方向
                        switch (unit.weapon) {
                            case Weapon.BondOfTheAlfar:
                                targetUnit.atkSpur += 6;
                                break;
                            case Weapon.FlowerOfJoy:
                                targetUnit.atkSpur += 3;
                                targetUnit.spdSpur += 3;
                                break;
                        }
                    }
                }
            }

            // 周囲の敵から受ける戦闘中弱化
            {
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
                    if (this.__isInCloss(unit, targetUnit)) {
                        // 十字方向
                        switch (unit.weapon) {
                            case Weapon.FlowerOfSorrow:
                                targetUnit.defSpur -= 4;
                                targetUnit.resSpur -= 4;
                                break;
                        }
                    }
                }

                for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                    for (let skillId of unit.enumerateSkills()) {
                        switch (skillId) {
                            case Weapon.Gurimowaru:
                                if (targetUnit.isWeaponSpecialRefined) {
                                    targetUnit.atkSpur -= 4;
                                    targetUnit.spdSpur -= 4;
                                    targetUnit.resSpur -= 4;
                                }
                                break;
                            case Weapon.SenhimeNoWakyu:
                                if (unit.isWeaponSpecialRefined) {
                                    targetUnit.atkSpur -= 4;
                                    targetUnit.spdSpur -= 4;
                                    targetUnit.defSpur -= 4;
                                }
                                break;
                            case Weapon.FirstDreamBow:
                                targetUnit.atkSpur -= 4;
                                break;
                            case Weapon.Hlidskjalf:
                                if (unit.isWeaponSpecialRefined) {
                                    targetUnit.defSpur -= 3;
                                    targetUnit.resSpur -= 3;
                                }
                                break;
                        }
                    }
                }

                for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                    for (let skillId of unit.enumerateSkills()) {
                        switch (skillId) {
                            case Weapon.UnboundBlade:
                            case Weapon.UnboundBladePlus:
                                if (this.__isSolo(unit)) {
                                    targetUnit.atkSpur -= 5;
                                    targetUnit.defSpur -= 5;
                                }
                                break;
                            case Weapon.DanielMadeBow:
                                targetUnit.atkSpur -= 5;
                                break;
                            case Weapon.ObsessiveCurse:
                                targetUnit.spdSpur -= 5;
                                targetUnit.resSpur -= 5;
                                break;
                            case PassiveC.AtkSpdRein3:
                                targetUnit.atkSpur -= 4;
                                targetUnit.spdSpur -= 4;
                                break;
                            case PassiveC.AtkDefRein3:
                                targetUnit.atkSpur -= 4;
                                targetUnit.defSpur -= 4;
                                break;
                            case PassiveC.AtkResRein3:
                                targetUnit.atkSpur -= 4;
                                targetUnit.resSpur -= 4;
                                break;
                            case Weapon.ReinBow:
                            case Weapon.ReinBowPlus:
                            case PassiveC.SpdDefRein3:
                                targetUnit.spdSpur -= 4;
                                targetUnit.defSpur -= 4;
                                break;
                            case PassiveC.SpdResRein3:
                                targetUnit.spdSpur -= 4;
                                targetUnit.resSpur -= 4;
                                break;
                            case PassiveC.DefResRein3:
                                targetUnit.defSpur -= 4;
                                targetUnit.resSpur -= 4;
                                break;
                            case Weapon.YashiNoKiNoTsuePlus:
                                targetUnit.atkSpur -= 5;
                                targetUnit.spdSpur -= 5;
                                break;
                            case Weapon.CoralBowPlus:
                                targetUnit.spdSpur -= 5;
                                targetUnit.defSpur -= 5;
                                break;
                            case Weapon.FloraGuidPlus:
                                targetUnit.spdSpur -= 5;
                                targetUnit.resSpur -= 5;
                                break;
                            case Weapon.ExoticFruitJuice:
                                targetUnit.spdSpur -= 6;
                                targetUnit.resSpur -= 6;
                                break;
                            case Weapon.TharjasHex:
                                if (unit.isWeaponSpecialRefined) {
                                    targetUnit.atkSpur -= 4;
                                    targetUnit.spdSpur -= 4;
                                }
                                break;
                            case Weapon.GeneiLod:
                                targetUnit.atkSpur -= 6;
                                targetUnit.resSpur -= 6;
                                break;
                            case Weapon.Gurgurant:
                                targetUnit.atkSpur -= 5;
                                targetUnit.defSpur -= 5;
                                break;
                            case PassiveC.InevitableDeath:
                                targetUnit.atkSpur -= 4;
                                targetUnit.spdSpur -= 4;
                                targetUnit.defSpur -= 4;
                                targetUnit.resSpur -= 4;
                                break;
                        }
                    }
                }
            }
        }

        let isAllyAvailableRange1 = false;
        let isAllyAvailableRange2 = false;

        // 支援
        if (!calcPotentialDamage)// ワユ教授の資料だと支援は加味されると書いてあるが検証したら含まれなかった
        {
            // 支援は重複しないので元も近いユニットで計算
            let nearestPartner = null;
            let nearestDist = 1000;
            for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                if (targetUnit.partnerHeroIndex == unit.heroIndex) {
                    let dist = calcDistance(targetUnit.posX, targetUnit.posY, unit.posX, unit.posY);
                    if (dist < nearestDist) {
                        nearestPartner = unit;
                        nearestDist = dist;
                    }
                }
            }

            if (nearestPartner != null) {
                let unit = nearestPartner;
                switch (targetUnit.partnerLevel) {
                    case PartnerLevel.C:
                        if (this.__isNear(unit, targetUnit, 1)) {
                            targetUnit.resSpur += 2;
                        } else if (this.__isNear(unit, targetUnit, 2)) {
                            targetUnit.resSpur += 1;
                        }
                        break;
                    case PartnerLevel.B:
                        if (this.__isNear(unit, targetUnit, 1)) {
                            targetUnit.defSpur += 2;
                            targetUnit.resSpur += 2;
                        } else if (this.__isNear(unit, targetUnit, 2)) {
                            targetUnit.defSpur += 1;
                            targetUnit.resSpur += 1;
                        }
                        break;
                    case PartnerLevel.A:
                        if (this.__isNear(unit, targetUnit, 1)) {
                            targetUnit.spdSpur += 2;
                            targetUnit.defSpur += 2;
                            targetUnit.resSpur += 2;
                        } else if (this.__isNear(unit, targetUnit, 2)) {
                            targetUnit.spdSpur += 1;
                            targetUnit.defSpur += 1;
                            targetUnit.resSpur += 1;
                        }
                        break;
                    case PartnerLevel.S:
                        if (this.__isNear(unit, targetUnit, 1)) {
                            targetUnit.addAllSpur(2);
                        } else if (this.__isNear(unit, targetUnit, 2)) {
                            targetUnit.addAllSpur(1);
                        }
                        break;
                }
            }
        }

        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__isNear(unit, targetUnit, 2)) {
                // 2マス以内で発動する戦闘中バフ
                // this.writeDebugLogLine(unit.getNameWithGroup() + "の2マス以内で発動する戦闘中バフを" + targetUnit.getNameWithGroup() + "に適用");
                this.__addSelfSpurInRange2(targetUnit, targetUnit.passiveA, calcPotentialDamage);
                this.__addSelfSpurInRange2(targetUnit, targetUnit.weapon, calcPotentialDamage);
                isAllyAvailableRange2 = true;
            }

            if (this.__isNear(unit, targetUnit, 1)) {
                // 1マス以内で発動する戦闘中バフ
                this.__addSelfSpurInRange1(targetUnit, targetUnit.weapon, calcPotentialDamage);
                isAllyAvailableRange1 = true;
            }
        }

        if (isAllyAvailableRange1) {
            for (let skillId of targetUnit.enumerateSkills()) {
                this.__addSelfSpurIfAllyAvailableInRange1(targetUnit, skillId, calcPotentialDamage);
            }
        }
        if (isAllyAvailableRange2) {
            for (let skillId of targetUnit.enumerateSkills()) {
                this.__addSelfSpurIfAllyAvailableInRange2(targetUnit, skillId, calcPotentialDamage);
            }
        }

        for (let skillId of targetUnit.enumerateSkills()) {
            if (!calcPotentialDamage) {
                switch (skillId) {
                    case Weapon.AstralBreath:
                        if (this.__isTherePartnerInSpace3(targetUnit)) {
                            targetUnit.addAllSpur(5);
                        }
                        break;
                    case Weapon.Rigarublade:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => isWeaponTypeTome(x.weaponType) && x.moveType == MoveType.Infantry)
                            ) {
                                targetUnit.addAllSpur(3);
                            }
                        }
                        break;
                    case Weapon.Vidofuniru:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => x.moveType == MoveType.Armor || x.moveType == MoveType.Infantry)
                            ) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                            }
                        }
                        break;
                    case Weapon.HinokaNoKounagitou:
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                            x => x.moveType == MoveType.Flying || x.moveType == MoveType.Infantry)
                        ) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                        break;
                    case Weapon.KamiraNoEnfu:
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                            x => x.moveType == MoveType.Flying || x.moveType == MoveType.Cavalry)
                        ) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                        break;
                    case Weapon.Simuberin:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => x.moveType == MoveType.Flying)
                            ) {
                                targetUnit.atkSpur += 5;
                                targetUnit.resSpur += 5;
                            }
                        }
                        break;
                    case Weapon.Ora:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => x.weaponType == WeaponType.Staff || isWeaponTypeTome(x.weaponType))
                            ) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                            }
                        }
                        break;
                    case Weapon.KyomeiOra:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                                x.isMeleeWeaponType())
                            ) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                            }
                        }
                        break;
                    case Weapon.Excalibur:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                                x.weaponType == WeaponType.Staff || isWeaponTypeTome(x.weaponType))
                            ) {
                                targetUnit.atkSpur += 4;
                                targetUnit.spdSpur += 4;
                            }
                        }
                        break;
                    case Weapon.KentoushiNoGoken:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                                x.moveType == MoveType.Infantry || x.moveType == MoveType.Flying)
                            ) {
                                targetUnit.atkSpur += 4;
                                targetUnit.spdSpur += 4;
                            }
                        }
                        break;
                    case Weapon.RosenshiNoKofu:
                        if (targetUnit.isWeaponSpecialRefined) {
                            let isAvailable = false;
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                                if (unit.moveType == MoveType.Infantry
                                    || unit.moveType == MoveType.Cavalry) {
                                    unit.atkSpur += 3;
                                    unit.defSpur += 3;
                                    isAvailable = true;
                                }
                            }
                            if (isAvailable) {
                                targetUnit.atkSpur += 3;
                                targetUnit.defSpur += 3;
                            }
                        }
                        break;
                    case Weapon.YouheidanNoNakayari:
                        if (targetUnit.isWeaponSpecialRefined) {
                            let isAvailable = false;
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                                if (unit.moveType == MoveType.Infantry
                                    || unit.moveType == MoveType.Cavalry) {
                                    unit.atkSpur += 3;
                                    unit.spdSpur += 3;
                                    isAvailable = true;
                                }
                            }
                            if (isAvailable) {
                                targetUnit.atkSpur += 3;
                                targetUnit.spdSpur += 3;
                            }
                        }
                        break;
                    case Weapon.KachuNoYari:
                    case Weapon.HimekishiNoYari:
                        if (targetUnit.isWeaponSpecialRefined) {
                            let partners = this.__getPartnersInSpecifiedRange(targetUnit, 2);
                            for (let unit of partners) {
                                unit.addAllSpur(3);
                            }
                            if (partners.length > 0) {
                                targetUnit.addAllSpur(3);
                            }
                        }
                        break;
                    case Weapon.Nizuheggu:
                    case Weapon.KatarinaNoSyo:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.atkSpur += amount;
                                unit.spdSpur += amount;
                                unit.defSpur += amount;
                                unit.resSpur += amount;
                            }, 0, 1, 100);
                        break;
                    case Weapon.KurohyoNoYari:
                    case Weapon.MogyuNoKen:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.atkSpur += amount;
                                unit.defSpur += amount;
                            });
                        break;
                    case Weapon.KiraboshiNoBreathPlus:
                    case Weapon.HuyumatsuriNoBootsPlus:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.defSpur += amount;
                                unit.resSpur += amount;
                            });
                        break;
                    case Weapon.NifuruNoHyoka:
                        if (targetUnit.isWeaponRefined) break;
                    case Weapon.MusuperuNoEnka:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.atkSpur += amount;
                                unit.spdSpur += amount;
                            });
                        break;
                    case PassiveA.SpdResForm3:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.spdSpur += amount;
                                unit.resSpur += amount;
                            }, 1);
                        break;
                    case PassiveA.AtkSpdForm3:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.atkSpur += amount;
                                unit.spdSpur += amount;
                            }, 1);
                        break;
                    case PassiveA.AtkDefForm3:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.atkSpur += amount;
                                unit.defSpur += amount;
                            }, 1);
                        break;
                    case PassiveA.AtkResForm3:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.atkSpur += amount;
                                unit.resSpur += amount;
                            }, 1);
                        break;
                    case PassiveA.SpdDefForm3:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.spdSpur += amount;
                                unit.defSpur += amount;
                            }, 1);
                        break;
                    case PassiveA.DefResForm3:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.defSpur += amount;
                                unit.resSpur += amount;
                            }, 1);
                        break;
                }
            }
        }

        if (this.__isSolo(targetUnit) || calcPotentialDamage) {
            for (let skillId of targetUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.TallHammer:
                        if (targetUnit.isWeaponRefined) {
                            targetUnit.spdSpur += 6;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                        break;
                    case Weapon.SurvivalistBow:
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        break;
                    case Weapon.DoubleBow:
                        targetUnit.addAllSpur(5);
                        break;
                    case Weapon.GousouJikumunto:
                    case Weapon.KokkiNoKosou:
                    case Weapon.MaritaNoKen:
                        targetUnit.addAllSpur(4);
                        break;
                    case Weapon.ShirejiaNoKaze:
                    case Weapon.BrazenCatFang:
                    case Weapon.VengefulLance:
                    case PassiveA.AtkSpdSolo3:
                        targetUnit.atkSpur += 6; targetUnit.spdSpur += 6;
                        break;
                    case PassiveA.AtkDefSolo4:
                        targetUnit.atkSpur += 7; targetUnit.defSpur += 7;
                        break;
                    case PassiveA.AtkSpdSolo4:
                        targetUnit.atkSpur += 7; targetUnit.spdSpur += 7;
                        break;
                    case PassiveA.AtkResSolo3:
                        targetUnit.atkSpur += 6; targetUnit.resSpur += 6;
                        break;
                    case PassiveA.AtkResSolo4:
                        targetUnit.atkSpur += 7; targetUnit.resSpur += 7;
                        break;
                    case PassiveA.AtkDefSolo3:
                        targetUnit.atkSpur += 6; targetUnit.defSpur += 6;
                        break;
                    case PassiveA.DefResSolo3:
                        targetUnit.defSpur += 6; targetUnit.resSpur += 6;
                        break;
                    case PassiveA.DefResSolo4:
                        targetUnit.defSpur += 7; targetUnit.resSpur += 7;
                        break;
                    case PassiveA.SpdDefSolo3:
                        targetUnit.spdSpur += 6; targetUnit.defSpur += 6;
                        break;
                    case PassiveA.SpdResSolo3:
                        targetUnit.spdSpur += 6; targetUnit.resSpur += 6;
                        break;
                    case PassiveA.SpdResSolo4:
                        targetUnit.spdSpur += 7; targetUnit.resSpur += 7;
                        break;
                    case Weapon.KurokiChiNoTaiken:
                        if (targetUnit.isWeaponSpecialRefined) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                        break;
                }
            }
        }
    }

    __doSomethingToEnemyUnitsIn2Spaces(targetUnit, addSpurFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
            if (this.__isNear(unit, targetUnit, 2)) {
                addSpurFunc(unit);
            }
        }
    }

    __applyFormSkill(targetUnit, buffFunc, addSpur = 0, spaces = 2, spurLimit = 6) {
        let spurAmount = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
            spurAmount += 2;
        }
        if (spurAmount > spurLimit) {
            spurAmount = spurLimit;
        }
        buffFunc(targetUnit, spurAmount + addSpur);
    }

    __addSelfSpurInRange1(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
            switch (skillId) {
                case Weapon.RauaAuru:
                case Weapon.GurunAuru:
                case Weapon.RauaAuruPlus:
                case Weapon.GurunAuruPlus:
                case Weapon.BuraAuru:
                case Weapon.BuraAuruPlus:
                    targetUnit.addAllSpur(2);
                    break;
                case Weapon.YamaNoInjaNoSyo:
                case Weapon.WindsBrand:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.addAllSpur(2);
                    }
                    break;
            }
        }
    }
    __addSelfSpurInRange2(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
            switch (skillId) {
                default:
                    break;
            }
        }
    }
    __addSelfSpurIfAllyAvailableInRange2(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
            switch (skillId) {
                case Weapon.LoveCandelabraPlus:
                    targetUnit.atkSpur += 4;
                    targetUnit.defSpur += 4;
                    break;
                case Weapon.LoveBouquetPlus:
                    targetUnit.atkSpur += 4;
                    targetUnit.resSpur += 4;
                    break;
                case Weapon.GigaExcalibur:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.Gurimowaru:
                case Weapon.SenhimeNoWakyu:
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.SpearOfAssal:
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                    break;
                case PassiveC.JointDriveAtk:
                    targetUnit.atkSpur += 4;
                    break;
                case PassiveC.JointDriveSpd:
                    targetUnit.spdSpur += 4;
                    break;
                case PassiveC.JointDriveRes:
                    targetUnit.resSpur += 4;
                    break;
                case Weapon.ChichiNoSenjutsusyo:
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                    break;
                case Weapon.JunaruSenekoNoTsumekiba:
                    targetUnit.atkSpur += 3;
                    targetUnit.defSpur += 3;
                    break;
                case Weapon.VezuruNoYoran:
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.resSpur += 5;
                    break;
                case Weapon.OgonNoFolkPlus:
                case Weapon.NinjinhuNoSosyokuPlus:
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    break;
            }
        }
    }

    __addSelfSpurIfAllyAvailableInRange1(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
            switch (skillId) {
                case Weapon.SyukusaiNoOnoPlus:
                case Weapon.AoNoHanakagoPlus:
                case Weapon.MidoriNoHanakagoPlus:
                case Weapon.SyukusaiNoKenPlus:
                case Weapon.HanawaPlus:
                    targetUnit.addAllSpur(3);
                    break;
                case Weapon.FalchionAwakening:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case PassiveA.AtkSpdBond4:
                    targetUnit.atkSpur += 7;
                    targetUnit.spdSpur += 7;
                    break;
                case PassiveA.AtkDefBond4:
                    targetUnit.atkSpur += 7;
                    targetUnit.defSpur += 7;
                    break;
                case PassiveA.AtkResBond4:
                    targetUnit.atkSpur += 7;
                    targetUnit.resSpur += 7;
                    break;
                case PassiveA.AtkSpdBond1:
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                    break;
                case PassiveA.AtkSpdBond2:
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                    break;
                case PassiveA.AtkSpdBond3:
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    break;
                case PassiveA.AtkResBond1:
                    targetUnit.atkSpur += 3;
                    targetUnit.resSpur += 3;
                    break;
                case PassiveA.AtkResBond2:
                    targetUnit.atkSpur += 4;
                    targetUnit.resSpur += 4;
                    break;
                case PassiveA.AtkResBond3:
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                    break;
                case Weapon.Thirufingu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                case PassiveA.AtkDefBond1:
                    targetUnit.atkSpur += 3;
                    targetUnit.defSpur += 3;
                    break;
                case PassiveA.AtkDefBond2:
                    targetUnit.atkSpur += 4;
                    targetUnit.defSpur += 4;
                    break;
                case PassiveA.AtkDefBond3:
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    break;
                case Weapon.Fensariru:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.spdSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                case PassiveA.SpdDefBond1:
                    targetUnit.spdSpur += 3;
                    targetUnit.defSpur += 3;
                    break;
                case PassiveA.SpdDefBond2:
                    targetUnit.spdSpur += 4;
                    targetUnit.defSpur += 4;
                    break;
                case PassiveA.SpdDefBond3:
                    targetUnit.spdSpur += 5;
                    targetUnit.defSpur += 5;
                    break;
                case PassiveA.SpdResBond1:
                    targetUnit.spdSpur += 3;
                    targetUnit.resSpur += 3;
                    break;
                case PassiveA.SpdResBond2:
                    targetUnit.spdSpur += 4;
                    targetUnit.resSpur += 4;
                    break;
                case PassiveA.SpdResBond3:
                    targetUnit.spdSpur += 5;
                    targetUnit.resSpur += 5;
                    break;
                case PassiveA.DefResBond1:
                    targetUnit.defSpur += 3;
                    targetUnit.resSpur += 3;
                    break;
                case PassiveA.DefResBond2:
                    targetUnit.defSpur += 4;
                    targetUnit.resSpur += 4;
                    break;
                case PassiveA.DefResBond3:
                    targetUnit.defSpur += 5;
                    targetUnit.resSpur += 5;
                    break;
                default:
                    break;
            }
        }
    }

    __addSpurInRange1(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
            switch (skillId) {
                case PassiveC.SpurAtk1:
                    targetUnit.atkSpur += 2;
                    break;
                case PassiveC.SpurSpd1:
                    targetUnit.spdSpur += 2;
                    break;
                case PassiveC.SpurDef1:
                    targetUnit.defSpur += 2;
                    break;
                case PassiveC.SpurRes1:
                    targetUnit.resSpur += 2;
                    break;
                case PassiveC.SpurAtk2:
                    targetUnit.atkSpur += 3;
                    break;
                case PassiveC.SpurSpd2:
                    targetUnit.spdSpur += 3;
                    break;
                case PassiveC.SpurDef2:
                    targetUnit.defSpur += 3;
                    break;
                case PassiveC.SpurRes2:
                    targetUnit.resSpur += 3;
                    break;
                case PassiveC.SpurAtk3:
                    targetUnit.atkSpur += 4;
                    break;
                case PassiveC.SpurSpd3:
                    targetUnit.spdSpur += 4;
                    break;
                case PassiveC.SpurDef3:
                    targetUnit.defSpur += 4;
                    break;
                case PassiveC.SpurRes3:
                    targetUnit.resSpur += 4;
                    break;
                case PassiveC.SpurDefRes1:
                    targetUnit.defSpur += 2;
                    targetUnit.resSpur += 2;
                    break;
                case PassiveC.SpurDefRes2:
                    targetUnit.defSpur += 3;
                    targetUnit.resSpur += 3;
                    break;
                case PassiveC.SpurSpdRes2:
                    targetUnit.spdSpur += 3;
                    targetUnit.resSpur += 3;
                    break;
                case PassiveC.SpurSpdDef1:
                    targetUnit.spdSpur += 2;
                    targetUnit.defSpur += 2;
                    break;
                case PassiveC.SpurSpdDef1:
                    targetUnit.spdSpur += 2;
                    targetUnit.defSpur += 2;
                    break;
                case PassiveC.SpurSpdDef2:
                    targetUnit.spdSpur += 3;
                    targetUnit.defSpur += 3;
                    break;
                case PassiveC.SpurAtkRes1:
                    targetUnit.atkSpur += 2;
                    targetUnit.resSpur += 2;
                    break;
                case PassiveC.SpurAtkRes2:
                    targetUnit.atkSpur += 3;
                    targetUnit.resSpur += 3;
                    break;
                case PassiveC.SpurAtkDef2:
                    targetUnit.atkSpur += 3;
                    targetUnit.defSpur += 3;
                    break;
                case PassiveC.SpurAtkSpd1:
                    targetUnit.atkSpur += 2;
                    targetUnit.spdSpur += 2;
                    break;
                case PassiveC.SpurAtkSpd2:
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                    break;
                default:
                    break;
            }
        }
    }

    __addSpurInRange3(targetUnit, allyUnit, calcPotentialDamage) {
        for (let skillId of allyUnit.enumerateSkills()) {
            if (!calcPotentialDamage) {
                switch (skillId) {
                    case Weapon.GaeBolg:
                        if (allyUnit.isWeaponRefined) {
                            if (allyUnit.isWeaponSpecialRefined) {
                                if (targetUnit.weaponType === WeaponType.Sword ||
                                    targetUnit.weaponType === WeaponType.Lance ||
                                    targetUnit.weaponType === WeaponType.Axe ||
                                    targetUnit.moveType === MoveType.Cavalry
                                ) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.defSpur += 5;
                                }
                            }
                        }
                        break;
                }
            }
        }
    }

    __addSpurInRange2(targetUnit, allyUnit, calcPotentialDamage) {
        for (let skillId of allyUnit.enumerateSkills()) {
            if (!calcPotentialDamage) {
                switch (skillId) {
                    case PassiveC.DomainOfIce:
                        targetUnit.spdSpur += 4;
                        targetUnit.resSpur += 4;
                        break;
                    case Weapon.LoveCandelabraPlus:
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                        break;
                    case Weapon.LoveBouquetPlus:
                        targetUnit.atkSpur += 4;
                        targetUnit.resSpur += 4;
                        break;
                    case Weapon.GigaExcalibur:
                        if (targetUnit.isWeaponSpecialRefined) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    case Weapon.TannenbatonPlus:
                        targetUnit.defSpur += 2;
                        targetUnit.resSpur += 2;
                        targetUnit.battleContext.reducesCooldownCount = true;
                        break;
                    case Weapon.SpearOfAssal:
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                        break;
                    case Weapon.DanielMadeBow:
                        targetUnit.atkSpur += 5;
                        break;
                    case PassiveC.JointDriveAtk:
                        targetUnit.atkSpur += 4;
                        break;
                    case PassiveC.JointDriveSpd:
                        targetUnit.spdSpur += 4;
                        break;
                    case PassiveC.JointDriveRes:
                        targetUnit.resSpur += 4;
                        break;
                    case Weapon.Geirusukeguru:
                        if (targetUnit.isPhysicalAttacker()) {
                            targetUnit.atkSpur += 3;
                            targetUnit.spdSpur += 3;
                            if (allyUnit.isWeaponSpecialRefined) {
                                targetUnit.defSpur += 3;
                                targetUnit.resSpur += 3;
                            }
                        }
                        break;
                    case Weapon.KamiraNoEnfu:
                        if (allyUnit.isWeaponSpecialRefined) {
                            if (targetUnit.moveType == MoveType.Flying || targetUnit.moveType == MoveType.Cavalry) {
                                targetUnit.atkSpur += 3;
                                targetUnit.spdSpur += 3;
                            }
                        }
                        break;
                    case Weapon.Simuberin:
                        if (allyUnit.isWeaponRefined) {
                            targetUnit.atkSpur += 3;
                        }
                        break;
                    case Weapon.FalchionRefined:
                        if (allyUnit.isWeaponSpecialRefined) {
                            targetUnit.addAllSpur(2);
                        }
                        break;
                    case Weapon.ChichiNoSenjutsusyo:
                        targetUnit.atkSpur += 3;
                        targetUnit.spdSpur += 3;
                        break;
                    case Weapon.JunaruSenekoNoTsumekiba:
                        targetUnit.atkSpur += 3;
                        targetUnit.defSpur += 3;
                        break;
                    case Weapon.RirisuNoUkiwa:
                    case Weapon.RirisuNoUkiwaPlus:
                    case Weapon.TomatoNoHon:
                    case Weapon.TomatoNoHonPlus:
                    case Weapon.NettaigyoNoHon:
                    case Weapon.NettaigyoNoHonPlus:
                    case Weapon.HaibisukasuNoHon:
                    case Weapon.HaibisukasuNoHonPlus:
                        targetUnit.atkSpur += 1;
                        targetUnit.spdSpur += 1;
                        break;
                    case Weapon.Yatonokami:
                        if (allyUnit.isWeaponSpecialRefined) {
                            if (targetUnit.partnerHeroIndex == allyUnit.heroIndex) {
                                targetUnit.addAllSpur(4);
                            }
                        }
                        break;
                    case Weapon.Kadomatsu:
                    case Weapon.KadomatsuPlus:
                    case Weapon.Hamaya:
                    case Weapon.HamayaPlus:
                    case Weapon.Hagoita:
                    case Weapon.HagoitaPlus:
                        targetUnit.defSpur += 2;
                        targetUnit.resSpur += 2;
                        break;
                    case Weapon.SenhimeNoWakyu:
                        if (allyUnit.isWeaponRefined) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        else {
                            targetUnit.atkSpur += 3;
                        }
                        break;
                    case PassiveC.DriveAtk1:
                        targetUnit.atkSpur += 2;
                        break;
                    case PassiveC.DriveAtk2:
                        targetUnit.atkSpur += 3;
                        break;
                    case PassiveC.DriveSpd1:
                        targetUnit.spdSpur += 2;
                        break;
                    case PassiveC.DriveSpd2:
                        targetUnit.spdSpur += 3;
                        break;
                    case PassiveC.DriveDef1:
                        targetUnit.defSpur += 2;
                        break;
                    case PassiveC.DriveDef2:
                        targetUnit.defSpur += 3;
                        break;
                    case PassiveC.DriveRes1:
                        targetUnit.resSpur += 2;
                        break;
                    case PassiveC.DriveRes2:
                        targetUnit.resSpur += 3;
                        break;
                    case PassiveC.WardArmor:
                        if (targetUnit.moveType == MoveType.Armor) {
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                        }
                        break;
                    case PassiveC.GoadArmor:
                        if (targetUnit.moveType == MoveType.Armor) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    case PassiveC.WardFliers:
                        if (targetUnit.moveType == MoveType.Flying) {
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                        }
                        break;
                    case PassiveC.GoadFliers:
                        if (targetUnit.moveType == MoveType.Flying) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    case PassiveC.WardCavalry:
                        if (targetUnit.moveType == MoveType.Cavalry) {
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                        }
                        break;
                    case PassiveC.GoadCavalry:
                        if (targetUnit.moveType == MoveType.Cavalry) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    case PassiveC.WardBeasts:
                        if (isWeaponTypeBeast(targetUnit.weaponType)) {
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                        }
                        break;
                    case PassiveC.GoadBeasts:
                        if (isWeaponTypeBeast(targetUnit.weaponType)) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    case PassiveC.WardDragons:
                        if (isWeaponTypeBreath(targetUnit.weaponType)) {
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                        }
                        break;
                    case PassiveC.GoadDragons:
                        if (isWeaponTypeBreath(targetUnit.weaponType)) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }

    __isNextToOtherUnits(unit) {
        for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(unit, false)) {
            if (!unit.isNextTo(otherUnit)) { continue; }
            return true;
        }
        return false;
    }
    __applySabotageSkillImpl(skillOwnerUnit, condFunc, debuffFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroup(skillOwnerUnit)) {
            if (!unit.isOnMap) { continue; }
            if (!this.__isNextToOtherUnits(unit)) { continue; }
            if (!condFunc(unit)) { continue; }
            debuffFunc(unit);
        }
    }
    __applySabotageSkill(skillOwnerUnit, debuffFunc, diff = 3) {
        this.__applySabotageSkillImpl(
            skillOwnerUnit,
            unit => this.__getStatusEvalUnit(unit).getEvalResInPrecombat() <= (this.__getStatusEvalUnit(skillOwnerUnit).getEvalResInPrecombat() - diff),
            debuffFunc);
    }
    __applyPolySkill(skillOwnerUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroup(skillOwnerUnit)) {
            if (this.__isInCloss(skillOwnerUnit, unit)
                && this.__getStatusEvalUnit(unit).getEvalResInPrecombat() < this.__getStatusEvalUnit(skillOwnerUnit).getEvalResInPrecombat()
            ) {
                debuffFunc(unit);
            }
        }
    }

    __isNextToOtherUnitsExceptDragonAndBeast(skillOwnerUnit) {
        return this.__isNextToOtherUnitsExcept(skillOwnerUnit,
            x => isWeaponTypeBreath(x.weaponType) || isWeaponTypeBeast(x.weaponType));
    }

    __applyOathSkill(skillOwnerUnit, buffFunc) {
        if (this.__isNextToOtherUnits(skillOwnerUnit)) {
            buffFunc(skillOwnerUnit);
        }
    }

    __applyOpeningSkill(skillOwnerUnit, getValueFunc, buffFunc) {
        let maxUnits = [];
        let maxVal = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwnerUnit)) {
            let val = getValueFunc(unit);
            if (val > maxVal) {
                maxVal = val;
                maxUnits = [unit];
            }
            else if (val == maxVal) {
                maxUnits.push(unit);
            }
        }

        for (let unit of maxUnits) {
            buffFunc(unit);
        }
    }

    __isThereAnyAllyUnit(unit, conditionFunc) {
        for (let ally of this.enumerateUnitsInTheSameGroupOnMap(unit, false)) {
            if (conditionFunc(ally)) {
                return true;
            }
        }
        return false;
    }

    __applyHyosyoNoBreath(skillOwner) {
        for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
            unit.reserveToApplyAllDebuff(-4);
        }
    }

    __applySkillToEnemiesInCross(skillOwner, conditionFunc, applySkillFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroup(skillOwner)) {
            if (!unit.isOnMap) { continue; }
            if (this.__isInCloss(unit, skillOwner)) {
                if (conditionFunc(unit)) {
                    applySkillFunc(unit);
                }
            }
        }
    }

    __applyPlusTie(skillOwner) {
        let targets = [];
        let minHp = 100;
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
            if (!this.__getStatusEvalUnit(unit).isSpecialCharged) {
                continue;
            }

            let hp = this.__getStatusEvalUnit(unit).hp;
            if (hp < this.__getStatusEvalUnit(skillOwner).hp) {
                if (hp < minHp) {
                    minHp = hp;
                    targets = [unit];
                }
                else if (hp == minHp) {
                    targets.push(unit);
                }
            }
        }
        for (let unit of targets) {
            unit.increaseSpecialCount(2);
        }
    }

    __applyDebuffForHighestStatus(unit, amount) {
        for (let status of this.__getStatusEvalUnit(unit).getHighestStatuses()) {
            switch (status) {
                case StatusType.Atk: unit.reserveToApplyAtkDebuff(amount); break;
                case StatusType.Spd: unit.reserveToApplySpdDebuff(amount); break;
                case StatusType.Def: unit.reserveToApplyDefDebuff(amount); break;
                case StatusType.Res: unit.reserveToApplyResDebuff(amount); break;
            }
        }
    }

    __applyMenace(skillOwner, buffFunc, debuffFunc) {
        let found = false;
        for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
            found = true;
            debuffFunc(unit);
        }

        if (found) {
            buffFunc(skillOwner);
        }
    }

    __applySkillForBeginningOfTurn(skillId, skillOwner) {
        if (isWeaponTypeBeast(skillOwner.weaponType) && skillOwner.hasWeapon) {
            if (!this.__isNextToOtherUnitsExceptDragonAndBeast(skillOwner)) {
                skillOwner.isTransformed = true;
                if (skillOwner.moveType === MoveType.Flying && isWeaponTypeBeast(skillOwner.weaponType)) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
            } else {
                skillOwner.isTransformed = false;
            }
        }

        switch (skillId) {
            case Weapon.PunishmentStaff:
                if (!skillOwner.isWeaponSpecialRefined) break;
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.CancelAffinity);
                        unit.applyAtkBuff(6);
                    }
                }
                break;
            case Weapon.EbonPirateClaw:
                this.__applySabotageSkill(skillOwner, unit => {
                    unit.reserveToApplyDefDebuff(-7);
                    unit.reserveToApplyResDebuff(-7);
                }, 1);
                break;
            case PassiveC.StallPloy3:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => this.__getStatusEvalUnit(unit).hp <= this.__getStatusEvalUnit(skillOwner).hp - 1,
                    unit => unit.reserveToAddStatusEffect(StatusEffectType.Stall));
                break;
            case Weapon.ShellpointLancePlus:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 3)) {
                    skillOwner.applyDefBuff(6);
                }
                break;
            case Weapon.TridentPlus:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 3)) {
                    skillOwner.applyAtkBuff(6);
                }
                break;
            case Weapon.WeddingBellAxe:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                        unit.reserveToAddStatusEffect(StatusEffectType.TriangleAttack);
                    }
                }
                break;
            case Special.ShiningEmblem:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                    skillOwner.applyAllBuff(6);
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, false)) {
                        unit.applyAtkBuff(6);
                    }
                }
                break;
            case PassiveC.AtkSpdMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.applyAtkBuff(6);
                        unit.applySpdBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplySpdDebuff(-6);
                    });
                break;
            case PassiveC.AtkResMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.applyAtkBuff(6);
                        unit.applyResBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplyResDebuff(-6);
                    });
                break;
            case PassiveC.AtkDefMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.applyAtkBuff(6);
                        unit.applyDefBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplyDefDebuff(-6);
                    });
                break;
            case PassiveC.DefResMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.applyDefBuff(6);
                        unit.applyResBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyDefDebuff(-6);
                        unit.reserveToApplyResDebuff(-6);
                    });
                break;
            case PassiveC.SurtrsPortent:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.applyAtkBuff(5);
                        unit.applySpdBuff(5);
                        unit.applyDefBuff(5);
                        unit.applyResBuff(5);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-5);
                        unit.reserveToApplySpdDebuff(-5);
                        unit.reserveToApplyDefDebuff(-5);
                        unit.reserveToApplyResDebuff(-5);
                    });
                break;
            case Special.HolyKnightAura:
                skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                break;
            case Weapon.GrimasTruth:
                if (skillOwner.isWeaponRefined) {
                    let enemies = this.__findNearestEnemies(skillOwner, 4);
                    if (enemies.length > 0) {
                        for (let unit of enemies) {
                            unit.reserveToApplyAtkDebuff(-5);
                            unit.reserveToApplySpdDebuff(-5);
                            unit.reserveToApplyResDebuff(-5);
                        }
                        skillOwner.applyAtkBuff(5);
                        skillOwner.applySpdBuff(5);
                        skillOwner.applyResBuff(5);
                    }
                }
                break;
            case Weapon.Shamsir:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.__getStatusEvalUnit(skillOwner).isSpecialCountMax) {
                        this.writeDebugLogLine(skillOwner.getNameWithGroup() + "はシャムシールを発動");
                        skillOwner.reduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.StaffOfRausten:
                for (let unit of this.__findNearestEnemies(skillOwner, 5)) {
                    unit.reserveToApplyResDebuff(-6);
                    unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                }
                break;
            case Weapon.TomeOfReglay:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                    if (unit.isTome) {
                        unit.reduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.BansheeTheta:
                if (this.vm.currentTurn === 3
                    || this.vm.currentTurn === 4
                ) {
                    for (let unit of this.__findNearestEnemies(skillOwner, 5)) {
                        unit.reserveToApplyAllDebuff(-6);
                        unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                        unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                        unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                }
                break;
            case Special.RadiantAether2:
                if (this.vm.currentTurn === 1) {
                    skillOwner.reduceSpecialCount(2);
                }
                break;
            case Weapon.FellCandelabra:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-6); });
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplySpdDebuff(-6); });
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-6); });
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyResDebuff(-6); });
                break;
            case Weapon.Petrify: {
                if (this.vm.currentTurn < 1 || 5 < this.vm.currentTurn) break;
                const statusFunctions = [
                    x => this.__getStatusEvalUnit(x).hp,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat(),
                    x => this.__getStatusEvalUnit(x).getDefInPrecombat(),
                    x => this.__getStatusEvalUnit(x).getResInPrecombat(),
                ];
                for (let unit of this.__findMinStatusUnits(skillOwner.enemyGroupId, statusFunctions[this.vm.currentTurn - 1])) {
                    unit.reserveToApplyAtkDebuff(-7);
                    unit.reserveToApplySpdDebuff(-7);
                    unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                }
                break;
            }
            case Weapon.KiaStaff: {
                let candidates = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 4, false));
                let negativeStatusCandidates = candidates.filter(unit => unit.hasNegativeStatusEffect());
                let targets = (negativeStatusCandidates.length === 0 ? candidates : negativeStatusCandidates)
                    .reduce((a, c) => {
                        if (a.length === 0) return [c];
                        let accumHp = this.__getStatusEvalUnit(a[0]).hp;
                        let currentHp = this.__getStatusEvalUnit(c).hp;
                        if (accumHp === currentHp) {
                            a.push(c);
                        } else if (currentHp < accumHp) {
                            a = [c];
                        }
                        return a;
                    }, []);
                for (let target of targets) {
                    target.applyAtkBuff(6);
                    target.applySpdBuff(6);
                    target.reserveToResetDebuffs();

                    // キアの杖の効果が重なると2回目の実行で対象が変化してしまうので予約する
                    // todo: 他の場所も状態が変化するものはすべて予約にしないといけない
                    target.reserveToClearNegativeStatusEffects();
                }
                break;
            }
            case Weapon.StudiedForblaze:
                if (this.vm.currentTurn === 1) {
                    skillOwner.reduceSpecialCount(1);
                }
                break;
            case Weapon.Hrist:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage === 100 && this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveTakeDamage(1);
                    }
                }
                break;
            case PassiveC.OddRecovery1:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(5);
                    }
                }
                break;
            case PassiveC.OddRecovery2:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(10);
                    }
                }
                break;
            case PassiveC.OddRecovery3:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(20);
                    }
                }
                break;
            case PassiveC.EvenRecovery1:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(5);
                    }
                }
                break;
            case PassiveC.EvenRecovery2:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(10);
                    }
                }
                break;
            case PassiveC.EvenRecovery3:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(20);
                    }
                }
                break;
            case Special.SeidrShell:
                if (this.vm.currentTurn === 1) {
                    skillOwner.reduceSpecialCount(3);
                }
                break;
            case PassiveC.OddTempest3:
                if (this.isOddTurn) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case PassiveC.EvenTempest3:
                if (!this.isOddTurn) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case PassiveC.MilaNoHaguruma:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => this.__getStatusEvalUnit(unit).getDefInPrecombat() < this.__getStatusEvalUnit(skillOwner).getDefInPrecombat(),
                    unit => unit.reserveToAddStatusEffect(StatusEffectType.Isolation));
                break;
            case Weapon.Gjallarbru:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => this.__getStatusEvalUnit(unit).hp <= this.__getStatusEvalUnit(skillOwner).hp - 3,
                    unit => unit.reserveToAddStatusEffect(StatusEffectType.Isolation));
                break;
            case Weapon.SerujuNoKyoufu:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applySkillToEnemiesInCross(skillOwner,
                        unit => this.__getStatusEvalUnit(unit).hp < this.__getStatusEvalUnit(skillOwner).hp,
                        unit => unit.reserveToAddStatusEffect(StatusEffectType.Panic));
                }
                break;
            case PassiveC.KyokoNoKisaku3:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => this.__getStatusEvalUnit(unit).hp < this.__getStatusEvalUnit(skillOwner).hp,
                    unit => unit.reserveToAddStatusEffect(StatusEffectType.Panic));
                break;
            case Weapon.Sekku:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(
                    skillOwner.posX, skillOwner.posY, skillOwner.enemyGroupId, 1, 99)
                ) {
                    if (unit.isRangedWeaponType()
                        && this.__getStatusEvalUnit(skillOwner).hp >= this.__getStatusEvalUnit(unit).hp + 3
                    ) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                    }
                }
                break;
            case Weapon.AnyaryuNoBreath:
                if (this.vm.currentTurn == 4) {
                    let count = 0;
                    for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                        unit.reserveTakeDamage(10);
                        ++count;
                    }
                    skillOwner.reserveHeal(count * 5);
                }
                break;
            case Weapon.Mafu:
                if (this.vm.currentTurn == 3) {
                    for (let unit of this.enumerateUnitsWithinSpecifiedRange(
                        skillOwner.posX, skillOwner.posY, skillOwner.enemyGroupId, 5, 99)
                    ) {
                        if (isWeaponTypeTome(unit.weaponType)) {
                            continue;
                        }
                        unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                        unit.reserveTakeDamage(5);
                    }
                }
                break;
            case Weapon.ElenasStaff:
                for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
                    unit.reserveToApplyAtkDebuff(-7);
                    unit.reserveToApplySpdDebuff(-7);

                    if (skillOwner.isWeaponSpecialRefined) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
                break;
            case Weapon.Hyoushintou:
                for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
                    unit.reserveToApplyAllDebuff(-4);
                }
                break;
            case Weapon.JinroMusumeNoTsumekiba:
                if (this.vm.currentTurn == 1) {
                    skillOwner.reduceSpecialCount(2);
                    for (let unit of this.__getPartnersInSpecifiedRange(skillOwner, 100)) {
                        unit.reduceSpecialCount(2);
                    }
                }
                break;
            case Weapon.GroomsWings:
                if (this.vm.currentTurn == 1) {
                    for (let unit of this.__getPartnersInSpecifiedRange(skillOwner, 100)) {
                        unit.reduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.Merikuru:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 50) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        if (isPhysicalWeaponType(unit.weaponType)) {
                            unit.applyAllBuff(4);
                        }
                    }
                }
                break;
            case Weapon.HyosyoNoBreath:
                this.__applyHyosyoNoBreath(skillOwner);
                break;
            case PassiveB.KodoNoHukanGusu3:
                if (this.vm.currentTurn % 2 == 0) {
                    this.__applyPlusTie(skillOwner);
                }
                break;
            case PassiveB.OddPulseTie3:
                if (this.isOddTurn) {
                    this.__applyPlusTie(skillOwner);
                }
                break;
            case Weapon.DevilAxe:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 75) {
                        if (isNormalAttackSpecial(skillOwner.special)) {
                            skillOwner.reduceSpecialCount(1);
                        }
                    }
                }
                break;
            case Weapon.Toron:
            case Weapon.KyoufuArmars:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 75) {
                    if (isNormalAttackSpecial(skillOwner.special)) {
                        skillOwner.reduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.Scadi: {
                let damageAmount = skillOwner.isWeaponRefined ? 7 : 10;
                let turnCond = skillOwner.isWeaponRefined ?
                    this.vm.currentTurn === 2 || this.vm.currentTurn === 3 :
                    this.vm.currentTurn === 3;
                if (turnCond) {
                    let groupId = UnitGroupType.Enemy;
                    if (skillOwner.groupId == UnitGroupType.Enemy) {
                        groupId = UnitGroupType.Ally;
                    }
                    for (let unit of this.enumerateUnitsWithinSpecifiedRange(
                        skillOwner.posX, skillOwner.posY, groupId, 3, 99)
                    ) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                        unit.reserveTakeDamage(damageAmount);
                    }
                }
                break;
            }
            case Weapon.Forukuvangu:
                if (!skillOwner.isWeaponSpecialRefined) {
                    if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                        skillOwner.applyAtkBuff(5);
                    }
                }
                break;
            case Weapon.MagoNoTePlus:
                if (this.vm.currentTurn == 1) {
                    for (let unit of this.__findMaxStatusUnits(skillOwner.groupId, x => this.__getStatusEvalUnit(x).getAtkInPrecombat(), skillOwner)) {
                        unit.reduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.NorenPlus:
            case Weapon.KinchakubukuroPlus:
                if (this.vm.currentTurn == 1) {
                    skillOwner.reduceSpecialCount(2);
                }
                break;
            case PassiveB.TateNoKodo3:
                if (this.vm.currentTurn == 1) {
                    if (isDefenseSpecial(skillOwner.special)) {
                        skillOwner.reduceSpecialCount(2);
                    }
                }
                break;
            case PassiveB.Ikari3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 75) {
                    skillOwner.reduceSpecialCount(1);
                }
                break;
            case PassiveB.ToketsuNoHuin:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 50) {
                    for (let unit of this.__findMinStatusUnits(
                        skillOwner.groupId == UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally,
                        x => this.__getStatusEvalUnit(x).getResInPrecombat())
                    ) {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplySpdDebuff(-6);
                    }
                }
                break;
            case PassiveB.KoriNoHuin:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 50) {
                    for (let unit of this.__findMinStatusUnits(
                        skillOwner.groupId == UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally,
                        x => this.__getStatusEvalUnit(x).getDefInPrecombat())
                    ) {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplySpdDebuff(-6);
                    }
                }
                break;
            case PassiveB.ChillingSeal2:
                for (let unit of this.__findMinStatusUnits(
                    skillOwner.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally,
                    x => this.__getStatusEvalUnit(x).getDefInPrecombat())
                ) {
                    unit.reserveToApplyAllDebuff(-7);
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                        u.reserveToApplyAtkDebuff(-7);
                        u.reserveToApplyResDebuff(-7);
                    }
                }
                break;
            case PassiveC.VisionOfArcadia:
                if (this.__isThereAnyAllyUnit(skillOwner, x => isWeaponTypeBreathOrBeast(x.weaponType))) {
                    for (let unit of this.__findMaxStatusUnits(
                        skillOwner.groupId,
                        x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                        skillOwner)
                    ) {
                        unit.applyAtkBuff(6);
                        unit.applyDefBuff(6);
                    }
                }
                break;
            case Weapon.ArdentDurandal:
                for (let unit of this.__findMaxStatusUnits(
                    skillOwner.groupId,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                    skillOwner)
                ) {
                    unit.reserveToAddStatusEffect(StatusEffectType.BonusDoubler);
                }
                break;
            case PassiveB.Recovering:
                skillOwner.reserveHeal(10);
                break;
            case Weapon.FalchionRefined:
            case Weapon.FalcionEchoes:
            case Weapon.FalchionAwakening:
            case Weapon.KiriNoBreath:
            case PassiveB.Renewal1:
                if ((this.vm.currentTurn + 1) % 4 == 0) {
                    skillOwner.reserveHeal(10);
                }
                break;
            case PassiveB.Renewal2:
                if ((this.vm.currentTurn + 1) % 3 == 0) {
                    skillOwner.reserveHeal(10);
                }
                break;
            case PassiveB.Renewal3:
                if ((this.vm.currentTurn + 1) % 2 == 0) {
                    skillOwner.reserveHeal(10);
                }
                break;
            case Weapon.TamagoNoTsuePlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, true)) {
                    unit.reserveHeal(7);
                }
                break;
            case Weapon.ShirasagiNoTsubasa:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, false)) {
                    unit.reserveHeal(7);
                }
                break;
            case PassiveC.SeimeiNoKagayaki:
                {
                    let targetUnits = [];
                    let maxDamage = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                        let damage = this.__getStatusEvalUnit(unit).currentDamage;
                        if (damage > maxDamage) {
                            maxDamage = damage;
                            targetUnits = [unit];
                        }
                        else if (damage == maxDamage) {
                            targetUnits.push(unit);
                        }
                    }
                    for (let unit of targetUnits) {
                        unit.reserveHeal(10);
                    }
                }
                break;
            case PassiveC.HajimariNoKodo3:
                if (this.__getStatusEvalUnit(skillOwner).isSpecialCountMax) {
                    this.writeDebugLogLine(skillOwner.getNameWithGroup() + "は始まりの鼓動3発動");
                    skillOwner.reduceSpecialCount(1);
                }
                break;
            case PassiveC.OstiasPulse:
                if (this.vm.currentTurn == 1) {
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                        if (this.__isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit)) {
                            unit.reduceSpecialCount(1);
                        }
                    }
                }
                break;
            case Weapon.RantanNoTsuePlus:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                    x => { x.applyResBuff(5); x.applyDefBuff(5); });
                break;
            case Weapon.YujoNoHanaNoTsuePlus:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat(),
                    x => { x.applyAtkBuff(5); x.applyDefBuff(5); });
                break;
            case PassiveC.AtkOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getAtkInPrecombat(), x => x.applyAtkBuff(6));
                break;
            case PassiveC.SpdOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getSpdInPrecombat(), x => x.applySpdBuff(6));
                break;
            case PassiveC.DefOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getDefInPrecombat(), x => x.applyDefBuff(6));
                break;
            case PassiveC.ResOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getResInPrecombat(), x => x.applyResBuff(6));
                break;
            case PassiveC.SpdDefGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat() + this.__getStatusEvalUnit(x).getDefInPrecombat(),
                    x => { x.applySpdBuff(5); x.applyDefBuff(5); }
                );
                break;
            case PassiveC.SpdResGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat() + this.__getStatusEvalUnit(x).getResInPrecombat(),
                    x => { x.applySpdBuff(5); x.applyResBuff(5); }
                );
                break;
            case PassiveC.AtkResGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat() + this.__getStatusEvalUnit(x).getResInPrecombat(),
                    x => { x.applyAtkBuff(5); x.applyResBuff(5); }
                );
                break;
            case PassiveC.AtkDefGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat() + this.__getStatusEvalUnit(x).getDefInPrecombat(),
                    x => { x.applyAtkBuff(5); x.applyDefBuff(5); }
                );
                break;
            case PassiveC.DefResGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getDefInPrecombat() + this.__getStatusEvalUnit(x).getResInPrecombat(),
                    x => { x.applyDefBuff(5); x.applyResBuff(5); }
                );
                break;
            case PassiveC.AtkSpdGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat() + this.__getStatusEvalUnit(x).getSpdInPrecombat(),
                    x => { x.applyAtkBuff(5); x.applySpdBuff(5); }
                );
                break;
            case PassiveC.SpdDefOath3: this.__applyOathSkill(skillOwner, x => { x.applyDefBuff(5); x.applySpdBuff(5); }); break;
            case PassiveC.SpdResOath3: this.__applyOathSkill(skillOwner, x => { x.applyResBuff(5); x.applySpdBuff(5); }); break;
            case PassiveC.AtkSpdOath3: this.__applyOathSkill(skillOwner, x => { x.applyAtkBuff(5); x.applySpdBuff(5); }); break;
            case PassiveC.AtkDefOath3: this.__applyOathSkill(skillOwner, x => { x.applyAtkBuff(5); x.applyDefBuff(5); }); break;
            case PassiveC.AtkResOath3: this.__applyOathSkill(skillOwner, x => { x.applyAtkBuff(5); x.applyResBuff(5); }); break;
            case PassiveC.DefResOath3: this.__applyOathSkill(skillOwner, x => { x.applyDefBuff(5); x.applyResBuff(5); }); break;
            case PassiveC.Upheaval:
                if (this.vm.currentTurn == 1) {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        unit.reserveTakeDamage(7);
                    }
                    if (this.vm.isAstraSeason) {
                        if (skillOwner.groupId == UnitGroupType.Enemy) {
                            for (let st of this.__enumerateOffenceStructuresOnMap()) {
                                if (!st.isBreakable) {
                                    continue;
                                }
                                if (st.posX == skillOwner.posX) {
                                    moveStructureToTrashBox(st);
                                    break;
                                }
                            }
                        }
                    }
                }
                break;
            case PassiveC.AirOrders3:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, false)) {
                    switch (unit.moveType) {
                        case MoveType.Flying:
                            unit.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                            break;
                    }
                }
                break;
            case PassiveC.GroundOrders3:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, false)) {
                    switch (unit.moveType) {
                        case MoveType.Infantry:
                        case MoveType.Armor:
                        case MoveType.Cavalry:
                            unit.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                            break;
                    }
                }
                break;
            case PassiveC.DivineFang:
                for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                    if (!otherUnit.isOnMap) { continue; }
                    if (skillOwner.isNextTo(otherUnit)) {
                        otherUnit.reserveToAddStatusEffect(StatusEffectType.EffectiveAgainstDragons);
                    }
                }
                break;
            case PassiveC.SolitaryDream:
                if (!this.__isNextToOtherUnitsExcept(skillOwner, x => isWeaponTypeBreath(x.weaponType))) {
                    skillOwner.applyAllBuff(4);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case PassiveC.WithEveryone:
                for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                    if (!otherUnit.isOnMap) { continue; }
                    if (!skillOwner.isNextTo(otherUnit)) { continue; }
                    skillOwner.applyDefBuff(5);
                    skillOwner.applyResBuff(5);
                    otherUnit.applyDefBuff(5);
                    otherUnit.applyResBuff(5);
                }
                break;
            case Weapon.Sinmara:
                for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    unit.reserveTakeDamage(20);
                }
                break;
            case PassiveC.SurtrsMenace:
                {
                    let isEnemyInSpaces = false;
                    for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToApplyAllDebuff(-4);
                        isEnemyInSpaces = true;
                    }
                    if (isEnemyInSpaces) {
                        skillOwner.applyAllBuff(4);
                    }
                }
                break;
            case PassiveC.ArmoredStride3:
                if (!this.__isThereAllyInSpecifiedSpaces(skillOwner, 1)) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case PassiveS.ArmoredBoots:
                if (this.__getStatusEvalUnit(skillOwner).isFullHp) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case Weapon.FlowerHauteclere:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 25) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                }
                break;
            case Weapon.Faraflame:
            case Weapon.GunshinNoSyo:
                if (skillOwner.isWeaponRefined) {
                    for (let unit of this.enumerateUnitsInDifferentGroup(skillOwner)) {
                        if (!unit.isOnMap) { continue; }
                        if (skillOwner.posX - 1 <= unit.posX && unit.posX <= skillOwner.posX + 1 ||
                            skillOwner.posY - 1 <= unit.posY && unit.posY <= skillOwner.posY + 1) {
                            unit.reserveToApplyAtkDebuff(-5);
                            unit.reserveToApplyResDebuff(-5);
                        }
                    }
                } else {
                    this.__applyPolySkill(skillOwner, unit => {
                        unit.reserveToApplyAtkDebuff(-4);
                        unit.reserveToApplyResDebuff(-4);
                    });
                }
                break;
            case Weapon.KatarinaNoSyo:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyPolySkill(skillOwner, unit => {
                        unit.reserveToApplySpdDebuff(-4);
                        unit.reserveToApplyResDebuff(-4);
                    });
                }
                break;
            case PassiveC.AtkPloy3: this.__applyPolySkill(skillOwner, unit => unit.reserveToApplyAtkDebuff(-5)); break;
            case PassiveC.SpdPloy3: this.__applyPolySkill(skillOwner, unit => unit.reserveToApplySpdDebuff(-5)); break;
            case PassiveC.DefPloy3: this.__applyPolySkill(skillOwner, unit => unit.reserveToApplyDefDebuff(-5)); break;
            case PassiveC.ResPloy3: this.__applyPolySkill(skillOwner, unit => unit.reserveToApplyResDebuff(-5)); break;
            case PassiveC.ChaosNamed:
                for (let unit of this.enumerateUnitsInDifferentGroup(skillOwner)) {
                    if (!unit.isOnMap) { continue; }
                    if (skillOwner.posX - 1 <= unit.posX && unit.posX <= skillOwner.posX + 1) {
                        if (this.__getStatusEvalUnit(unit).getEvalResInPrecombat() <= (this.__getStatusEvalUnit(skillOwner).getEvalResInPrecombat() - 3)) {
                            this.__applyDebuffForHighestStatus(unit, -5);
                        }
                    }
                }
                break;
            case Weapon.AkaNoKen:
            case Weapon.DarkExcalibur:
                if (skillOwner.weaponRefinement == WeaponRefinementType.Special) {
                    if (this.vm.currentTurn == 1) { skillOwner.reduceSpecialCount(2); }
                }
                break;
            case Weapon.Missiletainn:
                if (this.vm.currentTurn == 1) {
                    let reduceCount = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, true)) {
                        if (isWeaponTypeTome(unit.weaponType)) {
                            ++reduceCount;
                        }
                    }
                    skillOwner.reduceSpecialCount(reduceCount);
                }
                break;
            case PassiveC.HokoNoKodo3:
                if (this.vm.currentTurn == 1) {
                    // なぜか skillOwner の snapshot が for の中でだけ null になる
                    let skillOwnerHp = this.__getStatusEvalUnit(skillOwner).hp;
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner)) {
                        if (unit.moveType == MoveType.Infantry
                            && this.__getStatusEvalUnit(unit).hp < skillOwnerHp
                        ) {
                            this.writeDebugLogLine(skillOwner.getNameWithGroup() + "の歩行の鼓動3により" + unit.getNameWithGroup() + "の奥義発動カウント-1");
                            unit.reduceSpecialCount(1);
                        }
                    }
                }
                break;
            case PassiveB.SDrink:
                if (this.vm.currentTurn == 1) {
                    skillOwner.reduceSpecialCount(1);
                    skillOwner.reserveHeal(99);
                }
                break;
            case PassiveS.OgiNoKodou:
                if (this.vm.currentTurn == 1) {
                    this.writeDebugLogLine(skillOwner.getNameWithGroup() + "の奥義の鼓動により奥義発動カウント-1");
                    skillOwner.reduceSpecialCount(1);
                }
                break;
            case PassiveB.SabotageAtk3:
                this.__applySabotageSkill(skillOwner, unit => { unit.reserveToApplyAtkDebuff(-7); });
                break;
            case PassiveB.SabotageSpd3:
                this.__applySabotageSkill(skillOwner, unit => { unit.reserveToApplySpdDebuff(-7); });
                break;
            case PassiveB.SabotageDef3:
                this.__applySabotageSkill(skillOwner, unit => { unit.reserveToApplyDefDebuff(-7); });
                break;
            case PassiveB.SabotageRes3:
                this.__applySabotageSkill(skillOwner, unit => { unit.reserveToApplyResDebuff(-7); });
                break;
            case Weapon.WeirdingTome:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.reserveToApplySpdDebuff(-5); unit.reserveToApplyResDebuff(-5); });
                break;
            case Weapon.TemariPlus:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplySpdDebuff(-5); });
                break;
            case PassiveB.YunesSasayaki:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.reserveToApplyAtkDebuff(-6); unit.reserveToApplySpdDebuff(-6); });
                break;
            case Weapon.KinunNoYumiPlus:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.reserveToApplyDefDebuff(-5); unit.reserveToApplyResDebuff(-5); });
                break;
            case Weapon.IagosTome:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInDifferentGroup(skillOwner)) {
                        if (!unit.isOnMap) { continue; }
                        if (this.__isNextToOtherUnits(unit)) { continue; }
                        if (!(this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 3))) { continue; }
                        unit.reserveToApplyAtkDebuff(-4);
                        unit.reserveToApplySpdDebuff(-4);
                        unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                    }
                }
                else {
                    for (let unit of this.enumerateUnitsInDifferentGroup(skillOwner)) {
                        if (!unit.isOnMap) { continue; }
                        if (!this.__isNextToOtherUnits(unit)) { continue; }
                        if (!(this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 3))) { continue; }
                        unit.reserveToApplyDefDebuff(-4);
                        unit.reserveToApplyResDebuff(-4);
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
                break;
            case Weapon.AversasNight:
                this.__applySabotageSkillImpl(
                    skillOwner,
                    unit => this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 3),
                    unit => { unit.reserveToApplyAllDebuff(-3); unit.reserveToAddStatusEffect(StatusEffectType.Panic); });
                break;
            case Weapon.KokyousyaNoYari:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applySabotageSkill(skillOwner, unit => { unit.reserveToApplyAtkDebuff(-7); });
                }
                break;
            case Weapon.KizokutekinaYumi:
            case PassiveB.KyokoNoWakuran3:
                {
                    for (let unit of this.enumerateUnitsInDifferentGroup(skillOwner)) {
                        if (!unit.isOnMap) { continue; }
                        if (!this.__isNextToOtherUnits(unit)) { continue; }
                        if (this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 1)) {
                            this.writeDebugLogLine(skillOwner.getNameWithGroup() + "はHP" + this.__getStatusEvalUnit(skillOwner).hp + ", "
                                + unit.getNameWithGroup() + "はHP" + this.__getStatusEvalUnit(unit).hp + "で恐慌の惑乱適用");
                            unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                        }
                    }
                }
                break;
            case Weapon.Fensariru:
                if (!skillOwner.isWeaponRefined) {
                    this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyAtkDebuff(-4));
                }
                break;
            case Weapon.Ekkezakkusu:
                if (!skillOwner.isWeaponRefined) {
                    this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyDefDebuff(-4));
                } else {
                    this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyDefDebuff(-6), x => !isWeaponTypeBreath(x.weaponType));
                }
                break;
            case PassiveC.ThreatenAtk1: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyAtkDebuff(-3)); break;
            case PassiveC.ThreatenAtk2: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyAtkDebuff(-4)); break;
            case PassiveC.ThreatenAtk3: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyAtkDebuff(-5)); break;
            case PassiveC.ThreatenSpd1: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplySpdDebuff(-3)); break;
            case PassiveC.ThreatenSpd2: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplySpdDebuff(-4)); break;
            case PassiveC.ThreatenSpd3: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplySpdDebuff(-5)); break;
            case PassiveC.ThreatenDef1: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyDefDebuff(-3)); break;
            case PassiveC.ThreatenDef2: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyDefDebuff(-4)); break;
            case PassiveC.ThreatenDef3: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyDefDebuff(-5)); break;
            case PassiveC.ThreatenRes1: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyResDebuff(-3)); break;
            case PassiveC.ThreatenRes2: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyResDebuff(-4)); break;
            case PassiveC.ThreatenRes3: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyResDebuff(-5)); break;
            case PassiveC.ThreatenAtkSpd3:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        skillOwner.applyAtkBuff(5); skillOwner.applySpdBuff(5);
                        x.reserveToApplyAtkDebuff(-5); x.reserveToApplySpdDebuff(-5);
                    });
                break;
            case Weapon.MeikiNoBreath:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.reserveToApplyAtkDebuff(-7); x.reserveToApplySpdDebuff(-7);
                    });
                break;
            case PassiveC.ThreatenAtkRes3:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        skillOwner.applyAtkBuff(5); skillOwner.applyResBuff(5);
                        x.reserveToApplyAtkDebuff(-5); x.reserveToApplyResDebuff(-5);
                    });
                break;
            case PassiveC.ThreatenAtkRes2:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.reserveToApplyAtkDebuff(-4); x.reserveToApplyResDebuff(-4);
                    });
                break;
            case PassiveC.ThreatenSpdDef2:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.reserveToApplySpdDebuff(-4); x.reserveToApplyDefDebuff(-4);
                    });
                break;
            case PassiveC.ThreatenAtkDef2:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.reserveToApplyAtkDebuff(-4); x.reserveToApplyDefDebuff(-4);
                    });
                break;
            case PassiveC.ThreatenAtkDef3:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        skillOwner.applyAtkBuff(5); skillOwner.applyDefBuff(5);
                        x.reserveToApplyAtkDebuff(-5); x.reserveToApplyDefDebuff(-5);
                    });
                break;
            case Weapon.GunshiNoFusho:
            case Weapon.GunshiNoRaisyo:
                this.__applyTacticSkill(skillOwner, x => { x.applyAllBuff(4); });
                break;
            case PassiveC.AtkTactic1: this.__applyTacticSkill(skillOwner, x => { x.applyAtkBuff(2); }); break;
            case PassiveC.AtkTactic2: this.__applyTacticSkill(skillOwner, x => { x.applyAtkBuff(4); }); break;
            case PassiveC.AtkTactic3: this.__applyTacticSkill(skillOwner, x => { x.applyAtkBuff(6); }); break;
            case PassiveC.OrdersRestraint:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    unit.applyAtkBuff(6);
                    unit.applyResBuff(6);
                    unit.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                }

                if (this.__countAlliesWithinSpecifiedSpaces(skillOwner, 2) >= 3) {
                    skillOwner.applyAtkBuff(6);
                    skillOwner.applyResBuff(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                }
                break;
            case Weapon.ShinginNoSeiken:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyTacticSkill(skillOwner, x => { x.applySpdBuff(6); });
                }
                break;
            case PassiveC.SpdTactic1: this.__applyTacticSkill(skillOwner, x => { x.applySpdBuff(2); }); break;
            case PassiveC.SpdTactic2: this.__applyTacticSkill(skillOwner, x => { x.applySpdBuff(4); }); break;
            case PassiveC.SpdTactic3: this.__applyTacticSkill(skillOwner, x => { x.applySpdBuff(6); }); break;
            case PassiveC.DefTactic1: this.__applyTacticSkill(skillOwner, x => { x.applyDefBuff(2); }); break;
            case PassiveC.DefTactic2: this.__applyTacticSkill(skillOwner, x => { x.applyDefBuff(4); }); break;
            case PassiveC.DefTactic3: this.__applyTacticSkill(skillOwner, x => { x.applyDefBuff(6); }); break;
            case Weapon.YoheidanNoSenfu:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyTacticSkill(skillOwner, x => { x.applyResBuff(6); });
                }
                break;
            case PassiveC.ResTactic1: this.__applyTacticSkill(skillOwner, x => { x.applyResBuff(2); }); break;
            case PassiveC.ResTactic2: this.__applyTacticSkill(skillOwner, x => { x.applyResBuff(4); }); break;
            case PassiveC.ResTactic3: this.__applyTacticSkill(skillOwner, x => { x.applyResBuff(6); }); break;
            case PassiveC.OddAtkWave3: this.__applyWaveSkill(skillOwner, 1, x => { x.applyAtkBuff(6); }); break;
            case PassiveC.OddSpdWave3: this.__applyWaveSkill(skillOwner, 1, x => { x.applySpdBuff(6); }); break;
            case PassiveC.OddDefWave3: this.__applyWaveSkill(skillOwner, 1, x => { x.applyDefBuff(6); }); break;
            case PassiveC.OddResWave3: this.__applyWaveSkill(skillOwner, 1, x => { x.applyResBuff(6); }); break;
            case Weapon.AirisuNoSyo:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyWaveSkill(skillOwner, 0, x => { x.applyAtkBuff(6); });
                }
                break;
            case PassiveC.EvenAtkWave3:
                this.__applyWaveSkill(skillOwner, 0, x => { x.applyAtkBuff(6); });
                break;
            case PassiveC.EvenSpdWave3: this.__applyWaveSkill(skillOwner, 0, x => { x.applySpdBuff(6); }); break;
            case PassiveC.EvenDefWave3: this.__applyWaveSkill(skillOwner, 0, x => { x.applyDefBuff(6); }); break;
            case PassiveC.EvenResWave3: this.__applyWaveSkill(skillOwner, 0, x => { x.applyResBuff(6); }); break;
            case Weapon.Byureisuto:
                this.__applyWaveSkill(skillOwner, 1, x => { x.applyAllBuff(4); });
                break;
            case Weapon.Jikurinde:
                if (skillOwner.isWeaponRefined) {
                    this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(4); });
                }
                else {
                    this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(3); });
                }
                break;
            case Weapon.AiNoCakeServa:
            case Weapon.AiNoCakeServaPlus:
                this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(4); skillOwner.applyAtkBuff(4); });
                break;
            case Weapon.KiyorakanaBuke:
            case Weapon.KiyorakanaBukePlus:
                this.__applyHoneSkill(skillOwner, x => true, x => { x.applySpdBuff(4); skillOwner.applySpdBuff(4); });
                break;
            case Weapon.Jikumunt:
                if (!skillOwner.isWeaponRefined) {
                    this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(3); });
                } else {
                    this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(4); });
                }
                break;
            case PassiveC.HoneAtk3: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(4); }); break;
            case PassiveC.HoneSpd3: this.__applyHoneSkill(skillOwner, x => true, x => { x.applySpdBuff(4); }); break;
            case PassiveC.HoneDef3: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyDefBuff(4); }); break;
            case PassiveC.HoneRes3: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyResBuff(4); }); break;
            case PassiveC.HoneAtk4: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(7); }); break;
            case PassiveC.HoneSpd4: this.__applyHoneSkill(skillOwner, x => true, x => { x.applySpdBuff(7); }); break;
            case PassiveC.HoneDef4: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyDefBuff(7); }); break;
            case PassiveC.HoneRes4: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyResBuff(7); }); break;
            case PassiveC.JointHoneAtk:
                this.__applyHoneSkill(skillOwner, x => true,
                    x => { skillOwner.applyAtkBuff(5); x.applyAtkBuff(5); }); break;
            case PassiveC.JointHoneSpd:
                this.__applyHoneSkill(skillOwner, x => true,
                    x => { skillOwner.applySpdBuff(5); x.applySpdBuff(5); }); break;
            case PassiveC.JointHoneDef:
                this.__applyHoneSkill(skillOwner, x => true,
                    x => { skillOwner.applyDefBuff(5); x.applyDefBuff(5); }); break;
            case PassiveC.JointHoneRes:
                this.__applyHoneSkill(skillOwner, x => true,
                    x => { skillOwner.applyResBuff(5); x.applyResBuff(5); }); break;
            case PassiveC.HitoNoKanouseiWo:
                this.__applyHoneSkill(skillOwner,
                    x => !isWeaponTypeBreathOrBeast(x.weaponType),
                    x => {
                        skillOwner.applyAtkBuff(6);
                        skillOwner.applySpdBuff(6);
                        x.applyAtkBuff(6);
                        x.applySpdBuff(6);
                    }); break;
            case PassiveC.HoneArmor: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Armor, x => { x.applyAtkBuff(6); x.applySpdBuff(6); }); break;
            case PassiveC.HoneCavalry: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Cavalry, x => { x.applyAtkBuff(6); x.applySpdBuff(6); }); break;
            case PassiveC.HoneFlyier: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Flying, x => { x.applyAtkBuff(6); x.applySpdBuff(6); }); break;
            case PassiveC.HoneDragons: this.__applyHoneSkill(skillOwner, x => isWeaponTypeBreath(x.weaponType), x => { x.applyAtkBuff(6); x.applySpdBuff(6); }); break;
            case PassiveC.HoneBeasts: this.__applyHoneSkill(skillOwner, x => isWeaponTypeBeast(x.weaponType), x => { x.applyAtkBuff(6); x.applySpdBuff(6); }); break;
            case PassiveC.FortifyArmor: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Armor, x => { x.applyDefBuff(6); x.applyResBuff(6); }); break;
            case PassiveC.FortifyCavalry: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Cavalry, x => { x.applyDefBuff(6); x.applyResBuff(6); }); break;
            case PassiveC.FortifyFlyier: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Flying, x => { x.applyDefBuff(6); x.applyResBuff(6); }); break;
            case PassiveC.FortifyDragons: this.__applyHoneSkill(skillOwner, x => isWeaponTypeBreath(x.weaponType), x => { x.applyDefBuff(6); x.applyResBuff(6); }); break;
            case PassiveC.FortifyBeasts: this.__applyHoneSkill(skillOwner, x => isWeaponTypeBeast(x.weaponType), x => { x.applyDefBuff(6); x.applyResBuff(6); }); break;
            case Weapon.KyomeiOra:
                this.__applyHoneSkill(skillOwner,
                    x => x.isMeleeWeaponType(),
                    x => { x.applyAtkBuff(6); });
                break;
            case Weapon.Ora:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyHoneSkill(skillOwner,
                        x => x.weaponType == WeaponType.Staff || isWeaponTypeTome(x.weaponType),
                        x => { x.applyAtkBuff(6); });
                }
                break;
            case Weapon.MaskingAxe:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.__isSolo(skillOwner)) { skillOwner.applyAtkBuff(6); skillOwner.applyDefBuff(6); } break;
                }
                break;
            case PassiveC.RouseAtkSpd3:
                if (this.__isSolo(skillOwner)) { skillOwner.applyAtkBuff(6); skillOwner.applySpdBuff(6); } break;
            case PassiveC.RouseAtkDef3:
                if (this.__isSolo(skillOwner)) { skillOwner.applyAtkBuff(6); skillOwner.applyDefBuff(6); } break;
            case PassiveC.RouseAtkRes3:
                if (this.__isSolo(skillOwner)) { skillOwner.applyAtkBuff(6); skillOwner.applyResBuff(6); } break;
            case PassiveC.RouseDefRes3:
                if (this.__isSolo(skillOwner)) { skillOwner.applyDefBuff(6); skillOwner.applyResBuff(6); } break;
            case PassiveC.RouseSpdRes3:
                if (this.__isSolo(skillOwner)) { skillOwner.applySpdBuff(6); skillOwner.applyResBuff(6); } break;
            case PassiveC.RouseSpdDef3:
                if (this.__isSolo(skillOwner)) { skillOwner.applySpdBuff(6); skillOwner.applyDefBuff(6); } break;
            case PassiveA.DefiantAtk1:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applyAtkBuff(3); }
                break;
            case PassiveA.DefiantAtk2:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applyAtkBuff(5); }
                break;
            case PassiveA.DefiantAtk3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applyAtkBuff(7); }
                break;
            case PassiveA.DefiantSpd3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applySpdBuff(7); }
                break;
            case PassiveA.DefiantDef3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applyDefBuff(7); }
                break;
            case PassiveA.DefiantRes3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applyResBuff(7); }
                break;
            case Weapon.FuginNoMaran:
                if (skillOwner.isWeaponRefined) {
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                        unit => { unit.reserveToApplyAtkDebuff(-7); });
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                        unit => { unit.reserveToApplySpdDebuff(-7); });
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                        unit => { unit.reserveToApplyDefDebuff(-7); });
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                        unit => { unit.reserveToApplyResDebuff(-7); });
                } else {
                    if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                        this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                            unit => {
                                return this.__getStatusEvalUnit(unit).getResInPrecombat()
                            },
                            unit => {
                                unit.reserveToApplyAtkDebuff(-5);
                                unit.reserveToApplyDefDebuff(-5);
                            });
                    }
                }
                break;
            case Weapon.RosenshiNoKofu:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                        unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplyDefDebuff(-5); });
                }
                break;
            case Weapon.MuninNoMaran:
                if (skillOwner.isWeaponRefined) {
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                        unit => { unit.reserveToApplyAtkDebuff(-7); });
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                        unit => { unit.reserveToApplyResDebuff(-7); });
                    if (skillOwner.isWeaponSpecialRefined) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                            unit.reserveHeal(7);
                        }
                    }
                } else {
                    if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                        this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                            unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                            unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplyResDebuff(-5); });
                    }
                }
                break;
            case PassiveB.ChillAtkDef2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() + this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplyDefDebuff(-5); }); break;
            case PassiveB.ChillAtkRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() + this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplyResDebuff(-5); }); break;
            case PassiveB.ChillAtkSpd2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() + this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplySpdDebuff(-5); }); break;
            case PassiveB.ChillSpdDef2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() + this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-5); unit.reserveToApplySpdDebuff(-5); }); break;
            case PassiveB.ChillSpdRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() + this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplyResDebuff(-5); unit.reserveToApplySpdDebuff(-5); }); break;
            case PassiveB.ChillDefRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() + this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-5); unit.reserveToApplyResDebuff(-5); }); break;
            case PassiveB.ChillAtk1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-3); }); break;
            case PassiveB.ChillAtk2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-5); }); break;
            case Weapon.SyungeiNoKenPlus:
            case Weapon.WindsBrand:
            case PassiveB.ChillAtk3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-7); }); break;
            case PassiveB.ChillSpd1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplySpdDebuff(-3); }); break;
            case PassiveB.ChillSpd2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplySpdDebuff(-5); }); break;
            case Weapon.TekiyaPlus:
            case PassiveB.ChillSpd3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplySpdDebuff(-7); }); break;
            case PassiveB.ChillDef1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-3); }); break;
            case PassiveB.ChillDef2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-5); }); break;
            case Weapon.WagasaPlus:
            case Weapon.GinNoHokyu:
            case PassiveB.ChillDef3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-7); }); break;
            case PassiveB.ChillRes1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyResDebuff(-3); }); break;
            case PassiveB.ChillRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyResDebuff(-5); }); break;
            case Weapon.Forblaze:
            case PassiveB.ChillRes3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyResDebuff(-7); }); break;
            case Weapon.KumadePlus:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplySpdDebuff(-5); }); break;
            case PassiveC.ArmorMarch3:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, false)) {
                    if (unit.moveType == MoveType.Armor) {
                        this.writeLogLine(unit.getNameWithGroup() + "は重装の行軍により移動値+1");
                        unit.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                        this.writeLogLine(skillOwner.getNameWithGroup() + "は重装の行軍により移動値+1");
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                }
                break;
            case Weapon.EternalBreath:
                {
                    let isAllyAvailable = false;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, false)) {
                        unit.applyAllBuff(5);
                        isAllyAvailable = true;
                    }
                    if (isAllyAvailable) {
                        skillOwner.applyAllBuff(5);
                    }
                }
                break;
        }
    }

    __isNextToOtherUnitsExcept(unit, exceptCondition) {
        for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(unit, false)) {
            if (!otherUnit.isOnMap) { continue; }
            if (!exceptCondition(otherUnit)
                && unit.isNextTo(otherUnit)
            ) {
                return true;
            }
        }
        return false;
    }

    __applyThreatenSkill(skillOwnerUnit, applyDebuffFunc, conditionFunc = null) {
        for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(skillOwnerUnit, 2)) {
            if (conditionFunc != null && !conditionFunc(unit)) {
                continue;
            }
            applyDebuffFunc(unit);
        }
    }
    __applyHoneSkill(skillOwnerUnit, isApplicableFunc, applyBuffFunc) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 1, false)) {
            if (isApplicableFunc(unit)) {
                applyBuffFunc(unit);
            }
        }
    }
    __applyWaveSkill(skillOwnerUnit, divisionTwoRemainder, applyBuffFunc) {
        if ((this.vm.currentTurn % 2) == divisionTwoRemainder) {
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 1, true)) {
                applyBuffFunc(unit);
            }
        }
    }
    __applyTacticSkill(skillOwnerUnit, applyBuffFunc) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 2)) {
            if (this.__isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit)) {
                applyBuffFunc(unit);
            }
        }
    }

    __isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit) {
        let sameMoveTypeCount = 1;
        for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(unit)) {
            if (otherUnit.moveType == unit.moveType) { ++sameMoveTypeCount; }
        }
        if (sameMoveTypeCount <= 2) { return true; }
        return false;
    }

    __simulateBeginningOfTurn(targetUnits) {
        g_appData.isCombatOccuredInCurrentTurn = false;

        if (targetUnits.length == 0) {
            return;
        }

        let enemyUnits = [];
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnits[0])) {
            enemyUnits.push(unit);
        }

        let allyUnits = [];
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnits[0])) {
            allyUnits.push(unit);
        }

        let group = targetUnits[0].groupId;
        for (let unit of targetUnits) {
            unit.endAction();
            unit.deactivateCanto();
            unit.beginAction();
            // console.log(unit.getNameWithGroup() + ": moveCount=" + unit.moveCount);

            // 比翼や双界スキル発動カウントリセット
            unit.isDuoOrHarmonicSkillActivatedInThisTurn = false;
            if (unit.heroIndex == Hero.YoungPalla
                || unit.heroIndex == Hero.DuoSigurd
                || unit.heroIndex == Hero.DuoEirika
            ) {
                if (this.isOddTurn) {
                    unit.duoOrHarmonizedSkillActivationCount = 0;
                }
            }
            else if (unit.heroIndex == Hero.SummerMia
                || unit.heroIndex == Hero.SummerByleth
                || unit.heroIndex == Hero.PirateVeronica
                || unit.heroIndex == Hero.DuoHilda
            ) {
                if (this.vm.currentTurn % 3 == 1) {
                    unit.duoOrHarmonizedSkillActivationCount = 0;
                }
            }
        }

        for (let unit of enemyUnits) {
            unit.endAction();
            unit.deactivateCanto();
        }

        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.resetOneTimeActionActivationStates();

            // 評価用のスナップショットを作成
            unit.createSnapshot();
        }

        this.__initReservedHpForAllUnitsOnMap();

        this.executeStructuresByUnitGroupType(group, false);

        for (let unit of targetUnits) {
            this.writeDebugLogLine(unit.getNameWithGroup() + "のターン開始時発動スキルを適用..");
            for (let skillId of unit.enumerateSkills()) {
                this.__applySkillForBeginningOfTurn(skillId, unit);
            }
        }

        // ターン開始時効果によるダメージや回復を反映
        this.__applyReservedHpForAllUnitsOnMap(true);

        for (let unit of targetUnits) {
            unit.deleteSnapshot();
        }

        // 化身によりステータス変化する
        g_appData.__updateStatusBySkillsAndMergeForAllHeroes();

        // マップの更新(ターン開始時の移動マスの変化をマップに反映)
        g_appData.map.updateTiles();

        // ターンワイド状態の評価と保存
        {
            for (let unit of targetUnits) {
                unit.clearPerTurnStatuses();

                // すり抜け状態の更新
                if (unit.canActivatePass()) {
                    unit.addPerTurnStatus(PerTurnStatusType.Pass);
                }

                // 敵への距離を更新
                this.__updateDistanceFromClosestEnemy(unit);
            }
            this.__updateMovementOrders(targetUnits);
        }

        // 障害物リストの作成
        this.map.createTileSnapshots();

        // 脅威の評価
        this.__updateEnemyThreatStatusesForAll(targetUnits, enemyUnits);

        this.__updateChaseTargetTiles(targetUnits);

        // ターン開始時の移動値を記録
        for (let unit of this.enumerateAllUnitsOnMap(x => true)) {
            unit.moveCountAtBeginningOfTurn = unit.moveCount;
        }

        // 安全柵の効果が発動する場合でも、敵の移動をトリガーするかどうかの判定が行われている
        this.__prepareActionContextForAssist(targetUnits, enemyUnits, true);
    }

    __getOnMapEnemyUnitList() {
        let enemy = [];
        for (let unit of this.enumerateEnemyUnits()) {
            if (unit.isOnMap) {
                enemy.push(unit);
            }
        }
        return enemy;
    }
    __getOnMapAllyUnitList() {
        let units = [];
        for (let unit of this.enumerateAllyUnits()) {
            if (unit.isOnMap) {
                units.push(unit);
            }
        }
        return units;
    }


    __calcAssistPriorityForPrecombat(unit) {
        let assistTypePriority = 1;
        if (unit.hasMoveAssist) {
            assistTypePriority = 0;
        }

        let weaponlessPriority = 0;
        if (!unit.isWeaponEquipped) {
            weaponlessPriority = 1;
        }

        let distFromClosestEnemy = unit.placedTile.calculateDistanceToClosestEnemyTile(unit);

        let priority = assistTypePriority * 100000
            + weaponlessPriority * 10000
            + distFromClosestEnemy * 100
            - unit.slotOrder;

        this.writeDebugLogLine(
            unit.getNameWithGroup() + "の補助優先度: " + priority
            + ", assistTypePriority=" + assistTypePriority
            + ", weaponlessPriority=" + weaponlessPriority
            + ", distFromClosestEnemy=" + distFromClosestEnemy
            + ", slotOrder=" + unit.slotOrder
        );

        return priority;
    }

    __calcAssistPriorityForPostcombat(unit) {
        let assistTypePriority = 0;
        if ((!unit.isWeaponEquipped && unit.hasRefreshAssist)
            || (!unit.isWeaponEquipped && unit.hasHealAssist)
            || (!unit.isWeaponEquipped && unit.hasRestoreAssist)
            || (!unit.isWeaponEquipped && unit.hasDonorHealAssist)) {
            assistTypePriority = 5;
        }
        else if (unit.hasRefreshAssist || unit.hasHealAssist || unit.hasRestoreAssist) {
            assistTypePriority = 4;
        }
        else if ((!unit.isWeaponEquipped && unit.hasRallyAssist)) {
            assistTypePriority = 3;
        }
        else if (unit.hasDonorHealAssist || unit.hasRallyAssist) {
            assistTypePriority = 2;
        }
        else if ((!unit.isWeaponEquipped && unit.hasMoveAssist)) {
            assistTypePriority = 1;
        }
        else if (unit.hasMoveAssist) {
            assistTypePriority = 0;
        }

        let staffUserOrSacrificeUserPriority = 0;
        if (unit.weaponType == WeaponType.Staff || unit.support == Support.Sacrifice) {
            staffUserOrSacrificeUserPriority = 1;
        }

        let distFromClosestEnemy = unit.placedTile.calculateDistanceToClosestEnemyTile(unit);

        let priority = assistTypePriority * 100000
            + staffUserOrSacrificeUserPriority * 10000
            + distFromClosestEnemy * 100
            - unit.slotOrder;

        this.writeDebugLogLine(
            unit.getNameWithGroup() + "の補助優先度: " + priority
            + ", assistTypePriority=" + assistTypePriority
            + ", staffUserOrSacrificeUserPriority=" + staffUserOrSacrificeUserPriority
            + ", distFromClosestEnemy=" + distFromClosestEnemy
            + ", slotOrder=" + unit.slotOrder
        );

        return priority;
    }

    __findSafetyFence() {
        for (let st of this.offenceStructureStorage.enumerateAllObjs()) {
            if (g_appData.map.isObjAvailable(st) && st instanceof SafetyFence) {
                return st;
            }
        }
        return null;
    }

    __areAllAlliesOnSafetyTiles(safetyFence) {
        for (let unit of this.enumerateAllyUnitsOnMap()) {
            if (!unit.placedTile.isAttackableForEnemy) {
                continue;
            }

            if (unit.posY >= safetyFence.posY - 1
                && (safetyFence.posX - 3 <= unit.posX && unit.posX <= safetyFence.posX + 3)
            ) {
                continue;
            }

            return false;
        }
        return true;
    }

    simulateBeginningOfEnemyTurn() {
        if (this.vm.currentTurn == this.vm.maxTurn) {
            return;
        }

        let self = this;
        this.__enqueueCommand("敵ターン開始", function () {
            self.vm.currentTurnType = UnitGroupType.Enemy;
            self.audioManager.playSoundEffect(SoundEffectId.EnemyPhase);
            self.__simulateBeginningOfTurn(self.__getOnMapEnemyUnitList());

            // 安全柵の実行(他の施設と実行タイミングが異なるので、別途処理している)
            let safetyFence = self.__findSafetyFence();
            if (safetyFence != null && Number(self.vm.currentTurn) <= Number(safetyFence.level)) {
                if (self.__areAllAlliesOnSafetyTiles(safetyFence)) {
                    for (let unit of self.enumerateEnemyUnitsOnMap()) {
                        unit.endAction();
                    }
                }
            }

            // 拡張枠ユニットの行動終了
            let expansionEnemyUnit = g_appData.getEnemyExpansionUnitOnMap();
            if (expansionEnemyUnit != null) {
                // todo: 敵が7体編成じゃない場合、正しく判定できてない
                if (self.countEnemyUnitsOnMap() == g_appData.enemyUnits.length) {
                    expansionEnemyUnit.endAction();
                }
            }
        });
    }

    countEnemyUnitsOnMap() {
        let count = 0;
        for (let unit of this.enumerateEnemyUnitsOnMap()) {
            ++count;
        }
        return count;
    }

    simulateBeginningOfAllyTurn() {
        if (this.vm.currentTurn == this.vm.maxTurn) {
            return;
        }
        let self = this;
        this.__enqueueCommand("自ターン開始", function () {
            self.vm.currentTurnType = UnitGroupType.Ally;
            ++self.vm.currentTurn;
            if (self.vm.currentTurn == 1) {
                // 戦闘開始
                self.vm.isEnemyActionTriggered = false;
                for (let unit of g_appData.units) {
                    unit.resetAllState();
                }
                g_appData.resonantBattleItems = [];
            }
            self.audioManager.playSoundEffect(SoundEffectId.PlayerPhase);
            self.__simulateBeginningOfTurn(self.__getOnMapAllyUnitList());
        });
    }

    __isThereAnyUnit(groupId, predicateFunc) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (unit.isOnMap && predicateFunc(unit)) {
                return true;
            }
        }
        return false;
    }
    __countUnit(groupId, predicateFunc) {
        let count = 0;
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (unit.isOnMap && predicateFunc(unit)) {
                ++count;
            }
        }
        return count;
    }
    __countAliveUnits(groupId) {
        let count = 0;
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (unit.isOnMap && unit.isAlive) {
                ++count;
            }
        }
        return count;
    }

    __isTileInEnemyUnitMoveRange(targetTile) {
        for (let unit of this.enumerateEnemyUnitsOnMap()) {
            let dist = targetTile.calculateDistance(unit.placedTile);
            if (dist > unit.moveCount) {
                continue;
            }
            for (let tile of targetTile.neighbors) {
                if (tile.isMovableForEnemy) {
                    return true;
                }
            }
        }

        return false;
    }

    get map() {
        return this.vm.map;
    }
    __placeUnitToPlaceableSafeTilesNextToThreatenedTiles(units, allUnitsPlacedFunc) {
        for (let unit of units) {
            this.map.removeUnit(unit);
        }

        this.__placeUnitToPlaceableSafeTilesNextToThreatenedTilesImpl(units, allUnitsPlacedFunc);
    }

    __placeUnitToPlaceableSafeTilesNextToThreatenedTilesImpl(units, allUnisPlacedFunc) {
        if (units.length == 0) {
            allUnisPlacedFunc();
            return;
        }

        let targetUnit = units.pop();
        let tiles = [];
        for (let tile of this.map.enumeratePlaceableSafeTilesNextToThreatenedTiles(targetUnit)) {
            tiles.push(tile);
        }

        for (let tile of tiles) {
            this.map.placeUnit(targetUnit, tile.posX, tile.posY);
            // this.__enqueueMoveCommand(targetUnit, tile, false);
            this.__placeUnitToPlaceableSafeTilesNextToThreatenedTilesImpl(units, allUnisPlacedFunc);
            this.map.removeUnit(targetUnit);
        }
        // moveUnitToTrashBox(targetUnit);
        units.push(targetUnit);
    }


    examinesAliveTiles2() {
        let currentUnit = this.__getCurrentUnit();
        if (currentUnit == null) {
            this.writeErrorLine("ユニットが選択されていません");
            return;
        }

        this.writeDebugLogLine(currentUnit.getNameWithGroup() + "の受け可能なマスを調査します。");
        this.tempSerializedTurn = exportPerTurnSettingAsString();
        let currentTurn = this.vm.currentTurn;
        let origAliveAllyCount = this.__countAliveUnits(UnitGroupType.Ally);
        const map = g_appData.map;
        let movableTiles = [];
        for (let tile of map.enumerateMovableTiles(currentUnit, false, false, false)) {
            movableTiles.push(tile);
        }

        let tiles = [];
        if (this.vm.limitsExamineRangeToThreatenedRange) {
            for (let tile of map.enumerateTiles(x => x.allyDangerLevel > 0 && x.isUnitPlacableForUnit(currentUnit))) {
                if (!this.vm.limitsExamineRangeToMovableRange || movableTiles.includes(tile)) {
                    tiles.push(tile);
                }
            }
        }
        else {
            tiles = movableTiles;
        }

        let targetTiles = [];
        for (let tile of tiles) {
            if (this.vm.limitsExamineRangeToNoTrapTiles) {
                if (tile.obj instanceof TrapBase) {
                    continue;
                }
            }

            targetTiles.push(tile);
        }

        let self = this;
        startProgressiveProcess(targetTiles.length,
            function (iter) {
                let tile = targetTiles[iter];
                self.simulateEnemyTurn(currentUnit, tile, currentTurn, origAliveAllyCount);
            },
            function (iter, iterMax) {
                $("#progress").progressbar({
                    value: iter,
                    max: iterMax,
                });
                updateAllUi();
            },
            function () {
                self.vm.currentTurn = currentTurn;
                importPerTurnSetting(self.tempSerializedTurn);
                $("#progress").progressbar({ disabled: true });
                updateAllUi();
            });
    }

    __areAllAlliesAlive() {
        for (let unit of this.enumerateAllyUnits()) {
            if (!unit.isOnMap) {
                return false;
            }
        }
        return true;
    }



    * __enumerateUnitsSortedByNearestDistanceToTile(tile, units) {
        let contexts = [];
        for (let unit of units) {
            let dist = tile.calculateDistance(unit.placedTile);
            let context = new Object();
            context.unit = unit;
            context.dist = dist;
            contexts.push(context);
        }
        contexts.sort(function (a, b) {
            return a.dist - b.dist;
        });

        for (let context of contexts) {
            yield context.unit;
        }
    }

    __plotDamageImpl(targetUnit, enemyUnit) {
        let originalHp = targetUnit.hp;
        let originalSpecialCount = targetUnit.specialCount;
        enemyUnit.maxHpWithSkills = 99;
        let originalEnemyHp = enemyUnit.hp;
        let originalEnemySpecialCount = enemyUnit.specialCount;

        this.clearDurabilityTestLog();
        let tableHtml = "<table border='1'>";
        tableHtml += "<tr><th>守備/魔防</th><th>ダメージ概要</th><th>合計ダメージ</th></tr>";
        for (let i = 0; i < 12; ++i) {
            let mit = 10 + i * 5;

            // テスト対象のHPと奥義発動カウントをリセット
            targetUnit.specialCount = originalSpecialCount;
            if (this.vm.durabilityTestHealsHpFull) {
                targetUnit.heal(99);
                enemyUnit.heal(99);
            }
            else {
                targetUnit.hp = originalHp;
                enemyUnit.hp = originalEnemyHp;
            }

            enemyUnit.defWithSkills = mit;
            enemyUnit.resWithSkills = mit;

            let result = this.calcDamageTemporary(targetUnit, enemyUnit);
            tableHtml += `<tr><th>${mit}</th>`;
            tableHtml += `<td>`;
            let damageSummary = `${result.preCombatDamage}+${result.atkUnit_normalAttackDamage}`;
            if (result.atkUnit_totalAttackCount > 1) {
                damageSummary += `×${result.atkUnit_totalAttackCount}`;
            }
            tableHtml += `${damageSummary}`;
            tableHtml += "</td>";
            tableHtml += `<td>`;
            let totalDamage = result.preCombatDamage + result.atkUnit_normalAttackDamage * result.atkUnit_totalAttackCount;
            tableHtml += `${totalDamage}`;
            tableHtml += "</td>";
            tableHtml += "</tr>";

            if (this.vm.durabilityTestIsLogEnabled) {
                this.writeLogLine(this.damageCalc.log);
            }
        }
        tableHtml += "</table>";
        this.writeDurabilityTestLog(tableHtml);
    }

    __durabilityTest_simulate(targetUnit, enemyUnit) {
        let result = this.__durabilityTest_simulateImpl(targetUnit, enemyUnit);
        let winCount = result.winCount;
        let drawCount = result.drawCount;
        let loseCount = result.loseCount;
        let totalCount = winCount + loseCount + drawCount;
        let loseEnemies = result.loseEnemies;
        let drawEnemies = result.drawEnemies;
        let winEnemies = result.winEnemies;

        this.clearDurabilityTestLog();
        this.writeDurabilityTestLogLine(`勝利 ${winCount}/${totalCount}(${Math.trunc(winCount / totalCount * 1000) * 0.1}%)`);
        this.writeDurabilityTestLogLine(`引き分け ${drawCount}/${totalCount}(${Math.trunc(drawCount / totalCount * 1000) * 0.1}%)`);
        this.writeDurabilityTestLogLine(`敗北 ${loseCount}/${totalCount}(${Math.trunc(loseCount / totalCount * 1000) * 0.1}%)`);
        this.writeDurabilityTestLogLine(`勝率: ${this.__calcDurabilityScoreAsString(winCount, drawCount, loseCount, 0)}%`);
        this.writeDurabilityTestLogLine(`生存率: ${this.__calcDurabilityScoreAsString(winCount, drawCount, loseCount, 2)}%`);
        this.writeDurabilityTestLogLine(`戦闘結果スコア: ${this.__calcDurabilityScoreAsString(winCount, drawCount, loseCount, 1)} / 100`);

        const iconSize = 40;

        loseEnemies.sort((a, b) => getWeaponTypeOrder(a.weaponTypeValue) - getWeaponTypeOrder(b.weaponTypeValue));
        drawEnemies.sort((a, b) => getWeaponTypeOrder(a.weaponTypeValue) - getWeaponTypeOrder(b.weaponTypeValue));
        winEnemies.sort((a, b) => getWeaponTypeOrder(a.weaponTypeValue) - getWeaponTypeOrder(b.weaponTypeValue));

        this.writeDurabilityTestLogLine("<details>");
        this.writeDurabilityTestLogLine("<summary>敗北した相手</summary>");
        for (let iconTag of loseEnemies) {
            this.writeDurabilityTestLog(iconTag.getIconImgTagWithAnchor(iconSize));
        }
        this.writeDurabilityTestLogLine("</details>");
        this.writeDurabilityTestLogLine("<details>");
        this.writeDurabilityTestLogLine("<summary>引き分けの相手</summary>");
        for (let iconTag of drawEnemies) {
            this.writeDurabilityTestLog(iconTag.getIconImgTagWithAnchor(iconSize));
        }
        this.writeDurabilityTestLogLine("</details>");
        this.writeDurabilityTestLogLine("<details>");
        this.writeDurabilityTestLogLine("<summary>勝利した相手</summary>");
        for (let iconTag of winEnemies) {
            this.writeDurabilityTestLog(iconTag.getIconImgTagWithAnchor(iconSize));
        }
        this.writeDurabilityTestLogLine("</details>");

        updateAllUi();
    }

    __durabilityTest_initUnit(
        targetUnit, heroInfo, enemyUnit, equipsAllDistCounterIfImpossible = false, reducedSpecialCount = 0
    ) {
        // let reducedEnemySpecialCount = targetUnit.maxSpecialCount - targetUnit.specialCount;
        let originalSpecialCount = targetUnit.specialCount;
        let grantedBlessing = targetUnit.grantedBlessing;

        // 全シーズンを有効にする
        g_appData.setAllSeasonEnabled();

        // 初期化
        {
            targetUnit.initByHeroInfo(heroInfo);
            targetUnit.grantedBlessing = grantedBlessing;
            targetUnit.initializeSkillsToDefault();

            targetUnit.setMoveCountFromMoveType();
            targetUnit.isResplendent = targetUnit.heroInfo.isResplendent;
            targetUnit.weaponRefinement = WeaponRefinementType.Special;
            if (targetUnit.special == Special.None) {
                targetUnit.special = this.vm.durabilityTestDefaultSpecial;
            }

            g_appData.__updateUnitSkillInfo(targetUnit);
            let weaponRefinement = WeaponRefinementType.Special;
            if (targetUnit.weaponInfo != null
                && targetUnit.weaponInfo.specialRefineHpAdd == 3
            ) {
                weaponRefinement = WeaponRefinementType.Special_Hp3;
            }
            targetUnit.weaponRefinement = weaponRefinement;

            if (equipsAllDistCounterIfImpossible) {
                // 全距離反撃できない場合に遠距離反撃、近距離反撃を装備する
                if (targetUnit.attackRange != enemyUnit.attackRange
                    && !this.__canCounterAttackToAllDistance(targetUnit)
                ) {
                    if (targetUnit.isMeleeWeaponType()) {
                        targetUnit.passiveA = PassiveA.DistantCounter;
                    }
                    else if (targetUnit.isRangedWeaponType()) {
                        targetUnit.passiveA = PassiveA.CloseCounter;
                    }
                    g_appData.__updateUnitSkillInfo(targetUnit);
                }
            }
        }

        g_appData.__updateStatusBySkillsAndMerges(targetUnit, false);
        targetUnit.resetMaxSpecialCount();
        // targetUnit.specialCount = targetUnit.maxSpecialCount - reducedEnemySpecialCount;
        // targetUnit.specialCount = originalSpecialCount;
        targetUnit.specialCount = targetUnit.maxSpecialCount - reducedSpecialCount;
        targetUnit.heal(99);
    }

    __forceToApplySkillsForBeginningOfTurn(targetUnit) {
        let originalDisableAllLogs = this.disableAllLogs;
        this.disableAllLogs = true;

        targetUnit.endAction();
        targetUnit.beginAction();

        this.__initReservedHpForAllUnitsOnMap();

        for (let skillId of targetUnit.enumerateSkills()) {
            this.__applySkillForBeginningOfTurn(skillId, targetUnit);
        }

        // ターン開始時効果によるダメージや回復を反映
        this.__applyReservedHpForAllUnitsOnMap(true);

        this.disableAllLogs = originalDisableAllLogs;
    }

    __durabilityTest_simulateImpl(targetUnit, enemyUnit) {
        let winCount = 0;
        let drawCount = 0;
        let loseCount = 0;
        let grantedBlessing = enemyUnit.grantedBlessing;
        let originalHp = targetUnit.hp;
        let originalSpecialCount = targetUnit.specialCount;
        let originalEnemyHp = enemyUnit.hp;
        let originalEnemySpecialCount = enemyUnit.specialCount;
        let reducedEnemySpecialCount = enemyUnit.maxSpecialCount - enemyUnit.specialCount;

        let loseEnemies = [];
        let drawEnemies = [];
        let winEnemies = [];
        let elapsedMillisecToApplySkillsForBeginningOfTurn = 0;
        let elapsedMillisecForCombat = 0;
        let elapsedMillisecForInitUnit = 0;
        for (let i = 0; i < g_appData.heroInfos.length; ++i) {
            let heroInfo = g_appData.heroInfos.get(i);

            // 敵の初期化
            using(new ScopedStopwatch(time => elapsedMillisecForInitUnit += time), () => {
                this.__durabilityTest_initUnit(enemyUnit, heroInfo, targetUnit, g_appData.durabilityTestEquipAllDistCounter, reducedEnemySpecialCount);
                this.__updateUnitSpur(targetUnit, this.vm.durabilityTestCalcPotentialDamage);
                this.__updateUnitSpur(enemyUnit, this.vm.durabilityTestCalcPotentialDamage);

                // テスト対象のHPと奥義発動カウントをリセット
                targetUnit.specialCount = originalSpecialCount;
                if (this.vm.durabilityTestHealsHpFull) {
                    targetUnit.heal(99);
                }
                else {
                    targetUnit.hp = originalHp;
                }
            });

            if (this.vm.durabilityTestAppliesSkillsForBeginningOfTurn) {
                using(new ScopedStopwatch(time => elapsedMillisecToApplySkillsForBeginningOfTurn += time), () => {
                    this.__forceToApplySkillsForBeginningOfTurn(targetUnit);
                    this.__forceToApplySkillsForBeginningOfTurn(enemyUnit);
                });
            }

            let tmpWinCount = 0;
            let attackerUnit = this.vm.durabilityTestIsAllyUnitOffence ? targetUnit : enemyUnit;
            let deffenceUnit = this.vm.durabilityTestIsAllyUnitOffence ? enemyUnit : targetUnit;
            using(new ScopedStopwatch(time => elapsedMillisecForCombat += time), () => {
                for (let i = 0; i < this.vm.durabilityTestBattleCount; ++i) {
                    let combatResult = this.calcDamageTemporary(attackerUnit, deffenceUnit, null, this.vm.durabilityTestCalcPotentialDamage);
                    targetUnit.hp = targetUnit.restHp;
                    targetUnit.specialCount = targetUnit.tmpSpecialCount;
                    if (enemyUnit.restHp == 0) {
                        ++tmpWinCount;
                    }
                }
            });

            let combatResultText = "";
            if (targetUnit.restHp == 0) {
                combatResultText = "敗北";
                ++loseCount;
                loseEnemies.push(heroInfo);

                if (this.vm.durabilityTestIsLogEnabled && this.vm.durabilityTestLogDamageCalcDetailIfLose) {
                    this.writeLogLine(this.damageCalc.log);
                }
            }
            else if (tmpWinCount == this.vm.durabilityTestBattleCount) {
                combatResultText = "勝利";
                ++winCount;
                winEnemies.push(heroInfo);
            }
            else {
                combatResultText = "引き分け";
                ++drawCount;
                drawEnemies.push(heroInfo);
            }

            if (this.vm.durabilityTestIsLogEnabled) {
                this.writeLogLine(`${targetUnit.getNameWithGroup()}(HP${originalHp}→${targetUnit.restHp})vs${enemyUnit.getNameWithGroup()}(HP${enemyUnit.hp}→${enemyUnit.restHp})→${combatResultText}`);
            }
        }

        this.writeDebugLogLine(`ユニット初期化: ${elapsedMillisecForInitUnit} ms`);
        this.writeDebugLogLine(`ターン開始時スキル適用: ${elapsedMillisecToApplySkillsForBeginningOfTurn} ms`);
        this.writeDebugLogLine(`戦闘評価: ${elapsedMillisecForCombat} ms`);

        targetUnit.specialCount = originalSpecialCount;
        targetUnit.hp = originalHp;
        enemyUnit.specialCount = originalEnemySpecialCount;
        enemyUnit.hp = originalEnemyHp;

        let result = new Object();
        result.winCount = winCount;
        result.drawCount = drawCount;
        result.loseCount = loseCount;
        result.loseEnemies = loseEnemies;
        result.winEnemies = winEnemies;
        result.drawEnemies = drawEnemies;
        return result;
    }

    setOneVsOneForDurabilityTest() {
        for (let unit of this.enumerateAllUnitsOnMap()) {
            if (unit.id == g_appData.durabilityTestAllyUnitId
                || unit.id == g_appData.durabilityTestEnemyUnitId
            ) {
                continue;
            }

            moveUnitToTrashBox(unit);
        }
        updateAllUi();
    }

    __calcDurabilityScoreAsString(
        winCount, drawCount, loseCount,
        drawScore = 1
    ) {
        const winScore = 2;
        let totalCount = winCount + loseCount + drawCount;
        let pureScore = winCount * winScore + drawCount * drawScore;
        let percentageScore = Math.floor(pureScore / (totalCount * winScore) * 1000) * 0.1;
        let percentageScoreText = String(percentageScore);
        percentageScoreText = percentageScoreText.substr(0, 4);
        return percentageScoreText;
    }

    clearDurabilityTestLog() {
        this.vm.durabilityTestLog = "";
    }
    writeDurabilityTestLog(message) {
        this.vm.durabilityTestLog += message;
    }
    writeDurabilityTestLogLine(message) {
        this.writeDurabilityTestLog(message + "<br/>");
    }

    removeDefenceStructuresNoEffectForEnemyMovement() {
        for (let st of this.vm.map.enumerateBreakableStructures(UnitGroupType.Ally)) {
            if (st instanceof OffenceStructureBase
                || this.__isTileInEnemyUnitMoveRange(st.placedTile)
            ) {
                continue;
            }

            moveStructureToTrashBox(st);
        }
        // for (let st of this.vm.map.enumerateObjs(x => x instanceof TrapBase)) {
        //     moveStructureToTrashBox(st);
        // }
    }

    examinesAliveTiles() {
        let currentUnit = this.__getCurrentUnit();
        if (currentUnit == null) {
            this.writeErrorLine("ユニットが選択されていません");
            return;
        }

        this.writeDebugLogLine(currentUnit.getNameWithGroup() + "の受け可能なマスを調査します。");
        this.tempSerializedTurn = exportPerTurnSettingAsString();
        let currentTurn = this.vm.currentTurn;
        let origAliveAllyCount = this.__countAliveUnits(UnitGroupType.Ally);
        const map = g_appData.map;
        let movableTiles = [];
        for (let tile of map.enumerateMovableTiles(currentUnit, false, false, false)) {
            movableTiles.push(tile);
        }

        let tiles = [];
        if (this.vm.limitsExamineRangeToThreatenedRange) {
            for (let tile of map.enumerateTiles(x => x.allyDangerLevel > 0 && x.isUnitPlacableForUnit(currentUnit))) {
                if (!this.vm.limitsExamineRangeToMovableRange || movableTiles.includes(tile)) {
                    tiles.push(tile);
                }
            }
        }
        else {
            tiles = movableTiles;
        }

        let targetTiles = [];
        for (let tile of tiles) {
            if (this.vm.limitsExamineRangeToNoTrapTiles) {
                if (tile.obj instanceof TrapBase) {
                    continue;
                }
            }

            targetTiles.push(tile);
        }

        let self = this;
        startProgressiveProcess(targetTiles.length,
            function (iter) {
                let tile = targetTiles[iter];
                self.simulateEnemyTurn(currentUnit, tile, currentTurn, origAliveAllyCount);
            },
            function (iter, iterMax) {
                $("#progress").progressbar({
                    value: iter,
                    max: iterMax,
                });
                updateAllUi();
            },
            function () {
                self.vm.currentTurn = currentTurn;
                importPerTurnSetting(self.tempSerializedTurn);
                $("#progress").progressbar({ disabled: true });
                updateAllUi();
            });
    }

    simulateEnemiesForCurrentTurn() {
        this.tempSerializedTurn = exportPerTurnSettingAsString();

        let currentTurn = this.vm.currentTurn;
        if (this.vm.currentTurnType == UnitGroupType.Ally) {
            this.simulateBeginningOfEnemyTurn();
        }
        this.isTurnWideCommandQueueEnabled = true;
        for (let i = 0; i < 100; ++i) {
            this.simulateEnemyActionOneByOne(0);
            if (!this.__isThereAnyUnit(UnitGroupType.Enemy, x => !x.isActionDone)) {
                break;
            }
        }
        this.isTurnWideCommandQueueEnabled = false;

        this.vm.currentTurn = currentTurn;
        importPerTurnSetting(this.tempSerializedTurn);
        if (this.vm.currentTurnType == UnitGroupType.Ally) {
            this.simulateBeginningOfEnemyTurn();
        }

        this.__executeAllCommands(this.commandQueue, 100);
    }

    simulateEnemyTurn(currentUnit, tile, currentTurn, origAliveAllyCount) {
        tile.resetOverriddenCell();
        this.vm.currentTurn = currentTurn;
        importPerTurnSetting(this.tempSerializedTurn);
        if (this.vm.currentTurnType == UnitGroupType.Ally) {
            this.simulateBeginningOfEnemyTurn();
        }

        moveUnit(currentUnit, tile);
        let origIsCommandUndoable = this.vm.isCommandUndoable;
        this.vm.isCommandUndoable = false;
        for (let i = 0; i < 100; ++i) {
            this.simulateEnemyActionOneByOne(0);
            if (!this.__isThereAnyUnit(UnitGroupType.Enemy, x => !x.isActionDone)) {
                break;
            }
        }
        this.vm.isCommandUndoable = origIsCommandUndoable;

        let aliveEnemyCount = this.__countAliveUnits(UnitGroupType.Enemy);
        let aliveAllyCount = this.__countAliveUnits(UnitGroupType.Ally);
        if (aliveAllyCount == origAliveAllyCount) {
            tile.overrideCell("<span style='font-size:8px;color:#0000FF'>敵数" + aliveEnemyCount + "</span>", "3px", "#0000FF");
        }
        else {
            tile.overrideCell("<span style='font-size:8px;color:#FF0000'>敵数" + aliveEnemyCount + "</span>", "3px", "#FF0000");
        }
    }

    __isThereActionableAllyUnit() {
        return this.__isThereAnyUnit(UnitGroupType.Ally, x => !x.isActionDone);
    }
    __isThereActionableEnemyUnit() {
        return this.__isThereAnyUnit(UnitGroupType.Enemy, x => !x.isActionDone);
    }

    simulateAllyAction() {
        this.simulateAllyActionOneByOne();
        updateAllUi();
    }

    simulateAllyActionCustomized() {
        this.simulateAllyActionOneByOneCustomized();
        updateAllUi();
    }

    simulateEnemyAction() {
        if (this.vm.simulatesEnemyActionOneByOne) {
            this.simulateEnemyActionOneByOne();
            updateAllUi();
        } else {
            this.simulateEnemiesForCurrentTurn();
        }
    }

    simulateAllyActionOneByOneCustomized(intervalMilliseconds = 100) {
        let isAllUnitActionDone = this.__simulateAllyActionCustomized();
        if (isAllUnitActionDone) {
            this.__enqueueEndAllUnitActionCommand(UnitGroupType.Ally);
        }
        this.__executeAllCommands(this.commandQueuePerAction, intervalMilliseconds);
    }
    simulateAllyActionOneByOne(intervalMilliseconds = 100) {
        let isAllUnitActionDone = this.__simulateAllyAction();
        if (isAllUnitActionDone) {
            this.__enqueueEndAllUnitActionCommand(UnitGroupType.Ally);
        }
        this.__executeAllCommands(this.commandQueuePerAction, intervalMilliseconds);
    }

    simulateEnemyActionOneByOne(intervalMilliseconds = 100) {
        let isAllUnitActionDone = this.__simulateEnemyAction();
        if (isAllUnitActionDone) {
            this.__enqueueEndAllUnitActionCommand(UnitGroupType.Enemy);
        }
        this.__executeAllCommands(this.commandQueuePerAction, intervalMilliseconds);
    }

    executeEndActionCommand(unit) {
        this.__enqueueEndActionCommand(unit);
        this.__executeAllCommands(this.commandQueuePerAction, 0);
    }

    __simulateAllyActionCustomized() {
        let targetGroup = UnitGroupType.Ally;
        let enemyGroup = UnitGroupType.Enemy;
        if (this.vm.currentTurnType == enemyGroup) {
            return false;
        }

        let actionableUnits = this.__getActionableUnits(targetGroup);
        let allyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId == targetGroup);
        let enemyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId == enemyGroup);
        let assistTargetableUnits = this.__getUnits(unit =>
            unit.isOnMap
            && !unit.hasStatusEffect(StatusEffectType.Isolation)
            && unit.groupId == targetGroup);
        let assistableUnits = this.__getUnits(unit =>
            unit.groupId == targetGroup
            && unit.isOnMap
            && !unit.isActionDone
            && unit.support != Support.None
            && !unit.hasStatusEffect(StatusEffectType.Isolation)
        );

        this.writeLogLine("■戦闘前補助の計算------------");
        if (this.simulatePrecombatAssist(assistableUnits, assistTargetableUnits, enemyUnits)) {
            return false;
        }
        this.writeLogLine("■攻撃の計算------------");
        if (this.simulateAttack(actionableUnits, enemyUnits)) {
            return false;
        }
        this.writeLogLine("■戦闘後補助の計算------------");
        if (this.simulatePostcombatAssist(assistableUnits, assistTargetableUnits, enemyUnits)) {
            return false;
        }

        this.writeLogLine("■移動の計算------------");
        if (this.simulateMovement(actionableUnits, enemyUnits, allyUnits)) {
            return false;
        }

        return true;
    }

    __simulateAllyAction() {
        let targetGroup = UnitGroupType.Ally;
        let enemyGroup = UnitGroupType.Enemy;
        if (this.vm.currentTurnType == enemyGroup) {
            return false;
        }

        let actionableUnits = this.__getActionableUnits(targetGroup);
        let allyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId == targetGroup);
        let enemyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId == enemyGroup);
        let assistTargetableUnits = this.__getUnits(unit =>
            unit.isOnMap
            && !unit.hasStatusEffect(StatusEffectType.Isolation)
            && unit.groupId == targetGroup);
        let assistableUnits = this.__getUnits(unit =>
            unit.groupId == targetGroup
            && unit.isOnMap
            && !unit.isActionDone
            && unit.support != Support.None
            && !unit.hasStatusEffect(StatusEffectType.Isolation)
        );

        this.writeLogLine("■再移動の計算----------");
        if (this.simulateCanto(actionableUnits)) {
            return false;
        }

        this.writeLogLine("■戦闘前補助の計算------------");
        if (this.simulatePrecombatAssist(assistableUnits, assistTargetableUnits, enemyUnits)) {
            return false;
        }
        this.writeLogLine("■攻撃の計算------------");
        if (this.simulateAttack(actionableUnits, enemyUnits)) {
            return false;
        }
        this.writeLogLine("■戦闘後補助の計算------------");
        if (this.simulatePostcombatAssist(assistableUnits, assistTargetableUnits, enemyUnits)) {
            return false;
        }

        this.writeLogLine("■移動の計算------------");
        if (this.simulateMovement(actionableUnits, enemyUnits, allyUnits)) {
            return false;
        }

        return true;
    }

    __simulateEnemyAction() {
        let targetGroup = UnitGroupType.Enemy;
        let enemyGroup = UnitGroupType.Ally;
        if (this.vm.currentTurnType == enemyGroup) {
            return false;
        }

        let actionableUnits = this.__getActionableUnits(targetGroup);
        let allyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId == targetGroup);
        let enemyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId == enemyGroup);
        let assistTargetableUnits = this.__getUnits(unit =>
            unit.isOnMap
            && !unit.hasStatusEffect(StatusEffectType.Isolation)
            && unit.groupId == targetGroup);
        let assistableUnits = this.__getUnits(unit =>
            unit.groupId == targetGroup
            && unit.isOnMap
            && !unit.isActionDone
            && unit.support != Support.None
            && !unit.hasStatusEffect(StatusEffectType.Isolation)
        );

        this.writeLogLine("■再移動の計算----------");
        if (this.simulateCanto(actionableUnits)) {
            return false;
        }

        this.writeLogLine("■戦闘前補助の計算------------");
        if (this.simulatePrecombatAssist(assistableUnits, assistTargetableUnits, enemyUnits)) {
            return false;
        }
        this.writeLogLine("■攻撃の計算------------");
        if (this.simulateAttack(actionableUnits, enemyUnits)) {
            return false;
        }

        this.writeLogLine("■戦闘後補助の計算------------");
        if (this.simulatePostcombatAssist(assistableUnits, assistTargetableUnits, enemyUnits)) {
            return false;
        }

        let triggeredActionableUnits = [];
        for (let unit of actionableUnits) {
            if (g_appData.examinesEnemyActionTriggered(unit)) {
                triggeredActionableUnits.push(unit);
            }
        }

        this.writeLogLine("■移動の計算------------");
        if (this.simulateMovement(triggeredActionableUnits, enemyUnits, allyUnits)) {
            return false;
        }

        return true;
    }

    simulatePostcombatAssist(assistEnemyUnits, enemyUnits, allyUnits) {
        // コンテキスト初期化
        this.__prepareActionContextForAssist(enemyUnits, allyUnits, false);
        for (let unit of assistEnemyUnits) {
            if (unit.hasWeapon && unit.isMeleeWeaponType()) {
                unit.actionContext.isBlocker = true;
            }
        }

        // 補助優先度を計算
        for (let unit of assistEnemyUnits) {
            unit.actionContext.assistPriority = this.__calcAssistPriorityForPostcombat(unit);
        }

        assistEnemyUnits.sort(function (a, b) {
            return b.actionContext.assistPriority - a.actionContext.assistPriority;
        });

        let slotOrderDependentIndices = this.__getSlotOrderDependentIndices(assistEnemyUnits, x => x.actionContext.assistPriority);

        let isActionActivated = false;
        for (let i = 0; i < assistEnemyUnits.length; ++i) {
            let assistUnit = assistEnemyUnits[i];
            this.writeLogLine(assistUnit.getNameWithGroup() + "の補助資格を評価-----");
            if (!this.__canActivatePostcombatAssist(assistUnit, allyUnits)) {
                this.writeLogLine(assistUnit.getNameWithGroup() + "は補助資格なし");
                continue;
            }

            // 補助を実行可能な味方を取得
            this.__setBestTargetAndTiles(assistUnit, false, (targetUnit, tile) => this.__canBeActivatedPostcombatAssist(assistUnit, targetUnit, tile));
            if (assistUnit.actionContext.bestTargetToAssist == null) {
                this.writeLogLine(assistUnit.getNameWithGroup() + "の補助可能な味方がいない");
                continue;
            }

            if (slotOrderDependentIndices.includes(i)) {
                this.writeWarningLine(`${assistUnit.getNameWithGroup()}の補助行動順はスロット順で変わる可能性があります。`);
            }

            let bestTargetToAssist = assistUnit.actionContext.bestTargetToAssist;

            // ボディブロッキングの評価
            let blockableTiles = [];
            if (assistUnit.actionContext.isBlocker && assistUnit.hasMovementAssist()) {
                this.writeLogLine(assistUnit.getNameWithGroup() + "が" + bestTargetToAssist.getNameWithGroup() + "をボディブロッキング可能か評価");
                for (let allyUnit of allyUnits) {
                    if (!allyUnit.hasWeapon || allyUnit.attackRange != 1) {
                        // 近接アタッカーのみが対象
                        continue;
                    }

                    if (!this.map.examinesCanAttack(allyUnit, bestTargetToAssist, false)) {
                        // もともと攻撃範囲外
                        continue;
                    }

                    // ボディブロック可能なタイルを調査
                    this.writeDebugLogLine(allyUnit.getNameWithGroup() + "の攻撃をブロックできるマスを調査..");
                    {
                        let originalPlacedTile = assistUnit.placedTile;
                        let movableTiles = [];
                        for (let tile of this.map.enumerateMovableTiles(assistUnit, false, false, false)) {
                            movableTiles.push(tile);
                        }

                        for (let tile of movableTiles) {
                            this.map.moveUnit(assistUnit, tile.posX, tile.posY);
                            if (this.map.examinesCanAttack(allyUnit, bestTargetToAssist, false)) {
                                this.writeDebugLogLine(tile.positionToString() + "では" + allyUnit.getNameWithGroup() + "の攻撃をブロック不可");
                                continue;
                            }

                            if (!blockableTiles.includes(tile)) {
                                this.writeDebugLogLine(tile.positionToString() + "で" + allyUnit.getNameWithGroup() + "の攻撃をブロック可");
                                blockableTiles.push(tile);
                            }
                        }

                        this.map.moveUnit(assistUnit, originalPlacedTile.posX, originalPlacedTile.posY);
                    }
                }
            }

            if (blockableTiles.length > 0) {
                let bodyblockTile = this.__selectBestTileToAssistFromTiles(blockableTiles, assistUnit);
                this.__enqueueMoveCommand(assistUnit, bodyblockTile, true);
            }
            else {
                let bestTileToAssist = assistUnit.actionContext.bestTileToAssist;
                this.__enqueueSupportCommand(assistUnit, bestTileToAssist, bestTargetToAssist);
            }

            isActionActivated = true;
            break;
        }

        return isActionActivated;
    }

    __getSlotOrderDependentIndices(infos, getPriorityFunc, slotOrderPriorityDiff = 10) {
        let result = [];
        for (let i = 0; i < infos.length - 1; ++i) {
            let info = infos[i];
            let nextInfo = infos[i + 1];
            let diff = getPriorityFunc(info) - getPriorityFunc(nextInfo);
            if (diff < slotOrderPriorityDiff) {
                // スロット順依存の可能性
                result.push(i);
                result.push(i + 1);
            }
        }
        return distinct(result);
    }

    __updateEnemyThreatStatusesForAll(targetUnits, enemyUnits) {
        for (let unit of targetUnits) {
            this.__updateEnemyThreatStatuses(unit, enemyUnits);
        }
    }

    __updateEnemyThreatStatuses(unit, enemyUnits) {
        this.writeDebugLogLine("敵の攻撃範囲に" + unit.getNameWithGroup() + "が含まれているか評価 --------");
        unit.actionContext.hasThreatenedByEnemyStatus = this.__examinesIsUnitThreatenedByEnemy(unit, enemyUnits);
        this.writeDebugLogLine(unit.getNameWithGroup() + "の攻撃範囲に敵が含まれているか評価 --------");
        unit.actionContext.hasThreatensEnemyStatus = this.__examinesUnitThreatensEnemy(unit, enemyUnits);
        this.writeDebugLogLine(unit.getNameWithGroup() + ": "
            + "hasThreatensEnemyStatus=" + unit.actionContext.hasThreatensEnemyStatus
            + ", hasThreatenedByEnemyStatus=" + unit.actionContext.hasThreatenedByEnemyStatus
        );

        if (unit.actionContext.hasThreatenedByEnemyStatus) {
            unit.addPerTurnStatus(PerTurnStatusType.ThreatenedByEnemy);
        }
        if (unit.actionContext.hasThreatensEnemyStatus) {
            unit.addPerTurnStatus(PerTurnStatusType.ThreatensEnemy);
        }
    }

    __updateDistanceFromClosestEnemy(unit) {
        let dist = unit.placedTile.calculateDistanceToClosestEnemyTile(unit);
        unit.distanceFromClosestEnemy = dist;
    }

    __prepareActionContextForAssist(allyUnits, enemyUnits, triggersAction = true) {
        using(new ScopedStopwatch(time => this.writeDebugLogLine("行動計算コンテキストの初期化: " + time + " ms")), () => {
            for (let unit of allyUnits) {
                unit.actionContext.clear();
            }
            for (let unit of enemyUnits) {
                unit.actionContext.clear();
            }

            for (let unit of allyUnits) {
                this.writeDebugLogLine(`${unit.getNameWithGroup()}のターン開始時移動数:${unit.moveCountAtBeginningOfTurn}`);

                this.writeDebugLogLine("敵の攻撃範囲に" + unit.getNameWithGroup() + "が含まれているか評価 --------");
                unit.actionContext.hasThreatenedByEnemyStatus = this.__examinesIsUnitThreatenedByEnemy(unit, enemyUnits);
                this.writeDebugLogLine(unit.getNameWithGroup() + "の攻撃範囲に敵が含まれているか評価 --------");
                unit.actionContext.hasThreatensEnemyStatus = this.__examinesUnitThreatensEnemy(unit, enemyUnits);
                this.writeDebugLogLine(unit.getNameWithGroup() + ": "
                    + "hasThreatensEnemyStatus=" + unit.actionContext.hasThreatensEnemyStatus
                    + ", hasThreatenedByEnemyStatus=" + unit.actionContext.hasThreatenedByEnemyStatus
                );

                if (triggersAction && unit.groupId == UnitGroupType.Enemy) {
                    if (!g_appData.examinesEnemyActionTriggered(unit)) {
                        let isTriggered = this.__examinesCanTriggerAction(unit);
                        unit.isEnemyActionTriggered = isTriggered;
                        this.vm.isEnemyActionTriggered = isTriggered;
                    }
                }
            }
        });
    }

    __examinesCanTriggerAction(unit) {
        if (unit.isActionDone) {
            return false;
        }

        if (unit.actionContext.hasThreatensEnemyStatus) {
            return true;
        }

        // 敵ユニットを無視した移動範囲内に敵がいたら、敵は動き出す
        for (let tile of g_appData.map.enumerateMovableTiles(unit, true)) {
            if (tile.placedUnit != null
                && tile.placedUnit.groupId != unit.groupId
            ) {
                return true;
            }
        }
        return false;
    }

    simulatePrecombatAssist(assistableUnits, enemyUnits, allyUnits) {
        // コンテキスト初期化
        this.__prepareActionContextForAssist(enemyUnits, allyUnits, true);

        // 補助優先度を計算
        for (let unit of assistableUnits) {
            unit.actionContext.assistPriority = this.__calcAssistPriorityForPrecombat(unit);
        }

        assistableUnits.sort(function (a, b) {
            return b.actionContext.assistPriority - a.actionContext.assistPriority;
        });

        let slotOrderDependentIndices = this.__getSlotOrderDependentIndices(assistableUnits, x => x.actionContext.assistPriority);

        let isActionActivated = false;
        for (let i = 0; i < assistableUnits.length; ++i) {
            let unit = assistableUnits[i];
            this.writeDebugLogLine(unit.getNameWithGroup() + "の補助資格を評価");
            if (!this.__canActivatePrecombatAssist(unit, allyUnits)) {
                this.writeDebugLogLine(unit.getNameWithGroup() + "は補助資格なし");
                continue;
            }

            this.__setBestTargetAndTiles(unit, true, (targetUnit, tile) => this.__canBeActivatedPrecombatAssist(unit, targetUnit, tile));
            if (unit.actionContext.bestTargetToAssist == null) {
                this.writeDebugLogLine(unit.getNameWithGroup() + "の補助可能な味方がいない");
                continue;
            }

            if (slotOrderDependentIndices.includes(i)) {
                this.writeWarningLine(`${unit.getNameWithGroup()}の補助行動順はスロット順で変わる可能性があります。`);
            }

            let bestTargetToAssist = unit.actionContext.bestTargetToAssist;
            let bestTileToAssist = unit.actionContext.bestTileToAssist;

            this.__enqueueSupportCommand(unit, bestTileToAssist, bestTargetToAssist);
            isActionActivated = true;
            break;
        }

        return isActionActivated;
    }

    __examinesIsUnitThreatenedByEnemy(unit, enemyUnits) {
        if (unit.groupId == UnitGroupType.Enemy) {
            return unit.placedTile.isThreatenedByAlly;
        } else {
            return unit.placedTile.isThreatenedByEnemy;
        }
        // for (let enemyUnit of enemyUnits) {
        //     this.__setAttackableUnitInfo(enemyUnit, [unit]);
        //     if (enemyUnit.actionContext.attackableUnitInfos.length > 0) {
        //         this.writeDebugLogLine(enemyUnit.getNameWithGroup() + "が" + unit.getNameWithGroup() + "を攻撃可能");
        //         return true;
        //     }
        // }
        // return false;
    }

    __examinesUnitThreatensEnemy(unit, enemyUnits) {
        this.__setAttackableUnitInfo(unit, enemyUnits);
        if (unit.actionContext.attackableUnitInfos.length > 0) {
            return true;
        }
        return false;
    }

    __evalulateIs5DamageDealtOrWin(unit, enemyUnits, ignores5DamageDealt = false) {
        this.__setAttackableUnitInfoAndBestTileToAttack(unit, enemyUnits);
        if (unit.actionContext.attackableUnitInfos.length > 0) {
            // 攻撃範囲に敵がいる
            for (let attackableUnitInfo of unit.actionContext.attackableUnitInfos) {
                let tile = attackableUnitInfo.bestTileToAttack;
                this.__updateCombatResultOfAttackableTargetInfo(attackableUnitInfo, unit, tile);
                let combatResult = attackableUnitInfo.combatResultDetails[tile.id];
                if (attackableUnitInfo.combatResults[tile.id] == CombatResult.Win) {
                    this.writeDebugLogLine(unit.getNameWithGroup() + "は戦闘に勝利するので補助資格なし");
                    return true;
                }

                if (!ignores5DamageDealt) {
                    // 2回攻撃は1回分だけ加味
                    let attackCount = combatResult.atkUnit_totalAttackCount / unit.weaponInfo.attackCount;
                    let damageDealt = combatResult.atkUnit_normalAttackDamage * attackCount;
                    this.writeDebugLogLine(unit.getNameWithGroup() + "から" + attackableUnitInfo.targetUnit.getNameWithGroup() + "へのダメージ=" + damageDealt);
                    if (damageDealt >= 5) {
                        this.writeDebugLogLine(unit.getNameWithGroup() + "は5ダメージ以上与えられるので補助資格なし");
                        return true;
                    }
                }
            }
        }

        return false;
    }
    __canBeActivatedPrecombatAssist(unit, targetUnit, tile) {
        // 補助を実行可能な味方を取得
        switch (unit.supportInfo.assistType) {
            case AssistType.Refresh:
                return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
            case AssistType.Rally:
                // todo: ちゃんと実装する
                return !targetUnit.isActionDone
                    && targetUnit.actionContext.hasThreatensEnemyStatus
                    && unit.canRallyTo(targetUnit, 2);
            case AssistType.Heal:
                if (unit.support == Support.Sacrifice) {
                    let assisterEnemyThreat = unit.placedTile.getEnemyThreatFor(unit.groupId);
                    let targetEnemyThreat = targetUnit.placedTile.getEnemyThreatFor(targetUnit.groupId);
                    if (assisterEnemyThreat > targetEnemyThreat) {
                        return false;
                    }
                }
                return (targetUnit.canHeal(getPrecombatHealThreshold(unit.support)));
            case AssistType.Restore:
                return targetUnit.hasNegativeStatusEffect()
                    || (targetUnit.canHeal(getPrecombatHealThreshold(unit.support)));
            case AssistType.DonorHeal:
                {
                    if (targetUnit.hasStatusEffect(StatusEffectType.DeepWounds)
                    ) {
                        return false;
                    }

                    let assisterEnemyThreat = unit.placedTile.getEnemyThreatFor(unit.groupId);
                    let targetEnemyThreat = targetUnit.placedTile.getEnemyThreatFor(targetUnit.groupId);
                    if (assisterEnemyThreat > targetEnemyThreat) {
                        return false;
                    }

                    let result = this.__getUserLossHpAndTargetHaelHpForDonorHeal(unit, targetUnit);
                    if (!result.success || result.targetHealHp < result.userLossHp) {
                        return false;
                    }

                    switch (unit.support) {
                        case Support.ArdentSacrifice:
                            if (result.targetHealHp < 10) {
                                return false;
                            }
                            break;
                        case Support.ReciprocalAid:
                            if (result.targetHealHp < 1) {
                                return false;
                            }
                            break;
                        default:
                            break;
                    }

                    return true;
                }
            default:
                this.writeErrorLine("戦闘前補助が未実装のスキル: " + unit.supportInfo.name);
                return false;
        }
    }

    __canBeActivatedPostcombatMovementAssist(unit, targetUnit, tile) {
        // 双界だと行動制限が解除されていないと使用しないっぽい
        if (!g_appData.examinesEnemyActionTriggered(unit)) {
            return false;
        }

        let canBeMovedIntoLessEnemyThreat = this.__canBeMovedIntoLessEnemyThreat(unit, targetUnit, tile);
        this.writeDebugLogLine(
            "対象=" + targetUnit.getNameWithGroup() + " " + tile.positionToString() + ": "
            + "targetUnit.isActionDone=" + targetUnit.isActionDone + ", "
            + "canBeMovedIntoLessEnemyThreat=" + canBeMovedIntoLessEnemyThreat + ", "
            + "hasThreatensEnemyStatus=" + targetUnit.actionContext.hasThreatensEnemyStatus + ", "
            + "hasThreatenedByEnemyStatus=" + targetUnit.actionContext.hasThreatenedByEnemyStatus
        );
        return targetUnit.isActionDone
            && (targetUnit.actionContext.hasThreatensEnemyStatus || targetUnit.actionContext.hasThreatenedByEnemyStatus)
            && canBeMovedIntoLessEnemyThreat;
    }

    __canBeActivatedPostcombatAssist(unit, targetUnit, tile) {
        switch (unit.supportInfo.assistType) {
            case AssistType.Refresh:
                return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
            case AssistType.Heal:
                if (targetUnit.canHeal()) {
                    return true;
                }
                if (unit.support == Support.RescuePlus
                    || unit.support == Support.Rescue
                    || unit.support == Support.ReturnPlus
                    || unit.support == Support.Return
                    || unit.support == Support.NudgePlus
                    || unit.support == Support.Nudge
                ) {
                    return this.__canBeActivatedPostcombatMovementAssist(unit, targetUnit, tile);
                }
                return false;
            case AssistType.Restore:
                return (targetUnit.isDebuffed || targetUnit.hasNegativeStatusEffect()) || targetUnit.canHeal();
            case AssistType.Rally:
                {
                    if (!targetUnit.actionContext.hasThreatensEnemyStatus
                        && !g_appData.examinesEnemyActionTriggered(unit)
                    ) {
                        return false;
                    }
                    // todo: ちゃんと実装する
                    let canBeBuffedAtLeast2 = unit.canRallyTo(targetUnit, 2);
                    this.writeDebugLogLine(targetUnit.getNameWithGroup() + ": "
                        + "hasThreatensEnemyStatus=" + targetUnit.actionContext.hasThreatensEnemyStatus
                        + ", hasThreatenedByEnemyStatus=" + targetUnit.actionContext.hasThreatenedByEnemyStatus
                        + ", canBeBuffedAtLeast2=" + canBeBuffedAtLeast2
                    );
                    return (targetUnit.actionContext.hasThreatensEnemyStatus || targetUnit.actionContext.hasThreatenedByEnemyStatus)
                        && canBeBuffedAtLeast2;
                }
            case AssistType.Move:
                return this.__canBeActivatedPostcombatMovementAssist(unit, targetUnit, tile);
            case AssistType.DonorHeal:
                {
                    // 双界だと行動制限が解除されていないと使用しないっぽい
                    if (!g_appData.examinesEnemyActionTriggered(unit)) {
                        return false;
                    }

                    if (targetUnit.hasStatusEffect(StatusEffectType.DeepWounds)) {
                        return false;
                    }

                    let result = this.__getUserLossHpAndTargetHaelHpForDonorHeal(unit, targetUnit);
                    if (!result.success || result.targetHealHp < result.userLossHp) {
                        return false;
                    }
                    return true;
                }
            default:
                this.writeErrorLine("戦闘後補助が未実装のスキル: " + unit.supportInfo.name);
                return false;
        }
    }

    __getUserLossHpAndTargetHaelHpForDonorHeal(unit, targetUnit) {
        let userLossHp = 0;
        let targetHealHp = 0;
        switch (unit.support) {
            case Support.ReciprocalAid:
                {
                    if (targetUnit.hp >= unit.hp) {
                        return { success: false, userLossHp: 0, targetHealHp: 0 };
                    }

                    userLossHp = unit.hp - targetUnit.hp;
                    let afterTargetHp = Math.min(unit.hp, targetUnit.maxHpWithSkills);
                    targetHealHp = afterTargetHp - targetUnit.hp;
                }
                break;
            case Support.ArdentSacrifice:
                {
                    let afterUnitHp = Math.max(unit.hp - 10, 1);
                    userLossHp = unit.hp - afterUnitHp;
                    let afterTargetHp = Math.min(targetUnit.maxHpWithSkills, Math.max(targetUnit.hp + 10, targetUnit.maxHpWithSkills));
                    targetHealHp = afterTargetHp - targetUnit.hp;
                }
                break;
        }
        return { success: true, userLossHp: userLossHp, targetHealHp: targetHealHp };
    }

    __canActivatePostcombatAssist(unit, enemyUnits) {
        // todo: ちゃんと実装する
        switch (unit.supportInfo.assistType) {
            case AssistType.Refresh:
                return true;
            case AssistType.Heal:
                if (unit.support == Support.Sacrifice) {
                    if (unit.hp == 1) {
                        return false;
                    }
                }
                return true;
            case AssistType.Rally:
                return true;
            case AssistType.Restore:
                return true;
            case AssistType.Move:
                return true;
            case AssistType.DonorHeal:
                if (!g_appData.examinesEnemyActionTriggered(unit)) {
                    // 発動しないっぽい
                    return false;
                }

                return true;
            default:
                return false;
        }
    }



    __canActivatePrecombatAssist(unit, enemyUnits) {
        if (unit.supportInfo == null) {
            this.writeDebugLogLine("supportInfoがnull");
            return false;
        }

        // todo: ちゃんと実装する
        switch (unit.supportInfo.assistType) {
            case AssistType.Refresh:
                if (this.__evalulateIs5DamageDealtOrWin(unit, enemyUnits)) { return false; }
                return true;
            case AssistType.Rally:
                if (this.__evalulateIs5DamageDealtOrWin(unit, enemyUnits)) { return false; }
                return true;
            case AssistType.Heal:
                {
                    if (unit.support == Support.Sacrifice) {
                        if (unit.hp == 1) {
                            return false;
                        }
                    }

                    let ignores5DamageDealt = unit.support != Support.Sacrifice;
                    if (this.__evalulateIs5DamageDealtOrWin(unit, enemyUnits, ignores5DamageDealt)) { return false; }
                    return true;
                }
            case AssistType.Restore:
                {
                    if (this.__evalulateIs5DamageDealtOrWin(unit, enemyUnits, true)) {
                        return false;
                    }
                    if (!this.__isThereAllyThreatensEnemyStatus(unit)) {
                        return false;
                    }
                    return true;
                }
            case AssistType.DonorHeal:
                {
                    if (!g_appData.examinesEnemyActionTriggered(unit)) {
                        // 発動しないっぽい
                        return false;
                    }

                    if (unit.weapon != Weapon.None) {
                        return false;
                    }

                    return true;
                }
            default:
                return false;
        }
    }

    __isThereAllyThreatensEnemyStatus(unit) {
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(unit, true)) {
            if (allyUnit.actionContext.hasThreatensEnemyStatus) {
                return true;
            }
        }
        return false;
    }

    // 味方を追跡する計算
    __findAllyChaseTargetUnit(evalUnit, targetUnits) {
        let maxPriorityValue = -100000;
        let chaseTarget = null;
        for (let unit of targetUnits) {
            if (unit == evalUnit) { continue; }
            if (!unit.isOnMap) {
                continue;
            }

            let dist = g_appData.map.calculateDistance(evalUnit, unit);
            this.writeDebugLogLine(`・味方"${unit.getNameWithGroup()}"への距離=${dist}`);
            if (dist < 0) {
                continue;
            }

            this.writeDebugLogLine("・slotOrder=" + unit.slotOrder);
            let priorityValue =
                - dist * 10
                + unit.slotOrder;
            this.writeDebugLogLine("priorityValue=" + priorityValue);

            if (priorityValue > maxPriorityValue) {
                maxPriorityValue = priorityValue;
                chaseTarget = unit;
                this.writeDebugLogLine("追跡対象を" + chaseTarget.getNameWithGroup() + "に更新");
            }
        }
        return chaseTarget;
    }

    __updateMovementOrders(targetUnits) {
        for (let unit of targetUnits) {
            let hasSupportPriority = 0;
            if (unit.support == Support.None) {
                hasSupportPriority = 1;
            }
            let attackRangePriority = 0;
            switch (unit.attackRange) {
                case 1: attackRangePriority = 2; break;
                case 2: attackRangePriority = 1; break;
                case 0: attackRangePriority = 0; break;
            }
            // let distanceToClosestEnemy = unit.placedTile.calculateDistanceToClosestEnemyTile(unit);
            let distanceToClosestEnemy = unit.distanceFromClosestEnemy;
            if (distanceToClosestEnemy == CanNotReachTile) { distanceToClosestEnemy = 100000; }

            if (this.vm.gameMode == GameMode.ResonantBattles && unit.groupId == UnitGroupType.Enemy && isThief(unit)) {
                // 盗賊は自軍から遠い順に動くので反転
                distanceToClosestEnemy *= -1;
            }

            let priority =
                hasSupportPriority * 100000
                + attackRangePriority * 10000
                - distanceToClosestEnemy * 100
                - unit.slotOrder;
            this.writeDebugLogLine(unit.getNameWithGroup() + "の移動優先度=" + priority
                + ", hasSupportPriority=" + hasSupportPriority
                + ", attackRangePriority=" + attackRangePriority
                + ", distanceToClosestEnemy=" + distanceToClosestEnemy
                + ", slotOrder=" + unit.slotOrder
            );
            unit.actionContext.movePriority = priority;
        }

        targetUnits.sort(function (a, b) {
            return b.actionContext.movePriority - a.actionContext.movePriority;
        });

        this.writeLogLine("移動順:");
        for (let i = 0; i < targetUnits.length; ++i) {
            let unit = targetUnits[i];
            unit.movementOrder = i;
            this.writeLogLine((i + 1) + "(" + unit.actionContext.movePriority + "): " + unit.getNameWithGroup());
        }

        let slotOrderDependentIndices = this.__getSlotOrderDependentIndices(targetUnits, x => x.actionContext.movePriority);
        for (let i = 0; i < targetUnits.length; ++i) {
            let unit = targetUnits[i];
            if (unit.groupId == UnitGroupType.Enemy) {
                if (slotOrderDependentIndices.includes(i)) {
                    this.writeWarningLine(`${unit.getNameWithGroup()}の移動順はスロット順で変わる可能性があります。`);
                }
            }
        }
    }

    /// 指定したタイルを追跡するユニットのみ、追跡対象タイルを更新します。
    __updateChaseTargetTilesForSpecifiedTile(targetTile) {
        let allUnitsOnMap = Array.from(this.enumerateAllUnitsOnMap());
        this.__updateChaseTargetTiles(allUnitsOnMap, currentChaseTargetTile => {
            return targetTile == currentChaseTargetTile;
        });
    }

    __updateChaseTargetTiles(targetUnits, evaluatesTileFunc = null) {
        let enemyUnits = [];
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnits[0])) {
            enemyUnits.push(unit);
        }

        let allyUnits = [];
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnits[0])) {
            allyUnits.push(unit);
        }

        let self = this;
        using(new ScopedStopwatch(time => this.writeDebugLogLine("追跡対象の計算: " + time + " ms")), () => {
            for (let evalUnit of targetUnits) {
                if (evaluatesTileFunc != null
                    && !evaluatesTileFunc(evalUnit.chaseTargetTile)
                ) {
                    continue;
                }
                self.__updateChaseTargetTile(evalUnit, enemyUnits, allyUnits);
            }
        });
    }

    __updateChaseTargetTile(evalUnit, enemyUnits, allyUnits) {
        if (!evalUnit.isOnMap) {
            return;
        }

        if (this.vm.gameMode == GameMode.ResonantBattles && evalUnit.groupId == UnitGroupType.Enemy) {
            if (isThief(evalUnit)) {
                // 双界の盗賊の追跡対象計算
                let minDist = CanNotReachTile;
                let minTargetTile = null;
                for (let tile of g_appData.map.enumerateTiles(tile => tile.posY == 0 && tile.isUnitPlacableForUnit(evalUnit))) {
                    // todo: 下には移動できない制限があるっぽい？
                    let dist = tile.calculateUnitMovementCountToThisTile(evalUnit, null, -1, false);
                    if (dist == CanNotReachTile) {
                        continue;
                    }

                    if (dist < minDist) {
                        minDist = dist;
                        minTargetTile = tile;
                    }
                    else if (dist == minDist) {
                        // 距離が同じ場合はタイル優先度っぽい
                        if (minTargetTile.tilePriority < tile.tilePriority) {
                            minTargetTile = tile;
                        }
                    }
                }
                if (minTargetTile == null) {
                    // 追跡対象が見つからない場合は味方を追跡対象になってる気がするが、本当にそうかよくわからない
                    let chaseTarget = this.__findAllyChaseTargetUnit(evalUnit, targetUnits);
                    if (chaseTarget != null) {
                        minTargetTile = chaseTarget.placedTile;
                    }
                }
                evalUnit.chaseTargetTile = minTargetTile;
            } else {
                // 双界の護衛は初期位置を追跡
                evalUnit.chaseTargetTile = g_appData.map.getTile(evalUnit.initPosX, evalUnit.initPosY);
            }
        }
        else {
            // 通常の追跡対象計算
            let maxPriorityValue = -100000;
            let chaseTarget = null;
            if (evalUnit.hasWeapon) {
                for (let allyUnit of enemyUnits) {
                    using(new ScopedStopwatch(time => this.writeDebugLogLine(`${allyUnit.getNameWithGroup()}への追跡優先度の計算: ` + time + " ms")), () => {
                        let turnRange = g_appData.map.calculateTurnRange(evalUnit, allyUnit);
                        if (turnRange < 0) {
                            // 攻撃不可
                            return;
                        }

                        this.writeDebugLogLine("■" + evalUnit.getNameWithGroup() + "から" + allyUnit.getNameWithGroup() + "への追跡優先度計算:");

                        // todo: 攻撃対象の陣営の紋章バフは無効にしないといけない。あと周囲の味方の数で発動する系は必ず発動させないといけない
                        // 防御系奥義によるダメージ軽減も無視しないといけない
                        let combatResult = this.calcDamageTemporary(evalUnit, allyUnit, null, true);
                        if (this.vm.isPotentialDamageDetailEnabled) {
                            this.writeDebugLogLine("ダメージ計算ログ --------------------");
                            this.writeDebugLogLine(this.damageCalc.log);
                            this.writeDebugLogLine("------------------------------------");
                        }

                        let potentialDamageDealt = combatResult.atkUnit_normalAttackDamage * combatResult.atkUnit_totalAttackCount;
                        let chacePriorityValue = potentialDamageDealt - 5 * turnRange;
                        let priorityValue =
                            chacePriorityValue * 10 +
                            allyUnit.slotOrder;
                        this.writeDebugLogLine(`- 優先度=${priorityValue}(ターン距離=${turnRange}`
                            + `, 通常攻撃ダメージ=${combatResult.atkUnit_normalAttackDamage}`
                            + `, 攻撃回数=${combatResult.atkUnit_totalAttackCount}`
                            + `, 潜在ダメージ=${potentialDamageDealt}`
                            + `, 追跡優先度=${chacePriorityValue}`
                            + `, slotOrder=${allyUnit.slotOrder})`
                        );
                        if (priorityValue > maxPriorityValue) {
                            maxPriorityValue = priorityValue;
                            chaseTarget = allyUnit;
                            this.writeDebugLogLine("追跡対象を" + chaseTarget.getNameWithGroup() + "に更新");
                        }
                    });
                }
            }

            if (chaseTarget == null) {
                // 敵に追跡対象が見つからない場合は味方を追跡対象にする
                chaseTarget = this.__findAllyChaseTargetUnit(evalUnit, allyUnits);
            }

            if (chaseTarget == null) {
                return;
            }

            evalUnit.chaseTargetTile = this.__findChaseTargetTile(evalUnit, chaseTarget);
            this.writeLogLine(evalUnit.getNameWithGroup() + "の追跡対象は" + chaseTarget.getNameWithGroup());
        }
    }

    simulateMovement(targetUnits, enemyUnits, allyUnits) {
        // コンテキスト初期化
        for (let unit of targetUnits) {
            unit.actionContext.clear();
        }

        for (let unit of enemyUnits) {
            unit.actionContext.clear();
        }

        targetUnits.sort(function (a, b) {
            return a.movementOrder - b.movementOrder;
        });

        this.writeLogLine("移動順:");
        for (let i = 0; i < targetUnits.length; ++i) {
            let unit = targetUnits[i];
            this.writeLogLine((i + 1) + ": " + unit.getNameWithGroup());
        }

        let isActionActivated = false;
        for (let i = 0; i < targetUnits.length; ++i) {
            let unit = targetUnits[i];
            this.writeDebugLogLine(unit.getNameWithGroup() + "の移動計算");
            if (unit.chaseTargetTile == null) {
                this.__enqueueEndActionCommand(unit);
                isActionActivated = true;
                break;
            }

            let chaseTargetTile = unit.chaseTargetTile;
            this.writeDebugLogLine(`追跡対象マス=(${chaseTargetTile.posX},${chaseTargetTile.posY})`);

            let movableTiles = this.__getMovableTiles(unit);
            if (movableTiles.length == 0) {
                this.writeDebugLogLine(unit.getNameWithGroup() + "が移動可能なマスはなし");
                continue;
            }

            let pivotTiles = [];
            let pivotContexts = [];
            if (unit.support == Support.Pivot) {
                this.writeDebugLogLine("回り込みの評価");
                // 回り込みの場合は回り込みで移動できるマスも列挙
                this.__setBestAssistTiles(unit, (targetUnit, tile) => {
                    let pivotResult = this.__findTileAfterPivot(unit, targetUnit, tile);
                    return pivotResult.success;
                });

                // 回り込み後のマスを取得
                for (let info of unit.actionContext.assistableUnitInfos) {
                    for (let tile of info.assistableTiles) {
                        let pivotResult = this.__findTileAfterPivot(unit, info.targetUnit, tile);
                        if (!pivotResult.success) {
                            // 回り込み出来ない
                            continue;
                        }

                        if (!pivotTiles.includes(pivotResult.assistUnitTileAfterAssist)) {
                            pivotTiles.push(pivotResult.assistUnitTileAfterAssist);
                            let context = new Object();
                            context.targetUnit = info.targetUnit;
                            context.tile = tile;
                            context.assistUnitTileAfterAssist = pivotResult.assistUnitTileAfterAssist;
                            pivotContexts.push(context);
                        }
                    }
                }
            }

            let targetTileContexts = this.__createTargetTileContexts(unit, movableTiles, pivotTiles);
            let targetTileContextsWithoutPivot = targetTileContexts;
            if (unit.support == Support.Pivot) {
                // 壁破壊計算では回り込みなしの最適タイルが必要
                targetTileContextsWithoutPivot = this.__createTargetTileContexts(unit, movableTiles, []);
            }

            if (targetTileContexts.length == 0) {
                this.writeDebugLogLine(unit.getNameWithGroup() + "が対象に向かうために移動可能なマスはなし");
                continue;
            }

            this.writeDebugLogLine("候補タイル数=" + targetTileContexts.length);
            let bestTileToMove = unit.placedTile;
            let bestTileToMoveWithoutPivot = unit.placedTile;
            let isPivotRequired = false;
            if (targetTileContexts.length > 0) {
                targetTileContexts.sort(function (a, b) {
                    return b.priorityToMove - a.priorityToMove;
                });

                this.writeDebugLogLine("移動先タイルを選択--------");
                let order = 1;
                for (let context of targetTileContexts) {
                    this.writeDebugLogLine(order + ": " + context.tile.positionToString()
                        + ", priorityToMove=" + context.priorityToMove
                        + ", isDefensiveTile=" + context.isDefensiveTile
                        + ", enemyThreat=" + context.enemyThreat
                        + ", isTeleportationRequired=" + context.isTeleportationRequired
                        + ", isPivotRequired=" + context.isPivotRequired
                        + ", distanceFromDiagonal=" + context.distanceFromDiagonal
                        + ", tileType=" + context.tileType
                        + ", requiredMovementCount=" + context.requiredMovementCount
                        + ", tilePriority=" + context.tilePriority
                    );
                    ++order;
                }

                bestTileToMove = targetTileContexts[0].tile;
                if (targetTileContextsWithoutPivot.length > 0) {
                    bestTileToMoveWithoutPivot = targetTileContextsWithoutPivot[0].tile;
                }
                isPivotRequired = targetTileContexts[0].isPivotRequired;
            }

            // ブロックの破壊の評価
            let bestTileContextToBreakBlock = this.__findBestTileToBreakBlock(unit, bestTileToMoveWithoutPivot, movableTiles);
            if (bestTileContextToBreakBlock != null) {
                // ブロック破壊
                let blockTile = bestTileContextToBreakBlock.tile;
                let moveTile = bestTileContextToBreakBlock.bestTileToBreakBlock;
                this.__enqueueBreakStructureCommand(unit, moveTile, blockTile.obj);
            }
            else if (isPivotRequired) {
                // 回り込み
                let pivotContext = null;
                for (let context of pivotContexts) {
                    if (context.assistUnitTileAfterAssist == bestTileToMove) {
                        pivotContext = context;
                        break;
                    }
                }

                this.__enqueueSupportCommand(unit, pivotContext.tile, pivotContext.targetUnit);
            }
            else if (bestTileToMove == unit.placedTile) {
                this.writeDebugLogLine(unit.getNameWithGroup() + "の最適な移動マスは現在のマスなので移動しない");
                continue;
            }
            else {
                // 移動
                this.__enqueueMoveCommand(unit, bestTileToMove, true);
            }

            isActionActivated = true;
            break;
        }

        return isActionActivated;
    }

    __getCantoActivatedUnit(units) {
        for (let unit of units) {
            if (unit.isCantoActivated()) {
                return unit;
            }
        }
        return null;
    }

    simulateCanto(targetUnits) {
        let targetUnit = this.__getCantoActivatedUnit(targetUnits);
        if (targetUnit == null) {
            this.writeDebugLogLine("再移動が発動しているユニットなし");
            return false;
        }

        this.writeDebugLogLine(`${targetUnit.name}の再移動を評価`);

        // 同時に複数ユニットが再移動可能になるシチュエーションはあり得ないので1人のみ処理
        let movableTiles = this.__getMovableTiles(targetUnit);
        if (movableTiles.length == 0) {
            this.__enqueueMoveCommand(unit, unit.placedTile, true);
            return true;
        }

        let targetTileContexts = [];
        for (let tile of movableTiles) {
            let context = new TilePriorityContext(tile, targetUnit);
            context.calcPriorityToMoveByCanto(targetUnit, g_appData.map.width, g_appData.map.height);
            targetTileContexts.push(context);
        }

        targetTileContexts.sort(function (a, b) {
            return b.priorityToMove - a.priorityToMove;
        });

        this.writeDebugLogLine("移動先タイルを選択--------");
        let order = 1;
        for (let context of targetTileContexts) {
            this.writeDebugLogLine(order + ": " + context.tile.positionToString()
                + ", priorityToMove=" + context.priorityToMove
                + ", enemyThreat=" + context.enemyThreat
                + ", restMovementPower=" + context.restMovementPower
                + ", isDefensiveTile=" + context.isDefensiveTile
                + ", distanceFromDiagonal=" + context.distanceFromDiagonal
                + ", isTeleportationRequired=" + context.isTeleportationRequired
                + ", requiredMovementCount=" + context.requiredMovementCount
                + ", tilePriority=" + context.tilePriority
            );
            ++order;
        }

        let bestTileToMove = targetTileContexts[0].tile;
        this.__enqueueMoveCommand(targetUnit, bestTileToMove, true);
        return true;
    }

    __createTargetTileContexts(unit, movableTiles, pivotTiles) {
        let chaseTargetTile = unit.chaseTargetTile;
        let ignoresUnits = true;
        let isPathfinderEnabled = false; // 移動先のマスを選ぶときに天駆の道を考慮しない
        let targetTileContexts = [];
        for (let tile of g_appData.map.getNearestMovableTiles(
            unit, chaseTargetTile, pivotTiles, false, movableTiles, ignoresUnits, tileUnit => {
                if (isThief(unit)) {
                    if (tileUnit.passiveS == PassiveS.GoeiNoGuzo && unit.isOnInitPos()) {
                        // シーフは護衛が初期値にいるとき、障害物と扱ってるっぽい挙動を観測
                        return false;
                    }
                }
                return true;
            }, isPathfinderEnabled)
        ) {
            let context = new TilePriorityContext(tile, unit);
            context.isPivotRequired = pivotTiles.includes(context.tile);
            context.calcPriorityToMove(unit, chaseTargetTile, g_appData.map.width, g_appData.map.height);
            targetTileContexts.push(context);
        }
        return targetTileContexts;
    }

    __findChaseTargetTile(unit, chaseTarget) {
        let chaseTargetTile = chaseTarget.placedTile;
        {
            if (!chaseTargetTile.isMovableTileForUnit(unit)
                || chaseTargetTile.calculateUnitMovementCountToThisTile(unit, unit.placedTile) == CanNotReachTile
            ) {
                // たどり着けない場合は攻撃可能なマスを追跡対象のマスにする
                let minDist = CanNotReachTile;
                for (let tile of g_appData.map.enumerateAttackableTiles(unit, chaseTargetTile)) {
                    let dist = tile.calculateUnitMovementCountToThisTile(unit, unit.placedTile);
                    if (dist < minDist) {
                        minDist = dist;
                        chaseTargetTile = tile;
                    }
                    else if (dist == minDist) {
                        if (tile.tilePriority > chaseTargetTile.tilePriority) {
                            chaseTargetTile = tile;
                        }
                    }
                }
            }

            this.writeDebugLogLine("追跡対象マス=" + chaseTargetTile.positionToString());
        }
        return chaseTargetTile;
    }

    __getMovableTiles(unit) {
        let movableTiles = [];
        {
            for (let tile of g_appData.map.enumerateMovableTiles(unit, false, false, false)) {
                movableTiles.push(tile);
            }
        }
        return movableTiles;
    }

    __convertStructurePerTurnStatusToSerial(structure) {
        return StructureCookiePrefix + structure.id + NameValueDelimiter + structure.perTurnStatusToString();
    }

    __convertUnitPerTurnStatusToSerial(unit) {
        return UnitCookiePrefix + unit.id + NameValueDelimiter + unit.perTurnStatusToString();
    }

    __convertUnitPerTurnStatusToSerialForAllUnitsAndTrapsOnMapAndGlobal() {
        let result = this.__convertPerTurnStatusToSerialForAllUnitsAndTrapsOnMap();
        result += this.__convertPerTurnStatusToSerialForGlobal();
        return result;
    }

    __convertPerTurnStatusToSerialForGlobal() {
        return "map" + NameValueDelimiter + g_appData.perTurnStatusToString() + ElemDelimiter;
    }

    __convertPerTurnStatusToSerialForAllUnitsAndTrapsOnMap() {
        let result = "";
        for (let unit of this.enumerateAllUnits()) {
            result += this.__convertUnitPerTurnStatusToSerial(unit) + ElemDelimiter;
        }
        for (let st of this.__enumerateDefenseStructuresOnMap()) {
            if (st instanceof TrapBase) {
                result += this.__convertStructurePerTurnStatusToSerial(st) + ElemDelimiter;
            }
        }
        return result;
    }

    __convertUnitPerTurnStatusToSerialForSpecifiedGroupUnitsOnMap(groupId) {
        let result = "";
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (!unit.isOnMap) {
                continue;
            }
            result += this.__convertUnitPerTurnStatusToSerial(unit) + ElemDelimiter;
        }
        return result;
    }

    __enqueueEndAllUnitActionCommand(groupId) {
        let serial = null;
        if (this.vm.isCommandUndoable) {
            serial = this.__convertUnitPerTurnStatusToSerialForSpecifiedGroupUnitsOnMap(groupId);
        }
        let self = this;
        this.__enqueueCommand("ユニット全員の行動終了", function () {
            if (self.isCommandLogEnabled) {
                self.writeLogLine("行動可能なユニットはいないので現在のフェーズ終了");
            }
            self.__endAllUnitAction(groupId);
            updateAllUi();
        }, serial);
    }

    __enqueueEndActionCommand(unit) {
        let self = this;
        let serial = null;
        if (this.vm.isCommandUndoable) {
            serial = this.__convertUnitPerTurnStatusToSerial(unit);
        }
        this.__enqueueCommand(`行動終了(${unit.getNameWithGroup()})`, function () {
            if (self.isCommandLogEnabled) {
                g_app.writeLogLine(unit.getNameWithGroup() + "は行動終了");
            }

            g_app.endUnitAction(unit);
            unit.deactivateCanto();
        }, serial);
    }

    __createDuoSkillCommand(unit) {
        let self = this;
        let commandType = CommandType.Normal;
        let serial = null;
        if (this.vm.isCommandUndoable) {
            serial = this.__convertPerTurnStatusToSerialForAllUnitsAndTrapsOnMap();
        }
        return this.__createCommand(`${unit.id}-d`, `比翼、双界スキル(${unit.getNameWithGroup()})`, function () {
            if (self.isCommandLogEnabled) {
                g_app.writeLogLine(unit.getNameWithGroup() + "は比翼、双界スキルを実行");
            }
            g_app.__activateDuoOrHarmonizedSkill(unit);
        }, serial, commandType);
    }

    __enqueueDuoSkillCommand(unit) {
        let command = this.__createDuoSkillCommand(unit);
        this.__enqueueCommandImpl(command);
    }

    __enqueueSupportCommand(unit, tile, assistTargetUnit) {
        let commands = this.__createSupportCommands(unit, tile, assistTargetUnit);
        this.__enqueueCommandsImpl(commands);
    }

    __createSupportCommands(unit, tile, assistTargetUnit) {
        let commands = [];
        if (unit.support < 0) {
            return commands;
        }

        let commandType = CommandType.Normal;
        commands.push(this.__createMoveCommand(unit, tile, false, CommandType.Begin));
        commandType = CommandType.End;

        commands.push(this.__createSupportCommand(unit, tile, assistTargetUnit, commandType));
        return commands;
    }

    __createSupportCommand(unit, tile, assistTargetUnit, commandType = CommandType.Normal) {
        let serial = null;
        if (this.vm.isCommandUndoable) {
            serial = this.__convertPerTurnStatusToSerialForAllUnitsAndTrapsOnMap();
        }
        let self = this;
        let skillName = unit.supportInfo != null ? unit.supportInfo.name : "補助";
        let command = this.__createCommand(`${unit.id}-s-${assistTargetUnit.id}-${tile.id}`, `${skillName}(${unit.getNameWithGroup()}→${assistTargetUnit.getNameWithGroup()}[${tile.posX},${tile.posY}])`, function () {
            if (unit.isActionDone) {
                // 移動時に罠を踏んで動けなくなるケース
                return;
            }

            switch (unit.supportInfo.assistType) {
                case AssistType.Refresh:
                    self.audioManager.playSoundEffectImmediately(SoundEffectId.Refresh);
                    break;
                case AssistType.Move:
                    self.audioManager.playSoundEffectImmediately(SoundEffectId.MovementAssist);
                    break;
                case AssistType.Heal:
                case AssistType.Restore:
                case AssistType.DonorHeal:
                    self.audioManager.playSoundEffectImmediately(SoundEffectId.Heal);
                    break;
                case AssistType.Rally:
                    self.audioManager.playSoundEffectImmediately(SoundEffectId.Rally);
                    break;
            }
            if (self.isCommandLogEnabled) {
                self.writeLogLine(
                    unit.getNameWithGroup() + "は"
                    + assistTargetUnit.getNameWithGroup()
                    + "に" + skillName + "を実行");
            }
            self.applySupportSkill(unit, assistTargetUnit);
        }, serial, commandType);
        return command;
    }

    __createBreakStructureCommands(unit, moveTile, obj) {
        let commands = [];
        let commandType = CommandType.Normal;
        commands.push(this.__createMoveCommand(unit, moveTile, false, CommandType.Begin));
        commandType = CommandType.End;

        commands.push(this.__createBreakStructureCommand(unit, moveTile, obj, commandType));
        return commands;
    }

    __createBreakStructureCommand(unit, moveTile, obj, commandType = CommandType.Normal) {
        let serial = null;
        if (this.vm.isCommandUndoable) {
            serial = this.__convertUnitPerTurnStatusToSerial(unit) + ElemDelimiter +
                this.__convertStructurePerTurnStatusToSerial(obj);
        }
        let self = this;
        let command = this.__createCommand(`${unit.id}-b-${obj.id}-${moveTile.id}`,
            obj.name + `破壊(${unit.getNameWithGroup()} [${moveTile.posX},${moveTile.posY}])`,
            function () {
                if (unit.isActionDone) {
                    // 移動時にトラップ発動した場合は行動終了している
                    return;
                }

                self.audioManager.playSoundEffectImmediately(SoundEffectId.Break);
                if (self.isCommandLogEnabled) {
                    g_app.writeLogLine(unit.getNameWithGroup() + "はオブジェクトを破壊");
                }
                if (obj instanceof BreakableWall) {
                    obj.break();
                    if (obj.isBroken) {
                        moveStructureToTrashBox(obj);
                    }
                }
                else {
                    moveStructureToTrashBox(obj);
                }

                self.__endUnitActionOrActivateCanto(unit);
            }, serial, commandType);
        return command;
    }

    __activateCantoIfPossible(unit) {
        if (this.__canActivateCanto(unit)) {
            this.writeDebugLogLine("再移動の発動");
            let count = this.__calcMoveCountForCanto(unit);
            unit.activateCantoIfPossible(count);
        }
    }

    __canActivateCanto(unit) {
        if (!unit.canActivateCanto()) {
            return false;
        }

        if (this.__calcMoveCountForCanto(unit) == 0) {
            return false;
        }

        // スキル毎の追加条件
        for (let skillId of unit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Lyngheior:
                    if (this.vm.currentTurn <= 4) {
                        return true;
                    }
                    break;
                case Weapon.DolphinDiveAxe:
                case Weapon.Ladyblade:
                case Weapon.FlowerLance:
                case PassiveB.AtkDefNearTrace3:
                case PassiveB.SpdDefNearTrace3:
                case PassiveB.AtkDefFarTrace3:
                case PassiveB.AtkResFarTrace3:
                case PassiveB.SpdResFarTrace3:
                case PassiveB.MurderousLion:
                    return true;
            }
        }

        return false;
    }

    __calcMoveCountForCanto(unit) {
        let moveCountForCanto = 0;
        for (let skillId of unit.enumerateSkills()) {
            // 同系統効果複数時、最大値適用
            switch (skillId) {
                case Weapon.DolphinDiveAxe:
                case Weapon.Ladyblade:
                case Weapon.FlowerLance:
                    moveCountForCanto = Math.max(moveCountForCanto, 2);
                    break;
                case Weapon.Lyngheior:
                    moveCountForCanto = Math.max(moveCountForCanto, 3);
                    break;
                case PassiveB.MurderousLion:
                case PassiveB.AtkDefNearTrace3:
                case PassiveB.SpdDefNearTrace3:
                    moveCountForCanto = Math.max(moveCountForCanto, unit.restMoveCount + 1);
                    break;
                case PassiveB.AtkDefFarTrace3:
                case PassiveB.AtkResFarTrace3:
                case PassiveB.SpdResFarTrace3:
                    moveCountForCanto = Math.max(moveCountForCanto, unit.restMoveCount);
                    break;
            }
        }
        return moveCountForCanto;
    }

    __enqueueBreakStructureCommand(unit, moveTile, obj) {
        let commands = this.__createBreakStructureCommands(unit, moveTile, obj);
        this.__enqueueCommandsImpl(commands);
    }

    __createMoveCommand(unit, tileToMove, endAction = false, commandType = CommandType.Normal, enableSoundEffect = false) {
        // 移動
        let self = this;
        let metaData = new Object();
        metaData.tileToMove = tileToMove;
        metaData.unit = unit;
        let serial = null;
        if (this.vm.isCommandUndoable) {
            serial = this.__convertUnitPerTurnStatusToSerialForAllUnitsAndTrapsOnMapAndGlobal();
        }
        let command = this.__createCommand(
            `${unit.id}-m-${tileToMove.id}`,
            `移動(${unit.getNameWithGroup()} [${tileToMove.posX},${tileToMove.posY}])`,
            function () {
                if (enableSoundEffect) {
                    self.audioManager.playSoundEffectImmediately(SoundEffectId.Move);
                }

                // 再移動で参照する残り移動量を更新
                if (!unit.isCantoActivated()) {
                    let moveDist = tileToMove.calculateUnitMovementCountToThisTile(
                        unit,
                        unit.placedTile,
                        unit.moveCount,
                        false);

                    // ワープは0扱い
                    let isWarp = moveDist == CanNotReachTile;
                    unit.restMoveCount = isWarp ? 0 : unit.moveCount - moveDist;
                }

                if (unit.placedTile != tileToMove) {
                    if (self.vm.gameMode == GameMode.ResonantBattles
                        && unit.groupId == UnitGroupType.Enemy && isThief(unit) && tileToMove.posY == 0
                    ) {
                        // 双界のシーフが出口に辿り着いた
                        if (self.isCommandLogEnabled) {
                            self.writeLogLine(unit.getNameWithGroup() + "は出口に到着");
                        }
                        moveUnitToTrashBox(unit);
                    }
                    else {
                        if (self.isCommandLogEnabled) {
                            self.writeLogLine(unit.getNameWithGroup() + "は" + tileToMove.positionToString() + "に移動");
                        }
                        moveUnit(unit, tileToMove, unit.groupId == UnitGroupType.Ally);
                    }

                    self.updateSpurForSpecifiedGroupUnits(unit.groupId);
                }

                if (!unit.isActionDone && endAction) {
                    self.endUnitAction(unit);
                    unit.deactivateCanto();
                }
                self.__updateDistanceFromClosestEnemy(unit);
            },
            serial,
            commandType,
            metaData
        );
        return command;
    }

    __enqueueMoveCommand(unit, tileToMove, endAction = false, commandType = CommandType.Normal, enableSoundEffect = false) {
        let command = this.__createMoveCommand(unit, tileToMove, endAction, commandType, enableSoundEffect);
        this.__enqueueCommandImpl(command);
    }

    __createAttackCommand(attackerUnit, targetUnit, tile, commandType = CommandType.Normal) {
        let serial = null;
        if (this.vm.isCommandUndoable) {
            serial = this.__convertUnitPerTurnStatusToSerialForAllUnitsAndTrapsOnMapAndGlobal();
        }
        let self = this;
        let command = this.__createCommand(
            `${attackerUnit.id}-a-${targetUnit.id}-${tile.id}`,
            `攻撃(${attackerUnit.getNameWithGroup()}→${targetUnit.getNameWithGroup()}[${tile.posX},${tile.posY}])`, function () {
                if (attackerUnit.isActionDone) {
                    // 移動時にトラップ発動した場合は行動終了している
                    return;
                }

                if (attackerUnit.weaponInfo.attackCount == 2) {
                    self.audioManager.playSoundEffectImmediately(SoundEffectId.DoubleAttack);
                }
                else {
                    self.audioManager.playSoundEffectImmediately(SoundEffectId.Attack);
                }
                self.updateDamageCalculation(attackerUnit, targetUnit, tile);
            }, serial, commandType);
        return command;
    }

    __createAttackCommands(attackerUnit, targetUnit, tile) {
        let commands = [];
        let commandType = CommandType.Normal;
        commands.push(this.__createMoveCommand(attackerUnit, tile, false, CommandType.Begin));
        commandType = CommandType.End;

        commands.push(this.__createAttackCommand(attackerUnit, targetUnit, tile, commandType));
        return commands;
    }

    __enqueueAttackCommand(attackerUnit, targetUnit, tile) {
        let commands = this.__createAttackCommands(attackerUnit, targetUnit, tile);
        this.__enqueueCommandsImpl(commands);
    }

    __createCommand(id, label, func, serializedDataForUndo = null, commandType = CommandType.Normal, metaData = null) {
        let serializedTurn = null;
        let self = this;
        if (this.vm.isCommandUndoable) {
            if (serializedDataForUndo != null) {
                serializedTurn = serializedDataForUndo;
            }
            else {
                serializedTurn = exportPerTurnSettingAsString();
            }
        }
        let command = new Command(
            id,
            label,
            function (input) {
                if (self.isCommandLogEnabled) {
                    self.writeSimpleLogLine("「" + input[0] + "」を実行");
                }
                input[1]();
            },
            function (input) {
                if (input[1] != null) {
                    if (self.isCommandLogEnabled) {
                        self.writeSimpleLogLine("「" + input[0] + "」を元に戻す");
                    }
                    importPerTurnSetting(input[1], false);
                }
            },
            [label, func],
            [label, serializedTurn],
            commandType
        );
        command.metaData = metaData;
        return command;
    }

    __enqueueCommand(label, func, serializedDataForUndo = null, commandType = CommandType.Normal, metaData = null) {
        let command = this.__createCommand("", label, func, serializedDataForUndo, commandType, metaData);
        this.__enqueueCommandImpl(command);
    }

    __enqueueCommandImpl(command) {
        this.commandQueuePerAction.enqueue(command);
        if (this.isTurnWideCommandQueueEnabled) {
            this.commandQueue.enqueue(command);
        }
    }
    __enqueueCommandsImpl(commands) {
        for (let command of commands) {
            this.commandQueuePerAction.enqueue(command);
            if (this.isTurnWideCommandQueueEnabled) {
                this.commandQueue.enqueue(command);
            }
        }
    }

    executePerActionCommand() {
        this.__executeAllCommands(this.commandQueuePerAction, 0);
    }
    undoCommand() {
        this.commandQueuePerAction.undo();
        updateAllUi();
    }
    redoCommand() {
        this.commandQueuePerAction.redo();
        updateAllUi();
    }
    redoAllCommand() {
        let self = this;
        const intervalMilliseconds = 300;
        startProgressiveProcess(
            this.commandQueuePerAction.redoStack.length,
            function () {
                self.commandQueuePerAction.redo();
            },
            function () {
                updateAllUi();
            },
            null,
            intervalMilliseconds,
            function () {
                return !self.commandQueuePerAction.isRedoable;
            }
        );
    }

    __executeAllCommands(queue, intervalMilliseconds) {
        if (intervalMilliseconds == 0) {
            while (queue.length > 0) {
                queue.execute();
            }
        }
        else {
            startProgressiveProcess(queue.length,
                function () {
                    queue.execute();
                },
                function () {
                    updateAllUi();
                },
                null,
                intervalMilliseconds,
                function () {
                    return queue.length == 0;
                }
            );
        }
    }

    __getBreakableStructureTiles(groupId) {
        let blockTiles = [];
        for (let block of this.map.enumerateBreakableStructures(groupId)) {
            if (block.placedTile != null) {
                blockTiles.push(block.placedTile);
            }
        }
        return blockTiles;
    }

    __findBestTileToBreakBlock(unit, bestTileToMove, movabableTiles) {
        if (!unit.hasWeapon) {
            return null;
        }

        this.writeDebugLogLine(unit.getNameWithGroup() + "が破壊可能なブロックを評価..");
        let blockTiles = this.__getBreakableStructureTiles(unit.groupId);
        if (blockTiles.length == 0) {
            this.writeDebugLogLine("破壊可能なブロックがマップ上に存在しない");
            return null;
        }

        let chaseTargetTile = unit.chaseTargetTile;
        let distOfBestTileToTarget = chaseTargetTile.calculateUnitMovementCountToThisTile(unit, bestTileToMove);
        let blockTileContexts = [];
        let minDist = CanNotReachTile;
        for (let blockTile of blockTiles) {
            // ブロックから追跡対象への距離が未定義、または最適なタイルから追跡対象への距離より近い場合のみ候補
            let distOfBlockToTarget = chaseTargetTile.calculateUnitMovementCountToThisTile(unit, blockTile);
            this.writeDebugLogLine(`${blockTile.positionToString()} to ${chaseTargetTile.positionToString()}: distOfBlockToTarget=${distOfBlockToTarget}`);
            if (distOfBlockToTarget == CanNotReachTile || distOfBlockToTarget < distOfBestTileToTarget) {
                let context = new TilePriorityContext(blockTile, unit);
                for (let tile of g_appData.map.enumerateAttackableTiles(unit, blockTile)) {
                    if (!movabableTiles.includes(tile)) {
                        continue;
                    }

                    let attackableTileContext = new TilePriorityContext(tile, unit);
                    context.attackableTileContexts.push(attackableTileContext);
                }

                if (context.attackableTileContexts.length > 0) {
                    // 最適なタイルから最も近いブロックが候補
                    let distOfBestTileToBlock = bestTileToMove.calculateUnitMovementCountToThisTile(unit, blockTile);
                    if (distOfBestTileToBlock <= minDist) {
                        if (distOfBestTileToBlock < minDist) {
                            blockTileContexts = [context];
                            minDist = distOfBestTileToBlock;
                        }
                        else if (distOfBestTileToBlock == minDist) {
                            blockTileContexts.push(context);
                        }
                    }
                }
            }
        }

        if (blockTileContexts.length == 0) {
            this.writeDebugLogLine(unit.getNameWithGroup() + "が移動可能なタイルはなし");
            return null;
        }

        for (let context of blockTileContexts) {
            for (let attackableTileContext of context.attackableTileContexts) {
                attackableTileContext.calcPriorityToBreakBlock();
            }

            context.attackableTileContexts.sort(function (a, b) {
                return b.priorityToBreakBlock - a.priorityToBreakBlock;
            });

            let order = 1;
            for (let attackableTileContext of context.attackableTileContexts) {
                this.writeDebugLogLine(order + ": " + attackableTileContext.tile.positionToString()
                    + ", priorityToBreakBlock=" + attackableTileContext.priorityToBreakBlock
                    + ", isDefensiveTile=" + attackableTileContext.isDefensiveTile
                    + ", enemyThreat=" + attackableTileContext.enemyThreat
                    + ", isTeleportationRequired=" + attackableTileContext.isTeleportationRequired
                    + ", tileType=" + attackableTileContext.tileType
                    + ", requiredMovementCount=" + attackableTileContext.requiredMovementCount
                    + ", tilePriority=" + attackableTileContext.tilePriority
                );
                ++order;
            }

            context.bestTileToBreakBlock = context.attackableTileContexts[0].tile;

            let defensiveTilePriority = 0;
            if (context.bestTileToBreakBlock.isDefensiveTile) {
                defensiveTilePriority = 1;
            }
            context.priorityOfTargetBlock =
                defensiveTilePriority * 1000
                - context.bestTileToBreakBlock.dangerLevel * 100
                + context.tilePriority
                ;
        }

        blockTileContexts.sort(function (a, b) {
            return b.priorityOfTargetBlock - a.priorityOfTargetBlock;
        });

        let order = 1;
        for (let context of blockTileContexts) {
            this.writeDebugLogLine(order + ": " + context.tile.positionToString()
                + ", priorityOfTargetBlock=" + context.priorityOfTargetBlock
                + ", bestTileToBreakBlock.isDefensiveTile=" + context.bestTileToBreakBlock.isDefensiveTile
                + ", bestTileToBreakBlock.enemyThreat=" + context.bestTileToBreakBlock.dangerLevel
                + ", tilePriority=" + context.tilePriority
            );
            ++order;
        }

        return blockTileContexts[0];
    }

    __getPartnersInSpecifiedRange(targetUnit, spaces) {
        return this.__getUnits(x =>
            targetUnit.groupId == x.groupId
            && x.isOnMap
            && targetUnit.calculateDistanceToUnit(x) <= spaces
            && targetUnit.partnerHeroIndex == x.heroIndex);
    }

    __getUnits(predicatorFunc) {
        let units = [];
        for (let unit of this.enumerateAllUnits()) {
            if (predicatorFunc(unit)) {
                units.push(unit);
            }
        }
        return units;
    }

    __getActionableUnits(unitGroup) {
        let units = [];
        for (let unit of this.enumerateUnitsInSpecifiedGroup(unitGroup)) {
            if (unit.isActionDone || !unit.isOnMap) {
                continue;
            }

            units.push(unit);
        }
        return units;
    }

    __setAttackableUnitInfoAndBestTileToAttack(unit, enemyUnits, acceptTileFunc = null, ignoreTileFunc = null) {
        // 攻撃可能なユニットを列挙
        this.__setAttackableUnitInfo(unit, enemyUnits, acceptTileFunc);

        this.__setBestTileToAttack(unit, ignoreTileFunc);
    }

    __setBestTileToAttack(unit, ignoreTileFunc = null) {
        if (unit.actionContext.attackableUnitInfos.length == 0) {
            return;
        }

        this.writeLogLine(unit.getNameWithGroup() + "が攻撃可能なユニット");
        for (let attackTargetInfo of unit.actionContext.attackableUnitInfos) {
            this.writeLogLine("&nbsp;&nbsp;&nbsp;&nbsp;" + attackTargetInfo.toString());
            attackTargetInfo.bestTileToAttack = this.__evaluateBestTileToAttack(unit, attackTargetInfo, ignoreTileFunc);
            if (attackTargetInfo.bestTileToAttack == null) {
                this.writeLogLine("最適なタイル: なし");
            }
            else {
                this.writeLogLine("最適なタイル: " + attackTargetInfo.bestTileToAttack.positionToString());
            }
        }

        // 最適なタイルが存在しない対象を除外
        unit.actionContext.removeAttackableUnitInfosWhereBestTileIsEmpty();
    }

    simulateAttack(enemyUnits, allyUnits) {
        // コンテキスト初期化
        for (let unit of enemyUnits) {
            unit.actionContext.clear();
        }

        for (let unit of allyUnits) {
            unit.actionContext.clear();
        }

        // 攻撃リスト作成
        let attackTargetInfos = [];
        for (let unit of enemyUnits) {
            if (unit.placedTile == null) {
                continue;
            }
            if (unit.isWeaponEquipped == false) {
                continue;
            }

            // 攻撃可能なユニットを列挙
            this.writeLogLine(unit.getNameWithGroup() + "の攻撃可能なユニットを列挙--------");
            this.__setAttackableUnitInfoAndBestTileToAttack(unit, allyUnits);
            if (unit.actionContext.attackableUnitInfos.length == 0) {
                continue;
            }

            if (unit.groupId == UnitGroupType.Enemy) {
                if (!g_appData.examinesEnemyActionTriggered(unit)) {
                    this.vm.isEnemyActionTriggered = true;
                    unit.isEnemyActionTriggered = true;
                }
            }

            // 攻撃可能なユニットからベストな攻撃相手を探す
            this.writeLogLine(unit.getNameWithGroup() + "の最適な攻撃対象を選択--------");
            let bestAttackableUnitInfo = this.__evaluateBestAttackTarget(unit, unit.actionContext.attackableUnitInfos);
            unit.actionContext.bestTargetToAttack = bestAttackableUnitInfo.targetUnit;
            this.writeLogLine(unit.actionContext.bestTargetToAttack.getNameWithGroup() + "が" + unit.getNameWithGroup() + "の攻撃対象");

            let target = unit.actionContext.bestTargetToAttack;
            let targetInfo = null;
            for (let info of attackTargetInfos) {
                if (info.target == target) {
                    targetInfo = info;
                    break;
                }
            }
            if (targetInfo == null) {
                targetInfo = {
                    target: unit.actionContext.bestTargetToAttack,
                    attackers: [],
                    attackableUnitInfos: [],
                };
                attackTargetInfos.push(targetInfo);
            }
            targetInfo.attackers.push(unit);
            targetInfo.attackableUnitInfos[unit] = bestAttackableUnitInfo;
        }

        // 最も優先度の高い攻撃者を決める
        for (let targetInfo of attackTargetInfos) {
            let target = targetInfo.target;
            this.writeLogLine(target.getNameWithGroup() + "への攻撃者を選択------------");
            let bestAttacker = this.__evaluateBestAttacker(target, targetInfo.attackers, targetInfo.attackableUnitInfos);
            this.writeLogLine("最適な攻撃者: " + bestAttacker.getNameWithGroup());
            target.actionContext.bestAttacker = bestAttacker;
        }

        // 攻撃順を決める
        attackTargetInfos.sort(function (a, b) {
            return b.target.actionContext.bestAttacker.actionContext.attackEvalContexts[b.target].attackPriority
                - a.target.actionContext.bestAttacker.actionContext.attackEvalContexts[a.target].attackPriority;
        });

        let slotOrderDependentIndices = this.__getSlotOrderDependentIndices(attackTargetInfos,
            x => x.target.actionContext.bestAttacker.actionContext.attackEvalContexts[x.target].attackPriority);

        let isActionActivated = false;
        for (let i = 0; i < attackTargetInfos.length; ++i) {
            let targetInfo = attackTargetInfos[i];
            let target = targetInfo.target;
            let bestAttacker = target.actionContext.bestAttacker;
            let attackableUnitInfo = bestAttacker.actionContext.findAttackableUnitInfo(target);
            let tile = attackableUnitInfo.bestTileToAttack;

            if (slotOrderDependentIndices.includes(i)) {
                this.writeWarningLine(`${bestAttacker.getNameWithGroup()}の攻撃順はスロット順で変わる可能性があります。`);
            }

            this.__enqueueAttackCommand(bestAttacker, target, tile);
            isActionActivated = true;
            break;
        }

        return isActionActivated;
    }

    __getAllyCount() {
        let count = 0;
        for (let unit of this.enumerateUnitsInSpecifiedGroup(UnitGroupType.Ally)) {
            ++count;
        }
        return count;
    }

    __evaluateBestTileToAttack(
        attacker, targetInfo, ignoreTileFunc = null
    ) {
        if (targetInfo.tiles.length == 0) {
            return null;
        }

        let tilePriorities = [];
        for (let tile of targetInfo.tiles) {
            if (ignoreTileFunc != null && ignoreTileFunc(tile)) {
                continue;
            }

            let target = targetInfo.targetUnit;
            this.__updateCombatResultOfAttackableTargetInfo(targetInfo, attacker, tile);

            let context = new TilePriorityContext(tile, attacker);
            context.combatResult = targetInfo.combatResults[tile.id];
            context.damageRatio = targetInfo.damageRatios[tile.id];
            context.calcPriorityToAttack();

            tilePriorities.push(context);
        }

        if (tilePriorities.length == 0) {
            return null;
        }
        if (tilePriorities.length == 1) {
            return tilePriorities[0].tile;
        }

        tilePriorities.sort(function (a, b) {
            return b.priorityToAttack - a.priorityToAttack;
        });

        this.writeDebugLogLine("最適なタイルを選択--------");
        let order = 1;
        for (let context of tilePriorities) {
            let tile = context.tile;
            this.writeDebugLogLine(order + ": " + tile.positionToString()
                + ", priority=" + context.priorityToAttack
                + "(combatResult=" + combatResultToString(context.combatResult)
                + ", damageRatio=" + context.damageRatio
                + ", isDefensiveTile=" + context.isDefensiveTile
                + ", enemyThreat=" + context.enemyThreat
                + ", isTeleportationRequired=" + context.isTeleportationRequired
                + ", tileType=" + context.tileType
                + ", requiredMovementCount=" + context.requiredMovementCount
                + ", tilePriority=" + context.tilePriority + ")"
            );
            ++order;
        }

        return tilePriorities[0].tile;
    }

    __updateCombatResultOfAttackableTargetInfo(targetInfo, attacker, tile) {
        if (!(tile.id in targetInfo.combatResults)) {
            // まだ計算されてなければ計算
            this.writeDebugLogLine(`calc combat result of tile ${tile.positionToString()}`);
            let target = targetInfo.targetUnit;
            let result = this.calcDamageTemporary(attacker, target, tile);
            let combatResult = this.__getCombatResult(attacker, target);
            let targetDamage = (target.hp - target.restHp);
            let attackerDamage = (attacker.hp - attacker.restHp);
            let damageRatio = targetDamage * 3 - attackerDamage;
            targetInfo.combatResults[tile.id] = combatResult;
            targetInfo.damageRatios[tile.id] = damageRatio;
            targetInfo.combatResultDetails[tile.id] = result;
        }
    }

    __getCombatResult(attacker, target) {
        if (target.restHp == 0) {
            return CombatResult.Win;
        } else if (attacker.restHp == 0) {
            return CombatResult.Loss;
        } else {
            return CombatResult.Draw;
        }
    }

    __evaluateBestAttackTarget(attacker, targetInfos) {
        // 戦闘結果を計算
        for (let targetInfo of targetInfos) {
            let target = targetInfo.targetUnit;
            if (attacker.actionContext.attackEvalContexts[target]) {
                continue;
            }
            this.__updateAttackEvalContext(attacker, targetInfo, targetInfo.bestTileToAttack);
        }

        targetInfos.sort(function (a, b) {
            return attacker.actionContext.attackEvalContexts[b.targetUnit].attackTargetPriorty - attacker.actionContext.attackEvalContexts[a.targetUnit].attackTargetPriorty;
        });

        let slotOrderDependentIndices = this.__getSlotOrderDependentIndices(targetInfos,
            x => attacker.actionContext.attackEvalContexts[x.targetUnit].attackTargetPriorty);

        this.writeDebugLogLine("最適な攻撃対象を選択--------");
        let order = 1;
        for (let targetInfo of targetInfos) {
            let target = targetInfo.targetUnit;
            let context = attacker.actionContext.attackEvalContexts[target];
            this.writeDebugLogLine(order + ": " + target.getNameWithGroup()
                + ", attackTargetPriorty=" + context.attackTargetPriorty
                + ", isDebufferTier1=" + context.isDebufferTier1
                + ", isDebufferTier2=" + context.isDebufferTier2
                + ", combatResult=" + combatResultToString(context.combatResult)
                + ", damageRatio=" + context.damageRatio
                + ", isSpecialChargeIncreased=" + context.isSpecialChargeIncreased
                + ", slotOrder=" + target.slotOrder);
            ++order;
        }

        if (slotOrderDependentIndices.includes(0)) {
            this.writeWarningLine(`${attacker.getNameWithGroup()}の最適な攻撃対象はスロット順で変わる可能性があります。`);
        }

        return targetInfos[0];
    }

    __evaluateBestAttacker(target, attackers, attackableUnitInfos) {
        if (attackers.length == 1) {
            return attackers[0];
        }

        // 戦闘結果を計算
        for (let attacker of attackers) {
            if (attacker.actionContext.attackEvalContexts[target]) {
                continue;
            }

            let info = attacker.actionContext.findAttackableUnitInfo(target);
            this.__updateAttackEvalContext(attacker, attackableUnitInfos[attacker], info.bestTileToAttack);
        }

        attackers.sort(function (a, b) {
            return b.actionContext.attackEvalContexts[target].attackPriority - a.actionContext.attackEvalContexts[target].attackPriority;
        });

        let slotOrderDependentIndices = this.__getSlotOrderDependentIndices(attackers,
            x => x.actionContext.attackEvalContexts[target].attackPriority);

        this.writeDebugLogLine("最適な攻撃者を選択--------");
        let order = 1;
        for (let attacker of attackers) {
            let context = attacker.actionContext.attackEvalContexts[target];
            this.writeDebugLogLine(order + ": " + attacker.getNameWithGroup()
                + ", attackTargetPriorty=" + context.attackTargetPriorty
                + ", combatResult=" + combatResultToString(context.combatResult)
                + ", isDebufferTier1=" + context.isDebufferTier1
                + ", isDebufferTier2=" + context.isDebufferTier2
                + ", isAfflictor=" + context.isAfflictor
                + ", damageRatio=" + context.damageRatio
                + ", movementRange=" + context.movementRange
                + ", isSpecialChargeIncreased=" + context.isSpecialChargeIncreased
                + ", slotOrder=" + attacker.slotOrder);
            ++order;
        }

        if (slotOrderDependentIndices.includes(0)) {
            this.writeWarningLine(`${target.getNameWithGroup()}への最適な攻撃者${attackers[0].getNameWithGroup()}はスロット順で変わる可能性があります。`);
        }

        return attackers[0];
    }

    __updateAttackEvalContext(attacker, attackableUnitInfo, tileToAttack) {
        if (tileToAttack == null) {
            return;
        }

        let target = attackableUnitInfo.targetUnit;
        this.__updateCombatResultOfAttackableTargetInfo(attackableUnitInfo, attacker, tileToAttack);

        let result = attackableUnitInfo.combatResultDetails[tileToAttack.id];
        this.writeDebugLogLine(this.damageCalc.log);

        let attackEvalContext = new AttackEvaluationContext();
        attackEvalContext.combatResult = attackableUnitInfo.combatResults[tileToAttack.id];
        attackEvalContext.damageRatio = attackableUnitInfo.damageRatios[tileToAttack.id];
        this.writeDebugLogLine(attacker.getNameWithGroup() + "が" + target.getNameWithGroup()
            + "に攻撃時のダメージ率" + attackEvalContext.damageRatio
        );
        attackEvalContext.isSpecialChargeIncreased = target.battleContext.isSpecialActivated;

        let couldAttackerAttack = result.atkUnit_actualTotalAttackCount > 0;
        attackEvalContext.isDebufferTier1 = couldAttackerAttack && isDebufferTier1(attacker, target) && this.__canDebuff2PointsOfDefOrRes(attacker, target);
        attackEvalContext.isDebufferTier2 = couldAttackerAttack && isDebufferTier2(attacker, target) && this.__canDebuff2PointsOfDefOrRes(attacker, target);
        attackEvalContext.isAfflictor = couldAttackerAttack && isAfflictor(attacker, attackEvalContext.combatResult == CombatResult.Loss);


        attackEvalContext.calcAttackPriority(attacker);
        attackEvalContext.calcAttackTargetPriority(target);

        attacker.actionContext.attackEvalContexts[target] = attackEvalContext;
    }

    __createAssistableUnitInfos(assistUnit, isAssistableUnitFunc, acceptTileFunc = null) {
        for (let unitAndTile of assistUnit.enumerateActuallyAssistableUnitAndTiles()) {
            let unit = unitAndTile[0];
            let tile = unitAndTile[1];
            if (acceptTileFunc != null && !acceptTileFunc(tile)) {
                continue;
            }
            // this.writeDebugLogLine(tile.positionToString() + "から補助可能な敵がいるか評価");

            if (!isAssistableUnitFunc(unit, tile)) {
                // this.writeDebugLogLine(tile.positionToString() + "から" + unit.getNameWithGroup() + "に補助不可");
                continue;
            }

            // this.writeDebugLogLine(tile.positionToString() + "から" + unit.getNameWithGroup() + "に補助可能");
            let info = assistUnit.actionContext.findAssistableUnitInfo(unit);
            if (info == null) {
                info = new AssistableUnitInfo(unit);
                assistUnit.actionContext.assistableUnitInfos.push(info);
            }
            info.assistableTiles.push(tile);
        }
    }

    __setBestAssistTiles(assistUnit, isAssistableUnitFunc, acceptTileFunc = null) {
        this.__createAssistableUnitInfos(assistUnit, isAssistableUnitFunc, acceptTileFunc);
        if (assistUnit.actionContext.assistableUnitInfos.length == 0) {
            return;
        }

        // 最適なタイルを選択
        this.writeDebugLogLine("最適なタイルを選択");
        for (let info of assistUnit.actionContext.assistableUnitInfos) {
            this.__selectBestTileToAssist(assistUnit, info);
        }
    }

    __selectBestTileToAssistFromTiles(tiles, assistUnit) {
        let tileEvalContexts = []
        for (let tile of tiles) {
            let context = new TilePriorityContext(tile, assistUnit);
            context.calcPriorityToAssist(assistUnit);
            tileEvalContexts.push(context);
        }

        if (tileEvalContexts.length == 0) {
            return null;
        }

        tileEvalContexts.sort(function (a, b) {
            return b.priorityToAssist - a.priorityToAssist;
        });

        for (let context of tileEvalContexts) {
            this.writeDebugLogLine(
                context.tile.positionToString() + ": priorityToAssist=" + context.priorityToAssist
                + ", isDefensiveTile=" + context.isDefensiveTile
                + ", enemyThreat=" + context.enemyThreat
                + ", tileType=" + context.tileType
                + ", requiredMovementCount=" + context.requiredMovementCount
                + ", tilePriority=" + context.tilePriority
            );
        }

        return tileEvalContexts[0].tile;
    }

    __selectBestTileToAssist(assistUnit, assistableUnitInfo) {
        assistableUnitInfo.bestTileToAssist = this.__selectBestTileToAssistFromTiles(assistableUnitInfo.assistableTiles, assistUnit);
        assistableUnitInfo.isTeleportationRequired = assistableUnitInfo.bestTileToAssist.examinesIsTeleportationRequiredForThisTile(assistUnit);
        this.writeDebugLogLine(
            assistUnit.getNameWithGroup() + "が" +
            assistableUnitInfo.targetUnit.getNameWithGroup() + "に" +
            assistUnit.supportInfo.name + "を実行するのに最適なマス: (" + assistableUnitInfo.bestTileToAssist.posX + ", " + assistableUnitInfo.bestTileToAssist.posY + ")");
    }

    __isTargetUnitInfoAlreadyAdded(infos, targetUnit) {
        for (let info of infos) {
            if (info.targetUnit == targetUnit) {
                return true;
            }
        }
        return false;
    }

    __setBestTargetAndTiles(assistUnit, isPrecombat, isAssistableUnitFunc, acceptTileFunc = null) {
        switch (assistUnit.support) {
            case Support.RallyUpAtk:
            case Support.RallyUpSpd:
            case Support.RallyUpRes:
            case Support.RallyUpAtkPlus:
            case Support.RallyUpSpdPlus:
            case Support.RallyUpResPlus:
                {
                    this.writeLogLine(assistUnit.supportInfo.name + "の間接的な補助対象を選択");
                    this.__createAssistableUnitInfos(assistUnit, (targetUnit, tile) => true);

                    let intendedTargetCandidateInfos = [];
                    for (let unitInfo of assistUnit.actionContext.assistableUnitInfos) {
                        for (let candidateUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unitInfo.targetUnit, 2, true)) {
                            if (candidateUnit == assistUnit) {
                                continue;
                            }
                            if (this.__isTargetUnitInfoAlreadyAdded(intendedTargetCandidateInfos, candidateUnit)) {
                                continue;
                            }
                            if (!isAssistableUnitFunc(candidateUnit, null)) {
                                continue;
                            }

                            this.writeDebugLogLine(candidateUnit.getNameWithGroup() + "は意図的な補助対象の候補");
                            let info = new AssistableUnitInfo(candidateUnit);
                            intendedTargetCandidateInfos.push(info);
                        }
                    }
                    if (intendedTargetCandidateInfos.length == 0) {
                        return;
                    }

                    let intendedTargetInfo = this.__selectBestAssistTarget(assistUnit, intendedTargetCandidateInfos, isPrecombat);
                    this.writeLogLine(assistUnit.supportInfo.name + "の意図的な補助対象は" + intendedTargetInfo.targetUnit.getNameWithGroup());

                    let eligibleTargets = [];
                    let otherEligibleTargets = [];
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(assistUnit, false)) {
                        if (unit == assistUnit) {
                            continue;
                        }
                        if (!isAssistableUnitFunc(unit, null)) {
                            continue;
                        }
                        eligibleTargets.push(unit);
                        if (unit != intendedTargetInfo.targetUnit) {
                            otherEligibleTargets.push(unit);
                        }
                    }

                    let unitsWithin2SpacesOfIntendedTarget = [];
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(intendedTargetInfo.targetUnit, 2, true)) {
                        if (unit == assistUnit) {
                            continue;
                        }
                        unitsWithin2SpacesOfIntendedTarget.push(unit);
                    }

                    let intendedTargetAndOtherEligibleTargets = [intendedTargetInfo.targetUnit];
                    this.writeDebugLogLine("otherEligibleTargets:");
                    for (let unit of otherEligibleTargets) {
                        intendedTargetAndOtherEligibleTargets.push(unit);
                        this.writeDebugLogLine(" - " + unit.getNameWithGroup());
                    }

                    intendedTargetAndOtherEligibleTargets.sort(function (a, b) {
                        return a.slotOrder - b.slotOrder;
                    });
                    let lowestSlotUnit = intendedTargetAndOtherEligibleTargets[0];
                    let isIntendedTargetLowestSlot = lowestSlotUnit == intendedTargetInfo.targetUnit;

                    for (let targetInfo of assistUnit.actionContext.assistableUnitInfos) {
                        if (!unitsWithin2SpacesOfIntendedTarget.includes(targetInfo.targetUnit)) {
                            targetInfo.rallyUpTargetPriority = -1000000;
                            continue;
                        }

                        this.writeDebugLogLine(targetInfo.targetUnit.getNameWithGroup() + "の大応援優先度評価..");
                        let numOfOtherEligibleTargetsBuffed = this.__countAlliesWithinSpecifiedSpaces(
                            targetInfo.targetUnit, 2, x => otherEligibleTargets.includes(x));

                        let lowestSlotIntendedTargetPriority = 0;
                        targetInfo.isIntendedAndLowestSlot = targetInfo.targetUnit == intendedTargetInfo.targetUnit && !isIntendedTargetLowestSlot;
                        if (targetInfo.isIntendedAndLowestSlot) {
                            lowestSlotIntendedTargetPriority = 1;
                        }

                        targetInfo.numOfOtherEligibleTargetsBuffed = numOfOtherEligibleTargetsBuffed;
                        targetInfo.rallyUpTargetPriority =
                            targetInfo.numOfOtherEligibleTargetsBuffed * 10000
                            + lowestSlotIntendedTargetPriority * 10
                            + targetInfo.slotOrder;
                    }

                    assistUnit.actionContext.assistableUnitInfos.sort(function (a, b) {
                        return b.rallyUpTargetPriority - a.rallyUpTargetPriority;
                    });

                    let slotOrderDependentIndices = this.__getSlotOrderDependentIndices(assistUnit.actionContext.assistableUnitInfos,
                        x => x.rallyUpTargetPriority,
                        20
                    );

                    for (let order = 0; order < assistUnit.actionContext.assistableUnitInfos.length; ++order) {
                        let info = assistUnit.actionContext.assistableUnitInfos[order];
                        this.writeDebugLogLine(order + ": " + info.targetUnit.getNameWithGroup()
                            + ", rallyUpTargetPriority=" + info.rallyUpTargetPriority
                            + ", numOfOtherEligibleTargetsBuffed=" + info.numOfOtherEligibleTargetsBuffed
                            + ", isIntendedAndLowestSlot=" + info.isIntendedAndLowestSlot
                            + ", slotOrder=" + info.slotOrder
                        );
                    }

                    let bestTargetUnitInfo = assistUnit.actionContext.assistableUnitInfos[0];
                    if (slotOrderDependentIndices.includes(0)) {
                        this.writeWarningLine(`${assistUnit.getNameWithGroup()}の大応援対象はスロット順で変わる可能性があります。`);
                    }

                    this.__selectBestTileToAssist(assistUnit, bestTargetUnitInfo);

                    assistUnit.actionContext.bestTargetToAssist = bestTargetUnitInfo.targetUnit;
                    assistUnit.actionContext.bestTileToAssist = bestTargetUnitInfo.bestTileToAssist;
                }
                break;
            default:
                {
                    this.__setBestAssistTiles(assistUnit, isAssistableUnitFunc, acceptTileFunc);
                    if (assistUnit.actionContext.assistableUnitInfos.length == 0) {
                        return;
                    }

                    let bestTargetUnitInfo = this.__selectBestAssistTarget(assistUnit, assistUnit.actionContext.assistableUnitInfos, acceptTileFunc, isPrecombat);
                    assistUnit.actionContext.bestTargetToAssist = bestTargetUnitInfo.targetUnit;
                    assistUnit.actionContext.bestTileToAssist = bestTargetUnitInfo.bestTileToAssist;
                }
                break;
        }
    }

    __selectBestAssistTarget(assistUnit, assistableUnitInfos, isPrecombat) {
        // 補助対象を選択
        this.writeDebugLogLine("最適な補助対象を選択");
        for (let info of assistableUnitInfos) {
            info.calcAssistTargetPriority(assistUnit, isPrecombat);
        }

        assistableUnitInfos.sort(function (a, b) {
            return b.assistTargetPriority - a.assistTargetPriority;
        });

        let slotOrderDependentIndices = this.__getSlotOrderDependentIndices(assistableUnitInfos, x => x.assistTargetPriority);

        for (let order = 0; order < assistableUnitInfos.length; ++order) {
            let info = assistableUnitInfos[order];
            this.writeDebugLogLine(order + ": " + info.targetUnit.getNameWithGroup()
                + ", assistTargetPriority=" + info.assistTargetPriority
                + ", hasThreatensEnemyStatus=" + info.hasThreatensEnemyStatus
                + ", hasStatAndNonstatDebuff=" + info.hasStatAndNonstatDebuff
                + ", amountOfStatsActuallyBuffed=" + info.amountOfStatsActuallyBuffed
                + ", amountHealed=" + info.amountHealed
                + ", isTeleportationRequired=" + info.isTeleportationRequired
                + ", distanceFromClosestEnemy=" + info.distanceFromClosestEnemy
                + ", visibleStatTotal=" + info.visibleStatTotal
                + ", requiredMovementCount=" + info.requiredMovementCount
                + ", slotOrder=" + info.slotOrder
            );
        }

        if (slotOrderDependentIndices.includes(0)) {
            this.writeWarningLine(`${assistUnit.getNameWithGroup()}の最適な補助対象はスロット順で変わる可能性があります。`);
        }

        let bestTargetUnitInfo = assistableUnitInfos[0];
        return bestTargetUnitInfo;
    }

    __countEnemiesWithinSpecifiedSpaces(targetUnit, spaces, predicator) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces)) {
            if (predicator(unit)) {
                ++count;
            }
        }
        return count;
    }

    __countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
            if (predicator != null && predicator(unit)) {
                ++count;
            }
        }
        return count;
    }

    __setAttackableUnitInfo(unit, targetableUnits, acceptTileFunc = null) {
        unit.actionContext.attackableUnitInfos = [];
        for (let tile of g_appData.map.enumerateMovableTiles(unit, false, false)) {
            if (acceptTileFunc != null && !acceptTileFunc(tile)) {
                continue;
            }

            // this.writeDebugLogLine(tile.positionToString() + "から攻撃可能な敵がいるか評価");
            for (let targetableUnit of targetableUnits) {
                let dist = calcDistance(tile.posX, tile.posY, targetableUnit.posX, targetableUnit.posY);
                // this.writeDebugLogLine("- " + tile.positionToString() + "から" + targetableUnit.getNameWithGroup() + "への距離=" + dist);
                if (dist != unit.attackRange) {
                    continue;
                }

                // this.writeDebugLogLine("- " + tile.positionToString() + "から" + targetableUnit.getNameWithGroup() + "に攻撃可能");

                let info = unit.actionContext.findAttackableUnitInfo(targetableUnit);
                if (info == null) {
                    info = new AttackableUnitInfo(targetableUnit);
                    unit.actionContext.attackableUnitInfos.push(info);
                }

                if (tile == unit.placedTile || tile.isUnitPlacable()) {
                    info.tiles.push(tile);
                }
            }
        }
    }

    showItemInfo(id) {
        if (this.isAutoChangeDetailEnabled) {
            this.setCurrentItem(id);
        }
    }

    executeStructuresByUnitGroupType(groupType, appliesDamage) {
        if (appliesDamage) {
            this.__initReservedHpForAllUnitsOnMap();
        }

        switch (groupType) {
            case UnitGroupType.Ally:
                for (let st of this.offenceStructureStorage.enumerateAllObjs()) {
                    if (!g_appData.map.isObjAvailable(st)) { continue; }
                    if (st instanceof OfDarkShrine
                        || st instanceof OfBrightShrine
                        || st instanceof OfHealingTower
                        || st instanceof OfPanicManor
                        || st instanceof OfTacticsRoom
                        || st instanceof OfInfantrySchool
                        || st instanceof OfArmorSchool
                        || st instanceof OfFlierSchool
                        || st instanceof OfCavalrySchool
                    ) {
                        this.executeStructure(st, appliesDamage);
                    }
                    else if (st instanceof OfCatapult) {
                        if (this.vm.currentTurn == 1) {
                            this.executeStructure(st, appliesDamage);
                        }
                    }
                    else if (st instanceof OfBoltTower) {
                        if (this.vm.currentTurn == 3) {
                            this.executeStructure(st, appliesDamage);
                        }
                    }
                }
                break;
            case UnitGroupType.Enemy:
                for (let st of this.defenseStructureStorage.enumerateAllObjs()) {
                    if (!g_appData.map.isObjAvailable(st)) { continue; }
                    if (st instanceof DefDarkShrine
                        || st instanceof DefBrightShrine
                        || st instanceof DefHealingTower
                        || st instanceof DefPanicManor
                        || st instanceof DefTacticsRoom
                        || st instanceof DefInfantrySchool
                        || st instanceof DefArmorSchool
                        || st instanceof DefFlierSchool
                        || st instanceof DefCavalrySchool
                    ) {
                        this.executeStructure(st, appliesDamage);
                    }
                    else if (st instanceof DefCatapult) {
                        if (this.vm.currentTurn == 1) {
                            this.executeStructure(st, appliesDamage);
                        }
                    }
                    else if (st instanceof DefBoltTower) {
                        if (this.vm.currentTurn == 3) {
                            this.executeStructure(st, appliesDamage);
                        }
                    }
                }
                break;
        }

        if (appliesDamage) {
            this.__applyReservedHpForAllUnitsOnMap(true);
        }
    }

    * __enumerateDefenseStructuresOnMap() {
        for (let st of this.defenseStructureStorage.enumerateAllObjs()) {
            if (g_appData.map.isObjAvailable(st)) { yield st; }
        }
    }
    * __enumerateOffenceStructuresOnMap() {
        for (let st of this.offenceStructureStorage.enumerateAllObjs()) {
            if (g_appData.map.isObjAvailable(st)) { yield st; }
        }
    }

    __initReservedHp(unit) {
        unit.initReservedDebuffs();
        unit.initReservedStatusEffects();
        unit.initReservedHp();
    }

    __initReservedHpForAllUnitsOnMap() {
        for (let unit of this.enumerateAllUnitsOnMap()) {
            this.__initReservedHp(unit);
        }
    }
    __applyReservedHpForAllUnitsOnMap(leavesOneHp) {
        for (let unit of this.enumerateAllUnitsOnMap()) {
            if (unit.isDead) {
                continue;
            }

            this.__applyReservedHp(unit, leavesOneHp);
        }
    }

    __applyReservedHp(unit, leavesOneHp) {
        unit.applyReservedDebuffs();
        unit.applyReservedStatusEffects();
        unit.applyReservedHp(leavesOneHp);
    }

    executeStructure(structure, appliesDamage = true) {
        if (appliesDamage) {
            this.__initReservedHpForAllUnitsOnMap();
        }

        let px = structure.posX;
        let py = structure.posY;
        if (structure instanceof OfBoltTower) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Enemy, 3, 99)) {
                let damage = Number(structure.level) * 5 + 5;
                unit.reserveTakeDamage(damage);
            }
        }
        else if (structure instanceof DefBoltTower) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Ally, 3, 7)) {
                let damage = Number(structure.level) * 5 + 5;
                unit.reserveTakeDamage(damage);
            }
        }
        else if (structure instanceof OfHealingTower) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Ally, 5, 5)) {
                let healAmount = Number(structure.level) * 5 + 5;
                unit.reserveHeal(healAmount);
            }
        }
        else if (structure instanceof DefHealingTower) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Enemy, 5, 5)) {
                let healAmount = Number(structure.level) * 5 + 5;
                unit.reserveHeal(healAmount);
            }
        }
        else if (structure instanceof OfPanicManor) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Enemy, 3, 99)) {
                if (this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                }
            }
        }
        else if (structure instanceof DefPanicManor) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Ally, 3, 7)) {
                if (this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                }
            }
        }
        else if (structure instanceof OfTacticsRoom) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Enemy, 1, 99)) {
                if (unit.isRangedWeaponType() && this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                }
            }
        }
        else if (structure instanceof DefTacticsRoom) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Ally, 3, 7)) {
                if (unit.isRangedWeaponType() && this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                }
            }
        }
        else if (structure instanceof OfDarkShrine) {
            this.__executeDarkShrine(structure, UnitGroupType.Enemy);
        }
        else if (structure instanceof DefDarkShrine) {
            this.__executeDarkShrine(structure, UnitGroupType.Ally);
        }
        else if (structure instanceof OfBrightShrine) {
            this.__executeBrightShrine(structure, UnitGroupType.Enemy);
        }
        else if (structure instanceof DefBrightShrine) {
            this.__executeBrightShrine(structure, UnitGroupType.Ally);
        }
        else if (structure instanceof BoltTrap) {
            for (let unit of this.enumerateUnitsWithinSpecifiedSpaces(px, py, UnitGroupType.Enemy, 3)) {
                let damage = Number(structure.level) * 10;
                unit.reserveTakeDamage(damage);
            }
            for (let unit of this.enumerateUnitsWithinSpecifiedSpaces(px, py, UnitGroupType.Ally, 3)) {
                let damage = Number(structure.level) * 10;
                unit.reserveTakeDamage(damage);
            }
        }
        else if (structure instanceof HeavyTrap) {
            for (let unit of this.enumerateUnitsWithinSpecifiedSpaces(px, py, UnitGroupType.Enemy, 2)) {
                if (this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    this.writeLogLine(unit.getNameWithGroup() + "に重圧の罠の効果適用");
                    unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                }
            }
            for (let unit of this.enumerateUnitsWithinSpecifiedSpaces(px, py, UnitGroupType.Ally, 2)) {
                console.log(unit.getNameWithGroup());
                if (this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    this.writeLogLine(unit.getNameWithGroup() + "に重圧の罠の効果適用");
                    unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                }
            }
        }
        else if (structure instanceof OfInfantrySchool) {
            this.__executeSchool(structure, MoveType.Infantry, UnitGroupType.Enemy);
        }
        else if (structure instanceof OfArmorSchool) {
            this.__executeSchool(structure, MoveType.Armor, UnitGroupType.Enemy);
        }
        else if (structure instanceof OfFlierSchool) {
            this.__executeSchool(structure, MoveType.Flying, UnitGroupType.Enemy);
        }
        else if (structure instanceof OfCavalrySchool) {
            this.__executeSchool(structure, MoveType.Cavalry, UnitGroupType.Enemy);
        }
        else if (structure instanceof DefInfantrySchool) {
            this.__executeSchool(structure, MoveType.Infantry, UnitGroupType.Ally);
        }
        else if (structure instanceof DefArmorSchool) {
            this.__executeSchool(structure, MoveType.Armor, UnitGroupType.Ally);
        }
        else if (structure instanceof DefFlierSchool) {
            this.__executeSchool(structure, MoveType.Flying, UnitGroupType.Ally);
        }
        else if (structure instanceof DefCavalrySchool) {
            this.__executeSchool(structure, MoveType.Cavalry, UnitGroupType.Ally);
        }
        else if (structure instanceof OfCatapult) {
            for (let st of this.__enumerateDefenseStructuresOnMap()) {
                if (this.__canBreakByCatapult(st)
                    && structure.posX == st.posX
                    && Number(st.level) <= Number(structure.level)) {
                    moveStructureToTrashBox(st);
                }
            }
        }
        else if (structure instanceof DefCatapult) {
            for (let st of this.__enumerateOffenceStructuresOnMap()) {
                if (this.__canBreakByCatapult(st)
                    && structure.posX == st.posX
                    && Number(st.level) <= Number(structure.level)) {
                    moveStructureToTrashBox(st);
                }
            }
        }
        else {
            this.writeLogLine("<span style='color:red'>" + structure.name + "は効果の発動に未対応です。</span>");
        }

        if (appliesDamage) {
            this.__applyReservedHpForAllUnitsOnMap(true);
        }
    }

    __getStatusEvalUnit(unit) {
        if (unit.snapshot != null) { return unit.snapshot; }
        return unit;
    }

    __canBreakByCatapult(st) {
        return st.isBreakable
            && !st.isRequired
            && !(st instanceof Ornament);
    }

    __executeSchool(structure, moveType, groupType) {
        let px = structure.posX;
        let py = structure.posY;
        for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, groupType, 3, 99)) {
            if (unit.moveType == moveType) { unit.reserveToApplyAllDebuff(-(Number(structure.level) + 1)); }
        }
    }
    executeCurrentStructure() {
        let structure = g_appData.currentStructure;
        if (g_appData.map.isObjAvailable(structure) == false) {
            return;
        }

        if (!g_appData.map.isObjAvailable(structure)) {
            return;
        }

        this.executeStructure(structure);
        updateAllUi();
    }

    __applyDebuffToMaxStatusUnits(unitGroup, getStatusFunc, applyDebuffFunc) {
        for (let unit of this.__findMaxStatusUnits(unitGroup, getStatusFunc)) {
            applyDebuffFunc(unit);
        }
    }

    __executeDarkShrine(structure, unitGroup) {
        this.__applyDebuffToMaxStatusUnits(unitGroup,
            unit => { return this.__getStatusEvalUnit(unit).getResInPrecombatWithoutDebuff() + this.__getStatusEvalUnit(unit).getDefInPrecombatWithoutDebuff() },
            unit => {
                let amount = -(Number(structure.level) + 1);
                unit.reserveToApplyDefDebuff(amount);
                unit.reserveToApplyResDebuff(amount);
            });
    }

    __executeBrightShrine(structure, unitGroup) {
        this.__applyDebuffToMaxStatusUnits(unitGroup,
            unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombatWithoutDebuff() + this.__getStatusEvalUnit(unit).getSpdInPrecombatWithoutDebuff() },
            unit => {
                let amount = -(Number(structure.level) + 1);
                unit.reserveToApplyAtkDebuff(amount);
                unit.reserveToApplySpdDebuff(amount);
            });
    }

    __findMinStatusUnits(unitGroup, getStatusFunc) {
        let minUnits = [];
        let minValue = 100000;
        for (let unit of this.enumerateUnitsInSpecifiedGroup(unitGroup)) {
            if (!unit.isOnMap) {
                continue;
            }
            let value = getStatusFunc(unit);
            if (value < minValue) {
                minValue = value;
                minUnits = [unit];
            }
            else if (value == minValue) {
                minUnits.push(unit);
            }
        }
        return minUnits;
    }

    __findMaxStatusUnits(unitGroup, getStatusFunc, exceptUnit = null) {
        let maxUnits = [];
        let maxValue = -1;
        for (let unit of this.enumerateUnitsInSpecifiedGroup(unitGroup)) {
            if (unit == exceptUnit) {
                continue;
            }
            if (!unit.isOnMap) {
                continue;
            }
            let value = getStatusFunc(unit);
            if (value > maxValue) {
                maxValue = value;
                maxUnits = [unit];
            }
            else if (value == maxValue) {
                maxUnits.push(unit);
            }
        }
        return maxUnits;
    }

    __findTileAfterShove(unit, targetUnit, assistTile) {
        return this.__findTileAfterPushUnitFartherAway(unit, targetUnit, assistTile, 1);
    }

    __findTileAfterSmite(unit, targetUnit, assistTile) {
        return this.__findTileAfterPushUnitFartherAway(unit, targetUnit, assistTile, 2);
    }

    __findTileAfterPushUnitFartherAway(unit, targetUnit, assistTile, spaces) {
        if (targetUnit == null) {
            return new MovementAssistResult(false, null, null);
        }

        let diffX = targetUnit.posX - assistTile.posX;
        let diffY = targetUnit.posY - assistTile.posY;
        if (diffX + diffY > 1) {
            return new MovementAssistResult(false, null, null);
        }

        let moveTile = null;
        for (let i = spaces; i > 0; --i) {
            let moveX = targetUnit.posX + diffX * i;
            let moveY = targetUnit.posY + diffY * i;

            let tile = g_appData.map.getTile(moveX, moveY);
            if (tile == null) {
                continue;
            }

            // 壁などが途中にあったらぶちかましなどを行えない
            if (!tile.isMovableTile() || !isMovableForUnit(tile.obj)) {
                moveTile = null;
                continue;
            }

            if (moveTile != unit.placedTile && !tile.isUnitPlacableForUnit(targetUnit)) {
                continue;
            }

            if (moveTile == null) {
                // 遠くのタイル優先なので上書きしない
                moveTile = tile;
            }
        }

        if (moveTile == null) {
            return new MovementAssistResult(false, null, null);
        }
        return new MovementAssistResult(true, assistTile, moveTile);
    }

    __findTileAfterDrawback(unit, targetUnit, assistTile) {
        let result = this.__findTileAfterReposition(unit, targetUnit, assistTile);
        return new MovementAssistResult(result.success, result.targetUnitTileAfterAssist, result.assistUnitTileAfterAssist);
    }

    __findTileAfterSwap(unit, targetUnit, assistTile) {
        return new MovementAssistResult(true, targetUnit.placedTile, assistTile);
    }

    __findTileAfterPivot(unit, targetUnit, assistTile) {
        let diffX = assistTile.posX - targetUnit.posX;
        let diffY = assistTile.posY - targetUnit.posY;
        if (diffX + diffY > 1) {
            return new MovementAssistResult(false, null, null);
        }
        let moveX = targetUnit.posX - diffX;
        let moveY = targetUnit.posY - diffY;
        let moveTile = g_appData.map.getTile(moveX, moveY);
        if (moveTile == null) {
            return new MovementAssistResult(false, null, null);
        }
        if (moveTile != unit.placedTile && !moveTile.isUnitPlacable()) {
            return new MovementAssistResult(false, null, null);
        }
        return new MovementAssistResult(true, moveTile, targetUnit.placedTile);
    }


    __findTileAfterReposition(unit, targetUnit, assistTile) {
        let diffX = assistTile.posX - targetUnit.posX;
        let diffY = assistTile.posY - targetUnit.posY;
        if (diffX + diffY > 1) {
            return new MovementAssistResult(false, null, null);
        }

        let moveX = assistTile.posX + diffX;
        let moveY = assistTile.posY + diffY;
        let moveTile = g_appData.map.getTile(moveX, moveY);
        if (moveTile == null) {
            return new MovementAssistResult(false, null, null);
        }

        if (moveTile != unit.placedTile && !moveTile.isUnitPlacable()) {
            return new MovementAssistResult(false, null, null);
        }

        return new MovementAssistResult(true, assistTile, moveTile);
    }

    __applyMovementAssist(unit, targetUnit, movementAssistCalcFunc, applysMovementSkill = true, movesTargetUnit = true) {
        if (targetUnit == null) { return false; }
        let result = movementAssistCalcFunc(unit, targetUnit, unit.placedTile);
        if (!result.success) {
            return false;
        }

        let origUnitTile = unit.placedTile;
        let origTargetUnitTile = targetUnit.placedTile;
        g_appData.map.removeUnit(unit);
        if (movesTargetUnit) {
            g_appData.map.removeUnit(targetUnit);
        }

        // 一旦ユニットを取り除いて配置可能かどうかをチェックする
        let canMove = result.assistUnitTileAfterAssist.isUnitPlacableForUnit(unit);
        if (movesTargetUnit) {
            canMove &= result.targetUnitTileAfterAssist.isUnitPlacableForUnit(targetUnit);
        }
        moveUnit(unit, origUnitTile);
        moveUnit(targetUnit, origTargetUnitTile);
        if (!canMove) {
            return false;
        }

        // 行動終了してから移動しないと罠が発動後に行動終了で状態異常がすぐに回復してしまう
        // endUnitAction()を呼んでしまうと未来を映す瞳が実行される前にターン終了してしまう
        unit.endAction();

        g_appData.map.removeUnit(unit);
        if (movesTargetUnit) {
            g_appData.map.removeUnit(targetUnit);
        }

        moveUnit(unit, result.assistUnitTileAfterAssist);
        if (movesTargetUnit) {
            moveUnit(targetUnit, result.targetUnitTileAfterAssist);
        }

        if (applysMovementSkill) {
            this.__applyMovementAssistSkill(unit, targetUnit);
            this.__applyMovementAssistSkill(targetUnit, unit);
        }
        return true;
    }

    __applyDebuffToEnemiesWithin2Spaces(targetUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(targetUnit, 2)) {
            debuffFunc(unit);
        }
    }
    __applyDebuffToEnemiesWithin4Spaces(targetUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(targetUnit, 4)) {
            debuffFunc(unit);
        }
    }

    __applyMovementAssistSkill(unit, targetUnit) {
        for (let skillId of unit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.AtkSpdSnag3:
                    for (let u of this.__findNearestEnemies(unit, 4)) {
                        u.applyAtkDebuff(-6);
                        u.applySpdDebuff(-6);
                    }
                    for (let u of this.__findNearestEnemies(targetUnit, 4)) {
                        u.applyAtkDebuff(-6);
                        u.applySpdDebuff(-6);
                    }
                    break;
                case PassiveB.AtkDefSnag3:
                    for (let u of this.__findNearestEnemies(unit, 4)) {
                        u.applyAtkDebuff(-6);
                        u.applyDefDebuff(-6);
                    }
                    for (let u of this.__findNearestEnemies(targetUnit, 4)) {
                        u.applyAtkDebuff(-6);
                        u.applyDefDebuff(-6);
                    }
                    break;
                case PassiveB.SpdResSnag3:
                    for (let u of this.__findNearestEnemies(unit, 4)) {
                        u.applySpdDebuff(-6);
                        u.applyResDebuff(-6);
                    }
                    for (let u of this.__findNearestEnemies(targetUnit, 4)) {
                        u.applySpdDebuff(-6);
                        u.applyResDebuff(-6);
                    }
                    break;
                case PassiveB.SpdDefSnag3:
                    for (let u of this.__findNearestEnemies(unit, 4)) {
                        u.applySpdDebuff(-6);
                        u.applyDefDebuff(-6);
                    }
                    for (let u of this.__findNearestEnemies(targetUnit, 4)) {
                        u.applySpdDebuff(-6);
                        u.applyDefDebuff(-6);
                    }
                    break;
                case Weapon.TrasenshiNoTsumekiba:
                    this.__applyDebuffToEnemiesWithin2Spaces(unit, x => x.applyAllDebuff(-4));
                    this.__applyDebuffToEnemiesWithin2Spaces(targetUnit, x => x.applyAllDebuff(-4));
                    break;
                case Weapon.RazuwarudoNoMaiken:
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                        ally.applyAllBuff(4);
                    }
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, false)) {
                        ally.applyAllBuff(4);
                    }
                    break;
                case PassiveB.AtkSpdLink2:
                    this.__applyLinkSkill(unit, targetUnit,
                        x => { x.applyAtkBuff(4); x.applySpdBuff(4); });
                    break;
                case Weapon.OrdinNoKokusyo:
                case Weapon.KinranNoSyo:
                    if (unit.isWeaponSpecialRefined) {
                        this.__applyLinkSkill(unit, targetUnit,
                            x => { x.applyAtkBuff(6); x.applySpdBuff(6); });
                    }
                    break;
                case PassiveB.AtkSpdLink3:
                    this.__applyLinkSkill(unit, targetUnit,
                        x => { x.applyAtkBuff(6); x.applySpdBuff(6); });
                    break;
                case PassiveB.AtkDefLink3:
                    this.__applyLinkSkill(unit, targetUnit,
                        x => { x.applyAtkBuff(6); x.applyDefBuff(6); });
                    break;
                case PassiveB.AtkResLink3:
                    this.__applyLinkSkill(unit, targetUnit,
                        x => { x.applyAtkBuff(6); x.applyResBuff(6); });
                    break;
                case PassiveB.SpdDefLink3:
                    this.__applyLinkSkill(unit, targetUnit,
                        x => { x.applySpdBuff(6); x.applyDefBuff(6); });
                    break;
                case PassiveB.SpdResLink3:
                    this.__applyLinkSkill(unit, targetUnit,
                        x => { x.applySpdBuff(6); x.applyResBuff(6); });
                    break;
                case PassiveB.DefResLink3:
                    this.__applyLinkSkill(unit, targetUnit,
                        x => { x.applyDefBuff(6); x.applyResBuff(6); });
                    break;
            }
        }
    }

    __applyLinkSkill(unit, targetUnit, applyBuffFunc) {
        applyBuffFunc(unit);
        applyBuffFunc(targetUnit);
    }

    __applyRefresh(skillOwnerUnit, targetUnit) {
        if (targetUnit == null) { return false; }
        targetUnit.isActionDone = false;
        switch (skillOwnerUnit.support) {
            case Support.Play:
                if (skillOwnerUnit.weapon == Weapon.HyosyoNoBreath) {
                    this.__applyHyosyoNoBreath(skillOwnerUnit);
                }
                break;
            case Support.Urur:
                {
                    targetUnit.applyAllBuff(3);
                }
                break;
            case Support.GrayWaves:
                {
                    if ((targetUnit.moveType == MoveType.Infantry || targetUnit.moveType == MoveType.Flying)) {
                        targetUnit.addStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                }
                break;
            case Support.GentleDream:
                {
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwnerUnit, false)) {
                        if (unit.posX == skillOwnerUnit.posX
                            || unit.posX == targetUnit.posX
                            || unit.posY == skillOwnerUnit.posY
                            || unit.posY == targetUnit.posY
                        ) {
                            unit.applyAllBuff(3);
                            unit.addStatusEffect(StatusEffectType.AirOrders);
                        }
                    }
                }
                break;
            case Support.WhimsicalDream:
                {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                        unit.applyAtkBuff(5);
                    }

                    let targetEnemies = this.__findNearestEnemies(targetUnit, 4);
                    for (let targetEnemy of targetEnemies) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetEnemy, 2, true)) {
                            unit.applyAtkDebuff(-5);
                        }
                    }
                }
                break;
            case Support.SweetDreams:
                targetUnit.applyAllBuff(3);
                for (let unit of this.__findNearestEnemies(targetUnit, 4)) {
                    unit.applyAllDebuff(-4);
                }
                break;
            case Support.FrightfulDream:
                this.__applyRuse(skillOwnerUnit, targetUnit, unit => unit.applyAllDebuff(-3));
                break;
        }

        for (let skillId of skillOwnerUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Veruzandhi:
                    targetUnit.applyAllBuff(4);
                    break;
                case PassiveB.BlazeDance1: targetUnit.applyAtkBuff(2); break;
                case PassiveB.BlazeDance2: targetUnit.applyAtkBuff(3); break;
                case PassiveB.BlazeDance3: targetUnit.applyAtkBuff(4); break;
                case PassiveB.GaleDance1: targetUnit.applySpdBuff(2); break;
                case PassiveB.GaleDance2: targetUnit.applySpdBuff(3); break;
                case PassiveB.GaleDance3: targetUnit.applySpdBuff(4); break;
                case PassiveB.EarthDance1: targetUnit.applyDefBuff(3); break;
                case PassiveB.EarthDance2: targetUnit.applyDefBuff(4); break;
                case PassiveB.EarthDance3: targetUnit.applyDefBuff(5); break;
                case PassiveB.TorrentDance1: targetUnit.applyResBuff(3); break;
                case PassiveB.TorrentDance2: targetUnit.applyResBuff(4); break;
                case PassiveB.TorrentDance3: targetUnit.applyResBuff(5); break;
                case PassiveB.FirestormDance2: targetUnit.applyAtkBuff(3); targetUnit.applySpdBuff(3); break;
                case PassiveB.CalderaDance1: targetUnit.applyAtkBuff(2); targetUnit.applyDefBuff(3); break;
                case PassiveB.CalderaDance2: targetUnit.applyAtkBuff(3); targetUnit.applyDefBuff(4); break;
                case PassiveB.FirefloodDance2: targetUnit.applyAtkBuff(3); targetUnit.applyResBuff(4); break;
                case PassiveB.RockslideDance2: targetUnit.applySpdBuff(3); targetUnit.applyDefBuff(4); break;
                case PassiveB.DelugeDance2: targetUnit.applySpdBuff(3); targetUnit.applyResBuff(4); break;
                case PassiveB.GeyserDance1: targetUnit.applyDefBuff(3); targetUnit.applyResBuff(3); break;
                case PassiveB.GeyserDance2: targetUnit.applyDefBuff(4); targetUnit.applyResBuff(4); break;
                case Weapon.Sukurudo: targetUnit.applyAllBuff(3); break;
                case PassiveB.AtkCantrip3:
                    for (let unit of this.__findNearestEnemies(skillOwnerUnit, 4)) {
                        unit.applyAtkDebuff(-7);
                    }
                    break;
                case PassiveB.DefCantrip3:
                    for (let unit of this.__findNearestEnemies(skillOwnerUnit, 4)) {
                        unit.applyDefDebuff(-7);
                    }
                    break;
                case PassiveB.ResCantrip3:
                    for (let unit of this.__findNearestEnemies(skillOwnerUnit, 4)) {
                        unit.applyResDebuff(-7);
                    }
                    break;
            }
        }

        // 大地の舞い等の後に実行する必要がある
        if (skillOwnerUnit.weapon == Weapon.SeireiNoHogu) {
            let buffs = [
                Number(targetUnit.atkBuff),
                Number(targetUnit.spdBuff),
                Number(targetUnit.defBuff),
                Number(targetUnit.resBuff)
            ];
            let maxBuff = buffs.reduce(function (a, b) {
                return Math.max(a, b);
            });
            targetUnit.applyAllBuff(maxBuff);
        }

        return true;
    }

    __canBeMovedIntoLessEnemyThreat(unit, targetUnit, assistTile) {
        let beforeTileThreat = targetUnit.placedTile.getEnemyThreatFor(unit.groupId);
        let afterTileThreat = this.__calcTargetUnitTileThreatAfterMoveAssist(unit, targetUnit, assistTile);
        this.writeDebugLogLine(targetUnit.getNameWithGroup() + " "
            + "現在の脅威数=" + beforeTileThreat + ", "
            + "移動後の脅威数=" + afterTileThreat);
        if (afterTileThreat < 0) {
            return false;
        }
        return afterTileThreat < beforeTileThreat;
    }

    __calcTargetUnitTileThreatAfterMoveAssist(unit, targetUnit, assistTile) {
        let result = null;
        switch (unit.support) {
            case Support.RescuePlus:
            case Support.Rescue:
            case Support.Drawback: result = this.__findTileAfterDrawback(unit, targetUnit, assistTile); break;
            case Support.ToChangeFate:
            case Support.ReturnPlus:
            case Support.Return:
            case Support.Reposition: result = this.__findTileAfterReposition(unit, targetUnit, assistTile); break;
            case Support.FutureVision:
            case Support.Swap: result = this.__findTileAfterSwap(unit, targetUnit, assistTile); break;
            case Support.Smite: result = this.__findTileAfterSmite(unit, targetUnit, assistTile); break;
            case Support.NudgePlus:
            case Support.Nudge:
            case Support.Shove: result = this.__findTileAfterShove(unit, targetUnit, assistTile); break;
            case Support.Pivot: result = this.__findTileAfterPivot(unit, targetUnit, assistTile); break;
            default:
                this.writeErrorLine("未実装の補助: " + unit.supportInfo.name);
                return -1;
        }


        if (!result.success) {
            return -1;
        }

        let canPlace = result.assistUnitTileAfterAssist.isMovableTileForUnit(unit)
            && result.targetUnitTileAfterAssist.isMovableTileForUnit(targetUnit);
        if (!canPlace) {
            return -1;
        }

        return result.targetUnitTileAfterAssist.getEnemyThreatFor(unit.groupId);
    }

    __applyRally(supporterUnit, targetUnit) {
        let isBuffed = false;
        let supportId = supporterUnit.support;
        if (targetUnit.applyAtkBuff(getAtkBuffAmount(supportId))) { isBuffed = true; }
        if (targetUnit.applySpdBuff(getSpdBuffAmount(supportId))) { isBuffed = true; }
        if (targetUnit.applyDefBuff(getDefBuffAmount(supportId))) { isBuffed = true; }
        if (targetUnit.applyResBuff(getResBuffAmount(supportId))) { isBuffed = true; }
        if (!isBuffed) {
            isBuffed = supporterUnit.canRallyForcibly()
        }

        if (isBuffed) {
            this.__applySkillsAfterRally(supporterUnit, targetUnit);
        }
        return isBuffed;
    }

    __applySkillsAfterRally(supporterUnit, targetUnit) {
        for (let skillId of supporterUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Uchikudakumono:
                    if (!(targetUnit.moveType == MoveType.Cavalry && targetUnit.isRangedWeaponType())) {
                        targetUnit.addStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                    break;
                case PassiveB.AtkFeint3: this.__applyFeint(supporterUnit, x => x.applyAtkDebuff(-7)); break;
                case PassiveB.SpdFeint3: this.__applyFeint(supporterUnit, x => x.applySpdDebuff(-7)); break;
                case PassiveB.DefFeint3: this.__applyFeint(supporterUnit, x => x.applyDefDebuff(-7)); break;
                case PassiveB.ResFeint3: this.__applyFeint(supporterUnit, x => x.applyResDebuff(-7)); break;
                case PassiveB.AtkSpdRuse3:
                    this.__applyRuse(supporterUnit, targetUnit,
                        unit => { unit.applyAtkDebuff(-5); unit.applySpdDebuff(-5); });
                    break;
                case PassiveB.AtkDefRuse3:
                    this.__applyRuse(supporterUnit, targetUnit,
                        unit => { unit.applyAtkDebuff(-5); unit.applyDefDebuff(-5); });
                    break;
                case PassiveB.AtkResRuse3:
                    this.__applyRuse(supporterUnit, targetUnit,
                        unit => { unit.applyAtkDebuff(-5); unit.applyResDebuff(-5); });
                    break;
                case PassiveB.DefResRuse3:
                    this.__applyRuse(supporterUnit, targetUnit,
                        unit => { unit.applyDefDebuff(-5); unit.applyResDebuff(-5); });
                    break;
                case PassiveB.SpdResRuse3:
                    this.__applyRuse(supporterUnit, targetUnit,
                        unit => { unit.applyResDebuff(-5); unit.applySpdDebuff(-5); });
                    break;
                case PassiveB.SpdDefRuse3:
                    this.__applyRuse(supporterUnit, targetUnit,
                        unit => { unit.applyDefDebuff(-5); unit.applySpdDebuff(-5); });
                    break;
            }
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.AtkFeint3: this.__applyFeint(supporterUnit, x => x.applyAtkDebuff(-7)); break;
                case PassiveB.SpdFeint3: this.__applyFeint(supporterUnit, x => x.applySpdDebuff(-7)); break;
                case PassiveB.DefFeint3: this.__applyFeint(supporterUnit, x => x.applyDefDebuff(-7)); break;
                case PassiveB.ResFeint3: this.__applyFeint(supporterUnit, x => x.applyResDebuff(-7)); break;
            }
        }
    }

    __applyFeint(skillOwnerUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwnerUnit)) {
            if (this.__isInCloss(unit, skillOwnerUnit)) {
                debuffFunc(unit);
            }
        }
    }

    __applyRuse(supporterUnit, targetUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(supporterUnit)) {
            if (this.__isInCloss(unit, supporterUnit) || this.__isInCloss(unit, targetUnit)) {
                debuffFunc(unit);
                unit.addStatusEffect(StatusEffectType.Guard);
            }
        }
    }

    __applyRallyUp(supporterUnit, targetUnit) {
        let success = false;
        let supportId = supporterUnit.support;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
            if (unit == supporterUnit) {
                continue;
            }

            let buffAmount = getAtkBuffAmount(supportId);
            if (unit.atkBuff < buffAmount) { unit.atkBuff = buffAmount; success = true; }
            buffAmount = getSpdBuffAmount(supportId);
            if (unit.spdBuff < buffAmount) { unit.spdBuff = buffAmount; success = true; }
            buffAmount = getDefBuffAmount(supportId);
            if (unit.defBuff < buffAmount) { unit.defBuff = buffAmount; success = true; }
            buffAmount = getResBuffAmount(supportId);
            if (unit.resBuff < buffAmount) { unit.resBuff = buffAmount; success = true; }
        }

        if (success) {
            this.__applySkillsAfterRally(supporterUnit, targetUnit);
        }

        return success;
    }

    __applyHeal(supporterUnit, targetUnit) {
        let isActivated = false;

        if (targetUnit.canHeal()) {
            let healAmount = calcHealAmount(supporterUnit, targetUnit);
            if (supporterUnit.specialCount == 0) {
                switch (supporterUnit.special) {
                    case Special.Chiyu:
                        healAmount += 10;
                        supporterUnit.setSpecialCountToMax();
                        break;
                }
            }

            let healedAmount = targetUnit.heal(healAmount);
            this.writeSimpleLogLine(`${targetUnit.getNameWithGroup()}は${healedAmount}回復`);

            switch (supporterUnit.passiveB) {
                case PassiveB.GohoshiNoYorokobi1:
                    supporterUnit.heal(Math.floor(healedAmount * 0.5));
                    break;
                case PassiveB.GohoshiNoYorokobi2:
                    supporterUnit.heal(Math.floor(healedAmount * 0.75));
                    break;
                case PassiveB.GohoshiNoYorokobi3:
                    supporterUnit.heal(Math.floor(healedAmount * 1.0));
                    break;
            }
            switch (supporterUnit.support) {
                case Support.Reconcile:
                    supporterUnit.heal(7);
                    break;
                case Support.Martyr:
                case Support.MartyrPlus:
                    supporterUnit.heal(Math.floor(supporterUnit.currentDamage * 0.5));
                    break;
            }

            isActivated = true;
        }

        switch (supporterUnit.support) {
            case Support.Restore:
            case Support.RestorePlus:
                if (targetUnit.isDebuffed || targetUnit.hasAnyStatusEffect) {
                    targetUnit.resetDebuffs();
                    targetUnit.clearNegativeStatusEffects();
                    isActivated = true;
                }
                break;
        }

        if (isActivated) {
            if (supporterUnit.specialCount == 0) {
                switch (supporterUnit.special) {
                    case Special.Tensho:
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(supporterUnit, false)) {
                            if (unit == targetUnit) {
                                continue;
                            }
                            unit.heal(10);
                        }
                        supporterUnit.setSpecialCountToMax();
                        break;
                    case Special.ShippuNoSyukuhuku:
                        this.__applyBalmSkill(supporterUnit, x => x.applySpdBuff(4));
                        break;
                    case Special.DaichiNoSyukuhuku:
                        this.__applyBalmSkill(supporterUnit, x => x.applyDefBuff(4));
                        break;
                    case Special.SeisuiNoSyukuhuku:
                        this.__applyBalmSkill(supporterUnit, x => x.applyResBuff(4));
                        break;
                    case Special.KindledFireBalm:
                        this.__applyBalmSkill(supporterUnit, x => x.applyAtkBuff(4));
                        break;
                    case Special.WindfireBalm:
                        this.__applyBalmSkill(supporterUnit, x => { x.applyAtkBuff(4); x.applySpdBuff(4); });
                        break;
                    case Special.WindfireBalmPlus:
                        this.__applyBalmSkill(supporterUnit, x => { x.applyAtkBuff(6); x.applySpdBuff(6); });
                        break;
                    case Special.DelugeBalmPlus:
                        this.__applyBalmSkill(supporterUnit, x => { x.applySpdBuff(6); x.applyResBuff(6); });
                        break;
                    case Special.DaichiSeisuiNoSyukuhuku:
                        this.__applyBalmSkill(supporterUnit, x => { x.applyDefBuff(4); x.applyResBuff(4); });
                        break;
                    case Special.DaichiSeisuiNoSyukuhukuPlus:
                        this.__applyBalmSkill(supporterUnit, x => { x.applyDefBuff(6); x.applyResBuff(6); });
                        break;
                    case Special.GokaDaichiNoSyukuhukuPlus:
                        this.__applyBalmSkill(supporterUnit, x => { x.applyAtkBuff(6); x.applyDefBuff(6); });
                        break;
                    case Special.GokaSeisuiNoSyukuhukuPlus:
                        this.__applyBalmSkill(supporterUnit, x => { x.applyAtkBuff(6); x.applyResBuff(6); });
                        break;
                }
            }
            else if (supporterUnit.support != Support.RescuePlus
                && supporterUnit.support != Support.Rescue
                && supporterUnit.support != Support.ReturnPlus
                && supporterUnit.support != Support.Return
                && supporterUnit.support != Support.NudgePlus
                && supporterUnit.support != Support.Nudge
            ) {
                supporterUnit.reduceSpecialCount(1);
            }
        }

        return isActivated;
    }

    __applyBalmSkill(supporterUnit, buffFunc) {
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(supporterUnit, false)) {
            buffFunc(unit);
        }
        supporterUnit.setSpecialCountToMax();
    }

    applySupportSkill(supporterUnit, targetUnit, supportTile = null) {
        if (supporterUnit.supportInfo == null) {
            return false;
        }

        if (this.__applySupportSkill(supporterUnit, targetUnit)) {
            if (!supporterUnit.isActionDone) {
                // endUnitAction()を呼んでしまうと未来を映す瞳が実行される前にターン終了してしまう
                supporterUnit.endAction();
            }
            switch (supporterUnit.support) {
                case Support.ToChangeFate:
                    if (!supporterUnit.isOneTimeActionActivatedForSupport) {
                        supporterUnit.applyAtkBuff(6);
                        supporterUnit.addStatusEffect(StatusEffectType.Isolation);
                        supporterUnit.isActionDone = false;
                        supporterUnit.isOneTimeActionActivatedForSupport = true;
                    }
                    break;
                case Support.FutureVision:
                    if (!supporterUnit.isOneTimeActionActivatedForSupport) {
                        supporterUnit.isActionDone = false;
                        supporterUnit.isOneTimeActionActivatedForSupport = true;
                    }
                    break;
            }

            // 再移動の評価
            this.__activateCantoIfPossible(supporterUnit);

            this.__goToNextPhaseIfAllActionDone(supporterUnit.groupId);
        }

        return false;
    }

    __executeHarshCommand(targetUnit) {
        if (targetUnit.isDebuffed) {
            if (targetUnit.atkDebuff < 0 && -targetUnit.atkDebuff > targetUnit.atkBuff) {
                targetUnit.applyAtkBuff(-targetUnit.atkDebuff);
            }
            if (targetUnit.spdDebuff < 0 && -targetUnit.spdDebuff > targetUnit.spdBuff) {
                targetUnit.applySpdBuff(-targetUnit.spdDebuff);
            }
            if (targetUnit.defDebuff < 0 && -targetUnit.defDebuff > targetUnit.defBuff) {
                targetUnit.applyDefBuff(-targetUnit.defDebuff);
            }
            if (targetUnit.resDebuff < 0 && -targetUnit.resDebuff > targetUnit.resBuff) {
                targetUnit.applyResBuff(-targetUnit.resDebuff);
            }
            targetUnit.resetDebuffs();
            return true;
        }
        return false;
    }

    __canSupportTo(supporterUnit, targetUnit, tile) {
        if (supporterUnit.supportInfo == null) {
            return false;
        }

        switch (supporterUnit.supportInfo.assistType) {
            case AssistType.Refresh:
                return canRefereshTo(targetUnit);
            case AssistType.Rally:
                return supporterUnit.canRallyForcibly() || supporterUnit.canRallyTo(targetUnit, 1);
            case AssistType.Heal:
                switch (supporterUnit.support) {
                    case Support.Sacrifice:
                        return targetUnit.isDebuffed || Math.min(targetUnit.currentDamage, supporterUnit.hp - 1) > 0;
                    default:
                        return targetUnit.currentDamage >= 1;
                }
            case AssistType.Restore:
                return targetUnit.hasNegativeStatusEffect()
                    || (targetUnit.currentDamage >= 1);
            case AssistType.DonorHeal:
                {
                    let result = this.__getUserLossHpAndTargetHaelHpForDonorHeal(supporterUnit, targetUnit);
                    return result.targetHealHp > 0;
                }
            case AssistType.Move:
                {
                    let result = this.__findTileAfterMovementAssist(supporterUnit, targetUnit, tile);
                    return result.success;
                }
            default:
                this.writeErrorLine("戦闘前補助が未実装のスキル: " + supporterUnit.supportInfo.name);
                return false;
        }
    }

    __findTileAfterMovementAssist(unit, target, tile) {
        if (!unit.hasSupport) {
            return new MovementAssistResult(false, null, null);
        }

        switch (unit.support) {
            case Support.ToChangeFate:
            case Support.ReturnPlus:
            case Support.Return:
            case Support.Reposition:
                return this.__findTileAfterReposition(unit, target, tile);
            case Support.Smite:
                return this.__findTileAfterSmite(unit, target, tile);
            case Support.NudgePlus:
            case Support.Nudge:
            case Support.Shove:
                return this.__findTileAfterShove(unit, target, tile);
            case Support.RescuePlus:
            case Support.Rescue:
            case Support.Drawback:
                return this.__findTileAfterDrawback(unit, target, tile);
            case Support.Swap:
            case Support.FutureVision:
                return this.__findTileAfterSwap(unit, target, tile);
            case Support.Pivot:
                return this.__findTileAfterPivot(unit, target, tile);
            default:
                this.writeErrorLine(`unknown support ${unit.supportInfo.name}`);
                return new MovementAssistResult(false, null, null);
        }
    }

    __applySupportSkill(supporterUnit, targetUnit) {
        switch (supporterUnit.supportInfo.assistType) {
            case AssistType.Refresh:
                return this.__applyRefresh(supporterUnit, targetUnit);
            case AssistType.Heal:
                if (supporterUnit.support == Support.Sacrifice) {
                    let healAmount = Math.min(targetUnit.currentDamage, supporterUnit.hp - 1);
                    if (healAmount > 0) {
                        targetUnit.heal(healAmount);
                        supporterUnit.takeDamage(healAmount, true);
                        this.writeSimpleLogLine(`${targetUnit.getNameWithGroup()}は${healAmount}回復`);
                    }
                    return healAmount > 0 || this.__executeHarshCommand(targetUnit);
                }
                else {
                    let isActivated = this.__applyHeal(supporterUnit, targetUnit);
                    switch (supporterUnit.support) {
                        case Support.RescuePlus:
                        case Support.Rescue:
                        case Support.ReturnPlus:
                        case Support.Return:
                        case Support.NudgePlus:
                        case Support.Nudge:
                            isActivated |= this.__applyMovementAssist(supporterUnit, targetUnit,
                                (unit, target, tile) => this.__findTileAfterMovementAssist(unit, target, tile));
                    }
                    return isActivated;
                }
            case AssistType.Restore:
                return this.__applyHeal(supporterUnit, targetUnit);
            case AssistType.Rally:
                switch (supporterUnit.support) {
                    case Support.RallyUpAtk:
                    case Support.RallyUpAtkPlus:
                    case Support.RallyUpSpd:
                    case Support.RallyUpSpdPlus:
                    case Support.RallyUpRes:
                    case Support.RallyUpResPlus:
                        return this.__applyRallyUp(supporterUnit, targetUnit);
                    case Support.HarshCommandPlus:
                        targetUnit.clearNegativeStatusEffects();
                        return this.__executeHarshCommand(targetUnit);
                    case Support.HarshCommand:
                        return this.__executeHarshCommand(targetUnit);
                    default:
                        if (this.__applyRally(supporterUnit, targetUnit)) { return true; } return false;
                }
            case AssistType.Move:
                return this.__applyMovementAssist(supporterUnit, targetUnit,
                    (unit, target, tile) => this.__findTileAfterMovementAssist(unit, target, tile));
            case AssistType.DonorHeal:
                switch (supporterUnit.support) {
                    case Support.ReciprocalAid:
                        {
                            if (!this.__canApplyReciprocalAid(supporterUnit, targetUnit)) {
                                return false;
                            }

                            let tmpHp = supporterUnit.hp;
                            supporterUnit.setHpInValidRange(targetUnit.hp);
                            targetUnit.setHpInValidRange(tmpHp);
                            return true;
                        }
                    case Support.ArdentSacrifice:
                        {
                            if (!targetUnit.canHeal()) {
                                return false;
                            }

                            supporterUnit.takeDamage(10, true);
                            targetUnit.heal(10);
                            return true;
                        }
                    default:
                        return false;
                }
        }
    }

    __canApplyReciprocalAid(supporterUnit, targetUnit) {
        if (supporterUnit.hp == targetUnit.hp) {
            return false;
        }

        if (supporterUnit.hp < targetUnit.hp
            && supporterUnit.hasStatusEffect(StatusEffectType.DeepWounds)
        ) {
            return false;
        }

        if (supporterUnit.hp > targetUnit.hp
            && targetUnit.hasStatusEffect(StatusEffectType.DeepWounds)
        ) {
            return false;
        }

        return true;
    }

    __endAllUnitAction(groupId) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (!unit.isOnMap) {
                continue;
            }
            unit.endAction();
        }
        this.__goToNextPhaseIfAllActionDone(groupId);
    }

    endUnitAction(unit) {
        unit.endAction();
        this.__goToNextPhaseIfAllActionDone(unit.groupId);
    }

    __endUnitActionOrActivateCanto(unit) {
        unit.endAction();

        // 再移動の評価
        this.__activateCantoIfPossible(unit);

        this.__goToNextPhaseIfAllActionDone(unit.groupId);
    }

    __goToNextPhaseIfAllActionDone(groupId) {
        if (groupId == UnitGroupType.Ally) {
            if (!this.__isThereActionableAllyUnit()) {
                // 味方全員の行動が終了したので敵ターンへ
                this.simulateBeginningOfEnemyTurn();
            }
        }
        else {
            if (!this.__isThereActionableEnemyUnit()) {
                // 敵全員の行動が終了したので自ターンへ
                this.simulateBeginningOfAllyTurn();
            }
        }
    }

    convertItemIndexToTabIndex(itemIndex) {
        if (itemIndex < this.vm.enemyUnits.length) {
            return itemIndex;
        }

        let enemyOffset = (MaxEnemyUnitCount - this.vm.enemyUnits.length);
        if (itemIndex < (MaxEnemyUnitCount + this.vm.allyUnits.length)) {
            return itemIndex - enemyOffset;
        }

        let allyOffset = (MaxAllyUnitCount - this.vm.allyUnits.length);
        return itemIndex - (enemyOffset + allyOffset);
    }

    logAllItemInfos() {
        for (let item of g_appData.enumerateItems()) {
            let index = g_appData.findIndexOfItem(item.id);
            this.writeDebugLogLine(`${item.id}: index=${index}`);
        }
    }

    selectItem(targetId, add = false) {
        this.showItemInfo(targetId);

        let tabIndex = this.convertItemIndexToTabIndex(this.vm.currentItemIndex);
        changeCurrentUnitTab(tabIndex);
        if (add) {
            g_appData.selectAddCurrentItem();
        } else {
            g_appData.selectCurrentItem();
        }
        g_appData.__showStatusToAttackerInfo();
    }
    selectItemToggle(targetId) {
        let item = g_appData.findItemById(targetId);
        if (item == null) {
            return;
        }

        if (item.isSelected) {
            item.isSelected = false;
            let selectedItems = g_appData.getSelectedItems();
            if (selectedItems.length == 0) {
                this.selectItem(-1, true);
            }
            else {
                this.selectItem(selectedItems[0].id, true);
            }
        }
        else {
            this.selectItem(targetId, true);
        }
    }
}

// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================

const OwnerType = {
    Map: 0,
    DefenceStorage: 1,
    OffenceStorage: 2,
    TrashBox: 3,
};

let g_trashArea = new StructureContainer('trashArea');
let g_app = new AetherRaidTacticsBoard();

function removeTouchEventFromDraggableElements() {
    let draggableItems = $(".draggable-elem");
    for (let i = 0; i < draggableItems.length; ++i) {
        let item = draggableItems[i];
        item.removeEventListener('touchstart', touchStartEvent, { passive: false });
        item.removeEventListener('touchmove', touchMoveEvent, { passive: false });
        item.removeEventListener('touchend', touchEndEvent, { passive: true });
    }
}

function addTouchEventToDraggableElements() {
    // ドラッグ可能アイテムへのタッチイベントの設定
    let draggableItems = $(".draggable-elem");
    for (let i = 0; i < draggableItems.length; ++i) {
        let item = draggableItems[i];
        item.addEventListener('touchstart', touchStartEvent, { passive: false });
        item.addEventListener('touchmove', touchMoveEvent, { passive: false });
        item.addEventListener('touchend', touchEndEvent, { passive: true });
    }
}

function moveStructureToMap(structure, x, y) {
    let success = g_appData.map.exchangeObj(structure, Number(x), Number(y));
    if (!success) {
        success = g_appData.map.placeObj(structure, Number(x), Number(y));
        if (!success) {
            g_appData.map.placeObjToEmptyTile(structure);
        }
    }
    g_deffenceStructureContainer.removeStructure(structure);
    g_offenceStructureContainer.removeStructure(structure);
    g_trashArea.removeStructure(structure);
}

function moveStructureToTrashBox(structure) {
    removeFromAll(structure);
    g_trashArea.addStructure(structure);
}

function moveStructureToDefenceStorage(structure) {
    removeFromAll(structure);
    g_deffenceStructureContainer.addStructure(structure);
}

function moveStructureToOffenceStorage(structure) {
    removeFromAll(structure);
    g_offenceStructureContainer.addStructure(structure);
}

function moveStructureToEmptyTileOfMap(structure) {
    g_appData.map.placeObjToEmptyTile(structure);
    g_trashArea.removeStructure(structure);
    g_deffenceStructureContainer.removeStructure(structure);
    g_offenceStructureContainer.removeStructure(structure);
}

function isMapTileId(id) {
    return id.includes('_');
}

function removeFromAll(structure) {
    g_appData.map.removeObj(structure);
    g_appData.map.removeUnit(structure);
    g_trashArea.removeStructure(structure);
    g_deffenceStructureContainer.removeStructure(structure);
    g_offenceStructureContainer.removeStructure(structure);
}

function moveUnitToTrashBox(unit) {
    // console.log(unit.getNameWithGroup() + "を使用済みへ移動");
    removeFromAll(unit);
    g_trashArea.addStructure(unit);
    unit.ownerType = OwnerType.TrashBox;
}

function moveUnitToMap(unit, x, y, endsActionIfActivateTrap = false) {
    let moveResult = placeUnitToMap(unit, x, y, endsActionIfActivateTrap);
    g_trashArea.removeStructure(unit);
    return moveResult;
}

function moveUnitToEmptyTileOfMap(unit) {
    let moveResult = placeUnitToMap(unit, 0, 0);
    g_trashArea.removeStructure(unit);
    return moveResult;
}

function moveUnit(unit, tile, endsActionIfActivateTrap = false) {
    return moveUnitToMap(unit, tile.posX, tile.posY, endsActionIfActivateTrap);
}

// 罠発動ならfalse、そうでなければtrueを返します
function placeUnitToMap(unit, x, y, endsActionIfActivateTrap = false) {
    g_appData.map.placeUnit(unit, x, y);
    unit.ownerType = OwnerType.Map;

    // updateAllUnitSpur();
    if (unit.placedTile == null) {
        console.error(`could not place unit to map (${x}, ${y})`);
        console.log(unit);
        return;
    }

    let tile = unit.placedTile;
    let obj = tile.obj;
    let result = MoveResult.Success;
    if (unit.groupId == UnitGroupType.Ally && obj instanceof TrapBase) {
        // トラップ床発動
        if (obj.isExecutable) {
            if (unit.passiveB != PassiveB.Wanakaijo3) {
                if (endsActionIfActivateTrap) {
                    g_app.endUnitAction(unit);
                }

                g_app.audioManager.playSoundEffect(SoundEffectId.Trap);
                g_app.executeStructure(obj);
                if (obj instanceof HeavyTrap) {
                    result = MoveResult.HeavyTrapActivated;
                }
                else if (obj instanceof BoltTrap) {
                    result = MoveResult.BoltTrapActivated;
                }
            }
        }

        moveStructureToTrashBox(obj);
    }

    return result;
}

function moveToDefault(target) {
    if (target instanceof BreakableWall) {
        // todo: 面倒でなければマップ種類別の初期値に戻す
        return;
    }
    else if (target instanceof OffenceStructureBase) {
        if (target.isRequired) {
            for (let x = 0; x < 6; ++x) {
                let tile = g_appData.map.getTile(x, 7);
                if (tile.isObjPlacable()) {
                    moveStructureToMap(target, x, 7);
                    break;
                }
            }
        }
        else {
            moveStructureToOffenceStorage(target);
        }
        return;
    }
    else if (target instanceof DefenceStructureBase) {
        if (target.isRequired) {
            for (let x = 0; x < 6; ++x) {
                let tile = g_appData.map.getTile(x, 0);
                if (tile.isObjPlacable()) {
                    moveStructureToMap(target, x, 0);
                    break;
                }
            }
        }
        else {
            moveStructureToDefenceStorage(target);
        }
        return;
    }
    else if (target instanceof Unit) {
        moveUnitToEmptyTileOfMap(target);
        return;
    }
}

function syncSelectedTileColor() {
    for (let item of g_appData.enumerateItems()) {
        if (item.placedTile == null) {
            continue;
        }

        if (item.isSelected) {
            updateCellBgColor(item.posX, item.posY, SelectedTileColor);
        }
        else {
            let cell = new Cell();
            g_appData.map.setCellStyle(item.placedTile, cell);
            updateCellBgColor(item.posX, item.posY, cell.bgColor);
        }
    }
}

function updateMapUi() {
    let mapArea = document.getElementById('mapArea');
    if (mapArea == null) {
        return;
    }

    g_appData.map.updateTiles();
    let table = g_appData.map.toTable();
    table.onDragOverEvent = "f_dragover(event)";
    table.onDropEvent = "f_drop(event)";
    table.onDragEndEvent = "table_dragend(event)";
    let tableElem = table.updateTableElement();
    if (mapArea.childElementCount == 0) {
        mapArea.appendChild(tableElem);
    }
    syncSelectedTileColor();
}

function updateMap() {
    if (g_disableUpdateUi) {
        return;
    }

    removeTouchEventFromDraggableElements();
    updateMapUi();
    addTouchEventToDraggableElements();
}

function changeMap() {
    let mapKind = g_app.vm.mapKind;
    let gameVersion = g_app.vm.gameVersion;
    g_appData.map.changeMapKind(mapKind, gameVersion);
    updateMap();
}

function removeBreakableWallsFromTrashbox() {
    for (let structure of g_appData.map.enumerateBreakableWalls()) {
        moveStructureToEmptyTileOfMap(structure);
    }
}

function createMap() {
    resetPlacementOfStructures();
    resetPlacementOfUnits();
}

function resetPlacementForArena() {
    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
        moveStructureToDefenceStorage(structure);
    }
    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
        moveStructureToOffenceStorage(structure);
    }

    removeAllUnitsFromMap();

    for (let obj of g_appData.map.enumerateBreakableWallsOfCurrentMapType()) {
        moveStructureToMap(obj);
    }

    resetPlacementOfUnits();
    g_appData.map.resetPlacement(true);
}

function resetPlacementOfStructures() {
    // 攻撃施設は大体毎回同じなのでリセットしない
    // リセット位置が重なって不定になるのを防ぐために最初に取り除く
    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
        moveStructureToDefenceStorage(structure);
    }

    removeAllUnitsFromMap();

    for (let obj of g_appData.map.enumerateBreakableWallsOfCurrentMapType()) {
        moveStructureToMap(obj);
    }

    g_appData.map.resetPlacement();

    // 施設を施設置き場へ移動
    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
        moveToDefault(structure);
    }

    // 攻撃施設も必須のものがマップになければ配置する
    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
        if (!structure.isRequired) {
            continue;
        }

        if (!g_appData.map.isObjAvailable(structure)) {
            moveToDefault(structure);
        }
    }
}

function resetPlacementOfUnits() {
    removeAllUnitsFromMap();

    // 英雄を初期値に配置
    {
        let posX = 0;
        let posY = 1;
        if (g_appData.gameMode == GameMode.PawnsOfLoki) {
            posY = 0;
        }
        for (let unit of g_app.enumerateEnemyUnits()) {
            moveUnitToMap(unit, posX, posY);
            ++posX;
            if (posX == g_app.map.width) {
                posX = 0;
                ++posY;
            }
        }
    }

    {
        let posX = 0;
        let posY = g_app.map.height - 2;
        let maxCount = 100;
        if (g_appData.gameMode == GameMode.PawnsOfLoki) {
            posY = g_app.map.height - 1;
            maxCount = 8;
        }

        let count = 0;
        for (let unit of g_app.enumerateAllyUnits()) {
            if (count >= maxCount) {
                moveUnitToTrashBox(unit);
            }
            else {
                moveUnitToMap(unit, posX, posY);
                ++posX;
                if (posX == g_app.map.width) {
                    posX = 0;
                    --posY;
                }
            }

            ++count;
        }
    }
}

function resetPlacement() {
    g_appData.clearReservedSkillsForAllUnits();

    switch (g_appData.gameMode) {
        case GameMode.AetherRaid:
            resetPlacementOfStructures();
            resetPlacementOfUnits();
            break;
        case GameMode.Arena:
            resetPlacementForArena();
            break;
        case GameMode.ResonantBattles:
            resetPlacementForArena();
            break;
        case GameMode.TempestTrials:
            resetPlacementForArena();
            break;
        case GameMode.PawnsOfLoki:
            resetPlacementForArena();
            break;
    }
    updateAllUi();
}

function removeAllObjsFromMap() {
    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
        moveStructureToDefenceStorage(structure);
    }

    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
        moveStructureToOffenceStorage(structure);
    }
}

function removeAllUnitsFromMap() {
    for (let unit of g_app.enumerateAllUnits()) {
        // console.log(`remove ${unit.id}`);
        // moveUnitToTrashBox(unit);
        removeFromAll(unit);
    }
}

let g_disableUpdateUi = false;
function updateAllUi() {
    if (g_disableUpdateUi) {
        return;
    }

    changeMap();
    removeTouchEventFromDraggableElements();
    g_offenceStructureContainer.updateUi();
    g_deffenceStructureContainer.updateUi();
    g_trashArea.updateUi();
    updateMapUi();
    addTouchEventToDraggableElements();
}

function __updateChaseTargetTilesForAllUnits() {
    if (g_appData.currentTurn > 0) {
        g_app.__updateChaseTargetTiles(g_appData.allyUnits);
        g_app.__updateChaseTargetTiles(g_appData.enemyUnits);
    }
}

function loadSettings() {
    console.log("loading..");
    console.log("current cookie:" + document.cookie);
    g_app.settings.loadSettings();
    if (g_appData.gameMode == GameMode.ResonantBattles) {
        g_app.__setUnitsForResonantBattles();
    }
    g_app.updateAllUnitSpur();

    let turnText = g_appData.currentTurn == 0 ? "戦闘開始前" : "ターン" + g_appData.currentTurn;
    g_app.writeSimpleLogLine(turnText + "の設定を読み込みました。");
    g_appData.commandQueuePerAction.clear();
    __updateChaseTargetTilesForAllUnits();
    updateAllUi();
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
    g_app.settings.loadSettingsFromDict(settingDict,
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
    g_app.settings.saveSettings();
    console.log("current cookie:" + document.cookie);
    g_app.writeSimpleLogLine("ターン" + g_appData.currentTurn + "の設定を保存しました。");
}

function exportSettingsAsString(
    loadsAllies = true, loadsEnemies = true, loadsOffenceStructures = true, loadsDefenseStructures = true,
    exportsMapSettings = false,
) {
    let dict = g_app.settings.convertCurrentSettingsToDict(loadsAllies, loadsEnemies, loadsOffenceStructures, loadsDefenseStructures, exportsMapSettings);
    let result = "";
    for (let key in dict) {
        let settingText = dict[key];
        result += key + "=" + settingText + ";";
    }

    return g_appData.compressSetting(result);
}

function exportPerTurnSettingAsString(
    loadsAllies = true, loadsEnemies = true, loadsOffenceStructures = true, loadsDefenseStructures = true
) {
    let turnSetting = g_app.settings.convertToPerTurnSetting(loadsAllies, loadsEnemies, loadsOffenceStructures, loadsDefenseStructures);
    return turnSetting.perTurnStatusToString();
}

function importPerTurnSetting(perTurnSettingAsString, updatesChaseTarget = true) {
    let currentTurn = g_appData.currentTurn;
    let turnSetting = new TurnSetting(currentTurn);
    let dict = {};
    dict[turnSetting.serialId] = perTurnSettingAsString;
    loadSettingsFromDict(dict, true, true, true, true, false, false, updatesChaseTarget);
}

function importSettingsFromString(
    inputText,
    loadsAllySettings = true,
    loadsEnemySettings = true,
    loadsOffenceSettings = true,
    loadsDefenceSettings = true,
    loadsMapSettings = false
) {
    console.log("loadsAllySettings = " + loadsAllySettings);
    console.log("loadsEnemySettings = " + loadsEnemySettings);

    let decompressed = g_appData.decompressSettingAutomatically(inputText);
    console.log(`decompressed: ${decompressed}`);
    let settings = decompressed.split(';');
    let dict = {};
    let currentTurn = g_app.vm.currentTurn;
    let turnSetting = new TurnSetting(currentTurn);
    for (let setting of settings) {
        let idAndValue = setting.split('=');
        let id = idAndValue[0];
        if (id.startsWith(TurnSettingCookiePrefix)) {
            // 他のターンの設定だった場合、現在のターンに置き換える
            id = turnSetting.serialId;
        }

        let value = setting.substring(idAndValue[0].length + 1).trim();
        dict[id] = value;
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


function initAetherRaidBoard(
    heroInfos
) {
    using(new ScopedStopwatch(time => g_app.writeDebugLogLine("マップの初期化: " + time + " ms")), () => {
        createMap();

        // 全ユニットをアルフォンスで初期化
        let defaultHeroIndex = 18;
        g_app.resetUnits(defaultHeroIndex);
    });

    using(new ScopedStopwatch(time => g_app.writeDebugLogLine("保存状態の復元: " + time + " ms")), () => {
        // g_app.resetUnitsForTesting();
        loadSettings();
    });
}
