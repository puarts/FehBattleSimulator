
class DamageCalculatorWrapper {
    /**
     * @param  {UnitManager} unitManager
     * @param  {BattleMap} map
     * @param  {GlobalBattleContext} globalBattleContext
     * @param  {LoggerBase} logger
     */
    constructor(unitManager, map, globalBattleContext, logger) {
        this._unitManager = unitManager;
        this.map = map;
        this.globalBattleContext = globalBattleContext;
        this._damageCalc = new DamageCalculator(logger, unitManager, map);
        this.logger = logger;
        this.profiler = new PerformanceProfile();
        this._combatHander = new PostCombatSkillHander(unitManager, map, globalBattleContext, logger, this._damageCalc);

        this.isSummonerDualCalcEnabled = false;

        // 高速化用
        /**
         * @callback skillEffectFuncWithPotentialDamage
         * @param {Unit} targetUnit
         * @param {Unit} enemyUnit
         * @param {Boolean} calcPotentialDamage
         *
         * @callback skillEffectFunc
         * @param {Unit} targetUnit
         * @param {Unit} enemyUnit
        */
        /** @type {Object.<string, skillEffectFuncWithPotentialDamage>} */
        this._applySkillEffectForAtkUnitFuncDict = {};
        /** @type {Object.<string, skillEffectFuncWithPotentialDamage>} */
        this._applySkillEffectForDefUnitFuncDict = {};
        /** @type {Object.<string, skillEffectFuncWithPotentialDamage>} */
        this._applySkillEffectForUnitFuncDict = {};
        /** @type {Object.<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit) => void>} */
        this._applySpecialSkillEffectFuncDict = {};

        this.__init__applySkillEffectForAtkUnitFuncDict();
        this.__init__applySkillEffectForDefUnitFuncDict();
        this.__init__applySkillEffectForUnitFuncDict();
        this.__init__applySpecialSkillEffect();
        this.__init__skillFunctions();
    }

    __init__skillFunctions() {
        // 機先
        this.catchFuncs = {
            // 機先3
            [PassiveA.AtkSpdCatch3]: (tu, eu) => this.__applyCatch3(tu, eu, 1, 1, 0, 0),
            [PassiveA.AtkDefCatch3]: (tu, eu) => this.__applyCatch3(tu, eu, 1, 0, 1, 0),
            [PassiveA.AtkResCatch3]: (tu, eu) => this.__applyCatch3(tu, eu, 1, 0, 0, 1),
            [PassiveA.SpdDefCatch3]: (tu, eu) => this.__applyCatch3(tu, eu, 0, 1, 1, 0),
            [PassiveA.SpdResCatch3]: (tu, eu) => this.__applyCatch3(tu, eu, 0, 1, 0, 1),
            [PassiveA.DefResCatch3]: (tu, eu) => this.__applyCatch3(tu, eu, 0, 0, 1, 1),
            // 機先4
            [PassiveA.AtkSpdCatch4]: (tu, eu) => this.__applyCatch4(tu, eu, 1, 1, 0, 0),
            [PassiveA.AtkDefCatch4]: (tu, eu) => this.__applyCatch4(tu, eu, 1, 0, 1, 0),
            [PassiveA.AtkResCatch4]: (tu, eu) => this.__applyCatch4(tu, eu, 1, 0, 0, 1),
            [PassiveA.SpdDefCatch4]: (tu, eu) => this.__applyCatch4(tu, eu, 0, 1, 1, 0),
            [PassiveA.SpdResCatch4]: (tu, eu) => this.__applyCatch4(tu, eu, 0, 1, 0, 1),
            [PassiveA.DefResCatch4]: (tu, eu) => this.__applyCatch4(tu, eu, 0, 0, 1, 1),
        };
    }

    get log() {
        return this._damageCalc.log;
    }

    get simpleLog() {
        return this._damageCalc.simpleLog;
    }

    get currentTurn() {
        return this.globalBattleContext.currentTurn;
    }

    get isOddTurn() {
        return this.globalBattleContext.isOddTurn;
    }
    get isEvenTurn() {
        return this.globalBattleContext.isEvenTurn;
    }

    get isLogEnabled() {
        return this._damageCalc.isLogEnabled;
    }

    /** @type {UnitManager} */
    get unitManager() {
        return this._unitManager;
    }

    set isLogEnabled(value) {
        this._damageCalc.isLogEnabled = value;
    }

    clearLog() {
        this._damageCalc.clearLog();
    }

    writeLog(message) {
        this._damageCalc.writeLog(message);
    }

    writeDebugLog(message) {
        this._damageCalc.writeDebugLog(message);
    }

    /**
     * 戦闘ダメージを計算し、計算結果に基づき、ユニットの状態を更新します。戦闘後に発動するスキルの効果も反映されます。
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Tile} tileToAttack=null
     * @param  {Number} gameMode=GameMode.Arena
     * @returns {CombatResult}
     */
    updateDamageCalculation(atkUnit, defUnit, tileToAttack = null, gameMode = GameMode.Arena) {
        /** @type {DamageCalcEnv} */
        let damageCalcEnv = new DamageCalcEnv().setUnits(atkUnit, defUnit)
            .setTileToAttack(tileToAttack).setDamageType(DamageType.ActualDamage).setGameMode(gameMode)
            .setBattleMap(this.map);

        this.#initBattleContext(atkUnit, defUnit);
        atkUnit.initReservedState();
        defUnit.initReservedState();

        atkUnit.precombatContext.initContext();
        defUnit.precombatContext.initContext();

        damageCalcEnv.withBeforeCombatPhaseGroup('戦闘前', () => {
            this.__applySkillEffectsBeforeCombat(atkUnit, defUnit, damageCalcEnv, false);
            this.__applySkillEffectsBeforeCombat(defUnit, atkUnit, damageCalcEnv, false);
        });
        atkUnit.applyReservedState();
        defUnit.applyReservedState();

        // 攻撃対象以外の戦闘前の範囲奥義ダメージ
        let precombatDamages = new Map();
        damageCalcEnv.withBeforeCombatPhaseGroup('範囲奥義前(周囲)', () => {
            this.__applySkillEffectsBeforePrecombat(atkUnit, defUnit, damageCalcEnv, false);
            this.__applySkillEffectsBeforePrecombat(defUnit, atkUnit, damageCalcEnv, false);
        });
        atkUnit.applyReservedState();
        defUnit.applyReservedState();
        if (atkUnit.canActivatePrecombatSpecial() &&
            !atkUnit.battleContext.cannotTriggerPrecombatSpecial) {
            // 範囲攻撃ダメージを周囲の敵に反映
            let tiles;
            damageCalcEnv.withBeforeCombatPhaseGroup('範囲奥義の範囲取得時', () => {
                tiles = this.map.enumerateRangedSpecialTiles(defUnit.placedTile, atkUnit, damageCalcEnv);
            });
            for (let tile of tiles) {
                let isNotDefUnit = tile.placedUnit !== defUnit;
                let isNotSaverUnit = tile.placedUnit !== this.__getSaverUnitIfPossible(atkUnit, defUnit, damageCalcEnv);
                if (tile.placedUnit != null &&
                    isNotDefUnit &&
                    isNotSaverUnit &&
                    tile.placedUnit.groupId === defUnit.groupId) {
                    let targetUnit = tile.placedUnit;
                    let damage = this.calcPrecombatSpecialDamage(atkUnit, targetUnit, damageCalcEnv);
                    this.writeLog(`atkUnit.battleContext.additionalDamageOfSpecial: ${atkUnit.battleContext.additionalDamageOfSpecial}`);
                    precombatDamages.set(targetUnit, damage);
                    this.writeLog(`${atkUnit.specialInfo.name}により${targetUnit.getNameWithGroup()}に${damage}ダメージ`);
                    atkUnit.precombatContext.damageCountOfSpecialAtTheSameTime++;
                    targetUnit.takeDamage(damage, true);
                }
            }
            if (precombatDamages.size > 0) {
                let damageLog = '';
                for (let [unit, damage] of precombatDamages) {
                    damageLog += `${unit.name}に<span class="log-damage">${damage}</span>、`;
                }
                this._damageCalc.writeSimpleLog(`${atkUnit.specialInfo.name}により周囲の${damageLog.slice(0, -1)}のダメージ`);
            }
        }

        // 戦闘ダメージ計算
        let result =
            this.calcDamage(atkUnit, defUnit, tileToAttack, DamageType.ActualDamage, gameMode, damageCalcEnv);

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

        // この戦闘中に満たしたフラグを反映
        if (atkUnit.isStyleActive) {
            atkUnit.battleContext.isStyleUsed = true;
        }

        // 戦闘後発動のスキル等を評価
        this._combatHander.applyPostCombatProcess(atkUnit, result.defUnit, damageCalcEnv);

        if (defUnit !== result.defUnit) {
            // 護り手で一時的に戦闘対象が入れ替わっていたので元に戻す
            let saverUnit = result.defUnit;
            if (!saverUnit.isDead) {
                saverUnit.restoreOriginalTile();
            }
            defUnit.restoreOriginalTile();
        }

        this.globalBattleContext.numOfCombatOnCurrentTurn++;
        return result;
    }



    /**
     *  一時的に戦闘のダメージを計算します。
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Tile} tileToAttack=null
     * @param damageType
     * @param  {Number} gameMode=GameMode.Arena
     * @returns {CombatResult}
     */
    calcDamageTemporary(
        atkUnit,
        defUnit,
        tileToAttack = null,
        damageType = DamageType.EstimatedDamage,
        gameMode = GameMode.Arena
    ) {
        // TODO: tmpSpecialCountを使用するようにする
        let atkSpecialCount = atkUnit.specialCount;
        this.#initBattleContext(atkUnit, defUnit);

        let result = this.calcDamage(atkUnit, defUnit, tileToAttack, damageType, gameMode);
        if (defUnit !== result.defUnit) {
            // 護り手で一時的に戦闘対象が入れ替わっていたので元に戻す
            let saverUnit = result.defUnit;
            let tile = saverUnit.placedTile;
            saverUnit.restoreOriginalTile();
            this.logger.trace2(`[護り手後] ${saverUnit.getLocationStr()}`);
            tile.setUnit(defUnit);
        }

        atkUnit.specialCount = atkSpecialCount;
        return result;
    }

    /**
     * 戦闘のダメージを計算します。
     * （攻撃対象への範囲奥義、戦闘。戦闘後のスキル効果は除く）
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Tile} tileToAttack=null
     * @param  {number} damageType=DamageType.ActualDamage
     * @param  {number} gameMode=GameMode.Arena
     * @param  {DamageCalcEnv} env
     * @returns {CombatResult}
     */
    calcDamage(
        atkUnit,
        defUnit,
        tileToAttack = null,
        damageType = DamageType.ActualDamage,
        gameMode = GameMode.Arena,
        env = null,
    ) {
        let calcPotentialDamage = damageType === DamageType.PotentialDamage;
        let self = this;
        /** @type {CombatResult} */
        let result;
        /** @type {DamageCalcEnv} */
        let damageCalcEnv = env || new DamageCalcEnv().setUnits(atkUnit, defUnit)
            .setTileToAttack(tileToAttack).setDamageType(damageType).setGameMode(gameMode).setBattleMap(this.map);
        this.logger.trace2(`[マス移動前] ${atkUnit.getLocationStr(tileToAttack)}`);
        using_(new ScopedTileChanger(atkUnit, tileToAttack, () => {
            self.updateUnitSpur(atkUnit, calcPotentialDamage, defUnit, damageType);
            self.updateUnitSpur(defUnit, calcPotentialDamage, atkUnit, damageType);
        }), () => {
            let units = [...this.map.enumerateUnitsOnMap()];
            UnitUtil.withCache(units, () => {
                this.logger.trace2(`[マス移動後] ${atkUnit.getLocationStr(tileToAttack)}`);
                this.#initBattleContext(atkUnit, defUnit);
                atkUnit.initReservedState();
                defUnit.initReservedState();
                if (damageType === DamageType.EstimatedDamage) {
                    damageCalcEnv.withBeforeCombatPhaseGroup('戦闘前', () => {
                        this.__applySkillEffectsBeforeCombat(atkUnit, defUnit, damageCalcEnv, false);
                        this.__applySkillEffectsBeforeCombat(defUnit, atkUnit, damageCalcEnv, false);
                    });
                    atkUnit.applyReservedState();
                    defUnit.applyReservedState();
                }

                damageCalcEnv.withBeforeCombatPhaseGroup('範囲奥義前(敵)', () => {
                    this.__applySkillEffectsBeforePrecombat(atkUnit, defUnit, damageCalcEnv, true);
                    this.__applySkillEffectsBeforePrecombat(defUnit, atkUnit, damageCalcEnv, true);
                });
                atkUnit.applyReservedState();
                defUnit.applyReservedState();

                // 戦闘前奥義の計算に影響するマップ関連の設定
                {
                    atkUnit.battleContext.isOnDefensiveTile = atkUnit.isOnMap && atkUnit.placedTile.isDefensiveTile && !atkUnit.battleContext.invalidatesDefensiveTerrainEffect;
                    defUnit.battleContext.isOnDefensiveTile = defUnit.isOnMap && defUnit.placedTile.isDefensiveTile && !defUnit.battleContext.invalidatesDefensiveTerrainEffect;
                }

                atkUnit.saveCurrentHpAndSpecialCount();
                defUnit.saveCurrentHpAndSpecialCount();

                // 戦闘前ダメージ計算
                this.calcPreCombatResult(damageCalcEnv);

                // 戦闘ダメージ計算
                result = self.calcCombatResult(damageCalcEnv);

                // ダメージプレビュー用にスナップショットに戦闘中バフ値をコピー
                atkUnit.copySpursToSnapshot();
                damageCalcEnv.defUnit.copySpursToSnapshot();
            });
        });
        this.logger.trace2(`[行動後] ${atkUnit.getLocationStr(tileToAttack)}`);
        return result;
    }

    /**
     * @param {DamageCalcEnv} damageCalcEnv
     */
    calcPreCombatResult(damageCalcEnv) {
        let self = this;
        let atkUnit = damageCalcEnv.atkUnit;
        let defUnit = damageCalcEnv.defUnit;
        let calcPotentialDamage = damageCalcEnv.calcPotentialDamage;
        let damageType = damageCalcEnv.damageType;

        let preCombatDamage = 0;
        let preCombatDamageWithOverkill = 0;

        let canTriggerPrecombatSpecial = !atkUnit.battleContext.cannotTriggerPrecombatSpecial;
        let canActivatePrecombatSpecial = atkUnit.canActivatePrecombatSpecial() && canTriggerPrecombatSpecial;
        let wasPrecombatSpecialActivated = false;
        if (canActivatePrecombatSpecial && !calcPotentialDamage) {
            wasPrecombatSpecialActivated = true;
            if (damageType === DamageType.EstimatedDamage) {
                damageCalcEnv.withBeforeCombatPhaseGroup('範囲奥義の範囲取得時', () => {
                    atkUnit.precombatSpecialTiles =
                        Array.from(this.map.enumerateRangedSpecialTiles(defUnit.placedTile, atkUnit, damageCalcEnv));
                });
            }
            [preCombatDamage, preCombatDamageWithOverkill] =
                self.calcPrecombatSpecialResult(atkUnit, defUnit, damageCalcEnv);
            // NOTE: 護り手が範囲にいる場合は護り手に対してダメージを計算しないといけないのでここではまだatkUnitのPrecombatStateはクリアしない
            defUnit.battleContext.clearPrecombatState();

            // 戦闘開始時のHPを保存
            defUnit.battleContext.restHp = defUnit.restHp;
        }

        let actualDefUnit = defUnit;
        if (!calcPotentialDamage) {
            let saverUnit = self.__getSaverUnitIfPossible(atkUnit, defUnit, damageCalcEnv);
            damageCalcEnv.setSaverUnit(saverUnit);
            if (saverUnit != null) {
                // 護り手がいるときは護り手に対する戦闘前奥義のダメージを結果として返す
                preCombatDamage = 0;
                preCombatDamageWithOverkill = 0;
                if (self.isLogEnabled) self.writeDebugLog(`${saverUnit.getNameWithGroup()}による護り手発動`);
                self.__initSaverUnit(saverUnit, defUnit, damageType);
                if (canActivatePrecombatSpecial) {
                    // 戦闘前奥義の範囲にいるユニットを列挙して護り手がいれば範囲奥義の計算を行う
                    let tiles;
                    damageCalcEnv.withBeforeCombatPhaseGroup('範囲奥義の範囲取得時', () => {
                        tiles = this.map.enumerateRangedSpecialTiles(defUnit.placedTile, atkUnit, damageCalcEnv);
                    });
                    for (let tile of tiles) {
                        if (tile.placedUnit === saverUnit) {
                            [preCombatDamage, preCombatDamageWithOverkill] =
                                self.calcPrecombatSpecialResult(atkUnit, saverUnit, damageCalcEnv);
                            saverUnit.battleContext.clearPrecombatState();
                            saverUnit.battleContext.restHp = saverUnit.restHp;
                        }
                    }
                }
                // NOTE: 護られるユニットの防御床情報を護り手に入れる
                saverUnit.battleContext.isOnDefensiveTile = defUnit.isOnMap && defUnit.placedTile.isDefensiveTile;
                actualDefUnit = saverUnit;
            }

            // NOTE: 範囲奥義の計算が全て終わったのでここでatkUnitの状態をクリアする
            atkUnit.battleContext.clearPrecombatState();
        }
        damageCalcEnv.combatResult.setPreCombatDamage(preCombatDamage)
            .setPreCombatDamageWithOverkill(preCombatDamageWithOverkill)
            .setWasPrecombatSpecialActivated(wasPrecombatSpecialActivated);

        atkUnit.precombatContext.copyTo(atkUnit.battleContext);
        defUnit.precombatContext.copyTo(defUnit.battleContext);
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     */
    #initBattleContext(atkUnit, defUnit) {
        // 戦闘参加ユニット以外の戦闘コンテキストを初期化する
        for (let unit of this.unitManager.enumerateAllUnitsOnMap()) {
            unit.initBattleContext(false);
        }
        atkUnit.initBattleContext(true);
        defUnit.initBattleContext(false);
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @param {boolean} isTargetFoe
     */
    __applySkillEffectsBeforeCombat(atkUnit, defUnit, damageCalcEnv, isTargetFoe) {
        let env = new DamageCalculatorWrapperEnv(this, atkUnit, defUnit, null);
        env.setName(`戦闘前`).setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setGroupLogger(damageCalcEnv.getBeforeCombatLogger());
        BEFORE_COMBAT_HOOKS.evaluateWithUnit(atkUnit, env);
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @param {boolean} isTargetFoe
     */
    __applySkillEffectsBeforePrecombat(atkUnit, defUnit, damageCalcEnv, isTargetFoe) {
        let env = new DamageCalculatorWrapperEnv(this, atkUnit, defUnit, null);
        let target = isTargetFoe ? "敵" : "周囲";
        env.setName(`範囲奥義前(${target})`).setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setGroupLogger(damageCalcEnv.getBeforeCombatLogger());
        BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS.evaluateWithUnit(atkUnit, env);
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Queensblade:
                    atkUnit.battleContext.cannotTriggerPrecombatSpecial = true;
                    defUnit.battleContext.cannotTriggerPrecombatSpecial = true;

                    atkUnit.battleContext.invalidatesDefensiveTerrainEffect = true;
                    defUnit.battleContext.invalidatesDefensiveTerrainEffect = true;

                    atkUnit.battleContext.invalidatesSupportEffect = true;
                    defUnit.battleContext.invalidatesSupportEffect = true;
            }
        }
    }

