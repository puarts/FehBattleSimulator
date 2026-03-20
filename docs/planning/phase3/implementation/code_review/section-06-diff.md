diff --git a/Sources/AetherRaidSimulator.html b/Sources/AetherRaidSimulator.html
index eb4aaf99..ee9456ef 100644
--- a/Sources/AetherRaidSimulator.html
+++ b/Sources/AetherRaidSimulator.html
@@ -512,17 +512,17 @@
                     <div class="jquery" id="unitSettings">
                         <ul class="contents">
                             <li v-for="unit in enemyUnits">
-                                <unit-detail v-model="unit"></unit-detail>
+                                <unit-detail :value="unit"></unit-detail>
                             </li>
                             <li v-for="unit in allyUnits">
-                                <unit-detail v-model="unit"></unit-detail>
+                                <unit-detail :value="unit"></unit-detail>
                             </li>
                             <li v-for="structure in offenceStructureStorage.objs">
-                                <structure-detail v-model="structure">
+                                <structure-detail :value="structure">
                                 </structure-detail>
                             </li>
                             <li v-for="structure in defenseStructureStorage.objs">
-                                <structure-detail v-model="structure">
+                                <structure-detail :value="structure">
                                 </structure-detail>
                             </li>
                             <li v-for="tile in map._tiles">
@@ -1382,18 +1382,9 @@
         onload="this.media='all'">
     <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
 
-    <!-- vue.js -->
-    <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js"></script>
-
-    <!-- vuex.js -->
-    <script src="https://unpkg.com/vuex@3.6.2/dist/vuex.min.js"></script>
-
     <!-- sortable.js -->
     <script async src="https://cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js"></script>
 
-    <!-- vuedraggable.js -->
-    <script async src="https://cdnjs.cloudflare.com/ajax/libs/Vue.Draggable/2.23.2/vuedraggable.umd.min.js"></script>
-
     <!-- クッキー(実際は使ってないので消してもいいかも) -->
     <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
 
