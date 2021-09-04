
const MaxEnemyUnitCount = 12;
const MaxAllyUnitCount = 20;

class UnitManager {
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

    enumerateUnitsInDifferentGroup(targetUnit) {
        let targetGroup = targetUnit.getEnemyGroupId();
        return this.enumerateUnitsInSpecifiedGroup(targetGroup);
    }

    * enumerateUnitsInTheSameGroupOnMap(targetUnit, withTargetUnit = false) {
        for (let unit of this.enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit)) {
            if (unit.isOnMap) {
                yield unit;
            }
        }
    }

    * enumerateUnitsInDifferentGroupOnMap(targetUnit) {
        for (let unit of this.enumerateUnitsInDifferentGroup(targetUnit)) {
            if (unit.isOnMap) {
                yield unit;
            }
        }
    }

    enumerateUnitsWithinSpecifiedSpaces(posX, posY, unitGroupId, spaces) {
        return this.enumerateUnitsWithPredicator(unit => {
            if (unit.groupId != unitGroupId || !unit.isOnMap) {
                return false;
            }
            let dist = Math.abs(unit.posX - posX) + Math.abs(unit.posY - posY);
            return dist <= spaces;
        });
    }

    enumerateUnitsInTheDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        let targetGroup = targetUnit.getEnemyGroupId();
        return this.enumerateUnitsWithinSpecifiedSpaces(targetUnit.posX, targetUnit.posY, targetGroup, spaces);
    }

    * enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        for (let unit of this.enumerateUnitsWithinSpecifiedSpaces(targetUnit.posX, targetUnit.posY, targetUnit.groupId, spaces)) {
            if (withTargetUnit || unit != targetUnit) {
                yield unit;
            }
        }
    }

    isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
            if (predicator != null && !predicator(unit)) {
                continue;
            }
            return true;
        }
        return false;
    }

    countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
            if (predicator != null && predicator(unit)) {
                ++count;
            }
        }
        return count;
    }

    __createDefaultUnit(id, unitGroupType) {
        return new Unit(id, "", unitGroupType, MoveType.Infantry, "");
    }

}
