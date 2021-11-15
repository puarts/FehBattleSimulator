
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
    enumerateUnitsInSpecifiedGroupOnMap(groupId) {
        return this.enumerateUnitsWithPredicator(x => x.isOnMap && x.groupId == groupId);
    }

    enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit = false) {
        return this.enumerateUnitsWithPredicator(x =>
            x.groupId == targetUnit.groupId
            && (withTargetUnit || x != targetUnit)
        );
    }

    enumerateUnitsInDifferentGroup(targetUnit) {
        let targetGroup = targetUnit.getEnemyGroupId();
        return this.enumerateUnitsInSpecifiedGroup(targetGroup);
    }

    enumerateAllUnitsOnMap() {
        return this.enumerateUnitsWithPredicator(x => x.isOnMap);
    }

    enumerateUnitsInTheSameGroupOnMap(targetUnit, withTargetUnit = false) {
        return this.enumerateUnitsWithPredicator(x =>
            x.groupId == targetUnit.groupId
            && x.isOnMap
            && (withTargetUnit || x != targetUnit)
        );
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

    enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
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

    * enumerateUnitsWithinSpecifiedRange(posX, posY, unitGroup, rangeHorLength, rangeVerLength) {
        let halfHorLength = Math.floor(rangeHorLength / 2);
        let xRangeBegin = posX - halfHorLength;
        let xRangeEnd = posX + halfHorLength;
        let halfVerLength = Math.floor(rangeVerLength / 2);
        let yRangeBegin = posY - halfVerLength;
        let yRangeEnd = posY + halfVerLength;
        for (let unit of this.enumerateUnitsInSpecifiedGroupOnMap(unitGroup)) {
            if (xRangeBegin <= unit.posX && unit.posX <= xRangeEnd
                && yRangeBegin <= unit.posY && unit.posY <= yRangeEnd) {
                yield unit;
            }
        }
    }

    /**
     * @param  {UnitGroupType} unitGroup
     * @param  {Function} getStatusFunc
     * @param  {Unit} exceptUnit=null
     */
    findMaxStatusUnits(unitGroup, getStatusFunc, exceptUnitFunc = null) {
        let maxUnits = [];
        let maxValue = -1;
        for (let unit of this.enumerateUnitsInSpecifiedGroup(unitGroup)) {
            if (exceptUnitFunc != null && exceptUnitFunc(unit)) {
                continue;
            }
            if (!unit.isOnMap) {
                continue;
            }
            let value = getStatusFunc(unit);
            if (value > maxValue) {
                maxValue = value;
                maxUnits = [unit];
            }
            else if (value == maxValue) {
                maxUnits.push(unit);
            }
        }
        return maxUnits;
    }

    findMinStatusUnits(unitGroup, getStatusFunc, exceptUnitFunc = null) {
        let minUnits = [];
        let minValue = 100000;
        for (let unit of this.enumerateUnitsInSpecifiedGroup(unitGroup)) {
            if (exceptUnitFunc != null && exceptUnitFunc(unit)) {
                continue;
            }

            if (!unit.isOnMap) {
                continue;
            }
            let value = getStatusFunc(unit);
            if (value < minValue) {
                minValue = value;
                minUnits = [unit];
            }
            else if (value == minValue) {
                minUnits.push(unit);
            }
        }
        return minUnits;
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

    isThereAnyUnitInTheSameGroupOnMap(unit, conditionFunc) {
        for (let ally of this.enumerateUnitsInTheSameGroupOnMap(unit, false)) {
            if (conditionFunc(ally)) {
                return true;
            }
        }
        return false;
    }
    /**
     * @param  {Unit} unit
     * @param  {function(Unit): boolean} exceptCondition
     */
    isNextToAlliesExcept(unit, exceptCondition) {
        for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(unit, false)) {
            if (!otherUnit.isOnMap) { continue; }
            if (!exceptCondition(otherUnit)
                && unit.isNextTo(otherUnit)
            ) {
                return true;
            }
        }
        return false;
    }
    /**
     * @param  {Unit} skillOwnerUnit
     */
    isNextToOtherUnitsExceptDragonAndBeast(skillOwnerUnit) {
        return this.isNextToAlliesExcept(skillOwnerUnit,
            x => isWeaponTypeBreath(x.weaponType) || isWeaponTypeBeast(x.weaponType));
    }

    countUnitInSpecifiedGroupOnMap(groupId, predicateFunc) {
        let count = 0;
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (unit.isOnMap && predicateFunc(unit)) {
                ++count;
            }
        }
        return count;
    }

    countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
            if (predicator) {
                if (predicator(unit)) {
                    ++count;
                }
            } else {
                ++count;
            }
        }
        return count;
    }

    countEnemiesWithinSpecifiedSpaces(targetUnit, spaces, predicator) {
        let count = 0;
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces)) {
            if (predicator(unit)) {
                ++count;
            }
        }
        return count;
    }

    enumeratePartnersInSpecifiedRange(targetUnit, spaces) {
        return this.enumerateUnitsWithPredicator(x =>
            targetUnit.groupId == x.groupId
            && x.isOnMap
            && targetUnit.calculateDistanceToUnit(x) <= spaces
            && targetUnit.partnerHeroIndex == x.heroIndex);
    }

    __createDefaultUnit(id, unitGroupType) {
        return new Unit(id, "", unitGroupType, MoveType.Infantry, "");
    }

    findNearestEnemies(targetUnit, distLimit = 100) {
        return this.__findNearestUnits(targetUnit, this.enumerateUnitsInDifferentGroupOnMap(targetUnit), distLimit);
    }
    findNearestAllies(targetUnit, distLimit = 100) {
        return this.__findNearestUnits(targetUnit, this.enumerateUnitsInTheSameGroupOnMap(targetUnit), distLimit);
    }

    __findNearestUnits(targetUnit, candidateUnits, distLimit) {
        let minDist = 1000;
        let minUnits = [];
        for (let unit of candidateUnits) {
            let dist = calcDistance(unit.posX, unit.posY, targetUnit.posX, targetUnit.posY);
            if (dist > distLimit) {
                continue;
            }
            if (dist < minDist) {
                minUnits = [unit];
                minDist = dist;
            } else if (dist == minDist) {
                minUnits.push(unit);
            }
        }
        return minUnits;
    }

}
