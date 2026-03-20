diff --git a/Sources/BeginningOfTurnSkillHandler.js b/Sources/BeginningOfTurnSkillHandler.js
index 98fbfca9..185a6a1e 100644
--- a/Sources/BeginningOfTurnSkillHandler.js
+++ b/Sources/BeginningOfTurnSkillHandler.js
@@ -1,3 +1,10 @@
+import { Weapon, Special, PassiveA, PassiveB, PassiveC, PassiveS, Captain, StatusEffectType, WeaponType } from './SkillConstants.js';
+import { IterUtil, GeneratorUtil } from './Utilities.js';
+import { OffenceStructureBase } from './Structures.js';
+import { getSkillFunc } from './Skill.js';
+import { hasTransformSkillsFuncMap, applySkillForBeginningOfTurnFuncMap, applyEnemySkillForBeginningOfTurnFuncMap, applySkillAfterSkillsForBeginningOfTurnFuncMap, applySkillAfterEnemySkillsForBeginningOfTurnFuncMap, applyHealSkillForBeginningOfTurnFuncMap } from './Skill.js';
+import { AtStartOfTurnEnv } from './SkillEffect.js';
+import { AT_START_OF_TURN_HOOKS, AT_START_OF_ENEMY_PHASE_HOOKS, AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_PLAYER_PHASE_HOOKS, AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_ENEMY_PHASE_HOOKS, CAN_TRANSFORM_AT_START_OF_TURN_HOOKS, CAN_TRANSFORM_AT_START_OF_ENEMY_TURN_HOOKS } from './SkillEffectHooks.js';
 
 class BeginningOfTurnSkillHandler {
     /**
@@ -3390,3 +3397,5 @@ class BeginningOfTurnSkillHandler {
         return this._unitManager.isThereAnyUnitInTheSameGroupOnMap(unit, conditionFunc);
     }
 }
+
+export { BeginningOfTurnSkillHandler };
diff --git a/Sources/DamageCalculationUtility.js b/Sources/DamageCalculationUtility.js
index f1761a5d..54895cab 100644
--- a/Sources/DamageCalculationUtility.js
+++ b/Sources/DamageCalculationUtility.js
@@ -1,6 +1,13 @@
 /// @file
 /// @brief DamageCalculationUtility クラスの定義です。
 
+import { EffectiveType, WeaponType, Weapon, ColorType } from './SkillConstants.js';
+import { MoveType } from './HeroInfoConstants.js';
+import { isWeaponTypeBreath, isWeaponTypeBeast, isWeaponTypeTome } from './Skill.js';
+import { LoggerBase } from './Logger.js';
+import { NodeEnv } from './SkillEffectEnv.js';
+import { getSkillLogLevel } from './SkillEffect.js';
+import { CALC_TRIANGLE_ADVANTAGE_HOOKS } from './SkillEffectHooks.js';
 
 const TriangleAdvantage = {
     None: 0,
@@ -156,3 +163,5 @@ class DamageCalculationUtility {
         return diff > 0 ? Math.min(diff * percentage, maxPercentage) / 100.0 : 0;
     }
 }
+
+export { TriangleAdvantage, ColorToTriangleAdvantageTable, EffectiveFuncTable, DamageCalculationUtility };
diff --git a/Sources/DamageCalculator.js b/Sources/DamageCalculator.js
index 34790a7d..39b08d57 100644
--- a/Sources/DamageCalculator.js
+++ b/Sources/DamageCalculator.js
@@ -1,6 +1,13 @@
 /// @file
 /// @brief DamageCalculator クラスとそれに関連するクラスや関数等の定義です。
 
+import { GroupLogger } from './Logger.js';
+import { NodeEnv } from './SkillEffectEnv.js';
+import { DamageCalculationUtility, TriangleAdvantage } from './DamageCalculationUtility.js';
+import { Special, Weapon, PassiveB, StatusEffectType, WeaponType } from './SkillConstants.js';
+import { isDefenseSpecial, getSkillFunc } from './Skill.js';
+import { addSpecialDamageAfterDefenderSpecialActivatedFuncMap, applyNTimesDamageReductionRatiosByNonDefenderSpecialFuncMap, applySpecialDamageReductionPerAttackFuncMap, applySkillEffectAfterSpecialActivatedFuncMap, applySkillEffectsPerAttackFuncMap, activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap } from './Skill.js';
+import { AFTER_ATTACK_HOOKS, AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS, AT_START_OF_ATTACK_HOOKS } from './SkillEffectHooks.js';
 
 const GameMode = {
     AetherRaid: 0,
@@ -2986,3 +2993,5 @@ class DamageCalculator {
         if (this.isLogEnabled) this.writeDebugLog(unit.getNameWithGroup() + "の奥義カウント" + currentSpCount + "→" + unit.tmpSpecialCount);
     }
 }
+
+export { GameMode, DamageType, DamageCalcResult, CombatResult, AttackResult, StrikeResult, DamageCalcContext, DamageCalcEnv, OneAttackResult, DamageCalculator };
diff --git a/Sources/DamageCalculatorWrapper.js b/Sources/DamageCalculatorWrapper.js
index 8bd29be3..f22a7587 100644
--- a/Sources/DamageCalculatorWrapper.js
+++ b/Sources/DamageCalculatorWrapper.js
@@ -1,3 +1,14 @@
+import { Weapon, Special, PassiveA, PassiveB, PassiveC, PassiveS, Captain, StatusEffectType, WeaponType } from './SkillConstants.js';
+import { LoggerBase, GroupLogger } from './Logger.js';
+import { NodeEnv, DamageCalculatorWrapperEnv } from './SkillEffectEnv.js';
+import { getSkillLogLevel } from './SkillEffect.js';
+import { isPhysicalWeaponType, isWeaponTypeBreathOrBeast, isWeaponTypeBreath, isNormalAttackSpecial, isDefenseSpecial, getSkillFunc } from './Skill.js';
+import { applySkillEffectForUnitFuncMap, applyPrecombatDamageReductionRatioFuncMap, applySKillEffectForUnitAtBeginningOfCombatFuncMap, applySkillEffectFromAlliesFuncMap, applySkillEffectFromEnemyAlliesFuncMap, applySkillEffectFromAlliesExcludedFromFeudFuncMap, applySkillEffectAfterSetAttackCountFuncMap, applySkillEffectForUnitAfterCombatStatusFixedFuncMap, calcFixedAddDamageFuncMap, applyDamageReductionRatioBySpecialFuncMap, applyPotentSkillEffectFuncMap, canActivateSaveSkillFuncMap, selectReferencingResOrDefFuncMap, updateUnitSpurFromEnemyAlliesFuncMap, updateUnitSpurFromAlliesFuncMap, applySkillEffectsAfterAfterBeginningOfCombatFuncMap, applySkillEffectsAfterAfterBeginningOfCombatFromAlliesFuncMap } from './Skill.js';
+import { DamageCalculator, GameMode, DamageType, DamageCalcEnv, CombatResult } from './DamageCalculator.js';
+import { TriangleAdvantage } from './DamageCalculationUtility.js';
+import { PostCombatSkillHander } from './PostCombatSkillHander.js';
+import { AT_START_OF_COMBAT_HOOKS, BEFORE_COMBAT_HOOKS, BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS, BEFORE_AOE_SPECIAL_HOOKS, CAN_TRIGGER_SAVIOR_HOOKS, IS_ASSIGN_DECOY_FOR_SAME_RANGE_ACTIVE_HOOKS, FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS, FOR_FOES_INFLICTS_STATS_MINUS_HOOKS, FOR_ALLIES_STATS_SKILLS_USING_STATS_HOOKS, FOR_ALLIES_NON_STATS_SKILL_USING_STATS_HOOKS, FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_AFTER_OTHER_SKILLS_DURING_COMBAT_HOOKS, FOR_ALLIES_AT_START_OF_COMBAT_HOOKS } from './SkillEffectHooks.js';
+import { FOR_FOE_STATS_SKILLS_USING_STATS_HOOKS, FOR_FOE_NON_STATS_SKILL_USING_STATS_HOOKS, FOR_FOES_AT_START_OF_COMBAT_HOOKS, FOR_FOES_INFLICTS_EFFECTS_AFTER_OTHER_SKILLS_HOOKS, FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_AFTER_COMBAT_HOOKS, STATS_SKILL_USING_STATS_HOOKS, NON_STATS_SKILL_USING_STATS_HOOKS, SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS, WHEN_APPLIES_POTENT_EFFECTS_HOOKS, FOR_ALLIES_WHEN_APPLIES_POTENT_EFFECTS_HOOKS, AFTER_FOLLOW_UP_CONFIGURED_HOOKS, WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS, AFTER_EFFECTS_THAT_DEAL_DAMAGE_AS_COMBAT_BEGINS_HOOKS, FOR_ALLIES_AFTER_EFFECTS_THAT_DEAL_DAMAGE_AS_COMBAT_BEGINS_HOOKS, AFTER_CONDITION_CONFIGURED_HOOKS } from './SkillEffectHooks.js';
 
 class PerformanceProfile {
     constructor() {
@@ -17191,3 +17202,5 @@ class DamageCalculatorWrapper {
         damageCalcEnv.applySkill('全ての条件決定後', damageCalcEnv.atkUnit, damageCalcEnv.defUnit, applySkill, this);
     }
 }
+
+export { PerformanceProfile, ScopedTileChanger, DamageCalculatorWrapper };
diff --git a/Sources/PostCombatSkillHander.js b/Sources/PostCombatSkillHander.js
index 50ea4263..2387ea37 100644
--- a/Sources/PostCombatSkillHander.js
+++ b/Sources/PostCombatSkillHander.js
@@ -1,4 +1,11 @@
-
+import { Weapon, Special, PassiveA, PassiveB, PassiveC, PassiveS, StatusEffectType } from './SkillConstants.js';
+import { MoveType } from './HeroInfoConstants.js';
+import { LoggerBase } from './Logger.js';
+import { isWeaponTypeBreathOrBeast, getSkillFunc } from './Skill.js';
+import { applyAttackSkillEffectAfterCombatFuncMap, applySkillEffectAfterCombatForUnitFuncMap, applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap, applySkillEffectAfterCombatNeverthelessDeadForUnitFuncMap, applyPostCombatAllySkillFuncMap } from './Skill.js';
+import { getSkillLogLevel } from './SkillEffect.js';
+import { AfterCombatEnv } from './SkillEffect.js';
+import { AFTER_COMBAT_HOOKS, AFTER_COMBAT_AFTER_HEAL_OR_DAMAGE_HOOKS, AFTER_COMBAT_EVEN_IF_DEFEATED_HOOKS, AFTER_COMBAT_IF_UNIT_ATTACKED_HOOKS, AFTER_COMBAT_FOR_ALLIES_EVEN_IF_DEFEATED_HOOKS, FOR_ALLIES_AFTER_COMBAT_HOOKS } from './SkillEffectHooks.js';
 
 class PostCombatSkillHander {
     /**
@@ -1413,3 +1420,5 @@ class PostCombatSkillHander {
         }
     }
 }
+
+export { PostCombatSkillHander };
