diff --git a/Deploy.bat b/Deploy.bat
index 608bc43d..5534607a 100644
--- a/Deploy.bat
+++ b/Deploy.bat
@@ -16,7 +16,7 @@ set BF=core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,dat
 rem �}�b�v�E�\��
 set BF=%BF%,map\BattleMapElement,map\Tile,map\BattleMap,map\BattleMapSettings,map\Structures,map\Cell,map\Table
 rem ���j�b�g�E���
-set BF=%BF%,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,unit\GlobalBattleContext
+set BF=%BF%,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitManager,unit\GlobalBattleContext
 rem �v�Z���W�b�N
 set BF=%BF%,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper
 set BF=%BF%,combat\BeginningOfTurnSkillHandler
@@ -39,13 +39,13 @@ rem �p�Y�����V�~�����[�^�[
 call %~dp0MergeSourcesAndCompress.bat FehSummonerDuelsSimulator %battle_simulator_filenames%,pages\SummonerDuelsSimulatorMain
 
 rem �X�e�[�^�X�v�Z�@
-call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator core\GlobalDefinitions,core\Utilities,data\SkillConstants,data\Skill,map\BattleMapElement,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,pages\StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator core\GlobalDefinitions,core\Utilities,data\SkillConstants,data\Skill,map\BattleMapElement,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,pages\StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem ���j�b�g�r���_�[
-call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem �_���[�W�v�Z�@
-call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\Unit,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem �p�Y�A�C�R�����X�g
 call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,data\HeroInfoConstants,data\HeroInfo,database\HeroDatabase,pages\HeroIconListerMain,database\SampleHeroInfos,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
diff --git a/Sources/AetherRaidSimulator.html b/Sources/AetherRaidSimulator.html
index 350b3175..0992c5c8 100644
--- a/Sources/AetherRaidSimulator.html
+++ b/Sources/AetherRaidSimulator.html
@@ -1470,6 +1470,7 @@
                     "data/HeroInfo.js",
                     "data/UnitConstants.js",
                     "unit/BattleContext.js",
+                    "unit/UnitContext.js",
                     "unit/Unit.js",
                     "unit/UnitManager.js",
                     "map/BattleMap.js",
diff --git a/Sources/ArenaSimulator.html b/Sources/ArenaSimulator.html
index 134127de..4332cb8b 100644
--- a/Sources/ArenaSimulator.html
+++ b/Sources/ArenaSimulator.html
@@ -1440,6 +1440,7 @@
                     "data/HeroInfo.js",
                     "data/UnitConstants.js",
                     "unit/BattleContext.js",
+                    "unit/UnitContext.js",
                     "unit/Unit.js",
                     "unit/UnitManager.js",
                     "map/BattleMap.js",
diff --git a/Sources/DamageCalculator.html b/Sources/DamageCalculator.html
index a53c7b96..58687590 100644
--- a/Sources/DamageCalculator.html
+++ b/Sources/DamageCalculator.html
@@ -484,6 +484,7 @@
                     "data/HeroInfo.js",
                     "data/UnitConstants.js",
                     "unit/BattleContext.js",
+                    "unit/UnitContext.js",
                     "unit/Unit.js",
                     "unit/UnitManager.js",
                     "database/SkillDatabase.js",
diff --git a/Sources/HeroStatusClusterer.html b/Sources/HeroStatusClusterer.html
index f128dbdd..7d585cca 100644
--- a/Sources/HeroStatusClusterer.html
+++ b/Sources/HeroStatusClusterer.html
@@ -272,6 +272,7 @@
                 "map/BattleMapElement.js",
                 "data/UnitConstants.js",
                 "unit/BattleContext.js",
+                "unit/UnitContext.js",
                 "unit/Unit.js",
                 "unit/UnitManager.js",
                 "database/HeroDatabase.js",
diff --git a/Sources/StatusCalculator.html b/Sources/StatusCalculator.html
index 168d3fdb..cb20d265 100644
--- a/Sources/StatusCalculator.html
+++ b/Sources/StatusCalculator.html
@@ -272,6 +272,7 @@
                     "data/HeroInfo.js",
                     "data/UnitConstants.js",
                     "unit/BattleContext.js",
+                    "unit/UnitContext.js",
                     "unit/Unit.js",
                     "pages/StatusCalcMain.js",
                     ...SKILL_EFFECT_FILES,
diff --git a/Sources/SummonerDuelsSimulator.html b/Sources/SummonerDuelsSimulator.html
index ca45eee1..4fcf83e5 100644
--- a/Sources/SummonerDuelsSimulator.html
+++ b/Sources/SummonerDuelsSimulator.html
@@ -1532,6 +1532,7 @@
                     "data/HeroInfo.js",
                     "data/UnitConstants.js",
                     "unit/BattleContext.js",
+                    "unit/UnitContext.js",
                     "unit/Unit.js",
                     "unit/UnitManager.js",
                     "map/BattleMap.js",
diff --git a/Sources/UnitBuilder.html b/Sources/UnitBuilder.html
index 4a146eb5..b4c3fdc0 100644
--- a/Sources/UnitBuilder.html
+++ b/Sources/UnitBuilder.html
@@ -1258,6 +1258,7 @@
                     "data/HeroInfo.js",
                     "data/UnitConstants.js",
                     "unit/BattleContext.js",
+                    "unit/UnitContext.js",
                     "unit/Unit.js",
                     "unit/UnitManager.js",
                     "map/BattleMap.js",
diff --git a/Sources/unit/BattleContext.js b/Sources/unit/BattleContext.js
index 84152c54..817e0b5f 100644
--- a/Sources/unit/BattleContext.js
+++ b/Sources/unit/BattleContext.js
@@ -1136,3 +1136,24 @@ class BattleContext {
         return this.preventedDefenderSpecial || this.preventedDefenderSpecialPerAttack;
     }
 }
+
+/**
+ * TODO: リファクタリング
+ * BattleContextについて範囲奥義で設定したコンテキストを戦闘開始時に消してしまうので両方で使用可能な値の扱いが非常に複雑になってしまっているので修正する
+ */
+class PrecombatContext {
+    constructor() {
+        this.initContext();
+    }
+
+    initContext() {
+        this.damageCountOfSpecialAtTheSameTime = 0;
+    }
+
+    /**
+     * @param {BattleContext} context
+     */
+    copyTo(context) {
+        context.damageCountOfSpecialAtTheSameTime = this.damageCountOfSpecialAtTheSameTime;
+    }
+}
diff --git a/Sources/unit/Unit.js b/Sources/unit/Unit.js
index ac98e12e..eb52039f 100644
--- a/Sources/unit/Unit.js
+++ b/Sources/unit/Unit.js
@@ -15,361 +15,6 @@ function calcArenaTotalSpScore(totalSp) {
     return Math.floor(totalSp / 100);
 }
 
-/// 攻撃可能なユニット情報です。
-class AttackableUnitInfo {
-    /**
-     * @param  {Unit} targetUnit
-     */
-    constructor(targetUnit) {
-        /** @type {Unit} **/
-        this.targetUnit = targetUnit;
-
-        /** @type {Tile[]} **/
-        this.tiles = [];
-
-        /** @type {Tile} **/
-        this.bestTileToAttack = null;
-        this.damageRatios = [];
-
-        /** @type {CombatResultType[]} **/
-        this.combatResults = [];
-
-        /** @type {CombatResult[]} **/
-        this.combatResultDetails = [];
-
-        /** @type {boolean} **/
-        this.usesStyle = false;
-    }
-
-    toString() {
-        let result = this.targetUnit.getNameWithGroup() + ": ";
-        for (let tile of this.tiles) {
-            result += "(" + tile.posX + "," + tile.posY + ")";
-        }
-        return result;
-    }
-}
-
-/// 攻撃の優先度評価に使用するコンテキストです。
-class AttackEvaluationContext {
-    constructor() {
-        this.damageRatio = 0;
-        this.combatResult = CombatResultType.Draw;
-        this.isDebufferTier1 = false;
-        this.isDebufferTier2 = false;
-        this.isAfflictor = false;
-        this.isSpecialChargeIncreased = false;
-        this.movementRange = 0;
-
-        this.attackPriority = 0;
-        this.attackTargetPriorty = 0;
-    }
-
-    calcAttackTargetPriority(attackTarget) {
-        let specialChargeIncreasedPriority = 0;
-        if (this.isSpecialChargeIncreased) {
-            specialChargeIncreasedPriority = 1;
-        }
-
-        let debufferTier1Priority = 0;
-        if (this.isDebufferTier1) {
-            debufferTier1Priority = 1;
-        }
-        let debufferTier2Priority = 0;
-        if (this.isDebufferTier2) {
-            debufferTier2Priority = 1;
-        }
-
-        this.attackTargetPriorty =
-            this.combatResult * 1000000 +
-            debufferTier1Priority * 500000 +
-            debufferTier2Priority * 250000 +
-            this.damageRatio * 100 +
-            specialChargeIncreasedPriority * 10 +
-            attackTarget.slotOrder;
-    }
-
-    calcAttackPriority(attacker) {
-        let specialChargeIncreasedPriority = 0;
-        if (this.isSpecialChargeIncreased) {
-            specialChargeIncreasedPriority = 1;
-        }
-        let debuffPriority1 = 0;
-        let debuffPriority2 = 0;
-        if (this.isDebufferTier1) {
-            debuffPriority1 = 1;
-        } else if (this.isDebufferTier2) {
-            debuffPriority2 = 1;
-        }
-        let afflictorPriority = 0;
-        if (this.isAfflictor) {
-            afflictorPriority = 1;
-        }
-        this.movementRange = attacker.moveCount;
-
-        this.attackPriority =
-            this.combatResult * 1000000 +
-            debuffPriority1 * 500000 +
-            debuffPriority2 * 250000 +
-            afflictorPriority * 100000 +
-            this.damageRatio * 100 +
-            this.movementRange * 20 +
-            specialChargeIncreasedPriority * 10 +
-            attacker.slotOrder;
-    }
-}
-
-/// 補助行動の優先度を計算するためのクラスです。
-class AssistableUnitInfo {
-    constructor(targetUnit) {
-        this.targetUnit = targetUnit;
-        this.assistableTiles = [];
-
-        // noinspection JSUnusedGlobalSymbols
-        this.hasThreatenedByEnemyStatus = targetUnit.actionContext.hasThreatenedByEnemyStatus;
-        this.hasThreatensEnemyStatus = targetUnit.actionContext.hasThreatensEnemyStatus;
-        this.amountOfStatsActuallyBuffed = 0;
-        this.amountHealed = 0;
-        this.distanceFromClosestEnemy = targetUnit.distanceFromClosestEnemy;
-        this.visibleStatTotal = targetUnit.getVisibleStatusTotal();
-        this.slotOrder = targetUnit.slotOrder;
-        this.isTeleportationRequired = false;
-        this.requiredMovementCount = 0;
-        this.numOfOtherEligibleTargetsBuffed = 0;
-        this.isIntendedAndLowestSlot = false;
-
-        this.assistTargetPriority = 0;
-        this.rallyUpTargetPriority = 0;
-
-        this.bestTileToAssist = null;
-        this.hasStatAndNonStatDebuff = 0;
-    }
-
-    calcAssistTargetPriority(assistUnit, isPrecombat = true, isCantoAssist = false) {
-        let assistType;
-        if (isCantoAssist) {
-            assistType = assistUnit.cantoAssistType;
-        } else {
-            assistType = assistUnit.supportInfo.assistType;
-            // TODO: 検証する。とりあえずHPが減っていた場合は回復スキルとして扱う
-            let skillId = assistUnit.support;
-            if (isRallyHealSkill(skillId)) {
-                assistType = this.targetUnit.isFullHp ? AssistType.Rally : AssistType.Heal;
-            }
-        }
-        switch (assistType) {
-            case AssistType.Refresh:
-                this.assistTargetPriority = this.__calcRefreshTargetPriority();
-                break;
-            case AssistType.Heal:
-                this.assistTargetPriority = this.__calcHealTargetPriority(assistUnit);
-                break;
-            case AssistType.Rally:
-                this.assistTargetPriority = this.__calcRallyTargetPriority(assistUnit, isPrecombat);
-                break;
-            case AssistType.Move:
-                this.assistTargetPriority = this.__calcMovementTargetPriority(assistUnit);
-                break;
-            case AssistType.Restore:
-                this.assistTargetPriority = this.__calcRestoreTargetPriority(assistUnit);
-                break;
-        }
-        if (!isCantoAssist) {
-            let skillId = assistUnit.support;
-            if (isRallyHealSkill(skillId)) {
-                // 応援より回復優先
-                if (assistType === AssistType.Heal) {
-                    // TODO: 適切な数値に修正する
-                    this.assistTargetPriority *= 10000000;
-                }
-            }
-        }
-    }
-
-    __calcRestoreTargetPriority(assistUnit) {
-        this.amountHealed = calcHealAmount(assistUnit, this.targetUnit);
-        let negativeEffectPriority = 0;
-        let amountHealedPriority = 0;
-        let visibleStatTotalPriority = 0;
-        if (!this.targetUnit.hasNegativeStatusEffect()) {
-            negativeEffectPriority = 1;
-            amountHealedPriority = this.amountHealed;
-            visibleStatTotalPriority = this.visibleStatTotal;
-        }
-
-        return negativeEffectPriority * 1000000
-            + amountHealedPriority * 10000
-            + visibleStatTotalPriority * 10
-            + this.targetUnit.slotOrder;
-    }
-
-    __calcMovementTargetPriority(assistUnit) {
-        this.requiredMovementCount = this.bestTileToAssist.calculateUnitMovementCountToThisTile(assistUnit);
-
-        let assistedWithTeleportSkillPriority = 0;
-        if (this.isTeleportationRequired) {
-            assistedWithTeleportSkillPriority = 1;
-        }
-
-        // ワユ教授の資料だとpost combatだとこの条件になっているが、ステータス合計は評価されないっぽい？
-        // return assistedWithTeleportSkillPriority * 1000000
-        //     + this.visibleStatTotal * 500
-        //     - this.requiredMovementCount * 10
-        //     + this.slotOrder;
-
-        return assistedWithTeleportSkillPriority * 1000000
-            - this.requiredMovementCount * 10
-            // todo: 隣接するブロックされた敵のスロット順がここに入る
-            //       (Offensive Movement Assistのみで参照されるはずなので実装しなくてもそんなに実害ない)
-            + this.slotOrder;
-    }
-
-    __calcHealTargetPriority(assistUnit) {
-        this.amountHealed = calcHealAmount(assistUnit, this.targetUnit);
-        return this.amountHealed * 1000000
-            + this.visibleStatTotal * 10
-            + this.slotOrder;
-    }
-
-    __calcRefreshTargetPriority() {
-        let hasThreatensEnemyStatusPriority = 0;
-        if (this.hasThreatensEnemyStatus) {
-            hasThreatensEnemyStatusPriority = 1;
-        }
-        return hasThreatensEnemyStatusPriority * 1000000
-            + this.visibleStatTotal * 10
-            + this.slotOrder;
-    }
-
-    __calcRallyTargetPriority(assistUnit, isPrecombat) {
-        this.hasStatAndNonStatDebuff = 0;
-        if (assistUnit.support === Support.HarshCommandPlus) {
-            // 一喝+は弱化と状態異常の両方が付与されてるユニットが最優先
-            if (this.targetUnit.hasStatDebuff() && this.targetUnit.hasNonStatDebuff()) {
-                this.hasStatAndNonStatDebuff = 1;
-            }
-        }
-
-        this.amountOfStatsActuallyBuffed = 0;
-        if (isPrecombat) {
-            if (!isRallyUp(assistUnit.support)) {
-                this.amountOfStatsActuallyBuffed = calcBuffAmount(assistUnit, this.targetUnit);
-            }
-        } else {
-            this.amountOfStatsActuallyBuffed = calcBuffAmount(assistUnit, this.targetUnit);
-        }
-
-        return this.hasStatAndNonStatDebuff * 1000000
-            + this.amountOfStatsActuallyBuffed * 300000
-            - this.distanceFromClosestEnemy * 3000
-            + this.visibleStatTotal * 10
-            + this.slotOrder;
-    }
-}
-
-/// 敵の動き計算時のコンテキスト
-class ActionContext {
-    constructor() {
-        // 補助のコンテキスト
-        this.assistPriority = 0;
-        /** @type {AssistableUnitInfo[]} */
-        this.assistableUnitInfos = [];
-        this.hasThreatenedByEnemyStatus = false;
-        this.hasThreatensEnemyStatus = false;
-        this.bestTileToAssist = null;
-        this.bestTargetToAssist = null;
-        this.isBlocker = false;
-
-        // 攻撃者選択のコンテキスト
-
-        /** @type {AttackableUnitInfo[]} */
-        this.attackableUnitInfos = [];
-
-        /** @type {Unit} */
-        this.bestTargetToAttack = null;
-
-        /** @type  {Object.<Unit, AttackEvaluationContext>} */
-        this.attackEvalContexts = {}; // key=target unit, value=AttackEvaluationContext
-
-        /** @type {Unit} */
-        this.bestAttacker = null;
-
-        // その他(オリジナルAI用)
-        this.attackableTiles = [];
-
-        // 移動のコンテキスト
-        this.movePriority = 0;
-        this.hasShuffleStatus = false;
-    }
-
-    clear() {
-        this.assistPriority = 0;
-        this.assistableUnitInfos = [];
-        this.hasThreatensEnemyStatus = false;
-        this.hasThreatenedByEnemyStatus = false;
-        this.hasThreatensEnemyStatus = false;
-        this.bestTileToAssist = null;
-        this.bestTargetToAssist = null;
-        this.isBlocker = false;
-
-        this.attackableUnitInfos = [];
-        this.bestTargetToAttack = null;
-        this.attackEvalContexts = {};
-        this.bestAttacker = null;
-        this.attackableTiles = [];
-
-        this.movePriority = 0;
-        this.hasShuffleStatus = false;
-    }
-
-    findAssistableUnitInfo(unit) {
-        for (let info of this.assistableUnitInfos) {
-            if (info.targetUnit === unit) {
-                return info;
-            }
-        }
-        return null;
-    }
-
-    findAttackableUnitInfo(unit) {
-        for (let info of this.attackableUnitInfos) {
-            if (info.targetUnit === unit) {
-                return info;
-            }
-        }
-        return null;
-    }
-
-    removeAttackableUnitInfosWhereBestTileIsEmpty() {
-        this.attackableUnitInfos = this.attackableUnitInfos.filter(
-            function (item) {
-                return item.bestTileToAttack != null;
-            }
-        );
-    }
-}
-
-/**
- * TODO: リファクタリング
- * BattleContextについて範囲奥義で設定したコンテキストを戦闘開始時に消してしまうので両方で使用可能な値の扱いが非常に複雑になってしまっているので修正する
- */
-class PrecombatContext {
-    constructor() {
-        this.initContext();
-    }
-
-    initContext() {
-        this.damageCountOfSpecialAtTheSameTime = 0;
-    }
-
-    /**
-     * @param {BattleContext} context
-     */
-    copyTo(context) {
-        context.damageCountOfSpecialAtTheSameTime = this.damageCountOfSpecialAtTheSameTime;
-    }
-}
-
 /// ユニットのインスタンス
 class Unit extends BattleMapElement {
     /**
diff --git a/Sources/unit/UnitContext.js b/Sources/unit/UnitContext.js
new file mode 100644
index 00000000..d6ba626b
--- /dev/null
+++ b/Sources/unit/UnitContext.js
@@ -0,0 +1,335 @@
+/* global CombatResultType, AssistType, isRallyHealSkill, isRallyUp, calcHealAmount, calcBuffAmount, Support */
+
+/// 攻撃可能なユニット情報です。
+class AttackableUnitInfo {
+    /**
+     * @param  {Unit} targetUnit
+     */
+    constructor(targetUnit) {
+        /** @type {Unit} **/
+        this.targetUnit = targetUnit;
+
+        /** @type {Tile[]} **/
+        this.tiles = [];
+
+        /** @type {Tile} **/
+        this.bestTileToAttack = null;
+        this.damageRatios = [];
+
+        /** @type {CombatResultType[]} **/
+        this.combatResults = [];
+
+        /** @type {CombatResult[]} **/
+        this.combatResultDetails = [];
+
+        /** @type {boolean} **/
+        this.usesStyle = false;
+    }
+
+    toString() {
+        let result = this.targetUnit.getNameWithGroup() + ": ";
+        for (let tile of this.tiles) {
+            result += "(" + tile.posX + "," + tile.posY + ")";
+        }
+        return result;
+    }
+}
+
+/// 攻撃の優先度評価に使用するコンテキストです。
+class AttackEvaluationContext {
+    constructor() {
+        this.damageRatio = 0;
+        this.combatResult = CombatResultType.Draw;
+        this.isDebufferTier1 = false;
+        this.isDebufferTier2 = false;
+        this.isAfflictor = false;
+        this.isSpecialChargeIncreased = false;
+        this.movementRange = 0;
+
+        this.attackPriority = 0;
+        this.attackTargetPriorty = 0;
+    }
+
+    calcAttackTargetPriority(attackTarget) {
+        let specialChargeIncreasedPriority = 0;
+        if (this.isSpecialChargeIncreased) {
+            specialChargeIncreasedPriority = 1;
+        }
+
+        let debufferTier1Priority = 0;
+        if (this.isDebufferTier1) {
+            debufferTier1Priority = 1;
+        }
+        let debufferTier2Priority = 0;
+        if (this.isDebufferTier2) {
+            debufferTier2Priority = 1;
+        }
+
+        this.attackTargetPriorty =
+            this.combatResult * 1000000 +
+            debufferTier1Priority * 500000 +
+            debufferTier2Priority * 250000 +
+            this.damageRatio * 100 +
+            specialChargeIncreasedPriority * 10 +
+            attackTarget.slotOrder;
+    }
+
+    calcAttackPriority(attacker) {
+        let specialChargeIncreasedPriority = 0;
+        if (this.isSpecialChargeIncreased) {
+            specialChargeIncreasedPriority = 1;
+        }
+        let debuffPriority1 = 0;
+        let debuffPriority2 = 0;
+        if (this.isDebufferTier1) {
+            debuffPriority1 = 1;
+        } else if (this.isDebufferTier2) {
+            debuffPriority2 = 1;
+        }
+        let afflictorPriority = 0;
+        if (this.isAfflictor) {
+            afflictorPriority = 1;
+        }
+        this.movementRange = attacker.moveCount;
+
+        this.attackPriority =
+            this.combatResult * 1000000 +
+            debuffPriority1 * 500000 +
+            debuffPriority2 * 250000 +
+            afflictorPriority * 100000 +
+            this.damageRatio * 100 +
+            this.movementRange * 20 +
+            specialChargeIncreasedPriority * 10 +
+            attacker.slotOrder;
+    }
+}
+
+/// 補助行動の優先度を計算するためのクラスです。
+class AssistableUnitInfo {
+    constructor(targetUnit) {
+        this.targetUnit = targetUnit;
+        this.assistableTiles = [];
+
+        // noinspection JSUnusedGlobalSymbols
+        this.hasThreatenedByEnemyStatus = targetUnit.actionContext.hasThreatenedByEnemyStatus;
+        this.hasThreatensEnemyStatus = targetUnit.actionContext.hasThreatensEnemyStatus;
+        this.amountOfStatsActuallyBuffed = 0;
+        this.amountHealed = 0;
+        this.distanceFromClosestEnemy = targetUnit.distanceFromClosestEnemy;
+        this.visibleStatTotal = targetUnit.getVisibleStatusTotal();
+        this.slotOrder = targetUnit.slotOrder;
+        this.isTeleportationRequired = false;
+        this.requiredMovementCount = 0;
+        this.numOfOtherEligibleTargetsBuffed = 0;
+        this.isIntendedAndLowestSlot = false;
+
+        this.assistTargetPriority = 0;
+        this.rallyUpTargetPriority = 0;
+
+        this.bestTileToAssist = null;
+        this.hasStatAndNonStatDebuff = 0;
+    }
+
+    calcAssistTargetPriority(assistUnit, isPrecombat = true, isCantoAssist = false) {
+        let assistType;
+        if (isCantoAssist) {
+            assistType = assistUnit.cantoAssistType;
+        } else {
+            assistType = assistUnit.supportInfo.assistType;
+            // TODO: 検証する。とりあえずHPが減っていた場合は回復スキルとして扱う
+            let skillId = assistUnit.support;
+            if (isRallyHealSkill(skillId)) {
+                assistType = this.targetUnit.isFullHp ? AssistType.Rally : AssistType.Heal;
+            }
+        }
+        switch (assistType) {
+            case AssistType.Refresh:
+                this.assistTargetPriority = this.__calcRefreshTargetPriority();
+                break;
+            case AssistType.Heal:
+                this.assistTargetPriority = this.__calcHealTargetPriority(assistUnit);
+                break;
+            case AssistType.Rally:
+                this.assistTargetPriority = this.__calcRallyTargetPriority(assistUnit, isPrecombat);
+                break;
+            case AssistType.Move:
+                this.assistTargetPriority = this.__calcMovementTargetPriority(assistUnit);
+                break;
+            case AssistType.Restore:
+                this.assistTargetPriority = this.__calcRestoreTargetPriority(assistUnit);
+                break;
+        }
+        if (!isCantoAssist) {
+            let skillId = assistUnit.support;
+            if (isRallyHealSkill(skillId)) {
+                // 応援より回復優先
+                if (assistType === AssistType.Heal) {
+                    // TODO: 適切な数値に修正する
+                    this.assistTargetPriority *= 10000000;
+                }
+            }
+        }
+    }
+
+    __calcRestoreTargetPriority(assistUnit) {
+        this.amountHealed = calcHealAmount(assistUnit, this.targetUnit);
+        let negativeEffectPriority = 0;
+        let amountHealedPriority = 0;
+        let visibleStatTotalPriority = 0;
+        if (!this.targetUnit.hasNegativeStatusEffect()) {
+            negativeEffectPriority = 1;
+            amountHealedPriority = this.amountHealed;
+            visibleStatTotalPriority = this.visibleStatTotal;
+        }
+
+        return negativeEffectPriority * 1000000
+            + amountHealedPriority * 10000
+            + visibleStatTotalPriority * 10
+            + this.targetUnit.slotOrder;
+    }
+
+    __calcMovementTargetPriority(assistUnit) {
+        this.requiredMovementCount = this.bestTileToAssist.calculateUnitMovementCountToThisTile(assistUnit);
+
+        let assistedWithTeleportSkillPriority = 0;
+        if (this.isTeleportationRequired) {
+            assistedWithTeleportSkillPriority = 1;
+        }
+
+        // ワユ教授の資料だとpost combatだとこの条件になっているが、ステータス合計は評価されないっぽい？
+        // return assistedWithTeleportSkillPriority * 1000000
+        //     + this.visibleStatTotal * 500
+        //     - this.requiredMovementCount * 10
+        //     + this.slotOrder;
+
+        return assistedWithTeleportSkillPriority * 1000000
+            - this.requiredMovementCount * 10
+            // todo: 隣接するブロックされた敵のスロット順がここに入る
+            //       (Offensive Movement Assistのみで参照されるはずなので実装しなくてもそんなに実害ない)
+            + this.slotOrder;
+    }
+
+    __calcHealTargetPriority(assistUnit) {
+        this.amountHealed = calcHealAmount(assistUnit, this.targetUnit);
+        return this.amountHealed * 1000000
+            + this.visibleStatTotal * 10
+            + this.slotOrder;
+    }
+
+    __calcRefreshTargetPriority() {
+        let hasThreatensEnemyStatusPriority = 0;
+        if (this.hasThreatensEnemyStatus) {
+            hasThreatensEnemyStatusPriority = 1;
+        }
+        return hasThreatensEnemyStatusPriority * 1000000
+            + this.visibleStatTotal * 10
+            + this.slotOrder;
+    }
+
+    __calcRallyTargetPriority(assistUnit, isPrecombat) {
+        this.hasStatAndNonStatDebuff = 0;
+        if (assistUnit.support === Support.HarshCommandPlus) {
+            // 一喝+は弱化と状態異常の両方が付与されてるユニットが最優先
+            if (this.targetUnit.hasStatDebuff() && this.targetUnit.hasNonStatDebuff()) {
+                this.hasStatAndNonStatDebuff = 1;
+            }
+        }
+
+        this.amountOfStatsActuallyBuffed = 0;
+        if (isPrecombat) {
+            if (!isRallyUp(assistUnit.support)) {
+                this.amountOfStatsActuallyBuffed = calcBuffAmount(assistUnit, this.targetUnit);
+            }
+        } else {
+            this.amountOfStatsActuallyBuffed = calcBuffAmount(assistUnit, this.targetUnit);
+        }
+
+        return this.hasStatAndNonStatDebuff * 1000000
+            + this.amountOfStatsActuallyBuffed * 300000
+            - this.distanceFromClosestEnemy * 3000
+            + this.visibleStatTotal * 10
+            + this.slotOrder;
+    }
+}
+
+/// 敵の動き計算時のコンテキスト
+class ActionContext {
+    constructor() {
+        // 補助のコンテキスト
+        this.assistPriority = 0;
+        /** @type {AssistableUnitInfo[]} */
+        this.assistableUnitInfos = [];
+        this.hasThreatenedByEnemyStatus = false;
+        this.hasThreatensEnemyStatus = false;
+        this.bestTileToAssist = null;
+        this.bestTargetToAssist = null;
+        this.isBlocker = false;
+
+        // 攻撃者選択のコンテキスト
+
+        /** @type {AttackableUnitInfo[]} */
+        this.attackableUnitInfos = [];
+
+        /** @type {Unit} */
+        this.bestTargetToAttack = null;
+
+        /** @type  {Object.<Unit, AttackEvaluationContext>} */
+        this.attackEvalContexts = {}; // key=target unit, value=AttackEvaluationContext
+
+        /** @type {Unit} */
+        this.bestAttacker = null;
+
+        // その他(オリジナルAI用)
+        this.attackableTiles = [];
+
+        // 移動のコンテキスト
+        this.movePriority = 0;
+        this.hasShuffleStatus = false;
+    }
+
+    clear() {
+        this.assistPriority = 0;
+        this.assistableUnitInfos = [];
+        this.hasThreatensEnemyStatus = false;
+        this.hasThreatenedByEnemyStatus = false;
+        this.hasThreatensEnemyStatus = false;
+        this.bestTileToAssist = null;
+        this.bestTargetToAssist = null;
+        this.isBlocker = false;
+
+        this.attackableUnitInfos = [];
+        this.bestTargetToAttack = null;
+        this.attackEvalContexts = {};
+        this.bestAttacker = null;
+        this.attackableTiles = [];
+
+        this.movePriority = 0;
+        this.hasShuffleStatus = false;
+    }
+
+    findAssistableUnitInfo(unit) {
+        for (let info of this.assistableUnitInfos) {
+            if (info.targetUnit === unit) {
+                return info;
+            }
+        }
+        return null;
+    }
+
+    findAttackableUnitInfo(unit) {
+        for (let info of this.attackableUnitInfos) {
+            if (info.targetUnit === unit) {
+                return info;
+            }
+        }
+        return null;
+    }
+
+    removeAttackableUnitInfosWhereBestTileIsEmpty() {
+        this.attackableUnitInfos = this.attackableUnitInfos.filter(
+            function (item) {
+                return item.bestTileToAttack != null;
+            }
+        );
+    }
+}
diff --git a/Tests/UnitContext.test.js b/Tests/UnitContext.test.js
new file mode 100644
index 00000000..70ec212e
--- /dev/null
+++ b/Tests/UnitContext.test.js
@@ -0,0 +1,37 @@
+// UnitContext.js ファイル分割のシンボル可視性テスト
+
+// AttackableUnitInfo
+test('AttackableUnitInfo_class_exists_in_global_scope', () => {
+    expect(typeof AttackableUnitInfo).toBe('function');
+});
+
+// AttackEvaluationContext
+test('AttackEvaluationContext_class_exists_in_global_scope', () => {
+    expect(typeof AttackEvaluationContext).toBe('function');
+});
+
+test('AttackEvaluationContext_initial_combatResult_is_Draw', () => {
+    const ctx = new AttackEvaluationContext();
+    expect(ctx.combatResult).toBe(CombatResultType.Draw);
+});
+
+// AssistableUnitInfo
+test('AssistableUnitInfo_class_exists_in_global_scope', () => {
+    expect(typeof AssistableUnitInfo).toBe('function');
+});
+
+// ActionContext
+test('ActionContext_class_exists_in_global_scope', () => {
+    expect(typeof ActionContext).toBe('function');
+});
+
+test('ActionContext_initial_state_has_empty_arrays', () => {
+    const ctx = new ActionContext();
+    expect(ctx.attackableUnitInfos).toEqual([]);
+    expect(ctx.assistableUnitInfos).toEqual([]);
+});
+
+// PrecombatContext (BattleContext.jsからロード)
+test('PrecombatContext_class_exists_in_global_scope', () => {
+    expect(typeof PrecombatContext).toBe('function');
+});
diff --git a/create_tests.sh b/create_tests.sh
index aefd8180..6df7488e 100755
--- a/create_tests.sh
+++ b/create_tests.sh
@@ -15,6 +15,7 @@ SOURCE_FILE_NAMES=(
     data/HeroInfo
     data/UnitConstants
     unit/BattleContext
+    unit/UnitContext
     unit/Unit
     unit/UnitManager
     map/BattleMap
@@ -69,6 +70,7 @@ TEST_FILE_NAMES=(
     TestHelper
     FileSplit
     ScopedTileChanger
+    UnitContext
     )
 
 # カテゴリに応じたテストファイル選択
