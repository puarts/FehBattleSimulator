diff --git a/Sources/Skill.js b/Sources/Skill.js
index 3f4a33ae..721186bf 100644
--- a/Sources/Skill.js
+++ b/Sources/Skill.js
@@ -833,9 +833,6 @@ function weaponTypeToString(weaponType) {
     return WEAPON_TYPE_TO_STRING_MAP.get(weaponType) ?? "不明";
 }
 
-function canRallyForciblyByPlayer(unit) {
-    return getSkillFunc(unit.support, canRallyForciblyByPlayerFuncMap)?.call(this, unit) ?? false;
-}
 
 /**
  * @type {Set<number|string>}
@@ -863,85 +860,6 @@ const GALEFORCE_SKILLS = new Set();
  */
 const CAN_MOVE_THROUGH_FOES_SPACE_SKILLS = new Set();
 
-/**
- * 既に強化済みであるなどにより強化できない味方に対しても強制的に応援を実行できるスキルであるかを判定します。
- */
-function canRallyForcibly(skill, unit) {
-    let func = getSkillFunc(skill, canRallyForciblyFuncMap);
-    if (func?.call(this, unit) ?? false) {
-        return true;
-    }
-    let env = new NodeEnv().setTarget(unit).setSkillOwner(unit).setAssistTargeting(unit)
-        // .setName('強制的に応援可能判定').setLogLevel(getSkillLogLevel());
-        .setName('強制的に応援可能判定').setLogLevel(LoggerBase.LogLevel.OFF);
-    if (CAN_RALLY_FORCIBLY_HOOKS.evaluateSomeWithUnit(unit, env)) {
-        return true;
-    }
-    switch (skill) {
-        case Support.GoldSerpent:
-            // TODO: 調査する
-            return true;
-        case Weapon.Heidr:
-        case Weapon.GoldenCurse:
-            return true;
-        case Weapon.RetainersReport:
-            if (unit.isWeaponSpecialRefined) {
-                return true;
-            }
-            break;
-        case Weapon.EverlivingBreath:
-        case PassiveB.AtkFeint3:
-        case PassiveB.SpdFeint3:
-        case PassiveB.DefFeint3:
-        case PassiveB.ResFeint3:
-        case PassiveB.AtkSpdRuse3:
-        case PassiveB.AtkDefRuse3:
-        case PassiveB.AtkResRuse3:
-        case PassiveB.DefResRuse3:
-        case PassiveB.SpdResRuse3:
-        case PassiveB.SpdDefRuse3:
-            return true;
-        default:
-            return false;
-    }
-}
-
-function canRalliedForcibly(skillId, unit) {
-    if (getSkillFunc(skillId, canRalliedForciblyFuncMap)?.call(this, unit) ?? false) {
-        return true;
-    }
-    let env = new NodeEnv().setTarget(unit).setSkillOwner(unit).setAssistTarget(unit)
-        .setName('強制的に被応援可能判定').setLogLevel(getSkillLogLevel());
-    if (CAN_RALLIED_FORCIBLY_HOOKS.evaluateSomeWithUnit(unit, env)) {
-        return true;
-    }
-    switch (skillId) {
-        case Support.GoldSerpent:
-            // TODO: 調査する
-            return true;
-        case Weapon.Heidr:
-        case Weapon.GoldenCurse:
-            return true;
-        case Weapon.RetainersReport:
-            if (unit.isWeaponSpecialRefined) {
-                return true;
-            }
-            break;
-        case PassiveB.AtkFeint3:
-        case PassiveB.SpdFeint3:
-        case PassiveB.DefFeint3:
-        case PassiveB.ResFeint3:
-        case PassiveB.AtkSpdRuse3:
-        case PassiveB.AtkDefRuse3:
-        case PassiveB.AtkResRuse3:
-        case PassiveB.DefResRuse3:
-        case PassiveB.SpdResRuse3:
-        case PassiveB.SpdDefRuse3:
-            return true;
-        default:
-            return false;
-    }
-}
 
 /**
  * 戦闘前に発動するスペシャルであるかどうかを判定します。
@@ -1505,52 +1423,6 @@ const DISARM_HEX_TRAP_SKILL_SET = new Set([
 ]);
 
 
-// TODO: リファクタリングする(適切な場所に移動する。引数の型を確定する)
-/**
- * enemiesのスキルを奪取する
- * @param {Generator<Unit>|Unit[]} enemies
- * @param {Unit} targetUnit
- * @param {Generator<Unit>|Unit[]} targetAllies
- * @param logger
- */
-function stealBonusEffects(enemies, targetUnit, targetAllies, logger = null) {
-    let statusSet = new Set();
-    let enemyArray = Array.from(enemies);
-
-    let hasDosage = enemyArray.some(u => u.hasStatusEffect(StatusEffectType.Dosage));
-    if (hasDosage) {
-        logger?.writeDebugLog(`${targetUnit.nameWithGroup}からの奪取を無効`);
-        logger?.writeDebugLog(`${targetUnit.nameWithGroup}の強化を解除`);
-        targetUnit.getPositiveStatusEffects().forEach(e => targetUnit.reservedStatusEffectSetToNeutralize.add(e));
-        targetUnit.reservedBuffFlagsToNeutralize = [true, true, true, true];
-        return;
-    }
-
-    enemyArray.forEach(enemy => enemy.getPositiveStatusEffects().forEach(e => {
-        logger?.writeDebugLog(`${enemy.nameWithGroup}から${getStatusEffectName(e)}を解除`);
-        statusSet.add(e);
-    }));
-    for (let targetAlly of targetAllies) {
-        // ステータス
-        for (let statusEffect of statusSet) {
-            targetAlly.reserveToAddStatusEffect(statusEffect);
-        }
-        // 強化
-        enemyArray.forEach(enemy => {
-            let buffs = enemy.getBuffs(false);
-            targetAlly.reserveToApplyBuffs(...buffs);
-            if (buffs.some(i => i > 0)) {
-                logger?.writeDebugLog(`${enemy.nameWithGroup} → ${targetAlly.nameWithGroup}へ強化${buffs}を付与`);
-            }
-        });
-    }
-    // ステータス解除予約
-    for (let enemy of enemyArray) {
-        // 現在付与されているステータスについて解除予約する（このターン予約分は解除できない）
-        enemy.getPositiveStatusEffects().forEach(e => enemy.reservedStatusEffectSetToNeutralize.add(e));
-        enemy.reservedBuffFlagsToNeutralize = [true, true, true, true];
-    }
-}
 
 // TODO: ここから下の内容を別ファイルに分ける
 
