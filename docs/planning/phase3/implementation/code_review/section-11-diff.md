diff --git a/Sources/AetherRaidSimulator.html b/Sources/AetherRaidSimulator.html
index ce8a80b2..1b4a065e 100644
--- a/Sources/AetherRaidSimulator.html
+++ b/Sources/AetherRaidSimulator.html
@@ -61,7 +61,6 @@
 
     <!-- 重要なところは予め接続 -->
     <link rel="preconnect" href="//cdnjs.cloudflare.com">
-    <link rel="preconnect" href="//code.jquery.com">
 
 
     <!-- ローディングアイコン -->
@@ -361,7 +360,7 @@
                         </tr>
                         <tr>
                             <td>
-                                <div id="progress" style="height:5px;"></div>
+                                <progress id="progress" style="height:5px;width:100%;"></progress>
                             </td>
                         </tr>
                         <tr>
@@ -394,7 +393,7 @@
                                         :reset-unit-random="resetUnitRandom"
                                         :activate-all-unit="activateAllUnit"
                                         :reset-unit-for-testing="resetUnitForTesting"
-                                        :open-auto-clear-dialog="() => $('#autoClearDialog').dialog('open')"
+                                        :open-auto-clear-dialog="() => openDialogById('autoClearDialog')"
                                 >
                                 </debug-buttons>
                             </td>
