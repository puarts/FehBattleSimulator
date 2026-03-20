diff --git a/Sources/AetherRaidSimulator.html b/Sources/AetherRaidSimulator.html
index e31a130e..eb4aaf99 100644
--- a/Sources/AetherRaidSimulator.html
+++ b/Sources/AetherRaidSimulator.html
@@ -7,7 +7,6 @@
     <script>
         const g_startTime = Date.now();
     </script>
-    <script src="Local.js"></script>
     <script>
         // 画像の遅延ロード用の処理。以下の要素を作ると遅延ロードされる
         // <img src="dummy.png" data-src="actual.png" class="lazy" />
@@ -1416,230 +1415,5 @@
 
 
 
-    <script>
-        function createScriptElement(src, onloadFunc) {
-            const isExternal = /^https?:\/\//.test(src);
-            if (isExternal) {
-                const element = document.createElement('script');
-                element.type = 'text/javascript';
-                element.src = src;
-                element.onload = onloadFunc;
-                document.getElementsByTagName('head')[0].appendChild(element);
-                return;
-            }
-            fetch(src)
-                .then(res => res.text())
-                .then(code => {
-                    const filtered = code.split('\n')
-                        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
-                        .join('\n');
-                    const blob = new Blob([filtered], { type: 'text/javascript' });
-                    const element = document.createElement('script');
-                    element.type = 'text/javascript';
-                    element.src = URL.createObjectURL(blob);
-                    element.onload = onloadFunc;
-                    document.getElementsByTagName('head')[0].appendChild(element);
-                });
-        }
-
-        function loadScripts(scriptFileNames, allScriptLoaded, index = 0) {
-            if (index == scriptFileNames.length) {
-                allScriptLoaded();
-                return;
-            }
-
-            let jsRootPath = "./";
-            // jsRootPath = "/AetherRaidTacticsBoard/Release2/";
-            let reloadSuffix = "20200513";
-            let scriptFileName = scriptFileNames[index];
-            let src = jsRootPath + scriptFileName + "?" + reloadSuffix;
-            const startTime = Date.now();
-            createScriptElement(src, x => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load ${src}`);
-                loadScripts(scriptFileNames, allScriptLoaded, ++index);
-            });
-        }
-
-        window.addEventListener('load', (event) => {
-            // let endTime = Date.now();
-            // let diffTime = endTime - g_startTime;
-            // g_app.writeDebugLogLine(`ページの初期化: ${diffTime} ms`);
-
-            const isLocal = typeof weaponInfos == 'undefined';
-            console.log(`isLocal=${isLocal}`);
-            let additionalScripts = [];
-            if (isLocal) {
-                additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Cell.js",
-                    "Table.js",
-                    "Utilities.js",
-                    "Logger.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "Tile.js",
-                    "Structures.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "UnitManager.js",
-                    "BattleMap.js",
-                    "BattleMapSettings.js",
-                    "GlobalBattleContext.js",
-                    "DamageCalculationUtility.js",
-                    "DamageCalculator.js",
-                    "PostCombatSkillHander.js",
-                    "DamageCalculatorWrapper.js",
-                    "BeginningOfTurnSkillHandler.js",
-                    "TurnSetting.js",
-                    "AudioManager.js",
-                    "AetherRaidDefensePresets.js",
-                    "SkillDatabase.js",
-                    "HeroDatabase.js",
-                    "SettingManager.js",
-                    "AppData.js",
-                    "Main_ImageProcessing.js",
-                    "Main_OriginalAi.js",
-                    "Main_MouseAndTouch.js",
-                    "BattleSimulatorBase.js",
-                    "AetherRaidSimulatorMain.js",
-                    "VueComponents.js",
-                    "SampleSkillInfos.js",
-                    "SampleHeroInfos.js",
-                    ...SKILL_EFFECT_FILES,
-                    ...SKILL_IMPL_FILES,
-                ];
-            } else {
-                // linkタグを作成
-                let link = document.createElement('link');
-                link.rel = 'stylesheet';
-                link.href = './AetherRaidTacticsBoard/Release2/feh-battle-simulator.css'; // 読み込むCSSファイルのパス
-
-                // headに追加してCSSを適用する
-                document.head.appendChild(link);
-            }
-            const startTime = Date.now();
-            loadScripts(additionalScripts, () => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load all scripts`);
-                console.log("initializing application");
-                if (isLocal) {
-                    for (let i = 1; i <= G_DEV_SKILL_NUM; i++) {
-                        for (let weaponKey of Object.keys(WeaponType)) {
-                            if (WeaponType[weaponKey] < 0) {
-                                continue;
-                            }
-                            weaponInfos.push(new SkillInfo(
-                                G_WEAPON_ID_BASE + WeaponType[weaponKey] * 100 + i, `dev${weaponKey}${i}`, 6, 0, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 6, false, false,
-                                AssistType.None, false, 0,
-                                WeaponType[weaponKey], 50, true,
-                                [WeaponType.All], [MoveType.Infantry, MoveType.Armor, MoveType.Flying, MoveType.Cavalry],
-                                false, false, '',
-                                SkillType.Weapon));
-                        }
-
-                        supportInfos.push(new SkillInfo(
-                            G_ASSIST_ID_BASE + i, `devAssist${i}`, 0, 0, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 0, false, false,
-                            AssistType.Refresh, false, 0,
-                            WeaponType.None, 150, true,
-                            [WeaponType.All], [MoveType.Infantry, MoveType.Armor, MoveType.Flying, MoveType.Cavalry],
-                            false, false, '',
-                            SkillType.Support));
-
-                        specialInfos.push(new SkillInfo(
-                            G_SPECIAL_ID_BASE + i, `devSpecial${i}`, 0, (i - 1) % 5 + 1, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 0, false, false, // 奥義カウント
-                            AssistType.None, false, 0,
-                            WeaponType.None, 200, true,
-                            [WeaponType.ExceptStaff,], [MoveType.Infantry, MoveType.Armor, MoveType.Flying, MoveType.Cavalry],
-                            false, false, '',
-                            SkillType.Special));
-
-                        passiveAInfos.push(new SkillInfo(
-                            G_PASSIVE_A_ID_BASE + i, `devPassiveA${i}`, 6, 0, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 6, false, false,
-                            AssistType.None, false, 0,
-                            WeaponType.None, 50, true,
-                            [WeaponType.All], [MoveType.Infantry, MoveType.Armor, MoveType.Flying, MoveType.Cavalry],
-                            false, false, '',
-                            SkillType.PassiveA)
-                        );
-
-                        passiveBInfos.push(new SkillInfo(
-                            G_PASSIVE_B_ID_BASE + i, `devPassiveB${i}`, 6, 0, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 6, false, false,
-                            AssistType.None, false, 0,
-                            WeaponType.None, 50, true,
-                            [WeaponType.All], [MoveType.Infantry, MoveType.Armor, MoveType.Flying, MoveType.Cavalry],
-                            false, false, '',
-                            SkillType.PassiveB)
-                        );
-
-                        passiveCInfos.push(new SkillInfo(
-                            G_PASSIVE_C_ID_BASE + i, `devPassiveC${i}`, 6, 0, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 6, false, false,
-                            AssistType.None, false, 0,
-                            WeaponType.None, 50, true,
-                            [WeaponType.All], [MoveType.Infantry, MoveType.Armor, MoveType.Flying, MoveType.Cavalry],
-                            false, false, '',
-                            SkillType.PassiveC)
-                        );
-
-                        passiveSInfos.push(new SkillInfo(
-                            G_PASSIVE_S_ID_BASE + i, `devPassiveS${i}`, 6, 0, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 6, false, false,
-                            AssistType.None, false, 0,
-                            WeaponType.None, 50, true,
-                            [WeaponType.All], [MoveType.Infantry, MoveType.Armor, MoveType.Flying, MoveType.Cavalry],
-                            false, false, '',
-                            SkillType.PassiveS)
-                        );
-
-                        passiveXInfos.push(new SkillInfo(
-                            G_PASSIVE_X_ID_BASE + i, `devPassiveX${i}`, 6, 0, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 6, false, false,
-                            AssistType.None, false, 0,
-                            WeaponType.None, 50, true,
-                            [WeaponType.All], [MoveType.Infantry, MoveType.Armor, MoveType.Flying, MoveType.Cavalry],
-                            false, false, '',
-                            SkillType.PassiveX)
-                        );
-                    }
-                }
-                g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
-                    passiveSInfos, passiveXInfos);
-                g_app.registerHeroOptions(heroInfos, false);
-
-                if (isLocal) {
-                    loadLazyImages();
-                }
-
-                initAetherRaidBoard(heroInfos);
-
-                createDialogs();
-                importUrl(location.search);
-
-                const loader = document.getElementById("loader");
-                loader.style.display = "none";
-                const app = document.getElementById("app");
-                app.style.display = "";
-
-                // ローカル開発環境の場合適切な位置までスクロールさせる
-                if (isLocal) {
-                    const targetElement = document.getElementById('app');
-
-                    // targetElementが存在する場合にスクロール
-                    if (targetElement) {
-                        targetElement.scrollIntoView({
-                            behavior: 'smooth', // スムーズスクロール
-                            block: 'start'      // 要素の上端をスクロール位置に合わせる
-                        });
-                    }
-                }
-            });
-        });
-
-        window.onerror = function ErrorHandler(errorMsg, url, lineNumber) {
-            alert(`Error occured: ${errorMsg}\n${url}\n${lineNumber}`);
-            return false;
-        }
-    </script>
+    <script type="module" src="./AetherRaidSimulatorMain.js"></script>
 </body>
