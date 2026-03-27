/* global Support, Weapon, PassiveB, PassiveC, WeaponRefinementType, MoveType, NodeEnv, LoggerBase, getSkillFunc, calcHealAmountFuncMap, isAfflictorFuncMap, getAtkBuffAmount, getSpdBuffAmount, getDefBuffAmount, getResBuffAmount, getSkillLogLevel, isWeaponTypeTome, CALC_HEAL_AMOUNT_HOOKS, IS_DEBUFFER_TIER_1_HOOKS, IS_DEBUFFER_TIER_2_HOOKS, IS_AFFLICTOR_HOOKS */

class UnitUtil {
    static withCache(units, fn) {
        for (const u of units) {
            u.cacheCounter++;
            u.usesCache = true;
            u.cachedSkills = null;
        }

        try {
            return fn();
        } finally {
            for (const u of units) {
                u.cacheCounter--;
                if (u.cacheCounter === 0) {
                    u.usesCache = false;
                    u.cachedSkills = null;
                }
            }
        }
    }
}

function calcBuffAmount(assistUnit, targetUnit) {
    let totalBuffAmount = 0;
    switch (assistUnit.support) {
        case Support.HarshCommand: {
            if (!targetUnit.isPanicEnabled) {
                totalBuffAmount += targetUnit.atkDebuff;
                totalBuffAmount += targetUnit.spdDebuff;
                totalBuffAmount += targetUnit.defDebuff;
                totalBuffAmount += targetUnit.resDebuff;
            }
        }
            break;
        case Support.HarshCommandPlus: {
            totalBuffAmount += targetUnit.atkDebuff;
            totalBuffAmount += targetUnit.spdDebuff;
            totalBuffAmount += targetUnit.defDebuff;
            totalBuffAmount += targetUnit.resDebuff;
        }
            break;
        default: {
            let buffAmount = getAtkBuffAmount(assistUnit.support) - targetUnit.atkBuff;
            if (buffAmount > 0) {
                totalBuffAmount += buffAmount;
            }
            buffAmount = getSpdBuffAmount(assistUnit.support) - targetUnit.spdBuff;
            if (buffAmount > 0) {
                totalBuffAmount += buffAmount;
            }
            buffAmount = getDefBuffAmount(assistUnit.support) - targetUnit.defBuff;
            if (buffAmount > 0) {
                totalBuffAmount += buffAmount;
            }
            buffAmount = getResBuffAmount(assistUnit.support) - targetUnit.resBuff;
            if (buffAmount > 0) {
                totalBuffAmount += buffAmount;
            }
        }
            break;
    }
    return totalBuffAmount;
}

/**
 * @brief 回復補助の回復量を取得します。
 * @param {Unit} assistUnit 補助者のユニット
 * @param {Unit} targetUnit 補助対象のユニット
 * TODO: マジックシールドについて調査する
 */
function calcHealAmount(assistUnit, targetUnit) {
    let healAmount = 0;
    let skillId = assistUnit.support;
    healAmount += getSkillFunc(skillId, calcHealAmountFuncMap)?.call(this, assistUnit, targetUnit) ?? 0;

    let env = new NodeEnv().setAssistUnits(assistUnit, targetUnit);
    env.setName('補助での回復時').setLogLevel(getSkillLogLevel());
    healAmount += CALC_HEAL_AMOUNT_HOOKS.evaluateSumWithUnit(assistUnit, env);

    switch (skillId) {
        case Support.Heal:
            healAmount = 5;
            break;
        case Support.Reconcile:
            healAmount = 7;
            break;
        case Support.Physic:
            healAmount = 8;
            break;
        case Support.Mend:
            healAmount = 10;
            break;
        case Support.Recover:
            healAmount = 15;
            break;
        case Support.Martyr:
            healAmount = assistUnit.currentDamage + 7;
            break;
        case Support.MartyrPlus:
            healAmount = assistUnit.currentDamage + Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
            if (healAmount < 7) {
                healAmount += 7;
            }
            break;
        case Support.Rehabilitate: {
            let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
            if (targetUnit.hp <= halfHp) {
                healAmount += (halfHp - targetUnit.hp) * 2;
            }
            healAmount += 7;
        }
            break;
        case Support.RehabilitatePlus: {
            healAmount += Math.floor(assistUnit.getAtkInPrecombat() * 0.5) - 10;
            if (healAmount < 7) {
                healAmount = 7;
            }

            let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
            if (targetUnit.hp <= halfHp) {
                healAmount += (halfHp - targetUnit.hp) * 2;
            }
            healAmount += 7;
        }
            break;
        case Support.PhysicPlus:
        case Support.RestorePlus:
        case Support.RescuePlus:
        case Support.ReturnPlus:
        case Support.NudgePlus:
            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
            if (healAmount < 8) {
                healAmount = 8;
            }
            break;
        case Support.Restore:
        case Support.Rescue:
        case Support.Return:
        case Support.Nudge:
            healAmount = 8;
            break;
        case Support.RecoverPlus:
            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5) + 10;
            if (healAmount < 15) {
                healAmount = 15;
            }
            break;
    }
    if (targetUnit.currentDamage < healAmount) {
        return targetUnit.currentDamage;
    }
    return healAmount;
}

