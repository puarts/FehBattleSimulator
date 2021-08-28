
const DamageCalcMode = {
    Simple: 0,
};

const DamageCalcModeOptions = [
    { label: "簡易", value: DamageCalcMode.Simple },
];

const TriangleAdeptType = {
    None: 0,
    Adept1: 1,
    Adept2: 2,
    Adept3: 3,
};

const TriangleAdvantageOptions = [
    { label: "なし", value: TriangleAdvantage.None },
    { label: "攻撃有利", value: TriangleAdvantage.Advantageous },
    { label: "攻撃不利", value: TriangleAdvantage.Disadvantageous },
];

const TriangleAdeptOptions = [
    { label: "なし", value: TriangleAdeptType.None },
    { label: "激化1", value: TriangleAdeptType.Adept1 },
    { label: "激化2", value: TriangleAdeptType.Adept2 },
    { label: "激化3", value: TriangleAdeptType.Adept3 },
];

function createDefaultUnit(name, groupId = UnitGroupType.Ally) {
    let unit = new Unit("", name, groupId);
    unit.placedTile = new Tile(0, 0);
    unit.maxHpWithSkills = 99;
    unit.hp = unit.maxHpWithSkills;
    unit.weapon = Weapon.SilverSwordPlus;
    unit.weaponType = WeaponType.Sword;
    unit.moveType = MoveType.Infantry;
    unit.atkWithSkills = 50;
    unit.spdWithSkills = 40;
    unit.defWithSkills = 30;
    unit.resWithSkills = 30;
    return unit;
}

class DamageCalcData {
    constructor() {
        this.damageCalc = new DamageCalculatorWrapper();
        this.mode = DamageCalcMode.Simple;
        this.attackerTriangleAdvantage = TriangleAdvantage.None;
        this.triangleAdeptType = TriangleAdeptType.None;
        this.atkUnit = createDefaultUnit("攻撃者");
        this.defUnit = createDefaultUnit("被攻撃者", UnitGroupType.Enemy);
        this.basicDamageDealt = 0;
        this.actualDamageDealt = 0;
        this.log = "";

        this.specialOptins = [];
        this.specialOptins.push({ id: -1, text: "なし" });
        for (let info of specialInfos) {
            if (isNormalAttackSpecial(info.id)) {
                this.specialOptins.push({ id: info.id, text: info.name });
            }
        }

        this.damageReductionPercentage = 0;

        // 計算過程の表示用
        this.attackerTriangleAdvantageFactor = 0;
        this.effectivenessFactor = 1;
        this.defensiveTileFactor = 0;

        this.updateDamageDealt();
    }

    updateDamageDealt() {
        this.atkUnit.battleContext.clear();
        this.defUnit.battleContext.clear();
        this.effectivenessFactor = this.atkUnit.battleContext.isEffectiveToOpponent ? 1.5 : 1.0;
        this.defensiveTileFactor = this.defUnit.battleContext.isOnDefensiveTile ? 0.3 : 0;

        this.atkUnit.saveCurrentHpAndSpecialCount();
        this.defUnit.saveCurrentHpAndSpecialCount();
        this.atkUnit.createSnapshot();
        this.defUnit.createSnapshot();

        this.defUnit.battleContext.damageReductionRatio = roundFloat(this.damageReductionPercentage * 0.01);
        this.atkUnit.tmpSpecialCount = 0;

        this.damageCalc.clearLog();
        let result = this.damageCalc.calcCombatResult(this.atkUnit, this.defUnit);
        console.log(result);
        this.basicDamageDealt = result.atkUnit_normalAttackDamage;
        this.actualDamageDealt = result.damageHistory[0].damageDealt;
        this.log = this.damageCalc.log;
    }

    syncSettingsWithAttackerTriangleAdvantage() {
        this.atkUnit.weaponType = WeaponType.Sword;
        this.defUnit.weaponType = this.__getTriangleAdvantageWeaponTypeAgainstSword();
        this.attackerTriangleAdvantageFactor = this.__getAttackerTriangleAdvantageFactor();
        this.__applyTriangleAdeptToAtkUnit();
    }