    /**
     * @param  {Unit} saverUnit
     * @param  {Unit} defUnit
     * @param damageType
     */
    __initSaverUnit(saverUnit, defUnit, damageType) {
        // 戦闘後効果の適用処理が間に挟まるので、restoreOriginalTile() はこの関数の外で行わなければならない
        saverUnit.saveOriginalTile();

        // Tile.placedUnit に本当は配置ユニットが設定されないといけないが、
        // 1マスに複数ユニットが配置される状況は考慮していなかった。
        // おそらく戦闘中だけの設定であれば不要だと思われるので一旦設定無視してる。
        // todo: 必要になったら、Tile.placedUnit を複数設定できるよう対応する
        this.logger.trace2(`[護り手配置前] ${saverUnit.getLocationStr()}`);
        saverUnit.placedTile = defUnit.placedTile;
        saverUnit.setPos(saverUnit.placedTile.posX, saverUnit.placedTile.posY);
        saverUnit.setFromPos(saverUnit.placedTile.posX, saverUnit.placedTile.posY);
        this.logger.trace2(`[護り手配置後] ${saverUnit.getLocationStr()}`);

        saverUnit.initBattleContext(defUnit.battleContext.initiatesCombat);
        saverUnit.battleContext.isSaviorActivated = true;
        saverUnit.saveCurrentHpAndSpecialCount();

        this.updateUnitSpur(saverUnit, false, null, damageType);
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @returns {number}
     */
    calcPrecombatSpecialDamage(atkUnit, defUnit, damageCalcEnv) {
        // 攻撃者のPrecombatSkillsの効果が対象の数だけ適用されないように1回1回クリアする
        atkUnit.battleContext.clearPrecombatState();
        this.__applyPrecombatSkills(atkUnit, defUnit, damageCalcEnv);
        return this._damageCalc.calcPrecombatSpecialDamage(atkUnit, defUnit, this.isSummonerDualCalcEnabled);
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     */
    __applyPrecombatSkills(atkUnit, defUnit, damageCalcEnv) {
        // 範囲奥義と戦闘中のどちらにも効くスキル効果の適用
        this.__applySkillEffectForPrecombatAndCombat(atkUnit, defUnit, false);
        this.__applySkillEffectForPrecombatAndCombat(defUnit, atkUnit, false);

        // 戦闘前ダメージ計算に影響するスキル効果の評価
        this.__applyPrecombatSpecialDamageMult(atkUnit);
        this.__applyPrecombatDamageReductionRatio(defUnit, atkUnit);
        this.__applyPrecombatDamageReduction(defUnit, atkUnit);
        this.__calcFixedAddDamage(atkUnit, defUnit, true);
        this.__calcFixedSpecialAddDamage(atkUnit, defUnit, true);

        // 守備、魔防のどちらを参照するか決定
        defUnit.battleContext.invalidatesReferenceLowerMit |= this.__canInvalidatesReferenceLowerMit(defUnit, atkUnit, true);
        this.__selectReferencingResOrDef(atkUnit, defUnit);

        damageCalcEnv.applyBeforeCombatSkill(`範囲奥義前(対${defUnit.nameWithGroup})`, atkUnit, defUnit,
            this.#applySkillEffectsBeforePrecombatSpecial, this);
    }

    #applySkillEffectsBeforePrecombatSpecial(targetUnit, enemyUnit, damageCalcEnv) {
        let env = new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, false);
        env.setName('範囲奥義前').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setGroupLogger(damageCalcEnv.getBeforeCombatLogger());
        BEFORE_AOE_SPECIAL_HOOKS.evaluateWithUnit(targetUnit, env);
    }

    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    calcPrecombatSpecialResult(atkUnit, defUnit, damageCalcEnv) {
        atkUnit.battleContext.clearPrecombatState();
        this.__applyPrecombatSkills(atkUnit, defUnit, damageCalcEnv);
        return this._damageCalc.calcPrecombatSpecialResult(atkUnit, defUnit,
            damageCalcEnv.gameMode === GameMode.SummonerDuels || this.isSummonerDualCalcEnabled);
    }

    /**
     * @param  {DamageCalcEnv} damageCalcEnv
     * @returns {CombatResult}
     */
    calcCombatResult(damageCalcEnv) {
        let sw = new Stopwatch(false);
        sw.start();
        let atkUnit = damageCalcEnv.atkUnit;
        let defUnit = damageCalcEnv.defUnit;
        let damageType = damageCalcEnv.damageType;

        this.combatPhase = NodeEnv.CombatPhase.AT_START_OF_COMBAT;
        let calcPotentialDamage = damageCalcEnv.calcPotentialDamage;
        let self = this;

        // TODO: この場所である必要がない効果は移動する
        // 戦闘後効果
        // ex) 戦闘開始後、敵に7ダメージ(戦闘中にダメージを減らす効果の対象外、ダメージ後のHPは最低1)など
        sw.section('戦闘開始', () => {
            this.__applySKillEffectForUnitAtBeginningOfCombat(atkUnit, defUnit, damageCalcEnv);
            this.__applySKillEffectForUnitAtBeginningOfCombat(defUnit, atkUnit, damageCalcEnv);
        });

        // self.profile.profile("__applySkillEffect", () => {
        sw.section('紋章バフアップデート', () => {
            this.updateUnitSpur(atkUnit, calcPotentialDamage, defUnit, damageType);
            this.updateUnitSpur(defUnit, calcPotentialDamage, atkUnit, damageType);
        });

        self.__applySkillEffect(atkUnit, defUnit, calcPotentialDamage);

        damageCalcEnv.applySkill('戦闘開始時', atkUnit, defUnit, this.__applySkillEffectForUnit, this);
        sw.lap('戦闘開始時終了');

        self.__applySkillEffectRelatedToEnemyStatusEffects(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectRelatedToEnemyStatusEffects(defUnit, atkUnit, calcPotentialDamage);
        // });

        this.combatPhase = NodeEnv.CombatPhase.APPLYING_OTHER_UNITS_SKILL;

        // 味方ユニットからの戦闘中バフ
        damageCalcEnv.applySkill('周囲の味方からのバフ', atkUnit, defUnit, this.__applySpursFromAllies, this);

        damageCalcEnv.applySkill('周囲の敵からのバフ', atkUnit, defUnit, this.__applySpursFromEnemies, this);

        // 味方ユニットからのスキル効果
        // self.profile.profile("__applySkillEffectFromAllies", () => {
        // self.__applySkillEffectForAttackerAndDefenderFromAllies(atkUnit, defUnit);
        damageCalcEnv.applySkill('戦闘開始時、周囲の味方からのスキル', atkUnit, defUnit, this.__applySkillEffectFromAllies, this);
        // });

        // 周囲の敵からのスキル効果
        damageCalcEnv.applySkill('戦闘開始時、周囲の敵からのスキル', atkUnit, defUnit,
            this.__applySkillEffectFromEnemyAllies, this);

        this.combatPhase = NodeEnv.CombatPhase.APPLYING_OTHER_UNITS_SKILL_AFTER_FEUD;

        // 暗闘の対象外になる周囲からのスキル効果
        // 主に戦闘外の効果。味方の存在などで発動するスキルも書いて良い（ただし大抵の場合他の場所で書ける）
        damageCalcEnv.applySkill('周囲の味方のスキル(暗闘外)', atkUnit, defUnit,
            this.__applySkillEffectFromAlliesExcludedFromFeud, this);
        sw.lap('周囲からのスキル終了');

        // 神罰の杖
        self.__setWrathfulStaff(atkUnit, defUnit);
        self.__setWrathfulStaff(defUnit, atkUnit);

        this.combatPhase = NodeEnv.CombatPhase.APPLYING_EFFECTIVE;

        // 特効
        self.__setEffectiveAttackEnabledIfPossible(atkUnit, defUnit);
        self.__setEffectiveAttackEnabledIfPossible(defUnit, atkUnit);

        this.combatPhase = NodeEnv.CombatPhase.APPLYING_COUNTER_ALL_DISTANCE;

        // スキル内蔵の全距離反撃
        defUnit.battleContext.canCounterattackToAllDistance = defUnit.canCounterAttackToAllDistance();
        // });

        // self.profile.profile("__applySkillEffect 2", () => {

        // 戦闘中バフが決まった後に評価するバフ
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_STATUS_SKILL_AFTER_STATUS_FIXED;
        damageCalcEnv.applySkill('戦闘中バフ決定後のバフ', atkUnit, defUnit,
            this.__applySpurForUnitAfterCombatStatusFixed, this);
        // 周囲の味方
        damageCalcEnv.applySkill('周囲の味方からのバフ(戦闘中バフ決定後)', atkUnit, defUnit,
            this.__applySpursFromAlliesAfterCombatStatusFixedSkills, this);
        // 周囲の敵
        damageCalcEnv.applySkill('周囲の敵からのバフ(戦闘中バフ決定後)', atkUnit, defUnit,
            this.__applySpursFromEnemyAlliesAfterCombatStatusFixed, this);

        // 戦闘中バフが決まった後に評価するスキル効果
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_SKILL_AFTER_STATUS_FIXED;
        damageCalcEnv.applySkill('戦闘中バフ決定後のスキル', atkUnit, defUnit,
            this.__applySkillEffectForUnitAfterCombatStatusFixed, this);
        // 周囲の味方
        damageCalcEnv.applySkill('周囲の味方からのスキル効果(戦闘中バフ決定後)', atkUnit, defUnit,
            this.__applySkillEffectFromAlliesAfterCombatStatusFixedSkills, this);
        // 周囲の敵
        damageCalcEnv.applySkill('周囲の敵からのスキル効果(戦闘中バフ決定後)', atkUnit, defUnit,
            this.__applySkillEffectFromEnemyAlliesAfterCombatStatusFixed, this);

        // self.profile.profile("__applySkillEffectFromSkillInfo", () => {
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_ATTACK_COUNT;
        // 1回の攻撃の攻撃回数を設定
        self.__setAttackCount(atkUnit, defUnit);
        self.__setAttackCount(defUnit, atkUnit);

        this.combatPhase = NodeEnv.CombatPhase.AFTER_APPLYING_ATTACK_COUNT;
        self.__applySkillEffectAfterSetAttackCount(atkUnit, defUnit);
        self.__applySkillEffectAfterSetAttackCount(defUnit, atkUnit);

        // ダメージ軽減率の計算(ダメージ軽減効果を軽減する効果の後に実行する必要がある)
        self.__applyDamageReductionRatio(atkUnit, defUnit);
        self.__applyDamageReductionRatio(defUnit, atkUnit);

        self.__applySkillEffectForPrecombatAndCombat(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectForPrecombatAndCombat(defUnit, atkUnit, calcPotentialDamage);

        self.__calcFixedAddDamage(atkUnit, defUnit, false);
        self.__calcFixedAddDamage(defUnit, atkUnit, false);

        self.__calcFixedSpecialAddDamage(atkUnit, defUnit);
        self.__calcFixedSpecialAddDamage(defUnit, atkUnit);
        // });

        // self.profile.profile("__applySkillEffect 3", () => {
        // 敵が反撃可能か判定
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_CAN_COUNTER;
        defUnit.battleContext.canCounterattack = self.canCounterAttack(atkUnit, defUnit, calcPotentialDamage, damageType);
        // self.writeDebugLogLine(defUnit.getNameWithGroup() + "の反撃可否:" + defUnit.battleContext.canCounterattack);

        // 追撃可能か判定
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_CAN_FOLLOW_UP;
        atkUnit.battleContext.canFollowupAttackWithoutPotent =
            self.__examinesCanFollowupAttackForAttacker(atkUnit, defUnit, damageCalcEnv);
        if (defUnit.battleContext.canCounterattack) {
            defUnit.battleContext.canFollowupAttackWithoutPotent =
                self.__examinesCanFollowupAttackForDefender(atkUnit, defUnit, damageCalcEnv);
        }
        sw.lap('判定終了');

        // 防御系奥義発動時のダメージ軽減率設定
        self.__applyDamageReductionRatioBySpecial(atkUnit, defUnit);
        self.__applyDamageReductionRatioBySpecial(defUnit, atkUnit);

        // 神速
        // 他の追撃可能かどうかを条件とするスキルは神速も追撃と見なすのでそれより前に神速判定をしなければならない
        // 神速自体も追撃可能かどうかを条件とするので追撃判定の後に効果を適用しなければならない
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_POTENT;
        damageCalcEnv.applySkill('神速判定時', atkUnit, defUnit, this.__applyPotentSkillEffect, this);
        damageCalcEnv.applySkill('周囲の味方からの神速判定時', atkUnit, defUnit,
            this.__applyPotentSkillEffectFromAllies, this);
        this.combatPhase = NodeEnv.CombatPhase.AFTER_FOLLOWUP_CONFIGURED;

        // 追撃可能かどうかが条件として必要なスキル効果の適用
        damageCalcEnv.applySkill('追撃判定後', atkUnit, defUnit,
            this.__applySkillEffectRelatedToFollowupAttackPossibility, this);

        // 効果を無効化するスキル
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_NEUTRALIZATION_SKILL;
        self.__applyInvalidationSkillEffect(atkUnit, defUnit, calcPotentialDamage);
        self.__applyInvalidationSkillEffect(defUnit, atkUnit, calcPotentialDamage);

        // 奥義
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_SPECIAL;
        damageCalcEnv.applySkill('戦闘開始時奥義効果', atkUnit, defUnit, this.__applySpecialSkillEffect, this);

        // 間接的な設定から実際に戦闘で利用する値を評価して戦闘コンテキストに設定
        self.__setSkillEffetToContext(atkUnit, defUnit);
        // });

        // 守備、魔防のどちらを参照するか決定
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_REF_MIT;
        atkUnit.battleContext.invalidatesReferenceLowerMit |= this.__canInvalidatesReferenceLowerMit(atkUnit, defUnit);
        defUnit.battleContext.invalidatesReferenceLowerMit |= this.__canInvalidatesReferenceLowerMit(defUnit, atkUnit);
        self.__selectReferencingResOrDef(atkUnit, defUnit);
        self.__selectReferencingResOrDef(defUnit, atkUnit);

        // 周囲の味方（適用後）
        damageCalcEnv.applySkill('周囲の味方のスキル(適用後)', atkUnit, defUnit,
            this.__applySkillEffectFromAlliesAfterOtherSkills, this);
        // 周囲の敵（適用後）
        damageCalcEnv.applySkill('周囲の敵からのスキル効果(適用後)', atkUnit, defUnit,
            this.__applySkillEffectFromEnemyAlliesAfterOtherSkills, this);

        // 戦闘開始後ダメージ決定後に評価されるスキル効果
        this.combatPhase = NodeEnv.CombatPhase.AFTER_DAMAGE_AS_COMBAT_BEGINS_FIXED;
        // TODO: リファクタリング。戦闘開始時にBattleContextに設定できるようにする
        damageCalcEnv.applySkill('戦闘開始後ダメージ後', atkUnit, defUnit,
            this.applySkillEffectsAfterAfterBeginningOfCombat, this);

        // 周囲の敵からのスキル効果
        damageCalcEnv.applySkill('周囲からの戦闘開始後ダメージ後', atkUnit, defUnit,
            this.applySkillEffectsAfterAfterBeginningOfCombatFromAllies, this);

        this.applySkillEffectAfterConditionDetermined(damageCalcEnv);

        sw.lap('スキル適用終了');
        let result;
        // self.profile.profile("_damageCalc.calcCombatResult", () => {
        result = self._damageCalc.calcCombatResult(damageCalcEnv);
        sw.lap('ダメージ計算終了');
        sw.stop();
        // });
        return result;
    }

    __canInvalidatesReferenceLowerMit(targetUnit, enemyUnit, isPrecombat = false) {
        let self = this;
        if (targetUnit.battleContext.invalidatesReferenceLowerMit) {
            return true;
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            if (DISABLES_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SET.has(skillId)) {
                return true;
            }
            switch (skillId) {
                case PassiveA.RareTalent:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        return true;
                    }
                    break;
                case Weapon.RadiantAureola:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        if (!isPrecombat) return true;
                    }
                    break;
                case PassiveA.CloseWard:
                    if (!isPhysicalWeaponType(enemyUnit.weaponType)) {
                        return true;
                    }
                    break;
                case PassiveB.SeimeiNoGofu3:
                case PassiveB.MysticBoost4:
                case PassiveB.HikariToYamito:
                case PassiveB.LightAndDark2:
                    return true;
                case Weapon.SplashyBucketPlus:
                    return true;
                case Weapon.Naga:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (isWeaponTypeBreath(enemyUnit.weaponType)) {
                            return true;
                        }
                    }
                    break;
                case Weapon.SeisyoNaga:
                    if (targetUnit.isWeaponSpecialRefined) {
                        return true;
                    }
                    break;
            }
        }
        return false;
    }

    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     */
    __selectReferencingResOrDef(atkUnit, defUnit) {
        if (this.isLogEnabled) this.writeDebugLog(`守備魔防参照の評価: invalidatesReferenceLowerMit=${defUnit.battleContext.invalidatesReferenceLowerMit}`);

        let refersLowerMit =
            atkUnit.battleContext.refersMinOfDefOrRes ||
            (defUnit.attackRange === 2 && isWeaponTypeBreath(atkUnit.weaponType)) ||
            atkUnit.hasStatusEffect(StatusEffectType.Hexblade);
        if (refersLowerMit && !defUnit.battleContext.invalidatesReferenceLowerMit) {
            if (this.isLogEnabled) this.writeDebugLog("守備魔防の低い方でダメージ計算");
            let defInCombat = defUnit.getDefInCombat(atkUnit);
            let resInCombat = defUnit.getResInCombat(atkUnit);
            atkUnit.battleContext.refersRes = defInCombat === resInCombat ? !atkUnit.isPhysicalAttacker() : resInCombat < defInCombat;
        }
        else if (atkUnit.weapon === Weapon.HelsReaper) { // 魔防参照
            atkUnit.battleContext.refersRes = !isWeaponTypeTome(defUnit.weaponType) && defUnit.weaponType !== WeaponType.Staff;
        }
        else {
            if (this.isLogEnabled) this.writeDebugLog(`${atkUnit.getNameWithGroup()}は${atkUnit.isPhysicalAttacker() ? "物理" : "魔法"}ユニット`);
            atkUnit.battleContext.refersRes = !atkUnit.isPhysicalAttacker();
        }

        atkUnit.battleContext.refersResForSpecial = atkUnit.battleContext.refersRes;
        if (!defUnit.battleContext.invalidatesReferenceLowerMit) {
            if (atkUnit.battleContext.refersLowerDefOrResWhenSpecial) {
                if (this.isLogEnabled) this.writeDebugLog("奥義発動時守備魔防の低い方でダメージ計算");
                let defInCombat = defUnit.getDefInCombat(atkUnit);
                let resInCombat = defUnit.getResInCombat(atkUnit);
                atkUnit.battleContext.refersResForSpecial |= resInCombat < defInCombat;
            }
            for (let skillId of atkUnit.enumerateSkills()) {
                getSkillFunc(skillId, selectReferencingResOrDefFuncMap)?.call(this, atkUnit, defUnit);
                switch (skillId) {
                    case Special.SeidrShell: {
                        if (this.isLogEnabled) this.writeDebugLog("魔弾により守備魔防の低い方でダメージ計算");

                        let defInCombat = defUnit.getDefInCombat(atkUnit);
                        let resInCombat = defUnit.getResInCombat(atkUnit);
                        atkUnit.battleContext.refersResForSpecial = defInCombat === resInCombat ? !atkUnit.isPhysicalAttacker() : resInCombat < defInCombat;
                    }
                        break;
                }
            }
        }
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @returns {null}
     * @private
     */
    __getSaverUnitIfPossible(atkUnit, defUnit, damageCalcEnv) {
        if (defUnit.hasStatusEffect(StatusEffectType.Undefended)) {
            return null;
        }
        if (atkUnit.battleContext.doesNotTriggerFoesSaviorEffects) {
            return null;
        }
        let saverUnit = null;
        let allies = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 4, false);
        for (let ally of allies) {
            let isNoDefTile = defUnit.placedTile === null || defUnit.placedTile === undefined;
            let cannotMoveToForSave = !defUnit.placedTile.isMovableTileForUnit(ally);
            if (isNoDefTile || cannotMoveToForSave) {
                continue;
            }

            let canActivateSaviorWithin2Spaces =
                this.__canActivateSaveSkillWithin2Spaces(atkUnit, ally, damageCalcEnv) &&
                ally.distance(defUnit) <= 2;
            if (canActivateSaviorWithin2Spaces ||
                this.__canActivateSaveSkill(atkUnit, defUnit, ally, damageCalcEnv)) {
                if (saverUnit != null) {
                    // 複数発動可能な場合は発動しない
                    return null;
                }

                saverUnit = ally;
            }
        }
        return saverUnit;
    }

    /**
     * 護られ不可は考慮しない
     * @params {Unit} atkUnit
     * @params {Unit} ally
     * @params {DamageCalcEnv} damageCalaEnv
     * @returns {boolean}
     */
    __canActivateSaveSkillWithin2Spaces(atkUnit, ally, damageCalcEnv) {
        if (this.__canDisableSaveSkill(atkUnit, ally)) {
            return false;
        }

        for (let skillId of ally.enumerateSkills()) {
            if (atkUnit.isMeleeWeaponType()) {
                if (CAN_SAVE_FROM_MELEE_SKILL_SET.has(skillId)) {
                    return true;
                }
            }
            if (atkUnit.isRangedWeaponType()) {
                if (CAN_SAVE_FROM_RANGED_SKILL_SET.has(skillId)) {
                    return true;
                }
            }
            if (atkUnit.isPhysicalAttacker()) {
                if (CAN_SAVE_FROM_P_SKILL_SET.has(skillId)) {
                    return true;
                }
            }
            if (atkUnit.isMagicalAttacker()) {
                if (CAN_SAVE_FROM_MAGIC_SKILL_SET.has(skillId)) {
                    return true;
                }
            }
            if (getSkillFunc(skillId, canActivateSaveSkillFuncMap)?.call(this, atkUnit, ally) ?? false) {
                return true;
            }
            switch (skillId) {
                case PassiveC.WoefulUpheaval:
                case PassiveC.WithEveryone2:
                case PassiveC.AsFarSave3:
                case PassiveC.AdFarSave3:
                case PassiveC.ArFarSave3:
                case PassiveC.DrFarSave3:
                    if (atkUnit.isRangedWeaponType()) {
                        return true;
                    }
                    break;
                case PassiveC.AsNearSave3:
                case PassiveC.ArNearSave3:
                case PassiveC.AdNearSave3:
                case PassiveC.DrNearSave3:
                    if (atkUnit.isMeleeWeaponType()) {
                        return true;
                    }
                    break;
            }
        }

        // 囮指名
        // 通常の護り手スキルの後に判定を行う
        let isAssignDecoyForSameRangeActive = ally.hasStatusEffect(StatusEffectType.AssignDecoy);
        let env = new NodeEnv().setTarget(ally).setSkillOwner(ally);
        env.setName('囮指名判定時').setLogLevel(getSkillLogLevel());
        isAssignDecoyForSameRangeActive |= IS_ASSIGN_DECOY_FOR_SAME_RANGE_ACTIVE_HOOKS.evaluateSomeWithUnit(ally, env);
        if (isAssignDecoyForSameRangeActive) {
            if (ally.hasSaveSkills()) {
                // 護り手スキルを持っている場合には囮指名の効果は発動しない
                // (囮指名者が護り手スキルを持っていてその護り手スキルが発動しない場合の処理)
                return false;
            }
            if (isRangedWeaponType(ally.weaponType) && isRangedWeaponType(atkUnit.weaponType)) {
                return true;
            }
            if (isMeleeWeaponType(ally.weaponType) && isMeleeWeaponType(atkUnit.weaponType)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 護られ不可は考慮しない
     * @params {Unit} atkUnit
     * @params {Unit} defUnit
     * @params {Unit} ally
     * @params {DamageCalcEnv} damageCalcEnv
     * @returns {boolean}
     */
    __canActivateSaveSkill(atkUnit, defUnit, ally, damageCalcEnv) {
        let env = new DamageCalculatorWrapperEnv(this, defUnit, atkUnit, null);
        env.setTargetAlly(ally).setSkillOwner(ally);
        env.setName('護り手判定時').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase);
        return CAN_TRIGGER_SAVIOR_HOOKS.evaluateSomeWithUnit(ally, env);
    }

    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     */
    __canDisableSaveSkill(atkUnit, defUnit) {
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Captain.Erosion: return true;
            }
        }
        return false;
    }

    __applyPrecombatDamageReductionRatio(defUnit, atkUnit) {
        // 天脈
        let tile = defUnit.placedTile;
        switch (tile.divineVein) {
            case DivineVeinType.Stone:
                if (tile.divineVeinGroup === defUnit.groupId) {
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.5);
                }
                break;
        }

