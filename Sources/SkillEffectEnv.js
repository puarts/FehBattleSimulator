// TODO: コンストラクタを設定するか検討する
// TODO: 直接設定されたくない値をプライベートにする(targetUnitOrAlly, targetFoe)
class NodeEnv {
    static PHASE = Object.freeze({
        NULL_PHASE: 'NULL_PHASE',
        AT_START_OF_TURN: 'AT_START_OF_TURN',
        AFTER_COMBAT: 'AFTER_COMBAT',
    });

    // 戦闘中のフェーズ
    static COMBAT_PHASE = {
        NULL_PHASE: null,
        AT_START_OF_COMBAT: null,
        APPLYING_OTHER_UNITS_SKILL: null,
        APPLYING_OTHER_UNITS_SKILL_AFTER_FEUD: null,
        APPLYING_EFFECTIVE: null,
        APPLYING_COUNTER_ALL_DISTANCE: null,
        APPLYING_STATUS_SKILL_AFTER_STATUS_FIXED: null,
        APPLYING_SKILL_AFTER_STATUS_FIXED: null,
        APPLYING_ATTACK_COUNT: null,
        AFTER_APPLYING_ATTACK_COUNT: null,
        APPLYING_CAN_COUNTER: null,
        APPLYING_CAN_FOLLOW_UP: null,
        APPLYING_POTENT: null,
        AFTER_FOLLOWUP_CONFIGURED: null,
        APPLYING_NEUTRALIZATION_SKILL: null,
        APPLYING_SPECIAL: null,
        APPLYING_REF_MIT: null,
        AFTER_DAMAGE_AS_COMBAT_BEGINS_FIXED: null,
        // TODO: result = self._damageCalc.calcCombatResult(atkUnit, defUnit, damageType);の後のフェーズも設定する
    };

    static {
        Object.keys(this.COMBAT_PHASE).forEach((key, index) => {
            this.COMBAT_PHASE[key] = index; // 定義順に番号をセット
        });
    }

    /** @type {string} */
    phase = NodeEnv.PHASE.NULL_PHASE;
    /** @type {number} */
    _combatPhase = NodeEnv.COMBAT_PHASE.NULL_PHASE;
    /** @type {Unit} */
    #skillOwner = null;
    /** @type {Unit} */
    #target = null;
    // TODO: rename
    /** @type {Unit} */
    #unitDuringCombat = null;
    // TODO: rename
    /** @type {Unit} */
    #foeDuringCombat = null;
    /** @type {Unit} */
    #targetUnitOrAlly = null;
    /** @type {Unit} */
    #targetFoe = null;
    /** @type {Unit} */
    assistTarget = null;
    /** @type {Unit} */
    assistTargeting = null;
    /** @type {Unit} */
    #referenceUnit = null;
    /** @type {UnitManager} */
    #unitManager = null;
    /** @type {BeginningOfTurnSkillHandler} */
    beginningOfTurnSkillHandler = null;
    /** @type {DamageCalculatorWrapper} */
    damageCalculatorWrapper = null;
    /** @type {DamageCalculator} */
    damageCalculator = null;
    /** @type {BattleSimulatorBase} */
    battleSimulatorBase = null;
    /** @type {PostCombatSkillHander} */
    postCombatHandler = null;
    /** @type {number|null} */
    damageType = null;
    /** @type {Tile|null} */
    tile = null;
    /** @type {BattleMap} */
    battleMap = null;
    /** @type {number[]} */
    #numValues = [];
    /** @type {boolean|null} */
    isStatusFixedNullable = null;

    #logLevel = LoggerBase.LOG_LEVEL.OFF;

