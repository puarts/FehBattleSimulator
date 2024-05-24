
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
            if (predicator != null && predicator(unit)) {
                yield unit;
            }
        }
    }

    /**
     * @param  {number} groupId
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInSpecifiedGroup(groupId) {
        return this.enumerateUnitsWithPredicator(x => x.groupId === groupId);
    }
    /**
     * @param  {number} groupId
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInSpecifiedGroupOnMap(groupId) {
        return this.enumerateUnitsWithPredicator(x => x.isOnMap && x.groupId == groupId);
    }
    /**
     * @param  {Unit} targetUnit
     * @param  {Boolean} withTargetUnit=false
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit = false) {
        return this.enumerateUnitsWithPredicator(x =>
            x.groupId === targetUnit.groupId
            && (withTargetUnit || x !== targetUnit)
        );
    }

    /**
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInDifferentGroup(targetUnit) {
        let targetGroup = targetUnit.getEnemyGroupId();
        return this.enumerateUnitsInSpecifiedGroup(targetGroup);
    }

    /**
     * @returns {Generator<Unit>}
     */
    enumerateAllUnitsOnMap() {
        return this.enumerateUnitsWithPredicator(x => x.isOnMap);
    }

    /**
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInTheSameGroupOnMap(targetUnit, withTargetUnit = false) {
        return this.enumerateUnitsWithPredicator(x =>
            x.groupId === targetUnit.groupId
            && x.isOnMap
            && (withTargetUnit || x !== targetUnit)
        );
    }

    /**
     * @returns {Generator<Unit>}
     */
    * enumerateUnitsInDifferentGroupOnMap(targetUnit) {
        for (let unit of this.enumerateUnitsInDifferentGroup(targetUnit)) {
            if (unit.isOnMap && !unit.isDead) {
                yield unit;
            }
        }
    }

    * enumerateUnitsInTheSameGroupInCrossOf(targetUnit, offset) {
    for (let unit of this.enumerateUnitsInTheSameGroup(targetUnit)) {
            if (unit.isOnMap && !unit.isDead && unit.isInCrossWithOffset(targetUnit, offset)) {
                yield unit;
            }
        }
    }

    * enumerateUnitsInDifferentGroupInCrossOf(targetUnit, offset) {
        for (let unit of this.enumerateUnitsInDifferentGroup(targetUnit)) {
            if (unit.isOnMap && !unit.isDead && unit.isInCrossWithOffset(targetUnit, offset)) {
                yield unit;
            }
        }
    }

    existsUnitsInDifferentGroupInCrossOf(targetUnit, offset) {
        return !this.enumerateUnitsInDifferentGroupInCrossOf(targetUnit, offset).next().done
    }

    enumerateUnitsWithinSpecifiedSpaces(posX, posY, unitGroupId, spaces) {
        return this.enumerateUnitsWithPredicator(unit => {
            if (unit.groupId !== unitGroupId || !unit.isOnMap) {
                return false;
            }
            let dist = Math.abs(unit.posX - posX) + Math.abs(unit.posY - posY);
            return dist <= spaces;
        });
    }

    /**
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        let targetGroup = targetUnit.getEnemyGroupId();
        return this.enumerateUnitsWithinSpecifiedSpaces(targetUnit.posX, targetUnit.posY, targetGroup, spaces);
    }

    /**
     * @returns {Generator<Unit>}
     */
    * enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        for (let unit of this.enumerateUnitsWithinSpecifiedSpaces(targetUnit.posX, targetUnit.posY, targetUnit.groupId, spaces)) {
            if (withTargetUnit || unit !== targetUnit) {
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
     * @param {number} unitGroup
     * @param {(u: Unit) => number} getStatusFunc
     * @param {(u: Unit) => boolean} exceptUnitFunc
     */
    findMaxStatusUnits(unitGroup, getStatusFunc, exceptUnitFunc = _ => false) {
        let filterFunc = u => u.isOnMap && (exceptUnitFunc === null || !exceptUnitFunc(u))
        let targetUnits = GeneratorUtil.filter(this.enumerateUnitsInSpecifiedGroup(unitGroup), filterFunc);
        return IterUtil.maxElements(targetUnits, u => getStatusFunc(u));
    }

    /**
     * @param {number} unitGroup
     * @param {(u: Unit) => number} getStatusFunc
     * @param {(u: Unit) => boolean} exceptUnitFunc
     */
    findMinStatusUnits(unitGroup, getStatusFunc, exceptUnitFunc = null) {
        return this.findMaxStatusUnits(unitGroup, u => -getStatusFunc(u), exceptUnitFunc);
    }

    isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
            if (predicator === null || predicator?.(unit)) {
                return true;
            }
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
     * @param {Unit} unit
     * @param {function(Unit): boolean} exceptCondition
     */
    isNextToAlliesExcept(unit, exceptCondition) {
        for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(unit, false)) {
            if (!otherUnit.isOnMap) { continue; }
            if (!exceptCondition(otherUnit) &&
                unit.isNextTo(otherUnit)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {Unit} skillOwnerUnit
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

    /**
     * @param {Unit} targetUnit
     * @param {number} spaces
     * @param {(unit: Unit) => boolean} predicator
     * @returns {number}
     */
    countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
            if (predicator === null || predicator(unit)) {
                count++;
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
        let pred = unit => {
            const isSameGroup = targetUnit.groupId === unit.groupId;
            const inRange = targetUnit.calculateDistanceToUnit(unit) <= spaces;
            const isPartner = targetUnit.isPartner(unit);

            return isSameGroup && unit.isOnMap && inRange && isPartner;
        }
        return this.enumerateUnitsWithPredicator(pred);
    }

    enumeratePartnersOnMap(targetUnit) {
        let pred = unit => {
            const isSameGroup = targetUnit.groupId === unit.groupId;
            const isPartner = targetUnit.isPartner(unit);

            return isSameGroup && unit.isOnMap && isPartner;
        }
        return this.enumerateUnitsWithPredicator(pred);
    }

    existsPartnerOnMap(targetUnit) {
        return !this.enumeratePartnersOnMap(targetUnit).next().done
    }

    __createDefaultUnit(id, unitGroupType) {
        return new Unit(id, "", unitGroupType, MoveType.Infantry);
    }

    findNearestEnemies(targetUnit, distLimit = 100) {
        return this.__findNearestUnits(targetUnit, this.enumerateUnitsInDifferentGroupOnMap(targetUnit), distLimit);
    }

    findNearestAllies(targetUnit, distLimit = 100) {
        return this.__findNearestUnits(targetUnit, this.enumerateUnitsInTheSameGroupOnMap(targetUnit), distLimit);
    }

    /**
     * @param {Unit} targetUnit
     * @param {Generator<Unit>|Unit[]|Iterable<Unit>} candidateUnits
     * @param {number} distLimit
     * @returns {Unit[]}
     */
    __findNearestUnits(targetUnit, candidateUnits, distLimit) {
        return IterUtil.minElements(candidateUnits, u => targetUnit.distance(u));
    }
}