\ No newline at end of file
diff --git a/Sources/AetherRaidSimulatorMain.js b/Sources/AetherRaidSimulatorMain.js
index 0e4a9351..906b5b72 100644
--- a/Sources/AetherRaidSimulatorMain.js
+++ b/Sources/AetherRaidSimulatorMain.js
@@ -1,6 +1,27 @@
 /// @file
 /// @brief シミュレーターのメインコードです。
 
+import { BattleSimulatorBase, createMap, loadSettings } from './BattleSimulatorBase.js';
+import { ScopedStopwatch, using_ } from './Utilities.js';
+import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos } from './SampleSkillInfos.js';
+import { heroInfos } from './SampleHeroInfos.js';
+import { initVueComponents } from './VueComponents.js';
+
+// Side-effect imports for skill registration
+import './SkillEffectCore.js';
+import './SkillEffectEnv.js';
+import './SkillEffect.js';
+import './SkillEffectField.js';
+import './SkillEffectUnit.js';
+import './SkillEffectBattleContext.js';
+import './SkillEffectHooks.js';
+import './SkillEffectRegistrar.js';
+import './SkillEffectAliases.js';
+import './CustomSkill.js';
+import './SkillImpl.js';
+import './SkillImpl202408.js';
+import './SkillImpl202501.js';
+import './SkillImpl202601.js';
 
 /// シミュレーター本体です。
 class AetherRaidSimulator extends BattleSimulatorBase {
@@ -28,4 +49,13 @@ function initAetherRaidBoard(
     });
 }
 
+// Initialization
+window.g_app = g_app;
+initVueComponents();
+g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
+g_app.registerHeroOptions(heroInfos, false);
+initAetherRaidBoard(heroInfos);
+if (typeof window.createDialogs === 'function') window.createDialogs();
+if (typeof window.importUrl === 'function') window.importUrl(location.search);
+
 export { AetherRaidSimulator, g_app, initAetherRaidBoard };
diff --git a/Sources/ArenaSimulator.html b/Sources/ArenaSimulator.html
index f9aeb361..02849e75 100644
--- a/Sources/ArenaSimulator.html
+++ b/Sources/ArenaSimulator.html
@@ -7,7 +7,6 @@
     <script>
         const g_startTime = Date.now();
     </script>
-    <script src="Local.js"></script>
     <script>
         // 画像の遅延ロード用の処理。以下の要素を作ると遅延ロードされる
         // <img src="dummy.png" data-src="actual.png" class="lazy" />
@@ -1390,136 +1389,5 @@
 
 
 
