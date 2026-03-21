diff --git a/Tests/StatusIndexUnification.test.js b/Tests/StatusIndexUnification.test.js
new file mode 100644
index 00000000..2cb8dcc0
--- /dev/null
+++ b/Tests/StatusIndexUnification.test.js
@@ -0,0 +1,72 @@
+// Tests/StatusIndexUnification.test.js
+import { describe, it, expect } from 'vitest';
+import { StatusIndex } from '../Sources/StatusConstants.js';
+
+describe('StatusIndex Unification', () => {
+    describe('StatusIndex values are correct', () => {
+        // Verify StatusIndex enum values haven't changed during refactoring
+        it('StatusIndex.ATK === 0', () => {
+            expect(StatusIndex.ATK).toBe(0);
+        });
+        it('StatusIndex.SPD === 1', () => {
+            expect(StatusIndex.SPD).toBe(1);
+        });
+        it('StatusIndex.DEF === 2', () => {
+            expect(StatusIndex.DEF).toBe(2);
+        });
+        it('StatusIndex.RES === 3', () => {
+            expect(StatusIndex.RES).toBe(3);
+        });
+    });
+
+    describe('SkillEffect.js does not export StatusIndex numeric aliases', () => {
+        // Verify that SkillEffect.js ATK/SPD/DEF/RES exports are functions (DSL), not numbers
+        it('ATK/SPD/DEF/RES from SkillEffect.js are functions, not numbers', async () => {
+            const se = await import('../Sources/SkillEffect.js');
+            // These should be StatsNode factory functions, not numeric aliases
+            expect(typeof se.ATK).toBe('function');
+            expect(typeof se.SPD).toBe('function');
+            expect(typeof se.DEF).toBe('function');
+            expect(typeof se.RES).toBe('function');
+        });
+    });
+
+    describe('Layer 1-3 files import StatusIndex from StatusConstants.js', () => {
+        // Static analysis: verify no Layer 1-3 file imports ATK/SPD/DEF/RES from SkillEffect.js
+        it('no Layer 1-3 source files import bare ATK/SPD/DEF/RES from SkillEffect.js', async () => {
+            const fs = await import('fs');
+            const path = await import('path');
+            const sourcesDir = path.resolve(process.cwd(), 'Sources');
+
+            // Layer 1-3 files that should NOT import from SkillEffect.js
+            const layer1to3Files = [
+                'StatusConstants.js', 'SkillConstants.js', 'HeroInfoConstants.js', 'UnitConstants.js', // L1
+                'Skill.js', 'HeroInfo.js', 'Tile.js', 'Cell.js', 'Structures.js', 'Table.js',       // L2
+                'UnitCore.js', 'UnitBattle.js', 'BattleContext.js', 'UnitManager.js', 'BattleMap.js', // L3
+                'GlobalBattleContext.js',                                                               // L3
+            ];
+
+            for (const fileName of layer1to3Files) {
+                const filePath = path.join(sourcesDir, fileName);
+                if (!fs.existsSync(filePath)) continue;
+                const content = fs.readFileSync(filePath, 'utf-8');
+                // Check for imports of bare ATK/SPD/DEF/RES from SkillEffect.js
+                const badImports = content.match(
+                    /import\s+\{[^}]*\b(?:ATK|SPD|DEF|RES)\b[^}]*\}\s+from\s+['"]\.\/SkillEffect\.js['"]/g
+                );
+                expect(badImports, `${fileName} should not import ATK/SPD/DEF/RES from SkillEffect.js`).toBeNull();
+            }
+        });
+    });
+
+    describe('DSL functions remain functional after changes', () => {
+        // Verify ATK_SPD and similar DSL stat functions still work
+        it('ATK_SPD(5) returns a valid StatsNode', async () => {
+            const { ATK_SPD } = await import('../Sources/SkillEffect.js');
+            const node = ATK_SPD(5);
+            expect(node).toBeDefined();
+            // StatsNode should have atk/spd/def/res-like structure
+            expect(node).toHaveProperty('evaluate');
+        });
+    });
+});
