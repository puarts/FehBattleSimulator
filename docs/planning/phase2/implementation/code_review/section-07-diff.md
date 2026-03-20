diff --git a/Sources/BattleContext.js b/Sources/BattleContext.js
index 84152c54..3c9eb9a5 100644
--- a/Sources/BattleContext.js
+++ b/Sources/BattleContext.js
@@ -1,3 +1,6 @@
+import { ObjectUtil } from './Utilities.js';
+import { DamageCalculationUtility } from './DamageCalculationUtility.js';
+
 /// ダメージ計算時のコンテキストです。 DamageCalculator でこのコンテキストに設定された値が使用されます。
 class BattleContext {
     /**
@@ -1136,3 +1139,5 @@ class BattleContext {
         return this.preventedDefenderSpecial || this.preventedDefenderSpecialPerAttack;
     }
 }
+
+export { BattleContext };
diff --git a/Sources/BattleMap.js b/Sources/BattleMap.js
index 110a694e..099c8e57 100644
--- a/Sources/BattleMap.js
+++ b/Sources/BattleMap.js
@@ -1,3 +1,9 @@
+import { Tile, TileType, DivineVeinType } from './Tile.js';
+import { BreakableWall, BreakableWallIconType } from './Structures.js';
+import { UnitGroupType } from './UnitConstants.js';
+import { MoveType } from './HeroInfoConstants.js';
+import { g_imageRootPath, g_corsImageRootPath } from './GlobalDefinitions.js';
+
 /// @file
 /// @brief BattleMap クラスとそれに関連するクラスや関数等の定義です。
 
@@ -3663,3 +3669,8 @@ class BattleMap {
         }
     }
 }
+
+export { MapType, MapType_ArenaOffset, MapType_ResonantBattlesOffset, MapType_TempestTrialsOffset, MapType_SummonerDuelsOffset };
+export { SummonerDuelsMapKindOptions, ResonantBattlesMapKindOptions, TempestTrialsMapKindOptions, ArenaMapKindOptions, ArenaMapRotation };
+export { isAetherRaidMap, isArenaMap, isResonantBattlesMap, isTempestTrialsMap, isSummonerDuelsMap };
+export { DefaultResonantBattleMap, DefaultTempestTrialsMap, tileTypeToThumb, tileTypeToColor, getMapBackgroundImage, BattleMap };
diff --git a/Sources/GlobalBattleContext.js b/Sources/GlobalBattleContext.js
index f4a992ac..2a2c0781 100644
--- a/Sources/GlobalBattleContext.js
+++ b/Sources/GlobalBattleContext.js
@@ -1,3 +1,6 @@
+import { UnitGroupType } from './UnitConstants.js';
+import { Captain } from './SkillConstants.js';
+import { SeasonType } from './HeroInfoConstants.js';
 
 class GlobalBattleContext {
     constructor() {
@@ -293,3 +296,5 @@ class GlobalBattleContext {
         return this.miracleWithoutSpecialActivationCountInCurrentTurn[groupId] >= 1;
     }
 }
+
+export { GlobalBattleContext };
diff --git a/Sources/Unit.js b/Sources/Unit.js
index ac98e12e..04c48f39 100644
--- a/Sources/Unit.js
+++ b/Sources/Unit.js
@@ -1,3 +1,22 @@
+import { ObjectUtil, MathUtil, ArrayUtil } from './Utilities.js';
+import { BattleMapElement } from './BattleMapElement.js';
+import { BattleContext } from './BattleContext.js';
+import { Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveS, PassiveX, Captain, CantoSupport, WeaponRefinementType, EmblemHero, WeaponType, SkillType } from './SkillConstants.js';
+import { MoveType, StatusType, BlessingType, UnitRarity } from './HeroInfoConstants.js';
+import { UnitGroupType, SummonerLevel, PerTurnStatusType, NotReserved, CombatResultType, isThiefId } from './UnitConstants.js';
+import { CanNotReachTile } from './Tile.js';
+import { DefenceStructureBase, OffenceStructureBase } from './Structures.js';
+import { isMeleeWeaponType, isRangedWeaponType, isPhysicalWeaponType, isWeaponTypeDagger, isWeaponTypeTome, isWeaponTypeBeast, isWeaponTypeThatCanAddAtk2AfterTransform } from './Skill.js';
+import { getColorFromWeaponType, getAttackRangeOfWeaponType, stringToWeaponType, getSkillFunc, getAtkBuffAmount, getSpdBuffAmount, getDefBuffAmount, getResBuffAmount } from './Skill.js';
+import { getDivineVeinSkillId, getEmblemHeroSkillId } from './Skill.js';
+import { applySkillsAfterCantoActivatedFuncMap, setOnetimeActionActivatedFuncMap, applyEndActionSkillsFuncMap, resetMaxSpecialCountFuncMap } from './Skill.js';
+import { canDisableAttackOrderSwapSkillFuncMap, calcMoveCountForCantoFuncMap, calcHealAmountFuncMap, isAfflictorFuncMap, canActivateObstructToAdjacentTilesFuncMap } from './Skill.js';
+import { LoggerBase } from './Logger.js';
+import { NodeEnv } from './SkillEffectEnv.js';
+import { IS_DEBUFFER_TIER_1_HOOKS, IS_DEBUFFER_TIER_2_HOOKS, IS_AFFLICTOR_HOOKS, CALC_HEAL_AMOUNT_HOOKS } from './SkillEffectHooks.js';
+import { getSkillLogLevel } from './SkillEffect.js';
+import { ValueDelimiter } from './GlobalDefinitions.js';
+
 /**
  * @file
  * @brief Unit クラスやそれに関連する関数や変数定義です。
@@ -7422,3 +7441,7 @@ function isAfflictor(attackUnit, lossesInCombat, result) {
 function canRefreshTo(targetUnit) {
     return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
 }
+
+export { Unit, AttackableUnitInfo, AttackEvaluationContext, AssistableUnitInfo, ActionContext, PrecombatContext, UnitUtil };
+export { isThief, calcArenaBaseStatusScore, calcArenaTotalSpScore, calcBuffAmount, calcHealAmount };
+export { isDebufferTier1, isDebufferTier2, isAfflictor, canRefreshTo };
diff --git a/Sources/UnitManager.js b/Sources/UnitManager.js
index 2b4f8882..e1cb596d 100644
--- a/Sources/UnitManager.js
+++ b/Sources/UnitManager.js
@@ -1,3 +1,8 @@
+import { Unit, UnitUtil } from './Unit.js';
+import { UnitGroupType } from './UnitConstants.js';
+import { MoveType } from './HeroInfoConstants.js';
+import { IterUtil, GeneratorUtil, UnitQuery } from './Utilities.js';
+import { isWeaponTypeBreath, isWeaponTypeBeast } from './Skill.js';
 
 const MaxEnemyUnitCount = 12;
 const MaxAllyUnitCount = 20;
@@ -349,3 +354,5 @@ class UnitManager {
         return IterUtil.minElements(units, u => targetUnit.distance(u));
     }
 }
+
+export { UnitManager, MaxEnemyUnitCount, MaxAllyUnitCount };
