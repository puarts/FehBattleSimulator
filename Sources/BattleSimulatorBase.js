/// @file
/// @brief シミュレーターのメインコードです。

function hasTargetOptionValue(targetOptionId, options) {
    for (let index in options) {
        let option = options[index];
        if (option.id === targetOptionId) {
            return true;
        }
    }
    return false;
}

const MoveResult = {
    Success: 0,
    Failure: 1,
    BoltTrapActivated: 2,
    HeavyTrapActivated: 3,
    HexTrapActivated: 4,
}

class MovementAssistResult {
    /**
     * @param  {Boolean} success
     * @param  {Tile} assistUnitTileAfterAssist
     * @param  {Tile} targetUnitTileAfterAssist
     */
    constructor(success, assistUnitTileAfterAssist, targetUnitTileAfterAssist) {
        /** @type {Boolean} */
        this.success = success;
        /** @type {Tile} */
        this.assistUnitTileAfterAssist = assistUnitTileAfterAssist;
        /** @type {Tile} */
        this.targetUnitTileAfterAssist = targetUnitTileAfterAssist;
    }
}

const ModuleLoadState = {
    NotLoaded: 0,
    Loading: 1,
    Loaded: 2,
};

/**
 * アシストタイプを決定する。ステータスが付与できる場合は応援。そうでない場合は回復として振る舞う。
 * @param {Unit} assistUnit
 * @param {Unit} targetUnit
 * @return {number}
 */
function determineAssistType(assistUnit, targetUnit) {
    let skillId = assistUnit.support;
    if (isRallyHealSkill(skillId)) {
        if (canAddStatusEffectByRallyFuncMap.has(skillId)) {
            if (canAddStatusEffectByRallyFuncMap.get(skillId).call(this, assistUnit, targetUnit)) {
                return AssistType.Rally;
            }
        }
        return AssistType.Heal;
    }
    return assistUnit.supportInfo.assistType;
}

/// シミュレーター本体です。
class BattleSimulatorBase {
    constructor(additionalMethods = null) {
        this.isTurnWideCommandQueueEnabled = false;
        this.disableAllLogs = false;
        this.isCommandLogEnabled = true;
        this.tempSerializedTurn = null;
        this.currentPatternIndex = 0; // 暫定処置用

        this.openCvLoadState = ModuleLoadState.NotLoaded;
        this.tesseractLoadState = ModuleLoadState.NotLoaded;

        this.cropper = null;

        /** @type {DamageCalculatorWrapper} **/
        this.damageCalc = new DamageCalculatorWrapper(
            g_appData, g_appData.map, g_appData.globalBattleContext, new HtmlLogger());
        this.beginningOfTurnSkillHandler = new BeginningOfTurnSkillHandler(
            g_appData, g_appData.map, g_appData.globalBattleContext, new HtmlLogger(), moveStructureToTrashBox);
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

        this._imageProcessor = new ImageProcessor();
        this.origAi = new OriginalAi();

        this.skillIdToNameDict = {};

        let self = this;
        this.vm = this.#create_vue(self, g_appData, additionalMethods);

        let setSlotOrder = group => {
            let order = 0;
            for (let unit of this.enumerateUnitsInSpecifiedGroup(group)) {
                unit.slotOrder = order;
                ++order;
            }
        };
        setSlotOrder(UnitGroupType.Ally);
        setSlotOrder(UnitGroupType.Enemy);
    }

    #create_vue(self, appData, additionalMethods) {
        /** @type {AppData} */
        this.data = appData;