    /** @type {function(string): void} */
    #logFunc = (_message) => {
        // console.log(_message);
    };

    setName(name) {
        this.name = name;
        return this;
    }

    copy(overrides = {}) {
        // 新しいインスタンスを作成
        const copyInstance = new NodeEnv();

        // 現在のインスタンスのプロパティをコピー
        Object.assign(copyInstance, this);

        // プライベートプロパティをコピー
        copyInstance.setSkillOwner(this.skillOwner);
        copyInstance.setTarget(this.target);
        copyInstance.setUnitsDuringCombat(this.unitDuringCombat, this.foeDuringCombat);
        copyInstance.setTargetUnitOrAlly(this.targetUnitOrAlly);
        copyInstance.setTargetFoe(this.targetFoe);
        copyInstance.setReferenceUnit(this.referenceUnit);
        copyInstance.unitManager = this.unitManager;
        copyInstance.setLogLevel(this.getLogLevel());
        copyInstance.setLogFunc(this.#logFunc);
        copyInstance.#numValues = this.#numValues;

        // 引数で渡されたオーバーライドのプロパティで上書き
        Object.assign(copyInstance, overrides);

        return copyInstance;
    }

    setUnitsDuringCombat(unit, foe) {
        // TODO: 自動的にターゲットに設定するか検討する
        this.#unitDuringCombat = unit;
        this.#foeDuringCombat = foe;
        return this;
    }

    /**
     * @returns {UnitManager}
     */
    get unitManager() {
        return this.#unitManager;
    }

    set unitManager(unitManager) {
        this.#unitManager = unitManager;
    }

    /**
     * @param {BeginningOfTurnSkillHandler} handler
     */
    setBeginningOfTurnSkillHandler(handler) {
        this.beginningOfTurnSkillHandler = handler;
        this.unitManager = handler.unitManager;
        this.setLogFunc((message) => this.beginningOfTurnSkillHandler.writeDebugLog(message));
        return this;
    }

    /**
     * @param {DamageCalculator} damageCalculator
     */
    setDamageCalculator(damageCalculator) {
        this.damageCalculator = damageCalculator;
        this.unitManager = damageCalculator.unitManager;
        return this;
    }

    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     */
    setDamageCalculatorWrapper(damageCalculator) {
        this.damageCalculatorWrapper = damageCalculator;
        this.unitManager = damageCalculator.unitManager;
        this.setLogFunc((message) => this.damageCalculatorWrapper.writeDebugLog(message));
        return this;
    }

    /**
     * @param {BattleSimulatorBase} base
     */
    setBattleSimulatorBase(base) {
        this.battleSimulatorBase = base;
        this.unitManager = base.unitManager;
        return this;
    }

    /**
     * @param {PostCombatSkillHander} handler
     */
    setPostCombatHandler(handler) {
        this.postCombatHandler = handler;
        this.unitManager = handler.unitManager;
        return this;
    }

    /**
     * @param {UnitManager} unitManager
     */
    setUnitManager(unitManager) {
        this.unitManager = unitManager;
        return this;
    }

    /**
     *
     * @returns {Unit}
     */
    get skillOwner() {
        return this.#skillOwner;
    }

    /**
     *
     * @returns {Unit}
     */
    get target() {
        return this.#target;
    }

    get targetUnit() {
        return this.#target;
    }

    get targetUnitOrAlly() {
        return this.#targetUnitOrAlly;
    }

    get targetFoe() {
        return this.#targetFoe;
    }

    /**
     * @returns {Unit}
     */
    get unitDuringCombat() {
        return this.#unitDuringCombat;
    }

    /**
     * @returns {Unit}
     */
    get foeDuringCombat() {
        return this.#foeDuringCombat;
    }

    /**
     * 相手がいなければnullを返す。
     * @param unit
     * @returns {Unit|null}
     */
    getFoeDuringCombatOf(unit) {
        if (unit === this.unitDuringCombat) {
            return this.foeDuringCombat;
        }
        if (unit === this.foeDuringCombat) {
            return this.unitDuringCombat;
        }
        return null;
    }

    get referenceUnit() {
        return this.#referenceUnit;
    }

    setUnitsFromTargetAndEnemyUnit(targetUnit, enemyUnit) {
        this.setSkillOwner(targetUnit);
        this.setTarget(targetUnit);
        this.setUnitsDuringCombat(targetUnit, enemyUnit);
        return this;
    }

    setSkillOwner(skillOwnerUnit) {
        this.#skillOwner = skillOwnerUnit;
        this.updateTargetInfo();
        return this;
    }

    setTarget(target) {
        this.#target = target;
        this.updateTargetInfo();
        return this;
    }

    updateTargetInfo() {
        if (this.target && this.#skillOwner) {
            if (this.target.isSameGroup(this.#skillOwner)) {
                this.#targetUnitOrAlly = this.target;
            } else {
                this.#targetFoe = this.target;
            }
        }
        return this;
    }

    setTargetUnitOrAlly(unit) {
        this.#target = unit;
        return this;
    }

    setTargetFoe(foe) {
        this.#targetFoe = foe;
        return this;
    }

    setReferenceUnit(unit) {
        this.#referenceUnit = unit;
        return this;
    }

    setAssistUnits(targeting, target) {
        return this.setAssistTargeting(targeting).setAssistTarget(target);
    }

    setAssistTarget(unit) {
        this.assistTarget = unit;
        return this;
    }

    setAssistTargeting(unit) {
        this.assistTargeting = unit;
        return this;
    }

    getAssistAlly(unit) {
        if (unit === this.assistTargeting) {
            return this.assistTarget;
        } else if (unit === this.assistTarget) {
            return this.assistTargeting;
        } else {
            return null;
        }
    }

    getDamageType() {
        return this.damageType;
    }

    /**
     * @param {number} damageType
     * @returns {NodeEnv}
     */
    setDamageType(damageType) {
        this.damageType = damageType;
        return this;
    }

    setTile(tile) {
        this.tile = tile;
        return this;
    }

    setBattleMap(battleMap) {
        this.battleMap = battleMap;
        return this;
    }

    /**
     * @param {number} v
     */
    storeValue(v) {
        this.#numValues.push(v);
    }

    readValue() {
        return this.#numValues[this.#numValues.length - 1];
    }

    /**
     * @returns {number}
     */
    popValue() {
        return this.#numValues.pop();
    }

    setIsStatusFixed(isStatusFixed) {
        this.isStatusFixedNullable = isStatusFixed;
        return this;
    }

    /**
     * 明示的にfalseと設定された場合のみtrueを返す。
     * @returns {boolean}
     */
    get isStatusUnfixed() {
        if (this.isStatusFixedNullable === null) {
            return false;
        }
        return !this.isStatusFixedNullable;
    }

    get combatPhase() {
        return this._combatPhase;
    }

    setCombatPhase(phase) {
        this._combatPhase = phase;
        return this;
    }

    isAfterCombatPhase(phase) {
        return this.combatPhase > phase;
    }

    isAtOrAfterCombatPhase(phase) {
        return this.combatPhase >= phase;
    }

    /**
     * @param {function(string): void} log
     * @returns {NodeEnv}
     */
    setLogFunc(log) {
        this.#logFunc = log;
        return this;
    }

    setLogLevel(level) {
        this.#logLevel = level;
        return this;
    }

    getLogLevel() {
        return this.#logLevel;
    }

    /**
     * @param {number} level
     * @param {string} message
     */
    #log(level, message) {
        let logLevel = LoggerBase.levelStr(level);
        let name = this.name ? `[${this.name}] ` : '';
        let messageWithName = `${name}${message}`;
        let paddedLevel = logLevel.padEnd(5);
        let logMessage = `[${paddedLevel}] ${messageWithName}`;
        this.#logFunc(logMessage);

        if (this.damageCalculatorWrapper) {
            if (this.damageType !== null && this.damageType === DamageType.ActualDamage) {
                ConsoleLogger.logWithLevel(level, messageWithName, ConsoleLogger.BLACK_BG_STYLES);
            }
        } else if (this.damageCalculator) {
            if (this.damageType !== null && this.damageType === DamageType.ActualDamage) {
                ConsoleLogger.logWithLevel(level, messageWithName, ConsoleLogger.BLACK_BG_STYLES);
            }
        } else {
            ConsoleLogger.logWithLevel(level, messageWithName, ConsoleLogger.BLACK_BG_STYLES);
        }
    }

    /**
     * @param {string} message
     */
    fatal(message) {
        this.#logIf(message, LoggerBase.LOG_LEVEL.FATAL);
    }

    /**
     * @param {string} message
     */
    error(message) {
        this.#logIf(message, LoggerBase.LOG_LEVEL.ERROR);
    }

    /**
     * @param {string} message
     */
    warn(message) {
        this.#logIf(message, LoggerBase.LOG_LEVEL.WARN);
    }

    /**
     * @param {string} message
     */
    info(message) {
        this.#logIf(message, LoggerBase.LOG_LEVEL.INFO);
    }

    /**
     * @param {string} message
     */
    debug(message) {
        this.#logIf(message, LoggerBase.LOG_LEVEL.DEBUG);
    }

    /**
     * @param {string} message
     */
    trace(message) {
        this.#logIf(message, LoggerBase.LOG_LEVEL.TRACE);
    }

    /**
     * @param {string} message
     */
    trace2(message) {
        this.#logIf(message, LoggerBase.LOG_LEVEL.TRACE2);
    }

    /**
     * @param {string} message
     */
    trace3(message) {
        this.#logIf(message, LoggerBase.LOG_LEVEL.TRACE3);
    }

    /**
     * @param {string} message
     */
    trace4(message) {
        this.#logIf(message, LoggerBase.LOG_LEVEL.TRACE4);
    }

    /**
     * @param {string} message
     */
    trace5(message) {
        this.#logIf(message, LoggerBase.LOG_LEVEL.TRACE5);
    }

    #logIf(message, level) {
        if (this.getLogLevel() < level) return;
        this.#log(level, message);
    }

    // TODO: 予約が必要なフェーズを調べる
    isReservationNeededInThisPhase() {
        return [NodeEnv.PHASE.AT_START_OF_TURN, NodeEnv.PHASE.AFTER_COMBAT].includes(this.phase);
    }
}

