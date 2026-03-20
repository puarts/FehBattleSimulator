diff --git a/Sources/HeroInfoConstants.js b/Sources/HeroInfoConstants.js
index 03ec3d8f..3e216a41 100644
--- a/Sources/HeroInfoConstants.js
+++ b/Sources/HeroInfoConstants.js
@@ -1,3 +1,5 @@
+import { g_heroIconRootPath } from './GlobalDefinitions.js';
+
 const UnitRarity = {
     Star1: 1,
     Star2: 2,
@@ -395,3 +397,9 @@ function isDefenseMythicSeasonType(season) {
 function isLegendarySeasonType(season) {
     return season !== SeasonType.None && !isMythicSeasonType(season);
 }
+
+export { UnitRarity, StatusType, MoveType, SeasonType, IvType, BlessingType, BlessingTypeOptions, BookVersions, GrowthRateOfStar5, StatusRankTable };
+export { moveTypeIconPath, getSeasonTypeName, isLegendarySeason, isAetherRaidAllySeason, isAetherRaidEnemySeason };
+export { getGrowthRateOfStar5, calcAppliedGrowthRate, calcAppliedGrowthRate_Optimized, calcGrowthValue, calcStatusLvN, getGrowthAmountOfStar5FromPureGrowthRate };
+export { getFlowStatus, getAssetStatus, statusTypeToShortString, statusTypeToString, nameToStatusType, statusIndexStr };
+export { isMythicSeasonType, isOffenseMythicSeasonType, isDefenseMythicSeasonType, isLegendarySeasonType };
diff --git a/Sources/SkillConstants.js b/Sources/SkillConstants.js
index 5af20c65..8f095efd 100644
--- a/Sources/SkillConstants.js
+++ b/Sources/SkillConstants.js
@@ -1,3 +1,5 @@
+import { g_iconRootPath, g_imageRootPath, g_skillIconRootPath, g_debugSkillIconRootPath, G_WEAPON_ID_BASE, G_ASSIST_ID_BASE, G_SPECIAL_ID_BASE, G_PASSIVE_A_ID_BASE, G_PASSIVE_B_ID_BASE, G_PASSIVE_C_ID_BASE, G_PASSIVE_S_ID_BASE, G_PASSIVE_X_ID_BASE } from './GlobalDefinitions.js';
+
 const SkillType = {
     Weapon: 0,
     Support: 1,
@@ -4439,3 +4441,13 @@ const colorToStrMap = new Map([
 function colorTypeToString(colorType) {
     return colorToStrMap.get(colorType) || "不明";
 }
+
+export { SkillType, WeaponType, WeaponRefinementType, Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveS, PassiveX, Captain, NONE_ID, NoneValue, NoneOption };
+export { AssistType, ASSIST_TYPE_NAMES, getAssistTypeName, CantoSupport, CANTO_ASSIST_NAMES, getCantoAssistName };
+export { EmblemHero, EngagedSpecialIcon, EffectiveType, EFFECTIVE_TYPE_NAMES, ColorType, weaponTypeIconPath, colorTypeToString };
+export { StyleType, STYLE_TYPE_NAMES, getStyleTypeName, SKILL_ID_TO_STYLE_TYPE, STATUS_EFFECT_TYPE_TO_STYLE_TYPE };
+export { CANNOT_MOVE_STYLES, CANNOT_ATTACK_STRUCTURE_STYLES, STYLES_THAT_REMAINING_MOVEMENT_FROM_CANTO_IS_TREATED_AS_0, STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN };
+export { STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1, STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2, SKILL_IDS_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1, SKILL_IDS_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2 };
+export { STYLES_THAT_IS_DISABLED_WHEN_UNIT_HAS_ANOTHER_STYLE, ACCELERATES_SPECIAL_TRIGGER_SET, REDUCE_SPECIAL_COUNT_WHEN_NO_WEAPON_SKILL_INFO_SET };
+export { DISABLES_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SET };
+export { HP_WITH_SKILLS_MAP, ATK_WITH_SKILLS_MAP, SPD_WITH_SKILLS_MAP, DEF_WITH_SKILLS_MAP, RES_WITH_SKILLS_MAP };
diff --git a/Sources/UnitConstants.js b/Sources/UnitConstants.js
index 94c44c1c..ae2c1b26 100644
--- a/Sources/UnitConstants.js
+++ b/Sources/UnitConstants.js
@@ -1,3 +1,6 @@
+import { g_imageRootPath } from './GlobalDefinitions.js';
+import { StatusType } from './HeroInfoConstants.js';
+
 // Hero enum の値は heroId (HeroInfo.id) を使用する
 const Hero = {
     HaloweenHector: 435,
@@ -494,3 +497,12 @@ function groupIdToString(groupId) {
             return "";
     }
 }
+
+export { Hero, DUO_HERO_SET, RESET_DUO_OR_HARMONIZED_SKILL_AT_ODD_TURN_SET, RESET_DUO_OR_HARMONIZED_SKILL_EVERY_3_TURNS_SET };
+export { IvStateOptions, UnitGroupType, SummonerLevel, SummonerLevelOptions, PartnerLevel };
+export { EntwinedType, HeroIdToEntwinedType, EntwinedOptions, EntwinedValues, CombatResultType, PerTurnStatusType, NotReserved };
+export { isThiefId, summonerLevelToString, NEGATIVE_STATUS_EFFECT_SET, isNegativeStatusEffect, isPositiveStatusEffect };
+export { getPositiveStatusEffectTypes, getNegativeStatusEffectTypes, sortPositiveStatusEffectTypes, sortNegativeStatusEffectTypes };
+export { getPositiveStatusEffectTypesInOrder, getNegativeStatusEffectTypesInOrder };
+export { STATUS_EFFECT_INFO_MAP, statusEffectTypeToIconFilePath, getStatusEffectName, getStatusDescription };
+export { combatResultToString, groupIdToString };