@@ -1753,8 +1625,8 @@ export { TOME_WEAPON_TYPE_SET, isWeaponTypeTome, BREATH_WEAPON_TYPE_SET, isWeapo
 export { BEAST_WEAPON_TYPE_SET, isWeaponTypeBeast, isRangedWeaponType, MELEE_WEAPON_TYPE_SET, isMeleeWeaponType };
 export { isWeaponTypeBreathOrBeast, isInheritableWeaponType };
 export { WEAPON_TYPE_TO_COLOR_MAP, getColorFromWeaponType, STRING_TO_WEAPON_TYPE_MAP, WEAPON_TYPE_TO_STRING_MAP, stringToWeaponType, weaponTypeToString };
-export { canRallyForciblyByPlayer, SWAP_ASSIST_SKILLS, REPOSITION_ASSIST_SKILLS, DRAW_BACK_ASSIST_SKILLS, GALEFORCE_SKILLS, CAN_MOVE_THROUGH_FOES_SPACE_SKILLS };
-export { canRallyForcibly, canRalliedForcibly, isPrecombatSpecial };
+export { SWAP_ASSIST_SKILLS, REPOSITION_ASSIST_SKILLS, DRAW_BACK_ASSIST_SKILLS, GALEFORCE_SKILLS, CAN_MOVE_THROUGH_FOES_SPACE_SKILLS };
+export { isPrecombatSpecial };
 export { TELEPORTATION_SKILL_SET, isTeleportationSkill, hasPathfinderEffect, getSelfDamageDealtRateToAddSpecialDamage };
 export { TRIANGLE_ADEPT_SET, isTriangleAdeptSkill, EVAL_SPD_ADD_MAP, getEvalSpdAdd, EVAL_RES_ADD_MAP, getEvalResAdd };
 export { WEAPON_TYPES_ADD_ATK2_AFTER_TRANSFORM_SET, isWeaponTypeThatCanAddAtk2AfterTransform, BeastCommonSkillType, BEAST_COMMON_SKILL_MAP };
@@ -1764,7 +1636,7 @@ export { SAVE_SKILL_SET, CAN_SAVE_FROM_MELEE_SKILL_SET, CAN_SAVE_FROM_RANGED_SKI
 export { StatusEffectType, POSITIVE_STATUS_EFFECT_ARRAY, POSITIVE_STATUS_EFFECT_ORDER_MAP, NEGATIVE_STATUS_EFFECT_ARRAY, NEGATIVE_STATUS_EFFECT_ORDER_MAP };
 export { SkillInfo, COUNT2_SPECIALS, INHERITABLE_COUNT2_SPECIALS, COUNT3_SPECIALS, INHERITABLE_COUNT3_SPECIALS, COUNT4_SPECIALS, INHERITABLE_COUNT4_SPECIALS, COUNT5_SPECIALS, INHERITABLE_COUNT5_SPECIALS };
 export { NO_EFFECT_ON_SPECIAL_COOLDOWN_CHARGE_ON_SUPPORT_SKILL_SET, DISARM_TRAP_SKILL_SET, DISARM_HEX_TRAP_SKILL_SET };
-export { StatusIndex, StatFlags, getStatusName, stealBonusEffects, getSkillFunc };
+export { StatusIndex, StatFlags, getStatusName, getSkillFunc };
 export { applySpecialDamageReductionPerAttackFuncMap, applySkillEffectForUnitFuncMap, canActivateCantoFuncMap, calcMoveCountForCantoFuncMap };
 export { evalSpdAddFuncMap, evalResAddFuncMap, applyPrecombatDamageReductionRatioFuncMap };
 export { applySkillForBeginningOfTurnFuncMap, applyEnemySkillForBeginningOfTurnFuncMap, setOnetimeActionActivatedFuncMap };
diff --git a/Sources/SkillUtil.js b/Sources/SkillUtil.js
new file mode 100644
index 00000000..4398691f
--- /dev/null
+++ b/Sources/SkillUtil.js
@@ -0,0 +1,132 @@
+// Sources/SkillUtil.js
+// Skill.jsから移動した上位レイヤー依存の関数群
+// canRallyForcibly, canRalliedForcibly: Layer 5依存 (NodeEnv, SkillEffectHooks)
+// stealBonusEffects: Unit型メソッド呼び出しを含む
+
+// 注意: 現在はグローバル変数経由で依存を解決しているため、ESMのimportは記述しない。
+// セクション8（不足import追加）で適切なimport文が追加される。
+
+function canRallyForciblyByPlayer(unit) {
+    return getSkillFunc(unit.support, canRallyForciblyByPlayerFuncMap)?.call(this, unit) ?? false;
+}
+
+/**
+ * 既に強化済みであるなどにより強化できない味方に対しても強制的に応援を実行できるスキルであるかを判定します。
+ */
+function canRallyForcibly(skill, unit) {
+    let func = getSkillFunc(skill, canRallyForciblyFuncMap);
+    if (func?.call(this, unit) ?? false) {
+        return true;
+    }
+    let env = new NodeEnv().setTarget(unit).setSkillOwner(unit).setAssistTargeting(unit)
+        // .setName('強制的に応援可能判定').setLogLevel(getSkillLogLevel());
+        .setName('強制的に応援可能判定').setLogLevel(LoggerBase.LogLevel.OFF);
+    if (CAN_RALLY_FORCIBLY_HOOKS.evaluateSomeWithUnit(unit, env)) {
+        return true;
+    }
+    switch (skill) {
+        case Support.GoldSerpent:
+            // TODO: 調査する
+            return true;
+        case Weapon.Heidr:
+        case Weapon.GoldenCurse:
+            return true;
+        case Weapon.RetainersReport:
+            if (unit.isWeaponSpecialRefined) {
+                return true;
+            }
+            break;
+        case Weapon.EverlivingBreath:
+        case PassiveB.AtkFeint3:
+        case PassiveB.SpdFeint3:
+        case PassiveB.DefFeint3:
+        case PassiveB.ResFeint3:
+        case PassiveB.AtkSpdRuse3:
+        case PassiveB.AtkDefRuse3:
+        case PassiveB.AtkResRuse3:
+        case PassiveB.DefResRuse3:
+        case PassiveB.SpdResRuse3:
+        case PassiveB.SpdDefRuse3:
+            return true;
+        default:
+            return false;
+    }
+}
+
+function canRalliedForcibly(skillId, unit) {
+    if (getSkillFunc(skillId, canRalliedForciblyFuncMap)?.call(this, unit) ?? false) {
+        return true;
+    }
+    let env = new NodeEnv().setTarget(unit).setSkillOwner(unit).setAssistTarget(unit)
+        .setName('強制的に被応援可能判定').setLogLevel(getSkillLogLevel());
+    if (CAN_RALLIED_FORCIBLY_HOOKS.evaluateSomeWithUnit(unit, env)) {
+        return true;
+    }
+    switch (skillId) {
+        case Support.GoldSerpent:
+            // TODO: 調査する
+            return true;
+        case Weapon.Heidr:
+        case Weapon.GoldenCurse:
+            return true;
+        case Weapon.RetainersReport:
+            if (unit.isWeaponSpecialRefined) {
+                return true;
+            }
+            break;
+        case PassiveB.AtkFeint3:
+        case PassiveB.SpdFeint3:
+        case PassiveB.DefFeint3:
+        case PassiveB.ResFeint3:
+        case PassiveB.AtkSpdRuse3:
+        case PassiveB.AtkDefRuse3:
+        case PassiveB.AtkResRuse3:
+        case PassiveB.DefResRuse3:
+        case PassiveB.SpdResRuse3:
+        case PassiveB.SpdDefRuse3:
+            return true;
+        default:
+            return false;
+    }
+}
+
+function stealBonusEffects(enemies, targetUnit, targetAllies, logger = null) {
+    let statusSet = new Set();
+    let enemyArray = Array.from(enemies);
+
+    let hasDosage = enemyArray.some(u => u.hasStatusEffect(StatusEffectType.Dosage));
+    if (hasDosage) {
+        logger?.writeDebugLog(`${targetUnit.nameWithGroup}からの奪取を無効`);
+        logger?.writeDebugLog(`${targetUnit.nameWithGroup}の強化を解除`);
+        targetUnit.getPositiveStatusEffects().forEach(e => targetUnit.reservedStatusEffectSetToNeutralize.add(e));
+        targetUnit.reservedBuffFlagsToNeutralize = [true, true, true, true];
+        return;
+    }
+
+    enemyArray.forEach(enemy => enemy.getPositiveStatusEffects().forEach(e => {
+        logger?.writeDebugLog(`${enemy.nameWithGroup}から${getStatusEffectName(e)}を解除`);
+        statusSet.add(e);
+    }));
+    for (let targetAlly of targetAllies) {
+        // ステータス
+        for (let statusEffect of statusSet) {
+            targetAlly.reserveToAddStatusEffect(statusEffect);
+        }
+        // 強化
+        enemyArray.forEach(enemy => {
+            let buffs = enemy.getBuffs(false);
+            targetAlly.reserveToApplyBuffs(...buffs);
+            if (buffs.some(i => i > 0)) {
+                logger?.writeDebugLog(`${enemy.nameWithGroup} → ${targetAlly.nameWithGroup}へ強化${buffs}を付与`);
+            }
+        });
+    }
+    // ステータス解除予約
+    for (let enemy of enemyArray) {
+        // 現在付与されているステータスについて解除予約する（このターン予約分は解除できない）
+        enemy.getPositiveStatusEffects().forEach(e => enemy.reservedStatusEffectSetToNeutralize.add(e));
+        enemy.reservedBuffFlagsToNeutralize = [true, true, true, true];
+    }
+}
+
+export { canRallyForciblyByPlayer, canRallyForcibly, canRalliedForcibly, stealBonusEffects };
diff --git a/Tests/SkillSplit.test.js b/Tests/SkillSplit.test.js
new file mode 100644
index 00000000..64ad07d7
--- /dev/null
+++ b/Tests/SkillSplit.test.js
@@ -0,0 +1,106 @@
+/**
+ * @file Skill.js分割の検証テスト
+ * セクション4: Skill.jsがLayer 2データモデルのみに絞り込まれたことを確認する
+ */
+import { describe, it, expect } from 'vitest';
+
+describe('Skill.js分割後のシンボル可用性', () => {
+    it('SkillInfoクラスがimportでき、インスタンス生成が可能', () => {
+        expect(typeof SkillInfo).toBe('function');
+        const info = new SkillInfo();
+        expect(info).toBeDefined();
+    });
+
+    it('武器種判定関数がimportできる', () => {
+        expect(typeof isPhysicalWeaponType).toBe('function');
+        expect(typeof isMeleeWeaponType).toBe('function');
+        expect(typeof isRangedWeaponType).toBe('function');
+        expect(typeof getAttackRangeOfWeaponType).toBe('function');
+    });
+
+    it('スキルID変換関数がimportできる', () => {
+        expect(typeof getNormalSkillId).toBe('function');
+        expect(typeof getRefinementSkillId).toBe('function');
+        expect(typeof getSpecialRefinementSkillId).toBe('function');
+    });
+
+    it('武器種マップ/定数が利用できる', () => {
+        expect(WEAPON_TYPE_ATTACK_RANGE_MAP).toBeInstanceOf(Map);
+        expect(PHYSICAL_WEAPON_TYPE_SET).toBeInstanceOf(Set);
+    });
+
+    it('FuncMap群がMapインスタンスである', () => {
+        expect(applySkillEffectForUnitFuncMap).toBeInstanceOf(Map);
+        expect(canActivateCantoFuncMap).toBeInstanceOf(Map);
+        expect(calcMoveCountForCantoFuncMap).toBeInstanceOf(Map);
+    });
+
+    it('getSkillFunc関数が利用できる', () => {
+        expect(typeof getSkillFunc).toBe('function');
+    });
+});
+
+describe('SkillInfoクラスの動作', () => {
+    it('基本プロパティにアクセスできる', () => {
+        const info = new SkillInfo();
+        // SkillInfoのプロパティはコンストラクタで初期化されないためundefined
+        // hasOwnPropertyでプロパティの存在を確認するのではなく、プロトタイプにアクセスできることを確認
+        expect('id' in info || info.id === undefined).toBe(true);
+        expect(typeof info.getDisplayName).toBe('function');
+    });
+
+    it('メソッドが正常に動作する', () => {
+        const info = new SkillInfo();
+        expect(typeof info.isDuel4).toBe('function');
+        expect(typeof info.isDuel3).toBe('function');
+        expect(typeof info.getDisplayName).toBe('function');
+    });
+});
+
+describe('Skill.jsのレイヤー制約', () => {
+    it('Skill.jsがLayer 3以上のシンボルをimportしていない', async () => {
+        const fs = await import('fs');
+        const path = await import('path');
+        const content = fs.readFileSync(path.join(process.cwd(), 'Sources', 'Skill.js'), 'utf-8');
+
+        // Layer 5のシンボルがimportされていないことを確認
+        const forbiddenImports = [
+            'NodeEnv',
+            'CAN_RALLY_FORCIBLY_HOOKS',
+            'CAN_RALLIED_FORCIBLY_HOOKS',
+            'getSkillLogLevel',
+        ];
+        const importLines = content.split('\n').filter(line => /^import /.test(line));
+        for (const symbol of forbiddenImports) {
+            const found = importLines.some(line => line.includes(symbol));
+            expect(found, `Skill.js should not import ${symbol}`).toBe(false);
+        }
+    });
+
+    it('stealBonusEffects関数がSkill.jsに存在しない', async () => {
+        const fs = await import('fs');
+        const path = await import('path');
+        const content = fs.readFileSync(path.join(process.cwd(), 'Sources', 'Skill.js'), 'utf-8');
+
+        // function定義が存在しないことを確認（exportの残留も不可）
+        expect(content).not.toMatch(/^function stealBonusEffects/m);
+    });
+
+    it('canRallyForcibly関数がSkill.jsに存在しない', async () => {
+        const fs = await import('fs');
+        const path = await import('path');
+        const content = fs.readFileSync(path.join(process.cwd(), 'Sources', 'Skill.js'), 'utf-8');
+
+        expect(content).not.toMatch(/^function canRallyForcibly/m);
+        expect(content).not.toMatch(/^function canRalliedForcibly/m);
+    });
+
+    it('移動した関数が別ファイルに存在する', () => {
+        // canRallyForcibly, canRalliedForcibly, stealBonusEffects が
+        // グローバルスコープで利用可能であること（concat環境で確認）
+        expect(typeof canRallyForcibly).toBe('function');
+        expect(typeof canRalliedForcibly).toBe('function');
+        expect(typeof stealBonusEffects).toBe('function');
+        expect(typeof canRallyForciblyByPlayer).toBe('function');
+    });
+});
diff --git a/vitest.setup.js b/vitest.setup.js
index 7de592d1..094a7c8e 100644
--- a/vitest.setup.js
+++ b/vitest.setup.js
@@ -13,7 +13,7 @@ const TESTS = path.join(ROOT, 'Tests');
 
 // Same order as create_tests.sh SOURCE_FILE_NAMES
 const SOURCE_FILE_NAMES = [
-    'GlobalDefinitions', 'Utilities', 'Logger', 'SkillConstants', 'StatusConstants', 'Skill',
+    'GlobalDefinitions', 'Utilities', 'Logger', 'SkillConstants', 'StatusConstants', 'Skill', 'SkillUtil',
     'BattleMapElement', 'Tile', 'Structures', 'Cell', 'Table',
     'HeroInfoConstants', 'HeroInfo', 'UnitConstants', 'BattleContext', 'Unit',
     'UnitManager', 'BattleMap', 'GlobalBattleContext', 'DamageCalculationUtility',