@@ -1121,7 +1120,7 @@
     </div>
     <script>
         function showMjolnirsStrikeSettingDialog() {
-            $('#mjolnirsStrikeSettingDialog').dialog('open');
+            openDialogById('mjolnirsStrikeSettingDialog');
         }
         function setImageSrcFromDatasetSrc(lazyImages) {
             for (let lazyImage of lazyImages) {
@@ -1167,54 +1166,28 @@
         }
         function showOcrSettingDialog() {
             g_imageAnalysisDialogOpened = true;
-            $('#ocrSettingDialog').dialog('open');
+            openDialogById('ocrSettingDialog');
             loadLazyTemplateImages();
             g_app.loadImageAnalysisLibraries();
         }
         function showDialog(id) {
-            $(id).dialog('open');
+            openDialogById(id);
         }
         function showSettingDialog() {
-            $('#settingDialog').dialog('open');
+            openDialogById('settingDialog');
         }
         function showExportDialog() {
             g_appData.updateExportText();
-            $('#exportDialog').dialog('open');
+            openDialogById('exportDialog');
         }
         function showImportDialog() {
-            $('#importDialog').dialog('open');
+            openDialogById('importDialog');
         }
         function showSaveUnitDialog() {
-            showDialog('#saveUnitDialog');
+            showDialog('saveUnitDialog');
             g_appData.storeUnit();
             g_app.vm.$refs.unitStorageDialog.setUnitName(g_appData.currentUnit.name);
         }
-        function createDialog(elem, title,
-            width = 370, height = 500,
-            positionOf = "#unitSettings",
-            modal = false, position = null) {
-            let p = position ? position : { my: "left top", at: "left top", of: positionOf };
-            elem.dialog({
-                autoOpen: false,
-                modal: modal,
-                title: title,
-                width: width,
-                height: height,
-                resizable: true,
-                closeText: "",
-                position: p,
-                buttons: [
-                    {
-                        html: '<span class="dialog-button-text">閉じる</span>',
-                        class: 'dialog-button',
-                        click: function () {
-                            $(this).dialog("close");
-                        }
-                    },
-                ]
-            });
-        }
-
         function createDialogs() {
             function setScroll(id) {
                 let node = document.getElementById(id);
@@ -1233,62 +1206,45 @@
             setScroll("debugLogPanel");
 
             // タブ
-            $('.jquery .tabs li').click(function () {
-                var index = $('.jquery .tabs li').index(this);
-                g_app.setCurrentUnitIndex(index);
+            const tabItems = document.querySelectorAll('.jquery .tabs li');
+            tabItems.forEach((li, index) => {
+                li.addEventListener('click', () => {
+                    g_app.setCurrentUnitIndex(index);
+                });
             });
 
-            createDialog($("#mjolnirsStrikeSettingDialog"), "ミョルニル査定計算の設定", 370, 500, "#mapArea");
-            $("#ocrSettingDialog").dialog({
-                autoOpen: false,
-                modal: false,
-                title: "画像から自動設定",
+            initSimDialog("mjolnirsStrikeSettingDialog", "ミョルニル査定計算の設定");
+            initSimDialog("ocrSettingDialog", "画像から自動設定", {
                 width: 470,
-                height: 600,
-                closeText: "",
-                position: {
-                    my: "left bottom",
-                    at: "left bottom",
-                    of: "#mapArea"
-                },
                 buttons: [
                     {
-                        html: '<span class="dialog-button-text">設定開始</span>',
-                        class: 'dialog-button',
+                        text: '設定開始',
                         click: function () {
                             const files = document.getElementById("ocrSettingFile").files;
                             g_app.setUnitsByStatusImages(files);
-                            var closeDialog = $("#closesDialogAfterStartAnalysis")[0].checked;
-                            if (closeDialog) {
-                                $(this).dialog("close");
+                            var shouldClose = document.getElementById("closesDialogAfterStartAnalysis").checked;
+                            if (shouldClose) {
+                                closeDialogById('ocrSettingDialog');
                             }
                         }
                     },
-                    {
-                        html: '<span class="dialog-button-text">閉じる</span>',
-                        class: 'dialog-button',
-                        click: function () {
-                            $(this).dialog("close");
-                        }
-                    },
+                    { text: '閉じる', click: function () { closeDialogById('ocrSettingDialog'); } },
                 ]
             });
-            createDialog($("#durabilityTestDialog"), "耐久/殲滅力テスト", 490, 700);
-            createDialog($("#aetherRaidDefensePresetDialog"), "模擬戦相手の設定");
-            createDialog($("#itemDialog"), "アイテム");
-            createDialog($("#editMapDialog"), "マップ編集");
-            createDialog($("#setupResonantBattleEnemyDialog"), "双界の敵ステータス設定");
-            createDialog($("#autoClearDialog"), "お助けツール(開発中)");
-            createDialog($("#settingDialog"), "詳細設定", 370, 370, "#mapArea");
-            createDialog($("#exportDialog"), "設定のエクスポート", 370, 420, "#mapArea");
-            createDialog($("#importDialog"), "設定のインポート", 370, 420, "#mapArea");
-            createDialog($("#saveUnitDialog"), "ユニットの保存・読み込み", 500, 600, "#unitSettings", true);
-            createDialog($("#teamFormationDialog"), "部隊編成", 500, 600, "#mapArea", true, {
-                my: "left top", at: "left top", of: "#app"
-            });
+            initSimDialog("durabilityTestDialog", "耐久/殲滅力テスト", { width: 490 });
+            initSimDialog("aetherRaidDefensePresetDialog", "模擬戦相手の設定");
+            initSimDialog("itemDialog", "アイテム");
+            initSimDialog("editMapDialog", "マップ編集");
+            initSimDialog("setupResonantBattleEnemyDialog", "双界の敵ステータス設定");
+            initSimDialog("autoClearDialog", "お助けツール(開発中)");
+            initSimDialog("settingDialog", "詳細設定");
+            initSimDialog("exportDialog", "設定のエクスポート", { width: 370 });
+            initSimDialog("importDialog", "設定のインポート", { width: 370 });
+            initSimDialog("saveUnitDialog", "ユニットの保存・読み込み", { width: 500 });
+            initSimDialog("teamFormationDialog", "部隊編成", { width: 500 });
         }
         function copyMapSourceCodeToClipboard() {
-            var textarea = $("#mapSourceCode")[0];
+            var textarea = document.getElementById("mapSourceCode");
             textarea.select();
             textarea.setSelectionRange(0, 99999);
             document.execCommand("copy");
@@ -1302,34 +1258,34 @@
             document.execCommand("copy");
         }
         function copyExportUrlToClipboard() {
-            var textarea = $("#exportUrl")[0];
+            var textarea = document.getElementById("exportUrl");
             textarea.select();
             textarea.setSelectionRange(0, 99999); /*For mobile devices*/
             document.execCommand("copy");
         }
         function copyExportTextToClipboard() {
-            var textarea = $("#exportText")[0];
+            var textarea = document.getElementById("exportText");
             textarea.select();
             textarea.setSelectionRange(0, 99999); /*For mobile devices*/
             document.execCommand("copy");
         }
         function pasteClipboardToImportText() {
             // セキュリティの都合で(コピーしたパスワードなどを取得できないように)多くのブラウザでは動作しない
-            var textarea = $("#importText")[0];
+            var textarea = document.getElementById("importText");
             textarea.focus();
             document.execCommand("paste");
         }
         function clearImportText() {
-            var textarea = $("#importText")[0];
+            var textarea = document.getElementById("importText");
             textarea.value = '';
         }
         function importTextFromInputText(text, compressMode = null) {
-            var loadsEnemySettings = $("#loadsEnemySettings")[0].checked;
-            var loadsAllySettings = $("#loadsAllySettings")[0].checked;
-            var loadsDefenceSettings = $("#loadsDefenceSettings")[0].checked;
-            var loadsOffenceSettings = $("#loadsOffenceSettings")[0].checked;
-            var loadsMapSettings = $("#loadsMapSettings")[0].checked;
-            var textarea = $("#importText")[0];
+            var loadsEnemySettings = document.getElementById("loadsEnemySettings").checked;
+            var loadsAllySettings = document.getElementById("loadsAllySettings").checked;
+            var loadsDefenceSettings = document.getElementById("loadsDefenceSettings").checked;
+            var loadsOffenceSettings = document.getElementById("loadsOffenceSettings").checked;
+            var loadsMapSettings = document.getElementById("loadsMapSettings").checked;
+            var textarea = document.getElementById("importText");
             importSettingsFromString(
                 text,
                 loadsAllySettings,
@@ -1339,13 +1295,13 @@
                 loadsMapSettings,
                 compressMode);
             updateAllUi();
-            var closeDialog = $("#closesDialogAfterImport")[0].checked;
+            var closeDialog = document.getElementById("closesDialogAfterImport").checked;
             if (closeDialog) {
-                $("#importDialog").dialog('close');
+                closeDialogById('importDialog');
             }
         }
         function importText() {
-            const textarea = $("#importText")[0];
+            const textarea = document.getElementById("importText");
             importTextFromInputText(textarea.value);
         }
 
@@ -1366,31 +1322,6 @@
         }
     </script>
 
-    <!-- jquery -->
-    <!-- <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
-        integrity="sha256-3edrmyuQ0w65f8gfBsqowzjJe2iM6n0nKciPUp8y+7E=" crossorigin="anonymous"></script> -->
-    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script> -->
-    <script src="https://fire-emblem.fun/js/jquery-3.7.0.min.js"></script>
-
-    <!-- jquery-ui -->
-    <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.min.css" media="print"
-        onload="this.media='all'">
-    <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
-
-    <!-- クッキー(実際は使ってないので消してもいいかも) -->
-    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
-
-    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
-
-    <!-- 文字列圧縮 -->
-    <script async src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js"></script>
-
-    <!-- 画像解析 -->
-    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.6/cropper.min.css" media="print"
-        onload="this.media='all'">
-    <script async type="text/javascript"
-        src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.6/cropper.min.js"></script>
-
     <!-- <script defer type="text/javascript" src="https://docs.opencv.org/4.2.0/opencv.js"></script> -->
 
 
diff --git a/Sources/AetherRaidSimulatorMain.js b/Sources/AetherRaidSimulatorMain.js
index 7a513305..f1cf11a7 100644
--- a/Sources/AetherRaidSimulatorMain.js
+++ b/Sources/AetherRaidSimulatorMain.js
@@ -1,6 +1,8 @@
 /// @file
 /// @brief シミュレーターのメインコードです。
 
+import { openDialogById, closeDialogById, initSimDialog } from './DialogUtil.js';
+import '@fortawesome/fontawesome-free/css/all.min.css';
 import { BattleSimulatorBase, createMap, loadSettings } from './BattleSimulatorBase.js';
 import { ScopedStopwatch, using_ } from './Utilities.js';
 import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos } from './SampleSkillInfos.js';
@@ -49,6 +51,9 @@ function initAetherRaidBoard(
 
 // Initialization
 window.g_app = g_app;
+window.openDialogById = openDialogById;
+window.closeDialogById = closeDialogById;
+window.initSimDialog = initSimDialog;
 g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
 g_app.registerHeroOptions(heroInfos, false);
 initAetherRaidBoard(heroInfos);
diff --git a/Sources/AppData.js b/Sources/AppData.js
index b2bad986..848c9fb9 100644
--- a/Sources/AppData.js
+++ b/Sources/AppData.js
@@ -1,6 +1,8 @@
 /// @file
 /// @brief AppData クラスとそれに関連するクラスや関数等の定義です。
 
+import LZString from 'lz-string';
+
 function __registerSkillOptions(options, infos) {
     for (let info of infos) {
         options.push({ id: info.id, text: info.name });
diff --git a/Sources/ArenaSimulator.html b/Sources/ArenaSimulator.html
index c10f4d5c..679c1680 100644
--- a/Sources/ArenaSimulator.html
+++ b/Sources/ArenaSimulator.html
@@ -61,7 +61,6 @@
 
     <!-- 重要なところは予め接続 -->
     <link rel="preconnect" href="//cdnjs.cloudflare.com">
-    <link rel="preconnect" href="//code.jquery.com">
 
     <div id="app">
         <flash-message
@@ -308,7 +307,7 @@
                         </tr>
                         <tr>
                             <td>
-                                <div id="progress" style="height:5px;"></div>
+                                <progress id="progress" style="height:5px;width:100%;"></progress>
                             </td>
                         </tr>
                         <tr>
@@ -341,7 +340,7 @@
                                         :reset-unit-random="resetUnitRandom"
                                         :activate-all-unit="activateAllUnit"
                                         :reset-unit-for-testing="resetUnitForTesting"
-                                        :open-auto-clear-dialog="() => $('#autoClearDialog').dialog('open')"
+                                        :open-auto-clear-dialog="() => openDialogById('autoClearDialog')"
                                 >
                                 </debug-buttons>
                             </td>
@@ -1098,7 +1097,7 @@
     </div>
     <script>
         function showMjolnirsStrikeSettingDialog() {
-            $('#mjolnirsStrikeSettingDialog').dialog('open');
+            openDialogById('mjolnirsStrikeSettingDialog');
         }
         function setImageSrcFromDatasetSrc(lazyImages) {
             for (let lazyImage of lazyImages) {
@@ -1144,54 +1143,28 @@
         }
         function showOcrSettingDialog() {
             g_imageAnalysisDialogOpened = true;
-            $('#ocrSettingDialog').dialog('open');
+            openDialogById('ocrSettingDialog');
             loadLazyTemplateImages();
             g_app.loadImageAnalysisLibraries();
         }
         function showDialog(id) {
-            $(id).dialog('open');
+            openDialogById(id);
         }
         function showSettingDialog() {
-            $('#settingDialog').dialog('open');
+            openDialogById('settingDialog');
         }
         function showExportDialog() {
             g_appData.updateExportText();
-            $('#exportDialog').dialog('open');
+            openDialogById('exportDialog');
         }
         function showImportDialog() {
-            $('#importDialog').dialog('open');
+            openDialogById('importDialog');
         }
         function showSaveUnitDialog() {
-            showDialog('#saveUnitDialog');
+            showDialog('saveUnitDialog');
             g_appData.storeUnit();
             g_app.vm.$refs.unitStorageDialog.setUnitName(g_appData.currentUnit.name);
         }
-        function createDialog(elem, title, width = 370, height = 500, positionOf = "#unitSettings") {
-            elem.dialog({
-                autoOpen: false,
-                modal: false,
-                title: title,
-                width: width,
-                height: height,
-                resizable: true,
-                closeText: "",
-                position: {
-                    my: "left top",
-                    at: "left top",
-                    of: positionOf
-                },
-                buttons: [
-                    {
-                        html: '<span class="dialog-button-text">閉じる</span>',
-                        class: 'dialog-button',
-                        click: function () {
-                            $(this).dialog("close");
-                        }
-                    },
-                ]
-            });
-        }
-
         function createDialogs() {
             function setScroll(id) {
                 let node = document.getElementById(id);
@@ -1210,59 +1183,45 @@
             setScroll("debugLogPanel");
 
             // タブ
-            $('.jquery .tabs li').click(function () {
-                var index = $('.jquery .tabs li').index(this);
-                g_app.setCurrentUnitIndex(index);
+            const tabItems = document.querySelectorAll('.jquery .tabs li');
+            tabItems.forEach((li, index) => {
+                li.addEventListener('click', () => {
+                    g_app.setCurrentUnitIndex(index);
+                });
             });
 
-            createDialog($("#mjolnirsStrikeSettingDialog"), "ミョルニル査定計算の設定", 370, 500, "#mapArea");
-            $("#ocrSettingDialog").dialog({
-                autoOpen: false,
-                modal: false,
-                title: "画像から自動設定",
+            // ダイアログ初期化
+            initSimDialog("mjolnirsStrikeSettingDialog", "ミョルニル査定計算の設定");
+            initSimDialog("ocrSettingDialog", "画像から自動設定", {
                 width: 470,
-                height: 600,
-                closeText: "",
-                position: {
-                    my: "left bottom",
-                    at: "left bottom",
-                    of: "#mapArea"
-                },
                 buttons: [
                     {
-                        html: '<span class="dialog-button-text">設定開始</span>',
-                        class: 'dialog-button',
+                        text: '設定開始',
                         click: function () {
                             const files = document.getElementById("ocrSettingFile").files;
                             g_app.setUnitsByStatusImages(files);
-                            var closeDialog = $("#closesDialogAfterStartAnalysis")[0].checked;
-                            if (closeDialog) {
-                                $(this).dialog("close");
+                            var shouldClose = document.getElementById("closesDialogAfterStartAnalysis").checked;
+                            if (shouldClose) {
+                                closeDialogById('ocrSettingDialog');
                             }
                         }
                     },
-                    {
-                        html: '<span class="dialog-button-text">閉じる</span>',
-                        class: 'dialog-button',
-                        click: function () {
-                            $(this).dialog("close");
-                        }
-                    },
+                    { text: '閉じる', click: function () { closeDialogById('ocrSettingDialog'); } },
                 ]
             });
-            createDialog($("#durabilityTestDialog"), "耐久/殲滅力テスト", 490, 700);
-            createDialog($("#aetherRaidDefensePresetDialog"), "模擬戦相手の設定");
-            createDialog($("#itemDialog"), "アイテム");
-            createDialog($("#editMapDialog"), "マップ編集");
-            createDialog($("#setupResonantBattleEnemyDialog"), "双界の敵ステータス設定");
-            createDialog($("#autoClearDialog"), "お助けツール(開発中)");
-            createDialog($("#settingDialog"), "詳細設定", 370, 370, "#mapArea");
-            createDialog($("#exportDialog"), "設定のエクスポート", 370, 420, "#mapArea");
-            createDialog($("#importDialog"), "設定のインポート", 370, 420, "#mapArea");
-            createDialog($("#saveUnitDialog"), "ユニットの保存・読み込み", 500, 600);
+            initSimDialog("durabilityTestDialog", "耐久/殲滅力テスト", { width: 490 });
+            initSimDialog("aetherRaidDefensePresetDialog", "模擬戦相手の設定");
+            initSimDialog("itemDialog", "アイテム");
+            initSimDialog("editMapDialog", "マップ編集");
+            initSimDialog("setupResonantBattleEnemyDialog", "双界の敵ステータス設定");
+            initSimDialog("autoClearDialog", "お助けツール(開発中)");
+            initSimDialog("settingDialog", "詳細設定");
+            initSimDialog("exportDialog", "設定のエクスポート", { width: 370 });
+            initSimDialog("importDialog", "設定のインポート", { width: 370 });
+            initSimDialog("saveUnitDialog", "ユニットの保存・読み込み", { width: 500 });
         }
         function copyMapSourceCodeToClipboard() {
-            var textarea = $("#mapSourceCode")[0];
+            var textarea = document.getElementById("mapSourceCode");
             textarea.select();
             textarea.setSelectionRange(0, 99999);
             document.execCommand("copy");
@@ -1276,34 +1235,34 @@
             document.execCommand("copy");
         }
         function copyExportUrlToClipboard() {
-            var textarea = $("#exportUrl")[0];
+            var textarea = document.getElementById("exportUrl");
             textarea.select();
             textarea.setSelectionRange(0, 99999); /*For mobile devices*/
             document.execCommand("copy");
         }
         function copyExportTextToClipboard() {
-            var textarea = $("#exportText")[0];
+            var textarea = document.getElementById("exportText");
             textarea.select();
             textarea.setSelectionRange(0, 99999); /*For mobile devices*/
             document.execCommand("copy");
         }
         function pasteClipboardToImportText() {
             // セキュリティの都合で(コピーしたパスワードなどを取得できないように)多くのブラウザでは動作しない
-            var textarea = $("#importText")[0];
+            var textarea = document.getElementById("importText");
             textarea.focus();
             document.execCommand("paste");
         }
         function clearImportText() {
-            var textarea = $("#importText")[0];
+            var textarea = document.getElementById("importText");
             textarea.value = '';
         }
         function importTextFromInputText(text, compressMode = null) {
-            var loadsEnemySettings = $("#loadsEnemySettings")[0].checked;
-            var loadsAllySettings = $("#loadsAllySettings")[0].checked;
-            var loadsDefenceSettings = $("#loadsDefenceSettings")[0].checked;
-            var loadsOffenceSettings = $("#loadsOffenceSettings")[0].checked;
-            var loadsMapSettings = $("#loadsMapSettings")[0].checked;
-            var textarea = $("#importText")[0];
+            var loadsEnemySettings = document.getElementById("loadsEnemySettings").checked;
+            var loadsAllySettings = document.getElementById("loadsAllySettings").checked;
+            var loadsDefenceSettings = document.getElementById("loadsDefenceSettings").checked;
+            var loadsOffenceSettings = document.getElementById("loadsOffenceSettings").checked;
+            var loadsMapSettings = document.getElementById("loadsMapSettings").checked;
+            var textarea = document.getElementById("importText");
             importSettingsFromString(
                 text,
                 loadsAllySettings,
@@ -1313,13 +1272,13 @@
                 loadsMapSettings,
                 compressMode);
             updateAllUi();
-            var closeDialog = $("#closesDialogAfterImport")[0].checked;
+            var closeDialog = document.getElementById("closesDialogAfterImport").checked;
             if (closeDialog) {
-                $("#importDialog").dialog('close');
+                closeDialogById('importDialog');
             }
         }
         function importText() {
-            const textarea = $("#importText")[0];
+            const textarea = document.getElementById("importText");
             importTextFromInputText(textarea.value);
         }
 
@@ -1340,31 +1299,7 @@
         }
     </script>
 
-    <!-- jquery -->
-    <!-- <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
-        integrity="sha256-3edrmyuQ0w65f8gfBsqowzjJe2iM6n0nKciPUp8y+7E=" crossorigin="anonymous"></script> -->
-    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script> -->
-    <script src="https://fire-emblem.fun/js/jquery-3.7.0.min.js"></script>
-
-    <!-- jquery-ui -->
-    <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.min.css" media="print"
-        onload="this.media='all'">
-    <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
-
-    <!-- クッキー(実際は使ってないので消してもいいかも) -->
-    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
-
-    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
-
-    <!-- 文字列圧縮 -->
-    <script async src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js"></script>
-
     <!-- 画像解析 -->
-    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.6/cropper.min.css" media="print"
-        onload="this.media='all'">
-    <script async type="text/javascript"
-        src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.6/cropper.min.js"></script>
-
     <!-- <script defer type="text/javascript" src="https://docs.opencv.org/4.2.0/opencv.js"></script> -->
 
 
diff --git a/Sources/ArenaSimulatorMain.js b/Sources/ArenaSimulatorMain.js
index af2f8f3d..06978405 100644
--- a/Sources/ArenaSimulatorMain.js
+++ b/Sources/ArenaSimulatorMain.js
@@ -1,6 +1,8 @@
 /// @file
 /// @brief シミュレーターのメインコードです。
 
+import { openDialogById, closeDialogById, initSimDialog } from './DialogUtil.js';
+import '@fortawesome/fontawesome-free/css/all.min.css';
 import { BattleSimulatorBase, resetPlacement, changeMap, removeBreakableWallsFromTrashBox, updateAllUi, loadSettings } from './BattleSimulatorBase.js';
 import { ScopedStopwatch, using_ } from './Utilities.js';
 import { g_appData } from './AppData.js';
@@ -59,6 +61,11 @@ function initAetherRaidBoard(
     });
 }
 
+// Expose dialog utilities to inline scripts
+window.openDialogById = openDialogById;
+window.closeDialogById = closeDialogById;
+window.initSimDialog = initSimDialog;
+
 // Initialization
 window.g_app = g_app;
 g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
diff --git a/Sources/BattleSimulatorBase.js b/Sources/BattleSimulatorBase.js
index 9183ec63..3107ee7f 100644
--- a/Sources/BattleSimulatorBase.js
+++ b/Sources/BattleSimulatorBase.js
@@ -3108,10 +3108,9 @@ class BattleSimulatorBase {
                 results.push({ heroInfo: heroInfo, result: result });
             },
             function (iter, iterMax) {
-                $("#progress").progressbar({
-                    value: iter,
-                    max: iterMax,
-                });
+                const progressEl = document.getElementById("progress");
+                progressEl.max = iterMax;
+                progressEl.value = iter;
 
                 let lastIndex = results.length - 1;
                 let winRate = results[lastIndex].result.winCount / unitCount;
@@ -3138,7 +3137,7 @@ class BattleSimulatorBase {
                 let originalDisableAllLogs = self.disableAllLogs;
                 self.disableAllLogs = true;
                 importSettingsFromString(serializedTurn);
-                $("#progress").progressbar({ disabled: true });
+                document.getElementById("progress").removeAttribute("value");
                 updateAllUi();
                 self.disableAllLogs = originalDisableAllLogs;
             });
@@ -5391,16 +5390,15 @@ class BattleSimulatorBase {
                 self.simulateEnemyTurn(currentUnit, tile, currentTurn, origAliveAllyCount);
             },
             function (iter, iterMax) {
-                $("#progress").progressbar({
-                    value: iter,
-                    max: iterMax,
-                });
+                const progressEl = document.getElementById("progress");
+                progressEl.max = iterMax;
+                progressEl.value = iter;
                 updateAllUi();
             },
             function () {
                 g_appData.globalBattleContext.currentTurn = currentTurn;
                 importPerTurnSetting(self.tempSerializedTurn);
-                $("#progress").progressbar({ disabled: true });
+                document.getElementById("progress").removeAttribute("value");
                 updateAllUi();
             });
     }
@@ -5856,16 +5854,15 @@ class BattleSimulatorBase {
                 self.simulateEnemyTurn(currentUnit, tile, currentTurn, origAliveAllyCount);
             },
             function (iter, iterMax) {
-                $("#progress").progressbar({
-                    value: iter,
-                    max: iterMax,
-                });
+                const progressEl = document.getElementById("progress");
+                progressEl.max = iterMax;
+                progressEl.value = iter;
                 updateAllUi();
             },
             function () {
                 g_appData.globalBattleContext.currentTurn = currentTurn;
                 importPerTurnSetting(self.tempSerializedTurn);
-                $("#progress").progressbar({ disabled: true });
+                document.getElementById("progress").removeAttribute("value");
                 updateAllUi();
             });
     }
@@ -11737,7 +11734,7 @@ const OwnerType = {
 let g_trashArea = new StructureContainer('trashArea');
 
 function removeTouchEventFromDraggableElements() {
-    let draggableItems = $(".draggable-elem");
+    let draggableItems = document.querySelectorAll(".draggable-elem");
     for (let i = 0; i < draggableItems.length; ++i) {
         let item = draggableItems[i];
         item.removeEventListener('touchstart', touchStartEvent, { passive: false });
@@ -11748,7 +11745,7 @@ function removeTouchEventFromDraggableElements() {
 
 function addTouchEventToDraggableElements() {
     // ドラッグ可能アイテムへのタッチイベントの設定
-    let draggableItems = $(".draggable-elem");
+    let draggableItems = document.querySelectorAll(".draggable-elem");
     for (let i = 0; i < draggableItems.length; ++i) {
         let item = draggableItems[i];
         item.addEventListener('touchstart', touchStartEvent, { passive: false });
diff --git a/Sources/DamageCalculator.html b/Sources/DamageCalculator.html
index d50c470f..45364f29 100644
--- a/Sources/DamageCalculator.html
+++ b/Sources/DamageCalculator.html
@@ -389,20 +389,6 @@
         </details>
     </div>
 
-    <!-- jquery -->
-    <!-- <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
-                integrity="sha256-3edrmyuQ0w65f8gfBsqowzjJe2iM6n0nKciPUp8y+7E=" crossorigin="anonymous"></script> -->
-    <!-- <script rel="preconnect" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script> -->
-    <script src="https://fire-emblem.fun/js/jquery-3.7.0.min.js"></script>
-
-    <!-- jquery-ui -->
-    <link type="text/css" rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.min.css">
-    <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
-
-
-    <!-- 文字列圧縮 -->
-    <script src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js"></script>
-
     <!-- chart.js -->
     <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.1.4/Chart.bundle.min.js"></script>
 
diff --git a/Sources/DialogUtil.js b/Sources/DialogUtil.js
new file mode 100644
index 00000000..deae6ad5
--- /dev/null
+++ b/Sources/DialogUtil.js
@@ -0,0 +1,84 @@
+/// @file
+/// @brief jQuery UIダイアログの代替ユーティリティ
+
+function openDialogById(id) {
+    const el = document.getElementById(id);
+    if (!el) return;
+    el.classList.add('dialog-open');
+}
+
+function closeDialogById(id) {
+    const el = document.getElementById(id);
+    if (!el) return;
+    el.classList.remove('dialog-open');
+}
+
+function initSimDialog(id, title, options = {}) {
+    const el = document.getElementById(id);
+    if (!el || el.dataset.dialogInit) return;
+    el.dataset.dialogInit = '1';
+    el.classList.add('sim-dialog');
+
+    const width = options.width || 370;
+
+    // タイトルバー追加
+    const titlebar = document.createElement('div');
+    titlebar.className = 'sim-dialog-titlebar';
+    const titleSpan = document.createElement('span');
+    titleSpan.textContent = title;
+    const closeX = document.createElement('button');
+    closeX.className = 'sim-dialog-close';
+    closeX.type = 'button';
+    closeX.textContent = '\u00D7';
+    closeX.addEventListener('click', () => closeDialogById(id));
+    titlebar.appendChild(titleSpan);
+    titlebar.appendChild(closeX);
+    el.insertBefore(titlebar, el.firstChild);
+
+    // コンテンツラッパー
+    const content = document.createElement('div');
+    content.className = 'sim-dialog-content';
+    while (el.childNodes.length > 1) {
+        content.appendChild(el.childNodes[1]);
+    }
+    el.appendChild(content);
+
+    // 閉じるボタンペイン
+    const buttonPane = document.createElement('div');
+    buttonPane.className = 'sim-dialog-buttonpane';
+
+    if (options.buttons) {
+        for (const btnDef of options.buttons) {
+            const button = document.createElement('button');
+            button.className = btnDef.class || 'dialog-button';
+            const btnText = document.createElement('span');
+            btnText.className = 'dialog-button-text';
+            btnText.textContent = btnDef.text || '閉じる';
+            button.appendChild(btnText);
+            button.addEventListener('click', () => {
+                if (btnDef.click) {
+                    btnDef.click(id);
+                } else {
+                    closeDialogById(id);
+                }
+            });
+            buttonPane.appendChild(button);
+        }
+    } else {
+        const closeBtn = document.createElement('button');
+        closeBtn.className = 'dialog-button';
+        const closeBtnText = document.createElement('span');
+        closeBtnText.className = 'dialog-button-text';
+        closeBtnText.textContent = '閉じる';
+        closeBtn.appendChild(closeBtnText);
+        closeBtn.addEventListener('click', () => closeDialogById(id));
+        buttonPane.appendChild(closeBtn);
+    }
+
+    el.appendChild(buttonPane);
+
+    // 幅設定
+    el.style.width = width + 'px';
+}
+
+export { openDialogById, closeDialogById, initSimDialog };
diff --git a/Sources/HeroStatusClusterer.html b/Sources/HeroStatusClusterer.html
index b621475a..2a5af953 100644
--- a/Sources/HeroStatusClusterer.html
+++ b/Sources/HeroStatusClusterer.html
@@ -211,14 +211,6 @@
             </fieldset>
         </div>
     </div>
-    <!-- jquery -->
-    <script rel="preconnect" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
-
-    <!-- jquery-ui -->
-    <link type="text/css" rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.min.css">
-    <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
-
-
     <script type="module" src="./HeroStatusClustererMain.js"></script>
 </body>
 
diff --git a/Sources/Main_ImageProcessing.js b/Sources/Main_ImageProcessing.js
index 648af8f8..6da9cbfa 100644
--- a/Sources/Main_ImageProcessing.js
+++ b/Sources/Main_ImageProcessing.js
@@ -1,6 +1,9 @@
 /// @file
 /// @brief シミュレーターの画像処理部分を切り出した実装です。
 
+import Cropper from 'cropperjs';
+import 'cropperjs/dist/cropper.min.css';
+
 function drawImage(canvas, imageData, scale) {
     const tempCanvas = document.getElementById("tempCanvas");
     let tempCtx = tempCanvas.getContext("2d");
@@ -610,13 +613,12 @@ class ImageProcessor {
                         }
                     },
                     (iter, iterMax) => {
-                        $("#progress").progressbar({
-                            value: iter,
-                            max: iterMax,
-                        });
+                        const progressEl = document.getElementById("progress");
+                        progressEl.max = iterMax;
+                        progressEl.value = iter;
                     },
                     () => {
-                        $("#progress").progressbar({ disabled: true });
+                        document.getElementById("progress").removeAttribute("value");
                         self.writeSimpleLogLine(`地形は${g_appData.getLabelOfMap(minMapType)}`);
                         g_app.vm.mapKind = minMapType;
                         changeMap();
@@ -664,10 +666,9 @@ class ImageProcessor {
                         }
                     },
                     (iter, iterMax) => {
-                        $("#progress").progressbar({
-                            value: iter,
-                            max: iterMax,
-                        });
+                        const progressEl = document.getElementById("progress");
+                        progressEl.max = iterMax;
+                        progressEl.value = iter;
 
                         if (iter == self.vm.mapImageFiles.length) {
                             self.writeSimpleLogLine(`地形は${g_appData.getLabelOfMap(minMapType)}`);
@@ -680,7 +681,7 @@ class ImageProcessor {
                         }
                     },
                     () => {
-                        $("#progress").progressbar({ disabled: true });
+                        document.getElementById("progress").removeAttribute("value");
 
                         // トラップは2つあるので片方のインスタンスを本物トラップに置き換える
                         let boltTrapPoints = processor.__getSortedMatchedPoints(matchedPoints, st => st instanceof FalseBoltTrap);
diff --git a/Sources/SettingManager.js b/Sources/SettingManager.js
index ff483c89..72e85ea4 100644
--- a/Sources/SettingManager.js
+++ b/Sources/SettingManager.js
@@ -1,18 +1,23 @@
 /// @file
 /// @brief SettingManager クラスとそれに関連する関数等の定義です。
 
+import LZString from 'lz-string';
+
 // todo: ビューに依存してしまっているのでどうにかする
 function changeCurrentUnitTab(tabIndex) {
-    let $tabs = $('#unitSettings > ul.contents > li');
+    let tabs = document.querySelectorAll('#unitSettings > ul.contents > li');
     if (tabIndex < 0) {
-        $tabs.removeClass('active');
+        tabs.forEach(tab => tab.classList.remove('active'));
         return;
     }
-    $tabs.removeClass('active').eq(tabIndex).addClass('active');
+    tabs.forEach(tab => tab.classList.remove('active'));
+    if (tabs[tabIndex]) {
+        tabs[tabIndex].classList.add('active');
+    }
 
     // アイコン
-    $('.weaponIcon').attr('src', g_imageRootPath + "Weapon.png");
-    $('.supportIcon').attr('src', g_imageRootPath + "Support.png");
+    document.querySelectorAll('.weaponIcon').forEach(el => el.src = g_imageRootPath + "Weapon.png");
+    document.querySelectorAll('.supportIcon').forEach(el => el.src = g_imageRootPath + "Support.png");
 }
 
 /// シリアライズ可能なシミュレーターの設定を管理するクラスです。
diff --git a/Sources/SummonerDuelsSimulator.html b/Sources/SummonerDuelsSimulator.html
index 7978f34c..dfa91c5c 100644
--- a/Sources/SummonerDuelsSimulator.html
+++ b/Sources/SummonerDuelsSimulator.html
@@ -54,7 +54,6 @@
 
     <!-- 重要なところは予め接続 -->
     <link rel="preconnect" href="//cdnjs.cloudflare.com">
-    <link rel="preconnect" href="//code.jquery.com">
 
     <div id="app">
         <flash-message
@@ -382,7 +381,7 @@
                         </tr>
                         <tr>
                             <td>
-                                <div id="progress" style="height:5px;"></div>
+                                <progress id="progress" style="height:5px;width:100%;"></progress>
                             </td>
                         </tr>
                         <tr>
@@ -415,7 +414,7 @@
                                         :reset-unit-random="resetUnitRandom"
                                         :activate-all-unit="activateAllUnit"
                                         :reset-unit-for-testing="resetUnitForTesting"
-                                        :open-auto-clear-dialog="() => $('#autoClearDialog').dialog('open')"
+                                        :open-auto-clear-dialog="() => openDialogById('autoClearDialog')"
                                 >
                                 </debug-buttons>
                             </td>
@@ -1189,7 +1188,7 @@
     </div>
     <script>
         function showMjolnirsStrikeSettingDialog() {
-            $('#mjolnirsStrikeSettingDialog').dialog('open');
+            openDialogById('mjolnirsStrikeSettingDialog');
         }
         function setImageSrcFromDatasetSrc(lazyImages) {
             for (let lazyImage of lazyImages) {
@@ -1235,54 +1234,28 @@
         }
         function showOcrSettingDialog() {
             g_imageAnalysisDialogOpened = true;
-            $('#ocrSettingDialog').dialog('open');
+            openDialogById('ocrSettingDialog');
             loadLazyTemplateImages();
             g_app.loadImageAnalysisLibraries();
         }
         function showDialog(id) {
-            $(id).dialog('open');
+            openDialogById(id);
         }
         function showSettingDialog() {
-            $('#settingDialog').dialog('open');
+            openDialogById('settingDialog');
         }
         function showExportDialog() {
             g_appData.updateExportText();
-            $('#exportDialog').dialog('open');
+            openDialogById('exportDialog');
         }
         function showImportDialog() {
-            $('#importDialog').dialog('open');
+            openDialogById('importDialog');
         }
         function showSaveUnitDialog() {
-            showDialog('#saveUnitDialog');
+            openDialogById('saveUnitDialog');
             g_appData.storeUnit();
             g_app.vm.$refs.unitStorageDialog.setUnitName(g_appData.currentUnit.name);
         }
-        function createDialog(elem, title, width = 370, height = 500, positionOf = "#unitSettings") {
-            elem.dialog({
-                autoOpen: false,
-                modal: false,
-                title: title,
-                width: width,
-                height: height,
-                resizable: true,
-                closeText: "",
-                position: {
-                    my: "left top",
-                    at: "left top",
-                    of: positionOf
-                },
-                buttons: [
-                    {
-                        html: '<span class="dialog-button-text">閉じる</span>',
-                        class: 'dialog-button',
-                        click: function () {
-                            $(this).dialog("close");
-                        }
-                    },
-                ]
-            });
-        }
-
         function createDialogs() {
             function setScroll(id) {
                 let node = document.getElementById(id);
@@ -1301,59 +1274,43 @@
             setScroll("debugLogPanel");
 
             // タブ
-            $('.jquery .tabs li').click(function () {
-                var index = $('.jquery .tabs li').index(this);
-                g_app.setCurrentUnitIndex(index);
+            const tabItems = document.querySelectorAll('.jquery .tabs li');
+            tabItems.forEach((li, index) => {
+                li.addEventListener('click', () => {
+                    g_app.setCurrentUnitIndex(index);
+                });
             });
 
-            createDialog($("#mjolnirsStrikeSettingDialog"), "ミョルニル査定計算の設定", 370, 500, "#mapArea");
-            $("#ocrSettingDialog").dialog({
-                autoOpen: false,
-                modal: false,
-                title: "画像から自動設定",
-                width: 470,
-                height: 600,
-                closeText: "",
-                position: {
-                    my: "left bottom",
-                    at: "left bottom",
-                    of: "#mapArea"
-                },
+            initSimDialog("mjolnirsStrikeSettingDialog", "ミョルニル査定計算の設定");
+            initSimDialog("ocrSettingDialog", "画像から自動設定", {
                 buttons: [
                     {
-                        html: '<span class="dialog-button-text">設定開始</span>',
-                        class: 'dialog-button',
+                        text: '設定開始',
                         click: function () {
                             const files = document.getElementById("ocrSettingFile").files;
                             g_app.setUnitsByStatusImages(files);
-                            var closeDialog = $("#closesDialogAfterStartAnalysis")[0].checked;
-                            if (closeDialog) {
-                                $(this).dialog("close");
+                            var shouldClose = document.getElementById("closesDialogAfterStartAnalysis").checked;
+                            if (shouldClose) {
+                                closeDialogById('ocrSettingDialog');
                             }
                         }
                     },
-                    {
-                        html: '<span class="dialog-button-text">閉じる</span>',
-                        class: 'dialog-button',
-                        click: function () {
-                            $(this).dialog("close");
-                        }
-                    },
+                    { text: '閉じる', click: function () { closeDialogById('ocrSettingDialog'); } },
                 ]
             });
-            createDialog($("#durabilityTestDialog"), "耐久/殲滅力テスト", 490, 700);
-            createDialog($("#aetherRaidDefensePresetDialog"), "模擬戦相手の設定");
-            createDialog($("#itemDialog"), "アイテム");
-            createDialog($("#editMapDialog"), "マップ編集");
-            createDialog($("#setupResonantBattleEnemyDialog"), "双界の敵ステータス設定");
-            createDialog($("#autoClearDialog"), "お助けツール(開発中)");
-            createDialog($("#settingDialog"), "詳細設定", 370, 370, "#mapArea");
-            createDialog($("#exportDialog"), "設定のエクスポート", 370, 420, "#mapArea");
-            createDialog($("#importDialog"), "設定のインポート", 370, 420, "#mapArea");
-            createDialog($("#saveUnitDialog"), "ユニットの保存・読み込み", 500, 600);
+            initSimDialog("durabilityTestDialog", "耐久/殲滅力テスト", { width: 490 });
+            initSimDialog("aetherRaidDefensePresetDialog", "模擬戦相手の設定");
+            initSimDialog("itemDialog", "アイテム");
+            initSimDialog("editMapDialog", "マップ編集");
+            initSimDialog("setupResonantBattleEnemyDialog", "双界の敵ステータス設定");
+            initSimDialog("autoClearDialog", "お助けツール(開発中)");
+            initSimDialog("settingDialog", "詳細設定");
+            initSimDialog("exportDialog", "設定のエクスポート", { width: 370 });
+            initSimDialog("importDialog", "設定のインポート", { width: 370 });
+            initSimDialog("saveUnitDialog", "ユニットの保存・読み込み", { width: 500 });
         }
         function copyMapSourceCodeToClipboard() {
-            var textarea = $("#mapSourceCode")[0];
+            var textarea = document.getElementById("mapSourceCode");
             textarea.select();
             textarea.setSelectionRange(0, 99999);
             document.execCommand("copy");
@@ -1367,34 +1324,34 @@
             document.execCommand("copy");
         }
         function copyExportUrlToClipboard() {
-            var textarea = $("#exportUrl")[0];
+            var textarea = document.getElementById("exportUrl");
             textarea.select();
             textarea.setSelectionRange(0, 99999); /*For mobile devices*/
             document.execCommand("copy");
         }
         function copyExportTextToClipboard() {
-            var textarea = $("#exportText")[0];
+            var textarea = document.getElementById("exportText");
             textarea.select();
             textarea.setSelectionRange(0, 99999); /*For mobile devices*/
             document.execCommand("copy");
         }
         function pasteClipboardToImportText() {
             // セキュリティの都合で(コピーしたパスワードなどを取得できないように)多くのブラウザでは動作しない
-            var textarea = $("#importText")[0];
+            var textarea = document.getElementById("importText");
             textarea.focus();
             document.execCommand("paste");
         }
         function clearImportText() {
-            var textarea = $("#importText")[0];
+            var textarea = document.getElementById("importText");
             textarea.value = '';
         }
         function importTextFromInputText(text, compressMode = null) {
-            var loadsEnemySettings = $("#loadsEnemySettings")[0].checked;
-            var loadsAllySettings = $("#loadsAllySettings")[0].checked;
-            var loadsDefenceSettings = $("#loadsDefenceSettings")[0].checked;
-            var loadsOffenceSettings = $("#loadsOffenceSettings")[0].checked;
-            var loadsMapSettings = $("#loadsMapSettings")[0].checked;
-            var textarea = $("#importText")[0];
+            var loadsEnemySettings = document.getElementById("loadsEnemySettings").checked;
+            var loadsAllySettings = document.getElementById("loadsAllySettings").checked;
+            var loadsDefenceSettings = document.getElementById("loadsDefenceSettings").checked;
+            var loadsOffenceSettings = document.getElementById("loadsOffenceSettings").checked;
+            var loadsMapSettings = document.getElementById("loadsMapSettings").checked;
+            var textarea = document.getElementById("importText");
             importSettingsFromString(
                 text,
                 loadsAllySettings,
@@ -1405,13 +1362,13 @@
                 compressMode);
             g_appData.setGameMode(GameMode.SummonerDuels);
             updateAllUi();
-            var closeDialog = $("#closesDialogAfterImport")[0].checked;
+            var closeDialog = document.getElementById("closesDialogAfterImport").checked;
             if (closeDialog) {
-                $("#importDialog").dialog('close');
+                closeDialogById('importDialog');
             }
         }
         function importText() {
-            const textarea = $("#importText")[0];
+            const textarea = document.getElementById("importText");
             importTextFromInputText(textarea.value);
         }
 
@@ -1432,31 +1389,6 @@
         }
     </script>
 
-    <!-- jquery -->
-    <!-- <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
-        integrity="sha256-3edrmyuQ0w65f8gfBsqowzjJe2iM6n0nKciPUp8y+7E=" crossorigin="anonymous"></script> -->
-    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script> -->
-    <script src="https://fire-emblem.fun/js/jquery-3.7.0.min.js"></script>
-
-    <!-- jquery-ui -->
-    <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.min.css" media="print"
-        onload="this.media='all'">
-    <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
-
-    <!-- クッキー(実際は使ってないので消してもいいかも) -->
-    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
-
-    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
-
-    <!-- 文字列圧縮 -->
-    <script async src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js"></script>
-
-    <!-- 画像解析 -->
-    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.6/cropper.min.css" media="print"
-        onload="this.media='all'">
-    <script async type="text/javascript"
-        src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.6/cropper.min.js"></script>
-
     <!-- <script defer type="text/javascript" src="https://docs.opencv.org/4.2.0/opencv.js"></script> -->
 
 
diff --git a/Sources/SummonerDuelsSimulatorMain.js b/Sources/SummonerDuelsSimulatorMain.js
index 2b89d660..bcb6915e 100644
--- a/Sources/SummonerDuelsSimulatorMain.js
+++ b/Sources/SummonerDuelsSimulatorMain.js
@@ -1,6 +1,8 @@
 /// @file
 /// @brief シミュレーターのメインコードです。
 
+import { openDialogById, closeDialogById, initSimDialog } from './DialogUtil.js';
+import '@fortawesome/fontawesome-free/css/all.min.css';
 import { BattleSimulatorBase, resetPlacement, loadSettings, updateAllUi } from './BattleSimulatorBase.js';
 import { ScopedStopwatch, using_ } from './Utilities.js';
 import { g_appData } from './AppData.js';
@@ -142,6 +144,9 @@ function initAetherRaidBoard(
 
 // Initialization
 window.g_app = g_app;
+window.openDialogById = openDialogById;
+window.closeDialogById = closeDialogById;
+window.initSimDialog = initSimDialog;
 g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
 g_app.registerHeroOptions(heroInfos, false);
 initAetherRaidBoard(heroInfos);
diff --git a/Sources/Unit.js b/Sources/Unit.js
index 33879891..8cbd6d6d 100644
--- a/Sources/Unit.js
+++ b/Sources/Unit.js
@@ -1,3 +1,4 @@
+import LZString from 'lz-string';
 import { ObjectUtil, MathUtil, ArrayUtil } from './Utilities.js';
 import { BattleMapElement } from './BattleMapElement.js';
 import { BattleContext } from './BattleContext.js';
diff --git a/Sources/UnitBuilder.html b/Sources/UnitBuilder.html
index e54ebbd5..020d0bda 100644
--- a/Sources/UnitBuilder.html
+++ b/Sources/UnitBuilder.html
@@ -391,10 +391,6 @@
         }
     </style>
 
-    <!-- 重要なところは予め接続 -->
-    <link rel="preconnect" href="//cdnjs.cloudflare.com">
-    <link rel="preconnect" href="//code.jquery.com">
-
     <!-- ローディングアイコン -->
     <div class="sk-fading-circle" id="loader">
         <div class="feh_loading_anim"></div>
@@ -1160,34 +1156,6 @@
         </div>
     </script>
 
-    <!-- jquery -->
-    <!-- <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
-        integrity="sha256-3edrmyuQ0w65f8gfBsqowzjJe2iM6n0nKciPUp8y+7E=" crossorigin="anonymous"></script> -->
-    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script> -->
-    <script src="https://fire-emblem.fun/js/jquery-3.7.0.min.js"></script>
-
-
-    <!-- jquery-ui -->
-    <!-- <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.min.css" media="print"
-        onload="this.media='all'">
-    <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script> -->
-
-    <!-- クッキー(実際は使ってないので消してもいいかも) -->
-    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
-
-    <!-- 文字列圧縮 -->
-    <script async src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js"></script>
-
-    <!-- 画像解析 -->
-    <!-- <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.6/cropper.min.css" media="print"
-        onload="this.media='all'">
-    <script async type="text/javascript"
-        src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.6/cropper.min.js"></script> -->
-
-    <!-- <script defer type="text/javascript" src="https://docs.opencv.org/4.2.0/opencv.js"></script> -->
-
-
-
 
 
 
diff --git a/Sources/UnitBuilderMain.js b/Sources/UnitBuilderMain.js
index cbddef22..2fc49806 100644
--- a/Sources/UnitBuilderMain.js
+++ b/Sources/UnitBuilderMain.js
@@ -1,3 +1,4 @@
+import LZString from 'lz-string';
 import { BattleSimulatorBase, loadSettings } from './BattleSimulatorBase.js';
 import { ScopedStopwatch, using_, selectText } from './Utilities.js';
 import { g_appData } from './AppData.js';
@@ -97,7 +98,7 @@ function copyDebugLogToClipboard() {
 }
 
 function copyUrl() {
-    var textarea = $("#urlTextArea")[0];
+    var textarea = document.getElementById("urlTextArea");
     textarea.select();
     textarea.setSelectionRange(0, 99999); /*For mobile devices*/
     document.execCommand("copy");
@@ -127,7 +128,7 @@ function updateUrl() {
     // g_app.writeDebugLogLine(`■URLの更新`);
     let settingText = g_app.getCurrentSetting();
     g_appData.exportSettingUrl = g_explicitSiteRootPath + "?pid=1736&s=" + LZString.compressToEncodedURIComponent(settingText) + "#app";
-    let textarea = $("#urlTextArea")[0];
+    let textarea = document.getElementById("urlTextArea");
     textarea.textContent = settingText;
 }
 
diff --git a/Sources/VueComponents.js b/Sources/VueComponents.js
index d248b53d..15cc9b3e 100644
--- a/Sources/VueComponents.js
+++ b/Sources/VueComponents.js
@@ -4,6 +4,7 @@
 import { mapState, mapActions } from 'pinia';
 import { useMainStore } from './store.js';
 import { VueDraggable } from 'vue-draggable-plus';
+import { openDialogById, closeDialogById } from './DialogUtil.js';
 
 function initVueComponents(app) {
     app.component('battle-map', {
@@ -230,7 +231,7 @@ function initVueComponents(app) {
                              v-bind:style="battleSimulator.vm.debugMenuStyle">
                       <input v-if="appData.gameMode === GameMode.ResonantBattles" type="button"
                              value="双界の敵ステータス設定..." style="width:140px" class="buttonUi"
-                             @click="$('#setupResonantBattleEnemyDialog').dialog('open');">
+                             @click="openDialogById('setupResonantBattleEnemyDialog');">
                     </td>
                   </tr>
                   <tr>
@@ -1927,19 +1928,19 @@ function initVueComponents(app) {
                 this.resetPlacement();
             },
             openTeamFormationDialog() {
-                $('#teamFormationDialog').dialog('open');
+                openDialogById('teamFormationDialog');
             },
             openAetherRaidDialog() {
-                $('#aetherRaidDefensePresetDialog').dialog('open');
+                openDialogById('aetherRaidDefensePresetDialog');
             },
             openItemDialog() {
-                $('#itemDialog').dialog('open');
+                openDialogById('itemDialog');
             },
             openDurabilityTestDialog() {
-                $('#durabilityTestDialog').dialog('open');
+                openDialogById('durabilityTestDialog');
             },
             openEditMapDialog() {
-                $('#editMapDialog').dialog('open');
+                openDialogById('editMapDialog');
             },
             onCookieSettingChange(event) {
                 const isChecked = event.target.checked;
diff --git a/Sources/feh-battle-simulator.css b/Sources/feh-battle-simulator.css
index 4bc68add..9a4cc29b 100644
--- a/Sources/feh-battle-simulator.css
+++ b/Sources/feh-battle-simulator.css
@@ -348,6 +348,73 @@ select.skill {
     font-size: 14px;
 }
 
+/* Native dialog replacement for jQuery UI */
+.sim-dialog {
+    display: none;
+    position: fixed;
+    z-index: 1000;
+    left: 50%;
+    top: 50%;
+    transform: translate(-50%, -50%);
+    background: #fff;
+    border: 1px solid #aaa;
+    border-radius: 4px;
+    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
+    padding: 0;
+    max-height: 80vh;
+    overflow: auto;
+}
+
+.sim-dialog.dialog-open {
+    display: block;
+}
+
+.sim-dialog-overlay {
+    display: none;
+    position: fixed;
+    z-index: 999;
+    top: 0;
+    left: 0;
+    width: 100%;
+    height: 100%;
+    background: rgba(0, 0, 0, 0.3);
+}
+
+.sim-dialog-overlay.dialog-open {
+    display: block;
+}
+
+.sim-dialog-titlebar {
+    display: flex;
+    justify-content: space-between;
+    align-items: center;
+    padding: 8px 12px;
+    background: #e9e9e9;
+    border-bottom: 1px solid #ccc;
+    cursor: default;
+    font-weight: bold;
+    font-size: 14px;
+}
+
+.sim-dialog-titlebar .sim-dialog-close {
+    cursor: pointer;
+    border: none;
+    background: none;
+    font-size: 18px;
+    line-height: 1;
+    padding: 0 4px;
+}
+
+.sim-dialog-content {
+    padding: 12px;
+}
+
+.sim-dialog-buttonpane {
+    padding: 8px 12px;
+    text-align: right;
+    border-top: 1px solid #ccc;
+}
+
 input[type="checkbox"].fehButton {
     display: none;
 }
diff --git a/Tests/JqueryRemoval.test.js b/Tests/JqueryRemoval.test.js
new file mode 100644
index 00000000..9b284dfc
--- /dev/null
+++ b/Tests/JqueryRemoval.test.js
@@ -0,0 +1,255 @@
+/**
+ * Tests for jQuery removal (Section 11)
+ *
+ * Verifies that all jQuery and jQuery UI CDN references have been removed
+ * from HTML files, and that no jQuery API calls remain in JS source code.
+ */
+
+import { describe, it, expect } from 'vitest';
+import fs from 'fs';
+import path from 'path';
+
+const SOURCES_DIR = path.resolve(__dirname, '../Sources');
+
+const HTML_FILES = [
+    'AetherRaidSimulator.html',
+    'ArenaSimulator.html',
+    'SummonerDuelsSimulator.html',
+    'UnitBuilder.html',
+    'DamageCalculator.html',
+    'StatusCalculator.html',
+    'HeroIconLister.html',
+    'HeroStatusClusterer.html',
+];
+
+const JS_FILES = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.js'));
+
+// Helper: strip HTML comments from content
+function stripHtmlComments(content) {
+    return content.replace(/<!--[\s\S]*?-->/g, '');
+}
+
+// Helper: strip JS single-line comments
+function stripJsLineComments(content) {
+    return content.split('\n').map(line => {
+        // Remove // comments but preserve URLs (://)
+        return line.replace(/(?<![:"'])\/\/(?![\/:]).*/g, '');
+    }).join('\n');
+}
+
+describe('jQuery CDN removal', () => {
+    HTML_FILES.forEach(file => {
+        const filePath = path.join(SOURCES_DIR, file);
+        if (!fs.existsSync(filePath)) return;
+        const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
+
+        it(`${file} should not contain jQuery CDN script tags`, () => {
+            // No active <script> tags referencing jquery (case insensitive)
+            const scriptTags = content.match(/<script[^>]*src="[^"]*jquery[^"]*"[^>]*>/gi) || [];
+            expect(scriptTags).toEqual([]);
+        });
+
+        it(`${file} should not contain jQuery UI CDN script/link tags`, () => {
+            const jqueryUiTags = content.match(/<(?:script|link)[^>]*(?:jquery-ui|jqueryui)[^>]*>/gi) || [];
+            expect(jqueryUiTags).toEqual([]);
+        });
+
+        it(`${file} should not contain jQuery preconnect hints`, () => {
+            const preconnect = content.match(/<link[^>]*preconnect[^>]*jquery[^>]*>/gi) || [];
+            expect(preconnect).toEqual([]);
+        });
+    });
+});
+
+describe('jQuery API removal from JS', () => {
+    it('should have no $() or jQuery() calls in any JS file', () => {
+        const violations = [];
+        for (const file of JS_FILES) {
+            const content = stripJsLineComments(
+                fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8')
+            );
+            const lines = content.split('\n');
+            lines.forEach((line, i) => {
+                // Match $( but not ${ (template literals) or $. (money)
+                if (/\$\s*\(/.test(line) || /jQuery\s*\(/.test(line)) {
+                    violations.push(`${file}:${i + 1}: ${line.trim()}`);
+                }
+            });
+        }
+        expect(violations).toEqual([]);
+    });
+
+    it('should have no $.fn or $.ajax references in any JS file', () => {
+        const violations = [];
+        for (const file of JS_FILES) {
+            const content = stripJsLineComments(
+                fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8')
+            );
+            const lines = content.split('\n');
+            lines.forEach((line, i) => {
+                if (/\$\.fn/.test(line) || /\$\.ajax/.test(line)) {
+                    violations.push(`${file}:${i + 1}: ${line.trim()}`);
+                }
+            });
+        }
+        expect(violations).toEqual([]);
+    });
+
+    it('should have no .dialog() calls in JS files', () => {
+        const violations = [];
+        for (const file of JS_FILES) {
+            const content = stripJsLineComments(
+                fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8')
+            );
+            const lines = content.split('\n');
+            lines.forEach((line, i) => {
+                if (/\.dialog\s*\(/.test(line)) {
+                    violations.push(`${file}:${i + 1}: ${line.trim()}`);
+                }
+            });
+        }
+        expect(violations).toEqual([]);
+    });
+
+    it('should have no .progressbar() calls in JS files', () => {
+        const violations = [];
+        for (const file of JS_FILES) {
+            const content = stripJsLineComments(
+                fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8')
+            );
+            const lines = content.split('\n');
+            lines.forEach((line, i) => {
+                if (/\.progressbar\s*\(/.test(line)) {
+                    violations.push(`${file}:${i + 1}: ${line.trim()}`);
+                }
+            });
+        }
+        expect(violations).toEqual([]);
+    });
+});
+
+describe('jQuery API removal from HTML inline scripts', () => {
+    HTML_FILES.forEach(file => {
+        const filePath = path.join(SOURCES_DIR, file);
+        if (!fs.existsSync(filePath)) return;
+
+        it(`${file} should not contain $() calls in inline scripts`, () => {
+            const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
+            // Extract inline script blocks
+            const scriptBlocks = content.match(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi) || [];
+            // Also check @click and other Vue event handlers
+            const vueHandlers = content.match(/@(?:click|change|input)\s*=\s*"[^"]*"/gi) || [];
+
+            const violations = [];
+            for (const block of scriptBlocks) {
+                // Skip external script tags
+                if (/src\s*=/.test(block.split('>')[0])) continue;
+                const lines = block.split('\n');
+                lines.forEach((line, i) => {
+                    const stripped = line.replace(/\/\/.*$/, '');
+                    if (/\$\s*\(/.test(stripped) || /\.dialog\s*\(/.test(stripped)) {
+                        violations.push(`${file} script:${i + 1}: ${line.trim()}`);
+                    }
+                });
+            }
+            for (const handler of vueHandlers) {
+                if (/\$\s*\(/.test(handler) || /\.dialog\s*\(/.test(handler)) {
+                    violations.push(`${file} handler: ${handler}`);
+                }
+            }
+            expect(violations).toEqual([]);
+        });
+    });
+});
+
+describe('LZ-String npm migration', () => {
+    it('should not have LZ-String CDN script tags in any HTML file', () => {
+        const violations = [];
+        for (const file of HTML_FILES) {
+            const filePath = path.join(SOURCES_DIR, file);
+            if (!fs.existsSync(filePath)) continue;
+            const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
+            if (/<script[^>]*lz-string[^>]*>/i.test(content)) {
+                violations.push(file);
+            }
+        }
+        expect(violations).toEqual([]);
+    });
+
+    it('should import LZString from npm package in source files that use it', () => {
+        const lzStringUsers = ['AppData.js', 'Unit.js', 'UnitBuilderMain.js', 'SettingManager.js'];
+        for (const file of lzStringUsers) {
+            const content = fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8');
+            if (/LZString\./.test(content)) {
+                expect(content).toMatch(/import\s+LZString\s+from\s+['"]lz-string['"]/);
+            }
+        }
+    });
+
+    it('should compress and decompress data correctly', async () => {
+        const LZString = (await import('lz-string')).default;
+        const testData = 'Hello, FEH Battle Simulator! 日本語テスト 🎮';
+
+        // EncodedURIComponent roundtrip
+        const compressed = LZString.compressToEncodedURIComponent(testData);
+        expect(LZString.decompressFromEncodedURIComponent(compressed)).toBe(testData);
+
+        // Base64 roundtrip
+        const compressedB64 = LZString.compressToBase64(testData);
+        expect(LZString.decompressFromBase64(compressedB64)).toBe(testData);
+
+        // UTF16 roundtrip
+        const compressedUtf16 = LZString.compressToUTF16(testData);
+        expect(LZString.decompressFromUTF16(compressedUtf16)).toBe(testData);
+    });
+});
+
+describe('CropperJS npm migration', () => {
+    it('should not have CropperJS CDN script/link tags in any HTML file', () => {
+        const violations = [];
+        for (const file of HTML_FILES) {
+            const filePath = path.join(SOURCES_DIR, file);
+            if (!fs.existsSync(filePath)) continue;
+            const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
+            if (/<(?:script|link)[^>]*cropperjs[^>]*>/i.test(content)) {
+                violations.push(file);
+            }
+        }
+        expect(violations).toEqual([]);
+    });
+
+    it('should import Cropper from npm package in Main_ImageProcessing.js', () => {
+        const content = fs.readFileSync(path.join(SOURCES_DIR, 'Main_ImageProcessing.js'), 'utf-8');
+        expect(content).toMatch(/import\s+Cropper\s+from\s+['"]cropperjs['"]/);
+    });
+});
+
+describe('Font Awesome migration', () => {
+    it('should not have Font Awesome CDN link tags in any HTML file', () => {
+        const violations = [];
+        for (const file of HTML_FILES) {
+            const filePath = path.join(SOURCES_DIR, file);
+            if (!fs.existsSync(filePath)) continue;
+            const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
+            if (/<link[^>]*font-?awesome[^>]*>/i.test(content)) {
+                violations.push(file);
+            }
+        }
+        expect(violations).toEqual([]);
+    });
+});
+
+describe('Select2 CDN removal (verified from Section 09)', () => {
+    it('should not have Select2 CDN tags in any HTML file', () => {
+        const violations = [];
+        for (const file of HTML_FILES) {
+            const filePath = path.join(SOURCES_DIR, file);
+            if (!fs.existsSync(filePath)) continue;
+            const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
+            if (/<(?:script|link)[^>]*select2[^>]*>/i.test(content)) {
+                violations.push(file);
+            }
+        }
+        expect(violations).toEqual([]);
+    });
+});
diff --git a/package-lock.json b/package-lock.json
index 1a92f1e7..5075d429 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -9,6 +9,9 @@
       "version": "1.0.0",
       "license": "MIT",
       "dependencies": {
+        "@fortawesome/fontawesome-free": "^7.2.0",
+        "cropperjs": "^2.1.0",
+        "lz-string": "^1.5.0",
         "pinia": "^3.0.4",
         "vue": "^3.5.30",
         "vue-draggable-plus": "^0.6.1"
@@ -529,6 +532,126 @@
       "integrity": "sha512-0hYQ8SB4Db5zvZB4axdMHGwEaQjkZzFjQiN9LVYvIFB2nSUHW9tYpxWriPrWDASIxiaXax83REcLxuSdnGPZtw==",
       "dev": true
     },
+    "node_modules/@cropper/element": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element/-/element-2.1.0.tgz",
+      "integrity": "sha512-2zELddqHQNmlvkPoiYzE5nxEjPE+C8nXoTPuvV3FvLp3YjBinc7qb73Icg9UXP0o9qC4+h9q96JgGo0AyMO/Ng==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "node_modules/@cropper/element-canvas": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-canvas/-/element-canvas-2.1.0.tgz",
+      "integrity": "sha512-el+rfJpZxsD2q5XxDBA4fRczcrOqB65Lb7roqXOq8LKufwf4bPWA9C6DjNJJahh/TP94dsLIEy3tSkgRMDv3Aw==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "node_modules/@cropper/element-crosshair": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-crosshair/-/element-crosshair-2.1.0.tgz",
+      "integrity": "sha512-0V589dAx8uZAfvJwdINLn76gfPQEafPH94ukjJ76uX0FCUovLaAVX+VRD/MDSYn0Mza/xejzmL9Dhd1DfemvmA==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "node_modules/@cropper/element-grid": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-grid/-/element-grid-2.1.0.tgz",
+      "integrity": "sha512-dEnk0rO+vp553LMvsPYgfrqVFcYXeVFrgFeavBYYEhAXtO40p7kN4rmLYLMMjaN+T/Mx2BATv6kUQpALKy2HLw==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "node_modules/@cropper/element-handle": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-handle/-/element-handle-2.1.0.tgz",
+      "integrity": "sha512-8BklWA4C/2GGAULupIWleSnGutECvYt3vx9flodqDfZpDEozws4LgLqmmzVuQmVkRVUdLnXdtx28kjgWLtzkHg==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "node_modules/@cropper/element-image": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-image/-/element-image-2.1.0.tgz",
+      "integrity": "sha512-mXOV8ixJvG0XtTxLebYAKDjEkFbFOQnsF02hXPZk1yQSV0J+LLhN7a2NePrtKnoTsEV19fhhX3UorMoyGGxvzg==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/element-canvas": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "node_modules/@cropper/element-selection": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-selection/-/element-selection-2.1.0.tgz",
+      "integrity": "sha512-mtFtBl6HIa/s9TWohXw+Z5eJoeYTqylrIcHvS7oVv0uM7IyeRwBW65Q7z+KtLfq/LW+2Sw/XDyvR+VN/DawBPw==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/element-canvas": "^2.1.0",
+        "@cropper/element-image": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "node_modules/@cropper/element-shade": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-shade/-/element-shade-2.1.0.tgz",
+      "integrity": "sha512-zMdyqbb0lc0Vd1oj2Z1miIZvhyZG41OXMHvrNt0hNwblh0dVdrvtw48lnFDgRv+672vt2CNx7Q04GuvCQfPlgg==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/element-canvas": "^2.1.0",
+        "@cropper/element-selection": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "node_modules/@cropper/element-viewer": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-viewer/-/element-viewer-2.1.0.tgz",
+      "integrity": "sha512-XnxlQuqHitd1FOFZ6E0yXAF5NYd/LyIvONLLHI9p1rJw747WYKUPxQaSYtFKF7IOizJu/8mMj++Zc1dZ5ZP3YQ==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/element-canvas": "^2.1.0",
+        "@cropper/element-image": "^2.1.0",
+        "@cropper/element-selection": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "node_modules/@cropper/elements": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/elements/-/elements-2.1.0.tgz",
+      "integrity": "sha512-qvzlYDn3VQgPPpsCu6Gi1XUO0v3vpXQFSjjxcVijbXeNsl/eiKrN7H9/CEiRgi5vr8kXfd7ZvgYxBjUBbH+y+w==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/element-canvas": "^2.1.0",
+        "@cropper/element-crosshair": "^2.1.0",
+        "@cropper/element-grid": "^2.1.0",
+        "@cropper/element-handle": "^2.1.0",
+        "@cropper/element-image": "^2.1.0",
+        "@cropper/element-selection": "^2.1.0",
+        "@cropper/element-shade": "^2.1.0",
+        "@cropper/element-viewer": "^2.1.0"
+      }
+    },
+    "node_modules/@cropper/utils": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/utils/-/utils-2.1.0.tgz",
+      "integrity": "sha512-wLtpZ4/UWgo+fGmG8NBWge8x5ehjfDe9ovleDfLy8kpwFaw43XXOEXQtRL1UNr0u4JZxaeO8FcXcolRWUUrlRQ==",
+      "license": "MIT"
+    },
     "node_modules/@emnapi/core": {
       "version": "1.9.1",
       "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.9.1.tgz",
@@ -638,6 +761,15 @@
         "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
       }
     },
+    "node_modules/@fortawesome/fontawesome-free": {
+      "version": "7.2.0",
+      "resolved": "https://registry.npmjs.org/@fortawesome/fontawesome-free/-/fontawesome-free-7.2.0.tgz",
+      "integrity": "sha512-3DguDv/oUE+7vjMeTSOjCSG+KeawgVQOHrKRnvUuqYh1mfArrh7s+s8hXW3e4RerBA1+Wh+hBqf8sJNpqNrBWg==",
+      "license": "(CC-BY-4.0 AND OFL-1.1 AND MIT)",
+      "engines": {
+        "node": ">=6"
+      }
+    },
     "node_modules/@humanwhocodes/config-array": {
       "version": "0.11.14",
       "resolved": "https://registry.npmjs.org/@humanwhocodes/config-array/-/config-array-0.11.14.tgz",
@@ -2448,6 +2580,16 @@
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
       }
     },
+    "node_modules/cropperjs": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/cropperjs/-/cropperjs-2.1.0.tgz",
+      "integrity": "sha512-SsSDqdVRl+mjbIBkGWlk1gCGcc+HzBqCbH5EQ+1tkAFUdxq2KUGukXF1RqhmvXrrdrX7PDwSUkWgXS7E36KvGQ==",
+      "license": "MIT",
+      "dependencies": {
+        "@cropper/elements": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
     "node_modules/cross-spawn": {
       "version": "7.0.6",
       "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz",
@@ -4794,7 +4936,7 @@
       "version": "1.5.0",
       "resolved": "https://registry.npmjs.org/lz-string/-/lz-string-1.5.0.tgz",
       "integrity": "sha512-h5bgJWpxJNswbU7qCrV0tIKQCaS3blPDrqKWx+QxzuzL1zGUzij9XCWLrSLsJPu5t+eWA/ycetzYAO5IOMcWAQ==",
-      "dev": true,
+      "license": "MIT",
       "bin": {
         "lz-string": "bin/bin.js"
       }
@@ -6929,6 +7071,115 @@
       "integrity": "sha512-0hYQ8SB4Db5zvZB4axdMHGwEaQjkZzFjQiN9LVYvIFB2nSUHW9tYpxWriPrWDASIxiaXax83REcLxuSdnGPZtw==",
       "dev": true
     },
+    "@cropper/element": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element/-/element-2.1.0.tgz",
+      "integrity": "sha512-2zELddqHQNmlvkPoiYzE5nxEjPE+C8nXoTPuvV3FvLp3YjBinc7qb73Icg9UXP0o9qC4+h9q96JgGo0AyMO/Ng==",
+      "requires": {
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "@cropper/element-canvas": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-canvas/-/element-canvas-2.1.0.tgz",
+      "integrity": "sha512-el+rfJpZxsD2q5XxDBA4fRczcrOqB65Lb7roqXOq8LKufwf4bPWA9C6DjNJJahh/TP94dsLIEy3tSkgRMDv3Aw==",
+      "requires": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "@cropper/element-crosshair": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-crosshair/-/element-crosshair-2.1.0.tgz",
+      "integrity": "sha512-0V589dAx8uZAfvJwdINLn76gfPQEafPH94ukjJ76uX0FCUovLaAVX+VRD/MDSYn0Mza/xejzmL9Dhd1DfemvmA==",
+      "requires": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "@cropper/element-grid": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-grid/-/element-grid-2.1.0.tgz",
+      "integrity": "sha512-dEnk0rO+vp553LMvsPYgfrqVFcYXeVFrgFeavBYYEhAXtO40p7kN4rmLYLMMjaN+T/Mx2BATv6kUQpALKy2HLw==",
+      "requires": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "@cropper/element-handle": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-handle/-/element-handle-2.1.0.tgz",
+      "integrity": "sha512-8BklWA4C/2GGAULupIWleSnGutECvYt3vx9flodqDfZpDEozws4LgLqmmzVuQmVkRVUdLnXdtx28kjgWLtzkHg==",
+      "requires": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "@cropper/element-image": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-image/-/element-image-2.1.0.tgz",
+      "integrity": "sha512-mXOV8ixJvG0XtTxLebYAKDjEkFbFOQnsF02hXPZk1yQSV0J+LLhN7a2NePrtKnoTsEV19fhhX3UorMoyGGxvzg==",
+      "requires": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/element-canvas": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "@cropper/element-selection": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-selection/-/element-selection-2.1.0.tgz",
+      "integrity": "sha512-mtFtBl6HIa/s9TWohXw+Z5eJoeYTqylrIcHvS7oVv0uM7IyeRwBW65Q7z+KtLfq/LW+2Sw/XDyvR+VN/DawBPw==",
+      "requires": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/element-canvas": "^2.1.0",
+        "@cropper/element-image": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "@cropper/element-shade": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-shade/-/element-shade-2.1.0.tgz",
+      "integrity": "sha512-zMdyqbb0lc0Vd1oj2Z1miIZvhyZG41OXMHvrNt0hNwblh0dVdrvtw48lnFDgRv+672vt2CNx7Q04GuvCQfPlgg==",
+      "requires": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/element-canvas": "^2.1.0",
+        "@cropper/element-selection": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "@cropper/element-viewer": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/element-viewer/-/element-viewer-2.1.0.tgz",
+      "integrity": "sha512-XnxlQuqHitd1FOFZ6E0yXAF5NYd/LyIvONLLHI9p1rJw747WYKUPxQaSYtFKF7IOizJu/8mMj++Zc1dZ5ZP3YQ==",
+      "requires": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/element-canvas": "^2.1.0",
+        "@cropper/element-image": "^2.1.0",
+        "@cropper/element-selection": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
+    "@cropper/elements": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/elements/-/elements-2.1.0.tgz",
+      "integrity": "sha512-qvzlYDn3VQgPPpsCu6Gi1XUO0v3vpXQFSjjxcVijbXeNsl/eiKrN7H9/CEiRgi5vr8kXfd7ZvgYxBjUBbH+y+w==",
+      "requires": {
+        "@cropper/element": "^2.1.0",
+        "@cropper/element-canvas": "^2.1.0",
+        "@cropper/element-crosshair": "^2.1.0",
+        "@cropper/element-grid": "^2.1.0",
+        "@cropper/element-handle": "^2.1.0",
+        "@cropper/element-image": "^2.1.0",
+        "@cropper/element-selection": "^2.1.0",
+        "@cropper/element-shade": "^2.1.0",
+        "@cropper/element-viewer": "^2.1.0"
+      }
+    },
+    "@cropper/utils": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/@cropper/utils/-/utils-2.1.0.tgz",
+      "integrity": "sha512-wLtpZ4/UWgo+fGmG8NBWge8x5ehjfDe9ovleDfLy8kpwFaw43XXOEXQtRL1UNr0u4JZxaeO8FcXcolRWUUrlRQ=="
+    },
     "@emnapi/core": {
       "version": "1.9.1",
       "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.9.1.tgz",
@@ -7015,6 +7266,11 @@
       "integrity": "sha512-Ys+3g2TaW7gADOJzPt83SJtCDhMjndcDMFVQ/Tj9iA1BfJzFKD9mAUXT3OenpuPHbI6P/myECxRJrofUsDx/5g==",
       "dev": true
     },
+    "@fortawesome/fontawesome-free": {
+      "version": "7.2.0",
+      "resolved": "https://registry.npmjs.org/@fortawesome/fontawesome-free/-/fontawesome-free-7.2.0.tgz",
+      "integrity": "sha512-3DguDv/oUE+7vjMeTSOjCSG+KeawgVQOHrKRnvUuqYh1mfArrh7s+s8hXW3e4RerBA1+Wh+hBqf8sJNpqNrBWg=="
+    },
     "@humanwhocodes/config-array": {
       "version": "0.11.14",
       "resolved": "https://registry.npmjs.org/@humanwhocodes/config-array/-/config-array-0.11.14.tgz",
@@ -8326,6 +8582,15 @@
         "prompts": "^2.0.1"
       }
     },
+    "cropperjs": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/cropperjs/-/cropperjs-2.1.0.tgz",
+      "integrity": "sha512-SsSDqdVRl+mjbIBkGWlk1gCGcc+HzBqCbH5EQ+1tkAFUdxq2KUGukXF1RqhmvXrrdrX7PDwSUkWgXS7E36KvGQ==",
+      "requires": {
+        "@cropper/elements": "^2.1.0",
+        "@cropper/utils": "^2.1.0"
+      }
+    },
     "cross-spawn": {
       "version": "7.0.6",
       "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz",
@@ -9963,8 +10228,7 @@
     "lz-string": {
       "version": "1.5.0",
       "resolved": "https://registry.npmjs.org/lz-string/-/lz-string-1.5.0.tgz",
-      "integrity": "sha512-h5bgJWpxJNswbU7qCrV0tIKQCaS3blPDrqKWx+QxzuzL1zGUzij9XCWLrSLsJPu5t+eWA/ycetzYAO5IOMcWAQ==",
-      "dev": true
+      "integrity": "sha512-h5bgJWpxJNswbU7qCrV0tIKQCaS3blPDrqKWx+QxzuzL1zGUzij9XCWLrSLsJPu5t+eWA/ycetzYAO5IOMcWAQ=="
     },
     "magic-string": {
       "version": "0.30.21",
diff --git a/package.json b/package.json
index 36d94b5a..ca1d6631 100644
--- a/package.json
+++ b/package.json
@@ -39,6 +39,9 @@
     "vitest": "^4.1.0"
   },
   "dependencies": {
+    "@fortawesome/fontawesome-free": "^7.2.0",
+    "cropperjs": "^2.1.0",
+    "lz-string": "^1.5.0",
     "pinia": "^3.0.4",
     "vue": "^3.5.30",
     "vue-draggable-plus": "^0.6.1"
