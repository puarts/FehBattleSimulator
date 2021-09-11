
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

class DamageCalculatorWrapper {
    /// @param {UnitManager} unitManager ユニットマネージャーのインスタンス
    constructor(unitManager, map, globalBattleContext) {
        this._unitManager = unitManager;
        this.map = map;
        this.globalBattleContext = globalBattleContext;
        this._damageCalc = new DamageCalculator();
        this.profiler = new PerformanceProfile();

        // 高速化用
        this._applySkillEffectForAtkUnitFuncDict = {};
        this._applySkillEffectForDefUnitFuncDict = {};
        this._applySkillEffectForUnitFuncDict = {};

        this.__init__applySkillEffectForAtkUnitFuncDict();
        this.__init__applySkillEffectForDefUnitFuncDict();
        this.__init__applySkillEffectForUnitFuncDict();
    }

    // ログ関連のAPIがとっ散らかってるので、Logger的なものを作って一元管理したい
    get log() {
        return this._damageCalc.log;
    }

    get simpleLog() {
        return this._damageCalc.simpleLog;
    }

    get rawLog() {
        return this._damageCalc.rawLog;
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

    set isLogEnabled(value) {
        this._damageCalc.isLogEnabled = value;
    }

    clearLog() {
        this._damageCalc.clearLog();
    }

    writeDebugLog(message) {
        this._damageCalc.writeDebugLog(message);
    }

    /**
     * 戦闘のダメージを計算します。
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Tile} tileToAttack=null
     * @param  {boolean} calcPotentialDamage=false
     */
    calcDamage(
        atkUnit,
        defUnit,
        tileToAttack = null,
        calcPotentialDamage = false
    ) {
        let self = this;
        let origTile = atkUnit.placedTile;
        let isUpdateSpurRequired = true; // 戦闘中強化をリセットするために必ず必要

        // self.profile.profile("pre calcPrecombatSpecialResult", () => {

        // self.profile.profile("pre calcPrecombatSpecialResult 1", () => {
        atkUnit.battleContext.clear();
        defUnit.battleContext.clear();
        atkUnit.battleContext.hpBeforeCombat = atkUnit.hp;
        defUnit.battleContext.hpBeforeCombat = defUnit.hp;
        atkUnit.battleContext.initiatesCombat = true;
        defUnit.battleContext.initiatesCombat = false;

        if (tileToAttack != null) {
            // 攻撃ユニットの位置を一時的に変更
            // self.writeDebugLogLine(atkUnit.getNameWithGroup() + "の位置を(" + tileToAttack.posX + ", " + tileToAttack.posY + ")に変更");
            tileToAttack.setUnit(atkUnit);

            isUpdateSpurRequired = true;
        }

        if (isUpdateSpurRequired) {
            self.updateUnitSpur(atkUnit, calcPotentialDamage);
            self.updateUnitSpur(defUnit, calcPotentialDamage);
        }
        // });


        // self.profile.profile("pre calcPrecombatSpecialResult 2", () => {
        // 戦闘前奥義の計算に影響するマップ関連の設定
        {
            atkUnit.battleContext.isOnDefensiveTile = atkUnit.isOnMap && atkUnit.placedTile.isDefensiveTile;
            defUnit.battleContext.isOnDefensiveTile = defUnit.isOnMap && defUnit.placedTile.isDefensiveTile;
        }

        atkUnit.saveCurrentHpAndSpecialCount();
        defUnit.saveCurrentHpAndSpecialCount();
        // });
        // self.profile.profile("pre calcPrecombatSpecialResult 3", () => {
        atkUnit.createSnapshot();
        defUnit.createSnapshot();
        // });
        // });

        self.clearLog();

        // 戦闘前ダメージ計算
        let preCombatDamage = 0;
        // self.profile.profile("calcPrecombatSpecialResult", () => {
        // 範囲奥義と戦闘中のどちらにも効くスキル効果の適用
        self.__applySkillEffectForPrecombatAndCombat(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectForPrecombatAndCombat(defUnit, atkUnit, calcPotentialDamage);

        if (!calcPotentialDamage) {
            preCombatDamage = self.calcPrecombatSpecialResult(atkUnit, defUnit);
        }
        // });

        let actualDefUnit = defUnit;
        // self.profile.profile("pre calcCombatResult", () => {
        atkUnit.battleContext.clearPrecombatState();
        defUnit.battleContext.clearPrecombatState();

        // 戦闘開始時の状態を保存
        atkUnit.createSnapshot();
        defUnit.createSnapshot();

        if (!calcPotentialDamage) {
            let saverUnit = self.__getSaverUnitIfPossible(atkUnit, defUnit);
            if (saverUnit != null) {
                // 戦闘後効果の適用処理が間に挟まるので、restoreOriginalTile() はこの関数の外で行わなければならない
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
                self.updateAllUnitSpur(calcPotentialDamage);
            }
        }
        // });

        let result;
        result = self.calcCombatResult(atkUnit, actualDefUnit, calcPotentialDamage);

        result.preCombatDamage = preCombatDamage;

        // self.profile.profile("post calcCombatResult", () => {
        if (tileToAttack != null) {
            // ユニットの位置を元に戻す
            setUnitToTile(atkUnit, origTile);
        }

        // 計算のために変更した紋章値をリセット
        if (isUpdateSpurRequired) {
            self.updateAllUnitSpur();
        }
        // });
        return result;
    }

    calcPrecombatSpecialDamage(atkUnit, defUnit) {
        return this._damageCalc.calcPrecombatSpecialDamage(atkUnit, defUnit);
    }

    calcPrecombatSpecialResult(atkUnit, defUnit) {
        // 戦闘前ダメージ計算に影響するスキル効果の評価
        this.__applySkillEffectForPrecombat(atkUnit, defUnit);
        this.__applySkillEffectForPrecombat(defUnit, atkUnit);
        this.__applyPrecombatSpecialDamageMult(atkUnit);
        this.__applyPrecombatDamageReductionRatio(defUnit, atkUnit);
        this.__calcFixedAddDamage(atkUnit, defUnit, true);

        return this._damageCalc.calcPrecombatSpecialResult(atkUnit, defUnit);
    }

    calcCombatResult(atkUnit, defUnit, calcPotentialDamage) {
        let self = this;


        // self.profile.profile("__applySkillEffect", () => {
        self.__applyImpenetrableDark(atkUnit, defUnit, calcPotentialDamage);
        self.__applyImpenetrableDark(defUnit, atkUnit, calcPotentialDamage);

        self.__applySkillEffect(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectForUnit(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectForUnit(defUnit, atkUnit, calcPotentialDamage);

        self.__applySkillEffectRelatedToEnemyStatusEffects(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectRelatedToEnemyStatusEffects(defUnit, atkUnit, calcPotentialDamage);
        // });


        // 紋章を除く味方ユニットからの戦闘中バフ
        // self.profile.profile("__applySkillEffectFromAllies", () => {
        self.__applySkillEffectForAttackerAndDefenderFromAllies(atkUnit, defUnit);
        self.__applySkillEffectFromAllies(atkUnit, defUnit, calcPotentialDamage);
        self.__applySkillEffectFromAllies(defUnit, atkUnit, calcPotentialDamage);
        // });

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
            self.__applyInvalidationSkillEffect(atkUnit, defUnit);
            self.__applyInvalidationSkillEffect(defUnit, atkUnit);
        }

        // 奥義
        {
            self.__applySpecialSkillEffect(atkUnit, defUnit);
            self.__applySpecialSkillEffect(defUnit, atkUnit);
        }

        // 間接的な設定から実際に戦闘で利用する値を評価して戦闘コンテキストに設定
        self.__setSkillEffetToContext(atkUnit, defUnit);
        // });

        let result;
        // self.profile.profile("_damageCalc.calcCombatResult", () => {
        result = self._damageCalc.calcCombatResult(atkUnit, defUnit);
        // });
        return result;
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

    __canActivateSaveSkill(atkUnit, unit) {
        switch (unit.passiveC) {
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

        return false;
    }

    __applyPrecombatDamageReductionRatio(defUnit, atkUnit) {
        switch (defUnit.weapon) {
            case Weapon.LilacJadeBreath:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.snapshot.restHpPercentage === 100) {
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.4);
                }
                break;
            case Weapon.Areadbhar:
                {
                    let diff = defUnit.getEvalSpdInPrecombat() - atkUnit.getEvalSpdInPrecombat();
                    if (diff > 0 && defUnit.snapshot.restHpPercentage >= 25) {
                        let percentage = Math.min(diff * 4, 40);
                        defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(percentage / 100.0);
                    }
                }
                break;
            case Weapon.GiltGoblet:
                if (atkUnit.snapshot.restHpPercentage === 100 && isRangedWeaponType(atkUnit.weaponType)) {
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.5);
                }
                break;
            case Weapon.BloodTome:
                if (isRangedWeaponType(atkUnit.weaponType)) {
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.8);
                }
                break;
            case Weapon.EtherealBreath:
                {
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.8);
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
                if (defUnit.snapshot.restHpPercentage >= 25) {
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
        }
        switch (defUnit.passiveB) {
            case PassiveB.DragonWall3:
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
            case PassiveB.MoonTwinWing:
                if (defUnit.snapshot.restHpPercentage >= 25) {
                    let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                }
                break;
            case PassiveB.Bushido2:
            case PassiveB.Frenzy3:
            case PassiveB.Spurn3:
            case PassiveB.KaihiIchigekiridatsu3:
            case PassiveB.KaihiTatakikomi3:
                {
                    let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
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
        }

        if (defUnit.hasStatusEffect(StatusEffectType.Dodge)) {
            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
        }
    }

    __applyPrecombatSpecialDamageMult(atkUnit) {
        switch (atkUnit.special) {
            case Special.BlazingFlame:
            case Special.BlazingWind:
            case Special.BlazingLight:
            case Special.BlazingThunder:
                {
                    atkUnit.battleContext.precombatSpecialDamageMult = 1.5;
                }
                break;
            case Special.RisingFrame:
            case Special.RisingLight:
            case Special.RisingWind:
            case Special.RisingThunder:
            case Special.GrowingFlame:
            case Special.GrowingWind:
            case Special.GrowingLight:
            case Special.GrowingThunder:
                {
                    atkUnit.battleContext.precombatSpecialDamageMult = 1.0;
                }
                break;
            case Special.GiftedMagic:
                {
                    atkUnit.battleContext.precombatSpecialDamageMult = 0.8;
                }
                break;
            default:
                break;
        }
    }

    /// 戦闘前奥義のみの効果の実装
    __applySkillEffectForPrecombat(targetUnit, enemyUnit) {
        switch (targetUnit.weapon) {
            case Weapon.Luin:
                if (targetUnit.battleContext.initiatesCombat
                    || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                ) {
                    targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getSpdInPrecombat() * 0.2);
                }
                break;
        }
    }

    __setBattleContextRelatedToMap(targetUnit, enemyUnit, calcPotentialDamage) {
        targetUnit.battleContext.isOnDefensiveTile = targetUnit.placedTile.isDefensiveTile;
    }

    __canDisableSkillEffectsFromEnemiesExceptAttackTarget(targetUnit, enemyUnit, calcPotentialDamage) {
        switch (targetUnit.weapon) {
            case Weapon.ShikkyuMyurugure:
                if (targetUnit.isWeaponRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3) || calcPotentialDamage) {
                        return true;
                    }
                }
                break;
        }
        switch (targetUnit.passiveC) {
            case PassiveC.ImpenetrableDark:
                return true;
        }
        return false;
    }

    __applyImpenetrableDark(targetUnit, enemyUnit, calcPotentialDamage) {
        if (this.__canDisableSkillEffectsFromEnemiesExceptAttackTarget(targetUnit, enemyUnit, calcPotentialDamage)) {
            this.updateUnitSpur(enemyUnit, calcPotentialDamage, true);
        }
    }

    /// 戦闘順入れ替えスキルを適用します。
    __applyChangingAttackPrioritySkillEffects(atkUnit, defUnit) {
        {
            switch (defUnit.weapon) {
                case Weapon.Urvan:
                    {
                        if (defUnit.isWeaponSpecialRefined) {
                            // 敵に攻め立て強制
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
            }

            switch (defUnit.passiveB) {
                case PassiveB.HolyWarsEnd:
                    if (defUnit.snapshot.restHpPercentage >= 50) {
                        defUnit.battleContext.isDefDesperationActivatable = true;
                    }
                    break;
            }
        }

        {
            switch (atkUnit.weapon) {
                case Weapon.NewDawn:
                case Weapon.Thunderbrand:
                    if (defUnit.snapshot.restHpPercentage >= 50) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.TalreganAxe:
                    atkUnit.battleContext.isDesperationActivatable = true;
                    break;
                case Weapon.DarkSpikesT:
                    if (atkUnit.snapshot.restHpPercentage <= 99) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.Forusethi:
                    if (atkUnit.isWeaponRefined) {
                        if (atkUnit.snapshot.restHpPercentage >= 25) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    else {
                        if (atkUnit.snapshot.restHpPercentage >= 50) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case Weapon.YonkaiNoSaiki:
                case Weapon.AnkokuNoKen:
                    if (atkUnit.snapshot.restHpPercentage >= 50) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.SoulCaty:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.snapshot.restHpPercentage <= 75) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    else {
                        if (atkUnit.snapshot.restHpPercentage <= 50) {
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
                    if (atkUnit.snapshot.restHpPercentage <= 75) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.IhoNoHIken:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.snapshot.restHpPercentage <= 75) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case Weapon.HigaimosoNoYumi:
                    if (atkUnit.hasNegativeStatusEffect()
                        || !atkUnit.snapshot.isRestHpFull
                    ) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
            }
            switch (atkUnit.passiveB) {
                case PassiveB.YngviAscendant:
                    atkUnit.battleContext.isDesperationActivatable = true;
                    break;
                case PassiveB.Frenzy3:
                    if (atkUnit.snapshot.restHpPercentage <= 50) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.KyusyuTaikei3:
                    atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    if (atkUnit.snapshot.restHpPercentage <= 80) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.DiveBomb3:
                    if (atkUnit.snapshot.restHpPercentage >= 80 && defUnit.snapshot.restHpPercentage >= 80) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.KillingIntent:
                    {
                        if (defUnit.snapshot.restHpPercentage < 100 || defUnit.hasNegativeStatusEffect()) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case PassiveB.SphiasSoul:
                case PassiveB.Desperation3: // 攻め立て3
                    if (atkUnit.snapshot.restHpPercentage <= 75) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
            }

        }
    }

    __init__applySkillEffectForAtkUnitFuncDict() {
        let self = this;
        self._applySkillEffectForAtkUnitFuncDict[Weapon.InstantLancePlus] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 4;
            atkUnit.defSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.CourtlyFanPlus] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 5;
            atkUnit.spdSpur += 5;
            atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.BenihimeNoOno] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (atkUnit.isWeaponSpecialRefined) {
                if (defUnit.snapshot.restHpPercentage == 100) {
                    atkUnit.atkSpur += 5;
                    atkUnit.defSpur += 5;
                    atkUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KurooujiNoYari] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (defUnit.snapshot.restHpPercentage == 100) {
                atkUnit.atkSpur += 5;
                atkUnit.defSpur += 5;
                atkUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.SummerStrikers] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (atkUnit.snapshot.restHpPercentage >= 25) {
                atkUnit.atkSpur += 5;
                atkUnit.spdSpur += 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.HewnLance] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 4;
                atkUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.WhitedownSpear] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (self.__countUnit(atkUnit.groupId, x => x.isOnMap && x.moveType == MoveType.Flying) >= 3) {
                defUnit.atkSpur -= 4;
                defUnit.defSpur -= 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveB.BeliefInLove] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (defUnit.snapshot.restHpPercentage == 100) {
                defUnit.atkSpur -= 5;
                defUnit.defSpur -= 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.SatougashiNoAnki] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.spdSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.RinkahNoOnikanabo] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (atkUnit.snapshot.restHpPercentage < 100) {
                atkUnit.atkSpur += 5;
                atkUnit.defSpur += 5;
                atkUnit.battleContext.increaseCooldownCountForDefense = true;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KokyousyaNoYari] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (defUnit.snapshot.restHpPercentage >= 70) {
                atkUnit.atkSpur += 5;
                atkUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.HadesuOmega] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 4;
            atkUnit.spdSpur += 4;
            if (atkUnit.hasSpecial && atkUnit.tmpSpecialCount == 0) {
                atkUnit.atkSpur += 6;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.ZekkaiNoSoukyu] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (defUnit.snapshot.restHpPercentage == 100) {
                atkUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.GeneiFeather] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (self.__isThereAnyAllyUnit(atkUnit, x => x.isActionDone)) {
                atkUnit.atkSpur += 6;
                atkUnit.spdSpur += 6;
                atkUnit.battleContext.isDesperationActivated = true;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.EishinNoAnki] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 5;
            atkUnit.spdSpur += 5;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KinranNoSyo] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.RohyouNoKnife] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) {
                atkUnit.defSpur += 20;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Paruthia] = (atkUnit, defUnit, calcPotentialDamage) => {
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
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Yatonokami] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (atkUnit.weaponRefinement == WeaponRefinementType.None) {
                atkUnit.spdSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KageroNoGenwakushin] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, defUnit);
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Sangurizuru] = (atkUnit, defUnit, calcPotentialDamage) => {
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
        self._applySkillEffectForAtkUnitFuncDict[Weapon.GeneiFalcion] = (atkUnit, defUnit, calcPotentialDamage) => {
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
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.SteadyImpact] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.spdSpur += 7;
            atkUnit.defSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.SwiftImpact] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.spdSpur += 7;
            atkUnit.resSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinKongoNoSyungeki] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 6;
            atkUnit.defSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinMeikyoNoSyungeki] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 6;
            atkUnit.resSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.BlazingDurandal] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.battleContext.increaseCooldownCountForBoth();
            atkUnit.battleContext.reducesCooldownCount = true;
            if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                atkUnit.spdSpur += 7;
                atkUnit.defSpur += 10;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Balmung] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (defUnit.snapshot.isRestHpFull) {
                atkUnit.battleContext.invalidateAllOwnDebuffs();
                atkUnit.addAllSpur(5);
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.NinissIceLance] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (!atkUnit.isWeaponRefined) {
                atkUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Forblaze] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                atkUnit.atkSpur += 6;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.HanasKatana] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                atkUnit.atkSpur += 4;
                atkUnit.spdSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Durandal] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 6;
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 4;
                atkUnit.spdSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.FurederikuNoKenfu] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 6;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.JokerNoSyokki] = (atkUnit, defUnit, calcPotentialDamage) => {
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
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.DeathBlow3] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.DeathBlow4] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 8;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki1] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.spdSpur += 2;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki2] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.spdSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki3] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.spdSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki4] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.spdSpur += 9;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KongoNoIchigeki3] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.defSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.MeikyoNoIchigeki3] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.resSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinHienNoIchigeki3] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 6; atkUnit.spdSpur += 7;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinKongoNoIchigeki2] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 4; atkUnit.defSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinMeikyoNoIchigeki2] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.atkSpur += 4; atkUnit.resSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienKongoNoIchigeki2] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.spdSpur += 4; atkUnit.defSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienMeikyoNoIchigeki2] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.spdSpur += 4; atkUnit.resSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KongoMeikyoNoIchigeki2] = (atkUnit, defUnit, calcPotentialDamage) => {
            atkUnit.defSpur += 4; atkUnit.resSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Sogun] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (defUnit.weaponType == WeaponType.Sword
                || defUnit.weaponType == WeaponType.Lance
                || defUnit.weaponType == WeaponType.Axe
                || isWeaponTypeBreath(defUnit.weaponType)) {
                atkUnit.atkSpur += 4;
                atkUnit.spdSpur += 4;
                atkUnit.defSpur += 4;
                atkUnit.resSpur += 4;
            }
        };

        {
            let func = (atkUnit, defUnit, calcPotentialDamage) => {
                defUnit.addAllSpur(-4);
            };

            self._applySkillEffectForAtkUnitFuncDict[Weapon.HelmsmanAxePlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.RauaFoxPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.BlarfoxPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.GronnfoxPlus] = func;
        }

        {
            let func = (atkUnit, defUnit, calcPotentialDamage) => {
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
            let func = (atkUnit, defUnit, calcPotentialDamage) => {
                atkUnit.atkSpur += 4;
                atkUnit.defSpur += 4;
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.AijouNoHanaNoYumiPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.BukeNoSteckPlus] = func;
        }

        {
            let func = (atkUnit, defUnit, calcPotentialDamage) => {
                if (atkUnit.isWeaponSpecialRefined) {
                    atkUnit.spdSpur += 6;
                }
            };

            self._applySkillEffectForAtkUnitFuncDict[Weapon.Toron] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.MiraiNoSeikishiNoYari] = func;
        }

        {
            let func = (atkUnit, defUnit, calcPotentialDamage) => {
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
            let func = (atkUnit, defUnit, calcPotentialDamage) => {
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
        self._applySkillEffectForDefUnitFuncDict[Weapon.Kurimuhirudo] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (self.__isThereAllyInSpecifiedSpaces(defUnit, 2)) {
                defUnit.battleContext.canCounterattackToAllDistance = true;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.TwinCrestPower] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (defUnit.isTransformed) {
                defUnit.battleContext.canCounterattackToAllDistance = true;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.ShishiouNoTsumekiba] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.addAllSpur(4);
            if (defUnit.isTransformed) {
                defUnit.battleContext.canCounterattackToAllDistance = true;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.OgonNoTanken] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (defUnit.isSpecialCharged) {
                defUnit.battleContext.canCounterattackToAllDistance = true;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.BenihimeNoOno] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 5;
                atkUnit.defSpur += 5;
                atkUnit.battleContext.increaseCooldownCountForBoth();
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.KurooujiNoYari] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 5;
            defUnit.defSpur += 5;
            defUnit.resSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveB.GuardBearing3] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (!defUnit.isOneTimeActionActivatedForPassiveB) {
                defUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, atkUnit);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.StalwartSword] = (defUnit, atkUnit, calcPotentialDamage) => {
            atkUnit.atkSpur -= 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveB.BeliefInLove] = (defUnit, atkUnit, calcPotentialDamage) => {
            atkUnit.atkSpur -= 5;
            atkUnit.defSpur -= 5;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.RinkahNoOnikanabo] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 5;
            defUnit.defSpur += 5;
            defUnit.battleContext.increaseCooldownCountForDefense = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantWard] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (!isPhysicalWeaponType(atkUnit.weaponType)) {
                defUnit.atkSpur += 5;
                defUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseWard] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (!isPhysicalWeaponType(atkUnit.weaponType)) {
                defUnit.atkSpur += 5;
                defUnit.resSpur += 5;
                defUnit.battleContext.invalidatesReferenceLowerMit = true;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.KokyousyaNoYari] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 5;
            defUnit.resSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.Vidofuniru] = (defUnit, atkUnit, calcPotentialDamage) => {
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
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.Naga] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.defSpur += 4;
                defUnit.resSpur += 4;
            }
            else {
                defUnit.defSpur += 2;
                defUnit.resSpur += 2;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.ManatsuNoBreath] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.battleContext.increaseCooldownCountForDefense = true;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.FurorinaNoSeisou] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (atkUnit.weaponType == WeaponType.Sword
                || atkUnit.weaponType == WeaponType.Lance
                || atkUnit.weaponType == WeaponType.Axe
                || isWeaponTypeBreathOrBeast(atkUnit.weaponType)
            ) {
                defUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.HinataNoMoutou] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 4;
            defUnit.defSpur += 4;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.OboroNoShitsunagitou] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (defUnit.isWeaponSpecialRefined) {
                if (atkUnit.isMeleeWeaponType()) {
                    defUnit.resSpur += 6;
                    defUnit.defSpur += 6;
                }
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.YukyuNoSyo] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.resSpur += 4;
                defUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.FutsugyouNoYari] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.atkSpur += 4;
                defUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.ByakuyaNoRyuuseki] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (!atkUnit.isBuffed) {
                defUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.GeneiFalcion] = (defUnit, atkUnit, calcPotentialDamage) => {
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
                atkUnit.defSpur += amount;
                atkUnit.resSpur += amount;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.Balmung] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.battleContext.invalidateAllOwnDebuffs();
            defUnit.addAllSpur(5);
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DartingBreath] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.spdSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinNoKokyu] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoNoKokyu] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.defSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.MeikyoNoKokyu] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.resSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.BerkutsLance] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.resSpur += 4;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.BerkutsLancePlus] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (defUnit.weaponRefinement == WeaponRefinementType.None) {
                defUnit.resSpur += 4;
            } else {
                defUnit.resSpur += 7;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.Ekkezakkusu] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (defUnit.isWeaponSpecialRefined) {
                if (atkUnit.isRangedWeaponType()) {
                    defUnit.defSpur += 6;
                    defUnit.resSpur += 6;
                }
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantDef4] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (atkUnit.isRangedWeaponType()) {
                defUnit.defSpur += 8;
                defUnit.resSpur += 8;
                defUnit.battleContext.invalidateAllBuffs();
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseDef4] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (atkUnit.isMeleeWeaponType()) {
                defUnit.defSpur += 8;
                defUnit.resSpur += 8;
                defUnit.battleContext.invalidateAllBuffs();
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseDef3] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (atkUnit.isMeleeWeaponType()) {
                defUnit.defSpur += 6;
                defUnit.resSpur += 6;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.MoumokuNoYumi] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (atkUnit.isRangedWeaponType()) {
                defUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.HuinNoKen] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.defSpur += 4;
                defUnit.resSpur += 4;
            }
            else {
                defUnit.defSpur += 2;
                defUnit.resSpur += 2;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.ShirokiChiNoNaginata] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 4;
            defUnit.defSpur += 4;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinKongoNoKamae1] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 2; defUnit.defSpur += 2;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.GiyuNoYari] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.spdSpur += 4; defUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoNoKamae4] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.defSpur += 8;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.MeikyoNoKamae4] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.resSpur += 8;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinMeikyoNoKamae3] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 6;
            defUnit.resSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienKongoNoKamae3] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.spdSpur += 6;
            defUnit.defSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.SwiftStance3] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.spdSpur += 6;
            defUnit.resSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinKongoNoKamae3] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 6;
            defUnit.defSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinHienNoKamae3] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 6;
            defUnit.spdSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoMeikyoNoKamae3] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.resSpur += 6;
            defUnit.defSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.SacaNoOkite] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (self.__countAlliesWithinSpecifiedSpaces(defUnit, 2, x => true) >= 2) {
                defUnit.addAllSpur(4);
            }
        };



        {
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
                if (defUnit.snapshot.restHpPercentage >= 50) {
                    defUnit.battleContext.canCounterattackToAllDistance = true;
                }
            };

            self._applySkillEffectForDefUnitFuncDict[Weapon.Amatsu] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.Puji] = func;
        }

        {
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
                if (isPhysicalWeaponType(atkUnit.weaponType)) {
                    defUnit.atkSpur += 5;
                    defUnit.defSpur += 5;
                }
            };
            self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantFoil] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseFoil] = func;
        }

        {
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
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
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
                if (atkUnit.isRangedWeaponType()) {
                    defUnit.defSpur += 6;
                    defUnit.resSpur += 6;
                }
            };


            self._applySkillEffectForDefUnitFuncDict[Weapon.EnkyoriBougyoNoYumiPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantDef3] = func;
        }

        {
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
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
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
                defUnit.defSpur += 7;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoKen] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoKenPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoOnoPlus] = func;
        }
        {
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
                defUnit.resSpur += 7;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.BariaNoKen] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BariaNoKenPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BariaNoYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BarrierAxePlus] = func;
        }
        {
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
                defUnit.atkSpur += 6;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.HankoNoYari] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.HankoNoYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.ReprisalAxePlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinNoKamae3] = func;
        }

        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienNoKamae3] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.spdSpur += 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoNoKamae3] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.defSpur += 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.MeikyoNoKamae3] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.resSpur += 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinHienNoKamae2] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.atkSpur += 4; defUnit.spdSpur += 4;
        };

        {
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
                defUnit.atkSpur += 4; defUnit.defSpur += 4;
            };
            self._applySkillEffectForDefUnitFuncDict[PassiveA.OstiasCounter] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.KorakuNoKazariYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinKongoNoKamae2] = func;
        }

        {
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
                defUnit.atkSpur += 4; defUnit.resSpur += 4;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.SaladaSandPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinMeikyoNoKamae2] = func;
        }

        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienKongoNoKamae2] = (defUnit, atkUnit, calcPotentialDamage) => { defUnit.spdSpur += 4; defUnit.defSpur += 4; };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienMeikyoNoKamae1] = (defUnit, atkUnit, calcPotentialDamage) => { defUnit.spdSpur += 2; defUnit.resSpur += 2; };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienMeikyoNoKamae2] = (defUnit, atkUnit, calcPotentialDamage) => { defUnit.spdSpur += 4; defUnit.resSpur += 4; };

        {
            let func = (defUnit, atkUnit, calcPotentialDamage) => {
                defUnit.defSpur += 4; defUnit.resSpur += 4;
            };
            self._applySkillEffectForDefUnitFuncDict[PassiveA.JaryuNoUroko] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MizuNoBreath] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MizuNoBreathPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoMeikyoNoKamae2] = func;
        }

        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseReversal] = (defUnit, atkUnit, calcPotentialDamage) => {
            defUnit.defSpur += 5;
        };
    }

    __applySkillEffect(atkUnit, defUnit, calcPotentialDamage) {
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(defUnit, 2)) {
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

    __applySkillEffectForUnit(targetUnit, enemyUnit, calcPotentialDamage) {
        let self = this;
        this.profiler.profile("__applySkillEffectForUnit", () => {
            self.____applySkillEffectForUnit(targetUnit, enemyUnit, calcPotentialDamage);
        });
    }
    ____applySkillEffectForUnit(targetUnit, enemyUnit, calcPotentialDamage) {
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

        DamageCalculatorWrapper.__calcFixedSpecialAddDamage(targetUnit, enemyUnit);

        // 今のところ奥義にしかこの効果が存在しないので、重複しない。もし今後重複する場合は重複時の計算方法を調査して実装する
        targetUnit.battleContext.selfDamageDealtRateToAddSpecialDamage = getSelfDamageDealtRateToAddSpecialDamage(targetUnit.special);

        for (let skillId of targetUnit.enumerateSkills()) {
            let skillFunc = this._applySkillEffectForUnitFuncDict[skillId];
            if (skillFunc) {
                skillFunc(targetUnit, enemyUnit, calcPotentialDamage);
            }
        }
    }

    __init__applySkillEffectForUnitFuncDict() {
        let self = this;
        this._applySkillEffectForUnitFuncDict[Weapon.DuskDragonstone] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.NinissIceLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BowOfTwelve] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat ||
                (targetUnit.snapshot.restHpPercentage >= 75 &&
                    (enemyUnit.isTome || enemyUnit.weaponType === WeaponType.Staff))) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DriftingGracePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LuminousGracePlus] = this._applySkillEffectForUnitFuncDict[Weapon.DriftingGracePlus];
        this._applySkillEffectForUnitFuncDict[Weapon.WhirlingGrace] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.JointDistGuard] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isThereAllyIn2Spaces(targetUnit) && enemyUnit.isRangedWeaponType()) {
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Prescience] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.atkSpur -= 5;
            enemyUnit.resSpur -= 5;
            if (targetUnit.battleContext.initiatesCombat || enemyUnit.isRangedWeaponType()) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.NewDawn] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        this._applySkillEffectForUnitFuncDict[PassiveB.SeimeiNoGofu3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.invalidatesReferenceLowerMit = true;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.VirtuousTyrfing] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.battleContext.initiatesCombat
                || targetUnit.snapshot.restHpPercentage <= 99
            ) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Taiyo] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.healedHpByAttack += 10;
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SurgeSparrow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat) {
                let healRatio = 0.1 + (targetUnit.maxSpecialCount * 0.2);
                targetUnit.battleContext.maxHpRatioToHealBySpecial += healRatio;
                targetUnit.atkSpur += 7;
                targetUnit.spdSpur += 7;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MoonlessBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.3;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RauarLionPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BindingReginleif] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PhantasmTome] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 50) {
                enemyUnit.spdSput -= 6;
                enemyUnit.resSput -= 6;
                targetUnit.battleContext.invalidatesSpdBuff = true;
                targetUnit.battleContext.invalidatesResBuff = true;
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.7, enemyUnit);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Niu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MakenMistoruthin] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LoyaltySpear] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 4;
                enemyUnit.spdSpur -= 4;
                enemyUnit.defSpur -= 4;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FeatherSword] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.battleContext.initiatesCombat) {
                if (targetUnit.snapshot.restHpPercentage <= 75
                    || enemyUnit.weaponType == WeaponType.Sword
                    || enemyUnit.weaponType == WeaponType.Lance
                    || enemyUnit.weaponType == WeaponType.Axe
                    || enemyUnit.weaponType == WeaponType.ColorlessBow
                    || enemyUnit.moveType == MoveType.Armor
                ) {
                    targetUnit.battleContext.isVantabeActivatable = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GenesisFalchion] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let buffTotal = self.__getTotalBuffAmountOfTop3Units(targetUnit);
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
        this._applySkillEffectForUnitFuncDict[Weapon.NifuruNoHyoka] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            {
                if (!targetUnit.isWeaponRefined) return;
                let allies = Array.from(self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3));
                if (allies.length >= 1) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                    targetUnit.atkSpur += Math.min(allies.length, 2) * 2;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                        let units = Array.from(self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false));
                        let atkMax = units.reduce((max, unit) => Math.max(max, unit.hasStatusEffect(StatusEffectType.Panic) ? 0 : unit.atkBuff), 0);
                        targetUnit.atkSpur += atkMax;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PunishmentStaff] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MermaidBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.battleContext.refersMinOfDefOrRes = true;
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.EbonPirateClaw] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
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
                    targetUnit.battleContext.isDesperationActivated = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.YngviAscendant] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HolyYewfelle] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Ginnungagap] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                let isTomeOrStaff = enemyUnit.isTome || (enemyUnit.weaponType === WeaponType.Staff);
                if (targetUnit.battleContext.initiatesCombat ||
                    (enemyUnit.battleContext.initiatesCombat && isTomeOrStaff)) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TigerSpirit] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.DomainOfIce] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.spdSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FrostbiteBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                enemyUnit.addAllSpur(-5);
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowRefresh3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DolphinDiveAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RaydreamHorn] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BrightmareHorn] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Blizard] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StoutTomahawk] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Leiptr] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MaskingAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
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
        this._applySkillEffectForUnitFuncDict[Weapon.FuginNoMaran] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.snapshot.restHpPercentage >= 75) {
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
        this._applySkillEffectForUnitFuncDict[Weapon.JaryuNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.DragonSkin2] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.addAllSpur(6);
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.LawsOfSacae2] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(6);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ProfessorialText] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat
                || self.__isThereAllyIn2Spaces(targetUnit)
            ) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DivineSeaSpear] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.atkSpur += 3;
                targetUnit.spdSpur += 3;
                targetUnit.defSpur += 3;

                enemyUnit.atkSpur -= 3;
                enemyUnit.spdSpur -= 3;
                enemyUnit.defSpur -= 3;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PeachyParfaitPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.resSpur += 5;
                enemyUnit.resSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SunshadeStaff] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Scadi] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KenhimeNoKatana] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2) || targetUnit.battleContext.initiatesCombat) {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MuninNoMaran] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.snapshot.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HolyGradivus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Ladyblade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.refersMinOfDefOrRes = true;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RohyouNoKnife] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Pesyukado] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ObservantStaffPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            {
                if (self.__isThereAnyPartnerPairsIn3Spaces(targetUnit)) {
                    targetUnit.addAllSpur(6);
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.Gradivus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.healedHpByAttack = 7;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Siegfried] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.snapshot.restHpPercentage >= 75) {
                    enemyUnit.atkSpur -= 4;
                    enemyUnit.defSpur -= 4;
                    --enemyUnit.battleContext.followupAttackPriorityDecrement;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Raijinto] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.addAllSpur(4)
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.BereftLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            {
                let allyCount = self.__countAlliesWithinSpecifiedSpaces(
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AxeOfDespair] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfDespair] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.MurderousLion] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.spdSpur -= 3;
                enemyUnit.defSpur -= 3;
                targetUnit.battleContext.invalidatesCounterattack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AstraBlade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.rateOfAtkMinusDefForAdditionalDamage = 0.5;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.ArmoredWall] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.reducesCooldownCount = true;
                if (targetUnit.isTransformed
                    && !targetUnit.isOneTimeActionActivatedForPassiveB
                ) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TwinCrestPower] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityDecrement--;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HallowedTyrfing] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                if (targetUnit.battleContext.initiatesCombat || enemyUnit.isRangedWeaponType()) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.FatalSmoke3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.invalidatesHeal = true;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KyoufuArmars] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.3;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlowerLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GrimasTruth] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Shamsir] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkDefNearTrace3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdDefNearTrace3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkDefFarTrace3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkResFarTrace3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.resSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdResFarTrace3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.resSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BowOfFrelia] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                targetUnit.battleContext.additionalDamageOfSpecial += 7;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfGrado] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StaffOfRausten] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LanceOfFrelia] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.defSpur += 10;
                    targetUnit.resSpur += 10;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HotshotLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfReglay] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.MoonTwinWing] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.spdSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SunTwinWing] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                enemyUnit.spdSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LilacJadeBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GullinkambiEgg] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TallHammer] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        this._applySkillEffectForUnitFuncDict[Weapon.Nagurufaru] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.IcyFimbulvetr] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;

                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3,
                    x => x.moveType == MoveType.Cavalry || x.moveType == MoveType.Flying)
                ) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    targetUnit.battleContext.healedHpByAttack = 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.FallenStar] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Failnaught] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SilesseFrost] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;

                let partners = self.__getPartnersInSpecifiedRange(targetUnit, 2);
                if (partners.length > 0) {
                    targetUnit.battleContext.attackCount = 2;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Audhulma] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Meisterschwert] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (enemyUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                if (targetUnit.battleContext.initiatesCombat) {
                    --enemyUnit.battleContext.followupAttackPriorityDecrement;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SpySongBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (self.__isThereAnyPartnerPairsIn3Spaces(targetUnit)) {
                targetUnit.addAllSpur(6);
                targetUnit.battleContext.healedHpByAttack += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Thjalfi] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.battleContext.reductionRatioOfDamageReductionRatioExceptSpecial = 0.5;
                targetUnit.addAllSpur(6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.AdNearSave3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.defSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.ArFarSave3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.DrNearSave3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AuroraBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        this._applySkillEffectForUnitFuncDict[Weapon.IndignantBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesAtkBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Grafcalibur] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Forusethi] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SpringtimeStaff] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat
                    || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                ) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ArdensBlade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.defSpur += 6;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ResolvedFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.defSpur += 5;
                enemyUnit.defSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RefreshedFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.spdSpur += 5;
                enemyUnit.spdSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RenewedFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                (u) =>
                    targetUnit.partnerHeroIndex === u.heroIndex ||
                    targetUnit.heroIndex === u.partnerHeroIndex)) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.spdSpur -= 6;
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StudiedForblaze] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Hrist] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage <= 99) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfFavors] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!isWeaponTypeBeast(enemyUnit.weaponType)) {
                targetUnit.atkSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PurifyingBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 50) {
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
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfStorms] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Lyngheior] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Aureola] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.resSpur += 5;
                targetUnit.battleContext.invalidatesReferenceLowerMit = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TigerRoarAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.addAllSpur(5);
                if (enemyUnit.snapshot.restHpPercentage === 100) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Areadbhar] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
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
        this._applySkillEffectForUnitFuncDict[Weapon.Thunderbrand] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.EffiesLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PaleBreathPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnDefDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.JokersWild] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        this._applySkillEffectForUnitFuncDict[PassiveB.SlickFighter3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25 && enemyUnit.battleContext.initiatesCombat) {
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
        this._applySkillEffectForUnitFuncDict[PassiveA.Dragonscale] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
                targetUnit.battleContext.increaseCooldownCountForDefense = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlameLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 50) {
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
        this._applySkillEffectForUnitFuncDict[Weapon.GiltGoblet] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.CourtlyMaskPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.CourtlyBowPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.CourtlyCandlePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.CraftFighter3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.battleContext.initiatesCombat
                && targetUnit.snapshot.restHpPercentage >= 25
            ) {
                targetUnit.battleContext.reducesCooldownCount = true;
                ++targetUnit.battleContext.followupAttackPriorityIncrement;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Garumu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.healedHpByAttack += 7;
                }
                if (targetUnit.hasPositiveStatusEffect()) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PrimordialBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage == 100) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ArmorsmasherPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.moveType == MoveType.Armor) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KeenGronnwolfPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.moveType == MoveType.Cavalry) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlowerHauteclere] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MoonGradivus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.increaseCooldownCountForDefense = true;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.WindParthia] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat
                || (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
            ) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DarkSpikesT] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
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
        this._applySkillEffectForUnitFuncDict[Weapon.SunsPercussors] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                || enemyUnit.snapshot.restHpPercentage == 100
            ) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.DragonsIre3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat && targetUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StarpointLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ShinenNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (!calcPotentialDamage
                    && targetUnit.snapshot.restHpPercentage >= 25
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
        this._applySkillEffectForUnitFuncDict[Weapon.SnipersBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ApotheosisSpear] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BridesFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.spdSpur -= 5;
                enemyUnit.defSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.JukishiNoJuso] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 50) {
                    targetUnit.defSpur += 4;
                    targetUnit.resSpur += 4;
                }

                targetUnit.battleContext.increaseCooldownCountForDefense = true;
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.KarenNoYumi] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                    targetUnit.defSpur += 4;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KurokiChiNoTaiken] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BrutalBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            {
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x => true);
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DarkScripture] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Aymr] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AkaiRyukishiNoOno] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage == 100) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.WindsOfChange] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isBuffed || targetUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TenmaNoNinjinPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) == TriangleAdvantage.Advantageous) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SpendthriftBowPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        this._applySkillEffectForUnitFuncDict[Weapon.VezuruNoYoran] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.battleContext.invalidateAllOwnDebuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SuyakuNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.maxHpWithSkills > enemyUnit.snapshot.restHp) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GrayNoHyouken] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.addAllSpur(3);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.addAllSpur(5);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Randgrior] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage == 100) {
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Rigarublade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SeikenThirufingu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (isWeaponTypeTome(enemyUnit.weaponType)) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
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
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HikariNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.snapshot.restHpPercentage == 100) {
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
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                    }
                }
            }
            else if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Fensariru] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Roputous] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!enemyUnit.isWeaponEffectiveAgainst(EffectiveType.Dragon)) {
                enemyUnit.atkSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Buryunhirude] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (isWeaponTypeTome(enemyUnit.weaponType)) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Seini] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.isRangedWeaponType()) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }

                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
            else {
                if (enemyUnit.moveType == MoveType.Armor || enemyUnit.moveType == MoveType.Cavalry) {
                    if (enemyUnit.isRangedWeaponType()) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Gureipuniru] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage == 100) {
                targetUnit.atkSpur += 3;
                targetUnit.spdSpur += 3;
                if (targetUnit.isWeaponSpecialRefined) {
                    enemyUnit.addAllSpur(-4);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Ivarudhi] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Arrow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getAtkInPrecombat() <= enemyUnit.getAtkInPrecombat() - 5) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Naga] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (isWeaponTypeBreath(enemyUnit.weaponType)) {
                    targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                    targetUnit.battleContext.canCounterattackToAllDistance = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KiriNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                    x.weaponType == WeaponType.Sword || isWeaponTypeBreath(x.weaponType))
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
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MizuNoHimatsu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isAllyCountIsGreaterThanEnemyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MugenNoSyo] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isNextToOtherUnits(targetUnit)) {
                enemyUnit.addAllSpur(-4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Syurugu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Rifia] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.OgonNoTanken] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isSpecialCharged) {
                targetUnit.addAllSpur(3);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.OkamijoouNoKiba] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            {
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x => true);
                let amount = Math.min(6, count * 2);
                targetUnit.atkSpur += amount;
                targetUnit.spdSpur += amount;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GuradoNoSenfu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.isBuffed || targetUnit.isMobilityIncreased) {
                    targetUnit.spdSpur += 5;
                    targetUnit.defSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FeruniruNoYouran] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Saferimuniru] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                let diffHalf = Math.floor(diff * 0.5);
                let amount = Math.max(0, Math.min(8, diffHalf));
                enemyUnit.atkSpur -= amount;
                enemyUnit.defSpur -= amount;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Erudofurimuniru] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                let diffHalf = Math.floor(diff * 0.5);
                let amount = Math.max(0, Math.min(8, diffHalf));
                enemyUnit.atkSpur -= amount;
                enemyUnit.spdSpur -= amount;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BoranNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            {
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x => true);
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AsuNoSEikishiNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!enemyUnit.isBuffed) {
                enemyUnit.atkSpur += 6;
                enemyUnit.defSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Flykoogeru] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                x.getDefInPrecombat() > targetUnit.getDefInPrecombat())
            ) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SyuryouNoEijin] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            {
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
                if (atk) { targetUnit.atkSpur += 5; }
                if (spd) { targetUnit.spdSpur += 5; }
                if (def) { targetUnit.defSpur += 5; }
                if (res) { targetUnit.resSpur += 5; }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BerukaNoSatsufu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 50) {
                    enemyUnit.atkSpur -= 4;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SarieruNoOkama] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.isBuffed || enemyUnit.isMobilityIncreased) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MagetsuNoSaiki] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.isOddTurn || enemyUnit.snapshot.restHpPercentage < 100) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TsubakiNoKinnagitou] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() - 3) {
                targetUnit.addAllSpur(3);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SyugosyaNoKyofu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 3;
                enemyUnit.defSpur -= 3;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ByakuyaNoRyuuseki] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 3;
                enemyUnit.spdSpur -= 3;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesSpdBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.YumikishiNoMiekyu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 4;
                enemyUnit.defSpur -= 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KishisyogunNoHousou] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage < 100) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PieriNoSyousou] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage < 100) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Tangurisuni] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isBuffed || targetUnit.isMobilityIncreased) {
                targetUnit.addAllSpur(3);
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ChisouGeiborugu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.moveType == MoveType.Infantry
                || enemyUnit.moveType == MoveType.Armor
                || enemyUnit.moveType == MoveType.Cavalry
            ) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KokukarasuNoSyo] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.getAtkInPrecombat() >= targetUnit.getAtkInPrecombat() + 3) {
                    self.__writeDamageCalcDebugLog("黒鴉の書の効果が発動、敵の攻魔-6、奥義カウント変動量を-1");
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.resSpur -= 6;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ThiamoNoAisou] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.snapshot.restHpPercentage >= 70) {
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
        this._applySkillEffectForUnitFuncDict[Weapon.BaraNoYari] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AiNoSaiki] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isBuffed || targetUnit.snapshot.restHpPercentage >= 70) {
                targetUnit.atkSpur += Math.floor(enemyUnit.getDefInPrecombat() * 0.25);
                enemyUnit.atkSpur -= Math.floor(enemyUnit.getResInPrecombat() * 0.25);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RazuwarudoNoMaiken] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            {
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 3, x =>
                    x.buffTotal >= 10);
                if (count >= 2) {
                    targetUnit.atkSpur += 3;
                    targetUnit.defSpur += 3;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ChichiNoSenjutsusyo] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Tenmakoku3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 7) {
                let resDiff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                let amount = Math.max(0, Math.min(7, Math.floor(resDiff * 0.5)));
                enemyUnit.atkSpur -= amount;
                enemyUnit.defSpur -= amount;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.WyvernFlight3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 10) {
                let defDiff = targetUnit.getEvalDefInPrecombat() - enemyUnit.getEvalDefInPrecombat();
                let amount = Math.max(0, Math.min(7, Math.floor(defDiff * 0.5)));
                enemyUnit.atkSpur -= amount;
                enemyUnit.defSpur -= amount;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AsameiNoTanken] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!enemyUnit.snapshot.isRestHpFull) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                if (!targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.isVantabeActivatable = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Jikurinde] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
            if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                targetUnit.defSpur += 3;
                targetUnit.resSpur += 3;
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
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
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Vorufuberugu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DevilAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.addAllSpur(4);
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ZeroNoGyakukyu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SyunsenAiraNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.2, enemyUnit);
                    }
                }
            }
            else {
                DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KageroNoGenwakushin] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Death] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.addAllSpur(4);
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RebbekkaNoRyoukyu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isBuffed) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SeisyoNaga] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.invalidateAllBuffs();
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                if (targetUnit.getEvalResInPrecombat() >= enemyUnit.getEvalResInPrecombat() + 3) {
                    targetUnit.addAllSpur(3);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Forukuvangu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.snapshot.restHpPercentage <= 80) {
                    targetUnit.atkSpur += 7;
                    targetUnit.defSpur += 7;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KizokutekinaYumi] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.hp > enemyUnit.hp) {
                    targetUnit.addAllSpur(4);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RunaNoEiken] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.getAtkInPrecombat() >= targetUnit.getAtkInPrecombat() + 3) {
                targetUnit.addAllSpur(3);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Sekuvaveku] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.HikariToYamito] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addAllSpur(-2);
            targetUnit.battleContext.invalidateAllBuffs();
            targetUnit.battleContext.invalidatesReferenceLowerMit = true;

        };
        this._applySkillEffectForUnitFuncDict[Weapon.ShiseiNaga] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Uchikudakumono] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.refersMinOfDefOrRes = true;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FerisiaNoKorizara] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoGoka3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.atkSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoShippu3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.spdSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoDaichi3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.defSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoSeisui3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.resSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GaeBolg] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.moveType == MoveType.Armor
                || enemyUnit.moveType == MoveType.Cavalry
                || enemyUnit.moveType == MoveType.Infantry
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
        this._applySkillEffectForUnitFuncDict[Weapon.Ragnarok] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HokenSophia] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
                        targetUnit.battleContext.healedHpByAttack += 7;
                    }
                }
            }

        };
        this._applySkillEffectForUnitFuncDict[Weapon.ImbuedKoma] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isSpecialCharged) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Marute] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HarukazeNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if ((!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
                || targetUnit.isBuffed
            ) {
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                enemyUnit.atkSpur -= 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LarceisEdge] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                || enemyUnit.snapshot.isRestHpFull
            ) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Mulagir] = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BookOfShadows] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isNextToOtherUnits(targetUnit)) {
                enemyUnit.addAllSpur(-4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FellBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.snapshot.restHpPercentage < 100) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TaguelFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            {
                if (!self.__isNextToOtherUnitsExceptDragonAndBeast(targetUnit)) {
                    targetUnit.addAllSpur(3);
                }
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.SnowsGrace] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.defSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DivineBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let statusPlus = 0;
                for (let allyUnit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
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
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdPush3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.spdSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefPush3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.defSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkResPush3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.resSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefPush4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.defSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkResPush4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdPush4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.spdSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.DistantPressure] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.spdSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkSpd3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.spdSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkSpd4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 9; targetUnit.spdSpur += 10; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkDef3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.defSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkRes3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenDefRes3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.defSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenSpdDef3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.spdSpur += 7; targetUnit.defSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenSpdRes3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.spdSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KurooujiNoYari] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 3;
                enemyUnit.defSpur -= 3;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkDef3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.defSpur -= 3;
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesDefBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkSpd3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.spdSpur -= 3;
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesSpdBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkRes3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.resSpur -= 3;
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesResBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullSpdDef3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.defSpur -= 3;
            targetUnit.battleContext.invalidatesSpdBuff = true;
            targetUnit.battleContext.invalidatesDefBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullSpdRes3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.resSpur -= 3;
            targetUnit.battleContext.invalidatesSpdBuff = true;
            targetUnit.battleContext.invalidatesResBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.BeokuNoKago] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.moveType == MoveType.Cavalry || enemyUnit.moveType == MoveType.Flying) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.KyokaMukoKinkyori3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.isMeleeWeaponType()) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.KyokaMukoEnkyori3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.isRangedWeaponType()) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpecialFighter3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 50) {
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                targetUnit.battleContext.increaseCooldownCountForDefense = true;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Cancel1] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage == 100) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Cancel2] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 90) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Cancel3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.snapshot.restHpPercentage >= 80) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };

        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            };
            this._applySkillEffectForUnitFuncDict[PassiveB.MikiriTsuigeki3] = func;
            this._applySkillEffectForUnitFuncDict[PassiveB.SphiasSoul] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.HakutoshinNoNinjin] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.TenteiNoKen] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                targetUnit.battleContext.damageRatioToHeal += 0.5;
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Absorb] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.AbsorbPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                targetUnit.battleContext.healedHpByAttack += 5;
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SeirinNoKenPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.FuyumatsuriNoStickPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ChisanaSeijuPlus] = func;
        }

        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (!targetUnit.battleContext.initiatesCombat) {
                    if (targetUnit.snapshot.restHpPercentage <= 75) {
                        targetUnit.battleContext.isVantabeActivatable = true;
                    }
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Reipia] = func;
            this._applySkillEffectForUnitFuncDict[PassiveB.Vantage3] = func;
        }

        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.ShellpointLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.TridentPlus] = func;
        }

        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (enemyUnit.snapshot.restHpPercentage >= 75) {
                    targetUnit.defSpur += 5;
                    enemyUnit.defSpur -= 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SunflowerBowPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.VictorfishPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Ragnell] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.Alondite] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (enemyUnit.snapshot.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SpringyBowPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SpringyAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SpringyLancePlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastLance] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastAxe] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (self.__isSolo(targetUnit)) {
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                    targetUnit.battleContext.invalidatesDefBuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundBlade] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundBladePlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.defSpur -= 6;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SeaSearLance] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.LoyalistAxe] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (!targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage == 100) {
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
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.RauarRabbitPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.BlarRabbitPlus] = func;
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
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x =>
                        x.moveType == MoveType.Flying) >= 2
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
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (enemyUnit.snapshot.restHpPercentage == 100) {
                    targetUnit.addAllSpur(2);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.HisenNoNinjinYariPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.HaruNoYoukyuPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.isWeaponSpecialRefined) {
                    DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.WingSword] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.Romfire] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.snapshot.isRestHpFull) {
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
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
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
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
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

        this._applySkillEffectForUnitFuncDict[PassiveB.MoonlightBangle] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            {
                let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(enemyUnit.getDefInCombat(targetUnit) * ratio);
            }
        };
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
            if (i == units.length) {
                break;
            }

            total += units[i].buffTotal;
        }
        return total;
    }

    static __calcFixedSpecialAddDamage(targetUnit, enemyUnit) {
        switch (targetUnit.passiveB) {
            case PassiveB.MoonlightBangle:
                {
                    let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                    targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(enemyUnit.getDefInCombat(targetUnit) * ratio);
                }
                break;
            case PassiveB.RunaBracelet:
                targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(enemyUnit.getDefInCombat(targetUnit) * 0.5);
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
                if (targetUnit.restHpPercentage <= 75) {
                    targetUnit.battleContext.additionalDamageOfSpecial += 5;
                }
                break;

        }
        switch (targetUnit.weapon) {
            case Weapon.MakenMistoruthin:
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                    targetUnit.battleContext.additionalDamageOfSpecial += 7;
                }
                break;
            case Weapon.ResolvedFang:
            case Weapon.RenewedFang:
            case Weapon.JinroMusumeNoTsumekiba:
            case Weapon.TrasenshiNoTsumekiba:
            case Weapon.JinroOuNoTsumekiba:
            case Weapon.OkamijoouNoKiba:
            case Weapon.BridesFang:
            case Weapon.GroomsWings:
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.additionalDamageOfSpecial += 10;
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

        switch (targetUnit.passiveA) {
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
        }
        switch (targetUnit.passiveB) {
            case PassiveB.KillingIntent:
                if (enemyUnit.snapshot.restHpPercentage < 100 || enemyUnit.hasNegativeStatusEffect()) {
                    enemyUnit.spdSpur -= 5;
                    enemyUnit.resSpur -= 5;
                }
                break;
            case PassiveB.ShisyaNoChojiriwo:
                if (targetUnit.snapshot.restHpPercentage >= 50 || targetUnit.hasNegativeStatusEffect()) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.increaseCooldownCountForDefense = true;
                }
                break;
        }

        switch (targetUnit.weapon) {
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
                            --enemyUnit.battleContext.followupAttackPriorityDecrement;
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
                targetUnit.battleContext.healedHpByAttack += 7;
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

    __applySkillEffectForAttackerAndDefenderFromAllies(atkUnit, defUnit, calcPotentialDamage) {
        if (this.__canDisableEnemySpursFromAlly(atkUnit, defUnit, calcPotentialDamage)) {
            return;
        }
        if (calcPotentialDamage) {
            return;
        }

        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 2)) {
            switch (allyUnit.weapon) {
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
    __applySkillEffectFromAllies(targetUnit, enemyUnit, calcPotentialDamage) {
        if (this.__canDisableEnemySpursFromAlly(enemyUnit, targetUnit, calcPotentialDamage)) {
            return;
        }

        // 2マス以内の味方からの効果
        if (!calcPotentialDamage) {
            for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                switch (allyUnit.weapon) {
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
                        if (targetUnit.getDefInPrecombat() > allyUnit.getDefInPrecombat()) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    case Weapon.YoukoohNoTsumekiba:
                        if (!allyUnit.hasStatusEffect(StatusEffectType.Panic)) {
                            targetUnit.atkSpur += allyUnit.atkBuff;
                            targetUnit.spdSpur += allyUnit.spdBuff;
                            targetUnit.defSpur += allyUnit.defBuff;
                            targetUnit.resSpur += allyUnit.resBuff;
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
                }
                for (let skillId of [allyUnit.passiveC, allyUnit.passiveS]) {
                    switch (skillId) {
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
        }

        switch (targetUnit.passiveA) {
            case PassiveA.AsherasChosen:
                if (calcPotentialDamage || this.__isThereAllyExceptDragonAndBeastWithin1Space(targetUnit) == false) {
                    targetUnit.atkSpur += 6;
                    targetUnit.defSpur += 6;
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

        switch (targetUnit.passiveB) {
            case PassiveB.Shishirenzan:
                if (targetUnit.battleContext.initiatesCombat
                    && targetUnit.snapshot.isRestHpFull) {
                    targetUnit.battleContext.attackCount = 2;
                }
                break;
        }

        switch (targetUnit.weapon) {
            case Weapon.FalcionEchoes:
                if (targetUnit.battleContext.initiatesCombat && targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.battleContext.attackCount = 2;
                    }
                }
                break;
            case Weapon.WhitedownSpear:
                if (targetUnit.battleContext.initiatesCombat
                    && this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x =>
                        x.moveType == MoveType.Flying) >= 2
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
                            x.moveType == MoveType.Flying) >= 2
                    ) {
                        targetUnit.battleContext.attackCount = 2;
                    }
                }
                break;
            case Weapon.KurohyoNoYari:
            case Weapon.MogyuNoKen:
                if (targetUnit.battleContext.initiatesCombat
                    && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                        x.moveType == MoveType.Cavalry
                        && (x.weaponType == WeaponType.Sword
                            || x.weaponType == WeaponType.Lance
                            || x.weaponType == WeaponType.Axe)
                    )) {
                    targetUnit.battleContext.attackCount = 2;
                }
                break;
            case Weapon.WakakiKurohyoNoKen:
            case Weapon.WakakiMogyuNoYari:
                if (targetUnit.isWeaponSpecialRefined) {
                    if (!targetUnit.battleContext.initiatesCombat
                        && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                            x.moveType == MoveType.Cavalry
                            && (x.weaponType == WeaponType.Sword
                                || x.weaponType == WeaponType.Lance
                                || x.weaponType == WeaponType.Axe)
                        )) {
                        targetUnit.battleContext.counterattackCount = 2;
                    }
                }
                break;
            case Weapon.GullinkambiEgg:
                {
                    if (targetUnit.battleContext.initiatesCombat
                        && enemyUnit.snapshot.restHpPercentage >= 75
                        && this.globalBattleContext.isCombatOccuredInCurrentTurn
                    ) {
                        targetUnit.battleContext.attackCount = 2;
                    }
                }
                break;
            case Weapon.RazuwarudoNoMaiken:
                {
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

    __isEnemyCountIsGreaterThanOrEqualToAllyCount(skillUnit, battleTargetUnit, calcPotentialDamage) {
        if (calcPotentialDamage) {
            return true;
        }

        let allyCount = this.__countAlliesWithinSpecifiedSpaces(skillUnit, 2, x => true);
        let enemyCount = this.__countEnemiesWithinSpecifiedSpaces(skillUnit, 2, x => x != battleTargetUnit);
        return enemyCount >= allyCount;
    }

    __isAllyCountIsGreaterThanEnemyCount(skillUnit, battleTargetUnit, calcPotentialDamage) {
        if (calcPotentialDamage) {
            return true;
        }

        let allyCount = this.__countAlliesWithinSpecifiedSpaces(skillUnit, 2, x => true);
        let enemyCount = this.__countEnemiesWithinSpecifiedSpaces(skillUnit, 2, x => x != battleTargetUnit);
        return allyCount > enemyCount;
    }

    __countEnemiesWithinSpecifiedSpaces(targetUnit, spaces, predicator) {
        return this._unitManager.countEnemiesWithinSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    __countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    __setWrathfulStaff(atkUnit, defUnit) {
        if (defUnit.canInvalidateWrathfulStaff()) {
            return;
        }

        let atkWeaponInfo = atkUnit.weaponInfo;
        let passiveBInfo = atkUnit.passiveBInfo;

        // 神罰の杖
        if ((atkWeaponInfo != null && atkWeaponInfo.wrathfulStaff)
            || (passiveBInfo != null && passiveBInfo.wrathfulStaff)
            || (atkUnit.weaponRefinement == WeaponRefinementType.WrathfulStaff)
        ) {
            atkUnit.battleContext.wrathfulStaff = true;
        }
    }

    __setEffectiveAttackEnabledIfPossible(atkUnit, defUnit) {
        if (atkUnit.weaponInfo == null) {
            return;
        }

        atkUnit.battleContext.isEffectiveToOpponent = false;
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
    }

    __applySpurForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, calcPotentialDamage) {
        switch (targetUnit.weapon) {
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
                    if (enemyUnit.snapshot.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
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
                    DamageCalculationUtility.applyDebuffBlade(targetUnit, enemyUnit);
                }
                break;
            case Weapon.Blizard:
            case Weapon.HaNoOugiPlus:
                DamageCalculationUtility.applyDebuffBlade(targetUnit, enemyUnit);
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
                    this.__writeDamageCalcDebugLog(`混沌ラグネルにより攻+${atkAdd}, 速+${spdAdd}, 守+${defAdd}, 魔+${resAdd}`);
                    targetUnit.atkSpur += atkAdd;
                    targetUnit.spdSpur += spdAdd;
                    targetUnit.defSpur += defAdd;
                    targetUnit.resSpur += resAdd;
                }
                break;
        }
        switch (targetUnit.passiveA) {
            case PassiveA.AtkSpdIdeal4:
                DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                    (unit, value) => {
                        unit.atkSpur += value; unit.spdSpur += value;
                    });
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
        }

        switch (targetUnit.passiveB) {
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


        }
    }

    __isThereAllyIn2Spaces(targetUnit) {
        return this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
    }

    __isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    static __applyIdealEffect(targetUnit, enemyUnit, buffFunc) {
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

    __isSolo(unit) {
        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1)) {
            return false;
        }

        return true;
    }

    __applySkillEffectForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, calcPotentialDamage) {
        if (targetUnit.hasStatusEffect(StatusEffectType.BonusDoubler)) {
            DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
        }

        {
            switch (targetUnit.weapon) {
                case Weapon.RyukenFalcion:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25 && isPhysicalWeaponType(enemyUnit.weaponType)) {
                            if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getSpdInCombat() + 1) {
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                        }
                    }
                    break;
                case Weapon.ShikkyuMyurugure:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                            targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getEvalSpdInCombat() * 0.15);
                        }
                    }
                    break;
                case Weapon.Misteruthin:
                    if (!targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.MermaidBow:
                    if (targetUnit.snapshot.restHpPercentage >= 25 &&
                        targetUnit.battleContext.initiatesCombat) {
                        if (DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) == TriangleAdvantage.Advantageous) {
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
                        targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getEvalSpdInCombat() * 0.2);
                        targetUnit.battleContext.invalidatesCounterattack = true;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.PlegianAxePlus:
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
                case Weapon.KentoushiNoGoken:
                    DamageCalculatorWrapper.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                    break;

            }
            switch (targetUnit.passiveB) {
                case PassiveB.BoldFighter3:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case PassiveB.VengefulFighter3:
                    if (!targetUnit.battleContext.initiatesCombat && targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
            }

            for (let skillId of [targetUnit.passiveA, targetUnit.passiveS]) {
                switch (skillId) {
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
            switch (unit.passiveC) {
                case PassiveC.HokoNoGogeki3:
                    if (targetUnit.moveType == MoveType.Infantry) {
                        DamageCalculatorWrapper.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                    }
                    break;
                case PassiveC.HokoNoJugeki3:
                    if (targetUnit.moveType == MoveType.Infantry) {
                        DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                    }
                    break;
            }
        }
        for (let unit of this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 1, false)) {
            switch (unit.passiveC) {
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
            case Weapon.LilacJadeBreath:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.snapshot.restHpPercentage === 100) {
                    return 0.4;
                }
                break;
            case Weapon.Areadbhar:
                {
                    let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                    if (diff > 0 && defUnit.snapshot.restHpPercentage >= 25) {
                        let percentage = Math.min(diff * 4, 40);
                        this.__writeDamageCalcDebugLog(`アラドヴァルによりダメージ${percentage}%軽減(速さの差 ${(defUnit.getEvalSpdInCombat(atkUnit))}-${(atkUnit.getEvalSpdInCombat(defUnit))}=${diff})`);
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.GiltGoblet:
                if ((atkUnit.battleContext.initiatesCombat || atkUnit.snapshot.restHpPercentage === 100) &&
                    isWeaponTypeTome(atkUnit.weaponType)) {
                    return 0.5;
                }
                break;
            case Weapon.BloodTome:
                if (isRangedWeaponType(atkUnit.weaponType)) {
                    return 0.5;
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

                        this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.BrightmareHorn:
                if (defUnit.snapshot.restHpPercentage >= 25) {
                    {
                        let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            this.__writeDamageCalcDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
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

                        this.__writeDamageCalcDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
                        return percentage / 100.0;
                    }
                }
                break;
            case PassiveB.MoonTwinWing:
                if (defUnit.snapshot.restHpPercentage >= 25) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                }
                break;
            case Weapon.NinissIceLance:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(defUnit)) {
                        return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                    }
                }
                break;
            case PassiveB.Bushido2:
            case PassiveB.Frenzy3:
            case PassiveB.Spurn3:
            case PassiveB.KaihiIchigekiridatsu3:
            case PassiveB.KaihiTatakikomi3:
                return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
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

                        this.__writeDamageCalcDebugLog(`蒼き獅子王によりダメージ${percentage}%軽減(守備の差 ${defUnitDef}-${atkUnitDef}=${diff})`);
                        return percentage / 100.0;
                    }
                }
                break;
        }

        return 0;
    }

    __applyDamageReductionRatio(atkUnit, defUnit) {
        for (let skillId of [defUnit.weapon, defUnit.passiveB]) {
            let ratio = this.__getDamageReductionRatio(skillId, atkUnit, defUnit);
            if (ratio > 0) {
                defUnit.battleContext.multDamageReductionRatio(ratio, atkUnit);
            }
        }

        if (defUnit.hasStatusEffect(StatusEffectType.Dodge)) {
            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
            if (ratio > 0) {
                defUnit.battleContext.multDamageReductionRatio(ratio, atkUnit);
            }
        }
    }


    /// 戦闘前奥義、戦闘のどちらでも同様の効果のスキルの実装
    __applySkillEffectForPrecombatAndCombat(targetUnit, enemyUnit, calcPotentialDamage) {
        switch (targetUnit.passiveB) {
            case PassiveB.Bushido2:
                targetUnit.battleContext.additionalDamage += 7;
                break;
        }
        switch (targetUnit.weapon) {
            case Weapon.DarkCreatorS:
                if (!calcPotentialDamage && !targetUnit.isOneTimeActionActivatedForWeapon) {
                    let count = this.__countUnit(targetUnit.groupId, x => x.hpPercentage >= 90);
                    let damageReductionRatio = Math.min(count * 15, 45) * 0.01;
                    targetUnit.battleContext.multDamageReductionRatio(damageReductionRatio, enemyUnit);
                }
                break;
        }
    }

    __calcFixedAddDamage(atkUnit, defUnit, isPrecombat) {
        switch (atkUnit.passiveB) {
            case PassiveB.Atrocity:
                if (defUnit.snapshot.restHpPercentage >= 50) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getAtkInCombat() * 0.25);
                }
                break;
        }
        switch (atkUnit.passiveA) {
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
        }
        switch (atkUnit.weapon) {
            case Weapon.MakenMistoruthin:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (isPrecombat) {
                        if (defUnit.restHpPercentage >= 75) {
                            atkUnit.battleContext.additionalDamage += 7;
                        }
                    }
                }
                break;
            case Weapon.Ginnungagap:
                if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                    atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                    atkUnit.battleContext.additionalDamage += atkUnit.battleContext.reducedDamageForNextAttack;
                    atkUnit.battleContext.reducedDamageForNextAttack = 0;
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
                    if (atkUnit.snapshot.restHpPercentage >= 70) {
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
                        if (defUnit.snapshot.isRestHpFull) {
                            atkUnit.battleContext.additionalDamage += 7;
                        }
                    }
                }
                break;
            case Weapon.LunaArc:
                if (atkUnit.battleContext.initiatesCombat) {
                    let value = 0;
                    if (isPrecombat) {
                        value = defUnit.getDefInPrecombat();
                    }
                    else {
                        value = defUnit.getDefInCombat(atkUnit);
                    }
                    atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.25);
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
                if (atkUnit.battleContext.initiatesCombat) {
                    let value = 0;
                    if (isPrecombat) {
                        value = defUnit.getResInPrecombat();
                    }
                    else {
                        value = defUnit.getResInCombat(atkUnit);
                    }
                    atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.25);
                }
                break;
            case Weapon.NewFoxkitFang:
                atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                    atkUnit, defUnit, isPrecombat,
                    x => x.getEvalResInPrecombat(),
                    (x, y) => x.getEvalResInCombat(y));
                break;
            case Weapon.KenhimeNoKatana:
                if (atkUnit.isWeaponRefined) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.15);
                } else {
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.KarasuOuNoHashizume:
            case Weapon.NewBrazenCatFang:
            case Weapon.AkaiAhiruPlus:
            case Weapon.GigaExcalibur:
                if (atkUnit.isWeaponRefined) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.2);
                } else {
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.KieiWayuNoKen:
                if (atkUnit.isWeaponSpecialRefined) {
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.RefreshedFang:
                if (defUnit.snapshot.restHpPercentage >= 75) {
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.ResolvedFang:
                if (defUnit.snapshot.restHpPercentage >= 75) {
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalDefInPrecombat(),
                        (x, y) => x.getEvalDefInCombat(y));
                }
                break;
            default:
                break;
        }
    }


    static __getAtk(atkUnit, defUnit, isPrecombat) {
        if (isPrecombat) {
            return atkUnit.getAtkInPrecombat();
        }
        else {
            return atkUnit.getAtkInCombat(defUnit);
        }
    }
    static __getSpd(atkUnit, defUnit, isPrecombat) {
        if (isPrecombat) {
            return atkUnit.getSpdInPrecombat();
        }
        else {
            return atkUnit.getSpdInCombat(defUnit);
        }
    }

    static __calcAddDamageForDiffOf70Percent(atkUnit, defUnit, isPrecombat, getPrecombatFunc, getCombatFunc) {
        let diff = 0;
        if (isPrecombat) {
            diff = getPrecombatFunc(atkUnit) - getPrecombatFunc(defUnit);
        }
        else {
            diff = getCombatFunc(atkUnit, defUnit) - getCombatFunc(defUnit, atkUnit);
        }
        if (diff > 0) {
            let addDamage = Math.trunc(diff * 0.7);
            if (addDamage > 7) {
                addDamage = 7;
            }
            return addDamage;
        }
        return 0;
    }

    __examinesCanFollowupAttack(atkUnit, defUnit) {
        this.__writeDamageCalcDebugLog(`${atkUnit.getNameWithGroup()}の速さによる追撃評価:`);
        this.__logSpdInCombat(atkUnit, defUnit, TabChar);
        this.__logSpdInCombat(defUnit, atkUnit, TabChar);
        let result = DamageCalculationUtility.examinesCanFollowupAttack(atkUnit, defUnit);
        if (result) {
            this.__writeDamageCalcDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが5以上高いので追撃可能");
        }
        else {
            this.__writeDamageCalcDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが足りないので追撃不可");
        }
        return result;
    }

    __logSpdInCombat(unit, enemyUnit, tab = "") {
        this.__writeDamageCalcDebugLog(tab + unit.getNameWithGroup()
            + `の戦闘中速さ${unit.getSpdInCombat(enemyUnit)}(速さ${unit.spdWithSkills}、強化${unit.getSpdBuffInCombat(enemyUnit)}、弱化${unit.spdDebuff}、戦闘中強化${unit.spdSpur})`);
    }


    __examinesCanFollowupAttackForAttacker(atkUnit, defUnit, calcPotentialDamage) {
        this.__writeDamageCalcDebugLog(`${atkUnit.getNameWithGroup()}の追撃評価 ------`);
        let followupAttackPriority = this.getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage);
        if (!defUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            switch (atkUnit.weapon) {
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
                case Weapon.TakaouNoHashizume:
                    if (defUnit.snapshot.isRestHpFull) {
                        ++followupAttackPriority;
                    }
                    break;
                case Weapon.SoulCaty:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.snapshot.restHpPercentage <= 75 && this.canCounterAttack(atkUnit, defUnit)) {
                            ++followupAttackPriority;
                        }
                    }
                    break;
                case Weapon.RohyouNoKnife:
                    if ((defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) && this.canCounterAttack(atkUnit, defUnit)) {
                        ++followupAttackPriority;
                    }
                    break;
            }
            switch (atkUnit.passiveB) {
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
                    if (atkUnit.snapshot.restHpPercentage <= 50 && this.canCounterAttack(atkUnit, defUnit)) {
                        ++followupAttackPriority;
                    }
                    break;

            }
        }

        if (!atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            switch (atkUnit.passiveB) {
                case PassiveB.Kazenagi3:
                    --followupAttackPriority;
                    break;
                case PassiveB.Mizunagi3:
                    --followupAttackPriority;
                    break;
            }
        }

        if (followupAttackPriority < 0) {
            // 追撃不可を受けた
            this.__writeDamageCalcDebugLog(atkUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            this.__writeDamageCalcDebugLog(atkUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
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
        this.__writeDamageCalcDebugLog(`${defUnit.getNameWithGroup()}の追撃評価 ------`);
        let followupAttackPriority = this.getFollowupAttackPriorityForBoth(defUnit, atkUnit, calcPotentialDamage);
        if (!atkUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            for (let skillId of [defUnit.passiveB, defUnit.passiveS]) {
                switch (skillId) {
                    case PassiveB.SlickFighter3:
                        if (defUnit.snapshot.restHpPercentage >= 25) {
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
                }
            }
            switch (defUnit.weapon) {
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

        if (!defUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            switch (atkUnit.weapon) {
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
                case Weapon.AijouNoHanaNoYumiPlus:
                case Weapon.BukeNoSteckPlus:
                    --followupAttackPriority;
                    break;
            }
            switch (atkUnit.passiveA) {
                case PassiveA.KishinKongoNoSyungeki:
                case PassiveA.KishinMeikyoNoSyungeki:
                case PassiveA.SteadyImpact:
                case PassiveA.SwiftImpact:
                    --followupAttackPriority;
                    break;
            }
            switch (atkUnit.passiveB) {
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
            this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
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
        if (defUnit.hasPassiveSkill(PassiveB.MikiriHangeki3)) {
            return false;
        }

        if (defUnit.hasStatusEffect(StatusEffectType.CounterattacksDisrupted)) {
            return true;
        }

        if (atkUnit.battleContext.invalidatesCounterattack) {
            return true;
        }

        switch (atkUnit.weapon) {
            case Weapon.RyukenFalcion:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.snapshot.restHpPercentage >= 25 && isPhysicalWeaponType(defUnit.weaponType)) {
                        if (atkUnit.getEvalSpdInCombat() >= defUnit.getSpdInCombat() + 1) {
                            return true;
                        }
                    }
                }
                break;
            case Weapon.SurvivalistBow:
                if (atkUnit.battleContext.isSolo && defUnit.snapshot.restHpPercentage >= 80) {
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

        // 反撃不可
        let atkWeaponInfo = atkUnit.weaponInfo;
        let passiveBInfo = atkUnit.passiveBInfo;
        if ((atkWeaponInfo != null && atkWeaponInfo.disableCounterattack)
            || (passiveBInfo != null && passiveBInfo.disableCounterattack)
            || (atkUnit.weaponRefinement == WeaponRefinementType.DazzlingStaff)
            || (atkUnit.passiveB == PassiveB.SacaesBlessing
                && (defUnit.weaponType == WeaponType.Sword || defUnit.weaponType == WeaponType.Lance || defUnit.weaponType == WeaponType.Axe))
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

    static __examinesCanCounterattackBasically(atkUnit, defUnit) {
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
                    if (defUnit.battleContext.isSolo) {
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

    getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage) {
        let followupAttackPriority = 0;
        if (!defUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            followupAttackPriority += atkUnit.battleContext.followupAttackPriorityIncrement;

            if (DamageCalculatorWrapper.canActivateBreakerSkill(atkUnit, defUnit)) {
                ++followupAttackPriority;
            }

            if (atkUnit.hasStatusEffect(StatusEffectType.FollowUpAttackPlus)) {
                ++followupAttackPriority;
            }

            switch (atkUnit.passiveB) {
                case PassiveB.BlackEagleRule:
                    if (atkUnit.snapshot.restHpPercentage >= 25) {
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
                case PassiveB.TsuigekiRing:
                    if (atkUnit.snapshot.restHpPercentage >= 50) {
                        ++followupAttackPriority;
                    }
                    break;
            }
            switch (atkUnit.weapon) {
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
                    if (!atkUnit.isWeaponRefined) {
                        if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, calcPotentialDamage)) {
                            ++followupAttackPriority;
                        }
                    }
                    break;
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

        if (!atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
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
            if (DamageCalculatorWrapper.canActivateBreakerSkill(defUnit, atkUnit)) {
                --followupAttackPriority;
            }

            switch (defUnit.weapon) {
                case Weapon.Marute:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (!defUnit.battleContext.initiatesCombat
                            || atkUnit.snapshot.restHpPercentage == 100) {
                            --followupAttackPriority;
                        }
                    }

                    break;
                case Weapon.Aymr:
                    if (calcPotentialDamage || defUnit.battleContext.isSolo) {
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
            }
            switch (defUnit.passiveB) {
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
        return followupAttackPriority;
    }

    /// 殺しスキルを発動できるならtrue、そうでなければfalseを返します。
    static canActivateBreakerSkill(breakerUnit, targetUnit) {
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


    __applyDamageReductionRatioBySpecial(defUnit, atkUnit) {
        let attackRange = atkUnit.getActualAttackRange(defUnit);
        switch (defUnit.special) {
            case Special.NegatingFang:
                defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                break;
            case Special.Seikabuto:
            case Special.Seii:
            case Special.KoriNoSeikyo:
                if (attackRange == 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                }
                break;
            case Special.IceMirror2:
                if (attackRange === 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.4;
                }
                break;
            case Special.Seitate:
                if (attackRange == 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.5;
                }
                break;
            case Special.Kotate:
            case Special.Nagatate:
                if (attackRange == 1) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                }
                break;
            case Special.Otate:
                if (attackRange == 1) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.5;
                }
                break;
        }
    }

    /// 追撃可能かどうかが条件として必要なスキル効果の適用
    __applySkillEffectRelatedToFollowupAttackPossibility(targetUnit, enemyUnit) {
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

    __applyInvalidationSkillEffect(atkUnit, defUnit) {
        switch (atkUnit.weapon) {
            case Weapon.WhirlingGrace:
                if (atkUnit.snapshot.restHpPercentage >= 25) {
                    if (atkUnit.getEvalSpdInCombat() >= defUnit.getSpdInCombat() + 1) {
                        defUnit.battleContext.reducesCooldownCount = false;
                    }
                }
                break;
            case Weapon.HolyYewfelle:
                if (atkUnit.battleContext.initiatesCombat || defUnit.snapshot.restHpPercentage >= 75) {
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
        switch (atkUnit.passiveB) {
            case PassiveB.SolarBrace2:
            case PassiveB.MoonlightBangle:
                defUnit.battleContext.reducesCooldownCount = false;
                break;

        }
    }

    __applySpecialSkillEffect(targetUnit, enemyUnit) {
        switch (targetUnit.special) {
            case Special.Taiyo:
                targetUnit.battleContext.specialDamageRatioToHeal = 0.5;
                break;
            case Special.Youkage:
            case Special.Yuyo:
                targetUnit.battleContext.specialDamageRatioToHeal = 0.3;
                break;
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
                targetUnit.battleContext.specialDamageRatioToHeal = 0.5;
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
                // 聖風
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
                }
                break;
            case Special.Sirius:
                // 天狼
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
                    targetUnit.battleContext.specialDamageRatioToHeal = 0.3;
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
                    targetUnit.battleContext.specialDamageRatioToHeal = 0.25;
                }
                break;
            case Special.BlueFrame:
                targetUnit.battleContext.specialAddDamage = 10;
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                    targetUnit.battleContext.specialAddDamage += 15;
                }
                break;
        }
    }

    __setSkillEffetToContext(atkUnit, defUnit) {
        this.__setBothOfAtkDefSkillEffetToContext(atkUnit, defUnit);
        this.__setBothOfAtkDefSkillEffetToContext(defUnit, atkUnit);
        this.__setBothOfAtkDefSkillEffetToContextForEnemyUnit(atkUnit, defUnit);
        this.__setBothOfAtkDefSkillEffetToContextForEnemyUnit(defUnit, atkUnit);

        if (!atkUnit.canDisableAttackOrderSwapSkill(atkUnit.snapshot.restHpPercentage)
            && !defUnit.canDisableAttackOrderSwapSkill(defUnit.snapshot.restHpPercentage)
        ) {
            atkUnit.battleContext.isDesperationActivated = atkUnit.battleContext.isDesperationActivatable || atkUnit.hasStatusEffect(StatusEffectType.Desperation);
            defUnit.battleContext.isVantageActivated = defUnit.battleContext.isVantabeActivatable || defUnit.hasStatusEffect(StatusEffectType.Vantage);
            defUnit.battleContext.isDefDesperationActivated = defUnit.battleContext.isDefDesperationActivatable;

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
        else {
            atkUnit.battleContext.isDesperationActivated = false;
            defUnit.battleContext.isVantageActivated = false;
        }
    }

    __setBothOfAtkDefSkillEffetToContext(targetUnit, enemyUnit) {
        switch (targetUnit.weapon) {
            case Weapon.SeaSearLance:
            case Weapon.LoyalistAxe:
                if ((enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) &&
                    enemyUnit.battleContext.canFollowupAttack) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.75, enemyUnit);
                }
                break;
            case Weapon.Hrist:
                if (targetUnit.snapshot.restHpPercentage <= 99) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
                break;
            case Weapon.CourtlyMaskPlus:
            case Weapon.CourtlyBowPlus:
            case Weapon.CourtlyCandlePlus:
                if (targetUnit.snapshot.restHpPercentage >= 50 && enemyUnit.battleContext.canFollowupAttack) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
                }
                break;
            case Weapon.SummerStrikers:
                if (targetUnit.battleContext.initiatesCombat && targetUnit.snapshot.restHpPercentage >= 25) {
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
            case Weapon.SplashyBucketPlus:
                {
                    targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                }
                break;
        }
        switch (targetUnit.passiveB) {
            case PassiveB.BlackEagleRule:
                if (!targetUnit.battleContext.initiatesCombat && targetUnit.snapshot.restHpPercentage >= 25) {
                    targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.8, enemyUnit);
                }
                break;
            case PassiveB.SeikishiNoKago:
                if (isRangedWeaponType(enemyUnit.weaponType)) {
                    targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                }
                break;
        }
        switch (targetUnit.passiveS) {
            case PassiveS.RengekiBogyoKenYariOno3:
                if (enemyUnit.weaponType == WeaponType.Sword ||
                    enemyUnit.weaponType == WeaponType.Lance ||
                    enemyUnit.weaponType == WeaponType.Axe) {
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

    __setBothOfAtkDefSkillEffetToContextForEnemyUnit(atkUnit, defUnit) {
        if (atkUnit.hasPassiveSkill(PassiveB.Cancel3)) {
            if (atkUnit.snapshot.restHpPercentage >= 80) {
                defUnit.battleContext.cooldownCount = 1;
            }
        }
    }

    enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit);
    }

    enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        return this._unitManager.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces);
    }

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
                && unit.partnerHeroIndex == x.heroIndex);
    }
    __addSpurInRange2(targetUnit, allyUnit, calcPotentialDamage) {
        for (let skillId of [allyUnit.passiveC, allyUnit.passiveS]) {
            switch (skillId) {
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
            }
        }
        switch (allyUnit.weapon) {
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

            default:
                break;
        }
    }

    __addSpurInRange1(targetUnit, skillId, calcPotentialDamage) {
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

    __addSelfSpurInRange1(targetUnit, skillId, calcPotentialDamage) {
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

    updateUnitSpur(targetUnit, calcPotentialDamage = false, ignoresSkillEffectFromAllies = false) {
        let self = this;
        this.profiler.profile("updateUnitSpur", () => {
            self.__updateUnitSpur(targetUnit, calcPotentialDamage, ignoresSkillEffectFromAllies);
        });
    }

    __updateUnitSpur(targetUnit, calcPotentialDamage, ignoresSkillEffectFromAllies) {
        targetUnit.resetSpurs();

        if (!calcPotentialDamage) {
            if (!ignoresSkillEffectFromAllies) {
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    // 距離に関係ないもの
                    {
                        switch (unit.passiveC) {
                            case PassiveC.WingsOfLight:
                                if (targetUnit.isMythicHero
                                    && g_appData.currentTurn <= 5
                                    && this.__countUnit(targetUnit.groupId, x => x.isOnMap && x.isMythicHero) <= 3
                                ) {
                                    targetUnit.addAllSpur(2 + g_appData.currentTurn);
                                }
                                break;
                        }
                    }

                    if (Math.abs(unit.posX - targetUnit.posX) <= 1 && Math.abs(unit.posY - targetUnit.posY) <= 2) {
                        // 5×3マス以内にいる場合
                        switch (unit.weapon) {
                            case Weapon.FlowerOfPlenty:
                                targetUnit.atkSpur += 3;
                                targetUnit.resSpur += 3;
                                break;
                        }
                    }

                    if (Math.abs(unit.posX - targetUnit.posX) <= 3 && Math.abs(unit.posY - targetUnit.posY) <= 3) {
                        // 7×7マス以内にいる場合
                        switch (unit.weapon) {
                            case Weapon.DaichiBoshiNoBreath:
                                {
                                    targetUnit.addAllSpur(2);
                                }
                                break;
                        }
                    }

                    if (this.__isNear(unit, targetUnit, 3)) {
                        // 3マス以内で発動する戦闘中バフ
                        switch (unit.weapon) {
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

                    if (this.__isInClossWithOffset(unit, targetUnit, 1)) {
                        switch (unit.weapon) {
                            case Weapon.ChargingHorn:
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
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

                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                    switch (unit.weapon) {
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

                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                    switch (unit.weapon) {
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
                    }

                    switch (unit.passiveC) {
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

            for (let skillId in [targetUnit.passiveA, targetUnit.passiveS]) {
                if (skillId == NoneValue) { continue; }
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
                    default:
                        break;
                }
            }
        }

        // 味方が2マス以内にいる時に発動するスキル
        if (isAllyAvailableRange2 && !calcPotentialDamage) {
            switch (targetUnit.weapon) {
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

            switch (targetUnit.passiveC) {
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
                case Weapon.KokkiNoKosou:
                case Weapon.MaritaNoKen:
                    targetUnit.addAllSpur(4);
                    break;
                case Weapon.ShirejiaNoKaze:
                case Weapon.BrazenCatFang:
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

            for (let skillId in [targetUnit.passiveA, targetUnit.passiveS]) {
                if (skillId == NoneValue) { continue; }
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
            switch (targetUnit.passiveA) {
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

            // 潜在ダメージ計算で無視される効果
            if (!calcPotentialDamage) {
                switch (targetUnit.weapon) {
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
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.atkSpur += amount;
                                unit.spdSpur += amount;
                            });
                        break;
                    case Weapon.MusuperuNoEnka:
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.atkSpur += amount;
                                unit.spdSpur += amount;
                            });
                        break;
                }

                for (let skillId in [targetUnit.passiveA, targetUnit.passiveS]) {
                    if (skillId == NoneValue) { continue; }
                    switch (skillId) {
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

    __isTherePartnerInSpace2(unit) {
        return this.__isThereAnyAllyUnit(unit,
            x => unit.calculateDistanceToUnit(x) <= 2
                && unit.partnerHeroIndex == x.heroIndex);
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

    __canDisableEnemySpursFromAlly(targetUnit, enemyUnit, calcPotentialDamage) {
        switch (targetUnit.weapon) {
            case Weapon.ShikkyuMyurugure:
                if (targetUnit.isWeaponRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3) || calcPotentialDamage) {
                        return true;
                    }
                }
                break;
        }
        switch (targetUnit.passiveC) {
            case PassiveC.ImpenetrableDark:
                return true;
        }
        return false;
    }
}
