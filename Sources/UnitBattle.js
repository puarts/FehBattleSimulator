import { Unit } from './UnitCore.js';

// ─── 戦闘関連メソッド（prototype 拡張） ───
// Layer 5 への依存なし。


/**
 * @returns {Unit}
 */
Unit.prototype.createSnapshotIfNull = function() {
    if (this.snapshot !== null) {
        return this.snapshot;
    }

    this.snapshot = this.__createSnapshotImpl();
    return this.snapshot;
};

/**
 * @returns {Unit}
 */
Unit.prototype.createSnapshot = function() {
    this.snapshot = this.__createSnapshotImpl();
    return this.snapshot;
};

Unit.prototype.deleteSnapshot = function() {
    this.snapshot = null;
};

Unit.prototype.addAllSpur = function(amount) {
    let amountNum = Number(amount);
    this.atkSpur += amountNum;
    this.spdSpur += amountNum;
    this.defSpur += amountNum;
    this.resSpur += amountNum;
};

/**
 * @param {number} atk
 * @param {number} spd
 * @param {number} def
 * @param {number} res
 */
Unit.prototype.addSpurs = function(atk, spd, def, res) {
    this.atkSpur += atk;
    this.spdSpur += spd;
    this.defSpur += def;
    this.resSpur += res;
};

Unit.prototype.addAtkSpdSpurs = function(atk, spd = atk) {
    this.atkSpur += atk;
    this.spdSpur += spd;
};

Unit.prototype.addAtkDefSpurs = function(atk, def = atk) {
    this.atkSpur += atk;
    this.defSpur += def;
};

Unit.prototype.addAtkResSpurs = function(atk, res = atk) {
    this.atkSpur += atk;
    this.resSpur += res;
};

Unit.prototype.addSpdDefSpurs = function(spd, def = spd) {
    this.spdSpur += spd;
    this.defSpur += def;
};

Unit.prototype.addSpdResSpurs = function(spd, res = spd) {
    this.spdSpur += spd;
    this.resSpur += res;
};

Unit.prototype.addDefResSpurs = function(def, res = def) {
    this.defSpur += def;
    this.resSpur += res;
};

Unit.prototype.addSpursWithoutAtk = function(spd, def = spd, res = spd) {
    this.spdSpur += spd;
    this.defSpur += def;
    this.resSpur += res;
};

Unit.prototype.addSpursWithoutSpd = function(atk, def = atk, res = atk) {
    this.atkSpur += atk;
    this.defSpur += def;
    this.resSpur += res;
};

Unit.prototype.addSpursWithoutDef = function(atk, spd = atk, res = atk) {
    this.atkSpur += atk;
    this.spdSpur += spd;
    this.resSpur += res;
};

Unit.prototype.addSpursWithoutRes = function(atk, spd = atk, def = atk) {
    this.atkSpur += atk;
    this.spdSpur += spd;
    this.defSpur += def;
};

Unit.prototype.getSpurs = function() {
    return [this.atkSpur, this.spdSpur, this.defSpur, this.resSpur];
};

Object.defineProperty(Unit.prototype, 'spurs', {
    get: function() {
    return [this.atkSpur, this.spdSpur, this.defSpur, this.resSpur];
    },
    configurable: true,
});

Object.defineProperty(Unit.prototype, 'spurs', {
    set: function(values) {
    this.atkSpur = values[0];
    this.spdSpur = values[1];
    this.defSpur = values[2];
    this.resSpur = values[3];
    },
    configurable: true,
});

Unit.prototype.getBuffTotalInPreCombat = function() {
    return this.getBuffsInPreCombat().reduce((a, b) => a + b, 0);
};

Unit.prototype.getBuffTotalInCombat = function(enemyUnit) {
    return this.getAtkBuffInCombat(enemyUnit)
        + this.getSpdBuffInCombat(enemyUnit)
        + this.getDefBuffInCombat(enemyUnit)
        + this.getResBuffInCombat(enemyUnit);
};

Unit.prototype.getDebuffTotalInCombat = function() {
    return this.getAtkDebuffInCombat()
        + this.getSpdDebuffInCombat()
        + this.getDefDebuffInCombat()
        + this.getResDebuffInCombat();
};

