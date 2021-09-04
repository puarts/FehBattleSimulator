
class test_UnitManager extends UnitManager {
    constructor() {
        super();
    }

    * enumerateUnitsInSpecifiedGroup(groupId) {
        for (let unit of this.enumerateUnits()) {
            if (unit.groupId == groupId) {
                yield unit;
            }
        }
    }
}

test('UnitManager_EnumerateUnits', () => {
    let manager = new test_UnitManager();

    let allies = Array.from(manager.enumerateUnitsInSpecifiedGroup(UnitGroupType.Ally));

    expect(allies.length).toBeGreaterThan(0);
    for (let unit of allies) {
        expect(unit.groupId).toBe(UnitGroupType.Ally);
    }
});