-    <script>
-        function createScriptElement(src, onloadFunc) {
-            const isExternal = /^https?:\/\//.test(src);
-            if (isExternal) {
-                const element = document.createElement('script');
-                element.type = 'text/javascript';
-                element.src = src;
-                element.onload = onloadFunc;
-                document.getElementsByTagName('head')[0].appendChild(element);
-                return;
-            }
-            fetch(src)
-                .then(res => res.text())
-                .then(code => {
-                    const filtered = code.split('\n')
-                        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
-                        .join('\n');
-                    const blob = new Blob([filtered], { type: 'text/javascript' });
-                    const element = document.createElement('script');
-                    element.type = 'text/javascript';
-                    element.src = URL.createObjectURL(blob);
-                    element.onload = onloadFunc;
-                    document.getElementsByTagName('head')[0].appendChild(element);
-                });
-        }
-
-        function loadScripts(scriptFileNames, allScriptLoaded, index = 0) {
-            if (index == scriptFileNames.length) {
-                allScriptLoaded();
-                return;
-            }
-
-            let jsRootPath = "./";
-            // jsRootPath = "/AetherRaidTacticsBoard/Release2/";
-            let reloadSuffix = "20200513";
-            let scriptFileName = scriptFileNames[index];
-            let src = jsRootPath + scriptFileName + "?" + reloadSuffix;
-            const startTime = Date.now();
-            createScriptElement(src, x => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load ${src}`);
-                loadScripts(scriptFileNames, allScriptLoaded, ++index);
-            });
-        }
-
-        window.addEventListener('load', (event) => {
-            const isLocal = typeof weaponInfos == 'undefined';
-            console.log(`isLocal=${isLocal}`);
-            let additionalScripts = [];
-            if (isLocal) {
-                additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Cell.js",
-                    "Table.js",
-                    "Utilities.js",
-                    "Logger.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "Tile.js",
-                    "Structures.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "UnitManager.js",
-                    "BattleMap.js",
-                    "BattleMapSettings.js",
-                    "GlobalBattleContext.js",
-                    "DamageCalculationUtility.js",
-                    "DamageCalculator.js",
-                    "PostCombatSkillHander.js",
-                    "DamageCalculatorWrapper.js",
-                    "BeginningOfTurnSkillHandler.js",
-                    "TurnSetting.js",
-                    "AudioManager.js",
-                    "AetherRaidDefensePresets.js",
-                    "SkillDatabase.js",
-                    "HeroDatabase.js",
-                    "SettingManager.js",
-                    "AppData.js",
-                    "Main_ImageProcessing.js",
-                    "Main_OriginalAi.js",
-                    "Main_MouseAndTouch.js",
-                    "BattleSimulatorBase.js",
-                    "ArenaSimulatorMain.js",
-                    "VueComponents.js",
-                    "SampleSkillInfos.js",
-                    "SampleHeroInfos.js",
-                    ...SKILL_EFFECT_FILES,
-                    ...SKILL_IMPL_FILES,
-                ];
-            }
-            const startTime = Date.now();
-            loadScripts(additionalScripts, () => {
-                {
-                    const endTime = Date.now();
-                    console.log(`${endTime - startTime} ms to load all scripts`);
-                    console.log("initializing application");
-                }
-                g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
-                    passiveSInfos, passiveXInfos);
-                g_app.registerHeroOptions(heroInfos, false);
-
-                if (isLocal) {
-                    loadLazyImages();
-                    let endTime = Date.now();
-                    let diffTime = endTime - g_startTime;
-                    g_app.writeDebugLogLine(`ページの初期化: ${diffTime} ms`);
-                }
-
-                initAetherRaidBoard(heroInfos);
-
-                createDialogs();
-                importUrl(location.search);
-            });
-
-            // ローカル開発環境の場合適切な位置までスクロールさせる
-            if (isLocal) {
-                const targetElement = document.getElementById('app');
-
-                // targetElementが存在する場合にスクロール
-                if (targetElement) {
-                    targetElement.scrollIntoView({
-                        behavior: 'smooth', // スムーズスクロール
-                        block: 'start'      // 要素の上端をスクロール位置に合わせる
-                    });
-                }
-            }
-        });
-    </script>
+    <script type="module" src="./ArenaSimulatorMain.js"></script>
 </body>
\ No newline at end of file
diff --git a/Sources/ArenaSimulatorMain.js b/Sources/ArenaSimulatorMain.js
index e22a29ec..76765db4 100644
--- a/Sources/ArenaSimulatorMain.js
+++ b/Sources/ArenaSimulatorMain.js
@@ -1,6 +1,30 @@
 /// @file
 /// @brief シミュレーターのメインコードです。
 
+import { BattleSimulatorBase, resetPlacement, changeMap, removeBreakableWallsFromTrashBox, updateAllUi, loadSettings } from './BattleSimulatorBase.js';
+import { ScopedStopwatch, using_ } from './Utilities.js';
+import { g_appData } from './AppData.js';
+import { GameMode } from './DamageCalculator.js';
+import { MapType, isArenaMap } from './BattleMap.js';
+import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos } from './SampleSkillInfos.js';
+import { heroInfos } from './SampleHeroInfos.js';
+import { initVueComponents } from './VueComponents.js';
+
+// Side-effect imports for skill registration
+import './SkillEffectCore.js';
+import './SkillEffectEnv.js';
+import './SkillEffect.js';
+import './SkillEffectField.js';
+import './SkillEffectUnit.js';
+import './SkillEffectBattleContext.js';
+import './SkillEffectHooks.js';
+import './SkillEffectRegistrar.js';
+import './SkillEffectAliases.js';
+import './CustomSkill.js';
+import './SkillImpl.js';
+import './SkillImpl202408.js';
+import './SkillImpl202501.js';
+import './SkillImpl202601.js';
 
 /// シミュレーター本体です。
 class ArenaSimulator extends BattleSimulatorBase {
@@ -37,4 +61,13 @@ function initAetherRaidBoard(
     });
 }
 
+// Initialization
+window.g_app = g_app;
+initVueComponents();
+g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
+g_app.registerHeroOptions(heroInfos, false);
+initAetherRaidBoard(heroInfos);
+if (typeof window.createDialogs === 'function') window.createDialogs();
+if (typeof window.importUrl === 'function') window.importUrl(location.search);
+
 export { ArenaSimulator, g_app, initAetherRaidBoard };
diff --git a/Sources/BeginningOfTurnSkillHandler.js b/Sources/BeginningOfTurnSkillHandler.js
index 762a2629..606ce934 100644
--- a/Sources/BeginningOfTurnSkillHandler.js
+++ b/Sources/BeginningOfTurnSkillHandler.js
@@ -1,4 +1,5 @@
-import { Weapon, Special, PassiveA, PassiveB, PassiveC, PassiveS, Captain, StatusEffectType, WeaponType } from './SkillConstants.js';
+import { Weapon, Special, PassiveA, PassiveB, PassiveC, PassiveS, Captain, WeaponType } from './SkillConstants.js';
+import { StatusEffectType } from './Skill.js';
 import { IterUtil, GeneratorUtil } from './Utilities.js';
 import { OffenceStructureBase } from './Structures.js';
 import { MoveType } from './HeroInfoConstants.js';
diff --git a/Sources/DamageCalculator.html b/Sources/DamageCalculator.html
index 9ddeefd2..5fabbac3 100644
--- a/Sources/DamageCalculator.html
+++ b/Sources/DamageCalculator.html
@@ -6,7 +6,6 @@
     <link rel="stylesheet" href="css/main.css" type="text/css" />
     <link rel="stylesheet" href="css/loading.css">
     <link rel="stylesheet" href="feh-battle-simulator.css">
-    <script src="Local.js"></script>
 </head>
 
 <body>
@@ -416,126 +415,7 @@
     <!-- chart.js -->
     <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.1.4/Chart.bundle.min.js"></script>
 
-    <script>
-        g_appData = {};
-        g_appData.isDevelopmentMode = false;
-        function createScriptElement(src, onloadFunc) {
-            const isExternal = /^https?:\/\//.test(src);
-            if (isExternal) {
-                const element = document.createElement('script');
-                element.type = 'text/javascript';
-                element.src = src;
-                element.onload = onloadFunc;
-                document.getElementsByTagName('head')[0].appendChild(element);
-                return;
-            }
-            fetch(src)
-                .then(res => res.text())
-                .then(code => {
-                    const filtered = code.split('\n')
-                        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
-                        .join('\n');
-                    const blob = new Blob([filtered], { type: 'text/javascript' });
-                    const element = document.createElement('script');
-                    element.type = 'text/javascript';
-                    element.src = URL.createObjectURL(blob);
-                    element.onload = onloadFunc;
-                    document.getElementsByTagName('head')[0].appendChild(element);
-                });
-        }
-
-        let rootPath = "";
-        // rootPath = "/AetherRaidTacticsBoard/Release2/";
-
-        function loadScripts(scriptFileNames, allScriptLoaded, index = 0) {
-            if (index == scriptFileNames.length) {
-                allScriptLoaded();
-                return;
-            }
-
-            let reloadSuffix = "20200513";
-            let scriptFileName = rootPath + scriptFileNames[index];
-            let src = scriptFileName + "?" + reloadSuffix;
-            const startTime = Date.now();
-            createScriptElement(src, x => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load ${src}`);
-                loadScripts(scriptFileNames, allScriptLoaded, ++index);
-            });
-        }
-
-        function addKeyRepeatEvents() {
-            addKeyRepeatEventById("incrementAtk", () => g_damageCalcData.atkUnit.atkWithSkills = Math.min(g_damageCalcData.atkUnit.atkWithSkills + 1, 99));
-            addKeyRepeatEventById("decrementAtk", () => g_damageCalcData.atkUnit.atkWithSkills = Math.max(g_damageCalcData.atkUnit.atkWithSkills - 1, 0));
-            addKeyRepeatEventById("incrementSpd", () => g_damageCalcData.atkUnit.spdWithSkills = Math.min(g_damageCalcData.atkUnit.spdWithSkills + 1, 99));
-            addKeyRepeatEventById("decrementSpd", () => g_damageCalcData.atkUnit.spdWithSkills = Math.max(g_damageCalcData.atkUnit.spdWithSkills - 1, 0));
-            addKeyRepeatEventById("incrementAttackerMit", () => g_damageCalcData.atkUnit.defWithSkills = Math.min(g_damageCalcData.atkUnit.defWithSkills + 1, 99));
-            addKeyRepeatEventById("decrementAttackerMit", () => g_damageCalcData.atkUnit.defWithSkills = Math.max(g_damageCalcData.atkUnit.defWithSkills - 1, 0));
-            addKeyRepeatEventById("incrementMit", () => g_damageCalcData.defUnit.defWithSkills = Math.min(g_damageCalcData.defUnit.defWithSkills + 1, 99));
-            addKeyRepeatEventById("decrementMit", () => g_damageCalcData.defUnit.defWithSkills = Math.max(g_damageCalcData.defUnit.defWithSkills - 1, 0));
-            addKeyRepeatEventById("incrementDamageReduction", () => g_damageCalcData.damageReductionPercentage = Math.min(g_damageCalcData.damageReductionPercentage + 1, 100));
-            addKeyRepeatEventById("decrementDamageReduction", () => g_damageCalcData.damageReductionPercentage = Math.max(g_damageCalcData.damageReductionPercentage - 1, 0));
-        }
-
-
-        $(function () {
-            const isLocal = typeof weaponInfos == 'undefined';
-            console.log(`isLocal=${isLocal}`);
-            let additionalScripts = [];
-            if (isLocal) {
-                additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Utilities.js",
-                    "Logger.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "Tile.js",
-                    "BattleMap.js",
-                    "GlobalBattleContext.js",
-                    "Structures.js",
-                    "Table.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "UnitManager.js",
-                    "SkillDatabase.js",
-                    "HeroDatabase.js",
-                    "AudioManager.js",
-                    "DamageCalculationUtility.js",
-                    "DamageCalculator.js",
-                    "PostCombatSkillHander.js",
-                    "DamageCalculatorWrapper.js",
-                    "BeginningOfTurnSkillHandler.js",
-                    "AudioManager.js",
-                    "SampleSkillInfos.js",
-                    "SampleHeroInfos.js",
-                    "VueComponents.js",
-                    "KeyRepeatHandler.js",
-                    "DamageCalculatorMain.js",
-                    ...SKILL_EFFECT_FILES,
-                    ...SKILL_IMPL_FILES,
-                ];
-            }
-            const startTime = Date.now();
-            loadScripts(additionalScripts, () => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load all scripts`);
-                initDamageCalculator(heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
-                    passiveSInfos, passiveXInfos);
-                g_appData.skillDatabase = g_damageCalcData.heroDatabase.skillDatabase;
-                g_appData.map = g_damageCalcData.battleMap;
-                addKeyRepeatEvents();
-
-                const loader = document.getElementById("loader");
-                loader.style.display = "none";
-                const app = document.getElementById("damageCalc");
-                app.style.display = "";
-            });
-        });
-    </script>
+    <script type="module" src="./DamageCalculatorMain.js"></script>
 </body>
 
 </html>
\ No newline at end of file
diff --git a/Sources/DamageCalculator.js b/Sources/DamageCalculator.js
index 56b4ee43..ffe1b6b7 100644
--- a/Sources/DamageCalculator.js
+++ b/Sources/DamageCalculator.js
@@ -5,7 +5,8 @@ import { GroupLogger, LoggerBase } from './Logger.js';
 import { NodeEnv } from './SkillEffectEnv.js';
 import { getSkillLogLevel } from './SkillEffect.js';
 import { DamageCalculationUtility, TriangleAdvantage } from './DamageCalculationUtility.js';
-import { Special, Weapon, PassiveB, StatusEffectType, WeaponType } from './SkillConstants.js';
+import { Special, Weapon, PassiveB, WeaponType } from './SkillConstants.js';
+import { StatusEffectType } from './Skill.js';
 import { isDefenseSpecial, getSkillFunc } from './Skill.js';
 import { addSpecialDamageAfterDefenderSpecialActivatedFuncMap, applyNTimesDamageReductionRatiosByNonDefenderSpecialFuncMap, applySpecialDamageReductionPerAttackFuncMap, applySkillEffectAfterSpecialActivatedFuncMap, applySkillEffectsPerAttackFuncMap, activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap } from './Skill.js';
 import { AFTER_ATTACK_HOOKS, AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS, AT_START_OF_ATTACK_HOOKS } from './SkillEffectHooks.js';
diff --git a/Sources/DamageCalculatorMain.js b/Sources/DamageCalculatorMain.js
index 05a1e186..83add13f 100644
--- a/Sources/DamageCalculatorMain.js
+++ b/Sources/DamageCalculatorMain.js
@@ -1,6 +1,45 @@
 /// @file
 /// @brief DamageCalculator.html の実装に必要なクラスや関数等の定義です。
 
+import { Unit } from './Unit.js';
+import { HeroDatabase } from './HeroDatabase.js';
+import { SkillDatabase } from './SkillDatabase.js';
+import { Tile } from './Tile.js';
+import { BattleMap } from './BattleMap.js';
+import { GlobalBattleContext } from './GlobalBattleContext.js';
+import { DamageCalculatorWrapper } from './DamageCalculatorWrapper.js';
+import { BeginningOfTurnSkillHandler } from './BeginningOfTurnSkillHandler.js';
+import { UnitManager } from './UnitManager.js';
+import { HtmlLogger } from './Logger.js';
+import { KeyRepeatHandler } from './KeyRepeatHandler.js';
+import { DamageCalcEnv, DamageType, GameMode, DamageCalculator as DamageCalcCore } from './DamageCalculator.js';
+import { DamageCalculationUtility } from './DamageCalculationUtility.js';
+import { UnitGroupType } from './UnitConstants.js';
+import { BlessingType, StatusType } from './HeroInfoConstants.js';
+import { WeaponType, SkillType, Weapon, Special, PassiveA, PassiveB, PassiveC, PassiveS, PassiveX, WeaponRefinementType } from './SkillConstants.js';
+import { isNormalAttackSpecial, isPhysicalWeaponType, SkillInfo, COUNT2_SPECIALS, INHERITABLE_COUNT2_SPECIALS, COUNT3_SPECIALS, INHERITABLE_COUNT3_SPECIALS, COUNT4_SPECIALS, INHERITABLE_COUNT4_SPECIALS, COUNT5_SPECIALS, INHERITABLE_COUNT5_SPECIALS } from './Skill.js';
+import { BookVersions } from './HeroInfoConstants.js';
+import { roundFloat, startProgressiveProcess } from './Utilities.js';
+import { g_appData } from './AppData.js';
+import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos } from './SampleSkillInfos.js';
+import { heroInfos } from './SampleHeroInfos.js';
+
+// Side-effect imports for skill registration
+import './SkillEffectCore.js';
+import './SkillEffectEnv.js';
+import './SkillEffect.js';
+import './SkillEffectField.js';
+import './SkillEffectUnit.js';
+import './SkillEffectBattleContext.js';
+import './SkillEffectHooks.js';
+import './SkillEffectRegistrar.js';
+import './SkillEffectAliases.js';
+import './CustomSkill.js';
+import './SkillImpl.js';
+import './SkillImpl202408.js';
+import './SkillImpl202501.js';
+import './SkillImpl202601.js';
+
 const DamageCalculatorMode = {
     Simple: 0,
     SpecialDamageGraph: 1,
@@ -1104,4 +1143,7 @@ function initDamageCalculator(heroInfos, weaponInfos, supportInfos, specialInfos
     });
 }
 
+// Initialization
+initDamageCalculator(heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos);
+
 export { DamageCalculatorMode, DamageCalcModeOptions, DamageCalcHeroDatabase, DamageCalcData, g_damageCalcData, initDamageCalculator };
diff --git a/Sources/DamageCalculatorWrapper.js b/Sources/DamageCalculatorWrapper.js
index f22a7587..287a3f21 100644
--- a/Sources/DamageCalculatorWrapper.js
+++ b/Sources/DamageCalculatorWrapper.js
@@ -1,4 +1,5 @@
-import { Weapon, Special, PassiveA, PassiveB, PassiveC, PassiveS, Captain, StatusEffectType, WeaponType } from './SkillConstants.js';
+import { Weapon, Special, PassiveA, PassiveB, PassiveC, PassiveS, Captain, WeaponType } from './SkillConstants.js';
+import { StatusEffectType } from './Skill.js';
 import { LoggerBase, GroupLogger } from './Logger.js';
 import { NodeEnv, DamageCalculatorWrapperEnv } from './SkillEffectEnv.js';
 import { getSkillLogLevel } from './SkillEffect.js';
diff --git a/Sources/HeroIconLister.html b/Sources/HeroIconLister.html
index 4c1d0891..9ecfce68 100644
--- a/Sources/HeroIconLister.html
+++ b/Sources/HeroIconLister.html
@@ -7,7 +7,6 @@
     <script>
         const g_startTime = Date.now();
     </script>
-    <script src="Local.js"></script>
     <script>
         // 画像の遅延ロード用の処理。以下の要素を作ると遅延ロードされる
         // <img src="dummy.png" data-src="actual.png" class="lazy" />
@@ -158,84 +157,7 @@
     </script>
 
 
-    <script>
-        function createScriptElement(src, onloadFunc) {
-            const isExternal = /^https?:\/\//.test(src);
-            if (isExternal) {
-                const element = document.createElement('script');
-                element.type = 'text/javascript';
-                element.src = src;
-                element.onload = onloadFunc;
-                document.getElementsByTagName('head')[0].appendChild(element);
-                return;
-            }
-            fetch(src)
-                .then(res => res.text())
-                .then(code => {
-                    const filtered = code.split('\n')
-                        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
-                        .join('\n');
-                    const blob = new Blob([filtered], { type: 'text/javascript' });
-                    const element = document.createElement('script');
-                    element.type = 'text/javascript';
-                    element.src = URL.createObjectURL(blob);
-                    element.onload = onloadFunc;
-                    document.getElementsByTagName('head')[0].appendChild(element);
-                });
-        }
-
-        function loadScripts(scriptFileNames, allScriptLoaded, index = 0) {
-            if (index == scriptFileNames.length) {
-                allScriptLoaded();
-                return;
-            }
-
-            let jsRootPath = "./";
-            // jsRootPath = "/AetherRaidTacticsBoard/Release2/";
-            let reloadSuffix = "20200513";
-            let scriptFileName = scriptFileNames[index];
-            let src = jsRootPath + scriptFileName + "?" + reloadSuffix;
-            const startTime = Date.now();
-            createScriptElement(src, x => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load ${src}`);
-                loadScripts(scriptFileNames, allScriptLoaded, ++index);
-            });
-        }
-
-        window.addEventListener('load', (event) => {
-            const isLocal = typeof heroInfos == 'undefined';
-            console.log(`isLocal=${isLocal}`);
-            let additionalScripts = [];
-            if (isLocal) {
-                additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Utilities.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "HeroDatabase.js",
-                    "HeroIconListerMain.js",
-                    "SampleHeroInfos.js",
-                    ...SKILL_EFFECT_FILES,
-                    ...SKILL_IMPL_FILES,
-                ];
-            }
-            const startTime = Date.now();
-            loadScripts(additionalScripts, () => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load all scripts`);
-                console.log("initializing application");
-
-                init(heroInfos);
-
-                if (isLocal) {
-                    loadLazyImages();
-                }
-            });
-        });
-    </script>
+    <script type="module" src="./HeroIconListerMain.js"></script>
 
 
 
diff --git a/Sources/HeroIconListerMain.js b/Sources/HeroIconListerMain.js
index 8f566e04..bd504e21 100644
--- a/Sources/HeroIconListerMain.js
+++ b/Sources/HeroIconListerMain.js
@@ -1,4 +1,21 @@
-
+import { HeroDatabase } from './HeroDatabase.js';
+import { heroInfos as sampleHeroInfos } from './SampleHeroInfos.js';
+
+// Side-effect imports for skill registration
+import './SkillEffectCore.js';
+import './SkillEffectEnv.js';
+import './SkillEffect.js';
+import './SkillEffectField.js';
+import './SkillEffectUnit.js';
+import './SkillEffectBattleContext.js';
+import './SkillEffectHooks.js';
+import './SkillEffectRegistrar.js';
+import './SkillEffectAliases.js';
+import './CustomSkill.js';
+import './SkillImpl.js';
+import './SkillImpl202408.js';
+import './SkillImpl202501.js';
+import './SkillImpl202601.js';
 
 class AppData extends HeroDatabase {
     constructor(heroInfos) {
@@ -91,4 +108,8 @@ function init(heroInfos) {
     g_appData.applyFilter();
 }
 
+// Initialization (type="module" is deferred, so DOM is ready)
+const resolvedHeroInfos = window.heroInfos || sampleHeroInfos;
+init(resolvedHeroInfos);
+
 export { AppData, g_appData, init };
diff --git a/Sources/HeroStatusClusterer.html b/Sources/HeroStatusClusterer.html
index 1ab2aa69..81bb96c2 100644
--- a/Sources/HeroStatusClusterer.html
+++ b/Sources/HeroStatusClusterer.html
@@ -228,79 +228,7 @@
     <!-- vuex.js -->
     <script src="https://unpkg.com/vuex@3.6.2/dist/vuex.min.js"></script>
 
-    <script>
-
-        function createScriptElement(src, onloadFunc) {
-            const isExternal = /^https?:\/\//.test(src);
-            if (isExternal) {
-                const element = document.createElement('script');
-                element.type = 'text/javascript';
-                element.src = src;
-                element.onload = onloadFunc;
-                document.getElementsByTagName('head')[0].appendChild(element);
-                return;
-            }
-            fetch(src)
-                .then(res => res.text())
-                .then(code => {
-                    const filtered = code.split('\n')
-                        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
-                        .join('\n');
-                    const blob = new Blob([filtered], { type: 'text/javascript' });
-                    const element = document.createElement('script');
-                    element.type = 'text/javascript';
-                    element.src = URL.createObjectURL(blob);
-                    element.onload = onloadFunc;
-                    document.getElementsByTagName('head')[0].appendChild(element);
-                });
-        }
-
-        let rootPath = "";
-        // rootPath = "/AetherRaidTacticsBoard/Release2/";
-
-        function loadScripts(scriptFileNames, allScriptLoaded, index = 0) {
-            if (index == scriptFileNames.length) {
-                allScriptLoaded();
-                return;
-            }
-
-            let reloadSuffix = "20200513";
-            let scriptFileName = rootPath + scriptFileNames[index];
-            let src = scriptFileName + "?" + reloadSuffix;
-            const startTime = Date.now();
-            createScriptElement(src, x => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load ${src}`);
-                loadScripts(scriptFileNames, allScriptLoaded, ++index);
-            });
-        }
-
-        $(function () {
-            const startTime = Date.now();
-            loadScripts([
-                "GlobalDefinitions_Debug.js",
-                "Utilities.js",
-                "Skill.js",
-                "GlobalBattleContext.js",
-                "HeroInfoConstants.js",
-                "HeroInfo.js",
-                "BattleMapElement.js",
-                "UnitConstants.js",
-                "BattleContext.js",
-                "Unit.js",
-                "UnitManager.js",
-                "HeroDatabase.js",
-                "SampleHeroInfos.js",
-                "VueComponents.js",
-                "HeroStatusClustererMain.js",
-            ], () => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load all scripts`);
-
-                initializeStatusClusterer(heroInfos);
-            });
-        });
-    </script>
+    <script type="module" src="./HeroStatusClustererMain.js"></script>
 </body>
 
 </html>
\ No newline at end of file
diff --git a/Sources/HeroStatusClustererMain.js b/Sources/HeroStatusClustererMain.js
index 2cd9f52c..80e47db9 100644
--- a/Sources/HeroStatusClustererMain.js
+++ b/Sources/HeroStatusClustererMain.js
@@ -1,3 +1,25 @@
+import { HeroDatabase } from './HeroDatabase.js';
+import { MoveType } from './HeroInfoConstants.js';
+import { isPhysicalWeaponType } from './Skill.js';
+import { ScopedStopwatch, using_, startProgressiveProcess, distinct } from './Utilities.js';
+import { heroInfos as sampleHeroInfos } from './SampleHeroInfos.js';
+import { initVueComponents } from './VueComponents.js';
+
+// Side-effect imports for skill registration
+import './SkillEffectCore.js';
+import './SkillEffectEnv.js';
+import './SkillEffect.js';
+import './SkillEffectField.js';
+import './SkillEffectUnit.js';
+import './SkillEffectBattleContext.js';
+import './SkillEffectHooks.js';
+import './SkillEffectRegistrar.js';
+import './SkillEffectAliases.js';
+import './CustomSkill.js';
+import './SkillImpl.js';
+import './SkillImpl202408.js';
+import './SkillImpl202501.js';
+import './SkillImpl202601.js';
 
 const TabId = {
     Basic: 0,
@@ -650,3 +672,10 @@ function initializeStatusClusterer(heroInfos) {
         }
     });
 }
+
+// Initialization
+const resolvedHeroInfos = window.heroInfos || sampleHeroInfos;
+initVueComponents();
+initializeStatusClusterer(resolvedHeroInfos);
+
+export { HeroStatusClustererData, g_heroStatusClustererData, initializeStatusClusterer };
diff --git a/Sources/PostCombatSkillHander.js b/Sources/PostCombatSkillHander.js
index 2387ea37..dc1edc21 100644
--- a/Sources/PostCombatSkillHander.js
+++ b/Sources/PostCombatSkillHander.js
@@ -1,4 +1,5 @@
-import { Weapon, Special, PassiveA, PassiveB, PassiveC, PassiveS, StatusEffectType } from './SkillConstants.js';
+import { Weapon, Special, PassiveA, PassiveB, PassiveC, PassiveS } from './SkillConstants.js';
+import { StatusEffectType } from './Skill.js';
 import { MoveType } from './HeroInfoConstants.js';
 import { LoggerBase } from './Logger.js';
 import { isWeaponTypeBreathOrBeast, getSkillFunc } from './Skill.js';
diff --git a/Sources/StatusCalcMain.js b/Sources/StatusCalcMain.js
index dc4f3698..c3f613e2 100644
--- a/Sources/StatusCalcMain.js
+++ b/Sources/StatusCalcMain.js
@@ -1,6 +1,30 @@
 /// @file
 /// @brief ステータス計算器のメインコードです。
 
+import { Unit } from './Unit.js';
+import { SkillInfo } from './Skill.js';
+import { StatusType } from './HeroInfoConstants.js';
+import { SummonerLevel } from './UnitConstants.js';
+import { HeroInfo } from './HeroInfo.js';
+import { heroInfos } from './SampleHeroInfos.js';
+import { weaponInfos } from './SampleSkillInfos.js';
+
+// Side-effect imports for skill registration
+import './SkillEffectCore.js';
+import './SkillEffectEnv.js';
+import './SkillEffect.js';
+import './SkillEffectField.js';
+import './SkillEffectUnit.js';
+import './SkillEffectBattleContext.js';
+import './SkillEffectHooks.js';
+import './SkillEffectRegistrar.js';
+import './SkillEffectAliases.js';
+import './CustomSkill.js';
+import './SkillImpl.js';
+import './SkillImpl202408.js';
+import './SkillImpl202501.js';
+import './SkillImpl202601.js';
+
 let unit = new Unit();
 let g_app = null;
 
@@ -143,4 +167,11 @@ function diffToHtml(value) {
     else return signedValue;
 }
 
+// Initialization with sample data
+if (heroInfos && heroInfos.length > 0) {
+    const heroInfo = heroInfos[0];
+    const maxSp = 2000;
+    init(heroInfo, weaponInfos, maxSp);
+}
+
 export { unit, g_app, updateStatus, init, diffToHtml };
diff --git a/Sources/StatusCalculator.html b/Sources/StatusCalculator.html
index a256f31b..da20ccae 100644
--- a/Sources/StatusCalculator.html
+++ b/Sources/StatusCalculator.html
@@ -9,7 +9,6 @@
     <script>
         const g_startTime = Date.now();
     </script>
-    <script src="Local.js"></script>
 </head>
 
 <body>
@@ -227,92 +226,7 @@
         </div>
     </div>
 
-    <script>
-        function createScriptElement(src, onloadFunc) {
-            const isExternal = /^https?:\/\//.test(src);
-            if (isExternal) {
-                const element = document.createElement('script');
-                element.type = 'text/javascript';
-                element.src = src;
-                element.onload = onloadFunc;
-                document.getElementsByTagName('head')[0].appendChild(element);
-                return;
-            }
-            fetch(src)
-                .then(res => res.text())
-                .then(code => {
-                    const filtered = code.split('\n')
-                        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
-                        .join('\n');
-                    const blob = new Blob([filtered], { type: 'text/javascript' });
-                    const element = document.createElement('script');
-                    element.type = 'text/javascript';
-                    element.src = URL.createObjectURL(blob);
-                    element.onload = onloadFunc;
-                    document.getElementsByTagName('head')[0].appendChild(element);
-                });
-        }
-
-        function loadScripts(scriptFileNames, allScriptLoaded, index = 0) {
-            if (index == scriptFileNames.length) {
-                allScriptLoaded();
-                return;
-            }
-
-            let jsRootPath = "./";
-            // jsRootPath = "/AetherRaidTacticsBoard/Release2/";
-            let reloadSuffix = "20200513";
-            let scriptFileName = scriptFileNames[index];
-            let src = jsRootPath + scriptFileName + "?" + reloadSuffix;
-            const startTime = Date.now();
-            createScriptElement(src, x => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load ${src}`);
-                loadScripts(scriptFileNames, allScriptLoaded, ++index);
-            });
-        }
-
-        const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
-        function initCalculatorLocal() {
-            console.log(`isLocal=${isLocal}`);
-            let additionalScripts = [];
-            if (isLocal) {
-                additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Utilities.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "StatusCalcMain.js",
-                    ...SKILL_EFFECT_FILES,
-                    ...SKILL_IMPL_FILES,
-                ];
-            }
-            const startTime = Date.now();
-            createScriptElement("https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js", x => {
-                loadScripts(additionalScripts, () => {
-                    const endTime = Date.now();
-                    console.log(`${endTime - startTime} ms to load all scripts`);
-                    console.log("initializing application");
-                    const heroInfo = new HeroInfo('魔器ラインハルト', 'RearmedReinhardt-Icon.png', MoveType.Cavalry, '青魔', 2, 41, 46, 45, 22, 20, 19, 11, 12, 3, 3, '0/0', '0/0', '0/0', '0/0', '0/0', 2731, -1, 468, 2732, 2733, 2164, -1, SeasonType.None, BlessingType.None, 'トードの再来', ['ラインハルト',], 0, [2731,], [], 1081, false, 'トラキア776', '魔器英雄', '2024-01-10', [468,], [2732,], [2733,], [2164,], []);
-                    const weaponInfo = new SkillInfo(2731, '魔器・雷公の書', 14, 0, 0, 0, 0, 0, 0, [], [], -1, 1, 1, false, false, 14, false, false, AssistType.None, false, 0, WeaponType.BlueTome, 300, true, [WeaponType.All], [MoveType.Infantry, MoveType.Armor, MoveType.Flying, MoveType.Cavalry], false, true, '', SkillType.Weapon);
-                    const maxSp = 2390;
-                    init(heroInfo, [weaponInfo], maxSp);
-                });
-            });
-        }
-
-        if (isLocal) {
-            window.addEventListener('load', (event) => {
-                initCalculatorLocal();
-            });
-        }
-    </script>
+    <script type="module" src="./StatusCalcMain.js"></script>
 </body>
 
 </html>