Unit.prototype.getDebuffsInCombat = function() {
    return [
        this.getAtkDebuffInCombat(),
        this.getSpdDebuffInCombat(),
        this.getDefDebuffInCombat(),
        this.getResDebuffInCombat(),
    ];
};

Unit.prototype.isBuffedInCombat = function(enemyUnit) {
    return this.isPanicEnabled ? false : this.getBuffsInCombat(enemyUnit).some(b => b > 0);
};

Unit.prototype.resetSpurs = function() {
    this.atkSpur = 0;
    this.spdSpur = 0;
    this.defSpur = 0;
    this.resSpur = 0;
};

Unit.prototype.copySpursToSnapshot = function() {
    if (this.snapshot === null) {
        return;
    }

    this.snapshot.atkSpur = this.atkSpur;
    this.snapshot.spdSpur = this.spdSpur;
    this.snapshot.defSpur = this.defSpur;
    this.snapshot.resSpur = this.resSpur;
    this.snapshot.battleContext.invalidatesAtkBuff = this.battleContext.invalidatesAtkBuff;
    this.snapshot.battleContext.invalidatesSpdBuff = this.battleContext.invalidatesSpdBuff;
    this.snapshot.battleContext.invalidatesDefBuff = this.battleContext.invalidatesDefBuff;
    this.snapshot.battleContext.invalidatesResBuff = this.battleContext.invalidatesResBuff;
    this.snapshot._greatTalents = [...this._greatTalents];
};

Unit.prototype.calculateReducedHealAmountInCombat = function(healHp) {
    let reducedHeal = this.hasDeepWounds(true) ? healHp : 0;
    return this.battleContext.calculateReducedHealAmount(reducedHeal);
};

Unit.prototype.hasDeepWounds = function(isDuringCombat = false) {
    if (isDuringCombat && this.battleContext.hasDeepWoundsDuringCombat) {
        return true;
    }
    return this.hasStatusEffect(StatusEffectType.DeepWounds) || this.battleContext.hasDeepWounds;
};

Unit.prototype.takeDamageInCombat = function(damage, leavesOneHp = false) {
    if (this.isDead) {
        return;
    }
    this.restHp = MathUtil.ensureMin(this.restHp - damage, leavesOneHp ? 1 : 0);
};

Unit.prototype.healInCombat = function(healAmount) {
    let reducedHeal = this.hasDeepWounds(true) ? healAmount : 0;
    healAmount -= this.battleContext.calculateReducedHealAmount(reducedHeal);
    this.restHp = MathUtil.ensureMax(this.restHp + healAmount, this.maxHpWithSkills);
    return [this.restHp, healAmount];
};

Unit.prototype.getTriangleAdeptAdditionalRatio = function() {
    if (isTriangleAdeptSkill(this.passiveA)
        || isTriangleAdeptSkill(this.weapon)
        || (this.weapon === Weapon.Forukuvangu && this.isWeaponSpecialRefined)
        || (this.weapon === Weapon.TomeOfOrder && this.isWeaponSpecialRefined)
        || (this.weapon === Weapon.SeireiNoHogu && this.isWeaponSpecialRefined && this.battleContext.restHpPercentage >= 25)
        || this.hasStatusEffect(StatusEffectType.TriangleAdept)
    ) {
        return 0.2;
    } else if (this.passiveA === PassiveA.AishoGekika2) {
        return 0.15;
    } else if (this.passiveA === PassiveA.AishoGekika1) {
        return 0.1;
    }
    return 0;
};

Unit.prototype.neutralizesSelfTriangleAdvantage = function() {
    // @TODO: 相性相殺1,2も同様
    return this.hasPassiveSkill(PassiveB.AisyoSosatsu3)
        || this.hasStatusEffect(StatusEffectType.CancelAffinity);
};

Unit.prototype.reversesTriangleAdvantage = function() {
    // @TODO: 相性相殺1,2は反転しない
    return this.hasPassiveSkill(PassiveB.AisyoSosatsu3)
        || this.hasStatusEffect(StatusEffectType.CancelAffinity);
};

Unit.prototype.__getBuffMultiply = function() {
    let isPanic = this.hasPanic && !this.canNullPanic();
    return isPanic ? -1 : 1;
};

