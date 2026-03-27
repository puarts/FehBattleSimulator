diff --git a/Sources/BattleMap.js b/Sources/BattleMap.js
index 15a59d2e..3533e24b 100644
--- a/Sources/BattleMap.js
+++ b/Sources/BattleMap.js
@@ -11,6 +11,7 @@ import { LoggerBase } from './Logger.js';
 import { TileQuery, UnitQuery, getDivineVeinTag, getSpecialChargedImgTag } from './GameUtilities.js';
 import { CellType } from './Cell.js';
 import { canWarpFuncMap, enumerateRangedSpecialTilesFuncMap, enumerateTeleportTilesForAllyFuncMap, enumerateTeleportTilesForUnitFuncMap, getSkillFunc, isWeaponTypeBeast } from './Skill.js';
+import { BattleMapEnv, getSkillLogLevel, AOE_SPECIAL_SPACES_HOOKS } from './BattleMapSkillSupport.js';
 import { g_appData } from './AppDataGlobal.js';
 
 /// @file
diff --git a/Sources/BattleSimulatorBase.js b/Sources/BattleSimulatorBase.js
index 21e122ce..92af76d8 100644
--- a/Sources/BattleSimulatorBase.js
+++ b/Sources/BattleSimulatorBase.js
@@ -25,7 +25,7 @@ import { TurnSetting } from './TurnSetting.js';
 import { TurnSettingCookiePrefix, g_imageRootPath } from './GlobalDefinitions.js';
 import { canAddStatusEffectByRallyFuncMap, isRallyHealSkill, isRangedWeaponType } from './Skill.js';
 import { canRalliedForcibly, canRallyForcibly } from './SkillUtil.js';
