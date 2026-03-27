diff --git a/Deploy.bat b/Deploy.bat
index 5534607a..bf1bb800 100644
--- a/Deploy.bat
+++ b/Deploy.bat
@@ -16,7 +16,7 @@ set BF=core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,dat
 rem �}�b�v�E�\��
 set BF=%BF%,map\BattleMapElement,map\Tile,map\BattleMap,map\BattleMapSettings,map\Structures,map\Cell,map\Table
 rem ���j�b�g�E���
-set BF=%BF%,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitManager,unit\GlobalBattleContext
+set BF=%BF%,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitUtility,unit\UnitManager,unit\GlobalBattleContext
 rem �v�Z���W�b�N
 set BF=%BF%,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper
 set BF=%BF%,combat\BeginningOfTurnSkillHandler
@@ -39,13 +39,13 @@ rem �p�Y�����V�~�����[�^�[
 call %~dp0MergeSourcesAndCompress.bat FehSummonerDuelsSimulator %battle_simulator_filenames%,pages\SummonerDuelsSimulatorMain
 
 rem �X�e�[�^�X�v�Z�@
-call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator core\GlobalDefinitions,core\Utilities,data\SkillConstants,data\Skill,map\BattleMapElement,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,pages\StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator core\GlobalDefinitions,core\Utilities,data\SkillConstants,data\Skill,map\BattleMapElement,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitUtility,pages\StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem ���j�b�g�r���_�[
-call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitUtility,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem �_���[�W�v�Z�@
-call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
+call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitUtility,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
 
 rem �p�Y�A�C�R�����X�g
 call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,data\HeroInfoConstants,data\HeroInfo,database\HeroDatabase,pages\HeroIconListerMain,database\SampleHeroInfos,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%
diff --git a/Sources/AetherRaidSimulator.html b/Sources/AetherRaidSimulator.html
index 0992c5c8..2db6d57b 100644
--- a/Sources/AetherRaidSimulator.html
+++ b/Sources/AetherRaidSimulator.html
@@ -1472,6 +1472,7 @@
                     "unit/BattleContext.js",
                     "unit/UnitContext.js",
                     "unit/Unit.js",
+                    "unit/UnitUtility.js",
                     "unit/UnitManager.js",
                     "map/BattleMap.js",
                     "map/BattleMapSettings.js",
diff --git a/Sources/ArenaSimulator.html b/Sources/ArenaSimulator.html
index 4332cb8b..6e593075 100644
--- a/Sources/ArenaSimulator.html
+++ b/Sources/ArenaSimulator.html
@@ -1442,6 +1442,7 @@
                     "unit/BattleContext.js",
                     "unit/UnitContext.js",
                     "unit/Unit.js",
+                    "unit/UnitUtility.js",
                     "unit/UnitManager.js",
                     "map/BattleMap.js",
                     "map/BattleMapSettings.js",
diff --git a/Sources/DamageCalculator.html b/Sources/DamageCalculator.html
index 58687590..ac4a534b 100644
--- a/Sources/DamageCalculator.html
+++ b/Sources/DamageCalculator.html
@@ -486,6 +486,7 @@
                     "unit/BattleContext.js",
                     "unit/UnitContext.js",
                     "unit/Unit.js",
+                    "unit/UnitUtility.js",
                     "unit/UnitManager.js",
                     "database/SkillDatabase.js",
                     "database/HeroDatabase.js",
diff --git a/Sources/HeroStatusClusterer.html b/Sources/HeroStatusClusterer.html
index 7d585cca..557103a3 100644
--- a/Sources/HeroStatusClusterer.html
+++ b/Sources/HeroStatusClusterer.html
@@ -274,6 +274,7 @@
                 "unit/BattleContext.js",
                 "unit/UnitContext.js",
                 "unit/Unit.js",
+                "unit/UnitUtility.js",
                 "unit/UnitManager.js",
                 "database/HeroDatabase.js",
                 "database/SampleHeroInfos.js",
diff --git a/Sources/StatusCalculator.html b/Sources/StatusCalculator.html
index cb20d265..8fbf34fe 100644
--- a/Sources/StatusCalculator.html
+++ b/Sources/StatusCalculator.html
@@ -274,6 +274,7 @@
                     "unit/BattleContext.js",
                     "unit/UnitContext.js",
                     "unit/Unit.js",
+                    "unit/UnitUtility.js",
                     "pages/StatusCalcMain.js",
                     ...SKILL_EFFECT_FILES,
                     ...SKILL_IMPL_FILES,
diff --git a/Sources/SummonerDuelsSimulator.html b/Sources/SummonerDuelsSimulator.html
index 4fcf83e5..768159af 100644
--- a/Sources/SummonerDuelsSimulator.html
+++ b/Sources/SummonerDuelsSimulator.html
@@ -1534,6 +1534,7 @@
                     "unit/BattleContext.js",
                     "unit/UnitContext.js",
                     "unit/Unit.js",
+                    "unit/UnitUtility.js",
                     "unit/UnitManager.js",
                     "map/BattleMap.js",
                     "map/BattleMapSettings.js",
diff --git a/Sources/UnitBuilder.html b/Sources/UnitBuilder.html
index b4c3fdc0..701b3318 100644
--- a/Sources/UnitBuilder.html
+++ b/Sources/UnitBuilder.html
@@ -1260,6 +1260,7 @@
                     "unit/BattleContext.js",
                     "unit/UnitContext.js",
                     "unit/Unit.js",
+                    "unit/UnitUtility.js",
                     "unit/UnitManager.js",
                     "map/BattleMap.js",
                     "map/BattleMapSettings.js",
diff --git a/Sources/unit/Unit.js b/Sources/unit/Unit.js
index eb52039f..b0bb70f2 100644
--- a/Sources/unit/Unit.js
+++ b/Sources/unit/Unit.js
@@ -6786,284 +6786,3 @@ class Unit extends BattleMapElement {
     }
 }
 
-class UnitUtil {
-    static withCache(units, fn) {
-        for (const u of units) {
-            u.cacheCounter++;
-            u.usesCache = true;
-            u.cachedSkills = null;
-        }
-
-        try {
-            return fn();
-        } finally {
-            for (const u of units) {
-                u.cacheCounter--;
-                if (u.cacheCounter === 0) {
-                    u.usesCache = false;
-                    u.cachedSkills = null;
-                }
-            }
-        }
-    }
-}
-
-function calcBuffAmount(assistUnit, targetUnit) {
-    let totalBuffAmount = 0;
-    switch (assistUnit.support) {
-        case Support.HarshCommand: {
-            if (!targetUnit.isPanicEnabled) {
-                totalBuffAmount += targetUnit.atkDebuff;
-                totalBuffAmount += targetUnit.spdDebuff;
-                totalBuffAmount += targetUnit.defDebuff;
-                totalBuffAmount += targetUnit.resDebuff;
-            }
-        }
-            break;
-        case Support.HarshCommandPlus: {
-            totalBuffAmount += targetUnit.atkDebuff;
-            totalBuffAmount += targetUnit.spdDebuff;
-            totalBuffAmount += targetUnit.defDebuff;
-            totalBuffAmount += targetUnit.resDebuff;
-        }
-            break;
-        default: {
-            let buffAmount = getAtkBuffAmount(assistUnit.support) - targetUnit.atkBuff;
-            if (buffAmount > 0) {
-                totalBuffAmount += buffAmount;
-            }
-            buffAmount = getSpdBuffAmount(assistUnit.support) - targetUnit.spdBuff;
-            if (buffAmount > 0) {
-                totalBuffAmount += buffAmount;
-            }
-            buffAmount = getDefBuffAmount(assistUnit.support) - targetUnit.defBuff;
-            if (buffAmount > 0) {
-                totalBuffAmount += buffAmount;
-            }
-            buffAmount = getResBuffAmount(assistUnit.support) - targetUnit.resBuff;
-            if (buffAmount > 0) {
-                totalBuffAmount += buffAmount;
-            }
-        }
-            break;
-    }
-    return totalBuffAmount;
-}
-
-/**
- * @brief 回復補助の回復量を取得します。
- * @param {Unit} assistUnit 補助者のユニット
- * @param {Unit} targetUnit 補助対象のユニット
- * TODO: マジックシールドについて調査する
- */
-function calcHealAmount(assistUnit, targetUnit) {
-    let healAmount = 0;
-    let skillId = assistUnit.support;
-    healAmount += getSkillFunc(skillId, calcHealAmountFuncMap)?.call(this, assistUnit, targetUnit) ?? 0;
-
-    let env = new NodeEnv().setAssistUnits(assistUnit, targetUnit);
-    env.setName('補助での回復時').setLogLevel(getSkillLogLevel());
-    healAmount += CALC_HEAL_AMOUNT_HOOKS.evaluateSumWithUnit(assistUnit, env);
-
-    switch (skillId) {
-        case Support.Heal:
-            healAmount = 5;
-            break;
-        case Support.Reconcile:
-            healAmount = 7;
-            break;
-        case Support.Physic:
-            healAmount = 8;
-            break;
-        case Support.Mend:
-            healAmount = 10;
-            break;
-        case Support.Recover:
-            healAmount = 15;
-            break;
-        case Support.Martyr:
-            healAmount = assistUnit.currentDamage + 7;
-            break;
-        case Support.MartyrPlus:
-            healAmount = assistUnit.currentDamage + Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
-            if (healAmount < 7) {
-                healAmount += 7;
-            }
-            break;
-        case Support.Rehabilitate: {
-            let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
-            if (targetUnit.hp <= halfHp) {
-                healAmount += (halfHp - targetUnit.hp) * 2;
-            }
-            healAmount += 7;
-        }
-            break;
-        case Support.RehabilitatePlus: {
-            healAmount += Math.floor(assistUnit.getAtkInPrecombat() * 0.5) - 10;
-            if (healAmount < 7) {
-                healAmount = 7;
-            }
-
-            let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
-            if (targetUnit.hp <= halfHp) {
-                healAmount += (halfHp - targetUnit.hp) * 2;
-            }
-            healAmount += 7;
-        }
-            break;
-        case Support.PhysicPlus:
-        case Support.RestorePlus:
-        case Support.RescuePlus:
-        case Support.ReturnPlus:
-        case Support.NudgePlus:
-            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
-            if (healAmount < 8) {
-                healAmount = 8;
-            }
-            break;
-        case Support.Restore:
-        case Support.Rescue:
-        case Support.Return:
-        case Support.Nudge:
-            healAmount = 8;
-            break;
-        case Support.RecoverPlus:
-            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5) + 10;
-            if (healAmount < 15) {
-                healAmount = 15;
-            }
-            break;
-    }
-    if (targetUnit.currentDamage < healAmount) {
-        return targetUnit.currentDamage;
-    }
-    return healAmount;
-}
-
-/// Tier 1 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
-// noinspection JSUnusedLocalSymbols
-function isDebufferTier1(attackUnit, targetUnit) {
-    let env = new NodeEnv().setUnitsDuringCombat(attackUnit, targetUnit, true)
-        .setSkillOwner(attackUnit)
-        .setName('Tier1のデバッファー判定').setLogLevel(LoggerBase.LogLevel.OFF);
-    if (IS_DEBUFFER_TIER_1_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
-        return true;
-    }
-    return attackUnit.weapon === Weapon.Hlidskjalf;
-}
-
-/// Tier 2 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
-function isDebufferTier2(attackUnit, targetUnit) {
-    let env = new NodeEnv().setUnitsDuringCombat(attackUnit, targetUnit, true)
-        .setSkillOwner(attackUnit)
-        .setName('Tier2のデバッファー判定').setLogLevel(LoggerBase.LogLevel.OFF);
-    if (IS_DEBUFFER_TIER_2_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
-        return true;
-    }
-    for (let skillId of attackUnit.enumerateSkills()) {
-        switch (skillId) {
-            case Weapon.RogueDagger:
-            case Weapon.RogueDaggerPlus:
-                if (attackUnit.weaponRefinement === WeaponRefinementType.None) {
-                    return true;
-                }
-                break;
-            case Weapon.PoisonDagger:
-            case Weapon.PoisonDaggerPlus:
-                if (targetUnit.moveType === MoveType.Infantry) {
-                    return true;
-                }
-                break;
-            case Weapon.KittyPaddle:
-            case Weapon.KittyPaddlePlus:
-                if (isWeaponTypeTome(targetUnit.weapon)) {
-                    return true;
-                }
-                break;
-            case PassiveB.SealDef3:
-            case PassiveB.SealRes3:
-            case PassiveB.SealAtkDef2:
-            case PassiveB.SealAtkRes2:
-            case PassiveB.SealDefRes2:
-            case PassiveB.SealSpdDef2:
-                return true;
-        }
-    }
-    return false;
-}
-
-/**
- * ユニットがアフリクターであるかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartH
- * @param  {Unit} attackUnit
- * @param  {boolean} lossesInCombat
- * @param result
- * @return {boolean}
- */
-function isAfflictor(attackUnit, lossesInCombat, result) {
-    // TODO: envにlossesInCombat, resultを取れるようにする
-    let env = new NodeEnv().setTarget(attackUnit).setUnitsDuringCombat(attackUnit, null, true)
-        .setSkillOwner(attackUnit)
-        .setName('アフリクター判定').setLogLevel(LoggerBase.LogLevel.OFF);
-    if (IS_AFFLICTOR_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
-        return true;
-    }
-    for (let skillId of attackUnit.enumerateSkills()) {
-        let func = getSkillFunc(skillId, isAfflictorFuncMap);
-        if (func?.call(this, attackUnit, lossesInCombat, result) ?? false) {
-            return true;
-        }
-        switch (skillId) {
-            case Weapon.DuskDawnStaff:
-                return true;
-            case Weapon.TigerSpirit:
-                if (attackUnit.battleContext.restHpPercentage >= 25) {
-                    return true;
-                }
-                break;
-            case Weapon.FlamelickBreath:
-            case Weapon.FrostbiteBreath:
-                if (attackUnit.battleContext.restHpPercentage >= 25) {
-                    return true;
-                }
-                break;
-            case Weapon.Pain:
-            case Weapon.PainPlus:
-            case Weapon.Panic:
-            case Weapon.PanicPlus:
-            case Weapon.FlashPlus:
-            case Weapon.Candlelight:
-            case Weapon.CandlelightPlus:
-            case Weapon.DotingStaff:
-            case Weapon.MerankoryPlus:
-            case Weapon.CandyStaff:
-            case Weapon.CandyStaffPlus:
-            case Weapon.LegionsAxe:
-            case Weapon.LegionsAxePlus:
-            case Weapon.SneeringAxe:
-            case Weapon.DeathlyDagger:
-            case Weapon.SnipersBow:
-            case Weapon.DokuNoKen:
-                return true;
-            case Weapon.MonstrousBowPlus:
-            case Weapon.GhostNoMadosyoPlus:
-            case Weapon.Scadi:
-            case Weapon.ObsessiveCurse:
-                if (attackUnit.isWeaponRefined) {
-                    return true;
-                }
-                break;
-            case PassiveC.PanicSmoke3:
-            case PassiveC.PanicSmoke4:
-            case PassiveC.FatalSmoke3:
-            case PassiveC.DefResSmoke3:
-                return !lossesInCombat;
-            case PassiveB.PoisonStrike3:
-                return !lossesInCombat;
-        }
-    }
-    return false;
-}
-
-function canRefreshTo(targetUnit) {
-    return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
-}
diff --git a/Sources/unit/UnitUtility.js b/Sources/unit/UnitUtility.js
new file mode 100644
index 00000000..7b1a8779
--- /dev/null
+++ b/Sources/unit/UnitUtility.js
@@ -0,0 +1,283 @@
+/* global Support, Weapon, PassiveB, PassiveC, WeaponRefinementType, MoveType, NodeEnv, LoggerBase, getSkillFunc, calcHealAmountFuncMap, isAfflictorFuncMap, getAtkBuffAmount, getSpdBuffAmount, getDefBuffAmount, getResBuffAmount, getSkillLogLevel, isWeaponTypeTome, CALC_HEAL_AMOUNT_HOOKS, IS_DEBUFFER_TIER_1_HOOKS, IS_DEBUFFER_TIER_2_HOOKS, IS_AFFLICTOR_HOOKS */
+
+class UnitUtil {
+    static withCache(units, fn) {
+        for (const u of units) {
+            u.cacheCounter++;
+            u.usesCache = true;
+            u.cachedSkills = null;
+        }
+
+        try {
+            return fn();
+        } finally {
+            for (const u of units) {
+                u.cacheCounter--;
+                if (u.cacheCounter === 0) {
+                    u.usesCache = false;
+                    u.cachedSkills = null;
+                }
+            }
+        }
+    }
+}
+
+function calcBuffAmount(assistUnit, targetUnit) {
+    let totalBuffAmount = 0;
+    switch (assistUnit.support) {
+        case Support.HarshCommand: {
+            if (!targetUnit.isPanicEnabled) {
+                totalBuffAmount += targetUnit.atkDebuff;
+                totalBuffAmount += targetUnit.spdDebuff;
+                totalBuffAmount += targetUnit.defDebuff;
+                totalBuffAmount += targetUnit.resDebuff;
+            }
+        }
+            break;
+        case Support.HarshCommandPlus: {
+            totalBuffAmount += targetUnit.atkDebuff;
+            totalBuffAmount += targetUnit.spdDebuff;
+            totalBuffAmount += targetUnit.defDebuff;
+            totalBuffAmount += targetUnit.resDebuff;
+        }
+            break;
+        default: {
+            let buffAmount = getAtkBuffAmount(assistUnit.support) - targetUnit.atkBuff;
+            if (buffAmount > 0) {
+                totalBuffAmount += buffAmount;
+            }
+            buffAmount = getSpdBuffAmount(assistUnit.support) - targetUnit.spdBuff;
+            if (buffAmount > 0) {
+                totalBuffAmount += buffAmount;
+            }
+            buffAmount = getDefBuffAmount(assistUnit.support) - targetUnit.defBuff;
+            if (buffAmount > 0) {
+                totalBuffAmount += buffAmount;
+            }
+            buffAmount = getResBuffAmount(assistUnit.support) - targetUnit.resBuff;
+            if (buffAmount > 0) {
+                totalBuffAmount += buffAmount;
+            }
+        }
+            break;
+    }
+    return totalBuffAmount;
+}
+
+/**
+ * @brief 回復補助の回復量を取得します。
+ * @param {Unit} assistUnit 補助者のユニット
+ * @param {Unit} targetUnit 補助対象のユニット
+ * TODO: マジックシールドについて調査する
+ */
+function calcHealAmount(assistUnit, targetUnit) {
+    let healAmount = 0;
+    let skillId = assistUnit.support;
+    healAmount += getSkillFunc(skillId, calcHealAmountFuncMap)?.call(this, assistUnit, targetUnit) ?? 0;
+
+    let env = new NodeEnv().setAssistUnits(assistUnit, targetUnit);
+    env.setName('補助での回復時').setLogLevel(getSkillLogLevel());
+    healAmount += CALC_HEAL_AMOUNT_HOOKS.evaluateSumWithUnit(assistUnit, env);
+
+    switch (skillId) {
+        case Support.Heal:
+            healAmount = 5;
+            break;
+        case Support.Reconcile:
+            healAmount = 7;
+            break;
+        case Support.Physic:
+            healAmount = 8;
+            break;
+        case Support.Mend:
+            healAmount = 10;
+            break;
+        case Support.Recover:
+            healAmount = 15;
+            break;
+        case Support.Martyr:
+            healAmount = assistUnit.currentDamage + 7;
+            break;
+        case Support.MartyrPlus:
+            healAmount = assistUnit.currentDamage + Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
+            if (healAmount < 7) {
+                healAmount += 7;
+            }
+            break;
+        case Support.Rehabilitate: {
+            let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
+            if (targetUnit.hp <= halfHp) {
+                healAmount += (halfHp - targetUnit.hp) * 2;
+            }
+            healAmount += 7;
+        }
+            break;
+        case Support.RehabilitatePlus: {
+            healAmount += Math.floor(assistUnit.getAtkInPrecombat() * 0.5) - 10;
+            if (healAmount < 7) {
+                healAmount = 7;
+            }
+
+            let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
+            if (targetUnit.hp <= halfHp) {
+                healAmount += (halfHp - targetUnit.hp) * 2;
+            }
+            healAmount += 7;
+        }
+            break;
+        case Support.PhysicPlus:
+        case Support.RestorePlus:
+        case Support.RescuePlus:
+        case Support.ReturnPlus:
+        case Support.NudgePlus:
+            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
+            if (healAmount < 8) {
+                healAmount = 8;
+            }
+            break;
+        case Support.Restore:
+        case Support.Rescue:
+        case Support.Return:
+        case Support.Nudge:
+            healAmount = 8;
+            break;
+        case Support.RecoverPlus:
+            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5) + 10;
+            if (healAmount < 15) {
+                healAmount = 15;
+            }
+            break;
+    }
+    if (targetUnit.currentDamage < healAmount) {
+        return targetUnit.currentDamage;
+    }
+    return healAmount;
+}
+
+/// Tier 1 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
+// noinspection JSUnusedLocalSymbols
+function isDebufferTier1(attackUnit, targetUnit) {
+    let env = new NodeEnv().setUnitsDuringCombat(attackUnit, targetUnit, true)
+        .setSkillOwner(attackUnit)
+        .setName('Tier1のデバッファー判定').setLogLevel(LoggerBase.LogLevel.OFF);
+    if (IS_DEBUFFER_TIER_1_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
+        return true;
+    }
+    return attackUnit.weapon === Weapon.Hlidskjalf;
+}
+
+/// Tier 2 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
+function isDebufferTier2(attackUnit, targetUnit) {
+    let env = new NodeEnv().setUnitsDuringCombat(attackUnit, targetUnit, true)
+        .setSkillOwner(attackUnit)
+        .setName('Tier2のデバッファー判定').setLogLevel(LoggerBase.LogLevel.OFF);
+    if (IS_DEBUFFER_TIER_2_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
+        return true;
+    }
+    for (let skillId of attackUnit.enumerateSkills()) {
+        switch (skillId) {
+            case Weapon.RogueDagger:
+            case Weapon.RogueDaggerPlus:
+                if (attackUnit.weaponRefinement === WeaponRefinementType.None) {
+                    return true;
+                }
+                break;
+            case Weapon.PoisonDagger:
+            case Weapon.PoisonDaggerPlus:
+                if (targetUnit.moveType === MoveType.Infantry) {
+                    return true;
+                }
+                break;
+            case Weapon.KittyPaddle:
+            case Weapon.KittyPaddlePlus:
+                if (isWeaponTypeTome(targetUnit.weapon)) {
+                    return true;
+                }
+                break;
+            case PassiveB.SealDef3:
+            case PassiveB.SealRes3:
+            case PassiveB.SealAtkDef2:
+            case PassiveB.SealAtkRes2:
+            case PassiveB.SealDefRes2:
+            case PassiveB.SealSpdDef2:
+                return true;
+        }
+    }
+    return false;
+}
+
+/**
+ * ユニットがアフリクターであるかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartH
+ * @param  {Unit} attackUnit
+ * @param  {boolean} lossesInCombat
+ * @param result
+ * @return {boolean}
+ */
+function isAfflictor(attackUnit, lossesInCombat, result) {
+    // TODO: envにlossesInCombat, resultを取れるようにする
+    let env = new NodeEnv().setTarget(attackUnit).setUnitsDuringCombat(attackUnit, null, true)
+        .setSkillOwner(attackUnit)
+        .setName('アフリクター判定').setLogLevel(LoggerBase.LogLevel.OFF);
+    if (IS_AFFLICTOR_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
+        return true;
+    }
+    for (let skillId of attackUnit.enumerateSkills()) {
+        let func = getSkillFunc(skillId, isAfflictorFuncMap);
+        if (func?.call(this, attackUnit, lossesInCombat, result) ?? false) {
+            return true;
+        }
+        switch (skillId) {
+            case Weapon.DuskDawnStaff:
+                return true;
+            case Weapon.TigerSpirit:
+                if (attackUnit.battleContext.restHpPercentage >= 25) {
+                    return true;
+                }
+                break;
+            case Weapon.FlamelickBreath:
+            case Weapon.FrostbiteBreath:
+                if (attackUnit.battleContext.restHpPercentage >= 25) {
+                    return true;
+                }
+                break;
+            case Weapon.Pain:
+            case Weapon.PainPlus:
+            case Weapon.Panic:
+            case Weapon.PanicPlus:
+            case Weapon.FlashPlus:
+            case Weapon.Candlelight:
+            case Weapon.CandlelightPlus:
+            case Weapon.DotingStaff:
+            case Weapon.MerankoryPlus:
+            case Weapon.CandyStaff:
+            case Weapon.CandyStaffPlus:
+            case Weapon.LegionsAxe:
+            case Weapon.LegionsAxePlus:
+            case Weapon.SneeringAxe:
+            case Weapon.DeathlyDagger:
+            case Weapon.SnipersBow:
+            case Weapon.DokuNoKen:
+                return true;
+            case Weapon.MonstrousBowPlus:
+            case Weapon.GhostNoMadosyoPlus:
+            case Weapon.Scadi:
+            case Weapon.ObsessiveCurse:
+                if (attackUnit.isWeaponRefined) {
+                    return true;
+                }
+                break;
+            case PassiveC.PanicSmoke3:
+            case PassiveC.PanicSmoke4:
+            case PassiveC.FatalSmoke3:
+            case PassiveC.DefResSmoke3:
+                return !lossesInCombat;
+            case PassiveB.PoisonStrike3:
+                return !lossesInCombat;
+        }
+    }
+    return false;
+}
+
+function canRefreshTo(targetUnit) {
+    return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
+}
diff --git a/Tests/UnitUtility.test.js b/Tests/UnitUtility.test.js
new file mode 100644
index 00000000..bb61b80d
--- /dev/null
+++ b/Tests/UnitUtility.test.js
@@ -0,0 +1,29 @@
+// UnitUtility.js ファイル分割のシンボル可視性テスト
+
+test('UnitUtil class is available in global scope', () => {
+    expect(typeof UnitUtil).toBe('function');
+});
+
+test('calcBuffAmount function is available in global scope', () => {
+    expect(typeof calcBuffAmount).toBe('function');
+});
+
+test('calcHealAmount function is available in global scope', () => {
+    expect(typeof calcHealAmount).toBe('function');
+});
+
+test('isDebufferTier1 function is available in global scope', () => {
+    expect(typeof isDebufferTier1).toBe('function');
+});
+
+test('isDebufferTier2 function is available in global scope', () => {
+    expect(typeof isDebufferTier2).toBe('function');
+});
+
+test('isAfflictor function is available in global scope', () => {
+    expect(typeof isAfflictor).toBe('function');
+});
+
+test('canRefreshTo function is available in global scope', () => {
+    expect(typeof canRefreshTo).toBe('function');
+});
diff --git a/create_tests.sh b/create_tests.sh
index 6df7488e..69aa66ad 100755
--- a/create_tests.sh
+++ b/create_tests.sh
@@ -17,6 +17,7 @@ SOURCE_FILE_NAMES=(
     unit/BattleContext
     unit/UnitContext
     unit/Unit
+    unit/UnitUtility
     unit/UnitManager
     map/BattleMap
     unit/GlobalBattleContext
@@ -71,6 +72,7 @@ TEST_FILE_NAMES=(
     FileSplit
     ScopedTileChanger
     UnitContext
+    UnitUtility
     )
 
 # カテゴリに応じたテストファイル選択
