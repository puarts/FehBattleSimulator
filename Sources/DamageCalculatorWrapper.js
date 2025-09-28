
class PerformanceProfile {
    constructor() {
        this.elaspedMilliseconds = {};
        this.isEnabled = true;
    }

    addElaspedMilliseconds(name, ms) {
        if (name in this.elaspedMilliseconds) {
            this.elaspedMilliseconds[name] += ms;
        }
        else {
            this.elaspedMilliseconds[name] = ms;
        }
    }

    profile(name, func) {
        if (this.isEnabled) {
            const startTime = performance.now();
            const result = func();
            this.addElaspedMilliseconds(name, performance.now() - startTime);
            return result;
        }
        else {
            return func();
        }
    }
}

class ScopedTileChanger {
    /**
     * @param {Unit} atkUnit
     * @param {Tile} tileToAttack
     * @param {Function} tileChangedFunc=null
     */
    constructor(atkUnit, tileToAttack, tileChangedFunc = null) {
        this._origTile = atkUnit.placedTile;
        this._atkUnit = atkUnit;
        let isTileChanged = tileToAttack !== this._origTile;
        if (tileToAttack !== null && isTileChanged) {
            tileToAttack.setUnit(atkUnit);
            tileChangedFunc?.();
        }
    }

    dispose() {
        if (this._origTile !== this._atkUnit.placedTile) {
            // ユニットの位置を元に戻す
            setUnitToTile(this._atkUnit, this._origTile);
        }
    }
}

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
        this._damageCalc = new DamageCalculator(logger, unitManager);
        this.logger = logger;
        this.profiler = new PerformanceProfile();
        this._combatHander = new PostCombatSkillHander(unitManager, map, globalBattleContext, logger);

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
            .setTileToAttack(tileToAttack).setDamageType(DamageType.ActualDamage).setGameMode(gameMode);

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
            let tiles = this.map.enumerateRangedSpecialTiles(defUnit.placedTile, atkUnit);
            for (let tile of tiles) {
                let isNotDefUnit = tile.placedUnit !== defUnit;
                let isNotSaverUnit = tile.placedUnit !== this.__getSaverUnitIfPossible(atkUnit, defUnit, DamageType.ActualDamage);
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

        // 戦闘後発動のスキル等を評価
        this._combatHander.applyPostCombatProcess(atkUnit, result.defUnit, result);

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
            .setTileToAttack(tileToAttack).setDamageType(damageType).setGameMode(gameMode);

        this.logger.trace2(`[マス移動前] ${atkUnit.getLocationStr(tileToAttack)}`);
        using_(new ScopedTileChanger(atkUnit, tileToAttack, () => {
            self.updateUnitSpur(atkUnit, calcPotentialDamage, defUnit, damageType);
            self.updateUnitSpur(defUnit, calcPotentialDamage, atkUnit, damageType);
        }), () => {
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
                atkUnit.precombatSpecialTiles =
                    Array.from(this.map.enumerateRangedSpecialTiles(defUnit.placedTile, atkUnit));
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
            let saverUnit = self.__getSaverUnitIfPossible(atkUnit, defUnit, damageType);
            damageCalcEnv.setSaverUnit(saverUnit);
            if (saverUnit != null) {
                // 護り手がいるときは護り手に対する戦闘前奥義のダメージを結果として返す
                preCombatDamage = 0;
                preCombatDamageWithOverkill = 0;
                if (self.isLogEnabled) self.writeDebugLog(`${saverUnit.getNameWithGroup()}による護り手発動`);
                self.__initSaverUnit(saverUnit, defUnit, damageType);
                if (canActivatePrecombatSpecial) {
                    // 戦闘前奥義の範囲にいるユニットを列挙して護り手がいれば範囲奥義の計算を行う
                    let tiles = this.map.enumerateRangedSpecialTiles(defUnit.placedTile, atkUnit);
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
        return this._damageCalc.calcPrecombatSpecialDamage(atkUnit, defUnit);
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
        return this._damageCalc.calcPrecombatSpecialResult(atkUnit, defUnit);
    }

    /**
     * @param  {DamageCalcEnv} damageCalcEnv
     * @returns {CombatResult}
     */
    calcCombatResult(damageCalcEnv) {
        let atkUnit = damageCalcEnv.atkUnit;
        let defUnit = damageCalcEnv.defUnit;
        let damageType = damageCalcEnv.damageType;

        this.combatPhase = NodeEnv.CombatPhase.AT_START_OF_COMBAT;
        let calcPotentialDamage = damageCalcEnv.calcPotentialDamage;
        let self = this;

        // TODO: この場所である必要がない効果は移動する
        // 戦闘後効果
        // ex) 戦闘開始後、敵に7ダメージ(戦闘中にダメージを減らす効果の対象外、ダメージ後のHPは最低1)など
        this.__applySKillEffectForUnitAtBeginningOfCombat(atkUnit, defUnit, damageCalcEnv);
        this.__applySKillEffectForUnitAtBeginningOfCombat(defUnit, atkUnit, damageCalcEnv);

        // self.profile.profile("__applySkillEffect", () => {
        this.updateUnitSpur(atkUnit, calcPotentialDamage, defUnit, damageType);
        this.updateUnitSpur(defUnit, calcPotentialDamage, atkUnit, damageType);

        self.__applySkillEffect(atkUnit, defUnit, calcPotentialDamage);

        damageCalcEnv.applySkill('戦闘開始時', atkUnit, defUnit, this.__applySkillEffectForUnit, this);

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
        damageCalcEnv.applySkill('周囲の味方からのスキル', atkUnit, defUnit, this.__applySkillEffectFromAllies, this);
        // });

        // 周囲の敵からのスキル効果
        damageCalcEnv.applySkill('周囲の敵からのスキル', atkUnit, defUnit,
            this.__applySkillEffectFromEnemyAllies, this);

        this.combatPhase = NodeEnv.CombatPhase.APPLYING_OTHER_UNITS_SKILL_AFTER_FEUD;

        // 暗闘の対象外になる周囲からのスキル効果
        // 主に戦闘外の効果。味方の存在などで発動するスキルも書いて良い（ただし大抵の場合他の場所で書ける）
        damageCalcEnv.applySkill('周囲の味方のスキル(暗闘外)', atkUnit, defUnit,
            this.__applySkillEffectFromAlliesExcludedFromFeud, this);

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

        // 戦闘中バフが決まった後に評価するスキル効果
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_SKILL_AFTER_STATUS_FIXED;
        damageCalcEnv.applySkill('戦闘中バフ決定後のスキル', atkUnit, defUnit,
            this.__applySkillEffectForUnitAfterCombatStatusFixed, this);

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
        atkUnit.battleContext.canFollowupAttackWithoutPotent = self.__examinesCanFollowupAttackForAttacker(atkUnit, defUnit, calcPotentialDamage);
        if (defUnit.battleContext.canCounterattack) {
            defUnit.battleContext.canFollowupAttackWithoutPotent = self.__examinesCanFollowupAttackForDefender(atkUnit, defUnit, calcPotentialDamage);
        }

        // 防御系奥義発動時のダメージ軽減率設定
        self.__applyDamageReductionRatioBySpecial(atkUnit, defUnit);
        self.__applyDamageReductionRatioBySpecial(defUnit, atkUnit);

        // 神速
        // 他の追撃可能かどうかを条件とするスキルは神速も追撃と見なすのでそれより前に神速判定をしなければならない
        // 神速自体も追撃可能かどうかを条件とするので追撃判定の後に効果を適用しなければならない
        this.combatPhase = NodeEnv.CombatPhase.APPLYING_POTENT;
        damageCalcEnv.applySkill('神速判定時', atkUnit, defUnit, this.__applyPotentSkillEffect, this);
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

        let result;
        // self.profile.profile("_damageCalc.calcCombatResult", () => {
        result = self._damageCalc.calcCombatResult(damageCalcEnv);
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

    __getSaverUnitIfPossible(atkUnit, defUnit, damageType) {
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
            if (isNoDefTile || cannotMoveToForSave ) {
                continue;
            }

            let canActivateSaviorWithin2Spaces =
                this.__canActivateSaveSkillWithin2Spaces(atkUnit, ally, damageType) &&
                ally.distance(defUnit) <= 2;
            if (canActivateSaviorWithin2Spaces ||
                this.__canActivateSaveSkill(atkUnit, defUnit, ally, damageType)) {
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
     * @returns {boolean}
     */
    __canActivateSaveSkillWithin2Spaces(atkUnit, ally, damageType) {
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

        // 通常の護り手スキルの後に判定を行う
        if (ally.hasStatusEffect(StatusEffectType.AssignDecoy)) {
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
     * @returns {boolean}
     */
    __canActivateSaveSkill(atkUnit, defUnit, ally, damageType) {
        let env = new DamageCalculatorWrapperEnv(this, defUnit, atkUnit, null);
        env.setTargetAlly(ally).setSkillOwner(ally);
        env.setName('護り手判定時').setLogLevel(getSkillLogLevel()).setDamageType(damageType)
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
                case Weapon.CarnageAmatsu:
                    if (this.__isSolo(defUnit)) {
                        let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
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

    __init__applySkillEffectForAtkUnitFuncDict() {
        let self = this;
        {
            let func = (atkUnit) => {
                atkUnit.atkSpur += 4;
                atkUnit.defSpur += 4;
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.InstantBowPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.InstantSwordPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.InstantLancePlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.InstantAxePlus] = func;
        }
        {
            let func = (atkUnit) => {
                atkUnit.atkSpur += 5;
                atkUnit.spdSpur += 5;
                atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.CourtlyFanPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.ViciousDaggerPlus] = func;
        }
        self._applySkillEffectForAtkUnitFuncDict[Weapon.BenihimeNoOno] = (atkUnit, defUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                if (defUnit.battleContext.restHpPercentage === 100) {
                    atkUnit.atkSpur += 5;
                    atkUnit.defSpur += 5;
                    atkUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KurooujiNoYari] = (atkUnit, defUnit) => {
            if (defUnit.battleContext.restHpPercentage === 100) {
                atkUnit.atkSpur += 5;
                atkUnit.defSpur += 5;
                atkUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.HewnLance] = (atkUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 4;
                atkUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveB.BeliefInLove] = (atkUnit, defUnit) => {
            if (defUnit.battleContext.restHpPercentage === 100) {
                defUnit.atkSpur -= 5;
                defUnit.defSpur -= 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.SatougashiNoAnki] = (atkUnit) => {
            atkUnit.spdSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KokyousyaNoYari] = (atkUnit, defUnit) => {
            if (defUnit.battleContext.restHpPercentage >= 70) {
                atkUnit.atkSpur += 5;
                atkUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KinranNoSyo] = (atkUnit) => {
            atkUnit.atkSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.RohyouNoKnife] = (atkUnit, defUnit) => {
            if (defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) {
                atkUnit.defSpur += 20;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Paruthia] = (atkUnit, defUnit) => {
            if (!atkUnit.isWeaponRefined) {
                atkUnit.resSpur += 4;
            }
            else {
                if (isWeaponTypeTome(defUnit.weaponType)) {
                    atkUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, defUnit);
                }
                if (atkUnit.isWeaponSpecialRefined) {
                    if (defUnit.isRangedWeaponType()) {
                        atkUnit.atkSpur += 6;
                    }
                }
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Yatonokami] = (atkUnit) => {
            if (atkUnit.weaponRefinement === WeaponRefinementType.None) {
                atkUnit.spdSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KageroNoGenwakushin] = (atkUnit, defUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, defUnit);
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Sangurizuru] = (atkUnit) => {
            if (!atkUnit.isWeaponRefined) {
                atkUnit.atkSpur += 3;
                atkUnit.spdSpur += 3;
            } else {
                atkUnit.atkSpur += 4;
                atkUnit.spdSpur += 4;
                if (atkUnit.isWeaponSpecialRefined) {
                    atkUnit.atkSpur += 6;
                    atkUnit.spdSpur += 6;
                }
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.GeneiFalcion] = (atkUnit) => {
            {
                let count = self.__countAlliesActionDone(atkUnit);
                let amount = Math.min(7, count * 2 + 3);
                if (atkUnit.isWeaponRefined) {
                    amount = Math.min(10, count * 3 + 4);
                }
                atkUnit.atkSpur += amount;
                atkUnit.spdSpur += amount;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.YaibaNoSession3] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let count = self.__countAlliesActionDone(atkUnit);
                let amount = Math.min(9, count * 3 + 3);
                atkUnit.atkSpur += amount;
                atkUnit.spdSpur += amount;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.SteadyImpact] = (atkUnit) => {
            atkUnit.spdSpur += 7;
            atkUnit.defSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.SwiftImpact] = (atkUnit) => {
            atkUnit.spdSpur += 7;
            atkUnit.resSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinKongoNoSyungeki] = (atkUnit) => {
            atkUnit.atkSpur += 6;
            atkUnit.defSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinMeikyoNoSyungeki] = (atkUnit) => {
            atkUnit.atkSpur += 6;
            atkUnit.resSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.BlazingDurandal] = (atkUnit) => {
            atkUnit.battleContext.increaseCooldownCountForBoth();
            atkUnit.battleContext.reducesCooldownCount = true;
            if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                atkUnit.spdSpur += 7;
                atkUnit.defSpur += 10;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.NinissIceLance] = (atkUnit) => {
            if (!atkUnit.isWeaponRefined) {
                atkUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Forblaze] = (atkUnit) => {
            if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                atkUnit.atkSpur += 6;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.HanasKatana] = (atkUnit) => {
            if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                atkUnit.atkSpur += 4;
                atkUnit.spdSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Durandal] = (atkUnit) => {
            atkUnit.atkSpur += 6;
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 4;
                atkUnit.spdSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.FurederikuNoKenfu] = (atkUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 6;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.JokerNoSyokki] = (atkUnit, defUnit) => {
            defUnit.addAllSpur(-4);
            if (atkUnit.isWeaponSpecialRefined) {
                let isActivated = false;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 3, false)) {
                    if (!unit.isFullHp) {
                        isActivated = true;
                        break;
                    }
                }
                if (isActivated) {
                    atkUnit.addAllSpur(4);
                }
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.DeathBlow3] = (atkUnit) => {
            atkUnit.atkSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.DeathBlow4] = (atkUnit) => {
            atkUnit.atkSpur += 8;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki1] = (atkUnit) => {
            atkUnit.spdSpur += 2;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki2] = (atkUnit) => {
            atkUnit.spdSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki3] = (atkUnit) => {
            atkUnit.spdSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki4] = (atkUnit) => {
            atkUnit.spdSpur += 9;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KongoNoIchigeki3] = (atkUnit) => {
            atkUnit.defSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.MeikyoNoIchigeki3] = (atkUnit) => {
            atkUnit.resSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinHienNoIchigeki3] = (atkUnit) => {
            atkUnit.atkSpur += 6; atkUnit.spdSpur += 7;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinKongoNoIchigeki2] = (atkUnit) => {
            atkUnit.atkSpur += 4; atkUnit.defSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinMeikyoNoIchigeki2] = (atkUnit) => {
            atkUnit.atkSpur += 4; atkUnit.resSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienKongoNoIchigeki2] = (atkUnit) => {
            atkUnit.spdSpur += 4; atkUnit.defSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienMeikyoNoIchigeki2] = (atkUnit) => {
            atkUnit.spdSpur += 4; atkUnit.resSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KongoMeikyoNoIchigeki2] = (atkUnit) => {
            atkUnit.defSpur += 4; atkUnit.resSpur += 4;
        };
        {
            let func = (atkUnit, defUnit) => {
                defUnit.addAllSpur(-4);
            };

            self._applySkillEffectForAtkUnitFuncDict[Weapon.HelmsmanAxePlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.RauaFoxPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.BlarfoxPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.GronnfoxPlus] = func;
        }

        {
            let func = (atkUnit) => {
                atkUnit.addAllSpur(2);
            };

            self._applySkillEffectForAtkUnitFuncDict[Weapon.KaigaraNoYari] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.KiagaraNoYariPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.BeachFlag] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.BeachFlagPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.YashiNoMiNoYumi] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.YashiNoMiNoYumiPlus] = func;
        }

        {
            let func = (atkUnit) => {
                atkUnit.atkSpur += 4;
                atkUnit.defSpur += 4;
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.AijouNoHanaNoYumiPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.BukeNoSteckPlus] = func;
        }

        {
            let func = (atkUnit) => {
                if (atkUnit.isWeaponSpecialRefined) {
                    atkUnit.spdSpur += 6;
                }
            };

            self._applySkillEffectForAtkUnitFuncDict[Weapon.Toron] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.MiraiNoSeikishiNoYari] = func;
        }

        {
            let func = (atkUnit) => {
                atkUnit.atkSpur += 4; atkUnit.spdSpur += 4;
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.KurokiChiNoTaiken] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.FlowerStandPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.CakeKnifePlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.SyukuhaiNoBottlePlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.SyukuhukuNoHanaNoYumiPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinHienNoIchigeki2] = func;
        }

        {
            let func = (atkUnit) => {
                if (atkUnit.isWeaponSpecialRefined) {
                    atkUnit.atkSpur += 4; atkUnit.spdSpur += 4;
                }
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.Amite] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.KazahanaNoReitou] = func;
        }
    }

    __init__applySkillEffectForDefUnitFuncDict() {
        let self = this;
        self._applySkillEffectForDefUnitFuncDict[Weapon.Kurimuhirudo] = (defUnit) => {
            if (!defUnit.isWeaponRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(defUnit, 2)) {
                    defUnit.battleContext.canCounterattackToAllDistance = true;
                }
            } else {
                if (self.__isThereAllyInSpecifiedSpaces(defUnit, 3)) {
                    defUnit.battleContext.canCounterattackToAllDistance = true;
                }
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.OgonNoTanken] = (defUnit) => {
            if (defUnit.isSpecialCharged) {
                defUnit.battleContext.canCounterattackToAllDistance = true;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.BenihimeNoOno] = (defUnit, atkUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 5;
                atkUnit.defSpur += 5;
                atkUnit.battleContext.increaseCooldownCountForBoth();
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.KurooujiNoYari] = (defUnit) => {
            defUnit.atkSpur += 5;
            defUnit.defSpur += 5;
            defUnit.resSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveB.GuardBearing3] = (defUnit, atkUnit) => {
            if (!defUnit.isOneTimeActionActivatedForPassiveB) {
                defUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, atkUnit);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.StalwartSword] = (defUnit, atkUnit) => {
            atkUnit.atkSpur -= 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveB.BeliefInLove] = (defUnit, atkUnit) => {
            atkUnit.atkSpur -= 5;
            atkUnit.defSpur -= 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantWard] = (defUnit, atkUnit) => {
            if (!isPhysicalWeaponType(atkUnit.weaponType)) {
                defUnit.atkSpur += 5;
                defUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseWard] = (defUnit, atkUnit) => {
            if (!isPhysicalWeaponType(atkUnit.weaponType)) {
                defUnit.atkSpur += 5;
                defUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.KokyousyaNoYari] = (defUnit) => {
            defUnit.atkSpur += 5;
            defUnit.resSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.Vidofuniru] = (defUnit, atkUnit) => {
            if (!defUnit.isWeaponRefined) {
                if (atkUnit.weaponType === WeaponType.Sword
                    || atkUnit.weaponType === WeaponType.Lance
                    || atkUnit.weaponType === WeaponType.Axe
                ) {
                    defUnit.defSpur += 7;
                }
            } else {
                if (atkUnit.weaponType === WeaponType.Sword
                    || atkUnit.weaponType === WeaponType.Lance
                    || atkUnit.weaponType === WeaponType.Axe
                    || isWeaponTypeBreath(atkUnit.weaponType)
                    || isWeaponTypeBeast(atkUnit.weaponType)
                ) {
                    defUnit.defSpur += 7;
                    defUnit.ResSpur += 7;
                }
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.Naga] = (defUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.defSpur += 4;
                defUnit.resSpur += 4;
            }
            else {
                defUnit.defSpur += 2;
                defUnit.resSpur += 2;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.ManatsuNoBreath] = (defUnit) => {
            defUnit.battleContext.increaseCooldownCountForDefense = true;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.FurorinaNoSeisou] = (defUnit, atkUnit) => {
            if (atkUnit.weaponType === WeaponType.Sword
                || atkUnit.weaponType === WeaponType.Lance
                || atkUnit.weaponType === WeaponType.Axe
                || isWeaponTypeBreathOrBeast(atkUnit.weaponType)
            ) {
                defUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.HinataNoMoutou] = (defUnit) => {
            defUnit.atkSpur += 4;
            defUnit.defSpur += 4;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.OboroNoShitsunagitou] = (defUnit, atkUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                if (atkUnit.isMeleeWeaponType()) {
                    defUnit.resSpur += 6;
                    defUnit.defSpur += 6;
                }
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.YukyuNoSyo] = (defUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.resSpur += 4;
                defUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.FutsugyouNoYari] = (defUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.atkSpur += 4;
                defUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.ByakuyaNoRyuuseki] = (defUnit, atkUnit) => {
            if (!atkUnit.isBuffed) {
                defUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.GeneiFalcion] = (defUnit) => {
            {
                let count = self.__countEnemiesActionDone(defUnit);
                let amount = Math.max(3, 7 - count * 2);
                if (defUnit.isWeaponRefined) {
                    amount = Math.max(4, 10 - count * 3);
                    defUnit.battleContext.healedHpAfterCombat += 7;
                }
                defUnit.defSpur += amount;
                defUnit.resSpur += amount;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.TateNoSession3] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let count = self.__countEnemiesActionDone(defUnit);
                let amount = Math.max(3, 9 - count * 3);
                defUnit.defSpur += amount;
                defUnit.resSpur += amount;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DartingBreath] = (defUnit) => {
            defUnit.spdSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinNoKokyu] = (defUnit) => {
            defUnit.atkSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoNoKokyu] = (defUnit) => {
            defUnit.defSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.MeikyoNoKokyu] = (defUnit) => {
            defUnit.resSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.BerkutsLance] = (defUnit) => {
            defUnit.resSpur += 4;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.BerkutsLancePlus] = (defUnit) => {
            if (defUnit.weaponRefinement === WeaponRefinementType.None) {
                defUnit.resSpur += 4;
            } else {
                defUnit.resSpur += 7;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.Ekkezakkusu] = (defUnit, atkUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                if (atkUnit.isRangedWeaponType()) {
                    defUnit.defSpur += 6;
                    defUnit.resSpur += 6;
                }
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantDef4] = (defUnit, atkUnit) => {
            if (atkUnit.isRangedWeaponType()) {
                defUnit.defSpur += 8;
                defUnit.resSpur += 8;
                defUnit.battleContext.invalidateAllBuffs();
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseDef4] = (defUnit, atkUnit) => {
            if (atkUnit.isMeleeWeaponType()) {
                defUnit.defSpur += 8;
                defUnit.resSpur += 8;
                defUnit.battleContext.invalidateAllBuffs();
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseDef3] = (defUnit, atkUnit) => {
            if (atkUnit.isMeleeWeaponType()) {
                defUnit.defSpur += 6;
                defUnit.resSpur += 6;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.MoumokuNoYumi] = (defUnit, atkUnit) => {
            if (atkUnit.isRangedWeaponType()) {
                defUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.HuinNoKen] = (defUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.defSpur += 4;
                defUnit.resSpur += 4;
            }
            else {
                defUnit.defSpur += 2;
                defUnit.resSpur += 2;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.ShirokiChiNoNaginata] = (defUnit) => {
            defUnit.atkSpur += 4;
            defUnit.defSpur += 4;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinKongoNoKamae1] = (defUnit) => {
            defUnit.atkSpur += 2; defUnit.defSpur += 2;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.GiyuNoYari] = (defUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.spdSpur += 4; defUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoNoKamae4] = (defUnit) => {
            defUnit.defSpur += 8;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.MeikyoNoKamae4] = (defUnit) => {
            defUnit.resSpur += 8;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinMeikyoNoKamae3] = (defUnit) => {
            defUnit.atkSpur += 6;
            defUnit.resSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienKongoNoKamae3] = (defUnit) => {
            defUnit.spdSpur += 6;
            defUnit.defSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.SwiftStance3] = (defUnit) => {
            defUnit.spdSpur += 6;
            defUnit.resSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinKongoNoKamae3] = (defUnit) => {
            defUnit.atkSpur += 6;
            defUnit.defSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinHienNoKamae3] = (defUnit) => {
            defUnit.atkSpur += 6;
            defUnit.spdSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoMeikyoNoKamae3] = (defUnit) => {
            defUnit.resSpur += 6;
            defUnit.defSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.SacaNoOkite] = (defUnit) => {
            if (self.__countAlliesWithinSpecifiedSpaces(defUnit, 2, () => true) >= 2) {
                defUnit.addAllSpur(4);
            }
        };
        {
            let func = (defUnit, atkUnit) => {
                if (isPhysicalWeaponType(atkUnit.weaponType)) {
                    defUnit.atkSpur += 5;
                    defUnit.defSpur += 5;
                }
            };
            self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantFoil] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseFoil] = func;
        }

        {
            let func = (defUnit, atkUnit) => {
                if (atkUnit.isRangedWeaponType()) {
                    defUnit.defSpur += 6;
                    defUnit.resSpur += 6;
                }
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.Blarserpent] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BlarserpentPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.GronnserpentPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.RauarserpentPlus] = func;
        }

        {
            let func = (defUnit, atkUnit) => {
                if (atkUnit.isRangedWeaponType()) {
                    defUnit.defSpur += 6;
                    defUnit.resSpur += 6;
                }
            };


            self._applySkillEffectForDefUnitFuncDict[Weapon.EnkyoriBougyoNoYumiPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantDef3] = func;
        }

        {
            let func = (defUnit) => {
                defUnit.addAllSpur(2);
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.Seiju] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.SeijuPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.HandBell] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.HandBellPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.PresentBukuro] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.PresentBukuroPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.Syokudai] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.SyokudaiPlus] = func;
        }
        {
            let func = (defUnit) => {
                defUnit.defSpur += 7;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoKen] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoKenPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoOnoPlus] = func;
        }
        {
            let func = (defUnit) => {
                defUnit.resSpur += 7;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.BariaNoKen] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BariaNoKenPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BariaNoYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BarrierAxePlus] = func;
        }
        {
            let func = (defUnit) => {
                defUnit.atkSpur += 6;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.HankoNoYari] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.HankoNoYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.ReprisalAxePlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinNoKamae3] = func;
        }

        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienNoKamae3] = (defUnit) => {
            defUnit.spdSpur += 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoNoKamae3] = (defUnit) => {
            defUnit.defSpur += 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.MeikyoNoKamae3] = (defUnit) => {
            defUnit.resSpur += 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinHienNoKamae2] = (defUnit) => {
            defUnit.atkSpur += 4; defUnit.spdSpur += 4;
        };

        {
            let func = (defUnit) => {
                defUnit.atkSpur += 4; defUnit.defSpur += 4;
            };
            self._applySkillEffectForDefUnitFuncDict[PassiveA.OstiasCounter] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.KorakuNoKazariYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinKongoNoKamae2] = func;
        }

        {
            let func = (defUnit) => {
                defUnit.atkSpur += 4; defUnit.resSpur += 4;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.SaladaSandPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinMeikyoNoKamae2] = func;
        }

        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienKongoNoKamae2] = (defUnit) => { defUnit.spdSpur += 4; defUnit.defSpur += 4; };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienMeikyoNoKamae1] = (defUnit) => { defUnit.spdSpur += 2; defUnit.resSpur += 2; };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienMeikyoNoKamae2] = (defUnit) => { defUnit.spdSpur += 4; defUnit.resSpur += 4; };

        {
            let func = (defUnit) => {
                defUnit.defSpur += 4; defUnit.resSpur += 4;
            };
            self._applySkillEffectForDefUnitFuncDict[PassiveA.JaryuNoUroko] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MizuNoBreath] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MizuNoBreathPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoMeikyoNoKamae2] = func;
        }

        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseReversal] = (defUnit) => {
            defUnit.defSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantFerocity] = (defUnit) => {
            defUnit.atkSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantDart] = (defUnit) => {
            defUnit.spdSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantReversal] = (defUnit) => {
            defUnit.defSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantStance] = (defUnit) => {
            defUnit.resSpur += 5;
        };
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

    __getPartnersInSpecifiedRange(targetUnit, spaces) {
        return Array.from(this._unitManager.enumeratePartnersInSpecifiedRange(targetUnit, spaces));
    }

    /// 自身を中心とした縦〇列と横〇列にいる味方の人数を返します
    __countAllyUnitsInCrossWithOffset(targetUnit, offset) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit, false)) {
            if (unit.isInCrossWithOffset(targetUnit, offset)) {
                ++count;
            }
        }
        return count;
    }

    __isThereBreakableStructureForEnemyIn2Spaces(targetUnit) {
        for (let blockTile of this.map.enumerateBreakableStructureTiles(targetUnit.getEnemyGroupId())) {
            let dist = Math.abs(blockTile.posX - targetUnit.posX) + Math.abs(blockTile.posY - targetUnit.posY);
            if (dist <= 2) {
                return true;
            }
        }
        return false;
    }

    __applySkillEffectForUnit(targetUnit, enemyUnit, damageCalcEnv) {
        let self = this;
        this.profiler.profile("__applySkillEffectForUnit", () => {
            self.____applySkillEffectForUnit(targetUnit, enemyUnit, damageCalcEnv);
        });
    }

    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    ____applySkillEffectForUnit(targetUnit, enemyUnit, damageCalcEnv) {
        if (targetUnit.hasStatusEffect(StatusEffectType.Paranoia)) {
            // 【Paranoia】
            // At start of combat, if unit's HP ≤ 99%, grants ATK+5 to unit during combat, and also, if unit initiates combat, unit can make a follow-up attack before foe's next attack.
            // At start of combat, if unit's HP ≤ 99%, if foe initiates combat, and if either that foe's Range = unit's Range or number of【Penalty】effects active on foe excluding stat penalties ≥ 3, unit can counterattack before foe's first attack (excluding when unit's Savior effect triggers).
            if (targetUnit.battleContext.restHpPercentage <= 99) {
                targetUnit.atkSpur += 5;
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.isDesperationActivatable = true;
                }
                if (enemyUnit.battleContext.initiatesCombat) {
                    let areRanged = targetUnit.isRangedWeaponType() && enemyUnit.isRangedWeaponType();
                    let areMelee = targetUnit.isMeleeWeaponType() && enemyUnit.isMeleeWeaponType();
                    let areSameRange = areRanged || areMelee;
                    let negativeCount = enemyUnit.getNegativeStatusEffects().length;
                    if (areSameRange || negativeCount >= 3) {
                        if (!targetUnit.battleContext.isSaviorActivated) {
                            targetUnit.battleContext.isVantageActivatable = true;
                        }
                    }
                }
            }
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.TimesGrip)) {
            targetUnit.addAllSpur(-4);
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.ReducesDamageFromFirstAttackBy40Percent)) {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Incited)) {
            if (targetUnit.battleContext.initiatesCombat) {
                let amount = Math.min(Unit.calcAttackerMoveDistance(targetUnit, enemyUnit), 3);
                targetUnit.addAllSpur(amount);
            }
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.HushSpectrum)) {
            targetUnit.addAllSpur(-5);
            if (targetUnit.hasNormalAttackSpecial()) {
                targetUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
            }
            if (targetUnit.isReducedMaxSpecialCount() && enemyUnit.hasNormalAttackSpecial()) {
                enemyUnit.battleContext.specialCountReductionBeforeFirstAttackByEnemy += 1;
            }
        }
        // 軽減を半分無効
        if (targetUnit.hasStatusEffect(StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent)) {
            targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
        }
        // 【戦果移譲】
        if (targetUnit.hasStatusEffect(StatusEffectType.ShareSpoils)) {
            // 戦闘中、攻撃、速さ、守備、魔防ー5となる状態異常
            targetUnit.addAllSpur(-5);
            // さらに、自分の奥義以外のスキルによる「ダメージを〇〇％軽減」を無効（範囲奥義を除く）
            enemyUnit.battleContext.invalidatesDamageReductionExceptSpecial = true;
        }
        // 神獣の蜜
        if (targetUnit.hasStatusEffect(StatusEffectType.DivineNectar)) {
            // 【神獣の蜜】
            // 戦闘中、【回復不可】を無効
            targetUnit.battleContext.addNullInvalidatesHealRatios(1);
            // 各ターンについて、自分から攻撃した最初の戦闘と敵から攻撃された最初の戦闘の時、戦闘中、
            // 受けるダメージー10（範囲奥義を除く）
            if (targetUnit.battleContext.initiatesCombat) {
                if (!targetUnit.isAttackDone) {
                    targetUnit.battleContext.damageReductionValue += 10;
                }
            } else {
                if (!targetUnit.isAttackedDone) {
                    targetUnit.battleContext.damageReductionValue += 10;
                }
            }
        }

        if (!targetUnit.isOneTimeActionActivatedForFallenStar
            && targetUnit.hasStatusEffect(StatusEffectType.FallenStar)
        ) {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8, enemyUnit);
        }
        if (enemyUnit.battleContext.initiatesCombat &&
            !targetUnit.isOneTimeActionActivatedForDeepStar &&
            targetUnit.hasStatusEffect(StatusEffectType.DeepStar)) {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.8, enemyUnit);
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

        if (targetUnit.hasStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack)) {
            targetUnit.battleContext.increaseCooldownCountForBoth();
        }

        if (targetUnit.hasStatusEffect(StatusEffectType.NeutralizesPenalties)) {
            targetUnit.battleContext.invalidateAllOwnDebuffs();
        }

        if (damageCalcEnv.gameMode === GameMode.SummonerDuels ||
            g_appData.isSummonerDualCalcEnabled) {
            if (targetUnit.attackRange === 1 && enemyUnit.attackRange === 2
                && !targetUnit.battleContext.isSaviorActivated
            ) {
                // 英雄決闘では射程1ボーナスで射程2と闘う時、守備、魔防+7される(護り手発動時は除外)
                targetUnit.addSpurs(0, 0, 7, 7);
            }
        }

        // 今のところ奥義にしかこの効果が存在しないので、重複しない。もし今後重複する場合は重複時の計算方法を調査して実装する
        targetUnit.battleContext.selfDamageDealtRateToAddSpecialDamage =
            getSelfDamageDealtRateToAddSpecialDamage(targetUnit.special);

        // 天脈効果
        let targetTile = targetUnit.placedTile;
        switch (targetTile.divineVein) {
            case DivineVeinType.Water:
                if (targetTile.divineVeinGroup === enemyUnit.groupId) {
                    // * 敵は戦闘中、速さー5、
                    targetUnit.spdSpur -= 5;
                    // * 奥義以外のスキルによる「ダメージを〇〇％軽減」を半分無効（無効にする数値は数切捨て）（範囲奥義を除く）（付与マスに既に天脈がある場合、それを上書きする）（同じタイミングに異なる複数の天脈の付与が発生した場合、天脈は消滅する）
                    enemyUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                }
                break;
            case DivineVeinType.Stone:
                if (targetTile.divineVeinGroup === targetUnit.groupId) {
                    targetUnit.addDefResSpurs(6);
                    targetUnit.battleContext.damageReductionValueOfSpecialAttack += 10;
                }
                break;
            case DivineVeinType.Green:
                if (targetTile.divineVeinGroup === enemyUnit.groupId) {
                    enemyUnit.battleContext.reducesCooldownCount = true;
                }
                break;
            case DivineVeinType.Haze:
                if (targetTile.divineVeinGroup === enemyUnit.groupId) {
                    targetUnit.addAllSpur(-5);
                    enemyUnit.battleContext.invalidateAllBuffs();
                }
                break;
        }

        let env =
            new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        env.setName('戦闘開始時').setLogLevel(getSkillLogLevel())
            .setDamageType(damageCalcEnv.damageType).setIsStatusFixed(false).setCombatPhase(this.combatPhase)
            .setGroupLogger(damageCalcEnv.getCombatLogger());
        AT_START_OF_COMBAT_HOOKS.evaluateWithUnit(targetUnit, env);
        for (let skillId of targetUnit.enumerateSkills()) {
            let skillFunc = this._applySkillEffectForUnitFuncDict[skillId];
            if (skillFunc) {
                skillFunc(targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
            }
            getSkillFunc(skillId, applySkillEffectForUnitFuncMap)?.call(this, targetUnit, enemyUnit,
                damageCalcEnv.calcPotentialDamage);
        }
    }

    __init__applySkillEffectForUnitFuncDict() {
        let self = this;
        // this._applySkillEffectForUnitFuncDict[Weapon.W] = (targetUnit, enemyUnit, calcPotentialDamage) => {
        this._applySkillEffectForUnitFuncDict[Weapon.PaydayPouch] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let amount = Math.min(Math.max(Math.trunc(enemyUnit.getAtkInPrecombat() * 0.25) - 8, 0), 10);
                targetUnit.addAtkSpdSpurs(amount);
                if (targetUnit.getPositiveStatusEffects().length >= 3) {
                    targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PumpkinStemPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2);
                        let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units);
                        targetUnit.addSpurs(...amounts);
                    }
                );
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DazzleFarTrace] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KittyCatParasol] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAtkResSpurs(6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.BonusDoubler4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            let hasPositiveStatusEffect = targetUnit.hasPositiveStatusEffect(enemyUnit);
            if (!hasPositiveStatusEffect) {
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                    if (unit.hasPositiveStatusEffect()) {
                        hasPositiveStatusEffect = true;
                        break;
                    }
                }
            }
            if (hasPositiveStatusEffect) {
                targetUnit.addAllSpur(4);
            }
            targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2);
                    let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units, true);
                    targetUnit.addSpurs(...amounts);
                }
            );
        }
        this._applySkillEffectForUnitFuncDict[Weapon.InspiritedSpear] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount = Math.trunc(targetUnit.getEvalDefInPrecombat() * 0.15);
                enemyUnit.addSpursWithoutRes(-amount);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    let amount = targetUnit.getDefInCombat(enemyUnit) * 0.4;
                    targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(amount);
                });
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.AerialManeuvers] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 50 &&
                enemyUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.addSpdDefSpurs(-4);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AbsoluteAmiti] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(5);
                let amount = enemyUnit.special === Special.None ? 3 : 11 - enemyUnit.maxSpecialCount * 2;
                targetUnit.addAtkSpdSpurs(Math.max(amount, 3));
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeiredGungnir] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    // ステータスの20%(奥義含む。含まない場合はisPrecombatで条件わけする)
                    // if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getDef(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                });
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MiasmaDaggerPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                targetUnit.battleContext.applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncs.push(
                    (attackUnit, attackTargetUnit) => {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.reserveTakeDamage(7);
                        }
                    }
                );
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeiredYewfelle] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let enemyAtk = enemyUnit.getAtkInPrecombat();
                targetUnit.addAtkSpdSpurs(Math.max(Math.min(Math.trunc(enemyAtk * 0.25 - 8), 10), 0));
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeiredForseti] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneEuphoria] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                });
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GeneiFalcion] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HelsReaper] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                // 1戦闘1回まで
                if (defUnit.battleContext.hasNonSpecialMiracleActivated) {
                    return false;
                }
                if (!isWeaponTypeTome(atkUnit.weaponType) &&
                    atkUnit.weaponType !== WeaponType.Staff) {
                    return true;
                }
                return false;
            });
            if (targetUnit.isWeaponRefined) {
                // <錬成効果>
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            if (targetUnit.battleContext.restHpPercentage >= 25 || enemyUnit.hasNegativeStatusEffect()) {
                                targetUnit.addAllSpur(4);
                            }
                        }
                    );
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (atkUnit.battleContext.restHpPercentage >= 25 || defUnit.hasNegativeStatusEffect()) {
                            let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                            atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                        }
                    });
                    targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            if (targetUnit.battleContext.restHpPercentage >= 25 || enemyUnit.hasNegativeStatusEffect()) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                            }
                        }
                    );
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DisarmTrap4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdDefSpurs(-4);
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BrightwindFans] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount = targetUnit.getSpdInPrecombat();
                targetUnit.addAtkSpdSpurs(amount);
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                if (targetUnit.battleContext.initiatesCombat) {
                    // 最初に受けた攻撃のダメージを軽減
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
                    // ダメージ軽減分を保存
                    // 攻撃ごとの固定ダメージに軽減した分を加算
                    targetUnit.battleContext.firstAttackReflexDamageRates.push(1.0);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WindTribeClubPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkDefSpurs(5);
                let positiveCount = targetUnit.getPositiveStatusEffects().length;
                let amount = positiveCount + enemyUnit.getNegativeStatusEffects().length;
                targetUnit.addAtkDefSpurs(amount * 2);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WhitewindBowPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                let positiveCount = targetUnit.getPositiveStatusEffects().length;
                let amount = positiveCount + enemyUnit.getNegativeStatusEffects().length;
                targetUnit.addAtkSpdSpurs(amount * 2);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.TwinSkyWing] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpdDefSpurs(-5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FujinUchiwa] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
            targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    targetUnit.atkSpur += Math.max(targetUnit.getAtkBuffInCombat(enemyUnit), enemyUnit.getAtkBuffInCombat(targetUnit));
                    targetUnit.spdSpur += Math.max(targetUnit.getSpdBuffInCombat(enemyUnit), enemyUnit.getSpdBuffInCombat(targetUnit));
                    targetUnit.defSpur += Math.max(targetUnit.getDefBuffInCombat(enemyUnit), enemyUnit.getDefBuffInCombat(targetUnit));
                    targetUnit.resSpur += Math.max(targetUnit.getResBuffInCombat(enemyUnit), enemyUnit.getResBuffInCombat(targetUnit));

                    enemyUnit.atkSpur -= Math.max(enemyUnit.getAtkBuffInCombat(targetUnit, 0));
                    enemyUnit.spdSpur -= Math.max(enemyUnit.getSpdBuffInCombat(targetUnit, 0));
                    enemyUnit.defSpur -= Math.max(enemyUnit.getDefBuffInCombat(targetUnit, 0));
                    enemyUnit.resSpur -= Math.max(enemyUnit.getResBuffInCombat(targetUnit, 0));
                }
            );
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            targetUnit.battleContext.increaseCooldownCountForBoth();
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DeepStar] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.addSpdDefSpurs(-5);
                let ratio = targetUnit.battleContext.initiatesCombat ? 0.8 : 0.3;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(ratio, enemyUnit);
            }
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.applySkillEffectAfterCombatForUnitFuncs.push(
                    (targetUnit, enemyUnit) => {
                        targetUnit.reserveToAddStatusEffect(StatusEffectType.DeepStar);
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 1, true)) {
                            unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                        }
                    }
                );
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PlayfulPinwheel] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let positiveCount = targetUnit.getPositiveStatusEffects().length;
                let amount = positiveCount + enemyUnit.getNegativeStatusEffects().length;
                targetUnit.addAtkSpdSpurs(amount * 2);
                targetUnit.battleContext.specialCountReductionBeforeFirstAttack += Math.min(positiveCount, targetUnit.battleContext.specialCount);
                targetUnit.battleContext.specialCountReductionBeforeFollowupAttack += Math.max(positiveCount - targetUnit.battleContext.specialCount, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AptitudeArrow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(Math.min(Math.trunc(targetUnit.level), 10));
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.2);
                });
                targetUnit.battleContext.invalidateAllOwnDebuffs();
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.InevitableDeathPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            );
        }
        this._applySkillEffectForUnitFuncDict[Special.DragonBlast] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3, unit => unit.isPartner(targetUnit))) {
                targetUnit.battleContext.specialSkillCondSatisfied = true;
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    if (targetUnit.isPartner(unit)) {
                        targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DragonsFist] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3);
                let amount = Math.min(Unit.getTitleSet(units).size * 3 + 4, 10);
                enemyUnit.addAllSpur(-amount);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.TipTheScales] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.addAllSpur(3);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.Gambit4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdDefSpurs(-4);
            targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                if (isPrecombat) return;
                if (isNormalAttackSpecial(atkUnit.special) ||
                    isDefenseSpecial(atkUnit.special)) {
                    let amount = Math.max(Math.min((atkUnit.maxSpecialCount - 2) * 5, 15), 0);
                    atkUnit.battleContext.additionalDamage += amount;
                }
            });
            targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                return Math.min(defUnit.maxSpecialCount * 0.1, 0.5);
            });
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.GoldUnwinding] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdResSpurs(-5);
            if (targetUnit.battleContext.restHpPercentage >= 50 &&
                targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.6, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.RareTalent] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(7);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let d = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                        if (d >= 1) {
                            targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                                (targetUnit, enemyUnit, calcPotentialDamage) => {
                                    enemyUnit.battleContext.reducesCooldownCount = false;
                                }
                            );
                        }
                        if (d >= 10) {
                            if (targetUnit.battleContext.initiatesCombat ||
                                isRangedWeaponType(enemyUnit.weaponType)) {
                                targetUnit.battleContext.setAttackCountFuncs.push(
                                    (targetUnit, enemyUnit) => {
                                        // 攻撃時
                                        targetUnit.battleContext.attackCount = 2;
                                        // 攻撃を受けた時
                                        targetUnit.battleContext.counterattackCount = 2;
                                    }
                                );
                            }
                        }
                    }
                );
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.CounterRoar4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addAtkSpdSpurs(-4);
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.3, enemyUnit);
            targetUnit.battleContext.reducedRatioForNextAttack = Math.max(0.3, targetUnit.battleContext.reducedRatioForNextAttack);
            targetUnit.battleContext.healedHpAfterCombat += 7;
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.RealmsUnited] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addAllSpur(-7);
                targetUnit.battleContext.damageReductionValueOfFirstAttacks += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ThraciaKinglance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
                let def = targetUnit.getDefInPrecombat();
                enemyUnit.atkSpur -= Math.trunc(def * 0.15);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WesternAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(4);
                // 最初に受けた攻撃のダメージを軽減
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(30 / 100.0, enemyUnit);
                targetUnit.battleContext.firstAttackReflexDamageRates.push(1.0);
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            this.__applyDebuffReverse(targetUnit, targetUnit.weaponInfo.name);
                        }
                    );
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ShirejiaNoKaze] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAtkSpdSpurs(6);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    targetUnit.addAtkSpdSpurs(6);
                    let spd = targetUnit.getSpdInPrecombat();
                    let amount = Math.trunc(spd * 0.2);
                    enemyUnit.addSpdResSpurs(-amount);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAtkSpdSpurs(5);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NightmareHorn] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TeacakeTowerPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TeatimesEdge] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
                let amount = Math.max(Math.min(Math.trunc(enemyUnit.getAtkInPrecombat() * 0.25) - 8, 10), 0);
                targetUnit.addAtkSpdSpurs(amount);

            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TeatimeSetPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAtkSpdSpurs(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KnightlyManner] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.Desperation4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.Mastermind] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAtkSpdSpurs(9);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BakedTreats] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAtkSpdSpurs(6);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.invalidateBuffs(false, true, false, true);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.BindingNecklacePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat ||
                this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addAllSpur(3);
                enemyUnit.addAllSpur(-3);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.HolyWarsEnd2] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkDefSpurs(-5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.DreamDeliverer] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addDefResSpurs(4);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DreamHorn] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkDefSpurs(-6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PackleaderTome] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpursWithoutDef(-5);
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.BeastSense4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdDefSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.PowerOfNihility] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addAllSpur(9);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                let ratio = Math.min(0.1 + targetUnit.maxSpecialCount * 0.2, 1.0);
                targetUnit.battleContext.maxHpRatioToHealBySpecial += ratio;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.GetBehindMe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat ||
                this.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.addSpdDefSpurs(-5);
                let amount = Math.trunc(enemyUnit.getDefInPrecombat() * 0.3);
                enemyUnit.defSpur -= amount;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.FlashSparrow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.addAtkSpdSpurs(7);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneDarkbow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfLaxuries] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FairFightBlade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecial = true;
                enemyUnit.battleContext.invalidatesDamageReductionExceptSpecial = true;
                // TODO: "自分と敵は"の条件がどこまでかかるのか確認する
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                enemyUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack += 20;
                enemyUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack += 20;
            }
            if (targetUnit.battleContext.restHpPercentage >= 25 &&
                targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 1;
            }
            if (targetUnit.battleContext.restHpPercentage >= 25 &&
                enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.healedHpAfterAttackSpecialInCombat = 10;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FathersSonAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、戦闘中、敵の攻撃、守備-5、
                // 自分が与えるダメージ + 戦闘開始時の自分のHPの15 % (戦闘前奥義も含む)、戦闘後、自分は、7回復
                if (targetUnit.battleContext.weaponSkillCondSatisfied || targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    enemyUnit.addAtkDefSpurs(-5, -5);
                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneNihility] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DokuNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DesertTigerAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                if (targetUnit.isWeaponSpecialRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.weaponSkillCondSatisfied = true;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.VoidTome] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAllSpur(4);
                    if (enemyUnit.special !== Special.None && !enemyUnit.isSpecialCountMax) {
                        targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 1;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WoodenTacklePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkDefSpurs(5);
                let amount = Math.min(Math.trunc(targetUnit.restHp * 0.25), 10);
                enemyUnit.addAtkDefSpurs(-amount);
                targetUnit.battleContext.healedHpAfterCombat += 10;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SparklingSun] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                enemyUnit.addAtkResSpurs(-6);
                let amount = Math.min(Math.trunc(targetUnit.restHp * 0.30), 12);
                enemyUnit.addAtkResSpurs(-amount);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.healedHpAfterCombat += 10;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SeashellBowlPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                let amount = Math.min(Math.trunc(targetUnit.restHp * 0.25), 10);
                enemyUnit.addAtkSpdSpurs(-amount);
                targetUnit.battleContext.healedHpAfterCombat += 10;
            }
        }
        this._applySkillEffectForUnitFuncDict[Special.FrostbiteMirror] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.specialCount === 0) {
                targetUnit.battleContext.canCounterattackToAllDistance = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.IceBoundBrand] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                // TODO: 表示上限の99を超えた時にどうなるか確認する
                let spd = targetUnit.getSpdInPrecombat();
                let amount = Math.trunc(spd * 0.2);
                enemyUnit.addAtkSpdSpurs(-amount);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DivineDraught] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let condA = targetUnit.battleContext.initiatesCombat;
                let condB = this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, unit => targetUnit.isPartner(unit));
                let condC = enemyUnit.hasNegativeStatusEffect();
                let num = [condA, condB, condC].filter(c => c).length;
                targetUnit.battleContext.condValueMap.set("num_cond", num);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.ImpenetrableVoid] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addAllSpur(-5);
            targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.BernsNewWay] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.healedHpAfterCombat = 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.NullCDisrupt4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addAtkSpdSpurs(-4);
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RadiantAureola] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.BrashAssault4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if ((targetUnit.battleContext.restHpPercentage <= 99 && targetUnit.battleContext.initiatesCombat) ||
                (enemyUnit.battleContext.restHpPercentage === 100 && targetUnit.battleContext.initiatesCombat)) {
                enemyUnit.addDefResSpurs(-4);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.battleContext.reducedRatioForNextAttack =
                    Math.max(0.3, targetUnit.battleContext.reducedRatioForNextAttack);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PartnershipBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let count = enemyUnit.getPositiveStatusEffects().length + enemyUnit.getNegativeStatusEffects().length;
                let amount = Math.min(count * 4, 16);
                enemyUnit.addSpdDefSpurs(-amount);
                if (count > 0) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SunlightBangle] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                if (targetUnit.battleContext.initiatesCombat) {
                    enemyUnit.battleContext.isVantageActivatable = true;
                }
                enemyUnit.addAtkDefSpurs(-4);
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                let amount = Math.min(dist, 4);
                enemyUnit.addAtkDefSpurs(-amount);
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SeafoamSplitter] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkDefSpurs(-6);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Kvasir] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.7, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SyugosyaNoRekkyu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat ||
                    targetUnit.getSpdInPrecombat() >= enemyUnit.getSpdInPrecombat() - 7) {
                    enemyUnit.addSpursWithoutRes(-5);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateBuffs(false, true, true, false);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.VioldrakeBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.refersMinOfDefOrRes = true;
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.EtherealBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.addAtkResSpurs(-5);
                    targetUnit.battleContext.healedHpByAttack += 7;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addAtkResSpurs(-5);
                        enemyUnit.invalidatesOwnDefDebuff = true;
                        enemyUnit.invalidatesOwnResDebuff = true;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.IncurablePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.battleContext.hasDeepWounds = true;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WyvernHatchet] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addAtkDefSpurs(-6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Heidr] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.GoldenCurse] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.IlianMercLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.MagNullFollow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdResSpurs(-4);
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.PhysNullFollow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdDefSpurs(-4);
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.VassalSaintSteel] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount;
                if (enemyUnit.special === Special.None) {
                    amount = 3;
                } else {
                    amount = Math.max(11 - enemyUnit.maxSpecialCount * 2, 3);
                }
                enemyUnit.addSpdDefSpurs(-amount);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.WingsOfMercy4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addDefResSpurs(-3);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FujinRaijinYumi] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TwinDivinestone] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.RingOfAffiancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.BridalBladePlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ChonsinSprig] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let tmp = Math.max(Math.trunc(enemyUnit.getAtkInPrecombat() * 0.25) - 8, 0);
                let amount = Math.min(tmp, 10);
                enemyUnit.addSpdDefSpurs(-amount);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeartbrokerBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let amount = Math.min(targetUnit.dragonflower, 5);
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FreebladesEdge] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PupilsTome] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || isRangedWeaponType(enemyUnit.weaponType)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnResDebuff = true;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                    let amount = Math.trunc(targetUnit.getResInPrecombat() * 0.2);
                    enemyUnit.addAtkResSpurs(-amount);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RevengerLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ValbarsLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAtkDefSpurs(5);
                if (enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.6, enemyUnit);
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAtkDefSpurs(5);
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.RagingStorm2] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25 || this.__isSolo(targetUnit) || calcPotentialDamage) {
                enemyUnit.addAtkDefSpurs(-5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                let weaponType = enemyUnit.weaponType;
                if (weaponType === WeaponType.Breath || weaponType === WeaponType.Beast) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DeadFangAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneDevourer] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SilentBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.damageReductionValueOfFirstAttacks += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SacrificeStaff] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.DistantASSolo] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addAtkSpdSpurs(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CaptainsSword] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidateAllBuffs();
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AlarmAtkSpd] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addAtkSpdSpurs(3);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AlarmAtkDef] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addAtkDefSpurs(3);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AlarmSpdDef] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addSpdDefSpurs(3);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FruitOfLife] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpdDefSpurs(-5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                targetUnit.battleContext.firstAttackReflexDamageRates.push(1.0);
                if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    targetUnit.battleContext.passiveBSkillCondSatisfied = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Asclepius] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkResSpurs(6);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.GuardBearing4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdDefSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.KnightlyDevotion] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(8);
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneLuin] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidateBuffs(false, true, true, false);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RevealingBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LoneWolf] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                if (this.__isSolo(targetUnit)) {
                    enemyUnit.addSpursWithoutRes(-5);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MaskedLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                let res = targetUnit.getResInPrecombat();
                let amount = Math.trunc(res * 0.2);
                enemyUnit.addSpursWithoutSpd(-amount);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WizenedBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                if (!enemyUnit.battleContext.invalidatesOwnAtkDebuff) {
                    let amount = Math.max(6 - Math.abs(enemyUnit.atkDebuffTotal), 0);
                    enemyUnit.atkSpur -= amount;
                }
                if (!enemyUnit.battleContext.invalidatesOwnSpdDebuff) {
                    let amount = Math.max(6 - Math.abs(enemyUnit.spdDebuffTotal), 0);
                    enemyUnit.spdSpur -= amount;
                }
                if (!enemyUnit.battleContext.invalidatesOwnDefDebuff) {
                    let amount = Math.max(6 - Math.abs(enemyUnit.defDebuffTotal), 0);
                    enemyUnit.defSpur -= amount;
                }
                if (!enemyUnit.battleContext.invalidatesOwnResDebuff) {
                    let amount = Math.max(6 - Math.abs(enemyUnit.resDebuffTotal), 0);
                    enemyUnit.resSpur -= amount;
                }
                enemyUnit.addAllSpur(-6);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.StaffOfLilies] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HadoNoSenfu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, calcPotentialDamage)) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25 ||
                    this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, calcPotentialDamage)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || this.__isSolo(targetUnit) || calcPotentialDamage) {
                        targetUnit.battleContext.weaponSkillCondSatisfied = true;
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MysticWarStaff] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAtkResSpurs(6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TotalWarTome] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAllSpur(-5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GustyWarBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addAllSpur(5);
                if (isWeaponTypeBeast(enemyUnit.weaponType) ||
                    (isRangedWeaponType(enemyUnit.weaponType) &&
                        (enemyUnit.moveType === MoveType.Cavalry || enemyUnit.moveType === MoveType.Flying))) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.6, enemyUnit);
                } else {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FieryWarSword] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let amount = Math.min(targetUnit.getPositiveStatusEffects().length * 3, 12);
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.OstiasHeart] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addAtkDefSpurs(-8);
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ValiantWarAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkDefSpurs(-6);
                targetUnit.battleContext.reducesCooldownCount = true;
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    let count = enemyUnit.maxSpecialCount === 0 ? 4 : enemyUnit.maxSpecialCount;
                    let amount = Math.max(12 - count * 2, 4);
                    enemyUnit.atkSpur -= amount;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdHexblade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                targetUnit.addAtkSpdSpurs(7);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.SpdResHexblade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                targetUnit.addSpdResSpurs(7);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AbyssalBlade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SoaringWings] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpdDefSpurs(-4);
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                let amount = Math.min(dist, 4);
                enemyUnit.addSpdDefSpurs(-amount);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneNastrond] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let specialCount = enemyUnit.special === Special.None ? 4 : enemyUnit.maxSpecialCount;
                let amount = Math.max(12 - specialCount * 2, 4);
                targetUnit.atkSpur += amount;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FrelianBlade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                let amount = Math.trunc(targetUnit.getSpdInPrecombat() * 0.15);
                enemyUnit.addSpursWithoutRes(-amount);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.VengefulFighter4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25 && enemyUnit.battleContext.initiatesCombat) {
                enemyUnit.atkSpur -= 4;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FrelianLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                let amount = Math.trunc(targetUnit.getEvalDefInPrecombat() * 0.2);
                enemyUnit.atkSpur -= amount;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Merikuru] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TenteiNoKen] = (targetUnit, enemyUnit) => {
            enemyUnit.battleContext.followupAttackPriorityDecrement--;
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NewFoxkitFang] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        if (targetUnit.isTransformed) {
                            enemyUnit.addAllSpur(-4);
                        }
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TenseiAngel] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAtkSpdSpurs(5);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAtkSpdSpurs(5);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.AsherasChosen] = (targetUnit, _enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || this.__isThereAllyExceptDragonAndBeastWithin1Space(targetUnit) === false) {
                targetUnit.atkSpur += 6;
                targetUnit.defSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.AsherasChosenPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage ||
                this.__isThereAllyExceptDragonAndBeastWithin1Space(targetUnit) === false ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(9, 0, 9, 9);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DaichiBoshiNoBreath] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                let count = 0;
                for (let unit of self.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    // in 7x7
                    if (Math.abs(targetUnit.posX - unit.posX) <= 3 &&
                        Math.abs(targetUnit.posY - unit.posY) <= 3) {
                        count++;
                    }
                }
                let amount = Math.min(count, 6);
                targetUnit.addAllSpur(amount);
                if (targetUnit.isWeaponSpecialRefined && count >= 1) {
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HaresLancePlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkDefSpurs(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SisterlyWarAxe] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addAtkSpdSpurs(6);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BunnysEggPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NightmaresEgg] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.EscapeRoute4] = (targetUnit, enemyUnit) => {
            enemyUnit.addAtkSpdSpurs(-3);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BowOfRepose] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 99) {
                targetUnit.addAllSpur(5);
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                let amount = Math.min(dist, 4) * 2 + 3;
                enemyUnit.addSpdDefSpurs(-amount);
                if (dist >= 1) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
                if (dist >= 2) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SoulOfZofia2] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.spdSpur -= 5;
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.PartOfThePlan] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-8, -8, 0, -8);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MatersTactics] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, -5, 0, -5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        // 回避4
        {
            let func = (targetUnit, enemyUnit) => {
                enemyUnit.addSpurs(0, -4, -4, 0);
            };
            this._applySkillEffectForUnitFuncDict[PassiveB.Spurn4] = func;
            this._applySkillEffectForUnitFuncDict[PassiveB.CloseCall4] = func;
            this._applySkillEffectForUnitFuncDict[PassiveB.Repel4] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HornOfTheLand] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount = targetUnit.maxSpecialCount * 2;
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DazzlingShift] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CrimeanScepter] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GronndeerPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Queenslance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Queensblade] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
            targetUnit.battleContext.preventedAttackerSpecial = true;
            enemyUnit.battleContext.preventedAttackerSpecial = true;

            targetUnit.battleContext.preventedDefenderSpecial = true;
            enemyUnit.battleContext.preventedDefenderSpecial = true;

            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            enemyUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;

            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            enemyUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NewBrazenCatFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CommandLance] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 3);
                    let amount = Math.min(count * 2, 6);
                    targetUnit.addAllSpur(amount);
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AstraBlade] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.rateOfAtkMinusDefForAdditionalDamage = 0.5;
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                        let amount = Math.min(dist, 4) * 2;
                        targetUnit.atkSpur += amount;
                        enemyUnit.defSpur -= amount;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.VolunteerBow] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                if (isRangedWeaponType(enemyUnit.weaponType)) {
                    enemyUnit.addSpurs(-5, -5, 0, 0);
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KouketsuNoSensou] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if ((targetUnit.battleContext.restHpPercentage === 100 && enemyUnit.battleContext.restHpPercentage === 100) ||
                    (targetUnit.battleContext.restHpPercentage < 100 && enemyUnit.battleContext.restHpPercentage < 100)) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage <= 99 || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FlowerOfJoy] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                let found = false;
                for (let unit of self.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    if (unit.posX === targetUnit.posX ||
                        unit.posY === targetUnit.posY) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.PoeticJustice] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DuskDawnStaff] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.PetalfallBladePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.PetalfallVasePlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DuskbloomBow] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DawnsweetBox] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let atk = targetUnit.getAtkInPrecombat();
                let func = unit => unit.getAtkInPrecombat() >= atk - 4;
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, func);
                let amount = Math.min(count * 3 + 4, 10);
                enemyUnit.addSpurs(-amount, -amount, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.GiftOfMagic] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || isRangedWeaponType(enemyUnit.weaponType)) {
                enemyUnit.addSpurs(-10, 0, 0, -10);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BrilliantStarlight] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-6, 0, 0, -6);
                targetUnit.battleContext.invalidateBuffs(true, false, false, true);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.BeastFollowUp3] = (targetUnit) => {
            targetUnit.battleContext.followupAttackPriorityIncrement++;
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.Nightmare] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addSpurs(-10, 0, -10, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Ravager] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-6, 0, -6, 0);
                targetUnit.battleContext.reducesCooldownCount = true;
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
                if (enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.8, enemyUnit);
                }
            }
            if (targetUnit.isTransformed) {
                targetUnit.battleContext.canCounterattackToAllDistance = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MonarchBlade] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        {
            let func = (targetUnit) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addSpurs(5, 0, 5, 0);
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.ProtectionEdgePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ProtectionPikePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ProtectionBowPlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Liberation] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let units = self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3);
                let amount = Math.min(Unit.getTitleSet(units).size * 4 + 4, 12);
                enemyUnit.addSpurs(0, -amount, -amount, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.PegasusFlight4] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpurs(-4, 0, -4, 0);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DreamingSpear] = (targetUnit) => {
            let units = Array.from(this.enumerateUnitsInTheSameGroupOnMap(targetUnit));
            let partners = units.map(u => u.partnerHeroIndex);
            if (units.some(u => partners.includes(u.heroIndex))) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JoyousTome] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.healedHpAfterCombat = 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.SelfImprover] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneQiang] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                if (dist !== 0) {
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KokkiNoKosou] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                        let amount = Math.min(dist, 3) * 2;
                        targetUnit.addAllSpur(amount);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BouryakuNoSenkyu] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MasterBow] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RagnellAlondite] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addSpurs(5, 0, 0, 5);
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                    targetUnit.battleContext.invalidateBuffs(true, false, true, false);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MagicalLanternPlus] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit)) {
                targetUnit.addSpurs(5, 0, 0, 5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.RemoteSparrow] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.addSpurs(7, 7, 0, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.RemoteSturdy] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.addSpurs(7, 0, 10, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.RemoteMirror] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.addSpurs(7, 0, 0, 10);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CelestialGlobe] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GuidesHourglass] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CrowsCrystal] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ChildsCompass] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let count = targetUnit.getPositiveStatusEffects().length
                let amount = Math.min(count * 4, 16);
                targetUnit.addSpurs(amount, amount, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WaryRabbitFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
                let amount = Math.trunc(targetUnit.getSpdInCombat(enemyUnit) * 0.2);
                enemyUnit.addSpurs(-amount, 0, -amount, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DualityVessel] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KeenRabbitFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FangOfFinality] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeraldingHorn] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
            }
            let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 3);
            if (count >= 2) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
            if (count >= 3) {
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.SwiftSlice] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(8);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AsuraBlades] = (targetUnit) => {
            targetUnit.battleContext.invalidateAllOwnDebuffs();
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PeppyCanePlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, 0, 0, -5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.InseverableSpear] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PeppyBowPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, 0, -5, 0);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SevenfoldGifts] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SolemnAxe] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                if (isNormalAttackSpecial(targetUnit.special)) {
                    let percentage = enemyUnit.battleContext.restHpPercentage;
                    if (percentage >= 20) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                    }
                    if (percentage >= 40) {
                        let atk = enemyUnit.getAtkInPrecombat();
                        let amount = Math.max(Math.min(Math.trunc(atk * 0.25) - 8, 10), 0);
                        enemyUnit.addSpurs(-amount, -amount, 0, 0);
                    }
                    if (percentage >= 60) {
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Aurgelmir] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                targetUnit.battleContext.firstAttackReflexDamageRates.push(1.0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ShintakuNoBreath] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.isBuffedInCombat(enemyUnit)) {
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    targetUnit.addAllSpur(4);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                        let atk = 0;
                        let spd = 0;
                        let def = 0;
                        let res = 0;
                        for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
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
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RetainersReport] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ReginRave] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Seidr] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ProdigyPolearm] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                let count = 0;
                if (targetUnit.maxHp <= enemyUnit.maxHp + 5) {
                    count++;
                }
                if (targetUnit.getAtkInPrecombat() <= enemyUnit.getAtkInPrecombat() + 5) {
                    count++;
                }
                if (targetUnit.getSpdInPrecombat() <= enemyUnit.getSpdInPrecombat() + 5) {
                    count++;
                }
                if (targetUnit.getDefInPrecombat() <= enemyUnit.getDefInPrecombat() + 5) {
                    count++;
                }
                if (targetUnit.getResInPrecombat() <= enemyUnit.getResInPrecombat() + 5) {
                    count++;
                }
                let percentage = count * 5 + 10;
                let amount = Math.trunc(targetUnit.getSpdInPrecombat() * percentage / 100.0);
                enemyUnit.addSpurs(-amount, 0, -amount, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpecialSpiral4] = (targetUnit) => {
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneEclipse] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AllTogether] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
            }
            let count = 0;
            for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                count++;
            }
            let percentage = Math.min(count * 20, 40);
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(percentage / 100.0, enemyUnit);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AwokenBreath] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.invalidateAllBuffs();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CoyotesLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                let amount = Math.min(Unit.calcAttackerMoveDistance(targetUnit, enemyUnit), 3) * 3;
                targetUnit.addSpurs(amount, amount, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.QuickRiposte4] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.25, enemyUnit);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneDownfall] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LanceOfHeroics] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                let amount = Math.min(dist, 4) * 2;
                targetUnit.addAllSpur(amount);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                }
            }
        }

        this._applySkillEffectForUnitFuncDict[Weapon.SnideBow] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 5, 0, 0);
                targetUnit.battleContext.additionalDamage += 7;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    enemyUnit.addSpurs(0, -5, -5, 0);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ChaosManifest] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addSpurs(5, 0, 0, 5);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArdentDurandal] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SealAtk4] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SealSpd4] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SealDef4] = (targetUnit, enemyUnit) => {
            enemyUnit.defSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SealRes4] = (targetUnit, enemyUnit) => {
            enemyUnit.resSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.Duality] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RiteOfSouls] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.defSpur += 5;
                    enemyUnit.defSpur -= 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.DefiersSwordPlus] = func
            this._applySkillEffectForUnitFuncDict[Weapon.DefiersLancePlus] = func
            this._applySkillEffectForUnitFuncDict[Weapon.DefiersBowPlus] = func
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.MysticBoost4] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 5;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.YmirEverliving] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || isRangedWeaponType(enemyUnit.weaponType)) {
                targetUnit.addAllSpur(5);
                let hps = [];
                for (let unit of self.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    hps.push(unit.battleContext.restHp);
                }
                hps.sort();
                let amount;
                if (hps.length <= 1) {
                    amount = 0;
                } else {
                    hps = hps.filter((elem, index, self) => self.indexOf(elem) === index);
                    if (hps.length === 1) {
                        hps.push(hps[0]);
                    }
                    amount = Math.min(Math.trunc(hps[1] * 0.4), 20);
                }
                targetUnit.atkSpur += amount;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                    // 1戦闘1回まで
                    if (defUnit.battleContext.hasNonSpecialMiracleActivated) {
                        return false;
                    }
                    if (defUnit.battleContext.initiatesCombat || isRangedWeaponType(atkUnit.weaponType)) {
                        if (defUnit.restHpPercentage >= 25) {
                            return true;
                        }
                    }
                    return false;
                });
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BladeOfFavors] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.addSpurs(-5, -5, -5, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.Dragonhide] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addAllSpur(-8);
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneGrima] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TaguelChildFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                // <錬成効果>
                if (self.__isSolo(targetUnit) || calcPotentialDamage || targetUnit.battleContext.restHpPercentage <= 90) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.restHpPercentage >= 50) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                        if (targetUnit.isTransformed) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                        }
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BrazenCatFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addSpurs(6, 6, 0, 0);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || (self.__isSolo(targetUnit) || calcPotentialDamage)) {
                    targetUnit.addSpurs(6, 6, 0, 0);
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    targetUnit.battleContext.additionalDamageOfSpecial += 10;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                        if (targetUnit.isTransformed) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ZekkaiNoSoukyu] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.initiatesCombat && enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RazingBreath] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SurpriseBreathPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 0, 0, 5);
                let amount = Math.trunc(targetUnit.getResInPrecombat() * 0.2);
                enemyUnit.addSpurs(-amount, 0, 0, -amount);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GhostlyLanterns] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.StarlightStone] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addSpurs(-5, 0, 0, -5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.StarlightStone] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MoonlightStone] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FaithfulBreath] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 40) {
                targetUnit.addSpurs(6, 6, 0, 0);
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WarriorsSword] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CrimsonWarAxe] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
            let hpPercentage = targetUnit.battleContext.restHpPercentage;
            if (hpPercentage >= 20) {
                enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                enemyUnit.battleContext.increaseCooldownCountForDefense = false;
            }
            if (hpPercentage >= 40) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FumingFreikugel] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            let isThereHigherDefAlly = self.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                unit => targetUnit.getDefInPrecombat() < unit.getDefInPrecombat());
            if (!isThereHigherDefAlly || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WindGenesis] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 6, 0, 0);
                let amount = 11 - Math.max(enemyUnit.maxSpecialCount, 3) * 2;
                enemyUnit.addSpurs(-amount, -amount, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CrimsonBlades] = (targetUnit, enemyUnit) => {
            let hpPercentage = targetUnit.battleContext.restHpPercentage;
            if (hpPercentage >= 20) {
                enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                enemyUnit.battleContext.increaseCooldownCountForDefense = false;
            }
            if (hpPercentage >= 40) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneEljudnir] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-6, 0, -6, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TempestsClaw] = (targetUnit, enemyUnit) => {
            if (isWeaponTypeTome(enemyUnit.weaponType) && enemyUnit.color === ColorType.Blue) {
                enemyUnit.battleContext.isEffectiveToOpponent = true;
            }
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(5, 0, 5, 0);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TenteiNoHado] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FieryFang] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 0, 6, 0);
                let amount = Math.trunc(targetUnit.getDefInPrecombat() * 0.2);
                enemyUnit.addSpurs(-amount, 0, -amount, 0);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KindlingTaiko] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                if (targetUnit.battleContext.initiatesCombat) {
                    if (enemyUnit.color !== ColorType.Red) {
                        targetUnit.atkSpur += Math.trunc(targetUnit.getAtkInPrecombat() * 0.2);
                        enemyUnit.atkSpur -= Math.trunc(enemyUnit.getAtkInPrecombat() * 0.2);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FrameGunbaiPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 0, 5, 0);
                let amount = Math.trunc(targetUnit.getDefInPrecombat() * 0.2);
                enemyUnit.addSpurs(-amount, 0, -amount, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BreathOfFlame] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.VerdictOfSacae] = (targetUnit) => {
            let count = 0;
            for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 4)) {
                count++;
            }
            if (count >= 1) {
                targetUnit.battleContext.passiveASkillCondSatisfied = true;
                let amount = Math.min(count * 4 + 4, 12);
                targetUnit.addAllSpur(amount);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FirelightLance] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BreakerLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-6, 0, -6, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.NewDivinity] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, 0, 0, -5);
            }
            if (targetUnit.battleContext.restHpPercentage >= 40) {
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        {
            // 激突3, 4
            let getFunc = (spurFunc, skillLevel, debuffFlags) => {
                return (targetUnit, enemyUnit) => {
                    let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                    if (dist > 0) {
                        let amount = 0;
                        let distLimit = 0;
                        switch (skillLevel) {
                            case 4:
                                amount = 6;
                                distLimit = 4;
                                break;
                            case 3:
                                amount = 5;
                                distLimit = 3;
                                break;
                        }
                        spurFunc.call(targetUnit, amount);
                        spurFunc.call(targetUnit, Math.min(dist, distLimit));
                        if (skillLevel === 4 && dist >= 2) {
                            targetUnit.battleContext.invalidateOwnDebuffs(...debuffFlags);
                        }
                    }
                }
            }
            this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdClash3] =
                getFunc(Unit.prototype.addAtkSpdSpurs, 3, [true, true, false, false]);
            this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdClash4] =
                getFunc(Unit.prototype.addAtkSpdSpurs, 4, [true, true, false, false]);

            this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefClash3] =
                getFunc(Unit.prototype.addAtkDefSpurs, 3, [true, false, true, false]);
            this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefClash4] =
                getFunc(Unit.prototype.addAtkDefSpurs, 4, [true, false, true, false]);

            this._applySkillEffectForUnitFuncDict[PassiveA.SpdDefClash3] =
                getFunc(Unit.prototype.addSpdDefSpurs, 3, [false, true, true, false]);
            this._applySkillEffectForUnitFuncDict[PassiveA.SpdDefClash4] =
                getFunc(Unit.prototype.addSpdDefSpurs, 4, [false, true, true, false]);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdPreempt3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WandererBlade] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(5, 5, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JinroOuNoTsumekiba] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.addSpurs(-5, 0, -5, 0);
                    targetUnit.battleContext.invalidateBuffs(true, false, true, false);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.YonkaiNoSaiki] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ShishiouNoTsumekiba] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                }
                if (enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.7, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.addSpurs(-5, 0, -5, 0);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                        if (targetUnit.isTransformed) {
                            let amount = Math.trunc(enemyUnit.getAtkInPrecombat() * 0.25) - 8;
                            if (amount >= 0) {
                                amount = Math.min(10, amount);
                                targetUnit.addSpurs(amount, 0, amount, amount);
                            }
                        }
                    }
                }
            }
            if (targetUnit.isTransformed) {
                targetUnit.battleContext.canCounterattackToAllDistance = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LunaArc] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FloridCanePlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(5, 5, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ShadowyQuill] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.battleContext.refersMinOfDefOrRes = true;
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FloridKnifePlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(5, 5, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SoothingScent] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LoftyLeaflet] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkSpdBulwark3] = (targetUnit, enemyUnit) => {
            enemyUnit.addAtkSpdSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkDefBulwark3] = (targetUnit, enemyUnit) => {
            enemyUnit.addAtkDefSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdDefBulwark3] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpdDefSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdResBulwark3] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpdResSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.EverlivingBreath] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TriEdgeLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MilasTestament] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                    // 1戦闘1回まで
                    if (defUnit.battleContext.hasNonSpecialMiracleActivated) {
                        return false;
                    }
                    return defUnit.restHpPercentage >= 25;
                });
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeartbeatLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, 0, -5, 0);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addSpurs(-5, 0, -5, 0);
                        let amounts = [
                            targetUnit.maxHp - enemyUnit.maxHp,
                            targetUnit.getAtkInPrecombat() - enemyUnit.getAtkInPrecombat(),
                            targetUnit.getSpdInPrecombat() - enemyUnit.getSpdInPrecombat(),
                            targetUnit.getDefInPrecombat() - enemyUnit.getDefInPrecombat(),
                            targetUnit.getResInPrecombat() - enemyUnit.getResInPrecombat(),
                        ];
                        let count = amounts.filter(x => x > 1).length;
                        let spur = Math.trunc(enemyUnit.getAtkInPrecombat() * (count * 5 + 10) / 100.0);
                        enemyUnit.atkSpur -= spur;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AnkokuNoKen] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                        if (enemyUnit.getSpdInPrecombat() >= enemyUnit.getEvalDefInPrecombat() + 1) {
                            enemyUnit.spdSpur -= 8;
                        } else {
                            enemyUnit.defSpur -= 8;
                        }
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TrasenshiNoTsumekiba] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addSpurs(5, 0, 5, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addSpurs(5, 0, 5, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MaryuHuinNoKen] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Gjallarbru] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addSpurs(4, 4, 0, 0);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DivineWhimsy] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CoralSaberPlus] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(5, 0, 5, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SeahouseAxePlus] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(5, 0, 5, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }

        this._applySkillEffectForUnitFuncDict[Weapon.ChilledBreath] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AtkSpdOath4] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(3, 3, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AtkResOath4] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(3, 0, 0, 3);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CaringConch] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.Chivalry] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.addSpurs(-5, -5, -5, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WhitecapBowPlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 5, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RegalSunshade] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FrozenDelight] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MoonlightDrop] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 0, 0, 6);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.UnyieldingOar] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JinroMusumeNoTsumekiba] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.isTransformed || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JunaruSenekoNoTsumekiba] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        let count = 0;
                        for (let _ of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                            count++;
                        }
                        let amount = Math.min(count * 5, 15);
                        targetUnit.battleContext.additionalDamage += amount;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Kurimuhirudo] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.addSpurs(-5, 0, -5, -0);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KarasuOuNoHashizume] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.isTransformed || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MorphFimbulvetr] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                enemyUnit.addSpurs(-8, 0, 0, -8);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                let maxBuff = 0;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3, false)) {
                    let p = unit.hasStatusEffect(StatusEffectType.Panic) ? 0 : 1;
                    maxBuff = Math.max(p * (unit.atkBuff + unit.resBuff), maxBuff);
                }
                targetUnit.atkSpur += maxBuff;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Kormt] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JollyJadeLance] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NewHeightBow] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BridalSunflowerPlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 0, 5, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BlazingPolearms] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BridalOrchidPlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 0, 0, 5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DragonBouquet] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TrueLoveRoses] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 0, 0, 6)
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WildTigerFang] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidateAllBuffs();
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.UpheavalPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() + 1 || enemyUnit.battleContext.restHpPercentage <= 99) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.YoukoohNoTsumekiba] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MaryuNoBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    enemyUnit.atkSpur -= 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Mafu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addSpurs(5, 5, 0, 0);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.IcyMaltet] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                let amount = targetUnit.dragonflower >= 1 ? 5 : 4;
                targetUnit.addAllSpur(amount);
                if (targetUnit.dragonflower >= 5) {
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RuinousFrost] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityDecrement--;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeadsmanGlitnir] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, -5, -5, 0);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.reducesCooldownCount = true;
                if (self.canCounterAttack(targetUnit, enemyUnit) || enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.EnvelopingBreath] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(0, 6, 0, 6);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SilentPower] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Captain.Effulgence] = (targetUnit) => {
            targetUnit.battleContext.invalidateAllOwnDebuffs();
        }
        this._applySkillEffectForUnitFuncDict[Captain.SecretManeuver] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                targetUnit.battleContext.invalidateFollowupAttackSkills();
            }
        }
        this._applySkillEffectForUnitFuncDict[Captain.FlashOfSteel] = (targetUnit) => {
            targetUnit.battleContext.isDesperationActivatable = true;
            targetUnit.battleContext.invalidateCooldownCountSkills();
        }

        this._applySkillEffectForUnitFuncDict[Weapon.ShadowBreath] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addSpurs(-6, 0, 0, -6);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FieryBolganone] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || (self.__isSolo(targetUnit) || calcPotentialDamage)) {
                targetUnit.addSpurs(6, 0, 0, 6);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ThundersMjolnir] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ThundererTome] = (targetUnit) => {
            if (self.globalBattleContext.currentTurn <= 3 || targetUnit.battleContext.restHpPercentage <= 99) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.additionalDamageOfSpecial += 7;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AversasNight] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.addSpurs(-4, -4, 0, -4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TakaouNoHashizume] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.isRestHpFull) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (targetUnit.isTransformed || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addSpurs(5, 0, 5, 0);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addSpurs(5, 0, 5, 0);
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LargeWarAxe] = (targetUnit) => {
            if (self.globalBattleContext.isOddTurn) {
                targetUnit.atkSpur += 10;
                targetUnit.spdSpur += 10;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
            } else {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SturdyWarSword] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let count = 0
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 4)) {
                    count++;
                }
                if (count >= 1) {
                    targetUnit.battleContext.specialCountReductionBeforeFirstAttack += Math.trunc(targetUnit.maxSpecialCount / 2);
                }
                if (count >= 2) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.1 * targetUnit.maxSpecialCount, enemyUnit);
                }
                if (count >= 3) {
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WindyWarTome] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AdroitWarTome] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkResTempo3] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpurs(-3, 0, 0, -3);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdDefTempo3] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpurs(0, -3, -3, 0);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdResTempo3] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpurs(0, -3, 0, -3);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SharpWarSword] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AscendingBlade] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DotingStaff] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.QuickMulagir] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AzureLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.additionalDamage += 7;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AnyaryuNoBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    enemyUnit.atkSpur -= 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Hyoushintou] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.atkSpur -= 4;
                    enemyUnit.spdSpur -= 4;
                    enemyUnit.defSpur -= 4;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.atkSpur -= 4;
                        enemyUnit.spdSpur -= 4;
                        enemyUnit.defSpur -= 4;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SeireiNoHogu] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MagicRabbits] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 6;
                targetUnit.atkSpur += targetUnit.maxSpecialCount * 3;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CarrotTipSpearPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CarrotTipBowPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PastelPoleaxe] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FaithfulLoyalty] = (targetUnit, enemyUnit) => {
            if (enemyUnit.moveType === MoveType.Armor || enemyUnit.moveType === MoveType.Cavalry) {
                targetUnit.battleContext.isVantageActivatable = true;
            }
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.WilyFighter3] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25 && enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.invalidateAllBuffs();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DewDragonstone] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                enemyUnit.addAllSpur(-5);
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.resSpur -= 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.HvitrvulturePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.GronnvulturePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.BlarvulturePlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SellSpellTome] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                let amount = Math.min(7, Math.max(targetUnit.dragonflower + 2, 4));
                targetUnit.addAllSpur(amount);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfReason] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BowOfVerdane] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GousouJikumunto] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75 || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(5);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HurricaneDagger] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.StaffOfTributePlus] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.defSpur += 6;
                targetUnit.resSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DestinysBow] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PiercingTributePlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AchimenesFurl] = (targetUnit, enemyUnit) => {
            let types = new Set();
            for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                types.add(otherUnit.moveType);
            }
            if (types.size >= 2) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
            if (types.size >= 3) {
                targetUnit.battleContext.healedHpByAttack += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SavvyFighter4] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat) {
                enemyUnit.addAtkSpdSpurs(-4);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SavvyFighter3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GerberaAxe] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BoneCarverPlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DancingFlames] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DrybladeLance] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RoyalHatariFang] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArgentAura] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SwornLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
                let activatesSkillEffect = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3, false)) {
                    if (unit.heroIndex === targetUnit.partnerHeroIndex) activatesSkillEffect = true;
                }
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    if (unit.heroIndex === targetUnit.partnerHeroIndex) {
                        if (unit.battleContext.restHpPercentage <= 80) {
                            activatesSkillEffect = true;
                        }
                    }
                }
                if (activatesSkillEffect) {
                    targetUnit.atkSpur += 7;
                    targetUnit.defSpur += 7;
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AncientCodex] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.atkSpur += 5;
                targetUnit.resSpur += 5;
                if (targetUnit.isWeaponRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SeireiNoBreath] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.getDefInPrecombat() >= enemyUnit.getDefInPrecombat() + 5) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (targetUnit.getDefInPrecombat() >= enemyUnit.getDefInPrecombat() + 1 ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    enemyUnit.atkSpur -= 5;
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                        if (enemyUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.7, enemyUnit);
                        }
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Sogun] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat) {
                    if (enemyUnit.weaponType === WeaponType.Sword ||
                        enemyUnit.weaponType === WeaponType.Lance ||
                        enemyUnit.weaponType === WeaponType.Axe ||
                        isWeaponTypeBreath(enemyUnit.weaponType)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                }
            } else {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                    targetUnit.defSpur += 4;
                    targetUnit.resSpur += 4;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BladeOfJehanna] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.spdSpur -= 6;
                enemyUnit.defSpur -= 6;
                targetUnit.battleContext.invalidatesSpdBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RapidCrierBow] = (targetUnit) => {
            let found = false;
            let maxBuff = 0;
            for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3, false)) {
                found = true;
                let p = unit.hasStatusEffect(StatusEffectType.Panic) ? 0 : 1;
                maxBuff = Math.max(p * (unit.atkBuff + unit.spdBuff), maxBuff);
            }
            targetUnit.atkSpur += maxBuff;
            if (found) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.LunarBrace2] = (targetUnit) => {
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PolishedFang] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.defSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JotnarBow] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.spdSpur -= 5;
                enemyUnit.defSpur -= 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SparklingFang] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NidavellirSprig] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NidavellirLots] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SweetYuleLog] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        // 暗闘
        this._applySkillEffectForUnitFuncDict[PassiveC.RedFeud3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.color === ColorType.Red) {
                enemyUnit.addAllSpur(-4);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.BlueFeud3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.color === ColorType.Blue) {
                enemyUnit.addAllSpur(-4);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.GreenFeud3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.color === ColorType.Green) {
                enemyUnit.addAllSpur(-4);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.CFeud3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.color === ColorType.Colorless) {
                enemyUnit.addAllSpur(-4);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LionessBlade] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AncientRagnell] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.InviolableAxe] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.spdSpur -= 4;
                enemyUnit.defSpur -= 4;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.spdSpur -= 4;
                    enemyUnit.defSpur -= 4;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ManatsuNoBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.OpeningRetainer] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 4;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.Worldbreaker] = (targetUnit) => {
            targetUnit.battleContext.increaseCooldownCountForBoth();
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DivineRecreation] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.addAllSpur(-4);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.battleContext.firstAttackReflexDamageRates.push(1.0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DamiellBow] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FiremansHook] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FangedBasilikos] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.spdSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Byureisuto] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (self.globalBattleContext.isOddTurn || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    enemyUnit.atkSpur -= 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.battleContext.followupAttackPriorityDecrement--;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KazesNeedle] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
                targetUnit.resSpur += 4;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                    targetUnit.resSpur += 4;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.IzunNoKajitsu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TenraiArumazu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DivineMist] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ShinkenFalcion] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SpendyScimitar] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                let amount = targetUnit.dragonflower >= 1 ? 6 : 4;
                targetUnit.addAllSpur(amount);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KeenCoyoteBow] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Laevatein] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect()) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SoleilsShine] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SpiderPlushPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DragonsWrath3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.2, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DragonsWrath4] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.25, enemyUnit);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.EerieScripture] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LanternBreathPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WitchBreath] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.atkSpur -= 6;
                --enemyUnit.battleContext.followupAttackPriorityDecrement;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MoonstrikeBreath] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.3;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FlamelickBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                enemyUnit.battleContext.hasDeepWounds = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DemonicTome] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AgneasArrow] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                if (this.isOddTurn) {
                    targetUnit.battleContext.invalidatesSpdBuff = true;
                    targetUnit.battleContext.invalidatesResBuff = true;
                } else {
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HonorableBlade] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DuskDragonstone] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.NinissIceLance] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.addAllSpur(5);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlameSiegmund] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.atkSpur += 4;
                    targetUnit.defSpur += 4;
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BowOfTwelve] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat ||
                (targetUnit.battleContext.restHpPercentage >= 75 &&
                    (enemyUnit.isTome || enemyUnit.weaponType === WeaponType.Staff))) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                    // 1戦闘1回まで
                    return !defUnit.battleContext.hasNonSpecialMiracleActivated;
                });
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DriftingGracePlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LuminousGracePlus] = this._applySkillEffectForUnitFuncDict[Weapon.DriftingGracePlus];
        this._applySkillEffectForUnitFuncDict[Weapon.WhirlingGrace] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.JointDistGuard] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit) && enemyUnit.isRangedWeaponType()) {
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Prescience] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 5;
            enemyUnit.resSpur -= 5;
            if (targetUnit.battleContext.initiatesCombat || enemyUnit.isRangedWeaponType()) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MaritaNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (calcPotentialDamage || this.__isSolo(targetUnit)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    targetUnit.battleContext.invalidateBuffs(false, true, true, false);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                            (targetUnit, enemyUnit, calcPotentialDamage) => {
                                enemyUnit.battleContext.reducesCooldownCount = false;
                            }
                        );
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            if (isPrecombat) {
                                return;
                            }
                            let spd = atkUnit.getSpdInCombat(defUnit);
                            atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.1);
                        });
                        targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.VirtuousTyrfing] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    targetUnit.battleContext.restHpPercentage <= 99) {
                    enemyUnit.addAtkDefSpurs(-6);
                    targetUnit.battleContext.healedHpByAttack += 7;
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75 ||
                    targetUnit.battleContext.restHpPercentage <= 99) {
                    enemyUnit.addAtkDefSpurs(-6);
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (isPrecombat) {
                            return;
                        }
                        let atk = atkUnit.getAtkInCombat(defUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.15);
                    });
                    targetUnit.battleContext.nullCounterDisrupt = true;
                    targetUnit.battleContext.healedHpByAttack += 8;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        enemyUnit.addAtkDefSpurs(-5);
                        targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                            if (isWeaponTypeTome(atkUnit.weaponType) ||
                                atkUnit.weaponType === WeaponType.Staff) {
                                return 0.8;
                            } else {
                                return 0.4;
                            }
                        });
                        if (enemyUnit.battleContext.initiatesCombat &&
                            this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                                if (defUnit.battleContext.hasNonSpecialMiracleActivated) {
                                    return false;
                                }
                                return defUnit.restHpPercentage >= 50;
                            });
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Taiyo] = (targetUnit, enemyUnit) => {
            let amount = targetUnit.isWeaponRefined ? 14 : 10;
            targetUnit.battleContext.healedHpByAttack += amount;
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.addAtkDefSpurs(-5);
                    targetUnit.battleContext.addNullInvalidatesHealRatios(0.5);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        enemyUnit.addAtkDefSpurs(-5);
                        enemyUnit.battleContext.followupAttackPriorityDecrement--;
                        if (targetUnit.battleContext.restHpPercentage >= 50) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        }
                    }
                }
            }
        };
        // 迫撃
        {
            let func = spurFunc => {
                return (targetUnit) => {
                    if (targetUnit.battleContext.initiatesCombat) {
                        let healRatio = 0.1 + (targetUnit.maxSpecialCount * 0.2);
                        targetUnit.battleContext.maxHpRatioToHealBySpecial += healRatio;
                        spurFunc(targetUnit);
                    }
                };
            };
            this._applySkillEffectForUnitFuncDict[PassiveA.SurgeSparrow] = func(targetUnit => {
                targetUnit.atkSpur += 7;
                targetUnit.spdSpur += 7;
            });
            this._applySkillEffectForUnitFuncDict[PassiveA.SturdySurge] = func(targetUnit => {
                targetUnit.atkSpur += 7;
                targetUnit.defSpur += 10;
            });
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MoonlessBreath] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.3;
            }
        };
        // ライオン
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.RauarLionPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.BlarLionPlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BindingReginleif] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let ratio = targetUnit.isWeaponRefined ? 0.4 : 0.3;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(ratio, enemyUnit);
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(5);
                    enemyUnit.addSpursWithoutRes(-5);
                    enemyUnit.addSpursWithoutRes(-Math.min(enemyUnit.getPositiveStatusEffects().length, 4));
                    targetUnit.battleContext.invalidateBuffs(true, true, true, false);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PhantasmTome] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.restHpPercentage >= 50) {
                    enemyUnit.spdSpur -= 6;
                    enemyUnit.resSpur -= 6;
                    targetUnit.battleContext.invalidatesSpdBuff = true;
                    targetUnit.battleContext.invalidatesResBuff = true;
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.7, enemyUnit);
                    }
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 50) {
                    enemyUnit.addSpdResSpurs(-6);
                    targetUnit.battleContext.invalidateBuffs(false, true, false, true);
                    let ratio = targetUnit.battleContext.initiatesCombat ? 0.8 : 0.3;
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(ratio, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                            atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                        });
                        targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                        targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                            (targetUnit, enemyUnit, calcPotentialDamage) => {
                                enemyUnit.battleContext.reducesCooldownCount = false;
                            }
                        );
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Niu] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MakenMistoruthin] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LoyaltySpear] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 4;
                enemyUnit.spdSpur -= 4;
                enemyUnit.defSpur -= 4;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GenesisFalchion] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let buffTotal = self.__getTotalBuffAmountOfTop3Units(targetUnit);
                if (buffTotal >= 10) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                            (targetUnit, enemyUnit, calcPotentialDamage) => {
                                enemyUnit.battleContext.reducesCooldownCount = false;
                            }
                        );
                    }
                }
                if (buffTotal >= 25) {
                    targetUnit.atkSpur += 5;
                    let healedHp = targetUnit.isWeaponRefined ? 7 : 5;
                    targetUnit.battleContext.healedHpByAttack += healedHp;
                }
                if (buffTotal >= 60) {
                    targetUnit.battleContext.isVantageActivatable = true;

                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2);
                            let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units, true);
                            targetUnit.addSpurs(...amounts);
                        }
                    );
                }
            }
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ChargingHorn] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let count = 0;
                if (self.__isThereBreakableStructureForEnemyIn2Spaces(targetUnit)) {
                    count = 3;
                }
                else {
                    count = self.__countAllyUnitsInCrossWithOffset(targetUnit, 1);
                }
                if (count >= 1) {
                    let debuffAmount =
                        targetUnit.isWeaponRefined ? Math.min(count * 3, 9) : Math.min(count * 2, 6);
                    enemyUnit.atkSpur -= debuffAmount;
                    enemyUnit.resSpur -= debuffAmount;
                }
                if (count >= 2 && targetUnit.isWeaponRefined) {
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
                if (count >= 3) {
                    --enemyUnit.battleContext.followupAttackPriorityDecrement;
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.addAtkResSpurs(-6);
                    targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            let status = targetUnit.getDefInCombat(enemyUnit);
                            targetUnit.battleContext.damageReductionValue += Math.trunc(status * 0.2);
                        }
                    );
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.NifuruNoHyoka] = (targetUnit, enemyUnit) => {
            {
                if (!targetUnit.isWeaponRefined) return;
                let allies = Array.from(self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3));
                if (allies.length >= 1) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                    targetUnit.atkSpur += Math.min(allies.length, 2) * 2;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                        let units = Array.from(self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false));
                        let atkMax = units.reduce((max, unit) => Math.max(max, unit.hasStatusEffect(StatusEffectType.Panic) ? 0 : unit.atkBuff), 0);
                        targetUnit.atkSpur += atkMax;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PunishmentStaff] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MermaidBow] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.refersMinOfDefOrRes = true;
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.EbonPirateClaw] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.CrossbonesClaw] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                enemyUnit.spdSpur -= 6;
                enemyUnit.defSpur -= 6;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.isDesperationActivatable = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.YngviAscendant] = (targetUnit) => {
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TigerSpirit] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.EverlivingDomain] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.canActivateNonSpecialMiracle = true;
                let threshold = targetUnit.battleContext.nonSpecialMiracleHpPercentageThreshold;
                targetUnit.battleContext.nonSpecialMiracleHpPercentageThreshold = Math.min(threshold, 75);
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.DomainOfFlame] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 4;
                targetUnit.defSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.DomainOfIce] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.spdSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FrostbiteBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAllSpur(-5);
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowDesperation] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpdDefSpurs(-4);
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowNTrace3] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowForce3] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;

                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowGuard3] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;

                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowRefresh3] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DolphinDiveAxe] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RaydreamHorn] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BrightmareHorn] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Blizard] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.spdSpur -= 4;
                    enemyUnit.resSpur -= 4;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.addAllSpur(-4);
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StoutTomahawk] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Leiptr] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    if (enemyUnit.battleContext.initiatesCombat) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MaskingAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FuginNoMaran] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.JaryuNoBreath] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.DragonSkin2] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(6);
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.LawsOfSacae2] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(6);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DivineSeaSpear] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 3;
                targetUnit.spdSpur += 3;
                targetUnit.defSpur += 3;

                enemyUnit.atkSpur -= 3;
                enemyUnit.spdSpur -= 3;
                enemyUnit.defSpur -= 3;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PeachyParfaitPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.resSpur += 5;
                enemyUnit.resSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SunshadeStaff] = (targetUnit) => {
            if (!self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Scadi] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KenhimeNoKatana] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2) || targetUnit.battleContext.initiatesCombat) {
                    targetUnit.spdSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MuninNoMaran] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HolyGradivus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RohyouNoKnife] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Pesyukado] = (targetUnit) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ObservantStaffPlus] = (targetUnit) => {
            {
                if (self.__isThereAnyPartnerPairsIn3Spaces(targetUnit)) {
                    targetUnit.addAllSpur(6);
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.Gradivus] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.healedHpByAttack += 7;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Siegfried] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.atkSpur -= 4;
                    enemyUnit.defSpur -= 4;
                    --enemyUnit.battleContext.followupAttackPriorityDecrement;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Raijinto] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.addAllSpur(4)
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.MurderousLion] = (targetUnit, enemyUnit) => {
            if (!self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.spdSpur -= 3;
                enemyUnit.defSpur -= 3;
                targetUnit.battleContext.invalidatesCounterattack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.ArmoredWall] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.reducesCooldownCount = true;
                if (targetUnit.isTransformed
                    && !targetUnit.isOneTimeActionActivatedForPassiveB
                ) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.FatalSmoke3] = (targetUnit, enemyUnit) => {
            enemyUnit.battleContext.hasDeepWounds = true;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KyoufuArmars] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.3;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlowerLance] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GrimasTruth] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.addAllSpur(-4);
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Shamsir] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkSpdNearTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.spdSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkDefNearTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkResNearTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.resSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdDefNearTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdResNearTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.resSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkSpdFarTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.spdSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkDefFarTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkResFarTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.resSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdDefFarTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdResFarTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.resSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfGrado] = (targetUnit, enemyUnit) => {
            if (!targetUnit.battleContext.initiatesCombat
                || enemyUnit.battleContext.restHpPercentage === 100
            ) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnResDebuff = true;
                targetUnit.battleContext.isAdvantageForColorless = isRangedWeaponType(enemyUnit.weaponType);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StaffOfRausten] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LanceOfFrelia] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.defSpur += 10;
                    targetUnit.resSpur += 10;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.MoonTwinWing] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.spdSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SunTwinWing] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.spdSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LilacJadeBreath] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GullinkambiEgg] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TallHammer] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                // 周囲1マスにいない時の強化は別の処理で行っているため、ここでは除外
                if (!self.__isSolo(targetUnit) && targetUnit.battleContext.initiatesCombat) {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Nagurufaru] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    enemyUnit.atkSpur -= 4;
                    enemyUnit.resSpur -= 4;
                }
                if (!targetUnit.battleContext.initiatesCombat
                    && targetUnit.battleContext.restHpPercentage >= 70
                ) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.FallenStar] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Audhulma] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Meisterschwert] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                if (targetUnit.battleContext.initiatesCombat) {
                    --enemyUnit.battleContext.followupAttackPriorityDecrement;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SpySongBow] = (targetUnit) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (self.__isThereAnyPartnerPairsIn3Spaces(targetUnit)) {
                targetUnit.addAllSpur(6);
                targetUnit.battleContext.healedHpByAttack += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Thjalfi] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                targetUnit.addAllSpur(6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.WithEveryone2] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AsNearSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.ArNearSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.AdNearSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.defSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.AsFarSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.AdFarSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.defSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.ArFarSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.DrFarSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.DrNearSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Forusethi] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat
                    && targetUnit.battleContext.restHpPercentage >= 25
                ) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }

                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesSpdBuff = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SpringtimeStaff] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat
                    || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                ) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ArdensBlade] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.defSpur += 6;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfFavors] = (targetUnit, enemyUnit) => {
            if (!isWeaponTypeBeast(enemyUnit.weaponType)) {
                targetUnit.atkSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PurifyingBreath] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ObsidianLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Thunderbrand] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.EffiesLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 50) {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PaleBreathPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnDefDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SlickFighter3] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25 && enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidateAllOwnDebuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BlackfireBreathPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.resSpur -= 5;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesResBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.Dragonscale] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
                targetUnit.battleContext.increaseCooldownCountForDefense = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GiltGoblet] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.CourtlyMaskPlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        {
            let func = (targetUnit) => {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.StoutLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.StoutAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CourtlyBowPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CourtlyCandlePlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.CraftFighter3] = (targetUnit) => {
            if (!targetUnit.battleContext.initiatesCombat
                && targetUnit.battleContext.restHpPercentage >= 25
            ) {
                targetUnit.battleContext.reducesCooldownCount = true;
                ++targetUnit.battleContext.followupAttackPriorityIncrement;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Garumu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.healedHpByAttack += 7;
                }
                if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ArmorsmasherPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.moveType === MoveType.Armor) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KeenGronnwolfPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.moveType === MoveType.Cavalry) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlowerHauteclere] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                    let amount = 3 + Math.min(dist, 3) * 2;
                    targetUnit.addSpurs(amount, 0, amount, amount);
                    targetUnit.battleContext.healedHpByAttack += 7;
                    enemyUnit.addSpurs(-6, 0, -6, 0);
                    if (dist >= 1) {
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MoonGradivus] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.increaseCooldownCountForDefense = true;
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addSpurs(0, 5, 5, 5);
                    enemyUnit.addSpurs(0, 0, -5, 0);
                    targetUnit.battleContext.invalidateBuffs(true, false, true, false);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.WindParthia] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat ||
                (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2))) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.5;
                if (targetUnit.isWeaponRefined) {
                    targetUnit.battleContext.addNullInvalidatesHealRatios(0.6);
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DarkSpikesT] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addSpurs(6, 6, 0, 0);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DeckSwabberPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlowingLancePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HelmBowPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.spdSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesSpdBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ShirokiChiNoNaginata] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.DragonsIre4] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat && targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-4, 0, 0, -4);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DragonsIre3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat && targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ShinenNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (!calcPotentialDamage
                    && targetUnit.battleContext.restHpPercentage >= 25
                    && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                ) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StalwartSword] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SnipersBow] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.JukishiNoJuso] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.defSpur += 4;
                    targetUnit.resSpur += 4;
                }

                targetUnit.battleContext.increaseCooldownCountForDefense = true;
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.KarenNoYumi] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                    targetUnit.defSpur += 4;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KurokiChiNoTaiken] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Aymr] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                    enemyUnit.addAtkDefSpurs(-6);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            } else {
                if (enemyUnit.battleContext.initiatesCombat ||
                    this.__isSolo(targetUnit) || calcPotentialDamage) {
                    enemyUnit.addAtkDefSpurs(-6);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.restHpPercentage >= 75 ||
                        this.__isSolo(targetUnit) || calcPotentialDamage) {
                        enemyUnit.addAtkDefSpurs(-5);
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TenmaNoNinjinPlus] = (targetUnit, enemyUnit) => {
            if (DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) === TriangleAdvantage.Advantageous) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SpendthriftBowPlus] = (targetUnit, enemyUnit) => {
            targetUnit.atkSpur += 7;
            enemyUnit.atkSpur -= 7;
            self.__writeDamageCalcDebugLog(`お大尽の弓により${targetUnit.getNameWithGroup()}の攻撃+7、${enemyUnit.getNameWithGroup()}の攻撃-7`);
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnDefDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkResBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnResDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SpdDefBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                targetUnit.battleContext.invalidatesOwnDefDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SpdResBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                targetUnit.battleContext.invalidatesOwnResDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.DefResBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                targetUnit.battleContext.invalidatesOwnResDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.VezuruNoYoran] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.resSpur += 5;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    this.__isThereAllyIn2Spaces(targetUnit, 2) && !calcPotentialDamage) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        if (enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.battleContext.invalidatesCounterattack = true;
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SuyakuNoKen] = (targetUnit, enemyUnit) => {
            if (targetUnit.maxHpWithSkills > enemyUnit.battleContext.restHp) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GrayNoHyouken] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.addAllSpur(3);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.addAllSpur(5);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Randgrior] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.addAtkDefSpurs(-6);
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.addAtkDefSpurs(-6);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                        let count =
                            targetUnit.getPositiveStatusEffects().length +
                            targetUnit.getNegativeStatusEffects().length;
                        targetUnit.addAllSpur(count * 2);
                        if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Rigarublade] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage === 100) {
                if (targetUnit.isWeaponRefined) {
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                }
                else {
                    targetUnit.atkSpur += 2;
                    targetUnit.spdSpur += 2;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SeikenThirufingu] = (targetUnit, enemyUnit) => {
            if (isWeaponTypeTome(enemyUnit.weaponType)) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
            }
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HikariNoKen] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.spdSpur += 4;
                    targetUnit.defSpur += 4;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.OukeNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat
                    || (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
                ) {
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                    }
                }
            }
            else if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Fensariru] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Roputous] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (!enemyUnit.isWeaponEffectiveAgainst(EffectiveType.Dragon)) {
                    enemyUnit.atkSpur -= 6;
                }
            } else {
                if (!enemyUnit.isWeaponEffectiveAgainst(EffectiveType.Dragon)) {
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.resSpur -= 6;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Buryunhirude] = (targetUnit, enemyUnit) => {
            if (isWeaponTypeTome(enemyUnit.weaponType)) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Seini] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.isRangedWeaponType()) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }

                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
            else {
                if (enemyUnit.moveType === MoveType.Armor || enemyUnit.moveType === MoveType.Cavalry) {
                    if (enemyUnit.isRangedWeaponType()) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Gureipuniru] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.atkSpur += 3;
                targetUnit.spdSpur += 3;
                if (targetUnit.isWeaponSpecialRefined) {
                    enemyUnit.addAllSpur(-4);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Ivarudhi] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                    targetUnit.resSpur += 3;
                }

                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                }
            }
            else {
                if (enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Arrow] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (targetUnit.getAtkInPrecombat() <= enemyUnit.getAtkInPrecombat() - 5) {
                    targetUnit.addAllSpur(5);
                }
            } else {
                if (targetUnit.getAtkInPrecombat() <= enemyUnit.getAtkInPrecombat() - 1) {
                    targetUnit.addAllSpur(5);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Naga] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (isWeaponTypeBreath(enemyUnit.weaponType)) {
                    targetUnit.battleContext.canCounterattackToAllDistance = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KiriNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                    x.weaponType === WeaponType.Sword || isWeaponTypeBreath(x.weaponType))
                ) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ShikkyuMyurugure] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                if (self.__isAllyCountIsGreaterThanEnemyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            } else {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MizuNoHimatsu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (self.__isAllyCountIsGreaterThanEnemyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MugenNoSyo] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (self.__isNextToOtherUnits(targetUnit)) {
                    enemyUnit.addAllSpur(-4);
                }
            } else {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    enemyUnit.addAllSpur(-4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Syurugu] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
            } else {
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                        let amount = targetUnit.getPositiveStatusEffects().length +
                            targetUnit.getNegativeStatusEffects().length;
                        targetUnit.addAllSpur(amount);
                        if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Rifia] = (targetUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
            } else {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                        let amount = Math.trunc(targetUnit.battleContext.restHp * 0.2);
                        targetUnit.atkSpur += amount;
                        targetUnit.atkSpur += amount;
                    }
                }
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.OgonNoTanken] = (targetUnit) => {
            if (targetUnit.isSpecialCharged) {
                targetUnit.addAllSpur(3);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.OkamijoouNoKiba] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                let amount = Math.min(6, count * 2);
                targetUnit.atkSpur += amount;
                targetUnit.spdSpur += amount;
            } else {
                let isOver75 = enemyUnit.battleContext.restHpPercentage >= 75;
                let isThereThree = self.__isThereAllyInSpecifiedSpaces(targetUnit, 3);
                if (isOver75 || isThereThree) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
                if (isOver75 && isThereThree) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.healedHpByAttack += 7;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GuradoNoSenfu] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.isBuffed || targetUnit.isMobilityIncreased) {
                    targetUnit.spdSpur += 5;
                    targetUnit.defSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FeruniruNoYouran] = (targetUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Saferimuniru] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                if (diff >= 1) {
                    let amount = Math.max(0, Math.min(8, Math.floor(diff * 0.5)));
                    enemyUnit.addSpurs(-amount, 0, -amount, 0);
                }
            } else {
                // <錬成効果>
                let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                if (diff >= 1) {
                    let amount = Math.max(0, Math.min(8, Math.floor(diff * 0.8)));
                    enemyUnit.addSpurs(-amount, -amount, -amount, 0);
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Erudofurimuniru] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                if (diff >= 1) {
                    let amount = Math.max(0, Math.min(8, Math.floor(diff * 0.5)));
                    enemyUnit.addSpurs(-amount, -amount, 0, 0);
                }
            } else {
                // <錬成効果>
                let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                if (diff >= 1) {
                    let amount = Math.max(0, Math.min(8, Math.floor(diff * 0.8)));
                    enemyUnit.addSpurs(-amount, -amount, -amount, 0);
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BoranNoBreath] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                let amount = 0;
                switch (count) {
                    case 0:
                        amount = 6;
                        break;
                    case 1:
                        amount = 4;
                        break;
                    case 2:
                        amount = 2;
                        break;
                }
                targetUnit.addAllSpur(amount);
            } else {
                // <錬成効果>
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                let amount = 0;
                switch (count) {
                    case 0:
                        amount = 7;
                        break;
                    case 1:
                        amount = 5;
                        break;
                    case 2:
                        amount = 3;
                        break;
                }
                targetUnit.addAllSpur(amount);
                if (count <= 1) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        let percentage = Math.max(30 - count * 10, 0);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(percentage / 100.0, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AsuNoSEikishiNoKen] = (targetUnit, enemyUnit) => {
            if (!enemyUnit.isBuffed) {
                enemyUnit.atkSpur += 6;
                enemyUnit.defSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Flykoogeru] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            let hasHigherDefAlly = self.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                x => x.getDefInPrecombat() > targetUnit.getDefInPrecombat());
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (calcPotentialDamage || !hasHigherDefAlly) {
                    targetUnit.addSpurs(6, 6, 0, 0);
                }
            } else {
                // <錬成効果>
                if (calcPotentialDamage || !hasHigherDefAlly || self.__isSolo(targetUnit)) {
                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                    targetUnit.addSpurs(6, 6, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SyuryouNoEijin] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                let atk = false;
                let spd = false;
                let def = false;
                let res = false;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
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
                if (atk) {
                    targetUnit.atkSpur += 5;
                }
                if (spd) {
                    targetUnit.spdSpur += 5;
                }
                if (def) {
                    targetUnit.defSpur += 5;
                }
                if (res) {
                    targetUnit.resSpur += 5;
                }
            } else {
                // <錬成効果>
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                }
                let atk = false;
                let spd = false;
                let def = false;
                let res = false;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3, false)) {
                    if (unit.getAtkInPrecombat() > targetUnit.getAtkInPrecombat() - 4) {
                        atk = true;
                    }
                    if (unit.getSpdInPrecombat() > targetUnit.getSpdInPrecombat() - 4) {
                        spd = true;
                    }
                    if (unit.getDefInPrecombat() > targetUnit.getDefInPrecombat() - 4) {
                        def = true;
                    }
                    if (unit.getResInPrecombat() > targetUnit.getResInPrecombat() - 4) {
                        res = true;
                    }
                }
                if (atk) {
                    targetUnit.atkSpur += 6;
                }
                if (spd) {
                    targetUnit.spdSpur += 6;
                }
                if (def) {
                    targetUnit.defSpur += 6;
                }
                if (res) {
                    targetUnit.resSpur += 6;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        if (enemyUnit.battleContext.restHpPercentage >= 100 && targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.weaponSkillCondSatisfied = true;
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.6, enemyUnit);
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BerukaNoSatsufu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    enemyUnit.atkSpur -= 4;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SarieruNoOkama] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.isBuffed || enemyUnit.isMobilityIncreased) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                // <錬成効果>
                if (enemyUnit.hasPositiveStatusEffect(targetUnit) || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MagetsuNoSaiki] = (targetUnit, enemyUnit) => {
            if (self.isOddTurn || enemyUnit.battleContext.restHpPercentage < 100) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    let amount = Math.trunc(targetUnit.getAtkInPrecombat() * 0.1);
                    enemyUnit.addSpurs(-amount, 0, -amount, 0);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TsubakiNoKinnagitou] = (targetUnit, enemyUnit) => {
            if (targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() - 3) {
                targetUnit.addAllSpur(3);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SyugosyaNoKyofu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 3;
                enemyUnit.defSpur -= 3;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ByakuyaNoRyuuseki] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 3;
                enemyUnit.spdSpur -= 3;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesSpdBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.YumikishiNoMiekyu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 4;
                enemyUnit.defSpur -= 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KishisyogunNoHousou] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.restHpPercentage < 100) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        targetUnit.battleContext.weaponSkillCondSatisfied = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PieriNoSyousou] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage < 100) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Tangurisuni] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.isBuffedInCombat(enemyUnit) || targetUnit.isMobilityIncreased) {
                    targetUnit.addAllSpur(3);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KokukarasuNoSyo] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.getAtkInPrecombat() >= targetUnit.getAtkInPrecombat() + 3) {
                    self.__writeDamageCalcDebugLog("黒鴉の書の効果が発動、敵の攻魔-6、奥義カウント変動量を-1");
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.resSpur -= 6;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ThiamoNoAisou] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 70) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BaraNoYari] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                    enemyUnit.addAtkDefSpurs(-6);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            } else {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addAtkDefSpurs(-5);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AiNoSaiki] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.isBuffed || targetUnit.battleContext.restHpPercentage >= 70) {
                    targetUnit.atkSpur += Math.floor(enemyUnit.getDefInPrecombat() * 0.25);
                    enemyUnit.atkSpur -= Math.floor(enemyUnit.getResInPrecombat() * 0.25);
                }
            } else {
                // <錬成効果>
                if (targetUnit.hasPositiveStatusEffect(enemyUnit) ||
                    targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.addAtkSpdSpurs(Math.floor(enemyUnit.getDefInPrecombat() * 0.25));
                    targetUnit.addAtkDefSpurs(-Math.floor(enemyUnit.getResInPrecombat() * 0.25));
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.battleContext.weaponSkillCondSatisfied = true;
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RazuwarudoNoMaiken] = (targetUnit) => {
            {
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 3, x =>
                    x.buffTotal >= 10);
                if (count >= 2) {
                    targetUnit.atkSpur += 3;
                    targetUnit.defSpur += 3;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ChichiNoSenjutsusyo] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Tenmakoku3] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 7) {
                let resDiff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                let amount = Math.max(0, Math.min(7, Math.floor(resDiff * 0.5)));
                enemyUnit.atkSpur -= amount;
                enemyUnit.defSpur -= amount;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.PegasusFlight4] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 10) {
                let resDiff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                let amount = Math.max(0, Math.min(8, Math.floor(resDiff * 0.8)));
                enemyUnit.atkSpur -= amount;
                enemyUnit.defSpur -= amount;
                let targetAmount = targetUnit.getEvalSpdInPrecombat() + targetUnit.getEvalResInPrecombat();
                let enemyAmount = enemyUnit.getEvalSpdInPrecombat() + enemyUnit.getEvalResInPrecombat();
                if (targetAmount >= enemyAmount + 1) {
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.WyvernFlight3] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 10) {
                let defDiff = targetUnit.getEvalDefInPrecombat() - enemyUnit.getEvalDefInPrecombat();
                let amount = Math.max(0, Math.min(7, Math.floor(defDiff * 0.5)));
                enemyUnit.atkSpur -= amount;
                enemyUnit.defSpur -= amount;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AsameiNoTanken] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!enemyUnit.battleContext.isRestHpFull) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    if (!targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.isVantageActivatable = true;

                    }
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || !enemyUnit.battleContext.isRestHpFull) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (enemyUnit.battleContext.initiatesCombat && !enemyUnit.battleContext.isRestHpFull) {
                    targetUnit.battleContext.isVantageActivatable = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Jikurinde] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                let atk = 0;
                let spd = 0;
                let def = 0;
                let res = 0;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RaikenJikurinde] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.defSpur += 3;
                    targetUnit.resSpur += 3;
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RyukenFalcion] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.addAllSpur(5);
                }
            } else {
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(5);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Vorufuberugu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DevilAxe] = (targetUnit) => {
            targetUnit.addAllSpur(4);
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ZeroNoGyakukyu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SyunsenAiraNoKen] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.2, enemyUnit);
                    }
                }
            }
            else {
                DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KageroNoGenwakushin] = (targetUnit, enemyUnit) => {
            if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Death] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                targetUnit.addAllSpur(4);
            } else {
                // <錬成効果>
                targetUnit.addAllSpur(5);
                let amount = Math.min(targetUnit.maxSpecialCount, 1) + 1;
                enemyUnit.addSpurs(0, -amount, 0, -amount);
                targetUnit.battleContext.invalidateBuffs(false, true, false, true);
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RebbekkaNoRyoukyu] = (targetUnit) => {
            if (targetUnit.isBuffed) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SeisyoNaga] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.invalidateAllBuffs();
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.getEvalResInPrecombat() >= enemyUnit.getEvalResInPrecombat() + 3) {
                    targetUnit.addAllSpur(3);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Forukuvangu] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage <= 80) {
                    targetUnit.atkSpur += 7;
                    targetUnit.defSpur += 7;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KizokutekinaYumi] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.hp > enemyUnit.hp) {
                    targetUnit.addAllSpur(4);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RunaNoEiken] = (targetUnit, enemyUnit) => {
            if (enemyUnit.getAtkInPrecombat() >= targetUnit.getAtkInPrecombat() + 3) {
                targetUnit.addAllSpur(3);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Sekuvaveku] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 4)) {
                    targetUnit.addAllSpur(6);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 4)) {
                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.HikariToYamito] = (targetUnit, enemyUnit) => {
            enemyUnit.addAllSpur(-2);
            targetUnit.battleContext.invalidateAllBuffs();
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LightAndDark2] = (targetUnit, enemyUnit) => {
            enemyUnit.addAllSpur(-5);
            targetUnit.battleContext.invalidateAllBuffs();
            targetUnit.battleContext.invalidateAllOwnDebuffs();
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ShiseiNaga] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                    targetUnit.atkSpur += 6;
                    targetUnit.resSpur += 6;
                }
            } else {
                // <錬成効果>
                if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat() || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                    targetUnit.atkSpur += 6;
                    targetUnit.resSpur += 6;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                        if (isWeaponTypeBreath(enemyUnit.weaponType)) {
                            targetUnit.battleContext.canCounterattackToAllDistance = true;
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FerisiaNoKorizara] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.refersMinOfDefOrRes = true;
            if (targetUnit.isWeaponSpecialRefined) {
                if (isWeaponTypeTome(enemyUnit.weaponType)) {
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.MadoNoYaiba3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let isActivated = false;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 1, false)) {
                    if (isWeaponTypeTome(unit.weaponType)) {
                        isActivated = true;
                        break;
                    }
                }
                if (isActivated) {
                    targetUnit.battleContext.refersMinOfDefOrRes = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoGoka3] = (targetUnit, enemyUnit) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.atkSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoShippu3] = (targetUnit, enemyUnit) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.spdSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoDaichi3] = (targetUnit, enemyUnit) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.defSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoSeisui3] = (targetUnit, enemyUnit) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.resSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GaeBolg] = (targetUnit, enemyUnit) => {
            if (enemyUnit.moveType === MoveType.Armor
                || enemyUnit.moveType === MoveType.Cavalry
                || enemyUnit.moveType === MoveType.Infantry
            ) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                let units = self.enumerateUnitsInTheSameGroupOnMap(targetUnit);
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Ragnarok] = (targetUnit) => {
            if (isWeaponSpecialRefined(targetUnit.weaponRefinement)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                if (targetUnit.battleContext.restHpPercentage <= 80) {
                    targetUnit.atkSpur += 7;
                    targetUnit.spdSpur += 7;
                }
            }
            else {
                if (targetUnit.battleContext.isRestHpFull) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HokenSophia] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.isRestHpFull) {
                    targetUnit.addAllSpur(4);
                }
            }
            else {
                targetUnit.addAllSpur(4);
                if (targetUnit.isWeaponSpecialRefined) {
                    if (!targetUnit.battleContext.isRestHpFull || !enemyUnit.battleContext.isRestHpFull) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.healedHpByAttack += 7;
                    }
                }
            }

        };
        this._applySkillEffectForUnitFuncDict[Weapon.ImbuedKoma] = (targetUnit, enemyUnit) => {
            if (targetUnit.isSpecialCharged) {
                targetUnit.addAllSpur(5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.addNullInvalidatesHealRatios(0.5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Marute] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (!targetUnit.battleContext.initiatesCombat
                    && targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (!targetUnit.battleContext.initiatesCombat
                    || enemyUnit.battleContext.restHpPercentage === 100) {
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.defSpur -= 6;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HarukazeNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if ((!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) ||
                    targetUnit.isBuffed) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            } else {
                // <錬成効果>
                if ((!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) ||
                    targetUnit.hasPositiveStatusEffect()) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.addSpursWithoutAtk(-4);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addSpursWithoutAtk(-4);
                        targetUnit.battleContext.damageReductionValueOfFirstAttacks += 5;
                        targetUnit.battleContext.healedHpAfterCombat += 7;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Mulagir] = (targetUnit, enemyUnit) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Ifingr] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                }
            } else {
                // <錬成効果>
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(6);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateBuffs(false, true, false, true);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BookOfShadows] = (targetUnit, enemyUnit) => {
            if (self.__isNextToOtherUnits(targetUnit)) {
                enemyUnit.addAllSpur(-4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FellBreath] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.restHpPercentage < 100) {
                    targetUnit.atkSpur += 6;
                    targetUnit.resSpur += 6;
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.restHpPercentage < 100 || targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() + 1) {
                    targetUnit.atkSpur += 6;
                    targetUnit.resSpur += 6;
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TaguelFang] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!self.__isNextToOtherUnitsExceptDragonAndBeast(targetUnit)) {
                    targetUnit.addAllSpur(3);
                }
            } else {
                // <錬成効果>
                if (!self.__isNextToOtherUnitsExceptDragonAndBeast(targetUnit)) {
                    targetUnit.addAllSpur(4);
                    if (!isWeaponTypeBreathOrBeast(enemyUnit.weaponType)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.SnowsGrace] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAllSpur(5);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DivineBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let statusPlus = 0;
                let spaces = targetUnit.isWeaponRefined ? 4 : 2;
                for (let allyUnit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
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
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.25, enemyUnit);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdPush3] = (targetUnit) => {
            if (targetUnit.battleContext.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.spdSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefPush3] = (targetUnit) => {
            if (targetUnit.battleContext.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.defSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkResPush3] = (targetUnit) => {
            if (targetUnit.battleContext.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.resSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefPush4] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.defSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkResPush4] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdPush4] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.spdSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.DistantStorm] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.atkSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.DistantPressure] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.spdSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.CloseSalvo] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.atkSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkSpd3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.spdSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkSpd4] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.atkSpur += 9; targetUnit.spdSpur += 10; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkDef3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.defSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkRes3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenDefRes3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.defSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenSpdDef3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.spdSpur += 7; targetUnit.defSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenSpdRes3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.spdSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KurooujiNoYari] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 3;
                enemyUnit.defSpur -= 3;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkDef3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.defSpur -= 3;
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesDefBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkSpd3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.spdSpur -= 3;
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesSpdBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkRes3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.resSpur -= 3;
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesResBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullSpdDef3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.defSpur -= 3;
            targetUnit.battleContext.invalidatesSpdBuff = true;
            targetUnit.battleContext.invalidatesDefBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkDef4] = (targetUnit, enemyUnit) => {
            enemyUnit.addAtkDefSpurs(-4);
            let amount = Math.min(enemyUnit.getPositiveStatusEffects().length, 4);
            enemyUnit.addAtkDefSpurs(-amount);
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesDefBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullSpdDef4] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpdDefSpurs(-4);
            let amount = Math.min(enemyUnit.getPositiveStatusEffects().length, 4);
            enemyUnit.addSpdDefSpurs(-amount);
            targetUnit.battleContext.invalidatesSpdBuff = true;
            targetUnit.battleContext.invalidatesDefBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullSpdRes3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.resSpur -= 3;
            targetUnit.battleContext.invalidatesSpdBuff = true;
            targetUnit.battleContext.invalidatesResBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.BeokuNoKago] = (targetUnit, enemyUnit) => {
            if (enemyUnit.moveType === MoveType.Cavalry || enemyUnit.moveType === MoveType.Flying) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Captain.StormOfBlows] = (targetUnit) => {
            if (targetUnit.isCaptain) {
                targetUnit.battleContext.invalidateAllBuffs();
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.KyokaMukoKinkyori3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.isMeleeWeaponType()) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.KyokaMukoEnkyori3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.isRangedWeaponType()) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpecialFighter3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                targetUnit.battleContext.increaseCooldownCountForDefense = true;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpecialFighter4] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 40) {
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                targetUnit.battleContext.increaseCooldownCountForDefense = true;
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.addNullInvalidatesHealRatios(0.5);
                targetUnit.battleContext.specialDamageRatioToHeal += 0.3;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Cancel1] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage === 100) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Cancel2] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 90) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Cancel3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 80) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Guard4] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 4;
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        };

        {
            let func = (targetUnit) => {
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            };
            this._applySkillEffectForUnitFuncDict[PassiveB.MikiriTsuigeki3] = func;
            this._applySkillEffectForUnitFuncDict[PassiveB.SphiasSoul] = func;
        }
        {
            let func = (targetUnit) => {
                targetUnit.battleContext.damageRatioToHeal += 0.5;
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Absorb] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.AbsorbPlus] = func;
        }
        {
            let func = (targetUnit) => {
                targetUnit.battleContext.healedHpByAttack += 5;
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SeirinNoKenPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.FuyumatsuriNoStickPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ChisanaSeijuPlus] = func;
        }

        {
            let func = (targetUnit) => {
                if (!targetUnit.battleContext.initiatesCombat) {
                    if (targetUnit.battleContext.restHpPercentage <= 75) {
                        targetUnit.battleContext.isVantageActivatable = true;

                    }
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Reipia] = func;
            this._applySkillEffectForUnitFuncDict[PassiveB.Vantage3] = func;
        }

        {
            let func = (targetUnit) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.ShellpointLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.TridentPlus] = func;
        }

        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.defSpur += 5;
                    enemyUnit.defSpur -= 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.DefiersAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SunflowerBowPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.VictorfishPlus] = func;
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 6;
                    targetUnit.spdSpur += 6;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.FairFuryAxe] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.WeddingBellAxe] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.RoseQuartsBow] = func;
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Ragnell] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.Alondite] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SpringyBowPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SpringyAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SpringyLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UpFrontBladePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UpFrontLancePlus] = func;
        }
        {
            let func = (targetUnit) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastSwordPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastSword] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastLance] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastAxe] = func;
        }
        {
            let func = (targetUnit) => {
                if (self.__isSolo(targetUnit)) {
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                    targetUnit.battleContext.invalidatesDefBuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundBlade] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundBladePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundBow] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundBowPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.resSpur -= 5;
                    targetUnit.battleContext.healedHpByAttack += 4;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.UnityBloomsPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.AmityBloomsPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.PactBloomsPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.defSpur -= 6;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SeaSearLance] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.LoyalistAxe] = func;
        }
        {
            let func = (targetUnit) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.ReindeerBowPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CandyCanePlus] = func;
        }
        {
            this._applySkillEffectForUnitFuncDict[Weapon.BladeOfShadow] = (targetUnit, enemyUnit) => {
                if (!targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.spdSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
            };
        }
        {
            let func = (targetUnit) => {
                if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.RauarRabbitPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.BlarRabbitPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.GronnRabbitPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ConchBouquetPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.MelonFloatPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.HiddenThornsPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.OgonNoFolkPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.NinjinhuNoSosyokuPlus] = func;
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x =>
                        x.moveType === MoveType.Flying) >= 2
                    ) {
                        targetUnit.addAllSpur(3);
                    }
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.ShirokiNoTyouken] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ShirokiNoTyokusou] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ShirokiNoTansou] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.addAllSpur(2);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.HisenNoNinjinYariPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.HaruNoYoukyuPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (targetUnit.isWeaponSpecialRefined) {
                    DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.WingSword] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.Romfire] = func;
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.isBuffed) {
                    targetUnit.atkSpur += 4;
                    targetUnit.resSpur += 4;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.UminiUkabuItaPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.NangokuNoKajitsuPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SunahamaNoScopPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SunahamaNoKuwaPlus] = func;
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.battleContext.isRestHpFull) {
                    targetUnit.addAllSpur(2);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SakanaWoTsuitaMori] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SakanaWoTsuitaMoriPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SuikaWariNoKonbo] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SuikaWariNoKonboPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KorigashiNoYumi] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KorigashiNoYumiPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.Kaigara] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KaigaraPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.isRangedWeaponType()) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Kasaburanka] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KasaburankaPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.Grathia] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.GrathiaPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.AoNoPresentBukuro] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.AoNoPresentBukuroPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.MidoriNoPresentBukuro] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.MidoriNoPresentBukuroPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.YamaNoInjaNoSyo] = func;
        }
        {
            let func = (targetUnit) => {
                targetUnit.battleContext.reducesCooldownCount = true;
            };
            this._applySkillEffectForUnitFuncDict[Weapon.KabochaNoOno] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KabochaNoOnoPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KoumoriNoYumi] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KoumoriNoYumiPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KajuNoBottle] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KajuNoBottlePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CancelNoKenPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CancelNoYariPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CancelNoOnoPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CancelNoOno] = func;
        }
    }
    __applySkillEffectForUnitImpl_Optimized(skillId, targetUnit, enemyUnit, calcPotentialDamage) {
        let skillFunc = this._applySkillEffectForUnitFuncDict[skillId];
        if (skillFunc) {
            skillFunc(targetUnit, enemyUnit, calcPotentialDamage);
        }
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
            if (i === units.length) {
                break;
            }

            total += units[i].buffTotal;
        }
        return total;
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

    __applySkillEffectRelatedToEnemyStatusEffects(targetUnit, enemyUnit, _calcPotentialDamage) {
        for (let func of targetUnit.battleContext.applySkillEffectRelatedToEnemyStatusEffectsFuncs) {
            func(targetUnit, enemyUnit, _calcPotentialDamage);
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            // 機先
            this.catchFuncs[skillId]?.(targetUnit, enemyUnit);

            // TODO: 機先以外のスキルも同様に辞書にいれる
            switch (skillId) {
                case PassiveB.KillingIntent:
                case PassiveB.KillingIntentPlus:
                    if (enemyUnit.battleContext.restHpPercentage < 100 || enemyUnit.hasNegativeStatusEffect()) {
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case PassiveB.DeadlyBalancePlus:
                    if (targetUnit.battleContext.restHpPercentage >= 25 || targetUnit.hasNegativeStatusEffect()) {
                        enemyUnit.addSpursWithoutRes(-5);
                        targetUnit.battleContext.reducesCooldownCount = true;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                        targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                    }
                    break;
                case PassiveB.ShisyaNoChojiriwo:
                    if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasNegativeStatusEffect()) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.HurricaneDagger:
                    if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasPositiveStatusEffect(targetUnit)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.Gyorru:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25 || enemyUnit.
                            hasNegativeStatusEffect()) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                        }
                    }
                    break;
                case Weapon.FukenFalcion:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.restHpPercentage < 100
                            || targetUnit.hasPositiveStatusEffect(enemyUnit)
                        ) {
                            targetUnit.addAllSpur(5);
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.defSpur += 5;
                                --enemyUnit.battleContext.followupAttackPriorityDecrement;
                            }
                        }
                    }
                    else {
                        if (targetUnit.battleContext.restHpPercentage < 100) {
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
                case Weapon.SpiritedSwordPlus:
                case Weapon.SpiritedAxePlus:
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
                case Weapon.VoidTome:
                    if (enemyUnit.getAtkInPrecombat() >= 50
                        || enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.WeirdingTome:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.addAllSpur(4);
                        }
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
                            || !targetUnit.battleContext.isRestHpFull
                        ) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case Weapon.MaryuNoBreath:
                    if (targetUnit.hasNegativeStatusEffect() ||
                        !targetUnit.battleContext.isRestHpFull ||
                        (targetUnit.isWeaponRefined && enemyUnit.battleContext.initiatesCombat)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                    }
                    break;
                case Weapon.Fimbulvetr:
                    if (!targetUnit.isWeaponRefined) {
                        // <通常効果>
                        if (targetUnit.battleContext.restHpPercentage < 100 || targetUnit.hasNegativeStatusEffect()) {
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                            targetUnit.addAllSpur(4);
                        }
                    } else {
                        // <錬成効果>
                        if (targetUnit.battleContext.restHpPercentage < 100 ||
                            targetUnit.hasNegativeStatusEffect() ||
                            enemyUnit.battleContext.restHpPercentage >= 75) {
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                            targetUnit.addAllSpur(4);
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            // <特殊錬成効果>
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                targetUnit.addAllSpur(4);

                                let amount;
                                if (enemyUnit.special !== Special.None) {
                                    amount = Math.max(10 - enemyUnit.maxSpecialCount * 2, 2);
                                } else {
                                    amount = 2;
                                }
                                enemyUnit.addAtkResSpurs(-amount);
                            }
                            let pred = ally =>
                                targetUnit.partnerHeroIndex === ally.heroIndex ||
                                ally.partnerHeroIndex === targetUnit.heroIndex;
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3, pred)) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                        }
                    }
                    break;
                case Weapon.RuneAxe:
                    targetUnit.battleContext.healedHpByAttack += 7;
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    break;
                case Weapon.MasyouNoYari:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage < 100
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

    // atk, spd, def, resには適用するステータスなら1をそうでない場合は0を渡す
    __applyCatch3(targetUnit, enemyUnit, atk, spd, def, res) {
        if (enemyUnit.battleContext.restHpPercentage === 100 ||
            enemyUnit.hasNegativeStatusEffect()) {
            targetUnit.addSpurs(5 * atk, 5 * spd, 5 * def, 5 * res);
        }
    }

    // atk, spd, def, resには適用するステータスなら1をそうでない場合は0を渡す
    __applyCatch4(targetUnit, enemyUnit, atk, spd, def, res) {
        if (enemyUnit.battleContext.restHpPercentage === 100 ||
            enemyUnit.hasNegativeStatusEffect()) {
            targetUnit.addSpurs(7 * atk, 7 * spd, 7 * def, 7 * res);

            if (enemyUnit.battleContext.restHpPercentage === 100
                && enemyUnit.hasNegativeStatusEffect()) {
                targetUnit.addSpurs(2 * atk, 2 * spd, 2 * def, 2 * res);
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
                env.setName('周囲の味方からのスキル').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                    .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
                FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.evaluateWithUnit(allyUnit, env);
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
                    func(targetUnit, enemyUnit, allyUnit, calcPotentialDamage);
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
            env.setName('周囲の敵からのスキル').setLogLevel(getSkillLogLevel())
                .setDamageType(damageCalcEnv.damageType).setCombatPhase(this.combatPhase)
                .setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_FOES_INFLICTS_EFFECTS_HOOKS.evaluateWithUnit(enemyAlly, env);

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
        WHEN_APPLIES_EFFECTS_TO_STATS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.evaluateWithUnit(targetUnit, env);
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

    __applyPotent(targetUnit, enemyUnit, baseRatio = 0.4, evalSpd = -25, isFixed = false) {
        if (DamageCalculationUtility.examinesCanFollowupAttack(targetUnit, enemyUnit, evalSpd)) {
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

    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    __applySkillEffectForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, damageCalcEnv) {
        for (let func of targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs) {
            func(targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        }
        let env = new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        env.setName('戦闘中バフ決定後のスキル').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
        targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedNodes.forEach(node => node.evaluate(env));
        WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.evaluateWithUnit(targetUnit, env);

        if (targetUnit.hasStatusEffect(StatusEffectType.BonusDoubler)) {
            if (!targetUnit.hasStatusEffect(StatusEffectType.Ploy)) {
                DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
            }
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.NullFollowUp)) {
            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }

        {
            for (let skillId of targetUnit.enumerateSkills()) {
                let func = getSkillFunc(skillId, applySkillEffectForUnitAfterCombatStatusFixedFuncMap);
                func?.call(this, targetUnit, enemyUnit);
                switch (skillId) {
                    // リーダースキル
                    case Captain.SecretManeuver:
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                        break;
                    // ユニットスキル
                    case Weapon.TeatimeSetPlus:
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                        }
                        break;
                    case Weapon.FairFightBlade:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.DEF, 0.25);
                        }
                        break;
                    case Weapon.RadiantAureola:
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.RES);
                        }
                        break;
                    case Weapon.BaraNoYari:
                        if (targetUnit.isWeaponRefined) {
                            let diff = targetUnit.getEvalAtkInCombat(enemyUnit) - enemyUnit.getEvalAtkInCombat(targetUnit);
                            if (targetUnit.battleContext.restHpPercentage >= 25 || diff > 1) {
                                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                            }
                        }
                        break;
                    case Weapon.TwinDivinestone:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.getEvalResInCombat(enemyUnit) > enemyUnit.getResInCombat(targetUnit)) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                            if (isNormalAttackSpecial(enemyUnit.special)) {
                                if (targetUnit.getEvalResInCombat(enemyUnit) >=
                                    enemyUnit.getEvalResInCombat(targetUnit) + 5) {
                                    enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                                    targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 1;
                                }
                            }
                        }
                        break;
                    case Weapon.RevengerLance:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                let def = targetUnit.getDefInCombat(enemyUnit);
                                targetUnit.battleContext.damageReductionValue += Math.trunc(def * 0.15);
                            }
                        }
                        break;
                    case Weapon.ArcaneDevourer:
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                        break;
                    case Weapon.CaptainsSword:
                        if (targetUnit.battleContext.restHpPercentage >= 25 &&
                            enemyUnit.battleContext.initiatesCombat) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                                targetUnit.battleContext.isVantageActivatable = true;
                            }
                        }
                        break;
                    case Weapon.ArcaneLuin:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >
                                enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                        }
                        break;
                    case Weapon.RevealingBreath:
                        if (enemyUnit.battleContext.initiatesCombat ||
                            enemyUnit.battleContext.restHpPercentage >= 75) {
                            let amount = Math.trunc(targetUnit.getResInCombat(enemyUnit) * 0.3);
                            targetUnit.battleContext.damageReductionValueOfFollowupAttack += amount;
                        }
                        break;
                    case Weapon.ImbuedKoma:
                        if (targetUnit.isWeaponRefined) {
                            if (targetUnit.isSpecialCharged) {
                                let def = targetUnit.getDefInCombat(enemyUnit);
                                targetUnit.battleContext.damageReductionValue += Math.trunc(def * 0.2);
                            }
                        }
                        break;
                    case Weapon.KouketsuNoSensou:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                                this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.ATK);
                            }
                        }
                        break;
                    case Weapon.PetalfallVasePlus:
                    case Weapon.PetalfallBladePlus:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                targetUnit.battleContext.additionalDamage += 5;
                            }
                        }
                        break;
                    case Weapon.DuskbloomBow:
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                            if (diff >= 1) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                            if (diff >= 4) {
                                targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getResInCombat(enemyUnit) * 0.2);
                            }
                            if (diff >= 7) {
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                            }
                        }
                        break;
                    case Weapon.DawnsweetBox: {
                        let diff = targetUnit.getEvalSpdInCombat(enemyUnit) - enemyUnit.getEvalSpdInCombat(targetUnit);
                        if (diff >= -4) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        }
                        if (diff >= 0) {
                            targetUnit.battleContext.healedHpAfterCombat += 7;
                        }
                        if (diff >= 4) {
                            if (DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) === TriangleAdvantage.Advantageous) {
                                if (isNormalAttackSpecial(targetUnit.special)) {
                                    enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                                }
                            }
                        }
                    }
                        break;
                    case Weapon.DreamingSpear:
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.RES);
                        }
                        break;
                    case Weapon.BouryakuNoSenkyu:
                        if (targetUnit.isWeaponRefined) {
                            if (targetUnit.battleContext.initiatesCombat) {
                                let total = targetUnit.buffTotal + Math.abs(enemyUnit.debuffTotal);
                                let percentage = Math.min(total * 3, 60);
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(percentage / 100.0, enemyUnit);
                                if (total >= 10) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.DualityVessel:
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            let def = targetUnit.getDefInCombat(enemyUnit);
                            targetUnit.battleContext.damageReductionValue += Math.trunc(def * 0.2);
                        }
                        break;
                    case Weapon.KeenRabbitFang:
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                        }
                        break;
                    case Weapon.FangOfFinality:
                        if (targetUnit.battleContext.initiatesCombat || this.__isSolo(targetUnit) || calcPotentialDamage) {
                            let count = this.__countAlliesWithinSpecifiedSpaces(enemyUnit, 3) + 1;
                            let spd = targetUnit.getSpdInCombat(enemyUnit);
                            let amount = Math.trunc(spd * (Math.min(count * 10.0, 30.0) / 100.0));
                            targetUnit.battleContext.additionalDamage += amount;
                        }
                        break;
                    case Weapon.AsuraBlades:
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                        }
                        break;
                    case Weapon.PastelPoleaxe:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.DEF);
                        }
                        break;
                    case Weapon.Tangurisuni:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                if (enemyUnit.battleContext.initiatesCombat && isRangedWeaponType(enemyUnit.weaponType)) {
                                    if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                                        targetUnit.battleContext.isVantageActivatable = true;
                                        targetUnit.battleContext.isDefDesperationActivatable = true;
                                    }
                                }
                            }
                        }
                        break;
                    case Weapon.ReginRave:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25 &&
                                targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                            }
                        }
                        break;
                    case PassiveB.BeastAgility3:
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                        break;
                    case Weapon.BoranNoBreath:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                let atk = targetUnit.getEvalAtkInCombat(enemyUnit);
                                let res = enemyUnit.getEvalResInCombat(targetUnit);
                                let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                                if (atk > res) {
                                    let percentage = Math.max(30 - count * 10, 0);
                                    targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc((atk - res) * percentage / 100.0);
                                }
                            }
                        }
                        break;
                    case Weapon.ChaosManifest:
                        if (!targetUnit.isWeaponRefined) {
                            // <通常効果>
                            if (enemyUnit.hasNegativeStatusEffect()) {
                                targetUnit.atkSpur += 6;
                            }
                        } else {
                            // <錬成効果>
                            if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                                targetUnit.addSpurs(6, 0, 0, 5);
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                                let debuffTotal = enemyUnit.debuffTotal;
                                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2)) {
                                    debuffTotal = Math.min(debuffTotal, unit.getDebuffTotal(true));
                                }
                                let ratio = -1 * debuffTotal * 2.0 / 100.0;
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(ratio, enemyUnit);
                            }
                        }
                        break;
                    case Weapon.FloweryScroll:
                        if (targetUnit.getEvalResInCombat(enemyUnit) >= enemyUnit.getEvalResInCombat(targetUnit)) {
                            targetUnit.battleContext.isVantageActivatable = true;
                        }
                        break;
                    case Weapon.RazingBreath:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                                if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                    if (targetUnit.battleContext.initiatesCombat) {
                                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                                    }
                                    if (enemyUnit.battleContext.initiatesCombat) {
                                        enemyUnit.battleContext.followupAttackPriorityDecrement--;
                                    }
                                }
                            }
                        }
                        break;
                    case Weapon.GhostlyLanterns:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.getEvalResInCombat(enemyUnit) >= enemyUnit.getEvalResInCombat(targetUnit) + 5) {
                                enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                            }
                        }
                        break;
                    case Weapon.WarriorsSword:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                        }
                        break;
                    case Weapon.TempestsClaw:
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            targetUnit.battleContext.damageReductionValue += Math.trunc(targetUnit.getEvalDefInCombat(enemyUnit) * 0.15);
                        }
                        break;
                    case Weapon.MoonGradivus:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.DEF);
                            }
                        }
                        break;
                    case Weapon.FirelightLance:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) - 4) {
                                targetUnit.battleContext.reducesCooldownCount = true;
                            }
                        }
                        break;
                    case Weapon.AwokenBreath:
                    case Weapon.WandererBlade:
                        if (enemyUnit.battleContext.restHpPercentage >= 75) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                                targetUnit.battleContext.increaseCooldownCountForBoth();
                            }
                        }
                        break;
                    case Weapon.YonkaiNoSaiki:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat) {
                                if (targetUnit.getEvalSpdInCombat(enemyUnit) >=
                                    enemyUnit.getEvalSpdInCombat(targetUnit) + 10) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.Flykoogeru:
                        if (targetUnit.isWeaponRefined && targetUnit.battleContext.weaponSkillCondSatisfied) {
                            let spd = targetUnit.getEvalSpdInCombat(enemyUnit);
                            targetUnit.battleContext.additionalDamage += Math.trunc(spd * 0.1);
                        }
                        break;
                    case Weapon.DivineBreath:
                        if (targetUnit.isWeaponSpecialRefined && targetUnit.battleContext.weaponSkillCondSatisfied) {
                            let diff = targetUnit.getEvalAtkInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                            let amount = Math.trunc(diff * 0.25);
                            if (amount >= 0) {
                                targetUnit.battleContext.additionalDamageOfFirstAttack += amount;
                            }
                        }
                        break;
                    case Weapon.ShadowyQuill:
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            let damage = targetUnit.getBuffsEnemyDebuffsInCombat(enemyUnit)
                                .reduce((i, a) => i + Math.max(a[0], Math.abs(a[1])), 0);
                            targetUnit.battleContext.additionalDamage += damage;
                        }
                        break;
                    case Weapon.LoftyLeaflet:
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            let amount = Math.trunc(targetUnit.getEvalSpdInCombat(enemyUnit) * 0.15);
                            targetUnit.battleContext.additionalDamage += amount;
                            let buffs = enemyUnit.getBuffsInCombat(targetUnit);
                            targetUnit.addSpurs(...buffs);
                            enemyUnit.addSpurs(...buffs.map(a => -a));
                        }
                        break;
                    case Weapon.TriEdgeLance:
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            let res = enemyUnit.getEvalResInCombat(targetUnit);
                            targetUnit.battleContext.additionalDamage += Math.trunc(res * 0.2);
                        }
                        break;
                    case Weapon.MilasTestament:
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            let amount = Math.trunc(enemyUnit.getEvalAtkInCombat(targetUnit) * 0.1);
                            targetUnit.battleContext.additionalDamage += amount;
                        }
                        break;
                    case Weapon.TaguelFang:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                let diff = targetUnit.getEvalSpdInCombat(enemyUnit) - enemyUnit.getEvalSpdInCombat(targetUnit);
                                if (diff >= 1) {
                                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                                }
                                if (diff >= 5) {
                                    targetUnit.battleContext.additionalDamage += 7;
                                }
                            }
                        }
                        break;
                    case Weapon.WhitecapBowPlus:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.battleContext.initiatesCombat) {
                                if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 10) {
                                    targetUnit.battleContext.attackCount = 2;
                                }
                            }
                        }
                        break;
                    case Weapon.FrozenDelight:
                        if (targetUnit.battleContext.initiatesCombat) {
                            let buff = targetUnit.getBuffTotalInCombat(enemyUnit);
                            let debuff = Math.abs(enemyUnit.getDebuffTotalInCombat());
                            if (buff + debuff >= 12) {
                                targetUnit.battleContext.attackCount = 2;
                            }
                        }
                        break;
                    case Weapon.MoonlightDrop:
                        if (targetUnit.battleContext.initiatesCombat) {
                            let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                            if (5 <= diff && diff <= 14) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            } else if (15 <= diff) {
                                targetUnit.battleContext.setAttackCountFuncs.push(
                                    (targetUnit, enemyUnit) => {
                                        // 攻撃時
                                        targetUnit.battleContext.attackCount = 2;
                                        // 攻撃を受けた時
                                        targetUnit.battleContext.counterattackCount = 2;
                                    }
                                );
                            }
                        }
                        break;
                    case Weapon.KarasuOuNoHashizume:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.isTransformed || enemyUnit.battleContext.restHpPercentage >= 75) {
                                let d = targetUnit.getEvalSpdInCombat(enemyUnit) - enemyUnit.getEvalSpdInCombat(targetUnit);
                                if (d >= 1) {
                                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                                }
                                if (d >= 6) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.FellBreath:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                let diff = targetUnit.getEvalAtkInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                                let amount = Math.max(diff, 0);
                                targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(amount * 0.3);
                            }
                        }
                        break;
                    case Weapon.Saferimuniru:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                                if (diff >= 1) {
                                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                                }
                                if (diff >= 7) {
                                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                                }
                            }
                        }
                        break;
                    case Weapon.Erudofurimuniru:
                        if (targetUnit.isWeaponSpecialRefined) {
                            // <特殊錬成効果>
                            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                                if (targetUnit.getEvalResInCombat(enemyUnit) >= enemyUnit.getEvalResInCombat(targetUnit) + 1) {
                                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                                }
                            }
                        }
                        break;
                    case Weapon.IcyMaltet:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                            }
                        }
                        break;
                    case Weapon.RuinousFrost:
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            let res = enemyUnit.getEvalResInCombat(targetUnit);
                            targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(res * 0.4);
                        }
                        break;
                    case Weapon.ThundersMjolnir:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.battleContext.initiatesCombat &&
                                targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 10) {
                                targetUnit.battleContext.attackCount = 2;
                            }
                        }
                        break;
                    case Weapon.Syurugu:
                        if (targetUnit.isWeaponRefined) {
                            let spd = targetUnit.getEvalSpdInCombat(enemyUnit);
                            if (spd >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1 ||
                                enemyUnit.battleContext.restHpPercentage >= 75) {
                                targetUnit.addSpurs(5, 5, 0, 0);
                                targetUnit.battleContext.additionalDamage += Math.trunc(spd * 0.15);
                            }
                        }
                        break;
                    case Weapon.LargeWarAxe:
                        if (this.globalBattleContext.isOddTurn) {
                            targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(targetUnit.getEvalAtkInCombat(enemyUnit) * 0.15);
                        }
                        break;
                    case Weapon.WindyWarTome:
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                            if (diff >= 5) {
                                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                            }
                        }
                        break;
                    case Weapon.AdroitWarTome:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                            if (diff >= 1) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                            if (diff >= 10) {
                                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                            }
                        }
                        break;
                    case Weapon.QuickMulagir:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 5) {
                                targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(targetUnit.getEvalSpdInCombat(enemyUnit) * 0.15);
                                return true;
                            }
                        }
                        break;
                    case Weapon.CarrotTipBowPlus:
                    case Weapon.CarrotTipSpearPlus:
                        if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                            let amount = Math.abs(enemyUnit.getAtkDebuffInCombat()) + Math.abs(enemyUnit.getDefDebuffInCombat());
                            targetUnit.battleContext.additionalDamageOfFirstAttack += amount;
                        }
                        break;
                    case Weapon.BrightShellEgg:
                        if (targetUnit.hasPositiveStatusEffect(enemyUnit) || enemyUnit.hasNegativeStatusEffect()) {
                            enemyUnit.spdSpur -= 6;
                            enemyUnit.resSpur -= 6;
                            let amount = targetUnit.getBuffTotalInCombat(enemyUnit) + Math.abs(enemyUnit.getDebuffTotalInCombat());
                            if (amount >= 6) {
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                        }
                        break;
                    case Weapon.SellSpellTome:
                        if (targetUnit.battleContext.restHpPercentage >= 25 && targetUnit.dragonflower >= 3) {
                            DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                        }
                        break;
                    case Weapon.BowOfVerdane:
                        if (targetUnit.isWeaponSpecialRefined) {
                            let diff = targetUnit.getEvalSpdInCombat(enemyUnit) - enemyUnit.getEvalSpdInPrecombat(targetUnit);
                            if (diff >= 3) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                            if (diff >= 7) {
                                targetUnit.battleContext.isDesperationActivatable = true;
                            }
                        }
                        break;
                    case Weapon.GousouJikumunto:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                if (enemyUnit.battleContext.initiatesCombat) {
                                    let diff = targetUnit.getEvalAtkInCombat(enemyUnit) - enemyUnit.getEvalAtkInCombat(targetUnit);
                                    if (diff > 0) {
                                        targetUnit.battleContext.counterattackCount = 2;
                                    }
                                }
                            }
                        }
                        break;
                    case Weapon.Rifia:
                        if (targetUnit.isWeaponRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25 &&
                                (targetUnit.battleContext.initiatesCombat ||
                                    targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit))) {
                                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                                targetUnit.battleContext.reducesCooldownCount = true;
                            }
                        }
                        break;
                    case Weapon.PolishedFang:
                        if (enemyUnit.battleContext.restHpPercentage >= 75) {
                            // @TODO: もし頻繁に現れる効果なら__applyFlashingBladeSkillメソッドのようにメソッド化する
                            if (targetUnit.getEvalDefInCombat(enemyUnit) > enemyUnit.getEvalDefInCombat(targetUnit)) {
                                targetUnit.battleContext.increaseCooldownCountForDefense = true;
                            }
                        }
                        break;
                    case Weapon.SparklingFang:
                        if (enemyUnit.battleContext.restHpPercentage >= 75) {
                            DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                        }
                        break;
                    case Weapon.SweetYuleLog:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            let spdDiff = targetUnit.getEvalSpdInCombat() - enemyUnit.getEvalSpdInCombat();
                            if (spdDiff <= 9) {
                                targetUnit.battleContext.isDesperationActivatable = true;
                            } else {
                                targetUnit.battleContext.attackCount = 2;
                            }
                        }
                        break;
                    case Weapon.KazesNeedle:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getEvalSpdInCombat() + 1) {
                                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.RyukenFalcion:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25 && isPhysicalWeaponType(enemyUnit.weaponType)) {
                                if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getEvalSpdInCombat() + 1) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.ShikkyuMyurugure:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                                targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getEvalSpdInCombat() * 0.15);
                            }
                        }
                        break;
                    case Weapon.Misteruthin:
                        if (!targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.increaseCooldownCountForDefense = true;
                        }
                        if (targetUnit.isWeaponRefined) {
                            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                            }
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.spdSpur += 5;
                                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                                }
                            }
                        }
                        break;
                    case Weapon.MermaidBow:
                        if (targetUnit.battleContext.restHpPercentage >= 25 &&
                            targetUnit.battleContext.initiatesCombat) {
                            if (DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) === TriangleAdvantage.Advantageous) {
                                if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getSpdInCombat() + 1) {
                                    targetUnit.battleContext.attackCount = 2;
                                }
                            }
                        }
                        break;
                    case Weapon.PlegianAxePlus:
                    case Weapon.VultureAxePlus:
                    case Weapon.VultureAxe:
                    case Weapon.VultureBladePlus:
                    case Weapon.VultureBlade:
                    case Weapon.VultureLancePlus:
                    case Weapon.VultureLance:
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
                    case Weapon.PlegianTorchPlus:
                        if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.resSpur -= 5;
                            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                            enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                        }
                        break;
                    case Weapon.ShinkenFalcion:
                        DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                        break;
                    case Weapon.FoxkitFang:
                        if (targetUnit.isWeaponSpecialRefined) {
                            // <特殊錬成効果>
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                                let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                                if (diff >= 1) {
                                    targetUnit.battleContext.reducesCooldownCount = true;
                                }
                                if (diff >= 5) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.KentoushiNoGoken:
                        DamageCalculatorWrapper.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                        break;
                    case PassiveB.SealAtk4:
                        if (enemyUnit.atkDebuffTotal < 0) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                        break;
                    case PassiveB.SealSpd4:
                        if (enemyUnit.spdDebuffTotal < 0) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                        break;
                    case PassiveB.SealDef4:
                        if (enemyUnit.defDebuffTotal < 0) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                        break;
                    case PassiveB.SealRes4:
                        if (enemyUnit.resDebuffTotal < 0) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                        break;
                    case PassiveB.SpdPreempt3:
                        if (enemyUnit.battleContext.initiatesCombat && enemyUnit.isRangedWeaponType()) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                                if (!targetUnit.battleContext.isSaviorActivated) {
                                    targetUnit.battleContext.isVantageActivatable = true;
                                }
                            }
                        }
                        break;
                    case PassiveB.AssuredRebirth:
                        if (targetUnit.getEvalResInCombat(enemyUnit) > enemyUnit.getEvalResInCombat(targetUnit)) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                        }
                        break;
                    case PassiveB.FlowFeather3:
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) - 10) {
                                let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                                let amount = Math.trunc(Math.min(7, Math.max(0, diff * 0.70)));
                                targetUnit.battleContext.additionalDamage += amount;
                                targetUnit.battleContext.damageReductionValue += amount;
                            }
                        }
                        break;
                    case PassiveB.FlowFlight3:
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) - 10) {
                                let diff = targetUnit.getEvalDefInCombat(enemyUnit) - enemyUnit.getEvalDefInCombat(targetUnit);
                                let amount = Math.trunc(Math.min(7, Math.max(0, diff * 0.70)));
                                targetUnit.battleContext.additionalDamage += amount;
                                targetUnit.battleContext.damageReductionValue += amount;
                            }
                        }
                        break;
                    case PassiveB.SavvyFighter4:
                        if (enemyUnit.battleContext.initiatesCombat) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >=
                                enemyUnit.getEvalSpdInCombat(targetUnit) - 10) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                            }
                        }
                        break;
                    case PassiveB.SavvyFighter3:
                        if (enemyUnit.battleContext.initiatesCombat) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >=
                                enemyUnit.getEvalSpdInCombat(targetUnit) - 4) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                            }
                        }
                        break;
                    case PassiveB.BoldFighter3:
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        break;
                    case PassiveB.VengefulFighter3:
                        if (!targetUnit.battleContext.initiatesCombat && targetUnit.battleContext.restHpPercentage >= 50) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        break;
                    case PassiveC.WoefulUpheaval: {
                        let atkDiff = targetUnit.getEvalAtkInCombat(enemyUnit) - enemyUnit.getEvalAtkInCombat(targetUnit);
                        let hpDiff = enemyUnit.maxHpWithSkills - enemyUnit.battleContext.restHp;
                        let total = Math.max(atkDiff, 0) + hpDiff;
                        let ratio = Math.min(total * 3.0 / 100.0, 0.3);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(ratio, enemyUnit);
                    }
                        break;
                    case PassiveB.DragonsWrath3:
                        if (enemyUnit.battleContext.initiatesCombat) {
                            let d = Math.max(targetUnit.getEvalAtkInCombat() - enemyUnit.getEvalResInCombat(), 0);
                            targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(d * 0.2);
                        }
                        break;
                    case PassiveB.DragonsWrath4: {
                        let d = Math.max(targetUnit.getEvalAtkInCombat() - enemyUnit.getEvalResInCombat(), 0);
                        targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(d * 0.25);
                    }
                        break;
                    case PassiveC.DomainOfFlame:
                        if (this.__isThereAllyIn2Spaces(targetUnit)) {
                            let d = Math.max(targetUnit.getEvalAtkInCombat() - enemyUnit.getEvalResInCombat(), 0);
                            targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(d * 0.3);
                        }
                        break;
                    case PassiveA.Kyokazohuku3:
                        DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
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
                        DamageCalculatorWrapper.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                        break;
                    case PassiveA.FlashingBlade1:
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
                        DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                        break;
                    case PassiveA.FlashSparrow:
                        if (targetUnit.battleContext.initiatesCombat) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >=
                                enemyUnit.getEvalSpdInCombat(targetUnit) - 5) {
                                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                            }
                        }
                }
            }
        }

        for (let unit of this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.DomainOfFlame: {
                        let d = Math.max(targetUnit.getEvalAtkInCombat() - enemyUnit.getEvalResInCombat(), 0);
                        targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(d * 0.3);
                    }
                        break;
                    case PassiveC.HokoNoGogeki3:
                        if (targetUnit.moveType === MoveType.Infantry) {
                            DamageCalculatorWrapper.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                        }
                        break;
                    case PassiveC.HokoNoJugeki3:
                        if (targetUnit.moveType === MoveType.Infantry) {
                            DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                        }
                        break;
                }
            }
        }
        for (let unit of this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 1, false)) {
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.HokoNoKokyu3:
                        if (targetUnit.moveType === MoveType.Infantry
                            && targetUnit.isPhysicalAttacker()
                        ) {
                            targetUnit.defSpur += 2;
                            targetUnit.resSpur += 2;
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                        }
                        break;
                    case PassiveC.HokoNoMajin3:
                        if (!calcPotentialDamage) {
                            if (targetUnit.moveType === MoveType.Infantry
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
            case Weapon.CarnageAmatsu:
                if (this.__isSolo(defUnit)) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
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
            case Weapon.RiteOfSouls:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                    let res = DamageCalculatorWrapper.__getRes(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(res * 0.2);
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
            case Weapon.FairFuryAxe:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(atkUnit, 2)) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalAtkInCombat() * 0.15);
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


    __examinesCanFollowupAttackForAttacker(atkUnit, defUnit, calcPotentialDamage) {
        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`${atkUnit.getNameWithGroup()}の追撃評価 ------`);
        let followupAttackPriority = this.getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage);
        if (!defUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.DarkSpikesT:
                        if (atkUnit.battleContext.restHpPercentage <= 99) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Jikumunt:
                        if (atkUnit.battleContext.restHpPercentage >= 90) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.SoulCaty:
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.battleContext.restHpPercentage <= 75 && this.canCounterAttack(atkUnit, defUnit)) {
                                ++followupAttackPriority;
                            }
                        }
                        break;
                    case Weapon.RohyouNoKnife:
                        if ((defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) && this.canCounterAttack(atkUnit, defUnit)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.BoldFighter3:
                        ++followupAttackPriority; break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (this.isOddTurn) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (this.isEvenTurn) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.Sashitigae3:
                        if (atkUnit.battleContext.restHpPercentage <= 50 && this.canCounterAttack(atkUnit, defUnit)) {
                            ++followupAttackPriority;
                        }
                        break;
                }
            }
        }

        if (!atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
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
        }

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

    __examinesCanFollowupAttackForDefender(atkUnit, defUnit, calcPotentialDamage) {
        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`${defUnit.getNameWithGroup()}の追撃評価 ------`);
        let followupAttackPriority = this.getFollowupAttackPriorityForBoth(defUnit, atkUnit, calcPotentialDamage);
        if (!atkUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            for (let skillId of [defUnit.passiveB, defUnit.passiveS]) {
                switch (skillId) {
                    case PassiveB.SlickFighter3:
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.BlueLionRule:
                        ++followupAttackPriority;
                        break;
                    case PassiveB.HolyWarsEnd:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.QuickRiposte1:
                        if (defUnit.battleContext.restHpPercentage >= 90) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.QuickRiposte2:
                        if (defUnit.battleContext.restHpPercentage >= 80) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.QuickRiposte3:
                        if (defUnit.battleContext.restHpPercentage >= 70) {
                            // this.writeDebugLogLine("HP" + defUnit.battleContext.restHpPercentage + "%で切り返し発動、" + defUnit.getNameWithGroup() + "は絶対追撃");
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.QuickRiposte4:
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.DragonsIre3:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.VengefulFighter3:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                }
            }
            switch (defUnit.weapon) {
                case Weapon.Marute:
                    if (defUnit.isWeaponRefined) {
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            ++followupAttackPriority;
                        }
                    }
                    else if (defUnit.battleContext.restHpPercentage >= 50) {
                        ++followupAttackPriority;
                    }
                    break;

                case Weapon.Arumazu:
                    if (defUnit.battleContext.restHpPercentage >= 80) {
                        ++followupAttackPriority;
                    }
                    break;
                case Weapon.HuinNoKen:
                case Weapon.MoumokuNoYumi:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                    }
                    break;
            }
        }

        if (!defUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.InstantBowPlus:
                    case Weapon.InstantSwordPlus:
                    case Weapon.InstantLancePlus:
                    case Weapon.InstantAxePlus:
                        --followupAttackPriority;
                        break;
                    case Weapon.Rifia:
                        if (!atkUnit.isWeaponRefined) {
                            if (atkUnit.battleContext.restHpPercentage >= 50) {
                                --followupAttackPriority;
                            }
                        }
                        break;
                    case Weapon.HewnLance:
                        if (atkUnit.isWeaponSpecialRefined) {
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
                        if (atkUnit.groupId === UnitGroupType.Ally) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.AijouNoHanaNoYumiPlus:
                    case Weapon.BukeNoSteckPlus:
                        --followupAttackPriority;
                        break;
                    case PassiveA.KishinKongoNoSyungeki:
                    case PassiveA.KishinMeikyoNoSyungeki:
                    case PassiveA.SteadyImpact:
                    case PassiveA.SwiftImpact:
                        --followupAttackPriority;
                        break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (this.isOddTurn) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (this.isEvenTurn) {
                            --followupAttackPriority;
                        }
                        break;
                }
            }
        }

        if (followupAttackPriority < 0) {
            // 追撃不可を受けた
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
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
                case Weapon.FaithfulBreath:
                    if (atkUnit.battleContext.restHpPercentage >= 40) {
                        if (atkUnit.battleContext.initiatesCombat) {
                            if (DamageCalculationUtility.calcAttackerTriangleAdvantage(atkUnit, defUnit) === TriangleAdvantage.Advantageous ||
                                defUnit.hasNegativeStatusEffect()) {
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

    getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage) {
        let followupAttackPriority = 0;
        if (!defUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            followupAttackPriority += atkUnit.battleContext.followupAttackPriorityIncrement;

            if (DamageCalculatorWrapper.canActivateBreakerSkill(atkUnit, defUnit)) {
                ++followupAttackPriority;
            }

            if (atkUnit.hasStatusEffect(StatusEffectType.FollowUpAttackPlus)) {
                if (atkUnit.battleContext.initiatesCombat) {
                    ++followupAttackPriority;
                }
            }

            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.BlackEagleRule:
                        if (atkUnit.battleContext.restHpPercentage >= 25) {
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
                    case PassiveB.FuinNoTate:
                        if (isWeaponTypeBreath(defUnit.weaponType)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.BindingShield2:
                        if (isWeaponTypeBreath(defUnit.weaponType) || atkUnit.getEvalSpdInCombat() >= defUnit.getEvalSpdInCombat() + 5) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.TsuigekiRing:
                        if (atkUnit.battleContext.restHpPercentage >= 50) {
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
                            if (atkUnit.hasPositiveStatusEffect(defUnit)) {
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
                    case Weapon.ReginRave:
                        if (!atkUnit.isWeaponRefined) {
                            if (atkUnit.getAtkInCombat(defUnit) > defUnit.getAtkInCombat(atkUnit) || atkUnit.isMobilityIncreased) {
                                ++followupAttackPriority;
                            }
                        }
                        break;
                    case Weapon.FlameSiegmund:
                        if (!atkUnit.isWeaponRefined) {
                            if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, calcPotentialDamage)) {
                                ++followupAttackPriority;
                            }
                        }
                        break;
                    case Weapon.Gyorru:
                        if (defUnit.hasNegativeStatusEffect()) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.ChaosManifest:
                        if (!atkUnit.isWeaponRefined) {
                            // <通常効果>
                            if (defUnit.hasNegativeStatusEffect()) {
                                ++followupAttackPriority;
                            }
                        }
                        break;
                }
            }
        }

        if (!atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            followupAttackPriority += atkUnit.battleContext.followupAttackPriorityDecrement;

            if (defUnit.hasStatusEffect(StatusEffectType.FollowUpAttackMinus)) {
                --followupAttackPriority;
            }

            if (defUnit.hasStatusEffect(StatusEffectType.ResonantShield) && defUnit.isOneTimeActionActivatedForShieldEffect === false) {
                --followupAttackPriority;
            }
            if (atkUnit.passiveB === PassiveB.WaryFighter3 && atkUnit.battleContext.restHpPercentage >= 50) {
                --followupAttackPriority;
            }
            if (DamageCalculatorWrapper.canActivateBreakerSkill(defUnit, atkUnit)) {
                --followupAttackPriority;
            }

            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.Marute:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (!defUnit.battleContext.initiatesCombat
                                || atkUnit.battleContext.restHpPercentage === 100) {
                                --followupAttackPriority;
                            }
                        }

                        break;
                    case Weapon.TenraiArumazu:
                        if (!defUnit.isWeaponRefined) {
                            if (this.__isAllyCountIsGreaterThanEnemyCount(defUnit, atkUnit, calcPotentialDamage)) {
                                --followupAttackPriority;
                            }
                        } else {
                            if (this.__isThereAllyInSpecifiedSpaces(defUnit, 3)) {
                                --followupAttackPriority;
                            }
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
                    case Weapon.SarieruNoOkama:
                        if (!atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.isBuffed || atkUnit.isMobilityIncreased) {
                                --followupAttackPriority;
                            }
                        }
                        break;
                    case Weapon.FellBreath:
                        if (defUnit.isWeaponRefined) break;
                        if (atkUnit.battleContext.restHpPercentage < 100) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.ShinenNoBreath:
                        if (defUnit.getDefInCombat(atkUnit) >= atkUnit.getDefInCombat(defUnit) + 5) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveB.WaryFighter3:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveB.FuinNoTate:
                        if (isWeaponTypeBreath(atkUnit.weaponType)) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveB.BindingShield2:
                        if (isWeaponTypeBreath(atkUnit.weaponType) || defUnit.getEvalSpdInCombat() >= atkUnit.getEvalSpdInCombat() + 5) {
                            --followupAttackPriority;
                        }
                        break;
                }
            }
        }
        return followupAttackPriority;
    }

    /// 殺しスキルを発動できるならtrue、そうでなければfalseを返します。
    static canActivateBreakerSkill(breakerUnit, targetUnit) {
        // 殺し3の評価
        if (breakerUnit.battleContext.restHpPercentage < 50) { return false; }

        return targetUnit.weaponType === getBreakerSkillTargetWeaponType(breakerUnit.passiveB);
    }


    __applyDamageReductionRatioBySpecial(defUnit, atkUnit) {
        let attackRange = atkUnit.getActualAttackRange(defUnit);
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

    /// 追撃可能かどうかが条件として必要なスキル効果の適用
    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @private
     */
    __applySkillEffectRelatedToFollowupAttackPossibility(targetUnit, enemyUnit, damageCalcEnv) {
        let env =
            new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        env.setName('追撃判定後').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
        AFTER_FOLLOW_UP_CONFIGURED_HOOKS.evaluateWithUnit(targetUnit, env);
    }
    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {Boolean} calcPotentialDamage
     */
    __applyInvalidationSkillEffect(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let func of targetUnit.battleContext.applyInvalidationSkillEffectFuncs) {
            func(targetUnit, enemyUnit, calcPotentialDamage);
        }
        // 獣の共通武器スキル
        switch (BEAST_COMMON_SKILL_MAP.get(targetUnit.weapon)) {
            case Weapon.TeatimesEdge:
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
                break;
            case PassiveB.BindingNecklacePlus:
                if (enemyUnit.battleContext.initiatesCombat ||
                    this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
                break;
            case Weapon.KishisyogunNoHousou:
                if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
                break;
            case BeastCommonSkillType.Infantry2:
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.invalidateCooldownCountSkills();
                }
                break;
            case BeastCommonSkillType.Infantry2IfRefined:
                if (!targetUnit.isWeaponRefined) break;
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.invalidateCooldownCountSkills();
                }
                break;
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.GetBehindMe:
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.FairFightBlade:
                    if (targetUnit.battleContext.restHpPercentage >= 25 &&
                        enemyUnit.battleContext.initiatesCombat) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.DesertTigerAxe:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.PartnershipBow:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let count = enemyUnit.getPositiveStatusEffects().length + enemyUnit.getNegativeStatusEffects().length;
                        if (count > 0) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.SyugosyaNoRekkyu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.VassalSaintSteel:
                    if (targetUnit.battleContext.restHpPercentage >= 25 &&
                        targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 5) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.RevengerLance:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.AiNoSaiki:
                    if (targetUnit.isWeaponSpecialRefined &&
                        targetUnit.battleContext.weaponSkillCondSatisfied) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                    }
                    break;
                case Weapon.SacrificeStaff:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case PassiveB.FruitOfLife:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        if (targetUnit.battleContext.passiveBSkillCondSatisfied) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.TotalWarTome:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2)) {
                            if (unit.debuffTotal < 0) {
                                enemyUnit.battleContext.reducesCooldownCount = false;
                                break;
                            }
                        }
                    }
                    break;
                case Weapon.BowOfRepose:
                    if (targetUnit.battleContext.restHpPercentage <= 99) {
                        let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                        if (dist >= 2) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.MasterBow:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.GuidesHourglass:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                    }
                    break;
                case Special.Enclosure:
                    enemyUnit.battleContext.reducesCooldownCount = false;
                    break;
                case Weapon.SyuryouNoEijin:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.ZekkaiNoSoukyu:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.WindParthia:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                            }
                        }
                    }
                    break;
                case Weapon.LunaArc:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.MilasTestament:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.AnkokuNoKen:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.restHpPercentage >= 75) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.MaryuHuinNoKen:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.ThundersMjolnir:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.battleContext.invalidateCooldownCountSkills();
                    }
                    break;
                case Weapon.FiremansHook:
                    if (targetUnit.battleContext.initiatesCombat || this.__isSolo(targetUnit) || calcPotentialDamage) {
                        targetUnit.battleContext.invalidatesReduceCooldownCount = true;
                    }
                    break;
                case Weapon.SpendyScimitar:
                    if (targetUnit.battleContext.initiatesCombat && targetUnit.dragonflower >= 2) {
                        targetUnit.battleContext.invalidateCooldownCountSkills();
                    }
                    break;
                case Weapon.WhirlingGrace:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getSpdInCombat() + 1) {
                            targetUnit.battleContext.invalidatesReduceCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.SyunsenAiraNoKen:
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.battleContext.invalidateCooldownCountSkills();
                    }
                    break;
                case Weapon.TenteiNoKen:
                    targetUnit.battleContext.invalidateCooldownCountSkills();
                    break;
                case Special.SiriusPlus:
                    enemyUnit.battleContext.reducesCooldownCount = false;
                    break;
                case PassiveB.Velocity3:
                case PassiveB.AtkResTempo3:
                case PassiveB.SpdDefTempo3:
                case PassiveB.SpdResTempo3:
                    targetUnit.battleContext.invalidateCooldownCountSkills();
                    break;
                case PassiveB.SolarBrace2:
                case PassiveB.MoonlightBangle:
                case PassiveB.MoonlitBangleF:
                    targetUnit.battleContext.invalidatesReduceCooldownCount = true;
                    break;
                case PassiveC.FaithInHumanity: {
                    let count = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                        if (!isWeaponTypeBreathOrBeast(unit.weaponType) && unit.buffTotal >= 10) {
                            count++
                        }
                    }
                    if (count >= 2) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                    }
                    break;
                }
            }
        }
    }

    __init__applySpecialSkillEffect() {
        this._applySpecialSkillEffectFuncDict[Special.Taiyo] = (targetUnit) => {
            targetUnit.battleContext.specialDamageRatioToHeal = 0.5;
        };
        {
            let func = (targetUnit) => {
                targetUnit.battleContext.specialDamageRatioToHeal = 0.3;
            };
            this._applySpecialSkillEffectFuncDict[Special.Youkage] = func;
            this._applySpecialSkillEffectFuncDict[Special.Yuyo] = func;
        }
        {
            let func = (targetUnit) => {
                // 月虹
                targetUnit.battleContext.specialSufferPercentage = 30;
            };

            this._applySpecialSkillEffectFuncDict[Special.Kagetsuki] = func;
            this._applySpecialSkillEffectFuncDict[Special.Moonbow] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.Luna] = (targetUnit) => {
            // 月光
            targetUnit.battleContext.specialSufferPercentage = 50;
        };
        this._applySpecialSkillEffectFuncDict[Special.KuroNoGekko] = (targetUnit) => {
            targetUnit.battleContext.specialSufferPercentage = 80;
        };
        this._applySpecialSkillEffectFuncDict[Special.Lethality] = (targetUnit) => {
            targetUnit.battleContext.specialSufferPercentage = 75;
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        };
        {
            let func = (targetUnit) => {
                // 天空
                targetUnit.battleContext.specialSufferPercentage = 50;
                targetUnit.battleContext.specialDamageRatioToHeal = 0.5;
            };
            this._applySpecialSkillEffectFuncDict[Special.Aether] = func;
            this._applySpecialSkillEffectFuncDict[Special.AoNoTenku] = func;
            this._applySpecialSkillEffectFuncDict[Special.RadiantAether2] = func;
            this._applySpecialSkillEffectFuncDict[Special.MayhemAether] = func;
        }


        this._applySpecialSkillEffectFuncDict[Special.LunaFlash] = (targetUnit, enemyUnit) => {
            {
                // 月光閃
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.2));
                targetUnit.battleContext.specialSufferPercentage = 20;
            }
        };

        this._applySpecialSkillEffectFuncDict[Special.LunarFlash2] = (targetUnit, enemyUnit) => {
            {
                // 月光閃・承
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.2));
                targetUnit.battleContext.specialSufferPercentage = 20;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        };

        {
            let func = (targetUnit) => {
                // 凶星
                targetUnit.battleContext.specialMultDamage = 1.5;
            };
            this._applySpecialSkillEffectFuncDict[Special.Hoshikage] = func;
            this._applySpecialSkillEffectFuncDict[Special.Glimmer] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.Deadeye] = (targetUnit) => {
            targetUnit.battleContext.specialMultDamage = 2;
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        };
        this._applySpecialSkillEffectFuncDict[Special.Astra] = (targetUnit) => {
            // 流星
            targetUnit.battleContext.specialMultDamage = 2.5;
        };

        this._applySpecialSkillEffectFuncDict[Special.DragonBlast] = (targetUnit, enemyUnit) => {
            // 神竜破
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.5));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.ArmoredFloe] = (targetUnit, enemyUnit) => {
            // 重装の聖氷
            {
                let totalRes = targetUnit.getResInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.4));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.ArmoredBeacon] = (targetUnit, enemyUnit) => {
            // 重装の聖炎
            {
                let totalDef = targetUnit.getDefInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalDef * 0.4));
            }
        };

        {
            let func = (targetUnit, enemyUnit) => {
                // 緋炎
                {
                    let totalDef = targetUnit.getDefInCombat(enemyUnit);
                    targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalDef * 0.5));
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.Hotarubi] = func;
            this._applySpecialSkillEffectFuncDict[Special.Bonfire] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.Ignis] = (targetUnit, enemyUnit) => {
            // 華炎
            {
                let totalDef = targetUnit.getDefInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalDef * 0.8));
            }
        };

        {
            let func = (targetUnit, enemyUnit) => {
                // 氷蒼
                {
                    let totalRes = targetUnit.getResInCombat(enemyUnit);
                    targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.5));
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.Hyouten] = func;
            this._applySpecialSkillEffectFuncDict[Special.Iceberg] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.Glacies] = (targetUnit, enemyUnit) => {
            // 氷華
            {
                let totalRes = targetUnit.getResInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.8));
            }
        };

        this._applySpecialSkillEffectFuncDict[Special.CircletOfBalance] = (targetUnit, enemyUnit) => {
            // 聖神と暗黒神の冠
            let totalRes = targetUnit.getResInCombat(enemyUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.4));
            targetUnit.battleContext.canActivateNonSpecialOneTimePerMapMiracleFuncs.push((defUnit, atkUnit) => {
                let isSpecialCharged = defUnit.isSpecialCharged || atkUnit.isSpecialCharged;
                let hasSpecialActivated = defUnit.battleContext.hasSpecialActivated || atkUnit.battleContext.hasSpecialActivated;
                let condA = isSpecialCharged || hasSpecialActivated;
                let condB = defUnit.battleContext.initiatesCombat || isRangedWeaponType(atkUnit.weaponType);
                // 1回発動したかどうかはコンテキストかユニットの両方を見る必要がある
                // ユニットが保持する値はリアルタイムに保持されずにDamageTypeがActualDamageの時に戦闘後にユニットにコピーされる
                let hasOncePerMapSpecialActivated =
                    defUnit.hasOncePerMapSpecialActivated ||
                    defUnit.battleContext.hasOncePerMapSpecialActivated;
                let condSatisfied = condA || condB;
                return condSatisfied && !hasOncePerMapSpecialActivated;
            });
        }

        this._applySpecialSkillEffectFuncDict[Special.HolyKnightAura] = (targetUnit, enemyUnit) => {
            // グランベルの聖騎士
            {
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalAtk * 0.25));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.ChivalricAura] = (targetUnit, enemyUnit) => {
            // グランベルの騎士道
            {
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalAtk * 0.25));
            }
        };

        {
            let func = (targetUnit, enemyUnit) => {
                // 竜裂
                {
                    let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                    targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalAtk * 0.3));
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.Fukuryu] = func;
            this._applySpecialSkillEffectFuncDict[Special.DraconicAura] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.DragonFang] = (targetUnit, enemyUnit) => {
            {
                // 竜穿
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalAtk * 0.5));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.Enclosure] = (targetUnit, enemyUnit) => {
            {
                // 閉界
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalAtk * 0.25));
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.ShiningEmblem] = (targetUnit, enemyUnit) => {
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.35));
            }
        };
        {
            let func = (targetUnit, enemyUnit) => {
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.3));
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.HonoNoMonsyo] = func;
            this._applySpecialSkillEffectFuncDict[Special.HerosBlood] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.RighteousWind] = (targetUnit, enemyUnit) => {
            // 聖風
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.3));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.Sirius] = (targetUnit, enemyUnit) => {
            // 天狼
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.3));
                targetUnit.battleContext.specialDamageRatioToHeal = 0.3;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.SiriusPlus] = (targetUnit, enemyUnit) => {
            // 天狼+
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.35));
                targetUnit.battleContext.specialDamageRatioToHeal = 0.35;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.TwinBlades] = (targetUnit, enemyUnit) => {
            // 双刃
            {
                let totalRes = targetUnit.getResInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.4));
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.RupturedSky] = (targetUnit, enemyUnit) => {
            if (isWeaponTypeBeast(enemyUnit.weaponType) || isWeaponTypeBreath(enemyUnit.weaponType)) {
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(enemyUnit.getAtkInCombat(targetUnit) * 0.4));
            }
            else {
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(enemyUnit.getAtkInCombat(targetUnit) * 0.2));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.SublimeHeaven] = (targetUnit, enemyUnit) => {
            let isDragonOrBeast = isWeaponTypeBreath(enemyUnit.weaponType) || isWeaponTypeBeast(enemyUnit.weaponType);
            let ratio = isDragonOrBeast ? 0.5 : 0.25;
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(targetUnit.getAtkInCombat(enemyUnit) * ratio));
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        };

        this._applySpecialSkillEffectFuncDict[Special.DevinePulse] = (targetUnit, enemyUnit) => {
            {
                // 天刻の拍動
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.25));
            }
        }

        this._applySpecialSkillEffectFuncDict[Special.VitalAstra] = (targetUnit, enemyUnit) => {
            let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.3));
        };
        {
            let func = (targetUnit, enemyUnit) => {
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.4));
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.RegnalAstra] = func;
            this._applySpecialSkillEffectFuncDict[Special.ImperialAstra] = func;
            this._applySpecialSkillEffectFuncDict[Special.SupremeAstra] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.OpenTheFuture] = (targetUnit, enemyUnit) => {
            {
                let totalDef = targetUnit.getDefInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalDef * 0.5));
                targetUnit.battleContext.specialDamageRatioToHeal = 0.25;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.BlueFrame] = (targetUnit) => {
            targetUnit.battleContext.addSpecialAddDamage(10);
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.addSpecialAddDamage(15);
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.BrutalShell] = (targetUnit) => {
            targetUnit.battleContext.specialSufferPercentage = 50;
        }
        this._applySpecialSkillEffectFuncDict[Special.SeidrShell] = (targetUnit) => {
            targetUnit.battleContext.addSpecialAddDamage(15);
        };
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     */
    __applySpecialSkillEffect(targetUnit, enemyUnit, damageCalcEnv) {
        let env =
            new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, false);
        env.setName('戦闘開始時奥義効果').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
        WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.evaluateWithUnit(targetUnit, env);
        let func = this._applySpecialSkillEffectFuncDict[targetUnit.special];
        if (func) {
            func(targetUnit, enemyUnit);
        }
    }

    __setSkillEffetToContext(atkUnit, defUnit) {
        this.__setBothOfAtkDefSkillEffetToContext(atkUnit, defUnit);
        this.__setBothOfAtkDefSkillEffetToContext(defUnit, atkUnit);
        this.__setBothOfAtkDefSkillEffetToContextForEnemyUnit(atkUnit, defUnit);
        this.__setBothOfAtkDefSkillEffetToContextForEnemyUnit(defUnit, atkUnit);

        let canAtkUnitDisableAttackPrioritySkills =
            atkUnit.canDisableAttackOrderSwapSkill(atkUnit.battleContext.restHpPercentage, defUnit) ||
            atkUnit.battleContext.canUnitDisableSkillsThatChangeAttackPriority;
        let canDefUnitDisableAttackPrioritySkills =
            defUnit.canDisableAttackOrderSwapSkill(defUnit.battleContext.restHpPercentage, atkUnit) ||
            defUnit.battleContext.canUnitDisableSkillsThatChangeAttackPriority;
        if (!canAtkUnitDisableAttackPrioritySkills &&
            !canDefUnitDisableAttackPrioritySkills) {
            atkUnit.battleContext.isDesperationActivated = atkUnit.battleContext.isDesperationActivatable || atkUnit.hasStatusEffect(StatusEffectType.Desperation);
            defUnit.battleContext.isVantageActivated = defUnit.battleContext.isVantageActivatable || defUnit.hasStatusEffect(StatusEffectType.Vantage);

            defUnit.battleContext.isDefDesperationActivated = defUnit.battleContext.isDefDesperationActivatable;

            if (this.isLogEnabled) {
                if (defUnit.battleContext.isDefDesperationActivated) {
                    this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "は攻撃の直後に追撃");
                }
                if (atkUnit.battleContext.isDesperationActivated) {
                    this.__writeDamageCalcDebugLog(atkUnit.getNameWithGroup() + "は攻め立て効果発動、攻撃の直後に追撃");
                }
                if (defUnit.battleContext.isVantageActivated) {
                    this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "は待ち伏せ効果発動、先制攻撃");
                }
            }
        } else {
            atkUnit.battleContext.isDesperationActivated = false;
            defUnit.battleContext.isVantageActivated = false;
        }
    }

    __setBothOfAtkDefSkillEffetToContext(targetUnit, enemyUnit) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.SparklingSun:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        if (enemyUnit.battleContext.canFollowupAttackIncludingPotent()) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(75 / 100.0, enemyUnit);
                        }
                    }
                    break;
                case Weapon.MagetsuNoSaiki:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.isOddTurn || enemyUnit.battleContext.restHpPercentage < 100) {
                            let percentage = enemyUnit.battleContext.canFollowupAttackIncludingPotent() ? 60 : 30;
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(percentage / 100.0, enemyUnit);
                        }
                    }
                    break;
                case Weapon.StarlightStone:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        if (enemyUnit.battleContext.canFollowupAttackIncludingPotent()) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(75 / 100.0, enemyUnit);
                        }
                    }
                    break;
                case Weapon.MaryuNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            if (enemyUnit.battleContext.canFollowupAttackIncludingPotent()) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.70, enemyUnit);
                            }
                        }
                    }
                    break;
                case Weapon.SeaSearLance:
                case Weapon.LoyalistAxe:
                    if ((enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) &&
                        enemyUnit.battleContext.canFollowupAttackIncludingPotent()) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.75, enemyUnit);
                    }
                    break;
                case Weapon.StoutLancePlus:
                case Weapon.StoutAxePlus:
                case Weapon.CourtlyMaskPlus:
                case Weapon.CourtlyBowPlus:
                case Weapon.CourtlyCandlePlus:
                    if (targetUnit.battleContext.restHpPercentage >= 50 &&
                        enemyUnit.battleContext.canFollowupAttackIncludingPotent()) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
                    }
                    break;
                case Weapon.Urvan:
                    {
                        targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                        if (targetUnit.isWeaponSpecialRefined) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                        }
                    }
                    break;
                case PassiveB.BlackEagleRule:
                    if (!targetUnit.battleContext.initiatesCombat && targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.8, enemyUnit);
                    }
                    break;
                case PassiveB.SeikishiNoKago:
                    if (isRangedWeaponType(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                    }
                    break;
                case PassiveS.RengekiBogyoKenYariOno3:
                    if (enemyUnit.weaponType === WeaponType.Sword ||
                        enemyUnit.weaponType === WeaponType.Lance ||
                        enemyUnit.weaponType === WeaponType.Axe) {
                        targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                    }
                    break;
                case PassiveS.RengekiBogyoYumiAnki3:
                    if (isWeaponTypeBow(enemyUnit.weaponType) ||
                        isWeaponTypeDagger(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                    }
                    break;
                case PassiveS.RengekiBogyoMado3:
                    if (isWeaponTypeTome(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                    }
                    break;
            }
        }
    }

    __setBothOfAtkDefSkillEffetToContextForEnemyUnit(atkUnit, defUnit) {
        if (atkUnit.hasPassiveSkill(PassiveB.Cancel3)) {
            if (atkUnit.battleContext.restHpPercentage >= 80) {
                defUnit.battleContext.cooldownCount = 1;
            }
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
    __addSelfSpurInRange2(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
            switch (skillId) {
                default:
                    break;
            }
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