/// Tier 1 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
// noinspection JSUnusedLocalSymbols
function isDebufferTier1(attackUnit, targetUnit) {
    let env = new NodeEnv().setUnitsDuringCombat(attackUnit, targetUnit, true)
        .setSkillOwner(attackUnit)
        .setName('Tier1のデバッファー判定').setLogLevel(LoggerBase.LogLevel.OFF);
    if (IS_DEBUFFER_TIER_1_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
        return true;
    }
    return attackUnit.weapon === Weapon.Hlidskjalf;
}

/// Tier 2 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
function isDebufferTier2(attackUnit, targetUnit) {
    let env = new NodeEnv().setUnitsDuringCombat(attackUnit, targetUnit, true)
        .setSkillOwner(attackUnit)
        .setName('Tier2のデバッファー判定').setLogLevel(LoggerBase.LogLevel.OFF);
    if (IS_DEBUFFER_TIER_2_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
        return true;
    }
    for (let skillId of attackUnit.enumerateSkills()) {
        switch (skillId) {
            case Weapon.RogueDagger:
            case Weapon.RogueDaggerPlus:
                if (attackUnit.weaponRefinement === WeaponRefinementType.None) {
                    return true;
                }
                break;
            case Weapon.PoisonDagger:
            case Weapon.PoisonDaggerPlus:
                if (targetUnit.moveType === MoveType.Infantry) {
                    return true;
                }
                break;
            case Weapon.KittyPaddle:
            case Weapon.KittyPaddlePlus:
                if (isWeaponTypeTome(targetUnit.weapon)) {
                    return true;
                }
                break;
            case PassiveB.SealDef3:
            case PassiveB.SealRes3:
            case PassiveB.SealAtkDef2:
            case PassiveB.SealAtkRes2:
            case PassiveB.SealDefRes2:
            case PassiveB.SealSpdDef2:
                return true;
        }
    }
    return false;
}

/**
 * ユニットがアフリクターであるかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartH
 * @param  {Unit} attackUnit
 * @param  {boolean} lossesInCombat
 * @param result
 * @return {boolean}
 */
function isAfflictor(attackUnit, lossesInCombat, result) {
    // TODO: envにlossesInCombat, resultを取れるようにする
    let env = new NodeEnv().setTarget(attackUnit).setUnitsDuringCombat(attackUnit, null, true)
        .setSkillOwner(attackUnit)
        .setName('アフリクター判定').setLogLevel(LoggerBase.LogLevel.OFF);
    if (IS_AFFLICTOR_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
        return true;
    }
    for (let skillId of attackUnit.enumerateSkills()) {
        let func = getSkillFunc(skillId, isAfflictorFuncMap);
        if (func?.call(this, attackUnit, lossesInCombat, result) ?? false) {
            return true;
        }
        switch (skillId) {
            case Weapon.DuskDawnStaff:
                return true;
            case Weapon.TigerSpirit:
                if (attackUnit.battleContext.restHpPercentage >= 25) {
                    return true;
                }
                break;
            case Weapon.FlamelickBreath:
            case Weapon.FrostbiteBreath:
                if (attackUnit.battleContext.restHpPercentage >= 25) {
                    return true;
                }
                break;
            case Weapon.Pain:
            case Weapon.PainPlus:
            case Weapon.Panic:
            case Weapon.PanicPlus:
            case Weapon.FlashPlus:
            case Weapon.Candlelight:
            case Weapon.CandlelightPlus:
            case Weapon.DotingStaff:
            case Weapon.MerankoryPlus:
            case Weapon.CandyStaff:
            case Weapon.CandyStaffPlus:
            case Weapon.LegionsAxe:
            case Weapon.LegionsAxePlus:
            case Weapon.SneeringAxe:
            case Weapon.DeathlyDagger:
            case Weapon.SnipersBow:
            case Weapon.DokuNoKen:
                return true;
            case Weapon.MonstrousBowPlus:
            case Weapon.GhostNoMadosyoPlus:
            case Weapon.Scadi:
            case Weapon.ObsessiveCurse:
                if (attackUnit.isWeaponRefined) {
                    return true;
                }
                break;
            case PassiveC.PanicSmoke3:
            case PassiveC.PanicSmoke4:
            case PassiveC.FatalSmoke3:
            case PassiveC.DefResSmoke3:
                return !lossesInCombat;
            case PassiveB.PoisonStrike3:
                return !lossesInCombat;
        }
    }
    return false;
}

function canRefreshTo(targetUnit) {
    return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
}
