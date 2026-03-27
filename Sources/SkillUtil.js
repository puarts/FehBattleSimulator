import { LoggerBase } from './Logger.js';
import { Support, Weapon, PassiveB } from './SkillConstants.js';
import { StatusEffectType } from './StatusConstants.js';
import { getStatusEffectName } from './UnitConstants.js';
import { getSkillFunc, isWeaponSpecialRefined, canRallyForciblyByPlayerFuncMap, canRallyForciblyFuncMap, canRalliedForciblyFuncMap } from './Skill.js';
import { NodeEnv, getSkillLogLevel } from './SkillEffectEnv.js';
import { CAN_RALLY_FORCIBLY_HOOKS, CAN_RALLIED_FORCIBLY_HOOKS } from './SkillEffectHooks.js';

function canRallyForciblyByPlayer(unit) {
    return getSkillFunc(unit.support, canRallyForciblyByPlayerFuncMap)?.call(this, unit) ?? false;
}

/**
 * 既に強化済みであるなどにより強化できない味方に対しても強制的に応援を実行できるスキルであるかを判定します。
 */
function canRallyForcibly(skill, unit) {
    let func = getSkillFunc(skill, canRallyForciblyFuncMap);
    if (func?.call(this, unit) ?? false) {
        return true;
    }
    let env = new NodeEnv().setTarget(unit).setSkillOwner(unit).setAssistTargeting(unit)
        // .setName('強制的に応援可能判定').setLogLevel(getSkillLogLevel());
        .setName('強制的に応援可能判定').setLogLevel(LoggerBase.LogLevel.OFF);
    if (CAN_RALLY_FORCIBLY_HOOKS.evaluateSomeWithUnit(unit, env)) {
        return true;
    }
    switch (skill) {
        case Support.GoldSerpent:
            // TODO: 調査する
            return true;
        case Weapon.Heidr:
        case Weapon.GoldenCurse:
            return true;
        case Weapon.RetainersReport:
            if (unit.isWeaponSpecialRefined) {
                return true;
            }
            break;
        case Weapon.EverlivingBreath:
        case PassiveB.AtkFeint3:
        case PassiveB.SpdFeint3:
        case PassiveB.DefFeint3:
        case PassiveB.ResFeint3:
        case PassiveB.AtkSpdRuse3:
        case PassiveB.AtkDefRuse3:
        case PassiveB.AtkResRuse3:
        case PassiveB.DefResRuse3:
        case PassiveB.SpdResRuse3:
        case PassiveB.SpdDefRuse3:
            return true;
        default:
            return false;
    }
}

function canRalliedForcibly(skillId, unit) {
    if (getSkillFunc(skillId, canRalliedForciblyFuncMap)?.call(this, unit) ?? false) {
        return true;
    }
    let env = new NodeEnv().setTarget(unit).setSkillOwner(unit).setAssistTarget(unit)
        .setName('強制的に被応援可能判定').setLogLevel(getSkillLogLevel());
    if (CAN_RALLIED_FORCIBLY_HOOKS.evaluateSomeWithUnit(unit, env)) {
        return true;
    }
    switch (skillId) {
        case Support.GoldSerpent:
            // TODO: 調査する
            return true;
        case Weapon.Heidr:
        case Weapon.GoldenCurse:
            return true;
        case Weapon.RetainersReport:
            if (unit.isWeaponSpecialRefined) {
                return true;
            }
            break;
        case PassiveB.AtkFeint3:
        case PassiveB.SpdFeint3:
        case PassiveB.DefFeint3:
        case PassiveB.ResFeint3:
        case PassiveB.AtkSpdRuse3:
        case PassiveB.AtkDefRuse3:
        case PassiveB.AtkResRuse3:
        case PassiveB.DefResRuse3:
        case PassiveB.SpdResRuse3:
        case PassiveB.SpdDefRuse3:
            return true;
        default:
            return false;
    }
}

function stealBonusEffects(enemies, targetUnit, targetAllies, logger = null) {
    let statusSet = new Set();
    let enemyArray = Array.from(enemies);

    let hasDosage = enemyArray.some(u => u.hasStatusEffect(StatusEffectType.Dosage));
    if (hasDosage) {
        logger?.writeDebugLog(`${targetUnit.nameWithGroup}からの奪取を無効`);
        logger?.writeDebugLog(`${targetUnit.nameWithGroup}の強化を解除`);
        targetUnit.getPositiveStatusEffects().forEach(e => targetUnit.reservedStatusEffectSetToNeutralize.add(e));
        targetUnit.reservedBuffFlagsToNeutralize = [true, true, true, true];
        return;
    }

    enemyArray.forEach(enemy => enemy.getPositiveStatusEffects().forEach(e => {
        logger?.writeDebugLog(`${enemy.nameWithGroup}から${getStatusEffectName(e)}を解除`);
        statusSet.add(e);
    }));
    for (let targetAlly of targetAllies) {
        // ステータス
        for (let statusEffect of statusSet) {
            targetAlly.reserveToAddStatusEffect(statusEffect);
        }
        // 強化
        enemyArray.forEach(enemy => {
            let buffs = enemy.getBuffs(false);
            targetAlly.reserveToApplyBuffs(...buffs);
            if (buffs.some(i => i > 0)) {
                logger?.writeDebugLog(`${enemy.nameWithGroup} → ${targetAlly.nameWithGroup}へ強化${buffs}を付与`);
            }
        });
    }
    // ステータス解除予約
    for (let enemy of enemyArray) {
        // 現在付与されているステータスについて解除予約する（このターン予約分は解除できない）
        enemy.getPositiveStatusEffects().forEach(e => enemy.reservedStatusEffectSetToNeutralize.add(e));
        enemy.reservedBuffFlagsToNeutralize = [true, true, true, true];
    }
}

export { canRallyForciblyByPlayer, canRallyForcibly, canRalliedForcibly, stealBonusEffects };
