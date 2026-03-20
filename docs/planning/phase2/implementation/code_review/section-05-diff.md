diff --git a/Sources/HeroDatabase.js b/Sources/HeroDatabase.js
index 34c472a1..14116381 100644
--- a/Sources/HeroDatabase.js
+++ b/Sources/HeroDatabase.js
@@ -108,3 +108,5 @@ class HeroDatabase {
         return this._idToIndexDict.get(heroId);
     }
 }
+
+export { HeroDatabase };
diff --git a/Sources/HeroInfo.js b/Sources/HeroInfo.js
index 4ba87ff3..56074f77 100644
--- a/Sources/HeroInfo.js
+++ b/Sources/HeroInfo.js
@@ -1,3 +1,8 @@
+import { SkillType, NoneOption } from './SkillConstants.js';
+import { stringToWeaponType, weaponTypeToString, isWeaponTypeDagger, isWeaponTypeBow, isWeaponTypeBreath, isWeaponTypeBeast, isInheritableWeaponType, isRefreshSupportSkill } from './Skill.js';
+import { StatusType, MoveType, UnitRarity, IvType, BookVersions, isLegendarySeason, getGrowthRateOfStar5, calcGrowthValue, __getStatusRankValue } from './HeroInfoConstants.js';
+import { g_siteRootPath, g_heroIconRootPath } from './GlobalDefinitions.js';
+
 /**
  * @file
  * @brief HeroInfo クラスやそれに関連する関数や変数定義です。
@@ -661,3 +666,5 @@ class HeroInfo {
         }
     }
 }
+
+export { HeroInfo };
diff --git a/Sources/SampleHeroInfos.js b/Sources/SampleHeroInfos.js
index 6cd37f6c..4d110071 100644
--- a/Sources/SampleHeroInfos.js
+++ b/Sources/SampleHeroInfos.js
@@ -1,3 +1,6 @@
+import { HeroInfo } from './HeroInfo.js';
+import { MoveType, SeasonType, BlessingType } from './HeroInfoConstants.js';
+
 const heroInfos = [
   new HeroInfo('ウェンディ', 'Gwendolyn.png', MoveType.Armor, '槍', 1, 49, 30, 24, 38, 28, 23, 8, 5, 12, 6, '0/0', '0/0', '0/0', '0/0', '0/0', 74, -1, 477, -1, 590, 698, -1, SeasonType.None, BlessingType.None, '可憐な重騎士', ['ウェンディ',], 0, [1307, 74,], [], 1, false, '封印の剣', 'ガチャ', '2017-02-02', [477,], [], [590,], [698,], [], ''),
   new HeroInfo('シーマ', 'Sheena.png', MoveType.Armor, '斧', 1, 45, 30, 25, 36, 33, 21, 8, 6, 12, 7, '0/0', '0/0', '0/0', '0/0', '0/0', 125, -1, 477, 565, -1, 699, -1, SeasonType.None, BlessingType.None, 'グラの王女', ['シーマ',], 0, [1385, 125,], [], 2, true, '紋章の謎', 'ガチャ', '2017-02-02', [477,], [565,], [], [699,], [], ''),
@@ -1391,3 +1394,5 @@ const heroInfos = [
   new HeroInfo('救世フィヨルム', 'KyuseiFjorm-Icon.png', MoveType.Infantry, '槍', 1, 39, 45, 48, 34, 38, 17, 12, 9, 12, 8, '0/0', '0/0', '0/0', '0/0', '0/0', 3575, -1, 3576, 3405, 3367, 3577, -1, SeasonType.Water, BlessingType.None, '氷宿す王女', ['フィヨルム',], 220, [3575,], [], 1397, false, 'ヒーローズ', '救世英雄', '2026-02-16', [3576,], [3405,], [3367,], [3577,], [], '|救世水|死闘220|'),
   new HeroInfo('神階チキ', 'MythicTiki-Icon.png', MoveType.Armor, '無竜', 1, 52, 48, 16, 47, 49, 26, 11, 3, 12, 10, '0/0', '0/0', '0/0', '0/0', '0/0', 3578, -1, 3579, 3257, 3580, 3119, -1, SeasonType.Light, BlessingType.Hp5_Def5, '悠久を生きる巫女', ['チキ',], 0, [3578,], [], 1398, false, '覚醒', '神階英雄ガチャ', '2026-02-27', [3579,], [3257,], [3580,], [3119,], [], '|神階光|枠追加|Hp5_Def5|')
 ];
+
+export { heroInfos };
diff --git a/Sources/SampleSkillInfos.js b/Sources/SampleSkillInfos.js
index 5c64220e..4d285a08 100644
--- a/Sources/SampleSkillInfos.js
+++ b/Sources/SampleSkillInfos.js
@@ -1,3 +1,7 @@
+import { SkillInfo } from './Skill.js';
+import { SkillType, WeaponType, AssistType, EffectiveType } from './SkillConstants.js';
+import { MoveType } from './HeroInfoConstants.js';
+
 const weaponInfos = [
   new SkillInfo(1, '鉄の剣', 6, 0, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 6, false, false, AssistType.None, true, 0, WeaponType.Sword, 50, true, [WeaponType.All], [MoveType.Infantry,MoveType.Armor,MoveType.Flying,MoveType.Cavalry], false, false, '', SkillType.Weapon),
   new SkillInfo(2, '鋼の剣', 8, 0, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 8, false, false, AssistType.None, true, 0, WeaponType.Sword, 100, true, [WeaponType.All], [MoveType.Infantry,MoveType.Armor,MoveType.Flying,MoveType.Cavalry], false, false, '', SkillType.Weapon),
@@ -3608,3 +3612,5 @@ const captainInfos = [
   new SkillInfo(2963, '寒気凛烈', 0, 0, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false, 0, false, false, AssistType.None, false, 0, WeaponType.None, 0, true, [WeaponType.All], [MoveType.Infantry,MoveType.Armor,MoveType.Flying,MoveType.Cavalry], false, false, '', SkillType.Captain)
 ];
 
+
+export { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos };
diff --git a/Sources/SkillDatabase.js b/Sources/SkillDatabase.js
index b697de27..553f610c 100644
--- a/Sources/SkillDatabase.js
+++ b/Sources/SkillDatabase.js
@@ -1,3 +1,4 @@
+import { SkillType } from './SkillConstants.js';
 
 class SkillDatabase {
     constructor() {
@@ -101,3 +102,5 @@ class SkillDatabase {
         }
     }
 }
+
+export { SkillDatabase };