Unit.prototype.getSpdInPrecombatWithoutDebuff = function() {
    return Number(this.spdWithSkills) + Number(this.spdBuff) * this.__getBuffMultiply() + this.getGreatTalent(StatusIndex.SPD);
};

Unit.prototype.getSpdInPrecombat = function() {
    return Math.min(99, this.getSpdInPrecombatWithoutDebuff() + Number(this.spdDebuff));
};

Unit.prototype.getEvalAtkInCombat = function(enemyUnit = null) {
    return this.getAtkInCombat(enemyUnit) + this.__getEvalAtkAdd();
};

Unit.prototype.getEvalSpdInCombat = function(enemyUnit = null) {
    return this.getSpdInCombat(enemyUnit) + this.__getEvalSpdAdd();
};

Unit.prototype.getEvalSpdInPrecombat = function() {
    return this.getSpdInPrecombat() + this.__getEvalSpdAdd();
};

Unit.prototype.__getEvalAtkAdd = function() {
    return this.__getEvalStatsAdd()[StatusIndex.ATK] ?? 0;
};

Unit.prototype.__getEvalSpdAdd = function() {
    return getEvalSpdAdd(this) + this.__getEvalStatsAdd()[StatusIndex.SPD] ?? 0;
};

Unit.prototype.getAtkInPrecombatWithoutDebuff = function() {
    return Number(this.atkWithSkills) + Number(this.atkBuff) * this.__getBuffMultiply() + this.getGreatTalent(StatusIndex.ATK);
};

Unit.prototype.getAtkInPrecombat = function() {
    return Math.min(99, this.getAtkInPrecombatWithoutDebuff() + Number(this.atkDebuff));
};

Unit.prototype.getStatusesInPrecombat = function() {
    return [
        this.getAtkInPrecombat(),
        this.getSpdInPrecombat(),
        this.getDefInPrecombat(),
        this.getResInPrecombat()
    ];
};

Unit.prototype.getEvalStatusesInPrecombat = function(includesHp = false) {
    let stats = [
        this.getEvalAtkInPrecombat(),
        this.getEvalSpdInPrecombat(),
        this.getEvalDefInPrecombat(),
        this.getEvalResInPrecombat()
    ];
    return includesHp ? [this.hp, ...stats] : stats;
};

Unit.prototype.__getBuffInCombat = function(getInvalidatesFunc, getBuffFunc, getInvalidateOwnDebuffFunc) {
    let buffMult = this.__getBuffMultiply();
    let buff = 0;
    if (getInvalidatesFunc()) {
        if (buffMult < 0) {
            buff = getBuffFunc() * buffMult;
        }
    } else {
        buff = getBuffFunc() * buffMult;
    }

    if (buff < 0 && getInvalidateOwnDebuffFunc()) {
        return 0;
    }

    return buff;
};

Unit.prototype.getAtkBuffInCombat = function(enemyUnit) {
    let invalidates =
        enemyUnit !== null &&
        enemyUnit.battleContext.invalidatesAtkBuff ||
        enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
    return this.__getBuffInCombat(
        () => invalidates,
        () => Number(this.atkBuff),
        () => this.battleContext.invalidatesOwnAtkDebuff
    );
};

Unit.prototype.getSpdBuffInCombat = function(enemyUnit) {
    let invalidates = enemyUnit !== null &&
        enemyUnit.battleContext.invalidatesSpdBuff ||
        enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
    return this.__getBuffInCombat(
        () => enemyUnit == null ? false : invalidates,
        () => Number(this.spdBuff),
        () => this.battleContext.invalidatesOwnSpdDebuff
    );
};

Unit.prototype.getResBuffInCombat = function(enemyUnit) {
    let invalidates = enemyUnit !== null &&
        enemyUnit.battleContext.invalidatesResBuff ||
        enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
    return this.__getBuffInCombat(
        () => enemyUnit == null ? false : invalidates,
        () => Number(this.resBuff),
        () => this.battleContext.invalidatesOwnResDebuff
    );
};

