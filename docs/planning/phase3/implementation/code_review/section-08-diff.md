diff --git a/Sources/AetherRaidSimulatorMain.js b/Sources/AetherRaidSimulatorMain.js
index 7b807c78..7a513305 100644
--- a/Sources/AetherRaidSimulatorMain.js
+++ b/Sources/AetherRaidSimulatorMain.js
@@ -5,8 +5,6 @@ import { BattleSimulatorBase, createMap, loadSettings } from './BattleSimulatorB
 import { ScopedStopwatch, using_ } from './Utilities.js';
 import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos } from './SampleSkillInfos.js';
 import { heroInfos } from './SampleHeroInfos.js';
-import { initVueComponents } from './VueComponents.js';
-
 // Side-effect imports for skill registration
 import './SkillEffectCore.js';
 import './SkillEffectEnv.js';
diff --git a/Sources/ArenaSimulatorMain.js b/Sources/ArenaSimulatorMain.js
index f5f69428..af2f8f3d 100644
--- a/Sources/ArenaSimulatorMain.js
+++ b/Sources/ArenaSimulatorMain.js
@@ -8,8 +8,6 @@ import { GameMode } from './DamageCalculator.js';
 import { MapType, isArenaMap } from './BattleMap.js';
 import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos } from './SampleSkillInfos.js';
 import { heroInfos } from './SampleHeroInfos.js';
-import { initVueComponents } from './VueComponents.js';
-
 // Side-effect imports for skill registration
 import './SkillEffectCore.js';
 import './SkillEffectEnv.js';
diff --git a/Sources/SummonerDuelsSimulatorMain.js b/Sources/SummonerDuelsSimulatorMain.js
index 5ead0411..2b89d660 100644
--- a/Sources/SummonerDuelsSimulatorMain.js
+++ b/Sources/SummonerDuelsSimulatorMain.js
@@ -9,8 +9,6 @@ import { UnitGroupType } from './UnitConstants.js';
 import { SoundEffectId } from './AudioManager.js';
 import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos } from './SampleSkillInfos.js';
 import { heroInfos } from './SampleHeroInfos.js';
-import { initVueComponents } from './VueComponents.js';
-
 // Side-effect imports for skill registration
 import './SkillEffectCore.js';
 import './SkillEffectEnv.js';
diff --git a/Sources/UnitBuilderMain.js b/Sources/UnitBuilderMain.js
index 27987de1..cbddef22 100644
--- a/Sources/UnitBuilderMain.js
+++ b/Sources/UnitBuilderMain.js
@@ -8,8 +8,6 @@ import { ElemDelimiter, g_explicitSiteRootPath } from './GlobalDefinitions.js';
 import { changeCurrentUnitTab } from './SettingManager.js';
 import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos } from './SampleSkillInfos.js';
 import { heroInfos } from './SampleHeroInfos.js';
-import { initVueComponents } from './VueComponents.js';
-
 // Side-effect imports for skill registration
 import './SkillEffectCore.js';
 import './SkillEffectEnv.js';
diff --git a/Tests/VueComponentsMigration.test.js b/Tests/VueComponentsMigration.test.js
new file mode 100644
index 00000000..6e6db747
--- /dev/null
+++ b/Tests/VueComponentsMigration.test.js
@@ -0,0 +1,95 @@
+import { describe, it, expect } from 'vitest';
+import { readFileSync } from 'fs';
+import { resolve } from 'path';
+
+const vueComponentsPath = resolve(__dirname, '../Sources/VueComponents.js');
+const vueComponentsSource = readFileSync(vueComponentsPath, 'utf-8');
+
+describe('Vue 3 Component Migration - Static Analysis', () => {
+    it('should not contain Vue.component() calls', () => {
+        const matches = vueComponentsSource.match(/Vue\.component\s*\(/g);
+        expect(matches).toBeNull();
+    });
+
+    it('should use app.component() for all 32 registrations', () => {
+        const matches = vueComponentsSource.match(/app\.component\s*\(/g);
+        expect(matches).not.toBeNull();
+        expect(matches.length).toBe(32);
+    });
+
+    it('should not contain Vue 2 deprecated APIs', () => {
+        // $set
+        const setMatches = vueComponentsSource.match(/this\.\$set\s*\(|Vue\.set\s*\(/g);
+        expect(setMatches).toBeNull();
+
+        // $delete
+        const deleteMatches = vueComponentsSource.match(/this\.\$delete\s*\(|Vue\.delete\s*\(/g);
+        expect(deleteMatches).toBeNull();
+
+        // beforeDestroy
+        const destroyMatches = vueComponentsSource.match(/beforeDestroy\s*[:(]/g);
+        expect(destroyMatches).toBeNull();
+
+        // $children
+        const childrenMatches = vueComponentsSource.match(/this\.\$children/g);
+        expect(childrenMatches).toBeNull();
+    });
+
+    it('should not contain Vue 2 model option', () => {
+        const modelMatches = vueComponentsSource.match(/model\s*:\s*\{\s*prop\s*:/g);
+        expect(modelMatches).toBeNull();
+    });
+
+    it('should not contain Vuex references', () => {
+        const vuexMapState = vueComponentsSource.match(/Vuex\.mapState/g);
+        expect(vuexMapState).toBeNull();
+
+        const storeDispatch = vueComponentsSource.match(/\$store\.dispatch/g);
+        expect(storeDispatch).toBeNull();
+
+        const mapStateShim = vueComponentsSource.match(/mapStateShim/g);
+        expect(mapStateShim).toBeNull();
+    });
+
+    it('select2 component should use modelValue and beforeUnmount', () => {
+        // Find select2 component definition
+        const select2Start = vueComponentsSource.indexOf("app.component('select2'");
+        const select2End = vueComponentsSource.indexOf("app.component('FlashMessage'");
+        const select2Source = vueComponentsSource.substring(select2Start, select2End);
+
+        // Should use modelValue prop, not value
+        expect(select2Source).toContain('modelValue');
+        expect(select2Source).not.toMatch(/props\s*:.*\bvalue\b/);
+
+        // Should emit update:modelValue, not input
+        expect(select2Source).toContain("update:modelValue");
+
+        // Should use beforeUnmount, not beforeDestroy
+        expect(select2Source).toContain('beforeUnmount');
+        expect(select2Source).not.toContain('beforeDestroy');
+    });
+
+    it('should use Pinia mapState instead of Vuex', () => {
+        expect(vueComponentsSource).toContain("import { mapState, mapActions } from 'pinia'");
+        expect(vueComponentsSource).toContain("import { useMainStore } from './store.js'");
+
+        const piniaMapState = vueComponentsSource.match(/mapState\(useMainStore/g);
+        expect(piniaMapState).not.toBeNull();
+        expect(piniaMapState.length).toBeGreaterThanOrEqual(16);
+    });
+
+    it('log-node should use $refs instead of $children', () => {
+        const logNodeStart = vueComponentsSource.indexOf("app.component('log-node'");
+        const logNodeSource = vueComponentsSource.substring(logNodeStart);
+
+        expect(logNodeSource).toContain('$refs.childNodes');
+        expect(logNodeSource).not.toContain('$children');
+    });
+});
+
+describe('Vue 3 Component Registration', () => {
+    it('should export initVueComponents function', async () => {
+        const mod = await import('../Sources/VueComponents.js');
+        expect(typeof mod.initVueComponents).toBe('function');
+    });
+});