// TODO: rename. ex) DuringCombatEnv, AtStartOfCombatEnv
class DamageCalculatorWrapperEnv extends NodeEnv {
    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {boolean|null} calcPotentialDamage
     */
    constructor(damageCalculator, targetUnit, enemyUnit, calcPotentialDamage) {
        super();
        this.setDamageCalculatorWrapper(damageCalculator);
        this.setUnitsFromTargetAndEnemyUnit(targetUnit, enemyUnit);
        this.calcPotentialDamage = calcPotentialDamage;
    }
}

class DamageCalculatorEnv extends NodeEnv {
    /**
     * @param {DamageCalculator} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     */
    constructor(damageCalculator, targetUnit, enemyUnit) {
        super();
        this.setDamageCalculator(damageCalculator);
        this.setUnitsFromTargetAndEnemyUnit(targetUnit, enemyUnit);
    }
}

// TODO: rename
class BattleSimulatorBaseEnv extends NodeEnv {
    /**
     * @param {BattleSimulatorBase} battleSimulatorBase
     * @param {Unit} targetUnit
     */
    constructor(battleSimulatorBase, targetUnit) {
        super();
        this.setBattleSimulatorBase(battleSimulatorBase);
        this.setSkillOwner(targetUnit);
        this.setTarget(targetUnit);
    }
}