Unit.prototype.getDefBuffInCombat = function(enemyUnit) {
    let invalidates = enemyUnit !== null &&
        enemyUnit.battleContext.invalidatesDefBuff ||
        enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
    return this.__getBuffInCombat(
        () => enemyUnit == null ? false : invalidates,
        () => Number(this.defBuff),
        () => this.battleContext.invalidatesOwnDefDebuff
    );
};

/**
 * @returns {[number, number, number, number]}
 */
Unit.prototype.getBuffsInPreCombat = function() {
    return [
        this.atkBuff * this.__getBuffMultiply(),
        this.spdBuff * this.__getBuffMultiply(),
        this.defBuff * this.__getBuffMultiply(),
        this.resBuff * this.__getBuffMultiply(),
    ];
};

/**
 * @returns {[number, number, number, number]}
 */
Unit.prototype.getBuffsInCombat = function(enemyUnit) {
    return [
        this.getAtkBuffInCombat(enemyUnit),
        this.getSpdBuffInCombat(enemyUnit),
        this.getDefBuffInCombat(enemyUnit),
        this.getResBuffInCombat(enemyUnit),
    ];
};

Unit.prototype.getBuffsEnemyDebuffsInCombat = function(enemyUnit) {
    return [
        [this.getAtkBuffInCombat(enemyUnit), enemyUnit.getAtkDebuffInCombat()],
        [this.getSpdBuffInCombat(enemyUnit), enemyUnit.getSpdDebuffInCombat()],
        [this.getDefBuffInCombat(enemyUnit), enemyUnit.getDefDebuffInCombat()],
        [this.getResBuffInCombat(enemyUnit), enemyUnit.getResDebuffInCombat()],
    ]
};

Unit.prototype.__getStatusInCombat = function(getInvalidatesFunc, getStatusWithoutBuffFunc, getBuffFunc, getInvalidateOwnDebuffFunc) {
    let statusWithoutBuff = getStatusWithoutBuffFunc();
    let buff = this.__getBuffInCombat(getInvalidatesFunc, getBuffFunc, getInvalidateOwnDebuffFunc);
    return statusWithoutBuff + buff;
};

/**
 * @param {Unit} enemyUnit
 * @returns {number[]}
 */
Unit.prototype.getStatusesInCombat = function(enemyUnit = null) {
    return [
        this.getAtkInCombat(enemyUnit),
        this.getSpdInCombat(enemyUnit),
        this.getDefInCombat(enemyUnit),
        this.getResInCombat(enemyUnit),
    ].map(value => MathUtil.ensureMin(value, 0));
};

/**
 * @param {Unit} enemyUnit
 * @returns {number[]}
 */
Unit.prototype.getEvalStatusesInCombat = function(enemyUnit = null) {
    return [
        this.getEvalAtkInCombat(enemyUnit),
        this.getEvalSpdInCombat(enemyUnit),
        this.getEvalDefInCombat(enemyUnit),
        this.getEvalResInCombat(enemyUnit),
    ];
};

/**
 * 最も高いステータスを取得
 * @param {Unit} enemyUnit
 * @param {boolean[]} statusFlags (ex) 最も高いステータス: [true, true, true, true], 守備と魔防の高い方: [false, false, true, true]
 */
Unit.prototype.getHighestStatusInCombat = function(enemyUnit = null, statusFlags) {
    let statuses = this.getStatusesInCombat(enemyUnit);
    return Math.max(...statuses.map((s, i) => statusFlags[i] ? s : 0));
};

Unit.prototype.getAtkInCombat = function(enemyUnit = null) {
    let invalidates = enemyUnit !== null &&
        (enemyUnit.battleContext.invalidatesAtkBuff ||
            enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat));
    return this.__getStatusInCombat(
        () => invalidates,
        () => this.__getAtkInCombatWithoutBuff(),
        () => Number(this.atkBuff),
        () => this.battleContext.invalidatesOwnAtkDebuff
    );
};

Unit.prototype.getSpdInCombat = function(enemyUnit = null) {
    let invalidates = enemyUnit !== null &&
        (enemyUnit.battleContext.invalidatesSpdBuff ||
            enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat));
    return this.__getStatusInCombat(
        () => invalidates,
        () => this.__getSpdInCombatWithoutBuff(),
        () => Number(this.spdBuff),
        () => this.battleContext.invalidatesOwnSpdDebuff
    );
};