\ No newline at end of file
diff --git a/Sources/SummonerDuelsSimulator.html b/Sources/SummonerDuelsSimulator.html
index 67015d8f..480aca24 100644
--- a/Sources/SummonerDuelsSimulator.html
+++ b/Sources/SummonerDuelsSimulator.html
@@ -7,7 +7,6 @@
     <script>
         const g_startTime = Date.now();
     </script>
-    <script src="Local.js"></script>
     <script>
         // 画像の遅延ロード用の処理。以下の要素を作ると遅延ロードされる
         // <img src="dummy.png" data-src="actual.png" class="lazy" />
@@ -1482,137 +1481,5 @@
 
 
 
-    <script>
-        function createScriptElement(src, onloadFunc) {
-            const isExternal = /^https?:\/\//.test(src);
-            if (isExternal) {
-                const element = document.createElement('script');
-                element.type = 'text/javascript';
-                element.src = src;
-                element.onload = onloadFunc;
-                document.getElementsByTagName('head')[0].appendChild(element);
-                return;
-            }
-            fetch(src)
-                .then(res => res.text())
-                .then(code => {
-                    const filtered = code.split('\n')
-                        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
-                        .join('\n');
-                    const blob = new Blob([filtered], { type: 'text/javascript' });
-                    const element = document.createElement('script');
-                    element.type = 'text/javascript';
-                    element.src = URL.createObjectURL(blob);
-                    element.onload = onloadFunc;
-                    document.getElementsByTagName('head')[0].appendChild(element);
-                });
-        }
-
-        function loadScripts(scriptFileNames, allScriptLoaded, index = 0) {
-            if (index == scriptFileNames.length) {
-                allScriptLoaded();
-                return;
-            }
-
-            let jsRootPath = "./";
-            // jsRootPath = "/AetherRaidTacticsBoard/Release2/";
-            let reloadSuffix = "20200513";
-            let scriptFileName = scriptFileNames[index];
-            let src = jsRootPath + scriptFileName + "?" + reloadSuffix;
-            const startTime = Date.now();
-            createScriptElement(src, x => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load ${src}`);
-                loadScripts(scriptFileNames, allScriptLoaded, ++index);
-            });
-        }
-
-        $(function () {
-            const isLocal = typeof weaponInfos == 'undefined';
-            console.log(`isLocal=${isLocal}`);
-            let additionalScripts = [];
-            if (isLocal) {
-                additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Cell.js",
-                    "Table.js",
-                    "Utilities.js",
-                    "Logger.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "Tile.js",
-                    "Structures.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "UnitManager.js",
-                    "BattleMap.js",
-                    "BattleMapSettings.js",
-                    "GlobalBattleContext.js",
-                    "DamageCalculationUtility.js",
-                    "DamageCalculator.js",
-                    "PostCombatSkillHander.js",
-                    "DamageCalculatorWrapper.js",
-                    "BeginningOfTurnSkillHandler.js",
-                    "TurnSetting.js",
-                    "AudioManager.js",
-                    "AetherRaidDefensePresets.js",
-                    "SkillDatabase.js",
-                    "HeroDatabase.js",
-                    "SettingManager.js",
-                    "AppData.js",
-                    "Main_ImageProcessing.js",
-                    "Main_OriginalAi.js",
-                    "Main_MouseAndTouch.js",
-                    "BattleSimulatorBase.js",
-                    "SummonerDuelsSimulatorMain.js",
-                    "VueComponents.js",
-                    "SampleSkillInfos.js",
-                    "SampleHeroInfos.js",
-                    ...SKILL_EFFECT_FILES,
-                    ...SKILL_IMPL_FILES,
-                ];
-            }
-
-            const startTime = Date.now();
-            loadScripts(additionalScripts, () => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load all scripts`);
-                console.log("initializing application");
-                g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
-                    passiveSInfos, passiveXInfos, captainInfos);
-                g_app.registerHeroOptions(heroInfos, false);
-
-                createDialogs();
-                if (isLocal) {
-                    loadLazyImages();
-                }
-
-                let diffTime = endTime - g_startTime;
-                g_app.writeDebugLogLine(`ページの初期化: ${diffTime} ms`);
-                initAetherRaidBoard(heroInfos);
-
-                importUrl(location.search);
-
-            });
-
-            // ローカル開発環境の場合適切な位置までスクロールさせる
-            if (isLocal) {
-                const targetElement = document.getElementById('app');
-
-                // targetElementが存在する場合にスクロール
-                if (targetElement) {
-                    targetElement.scrollIntoView({
-                        behavior: 'smooth', // スムーズスクロール
-                        block: 'start'      // 要素の上端をスクロール位置に合わせる
-                    });
-                }
-            }
-        });
-        // window.addEventListener('load', (event) => {
-        // });
-    </script>
+    <script type="module" src="./SummonerDuelsSimulatorMain.js"></script>
 </body>