        this.methods = {
            bgmEnabledChanged: function () {
                if (self.audioManager.isBgmEnabled) {
                    self.vm.audioManager.isSoundEffectEnabled = true;
                    if (self.vm.changesBgmRandomly) {
                        self.audioManager.setBgmRandom();
                        self.writeDebugLogLine(`BGM番号: ${self.audioManager.currentBgmId}`);
                    }
                    self.audioManager.playBgm();
                } else {
                    self.vm.audioManager.isSoundEffectEnabled = false;
                    self.audioManager.pauseBgm();
                }
            },
            backgroundImageEnabledChanged: function () {
                updateMapUi();
            },
            gameModeChanged: function () {
                // g_appData.clearReservedSkillsForAllUnits();
                appData.setPropertiesForCurrentGameMode();

                // デフォルトのマップに設定
                switch (appData.gameMode) {
                    case GameMode.AetherRaid:
                        self.mapKind = MapType.Izumi;
                        break;
                    case GameMode.Arena:
                        self.mapKind = MapType.Arena_1;
                        break;
                    case GameMode.ResonantBattles:
                        self.mapKind = DefaultResonantBattleMap;
                        break;
                    case GameMode.TempestTrials:
                        self.mapKind = DefaultTempestTrialsMap;
                        break;
                    case GameMode.PawnsOfLoki:
                        self.mapKind = -1;
                        break;
                    default:
                        break;
                }


                appData.updateEnemyAndAllyUnits();
                appData.sortUnitsBySlotOrder();
                appData.__updateStatusBySkillsAndMergeForAllHeroes();
                changeMap();
                appData.clearReservedSkillsForAllUnits();
                resetPlacement();
                switch (appData.gameMode) {
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
                removeBreakableWallsFromTrashBox();
                changeMap();
                switch (appData.gameMode) {
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
                    case GameMode.SummonerDuels:
                        resetPlacement();
                        break;
                }

                updateAllUi();
            },
            addWallToMap: function () {
                let newWallIndex = self.map.countWallsOnMap();
                let wall = self.map.getWall(newWallIndex);
                if (wall == null) {
                    self.writeErrorLine("これ以上壁を配置できません");
                    return;
                }
                removeFromAll(wall);
                moveStructureToEmptyTileOfMap(wall, false);
                updateAllUi();
            },
            removeWallFromMap: function () {
                let wallIndex = self.map.countWallsOnMap() - 1;
                if (wallIndex < 0) {
                    self.writeErrorLine("削除する壁がありません");
                    return;
                }
                let wall = self.map.getWall(wallIndex);

                removeFromAll(wall);
                updateAllUi();
            },
            addBreakableWallToMap: function () {
                let newWallIndex = self.map.countBreakableWallsOnMap();
                let wall = self.map.getBreakableWall(newWallIndex);
                if (wall == null) {
                    self.writeErrorLine("これ以上壊せる壁を配置できません");
                    return;
                }
                removeFromAll(wall);
                moveStructureToEmptyTileOfMap(wall, false);
                updateAllUi();
            },
            removeBreakableWallFromMap: function () {
                let wallIndex = self.map.countBreakableWallsOnMap() - 1;
                if (wallIndex < 0) {
                    self.writeErrorLine("削除する壊せる壁がありません");
                    return;
                }
                let wall = self.map.getBreakableWall(wallIndex);

                removeFromAll(wall);
                updateAllUi();
            },
            resonantBattleIntervalChanged: function () {
                self.__setUnitsForResonantBattles();
                updateAllUi();
            },
            currentItemIndexChanged: function () {
                // if (g_app == null) { return; }
                // changeCurrentUnitTab(self.currentItemIndex);

                // let currentItem = g_appData.currentItem;
                // for (let item of g_appData.enumerateItems()) {
                //     if (item === currentItem) {
                //         item.isSelected = true;
                //     }
                //     else {
                //         item.isSelected = false;
                //     }
                // }

                // let currentUnit = g_app.__getCurrentUnit();
                // if (currentUnit != null) {
                //     if (currentUnit.groupId === UnitGroupType.Ally) {
                //         self.attackerUnitIndex = self.currentItemIndex;
                //     }
                //     else {
                //         self.attackTargetUnitIndex = self.currentItemIndex;
                //     }
                // }
                // g_appData.__showStatusToAttackerInfo();
                // updateAllUi();
            },
            heroIndexChanged: function (e) {
                let currentUnit = self.__getEditingTargetUnit();
                if (currentUnit == null) {
                    return;
                }

                appData.initializeByHeroInfo(currentUnit, currentUnit.heroIndex);
                appData.__updateStatusBySkillsAndMergeForAllHeroes();
                console.log("heroIndexChanged");
                updateAllUi();
            },
            buffChanged: function () {
                if (g_app == null) {
                    return;
                }
                appData.__showStatusToAttackerInfo();
                updateAllUi();
            },
            moveCountChanged: function () {
                if (g_app == null) {
                    return;
                }
                updateAllUi();
            },
            weaponChanged: function () {
                console.log("weaponChanged");
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                unit.weaponRefinement = WeaponRefinementType.None;
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                unit.resetMaxSpecialCount();
                self.updateAllUnitSpur();
                appData.updateArenaScore(unit);
            },
            weaponOptionChanged: function () {
                console.log("weaponOptionChanged");
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                unit.resetMaxSpecialCount();
                g_app.updateAllUnitSpur();
                appData.updateArenaScore(unit);
            },
            supportChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                appData.__updateUnitSkillInfo(unit);
                appData.updateArenaScore(unit);
            },
            specialChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                appData.__updateUnitSkillInfo(unit);
                unit.resetMaxSpecialCount();
                appData.updateArenaScore(unit);
                updateAllUi();
            },
            specialCountChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                updateAllUi();
            },
            hpChanged: function () {
                if (g_app == null) {
                    return;
                }
                appData.__showStatusToAttackerInfo();
                updateAllUi();
            },
            passiveAChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                unit.resetMaxSpecialCount();
                g_app.updateAllUnitSpur();
                appData.updateArenaScore(unit);
            },
            passiveBChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                appData.__updateUnitSkillInfo(unit);
                appData.updateArenaScore(unit);

                // 救援等に変わったら移動可能範囲の更新が必要
                updateAllUi();
            },
            passiveCChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                g_app.updateAllUnitSpur();
                appData.updateArenaScore(unit);
            },
            passiveSChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                g_app.updateAllUnitSpur();
                appData.updateArenaScore(unit);

                // 曲技飛行等で移動範囲が変わる
                updateAllUi();
            },
            passiveXChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                g_app.updateAllUnitSpur();
                appData.updateArenaScore(unit);

                // 曲技飛行等で移動範囲が変わる
                updateAllUi();
            },
            captainChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                appData.__updateStatusBySkillsAndMerges(unit);
                g_app.updateAllUnitSpur();
                updateAllUi();
            },
            mergeChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                updateAllUi();
            },
            dragonflowerChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                updateAllUi();
            },
            emblemHeroMergeChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                updateAllUi();
            },
            summonerLevelChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                updateAllUi();
            },
            grantedBlessingChanged: function () {
                if (g_app == null) {
                    return;
                }
                let currentUnit = g_app.__getEditingTargetUnit();
                if (currentUnit == null) {
                    return;
                }
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                appData.updateArenaScoreOfUnit(currentUnit);

                for (let unit of appData.enumerateSelectedItems(x => x !== currentUnit && x instanceof Unit)) {
                    if (unit.grantedBlessing !== currentUnit.grantedBlessing
                        && unit.providableBlessingSeason === SeasonType.None
                    ) {
                        unit.grantedBlessing = currentUnit.grantedBlessing;
                        appData.__updateStatusBySkillsAndMerges(unit);
                    }
                    appData.updateArenaScoreOfUnit(unit);
                }
                appData.updateArenaScoreOfParties();
                updateAllUi();
            },
            ivChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                unit.updatePureGrowthRate();
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                appData.updateArenaScore(unit);
                updateAllUi();
            },
            addChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                let currentUnit = self.__getCurrentUnit();
                appData.__updateStatusBySkillsAndMerges(currentUnit);
                updateAllUi();
            },
            blessingChanged: function () {
                // if (g_app == null) { return; }
                // let unit = g_app.__getEditingTargetUnit();
                // if (unit == null) { return; }
                // g_appData.__updateStatusBySkillsAndMerges(unit);
                updateAllUi();
            },
            transformedChanged: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getEditingTargetUnit();
                if (unit == null) {
                    return;
                }
                appData.__updateStatusBySkillsAndMerges(unit);
            },
            chaosSeasonChanged: function () {
                if (g_app == null) {
                    return;
                }
                if (self.vm.globalBattleContext.isChaosSeason) {
                    self.vm.globalBattleContext.isLightSeason = false;
                    self.vm.globalBattleContext.isAstraSeason = false;
                } else {
                    self.vm.globalBattleContext.isLightSeason = true;
                    self.vm.globalBattleContext.isAstraSeason = false;
                }
                appData.__updateStatusBySkillsAndMergeForAllHeroes();
                appData.resetCurrentAetherRaidDefensePreset();
            },
            lightSeasonChanged: function () {
                if (g_app == null) {
                    return;
                }
                self.vm.globalBattleContext.isAstraSeason = !self.vm.globalBattleContext.isLightSeason;
                self.vm.globalBattleContext.setChaosSeasonFromCurrentSeasons();
                appData.__updateStatusBySkillsAndMergeForAllHeroes();
                appData.resetCurrentAetherRaidDefensePreset();
            },
            astraSeasonChanged: function () {
                if (g_app == null) {
                    return;
                }
                self.vm.globalBattleContext.isLightSeason = !self.vm.globalBattleContext.isAstraSeason;
                self.vm.globalBattleContext.setChaosSeasonFromCurrentSeasons();
                appData.__updateStatusBySkillsAndMergeForAllHeroes();
                appData.resetCurrentAetherRaidDefensePreset();
            },
            seasonChanged: function () {
                if (g_app == null) {
                    return;
                }
                appData.__updateStatusBySkillsAndMergeForAllHeroes();
                updateAllUi();
            },
            aetherRaidDefensePresetChanged: function () {
                appData.updateAetherRaidDefensePresetDescription();
            },
            aetherRaidOffensePresetChanged: function () {
            },
            slotOrderChanged: function () {
                updateMapUi();
            },
            showDetailLogChanged: function () {
            },
            resetUnitRandom: function () {
                if (g_app == null) {
                    return;
                }
                g_app.resetUnitRandom();
                updateAllUi();
            },
            healHpFull: function () {
                if (g_app == null) {
                    return;
                }
                let unit = g_app.__getCurrentUnit();
                if (unit == null) {
                    return;
                }
                unit.hp = unit.maxHpWithSkills;
                appData.__showStatusToAttackerInfo();
                updateAllUi();
            },
            healHpFullForAllUnits: function () {
                if (g_app == null) {
                    return;
                }
                for (let unit of self.vm.units) {
                    unit.resetAllState();
                }
                appData.__showStatusToAttackerInfo();
                updateAllUi();
            },
            debugMenuEnabledChanged: function () {
                appData.applyDebugMenuVisibility();
            },
            actionDoneChanged: function () {
                updateAllUi();
            },
            activateAllUnit: function () {
                for (let unit of self.vm.units) {
                    unit.isActionDone = false;
                }
                updateAllUi();
            },
            isBonusCharChanged: function () {
                if (g_app == null) {
                    return;
                }
                let currentUnit = g_app.__getEditingTargetUnit();
                if (currentUnit == null) {
                    return;
                }
                let value = currentUnit.isBonusChar;
                for (let unit of appData.enumerateSelectedItems(x => x instanceof Unit)) {
                    if (unit.isBonusChar === value) {
                        continue;
                    }
                    unit.isBonusChar = value;
                }
                appData.__updateStatusBySkillsAndMergeForAllHeroes();
            },
            resetUnitForTesting: function () {
                if (g_app == null) {
                    return;
                }
                g_app.resetUnitsForTesting();
            },
            ornamentIconChanged: function () {
                if (g_app == null) {
                    return;
                }
                let currentItem = appData.currentItem;
                if (!(currentItem instanceof Ornament)) {
                    return;
                }
                currentItem.setIconByOrnamentTypeIndex();
                updateAllUi();
            },
            structureLevelChanged: function () {
                if (g_app == null) {
                    return;
                }
                let currentItem = appData.currentItem;
                let isUpdateUnitRequired = (currentItem instanceof OfFortress) || (currentItem instanceof DefFortress);
                for (let st of appData.enumerateSelectedItems(x => x !== currentItem && x instanceof StructureBase)) {
                    if (st.hasLevel && Number(st.level) !== Number(currentItem.level)) {
                        st.level = Number(currentItem.level);
                    }

                    isUpdateUnitRequired |= (st instanceof OfFortress) || (st instanceof DefFortress);
                }

                if (isUpdateUnitRequired) {
                    appData.__updateStatusBySkillsAndMergeForAllHeroes();
                }

                updateAllUi();
            },
            currentTurnChanged: function () {
                console.log("current turn changed");
                if (self.isAutoLoadTurnSettingEnabled) {
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
                appData.updateAetherRaidDefenseLiftLoss();
                updateMapUi();
            },
            unitSelected: function (event) {
                let name = event.item.name;
                if (name === undefined) {
                    name = event.item.classList[0];
                }
                g_app.selectItem(name);
            },
            examinesAliveTiles: function (event) {
                self.examinesAliveTiles();
            },
            resetCellOverrides: function (event) {
                self.map.resetOverriddenTiles();
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
                appData.updateExportText();
            },
            cellSizeChanged: function () {
                self.map.cellHeight = self.map.cellWidth;
                appData.updateTargetInfoTdStyle();
                updateAllUi();
            },
            ocrSettingFileChanged: function (event) {
                self.vm.showOcrImage = false;
                const files = event.target.files;
                if (files.length === 0) {
                    return;
                }

                self.vm.showOcrImage = true;
                self._imageProcessor.showOcrSettingSourceImage(files);
            },
        };

        if (additionalMethods != null) {
            for (let key in additionalMethods) {
                this.methods[key] = additionalMethods[key];
            }
        }

        return new Vue({
            el: "#app",
            data: appData,
            methods: this.methods,
        });
    }

    tileTypeChanged() {
        let currentItem = g_appData.currentItem;
        for (let tile of g_appData.map.enumerateSelectedTiles()) {
            tile.type = currentItem.type;
        }
        updateAllUi();
    }

    __findMaxSpWeaponId(defaultSkillId, options) {
        let skillInfoArrays = [g_appData.weaponInfos];
        let maxSpSkillInfo = this.__findSkillInfoFromArrays(skillInfoArrays, defaultSkillId);
        let maxSp = 0;
        if (maxSpSkillInfo != null) {
            maxSp = maxSpSkillInfo.sp;
            if (maxSp === 300 && maxSpSkillInfo.weaponRefinementOptions.length > 1) {
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
            if (sp === 300 && info.weaponRefinementOptions.length > 1) {
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
    __findSpecifiedSpSkillId(sp, defaultSkillId, options, skillInfoArrays) {
        let skillInfo = this.__findSkillInfoFromArrays(skillInfoArrays, defaultSkillId);
        if (skillInfo != null && skillInfo.sp === sp) {
            return defaultSkillId;
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
            if (info.sp === sp) {
                return skillId;
            }
        }
        return -1;
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
    /**
     * @param  {Unit} unit
     */
    setUnitToMaxArenaScore(unit) {
        if (unit.heroInfo == null) {
            return;
        }

        unit.merge = 10;
        unit.level = 40;
        unit.setToMaxScoreAsset();

        unit.clearReservedSkills();
        unit.weapon = this.__findMaxSpWeaponId(unit.weapon, unit.heroInfo.weaponOptions);
        let weaponInfo = this.__findWeaponInfo(unit.weapon);
        if (weaponInfo.sp === 300 && weaponInfo.weaponRefinementOptions.length > 1) {
            unit.weaponRefinement = weaponInfo.weaponRefinementOptions[1].id;
        }
        unit.support = this.__getMaxSpSkillId(unit.support, unit.heroInfo.supportOptions, [g_appData.supportInfos]);
        unit.special = this.__getMaxSpSkillId(unit.special, unit.heroInfo.specialOptions, [g_appData.specialInfos]);

        let origPassiveA = unit.passiveA;
        unit.passiveA = this.__getMaxArenaScorePassiveA(unit);

        unit.passiveB = this.__getMaxSpSkillId(unit.passiveB, unit.heroInfo.passiveBOptions, [g_appData.passiveBInfos]);

        let origPassiveC = unit.passiveC;
        unit.passiveC = this.__getMaxSpSkillId(unit.passiveC, unit.heroInfo.passiveCOptions, [g_appData.passiveCInfos]);
        unit.passiveS = this.__getMaxSpSkillId(unit.passiveS, unit.heroInfo.passiveSOptions, [
            g_appData.passiveAInfos,
            g_appData.passiveBInfos,
            g_appData.passiveCInfos,
            g_appData.passiveSInfos]);
        unit.passiveX = this.__getMaxSpSkillId(unit.passiveX, unit.heroInfo.passiveXOptions, [g_appData.passiveXInfos]);

        // A、Cスキルは240から300にしてもスコアが変わらない場合があるのでチェック
        {
            this.data.skillDatabase.updateUnitSkillInfo(unit);
            if (unit.passiveC !== origPassiveC) {
                // スコアが変わらなければ低級スキルを設定
                unit.passiveC = this.__examinesWhetherLowerSpSkillIsTheSameScore(unit, 240) ? this.__findSpecifiedSpSkillId(
                    240, origPassiveC, unit.heroInfo.passiveCOptions, [g_appData.passiveCInfos]) : unit.passiveC;
            }

            this.data.skillDatabase.updateUnitSkillInfo(unit);
            if (unit.passiveA !== origPassiveA && !this.__isDuel4Effective(unit)) {
                // スコアが変わらなければ低級スキルを設定
                unit.passiveA = this.__examinesWhetherLowerSpSkillIsTheSameScore(unit, 240) ? this.__findSpecifiedSpSkillId(
                    240, origPassiveA, unit.heroInfo.passiveAOptions, [g_appData.passiveAInfos]) : unit.passiveA;
            }
        }

        g_appData.__updateStatusBySkillsAndMerges(unit);
        this.updateAllUnitSpur();
        g_appData.updateArenaScore(unit);
        unit.resetMaxSpecialCount();
        updateAllUi();
    }

    __examinesWhetherLowerSpSkillIsTheSameScore(unit, lowerSkillSp) {
        let currentTotalSp = unit.getTotalSp();
        let totalSp = currentTotalSp - (300 - lowerSkillSp);
        let currentScore = calcArenaTotalSpScore(currentTotalSp);
        let score = calcArenaTotalSpScore(totalSp);
        return score === currentScore;
    }

    __getMaxSpSkillId(defaultSkillId, options, skillInfoArrays) {
        let defaultSkillInfo = this.data.findSkillInfoByDict(defaultSkillId);
        let maxSpSkillId = this.__findMaxSpSkillId(defaultSkillId, options, skillInfoArrays);
        let maxSpSkillInfo = this.data.findSkillInfoByDict(maxSpSkillId);
        if (defaultSkillInfo == null || defaultSkillInfo.sp < maxSpSkillInfo.sp) {
            return maxSpSkillId;
        }
        else {
            return defaultSkillId;
        }
    }

    /**
     * @param  {Unit} unit
     */
    __getMaxArenaScorePassiveA(unit) {
        if (this.__isDuel4Effective(unit)) {
            let duel4Skill = this.__findEquipableMaxDuelSkill(unit);
            if (duel4Skill !== PassiveA.None) {
                unit.passiveA = duel4Skill;
                return duel4Skill;
            }
        }

        return this.__getMaxSpSkillId(unit.passiveA, unit.heroInfo.passiveAOptions, [g_appData.passiveAInfos]);
    }

    __isDuel4Effective(unit) {
        let currentScore = unit.calcArenaBaseStatusScore();
        let duel4Score = calcArenaBaseStatusScore(unit.getDuel4Rating());
        return currentScore < duel4Score;
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
            case Hero.DuoSanaki:
            case Hero.DuoLaegijarn:
            case Hero.DuoCorrin:
            case Hero.DuoLyn:
                if (!duoUnit.isActionDone || !duoUnit.isAttackDone) {
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
                    if (g_appData.currentTurn <= limitTurn) {
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
                if (g_appData.currentTurn <= limitTurn) {
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
            let includesEmblem = origin.indexOf("紋章の謎") >= 0;
            for (let targetOrigin of targetOrigins) {
                if (includesEmblem) {
                    if (targetOrigin.indexOf("紋章の謎") >= 0) {
                        return true;
                    }
                }
                else if (origin === targetOrigin) {
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

    __applySkillEffectToSameOriginUnits(duoUnit, func) {
        let targetOrigins = duoUnit.heroInfo.origin.split('|');
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit, true)) {
            if (this.__areSameOrigin(unit, targetOrigins)) {
                func(unit);
            }
        }
    }

    __refreshHighestHpUnitsInSameOrigin(duoUnit) {
        let targetOrigins = duoUnit.heroInfo.origin.split('|');
        let highestHpUnits = [];
        let highestHp = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 2, true)) {
            if (this.__areSameOrigin(unit, targetOrigins)) {
                if (unit !== duoUnit && unit.isActionDone) {
                    if (unit.hp > highestHp) {
                        highestHpUnits = [unit];
                        highestHp = unit.hp;
                    } else if (unit.hp === highestHp) {
                        highestHpUnits.push(unit);
                    }
                }
            }
        }

        if (highestHpUnits.length === 1) {
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
            case Hero.HarmonizedChloe:
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.Incited);
                this.__applySkillEffectToSameOriginUnits(duoUnit, u => u.reduceSpecialCount(2));
                break;
            case Hero.DuoLyon:
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(duoUnit)) {
                    if (unit.isInCrossOf(duoUnit)) {
                        if (g_appData.gameMode !== GameMode.SummonerDuels) {
                            unit.addStatusEffect(StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately);
                        } else {
                            if (unit.isActionDone) {
                                unit.addStatusEffect(StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately);
                            } else {
                                unit.endAction();
                            }
                        }
                    }
                }
                break;
            case Hero.HarmonizedIgrene:
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.Treachery);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.Desperation);
                break;
            case Hero.DuoSeidr:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 4, true)) {
                    unit.addStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
                    unit.addStatusEffect(StatusEffectType.TimesGate);
                }
                break;
            case Hero.DuoByleth:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 2, true)) {
                    unit.applyBuffs(0, 0, 6, 6);
                    unit.addStatusEffect(StatusEffectType.ReduceDamageFromAreaOfEffectSpecialsBy80Percent);
                    unit.addStatusEffect(StatusEffectType.Hexblade);
                }
                duoUnit.addStatusEffect(StatusEffectType.ShieldArmor);
                break;
            case Hero.HarmonizedAnna:
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantShield);
                this.__applySkillEffectToSameOriginUnits(duoUnit, unit => unit.heal(99));
                duoUnit.reduceSpecialCount(5);
                break;
            case Hero.DuoKagero:
                duoUnit.reduceSpecialCount(1);
                duoUnit.addStatusEffect(StatusEffectType.MobilityIncreased);
                duoUnit.addStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                break;
            case Hero.HarmonizedAyra:
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.MobilityIncreased);
                this.__applySkillEffectToSameOriginUnits(duoUnit, unit => unit.applyBuffs(6, 6, 0, 0));
                this.__applySkillEffectToSameOriginUnits(duoUnit, unit => unit.clearNegativeStatusEffects());
                break;
            case Hero.DuoYmir:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 2, true)) {
                    unit.clearNegativeStatusEffects();
                    unit.heal(20);
                }
                break;
            case Hero.DuoShamir:
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(duoUnit)) {
                    if (this.__isInRowColumn(unit, duoUnit, 1, 1)) {
                        unit.addStatusEffect(StatusEffectType.Gravity);
                    }
                    if (this.__isInRowColumn(unit, duoUnit, 5, 5)) {
                        unit.addStatusEffect(StatusEffectType.Feud);
                    }
                }
                break;
            case Hero.HarmonizedTiki:
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantShield);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.NeutralizesPenalties);
                break;
            case Hero.DuoMark:
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(duoUnit)) {
                    if (this.__isInRowColumn(unit, duoUnit, 3, 3)) {
                        unit.addStatusEffect(StatusEffectType.Isolation);
                        unit.addStatusEffect(StatusEffectType.Guard);
                        unit.increaseSpecialCount(2);
                    }
                }
                break;
            case Hero.HarmonizedKarla: {
                let targetOrigins = duoUnit.heroInfo.origin.split('|');
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit, true)) {
                    if (this.__areSameOrigin(unit, targetOrigins)) {
                        unit.reduceSpecialCount(2);
                        unit.applyAtkBuff(6);
                        unit.addStatusEffect(StatusEffectType.ResonantBlades);
                    }
                }
            }
                break;
            case Hero.HarmonizedLinde:
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.Dodge);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
                break;
            case Hero.DuoAskr:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 2, true)) {
                    unit.applyAllBuff(6);
                    unit.reduceSpecialCount(1);
                }
                break;
            case Hero.HarmonizedCordelia: {
                let targetOrigins = duoUnit.heroInfo.origin.split('|');
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit, true)) {
                    if (this.__areSameOrigin(unit, targetOrigins)) {
                        unit.applyBuffs(6, 6, 0, 0);
                        unit.addStatusEffect(StatusEffectType.ResonantBlades);
                        unit.addStatusEffect(StatusEffectType.Treachery);
                    }
                }
                break;
            }
            case Hero.DuoDuma:
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit)) {
                    if (Math.abs(unit.posX - duoUnit.posX) <= 2 &&
                        Math.abs(unit.posY - duoUnit.posY) <= 2) {
                        unit.clearNegativeStatusEffects();
                        unit.addStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                        unit.heal(30);
                    }
                }
                break;
            case Hero.DuoNina:
                duoUnit.addStatusEffect(StatusEffectType.MobilityIncreased);
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(duoUnit)) {
                    if (unit.posX === duoUnit.posX || unit.posY === duoUnit.posY ||
                        unit.hasNegativeStatusEffect()) {
                        unit.applyAllDebuff(-7);
                        unit.addStatusEffect(StatusEffectType.Panic);
                    }
                }
                break;
            case Hero.DuoThorr: {
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(duoUnit)) {
                    if (unit.posX === duoUnit.posX || unit.posY === duoUnit.posY) {
                        unit.addStatusEffect(StatusEffectType.Gravity);
                    }
                }
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(duoUnit)) {
                    if (Math.abs(unit.posX - duoUnit.posX) <= 2 ||
                        Math.abs(unit.posY - duoUnit.posY) <= 2) {
                        unit.clearPositiveStatusEffects();
                        if (!unit.hasStatusEffect(StatusEffectType.Panic)) {
                            unit.resetBuffs();
                        }
                    }
                }
                break;
            }
            case Hero.HarmonizedEdelgard: {
                let targetOrigins = duoUnit.heroInfo.origin.split('|');
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit, true)) {
                    if (this.__areSameOrigin(unit, targetOrigins)) {
                        unit.applyAtkBuff(6);
                    }
                }
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantShield);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.BonusDoubler);
                break;
            }
            case Hero.HarmonizedRoy: {
                let targetOrigins = duoUnit.heroInfo.origin.split('|');
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit, true)) {
                    if (this.__areSameOrigin(unit, targetOrigins)) {
                        unit.applyDefBuff(6);
                        unit.applyResBuff(6);
                        unit.addStatusEffect(StatusEffectType.ResonantShield);
                        unit.addStatusEffect(StatusEffectType.Treachery);
                    }
                }
                break;
            }
            case Hero.DuoIke:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Enemy, 5, 99)) {
                    unit.applyAtkDebuff(-7);
                    unit.applySpdDebuff(-7);
                    unit.addStatusEffect(StatusEffectType.Guard);
                    unit.increaseSpecialCount(2);
                }
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Enemy, 99, 5)) {
                    unit.applyAtkDebuff(-7);
                    unit.applySpdDebuff(-7);
                    unit.addStatusEffect(StatusEffectType.Guard);
                    unit.increaseSpecialCount(2);
                }
                break;
            case Hero.HarmonizedSonya: {
                let targetOrigins = duoUnit.heroInfo.origin.split('|');
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit, true)) {
                    if (this.__areSameOrigin(unit, targetOrigins)) {
                        unit.reduceSpecialCount(2);
                        unit.applyAtkBuff(6);
                        unit.addStatusEffect(StatusEffectType.ResonantBlades);
                    }
                }
                break;
            }
            case Hero.DuoChrom:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 2, true)) {
                    unit.applyAllDebuff(-5);
                    unit.addStatusEffect(StatusEffectType.GrandStrategy);
                }
                break;
            case Hero.HarmonizedTana:
            case Hero.HarmonizedAzura:
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                this.__refreshHighestHpUnitsInSameOrigin(duoUnit);
                break;
            case Hero.DuoDagr:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Ally, 5, 5)) {
                    unit.applyAllBuff(6);
                    unit.addStatusEffect(StatusEffectType.Pathfinder);
                }
                break;
            case Hero.HarmonizedLysithea: {
                let targetOrigins = duoUnit.heroInfo.origin.split('|');
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(duoUnit, true)) {
                    if (this.__areSameOrigin(unit, targetOrigins)) {
                        unit.applyAtkBuff(6);
                    }
                }
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.ResonantBlades);
                this.__addStatusEffectToSameOriginUnits(duoUnit, StatusEffectType.BonusDoubler);
            }
                break;
            case Hero.DuoSothis:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 2, true)) {
                    unit.addStatusEffect(StatusEffectType.NullFollowUp);
                    if (this.__getStatusEvalUnit(unit).isSpecialCountMax) {
                        unit.reduceSpecialCount(1);
                    }
                }
                break;
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
            case Hero.HarmonizedLeif:
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
                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(duoUnit, 3)) {
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
                    let highestHp = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 1, false)) {
                        if (unit.isActionDone) {
                            if (unit.hp > highestHp) {
                                highestHpUnits = [unit];
                                highestHp = unit.hp;
                            }
                            else if (unit.hp === highestHp) {
                                highestHpUnits.push(unit);
                            }
                        }
                    }

                    if (highestHpUnits.length === 1) {
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
            case Hero.DuoSanaki:
            case Hero.DuoLaegijarn:
            case Hero.DuoCorrin:
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
                    if (unit.moveType === MoveType.Infantry || unit.moveType === MoveType.Armor) {
                        unit.addStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                }
                break;
            case Hero.ChristmasMarth:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Ally, 99, 3)) {
                    if (unit === duoUnit) {
                        continue;
                    }
                    if (unit.moveType === MoveType.Flying || unit.moveType === MoveType.Armor) {
                        unit.applyAllBuff(3);
                        unit.addStatusEffect(StatusEffectType.BonusDoubler);
                    }
                }
                break;
            case Hero.NewYearAlfonse:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Ally, 3, 3)) {
                    if (unit.moveType === MoveType.Infantry) {
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
                    unit.addStatusEffect(StatusEffectType.ShieldArmor);
                    unit.addStatusEffect(StatusEffectType.ShieldDragon);
                    unit.applyDefBuff(6);
                    unit.applyResBuff(6);
                }
                break;
            case Hero.YoungPalla:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 1, true)) {
                    unit.addStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case Hero.DuoElise:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(duoUnit, 2, true)) {
                    unit.addStatusEffect(StatusEffectType.TotalPenaltyDamage);
                }
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(duoUnit.posX, duoUnit.posY, UnitGroupType.Enemy, 3, 99)) {
                    unit.applyDefDebuff(-7);
                    unit.applyResDebuff(-7);
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

    /**
     * 縦row列と横column列にいるかどうかを返す
     * @param {Unit} unitA
     * @param {Unit} unitB
     * @param {number} row
     * @param {number} column
     */
    __isInRowColumn(unitA, unitB, row, column) {
        let rowDiff = (row - 1) / 2;
        let columnDiff = (column - 1) / 2;
        return Math.abs(unitA.posX - unitB.posX) <= columnDiff ||
            Math.abs(unitA.posY - unitB.posY) <= rowDiff;
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
            if (st.iconFileName === iconFileName) {
                return st;
            }
        }

        for (let setting of OrnamentSettings) {
            if (setting.icon === iconFileName) {
                return this.__findStructure(st => st instanceof Ornament);
            }
        }
        return null;
    }


    limitArrayLengthTo2WithLargerLengthString(strArray) {
        if (strArray.length === 2) {
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
                if (maxIndices[j][0] === i) {
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
            if (skillInfo.name === foundName) {
                return skillInfo;
            }
        }
        return null;
    }

    loadImageAnalysisLibraries() {
        let self = this;
        if (this.tesseractLoadState === ModuleLoadState.NotLoaded) {
            self.tesseractLoadState = ModuleLoadState.Loading;
            self.writeSimpleLogLine("Tesseract の初期化開始..");
            // noinspection SpellCheckingInspection
            importJs("https://unpkg.com/tesseract.js@1.0.19/dist/tesseract.min.js", x => {
                self.tesseractLoadState = ModuleLoadState.Loaded;
                self.writeSimpleLogLine("Tesseract の初期化完了");
            });
        }

        if (this.openCvLoadState === ModuleLoadState.NotLoaded) {
            self.openCvLoadState = ModuleLoadState.Loading;
            self.writeSimpleLogLine("OpenCV の初期化開始..");
            // let jsPath = "https://docs.opencv.org/4.3.0/opencv.js";
            let jsPath = g_siteRootPath + "js/opencv4.5.3/opencv.js";
            importJs(jsPath, x => {
                cv['onRuntimeInitialized'] = () => {
                    self.openCvLoadState = ModuleLoadState.Loaded;
                    self.writeSimpleLogLine("OpenCV の初期化完了");
                };
            });
        }
    }

    async setUnitsByStatusImages(files) {
        if (files.length === 0) {
            this.writeErrorLine("画像ファイルを選択してください");
            return;
        }

        if (this.openCvLoadState !== ModuleLoadState.Loaded) {
            this.writeErrorLine("OpenCV の初期化が終わっていません。少し待ってから実行してください。");
            return;
        }
        if (this.tesseractLoadState !== ModuleLoadState.Loaded) {
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

            let isHeroIndexChanged = heroIndex != null && unit.heroIndex !== heroIndex;
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
        let isHeroIndexChanged = heroIndex !== unit.heroIndex;
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
            if (heroInfo.moveType === moveType
                && heroInfo.attackRange === attackRange
                && heroInfo.howToGet === "ガチャ"
                && heroInfo.name !== "スルト"
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

        let heroInfos;
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
        ++i;
        if (skillIds[i] != null) {
            unit.passiveX = skillIds[i];
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
            // 敵を画像認識したいことはないと思うので、敵が除外されたリストから探す
            g_appData.heroInfos.heroInfosWithoutEnemy,
            info => {
                if (info.pureNames.length === 0) {
                    return 10000;
                }

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
            if (partialName[0] === statusName[0]) {
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
            if (diff === 0) {
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
            if (diff === 0) {
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
        let serializedTurn = g_appData.exportSettingsAsString();

        let self = this;
        let results = [];
        this.damageCalc.isLogEnabled = false;
        let durabilityTestLogEnabled = this.vm.durabilityTestIsLogEnabled;
        this.vm.durabilityTestIsLogEnabled = false;
        let reducedTargetSpecialCount = targetUnit.maxSpecialCount - targetUnit.specialCount;


        const startTime = Date.now();

        // let dummyHeroIndices = [targetUnit.heroIndex];
        const enemyHeroInfos = Array.from(g_appData.heroInfos.data.filter(x => x.bookVersion > 0));
        const unitCount = enemyHeroInfos.length;
        startProgressiveProcess(unitCount,
            // startProgressiveProcess(dummyHeroIndices.length,
            function (iter) {
                let heroInfo = enemyHeroInfos[iter];
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
                let winRate = results[lastIndex].result.winCount / unitCount;
                let aliveRate = (results[lastIndex].result.winCount + results[lastIndex].result.drawCount) / unitCount;
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
                let diffSec = (endTime - startTime) * 0.001;
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
        let serializedTurn = g_appData.exportSettingsAsString();

        this.clearLog();
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
        let serializedTurn = g_appData.exportSettingsAsString();

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

    /**
     * @param  {Function} predicator=null
     * @returns {Generator<Unit>}
     */
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

    __getEditingTargetUnit() {
        return g_appData.currentUnit != null
            && g_appData.currentUnit.canHavePairUpUnit
            && g_appData.currentUnit.isEditingPairUpUnit ? g_appData.currentUnit.pairUpUnit : g_appData.currentUnit;
    }

    setHeroByIndex(unitIndex, heroIndex) {
        this.setHero(this.vm.units[unitIndex], heroIndex);
    }

    setHero(unit, heroIndex) {
        if (unit.heroIndex === heroIndex) {
            return;
        }

        g_appData.initializeByHeroInfo(unit, heroIndex);
    }

    gainCurrentTurn() {
        if (g_appData.currentTurn > 6) {
            return;
        }
        g_appData.commandQueuePerAction.clear();
        if (g_appData.currentTurn > 0 && g_appData.globalBattleContext.currentPhaseType === UnitGroupType.Ally) {
            g_appData.globalBattleContext.currentPhaseType = UnitGroupType.Enemy;
            return;
        }
        g_appData.globalBattleContext.currentPhaseType = UnitGroupType.Ally;
        ++g_appData.globalBattleContext.currentTurn;
        this.__turnChanged();
    }
    backToZeroTurn() {
        this.clearLog();
        this.commandQueuePerAction.undoAll();
        if (g_appData.currentTurn > 0) {
            g_appData.globalBattleContext.currentTurn = 0;
            g_appData.globalBattleContext.miracleAndHealWithoutSpecialActivationCount[UnitGroupType.Ally] = 0;
            g_appData.globalBattleContext.miracleAndHealWithoutSpecialActivationCount[UnitGroupType.Enemy] = 0;
            loadSettings();
            // タイルの天脈をリセットする
            for (let tile of g_appData.map.enumerateTiles()) {
                tile.divineVein = DivineVeinType.None;
                tile.divineVeinGroup = null;
            }
        }
        else {
            updateAllUi();
        }
        this.__turnChanged();
    }
    backCurrentTurn() {
        if (g_appData.currentTurn < 1) {
            return;
        }
        g_appData.commandQueuePerAction.clear();
        if (g_appData.currentTurn > 0 && g_appData.globalBattleContext.currentPhaseType === UnitGroupType.Enemy) {
            g_appData.globalBattleContext.currentPhaseType = UnitGroupType.Ally;
            return;
        }
        g_appData.globalBattleContext.currentPhaseType = UnitGroupType.Enemy;
        --g_appData.globalBattleContext.currentTurn;
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
            if (option.id === id) {
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
        if (attacker.groupId === UnitGroupType.Ally) {
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
        let preset;
        if (this.vm.globalBattleContext.isLightSeason) {
            if (index < AetherRaidOffensePresetOptions_LightSeason.length) {
                preset = AetherRaidOffensePresetOptions_LightSeason[index];
            } else {
                preset = AetherRaidOffensePresetOptions_LightSeason[AetherRaidOffensePresetOptions_LightSeason.length - 1];
            }
        } else {
            if (index < AetherRaidOffensePresetOptions_AstraSeason.length) {
                preset = AetherRaidOffensePresetOptions_AstraSeason[index];
            } else {
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
        let warning = "<span style='font-size:10px;color:#d05000'>" + log + '</span><br/>';
        this.vm.damageCalcLog += warning;
        this.writeSimpleLogLine(warning);
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
        if (this.disableAllLogs || this.vm.showDetailLog === false) {
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

    enumerateUnits(predicator = null) {
        return g_appData.enumerateUnitsWithPredicator(predicator);
    }
    enumerateUnitsOnMap(predicator = null) {
        return g_appData.enumerateUnitsWithPredicator(x => x.isOnMap && predicator?.(x));
    }

    __findIndexOfUnit(id) {
        for (let i = 0; i < this.vm.units.length; ++i) {
            let unit = this.vm.units[i];
            if (unit.id === id) {
                return i;
            }
        }

        return -1;
    }

    findUnitById(id) {
        return g_appData.findUnitById(id);
    }
    /**
     * @param  {HeroInfo[]} heroInfos
     * @param  {Boolean} registersSkillOptions
     */
    registerHeroOptions(heroInfos, registersSkillOptions = true) {
        using_(new ScopedStopwatch(time => g_app.writeDebugLogLine("英雄データベースの初期化: " + time + " ms")), () => {
            g_appData.initHeroInfos(heroInfos, registersSkillOptions);
        });
    }

    __isPlusWeaponAvailable(weaponName) {
        let plusWeaponName = weaponName + "+";
        for (let info of g_appData.weaponInfos) {
            if (info.name === plusWeaponName) {
                return true;
            }
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
        for (let info of g_appData.passiveXInfos) {
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
    __findPassiveXInfo(id) {
        return g_appData.__findPassiveXInfo(id);
    }

    __findSkillInfoByName(skillInfos, name) {
        for (let info of skillInfos) {
            if (info.name === name) {
                return info;
            }
        }

        return null;
    }

    __findSkillInfo(skillInfos, id) {
        return __findSkillInfo(skillInfos, id);
    }
    /**
     * @param  {SkillInfo[][]} skillInfoArrays
     * @param  {Number} id
     * @returns {SkillInfo}
     */
    __findSkillInfoFromArrays(skillInfoArrays, id) {
        for (let skillInfos of skillInfoArrays) {
            for (let info of skillInfos) {
                if (Number(info.id) === id) {
                    return info;
                }
            }
        }

        return null;
    }
    /**
     * @param  {SkillInfo[]} skillInfos
     */
    __forceToBeImplemented(skillInfos) {
        for (const skillInfo of skillInfos) {
            skillInfo.isAdditionalImplRequired = false;
        }
    }

    registerSkillOptions(
        weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs, passiveXs, captainSkills = [], marksUnsupportedSkills = true
    ) {
        let self = this;
        using_(new ScopedStopwatch(time => self.writeDebugLogLine("スキル情報の登録: " + time + " ms")), () => {
            if (!marksUnsupportedSkills) {
                // 未実装に×マークがつかないようにする
                this.__forceToBeImplemented(weapons);
                this.__forceToBeImplemented(supports);
                this.__forceToBeImplemented(specials);
                this.__forceToBeImplemented(passiveAs);
                this.__forceToBeImplemented(passiveBs);
                this.__forceToBeImplemented(passiveCs);
                this.__forceToBeImplemented(passiveSs);
                this.__forceToBeImplemented(passiveXs);
                this.__forceToBeImplemented(captainSkills);
            }
            this.data.registerSkillOptions(weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs, passiveXs, captainSkills);

            self.passiveSkillCharWhiteList = "";
            self.weaponSkillCharWhiteList = "";
            self.supportSkillCharWhiteList = "";
            self.specialSkillCharWhiteList = "";
            for (let info of g_appData.skillDatabase.weaponInfos) {
                info.type = SkillType.Weapon;
                self.weaponSkillCharWhiteList += info.name;

                info.weaponRefinementOptions.push(self.vm.weaponRefinementOptions[0]);
                if (info.hasSpecialWeaponRefinement) {
                    if (info.specialRefineHpAdd === 3) {
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Special_Hp3, text: "特殊、HP+3" });
                    }
                    else {
                        info.weaponRefinementOptions.push({ id: WeaponRefinementType.Special, text: "特殊" });
                    }
                }

                if (info.weaponType === WeaponType.Staff) {
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
            for (let info of g_appData.skillDatabase.supportInfos) {
                self.supportSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.skillDatabase.specialInfos) {
                self.specialSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.skillDatabase.passiveAInfos) {
                self.passiveSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.skillDatabase.passiveBInfos) {
                self.passiveSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.skillDatabase.passiveCInfos) {
                self.passiveSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.skillDatabase.passiveSInfos) {
                self.passiveSkillCharWhiteList += info.name;
            }
            for (let info of g_appData.skillDatabase.passiveXInfos) {
                self.passiveSkillCharWhiteList += info.name;
            }

            distinctStr(self.supportSkillCharWhiteList);
            distinctStr(self.specialSkillCharWhiteList);
            distinctStr(self.passiveSkillCharWhiteList);
            distinctStr(self.weaponSkillCharWhiteList);

            // 対応してないスキルに目印×をつける
            self.__markUnsupportedSkills(self.vm.weaponOptions, [g_appData.weaponInfos], () => ++self.vm.weaponCount, () => ++self.vm.weaponImplCount);
            self.__markUnsupportedSkills(self.vm.supportOptions, [g_appData.supportInfos], () => ++self.vm.supportCount, () => ++self.vm.supportImplCount);
            self.__markUnsupportedSkills(self.vm.specialOptions, [g_appData.specialInfos], () => ++self.vm.specialCount, () => ++self.vm.specialImplCount);
            self.__markUnsupportedSkills(self.vm.passiveAOptions, [g_appData.passiveAInfos], () => ++self.vm.passiveACount, () => ++self.vm.passiveAImplCount);
            self.__markUnsupportedSkills(self.vm.passiveBOptions, [g_appData.passiveBInfos], () => ++self.vm.passiveBCount, () => ++self.vm.passiveBImplCount);
            self.__markUnsupportedSkills(self.vm.passiveCOptions, [g_appData.passiveCInfos], () => ++self.vm.passiveCCount, () => ++self.vm.passiveCImplCount);
            self.__markUnsupportedSkills(self.vm.passiveSOptions,
                [g_appData.passiveSInfos, g_appData.passiveAInfos, g_appData.passiveBInfos, g_appData.passiveCInfos, g_appData.passiveSInfos],
                () => ++self.vm.passiveSCount, () => ++self.vm.passiveSImplCount);
            self.__markUnsupportedSkills(self.vm.passiveXOptions, [g_appData.passiveXInfos], () => ++self.vm.passiveXCount, () => ++self.vm.passiveXImplCount);
            self.__markUnsupportedSkills(self.vm.captainOptions, [g_appData.captainInfos]);

            // アルファベットソート(今は全スキルのオプションをメインで使ってないので速度優先でソートは無効化)
            // self.__sortSkillOptionsAlphabetically(self.vm.weaponOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.supportOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.specialOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.passiveAOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.passiveBOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.passiveCOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.passiveSOptions);
            // self.__sortSkillOptionsAlphabetically(self.vm.passiveXOptions);
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
        for (let option of self.vm.passiveXOptions) {
            if (option.text.startsWith("×")) {
                yield option;
            }
        }
    }
    __sortSkillOptionsAlphabetically(options) {
        options.sort(function (a, b) {
            if (a.id === -1) { return -1; }
            if (b.id === -1) { return 1; }
            if (a.text < b.text) { return -1; }
            if (a.text > b.text) { return 1; }
            return 0;
        });
    }
    __markUnsupportedSkills(skillOptions, infoLists, countFunc = null, countImplFunc = null) {
        for (let skill of skillOptions) {
            if (skill < 0) {
                continue;
            }
            countFunc?.();
            let skillInfo = this.__findSkillInfoFromArrays(infoLists, skill.id);
            let isImplemented = skill.id === NoneValue || (skillInfo != null && skillInfo.isImplemented());
            if (isImplemented) {
                countImplFunc?.();
            }
            if (skillInfo != null) {
                skill.text = skillInfo.getDisplayName();
            }

            this.skillIdToNameDict[skill.id] = skill.text;
        }
    }

    __findSkillNameFromSkillOptions(skillId, options) {
        let option = options.find(x => x.id === skillId);
        if (option == null) {
            return "不明";
        }

        return option.text;
    }

    /**
     * 戦闘ダメージを計算し、計算結果に基づき、ユニットの状態を更新します。戦闘後に発動するスキルの効果も反映されます。
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Tile} tileToAttack=null
     */
    updateDamageCalculation(atkUnit, defUnit, tileToAttack = null) {
        this.damageCalc.clearLog();

        let result = this.damageCalc.updateDamageCalculation(atkUnit, defUnit, tileToAttack, this.data.gameMode);
        atkUnit.isAttackDone = true;
        atkUnit.isCombatDone = true;
        defUnit.isCombatDone = true;

        // this.clearSimpleLog();
        this.writeSimpleLogLine(this.damageCalc.simpleLog);
        this.writeLogLine(this.damageCalc.log);

        // 切り込みなどの移動系スキル
        let isMoveSkillEnabled = defUnit === result.defUnit;
        if (isMoveSkillEnabled && atkUnit.isAlive) {
            this.__applyMovementSkillAfterCombat(atkUnit, defUnit);
        }

        // battleContextが必要なスキル発動後に追跡対象を更新する(追跡対象更新時にbattleContextが初期化されるため)
        // そのために現時点で更新が必要なタイルを保存しておく
        let tilesForUpdateChaseTargetTile = [];

        if (atkUnit.hp === 0) {
            this.audioManager.playSoundEffect(SoundEffectId.Dead);
            g_appData.globalBattleContext.RemovedUnitCountsInCombat[atkUnit.groupId]++;

            // マップからの除外
            let updateRequiredTile = atkUnit.placedTile;
            moveUnitToTrashBox(atkUnit);
            tilesForUpdateChaseTargetTile.push(updateRequiredTile);
        } else {
            // マップからの除外
            // 護り手ユニットが倒されている可能性もあるので全員見る
            for (let unit of this.enumerateUnitsInTheSameGroupOnMap(defUnit, true)) {
                if (unit.hp === 0) {
                    this.audioManager.playSoundEffect(SoundEffectId.Dead);
                    g_appData.globalBattleContext.RemovedUnitCountsInCombat[unit.groupId]++;
                    switch (unit.passiveS) {
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

                    let updateRequiredTile = unit.placedTile;
                    moveUnitToTrashBox(unit);
                    tilesForUpdateChaseTargetTile.push(updateRequiredTile);
                    break;
                }
            }
        }

        // 優先度の高い再行動スキルの評価
        if (atkUnit.isAlive) {
            for (let skillId of atkUnit.enumerateSkills()) {
                let funcMap = applyHighPriorityAnotherActionSkillEffectFuncMap;
                if (funcMap.has(skillId)) {
                    let func = funcMap.get(skillId);
                    if (typeof func === "function") {
                        func.call(this, atkUnit, defUnit, tileToAttack);
                    } else {
                        console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                    }
                }
            }
        }

        // 戦闘後の移動系スキルを加味する必要があるので後段で評価
        if (atkUnit.isAlive) {
            for (let skillId of atkUnit.enumerateSkills()) {
                let funcMap = applySkillEffectAfterMovementSkillsActivatedFuncMap;
                if (funcMap.has(skillId)) {
                    let func = funcMap.get(skillId);
                    if (typeof func === "function") {
                        func.call(this, atkUnit, defUnit, tileToAttack);
                    } else {
                        console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                    }
                }
                switch (skillId) {
                    case PassiveB.GoldUnwinding: {
                        let logMessage = `${atkUnit.nameWithGroup}のBスキル効果発動可能まで残り${atkUnit.restPassiveBSkillAvailableTurn}ターン`;
                        if (atkUnit.restPassiveBSkillAvailableTurn === 0) {
                            logMessage = `${atkUnit.nameWithGroup}のBスキル効果は現在発動可能`;
                        }
                        this.writeLogLine(logMessage);
                        this.writeSimpleLogLine(logMessage);
                        if (atkUnit.restPassiveBSkillAvailableTurn !== 0) {
                            this.writeLog(`ターン制限により${atkUnit.nameWithGroup}の再行動スキル効果は発動せず`);
                        }
                        if (!atkUnit.isOneTimeActionActivatedForPassiveB &&
                            atkUnit.isActionDone &&
                            atkUnit.restPassiveBSkillAvailableTurn === 0) {
                            logMessage = `${atkUnit.getNameWithGroup()}は${atkUnit.passiveBInfo.name}により再行動`;
                            this.writeLogLine(logMessage);
                            this.writeSimpleLogLine(logMessage);
                            atkUnit.restPassiveBSkillAvailableTurn = 2;
                            atkUnit.isActionDone = false;
                            atkUnit.addStatusEffect(StatusEffectType.Gravity);
                            atkUnit.isOneTimeActionActivatedForPassiveB = true;
                        }
                    }
                        break;
                    case Weapon.HadoNoSenfu:
                        if (!atkUnit.isOneTimeActionActivatedForWeapon &&
                            atkUnit.isWeaponSpecialRefined &&
                            atkUnit.battleContext.initiatesCombat &&
                            !this.__isThereAllyInSpecifiedSpaces(atkUnit, 1) &&
                            atkUnit.isActionDone) {
                            atkUnit.isActionDone = false;
                            atkUnit.isOneTimeActionActivatedForWeapon = true;
                        }
                        break;
                    case Weapon.TwinCrestPower:
                        if (!atkUnit.isOneTimeActionActivatedForWeapon
                            && atkUnit.battleContext.restHpPercentage >= 25
                            && atkUnit.isTransformed
                            && atkUnit.isActionDone
                        ) {
                            this.writeLogLine(atkUnit.getNameWithGroup() + "は" + atkUnit.weaponInfo.name + "により再行動");
                            atkUnit.isActionDone = false;
                            atkUnit.isOneTimeActionActivatedForWeapon = true;
                        }
                        break;
                    case PassiveB.RagingStorm:
                    case PassiveB.RagingStorm2:
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
        }

        // 戦闘済みであるフラグの有効化
        {
            g_appData.isCombatOccuredInCurrentTurn = true;
        }

        // 戦闘に関係したユニットの紋章系のスキルを戦闘前の状態に戻す
        {
            this.damageCalc.updateUnitSpur(atkUnit);
            this.damageCalc.updateUnitSpur(defUnit);
            if (result.defUnit !== defUnit) {
                let saverUnit = result.defUnit;
                this.damageCalc.updateUnitSpur(saverUnit);
            }
        }

        // 再行動奥義
        if (atkUnit.specialCount === 0 &&
            !atkUnit.isOneTimeActionActivatedForSpecial &&
            atkUnit.isActionDone &&
            atkUnit.isAlive) {
            switch (atkUnit.special) {
                case Special.RequiemDance:
                    {
                        let highestHpUnits = [];
                        let highestHp = 0;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 2, false)) {
                            if (unit.isActionDone) {
                                if (unit.hp > highestHp) {
                                    highestHpUnits = [unit];
                                    highestHp = unit.hp;
                                } else if (unit.hp === highestHp) {
                                    highestHpUnits.push(unit);
                                }
                            }
                        }

                        if (highestHpUnits.length === 1) {
                            for (let unit of highestHpUnits) {
                                this.writeLogLine(`${atkUnit.getNameWithGroup()}が${atkUnit.specialInfo.name}を発動、対象は${unit.getNameWithGroup()}`);
                                atkUnit.isOneTimeActionActivatedForSpecial = true;
                                atkUnit.specialCount = atkUnit.maxSpecialCount;
                                unit.isActionDone = false;
                                // @TODO: 将来飛空城でダブルが使用できるようになった場合はダブル相手にもグラビティ付与
                                unit.addStatusEffect(StatusEffectType.Gravity);
                            }
                        }
                    }
                    break;
                case Special.NjorunsZeal2:
                case Special.NjorunsZeal:
                    this.__activateRefreshSpecial(atkUnit);
                    atkUnit.addStatusEffect(StatusEffectType.Gravity);
                    break;
                case Special.Galeforce:
                    this.__activateRefreshSpecial(atkUnit);
                    break;
            }
        }

        if (this.data.gameMode === GameMode.SummonerDuels) {
            this.data.globalBattleContext.addSummonerDuelsKoScore(atkUnit, defUnit);
        }

        // 再移動の評価
        let cantoActivated = this.__activateCantoIfPossible(atkUnit);
        if (!cantoActivated) {
            atkUnit.applyEndActionSkills();
        }

        // 追跡対象の更新
        for (let tile of tilesForUpdateChaseTargetTile) {
            this.__updateChaseTargetTilesForSpecifiedTile(tile);
        }

        // 罠は再行動奥義や再移動の後に評価する必要がある(停止罠で迅雷や再移動は無効化される)
        executeTrapIfPossible(atkUnit);

        // unit.endAction()のタイミングが戦闘後処理の前でなければいけないので、endUnitActionは直接呼べない
        this.__goToNextPhaseIfPossible(atkUnit.groupId);
    }

    __activateRefreshSpecial(atkUnit) {
        this.writeLogLine(atkUnit.getNameWithGroup() + "が" + atkUnit.specialInfo.name + "を発動");
        atkUnit.isOneTimeActionActivatedForSpecial = true;
        atkUnit.specialCount = atkUnit.maxSpecialCount;
        atkUnit.isActionDone = false;
    }

    /// 戦闘のダメージを計算します。
    calcDamage(
        atkUnit,
        defUnit,
        tileToAttack = null,
        damageType = DamageType.ActualDamage
    ) {
        this.damageCalc.clearLog();
        let result = this.damageCalc.calcDamage(atkUnit, defUnit, tileToAttack, damageType, this.data.gameMode);
        this.damageCalc.updateUnitSpur(atkUnit, false);
        this.damageCalc.updateUnitSpur(defUnit, false);
        return result;
    }
    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Tile} tileToAttack=null
     * @param  {number} damageType=DamageType.EstimatedDamage
     * @returns {DamageCalcResult}
     */
    calcDamageTemporary(
        atkUnit,
        defUnit,
        tileToAttack = null,
        damageType = DamageType.EstimatedDamage
    ) {
        this.damageCalc.clearLog();
        let result = this.damageCalc.calcDamageTemporary(atkUnit, defUnit, tileToAttack, damageType, this.data.gameMode);
        this.damageCalc.updateUnitSpur(atkUnit, false);
        this.damageCalc.updateUnitSpur(defUnit, false);
        if (result.defUnit !== defUnit) {
            let saverUnit = result.defUnit;
            this.damageCalc.updateUnitSpur(saverUnit, false);
        }
        return result;
    }

    __findNearestEnemies(targetUnit, distLimit = 100) {
        return g_appData.findNearestEnemies(targetUnit, distLimit);
    }

    __findNearestAllies(targetUnit, distLimit = 100) {
        return g_appData.findNearestAllies(targetUnit, distLimit);
    }

    __canDebuff2PointsOfDefOrRes(attackUnit, targetUnit) {
        let unit = new Unit("", "", UnitGroupType.Ally, 0);
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

    __applyMovementSkillAfterCombat(atkUnit, attackTargetUnit) {
        let isMoved = false;
        let executesTrap = false; // トラップは迅雷や再移動の発動後に評価する必要がある
        for (let skillId of atkUnit.enumerateSkills()) {
            let funcMap = applyMovementSkillAfterCombatFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    isMoved = func.call(this, atkUnit, attackTargetUnit, executesTrap);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
            switch (skillId) {
                case PassiveB.Repel4:
                case PassiveB.KaihiTatakikomi3:
                case PassiveB.Tatakikomi:
                    isMoved = this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterShove(unit, target, tile),
                        false, true, executesTrap);
                    break;
                case PassiveB.Kirikomi:
                    isMoved = this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterSwap(unit, target, tile),
                        false, true, executesTrap);
                    break;
                case PassiveB.Hikikomi:
                    isMoved = this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterDrawback(unit, target, tile),
                        false, true, executesTrap);
                    break;
                case PassiveB.KaihiIchigekiridatsu3:
                case PassiveB.CloseCall4:
                case PassiveB.Ichigekiridatsu:
                    isMoved = this.__applyMovementAssist(atkUnit, attackTargetUnit,
                        (unit, target, tile) => this.__findTileAfterDrawback(unit, target, tile),
                        false, false, executesTrap);
                    break;
            }
        }
        if (isMoved) {
            this.map.createTileSnapshots();
        }
    }

    __isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return g_appData.isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    get isOddTurn() {
        return g_appData.currentTurn % 2 === 1;
    }

    __isSolo(unit) {
        return !this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1).next().done;
    }

    enumerateUnitsWithinSpecifiedRange(posX, posY, unitGroup, rangeHorLength, rangeVerLength) {
        return g_appData.enumerateUnitsWithinSpecifiedRange(posX, posY, unitGroup, rangeHorLength, rangeVerLength);
    }

    enumerateUnitsWithinSpecifiedSpaces(posX, posY, unitGroup, spaces) {
        return g_appData.enumerateUnitsWithinSpecifiedSpaces(posX, posY, unitGroup, spaces);
    }

    enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        return g_appData.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces);
    }

    enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        return g_appData.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit);
    }

    enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit = false) {
        return g_appData.enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit);
    }
    enumerateUnitsInTheSameGroupOnMap(targetUnit, withTargetUnit = false) {
        return g_appData.enumerateUnitsInTheSameGroupOnMap(targetUnit, withTargetUnit);
    }
    enumerateUnitsInDifferentGroupOnMap(targetUnit) {
        return g_appData.enumerateUnitsInDifferentGroupOnMap(targetUnit);
    }
    enumerateUnitsInDifferentGroup(targetUnit) {
        return g_appData.enumerateUnitsInDifferentGroup(targetUnit);
    }
    /**
     * @returns {Unit[]}
     */
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
    /**
     * @param  {number} groupId
     * @returns {Unit[]}
     */
    enumerateUnitsInSpecifiedGroup(groupId) {
        return g_appData.enumerateUnitsInSpecifiedGroup(groupId);
    }
    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Tile} attackTile
     */
    showDamageCalcSummary(atkUnit, defUnit, attackTile) {
        atkUnit.createSnapshotIfNull();
        let result = this.calcDamageTemporary(atkUnit, defUnit, attackTile);
        this.setDamageCalcSummary(
            atkUnit,
            result.defUnit,
            this.__createDamageCalcSummaryHtml(
                atkUnit,
                result.defUnit,
                result.preCombatDamageWithOverkill,
                result.atkUnitDamageAfterBeginningOfCombat,
                result.atkUnit_normalAttackDamage, result.atkUnit_totalAttackCount,
                result.atkUnit_atk,
                result.atkUnit_spd,
                result.atkUnit_def,
                result.atkUnit_res,
                result.atkTile),
            this.__createDamageCalcSummaryHtml(
                result.defUnit,
                atkUnit,
                -1,
                result.defUnitDamageAfterBeginningOfCombat,
                result.defUnit_normalAttackDamage, result.defUnit_totalAttackCount,
                result.defUnit_atk,
                result.defUnit_spd,
                result.defUnit_def,
                result.defUnit_res,
                result.defTile));
    }

    clearDamageCalcSummary() {
        let defaultMessage = "ここにダメージを<br/>表示します";
        this.vm.attackerInfo = defaultMessage;
        this.vm.attackTargetInfo = defaultMessage;
        this.vm.attackerUnitIndex = -1;
        this.vm.attackTargetUnitIndex = -1;
        g_appData.__showStatusToAttackerInfo();
    }
    /**
     * @param  {Unit} unit
     * @param  {Unit} enemyUnit
     * @param  {Number} preCombatDamage
     * @param damageAfterBeginningOfCombat
     * @param  {Number} damage
     * @param  {Number} attackCount
     * @param  {Number} atk
     * @param  {Number} spd
     * @param  {Number} def
     * @param  {Number} res
     * @param tile
     */
    __createDamageCalcSummaryHtml(unit, enemyUnit,
        preCombatDamage, damageAfterBeginningOfCombat, damage, attackCount,
        atk, spd, def, res, tile) {
        // ダメージに関するサマリー
        let html = this.__createDamageSummaryHtml(unit, preCombatDamage, damageAfterBeginningOfCombat, damage, attackCount, tile);
        // ステータスやバフに関するサマリー
        html += this.__createStatusSummaryHtml(unit, atk, spd, def, res);

        return html;
    }

    __createDamageSummaryHtml(unit, preCombatDamage, damageAfterBeginningOfCombat, damage, attackCount, tile) {
        let divineHtml = "";
        if (tile.divineVein !== DivineVeinType.None) {
            let divineString = DivineVeinStrings[tile.divineVein];
            let color = divineVeinColor(tile.divineVeinGroup);
            divineHtml += `<span style='color:${color};font-weight: bold'>【</span>`;
            divineHtml += divineString;
            // TODO: 1ターンで終了しない天脈が実装されたら正しい数値を入れるようにする
            divineHtml += `<span style='color: #FFFFFF;background-color:${color};border-radius: 50%;'> ${1} </span> `;
            divineHtml += `<span style='color:${color};font-weight: bold;'>】</span>`;
        }
        // HPリザルト
        let restHpHtml = unit.restHp === 0 ?
            `<span style='color:#ffaaaa'>${unit.restHp}</span>` :
            unit.restHp;
        let html = `${divineHtml}HP: ${unit.hp} → ${restHpHtml}<br/>`;

        // 奥義カウント、ダメージ表示
        let specialHtml = `<span style="color: pink;">${unit.specialCount}</span>`;
        let damageHtml;
        if (attackCount > 0) {
            let precombatHtml = preCombatDamage > 0 ? `${preCombatDamage}+` : "";
            let afterBeginningOfCombatHtml = damageAfterBeginningOfCombat > 0 ? `${damageAfterBeginningOfCombat}+` : "";
            // 特効は緑表示にする
            let combatHtml = unit.battleContext.isEffectiveToOpponent ?
                `<span style='color:#00FF00'>${damage}</span>` :
                `${damage}`;
            if (attackCount > 1) {
                combatHtml += `×${attackCount}`;
            }
            damageHtml = `${precombatHtml}${afterBeginningOfCombatHtml}${combatHtml}`;
        } else {
            let afterBeginningOfCombatHtml = damageAfterBeginningOfCombat > 0 ? `${damageAfterBeginningOfCombat}+` : "";
            damageHtml = `${afterBeginningOfCombatHtml}ー`;
        }
        html += `奥${specialHtml}  攻撃: ${damageHtml}<br/>`;
        return html;
    }

    __createStatusSummaryHtml(unit, atk, spd, def, res) {
        let html = "";
        // 増加分、実際の戦闘中ステータス、紋章バフ表示
        let snapshot = unit.snapshot;
        let names = ['攻', '速', '防', '魔'];
        let actualStatuses = [atk, spd, def, res];
        let statusHtml = actualStatuses.map((v, i) => `${names[i]}${v}`).join(", ");
        if (snapshot != null) {
            // 増加分
            let displayStatuses = unit.getStatusesInPrecombat();
            let toIncHtml = (v, i) => `${names[i]}${getIncHtml(v - displayStatuses[i])}`;
            let incHtml = actualStatuses.map(toIncHtml).join(", ");
            html += `${incHtml}<br/>`;

            if (this.vm.isDebugMenuEnabled) {
                html += `<hr>`;
            }

            // 戦闘中ステータス
            html += `${statusHtml}<br/>`;

            // 紋章バフ
            let spurs = snapshot.getSpurs();
            let toSpurHtml = (v, i) => `${names[i]}${getIncHtml(v)}`;
            let spurHtml = spurs.map(toSpurHtml).join(", ");
            if (this.vm.isDebugMenuEnabled) {
                html += `${spurHtml}`;
            }
        } else {
            let zeroIncHtml = [0, 0, 0, 0].map((v, i) => `${names[i]}${v}`).join(", ");
            html += zeroIncHtml + '<br/>';
            if (this.vm.isDebugMenuEnabled) {
                html += `<hr>`;
            }
            html += `${statusHtml}<br/>`;
            if (this.vm.isDebugMenuEnabled) {
                html += zeroIncHtml;
            }
        }
        return html;
    }

    __isNear(unitA, unitB, nearRange) {
        return unitA.isWithinSpecifiedDistanceFrom(unitB, nearRange);
    }

    __isInCross(unitA, unitB) {
        return unitB.isInCrossOf(unitA);
    }

    // 自身を中心とした縦〇列と横〇列
    __isInCrossWithOffset(unitA, unitB, offset) {
        return unitB.isInCrossWithOffset(unitA, offset);
    }

    updateCurrentUnitSpur() {
        this.damageCalc.updateUnitSpur(this.currentUnit);
    }

    updateAllUnitSpur(calcPotentialDamage = false) {
        this.damageCalc.updateAllUnitSpur(calcPotentialDamage);
    }
    updateSpurForSpecifiedGroupUnits(groupId, calcPotentialDamage = false) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (!unit.isOnMap) {
                continue;
            }
            this.damageCalc.updateUnitSpur(unit, calcPotentialDamage);
        }
    }

    /**
     * ターン開始時スキルを発動。
     * @param  {Unit[]} targetUnits - ターン開始処理を行うユニット
     * @param  {Unit[]} enemyTurnSkillTargetUnits - 敵軍ターン開始時スキル対象ユニット
     */
    __applySkillsForBeginningOfTurn(targetUnits, enemyTurnSkillTargetUnits) {
        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.resetOneTimeActionActivationStates();

            // 評価用のスナップショットを作成
            unit.createSnapshot();
        }

        this.__initReservedStateForAllUnitsOnMap();

        this.executeStructuresByUnitGroupType(targetUnits[0].groupId, false);
        this.applyTileEffect();

        // ターン開始時スキル(通常)
        for (let unit of targetUnits) {
            this.writeDebugLogLine(unit.getNameWithGroup() + "のターン開始時発動スキルを適用..");
            this.beginningOfTurnSkillHandler.applySkillsForBeginningOfTurn(unit);
        }
        // ターン開始時スキル(敵ユニット)
        for (let unit of enemyTurnSkillTargetUnits) {
            this.writeDebugLogLine(unit.getNameWithGroup() + "の敵ターン開始時発動スキルを適用..");
            this.beginningOfTurnSkillHandler.applyEnemySkillsForBeginningOfTurn(unit);
        }
        // ターン開始時効果(通常)による効果を反映
        this.beginningOfTurnSkillHandler.applyReservedStateForAllUnitsOnMap();

        // ターン開始時スキル(回復・ダメージ)
        for (let unit of targetUnits) {
            this.writeDebugLogLine(unit.getNameWithGroup() + "のターン開始時発動HPスキルを適用..");
            this.beginningOfTurnSkillHandler.applyHpSkillsForBeginningOfTurn(unit);
        }
        // ターン開始時効果によるダメージや回復を反映
        this.beginningOfTurnSkillHandler.applyReservedHpForAllUnitsOnMap(true);

        this.writeLog(this.beginningOfTurnSkillHandler.log);

        for (let unit of targetUnits) {
            unit.deleteSnapshot();
        }

        // 化身によりステータス変化する
        this.data.__updateStatusBySkillsAndMergeForAllHeroes();

        // セイズなど敵軍のターン開始時スキル発動後の効果
        for (let unit of enemyTurnSkillTargetUnits) {
            this.writeDebugLogLine(unit.getNameWithGroup() + "の敵軍のターン開始時スキル発動後のスキルを適用..");
            this.beginningOfTurnSkillHandler.applyAfterEnemySkillsSkillsForBeginningOfTurn(unit);
        }

        // ターン開始時スキル発動後
        // ex) 伝承ユーリスCスキル: ターン開始時スキル発動後、自分に【空転】が付与されている時、「自身の移動+1」を解除
        for (let unit of targetUnits) {
            this.writeDebugLogLine(unit.getNameWithGroup() + "の開始時スキル発動後のスキルを適用..");
            this.beginningOfTurnSkillHandler.applySkillsAfterBeginningOfTurn(unit);
        }

        // マップの更新(ターン開始時の移動マスの変化をマップに反映)
        this.data.map.updateTiles();
    }

    /**
     * ターン開始時のシミュレーション。
     * @param  {Unit[]} targetUnits - ターン開始処理を行うユニット
     * @param  {Unit[]} enemyTurnSkillTargetUnits - 敵軍ターン開始時スキル対象ユニット
     * @param  {UnitGroupType} group - グループ。どちらのターン開始時かを渡す。決闘の場合は引数を指定しない。
     */
    __simulateBeginningOfTurn(targetUnits, enemyTurnSkillTargetUnits, group = null) {
        g_appData.isCombatOccuredInCurrentTurn = false;

        if (targetUnits.length === 0) {
            return;
        }

        let enemyUnitsAgainstTarget = Array.from(this.enumerateUnitsInDifferentGroupOnMap(targetUnits[0]));

        this.__initializeUnitsPerTurn(targetUnits);
        this.__initializeAllUnitsOnMapPerTurn(this.enumerateAllyUnitsOnMap());
        this.__initializeTilesPerTurn(this.map._tiles, group);

        if (this.data.gameMode !== GameMode.SummonerDuels) {
            for (let unit of enemyUnitsAgainstTarget) {
                // TODO: 正しい挙動か確認する
                unit.endAction();
                unit.deactivateCanto();
                // ターン >= 2としないと戦闘開始を押した瞬間に敵の天脈が発動してしまう
                if (group === UnitGroupType.Ally && g_appData.currentTurn >= 2) {
                    // 拡張枠のユニットは天脈を発動しない
                    if (unit !== g_appData.getEnemyExpansionUnitOnMap() &&
                        !g_appData.isEnemyActionTriggered) {
                        unit.applyEndActionSkills();
                    }
                }
            }
        }

        this.__applySkillsForBeginningOfTurn(targetUnits, enemyTurnSkillTargetUnits);

        if (this.data.gameMode === GameMode.SummonerDuels) {
            this.data.globalBattleContext.initializeSummonerDuelsTurnContext(
                this.__getCaptainSkill(UnitGroupType.Ally),
                this.__getCaptainSkill(UnitGroupType.Enemy)
            );

            // 英雄決闘のAIはいらない気がするけど、一応残しておく
            let allyUnits = Array.from(this.enumerateAllyUnitsOnMap());
            let enemyUnits = Array.from(this.enumerateEnemyUnitsOnMap());
            this.__initializeAiContextPerTurn(allyUnits, enemyUnits);
            this.__initializeAiContextPerTurn(enemyUnits, allyUnits);
        }
        else {
            this.__initializeAiContextPerTurn(targetUnits, enemyUnitsAgainstTarget);
        }
    }
    __getCaptainSkill(groupId) {
        let captainUnit = this.__getCaptainUnitOnMap(groupId);
        if (captainUnit == null) {
            // マップ上にいない場合は無効
            return Captain.None;
        }
        return captainUnit.getCaptainSkill();
    }

    __getCaptainUnitOnMap(groupId) {
        for (let x of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (x.isOnMap && x.isCaptain) {
                return x;
            }
        }
        return null;
    }

    /**
     * @param  {Unit[]} targetUnits
     */
    __initializeUnitsPerTurn(targetUnits) {
        for (let unit of targetUnits) {
            unit.endAction();
            unit.deactivateCanto();
            unit.beginAction();
            // console.log(unit.getNameWithGroup() + ": moveCount=" + unit.moveCount);

            // 比翼や双界スキル発動カウントリセット
            this.#resetDuoOrHarmonizedSkill(unit);

            // "「その後」以降の効果は、その効果が発動後3ターンの間発動しない"処理
            if (unit.restSupportSkillAvailableTurn >= 1) {
                unit.restSupportSkillAvailableTurn--;
            }
            if (unit.restPassiveBSkillAvailableTurn >= 1) {
                unit.restPassiveBSkillAvailableTurn--;
            }
        }
    }

    #resetDuoOrHarmonizedSkill(unit) {
        unit.isDuoOrHarmonicSkillActivatedInThisTurn = false;
        if (unit.heroIndex === Hero.YoungPalla ||
            unit.heroIndex === Hero.DuoSigurd ||
            unit.heroIndex === Hero.DuoEirika ||
            unit.heroIndex === Hero.DuoSothis ||
            unit.heroIndex === Hero.DuoYmir) {
            if (this.isOddTurn) {
                unit.duoOrHarmonizedSkillActivationCount = 0;
            }
        } else if (unit.heroIndex === Hero.SummerMia ||
            unit.heroIndex === Hero.SummerByleth ||
            unit.heroIndex === Hero.PirateVeronica ||
            unit.heroIndex === Hero.DuoHilda ||
            unit.heroIndex === Hero.DuoNina ||
            unit.heroIndex === Hero.DuoAskr ||
            unit.heroIndex === Hero.HarmonizedTiki ||
            unit.heroIndex === Hero.DuoKagero) {
            if (this.data.currentTurn % 3 === 1) {
                unit.duoOrHarmonizedSkillActivationCount = 0;
            }
        }
    }

    __initializeAllUnitsOnMapPerTurn(units) {
        for (let unit of units) {
            unit.isCombatDone = false;
            unit.isSupportDone = false;
        }
    }

    __initializeTilesPerTurn(tiles, group) {
        for (let y = 0; y < this.map.height; ++y) {
            for (let x = 0; x < this.map.width; ++x) {
                let index = y * this.map.width + x;
                let tile = tiles[index];
                if (tile.divineVeinGroup === group || group === null) {
                    tile.divineVein = DivineVeinType.None;
                    tile.divineVeinGroup = null;
                }
            }
        }
    }

    /**
     * @param  {Unit[]} targetUnits
     * @param  {Unit[]} enemyUnits
     */
    __initializeAiContextPerTurn(targetUnits, enemyUnits) {
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
        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.moveCountAtBeginningOfTurn = unit.moveCount;
        }

        // 安全柵の効果が発動する場合でも、敵の移動をトリガーするかどうかの判定が行われている
        this.__prepareActionContextForAssist(targetUnits, enemyUnits, true);
    }

    __getOnMapEnemyUnitList() {
        return Array.from(this.enumerateEnemyUnitsOnMap());
    }
    __getOnMapAllyUnitList() {
        return Array.from(this.enumerateAllyUnitsOnMap());
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

    __calcAssistPriorityForPostCombat(unit) {
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
        if (unit.weaponType === WeaponType.Staff ||
            unit.support === Support.Sacrifice ||
            unit.support === Support.MaidensSolace) {
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
        if (g_appData.currentTurn === this.vm.maxTurn) {
            return;
        }

        let self = this;
        this.__enqueueCommand("敵ターン開始", function () {
            self.vm.globalBattleContext.currentPhaseType = UnitGroupType.Enemy;
            self.audioManager.playSoundEffect(SoundEffectId.EnemyPhase);
            self.__simulateBeginningOfTurn(self.__getOnMapEnemyUnitList(), self.__getOnMapAllyUnitList(), UnitGroupType.Enemy);

            // 安全柵の実行(他の施設と実行タイミングが異なるので、別途処理している)
            let safetyFence = self.__findSafetyFence();
            if (safetyFence != null && Number(g_appData.currentTurn) <= Number(safetyFence.level)) {
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
                if (self.countEnemyUnitsOnMap() === g_appData.enemyUnits.length) {
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
        if (g_appData.currentTurn === this.vm.maxTurn) {
            return;
        }
        let self = this;
        this.__enqueueCommand("自ターン開始", function () {
            self.vm.globalBattleContext.currentPhaseType = UnitGroupType.Ally;
            ++g_appData.globalBattleContext.currentTurn;
            if (g_appData.currentTurn === 1) {
                // 戦闘開始
                self.vm.isEnemyActionTriggered = false;
                for (let unit of g_appData.units) {
                    unit.resetAllState();
                }
                // タイルの天脈をリセットする
                for (let tile of g_appData.map.enumerateTiles()) {
                    tile.divineVein = DivineVeinType.None;
                    tile.divineVeinGroup = null;
                }
                g_appData.resonantBattleItems = [];
            }
            self.audioManager.playSoundEffect(SoundEffectId.PlayerPhase);
            self.__simulateBeginningOfTurn(self.__getOnMapAllyUnitList(), self.__getOnMapEnemyUnitList(), UnitGroupType.Ally);
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
        return g_appData.countUnitInSpecifiedGroupOnMap(groupId, predicateFunc);
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
    /**
     * @returns {BattleMap}
     */
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
        if (units.length === 0) {
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
        let currentTurn = g_appData.currentTurn;
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
                g_appData.globalBattleContext.currentTurn = currentTurn;
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
            let context = {};
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
        let tableHtml = "<!--suppress HtmlDeprecatedAttribute --><table border='1'>";
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

        /** @type {HeroInfo[]} */
        let loseEnemies = result.loseEnemies;
        /** @type {HeroInfo[]} */
        let drawEnemies = result.drawEnemies;
        /** @type {HeroInfo[]} */
        let winEnemies = result.winEnemies;

        this.clearDurabilityTestLog();
        this.writeDurabilityTestLogLine(`勝利 ${winCount}/${totalCount}(${(winCount / totalCount * 100).toFixed(2)}%)`);
        this.writeDurabilityTestLogLine(`引き分け ${drawCount}/${totalCount}(${(drawCount / totalCount * 100).toFixed(2)}%)`);
        this.writeDurabilityTestLogLine(`敗北 ${loseCount}/${totalCount}(${(loseCount / totalCount * 100).toFixed(2)}%)`);
        this.writeDurabilityTestLogLine(`勝率: ${this.__calcDurabilityScoreAsString(winCount, drawCount, loseCount, 0)}%`);
        this.writeDurabilityTestLogLine(`生存率: ${this.__calcDurabilityScoreAsString(winCount, drawCount, loseCount, 2)}%`);
        this.writeDurabilityTestLogLine(`戦闘結果スコア: ${this.__calcDurabilityScoreAsString(winCount, drawCount, loseCount, 1)} / 100`);

        const iconSize = 40;

        loseEnemies.sort((a, b) => getWeaponTypeOrder(a.weaponTypeValue) - getWeaponTypeOrder(b.weaponTypeValue));
        drawEnemies.sort((a, b) => getWeaponTypeOrder(a.weaponTypeValue) - getWeaponTypeOrder(b.weaponTypeValue));
        winEnemies.sort((a, b) => getWeaponTypeOrder(a.weaponTypeValue) - getWeaponTypeOrder(b.weaponTypeValue));

        this.writeDurabilityTestLog("<details>");
        this.writeDurabilityTestLog("<summary>敗北した相手</summary>");
        this.writeDurabilityTestLog(loseEnemies.map(x => x.getIconImgTagWithAnchor(iconSize)).join(""));
        this.writeDurabilityTestLog("</details>");
        this.writeDurabilityTestLog("<details>");
        this.writeDurabilityTestLog("<summary>引き分けの相手</summary>");
        this.writeDurabilityTestLog(drawEnemies.map(x => x.getIconImgTagWithAnchor(iconSize)).join(""));
        this.writeDurabilityTestLog("</details>");
        this.writeDurabilityTestLog("<details>");
        this.writeDurabilityTestLog("<summary>勝利した相手</summary>");
        this.writeDurabilityTestLog(winEnemies.map(x => x.getIconImgTagWithAnchor(iconSize)).join(""));
        this.writeDurabilityTestLog("</details>");

        updateAllUi();
    }
    /**
     * @param  {Unit} targetUnit
     * @param  {HeroInfo} heroInfo
     * @param  {Unit} enemyUnit
     * @param  {Boolean} equipsAllDistCounterIfImpossible=false
     * @param  {Number} reducedSpecialCount=0
     * @param  {number} overrideDragonflower
     */
    __durabilityTest_initUnit(
        targetUnit, heroInfo, enemyUnit, equipsAllDistCounterIfImpossible = false, reducedSpecialCount = 0, overrideDragonflower = -1
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
            if (overrideDragonflower >= 0) {
                targetUnit.setDragonflower(overrideDragonflower);
            }

            targetUnit.setMoveCountFromMoveType();
            targetUnit.isResplendent = targetUnit.heroInfo.isResplendent;
            targetUnit.weaponRefinement = WeaponRefinementType.Special;
            if (targetUnit.special === Special.None) {
                targetUnit.special = this.vm.durabilityTestDefaultSpecial;
            }

            g_appData.__updateUnitSkillInfo(targetUnit);
            let weaponRefinement = WeaponRefinementType.Special;
            if (targetUnit.weaponInfo != null
                && targetUnit.weaponInfo.specialRefineHpAdd === 3
            ) {
                weaponRefinement = WeaponRefinementType.Special_Hp3;
            }
            targetUnit.weaponRefinement = weaponRefinement;

            if (equipsAllDistCounterIfImpossible) {
                // 全距離反撃できない場合に遠距離反撃、近距離反撃を装備する
                if (targetUnit.attackRange !== enemyUnit.attackRange
                    && !targetUnit.canCounterAttackToAllDistance()
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

        g_appData.__updateStatusBySkillsAndMerges(targetUnit, true);
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

        this.__initReservedStateForAllUnitsOnMap();

        // ターン開始スキル(通常)
        this.beginningOfTurnSkillHandler.applySkillsForBeginningOfTurn(targetUnit);
        // ターン開始時効果(通常)による効果を反映
        this.beginningOfTurnSkillHandler.applyReservedStateForAllUnitsOnMap();

        // ターン開始スキル(回復・ダメージ等)
        this.beginningOfTurnSkillHandler.applyHpSkillsForBeginningOfTurn(targetUnit);
        // ターン開始時効果によるダメージや回復を反映
        this.beginningOfTurnSkillHandler.applyReservedHpForAllUnitsOnMap(true);

        this.disableAllLogs = originalDisableAllLogs;
    }
    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     */
    __durabilityTest_simulateImpl(targetUnit, enemyUnit) {
        let winCount = 0;
        let drawCount = 0;
        let loseCount = 0;
        let grantedBlessing = enemyUnit.grantedBlessing;
        const originalHp = targetUnit.hp;
        const originalSpecialCount = targetUnit.specialCount;
        const originalEnemyHp = enemyUnit.hp;
        const originalEnemySpecialCount = enemyUnit.specialCount;
        const originalEnemyDragonflower = enemyUnit.dragonflower;
        /** @type {SkillInfo} */
        const originalEnemySacredSealInfo = enemyUnit.passiveSInfo;
        let reducedEnemySpecialCount = enemyUnit.maxSpecialCount - enemyUnit.specialCount;
        let targetUnitStatusEffects = targetUnit.statusEffects;
        let enemyUnitStatusEffects = enemyUnit.statusEffects;

        let loseEnemies = [];
        let drawEnemies = [];
        let winEnemies = [];
        let elapsedMillisecToApplySkillsForBeginningOfTurn = 0;
        let elapsedMillisecForCombat = 0;
        let elapsedMillisecForInitUnit = 0;
        const heroInfos = Array.from(this.data.heroInfos.data.filter(x => x.bookVersion > 0));
        const length = heroInfos.length;
        for (let i = 0; i < length; ++i) {
            let heroInfo = heroInfos[i];

            // 敵の初期化
            using_(new ScopedStopwatch(time => elapsedMillisecForInitUnit += time), () => {
                if (originalEnemySacredSealInfo != null && enemyUnit.canEquip(originalEnemySacredSealInfo)) {
                    enemyUnit.passiveS = originalEnemySacredSealInfo.id;
                }
                else {
                    enemyUnit.passiveS = PassiveS.None;
                }

                this.__durabilityTest_initUnit(
                    enemyUnit, heroInfo, targetUnit, g_appData.durabilityTestEquipAllDistCounter, reducedEnemySpecialCount, originalEnemyDragonflower);
                this.damageCalc.updateUnitSpur(targetUnit, this.vm.durabilityTestCalcPotentialDamage);
                this.damageCalc.updateUnitSpur(enemyUnit, this.vm.durabilityTestCalcPotentialDamage);

                if (this.vm.durabilityTestChargesSpecialCount) {
                    enemyUnit.specialCount = 0;
                }


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
                using_(new ScopedStopwatch(time => elapsedMillisecToApplySkillsForBeginningOfTurn += time), () => {
                    this.__forceToApplySkillsForBeginningOfTurn(targetUnit);
                    this.__forceToApplySkillsForBeginningOfTurn(enemyUnit);

                    // 元々設定していた状態は維持して評価する
                    targetUnit.addStatusEffects(targetUnitStatusEffects);
                    enemyUnit.addStatusEffects(enemyUnitStatusEffects);
                });
            }

            let tmpWinCount = 0;
            let attackerUnit = this.vm.durabilityTestIsAllyUnitOffence ? targetUnit : enemyUnit;
            let defenceUnit = this.vm.durabilityTestIsAllyUnitOffence ? enemyUnit : targetUnit;

            let log = `${attackerUnit.getNameWithGroup()}の状態変化: ${attackerUnit.statusEffectsToDisplayString()}<br/>`;
            log += `${defenceUnit.getNameWithGroup()}の状態変化: ${defenceUnit.statusEffectsToDisplayString()}<br/>`;

            using_(new ScopedStopwatch(time => elapsedMillisecForCombat += time), () => {
                for (let i = 0; i < this.vm.durabilityTestBattleCount; ++i) {
                    let damageType = this.vm.durabilityTestCalcPotentialDamage ?
                        DamageType.PotentialDamage : DamageType.ActualDamage;
                    this.calcDamageTemporary(attackerUnit, defenceUnit, null, damageType);
                    targetUnit.hp = targetUnit.restHp;
                    targetUnit.specialCount = targetUnit.tmpSpecialCount;
                    if (enemyUnit.restHp === 0) {
                        ++tmpWinCount;
                    }
                }
            });

            let combatResultText = "";
            if (targetUnit.restHp === 0) {
                combatResultText = "敗北";
                ++loseCount;
                loseEnemies.push(heroInfo);

                if (this.vm.durabilityTestIsLogEnabled && this.vm.durabilityTestLogDamageCalcDetailIfLose) {
                    this.writeLogLine(log + this.damageCalc.log);
                }
            }
            else if (tmpWinCount === this.vm.durabilityTestBattleCount) {
                combatResultText = "勝利";
                ++winCount;
                winEnemies.push(heroInfo);
            }
            else {
                combatResultText = "引き分け";
                ++drawCount;
                drawEnemies.push(heroInfo);
                if (this.vm.durabilityTestIsLogEnabled && this.vm.durabilityTestLogDamageCalcDetailIfLose) {
                    // this.writeLogLine(log + this.damageCalc.log);
                }
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
        if (originalEnemySacredSealInfo != null) {
            enemyUnit.passiveS = originalEnemySacredSealInfo.id;
            enemyUnit.passiveSInfo = originalEnemySacredSealInfo;
        }

        let result = {};
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
            if (unit.id === g_appData.durabilityTestAllyUnitId
                || unit.id === g_appData.durabilityTestEnemyUnitId
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
        percentageScoreText = percentageScoreText.slice(0, 4);
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
        let currentTurn = g_appData.currentTurn;
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
                g_appData.globalBattleContext.currentTurn = currentTurn;
                importPerTurnSetting(self.tempSerializedTurn);
                $("#progress").progressbar({ disabled: true });
                updateAllUi();
            });
    }

    simulateEnemiesForCurrentTurn() {
        this.tempSerializedTurn = exportPerTurnSettingAsString();

        let currentTurn = g_appData.currentTurn;
        if (g_appData.globalBattleContext.currentPhaseType === UnitGroupType.Ally) {
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

        g_appData.currentTurn = currentTurn;
        importPerTurnSetting(this.tempSerializedTurn);
        if (g_appData.globalBattleContext.currentPhaseType === UnitGroupType.Ally) {
            this.simulateBeginningOfEnemyTurn();
        }

        this.__executeAllCommands(this.commandQueue, 100);
    }

    simulateEnemyTurn(currentUnit, tile, currentTurn, origAliveAllyCount) {
        tile.resetOverriddenCell();
        g_appData.currentTurn = currentTurn;
        importPerTurnSetting(this.tempSerializedTurn);
        if (g_appData.globalBattleContext.currentPhaseType === UnitGroupType.Ally) {
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
        if (aliveAllyCount === origAliveAllyCount) {
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
        if (g_appData.globalBattleContext.currentPhaseType === enemyGroup) {
            return false;
        }

        let actionableUnits = this.__getActionableUnits(targetGroup);
        let allyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId === targetGroup);
        let enemyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId === enemyGroup);
        let assistTargetableUnits = this.__getUnits(unit =>
            unit.isOnMap
            && !unit.hasStatusEffect(StatusEffectType.Isolation)
            && unit.groupId === targetGroup);
        let assistableUnits = this.__getUnits(unit =>
            unit.groupId === targetGroup
            && unit.isOnMap
            && !unit.isActionDone
            && unit.support !== Support.None
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
        if (this.simulatePostCombatAssist(assistableUnits, assistTargetableUnits, enemyUnits)) {
            return false;
        }

        this.writeLogLine("■移動の計算------------");
        // noinspection RedundantIfStatementJS
        if (this.simulateMovement(actionableUnits, enemyUnits, allyUnits)) {
            return false;
        }

        return true;
    }

    __simulateAllyAction() {
        let targetGroup = UnitGroupType.Ally;
        let enemyGroup = UnitGroupType.Enemy;
        if (g_appData.globalBattleContext.currentPhaseType === enemyGroup) {
            return false;
        }

        let actionableUnits = this.__getActionableUnits(targetGroup);
        let allyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId === targetGroup);
        let enemyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId === enemyGroup);
        let assistTargetableUnits = this.__getUnits(unit =>
            unit.isOnMap
            && !unit.hasStatusEffect(StatusEffectType.Isolation)
            && unit.groupId === targetGroup);
        let assistableUnits = this.__getUnits(unit =>
            unit.groupId === targetGroup
            && unit.isOnMap
            && !unit.isActionDone
            && unit.support !== Support.None
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
        if (this.simulatePostCombatAssist(assistableUnits, assistTargetableUnits, enemyUnits)) {
            return false;
        }

        this.writeLogLine("■移動の計算------------");
        // noinspection RedundantIfStatementJS
        if (this.simulateMovement(actionableUnits, enemyUnits, allyUnits)) {
            return false;
        }

        return true;
    }

    __simulateEnemyAction() {
        let targetGroup = UnitGroupType.Enemy;
        let enemyGroup = UnitGroupType.Ally;
        if (g_appData.globalBattleContext.currentPhaseType === enemyGroup) {
            return false;
        }

        let actionableUnits = this.__getActionableUnits(targetGroup);
        let allyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId === targetGroup);
        let enemyUnits = this.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId === enemyGroup);
        let assistTargetableUnits = this.__getUnits(unit =>
            unit.isOnMap
            && !unit.hasStatusEffect(StatusEffectType.Isolation)
            && unit.groupId === targetGroup);
        let assistableUnits = this.__getUnits(unit =>
            unit.groupId === targetGroup
            && unit.isOnMap
            && !unit.isActionDone
            && unit.support !== Support.None
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
        if (this.simulatePostCombatAssist(assistableUnits, assistTargetableUnits, enemyUnits)) {
            return false;
        }

        let triggeredActionableUnits = [];
        for (let unit of actionableUnits) {
            if (g_appData.examinesEnemyActionTriggered(unit)) {
                triggeredActionableUnits.push(unit);
            }
        }

        this.writeLogLine("■移動の計算------------");
        // noinspection RedundantIfStatementJS
        if (this.simulateMovement(triggeredActionableUnits, enemyUnits, allyUnits)) {
            return false;
        }

        return true;
    }

    simulatePostCombatAssist(assistEnemyUnits, enemyUnits, allyUnits) {
        // コンテキスト初期化
        this.__prepareActionContextForAssist(enemyUnits, allyUnits, false);
        for (let unit of assistEnemyUnits) {
            if (unit.hasWeapon && unit.isMeleeWeaponType()) {
                unit.actionContext.isBlocker = true;
            }
        }

        // 補助優先度を計算
        for (let unit of assistEnemyUnits) {
            unit.actionContext.assistPriority = this.__calcAssistPriorityForPostCombat(unit);
        }

        assistEnemyUnits.sort(function (a, b) {
            return b.actionContext.assistPriority - a.actionContext.assistPriority;
        });

        let slotOrderDependentIndices = this.__getSlotOrderDependentIndices(assistEnemyUnits, x => x.actionContext.assistPriority);

        let isActionActivated = false;
        for (let i = 0; i < assistEnemyUnits.length; ++i) {
            let assistUnit = assistEnemyUnits[i];
            this.writeLogLine(assistUnit.getNameWithGroup() + "の補助資格を評価-----");
            if (!this.__canActivatePostCombatAssist(assistUnit, allyUnits)) {
                this.writeLogLine(assistUnit.getNameWithGroup() + "は補助資格なし");
                continue;
            }

            // 補助を実行可能な味方を取得
            this.__setBestTargetAndTiles(assistUnit, false, (targetUnit, tile) => this.__canBeActivatedPostCombatAssist(assistUnit, targetUnit, tile));
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
                    if (!allyUnit.hasWeapon || allyUnit.attackRange !== 1) {
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
                let bodyBlockTile = this.__selectBestTileToAssistFromTiles(blockableTiles, assistUnit);
                this.__enqueueMoveCommand(assistUnit, bodyBlockTile, true);
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
        unit.distanceFromClosestEnemy = unit.placedTile.calculateDistanceToClosestEnemyTile(unit);
    }

    /**
     * @param {Unit[]|Generator<Unit>} allyUnits
     * @param {Unit[]|Generator<Unit>} enemyUnits
     * @param {boolean} triggersAction
     */
    __prepareActionContextForAssist(allyUnits, enemyUnits, triggersAction = true) {
        using_(new ScopedStopwatch(time => this.writeDebugLogLine("行動計算コンテキストの初期化: " + time + " ms")), () => {
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

                if (triggersAction && unit.groupId === UnitGroupType.Enemy) {
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
                && tile.placedUnit.groupId !== unit.groupId
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
            let assistableUnit = assistableUnits[i];
            this.writeDebugLogLine(assistableUnit.getNameWithGroup() + "の補助資格を評価");
            if (!this.__canActivatePrecombatAssist(assistableUnit, allyUnits)) {
                this.writeDebugLogLine(assistableUnit.getNameWithGroup() + "は補助資格なし");
                continue;
            }

            this.__setBestTargetAndTiles(assistableUnit, true, (targetUnit, tile) => this.__canBeActivatedPrecombatAssist(assistableUnit, targetUnit, tile));
            if (assistableUnit.actionContext.bestTargetToAssist == null) {
                this.writeDebugLogLine(assistableUnit.getNameWithGroup() + "の補助可能な味方がいない");
                continue;
            }

            if (slotOrderDependentIndices.includes(i)) {
                this.writeWarningLine(`${assistableUnit.getNameWithGroup()}の補助行動順はスロット順で変わる可能性があります。`);
            }

            let bestTargetToAssist = assistableUnit.actionContext.bestTargetToAssist;
            let bestTileToAssist = assistableUnit.actionContext.bestTileToAssist;

            this.__enqueueSupportCommand(assistableUnit, bestTileToAssist, bestTargetToAssist);
            isActionActivated = true;
            break;
        }

        return isActionActivated;
    }

    __examinesIsUnitThreatenedByEnemy(unit, enemyUnits) {
        if (unit.groupId === UnitGroupType.Enemy) {
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
        return unit.actionContext.attackableUnitInfos.length > 0;
    }

    /**
     * @param  {Unit} unit
     * @param  {Unit[]} enemyUnits
     * @param  {boolean} ignores5DamageDealt=false
     * @param  {boolean} evaluatesAfflictorDraw=false
     * @return {boolean}
     */
    __evaluateIs5DamageDealtOrWin(
        unit, enemyUnits, ignores5DamageDealt = false,
        evaluatesAfflictorDraw = false
    ) {
        this.__setAttackableUnitInfoAndBestTileToAttack(unit, enemyUnits);
        if (unit.actionContext.attackableUnitInfos.length > 0) {
            // 攻撃範囲に敵がいる
            for (let attackableUnitInfo of unit.actionContext.attackableUnitInfos) {
                let tile = attackableUnitInfo.bestTileToAttack;
                this.__updateCombatResultOfAttackableTargetInfo(attackableUnitInfo, unit, tile);
                let combatResult = attackableUnitInfo.combatResultDetails[tile.id];
                let result = attackableUnitInfo.combatResults[tile.id];
                if (result === CombatResult.Win) {
                    this.writeDebugLogLine(unit.getNameWithGroup() + "は戦闘に勝利するので補助資格なし");
                    return true;
                }

                if (!ignores5DamageDealt) {
                    // 2回攻撃は1回分だけ加味
                    let attackCount = combatResult.atkUnit_totalAttackCount / unit.weaponInfo.attackCount;
                    let damageDealt = combatResult.atkUnit_normalAttackDamage * attackCount;
                    this.writeDebugLogLine(unit.getNameWithGroup() + "から" + attackableUnitInfo.targetUnit.getNameWithGroup() + "へのダメージ=" + damageDealt);
                    if (damageDealt >= 5) {
                        // if (unit.support === Support.MagicShieldPlus) {
                        //     return false;
                        // }
                        this.writeDebugLogLine(unit.getNameWithGroup() + "は5ダメージ以上与えられるので補助資格なし");
                        return true;
                    }
                }

                if (evaluatesAfflictorDraw) {
                    if (isAfflictor(unit, result === CombatResult.Loss, result) &&
                        result === CombatResult.Draw) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * @param {Unit} assistUnit
     * @param {Unit} targetUnit
     * @param {Tile} tile
     */
    __canBeActivatedPrecombatAssist(assistUnit, targetUnit, tile) {
        // 補助を実行可能な味方を取得
        // TODO: 検証する。
        let assistType = determineAssistType(assistUnit, targetUnit);
        let skillId = assistUnit.support;
        switch (assistType) {
            case AssistType.Refresh:
                return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
            case AssistType.Rally:
                // todo: ちゃんと実装する
                return !targetUnit.isActionDone
                    && targetUnit.actionContext.hasThreatensEnemyStatus
                    && assistUnit.canRallyTo(targetUnit, 2);
            case AssistType.Heal:
                if (skillId === Support.Sacrifice ||
                    skillId === Support.MaidensSolace) {
                    let assisterEnemyThreat = assistUnit.placedTile.getEnemyThreatFor(assistUnit.groupId);
                    let targetEnemyThreat = targetUnit.placedTile.getEnemyThreatFor(targetUnit.groupId);
                    if (assisterEnemyThreat > targetEnemyThreat) {
                        return false;
                    }
                }
                return (targetUnit.canHeal(getPrecombatHealThreshold(skillId)));
            case AssistType.Restore:
                return targetUnit.hasNegativeStatusEffect()
                    || (targetUnit.canHeal(getPrecombatHealThreshold(skillId)));
            case AssistType.DonorHeal:
                {
                    if (targetUnit.hasStatusEffect(StatusEffectType.DeepWounds)
                    ) {
                        return false;
                    }

                    let assisterEnemyThreat = assistUnit.placedTile.getEnemyThreatFor(assistUnit.groupId);
                    let targetEnemyThreat = targetUnit.placedTile.getEnemyThreatFor(targetUnit.groupId);
                    if (assisterEnemyThreat > targetEnemyThreat) {
                        return false;
                    }

                    let result = this.__getUserLossHpAndTargetHealHpForDonorHeal(assistUnit, targetUnit);
                    if (!result.success || result.targetHealHp < result.userLossHp) {
                        return false;
                    }

                    switch (skillId) {
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
                this.writeErrorLine("戦闘前補助が未実装のスキル: " + assistUnit.supportInfo.name);
                return false;
        }
    }

    __canBeActivatedPostCombatMovementAssist(unit, targetUnit, tile) {
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

    __canBeActivatedPostCombatAssist(unit, targetUnit, tile) {
        let assistType = determineAssistType(unit, targetUnit);
        switch (assistType) {
            case AssistType.Refresh:
                return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
            case AssistType.Heal:
                if (targetUnit.canHeal()) {
                    return true;
                }
                if (unit.support === Support.RescuePlus
                    || unit.support === Support.Rescue
                    || unit.support === Support.ReturnPlus
                    || unit.support === Support.Return
                    || unit.support === Support.NudgePlus
                    || unit.support === Support.Nudge
                ) {
                    return this.__canBeActivatedPostCombatMovementAssist(unit, targetUnit, tile);
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
                return this.__canBeActivatedPostCombatMovementAssist(unit, targetUnit, tile);
            case AssistType.DonorHeal:
                {
                    // 双界だと行動制限が解除されていないと使用しないっぽい
                    if (!g_appData.examinesEnemyActionTriggered(unit)) {
                        return false;
                    }

                    if (targetUnit.hasStatusEffect(StatusEffectType.DeepWounds)) {
                        return false;
                    }

                    let result = this.__getUserLossHpAndTargetHealHpForDonorHeal(unit, targetUnit);
                    return result.success && result.targetHealHp >= result.userLossHp;
                }
            default:
                this.writeErrorLine("戦闘後補助が未実装のスキル: " + unit.supportInfo.name);
                return false;
        }
    }

    __getUserLossHpAndTargetHealHpForDonorHeal(unit, targetUnit) {
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

    __canActivatePostCombatAssist(unit, allyUnits) {
        // todo: ちゃんと実装する
        let assistType = unit.supportInfo.assistType;
        for (let ally of allyUnits) {
            assistType = determineAssistType(unit, ally);
            // TODO: 応援と回復の優先順を検証する
            // 応援可能な味方がいた場合には応援
            if (assistType === AssistType.Rally) {
                break;
            }
        }
        switch (assistType) {
            case AssistType.Refresh:
                return true;
            case AssistType.Heal:
                if (unit.support === Support.Sacrifice ||
                    unit.support === Support.MaidensSolace) {
                    if (unit.hp === 1) {
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
                // 発動しないっぽい
                return g_appData.examinesEnemyActionTriggered(unit);
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
        let assistType = unit.supportInfo.assistType;
        let skillId = unit.support;
        let funcMap = getAssistTypeWhenCheckingCanActivatePrecombatAssistFuncMap;
        if (funcMap.has(skillId)) {
            let func = funcMap.get(skillId);
            if (typeof func === "function") {
                assistType = func.call(this, unit);
            } else {
                console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
            }
        }
        switch (assistType) {
            case AssistType.Refresh:
                return !this.__evaluateIs5DamageDealtOrWin(unit, enemyUnits);
            case AssistType.Rally:
                return !this.__evaluateIs5DamageDealtOrWin(unit, enemyUnits, false, true);
            case AssistType.Heal:
                {
                    if (unit.support === Support.Sacrifice ||
                        unit.support === Support.MaidensSolace) {
                        if (unit.hp === 1) {
                            return false;
                        }
                    }
                    let ignores5DamageDealt = unit.support !== (Support.Sacrifice || Support.MaidensSolace);
                    return !this.__evaluateIs5DamageDealtOrWin(unit, enemyUnits, ignores5DamageDealt);
                }
            case AssistType.Restore:
                {
                    if (this.__evaluateIs5DamageDealtOrWin(unit, enemyUnits, true)) {
                        return false;
                    }
                    return this.__isThereAllyThreatensEnemyStatus(unit);
                }
            case AssistType.DonorHeal:
                {
                    if (!g_appData.examinesEnemyActionTriggered(unit)) {
                        return false;
                    }
                    return unit.weapon === Weapon.None;
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
            if (unit === evalUnit) { continue; }
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
            if (unit.support === Support.None) {
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
            if (distanceToClosestEnemy === CanNotReachTile) { distanceToClosestEnemy = 100000; }

            if (this.vm.gameMode === GameMode.ResonantBattles && unit.groupId === UnitGroupType.Enemy && isThief(unit)) {
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
            if (unit.groupId === UnitGroupType.Enemy) {
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
            return targetTile === currentChaseTargetTile;
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
        using_(new ScopedStopwatch(time => this.writeDebugLogLine("追跡対象の計算: " + time + " ms")), () => {
            for (let evalUnit of targetUnits) {
                if (evaluatesTileFunc != null && !evaluatesTileFunc?.(evalUnit.chaseTargetTile)) {
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

        if (this.vm.gameMode === GameMode.ResonantBattles && evalUnit.groupId === UnitGroupType.Enemy) {
            if (isThief(evalUnit)) {
                // 双界の盗賊の追跡対象計算
                let minDist = CanNotReachTile;
                let minTargetTile = null;
                for (let tile of g_appData.map.enumerateTiles(tile => tile.posY === 0 && tile.isUnitPlacableForUnit(evalUnit))) {
                    // todo: 下には移動できない制限があるっぽい？
                    let dist = tile.calculateUnitMovementCountToThisTile(evalUnit, null, -1, false);
                    if (dist === CanNotReachTile) {
                        continue;
                    }

                    if (dist < minDist) {
                        minDist = dist;
                        minTargetTile = tile;
                    }
                    else if (dist === minDist) {
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
                    using_(new ScopedStopwatch(time => this.writeDebugLogLine(`${allyUnit.getNameWithGroup()}への追跡優先度の計算: ` + time + " ms")), () => {
                        let turnRange = g_appData.map.calculateTurnRange(evalUnit, allyUnit);
                        if (turnRange < 0) {
                            // 攻撃不可
                            return;
                        }

                        this.writeDebugLogLine("■" + evalUnit.getNameWithGroup() + "から" + allyUnit.getNameWithGroup() + "への追跡優先度計算:");

                        // todo: 攻撃対象の陣営の紋章バフは無効にしないといけない。あと周囲の味方の数で発動する系は必ず発動させないといけない
                        // 防御系奥義によるダメージ軽減も無視しないといけない
                        let combatResult = this.calcDamageTemporary(evalUnit, allyUnit, null, DamageType.PotentialDamage);
                        if (this.vm.isPotentialDamageDetailEnabled) {
                            this.writeDebugLogLine("ダメージ計算ログ --------------------");
                            this.writeDebugLogLine(this.damageCalc.log);
                            this.writeDebugLogLine("------------------------------------");
                        }

                        let potentialDamageDealt = combatResult.atkUnit_normalAttackDamage * combatResult.atkUnit_totalAttackCount;
                        let chasePriorityValue = potentialDamageDealt - 5 * turnRange;
                        let priorityValue =
                            chasePriorityValue * 10 +
                            allyUnit.slotOrder;
                        this.writeDebugLogLine(`- 優先度=${priorityValue}(ターン距離=${turnRange}`
                            + `, 通常攻撃ダメージ=${combatResult.atkUnit_normalAttackDamage}`
                            + `, 攻撃回数=${combatResult.atkUnit_totalAttackCount}`
                            + `, 潜在ダメージ=${potentialDamageDealt}`
                            + `, 追跡優先度=${chasePriorityValue}`
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
            if (movableTiles.length === 0) {
                this.writeDebugLogLine(unit.getNameWithGroup() + "が移動可能なマスはなし");
                continue;
            }

            let pivotTiles = [];
            let pivotContexts = [];
            if (unit.support === Support.Pivot) {
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
                            let context = {};
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
            if (unit.support === Support.Pivot) {
                // 壁破壊計算では回り込みなしの最適タイルが必要
                targetTileContextsWithoutPivot = this.__createTargetTileContexts(unit, movableTiles, []);
            }

            if (targetTileContexts.length === 0) {
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
                    if (context.assistUnitTileAfterAssist === bestTileToMove) {
                        pivotContext = context;
                        break;
                    }
                }

                this.__enqueueSupportCommand(unit, pivotContext?.tile, pivotContext?.targetUnit);
            }
            else if (bestTileToMove === unit.placedTile) {
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
        if (movableTiles.length === 0) {
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
                    if (tileUnit.passiveS === PassiveS.GoeiNoGuzo && unit.isOnInitPos()) {
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
                || chaseTargetTile.calculateUnitMovementCountToThisTile(unit, unit.placedTile) === CanNotReachTile
            ) {
                // たどり着けない場合は攻撃可能なマスを追跡対象のマスにする
                let minDist = CanNotReachTile;
                for (let tile of g_appData.map.enumerateAttackableTiles(unit, chaseTargetTile)) {
                    let dist = tile.calculateUnitMovementCountToThisTile(unit, unit.placedTile);
                    if (dist < minDist) {
                        minDist = dist;
                        chaseTargetTile = tile;
                    }
                    else if (dist === minDist) {
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

    __convertTilePerTurnStatusToSerial(tile) {
        return TileCookiePrefix + tile.id + NameValueDelimiter + tile.perTurnStatusToString();
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
        for (let tile of this.map.enumerateTiles()) {
            result += this.__convertTilePerTurnStatusToSerial(tile) + ElemDelimiter;
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
                self.writeLogLine(unit.getNameWithGroup() + "は行動終了");
            }

            self.endUnitActionAndGainPhaseIfPossible(unit);
            unit.deactivateCanto();
            unit.applyEndActionSkills();
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

        commands.push(this.__createMoveCommand(unit, tile, false, CommandType.Begin));
        commands.push(this.__createSupportCommand(unit, tile, assistTargetUnit, CommandType.End));
        return commands;
    }

    __createSupportCommand(unit, tile, assistTargetUnit, commandType = CommandType.Normal) {
        let serial = null;
        if (this.vm.isCommandUndoable) {
            serial = this.__convertPerTurnStatusToSerialForAllUnitsAndTrapsOnMap();
        }
        let self = this;
        let skillName = unit.supportInfo != null ? unit.supportInfo.name : "補助";
        let func = function () {
            if (unit.isActionDone) {
                // 移動時に罠を踏んで動けなくなるケース
                return;
            }

            // サウンド
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
                self.writeLogLine( `${unit.getNameWithGroup()}は${assistTargetUnit.getNameWithGroup()}に${skillName}を実行`);
            }
            self.applySupportSkill(unit, assistTargetUnit);
        };
        return this.__createCommand(
            `${unit.id}-s-${assistTargetUnit.id}-${tile.id}`,
            `${skillName}(${unit.getNameWithGroup()}→${assistTargetUnit.getNameWithGroup()}[${tile.posX},${tile.posY}])`,
            func,
            serial,
            commandType
        );
    }

    __createBreakStructureCommands(unit, moveTile, obj) {
        let commands = [];
        commands.push(this.__createMoveCommand(unit, moveTile, false, CommandType.Begin));
        commands.push(this.__createBreakStructureCommand(unit, moveTile, obj, CommandType.End));
        return commands;
    }

    __createBreakStructureCommand(unit, moveTile, obj, commandType = CommandType.Normal) {
        let serial = null;
        if (this.vm.isCommandUndoable) {
            serial = this.__convertUnitPerTurnStatusToSerial(unit) + ElemDelimiter +
                this.__convertStructurePerTurnStatusToSerial(obj);
        }
        let self = this;
        let func = function () {
            if (unit.isActionDone) {
                // 移動時にトラップ発動した場合は行動終了している
                // その場合でも天脈は発動する
                unit.applyEndActionSkills();
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
            } else {
                moveStructureToTrashBox(obj);
            }

            self.__endUnitActionOrActivateCanto(unit);
        };
        return this.__createCommand(
            `${unit.id}-b-${obj.id}-${moveTile.id}`,
            obj.name + `破壊(${unit.getNameWithGroup()} [${moveTile.posX},${moveTile.posY}])`,
            func,
            serial,
            commandType
        );
    }

    __activateCantoIfPossible(unit) {
        if (unit.isDead) {
            return false;
        }
        if (this.__canActivateCanto(unit)) {
            unit.isCantoActivating = true;
            this.writeDebugLogLine("再移動の発動");
            let count = unit.calcMoveCountForCanto();
            // 4マス以内にいるだけで再移動発動時に効果を発揮する
            // activateCantoIfPossible内で再移動の発動を判定しているのでここでは4マス以内の判定結果だけを保存
            let cantoControlledIfCantoActivated = false;
            for (let u of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(unit, 4)) {
                for (let skillId of u.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.DotingStaff:
                            if (u.isWeaponSpecialRefined) {
                                cantoControlledIfCantoActivated = true;
                            }
                            break;
                        case PassiveC.CantoControl3:
                            cantoControlledIfCantoActivated = true;
                            break;
                    }
                }
            }
            unit.activateCantoIfPossible(count, cantoControlledIfCantoActivated);
            return true;
        }
        return false;
    }

    __canActivateCanto(unit) {
        if (!unit.canActivateCanto()) {
            return false;
        }

        // 移動力が0かつワープでの移動先が無い場合再移動は発動しない
        if (unit.calcMoveCountForCanto() === 0) {
            let movableWarpTileCount = Array.from(this.map.enumerateWarpCantoTiles(unit)).length;
            if (movableWarpTileCount === 0) {
                return false;
            }
        }

        if (unit.hasStatusEffect(StatusEffectType.Canto1)) {
            return true;
        }

        // スキル毎の追加条件
        for (let skillId of unit.enumerateSkills()) {
            let funcMap = canActivateCantoFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    if (func.call(this, unit)) {
                        return true;
                    }
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
            switch (skillId) {
                case Weapon.PaydayPouch: // 再移動条件
                    if (unit.getPositiveStatusEffects().length >= 3) {
                        return true;
                    }
                    break;
                case PassiveC.FettersOfDromi:
                    return true;
                case PassiveB.FirestormDance3:
                    if (unit.battleContext.isRefreshActivated) {
                        return true;
                    }
                    break;
                case PassiveB.EscapeRoute4:
                    if (unit.hpPercentage <= 99) {
                        return true;
                    }
                    break;
                case Weapon.Queenslance:
                    if (unit.hasPositiveStatusEffect()) {
                        return true;
                    }
                    break;
                case Weapon.ReginRave:
                    if (unit.isWeaponSpecialRefined) {
                        if (unit.hasPositiveStatusEffect()) {
                            return true;
                        }
                    }
                    break;
                case Weapon.OkamijoouNoKiba:
                    if (unit.isTransformed) return true;
                    break;
                case Weapon.NidavellirSprig:
                case Weapon.NidavellirLots:
                case Weapon.GrimBrokkr:
                case Weapon.AutoLofnheior:
                    if (g_appData.currentTurn <= 4) {
                        return true;
                    }
                    break;
                // 特殊錬成で無条件
                case Weapon.VezuruNoYoran:
                case Weapon.NightmareHorn:
                    if (unit.isWeaponSpecialRefined) {
                        return true;
                    }
                    break;
                // 無条件
                case PassiveB.DazzleFarTrace:
                case Weapon.AbsoluteAmiti:
                case Weapon.BrightwindFans:
                case PassiveB.DeepStar:
                case Weapon.TheCyclesTurn:
                case Weapon.TeatimesEdge:
                case Weapon.TeatimeSetPlus:
                case Weapon.BakedTreats:
                case Weapon.SurfersSpire:
                case Weapon.SurfersSpade:
                case Weapon.FujinRaijinYumi:
                case PassiveA.KnightlyDevotion:
                case PassiveB.SoaringWings:
                case PassiveB.FlowNTrace3:
                case PassiveB.BeastNTrace3:
                case Weapon.HolytideTyrfing:
                case Weapon.FloridCanePlus:
                case Weapon.ShadowyQuill:
                case Weapon.FloridKnifePlus:
                case Weapon.SoothingScent:
                case Weapon.LoftyLeaflet:
                case Weapon.TriEdgeLance:
                case PassiveB.Chivalry:
                case Weapon.FrozenDelight:
                case Weapon.UnyieldingOar:
                case Weapon.JollyJadeLance:
                case PassiveB.HodrsZeal:
                case Weapon.WingLeftedSpear:
                case PassiveB.LunarBrace2:
                case Weapon.HonorableBlade:
                case Weapon.BowOfTwelve:
                case PassiveB.SolarBrace2:
                case PassiveB.MoonlightBangle:
                case PassiveB.MoonlitBangleF:
                case Weapon.DolphinDiveAxe:
                case Weapon.Ladyblade:
                case Weapon.FlowerLance:
                case Weapon.BlazingPolearms:
                case PassiveB.AtkSpdNearTrace3:
                case PassiveB.AtkDefNearTrace3:
                case PassiveB.AtkResNearTrace3:
                case PassiveB.SpdDefNearTrace3:
                case PassiveB.SpdResNearTrace3:
                case PassiveB.AtkSpdFarTrace3:
                case PassiveB.AtkDefFarTrace3:
                case PassiveB.AtkResFarTrace3:
                case PassiveB.SpdDefFarTrace3:
                case PassiveB.SpdResFarTrace3:
                case PassiveB.MurderousLion:
                    return true;
            }
        }

        return false;
    }

    __enqueueBreakStructureCommand(unit, moveTile, obj) {
        let commands = this.__createBreakStructureCommands(unit, moveTile, obj);
        this.__enqueueCommandsImpl(commands);
    }

    __createMoveCommand(unit, tileToMove, endAction = false, commandType = CommandType.Normal, enableSoundEffect = false) {
        // 移動
        let self = this;
        let metaData = {};
        metaData.tileToMove = tileToMove;
        metaData.unit = unit;
        let serial = null;
        if (this.vm.isCommandUndoable) {
            serial = this.__convertUnitPerTurnStatusToSerialForAllUnitsAndTrapsOnMapAndGlobal();
        }
        let func = function () {
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
                let isWarp = moveDist === CanNotReachTile;
                unit.restMoveCount = isWarp ? 0 : unit.moveCount - moveDist;
            }

            if (unit.placedTile !== tileToMove) {
                if (self.vm.gameMode === GameMode.ResonantBattles
                    && unit.groupId === UnitGroupType.Enemy && isThief(unit) && tileToMove.posY === 0
                ) {
                    // 双界のシーフが出口に辿り着いた
                    if (self.isCommandLogEnabled) {
                        self.writeLogLine(unit.getNameWithGroup() + "は出口に到着");
                    }
                    moveUnitToTrashBox(unit);
                } else {
                    if (self.isCommandLogEnabled) {
                        self.writeLogLine(unit.getNameWithGroup() + "は" + tileToMove.positionToString() + "に移動");
                    }
                    moveUnit(unit, tileToMove, unit.groupId === UnitGroupType.Ally);
                }

                self.updateAllUnitSpur();
            }

            if (!unit.isActionDone && endAction) {
                self.endUnitActionAndGainPhaseIfPossible(unit);
                unit.deactivateCanto();
                unit.applyEndActionSkills();
            }
            self.__updateDistanceFromClosestEnemy(unit);
        };
        return this.__createCommand(
            `${unit.id}-m-${tileToMove.id}`,
            `移動(${unit.getNameWithGroup()} [${tileToMove.posX},${tileToMove.posY}])`,
            func,
            serial,
            commandType,
            metaData
        );
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
        let func = function () {
            if (attackerUnit.isActionDone) {
                // 移動時にトラップ発動した場合は行動終了している
                return;
            }

            if (attackerUnit.weaponInfo.attackCount === 2) {
                self.audioManager.playSoundEffectImmediately(SoundEffectId.DoubleAttack);
            } else {
                self.audioManager.playSoundEffectImmediately(SoundEffectId.Attack);
            }
            self.updateDamageCalculation(attackerUnit, targetUnit, tile);
        };
        return this.__createCommand(
            `${attackerUnit.id}-a-${targetUnit.id}-${tile.id}`,
            `攻撃(${attackerUnit.getNameWithGroup()}→${targetUnit.getNameWithGroup()}[${tile.posX},${tile.posY}])`,
            func,
            serial,
            commandType
        );
    }

    __createAttackCommands(attackerUnit, targetUnit, tile) {
        let commands = [];
        commands.push(this.__createMoveCommand(attackerUnit, tile, false, CommandType.Begin));
        commands.push(this.__createAttackCommand(attackerUnit, targetUnit, tile, CommandType.End));
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
        if (intervalMilliseconds === 0) {
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
                    return queue.length === 0;
                }
            );
        }
    }

    __getBreakableStructureTiles(groupId) {
        return Array.from(this.map.enumerateBreakableStructureTiles(groupId));
    }

    __findBestTileToBreakBlock(unit, bestTileToMove, movableTiles) {
        if (!unit.hasWeapon) {
            return null;
        }

        this.writeDebugLogLine(unit.getNameWithGroup() + "が破壊可能なブロックを評価..");
        let blockTiles = this.__getBreakableStructureTiles(unit.groupId);
        if (blockTiles.length === 0) {
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
            if (distOfBlockToTarget === CanNotReachTile || distOfBlockToTarget < distOfBestTileToTarget) {
                let context = new TilePriorityContext(blockTile, unit);
                for (let tile of g_appData.map.enumerateAttackableTiles(unit, blockTile)) {
                    if (!movableTiles.includes(tile)) {
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
                        else if (distOfBestTileToBlock === minDist) {
                            blockTileContexts.push(context);
                        }
                    }
                }
            }
        }

        if (blockTileContexts.length === 0) {
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
        return Array.from(g_appData.enumeratePartnersInSpecifiedRange(targetUnit, spaces));
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
        if (unit.actionContext.attackableUnitInfos.length === 0) {
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
    /**
     * @param  {Unit[]} enemyUnits
     * @param  {Unit[]} allyUnits
     */
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
            if (unit.isWeaponEquipped === false) {
                continue;
            }

            // 攻撃可能なユニットを列挙
            this.writeLogLine(unit.getNameWithGroup() + "の攻撃可能なユニットを列挙--------");
            this.__setAttackableUnitInfoAndBestTileToAttack(unit, allyUnits);
            if (unit.actionContext.attackableUnitInfos.length === 0) {
                continue;
            }

            if (unit.groupId === UnitGroupType.Enemy) {
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
                if (info.target === target) {
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
        if (attackTargetInfos.length > 0) {
            let targetInfo = attackTargetInfos[0];
            let target = targetInfo.target;
            let bestAttacker = target.actionContext.bestAttacker;
            let attackableUnitInfo = bestAttacker.actionContext.findAttackableUnitInfo(target);
            let tile = attackableUnitInfo.bestTileToAttack;

            if (slotOrderDependentIndices.includes(0)) {
                this.writeWarningLine(`${bestAttacker.getNameWithGroup()}の攻撃順はスロット順で変わる可能性があります。`);
            }

            this.__enqueueAttackCommand(bestAttacker, target, tile);
            isActionActivated = true;
        }

        return isActionActivated;
    }

    __evaluateBestTileToAttack(
        attacker, targetInfo, ignoreTileFunc = null
    ) {
        if (targetInfo.tiles.length === 0) {
            return null;
        }

        let tilePriorities = [];
        for (let tile of targetInfo.tiles) {
            if (ignoreTileFunc != null && ignoreTileFunc?.(tile)) {
                continue;
            }

            this.__updateCombatResultOfAttackableTargetInfo(targetInfo, attacker, tile);

            let context = new TilePriorityContext(tile, attacker);
            context.combatResult = targetInfo.combatResults[tile.id];
            context.damageRatio = targetInfo.damageRatios[tile.id];
            context.calcPriorityToAttack();

            tilePriorities.push(context);
        }

        if (tilePriorities.length === 0) {
            return null;
        }
        if (tilePriorities.length === 1) {
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
            let defUnit = result.defUnit;
            let combatResult = this.__getCombatResult(attacker, defUnit);
            let targetDamage = (defUnit.hp - defUnit.restHp);
            let attackerDamage = (attacker.hp - attacker.restHp);
            let damageRatio = targetDamage * 3 - attackerDamage;
            targetInfo.combatResults[tile.id] = combatResult;
            targetInfo.damageRatios[tile.id] = damageRatio;
            targetInfo.combatResultDetails[tile.id] = result;
        }
    }
    /**
     * @param  {Unit} attacker
     * @param  {Unit} target
     * @return {CombatResult}
     */
    __getCombatResult(attacker, target) {
        if (target.restHp === 0) {
            return CombatResult.Win;
        } else if (attacker.restHp === 0) {
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
                + ", attackTargetPriority=" + context.attackTargetPriorty
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
        if (attackers.length === 1) {
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
                + ", attackTargetPriority=" + context.attackTargetPriorty
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
        attackEvalContext.isAfflictor = couldAttackerAttack &&
            isAfflictor(attacker, attackEvalContext.combatResult === CombatResult.Loss, result);


        attackEvalContext.calcAttackPriority(attacker);
        attackEvalContext.calcAttackTargetPriority(target);

        attacker.actionContext.attackEvalContexts[target] = attackEvalContext;
    }

    __createAssistableUnitInfos(assistUnit, isAssistableUnitFunc, acceptTileFunc = null) {
        for (let unitAndTile of assistUnit.enumerateActuallyAssistableUnitAndTiles()) {
            let unit = unitAndTile[0];
            let tile = unitAndTile[1];
            if (acceptTileFunc != null && !acceptTileFunc?.(tile)) {
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
        if (assistUnit.actionContext.assistableUnitInfos.length === 0) {
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

        if (tileEvalContexts.length === 0) {
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
            if (info.targetUnit === targetUnit) {
                return true;
            }
        }
        return false;
    }

    __setBestTargetAndTiles(assistUnit, isPrecombat, isAssistableUnitFunc, acceptTileFunc = null) {
        switch (assistUnit.support) {
            case Support.RallyUpAtk:
            case Support.RallyUpSpd:
            case Support.RallyUpDef:
            case Support.RallyUpRes:
            case Support.RallyUpAtkPlus:
            case Support.RallyUpSpdPlus:
            case Support.RallyUpDefPlus:
            case Support.RallyUpResPlus:
                {
                    this.writeLogLine(assistUnit.supportInfo.name + "の間接的な補助対象を選択");
                    this.__createAssistableUnitInfos(assistUnit, (targetUnit, tile) => true);

                    let intendedTargetCandidateInfos = [];
                    for (let unitInfo of assistUnit.actionContext.assistableUnitInfos) {
                        for (let candidateUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unitInfo.targetUnit, 2, true)) {
                            if (candidateUnit === assistUnit) {
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
                    if (intendedTargetCandidateInfos.length === 0) {
                        return;
                    }

                    let intendedTargetInfo = this.__selectBestAssistTarget(assistUnit, intendedTargetCandidateInfos, isPrecombat);
                    this.writeLogLine(assistUnit.supportInfo.name + "の意図的な補助対象は" + intendedTargetInfo.targetUnit.getNameWithGroup());

                    let eligibleTargets = [];
                    let otherEligibleTargets = [];
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(assistUnit, false)) {
                        if (unit === assistUnit) {
                            continue;
                        }
                        if (!isAssistableUnitFunc(unit, null)) {
                            continue;
                        }
                        eligibleTargets.push(unit);
                        if (unit !== intendedTargetInfo.targetUnit) {
                            otherEligibleTargets.push(unit);
                        }
                    }

                    let unitsWithin2SpacesOfIntendedTarget = [];
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(intendedTargetInfo.targetUnit, 2, true)) {
                        if (unit === assistUnit) {
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
                    let isIntendedTargetLowestSlot = lowestSlotUnit === intendedTargetInfo.targetUnit;

                    for (let targetInfo of assistUnit.actionContext.assistableUnitInfos) {
                        if (!unitsWithin2SpacesOfIntendedTarget.includes(targetInfo.targetUnit)) {
                            targetInfo.rallyUpTargetPriority = -1000000;
                            continue;
                        }

                        this.writeDebugLogLine(targetInfo.targetUnit.getNameWithGroup() + "の大応援優先度評価..");
                        let numOfOtherEligibleTargetsBuffed = this.__countAlliesWithinSpecifiedSpaces(
                            targetInfo.targetUnit, 2, x => otherEligibleTargets.includes(x));

                        let lowestSlotIntendedTargetPriority = 0;
                        targetInfo.isIntendedAndLowestSlot = targetInfo.targetUnit === intendedTargetInfo.targetUnit && !isIntendedTargetLowestSlot;
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
                    // TODO: 検証する
                    /** @type {AssistableUnitInfo[]} */
                    let infos = [];
                    for (let info of assistUnit.actionContext.assistableUnitInfos) {
                        let skillId = assistUnit.support;
                        if (isRallyHealSkill(skillId)) {
                            if (info.targetUnit.restHpPercentage < 100) {
                                infos.push(info);
                            } else if (canAddStatusEffectByRallyFuncMap.has(skillId)) {
                                if (canAddStatusEffectByRallyFuncMap.get(skillId).call(this, assistUnit, info.targetUnit)) {
                                    infos.push(info);
                                }
                            }
                        } else {
                            infos.push(info);
                        }
                    }
                    if (infos.length === 0) {
                        return;
                    }

                    let bestTargetUnitInfo = this.__selectBestAssistTarget(assistUnit, infos, isPrecombat);
                    assistUnit.actionContext.bestTargetToAssist = bestTargetUnitInfo.targetUnit;
                    assistUnit.actionContext.bestTileToAssist = bestTargetUnitInfo.bestTileToAssist;
                }
                break;
        }
    }

    /**
     * @param {Unit} assistUnit
     * @param {AssistableUnitInfo[]|Generator<AssistableUnitInfo>} assistableUnitInfos
     * @param {boolean} isPrecombat
     */
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
                + ", hasStatAndNonStatDebuff=" + info.hasStatAndNonStatDebuff
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

        return assistableUnitInfos[0];
    }

    // noinspection JSUnusedGlobalSymbols
    __countEnemiesWithinSpecifiedSpaces(targetUnit, spaces, predicator) {
        return g_appData.countEnemiesWithinSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    __countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return g_appData.countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    __setAttackableUnitInfo(unit, targetableUnits, acceptTileFunc = null) {
        unit.actionContext.attackableUnitInfos = [];
        for (let tile of g_appData.map.enumerateMovableTiles(unit, false, false)) {
            if (acceptTileFunc != null && !acceptTileFunc?.(tile)) {
                continue;
            }

            // this.writeDebugLogLine(tile.positionToString() + "から攻撃可能な敵がいるか評価");
            for (let targetableUnit of targetableUnits) {
                let dist = calcDistance(tile.posX, tile.posY, targetableUnit.posX, targetableUnit.posY);
                // this.writeDebugLogLine("- " + tile.positionToString() + "から" + targetableUnit.getNameWithGroup() + "への距離=" + dist);
                if (dist !== unit.attackRange) {
                    continue;
                }

                // this.writeDebugLogLine("- " + tile.positionToString() + "から" + targetableUnit.getNameWithGroup() + "に攻撃可能");

                let info = unit.actionContext.findAttackableUnitInfo(targetableUnit);
                if (info == null) {
                    info = new AttackableUnitInfo(targetableUnit);
                    unit.actionContext.attackableUnitInfos.push(info);
                }

                if (tile === unit.placedTile || tile.isUnitPlacable()) {
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
            this.__initReservedStateForAllUnitsOnMap();
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
                        if (g_appData.currentTurn === 1) {
                            this.executeStructure(st, appliesDamage);
                        }
                    }
                    else if (st instanceof OfBoltTower) {
                        if (g_appData.currentTurn === 3) {
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
                        if (g_appData.currentTurn === 1) {
                            this.executeStructure(st, appliesDamage);
                        }
                    }
                    else if (st instanceof DefBoltTower) {
                        if (g_appData.currentTurn === 3) {
                            this.executeStructure(st, appliesDamage);
                        }
                    }
                }
                break;
        }

        if (appliesDamage) {
            this.beginningOfTurnSkillHandler.applyReservedStateForAllUnitsOnMap();
            this.beginningOfTurnSkillHandler.applyReservedHpForAllUnitsOnMap(true);
        }
    }

    applyTileEffect() {
        // 天脈
        // TODO: とりあえずこのタイミングで実装するが後で正しいか確認する
        for (let tile of this.map.enumerateTiles()) {
            switch (tile.divineVein) {
                case DivineVeinType.Flame: {
                    let unit = tile.placedUnit;
                    if (unit === null) {
                        break;
                    }
                    if (unit.groupId !== tile.divineVeinGroup) {
                        unit.reserveTakeDamage(7);
                    }
                }
                    break;
            }
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
    /**
     * @param  {Unit} unit
     */
    __initReservedState(unit) {
        unit.initReservedDebuffs();
        unit.initReservedStatusEffects();
        unit.initReservedHp();
    }

    __initReservedStateForAllUnitsOnMap() {
        for (let unit of this.enumerateAllUnitsOnMap()) {
            this.__initReservedState(unit);
        }
    }

    executeStructure(structure, appliesDamage = true) {
        if (appliesDamage) {
            this.__initReservedStateForAllUnitsOnMap();
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
        else if (structure instanceof HexTrap) {
            for (let unit of g_appData.enumerateUnitsInSpecifiedGroupOnMap(UnitGroupType.Ally)) {
                if (unit.posX === px && unit.posY === py) {
                    if (this.__getStatusEvalUnit(unit).hp <= (Number(structure.level) * 5 + 35)) {
                        this.writeLogLine(unit.getNameWithGroup() + "に停止の魔法罠の効果適用");
                        unit.endAction();
                    }
                    break;
                }
            }
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
                    && structure.posX === st.posX
                    && Number(st.level) <= Number(structure.level)) {
                    moveStructureToTrashBox(st);
                }
            }
        }
        else if (structure instanceof DefCatapult) {
            for (let st of this.__enumerateOffenceStructuresOnMap()) {
                if (this.__canBreakByCatapult(st)
                    && structure.posX === st.posX
                    && Number(st.level) <= Number(structure.level)) {
                    moveStructureToTrashBox(st);
                }
            }
        }
        else {
            this.writeLogLine("<span style='color:red'>" + structure.name + "は効果の発動に未対応です。</span>");
        }

        if (appliesDamage) {
            this.beginningOfTurnSkillHandler.applyReservedStateForAllUnitsOnMap();
            this.beginningOfTurnSkillHandler.applyReservedHpForAllUnitsOnMap(true);
        }
    }

    __getStatusEvalUnit(unit) {
        return unit.snapshot != null ? unit.snapshot : unit;
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
            if (unit.moveType === moveType) { unit.reserveToApplyAllDebuff(-(Number(structure.level) + 1)); }
        }
    }
    executeCurrentStructure() {
        let structure = g_appData.currentStructure;
        if (g_appData.map.isObjAvailable(structure) === false) {
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
        return g_appData.findMinStatusUnits(unitGroup, getStatusFunc);
    }

    __findMaxStatusUnits(unitGroup, getStatusFunc, exceptUnit = null) {
        return g_appData.findMaxStatusUnits(unitGroup, getStatusFunc, x => x === exceptUnit);
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

            if (moveTile !== unit.placedTile && !tile.isUnitPlacableForUnit(targetUnit)) {
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
        if (moveTile !== unit.placedTile && !moveTile.isUnitPlacable()) {
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

        if (moveTile !== unit.placedTile && !moveTile.isUnitPlacable()) {
            return new MovementAssistResult(false, null, null);
        }

        return new MovementAssistResult(true, assistTile, moveTile);
    }
    /**
     * @param  {Unit} unit
     * @param  {Unit} targetUnit
     * @param  {Function} movementAssistCalcFunc
     * @param  {Boolean} applesMovementSkill=true
     * @param  {Boolean} movesTargetUnit=true
     * @param  {Boolean} executesTrap=true
     */
    __applyMovementAssist(
        unit,
        targetUnit,
        movementAssistCalcFunc,
        applesMovementSkill = true,
        movesTargetUnit = true,
        executesTrap = true,
    ) {
        if (targetUnit == null) { return false; }
        // 途中の処理でfromが書き換わるので退避させる
        let unitFromX = unit.fromPosX;
        let unitFromY = unit.fromPosY;
        let targetUnitFromX = targetUnit.fromPosX;
        let targetUnitFromY = targetUnit.fromPosY;
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
        moveUnit(unit, origUnitTile, false, executesTrap);
        moveUnit(targetUnit, origTargetUnitTile, false, executesTrap);
        if (!canMove) {
            return false;
        }

        // 行動終了してから移動しないと罠が発動後に行動終了で状態異常がすぐに回復してしまう
        // endUnitActionAndGainPhaseIfPossible()を呼んでしまうと未来を映す瞳が実行される前にターン終了してしまう
        unit.endAction();

        g_appData.map.removeUnit(unit);
        if (movesTargetUnit) {
            g_appData.map.removeUnit(targetUnit);
        }

        // 罠は移動補助スキルの後に効果を発動するのでexecutesTrapをtrueで呼び出す
        moveUnit(unit, result.assistUnitTileAfterAssist, false, false);
        if (movesTargetUnit) {
            moveUnit(targetUnit, result.targetUnitTileAfterAssist, false, false);
        }

        // fromの値を復元する
        unit.setFromPos(unitFromX, unitFromY);
        targetUnit.setFromPos(targetUnitFromX, targetUnitFromY);

        if (applesMovementSkill) {
            this.__applyMovementAssistSkill(unit, targetUnit);
            this.__applyMovementAssistSkill(targetUnit, unit);
        }

        // 移動補助スキルの処理が終了したので罠を発動させる
        if (executesTrap) {
            executeTrapIfPossible(unit, false);
            executeTrapIfPossible(targetUnit, false);
        }
        return true;
    }

    __applyDebuffToEnemiesWithin2Spaces(targetUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 2)) {
            debuffFunc(unit);
        }
    }

    __applyMovementAssistSkill(assistUnit, targetUnit) {
        for (let skillId of assistUnit.enumerateSkills()) {
            let funcMap = applyMovementAssistSkillFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    func.call(this, assistUnit, targetUnit);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
            switch (skillId) {
                case Weapon.RetainersReport:
                    if (assistUnit.isWeaponSpecialRefined) {
                        for (let u of this.enumerateUnitsInDifferentGroupOnMap(assistUnit)) {
                            if (this.__isInCross(assistUnit, u) ||
                                this.__isInCross(targetUnit, u)) {
                                u.applyDebuffs(-7, 0, -7, -7);
                                u.addStatusEffect(StatusEffectType.Guard);
                                u.addStatusEffect(StatusEffectType.Exposure);
                            }
                        }
                    }
                    break;
                case Weapon.EverlivingBreath: {
                    let units = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(assistUnit, 2, true));
                    units = units.concat(Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)));
                    // 範囲が重複している場合でも効果が重複しないようにするために対象ユニットを集合に入れる
                    let unitSet = new Set(units);
                    for (let u of unitSet) {
                        u.heal(10);
                        u.clearNegativeStatusEffects();
                    }
                    break;
                }
                case Weapon.AzureLance:
                    if (assistUnit.isWeaponSpecialRefined) {
                        assistUnit.applyAtkBuff(6);
                        assistUnit.applySpdBuff(6);
                        targetUnit.applyAtkBuff(6);
                        targetUnit.applySpdBuff(6);
                        assistUnit.heal(10);
                        targetUnit.heal(10);
                    }
                    break;
                case Weapon.DestinysBow:
                    if (g_appData.currentTurn <= 4) {
                        if (!assistUnit.isOneTimeActionActivatedForWeapon) {
                            assistUnit.reduceSpecialCount(1);
                            targetUnit.reduceSpecialCount(1);
                            assistUnit.isOneTimeActionActivatedForWeapon = true;
                        }
                    }
                    break;
                case Weapon.GerberaAxe:
                    assistUnit.addStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                    targetUnit.addStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                    break;
                case Weapon.Sogun:
                    if (assistUnit.isWeaponRefined) {
                        assistUnit.addStatusEffect(StatusEffectType.FollowUpAttackPlus);
                        targetUnit.addStatusEffect(StatusEffectType.FollowUpAttackPlus);
                    }
                    break;
                case PassiveB.AtkSpdSnag3:
                    for (let u of this.__findNearestEnemies(assistUnit, 4)) {
                        u.applyAtkDebuff(-6);
                        u.applySpdDebuff(-6);
                    }
                    for (let u of this.__findNearestEnemies(targetUnit, 4)) {
                        u.applyAtkDebuff(-6);
                        u.applySpdDebuff(-6);
                    }
                    break;
                case PassiveB.AtkDefSnag3:
                    for (let u of this.__findNearestEnemies(assistUnit, 4)) {
                        u.applyAtkDebuff(-6);
                        u.applyDefDebuff(-6);
                    }
                    for (let u of this.__findNearestEnemies(targetUnit, 4)) {
                        u.applyAtkDebuff(-6);
                        u.applyDefDebuff(-6);
                    }
                    break;
                case PassiveB.AtkResSnag3:
                    for (let u of this.__findNearestEnemies(assistUnit, 4)) {
                        u.applyDebuffs(-6, 0, 0, -6);
                    }
                    for (let u of this.__findNearestEnemies(targetUnit, 4)) {
                        u.applyDebuffs(-6, 0, 0, -6);
                    }
                    break;
                case PassiveB.SpdResSnag3:
                    for (let u of this.__findNearestEnemies(assistUnit, 4)) {
                        u.applySpdDebuff(-6);
                        u.applyResDebuff(-6);
                    }
                    for (let u of this.__findNearestEnemies(targetUnit, 4)) {
                        u.applySpdDebuff(-6);
                        u.applyResDebuff(-6);
                    }
                    break;
                case PassiveB.SpdDefSnag3:
                    for (let u of this.__findNearestEnemies(assistUnit, 4)) {
                        u.applySpdDebuff(-6);
                        u.applyDefDebuff(-6);
                    }
                    for (let u of this.__findNearestEnemies(targetUnit, 4)) {
                        u.applySpdDebuff(-6);
                        u.applyDefDebuff(-6);
                    }
                    break;
                case PassiveB.DefResSnag3:
                    for (let u of this.__findNearestEnemies(assistUnit, 4)) {
                        u.applyDefDebuff(-6);
                        u.applyResDebuff(-6);
                    }
                    for (let u of this.__findNearestEnemies(targetUnit, 4)) {
                        u.applyDefDebuff(-6);
                        u.applyResDebuff(-6);
                    }
                    break;
                case Weapon.TrasenshiNoTsumekiba:
                    if (!assistUnit.isWeaponRefined) {
                        this.__applyDebuffToEnemiesWithin2Spaces(assistUnit, x => x.applyAllDebuff(-4));
                        this.__applyDebuffToEnemiesWithin2Spaces(targetUnit, x => x.applyAllDebuff(-4));
                    } else {
                        this.__applyDebuffToEnemiesWithin2Spaces(assistUnit, x => x.applyAllDebuff(-5));
                        this.__applyDebuffToEnemiesWithin2Spaces(targetUnit, x => x.applyAllDebuff(-5));
                        if (assistUnit.isWeaponSpecialRefined) {
                            let units = Array.from(this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(assistUnit, 2));
                            units = units.concat(Array.from(this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 2)));
                            // 範囲が重複している場合でも効果が重複しないようにするために対象ユニットを集合に入れる
                            let unitSet = new Set(units);
                            for (let u of unitSet) {
                                u.increaseSpecialCount(1);
                            }
                        }
                    }
                    break;
                case Weapon.RazuwarudoNoMaiken:
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                        ally.applyAllBuff(4);
                    }
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(assistUnit, 2, false)) {
                        ally.applyAllBuff(4);
                    }
                    break;
                case PassiveB.AtkSpdLink2:
                    this.__applyLinkSkill(assistUnit, targetUnit,
                        x => { x.applyAtkBuff(4); x.applySpdBuff(4); });
                    break;
                case Weapon.OrdinNoKokusyo:
                case Weapon.KinranNoSyo:
                    if (assistUnit.isWeaponSpecialRefined) {
                        this.__applyLinkSkill(assistUnit, targetUnit,
                            x => { x.applyAtkBuff(6); x.applySpdBuff(6); });
                    }
                    break;
                case PassiveB.AtkSpdLink3:
                    this.__applyLinkSkill(assistUnit, targetUnit,
                        x => { x.applyAtkBuff(6); x.applySpdBuff(6); });
                    break;
                case PassiveB.AtkDefLink3:
                    this.__applyLinkSkill(assistUnit, targetUnit,
                        x => { x.applyAtkBuff(6); x.applyDefBuff(6); });
                    break;
                case PassiveB.AtkResLink3:
                    this.__applyLinkSkill(assistUnit, targetUnit,
                        x => { x.applyAtkBuff(6); x.applyResBuff(6); });
                    break;
                case PassiveB.SpdDefLink3:
                    this.__applyLinkSkill(assistUnit, targetUnit,
                        x => { x.applySpdBuff(6); x.applyDefBuff(6); });
                    break;
                case PassiveB.SpdResLink3:
                    this.__applyLinkSkill(assistUnit, targetUnit,
                        x => { x.applySpdBuff(6); x.applyResBuff(6); });
                    break;
                case PassiveB.DefResLink3:
                    this.__applyLinkSkill(assistUnit, targetUnit,
                        x => { x.applyDefBuff(6); x.applyResBuff(6); });
                    break;
            }
        }
    }

    __applyLinkSkill(unit, targetUnit, applyBuffFunc) {
        applyBuffFunc(unit);
        applyBuffFunc(targetUnit);
    }
    /**
     * @param  {Unit} skillOwnerUnit
     * @param  {Unit} targetUnit
     */
    __applyRefresh(skillOwnerUnit, targetUnit) {
        if (targetUnit == null) { return false; }
        targetUnit.isActionDone = false;
        for (let skillId of skillOwnerUnit.enumerateSkills()) {
            let funcMap = applyRefreshFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    func.call(this, skillOwnerUnit, targetUnit);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
            switch (skillId) {
                case Weapon.NightmaresEgg:
                    targetUnit.addStatusEffect(StatusEffectType.FoePenaltyDoubler);
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                        if (unit === skillOwnerUnit) { continue; }
                        unit.addStatusEffect(StatusEffectType.FoePenaltyDoubler);
                    }
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwnerUnit)) {
                        if (skillOwnerUnit.posX === unit.posX ||
                            skillOwnerUnit.posY === unit.posY ||
                            targetUnit.posX === unit.posX ||
                            targetUnit.posY === unit.posY) {
                            unit.addStatusEffect(StatusEffectType.Panic);
                        }
                    }
                    break;
                case Weapon.SevenfoldGifts:
                    targetUnit.applyAllBuff(6);
                    targetUnit.addStatusEffect(StatusEffectType.FollowUpAttackPlus)
                    break;
                case Support.CallToFlame:
                    targetUnit.applyAtkBuff(6);
                    targetUnit.addStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
                    if (isWeaponTypeBreath(targetUnit.weaponType)) {
                        targetUnit.addStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                    break;
                case Support.Play:
                    if (skillOwnerUnit.weapon === Weapon.HyosyoNoBreath) {
                        for (let unit of this.__findNearestEnemies(skillOwnerUnit, 4)) {
                            unit.applyAllDebuff(-4);
                        }
                    }
                    break;
                case Support.GrayWaves:
                    {
                        if ((targetUnit.moveType === MoveType.Infantry || targetUnit.moveType === MoveType.Flying)) {
                            targetUnit.addStatusEffect(StatusEffectType.MobilityIncreased);
                        }
                    }
                    break;
                case Support.GrayWaves2: {
                    if ((targetUnit.moveType === MoveType.Infantry || targetUnit.moveType === MoveType.Flying)) {
                        targetUnit.addStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                    targetUnit.addStatusEffect(StatusEffectType.NullPanic);
                }
                    break;
                case Support.GentleDream:
                case Support.GentleDreamPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwnerUnit, false)) {
                        if (unit.posX === skillOwnerUnit.posX ||
                            unit.posX === targetUnit.posX ||
                            unit.posY === skillOwnerUnit.posY ||
                            unit.posY === targetUnit.posY) {
                            let amount = 3;
                            if (skillId === Support.GentleDreamPlus) {
                                amount = 4;
                                unit.addStatusEffect(StatusEffectType.NeutralizesPenalties);
                            }
                            unit.applyAllBuff(amount);
                            unit.addStatusEffect(StatusEffectType.AirOrders);
                        }
                    }
                    break;
                case Support.WhimsicalDream:
                    {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                            if (skillOwnerUnit === unit) continue;
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
                case Support.WhimsicalDreamPlus:
                    {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                            if (skillOwnerUnit === unit) continue;
                            unit.applyAtkBuff(6);
                            unit.addStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                        }

                        let targetEnemies = this.__findNearestEnemies(targetUnit, 5);
                        for (let targetEnemy of targetEnemies) {
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetEnemy, 2, true)) {
                                unit.applyAtkDebuff(-6);
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
                case Support.CloyingDreams:
                    targetUnit.applyAllBuff(5);
                    targetUnit.addStatusEffect(StatusEffectType.Charge);
                    targetUnit.addStatusEffect(StatusEffectType.FoePenaltyDoubler);
                    for (let unit of this.__findNearestEnemies(targetUnit, 5)) {
                        unit.applyAllDebuff(-5);
                    }
                    break;
                case Support.FrightfulDream:
                    this.__applyRuse(skillOwnerUnit, targetUnit, unit => unit.applyAllDebuff(-3));
                    break;
                case Weapon.FaithfulBreath:
                    for (let unit of this.__findNearestEnemies(skillOwnerUnit, 4)) {
                        unit.applyDefDebuff(-6);
                        unit.applyResDebuff(-6);
                    }
                    for (let unit of this.__findNearestEnemies(targetUnit, 4)) {
                        unit.applyDefDebuff(-6);
                        unit.applyResDebuff(-6);
                    }
                    break;
                case Weapon.EnvelopingBreath:
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwnerUnit)) {
                        if (this.__isInCross(unit, skillOwnerUnit) || this.__isInCross(unit, targetUnit)) {
                            unit.applyAtkDebuff(-7);
                            unit.applyResDebuff(-7);
                            unit.addStatusEffect(StatusEffectType.Guard);
                        }
                    }
                    break;
                case Weapon.Urur:
                    {
                        targetUnit.applyAllBuff(3);
                    }
                    break;
                case Weapon.DancingFlames:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 1)) {
                        unit.applyAllBuff(6);
                    }
                    break;
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
                case PassiveB.FirestormDance3:
                    targetUnit.applyAtkSpdBuffs(6);
                    targetUnit.addStatusEffect(StatusEffectType.Desperation);
                    break;
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
                case PassiveB.SpdCantrip3:
                    for (let unit of this.__findNearestEnemies(skillOwnerUnit, 4)) {
                        unit.applySpdDebuff(-7);
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
        if (skillOwnerUnit.weapon === Weapon.SeireiNoHogu) {
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
    /**
     * @param  {Unit} unit
     * @param  {Unit} targetUnit
     * @param  {Tile} assistTile
     */
    __canBeMovedIntoLessEnemyThreat(unit, targetUnit, assistTile) {
        let beforeTileThreat = targetUnit.placedTile.getEnemyThreatFor(unit.groupId);
        let result = this.__getTargetUnitTileAfterMoveAssist(unit, targetUnit, assistTile);
        if (!result.success) {
            return false;
        }

        let canPlace = result.assistUnitTileAfterAssist.isMovableTileForUnit(unit)
            && result.targetUnitTileAfterAssist.isMovableTileForUnit(targetUnit);
        if (!canPlace) {
            return false;
        }

        let afterTileThreat = result.targetUnitTileAfterAssist.getEnemyThreatFor(unit.groupId);
        this.writeDebugLogLine(targetUnit.getNameWithGroup() + " "
            + "現在の脅威数=" + beforeTileThreat + `(${targetUnit.placedTile.positionToString()}), `
            + "移動後の脅威数=" + afterTileThreat + `(${result.targetUnitTileAfterAssist.positionToString()})`);
        if (afterTileThreat < 0) {
            return false;
        }
        return afterTileThreat < beforeTileThreat;
    }
    /**
     * @param  {Unit} unit
     * @param  {Unit} targetUnit
     * @param  {Tile} assistTile
     * @returns {MovementAssistResult}
     */
    __getTargetUnitTileAfterMoveAssist(unit, targetUnit, assistTile) {
        let result = null;
        let funcMap = getTargetUnitTileAfterMoveAssistFuncMap;
        let skillId = unit.support;
        if (funcMap.has(skillId)) {
            let func = funcMap.get(skillId);
            if (typeof func === "function") {
                result = func.call(this, unit, targetUnit, assistTile);
            } else {
                console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
            }
        }
        switch (unit.support) {
            case Support.RescuePlus:
            case Support.Rescue:
            case Support.Drawback:
                result = this.__findTileAfterDrawback(unit, targetUnit, assistTile);
                break;
            case Support.ToChangeFate:
            case Support.ToChangeFate2:
            case Support.AFateChanged:
            case Support.FateUnchanged:
            case Support.ReturnPlus:
            case Support.Return:
            case Support.Reposition:
                result = this.__findTileAfterReposition(unit, targetUnit, assistTile);
                break;
            case Support.FoulPlay:
            case Support.FutureVision:
            case Support.FutureVision2:
            case Support.Swap:
                result = this.__findTileAfterSwap(unit, targetUnit, assistTile);
                break;
            case Support.Smite:
                result = this.__findTileAfterSmite(unit, targetUnit, assistTile);
                break;
            case Support.NudgePlus:
            case Support.Nudge:
            case Support.Shove:
                result = this.__findTileAfterShove(unit, targetUnit, assistTile);
                break;
            case Support.Pivot:
                result = this.__findTileAfterPivot(unit, targetUnit, assistTile);
                break;
            default:
                this.writeErrorLine("未実装の補助: " + unit.supportInfo.name);
                return null;
        }
        return result;
    }

    /**
     * @param {Unit} supporterUnit
     * @param {Unit} targetUnit
     */
    __applyRally(supporterUnit, targetUnit) {
        let isBuffed = false;
        let supportId = supporterUnit.support;
        if (targetUnit.applyAtkBuff(getAtkBuffAmount(supportId))) { isBuffed = true; }
        if (targetUnit.applySpdBuff(getSpdBuffAmount(supportId))) { isBuffed = true; }
        if (targetUnit.applyDefBuff(getDefBuffAmount(supportId))) { isBuffed = true; }
        if (targetUnit.applyResBuff(getResBuffAmount(supportId))) { isBuffed = true; }
        isBuffed |= supporterUnit.canRallyForcibly();
        isBuffed |= targetUnit.canRalliedForcibly();
        for (let skillId of supporterUnit.enumerateSkills()) {
            let funcMap = canAddStatusEffectByRallyFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    isBuffed |= func.call(this, supporterUnit, targetUnit);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
        }

        if (isBuffed) {
            this.__applySkillsAfterRally(supporterUnit, targetUnit);
        }
        return isBuffed;
    }

    __applySkillsAfterRally(supporterUnit, targetUnit) {
        // 使用した時
        for (let skillId of supporterUnit.enumerateSkills()) {
            let funcMap = applySkillsAfterRallyForSupporterFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    func.call(this, supporterUnit, targetUnit);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
            switch (skillId) {
                case Support.GoldSerpent:
                    break;
                case Weapon.Heidr:
                case Weapon.GoldenCurse:
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
                        if (unit.posX === supporterUnit.posX ||
                            unit.posX === targetUnit.posX ||
                            unit.posY === supporterUnit.posY ||
                            unit.posY === targetUnit.posY) {
                            unit.applyAllDebuff(-4);
                            unit.addStatusEffect(StatusEffectType.Guard);
                        }
                    }
                    break;
                case Weapon.RetainersReport:
                    if (supporterUnit.isWeaponSpecialRefined) {
                        for (let u of this.enumerateUnitsInDifferentGroupOnMap(supporterUnit)) {
                            if (this.__isInCross(supporterUnit, u) ||
                                this.__isInCross(targetUnit, u)) {
                                u.applyDebuffs(-7, 0, -7, -7);
                                u.addStatusEffect(StatusEffectType.Guard);
                                u.addStatusEffect(StatusEffectType.Exposure);
                            }
                        }
                    }
                    break;
                case Weapon.EverlivingBreath: {
                    let units = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(supporterUnit, 2, true));
                    units = units.concat(Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)));
                    // 範囲が重複している場合でも効果が重複しないようにするために対象ユニットを集合に入れる
                    let unitSet = new Set(units);
                    for (let u of unitSet) {
                        u.heal(10);
                        u.clearNegativeStatusEffects();
                    }
                    break;
                }
                case Weapon.AzureLance:
                    if (supporterUnit.isWeaponSpecialRefined) {
                        supporterUnit.applyAtkBuff(6);
                        supporterUnit.applySpdBuff(6);
                        targetUnit.applyAtkBuff(6);
                        targetUnit.applySpdBuff(6);
                        supporterUnit.heal(10);
                        targetUnit.heal(10);
                    }
                    break;
                case Weapon.DamiellBow:
                    if (!(targetUnit.moveType === MoveType.Cavalry && targetUnit.isRangedWeaponType())) {
                        targetUnit.addStatusEffect(StatusEffectType.MobilityIncreased);
                        targetUnit.addStatusEffect(StatusEffectType.BonusDoubler);
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

        // 自分に使用された時
        for (let skillId of targetUnit.enumerateSkills()) {
            let funcMap = applySkillsAfterRallyForTargetUnitFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    func.call(this, supporterUnit, targetUnit);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
            switch (skillId) {
                case Weapon.Heidr:
                case Weapon.GoldenCurse:
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
                        if (unit.posX === supporterUnit.posX ||
                            unit.posX === targetUnit.posX ||
                            unit.posY === supporterUnit.posY ||
                            unit.posY === targetUnit.posY) {
                            unit.applyAllDebuff(-4);
                            unit.addStatusEffect(StatusEffectType.Guard);
                        }
                    }
                    break;
                case Weapon.AzureLance:
                    if (supporterUnit.isWeaponSpecialRefined) {
                        supporterUnit.applyAtkBuff(6);
                        supporterUnit.applySpdBuff(6);
                        targetUnit.applyAtkBuff(6);
                        targetUnit.applySpdBuff(6);
                        supporterUnit.heal(10);
                        targetUnit.heal(10);
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
    }

    __applyFeint(skillOwnerUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwnerUnit)) {
            if (this.__isInCross(unit, skillOwnerUnit)) {
                debuffFunc(unit);
            }
        }
    }

    __applyRuse(supporterUnit, targetUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(supporterUnit)) {
            if (this.__isInCross(unit, supporterUnit) || this.__isInCross(unit, targetUnit)) {
                debuffFunc(unit);
                unit.addStatusEffect(StatusEffectType.Guard);
            }
        }
    }

    __applyRallyUp(supporterUnit, targetUnit) {
        let success = false;
        let supportId = supporterUnit.support;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
            if (unit === supporterUnit) {
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
        if (supporterUnit.canRallyForcibly() || targetUnit.canRalliedForcibly()) {
            success = true;
        }

        if (success) {
            this.__applySkillsAfterRally(supporterUnit, targetUnit);
        }

        return success;
    }

    __applyGoldSerpent(supporterUnit, targetUnit) {
        let success = false;
        let supportId = supporterUnit.support;
        for (let unit of [supporterUnit, targetUnit]) {
            let buffAmount = getAtkBuffAmount(supportId);
            if (unit.atkBuff < buffAmount) { unit.atkBuff = buffAmount; success = true; }
            buffAmount = getSpdBuffAmount(supportId);
            if (unit.spdBuff < buffAmount) { unit.spdBuff = buffAmount; success = true; }
            buffAmount = getDefBuffAmount(supportId);
        }
        if (supporterUnit.canRallyForcibly() || targetUnit.canRalliedForcibly()) {
            success = true;
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
            if (supporterUnit.specialCount === 0) {
                switch (supporterUnit.special) {
                    case Special.Chiyu:
                        healAmount += 10;
                        supporterUnit.setSpecialCountToMax();
                        break;
                }
            }

            let healedAmount = targetUnit.heal(healAmount);
            this.writeSimpleLogLine(`${targetUnit.getNameWithGroup()}は${healedAmount}回復`);

            for (let skillId of supporterUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.GohoshiNoYorokobi1:
                        supporterUnit.heal(Math.floor(healedAmount * 0.5));
                        break;
                    case PassiveB.GohoshiNoYorokobi2:
                        supporterUnit.heal(Math.floor(healedAmount * 0.75));
                        break;
                    case PassiveB.GohoshiNoYorokobi3:
                        supporterUnit.heal(Math.floor(healedAmount * 1.0));
                        break;
                    case Support.Reconcile:
                        supporterUnit.heal(7);
                        break;
                    case Support.Martyr:
                    case Support.MartyrPlus:
                        supporterUnit.heal(Math.floor(supporterUnit.currentDamage * 0.5));
                        break;
                }

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
            if (supporterUnit.specialCount === 0) {
                for (let skillId of supporterUnit.enumerateSkills()) {
                    let funcMap = applySpecialSkillEffectWhenHealingFuncMap;
                    if (funcMap.has(skillId)) {
                        let func = funcMap.get(skillId);
                        if (typeof func === "function") {
                            func.call(this, supporterUnit, targetUnit);
                        } else {
                            console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                        }
                    }
                    switch (skillId) {
                        case Special.Tensho:
                            for (let unit of this.enumerateUnitsInTheSameGroupOnMap(supporterUnit, false)) {
                                if (unit === targetUnit) {
                                    continue;
                                }
                                unit.heal(10);
                            }
                            supporterUnit.setSpecialCountToMax();
                            break;
                    }
                }
            } else {
                // 奥義カウントを進める
                let reduceAmount = 1;
                for (let skillId of supporterUnit.enumerateSkills()) {
                    if (noEffectOnSpecialCooldownChargeOnSupportSkillSet.has(skillId)) {
                        reduceAmount = 0;
                        break;
                    }
                }
                supporterUnit.reduceSpecialCount(reduceAmount);
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
    /**
     * @param  {Unit} supporterUnit
     * @param  {Unit} targetUnit
     * @param  {Tile} supportTile=null
     */
    applySupportSkill(supporterUnit, targetUnit, supportTile = null) {
        if (supporterUnit.supportInfo == null) {
            return false;
        }

        if (this.__applySupportSkill(supporterUnit, targetUnit)) {
            if (supporterUnit.supportInfo.assistType === AssistType.Refresh) {
                supporterUnit.battleContext.isRefreshActivated = true;
            }
            supporterUnit.isSupportDone = true;
            if (!supporterUnit.isActionDone) {
                // endUnitActionAndGainPhaseIfPossible()を呼んでしまうと未来を映す瞳が実行される前にターン終了してしまう
                supporterUnit.endAction();
            }

            // サポートを行う側
            for (let skillId of supporterUnit.enumerateSkills()) {
                let funcMap = applySupportSkillForSupporterFuncMap;
                if (funcMap.has(skillId)) {
                    let func = funcMap.get(skillId);
                    if (typeof func === "function") {
                        func.call(this, supporterUnit, targetUnit, supportTile);
                    } else {
                        console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                    }
                }
                switch (skillId) {
                    case Support.GoldSerpent: {
                        let currentTurn = g_appData.globalBattleContext.currentTurn;
                        if (currentTurn >= 2) {
                            supporterUnit.addStatusEffect(StatusEffectType.Canto1);
                            targetUnit.addStatusEffect(StatusEffectType.Canto1);
                        }
                        if (currentTurn >= 3) {
                            supporterUnit.addStatusEffect(StatusEffectType.Treachery);
                            targetUnit.addStatusEffect(StatusEffectType.Treachery);
                        }
                        if (currentTurn >= 4) {
                            supporterUnit.addStatusEffect(StatusEffectType.DualStrike);
                            targetUnit.addStatusEffect(StatusEffectType.DualStrike);
                        }
                        if (!supporterUnit.isOneTimeActionActivatedForWeapon) {
                            supporterUnit.isActionDone = false;
                            supporterUnit.isOneTimeActionActivatedForWeapon = true;
                        }
                    }
                        break;
                    case Weapon.JollyJadeLance:
                        if (!supporterUnit.isOneTimeActionActivatedForWeapon) {
                            supporterUnit.applyAtkBuff(6);
                            supporterUnit.applySpdBuff(6);
                            supporterUnit.isActionDone = false;
                            supporterUnit.isOneTimeActionActivatedForWeapon = true;
                        }
                        break;
                    case Support.DragonsDance:
                        this.writeSimpleLogLine(`${supporterUnit.nameWithGroup}の補助スキル効果発動可能まで残り${supporterUnit.restSupportSkillAvailableTurn}ターン`);
                        if (g_appData.globalBattleContext.currentTurn >= 2 &&
                            supporterUnit.restSupportSkillAvailableTurn === 0) {
                            this.writeSimpleLogLine(`${supporterUnit.nameWithGroup}の補助スキル効果が発動`);
                            supporterUnit.isActionDone = false;
                            supporterUnit.applyBuffs(6, 6, 0, 0);
                            supporterUnit.addStatusEffect(StatusEffectType.Isolation);
                            supporterUnit.restSupportSkillAvailableTurn = 3;
                            this.writeSimpleLogLine(`${supporterUnit.nameWithGroup}の補助スキル効果発動可能まで残り${supporterUnit.restSupportSkillAvailableTurn}ターン`);
                        } else {
                            this.writeSimpleLogLine(`${supporterUnit.nameWithGroup}の補助スキル効果は発動せず`);
                        }
                        break;
                    case Support.FateUnchanged:
                        if (!supporterUnit.isOneTimeActionActivatedForSupport) {
                            supporterUnit.addStatusEffect(StatusEffectType.Isolation);
                            supporterUnit.isActionDone = false;
                            supporterUnit.isOneTimeActionActivatedForSupport = true;
                        }
                        for (let unit of this.__findNearestEnemies(supporterUnit, 4)) {
                            for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                                u.addStatusEffect(StatusEffectType.Exposure);
                            }
                        }
                        for (let unit of this.__findNearestEnemies(targetUnit, 4)) {
                            for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                                u.addStatusEffect(StatusEffectType.Exposure);
                            }
                        }
                        break;
                    case Support.AFateChanged:
                        if (!supporterUnit.isOneTimeActionActivatedForSupport) {
                            supporterUnit.addStatusEffect(StatusEffectType.Isolation);
                            supporterUnit.isActionDone = false;
                            supporterUnit.isOneTimeActionActivatedForSupport = true;
                        }
                        for (let effect of targetUnit.getPositiveStatusEffects()) {
                            supporterUnit.addStatusEffect(effect);
                        }
                        if (!targetUnit.hasStatusEffect(StatusEffectType.Panic)) {
                            supporterUnit.applyAtkBuff(targetUnit.atkBuff);
                            supporterUnit.applySpdBuff(targetUnit.spdBuff);
                            supporterUnit.applyDefBuff(targetUnit.defBuff);
                            supporterUnit.applyResBuff(targetUnit.resBuff);
                        }
                        break;
                    case Support.ToChangeFate:
                        if (!supporterUnit.isOneTimeActionActivatedForSupport) {
                            supporterUnit.applyAtkBuff(6);
                            supporterUnit.addStatusEffect(StatusEffectType.Isolation);
                            supporterUnit.isActionDone = false;
                            supporterUnit.isOneTimeActionActivatedForSupport = true;
                        }
                        break;
                    case Support.ToChangeFate2:
                        if (!supporterUnit.isOneTimeActionActivatedForSupport) {
                            supporterUnit.applyAtkBuff(6);
                            supporterUnit.applyDefBuff(6);
                            supporterUnit.addStatusEffect(StatusEffectType.Isolation);
                            supporterUnit.addStatusEffect(StatusEffectType.BonusDoubler);
                            supporterUnit.isActionDone = false;
                            supporterUnit.isOneTimeActionActivatedForSupport = true;
                        }
                        break;
                    case Support.FutureVision:
                    case Support.FutureVision2:
                        if (!supporterUnit.isOneTimeActionActivatedForSupport) {
                            supporterUnit.isActionDone = false;
                            supporterUnit.isOneTimeActionActivatedForSupport = true;
                        }
                        if (supporterUnit.support === Support.FutureVision2) {
                            for (let unit of this.__findNearestEnemies(supporterUnit, 4)) {
                                unit.applyAtkDebuff(-7);
                                unit.applyDefDebuff(-7);
                            }
                            for (let unit of this.__findNearestEnemies(targetUnit, 4)) {
                                unit.applyAtkDebuff(-7);
                                unit.applyDefDebuff(-7);
                            }
                        }
                        break;
                }
            }

            // サポートを受ける側
            for (let skillId of targetUnit.enumerateSkills()) {
                let funcMap = applySupportSkillForTargetUnitFuncMap;
                if (funcMap.has(skillId)) {
                    let func = funcMap.get(skillId);
                    if (typeof func === "function") {
                        func.call(this, supporterUnit, targetUnit, supportTile);
                    } else {
                        console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                    }
                }
            }

            // 再移動の評価
            let activated = this.__activateCantoIfPossible(supporterUnit);
            if (!activated) {
                supporterUnit.applyEndActionSkills();
            }

            this.__goToNextPhaseIfPossible(supporterUnit.groupId);
        }

        return false;
    }

    /**
     * 一喝、一喝+でのデバフ解除を行う
     * @param targetUnit
     * @returns {boolean} 実際にデバフを解除した場合にtrueを返す
     * @private
     */
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

        let assistType = determineAssistType(supporterUnit, targetUnit);
        switch (assistType) {
            case AssistType.Refresh:
                return canRefreshTo(targetUnit);
            case AssistType.Rally:
                return supporterUnit.canRallyForcibly() ||
                    supporterUnit.canRallyTo(targetUnit, 1) ||
                    targetUnit.canRalliedForcibly();
            case AssistType.Heal:
                switch (supporterUnit.support) {
                    case Support.MaidensSolace:
                        if (targetUnit.hasNegativeStatusEffect()) return true;
                        return targetUnit.isDebuffed || Math.min(targetUnit.currentDamage, supporterUnit.hp - 1) > 0;
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
                    let result = this.__getUserLossHpAndTargetHealHpForDonorHeal(supporterUnit, targetUnit);
                    if (!result.success) return false;
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
        let funcMap = findTileAfterMovementAssistFuncMap;
        let skillId = unit.support;
        if (funcMap.has(skillId)) {
            let func = funcMap.get(skillId);
            if (typeof func === "function") {
                return func.call(this, unit, target, tile);
            } else {
                console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
            }
        }

        switch (unit.support) {
            case Support.FateUnchanged:
            case Support.ToChangeFate:
            case Support.ToChangeFate2:
            case Support.AFateChanged:
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
            case Support.FoulPlay:
            case Support.Swap:
            case Support.FutureVision:
            case Support.FutureVision2:
                return this.__findTileAfterSwap(unit, target, tile);
            case Support.Pivot:
                return this.__findTileAfterPivot(unit, target, tile);
            default:
                this.writeErrorLine(`unknown support ${unit.supportInfo.name}`);
                return new MovementAssistResult(false, null, null);
        }
    }

    __applySupportSkill(supporterUnit, targetUnit) {
        let assistType = supporterUnit.supportInfo.assistType;
        if (isRallyHealSkill(supporterUnit.support)) {
            assistType = AssistType.Rally;
        }
        let result = false;
        switch (assistType) {
            case AssistType.Refresh:
                return this.__applyRefresh(supporterUnit, targetUnit);
            case AssistType.Heal:
                if (supporterUnit.support === Support.Sacrifice ||
                    supporterUnit.support === Support.MaidensSolace) {
                    let healAmount = Math.min(targetUnit.currentDamage, supporterUnit.hp - 1);
                    if (healAmount > 0) {
                        targetUnit.heal(healAmount);
                        supporterUnit.takeDamage(healAmount, true);
                        this.writeSimpleLogLine(`${targetUnit.getNameWithGroup()}は${healAmount}回復`);
                    }
                    if (supporterUnit.support === Support.MaidensSolace) {
                        targetUnit.clearNegativeStatusEffects();
                    }
                    return healAmount > 0 || this.__executeHarshCommand(targetUnit);
                } else {
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
                    case Support.RallyUpDef:
                    case Support.RallyUpDefPlus:
                    case Support.RallyUpRes:
                    case Support.RallyUpResPlus:
                        return this.__applyRallyUp(supporterUnit, targetUnit);
                    case Support.HarshCommandPlus: {
                        let hasNegativeStatusEffect = targetUnit.hasNegativeStatusEffect();
                        targetUnit.clearNegativeStatusEffects();
                        return this.__executeHarshCommand(targetUnit) || hasNegativeStatusEffect;
                    }
                    case Support.HarshCommand:
                        return this.__executeHarshCommand(targetUnit);
                    case Support.GoldSerpent:
                        return this.__applyGoldSerpent(supporterUnit, targetUnit);
                    default:
                        result = this.__applyRally(supporterUnit, targetUnit);
                        if (isRallyHealSkill(supporterUnit.support)) {
                            this.__applyHeal(supporterUnit, targetUnit);
                            // TODO: 検証する
                            // ひとまずプレーヤーは強制的に補助が成功するとする
                            result = true;
                        }
                        return result;
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
        if (targetUnit.restHpPercentage === 100) {
            return false;
        }

        if (supporterUnit.hp === targetUnit.hp) {
            return false;
        }

        if (supporterUnit.hp < targetUnit.hp
            && supporterUnit.hasStatusEffect(StatusEffectType.DeepWounds)
        ) {
            return false;
        }

        // noinspection RedundantIfStatementJS
        if (targetUnit.hp < supporterUnit.hp
            && targetUnit.hasStatusEffect(StatusEffectType.DeepWounds)) {
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
        this.__goToNextPhaseIfPossible(groupId);
    }
    /**
     * @param  {Unit} unit
     */
    endUnitActionAndGainPhaseIfPossible(unit) {
        unit.endAction();
        this.__goToNextPhaseIfPossible(unit.groupId);
    }

    __endUnitActionOrActivateCanto(unit) {
        unit.endAction();

        // 再移動の評価
        let activated = this.__activateCantoIfPossible(unit);
        if (!activated) {
            unit.applyEndActionSkills();
        }

        this.__goToNextPhaseIfPossible(unit.groupId);
    }

    __goToNextPhaseIfPossible(groupId) {
        if (groupId === UnitGroupType.Ally) {
            if (!this.__isThereActionableAllyUnit()) {
                // 味方全員の行動が終了したので敵ターンへ
                this.simulateBeginningOfEnemyTurn();
            }
        } else {
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
            if (selectedItems.length === 0) {
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

    __applySnag4Skill(unit, debuffFunc) {
        for (let nearestEnemy of this.__findNearestEnemies(unit, 4)) {
            debuffFunc.call(this, nearestEnemy);
            nearestEnemy.addStatusEffect(StatusEffectType.Sabotage)
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(nearestEnemy, 2)) {
                if (unit.__hasSaveSkills()) {
                    debuffFunc.call(this, unit);
                    unit.addStatusEffect(StatusEffectType.Sabotage)
                }
            }
        }
    }

    __applySnag4Skills(unit1, unit2, debuffFunc) {
        this.__applySnag4Skill(unit1, debuffFunc);
        this.__applySnag4Skill(unit2, debuffFunc);
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

function moveStructureToEmptyTileOfMap(structure, ignoresUnit = true) {
    g_appData.map.placeObjToEmptyTile(structure, ignoresUnit);
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

function moveUnitToMap(unit, x, y, endsActionIfActivateTrap = false, executesTrap = true) {
    let moveResult = placeUnitToMap(unit, x, y, endsActionIfActivateTrap, executesTrap);
    g_trashArea.removeStructure(unit);
    return moveResult;
}

function moveUnitToEmptyTileOfMap(unit) {
    let moveResult = placeUnitToMap(unit, 0, 0);
    g_trashArea.removeStructure(unit);
    return moveResult;
}

function moveUnit(unit, tile, endsActionIfActivateTrap = false, executesTrap = true) {
    return moveUnitToMap(unit, tile.posX, tile.posY, endsActionIfActivateTrap, executesTrap);
}

function placeUnitToMap(unit, x, y, endsActionIfActivateTrap = false, executesTrap = true) {
    g_appData.map.placeUnit(unit, x, y);
    unit.ownerType = OwnerType.Map;

    // updateAllUnitSpur();
    if (unit.placedTile == null) {
        console.error(`could not place unit to map (${x}, ${y})`);
        console.log(unit);
        return MoveResult.Failure;
    }

    if (executesTrap) {
        return executeTrapIfPossible(unit, endsActionIfActivateTrap);
    }
    else {
        return MoveResult.Success;
    }
}
/**
 * @param {Unit} unit
 * @param {boolean} endsActionIfActivateTrap
 * @returns {Number}
 */
function executeTrapIfPossible(unit, endsActionIfActivateTrap = false) {
    let tile = unit.placedTile;
    let result = MoveResult.Success;
    if (tile == null) {
        return result;
    }

    let obj = tile.obj;

    if (unit.groupId === UnitGroupType.Ally && obj instanceof TrapBase) {
        // トラップ床発動
        if (obj.isExecutable) {
            let trapCondSatisfied = false;
            switch (obj.constructor) {
                case HeavyTrap:
                case BoltTrap:
                    trapCondSatisfied =
                        unit.passiveB !== PassiveB.Wanakaijo3 &&
                        unit.passiveB !== PassiveB.DisarmTrap4;
                    break;
                case HexTrap:
                    trapCondSatisfied = unit.hp <= obj.level * 5 + 35 - (unit.passiveB === PassiveB.DisarmTrap4 ? 10 : 0);
                    break;
            }
            if (trapCondSatisfied) {
                if (endsActionIfActivateTrap) {
                    g_app.endUnitActionAndGainPhaseIfPossible(unit);
                }

                g_app.audioManager.playSoundEffect(SoundEffectId.Trap);
                g_app.executeStructure(obj);
                if (obj instanceof HeavyTrap) {
                    result = MoveResult.HeavyTrapActivated;
                }
                else if (obj instanceof BoltTrap) {
                    result = MoveResult.BoltTrapActivated;
                }
                else if (obj instanceof HexTrap) {
                    result = MoveResult.HexTrapActivated;
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
    } else if (target instanceof OffenceStructureBase) {
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
    } else if (target instanceof DefenceStructureBase) {
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
    } else if (target instanceof Unit) {
        moveUnitToEmptyTileOfMap(target);
    }
}

function __getTileFromMapElement(item) {
    if (item instanceof Unit || item instanceof StructureBase) {
        return item.placedTile;
    }
    else if (item instanceof Tile) {
        return item;
    }
    return null;
}

function __getUnselectedTileBgColor(tile) {
    // 攻撃範囲など諸々込みの色を取得します。
    let cell = new Cell();
    g_appData.map.setCellStyle(tile, cell);
    return cell.bgColor;
}

function __clearSelectedTileColor() {
    for (let tile of g_appData.map.enumerateTiles()) {
        updateCellBgColor(tile.posX, tile.posY, __getUnselectedTileBgColor(tile));
    }
}

function syncSelectedTileColor() {
    __clearSelectedTileColor();

    for (let item of g_appData.enumerateItems()) {
        if (item.isSelected) {
            updateCellBgColor(item.posX, item.posY, SelectedTileColor);
        }
    }
}

function updateMapUi() {
    let mapArea = document.getElementById('mapArea');
    if (mapArea == null) {
        return;
    }

    g_appData.map.updateTiles();
    let table = g_appData.map.toTable(g_appData.globalBattleContext.currentPhaseType);
    table.onDragOverEvent = "f_dragover(event)";
    table.onDropEvent = "f_drop(event)";
    table.onDragEndEvent = "table_dragend(event)";
    if (isSummonerDuelsMap(g_appData.map._type)) {
        // 得点エリアを表示
        let scale = 4 / 10;
        let verticalPercent = 100 * (1 / 2 + g_appData.globalBattleContext.summonerDuelsPointAreaOffset / 6);
        let bgImageInfo = new BackgroundImageInfo(
            g_summonerDuelsMapRoot + "SummonerDuels_PointArea.png",
            `50% ${verticalPercent.toFixed()}%`,
            `${(100 * 6 / 8).toFixed()}% ${(100 * scale).toFixed()}%`
        );
        table.backgroundImages.splice(0, 0, bgImageInfo);
    }

    // とりあえず海を後ろに表示しておく。海じゃないやつがあったらどうにかして分岐するか、マップ画像を加工する
    {
        let bgImageInfo = new BackgroundImageInfo(
            g_corsImageRootPath + "Maps/WavePatternSea.png"
        );
        table.backgroundImages.push(bgImageInfo);
    }

    let tableElem = table.updateTableElement();
    if (mapArea.childElementCount === 0) {
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
    g_appData.syncMapKind();
    updateMap();
}

function removeBreakableWallsFromTrashBox() {
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
    g_appData.resetBattleMapPlacement(true);
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

    g_appData.resetBattleMapPlacement();

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
        if (g_appData.gameMode === GameMode.PawnsOfLoki) {
            posY = 0;
        }
        for (let unit of g_app.enumerateEnemyUnits()) {
            moveUnitToMap(unit, posX, posY);
            ++posX;
            if (posX === g_app.map.width) {
                posX = 0;
                ++posY;
            }
        }
    }

    {
        let posX = 0;
        let posY = g_app.map.height - 2;
        let maxCount = 100;
        if (g_appData.gameMode === GameMode.PawnsOfLoki) {
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
                if (posX === g_app.map.width) {
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
        case GameMode.SummonerDuels:
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
    g_appData.settings.loadSettings();
    if (g_appData.gameMode === GameMode.ResonantBattles) {
        g_app.__setUnitsForResonantBattles();
    }
    g_app.updateAllUnitSpur();

    let turnText = g_appData.currentTurn === 0 ? "戦闘開始前" : "ターン" + g_appData.currentTurn;
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
    g_appData.settings.saveSettings();
    console.log("current cookie:" + document.cookie);
    g_app.writeSimpleLogLine("ターン" + g_appData.currentTurn + "の設定を保存しました。");
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
