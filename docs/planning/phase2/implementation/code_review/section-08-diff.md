diff --git a/Sources/CustomSkill.js b/Sources/CustomSkill.js
index 7a51203d..89679c62 100644
--- a/Sources/CustomSkill.js
+++ b/Sources/CustomSkill.js
@@ -1,3 +1,13 @@
+import { NONE_ID, SkillType, EffectiveType, EFFECTIVE_TYPE_NAMES, AssistType, getAssistTypeName, CantoSupport, getCantoAssistName } from './SkillConstants.js';
+import { MultiValueMap, SkillEffectNode, SKILL_EFFECT_NODE, NODE_FUNC, NumberNode, ConstantNumberNode, CONSTANT_NUMBER_NODE, ZERO_NUMBER_NODE } from './SkillEffectCore.js';
+import { ENSURE_MIN_MAX_NODE, TRUE_NODE } from './SkillEffectCore.js';
+import { AT_START_OF_COMBAT_HOOKS, AT_START_OF_ATTACK_HOOKS, AFTER_COMBAT_HOOKS, WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS, AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS, WHEN_CANTO_TRIGGERS_HOOKS, CANCEL_FOES_ATTACK_HOOKS, HAS_PATHFINDER_HOOKS, WHEN_CANTO_ALLY_CAN_MOVE_TO_A_SPACE_HOOKS, IS_DEBUFFER_TIER_1_HOOKS, IS_DEBUFFER_TIER_2_HOOKS, IS_AFFLICTOR_HOOKS } from './SkillEffectHooks.js';
+import { StatsNode, ZERO_STATS_NODE } from './SkillEffect.js';
+import { UnitsNode, EMPTY_SPACES_NODE, SPACES_IF_NODE } from './SkillEffect.js';
+import { StatusEffectType } from './Skill.js';
+import { DivineVeinType, getDivineVeinName } from './Tile.js';
+import { STATUS_EFFECT_INFO_MAP } from './UnitConstants.js';
+
 class CustomSkill {
     static OPTIONS = [];
 
@@ -2114,3 +2124,5 @@ CustomSkill.setFuncId(
     },
     []
 );