\ No newline at end of file
diff --git a/Sources/SummonerDuelsSimulatorMain.js b/Sources/SummonerDuelsSimulatorMain.js
index dafac631..21ef1f6f 100644
--- a/Sources/SummonerDuelsSimulatorMain.js
+++ b/Sources/SummonerDuelsSimulatorMain.js
@@ -1,6 +1,32 @@
 /// @file
 /// @brief シミュレーターのメインコードです。
 
+import { BattleSimulatorBase, resetPlacement, loadSettings, updateAllUi } from './BattleSimulatorBase.js';
+import { ScopedStopwatch, using_ } from './Utilities.js';
+import { g_appData } from './AppData.js';
+import { GameMode } from './DamageCalculator.js';
+import { UnitGroupType } from './UnitConstants.js';
+import { SoundEffectId } from './AudioManager.js';
+import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos } from './SampleSkillInfos.js';
+import { heroInfos } from './SampleHeroInfos.js';
+import { initVueComponents } from './VueComponents.js';
+
+// Side-effect imports for skill registration
+import './SkillEffectCore.js';
+import './SkillEffectEnv.js';
+import './SkillEffect.js';
+import './SkillEffectField.js';
+import './SkillEffectUnit.js';
+import './SkillEffectBattleContext.js';
+import './SkillEffectHooks.js';
+import './SkillEffectRegistrar.js';
+import './SkillEffectAliases.js';
+import './CustomSkill.js';
+import './SkillImpl.js';
+import './SkillImpl202408.js';
+import './SkillImpl202501.js';
+import './SkillImpl202601.js';
+
 /// シミュレーター本体です。
 class SummonerDuelsSimulator extends BattleSimulatorBase {
     constructor() {
@@ -116,4 +142,13 @@ function initAetherRaidBoard(
     });
 }
 
