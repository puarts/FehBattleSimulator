diff --git a/Sources/AudioManager.js b/Sources/AudioManager.js
index 9208af63..da24bdae 100644
--- a/Sources/AudioManager.js
+++ b/Sources/AudioManager.js
@@ -221,3 +221,5 @@ class AudioManager {
         this._bgmList[id] = audio;
     }
 }
+
+export { SoundEffectId, BgmId, AudioManager };
diff --git a/Sources/BattleMapElement.js b/Sources/BattleMapElement.js
index 75642311..c7f3db73 100644
--- a/Sources/BattleMapElement.js
+++ b/Sources/BattleMapElement.js
@@ -13,4 +13,6 @@ class BattleMapElement {
     get pos() {
         return [this.posX, this.posY];
     }
-}
\ No newline at end of file
+}
+
+export { BattleMapElement };
\ No newline at end of file
diff --git a/Sources/Cell.js b/Sources/Cell.js
index 1c651492..a9da5281 100644
--- a/Sources/Cell.js
+++ b/Sources/Cell.js
@@ -68,3 +68,5 @@ class Cell {
         }
     }
 }
+
+export { CellType, Cell };
diff --git a/Sources/GlobalDefinitions.js b/Sources/GlobalDefinitions.js
index 43b18d6a..b0b1b554 100644
--- a/Sources/GlobalDefinitions.js
+++ b/Sources/GlobalDefinitions.js
@@ -35,3 +35,5 @@ const G_PASSIVE_B_ID_BASE = 140_000;
 const G_PASSIVE_C_ID_BASE = 150_000;
 const G_PASSIVE_S_ID_BASE = 160_000;
 const G_PASSIVE_X_ID_BASE = 170_000;
+
+export { g_siteRootPath, g_explicitSiteRootPath, g_imageRootPath, g_corsImageRootPath, g_audioRootPath, g_heroIconRootPath, g_skillIconRootPath, g_iconRootPath, TurnSettingCookiePrefix, UnitCookiePrefix, StructureCookiePrefix, TileCookiePrefix, TurnWideCookieId, NameValueDelimiter, ElemDelimiter, ValueDelimiter, ArrayValueElemDelimiter, DebugModeDefault, TabChar, G_SKILL_LOG_LEVEL, g_debugImageRootPath, g_debugSkillIconRootPath, G_DEV_SKILL_NUM, G_WEAPON_ID_BASE, G_ASSIST_ID_BASE, G_SPECIAL_ID_BASE, G_PASSIVE_A_ID_BASE, G_PASSIVE_B_ID_BASE, G_PASSIVE_C_ID_BASE, G_PASSIVE_S_ID_BASE, G_PASSIVE_X_ID_BASE };
diff --git a/Sources/Logger.js b/Sources/Logger.js
index dcb1eda6..8fd153a8 100644
--- a/Sources/Logger.js
+++ b/Sources/Logger.js
@@ -1,3 +1,5 @@
+import { ObjectUtil } from './Utilities.js';
+
 /**
  * @abstract
  */
@@ -612,3 +614,5 @@ const DetailUtils = Object.freeze({
         return _entries.map(([value, label]) => ({text: label, value}));
     },
 });
+
+export { LoggerBase, GroupLog, GroupLogger, SimpleLogger, HtmlLogger, ConsoleLogger, DetailLevel, DetailLabels, DetailUtils };
diff --git a/Sources/Table.js b/Sources/Table.js
index 834d3bd1..34cdba0e 100644
--- a/Sources/Table.js
+++ b/Sources/Table.js
@@ -1,3 +1,5 @@
+import { Cell, CellType } from './Cell.js';
+
 /// @file
 /// @brief Table クラスとそれに関連するクラスや関数等の定義です。
 
@@ -325,4 +327,6 @@ class Table {
         html += "</table>";
         return html;
     }
-}
\ No newline at end of file
+}
+
+export { getCellId, getPositionFromCellId, updateCellBgColor, setCellFocusBorder, clearCellFocusStyle, BackgroundImageInfo, Table };
\ No newline at end of file
diff --git a/Sources/Utilities.js b/Sources/Utilities.js
index 6b44e97f..97409f3a 100644
--- a/Sources/Utilities.js
+++ b/Sources/Utilities.js
@@ -2815,4 +2815,6 @@ class TileQuery extends Query {
         }
         return this.filter(tile => tile.calculateDistanceToUnit(unit) <= unit.moveCountForCanto);
     }
-}
\ No newline at end of file
+}
+
+export { NULL_OBJECT, ObjectUtil, TreeNode, Stack, Queue, CookieWriter, LocalStorageUtil, KeyboardManager, IdGenerator, ObjectStorage, StructureContainer, ScopedStopwatch, ScopedPerformanceTimer, Stopwatch, CommandType, Command, CommandQueue, ErrorCorrectionValue, sleep, startProgressiveProcess, using_, getFirstElementByTagName, distinct, distinctStr, toBoolean, calcDistance, boolToInt, intToBool, calcSimilarity, adjustChars, levenshtein, cropCanvas, manipurateHsv, cropAndPostProcessAndOcr, executeTesseractRecognize, cropAndBinarizeImageAndOcr, combineText, convertOcrResultToArray, getMaxLengthElem, getMaxLengthElem2, loadImage, loadFile, loadAndProcessImage, matTypeToString, getRandomInt, selectText, importJs, dateStrToNumber, floorNumberWithFloatError, truncNumberWithFloatError, roundFloat, getIncHtml, getSpecialChargedImgTag, getDivineVeinTag, getDivineVeinImgPath, getDivineVeinPath, getDivineVeinTitle, getSkillIconDivTag, getStatsEffectImgTagStr, getStatsEffectImgTag, getKeyByValue, IterUtil, GeneratorUtil, ArrayUtil, SetUtil, MathUtil, DebugUtil, MapUtil, HtmlLogUtil, Base62, Base62Util, JsonUtil, Query, UnitQuery, TileQuery };
\ No newline at end of file