+
+export { CustomSkill };
diff --git a/Sources/SkillImpl.js b/Sources/SkillImpl.js
index 03e2ffd3..8bff1751 100644
--- a/Sources/SkillImpl.js
+++ b/Sources/SkillImpl.js
@@ -1,3 +1,34 @@
+import { Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveX, WeaponType, EmblemHero } from './SkillConstants.js';
+import { StatusEffectType } from './Skill.js';
+import { MoveType } from './HeroInfoConstants.js';
+import { NORMAL_ATTACK_SPECIAL_SET, RANGED_ATTACK_SPECIAL_SET, DEFENSE_SPECIAL_SET, REFRESH_SUPPORT_SKILL_SET, RALLY_HEAL_SKILL_SET, TELEPORTATION_SKILL_SET, SAVE_SKILL_SET } from './Skill.js';
+import { NO_EFFECT_ON_SPECIAL_COOLDOWN_CHARGE_ON_SUPPORT_SKILL_SET, DISARM_TRAP_SKILL_SET, DISARM_HEX_TRAP_SKILL_SET, WEAPON_TYPES_ADD_ATK2_AFTER_TRANSFORM_SET } from './Skill.js';
+import { BEAST_COMMON_SKILL_MAP, COUNT2_SPECIALS, getNormalSkillId, getRefinementSkillId, getSpecialRefinementSkillId } from './Skill.js';
+import { hasTransformSkillsFuncMap, applySkillForBeginningOfTurnFuncMap, applyEnemySkillForBeginningOfTurnFuncMap } from './Skill.js';
+import { applySkillAfterSkillsForBeginningOfTurnFuncMap, applySkillAfterEnemySkillsForBeginningOfTurnFuncMap, applySkillEffectForUnitFuncMap } from './Skill.js';
+import { applySkillEffectForUnitAfterCombatStatusFixedFuncMap, canActivateCantoFuncMap, calcMoveCountForCantoFuncMap } from './Skill.js';
+import { evalSpdAddFuncMap, evalResAddFuncMap, applyPrecombatDamageReductionRatioFuncMap } from './Skill.js';
+import { applySkillEffectFromAlliesFuncMap, applySkillEffectFromAlliesExcludedFromFeudFuncMap, updateUnitSpurFromEnemyAlliesFuncMap } from './Skill.js';
+import { applyRefreshFuncMap, applySkillEffectsPerCombatFuncMap, applyNTimesDamageReductionRatiosByNonDefenderSpecialFuncMap } from './Skill.js';
+import { applySkillsAfterRallyForSupporterFuncMap, applySkillsAfterRallyForTargetUnitFuncMap, applyMovementAssistSkillFuncMap } from './Skill.js';
+import { applySupportSkillForSupporterFuncMap, applySupportSkillForTargetUnitFuncMap, canRallyForciblyFuncMap, canRallyForciblyByPlayerFuncMap } from './Skill.js';
+import { canRalliedForciblyFuncMap, enumerateTeleportTilesForUnitFuncMap, applySkillEffectAfterCombatForUnitFuncMap } from './Skill.js';
+import { applySKillEffectForUnitAtBeginningOfCombatFuncMap, updateUnitSpurFromAlliesFuncMap, canActivateObstructToAdjacentTilesFuncMap } from './Skill.js';
+import { canActivateObstructToTilesIn2SpacesFuncMap, applySkillEffectAfterMovementSkillsActivatedFuncMap, applyHighPriorityAnotherActionSkillEffectFuncMap } from './Skill.js';
+import { applyEndActionSkillsFuncMap, applySkillsAfterCantoActivatedFuncMap, getTargetUnitTileAfterMoveAssistFuncMap } from './Skill.js';
+import { findTileAfterMovementAssistFuncMap, resetMaxSpecialCountFuncMap, isAfflictorFuncMap } from './Skill.js';
+import { applyDamageReductionRatioBySpecialFuncMap, activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap, addSpecialDamageAfterDefenderSpecialActivatedFuncMap } from './Skill.js';
+import { applySkillEffectAfterSpecialActivatedFuncMap, enumerateRangedSpecialTilesFuncMap, applySkillEffectAfterCombatNeverthelessDeadForUnitFuncMap } from './Skill.js';
+import { canDisableAttackOrderSwapSkillFuncMap, calcFixedAddDamageFuncMap, applyHealSkillForBeginningOfTurnFuncMap } from './Skill.js';
+import { applyMovementSkillAfterCombatFuncMap, applySkillEffectRelatedToFollowupAttackPossibilityFuncMap, applyPotentSkillEffectFuncMap } from './Skill.js';
+import { applySkillEffectsPerAttackFuncMap, applySkillEffectAfterSetAttackCountFuncMap, canActivateSaveSkillFuncMap } from './Skill.js';
+import { selectReferencingResOrDefFuncMap, enumerateTeleportTilesForAllyFuncMap, applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap } from './Skill.js';
+import { hasPathfinderEffectFuncMap, applySkillEffectFromEnemyAlliesFuncMap, applyAttackSkillEffectAfterCombatFuncMap } from './Skill.js';
+import { applySpecialSkillEffectWhenHealingFuncMap, canAddStatusEffectByRallyFuncMap, getAssistTypeWhenCheckingCanActivatePrecombatAssistFuncMap } from './Skill.js';
+import { calcHealAmountFuncMap, applyPostCombatAllySkillFuncMap, canWarpFuncMap } from './Skill.js';
+import { applySkillEffectsAfterAfterBeginningOfCombatFuncMap, applySkillEffectsAfterAfterBeginningOfCombatFromAlliesFuncMap } from './Skill.js';
+import { hasDivineVeinSkillsWhenActionDoneFuncMap, applySpecialDamageReductionPerAttackFuncMap } from './Skill.js';
+
 // noinspection JSUnusedLocalSymbols
 // 各スキルの実装
 // 神獣の肉体