    __applyTriangleAdeptToAtkUnit() {
        switch (this.triangleAdeptType) {
            case TriangleAdeptType.None:
                break;
            case TriangleAdeptType.Adept1:
                this.atkUnit.passiveA = PassiveA.AishoGekika1;
                break;
            case TriangleAdeptType.Adept2:
                this.atkUnit.passiveA = PassiveA.AishoGekika2;
                break;
            case TriangleAdeptType.Adept3:
                this.atkUnit.passiveA = PassiveA.AishoGekika3;
                break;
            default:
                throw new Error(`Invalid type ${type}`);
        }
    }

    __getAttackerTriangleAdvantageFactor() {
        switch (this.attackerTriangleAdvantage) {
            case TriangleAdvantage.None: return 0;
            case TriangleAdvantage.Advantageous:
                switch (this.triangleAdeptType) {
                    case TriangleAdeptType.None: return 0.2;
                    case TriangleAdeptType.Adept1: return 0.3;
                    case TriangleAdeptType.Adept2: return 0.35;
                    case TriangleAdeptType.Adept3: return 0.4;
                    default:
                        throw new Error(`Invalid type ${type}`);
                }
            case TriangleAdvantage.Disadvantageous:
                switch (this.triangleAdeptType) {
                    case TriangleAdeptType.None: return -0.2;
                    case TriangleAdeptType.Adept1: return -0.3;
                    case TriangleAdeptType.Adept2: return -0.35;
                    case TriangleAdeptType.Adept3: return -0.4;
                    default:
                        throw new Error(`Invalid type ${type}`);
                }
            default:
                throw new Error(`Invalid type ${type}`);
        }
    }

    __getTriangleAdvantageWeaponTypeAgainstSword() {
        switch (this.attackerTriangleAdvantage) {
            case TriangleAdvantage.None: return WeaponType.Sword;
            case TriangleAdvantage.Advantageous: return WeaponType.Axe;
            case TriangleAdvantage.Disadvantageous: return WeaponType.Lance;
            default:
                throw new Error(`Invalid type ${type}`);
        }
    }

    writeLog(message) {
        this.log += message;
    }
    writeLogLine(message) {
        this.writeLog(message + "<br/>");
    }
}

const g_damageCalcData = new DamageCalcData();

let g_keyRepeatTimeoutId;
function startKeyRepeat(incrementFunc, speed = 250) {
    incrementFunc();
    g_keyRepeatTimeoutId = setTimeout(() => {
        startKeyRepeat(incrementFunc, speed * 0.9);
    }, speed);
}

function stopKeyRepeat() {
    clearTimeout(g_keyRepeatTimeoutId);
}

function addMultipleEventListener(element, events, handler) {
    for (let e of events) {
        element.addEventListener(e, handler);
    }
}

function addKeepChangingSettingEvent(elem, changeSettingFunc) {
    addMultipleEventListener(elem, ['mousedown', 'mouseup', 'mouseleave'], (e) => {
        if (e.type == "mousedown") {
            startKeyRepeat(changeSettingFunc);
        } else {
            stopKeyRepeat();
            g_damageCalcData.updateDamageDealt();
        }
    });
}

function addKeepChangingSettingEventById(elemId, changeSettingFunc) {
    let elem = document.getElementById(elemId);
    addKeepChangingSettingEvent(elem, changeSettingFunc);
}

const g_damageCalcVm = new Vue({
    el: "#damageCalc",
    data: g_damageCalcData,
    methods: {
        triangleAdvantageChanged: function () {
            console.log("3すくみ変更");
            g_damageCalcData.syncSettingsWithAttackerTriangleAdvantage();
            g_damageCalcData.updateDamageDealt();
        },
        updateDamageResult: function () {
            console.log("ダメージ更新");
            g_damageCalcData.updateDamageDealt();
        },
    }
});
