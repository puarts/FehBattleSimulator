
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
     * @param  {Unit} atkUnit
     * @param  {Tile} tileToAttack
     */
    constructor(atkUnit, tileToAttack, tileChangedFunc = null) {
        this._origTile = atkUnit.placedTile;
        this._atkUnit = atkUnit;
        let isTileChanged = tileToAttack !== this._origTile;
        if (tileToAttack !== null && isTileChanged) {
            tileToAttack.setUnit(atkUnit);
            if (tileChangedFunc !== null) {
                tileChangedFunc();
            }
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
        this._damageCalc = new DamageCalculator(logger);
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
        /** @type {Object.<string, skillEffectFuncWithPotentialDamage} */
        this._applySkillEffectForAtkUnitFuncDict = {};
        /** @type {Object.<string, skillEffectFuncWithPotentialDamage} */
        this._applySkillEffectForDefUnitFuncDict = {};
        /** @type {Object.<string, skillEffectFuncWithPotentialDamage} */
        this._applySkillEffectForUnitFuncDict = {};
        /** @type {Object.<string, skillEffectFunc} */
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
     * @returns {DamageCalcResult}
     */
    updateDamageCalculation(atkUnit, defUnit, tileToAttack = null, gameMode = GameMode.Arena) {
        // 攻撃対象以外の戦闘前の範囲奥義ダメージ
        let precombatDamages = new Map();
        this.__applySkillEffectsBeforePrecombat(atkUnit, defUnit);
        this.__applySkillEffectsBeforePrecombat(defUnit, atkUnit);
        if (atkUnit.canActivatePrecombatSpecial() &&
            !atkUnit.battleContext.cannotTriggerPrecombatSpecial) {
            // 範囲攻撃ダメージを周囲の敵に反映
            for (let tile of this.map.enumerateRangedSpecialTiles(defUnit.placedTile, atkUnit.special)) {
                if (tile.placedUnit != null
                    && tile.placedUnit != defUnit
                    && tile.placedUnit.groupId == defUnit.groupId
                ) {
                    let targetUnit = tile.placedUnit;
                    let damage = this.calcPrecombatSpecialDamage(atkUnit, targetUnit);
                    precombatDamages.set(targetUnit, damage);
                    this.writeLog(`${atkUnit.specialInfo.name}により${targetUnit.getNameWithGroup()}に${damage}ダメージ`);
                    targetUnit.takeDamage(damage, true);
                }
            }
            if (precombatDamages.size > 0) {
                let damageLog = '';
                for (let [unit, damage] of precombatDamages) {
                    damageLog += `${unit.name}に${damage}、`;
                }
                this._damageCalc.writeSimpleLog(`${atkUnit.specialInfo.name}により周囲の${damageLog.slice(0, -1)}のダメージ`);
            }
        }

        // 戦闘ダメージ計算
        let result = this.calcDamage(atkUnit, defUnit, tileToAttack, DamageType.ActualDamage, gameMode);

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

        if (defUnit != result.defUnit) {
            // 護り手で一時的に戦闘対象が入れ替わっていたので元に戻す
            let saverUnit = result.defUnit;
            if (!saverUnit.isDead) {
                saverUnit.restoreOriginalTile();
            }
            defUnit.restoreOriginalTile();
        }

        return result;
    }



    /**
     *  一時的に戦闘のダメージを計算します。
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Tile} tileToAttack=null
     * @param  {boolean} calcPotentialDamage=false
     * @param  {Number} gameMode=GameMode.Arena
     * @returns {DamageCalcResult}
     */
    calcDamageTemporary(
        atkUnit,
        defUnit,
        tileToAttack = null,
        damageType = DamageType.EstimatedDamage,
        gameMode = GameMode.Arena
    ) {
        let result = this.calcDamage(atkUnit, defUnit, tileToAttack, damageType, gameMode);
        if (defUnit != result.defUnit) {
            // 護り手で一時的に戦闘対象が入れ替わっていたので元に戻す
            let saverUnit = result.defUnit;
            let tile = saverUnit.placedTile;
            saverUnit.restoreOriginalTile();
            tile.setUnit(defUnit);
        }

        return result;
    }

    /**
     * 戦闘のダメージを計算します。
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Tile} tileToAttack=null
     * @param  {DamageType} damageType=DamageType.ActualDamage
     * @param  {Number} gameMode=GameMode.Arena
     * @returns {DamageCalcResult}
     */
    calcDamage(
        atkUnit,
        defUnit,
        tileToAttack = null,
        damageType = DamageType.ActualDamage,
        gameMode = GameMode.Arena
    ) {
        let calcPotentialDamage = damageType === DamageType.PotentialDamage;
        let self = this;
        let result;
        using(new ScopedTileChanger(atkUnit, tileToAttack, () => {
            self.updateUnitSpur(atkUnit, calcPotentialDamage, defUnit);
            self.updateUnitSpur(defUnit, calcPotentialDamage, atkUnit);
        }), () => {
            atkUnit.initBattleContext(true);
            defUnit.initBattleContext(false);

            this.__applySkillEffectsBeforePrecombat(atkUnit, defUnit);
            this.__applySkillEffectsBeforePrecombat(defUnit, atkUnit);

            // 戦闘前奥義の計算に影響するマップ関連の設定
            {
                atkUnit.battleContext.isOnDefensiveTile = atkUnit.isOnMap && atkUnit.placedTile.isDefensiveTile && !atkUnit.battleContext.invalidatesDefensiveTerrainEffect;
                defUnit.battleContext.isOnDefensiveTile = defUnit.isOnMap && defUnit.placedTile.isDefensiveTile && !defUnit.battleContext.invalidatesDefensiveTerrainEffect;
            }

            atkUnit.saveCurrentHpAndSpecialCount();
            defUnit.saveCurrentHpAndSpecialCount();

            // 戦闘前ダメージ計算
            let preCombatDamage = 0;
            let preCombatDamageWithOverkill = 0;

            if (!calcPotentialDamage &&
                atkUnit.canActivatePrecombatSpecial() &&
                !atkUnit.battleContext.cannotTriggerPrecombatSpecial
            ) {
                [preCombatDamage, preCombatDamageWithOverkill] = self.calcPrecombatSpecialResult(atkUnit, defUnit);
                // NOTE: 護り手が範囲にいる場合は護り手に対してダメージを計算しないといけないのでここではまだatkUnitのPrecombatStateはクリアしない
                defUnit.battleContext.clearPrecombatState();

                // 戦闘開始時のHPを保存
                defUnit.battleContext.restHp = defUnit.restHp;
            }

            let actualDefUnit = defUnit;
            if (!calcPotentialDamage) {
                let saverUnit = self.__getSaverUnitIfPossible(atkUnit, defUnit);
                if (saverUnit != null) {
                    // 護り手がいるときは護り手に対する戦闘前奥義のダメージを結果として返す
                    preCombatDamage = 0;
                    preCombatDamageWithOverkill = 0;
                    if (self.isLogEnabled) self.writeDebugLog(`${saverUnit.getNameWithGroup()}による護り手発動`);
                    self.__initSaverUnit(saverUnit, defUnit);
                    if (atkUnit.canActivatePrecombatSpecial() &&
                        !atkUnit.battleContext.cannotTriggerPrecombatSpecial) {
                        // 戦闘前奥義の範囲にいるユニットを列挙して護り手がいれば範囲奥義の計算を行う
                        for (let tile of this.map.enumerateRangedSpecialTiles(defUnit.placedTile, atkUnit.special)) {
                            if (tile.placedUnit === saverUnit) {
                                [preCombatDamage, preCombatDamageWithOverkill] = self.calcPrecombatSpecialResult(atkUnit, saverUnit);
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


            result = self.calcCombatResult(atkUnit, actualDefUnit, damageType, gameMode);
            result.preCombatDamage = preCombatDamage;
            result.preCombatDamageWithOverkill = preCombatDamageWithOverkill;

            // ダメージプレビュー用にスナップショットに戦闘中バフ値をコピー
            atkUnit.copySpursToSnapshot();
            actualDefUnit.copySpursToSnapshot();
        });

        return result;
    }

    __applySkillEffectsBeforePrecombat(atkUnit, defUnit) {
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
     */
    __initSaverUnit(saverUnit, defUnit) {
        // 戦闘後効果の適用処理が間に挟まるので、restoreOriginalTile() はこの関数の外で行わなければならない
        saverUnit.saveOriginalTile();

        // Tile.placedUnit に本当は配置ユニットが設定されないといけないが、
        // 1マスに複数ユニットが配置される状況は考慮していなかった。
        // おそらく戦闘中だけの設定であれば不要だと思われるので一旦設定無視してる。
        // todo: 必要になったら、Tile.placedUnit を複数設定できるよう対応する
        saverUnit.placedTile = defUnit.placedTile;
        saverUnit.setPos(saverUnit.placedTile.posX, saverUnit.placedTile.posY);

        saverUnit.initBattleContext(defUnit.battleContext.initiatesCombat);
        saverUnit.battleContext.isSaviorActivated = true;
        saverUnit.saveCurrentHpAndSpecialCount();

        this.updateUnitSpur(saverUnit, false);
    }

    calcPrecombatSpecialDamage(atkUnit, defUnit) {
        this.__applyPrecombatSkills(atkUnit, defUnit);
        return this._damageCalc.calcPrecombatSpecialDamage(atkUnit, defUnit);
    }

    /**
     * @param  {Unit} saverUnit
     * @param  {Unit} defUnit
     */
    __applyPrecombatSkills(atkUnit, defUnit) {
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
        defUnit.battleContext.invalidatesReferenceLowerMit = this.__canInvalidatesReferenceLowerMit(defUnit, atkUnit, true);
        this.__selectReferencingResOrDef(atkUnit, defUnit);
    }

    /**
     * @param  {Unit} saverUnit
     * @param  {Unit} defUnit
     */
    calcPrecombatSpecialResult(atkUnit, defUnit) {
        this.__applyPrecombatSkills(atkUnit, defUnit);
        return this._damageCalc.calcPrecombatSpecialResult(atkUnit, defUnit);
    }
    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {DamageType} damageType
     * @param  {Number} gameMode
     * @returns {DamageCalcResult}
     */
    calcCombatResult(atkUnit, defUnit, damageType, gameMode) {
        let calcPotentialDamage = damageType === DamageType.PotentialDamage;
        let self = this;

        // self.profile.profile("__applySkillEffect", () => {
        this.updateUnitSpur(atkUnit, calcPotentialDamage, defUnit);
        this.updateUnitSpur(defUnit, calcPotentialDamage, atkUnit);

        self.__applySkillEffect(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectForUnit(atkUnit, defUnit, calcPotentialDamage, gameMode);
        self.__applySkillEffectForUnit(defUnit, atkUnit, calcPotentialDamage, gameMode);

        self.__applySkillEffectRelatedToEnemyStatusEffects(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectRelatedToEnemyStatusEffects(defUnit, atkUnit, calcPotentialDamage);
        // });


        // 紋章を除く味方ユニットからの戦闘中バフ
        // self.profile.profile("__applySkillEffectFromAllies", () => {
        // self.__applySkillEffectForAttackerAndDefenderFromAllies(atkUnit, defUnit);
        self.__applySkillEffectFromAllies(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectFromAllies(defUnit, atkUnit, calcPotentialDamage);
        // });

        // 暗闘の対象外になる周囲からのスキル効果
        // 主に戦闘外の効果。味方の存在などで発動するスキルも書いて良い（ただし大抵の場合他の場所で書ける）
        self.__applySkillEffectFromAlliesExcludedFromFeud(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectFromAlliesExcludedFromFeud(defUnit, atkUnit, calcPotentialDamage);

        // self.profile.profile("__applySkillEffectFromSkillInfo", () => {
        // 1回の攻撃の攻撃回数を設定
        self.__setAttackCount(atkUnit, defUnit);
        self.__setAttackCount(defUnit, atkUnit);

        // 神罰の杖
        self.__setWrathfulStaff(atkUnit, defUnit);
        self.__setWrathfulStaff(defUnit, atkUnit);

        // 特効
        self.__setEffectiveAttackEnabledIfPossible(atkUnit, defUnit);
        self.__setEffectiveAttackEnabledIfPossible(defUnit, atkUnit);

        // スキル内蔵の全距離反撃
        defUnit.battleContext.canCounterattackToAllDistance = defUnit.canCounterAttackToAllDistance();
        // });

        // self.profile.profile("__applySkillEffect 2", () => {

        // 戦闘中バフが決まった後に評価するスキル効果
        {
            self.__applySpurForUnitAfterCombatStatusFixed(atkUnit, defUnit, calcPotentialDamage);
            self.__applySpurForUnitAfterCombatStatusFixed(defUnit, atkUnit, calcPotentialDamage);

            self.__applySkillEffectForUnitAfterCombatStatusFixed(atkUnit, defUnit, calcPotentialDamage);
            self.__applySkillEffectForUnitAfterCombatStatusFixed(defUnit, atkUnit, calcPotentialDamage);
        }

        // ダメージ軽減率の計算(ダメージ軽減効果を軽減する効果の後に実行する必要がある)
        {
            self.__applyDamageReductionRatio(atkUnit, defUnit);
            self.__applyDamageReductionRatio(defUnit, atkUnit);
        }

        self.__applySkillEffectForPrecombatAndCombat(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectForPrecombatAndCombat(defUnit, atkUnit, calcPotentialDamage);

        self.__calcFixedAddDamage(atkUnit, defUnit, false);
        self.__calcFixedAddDamage(defUnit, atkUnit, false);
        // });

        // self.profile.profile("__applySkillEffect 3", () => {
        // 敵が反撃可能か判定
        defUnit.battleContext.canCounterattack = self.canCounterAttack(atkUnit, defUnit);
        // self.writeDebugLogLine(defUnit.getNameWithGroup() + "の反撃可否:" + defUnit.battleContext.canCounterattack);

        // 追撃可能か判定
        atkUnit.battleContext.canFollowupAttack = self.__examinesCanFollowupAttackForAttacker(atkUnit, defUnit, calcPotentialDamage);
        if (defUnit.battleContext.canCounterattack) {
            defUnit.battleContext.canFollowupAttack = self.__examinesCanFollowupAttackForDefender(atkUnit, defUnit, calcPotentialDamage);
        }

        // 防御系奥義発動時のダメージ軽減率設定
        self.__applyDamageReductionRatioBySpecial(atkUnit, defUnit);
        self.__applyDamageReductionRatioBySpecial(defUnit, atkUnit);

        // 追撃可能かどうかが条件として必要なスキル効果の適用
        {
            self.__applySkillEffectRelatedToFollowupAttackPossibility(atkUnit, defUnit);
            self.__applySkillEffectRelatedToFollowupAttackPossibility(defUnit, atkUnit);
        }

        // 効果を無効化するスキル
        {
            self.__applyInvalidationSkillEffect(atkUnit, defUnit, calcPotentialDamage);
            self.__applyInvalidationSkillEffect(defUnit, atkUnit, calcPotentialDamage);
        }

        // 奥義
        {
            self.__applySpecialSkillEffect(atkUnit, defUnit);
            self.__applySpecialSkillEffect(defUnit, atkUnit);
        }

        // 間接的な設定から実際に戦闘で利用する値を評価して戦闘コンテキストに設定
        self.__setSkillEffetToContext(atkUnit, defUnit);
        // });

        {
            // 守備、魔防のどちらを参照するか決定
            atkUnit.battleContext.invalidatesReferenceLowerMit = this.__canInvalidatesReferenceLowerMit(atkUnit, defUnit);
            defUnit.battleContext.invalidatesReferenceLowerMit = this.__canInvalidatesReferenceLowerMit(defUnit, atkUnit);
            self.__selectReferencingResOrDef(atkUnit, defUnit);
            self.__selectReferencingResOrDef(defUnit, atkUnit);
        }

        let result;
        // self.profile.profile("_damageCalc.calcCombatResult", () => {
        result = self._damageCalc.calcCombatResult(atkUnit, defUnit, damageType);
        // });
        return result;
    }

    __canInvalidatesReferenceLowerMit(targetUnit, enemyUnit, isPrecombat = false) {
        let self = this;
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
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
                case Weapon.SpiritForestWrit:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        return true;
                    }
                    break;
                case Weapon.SplashyBucketPlus:
                    return true;
                case Weapon.Aureola:
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        return true;
                    }
                    break;
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
        else if (atkUnit.weapon === Weapon.FlameLance) {
            atkUnit.battleContext.refersRes = atkUnit.battleContext.restHpPercentage >= 50;
        }
        else if (atkUnit.weapon === Weapon.HelsReaper) {
            atkUnit.battleContext.refersRes = !isWeaponTypeTome(defUnit.weaponType) && defUnit.weaponType !== WeaponType.Staff;
        }
        else {
            if (this.isLogEnabled) this.writeDebugLog(`${atkUnit.getNameWithGroup()}は${atkUnit.isPhysicalAttacker() ? "物理" : "魔法"}ユニット`);
            atkUnit.battleContext.refersRes = !atkUnit.isPhysicalAttacker();
        }

        atkUnit.battleContext.refersResForSpecial = atkUnit.battleContext.refersRes;
        switch (atkUnit.special) {
            case Special.SeidrShell:
                if (!defUnit.battleContext.invalidatesReferenceLowerMit) {
                    if (this.isLogEnabled) this.writeDebugLog("魔弾により守備魔防の低い方でダメージ計算");

                    let defInCombat = defUnit.getDefInCombat(atkUnit);
                    let resInCombat = defUnit.getResInCombat(atkUnit);
                    atkUnit.battleContext.refersResForSpecial = defInCombat === resInCombat ? !atkUnit.isPhysicalAttacker() : resInCombat < defInCombat;
                }
                break;
        }
    }

    __getSaverUnitIfPossible(atkUnit, defUnit) {
        if (defUnit.hasStatusEffect(StatusEffectType.Undefended)) {
            return null;
        }
        let saverUnit = null;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 2, false)) {
            if ((defUnit.placedTile === null || defUnit.placedTile === undefined)
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

    __canActivateSaveSkill(atkUnit, unit) {
        if (this.__canDisableSaveSkill(atkUnit, unit)) {
            return false;
        }

        for (let skillId of unit.enumerateSkills()) {
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

        return false;
    }

    __hasSaveSkills(unit) {
        for (let skillId of unit.enumerateSkills()) {
            switch (skillId) {
                case PassiveC.WoefulUpheaval:
                case PassiveC.WithEveryone2:
                case PassiveC.AsFarSave3:
                case PassiveC.AdFarSave3:
                case PassiveC.ArFarSave3:
                case PassiveC.DrFarSave3:
                case PassiveC.AsNearSave3:
                case PassiveC.ArNearSave3:
                case PassiveC.AdNearSave3:
                case PassiveC.DrNearSave3:
                    return true;
            }
        }
        return false;
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
        if (defUnit.hasStatusEffect(StatusEffectType.ReduceDamageFromAreaOfEffectSpecialsBy80Percent)) {
            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.8);
        }
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
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
                case Weapon.GodlyBreath:
                    if (defUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(defUnit)) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.3);
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
                case Weapon.Areadbhar:
                    {
                        let diff = defUnit.getEvalSpdInPrecombat() - atkUnit.getEvalSpdInPrecombat();
                        if (diff > 0 && defUnit.battleContext.restHpPercentage >= 25) {
                            let percentage = Math.min(diff * 4, 40);
                            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                        }
                    }
                    break;
                case Weapon.GiltGoblet:
                    if (atkUnit.battleContext.restHpPercentage === 100 && isRangedWeaponType(atkUnit.weaponType)) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.5);
                    }
                    break;
                case Weapon.BloodTome:
                    if (isRangedWeaponType(atkUnit.weaponType)) {
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.8);
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
        {
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
        }

        {
            // atkUnitのスキル効果
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.KeenCoyoteBow:
                        if (atkUnit.battleContext.restHpPercentage >= 25) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                        break;
                    case Weapon.NewDawn:
                    case Weapon.Thunderbrand:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                        break;
                    case Weapon.TalreganAxe:
                        atkUnit.battleContext.isDesperationActivatable = true;
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
                        }
                        else {
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
                        }
                        else {
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
                    case Weapon.HigaimosoNoYumi:
                        if (atkUnit.hasNegativeStatusEffect()
                            || !atkUnit.battleContext.isRestHpFull
                        ) {
                            atkUnit.battleContext.isDesperationActivatable = true;
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
                    case PassiveB.KillingIntentPlus:
                        {
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
                    case PassiveB.SoulOfZofia2:
                        atkUnit.battleContext.isDesperationActivatable = true;
                        break;
                }
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
        self._applySkillEffectForAtkUnitFuncDict[Weapon.SummerStrikers] = (atkUnit) => {
            if (atkUnit.battleContext.restHpPercentage >= 25) {
                atkUnit.atkSpur += 5;
                atkUnit.spdSpur += 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.HewnLance] = (atkUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 4;
                atkUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.WhitedownSpear] = (atkUnit, defUnit) => {
            if (self.__countUnit(atkUnit.groupId, x => x.isOnMap && x.moveType === MoveType.Flying) >= 3) {
                defUnit.atkSpur -= 4;
                defUnit.defSpur -= 4;
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
        self._applySkillEffectForAtkUnitFuncDict[Weapon.RinkahNoOnikanabo] = (atkUnit) => {
            if (atkUnit.battleContext.restHpPercentage < 100) {
                atkUnit.atkSpur += 5;
                atkUnit.defSpur += 5;
                atkUnit.battleContext.increaseCooldownCountForDefense = true;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KokyousyaNoYari] = (atkUnit, defUnit) => {
            if (defUnit.battleContext.restHpPercentage >= 70) {
                atkUnit.atkSpur += 5;
                atkUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.HadesuOmega] = (atkUnit) => {
            atkUnit.atkSpur += 4;
            atkUnit.spdSpur += 4;
            if (atkUnit.hasSpecial && atkUnit.tmpSpecialCount === 0) {
                atkUnit.atkSpur += 6;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.GeneiFeather] = (atkUnit) => {
            if (self.__isThereAnyAllyUnit(atkUnit, x => x.isActionDone)) {
                atkUnit.atkSpur += 6;
                atkUnit.spdSpur += 6;
                atkUnit.battleContext.isDesperationActivatable = true;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.EishinNoAnki] = (atkUnit) => {
            atkUnit.atkSpur += 5;
            atkUnit.spdSpur += 5;
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
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Balmung] = (atkUnit, defUnit) => {
            if (defUnit.battleContext.isRestHpFull) {
                atkUnit.battleContext.invalidateAllOwnDebuffs();
                atkUnit.addAllSpur(5);
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
        self._applySkillEffectForDefUnitFuncDict[Weapon.TwinCrestPower] = (defUnit) => {
            if (defUnit.isTransformed) {
                defUnit.battleContext.canCounterattackToAllDistance = true;
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
        self._applySkillEffectForDefUnitFuncDict[Weapon.RinkahNoOnikanabo] = (defUnit) => {
            defUnit.atkSpur += 5;
            defUnit.defSpur += 5;
            defUnit.battleContext.increaseCooldownCountForDefense = true;
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
        self._applySkillEffectForDefUnitFuncDict[Weapon.Balmung] = (defUnit) => {
            defUnit.battleContext.invalidateAllOwnDebuffs();
            defUnit.addAllSpur(5);
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
            let func = (defUnit) => {
                if (defUnit.battleContext.restHpPercentage >= 50) {
                    defUnit.battleContext.canCounterattackToAllDistance = true;
                }
            };

            self._applySkillEffectForDefUnitFuncDict[Weapon.Amatsu] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.Puji] = func;
        }

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

    __applySkillEffect(atkUnit, defUnit, calcPotentialDamage) {
        if (atkUnit.isTransformed) {
            switch (BeastCommonSkillMap.get(atkUnit.weapon)) {
                case BeastCommonSkillType.Cavalry:
                    defUnit.atkSpur -= 4;
                    defUnit.defSpur -= 4;
                    break;
            }
        }

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

    __getPartnersInSpecifiedRange(targetUnit, spaces) {
        return Array.from(this._unitManager.enumeratePartnersInSpecifiedRange(targetUnit, spaces));
    }

    /// 自身を中心とした縦〇列と横〇列にいる味方の人数を返します
    __countAllyUnitsInClossWithOffset(targetUnit, offset) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit, false)) {
            if (unit.isInClossWithOffset(targetUnit, offset)) {
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

    __applySkillEffectForUnit(targetUnit, enemyUnit, calcPotentialDamage, gameMode) {
        let self = this;
        this.profiler.profile("__applySkillEffectForUnit", () => {
            self.____applySkillEffectForUnit(targetUnit, enemyUnit, calcPotentialDamage, gameMode);
        });
    }
    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {Boolean} calcPotentialDamage
     * @param  {GameMode} gameMode
     */
    ____applySkillEffectForUnit(targetUnit, enemyUnit, calcPotentialDamage, gameMode) {
        if (!targetUnit.isOneTimeActionActivatedForFallenStar
            && targetUnit.hasStatusEffect(StatusEffectType.FallenStar)
        ) {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8, enemyUnit);
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

        if (gameMode == GameMode.SummonerDuels) {
            if (targetUnit.attackRange == 1 && enemyUnit.attackRange == 2
                && !targetUnit.battleContext.isSaviorActivated
            ) {
                // 英雄決闘では射程1ボーナスで射程2と闘う時、守備、魔防+7される(護り手発動時は除外)
                targetUnit.addSpurs(0, 0, 7, 7);
            }
        }

        // 今のところ奥義にしかこの効果が存在しないので、重複しない。もし今後重複する場合は重複時の計算方法を調査して実装する
        targetUnit.battleContext.selfDamageDealtRateToAddSpecialDamage = getSelfDamageDealtRateToAddSpecialDamage(targetUnit.special);

        for (let skillId of targetUnit.enumerateSkills()) {
            let skillFunc = this._applySkillEffectForUnitFuncDict[skillId];
            if (skillFunc) {
                skillFunc(targetUnit, enemyUnit, calcPotentialDamage);
            }
        }

        this.__calcFixedSpecialAddDamage(targetUnit, enemyUnit);
    }

    __init__applySkillEffectForUnitFuncDict() {
        let self = this;
        // this._applySkillEffectForUnitFuncDict[Weapon.W] = (targetUnit, enemyUnit, calcPotentialDamage) => {
        this._applySkillEffectForUnitFuncDict[Weapon.WoodenTacklePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkDefSpurs(5);
                let amount = Math.min(Math.trunc(targetUnit.restHp * 0.25), 10);
                enemyUnit.addAtkDefSpurs(-amount);
                targetUnit.battleContext.healedHpAfterCombat += 10;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.FirefloodBoost3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.addAtkResSpurs(7);
                let func = unit => unit.battleContext.restHpPercentage >= 50;
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, func)) {
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
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
        this._applySkillEffectForUnitFuncDict[Weapon.SeasideParasolPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                let count = enemyUnit.getPositiveStatusEffects().length + enemyUnit.getNegativeStatusEffects().length;
                let amount = Math.min(count * 4, 16);
                enemyUnit.resSpur -= amount;
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
            targetUnit.battleContext.invalidatesHeal = true;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WyvernHatchet] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addAtkDefSpurs(-6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Heidr] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
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
            targetUnit.addDefResSpurs(-3);
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
                enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 1;
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
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkResScowl4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAtkResSpurs(7);

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
            this._applySkillEffectForUnitFuncDict[Weapon.ProtectionPikePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ProtectionBowPlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Liberation] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let originSet = new Set();
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                    let info = unit.heroInfo;
                    if (info === null) continue;
                    let origins = info.origin.split('|');
                    for (let origin of origins) {
                        if (origin.indexOf("紋章の謎") >= 0) {
                            originSet.add("紋章の謎");
                        } else {
                            originSet.add(origin);
                        }
                    }
                }
                let amount = Math.min(originSet.size * 4 + 4, 12);
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
        this._applySkillEffectForUnitFuncDict[Weapon.EnclosingClaw] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let func = unit => {
                    let xDiff = Math.abs(targetUnit.posX - unit.posX);
                    let yDiff = Math.abs(targetUnit.posY - unit.posY);
                    return xDiff <= 1 || yDiff <= 1;
                }
                let count = self.__countEnemiesWithinSpecifiedSpaces(targetUnit, 99, func);
                let amount = Math.min(count * 3, 9);
                enemyUnit.addSpurs(-amount, -amount, -amount, 0);
                if (count >= 2) {
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.EnclosingDark] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                let count = self.__countAlliesWithinSpecifiedSpaces(enemyUnit, 2);
                if (count === 1) {
                    enemyUnit.addSpurs(0, -4, 0, -4);
                } else if (count >= 2) {
                    enemyUnit.addSpurs(0, -8, 0, -8);
                    targetUnit.battleContext.invalidatesCounterattack = true;
                }
            }
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.isDesperationActivatable = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.SpiritForestWrit] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                enemyUnit.addSpurs(-6, 0, 0, -6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                let diff = targetUnit.getResInPrecombat() - enemyUnit.getResInPrecombat();
                if (diff >= 1) {
                    let amount = Math.min(Math.trunc(diff * 0.8), 12);
                    enemyUnit.addSpurs(-amount, 0, 0, -amount);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BreakerLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-6, 0, -6, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Geirdriful] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let count = targetUnit.getPositiveStatusEffects().length + targetUnit.getNegativeStatusEffects().length;
                targetUnit.addAllSpur(count * 2);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
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
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdFinish4] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.battleContext.passiveASkillCondSatisfied = true;
                targetUnit.addSpurs(7, 7, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkResFinish4] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.battleContext.passiveASkillCondSatisfied = true;
                targetUnit.addSpurs(7, 0, 0, 7);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.SpdResFinish3] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.battleContext.passiveASkillCondSatisfied = true;
                targetUnit.addSpurs(0, 6, 0, 6);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.SpdResFinish4] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.battleContext.passiveASkillCondSatisfied = true;
                targetUnit.addSpurs(0, 7, 0, 7);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.DefResFinish4] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.battleContext.passiveASkillCondSatisfied = true;
                targetUnit.addSpurs(0, 0, 7, 7);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RemoteBreath] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addAllSpur(5);
                if (isNormalAttackSpecial(targetUnit.special)) {
                    targetUnit.battleContext.specialCountReductionBeforeFirstAttack++;
                }
            }
        }
        {
            // 激突3, 4
            let getFunc = (spurFunc, skillLevel) => {
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
                            targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                            targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                        }
                    }
                }
            }
            this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdClash3] = getFunc(Unit.prototype.addAtkSpdSpurs, 3);
            this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdClash4] = getFunc(Unit.prototype.addAtkSpdSpurs, 4);

            this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefClash3] = getFunc(Unit.prototype.addAtkDefSpurs, 3);
            this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefClash4] = getFunc(Unit.prototype.addAtkDefSpurs, 4);

            this._applySkillEffectForUnitFuncDict[PassiveA.SpdDefClash3] = getFunc(Unit.prototype.addSpdDefSpurs, 3);
            this._applySkillEffectForUnitFuncDict[PassiveA.SpdDefClash4] = getFunc(Unit.prototype.addSpdDefSpurs, 4);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HolytideTyrfing] = (targetUnit, enemyUnit) => {
            let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
            if (dist !== 0) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdPreempt3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.InnerWellspring] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
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
        this._applySkillEffectForUnitFuncDict[Weapon.IlluminatingHorn] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
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
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
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
        this._applySkillEffectForUnitFuncDict[Weapon.EbonBolverk] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.addAllSpur(5);
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
        this._applySkillEffectForUnitFuncDict[Weapon.GodlyBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.addAllSpur(-5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
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
        this._applySkillEffectForUnitFuncDict[Weapon.LandsSword] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                enemyUnit.battleContext.preventedDefenderSpecial = true;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecial = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.WingLeftedSpear] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
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
        this._applySkillEffectForUnitFuncDict[Weapon.SerpentineStaffPlus] = (targetUnit) => {
            targetUnit.battleContext.invalidatesHeal = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.ProfessorialGuide] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
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
            if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect()) {
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
        this._applySkillEffectForUnitFuncDict[Weapon.HornOfOpening] = (targetUnit, enemyUnit) => {
            let count = 0;
            for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                count++;
            }
            if (count >= 1) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
            }
            if (count >= 2) {
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
            if (count >= 3) {
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.Worldbreaker] = (targetUnit) => {
            targetUnit.battleContext.increaseCooldownCountForBoth();
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WarGodMjolnir] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DivineRecreation] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.addAllSpur(-4);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GrimBrokkr] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
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
        this._applySkillEffectForUnitFuncDict[Weapon.DazzlingBreath] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addAllSpur(-5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                if (this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.HardyFighter3] = (targetUnit) => {
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.AutoLofnheior] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FlamelickBreath] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesHeal = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.NewDawn] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MaritaNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || targetUnit.battleContext.isSolo) {
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.VirtuousTyrfing] = (targetUnit, enemyUnit) => {
            if (!targetUnit.battleContext.initiatesCombat
                || targetUnit.battleContext.restHpPercentage <= 99
            ) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Taiyo] = (targetUnit, enemyUnit) => {
            let amount = targetUnit.isWeaponRefined ? 14 : 10;
            targetUnit.battleContext.healedHpByAttack += amount;
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.addAtkDefSpurs(-5);
                    targetUnit.battleContext.nullInvalidatesHealRatio = 0.5;
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
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PhantasmTome] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.spdSpur -= 6;
                enemyUnit.resSpur -= 6;
                targetUnit.battleContext.invalidatesSpdBuff = true;
                targetUnit.battleContext.invalidatesResBuff = true;
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.7, enemyUnit);
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
        this._applySkillEffectForUnitFuncDict[Weapon.FeatherSword] = (targetUnit, enemyUnit) => {
            if (!targetUnit.battleContext.initiatesCombat) {
                if (targetUnit.battleContext.restHpPercentage <= 75
                    || enemyUnit.weaponType === WeaponType.Sword
                    || enemyUnit.weaponType === WeaponType.Lance
                    || enemyUnit.weaponType === WeaponType.Axe
                    || enemyUnit.weaponType === WeaponType.ColorlessBow
                    || enemyUnit.moveType === MoveType.Armor
                ) {
                    targetUnit.battleContext.isVantageActivatable = true;

                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GenesisFalchion] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let buffTotal = self.__getTotalBuffAmountOfTop3Units(targetUnit);
                if (buffTotal >= 10) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                }
                if (buffTotal >= 25) {
                    targetUnit.atkSpur += 5;
                    targetUnit.battleContext.healedHpByAttack += 5;
                }
                if (buffTotal >= 60) {
                    targetUnit.battleContext.isVantageActivatable = true;

                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ChargingHorn] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let count = 0;
                if (self.__isThereBreakableStructureForEnemyIn2Spaces(targetUnit)) {
                    count = 3;
                }
                else {
                    count = self.__countAllyUnitsInClossWithOffset(targetUnit, 1);
                }
                if (count >= 1) {
                    let debuffAmount = Math.min(count * 2, 6);
                    enemyUnit.atkSpur -= debuffAmount;
                    enemyUnit.resSpur -= debuffAmount;
                }
                if (count >= 3) {
                    --enemyUnit.battleContext.followupAttackPriorityDecrement;
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
        this._applySkillEffectForUnitFuncDict[Weapon.HolyYewfelle] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Ginnungagap] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                let isTomeOrStaff = enemyUnit.isTome || (enemyUnit.weaponType === WeaponType.Staff);
                if (targetUnit.battleContext.initiatesCombat ||
                    (enemyUnit.battleContext.initiatesCombat && isTomeOrStaff)) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TigerSpirit] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.EverlivingDomain] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.inCombatMiracleHpPercentageThreshold = 75;
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
        this._applySkillEffectForUnitFuncDict[Weapon.ProfessorialText] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat
                || self.__isThereAllyIn2Spaces(targetUnit)
            ) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.Ladyblade] = (targetUnit) => {
            targetUnit.battleContext.refersMinOfDefOrRes = true;
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

        this._applySkillEffectForUnitFuncDict[Weapon.BereftLance] = (targetUnit) => {
            {
                let allyCount = self.__countAlliesWithinSpecifiedSpaces(
                    targetUnit, 2);
                let buffAmount = 0;
                if (allyCount === 0) {
                    buffAmount = 6;
                }
                else if (allyCount === 1) {
                    buffAmount = 4;
                }
                else if (allyCount === 2) {
                    buffAmount = 2;
                }
                targetUnit.atkSpur += buffAmount;
                targetUnit.defSpur += buffAmount;

                if (allyCount <= 1) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AxeOfDespair] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfDespair] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
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
        this._applySkillEffectForUnitFuncDict[Weapon.TwinCrestPower] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityDecrement--;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HallowedTyrfing] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                if (targetUnit.battleContext.initiatesCombat || enemyUnit.isRangedWeaponType()) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.FatalSmoke3] = (targetUnit) => {
            targetUnit.battleContext.invalidatesHeal = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.BowOfFrelia] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                targetUnit.battleContext.additionalDamageOfSpecial += 7;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
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
        this._applySkillEffectForUnitFuncDict[Weapon.BloodTome] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.isAdvantageForColorless = isRangedWeaponType(enemyUnit.weaponType);
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
        this._applySkillEffectForUnitFuncDict[Weapon.HotshotLance] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                let buffAmount = 4;
                if (targetUnit.dragonflower === 3) {
                    buffAmount = 5;
                }
                else if (targetUnit.dragonflower === 4) {
                    buffAmount = 6;
                }
                else if (targetUnit.dragonflower === 5) {
                    buffAmount = 7;
                }
                targetUnit.addAllSpur(buffAmount);

                if (targetUnit.dragonflower >= 3) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfReglay] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
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
        this._applySkillEffectForUnitFuncDict[Weapon.IcyFimbulvetr] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;

                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3,
                    x => x.moveType === MoveType.Cavalry || x.moveType === MoveType.Flying)
                ) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    targetUnit.battleContext.healedHpByAttack += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.FallenStar] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Failnaught] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SilesseFrost] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;

                let partners = self.__getPartnersInSpecifiedRange(targetUnit, 2);
                if (partners.length > 0) {
                    targetUnit.battleContext.attackCount = 2;
                }
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
        this._applySkillEffectForUnitFuncDict[Weapon.AuroraBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 6;
                ++targetUnit.battleContext.followupAttackPriorityIncrement;
            }
            else {
                targetUnit.defSpur += 6;
                targetUnit.resSpur += 6;
                --enemyUnit.battleContext.followupAttackPriorityDecrement;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.IndignantBow] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesAtkBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Grafcalibur] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidateAllBuffs();
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
        this._applySkillEffectForUnitFuncDict[Weapon.ResolvedFang] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.defSpur += 5;
                enemyUnit.defSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RefreshedFang] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.spdSpur += 5;
                enemyUnit.spdSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RenewedFang] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                (u) =>
                    targetUnit.partnerHeroIndex === u.heroIndex ||
                    targetUnit.heroIndex === u.partnerHeroIndex)) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.spdSpur -= 6;
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StudiedForblaze] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Hrist] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 99) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
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
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfStorms] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Lyngheior] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Aureola] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TigerRoarAxe] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.addAllSpur(5);
                if (enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Areadbhar] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DarkCreatorS] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && !targetUnit.isOneTimeActionActivatedForWeapon) {
                let count = self.__countUnit(targetUnit.groupId, x => x.hpPercentage >= 90);
                let buff = Math.min(count * 2, 6);
                targetUnit.atkSpur += buff;
                targetUnit.defSpur += buff;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SpearOfAssal] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesSpdBuff = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.JokersWild] = (targetUnit) => {
            {
                let atk = 0;
                let spd = 0;
                let def = 0;
                let res = 0;
                let foundUnit = false;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
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
        this._applySkillEffectForUnitFuncDict[Weapon.FlameLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.spdSpur -= 5;
                enemyUnit.resSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TalreganAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat
                || (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
            ) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
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
        this._applySkillEffectForUnitFuncDict[Weapon.Garumu] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.healedHpByAttack += 7;
                }
                if (targetUnit.hasPositiveStatusEffect()) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PrimordialBreath] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
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
                    targetUnit.battleContext.nullInvalidatesHealRatio = 0.6;
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
        this._applySkillEffectForUnitFuncDict[Weapon.GateAnchorAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.defSpur += 5;
                targetUnit.resSpur += 5;
                enemyUnit.defSpur -= 5;
                enemyUnit.resSpur -= 5;
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
        this._applySkillEffectForUnitFuncDict[Weapon.SkyPirateClaw] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
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
        this._applySkillEffectForUnitFuncDict[Weapon.SunsPercussors] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                || enemyUnit.battleContext.restHpPercentage === 100
            ) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.StarpointLance] = (targetUnit) => {
            if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                targetUnit.addAllSpur(5);
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
        this._applySkillEffectForUnitFuncDict[Weapon.ApotheosisSpear] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BridesFang] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.spdSpur -= 5;
                enemyUnit.defSpur -= 5;
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
        this._applySkillEffectForUnitFuncDict[Weapon.BrutalBreath] = (targetUnit) => {
            {
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                let spur = 0;
                if (count === 0) {
                    spur = 5;
                } else if (count === 1) {
                    spur = 3;
                } else if (count === 2) {
                    spur = 1;
                }
                targetUnit.addAllSpur(spur);

                if (count <= 1) {
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DarkScripture] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
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
        this._applySkillEffectForUnitFuncDict[Weapon.AkaiRyukishiNoOno] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.WindsOfChange] = (targetUnit) => {
            if (targetUnit.isBuffed || targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
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
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.battleContext.invalidateAllOwnDebuffs();
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
            if (enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
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
            if (enemyUnit.battleContext.restHpPercentage < 100) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.ChisouGeiborugu] = (targetUnit, enemyUnit) => {
            if (enemyUnit.moveType === MoveType.Infantry
                || enemyUnit.moveType === MoveType.Armor
                || enemyUnit.moveType === MoveType.Cavalry
            ) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
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
        this._applySkillEffectForUnitFuncDict[Weapon.GeneiBattleAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.defSpur += 6;
                targetUnit.resSpur += 6;
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
        this._applySkillEffectForUnitFuncDict[Weapon.Uchikudakumono] = (targetUnit) => {
            targetUnit.battleContext.refersMinOfDefOrRes = true;
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
                targetUnit.battleContext.nullInvalidatesHealRatio = 0.5
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
            if ((!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
                || targetUnit.isBuffed
            ) {
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                enemyUnit.atkSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LarceisEdge] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                || enemyUnit.battleContext.isRestHpFull
            ) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.invalidateAllBuffs();
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
                targetUnit.battleContext.nullInvalidatesHealRatio = 0.5
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
            this._applySkillEffectForUnitFuncDict[Weapon.HakutoshinNoNinjin] = func;
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
            let func = (targetUnit, enemyUnit) => {
                if (!targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.spdSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.BladeOfShadow] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SpearOfShadow] = func;
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

    __calcFixedSpecialAddDamage(targetUnit, enemyUnit, isPrecombat = false) {
        {
            let damage = 0;
            switch (BeastCommonSkillMap.get(targetUnit.weapon)) {
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
            if (targetUnit.isTransformed) {
                targetUnit.battleContext.additionalDamageOfSpecial += damage;
            }
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.ImbuedKoma:
                    if (targetUnit.isWeaponSpecialRefined) {
                        let def = DamageCalculatorWrapper.__getDef(targetUnit, enemyUnit, isPrecombat);
                        targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(def * 0.15);
                    }
                    break;
                case PassiveB.SpecialSpiral4:
                    targetUnit.battleContext.additionalDamageOfSpecial += 5;
                    break;
                case PassiveB.MoonlightBangle:
                case PassiveB.MoonlitBangleF: {
                    let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                    let def = isPrecombat ? enemyUnit.getDefInPrecombat() : enemyUnit.getDefInCombat();
                    targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(def * ratio);
                }
                    break;
                case PassiveB.RunaBracelet: {
                    let def = isPrecombat ? enemyUnit.getDefInPrecombat() : enemyUnit.getDefInCombat();
                    targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(def * 0.5);
                }
                    break;
                case PassiveB.Bushido:
                    targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    break;
                case PassiveB.Ikari3:
                    if (targetUnit.restHpPercentage <= 75) {
                        targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    }
                    break;
                case PassiveB.Spurn3:
                case PassiveB.Spurn4:
                    if (targetUnit.restHpPercentage <= 75) {
                        targetUnit.battleContext.additionalDamageOfSpecial += 5;
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
                        let spd = isPrecombat ? targetUnit.getEvalSpdInPrecombat() : targetUnit.getEvalSpdInCombat();
                        targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(spd * ratio);
                    }
                    break;
                case Weapon.ManatsuNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                            let res = isPrecombat ? enemyUnit.getResInPrecombat() : enemyUnit.getResInCombat();
                            targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(res * ratio);
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
                    targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    break;
                case Weapon.Shamsir:
                    targetUnit.battleContext.additionalDamageOfSpecial += 7;
                    break;
                case Weapon.RunaNoEiken:
                case Weapon.Otokureru:
                case Weapon.MumeiNoIchimonNoKen:
                case Weapon.SyaniNoSeisou:
                case Weapon.DevilAxe:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    }
                    break;
            }
        }
    }

    __applySkillEffectRelatedToEnemyStatusEffects(targetUnit, enemyUnit, _calcPotentialDamage) {
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
                case Weapon.JoyfulVows:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
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
                case Weapon.HigaimosoNoYumi:
                    if (targetUnit.hasNegativeStatusEffect()
                        || !targetUnit.battleContext.isRestHpFull
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
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
     * @param  {Boolean} calcPotentialDamage
     */
    __applySkillEffectFromAllies(targetUnit, enemyUnit, calcPotentialDamage) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemiesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }

        if (!calcPotentialDamage) {
            // 距離に関係ない効果
            for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                    continue
                }
                for (let skillId of allyUnit.enumerateSkills()) {
                    switch (skillId) {
                        case Captain.Erosion:
                            if (enemyUnit.battleContext.isSaviorActivated) {
                                enemyUnit.defSpur -= 4;
                                enemyUnit.resSpur -= 4;
                                targetUnit.battleContext.invalidatesCounterattack = true;
                            }
                            break;
                    }
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
                        case Weapon.SacrificeStaff:
                            if (g_appData.globalBattleContext.miracleWithoutSpecialActivationCount[targetUnit.groupId] === 0) {
                                targetUnit.battleContext.canActivateMiracleAndHeal = true;
                            }
                            break;
                        case PassiveC.SoaringGuidance: {
                            let moveType = targetUnit.moveType;
                            if (moveType === MoveType.Infantry ||
                                moveType === MoveType.Flying) {
                                if (targetUnit.getEvalSpdInCombat(enemyUnit) >
                                    enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                            break;
                        case PassiveC.Guidance4: {
                            let moveType = targetUnit.moveType;
                            if (moveType === MoveType.Infantry ||
                                moveType === MoveType.Armor) {
                                if (targetUnit.getEvalSpdInCombat(enemyUnit) >
                                    enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                            break;
                        case Weapon.RaisenNoSyo:
                            if (allyUnit.isWeaponSpecialRefined) {
                                if (enemyUnit.battleContext.initiatesCombat) {
                                    targetUnit.addSpdResSpurs(-5);
                                }
                            }
                            break;
                        case Weapon.ElisesStaff:
                            if (allyUnit.isWeaponSpecialRefined) {
                                if (enemyUnit.battleContext.initiatesCombat) {
                                    targetUnit.addAllSpur(-4);
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
                        case Weapon.ProfessorialGuide:
                            targetUnit.battleContext.invalidateCooldownCountSkills();
                            break;
                        case Weapon.ProfessorialText:
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                            break;
                        case Weapon.RenewedFang:
                            if (targetUnit.partnerHeroIndex === allyUnit.heroIndex ||
                                targetUnit.heroIndex === allyUnit.partnerHeroIndex) {
                                targetUnit.battleContext.increaseCooldownCountForBoth();
                            }
                            break;
                        case Weapon.CaduceusStaff:
                            targetUnit.battleContext.multDamageReductionRatio(0.3, enemyUnit);
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
                            targetUnit.battleContext.multDamageReductionRatio(0.3, enemyUnit);
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                            break;
                        case PassiveC.Worldbreaker:
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                            break;
                        case PassiveC.EverlivingDomain: {
                            let threshold = targetUnit.battleContext.inCombatMiracleHpPercentageThreshold;
                            targetUnit.battleContext.inCombatMiracleHpPercentageThreshold = Math.min(threshold, 75);
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

    __applySkillEffectFromAlliesExcludedFromFeud(targetUnit, enemyUnit, calcPotentialDamage) {
        if (calcPotentialDamage) {
            return;
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
        let atkWeaponInfo = targetUnit.weaponInfo;
        if (atkWeaponInfo != null) {
            targetUnit.battleContext.attackCount = atkWeaponInfo.attackCount;
            targetUnit.battleContext.counterattackCount = atkWeaponInfo.counterattackCount;
        }
        else {
            targetUnit.battleContext.attackCount = 0;
            targetUnit.battleContext.counterattackCount = 0;
        }

        // Triangle Attack
        if (targetUnit.hasStatusEffect(StatusEffectType.TriangleAttack)) {
            let triangleAttackerCount = 0;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                if (unit.hasStatusEffect(StatusEffectType.TriangleAttack)) {
                    triangleAttackerCount++;
                }
            }
            if (targetUnit.battleContext.initiatesCombat && triangleAttackerCount >= 2) {
                targetUnit.battleContext.attackCount = 2;
            }
        }

        // デュアルアタック
        if (targetUnit.hasStatusEffect(StatusEffectType.DualStrike)) {
            let found = false;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 1, false)) {
                if (unit.hasStatusEffect(StatusEffectType.DualStrike)) {
                    found = true;
                }
            }
            if (targetUnit.battleContext.initiatesCombat && found) {
                targetUnit.battleContext.attackCount = 2;
            }
        }

        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
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
                case Weapon.WhitedownSpear:
                    if (targetUnit.battleContext.initiatesCombat
                        && this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x =>
                            x.moveType === MoveType.Flying) >= 2
                    ) {
                        targetUnit.battleContext.attackCount = 2;
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

    __countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator);
    }
    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     */
    __setWrathfulStaff(atkUnit, defUnit) {
        if (defUnit.canInvalidateWrathfulStaff()) {
            return;
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

    __applySpurForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, calcPotentialDamage) {
        if (targetUnit.hasStatusEffect(StatusEffectType.GrandStrategy)) {
            this.__applyDebuffReverse(targetUnit, "ステータス:神軍師の策");
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Sabotage)) {
            this.__applySabotage(targetUnit);
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Discord)) {
            let amount = Math.min(this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2), 3) + 2;
            targetUnit.addAllSpur(-amount);
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.FoePenaltyDoubler)) {
            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
            enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
            enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
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
                case PassiveB.SabotageAR3:
                    if (targetUnit.getEvalResInCombat(enemyUnit) > enemyUnit.getEvalResInCombat(targetUnit)) {
                        enemyUnit.addAtkResSpurs(-3);
                        let maxDebuffs = this.__maxDebuffsFromAlliesWithinSpecificSpaces(enemyUnit);
                        enemyUnit.addAtkResSpurs(-maxDebuffs[0], -maxDebuffs[3]);
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
                case Weapon.WingLeftedSpear:
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        this.__applyBuffAbsorption(targetUnit, enemyUnit)
                    }
                    break;
                case Weapon.HvitrvulturePlus:
                case Weapon.GronnvulturePlus:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
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
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyDefUnity();
                    }
                    break;
                case Weapon.SnowGlobePlus:
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
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
                case Weapon.Hrimfaxi:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
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
                case Weapon.OrdersSentence:
                    if (targetUnit.battleContext.restHpPercentage >= 25
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
                case Weapon.Skinfaxi:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applySpdUnity();
                        targetUnit.applyDefUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case Weapon.SparkingTome:
                    if (enemyUnit.battleContext.restHpPercentage >= 50) {
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
                case Weapon.AxeOfDespair:
                case Weapon.TomeOfDespair:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let buff = targetUnit.getBuffTotalInCombat(enemyUnit);
                        let debuffTotal = targetUnit.debuffTotal;
                        let buffDebuffTotal = buff - debuffTotal;
                        if (buffDebuffTotal >= 5) {
                            --enemyUnit.battleContext.followupAttackPriorityDecrement;

                            if (buffDebuffTotal >= 10) {
                                ++targetUnit.battleContext.followupAttackPriorityIncrement;

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
                case Weapon.ChaosRagnell:
                    this.__applyDebuffReverse(targetUnit, targetUnit.weaponInfo.name);
                    break;
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
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applySpdUnity();
                    }
                    break;
                case PassiveA.AtkDefUnity:
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyDefUnity();
                    }
                    break;
                case PassiveA.AtkResUnity:
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case PassiveA.DefResUnity:
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
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
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        targetUnit.addAllSpur(2);
                        enemyUnit.addAllSpur(-2);
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

    __getHighestBuffs(targetUnit, enemyUnit, units) {
        let buffs = [];
        for (let unit of units) {
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
        return amounts;
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

    // 最大のデバフを返す
    // デバフが最大とはマイナスの値が大きいことであることに注意
    __maxDebuffsFromAlliesWithinSpecificSpaces(targetUnit, spaces = 2, withTargetUnit = true) {
        let atkMax = 0;
        let spdMax = 0;
        let defMax = 0;
        let resMax = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit)) {
            let atkDebuff = Math.abs(unit.atkDebuffTotal);
            if (atkMax < atkDebuff) atkMax = atkDebuff;

            let spdDebuff = Math.abs(unit.spdDebuffTotal);
            if (spdMax < spdDebuff) spdMax = spdDebuff;

            let defDebuff = Math.abs(unit.defDebuffTotal);
            if (defMax < defDebuff) defMax = defDebuff;

            let resDebuff = Math.abs(unit.resDebuffTotal);
            if (resMax < resDebuff) resMax = resDebuff;
        }
        return [-atkMax, -spdMax, -defMax, -resMax];
    }

    __isThereAllyIn2Spaces(targetUnit) {
        return this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
    }

    __isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator);
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
        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1)) {
            return false;
        }

        return true;
    }
    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {Boolean} calcPotentialDamage
     */
    __applySkillEffectForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, calcPotentialDamage) {
        if (targetUnit.hasStatusEffect(StatusEffectType.BonusDoubler)) {
            DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.NullFollowUp)) {
            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }

        // マリア算（アスク、ディミトリ算）
        function mariaCalc() {
            applyFixedValueSkill(targetUnit.getDefInCombat(enemyUnit));
        }
        // クロエ算（魔防マリア算）
        function resMariaCalc() {
            applyFixedValueSkill(targetUnit.getResInCombat(enemyUnit));
        }
        // ディミトリ算（攻撃マリア算）
        function atkMariaCalc() {
            applyFixedValueSkill(targetUnit.getAtkInCombat(enemyUnit));
        }

        // ステータスによる固定ダメージ増加・軽減
        function applyFixedValueSkill(status, ratio = 0.20) {
            targetUnit.battleContext.additionalDamage += Math.trunc(status * ratio);
            targetUnit.battleContext.damageReductionValue += Math.trunc(status * ratio);
        }

        {
            for (let skillId of targetUnit.enumerateSkills()) {
                switch (skillId) {
                    // リーダースキル
                    case Captain.SecretManeuver:
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                        break;
                    // ユニットスキル
                    case Weapon.RadiantAureola:
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            resMariaCalc();
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
                    case PassiveA.AtkResScowl4:
                        if (enemyUnit.battleContext.initiatesCombat ||
                            enemyUnit.battleContext.restHpPercentage >= 75) {
                            if (isNormalAttackSpecial(enemyUnit.special)) {
                                let diff =
                                    targetUnit.getEvalResInCombat(enemyUnit) -
                                    enemyUnit.getEvalResInCombat(targetUnit);
                                if (diff >= 5) {
                                    enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack++;
                                }
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
                                atkMariaCalc();
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
                            resMariaCalc()
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
                            mariaCalc();
                        }
                        break;
                    case Weapon.IlluminatingHorn:
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            mariaCalc();
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
                                    debuffTotal = Math.min(debuffTotal, unit.debuffTotal);
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
                                mariaCalc();
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
                    case Weapon.Geirdriful:
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                targetUnit.battleContext.increaseCooldownCountForBoth();
                            }
                        }
                        break;
                    case Weapon.AwokenBreath:
                    case Weapon.RemoteBreath:
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            if (isNormalAttackSpecial(enemyUnit.special)) {
                                let diff =
                                    targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                                if (diff >= 5) {
                                    enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack++;
                                }
                            }
                        }
                        break;
                    case Weapon.HolytideTyrfing: {
                        let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                        if (dist > 0) {
                            let def = enemyUnit.getDefInCombat(targetUnit);
                            let d = Math.min(dist, 4);
                            targetUnit.battleContext.additionalDamage += d * Math.trunc(def * 0.1);
                        }
                    }
                        break;
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
                                targetUnit.battleContext.attackCount = 2;
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
                    case Weapon.Luin:
                        if (targetUnit.battleContext.initiatesCombat
                            || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                        ) {
                            targetUnit.spdSpur += 6;
                            if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getEvalSpdInCombat() + 5) {
                                targetUnit.battleContext.invalidatesCounterattack = true;
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
                        if (targetUnit.battleContext.isSolo || calcPotentialDamage) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        }
                        break;
                    case Weapon.PlegianBowPlus:
                        if (targetUnit.battleContext.isSolo || calcPotentialDamage) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        }
                        break;
                    case Weapon.FellFlambeau:
                        if (targetUnit.battleContext.isSolo || calcPotentialDamage) {
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
                        if (targetUnit.battleContext.isSolo || calcPotentialDamage) {
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
                            if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getEvalSpdInPrecombat() - 10) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                            }
                        }
                        break;
                    case PassiveB.SavvyFighter3:
                        if (enemyUnit.battleContext.initiatesCombat) {
                            if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getEvalSpdInPrecombat() - 4) {
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

    __getDamageReductionRatio(skillId, atkUnit, defUnit) {
        switch (skillId) {
            case Weapon.SparklingSun:
                if (this.__isThereAllyInSpecifiedSpaces(defUnit, 3)) {
                    return 0.75;
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
                if (!defUnit.isOneTimeActionActivatedForPassiveB) {
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
            case Weapon.GodlyBreath:
                if (defUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(defUnit)) {
                    return 0.3;
                }
                break;
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
            case Weapon.Areadbhar:
                {
                    let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                    if (diff > 0 && defUnit.battleContext.restHpPercentage >= 25) {
                        let percentage = Math.min(diff * 4, 40);
                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`アラドヴァルによりダメージ${percentage}%軽減(速さの差 ${(defUnit.getEvalSpdInCombat(atkUnit))}-${(atkUnit.getEvalSpdInCombat(defUnit))}=${diff})`);
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.GiltGoblet:
                if ((atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.restHpPercentage === 100) &&
                    isWeaponTypeTome(atkUnit.weaponType)) {
                    return 0.5;
                }
                break;
            case Weapon.BloodTome:
                if (isRangedWeaponType(atkUnit.weaponType)) {
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
        for (let skillId of defUnit.enumerateSkills()) {
            let ratio = this.__getDamageReductionRatio(skillId, atkUnit, defUnit);
            if (ratio > 0) {
                defUnit.battleContext.multDamageReductionRatio(ratio, atkUnit);
            }
        }

        if (defUnit.hasStatusEffect(StatusEffectType.Dodge)) {
            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
            if (ratio > 0) {
                defUnit.battleContext.multDamageReductionRatio(ratio, atkUnit);
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
                // この実装だと戦闘前に効かないので、実際の挙動を確認した方がいいかも
                case Weapon.DarkCreatorS:
                    if (!calcPotentialDamage && !targetUnit.isOneTimeActionActivatedForWeapon) {
                        let count = this.__countUnit(targetUnit.groupId, x => x.hpPercentage >= 90);
                        let damageReductionRatio = Math.min(count * 15, 45) * 0.01;
                        targetUnit.battleContext.multDamageReductionRatio(damageReductionRatio, enemyUnit);
                    }
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
        if (atkUnit.hasStatusEffect(StatusEffectType.Treachery)) {
            atkUnit.battleContext.additionalDamage += atkUnit.getBuffTotalInCombat(defUnit);
        }

        if (defUnit.hasStatusEffect(StatusEffectType.Exposure)) {
            atkUnit.battleContext.additionalDamage += 10;
        }

        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
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
                    if (DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat) > DamageCalculatorWrapper.__getAtk(defUnit, atkUnit, isPrecombat)) {
                        atkUnit.battleContext.additionalDamage += 5;
                    }
                    break;
                case PassiveA.FlashingBlade4:
                    if (DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat) > DamageCalculatorWrapper.__getSpd(defUnit, atkUnit, isPrecombat)) {
                        atkUnit.battleContext.additionalDamage += 5;
                    }
                    break;
                case PassiveA.HashinDanryuKen:
                    {
                        let atk = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.25);
                    }
                    break;
                case Weapon.ChaosManifest:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit) && !isPrecombat) {
                            let debuffTotal = defUnit.debuffTotal;
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 2)) {
                                debuffTotal = Math.min(debuffTotal, unit.debuffTotal);
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
                        atkUnit.battleContext.additionalDamage +=
                            DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                                atkUnit, defUnit, isPrecombat,
                                x => x.getEvalSpdInPrecombat(),
                                (x, y) => x.getEvalSpdInCombat(y),
                                0.7,
                                7
                            );
                    }
                    break;
                case Weapon.ShurikenCleaverPlus:
                case Weapon.NinjaNaginataPlus:
                case Weapon.NinjaYumiPlus:
                    if (atkUnit.battleContext.initiatesCombat) {
                        atkUnit.battleContext.additionalDamage +=
                            DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                                atkUnit, defUnit, isPrecombat,
                                x => x.getEvalSpdInPrecombat(),
                                (x, y) => x.getEvalSpdInCombat(y),
                                0.5,
                                4
                            );
                    }
                    break;
                case Weapon.MakenMistoruthin:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (defUnit.restHpPercentage >= 75) {
                            if (isPrecombat) {
                                atkUnit.battleContext.additionalDamage += 7;
                            }
                            else {
                                atkUnit.battleContext.additionalDamageOfSpecial += 7;
                            }
                        }
                    }
                    break;
                case Weapon.Luin:
                    if (atkUnit.battleContext.initiatesCombat
                        || this.__isThereAllyInSpecifiedSpaces(atkUnit, 2)
                    ) {
                        atkUnit.battleContext.additionalDamage +=
                            floorNumberWithFloatError(DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat) * 0.2);
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
                case Weapon.ZeroNoGyakukyu:
                    {
                        let def = 0;
                        let res = 0;
                        if (isPrecombat) {
                            def = defUnit.getDefInPrecombat();
                            res = defUnit.getResInPrecombat();
                        }
                        else {
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
                case Weapon.LevinDagger:
                    {
                        if (!isPrecombat) {
                            let value = 0;
                            value = atkUnit.getResInCombat(defUnit);
                            atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.2);
                        }
                    }
                    break;
                case Weapon.SatougashiNoAnki:
                    if (atkUnit.battleContext.initiatesCombat) {
                        let value = 0;
                        if (isPrecombat) {
                            value = atkUnit.getSpdInPrecombat();
                        }
                        else {
                            value = atkUnit.getSpdInCombat(defUnit);
                        }
                        atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.1);
                    }
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (isPrecombat) {
                            if (defUnit.isRestHpFull) {
                                atkUnit.battleContext.additionalDamage += 7;
                            }
                        }
                        else {
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
                case Weapon.NewFoxkitFang:
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalResInPrecombat(),
                        (x, y) => x.getEvalResInCombat(y),
                        0.7, 7);
                    break;
                case Weapon.KenhimeNoKatana:
                    if (atkUnit.isWeaponRefined) {
                        atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.15);
                    } else {
                        atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                            atkUnit, defUnit, isPrecombat,
                            x => x.getEvalSpdInPrecombat(),
                            (x, y) => x.getEvalSpdInCombat(y),
                            0.7, 7);
                    }
                    break;
                case Weapon.KarasuOuNoHashizume:
                    if (!atkUnit.isWeaponRefined) {
                        atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                            atkUnit, defUnit, isPrecombat,
                            x => x.getEvalSpdInPrecombat(),
                            (x, y) => x.getEvalSpdInCombat(y), 0.7, 7);
                    } else {
                        if (atkUnit.battleContext.initiatesCombat || defUnit.battleContext.restHpPercentage >= 75) {
                            atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.15);
                        }
                    }
                    break;
                case Weapon.NewBrazenCatFang:
                case Weapon.AkaiAhiruPlus:
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y), 0.7, 7);
                    break;
                case Weapon.GigaExcalibur:
                    if (atkUnit.isWeaponRefined) {
                        atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.2);
                    } else {
                        atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                            atkUnit, defUnit, isPrecombat,
                            x => x.getEvalSpdInPrecombat(),
                            (x, y) => x.getEvalSpdInCombat(y),
                            0.7, 7);
                    }
                    break;
                case Weapon.KieiWayuNoKen:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                            atkUnit, defUnit, isPrecombat,
                            x => x.getEvalSpdInPrecombat(),
                            (x, y) => x.getEvalSpdInCombat(y),
                            0.7, 7);
                    }
                    break;
                case Weapon.RefreshedFang:
                    if (defUnit.battleContext.restHpPercentage >= 75) {
                        atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                            atkUnit, defUnit, isPrecombat,
                            x => x.getEvalSpdInPrecombat(),
                            (x, y) => x.getEvalSpdInCombat(y),
                            0.7, 7);
                    }
                    break;
                case Weapon.ResolvedFang:
                    if (defUnit.battleContext.restHpPercentage >= 75) {
                        atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent(
                            atkUnit, defUnit, isPrecombat,
                            x => x.getEvalDefInPrecombat(),
                            (x, y) => x.getEvalDefInCombat(y),
                            0.7, 7);
                    }
                    break;
                default:
                    break;
            }
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
        }
        else {
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
        let result = DamageCalculationUtility.examinesCanFollowupAttack(atkUnit, defUnit);
        if (result) {
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが5以上高いので追撃可能");
        }
        else {
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
                    case Weapon.WhitedownSpear:
                        if (this.__countUnit(atkUnit.groupId, x => x.isOnMap && x.moveType === MoveType.Flying) >= 3) {
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

        if (atkUnit.isTransformed) {
            switch (BeastCommonSkillMap.get(atkUnit.weapon)) {
                case BeastCommonSkillType.Cavalry:
                    --followupAttackPriority;
                    break;
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

    canCounterAttack(atkUnit, defUnit) {
        return DamageCalculatorWrapper.__examinesCanCounterattackBasically(atkUnit, defUnit)
            && !this.__canDisableCounterAttack(atkUnit, defUnit);
    }

    __canDisableCounterAttack(atkUnit, defUnit) {
        // defUnitが見切り・反撃効果を持っている場合(falseを返す場合)
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
                            if (defUnit.color === ColorType.Blue || defUnit.hasNegativeStatusEffect()) {
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
                case Weapon.SurvivalistBow:
                    if (atkUnit.battleContext.isSolo && defUnit.battleContext.restHpPercentage >= 80) {
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
                        if (atkUnit.battleContext.restHpPercentage >= 50
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

    static __examinesCanCounterattackBasically(atkUnit, defUnit) {
        if (!defUnit.hasWeapon) {
            return false;
        }

        if (defUnit.battleContext.canCounterattackToAllDistance) {
            return true;
        }

        if (atkUnit.attackRange === defUnit.attackRange) {
            return true;
        }

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
        }
        else if (atkUnit.isMeleeWeaponType()) {
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
                    case Weapon.DoubleBow:
                        if (defUnit.battleContext.isSolo) {
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
                    case Weapon.HarukazeNoBreath:
                        if (this.__isThereAllyInSpecifiedSpaces(defUnit, 2)
                            || defUnit.isBuffed
                        ) {
                            --followupAttackPriority;
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
                    case Weapon.GeneiBattleAxe:
                        if (this.__isThereAllyInSpecifiedSpaces(defUnit, 2)) {
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

    /// 追撃可能かどうかが条件として必要なスキル効果の適用
    __applySkillEffectRelatedToFollowupAttackPossibility(targetUnit, _enemyUnit) {
        switch (targetUnit.weapon) {
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
    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {Boolean} calcPotentialDamage
     */
    __applyInvalidationSkillEffect(targetUnit, enemyUnit, calcPotentialDamage) {
        // 獣の共通武器スキル
        switch (BeastCommonSkillMap.get(targetUnit.weapon)) {
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
                case Weapon.EnclosingClaw:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
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
                case Weapon.ProfessorialGuide:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
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
                case Weapon.HolyYewfelle:
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.battleContext.invalidatesReduceCooldownCount = true;
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
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.2);
                targetUnit.battleContext.specialSufferPercentage = 20;
            }
        };

        this._applySpecialSkillEffectFuncDict[Special.LunarFlash2] = (targetUnit, enemyUnit) => {
            {
                // 月光閃・承
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.2);
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

        this._applySpecialSkillEffectFuncDict[Special.ArmoredFloe] = (targetUnit, enemyUnit) => {
            // 重装の聖氷
            {
                let totalRes = targetUnit.getResInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.4);
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.ArmoredBeacon] = (targetUnit, enemyUnit) => {
            // 重装の聖炎
            {
                let totalDef = targetUnit.getDefInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalDef * 0.4);
            }
        };

        {
            let func = (targetUnit, enemyUnit) => {
                // 緋炎
                {
                    let totalDef = targetUnit.getDefInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalDef * 0.5);
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.Hotarubi] = func;
            this._applySpecialSkillEffectFuncDict[Special.Bonfire] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.Ignis] = (targetUnit, enemyUnit) => {
            // 華炎
            {
                let totalDef = targetUnit.getDefInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalDef * 0.8);
            }
        };

        {
            let func = (targetUnit, enemyUnit) => {
                // 氷蒼
                {
                    let totalRes = targetUnit.getResInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.5);
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.Hyouten] = func;
            this._applySpecialSkillEffectFuncDict[Special.Iceberg] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.Glacies] = (targetUnit, enemyUnit) => {
            // 氷華
            {
                let totalRes = targetUnit.getResInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.8);
            }
        };

        this._applySpecialSkillEffectFuncDict[Special.HolyPressure] = (targetUnit, enemyUnit) => {
            // 重圧の聖光
            {
                let totalRes = enemyUnit.getResInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.45);
            }
        };

        {
            let func = (targetUnit, enemyUnit) => {
                {
                    let totalRes = enemyUnit.getResInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.25);
                }
            };
            // 抑制の聖光
            this._applySpecialSkillEffectFuncDict[Special.LightsRestraint] = func;
            // 恐慌の聖光
            this._applySpecialSkillEffectFuncDict[Special.HolyPanic] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.CircletOfBalance] = (targetUnit, enemyUnit) => {
            // 聖神と暗黒神の冠
            let totalRes = targetUnit.getResInCombat(enemyUnit);
            targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.4);
        }

        this._applySpecialSkillEffectFuncDict[Special.HolyKnightAura] = (targetUnit, enemyUnit) => {
            // グランベルの聖騎士
            {
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalAtk * 0.25);
            }
        };

        {
            let func = (targetUnit, enemyUnit) => {
                // 竜裂
                {
                    let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalAtk * 0.3);
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.Fukuryu] = func;
            this._applySpecialSkillEffectFuncDict[Special.DraconicAura] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.DragonFang] = (targetUnit, enemyUnit) => {
            {
                // 竜穿
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalAtk * 0.5);
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.Enclosure] = (targetUnit, enemyUnit) => {
            {
                // 閉界
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalAtk * 0.25);
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.ShiningEmblem] = (targetUnit, enemyUnit) => {
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.35);
            }
        };
        {
            let func = (targetUnit, enemyUnit) => {
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.HonoNoMonsyo] = func;
            this._applySpecialSkillEffectFuncDict[Special.HerosBlood] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.RighteousWind] = (targetUnit, enemyUnit) => {
            // 聖風
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.Sirius] = (targetUnit, enemyUnit) => {
            // 天狼
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
                targetUnit.battleContext.specialDamageRatioToHeal = 0.3;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.SiriusPlus] = (targetUnit, enemyUnit) => {
            // 天狼+
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.35);
                targetUnit.battleContext.specialDamageRatioToHeal = 0.35;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.TwinBlades] = (targetUnit, enemyUnit) => {
            // 双刃
            {
                let totalRes = targetUnit.getResInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.4);
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.RupturedSky] = (targetUnit, enemyUnit) => {
            if (isWeaponTypeBeast(enemyUnit.weaponType) || isWeaponTypeBreath(enemyUnit.weaponType)) {
                targetUnit.battleContext.specialAddDamage = Math.trunc(enemyUnit.getAtkInCombat(targetUnit) * 0.4);
            }
            else {
                targetUnit.battleContext.specialAddDamage = Math.trunc(enemyUnit.getAtkInCombat(targetUnit) * 0.2);
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.SublimeHeaven] = (targetUnit, enemyUnit) => {
            if (isWeaponTypeBeast(enemyUnit.weaponType) || isWeaponTypeBreath(enemyUnit.weaponType)) {
                targetUnit.battleContext.specialAddDamage = Math.trunc(targetUnit.getAtkInCombat(enemyUnit) * 0.5);
            }
            else {
                targetUnit.battleContext.specialAddDamage = Math.trunc(targetUnit.getAtkInCombat(enemyUnit) * 0.25);
            }
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        };

        this._applySpecialSkillEffectFuncDict[Special.DevinePulse] = (targetUnit, enemyUnit) => {
            {
                // 天刻の拍動
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.25);
            }
        }

        this._applySpecialSkillEffectFuncDict[Special.VitalAstra] = (targetUnit, enemyUnit) => {
            let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
            targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
        };
        {
            let func = (targetUnit, enemyUnit) => {
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.4);
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.RegnalAstra] = func;
            this._applySpecialSkillEffectFuncDict[Special.ImperialAstra] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.OpenTheFuture] = (targetUnit, enemyUnit) => {
            {
                let totalDef = targetUnit.getDefInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalDef * 0.5);
                targetUnit.battleContext.specialDamageRatioToHeal = 0.25;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.BlueFrame] = (targetUnit) => {
            targetUnit.battleContext.specialAddDamage = 10;
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.specialAddDamage += 15;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.BrutalShell] = (targetUnit) => {
            targetUnit.battleContext.specialSufferPercentage = 50;
        }
        this._applySpecialSkillEffectFuncDict[Special.SeidrShell] = (targetUnit) => {
            targetUnit.battleContext.specialAddDamage += 15;
        };
    }

    __applySpecialSkillEffect(targetUnit, enemyUnit) {
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

        if (!atkUnit.canDisableAttackOrderSwapSkill(atkUnit.battleContext.restHpPercentage, defUnit)
            && !defUnit.canDisableAttackOrderSwapSkill(defUnit.battleContext.restHpPercentage, atkUnit)
        ) {
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
        }
        else {
            atkUnit.battleContext.isDesperationActivated = false;
            defUnit.battleContext.isVantageActivated = false;
        }
    }

    __setBothOfAtkDefSkillEffetToContext(targetUnit, enemyUnit) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.SparklingSun:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        if (enemyUnit.battleContext.canFollowupAttack) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(75 / 100.0, enemyUnit);
                        }
                    }
                    break;
                case Weapon.MagetsuNoSaiki:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.isOddTurn || enemyUnit.battleContext.restHpPercentage < 100) {
                            let percentage = enemyUnit.battleContext.canFollowupAttack ? 60 : 30;
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(percentage / 100.0, enemyUnit);
                        }
                    }
                    break;
                case Weapon.StarlightStone:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        if (enemyUnit.battleContext.canFollowupAttack) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(75 / 100.0, enemyUnit);
                        }
                    }
                    break;
                case Weapon.MaryuNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            if (enemyUnit.battleContext.canFollowupAttack) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.70, enemyUnit);
                            }
                        }
                    }
                    break;
                case Weapon.SeaSearLance:
                case Weapon.LoyalistAxe:
                    if ((enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) &&
                        enemyUnit.battleContext.canFollowupAttack) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.75, enemyUnit);
                    }
                    break;
                case Weapon.Hrist:
                    if (targetUnit.battleContext.restHpPercentage <= 99) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                    break;
                case Weapon.StoutLancePlus:
                case Weapon.StoutAxePlus:
                case Weapon.CourtlyMaskPlus:
                case Weapon.CourtlyBowPlus:
                case Weapon.CourtlyCandlePlus:
                    if (targetUnit.battleContext.restHpPercentage >= 50 && enemyUnit.battleContext.canFollowupAttack) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
                    }
                    break;
                case Weapon.SummerStrikers:
                    if (targetUnit.battleContext.initiatesCombat && targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.75, enemyUnit);
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
     * @returns {Unit[]}
     */
    enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit);
    }
    /**
     * @param  {Unit} targetUnit
     * @param  {Number} spaces
     * @returns {Unit[]}
     */
    enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        return this._unitManager.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces);
    }
    /**
     * @param  {Unit} unit
     * @param  {Boolean} withTargetUnit=false
     * @returns {Unit[]}
     */
    enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit);
    }

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

    __isThereAnyAllyUnit(unit, conditionFunc) {
        return this._unitManager.isThereAnyUnitInTheSameGroupOnMap(unit, conditionFunc);
    }

    __isNear(unitA, unitB, nearRange) {
        return unitA.isWithinSpecifiedDistanceFrom(unitB, nearRange);
    }

    __isInCloss(unitA, unitB) {
        return unitB.isInClossOf(unitA);
    }

    // 自身を中心とした縦〇列と横〇列
    __isInClossWithOffset(unitA, unitB, offset) {
        return unitB.isInClossWithOffset(unitA, offset);
    }

    __isTherePartnerInSpace3(unit) {
        return this.__isThereAnyAllyUnit(unit,
            x => unit.calculateDistanceToUnit(x) <= 3
                && unit.partnerHeroIndex === x.heroIndex);
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
                case PassiveC.SoaringGuidance: {
                    let moveType = targetUnit.moveType;
                    if (moveType === MoveType.Infantry || moveType === MoveType.Flying) {
                        targetUnit.addAtkSpdSpurs(3);
                    }
                }
                    break;
                case PassiveC.Guidance4: {
                    let moveType = targetUnit.moveType;
                    if (moveType === MoveType.Infantry || moveType === MoveType.Armor) {
                        targetUnit.addAtkSpdSpurs(3);
                    }
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
            case Weapon.SpearOfAssal:
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
                break;
            case Weapon.DanielMadeBow:
                targetUnit.atkSpur += 5;
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
     * @param  {Unit} targetUnit
     * @param  {boolean} calcPotentialDamage=false
     * @param  {boolean} ignoresSkillEffectFromAllies=false
     * @param  {boolean} ignoreSkillEffectFromEnemies=false
     */
    updateUnitSpur(targetUnit, calcPotentialDamage = false, enemyUnit = null) {
        let self = this;
        this.profiler.profile("updateUnitSpur", () => {
            self.__updateUnitSpur(targetUnit, calcPotentialDamage, enemyUnit);
        });
    }

    /**
     * @param  {Unit} targetUnit
     * @param  {boolean} calcPotentialDamage
     * @param  {Unit} enemyUnit
     */
    __updateUnitSpur(targetUnit, calcPotentialDamage, enemyUnit = null) {
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
            this.__updateUnitSpurFromEnemies(targetUnit, calcPotentialDamage, enemyUnit);
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
                case Weapon.Thirufingu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
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
                    case Weapon.SpearOfAssal:
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
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
                case Weapon.SurvivalistBow:
                    targetUnit.atkSpur += 6;
                    targetUnit.spdSpur += 6;
                    break;
                case Weapon.DoubleBow:
                    targetUnit.addAllSpur(5);
                    break;
                case Weapon.GousouJikumunto:
                    if (!targetUnit.isWeaponRefined) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.MaritaNoKen:
                    targetUnit.addAllSpur(4);
                    break;
                case Weapon.ShirejiaNoKaze:
                case Weapon.VengefulLance:
                    targetUnit.atkSpur += 6; targetUnit.spdSpur += 6;
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
                        case Weapon.AstralBreath:
                            if (this.__isTherePartnerInSpace3(targetUnit)) {
                                targetUnit.addAllSpur(5);
                            }
                            break;
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

    __updateUnitSpurFromEnemies(targetUnit, calcPotentialDamage, enemyUnit) {
        let disablesSkillsFromEnemiesInCombat = false;
        if (enemyUnit) {
            if (enemyUnit.hasStatusEffect(StatusEffectType.Feud) ||
                targetUnit.battleContext.disablesSkillsFromEnemiesInCombat) {
                disablesSkillsFromEnemiesInCombat = true;
            }
        }
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
            if (disablesSkillsFromEnemiesInCombat && (unit !== enemyUnit)) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, unit)) {
                continue;
            }
            // 十字方向
            if (this.__isInCloss(unit, targetUnit)) {
                for (let skillId of unit.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.FlowerOfSorrow:
                            targetUnit.addSpurs(0, 0, -4, -4);
                            break;
                    }
                }
            }
            // 縦3列以内
            if (Math.abs(targetUnit.posX - unit.posX) <= 1) {
                switch (unit.weapon) {
                    case Weapon.FlowerOfEase:
                        if (targetUnit.hasNegativeStatusEffect()) {
                            targetUnit.addSpurs(-3, 0, -3, -3);
                        }
                        break;
                }
            }
            // 縦3列と横3列
            if (Math.abs(targetUnit.posX - unit.posX) <= 1 ||
                Math.abs(targetUnit.posY - unit.posY) <= 1) {
                for (let skillId of unit.enumerateSkills()) {
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

        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 3)) {
            if (disablesSkillsFromEnemiesInCombat && (unit !== enemyUnit)) {
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

        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 2)) {
            if (disablesSkillsFromEnemiesInCombat && (unit !== enemyUnit)) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, unit)) {
                continue;
            }
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
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
                    case Weapon.DanielMadeBow:
                        targetUnit.atkSpur -= 5;
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
                        targetUnit.atkSpur -= 4;
                        targetUnit.spdSpur -= 4;
                        targetUnit.defSpur -= 4;
                        targetUnit.resSpur -= 4;
                        break;
                }
            }
        }
    }

    __updateUnitSpurFromAllies(targetUnit, calcPotentialDamage, enemyUnit) {
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }
        if (enemyUnit && enemyUnit.battleContext.disablesSkillsFromEnemiesInCombat) {
            return;
        }
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(enemyUnit, targetUnit, unit)) {
                continue;
            }
            // 距離に関係ないもの
            for (let skillId of unit.enumerateSkills()) {
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
                        case Weapon.DaichiBoshiNoBreath: {
                            let amount = unit.isWeaponRefined ? 4 : 2;
                            targetUnit.addAllSpur(amount);
                        }
                            break;
                    }
                }
            }

            if (this.__isNear(unit, targetUnit, 4)) {
                // 4マス以内で発動する戦闘中バフ
                for (let skillId of unit.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.DivineBreath:
                            if (unit.isWeaponRefined) {
                                if (isWeaponTypeBreath(targetUnit.weaponType) ||
                                    targetUnit.hasEffective(EffectiveType.Dragon)) {
                                    targetUnit.addAllSpur(3);
                                }
                            }
                            break;
                    }
                }
            }

            if (this.__isNear(unit, targetUnit, 3)) {
                // 3マス以内で発動する戦闘中バフ
                for (let skillId of unit.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.JunaruSenekoNoTsumekiba:
                            if (unit.isWeaponRefined) {
                                targetUnit.addSpurs(4, 4, 0, 0);
                            }
                            break;
                        case Weapon.FirstDreamBow:
                            targetUnit.atkSpur += 4;
                            break;
                        case Weapon.Hlidskjalf:
                            if (unit.isWeaponSpecialRefined) {
                                targetUnit.atkSpur += 3;
                                targetUnit.spdSpur += 3;
                            }
                            break;
                        case Weapon.GaeBolg:
                            if (unit.isWeaponSpecialRefined) {
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
                for (let skillId of unit.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.BondOfTheAlfar:
                            targetUnit.atkSpur += 6;
                            break;
                        case Weapon.FlowerOfJoy:
                            if (!unit.isWeaponRefined) {
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

            if (this.__isInClossWithOffset(unit, targetUnit, 1)) {
                for (let skillId of unit.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.ChargingHorn:
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
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

    __canDisableSkillsFrom(targetUnit, enemyUnit, allyUnit) {
        if (targetUnit.battleContext.disablesSkillsFromRedEnemiesInCombat &&
            allyUnit.color === ColorType.Red) {
            return true;
        }
        if (targetUnit.battleContext.disablesSkillsFromBlueEnemiesInCombat &&
            allyUnit.color === ColorType.Blue) {
            return true;
        }
        if (targetUnit.battleContext.disablesSkillsFromGreenEnemiesInCombat &&
            allyUnit.color === ColorType.Green) {
            return true;
        }
        if (targetUnit.battleContext.disablesSkillsFromColorlessEnemiesInCombat &&
            allyUnit.color === ColorType.Colorless) {
            return true;
        }
        return false;
    }

    __applyPreUpdateUnitSpurSkillEffects(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Captain.AdroitCaptain:
                    targetUnit.battleContext.disablesSkillsFromEnemiesInCombat = true;
                    break;
                case Weapon.Queensblade:
                    targetUnit.battleContext.disablesSkillsFromEnemiesInCombat = true;
                    enemyUnit.battleContext.disablesSkillsFromEnemiesInCombat = true;
                    break;
                case Weapon.ShikkyuMyurugure:
                    if (targetUnit.isWeaponRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3) || calcPotentialDamage) {
                            targetUnit.battleContext.disablesSkillsFromEnemiesInCombat = true;
                        }
                    }
                    break;
                case PassiveC.ImpenetrableDark:
                case PassiveC.ImpenetrableVoid:
                    targetUnit.battleContext.disablesSkillsFromEnemiesInCombat = true;
                    break;
                case PassiveC.RedFeud3:
                    if (enemyUnit.color === ColorType.Red) {
                        targetUnit.battleContext.disablesSkillsFromEnemiesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromRedEnemiesInCombat = true;
                    break;
                case PassiveC.BlueFeud3:
                    if (enemyUnit.color === ColorType.Blue) {
                        targetUnit.battleContext.disablesSkillsFromEnemiesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromBlueEnemiesInCombat = true;
                    break;
                case PassiveC.GreenFeud3:
                    if (enemyUnit.color === ColorType.Green) {
                        targetUnit.battleContext.disablesSkillsFromEnemiesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromGreenEnemiesInCombat = true;
                    break;
                case PassiveC.CFeud3:
                    if (enemyUnit.color === ColorType.Colorless) {
                        targetUnit.battleContext.disablesSkillsFromEnemiesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromColorlessEnemiesInCombat = true;
                    break;
            }
        }
    }
}