diff --git a/Sources/SkillImpl202408.js b/Sources/SkillImpl202408.js
index f331c40a..ffe036ef 100644
--- a/Sources/SkillImpl202408.js
+++ b/Sources/SkillImpl202408.js
@@ -1,3 +1,13 @@
+import { Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveS, PassiveX, Captain } from './SkillConstants.js';
+import { StatusEffectType } from './Skill.js';
+import { SkillEffectRegistrar } from './SkillEffectRegistrar.js';
+import { SkillEffectNode, NODE_FUNC, NumberNode } from './SkillEffectCore.js';
+import { TRUE_NODE } from './SkillEffectCore.js';
+import { AT_START_OF_TURN_HOOKS, AT_START_OF_COMBAT_HOOKS, AFTER_COMBAT_HOOKS, AFTER_COMBAT_IF_UNIT_ATTACKED_HOOKS, BEFORE_AOE_SPECIAL_HOOKS } from './SkillEffectHooks.js';
+import { AFTER_COMBAT_AFTER_HEAL_OR_DAMAGE_HOOKS, AFTER_COMBAT_EVEN_IF_DEFEATED_HOOKS, FOR_ALLIES_NON_STATS_SKILL_USING_STATS_HOOKS, FOR_ALLIES_AT_START_OF_COMBAT_HOOKS } from './SkillEffectHooks.js';
+import { AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS, AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS } from './SkillEffectHooks.js';
+import { getNormalSkillId, getEmblemHeroSkillId, getStatusEffectSkillId } from './Skill.js';
+
 // noinspection JSUnusedLocalSymbols
 // 速さの吸収4
 {
diff --git a/Sources/SkillImpl202501.js b/Sources/SkillImpl202501.js
index ba618ba9..37587efd 100644
--- a/Sources/SkillImpl202501.js
+++ b/Sources/SkillImpl202501.js
@@ -1,3 +1,14 @@
+import { Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveS, PassiveX, Captain } from './SkillConstants.js';
+import { StatusEffectType } from './Skill.js';
+import { SkillEffectRegistrar } from './SkillEffectRegistrar.js';
+import { SkillEffectNode, NODE_FUNC, NumberNode } from './SkillEffectCore.js';
+import { TRUE_NODE, makeArray } from './SkillEffectCore.js';
+import { AT_START_OF_TURN_HOOKS, AT_START_OF_COMBAT_HOOKS, AFTER_COMBAT_HOOKS, BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS } from './SkillEffectHooks.js';
+import { WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS, CAN_ACTIVATE_STYLE_HOOKS, CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS } from './SkillEffectHooks.js';
+import { CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_3_SPACES_OF_FOE_HOOKS, SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS, WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS } from './SkillEffectHooks.js';
+import { FOR_ALLIES_STATS_SKILLS_USING_STATS_HOOKS, FOR_ALLIES_NON_STATS_SKILL_USING_STATS_HOOKS, FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS } from './SkillEffectHooks.js';
+import { getNormalSkillId, getDuoOrHarmonizedSkillId, getStyleSkillId, getStatusEffectSkillId } from './Skill.js';
+
 // スキル実装
 // Winter Trinket+
 {
diff --git a/Sources/SkillImpl202601.js b/Sources/SkillImpl202601.js
index 23ed4ce4..038578f4 100644
--- a/Sources/SkillImpl202601.js
+++ b/Sources/SkillImpl202601.js
@@ -1,3 +1,13 @@
+import { Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveS, PassiveX, Captain } from './SkillConstants.js';
+import { StatusEffectType } from './Skill.js';
+import { SkillEffectRegistrar } from './SkillEffectRegistrar.js';
+import { SkillEffectNode, NODE_FUNC, NumberNode } from './SkillEffectCore.js';
+import { TRUE_NODE, makeArray } from './SkillEffectCore.js';
+import { AT_START_OF_TURN_HOOKS, AT_START_OF_COMBAT_HOOKS, AFTER_COMBAT_HOOKS, BEFORE_AOE_SPECIAL_HOOKS } from './SkillEffectHooks.js';
+import { WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS, CAN_ACTIVATE_STYLE_HOOKS, CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS } from './SkillEffectHooks.js';
+import { CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_3_SPACES_OF_FOE_HOOKS, SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS, WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS } from './SkillEffectHooks.js';
+import { getNormalSkillId, getDuoOrHarmonizedSkillId, getStyleSkillId, getStatusEffectSkillId } from './Skill.js';
+
 // スキル実装
 
 // Heroic Maltet
