diff --git a/Sources/BattleMapSettings.js b/Sources/BattleMapSettings.js
index 74f95be0..b0f40607 100644
--- a/Sources/BattleMapSettings.js
+++ b/Sources/BattleMapSettings.js
@@ -1,6 +1,5 @@
-
-
-
+import { TileType } from './Tile.js';
+import { BreakableWallIconType } from './Structures.js';
 
 /**
  * マップの種類を変更します。
@@ -2039,3 +2038,5 @@ function resetBattleMapPlacement(map, type, withUnits = false) {
     map.__clearTiles();
     __resetBattleMapPlacement(map, type, withUnits);
 }
+
+export { changeMapKind, resetBattleMapPlacement };
diff --git a/Sources/Skill.js b/Sources/Skill.js
index 56bcc21f..ebd3e70a 100644
--- a/Sources/Skill.js
+++ b/Sources/Skill.js
@@ -1,3 +1,6 @@
+import { WeaponType, Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveS, PassiveX, Captain, SkillType, WeaponRefinementType, EmblemHero, NONE_ID } from './SkillConstants.js';
+import { g_siteRootPath, g_skillIconRootPath } from './GlobalDefinitions.js';
+
 /**
  * @file
  * @brief スキル情報の定義とそれに関連するクラス、関数等の定義です。
@@ -2082,3 +2085,59 @@ applySkillEffectsAfterAfterBeginningOfCombatFromAlliesFuncMap = new Map();
 const hasDivineVeinSkillsWhenActionDoneFuncMap = new Map();
 /** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit) => void>} */
 const applySkillEffectForUnitAfterCombatStatusFixedFuncMap = new Map();