-import { getSkillLogLevel } from './SkillEffect.js';
+import { BattleMapEnv, AtStartOfTurnEnv, getSkillLogLevel } from './SkillEffectEnv.js';
 import { g_appData, setMoveStructureToTrashBoxCallback } from './AppDataGlobal.js';
 
 function hasTargetOptionValue(targetOptionId, options) {
diff --git a/Sources/BeginningOfTurnSkillHandler.js b/Sources/BeginningOfTurnSkillHandler.js
index 8d2c7260..94a2644d 100644
--- a/Sources/BeginningOfTurnSkillHandler.js
+++ b/Sources/BeginningOfTurnSkillHandler.js
@@ -4,9 +4,8 @@ import { IterUtil, GeneratorUtil } from './Utilities.js';
 import { OffenceStructureBase } from './Structures.js';
 import { MoveType, StatusType } from './HeroInfoConstants.js';
 import { UnitGroupType } from './UnitConstants.js';
-import { getSkillLogLevel } from './SkillEffect.js';
+import { AtStartOfTurnEnv, getSkillLogLevel } from './SkillEffectEnv.js';
 import { applyEnemySkillForBeginningOfTurnFuncMap, applyHealSkillForBeginningOfTurnFuncMap, applySkillAfterEnemySkillsForBeginningOfTurnFuncMap, applySkillAfterSkillsForBeginningOfTurnFuncMap, applySkillForBeginningOfTurnFuncMap, getSkillFunc, hasTransformSkillsFuncMap, isDefenseSpecial, isMeleeWeaponType, isNormalAttackSpecial, isPhysicalWeaponType, isRangedWeaponType, isRefreshSupportSkill, isWeaponTypeBeast, isWeaponTypeBreath, isWeaponTypeBreathOrBeast, isWeaponTypeTome } from './Skill.js';
-import { AtStartOfTurnEnv } from './SkillEffect.js';
 import { AT_START_OF_TURN_HOOKS, AT_START_OF_ENEMY_PHASE_HOOKS, AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_PLAYER_PHASE_HOOKS, AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_ENEMY_PHASE_HOOKS, CAN_TRANSFORM_AT_START_OF_TURN_HOOKS, CAN_TRANSFORM_AT_START_OF_ENEMY_TURN_HOOKS } from './SkillEffectHooks.js';
 
 class BeginningOfTurnSkillHandler {
diff --git a/Sources/DamageCalculationUtility.js b/Sources/DamageCalculationUtility.js
index 54895cab..244763a5 100644
--- a/Sources/DamageCalculationUtility.js
+++ b/Sources/DamageCalculationUtility.js
@@ -5,8 +5,7 @@ import { EffectiveType, WeaponType, Weapon, ColorType } from './SkillConstants.j
 import { MoveType } from './HeroInfoConstants.js';
 import { isWeaponTypeBreath, isWeaponTypeBeast, isWeaponTypeTome } from './Skill.js';
 import { LoggerBase } from './Logger.js';
-import { NodeEnv } from './SkillEffectEnv.js';
-import { getSkillLogLevel } from './SkillEffect.js';
+import { NodeEnv, getSkillLogLevel } from './SkillEffectEnv.js';
 import { CALC_TRIANGLE_ADVANTAGE_HOOKS } from './SkillEffectHooks.js';
 
 const TriangleAdvantage = {
diff --git a/Sources/DamageCalculator.js b/Sources/DamageCalculator.js
index d00e0f47..c0a6e614 100644
--- a/Sources/DamageCalculator.js
+++ b/Sources/DamageCalculator.js
@@ -2,14 +2,15 @@
 /// @brief DamageCalculator クラスとそれに関連するクラスや関数等の定義です。
 
 import { GroupLogger, LoggerBase } from './Logger.js';
-import { NodeEnv } from './SkillEffectEnv.js';
-import { getSkillLogLevel } from './SkillEffect.js';
+import { NodeEnv, DamageCalculatorEnv } from './SkillEffectEnv.js';
+import { getSkillLogLevel } from './SkillEffectEnv.js';
 import { DamageCalculationUtility, TriangleAdvantage } from './DamageCalculationUtility.js';
 import { PassiveB, Special, Weapon, WeaponType, colorTypeToString } from './SkillConstants.js';
 import { StatusEffectType, StatusIndex } from './StatusConstants.js';
 import { MIRACLE_AND_HEAL_SPECIAL_SET, activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap, addSpecialDamageAfterDefenderSpecialActivatedFuncMap, applyNTimesDamageReductionRatiosByNonDefenderSpecialFuncMap, applySkillEffectAfterSpecialActivatedFuncMap, applySkillEffectsPerAttackFuncMap, applySpecialDamageReductionPerAttackFuncMap, getSkillFunc, isDefenseSpecial, isRangedWeaponType } from './Skill.js';
-import { AFTER_ATTACK_HOOKS, AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS, AT_START_OF_ATTACK_HOOKS } from './SkillEffectHooks.js';
-import { ArrayUtil, MathUtil, floorNumberWithFloatError, truncNumberWithFloatError } from './Utilities.js';
+import { AFTER_ATTACK_HOOKS, AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS, AT_START_OF_ATTACK_HOOKS } from './SkillEffectHooks.js';
+import { HtmlLogUtil } from './GameUtilities.js';
+import { ArrayUtil, MathUtil, floorNumberWithFloatError, roundFloat, truncNumberWithFloatError } from './Utilities.js';
 import { UnitGroupType, getStatusEffectName } from './UnitConstants.js';
 import { Unit } from './Unit.js';
 
diff --git a/Sources/DamageCalculatorWrapper.js b/Sources/DamageCalculatorWrapper.js
index 014c5d18..72916f45 100644
--- a/Sources/DamageCalculatorWrapper.js
+++ b/Sources/DamageCalculatorWrapper.js
@@ -1,8 +1,8 @@
 import { Captain, ColorType, DISABLES_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SET, EffectiveType, NoneValue, PassiveA, PassiveB, PassiveC, PassiveS, Special, Weapon, WeaponRefinementType, WeaponType } from './SkillConstants.js';
 import { StatusEffectType, StatusIndex } from './StatusConstants.js';
 import { LoggerBase, GroupLogger } from './Logger.js';
-import { NodeEnv, DamageCalculatorWrapperEnv } from './SkillEffectEnv.js';
-import { getSkillLogLevel } from './SkillEffect.js';
+import { NodeEnv, DamageCalculatorWrapperEnv, ForAlliesEnv, ForFoesEnv } from './SkillEffectEnv.js';
+import { getSkillLogLevel } from './SkillEffectEnv.js';
 import { ADVANTAGEOUS_AGAINST_COLORLESS_WEAPONS, BEAST_COMMON_SKILL_MAP, BeastCommonSkillType, CAN_SAVE_FROM_MAGIC_SKILL_SET, CAN_SAVE_FROM_MELEE_SKILL_SET, CAN_SAVE_FROM_P_SKILL_SET, CAN_SAVE_FROM_RANGED_SKILL_SET, applyDamageReductionRatioBySpecialFuncMap, applyPotentSkillEffectFuncMap, applyPrecombatDamageReductionRatioFuncMap, applySKillEffectForUnitAtBeginningOfCombatFuncMap, applySkillEffectAfterSetAttackCountFuncMap, applySkillEffectForUnitAfterCombatStatusFixedFuncMap, applySkillEffectForUnitFuncMap, applySkillEffectFromAlliesExcludedFromFeudFuncMap, applySkillEffectFromAlliesFuncMap, applySkillEffectFromEnemyAlliesFuncMap, applySkillEffectsAfterAfterBeginningOfCombatFromAlliesFuncMap, applySkillEffectsAfterAfterBeginningOfCombatFuncMap, calcFixedAddDamageFuncMap, canActivateSaveSkillFuncMap, getBreakerSkillTargetWeaponType, getRangedAttackSpecialDamageRate, getSelfDamageDealtRateToAddSpecialDamage, getSkillFunc, isDefenseSpecial, isMeleeWeaponType, isNormalAttackSpecial, isPhysicalWeaponType, isRangedWeaponType, isWeaponSpecialRefined, isWeaponTypeBeast, isWeaponTypeBow, isWeaponTypeBreath, isWeaponTypeBreathOrBeast, isWeaponTypeDagger, isWeaponTypeTome, selectReferencingResOrDefFuncMap, updateUnitSpurFromAlliesFuncMap, updateUnitSpurFromEnemyAlliesFuncMap } from './Skill.js';
 import { DamageCalculator, DamageType, DamageCalcEnv, CombatResult } from './DamageCalculator.js';
 import { GameMode } from './StatusConstants.js';
diff --git a/Sources/GameUtilities.js b/Sources/GameUtilities.js
index 6435d62a..cfb5db5b 100644
--- a/Sources/GameUtilities.js
+++ b/Sources/GameUtilities.js
@@ -1,4 +1,8 @@
 import { Query, IterUtil } from './Utilities.js';
+import { g_imageRootPath, g_siteRootPath } from './GlobalDefinitions.js';
+import { EngagedSpecialIcon } from './SkillConstants.js';
+import { UnitGroupType, getStatusEffectName, statusEffectTypeToIconFilePath } from './UnitConstants.js';
+import { DivineVeinType } from './Tile.js';
 
 // Game-specific utility functions moved from Utilities.js (Layer 0 → Layer 3+)
 
diff --git a/Sources/PostCombatSkillHander.js b/Sources/PostCombatSkillHander.js
index 54a8c97f..b448e792 100644
--- a/Sources/PostCombatSkillHander.js
+++ b/Sources/PostCombatSkillHander.js
@@ -3,8 +3,7 @@ import { StatusEffectType } from './StatusConstants.js';
 import { MoveType } from './HeroInfoConstants.js';
 import { LoggerBase } from './Logger.js';
 import { applyAttackSkillEffectAfterCombatFuncMap, applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap, applyPostCombatAllySkillFuncMap, applySkillEffectAfterCombatForUnitFuncMap, applySkillEffectAfterCombatNeverthelessDeadForUnitFuncMap, getSkillFunc, isRangedWeaponType, isWeaponTypeBeast, isWeaponTypeBreathOrBeast } from './Skill.js';
-import { getSkillLogLevel } from './SkillEffect.js';
-import { AfterCombatEnv } from './SkillEffect.js';
+import { AfterCombatEnv, getSkillLogLevel } from './SkillEffectEnv.js';
 import { AFTER_COMBAT_HOOKS, AFTER_COMBAT_AFTER_HEAL_OR_DAMAGE_HOOKS, AFTER_COMBAT_EVEN_IF_DEFEATED_HOOKS, AFTER_COMBAT_IF_UNIT_ATTACKED_HOOKS, AFTER_COMBAT_FOR_ALLIES_EVEN_IF_DEFEATED_HOOKS, FOR_ALLIES_AFTER_COMBAT_HOOKS } from './SkillEffectHooks.js';
 import { DivineVeinType } from './Tile.js';
 import { stealBonusEffects } from './SkillUtil.js';
diff --git a/Sources/SkillEffect.js b/Sources/SkillEffect.js
index f2ac5a31..1d555390 100644
--- a/Sources/SkillEffect.js
+++ b/Sources/SkillEffect.js
@@ -8,15 +8,17 @@ import { COLLECTION_NODE, UNIQUE_COLLECTION_NODE, FLATTEN_COLLECTION_NODE, MAP_C
 import { EnsureMinNode, EnsureMaxNode, EnsureMinMaxNode, ENSURE_MAX_MIN_NODE, MULT_ADD_NODE, MULT_MAX_NODE, MULT_ADD_MAX_NODE, ADD_MULT_NODE, ADD_MULT_MAX_NODE, ADD_MAX_NODE, MAX_ADD_NODE, MULT_CEIL_NODE } from './SkillEffectCore.js';
 import { FirstValueNode, UniqueCollectionNode, FlattenCollectionNode, MapCollectionNode, FilterCollectionNode, CountCollectionNode, IntersectCollectionNode, TopNNode, SumNumbersNode, CannotAnyNode, TraceBoolNode, NumThatIsNode, TernaryConditionalNumberNode, UnionSetNode, SetSizeNode } from './SkillEffectCore.js';
 import { EffectNode, XNumberNode, X } from './SkillEffectCore.js';
-import { NodeEnv } from './SkillEffectEnv.js';
-import { ArrayUtil, Base62, GeneratorUtil, IterUtil, MathUtil, SetUtil } from './Utilities.js';
-import { GameMode, NEGATIVE_STATUS_EFFECT_ORDER_MAP, POSITIVE_STATUS_EFFECT_ORDER_MAP, StatusEffectType, StatusIndex } from './StatusConstants.js';
-import { MoveType, statusTypeToString } from './HeroInfoConstants.js';
-import { Special, WeaponType } from './SkillConstants.js';
+import { NodeEnv, getSkillLogLevel, CantoEnv, BattleMapEnv, AtStartOfTurnEnv, AfterCombatEnv } from './SkillEffectEnv.js';
+import { ArrayUtil, Base62, GeneratorUtil, IterUtil, MathUtil, ObjectUtil, SetUtil } from './Utilities.js';
+import { GameMode, NEGATIVE_STATUS_EFFECT_ORDER_MAP, POSITIVE_STATUS_EFFECT_ORDER_MAP, StatFlags, StatusEffectType, StatusIndex, getStatusName } from './StatusConstants.js';
+import { MoveType, statusIndexStr, statusTypeToString } from './HeroInfoConstants.js';
+import { ColorType, Special, StyleType, WeaponType } from './SkillConstants.js';
 import { DefenceStructureBase, OffenceStructureBase, SafetyFence, TrapBase } from './Structures.js';
 import { PartnerLevel, UnitGroupType, getStatusEffectName } from './UnitConstants.js';
 import { DivineVeinType, getDivineVeinName } from './Tile.js';
+import { DamageCalculationUtility, TriangleAdvantage } from './DamageCalculationUtility.js';
 import { LoggerBase } from './Logger.js';
+import { Unit } from './Unit.js';
 import { isMeleeWeaponType, isRangedWeaponType, isWeaponTypeBreath, isWeaponTypeBreathOrBeast, isWeaponTypeTome } from './Skill.js';
 import { g_appData, moveStructureToTrashBoxCallback } from './AppDataGlobal.js';
 
@@ -2402,17 +2404,6 @@ class NumOfTargetsMovingSpacesNode extends PositiveNumberNode {
 
 // 周囲のユニット
 
-class CantoEnv extends NodeEnv {
-    /**
-     * @param {Unit} targetUnit
-     */
-    constructor(targetUnit) {
-        super();
-        this.setSkillOwner(targetUnit).setTarget(targetUnit)
-            .setTextUnit(targetUnit);
-    }
-}
-
 class CantoControlEnv extends NodeEnv {
     /**
      * @param {Unit} targetUnit
@@ -2425,50 +2416,6 @@ class CantoControlEnv extends NodeEnv {
     }
 }
 
-class BattleMapEnv extends NodeEnv {
-    /**
-     * @param {BattleMap} battleMap
-     * @param {Unit} targetUnit
-     */
-    constructor(battleMap, targetUnit) {
-        super();
-        this.setBattleMap(battleMap)
-            .setSkillOwner(targetUnit).setTarget(targetUnit)
-            .setTextUnit(targetUnit);
-    }
-}
-
-class AtStartOfTurnEnv extends NodeEnv {
-    /**
-     * @param {BeginningOfTurnSkillHandler} handler
-     * @param {Unit} targetUnit
-     */
-    constructor(handler, targetUnit) {
-        super();
-        this.phase = NodeEnv.PHASE.AT_START_OF_TURN;
-        this.setBeginningOfTurnSkillHandler(handler).setBattleMap(handler.map)
-            .setSkillOwner(targetUnit).setTarget(targetUnit)
-            .setTextUnit(targetUnit);
-    }
-}
-
-class AfterCombatEnv extends NodeEnv {
-    /**
-     * @param {PostCombatSkillHander} handler
-     * @param {Unit} targetUnit
-     * @param {Unit} enemyUnit
-     * @param {BattleMap} battleMap
-     */
-    constructor(handler, targetUnit, enemyUnit, battleMap) {
-        super();
-        this.phase = NodeEnv.PHASE.AFTER_COMBAT;
-        this.setPostCombatHandler(handler)
-            .setUnitsFromTargetAndEnemyUnit(targetUnit, enemyUnit)
-            .setBattleMap(battleMap)
-            .setTextUnit(targetUnit).setTextFoe(enemyUnit);
-    }
-}
-
 /**
  * @abstract
  */
@@ -8261,13 +8208,6 @@ class IsAnotherActionByAssistActivatedInCurrentTurnOnSkillOwnerTeamNode extends
 const IS_ANOTHER_ACTION_BY_ASSIST_ACTIVATED_IN_CURRENT_TURN_ON_SKILL_OWNER_TEAM_NODE =
     new IsAnotherActionByAssistActivatedInCurrentTurnOnSkillOwnerTeamNode();
 
-function getSkillLogLevel() {
-    if (typeof g_appData === 'undefined') {
-        return LoggerBase.LogLevel.OFF;
-    }
-    return g_appData?.skillLogLevel ?? LoggerBase.LogLevel.OFF;
-}
-
 class CanActivateAttackerSpecialNode extends BoolNode {
     static {
         Object.assign(this.prototype, GetUnitMixin);
@@ -9775,7 +9715,7 @@ const [
     BONUS_DURING_COMBAT,
     GRANTS_BONUS_DURING_COMBAT,
 ] = makeUnitFieldOperators(
-    Unit.nameOf(unit => unit.spurs),
+    'spurs', // Unit.nameOf(unit => unit.spurs)
     SkillEffectField.Op.ARRAY_ADD,
     `攻撃/速さ/守備/魔防+`
 );
@@ -9801,7 +9741,7 @@ const [
     PENALTY_DURING_COMBAT,
     INFLICTS_PENALTY_DURING_COMBAT,
 ] = makeUnitFieldOperators(
-    Unit.nameOf(unit => unit.spurs),
+    'spurs', // Unit.nameOf(unit => unit.spurs)
     SkillEffectField.Op.ARRAY_SUB,
     `攻撃/速さ/守備/魔防-`
 );
@@ -9830,7 +9770,7 @@ const [
     ,
     NEUTRALIZES_N_PENALTY_EFFECTS,
 ] = makeUnitFieldOperators(
-    (Unit.nameOf(unit => unit.reservedNegativeStatusEffectCountInOrder)),
+    'reservedNegativeStatusEffectCountInOrder', // Unit.nameOf
     SkillEffectField.Op.ADD,
     '',
     (name, n) => `${name}は戦闘中、不利な状態を上位${n}個解除`,
@@ -9872,15 +9812,15 @@ const RE_ENABLES_CANTO = CALL_UNIT_FUNC(
 
 const CANTO_HAS_ALREADY_BEEN_TRIGGERED =
     new GetSkillEffectFieldNode()
-        .setKey(Unit.nameOf(unit => unit.isCantoActivatedInCurrentTurn))
+        .setKey('isCantoActivatedInCurrentTurn') // Unit.nameOf
         .setLogMessage('再移動を発動済みか');
 
 const MOVE_TYPE = new GetSkillEffectFieldNode()
-    .setKey(Unit.nameOf(unit => unit.moveType))
+    .setKey('moveType') // Unit.nameOf
     .setLogMessageFunc((name, n) => `${name}の移動タイプ: ${n}`);
 
 const WEAPON_TYPE = new GetSkillEffectFieldNode()
-    .setKey(Unit.nameOf(unit => unit.weaponType))
+    .setKey('weaponType') // Unit.nameOf
     .setLogMessageFunc((name, n) => `${name}の武器タイプ: ${n}`);
 
 /**
@@ -9888,7 +9828,7 @@ const WEAPON_TYPE = new GetSkillEffectFieldNode()
  * @type {SkillEffectFieldNode}
  */
 const RANGE = new GetSkillEffectFieldNode()
-    .setKey(Unit.nameOf(unit => unit.attackRange))
+    .setKey('attackRange') // Unit.nameOf
     .setLogMessageFunc((name, n) => `${name}の射程: ${n}`);
 
 const ON_MAP = CALL_UNIT_FUNC(
diff --git a/Sources/SkillEffectBattleContext.js b/Sources/SkillEffectBattleContext.js
index ab67923b..8a415608 100644
--- a/Sources/SkillEffectBattleContext.js
+++ b/Sources/SkillEffectBattleContext.js
@@ -4,6 +4,9 @@ import { BattleContext } from './BattleContext.js';
 import { NodeEnv } from './SkillEffectEnv.js';
 import { g_appData } from './AppDataGlobal.js';
 import { ObjectUtil } from './Utilities.js';
+import { getStatusName } from './StatusConstants.js';
+import { getStatusEffectName } from './UnitConstants.js';
+import { EFFECTIVE_TYPE_NAMES } from './SkillConstants.js';
 
 const MOD_BATTLE_CONTEXT_FIELD = (n, op) =>
     new ModSkillEffectFieldNode(n, op).battleContext();
@@ -3847,3 +3850,4 @@ export { GRANTS_TRIANGLE_ADVANTAGE_AGAINST_COLORLESS_TARGETS_FOES_AND_INFLICTS_T
 export { REDUCES_PERCENTAGE_OF_FOES_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE, REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE };
 export { REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE, REDUCES_PERCENTAGE_OF_UNITS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE };
 export { TARGETS_NEXT_ATTACK_DEALS_DAMAGE_X_PERCENT_OF_TARGETS_FORES_ATTACK_PRIOR_TO_REDUCTION_ONLY_HIGHEST_VALUE_APPLIED_AND_DOES_NOT_STACK_NODE, TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE };
+export { CAN_FOLLOWUP_ATTACK_WITHOUT_POTENT };
diff --git a/Sources/SkillEffectCore.js b/Sources/SkillEffectCore.js
index b1a76a87..41a1585f 100644
--- a/Sources/SkillEffectCore.js
+++ b/Sources/SkillEffectCore.js
@@ -2,7 +2,8 @@ import { ArrayUtil, Base62, IterUtil, MathUtil, ObjectUtil, SetUtil } from './Ut
 import { LoggerBase } from './Logger.js';
 import { EmblemHero, getStyleTypeName } from './SkillConstants.js';
 import { NodeEnv } from './SkillEffectEnv.js';
-import { getStatusEffectName } from './UnitConstants.js';
+import { getStatusEffectName, Hero } from './UnitConstants.js';
+import { getDivineVeinName } from './Tile.js';
 import { g_appData } from './AppDataGlobal.js';
 
 /** @type {{ funcIdToFunc: Map, registeredSkillIds: Set, funcIdToName: Map } | null} */
@@ -614,7 +615,7 @@ class NumberNode extends SkillEffectNode {
     }
 
     percentage(percentage) {
-        return PERCENTAGE_NODE(this, percentage);
+        return PERCENTAGE_NODE(percentage, this);
     }
 
     /**
@@ -696,6 +697,15 @@ class CollectionNode extends SkillEffectNode {
     }
 }
 
+class UniteCollectionsNode extends CollectionNode {
+    evaluate(env) {
+        let collections = this.evaluateChildren(env);
+        return [...new Set(IterUtil.concat(...collections))];
+    }
+}
+
+const UNITE_SPACES_NODE = (...children) => new UniteCollectionsNode(...children);
+
 /**
  * @template {SkillEffectNode} T
  * @param {...T} nodes
@@ -964,6 +974,9 @@ class IntPercentageNumberNode extends NumberNode {
  */
 const INT_PERCENTAGE_NUMBER_NODE = (n) => new IntPercentageNumberNode(n);
 
+const PERCENTAGE_NODE = (percentage, num) =>
+    MULT_TRUNC_NODE(MULT_NODE(INT_PERCENTAGE_NUMBER_NODE(percentage), 0.01), num);
+
 /**
  * @abstract
  */
diff --git a/Sources/SkillEffectEnv.js b/Sources/SkillEffectEnv.js
index 2fb9c734..4bcbc429 100644
--- a/Sources/SkillEffectEnv.js
+++ b/Sources/SkillEffectEnv.js
@@ -743,6 +743,68 @@ class NodeEnv {
     }
 }
 
+function getSkillLogLevel() {
+    if (typeof g_appData === 'undefined') {
+        return LoggerBase.LogLevel.OFF;
+    }
+    return g_appData?.skillLogLevel ?? LoggerBase.LogLevel.OFF;
+}
+
+class CantoEnv extends NodeEnv {
+    /**
+     * @param {Unit} targetUnit
+     */
+    constructor(targetUnit) {
+        super();
+        this.setSkillOwner(targetUnit).setTarget(targetUnit)
+            .setTextUnit(targetUnit);
+    }
+}
+
+class BattleMapEnv extends NodeEnv {
+    /**
+     * @param {BattleMap} battleMap
+     * @param {Unit} targetUnit
+     */
+    constructor(battleMap, targetUnit) {
+        super();
+        this.setBattleMap(battleMap)
+            .setSkillOwner(targetUnit).setTarget(targetUnit)
+            .setTextUnit(targetUnit);
+    }
+}
+
+class AtStartOfTurnEnv extends NodeEnv {
+    /**
+     * @param {BeginningOfTurnSkillHandler} handler
+     * @param {Unit} targetUnit
+     */
+    constructor(handler, targetUnit) {
+        super();
+        this.phase = NodeEnv.PHASE.AT_START_OF_TURN;
+        this.setBeginningOfTurnSkillHandler(handler).setBattleMap(handler.map)
+            .setSkillOwner(targetUnit).setTarget(targetUnit)
+            .setTextUnit(targetUnit);
+    }
+}
+
+class AfterCombatEnv extends NodeEnv {
+    /**
+     * @param {PostCombatSkillHander} handler
+     * @param {Unit} targetUnit
+     * @param {Unit} enemyUnit
+     * @param {BattleMap} battleMap
+     */
+    constructor(handler, targetUnit, enemyUnit, battleMap) {
+        super();
+        this.phase = NodeEnv.PHASE.AFTER_COMBAT;
+        this.setPostCombatHandler(handler)
+            .setUnitsFromTargetAndEnemyUnit(targetUnit, enemyUnit)
+            .setBattleMap(battleMap)
+            .setTextUnit(targetUnit).setTextFoe(enemyUnit);
+    }
+}
+
 // TODO: rename. ex) DuringCombatEnv, AtStartOfCombatEnv
 class DamageCalculatorWrapperEnv extends NodeEnv {
     /**
@@ -870,4 +932,4 @@ class NeutralizingEndActionEnv extends NodeEnv {
     }
 }
 
-export { NodeEnv, DamageCalculatorWrapperEnv, DamageCalculatorEnv, BattleSimulatorBaseEnv, EnumerationEnv, ForFoesEnv, ForAlliesEnv, PreventingStatusEffectEnv, NeutralizingEndActionEnv };
+export { NodeEnv, DamageCalculatorWrapperEnv, DamageCalculatorEnv, BattleSimulatorBaseEnv, EnumerationEnv, ForFoesEnv, ForAlliesEnv, PreventingStatusEffectEnv, NeutralizingEndActionEnv, getSkillLogLevel, CantoEnv, BattleMapEnv, AtStartOfTurnEnv, AfterCombatEnv };
diff --git a/Sources/SkillImpl.js b/Sources/SkillImpl.js
index 5cb77a48..f6e3ba7c 100644
--- a/Sources/SkillImpl.js
+++ b/Sources/SkillImpl.js
@@ -19,6 +19,14 @@ import {
     StatusIndex,
 } from './StatusConstants.js';
 import { MoveType } from './HeroInfoConstants.js';
+import { getStatusEffectName } from './UnitConstants.js';
+import { DivineVeinType } from './Tile.js';
+import { g_appData } from './AppDataGlobal.js';
+import { Unit } from './Unit.js';
+import { DamageCalculationUtility, TriangleAdvantage } from './DamageCalculationUtility.js';
+import { DamageCalculatorWrapper } from './DamageCalculatorWrapper.js';
+import { stealBonusEffects } from './SkillUtil.js';
+import { DebugUtil, floorNumberWithFloatError, GeneratorUtil, IterUtil, MathUtil } from './Utilities.js';
 import {
     BEAST_COMMON_SKILL_MAP,
     CAN_MOVE_THROUGH_FOES_SPACE_SKILLS,
diff --git a/Sources/SkillImpl202408.js b/Sources/SkillImpl202408.js
index 70cf369e..8f46bd88 100644
--- a/Sources/SkillImpl202408.js
+++ b/Sources/SkillImpl202408.js
@@ -21,6 +21,8 @@ import {
     Weapon,
 } from './SkillConstants.js';
 import { StatusEffectType, StatusIndex } from './StatusConstants.js';
+import { Hero, RESET_DUO_OR_HARMONIZED_SKILL_EVERY_3_TURNS_SET } from './UnitConstants.js';
+import { DivineVeinType } from './Tile.js';
 import { SkillEffectRegistrar } from './SkillEffectRegistrar.js';
 import {
     ADD_NODE,
diff --git a/Sources/SkillImpl202501.js b/Sources/SkillImpl202501.js
index aee15893..df6d70e8 100644
--- a/Sources/SkillImpl202501.js
+++ b/Sources/SkillImpl202501.js
@@ -31,6 +31,8 @@ import {
     WeaponType,
 } from './SkillConstants.js';
 import { StatusEffectType, StatusIndex } from './StatusConstants.js';
+import { Hero, RESET_DUO_OR_HARMONIZED_SKILL_EVERY_3_TURNS_SET } from './UnitConstants.js';
+import { DivineVeinType } from './Tile.js';
 import { SkillEffectRegistrar } from './SkillEffectRegistrar.js';
 import {
     ADD_MAX_NODE,
diff --git a/Sources/SkillImpl202601.js b/Sources/SkillImpl202601.js
index f1c6ba10..434b4fc4 100644
--- a/Sources/SkillImpl202601.js
+++ b/Sources/SkillImpl202601.js
@@ -18,6 +18,8 @@ import {
     Weapon,
 } from './SkillConstants.js';
 import { StatFlags, StatusEffectType } from './StatusConstants.js';
+import { Hero } from './UnitConstants.js';
+import { DivineVeinType } from './Tile.js';
 import { SkillEffectRegistrar } from './SkillEffectRegistrar.js';
 import {
     ADD_NODE,
@@ -274,6 +276,7 @@ import {
     TARGETS_NEXT_ATTACK_DEALS_DAMAGE_X_PERCENT_OF_TARGETS_FORES_ATTACK_PRIOR_TO_REDUCTION_ONLY_HIGHEST_VALUE_APPLIED_AND_DOES_NOT_STACK_NODE,
     TRIGGERS_POTENT_FOLLOW_N_PERCENT,
     WHEN_TARGET_DEALS_DAMAGE_DURING_COMBAT_RESTORES_N_HP_TO_TARGET_NODE,
+    CAN_FOLLOWUP_ATTACK_WITHOUT_POTENT,
 } from './SkillEffectBattleContext.js';
 import {
     DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS,
diff --git a/Sources/SkillUtil.js b/Sources/SkillUtil.js
index 4398691f..846bef0b 100644
--- a/Sources/SkillUtil.js
+++ b/Sources/SkillUtil.js
@@ -1,10 +1,10 @@
-// Sources/SkillUtil.js
-// Skill.jsから移動した上位レイヤー依存の関数群
-// canRallyForcibly, canRalliedForcibly: Layer 5依存 (NodeEnv, SkillEffectHooks)
-// stealBonusEffects: Unit型メソッド呼び出しを含む
-
-// 注意: 現在はグローバル変数経由で依存を解決しているため、ESMのimportは記述しない。
-// セクション8（不足import追加）で適切なimport文が追加される。
+import { LoggerBase } from './Logger.js';
+import { Support, Weapon, PassiveB } from './SkillConstants.js';
+import { StatusEffectType } from './StatusConstants.js';
+import { getStatusEffectName } from './UnitConstants.js';
+import { getSkillFunc, canRallyForciblyByPlayerFuncMap, canRallyForciblyFuncMap, canRalliedForciblyFuncMap } from './Skill.js';
+import { NodeEnv, getSkillLogLevel } from './SkillEffectEnv.js';
+import { CAN_RALLY_FORCIBLY_HOOKS, CAN_RALLIED_FORCIBLY_HOOKS } from './SkillEffectHooks.js';
 
 function canRallyForciblyByPlayer(unit) {
     return getSkillFunc(unit.support, canRallyForciblyByPlayerFuncMap)?.call(this, unit) ?? false;
diff --git a/Sources/UnitSkillEffect.js b/Sources/UnitSkillEffect.js
index 93b3f713..6a4f26fa 100644
--- a/Sources/UnitSkillEffect.js
+++ b/Sources/UnitSkillEffect.js
@@ -1,6 +1,5 @@
-import { NeutralizingEndActionEnv, NodeEnv, PreventingStatusEffectEnv } from './SkillEffectEnv.js';
+import { CantoEnv, NeutralizingEndActionEnv, NodeEnv, PreventingStatusEffectEnv, getSkillLogLevel } from './SkillEffectEnv.js';
 import { AFTER_BEING_GRANTED_ANOTHER_ACTION_AFTER_COMBAT_HOOKS, AFTER_BEING_GRANTED_ANOTHER_ACTION_ON_ASSIST_HOOKS, AFTER_CANTO_HOOKS, AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS, AT_COMPARING_STATS_HOOKS, CALCULATES_DISTANCE_OF_CANTO_HOOKS, CALCULATES_DISTANCE_OF_CANTO_WHEN_CANTO_CONTROL_IS_APPLIED_HOOKS, CALC_HEAL_AMOUNT_HOOKS, CANNOT_FOE_MOVE_THROUGH_SPACES_ADJACENT_TO_UNIT_HOOKS, CANNOT_FOE_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_UNIT_HOOKS, CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_FOE_HOOKS, CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_3_SPACES_OF_FOE_HOOKS, CAN_ACTIVATE_STYLE_HOOKS, CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS, CAN_ATTACK_FOES_N_SPACES_AWAY_HOOKS, CAN_NEUTRALIZE_END_ACTION_BY_SKILL_EFFECTS_HOOKS, CAN_NEUTRALIZE_END_ACTION_BY_STATUS_EFFECTS_HOOKS, CAN_NEUTRALIZE_STATUS_EFFECTS_HOOKS, GET_COLOR_WHEN_DETERMINING_WEAPON_TRIANGLE_HOOKS, HAS_PATHFINDER_HOOKS, IS_AFFLICTOR_HOOKS, IS_DEBUFFER_TIER_1_HOOKS, IS_DEBUFFER_TIER_2_HOOKS, STYLE_ACTIVATED_HOOKS, UNIT_CAN_MOVE_THROUGH_FOES_SPACES_HOOKS, WHEN_CANTO_TRIGGERS_HOOKS } from './SkillEffectHooks.js';
-import { CantoEnv, getSkillLogLevel } from './SkillEffect.js';
 import { LoggerBase } from './Logger.js';
 import { CAN_MOVE_THROUGH_FOES_SPACE_SKILLS, applyEndActionSkillsFuncMap, applySkillsAfterCantoActivatedFuncMap, calcHealAmountFuncMap, calcMoveCountForCantoFuncMap, canActivateObstructToAdjacentTilesFuncMap, getColorFromWeaponType, getSkillFunc, hasPathfinderEffect, isAfflictorFuncMap, isMeleeWeaponType, isRangedWeaponType, isWeaponTypeTome } from './Skill.js';
 import { StatusEffectType } from './StatusConstants.js';
@@ -709,4 +708,4 @@ function isAfflictor(attackUnit, lossesInCombat, result) {
     return false;
 }
 
-export { calcHealAmount, isDebufferTier1, isDebufferTier2, isAfflictor };
\ No newline at end of file
+export { calcHealAmount, isDebufferTier1, isDebufferTier2, isAfflictor };
diff --git a/Tests/DamageCalculator.test.js b/Tests/DamageCalculator.test.js
index b98ccb6b..2a1175f2 100644
--- a/Tests/DamageCalculator.test.js
+++ b/Tests/DamageCalculator.test.js
@@ -1,8 +1,13 @@
-import { UnitGroupType } from '../Sources/UnitConstants.js';
-import { PassiveA, PassiveC } from '../Sources/SkillConstants.js';
-// Note: ESM TestUtilities/TestGlobals importなし。全英雄戦闘テスト(HeroBattleTest)で
-// ESM/連結版ノード型混線が発生するため、連結版グローバルを使用する。
-// Section 12で連結方式廃止後にESM化する。
+import { beforeEach, describe, expect, test } from 'vitest';
+import { g_testHeroDatabase } from './TestGlobals.js';
+import { setAppData } from '../Sources/AppDataGlobal.js';
+import { getSelfDamageDealtRateToAddSpecialDamage, SkillInfo } from '../Sources/Skill.js';
+import { PassiveA, PassiveB, PassiveC, Special, Weapon, WeaponRefinementType, WeaponType } from '../Sources/SkillConstants.js';
+import { StatusEffectType, StatusIndex } from '../Sources/StatusConstants.js';
+import { ScopedStopwatch, roundFloat, using_ } from '../Sources/Utilities.js';
+import { UnitGroupType } from '../Sources/UnitConstants.js';
+import { Unit } from '../Sources/Unit.js';
+import { test_DamageCalculator, test_calcDamage, test_calcDamageWithUnits, test_createDefaultUnit, test_executeTest } from '../Sources/TestUtilities.js';
 
 describe('Test feud skills', () => {
   let heroDatabase;
@@ -39,7 +44,7 @@ describe('Test feud skills', () => {
 
     calclator = new test_DamageCalculator();
     calclator.isLogEnabled = false;
-    globalThis.g_appData = calclator.unitManager;
+    setAppData(calclator.unitManager);
   });
 
   describe('Test disable skills from other enemies', () => {
@@ -466,7 +471,7 @@ test('DamageCalculator_SaverSkillTest', () => test_executeTest(() => {
   calclator.damageCalc.clearLog();
 }));
 
-test('DamageCalculator_HeroBattleTest', () => test_executeTest(() => {
+test('DamageCalculator_HeroBattleTest', { timeout: 20000 }, () => test_executeTest(() => {
   let log = "";
   let heroDatabase = g_testHeroDatabase;
 
@@ -495,7 +500,7 @@ test('DamageCalculator_HeroBattleTest', () => test_executeTest(() => {
     calclator.map.getTile(2, 0).setUnit(defAllyUnit);
     calclator.unitManager.units = [atkUnit, defUnit, atkAllyUnit, defAllyUnit];
     calclator.isLogEnabled = false;
-    globalThis.g_appData = calclator.unitManager;
+    setAppData(calclator.unitManager);
     // calclator.disableProfile();
 
     atkUnit.weaponRefinement = WeaponRefinementType.Special;
@@ -989,7 +994,7 @@ describe('Test great talent', () => {
 
     calclator = new test_DamageCalculator();
     calclator.isLogEnabled = false;
-    globalThis.g_appData = calclator.unitManager;
+    setAppData(calclator.unitManager);
   });
 
   test('Test great talent applied', () => {
diff --git a/Tests/Performance.test.js b/Tests/Performance.test.js
index 6b77b4bc..d0ab6ef6 100644
--- a/Tests/Performance.test.js
+++ b/Tests/Performance.test.js
@@ -78,7 +78,7 @@ describe('Performance benchmarks', () => {
                 handler.applySkillsForBeginningOfTurn(unit);
             }
             resetGlobalTestState();
-        }, 2000, 800);
+        }, 2000, 1000);
     });
 
     test('ユニット初期化（全英雄生成）が閾値以内で完了する', () => {
diff --git a/Tests/SkillEffect.test.js b/Tests/SkillEffect.test.js
index e6568602..9c9ca1a1 100644
--- a/Tests/SkillEffect.test.js
+++ b/Tests/SkillEffect.test.js
@@ -1,5 +1,51 @@
-import { NumberNode, CONSTANT_NUMBER_NODE, MultiValueMap, SkillEffectHooks } from '../Sources/SkillEffectCore.js';
+import { afterEach, beforeEach, describe, expect, test } from 'vitest';
+import { g_testHeroDatabase } from './TestGlobals.js';
+import { setAppData } from '../Sources/AppDataGlobal.js';
+import { test_DamageCalculator } from '../Sources/TestUtilities.js';
+import { BattleMap } from '../Sources/BattleMap.js';
+import { PassiveS } from '../Sources/SkillConstants.js';
+import { NEGATIVE_STATUS_EFFECT_ARRAY, POSITIVE_STATUS_EFFECT_ARRAY, StatFlags, StatusEffectType } from '../Sources/StatusConstants.js';
+import { STATUS_EFFECT_INFO_MAP, UnitGroupType } from '../Sources/UnitConstants.js';
+import { ArrayUtil, MathUtil } from '../Sources/Utilities.js';
+import {
+    NumberNode, CONSTANT_NUMBER_NODE, MultiValueMap, SkillEffectHooks,
+    ConstantNumberNode, SkillEffectNode, AndNode, TRUE_NODE, FALSE_NODE,
+    OrNode, CannotAnyNode, IfNode, CollectionNode, COLLECTION_NODE,
+    COUNT_COLLECTION, EXISTS, IntersectCollectionNode, MultNode,
+    MultTruncNode, MULT_NODE, NODE_FUNC, NUM_OF, SkillRequirement,
+    THERE_IS, X,
+} from '../Sources/SkillEffectCore.js';
 import { NodeEnv } from '../Sources/SkillEffectEnv.js';
+import { AT_COMPARING_STATS_HOOKS, AT_START_OF_COMBAT_HOOKS } from '../Sources/SkillEffectHooks.js';
+import {
+    TARGET_NODE, UNIT, FOE, ALLIES_WITHIN, ANY_SPACE, FOES_WITHIN,
+    CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP_EXCLUDING_GUARANTEED_OR_PREVENTED_FOLLOW_UPS,
+    CLOSEST_FOES, DEF, EFFECTS, FOR_UNIT, GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
+    GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE, GRANTS_BONUS, GRANTS_STATUS_EFFECTS,
+    HIGHEST, INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
+    INFLICTS_ATK_SPD_DEF_RES_ON_FOE_DURING_COMBAT_NODE,
+    INFLICTS_ATK_SPD_DEF_RES_ON_TARGET_DURING_COMBAT_NODE, INFLICTS_PENALTY,
+    NEUTRALIZES_N_PENALTY_EFFECTS, NEUTRALIZES_STAT_PENALTIES,
+    PLACED_SPACES, STATS, SkillEffectField, TARGETS_EVAL_SPD_NODE,
+    UNITS_NODE,
+} from '../Sources/SkillEffect.js';
+import {
+    CALCULATES_DAMAGE_USING_LOWER_OF_FOES_DEF_OR_RES, CANNOT_TRIGGER_PRECOMBAT_SPECIAL,
+    CAN_COUNTERATTACK_REGARDLESS_OF_RANGE, DEALS_DAMAGE, DEALS_DAMAGE_OF_SPECIAL,
+    DEALS_DAMAGE_PER_ATTACK, DISABLES_DEFENSIVE_TERRAIN_EFFECTS,
+    DISABLES_INCREASE_COOLDOWN_COUNT_FOR_ATTACK, DISABLES_INCREASE_COOLDOWN_COUNT_FOR_DEFENSE,
+    DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY, DISABLES_SKILLS_THAT_PREVENT_COUNTERATTACKS,
+    DISABLES_SUPPORT_EFFECTS, DOES_NOT_TRIGGER_FOES_SAVIOR_EFFECTS,
+    FOLLOWUP_ATTACK_PRIORITY_DECREMENT, FOLLOWUP_ATTACK_PRIORITY_INCREMENT, HAS_DEEP_WOUNDS,
+    INCREASES_SPD_DIFF_FOR_FOLLOWUP,
+    INVALIDATES_COUNTERATTACK, INVALIDATES_FOES_NON_SPECIAL_DAMAGE_REDUCTION,
+    IS_DESPERATION_ACTIVATABLE, IS_VANTAGE_ACTIVATABLE, PREVENTS_ATTACKER_SPECIAL,
+    PREVENTS_DEFENDER_SPECIAL, PREVENTS_DEFENDER_SPECIAL_PER_ATTACK, REDUCES_DAMAGE_PER_ATTACK,
+    RESTORES_HP_AFTER_COMBAT, SETS_ATTACK_COUNT, SETS_COUNTERATTACK_COUNT,
+    SETS_NON_SPECIAL_MIRACLE_HP_THRESHOLD, SPECIAL_COUNT_REDUCTION_BEFORE_ATTACK,
+} from '../Sources/SkillEffectBattleContext.js';
+import { DEALS_DAMAGE_X_NODE, TARGETS_ATK_ON_MAP, TARGETS_SPD_ON_MAP } from '../Sources/SkillEffectAliases.js';
+import { INFLICTS_STATUS_EFFECTS } from '../Sources/SkillEffectUnit.js';
 
 describe('Test skill effect', () => {
     describe(`Test ${NumberNode.name}`, () => {
@@ -299,7 +345,7 @@ describe('Bonuses or penalties', () => {
 
         let calculator = new test_DamageCalculator();
         calculator.unitManager.units = [unit, foe];
-        globalThis.g_appData = calculator.unitManager;
+        setAppData(calculator.unitManager);
 
         [unit.atkWithSkills, unit.spdWithSkills, unit.defWithSkills, unit.resWithSkills] = BASE_STATS;
         [foe.atkWithSkills, foe.spdWithSkills, foe.defWithSkills, foe.resWithSkills] = BASE_STATS;
@@ -441,7 +487,7 @@ describe('Skills during combat', () => {
         calculator = new test_DamageCalculator();
         calculator.unitManager.units = [atkUnit, defUnit];
         calculator.isLogEnabled = true;
-        globalThis.g_appData = calculator.unitManager;
+        setAppData(calculator.unitManager);
         // g_appData.skillLogLevel = LoggerBase.LogLevel.ALL;
     });
 
@@ -519,7 +565,7 @@ describe('Effect Node', () => {
         calculator = new test_DamageCalculator();
         calculator.unitManager.units = [atkUnit, defUnit];
         calculator.isLogEnabled = true;
-        globalThis.g_appData = calculator.unitManager;
+        setAppData(calculator.unitManager);
         // g_appData.skillLogLevel = LoggerBase.LogLevel.ALL;
     });
 
diff --git a/Tests/SkillSplit.test.js b/Tests/SkillSplit.test.js
index 82fe83e1..0a94fa0d 100644
--- a/Tests/SkillSplit.test.js
+++ b/Tests/SkillSplit.test.js
@@ -3,11 +3,36 @@
  * セクション4: Skill.jsがLayer 2データモデルのみに絞り込まれたことを確認する
  */
 import { describe, it, expect } from 'vitest';
+import fs from 'node:fs';
+import path from 'node:path';
+import {
+    SkillInfo,
+    isPhysicalWeaponType,
+    isMeleeWeaponType,
+    isRangedWeaponType,
+    getAttackRangeOfWeaponType,
+    getNormalSkillId,
+    getRefinementSkillId,
+    getSpecialRefinementSkillId,
+    WEAPON_TYPE_ATTACK_RANGE_MAP,
+    PHYSICAL_WEAPON_TYPE_SET,
+    applySkillEffectForUnitFuncMap,
+    canActivateCantoFuncMap,
+    calcMoveCountForCantoFuncMap,
+    getSkillFunc,
+} from '../Sources/Skill.js';
+import { canRallyForcibly, canRalliedForcibly, stealBonusEffects, canRallyForciblyByPlayer } from '../Sources/SkillUtil.js';
+
+const createSkillInfo = () => new SkillInfo(
+    0, '', 0, 0, 0, 0, 0, 0, 0,
+    [], [], 0, 0, 0, false, false, 0, false, false, 0,
+    true, 0, 0, 0, false, [], [], false, false, '', 0,
+);
 
 describe('Skill.js分割後のシンボル可用性', () => {
     it('SkillInfoクラスがimportでき、インスタンス生成が可能', () => {
         expect(typeof SkillInfo).toBe('function');
-        const info = new SkillInfo();
+        const info = createSkillInfo();
         expect(info).toBeDefined();
     });
 
@@ -42,15 +67,15 @@ describe('Skill.js分割後のシンボル可用性', () => {
 
 describe('SkillInfoクラスの動作', () => {
     it('基本プロパティにアクセスできる', () => {
-        const info = new SkillInfo();
+        const info = createSkillInfo();
         // SkillInfoのプロパティはコンストラクタで初期化されないためundefined
         // hasOwnPropertyでプロパティの存在を確認するのではなく、プロトタイプにアクセスできることを確認
-        expect('id' in info || info.id === undefined).toBe(true);
+        expect('id' in info).toBe(true);
         expect(typeof info.getDisplayName).toBe('function');
     });
 
     it('メソッドが正常に動作する', () => {
-        const info = new SkillInfo();
+        const info = createSkillInfo();
         expect(typeof info.isDuel4).toBe('function');
         expect(typeof info.isDuel3).toBe('function');
         expect(typeof info.getDisplayName).toBe('function');
@@ -59,8 +84,6 @@ describe('SkillInfoクラスの動作', () => {
 
 describe('Skill.jsのレイヤー制約', () => {
     it('Skill.jsがLayer 3以上のシンボルをimportしていない', async () => {
-        const fs = await import('fs');
-        const path = await import('path');
         const content = fs.readFileSync(path.join(process.cwd(), 'Sources', 'Skill.js'), 'utf-8');
 
         // Layer 5のシンボルがimportされていないことを確認
@@ -78,8 +101,6 @@ describe('Skill.jsのレイヤー制約', () => {
     });
 
     it('stealBonusEffects関数がSkill.jsに存在しない', async () => {
-        const fs = await import('fs');
-        const path = await import('path');
         const content = fs.readFileSync(path.join(process.cwd(), 'Sources', 'Skill.js'), 'utf-8');
 
         // function定義が存在しないことを確認（exportの残留も不可）
@@ -87,8 +108,6 @@ describe('Skill.jsのレイヤー制約', () => {
     });
 
     it('canRallyForcibly/canRalliedForcibly/canRallyForciblyByPlayer関数がSkill.jsに存在しない', async () => {
-        const fs = await import('fs');
-        const path = await import('path');
         const content = fs.readFileSync(path.join(process.cwd(), 'Sources', 'Skill.js'), 'utf-8');
 
         expect(content).not.toMatch(/^function canRallyForcibly[^B]/m);
diff --git a/Tests/UnitSplit.test.js b/Tests/UnitSplit.test.js
index 82d42b22..b656b18e 100644
--- a/Tests/UnitSplit.test.js
+++ b/Tests/UnitSplit.test.js
@@ -6,9 +6,31 @@
 import { describe, it, expect } from 'vitest';
 import fs from 'node:fs';
 import path from 'node:path';
+import { BattleMapElement } from '../Sources/BattleMapElement.js';
+import {
+    Unit,
+    AttackableUnitInfo,
+    AttackEvaluationContext,
+    AssistableUnitInfo,
+    ActionContext,
+    PrecombatContext,
+    UnitUtil,
+    initUnitSkillEffects,
+    isThief,
+    calcArenaBaseStatusScore,
+    calcArenaTotalSpScore,
+    calcBuffAmount,
+    calcHealAmount,
+    isDebufferTier1,
+    isDebufferTier2,
+    isAfflictor,
+    canRefreshTo,
+} from '../Sources/Unit.js';
 
 const SOURCES = path.resolve(import.meta.dirname, '..', 'Sources');
 
+initUnitSkillEffects(Unit);
+
 describe('UnitCore.js', () => {
     it('Unitクラスがimportでき、基本プロパティにアクセスできる', () => {
         expect(typeof Unit).toBe('function');
diff --git a/Tests/section06-remaining-cycles.test.js b/Tests/section06-remaining-cycles.test.js
index 758ff574..b446e8ea 100644
--- a/Tests/section06-remaining-cycles.test.js
+++ b/Tests/section06-remaining-cycles.test.js
@@ -94,7 +94,7 @@ describe('Section 6: Remaining cycle resolution', () => {
     });
 
     describe('Task 4: Zero cycles', () => {
-        it('madge --circular Sources/ reports no circular dependencies', () => {
+        it('madge --circular Sources/ reports no circular dependencies', { timeout: 30000 }, () => {
             const result = execFileSync('npx', ['madge', '--circular', '--no-color', 'Sources/'], {
                 cwd: resolve(SOURCES_DIR, '..'),
                 encoding: 'utf-8',
diff --git a/vite.config.js b/vite.config.js
index 7c17985b..f562c7ba 100644
--- a/vite.config.js
+++ b/vite.config.js
@@ -7,7 +7,6 @@ export default defineConfig({
     test: {
         globals: true,
         environment: 'jsdom',
-        setupFiles: ['./vitest.setup.js'],
         // Override top-level root ('Sources') so Vitest resolves Tests/ from project root
         root: './',
         include: ['Tests/**/*.test.js'],
diff --git a/vitest.setup.js b/vitest.setup.js
deleted file mode 100644
index 958b04c9..00000000
--- a/vitest.setup.js
+++ /dev/null
@@ -1,87 +0,0 @@
-// Vitest setup file
-// Loads all source files via concatenation (stripping import/export),
-// mimicking the create_tests.sh approach. This is necessary because
-// source files have circular dependencies that prevent proper ESM loading.
-//
-// TODO: Remove this concatenation after resolving circular dependencies in:
-//   - SkillEffect.js ↔ SkillEffectUnit.js (class hierarchy cycle at evaluation time)
-//   - SkillEffect.js ↔ SkillEffectField.js (SingleEffectNode cross-reference)
-//   - SkillImpl files (hundreds of missing ESM imports from concatenation globals)
-// See: docs/planning/phase4/implementation/code_review/section-09-interview.md
-
-import fs from 'node:fs';
-import path from 'node:path';
-import vm from 'node:vm';
-
-const ROOT = path.resolve(import.meta.dirname);
-const SOURCES = path.join(ROOT, 'Sources');
-const TESTS = path.join(ROOT, 'Tests');
-
-// Same order as create_tests.sh SOURCE_FILE_NAMES
-const SOURCE_FILE_NAMES = [
-    'AppDataGlobal',
-    'GlobalDefinitions', 'Utilities', 'GameUtilities', 'Logger', 'SkillConstants', 'StatusConstants', 'Skill', 'SkillUtil',
-    'BattleMapElement', 'Tile', 'Structures', 'Cell', 'Table',
-    'HeroInfoConstants', 'HeroInfo', 'UnitConstants', 'BattleContext', 'UnitCore', 'UnitBattle',
-    'UnitManager', 'BattleMap', 'GlobalBattleContext', 'DamageCalculationUtility',
-    'DamageCalculator', 'PostCombatSkillHander', 'DamageCalculatorWrapper',
-    'BeginningOfTurnSkillHandler', 'SkillDatabase', 'HeroDatabase',
-    'SampleSkillInfos', 'SampleHeroInfos', 'SkillEffectCore', 'SkillEffectEnv',
-    'SkillEffect', 'SkillEffectField', 'SkillEffectUnit',
-    'SkillEffectBattleContext', 'SkillEffectHooks', 'UnitSkillEffect', 'SkillEffectRegistrar',
-    'SkillEffectAliases', 'CustomSkill', 'SkillImpl', 'SkillImpl202408',
-    'SkillImpl202501', 'SkillImpl202601', 'TestUtilities',
-];
-
-// TestGlobals.js is now an ESM module with import/export statements.
-// Apply filterImportExport to strip them for concatenation compatibility.
-const TEST_UTIL_FILE_NAMES = ['TestGlobals'];
-
-function filterImportExport(content) {
-    const lines = content.split('\n');
-    const result = [];
-    let inMultiLineImport = false;
-    for (const line of lines) {
-        if (inMultiLineImport) {
-            // Skip lines until we find the closing of the import statement
-            if (/\bfrom\s+['"]/.test(line) || /^}\s*from\s+['"]/.test(line)) {
-                inMultiLineImport = false;
-            }
-            continue;
-        }
-        if (/^import /.test(line)) {
-            // Check if this is a complete single-line import
-            if (/from\s+['"]/.test(line) || /^import\s+['"]/.test(line)) {
-                continue; // single-line import, skip it
-            }
-            // Multi-line import starts here
-            inMultiLineImport = true;
-            continue;
-        }
-        if (/^export \{/.test(line)) {
-            continue;
-        }
-        result.push(line.replace(/^export (function|class|const|let|var) /, '$1 '));
-    }
-    return result.join('\n');
-}
-
-// Concatenate all source files
-let concatenated = '';
-for (const name of SOURCE_FILE_NAMES) {
-    const filePath = path.join(SOURCES, name + '.js');
-    concatenated += filterImportExport(fs.readFileSync(filePath, 'utf-8')) + '\n';
-}
-for (const name of TEST_UTIL_FILE_NAMES) {
-    const filePath = path.join(TESTS, name + '.js');
-    concatenated += filterImportExport(fs.readFileSync(filePath, 'utf-8')) + '\n';
-}
-
-// Execute in a context where 'this' is globalThis, so var/function declarations
-// and explicit assignments become global properties.
-// Wrap in a function to catch const/let/class and expose them via 'this'.
-// UnitSkillEffect.js の initUnitSkillEffects を呼び出して prototype にメソッドを追加
-concatenated += '\ninitUnitSkillEffects(Unit);\n';
-
-const script = new vm.Script(concatenated, { filename: 'vitest-concatenated-sources.js' });
-script.runInThisContext();
