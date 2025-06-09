let customPassiveOptions = [];
customPassiveOptions.push({id: NONE_SKILL_ID, text: "なし"});

let statusEffectOptions = [];
statusEffectOptions.push({id: -1, text: 'テスト'});

let statusEffectSet = new Set();

{
    let skillId = getCustomSkillId('accelerates-special-trigger-cooldown-count–1');
    customPassiveOptions.push({id: skillId, text: "奥義が発動しやすい"});
    ACCELERATES_SPECIAL_TRIGGER_SET.add(skillId);
    statusEffectSet.add(skillId);
}
{
    let skillId = getCustomSkillId('at-player-or-enemy-phase-grants-atk-6');
    customPassiveOptions.push({id: skillId, text: "自敵開始時2マス攻+6"});
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_STATS_BONUS_ON_MAP_TO_TARGET_AND_TARGET_ALLIES_WITHIN_N_SPACES_NODE(
            2,
            ATK_NODE(6),
        ),
    ));
}
{
    let skillId = getCustomSkillId('at-player-or-enemy-phase-grants-spd-6');
    customPassiveOptions.push({id: skillId, text: "自敵開始時2マス速+6"});
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_STATS_BONUS_ON_MAP_TO_TARGET_AND_TARGET_ALLIES_WITHIN_N_SPACES_NODE(
            2,
            SPD_NODE(6),
        ),
    ));
}
{
    let skillId = getCustomSkillId('at-player-or-enemy-phase-grants-def-6');
    customPassiveOptions.push({id: skillId, text: "自敵開始時2マス守+6"});
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_STATS_BONUS_ON_MAP_TO_TARGET_AND_TARGET_ALLIES_WITHIN_N_SPACES_NODE(
            2,
            DEF_NODE(6),
        ),
    ));
}
{
    let skillId = getCustomSkillId('at-player-or-enemy-phase-grants-res-6');
    customPassiveOptions.push({id: skillId, text: "自敵開始時2マス魔+6"});
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_STATS_BONUS_ON_MAP_TO_TARGET_AND_TARGET_ALLIES_WITHIN_N_SPACES_NODE(
            2,
            RES_NODE(6),
        ),
    ));
}
{
    let skillId = getCustomSkillId('at-player-or-enemy-phase-grants-imbue');
    customPassiveOptions.push({id: skillId, text: "自敵開始時2マス治癒"});
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_STATUS_EFFECTS_ON_MAP_TO_TARGET_AND_TARGET_ALLIES_WITHIN_2_SPACES_NODE(
            StatusEffectType.Imbue,
        ),
    ));
}
{
    let skillId = getCustomSkillId('at-player-or-enemy-phase-grants-reflex');
    customPassiveOptions.push({id: skillId, text: "自敵開始時2マス反射"});
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_STATUS_EFFECTS_ON_MAP_TO_TARGET_AND_TARGET_ALLIES_WITHIN_2_SPACES_NODE(
            StatusEffectType.Reflex,
        ),
    ));
}
{
    let skillId = getCustomSkillId('effective-against-armored');
    customPassiveOptions.push({id: skillId, text: "重装特効"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        EFFECTIVE_AGAINST_NODE(EffectiveType.Armor),
    ));
}
{
    let skillId = getCustomSkillId('grants-all-stats-99');
    customPassiveOptions.push({id: skillId, text: "全ステ+99"});
    AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(99),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(99),
    ));
}
customPassiveOptions.push({id: 'one', text: "イチ"});
customPassiveOptions.push({id: 'two', text: "ニ"});

function registerFunc(funcId, obj) {
    let skillId = funcId + obj;
    // 必要なobjが揃っていたら
    AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(obj.positive_num),
    ));
}