Unit.prototype.getDefInCombat = function(enemyUnit = null) {
    let invalidates = enemyUnit !== null &&
        (enemyUnit.battleContext.invalidatesDefBuff ||
            enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat));
    return this.__getStatusInCombat(
        () => invalidates,
        () => this.__getDefInCombatWithoutBuff(),
        () => Number(this.defBuff),
        () => this.battleContext.invalidatesOwnDefDebuff
    );
};

Unit.prototype.getResInCombat = function(enemyUnit = null) {
    let invalidates = enemyUnit !== null &&
        (enemyUnit.battleContext.invalidatesResBuff ||
            enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat));
    return this.__getStatusInCombat(
        () => invalidates,
        () => this.__getResInCombatWithoutBuff(),
        () => Number(this.resBuff),
        () => this.battleContext.invalidatesOwnResDebuff
    );
};

Unit.prototype.getAtkDebuffInCombat = function() {
    return this.battleContext.invalidatesOwnAtkDebuff ? 0 : Number(this.atkDebuff);
};

Unit.prototype.getSpdDebuffInCombat = function() {
    return this.battleContext.invalidatesOwnSpdDebuff ? 0 : Number(this.spdDebuff);
};

Unit.prototype.getDefDebuffInCombat = function() {
    return this.battleContext.invalidatesOwnDefDebuff ? 0 : Number(this.defDebuff);
};

Unit.prototype.getResDebuffInCombat = function() {
    return this.battleContext.invalidatesOwnResDebuff ? 0 : Number(this.resDebuff);
};

Unit.prototype.__getAtkInCombatWithoutBuff = function() {
    return Number(this.atkWithSkills) + this.getAtkDebuffInCombat() + Number(this.atkSpur) + this.getGreatTalent(StatusIndex.ATK);
};

Unit.prototype.__getSpdInCombatWithoutBuff = function() {
    return Number(this.spdWithSkills) + this.getSpdDebuffInCombat() + Number(this.spdSpur) + this.getGreatTalent(StatusIndex.SPD);
};

Unit.prototype.__getDefInCombatWithoutBuff = function() {
    return Number(this.defWithSkills) + this.getDefDebuffInCombat() + Number(this.defSpur) + this.getGreatTalent(StatusIndex.DEF);
};

Unit.prototype.__getResInCombatWithoutBuff = function() {
    return Number(this.resWithSkills) + this.getResDebuffInCombat() + Number(this.resSpur) + this.getGreatTalent(StatusIndex.RES);
};

Unit.prototype.getEvalAtkInPrecombat = function() {
    return this.getAtkInPrecombat() + this.__getEvalAtkAdd();
};

Unit.prototype.getEvalDefInPrecombat = function() {
    return this.getDefInPrecombat() + this.__getEvalDefAdd();
};

Unit.prototype.getEvalDefInCombat = function(enemyUnit = null) {
    return this.getDefInCombat(enemyUnit) + this.__getEvalDefAdd();
};

Unit.prototype.getDefInPrecombatWithoutDebuff = function() {
    let mit = Number(this.defWithSkills);
    let mitBuff = Number(this.defBuff) * this.__getBuffMultiply();
    return mit + mitBuff + this.getGreatTalent(StatusIndex.DEF);
};

Unit.prototype.getDefInPrecombat = function() {
    return Math.min(99, this.getDefInPrecombatWithoutDebuff() + Number(this.defDebuff));
};

Unit.prototype.getDefDiffInCombat = function(enemyUnit) {
    return this.getDefInCombat(enemyUnit) - enemyUnit.getDefInCombat(this);
};

Unit.prototype.getResInPrecombatWithoutDebuff = function() {
    let mit = Number(this.resWithSkills);
    let mitBuff = Number(this.resBuff) * this.__getBuffMultiply();
    return mit + mitBuff + this.getGreatTalent(StatusIndex.RES);
};

Unit.prototype.getResInPrecombat = function() {
    return Math.min(99, this.getResInPrecombatWithoutDebuff() + Number(this.resDebuff));
};

Unit.prototype.getEvalResInCombat = function(enemyUnit = null) {
    return this.getResInCombat(enemyUnit) + this.__getEvalResAdd();
};