+
+export { WEAPON_TYPE_ATTACK_RANGE_MAP, getAttackRangeOfWeaponType, getWeaponTypeOrder, weaponRefinementTypeToString };
+export { getEmblemHeroSkillId, getNormalSkillId, getRefinementSkillId, getSpecialRefinementSkillId, getRefinementSkillIds };
+export { getStatusEffectSkillId, getStyleSkillId, getDuoOrHarmonizedSkillId, getDivineVeinSkillId, getCustomSkillId };
+export { EMBLEM_HERO_SET, PHYSICAL_WEAPON_TYPE_SET, isPhysicalWeaponType, isWeaponSpecialRefined };
+export { FIRESWEEP_WEAPON_SET, isFiresweepWeapon, ASSIST_RANGE_MAP, getAssistRange };
+export { RALLY_UP_SET, isRallyUp, RALLY_BUFF_AMOUNT_MAP, getAtkBuffAmount, getSpdBuffAmount, getDefBuffAmount, getResBuffAmount };
+export { PRECOMBAT_HEAL_THRESHOLD_MAP, getPrecombatHealThreshold };
+export { RANGED_ATTACK_SPECIAL_SET, isRangedAttackSpecial, RANGED_ATTACK_SPECIAL_DAMAGE_RATE_MAP, getRangedAttackSpecialDamageRate };
+export { DEFENSE_SPECIAL_SET, MIRACLE_AND_HEAL_SPECIAL_SET, isDefenseSpecial };
+export { NORMAL_ATTACK_SPECIAL_SET, isNormalAttackSpecial };
+export { REFRESH_SUPPORT_SKILL_SET, isRefreshSupportSkill, SPECIALS_COUNTED_AS_SING_OR_DANCE, RALLY_HEAL_SKILL_SET, isRallyHealSkill };
+export { BOW_WEAPON_TYPE_SET, isWeaponTypeBow, DAGGER_WEAPON_TYPE_SET, isWeaponTypeDagger };
+export { TOME_WEAPON_TYPE_SET, isWeaponTypeTome, BREATH_WEAPON_TYPE_SET, isWeaponTypeBreath };
+export { BEAST_WEAPON_TYPE_SET, isWeaponTypeBeast, isRangedWeaponType, MELEE_WEAPON_TYPE_SET, isMeleeWeaponType };
+export { isWeaponTypeBreathOrBeast, isInheritableWeaponType };
+export { WEAPON_TYPE_TO_COLOR_MAP, getColorFromWeaponType, STRING_TO_WEAPON_TYPE_MAP, WEAPON_TYPE_TO_STRING_MAP, stringToWeaponType, weaponTypeToString };
+export { canRallyForciblyByPlayer, SWAP_ASSIST_SKILLS, REPOSITION_ASSIST_SKILLS, DRAW_BACK_ASSIST_SKILLS, GALEFORCE_SKILLS, CAN_MOVE_THROUGH_FOES_SPACE_SKILLS };
+export { canRallyForcibly, canRalliedForcibly, isPrecombatSpecial };
+export { TELEPORTATION_SKILL_SET, isTeleportationSkill, hasPathfinderEffect, getSelfDamageDealtRateToAddSpecialDamage };
+export { TRIANGLE_ADEPT_SET, isTriangleAdeptSkill, EVAL_SPD_ADD_MAP, getEvalSpdAdd, EVAL_RES_ADD_MAP, getEvalResAdd };
+export { WEAPON_TYPES_ADD_ATK2_AFTER_TRANSFORM_SET, isWeaponTypeThatCanAddAtk2AfterTransform, BeastCommonSkillType, BEAST_COMMON_SKILL_MAP };
+export { ADVANTAGEOUS_AGAINST_COLORLESS_WEAPONS, BREAKER_SKILL_TO_TARGET_WEAPON_TYPE_MAP, getBreakerSkillTargetWeaponType };
+export { WEAPON_VALUE_DICT, SUPPORT_VALUE_DICT, SPECIAL_VALUE_DICT, PASSIVE_A_VALUE_DICT, PASSIVE_B_VALUE_DICT, PASSIVE_C_VALUE_DICT, PASSIVE_S_VALUE_DICT, PASSIVE_X_VALUE_DICT, CAPTAIN_VALUE_DICT };
+export { SAVE_SKILL_SET, CAN_SAVE_FROM_MELEE_SKILL_SET, CAN_SAVE_FROM_RANGED_SKILL_SET, CAN_SAVE_FROM_MAGIC_SKILL_SET, CAN_SAVE_FROM_P_SKILL_SET };
+export { StatusEffectType, POSITIVE_STATUS_EFFECT_ARRAY, POSITIVE_STATUS_EFFECT_ORDER_MAP, NEGATIVE_STATUS_EFFECT_ARRAY, NEGATIVE_STATUS_EFFECT_ORDER_MAP };
+export { SkillInfo, COUNT2_SPECIALS, INHERITABLE_COUNT2_SPECIALS, COUNT3_SPECIALS, INHERITABLE_COUNT3_SPECIALS, COUNT4_SPECIALS, INHERITABLE_COUNT4_SPECIALS, COUNT5_SPECIALS, INHERITABLE_COUNT5_SPECIALS };
+export { NO_EFFECT_ON_SPECIAL_COOLDOWN_CHARGE_ON_SUPPORT_SKILL_SET, DISARM_TRAP_SKILL_SET, DISARM_HEX_TRAP_SKILL_SET };
+export { StatusIndex, StatFlags, getStatusName, stealBonusEffects, getSkillFunc };
+export { applySpecialDamageReductionPerAttackFuncMap, applySkillEffectForUnitFuncMap, canActivateCantoFuncMap, calcMoveCountForCantoFuncMap };
+export { evalSpdAddFuncMap, evalResAddFuncMap, applyPrecombatDamageReductionRatioFuncMap };
+export { applySkillForBeginningOfTurnFuncMap, applyEnemySkillForBeginningOfTurnFuncMap, setOnetimeActionActivatedFuncMap };
+export { applySkillEffectFromAlliesFuncMap, applySkillEffectFromAlliesExcludedFromFeudFuncMap, updateUnitSpurFromEnemyAlliesFuncMap };
+export { applyRefreshFuncMap, applySkillEffectsPerCombatFuncMap, applyNTimesDamageReductionRatiosByNonDefenderSpecialFuncMap };
+export { applySkillsAfterRallyForSupporterFuncMap, applySkillsAfterRallyForTargetUnitFuncMap, applyMovementAssistSkillFuncMap };
+export { applySupportSkillForSupporterFuncMap, applySupportSkillForTargetUnitFuncMap };
+export { canRallyForciblyFuncMap, canRallyForciblyByPlayerFuncMap, canRalliedForciblyFuncMap };
+export { enumerateTeleportTilesForUnitFuncMap, applySkillEffectAfterCombatForUnitFuncMap };
+export { applySKillEffectForUnitAtBeginningOfCombatFuncMap, updateUnitSpurFromAlliesFuncMap };
+export { canActivateObstructToAdjacentTilesFuncMap, canActivateObstructToTilesIn2SpacesFuncMap };
+export { applySkillEffectAfterMovementSkillsActivatedFuncMap, applyHighPriorityAnotherActionSkillEffectFuncMap };
+export { applyEndActionSkillsFuncMap, applySkillsAfterCantoActivatedFuncMap, hasTransformSkillsFuncMap };
+export { getTargetUnitTileAfterMoveAssistFuncMap, findTileAfterMovementAssistFuncMap, resetMaxSpecialCountFuncMap };
+export { isAfflictorFuncMap, applySkillAfterSkillsForBeginningOfTurnFuncMap, applySkillAfterEnemySkillsForBeginningOfTurnFuncMap };
+export { applyDamageReductionRatioBySpecialFuncMap, activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap };
+export { addSpecialDamageAfterDefenderSpecialActivatedFuncMap, applySkillEffectAfterSpecialActivatedFuncMap };
+export { enumerateRangedSpecialTilesFuncMap, applySkillEffectAfterCombatNeverthelessDeadForUnitFuncMap };
+export { canDisableAttackOrderSwapSkillFuncMap, calcFixedAddDamageFuncMap, applyHealSkillForBeginningOfTurnFuncMap };
+export { applyMovementSkillAfterCombatFuncMap, applySkillEffectRelatedToFollowupAttackPossibilityFuncMap };
+export { applyPotentSkillEffectFuncMap, applySkillEffectsPerAttackFuncMap, applySkillEffectAfterSetAttackCountFuncMap };
+export { canActivateSaveSkillFuncMap, selectReferencingResOrDefFuncMap, enumerateTeleportTilesForAllyFuncMap };
+export { applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap, hasPathfinderEffectFuncMap };
+export { applySkillEffectFromEnemyAlliesFuncMap, applyAttackSkillEffectAfterCombatFuncMap, applySpecialSkillEffectWhenHealingFuncMap };
+export { canAddStatusEffectByRallyFuncMap, getAssistTypeWhenCheckingCanActivatePrecombatAssistFuncMap, calcHealAmountFuncMap };
+export { applyPostCombatAllySkillFuncMap, canWarpFuncMap, hasDivineVeinSkillsWhenActionDoneFuncMap, applySkillEffectForUnitAfterCombatStatusFixedFuncMap };
+export { TYPE_TO_STRING_MAP };
diff --git a/Sources/Structures.js b/Sources/Structures.js
index f19a4cb8..9d58e602 100644
--- a/Sources/Structures.js
+++ b/Sources/Structures.js
@@ -1,3 +1,6 @@
+import { BattleMapElement } from './BattleMapElement.js';
+import { g_imageRootPath, StructureCookiePrefix, ValueDelimiter } from './GlobalDefinitions.js';
+
 /// @file
 /// @brief マップ上の配置物を表すクラスとそれに関連する関数等の定義です。
 