diff --git a/Sources/AetherRaidSimulatorMain.js b/Sources/AetherRaidSimulatorMain.js
index 906b5b72..7b807c78 100644
--- a/Sources/AetherRaidSimulatorMain.js
+++ b/Sources/AetherRaidSimulatorMain.js
@@ -51,7 +51,6 @@ function initAetherRaidBoard(
 
 // Initialization
 window.g_app = g_app;
-initVueComponents();
 g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
 g_app.registerHeroOptions(heroInfos, false);
 initAetherRaidBoard(heroInfos);
diff --git a/Sources/ArenaSimulator.html b/Sources/ArenaSimulator.html
index 02849e75..9fb9944b 100644
--- a/Sources/ArenaSimulator.html
+++ b/Sources/ArenaSimulator.html
@@ -464,17 +464,17 @@
                     <div class="jquery" id="unitSettings">
                         <ul class="contents">
                             <li v-for="unit in enemyUnits">
-                                <unit-detail v-model="unit"></unit-detail>
+                                <unit-detail :value="unit"></unit-detail>
                             </li>
                             <li v-for="unit in allyUnits">
-                                <unit-detail v-model="unit"></unit-detail>
+                                <unit-detail :value="unit"></unit-detail>
                             </li>
                             <li v-for="structure in offenceStructureStorage.objs">
-                                <structure-detail v-model="structure">
+                                <structure-detail :value="structure">
                                 </structure-detail>
                             </li>
                             <li v-for="structure in defenseStructureStorage.objs">
-                                <structure-detail v-model="structure">
+                                <structure-detail :value="structure">
                                 </structure-detail>
                             </li>
                             <!-- </ul>
@@ -1356,18 +1356,9 @@
         onload="this.media='all'">
     <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
 
-    <!-- vue.js -->
-    <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js"></script>
-
-    <!-- vuex.js -->
-    <script src="https://unpkg.com/vuex@3.6.2/dist/vuex.min.js"></script>
-
     <!-- sortable.js -->
     <script async src="https://cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js"></script>
 
-    <!-- vuedraggable.js -->
-    <script async src="https://cdnjs.cloudflare.com/ajax/libs/Vue.Draggable/2.23.2/vuedraggable.umd.min.js"></script>
-
     <!-- クッキー(実際は使ってないので消してもいいかも) -->
     <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
 
diff --git a/Sources/ArenaSimulatorMain.js b/Sources/ArenaSimulatorMain.js
index 76765db4..f5f69428 100644
--- a/Sources/ArenaSimulatorMain.js
+++ b/Sources/ArenaSimulatorMain.js
@@ -63,7 +63,6 @@ function initAetherRaidBoard(
 
 // Initialization
 window.g_app = g_app;
-initVueComponents();
 g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
 g_app.registerHeroOptions(heroInfos, false);
 initAetherRaidBoard(heroInfos);
diff --git a/Sources/BattleSimulatorBase.js b/Sources/BattleSimulatorBase.js
index 6e8e3c0e..dd7b9a38 100644
--- a/Sources/BattleSimulatorBase.js
+++ b/Sources/BattleSimulatorBase.js
@@ -1,6 +1,8 @@
 /// @file
 /// @brief シミュレーターのメインコードです。
 
+import { createApp } from 'vue';
+
 function hasTargetOptionValue(targetOptionId, options) {
     for (let index in options) {
         let option = options[index];
@@ -435,9 +437,9 @@ class BattleSimulatorBase {
                     }
                 } else if (value !== -1) {
                     // なし以外が設定
-                    this.$set(values, i, value);
+                    values[i] = value;
                     if (values.length === i + 1) {
-                        this.$set(values, i + 1, '');
+                        values[i + 1] = '';
                     }
                 }
                 this.updateCurrentUnit();
@@ -1025,48 +1027,46 @@ class BattleSimulatorBase {
             }
         }
 
-        // Vuex を Vue に登録
-        Vue.use(Vuex);
-
-        // ストア作成
-        const store = new Vuex.Store({
-            state: {
-                appData: appData,
-                battleSimulator: this,
-                imageRootPath: g_imageRootPath,
-            },
-            mutations: {
-            },
-            actions: {
-                updateMap({state}, payload) {
-                    return updateMap();
-                },
-                saveSettings({state}, payload) {
-                    return saveSettings();
-                },
-                showSettingDialog({state}, payload) {
-                    return showSettingDialog();
-                },
-                showImportDialog({state}, payload) {
-                    return showImportDialog();
-                },
-                showExportDialog({state}, payload) {
-                    return showExportDialog();
-                },
-                loadLazyImages({state}, payload) {
-                    return loadLazyImages();
-                },
-                resetPlacement({state}, payload) {
-                    return resetPlacement();
-                },
-            }
-        });
-        return new Vue({
-            el: "#app",
-            store,
-            data: appData,
+        const app = createApp({
+            data() { return appData; },
             methods: this.methods,
         });
+
+        // Temporary Vuex-like store via globalProperties (to be replaced by Pinia in Section 07)
+        const storeState = {
+            appData: appData,
+            battleSimulator: this,
+            imageRootPath: g_imageRootPath,
+        };
+        const storeActions = {
+            updateMap() { return updateMap(); },
+            saveSettings() { return saveSettings(); },
+            showSettingDialog() { return showSettingDialog(); },
+            showImportDialog() { return showImportDialog(); },
+            showExportDialog() { return showExportDialog(); },
+            loadLazyImages() { return loadLazyImages(); },
+            resetPlacement() { return resetPlacement(); },
+        };
+        app.config.globalProperties.$store = {
+            state: storeState,
+            dispatch(action) {
+                if (storeActions[action]) {
+                    return storeActions[action]();
+                }
+                console.warn(`Unknown store action: ${action}`);
+            },
+        };
+
+        // Error handler
+        app.config.errorHandler = (err, vm, info) => {
+            console.error('[Vue]', vm && vm.$options && vm.$options.name, info, err);
+        };
+
+        // Register components before mounting
+        initVueComponents(app);
+
+        app.mount('#app');
+        return app;
     }
 
     tileTypeChanged() {
@@ -12305,5 +12305,5 @@ function importSettingsFromString(
         loadsMapSettings
     );
 }
-
-export { BattleSimulatorBase, MovementAssistResult, MoveResult, OwnerType, ModuleLoadState, hasTargetOptionValue, isTrapActivationResult, determineAssistType, removeTouchEventFromDraggableElements, addTouchEventToDraggableElements, moveStructureToMap, moveStructureToTrashBox, moveStructureToDefenceStorage, moveStructureToOffenceStorage, moveUnitToTrashBox, moveUnitToMap, moveUnit, placeUnitToMap, syncSelectedTileColor, updateMapUi, updateMap, changeMap, removeBreakableWallsFromTrashBox, createMap, resetPlacement, removeAllObjsFromMap, removeAllUnitsFromMap, updateAllUi, loadSettings, loadSettingsFromDict, saveSettings, exportPerTurnSettingAsString, importPerTurnSetting, importSettingsFromString };
+
+export { BattleSimulatorBase, MovementAssistResult, MoveResult, OwnerType, ModuleLoadState, hasTargetOptionValue, isTrapActivationResult, determineAssistType, removeTouchEventFromDraggableElements, addTouchEventToDraggableElements, moveStructureToMap, moveStructureToTrashBox, moveStructureToDefenceStorage, moveStructureToOffenceStorage, moveUnitToTrashBox, moveUnitToMap, moveUnit, placeUnitToMap, syncSelectedTileColor, updateMapUi, updateMap, changeMap, removeBreakableWallsFromTrashBox, createMap, resetPlacement, removeAllObjsFromMap, removeAllUnitsFromMap, updateAllUi, loadSettings, loadSettingsFromDict, saveSettings, exportPerTurnSettingAsString, importPerTurnSetting, importSettingsFromString };
diff --git a/Sources/CustomSkill.js b/Sources/CustomSkill.js
index 43a848df..b5eee864 100644
--- a/Sources/CustomSkill.js
+++ b/Sources/CustomSkill.js
@@ -189,13 +189,13 @@ class CustomSkill {
                 EFFECTIVE_TYPES,
                 STATUS_EFFECT_TYPES
             } = this.Node;
-            vm.$set(customSkill, 1, {
+            customSkill[1] = {
                 [NON_NEGATIVE_INTEGER]: 0,
                 [PERCENTAGE]: 100,
                 [VARIABLE_PERCENTAGE]: 100,
                 [EFFECTIVE_TYPES]: [''],
                 [STATUS_EFFECT_TYPES]: [''],
-            });
+            };
         }
 
         static idsToNodes(args, key) {
diff --git a/Sources/DamageCalculator.html b/Sources/DamageCalculator.html
index 5fabbac3..85e41907 100644
--- a/Sources/DamageCalculator.html
+++ b/Sources/DamageCalculator.html
@@ -403,11 +403,6 @@
     <link type="text/css" rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.min.css">
     <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
 
-    <!-- vue.js -->
-    <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js"></script>
-
-    <!-- vuex.js -->
-    <script src="https://unpkg.com/vuex@3.6.2/dist/vuex.min.js"></script>
 
     <!-- 文字列圧縮 -->
     <script src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js"></script>
diff --git a/Sources/DamageCalculatorMain.js b/Sources/DamageCalculatorMain.js
index 4d78780f..0c7add43 100644
--- a/Sources/DamageCalculatorMain.js
+++ b/Sources/DamageCalculatorMain.js
@@ -23,6 +23,7 @@ import { roundFloat, startProgressiveProcess } from './Utilities.js';
 import { g_appData } from './AppData.js';
 import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos } from './SampleSkillInfos.js';
 import { heroInfos } from './SampleHeroInfos.js';
+import { createApp } from 'vue';
 
 // Side-effect imports for skill registration
 import './SkillEffectCore.js';
@@ -1118,9 +1119,8 @@ function initDamageCalculator(heroInfos, weaponInfos, supportInfos, specialInfos
     g_damageCalcData = new DamageCalcData(
         heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
         passiveSInfos, passiveXInfos);
-    g_damageCalcVm = new Vue({
-        el: "#damageCalc",
-        data: g_damageCalcData,
+    const app = createApp({
+        data() { return g_damageCalcData; },
         methods: {
             triangleAdvantageChanged: function () {
                 g_damageCalcData.updateDamageDealt();
@@ -1141,6 +1141,8 @@ function initDamageCalculator(heroInfos, weaponInfos, supportInfos, specialInfos
             },
         }
     });
+    app.mount('#damageCalc');
+    g_damageCalcVm = app;
 }
 
 // Initialization
diff --git a/Sources/HeroIconLister.html b/Sources/HeroIconLister.html
index 9ecfce68..503a75d4 100644
--- a/Sources/HeroIconLister.html
+++ b/Sources/HeroIconLister.html
@@ -52,8 +52,6 @@
         FEHの全英雄のアイコン一覧です。特定の英雄について説明用の資料を作る時などに使います。
     </p>
 
-    <!-- vue.js -->
-    <script async src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js"></script>
 
     <!-- rasterizehtml -->
     <script async src="https://fire-emblem.fun/js/rasterizeHTML.allinone.js"></script>
diff --git a/Sources/HeroIconListerMain.js b/Sources/HeroIconListerMain.js
index bd504e21..d8a45fd6 100644
--- a/Sources/HeroIconListerMain.js
+++ b/Sources/HeroIconListerMain.js
@@ -1,3 +1,4 @@
+import { createApp } from 'vue';
 import { HeroDatabase } from './HeroDatabase.js';
 import { heroInfos as sampleHeroInfos } from './SampleHeroInfos.js';
 
@@ -100,10 +101,10 @@ let g_appData = null;
 
 function init(heroInfos) {
     g_appData = new AppData(heroInfos);
-    const vm = new Vue({
-        el: "#app",
-        data: g_appData
+    const app = createApp({
+        data() { return g_appData; }
     });
+    app.mount('#app');
     g_appData.heroInfos = heroInfos;
     g_appData.applyFilter();
 }
diff --git a/Sources/HeroStatusClusterer.html b/Sources/HeroStatusClusterer.html
index 81bb96c2..d88eac19 100644
--- a/Sources/HeroStatusClusterer.html
+++ b/Sources/HeroStatusClusterer.html
@@ -222,11 +222,6 @@
     <link type="text/css" rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.min.css">
     <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
 
-    <!-- vue.js -->
-    <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js"></script>
-
-    <!-- vuex.js -->
-    <script src="https://unpkg.com/vuex@3.6.2/dist/vuex.min.js"></script>
 
     <script type="module" src="./HeroStatusClustererMain.js"></script>
 </body>
diff --git a/Sources/HeroStatusClustererMain.js b/Sources/HeroStatusClustererMain.js
index 80e47db9..62ede414 100644
--- a/Sources/HeroStatusClustererMain.js
+++ b/Sources/HeroStatusClustererMain.js
@@ -3,6 +3,7 @@ import { MoveType } from './HeroInfoConstants.js';
 import { isPhysicalWeaponType } from './Skill.js';
 import { ScopedStopwatch, using_, startProgressiveProcess, distinct } from './Utilities.js';
 import { heroInfos as sampleHeroInfos } from './SampleHeroInfos.js';
+import { createApp } from 'vue';
 import { initVueComponents } from './VueComponents.js';
 
 // Side-effect imports for skill registration
@@ -655,9 +656,8 @@ let g_heroStatusClustererData = null;
 let g_heroStatusClustererViewModel = null;
 function initializeStatusClusterer(heroInfos) {
     g_heroStatusClustererData = new HeroStatusClustererData(heroInfos);
-    g_heroStatusClustererViewModel = new Vue({
-        el: "#heroStatusClusterer",
-        data: g_heroStatusClustererData,
+    const app = createApp({
+        data() { return g_heroStatusClustererData; },
         methods: {
             mergeClusters() {
                 g_heroStatusClustererData.initClusters();
@@ -671,11 +671,13 @@ function initializeStatusClusterer(heroInfos) {
             },
         }
     });
+    initVueComponents(app);
+    app.mount('#heroStatusClusterer');
+    g_heroStatusClustererViewModel = app;
 }
 
 // Initialization
 const resolvedHeroInfos = window.heroInfos || sampleHeroInfos;
-initVueComponents();
 initializeStatusClusterer(resolvedHeroInfos);
 
 export { HeroStatusClustererData, g_heroStatusClustererData, initializeStatusClusterer };
diff --git a/Sources/StatusCalcMain.js b/Sources/StatusCalcMain.js
index c3f613e2..2a1a1037 100644
--- a/Sources/StatusCalcMain.js
+++ b/Sources/StatusCalcMain.js
@@ -8,6 +8,7 @@ import { SummonerLevel } from './UnitConstants.js';
 import { HeroInfo } from './HeroInfo.js';
 import { heroInfos } from './SampleHeroInfos.js';
 import { weaponInfos } from './SampleSkillInfos.js';
+import { createApp } from 'vue';
 
 // Side-effect imports for skill registration
 import './SkillEffectCore.js';
@@ -103,14 +104,15 @@ function init(heroInfo, skillInfos, totalSp) {
     unit.initializeSkillsToDefault();
     unit.weaponInfo = __findSkillInfo(skillInfos, unit.weapon);
 
-    g_app = new Vue({
-        el: "#app",
-        data: {
-            /** @member {Unit} */
-            value: unit,
-            isWeaponEnabled: false,
-            totalSp: 0,
-            isDuelSkillEnabled: false,
+    const app = createApp({
+        data() {
+            return {
+                /** @member {Unit} */
+                value: unit,
+                isWeaponEnabled: false,
+                totalSp: 0,
+                isDuelSkillEnabled: false,
+            };
         },
         methods: {
             reset() {
@@ -156,6 +158,8 @@ function init(heroInfo, skillInfos, totalSp) {
             },
         }
     });
+    app.mount('#app');
+    g_app = app;
     g_app.totalSp = totalSp;
     updateStatus();
 }
diff --git a/Sources/SummonerDuelsSimulator.html b/Sources/SummonerDuelsSimulator.html
index 480aca24..41d701f2 100644
--- a/Sources/SummonerDuelsSimulator.html
+++ b/Sources/SummonerDuelsSimulator.html
@@ -534,9 +534,9 @@
                                     <input type="button" class="buttonUi" style="width:80px"
                                            @click="g_appData.pasteToCurrentUnit();" value="ペースト">
                                 </div>
-                                <unit-detail v-model="unit" v-if="!unit.canHavePairUpUnit || !unit.isEditingPairUpUnit">
+                                <unit-detail :value="unit" v-if="!unit.canHavePairUpUnit || !unit.isEditingPairUpUnit">
                                 </unit-detail>
-                                <unit-detail v-model="unit.pairUpUnit"
+                                <unit-detail :value="unit.pairUpUnit"
                                     v-show="unit.canHavePairUpUnit && unit.isEditingPairUpUnit"></unit-detail>
                             </li>
                             <li v-for="unit in allyUnits">
@@ -558,17 +558,17 @@
                                     <input type="button" class="buttonUi" style="width:80px"
                                            @click="g_appData.pasteToCurrentUnit();" value="ペースト">
                                 </div>
-                                <unit-detail v-model="unit" v-if="!unit.canHavePairUpUnit || !unit.isEditingPairUpUnit">
+                                <unit-detail :value="unit" v-if="!unit.canHavePairUpUnit || !unit.isEditingPairUpUnit">
                                 </unit-detail>
-                                <unit-detail v-model="unit.pairUpUnit"
+                                <unit-detail :value="unit.pairUpUnit"
                                     v-show="unit.canHavePairUpUnit && unit.isEditingPairUpUnit"></unit-detail>
                             </li>
                             <li v-for="structure in offenceStructureStorage.objs">
-                                <structure-detail v-model="structure">
+                                <structure-detail :value="structure">
                                 </structure-detail>
                             </li>
                             <li v-for="structure in defenseStructureStorage.objs">
-                                <structure-detail v-model="structure">
+                                <structure-detail :value="structure">
                                 </structure-detail>
                             </li>
                             <!-- </ul>
@@ -1448,18 +1448,9 @@
         onload="this.media='all'">
     <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
 
-    <!-- vue.js -->
-    <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js"></script>
-
-    <!-- vuex.js -->
-    <script src="https://unpkg.com/vuex@3.6.2/dist/vuex.min.js"></script>
-
     <!-- sortable.js -->
     <script async src="https://cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js"></script>
 
-    <!-- vuedraggable.js -->
-    <script async src="https://cdnjs.cloudflare.com/ajax/libs/Vue.Draggable/2.23.2/vuedraggable.umd.min.js"></script>
-
     <!-- クッキー(実際は使ってないので消してもいいかも) -->
     <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
 
diff --git a/Sources/SummonerDuelsSimulatorMain.js b/Sources/SummonerDuelsSimulatorMain.js
index 21ef1f6f..5ead0411 100644
--- a/Sources/SummonerDuelsSimulatorMain.js
+++ b/Sources/SummonerDuelsSimulatorMain.js
@@ -144,7 +144,6 @@ function initAetherRaidBoard(
 
 // Initialization
 window.g_app = g_app;
-initVueComponents();
 g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
 g_app.registerHeroOptions(heroInfos, false);
 initAetherRaidBoard(heroInfos);
diff --git a/Sources/UnitBuilder.html b/Sources/UnitBuilder.html
index 2e7ecab6..b3aeb679 100644
--- a/Sources/UnitBuilder.html
+++ b/Sources/UnitBuilder.html
@@ -534,9 +534,9 @@
                                     </span>
                                 </div>
 
-                                <unit-detail v-model="unit" v-if="!unit.canHavePairUpUnit || !unit.isEditingPairUpUnit">
+                                <unit-detail :value="unit" v-if="!unit.canHavePairUpUnit || !unit.isEditingPairUpUnit">
                                 </unit-detail>
-                                <unit-detail v-model="unit.pairUpUnit"
+                                <unit-detail :value="unit.pairUpUnit"
                                     v-show="unit.canHavePairUpUnit && unit.isEditingPairUpUnit"></unit-detail>
                             </li>
                         </ul>
@@ -1176,18 +1176,9 @@
         onload="this.media='all'">
     <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script> -->
 
-    <!-- vue.js -->
-    <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js"></script>
-
-    <!-- vuex.js -->
-    <script src="https://unpkg.com/vuex@3.6.2/dist/vuex.min.js"></script>
-
     <!-- sortable.js -->
     <script async src="https://cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js"></script>
 
-    <!-- vuedraggable.js -->
-    <script async src="https://cdnjs.cloudflare.com/ajax/libs/Vue.Draggable/2.23.2/vuedraggable.umd.min.js"></script>
-
     <!-- クッキー(実際は使ってないので消してもいいかも) -->
     <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
 
diff --git a/Sources/UnitBuilderMain.js b/Sources/UnitBuilderMain.js
index f636bc59..27987de1 100644
--- a/Sources/UnitBuilderMain.js
+++ b/Sources/UnitBuilderMain.js
@@ -172,7 +172,6 @@ function initUnitBuilder() {
 
 // Initialization
 window.g_app = g_app;
-initVueComponents();
 g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, [], false);
 g_app.registerHeroOptions(heroInfos, false);
 initUnitBuilder();
diff --git a/Sources/VueComponents.js b/Sources/VueComponents.js
index 162fefe9..791fa450 100644
--- a/Sources/VueComponents.js
+++ b/Sources/VueComponents.js
@@ -1,18 +1,27 @@
 /// @file
 /// @brief Vueのcomponentの定義です。
 
-function initVueComponents() {
-    Vue.component('battle-map', {
+// Temporary Vuex shim (to be replaced by Pinia in Section 07)
+function mapStateShim(keys) {
+    const result = {};
+    for (const key of keys) {
+        result[key] = function() { return this.$store.state[key]; };
+    }
+    return result;
+}
+
+function initVueComponents(app) {
+    app.component('battle-map', {
         template: '<div id="mapArea"></div>',
         mounted() {
             // 初回マウント時に既存のロジックをそのまま呼ぶだけ
             updateMapUi();
         }
     });
-    Vue.component('unit-detail', {
+    app.component('unit-detail', {
         props: ['value'],
         computed: {
-            ...Vuex.mapState(['battleSimulator', 'appData', 'imageRootPath'])
+            ...mapStateShim(['battleSimulator', 'appData', 'imageRootPath'])
         },
         template: `
           <table border='0' style='border-width: 0px;border-style:none;'>
@@ -618,10 +627,10 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('tile-detail', {
+    app.component('tile-detail', {
         props: ['value'],
         computed: {
-            ...Vuex.mapState(['battleSimulator'])
+            ...mapStateShim(['battleSimulator'])
         },
         template: `
           <div>
@@ -656,10 +665,10 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('structure-detail', {
+    app.component('structure-detail', {
         props: ['value'],
         computed: {
-            ...Vuex.mapState(['battleSimulator', 'appData'])
+            ...mapStateShim(['battleSimulator', 'appData'])
         },
         template: `
           <div style="height:500px;vertical-align:middle;display: table-cell;padding:10px">
@@ -698,7 +707,7 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('status-label', {
+    app.component('status-label', {
         props: ['statusType', 'unit'],
         template: `
           {{statusType}}
@@ -715,7 +724,7 @@ function initVueComponents() {
     });
 
     // select2 を使うためのVueコンポーネント
-    Vue.component('select2', {
+    app.component('select2', {
         template: '<select></select>',
 
         props: {
@@ -723,16 +732,17 @@ function initVueComponents() {
                 type: Array,
                 required: true,
             },
-            value: {
+            modelValue: {
                 type: [Number, String],
                 required: false,
             },
             fallbackValue: {type: [Number, String], default: -1, required: false},
             isDebugMode: {type: Boolean, default: false, required: false},
         },
+        emits: ['update:modelValue'],
 
         mounted() {
-            this.initSelect2(this.options, this.value);
+            this.initSelect2(this.options, this.modelValue);
         },
 
         methods: {
@@ -754,7 +764,7 @@ function initVueComponents() {
                         const parsed = parseInt(raw, 10);
                         const newVar = isNaN(parsed) ? raw : parsed;
                         if (newVar === 0 || newVar) {
-                            this.$emit('input', newVar);
+                            this.$emit('update:modelValue', newVar);
                         }
                     });
             },
@@ -781,28 +791,25 @@ function initVueComponents() {
         },
 
         watch: {
-            value(newVal, oldVal) {
-                // console.log(`select2: value changed: ${oldVal} -> ${newVal}`);
+            modelValue(newVal, oldVal) {
                 // 1. 現在の UI 側 select2 の値を取得
                 const uiVal = $(this.$el).val();
-                // console.log(`select2: UI val = ${uiVal}, prop newVal = ${newVal}`);
 
                 // 2. UI とプロップが異なる場合のみ反映して change を起こす
                 if (String(uiVal) !== String(newVal)) {
-                    // console.log('update with new value: ' + newVal);
                     $(this.$el)
                         .val(newVal)
                         .trigger('change');
                 }
                 if (this.isDebugMode) {
-                    const hasCurrent = this.options.some(opt => String(opt.id) === String(this.value));
+                    const hasCurrent = this.options.some(opt => String(opt.id) === String(this.modelValue));
                     this.applyInvalidValueClass(hasCurrent);
                 }
             },
 
             options(newOptions, oldOptions) {
-                // まず、現在の this.value が newOptions に含まれているかチェック
-                const hasCurrent = newOptions.some(opt => String(opt.id) === String(this.value));
+                // まず、現在の this.modelValue が newOptions に含まれているかチェック
+                const hasCurrent = newOptions.some(opt => String(opt.id) === String(this.modelValue));
                 // デバッグモードならオプションにない値が含まれても元の値を保持する
                 // その際に警告を表示する
                 // そうでない場合は元の値に-1をセットする
@@ -812,30 +819,30 @@ function initVueComponents() {
                     if (!hasCurrent) {
                         // 「不正な値」用のダミーオプションを作成
                         effectiveOptions.push({
-                            id: this.value,
-                            text: `（不正な値: ${this.value}）`,
+                            id: this.modelValue,
+                            text: `（不正な値: ${this.modelValue}）`,
                             disabled: true
                         });
                     }
-                    this.resetData(effectiveOptions, this.value);
+                    this.resetData(effectiveOptions, this.modelValue);
 
                     // 不正値表示用にスタイルを付与（任意）
                     this.applyInvalidValueClass(hasCurrent);
                 } else {
                     // オプションにない要素は -1（fallbackValue 使用）
-                    const selectedValue = hasCurrent ? this.value : this.fallbackValue;
+                    const selectedValue = hasCurrent ? this.modelValue : this.fallbackValue;
                     this.resetData(newOptions, selectedValue);
                 }
             },
         },
 
-        beforeDestroy() {
+        beforeUnmount() {
             // select2 インスタンスのクリーンアップ
             $(this.$el).off().select2('destroy');
         }
     });
 
-    Vue.component('FlashMessage', {
+    app.component('FlashMessage', {
         name: 'FlashMessage',
         props: [
             'flashMessages',
@@ -861,7 +868,7 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('SkillToggle', {
+    app.component('SkillToggle', {
         name: 'SkillToggle',
         model: {
             prop: 'unit',
@@ -893,7 +900,7 @@ function initVueComponents() {
         }
     });
 
-    Vue.component('SkillActions', {
+    app.component('SkillActions', {
         name: 'SkillAction',
         model: {
             prop: 'unit',
@@ -928,7 +935,7 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('CustomSkillForm', {
+    app.component('CustomSkillForm', {
         name: 'CustomSkillForm',
         model: {
             prop: 'unit',
@@ -1055,7 +1062,7 @@ function initVueComponents() {
         `
     })
 
-    Vue.component('SkillForm', {
+    app.component('SkillForm', {
         name: 'SkillForm',
         model: {
             prop: 'unit',
@@ -1064,7 +1071,7 @@ function initVueComponents() {
             unit: {type: Unit, required: true},
         },
         computed: {
-            ...Vuex.mapState(['battleSimulator', 'appData', 'imageRootPath']),
+            ...mapStateShim(['battleSimulator', 'appData', 'imageRootPath']),
         },
         template: `
           <div class="skill-grid">
@@ -1379,7 +1386,7 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('SkillActionArea', {
+    app.component('SkillActionArea', {
         name: 'SkillActionArea',
         model: {
             prop: 'unit',
@@ -1388,7 +1395,7 @@ function initVueComponents() {
             unit: {type: Unit, required: true},
         },
         computed: {
-            ...Vuex.mapState(['battleSimulator', 'appData']),
+            ...mapStateShim(['battleSimulator', 'appData']),
         },
         template: `
           <div>
@@ -1418,13 +1425,13 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('MapButton', {
+    app.component('MapButton', {
         name: 'MapButton',
         props: {
             testMethod: {type: Function, required: false},
         },
         computed: {
-            ...Vuex.mapState(['battleSimulator'])
+            ...mapStateShim(['battleSimulator'])
         },
         methods: {
             getAttacker: function () {
@@ -1522,7 +1529,7 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('ControlButtons', {
+    app.component('ControlButtons', {
         name: 'ControlButtons',
         methods: {},
         mounted() {
@@ -1538,10 +1545,10 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('UpperButtons', {
+    app.component('UpperButtons', {
         name: 'UpperButtons',
         computed: {
-            ...Vuex.mapState(['battleSimulator', 'appData'])
+            ...mapStateShim(['battleSimulator', 'appData'])
         },
         methods: {
             updateMap() {
@@ -1625,10 +1632,10 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('LowerButtons', {
+    app.component('LowerButtons', {
         name: 'LowerButtons',
         computed: {
-            ...Vuex.mapState(['battleSimulator', 'appData'])
+            ...mapStateShim(['battleSimulator', 'appData'])
         },
         methods: {},
         mounted() {
@@ -1659,7 +1666,7 @@ function initVueComponents() {
         `
     })
 
-    Vue.component('MapButtonInUnitTab', {
+    app.component('MapButtonInUnitTab', {
         name: 'MapButtonInUnitTab',
         model: {
             prop: 'unit',
@@ -1668,7 +1675,7 @@ function initVueComponents() {
             unit: {type: Unit, required: true},
         },
         computed: {
-            ...Vuex.mapState(['battleSimulator'])
+            ...mapStateShim(['battleSimulator'])
         },
         methods: {
             getSkillButtonStyle(unit) {
@@ -1712,7 +1719,7 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('ArenaScore', {
+    app.component('ArenaScore', {
         name: 'ArenaScore',
         model: {
             prop: 'unit',
@@ -1721,7 +1728,7 @@ function initVueComponents() {
             unit: {type: Unit, required: true},
         },
         computed: {
-            ...Vuex.mapState(['battleSimulator', 'appData']),
+            ...mapStateShim(['battleSimulator', 'appData']),
         },
         template: `
           <fieldset v-if="appData.gameMode === GameMode.Arena"  style="font-size:12px;">
@@ -1737,7 +1744,7 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('UnitDebug', {
+    app.component('UnitDebug', {
         name: 'UnitDebug',
         model: {
             prop: 'unit',
@@ -1746,7 +1753,7 @@ function initVueComponents() {
             unit: {type: Unit, required: true},
         },
         computed: {
-            ...Vuex.mapState(['battleSimulator', 'appData'])
+            ...mapStateShim(['battleSimulator', 'appData'])
         },
         template: `
           <span v-bind:style="battleSimulator.vm.debugMenuStyle">
@@ -1825,7 +1832,7 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('DebugSettings', {
+    app.component('DebugSettings', {
         name: 'DebugSettings',
         props: {
             isDebugMenuEnabled: {type: Boolean, required: true},
@@ -1865,9 +1872,9 @@ function initVueComponents() {
         }
     });
 
-    Vue.component('SimulationControls', {
+    app.component('SimulationControls', {
         computed: {
-            ...Vuex.mapState(['battleSimulator', 'appData'])
+            ...mapStateShim(['battleSimulator', 'appData'])
         },
         methods: {
             onHealHp() {
@@ -1954,7 +1961,7 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('debug-buttons', {
+    app.component('debug-buttons', {
         props: {
             resetUnitRandom: {type: Function, required: true},
             activateAllUnit: {type: Function, required: true},
@@ -1962,7 +1969,7 @@ function initVueComponents() {
             openAutoClearDialog: {type: Function, required: true},
         },
         computed: {
-            ...Vuex.mapState(['battleSimulator']),
+            ...mapStateShim(['battleSimulator']),
         },
         template: `
             <div>
@@ -2006,7 +2013,7 @@ function initVueComponents() {
           `
     });
 
-    Vue.component('log-panel', {
+    app.component('log-panel', {
         props: {
             simulatorLogLevel: {type: Number, required: true},
             simulatorLogLevelOption: {type: Array, required: true},
@@ -2017,7 +2024,7 @@ function initVueComponents() {
             copyDebugLogToClipboard: {type: Function, required: true},
         },
         computed: {
-            ...Vuex.mapState(['battleSimulator'])
+            ...mapStateShim(['battleSimulator'])
         },
         methods: {
             onSimulatorLogLevelChange(e) {
@@ -2056,7 +2063,7 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('EditableTable', {
+    app.component('EditableTable', {
         model: {
             prop: 'rows',
             event: 'update:rows'
@@ -2105,7 +2112,7 @@ function initVueComponents() {
                     // ファイルの内容を取得
                     let results = JSON.parse(event.target.result);
                     if (replace) {
-                        this.$set(this, 'rows', results);
+                        this.rows = results;
                     } else {
                         results.forEach(x => {
                             this.rows.push(x);
@@ -2272,7 +2279,7 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('UnitStorageDialog', {
+    app.component('UnitStorageDialog', {
         props: {
             getAppData: {type: Function, required: true},
             weaponTypeIconPath: {type: Function, required: true},
@@ -2287,7 +2294,7 @@ function initVueComponents() {
             };
         },
         computed: {
-            ...Vuex.mapState(['battleSimulator'])
+            ...mapStateShim(['battleSimulator'])
         },
         methods: {
             setUnitName(name) {
@@ -2318,7 +2325,7 @@ function initVueComponents() {
                 const savedUnit = this.rows[originalIndex];
                 const result = window.confirm(`${savedUnit.name}を${name}で上書きして良いですか？`);
                 if (result) {
-                    Vue.set(this.rows, originalIndex, {
+                    this.rows.splice(originalIndex, 1, {
                         name: name,
                         weaponType: currentUnit.weaponType,
                         moveType: currentUnit.moveType,
@@ -2426,7 +2433,7 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('divine-vein-opacity-settings', {
+    app.component('divine-vein-opacity-settings', {
         model: {
             prop: 'divineVeinOpacities',
             event: 'change'
@@ -2483,7 +2490,7 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('divine-vein-display-settings', {
+    app.component('divine-vein-display-settings', {
         model: {
             prop: 'divineVeinDisplaySettings',
             event: 'change'
@@ -2558,13 +2565,13 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('log-action-buttons', {
+    app.component('log-action-buttons', {
         props: {
             onCopy: {type: Function, required: true},
             onInfo: {type: Function, required: false},
         },
         computed: {
-            ...Vuex.mapState(['battleSimulator', 'appData'])
+            ...mapStateShim(['battleSimulator', 'appData'])
         },
         methods: {
             defaultInfoHandler() {
@@ -2617,7 +2624,7 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('damage-calc-result', {
+    app.component('damage-calc-result', {
         props: {
             combatResult: {
                 type: CombatResult,
@@ -2932,7 +2939,7 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('log-node', {
+    app.component('log-node', {
         name: 'log-node',
         props: {
             node: {type: GroupLog, required: true}, // GroupLog<SkillLogContent>
@@ -3004,8 +3011,9 @@ function initVueComponents() {
         methods: {
             setOpenAll(val) {
                 this.open = !!val;
-                if (this.hasChildren) {
-                    this.$children.forEach(c => c.setOpenAll && c.setOpenAll(val));
+                if (this.hasChildren && this.$refs.childNodes) {
+                    const refs = Array.isArray(this.$refs.childNodes) ? this.$refs.childNodes : [this.$refs.childNodes];
+                    refs.forEach(c => c.setOpenAll && c.setOpenAll(val));
                 }
             },
         },
@@ -3029,6 +3037,7 @@ function initVueComponents() {
             </div>
             <div class="log-children" v-show="open" v-if="hasChildren">
               <log-node
+                ref="childNodes"
                 v-for="(child, i) in node.children"
                 :key="i"
                 :node="child"
@@ -3043,7 +3052,7 @@ function initVueComponents() {
         `,
     });
 
-    Vue.component('attack-calc-result', {
+    app.component('attack-calc-result', {
         props: {
             combatResult: {type: CombatResult, required: true},
             attackResult: {type: AttackResult, required: true},
@@ -3113,7 +3122,7 @@ function initVueComponents() {
         `
     });
 
-    Vue.component('strike-calc-result', {
+    app.component('strike-calc-result', {
         props: {
             combatResult: {type: CombatResult, required: true, default: null,},
             attackResult: {type: AttackResult, required: true, default: null,},
@@ -3220,9 +3229,5 @@ function initVueComponents() {
         `
     });
 }
-Vue.config.errorHandler = (err, vm, info) => {
-    console.error('[Vue]', vm && vm.$options && vm.$options.name, info, err);
-};
-initVueComponents();
 
 export { initVueComponents };
diff --git a/Tests/Vue3Core.test.js b/Tests/Vue3Core.test.js
new file mode 100644
index 00000000..cf79200b
--- /dev/null
+++ b/Tests/Vue3Core.test.js
@@ -0,0 +1,85 @@
+import { createApp } from 'vue';
+import fs from 'fs';
+import path from 'path';
+
+const ROOT = path.resolve(__dirname, '..');
+const SOURCES = path.join(ROOT, 'Sources');
+
+describe('D.1 Vue 3 Installation', () => {
+    test('import { createApp } from vue resolves successfully', () => {
+        expect(typeof createApp).toBe('function');
+    });
+
+    test('Vue 3 runtime compiler build is configured via alias', () => {
+        const configContent = fs.readFileSync(
+            path.resolve(ROOT, 'vite.config.js'), 'utf-8'
+        );
+        expect(configContent).toContain('vue.esm-bundler.js');
+    });
+
+    test('CDN Vue 2 script tags are removed from all HTML files', () => {
+        const htmlFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.html'));
+        for (const file of htmlFiles) {
+            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
+            expect(content).not.toContain('vue/2.5.13');
+            expect(content).not.toContain('vue.min.js');
+        }
+    });
+
+    test('CDN Vuex script tags are removed from all HTML files', () => {
+        const htmlFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.html'));
+        for (const file of htmlFiles) {
+            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
+            expect(content).not.toContain('vuex@3.6.2');
+            expect(content).not.toContain('vuex.min.js');
+        }
+    });
+});
+
+describe('D.2 Vue Instance Migration', () => {
+    test('createApp() creates a Vue application successfully', () => {
+        const app = createApp({ data() { return { msg: 'hello' }; } });
+        expect(app).toBeDefined();
+        expect(typeof app.mount).toBe('function');
+    });
+});
+
+describe('D.6 Breaking Changes Elimination', () => {
+    test('Vue.set and $set are not used in source code', () => {
+        const jsFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.js'));
+        for (const file of jsFiles) {
+            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
+            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
+            const activeContent = lines.join('\n');
+            expect(activeContent).not.toMatch(/Vue\.set\s*\(/);
+            expect(activeContent).not.toMatch(/\.\$set\s*\(/);
+        }
+    });
+
+    test('$delete is not used in source code', () => {
+        const jsFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.js'));
+        for (const file of jsFiles) {
+            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
+            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
+            expect(lines.join('\n')).not.toMatch(/\.\$delete\s*\(/);
+        }
+    });
+
+    test('beforeDestroy hook is not used', () => {
+        const jsFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.js'));
+        for (const file of jsFiles) {
+            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
+            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
+            expect(lines.join('\n')).not.toMatch(/\bbeforeDestroy\s*[\({]/);
+        }
+    });
+
+    test('$children is not used in source code', () => {
+        const jsFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.js'));
+        for (const file of jsFiles) {
+            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
+            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
+            expect(lines.join('\n')).not.toMatch(/\.\$children/);
+        }
+    });
+});
diff --git a/package-lock.json b/package-lock.json
index 14829b10..cda0b3c9 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -8,6 +8,9 @@
       "name": "fehbattlesimulator",
       "version": "1.0.0",
       "license": "MIT",
+      "dependencies": {
+        "vue": "^3.5.30"
+      },
       "devDependencies": {
         "@types/lz-string": "^1.5.0",
         "@vitejs/plugin-vue": "^6.0.5",
@@ -231,7 +234,6 @@
       "version": "7.27.1",
       "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.27.1.tgz",
       "integrity": "sha512-qMlSxKbpRlAridDExk92nSobyDdpPijUq2DW6oDnUqd0iOGxmQjyqhMIihI9+zv4LPyZdRje2cavWPbCbWm3eA==",
-      "dev": true,
       "license": "MIT",
       "engines": {
         "node": ">=6.9.0"
@@ -241,7 +243,6 @@
       "version": "7.28.5",
       "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.28.5.tgz",
       "integrity": "sha512-qSs4ifwzKJSV39ucNjsvc6WVHs6b7S03sOh2OcHF9UHfVPqWWALUsNUVzhSBiItjRZoLHx7nIarVjqKVusUZ1Q==",
-      "dev": true,
       "license": "MIT",
       "engines": {
         "node": ">=6.9.0"
@@ -274,7 +275,6 @@
       "version": "7.29.0",
       "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.0.tgz",
       "integrity": "sha512-IyDgFV5GeDUVX4YdF/3CPULtVGSXXMLh1xVIgdCgxApktqnQV0r7/8Nqthg+8YLGaAtdyIlo2qIdZrbCv4+7ww==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@babel/types": "^7.29.0"
@@ -512,7 +512,6 @@
       "version": "7.29.0",
       "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.0.tgz",
       "integrity": "sha512-LwdZHpScM4Qz8Xw2iKSzS+cfglZzJGvofQICy7W7v4caru4EaAmyUuO6BGrbyQ2mYV11W0U8j5mBhd14dd3B0A==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@babel/helper-string-parser": "^7.27.1",
@@ -1018,7 +1017,6 @@
       "version": "1.5.5",
       "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz",
       "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==",
-      "dev": true,
       "license": "MIT"
     },
     "node_modules/@jridgewell/trace-mapping": {
@@ -1713,7 +1711,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/compiler-core/-/compiler-core-3.5.30.tgz",
       "integrity": "sha512-s3DfdZkcu/qExZ+td75015ljzHc6vE+30cFMGRPROYjqkroYI5NV2X1yAMX9UeyBNWB9MxCfPcsjpLS11nzkkw==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@babel/parser": "^7.29.0",
@@ -1727,7 +1724,6 @@
       "version": "7.0.1",
       "resolved": "https://registry.npmjs.org/entities/-/entities-7.0.1.tgz",
       "integrity": "sha512-TWrgLOFUQTH994YUyl1yT4uyavY5nNB5muff+RtWaqNVCAK408b5ZnnbNAUEWLTCpum9w6arT70i1XdQ4UeOPA==",
-      "dev": true,
       "license": "BSD-2-Clause",
       "engines": {
         "node": ">=0.12"
@@ -1740,7 +1736,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/compiler-dom/-/compiler-dom-3.5.30.tgz",
       "integrity": "sha512-eCFYESUEVYHhiMuK4SQTldO3RYxyMR/UQL4KdGD1Yrkfdx4m/HYuZ9jSfPdA+nWJY34VWndiYdW/wZXyiPEB9g==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@vue/compiler-core": "3.5.30",
@@ -1751,7 +1746,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/compiler-sfc/-/compiler-sfc-3.5.30.tgz",
       "integrity": "sha512-LqmFPDn89dtU9vI3wHJnwaV6GfTRD87AjWpTWpyrdVOObVtjIuSeZr181z5C4PmVx/V3j2p+0f7edFKGRMpQ5A==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@babel/parser": "^7.29.0",
@@ -1769,7 +1763,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/compiler-ssr/-/compiler-ssr-3.5.30.tgz",
       "integrity": "sha512-NsYK6OMTnx109PSL2IAyf62JP6EUdk4Dmj6AkWcJGBvN0dQoMYtVekAmdqgTtWQgEJo+Okstbf/1p7qZr5H+bA==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@vue/compiler-dom": "3.5.30",
@@ -1780,7 +1773,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/reactivity/-/reactivity-3.5.30.tgz",
       "integrity": "sha512-179YNgKATuwj9gB+66snskRDOitDiuOZqkYia7mHKJaidOMo/WJxHKF8DuGc4V4XbYTJANlfEKb0yxTQotnx4Q==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@vue/shared": "3.5.30"
@@ -1790,7 +1782,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/runtime-core/-/runtime-core-3.5.30.tgz",
       "integrity": "sha512-e0Z+8PQsUTdwV8TtEsLzUM7SzC7lQwYKePydb7K2ZnmS6jjND+WJXkmmfh/swYzRyfP1EY3fpdesyYoymCzYfg==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@vue/reactivity": "3.5.30",
@@ -1801,7 +1792,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/runtime-dom/-/runtime-dom-3.5.30.tgz",
       "integrity": "sha512-2UIGakjU4WSQ0T4iwDEW0W7vQj6n7AFn7taqZ9Cvm0Q/RA2FFOziLESrDL4GmtI1wV3jXg5nMoJSYO66egDUBw==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@vue/reactivity": "3.5.30",
@@ -1814,7 +1804,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/server-renderer/-/server-renderer-3.5.30.tgz",
       "integrity": "sha512-v+R34icapydRwbZRD0sXwtHqrQJv38JuMB4JxbOxd8NEpGLny7cncMp53W9UH/zo4j8eDHjQ1dEJXwzFQknjtQ==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@vue/compiler-ssr": "3.5.30",
@@ -1828,7 +1817,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/shared/-/shared-3.5.30.tgz",
       "integrity": "sha512-YXgQ7JjaO18NeK2K9VTbDHaFy62WrObMa6XERNfNOkAhD1F1oDSf3ZJ7K6GqabZ0BvSDHajp8qfS5Sa2I9n8uQ==",
-      "dev": true,
       "license": "MIT"
     },
     "node_modules/abab": {
@@ -2438,7 +2426,6 @@
       "version": "3.2.3",
       "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
       "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
-      "dev": true,
       "license": "MIT"
     },
     "node_modules/data-urls": {
@@ -2938,7 +2925,6 @@
       "version": "2.0.2",
       "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-2.0.2.tgz",
       "integrity": "sha512-Rfkk/Mp/DL7JVje3u18FxFujQlTNR2q6QfMSMB7AvCBx91NGj/ba3kCfza0f6dVDbw7YlRf/nDrn7pQrCCyQ/w==",
-      "dev": true,
       "license": "MIT"
     },
     "node_modules/esutils": {
@@ -4734,7 +4720,6 @@
       "version": "0.30.21",
       "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
       "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "@jridgewell/sourcemap-codec": "^1.5.5"
@@ -4878,7 +4863,6 @@
       "version": "3.3.11",
       "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.11.tgz",
       "integrity": "sha512-N8SpfPUnUp1bK+PMYW8qSWdl9U+wwNWI4QKxOYDy9JAro3WMX7p2OeVRF9v+347pnakNevPmiHhNmZ2HbFA76w==",
-      "dev": true,
       "funding": [
         {
           "type": "github",
@@ -5127,7 +5111,6 @@
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
       "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
-      "dev": true,
       "license": "ISC"
     },
     "node_modules/picomatch": {
@@ -5167,7 +5150,6 @@
       "version": "8.5.8",
       "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.8.tgz",
       "integrity": "sha512-OW/rX8O/jXnm82Ey1k44pObPtdblfiuWnrd8X7GJ7emImCOstunGbXUpp7HdBrFQX6rJzn3sPT397Wp5aCwCHg==",
-      "dev": true,
       "funding": [
         {
           "type": "opencollective",
@@ -5540,7 +5522,6 @@
       "version": "1.2.1",
       "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
       "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
-      "dev": true,
       "license": "BSD-3-Clause",
       "engines": {
         "node": ">=0.10.0"
@@ -6148,7 +6129,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/vue/-/vue-3.5.30.tgz",
       "integrity": "sha512-hTHLc6VNZyzzEH/l7PFGjpcTvUgiaPK5mdLkbjrTeWSRcEfxFrv56g/XckIYlE9ckuobsdwqd5mk2g1sBkMewg==",
-      "dev": true,
       "license": "MIT",
       "peer": true,
       "dependencies": {
@@ -6580,14 +6560,12 @@
     "@babel/helper-string-parser": {
       "version": "7.27.1",
       "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.27.1.tgz",
-      "integrity": "sha512-qMlSxKbpRlAridDExk92nSobyDdpPijUq2DW6oDnUqd0iOGxmQjyqhMIihI9+zv4LPyZdRje2cavWPbCbWm3eA==",
-      "dev": true
+      "integrity": "sha512-qMlSxKbpRlAridDExk92nSobyDdpPijUq2DW6oDnUqd0iOGxmQjyqhMIihI9+zv4LPyZdRje2cavWPbCbWm3eA=="
     },
     "@babel/helper-validator-identifier": {
       "version": "7.28.5",
       "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.28.5.tgz",
-      "integrity": "sha512-qSs4ifwzKJSV39ucNjsvc6WVHs6b7S03sOh2OcHF9UHfVPqWWALUsNUVzhSBiItjRZoLHx7nIarVjqKVusUZ1Q==",
-      "dev": true
+      "integrity": "sha512-qSs4ifwzKJSV39ucNjsvc6WVHs6b7S03sOh2OcHF9UHfVPqWWALUsNUVzhSBiItjRZoLHx7nIarVjqKVusUZ1Q=="
     },
     "@babel/helper-validator-option": {
       "version": "7.23.5",
@@ -6609,7 +6587,6 @@
       "version": "7.29.0",
       "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.0.tgz",
       "integrity": "sha512-IyDgFV5GeDUVX4YdF/3CPULtVGSXXMLh1xVIgdCgxApktqnQV0r7/8Nqthg+8YLGaAtdyIlo2qIdZrbCv4+7ww==",
-      "dev": true,
       "requires": {
         "@babel/types": "^7.29.0"
       }
@@ -6781,7 +6758,6 @@
       "version": "7.29.0",
       "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.0.tgz",
       "integrity": "sha512-LwdZHpScM4Qz8Xw2iKSzS+cfglZzJGvofQICy7W7v4caru4EaAmyUuO6BGrbyQ2mYV11W0U8j5mBhd14dd3B0A==",
-      "dev": true,
       "requires": {
         "@babel/helper-string-parser": "^7.27.1",
         "@babel/helper-validator-identifier": "^7.28.5"
@@ -7175,8 +7151,7 @@
     "@jridgewell/sourcemap-codec": {
       "version": "1.5.5",
       "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz",
-      "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==",
-      "dev": true
+      "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og=="
     },
     "@jridgewell/trace-mapping": {
       "version": "0.3.25",
@@ -7647,7 +7622,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/compiler-core/-/compiler-core-3.5.30.tgz",
       "integrity": "sha512-s3DfdZkcu/qExZ+td75015ljzHc6vE+30cFMGRPROYjqkroYI5NV2X1yAMX9UeyBNWB9MxCfPcsjpLS11nzkkw==",
-      "dev": true,
       "requires": {
         "@babel/parser": "^7.29.0",
         "@vue/shared": "3.5.30",
@@ -7659,8 +7633,7 @@
         "entities": {
           "version": "7.0.1",
           "resolved": "https://registry.npmjs.org/entities/-/entities-7.0.1.tgz",
-          "integrity": "sha512-TWrgLOFUQTH994YUyl1yT4uyavY5nNB5muff+RtWaqNVCAK408b5ZnnbNAUEWLTCpum9w6arT70i1XdQ4UeOPA==",
-          "dev": true
+          "integrity": "sha512-TWrgLOFUQTH994YUyl1yT4uyavY5nNB5muff+RtWaqNVCAK408b5ZnnbNAUEWLTCpum9w6arT70i1XdQ4UeOPA=="
         }
       }
     },
@@ -7668,7 +7641,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/compiler-dom/-/compiler-dom-3.5.30.tgz",
       "integrity": "sha512-eCFYESUEVYHhiMuK4SQTldO3RYxyMR/UQL4KdGD1Yrkfdx4m/HYuZ9jSfPdA+nWJY34VWndiYdW/wZXyiPEB9g==",
-      "dev": true,
       "requires": {
         "@vue/compiler-core": "3.5.30",
         "@vue/shared": "3.5.30"
@@ -7678,7 +7650,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/compiler-sfc/-/compiler-sfc-3.5.30.tgz",
       "integrity": "sha512-LqmFPDn89dtU9vI3wHJnwaV6GfTRD87AjWpTWpyrdVOObVtjIuSeZr181z5C4PmVx/V3j2p+0f7edFKGRMpQ5A==",
-      "dev": true,
       "requires": {
         "@babel/parser": "^7.29.0",
         "@vue/compiler-core": "3.5.30",
@@ -7695,7 +7666,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/compiler-ssr/-/compiler-ssr-3.5.30.tgz",
       "integrity": "sha512-NsYK6OMTnx109PSL2IAyf62JP6EUdk4Dmj6AkWcJGBvN0dQoMYtVekAmdqgTtWQgEJo+Okstbf/1p7qZr5H+bA==",
-      "dev": true,
       "requires": {
         "@vue/compiler-dom": "3.5.30",
         "@vue/shared": "3.5.30"
@@ -7705,7 +7675,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/reactivity/-/reactivity-3.5.30.tgz",
       "integrity": "sha512-179YNgKATuwj9gB+66snskRDOitDiuOZqkYia7mHKJaidOMo/WJxHKF8DuGc4V4XbYTJANlfEKb0yxTQotnx4Q==",
-      "dev": true,
       "requires": {
         "@vue/shared": "3.5.30"
       }
@@ -7714,7 +7683,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/runtime-core/-/runtime-core-3.5.30.tgz",
       "integrity": "sha512-e0Z+8PQsUTdwV8TtEsLzUM7SzC7lQwYKePydb7K2ZnmS6jjND+WJXkmmfh/swYzRyfP1EY3fpdesyYoymCzYfg==",
-      "dev": true,
       "requires": {
         "@vue/reactivity": "3.5.30",
         "@vue/shared": "3.5.30"
@@ -7724,7 +7692,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/runtime-dom/-/runtime-dom-3.5.30.tgz",
       "integrity": "sha512-2UIGakjU4WSQ0T4iwDEW0W7vQj6n7AFn7taqZ9Cvm0Q/RA2FFOziLESrDL4GmtI1wV3jXg5nMoJSYO66egDUBw==",
-      "dev": true,
       "requires": {
         "@vue/reactivity": "3.5.30",
         "@vue/runtime-core": "3.5.30",
@@ -7736,7 +7703,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/server-renderer/-/server-renderer-3.5.30.tgz",
       "integrity": "sha512-v+R34icapydRwbZRD0sXwtHqrQJv38JuMB4JxbOxd8NEpGLny7cncMp53W9UH/zo4j8eDHjQ1dEJXwzFQknjtQ==",
-      "dev": true,
       "requires": {
         "@vue/compiler-ssr": "3.5.30",
         "@vue/shared": "3.5.30"
@@ -7745,8 +7711,7 @@
     "@vue/shared": {
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/shared/-/shared-3.5.30.tgz",
-      "integrity": "sha512-YXgQ7JjaO18NeK2K9VTbDHaFy62WrObMa6XERNfNOkAhD1F1oDSf3ZJ7K6GqabZ0BvSDHajp8qfS5Sa2I9n8uQ==",
-      "dev": true
+      "integrity": "sha512-YXgQ7JjaO18NeK2K9VTbDHaFy62WrObMa6XERNfNOkAhD1F1oDSf3ZJ7K6GqabZ0BvSDHajp8qfS5Sa2I9n8uQ=="
     },
     "abab": {
       "version": "2.0.6",
@@ -8190,8 +8155,7 @@
     "csstype": {
       "version": "3.2.3",
       "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
-      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
-      "dev": true
+      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ=="
     },
     "data-urls": {
       "version": "3.0.2",
@@ -8539,8 +8503,7 @@
     "estree-walker": {
       "version": "2.0.2",
       "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-2.0.2.tgz",
-      "integrity": "sha512-Rfkk/Mp/DL7JVje3u18FxFujQlTNR2q6QfMSMB7AvCBx91NGj/ba3kCfza0f6dVDbw7YlRf/nDrn7pQrCCyQ/w==",
-      "dev": true
+      "integrity": "sha512-Rfkk/Mp/DL7JVje3u18FxFujQlTNR2q6QfMSMB7AvCBx91NGj/ba3kCfza0f6dVDbw7YlRf/nDrn7pQrCCyQ/w=="
     },
     "esutils": {
       "version": "2.0.3",
@@ -9789,7 +9752,6 @@
       "version": "0.30.21",
       "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
       "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
-      "dev": true,
       "requires": {
         "@jridgewell/sourcemap-codec": "^1.5.5"
       }
@@ -9899,8 +9861,7 @@
     "nanoid": {
       "version": "3.3.11",
       "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.11.tgz",
-      "integrity": "sha512-N8SpfPUnUp1bK+PMYW8qSWdl9U+wwNWI4QKxOYDy9JAro3WMX7p2OeVRF9v+347pnakNevPmiHhNmZ2HbFA76w==",
-      "dev": true
+      "integrity": "sha512-N8SpfPUnUp1bK+PMYW8qSWdl9U+wwNWI4QKxOYDy9JAro3WMX7p2OeVRF9v+347pnakNevPmiHhNmZ2HbFA76w=="
     },
     "natural-compare": {
       "version": "1.4.0",
@@ -10077,8 +10038,7 @@
     "picocolors": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
-      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
-      "dev": true
+      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA=="
     },
     "picomatch": {
       "version": "2.3.1",
@@ -10105,7 +10065,6 @@
       "version": "8.5.8",
       "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.8.tgz",
       "integrity": "sha512-OW/rX8O/jXnm82Ey1k44pObPtdblfiuWnrd8X7GJ7emImCOstunGbXUpp7HdBrFQX6rJzn3sPT397Wp5aCwCHg==",
-      "dev": true,
       "requires": {
         "nanoid": "^3.3.11",
         "picocolors": "^1.1.1",
@@ -10353,8 +10312,7 @@
     "source-map-js": {
       "version": "1.2.1",
       "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
-      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
-      "dev": true
+      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA=="
     },
     "source-map-support": {
       "version": "0.5.13",
@@ -10710,7 +10668,6 @@
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/vue/-/vue-3.5.30.tgz",
       "integrity": "sha512-hTHLc6VNZyzzEH/l7PFGjpcTvUgiaPK5mdLkbjrTeWSRcEfxFrv56g/XckIYlE9ckuobsdwqd5mk2g1sBkMewg==",
-      "dev": true,
       "peer": true,
       "requires": {
         "@vue/compiler-dom": "3.5.30",
diff --git a/package.json b/package.json
index 31ddd59a..7303cd1c 100644
--- a/package.json
+++ b/package.json
@@ -37,5 +37,8 @@
     "jest-environment-jsdom": "^29.7.0",
     "vite": "^8.0.1",
     "vitest": "^4.1.0"
+  },
+  "dependencies": {
+    "vue": "^3.5.30"
   }
 }
diff --git a/vite.config.js b/vite.config.js
index cd5db6c4..f420b085 100644
--- a/vite.config.js
+++ b/vite.config.js
@@ -1,9 +1,9 @@
 import { defineConfig } from 'vite';
-// import vue from '@vitejs/plugin-vue'; // Enable in Section 06
+import vue from '@vitejs/plugin-vue';
 
 export default defineConfig({
     root: 'Sources',
-    // plugins: [vue()], // Enable in Section 06
+    plugins: [vue()],
     test: {
         globals: true,
         environment: 'jsdom',
@@ -40,9 +40,7 @@ export default defineConfig({
     },
     resolve: {
         alias: {
-            // Enable in Section 06 (Vue 3 Core):
-            // Vue 3 runtime compiler build needed for in-HTML templates
-            // 'vue': 'vue/dist/vue.esm-bundler.js',
+            'vue': 'vue/dist/vue.esm-bundler.js',
         },
     },
 });