        if (defUnit.hasStatusEffect(StatusEffectType.ReduceDamageFromAreaOfEffectSpecialsBy80Percent)) {
            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.8);
        }
        for (let skillId of defUnit.enumerateSkills()) {
            getSkillFunc(skillId, applyPrecombatDamageReductionRatioFuncMap)?.call(this, defUnit, atkUnit);
            switch (skillId) {
                case Weapon.DragonsFist:
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.4);
                    }
                    break;
                case Weapon.SparklingSun:
                    if (this.__isThereAllyInSpecifiedSpaces(defUnit, 3)) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.75);
                    }
                    break;
                case PassiveB.Gambit4: {
                    let ratio = Math.min(defUnit.maxSpecialCount * 0.1, 0.5);
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                }
                    break;
                case Weapon.DreamHorn:
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.3);
                    }
                    break;
                case Weapon.HarukazeNoBreath:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.initiatesCombat ||
                            atkUnit.battleContext.restHpPercentage >= 75) {
                            this.__applyResDodge(defUnit, atkUnit);
                        }
                    }
                    break;
                case Weapon.FreebladesEdge: {
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.3);
                }
                    break;
                case PassiveB.GuardBearing4:
                    if (!defUnit.isOneTimeActionActivatedForPassiveB) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.6);
                    } else {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.3);
                    }
                    break;
                case Weapon.LoneWolf:
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.3);
                    }
                    break;
                case Weapon.MaskedLance:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            let ratio = DamageCalculationUtility.getResDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                        }
                    }
                    break;
                case Weapon.MonarchBlade:
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                    }
                    break;
                case Weapon.Liberation:
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                    }
                    break;
                case Weapon.JoyousTome: {
                    let pred = unit => unit.hpPercentage >= 50;
                    let count = this.__countAlliesWithinSpecifiedSpaces(defUnit, 3, pred);
                    if (count > 0) {
                        let percentage = Math.min(count * 15, 45);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                    }
                }
                    break;
                case PassiveA.AsherasChosenPlus:
                    if (this.__isThereAllyExceptDragonAndBeastWithin1Space(defUnit) === false ||
                        atkUnit.battleContext.restHpPercentage >= 75) {
                        let resDiff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
                        if (resDiff > 0) {
                            let percentage = Math.min(resDiff * 4, 40);
                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                        }
                    }
                    break;
                case Weapon.FangOfFinality: {
                    let count = this.__countAlliesWithinSpecifiedSpaces(atkUnit, 3) + 1;
                    let percentage = Math.min(count * 20, 60);
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                }
                    break;
                case Weapon.ShiseiNaga:
                    if (defUnit.battleContext.weaponSkillCondSatisfied) {
                        let resDiff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
                        if (resDiff > 0) {
                            let percentage = Math.min(resDiff * 4, 40);
                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                        }
                    }
                    break;
                case Weapon.WandererBlade:
                    if (defUnit.isWeaponSpecialRefined && defUnit.battleContext.restHpPercentage >= 25) {
                        let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                    }
                    break;
                case Weapon.ShishiouNoTsumekiba:
                    if (defUnit.isWeaponRefined) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.7);
                    }
                    break;
                case Weapon.Mafu:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (defUnit.battleContext.restHpPercentage >= 25 && !isWeaponTypeTome(atkUnit.weaponType)) {
                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.3);
                        }
                    }
                    break;
                case Weapon.WindyWarTome:
                    if (atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.restHpPercentage >= 75) {
                        let diff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                        }
                    }
                    break;
                case Weapon.HurricaneDagger:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit, 3, 30);
                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                        }
                    }
                    break;
                case Weapon.RaikenJikurinde:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                        }
                    }
                    break;
                case Weapon.Roputous:
                    if (defUnit.isWeaponRefined) {
                        if (!atkUnit.isWeaponEffectiveAgainst(EffectiveType.Dragon)) {
                            let resDiff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
                            if (resDiff > 0) {
                                let percentage = resDiff * 4;
                                if (percentage > 40) {
                                    percentage = 40;
                                }

                                defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                            }
                        }
                    }
                    break;
                case Weapon.LilacJadeBreath:
                    if (atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.restHpPercentage === 100) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.4);
                    }
                    break;
                case Weapon.GiltGoblet:
                    if (atkUnit.battleContext.restHpPercentage === 100 && isRangedWeaponType(atkUnit.weaponType)) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.5);
                    }
                    break;
                case Weapon.EtherealBreath: {
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.8);
                }
                    if (defUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.restHpPercentage >= 75) {
                            let resDiff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
                            if (resDiff > 0) {
                                let percentage = resDiff * 4;
                                if (percentage > 40) {
                                    percentage = 40;
                                }

                                defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                            }
                        }
                    }
                    break;
                case Weapon.NewFoxkitFang:
                    {
                        let resDiff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
                        if (resDiff > 0) {
                            let percentage = resDiff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                        }
                    }
                    break;
                case Weapon.BrightmareHorn:
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        let diff = defUnit.getEvalSpdInPrecombat() - atkUnit.getEvalSpdInPrecombat();
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                        }
                    }
                    break;
                case Weapon.NightmareHorn:
                case Weapon.NewBrazenCatFang:
                    {
                        let diff = defUnit.getEvalSpdInPrecombat() - atkUnit.getEvalSpdInPrecombat();
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                        }
                    }
                    break;
                case PassiveB.Chivalry: {
                    let percentage = atkUnit.battleContext.restHpPercentage * 0.5;
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                }
                    break;
                case PassiveB.AssuredRebirth: {
                    let percentage = 0;
                    let count = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 3)) {
                        if (unit.weaponType === WeaponType.Staff || isWeaponTypeBreath(unit.weaponType)) {
                            count++;
                        }
                    }
                    percentage += count * 20;
                    let diff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
                    if (diff > 0) {
                        let p = Math.min(diff * 4, 40);
                        percentage += p;
                    }
                    percentage = Math.min(percentage, 60);
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                }
                    break;
                case PassiveB.TrueDragonWall: {
                    let resDiff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
                    let r = 0;
                    let maxPercentage = 0;
                    if (defUnit.isOneTimeActionActivatedForPassiveB) {
                        r = 6;
                        maxPercentage = 60;
                    } else {
                        r = 4;
                        maxPercentage = 40
                    }
                    if (resDiff > 0) {
                        let percentage = resDiff * r;
                        percentage = Math.min(percentage, maxPercentage);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                    }
                    break;
                }
                case Weapon.TwinDivinestone:
                case PassiveB.NewDivinity:
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        this.__applyResDodge(defUnit, atkUnit);
                    }
                    break;
                case PassiveB.DragonWall3:
                    this.__applyResDodge(defUnit, atkUnit);
                    break;
                case PassiveB.MoonTwinWing:
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                    }
                    break;
                case PassiveB.BeastSense4:
                case PassiveB.Bushido2:
                case PassiveB.Velocity3:
                case PassiveB.Frenzy3:
                case PassiveB.Spurn3:
                case PassiveB.KaihiIchigekiridatsu3:
                case PassiveB.KaihiTatakikomi3:
                    {
                        let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                    }
                    break;
                case PassiveB.Spurn4:
                case PassiveB.CloseCall4:
                case PassiveB.Repel4:
                    {
                        let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit, 5, 50);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                    }
                    break;
                case PassiveB.BlueLionRule:
                    {
                        let diff = defUnit.getEvalDefInPrecombat() - atkUnit.getEvalDefInPrecombat();
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                        }
                    }
                    break;
                case PassiveC.AllTogether: {
                    let count = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 2)) {
                        count++;
                    }
                    let percentage = Math.min(count * 40, 80);
                    let ratio = percentage / 100.0;
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                }
                    break;
                case Special.VitalAstra:
                    if (defUnit.isSpecialCharged) {
                        let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit, 3, 30);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                    }
            }
        }

        if (defUnit.hasStatusEffect(StatusEffectType.Dodge)) {
            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
        }
    }

    __applyResDodge(defUnit, atkUnit) {
        let resDiff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
        if (resDiff <= 0) {
            return;
        }
        let percentage = resDiff * 4;
        if (percentage > 40) {
            percentage = 40;
        }
        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
    }

    __applyPrecombatDamageReduction(defUnit, atkUnit) {
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.DualityVessel: {
                    let diff = defUnit.getEvalDefInPrecombat() - atkUnit.getEvalDefInPrecombat();
                    if (this.__isThereAllyInSpecifiedSpaces(defUnit, 3) && diff > 0) {
                        defUnit.battleContext.damageReductionForPrecombat += Math.trunc(diff * 1.5);
                    }
                }
                    break;
            }
        }
    }

    __applyPrecombatSpecialDamageMult(atkUnit) {
        atkUnit.battleContext.precombatSpecialDamageMult = getRangedAttackSpecialDamageRate(atkUnit.special);
    }

    __setBattleContextRelatedToMap(targetUnit) {
        targetUnit.battleContext.isOnDefensiveTile = targetUnit.placedTile.isDefensiveTile;
    }

    /**
     * 戦闘順入れ替えスキルを適用します。戦闘中バフが決定する前に呼び出されます（戦闘中のステータス比較を行う処理は入れないでください）。
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     */
    __applyChangingAttackPrioritySkillEffects(atkUnit, defUnit) {
        // defUnitのスキル効果
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveA.GiftOfMagic:
                    if (isRangedWeaponType(atkUnit.weaponType) && atkUnit.battleContext.initiatesCombat) {
                        // 敵に攻め立て強制
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.Urvan:
                    if (defUnit.isWeaponSpecialRefined) {
                        // 敵に攻め立て強制
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.HolyWarsEnd:
                    if (defUnit.battleContext.restHpPercentage >= 50) {
                        defUnit.battleContext.isDefDesperationActivatable = true;
                    }
                    break;
            }
        }

        // atkUnitのスキル効果
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.AerialManeuvers:
                    if (atkUnit.battleContext.restHpPercentage >= 50 &&
                        defUnit.battleContext.restHpPercentage >= 50) {
                        if (atkUnit.battleContext.initiatesCombat) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case Weapon.ArcaneDarkbow:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        if (atkUnit.battleContext.initiatesCombat) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case Weapon.KeenCoyoteBow:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.Thunderbrand:
                    if (defUnit.battleContext.restHpPercentage >= 50) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.DarkSpikesT:
                    if (atkUnit.battleContext.restHpPercentage <= 99) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.Forusethi:
                    if (atkUnit.isWeaponRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 25) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    } else {
                        if (atkUnit.battleContext.restHpPercentage >= 50) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case Weapon.YonkaiNoSaiki: {
                    let threshold = atkUnit.isWeaponRefined ? 25 : 50;
                    if (atkUnit.battleContext.restHpPercentage >= threshold) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                }
                    break;
                case Weapon.AnkokuNoKen:
                    if (!atkUnit.isWeaponRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 50) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    } else {
                        if (atkUnit.battleContext.restHpPercentage >= 25) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case Weapon.SoulCaty:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage <= 75) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    } else {
                        if (atkUnit.battleContext.restHpPercentage <= 50) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case Weapon.Hitode:
                case Weapon.HitodePlus:
                case Weapon.NangokuJuice:
                case Weapon.NangokuJuicePlus:
                case Weapon.SakanaNoYumi:
                case Weapon.SakanaNoYumiPlus:
                    if (atkUnit.battleContext.restHpPercentage <= 75) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.IhoNoHIken:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage <= 75) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case PassiveB.HodrsZeal:
                    atkUnit.battleContext.isDesperationActivatable = true;
                    break;
                case PassiveB.YngviAscendant:
                    atkUnit.battleContext.isDesperationActivatable = true;
                    break;
                case PassiveB.Frenzy3:
                    if (atkUnit.battleContext.restHpPercentage <= 50) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.KyusyuTaikei3:
                    atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    if (atkUnit.battleContext.restHpPercentage <= 80) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.DiveBomb3:
                    if (atkUnit.battleContext.restHpPercentage >= 80 && defUnit.battleContext.restHpPercentage >= 80) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.KillingIntent:
                case PassiveB.KillingIntentPlus: {
                    if (defUnit.battleContext.restHpPercentage < 100 || defUnit.hasNegativeStatusEffect()) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                }
                    break;
                case PassiveB.SphiasSoul:
                case PassiveB.Desperation3: // 攻め立て3
                    if (atkUnit.battleContext.restHpPercentage <= 75) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.Desperation4: // 攻め立て4
                    if (atkUnit.battleContext.restHpPercentage <= 99 ||
                        Unit.calcMoveDistance(atkUnit) >= 2) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.FlowDesperation:
                    if (atkUnit.battleContext.restHpPercentage <= 75 ||
                        Unit.calcMoveDistance(atkUnit) >= 2) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.SoulOfZofia2:
                    atkUnit.battleContext.isDesperationActivatable = true;
                    break;
            }
        }
    }



    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @private
     */
    __applySKillEffectForUnitAtBeginningOfCombat(targetUnit, enemyUnit, damageCalcEnv) {
        // 天脈
        let tile = targetUnit.placedTile;
        if (tile.divineVein === DivineVeinType.Flame &&
            tile.divineVeinGroup !== targetUnit.groupId) {
            targetUnit.battleContext.damageAfterBeginningOfCombat += 7;
            let logMessage = `天脈・炎により${targetUnit.getNameWithGroup()}に${7}ダメージ`;
            this.__writeDamageCalcDebugLog(logMessage);
        }
        // スキル
        for (let skillId of targetUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, applySKillEffectForUnitAtBeginningOfCombatFuncMap);
            func?.call(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        }
    }

    __applySkillEffect(atkUnit, defUnit, calcPotentialDamage) {
        this.__applyTransformedSkillEffects(atkUnit, defUnit);
        this.__applyTransformedSkillEffects(defUnit, atkUnit);

        this.__applyChangingAttackPrioritySkillEffects(atkUnit, defUnit);

        for (let skillId of atkUnit.enumerateSkills()) {
            let skillFunc = this._applySkillEffectForAtkUnitFuncDict[skillId];
            if (skillFunc) {
                skillFunc(atkUnit, defUnit, calcPotentialDamage);
            }
        }

        for (let skillId of defUnit.enumerateSkills()) {
            let skillFunc = this._applySkillEffectForDefUnitFuncDict[skillId];
            if (skillFunc) {
                skillFunc(defUnit, atkUnit, calcPotentialDamage);
            }
        }
    }

    __applyTransformedSkillEffects(atkUnit, defUnit) {
        if (atkUnit.isTransformed) {
            switch (BEAST_COMMON_SKILL_MAP.get(atkUnit.weapon)) {
                case BeastCommonSkillType.Cavalry:
                    if (!atkUnit.isWeaponRefined) {
                        // <通常効果>
                        defUnit.addAtkDefSpurs(-4);
                        defUnit.battleContext.followupAttackPriorityDecrement--;
                    } else {
                        // <錬成効果>
                        this.applyBeastCavalryRefinedSkillEffect(atkUnit, defUnit);
                    }
                    break;
                case BeastCommonSkillType.Cavalry2: {
                    this.applyBeastCavalryRefinedSkillEffect(atkUnit, defUnit);
                    break;
                }
            }
        }
    }

    applyBeastCavalryRefinedSkillEffect(atkUnit, defUnit) {
        defUnit.addAtkDefSpurs(-3);
        let d = Unit.calcAttackerMoveDistance(atkUnit, defUnit);
        let amount = Math.min(d, 3);
        defUnit.addAtkDefSpurs(-amount);
        if (d >= 2) {
            atkUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, defUnit);
        }
    }


    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {boolean} isPrecombat
     */
    __calcFixedSpecialAddDamage(targetUnit, enemyUnit, isPrecombat = false) {
        {
            let damage = 0;
            for (let skillId of targetUnit.enumerateWeaponSkills()) {
                switch (BEAST_COMMON_SKILL_MAP.get(skillId)) {
                    case BeastCommonSkillType.Infantry2:
                        damage = 7;
                        break;
                    case BeastCommonSkillType.Infantry:
                        damage = 10;
                        break;
                    case BeastCommonSkillType.Infantry2IfRefined:
                        damage = targetUnit.isWeaponRefined ? 7 : 10;
                        break;
                }
            }
            if (targetUnit.isTransformed) {
                if (isPrecombat) {
                    targetUnit.battleContext.additionalDamageOfSpecial = damage;
                } else {
                    targetUnit.battleContext.additionalDamageOfSpecial += damage;
                }
            }
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.HeiredForseti:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let spd = DamageCalculatorWrapper.__getSpd(targetUnit, enemyUnit, isPrecombat);
                        let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(spd * ratio);
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(spd * ratio);
                        }
                    }
                    break;
                case Weapon.ImbuedKoma:
                    if (targetUnit.isWeaponSpecialRefined) {
                        let def = DamageCalculatorWrapper.__getDef(targetUnit, enemyUnit, isPrecombat);
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(def * 0.15);
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(def * 0.15);
                        }
                    }
                    break;
                case PassiveB.SpecialSpiral4:
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = 5;
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += 5;
                    }
                    break;
                case PassiveB.MoonlightBangle:
                case PassiveB.MoonlitBangleF: {
                    let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                    let def = isPrecombat ? enemyUnit.getDefInPrecombat() : enemyUnit.getDefInCombat();
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(def * ratio);
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(def * ratio);
                    }
                }
                    break;
                case PassiveB.RunaBracelet: {
                    let def = isPrecombat ? enemyUnit.getDefInPrecombat() : enemyUnit.getDefInCombat();
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(def * 0.5);
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(def * 0.5);
                    }
                }
                    break;
                case PassiveB.Bushido:
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = 10;
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    }
                    break;
                case PassiveB.Ikari3:
                    if (targetUnit.restHpPercentage <= 75) {
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = 10;
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += 10;
                        }
                    }
                    break;
                case PassiveB.Spurn3:
                case PassiveB.Spurn4:
                    if (targetUnit.restHpPercentage <= 75) {
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = 5;
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += 5;
                        }
                    }
                    break;
                case Weapon.FumingFreikugel:
                    // 条件(weaponSkillCondSatisfied)は戦闘中以降に有効になるので必要はないが念の為範囲奥義を除くためにbreakする
                    if (isPrecombat) break;
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        let spd = targetUnit.getSpdInCombat(enemyUnit);
                        let ratio = 0.2 + 0.1 * targetUnit.maxSpecialCount;
                        targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(spd * ratio);
                    }
                    break;
                case Weapon.SisterlyWarAxe:
                case Weapon.DrybladeLance:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                        let spd = DamageCalculatorWrapper.__getSpd(targetUnit, enemyUnit, isPrecombat);
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(spd * ratio);
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(spd * ratio);
                        }
                    }
                    break;
                case Weapon.ManatsuNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                            let res = isPrecombat ? enemyUnit.getResInPrecombat() : enemyUnit.getResInCombat();
                            if (isPrecombat) {
                                targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(res * ratio);
                            } else {
                                targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(res * ratio);
                            }
                        }
                    }
                    break;
                case Weapon.Watou:
                case Weapon.WatouPlus:
                case Weapon.Wabo:
                case Weapon.WaboPlus:
                case Weapon.BigSpoon:
                case Weapon.BigSpoonPlus:
                case Weapon.Wakon:
                case Weapon.WakonPlus:
                case Weapon.TankyuPlus:
                case Weapon.BabyCarrot:
                case Weapon.BabyCarrotPlus:
                case Weapon.KyoufuArmars:
                case Weapon.KieiWayuNoKen:
                case Weapon.Toron:
                case Weapon.IhoNoHIken:
                case Weapon.DarkExcalibur:
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = 10;
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    }
                    break;
                case Weapon.Shamsir:
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = 7;
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += 7;
                    }
                    break;
                case Weapon.RunaNoEiken:
                case Weapon.Otokureru:
                case Weapon.MumeiNoIchimonNoKen:
                case Weapon.SyaniNoSeisou:
                case Weapon.DevilAxe:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = 10;
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += 10;
                        }
                    }
                    break;
            }
        }
    }


    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    __applySpursFromAllies(targetUnit, enemyUnit, damageCalcEnv) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }
        if (damageCalcEnv.calcPotentialDamage) {
            return;
        }
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                continue
            }
            let env = new ForAlliesEnv(this, targetUnit, enemyUnit, allyUnit);
            env.setName('周囲の味方からのバフ').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.evaluateWithUnit(allyUnit, env);
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @private
     */
    __applySpursFromEnemies(targetUnit, enemyUnit, damageCalcEnv) {
        let disablesSkillsFromEnemyAlliesInCombat = false;
        if (enemyUnit) {
            if (enemyUnit.hasStatusEffect(StatusEffectType.Feud) ||
                targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
                disablesSkillsFromEnemyAlliesInCombat = true;
            }
        }
        // enemyAllyにはenemyUnitも含まれる
        for (let enemyAlly of this.enumerateUnitsInTheSameGroupOnMap(enemyUnit, true)) {
            let isEnemyAllyNotEnemy = enemyAlly !== enemyUnit;
            if (disablesSkillsFromEnemyAlliesInCombat && isEnemyAllyNotEnemy) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, enemyAlly)) {
                continue;
            }
            let env = new ForFoesEnv(this, targetUnit, enemyUnit, enemyAlly, damageCalcEnv.calcPotentialDamage);
            env.setName('周囲の敵からのデバフ').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                .setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_FOES_INFLICTS_STATS_MINUS_HOOKS.evaluateWithUnit(enemyAlly, env);
        }
    }

    /**
     * 戦闘中のバフ決定後の戦闘中の味方からのバフ
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    __applySpursFromAlliesAfterCombatStatusFixedSkills(targetUnit, enemyUnit, damageCalcEnv) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }
        if (damageCalcEnv.calcPotentialDamage) {
            return;
        }
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                continue
            }
            let env = new ForAlliesEnv(this, targetUnit, enemyUnit, allyUnit);
            env.setName('周囲の味方からのバフ(戦闘中バフ決定後)').setLogLevel(getSkillLogLevel())
                .setDamageType(damageCalcEnv.damageType)
                .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_ALLIES_STATS_SKILLS_USING_STATS_HOOKS.evaluateWithUnit(allyUnit, env);
        }
    }

    /**
     * 戦闘中のバフ決定後の戦闘中の味方からのスキル効果
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    __applySkillEffectFromAlliesAfterCombatStatusFixedSkills(targetUnit, enemyUnit, damageCalcEnv) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }
        if (damageCalcEnv.calcPotentialDamage) {
            return;
        }
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                continue
            }
            let env = new ForAlliesEnv(this, targetUnit, enemyUnit, allyUnit);
            env.setName('周囲の味方からのスキル効果(戦闘中バフ決定後)').setLogLevel(getSkillLogLevel())
                .setDamageType(damageCalcEnv.damageType)
                .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_ALLIES_NON_STATS_SKILL_USING_STATS_HOOKS.evaluateWithUnit(allyUnit, env);
        }
    }

    /**
     * 戦闘中のユニットのスキル適用後の戦闘中の味方からのスキル効果
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    __applySkillEffectFromAlliesAfterOtherSkills(targetUnit, enemyUnit, damageCalcEnv) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }

        if (damageCalcEnv.calcPotentialDamage) {
            return;
        }
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                continue
            }
            let env = new ForAlliesEnv(this, targetUnit, enemyUnit, allyUnit);
            env.setName('周囲の味方のスキル(適用後)').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_AFTER_OTHER_SKILLS_DURING_COMBAT_HOOKS.evaluateWithUnit(allyUnit, env);
        }
    }

    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    __applySkillEffectFromAllies(targetUnit, enemyUnit, damageCalcEnv) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }

        if (!damageCalcEnv.calcPotentialDamage) {
            // 距離に関係ない効果
            for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                    continue
                }
                let env = new ForAlliesEnv(this, targetUnit, enemyUnit, allyUnit);
                env.setName('戦闘開始時、周囲の味方からのスキル').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                    .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
                FOR_ALLIES_AT_START_OF_COMBAT_HOOKS.evaluateWithUnit(allyUnit, env);
                for (let skillId of allyUnit.enumerateSkills()) {
                    let func = getSkillFunc(skillId, applySkillEffectFromAlliesFuncMap);
                    func?.call(this, targetUnit, enemyUnit, allyUnit, damageCalcEnv.calcPotentialDamage);
                    switch (skillId) {
                        case Special.DragonBlast:
                            if (targetUnit.isPartner(allyUnit)) {
                                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                            }
                            break;
                        case Captain.Erosion:
                            if (enemyUnit.battleContext.isSaviorActivated) {
                                enemyUnit.defSpur -= 4;
                                enemyUnit.resSpur -= 4;
                                targetUnit.battleContext.invalidatesCounterattack = true;
                            }
                            break;
                    }
                }
                for (let func of targetUnit.battleContext.applySkillEffectFromAlliesFuncs) {
                    func(targetUnit, enemyUnit, allyUnit, damageCalcEnv.calcPotentialDamage);
                }
            }

            // 2マス以内の味方からの効果
            for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                    continue
                }
                for (let skillId of allyUnit.enumerateSkills()) {
                    switch (skillId) {
                        // リーダースキル
                        case Captain.SecretManeuver:
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                targetUnit.battleContext.invalidateFollowupAttackSkills();
                            }
                            break;
                        case Captain.Effulgence:
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                            break;
                        case Captain.FlashOfSteel:
                            targetUnit.battleContext.invalidateCooldownCountSkills();
                            break;
                        case Captain.StormOfBlows:
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                            break;

                        // ユニットスキル
                        case Weapon.KittyCatParasol:
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                            targetUnit.battleContext.invalidateAllBuffs();
                            targetUnit.battleContext.addDamageReductionRatio(0.3);
                            break;
                        case Weapon.SacrificeStaff:
                            if (g_appData.globalBattleContext.miracleAndHealWithoutSpecialActivationCount[targetUnit.groupId] === 0) {
                                targetUnit.battleContext.canActivateNonSpecialMiracleAndHeal = true;
                                targetUnit.battleContext.miracleAndHealAmount += 99;
                            }
                            break;
                        case Weapon.RaisenNoSyo:
                            if (allyUnit.isWeaponSpecialRefined) {
                                if (enemyUnit.battleContext.initiatesCombat) {
                                    targetUnit.addSpdResSpurs(-5);
                                }
                            }
                            break;
                        case Weapon.Geirusukeguru:
                            if (allyUnit.isWeaponSpecialRefined) {
                                if (targetUnit.isPhysicalAttacker()) {
                                    targetUnit.battleContext.increaseCooldownCountForBoth();
                                }
                            }
                            break;
                        case Weapon.SunshadeStaff:
                            targetUnit.battleContext.increaseCooldownCountForDefense = true;
                            break;
                        case Weapon.Gjallarbru:
                            if (allyUnit.isWeaponSpecialRefined) {
                                targetUnit.battleContext.invalidateAllOwnDebuffs();
                            }
                            break;
                        case Weapon.RespitePlus:
                        case Weapon.TannenbatonPlus:
                            targetUnit.battleContext.reducesCooldownCount = true;
                            break;
                        case Weapon.Flykoogeru:
                            if (!targetUnit.isWeaponRefined) {
                                // <通常効果>
                                if (targetUnit.getDefInPrecombat() > allyUnit.getDefInPrecombat()) {
                                    targetUnit.addSpurs(4, 4, 0, 0);
                                }
                            } else {
                                // <錬成効果>
                                if (targetUnit.getDefInPrecombat() > allyUnit.getDefInPrecombat() ||
                                    !allyUnit.isCombatDone) {
                                    targetUnit.addAllSpur(4);
                                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                                }
                            }
                            break;
                        case Weapon.FumingFreikugel:
                            if (targetUnit.getDefInPrecombat() > allyUnit.getDefInPrecombat() || !allyUnit.isCombatDone) {
                                targetUnit.addAllSpur(3);
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.2, enemyUnit);
                            }
                            break;
                        case Weapon.YoukoohNoTsumekiba:
                            if (!allyUnit.isWeaponRefined) {
                                if (!allyUnit.hasStatusEffect(StatusEffectType.Panic)) {
                                    targetUnit.atkSpur += allyUnit.atkBuff;
                                    targetUnit.spdSpur += allyUnit.spdBuff;
                                    targetUnit.defSpur += allyUnit.defBuff;
                                    targetUnit.resSpur += allyUnit.resBuff;
                                }
                            } else if (allyUnit.isWeaponSpecialRefined) {
                                targetUnit.battleContext.reducesCooldownCount = true;
                            }
                            break;
                        case Weapon.GengakkiNoYumiPlus:
                            if (enemyUnit.isMeleeWeaponType()) {
                                targetUnit.defSpur += 4;
                                targetUnit.resSpur += 4;
                            }
                            break;
                        case Weapon.GinNoGobulettoPlus:
                            if (enemyUnit.isRangedWeaponType()) {
                                targetUnit.defSpur += 4;
                                targetUnit.resSpur += 4;
                            }
                            break;
                        case PassiveC.HolyGround:
                            targetUnit.battleContext.addDamageReductionRatio(0.3);
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                            break;
                        case PassiveC.Worldbreaker:
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                            break;
                        case PassiveC.EverlivingDomain: {
                            targetUnit.battleContext.canActivateNonSpecialMiracle = true;
                            let threshold = targetUnit.battleContext.nonSpecialMiracleHpPercentageThreshold;
                            targetUnit.battleContext.nonSpecialMiracleHpPercentageThreshold = Math.min(threshold, 75);
                            break;
                        }
                        case PassiveC.DomainOfIce:
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                            break;

                        case PassiveC.CloseGuard1:
                            if (enemyUnit.isMeleeWeaponType()) {
                                targetUnit.defSpur += 2;
                                targetUnit.resSpur += 2;
                            }
                            break;
                        case PassiveC.CloseGuard2:
                            if (enemyUnit.isMeleeWeaponType()) {
                                targetUnit.defSpur += 3;
                                targetUnit.resSpur += 3;
                            }
                            break;
                        case PassiveC.CloseGuard3:
                            if (enemyUnit.isMeleeWeaponType()) {
                                targetUnit.defSpur += 4;
                                targetUnit.resSpur += 4;
                            }
                            break;
                        case PassiveC.DistantGuard1:
                            if (enemyUnit.isRangedWeaponType()) {
                                targetUnit.defSpur += 2;
                                targetUnit.resSpur += 2;
                            }
                            break;
                        case PassiveC.DistantGuard2:
                            if (enemyUnit.isRangedWeaponType()) {
                                targetUnit.defSpur += 3;
                                targetUnit.resSpur += 3;
                            }
                            break;
                        case PassiveC.DistantGuard3:
                        case PassiveC.JointDistGuard:
                            if (enemyUnit.isRangedWeaponType()) {
                                targetUnit.defSpur += 4;
                                targetUnit.resSpur += 4;
                            }
                            break;
                    }
                }
            }

            // その他の範囲
            // 7x7
            for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                    continue
                }
                for (let skillId of allyUnit.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.DaichiBoshiNoBreath:
                            if (allyUnit.isWeaponSpecialRefined) {
                                if (Math.abs(targetUnit.posX - allyUnit.posX) <= 3 &&
                                    Math.abs(targetUnit.posY - allyUnit.posY) <= 3) {
                                    targetUnit.battleContext.invalidatesAtkBuff = true;
                                }
                            }
                            break;
                    }
                }
            }
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @param {SkillEffectHooks} hooks
     * @param {NodeEnv} env
     * @private
     */
    __applySkillsFromEnemyAllies(targetUnit, enemyUnit, damageCalcEnv, hooks, env) {
        let disablesSkillsFromEnemyAlliesInCombat = false;
        if (enemyUnit) {
            if (enemyUnit.hasStatusEffect(StatusEffectType.Feud) ||
                targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
                disablesSkillsFromEnemyAlliesInCombat = true;
            }
        }
        // enemyAllyにはenemyUnitも含まれる
        for (let enemyAlly of this.enumerateUnitsInTheSameGroupOnMap(enemyUnit, true)) {
            let isEnemyAllyNotEnemy = enemyAlly !== enemyUnit;
            if (disablesSkillsFromEnemyAlliesInCombat && isEnemyAllyNotEnemy) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, enemyAlly)) {
                continue;
            }
            env.setSkillOwner(enemyAlly);
            hooks.evaluateWithUnit(enemyAlly, env);
        }
    }

    __makeFoeFoeEnv(targetUnit, enemyUnit, damageCalcEnv, name) {
        // enemyAlly(skillOwner)は後から設定する
        let env = new ForFoesEnv(this, targetUnit, enemyUnit, null, damageCalcEnv.calcPotentialDamage);
        env.setName(name).setLogLevel(getSkillLogLevel())
            .setDamageType(damageCalcEnv.damageType).setCombatPhase(this.combatPhase)
            .setGroupLogger(damageCalcEnv.getCombatLogger());
        return env;
    }

    __applySpursFromEnemyAlliesAfterCombatStatusFixed(targetUnit, enemyUnit, damageCalcEnv) {
        let env = this.__makeFoeFoeEnv(targetUnit, enemyUnit, damageCalcEnv,
            '周囲の敵からのデバフ(戦闘中のステータス決定後)');
        this.__applySkillsFromEnemyAllies(
            targetUnit, enemyUnit, damageCalcEnv,
            FOR_FOE_STATS_SKILLS_USING_STATS_HOOKS, env
        );
    }

    __applySkillEffectFromEnemyAlliesAfterCombatStatusFixed(targetUnit, enemyUnit, damageCalcEnv) {
        let env = this.__makeFoeFoeEnv(targetUnit, enemyUnit, damageCalcEnv,
            '周囲の敵からのスキル効果(戦闘中のステータス決定後)');
        this.__applySkillsFromEnemyAllies(
            targetUnit, enemyUnit, damageCalcEnv,
            FOR_FOE_NON_STATS_SKILL_USING_STATS_HOOKS, env
        );
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @private
     */
    __applySkillEffectFromEnemyAllies(targetUnit, enemyUnit, damageCalcEnv) {
        let disablesSkillsFromEnemyAlliesInCombat = false;
        if (enemyUnit) {
            if (enemyUnit.hasStatusEffect(StatusEffectType.Feud) ||
                targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
                disablesSkillsFromEnemyAlliesInCombat = true;
            }
        }
        // enemyAllyにはenemyUnitも含まれる
        for (let enemyAlly of this.enumerateUnitsInTheSameGroupOnMap(enemyUnit, true)) {
            let isEnemyAllyNotEnemy = enemyAlly !== enemyUnit;
            if (disablesSkillsFromEnemyAlliesInCombat && isEnemyAllyNotEnemy) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, enemyAlly)) {
                continue;
            }

            let env = new ForFoesEnv(this, targetUnit, enemyUnit, enemyAlly, damageCalcEnv.calcPotentialDamage);
            env.setName('戦闘開始時、周囲の敵からのスキル').setLogLevel(getSkillLogLevel())
                .setDamageType(damageCalcEnv.damageType).setCombatPhase(this.combatPhase)
                .setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_FOES_AT_START_OF_COMBAT_HOOKS.evaluateWithUnit(enemyAlly, env);

            for (let skillId of enemyAlly.enumerateSkills()) {
                let func = getSkillFunc(skillId, applySkillEffectFromEnemyAlliesFuncMap);
                func?.call(this, targetUnit, enemyUnit, enemyAlly, damageCalcEnv.calcPotentialDamage);
            }
            for (let func of targetUnit.battleContext.applySkillEffectFromEnemyAlliesFuncs) {
                func(targetUnit, enemyUnit, enemyAlly, damageCalcEnv.calcPotentialDamage);
            }
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @private
     */
    __applySkillEffectFromAlliesExcludedFromFeud(targetUnit, enemyUnit, damageCalcEnv) {
        if (damageCalcEnv.calcPotentialDamage) {
            return;
        }
        // マップ全域
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            let env = new ForAlliesEnv(this, targetUnit, enemyUnit, allyUnit);
            env.setName('周囲の味方のスキル(暗闘外)').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_AFTER_COMBAT_HOOKS.evaluateWithUnit(allyUnit, env);
            for (let skillId of allyUnit.enumerateSkills()) {
                let func = getSkillFunc(skillId, applySkillEffectFromAlliesExcludedFromFeudFuncMap);
                func?.call(this, targetUnit, enemyUnit, allyUnit, damageCalcEnv.calcPotentialDamage);
                switch (skillId) {
                    case Weapon.ChargingHorn: // 味方に7回復効果
                        if (allyUnit.isWeaponSpecialRefined && allyUnit.isInCrossWithOffset(targetUnit, 1)) {
                            targetUnit.battleContext.healedHpAfterCombat += 7;
                        }
                        break;
                }
            }
        }
        // 周囲2マス以内
        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
            for (let skillId of allyUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.StaffOfLilies:
                        if (allyUnit.isWeaponSpecialRefined) {
                            targetUnit.battleContext.healedHpAfterCombat += 7;
                        }
                        break;
                }
            }
        }
        // 周囲3マス以内
        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3)) {
            for (let skillId of allyUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.BernsNewWay:
                    case Weapon.JoyousTome:
                        targetUnit.battleContext.healedHpAfterCombat += 7;
                        break;
                    case Weapon.AchimenesFurl: {
                        let types = new Set();
                        for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(allyUnit)) {
                            types.add(otherUnit.moveType);
                        }
                        if (types.size >= 3) {
                            targetUnit.battleContext.healedHpByAttack += 5;
                        }
                    }
                        break;
                }
            }
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     */
    __applySkillEffectFromEnemyAlliesAfterOtherSkills(targetUnit, enemyUnit, damageCalcEnv) {
        let disablesSkillsFromEnemyAlliesInCombat = false;
        if (enemyUnit) {
            if (enemyUnit.hasStatusEffect(StatusEffectType.Feud) ||
                targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
                disablesSkillsFromEnemyAlliesInCombat = true;
            }
        }
        // enemyAllyにはenemyUnitも含まれる
        for (let enemyAlly of this.enumerateUnitsInTheSameGroupOnMap(enemyUnit, true)) {
            let isEnemyAllyNotEnemy = enemyAlly !== enemyUnit;
            if (disablesSkillsFromEnemyAlliesInCombat && isEnemyAllyNotEnemy) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, enemyAlly)) {
                continue;
            }

            let env = new ForFoesEnv(this, targetUnit, enemyUnit, enemyAlly, damageCalcEnv.calcPotentialDamage);
            env.setName('周囲の敵からのスキル効果（適用後）').setLogLevel(getSkillLogLevel())
                .setDamageType(damageCalcEnv.damageType).setCombatPhase(this.combatPhase)
                .setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_FOES_INFLICTS_EFFECTS_AFTER_OTHER_SKILLS_HOOKS.evaluateWithUnit(enemyAlly, env);
        }
    }

    __isThereAllyExceptDragonAndBeastWithin1Space(unit) {
        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1)) {
            if (isWeaponTypeBreath(allyUnit.weaponType) === false
                && isWeaponTypeBeast(allyUnit.weaponType) === false) {
                return true;
            }
        }

        return false;
    }

    __setAttackCount(targetUnit, enemyUnit) {
        // 攻撃回数初期化
        let atkWeaponInfo = targetUnit.weaponInfo;
        if (atkWeaponInfo != null) {
            targetUnit.battleContext.updateAttackCount(atkWeaponInfo.attackCount);
            targetUnit.battleContext.updateCounterattackCount(atkWeaponInfo.counterattackCount);
        } else {
            targetUnit.battleContext.attackCount = 0;
            targetUnit.battleContext.counterattackCount = 0;
        }

        for (let func of targetUnit.battleContext.setAttackCountFuncs) {
            func(targetUnit, enemyUnit);
        }

        // Triangle Attack
        if (targetUnit.hasStatusEffect(StatusEffectType.TriangleAttack) &&
            !targetUnit.hasStatusEffect(StatusEffectType.Schism)) {
            let triangleAttackerCount = 0;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                if (unit.hasStatusEffect(StatusEffectType.TriangleAttack) &&
                    !unit.hasStatusEffect(StatusEffectType.Schism)) {
                    triangleAttackerCount++;
                }
            }
            if (targetUnit.battleContext.initiatesCombat && triangleAttackerCount >= 2) {
                targetUnit.battleContext.attackCount = 2;
            }
        }

        // デュアルアタック
        if (targetUnit.hasStatusEffect(StatusEffectType.DualStrike) &&
            !targetUnit.hasStatusEffect(StatusEffectType.Schism)) {
            let found = false;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 1, false)) {
                if (unit.hasStatusEffect(StatusEffectType.DualStrike) &&
                    !unit.hasStatusEffect(StatusEffectType.Schism)) {
                    found = true;
                }
            }
            if (targetUnit.battleContext.initiatesCombat && found) {
                targetUnit.battleContext.attackCount = 2;
            }
        }

        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.HolyWarsEnd2:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        if (enemyUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.counterattackCount = 2;
                        }
                    }
                    break;
                case Weapon.DivineDraught: {
                    let num = targetUnit.battleContext.condValueMap.get("num_cond") || 0;
                    if (num >= 2) {
                        targetUnit.battleContext.attackCount = 2;
                        targetUnit.battleContext.counterattackCount = 2;
                    }
                }
                    break;
                case PassiveB.SunlightBangle:
                    if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                        targetUnit.battleContext.attackCount = 2;
                        targetUnit.battleContext.counterattackCount = 2;
                    }
                    break;
                case Weapon.HeraldingHorn: {
                    let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 3);
                    if (count >= 1) {
                        let advantage = DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit);
                        let isAdvantageous = advantage === TriangleAdvantage.Advantageous;
                        if (isAdvantageous || enemyUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.attackCount = 2;
                            targetUnit.battleContext.counterattackCount = 2;
                        }
                    }
                }
                    break;
                case PassiveB.Shishirenzan:
                    if (targetUnit.battleContext.initiatesCombat
                        && targetUnit.battleContext.isRestHpFull) {
                        targetUnit.battleContext.attackCount = 2;
                    }
                    break;
                case Weapon.RegalSunshade:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let total = 0;
                        let count = 0;
                        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
                            total++;
                            if (Math.abs(targetUnit.posX - unit.posX) <= 1 ||
                                Math.abs(targetUnit.posY - unit.posY) <= 1) {
                                count++;
                            }
                        }
                        let n = 0;
                        if (total >= 6) {
                            n = 3;
                        } else if (total >= 3) {
                            n = 2;
                        } else {
                            n = 1;
                        }
                        if (count >= n) {
                            targetUnit.battleContext.attackCount = 2;
                            targetUnit.battleContext.counterattackCount = 2;
                        }
                    }
                    break;
                case Weapon.UnyieldingOar:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        if (enemyUnit.hasPositiveStatusEffect(targetUnit) ||
                            targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 10) {
                            targetUnit.battleContext.attackCount = 2;
                            targetUnit.battleContext.counterattackCount = 2;
                        }
                    }
                    break;
                case Weapon.FalcionEchoes:
                    if (targetUnit.battleContext.initiatesCombat && targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage === 100) {
                            targetUnit.battleContext.attackCount = 2;
                        }
                    }
                    break;
                case Weapon.ShirokiNoTyokusou:
                case Weapon.ShirokiNoTyouken:
                case Weapon.ShirokiNoTansou:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat
                            && this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x =>
                                x.moveType === MoveType.Flying) >= 2
                        ) {
                            targetUnit.battleContext.attackCount = 2;
                        }
                    }
                    break;
                case Weapon.KurohyoNoYari:
                case Weapon.MogyuNoKen:
                    if (targetUnit.battleContext.initiatesCombat
                        && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                            x.moveType === MoveType.Cavalry
                            && (x.weaponType === WeaponType.Sword
                                || x.weaponType === WeaponType.Lance
                                || x.weaponType === WeaponType.Axe)
                        )) {
                        targetUnit.battleContext.attackCount = 2;
                    }
                    break;
                case Weapon.WakakiKurohyoNoKen:
                case Weapon.WakakiMogyuNoYari:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!targetUnit.battleContext.initiatesCombat
                            && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                                x.moveType === MoveType.Cavalry
                                && (x.weaponType === WeaponType.Sword
                                    || x.weaponType === WeaponType.Lance
                                    || x.weaponType === WeaponType.Axe)
                            )) {
                            targetUnit.battleContext.counterattackCount = 2;
                        }
                    }
                    break;
                case Weapon.GullinkambiEgg: {
                    if (targetUnit.battleContext.initiatesCombat
                        && enemyUnit.battleContext.restHpPercentage >= 75
                        && this.globalBattleContext.isCombatOccuredInCurrentTurn
                    ) {
                        targetUnit.battleContext.attackCount = 2;
                    }
                }
                    break;
                case Weapon.RazuwarudoNoMaiken: {
                    let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 3, x =>
                        x.buffTotal >= 10);
                    if (count >= 2) {
                        targetUnit.battleContext.attackCount = 2;
                        targetUnit.battleContext.counterattackCount = 2;
                    }
                }
                    break;
            }
        }
    }

    __applySkillEffectAfterSetAttackCount(targetUnit, enemyUnit) {
        for (let skillId of targetUnit.enumerateSkills()) {
            getSkillFunc(skillId, applySkillEffectAfterSetAttackCountFuncMap)?.call(this, targetUnit, enemyUnit);
        }
    }

    __isEnemyCountIsGreaterThanOrEqualToAllyCount(skillUnit, battleTargetUnit, calcPotentialDamage) {
        if (calcPotentialDamage) {
            return true;
        }

        let allyCount = this.__countAlliesWithinSpecifiedSpaces(skillUnit, 2, () => true);
        let enemyCount = this.__countEnemiesWithinSpecifiedSpaces(skillUnit, 2, x => x != battleTargetUnit);
        return enemyCount >= allyCount;
    }

    __isAllyCountIsGreaterThanEnemyCount(skillUnit, battleTargetUnit, calcPotentialDamage) {
        if (calcPotentialDamage) {
            return true;
        }

        let allyCount = this.__countAlliesWithinSpecifiedSpaces(skillUnit, 2, () => true);
        let enemyCount = this.__countEnemiesWithinSpecifiedSpaces(skillUnit, 2, x => x != battleTargetUnit);
        return allyCount > enemyCount;
    }

    __countEnemiesWithinSpecifiedSpaces(targetUnit, spaces, predicator) {
        return this._unitManager.countEnemiesWithinSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    /**
     * @param {Unit} targetUnit
     * @param {number} spaces
     * @param {(unit: Unit) => boolean} predicator
     * @returns {number}
     */
    __countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     */
    __setWrathfulStaff(atkUnit, defUnit) {
        if (defUnit.canInvalidateWrathfulStaff()) {
            atkUnit.battleContext.isNeutralizedWrathfulStaff = true;
        }

        let atkWeaponInfo = atkUnit.weaponInfo;
        let passiveBInfo = atkUnit.passiveBInfo;

        // 神罰の杖
        if ((atkWeaponInfo != null && atkWeaponInfo.wrathfulStaff)
            || (passiveBInfo != null && passiveBInfo.wrathfulStaff)
            || (atkUnit.weaponRefinement === WeaponRefinementType.WrathfulStaff)
        ) {
            atkUnit.battleContext.wrathfulStaff = true;
        }
    }

    __setEffectiveAttackEnabledIfPossible(atkUnit, defUnit) {
        if (atkUnit.weaponInfo === null || atkUnit.weaponInfo === undefined) {
            return;
        }

        if (atkUnit.battleContext.isEffectiveToOpponentForciblly) {
            atkUnit.battleContext.isEffectiveToOpponent = true;
            return;
        }

        for (let effective of atkUnit.weaponInfo.effectives) {
            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, effective)) {
                atkUnit.battleContext.isEffectiveToOpponent = true;
                return;
            }
        }

        for (let effective of atkUnit.battleContext.effectivesAgainst) {
            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, effective)) {
                atkUnit.battleContext.isEffectiveToOpponent = true;
                return;
            }
        }

        if (atkUnit.hasStatusEffect(StatusEffectType.EffectiveAgainstDragons)) {
            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Dragon)) {
                atkUnit.battleContext.isEffectiveToOpponent = true;
                return;
            }
        }
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveA.SwiftSlice: {
                    let weaponType = defUnit.weaponType;
                    let threshold = 5;
                    let isNotDragonOrBeast = (!isWeaponTypeBreath(weaponType)) && (!isWeaponTypeBeast(weaponType));
                    if (isNotDragonOrBeast && defUnit.moveType === MoveType.Infantry) {
                        threshold = 20;
                    }
                    if (atkUnit.battleContext.initiatesCombat &&
                        atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + threshold) {
                        if (weaponType === WeaponType.Sword) {
                            // 剣
                            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Sword)) {
                                atkUnit.battleContext.isEffectiveToOpponent = true;
                            }
                        } else if (weaponType === WeaponType.Lance) {
                            // 槍
                            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Lance)) {
                                atkUnit.battleContext.isEffectiveToOpponent = true;
                            }
                        } else if (weaponType === WeaponType.Axe) {
                            // 斧
                            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Axe)) {
                                atkUnit.battleContext.isEffectiveToOpponent = true;
                            }
                        } else if (weaponType === WeaponType.Staff) {
                            // 杖
                            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Staff)) {
                                atkUnit.battleContext.isEffectiveToOpponent = true;
                            }
                        } else if (weaponType === WeaponType.ColorlessBow) {
                            // 無属性弓
                            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.ColorlessBow)) {
                                atkUnit.battleContext.isEffectiveToOpponent = true;
                            }
                        } else if (
                            weaponType === WeaponType.RedBow ||
                            weaponType === WeaponType.BlueBow ||
                            weaponType === WeaponType.GreenBow
                        ) {
                            // 色弓特効は今後出るか分からないので弓特効の判定でまとめておく
                            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Bow)) {
                                atkUnit.battleContext.isEffectiveToOpponent = true;
                            }
                        } else if (
                            weaponType === WeaponType.RedBeast ||
                            weaponType === WeaponType.BlueBeast ||
                            weaponType === WeaponType.GreenBeast ||
                            weaponType === WeaponType.ColorlessBeast
                        ) {
                            // 獣
                            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Beast)) {
                                atkUnit.battleContext.isEffectiveToOpponent = true;
                            }
                        } else if (
                            weaponType === WeaponType.RedBreath ||
                            weaponType === WeaponType.BlueBreath ||
                            weaponType === WeaponType.GreenBreath ||
                            weaponType === WeaponType.ColorlessBreath
                        ) {
                            // 竜
                            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Dragon)) {
                                atkUnit.battleContext.isEffectiveToOpponent = true;
                            }
                        } else if (isWeaponTypeDagger(weaponType)) {
                            // 暗器
                            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Dagger)) {
                                atkUnit.battleContext.isEffectiveToOpponent = true;
                            }
                        } else if (isWeaponTypeTome(weaponType)) {
                            // 魔法
                            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Tome)) {
                                atkUnit.battleContext.isEffectiveToOpponent = true;
                            }
                        } else {
                            atkUnit.battleContext.isEffectiveToOpponent = true;
                        }
                    }
                }
                    break;
            }
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     */
    __applySpurForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, damageCalcEnv) {
        for (let func of targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs) {
            func(targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        }
        let env =
            new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        env.setName('戦闘中バフ決定後バフ').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
        targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedNodes.forEach(node => node.evaluate(env));
        STATS_SKILL_USING_STATS_HOOKS.evaluateWithUnit(targetUnit, env);
        if (targetUnit.hasStatusEffect(StatusEffectType.GrandStrategy)) {
            if (!targetUnit.hasStatusEffect(StatusEffectType.Ploy)) {
                this.__applyDebuffReverse(targetUnit, "ステータス:神軍師の策");
            }
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Sabotage)) {
            this.__applySabotage(targetUnit);
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.FoePenaltyDoubler)) {
            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
            enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
            enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
        }
        this.__applyBonusReversals(targetUnit, enemyUnit);
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.TeacakeTowerPlus:
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.atkSpur -= Math.max(enemyUnit.getAtkBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.spdSpur -= Math.max(enemyUnit.getSpdBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.defSpur -= Math.max(enemyUnit.getDefBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.resSpur -= Math.max(enemyUnit.getResBuffInCombat(targetUnit), 0) * 2;
                    }
                    break;
                case Weapon.DreamHorn:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let maxBuff = targetUnit.getBuffTotalInCombat(enemyUnit);
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                            if (maxBuff < unit.buffTotal) {
                                maxBuff = unit.buffTotal;
                            }
                        }
                        let amount = Math.trunc(maxBuff * 0.5);
                        enemyUnit.addAtkDefSpurs(-amount);
                    }
                    break;
                case Weapon.PackleaderTome:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.ArcaneNihility:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        this.__applyBuffAbsorption(targetUnit, enemyUnit);
                        enemyUnit.atkSpur -= enemyUnit.getAtkBuffInCombat(targetUnit);
                        enemyUnit.spdSpur -= enemyUnit.getSpdBuffInCombat(targetUnit);
                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                        enemyUnit.resSpur -= enemyUnit.getResBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.DesertTigerAxe:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        let atk = targetUnit.getAtkBuffInCombat(enemyUnit);
                        let spd = targetUnit.getAtkBuffInCombat(enemyUnit);
                        let def = targetUnit.getAtkBuffInCombat(enemyUnit);
                        let res = targetUnit.getAtkBuffInCombat(enemyUnit);
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                            if (atk < unit.getAtkBuff()) atk = unit.getAtkBuff();
                            if (spd < unit.getSpdBuff()) spd = unit.getSpdBuff();
                            if (def < unit.getDefBuff()) def = unit.getDefBuff();
                            if (res < unit.getResBuff()) res = unit.getResBuff();
                        }
                        targetUnit.addSpurs(atk, spd, def, res);
                    }
                    break;
                case Weapon.BaraNoYari:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25 ||
                            targetUnit.getEvalAtkInCombat(enemyUnit) >= enemyUnit.getEvalAtkInCombat(targetUnit) + 1) {
                            enemyUnit.addAtkDefSpurs(-6);
                        }
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            let max = 0;
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                                let buffTotal;
                                if (unit === targetUnit) {
                                    buffTotal = unit.getBuffTotalInCombat(enemyUnit);
                                } else {
                                    buffTotal = unit.buffTotal;
                                }
                                if (buffTotal > max) {
                                    max = buffTotal;
                                }
                            }
                            let amount = Math.trunc(max * 0.5);
                            targetUnit.atkSpur += amount;
                            enemyUnit.atkSpur -= amount;
                            targetUnit.battleContext.healedHpAfterCombat += 7;
                        }
                    }
                    break;
                case Weapon.VioldrakeBow:
                    if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.WyvernHatchet:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= Math.max(7 - Math.abs(enemyUnit.atkDebuffTotal), 0);
                    }
                    break;
                case Weapon.RingOfAffiancePlus:
                case Weapon.BridalBladePlus:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.atkSpur -= Math.max(enemyUnit.getAtkBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.spdSpur -= Math.max(enemyUnit.getSpdBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.defSpur -= Math.max(enemyUnit.getDefBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.resSpur -= Math.max(enemyUnit.getResBuffInCombat(targetUnit), 0) * 2;
                    }
                    break;
                case Weapon.DeadFangAxe:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        this.__applyBuffAbsorption(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.SilentBreath:
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= Math.max(enemyUnit.getAtkBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.spdSpur -= Math.max(enemyUnit.getSpdBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.defSpur -= Math.max(enemyUnit.getDefBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.resSpur -= Math.max(enemyUnit.getResBuffInCombat(targetUnit), 0) * 2;
                    }
                    break;
                case Weapon.Merikuru:
                    if (targetUnit.isWeaponSpecialRefined) {
                        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3);
                        let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units);
                        targetUnit.addSpurs(...amounts);
                    }
                    break;
                case PassiveA.PartOfThePlan:
                    this.__applyDebuffReverse(targetUnit, targetUnit.weaponInfo.name);
                    break;
                case Weapon.CrimeanScepter: {
                    let buffs = [];
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                        buffs.push(unit.buffs);
                    }
                    buffs.push([
                        targetUnit.getAtkBuffInCombat(enemyUnit),
                        targetUnit.getSpdBuffInCombat(enemyUnit),
                        targetUnit.getDefBuffInCombat(enemyUnit),
                        targetUnit.getResBuffInCombat(enemyUnit),
                    ]);
                    let amounts = buffs.reduce(
                        (previousValue, currentValue) =>
                            previousValue.map((buff, index) => Math.max(buff, currentValue[index])),
                        [0, 0, 0, 0]);
                    amounts = amounts.map(b => Math.trunc(b * 1.5));
                    amounts[2] = 0;
                    amounts[3] = 0;
                    targetUnit.addSpurs(...amounts);
                }
                    break;
                case Weapon.Queenslance: {
                    let units = [];
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                        if (targetUnit.partnerHeroIndex === unit.heroIndex ||
                            unit.partnerHeroIndex === targetUnit.heroIndex) {
                            units.push(unit);
                        }
                    }
                    let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units);
                    targetUnit.addSpurs(...amounts);
                }
                    break;
                case Weapon.ReginRave:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() + 1 ||
                            targetUnit.hasPositiveStatusEffect()) {
                            targetUnit.addAllSpur(4);
                        }
                        if (targetUnit.getAtkInCombat(enemyUnit) >= enemyUnit.getAtkInCombat(targetUnit) ||
                            targetUnit.hasPositiveStatusEffect()) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                        }
                    }
                    break;
                case Weapon.LanceOfHeroics:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            this.__applyDebuffReverse(targetUnit, targetUnit.weaponInfo.name);
                        }
                    }
                    break;
                case Weapon.SnideBow: {
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        }
                    }
                    break;
                }
                case Weapon.FlamefrostBow: {
                    let maxBuff = enemyUnit.getBuffTotalInCombat(targetUnit);
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                        maxBuff = Math.max(unit.buffTotal, maxBuff);
                    }

                    let amount = Math.trunc(maxBuff * 0.7);
                    targetUnit.addSpurs(amount, 0, amount, amount);
                }
                    break;
                case Weapon.WyvernOno:
                    targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getEvalDefInCombat(enemyUnit) * 0.20);
                    targetUnit.battleContext.damageReductionValue += Math.trunc(targetUnit.getEvalDefInCombat(enemyUnit) * 0.20);
                    break;
                case Weapon.DefiersSwordPlus:
                case Weapon.DefiersLancePlus:
                case Weapon.DefiersAxePlus:
                case Weapon.DefiersBowPlus:
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.defSpur += enemyUnit.getDefBuffInCombat(targetUnit);
                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.BladeOfFavors:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                    }
                    break;
                case Weapon.YonkaiNoSaiki:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            targetUnit.addSpurs(5, 5, 0, 0);
                            let buff = targetUnit.getBuffTotalInCombat(enemyUnit) + enemyUnit.getBuffTotalInCombat(targetUnit);
                            let amount = Math.min(Math.trunc(buff * 0.4), 10);
                            targetUnit.addSpurs(amount, amount, 0, 0);
                        }
                    }
                    break;
                case Weapon.Kormt:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let condA = this.__isThereAllyInSpecifiedSpaces(targetUnit, 3);
                        let condB = this.__isThereAllyIn2Spaces(enemyUnit);
                        let condC = targetUnit.hasPositiveStatusEffect(enemyUnit);
                        let condD = enemyUnit.hasNegativeStatusEffect();
                        let conditions = [condA, condB, condC, condD];
                        let count = conditions.filter(x => x).length;
                        let amount = Math.min(count * 3, 9);
                        enemyUnit.addAllSpur(-amount);
                    }
                    break;
                case Weapon.BridalSunflowerPlus:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.atkSpur += targetUnit.getAtkBuffInCombat(enemyUnit);
                        targetUnit.defSpur += targetUnit.getDefBuffInCombat(enemyUnit);
                    }
                    break;
                case Weapon.BlazingPolearms:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        let amount = Math.min(6, Math.trunc(targetUnit.getBuffTotalInCombat(enemyUnit) * 0.5));
                        enemyUnit.addAllSpur(-amount);
                    }
                    break;
                case Weapon.BridalOrchidPlus:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.atkSpur += targetUnit.getAtkBuffInCombat(enemyUnit);
                        targetUnit.resSpur += targetUnit.getResBuffInCombat(enemyUnit);
                    }
                    break;
                case Weapon.AversasNight:
                    if (targetUnit.isWeaponSpecialRefined) {
                        // <特殊錬成効果>
                        if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                            enemyUnit.addSpurs(-4, -4, 0, -4);
                            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                            enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                            enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                        }
                    }
                    break;
                case Weapon.FoxkitFang:
                    if (!targetUnit.isWeaponRefined) {
                        // <通常効果>
                        if (enemyUnit.weaponType === WeaponType.Sword ||
                            enemyUnit.weaponType === WeaponType.Lance ||
                            enemyUnit.weaponType === WeaponType.Axe ||
                            isWeaponTypeBreath(enemyUnit.weaponType) ||
                            isWeaponTypeBeast(enemyUnit.weaponType)) {

                            if (targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat()) {
                                let atkRes = targetUnit.getResInCombat(enemyUnit);
                                let defRes = enemyUnit.getResInCombat(targetUnit);
                                let spurAmount = Math.min(8, Math.floor((atkRes - defRes) * 0.5));
                                targetUnit.addAllSpur(spurAmount);
                            }
                        }
                    } else {
                        // <錬成効果>
                        let atkRes = targetUnit.getEvalResInPrecombat();
                        let defRes = enemyUnit.getEvalResInPrecombat();
                        targetUnit.addAllSpur(4);
                        if (atkRes > defRes) {
                            let spurAmount = Math.min(8, Math.floor((atkRes - defRes) * 0.8));
                            targetUnit.addAllSpur(spurAmount);
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            // <特殊錬成効果>
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                                targetUnit.addAllSpur(4);
                            }
                        }
                    }
                    break;
                case Weapon.FeruniruNoYouran:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            let maxBuff = 0;
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                                maxBuff = Math.max(unit.buffTotal, maxBuff);
                            }
                            targetUnit.atkSpur += maxBuff;
                        }
                    }
                    break;
                case Weapon.HvitrvulturePlus:
                case Weapon.GronnvulturePlus:
                case Weapon.BlarvulturePlus:
                    if (this.__isSolo(targetUnit) || damageCalcEnv.calcPotentialDamage) {
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.TomeOfReason:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            targetUnit.addAllSpur(4);
                            let amount = Math.trunc((targetUnit.getDefBuffInCombat(enemyUnit) + targetUnit.getResBuffInCombat(enemyUnit)) * 0.6);
                            enemyUnit.atkSpur -= amount;
                            enemyUnit.resSpur -= amount;
                        }
                    }
                    break;
                case Weapon.Gyorru: {
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            enemyUnit.atkSpur -= Math.max(enemyUnit.getAtkBuffInCombat(targetUnit), 0) * 2;
                            enemyUnit.defSpur -= Math.max(enemyUnit.getDefBuffInCombat(targetUnit), 0) * 2;
                        }
                    }
                }
                    break;
                case Weapon.Sogun:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                            enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        }
                    }
                    break;
                case Weapon.JotnarBow:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.atkSpur -= targetUnit.getAtkBuffInCombat(enemyUnit);
                        enemyUnit.spdSpur -= targetUnit.getSpdBuffInCombat(enemyUnit);
                        enemyUnit.defSpur -= targetUnit.getDefBuffInCombat(enemyUnit);
                    }
                    break;
                case Weapon.TannenbowPlus:
                case Weapon.WinterRapierPlus:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyDefUnity();
                    }
                    break;
                case Weapon.SnowGlobePlus:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case Weapon.FlameOfMuspell:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        let amount = 0;
                        let buff = targetUnit.getBuffTotalInCombat(enemyUnit) + enemyUnit.getBuffTotalInCombat(targetUnit);
                        amount = Math.min(Math.trunc(buff * 0.5), 12);
                        if (amount > 0) {
                            targetUnit.addAllSpur(amount);
                        }
                        if (buff >= 10) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.FangedBasilikos:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                                enemyUnit.spdSpur -= enemyUnit.getSpdBuffInCombat(targetUnit) * 2;
                                enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit) * 2;
                            }
                        }
                    }
                    break;
                case Weapon.DivineMist:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            let amount =
                                targetUnit.getDefBuffInCombat(enemyUnit) +
                                targetUnit.getResBuffInCombat(enemyUnit);
                            enemyUnit.atkSpur -= Math.trunc(amount * 0.75);
                        }
                    }
                    break;
                case Weapon.SunflowerBowPlus:
                case Weapon.VictorfishPlus:
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.defSpur += enemyUnit.getDefBuffInCombat(targetUnit);

                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.DivineSeaSpear:
                    if (targetUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        this.__applyBuffAbsorption(targetUnit, enemyUnit, 1, 1, 1, 0);
                    }
                    break;
                case Weapon.PeachyParfaitPlus:
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.resSpur += enemyUnit.getResBuffInCombat(targetUnit);

                        enemyUnit.resSpur -= enemyUnit.getResBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.BladeOfRenais:
                    if (targetUnit.battleContext.initiatesCombat
                        || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                    ) {
                        targetUnit.addAllSpur(5);

                        if (targetUnit.hasPositiveStatusEffect(enemyUnit)
                            || targetUnit.hasNegativeStatusEffect()
                        ) {
                            let value = Math.trunc(0.2 * enemyUnit.getDefInCombat(targetUnit));
                            targetUnit.battleContext.healedHpByAttack += value;
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
                            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                            }
                        }
                    }
                    break;
                case Weapon.BouryakuNoSenkyu:
                    if (!targetUnit.isWeaponRefined) {
                        // <通常効果>
                        if (targetUnit.buffTotal + enemyUnit.debuffTotal >= 10) {
                            enemyUnit.addAllSpur(-5);
                        }
                    } else {
                        // <錬成効果>
                        if (targetUnit.hasPositiveStatusEffect(targetUnit) || enemyUnit.hasNegativeStatusEffect()) {
                            enemyUnit.addAllSpur(-5);
                        }
                        targetUnit.atkSpur += targetUnit.getAtkBuffInCombat(enemyUnit);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
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
                case Weapon.AkatsukiNoHikari:
                    if (!targetUnit.isWeaponRefined) {
                        if (enemyUnit.atkDebuffTotal < 0) { targetUnit.atkSpur += -enemyUnit.atkDebuffTotal; }
                        if (enemyUnit.spdDebuffTotal < 0) { targetUnit.spdSpur += -enemyUnit.spdDebuffTotal; }
                        if (enemyUnit.defDebuffTotal < 0) { targetUnit.defSpur += -enemyUnit.defDebuffTotal; }
                        if (enemyUnit.resDebuffTotal < 0) { targetUnit.resSpur += -enemyUnit.resDebuffTotal; }
                    } else {
                        if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.addAllSpur(4);
                            if (enemyUnit.atkDebuffTotal < 0) { targetUnit.atkSpur += -enemyUnit.atkDebuffTotal; }
                            if (enemyUnit.spdDebuffTotal < 0) { targetUnit.spdSpur += -enemyUnit.spdDebuffTotal; }
                            if (enemyUnit.defDebuffTotal < 0) { targetUnit.defSpur += -enemyUnit.defDebuffTotal; }
                            if (enemyUnit.resDebuffTotal < 0) { targetUnit.resSpur += -enemyUnit.resDebuffTotal; }
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                                targetUnit.atkSpur += 6;
                                targetUnit.resSpur += 6;
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                        }
                    }
                    break;
                case Weapon.HurricaneDagger:
                case Weapon.SyukuseiNoAnki:
                case Weapon.SyukuseiNoAnkiPlus:
                    targetUnit.atkSpur += Math.max(enemyUnit.getBuffTotalInCombat(targetUnit), 0);
                    break;
                case Weapon.Faraflame:
                case Weapon.GunshinNoSyo:
                case Weapon.MitteiNoAnki:
                case Weapon.AokarasuNoSyo:
                    if (targetUnit.isWeaponSpecialRefined) {
                        DamageCalculationUtility.applyDebuffBlade(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.Blizard:
                case Weapon.HaNoOugiPlus:
                    DamageCalculationUtility.applyDebuffBlade(targetUnit, enemyUnit);
                    break;
                case Weapon.Hyoushintou:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        DamageCalculationUtility.applyDebuffBlade(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.SyugosyaNoRekkyu:
                    if (!targetUnit.isWeaponRefined) {
                        // <通常効果>
                        if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat() ||
                            targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.spdSpur -= 5;
                            enemyUnit.defSpur -= 5;
                        }
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
                case Weapon.ShinkenFalcion:
                case PassiveA.SpdDefIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.spdSpur += value;
                            unit.defSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.SpdResIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.spdSpur += value;
                            unit.resSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.DefResIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.defSpur += value;
                            unit.resSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.AtkSpdIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value;
                            unit.spdSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.AtkResIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value;
                            unit.resSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.AtkSpdIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value; unit.spdSpur += value;
                        });
                    break;
                case PassiveA.AtkDefIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value;
                            unit.defSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.AtkDefIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value; unit.defSpur += value;
                        });
                    break;
                case PassiveA.AtkResIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value; unit.resSpur += value;
                        });
                    break;
                case PassiveA.SpdDefIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.spdSpur += value; unit.defSpur += value;
                        });
                    break;
                case PassiveA.SpdResIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.spdSpur += value; unit.resSpur += value;
                        });
                    break;
                case PassiveA.DefResIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.defSpur += value; unit.resSpur += value;
                        });
                    break;
                case PassiveA.AtkSpdUnity:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applySpdUnity();
                    }
                    break;
                case PassiveA.AtkDefUnity:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyDefUnity();
                    }
                    break;
                case PassiveA.AtkResUnity:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case PassiveA.SpdDefUnity:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applySpdUnity();
                        targetUnit.applyDefUnity();
                    }
                    break;
                case PassiveA.DefResUnity:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyDefUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case PassiveB.SealAtk4:
                    if (!enemyUnit.battleContext.invalidatesOwnAtkDebuff) {
                        let amount = Math.max(7 - Math.abs(enemyUnit.atkDebuffTotal), 0);
                        enemyUnit.atkSpur -= amount;
                    }
                    break;
                case PassiveB.SealSpd4:
                    if (!enemyUnit.battleContext.invalidatesOwnSpdDebuff) {
                        let amount = Math.max(7 - Math.abs(enemyUnit.spdDebuffTotal), 0);
                        enemyUnit.spdSpur -= amount;
                    }
                    break;
                case PassiveB.SealDef4:
                    if (!enemyUnit.battleContext.invalidatesOwnDefDebuff) {
                        let amount = Math.max(7 - Math.abs(enemyUnit.defDebuffTotal), 0);
                        enemyUnit.defSpur -= amount;
                    }
                    break;
                case PassiveB.SealRes4:
                    if (!enemyUnit.battleContext.invalidatesOwnResDebuff) {
                        let amount = Math.max(7 - Math.abs(enemyUnit.resDebuffTotal), 0);
                        enemyUnit.resSpur -= amount;
                    }
                    break;
                case PassiveB.BindingNecklace:
                    if (this.__isSolo(targetUnit) || damageCalcEnv.calcPotentialDamage) {
                        targetUnit.addAllSpur(2);
                        enemyUnit.addAllSpur(-2);
                        this.__applyBuffAbsorption(targetUnit, enemyUnit);
                    }
                    break;
                case PassiveB.BindingNecklacePlus:
                    if (enemyUnit.battleContext.initiatesCombat ||
                        this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                        this.__applyBuffAbsorption(targetUnit, enemyUnit);
                    }
                    break;
                case PassiveC.HumanVirtue2: {
                    let maxBuffs = new Array(4).fill(0);
                    let buffTotals = [];
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                        if (!isWeaponTypeBreathOrBeast(unit.weaponType) &&
                            !unit.hasStatusEffect(StatusEffectType.Panic)) {
                            let buffs = unit.buffs;
                            maxBuffs = maxBuffs.map((v, i) => Math.max(v, buffs[i]));
                            buffTotals.push(unit.buffTotal);
                        }
                    }
                    targetUnit.addSpurs(...maxBuffs);

                    buffTotals.sort((a, b) => b - a);
                    // 周囲2マス以内の竜、獣以外の味方の強化の合計値が高い上位3人の強化の合計値(最大40)
                    let amount = Math.min(40, buffTotals.slice(0, 3).reduce((a, b) => a + b, 0));
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(amount / 100.0, enemyUnit);
                    break;
                }
            }
        }
    }

    __applyBonusReversals(targetUnit, enemyUnit) {
        if (targetUnit.battleContext.isAtkBonusReversal) {
            targetUnit.atkSpur -= Math.max(targetUnit.getAtkBuffInCombat(enemyUnit), 0) * 2;
        }
        if (targetUnit.battleContext.isSpdBonusReversal) {
            targetUnit.spdSpur -= Math.max(targetUnit.getSpdBuffInCombat(enemyUnit), 0) * 2;
        }
        if (targetUnit.battleContext.isDefBonusReversal) {
            targetUnit.defSpur -= Math.max(targetUnit.getDefBuffInCombat(enemyUnit), 0) * 2;
        }
        if (targetUnit.battleContext.isResBonusReversal) {
            targetUnit.resSpur -= Math.max(targetUnit.getResBuffInCombat(enemyUnit), 0) * 2;
        }
    }

    __applyPotent(targetUnit, enemyUnit, baseRatio = 0.4, evalSpd = -25,
                  isFixed = false, canFollowUp = false) {
        let canPotentFollowUp =
            DamageCalculationUtility.examinesCanFollowupAttack(targetUnit, enemyUnit, evalSpd) || canFollowUp;
        if (canPotentFollowUp) {
            let potentRatio = baseRatio;
            if (!targetUnit.battleContext.isTwiceAttackActivating() &&
                !targetUnit.battleContext.canFollowupAttackWithoutPotent) {
                potentRatio = baseRatio * 2;
            }
            if (isFixed) {
                potentRatio = baseRatio;
            }
            targetUnit.battleContext.potentRatios.push(potentRatio);
        }
    }

    // 最も高い強化値を返す。
    // 対象キャラ全員にパニックがかかっている場合でもマイナスは返さない（0を返す）。
    __getHighestBuffs(targetUnit, enemyUnit, units, withTargetUnit = false) {
        let buffsArray = [];
        if (withTargetUnit) {
            buffsArray.push(targetUnit.getBuffsInCombat(enemyUnit));
        }
        for (let unit of units) {
            buffsArray.push(unit.buffs);
        }
        buffsArray.push([
            targetUnit.getAtkBuffInCombat(enemyUnit),
            targetUnit.getSpdBuffInCombat(enemyUnit),
            targetUnit.getDefBuffInCombat(enemyUnit),
            targetUnit.getResBuffInCombat(enemyUnit),
        ]);
        let func = (previousBuffs, currentBuffs) =>
            previousBuffs.map((buff, index) => Math.max(buff, currentBuffs[index]));
        return buffsArray.reduce(func, [0, 0, 0, 0]);
    }

    __getHighestTotalBuff(targetUnit, enemyUnit, units, withTargetUnit = false) {
        let buffArray = [];
        if (withTargetUnit) {
            buffArray.push(targetUnit.getBuffTotalInCombat(enemyUnit));
        }
        for (let unit of units) {
            buffArray.push(unit.buffTotal);
        }
        return Math.max(...buffArray);
    }

    __applyBuffAbsorption(targetUnit, enemyUnit,
        atk = 1, spd = 1, def = 1, res = 1) {
        let enemyBuffs = enemyUnit.getBuffsInCombat(targetUnit);
        let enables = [atk, spd, def, res];
        enemyBuffs = enemyBuffs.map((v, i) => v * enables[i]);
        targetUnit.addSpurs(...enemyBuffs);
        enemyUnit.addSpurs(...enemyBuffs.map(v => -v));
    }

    __applyDebuffReverse(targetUnit, skillName = "弱化反転効果") {
        let spurs = targetUnit.debuffTotals.map(i => Math.abs(i) * 2);
        if (this.isLogEnabled) {
            let message = `${skillName}により攻+${spurs[0]}, 速+${spurs[1]}, 守+${spurs[2]}, 魔+${spurs[3]}`;
            this.__writeDamageCalcDebugLog(message);
        }
        targetUnit.addSpurs(...spurs);
    }

    __applySabotage(targetUnit, spaces = 2, withTargetUnit = true) {
        let maxDebuffs = this.__maxDebuffsFromAlliesWithinSpecificSpaces(targetUnit, spaces, withTargetUnit);
        targetUnit.addSpurs(...maxDebuffs);
    }

    // 能力値ごとの最大のデバフを返す
    // デバフが最大とはマイナスの値が大きいことであることに注意
    __maxDebuffsFromAlliesWithinSpecificSpaces(targetUnit, spaces = 2, withTargetUnit = true) {
        let debuffsArray = [];
        if (withTargetUnit) {
            // 戦闘相手は戦闘中弱化無効を考慮
            debuffsArray.push(targetUnit.debuffTotals);
        }
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces)) {
            // 周囲のユニットは戦闘中弱化無効を考慮しない
            debuffsArray.push(unit.getDebuffTotals(true));
        }
        let func = (previousDebuffs, currentDebuffs) =>
            previousDebuffs.map((debuff, index) => Math.min(debuff, currentDebuffs[index]));
        return debuffsArray.reduce(func, [0, 0, 0, 0]);
    }

    __isThereAllyIn2Spaces(targetUnit) {
        return this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
    }

    __isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    __isThereAllyInSquare(targetUnit, n, predicator = null) {
        let m = Math.trunc(n / 2);
        for (let ally of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (Math.abs(ally.posX - targetUnit.posX) <= m &&
                Math.abs(ally.posY - targetUnit.posY) <= m) {
                if (predicator) {
                    if (predicator(ally)) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        }
        return false;
    }

    static __applyIdealEffect(targetUnit, enemyUnit, buffFunc, buffAmount = 7, additionalBuffAmount = 2) {
        if (targetUnit.battleContext.restHpPercentage === 100 || targetUnit.hasPositiveStatusEffect(enemyUnit)) {
            buffFunc(targetUnit, buffAmount);
            if (targetUnit.battleContext.restHpPercentage === 100 && targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                buffFunc(targetUnit, additionalBuffAmount);
            }
        }
    }

    __isSolo(unit) {
        return this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1).next().done;
    }


    addFixedDamageByStatus(targetUnit, enemyUnit, index, ratio = 0.2) {
        let statuses = targetUnit.getStatusesInCombat(enemyUnit);
        targetUnit.battleContext.additionalDamage += Math.trunc(statuses[index] * ratio);
    }

    static __applyBonusDoubler(targetUnit, enemyUnit) {
        if (targetUnit.hasPanic) {
            return;
        }

        targetUnit.atkSpur += targetUnit.getAtkBuffInCombat(enemyUnit);
        targetUnit.spdSpur += targetUnit.getSpdBuffInCombat(enemyUnit);
        targetUnit.defSpur += targetUnit.getDefBuffInCombat(enemyUnit);
        targetUnit.resSpur += targetUnit.getResBuffInCombat(enemyUnit);
    }

    static __applyHeavyBladeSkill(atkUnit, defUnit) {
        if (atkUnit.getEvalAtkInCombat(defUnit) > defUnit.getEvalAtkInCombat(atkUnit)) {
            atkUnit.battleContext.increaseCooldownCountForAttack = true;
        }
    }

    static __applyFlashingBladeSkill(atkUnit, defUnit) {
        if (atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)) {
            atkUnit.battleContext.increaseCooldownCountForAttack = true;
        }
    }

    // ステータスによる固定ダメージ増加・軽減(マリア算など)
    applyFixedValueSkill(targetUnit, enemyUnit, statusIndex, ratio = 0.20) {
        let statuses = targetUnit.getStatusesInCombat(enemyUnit);
        targetUnit.battleContext.additionalDamage += Math.trunc(statuses[statusIndex] * ratio);
        targetUnit.battleContext.damageReductionValue += Math.trunc(statuses[statusIndex] * ratio);
    }

    /**
     * ステータス参照による固定ダメージ軽減
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {boolean[]} statusFlags (ex) 守備: [false, false, true, false], 守備と魔防の高い方: [false, false, true, true]
     * @param {number} ratio=0.2
     */
    applyDamageReductionByOwnStatus(targetUnit, enemyUnit, statusFlags, ratio = 0.20) {
        let status = targetUnit.getHighestStatusInCombat(enemyUnit, statusFlags);
        targetUnit.battleContext.damageReductionValue += Math.trunc(status * ratio);
    }

    __getDamageReductionRatio(skillId, atkUnit, defUnit) {
        switch (skillId) {
            case Weapon.DreamHorn:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return 0.3;
                }
                break;
            case Weapon.HarukazeNoBreath:
                if (defUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.initiatesCombat ||
                        atkUnit.battleContext.restHpPercentage >= 75) {
                        let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                        if (resDiff > 0) {
                            let percentage = resDiff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                            return percentage / 100.0;
                        }
                    }
                }
                break;
            case Weapon.VoidTome:
                if (defUnit.isWeaponSpecialRefined) {
                    if (atkUnit.getDefInPrecombat() >= 35 ||
                        atkUnit.getResInPrecombat() >= 35 ||
                        atkUnit.hasNegativeStatusEffect()) {
                        return Math.min(Math.max(atkUnit.getDefInPrecombat(), atkUnit.getResInPrecombat()), 50) / 100.0;
                    }
                }
                break;
            case Weapon.BaraNoYari:
                if (defUnit.isWeaponRefined) {
                    let diff = defUnit.getEvalAtkInCombat(atkUnit) - atkUnit.getEvalAtkInCombat(defUnit);
                    return Math.min(Math.max(diff * 0.02, 0), 0.4);
                }
                break;
            case Weapon.FreebladesEdge:
                return 0.3;
            case PassiveB.GuardBearing4:
                if (atkUnit.battleContext.initiatesCombat &&
                    !defUnit.isOneTimeActionActivatedForPassiveB) {
                    return 0.6;
                } else {
                    return 0.3;
                }
            case Weapon.LoneWolf:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return 0.3;
                }
                break;
            case Weapon.MaskedLance:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        return DamageCalculationUtility.getResDodgeDamageReductionRatio(atkUnit, defUnit);
                    }
                }
                break;
            case Weapon.ValiantWarAxe:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return 0.3;
                }
                break;
            case Weapon.Queensblade:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return 0.3;
                }
                break;
            case Weapon.MonarchBlade:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                }
                break;
            case Weapon.Liberation:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                }
                break;
            case Weapon.JoyousTome: {
                let pred = unit => unit.hpPercentage >= 50;
                let count = this.__countAlliesWithinSpecifiedSpaces(defUnit, 3, pred);
                if (count > 0) {
                    let percentage = Math.min(count * 15, 45);
                    if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`ダメージ${percentage}%軽減`);
                    return percentage / 100.0;
                }
            }
                break;
            case PassiveA.AsherasChosenPlus:
                if (this.__isThereAllyExceptDragonAndBeastWithin1Space(defUnit) === false ||
                    defUnit.battleContext.restHpPercentage >= 75) {
                    let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (resDiff > 0) {
                        let percentage = Math.min(resDiff * 4, 40);
                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`ダメージ${percentage}%軽減`);
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.FangOfFinality: {
                let count = this.__countAlliesWithinSpecifiedSpaces(atkUnit, 3) + 1;
                let percentage = Math.min(count * 20, 60);
                return percentage / 100.0;
            }
            case Weapon.ShiseiNaga:
                if (defUnit.battleContext.weaponSkillCondSatisfied) {
                    let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (resDiff > 0) {
                        let percentage = Math.min(resDiff * 4, 40);
                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`ダメージ${percentage}%軽減`);
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.WandererBlade:
                if (defUnit.isWeaponSpecialRefined && defUnit.battleContext.restHpPercentage >= 25) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                }
                break;
            case PassiveB.Chivalry:
                return atkUnit.battleContext.restHpPercentage * 0.5 / 100;
            case Weapon.Mafu:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.restHpPercentage >= 25 && !isWeaponTypeTome(atkUnit.weaponType)) {
                        return 0.3;
                    }
                }
                break;
            case PassiveB.AssuredRebirth: {
                let diff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                let percentage = 0;
                let count = 0;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 3)) {
                    if (unit.weaponType === WeaponType.Staff || isWeaponTypeBreath(unit.weaponType)) {
                        count++;
                    }
                }
                percentage += count * 20;
                if (diff > 0) {
                    let p = Math.min(diff * 4, 40);
                    percentage += p;
                }
                percentage = Math.min(percentage, 60);
                return percentage / 100.0;
            }
            case Weapon.WindyWarTome:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.restHpPercentage >= 75) {
                    let diff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (diff > 0) {
                        let percentage = diff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                        return percentage / 100.0;
                    }
                }
                break;
            case Special.VitalAstra:
                if (defUnit.isSpecialCharged) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 3, 30);
                }
                break;
            case Weapon.HurricaneDagger:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 3, 30);
                    }
                }
                break;
            case Weapon.RaikenJikurinde:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
                    }
                }
                break;
            case Weapon.LilacJadeBreath:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.restHpPercentage === 100) {
                    return 0.4;
                }
                break;
            case Weapon.GiltGoblet:
                if ((atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.restHpPercentage === 100) &&
                    isWeaponTypeTome(atkUnit.weaponType)) {
                    return 0.5;
                }
                break;
            case Weapon.Roputous:
                if (defUnit.isWeaponRefined) {
                    if (!atkUnit.isWeaponEffectiveAgainst(EffectiveType.Dragon)) {
                        let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                        if (resDiff > 0) {
                            let percentage = resDiff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                            return percentage / 100.0;
                        }
                    }
                }
                break;
            case PassiveB.TrueDragonWall: {
                let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                let r = 0;
                let maxPercentage = 0;
                if (!defUnit.isOneTimeActionActivatedForPassiveB) {
                    r = 6;
                    maxPercentage = 60;
                } else {
                    r = 4;
                    maxPercentage = 40;
                }
                if (resDiff > 0) {
                    let percentage = resDiff * r;
                    percentage = Math.min(percentage, maxPercentage);
                    if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                    return percentage / 100.0;
                }
                break;
            }
            case Weapon.TwinDivinestone:
            case PassiveB.NewDivinity:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (resDiff > 0) {
                        let percentage = resDiff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                        return percentage / 100.0;
                    }
                }
                break;
            case PassiveB.DragonWall3:
            case Weapon.NewFoxkitFang:
                {
                    let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (resDiff > 0) {
                        let percentage = resDiff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.BrightmareHorn:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    {
                        let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
                            return percentage / 100.0;
                        }
                    }
                }
                break;
            case Weapon.NightmareHorn:
            case Weapon.NewBrazenCatFang:
                {
                    let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                    if (diff > 0) {
                        let percentage = diff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
                        return percentage / 100.0;
                    }
                }
                break;
            case PassiveB.MoonTwinWing:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
                }
                break;
            case Weapon.NinissIceLance:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(defUnit)) {
                        return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
                    }
                }
                break;
            case PassiveB.BeastSense4:
            case PassiveB.Bushido2:
            case PassiveB.Velocity3:
            case PassiveB.Frenzy3:
            case PassiveB.Spurn3:
            case PassiveB.KaihiIchigekiridatsu3:
            case PassiveB.KaihiTatakikomi3:
                return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
            case PassiveB.Spurn4:
            case PassiveB.Repel4:
            case PassiveB.CloseCall4:
                return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 5, 50);
            case PassiveB.BlueLionRule:
                {
                    let defUnitDef = defUnit.getEvalDefInCombat(atkUnit);
                    let atkUnitDef = atkUnit.getEvalDefInCombat(defUnit);
                    let diff = defUnitDef - atkUnitDef;
                    if (diff > 0) {
                        let percentage = diff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`蒼き獅子王によりダメージ${percentage}%軽減(守備の差 ${defUnitDef}-${atkUnitDef}=${diff})`);
                        return percentage / 100.0;
                    }
                }
                break;
        }

        return 0;
    }

    __applyDamageReductionRatio(atkUnit, defUnit) {
        for (let func of defUnit.battleContext.getDamageReductionRatioFuncs) {
            let ratio = func(atkUnit, defUnit);
            if (ratio > 0) {
                defUnit.battleContext.addDamageReductionRatio(ratio);
            }
        }

        for (let skillId of defUnit.enumerateSkills()) {
            let ratio = this.__getDamageReductionRatio(skillId, atkUnit, defUnit);
            if (ratio > 0) {
                defUnit.battleContext.addDamageReductionRatio(ratio);
            }
        }

        if (defUnit.hasStatusEffect(StatusEffectType.Dodge)) {
            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
            if (ratio > 0) {
                defUnit.battleContext.addDamageReductionRatio(ratio);
            }
        }
    }


    /// 戦闘前奥義、戦闘のどちらでも同様の効果のスキルの実装
    __applySkillEffectForPrecombatAndCombat(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.Bushido2:
                    targetUnit.battleContext.additionalDamage += 7;
                    break;
            }
        }
    }

    /**
     * 通常の固定ダメージはここで実装する
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Boolean} isPrecombat
     */
    __calcFixedAddDamage(atkUnit, defUnit, isPrecombat) {
        for (let func of atkUnit.battleContext.calcFixedAddDamageFuncs) {
            func(atkUnit, defUnit, isPrecombat);
        }

        if (atkUnit.hasStatusEffect(StatusEffectType.Treachery)) {
            if (!atkUnit.hasStatusEffect(StatusEffectType.Ploy)) {
                atkUnit.battleContext.additionalDamage += atkUnit.getBuffTotalInCombat(defUnit);
            }
        }

        for (let skillId of atkUnit.enumerateSkills()) {
            getSkillFunc(skillId, calcFixedAddDamageFuncMap)?.call(this, atkUnit, defUnit, isPrecombat);
            this.#calcFixedAddDamageForSkill(skillId, atkUnit, defUnit, isPrecombat);
        }
    }

    #calcFixedAddDamageForSkill(skillId, atkUnit, defUnit, isPrecombat) {
        switch (skillId) {
            case Weapon.TeatimesEdge:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    if (!isPrecombat) {
                        let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.2);
                    }
                }
                break;
            case Weapon.KnightlyManner:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    if (!isPrecombat) {
                        let atk = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.15);
                    }
                }
                break;
            case PassiveA.Mastermind:
                if (atkUnit.battleContext.initiatesCombat ||
                    this.__isThereAllyIn2Spaces(atkUnit)) {
                    let buffTotal = atkUnit.getBuffTotalInCombat(defUnit);
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 2)) {
                        if (buffTotal < unit.buffTotal) {
                            buffTotal = unit.buffTotal;
                        }
                    }
                    let debuffTotal = Math.abs(defUnit.getDebuffTotalInCombat());
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 2)) {
                        let total = Math.abs(unit.getDebuffTotalInCombat());
                        if (debuffTotal < total) {
                            buffTotal = total;
                        }
                    }
                    let amount = Math.trunc(buffTotal * 0.8) + Math.trunc(debuffTotal * 0.8);
                    atkUnit.battleContext.additionalDamage += amount;
                }
                break;
            case Weapon.TomeOfLaxuries:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    let res = DamageCalculatorWrapper.__getRes(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(res * 0.15);
                }
                break;
            case Weapon.FathersSonAxe:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.weaponSkillCondSatisfied ||
                        atkUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyInSpecifiedSpaces(atkUnit, 2)) {
                        atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.hp * 0.15);
                        atkUnit.battleContext.weaponSkillCondSatisfied = true;
                    }
                }
                break;
            case Weapon.ArcaneNihility:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.15);
                }
                break;
            case Weapon.KishisyogunNoHousou:
                if (atkUnit.battleContext.weaponSkillCondSatisfied && !isPrecombat) {
                    let spd = atkUnit.getSpdInCombat(defUnit);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.15);
                }
                break;
            case Weapon.VoidTome:
                if (atkUnit.isWeaponSpecialRefined) {
                    let enemyAtk = defUnit.getAtkInPrecombat();
                    if (enemyAtk >= 50 && !isPrecombat) {
                        atkUnit.battleContext.additionalDamage += Math.trunc(enemyAtk * 0.15);
                    }
                }
                break;
            case Weapon.DivineDraught: {
                let num = atkUnit.battleContext.condValueMap.get("num_cond") || 0;
                if (num === 3 && !isPrecombat) {
                    let atkAtk = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                    let defAtk = DamageCalculatorWrapper.__getAtk(defUnit, atkUnit, isPrecombat);
                    let atk = Math.max(atkAtk, defAtk);
                    atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.15);
                }
            }
                break;
            case Weapon.HeartbrokerBow: {
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.15);
                }
            }
                break;
            case Weapon.FreebladesEdge:
                if (atkUnit.isWeaponSpecialRefined) {
                    let def = DamageCalculatorWrapper.__getDef(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(def * 0.15);
                }
                break;
            case Weapon.Aymr:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.restHpPercentage >= 75 || this.__isSolo(atkUnit)) {
                        let atk = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.15);
                    }
                }
                break;
            case Weapon.HadoNoSenfu:
                // <特殊錬成効果>
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.initiatesCombat || this.__isSolo(atkUnit)) {
                        let atk = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.1);
                    }
                }
                break;
            case PassiveB.PoeticJustice: {
                // 杖に範囲奥義がないので、範囲奥義にもダメージが加算されるのかは不明。とりあえず加味しておく
                let atk = DamageCalculatorWrapper.__getAtk(defUnit, atkUnit, isPrecombat);
                atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.15);
            }
                break;
            case Weapon.HurricaneDagger:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        if (DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat) >
                            DamageCalculatorWrapper.__getSpd(defUnit, atkUnit, isPrecombat)) {
                            atkUnit.battleContext.additionalDamage += 5;
                        }
                    }
                }
                break;
            case Weapon.SurfersSpire:
            case Weapon.SurfersSpade:
                if (!isPrecombat) {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.2);
                }
                break;
            case Weapon.SyugosyaNoRekkyu:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.1);
                    }
                }
                break;
            case Weapon.VioldrakeBow:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.1);
                }
                break;
            case Weapon.Heidr:
            case Weapon.GoldenCurse:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                    if (!isPrecombat) {
                        let atk = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.15);
                    }
                }
                break;
            case Weapon.IlianMercLance:
                if (this.__countAlliesWithinSpecifiedSpaces(atkUnit, 1) <= 1) {
                    let atk = DamageCalculatorWrapper.__getAtk(defUnit, atkUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.15);
                }
                break;
            case Weapon.FujinRaijinYumi:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.2);
                }
                break;
            case Weapon.DeadFangAxe:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    let atk = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.1);
                }
                break;
            case Weapon.SilentBreath:
                if (atkUnit.battleContext.initiatesCombat || defUnit.battleContext.restHpPercentage >= 75) {
                    if (!isPrecombat) {
                        let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.2);
                    }
                }
                break;
            case Weapon.Asclepius:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    atkUnit.battleContext.additionalDamage += Math.abs(defUnit.debuffTotal);
                }
                break;
            case Weapon.ArcaneLuin:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.2);
                }
                break;
            case Weapon.AbyssalBlade:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.2);
                }
                break;
            case PassiveA.AsherasChosenPlus: {
                let diff = atkUnit.getEvalResInCombat(defUnit) - defUnit.getEvalResInCombat(atkUnit);
                if (diff > 0) {
                    atkUnit.battleContext.additionalDamage += Math.min(Math.trunc(diff * 0.7), 7);
                }
            }
                break;
            case Weapon.Queensblade:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.20);
                }
                break;
            case Weapon.MonarchBlade:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    if (isPrecombat) break;
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.15);
                }
                break;
            case Weapon.JoyousTome: {
                if (!isPrecombat) {
                    let pred = unit => unit.hpPercentage >= 50;
                    let count = this.__countAlliesWithinSpecifiedSpaces(atkUnit, 3, pred);
                    atkUnit.battleContext.additionalDamage += Math.min(count * 5, 15);
                }
            }
                break;
            case Weapon.MasterBow:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                        let atk = DamageCalculatorWrapper.__getAtk(defUnit, atkUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.1);
                    }
                }
                break;
            case Weapon.CelestialGlobe:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.2);
                }
                break;
            case Weapon.Seidr:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                    let res = DamageCalculatorWrapper.__getRes(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(res * 0.2);
                }
                break;
            case PassiveB.HodrsZeal: {
                let atk = isPrecombat ? atkUnit.getAtkInPrecombat() : atkUnit.getEvalAtkInCombat(atkUnit);
                atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.20);
                break;
            }
            case PassiveB.LunarBrace2: {
                let def = isPrecombat ? defUnit.getEvalDefInPrecombat() : defUnit.getEvalDefInCombat(atkUnit);
                atkUnit.battleContext.additionalDamage += Math.trunc(def * 0.15);
            }
                break;
            case PassiveB.Atrocity:
                if (defUnit.battleContext.restHpPercentage >= 50) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getAtkInCombat() * 0.25);
                }
                break;
            case PassiveA.HeavyBlade4:
                if (DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat) >
                    DamageCalculatorWrapper.__getAtk(defUnit, atkUnit, isPrecombat)) {
                    atkUnit.battleContext.additionalDamage += 5;
                }
                break;
            case PassiveA.FlashingBlade4:
                if (DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat) >
                    DamageCalculatorWrapper.__getSpd(defUnit, atkUnit, isPrecombat)) {
                    atkUnit.battleContext.additionalDamage += 5;
                }
                break;
            case PassiveA.HashinDanryuKen: {
                let atk = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.25);
            }
                break;
            case Weapon.ChaosManifest:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(atkUnit) && !isPrecombat) {
                        let debuffTotal = defUnit.debuffTotal;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 2)) {
                            debuffTotal = Math.min(debuffTotal, unit.getDebuffTotal(true));
                        }
                        atkUnit.battleContext.additionalDamage += Math.abs(debuffTotal);
                    }
                }
                break;
            case Weapon.ArdentDurandal:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                        let def = DamageCalculatorWrapper.__getDef(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(def * 0.15);
                    }
                }
                break;
            case Weapon.TaguelChildFang:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.restHpPercentage >= 50) {
                        let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.1);
                    }
                }
                break;
            case Weapon.FirelightLance:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(defUnit.getEvalAtkInCombat(atkUnit) * 0.15);
                }
                break;
            case Weapon.NewHeightBow:
                if (this.__isThereAllyInSpecifiedSpaces(atkUnit, 3)) {
                    let amount = isPrecombat ? atkUnit.getEvalSpdInCombat(defUnit) : atkUnit.getEvalSpdInCombat(defUnit);
                    atkUnit.battleContext.additionalDamage += Math.trunc(amount * 0.15);
                }
                break
            case Weapon.TrueLoveRoses:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                    let amount = isPrecombat ? atkUnit.getEvalResInPrecombat() : atkUnit.getEvalResInCombat(defUnit);
                    atkUnit.battleContext.additionalDamage += Math.trunc(amount * 0.1);
                }
                break;
            case Weapon.MugenNoSyo:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        let amount = isPrecombat ? atkUnit.getEvalAtkInCombat(defUnit) : atkUnit.getEvalAtkInCombat(defUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(amount * 0.15);
                    }
                }
                break;
            case Weapon.AncientCodex:
                if (this.__isThereAllyInSpecifiedSpaces(atkUnit, 3)) {
                    let atkRes = isPrecombat ? atkUnit.getEvalResInPrecombat() : atkUnit.getEvalResInCombat(defUnit);
                    let defRes = isPrecombat ? defUnit.getEvalResInPrecombat() : defUnit.getEvalResInCombat(atkUnit);
                    let res = Math.max(atkRes, defRes);
                    atkUnit.battleContext.additionalDamage += Math.trunc(res * 0.2);
                }
                break;
            case Weapon.BladeOfJehanna:
                if (atkUnit.battleContext.restHpPercentage >= 25) {
                    const isCross = atkUnit.posX === defUnit.posX || atkUnit.posY === defUnit.posY;
                    if (!isCross) {
                        let defUnitAtk = DamageCalculatorWrapper.__getAtk(defUnit, atkUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(defUnitAtk * 0.15);
                    }
                }
                break;
            case Weapon.SparklingFang:
                if (defUnit.battleContext.restHpPercentage >= 75) {
                    atkUnit.battleContext.additionalDamage += 5;
                }
                break;
            case Weapon.InviolableAxe:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                    atkUnit.battleContext.additionalDamage += 7;
                }
                break;
            case Weapon.Arrow:
                if (atkUnit.isWeaponRefined) {
                    let defUnitAtk = DamageCalculatorWrapper.__getAtk(defUnit, atkUnit, isPrecombat);
                    if (DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat) < defUnitAtk) {
                        atkUnit.battleContext.additionalDamage += Math.trunc(defUnitAtk * 0.15);
                    }
                }
                break;
            case Weapon.KazesNeedle:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        if (DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat) >
                            DamageCalculatorWrapper.__getSpd(defUnit, atkUnit, isPrecombat)) {
                            atkUnit.battleContext.additionalDamage += 5;
                        }
                    }
                }
                break;
            case Weapon.NinjutsuScrolls:
                if (atkUnit.battleContext.initiatesCombat) {
                    let additionalDamage = DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y),
                        0.7,
                        7
                    );
                    atkUnit.battleContext.additionalDamage += additionalDamage;
                }
                break;
            case Weapon.ShurikenCleaverPlus:
            case Weapon.NinjaNaginataPlus:
            case Weapon.NinjaYumiPlus:
                if (atkUnit.battleContext.initiatesCombat) {
                    let additionalDamage1 = DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y),
                        0.5,
                        4
                    );
                    atkUnit.battleContext.additionalDamage += additionalDamage1;
                }
                break;
            case Weapon.MakenMistoruthin:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (defUnit.restHpPercentage >= 75) {
                        atkUnit.battleContext.additionalDamageOfSpecial += 7;
                    }
                }
                break;
            case Weapon.RoseQuartsBow:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(atkUnit, 2)) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.2);
                }
                break;
            case Weapon.SpySongBow:
            case Weapon.HikariNoKen:
            case Weapon.ShiningBow:
            case Weapon.ShiningBowPlus:
            case Weapon.ZeroNoGyakukyu: {
                let def = 0;
                let res = 0;
                if (isPrecombat) {
                    def = defUnit.getDefInPrecombat();
                    res = defUnit.getResInPrecombat();
                } else {
                    def = defUnit.getDefInCombat(atkUnit);
                    res = defUnit.getResInCombat(atkUnit);
                }
                if (res <= def - 5) {
                    atkUnit.battleContext.additionalDamage += 7;
                }
            }
                break;
            case Weapon.TsubakiNoKinnagitou:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.restHpPercentage >= 70) {
                        atkUnit.battleContext.additionalDamage += 7;
                    }
                }
                break;
            case Weapon.SatougashiNoAnki:
                if (atkUnit.battleContext.initiatesCombat) {
                    let value = 0;
                    if (isPrecombat) {
                        value = atkUnit.getSpdInPrecombat();
                    } else {
                        value = atkUnit.getSpdInCombat(defUnit);
                    }
                    atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.1);
                }
                if (atkUnit.isWeaponSpecialRefined) {
                    if (isPrecombat) {
                        if (defUnit.isRestHpFull) {
                            atkUnit.battleContext.additionalDamage += 7;
                        }
                    } else {
                        if (defUnit.battleContext.isRestHpFull) {
                            atkUnit.battleContext.additionalDamage += 7;
                        }
                    }
                }
                break;
            case Weapon.LunaArc:
                if (!atkUnit.isWeaponRefined) {
                    // <通常効果>
                    if (atkUnit.battleContext.initiatesCombat) {
                        let value = isPrecombat ? defUnit.getDefInPrecombat() : defUnit.getDefInCombat(atkUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.25);
                    }
                } else {
                    // <錬成効果>
                    if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                        let value = isPrecombat ? defUnit.getDefInPrecombat() : defUnit.getDefInCombat(atkUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.25);
                    }
                }
                break;
            case Weapon.BladeOfRenais:
                if (atkUnit.battleContext.initiatesCombat
                    || this.__isThereAllyInSpecifiedSpaces(atkUnit, 2)
                ) {
                    if (atkUnit.hasPositiveStatusEffect(defUnit)
                        || atkUnit.hasNegativeStatusEffect()
                    ) {
                        let value = isPrecombat ? defUnit.getDefInPrecombat() : defUnit.getDefInCombat(atkUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(0.2 * value);
                    }
                }
                break;
            case Weapon.TenseiAngel:
                if (!atkUnit.isWeaponRefined) {
                    // <通常効果>
                    if (atkUnit.battleContext.initiatesCombat) {
                        let value = isPrecombat ? defUnit.getResInPrecombat() : defUnit.getResInCombat(atkUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.25);
                    }
                } else {
                    // <錬成効果>
                    if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                        let value = isPrecombat ? defUnit.getResInPrecombat() : defUnit.getResInCombat(atkUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.25);
                    }
                }
                break;
            case Weapon.NewFoxkitFang: {
                let additionalDamage = DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                    atkUnit, defUnit, isPrecombat,
                    x => x.getEvalResInPrecombat(),
                    (x, y) => x.getEvalResInCombat(y),
                    0.7, 7);
                atkUnit.battleContext.additionalDamage += additionalDamage;
            }
                break;
            case Weapon.KenhimeNoKatana:
                if (atkUnit.isWeaponRefined) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.15);
                } else {
                    let additionalDamage = DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y),
                        0.7, 7);
                    atkUnit.battleContext.additionalDamage += additionalDamage;
                }
                break;
            case Weapon.KarasuOuNoHashizume:
                if (!atkUnit.isWeaponRefined) {
                    let additionalDamage = DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y), 0.7, 7);
                    atkUnit.battleContext.additionalDamage += additionalDamage;
                } else {
                    if (atkUnit.battleContext.initiatesCombat || defUnit.battleContext.restHpPercentage >= 75) {
                        atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.15);
                    }
                }
                break;
            case Weapon.NewBrazenCatFang:
            case Weapon.AkaiAhiruPlus: {
                let additionalDamage = DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                    atkUnit, defUnit, isPrecombat,
                    x => x.getEvalSpdInPrecombat(),
                    (x, y) => x.getEvalSpdInCombat(y), 0.7, 7);
                atkUnit.battleContext.additionalDamage += additionalDamage;
            }
                break;
            case Weapon.GigaExcalibur:
                if (atkUnit.isWeaponRefined) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.2);
                } else {
                    let additionalDamage = DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y),
                        0.7, 7);
                    atkUnit.battleContext.additionalDamage += additionalDamage;
                }
                break;
            case Weapon.KieiWayuNoKen:
                if (atkUnit.isWeaponSpecialRefined) {
                    let additionalDamage = DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y),
                        0.7, 7);
                    atkUnit.battleContext.additionalDamage += additionalDamage;
                }
                break;
            default:
                break;
        }
    }

    static __getAtk(atkUnit, defUnit, isPrecombat) {
        return isPrecombat ? atkUnit.getAtkInPrecombat() : atkUnit.getAtkInCombat(defUnit);
    }
    static __getSpd(atkUnit, defUnit, isPrecombat) {
        return isPrecombat ? atkUnit.getSpdInPrecombat() : atkUnit.getSpdInCombat(defUnit);
    }
    static __getDef(atkUnit, defUnit, isPrecombat) {
        return isPrecombat ? atkUnit.getDefInPrecombat() : atkUnit.getDefInCombat(defUnit);
    }
    static __getRes(atkUnit, defUnit, isPrecombat) {
        return isPrecombat ? atkUnit.getResInPrecombat() : atkUnit.getResInCombat(defUnit);
    }

    static __calcAddDamageForDiffOfNPercent(atkUnit, defUnit, isPrecombat, getPrecombatFunc, getCombatFunc, ratio, maxAddDamage) {
        let diff = 0;
        if (isPrecombat) {
            diff = getPrecombatFunc(atkUnit) - getPrecombatFunc(defUnit);
        } else {
            diff = getCombatFunc(atkUnit, defUnit) - getCombatFunc(defUnit, atkUnit);
        }
        if (diff > 0) {
            let addDamage = Math.trunc(diff * ratio);
            if (addDamage > maxAddDamage) {
                addDamage = maxAddDamage;
            }
            return addDamage;
        }
        return 0;
    }

    __examinesCanFollowupAttack(atkUnit, defUnit) {
        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`${atkUnit.getNameWithGroup()}の速さによる追撃評価:`);
        this.__logSpdInCombat(atkUnit, defUnit, TabChar);
        this.__logSpdInCombat(defUnit, atkUnit, TabChar);
        if (this.isLogEnabled) {
            this.__writeDamageCalcDebugLog(`${TabChar}${atkUnit.nameWithGroup}の速さの追撃条件: ${atkUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack}`);
            this.__writeDamageCalcDebugLog(`${TabChar}${defUnit.nameWithGroup}の速さの追撃条件: ${defUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack}`);
        }
        let result = DamageCalculationUtility.examinesCanFollowupAttack(atkUnit, defUnit);
        if (result) {
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが5以上高いので追撃可能");
        } else {
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが足りないので追撃不可");
        }
        return result;
    }

    __logSpdInCombat(unit, enemyUnit, tab = "") {
        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(tab + unit.getNameWithGroup()
            + `の戦闘中速さ${unit.getSpdInCombat(enemyUnit)}(速さ${unit.spdWithSkills}、強化${unit.getSpdBuffInCombat(enemyUnit)}、弱化${unit.spdDebuff}、戦闘中強化${unit.spdSpur})`);
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @returns {boolean}
     * @private
     */
    __examinesCanFollowupAttackForAttacker(atkUnit, defUnit, damageCalcEnv) {
        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`${atkUnit.getNameWithGroup()}の追撃評価 ------`);
        let [followUpInc, followUpDec] =
            this.getFollowupAttackPriorityForBoth(atkUnit, defUnit, damageCalcEnv);
        {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.DarkSpikesT:
                        if (atkUnit.battleContext.restHpPercentage <= 99) {
                            followUpInc++;
                        }
                        break;
                    case Weapon.Jikumunt:
                        if (atkUnit.battleContext.restHpPercentage >= 90) {
                            followUpInc++;
                        }
                        break;
                    case Weapon.SoulCaty:
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.battleContext.restHpPercentage <= 75 && this.canCounterAttack(atkUnit, defUnit)) {
                                followUpInc++;
                            }
                        }
                        break;
                    case Weapon.RohyouNoKnife:
                        if ((defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) && this.canCounterAttack(atkUnit, defUnit)) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.BoldFighter3:
                        followUpInc++; break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (this.isOddTurn) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (this.isEvenTurn) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.Sashitigae3:
                        if (atkUnit.battleContext.restHpPercentage <= 50 && this.canCounterAttack(atkUnit, defUnit)) {
                            followUpInc++;
                        }
                        break;
                }
            }
        }

        {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.Kazenagi3:
                        followUpDec--;
                        break;
                    case PassiveB.Mizunagi3:
                        followUpDec--;
                        break;
                }
            }
        }

        damageCalcEnv.combatResult.atkUnitFollowUpPriorityInc = followUpInc;
        damageCalcEnv.combatResult.atkUnitFollowUpPriorityDec = followUpDec;

        // 追撃無効の処理
        // TODO: 符号がわかりにくいので修正する(decも正の値に)
        if (defUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            followUpInc = 0;
        }
        if (atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            followUpDec = 0;
        }
        let followupAttackPriority = followUpInc + followUpDec;
        if (followupAttackPriority < 0) {
            // 追撃不可を受けた
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(atkUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(atkUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
            return true;
        } else {
            // 速さ勝負
            return this.__examinesCanFollowupAttack(atkUnit, defUnit);
        }
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @returns {boolean}
     * @private
     */
    __examinesCanFollowupAttackForDefender(atkUnit, defUnit, damageCalcEnv) {
        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`${defUnit.getNameWithGroup()}の追撃評価 ------`);
        let [followUpInc, followUpDec] =
            this.getFollowupAttackPriorityForBoth(defUnit, atkUnit, damageCalcEnv);
        {
            for (let skillId of [defUnit.passiveB, defUnit.passiveS]) {
                switch (skillId) {
                    case PassiveB.SlickFighter3:
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.BlueLionRule:
                        followUpInc++;
                        break;
                    case PassiveB.HolyWarsEnd:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.QuickRiposte1:
                        if (defUnit.battleContext.restHpPercentage >= 90) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.QuickRiposte2:
                        if (defUnit.battleContext.restHpPercentage >= 80) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.QuickRiposte3:
                        if (defUnit.battleContext.restHpPercentage >= 70) {
                            // this.writeDebugLogLine("HP" + defUnit.battleContext.restHpPercentage + "%で切り返し発動、" + defUnit.getNameWithGroup() + "は絶対追撃");
                            followUpInc++;
                        }
                        break;
                    case PassiveB.QuickRiposte4:
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.DragonsIre3:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.VengefulFighter3:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            followUpInc++;
                        }
                        break;
                }
            }
            switch (defUnit.weapon) {
                case Weapon.Marute:
                    if (defUnit.isWeaponRefined) {
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            followUpInc++;
                        }
                    }
                    else if (defUnit.battleContext.restHpPercentage >= 50) {
                        followUpInc++;
                    }
                    break;

                case Weapon.Arumazu:
                    if (defUnit.battleContext.restHpPercentage >= 80) {
                        followUpInc++;
                    }
                    break;
                case Weapon.HuinNoKen:
                case Weapon.MoumokuNoYumi:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            followUpInc++;
                        }
                    }
                    break;
            }
        }

        {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.InstantBowPlus:
                    case Weapon.InstantSwordPlus:
                    case Weapon.InstantLancePlus:
                    case Weapon.InstantAxePlus:
                        followUpDec--;
                        break;
                    case Weapon.Rifia:
                        if (!atkUnit.isWeaponRefined) {
                            if (atkUnit.battleContext.restHpPercentage >= 50) {
                                followUpDec--;
                            }
                        }
                        break;
                    case Weapon.HewnLance:
                        if (atkUnit.isWeaponSpecialRefined) {
                            followUpDec--;
                        }
                        break;
                    case Weapon.KarenNoYumi:
                        if (atkUnit.isWeaponSpecialRefined) {
                            followUpDec--;
                        }
                        break;
                    case Weapon.BlazingDurandal:
                        if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                            followUpDec--;
                        }
                        break;
                    case Weapon.MasterBow:
                        if (atkUnit.groupId === UnitGroupType.Ally) {
                            followUpDec--;
                        }
                        break;
                    case Weapon.AijouNoHanaNoYumiPlus:
                    case Weapon.BukeNoSteckPlus:
                        followUpDec--;
                        break;
                    case PassiveA.KishinKongoNoSyungeki:
                    case PassiveA.KishinMeikyoNoSyungeki:
                    case PassiveA.SteadyImpact:
                    case PassiveA.SwiftImpact:
                        followUpDec--;
                        break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (this.isOddTurn) {
                            followUpDec--;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (this.isEvenTurn) {
                            followUpDec--;
                        }
                        break;
                }
            }
        }

        damageCalcEnv.combatResult.defUnitFollowUpPriorityInc = followUpInc;
        damageCalcEnv.combatResult.defUnitFollowUpPriorityDec = followUpDec;

        // 追撃無効の処理
        // TODO: 符号がわかりにくいので修正する(decも正の値に)
        if (atkUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            followUpInc = 0;
        }
        if (defUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            followUpDec = 0;
        }
        let followupAttackPriority = followUpInc + followUpDec;
        if (followupAttackPriority < 0) {
            // 追撃不可を受けた
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
            return true;
        } else {
            // 速さ勝負
            return this.__examinesCanFollowupAttack(defUnit, atkUnit);
        }
    }

    canCounterAttack(atkUnit, defUnit, calcPotentialDamage = true, damageType = DamageType.PotentialDamage) {
        return this.__examinesCanCounterattackBasically(atkUnit, defUnit, calcPotentialDamage, damageType)
            && !this.__canDisableCounterAttack(atkUnit, defUnit);
    }

    // 反撃不可ならばtrueを反撃不可を無効にするならfalseを返す
    __canDisableCounterAttack(atkUnit, defUnit) {
        // defUnitが見切り・反撃効果を持っている場合(falseを返す場合)
        if (defUnit.battleContext.nullCounterDisrupt) {
            return false;
        }
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.IceBoundBrand:
                    if (isRangedWeaponType(atkUnit.weaponType)) {
                        return false;
                    }
                    break;
                case Weapon.Queensblade:
                    return false;
                case Weapon.BrilliantStarlight:
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        return false;
                    }
                    break;
                case PassiveB.MikiriHangeki3:
                case PassiveB.NullCDisrupt4:
                    return false;
                case PassiveB.MysticBoost4:
                    if (atkUnit.weaponType === WeaponType.Staff) {
                        return false;
                    }
                    break;
                case Weapon.NiflsBite:
                    if (this.__isThereAllyIn2Spaces(defUnit) && atkUnit.isRangedWeaponType()) {
                        return false;
                    }
                    break;
            }
        }
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Queensblade:
                    return false;
            }
        }

        if (defUnit.hasStatusEffect(StatusEffectType.CounterattacksDisrupted)) {
            return true;
        }

        if (atkUnit.battleContext.invalidatesCounterattack) {
            return true;
        }

        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.KnightlyManner:
                    if (!isWeaponTypeBow(defUnit.weaponType) &&
                        !isWeaponTypeDagger(defUnit.weaponType)) {
                        return true;
                    }
                    break;
                case Weapon.FujinRaijinYumi:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        if (DamageCalculationUtility.calcAttackerTriangleAdvantage(atkUnit, defUnit) === TriangleAdvantage.Advantageous ||
                            atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)) {
                            return true;
                        }
                    }
                    break;
                case Weapon.ZekkaiNoSoukyu:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 25) {
                            if (defUnit.isMeleeWeaponType() &&
                                atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + 5) {
                                return true;
                            }
                        }
                    }
                    break;
                case Weapon.LunaArc:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (defUnit.isPhysicalAttacker() &&
                            atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + 5) {
                            return true;
                        }
                    }
                    break;
                case Weapon.SoothingScent:
                    if (atkUnit.battleContext.weaponSkillCondSatisfied) {
                        if (atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + 1) {
                            return true;
                        }
                    }
                    break;
                case Weapon.ChilledBreath:
                    if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                        if (atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + 5) {
                            return true;
                        }
                    }
                    break;
                case Weapon.Mafu:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 25 && !isWeaponTypeTome(defUnit.weaponType)) {
                            return true;
                        }
                    }
                    break;
                case Weapon.AdroitWarTome:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        if (atkUnit.getEvalResInCombat(defUnit) >= defUnit.getEvalResInCombat(atkUnit) + 5) {
                            if (isPhysicalWeaponType(defUnit.weaponType)) {
                                return true;
                            }
                        }
                    }
                    break;
                case Weapon.QuickMulagir:
                    if (atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + 5) {
                        return true;
                    }
                    break;
                case Weapon.BrightShellEgg:
                    if (atkUnit.hasPositiveStatusEffect(defUnit) || defUnit.hasNegativeStatusEffect()) {
                        let amount = atkUnit.getBuffTotalInCombat(defUnit) + Math.abs(defUnit.getDebuffTotalInCombat());
                        if (amount >= 18) {
                            return true;
                        }
                    }
                    break;
                case Weapon.BladeOfJehanna:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        const isCross = atkUnit.posX === defUnit.posX || atkUnit.posY === defUnit.posY;
                        if (isCross) {
                            return true;
                        }
                    }
                    break;
                case Weapon.RyukenFalcion:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 25 && isPhysicalWeaponType(defUnit.weaponType)) {
                            if (atkUnit.getEvalSpdInCombat() >= defUnit.getSpdInCombat() + 1) {
                                return true;
                            }
                        }
                    }
                    break;
                case Weapon.Nizuheggu:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (isWeaponTypeTome(defUnit.weaponType) || isWeaponTypeBreath(defUnit.weaponType)) {
                            return true;
                        }
                    }
                    break;
                case Weapon.SnipersBow:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 50
                            && this.__isTherePartnerInSpace2(atkUnit)
                        ) {
                            return true;
                        }
                    }
                    break;
                case Weapon.DeathlyDagger:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (isWeaponTypeTome(defUnit.weaponType)) {
                            return true;
                        }
                    }
                    break;
                case PassiveA.LawsOfSacae2:
                    if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(atkUnit, 2)) {
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
        }

        // 反撃不可
        let atkWeaponInfo = atkUnit.weaponInfo;
        let passiveBInfo = atkUnit.passiveBInfo;
        if ((atkWeaponInfo != null && atkWeaponInfo.disableCounterattack)
            || (passiveBInfo != null && passiveBInfo.disableCounterattack)
            || (atkUnit.weaponRefinement === WeaponRefinementType.DazzlingStaff)
            || (atkUnit.passiveB === PassiveB.SacaesBlessing
                && (defUnit.weaponType === WeaponType.Sword || defUnit.weaponType === WeaponType.Lance || defUnit.weaponType === WeaponType.Axe))
            || (atkUnit.hasPassiveSkill(PassiveB.Kazenagi3)
                && atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)
                && isPhysicalWeaponType(defUnit.weaponType))
            || (atkUnit.hasPassiveSkill(PassiveB.Mizunagi3)
                && atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)
                && !isPhysicalWeaponType(defUnit.weaponType))
            || (atkUnit.passiveB === PassiveB.FuinNoTate && isWeaponTypeBreath(defUnit.weaponType))
            || (atkUnit.passiveB === PassiveB.BindingShield2 &&
                (isWeaponTypeBreath(defUnit.weaponType) ||
                    atkUnit.getEvalSpdInCombat() >= defUnit.getEvalSpdInCombat() + 5))
        ) {
            return true;
        }
        return false;
    }

    __examinesCanCounterattackBasically(atkUnit, defUnit, calcPotentialDamage, damageType) {
        if (!defUnit.hasWeapon) {
            return false;
        }

        for (let skillId of defUnit.enumerateSkills()) {
            if (defUnit.isTransformed &&
                BEAST_COMMON_SKILL_MAP.has(skillId) &&
                BEAST_COMMON_SKILL_MAP.get(skillId) === BeastCommonSkillType.Armor) {
                return true;
            }
        }

        if (defUnit.battleContext.canCounterattackToAllDistance) {
            return true;
        }

        if (atkUnit.isStyleActive) {
            let env = new DamageCalculatorWrapperEnv(this, atkUnit, defUnit, calcPotentialDamage);
            env.setName('スタイル時に反撃可能を受ける').setLogLevel(getSkillLogLevel()).setDamageType(damageType);
            if (SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS.evaluateSomeWithUnit(atkUnit, env)) {
                return true;
            }
        } else {
            if (atkUnit.attackRange === defUnit.attackRange) {
                return true;
            }
        }

        // 相手の武器種による全距離反撃
        if (atkUnit.isRangedWeaponType()) {
            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveA.DistantCounter:
                    case PassiveA.OstiasCounter:
                        return true;
                    case PassiveA.DistantFoil:
                        if (isPhysicalWeaponType(atkUnit.weaponType)) {
                            return true;
                        }
                        break;
                    case PassiveA.DistantWard:
                        if (atkUnit.weaponType === WeaponType.Staff
                            || isWeaponTypeBreath(atkUnit.weaponType)
                            || isWeaponTypeTome(atkUnit.weaponType)) {
                            return true;
                        }
                        break;
                }
            }
        } else if (atkUnit.isMeleeWeaponType()) {
            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
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
                    case Weapon.KinsekiNoSyo:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (atkUnit.weaponType === WeaponType.Sword
                                || atkUnit.weaponType === WeaponType.Lance
                                || atkUnit.weaponType === WeaponType.Axe
                                || isWeaponTypeBeast(atkUnit.weaponType)
                            ) {
                                return true;
                            }
                        }
                        break;
                }
            }
        }

        return false;
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @returns {[number, number]} [inc, dec]: 絶対追撃値、追撃不可値(負の値)
     */
    getFollowupAttackPriorityForBoth(atkUnit, defUnit, damageCalcEnv) {
        let followupAttackPriorityInc = atkUnit.battleContext.followupAttackPriorityIncrement;
        let followupAttackPriorityDec = atkUnit.battleContext.followupAttackPriorityDecrement;
        {
            if (DamageCalculatorWrapper.canActivateBreakerSkill(atkUnit, defUnit)) {
                followupAttackPriorityInc++;
            }

            if (atkUnit.hasStatusEffect(StatusEffectType.FollowUpAttackPlus)) {
                if (atkUnit.battleContext.initiatesCombat) {
                    followupAttackPriorityInc++;
                }
            }

            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.BlackEagleRule:
                        if (atkUnit.battleContext.restHpPercentage >= 25) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case PassiveB.RagingStorm:
                        if (damageCalcEnv.calcPotentialDamage ||
                            (isWeaponTypeBreathOrBeast(defUnit.weaponType)
                                && !this.__isThereAllyInSpecifiedSpaces(atkUnit, 1))
                        ) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case PassiveB.FuinNoTate:
                        if (isWeaponTypeBreath(defUnit.weaponType)) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case PassiveB.BindingShield2:
                        if (isWeaponTypeBreath(defUnit.weaponType) || atkUnit.getEvalSpdInCombat() >= defUnit.getEvalSpdInCombat() + 5) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case PassiveB.TsuigekiRing:
                        if (atkUnit.battleContext.restHpPercentage >= 50) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case Weapon.VoidTome:
                        if (defUnit.getSpdInPrecombat() >= 35
                            || defUnit.hasNegativeStatusEffect()
                        ) {
                            followupAttackPriorityInc++;
                        }
                        break;

                    case Weapon.Garumu:
                        if (atkUnit.isWeaponRefined) {
                            if (atkUnit.hasPositiveStatusEffect(defUnit)) {
                                followupAttackPriorityInc++;
                            }
                        }
                        else if (atkUnit.isBuffed || atkUnit.isMobilityIncreased) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case Weapon.AnkigoroshiNoYumi:
                    case Weapon.AnkigoroshiNoYumiPlus:
                        if (isWeaponTypeDagger(defUnit.weaponType)) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case Weapon.ReginRave:
                        if (!atkUnit.isWeaponRefined) {
                            if (atkUnit.getAtkInCombat(defUnit) > defUnit.getAtkInCombat(atkUnit) || atkUnit.isMobilityIncreased) {
                                followupAttackPriorityInc++;
                            }
                        }
                        break;
                    case Weapon.FlameSiegmund:
                        if (!atkUnit.isWeaponRefined) {
                            if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, damageCalcEnv.calcPotentialDamage)) {
                                followupAttackPriorityInc++;
                            }
                        }
                        break;
                    case Weapon.Gyorru:
                        if (defUnit.hasNegativeStatusEffect()) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case Weapon.ChaosManifest:
                        if (!atkUnit.isWeaponRefined) {
                            // <通常効果>
                            if (defUnit.hasNegativeStatusEffect()) {
                                followupAttackPriorityInc++;
                            }
                        }
                        break;
                }
            }
        }

        {
            if (defUnit.hasStatusEffect(StatusEffectType.FollowUpAttackMinus)) {
                followupAttackPriorityDec--;
            }

            if (defUnit.hasStatusEffect(StatusEffectType.ResonantShield) && defUnit.isOneTimeActionActivatedForShieldEffect === false) {
                followupAttackPriorityDec--;
            }
            if (atkUnit.passiveB === PassiveB.WaryFighter3 && atkUnit.battleContext.restHpPercentage >= 50) {
                followupAttackPriorityDec--;
            }
            if (DamageCalculatorWrapper.canActivateBreakerSkill(defUnit, atkUnit)) {
                followupAttackPriorityDec--;
            }

            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.Marute:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (!defUnit.battleContext.initiatesCombat
                                || atkUnit.battleContext.restHpPercentage === 100) {
                                followupAttackPriorityDec--;
                            }
                        }

                        break;
                    case Weapon.TenraiArumazu:
                        if (!defUnit.isWeaponRefined) {
                            if (this.__isAllyCountIsGreaterThanEnemyCount(defUnit, atkUnit, damageCalcEnv.calcPotentialDamage)) {
                                followupAttackPriorityDec--;
                            }
                        } else {
                            if (this.__isThereAllyInSpecifiedSpaces(defUnit, 3)) {
                                followupAttackPriorityDec--;
                            }
                        }
                        break;
                    case Weapon.AnkigoroshiNoYumi:
                    case Weapon.AnkigoroshiNoYumiPlus:
                        if (isWeaponTypeDagger(atkUnit.weaponType)) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case Weapon.Buryunhirude:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (atkUnit.isRangedWeaponType()) {
                                if (defUnit.getDefInCombat(atkUnit) > atkUnit.getDefInCombat(defUnit)) {
                                    followupAttackPriorityDec--;
                                }
                            }
                        }
                        break;
                    case Weapon.Gyorru:
                        if (atkUnit.hasNegativeStatusEffect()) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case Weapon.SarieruNoOkama:
                        if (!atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.isBuffed || atkUnit.isMobilityIncreased) {
                                followupAttackPriorityDec--;
                            }
                        }
                        break;
                    case Weapon.FellBreath:
                        if (defUnit.isWeaponRefined) break;
                        if (atkUnit.battleContext.restHpPercentage < 100) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case Weapon.ShinenNoBreath:
                        if (defUnit.getDefInCombat(atkUnit) >= atkUnit.getDefInCombat(defUnit) + 5) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case PassiveB.WaryFighter3:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case PassiveB.FuinNoTate:
                        if (isWeaponTypeBreath(atkUnit.weaponType)) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case PassiveB.BindingShield2:
                        if (isWeaponTypeBreath(atkUnit.weaponType) || defUnit.getEvalSpdInCombat() >= atkUnit.getEvalSpdInCombat() + 5) {
                            followupAttackPriorityDec--;
                        }
                        break;
                }
            }
        }
        return [followupAttackPriorityInc, followupAttackPriorityDec];
    }

    /// 殺しスキルを発動できるならtrue、そうでなければfalseを返します。
    static canActivateBreakerSkill(breakerUnit, targetUnit) {
        // 殺し3の評価
        if (breakerUnit.battleContext.restHpPercentage < 50) { return false; }

        return targetUnit.weaponType === getBreakerSkillTargetWeaponType(breakerUnit.passiveB);
    }


    __applyDamageReductionRatioBySpecial(defUnit, atkUnit) {
        let attackRange = atkUnit.getAttackRangeDuringCombat(defUnit);
        for (let skillId of defUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, applyDamageReductionRatioBySpecialFuncMap);
            func?.call(this, defUnit, atkUnit, attackRange);
        }
        switch (defUnit.special) {
            case Special.GodlikeReflexes:
                defUnit.battleContext.damageReductionRatioBySpecial = 0.4;
                break;
            case Special.NegatingFang:
                defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                break;
            case Special.Seikabuto:
            case Special.Seii:
            case Special.IceMirror:
                if (attackRange === 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                }
                break;
            case Special.IceMirror2:
                if (attackRange === 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.4;
                }
                break;
            case Special.FrostbiteMirror:
                if (attackRange === 1) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.1;
                } else if (attackRange === 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                }
                break;
            case Special.Seitate:
                if (attackRange === 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.5;
                }
                break;
            case Special.Kotate:
            case Special.Nagatate:
                if (attackRange === 1) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                }
                break;
            case Special.Otate:
                if (attackRange === 1) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.5;
                }
                break;
        }
    }

    /**
     * 神速追撃を行うスキル
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     */
    __applyPotentSkillEffect(targetUnit, enemyUnit, damageCalcEnv) {
        let env = new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, null);
        env.setName('神速判定時').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
        WHEN_APPLIES_POTENT_EFFECTS_HOOKS.evaluateWithUnit(targetUnit, env);
        for (let skillId of targetUnit.enumerateSkills()) {
            getSkillFunc(skillId, applyPotentSkillEffectFuncMap)?.call(this, targetUnit, enemyUnit);
        }
    }

    /**
     * 周囲の味方からの神速追撃を行うスキル
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    __applyPotentSkillEffectFromAllies(targetUnit, enemyUnit, damageCalcEnv) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }

        if (damageCalcEnv.calcPotentialDamage) {
            return;
        }
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                continue
            }
            let env = new ForAlliesEnv(this, targetUnit, enemyUnit, allyUnit);
            env.setName('周囲の味方からの神速追撃判定時').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_ALLIES_WHEN_APPLIES_POTENT_EFFECTS_HOOKS.evaluateWithUnit(allyUnit, env);
        }
    }


    /**
     * @param  {Unit} targetUnit
     * @param  {Number} spaces
     * @param  {Boolean} withTargetUnit=false
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit);
    }
    /**
     * @param  {Unit} targetUnit
     * @param  {Number} spaces
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        return this._unitManager.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces);
    }
    /**
     * @param  {Unit} unit
     * @param  {Boolean} withTargetUnit=false
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit);
    }

    /**
     * @param  {Unit} unit
     * @param  {Boolean} withTargetUnit=false
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInDifferentGroupOnMap(unit, withTargetUnit) {
        return this._unitManager.enumerateUnitsInDifferentGroupOnMap(unit, withTargetUnit);
    }

    __isNextToOtherUnits(unit) {
        for (let otherUnit of this._unitManager.enumerateUnitsInTheSameGroupOnMap(unit, false)) {
            if (!unit.isNextTo(otherUnit)) { continue; }
            return true;
        }
        return false;
    }

    __isNextToOtherUnitsExceptDragonAndBeast(skillOwnerUnit) {
        return this.__isNextToOtherUnitsExcept(skillOwnerUnit,
            x => isWeaponTypeBreath(x.weaponType) || isWeaponTypeBeast(x.weaponType));
    }
    __isNextToOtherUnitsExcept(unit, exceptCondition) {
        return this._unitManager.isNextToAlliesExcept(unit, exceptCondition);
    }

    __countUnit(groupId, predicateFunc) {
        return this._unitManager.countUnitInSpecifiedGroupOnMap(groupId, predicateFunc);
    }

    __countAlliesActionDone(targetUnit) {
        return this._unitManager.countUnitInSpecifiedGroupOnMap(targetUnit.groupId, x => x.isActionDone);
    }

    __countEnemiesActionDone(targetUnit) {
        return this._unitManager.countUnitInSpecifiedGroupOnMap(targetUnit.getEnemyGroupId(), x => x.isActionDone);
    }

    __countEnemiesActionNotDone(targetUnit) {
        return this._unitManager.countUnitInSpecifiedGroupOnMap(targetUnit.getEnemyGroupId(), x => !x.isActionDone);
    }

    __isThereAnyAllyUnit(unit, conditionFunc) {
        return this._unitManager.isThereAnyUnitInTheSameGroupOnMap(unit, conditionFunc);
    }

    __isNear(unitA, unitB, nearRange) {
        return unitA.isWithinSpecifiedDistanceFrom(unitB, nearRange);
    }

    __isInCross(unitA, unitB) {
        return unitB.isInCrossOf(unitA);
    }

    /**
     * 自身を中心とした縦〇列と横〇列
     * @param {Unit} unitA
     * @param {Unit} unitB
     * @param {number} offset 3x3の場合1
     */
    __isInCrossWithOffset(unitA, unitB, offset) {
        return unitB.isInCrossWithOffset(unitA, offset);
    }

    /**
     * @param {Unit} unit
     * @returns {boolean}
     */
    __isTherePartnerInSpace3(unit) {
        let isPartnerWithinThreeSpaces = ally => unit.calculateDistanceToUnit(ally) <= 3 && unit.isPartner(ally);
        return this.__isThereAnyAllyUnit(unit, isPartnerWithinThreeSpaces);
    }

    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} allyUnit
     * @param  {Boolean} calcPotentialDamage
     */
    __addSpurInRange2(targetUnit, allyUnit, calcPotentialDamage) {
        for (let skillId of allyUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.SacrificeStaff:
                    targetUnit.addAllSpur(4);
                    break;
                case Weapon.StaffOfLilies:
                    if (allyUnit.isWeaponSpecialRefined) {
                        targetUnit.addDefResSpurs(6);
                    }
                    break;
                case Weapon.MasyumaroNoTsuePlus:
                    targetUnit.addDefResSpurs(3);
                    break;
                case Weapon.SunshadeStaff:
                    targetUnit.atkSpur += 6;
                    break;
                case Weapon.GuidesHourglass:
                    targetUnit.addAllSpur(4);
                    break;
                case PassiveC.AllTogether:
                    targetUnit.addAllSpur(4);
                    break;
                case Captain.Effulgence:
                    targetUnit.addSpurs(4, 4, 0, 0);
                    break;
                case PassiveC.OpeningRetainer:
                    targetUnit.atkSpur += 4;
                    break;
                case PassiveC.EverlivingDomain:
                    targetUnit.defSpur += 4;
                    targetUnit.resSpur += 4;
                    break;
                case PassiveC.DomainOfFlame:
                    targetUnit.atkSpur += 4;
                    targetUnit.defSpur += 4;
                    break;
                case PassiveC.DomainOfIce:
                    targetUnit.spdSpur += 4;
                    targetUnit.resSpur += 4;
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
                case PassiveC.JointDriveDef:
                    targetUnit.defSpur += 4;
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
                    if (targetUnit.moveType === MoveType.Armor) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveC.GoadArmor:
                    if (targetUnit.moveType === MoveType.Armor) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case PassiveC.WardFliers:
                    if (targetUnit.moveType === MoveType.Flying) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveC.GoadFliers:
                    if (targetUnit.moveType === MoveType.Flying) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case PassiveC.WardCavalry:
                    if (targetUnit.moveType === MoveType.Cavalry) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveC.GoadCavalry:
                    if (targetUnit.moveType === MoveType.Cavalry) {
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
            }
        }
        switch (allyUnit.weapon) {
            case Weapon.Gjallarbru:
                if (allyUnit.isWeaponSpecialRefined) {
                    targetUnit.addSpurs(4, 4, 0, 0);
                }
                break;
            case Weapon.YoukoohNoTsumekiba:
                if (allyUnit.isWeaponSpecialRefined) {
                    targetUnit.addSpurs(0, 0, 2, 2);
                }
                break;
            case Weapon.IzunNoKajitsu:
                if (allyUnit.isWeaponRefined) {
                    if (allyUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                }
                break;
            case Weapon.AlliedSwordPlus:
            case Weapon.AlliedLancePlus:
            case Weapon.AlliedAxePlus:
            case Weapon.LoveCandelabraPlus:
                targetUnit.atkSpur += 4;
                targetUnit.defSpur += 4;
                break;
            case Weapon.LoveBouquetPlus:
                targetUnit.atkSpur += 4;
                targetUnit.resSpur += 4;
                break;
            case Weapon.GigaExcalibur:
                if (allyUnit.isWeaponSpecialRefined) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
                break;
            case Weapon.RespitePlus:
            case Weapon.TannenbatonPlus:
                targetUnit.defSpur += 2;
                targetUnit.resSpur += 2;
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
                    if (targetUnit.moveType === MoveType.Flying || targetUnit.moveType === MoveType.Cavalry) {
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
                if (!allyUnit.isWeaponRefined) {
                    targetUnit.atkSpur += 3;
                    targetUnit.defSpur += 3;
                }
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
                    if (targetUnit.partnerHeroIndex === allyUnit.heroIndex) {
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

            default:
                break;
        }
    }

    __addSpurInRange1(targetUnit, skillId, _calcPotentialDamage) {
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

    __addSelfSpurInRange1(targetUnit, skillId, _calcPotentialDamage) {
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

    __countBreakableDefenseStructuresWithoutEnergyOnMap() {
        return this.map.countObjs(st => st instanceof DefenceStructureBase && !(st instanceof Ornament) && st.isBreakable && !st.isRequired);
    }

    __countDefenceStructuresOnMap() {
        return this.__countBreakableDefenseStructuresWithoutEnergyOnMap() + 1;
    }

    __calcKojosenSpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        if (count <= 2) {
            return 10;
        }
        else if (count === 3) {
            return 7;
        }
        else if (count === 4) {
            return 4;
        }
        else {
            return 1;
        }
    }

    __calcBojosenSpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        if (count >= 5) {
            return 10;
        }
        else if (count === 4) {
            return 7;
        }
        else if (count === 3) {
            return 4;
        }
        else {
            return 1;
        }
    }

    __calcBojosen4SpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        if (count >= 5) {
            return 11;
        } else if (count === 4) {
            return 7;
        } else {
            return 3;
        }
    }
    __applyFormSkill(targetUnit, buffFunc, addSpur = 0, spaces = 2, spurLimit = 6) {
        let spurAmount = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
            spurAmount += 2;
        }
        if (spurAmount === 0) return;
        if (spurAmount > spurLimit) {
            spurAmount = spurLimit;
        }
        buffFunc(targetUnit, spurAmount + addSpur);
    }

    updateAllUnitSpur(calcPotentialDamage = false) {
        for (let unit of this._unitManager.enumerateUnitsWithPredicator(x => x.isOnMap)) {
            this.updateUnitSpur(unit, calcPotentialDamage);
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {boolean} calcPotentialDamage=false
     * @param {Unit} enemyUnit
     * @param {number} damageType
     */
    updateUnitSpur(targetUnit, calcPotentialDamage = false, enemyUnit = null, damageType = DamageType.PotentialDamage) {
        let self = this;
        this.profiler.profile("updateUnitSpur", () => {
            self.__updateUnitSpur(targetUnit, calcPotentialDamage, enemyUnit, damageType);
        });
    }

    /**
     * @param  {Unit} targetUnit
     * @param  {boolean} calcPotentialDamage
     * @param  {Unit} enemyUnit
     * @param  {number} damageType
     */
    __updateUnitSpur(targetUnit, calcPotentialDamage, enemyUnit = null, damageType) {
        // 主に暗闘スキルの処理
        // 暗闘は戦闘中の2人が必要
        if (targetUnit && enemyUnit) {
            targetUnit && this.__applyPreUpdateUnitSpurSkillEffects(targetUnit, enemyUnit, calcPotentialDamage);
            enemyUnit && this.__applyPreUpdateUnitSpurSkillEffects(enemyUnit, targetUnit, calcPotentialDamage);
        }

        targetUnit.resetSpurs();

        if (!calcPotentialDamage) {
            // 周囲の味方から受ける紋章バフ
            this.__updateUnitSpurFromAllies(targetUnit, calcPotentialDamage, enemyUnit);
            // 周囲の敵から受ける紋章バフ
            this.__updateUnitSpurFromEnemyAllies(targetUnit, calcPotentialDamage, enemyUnit, damageType);
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
                if (targetUnit.partnerHeroIndex === unit.heroIndex) {
                    let dist = calcDistance(targetUnit.posX, targetUnit.posY, unit.posX, unit.posY);
                    if (dist < nearestDist) {
                        nearestPartner = unit;
                        nearestDist = dist;
                    }
                }
            }

            if (nearestPartner != null && !targetUnit.battleContext.invalidatesSupportEffect) {
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
                    case PartnerLevel.SPlus:
                        targetUnit.addAllSpur(2);
                        targetUnit.addSpurs(...(ArrayUtil.maxByIndex(
                            EntwinedValues.get(targetUnit.entwinedId) ?? [0, 0, 0, 0],
                            EntwinedValues.get(nearestPartner.entwinedId) ?? [0, 0, 0, 0]
                        )));
                        break;
                }
            }
        }

        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__isNear(unit, targetUnit, 2)) {
                // 2マス以内で発動する戦闘中バフ
                // this.writeDebugLogLine(unit.getNameWithGroup() + "の2マス以内で発動する戦闘中バフを" + targetUnit.getNameWithGroup() + "に適用");
                isAllyAvailableRange2 = true;
            }

            if (this.__isNear(unit, targetUnit, 1)) {
                // 1マス以内で発動する戦闘中バフ
                this.__addSelfSpurInRange1(targetUnit, targetUnit.weapon, calcPotentialDamage);
                isAllyAvailableRange1 = true;
            }
        }

        // 味方と隣接しているときに発動するスキル
        if (isAllyAvailableRange1 && !calcPotentialDamage) {
            switch (targetUnit.weapon) {
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
                case Weapon.Fensariru:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.spdSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                default:
                    break;
            }

            for (let skillId of targetUnit.enumerateSkills()) {
                if (skillId === NoneValue) { continue; }
                switch (skillId) {
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
                    case PassiveA.SpdDefBond4:
                        targetUnit.spdSpur += 7;
                        targetUnit.defSpur += 7;
                        break;
                    case PassiveA.SpdResBond4:
                        targetUnit.spdSpur += 7;
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
                    case PassiveA.DefResBond4:
                        targetUnit.defSpur += 7;
                        targetUnit.resSpur += 7;
                        break;
                    default:
                        break;
                }
            }
        }

        // 味方が2マス以内にいる時に発動するスキル
        if (isAllyAvailableRange2 && !calcPotentialDamage) {
            for (let skillId of targetUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.AlliedSwordPlus:
                    case Weapon.AlliedLancePlus:
                    case Weapon.AlliedAxePlus:
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
                    case Weapon.ChichiNoSenjutsusyo:
                        targetUnit.atkSpur += 3;
                        targetUnit.spdSpur += 3;
                        break;
                    case Weapon.JunaruSenekoNoTsumekiba:
                        if (!targetUnit.isWeaponRefined) {
                            targetUnit.atkSpur += 3;
                            targetUnit.defSpur += 3;
                        }
                        break;
                    case Weapon.OgonNoFolkPlus:
                    case Weapon.NinjinhuNoSosyokuPlus:
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
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
                    case PassiveC.JointDriveDef:
                        targetUnit.defSpur += 4;
                        break;
                }
            }
        }

        // 孤軍
        if (this.__isSolo(targetUnit) || calcPotentialDamage) {
            switch (targetUnit.weapon) {
                case Weapon.TallHammer:
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.spdSpur += 6;
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.GousouJikumunto:
                    if (!targetUnit.isWeaponRefined) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.KurokiChiNoTaiken:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
            }

            for (let skillId of [targetUnit.passiveA, targetUnit.passiveS]) {
                if (skillId === NoneValue) { continue; }
                switch (skillId) {
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
                    case PassiveA.SpdDefSolo4:
                        targetUnit.spdSpur += 7; targetUnit.defSpur += 7;
                        break;
                    case PassiveA.SpdResSolo4:
                        targetUnit.spdSpur += 7; targetUnit.resSpur += 7;
                        break;
                }
            }
        }

        // その他
        {
            // 潜在ダメージ計算に加味される効果
            for (let skillId of targetUnit.enumerateSkills()) {
                switch (skillId) {
                    // リーダースキル
                    case Captain.SecretManeuver:
                        targetUnit.spdSpur += 5;
                        break;
                    case Captain.Effulgence:
                        targetUnit.addSpurs(4, 4, 0, 0);
                        break;
                    case Captain.MassConfusion:
                        targetUnit.atkSpur += 5;
                        break;

                    // ユニットスキル
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
                    case PassiveA.DefResBojosen4: {
                        let spurAmount = this.__calcBojosen4SpurAmount();
                        targetUnit.defSpur += spurAmount;
                        targetUnit.resSpur += spurAmount;
                    }
                        break;
                }
            }

            // 潜在ダメージ計算で無視される効果
            if (!calcPotentialDamage) {
                for (let skillId of targetUnit.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.Rigarublade:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                    x => isWeaponTypeTome(x.weaponType) && x.moveType === MoveType.Infantry)
                                ) {
                                    targetUnit.addAllSpur(3);
                                }
                            }
                            break;
                        case Weapon.Vidofuniru:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                    x => x.moveType === MoveType.Armor || x.moveType === MoveType.Infantry)
                                ) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.spdSpur += 5;
                                }
                            }
                            break;
                        case Weapon.HinokaNoKounagitou:
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => x.moveType === MoveType.Flying || x.moveType === MoveType.Infantry)
                            ) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                            }
                            break;
                        case Weapon.KamiraNoEnfu:
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => x.moveType === MoveType.Flying || x.moveType === MoveType.Cavalry)
                            ) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                            }
                            break;
                        case Weapon.Simuberin:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                    x => x.moveType === MoveType.Flying)
                                ) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.resSpur += 5;
                                }
                            }
                            break;
                        case Weapon.Ora:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                    x => x.weaponType === WeaponType.Staff || isWeaponTypeTome(x.weaponType))
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
                                    x.weaponType === WeaponType.Staff || isWeaponTypeTome(x.weaponType))
                                ) {
                                    targetUnit.atkSpur += 4;
                                    targetUnit.spdSpur += 4;
                                }
                            }
                            break;
                        case Weapon.KentoushiNoGoken:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                                    x.moveType === MoveType.Infantry || x.moveType === MoveType.Flying)
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
                                    if (unit.moveType === MoveType.Infantry
                                        || unit.moveType === MoveType.Cavalry) {
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
                                    if (unit.moveType === MoveType.Infantry
                                        || unit.moveType === MoveType.Cavalry) {
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
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.atkSpur += amount;
                                    unit.spdSpur += amount;
                                });
                            break;
                        case Weapon.MusuperuNoEnka:
                            if (!targetUnit.isWeaponRefined) {
                                this.__applyFormSkill(targetUnit,
                                    (unit, amount) => {
                                        unit.atkSpur += amount;
                                        unit.spdSpur += amount;
                                    });
                            } else {
                                this.__applyFormSkill(targetUnit,
                                    (unit, amount) => {
                                        unit.atkSpur += amount;
                                        unit.spdSpur += 5;
                                    }, 5, 3, 9);
                            }
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
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {boolean} calcPotentialDamage
     * @param {Unit} enemyUnit
     * @param {number} damageType
     */
    __updateUnitSpurFromEnemyAllies(targetUnit, calcPotentialDamage, enemyUnit, damageType) {
        let disablesSkillsFromEnemyAlliesInCombat = false;
        if (enemyUnit) {
            if (enemyUnit.hasStatusEffect(StatusEffectType.Feud) ||
                targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
                disablesSkillsFromEnemyAlliesInCombat = true;
            }
        }
        // enemyAllyにはenemyUnitも含まれる
        for (let enemyAlly of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
            let isEnemyAllyNotEnemy = enemyAlly !== enemyUnit;
            if (disablesSkillsFromEnemyAlliesInCombat && isEnemyAllyNotEnemy) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, enemyAlly)) {
                continue;
            }

            for (let skillId of enemyAlly.enumerateSkills()) {
                let func = getSkillFunc(skillId, updateUnitSpurFromEnemyAlliesFuncMap);
                func?.call(this, targetUnit, enemyUnit, enemyAlly, calcPotentialDamage);
            }
            // 縦3列と横3列
            if (Math.abs(targetUnit.posX - enemyAlly.posX) <= 1 ||
                Math.abs(targetUnit.posY - enemyAlly.posY) <= 1) {
                for (let skillId of enemyAlly.enumerateSkills()) {
                    switch (skillId) {
                        case PassiveC.RallyingCry:
                            if (targetUnit.moveType === MoveType.Infantry ||
                                targetUnit.moveType === MoveType.Armor ||
                                targetUnit.moveType === MoveType.Cavalry) {
                                targetUnit.addSpursWithoutAtk(-5);
                            }
                            break;
                        case Weapon.Dreamflake:
                            if (targetUnit.hasNegativeStatusEffect()) {
                                targetUnit.atkSpur -= 5;
                            }
                            break;
                    }
                }
            }
        }

        // 周囲4マス
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 4)) {
            if (disablesSkillsFromEnemyAlliesInCombat && (unit !== enemyUnit)) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, unit)) {
                continue;
            }
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.HeartOfCrimea:
                        targetUnit.addAllSpur(-4);
                        break;
                }
            }
        }

        // 周囲3マス
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 3)) {
            if (disablesSkillsFromEnemyAlliesInCombat && (unit !== enemyUnit)) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, unit)) {
                continue;
            }
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.Syurugu:
                        if (unit.isWeaponSpecialRefined) {
                            // unit: ユルグ
                            // unit(ユルグ)の強化値とtargetUnitの弱化値の大きいほう(弱化はパニック分も含む)
                            // targetUnitとunitが直接戦闘している場合は強化無効が有効になる
                            let atkBuff = 0;
                            let spdBuff = 0;
                            let defBuff = 0;
                            let resBuff = 0;
                            if (enemyUnit !== null && enemyUnit === unit) {
                                atkBuff = unit.getAtkBuffInCombat(targetUnit);
                                spdBuff = unit.getSpdBuffInCombat(targetUnit);
                                defBuff = unit.getDefBuffInCombat(targetUnit);
                                resBuff = unit.getResBuffInCombat(targetUnit);
                            } else {
                                atkBuff = unit.atkBuff * unit.__getBuffMultiply();
                                spdBuff = unit.spdBuff * unit.__getBuffMultiply();
                                defBuff = unit.defBuff * unit.__getBuffMultiply();
                                resBuff = unit.resBuff * unit.__getBuffMultiply();
                            }
                            targetUnit.atkSpur -= Math.max(0, atkBuff, Math.abs(targetUnit.atkDebuffTotal));
                            targetUnit.spdSpur -= Math.max(0, spdBuff, Math.abs(targetUnit.spdDebuffTotal));
                            targetUnit.defSpur -= Math.max(0, defBuff, Math.abs(targetUnit.defDebuffTotal));
                            targetUnit.resSpur -= Math.max(0, resBuff, Math.abs(targetUnit.resDebuffTotal));
                        }
                        break;
                    case Weapon.AchimenesFurl: {
                        let types = new Set();
                        for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(unit)) {
                            types.add(otherUnit.moveType);
                        }
                        if (types.size >= 1) {
                            targetUnit.atkSpur -= 5;
                            targetUnit.defSpur -= 5;
                            targetUnit.resSpur -= 5;
                        }
                    }
                        break;
                    case Weapon.MusuperuNoEnka:
                        if (targetUnit.isWeaponSpecialRefined) {
                            let l = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 3)).length;
                            if (l === 0) break;
                            let amount = Math.min(3, l) * 2;
                            targetUnit.spdSpur -= amount;
                            targetUnit.resSpur -= amount;
                        }
                        break;
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
                    case PassiveC.AtkSpdHold:
                        targetUnit.addSpurs(-4, -4, 0, 0);
                        break;
                    case PassiveC.AtkDefHold:
                        targetUnit.addSpurs(-4, 0, -4, 0);
                        break;
                    case PassiveC.AtkResHold:
                        targetUnit.addSpurs(-4, 0, 0, -4);
                        break;
                    case PassiveC.SpdDefHold:
                        targetUnit.addSpurs(0, -4, -4, 0);
                        break;
                    case PassiveC.SpdResHold:
                        targetUnit.addSpurs(0, -4, 0, -4);
                        break;
                    case PassiveC.DefResHold:
                        targetUnit.addSpurs(0, 0, -4, -4);
                        break;
                    case Captain.Eminence:
                        targetUnit.addSpurs(0, 0, -3, -3);
                        break;
                }
            }
        }

        // 周囲2マス
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 2)) {
            if (disablesSkillsFromEnemyAlliesInCombat && (unit !== enemyUnit)) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, unit)) {
                continue;
            }
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.ElisesStaff:
                        if (unit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat) {
                                targetUnit.addAllSpur(-4);
                            }
                        }
                        break;
                    case PassiveC.FettersOfDromi:
                        targetUnit.addAllSpur(-4);
                        break;
                    case Weapon.UnboundBlade:
                    case Weapon.UnboundBladePlus:
                    case Weapon.UnboundLancePlus:
                    case Weapon.UnboundAxePlus:
                    case Weapon.UnboundBow:
                    case Weapon.UnboundBowPlus:
                        if (this.__isSolo(unit)) {
                            targetUnit.atkSpur -= 5;
                            targetUnit.defSpur -= 5;
                        }
                        break;
                    case Weapon.ObsessiveCurse:
                        targetUnit.spdSpur -= 5;
                        targetUnit.resSpur -= 5;
                        break;
                    case Weapon.ReinSword:
                    case Weapon.ReinSwordPlus:
                    case Weapon.ReinLance:
                    case Weapon.ReinLancePlus:
                    case Weapon.ReinAxe:
                    case Weapon.ReinAxePlus:
                    case Weapon.ReinBow:
                    case Weapon.ReinBowPlus:
                        targetUnit.spdSpur -= 4;
                        targetUnit.defSpur -= 4;
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
                    case Weapon.TharjasHex:
                        if (unit.isWeaponSpecialRefined) {
                            targetUnit.atkSpur -= 4;
                            targetUnit.spdSpur -= 4;
                        }
                        break;
                    case PassiveC.AtkSpdRein3:
                    case PassiveC.ASReinSnap:
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
                    case PassiveC.SpdDefRein3:
                    case PassiveC.SDReinSnap:
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
                    case PassiveC.InevitableDeath:
                        targetUnit.addAllSpur(-4);
                        break;
                    case PassiveC.InevitableDeathPlus:
                        targetUnit.addAllSpur(-5);
                        break;
                }
            }
        }
    }

    __updateUnitSpurFromAllies(targetUnit, calcPotentialDamage, enemyUnit) {
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }
        if (enemyUnit && enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        for (let ally of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(enemyUnit, targetUnit, ally)) {
                continue;
            }
            // 距離に関係ないもの
            for (let skillId of ally.enumerateSkills()) {
                let func = getSkillFunc(skillId, updateUnitSpurFromAlliesFuncMap);
                func?.call(this, targetUnit, ally, enemyUnit, calcPotentialDamage);
                switch (skillId) {
                    case PassiveC.SparklingBoostPlus:
                        if (targetUnit.battleContext.restHpPercentage >= 50) {
                            targetUnit.resSpur += 5;
                        }
                        break;
                    case PassiveC.WingsOfLight:
                        if (targetUnit.isMythicHero
                            && this.currentTurn <= 5
                            && this.__countUnit(targetUnit.groupId, x => x.isOnMap && x.isMythicHero) <= 3
                        ) {
                            targetUnit.addAllSpur(2 + this.currentTurn);
                        }
                        break;
                }
            }

            if (Math.abs(ally.posX - targetUnit.posX) <= 3 && Math.abs(ally.posY - targetUnit.posY) <= 3) {
                // 7×7マス以内にいる場合
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.DaichiBoshiNoBreath: {
                            let amount = ally.isWeaponRefined ? 4 : 2;
                            targetUnit.addAllSpur(amount);
                        }
                            break;
                    }
                }
            }

            if (this.__isNear(ally, targetUnit, 4)) {
                // 4マス以内で発動する戦闘中バフ
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.DivineBreath:
                            if (ally.isWeaponRefined) {
                                if (isWeaponTypeBreath(targetUnit.weaponType) ||
                                    targetUnit.hasEffective(EffectiveType.Dragon)) {
                                    targetUnit.addAllSpur(3);
                                }
                            }
                            break;
                    }
                }
            }

            if (this.__isNear(ally, targetUnit, 3)) {
                // 3マス以内で発動する戦闘中バフ
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.JunaruSenekoNoTsumekiba:
                            if (ally.isWeaponRefined) {
                                targetUnit.addSpurs(4, 4, 0, 0);
                            }
                            break;
                        case Weapon.FirstDreamBow:
                            targetUnit.atkSpur += 4;
                            break;
                        case Weapon.Hlidskjalf:
                            if (ally.isWeaponSpecialRefined) {
                                targetUnit.atkSpur += 3;
                                targetUnit.spdSpur += 3;
                            }
                            break;
                        case Weapon.GaeBolg:
                            if (ally.isWeaponSpecialRefined) {
                                if (targetUnit.weaponType === WeaponType.Sword ||
                                    targetUnit.weaponType === WeaponType.Lance ||
                                    targetUnit.weaponType === WeaponType.Axe ||
                                    targetUnit.moveType === MoveType.Cavalry
                                ) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.defSpur += 5;
                                }
                            }
                            break;
                    }
                }
            }

            if (this.__isNear(ally, targetUnit, 2)) {
                // 2マス以内で発動する戦闘中バフ
                // this.writeDebugLogLine(ally.getNameWithGroup() + "の2マス以内で発動する戦闘中バフを" + targetUnit.getNameWithGroup() + "に適用");
                this.__addSpurInRange2(targetUnit, ally, calcPotentialDamage);
            }

            if (this.__isNear(ally, targetUnit, 1)) {
                // 1マス以内で発動する戦闘中バフ
                this.__addSpurInRange1(targetUnit, ally.passiveC, calcPotentialDamage);
                this.__addSpurInRange1(targetUnit, ally.passiveS, calcPotentialDamage);
            }

            if (this.__isInCross(ally, targetUnit)) {
                // 十字方向
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.BondOfTheAlfar:
                            targetUnit.atkSpur += 6;
                            break;
                        case Weapon.FlowerOfJoy:
                            if (!ally.isWeaponRefined) {
                                // <通常効果>
                                targetUnit.atkSpur += 3;
                                targetUnit.spdSpur += 3;
                            } else {
                                // <錬成効果>
                                targetUnit.atkSpur += 4;
                                targetUnit.spdSpur += 4;
                            }
                            break;
                        case PassiveC.CrossSpurAtk:
                            targetUnit.atkSpur += 5;
                            break;
                        case PassiveC.CrossSpurRes:
                            targetUnit.resSpur += 5;
                            break;
                    }
                }
            }

            if (this.__isInCrossWithOffset(ally, targetUnit, 1)) {
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.ChargingHorn: // 味方にバフ
                            targetUnit.addAtkSpdSpurs(5);
                            if (ally.isWeaponSpecialRefined) {
                                targetUnit.addDefResSpurs(5);
                            }
                            break;
                    }
                }
            }
        }
    }

    __isTherePartnerInSpace2(unit) {
        return this.__isThereAnyAllyUnit(unit,
            x => unit.calculateDistanceToUnit(x) <= 2
                && unit.partnerHeroIndex === x.heroIndex);
    }

    __isThereAnyPartnerPairsIn3Spaces(targetUnit) {
        let units = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3));
        let partners = units.map(u => u.partnerHeroIndex);
        return units.some(u => partners.includes(u.heroIndex));
    }

    /// 実装の移植を楽にするために暫定的に用意
    __writeDamageCalcDebugLog(message) {
        this.writeDebugLog(message);
    }

    /**
     * ターゲットが敵の周囲のスキルを無効にできるかどうか
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {Unit} allyUnit
     */
    __canDisableSkillsFrom(targetUnit, enemyUnit, allyUnit) {
        // 周囲からでなく自分のスキルの場合
        if (enemyUnit === allyUnit) {
            return false;
        }
        if (targetUnit.battleContext.disablesSkillsFromRedEnemyAlliesInCombat &&
            allyUnit.color === ColorType.Red) {
            return true;
        }
        if (targetUnit.battleContext.disablesSkillsFromBlueEnemyAlliesInCombat &&
            allyUnit.color === ColorType.Blue) {
            return true;
        }
        if (targetUnit.battleContext.disablesSkillsFromGreenEnemyAlliesInCombat &&
            allyUnit.color === ColorType.Green) {
            return true;
        }
        if (targetUnit.battleContext.disablesSkillsFromColorlessEnemyAlliesInCombat &&
            allyUnit.color === ColorType.Colorless) {
            return true;
        }
        if (allyUnit.hasStatusEffect(StatusEffectType.TimesGrip)) {
            return true;
        }
        return false;
    }

    __applyPreUpdateUnitSpurSkillEffects(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Captain.AdroitCaptain:
                    targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    break;
                case Weapon.Queensblade:
                    targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    break;
                case Weapon.ShikkyuMyurugure:
                    if (targetUnit.isWeaponRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3) || calcPotentialDamage) {
                            targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                        }
                    }
                    break;
                case PassiveC.ImpenetrableDark:
                case PassiveC.ImpenetrableVoid:
                    targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    break;
                case PassiveC.RedFeud3:
                    if (enemyUnit.color === ColorType.Red) {
                        targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromRedEnemyAlliesInCombat = true;
                    break;
                case PassiveC.BlueFeud3:
                    if (enemyUnit.color === ColorType.Blue) {
                        targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromBlueEnemyAlliesInCombat = true;
                    break;
                case PassiveC.GreenFeud3:
                    if (enemyUnit.color === ColorType.Green) {
                        targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromGreenEnemyAlliesInCombat = true;
                    break;
                case PassiveC.CFeud3:
                    if (enemyUnit.color === ColorType.Colorless) {
                        targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromColorlessEnemyAlliesInCombat = true;
                    break;
            }
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     */
    applySkillEffectsAfterAfterBeginningOfCombat(targetUnit, enemyUnit, damageCalcEnv) {
        // 神獣の蜜
        if (targetUnit.hasStatusEffect(StatusEffectType.DivineNectar)) {
            // 戦闘開始後（戦闘開始後にダメージを受ける効果の後）、
            // 20回復（同系統効果複数時、最大値適用）
            targetUnit.battleContext.addHealAmountAfterAfterBeginningOfCombatSkills(20);
        }
        let env =
            new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, DamageCalcEnv.calcPotentialDamage);
        env.setName('戦闘開始後ダメージ後').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase);
        AFTER_EFFECTS_THAT_DEAL_DAMAGE_AS_COMBAT_BEGINS_HOOKS.evaluateWithUnit(targetUnit, env);
        for (let skillId of targetUnit.enumerateSkills()) {
            getSkillFunc(skillId, applySkillEffectsAfterAfterBeginningOfCombatFuncMap)?.call(this, targetUnit, enemyUnit);
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     */
    applySkillEffectsAfterAfterBeginningOfCombatFromAllies(targetUnit, enemyUnit, damageCalcEnv) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }

        if (damageCalcEnv.calcPotentialDamage) {
            return;
        }
        let env = new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        env.setName('周囲からの戦闘開始後ダメージ後').setLogLevel(getSkillLogLevel())
            .setDamageType(damageCalcEnv.damageType).setCombatPhase(this.combatPhase)
            .setGroupLogger(damageCalcEnv.getCombatLogger());
        FOR_ALLIES_AFTER_EFFECTS_THAT_DEAL_DAMAGE_AS_COMBAT_BEGINS_HOOKS.evaluateWithUnit(targetUnit, env);
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                continue
            }
            for (let skillId of allyUnit.enumerateSkills()) {
                let func = getSkillFunc(skillId, applySkillEffectsAfterAfterBeginningOfCombatFromAlliesFuncMap);
                func?.call(this, targetUnit, enemyUnit, allyUnit, damageCalcEnv.calcPotentialDamage);
            }
        }
    }

    applySkillEffectAfterConditionDetermined(damageCalcEnv) {
        let applySkill = (targetUnit, enemyUnit, damageCalcEnv) => {
            let env =
                new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
            env.setName('全ての条件決定後').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
            AFTER_CONDITION_CONFIGURED_HOOKS.evaluateWithUnit(targetUnit, env);
        };
        damageCalcEnv.applySkill('全ての条件決定後', damageCalcEnv.atkUnit, damageCalcEnv.defUnit, applySkill, this);
    }
}

DamageCalculatorWrapper.definePrototypeMethods = function(methods) {
    for (const [name, fn] of Object.entries(methods)) {
        if (Object.prototype.hasOwnProperty.call(DamageCalculatorWrapper.prototype, name)) {
            throw new Error(`Duplicate prototype method: ${name}`);
        }
        Object.defineProperty(DamageCalculatorWrapper.prototype, name, {
            value: fn,
            writable: true,
            configurable: true,
            enumerable: false,
        });
    }
};
