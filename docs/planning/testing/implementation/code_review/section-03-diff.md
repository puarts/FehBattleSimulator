diff --git a/Sources/TestUtilities.js b/Sources/TestUtilities.js
index bfbecca8..a6296f12 100644
--- a/Sources/TestUtilities.js
+++ b/Sources/TestUtilities.js
@@ -267,6 +267,7 @@ class UnitBuilder {
     atPosition(x, y) {
         this._unit.placedTile.posX = x;
         this._unit.placedTile.posY = y;
+        this._unit._hasExplicitPosition = true;
         return this;
     }
 
@@ -344,6 +345,131 @@ class RegressionTestHelper {
     }
 }
 
+class BattleScenarioBuilder {
+    constructor() {
+        this._attacker = null;
+        this._defender = null;
+        this._allies = [];
+        this._foes = [];
+        this._turn = 1;
+    }
+
+    withAttacker(unit) {
+        this._attacker = unit;
+        return this;
+    }
+
+    withDefender(unit) {
+        this._defender = unit;
+        return this;
+    }
+
+    addAlly(unit) {
+        this._allies.push(unit);
+        return this;
+    }
+
+    addFoe(unit) {
+        this._foes.push(unit);
+        return this;
+    }
+
+    onTurn(turnNumber) {
+        this._turn = turnNumber;
+        return this;
+    }
+
+    _autoPlaceUnits() {
+        let allyUnits = [this._attacker, ...this._allies];
+        let enemyUnits = [this._defender, ...this._foes];
+        let occupied = new Set();
+
+        // Collect already-positioned units
+        for (let unit of [...allyUnits, ...enemyUnits]) {
+            if (unit._hasExplicitPosition) {
+                occupied.add(`${unit.placedTile.posX},${unit.placedTile.posY}`);
+            }
+        }
+
+        // Auto-place attacker at (0,1) if not explicitly positioned
+        if (!this._attacker._hasExplicitPosition) {
+            let pos = this._findFreePosition(0, occupied);
+            this._attacker.placedTile.posX = pos[0];
+            this._attacker.placedTile.posY = pos[1];
+            occupied.add(`${pos[0]},${pos[1]}`);
+        }
+
+        // Auto-place defender adjacent to attacker at (1,1) if not explicitly positioned
+        if (!this._defender._hasExplicitPosition) {
+            let pos = this._findFreePosition(5, occupied);
+            this._defender.placedTile.posX = pos[0];
+            this._defender.placedTile.posY = pos[1];
+            occupied.add(`${pos[0]},${pos[1]}`);
+        }
+
+        // Auto-place remaining allies along column 0
+        for (let ally of this._allies) {
+            if (!ally._hasExplicitPosition) {
+                let pos = this._findFreePosition(0, occupied);
+                ally.placedTile.posX = pos[0];
+                ally.placedTile.posY = pos[1];
+                occupied.add(`${pos[0]},${pos[1]}`);
+            }
+        }
+
+        // Auto-place remaining foes along column 5
+        for (let foe of this._foes) {
+            if (!foe._hasExplicitPosition) {
+                let pos = this._findFreePosition(5, occupied);
+                foe.placedTile.posX = pos[0];
+                foe.placedTile.posY = pos[1];
+                occupied.add(`${pos[0]},${pos[1]}`);
+            }
+        }
+    }
+
+    _findFreePosition(col, occupied) {
+        for (let row = 0; row < 100; row++) {
+            let key = `${col},${row}`;
+            if (!occupied.has(key)) {
+                return [col, row];
+            }
+        }
+        return [col, 0];
+    }
+
+    execute() {
+        if (!this._attacker || !this._defender) {
+            throw new Error('BattleScenarioBuilder requires both attacker and defender');
+        }
+
+        this._autoPlaceUnits();
+
+        let calculator = new test_DamageCalculator();
+        calculator.unitManager.units = [this._attacker, this._defender, ...this._allies, ...this._foes];
+        g_appData = calculator.unitManager;
+        calculator.battleContext.currentTurn = this._turn;
+        calculator.updateAllUnitSpur();
+        let result = calculator.calcDamage(this._attacker, this._defender);
+        resetGlobalTestState();
+        return result;
+    }
+
+    executeBeginningOfTurn() {
+        this._autoPlaceUnits();
+
+        let handler = new test_BeginningOfTurnSkillHandler();
+        let allUnits = [this._attacker, this._defender, ...this._allies, ...this._foes].filter(u => u != null);
+        handler.unitManager.units = allUnits;
+        g_appData = handler.unitManager;
+        handler.battleContext.currentTurn = this._turn;
+        for (let unit of allUnits) {
+            handler.applySkillsForBeginningOfTurn(unit);
+        }
+        resetGlobalTestState();
+    }
+}
+
 function test_executeTest(testFunc, isTestTimeLogEnabled = false) {
     let log = "";
     using_(new ScopedStopwatch(x => {
diff --git a/Tests/TestHelper.test.js b/Tests/TestHelper.test.js
index bec6b9c8..f2704a24 100644
--- a/Tests/TestHelper.test.js
+++ b/Tests/TestHelper.test.js
@@ -108,6 +108,142 @@ describe('Global state management', () => {
     });
 });
 
+describe('BattleScenarioBuilder', () => {
+    beforeEach(() => {
+        resetGlobalTestState();
+    });
+
+    test('withAttacker(unit).withDefender(unit).execute() returns a combat result', () => {
+        let attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        let result = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .execute();
+        expect(result).toBeDefined();
+        expect(typeof result.atkUnit_normalAttackDamage).toBe('number');
+    });
+
+    test('addAlly(unit) registers an ally unit in the battle', () => {
+        let attacker = UnitBuilder.createDummy(UnitGroupType.Ally, { atk: 55 }).build();
+        let defender = UnitBuilder.createDummy(UnitGroupType.Enemy, { def: 30 }).build();
+        let resultWithoutAlly = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .execute();
+
+        // Reset units for second run
+        attacker = UnitBuilder.createDummy(UnitGroupType.Ally, { atk: 55 }).build();
+        defender = UnitBuilder.createDummy(UnitGroupType.Enemy, { def: 30 }).build();
+        // SpurAtk3 adds +4 atk spur when adjacent
+        let ally = UnitBuilder.createDummy(UnitGroupType.Ally)
+            .withPassiveC(PassiveC.SpurAtk3)
+            .atPosition(0, 0)
+            .build();
+        let resultWithAlly = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .addAlly(ally)
+            .execute();
+        // Spur Atk 3 should increase attacker's damage
+        expect(resultWithAlly.atkUnit_normalAttackDamage).toBeGreaterThan(resultWithoutAlly.atkUnit_normalAttackDamage);
+    });
+
+    test('addFoe(unit) registers an enemy unit in the battle', () => {
+        let attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let defender = UnitBuilder.createDummy(UnitGroupType.Enemy, { def: 40 }).build();
+        let foe = UnitBuilder.createDummy(UnitGroupType.Enemy)
+            .withPassiveC(PassiveC.SpurDef3)
+            .atPosition(5, 0)
+            .build();
+        let resultWithoutFoe = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .execute();
+
+        attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        defender = UnitBuilder.createDummy(UnitGroupType.Enemy, { def: 40 }).build();
+        foe = UnitBuilder.createDummy(UnitGroupType.Enemy)
+            .withPassiveC(PassiveC.SpurDef3)
+            .atPosition(5, 0)
+            .build();
+        let resultWithFoe = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .addFoe(foe)
+            .execute();
+        // Spur Def 3 should reduce attacker's damage to defender
+        expect(resultWithFoe.atkUnit_normalAttackDamage).toBeLessThan(resultWithoutFoe.atkUnit_normalAttackDamage);
+    });
+
+    test('onTurn(3) sets the turn number correctly', () => {
+        let attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        let builder = new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .onTurn(3);
+        // Access internal state to verify turn is stored
+        expect(builder._turn).toBe(3);
+        let result = builder.execute();
+        expect(result).toBeDefined();
+    });
+
+    test('executeBeginningOfTurn() runs beginning-of-turn processing', () => {
+        let unit = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let builder = new BattleScenarioBuilder()
+            .withAttacker(unit)
+            .withDefender(UnitBuilder.createDummy(UnitGroupType.Enemy).build());
+        // Should not throw
+        builder.executeBeginningOfTurn();
+    });
+
+    test('units without explicit positions are auto-placed without overlap', () => {
+        let attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        let ally1 = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let ally2 = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let foe1 = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        let foe2 = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        new BattleScenarioBuilder()
+            .withAttacker(attacker)
+            .withDefender(defender)
+            .addAlly(ally1)
+            .addAlly(ally2)
+            .addFoe(foe1)
+            .addFoe(foe2)
+            .execute();
+        // Collect all positions
+        let positions = [attacker, defender, ally1, ally2, foe1, foe2].map(
+            u => `${u.placedTile.posX},${u.placedTile.posY}`
+        );
+        let uniquePositions = new Set(positions);
+        expect(uniquePositions.size).toBe(positions.length);
+    });
+
+    test('execute() cleans up global state afterward', () => {
+        let atk1 = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let def1 = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        let prevAppData = g_appData;
+        new BattleScenarioBuilder()
+            .withAttacker(atk1)
+            .withDefender(def1)
+            .execute();
+        // g_appData should be reset after execute (not the calculator's unitManager)
+        expect(g_appData).toBeInstanceOf(UnitManager);
+        expect(g_appData).not.toBe(prevAppData);
+
+        // Second scenario should work independently
+        let atk2 = UnitBuilder.createDummy(UnitGroupType.Ally).build();
+        let def2 = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
+        let result = new BattleScenarioBuilder()
+            .withAttacker(atk2)
+            .withDefender(def2)
+            .execute();
+        expect(result).toBeDefined();
+    });
+});
+
 describe('RegressionTestHelper', () => {
     test('extractCombatSnapshot extracts key values from combat result', () => {
         let atk = UnitBuilder.createDummy(UnitGroupType.Ally).build();