@@ -1073,3 +1076,12 @@ function isMovableForUnit(structure) {
 
     return structure instanceof TileTypeStructureBase;
 }
+
+export { ObjType, OrnamentSettings, findOrnamentTypeIndexByIcon, StructureBase, OffenceStructureBase, DefenceStructureBase };
+export { DefFortress, OfFortress, DefBoltTower, OfBoltTower, ExcapeLadder, AetherAmphorae, AetherFountain, SafetyFence };
+export { DefArmorSchool, OfArmorSchool, DefCatapult, OfCatapult, DefCavalrySchool, OfCavalrySchool };
+export { DefFlierSchool, OfFlierSchool, DefHealingTower, OfHealingTower, DefInfantrySchool, OfInfantrySchool, Ornament };
+export { DefPanicManor, OfPanicManor, DefTacticsRoom, OfTacticsRoom, DefBrightShrine, OfBrightShrine, DefDarkShrine, OfDarkShrine };
+export { OfHiyokuNoHisyo, DefHiyokuNoTorikago, TileTypeStructureBase, TrapBase };
+export { FalseHexTrap, HexTrap, FalseBoltTrap, BoltTrap, FalseHeavyTrap, HeavyTrap };
+export { OfCallingCircle, DefCallingCircle, Wall, BreakableWallIconType, BreakableWall, isMovableForUnit };
diff --git a/Sources/Tile.js b/Sources/Tile.js
index 848e56ab..d15c5cc5 100644
--- a/Sources/Tile.js
+++ b/Sources/Tile.js
@@ -1,3 +1,6 @@
+import { BattleMapElement } from './BattleMapElement.js';
+import { ValueDelimiter } from './GlobalDefinitions.js';
+
 /// @file
 /// @brief Tile クラスとそれに関連するクラスや関数等の定義です。
 
@@ -1503,3 +1506,7 @@ class TilePriorityContext {
         }
     }
 }
+
+export { TileType, tileTypeToString, TileTypeOptions, CanNotReachTile, ObstructTile };
+export { DivineVeinType, DIVINE_VEIN_NAMES, getDivineVeinName, DIVINE_VEIN_ICE_TYPES, DIVINE_VEIN_GREEN_TYPES, divineVeinColor };
+export { setUnitToTile, Tile, TilePriorityContext };
diff --git a/Sources/TurnSetting.js b/Sources/TurnSetting.js
index e50b30b6..5e7e44d1 100644
--- a/Sources/TurnSetting.js
+++ b/Sources/TurnSetting.js
@@ -1,3 +1,5 @@
+import { TurnSettingCookiePrefix, NameValueDelimiter, ElemDelimiter, UnitCookiePrefix, StructureCookiePrefix, TileCookiePrefix } from './GlobalDefinitions.js';
+
 /// @file
 /// @brief TurnSetting クラスとそれに関連するクラスや関数等の定義です。
 
@@ -161,3 +163,5 @@ class TurnSetting {
         }
     }
 }
+
+export { TurnSetting };