Unit.prototype.getEvalResInPrecombat = function() {
    return this.getResInPrecombat() + this.__getEvalResAdd();
};

Unit.prototype.getEvalResDiffInCombat = function(enemyUnit) {
    return this.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(this);
};

Unit.prototype.getEvalResDiffInPrecombat = function(enemyUnit) {
    return this.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
};

/**
 * 攻撃が相手の攻撃+n以上かどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isHigherOrEqualAtkInCombat = function(enemyUnit, n = 0) {
    return this.getEvalAtkInCombat(enemyUnit) >= enemyUnit.getEvalAtkInCombat(this) + n;
};

/**
 * 守備が「相手の守備+n」以下かどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isLowerOrEqualDefInPrecombat = function(enemyUnit, n = 0) {
    return this.statusEvalUnit.getEvalDefInPrecombat() <= enemyUnit.statusEvalUnit.getEvalDefInPrecombat() + n;
};

/**
 * 守備が相手の守備+n以下かどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isLowerOrEqualDefInCombat = function(enemyUnit, n = 0) {
    return this.getEvalDefInCombat(enemyUnit) <= enemyUnit.getEvalDefInCombat(this) + n;
};

/**
 * 攻撃が相手の攻撃+n以上かどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isHigherOrEqualAtkInPrecombat = function(enemyUnit, n = 0) {
    return this.statusEvalUnit.getEvalAtkInPrecombat() >= enemyUnit.statusEvalUnit.getEvalAtkInPrecombat() + n;
};

/**
 * 守備が相手の守備+nより高いかどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isHigherDefInPrecombat = function(enemyUnit, n = 0) {
    return this.isHigherOrEqualDefInPrecombat(enemyUnit, n + 1);
};

/**
 * 守備が相手の守備+n以上かどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isHigherOrEqualDefInPrecombat = function(enemyUnit, n = 0) {
    return this.statusEvalUnit.getEvalDefInPrecombat() >= enemyUnit.statusEvalUnit.getEvalDefInPrecombat() + n;
};

/**
 * 魔防が相手の魔防+nより高いかどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isHigherResInPrecombat = function(enemyUnit, n = 0) {
    return this.isHigherOrEqualResInPrecombat(enemyUnit, n + 1);
};

/**
 * 魔防が相手の魔防+n以上かを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isHigherOrEqualResInPrecombat = function(enemyUnit, n = 0) {
    return this.statusEvalUnit.getEvalResInPrecombat() >= enemyUnit.statusEvalUnit.getEvalResInPrecombat() + n;
};

/**
 * 魔防が「相手の魔防+n」より低いかどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isLowerResInPrecombat = function(enemyUnit, n = 0) {
    return this.statusEvalUnit.getEvalResInPrecombat() < enemyUnit.statusEvalUnit.getEvalResInPrecombat() + n;
};

/**
 * 魔防が相手の魔防+nより高いかどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isHigherResInCombat = function(enemyUnit, n = 0) {
    return this.getEvalResInCombat(enemyUnit) > enemyUnit.getEvalResInCombat(this) + n;
};

/**
 * 速さが相手の速さ+nより高いかどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isHigherSpdInCombat = function(enemyUnit, n = 0) {
    return this.isHigherOrEqualSpdInCombat(enemyUnit, n + 1);
};

/**
 * 速さが相手の速さ+n以上かどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isHigherOrEqualSpdInCombat = function(enemyUnit, n = 0) {
    return this.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(this) + n;
};

/**
 * 魔防が相手の魔防+n以上かどうかを返す
 * @param {Unit} enemyUnit
 * @param {number} n
 * @return {boolean}
 */
Unit.prototype.isHigherOrEqualResInCombat = function(enemyUnit, n = 0) {
    return this.getEvalResInCombat(enemyUnit) >= enemyUnit.getEvalResInCombat(this) + n;
};

Unit.prototype.__getEvalDefAdd = function() {
    return this.__getEvalStatsAdd()[StatusIndex.DEF] ?? 0;
};

Unit.prototype.__getEvalResAdd = function() {
    return getEvalResAdd(this) + this.__getEvalStatsAdd()[StatusIndex.RES] ?? 0;
};

