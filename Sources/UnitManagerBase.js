
const MaxEnemyUnitCount = 12;
const MaxAllyUnitCount = 20;

class UnitManagerBase {
    constructor() {
        this.units = [];
        for (let i = 0; i < MaxEnemyUnitCount; ++i) {
            this.units.push(this.__createDefaultUnit("e" + i, UnitGroupType.Enemy));
        }
        for (let i = 0; i < MaxAllyUnitCount; ++i) {
            this.units.push(this.__createDefaultUnit("a" + i, UnitGroupType.Ally));
        }

        this.enemyUnits = [];
        this.allyUnits = [];

    }

    *enumerateUnits() {
        for (let unit of units) {
            yield unit;
        }
    }

    __createDefaultUnit(id, unitGroupType) {
        return new Unit(id, "", unitGroupType, MoveType.Infantry, "");
    }

}