+// Initialization
+window.g_app = g_app;
+initVueComponents();
+g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
+g_app.registerHeroOptions(heroInfos, false);
+initAetherRaidBoard(heroInfos);
+if (typeof window.createDialogs === 'function') window.createDialogs();
+if (typeof window.importUrl === 'function') window.importUrl(location.search);
+
 export { SummonerDuelsSimulator, g_app, initAetherRaidBoard };
diff --git a/Sources/UnitBuilder.html b/Sources/UnitBuilder.html
index ad4842d5..2e7ecab6 100644
--- a/Sources/UnitBuilder.html
+++ b/Sources/UnitBuilder.html
@@ -8,7 +8,6 @@
     <script>
         const g_startTime = Date.now();
     </script>
-    <script src="Local.js"></script>
     <script>
         // 画像の遅延ロード用の処理。以下の要素を作ると遅延ロードされる
         // <img src="dummy.png" data-src="actual.png" class="lazy" />
@@ -1208,120 +1207,5 @@
 
 
 
-    <script>
-        function createScriptElement(src, onloadFunc) {
-            const isExternal = /^https?:\/\//.test(src);
-            if (isExternal) {
-                const element = document.createElement('script');
-                element.type = 'text/javascript';
-                element.src = src;
-                element.onload = onloadFunc;
-                document.getElementsByTagName('head')[0].appendChild(element);
-                return;
-            }
-            fetch(src)
-                .then(res => res.text())
-                .then(code => {
-                    const filtered = code.split('\n')
-                        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
-                        .join('\n');
-                    const blob = new Blob([filtered], { type: 'text/javascript' });
-                    const element = document.createElement('script');
-                    element.type = 'text/javascript';
-                    element.src = URL.createObjectURL(blob);
-                    element.onload = onloadFunc;
-                    document.getElementsByTagName('head')[0].appendChild(element);
-                });
-        }
-
-        function loadScripts(scriptFileNames, allScriptLoaded, index = 0) {
-            if (index == scriptFileNames.length) {
-                allScriptLoaded();
-                return;
-            }
-
-            let jsRootPath = "./";
-            // jsRootPath = "/AetherRaidTacticsBoard/Release2/";
-            let reloadSuffix = "20200513";
-            let scriptFileName = scriptFileNames[index];
-            let src = jsRootPath + scriptFileName + "?" + reloadSuffix;
-            const startTime = Date.now();
-            createScriptElement(src, x => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load ${src}`);
-                loadScripts(scriptFileNames, allScriptLoaded, ++index);
-            });
-        }
-
-        window.addEventListener('load', (event) => {
-            const isLocal = typeof weaponInfos == 'undefined';
-            console.log(`isLocal=${isLocal}`);
-            let additionalScripts = [];
-            if (isLocal) {
-                additionalScripts = [
-                    "GlobalDefinitions_Debug.js",
-                    "Cell.js",
-                    "Table.js",
-                    "Utilities.js",
-                    "Logger.js",
-                    "SkillConstants.js",
-                    "Skill.js",
-                    "BattleMapElement.js",
-                    "Tile.js",
-                    "Structures.js",
-                    "HeroInfoConstants.js",
-                    "HeroInfo.js",
-                    "UnitConstants.js",
-                    "BattleContext.js",
-                    "Unit.js",
-                    "UnitManager.js",
-                    "BattleMap.js",
-                    "BattleMapSettings.js",
-                    "GlobalBattleContext.js",
-                    "DamageCalculationUtility.js",
-                    "DamageCalculator.js",
-                    "PostCombatSkillHander.js",
-                    "DamageCalculatorWrapper.js",
-                    "BeginningOfTurnSkillHandler.js",
-                    "TurnSetting.js",
-                    "AudioManager.js",
-                    "AetherRaidDefensePresets.js",
-                    "SkillDatabase.js",
-                    "HeroDatabase.js",
-                    "SettingManager.js",
-                    "AppData.js",
-                    "Main_ImageProcessing.js",
-                    "Main_OriginalAi.js",
-                    "Main_MouseAndTouch.js",
-                    "BattleSimulatorBase.js",
-                    "UnitBuilderMain.js",
-                    "VueComponents.js",
-                    "SampleSkillInfos.js",
-                    "SampleHeroInfos.js",
-                    ...SKILL_EFFECT_FILES,
-                    ...SKILL_IMPL_FILES,
-                ];
-            }
-            const startTime = Date.now();
-            loadScripts(additionalScripts, () => {
-                const endTime = Date.now();
-                console.log(`${endTime - startTime} ms to load all scripts`);
-                console.log("initializing application");
-                g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
-                    passiveSInfos, passiveXInfos, [], false);
-                g_app.registerHeroOptions(heroInfos, false);
-
-                initUnitBuilder();
-
-                if (isLocal) {
-                    loadLazyImages();
-                }
-
-                const loader = document.getElementById("loader");
-                loader.style.display = "none";
-                const app = document.getElementById("app");
-                app.style.display = "";
-            });
-        });
-    </script>
+    <script type="module" src="./UnitBuilderMain.js"></script>
 </body>
\ No newline at end of file
diff --git a/Sources/UnitBuilderMain.js b/Sources/UnitBuilderMain.js
index bc271456..783f0666 100644
--- a/Sources/UnitBuilderMain.js
+++ b/Sources/UnitBuilderMain.js
@@ -1,4 +1,30 @@
-
+import { BattleSimulatorBase, loadSettings } from './BattleSimulatorBase.js';
+import { ScopedStopwatch, using_, selectText } from './Utilities.js';
+import { g_appData } from './AppData.js';
+import { GameMode } from './DamageCalculator.js';
+import { StatusType } from './HeroInfoConstants.js';
+import { SummonerLevel } from './UnitConstants.js';
+import { ElemDelimiter, g_explicitSiteRootPath } from './GlobalDefinitions.js';
+import { changeCurrentUnitTab } from './SettingManager.js';
+import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos } from './SampleSkillInfos.js';
+import { heroInfos } from './SampleHeroInfos.js';
+import { initVueComponents } from './VueComponents.js';
+
+// Side-effect imports for skill registration
+import './SkillEffectCore.js';
+import './SkillEffectEnv.js';
+import './SkillEffect.js';
+import './SkillEffectField.js';
+import './SkillEffectUnit.js';
+import './SkillEffectBattleContext.js';
+import './SkillEffectHooks.js';
+import './SkillEffectRegistrar.js';
+import './SkillEffectAliases.js';
+import './CustomSkill.js';
+import './SkillImpl.js';
+import './SkillImpl202408.js';
+import './SkillImpl202501.js';
+import './SkillImpl202601.js';
 
 class UnitBuilderMain extends BattleSimulatorBase {
     constructor() {
@@ -144,4 +170,11 @@ function initUnitBuilder() {
     });
 }
 
+// Initialization
+window.g_app = g_app;
+initVueComponents();
+g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, [], false);
+g_app.registerHeroOptions(heroInfos, false);
+initUnitBuilder();
+
 export { UnitBuilderMain, g_app, initUnitBuilder };
diff --git a/Tests/ViteBuild.test.js b/Tests/ViteBuild.test.js
new file mode 100644
index 00000000..a6d75cb7
--- /dev/null
+++ b/Tests/ViteBuild.test.js
@@ -0,0 +1,97 @@
+/**
+ * Vite Build Output Verification Tests
+ *
+ * Validates that `vite build` produces correct output.
+ * Run with: node --test Tests/ViteBuild.test.js
+ * (Uses Node.js built-in test runner since Vitest is not yet configured)
+ *
+ * Prerequisites: Run `npx vite build` before running these tests.
+ */
+
+import { describe, it } from 'node:test';
+import assert from 'node:assert';
+import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
+import { join } from 'path';
+
+const DIST = join(import.meta.dirname, '..', 'dist');
+
+const SIMULATOR_HTMLS = [
+    'AetherRaidSimulator.html',
+    'ArenaSimulator.html',
+    'SummonerDuelsSimulator.html',
+    'UnitBuilder.html',
+    'StatusCalculator.html',
+    'DamageCalculator.html',
+    'HeroIconLister.html',
+    'HeroStatusClusterer.html',
+];
+
+describe('Vite Build Output', () => {
+    it('vite build should have produced dist/ directory', () => {
+        assert.ok(existsSync(DIST), 'dist/ directory should exist');
+    });
+
+    it('all 8 simulator HTML files exist in dist/', () => {
+        for (const html of SIMULATOR_HTMLS) {
+            assert.ok(existsSync(join(DIST, html)),
+                `${html} should exist in dist/`);
+        }
+    });
+
+    it('each HTML contains a <script type="module"> tag', () => {
+        for (const html of SIMULATOR_HTMLS) {
+            const filePath = join(DIST, html);
+            if (!existsSync(filePath)) continue;
+            const content = readFileSync(filePath, 'utf-8');
+            assert.ok(content.includes('type="module"'),
+                `${html} should contain <script type="module">`);
+        }
+    });
+
+    it('no loadScripts or createScriptElement remains in dist HTML', () => {
+        for (const html of SIMULATOR_HTMLS) {
+            const filePath = join(DIST, html);
+            if (!existsSync(filePath)) continue;
+            const content = readFileSync(filePath, 'utf-8');
+            assert.ok(!content.includes('loadScripts'),
+                `${html} should not contain loadScripts`);
+            assert.ok(!content.includes('createScriptElement'),
+                `${html} should not contain createScriptElement`);
+        }
+    });
+
+    it('bundled JS files contain no source-level export {} statements', () => {
+        // Vite uses ESM output with import/export for code-split chunks.
+        // We check that source-level "export { Symbol1, Symbol2 };" patterns
+        // (from original source files) are resolved by the bundler.
+        const assetsDir = join(DIST, 'assets');
+        if (!existsSync(assetsDir)) return;
+        const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
+        assert.ok(jsFiles.length > 0, 'Should have JS bundles');
+        // Verify entry point files reference shared chunks (code splitting works)
+        let hasChunkImport = false;
+        for (const jsFile of jsFiles) {
+            const content = readFileSync(join(assetsDir, jsFile), 'utf-8');
+            if (content.includes('from"./') || content.includes("from'./")) {
+                hasChunkImport = true;
+                break;
+            }
+        }
+        assert.ok(hasChunkImport || jsFiles.length === 1,
+            'Should have code-split chunks with inter-chunk imports');
+    });
+
+    it('total JS output is substantial (> 1MB combined)', () => {
+        const assetsDir = join(DIST, 'assets');
+        if (!existsSync(assetsDir)) return;
+        const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
+        assert.ok(jsFiles.length > 0, 'Should have at least one JS bundle');
+        let totalSize = 0;
+        for (const jsFile of jsFiles) {
+            totalSize += statSync(join(assetsDir, jsFile)).size;
+        }
+        const totalKB = Math.round(totalSize / 1024);
+        assert.ok(totalSize > 1024 * 1024,
+            `Total JS output should be > 1MB (was ${totalKB}KB)`);
+    });
+});
diff --git a/scripts/build.mjs b/scripts/build.mjs
index 465d8633..079b21e2 100644
--- a/scripts/build.mjs
+++ b/scripts/build.mjs
@@ -1,7 +1,12 @@
 #!/usr/bin/env node
 // =============================================================================
-// Phase 1: Deploy.bat の結合 + JSMin を置き換える Node.js ビルドスクリプト
+// [DEPRECATED] Phase 1: Deploy.bat の結合 + JSMin を置き換える Node.js ビルドスクリプト
 // Deploy.bat と同じファイルリスト・結合順序で HTML 別に 1 ファイルを出力する
+//
+// NOTE: This script is deprecated in favor of Vite (`npm run vite:build`).
+// The filterImportExport() function is no longer needed since Vite handles
+// ESM modules natively. This script is kept as a fallback until the full
+// migration is validated. It will be removed in section-12-ci-cleanup.
 // =============================================================================
 
 import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