Unit.prototype.canCounterAttackToAllDistance = function() {
    if (this.weaponInfo == null) {
        return false;
    }

    if (this.battleContext.canCounterattackToAllDistance) {
        return true;
    }

    for (let skillInfo of this.enumerateSkillInfos()) {
        if (skillInfo.canCounterattackToAllDistance) {
            return true;
        }
    }

    return false;
};

/// 指定した特効を無効化できるかどうかを調べます。
Unit.prototype.canInvalidateSpecifiedEffectiveAttack = function(effective) {
    if (effective === EffectiveType.Flying) {
        if (this.hasStatusEffect(StatusEffectType.ShieldFlying)) {
            return true;
        }
    } else if (effective === EffectiveType.Armor) {
        if (this.hasStatusEffect(StatusEffectType.ShieldArmor)) {
            return true;
        }
    } else if (effective === EffectiveType.Dragon) {
        if (this.hasStatusEffect(StatusEffectType.ShieldDragon)) {
            return true;
        }
    }

    for (let skillInfo of this.enumerateSkillInfos()) {
        if (skillInfo.invalidatedEffectives.includes(effective)) {
            return true;
        }
    }

    if (this.battleContext.invalidatedEffectives.includes(effective)) return true;

    switch (this.weapon) {
        case Weapon.Marute:
            if (this.isWeaponRefined && effective === EffectiveType.Armor) {
                return true;
            }
            break;
    }

    return false;
};

/// 神罰の杖を無効化できるか調べます。
Unit.prototype.canInvalidateWrathfulStaff = function() {
    switch (this.weapon) {
        case Weapon.SplashyBucketPlus:
            return true;
    }
    for (let skillId of [this.passiveB, this.passiveS]) {
        switch (skillId) {
            case PassiveB.SeimeiNoGofu3:
            case PassiveB.MysticBoost4:
                return true;
        }
    }
    return false;
};

/**
 * ユニットが待ち伏せや攻め立てなどの攻撃順変更効果を無効化できるかどうかを判定します。
 */
Unit.prototype.canDisableAttackOrderSwapSkill = function(restHpPercentage, defUnit) {
    for (let skillId of this.enumerateSkills()) {
        let func = getSkillFunc(skillId, canDisableAttackOrderSwapSkillFuncMap);
        if (func?.call(this, restHpPercentage, defUnit) ?? false) {
            return true;
        }
        switch (skillId) {
            case Weapon.Queensblade:
                return true;
            case Weapon.ArmorpinDaggerPlus:
            case Weapon.DawnSuzu:
            case Weapon.YoiyamiNoDanougi:
            case Weapon.YoiyamiNoDanougiPlus:
            case Weapon.SeitenNoMaiougi:
            case Weapon.SeitenNoMaiougiPlus:
            case Weapon.RyokuunNoMaiougi:
            case Weapon.RyokuunNoMaiougiPlus:
            case Weapon.RyusatsuNoAnkiPlus:
            case Weapon.CaltropDaggerPlus:
                return true;
            case PassiveS.HardyBearing1:
                if (restHpPercentage === 100) {
                    return true;
                }
                break;
            case PassiveS.HardyBearing2:
                if (restHpPercentage >= 50) {
                    return true;
                }
                break;
            case PassiveS.HardyBearing3:
                return true;
        }
    }
    for (let skillId of defUnit.enumerateSkills()) {
        switch (skillId) {
            case Weapon.Queensblade:
                return true;
        }
    }
    return false;
};

/**
 * @param  {boolean} initiatesCombat
 */
Unit.prototype.initBattleContext = function(initiatesCombat) {
    this.battleContext.clear();
    this.battleContext.maxHpWithSkills = this.maxHpWithSkills;
    this.battleContext.hpBeforeCombat = this.hp;
    this.battleContext.restHp = this.hp;
    this.battleContext.initiatesCombat = initiatesCombat;
    this.battleContext.specialCount = this.specialCount;
};

Unit.prototype.canActivatePrecombatSpecial = function() {
    return this.hasPrecombatSpecial() && Number(this.specialCount) === 0;
};

Unit.prototype.hasPrecombatSpecial = function() {
    return isPrecombatSpecial(this.special);
};