class EnumerationEnv extends NodeEnv {
    /**
     * @param {UnitManager} unitManager
     * @param {Unit} targetUnit
     */
    constructor(unitManager, targetUnit) {
        super();
        this.unitManager = unitManager;
        this.setSkillOwner(targetUnit);
        this.setTarget(targetUnit);
    }
}

// TODO: rename
class ForFoesEnv extends NodeEnv {
    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {Unit} enemyAllyUnit
     * @param {boolean} calcPotentialDamage
     */
    constructor(damageCalculator,
                targetUnit, enemyUnit, enemyAllyUnit,
                calcPotentialDamage) {
        super();
        this.setDamageCalculatorWrapper(damageCalculator);

        this.setSkillOwner(enemyAllyUnit);
        this.setTarget(targetUnit);
        this.setUnitsDuringCombat(enemyUnit, targetUnit);
        this.calcPotentialDamage = calcPotentialDamage;
    }
}

// TODO: rename
class ForAlliesEnv extends NodeEnv {
    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {Unit} allyUnit
     */
    constructor(damageCalculator, targetUnit, enemyUnit, allyUnit) {
        super();
        this.setDamageCalculatorWrapper(damageCalculator);
        this.setSkillOwner(allyUnit);
        this.setTarget(targetUnit);
        this.setUnitsDuringCombat(targetUnit, enemyUnit);
    }
}

class PreventingStatusEffectEnv extends NodeEnv {
    /**
     * @param {Unit} skillOwnerUnit
     * @param {Unit} targetUnit
     * @param {number} statusEffect
     */
    constructor(skillOwnerUnit, targetUnit, statusEffect) {
        super();
        this.setSkillOwner(skillOwnerUnit);
        this.setTarget(targetUnit);
        this.statusEffect = statusEffect;
    }
}

class NeutralizingEndActionEnv extends NodeEnv {
    /**
     * @param {Unit} skillOwnerUnit
     * @param {Unit} targetUnit
     */
    constructor(skillOwnerUnit, targetUnit) {
        super();
        this.setSkillOwner(skillOwnerUnit)
        this.setTarget(targetUnit);
    }
}
