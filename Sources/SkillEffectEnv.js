// TODO: コンストラクタを設定するか検討する
// TODO: 直接設定されたくない値をプライベートにする(targetUnitOrAlly, targetFoe)
class NodeEnv {
    static PHASE = Object.freeze({
        NULL_PHASE: 'NULL_PHASE',
        AT_START_OF_TURN: 'AT_START_OF_TURN',
        AFTER_COMBAT: 'AFTER_COMBAT',
    });

    // ALL, TRACE, DEBUG, INFO, WARN, ERROR, FATAL, OFF
    static LOG_LEVEL = Object.freeze({
        OFF: 1,
        FATAL: 2,
        ERROR: 3,
        WARN: 4,
        INFO: 5,
        DEBUG: 6,
        TRACE: 7,
        ALL: 8
    })

    /** @type {string} */
    phase = NodeEnv.PHASE.NULL_PHASE;
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

    #logLevel = NodeEnv.LOG_LEVEL.OFF;

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

    get unitDuringCombat() {
        return this.#unitDuringCombat;
    }

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
        this.#foeDuringCombat = foe;
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
     * @param {string} logLevel
     * @param {string} message
     */
    #log(logLevel, message) {
        let name = this.name ? `[${this.name}] ` : '';
        let messageWithName = `${name}${message}`;
        let paddedLevel = logLevel.padEnd(5);
        let logMessage = `[${paddedLevel}] ${messageWithName}`;
        this.#logFunc(logMessage);

        if (this.damageCalculatorWrapper) {
            if (this.damageType !== null && this.damageType === DamageType.ActualDamage) {
                this.logWithLevel(logLevel, messageWithName, this.blackBGStyles);
            }
        } else if (this.damageCalculator) {
            if (this.damageType !== null && this.damageType === DamageType.ActualDamage) {
                this.logWithLevel(logLevel, messageWithName, this.blackBGStyles);
            }
        } else {
            this.logWithLevel(logLevel, messageWithName, this.blackBGStyles);
        }
    }

    logWithLevel(level, message, styles) {
        const {FATAL, ERROR, WARN, INFO, DEBUG, TRACE, UNKNOWN} = styles;
        switch (level) {
            case 'FATAL':
                console.log('[%cFATAL%c] ' + message, FATAL, '');
                break;
            case 'ERROR':
                console.log('[%cERROR%c] ' + message, ERROR, '');
                break;
            case 'WARN':
                console.log('[%cWARN %c] ' + message, WARN, '');
                break;
            case 'INFO':
                console.log('[%cINFO %c] ' + message, INFO, '');
                break;
            case 'DEBUG':
                console.log('[%cDEBUG%c] ' + message, DEBUG, '');
                break;
            case 'TRACE':
                console.log('[%cTRACE%c] ' + `%c${message}%c`, TRACE, '', TRACE, '');
                break;
            default:
                console.log(`[%cUNKNOWN:${level}%c] ` + message, UNKNOWN, '');
        }
    }

    // 黒背景用のスタイル
    blackBGStyles = {
        FATAL: 'color: #FF6B6B; font-weight: bold;',
        ERROR: 'color: #FF5252; font-weight: bold;',
        WARN: 'color: #FFC107; font-weight: bold;',
        INFO: 'color: #64B5F6;',
        DEBUG: 'color: #81C784;',
        TRACE: 'color: #888888;',
        UNKNOWN: 'color: white;'
    };

    // 白背景用のスタイル
    whiteBGStyles = {
        FATAL: 'color: darkred; font-weight: bold;',
        ERROR: 'color: red; font-weight: bold;',
        WARN: 'color: orange; font-weight: bold;',
        INFO: 'color: blue;',
        DEBUG: 'color: green;',
        TRACE: 'color: #888888;',
        UNKNOWN: 'color: black;'
    };

    /**
     * @param {string} message
     */
    fatal(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.FATAL) return;
        this.#log('FATAL', message);
    }

    /**
     * @param {string} message
     */
    error(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.ERROR) return;
        this.#log('ERROR', message);
    }

    /**
     * @param {string} message
     */
    warn(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.WARN) return;
        this.#log('WARN', message);
    }

    /**
     * @param {string} message
     */
    info(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.INFO) return;
        this.#log('INFO', message);
    }

    /**
     * @param {string} message
     */
    debug(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.DEBUG) return;
        this.#log('DEBUG', message);
    }

    /**
     * @param {string} message
     */
    trace(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.TRACE) return;
        this.#log('TRACE', message);
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
