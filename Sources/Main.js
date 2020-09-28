
function drawImage(canvas, imageData, scale) {
    const tempCanvas = document.getElementById("tempCanvas");
    let tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempCtx.putImageData(imageData, 0, 0);

    let ctx = canvas.getContext("2d");
    canvas.width = imageData.width * scale;
    canvas.height = imageData.height * scale;
    ctx.drawImage(tempCanvas, 0, 0,
        imageData.width, imageData.height,
        0, 0, canvas.width, canvas.height);
}

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

        this.settings = new Setting();

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
                aetherRaidDefensePresetChanged: function () {

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
                    // g_app.__showStatusToAttackerInfo();
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
                    g_app.__showStatusToAttackerInfo();
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
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    unit.resetMaxSpecialCount();
                    self.updateAllUnitSpur();
                    g_appData.updateArenaScore(unit);
                },
                supportChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    self.__updateUnitSkillInfo(unit);
                    g_appData.updateArenaScore(unit);
                },
                specialChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    self.__updateUnitSkillInfo(unit);
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
                    g_app.__showStatusToAttackerInfo();
                    updateAllUi();
                },
                passiveAChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                    g_app.updateAllUnitSpur();
                    g_appData.updateArenaScore(unit);
                },
                passiveBChanged: function () {
                    if (g_app == null) { return; }
                    let unit = g_app.__getCurrentUnit();
                    if (unit == null) { return; }
                    g_app.__updateUnitSkillInfo(unit);
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
                slotOrderChanged: function () {
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
                    g_app.__showStatusToAttackerInfo();
                    updateAllUi();
                },
                healHpFullForAllUnits: function () {
                    if (g_app == null) { return; }
                    for (let unit of this.units) {
                        unit.resetAllState();
                    }
                    g_app.__showStatusToAttackerInfo();
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
                    self.examinesAttackableEnemies();
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

                    let image = new Image();
                    let reader = new FileReader();
                    reader.onload = function (evt) {
                        image.onload = function () {
                            let scaledWidth = 200;
                            let scale = scaledWidth / image.width;
                            // scale = 1;
                            let imageData = null;
                            {
                                const canvas = document.getElementById("ocrSettingSourceCanvas");
                                {
                                    let ctx = canvas.getContext("2d");
                                    canvas.width = image.width;
                                    canvas.height = image.height;
                                    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
                                    imageData = ctx.getImageData(0, 0, image.width, image.height);

                                    drawImage(canvas, imageData, scale);
                                }
                                if (g_app.cropper != null) {
                                    g_app.cropper.destroy();
                                }
                                let croppedHeight = canvas.width * (16.0 / 9.0);
                                let croppedWidth = canvas.width;
                                if (croppedHeight > canvas.height) {
                                    // 横幅が広すぎるケース
                                    croppedHeight = canvas.height;
                                    croppedWidth = canvas.height * (9.0 / 16.0);
                                }
                                g_app.cropper = new Cropper(canvas, {
                                    aspectRatio: 9 / 16,
                                    movable: false,
                                    scalable: false,
                                    zoomable: false,
                                    autoCrop: true,
                                    data: {
                                        height: canvas.height,
                                        // width: croppedWidth, // widthを設定すると画像が横長の時に中央でなくなる
                                        x: (canvas.width - croppedWidth) / 2,
                                        y: (canvas.height - croppedHeight) / 2,
                                    },
                                    crop: function (event) {
                                        g_appData.ocrCropX = event.detail.x / scale;
                                        g_appData.ocrCropY = event.detail.y / scale;
                                        const croppedCanvas = document.getElementById("ocrSettingCroppedCanvas");
                                        {
                                            let ctx = croppedCanvas.getContext("2d");
                                            croppedCanvas.width = croppedWidth;
                                            croppedCanvas.height = croppedHeight;
                                            ctx.drawImage(image,
                                                event.detail.x / scale, event.detail.y / scale, event.detail.width / scale, event.detail.height / scale,
                                                0, 0, croppedCanvas.width, croppedCanvas.height
                                            );
                                        }
                                    }
                                });
                            }
                        }

                        image.src = evt.target.result;
                    }

                    let file = files[0]
                    reader.readAsDataURL(file);
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

    updateArenaScoreForAllUnits() {
        for (let unit of this.enumerateAllUnits()) {
            g_appData.updateArenaScoreOfUnit(unit);
        }
        g_appData.updateArenaScore();
    }

    get audioManager() {
        return this.vm.audioManager;
    }

    canActivateDuoSkillOrHarmonizedSkill(duoUnit) {
        if (!duoUnit.isDuoHero && !duoUnit.isHarmonicHero) {
            return false;
        }

        if (duoUnit.isDuoOrHarmonicSkillActivatedInThisTurn) {
            return false;
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
            for (let targetOrigin of targetOrigins) {
                if (origin == targetOrigin) {
                    return true;
                }
            }
        }
        return false;
    }

    __activateDuoOrHarmonizedSkill(duoUnit) {
        if (!this.canActivateDuoSkillOrHarmonizedSkill(duoUnit)) {
            return;
        }
        switch (duoUnit.heroIndex) {
            case Hero.PirateVeronica:
                {
                    let targetOrigins = duoUnit.heroInfo.origin.split('|');
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit, true)) {
                        if (this.__areSameOrigin(unit, targetOrigins)) {
                            unit.addStatusEffect(StatusEffectType.ResonantShield);
                        }
                    }
                }
                break;
            case Hero.SummerMia:
                {
                    let targetOrigins = duoUnit.heroInfo.origin.split('|');
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit, true)) {
                        if (this.__areSameOrigin(unit, targetOrigins)) {
                            unit.addStatusEffect(StatusEffectType.ResonantBlades);
                        }
                    }
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
                    unit.heal(30);
                    unit.clearNegativeStatusEffects();
                    unit.resetDebuffs();
                    unit.applyAtkBuff(6);
                    unit.applySpdBuff(6);
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

    setMapByImage(file) {
        let self = this;
        loadAndProcessImage(file, image => {
            const croppedCanvas = document.getElementById("croppedImage");
            let croppedWidth = image.width - self.vm.ocrCropX * 2;
            let croppedHeight = croppedWidth * (16.0 / 9.0);
            let croppedPointY = self.vm.ocrCropY + croppedHeight * 0.15;
            let scale = 1136.0 / croppedHeight; // テンプレート画像が640x1136から切り出したものを使ってるのでサイズを合わせる必要がある

            // 飛空城マップの場合はオフェンスのマスは切り取る
            let cropHeightRatio = 0.28;
            if (g_appData.gameMode == GameMode.Arena) {
                // 闘技場の場合はマップ全体が残るよう切り取る
                cropHeightRatio = cropHeightRatio / 3.0;
            }

            const topCropHeightRatio = 0.15;
            self.__drawCroppedImage(image, croppedCanvas,
                self.vm.ocrCropX, croppedPointY,
                croppedWidth, croppedHeight - croppedHeight * topCropHeightRatio - croppedHeight * cropHeightRatio,
                scale);

            self.clearSimpleLog();

            for (let st of this.vm.defenseStructureStorage.objs) {
                moveToDefault(st);
            }

            if (g_appData.gameMode == GameMode.Arena) {
                let minSum = Number.MAX_VALUE;
                let minMapType = MapType.Arena_1;

                let iterMax = 0
                iterMax += self.vm.arenaMapImageFiles.length;
                startProgressiveProcess(iterMax,
                    function (iter) {
                        // 地形タイプ判別
                        let mapImageFile = self.vm.arenaMapImageFiles[iter];
                        let sum = self.__calcAbsDiffOfImages(croppedCanvas, mapImageFile);
                        if (sum < minSum) {
                            minSum = sum;
                            minMapType = mapImageFile.id;
                        }
                    },
                    function (iter, iterMax) {
                        $("#progress").progressbar({
                            value: iter,
                            max: iterMax,
                        });
                    },
                    function () {
                        $("#progress").progressbar({ disabled: true });
                        self.writeSimpleLogLine(`地形は${g_appData.getLabelOfMap(minMapType)}`);
                        g_app.vm.mapKind = minMapType;
                        changeMap();
                        resetPlacement();
                    });
            }
            else {
                let minSum = Number.MAX_VALUE;
                let minMapType = MapType.Izumi;

                let iterMax = self.vm.templateImageFiles.length;
                self.vm.debugTemplateIndex = Number(self.vm.debugTemplateIndex);
                if (self.vm.debugTemplateIndex >= 0) {
                    iterMax = self.vm.debugTemplateCount;
                }

                let isDebugModeEnabled = self.vm.debugTemplateIndex >= 0;

                if (!isDebugModeEnabled) {
                    iterMax += self.vm.mapImageFiles.length;
                }

                let matchedPoints = {};
                startProgressiveProcess(iterMax,
                    function (iter) {
                        if (!isDebugModeEnabled && iter < self.vm.mapImageFiles.length) {
                            // 地形タイプ判別
                            let mapImageFile = self.vm.mapImageFiles[iter];
                            let sum = self.__calcAbsDiffOfImages(croppedCanvas, mapImageFile);
                            if (sum < minSum) {
                                minSum = sum;
                                minMapType = mapImageFile.id;
                            }
                        }
                        else {
                            let templateIndex = iter - self.vm.mapImageFiles.length;
                            if (isDebugModeEnabled) {
                                templateIndex = self.vm.debugTemplateIndex + iter;
                            }
                            self.__templateMatch(templateIndex, croppedCanvas, matchedPoints);
                        }
                    },
                    function (iter, iterMax) {
                        $("#progress").progressbar({
                            value: iter,
                            max: iterMax,
                        });

                        if (iter == self.vm.mapImageFiles.length) {
                            self.writeSimpleLogLine(`地形は${g_appData.getLabelOfMap(minMapType)}`);
                            g_app.vm.mapKind = minMapType;
                            changeMap();
                        }

                        if (iter >= self.vm.mapImageFiles.length) {
                            updateAllUi();
                        }
                    },
                    function () {
                        $("#progress").progressbar({ disabled: true });

                        // トラップは2つあるので片方のインスタンスを本物トラップに置き換える
                        let boltTrapPoints = self.__getSortedMatchedPoints(matchedPoints, st => st instanceof FalseBoltTrap);
                        self.__updateStructureInstanceOfSortedMatchedPoints(boltTrapPoints,
                            x => x instanceof FalseBoltTrap || x instanceof BoltTrap,
                            (st, point) => { });
                        let heavyTrapPoints = self.__getSortedMatchedPoints(matchedPoints, st => st instanceof FalseHeavyTrap);
                        self.__updateStructureInstanceOfSortedMatchedPoints(heavyTrapPoints,
                            x => x instanceof FalseHeavyTrap || x instanceof HeavyTrap,
                            (st, point) => { });

                        let ornamentPoints = self.__getSortedMatchedPoints(matchedPoints, st => st instanceof Ornament);
                        self.__updateStructureInstanceOfSortedMatchedPoints(ornamentPoints,
                            x => x instanceof Ornament,
                            (st, point) => {
                                st.ornamentTypeIndex = findOrnamentTypeIndexByIcon(point[4]);
                                st.setIconByOrnamentTypeIndex();
                            });

                        for (let pointKey in matchedPoints) {
                            let point = matchedPoints[pointKey];
                            if (point[3] == null) {
                                continue;
                            }

                            let posX = point[0];
                            let posY = point[1];

                            let targetTile = g_appData.map.getTile(posX, posY);
                            if (targetTile != null && targetTile.obj != null) {
                                moveToDefault(targetTile.obj);
                            }

                            let thisTileStructure = point[3];
                            moveStructureToMap(thisTileStructure, posX, posY);
                        }

                        updateAllUi();
                    });
            }
        });
    }

    __calcAbsDiffOfImages(croppedCanvas, mapImageFile) {
        let imreadMode = cv.IMREAD_COLOR; // cv.IMREAD_GRAYSCALE
        let src1 = cv.imread(croppedCanvas, imreadMode);
        let src2 = cv.imread(mapImageFile.fileName, imreadMode);
        let shrinkDiv = Number(this.vm.imageSizeShrinkDiv);
        cv.resize(src1, src1, new cv.Size(src1.cols / shrinkDiv, src1.rows / shrinkDiv), 0, 0, cv.INTER_AREA);
        cv.resize(src2, src2, new cv.Size(src1.cols, src1.rows), 0, 0, cv.INTER_AREA);

        let dst = new cv.Mat();
        cv.absdiff(src1, src2, dst);
        cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);
        let sum = 0;
        let channels = 1;
        // console.log(`dst.rows = ${dst.rows}, dst.cols = ${dst.cols}, dst.channels = ${dst.channels()}, dst.type = ${matTypeToString(dst)}`);
        for (let y = 0; y < dst.rows; y++) {
            for (let x = 0; x < dst.cols; x++) {
                for (let c = 0; c < channels; ++c) {
                    sum += dst.ucharPtr(y, x)[c];
                }
            }
        }

        src1.delete();
        src2.delete();
        dst.delete();
        this.writeSimpleLogLine(`入力画像と${mapImageFile.fileName}の差の絶対値総和は${sum}`);
        return sum;
    }

    __getSortedMatchedPoints(matchedPoints, predicatorFunc) {
        let sortedPoints = [];
        for (let pointKey in matchedPoints) {
            let point = matchedPoints[pointKey];
            let st = point[3];
            if (predicatorFunc(st)) {
                sortedPoints.push(point);
            }
        }
        sortedPoints.sort(function (a, b) {
            return b[2] - a[2];
        });
        return sortedPoints;
    }

    __updateStructureInstanceOfSortedMatchedPoints(sortedTargetMatchedPoints, predicateFunc, postSetFunc) {
        let structures = g_appData.getDefenceStructures(x => predicateFunc(x));
        for (let i = 0; i < sortedTargetMatchedPoints.length; ++i) {
            console.log(`[${i}]` + sortedTargetMatchedPoints[i][4] + ": value = " + sortedTargetMatchedPoints[i][2]);
            if (i < structures.length) {
                let structure = structures[i];
                sortedTargetMatchedPoints[i][3] = structure;
                postSetFunc(structure, sortedTargetMatchedPoints[i]);
            }
            else {
                sortedTargetMatchedPoints[i][3] = null;
            }
        }
    }

    __getTemplateMatchMethod() {
        switch (this.vm.templateMatchMethod) {
            case 0: return cv.TM_SQDIFF;
            case 1: return cv.TM_SQDIFF_NORMED;
            case 2: return cv.TM_CCORR;
            case 3: return cv.TM_CCORR_NORMED;
            case 4: return cv.TM_CCOEFF;
            case 5: return cv.TM_CCOEFF_NORMED;
            default: return cv.TM_CCOEFF;
        }
    }

    __templateMatch(templateIndex, croppedCanvas, matchedPoints) {
        const templateMatchingOutputCanvas = document.getElementById("templateMatchingOutputImage");
        this.vm.currentTemplateIndex = templateIndex;
        let templateImageFileName = this.vm.templateImageFiles[templateIndex];
        this.writeSimpleLogLine(`${templateImageFileName}を画像から抽出...`);
        let structure = this.__findStructureByIconFileName(templateImageFileName);
        if (structure == null) {
            // アイコンに該当する施設が存在しない
            return;
        }

        let imgId = templateImageFileName;
        let src = cv.imread(croppedCanvas);
        let templ = cv.imread(imgId);
        let mask = new cv.Mat();
        let dst = new cv.Mat();
        let method = this.__getTemplateMatchMethod();

        if (!(method == cv.TM_SQDIFF || method == cv.TM_CCORR_NORMED)) {
            mask = new cv.Mat();
        }
        cv.matchTemplate(
            src,
            templ,
            dst,
            method,
            mask);
        let result = cv.minMaxLoc(dst, new cv.Mat());

        let maxCorrPoint;
        let valueMult = 1;
        if (method == cv.TM_SQDIFF
            || method == cv.TM_SQDIFF_NORMED
        ) {
            // 不等号が揃うように-1を乗算
            valueMult = -1;
            maxCorrPoint = result.minLoc;
        }
        else {
            maxCorrPoint = result.maxLoc;
        }

        let color = new cv.Scalar(255, 0, 0, 255);

        let maxCorrValue = dst.floatAt(maxCorrPoint.y, maxCorrPoint.x) * valueMult;
        this.writeSimpleLogLine(`最大相関値=${maxCorrValue}`);

        const mapWidth = g_appData.map.width;
        const mapHeight = g_appData.map.height - 2;
        const unitWidth = croppedCanvas.width / mapWidth;
        const unitHeight = croppedCanvas.height / mapHeight;
        const halfUnitWidth = unitWidth / 2;
        const halfUnitHeight = unitHeight / 2;

        let threshold = maxCorrValue * this.vm.corrThresholdRate;
        if (method == cv.TM_SQDIFF
            || method == cv.TM_SQDIFF_NORMED
        ) {
            // 適当
            threshold = maxCorrValue * 2;
        }
        let matchedPointsForThisTemplate = {};
        for (let y = 0; y < dst.rows; ++y) {
            for (let x = 0; x < dst.cols; ++x) {
                let value = dst.floatAt(y, x) * valueMult;
                if (Number(value) >= Number(threshold)) {
                    let mapPosX = Math.floor((x + halfUnitWidth) / unitWidth);
                    let mapPosY = Math.floor((y + halfUnitHeight) / unitHeight);
                    let tile = g_appData.map.getTile(mapPosX, mapPosY);
                    if (tile == null || !tile.isStructurePlacable) {
                        continue;
                    }
                    if (this.vm.ignoresUnitTileForAutoMapReplace && tile.placedUnit != null) {
                        continue;
                    }

                    let key = mapPosX + "-" + mapPosY;

                    if (matchedPointsForThisTemplate[key] && matchedPointsForThisTemplate[key][2] > value) {
                        continue;
                    }
                    matchedPointsForThisTemplate[key] = [mapPosX, mapPosY, value, structure, templateImageFileName];
                }
            }
        }

        let matchedCount = Object.keys(matchedPointsForThisTemplate).length;

        this.writeSimpleLogLine(imgId + `に似ているマスが${matchedCount}個見つかりました。`);
        let matchCountThreshold = 1;
        if (structure instanceof TrapBase) {
            // トラップは2つある場合があるのと誤判定しやすいので4にしておく
            matchCountThreshold = 4;
        }

        if (matchedCount <= matchCountThreshold) {
            this.writeSimpleLogLine(`${templateImageFileName}が画像内に見つかりました。`);
            // 辞書を更新
            for (let key in matchedPointsForThisTemplate) {
                let point = matchedPointsForThisTemplate[key];
                if (matchedPoints[key] && matchedPoints[key][2] > point[2]) {
                    continue;
                }

                if (matchedPoints[key]) {
                    this.writeSimpleLogLine(`${matchedPoints[key][3].iconFileName}(${matchedPoints[key][2]})より${point[3].iconFileName}(${point[2]})の相関値が高いので上書きします。`);
                }
                matchedPoints[key] = point;
            }

            for (let pointKey in matchedPoints) {
                let point = matchedPoints[pointKey];

                let posX = point[0];
                let posY = point[1];
                this.writeSimpleLogLine(`(${posX}, ${posY})`);

                let startPoint = new cv.Point(posX * unitWidth, posY * unitHeight);
                let endPoint = new cv.Point(startPoint.x + templ.cols, startPoint.y + templ.rows);
                cv.rectangle(src, startPoint, endPoint, color, 2, cv.LINE_8, 0);

                let targetTile = g_appData.map.getTile(posX, posY);
                if (targetTile != null && targetTile.obj != null) {
                    moveToDefault(targetTile.obj);
                }

                let thisTileStructure = point[3];
                moveStructureToMap(thisTileStructure, posX, posY);
            }
            cv.imshow(templateMatchingOutputCanvas, src);
        }
        else {
            this.writeSimpleLogLine(`${templateImageFileName}は画像内にないと判定されました。`);
        }
        src.delete();
        dst.delete();
        mask.delete();
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

    __drawCroppedImage(image, croppedCanvas, cropX, cropY, cropWidth, cropHeight, scale = 1) {
        let ctx = croppedCanvas.getContext("2d");
        croppedCanvas.width = cropWidth * scale;
        croppedCanvas.height = cropHeight * scale;
        ctx.drawImage(image,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, croppedCanvas.width, croppedCanvas.height
        );
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

    setWeaponRefinementTypeByImage(unit, sourceCanvas, canvas) {
        if (!unit.hasWeapon) {
            return;
        }

        let offsetPercentageX = 0.510;
        let offsetPercentageY = 0.619;
        let widthPercentage = 0.07;
        let heightPercentage = 0.04;
        cropCanvas(sourceCanvas, canvas,
            offsetPercentageX,
            offsetPercentageY,
            widthPercentage,
            heightPercentage
        );
        let src = cv.imread(canvas);
        let mask = new cv.Mat();
        let dst = new cv.Mat();
        let method = cv.TM_CCOEFF_NORMED;
        let values = [];
        for (let imageFile of this.vm.templateWeaponRefinementImageFiles) {
            let templ = cv.imread(imageFile.fileName);
            cv.matchTemplate(
                src,
                templ,
                dst,
                method,
                mask);
            templ.delete();
            let result = cv.minMaxLoc(dst, new cv.Mat());
            let maxCorrPoint = result.maxLoc;
            let maxCorrValue = dst.floatAt(maxCorrPoint.y, maxCorrPoint.x);
            console.log(`${imageFile.fileName}: ` + "maxCorrValue = " + maxCorrValue);
            let threshold = 0.8;
            if (maxCorrValue > threshold) {
                values.push([imageFile.id, maxCorrValue]);
                cv.imshow(canvas, src);
            }
        }

        src.delete();
        dst.delete();
        mask.delete();

        values.sort(function (a, b) {
            return b[1] - a[1];
        });

        let bestOne = WeaponRefinementType.None;
        if (values.length == 0) {
            bestOne = WeaponRefinementType.Special;
            if (unit.weaponInfo.specialRefineHpAdd == 3) {
                bestOne = WeaponRefinementType.Special_Hp3;
            }
        }
        else {
            bestOne = values[0][0];
            switch (bestOne) {
                case WeaponRefinementType.Hp5_Atk2:
                    if (unit.isRangedWeaponType()) {
                        bestOne = WeaponRefinementType.Hp2_Atk1;
                    }
                    break;
                case WeaponRefinementType.Hp5_Spd3:
                    if (unit.isRangedWeaponType()) {
                        bestOne = WeaponRefinementType.Hp2_Spd2;
                    }
                    break;
                case WeaponRefinementType.Hp5_Def4:
                    if (unit.isRangedWeaponType()) {
                        bestOne = WeaponRefinementType.Hp2_Def3;
                    }
                    break;
                case WeaponRefinementType.Hp5_Res4:
                    if (unit.isRangedWeaponType()) {
                        bestOne = WeaponRefinementType.Hp2_Res3;
                    }
                    break;
            }
        }
        unit.weaponRefinement = bestOne;
        g_appData.__updateStatusBySkillsAndMerges(unit);
    }

    setUnitBlessingByImage(unit, sourceCanvas, canvas) {
        if (!unit.canGrantBlessing) {
            return;
        }
        this.writeDebugLogLine(`sourceCanvas.width = ${sourceCanvas.width}, sourceCanvas.height = ${sourceCanvas.height}`);

        // 祝福の判定
        let offsetPercentageX = 0.8;
        let offsetPercentageY = 0.45;
        let widthPercentage = 0.2;
        let heightPercentage = 0.12;
        cropCanvas(sourceCanvas, canvas,
            offsetPercentageX,
            offsetPercentageY,
            widthPercentage,
            heightPercentage
        );
        let src = cv.imread(canvas);
        let mask = new cv.Mat();
        let dst = new cv.Mat();
        let method = cv.TM_CCOEFF_NORMED;
        let values = [];
        for (let imageFile of this.vm.templateBlessingImageFiles) {
            let templ = cv.imread(imageFile.fileName);
            cv.matchTemplate(
                src,
                templ,
                dst,
                method,
                mask);
            templ.delete();
            let result = cv.minMaxLoc(dst, new cv.Mat());
            let maxCorrPoint = result.maxLoc;
            let maxCorrValue = dst.floatAt(maxCorrPoint.y, maxCorrPoint.x);
            this.writeDebugLogLine(`${imageFile.fileName}: ` + "maxCorrValue = " + maxCorrValue);
            let threshold = 0.5;
            if (maxCorrValue > threshold) {
                values.push([imageFile.id, maxCorrValue]);
                cv.imshow(canvas, src);
            }
        }
        src.delete();
        dst.delete();
        mask.delete();

        if (values.length == 0) {
            return;
        }

        values.sort(function (a, b) {
            return b[1] - a[1];
        });

        let bestBlessing = values[0][0];
        unit.grantedBlessing = bestBlessing;
        this.writeDebugLogLine("bestBlessing=" + bestBlessing);
        g_appData.__updateStatusBySkillsAndMerges(unit);
    }

    setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, ocrCanvases) {
        let self = this;
        self.vm.ocrProgress = `画像の読み込みと2値化(${unit.id})..`;
        loadAndProcessImage(file, image => {
            const croppedWidth = image.width - self.vm.ocrCropX * 2;
            const croppedHeight = croppedWidth * (16.0 / 9.0);
            let scale = 1136.0 / croppedHeight; // テンプレート画像が640x1136から切り出したものを使ってるのでサイズを合わせる必要がある
            self.__drawCroppedImage(image, sourceCanvas,
                self.vm.ocrCropX, self.vm.ocrCropY, croppedWidth, croppedHeight, scale);

            let promise = Promise.resolve();

            // 文字認識用に2値化
            manipurateHsv(sourceCanvas, binarizedCanvas,
                (h, s, v) => { return s > 40 || v < 140; }, true);

            // const ocrInputCanvas = ocrCanvases[0];
            // const ocrInputCanvas1 = ocrCanvases[1];
            // const ocrInputCanvas2 = ocrCanvases[2];
            // const ocrInputCanvas3 = ocrCanvases[3];
            // const ocrInputCanvas4 = ocrCanvases[4];
            // const ocrInputCanvas5 = ocrCanvases[5];
            // const ocrInputCanvas6 = ocrCanvases[6];
            // const ocrInputCanvas7 = ocrCanvases[7];
            // const ocrInputCanvas8 = ocrCanvases[8];
            // const ocrInputCanvas9 = ocrCanvases[9];
            // const ocrInputCanvas10 = ocrCanvases[10];
            // const ocrInputCanvas11 = ocrCanvases[11];
            const ocrInputCanvas = document.getElementById("ocrInputImage0");
            const ocrInputCanvas1 = document.getElementById("ocrInputImage1");
            const ocrInputCanvas2 = document.getElementById("ocrInputImage2");
            const ocrInputCanvas3 = document.getElementById("ocrInputImage3");
            const ocrInputCanvas4 = document.getElementById("ocrInputImage4");
            const ocrInputCanvas5 = document.getElementById("ocrInputImage5");
            const ocrInputCanvas6 = document.getElementById("ocrInputImage6");
            const ocrInputCanvas7 = document.getElementById("ocrInputImage7");
            const ocrInputCanvas8 = document.getElementById("ocrInputImage8");
            const ocrInputCanvas9 = document.getElementById("ocrInputImage9");
            const ocrInputCanvas10 = document.getElementById("ocrInputImage10");
            const ocrInputCanvas11 = document.getElementById("ocrInputImage11");

            g_appData.ocrResult = "";
            // キャラ名抽出、祝福抽出
            promise = cropAndBinarizeImageAndOcr(
                ocrInputCanvas, binarizedCanvas,
                0.05, 0.435, 0.45, 0.105, -1,
                p => self.ocrProgress(p, `ユニット名抽出(${unit.id})`),
                ocrResult => {
                    self.clearOcrProgress();
                    console.log(ocrResult);
                    g_appData.ocrResult += "キャラ名: " + ocrResult.text + "\n";
                    let filtered = convertOcrResultToArray(ocrResult.text);
                    filtered = self.limitArrayLengthTo2WithLargerLengthString(filtered);
                    if (filtered.length >= 2) {
                        let epithet = "";
                        for (let i = 0; i < filtered.length - 1; ++i) {
                            epithet += filtered[i];
                        }
                        let name = filtered[filtered.length - 1];
                        let result = g_app.findSimilarHeroNameInfo(name, epithet);
                        if (result != null) {
                            let info = result[0];
                            let heroIndex = g_appData.heroInfos.findIndexOfInfo(info.name)
                            g_appData.initializeByHeroInfo(unit, heroIndex, false);
                            selectItemById(unit.id);
                        }
                    }
                });
            promise.then(() => {
                self.writeProgress(`祝福抽出(${unit.id})`);
                self.setUnitBlessingByImage(unit, sourceCanvas, ocrInputCanvas1);
                updateAllUi();
                self.clearOcrProgress();
            });
            promise = new Promise((resolve, reject) => resolve(promise));

            // 凸数抽出
            unit.merge = 0;
            promise = cropAndBinarizeImageAndOcr(
                ocrInputCanvas2, sourceCanvas,
                0.252, 0.577, 0.06, 0.038, 130,
                p => g_app.ocrProgress(p, `凸数抽出(${unit.id})`),
                ocrResult => {
                    self.clearOcrProgress();
                    console.log(ocrResult);
                    g_appData.ocrResult += "凸数: " + ocrResult.text + "\n";
                    var filtered = convertOcrResultToArray(ocrResult.text);
                    let partialName = getMaxLengthElem(filtered);
                    if (Number.isInteger(Number(partialName))) {
                        unit.merge = Number(partialName);
                        g_appData.__updateStatusBySkillsAndMerges(unit);
                    }
                },
                'eng',
                "0123456789"
            );
            promise = new Promise((resolve, reject) => resolve(promise));

            unit.dragonflower = 0;
            // 花凸数抽出
            promise = cropAndBinarizeImageAndOcr(
                ocrInputCanvas3, binarizedCanvas,
                0.541, 0.58, 0.06, 0.03, -1,
                p => g_app.ocrProgress(p, `花凸数抽出(${unit.id})`),
                ocrResult => {
                    self.clearOcrProgress();
                    console.log(ocrResult);
                    g_appData.ocrResult += "花凸数: " + ocrResult.text + "\n";
                    var filtered = convertOcrResultToArray(ocrResult.text);
                    let partialName = getMaxLengthElem(filtered);
                    let dragonflower = Number(partialName);
                    if (Number.isInteger(dragonflower) && dragonflower > 0) {
                        unit.dragonflower = dragonflower;
                        g_appData.__updateStatusBySkillsAndMerges(unit);
                    }

                    // アクセサリー未装備の時は花凸の位置がずれるのでもう一度OCR
                    promise = cropAndBinarizeImageAndOcr(
                        ocrInputCanvas11, binarizedCanvas,
                        0.506, 0.58, 0.06, 0.03, -1,
                        p => this.ocrProgress(p, `花凸数抽出(${unit.id})`),
                        ocrResult => {
                            self.clearOcrProgress();
                            console.log(ocrResult);
                            g_appData.ocrResult += "花凸数: " + ocrResult.text + "\n";
                            var filtered = convertOcrResultToArray(ocrResult.text);
                            let partialName = getMaxLengthElem(filtered);
                            let dragonflower = Number(partialName);
                            if (Number.isInteger(dragonflower) && dragonflower > unit.dragonflower) {
                                unit.dragonflower = dragonflower;
                                g_appData.__updateStatusBySkillsAndMerges(unit);
                            }
                        },
                        'eng'
                        // ,"0123456789"
                    );
                    promise = new Promise((resolve, reject) => resolve(promise));
                    return false;
                },
                'eng'
                // ,"0123456789"
            );
            promise = new Promise((resolve, reject) => resolve(promise));


            // 得意個体
            promise = cropAndPostProcessAndOcr(
                ocrInputCanvas4, sourceCanvas,
                0.14, 0.615, 0.10, 0.205,
                (srcCanvas) => {
                    manipurateHsv(srcCanvas, srcCanvas,
                        (hue, saturation, brightness) => saturation < 50
                            || brightness < 160
                            || (hue < 20 || 30 < hue), true);
                    let ctx = srcCanvas.getContext("2d");
                    let dst = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
                    return dst;
                },
                p => g_app.ocrProgress(p, `得意個体抽出(${unit.id})`),
                ocrResult => {
                    self.clearOcrProgress();
                    unit.setIvHighStat(StatusType.None);
                    console.log(ocrResult);
                    g_appData.ocrResult += "得意: " + ocrResult.text + "\n";
                    var filtered = convertOcrResultToArray(ocrResult.text);
                    let partialName = getMaxLengthElem(filtered);
                    g_app.writeDebugLogLine(`partialName=${partialName}`);
                    if (partialName == null || partialName == "") {
                        return;
                    }
                    let statusName = g_app.__findSimilarStatusName(partialName);
                    if (statusName != null) {
                        unit.setIvHighStat(nameToStatusType(statusName));
                        g_appData.__updateStatusBySkillsAndMerges(unit);
                    }
                },
                'jpn',
                "HP攻撃速さ守備魔防");
            promise = new Promise((resolve, reject) => resolve(promise));

            // 苦手個体
            promise = cropAndPostProcessAndOcr(
                ocrInputCanvas5, sourceCanvas,
                0.14, 0.615, 0.10, 0.205,
                (srcCanvas) => {
                    manipurateHsv(srcCanvas, srcCanvas,
                        (hue, saturation, brightness) => brightness < 100
                            || (hue < 120 || 160 < hue), true);
                    let ctx = srcCanvas.getContext("2d");
                    let dst = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
                    return dst;
                },
                p => g_app.ocrProgress(p, `苦手個体抽出(${unit.id})`),
                ocrResult => {
                    self.clearOcrProgress();
                    console.log(ocrResult);
                    unit.setIvLowStat(StatusType.None);
                    g_appData.ocrResult += "苦手: " + ocrResult.text + "\n";
                    var filtered = convertOcrResultToArray(ocrResult.text);
                    let partialName = getMaxLengthElem(filtered);
                    if (partialName == null || partialName == "") {
                        return;
                    }
                    let statusName = g_app.__findSimilarStatusName(partialName);
                    if (statusName != null) {
                        unit.setIvLowStat(nameToStatusType(statusName));
                        g_appData.__updateStatusBySkillsAndMerges(unit);
                    }
                },
                'jpn',
                "HP攻撃速さ守備魔防");
            promise = new Promise((resolve, reject) => resolve(promise));

            unit.clearSkills();

            // 武器抽出
            promise = cropAndPostProcessAndOcr(
                ocrInputCanvas6, sourceCanvas,
                0.575, 0.625, 0.32, 0.03,
                (srcCanvas) => {
                    manipurateHsv(srcCanvas, srcCanvas,
                        (hue, saturation, brightness) => brightness < 140
                            || 110 < hue && hue < 160, true);
                    let ctx = srcCanvas.getContext("2d");
                    let dst = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
                    return dst;
                },
                p => g_app.ocrProgress(p, `武器抽出(${unit.id})`),
                ocrResult => {
                    self.clearOcrProgress();
                    console.log(ocrResult);
                    g_appData.ocrResult += "武器名: " + ocrResult.text + "\n";
                    let filtered = convertOcrResultToArray(ocrResult.text);
                    let partialName = combineText(filtered);
                    console.log(partialName);

                    // heroIndexChangedイベントによってデフォルトスキルが予約されてしまうのでスキルセットする直前で解消
                    // todo: もっとまともな方法があれば
                    unit.clearReservedSkills();
                    unit.weapon = -1;

                    if (partialName != null) {
                        let result = self.findSimilarNameSkill(partialName,
                            self.__enumerateElemOfArrays([
                                self.weaponInfos]));
                        if (result != null) {
                            let skillInfo = result[0];
                            console.log(skillInfo.name);
                            let skillId = skillInfo.id;
                            if (skillInfo.name.startsWith("ファルシオン")) {
                                switch (unit.heroIndex) {
                                    case 84: // マルス
                                        skillId = 47;
                                        break;
                                    case 72: // ルキナ
                                    case 24: // クロム
                                    case 134: // 仮面マルス
                                        skillId = 48;
                                        break;
                                    case 114: // アルム
                                        skillId = 49;
                                        break;
                                    default:
                                        break;
                                }
                            }
                            unit.weapon = skillId;
                            self.__updateUnitSkillInfo(unit);
                        }
                    }
                },
                "jpn",
                // ホワイトリスト有効にするとスマホ版でtesseractが固まる
                self.vm.useWhitelistForOcr ? self.weaponSkillCharWhiteList : ""
            );
            promise = new Promise((resolve, reject) => resolve(promise));

            // 武器錬成抽出
            promise = cropAndPostProcessAndOcr(
                ocrInputCanvas7, sourceCanvas,
                0.575, 0.625, 0.32, 0.03,
                (srcCanvas) => {
                    manipurateHsv(srcCanvas, srcCanvas,
                        (hue, saturation, brightness) => saturation < 40, true);
                    let ctx = srcCanvas.getContext("2d");
                    let dst = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
                    return dst;
                },
                p => g_app.ocrProgress(p, `武器錬成抽出(${unit.id})`),
                ocrResult => {
                    self.clearOcrProgress();
                    var filtered = convertOcrResultToArray(ocrResult.text);
                    let partialName = getMaxLengthElem(filtered);
                    console.log(filtered);
                    unit.weaponRefinement = WeaponRefinementType.None;
                    if (partialName == null) {
                        // 武器錬成あり
                        self.setWeaponRefinementTypeByImage(unit, sourceCanvas, ocrInputCanvas8);
                    }
                },
                "jpn",
                self.vm.useWhitelistForOcr ? self.weaponSkillCharWhiteList : ""
            );
            promise = new Promise((resolve, reject) => resolve(promise));

            // 武器、S以外のスキル名抽出
            promise = cropAndBinarizeImageAndOcr(
                ocrInputCanvas9, binarizedCanvas,
                0.575, 0.657, 0.32, 0.20,
                -1,
                p => g_app.ocrProgress(p, `スキル抽出(${unit.id})`),
                ocrResult => {
                    self.clearOcrProgress();
                    console.log(ocrResult);
                    g_appData.ocrResult += "スキル名: " + ocrResult.text + "\n";
                    var filtered = convertOcrResultToArray(ocrResult.text);
                    console.log(filtered);

                    unit.support = -1;
                    unit.special = -1;
                    unit.passiveA = -1;
                    unit.passiveB = -1;
                    unit.passiveC = -1;
                    let dict = {};
                    for (let name of filtered) {
                        let skillInfo = null;
                        skillInfo = self.__findSkillInfoWithDict(name, unit, dict);
                        if (skillInfo == null) {
                            continue;
                        }
                        if (!dict[SkillType.Support]) {
                            if (skillInfo.type == SkillType.Support) {
                                dict[SkillType.Support] = skillInfo;
                                unit.support = skillInfo.id;
                                continue;
                            }
                        }

                        if (!dict[SkillType.Special]) {
                            if (skillInfo.type == SkillType.Special) {
                                dict[skillInfo.type] = skillInfo;
                                unit.special = skillInfo.id;
                                continue;
                            }
                        }

                        if (!dict[SkillType.PassiveA]) {
                            if (skillInfo.type == SkillType.PassiveA) {
                                dict[skillInfo.type] = skillInfo;
                                unit.passiveA = skillInfo.id;
                                continue;
                            }
                        }

                        if (!dict[SkillType.PassiveB]) {
                            if (skillInfo.type == SkillType.PassiveB) {
                                dict[skillInfo.type] = skillInfo;
                                unit.passiveB = skillInfo.id;
                                continue;
                            }
                        }

                        if (!dict[SkillType.PassiveC]) {
                            if (skillInfo.type == SkillType.PassiveC) {
                                dict[skillInfo.type] = skillInfo;
                                unit.passiveC = skillInfo.id;
                                continue;
                            }
                        }

                        // ここまで来た場合は見つからなかったか、複数スキルが同じ種類に判定されてしまったパターン
                    }
                },
                "jpn",
                self.vm.useWhitelistForOcr ?
                    self.supportSkillCharWhiteList +
                    self.specialSkillCharWhiteList +
                    self.passiveSkillCharWhiteList : "",
                self.passiveSkillCharBlackList,
            );
            promise = new Promise((resolve, reject) => resolve(promise));

            promise = cropAndBinarizeImageAndOcr(
                ocrInputCanvas10, binarizedCanvas,
                0.575, 0.855, 0.32, 0.03, -1,
                p => g_app.ocrProgress(p, `聖印抽出(${unit.id})`),
                ocrResult => {
                    self.clearOcrProgress();
                    console.log(ocrResult);
                    g_appData.ocrResult += "聖印名: " + ocrResult.text + "\n";
                    var filtered = convertOcrResultToArray(ocrResult.text);
                    let partialName = getMaxLengthElem(filtered);
                    console.log(filtered);

                    if (partialName != null) {
                        let result = g_app.findSimilarNameSkill(partialName,
                            self.__enumerateElemOfArrays([
                                self.passiveAInfos,
                                self.passiveBInfos,
                                self.passiveCInfos,
                                self.passiveSInfos]));
                        if (result != null) {
                            let skillInfo = result[0];
                            console.log(skillInfo.name);
                            unit.passiveS = skillInfo.id;
                        }
                    }
                },
                "jpn",
                self.vm.useWhitelistForOcr ?
                    self.passiveSkillCharWhiteList : "",
                self.passiveSkillCharBlackList,
            );
            promise = new Promise((resolve, reject) => resolve(promise));
        });
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
        if (this.openCvLoadState == ModuleLoadState.NotLoaded) {
            self.openCvLoadState = ModuleLoadState.Loading;
            self.writeSimpleLogLine("OpenCV の初期化開始..");
            importJs("https://docs.opencv.org/4.2.0/opencv.js", x => {
                cv['onRuntimeInitialized'] = () => {
                    self.openCvLoadState = ModuleLoadState.Loaded;
                    self.writeSimpleLogLine("OpenCV の初期化完了");
                };
            });
        }
        if (this.tesseractLoadState == ModuleLoadState.NotLoaded) {
            self.tesseractLoadState = ModuleLoadState.Loading;
            self.writeSimpleLogLine("Tesseract の初期化開始..");
            importJs("https://unpkg.com/tesseract.js@1.0.19/dist/tesseract.min.js", x => {
                self.tesseractLoadState = ModuleLoadState.Loaded;
                self.writeSimpleLogLine("Tesseract の初期化完了");
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

        this.__setUnitsByStatusImages(files);
    }

    __setUnitsByStatusImages(files) {
        switch (Number(this.vm.ocrSettingTarget)) {
            case OcrSettingTarget.SelectedTarget:
                {
                    let unit = this.__getCurrentUnit();
                    if (unit == null) {
                        this.writeErrorLine("ユニットが選択されていません");
                        return;
                    }
                    let file = files[0];
                    const sourceCanvas = document.getElementById("croppedImage0");
                    const binarizedCanvas = document.getElementById("binarizedImage0");
                    this.setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, this.ocrCanvases[0]);
                }
                break;
            case OcrSettingTarget.AllEnemies:
                for (let i = 0; i < files.length && i < g_appData.enemyUnits.length; ++i) {
                    let unit = g_appData.enemyUnits[i];
                    let file = files[i];
                    const sourceCanvas = document.getElementById("croppedImage" + i);
                    const binarizedCanvas = document.getElementById("binarizedImage" + i);
                    this.setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, this.ocrCanvases[i]);
                }
                break;
            case OcrSettingTarget.AllAllies:
                for (let i = 0; i < files.length && i < g_appData.allyUnits.length; ++i) {
                    let unit = g_appData.allyUnits[i];
                    let file = files[i];
                    const sourceCanvas = document.getElementById("croppedImage" + i);
                    const binarizedCanvas = document.getElementById("binarizedImage" + i);
                    this.setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, this.ocrCanvases[i]);
                }
                break;
            case OcrSettingTarget.MapStructures:
                let file = files[0];
                this.setMapByImage(file);
                break;
        }
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
                let nameDiff = calcSimilarity(partialName, info.pureName);
                let epithetDiff = calcSimilarity(epithet, info.epithet);
                // console.log(`${partialName} - ${info.pureName} = ${nameDiff}`);
                // console.log(`${epithet} - ${info.epithet} = ${epithetDiff}`);
                return nameDiff + epithetDiff;
            }
        );

        if (result != null) {
            let replacedPartialName = adjustChars(partialName);
            this.writeDebugLogLine(`${replacedPartialName}(${epithet}) is similar to ${result[0].pureName}(${result[0].epithet})(${result[1]})`);
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
        this.__durabilityTest_simulate(targetUnit, enemyUnit);
    }

    get isAutoChangeDetailEnabled() {
        return this.vm.autoChangeDetail;
    }

    * enumerateAllUnits() {
        for (let unit of this.vm.units) {
            yield unit;
        }
    }

    * enumerateAllUnitsOnMap(predicator) {
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

    writeSimpleLogLine(log) {
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

    writeLogLine(log) {
        this.vm.damageCalcLog += "<span style='font-size:14px'>" + log + '</span><br/>';
    }

    writeDebugLogLine(log) {
        if (this.vm.showDetailLog == false) {
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
        for (let i = 0; i < this.vm.units.length; ++i) {
            let unit = this.vm.units[i];
            if (unit.id == id) {
                return unit;
            }
        }

        return null;
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
                this.__registerInheritableSkills(heroInfo.supportOptions, this.vm.supportOptions[0], [g_appData.supportInfos],
                    x => (!x.canInherit && heroInfo.supports.includes(x.id))
                        || this.__isInheritableSkill(weaponType, moveType, x));
                this.__registerInheritableSkills(heroInfo.specialOptions, this.vm.specialOptions[0], [g_appData.specialInfos],
                    x => (!x.canInherit && heroInfo.special == x.id)
                        || this.__isInheritableSkill(weaponType, moveType, x));
                this.__registerInheritableSkills(heroInfo.passiveAOptions, this.vm.passiveAOptions[0], [g_appData.passiveAInfos],
                    x => (!x.canInherit && heroInfo.passiveA == x.id)
                        || this.__isInheritableSkill(weaponType, moveType, x));
                this.__registerInheritableSkills(heroInfo.passiveBOptions, this.vm.passiveBOptions[0], [g_appData.passiveBInfos],
                    x => (!x.canInherit && heroInfo.passiveB == x.id)
                        || this.__isInheritableSkill(weaponType, moveType, x));
                this.__registerInheritableSkills(heroInfo.passiveCOptions, this.vm.passiveCOptions[0], [g_appData.passiveCInfos],
                    x => (!x.canInherit && heroInfo.passiveC == x.id)
                        || this.__isInheritableSkill(weaponType, moveType, x));
                this.__registerInheritableSkills(heroInfo.passiveSOptions, this.vm.passiveSOptions[0], [g_appData.passiveAInfos, g_appData.passiveBInfos, g_appData.passiveCInfos, g_appData.passiveSInfos],
                    x => (x.isSacredSealAvailable || x.type == SkillType.PassiveS) && this.__isInheritableSkill(weaponType, moveType, x));

                this.__markUnsupportedSkills(heroInfo.weaponOptions, [Weapon], [g_appData.weaponInfos]);
                this.__markUnsupportedSkills(heroInfo.supportOptions, [Support], [g_appData.supportInfos]);
                this.__markUnsupportedSkills(heroInfo.specialOptions, [Special], [g_appData.specialInfos]);
                this.__markUnsupportedSkills(heroInfo.passiveAOptions, [PassiveA], [g_appData.passiveAInfos]);
                this.__markUnsupportedSkills(heroInfo.passiveBOptions, [PassiveB], [g_appData.passiveBInfos]);
                this.__markUnsupportedSkills(heroInfo.passiveCOptions, [PassiveC], [g_appData.passiveCInfos]);
                this.__markUnsupportedSkills(heroInfo.passiveSOptions, [PassiveS, PassiveA, PassiveB, PassiveC], [g_appData.passiveSInfos, g_appData.passiveAInfos, g_appData.passiveBInfos, g_appData.passiveSInfos]);
            }
        });
    }
    __isInheritableSkill(weaponType, moveType, skillInfo) {
        return isInheritableWeaponType(weaponType, skillInfo.inheritableWeaponTypes) && skillInfo.inheritableMoveTypes.includes(moveType);
    }
    __registerInheritableSkills(options, noneOption, allInfos, canInheritFunc) {
        options.push(noneOption);
        for (let infos of allInfos) {
            for (let info of infos) {
                if (canInheritFunc(info)) {
                    options.push({ id: info.id, text: info.name });
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

            heroInfo.weaponOptions.push({ id: info.id, text: info.name });
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
        g_appData.registerSkillOptions(weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs);

        this.passiveSkillCharWhiteList = "";
        this.weaponSkillCharWhiteList = "";
        this.supportSkillCharWhiteList = "";
        this.specialSkillCharWhiteList = "";
        for (let info of g_appData.weaponInfos) {
            info.type = SkillType.Weapon;
            this.weaponSkillCharWhiteList += info.name;

            info.weaponRefinementOptions.push(this.vm.weaponRefinementOptions[0]);
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
        for (let info of g_appData.supportInfos) {
            info.type = SkillType.Support;
            this.supportSkillCharWhiteList += info.name;
        }
        for (let info of g_appData.specialInfos) {
            info.type = SkillType.Special;
            this.specialSkillCharWhiteList += info.name;
        }
        for (let info of g_appData.passiveAInfos) {
            info.type = SkillType.PassiveA;
            this.passiveSkillCharWhiteList += info.name;
        }
        for (let info of g_appData.passiveBInfos) {
            info.type = SkillType.PassiveB;
            this.passiveSkillCharWhiteList += info.name;
        }
        for (let info of g_appData.passiveCInfos) {
            info.type = SkillType.PassiveC;
            this.passiveSkillCharWhiteList += info.name;
        }
        for (let info of g_appData.passiveSInfos) {
            info.type = SkillType.PassiveS;
            this.passiveSkillCharWhiteList += info.name;
        }

        distinctStr(this.supportSkillCharWhiteList);
        distinctStr(this.specialSkillCharWhiteList);
        distinctStr(this.passiveSkillCharWhiteList);
        distinctStr(this.weaponSkillCharWhiteList);

        // 対応してないスキルに目印×をつける
        this.__markUnsupportedSkills(this.vm.weaponOptions, [Weapon], [g_appData.weaponInfos], () => ++this.vm.weaponCount, () => ++this.vm.weaponImplCount);
        this.__markUnsupportedSkills(this.vm.supportOptions, [Support], [g_appData.supportInfos], () => ++this.vm.supportCount, () => ++this.vm.supportImplCount);
        this.__markUnsupportedSkills(this.vm.specialOptions, [Special], [g_appData.specialInfos], () => ++this.vm.specialCount, () => ++this.vm.specialImplCount);
        this.__markUnsupportedSkills(this.vm.passiveAOptions, [PassiveA], [g_appData.passiveAInfos], () => ++this.vm.passiveACount, () => ++this.vm.passiveAImplCount);
        this.__markUnsupportedSkills(this.vm.passiveBOptions, [PassiveB], [g_appData.passiveBInfos], () => ++this.vm.passiveBCount, () => ++this.vm.passiveBImplCount);
        this.__markUnsupportedSkills(this.vm.passiveCOptions, [PassiveC], [g_appData.passiveCInfos], () => ++this.vm.passiveCCount, () => ++this.vm.passiveCImplCount);
        this.__markUnsupportedSkills(this.vm.passiveSOptions, [PassiveS, PassiveA, PassiveB, PassiveC], [g_appData.passiveSInfos, g_appData.passiveAInfos, g_appData.passiveBInfos, g_appData.passiveSInfos], () => ++this.vm.passiveSCount, () => ++this.vm.passiveSImplCount);

        // アルファベットソート(今は全スキルのオプションをメインで使ってないので速度優先でソートは無効化)
        // this.__sortSkillOptionsAlphabetically(this.vm.weaponOptions);
        // this.__sortSkillOptionsAlphabetically(this.vm.supportOptions);
        // this.__sortSkillOptionsAlphabetically(this.vm.specialOptions);
        // this.__sortSkillOptionsAlphabetically(this.vm.passiveAOptions);
        // this.__sortSkillOptionsAlphabetically(this.vm.passiveBOptions);
        // this.__sortSkillOptionsAlphabetically(this.vm.passiveCOptions);
        // this.__sortSkillOptionsAlphabetically(this.vm.passiveSOptions);
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
            let skillInfo = null;
            for (let infos of infoLists) {
                skillInfo = this.__findSkillInfo(infos, skill.id);
                if (skillInfo != null) {
                    break;
                }
            }

            let isImplRequired = (skillInfo == null || skillInfo.isAdditionalImplRequired)
            if (isImplRequired && !this.__isSupportedSkill(skill, supportedSkillEnums)) {
                skill.text = "×" + skill.text;
            }
            else if (countImplFunc != null) {
                countImplFunc();
            }
        }
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

    updateDamageCalculation(atkUnit, defUnit, tileToAttack = null) {
        // 攻撃
        let result = this.calcDamage(atkUnit, defUnit, tileToAttack);

        // this.clearSimpleLog();
        this.writeSimpleLogLine(this.damageCalc.simpleLog);
        this.writeLogLine(this.damageCalc.log);
        atkUnit.hp = atkUnit.restHp;
        defUnit.hp = defUnit.restHp;
        atkUnit.specialCount = atkUnit.tmpSpecialCount;
        defUnit.specialCount = defUnit.tmpSpecialCount;

        atkUnit.endAction();

        // 戦闘後のダメージ、回復の合計を反映させないといけないので予約HPとして計算
        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.initReservedHp();
        }

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
                    targetUnit.reserveTakeDamage(damage);
                }
            }
        }

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

            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.GuardBearing3:
                        if (!defUnit.isOneTimeActionActivatedForPassiveB) {
                            defUnit.isOneTimeActionActivatedForPassiveB = true;
                        }
                        break;
                }
            }
        }

        if (result.atkUnit_actualTotalAttackCount > 0) {
            this.__applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(atkUnit, defUnit);
        }
        this.__applySkillEffectAfterCombatNeverthelessDeadForUnit(atkUnit, defUnit, result.atkUnit_actualTotalAttackCount);

        if (result.defUnit_actualTotalAttackCount > 0) {
            this.__applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(defUnit, atkUnit);
        }
        this.__applySkillEffectAfterCombatNeverthelessDeadForUnit(defUnit, atkUnit, result.defUnit_actualTotalAttackCount);

        // 切り込みなどの移動系スキル
        if (atkUnit.isAlive) {
            this.__applyMovementSkillAfterCombat(atkUnit, defUnit);
        }

        // 奥義カウントやHP変動の加減値をここで確定
        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.modifySpecialCount();
            if (!unit.isDead) {
                unit.applyReservedHp();
                unit.modifyHp(true);
            }
        }

        if (atkUnit.hp == 0) {
            this.audioManager.playSoundEffect(SoundEffectId.Dead);
            moveUnitToTrashBox(atkUnit);
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
            moveUnitToTrashBox(defUnit);
        }

        // 戦闘後の移動系スキルを加味する必要があるので後段で評価
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
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

        // unit.endAction()のタイミングが戦闘後処理の前でなければいけないので、endUnitActionは直接呼べない
        this.__goToNextPhaseIfAllActionDone(atkUnit.groupId);
    }

    __activateRefreshSpecial(atkUnit) {
        this.writeLogLine(atkUnit.getNameWithGroup() + "が" + atkUnit.specialInfo.name + "を発動");
        atkUnit.isOneTimeActionActivatedForSpecial = true;
        atkUnit.specialCount = atkUnit.maxSpecialCount;
        atkUnit.isActionDone = false;
    }

    calcDamage(
        atkUnit,
        defUnit,
        tileToAttack = null,
        calcPotentialDamage = false
    ) {

        atkUnit.battleContext.clear();
        defUnit.battleContext.clear();
        atkUnit.battleContext.hpBeforeCombat = atkUnit.hp;
        defUnit.battleContext.hpBeforeCombat = defUnit.hp;

        atkUnit.battleContext.initiatesCombat = true;
        defUnit.battleContext.initiatesCombat = false;

        let origTile = atkUnit.placedTile;
        if (tileToAttack != null) {
            // 攻撃ユニットの位置を一時的に変更
            // this.writeDebugLogLine(atkUnit.getNameWithGroup() + "の位置を(" + tileToAttack.posX + ", " + tileToAttack.posY + ")に変更");
            tileToAttack.setUnit(atkUnit);
            this.__updateUnitSpur(atkUnit);
        }

        if (calcPotentialDamage) {
            this.updateAllUnitSpur(true);
        }

        atkUnit.restHp = atkUnit.hp;
        defUnit.restHp = defUnit.hp;
        atkUnit.tmpSpecialCount = atkUnit.specialCount;
        defUnit.tmpSpecialCount = defUnit.specialCount;

        // 戦闘前ダメージ計算
        this.damageCalc.clearLog();
        this.damageCalc.calcPreCombatDamage(atkUnit, defUnit);

        // 戦闘開始時の状態を保存
        atkUnit.createSnapshot();
        defUnit.createSnapshot();

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
            this.__setAttackCount(atkUnit);
            this.__setAttackCount(defUnit);

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
            let atkWeaponInfo = this.__findSkillInfo(g_appData.weaponInfos, atkUnit.weapon);
            if (atkWeaponInfo != null) {
                this.__setEffectiveAttackEnabled(atkUnit, defUnit, atkWeaponInfo);
            }
            let defWeaponInfo = this.__findSkillInfo(g_appData.weaponInfos, defUnit.weapon);
            if (defWeaponInfo != null) {
                this.__setEffectiveAttackEnabled(defUnit, atkUnit, defWeaponInfo);
            }

            // 武器内蔵の全距離反撃
            switch (defUnit.weapon) {
                case Weapon.Kurimuhirudo:
                    if (this.__isThereAllyInSpecifiedSpaces(defUnit, 2)) {
                        defUnit.battleContext.canCounterattackToAllDistance = true;
                    }
                    break;
                case Weapon.Amatsu:
                case Weapon.Puji:
                    if (defUnit.snapshot.restHpPercentage >= 50) {
                        defUnit.battleContext.canCounterattackToAllDistance = true;
                    }
                    break;
                case Weapon.ShishiouNoTsumekiba:
                    if (defUnit.isTransformed) {
                        defUnit.battleContext.canCounterattackToAllDistance = true;
                    }
                    break;
                case Weapon.OgonNoTanken:
                    if (defUnit.isSpecialCharged) {
                        defUnit.battleContext.canCounterattackToAllDistance = true;
                    }
                    break;
            }
            if (defWeaponInfo != null) {
                if (defUnit.battleContext.canCounterattackToAllDistance == false) {
                    defUnit.battleContext.canCounterattackToAllDistance = defWeaponInfo.canCounterattackToAllDistance;
                }
            }
        }

        // 戦闘中バフが決まった後に評価するスキル効果
        {
            this.__applySpurForUnitAfterCombatStatusFixed(atkUnit, defUnit);
            this.__applySpurForUnitAfterCombatStatusFixed(defUnit, atkUnit);

            this.__applySkillEffectAfterCombatStatusFixed(atkUnit, defUnit);
            this.__applySkillEffectForUnitAfterCombatStatusFixed(atkUnit, defUnit, calcPotentialDamage);
            this.__applySkillEffectForUnitAfterCombatStatusFixed(defUnit, atkUnit, calcPotentialDamage);
        }

        // 効果を無効化するスキル
        {
            this.__applyInvalidationSkillEffect(atkUnit, defUnit);
            this.__applyInvalidationSkillEffect(defUnit, atkUnit);
        }

        // 敵が反撃可能か判定
        defUnit.battleContext.canCounterattack = this.__canCounterAttack(atkUnit, defUnit);
        // this.writeDebugLogLine(defUnit.getNameWithGroup() + "の反撃可否:" + defUnit.battleContext.canCounterattack);

        // 追撃可能か判定
        atkUnit.battleContext.canFollowupAttack = this.__examinesCanFollowupAttackForAttacker(atkUnit, defUnit, calcPotentialDamage);
        if (defUnit.battleContext.canCounterattack) {
            defUnit.battleContext.canFollowupAttack = this.__examinesCanFollowupAttackForDefender(atkUnit, defUnit, calcPotentialDamage);
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

        if (tileToAttack != null) {
            // ユニットの位置を元に戻す
            setUnitToTile(atkUnit, origTile);
        }

        // 計算のために変更した紋章値をリセット
        this.updateAllUnitSpur();
        return result;
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

    __setAttackCount(atkUnit) {
        let atkWeaponInfo = this.__findSkillInfo(g_appData.weaponInfos, atkUnit.weapon);
        if (atkWeaponInfo != null) {
            atkUnit.battleContext.attackCount = atkWeaponInfo.attackCount;
            atkUnit.battleContext.counterattackCount = atkWeaponInfo.counterattackCount;
        }
        else {
            atkUnit.battleContext.attackCount = 0;
            atkUnit.battleContext.counterattackCount = 0;
        }

        switch (atkUnit.weapon) {
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
                case Weapon.TenteiNoKen:
                    defUnit.battleContext.increaseCooldownCount = false;
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

        switch (atkUnit.weapon) {
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
            }
            switch (defUnit.weapon) {
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

    __canInvalidateAbsoluteFollowupAttack(unit, enemyUnit) {
        if (unit.hasPassiveSkill(PassiveB.MikiriTsuigeki3)) {
            return true;
        }
        if (unit.passiveB == PassiveB.SphiasSoul) {
            return true;
        }
        switch (unit.weapon) {
            case Weapon.ShinenNoBreath:
                if (unit.isWeaponSpecialRefined) {
                    if (unit.snapshot.restHpPercentage >= 25 && this.__isThereAllyInSpecifiedSpaces(unit, 2)) {
                        return true;
                    }
                }
                break;
            case Weapon.SunsPercussors:
                if (unit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                    || enemyUnit.snapshot.restHpPercentage == 100
                ) {
                    return true;
                }
                break;
            case Weapon.WindsOfChange:
                if (unit.isBuffed || unit.snapshot.restHpPercentage >= 50) {
                    return true;
                }
                break;
            case Weapon.HakutoshinNoNinjin:
                return true;
            case Weapon.TenteiNoKen:
                return true;
            case Weapon.Ifingr:
                if (this.__isThereAllyInSpecifiedSpaces(unit, 3)) {
                    return true;
                }
                break;
            case Weapon.MaritaNoKen:
                if (this.__isSolo(unit)) {
                    return true;
                }
                break;
        }
        return false;
    }

    __canInvalidateInvalidationOfFollowupAttack(unit, enemyUnit) {
        if (unit.hasPassiveSkill(PassiveB.MikiriTsuigeki3)) {
            return true;
        }
        if (unit.passiveB == PassiveB.SphiasSoul) {
            return true;
        }
        if (unit.passiveB == PassiveB.KyusyuTaikei3) {
            return true;
        }

        switch (unit.weapon) {
            case Weapon.Garumu:
                if (unit.isWeaponRefined) {
                    if (unit.hasPositiveStatusEffect()) {
                        return true;
                    }
                }
                break;
            case Weapon.SunsPercussors:
                if (unit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                    || enemyUnit.snapshot.restHpPercentage == 100
                ) {
                    return true;
                }
                break;
            case Weapon.WindsOfChange:
                if (unit.isBuffed || unit.snapshot.restHpPercentage >= 50) {
                    return true;
                }
                break;
            case Weapon.HakutoshinNoNinjin:
                return true;
            case Weapon.TenteiNoKen:
                return true;
            case Weapon.MaritaNoKen:
                if (this.__isSolo(unit)) {
                    return true;
                }
                break;
            case Weapon.TenmaNoNinjinPlus:
                if (this.damageCalc.calcAttackerTriangleAdvantage(unit, enemyUnit) == TriangleAdvantage.Advantageous) {
                    return true;
                }
                break;
        }

        return false;
    }

    __getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage) {
        let followupAttackPriority = atkUnit.battleContext.followupAttackPriority;
        if (!this.__canInvalidateAbsoluteFollowupAttack(defUnit, atkUnit)) {
            if (this.__canActivateBreakerSkill(atkUnit, defUnit)) {
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
                        if (defUnit.isMeleeWeaponType() && this.__canCounterAttack(atkUnit, defUnit)) {
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
                        --followupAttackPriority;
                        break;
                    case PassiveA.KishinMeikyoNoSyungeki:
                        --followupAttackPriority;
                        break;
                    case PassiveA.SteadyImpact:
                        --followupAttackPriority;
                        break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (this.vm.currentTurn % 2 == 1) {
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

    __applySkillEffectAfterCombatStatusFixed(atkUnit, defUnit) {
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
    __applySpurForUnitAfterCombatStatusFixed(atkUnit, defUnit) {
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
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
                    atkUnit.atkSpur += atkUnit.getBuffTotalInCombat(defUnit);
                    break;
                case Weapon.AkatsukiNoHikari:
                    if (defUnit.atkDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.atkDebuffTotal; }
                    if (defUnit.spdDebuffTotal < 0) { atkUnit.spdSpur += -defUnit.spdDebuffTotal; }
                    if (defUnit.defDebuffTotal < 0) { atkUnit.defSpur += -defUnit.defDebuffTotal; }
                    if (defUnit.resDebuffTotal < 0) { atkUnit.resSpur += -defUnit.resDebuffTotal; }
                    break;
                case Weapon.SyukuseiNoAnki:
                case Weapon.SyukuseiNoAnkiPlus:
                    atkUnit.atkSpur += defUnit.getBuffTotalInCombat(atkUnit);
                    break;
                case Weapon.MitteiNoAnki:
                case Weapon.AokarasuNoSyo:
                    if (atkUnit.isWeaponSpecialRefined) {
                        this.__applyDebuffBlade(atkUnit, defUnit);
                    }
                    break;
                case Weapon.Blizard:
                case Weapon.HaNoOugiPlus:
                    this.__applyDebuffBlade(atkUnit, defUnit);
                    break;
                case Weapon.SyugosyaNoRekkyu:
                    if (atkUnit.getEvalSpdInPrecombat() > defUnit.getEvalSpdInPrecombat()
                        || atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)
                    ) {
                        defUnit.atkSpur -= 5;
                        defUnit.spdSpur -= 5;
                        defUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.SaizoNoBakuenshin:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += Math.abs(defUnit.atkDebuffTotal);
                        atkUnit.spdSpur += Math.abs(defUnit.spdDebuffTotal);
                        atkUnit.defSpur += Math.abs(defUnit.defDebuffTotal);
                        atkUnit.resSpur += Math.abs(defUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.MeikiNoBreath:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += Math.abs(defUnit.atkDebuffTotal);
                        atkUnit.spdSpur += Math.abs(defUnit.spdDebuffTotal);
                        atkUnit.defSpur += Math.abs(defUnit.defDebuffTotal);
                        atkUnit.resSpur += Math.abs(defUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.ChaosRagnell:
                    {
                        let atkAdd = Math.abs(atkUnit.atkDebuffTotal) * 2;
                        let spdAdd = Math.abs(atkUnit.spdDebuffTotal) * 2;
                        let defAdd = Math.abs(atkUnit.defDebuffTotal) * 2;
                        let resAdd = Math.abs(atkUnit.resDebuffTotal) * 2;
                        this.damageCalc.writeDebugLog(`混沌ラグネルにより攻+${atkAdd}, 速+${spdAdd}, 守+${defAdd}, 魔+${resAdd}`);
                        atkUnit.atkSpur += atkAdd;
                        atkUnit.spdSpur += spdAdd;
                        atkUnit.defSpur += defAdd;
                        atkUnit.resSpur += resAdd;
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


    __applySkillEffectAfterCombatForUnit(attackUnit, attackTargetUnit) {
        if (attackTargetUnit.hasStatusEffect(StatusEffectType.ResonantShield)) {
            attackTargetUnit.isOneTimeActionActivatedForShieldEffect = true;
        }

        for (let skillId of attackTargetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveS.GoeiNoGuzo:
                case PassiveS.TozokuNoGuzoRakurai:
                case PassiveS.TozokuNoGuzoKobu:
                case PassiveS.TozokuNoGuzoKogun:
                case PassiveS.TozokuNoGuzoKusuri:
                case PassiveS.TozokuNoGuzoOugi:
                case PassiveS.TozokuNoGuzoOdori:
                    if (!attackTargetUnit.isAlive) {
                        this.writeDebugLogLine(`${attackTargetUnit.passiveSInfo.name}発動、${attackUnit.getNameWithGroup()}のHP10回復、奥義カウント+1`);
                        attackUnit.reserveHeal(10);
                        attackUnit.specialCount += 1;
                    }
                    break;
            }
        }
        for (let skillId of attackUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.OukeNoKen:
                    if (attackUnit.isWeaponSpecialRefined) {
                        if (attackUnit.snapshot.restHpPercentage >= 25) {
                            attackUnit.reserveHeal(7);
                            attackUnit.specialCount -= 1;
                        }
                    }
                    break;
                case Weapon.ConchBouquetPlus:
                case Weapon.MelonFloatPlus:
                case Weapon.HiddenThornsPlus:
                    if (!attackUnit.isOneTimeActionActivatedForWeapon) {
                        attackUnit.reserveHeal(7);
                        attackUnit.isOneTimeActionActivatedForWeapon = true;
                    }
                    break;
                case Weapon.StarpointLance:
                    if (!attackUnit.isOneTimeActionActivatedForWeapon) {
                        attackUnit.reserveHeal(10);
                        attackUnit.isOneTimeActionActivatedForWeapon = true;
                    }
                    break;
                case PassiveB.SealAtk1: attackTargetUnit.applyAtkDebuff(-3); break;
                case PassiveB.SealAtk2: attackTargetUnit.applyAtkDebuff(-5); break;
                case PassiveB.SealAtk3: attackTargetUnit.applyAtkDebuff(-7); break;
                case PassiveB.SealSpd1: attackTargetUnit.applySpdDebuff(-3); break;
                case PassiveB.SealSpd2: attackTargetUnit.applySpdDebuff(-5); break;
                case PassiveB.SealSpd3: attackTargetUnit.applySpdDebuff(-7); break;
                case PassiveB.SealDef1: attackTargetUnit.applyDefDebuff(-3); break;
                case PassiveB.SealDef2: attackTargetUnit.applyDefDebuff(-5); break;
                case PassiveB.SealDef3: attackTargetUnit.applyDefDebuff(-7); break;
                case PassiveB.SealRes1: attackTargetUnit.applyResDebuff(-3); break;
                case PassiveB.SealRes2: attackTargetUnit.applyResDebuff(-5); break;
                case PassiveB.SealRes3: attackTargetUnit.applyResDebuff(-7); break;
                case PassiveB.SealAtkSpd1: attackTargetUnit.applyAtkDebuff(-3); attackTargetUnit.applySpdDebuff(-3); break;
                case PassiveB.SealAtkDef1: attackTargetUnit.applyAtkDebuff(-3); attackTargetUnit.applyDefDebuff(-3); break;
                case PassiveB.SealDefRes1: attackTargetUnit.applyDefDebuff(-3); attackTargetUnit.applyResDebuff(-3); break;
                case PassiveB.SealSpdDef1: attackTargetUnit.applySpdDebuff(-3); attackTargetUnit.applyDefDebuff(-3); break;
                case PassiveB.SealSpdRes1: attackTargetUnit.applySpdDebuff(-3); attackTargetUnit.applyResDebuff(-3); break;
                case PassiveB.SealAtkSpd2: attackTargetUnit.applyAtkDebuff(-5); attackTargetUnit.applySpdDebuff(-5); break;
                case PassiveB.SealAtkDef2: attackTargetUnit.applyAtkDebuff(-5); attackTargetUnit.applyDefDebuff(-5); break;
                case PassiveB.SealDefRes2: attackTargetUnit.applyDefDebuff(-5); attackTargetUnit.applyResDebuff(-5); break;
                case PassiveB.SealSpdDef2: attackTargetUnit.applySpdDebuff(-5); attackTargetUnit.applyDefDebuff(-5); break;
                case PassiveB.SealSpdRes2: attackTargetUnit.applySpdDebuff(-5); attackTargetUnit.applyResDebuff(-5); break;
                case PassiveB.SeimeiNoGofu3:
                    attackUnit.reserveHeal(6);
                    break;
                case Weapon.TaguelChildFang:
                    if (attackUnit.hpPercentage <= 75) {
                        attackUnit.specialCount -= 2;
                    }
                    break;
                case Weapon.MasyouNoYari:
                case Weapon.DevilAxe:
                    attackUnit.reserveTakeDamage(4, true);
                    break;
                case Weapon.BatoruNoGofu:
                case Weapon.HinataNoMoutou:
                    if (attackUnit.isWeaponSpecialRefined) {
                        attackUnit.reserveTakeDamage(6, true);
                    }
                    break;
                case PassiveA.Fury1:
                    attackUnit.reserveTakeDamage(2, true);
                    break;
                case PassiveA.Fury2:
                    attackUnit.reserveTakeDamage(4, true);
                    break;
                case Weapon.FurasukoPlus:
                case Weapon.KabochaNoGyotoPlus:
                case Weapon.BikkuriBakoPlus:
                case Weapon.RosokuNoYumiPlus:
                case Weapon.Mistoruthin:
                case PassiveA.Fury3:
                    attackUnit.reserveTakeDamage(6, true);
                    break;
                case PassiveA.Fury4:
                    attackUnit.reserveTakeDamage(8, true);
                    break;
                case PassiveA.AtkSpdPush3:
                case PassiveA.AtkDefPush3:
                case PassiveA.AtkResPush3:
                    this.writeDebugLogLine("渾身3を評価: 戦闘前のHP=" + attackUnit.battleContext.hpBeforeCombat);
                    if (attackUnit.battleContext.hpBeforeCombat == attackUnit.maxHpWithSkills) {
                        this.writeLogLine("渾身3による1ダメージ");
                        attackUnit.reserveTakeDamage(1, true);
                    }
                    break;
                case PassiveA.AtkSpdPush4:
                case PassiveA.AtkResPush4:
                case PassiveA.AtkDefPush4:
                    this.writeDebugLogLine("渾身4を評価: 戦闘前のHP=" + attackUnit.battleContext.hpBeforeCombat);
                    if (attackUnit.battleContext.hpBeforeCombat >= Math.floor(attackUnit.maxHpWithSkills * 0.25)) {
                        this.writeLogLine("渾身4による5ダメージ");
                        attackUnit.reserveTakeDamage(5, true);
                    }
                    break;
                case PassiveB.OgiNoRasen3:
                case Weapon.MakenMistoruthin:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        attackUnit.specialCount -= 2;
                    }
                    break;
                case PassiveC.PanicSmoke3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.Panic);
                    }
                    break;
                case PassiveC.KodoNoGenen3:
                    this.writeDebugLogLine(attackUnit.getNameWithGroup() + "の鼓動の幻煙3発動");
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        this.writeDebugLogLine(unit.getNameWithGroup() + "の奥義カウントを+1");
                        unit.specialCount += 1;
                    }
                    break;
                case PassiveC.AtkSmoke1: this.__applySmokeSkill(attackTargetUnit, x => x.applyAtkDebuff(-3)); break;
                case PassiveC.AtkSmoke2: this.__applySmokeSkill(attackTargetUnit, x => x.applyAtkDebuff(-5)); break;
                case PassiveC.AtkSmoke3: this.__applySmokeSkill(attackTargetUnit, x => x.applyAtkDebuff(-7)); break;
                case PassiveC.SpdSmoke1: this.__applySmokeSkill(attackTargetUnit, x => x.applySpdDebuff(-3)); break;
                case PassiveC.SpdSmoke2: this.__applySmokeSkill(attackTargetUnit, x => x.applySpdDebuff(-5)); break;
                case PassiveC.SpdSmoke3: this.__applySmokeSkill(attackTargetUnit, x => x.applySpdDebuff(-7)); break;
                case PassiveC.DefSmoke1: this.__applySmokeSkill(attackTargetUnit, x => x.applyDefDebuff(-3)); break;
                case PassiveC.DefSmoke2: this.__applySmokeSkill(attackTargetUnit, x => x.applyDefDebuff(-5)); break;
                case PassiveC.DefSmoke3: this.__applySmokeSkill(attackTargetUnit, x => x.applyDefDebuff(-7)); break;
                case PassiveC.ResSmoke1: this.__applySmokeSkill(attackTargetUnit, x => x.applyResDebuff(-3)); break;
                case PassiveC.ResSmoke2: this.__applySmokeSkill(attackTargetUnit, x => x.applyResDebuff(-5)); break;
                case PassiveC.ResSmoke3: this.__applySmokeSkill(attackTargetUnit, x => x.applyResDebuff(-7)); break;
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
                case Weapon.Buryunhirude:
                    if (!attackUnit.isWeaponRefined) {
                        attackTargetUnit.addStatusEffect(StatusEffectType.Gravity);
                    }
                    break;
                case PassiveC.Jagan:
                case Weapon.GravityPlus:
                case Weapon.Sangurizuru:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 1, true)) {
                        unit.addStatusEffect(StatusEffectType.Gravity);
                    }
                    break;
                case Weapon.Gravity:
                    attackTargetUnit.addStatusEffect(StatusEffectType.Gravity);
                    break;
                case Weapon.SlowPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applySpdDebuff(-7);
                    }
                    break;
                case Weapon.Slow:
                    attackTargetUnit.applySpdDebuff(-6);
                    break;
                case Weapon.FearPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAtkDebuff(-7);
                    }
                    break;
                case Weapon.Fear:
                    attackTargetUnit.applyAtkDebuff(-6);
                    break;
                case Weapon.Pesyukado:
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
                case Weapon.RauorbladePlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.applyAtkBuff(5);
                        unit.applySpdBuff(5);
                    }
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAtkDebuff(-5);
                        unit.applySpdDebuff(-5);
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
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.KaihiTatakikomi3:
                case PassiveB.Tatakikomi:
                    this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterShove(unit, target, tile), false);
                    break;
                case PassiveB.Kirikomi:
                    this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterSwap(unit, target, tile), false);
                    break;
                case PassiveB.Hikikomi:
                    this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterDrawback(unit, target, tile), false);
                    break;
                case PassiveB.KaihiIchigekiridatsu3:
                case PassiveB.Ichigekiridatsu:
                    this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterDrawback(unit, target, tile), false, false);
                    break;
                case Weapon.EishinNoAnki:
                    {
                        let partners = this.__getPartnersInSpecifiedRange(atkUnit, 2);
                        if (partners.length == 1) {
                            let partner = partners[0];
                            this.__applyMovementAssist(atkUnit, partner,
                                (unit, target, tile) => this.__findTileAfterSwap(unit, target, tile), false);
                        }
                    }
                    break;
            }
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
                case Weapon.JoyfulVows:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
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
            }
        }
    }

    __applySkillEffectForUnit(targetUnit, enemyUnit, calcPotentialDamage) {
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
                case Weapon.CourtlyCandle:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                case PassiveB.CraftFighter3:
                    if (!targetUnit.battleContext.initiatesCombat
                        && targetUnit.snapshot.restHpPercentage >= 25
                    ){
                        targetUnit.battleContext.reducesCooldownCount = true;
                        ++targetUnit.battleContext.followupAttackPriority;
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
                case PassiveA.AtkDefUnity:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces = this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (targetUnit.battleContext.isThereAnyUnitIn2Spaces) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        let atkDebuff = targetUnit.getAtkDebuffInCombat();
                        if (atkDebuff < 0) {
                            targetUnit.atkSpur += -atkDebuff * 2;
                        }
                        let defDebuff = targetUnit.getDefDebuffInCombat();
                        if (defDebuff < 0) {
                            targetUnit.defSpur += -defDebuff * 2;
                        }
                    }
                    break;
                case Weapon.MoonGradivus:
                    targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    break;
                case Weapon.WindParthia:
                    targetUnit.battleContext.isThereAnyUnitIn2Spaces = this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
                    if (targetUnit.battleContext.initiatesCombat
                        || targetUnit.battleContext.isThereAnyUnitIn2Spaces
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
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                        }
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
                                targetUnit.battleContext.invalidatesAtkBuff = true;
                                targetUnit.battleContext.invalidatesSpdBuff = true;
                            }
                        }
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
                        if (targetUnit.snapshot.restHpPercentage >= 25 && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case Weapon.StalwartSword:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
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
                case Weapon.RuneAxe:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.addAllSpur(4);
                        }
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
                        targetUnit.battleContext.increaseCooldownCountForBoth();
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
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                    }
                    break;
                case PassiveA.AtkResBond4:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnResDebuff = true;
                    }
                    break;
                case Weapon.OgonNoFolkPlus:
                case Weapon.NinjinhuNoSosyokuPlus:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                    }
                    break;
                case Weapon.VezuruNoYoran:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
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
                        targetUnit.battleContext.damageReductionRatioOfFirstAttack = 0.5;
                    }
                    break;
                case Weapon.FukenFalcion:
                    if (targetUnit.snapshot.restHpPercentage < 100) {
                        targetUnit.addAllSpur(5);
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
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.snapshot.restHpPercentage >= 25) {
                                targetUnit.addAllSpur(5);
                            }
                        }
                    }
                    else if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.Niu:
                    if (enemyUnit.isBuffed && !enemyUnit.hasPanic) {
                        let amount = Math.floor(enemyUnit.buffTotal * 0.5);
                        targetUnit.addAllSpur(amount);
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
                        targetUnit.battleContext.damageReductionRatioOfFirstAttack = 0.3;
                    }
                    break;
                case Weapon.Seini:
                    if (enemyUnit.moveType == MoveType.Armor || enemyUnit.moveType == MoveType.Cavalry) {
                        if (enemyUnit.isRangedWeaponType()) {
                            targetUnit.battleContext.damageReductionRatioOfFirstAttack = 0.3;
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
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.atkSpur += 3;
                        targetUnit.spdSpur += 3;
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
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
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
                case Weapon.BouryakuNoSenkyu:
                    if (targetUnit.buffTotal + enemyUnit.debuffTotal >= 10) {
                        enemyUnit.addAllSpur(-5);
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
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
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
                case Weapon.Forukuvangu:
                    if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.GrayNoHyouken:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                            targetUnit.addAllSpur(5);
                        }
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
                    this.__applyFlashingBladeSkill(targetUnit, enemyUnit);
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
                    else {
                        if (targetUnit.snapshot.restHpPercentage <= 50) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
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
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
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
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
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
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
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
                case Weapon.RauaFoxPlus:
                    defUnit.addAllSpur(-4);
                    break;
                case Weapon.RohyouNoKnife:
                    if (defUnit.isMeleeWeaponType()) {
                        atkUnit.defSpur += 20;
                    }
                    break;
                case Weapon.Paruthia:
                    if (!atkUnit.isWeaponRefined) {
                        atkUnit.resSpur += 4;
                    }
                    else {
                        if (isWeaponTypeTome(defUnit.weaponType)) {
                            atkUnit.battleContext.damageReductionRatioOfFirstAttack = 0.3;
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
                        atkUnit.battleContext.damageReductionRatioOfFirstAttack = 0.5;
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
                case Weapon.TallHammer:
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
                        defUnit.battleContext.damageReductionRatioOfFirstAttack = 0.5;
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

    __setEffectiveAttackEnabled(atkUnit, defUnit, atkWeaponInfo) {
        atkUnit.battleContext.isEffectiveToOpponent = false;
        for (let effective of atkWeaponInfo.effectives) {
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
        for (let unit of this.enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit)) {
            if (!unit.isOnMap) { continue; }
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
        let result = this.calcDamage(atkUnit, defUnit, attackTile);
        this.setDamageCalcSummary(
            atkUnit,
            defUnit,
            this.__createDamageCalcSummaryHtml(atkUnit, result.atkUnit_normalAttackDamage, result.atkUnit_totalAttackCount,
                result.atkUnit_atk,
                result.atkUnit_spd,
                result.atkUnit_def,
                result.atkUnit_res),
            this.__createDamageCalcSummaryHtml(defUnit, result.defUnit_normalAttackDamage, result.defUnit_totalAttackCount,
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

    __createDamageCalcSummaryHtml(unit, damage, attackCount,
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
            html += "攻撃: " + damage;
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
                                case Weapon.Hlidskjalf:
                                    {
                                        targetUnit.atkSpur += 3;
                                        targetUnit.spdSpur += 3;
                                    }
                                    break;
                            }
                        }
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
                        this.__addSpurInCross(targetUnit, unit.weapon, calcPotentialDamage);
                    }
                }
            }

            // 周囲の敵から受ける戦闘中弱化
            {
                for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                    for (let skillId of unit.enumerateSkills()) {
                        switch (skillId) {
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
                            case PassiveC.AtkSpdRein3:
                                targetUnit.atkSpur -= 4;
                                targetUnit.spdSpur -= 4;
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
                    case PassiveA.SpdDefForm3:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.spdSpur += amount;
                                unit.defSpur += amount;
                            }, 1);
                        break;
                }
            }
        }

        if (this.__isSolo(targetUnit) || calcPotentialDamage) {
            for (let skillId of targetUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.GousouJikumunto:
                    case Weapon.KokkiNoKosou:
                    case Weapon.MaritaNoKen:
                        targetUnit.addAllSpur(4);
                        break;
                    case Weapon.ShirejiaNoKaze:
                    case Weapon.BrazenCatFang:
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
                    case PassiveA.SpdDefSolo3:
                        targetUnit.spdSpur += 6; targetUnit.defSpur += 6;
                        break;
                    case PassiveA.SpdResSolo3:
                        targetUnit.spdSpur += 6; targetUnit.resSpur += 6;
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

    __addSpurInCross(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
            switch (skillId) {
                case Weapon.FlowerOfJoy:
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                    break;
            }
        }
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

    __addSpurInRange2(targetUnit, allyUnit, calcPotentialDamage) {
        for (let skillId of allyUnit.enumerateSkills()) {
            if (!calcPotentialDamage) {
                switch (skillId) {
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
        for (let otherUnit of this.enumerateUnitsInTheSameGroup(unit, false)) {
            if (!otherUnit.isOnMap) { continue; }
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
    __applySabotageSkill(skillOwnerUnit, debuffFunc) {
        this.__applySabotageSkillImpl(
            skillOwnerUnit,
            unit => unit.snapshot.getEvalResInPrecombat() <= (skillOwnerUnit.snapshot.getEvalResInPrecombat() - 3),
            debuffFunc);
    }
    __applyPolySkill(skillOwnerUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroup(skillOwnerUnit)) {
            if (this.__isInCloss(skillOwnerUnit, unit)
                && unit.snapshot.getEvalResInPrecombat() < skillOwnerUnit.snapshot.getEvalResInPrecombat()
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
        let maxUnit = null;
        let maxVal = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwnerUnit)) {
            let val = getValueFunc(unit);
            if (val > maxVal) {
                maxVal = val;
                maxUnit = unit;
            }
        }
        if (maxUnit != null) {
            buffFunc(maxUnit);
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
            unit.applyAllDebuff(-4);
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

    __applySkillForBeginningOfTurn(skillId, skillOwner) {
        if (isWeaponTypeBeast(skillOwner.weaponType) && skillOwner.hasWeapon) {
            if (!this.__isNextToOtherUnitsExceptDragonAndBeast(skillOwner)) {
                skillOwner.isTransformed = true;
            }
            else {
                skillOwner.isTransformed = false;
            }
        }

        switch (skillId) {
            case Weapon.GunshinNoSyo:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => unit.snapshot.getEvalResInPrecombat() < skillOwner.snapshot.getEvalResInPrecombat(),
                    unit => {
                        unit.applyAtkDebuff(-4); unit.applyResDebuff(-4);
                    });
                break;
            case PassiveC.MilaNoHaguruma:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => unit.snapshot.getDefInPrecombat() < skillOwner.snapshot.getDefInPrecombat(),
                    unit => unit.addStatusEffect(StatusEffectType.Isolation));
                break;
            case Weapon.Gjallarbru:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => unit.snapshot.hp <= skillOwner.snapshot.hp - 3,
                    unit => unit.addStatusEffect(StatusEffectType.Isolation));
                break;
            case Weapon.SerujuNoKyoufu:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applySkillToEnemiesInCross(skillOwner,
                        unit => unit.snapshot.hp < skillOwner.snapshot.hp,
                        unit => unit.addStatusEffect(StatusEffectType.Panic));
                }
                break;
            case PassiveC.KyokoNoKisaku3:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => unit.snapshot.hp < skillOwner.snapshot.hp,
                    unit => unit.addStatusEffect(StatusEffectType.Panic));
                break;
            case Weapon.Sekku:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(
                    skillOwner.posX, skillOwner.posY, skillOwner.enemyGroupId, 1, 99)
                ) {
                    if (unit.isRangedWeaponType()
                        && this.__getStatusEvalUnit(skillOwner).hp >= this.__getStatusEvalUnit(unit).hp + 3
                    ) {
                        unit.addStatusEffect(StatusEffectType.Gravity);
                    }
                }
                break;
            case Weapon.AnyaryuNoBreath:
                if (this.vm.currentTurn == 4) {
                    let count = 0;
                    for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                        unit.takeDamage(10, true);
                        ++count;
                    }
                    skillOwner.heal(count * 5);
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
                        unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                        unit.takeDamage(5, true);
                    }
                }
                break;
            case Weapon.Hyoushintou:
                for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
                    unit.applyAllDebuff(-4);
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
            case Weapon.Scadi:
                if (this.vm.currentTurn == 3) {
                    let groupId = UnitGroupType.Enemy;
                    if (skillOwner.groupId == UnitGroupType.Enemy) {
                        groupId = UnitGroupType.Ally;
                    }
                    for (let unit of this.enumerateUnitsWithinSpecifiedRange(
                        skillOwner.posX, skillOwner.posY, groupId, 3, 99)
                    ) {
                        unit.addStatusEffect(StatusEffectType.Panic);
                        unit.takeDamage(10, true);
                    }
                }
                break;
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
                        unit.applyAtkDebuff(-6);
                        unit.applySpdDebuff(-6);
                    }
                }
                break;
            case PassiveB.KoriNoHuin:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 50) {
                    for (let unit of this.__findMinStatusUnits(
                        skillOwner.groupId == UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally,
                        x => this.__getStatusEvalUnit(x).getDefInPrecombat())
                    ) {
                        unit.applyAtkDebuff(-6);
                        unit.applySpdDebuff(-6);
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
                    unit.addStatusEffect(StatusEffectType.BonusDoubler);
                }
                break;
            case PassiveB.Recovering:
                skillOwner.heal(10);
                break;
            case Weapon.FalchionRefined:
            case Weapon.FalcionEchoes:
            case Weapon.FalchionAwakening:
            case Weapon.KiriNoBreath:
            case PassiveB.Renewal1:
                if ((this.vm.currentTurn + 1) % 4 == 0) {
                    skillOwner.heal(10);
                }
                break;
            case PassiveB.Renewal2:
                if ((this.vm.currentTurn + 1) % 3 == 0) {
                    skillOwner.heal(10);
                }
                break;
            case PassiveB.Renewal3:
                if ((this.vm.currentTurn + 1) % 2 == 0) {
                    skillOwner.heal(10);
                }
                break;
            case Weapon.TamagoNoTsuePlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, true)) {
                    unit.heal(7);
                }
                break;
            case Weapon.ShirasagiNoTsubasa:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, false)) {
                    unit.heal(7);
                }
                break;
            case PassiveC.SeimeiNoKagayaki:
                {
                    let targetUnits = [];
                    let maxDamage = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                        let damage = unit.snapshot.currentDamage;
                        if (damage > maxDamage) {
                            maxDamage = damage;
                            targetUnits = [unit];
                        }
                        else if (damage == maxDamage) {
                            targetUnits.push(unit);
                        }
                    }
                    for (let unit of targetUnits) {
                        unit.heal(10);
                    }
                }
                break;
            case PassiveC.HajimariNoKodo3:
                if (skillOwner.snapshot.isSpecialCountMax) {
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
                this.__applyOpeningSkill(skillOwner, x => x.snapshot.getAtkInPrecombat(), x => x.applyAtkBuff(6));
                break;
            case PassiveC.SpdOpening3:
                this.__applyOpeningSkill(skillOwner, x => x.snapshot.getSpdInPrecombat(), x => x.applySpdBuff(6));
                break;
            case PassiveC.DefOpening3:
                this.__applyOpeningSkill(skillOwner, x => x.snapshot.getDefInPrecombat(), x => x.applyDefBuff(6));
                break;
            case PassiveC.ResOpening3:
                this.__applyOpeningSkill(skillOwner, x => x.snapshot.getResInPrecombat(), x => x.applyResBuff(6));
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
            case PassiveC.AtkSpdOath3: this.__applyOathSkill(skillOwner, x => { x.applyAtkBuff(5); x.applySpdBuff(5); }); break;
            case PassiveC.AtkDefOath3: this.__applyOathSkill(skillOwner, x => { x.applyAtkBuff(5); x.applyDefBuff(5); }); break;
            case PassiveC.AtkResOath3: this.__applyOathSkill(skillOwner, x => { x.applyAtkBuff(5); x.applyResBuff(5); }); break;
            case PassiveC.DefResOath3: this.__applyOathSkill(skillOwner, x => { x.applyDefBuff(5); x.applyResBuff(5); }); break;
            case PassiveC.Upheaval:
                if (this.vm.currentTurn == 1) {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        unit.takeDamage(7, true);
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
                            unit.addStatusEffect(StatusEffectType.AirOrders);
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
                            unit.addStatusEffect(StatusEffectType.AirOrders);
                            break;
                    }
                }
                break;
            case PassiveC.DivineFang:
                for (let otherUnit of this.enumerateUnitsInTheSameGroup(skillOwner, false)) {
                    if (!otherUnit.isOnMap) { continue; }
                    if (skillOwner.isNextTo(otherUnit)) {
                        otherUnit.addStatusEffect(StatusEffectType.EffectiveAgainstDragons);
                    }
                }
                break;
            case PassiveC.SolitaryDream:
                if (!this.__isNextToOtherUnitsExcept(skillOwner, x => isWeaponTypeBreath(x.weaponType))) {
                    skillOwner.applyAllBuff(4);
                    skillOwner.moveCount = 2;
                }
                break;
            case PassiveC.WithEveryone:
                for (let otherUnit of this.enumerateUnitsInTheSameGroup(skillOwner, false)) {
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
                    unit.takeDamage(20, true);
                }
                break;
            case PassiveC.SurtrsMenace:
                {
                    let isEnemyInSpaces = false;
                    for (let unit of this.enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.applyAllDebuff(-4);
                        isEnemyInSpaces = true;
                    }
                    if (isEnemyInSpaces) {
                        skillOwner.applyAllBuff(4);
                    }
                }
                break;
            case PassiveC.ArmoredStride3:
                if (!this.__isThereAllyInSpecifiedSpaces(skillOwner, 1)) {
                    skillOwner.addStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case PassiveS.ArmoredBoots:
                if (this.__getStatusEvalUnit(skillOwner).isFullHp) {
                    skillOwner.addStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case Weapon.FlowerHauteclere:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 25) {
                    skillOwner.addStatusEffect(StatusEffectType.MobilityIncreased);
                    skillOwner.addStatusEffect(StatusEffectType.AirOrders);
                }
                break;
            case Weapon.Faraflame:
                this.__applyPolySkill(skillOwner, unit => {
                    unit.applyAtkDebuff(-4);
                    unit.applyResDebuff(-4);
                });
                break;
            case Weapon.KatarinaNoSyo:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyPolySkill(skillOwner, unit => {
                        unit.applySpdDebuff(-4);
                        unit.applyResDebuff(-4);
                    });
                }
                break;
            case PassiveC.AtkPloy3: this.__applyPolySkill(skillOwner, unit => unit.applyAtkDebuff(-5)); break;
            case PassiveC.SpdPloy3: this.__applyPolySkill(skillOwner, unit => unit.applySpdDebuff(-5)); break;
            case PassiveC.DefPloy3: this.__applyPolySkill(skillOwner, unit => unit.applyDefDebuff(-5)); break;
            case PassiveC.ResPloy3: this.__applyPolySkill(skillOwner, unit => unit.applyResDebuff(-5)); break;
            case PassiveC.ChaosNamed:
                for (let unit of this.enumerateUnitsInDifferentGroup(skillOwner)) {
                    if (!unit.isOnMap) { continue; }
                    if (skillOwner.posX - 1 <= unit.posX && unit.posX <= skillOwner.posX + 1) {
                        if (unit.snapshot.getEvalResInPrecombat() <= (skillOwner.snapshot.getEvalResInPrecombat() - 3)) {
                            unit.applyDebuffForHighestStatus(-5, true);
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
                    for (let unit of this.enumerateUnitsInTheSameGroup(skillOwner, true)) {
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
                    let skillOwnerHp = skillOwner.snapshot.hp;
                    for (let unit of this.enumerateUnitsInTheSameGroup(skillOwner)) {
                        if (unit.moveType == MoveType.Infantry
                            && unit.snapshot.hp < skillOwnerHp
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
                    skillOwner.heal(99);
                }
                break;
            case PassiveS.OgiNoKodou:
                if (this.vm.currentTurn == 1) {
                    this.writeDebugLogLine(skillOwner.getNameWithGroup() + "の奥義の鼓動により奥義発動カウント-1");
                    skillOwner.reduceSpecialCount(1);
                }
                break;
            case PassiveB.SabotageAtk3:
                this.__applySabotageSkill(skillOwner, unit => { unit.applyAtkDebuff(-7); });
                break;
            case PassiveB.SabotageSpd3:
                this.__applySabotageSkill(skillOwner, unit => { unit.applySpdDebuff(-7); });
                break;
            case PassiveB.SabotageDef3:
                this.__applySabotageSkill(skillOwner, unit => { unit.applyDefDebuff(-7); });
                break;
            case PassiveB.SabotageRes3:
                this.__applySabotageSkill(skillOwner, unit => { unit.applyResDebuff(-7); });
                break;
            case Weapon.WeirdingTome:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.applySpdDebuff(-5); unit.applyResDebuff(-5); });
                break;
            case Weapon.TemariPlus:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.applyAtkDebuff(-5); unit.applySpdDebuff(-5); });
                break;
            case PassiveB.YunesSasayaki:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.applyAtkDebuff(-6); unit.applySpdDebuff(-6); });
                break;
            case Weapon.KinunNoYumiPlus:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.applyDefDebuff(-5); unit.applyResDebuff(-5); });
                break;
            case Weapon.IagosTome:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInDifferentGroup(skillOwner)) {
                        if (!unit.isOnMap) { continue; }
                        if (this.__isNextToOtherUnits(unit)) { continue; }
                        if (!(unit.snapshot.hp <= (skillOwner.snapshot.hp - 3))) { continue; }
                        unit.applyAtkDebuff(-4);
                        unit.applySpdDebuff(-4);
                        unit.addStatusEffect(StatusEffectType.Guard);
                    }
                }
                else {
                    for (let unit of this.enumerateUnitsInDifferentGroup(skillOwner)) {
                        if (!unit.isOnMap) { continue; }
                        if (!this.__isNextToOtherUnits(unit)) { continue; }
                        if (!(unit.snapshot.hp <= (skillOwner.snapshot.hp - 3))) { continue; }
                        unit.applyDefDebuff(-4);
                        unit.applyResDebuff(-4);
                        unit.addStatusEffect(StatusEffectType.Panic);
                    }
                }
                break;
            case Weapon.AversasNight:
                this.__applySabotageSkillImpl(
                    skillOwner,
                    unit => unit.snapshot.hp <= (skillOwner.snapshot.hp - 3),
                    unit => { unit.applyAllDebuff(-3); unit.addStatusEffect(StatusEffectType.Panic); });
                break;
            case Weapon.KokyousyaNoYari:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applySabotageSkill(skillOwner, unit => { unit.applyAtkDebuff(-7); });
                }
                break;
            case Weapon.KizokutekinaYumi:
            case PassiveB.KyokoNoWakuran3:
                {
                    for (let unit of this.enumerateUnitsInDifferentGroup(skillOwner)) {
                        if (!unit.isOnMap) { continue; }
                        if (!this.__isNextToOtherUnits(unit)) { continue; }
                        if (unit.snapshot.hp <= (skillOwner.snapshot.hp - 1)) {
                            this.writeDebugLogLine(skillOwner.getNameWithGroup() + "はHP" + skillOwner.snapshot.hp + ", "
                                + unit.getNameWithGroup() + "はHP" + unit.snapshot.hp + "で恐慌の惑乱適用");
                            unit.addStatusEffect(StatusEffectType.Panic);
                        }
                    }
                }
                break;
            case Weapon.Fensariru:
                if (!skillOwner.isWeaponRefined) {
                    this.__applyThreatenSkill(skillOwner, x => x.applyAtkDebuff(-4));
                }
                break;
            case Weapon.Ekkezakkusu:
                if (!skillOwner.isWeaponRefined) {
                    this.__applyThreatenSkill(skillOwner, x => x.applyDefDebuff(-4));
                } else {
                    this.__applyThreatenSkill(skillOwner, x => x.applyDefDebuff(-6), x => !isWeaponTypeBreath(x.weaponType));
                }
                break;
            case PassiveC.ThreatenAtk1: this.__applyThreatenSkill(skillOwner, x => x.applyAtkDebuff(-3)); break;
            case PassiveC.ThreatenAtk2: this.__applyThreatenSkill(skillOwner, x => x.applyAtkDebuff(-4)); break;
            case PassiveC.ThreatenAtk3: this.__applyThreatenSkill(skillOwner, x => x.applyAtkDebuff(-5)); break;
            case PassiveC.ThreatenSpd1: this.__applyThreatenSkill(skillOwner, x => x.applySpdDebuff(-3)); break;
            case PassiveC.ThreatenSpd2: this.__applyThreatenSkill(skillOwner, x => x.applySpdDebuff(-4)); break;
            case PassiveC.ThreatenSpd3: this.__applyThreatenSkill(skillOwner, x => x.applySpdDebuff(-5)); break;
            case PassiveC.ThreatenDef1: this.__applyThreatenSkill(skillOwner, x => x.applyDefDebuff(-3)); break;
            case PassiveC.ThreatenDef2: this.__applyThreatenSkill(skillOwner, x => x.applyDefDebuff(-4)); break;
            case PassiveC.ThreatenDef3: this.__applyThreatenSkill(skillOwner, x => x.applyDefDebuff(-5)); break;
            case PassiveC.ThreatenRes1: this.__applyThreatenSkill(skillOwner, x => x.applyResDebuff(-3)); break;
            case PassiveC.ThreatenRes2: this.__applyThreatenSkill(skillOwner, x => x.applyResDebuff(-4)); break;
            case PassiveC.ThreatenRes3: this.__applyThreatenSkill(skillOwner, x => x.applyResDebuff(-5)); break;
            case PassiveC.ThreatenAtkSpd3:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        skillOwner.applyAtkBuff(5); skillOwner.applySpdBuff(5);
                        x.applyAtkDebuff(-5); x.applySpdDebuff(-5);
                    });
                break;
            case Weapon.MeikiNoBreath:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.applyAtkDebuff(-7); x.applySpdDebuff(-7);
                    });
                break;
            case PassiveC.ThreatenAtkRes3:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        skillOwner.applyAtkBuff(5); skillOwner.applyResBuff(5);
                        x.applyAtkDebuff(-5); x.applyResDebuff(-5);
                    });
                break;
            case PassiveC.ThreatenAtkDef3:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        skillOwner.applyAtkBuff(5); skillOwner.applyDefBuff(5);
                        x.applyAtkDebuff(-5); x.applyDefDebuff(-5);
                    });
                break;
            case Weapon.GunshiNoFusho:
            case Weapon.GunshiNoRaisyo:
                this.__applyTacticSkill(skillOwner, x => { x.applyAllBuff(4); });
                break;
            case PassiveC.AtkTactic1: this.__applyTacticSkill(skillOwner, x => { x.applyAtkBuff(2); }); break;
            case PassiveC.AtkTactic2: this.__applyTacticSkill(skillOwner, x => { x.applyAtkBuff(4); }); break;
            case PassiveC.AtkTactic3: this.__applyTacticSkill(skillOwner, x => { x.applyAtkBuff(6); }); break;
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
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return unit.snapshot.getResInPrecombat() },
                        unit => { unit.applyAtkDebuff(-5); unit.applyDefDebuff(-5); });
                }
                break;
            case Weapon.RosenshiNoKofu:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return unit.snapshot.getSpdInPrecombat() },
                        unit => { unit.applyAtkDebuff(-5); unit.applyDefDebuff(-5); });
                }
                break;
            case Weapon.MuninNoMaran:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return unit.snapshot.getSpdInPrecombat() },
                        unit => { unit.applyAtkDebuff(-5); unit.applyResDebuff(-5); });
                }
                break;
            case PassiveB.ChillAtkRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getAtkInPrecombat() + unit.snapshot.getResInPrecombat() },
                    unit => { unit.applyAtkDebuff(-5); unit.applyResDebuff(-5); }); break;
            case PassiveB.ChillAtkSpd2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getAtkInPrecombat() + unit.snapshot.getSpdInPrecombat() },
                    unit => { unit.applyAtkDebuff(-5); unit.applySpdDebuff(-5); }); break;
            case PassiveB.ChillSpdDef2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getDefInPrecombat() + unit.snapshot.getSpdInPrecombat() },
                    unit => { unit.applyDefDebuff(-5); unit.applySpdDebuff(-5); }); break;
            case PassiveB.ChillSpdRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getResInPrecombat() + unit.snapshot.getSpdInPrecombat() },
                    unit => { unit.applyResDebuff(-5); unit.applySpdDebuff(-5); }); break;
            case PassiveB.ChillAtk1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getAtkInPrecombat() },
                    unit => { unit.applyAtkDebuff(-3); }); break;
            case PassiveB.ChillAtk2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getAtkInPrecombat() },
                    unit => { unit.applyAtkDebuff(-5); }); break;
            case Weapon.SyungeiNoKenPlus:
            case Weapon.WindsBrand:
            case PassiveB.ChillAtk3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getAtkInPrecombat() },
                    unit => { unit.applyAtkDebuff(-7); }); break;
            case PassiveB.ChillSpd1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getSpdInPrecombat() },
                    unit => { unit.applySpdDebuff(-3); }); break;
            case PassiveB.ChillSpd2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getSpdInPrecombat() },
                    unit => { unit.applySpdDebuff(-5); }); break;
            case Weapon.TekiyaPlus:
            case PassiveB.ChillSpd3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getSpdInPrecombat() },
                    unit => { unit.applySpdDebuff(-7); }); break;
            case PassiveB.ChillDef1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getDefInPrecombat() },
                    unit => { unit.applyDefDebuff(-3); }); break;
            case PassiveB.ChillDef2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getDefInPrecombat() },
                    unit => { unit.applyDefDebuff(-5); }); break;
            case Weapon.WagasaPlus:
            case Weapon.GinNoHokyu:
            case PassiveB.ChillDef3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getDefInPrecombat() },
                    unit => { unit.applyDefDebuff(-7); }); break;
            case PassiveB.ChillRes1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getResInPrecombat() },
                    unit => { unit.applyResDebuff(-3); }); break;
            case PassiveB.ChillRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getResInPrecombat() },
                    unit => { unit.applyResDebuff(-5); }); break;
            case Weapon.Forblaze:
            case PassiveB.ChillRes3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getResInPrecombat() },
                    unit => { unit.applyResDebuff(-7); }); break;
            case Weapon.KumadePlus:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return unit.snapshot.getDefInPrecombat() },
                    unit => { unit.applyAtkDebuff(-5); unit.applySpdDebuff(-5); }); break;
            case PassiveC.ArmorMarch3:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, false)) {
                    if (unit.moveType == MoveType.Armor) {
                        this.writeLogLine(unit.getNameWithGroup() + "は重装の行軍により移動値+1");
                        unit.moveCount = 2;
                        this.writeLogLine(skillOwner.getNameWithGroup() + "は重装の行軍により移動値+1");
                        skillOwner.moveCount = 2;
                    }
                }
                break;
        }
    }

    __isNextToOtherUnitsExcept(unit, exceptCondition) {
        for (let otherUnit of this.enumerateUnitsInTheSameGroup(unit, false)) {
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
        if (targetUnits.length == 0) {
            return;
        }

        let enemyUnits = [];
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnits[0])) {
            enemyUnits.push(unit);
        }

        // ターンワイド状態の評価と保存
        {
            for (let unit of targetUnits) {
                unit.clearPerTurnStatuses();

                // すり抜け状態の更新
                if (unit.canActivatePass()) {
                    unit.addPerTurnStatus(PerTurnStatusType.Pass);
                }

                // 敵への距離を更新
                this.__updateDistanceFromClosestEnemy(unit, enemyUnits);

                // 移動数
                unit.moveCountAtBeginningOfTurn = unit.moveCount;
            }
            this.__updateMovementOrders(targetUnits);
        }

        // 脅威の評価
        this.__updateEnemyThreatStatusesForAll(targetUnits, enemyUnits);

        let group = targetUnits[0].groupId;
        for (let unit of targetUnits) {
            unit.endAction();
            unit.beginAction();
            // console.log(unit.getNameWithGroup() + ": moveCount=" + unit.moveCount);

            // 比翼や双界スキル発動カウントリセット
            unit.isDuoOrHarmonicSkillActivatedInThisTurn = false;
            if (unit.heroIndex == Hero.YoungPalla) {
                if (this.isOddTurn) {
                    unit.duoOrHarmonizedSkillActivationCount = 0;
                }
            }
            else if (unit.heroIndex == Hero.SummerMia
                || unit.heroIndex == Hero.SummerByleth
                || unit.heroIndex == Hero.PirateVeronica
            ) {
                if (this.vm.currentTurn % 3 == 1) {
                    unit.duoOrHarmonizedSkillActivationCount = 0;
                }
            }
        }

        for (let unit of enemyUnits) {
            unit.endAction();
        }

        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.resetOneTimeActionActivationStates();

            // 評価用のスナップショットを作成
            unit.createSnapshot();
        }

        for (let unit of targetUnits) {
            this.writeDebugLogLine(unit.getNameWithGroup() + "のターン開始時発動スキルを適用..");
            for (let skillId of unit.enumerateSkills()) {
                this.__applySkillForBeginningOfTurn(skillId, unit);
            }
        }

        this.executeStructuresByUnitGroupType(group);

        for (let unit of targetUnits) {
            unit.deleteSnapshot();
        }

        // 化身によりステータス変化する
        g_appData.__updateStatusBySkillsAndMergeForAllHeroes();

        // ターン開始時の移動値を記録
        for (let unit of this.enumerateAllUnitsOnMap(x => true)) {
            unit.moveCountAtBeginningOfTurn = unit.moveCount;
        }
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

    simulateBeginningOfEnemyTurn() {
        if (this.vm.currentTurn == this.vm.maxTurn) {
            return;
        }

        let self = this;
        this.__enqueueCommand("敵ターン開始", function () {
            self.vm.currentTurnType = UnitGroupType.Enemy;
            self.audioManager.playSoundEffect(SoundEffectId.EnemyPhase);
            self.__simulateBeginningOfTurn(self.__getOnMapEnemyUnitList());
        });
    }
    simulateBeginningOfAllyTurn() {
        if (this.vm.currentTurn == this.vm.maxTurn) {
            return;
        }
        let self = this;
        console.trace("自ターン開始をエンキュー");
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

    examinesAttackableEnemies() {
        let currentTurn = this.vm.currentTurn;

        // 元の状態を保存
        let serializedTurn = exportPerTurnSettingAsString();

        // 施設を除外
        this.removeDefenceStructuresNoEffectForEnemyMovement();

        // 施設を除外した状態で一旦保存
        this.tempSerializedTurn = exportPerTurnSettingAsString();

        let targetUnits = [];
        for (let unit of this.__origAi_enumerateAttackersAndRefreshers(UnitGroupType.Ally)) {
            targetUnits.push(unit);
        }
        for (let unit of this.enumerateAllUnitsOnMap(x => x.groupId == UnitGroupType.Ally)) {
            // moveUnitToTrashBox(unit);
            this.map.removeUnit(unit);
        }

        let patterns = [];
        this.__placeUnitToPlaceableSafeTilesNextToThreatenedTiles(targetUnits, () => {
            this.writeDebugLogLine("----");
            let pattern = [];
            for (let unit of this.enumerateAllUnitsOnMap(x => x.groupId == UnitGroupType.Ally)) {
                this.writeDebugLogLine(`${unit.getNameWithGroup()}: ${unit.placedTile.positionToString()}`);

                let snapshot = new Unit(unit.id);
                snapshot.posX = unit.posX;
                snapshot.posY = unit.posY;
                pattern.push(snapshot);
            }
            patterns.push(pattern);
            this.writeDebugLogLine("----");
        });

        let self = this;
        let i = this.currentPatternIndex;
        ++this.currentPatternIndex;
        this.currentPatternIndex = this.currentPatternIndex % patterns.length;
        let alivePattern = null;
        for (let i = 0; i < patterns.length; ++i) {

            this.vm.currentTurn = currentTurn;
            importPerTurnSetting(this.tempSerializedTurn);

            this.commandQueuePerAction.clear();
            this.clearAllLogs();

            let pattern = patterns[i];
            for (let snapshot of pattern) {
                let unit = self.findUnitById(snapshot.id);
                self.map.placeUnitForcibly(unit, snapshot.posX, snapshot.posY);
            }

            while (this.vm.currentTurnType == UnitGroupType.Ally) {
                let isAllUnitActionDone = this.__origAi_simulate();
                if (isAllUnitActionDone) {
                    this.__enqueueEndAllUnitActionCommand(UnitGroupType.Ally);
                }
                this.__executeAllCommands(this.commandQueuePerAction, 0);
            }

            while (this.vm.currentTurnType == UnitGroupType.Enemy) {
                let isAllUnitActionDone = this.__simulateEnemyAction();
                if (isAllUnitActionDone) {
                    this.__enqueueEndAllUnitActionCommand(UnitGroupType.Enemy);
                }
                this.__executeAllCommands(this.commandQueuePerAction, 0);
                if (!this.__areAllAlliesAlive()) {
                    break;
                }
            }

            if (this.__areAllAlliesAlive()) {
                alivePattern = pattern;
                break;
            }
        }

        if (alivePattern == null) {
            importPerTurnSetting(this.serializedTurn);
            this.writeSimpleLogLine("生存パターンが見つかりませんでした");
        }
        else {
            this.writeSimpleLogLine("生存パターンが見つかりました");
            // 味方の配置状態までUndo
            while (this.commandQueuePerAction.isUndoable) {
                this.commandQueuePerAction.undo();
            }

            importPerTurnSetting(serializedTurn);

            let usedTiles = [];
            for (let snapshot of alivePattern) {
                let tile = self.map.getTile(snapshot.posX, snapshot.posY);
                usedTiles.push(tile);

                let unit = self.findUnitById(snapshot.id);
                self.map.placeUnitForcibly(unit, snapshot.posX, snapshot.posY);

                if (tile.obj != null) {
                    moveStructureToTrashBox(tile.obj);
                }
            }

            let redoStackData = this.commandQueuePerAction.redoStack.data;
            for (let i = redoStackData.length - 1; i >= 0; --i) {
                let command = redoStackData[i];
                if (!command.label.startsWith("移動")) {
                    continue;
                }

                let tileToMove = command.metaData.tileToMove;
                if (tileToMove.obj != null) {
                    moveStructureToTrashBox(tileToMove.obj);
                }

                let moveUnit = command.metaData.unit;
                usedTiles.push(tileToMove);

                {
                    let dist = tileToMove.calculateUnitMovementCountToThisTile(moveUnit, moveUnit.placedTile, moveUnit.moveCount);
                    if (dist != CanNotReachTile) {
                        continue;
                    }
                }

                // 破壊する施設候補を列挙
                let minX = Math.min(tileToMove.posX, moveUnit.placedTile.posX);
                let maxX = Math.max(tileToMove.posX, moveUnit.placedTile.posX);
                let minY = Math.min(tileToMove.posY, moveUnit.placedTile.posY);
                let maxY = Math.max(tileToMove.posY, moveUnit.placedTile.posY);
                for (let tile of this.map.enumerateTiles(x =>
                    minX <= x.posX && x.posX <= maxX
                    && minY <= x.posY && x.posY <= maxY)
                ) {
                    if (tile.obj == null) {
                        continue;
                    }

                    usedTiles.push(tile);
                    moveStructureToTrashBox(tile.obj);

                    let dist = tileToMove.calculateUnitMovementCountToThisTile(moveUnit, moveUnit.placedTile, moveUnit.moveCount);
                    if (dist != CanNotReachTile) {
                        break;
                    }
                }

                self.map.placeUnitForcibly(moveUnit, tileToMove.posX, tileToMove.posY);
            }

            importPerTurnSetting(serializedTurn);

            this.writeDebugLogLine("初撃で利用するマス-----");
            let tilesToNeedToBreakObj = [];
            for (let tile of usedTiles) {
                if (tile.obj != null) {
                    this.writeDebugLogLine(tile.positionToString() + "(施設あり)");
                    tilesToNeedToBreakObj.push(tile);
                    moveStructureToTrashBox(tile.obj);
                }
                else {
                    this.writeDebugLogLine(tile.positionToString());
                }
            }

            this.__origAi_simulatePreparationAction(tilesToNeedToBreakObj, alivePattern);
        }

        updateAllUi();
        return true;
        startProgressiveProcess(patterns.length,
            function (iter) {
                let pattern = patterns[iter];
                for (let snapshot of pattern) {
                    let unit = self.findUnitById(snapshot.id);
                    self.map.placeUnitForcibly(unit, snapshot.posX, snapshot.posY);
                }
            },
            function (iter, iterMax) {
                $("#progress").progressbar({
                    value: iter,
                    max: iterMax,
                });
                updateAllUi();
            },
            function () {
                $("#progress").progressbar({ disabled: true });
                updateAllUi();
            },
            300
        );

        // for (let tile of this.map.enumerateSafeTilesNextToThreatenedTiles(UnitGroupType.Ally)) {
        //     this.writeSimpleLogLine(tile.positionToString());
        // }
        return true;

        {
            let targetGroup = UnitGroupType.Ally;
            let enemyGroup = UnitGroupType.Enemy;
            if (this.vm.currentTurnType == enemyGroup) {
                return false;
            }

            let enemyUnits = this.__getUnits(unit =>
                unit.isOnMap
                && unit.groupId == enemyGroup);

            // this.tempSerializedTurn = exportPerTurnSettingAsString();

            // let currentTurn = this.vm.currentTurn;
            // this.isTurnWideCommandQueueEnabled = true;
            // for (let i = 0; i < 100; ++i) {
            let isActionExecuted = this.__origAi_simulateAttackerAction(targetGroup, enemyUnits);
            if (isActionExecuted) {
                // continue;
                return true;
            }

            isActionExecuted = this.__origAi_simulateRefreshAction(targetGroup);
            if (isActionExecuted) {
                // continue;
                return true;
            }

            isActionExecuted = this.__origAi_simulateSmiteAction(targetGroup);
            if (isActionExecuted) {
                // continue;
                return true;
            }

            // break;
            // }
            // this.isTurnWideCommandQueueEnabled = false;

            // this.vm.currentTurn = currentTurn;
            // importPerTurnSetting(this.tempSerializedTurn);
            // this.__executeAllCommands(this.commandQueue, 100);
        }
        return false;
    }

    __areAllAlliesAlive() {
        for (let unit of this.enumerateAllyUnits()) {
            if (!unit.isOnMap) {
                return false;
            }
        }
        return true;
    }

    __origAi_simulate2() {
        let isAllUnitActionDone = this.__origAi_simulate();
        if (isAllUnitActionDone) {
            this.__enqueueEndAllUnitActionCommand(UnitGroupType.Ally);
        }
        this.__executeAllCommands(this.commandQueuePerAction, 0);
        updateAllUi();
    }

    __origAi_simulate3() {
        let tiles = [];
        for (let st of this.map.enumerateBreakableStructures(UnitGroupType.Ally)) {
            tiles.push(st.placedTile);
        }
        let isActionExecuted = this.__origAi_simulatePreparationAction(tiles, []);
        this.__executeAllCommands(this.commandQueuePerAction, 0);
        updateAllUi();
    }

    // 初撃までの準備行動をシミュレート
    __origAi_simulatePreparationAction(tilesToNeedToBreakObj, targetPlacementPattern) {
        let isActionExecuted = this.__origAi_simulateBreakStructure(tilesToNeedToBreakObj);
        if (isActionExecuted) {
            // continue;
            return false;
        }

        for (let snapshot of targetPlacementPattern) {
            let tile = self.map.getTile(snapshot.posX, snapshot.posY);
        }
        return true;
    }

    __origAi_simulateBreakStructure(tilesToNeedToBreakObj) {
        let targetGroup = UnitGroupType.Ally;

        let structureBreakers = [];
        for (let unit of this.enumerateAllUnitsOnMap(x =>
            x.groupId == targetGroup
            && !x.isActionDone
            && x.hasWeapon)
        ) {
            unit.actionContext.clear();
            structureBreakers.push(unit);
        }

        for (let blockTile of tilesToNeedToBreakObj) {
            for (let unit of this.__enumerateUnitsSortedByNearestDistanceToTile(blockTile, structureBreakers)) {
                let movableTiles = this.__getMovableTiles(unit);
                let attackableTiles = [];
                for (let tile of this.map.enumerateAttackableTiles(unit, blockTile)) {
                    if (!movableTiles.includes(tile)) {
                        continue;
                    }
                    if (tile.getEnemyThreatFor(unit.groupId) > 0) {
                        // 敵の攻撃範囲は除外
                        continue;
                    }

                    attackableTiles.push(tile);
                }

                if (attackableTiles.length == 0) {
                    continue;
                }

                let moveTile = attackableTiles[0];
                // ブロック破壊
                this.__enqueueBreakStructureCommand(unit, moveTile, blockTile.obj);
                return true;
            }
        }

        return false;
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

    __durabilityTest_simulate(targetUnit, enemyUnit) {
        let winCount = 0;
        let drawCount = 0;
        let loseCount = 0;
        let grantedBlessing = enemyUnit.grantedBlessing;

        let loseEnemyNames = [];
        for (let i = 0; i < g_appData.heroInfos.length; ++i) {
            let heroInfo = g_appData.heroInfos.get(i);

            // 初期化
            {
                enemyUnit.initByHeroInfo(heroInfo);
                enemyUnit.setGrantedBlessingIfPossible(grantedBlessing);
                enemyUnit.initializeSkillsToDefault();
                if (enemyUnit.weapon == Weapon.None) {
                    continue;
                }

                enemyUnit.setMoveCountFromMoveType();
                enemyUnit.isResplendent = enemyUnit.heroInfo.isResplendent;
                enemyUnit.weaponRefinement = WeaponRefinementType.Special;
                if (enemyUnit.special == Special.None) {
                    enemyUnit.special = this.vm.durabilityTestDefaultSpecial;
                }

                g_appData.__updateUnitSkillInfo(enemyUnit);
                let weaponRefinement = WeaponRefinementType.Special;
                if (enemyUnit.weaponInfo.specialRefineHpAdd == 3) {
                    weaponRefinement = WeaponRefinementType.Special_Hp3;
                }
                enemyUnit.weaponRefinement = weaponRefinement;
            }

            g_appData.__updateStatusBySkillsAndMerges(enemyUnit, false);
            enemyUnit.resetMaxSpecialCount();


            targetUnit.heal(99);
            enemyUnit.heal(99);
            let tmpWinCount = 0;
            for (let i = 0; i < this.vm.durabilityTestBattleCount; ++i) {
                let combatResult = this.calcDamage(enemyUnit, targetUnit, null, this.vm.durabilityTestCalcPotentialDamage);
                targetUnit.hp = targetUnit.restHp;
                targetUnit.specialCount = targetUnit.tmpSpecialCount;
                if (enemyUnit.restHp == 0) {
                    ++tmpWinCount;
                }
            }
            let combatResultText = "";
            if (targetUnit.restHp == 0) {
                combatResultText = "敗北";
                ++loseCount;
                loseEnemyNames.push(heroInfo.name);
            }
            else if (tmpWinCount == this.vm.durabilityTestBattleCount) {
                combatResultText = "勝利";
                ++winCount;
            }
            else {
                combatResultText = "引き分け";
                ++drawCount;
            }
            this.writeLogLine(`${targetUnit.getNameWithGroup()}(HP${targetUnit.restHp})vs${enemyUnit.getNameWithGroup()}(HP${enemyUnit.restHp})→${combatResultText}`);
        }
        let totalCount = winCount + loseCount + drawCount;
        this.clearDurabilityTestLog();
        this.writeDurabilityTestLogLine(`勝利 ${winCount}/${totalCount}(${Math.trunc(winCount / totalCount * 100)}%)`);
        this.writeDurabilityTestLogLine(`引き分け ${drawCount}/${totalCount}(${Math.trunc(drawCount / totalCount * 100)}%)`);
        this.writeDurabilityTestLogLine(`敗北 ${loseCount}/${totalCount}(${Math.trunc(loseCount / totalCount * 100)}%)`);
        this.writeDurabilityTestLogLine(`勝率: ${this.__calcDurabilityScoreAsString(winCount, drawCount, loseCount, 0)}%`);
        this.writeDurabilityTestLogLine(`生存率: ${this.__calcDurabilityScoreAsString(winCount, drawCount, loseCount, 2)}%`);
        this.writeDurabilityTestLogLine(`戦闘結果スコア: ${this.__calcDurabilityScoreAsString(winCount, drawCount, loseCount, 1)} / 100`);
        this.writeDurabilityTestLogLine("");
        this.writeDurabilityTestLogLine("敗北した相手:");
        for (let name of loseEnemyNames) {
            this.writeDurabilityTestLogLine(name);
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
    writeDurabilityTestLogLine(message) {
        this.vm.durabilityTestLog += message + "\n";
    }

    __origAi_simulate() {
        let targetGroup = UnitGroupType.Ally;
        let enemyGroup = UnitGroupType.Enemy;
        if (this.vm.currentTurnType == enemyGroup) {
            return false;
        }

        let enemyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId == enemyGroup);

        // this.tempSerializedTurn = exportPerTurnSettingAsString();

        // let currentTurn = this.vm.currentTurn;
        // this.isTurnWideCommandQueueEnabled = true;
        // for (let i = 0; i < 100; ++i) {
        let isActionExecuted = this.__origAi_simulateAttackerAction(targetGroup, enemyUnits);
        if (isActionExecuted) {
            // continue;
            return false;
        }

        isActionExecuted = this.__origAi_simulateRefreshAction(targetGroup);
        if (isActionExecuted) {
            // continue;
            return false;
        }

        isActionExecuted = this.__origAi_simulateSmiteAction(targetGroup);
        if (isActionExecuted) {
            // continue;
            return false;
        }

        // break;
        // }
        // this.isTurnWideCommandQueueEnabled = false;

        // this.vm.currentTurn = currentTurn;
        // importPerTurnSetting(this.tempSerializedTurn);
        // this.__executeAllCommands(this.commandQueue, 100);

        return this.__simulateAllyActionCustomized();
    }

    __origAi_simulateSmiteAction(targetGroup) {
        let assisters = [];
        for (let unit of this.enumerateAllUnitsOnMap(x =>
            x.groupId == targetGroup
            && !x.isActionDone
            && x.support == Support.Smite)
        ) {
            unit.actionContext.clear();
            assisters.push(unit);
        }

        let attackers = this.__origAi_getAttackers(targetGroup);

        for (let assistUnit of assisters) {
            this.__setBestTargetAndTiles(
                assistUnit,
                true,
                (targetUnit, tile) => {
                    if (targetUnit.isActionDone) {
                        return false;
                    }

                    if (attackers.includes(targetUnit)) {
                        let result = this.__findTileAfterSmite(assistUnit, targetUnit, tile);
                        if (!result.success) {
                            return false;
                        }

                        if (result.targetUnitTileAfterAssist.obj instanceof TrapBase) {
                            return false;
                        }

                        // ぶちかまし後に敵を攻撃可能になるならtrue
                        for (let enemy of this.enumerateEnemyUnitsOnMap()) {
                            if (this.map.examinesCanAttack(
                                targetUnit,
                                enemy,
                                false,
                                result.targetUnitTileAfterAssist,
                                x => x.obj instanceof TrapBase)
                            ) {
                                return true;
                            }
                        }
                        return false;
                    }
                    else if (targetUnit.supportInfo.assistType == AssistType.Refresh) {
                        let result = this.__findTileAfterSmite(assistUnit, targetUnit, tile);
                        if (!result.success) {
                            return false;
                        }

                        if (result.targetUnitTileAfterAssist.obj instanceof TrapBase) {
                            return false;
                        }

                        // 行動済みのアタッカーを再行動できるか
                        let actionedAttackers = [];
                        for (let unit of this.enumerateAllUnitsOnMap(x =>
                            x.groupId == targetGroup
                            && x.isActionDone
                            && x.supportInfo.assistType != AssistType.Refresh
                            && x.support != Support.Smite)
                        ) {
                            actionedAttackers.push(unit);
                        }

                        for (let attacker of actionedAttackers) {

                            let dist = attacker.placedTile.calculateUnitMovementCountToThisTile(
                                targetUnit, result.targetUnitTileAfterAssist);
                            if (dist - 1 <= targetUnit.moveCount) {
                                return true;
                            }
                        }

                        return false;
                    }

                    return false;
                },
                tile => !(tile.obj instanceof TrapBase)
            );
            if (assistUnit.actionContext.bestTargetToAssist == null) {
                this.writeDebugLogLine(assistUnit.getNameWithGroup() + "の補助可能な味方がいない");
                continue;
            }

            let bestTargetToAssist = assistUnit.actionContext.bestTargetToAssist;
            let bestTileToAssist = assistUnit.actionContext.bestTileToAssist;

            this.__enqueueSupportCommand(assistUnit, bestTileToAssist, bestTargetToAssist);
            return true;
        }

        return false;
    }

    * __origAi_enumerateAttackersAndRefreshers(targetGroup) {
        for (let unit of this.__origAi_getRefreshers(targetGroup)) {
            yield unit;
        }
        for (let unit of this.__origAi_getAttackers(targetGroup)) {
            yield unit;
        }
    }

    __origAi_getRefreshers(targetGroup) {
        let assisters = [];
        for (let unit of this.enumerateAllUnitsOnMap(x =>
            x.groupId == targetGroup
            && !x.isActionDone
            && x.supportInfo.assistType == AssistType.Refresh)
        ) {
            unit.actionContext.clear();
            assisters.push(unit);
        }
        return assisters;
    }

    __origAi_simulateRefreshAction(targetGroup) {
        let assisters = this.__origAi_getRefreshers(targetGroup);
        for (let unit of assisters) {
            unit.actionContext.clear();
        }

        for (let unit of assisters) {
            this.__setBestTargetAndTiles(
                unit,
                true,
                (targetUnit, tile) => this.__canBeActivatedPrecombatAssist(unit, targetUnit, tile),
                tile => !(tile.obj instanceof TrapBase)
            );
            if (unit.actionContext.bestTargetToAssist == null) {
                this.writeDebugLogLine(unit.getNameWithGroup() + "の補助可能な味方がいない");
                continue;
            }

            let bestTargetToAssist = unit.actionContext.bestTargetToAssist;
            let bestTileToAssist = unit.actionContext.bestTileToAssist;

            this.__enqueueSupportCommand(unit, bestTileToAssist, bestTargetToAssist);
            return true;
        }

        return false;
    }

    __origAi_getAttackers(targetGroup) {
        let attackers = [];
        for (let unit of this.enumerateAllUnitsOnMap(x =>
            x.groupId == targetGroup
            && !x.isActionDone
            && x.supportInfo.assistType != AssistType.Refresh
            && x.support != Support.Smite)
        ) {
            attackers.push(unit);
        }
        return attackers;
    }

    __origAi_simulateAttackerAction(targetGroup, enemyUnits) {
        let attackers = this.__origAi_getAttackers(targetGroup);
        this.__origAi_simulateAttackerActionImpl(attackers, enemyUnits);
    }
    __origAi_simulateAttackerActionImpl(attackers, enemyUnits) {
        for (let unit of attackers) {
            unit.actionContext.clear();
        }

        for (let unit of attackers) {
            this.__setAttackableUnitInfo(unit, enemyUnits, tile => !(tile.obj instanceof TrapBase));
            unit.actionContext.attackableTiles = [];
            for (let attackTargetInfo of unit.actionContext.attackableUnitInfos) {
                for (let tile of attackTargetInfo.tiles) {
                    if (unit.actionContext.attackableTiles.includes(tile)) {
                        continue;
                    }
                    unit.actionContext.attackableTiles.push(tile);
                }
            }
        }
        attackers.sort(function (a, b) {
            return a.actionContext.attackableTiles.length - b.actionContext.attackableTiles.length;
        });

        this.__origAi_simulateAttackerActionImplImpl(attackers);
    }

    __origAi_simulateAttackerActionImplImpl(attackers) {
        let self = this;
        for (let unit of attackers) {
            if (unit.isActionDone) {
                continue;
            }

            if (unit.actionContext.attackableUnitInfos.length == 0) {
                continue;
            }

            this.__setBestTileToAttack(unit, tile => {
                return tile.obj instanceof TrapBase;
            });

            unit.actionContext.attackableUnitInfos.sort(function (a, b) {
                let restHpA = unit.hp;
                if (a.targetUnit.hasWeapon) {
                    let resultA = self.calcDamage(a.targetUnit, unit);
                    restHpA = unit.restHp;
                }
                let restHpB = unit.hp;
                if (a.targetUnit.hasWeapon) {
                    let resultB = self.calcDamage(b.targetUnit, unit);
                    restHpB = unit.restHp;
                }
                return restHpA - restHpB;
            });

            for (let attackTargetInfo of unit.actionContext.attackableUnitInfos) {
                let attackTile = attackTargetInfo.bestTileToAttack;
                this.__enqueueAttackCommand(unit, attackTargetInfo.targetUnit, attackTile);
                break;
            }

            if (this.commandQueuePerAction.length == 0) {
                continue;
            }

            return true;
        }
        return false;
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
                this.writeDebugLogLine("敵の攻撃範囲に" + unit.getNameWithGroup() + "が含まれているか評価 --------");
                unit.actionContext.hasThreatenedByEnemyStatus = this.__examinesIsUnitThreatenedByEnemy(unit, enemyUnits);
                this.writeDebugLogLine(unit.getNameWithGroup() + "の攻撃範囲に敵が含まれているか評価 --------");
                unit.actionContext.hasThreatensEnemyStatus = this.__examinesUnitThreatensEnemy(unit, enemyUnits);
                this.writeDebugLogLine(unit.getNameWithGroup() + ": "
                    + "hasThreatensEnemyStatus=" + unit.actionContext.hasThreatensEnemyStatus
                    + ", hasThreatenedByEnemyStatus=" + unit.actionContext.hasThreatenedByEnemyStatus
                );

                if (triggersAction && unit.groupId == UnitGroupType.Enemy && unit.actionContext.hasThreatensEnemyStatus) {
                    if (!g_appData.examinesEnemyActionTriggered(unit)) {
                        unit.isEnemyActionTriggered = true;
                        this.vm.isEnemyActionTriggered = true;
                    }
                }
            }
        });
    }

    __canExecuteHarshCommand(targetUnit) {
        if (!targetUnit.isDebuffed) {
            return false;
        }
        if (targetUnit.atkDebuff < 0 && -targetUnit.atkDebuff > (targetUnit.atkBuff)) { return true; }
        if (targetUnit.spdDebuff < 0 && -targetUnit.spdDebuff > (targetUnit.spdBuff)) { return true; }
        if (targetUnit.defDebuff < 0 && -targetUnit.defDebuff > (targetUnit.defBuff)) { return true; }
        if (targetUnit.resDebuff < 0 && -targetUnit.resDebuff > (targetUnit.resBuff)) { return true; }
        return false;
    }

    __canBeBuffedAtLeastSpecifiedAmountByRally(assistUnit, targetUnit, amount) {
        switch (assistUnit.support) {
            case Support.HarshCommandPlus:
                if (targetUnit.hasNegativeStatusEffect()) {
                    return true;
                }
                return this.__canExecuteHarshCommand(targetUnit);
            case Support.HarshCommand:
                return this.__canExecuteHarshCommand(targetUnit);
            default:
                if ((getAtkBuffAmount(assistUnit.support) - targetUnit.atkBuff) >= amount) { return true; }
                if ((getSpdBuffAmount(assistUnit.support) - targetUnit.spdBuff) >= amount) { return true; }
                if ((getDefBuffAmount(assistUnit.support) - targetUnit.defBuff) >= amount) { return true; }
                if ((getResBuffAmount(assistUnit.support) - targetUnit.resBuff) >= amount) { return true; }
                return false;
        }
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

                let combatResult = this.calcDamage(unit,
                    attackableUnitInfo.targetUnit,
                    attackableUnitInfo.bestTileToAttack);
                if (attackableUnitInfo.targetUnit.restHp == 0) {
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
                    && this.__canBeBuffedAtLeastSpecifiedAmountByRally(unit, targetUnit, 2);
            case AssistType.Heal:
                if (unit.support == Support.Sacrifice) {
                    let assisterEnemyThreat = unit.placedTile.getEnemyThreatFor(unit.groupId);
                    let targetEnemyThreat = targetUnit.placedTile.getEnemyThreatFor(targetUnit.groupId);
                    if (assisterEnemyThreat > targetEnemyThreat) {
                        return false;
                    }
                }
                return targetUnit.currentDamage >= getPrecombatHealThreshold(unit.support);
            case AssistType.Restore:
                return targetUnit.hasNegativeStatusEffect()
                    || (targetUnit.currentDamage >= getPrecombatHealThreshold(unit.support));
            case AssistType.DonorHeal:
                {
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

    __canBeActivatedPostcombatAssist(unit, targetUnit, tile) {
        switch (unit.supportInfo.assistType) {
            case AssistType.Refresh:
                return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
            case AssistType.Heal:
                return !targetUnit.isFullHp;
            case AssistType.Restore:
                return (targetUnit.isDebuffed || targetUnit.hasNegativeStatusEffect()) || !targetUnit.isFullHp;
            case AssistType.Rally:
                {
                    if (!targetUnit.actionContext.hasThreatensEnemyStatus && !g_appData.examinesEnemyActionTriggered(unit)) {
                        return false;
                    }
                    // todo: ちゃんと実装する
                    let canBeBuffedAtLeast2 = this.__canBeBuffedAtLeastSpecifiedAmountByRally(unit, targetUnit, 2);
                    this.writeDebugLogLine(targetUnit.getNameWithGroup() + ": "
                        + "hasThreatensEnemyStatus=" + targetUnit.actionContext.hasThreatensEnemyStatus
                        + ", hasThreatenedByEnemyStatus=" + targetUnit.actionContext.hasThreatenedByEnemyStatus
                        + ", canBeBuffedAtLeast2=" + canBeBuffedAtLeast2
                    );
                    return (targetUnit.actionContext.hasThreatensEnemyStatus || targetUnit.actionContext.hasThreatenedByEnemyStatus)
                        && canBeBuffedAtLeast2;
                }
            case AssistType.Move:
                {
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
            case AssistType.DonorHeal:
                {
                    // 双界だと行動制限が解除されていないと使用しないっぽい
                    if (!g_appData.examinesEnemyActionTriggered(unit)) {
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
        for (let allyUnit of this.enumerateUnitsInTheSameGroup(unit, false)) {
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

    simulateMovement(targetUnits, enemyUnits, allyUnits) {
        // コンテキスト初期化
        for (let unit of targetUnits) {
            unit.actionContext.clear();
        }

        for (let unit of enemyUnits) {
            unit.actionContext.clear();
        }

        let self = this;
        using(new ScopedStopwatch(time => this.writeDebugLogLine("追跡対象の計算: " + time + " ms")), () => {
            for (let evalUnit of targetUnits) {
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
                        evalUnit.actionContext.chaseTargetTile = minTargetTile;
                    } else {
                        // 双界の護衛は初期位置を追跡
                        evalUnit.actionContext.chaseTargetTile = g_appData.map.getTile(evalUnit.initPosX, evalUnit.initPosY);
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
                                let combatResult = this.calcDamage(evalUnit, allyUnit, null, true);
                                if (self.vm.isPotentialDamageDetailEnabled) {
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
                        continue;
                    }

                    evalUnit.actionContext.chaseTargetTile = this.__findChaseTargetTile(evalUnit, chaseTarget);
                    this.writeLogLine(evalUnit.getNameWithGroup() + "の追跡対象は" + chaseTarget.getNameWithGroup());
                }
            }
        });

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
            if (unit.actionContext.chaseTargetTile == null) {
                this.__enqueueEndActionCommand(unit);
                isActionActivated = true;
                break;
            }

            let chaseTargetTile = unit.actionContext.chaseTargetTile;

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
            if (unit.support == Support.Pivot){
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

    __createTargetTileContexts(unit, movableTiles, pivotTiles) {
        let chaseTargetTile = unit.actionContext.chaseTargetTile;
        let ignoresUnits = true;
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
            })
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
        let serial = this.__convertUnitPerTurnStatusToSerialForSpecifiedGroupUnitsOnMap(groupId);
        let self = this;
        this.__enqueueCommand("ユニット全員の行動終了", function () {
            self.writeLogLine("行動可能なユニットはいないので現在のフェーズ終了");
            self.__endAllUnitAction(groupId);
            updateAllUi();
        }, serial);
    }

    __enqueueEndActionCommand(unit) {
        let serial = this.__convertUnitPerTurnStatusToSerial(unit);
        this.__enqueueCommand(`行動終了(${unit.getNameWithGroup()})`, function () {
            g_app.writeLogLine(unit.getNameWithGroup() + "は行動終了");
            g_app.endUnitAction(unit);
        }, serial);
    }

    __enqueueDuoSkillCommand(unit) {
        let commandType = CommandType.Normal;
        let serial = this.__convertPerTurnStatusToSerialForAllUnitsAndTrapsOnMap();
        this.__enqueueCommand(`比翼、双界スキル(${unit.getNameWithGroup()})`, function () {
            g_app.writeLogLine(unit.getNameWithGroup() + "は比翼、双界スキルを実行");
            g_app.__activateDuoOrHarmonizedSkill(unit);
        }, serial, commandType);
    }


    __enqueueSupportCommand(unit, tile, assistTargetUnit) {
        if (unit.support < 0) {
            return;
        }

        let commandType = CommandType.Normal;
        if (unit.placedTile != tile) {
            this.__enqueueMoveCommand(unit, tile, false, CommandType.Begin);
            commandType = CommandType.End;
        }

        let serial = this.__convertPerTurnStatusToSerialForAllUnitsAndTrapsOnMap();
        let self = this;
        let skillName = unit.supportInfo != null ? unit.supportInfo.name : "補助";
        this.__enqueueCommand(`${skillName}(${unit.getNameWithGroup()}→${assistTargetUnit.getNameWithGroup()})`, function () {
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
            self.writeLogLine(
                unit.getNameWithGroup() + "は"
                + assistTargetUnit.getNameWithGroup()
                + "に" + skillName + "を実行");
            self.applySupportSkill(unit, assistTargetUnit);
        }, serial, commandType);
    }

    __enqueueBreakStructureCommand(unit, moveTile, obj) {
        let commandType = CommandType.Normal;
        if (unit.placedTile != moveTile) {
            this.__enqueueMoveCommand(unit, moveTile, false, CommandType.Begin);
            commandType = CommandType.End;
        }

        let serial = this.__convertUnitPerTurnStatusToSerial(unit) + ElemDelimiter +
            this.__convertStructurePerTurnStatusToSerial(obj);
        let self = this;
        this.__enqueueCommand(obj.name + `破壊(${unit.getNameWithGroup()})`, function () {
            if (unit.isActionDone) {
                // 移動時にトラップ発動した場合は行動終了している
                return;
            }

            self.audioManager.playSoundEffectImmediately(SoundEffectId.Break);
            g_app.writeLogLine(unit.getNameWithGroup() + "はオブジェクトを破壊");
            if (obj instanceof BreakableWall) {
                obj.break();
                if (obj.isBroken) {
                    moveStructureToTrashBox(obj);
                }
            }
            else {
                moveStructureToTrashBox(obj);
            }
            g_app.endUnitAction(unit);
        }, serial, commandType);
    }

    __enqueueMoveCommand(unit, tileToMove, endAction = false, commandType = CommandType.Normal, enableSoundEffect = false) {
        // 移動
        let self = this;
        let metaData = new Object();
        metaData.tileToMove = tileToMove;
        metaData.unit = unit;
        this.__enqueueCommand(
            `移動(${unit.getNameWithGroup()})`,
            function () {
                if (enableSoundEffect) {
                    self.audioManager.playSoundEffectImmediately(SoundEffectId.Move);
                }
                if (unit.placedTile == tileToMove) {
                    return;
                }

                if (self.vm.gameMode == GameMode.ResonantBattles
                    && unit.groupId == UnitGroupType.Enemy && isThief(unit) && tileToMove.posY == 0
                ) {
                    // 双界のシーフが出口に辿り着いた
                    self.writeLogLine(unit.getNameWithGroup() + "は出口に到着");
                    moveUnitToTrashBox(unit);
                }
                else {
                    self.writeLogLine(unit.getNameWithGroup() + "は" + tileToMove.positionToString() + "に移動");
                    moveUnit(unit, tileToMove, unit.groupId == UnitGroupType.Ally);
                }

                self.updateSpurForSpecifiedGroupUnits(unit.groupId);
                if (!unit.isActionDone && endAction) {
                    self.endUnitAction(unit);
                }
            },
            this.__convertUnitPerTurnStatusToSerialForAllUnitsAndTrapsOnMapAndGlobal(),
            commandType,
            metaData
        );
    }

    __enqueueAttackCommand(attackerUnit, targetUnit, tile) {
        let commandType = CommandType.Normal;
        if (attackerUnit.placedTile != tile) {
            this.__enqueueMoveCommand(attackerUnit, tile, false, CommandType.Begin);
            commandType = CommandType.End;
        }

        let serial = this.__convertUnitPerTurnStatusToSerialForAllUnitsAndTrapsOnMapAndGlobal();
        let self = this;
        this.__enqueueCommand(`攻撃(${attackerUnit.getNameWithGroup()}→${targetUnit.getNameWithGroup()})`, function () {
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
    }

    __enqueueCommand(label, func, serializedDataForUndo = null, commandType = CommandType.Normal, metaData = null) {
        let serializedTurn = null;
        if (this.vm.isCommandUndoable) {
            if (serializedDataForUndo != null) {
                serializedTurn = serializedDataForUndo;
            }
            else {
                serializedTurn = exportPerTurnSettingAsString();
            }
        }
        let command = new Command(
            label,
            function (input) {
                // g_app.clearSimpleLog();
                g_app.writeSimpleLogLine("「" + input[0] + "」を実行");
                console.log(input);
                input[1]();
            },
            function (input) {
                if (input[1] != null) {
                    // g_app.clearSimpleLog();
                    g_app.writeSimpleLogLine("「" + input[0] + "」を元に戻す");
                    importPerTurnSetting(input[1]);
                }
            },
            [label, func],
            [label, serializedTurn],
            commandType
        );
        command.metaData = metaData;
        this.commandQueuePerAction.enqueue(command);
        if (this.isTurnWideCommandQueueEnabled) {
            this.commandQueue.enqueue(command);
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

        let chaseTargetTile = unit.actionContext.chaseTargetTile;
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
            unit.actionContext.bestTargetToAttack = this.__evaluateBestAttackTarget(unit, unit.actionContext.attackableUnitInfos);
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
                    attackers: []
                };
                attackTargetInfos.push(targetInfo);
            }
            targetInfo.attackers.push(unit);
        }

        // 最も優先度の高い攻撃者を決める
        for (let targetInfo of attackTargetInfos) {
            let target = targetInfo.target;
            this.writeLogLine(target.getNameWithGroup() + "への攻撃者を選択------------");
            let bestAttacker = this.__evaluateBestAttacker(target, targetInfo.attackers);
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

            let context = new TilePriorityContext(tile, attacker);
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
                + "(isDefensiveTile=" + context.isDefensiveTile
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

    __evaluateBestAttackTarget(attacker, targetInfos) {
        // 戦闘結果を計算
        for (let targetInfo of targetInfos) {
            let target = targetInfo.targetUnit;
            if (attacker.actionContext.attackEvalContexts[target]) {
                continue;
            }
            this.__updateAttackEvalContext(attacker, target, targetInfo.bestTileToAttack);
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

        return targetInfos[0].targetUnit;
    }

    __evaluateBestAttacker(target, attackers) {
        if (attackers.length == 1) {
            return attackers[0];
        }

        // 戦闘結果を計算
        for (let attacker of attackers) {
            if (attacker.actionContext.attackEvalContexts[target]) {
                continue;
            }

            let info = attacker.actionContext.findAttackableUnitInfo(target);
            this.__updateAttackEvalContext(attacker, target, info.bestTileToAttack);
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

    __updateAttackEvalContext(attacker, target, tileToAttack) {
        if (tileToAttack == null) {
            return;
        }

        let result = this.calcDamage(attacker, target, tileToAttack);
        this.writeDebugLogLine(this.damageCalc.log);

        let attackEvalContext = new AttackEvaluationContext();
        if (target.restHp == 0) {
            attackEvalContext.combatResult = CombatResult.Win;
        } else if (attacker.restHp == 0) {
            attackEvalContext.combatResult = CombatResult.Loss;
        } else {
            attackEvalContext.combatResult = CombatResult.Draw;
        }
        let targetDamage = (target.hp - target.restHp);
        let attackerDamage = (attacker.hp - attacker.restHp);
        attackEvalContext.damageRatio = targetDamage * 3 - attackerDamage;
        this.writeDebugLogLine(attacker.getNameWithGroup() + "が" + target.getNameWithGroup()
            + "に与えるダメージ" + targetDamage
            + ", 受けるダメージ" + attackerDamage
            + ", ダメージ率" + attackEvalContext.damageRatio
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
        let assistRange = getAssistRange(assistUnit.support);
        for (let tile of g_appData.map.enumerateMovableTiles(assistUnit, false, false)) {
            if (acceptTileFunc != null && !acceptTileFunc(tile)) {
                continue;
            }
            // this.writeDebugLogLine(tile.positionToString() + "から補助可能な敵がいるか評価");
            for (let unit of this.enumerateUnitsInTheSameGroup(assistUnit)) {
                if (!unit.isOnMap) {
                    continue;
                }
                if (unit.hasStatusEffect(StatusEffectType.Isolation)) {
                    continue;
                }

                let dist = calcDistance(tile.posX, tile.posY, unit.posX, unit.posY);
                // this.writeDebugLogLine(tile.positionToString() + "から" + unit.getNameWithGroup() + "への距離=" + dist);
                if (dist != assistRange) {
                    continue;
                }

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
            case Support.RallyUpRes:
            case Support.RallyUpResPlus:
            case Support.RallyUpAtkPlus:
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

    __countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
            if (predicator(unit)) {
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

    executeStructuresByUnitGroupType(groupType) {
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
                        this.executeStructure(st);
                    }
                    else if (st instanceof OfCatapult) {
                        if (this.vm.currentTurn == 1) {
                            this.executeStructure(st);
                        }
                    }
                    else if (st instanceof OfBoltTower) {
                        if (this.vm.currentTurn == 3) {
                            this.executeStructure(st);
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
                        this.executeStructure(st);
                    }
                    else if (st instanceof DefCatapult) {
                        if (this.vm.currentTurn == 1) {
                            this.executeStructure(st);
                        }
                    }
                    else if (st instanceof DefBoltTower) {
                        if (this.vm.currentTurn == 3) {
                            this.executeStructure(st);
                        }
                    }
                }
                break;
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

    executeStructure(structure) {
        let px = structure.posX;
        let py = structure.posY;
        if (structure instanceof OfBoltTower) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Enemy, 3, 99)) {
                let damage = Number(structure.level) * 5 + 5;
                unit.takeDamage(damage, true);
            }
        }
        else if (structure instanceof DefBoltTower) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Ally, 3, 7)) {
                let damage = Number(structure.level) * 5 + 5;
                unit.takeDamage(damage, true);
            }
        }
        else if (structure instanceof OfHealingTower) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Ally, 5, 5)) {
                let healAmount = Number(structure.level) * 5 + 5;
                unit.heal(healAmount);
            }
        }
        else if (structure instanceof DefHealingTower) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Enemy, 5, 5)) {
                let healAmount = Number(structure.level) * 5 + 5;
                unit.heal(healAmount);
            }
        }
        else if (structure instanceof OfPanicManor) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Enemy, 3, 99)) {
                if (this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    unit.addStatusEffect(StatusEffectType.Panic);
                }
            }
        }
        else if (structure instanceof DefPanicManor) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Ally, 3, 7)) {
                if (this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    unit.addStatusEffect(StatusEffectType.Panic);
                }
            }
        }
        else if (structure instanceof OfTacticsRoom) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Enemy, 1, 99)) {
                if (unit.isRangedWeaponType() && this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    unit.addStatusEffect(StatusEffectType.Gravity);
                }
            }
        }
        else if (structure instanceof DefTacticsRoom) {
            for (let unit of this.enumerateUnitsWithinSpecifiedRange(px, py, UnitGroupType.Ally, 3, 7)) {
                if (unit.isRangedWeaponType() && this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    unit.addStatusEffect(StatusEffectType.Gravity);
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
                unit.takeDamage(damage, true);
            }
            for (let unit of this.enumerateUnitsWithinSpecifiedSpaces(px, py, UnitGroupType.Ally, 3)) {
                let damage = Number(structure.level) * 10;
                unit.takeDamage(damage, true);
            }
        }
        else if (structure instanceof HeavyTrap) {
            for (let unit of this.enumerateUnitsWithinSpecifiedSpaces(px, py, UnitGroupType.Enemy, 2)) {
                if (this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    this.writeLogLine(unit.getNameWithGroup() + "に重圧の罠の効果適用");
                    unit.addStatusEffect(StatusEffectType.Gravity);
                }
            }
            for (let unit of this.enumerateUnitsWithinSpecifiedSpaces(px, py, UnitGroupType.Ally, 2)) {
                console.log(unit.getNameWithGroup());
                if (this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                    this.writeLogLine(unit.getNameWithGroup() + "に重圧の罠の効果適用");
                    unit.addStatusEffect(StatusEffectType.Gravity);
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
            if (unit.moveType == moveType) { unit.applyAllDebuff(-(Number(structure.level) + 1)); }
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
                unit.applyDefDebuff(amount);
                unit.applyResDebuff(amount);
            });
    }

    __executeBrightShrine(structure, unitGroup) {
        this.__applyDebuffToMaxStatusUnits(unitGroup,
            unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombatWithoutDebuff() + this.__getStatusEvalUnit(unit).getSpdInPrecombatWithoutDebuff() },
            unit => {
                let amount = -(Number(structure.level) + 1);
                unit.applyAtkDebuff(amount);
                unit.applySpdDebuff(amount);
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
                case PassiveB.SpdResSnag3:
                    this.__applyDebuffToEnemiesWithin4Spaces(unit, x => { x.applySpdDebuff(-6); x.applyResDebuff(-6); });
                    this.__applyDebuffToEnemiesWithin4Spaces(targetUnit, x => { x.applySpdDebuff(-6); x.applyResDebuff(-6); });
                    break;
                case PassiveB.SpdDefSnag3:
                    this.__applyDebuffToEnemiesWithin4Spaces(unit, x => { x.applySpdDebuff(-6); x.applyDefDebuff(-6); });
                    this.__applyDebuffToEnemiesWithin4Spaces(targetUnit, x => { x.applySpdDebuff(-6); x.applyDefDebuff(-6); });
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

    __applyRefresh(skillOnwerUnit, targetUnit) {
        if (targetUnit == null) { return false; }
        targetUnit.isActionDone = false;
        switch (skillOnwerUnit.support) {
            case Support.Play:
                if (skillOnwerUnit.weapon == Weapon.HyosyoNoBreath) {
                    this.__applyHyosyoNoBreath(skillOnwerUnit);
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
                    for (let unit of this.enumerateUnitsInTheSameGroup(skillOnwerUnit, false)) {
                        if (unit.posX == skillOnwerUnit.posX
                            || unit.posX == targetUnit.posX
                            || unit.posY == skillOnwerUnit.posY
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
        }

        for (let skillId of skillOnwerUnit.enumerateSkills()) {
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
                case PassiveB.GeyserDance1: targetUnit.applyDefBuff(3); targetUnit.applyRefBuff(3); break;
                case PassiveB.GeyserDance2: targetUnit.applyDefBuff(4); targetUnit.applyRefBuff(4); break;
                case Weapon.Sukurudo: targetUnit.applyAllBuff(3); break;
                case PassiveB.AtkCantrip3:
                    for (let unit of this.__findNearestEnemies(skillOwnerUnit, 4)) {
                        unit.applyAtkDebuff(-7);
                    }
                    break;
            }
        }

        // 大地の舞い等の後に実行する必要がある
        if (skillOnwerUnit.weapon == Weapon.SeireiNoHogu) {
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
            case Support.Drawback: result = this.__findTileAfterDrawback(unit, targetUnit, assistTile); break;
            case Support.ToChangeFate:
            case Support.Reposition: result = this.__findTileAfterReposition(unit, targetUnit, assistTile); break;
            case Support.FutureVision:
            case Support.Swap: result = this.__findTileAfterSwap(unit, targetUnit, assistTile); break;
            case Support.Smite: result = this.__findTileAfterSmite(unit, targetUnit, assistTile); break;
            case Support.Shove: result = this.__findTileAfterShove(unit, targetUnit, assistTile); break;
            default:
                this.writeErrorLine("未実装の補助: " + unit.supportInfo.name);
                return -1;
        }
        if (!result.success) {
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
                    case PassiveB.AtkDefRuse3:
                        this.__applyRuse(supporterUnit, targetUnit,
                            unit => { unit.applyAtkDebuff(-5); unit.applyDefDebuff(-5); });
                        break;
                    case PassiveB.AtkSpdRuse3:
                        this.__applyRuse(supporterUnit, targetUnit,
                            unit => { unit.applyAtkDebuff(-5); unit.applySpdDebuff(-5); });
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
        return isBuffed;
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
        return success;
    }

    __applyHeal(supporterUnit, targetUnit) {
        let isActivated = false;
        if (!targetUnit.isFullHp) {
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
            else {
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

    applySupportSkill(supporterUnit, targetUnit) {
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
                    return this.__applyHeal(supporterUnit, targetUnit);
                }
            case AssistType.Restore:
                return this.__applyHeal(supporterUnit, targetUnit);
            case AssistType.Rally:
                switch (supporterUnit.support) {
                    case Support.RallyUpAtk:
                    case Support.RallyUpAtkPlus:
                    case Support.RallyUpRes:
                    case Support.RallyUpResPlus:
                        if (this.__applyRallyUp(supporterUnit, targetUnit)) { return true; } return false;
                    case Support.HarshCommandPlus:
                        targetUnit.clearNegativeStatusEffects();
                        return this.__executeHarshCommand(targetUnit);
                    case Support.HarshCommand:
                        return this.__executeHarshCommand(targetUnit);
                    default:
                        if (this.__applyRally(supporterUnit, targetUnit)) { return true; } return false;
                }
        }

        switch (supporterUnit.support) {
            case Support.ToChangeFate:
            case Support.Reposition:
                return this.__applyMovementAssist(supporterUnit, targetUnit,
                    (unit, target, tile) => this.__findTileAfterReposition(unit, target, tile));
            case Support.Smite:
                return this.__applyMovementAssist(supporterUnit, targetUnit,
                    (unit, target, tile) => this.__findTileAfterSmite(unit, target, tile));
            case Support.Shove:
                return this.__applyMovementAssist(supporterUnit, targetUnit,
                    (unit, target, tile) => this.__findTileAfterShove(unit, target, tile));
            case Support.Drawback:
                return this.__applyMovementAssist(supporterUnit, targetUnit,
                    (unit, target, tile) => this.__findTileAfterDrawback(unit, target, tile));
            case Support.Swap:
            case Support.FutureVision:
                return this.__applyMovementAssist(supporterUnit, targetUnit,
                    (unit, target, tile) => this.__findTileAfterSwap(unit, target, tile));
            case Support.Pivot:
                return this.__applyMovementAssist(supporterUnit, targetUnit,
                    (unit, target, tile) => this.__findTileAfterPivot(unit, target, tile));
            case Support.ReciprocalAid:
                {
                    let tmpHp = supporterUnit.hp;
                    supporterUnit.setHpInValidRange(targetUnit.hp);
                    targetUnit.setHpInValidRange(tmpHp);
                    return true;
                }
            case Support.ArdentSacrifice:
                {
                    supporterUnit.takeDamage(10, true);
                    targetUnit.heal(10);
                    return true;
                }
            default:
                return false;
        }
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

    selectItem(targetId, add = false) {
        this.showItemInfo(targetId);
        changeCurrentUnitTab(this.vm.currentItemIndex);
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
let g_selectHeroInfos = [];
let g_app = new AetherRaidTacticsBoard();

function removeTouchEventFromDraggableElements() {
    let draggableItems = $(".draggable-elem");
    for (let i = 0; i < draggableItems.length; ++i) {
        let item = draggableItems[i];
        item.removeEventListener('touchstart', touchStartEvent, false);
        item.removeEventListener('touchmove', touchMoveEvent, false);
        item.removeEventListener('touchend', touchEndEvent, false);
    }
}

function addTouchEventToDraggableElements() {
    // ドラッグ可能アイテムへのタッチイベントの設定
    let draggableItems = $(".draggable-elem");
    for (let i = 0; i < draggableItems.length; ++i) {
        let item = draggableItems[i];
        item.addEventListener('touchstart', touchStartEvent, false);
        item.addEventListener('touchmove', touchMoveEvent, false);
        item.addEventListener('touchend', touchEndEvent, false);
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

const g_keyboardManager = new KeyboardManager();

function findParentTdElement(elem) {
    let currentNode = elem;
    while (currentNode != null && currentNode.nodeName != "TD") {
        currentNode = currentNode.parentElement;
    }
    return currentNode;
}

function onItemSelected(event) {
    console.log("onItemSelected");
    let targetElem = event.target;
    if (targetElem.id == undefined || targetElem.id == "") {
        let tdElem = findParentTdElement(targetElem);
        if (tdElem != null) {
            // タイルが選択された
            selectItemById(tdElem.id);
        }
    }
    else {
        if (g_keyboardManager.isShiftKeyPressing) {
            selectItemById(targetElem.id, true, false);
        }
        else if (g_keyboardManager.isControlKeyPressing) {
            selectItemById(targetElem.id, false, true);
        }
        else {
            selectItemById(targetElem.id);
        }
    }
}

/***** ドラッグ開始時の処理 *****/
var g_draggingElemId = "";
var g_dragoverTileHistory = new Queue(10);
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

    event.preventDefault();

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
        if (distance == spaces) {
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
                const alpha = "a0";
                for (let tile of unit.attackableTiles) {
                    let color = "#feccc5";
                    color = "#ff8888" + alpha;
                    updateCellBgColor(tile.posX, tile.posY, color);
                }
                for (let tile of unit.movableTiles) {
                    let color = "#cbd6ee";
                    color = "#88aaff" + alpha;
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

    if (targetTile.isUnitPlacable()) {
        if (g_dragoverTileHistory.lastValue != targetTile) {
            g_dragoverTileHistory.enqueue(targetTile);
        }
    } else {
        // ドロップ先に敵ユニットがいる場合はダメージ計算を行う
        let unitPlacedOnTargetTile = targetTile.placedUnit;
        if (unitPlacedOnTargetTile != null && unit.groupId != unitPlacedOnTargetTile.groupId) {
            let attackTile = findBestActionTile(targetTile, unit.attackRange);
            g_app.showDamageCalcSummary(unit, unitPlacedOnTargetTile, attackTile);
        }
    }
}

function getBestActionTile(unit, targetTile, spaces) {
    let moveTile = findBestActionTile(targetTile, spaces);
    if (moveTile == null) {
        // マウスオーバーした座標から決められなかった場合はユニットから一番近い攻撃可能なタイル
        let minDist = unit.moveCount + 1;
        for (let tile of g_appData.map.enumerateTilesInSpecifiedDistanceFrom(targetTile, spaces)) {
            let distance = tile.calculateDistanceToUnit(unit);
            if (tile.placedUnit != null && tile.placedUnit != unit) {
                continue;
            }

            if (distance < minDist) {
                minDist = distance;
                moveTile = tile;
            }
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

function examinesCanBreak(unit, obj) {
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
        let xy = g_appData.map.getPosFromCellId(dropTargetId);
        let x = Number(xy[0]);
        let y = Number(xy[1]);

        let targetTile = g_appData.map.getTile(x, y);

        if (targetTile == unit.placedTile) {
            return;
        }

        let unitPlacedOnTargetTile = targetTile.placedUnit;
        let isActioned = false;
        if (!g_appData.isSupportActivationDisabled && unitPlacedOnTargetTile != null && unit.groupId != unitPlacedOnTargetTile.groupId) {
            g_app.writeSimpleLogLine("attack!");
            // ドロップ先に敵ユニットがいる場合はダメージ計算を行う
            let tile = getBestActionTile(unit, targetTile, unit.attackRange);
            if (tile != null) {
                g_app.__enqueueAttackCommand(unit, unitPlacedOnTargetTile, tile);
                g_appData.isEnemyActionTriggered = true;
                unit.isEnemyActionTriggered = true;
                isActioned = true;
            }
        }
        else if (unitPlacedOnTargetTile != null) {
            // ドロップ先が味方なら補助スキル発動
            if (g_appData.isSupportActivationDisabled) {
                // 入替え
                g_appData.map.moveUnit(unit, x, y);
                isActioned = true;
            }
            else {
                let supportRange = getAssistRange(unit.support);
                let tile = getBestActionTile(unit, targetTile, supportRange);
                if (tile != null) {
                    if (unit.supportInfo != null) {
                        let canApplyAssist =
                            unit.supportInfo.assistType != AssistType.Rally ||
                            (unit.supportInfo.assistType == AssistType.Rally
                                && (unit.canRallyForcibly() || g_app.__canBeBuffedAtLeastSpecifiedAmountByRally(unit, unitPlacedOnTargetTile, 1)));
                        if (canApplyAssist) {
                            g_app.__enqueueSupportCommand(unit, tile, unitPlacedOnTargetTile);
                            isActioned = true;
                        }
                    }
                }
            }
        }
        else {
            if (targetTile.obj != null) {
                let obj = targetTile.obj;
                if (examinesCanBreak(unit, obj)) {
                    // 壊せる壁や施設を破壊
                    let tile = getBestActionTile(unit, targetTile, unit.attackRange);
                    if (tile != null) {
                        g_app.__enqueueBreakStructureCommand(unit, tile, obj);
                        isActioned = true;
                    }
                }
                else if (obj instanceof TrapBase) {
                    g_app.__enqueueMoveCommand(unit, targetTile, true);
                    isActioned = true;
                }
            }
            else {
                // 移動
                if (!g_appData.isSupportActivationDisabled) {
                    if (targetTile != unit.placedTile) {
                        g_app.__enqueueMoveCommand(unit, targetTile, true, CommandType.Normal, true);
                        isActioned = true;
                    }
                }
                else {
                    let moveResult = moveUnit(unit, targetTile, true);
                    isActioned = moveResult != MoveResult.Failure;
                }
            }
        }

        g_app.executePerActionCommand();
        if (isActioned) {
            // g_app.deselectItem();
        }
    }
    else if (dropTargetId == "trashArea") {
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
            else if (dropTargetId == "trashArea") {
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
            else if (dropTargetId == "trashArea") {
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
            else if (dropTargetId == "trashArea") {
                moveStructureToTrashBox(wall);
            }
            // UI の更新
            updateAllUi();
        }
    }
}

function getSelect2OptionValue(className) {
    let select = document.getElementsByClassName(className);
    return select.options[select.selectedIndex].value;
}

function updateMapUi() {
    let table = g_appData.map.toTable();
    let tableElem = table.updateTableElement();
    let mapArea = document.getElementById('mapArea');
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
        let posY = 6;
        for (let unit of g_app.enumerateAllyUnits()) {
            moveUnitToMap(unit, posX, posY);
            ++posX;
            if (posX == g_app.map.width) {
                posX = 0;
                --posY;
            }
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
){
    g_app.settings.loadSettingsFromDict(settingDict,
        loadsAllySettings,
        loadsEnemySettings,
        loadsOffenceSettings,
        loadsDefenceSettings,
        loadsMapSettings,
        clearsAllFirst);
    g_app.updateAllUnitSpur();
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

function importPerTurnSetting(perTurnSettingAsString) {
    let currentTurn = g_appData.currentTurn;
    let turnSetting = new TurnSetting(currentTurn);
    let dict = {};
    dict[turnSetting.serialId] = perTurnSettingAsString;
    loadSettingsFromDict(dict, true, true, true, true, false, false);
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
    using(new ScopedStopwatch(time => g_app.writeDebugLogLine("シミュレーターの初期化: " + time + " ms")), () => {
        g_appData.initHeroInfos(heroInfos);
        for (let i = 0; i < g_appData.heroInfos.length; ++i) {
            g_selectHeroInfos.push({ id: i, text: g_appData.heroInfos.get(i).name });
        }

        createMap();
        g_app.resetUnits(0);
        // g_app.resetUnitsForTesting();
        loadSettings();
    });
}

