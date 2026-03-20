diff --git a/Sources/BattleSimulatorBase.js b/Sources/BattleSimulatorBase.js
index 81a1c61a..da5a3302 100644
--- a/Sources/BattleSimulatorBase.js
+++ b/Sources/BattleSimulatorBase.js
@@ -2,6 +2,8 @@
 /// @brief シミュレーターのメインコードです。
 
 import { createApp } from 'vue';
+import { createPinia } from 'pinia';
+import { useMainStore } from './store.js';
 import { UnitRarity, StatusType, statusTypeToShortString } from './HeroInfoConstants.js';
 import { GameMode } from './DamageCalculator.js';
 import { UnitGroupType } from './UnitConstants.js';
@@ -1035,35 +1037,18 @@ class BattleSimulatorBase {
             }
         }
 
+        const pinia = createPinia();
         const app = createApp({
             data() { return appData; },
             methods: this.methods,
         });
+        app.use(pinia);
 
-        // Temporary Vuex-like store via globalProperties (to be replaced by Pinia in Section 07)
-        const storeState = {
-            appData: appData,
-            battleSimulator: this,
-            imageRootPath: g_imageRootPath,
-        };
-        const storeActions = {
-            updateMap() { return updateMap(); },
-            saveSettings() { return saveSettings(); },
-            showSettingDialog() { return showSettingDialog(); },
-            showImportDialog() { return showImportDialog(); },
-            showExportDialog() { return showExportDialog(); },
-            loadLazyImages() { return loadLazyImages(); },
-            resetPlacement() { return resetPlacement(); },
-        };
-        app.config.globalProperties.$store = {
-            state: storeState,
-            dispatch(action) {
-                if (storeActions[action]) {
-                    return storeActions[action]();
-                }
-                console.warn(`Unknown store action: ${action}`);
-            },
-        };
+        // Initialize Pinia store state
+        const mainStore = useMainStore();
+        mainStore.appData = appData;
+        mainStore.battleSimulator = this;
+        mainStore.imageRootPath = g_imageRootPath;
 
         // Error handler
         app.config.errorHandler = (err, vm, info) => {
diff --git a/Sources/VueComponents.js b/Sources/VueComponents.js
index 0f3e38c4..c26b0053 100644
--- a/Sources/VueComponents.js
+++ b/Sources/VueComponents.js
@@ -1,14 +1,8 @@
 /// @file
 /// @brief Vueのcomponentの定義です。
 
-// Temporary Vuex shim (to be replaced by Pinia in Section 07)
-function mapStateShim(keys) {
-    const result = {};
-    for (const key of keys) {
-        result[key] = function() { return this.$store.state[key]; };
-    }
-    return result;
-}
+import { mapState, mapActions } from 'pinia';
+import { useMainStore } from './store.js';
 
 function initVueComponents(app) {
     app.component('battle-map', {
@@ -21,7 +15,7 @@ function initVueComponents(app) {
     app.component('unit-detail', {
         props: ['value'],
         computed: {
-            ...mapStateShim(['battleSimulator', 'appData', 'imageRootPath'])
+            ...mapState(useMainStore,['battleSimulator', 'appData', 'imageRootPath'])
         },
         template: `
           <table border='0' style='border-width: 0px;border-style:none;'>
@@ -630,7 +624,7 @@ function initVueComponents(app) {
     app.component('tile-detail', {
         props: ['value'],
         computed: {
-            ...mapStateShim(['battleSimulator'])
+            ...mapState(useMainStore,['battleSimulator'])
         },
         template: `
           <div>
@@ -668,7 +662,7 @@ function initVueComponents(app) {
     app.component('structure-detail', {
         props: ['value'],
         computed: {
-            ...mapStateShim(['battleSimulator', 'appData'])
+            ...mapState(useMainStore,['battleSimulator', 'appData'])
         },
         template: `
           <div style="height:500px;vertical-align:middle;display: table-cell;padding:10px">
@@ -1059,7 +1053,7 @@ function initVueComponents(app) {
             unit: {type: Unit, required: true},
         },
         computed: {
-            ...mapStateShim(['battleSimulator', 'appData', 'imageRootPath']),
+            ...mapState(useMainStore,['battleSimulator', 'appData', 'imageRootPath']),
         },
         template: `
           <div class="skill-grid">
@@ -1380,7 +1374,7 @@ function initVueComponents(app) {
             unit: {type: Unit, required: true},
         },
         computed: {
-            ...mapStateShim(['battleSimulator', 'appData']),
+            ...mapState(useMainStore,['battleSimulator', 'appData']),
         },
         template: `
           <div>
@@ -1416,7 +1410,7 @@ function initVueComponents(app) {
             testMethod: {type: Function, required: false},
         },
         computed: {
-            ...mapStateShim(['battleSimulator'])
+            ...mapState(useMainStore,['battleSimulator'])
         },
         methods: {
             getAttacker: function () {
@@ -1516,9 +1510,11 @@ function initVueComponents(app) {
 
     app.component('ControlButtons', {
         name: 'ControlButtons',
-        methods: {},
+        methods: {
+            ...mapActions(useMainStore, ['loadLazyImages']),
+        },
         mounted() {
-            this.$store.dispatch('loadLazyImages');
+            this.loadLazyImages();
         },
         template: `
             <div class="control-panel">
@@ -1533,18 +1529,16 @@ function initVueComponents(app) {
     app.component('UpperButtons', {
         name: 'UpperButtons',
         computed: {
-            ...mapStateShim(['battleSimulator', 'appData'])
+            ...mapState(useMainStore,['battleSimulator', 'appData'])
         },
         methods: {
-            updateMap() {
-                this.$store.dispatch('updateMap');
-            },
+            ...mapActions(useMainStore, ['updateMap', 'saveSettings', 'loadLazyImages']),
             endTurn() {
                 this.battleSimulator.vm.endTurn();
             },
             onSaveSettings() {
                 this.battleSimulator.clearSimpleLog();
-                this.$store.dispatch('saveSettings');
+                this.saveSettings();
                 let toCookie = LocalStorageUtil.getBoolean('uses-cookie-for-storing-settings', false);
                 if (toCookie) {
                     this.battleSimulator.vm.showFlash('設定を保存しました', 'warning', true);
@@ -1564,7 +1558,7 @@ function initVueComponents(app) {
             },
         },
         mounted() {
-            this.$store.dispatch('loadLazyImages');
+            this.loadLazyImages();
         },
         template: `
             <div class="control-row">
@@ -1620,26 +1614,28 @@ function initVueComponents(app) {
     app.component('LowerButtons', {
         name: 'LowerButtons',
         computed: {
-            ...mapStateShim(['battleSimulator', 'appData'])
+            ...mapState(useMainStore,['battleSimulator', 'appData'])
+        },
+        methods: {
+            ...mapActions(useMainStore, ['loadLazyImages', 'showSettingDialog', 'showImportDialog', 'showExportDialog']),
         },
-        methods: {},
         mounted() {
-            this.$store.dispatch('loadLazyImages');
+            this.loadLazyImages();
         },
         template: `
             <div class="control-row">
                 <input type="button" style="background-image: url(/images/dummy.png) "
                     class="lazy fehButton imageButton"
                     data-src="/AetherRaidTacticsBoard/images/Settings.png"
-                    @click="$store.dispatch('showSettingDialog');">
+                    @click="showSettingDialog();">
                 <input type="button" style="background-image: url(/images/dummy.png) "
                     class="lazy fehButton imageButton"
                     data-src="/AetherRaidTacticsBoard/images/ImportSettings.png"
-                    @click="$store.dispatch('showImportDialog');">
+                    @click="showImportDialog();">
                 <input type="button" style="background-image: url(/images/dummy.png) "
                     class="lazy fehButton imageButton"
                     data-src="/AetherRaidTacticsBoard/images/ExportSettings.png"
-                    @click="$store.dispatch('showExportDialog');">
+                    @click="showExportDialog();">
                 <input type="checkbox" id="enableSound" class="fehButton"
                     v-model="appData.audioManager.isBgmEnabled" @change="battleSimulator.vm.bgmEnabledChanged">
                 <label for="enableSound" class="fehButton"
@@ -1657,7 +1653,7 @@ function initVueComponents(app) {
             unit: {type: Unit, required: true},
         },
         computed: {
-            ...mapStateShim(['battleSimulator'])
+            ...mapState(useMainStore,['battleSimulator'])
         },
         methods: {
             getSkillButtonStyle(unit) {
@@ -1707,7 +1703,7 @@ function initVueComponents(app) {
             unit: {type: Unit, required: true},
         },
         computed: {
-            ...mapStateShim(['battleSimulator', 'appData']),
+            ...mapState(useMainStore,['battleSimulator', 'appData']),
         },
         template: `
           <fieldset v-if="appData.gameMode === GameMode.Arena"  style="font-size:12px;">
@@ -1729,7 +1725,7 @@ function initVueComponents(app) {
             unit: {type: Unit, required: true},
         },
         computed: {
-            ...mapStateShim(['battleSimulator', 'appData'])
+            ...mapState(useMainStore,['battleSimulator', 'appData'])
         },
         template: `
           <span v-bind:style="battleSimulator.vm.debugMenuStyle">
@@ -1850,14 +1846,15 @@ function initVueComponents(app) {
 
     app.component('SimulationControls', {
         computed: {
-            ...mapStateShim(['battleSimulator', 'appData'])
+            ...mapState(useMainStore,['battleSimulator', 'appData'])
         },
         methods: {
+            ...mapActions(useMainStore, ['resetPlacement']),
             onHealHp() {
                 this.battleSimulator.vm.healHpFullForAllUnits();
             },
             onResetPlacement() {
-                this.$store.dispatch('resetPlacement');
+                this.resetPlacement();
             },
             openTeamFormationDialog() {
                 $('#teamFormationDialog').dialog('open');
@@ -1945,7 +1942,7 @@ function initVueComponents(app) {
             openAutoClearDialog: {type: Function, required: true},
         },
         computed: {
-            ...mapStateShim(['battleSimulator']),
+            ...mapState(useMainStore,['battleSimulator']),
         },
         template: `
             <div>
@@ -2000,7 +1997,7 @@ function initVueComponents(app) {
             copyDebugLogToClipboard: {type: Function, required: true},
         },
         computed: {
-            ...mapStateShim(['battleSimulator'])
+            ...mapState(useMainStore,['battleSimulator'])
         },
         methods: {
             onSimulatorLogLevelChange(e) {
@@ -2266,7 +2263,7 @@ function initVueComponents(app) {
             };
         },
         computed: {
-            ...mapStateShim(['battleSimulator'])
+            ...mapState(useMainStore,['battleSimulator'])
         },
         methods: {
             setUnitName(name) {
@@ -2535,7 +2532,7 @@ function initVueComponents(app) {
             onInfo: {type: Function, required: false},
         },
         computed: {
-            ...mapStateShim(['battleSimulator', 'appData'])
+            ...mapState(useMainStore,['battleSimulator', 'appData'])
         },
         methods: {
             defaultInfoHandler() {
diff --git a/Sources/store.js b/Sources/store.js
new file mode 100644
index 00000000..4f62105f
--- /dev/null
+++ b/Sources/store.js
@@ -0,0 +1,26 @@
+/// @file
+/// @brief Pinia ストア定義（Vuex からの移行）
+
+import { defineStore } from 'pinia';
+
+/**
+ * メインアプリケーションストア。
+ * state: appData, battleSimulator, imageRootPath を保持。
+ * actions: グローバル関数へのデリゲート。
+ */
+export const useMainStore = defineStore('main', {
+    state: () => ({
+        appData: null,
+        battleSimulator: null,
+        imageRootPath: '',
+    }),
+    actions: {
+        updateMap() { return updateMap(); },
+        saveSettings() { return saveSettings(); },
+        showSettingDialog() { return showSettingDialog(); },
+        showImportDialog() { return showImportDialog(); },
+        showExportDialog() { return showExportDialog(); },
+        loadLazyImages() { return loadLazyImages(); },
+        resetPlacement() { return resetPlacement(); },
+    }
+});
diff --git a/Tests/PiniaStore.test.js b/Tests/PiniaStore.test.js
new file mode 100644
index 00000000..4022a849
--- /dev/null
+++ b/Tests/PiniaStore.test.js
@@ -0,0 +1,96 @@
+import { describe, it, expect, vi, beforeEach } from 'vitest';
+import { setActivePinia, createPinia, mapState, mapActions } from 'pinia';
+import { useMainStore } from '../Sources/store.js';
+
+// Mock global functions that store actions delegate to
+globalThis.updateMap = vi.fn();
+globalThis.saveSettings = vi.fn();
+globalThis.showSettingDialog = vi.fn();
+globalThis.showImportDialog = vi.fn();
+globalThis.showExportDialog = vi.fn();
+globalThis.loadLazyImages = vi.fn();
+globalThis.resetPlacement = vi.fn();
+
+describe('Pinia Store Migration', () => {
+    beforeEach(() => {
+        setActivePinia(createPinia());
+        vi.clearAllMocks();
+    });
+
+    it('should define a store with expected state properties', () => {
+        const store = useMainStore();
+        expect(store.appData).toBeNull();
+        expect(store.battleSimulator).toBeNull();
+        expect(store.imageRootPath).toBe('');
+    });
+
+    it('should allow direct state mutation', () => {
+        const store = useMainStore();
+        const mockAppData = { units: [] };
+        const mockSimulator = { name: 'test' };
+
+        store.appData = mockAppData;
+        store.battleSimulator = mockSimulator;
+        store.imageRootPath = '/images';
+
+        expect(store.appData).toStrictEqual(mockAppData);
+        expect(store.battleSimulator).toStrictEqual(mockSimulator);
+        expect(store.imageRootPath).toBe('/images');
+    });
+
+    it('should have actions that delegate to global functions', () => {
+        const store = useMainStore();
+
+        store.updateMap();
+        expect(globalThis.updateMap).toHaveBeenCalledOnce();
+
+        store.saveSettings();
+        expect(globalThis.saveSettings).toHaveBeenCalledOnce();
+
+        store.showSettingDialog();
+        expect(globalThis.showSettingDialog).toHaveBeenCalledOnce();
+
+        store.showImportDialog();
+        expect(globalThis.showImportDialog).toHaveBeenCalledOnce();
+
+        store.showExportDialog();
+        expect(globalThis.showExportDialog).toHaveBeenCalledOnce();
+
+        store.loadLazyImages();
+        expect(globalThis.loadLazyImages).toHaveBeenCalledOnce();
+
+        store.resetPlacement();
+        expect(globalThis.resetPlacement).toHaveBeenCalledOnce();
+    });
+
+    it('should provide mapState-compatible computed properties', () => {
+        const store = useMainStore();
+        store.appData = { test: true };
+        store.battleSimulator = { id: 1 };
+        store.imageRootPath = '/img';
+
+        const computed = mapState(useMainStore, ['appData', 'battleSimulator', 'imageRootPath']);
+
+        expect(computed).toHaveProperty('appData');
+        expect(computed).toHaveProperty('battleSimulator');
+        expect(computed).toHaveProperty('imageRootPath');
+
+        // mapState returns getter functions that read from the active store
+        expect(typeof computed.appData).toBe('function');
+    });
+
+    it('should provide mapActions-compatible methods', () => {
+        const methods = mapActions(useMainStore, [
+            'updateMap', 'saveSettings', 'showSettingDialog',
+            'showImportDialog', 'showExportDialog', 'loadLazyImages', 'resetPlacement'
+        ]);
+
+        expect(typeof methods.updateMap).toBe('function');
+        expect(typeof methods.saveSettings).toBe('function');
+        expect(typeof methods.showSettingDialog).toBe('function');
+        expect(typeof methods.showImportDialog).toBe('function');
+        expect(typeof methods.showExportDialog).toBe('function');
+        expect(typeof methods.loadLazyImages).toBe('function');
+        expect(typeof methods.resetPlacement).toBe('function');
+    });
+});
diff --git a/package-lock.json b/package-lock.json
index cda0b3c9..53437f9a 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -9,6 +9,7 @@
       "version": "1.0.0",
       "license": "MIT",
       "dependencies": {
+        "pinia": "^3.0.4",
         "vue": "^3.5.30"
       },
       "devDependencies": {
@@ -1769,6 +1770,39 @@
         "@vue/shared": "3.5.30"
       }
     },
+    "node_modules/@vue/devtools-api": {
+      "version": "7.7.9",
+      "resolved": "https://registry.npmjs.org/@vue/devtools-api/-/devtools-api-7.7.9.tgz",
+      "integrity": "sha512-kIE8wvwlcZ6TJTbNeU2HQNtaxLx3a84aotTITUuL/4bzfPxzajGBOoqjMhwZJ8L9qFYDU/lAYMEEm11dnZOD6g==",
+      "license": "MIT",
+      "dependencies": {
+        "@vue/devtools-kit": "^7.7.9"
+      }
+    },
+    "node_modules/@vue/devtools-kit": {
+      "version": "7.7.9",
+      "resolved": "https://registry.npmjs.org/@vue/devtools-kit/-/devtools-kit-7.7.9.tgz",
+      "integrity": "sha512-PyQ6odHSgiDVd4hnTP+aDk2X4gl2HmLDfiyEnn3/oV+ckFDuswRs4IbBT7vacMuGdwY/XemxBoh302ctbsptuA==",
+      "license": "MIT",
+      "dependencies": {
+        "@vue/devtools-shared": "^7.7.9",
+        "birpc": "^2.3.0",
+        "hookable": "^5.5.3",
+        "mitt": "^3.0.1",
+        "perfect-debounce": "^1.0.0",
+        "speakingurl": "^14.0.1",
+        "superjson": "^2.2.2"
+      }
+    },
+    "node_modules/@vue/devtools-shared": {
+      "version": "7.7.9",
+      "resolved": "https://registry.npmjs.org/@vue/devtools-shared/-/devtools-shared-7.7.9.tgz",
+      "integrity": "sha512-iWAb0v2WYf0QWmxCGy0seZNDPdO3Sp5+u78ORnyeonS6MT4PC7VPrryX2BpMJrwlDeaZ6BD4vP4XKjK0SZqaeA==",
+      "license": "MIT",
+      "dependencies": {
+        "rfdc": "^1.4.1"
+      }
+    },
     "node_modules/@vue/reactivity": {
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/reactivity/-/reactivity-3.5.30.tgz",
@@ -2097,6 +2131,15 @@
       "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
       "dev": true
     },
+    "node_modules/birpc": {
+      "version": "2.9.0",
+      "resolved": "https://registry.npmjs.org/birpc/-/birpc-2.9.0.tgz",
+      "integrity": "sha512-KrayHS5pBi69Xi9JmvoqrIgYGDkD6mcSe/i6YKi3w5kekCLzrX4+nawcXqrj2tIp50Kw/mT/s3p+GVK0A0sKxw==",
+      "license": "MIT",
+      "funding": {
+        "url": "https://github.com/sponsors/antfu"
+      }
+    },
     "node_modules/brace-expansion": {
       "version": "1.1.12",
       "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.12.tgz",
@@ -2362,6 +2405,21 @@
       "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
       "dev": true
     },
+    "node_modules/copy-anything": {
+      "version": "4.0.5",
+      "resolved": "https://registry.npmjs.org/copy-anything/-/copy-anything-4.0.5.tgz",
+      "integrity": "sha512-7Vv6asjS4gMOuILabD3l739tsaxFQmC+a7pLZm02zyvs8p977bL3zEgq3yDk5rn9B0PbYgIv++jmHcuUab4RhA==",
+      "license": "MIT",
+      "dependencies": {
+        "is-what": "^5.2.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/mesqueeb"
+      }
+    },
     "node_modules/create-jest": {
       "version": "29.7.0",
       "resolved": "https://registry.npmjs.org/create-jest/-/create-jest-29.7.0.tgz",
@@ -3326,6 +3384,12 @@
         "node": ">= 0.4"
       }
     },
+    "node_modules/hookable": {
+      "version": "5.5.3",
+      "resolved": "https://registry.npmjs.org/hookable/-/hookable-5.5.3.tgz",
+      "integrity": "sha512-Yc+BQe8SvoXH1643Qez1zqLRmbA5rCL+sSmk6TVos0LWVfNIB7PGncdlId77WzLGSIB5KaWgTaNTs2lNVEI6VQ==",
+      "license": "MIT"
+    },
     "node_modules/html-encoding-sniffer": {
       "version": "3.0.0",
       "resolved": "https://registry.npmjs.org/html-encoding-sniffer/-/html-encoding-sniffer-3.0.0.tgz",
@@ -3554,6 +3618,18 @@
         "url": "https://github.com/sponsors/sindresorhus"
       }
     },
+    "node_modules/is-what": {
+      "version": "5.5.0",
+      "resolved": "https://registry.npmjs.org/is-what/-/is-what-5.5.0.tgz",
+      "integrity": "sha512-oG7cgbmg5kLYae2N5IVd3jm2s+vldjxJzK1pcu9LfpGuQ93MQSzo0okvRna+7y5ifrD+20FE8FvjusyGaz14fw==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/mesqueeb"
+      }
+    },
     "node_modules/isexe": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
@@ -4853,6 +4929,12 @@
         "node": "*"
       }
     },
+    "node_modules/mitt": {
+      "version": "3.0.1",
+      "resolved": "https://registry.npmjs.org/mitt/-/mitt-3.0.1.tgz",
+      "integrity": "sha512-vKivATfr97l2/QBCYAkXYDbrIWPM2IIKEl7YPhjCvKlG3kE2gm+uBo6nEXK3M5/Ffh/FLpKExzOQ3JJoJGFKBw==",
+      "license": "MIT"
+    },
     "node_modules/ms": {
       "version": "2.1.2",
       "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.2.tgz",
@@ -5107,6 +5189,12 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/perfect-debounce": {
+      "version": "1.0.0",
+      "resolved": "https://registry.npmjs.org/perfect-debounce/-/perfect-debounce-1.0.0.tgz",
+      "integrity": "sha512-xCy9V055GLEqoFaHoC1SoLIaLmWctgCUaBaWxDZ7/Zx4CTyX7cJQLJOok/orfjZAh9kEYpjJa4d0KcJmCbctZA==",
+      "license": "MIT"
+    },
     "node_modules/picocolors": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
@@ -5125,6 +5213,27 @@
         "url": "https://github.com/sponsors/jonschlinkert"
       }
     },
+    "node_modules/pinia": {
+      "version": "3.0.4",
+      "resolved": "https://registry.npmjs.org/pinia/-/pinia-3.0.4.tgz",
+      "integrity": "sha512-l7pqLUFTI/+ESXn6k3nu30ZIzW5E2WZF/LaHJEpoq6ElcLD+wduZoB2kBN19du6K/4FDpPMazY2wJr+IndBtQw==",
+      "license": "MIT",
+      "dependencies": {
+        "@vue/devtools-api": "^7.7.7"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/posva"
+      },
+      "peerDependencies": {
+        "typescript": ">=4.5.0",
+        "vue": "^3.5.11"
+      },
+      "peerDependenciesMeta": {
+        "typescript": {
+          "optional": true
+        }
+      }
+    },
     "node_modules/pirates": {
       "version": "4.0.6",
       "resolved": "https://registry.npmjs.org/pirates/-/pirates-4.0.6.tgz",
@@ -5354,6 +5463,12 @@
         "node": ">=0.10.0"
       }
     },
+    "node_modules/rfdc": {
+      "version": "1.4.1",
+      "resolved": "https://registry.npmjs.org/rfdc/-/rfdc-1.4.1.tgz",
+      "integrity": "sha512-q1b3N5QkRUWUl7iyylaaj3kOpIT0N2i9MqIEQXP73GVsN9cw3fdx8X63cEmWhJGi2PPCF23Ijp7ktmd39rawIA==",
+      "license": "MIT"
+    },
     "node_modules/rimraf": {
       "version": "3.0.2",
       "resolved": "https://registry.npmjs.org/rimraf/-/rimraf-3.0.2.tgz",
@@ -5537,6 +5652,15 @@
         "source-map": "^0.6.0"
       }
     },
+    "node_modules/speakingurl": {
+      "version": "14.0.1",
+      "resolved": "https://registry.npmjs.org/speakingurl/-/speakingurl-14.0.1.tgz",
+      "integrity": "sha512-1POYv7uv2gXoyGFpBCmpDVSNV74IfsWlDW216UPjbWufNf+bSU6GdbDsxdcxtfwb4xlI3yxzOTKClUosxARYrQ==",
+      "license": "BSD-3-Clause",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
     "node_modules/sprintf-js": {
       "version": "1.0.3",
       "resolved": "https://registry.npmjs.org/sprintf-js/-/sprintf-js-1.0.3.tgz",
@@ -5647,6 +5771,18 @@
         "url": "https://github.com/sponsors/sindresorhus"
       }
     },
+    "node_modules/superjson": {
+      "version": "2.2.6",
+      "resolved": "https://registry.npmjs.org/superjson/-/superjson-2.2.6.tgz",
+      "integrity": "sha512-H+ue8Zo4vJmV2nRjpx86P35lzwDT3nItnIsocgumgr0hHMQ+ZGq5vrERg9kJBo5AWGmxZDhzDo+WVIJqkB0cGA==",
+      "license": "MIT",
+      "dependencies": {
+        "copy-anything": "^4"
+      },
+      "engines": {
+        "node": ">=16"
+      }
+    },
     "node_modules/supports-color": {
       "version": "7.2.0",
       "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
@@ -7671,6 +7807,36 @@
         "@vue/shared": "3.5.30"
       }
     },
+    "@vue/devtools-api": {
+      "version": "7.7.9",
+      "resolved": "https://registry.npmjs.org/@vue/devtools-api/-/devtools-api-7.7.9.tgz",
+      "integrity": "sha512-kIE8wvwlcZ6TJTbNeU2HQNtaxLx3a84aotTITUuL/4bzfPxzajGBOoqjMhwZJ8L9qFYDU/lAYMEEm11dnZOD6g==",
+      "requires": {
+        "@vue/devtools-kit": "^7.7.9"
+      }
+    },
+    "@vue/devtools-kit": {
+      "version": "7.7.9",
+      "resolved": "https://registry.npmjs.org/@vue/devtools-kit/-/devtools-kit-7.7.9.tgz",
+      "integrity": "sha512-PyQ6odHSgiDVd4hnTP+aDk2X4gl2HmLDfiyEnn3/oV+ckFDuswRs4IbBT7vacMuGdwY/XemxBoh302ctbsptuA==",
+      "requires": {
+        "@vue/devtools-shared": "^7.7.9",
+        "birpc": "^2.3.0",
+        "hookable": "^5.5.3",
+        "mitt": "^3.0.1",
+        "perfect-debounce": "^1.0.0",
+        "speakingurl": "^14.0.1",
+        "superjson": "^2.2.2"
+      }
+    },
+    "@vue/devtools-shared": {
+      "version": "7.7.9",
+      "resolved": "https://registry.npmjs.org/@vue/devtools-shared/-/devtools-shared-7.7.9.tgz",
+      "integrity": "sha512-iWAb0v2WYf0QWmxCGy0seZNDPdO3Sp5+u78ORnyeonS6MT4PC7VPrryX2BpMJrwlDeaZ6BD4vP4XKjK0SZqaeA==",
+      "requires": {
+        "rfdc": "^1.4.1"
+      }
+    },
     "@vue/reactivity": {
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/reactivity/-/reactivity-3.5.30.tgz",
@@ -7924,6 +8090,11 @@
       "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
       "dev": true
     },
+    "birpc": {
+      "version": "2.9.0",
+      "resolved": "https://registry.npmjs.org/birpc/-/birpc-2.9.0.tgz",
+      "integrity": "sha512-KrayHS5pBi69Xi9JmvoqrIgYGDkD6mcSe/i6YKi3w5kekCLzrX4+nawcXqrj2tIp50Kw/mT/s3p+GVK0A0sKxw=="
+    },
     "brace-expansion": {
       "version": "1.1.12",
       "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.12.tgz",
@@ -8103,6 +8274,14 @@
       "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
       "dev": true
     },
+    "copy-anything": {
+      "version": "4.0.5",
+      "resolved": "https://registry.npmjs.org/copy-anything/-/copy-anything-4.0.5.tgz",
+      "integrity": "sha512-7Vv6asjS4gMOuILabD3l739tsaxFQmC+a7pLZm02zyvs8p977bL3zEgq3yDk5rn9B0PbYgIv++jmHcuUab4RhA==",
+      "requires": {
+        "is-what": "^5.2.0"
+      }
+    },
     "create-jest": {
       "version": "29.7.0",
       "resolved": "https://registry.npmjs.org/create-jest/-/create-jest-29.7.0.tgz",
@@ -8797,6 +8976,11 @@
         "function-bind": "^1.1.2"
       }
     },
+    "hookable": {
+      "version": "5.5.3",
+      "resolved": "https://registry.npmjs.org/hookable/-/hookable-5.5.3.tgz",
+      "integrity": "sha512-Yc+BQe8SvoXH1643Qez1zqLRmbA5rCL+sSmk6TVos0LWVfNIB7PGncdlId77WzLGSIB5KaWgTaNTs2lNVEI6VQ=="
+    },
     "html-encoding-sniffer": {
       "version": "3.0.0",
       "resolved": "https://registry.npmjs.org/html-encoding-sniffer/-/html-encoding-sniffer-3.0.0.tgz",
@@ -8962,6 +9146,11 @@
       "integrity": "sha512-hFoiJiTl63nn+kstHGBtewWSKnQLpyb155KHheA1l39uvtO9nWIop1p3udqPcUd/xbF1VLMO4n7OI6p7RbngDg==",
       "dev": true
     },
+    "is-what": {
+      "version": "5.5.0",
+      "resolved": "https://registry.npmjs.org/is-what/-/is-what-5.5.0.tgz",
+      "integrity": "sha512-oG7cgbmg5kLYae2N5IVd3jm2s+vldjxJzK1pcu9LfpGuQ93MQSzo0okvRna+7y5ifrD+20FE8FvjusyGaz14fw=="
+    },
     "isexe": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
@@ -9852,6 +10041,11 @@
         "brace-expansion": "^1.1.7"
       }
     },
+    "mitt": {
+      "version": "3.0.1",
+      "resolved": "https://registry.npmjs.org/mitt/-/mitt-3.0.1.tgz",
+      "integrity": "sha512-vKivATfr97l2/QBCYAkXYDbrIWPM2IIKEl7YPhjCvKlG3kE2gm+uBo6nEXK3M5/Ffh/FLpKExzOQ3JJoJGFKBw=="
+    },
     "ms": {
       "version": "2.1.2",
       "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.2.tgz",
@@ -10035,6 +10229,11 @@
       "integrity": "sha512-WUjGcAqP1gQacoQe+OBJsFA7Ld4DyXuUIjZ5cc75cLHvJ7dtNsTugphxIADwspS+AraAUePCKrSVtPLFj/F88w==",
       "dev": true
     },
+    "perfect-debounce": {
+      "version": "1.0.0",
+      "resolved": "https://registry.npmjs.org/perfect-debounce/-/perfect-debounce-1.0.0.tgz",
+      "integrity": "sha512-xCy9V055GLEqoFaHoC1SoLIaLmWctgCUaBaWxDZ7/Zx4CTyX7cJQLJOok/orfjZAh9kEYpjJa4d0KcJmCbctZA=="
+    },
     "picocolors": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
@@ -10046,6 +10245,14 @@
       "integrity": "sha512-JU3teHTNjmE2VCGFzuY8EXzCDVwEqB2a8fsIvwaStHhAWJEeVd1o1QD80CU6+ZdEXXSLbSsuLwJjkCBWqRQUVA==",
       "dev": true
     },
+    "pinia": {
+      "version": "3.0.4",
+      "resolved": "https://registry.npmjs.org/pinia/-/pinia-3.0.4.tgz",
+      "integrity": "sha512-l7pqLUFTI/+ESXn6k3nu30ZIzW5E2WZF/LaHJEpoq6ElcLD+wduZoB2kBN19du6K/4FDpPMazY2wJr+IndBtQw==",
+      "requires": {
+        "@vue/devtools-api": "^7.7.7"
+      }
+    },
     "pirates": {
       "version": "4.0.6",
       "resolved": "https://registry.npmjs.org/pirates/-/pirates-4.0.6.tgz",
@@ -10192,6 +10399,11 @@
       "integrity": "sha512-U9nH88a3fc/ekCF1l0/UP1IosiuIjyTh7hBvXVMHYgVcfGvt897Xguj2UOLDeI5BG2m7/uwyaLVT6fbtCwTyzw==",
       "dev": true
     },
+    "rfdc": {
+      "version": "1.4.1",
+      "resolved": "https://registry.npmjs.org/rfdc/-/rfdc-1.4.1.tgz",
+      "integrity": "sha512-q1b3N5QkRUWUl7iyylaaj3kOpIT0N2i9MqIEQXP73GVsN9cw3fdx8X63cEmWhJGi2PPCF23Ijp7ktmd39rawIA=="
+    },
     "rimraf": {
       "version": "3.0.2",
       "resolved": "https://registry.npmjs.org/rimraf/-/rimraf-3.0.2.tgz",
@@ -10324,6 +10536,11 @@
         "source-map": "^0.6.0"
       }
     },
+    "speakingurl": {
+      "version": "14.0.1",
+      "resolved": "https://registry.npmjs.org/speakingurl/-/speakingurl-14.0.1.tgz",
+      "integrity": "sha512-1POYv7uv2gXoyGFpBCmpDVSNV74IfsWlDW216UPjbWufNf+bSU6GdbDsxdcxtfwb4xlI3yxzOTKClUosxARYrQ=="
+    },
     "sprintf-js": {
       "version": "1.0.3",
       "resolved": "https://registry.npmjs.org/sprintf-js/-/sprintf-js-1.0.3.tgz",
@@ -10407,6 +10624,14 @@
       "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
       "dev": true
     },
+    "superjson": {
+      "version": "2.2.6",
+      "resolved": "https://registry.npmjs.org/superjson/-/superjson-2.2.6.tgz",
+      "integrity": "sha512-H+ue8Zo4vJmV2nRjpx86P35lzwDT3nItnIsocgumgr0hHMQ+ZGq5vrERg9kJBo5AWGmxZDhzDo+WVIJqkB0cGA==",
+      "requires": {
+        "copy-anything": "^4"
+      }
+    },
     "supports-color": {
       "version": "7.2.0",
       "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
diff --git a/package.json b/package.json
index 7303cd1c..10f04fae 100644
--- a/package.json
+++ b/package.json
@@ -39,6 +39,7 @@
     "vitest": "^4.1.0"
   },
   "dependencies": {
+    "pinia": "^3.0.4",
     "vue": "^3.5.30"
   }
 }
