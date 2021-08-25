
class DamageCalculatorWrapper {
    constructor() {
        this._damageCalc = new DamageCalculator();
    }

    get log() {
        return this._damageCalc.log;
    }

    get simpleLog() {
        return this._damageCalc.simpleLog;
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

    calcPrecombatSpecialDamage(atkUnit, defUnit) {
        return this._damageCalc.calcPrecombatSpecialDamage(atkUnit, defUnit);
    }

    calcPrecombatSpecialResult(atkUnit, defUnit) {
        return this._damageCalc.calcPrecombatSpecialResult(atkUnit, defUnit);
    }

    calcCombatResult(atkUnit, defUnit) {
        return this._damageCalc.calcCombatResult(atkUnit, defUnit);
    }
}
