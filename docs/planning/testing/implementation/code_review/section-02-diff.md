diff --git a/Sources/TestUtilities.js b/Sources/TestUtilities.js
index 75638cf5..3fefe58e 100644
--- a/Sources/TestUtilities.js
+++ b/Sources/TestUtilities.js
@@ -171,6 +171,174 @@ function test_calcDamage(atkUnit, defUnit, isLogEnabled = false) {
     return calclator.calcDamage(atkUnit, defUnit);
 }
 
+class UnitBuilder {
+    constructor() {
+        this._unit = null;
+    }
+
+    static fromHero(heroName, groupId = UnitGroupType.Ally) {
+        let builder = new UnitBuilder();
+        builder._unit = g_testHeroDatabase.createUnit(heroName, groupId);
+        return builder;
+    }
+
+    static default(groupId = UnitGroupType.Ally) {
+        let builder = new UnitBuilder();
+        builder._unit = test_createDefaultUnit(groupId);
+        return builder;
+    }
+
+    static createDummy(groupId = UnitGroupType.Ally, { hp = 50, atk = 50, spd = 50, def = 50, res = 50 } = {}) {
+        let builder = new UnitBuilder();
+        builder._unit = test_createDefaultUnit(groupId);
+        builder._unit.maxHpWithSkills = hp;
+        builder._unit.hp = hp;
+        builder._unit.atkWithSkills = atk;
+        builder._unit.spdWithSkills = spd;
+        builder._unit.defWithSkills = def;
+        builder._unit.resWithSkills = res;
+        builder._unit.saveCurrentHpAndSpecialCount();
+        return builder;
+    }
+
+    withStats({ hp, atk, spd, def, res } = {}) {
+        if (hp !== undefined) { this._unit.maxHpWithSkills = hp; this._unit.hp = hp; }
+        if (atk !== undefined) { this._unit.atkWithSkills = atk; }
+        if (spd !== undefined) { this._unit.spdWithSkills = spd; }
+        if (def !== undefined) { this._unit.defWithSkills = def; }
+        if (res !== undefined) { this._unit.resWithSkills = res; }
+        return this;
+    }
+
+    withAtk(value) { this._unit.atkWithSkills = value; return this; }
+    withSpd(value) { this._unit.spdWithSkills = value; return this; }
+    withDef(value) { this._unit.defWithSkills = value; return this; }
+    withRes(value) { this._unit.resWithSkills = value; return this; }
+
+    withWeapon(weaponId) {
+        this._unit.weapon = weaponId;
+        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
+        return this;
+    }
+
+    withSupport(supportId) {
+        this._unit.support = supportId;
+        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
+        return this;
+    }
+
+    withSpecial(specialId) {
+        this._unit.special = specialId;
+        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
+        return this;
+    }
+
+    withPassiveA(passiveAId) {
+        this._unit.passiveA = passiveAId;
+        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
+        return this;
+    }
+
+    withPassiveB(passiveBId) {
+        this._unit.passiveB = passiveBId;
+        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
+        return this;
+    }
+
+    withPassiveC(passiveCId) {
+        this._unit.passiveC = passiveCId;
+        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
+        return this;
+    }
+
+    withPassiveS(passiveSId) {
+        this._unit.passiveS = passiveSId;
+        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
+        return this;
+    }
+
+    withPassiveX(passiveXId) {
+        this._unit.passiveX = passiveXId;
+        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
+        return this;
+    }
+
+    atPosition(x, y) {
+        this._unit.placedTile.posX = x;
+        this._unit.placedTile.posY = y;
+        return this;
+    }
+
+    withHpPercent(percent) {
+        this._unit.hp = Math.floor(this._unit.maxHpWithSkills * percent / 100);
+        return this;
+    }
+
+    withSpecialCount(count) {
+        this._unit.specialCount = count;
+        return this;
+    }
+
+    withBonuses({ atk, spd, def, res } = {}) {
+        if (atk !== undefined) { this._unit.atkBuff = atk; }
+        if (spd !== undefined) { this._unit.spdBuff = spd; }
+        if (def !== undefined) { this._unit.defBuff = def; }
+        if (res !== undefined) { this._unit.resBuff = res; }
+        return this;
+    }
+
+    withPenalties({ atk, spd, def, res } = {}) {
+        if (atk !== undefined) { this._unit.atkDebuff = atk; }
+        if (spd !== undefined) { this._unit.spdDebuff = spd; }
+        if (def !== undefined) { this._unit.defDebuff = def; }
+        if (res !== undefined) { this._unit.resDebuff = res; }
+        return this;
+    }
+
+    build() {
+        return this._unit;
+    }
+}
+
+function resetGlobalTestState() {
+    g_appData = new UnitManager();
+}
+
+class RegressionTestHelper {
+    static extractCombatSnapshot(combatResult) {
+        return {
+            atkUnit_normalAttackDamage: combatResult.atkUnit_normalAttackDamage,
+            defUnit_normalAttackDamage: combatResult.defUnit_normalAttackDamage,
+            atkUnit_atk: combatResult.atkUnit_atk,
+            defUnit_def: combatResult.defUnit_def,
+            atkRestHp: combatResult.atkRestHp,
+            defRestHp: combatResult.defRestHp,
+        };
+    }
+
+    static extractUnitSnapshot(unit) {
+        return {
+            hp: unit.hp,
+            maxHpWithSkills: unit.maxHpWithSkills,
+            atkWithSkills: unit.atkWithSkills,
+            spdWithSkills: unit.spdWithSkills,
+            defWithSkills: unit.defWithSkills,
+            resWithSkills: unit.resWithSkills,
+            atkBuff: unit.atkBuff,
+            spdBuff: unit.spdBuff,
+            defBuff: unit.defBuff,
+            resBuff: unit.resBuff,
+            atkDebuff: unit.atkDebuff,
+            spdDebuff: unit.spdDebuff,
+            defDebuff: unit.defDebuff,
+            resDebuff: unit.resDebuff,
+            specialCount: unit.specialCount,
+            posX: unit.placedTile ? unit.placedTile.posX : null,
+            posY: unit.placedTile ? unit.placedTile.posY : null,
+        };
+    }
+}
+
 function test_executeTest(testFunc, isTestTimeLogEnabled = false) {
     let log = "";
     using_(new ScopedStopwatch(x => {
diff --git a/Tests/TestHelper.test.js b/Tests/TestHelper.test.js
index 525fe784..bec6b9c8 100644
--- a/Tests/TestHelper.test.js
+++ b/Tests/TestHelper.test.js
@@ -1,4 +1,136 @@
-describe('Test Helper Tests', () => {
-    // テストはsection-02で追加
-    test('placeholder', () => {});
+describe('UnitBuilder', () => {
+    test('fromHero creates a valid unit from hero name', () => {
+        let unit = UnitBuilder.fromHero('マルス').build();
+        expect(unit).not.toBeNull();
+        expect(unit.heroInfo).not.toBeNull();
+        expect(unit.weapon).not.toBe(0);
+    });
+
+    test('default creates a default unit', () => {
+        let unit = UnitBuilder.default().build();
+        expect(unit).not.toBeNull();
+        expect(unit.maxHpWithSkills).toBe(40);
+        expect(unit.atkWithSkills).toBe(40);
+        expect(unit.spdWithSkills).toBe(40);
+        expect(unit.defWithSkills).toBe(30);
+        expect(unit.resWithSkills).toBe(30);
+    });
+
+    test('createDummy creates a unit with all stats at 50', () => {
+        let unit = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        expect(unit.maxHpWithSkills).toBe(50);
+        expect(unit.hp).toBe(50);
+        expect(unit.atkWithSkills).toBe(50);
+        expect(unit.spdWithSkills).toBe(50);
+        expect(unit.defWithSkills).toBe(50);
+        expect(unit.resWithSkills).toBe(50);
+    });
+
+    test('createDummy with custom stats', () => {
+        let unit = UnitBuilder.createDummy(UnitGroupType.Ally, { hp: 99, atk: 60, spd: 40, def: 30, res: 20 }).build();
+        expect(unit.maxHpWithSkills).toBe(99);
+        expect(unit.hp).toBe(99);
+        expect(unit.atkWithSkills).toBe(60);
+        expect(unit.spdWithSkills).toBe(40);
+        expect(unit.defWithSkills).toBe(30);
+        expect(unit.resWithSkills).toBe(20);
+    });
+
+    test('withWeapon recalculates stats after setting skill', () => {
+        let unit = UnitBuilder.fromHero('マルス').withWeapon(Weapon.SilverSwordPlus).build();
+        expect(unit.weapon).toBe(Weapon.SilverSwordPlus);
+    });
+
+    test('withStats overrides stats', () => {
+        let unit = UnitBuilder.default().withStats({ atk: 99 }).build();
+        expect(unit.atkWithSkills).toBe(99);
+        // 未指定のステータスは変更されない
+        expect(unit.spdWithSkills).toBe(40);
+    });
+
+    test('withHpPercent sets HP to percentage of max HP', () => {
+        let unit = UnitBuilder.createDummy(UnitGroupType.Ally, { hp: 40 }).withHpPercent(50).build();
+        expect(unit.hp).toBe(Math.floor(unit.maxHpWithSkills * 50 / 100));
+    });
+
+    test('withSpecialCount sets special count', () => {
+        let unit = UnitBuilder.fromHero('マルス').withSpecialCount(0).build();
+        expect(unit.specialCount).toBe(0);
+    });
+
+    test('withBonuses applies buffs', () => {
+        let unit = UnitBuilder.createDummy().withBonuses({ atk: 6 }).build();
+        expect(unit.atkBuff).toBe(6);
+    });
+
+    test('withPenalties applies debuffs', () => {
+        let unit = UnitBuilder.createDummy().withPenalties({ spd: -7 }).build();
+        expect(unit.spdDebuff).toBe(-7);
+    });
+
+    test('atPosition sets tile position', () => {
+        let unit = UnitBuilder.createDummy().atPosition(3, 4).build();
+        expect(unit.placedTile.posX).toBe(3);
+        expect(unit.placedTile.posY).toBe(4);
+    });
+
+    test('method chaining works correctly', () => {
+        let unit = UnitBuilder.fromHero('マルス')
+            .withWeapon(Weapon.SilverSwordPlus)
+            .withStats({ atk: 50 })
+            .atPosition(1, 2)
+            .build();
+        expect(unit.weapon).toBe(Weapon.SilverSwordPlus);
+        expect(unit.atkWithSkills).toBe(50);
+        expect(unit.placedTile.posX).toBe(1);
+        expect(unit.placedTile.posY).toBe(2);
+    });
+});
+
+describe('Global state management', () => {
+    test('resetGlobalTestState resets g_appData to clean UnitManager', () => {
+        g_appData = { dummy: true };
+        resetGlobalTestState();
+        expect(g_appData).toBeInstanceOf(UnitManager);
+    });
+
+    test('separate execute calls do not leak state', () => {
+        let atk = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let def = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        let prevAppData = g_appData;
+        test_calcDamage(atk, def);
+        // test_calcDamage sets g_appData to its own UnitManager
+        expect(g_appData).not.toBe(prevAppData);
+        resetGlobalTestState();
+        // After reset, g_appData is a fresh UnitManager (not the one from calcDamage)
+        expect(g_appData).not.toBe(prevAppData);
+        expect(g_appData).toBeInstanceOf(UnitManager);
+    });
+});
+
+describe('RegressionTestHelper', () => {
+    test('extractCombatSnapshot extracts key values from combat result', () => {
+        let atk = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let def = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        let result = test_calcDamage(atk, def);
+        let snapshot = RegressionTestHelper.extractCombatSnapshot(result);
+        expect(snapshot).toHaveProperty('atkUnit_normalAttackDamage');
+        expect(snapshot).toHaveProperty('defUnit_normalAttackDamage');
+        expect(snapshot).toHaveProperty('atkRestHp');
+        expect(snapshot).toHaveProperty('defRestHp');
+    });
+
+    test('extractUnitSnapshot extracts unit status', () => {
+        let unit = UnitBuilder.createDummy().withBonuses({ atk: 6 }).build();
+        let snapshot = RegressionTestHelper.extractUnitSnapshot(unit);
+        expect(snapshot).toHaveProperty('hp');
+        expect(snapshot).toHaveProperty('maxHpWithSkills');
+        expect(snapshot).toHaveProperty('atkWithSkills');
+        expect(snapshot).toHaveProperty('spdWithSkills');
+        expect(snapshot).toHaveProperty('defWithSkills');
+        expect(snapshot).toHaveProperty('resWithSkills');
+        expect(snapshot).toHaveProperty('atkBuff');
+        expect(snapshot.atkBuff).toBe(6);
+        expect(snapshot).toHaveProperty('specialCount');
+    });
 });
