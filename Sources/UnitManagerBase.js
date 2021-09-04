
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

    }

    *enumerateUnits() {
        for (let unit of this.units) {
            yield unit;
        }
    }

    *enumerateUnitsWithPredicator(predicator) {
        for (let unit of this.enumerateUnits()) {
            if (predicator(unit)) {
                yield unit;
            }
        }
    }

    enumerateUnitsInSpecifiedGroup(groupId) {
        return this.enumerateUnitsWithPredicator(x => x.groupId == groupId);
    }

    * enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit = false) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(targetUnit.groupId)) {
            if (withTargetUnit || unit != targetUnit) {
                yield unit;
            }
        }
    }

    __createDefaultUnit(id, unitGroupType) {
        return new Unit(id, "", unitGroupType, MoveType.Infantry, "");
    }

}
